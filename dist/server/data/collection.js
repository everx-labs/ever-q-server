"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QDataCollection = exports.RequestController = exports.RequestEvent = void 0;

var _opentracing = require("opentracing");

var _core = require("@tonclient/core");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsIm11dGFibGUiLCJpbmRleGVzIiwicHJvdmlkZXIiLCJpbmRleGVzUmVmcmVzaFRpbWUiLCJEYXRlIiwibm93Iiwic2xvd1F1ZXJpZXNQcm92aWRlciIsImxvZyIsImxvZ3MiLCJjcmVhdGUiLCJ0cmFjZXIiLCJpc1Rlc3RzIiwid2FpdEZvckNvdW50Iiwic3Vic2NyaXB0aW9uQ291bnQiLCJzdGF0cyIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvbiIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJkb2NJbnNlcnRPclVwZGF0ZSIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJob3RTdWJzY3JpcHRpb24iLCJzdWJzY3JpYmUiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJjbG9zZSIsInVuc3Vic2NyaWJlIiwiZHJvcENhY2hlZERiSW5mbyIsImluY3JlbWVudCIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJleHBsYWluUXVlcnlSZXNvbHZlciIsInBhcmVudCIsIl9jb250ZXh0IiwiX2luZm8iLCJxIiwiZ3JhbnRlZEFjY2VzcyIsInNsb3dSZWFzb24iLCJxdWVyeVJlc29sdmVyIiwic3RhcnQiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJzcGxpY2UiLCJtZXNzYWdlIiwic3VtbWFyeSIsImRhdGEiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsImltcGwiLCJzZXRUYWciLCJxdWVyeVByb3ZpZGVyIiwidHJhY2UiLCJwYXJlbnRTcGFuIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsImhhc0RiUmVzcG9uc2UiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJRRGF0YUxpc3RlbmVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJxdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJjb252ZXJ0UmVzdWx0cyIsImdldEluZGV4ZXMiLCJnZXRDb2xsZWN0aW9uSW5kZXhlcyIsImFjdHVhbEluZGV4ZXMiLCJzYW1lSW5kZXhlcyIsImFJbmRleGVzIiwiYkluZGV4ZXMiLCJhUmVzdCIsIlNldCIsImluZGV4VG9TdHJpbmciLCJiSW5kZXgiLCJiSW5kZXhTdHJpbmciLCJzaXplIiwiY2xlYXIiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsImFsbCIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFTQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQTNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUErQkEsTUFBTUEsd0JBQXdCLEdBQUcsS0FBSyxFQUFMLEdBQVUsSUFB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LE1BQUFBLFNBQVMsRUFBRSxFQUZmO0FBR0lDLE1BQUFBLE9BQU8sRUFBRSxFQUhiO0FBSUlDLE1BQUFBLEtBQUssRUFBRSxDQUpYO0FBS0lDLE1BQUFBLE9BTEo7QUFNSWMsTUFBQUEsV0FBVyxFQUFFLElBTmpCO0FBT0lELE1BQUFBLElBQUksRUFBRWlHLFdBQVcsQ0FBQ2pHLElBUHRCO0FBUUl4QyxNQUFBQSxNQUFNLEVBQUV5SSxXQUFXLENBQUN6SSxNQVJ4QjtBQVNJakIsTUFBQUEsWUFBWSxFQUFFckU7QUFUbEIsS0FEZSxFQVlmLElBWmUsRUFhZixJQWJlLEVBY2ZkLE9BZGUsQ0FBbkI7QUFnQkEsV0FBT2dNLElBQUksQ0FBQyxDQUFELENBQVg7QUFDSDs7QUFFZ0IsUUFBWG9ELFdBQVcsQ0FDYkMsV0FEYSxFQUViVCxTQUZhLEVBR2J2TyxJQUhhLEVBSWJMLE9BSmEsRUFLQztBQUNkLFFBQUksQ0FBQ3FQLFdBQUQsSUFBZ0JBLFdBQVcsQ0FBQy9JLE1BQVosS0FBdUIsQ0FBM0MsRUFBOEM7QUFDMUMsYUFBT3NGLE9BQU8sQ0FBQ0YsT0FBUixDQUFnQixFQUFoQixDQUFQO0FBQ0g7O0FBQ0QsV0FBT0UsT0FBTyxDQUFDMEQsR0FBUixDQUFZRCxXQUFXLENBQUM1SSxHQUFaLENBQWdCOEksS0FBSyxJQUFJLEtBQUtiLFVBQUwsQ0FBZ0JhLEtBQWhCLEVBQXVCWCxTQUF2QixFQUFrQ3ZPLElBQWxDLEVBQXdDTCxPQUF4QyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRHdQLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUNwSixNQUFmO0FBQ0g7O0FBdHNCd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbipcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4qIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuKiBMaWNlbnNlIGF0OlxuKlxuKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbipcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4qIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSAnb3BlbnRyYWNpbmcnO1xuaW1wb3J0IHsgVG9uQ2xpZW50IH0gZnJvbSAnQHRvbmNsaWVudC9jb3JlJztcbmltcG9ydCB7IEFnZ3JlZ2F0aW9uRm4sIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IFFEYXRhUHJvdmlkZXIsIFFJbmRleEluZm8gfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHsgUURhdGFMaXN0ZW5lciwgUURhdGFTdWJzY3JpcHRpb24gfSBmcm9tICcuL2xpc3RlbmVyJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBBdXRoLCBncmFudGVkQWNjZXNzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBTVEFUUyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IHsgZXhwbGFpblNsb3dSZWFzb24sIGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi4vZmlsdGVyL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRRXJyb3IsIHdyYXAgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IElOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCA9IDYwICogNjAgKiAxMDAwOyAvLyA2MCBtaW51dGVzXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0RXZlbnQgPSB7XG4gICAgQ0xPU0U6ICdjbG9zZScsXG4gICAgRklOSVNIOiAnZmluaXNoJyxcbn07XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XG4gICAgZXZlbnRzOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnNldE1heExpc3RlbmVycygwKTtcbiAgICB9XG5cbiAgICBlbWl0Q2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkNMT1NFKTtcbiAgICB9XG5cbiAgICBmaW5pc2goKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkZJTklTSCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIHJlcXVlc3Q6IFJlcXVlc3RDb250cm9sbGVyLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUb25DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzPzogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgIGFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gY2hlY2tVc2VkQWNjZXNzS2V5KFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbik6ID9zdHJpbmcge1xuICAgIGlmICghYWNjZXNzS2V5KSB7XG4gICAgICAgIHJldHVybiB1c2VkQWNjZXNzS2V5O1xuICAgIH1cbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcbiAgICAgICAgY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgIHRocm93IFFFcnJvci5tdWx0aXBsZUFjY2Vzc0tleXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuXG5leHBvcnQgdHlwZSBRQ29sbGVjdGlvbk9wdGlvbnMgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIG11dGFibGU6IGJvb2xlYW4sXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgaW5kZXhlczogUUluZGV4SW5mb1tdLFxuXG4gICAgcHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgc2xvd1F1ZXJpZXNQcm92aWRlcjogUURhdGFQcm92aWRlcixcbiAgICBsb2dzOiBRTG9ncyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG5cbiAgICBpc1Rlc3RzOiBib29sZWFuLFxufTtcblxuZXhwb3J0IGNsYXNzIFFEYXRhQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuICAgIG11dGFibGU6IGJvb2xlYW47XG4gICAgaW5kZXhlczogUUluZGV4SW5mb1tdO1xuICAgIGluZGV4ZXNSZWZyZXNoVGltZTogbnVtYmVyO1xuXG4gICAgLy8gRGVwZW5kZW5jaWVzXG4gICAgcHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgc2xvd1F1ZXJpZXNQcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBpc1Rlc3RzOiBib29sZWFuO1xuXG4gICAgLy8gT3duXG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uOiBTdGF0c0NvdW50ZXI7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcbiAgICBob3RTdWJzY3JpcHRpb246IGFueTtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5tdXRhYmxlID0gb3B0aW9ucy5tdXRhYmxlO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBvcHRpb25zLmluZGV4ZXM7XG5cbiAgICAgICAgdGhpcy5wcm92aWRlciA9IG9wdGlvbnMucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXIgPSBvcHRpb25zLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHRoaXMubG9nID0gb3B0aW9ucy5sb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gb3B0aW9ucy5hdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG9wdGlvbnMudHJhY2VyO1xuICAgICAgICB0aGlzLmlzVGVzdHMgPSBvcHRpb25zLmlzVGVzdHM7XG5cbiAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gMDtcblxuICAgICAgICBjb25zdCBzdGF0cyA9IG9wdGlvbnMuc3RhdHM7XG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZCA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmZhaWxlZCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LnNsb3csIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5ob3RTdWJzY3JpcHRpb24gPSB0aGlzLnByb3ZpZGVyLnN1YnNjcmliZSh0aGlzLm5hbWUsIGRvYyA9PiB0aGlzLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpKTtcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaG90U3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnVuc3Vic2NyaWJlKHRoaXMuaG90U3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgICAgIGNvbnN0IGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSA9IHRoaXMubmFtZSA9PT0gJ21lc3NhZ2VzJ1xuICAgICAgICAgICAgJiYgZG9jLl9rZXlcbiAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNVxuICAgICAgICBpZiAoaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKCdtZXNzYWdlRGJOb3RpZmljYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb24uaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdTVUJTQ1JJUFRJT05cXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFyZ3MuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBleHBsYWluUXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgX2NvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIF9pbmZvOiBhbnksXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIHt9LCBncmFudGVkQWNjZXNzKTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGlzRmFzdDogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGF3YWl0IGV4cGxhaW5TbG93UmVhc29uKHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpc0Zhc3Q6IHNsb3dSZWFzb24gPT09IG51bGwsXG4gICAgICAgICAgICAgICAgLi4uKHNsb3dSZWFzb24gPyB7IHNsb3dSZWFzb24gfSA6IHt9KSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsZXQgcTogP0RhdGFiYXNlUXVlcnkgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8uZmllbGROb2Rlc1swXS5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdCRUZPUkVfUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKHEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGV4cGxhaW5TbG93UmVhc29uKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvd1JlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSArPSBgLiBRdWVyeSB3YXMgZGV0ZWN0ZWQgYXMgYSBzbG93LiAke3Nsb3dSZWFzb24uc3VtbWFyeX0uIFNlZSBlcnJvciBkYXRhIGZvciBkZXRhaWxzLmA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5kYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVycm9yLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xvd1JlYXNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlQcm92aWRlcih0ZXh0LCB2YXJzLCBvcmRlckJ5LCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBoYXNEYlJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZU9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZUJ5ID0gKHJlYXNvbjogc3RyaW5nLCByZXNvbHZlOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSByZWFzb247XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmV2ZW50cy5vbihSZXF1ZXN0RXZlbnQuQ0xPU0UsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2Nsb3NlJywgcmVzb2x2ZU9uQ2xvc2UsIFtdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlQcm92aWRlcihxLnRleHQsIHEucGFyYW1zLCBxLm9yZGVyQnksIGlzRmFzdCwgY29udGV4dCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0RiUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdxdWVyeScsIHJlc29sdmUsIGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IFFEYXRhTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2xpc3RlbmVyJywgcmVzb2x2ZSwgW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1FVRVJZXFx0RkFJTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocS5maWx0ZXIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRGJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgndGltZW91dCcsIHJlc29sdmUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFFFcnJvci5xdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cbiJdfQ==