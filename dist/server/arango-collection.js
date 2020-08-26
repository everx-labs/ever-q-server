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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJJTkZPX1JFRlJFU0hfSU5URVJWQUwiLCJSZXF1ZXN0RXZlbnQiLCJDTE9TRSIsIkZJTklTSCIsIlJlcXVlc3RDb250cm9sbGVyIiwiY29uc3RydWN0b3IiLCJldmVudHMiLCJFdmVudEVtaXR0ZXIiLCJlbWl0Q2xvc2UiLCJlbWl0IiwiZmluaXNoIiwicmVtb3ZlQWxsTGlzdGVuZXJzIiwiY2hlY2tVc2VkQWNjZXNzS2V5IiwidXNlZEFjY2Vzc0tleSIsImFjY2Vzc0tleSIsImNvbnRleHQiLCJtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCIsIlFFcnJvciIsIm11bHRpcGxlQWNjZXNzS2V5cyIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYXJncyIsImF1dGgiLCJtYW1BY2Nlc3NSZXF1aXJlZCIsInVzZWRNYW1BY2Nlc3NLZXkiLCJjb25maWciLCJtYW1BY2Nlc3NLZXlzIiwiaGFzIiwiQXV0aCIsInVuYXV0aG9yaXplZEVycm9yIiwiYWNjZXNzR3JhbnRlZCIsImdyYW50ZWQiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJDb2xsZWN0aW9uIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImlzVGVzdHMiLCJpbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwiaW5mb1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uQWN0aXZlIiwic3Vic2NyaXB0aW9uIiwiZG9jSW5zZXJ0T3JVcGRhdGUiLCJzZXRNYXhMaXN0ZW5lcnMiLCJxdWVyeVN0YXRzIiwiTWFwIiwibWF4UXVldWVTaXplIiwiZHJvcENhY2hlZERiSW5mbyIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzdWJzY3JpYmUiLCJfIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRGaWx0ZXJDb25kaXRpb24iLCJwcmltYXJ5Q29uZGl0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlckNvbmRpdGlvbiIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJidWlsZFJldHVybkV4cHJlc3Npb24iLCJzZWxlY3Rpb25zIiwiZXhwcmVzc2lvbnMiLCJzZXQiLCJmaWVsZHMiLCJkZWxldGUiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5Iiwic2VsZWN0aW9uSW5mbyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwic2VsZWN0aW9uIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdFRleHQiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJyZXR1cm5FeHByZXNzaW9uIiwidGV4dCIsIm9wZXJhdGlvbklkIiwidmFsdWVzIiwiaXNGYXN0UXVlcnkiLCJjaGVja1JlZnJlc2hJbmZvIiwic3RhdEtleSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsInN0YXQiLCJjb25zb2xlIiwicXVlcnlSZXNvbHZlciIsInBhcmVudCIsInN0YXJ0IiwicSIsImZpZWxkTm9kZXMiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsImVycm9yIiwicmVwb3J0IiwiZGVjcmVtZW50IiwicmVxdWVzdCIsInRyYWNlIiwic2V0VGFnIiwicXVlcnlEYXRhYmFzZSIsInBhcmVudFNwYW4iLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwicmVzb2x2ZU9uQ2xvc2UiLCJyZXNvbHZlQnkiLCJyZWFzb24iLCJyZXNvbHZlIiwib25RdWVyeSIsIlByb21pc2UiLCJyZWplY3QiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiRG9jVXBzZXJ0SGFuZGxlciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiYWdncmVnYXRlIiwiY29udmVydFJlc3VsdHMiLCJkYkNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uIiwiYWN0dWFsSW5kZXhlcyIsImluZGV4ZXMiLCJzYW1lSW5kZXhlcyIsImFJbmRleGVzIiwiYkluZGV4ZXMiLCJhUmVzdCIsIlNldCIsImluZGV4VG9TdHJpbmciLCJiSW5kZXgiLCJiSW5kZXhTdHJpbmciLCJzaXplIiwiY2xlYXIiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFTQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQTNDQTs7Ozs7Ozs7Ozs7Ozs7O0FBNkNBLE1BQU1BLHFCQUFxQixHQUFHLEtBQUssRUFBTCxHQUFVLElBQXhDLEMsQ0FBOEM7O0FBRXZDLE1BQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFLE9BRGlCO0FBRXhCQyxFQUFBQSxNQUFNLEVBQUU7QUFGZ0IsQ0FBckI7OztBQUtBLE1BQU1DLGlCQUFOLENBQXdCO0FBRzNCQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixTQUFLQyxNQUFMLEdBQWMsSUFBSUMsZUFBSixFQUFkO0FBQ0g7O0FBRURDLEVBQUFBLFNBQVMsR0FBRztBQUNSLFNBQUtGLE1BQUwsQ0FBWUcsSUFBWixDQUFpQlIsWUFBWSxDQUFDQyxLQUE5QjtBQUNIOztBQUVEUSxFQUFBQSxNQUFNLEdBQUc7QUFDTCxTQUFLSixNQUFMLENBQVlHLElBQVosQ0FB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U0FBUyxFQUFFLEVBRmtCO0FBRzdCQyxNQUFBQSxPQUFPLEVBQUUsRUFIb0I7QUFJN0JDLE1BQUFBLEtBQUssRUFBRSxDQUpzQjtBQUs3QkMsTUFBQUEsT0FMNkI7QUFNN0JjLE1BQUFBLFdBQVcsRUFBRSxJQU5nQjtBQU83QkQsTUFBQUEsSUFBSSxFQUFFeUYsV0FBVyxDQUFDekYsSUFQVztBQVE3QnhDLE1BQUFBLE1BQU0sRUFBRWlJLFdBQVcsQ0FBQ2pJLE1BUlM7QUFTN0JiLE1BQUFBLFlBQVksRUFBRWpFO0FBVGUsS0FBbEIsRUFXZixJQVhlLEVBWWYsSUFaZSxFQWFmZCxPQWJlLENBQW5CO0FBZUEsV0FBTytLLElBQUksQ0FBQyxDQUFELENBQVg7QUFDSDs7QUFFRCxRQUFNcUQsV0FBTixDQUNJQyxXQURKLEVBRUlULFNBRkosRUFHSXZOLElBSEosRUFJSUwsT0FKSixFQUtrQjtBQUNkLFFBQUksQ0FBQ3FPLFdBQUQsSUFBZ0JBLFdBQVcsQ0FBQ3ZJLE1BQVosS0FBdUIsQ0FBM0MsRUFBOEM7QUFDMUMsYUFBTzZFLE9BQU8sQ0FBQ0YsT0FBUixDQUFnQixFQUFoQixDQUFQO0FBQ0g7O0FBQ0QsV0FBT0UsT0FBTyxDQUFDUixHQUFSLENBQVlrRSxXQUFXLENBQUNwSSxHQUFaLENBQWdCcUksS0FBSyxJQUFJLEtBQUtaLFVBQUwsQ0FBZ0JZLEtBQWhCLEVBQXVCVixTQUF2QixFQUFrQ3ZOLElBQWxDLEVBQXdDTCxPQUF4QyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRHVPLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUMzSSxNQUFmO0FBQ0g7O0FBam5CbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxyXG4qXHJcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXHJcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXHJcbiogTGljZW5zZSBhdDpcclxuKlxyXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xyXG4qXHJcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuKi9cclxuXHJcbi8vIEBmbG93XHJcblxyXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xyXG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSAnb3BlbnRyYWNpbmcnO1xyXG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gJ3Rvbi1jbGllbnQtanMvdHlwZXMnO1xyXG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XHJcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XHJcbmltcG9ydCB7IERvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbiB9IGZyb20gJy4vYXJhbmdvLWxpc3RlbmVycyc7XHJcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSAnLi9hdXRoJztcclxuaW1wb3J0IHsgQXV0aCB9IGZyb20gJy4vYXV0aCc7XHJcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi9jb25maWcnO1xyXG5pbXBvcnQgdHlwZSB7IENvbGxlY3Rpb25JbmZvLCBJbmRleEluZm8sIFFDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XHJcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tICcuL2RiLXR5cGVzJztcclxuaW1wb3J0IHtcclxuICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyxcclxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcclxuICAgIGluZGV4VG9TdHJpbmcsXHJcbiAgICBwYXJzZVNlbGVjdGlvblNldCxcclxuICAgIFFQYXJhbXMsXHJcbiAgICBzZWxlY3Rpb25Ub1N0cmluZyxcclxufSBmcm9tICcuL2RiLXR5cGVzJztcclxuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi9sb2dzJztcclxuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncyc7XHJcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcclxuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuL3RyYWNlcic7XHJcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tICcuL3RyYWNlcic7XHJcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gJy4vdXRpbHMnO1xyXG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XHJcblxyXG5jb25zdCBJTkZPX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xyXG5cclxuZXhwb3J0IGNvbnN0IFJlcXVlc3RFdmVudCA9IHtcclxuICAgIENMT1NFOiAnY2xvc2UnLFxyXG4gICAgRklOSVNIOiAnZmluaXNoJyxcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XHJcbiAgICBldmVudHM6IEV2ZW50RW1pdHRlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuICAgIH1cclxuXHJcbiAgICBlbWl0Q2xvc2UoKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmlzaCgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzLnJlbW92ZUFsbExpc3RlbmVycygpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XHJcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcclxuICAgIGNvbmZpZzogUUNvbmZpZyxcclxuICAgIGF1dGg6IEF1dGgsXHJcbiAgICB0cmFjZXI6IFRyYWNlcixcclxuICAgIHN0YXRzOiBJU3RhdHMsXHJcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcclxuXHJcbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxyXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXHJcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxyXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcclxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcclxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcclxuXHJcbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcclxuICAgIGZpbHRlcjogYW55LFxyXG4gICAgZmllbGRzPzogRmllbGRBZ2dyZWdhdGlvbltdLFxyXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxyXG59XHJcblxyXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXHJcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxyXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxyXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxyXG4pOiA/c3RyaW5nIHtcclxuICAgIGlmICghYWNjZXNzS2V5KSB7XHJcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XHJcbiAgICB9XHJcbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcclxuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcclxuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYWNjZXNzS2V5O1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xyXG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XHJcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xyXG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcclxuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xyXG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcclxuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XHJcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xyXG4gICAgfVxyXG59XHJcblxyXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XHJcbiAgICBncmFudGVkOiB0cnVlLFxyXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcclxufTtcclxuXHJcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIGRvY1R5cGU6IFFUeXBlO1xyXG4gICAgaW5mbzogQ29sbGVjdGlvbkluZm87XHJcbiAgICBpbmZvUmVmcmVzaFRpbWU6IG51bWJlcjtcclxuXHJcbiAgICBsb2c6IFFMb2c7XHJcbiAgICBhdXRoOiBBdXRoO1xyXG4gICAgdHJhY2VyOiBUcmFjZXI7XHJcbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XHJcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcclxuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xyXG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XHJcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XHJcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XHJcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcclxuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XHJcbiAgICBkYjogRGF0YWJhc2U7XHJcbiAgICBzbG93RGI6IERhdGFiYXNlO1xyXG4gICAgaXNUZXN0czogYm9vbGVhbjtcclxuXHJcbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcclxuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XHJcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xyXG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcclxuXHJcbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICAgICAgZG9jVHlwZTogUVR5cGUsXHJcbiAgICAgICAgbG9nczogUUxvZ3MsXHJcbiAgICAgICAgYXV0aDogQXV0aCxcclxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcclxuICAgICAgICBzdGF0czogSVN0YXRzLFxyXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcclxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxyXG4gICAgICAgIGlzVGVzdHM6IGJvb2xlYW4sXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xyXG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XHJcbiAgICAgICAgdGhpcy5pbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1tuYW1lXTtcclxuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XHJcblxyXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XHJcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcclxuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcclxuICAgICAgICB0aGlzLmRiID0gZGI7XHJcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XHJcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gaXNUZXN0cztcclxuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XHJcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XHJcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcclxuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xyXG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcclxuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcclxuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcclxuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XHJcblxyXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XHJcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XHJcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcclxuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZHJvcENhY2hlZERiSW5mbygpIHtcclxuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xyXG5cclxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xyXG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcclxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSA9IHRoaXMubmFtZSA9PT0gJ21lc3NhZ2VzJ1xyXG4gICAgICAgICAgICAmJiBkb2MuX2tleVxyXG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcclxuICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNVxyXG4gICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xyXG4gICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xyXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBRdWVyaWVzXHJcblxyXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XHJcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xyXG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcclxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxyXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcclxuICAgICAgICBjYXNlICdhY2NvdW50cyc6XHJcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcclxuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxyXG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcclxuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XHJcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICByZXR1cm4gJyc7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkRmlsdGVyQ29uZGl0aW9uKFxyXG4gICAgICAgIGZpbHRlcjogYW55LFxyXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcclxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcclxuICAgICk6ID9zdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcclxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcclxuICAgICAgICAgICAgOiAnJztcclxuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcclxuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcclxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXHJcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICBleHByZXNzaW9ucy5zZXQoJ19rZXknLCAnZG9jLl9rZXknKTtcclxuICAgICAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmRvY1R5cGUuZmllbGRzO1xyXG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xyXG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsICdkb2MnLCBzZWxlY3Rpb25zLCBmaWVsZHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XHJcbiAgICAgICAgcmV0dXJuIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcclxuICAgICAgICBhcmdzOiB7XHJcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcclxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcclxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXHJcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXHJcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxyXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxyXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xyXG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xyXG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XHJcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcclxuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XHJcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXHJcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxyXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XHJcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xyXG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xyXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xyXG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxyXG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxyXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xyXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XHJcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcclxuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcclxuICAgICAgICBjb25zdCByZXR1cm5FeHByZXNzaW9uID0gdGhpcy5idWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zKTtcclxuICAgICAgICBjb25zdCB0ZXh0ID0gYFxyXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxyXG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XHJcbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XHJcbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxyXG4gICAgICAgICAgICBSRVRVUk4gJHtyZXR1cm5FeHByZXNzaW9ufWA7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGZpbHRlcixcclxuICAgICAgICAgICAgc2VsZWN0aW9uLFxyXG4gICAgICAgICAgICBvcmRlckJ5LFxyXG4gICAgICAgICAgICBsaW1pdCxcclxuICAgICAgICAgICAgdGltZW91dCxcclxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcclxuICAgICAgICAgICAgdGV4dCxcclxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxyXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBpc0Zhc3RRdWVyeShcclxuICAgICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgICAgZmlsdGVyOiBhbnksXHJcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcclxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xyXG4gICAgICAgIGxldCBzdGF0S2V5ID0gdGV4dDtcclxuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcclxuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XHJcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkodGhpcy5pbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xyXG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcclxuICAgIH1cclxuXHJcbiAgICBxdWVyeVJlc29sdmVyKCkge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAoXHJcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxyXG4gICAgICAgICAgICBhcmdzOiBhbnksXHJcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcclxuICAgICAgICAgICAgaW5mbzogYW55LFxyXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcclxuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxyXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcclxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcclxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxyXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZC5pbmNyZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XHJcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBxdWVyeShcclxuICAgICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcclxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXHJcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcclxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXHJcbiAgICApOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcclxuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XHJcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UodGV4dCwgcGFyYW1zLCBpc0Zhc3QsIGNvbnRleHQpO1xyXG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcXVlcnlEYXRhYmFzZShcclxuICAgICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcclxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXHJcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxyXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcclxuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeSh0ZXh0LCBwYXJhbXMpO1xyXG4gICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcclxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxyXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcclxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxyXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcclxuICAgICk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xyXG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcclxuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XHJcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcclxuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSByZWFzb247XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdjbG9zZScsIHJlc29sdmVPbkNsb3NlLCBbXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgY29udGV4dCkudGhlbigoZG9jcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhGaWx0ZXIgPSBEb2NVcHNlcnRIYW5kbGVyLmdldEF1dGhGaWx0ZXIodGhpcy5uYW1lLCBxLmFjY2Vzc1JpZ2h0cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdsaXN0ZW5lcicsIHJlc29sdmUsIFtkb2NdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNsb3NlID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXHJcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxyXG4gICAgICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcclxuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcclxuICAgIH1cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXHJcblxyXG5cclxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXHJcbiAgICAgICAgZmlsdGVyOiBhbnksXHJcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXHJcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXHJcbiAgICApOiA/e1xyXG4gICAgICAgIHRleHQ6IHN0cmluZyxcclxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxyXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXHJcbiAgICB9IHtcclxuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xyXG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XHJcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcclxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxyXG4gICAgICAgICAgICBoZWxwZXJzOiBxdWVyeS5oZWxwZXJzLFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcclxuICAgICAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICAgICAgZmlsdGVyOiBhbnksXHJcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcclxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgICAgIGZvciAoY29uc3QgaDogQWdncmVnYXRpb25IZWxwZXIgb2YgaGVscGVycykge1xyXG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xyXG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeSh0ZXh0LCBmaWx0ZXIpKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChjLmZuID09PSBBZ2dyZWdhdGlvbkZuLk1JTiB8fCBjLmZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoJ2RvYy4nLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxyXG4gICAgICAgICAgICAgICAgICAgIFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcclxuICAgICAgICAgICAgcGFyZW50OiBhbnksXHJcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcclxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxyXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ0FHR1JFR0FURScsIGFyZ3MsIGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gQXJyYXkuaXNBcnJheShhcmdzLmZpZWxkcykgJiYgYXJncy5maWVsZHMubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcclxuICAgICAgICAgICAgICAgICAgICA6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IEFnZ3JlZ2F0aW9uRm4uQ09VTlQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0FHR1JFR0FURScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkocS50ZXh0LCBmaWx0ZXIsIHEuaGVscGVycyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcclxuICAgICAgICAgICAgICAgIH0sIGNvbnRleHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXHJcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcclxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHRbMF0sIHEuaGVscGVycyk7XHJcbiAgICAgICAgICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xyXG5cclxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBjaGVja1JlZnJlc2hJbmZvKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmlzVGVzdHMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMuaW5mb1JlZnJlc2hUaW1lKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpICsgSU5GT19SRUZSRVNIX0lOVEVSVkFMO1xyXG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmRiQ29sbGVjdGlvbigpLmluZGV4ZXMoKTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2FtZUluZGV4ZXMgPSAoYUluZGV4ZXM6IEluZGV4SW5mb1tdLCBiSW5kZXhlczogSW5kZXhJbmZvW10pOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XHJcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiSW5kZXhTdHJpbmcgPSBpbmRleFRvU3RyaW5nKGJJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcclxuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKCFzYW1lSW5kZXhlcyhhY3R1YWxJbmRleGVzLCB0aGlzLmluZm8uaW5kZXhlcykpIHtcclxuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5mby5pbmRleGVzID0gYWN0dWFsSW5kZXhlcy5tYXAoeCA9PiAoeyBmaWVsZHM6IHguZmllbGRzIH0pKTtcclxuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxyXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcclxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcclxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcclxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXHJcbiAgICApOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcclxuICAgICAgICAgICAgPyB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcclxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcclxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgOiB7XHJcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxyXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xyXG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5RGF0YWJhc2UoXHJcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy50ZXh0LFxyXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxyXG4gICAgICAgICAgICAgICAgdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcclxuICAgICAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcclxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxyXG4gICAgICAgICAgICAgICAgbGltaXQ6IDEsXHJcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxyXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxyXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXHJcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRydWUsXHJcbiAgICAgICAgICAgIG51bGwsXHJcbiAgICAgICAgICAgIGNvbnRleHQsXHJcbiAgICAgICAgKTtcclxuICAgICAgICByZXR1cm4gZG9jc1swXTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcclxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXHJcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXHJcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXHJcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxyXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xyXG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xyXG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcclxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XHJcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xyXG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vIH1cclxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xyXG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbiJdfQ==