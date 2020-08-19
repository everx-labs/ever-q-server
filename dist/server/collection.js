"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QCollection = exports.RequestController = exports.RequestEvent = void 0;

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _dataListener = require("./data-listener");

var _auth = require("./auth");

var _config = require("./config");

var _dbTypes = require("./db-types");

var _logs = _interopRequireDefault(require("./logs"));

var _slowDetector = require("./slow-detector");

var _tracer = require("./tracer");

var _utils = require("./utils");

var _events = _interopRequireDefault(require("events"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
* Copyright 2018-2020 TON DEV SOLUTIONS LTD.
*
* Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
* this file except in compliance with the License.  You may obtain a copy of the
* License at:
*
* http://www.ton.dev/licenses
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific TON DEV software governing permissions and
* limitations under the License.
*/
const INFO_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

const RequestEvent = {
  CLOSE: 'close',
  FINISH: 'finish'
};
exports.RequestEvent = RequestEvent;

class RequestController {
  constructor() {
    this.events = new _events.default();
  }

  emitClose() {
    this.events.emit(RequestEvent.CLOSE);
  }

  finish() {
    this.events.emit(RequestEvent.FINISH);
    this.events.removeAllListeners();
  }

}

exports.RequestController = RequestController;

function checkUsedAccessKey(usedAccessKey, accessKey, context) {
  if (!accessKey) {
    return usedAccessKey;
  }

  if (usedAccessKey && accessKey !== usedAccessKey) {
    context.multipleAccessKeysDetected = true;
    throw _utils.QError.multipleAccessKeys();
  }

  return accessKey;
}

async function requireGrantedAccess(context, args) {
  const accessKey = context.accessKey || args.accessKey;
  context.usedAccessKey = checkUsedAccessKey(context.usedAccessKey, accessKey, context);
  return context.auth.requireGrantedAccess(accessKey);
}

function mamAccessRequired(context, args) {
  const accessKey = args.accessKey;
  context.usedMamAccessKey = checkUsedAccessKey(context.usedMamAccessKey, accessKey, context);

  if (!accessKey || !context.config.mamAccessKeys.has(accessKey)) {
    throw _auth.Auth.unauthorizedError();
  }
}

const accessGranted = {
  granted: true,
  restrictToAccounts: []
};

class QCollection {
  constructor(name, docType, logs, auth, tracer, stats, db, slowDb, isTests) {
    this.name = name;
    this.docType = docType;
    this.info = _config.BLOCKCHAIN_DB.collections[name];
    this.infoRefreshTime = Date.now();
    this.log = logs.create(name);
    this.auth = auth;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.isTests = isTests;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
    this.statDoc = new _tracer.StatsCounter(stats, _config.STATS.doc.count, [`collection:${name}`]);
    this.statQuery = new _tracer.StatsCounter(stats, _config.STATS.query.count, [`collection:${name}`]);
    this.statQueryTime = new _tracer.StatsTiming(stats, _config.STATS.query.time, [`collection:${name}`]);
    this.statQueryActive = new _tracer.StatsGauge(stats, _config.STATS.query.active, [`collection:${name}`]);
    this.statQueryFailed = new _tracer.StatsCounter(stats, _config.STATS.query.failed, [`collection:${name}`]);
    this.statQuerySlow = new _tracer.StatsCounter(stats, _config.STATS.query.slow, [`collection:${name}`]);
    this.statWaitForActive = new _tracer.StatsGauge(stats, _config.STATS.waitFor.active, [`collection:${name}`]);
    this.statSubscriptionActive = new _tracer.StatsGauge(stats, _config.STATS.subscription.active, [`collection:${name}`]);
    this.docInsertOrUpdate = new _events.default();
    this.docInsertOrUpdate.setMaxListeners(0);
    this.queryStats = new Map();
    this.maxQueueSize = 0;
  }

  dropCachedDbInfo() {
    this.infoRefreshTime = Date.now();
  } // Subscriptions


  onDocumentInsertOrUpdate(doc) {
    this.statDoc.increment();
    this.docInsertOrUpdate.emit('doc', doc);
    const isExternalInboundFinalizedMessage = this.name === 'messages' && doc._key && doc.msg_type === 1 && doc.status === 5;

    if (isExternalInboundFinalizedMessage) {
      const span = this.tracer.startSpan('messageDbNotification', {
        childOf: _tracer.QTracer.messageRootSpanContext(doc._key)
      });
      span.addTags({
        messageId: doc._key
      });
      span.finish();
    }
  }

  subscriptionResolver() {
    return {
      subscribe: async (_, args, context, info) => {
        const accessRights = await requireGrantedAccess(context, args);
        const subscription = new _dataListener.QDataSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _dbTypes.parseSelectionSet)(info.operation.selectionSet, this.name));

        const eventListener = doc => {
          subscription.pushDocument(doc);
        };

        this.docInsertOrUpdate.on('doc', eventListener);
        this.subscriptionCount += 1;

        subscription.onClose = () => {
          this.docInsertOrUpdate.removeListener('doc', eventListener);
          this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);
        };

        return subscription;
      }
    };
  } // Queries


  getAdditionalCondition(accessRights, params) {
    const accounts = accessRights.restrictToAccounts;

    if (accounts.length === 0) {
      return '';
    }

    const condition = accounts.length === 1 ? `== @${params.add(accounts[0])}` : `IN [${accounts.map(x => `@${params.add(x)}`).join(',')}]`;

    switch (this.name) {
      case 'accounts':
        return `doc._key ${condition}`;

      case 'transactions':
        return `doc.account_addr ${condition}`;

      case 'messages':
        return `(doc.src ${condition}) OR (doc.dst ${condition})`;

      default:
        return '';
    }
  }

  buildFilterCondition(filter, params, accessRights) {
    const primaryCondition = Object.keys(filter).length > 0 ? this.docType.filterCondition(params, 'doc', filter) : '';
    const additionalCondition = this.getAdditionalCondition(accessRights, params);

    if (primaryCondition === 'false' || additionalCondition === 'false') {
      return null;
    }

    return primaryCondition && additionalCondition ? `(${primaryCondition}) AND (${additionalCondition})` : primaryCondition || additionalCondition;
  }

  buildReturnExpression(selections) {
    const expressions = new Map();
    expressions.set('_key', 'doc._key');
    const fields = this.docType.fields;

    if (selections && fields) {
      (0, _dbTypes.collectReturnExpressions)(expressions, 'doc', selections, fields);
    }

    expressions.delete('id');
    return (0, _dbTypes.combineReturnExpressions)(expressions);
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = selectionInfo.selections ? (0, _dbTypes.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
    const orderBy = args.orderBy || [];
    const limit = args.limit || 50;
    const timeout = Number(args.timeout) || 0;
    const orderByText = orderBy.map(field => {
      const direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
      return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
    }).join(', ');
    const sortSection = orderByText !== '' ? `SORT ${orderByText}` : '';
    const limitText = Math.min(limit, 50);
    const limitSection = `LIMIT ${limitText}`;
    const returnExpression = this.buildReturnExpression(selectionInfo.selections);
    const text = `
            FOR doc IN ${this.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN ${returnExpression}`;
    return {
      filter,
      selection,
      orderBy,
      limit,
      timeout,
      operationId: args.operationId || null,
      text,
      params: params.values,
      accessRights
    };
  }

  async isFastQuery(text, filter, orderBy) {
    await this.checkRefreshInfo();
    let statKey = text;

    if (orderBy && orderBy.length > 0) {
      statKey = `${statKey}${orderBy.map(x => `${x.path} ${x.direction}`).join(' ')}`;
    }

    const existingStat = this.queryStats.get(statKey);

    if (existingStat !== undefined) {
      return existingStat.isFast;
    }

    const stat = {
      isFast: (0, _slowDetector.isFastQuery)(this.info, this.docType, filter, orderBy || [], console)
    };
    this.queryStats.set(statKey, stat);
    return stat.isFast;
  }

  queryResolver() {
    return async (parent, args, context, info) => (0, _utils.wrap)(this.log, 'QUERY', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const q = this.createDatabaseQuery(args, info.fieldNodes[0].selectionSet, accessRights);

        if (!q) {
          this.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        let isFast = await this.isFastQuery(q.text, q.filter, q.orderBy);

        if (!isFast) {
          this.statQuerySlow.increment();
        }

        const traceParams = {
          filter: q.filter,
          selection: (0, _dbTypes.selectionToString)(q.selection)
        };

        if (q.orderBy.length > 0) {
          traceParams.orderBy = q.orderBy;
        }

        if (q.limit !== 50) {
          traceParams.limit = q.limit;
        }

        if (q.timeout > 0) {
          traceParams.timeout = q.timeout;
        }

        const start = Date.now();
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context) : await this.query(q.text, q.params, isFast, traceParams, context);
        this.log.debug('QUERY', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return result;
      } catch (error) {
        this.statQueryFailed.increment();
        throw error;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
        context.request.finish();
      }
    });
  }

  async query(text, params, isFast, traceParams, context) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      return this.queryDatabase(text, params, isFast, context);
    }, context.parentSpan);
  }

  async queryDatabase(text, params, isFast, context) {
    const db = isFast ? this.db : this.slowDb;
    const cursor = await db.query(text, params);
    return cursor.all();
  }

  async queryWaitFor(q, isFast, traceParams, context) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;

      let resolveOnClose = () => {};

      const resolveBy = (reason, resolve, result) => {
        if (!resolvedBy) {
          resolvedBy = reason;
          resolve(result);
        }
      };

      context.request.events.on(RequestEvent.CLOSE, () => {
        resolveBy('close', resolveOnClose, []);
      });

      try {
        const onQuery = new Promise((resolve, reject) => {
          const check = () => {
            this.queryDatabase(q.text, q.params, isFast, context).then(docs => {
              if (!resolvedBy) {
                if (docs.length > 0) {
                  forceTimerId = null;
                  resolveBy('query', resolve, docs);
                } else {
                  forceTimerId = setTimeout(check, 5000);
                }
              }
            }, reject);
          };

          check();
        });
        const onChangesFeed = new Promise(resolve => {
          const authFilter = _dataListener.QDataListener.getAuthFilter(this.name, q.accessRights);

          waitFor = doc => {
            if (authFilter && !authFilter(doc)) {
              return;
            }

            if (this.docType.test(null, doc, q.filter)) {
              resolveBy('listener', resolve, [doc]);
            }
          };

          this.waitForCount += 1;
          this.docInsertOrUpdate.on('doc', waitFor);
          this.statWaitForActive.increment();
        });
        const onTimeout = new Promise(resolve => {
          setTimeout(() => resolveBy('timeout', resolve, []), q.timeout);
        });
        const onClose = new Promise(resolve => {
          resolveOnClose = resolve;
        });
        const result = await Promise.race([onQuery, onChangesFeed, onTimeout, onClose]);
        span.setTag('resolved', resolvedBy);
        return result;
      } finally {
        if (waitFor !== null && waitFor !== undefined) {
          this.waitForCount = Math.max(0, this.waitForCount - 1);
          this.docInsertOrUpdate.removeListener('doc', waitFor);
          waitFor = null;
          this.statWaitForActive.decrement();
        }

        if (forceTimerId !== null) {
          clearTimeout(forceTimerId);
          forceTimerId = null;
        }
      }
    }, context.parentSpan);
  } //--------------------------------------------------------- Aggregates


  createAggregationQuery(filter, fields, accessRights) {
    const params = new _dbTypes.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const query = _aggregations.AggregationHelperFactory.createQuery(this.name, condition || '', fields);

    return {
      text: query.text,
      params: params.values,
      helpers: query.helpers
    };
  }

  async isFastAggregationQuery(text, filter, helpers) {
    for (const h of helpers) {
      const c = h.context;

      if (c.fn === _aggregations.AggregationFn.COUNT) {
        if (!(await this.isFastQuery(text, filter))) {
          return false;
        }
      } else if (c.fn === _aggregations.AggregationFn.MIN || c.fn === _aggregations.AggregationFn.MAX) {
        let path = c.field.path;

        if (path.startsWith('doc.')) {
          path = path.substr('doc.'.length);
        }

        if (!(await this.isFastQuery(text, filter, [{
          path,
          direction: 'ASC'
        }]))) {
          return false;
        }
      }
    }

    return true;
  }

  aggregationResolver() {
    return async (parent, args, context) => (0, _utils.wrap)(this.log, 'AGGREGATE', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const filter = args.filter || {};
        const fields = Array.isArray(args.fields) && args.fields.length > 0 ? args.fields : [{
          field: '',
          fn: _aggregations.AggregationFn.COUNT
        }];
        const q = this.createAggregationQuery(filter, fields, accessRights);

        if (!q) {
          this.log.debug('AGGREGATE', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        const isFast = await this.isFastAggregationQuery(q.text, filter, q.helpers);
        const start = Date.now();
        const result = await this.query(q.text, q.params, isFast, {
          filter: args.filter,
          aggregate: args.fields
        }, context);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result[0], q.helpers);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  } //--------------------------------------------------------- Internals


  dbCollection() {
    return this.db.collection(this.name);
  }

  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.infoRefreshTime) {
      return;
    }

    this.infoRefreshTime = Date.now() + INFO_REFRESH_INTERVAL;
    const actualIndexes = await this.dbCollection().indexes();

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_dbTypes.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _dbTypes.indexToString)(bIndex);

        if (aRest.has(bIndexString)) {
          aRest.delete(bIndexString);
        } else {
          return false;
        }
      }

      return aRest.size === 0;
    };

    if (!sameIndexes(actualIndexes, this.info.indexes)) {
      this.log.debug('RELOAD_INDEXES', actualIndexes);
      this.info.indexes = actualIndexes.map(x => ({
        fields: x.fields
      }));
      this.queryStats.clear();
    }
  }

  async waitForDoc(fieldValue, fieldPath, args, context) {
    if (!fieldValue) {
      return Promise.resolve(null);
    }

    const queryParams = fieldPath.endsWith('[*]') ? {
      filter: {
        [fieldPath.slice(0, -3)]: {
          any: {
            eq: fieldValue
          }
        }
      },
      text: `FOR doc IN ${this.name} FILTER @v IN doc.${fieldPath} RETURN doc`,
      params: {
        v: fieldValue
      }
    } : {
      filter: {
        id: {
          eq: fieldValue
        }
      },
      text: `FOR doc IN ${this.name} FILTER doc.${fieldPath} == @v RETURN doc`,
      params: {
        v: fieldValue
      }
    };
    const timeout = args.timeout === 0 ? 0 : args.timeout || 40000;

    if (timeout === 0) {
      const docs = await this.queryDatabase(queryParams.text, queryParams.params, true, context);
      return docs[0];
    }

    const docs = await this.queryWaitFor({
      filter: queryParams.filter,
      selection: [],
      orderBy: [],
      limit: 1,
      timeout,
      operationId: null,
      text: queryParams.text,
      params: queryParams.params,
      accessRights: accessGranted
    }, true, null, context);
    return docs[0];
  }

  async waitForDocs(fieldValues, fieldPath, args, context) {
    if (!fieldValues || fieldValues.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath, args, context)));
  }

  finishOperations(operationIds) {
    const toClose = []; // TODO: Implement listener cancellation based on operationId
    // for (const listener of this.listeners.items.values()) {
    //     if (listener.operationId && operationIds.has(listener.operationId)) {
    //         toClose.push(listener);
    //     }
    // }
    // toClose.forEach(x => x.close());

    return toClose.length;
  }

}

