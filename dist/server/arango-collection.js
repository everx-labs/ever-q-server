"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.Collection = exports.RequestController = exports.RequestEvent = void 0;

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _arangoListeners = require("./arango-listeners");

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

class Collection {
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
        const subscription = new _arangoListeners.DocSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _dbTypes.parseSelectionSet)(info.operation.selectionSet, this.name));

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
          const authFilter = _arangoListeners.DocUpsertHandler.getAuthFilter(this.name, q.accessRights);

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

exports.Collection = Collection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJJTkZPX1JFRlJFU0hfSU5URVJWQUwiLCJSZXF1ZXN0RXZlbnQiLCJDTE9TRSIsIkZJTklTSCIsIlJlcXVlc3RDb250cm9sbGVyIiwiY29uc3RydWN0b3IiLCJldmVudHMiLCJFdmVudEVtaXR0ZXIiLCJlbWl0Q2xvc2UiLCJlbWl0IiwiZmluaXNoIiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwiY2hlY2tVc2VkQWNjZXNzS2V5IiwidXNlZEFjY2Vzc0tleSIsImFjY2Vzc0tleSIsImNvbnRleHQiLCJtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCIsIlFFcnJvciIsIm11bHRpcGxlQWNjZXNzS2V5cyIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYXJncyIsImF1dGgiLCJtYW1BY2Nlc3NSZXF1aXJlZCIsInVzZWRNYW1BY2Nlc3NLZXkiLCJjb25maWciLCJtYW1BY2Nlc3NLZXlzIiwiaGFzIiwiQXV0aCIsInVuYXV0aG9yaXplZEVycm9yIiwiYWNjZXNzR3JhbnRlZCIsImdyYW50ZWQiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJDb2xsZWN0aW9uIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImlzVGVzdHMiLCJpbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwiaW5mb1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uQWN0aXZlIiwic3Vic2NyaXB0aW9uIiwiZG9jSW5zZXJ0T3JVcGRhdGUiLCJzZXRNYXhMaXN0ZW5lcnMiLCJxdWVyeVN0YXRzIiwiTWFwIiwibWF4UXVldWVTaXplIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJhY2Nlc3NSaWdodHMiLCJEb2NTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50Iiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJxIiwiZmllbGROb2RlcyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidHJhY2UiLCJzZXRUYWciLCJxdWVyeURhdGFiYXNlIiwicGFyZW50U3BhbiIsImN1cnNvciIsImFsbCIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJEb2NVcHNlcnRIYW5kbGVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJhZ2dyZWdhdGUiLCJjb252ZXJ0UmVzdWx0cyIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJhY3R1YWxJbmRleGVzIiwiaW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJjbGVhciIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBM0NBOzs7Ozs7Ozs7Ozs7Ozs7QUE2Q0EsTUFBTUEscUJBQXFCLEdBQUcsS0FBSyxFQUFMLEdBQVUsSUFBeEMsQyxDQUE4Qzs7QUFFdkMsTUFBTUMsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUUsT0FEaUI7QUFFeEJDLEVBQUFBLE1BQU0sRUFBRTtBQUZnQixDQUFyQjs7O0FBS0EsTUFBTUMsaUJBQU4sQ0FBd0I7QUFHM0JDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxlQUFKLEVBQWQ7QUFDSDs7QUFFREMsRUFBQUEsU0FBUyxHQUFHO0FBQ1IsU0FBS0YsTUFBTCxDQUFZRyxJQUFaLENBQWlCUixZQUFZLENBQUNDLEtBQTlCO0FBQ0g7O0FBRURRLEVBQUFBLE1BQU0sR0FBRztBQUNMLFNBQUtKLE1BQUwsQ0FBWUcsSUFBWixDQUFpQlIsWUFBWSxDQUFDRSxNQUE5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QmMsTUFBQUEsV0FBVyxFQUFFLElBTmdCO0FBTzdCRCxNQUFBQSxJQUFJLEVBQUV5RixXQUFXLENBQUN6RixJQVBXO0FBUTdCeEMsTUFBQUEsTUFBTSxFQUFFaUksV0FBVyxDQUFDakksTUFSUztBQVM3QmIsTUFBQUEsWUFBWSxFQUFFaEU7QUFUZSxLQUFsQixFQVdmLElBWGUsRUFZZixJQVplLEVBYWZkLE9BYmUsQ0FBbkI7QUFlQSxXQUFPOEssSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1xRCxXQUFOLENBQ0lDLFdBREosRUFFSVQsU0FGSixFQUdJdE4sSUFISixFQUlJTCxPQUpKLEVBS2tCO0FBQ2QsUUFBSSxDQUFDb08sV0FBRCxJQUFnQkEsV0FBVyxDQUFDdkksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPNkUsT0FBTyxDQUFDRixPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRSxPQUFPLENBQUNSLEdBQVIsQ0FBWWtFLFdBQVcsQ0FBQ3BJLEdBQVosQ0FBZ0JxSSxLQUFLLElBQUksS0FBS1osVUFBTCxDQUFnQlksS0FBaEIsRUFBdUJWLFNBQXZCLEVBQWtDdE4sSUFBbEMsRUFBd0NMLE9BQXhDLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEc08sRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQzNJLE1BQWY7QUFDSDs7QUE3bUJtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSAnb3BlbnRyYWNpbmcnO1xuaW1wb3J0IHR5cGUgeyBUT05DbGllbnQgfSBmcm9tICd0b24tY2xpZW50LWpzL3R5cGVzJztcbmltcG9ydCB7IEFnZ3JlZ2F0aW9uRm4sIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgeyBEb2NVcHNlcnRIYW5kbGVyLCBEb2NTdWJzY3JpcHRpb24gfSBmcm9tICcuL2FyYW5nby1saXN0ZW5lcnMnO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuL2F1dGgnO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gJy4vYXV0aCc7XG5pbXBvcnQgeyBCTE9DS0NIQUlOX0RCLCBTVEFUUyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgQ29sbGVjdGlvbkluZm8sIEluZGV4SW5mbywgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tICcuL2RiLXR5cGVzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4vZGItdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IElORk9fUkVGUkVTSF9JTlRFUlZBTCA9IDYwICogNjAgKiAxMDAwOyAvLyA2MCBtaW51dGVzXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0RXZlbnQgPSB7XG4gICAgQ0xPU0U6ICdjbG9zZScsXG4gICAgRklOSVNIOiAnZmluaXNoJyxcbn07XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XG4gICAgZXZlbnRzOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgaW5mbzogQ29sbGVjdGlvbkluZm87XG4gICAgaW5mb1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZG9jVHlwZTogUVR5cGUsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBhdXRoOiBBdXRoLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgc3RhdHM6IElTdGF0cyxcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxuICAgICAgICBpc1Rlc3RzOiBib29sZWFuLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuICAgICAgICB0aGlzLmluZm8gPSBCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zW25hbWVdO1xuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMuaXNUZXN0cyA9IGlzVGVzdHM7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG5cbiAgICAgICAgY29uc3QgaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlID0gdGhpcy5uYW1lID09PSAnbWVzc2FnZXMnXG4gICAgICAgICAgICAmJiBkb2MuX2tleVxuICAgICAgICAgICAgJiYgZG9jLm1zZ190eXBlID09PSAxXG4gICAgICAgICAgICAmJiBkb2Muc3RhdHVzID09PSA1XG4gICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSB0aGlzLnRyYWNlci5zdGFydFNwYW4oJ21lc3NhZ2VEYk5vdGlmaWNhdGlvbicsIHtcbiAgICAgICAgICAgICAgICBjaGlsZE9mOiBRVHJhY2VyLm1lc3NhZ2VSb290U3BhbkNvbnRleHQoZG9jLl9rZXkpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmFkZFRhZ3Moe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VJZDogZG9jLl9rZXksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZpbHRlckNvbmRpdGlvbihcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBidWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQoJ19rZXknLCAnZG9jLl9rZXknKTtcbiAgICAgICAgY29uc3QgZmllbGRzID0gdGhpcy5kb2NUeXBlLmZpZWxkcztcbiAgICAgICAgaWYgKHNlbGVjdGlvbnMgJiYgZmllbGRzKSB7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsICdkb2MnLCBzZWxlY3Rpb25zLCBmaWVsZHMpO1xuICAgICAgICB9XG4gICAgICAgIGV4cHJlc3Npb25zLmRlbGV0ZSgnaWQnKTtcbiAgICAgICAgcmV0dXJuIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuICAgICAgICBjb25zdCByZXR1cm5FeHByZXNzaW9uID0gdGhpcy5idWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gJHtyZXR1cm5FeHByZXNzaW9ufWA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgIGxldCBzdGF0S2V5ID0gdGV4dDtcbiAgICAgICAgaWYgKG9yZGVyQnkgJiYgb3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdGF0S2V5ID0gYCR7c3RhdEtleX0ke29yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSAke3guZGlyZWN0aW9ufWApLmpvaW4oJyAnKX1gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQoc3RhdEtleSk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkodGhpcy5pbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURhdGFiYXNlKHRleHQsIHBhcmFtcywgaXNGYXN0LCBjb250ZXh0KTtcbiAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGRiID0gaXNGYXN0ID8gdGhpcy5kYiA6IHRoaXMuc2xvd0RiO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeSh0ZXh0LCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVCeSA9IChyZWFzb246IHN0cmluZywgcmVzb2x2ZTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5ldmVudHMub24oUmVxdWVzdEV2ZW50LkNMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdjbG9zZScsIHJlc29sdmVPbkNsb3NlLCBbXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IGFyZ3MuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGU6IGFyZ3MuZmllbGRzLFxuICAgICAgICAgICAgICAgIH0sIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0WzBdLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBjaGVja1JlZnJlc2hJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy5pc1Rlc3RzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERhdGUubm93KCkgPCB0aGlzLmluZm9SZWZyZXNoVGltZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5mb1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKSArIElORk9fUkVGUkVTSF9JTlRFUlZBTDtcbiAgICAgICAgY29uc3QgYWN0dWFsSW5kZXhlcyA9IGF3YWl0IHRoaXMuZGJDb2xsZWN0aW9uKCkuaW5kZXhlcygpO1xuXG4gICAgICAgIGNvbnN0IHNhbWVJbmRleGVzID0gKGFJbmRleGVzOiBJbmRleEluZm9bXSwgYkluZGV4ZXM6IEluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmZvLmluZGV4ZXMpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUkVMT0FEX0lOREVYRVMnLCBhY3R1YWxJbmRleGVzKTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5pbmRleGVzID0gYWN0dWFsSW5kZXhlcy5tYXAoeCA9PiAoeyBmaWVsZHM6IHguZmllbGRzIH0pKTtcbiAgICAgICAgICAgIHRoaXMucXVlcnlTdGF0cy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlEYXRhYmFzZShcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKFxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgsIGFyZ3MsIGNvbnRleHQpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=