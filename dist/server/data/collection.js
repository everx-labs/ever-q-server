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
          try {
            subscription.pushDocument(doc);
          } catch (error) {
            this.log.error(Date.now(), this.name, 'SUBSCRIPTION\tFAILED', JSON.stringify(args.filter), error.toString());
          }
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

            try {
              if (this.docType.test(null, doc, q.filter)) {
                resolveBy('listener', resolve, [doc]);
              }
            } catch (error) {
              this.log.error(Date.now(), this.name, 'QUERY\tFAILED', JSON.stringify(q.filter), error.toString());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwiaW5kZXhlc1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsInByb3ZpZGVyIiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50IiwiZXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwidG9TdHJpbmciLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkRmlsdGVyQ29uZGl0aW9uIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXJDb25kaXRpb24iLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiYnVpbGRSZXR1cm5FeHByZXNzaW9uIiwic2VsZWN0aW9ucyIsImV4cHJlc3Npb25zIiwic2V0IiwiZmllbGRzIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwicmV0dXJuRXhwcmVzc2lvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiY2hlY2tSZWZyZXNoSW5mbyIsInN0YXRLZXkiLCJleGlzdGluZ1N0YXQiLCJnZXQiLCJ1bmRlZmluZWQiLCJpc0Zhc3QiLCJzdGF0IiwiY29uc29sZSIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsInEiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJzcGxpY2UiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsInRyYWNlIiwic2V0VGFnIiwicXVlcnlQcm92aWRlciIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwicmVzb2x2ZU9uQ2xvc2UiLCJyZXNvbHZlQnkiLCJyZWFzb24iLCJyZXNvbHZlIiwib25RdWVyeSIsIlByb21pc2UiLCJyZWplY3QiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiUURhdGFMaXN0ZW5lciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udmVydFJlc3VsdHMiLCJnZXRJbmRleGVzIiwiZ2V0Q29sbGVjdGlvbkluZGV4ZXMiLCJhY3R1YWxJbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBRUE7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBU0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUEzQ0E7Ozs7Ozs7Ozs7Ozs7OztBQTZDQSxNQUFNQSx3QkFBd0IsR0FBRyxLQUFLLEVBQUwsR0FBVSxJQUEzQyxDLENBQWlEOztBQUUxQyxNQUFNQyxZQUFZLEdBQUc7QUFDeEJDLEVBQUFBLEtBQUssRUFBRSxPQURpQjtBQUV4QkMsRUFBQUEsTUFBTSxFQUFFO0FBRmdCLENBQXJCOzs7QUFLQSxNQUFNQyxpQkFBTixDQUF3QjtBQUczQkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGVBQUosRUFBZDtBQUNBLFNBQUtELE1BQUwsQ0FBWUUsZUFBWixDQUE0QixDQUE1QjtBQUNIOztB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QUEvb0J3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gJ3Rvbi1jbGllbnQtanMvdHlwZXMnO1xuaW1wb3J0IHsgQWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlciB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgUURhdGFQcm92aWRlciwgUUluZGV4SW5mbyB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgeyBRRGF0YUxpc3RlbmVyLCBRRGF0YVN1YnNjcmlwdGlvbiB9IGZyb20gJy4vbGlzdGVuZXInO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IEF1dGggfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IFNUQVRTIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIEdEZWZpbml0aW9uLCBPcmRlckJ5LCBRVHlwZSwgUXVlcnlTdGF0IH0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHtcbiAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgY29tYmluZVJldHVybkV4cHJlc3Npb25zLFxuICAgIGluZGV4VG9TdHJpbmcsXG4gICAgcGFyc2VTZWxlY3Rpb25TZXQsXG4gICAgUVBhcmFtcyxcbiAgICBzZWxlY3Rpb25Ub1N0cmluZyxcbn0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgeyBpc0Zhc3RRdWVyeSB9IGZyb20gJy4uL2ZpbHRlci9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5jb25zdCBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmV2ZW50cy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cblxuZXhwb3J0IHR5cGUgUUNvbGxlY3Rpb25PcHRpb25zID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtdXRhYmxlOiBib29sZWFuLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXSxcblxuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgbG9nczogUUxvZ3MsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuXG4gICAgaXNUZXN0czogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBRRGF0YUNvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBtdXRhYmxlOiBib29sZWFuO1xuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXTtcbiAgICBpbmRleGVzUmVmcmVzaFRpbWU6IG51bWJlcjtcblxuICAgIC8vIERlcGVuZGVuY2llc1xuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgaXNUZXN0czogYm9vbGVhbjtcblxuICAgIC8vIE93blxuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlGYWlsZWQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcbiAgICBob3RTdWJzY3JpcHRpb246IGFueTtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5tdXRhYmxlID0gb3B0aW9ucy5tdXRhYmxlO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBvcHRpb25zLmluZGV4ZXM7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gb3B0aW9ucy5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyID0gb3B0aW9ucy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICB0aGlzLmxvZyA9IG9wdGlvbnMubG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG9wdGlvbnMuYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBvcHRpb25zLnRyYWNlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuXG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gdGhpcy5wcm92aWRlci5zdWJzY3JpYmUodGhpcy5uYW1lLCBkb2MgPT4gdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKSk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci51bnN1YnNjcmliZSh0aGlzLmhvdFN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcbiAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgaWYgKGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xuICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdTVUJTQ1JJUFRJT05cXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFyZ3MuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVByb3ZpZGVyKHRleHQsIHZhcnMsIG9yZGVyQnksIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlT25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9IHJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnY2xvc2UnLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgcS5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUVVFUllcXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShxLmZpbHRlciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXNvbHZlQnkoJ3RpbWVvdXQnLCByZXNvbHZlLCBbXSksIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeSA9IEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jcmVhdGVRdWVyeSh0aGlzLm5hbWUsIGNvbmRpdGlvbiB8fCAnJywgZmllbGRzKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRleHQ6IHF1ZXJ5LnRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBoZWxwZXJzOiBxdWVyeS5oZWxwZXJzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGZvciAoY29uc3QgaDogQWdncmVnYXRpb25IZWxwZXIgb2YgaGVscGVycykge1xuICAgICAgICAgICAgY29uc3QgYyA9IGguY29udGV4dDtcbiAgICAgICAgICAgIGlmIChjLmZuID09PSBBZ2dyZWdhdGlvbkZuLkNPVU5UKSB7XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeSh0ZXh0LCBmaWx0ZXIpKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjLmZuID09PSBBZ2dyZWdhdGlvbkZuLk1JTiB8fCBjLmZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgICAgIGxldCBwYXRoID0gYy5maWVsZC5wYXRoO1xuICAgICAgICAgICAgICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoJ2RvYy4nKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoJ2RvYy4nLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkoXG4gICAgICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAnQVNDJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBhZ2dyZWdhdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBBZ2dyZWdhdGlvbkFyZ3MsXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ0FHR1JFR0FURScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoYXJncy5maWVsZHMpICYmIGFyZ3MuZmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhcmdzLmZpZWxkc1xuICAgICAgICAgICAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IEFnZ3JlZ2F0aW9uRm4uQ09VTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlQWdncmVnYXRpb25RdWVyeShmaWx0ZXIsIGZpZWxkcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0FHR1JFR0FURScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkocS50ZXh0LCBmaWx0ZXIsIHEuaGVscGVycyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlcnlQcm92aWRlcihxLnRleHQsIHEucGFyYW1zLCBbXSwgaXNGYXN0LCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNvbnZlcnRSZXN1bHRzKHJlc3VsdCwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRJbmRleGVzKCk6IFByb21pc2U8UUluZGV4SW5mb1tdPiB7XG4gICAgICAgIHJldHVybiB0aGlzLnByb3ZpZGVyLmdldENvbGxlY3Rpb25JbmRleGVzKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSW50ZXJuYWxzXG5cbiAgICBhc3luYyBjaGVja1JlZnJlc2hJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy5pc1Rlc3RzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERhdGUubm93KCkgPCB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKSArIElOREVYRVNfUkVGUkVTSF9JTlRFUlZBTDtcbiAgICAgICAgY29uc3QgYWN0dWFsSW5kZXhlcyA9IGF3YWl0IHRoaXMuZ2V0SW5kZXhlcygpO1xuXG4gICAgICAgIGNvbnN0IHNhbWVJbmRleGVzID0gKGFJbmRleGVzOiBRSW5kZXhJbmZvW10sIGJJbmRleGVzOiBRSW5kZXhJbmZvW10pOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFSZXN0ID0gbmV3IFNldChhSW5kZXhlcy5tYXAoaW5kZXhUb1N0cmluZykpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBiSW5kZXggb2YgYkluZGV4ZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiSW5kZXhTdHJpbmcgPSBpbmRleFRvU3RyaW5nKGJJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGFSZXN0LmhhcyhiSW5kZXhTdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFSZXN0LmRlbGV0ZShiSW5kZXhTdHJpbmcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYVJlc3Quc2l6ZSA9PT0gMDtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFzYW1lSW5kZXhlcyhhY3R1YWxJbmRleGVzLCB0aGlzLmluZGV4ZXMpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUkVMT0FEX0lOREVYRVMnLCBhY3R1YWxJbmRleGVzKTtcbiAgICAgICAgICAgIHRoaXMuaW5kZXhlcyA9IGFjdHVhbEluZGV4ZXMubWFwKHggPT4gKHsgZmllbGRzOiB4LmZpZWxkcyB9KSk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoYXJncy50aW1lb3V0ID09PSAwKSA/IDAgOiAoYXJncy50aW1lb3V0IHx8IDQwMDAwKTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIoXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgW10sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKFxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgsIGFyZ3MsIGNvbnRleHQpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=