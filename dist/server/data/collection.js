"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QDataCollection = exports.RequestController = exports.RequestEvent = void 0;

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _listener = require("./listener");

var _auth = require("../auth");

var _config = require("../config");

var _filters = require("../filter/filters");

var _logs = _interopRequireDefault(require("../logs"));

var _slowDetector = require("../filter/slow-detector");

var _tracer = require("../tracer");

var _utils = require("../utils");

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
const INDEXES_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

const RequestEvent = {
  CLOSE: 'close',
  FINISH: 'finish'
};
exports.RequestEvent = RequestEvent;

class RequestController {
  constructor() {
    this.events = new _events.default();
    this.events.setMaxListeners(6);
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

class QDataCollection {
  // Dependencies
  // Own
  constructor(options) {
    const name = options.name;
    this.name = name;
    this.docType = options.docType;
    this.mutable = options.mutable;
    this.indexes = options.indexes;
    this.indexesRefreshTime = Date.now();
    this.provider = options.provider;
    this.slowQueriesProvider = options.slowQueriesProvider;
    this.log = options.logs.create(name);
    this.auth = options.auth;
    this.tracer = options.tracer;
    this.isTests = options.isTests;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
    const stats = options.stats;
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
    this.hotSubscription = this.provider.subscribe(this.name, doc => this.onDocumentInsertOrUpdate(doc));
  }

  close() {
    if (this.hotSubscription) {
      this.provider.unsubscribe(this.hotSubscription);
      this.hotSubscription = null;
    }
  }

  dropCachedDbInfo() {
    this.indexesRefreshTime = Date.now();
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
        const subscription = new _listener.QDataSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _filters.parseSelectionSet)(info.operation.selectionSet, this.name));

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
      (0, _filters.collectReturnExpressions)(expressions, 'doc', selections, fields);
    }

    expressions.delete('id');
    return (0, _filters.combineReturnExpressions)(expressions);
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _filters.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = selectionInfo.selections ? (0, _filters.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
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
      isFast: (0, _slowDetector.isFastQuery)(this.name, this.indexes, this.docType, filter, orderBy || [], console)
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
          selection: (0, _filters.selectionToString)(q.selection)
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
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context) : await this.query(q.text, q.params, q.orderBy, isFast, traceParams, context);
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