exports.QCollection = QCollection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklORk9fUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFDb2xsZWN0aW9uIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImlzVGVzdHMiLCJpbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwiaW5mb1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uQWN0aXZlIiwic3Vic2NyaXB0aW9uIiwiZG9jSW5zZXJ0T3JVcGRhdGUiLCJzZXRNYXhMaXN0ZW5lcnMiLCJxdWVyeVN0YXRzIiwiTWFwIiwibWF4UXVldWVTaXplIiwiZHJvcENhY2hlZERiSW5mbyIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzdWJzY3JpYmUiLCJfIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50Iiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJxIiwiZmllbGROb2RlcyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidHJhY2UiLCJzZXRUYWciLCJxdWVyeURhdGFiYXNlIiwicGFyZW50U3BhbiIsImN1cnNvciIsImFsbCIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJRRGF0YUxpc3RlbmVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJhZ2dyZWdhdGUiLCJjb252ZXJ0UmVzdWx0cyIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJhY3R1YWxJbmRleGVzIiwiaW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJjbGVhciIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBM0NBOzs7Ozs7Ozs7Ozs7Ozs7QUE2Q0EsTUFBTUEscUJBQXFCLEdBQUcsS0FBSyxFQUFMLEdBQVUsSUFBeEMsQyxDQUE4Qzs7QUFFdkMsTUFBTUMsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUUsT0FEaUI7QUFFeEJDLEVBQUFBLE1BQU0sRUFBRTtBQUZnQixDQUFyQjs7O0FBS0EsTUFBTUMsaUJBQU4sQ0FBd0I7QUFHM0JDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxlQUFKLEVBQWQ7QUFDSDs7QUFFREMsRUFBQUEsU0FBUyxHQUFHO0FBQ1IsU0FBS0YsTUFBTCxDQUFZRyxJQUFaLENBQWlCUixZQUFZLENBQUNDLEtBQTlCO0FBQ0g7O0FBRURRLEVBQUFBLE1BQU0sR0FBRztBQUNMLFNBQUtKLE1BQUwsQ0FBWUcsSUFBWixDQUFpQlIsWUFB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LEVBRmtCO0FBRzdCQyxNQUFBQSxPQUFPLEVBQUUsRUFIb0I7QUFJN0JDLE1BQUFBLEtBQUssRUFBRSxDQUpzQjtBQUs3QkMsTUFBQUEsT0FMNkI7QUFNN0JjLE1BQUFBLFdBQVcsRUFBRSxJQU5nQjtBQU83QkQsTUFBQUEsSUFBSSxFQUFFeUYsV0FBVyxDQUFDekYsSUFQVztBQVE3QnhDLE1BQUFBLE1BQU0sRUFBRWlJLFdBQVcsQ0FBQ2pJLE1BUlM7QUFTN0JiLE1BQUFBLFlBQVksRUFBRWpFO0FBVGUsS0FBbEIsRUFXZixJQVhlLEVBWWYsSUFaZSxFQWFmZCxPQWJlLENBQW5CO0FBZUEsV0FBTytLLElBQUksQ0FBQyxDQUFELENBQVg7QUFDSDs7QUFFRCxRQUFNcUQsV0FBTixDQUNJQyxXQURKLEVBRUlULFNBRkosRUFHSXZOLElBSEosRUFJSUwsT0FKSixFQUtrQjtBQUNkLFFBQUksQ0FBQ3FPLFdBQUQsSUFBZ0JBLFdBQVcsQ0FBQ3ZJLE1BQVosS0FBdUIsQ0FBM0MsRUFBOEM7QUFDMUMsYUFBTzZFLE9BQU8sQ0FBQ0YsT0FBUixDQUFnQixFQUFoQixDQUFQO0FBQ0g7O0FBQ0QsV0FBT0UsT0FBTyxDQUFDUixHQUFSLENBQVlrRSxXQUFXLENBQUNwSSxHQUFaLENBQWdCcUksS0FBSyxJQUFJLEtBQUtaLFVBQUwsQ0FBZ0JZLEtBQWhCLEVBQXVCVixTQUF2QixFQUFrQ3ZOLElBQWxDLEVBQXdDTCxPQUF4QyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRHVPLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUMzSSxNQUFmO0FBQ0g7O0FBam5Cb0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbipcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4qIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuKiBMaWNlbnNlIGF0OlxuKlxuKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbipcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4qIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gJ29wZW50cmFjaW5nJztcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSAndG9uLWNsaWVudC1qcy90eXBlcyc7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IEZpZWxkQWdncmVnYXRpb24sIEFnZ3JlZ2F0aW9uSGVscGVyIH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHsgUURhdGFMaXN0ZW5lciwgUURhdGFTdWJzY3JpcHRpb24gfSBmcm9tICcuL2RhdGEtbGlzdGVuZXInO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuL2F1dGgnO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gJy4vYXV0aCc7XG5pbXBvcnQgeyBCTE9DS0NIQUlOX0RCLCBTVEFUUyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgQ29sbGVjdGlvbkluZm8sIEluZGV4SW5mbywgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tICcuL2RiLXR5cGVzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4vZGItdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IElORk9fUkVGUkVTSF9JTlRFUlZBTCA9IDYwICogNjAgKiAxMDAwOyAvLyA2MCBtaW51dGVzXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0RXZlbnQgPSB7XG4gICAgQ0xPU0U6ICdjbG9zZScsXG4gICAgRklOSVNIOiAnZmluaXNoJyxcbn07XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XG4gICAgZXZlbnRzOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBRQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuICAgIGluZm86IENvbGxlY3Rpb25JbmZvO1xuICAgIGluZm9SZWZyZXNoVGltZTogbnVtYmVyO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcbiAgICBpc1Rlc3RzOiBib29sZWFuO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICAgICAgaXNUZXN0czogYm9vbGVhbixcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcbiAgICAgICAgdGhpcy5pbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1tuYW1lXTtcbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgIHRoaXMuc2xvd0RiID0gc2xvd0RiO1xuICAgICAgICB0aGlzLmlzVGVzdHMgPSBpc1Rlc3RzO1xuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZCA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmZhaWxlZCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LnNsb3csIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgZHJvcENhY2hlZERiSW5mbygpIHtcbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcblxuICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcbiAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgaWYgKGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xuICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMuaW5mbywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5maWVsZE5vZGVzWzBdLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZSh0ZXh0LCBwYXJhbXMsIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlEYXRhYmFzZShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkodGV4dCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlT25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9IHJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnY2xvc2UnLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgY29udGV4dCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdxdWVyeScsIHJlc29sdmUsIGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IFFEYXRhTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2xpc3RlbmVyJywgcmVzb2x2ZSwgW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmVCeSgndGltZW91dCcsIHJlc29sdmUsIFtdKSwgcS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNsb3NlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZU9uQ2xvc2UgPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICAgICAgb25DbG9zZSxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uIHx8ICcnLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHF1ZXJ5LmhlbHBlcnMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgZm9yIChjb25zdCBoOiBBZ2dyZWdhdGlvbkhlbHBlciBvZiBoZWxwZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xuICAgICAgICAgICAgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHRleHQsIGZpbHRlcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnZG9jLicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cignZG9jLicubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdBU0MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICApKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnQUdHUkVHQVRFJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gQXJyYXkuaXNBcnJheShhcmdzLmZpZWxkcykgJiYgYXJncy5maWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGFyZ3MuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgIDogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjogQWdncmVnYXRpb25Gbi5DT1VOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0QWdncmVnYXRpb25RdWVyeShxLnRleHQsIGZpbHRlciwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNvbnZlcnRSZXN1bHRzKHJlc3VsdFswXSwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmZvUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkZPX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmRiQ29sbGVjdGlvbigpLmluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogSW5kZXhJbmZvW10sIGJJbmRleGVzOiBJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJJbmRleCBvZiBiSW5kZXhlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYVJlc3QuZGVsZXRlKGJJbmRleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGFjdHVhbEluZGV4ZXMsIHRoaXMuaW5mby5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZm8uaW5kZXhlcyA9IGFjdHVhbEluZGV4ZXMubWFwKHggPT4gKHsgZmllbGRzOiB4LmZpZWxkcyB9KSk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoYXJncy50aW1lb3V0ID09PSAwKSA/IDAgOiAoYXJncy50aW1lb3V0IHx8IDQwMDAwKTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5RGF0YWJhc2UoXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuIl19