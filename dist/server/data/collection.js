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
    this.provider = options.provider;
    this.indexesRefreshTime = Date.now();
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

  explainQueryResolver() {
    return async (parent, args, _context, _info) => {
      await this.checkRefreshInfo();
      const q = this.createDatabaseQuery(args, {}, _auth.grantedAccess);

      if (!q) {
        return {
          isFast: true
        };
      }

      const slowReason = await (0, _slowDetector.explainSlowReason)(this.name, this.indexes, this.docType, q.filter, q.orderBy);
      return {
        isFast: slowReason === null,
        ...(slowReason ? {
          slowReason
        } : {})
      };
    };
  }

  queryResolver() {
    return async (parent, args, context, info) => (0, _utils.wrap)(this.log, 'QUERY', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();
      let q = null;

      try {
        const accessRights = await requireGrantedAccess(context, args);
        q = this.createDatabaseQuery(args, info.fieldNodes[0].selectionSet, accessRights);

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

        this.log.debug('BEFORE_QUERY', args, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        const start = Date.now();
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context) : await this.query(q.text, q.params, q.orderBy, isFast, traceParams, context);
        this.log.debug('QUERY', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);

        if (result.length > q.limit) {
          result.splice(q.limit);
        }

        return result;
      } catch (error) {
        this.statQueryFailed.increment();

        if (q) {
          const slowReason = (0, _slowDetector.explainSlowReason)(this.name, this.indexes, this.docType, q.filter, q.orderBy);

          if (slowReason) {
            error.message += `. Query was detected as a slow. ${slowReason.summary}. See error data for details.`;
            error.data = { ...error.data,
              slowReason
            };
          }
        }

        throw error;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
        context.request.finish();
      }
    });
  }

  async query(text, vars, orderBy, isFast, traceParams, context) {
    const impl = async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      return this.queryProvider(text, vars, orderBy, isFast, context);
    };

    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, impl, context.parentSpan);
  }

  async queryProvider(text, vars, orderBy, isFast, context) {
    const provider = isFast ? this.provider : this.slowQueriesProvider;
    return provider.query(text, vars, orderBy);
  }

  async queryWaitFor(q, isFast, traceParams, context) {
    const impl = async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;
      let hasDbResponse = false;

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
              hasDbResponse = true;

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
        const onTimeout = new Promise((resolve, reject) => {
          setTimeout(() => {
            if (hasDbResponse) {
              resolveBy('timeout', resolve, []);
            } else {
              reject(_utils.QError.queryTerminatedOnTimeout());
            }
          }, q.timeout);
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
    };

    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, impl, context.parentSpan);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwicHJvdmlkZXIiLCJpbmRleGVzUmVmcmVzaFRpbWUiLCJEYXRlIiwibm93Iiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50IiwiZXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwidG9TdHJpbmciLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkRmlsdGVyQ29uZGl0aW9uIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXJDb25kaXRpb24iLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiYnVpbGRSZXR1cm5FeHByZXNzaW9uIiwic2VsZWN0aW9ucyIsImV4cHJlc3Npb25zIiwic2V0IiwiZmllbGRzIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwicmV0dXJuRXhwcmVzc2lvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiY2hlY2tSZWZyZXNoSW5mbyIsInN0YXRLZXkiLCJleGlzdGluZ1N0YXQiLCJnZXQiLCJ1bmRlZmluZWQiLCJpc0Zhc3QiLCJzdGF0IiwiY29uc29sZSIsImV4cGxhaW5RdWVyeVJlc29sdmVyIiwicGFyZW50IiwiX2NvbnRleHQiLCJfaW5mbyIsInEiLCJncmFudGVkQWNjZXNzIiwic2xvd1JlYXNvbiIsInF1ZXJ5UmVzb2x2ZXIiLCJzdGFydCIsImZpZWxkTm9kZXMiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsInNwbGljZSIsIm1lc3NhZ2UiLCJzdW1tYXJ5IiwiZGF0YSIsInJlcG9ydCIsImRlY3JlbWVudCIsInJlcXVlc3QiLCJ2YXJzIiwiaW1wbCIsInNldFRhZyIsInF1ZXJ5UHJvdmlkZXIiLCJ0cmFjZSIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwiaGFzRGJSZXNwb25zZSIsInJlc29sdmVPbkNsb3NlIiwicmVzb2x2ZUJ5IiwicmVhc29uIiwicmVzb2x2ZSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIlFEYXRhTGlzdGVuZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInF1ZXJ5VGVybWluYXRlZE9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IiwiY3JlYXRlUXVlcnkiLCJoZWxwZXJzIiwiaXNGYXN0QWdncmVnYXRpb25RdWVyeSIsImgiLCJjIiwiZm4iLCJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwiYWdncmVnYXRpb25SZXNvbHZlciIsIkFycmF5IiwiaXNBcnJheSIsImNvbnZlcnRSZXN1bHRzIiwiZ2V0SW5kZXhlcyIsImdldENvbGxlY3Rpb25JbmRleGVzIiwiYWN0dWFsSW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJjbGVhciIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwiYWxsIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUVBOztBQUdBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBM0NBOzs7Ozs7Ozs7Ozs7Ozs7QUE2Q0EsTUFBTUEsd0JBQXdCLEdBQUcsS0FBSyxFQUFMLEdBQVUsSUFBM0MsQyxDQUFpRDs7QUFFMUMsTUFBTUMsWUFBWSxHQUFHO0FBQ3hCQyxFQUFBQSxLQUFLLEVBQUUsT0FEaUI7QUFFeEJDLEVBQUFBLE1BQU0s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QUFuQjtBQWdCQSxXQUFPK0wsSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1vRCxXQUFOLENBQ0lDLFdBREosRUFFSVQsU0FGSixFQUdJdE8sSUFISixFQUlJTCxPQUpKLEVBS2tCO0FBQ2QsUUFBSSxDQUFDb1AsV0FBRCxJQUFnQkEsV0FBVyxDQUFDL0ksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPc0YsT0FBTyxDQUFDRixPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRSxPQUFPLENBQUMwRCxHQUFSLENBQVlELFdBQVcsQ0FBQzVJLEdBQVosQ0FBZ0I4SSxLQUFLLElBQUksS0FBS2IsVUFBTCxDQUFnQmEsS0FBaEIsRUFBdUJYLFNBQXZCLEVBQWtDdE8sSUFBbEMsRUFBd0NMLE9BQXhDLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEdVAsRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQ3BKLE1BQWY7QUFDSDs7QUFuc0J3QiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gJ3Rvbi1jbGllbnQtanMvdHlwZXMnO1xuaW1wb3J0IHsgQWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlciB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgUURhdGFQcm92aWRlciwgUUluZGV4SW5mbyB9IGZyb20gJy4vZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgeyBRRGF0YUxpc3RlbmVyLCBRRGF0YVN1YnNjcmlwdGlvbiB9IGZyb20gJy4vbGlzdGVuZXInO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IEF1dGgsIGdyYW50ZWRBY2Nlc3MgfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IFNUQVRTIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIEdEZWZpbml0aW9uLCBPcmRlckJ5LCBRVHlwZSwgUXVlcnlTdGF0IH0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHtcbiAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgY29tYmluZVJldHVybkV4cHJlc3Npb25zLFxuICAgIGluZGV4VG9TdHJpbmcsXG4gICAgcGFyc2VTZWxlY3Rpb25TZXQsXG4gICAgUVBhcmFtcyxcbiAgICBzZWxlY3Rpb25Ub1N0cmluZyxcbn0gZnJvbSAnLi4vZmlsdGVyL2ZpbHRlcnMnO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi4vbG9ncyc7XG5pbXBvcnQgeyBleHBsYWluU2xvd1JlYXNvbiwgaXNGYXN0UXVlcnkgfSBmcm9tICcuLi9maWx0ZXIvc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuY29uc3QgSU5ERVhFU19SRUZSRVNIX0lOVEVSVkFMID0gNjAgKiA2MCAqIDEwMDA7IC8vIDYwIG1pbnV0ZXNcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3RFdmVudCA9IHtcbiAgICBDTE9TRTogJ2Nsb3NlJyxcbiAgICBGSU5JU0g6ICdmaW5pc2gnLFxufTtcblxuZXhwb3J0IGNsYXNzIFJlcXVlc3RDb250cm9sbGVyIHtcbiAgICBldmVudHM6IEV2ZW50RW1pdHRlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5ldmVudHMuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgIH1cblxuICAgIGVtaXRDbG9zZSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xuICAgIH1cblxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuRklOSVNIKTtcbiAgICAgICAgdGhpcy5ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgcmVxdWVzdDogUmVxdWVzdENvbnRyb2xsZXIsXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5cbmV4cG9ydCB0eXBlIFFDb2xsZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgbXV0YWJsZTogYm9vbGVhbixcbiAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW10sXG5cbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcixcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIGxvZ3M6IFFMb2dzLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcblxuICAgIGlzVGVzdHM6IGJvb2xlYW4sXG59O1xuXG5leHBvcnQgY2xhc3MgUURhdGFDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgbXV0YWJsZTogYm9vbGVhbjtcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW107XG4gICAgaW5kZXhlc1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICAvLyBEZXBlbmRlbmNpZXNcbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICAvLyBPd25cbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG4gICAgaG90U3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFDb2xsZWN0aW9uT3B0aW9ucykge1xuICAgICAgICBjb25zdCBuYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBvcHRpb25zLmRvY1R5cGU7XG4gICAgICAgIHRoaXMubXV0YWJsZSA9IG9wdGlvbnMubXV0YWJsZTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gb3B0aW9ucy5pbmRleGVzO1xuXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBvcHRpb25zLnByb3ZpZGVyO1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyID0gb3B0aW9ucy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICB0aGlzLmxvZyA9IG9wdGlvbnMubG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG9wdGlvbnMuYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBvcHRpb25zLnRyYWNlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuXG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gdGhpcy5wcm92aWRlci5zdWJzY3JpYmUodGhpcy5uYW1lLCBkb2MgPT4gdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKSk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci51bnN1YnNjcmliZSh0aGlzLmhvdFN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcbiAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgaWYgKGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xuICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdTVUJTQ1JJUFRJT05cXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFyZ3MuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBleHBsYWluUXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgX2NvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIF9pbmZvOiBhbnksXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIHt9LCBncmFudGVkQWNjZXNzKTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGlzRmFzdDogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGF3YWl0IGV4cGxhaW5TbG93UmVhc29uKHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpc0Zhc3Q6IHNsb3dSZWFzb24gPT09IG51bGwsXG4gICAgICAgICAgICAgICAgLi4uKHNsb3dSZWFzb24gPyB7IHNsb3dSZWFzb24gfSA6IHt9KSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsZXQgcTogP0RhdGFiYXNlUXVlcnkgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8uZmllbGROb2Rlc1swXS5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdCRUZPUkVfUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKHEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGV4cGxhaW5TbG93UmVhc29uKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvd1JlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSArPSBgLiBRdWVyeSB3YXMgZGV0ZWN0ZWQgYXMgYSBzbG93LiAke3Nsb3dSZWFzb24uc3VtbWFyeX0uIFNlZSBlcnJvciBkYXRhIGZvciBkZXRhaWxzLmA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5kYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVycm9yLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xvd1JlYXNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlQcm92aWRlcih0ZXh0LCB2YXJzLCBvcmRlckJ5LCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBoYXNEYlJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZU9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZUJ5ID0gKHJlYXNvbjogc3RyaW5nLCByZXNvbHZlOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSByZWFzb247XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmV2ZW50cy5vbihSZXF1ZXN0RXZlbnQuQ0xPU0UsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2Nsb3NlJywgcmVzb2x2ZU9uQ2xvc2UsIFtdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlQcm92aWRlcihxLnRleHQsIHEucGFyYW1zLCBxLm9yZGVyQnksIGlzRmFzdCwgY29udGV4dCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0RiUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdxdWVyeScsIHJlc29sdmUsIGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IFFEYXRhTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2xpc3RlbmVyJywgcmVzb2x2ZSwgW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1FVRVJZXFx0RkFJTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocS5maWx0ZXIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRGJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgndGltZW91dCcsIHJlc29sdmUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFFFcnJvci5xdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cbiJdfQ==