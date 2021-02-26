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
    this.statSubscription = new _tracer.StatsCounter(stats, _config.STATS.subscription.count, [`collection:${name}`]);
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
        this.statSubscription.increment();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwicHJvdmlkZXIiLCJpbmRleGVzUmVmcmVzaFRpbWUiLCJEYXRlIiwibm93Iiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvbiIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJkb2NJbnNlcnRPclVwZGF0ZSIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJob3RTdWJzY3JpcHRpb24iLCJzdWJzY3JpYmUiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJjbG9zZSIsInVuc3Vic2NyaWJlIiwiZHJvcENhY2hlZERiSW5mbyIsImluY3JlbWVudCIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJleHBsYWluUXVlcnlSZXNvbHZlciIsInBhcmVudCIsIl9jb250ZXh0IiwiX2luZm8iLCJxIiwiZ3JhbnRlZEFjY2VzcyIsInNsb3dSZWFzb24iLCJxdWVyeVJlc29sdmVyIiwic3RhcnQiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJzcGxpY2UiLCJtZXNzYWdlIiwic3VtbWFyeSIsImRhdGEiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsImltcGwiLCJzZXRUYWciLCJxdWVyeVByb3ZpZGVyIiwidHJhY2UiLCJwYXJlbnRTcGFuIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsImhhc0RiUmVzcG9uc2UiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJRRGF0YUxpc3RlbmVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJxdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJjb252ZXJ0UmVzdWx0cyIsImdldEluZGV4ZXMiLCJnZXRDb2xsZWN0aW9uSW5kZXhlcyIsImFjdHVhbEluZGV4ZXMiLCJzYW1lSW5kZXhlcyIsImFJbmRleGVzIiwiYkluZGV4ZXMiLCJhUmVzdCIsIlNldCIsImluZGV4VG9TdHJpbmciLCJiSW5kZXgiLCJiSW5kZXhTdHJpbmciLCJzaXplIiwiY2xlYXIiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsImFsbCIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFFQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFTQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQTNDQTs7Ozs7Ozs7Ozs7Ozs7O0FBNkNBLE1BQU1BLHdCQUF3QixHQUFHLEtBQUssRUFBTCxHQUFVLElBQTNDLEMsQ0FBaUQ7O0FBRTFDLE1BQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFLE9BRGlC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QUFBLFdBQVcsRUFBRSxJQU5qQjtBQU9JRCxNQUFBQSxJQUFJLEVBQUVpRyxXQUFXLENBQUNqRyxJQVB0QjtBQVFJeEMsTUFBQUEsTUFBTSxFQUFFeUksV0FBVyxDQUFDekksTUFSeEI7QUFTSWpCLE1BQUFBLFlBQVksRUFBRXJFO0FBVGxCLEtBRGUsRUFZZixJQVplLEVBYWYsSUFiZSxFQWNmZCxPQWRlLENBQW5CO0FBZ0JBLFdBQU9nTSxJQUFJLENBQUMsQ0FBRCxDQUFYO0FBQ0g7O0FBRUQsUUFBTW9ELFdBQU4sQ0FDSUMsV0FESixFQUVJVCxTQUZKLEVBR0l2TyxJQUhKLEVBSUlMLE9BSkosRUFLa0I7QUFDZCxRQUFJLENBQUNxUCxXQUFELElBQWdCQSxXQUFXLENBQUMvSSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU9zRixPQUFPLENBQUNGLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9FLE9BQU8sQ0FBQzBELEdBQVIsQ0FBWUQsV0FBVyxDQUFDNUksR0FBWixDQUFnQjhJLEtBQUssSUFBSSxLQUFLYixVQUFMLENBQWdCYSxLQUFoQixFQUF1QlgsU0FBdkIsRUFBa0N2TyxJQUFsQyxFQUF3Q0wsT0FBeEMsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRUR3UCxFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDcEosTUFBZjtBQUNIOztBQXRzQndCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4qXG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiogTGljZW5zZSBhdDpcbipcbiogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4qXG4qIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4qIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gJ29wZW50cmFjaW5nJztcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSAndG9uLWNsaWVudC1qcy90eXBlcyc7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IEZpZWxkQWdncmVnYXRpb24sIEFnZ3JlZ2F0aW9uSGVscGVyIH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBRRGF0YVByb3ZpZGVyLCBRSW5kZXhJbmZvIH0gZnJvbSAnLi9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IFFEYXRhTGlzdGVuZXIsIFFEYXRhU3Vic2NyaXB0aW9uIH0gZnJvbSAnLi9saXN0ZW5lcic7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gJy4uL2F1dGgnO1xuaW1wb3J0IHsgQXV0aCwgZ3JhbnRlZEFjY2VzcyB9IGZyb20gJy4uL2F1dGgnO1xuaW1wb3J0IHsgU1RBVFMgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tICcuLi9maWx0ZXIvZmlsdGVycyc7XG5pbXBvcnQge1xuICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgaW5kZXhUb1N0cmluZyxcbiAgICBwYXJzZVNlbGVjdGlvblNldCxcbiAgICBRUGFyYW1zLFxuICAgIHNlbGVjdGlvblRvU3RyaW5nLFxufSBmcm9tICcuLi9maWx0ZXIvZmlsdGVycyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuLi9sb2dzJztcbmltcG9ydCB7IGV4cGxhaW5TbG93UmVhc29uLCBpc0Zhc3RRdWVyeSB9IGZyb20gJy4uL2ZpbHRlci9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5jb25zdCBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmV2ZW50cy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cblxuZXhwb3J0IHR5cGUgUUNvbGxlY3Rpb25PcHRpb25zID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBtdXRhYmxlOiBib29sZWFuLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXSxcblxuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgbG9nczogUUxvZ3MsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuXG4gICAgaXNUZXN0czogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBRRGF0YUNvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBtdXRhYmxlOiBib29sZWFuO1xuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXTtcbiAgICBpbmRleGVzUmVmcmVzaFRpbWU6IG51bWJlcjtcblxuICAgIC8vIERlcGVuZGVuY2llc1xuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgaXNUZXN0czogYm9vbGVhbjtcblxuICAgIC8vIE93blxuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlGYWlsZWQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbjogU3RhdHNDb3VudGVyO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG4gICAgaG90U3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFDb2xsZWN0aW9uT3B0aW9ucykge1xuICAgICAgICBjb25zdCBuYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBvcHRpb25zLmRvY1R5cGU7XG4gICAgICAgIHRoaXMubXV0YWJsZSA9IG9wdGlvbnMubXV0YWJsZTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gb3B0aW9ucy5pbmRleGVzO1xuXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBvcHRpb25zLnByb3ZpZGVyO1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyID0gb3B0aW9ucy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICB0aGlzLmxvZyA9IG9wdGlvbnMubG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG9wdGlvbnMuYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBvcHRpb25zLnRyYWNlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuXG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbiA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gdGhpcy5wcm92aWRlci5zdWJzY3JpYmUodGhpcy5uYW1lLCBkb2MgPT4gdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKSk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci51bnN1YnNjcmliZSh0aGlzLmhvdFN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAmJiBkb2MubXNnX3R5cGUgPT09IDFcbiAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgaWYgKGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSkge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbignbWVzc2FnZURiTm90aWZpY2F0aW9uJywge1xuICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uYWRkVGFncyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBRRGF0YVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnU1VCU0NSSVBUSU9OXFx0RkFJTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhcmdzLmZpbHRlciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ub25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsIHBhcmFtczogUVBhcmFtcykge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHM7XG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oJywnKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuX2tleSAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ21lc3NhZ2VzJzpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRmlsdGVyQ29uZGl0aW9uKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldCgnX2tleScsICdkb2MuX2tleScpO1xuICAgICAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmRvY1R5cGUuZmllbGRzO1xuICAgICAgICBpZiAoc2VsZWN0aW9ucyAmJiBmaWVsZHMpIHtcbiAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgJ2RvYycsIHNlbGVjdGlvbnMsIGZpZWxkcyk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwcmVzc2lvbnMuZGVsZXRlKCdpZCcpO1xuICAgICAgICByZXR1cm4gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG4gICAgICAgIGNvbnN0IHJldHVybkV4cHJlc3Npb24gPSB0aGlzLmJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnMpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiAke3JldHVybkV4cHJlc3Npb259YDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgbGV0IHN0YXRLZXkgPSB0ZXh0O1xuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YXRLZXkgPSBgJHtzdGF0S2V5fSR7b3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9ICR7eC5kaXJlY3Rpb259YCkuam9pbignICcpfWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeSh0aGlzLm5hbWUsIHRoaXMuaW5kZXhlcywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgZXhwbGFpblF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIF9jb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBfaW5mbzogYW55LFxuICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCB7fSwgZ3JhbnRlZEFjY2Vzcyk7XG4gICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpc0Zhc3Q6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNsb3dSZWFzb24gPSBhd2FpdCBleHBsYWluU2xvd1JlYXNvbih0aGlzLm5hbWUsIHRoaXMuaW5kZXhlcywgdGhpcy5kb2NUeXBlLCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgaXNGYXN0OiBzbG93UmVhc29uID09PSBudWxsLFxuICAgICAgICAgICAgICAgIC4uLihzbG93UmVhc29uID8geyBzbG93UmVhc29uIH0gOiB7fSksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgbGV0IHE6ID9EYXRhYmFzZVF1ZXJ5ID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQkVGT1JFX1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBxLm9yZGVyQnksIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPiBxLmxpbWl0KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zcGxpY2UocS5saW1pdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGlmIChxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNsb3dSZWFzb24gPSBleHBsYWluU2xvd1JlYXNvbihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3dSZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgKz0gYC4gUXVlcnkgd2FzIGRldGVjdGVkIGFzIGEgc2xvdy4gJHtzbG93UmVhc29uLnN1bW1hcnl9LiBTZWUgZXJyb3IgZGF0YSBmb3IgZGV0YWlscy5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IuZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lcnJvci5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNsb3dSZWFzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGltcGwgPSBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5UHJvdmlkZXIodGV4dCwgdmFycywgb3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBpbXBsLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5UHJvdmlkZXIoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBpc0Zhc3QgPyB0aGlzLnByb3ZpZGVyIDogdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICByZXR1cm4gcHJvdmlkZXIucXVlcnkodGV4dCwgdmFycywgb3JkZXJCeSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGltcGwgPSBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBsZXQgaGFzRGJSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVCeSA9IChyZWFzb246IHN0cmluZywgcmVzb2x2ZTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5ldmVudHMub24oUmVxdWVzdEV2ZW50LkNMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdjbG9zZScsIHJlc29sdmVPbkNsb3NlLCBbXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgcS5vcmRlckJ5LCBpc0Zhc3QsIGNvbnRleHQpLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNEYlJlc3BvbnNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgncXVlcnknLCByZXNvbHZlLCBkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhGaWx0ZXIgPSBRRGF0YUxpc3RlbmVyLmdldEF1dGhGaWx0ZXIodGhpcy5uYW1lLCBxLmFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0aEZpbHRlciAmJiAhYXV0aEZpbHRlcihkb2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdsaXN0ZW5lcicsIHJlc29sdmUsIFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdRVUVSWVxcdEZBSUxFRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHEuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0RiUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3RpbWVvdXQnLCByZXNvbHZlLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChRRXJyb3IucXVlcnlUZXJtaW5hdGVkT25UaW1lb3V0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBpbXBsLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uIHx8ICcnLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHF1ZXJ5LmhlbHBlcnMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgZm9yIChjb25zdCBoOiBBZ2dyZWdhdGlvbkhlbHBlciBvZiBoZWxwZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xuICAgICAgICAgICAgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHRleHQsIGZpbHRlcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnZG9jLicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cignZG9jLicubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdBU0MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICApKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnQUdHUkVHQVRFJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gQXJyYXkuaXNBcnJheShhcmdzLmZpZWxkcykgJiYgYXJncy5maWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGFyZ3MuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgIDogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjogQWdncmVnYXRpb25Gbi5DT1VOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0QWdncmVnYXRpb25RdWVyeShxLnRleHQsIGZpbHRlciwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIFtdLCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0LCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEluZGV4ZXMoKTogUHJvbWlzZTxRSW5kZXhJbmZvW10+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdmlkZXIuZ2V0Q29sbGVjdGlvbkluZGV4ZXModGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGFzeW5jIGNoZWNrUmVmcmVzaEluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGVzdHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpICsgSU5ERVhFU19SRUZSRVNIX0lOVEVSVkFMO1xuICAgICAgICBjb25zdCBhY3R1YWxJbmRleGVzID0gYXdhaXQgdGhpcy5nZXRJbmRleGVzKCk7XG5cbiAgICAgICAgY29uc3Qgc2FtZUluZGV4ZXMgPSAoYUluZGV4ZXM6IFFJbmRleEluZm9bXSwgYkluZGV4ZXM6IFFJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJJbmRleCBvZiBiSW5kZXhlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYVJlc3QuZGVsZXRlKGJJbmRleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGFjdHVhbEluZGV4ZXMsIHRoaXMuaW5kZXhlcykpIHtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdSRUxPQURfSU5ERVhFUycsIGFjdHVhbEluZGV4ZXMpO1xuICAgICAgICAgICAgdGhpcy5pbmRleGVzID0gYWN0dWFsSW5kZXhlcy5tYXAoeCA9PiAoeyBmaWVsZHM6IHguZmllbGRzIH0pKTtcbiAgICAgICAgICAgIHRoaXMucXVlcnlTdGF0cy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlQcm92aWRlcihcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCwgYXJncywgY29udGV4dCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG4iXX0=