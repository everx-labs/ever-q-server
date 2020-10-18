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
    this.events.setMaxListeners(0);
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

        if (result.length > q.limit) {
          result.splice(q.limit);
        }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwiaW5kZXhlc1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsInByb3ZpZGVyIiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50Iiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJxIiwiZmllbGROb2RlcyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwic3BsaWNlIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsInRyYWNlIiwic2V0VGFnIiwicXVlcnlQcm92aWRlciIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwicmVzb2x2ZU9uQ2xvc2UiLCJyZXNvbHZlQnkiLCJyZWFzb24iLCJyZXNvbHZlIiwib25RdWVyeSIsIlByb21pc2UiLCJyZWplY3QiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiUURhdGFMaXN0ZW5lciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udmVydFJlc3VsdHMiLCJnZXRJbmRleGVzIiwiZ2V0Q29sbGVjdGlvbkluZGV4ZXMiLCJhY3R1YWxJbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBRUE7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBU0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUEzQ0E7Ozs7Ozs7Ozs7Ozs7OztBQTZDQSxNQUFNQSx3QkFBd0IsR0FBRyxLQUFLLEVBQUwsR0FBVSxJQUEzQyxDLENBQWlEOztBQUUxQyxNQUFNQyxZQUFZLEdBQUc7QUFDeEJDLEVBQUFBLEtBQUssRUFBRSxPQURpQjtBQUV4QkMsRUFBQUEsTUFBTSxFQUFFO0FBRmdCLENBQXJCOzs7QUFLQSxNQUFNQyxpQkFBTixDQUF3QjtBQUczQkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGVBQUosRUFBZDtBQUNBLFNBQUtELE1BQUwsQ0FBWUUsZUFBWixDQUE0QixDQUE1QjtBQUNIOztBQUVEQyxFQUFBQSxTQUFTLEdBQUc7QUFDUixTQUFLSCxNQUFMLENBQVlJLElBQVosQ0FBaUJULFlBQVksQ0FBQ0MsS0FBOUI7QUFDSDs7QUFFRFMsRUFBQUEsTUFBTSxHQUFHO0FBQ0wsU0FBS0wsTUFBTCxDQUFZSSxJQUFaLENBQWlCVCxZQUFZLENBQUNFLE1BQTlCO0FBQ0EsU0FBS0csTUFBTCxDQUFZTSxrQkFBWjtBQUNIOztBQWYwQjs7OztBQTBDL0IsU0FBU0Msa0JBQVQsQ0FDSUMsYUFESixFQUVJQyxTQUZKLEVBR0lDLE9BSEosRUFJVztBQUNQLE1BQUksQ0FBQ0QsU0FBTCxFQUFnQjtBQUNaLFdBQU9ELGFBQVA7QUFDSDs7QUFDRCxNQUFJQSxhQUFhLElBQUlDLFNBQVMsS0FBS0QsYUFBbkMsRUFBa0Q7QUFDOUNFLElBQUFBLE9BQU8sQ0FBQ0MsMEJBQVIsR0FBcUMsSUFBckM7QUFDQSxVQUFNQyxjQUFPQyxrQkFBUCxFQUFOO0FBQ0g7O0FBQ0QsU0FBT0osU0FBUDtBQUNIOztBQUVNLGVBQWVLLG9CQUFmLENBQW9DSixPQUFwQyxFQUFvRUssSUFBcEUsRUFBc0c7QUFDekcsUUFBTU4sU0FBUyxHQUFHQyxPQUFPLENBQUNELFNBQVIsSUFBcUJNLElBQUksQ0FBQ04sU0FBNUM7QUFDQUMsRUFBQUEsT0FBTyxDQUFDRixhQUFSLEdBQXdCRCxrQkFBa0IsQ0FBQ0csT0FBTyxDQUFDRixhQUFULEVBQXdCQyxTQUF4QixFQUFtQ0MsT0FBbkMsQ0FBMUM7QUFDQSxTQUFPQSxPQUFPLENBQUNNLElBQVIsQ0FBYUYsb0JBQWIsQ0FBa0NMLFNBQWxDLENBQVA7QUFDSDs7QUFFTSxTQUFTUSxpQkFBVCxDQUEyQlAsT0FBM0IsRUFBMkRLLElBQTNELEVBQXNFO0FBQ3pFLFFBQU1OLFNBQVMsR0FBR00sSUFBSSxDQUFDTixTQUF2QjtBQUNBQyxFQUFBQSxPQUFPLENBQUNRLGdCQUFSLEdBQTJCWCxrQkFBa0IsQ0FBQ0csT0FBTyxDQUFDUSxnQkFBVCxFQUEyQlQsU0FBM0IsRUFBc0NDLE9BQXRDLENBQTdDOztBQUNBLE1BQUksQ0FBQ0QsU0FBRCxJQUFjLENBQUNDLE9BQU8sQ0FBQ1MsTUFBUixDQUFlQyxhQUFmLENBQTZCQyxHQUE3QixDQUFpQ1osU0FBakMsQ0FBbkIsRUFBZ0U7QUFDNUQsVUFBTWEsV0FBS0MsaUJBQUwsRUFBTjtBQUNIO0FBQ0o7O0FBRUQsTUFBTUMsYUFBMkIsR0FBRztBQUNoQ0MsRUFBQUEsT0FBTyxFQUFFLElBRHVCO0FBRWhDQyxFQUFBQSxrQkFBa0IsRUFBRTtBQUZZLENBQXBDOztBQXNCTyxNQUFNQyxlQUFOLENBQXNCO0FBT3pCO0FBUUE7QUFrQkE1QixFQUFBQSxXQUFXLENBQUM2QixPQUFELEVBQThCO0FBQ3JDLFVBQU1DLElBQUksR0FBR0QsT0FBTyxDQUFDQyxJQUFyQjtBQUNBLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLE9BQUwsR0FBZUYsT0FBTyxDQUFDRSxPQUF2QjtBQUNBLFNBQUtDLE9BQUwsR0FBZUgsT0FBTyxDQUFDRyxPQUF2QjtBQUNBLFNBQUtDLE9BQUwsR0FBZUosT0FBTyxDQUFDSSxPQUF2QjtBQUNBLFNBQUtDLGtCQUFMLEdBQTBCQyxJQUFJLENBQUNDLEdBQUwsRUFBMUI7QUFFQSxTQUFLQyxRQUFMLEdBQWdCUixPQUFPLENBQUNRLFFBQXhCO0FBQ0EsU0FBS0MsbUJBQUwsR0FBMkJULE9BQU8sQ0FBQ1MsbUJBQW5DO0FBQ0EsU0FBS0MsR0FBTCxHQUFXVixPQUFPLENBQUNXLElBQVIsQ0FBYUMsTUFBYixDQUFvQlgsSUFBcEIsQ0FBWDtBQUNBLFNBQUtiLElBQUwsR0FBWVksT0FBTyxDQUFDWixJQUFwQjtBQUNBLFNBQUt5QixNQUFMLEdBQWNiLE9BQU8sQ0FBQ2EsTUFBdEI7QUFDQSxTQUFLQyxPQUFMLEdBQWVkLE9BQU8sQ0FBQ2MsT0FBdkI7QUFFQSxTQUFLQyxZQUFMLEdBQW9CLENBQXBCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsQ0FBekI7QUFFQSxVQUFNQyxLQUFLLEdBQUdqQixPQUFPLENBQUNpQixLQUF0QjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxJQUFJQyxvQkFBSixDQUFpQkYsS0FBakIsRUFBd0JHLGNBQU1DLEdBQU4sQ0FBVUMsS0FBbEMsRUFBeUMsQ0FBRSxjQUFhckIsSUFBSyxFQUFwQixDQUF6QyxDQUFmO0FBQ0EsU0FBS3NCLFNBQUwsR0FBaUIsSUFBSUosb0JBQUosQ0FBaUJGLEtBQWpCLEVBQXdCRyxjQUFNSSxLQUFOLENBQVlGLEtBQXBDLEVBQTJDLENBQUUsY0FBYXJCLElBQUssRUFBcEIsQ0FBM0MsQ0FBakI7QUFDQSxTQUFLd0IsYUFBTCxHQUFxQixJQUFJQyxtQkFBSixDQUFnQlQsS0FBaEIsRUFBdUJHLGNBQU1JLEtBQU4sQ0FBWUcsSUFBbkMsRUFBeUMsQ0FBRSxjQUFhMUIsSUFBSyxFQUFwQixDQUF6QyxDQUFyQjtBQUNBLFNBQUsyQixlQUFMLEdBQXVCLElBQUlDLGtCQUFKLENBQWVaLEtBQWYsRUFBc0JHLGNBQU1JLEtBQU4sQ0FBWU0sTUFBbEMsRUFBMEMsQ0FBRSxjQUFhN0IsSUFBSyxFQUFwQixDQUExQyxDQUF2QjtBQUNBLFNBQUs4QixlQUFMLEdBQXVCLElBQUlaLG9CQUFKLENBQWlCRixLQUFqQixFQUF3QkcsY0FBTUksS0FBTixDQUFZUSxNQUFwQyxFQUE0QyxDQUFFLGNBQWEvQixJQUFLLEVBQXBCLENBQTVDLENBQXZCO0FBQ0EsU0FBS2dDLGFBQUwsR0FBcUIsSUFBSWQsb0JBQUosQ0FBaUJGLEtBQWpCLEVBQXdCRyxjQUFNSSxLQUFOLENBQVlVLElBQXBDLEVBQTBDLENBQUUsY0FBYWpDLElBQUssRUFBcEIsQ0FBMUMsQ0FBckI7QUFDQSxTQUFLa0MsaUJBQUwsR0FBeUIsSUFBSU4sa0JBQUosQ0FBZVosS0FBZixFQUFzQkcsY0FBTWdCLE9BQU4sQ0FBY04sTUFBcEMsRUFBNEMsQ0FBRSxjQUFhN0IsSUFBSyxFQUFwQixDQUE1QyxDQUF6QjtBQUNBLFNBQUtvQyxzQkFBTCxHQUE4QixJQUFJUixrQkFBSixDQUFlWixLQUFmLEVBQXNCRyxjQUFNa0IsWUFBTixDQUFtQlIsTUFBekMsRUFBaUQsQ0FBRSxjQUFhN0IsSUFBSyxFQUFwQixDQUFqRCxDQUE5QjtBQUVBLFNBQUtzQyxpQkFBTCxHQUF5QixJQUFJbEUsZUFBSixFQUF6QjtBQUNBLFNBQUtrRSxpQkFBTCxDQUF1QmpFLGVBQXZCLENBQXVDLENBQXZDO0FBQ0EsU0FBS2tFLFVBQUwsR0FBa0IsSUFBSUMsR0FBSixFQUFsQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsQ0FBcEI7QUFFQSxTQUFLQyxlQUFMLEdBQXVCLEtBQUtuQyxRQUFMLENBQWNvQyxTQUFkLENBQXdCLEtBQUszQyxJQUE3QixFQUFtQ29CLEdBQUcsSUFBSSxLQUFLd0Isd0JBQUwsQ0FBOEJ4QixHQUE5QixDQUExQyxDQUF2QjtBQUNIOztBQUVEeUIsRUFBQUEsS0FBSyxHQUFHO0FBQ0osUUFBSSxLQUFLSCxlQUFULEVBQTBCO0FBQ3RCLFdBQUtuQyxRQUFMLENBQWN1QyxXQUFkLENBQTBCLEtBQUtKLGVBQS9CO0FBQ0EsV0FBS0EsZUFBTCxHQUF1QixJQUF2QjtBQUNIO0FBQ0o7O0FBRURLLEVBQUFBLGdCQUFnQixHQUFHO0FBQ2YsU0FBSzNDLGtCQUFMLEdBQTBCQyxJQUFJLENBQUNDLEdBQUwsRUFBMUI7QUFDSCxHQTlFd0IsQ0FnRnpCOzs7QUFFQXNDLEVBQUFBLHdCQUF3QixDQUFDeEIsR0FBRCxFQUFXO0FBQy9CLFNBQUtILE9BQUwsQ0FBYStCLFNBQWI7QUFDQSxTQUFLVixpQkFBTCxDQUF1Qi9ELElBQXZCLENBQTRCLEtBQTVCLEVBQW1DNkMsR0FBbkM7QUFDQSxVQUFNNkIsaUNBQWlDLEdBQUcsS0FBS2pELElBQUwsS0FBYyxVQUFkLElBQ25Db0IsR0FBRyxDQUFDOEIsSUFEK0IsSUFFbkM5QixHQUFHLENBQUMrQixRQUFKLEtBQWlCLENBRmtCLElBR25DL0IsR0FBRyxDQUFDZ0MsTUFBSixLQUFlLENBSHRCOztBQUlBLFFBQUlILGlDQUFKLEVBQXVDO0FBQ25DLFlBQU1JLElBQUksR0FBRyxLQUFLekMsTUFBTCxDQUFZMEMsU0FBWixDQUFzQix1QkFBdEIsRUFBK0M7QUFDeERDLFFBQUFBLE9BQU8sRUFBRUMsZ0JBQVFDLHNCQUFSLENBQStCckMsR0FBRyxDQUFDOEIsSUFBbkM7QUFEK0MsT0FBL0MsQ0FBYjtBQUdBRyxNQUFBQSxJQUFJLENBQUNLLE9BQUwsQ0FBYTtBQUNUQyxRQUFBQSxTQUFTLEVBQUV2QyxHQUFHLENBQUM4QjtBQUROLE9BQWI7QUFHQUcsTUFBQUEsSUFBSSxDQUFDN0UsTUFBTDtBQUNIO0FBQ0o7O0FBRURvRixFQUFBQSxvQkFBb0IsR0FBRztBQUNuQixXQUFPO0FBQ0hqQixNQUFBQSxTQUFTLEVBQUUsT0FBT2tCLENBQVAsRUFBZTNFLElBQWYsRUFBc0NMLE9BQXRDLEVBQW9EaUYsSUFBcEQsS0FBa0U7QUFDekUsY0FBTUMsWUFBWSxHQUFHLE1BQU05RSxvQkFBb0IsQ0FBQ0osT0FBRCxFQUFVSyxJQUFWLENBQS9DO0FBQ0EsY0FBTW1ELFlBQVksR0FBRyxJQUFJMkIsMkJBQUosQ0FDakIsS0FBS2hFLElBRFksRUFFakIsS0FBS0MsT0FGWSxFQUdqQjhELFlBSGlCLEVBSWpCN0UsSUFBSSxDQUFDK0UsTUFBTCxJQUFlLEVBSkUsRUFLakIsZ0NBQWtCSCxJQUFJLENBQUNJLFNBQUwsQ0FBZUMsWUFBakMsRUFBK0MsS0FBS25FLElBQXBELENBTGlCLENBQXJCOztBQU9BLGNBQU1vRSxhQUFhLEdBQUloRCxHQUFELElBQVM7QUFDM0JpQixVQUFBQSxZQUFZLENBQUNnQyxZQUFiLENBQTBCakQsR0FBMUI7QUFDSCxTQUZEOztBQUdBLGFBQUtrQixpQkFBTCxDQUF1QmdDLEVBQXZCLENBQTBCLEtBQTFCLEVBQWlDRixhQUFqQztBQUNBLGFBQUtyRCxpQkFBTCxJQUEwQixDQUExQjs7QUFDQXNCLFFBQUFBLFlBQVksQ0FBQ2tDLE9BQWIsR0FBdUIsTUFBTTtBQUN6QixlQUFLakMsaUJBQUwsQ0FBdUJrQyxjQUF2QixDQUFzQyxLQUF0QyxFQUE2Q0osYUFBN0M7QUFDQSxlQUFLckQsaUJBQUwsR0FBeUIwRCxJQUFJLENBQUNDLEdBQUwsQ0FBUyxDQUFULEVBQVksS0FBSzNELGlCQUFMLEdBQXlCLENBQXJDLENBQXpCO0FBQ0gsU0FIRDs7QUFJQSxlQUFPc0IsWUFBUDtBQUNIO0FBcEJFLEtBQVA7QUFzQkgsR0EzSHdCLENBNkh6Qjs7O0FBRUFzQyxFQUFBQSxzQkFBc0IsQ0FBQ1osWUFBRCxFQUE2QmEsTUFBN0IsRUFBOEM7QUFDaEUsVUFBTUMsUUFBUSxHQUFHZCxZQUFZLENBQUNsRSxrQkFBOUI7O0FBQ0EsUUFBSWdGLFFBQVEsQ0FBQ0MsTUFBVCxLQUFvQixDQUF4QixFQUEyQjtBQUN2QixhQUFPLEVBQVA7QUFDSDs7QUFDRCxVQUFNQyxTQUFTLEdBQUdGLFFBQVEsQ0FBQ0MsTUFBVCxLQUFvQixDQUFwQixHQUNYLE9BQU1GLE1BQU0sQ0FBQ0ksR0FBUCxDQUFXSCxRQUFRLENBQUMsQ0FBRCxDQUFuQixDQUF3QixFQURuQixHQUVYLE9BQU1BLFFBQVEsQ0FBQ0ksR0FBVCxDQUFhQyxDQUFDLElBQUssSUFBR04sTUFBTSxDQUFDSSxHQUFQLENBQVdFLENBQVgsQ0FBYyxFQUFwQyxFQUF1Q0MsSUFBdkMsQ0FBNEMsR0FBNUMsQ0FBaUQsR0FGOUQ7O0FBR0EsWUFBUSxLQUFLbkYsSUFBYjtBQUNBLFdBQUssVUFBTDtBQUNJLGVBQVEsWUFBVytFLFNBQVUsRUFBN0I7O0FBQ0osV0FBSyxjQUFMO0FBQ0ksZUFBUSxvQkFBbUJBLFNBQVUsRUFBckM7O0FBQ0osV0FBSyxVQUFMO0FBQ0ksZUFBUSxZQUFXQSxTQUFVLGlCQUFnQkEsU0FBVSxHQUF2RDs7QUFDSjtBQUNJLGVBQU8sRUFBUDtBQVJKO0FBVUg7O0FBRURLLEVBQUFBLG9CQUFvQixDQUNoQm5CLE1BRGdCLEVBRWhCVyxNQUZnQixFQUdoQmIsWUFIZ0IsRUFJVDtBQUNQLFVBQU1zQixnQkFBZ0IsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVl0QixNQUFaLEVBQW9CYSxNQUFwQixHQUE2QixDQUE3QixHQUNuQixLQUFLN0UsT0FBTCxDQUFhdUYsZUFBYixDQUE2QlosTUFBN0IsRUFBcUMsS0FBckMsRUFBNENYLE1BQTVDLENBRG1CLEdBRW5CLEVBRk47QUFHQSxVQUFNd0IsbUJBQW1CLEdBQUcsS0FBS2Qsc0JBQUwsQ0FBNEJaLFlBQTVCLEVBQTBDYSxNQUExQyxDQUE1Qjs7QUFDQSxRQUFJUyxnQkFBZ0IsS0FBSyxPQUFyQixJQUFnQ0ksbUJBQW1CLEtBQUssT0FBNUQsRUFBcUU7QUFDakUsYUFBTyxJQUFQO0FBQ0g7O0FBQ0QsV0FBUUosZ0JBQWdCLElBQUlJLG1CQUFyQixHQUNBLElBQUdKLGdCQUFpQixVQUFTSSxtQkFBb0IsR0FEakQsR0FFQUosZ0JBQWdCLElBQUlJLG1CQUYzQjtBQUlIOztBQUVEQyxFQUFBQSxxQkFBcUIsQ0FBQ0MsVUFBRCxFQUFvQztBQUNyRCxVQUFNQyxXQUFXLEdBQUcsSUFBSXBELEdBQUosRUFBcEI7QUFDQW9ELElBQUFBLFdBQVcsQ0FBQ0MsR0FBWixDQUFnQixNQUFoQixFQUF3QixVQUF4QjtBQUNBLFVBQU1DLE1BQU0sR0FBRyxLQUFLN0YsT0FBTCxDQUFhNkYsTUFBNUI7O0FBQ0EsUUFBSUgsVUFBVSxJQUFJRyxNQUFsQixFQUEwQjtBQUN0Qiw2Q0FBeUJGLFdBQXpCLEVBQXNDLEtBQXRDLEVBQTZDRCxVQUE3QyxFQUF5REcsTUFBekQ7QUFDSDs7QUFDREYsSUFBQUEsV0FBVyxDQUFDRyxNQUFaLENBQW1CLElBQW5CO0FBQ0EsV0FBTyx1Q0FBeUJILFdBQXpCLENBQVA7QUFDSDs7QUFFREksRUFBQUEsbUJBQW1CLENBQ2Y5RyxJQURlLEVBUWYrRyxhQVJlLEVBU2ZsQyxZQVRlLEVBVUQ7QUFDZCxVQUFNRSxNQUFNLEdBQUcvRSxJQUFJLENBQUMrRSxNQUFMLElBQWUsRUFBOUI7QUFDQSxVQUFNVyxNQUFNLEdBQUcsSUFBSXNCLGdCQUFKLEVBQWY7QUFDQSxVQUFNbkIsU0FBUyxHQUFHLEtBQUtLLG9CQUFMLENBQTBCbkIsTUFBMUIsRUFBa0NXLE1BQWxDLEVBQTBDYixZQUExQyxDQUFsQjs7QUFDQSxRQUFJZ0IsU0FBUyxLQUFLLElBQWxCLEVBQXdCO0FBQ3BCLGFBQU8sSUFBUDtBQUNIOztBQUNELFVBQU1vQixhQUFhLEdBQUdwQixTQUFTLEdBQUksVUFBU0EsU0FBVSxFQUF2QixHQUEyQixFQUExRDtBQUNBLFVBQU1xQixTQUFTLEdBQUdILGFBQWEsQ0FBQ04sVUFBZCxHQUNaLGdDQUFrQk0sYUFBbEIsRUFBaUMsS0FBS2pHLElBQXRDLENBRFksR0FFWmlHLGFBRk47QUFHQSxVQUFNSSxPQUFrQixHQUFHbkgsSUFBSSxDQUFDbUgsT0FBTCxJQUFnQixFQUEzQztBQUNBLFVBQU1DLEtBQWEsR0FBR3BILElBQUksQ0FBQ29ILEtBQUwsSUFBYyxFQUFwQztBQUNBLFVBQU1DLE9BQU8sR0FBR0MsTUFBTSxDQUFDdEgsSUFBSSxDQUFDcUgsT0FBTixDQUFOLElBQXdCLENBQXhDO0FBQ0EsVUFBTUUsV0FBVyxHQUFHSixPQUFPLENBQ3RCcEIsR0FEZSxDQUNWeUIsS0FBRCxJQUFXO0FBQ1osWUFBTUMsU0FBUyxHQUFJRCxLQUFLLENBQUNDLFNBQU4sSUFBbUJELEtBQUssQ0FBQ0MsU0FBTixDQUFnQkMsV0FBaEIsT0FBa0MsTUFBdEQsR0FDWixPQURZLEdBRVosRUFGTjtBQUdBLGFBQVEsT0FBTUYsS0FBSyxDQUFDRyxJQUFOLENBQVdDLE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsTUFBL0IsQ0FBdUMsR0FBRUgsU0FBVSxFQUFqRTtBQUNILEtBTmUsRUFPZnhCLElBUGUsQ0FPVixJQVBVLENBQXBCO0FBU0EsVUFBTTRCLFdBQVcsR0FBR04sV0FBVyxLQUFLLEVBQWhCLEdBQXNCLFFBQU9BLFdBQVksRUFBekMsR0FBNkMsRUFBakU7QUFDQSxVQUFNTyxTQUFTLEdBQUd2QyxJQUFJLENBQUN3QyxHQUFMLENBQVNYLEtBQVQsRUFBZ0IsRUFBaEIsQ0FBbEI7QUFDQSxVQUFNWSxZQUFZLEdBQUksU0FBUUYsU0FBVSxFQUF4QztBQUNBLFVBQU1HLGdCQUFnQixHQUFHLEtBQUt6QixxQkFBTCxDQUEyQk8sYUFBYSxDQUFDTixVQUF6QyxDQUF6QjtBQUNBLFVBQU15QixJQUFJLEdBQUk7eUJBQ0csS0FBS3BILElBQUs7Y0FDckJtRyxhQUFjO2NBQ2RZLFdBQVk7Y0FDWkcsWUFBYTtxQkFDTkMsZ0JBQWlCLEVBTDlCO0FBT0EsV0FBTztBQUNIbEQsTUFBQUEsTUFERztBQUVIbUMsTUFBQUEsU0FGRztBQUdIQyxNQUFBQSxPQUhHO0FBSUhDLE1BQUFBLEtBSkc7QUFLSEMsTUFBQUEsT0FMRztBQU1IYyxNQUFBQSxXQUFXLEVBQUVuSSxJQUFJLENBQUNtSSxXQUFMLElBQW9CLElBTjlCO0FBT0hELE1BQUFBLElBUEc7QUFRSHhDLE1BQUFBLE1BQU0sRUFBRUEsTUFBTSxDQUFDMEMsTUFSWjtBQVNIdkQsTUFBQUE7QUFURyxLQUFQO0FBV0g7O0FBRUQsUUFBTXdELFdBQU4sQ0FDSUgsSUFESixFQUVJbkQsTUFGSixFQUdJb0MsT0FISixFQUlvQjtBQUNoQixVQUFNLEtBQUttQixnQkFBTCxFQUFOO0FBQ0EsUUFBSUMsT0FBTyxHQUFHTCxJQUFkOztBQUNBLFFBQUlmLE9BQU8sSUFBSUEsT0FBTyxDQUFDdkIsTUFBUixHQUFpQixDQUFoQyxFQUFtQztBQUMvQjJDLE1BQUFBLE9BQU8sR0FBSSxHQUFFQSxPQUFRLEdBQUVwQixPQUFPLENBQUNwQixHQUFSLENBQVlDLENBQUMsSUFBSyxHQUFFQSxDQUFDLENBQUMyQixJQUFLLElBQUczQixDQUFDLENBQUN5QixTQUFVLEVBQTFDLEVBQTZDeEIsSUFBN0MsQ0FBa0QsR0FBbEQsQ0FBdUQsRUFBOUU7QUFDSDs7QUFDRCxVQUFNdUMsWUFBWSxHQUFHLEtBQUtuRixVQUFMLENBQWdCb0YsR0FBaEIsQ0FBb0JGLE9BQXBCLENBQXJCOztBQUNBLFFBQUlDLFlBQVksS0FBS0UsU0FBckIsRUFBZ0M7QUFDNUIsYUFBT0YsWUFBWSxDQUFDRyxNQUFwQjtBQUNIOztBQUNELFVBQU1DLElBQUksR0FBRztBQUNURCxNQUFBQSxNQUFNLEVBQUUsK0JBQVksS0FBSzdILElBQWpCLEVBQXVCLEtBQUtHLE9BQTVCLEVBQXFDLEtBQUtGLE9BQTFDLEVBQW1EZ0UsTUFBbkQsRUFBMkRvQyxPQUFPLElBQUksRUFBdEUsRUFBMEUwQixPQUExRTtBQURDLEtBQWI7QUFHQSxTQUFLeEYsVUFBTCxDQUFnQnNELEdBQWhCLENBQW9CNEIsT0FBcEIsRUFBNkJLLElBQTdCO0FBQ0EsV0FBT0EsSUFBSSxDQUFDRCxNQUFaO0FBQ0g7O0FBRURHLEVBQUFBLGFBQWEsR0FBRztBQUNaLFdBQU8sT0FDSEMsTUFERyxFQUVIL0ksSUFGRyxFQUdITCxPQUhHLEVBSUhpRixJQUpHLEtBS0YsaUJBQUssS0FBS3JELEdBQVYsRUFBZSxPQUFmLEVBQXdCdkIsSUFBeEIsRUFBOEIsWUFBWTtBQUMzQyxXQUFLb0MsU0FBTCxDQUFlMEIsU0FBZjtBQUNBLFdBQUtyQixlQUFMLENBQXFCcUIsU0FBckI7QUFDQSxZQUFNa0YsS0FBSyxHQUFHN0gsSUFBSSxDQUFDQyxHQUFMLEVBQWQ7O0FBQ0EsVUFBSTtBQUNBLGNBQU15RCxZQUFZLEdBQUcsTUFBTTlFLG9CQUFvQixDQUFDSixPQUFELEVBQVVLLElBQVYsQ0FBL0M7QUFDQSxjQUFNaUosQ0FBQyxHQUFHLEtBQUtuQyxtQkFBTCxDQUF5QjlHLElBQXpCLEVBQStCNEUsSUFBSSxDQUFDc0UsVUFBTCxDQUFnQixDQUFoQixFQUFtQmpFLFlBQWxELEVBQWdFSixZQUFoRSxDQUFWOztBQUNBLFlBQUksQ0FBQ29FLENBQUwsRUFBUTtBQUNKLGVBQUsxSCxHQUFMLENBQVM0SCxLQUFULENBQWUsT0FBZixFQUF3Qm5KLElBQXhCLEVBQThCLENBQTlCLEVBQWlDLFNBQWpDLEVBQTRDTCxPQUFPLENBQUN5SixhQUFwRDtBQUNBLGlCQUFPLEVBQVA7QUFDSDs7QUFDRCxZQUFJVCxNQUFNLEdBQUcsTUFBTSxLQUFLTixXQUFMLENBQWlCWSxDQUFDLENBQUNmLElBQW5CLEVBQXlCZSxDQUFDLENBQUNsRSxNQUEzQixFQUFtQ2tFLENBQUMsQ0FBQzlCLE9BQXJDLENBQW5COztBQUNBLFlBQUksQ0FBQ3dCLE1BQUwsRUFBYTtBQUNULGVBQUs3RixhQUFMLENBQW1CZ0IsU0FBbkI7QUFDSDs7QUFDRCxjQUFNdUYsV0FBZ0IsR0FBRztBQUNyQnRFLFVBQUFBLE1BQU0sRUFBRWtFLENBQUMsQ0FBQ2xFLE1BRFc7QUFFckJtQyxVQUFBQSxTQUFTLEVBQUUsZ0NBQWtCK0IsQ0FBQyxDQUFDL0IsU0FBcEI7QUFGVSxTQUF6Qjs7QUFJQSxZQUFJK0IsQ0FBQyxDQUFDOUIsT0FBRixDQUFVdkIsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN0QnlELFVBQUFBLFdBQVcsQ0FBQ2xDLE9BQVosR0FBc0I4QixDQUFDLENBQUM5QixPQUF4QjtBQUNIOztBQUNELFlBQUk4QixDQUFDLENBQUM3QixLQUFGLEtBQVksRUFBaEIsRUFBb0I7QUFDaEJpQyxVQUFBQSxXQUFXLENBQUNqQyxLQUFaLEdBQW9CNkIsQ0FBQyxDQUFDN0IsS0FBdEI7QUFDSDs7QUFDRCxZQUFJNkIsQ0FBQyxDQUFDNUIsT0FBRixHQUFZLENBQWhCLEVBQW1CO0FBQ2ZnQyxVQUFBQSxXQUFXLENBQUNoQyxPQUFaLEdBQXNCNEIsQ0FBQyxDQUFDNUIsT0FBeEI7QUFDSDs7QUFDRCxjQUFNMkIsS0FBSyxHQUFHN0gsSUFBSSxDQUFDQyxHQUFMLEVBQWQ7QUFDQSxjQUFNa0ksTUFBTSxHQUFHTCxDQUFDLENBQUM1QixPQUFGLEdBQVksQ0FBWixHQUNULE1BQU0sS0FBS2tDLFlBQUwsQ0FBa0JOLENBQWxCLEVBQXFCTixNQUFyQixFQUE2QlUsV0FBN0IsRUFBMEMxSixPQUExQyxDQURHLEdBRVQsTUFBTSxLQUFLMEMsS0FBTCxDQUFXNEcsQ0FBQyxDQUFDZixJQUFiLEVBQW1CZSxDQUFDLENBQUN2RCxNQUFyQixFQUE2QnVELENBQUMsQ0FBQzlCLE9BQS9CLEVBQXdDd0IsTUFBeEMsRUFBZ0RVLFdBQWhELEVBQTZEMUosT0FBN0QsQ0FGWjtBQUdBLGFBQUs0QixHQUFMLENBQVM0SCxLQUFULENBQ0ksT0FESixFQUVJbkosSUFGSixFQUdJLENBQUNtQixJQUFJLENBQUNDLEdBQUwsS0FBYTRILEtBQWQsSUFBdUIsSUFIM0IsRUFJSUwsTUFBTSxHQUFHLE1BQUgsR0FBWSxNQUp0QixFQUk4QmhKLE9BQU8sQ0FBQ3lKLGFBSnRDOztBQU1BLFlBQUlFLE1BQU0sQ0FBQzFELE1BQVAsR0FBZ0JxRCxDQUFDLENBQUM3QixLQUF0QixFQUE2QjtBQUN6QmtDLFVBQUFBLE1BQU0sQ0FBQ0UsTUFBUCxDQUFjUCxDQUFDLENBQUM3QixLQUFoQjtBQUNIOztBQUNELGVBQU9rQyxNQUFQO0FBQ0gsT0F0Q0QsQ0FzQ0UsT0FBT0csS0FBUCxFQUFjO0FBQ1osYUFBSzdHLGVBQUwsQ0FBcUJrQixTQUFyQjtBQUNBLGNBQU0yRixLQUFOO0FBQ0gsT0F6Q0QsU0F5Q1U7QUFDTixhQUFLbkgsYUFBTCxDQUFtQm9ILE1BQW5CLENBQTBCdkksSUFBSSxDQUFDQyxHQUFMLEtBQWE0SCxLQUF2QztBQUNBLGFBQUt2RyxlQUFMLENBQXFCa0gsU0FBckI7QUFDQWhLLFFBQUFBLE9BQU8sQ0FBQ2lLLE9BQVIsQ0FBZ0J0SyxNQUFoQjtBQUNIO0FBQ0osS0FsREksQ0FMTDtBQXdESDs7QUFFRCxRQUFNK0MsS0FBTixDQUNJNkYsSUFESixFQUVJMkIsSUFGSixFQUdJMUMsT0FISixFQUlJd0IsTUFKSixFQUtJVSxXQUxKLEVBTUkxSixPQU5KLEVBT2dCO0FBQ1osV0FBTzJFLGdCQUFRd0YsS0FBUixDQUFjLEtBQUtwSSxNQUFuQixFQUE0QixHQUFFLEtBQUtaLElBQUssUUFBeEMsRUFBaUQsTUFBT3FELElBQVAsSUFBc0I7QUFDMUUsVUFBSWtGLFdBQUosRUFBaUI7QUFDYmxGLFFBQUFBLElBQUksQ0FBQzRGLE1BQUwsQ0FBWSxRQUFaLEVBQXNCVixXQUF0QjtBQUNIOztBQUNELGFBQU8sS0FBS1csYUFBTCxDQUFtQjlCLElBQW5CLEVBQXlCMkIsSUFBekIsRUFBK0IxQyxPQUEvQixFQUF3Q3dCLE1BQXhDLEVBQWdEaEosT0FBaEQsQ0FBUDtBQUNILEtBTE0sRUFLSkEsT0FBTyxDQUFDc0ssVUFMSixDQUFQO0FBTUg7O0FBRUQsUUFBTUQsYUFBTixDQUNJOUIsSUFESixFQUVJMkIsSUFGSixFQUdJMUMsT0FISixFQUlJd0IsTUFKSixFQUtJaEosT0FMSixFQU1nQjtBQUNaLFVBQU0wQixRQUFRLEdBQUdzSCxNQUFNLEdBQUcsS0FBS3RILFFBQVIsR0FBbUIsS0FBS0MsbUJBQS9DO0FBQ0EsV0FBT0QsUUFBUSxDQUFDZ0IsS0FBVCxDQUFlNkYsSUFBZixFQUFxQjJCLElBQXJCLEVBQTJCMUMsT0FBM0IsQ0FBUDtBQUNIOztBQUdELFFBQU1vQyxZQUFOLENBQ0lOLENBREosRUFFSU4sTUFGSixFQUdJVSxXQUhKLEVBSUkxSixPQUpKLEVBS2dCO0FBQ1osV0FBTzJFLGdCQUFRd0YsS0FBUixDQUFjLEtBQUtwSSxNQUFuQixFQUE0QixHQUFFLEtBQUtaLElBQUssVUFBeEMsRUFBbUQsTUFBT3FELElBQVAsSUFBc0I7QUFDNUUsVUFBSWtGLFdBQUosRUFBaUI7QUFDYmxGLFFBQUFBLElBQUksQ0FBQzRGLE1BQUwsQ0FBWSxRQUFaLEVBQXNCVixXQUF0QjtBQUNIOztBQUNELFVBQUlwRyxPQUE4QixHQUFHLElBQXJDO0FBQ0EsVUFBSWlILFlBQXdCLEdBQUcsSUFBL0I7QUFDQSxVQUFJQyxVQUFtQixHQUFHLElBQTFCOztBQUNBLFVBQUlDLGNBQWMsR0FBRyxNQUFNLENBQzFCLENBREQ7O0FBRUEsWUFBTUMsU0FBUyxHQUFHLENBQUNDLE1BQUQsRUFBaUJDLE9BQWpCLEVBQWlEakIsTUFBakQsS0FBaUU7QUFDL0UsWUFBSSxDQUFDYSxVQUFMLEVBQWlCO0FBQ2JBLFVBQUFBLFVBQVUsR0FBR0csTUFBYjtBQUNBQyxVQUFBQSxPQUFPLENBQUNqQixNQUFELENBQVA7QUFDSDtBQUNKLE9BTEQ7O0FBTUEzSixNQUFBQSxPQUFPLENBQUNpSyxPQUFSLENBQWdCM0ssTUFBaEIsQ0FBdUJtRyxFQUF2QixDQUEwQnhHLFlBQVksQ0FBQ0MsS0FBdkMsRUFBOEMsTUFBTTtBQUNoRHdMLFFBQUFBLFNBQVMsQ0FBQyxPQUFELEVBQVVELGNBQVYsRUFBMEIsRUFBMUIsQ0FBVDtBQUNILE9BRkQ7O0FBR0EsVUFBSTtBQUNBLGNBQU1JLE9BQU8sR0FBRyxJQUFJQyxPQUFKLENBQVksQ0FBQ0YsT0FBRCxFQUFVRyxNQUFWLEtBQXFCO0FBQzdDLGdCQUFNQyxLQUFLLEdBQUcsTUFBTTtBQUNoQixpQkFBS1gsYUFBTCxDQUFtQmYsQ0FBQyxDQUFDZixJQUFyQixFQUEyQmUsQ0FBQyxDQUFDdkQsTUFBN0IsRUFBcUN1RCxDQUFDLENBQUM5QixPQUF2QyxFQUFnRHdCLE1BQWhELEVBQXdEaEosT0FBeEQsRUFBaUVpTCxJQUFqRSxDQUF1RUMsSUFBRCxJQUFVO0FBQzVFLGtCQUFJLENBQUNWLFVBQUwsRUFBaUI7QUFDYixvQkFBSVUsSUFBSSxDQUFDakYsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCc0Usa0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0FHLGtCQUFBQSxTQUFTLENBQUMsT0FBRCxFQUFVRSxPQUFWLEVBQW1CTSxJQUFuQixDQUFUO0FBQ0gsaUJBSEQsTUFHTztBQUNIWCxrQkFBQUEsWUFBWSxHQUFHWSxVQUFVLENBQUNILEtBQUQsRUFBUSxJQUFSLENBQXpCO0FBQ0g7QUFDSjtBQUNKLGFBVEQsRUFTR0QsTUFUSDtBQVVILFdBWEQ7O0FBWUFDLFVBQUFBLEtBQUs7QUFDUixTQWRlLENBQWhCO0FBZUEsY0FBTUksYUFBYSxHQUFHLElBQUlOLE9BQUosQ0FBYUYsT0FBRCxJQUFhO0FBQzNDLGdCQUFNUyxVQUFVLEdBQUdDLHdCQUFjQyxhQUFkLENBQTRCLEtBQUtwSyxJQUFqQyxFQUF1Q21JLENBQUMsQ0FBQ3BFLFlBQXpDLENBQW5COztBQUNBNUIsVUFBQUEsT0FBTyxHQUFJZixHQUFELElBQVM7QUFDZixnQkFBSThJLFVBQVUsSUFBSSxDQUFDQSxVQUFVLENBQUM5SSxHQUFELENBQTdCLEVBQW9DO0FBQ2hDO0FBQ0g7O0FBQ0QsZ0JBQUksS0FBS25CLE9BQUwsQ0FBYW9LLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0JqSixHQUF4QixFQUE2QitHLENBQUMsQ0FBQ2xFLE1BQS9CLENBQUosRUFBNEM7QUFDeENzRixjQUFBQSxTQUFTLENBQUMsVUFBRCxFQUFhRSxPQUFiLEVBQXNCLENBQUNySSxHQUFELENBQXRCLENBQVQ7QUFDSDtBQUNKLFdBUEQ7O0FBUUEsZUFBS04sWUFBTCxJQUFxQixDQUFyQjtBQUNBLGVBQUt3QixpQkFBTCxDQUF1QmdDLEVBQXZCLENBQTBCLEtBQTFCLEVBQWlDbkMsT0FBakM7QUFDQSxlQUFLRCxpQkFBTCxDQUF1QmMsU0FBdkI7QUFDSCxTQWJxQixDQUF0QjtBQWNBLGNBQU1zSCxTQUFTLEdBQUcsSUFBSVgsT0FBSixDQUFhRixPQUFELElBQWE7QUFDdkNPLFVBQUFBLFVBQVUsQ0FBQyxNQUFNVCxTQUFTLENBQUMsU0FBRCxFQUFZRSxPQUFaLEVBQXFCLEVBQXJCLENBQWhCLEVBQTBDdEIsQ0FBQyxDQUFDNUIsT0FBNUMsQ0FBVjtBQUNILFNBRmlCLENBQWxCO0FBR0EsY0FBTWhDLE9BQU8sR0FBRyxJQUFJb0YsT0FBSixDQUFhRixPQUFELElBQWE7QUFDckNILFVBQUFBLGNBQWMsR0FBR0csT0FBakI7QUFDSCxTQUZlLENBQWhCO0FBR0EsY0FBTWpCLE1BQU0sR0FBRyxNQUFNbUIsT0FBTyxDQUFDWSxJQUFSLENBQWEsQ0FDOUJiLE9BRDhCLEVBRTlCTyxhQUY4QixFQUc5QkssU0FIOEIsRUFJOUIvRixPQUo4QixDQUFiLENBQXJCO0FBTUFsQixRQUFBQSxJQUFJLENBQUM0RixNQUFMLENBQVksVUFBWixFQUF3QkksVUFBeEI7QUFDQSxlQUFPYixNQUFQO0FBQ0gsT0E1Q0QsU0E0Q1U7QUFDTixZQUFJckcsT0FBTyxLQUFLLElBQVosSUFBb0JBLE9BQU8sS0FBS3lGLFNBQXBDLEVBQStDO0FBQzNDLGVBQUs5RyxZQUFMLEdBQW9CMkQsSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQUs1RCxZQUFMLEdBQW9CLENBQWhDLENBQXBCO0FBQ0EsZUFBS3dCLGlCQUFMLENBQXVCa0MsY0FBdkIsQ0FBc0MsS0FBdEMsRUFBNkNyQyxPQUE3QztBQUNBQSxVQUFBQSxPQUFPLEdBQUcsSUFBVjtBQUNBLGVBQUtELGlCQUFMLENBQXVCMkcsU0FBdkI7QUFDSDs7QUFDRCxZQUFJTyxZQUFZLEtBQUssSUFBckIsRUFBMkI7QUFDdkJvQixVQUFBQSxZQUFZLENBQUNwQixZQUFELENBQVo7QUFDQUEsVUFBQUEsWUFBWSxHQUFHLElBQWY7QUFDSDtBQUNKO0FBQ0osS0ExRU0sRUEwRUp2SyxPQUFPLENBQUNzSyxVQTFFSixDQUFQO0FBMkVILEdBdGF3QixDQXdhekI7OztBQUdBc0IsRUFBQUEsc0JBQXNCLENBQ2xCeEcsTUFEa0IsRUFFbEI2QixNQUZrQixFQUdsQi9CLFlBSGtCLEVBUXBCO0FBQ0UsVUFBTWEsTUFBTSxHQUFHLElBQUlzQixnQkFBSixFQUFmO0FBQ0EsVUFBTW5CLFNBQVMsR0FBRyxLQUFLSyxvQkFBTCxDQUEwQm5CLE1BQTFCLEVBQWtDVyxNQUFsQyxFQUEwQ2IsWUFBMUMsQ0FBbEI7O0FBQ0EsUUFBSWdCLFNBQVMsS0FBSyxJQUFsQixFQUF3QjtBQUNwQixhQUFPLElBQVA7QUFDSDs7QUFDRCxVQUFNeEQsS0FBSyxHQUFHbUosdUNBQXlCQyxXQUF6QixDQUFxQyxLQUFLM0ssSUFBMUMsRUFBZ0QrRSxTQUFTLElBQUksRUFBN0QsRUFBaUVlLE1BQWpFLENBQWQ7O0FBQ0EsV0FBTztBQUNIc0IsTUFBQUEsSUFBSSxFQUFFN0YsS0FBSyxDQUFDNkYsSUFEVDtBQUVIeEMsTUFBQUEsTUFBTSxFQUFFQSxNQUFNLENBQUMwQyxNQUZaO0FBR0hzRCxNQUFBQSxPQUFPLEVBQUVySixLQUFLLENBQUNxSjtBQUhaLEtBQVA7QUFLSDs7QUFFRCxRQUFNQyxzQkFBTixDQUNJekQsSUFESixFQUVJbkQsTUFGSixFQUdJMkcsT0FISixFQUlvQjtBQUNoQixTQUFLLE1BQU1FLENBQVgsSUFBbUNGLE9BQW5DLEVBQTRDO0FBQ3hDLFlBQU1HLENBQUMsR0FBR0QsQ0FBQyxDQUFDak0sT0FBWjs7QUFDQSxVQUFJa00sQ0FBQyxDQUFDQyxFQUFGLEtBQVNDLDRCQUFjQyxLQUEzQixFQUFrQztBQUM5QixZQUFJLEVBQUUsTUFBTSxLQUFLM0QsV0FBTCxDQUFpQkgsSUFBakIsRUFBdUJuRCxNQUF2QixDQUFSLENBQUosRUFBNkM7QUFDekMsaUJBQU8sS0FBUDtBQUNIO0FBQ0osT0FKRCxNQUlPLElBQUk4RyxDQUFDLENBQUNDLEVBQUYsS0FBU0MsNEJBQWNFLEdBQXZCLElBQThCSixDQUFDLENBQUNDLEVBQUYsS0FBU0MsNEJBQWNHLEdBQXpELEVBQThEO0FBQ2pFLFlBQUl2RSxJQUFJLEdBQUdrRSxDQUFDLENBQUNyRSxLQUFGLENBQVFHLElBQW5COztBQUNBLFlBQUlBLElBQUksQ0FBQ3dFLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBSixFQUE2QjtBQUN6QnhFLFVBQUFBLElBQUksR0FBR0EsSUFBSSxDQUFDeUUsTUFBTCxDQUFZLE9BQU94RyxNQUFuQixDQUFQO0FBQ0g7O0FBQ0QsWUFBSSxFQUFFLE1BQU0sS0FBS3lDLFdBQUwsQ0FDUkgsSUFEUSxFQUVSbkQsTUFGUSxFQUdSLENBQ0k7QUFDSTRDLFVBQUFBLElBREo7QUFFSUYsVUFBQUEsU0FBUyxFQUFFO0FBRmYsU0FESixDQUhRLENBQVIsQ0FBSixFQVNJO0FBQ0EsaUJBQU8sS0FBUDtBQUNIO0FBQ0o7QUFDSjs7QUFDRCxXQUFPLElBQVA7QUFDSDs7QUFFRDRFLEVBQUFBLG1CQUFtQixHQUFHO0FBQ2xCLFdBQU8sT0FDSHRELE1BREcsRUFFSC9JLElBRkcsRUFHSEwsT0FIRyxLQUlGLGlCQUFLLEtBQUs0QixHQUFWLEVBQWUsV0FBZixFQUE0QnZCLElBQTVCLEVBQWtDLFlBQVk7QUFDL0MsV0FBS29DLFNBQUwsQ0FBZTBCLFNBQWY7QUFDQSxXQUFLckIsZUFBTCxDQUFxQnFCLFNBQXJCO0FBQ0EsWUFBTWtGLEtBQUssR0FBRzdILElBQUksQ0FBQ0MsR0FBTCxFQUFkOztBQUNBLFVBQUk7QUFDQSxjQUFNeUQsWUFBWSxHQUFHLE1BQU05RSxvQkFBb0IsQ0FBQ0osT0FBRCxFQUFVSyxJQUFWLENBQS9DO0FBQ0EsY0FBTStFLE1BQU0sR0FBRy9FLElBQUksQ0FBQytFLE1BQUwsSUFBZSxFQUE5QjtBQUNBLGNBQU02QixNQUFNLEdBQUcwRixLQUFLLENBQUNDLE9BQU4sQ0FBY3ZNLElBQUksQ0FBQzRHLE1BQW5CLEtBQThCNUcsSUFBSSxDQUFDNEcsTUFBTCxDQUFZaEIsTUFBWixHQUFxQixDQUFuRCxHQUNUNUYsSUFBSSxDQUFDNEcsTUFESSxHQUVULENBQ0U7QUFDSVksVUFBQUEsS0FBSyxFQUFFLEVBRFg7QUFFSXNFLFVBQUFBLEVBQUUsRUFBRUMsNEJBQWNDO0FBRnRCLFNBREYsQ0FGTjtBQVNBLGNBQU0vQyxDQUFDLEdBQUcsS0FBS3NDLHNCQUFMLENBQTRCeEcsTUFBNUIsRUFBb0M2QixNQUFwQyxFQUE0Qy9CLFlBQTVDLENBQVY7O0FBQ0EsWUFBSSxDQUFDb0UsQ0FBTCxFQUFRO0FBQ0osZUFBSzFILEdBQUwsQ0FBUzRILEtBQVQsQ0FBZSxXQUFmLEVBQTRCbkosSUFBNUIsRUFBa0MsQ0FBbEMsRUFBcUMsU0FBckMsRUFBZ0RMLE9BQU8sQ0FBQ3lKLGFBQXhEO0FBQ0EsaUJBQU8sRUFBUDtBQUNIOztBQUNELGNBQU1ULE1BQU0sR0FBRyxNQUFNLEtBQUtnRCxzQkFBTCxDQUE0QjFDLENBQUMsQ0FBQ2YsSUFBOUIsRUFBb0NuRCxNQUFwQyxFQUE0Q2tFLENBQUMsQ0FBQ3lDLE9BQTlDLENBQXJCO0FBQ0EsY0FBTTFDLEtBQUssR0FBRzdILElBQUksQ0FBQ0MsR0FBTCxFQUFkO0FBQ0EsY0FBTWtJLE1BQU0sR0FBRyxNQUFNLEtBQUtVLGFBQUwsQ0FBbUJmLENBQUMsQ0FBQ2YsSUFBckIsRUFBMkJlLENBQUMsQ0FBQ3ZELE1BQTdCLEVBQXFDLEVBQXJDLEVBQXlDaUQsTUFBekMsRUFBaURoSixPQUFqRCxDQUFyQjtBQUNBLGFBQUs0QixHQUFMLENBQVM0SCxLQUFULENBQ0ksV0FESixFQUVJbkosSUFGSixFQUdJLENBQUNtQixJQUFJLENBQUNDLEdBQUwsS0FBYTRILEtBQWQsSUFBdUIsSUFIM0IsRUFJSUwsTUFBTSxHQUFHLE1BQUgsR0FBWSxNQUp0QixFQUk4QmhKLE9BQU8sQ0FBQ3lKLGFBSnRDO0FBTUEsZUFBT29DLHVDQUF5QmdCLGNBQXpCLENBQXdDbEQsTUFBeEMsRUFBZ0RMLENBQUMsQ0FBQ3lDLE9BQWxELENBQVA7QUFDSCxPQTNCRCxTQTJCVTtBQUNOLGFBQUtwSixhQUFMLENBQW1Cb0gsTUFBbkIsQ0FBMEJ2SSxJQUFJLENBQUNDLEdBQUwsS0FBYTRILEtBQXZDO0FBQ0EsYUFBS3ZHLGVBQUwsQ0FBcUJrSCxTQUFyQjtBQUNIO0FBQ0osS0FuQ0ksQ0FKTDtBQXdDSDs7QUFFRCxRQUFNOEMsVUFBTixHQUEwQztBQUN0QyxXQUFPLEtBQUtwTCxRQUFMLENBQWNxTCxvQkFBZCxDQUFtQyxLQUFLNUwsSUFBeEMsQ0FBUDtBQUNILEdBL2dCd0IsQ0FpaEJ6Qjs7O0FBRUEsUUFBTXdILGdCQUFOLEdBQXlCO0FBQ3JCLFFBQUksS0FBSzNHLE9BQVQsRUFBa0I7QUFDZDtBQUNIOztBQUNELFFBQUlSLElBQUksQ0FBQ0MsR0FBTCxLQUFhLEtBQUtGLGtCQUF0QixFQUEwQztBQUN0QztBQUNIOztBQUNELFNBQUtBLGtCQUFMLEdBQTBCQyxJQUFJLENBQUNDLEdBQUwsS0FBYXpDLHdCQUF2QztBQUNBLFVBQU1nTyxhQUFhLEdBQUcsTUFBTSxLQUFLRixVQUFMLEVBQTVCOztBQUVBLFVBQU1HLFdBQVcsR0FBRyxDQUFDQyxRQUFELEVBQXlCQyxRQUF6QixLQUE2RDtBQUM3RSxZQUFNQyxLQUFLLEdBQUcsSUFBSUMsR0FBSixDQUFRSCxRQUFRLENBQUM5RyxHQUFULENBQWFrSCxzQkFBYixDQUFSLENBQWQ7O0FBQ0EsV0FBSyxNQUFNQyxNQUFYLElBQXFCSixRQUFyQixFQUErQjtBQUMzQixjQUFNSyxZQUFZLEdBQUcsNEJBQWNELE1BQWQsQ0FBckI7O0FBQ0EsWUFBSUgsS0FBSyxDQUFDek0sR0FBTixDQUFVNk0sWUFBVixDQUFKLEVBQTZCO0FBQ3pCSixVQUFBQSxLQUFLLENBQUNsRyxNQUFOLENBQWFzRyxZQUFiO0FBQ0gsU0FGRCxNQUVPO0FBQ0gsaUJBQU8sS0FBUDtBQUNIO0FBQ0o7O0FBQ0QsYUFBT0osS0FBSyxDQUFDSyxJQUFOLEtBQWUsQ0FBdEI7QUFDSCxLQVhEOztBQVlBLFFBQUksQ0FBQ1IsV0FBVyxDQUFDRCxhQUFELEVBQWdCLEtBQUsxTCxPQUFyQixDQUFoQixFQUErQztBQUMzQyxXQUFLTSxHQUFMLENBQVM0SCxLQUFULENBQWUsZ0JBQWYsRUFBaUN3RCxhQUFqQztBQUNBLFdBQUsxTCxPQUFMLEdBQWUwTCxhQUFhLENBQUM1RyxHQUFkLENBQWtCQyxDQUFDLEtBQUs7QUFBRVksUUFBQUEsTUFBTSxFQUFFWixDQUFDLENBQUNZO0FBQVosT0FBTCxDQUFuQixDQUFmO0FBQ0EsV0FBS3ZELFVBQUwsQ0FBZ0JnSyxLQUFoQjtBQUNIO0FBRUo7O0FBRUQsUUFBTUMsVUFBTixDQUNJQyxVQURKLEVBRUlDLFNBRkosRUFHSXhOLElBSEosRUFJSUwsT0FKSixFQUtnQjtBQUNaLFFBQUksQ0FBQzROLFVBQUwsRUFBaUI7QUFDYixhQUFPOUMsT0FBTyxDQUFDRixPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSDs7QUFDRCxVQUFNa0QsV0FBVyxHQUFHRCxTQUFTLENBQUNFLFFBQVYsQ0FBbUIsS0FBbkIsSUFDZDtBQUNFM0ksTUFBQUEsTUFBTSxFQUFFO0FBQUUsU0FBQ3lJLFNBQVMsQ0FBQ0csS0FBVixDQUFnQixDQUFoQixFQUFtQixDQUFDLENBQXBCLENBQUQsR0FBMEI7QUFBRUMsVUFBQUEsR0FBRyxFQUFFO0FBQUVDLFlBQUFBLEVBQUUsRUFBRU47QUFBTjtBQUFQO0FBQTVCLE9BRFY7QUFFRXJGLE1BQUFBLElBQUksRUFBRyxjQUFhLEtBQUtwSCxJQUFLLHFCQUFvQjBNLFNBQVUsYUFGOUQ7QUFHRTlILE1BQUFBLE1BQU0sRUFBRTtBQUFFb0ksUUFBQUEsQ0FBQyxFQUFFUDtBQUFMO0FBSFYsS0FEYyxHQU1kO0FBQ0V4SSxNQUFBQSxNQUFNLEVBQUU7QUFBRWdKLFFBQUFBLEVBQUUsRUFBRTtBQUFFRixVQUFBQSxFQUFFLEVBQUVOO0FBQU47QUFBTixPQURWO0FBRUVyRixNQUFBQSxJQUFJLEVBQUcsY0FBYSxLQUFLcEgsSUFBSyxlQUFjME0sU0FBVSxtQkFGeEQ7QUFHRTlILE1BQUFBLE1BQU0sRUFBRTtBQUFFb0ksUUFBQUEsQ0FBQyxFQUFFUDtBQUFMO0FBSFYsS0FOTjtBQVlBLFVBQU1sRyxPQUFPLEdBQUlySCxJQUFJLENBQUNxSCxPQUFMLEtBQWlCLENBQWxCLEdBQXVCLENBQXZCLEdBQTRCckgsSUFBSSxDQUFDcUgsT0FBTCxJQUFnQixLQUE1RDs7QUFDQSxRQUFJQSxPQUFPLEtBQUssQ0FBaEIsRUFBbUI7QUFDZixZQUFNd0QsSUFBSSxHQUFHLE1BQU0sS0FBS2IsYUFBTCxDQUNmeUQsV0FBVyxDQUFDdkYsSUFERyxFQUVmdUYsV0FBVyxDQUFDL0gsTUFGRyxFQUdmLEVBSGUsRUFJZixJQUplLEVBS2YvRixPQUxlLENBQW5CO0FBT0EsYUFBT2tMLElBQUksQ0FBQyxDQUFELENBQVg7QUFDSDs7QUFFRCxVQUFNQSxJQUFJLEdBQUcsTUFBTSxLQUFLdEIsWUFBTCxDQUFrQjtBQUM3QnhFLE1BQUFBLE1BQU0sRUFBRTBJLFdBQVcsQ0FBQzFJLE1BRFM7QUFFN0JtQyxNQUFBQSxTQUFTLEVBQUUsRUFGa0I7QUFHN0JDLE1BQUFBLE9BQU8sRUFBRSxFQUhvQjtBQUk3QkMsTUFBQUEsS0FBSyxFQUFFLENBSnNCO0FBSzdCQyxNQUFBQSxPQUw2QjtBQU03QmMsTUFBQUEsV0FBVyxFQUFFLElBTmdCO0FBTzdCRCxNQUFBQSxJQUFJLEVBQUV1RixXQUFXLENBQUN2RixJQVBXO0FBUTdCeEMsTUFBQUEsTUFBTSxFQUFFK0gsV0FBVyxDQUFDL0gsTUFSUztBQVM3QmIsTUFBQUEsWUFBWSxFQUFFcEU7QUFUZSxLQUFsQixFQVdmLElBWGUsRUFZZixJQVplLEVBYWZkLE9BYmUsQ0FBbkI7QUFlQSxXQUFPa0wsSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1tRCxXQUFOLENBQ0lDLFdBREosRUFFSVQsU0FGSixFQUdJeE4sSUFISixFQUlJTCxPQUpKLEVBS2tCO0FBQ2QsUUFBSSxDQUFDc08sV0FBRCxJQUFnQkEsV0FBVyxDQUFDckksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPNkUsT0FBTyxDQUFDRixPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRSxPQUFPLENBQUN5RCxHQUFSLENBQVlELFdBQVcsQ0FBQ2xJLEdBQVosQ0FBZ0JvSSxLQUFLLElBQUksS0FBS2IsVUFBTCxDQUFnQmEsS0FBaEIsRUFBdUJYLFNBQXZCLEVBQWtDeE4sSUFBbEMsRUFBd0NMLE9BQXhDLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEeU8sRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQzFJLE1BQWY7QUFDSDs7QUExbkJ3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gJ3Rvbi1jbGllbnQtanMvdHlwZXMnO1xuaW1wb3J0IHsgQWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlciB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgUURhdGFQcm92aWRlciwgUUluZGV4SW5mbyB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgeyBRRGF0YUxpc3RlbmVyLCBRRGF0YVN1YnNjcmlwdGlvbiB9IGZyb20gJy4vbGlzdGVuZXInO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IEF1dGggfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IFNUQVRTIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIEdEZWZpbml0aW9uLCBPcmRlckJ5LCBRVHlwZSwgUXVlcnlTdGF0IH0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHtcbiAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgY29tYmluZVJldHVybkV4cHJlc3Npb25zLFxuICAgIGluZGV4VG9TdHJpbmcsXG4gICAgcGFyc2VTZWxlY3Rpb25TZXQsXG4gICAgUVBhcmFtcyxcbiAgICBzZWxlY3Rpb25Ub1N0cmluZyxcbn0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgeyBpc0Zhc3RRdWVyeSB9IGZyb20gJy4uL2ZpbHRlci9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5jb25zdCBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmV2ZW50cy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cblxuZXhwb3J0IHR5cGUgUUNvbGxlY3Rpb25PcHRpb25zID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtdXRhYmxlOiBib29sZWFuLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXSxcblxuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgbG9nczogUUxvZ3MsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuXG4gICAgaXNUZXN0czogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBRRGF0YUNvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBtdXRhYmxlOiBib29sZWFuO1xuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXTtcbiAgICBpbmRleGVzUmVmcmVzaFRpbWU6IG51bWJlcjtcblxuICAgIC8vIERlcGVuZGVuY2llc1xuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgaXNUZXN0czogYm9vbGVhbjtcblxuICAgIC8vIE93blxuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlGYWlsZWQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcbiAgICBob3RTdWJzY3JpcHRpb246IGFueTtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5tdXRhYmxlID0gb3B0aW9ucy5tdXRhYmxlO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBvcHRpb25zLmluZGV4ZXM7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gb3B0aW9ucy5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyID0gb3B0aW9ucy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICB0aGlzLmxvZyA9IG9wdGlvbnMubG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG9wdGlvbnMuYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBvcHRpb25zLnRyYWNlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuXG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gdGhpcy5wcm92aWRlci5zdWJzY3JpYmUodGhpcy5uYW1lLCBkb2MgPT4gdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKSk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci51bnN1YnNjcmliZSh0aGlzLmhvdFN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcbiAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgaWYgKGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xuICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVByb3ZpZGVyKHRleHQsIHZhcnMsIG9yZGVyQnksIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlT25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9IHJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnY2xvc2UnLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCwgYXJncywgY29udGV4dCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==