  async query(text, vars, orderBy, isFast, traceParams, context) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      return this.queryProvider(text, vars, orderBy, isFast, context);
    }, context.parentSpan);
  }

  async queryProvider(text, vars, orderBy, isFast, context) {
    const provider = isFast ? this.provider : this.slowQueriesProvider;
    return provider.query(text, vars, orderBy);
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
            this.queryProvider(q.text, q.params, q.orderBy, isFast, context).then(docs => {
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
          const authFilter = _listener.QDataListener.getAuthFilter(this.name, q.accessRights);

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
    const params = new _filters.QParams();
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
        const result = await this.queryProvider(q.text, q.params, [], isFast, context);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result, q.helpers);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  }

  async getIndexes() {
    return this.provider.getCollectionIndexes(this.name);
  } //--------------------------------------------------------- Internals


  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.indexesRefreshTime) {
      return;
    }

    this.indexesRefreshTime = Date.now() + INDEXES_REFRESH_INTERVAL;
    const actualIndexes = await this.getIndexes();

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_filters.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _filters.indexToString)(bIndex);

        if (aRest.has(bIndexString)) {
          aRest.delete(bIndexString);
        } else {
          return false;
        }
      }

      return aRest.size === 0;
    };

    if (!sameIndexes(actualIndexes, this.indexes)) {
      this.log.debug('RELOAD_INDEXES', actualIndexes);
      this.indexes = actualIndexes.map(x => ({
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
      const docs = await this.queryProvider(queryParams.text, queryParams.params, [], true, context);
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

exports.QDataCollection = QDataCollection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwiaW5kZXhlc1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsInByb3ZpZGVyIiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50Iiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJxIiwiZmllbGROb2RlcyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsInRyYWNlIiwic2V0VGFnIiwicXVlcnlQcm92aWRlciIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwicmVzb2x2ZU9uQ2xvc2UiLCJyZXNvbHZlQnkiLCJyZWFzb24iLCJyZXNvbHZlIiwib25RdWVyeSIsIlByb21pc2UiLCJyZWplY3QiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiUURhdGFMaXN0ZW5lciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udmVydFJlc3VsdHMiLCJnZXRJbmRleGVzIiwiZ2V0Q29sbGVjdGlvbkluZGV4ZXMiLCJhY3R1YWxJbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBRUE7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBU0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUEzQ0E7Ozs7Ozs7Ozs7Ozs7OztBQTZDQSxNQUFNQSx3QkFBd0IsR0FBRyxLQUFLLEVBQUwsR0FBVSxJQUEzQyxDLENBQWlEOztBQUUxQyxNQUFNQyxZQUFZLEdBQUc7QUFDeEJDLEVBQUFBLEtBQUssRUFBRSxPQURpQjtBQUV4QkMsRUFBQUEsTUFBTSxFQUFFO0FBRmdCLENBQXJCOzs7QUFLQSxNQUFNQyxpQkFBTixDQUF3QjtBQUczQkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGVBQUosRUFBZDtBQUNBLFNBQUtELE1BQUwsQ0FBWUUsZUFBWixDQUE0QixDQUE1QjtBQUNIOztBQUVEQyxFQUFBQSxTQUFTLEdBQUc7QUFDUixTQUFLSCxNQUFMLENB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QUFQO0FBQ0g7O0FBQ0QsV0FBT0UsT0FBTyxDQUFDeUQsR0FBUixDQUFZRCxXQUFXLENBQUNqSSxHQUFaLENBQWdCbUksS0FBSyxJQUFJLEtBQUtiLFVBQUwsQ0FBZ0JhLEtBQWhCLEVBQXVCWCxTQUF2QixFQUFrQ3ZOLElBQWxDLEVBQXdDTCxPQUF4QyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRHdPLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUN6SSxNQUFmO0FBQ0g7O0FBdm5Cd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbipcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4qIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuKiBMaWNlbnNlIGF0OlxuKlxuKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbipcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4qIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSAnb3BlbnRyYWNpbmcnO1xuaW1wb3J0IHR5cGUgeyBUT05DbGllbnQgfSBmcm9tICd0b24tY2xpZW50LWpzL3R5cGVzJztcbmltcG9ydCB7IEFnZ3JlZ2F0aW9uRm4sIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IFFEYXRhUHJvdmlkZXIsIFFJbmRleEluZm8gfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHsgUURhdGFMaXN0ZW5lciwgUURhdGFTdWJzY3JpcHRpb24gfSBmcm9tICcuL2xpc3RlbmVyJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBTVEFUUyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuLi9maWx0ZXIvc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuY29uc3QgSU5ERVhFU19SRUZSRVNIX0lOVEVSVkFMID0gNjAgKiA2MCAqIDEwMDA7IC8vIDYwIG1pbnV0ZXNcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3RFdmVudCA9IHtcbiAgICBDTE9TRTogJ2Nsb3NlJyxcbiAgICBGSU5JU0g6ICdmaW5pc2gnLFxufTtcblxuZXhwb3J0IGNsYXNzIFJlcXVlc3RDb250cm9sbGVyIHtcbiAgICBldmVudHM6IEV2ZW50RW1pdHRlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5ldmVudHMuc2V0TWF4TGlzdGVuZXJzKDYpO1xuICAgIH1cblxuICAgIGVtaXRDbG9zZSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xuICAgIH1cblxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuRklOSVNIKTtcbiAgICAgICAgdGhpcy5ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgcmVxdWVzdDogUmVxdWVzdENvbnRyb2xsZXIsXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5cbmV4cG9ydCB0eXBlIFFDb2xsZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbXV0YWJsZTogYm9vbGVhbixcbiAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW10sXG5cbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcixcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIGxvZ3M6IFFMb2dzLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcblxuICAgIGlzVGVzdHM6IGJvb2xlYW4sXG59O1xuXG5leHBvcnQgY2xhc3MgUURhdGFDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgbXV0YWJsZTogYm9vbGVhbjtcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW107XG4gICAgaW5kZXhlc1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICAvLyBEZXBlbmRlbmNpZXNcbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICAvLyBPd25cbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG4gICAgaG90U3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFDb2xsZWN0aW9uT3B0aW9ucykge1xuICAgICAgICBjb25zdCBuYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBvcHRpb25zLmRvY1R5cGU7XG4gICAgICAgIHRoaXMubXV0YWJsZSA9IG9wdGlvbnMubXV0YWJsZTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gb3B0aW9ucy5pbmRleGVzO1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5wcm92aWRlciA9IG9wdGlvbnMucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuc2xvd1F1ZXJpZXNQcm92aWRlciA9IG9wdGlvbnMuc2xvd1F1ZXJpZXNQcm92aWRlcjtcbiAgICAgICAgdGhpcy5sb2cgPSBvcHRpb25zLmxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBvcHRpb25zLmF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gb3B0aW9ucy50cmFjZXI7XG4gICAgICAgIHRoaXMuaXNUZXN0cyA9IG9wdGlvbnMuaXNUZXN0cztcblxuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzID0gb3B0aW9ucy5zdGF0cztcbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcblxuICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IHRoaXMucHJvdmlkZXIuc3Vic2NyaWJlKHRoaXMubmFtZSwgZG9jID0+IHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYykpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5ob3RTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIudW5zdWJzY3JpYmUodGhpcy5ob3RTdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5ob3RTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJvcENhY2hlZERiSW5mbygpIHtcbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcbiAgICAgICAgY29uc3QgaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlID0gdGhpcy5uYW1lID09PSAnbWVzc2FnZXMnXG4gICAgICAgICAgICAmJiBkb2MuX2tleVxuICAgICAgICAgICAgJiYgZG9jLm1zZ190eXBlID09PSAxXG4gICAgICAgICAgICAmJiBkb2Muc3RhdHVzID09PSA1XG4gICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSB0aGlzLnRyYWNlci5zdGFydFNwYW4oJ21lc3NhZ2VEYk5vdGlmaWNhdGlvbicsIHtcbiAgICAgICAgICAgICAgICBjaGlsZE9mOiBRVHJhY2VyLm1lc3NhZ2VSb290U3BhbkNvbnRleHQoZG9jLl9rZXkpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmFkZFRhZ3Moe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VJZDogZG9jLl9rZXksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBRRGF0YVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ub25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsIHBhcmFtczogUVBhcmFtcykge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHM7XG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oJywnKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuX2tleSAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ21lc3NhZ2VzJzpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRmlsdGVyQ29uZGl0aW9uKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldCgnX2tleScsICdkb2MuX2tleScpO1xuICAgICAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmRvY1R5cGUuZmllbGRzO1xuICAgICAgICBpZiAoc2VsZWN0aW9ucyAmJiBmaWVsZHMpIHtcbiAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgJ2RvYycsIHNlbGVjdGlvbnMsIGZpZWxkcyk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwcmVzc2lvbnMuZGVsZXRlKCdpZCcpO1xuICAgICAgICByZXR1cm4gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG4gICAgICAgIGNvbnN0IHJldHVybkV4cHJlc3Npb24gPSB0aGlzLmJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnMpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiAke3JldHVybkV4cHJlc3Npb259YDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgbGV0IHN0YXRLZXkgPSB0ZXh0O1xuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YXRLZXkgPSBgJHtzdGF0S2V5fSR7b3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9ICR7eC5kaXJlY3Rpb259YCkuam9pbignICcpfWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeSh0aGlzLm5hbWUsIHRoaXMuaW5kZXhlcywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5maWVsZE5vZGVzWzBdLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBxLm9yZGVyQnksIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVByb3ZpZGVyKHRleHQsIHZhcnMsIG9yZGVyQnksIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlT25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9IHJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnY2xvc2UnLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCwgYXJncywgY29udGV4dCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==