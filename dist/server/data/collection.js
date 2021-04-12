"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QDataCollection = exports.QDataScope = exports.RequestController = exports.RequestEvent = void 0;

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
const QDataScope = {
  mutable: "mutable",
  immutable: "immutable",
  counterparties: "counterparties"
};
exports.QDataScope = QDataScope;

class QDataCollection {
  // Dependencies
  // Own
  constructor(options) {
    const name = options.name;
    this.name = name;
    this.docType = options.docType;
    this.scope = options.scope;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhU2NvcGUiLCJtdXRhYmxlIiwiaW1tdXRhYmxlIiwiY291bnRlcnBhcnRpZXMiLCJRRGF0YUNvbGxlY3Rpb24iLCJvcHRpb25zIiwibmFtZSIsImRvY1R5cGUiLCJzY29wZSIsImluZGV4ZXMiLCJwcm92aWRlciIsImluZGV4ZXNSZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJzbG93UXVlcmllc1Byb3ZpZGVyIiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImlzVGVzdHMiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXRzIiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwiaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlIiwiX2tleSIsIm1zZ190eXBlIiwic3RhdHVzIiwic3BhbiIsInN0YXJ0U3BhbiIsImNoaWxkT2YiLCJRVHJhY2VyIiwibWVzc2FnZVJvb3RTcGFuQ29udGV4dCIsImFkZFRhZ3MiLCJtZXNzYWdlSWQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiUURhdGFTdWJzY3JpcHRpb24iLCJmaWx0ZXIiLCJvcGVyYXRpb24iLCJzZWxlY3Rpb25TZXQiLCJldmVudExpc3RlbmVyIiwicHVzaERvY3VtZW50IiwiZXJyb3IiLCJKU09OIiwic3RyaW5naWZ5IiwidG9TdHJpbmciLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkRmlsdGVyQ29uZGl0aW9uIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXJDb25kaXRpb24iLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiYnVpbGRSZXR1cm5FeHByZXNzaW9uIiwic2VsZWN0aW9ucyIsImV4cHJlc3Npb25zIiwic2V0IiwiZmllbGRzIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwicmV0dXJuRXhwcmVzc2lvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiY2hlY2tSZWZyZXNoSW5mbyIsInN0YXRLZXkiLCJleGlzdGluZ1N0YXQiLCJnZXQiLCJ1bmRlZmluZWQiLCJpc0Zhc3QiLCJzdGF0IiwiY29uc29sZSIsImV4cGxhaW5RdWVyeVJlc29sdmVyIiwicGFyZW50IiwiX2NvbnRleHQiLCJfaW5mbyIsInEiLCJncmFudGVkQWNjZXNzIiwic2xvd1JlYXNvbiIsInF1ZXJ5UmVzb2x2ZXIiLCJzdGFydCIsImZpZWxkTm9kZXMiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsInNwbGljZSIsIm1lc3NhZ2UiLCJzdW1tYXJ5IiwiZGF0YSIsInJlcG9ydCIsImRlY3JlbWVudCIsInJlcXVlc3QiLCJ2YXJzIiwiaW1wbCIsInNldFRhZyIsInF1ZXJ5UHJvdmlkZXIiLCJ0cmFjZSIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwiaGFzRGJSZXNwb25zZSIsInJlc29sdmVPbkNsb3NlIiwicmVzb2x2ZUJ5IiwicmVhc29uIiwicmVzb2x2ZSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIlFEYXRhTGlzdGVuZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInF1ZXJ5VGVybWluYXRlZE9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IiwiY3JlYXRlUXVlcnkiLCJoZWxwZXJzIiwiaXNGYXN0QWdncmVnYXRpb25RdWVyeSIsImgiLCJjIiwiZm4iLCJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwiYWdncmVnYXRpb25SZXNvbHZlciIsIkFycmF5IiwiaXNBcnJheSIsImNvbnZlcnRSZXN1bHRzIiwiZ2V0SW5kZXhlcyIsImdldENvbGxlY3Rpb25JbmRleGVzIiwiYWN0dWFsSW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJjbGVhciIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwiYWxsIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDcEosTUFBZjtBQUNIOztBQXRzQndCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4qXG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiogTGljZW5zZSBhdDpcbipcbiogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4qXG4qIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4qIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gJ29wZW50cmFjaW5nJztcbmltcG9ydCB7IFRvbkNsaWVudCB9IGZyb20gJ0B0b25jbGllbnQvY29yZSc7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IEZpZWxkQWdncmVnYXRpb24sIEFnZ3JlZ2F0aW9uSGVscGVyIH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBRRGF0YVByb3ZpZGVyLCBRSW5kZXhJbmZvIH0gZnJvbSAnLi9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IFFEYXRhTGlzdGVuZXIsIFFEYXRhU3Vic2NyaXB0aW9uIH0gZnJvbSAnLi9saXN0ZW5lcic7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gJy4uL2F1dGgnO1xuaW1wb3J0IHsgQXV0aCwgZ3JhbnRlZEFjY2VzcyB9IGZyb20gJy4uL2F1dGgnO1xuaW1wb3J0IHsgU1RBVFMgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tICcuLi9maWx0ZXIvZmlsdGVycyc7XG5pbXBvcnQge1xuICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgaW5kZXhUb1N0cmluZyxcbiAgICBwYXJzZVNlbGVjdGlvblNldCxcbiAgICBRUGFyYW1zLFxuICAgIHNlbGVjdGlvblRvU3RyaW5nLFxufSBmcm9tICcuLi9maWx0ZXIvZmlsdGVycyc7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuLi9sb2dzJztcbmltcG9ydCBRTG9ncyBmcm9tICcuLi9sb2dzJztcbmltcG9ydCB7IGV4cGxhaW5TbG93UmVhc29uLCBpc0Zhc3RRdWVyeSB9IGZyb20gJy4uL2ZpbHRlci9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5jb25zdCBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmV2ZW50cy5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgfVxuXG4gICAgZW1pdENsb3NlKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5DTE9TRSk7XG4gICAgfVxuXG4gICAgZmluaXNoKCkge1xuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KFJlcXVlc3RFdmVudC5GSU5JU0gpO1xuICAgICAgICB0aGlzLmV2ZW50cy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICByZXF1ZXN0OiBSZXF1ZXN0Q29udHJvbGxlcixcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVG9uQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkcz86IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBRRXJyb3IubXVsdGlwbGVBY2Nlc3NLZXlzKCk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cblxuZXhwb3J0IHR5cGUgUURhdGFTY29wZVR5cGUgPSBcIm11dGFibGVcIiB8IFwiaW1tdXRhYmxlXCIgfCBcImNvdW50ZXJwYXJ0aWVzXCI7XG5cbmV4cG9ydCBjb25zdCBRRGF0YVNjb3BlID0ge1xuICAgIG11dGFibGU6IFwibXV0YWJsZVwiLFxuICAgIGltbXV0YWJsZTogXCJpbW11dGFibGVcIixcbiAgICBjb3VudGVycGFydGllczogXCJjb3VudGVycGFydGllc1wiLFxufVxuXG5leHBvcnQgdHlwZSBRQ29sbGVjdGlvbk9wdGlvbnMgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNjb3BlOiBRRGF0YVNjb3BlVHlwZSxcbiAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW10sXG5cbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcixcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIGxvZ3M6IFFMb2dzLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcblxuICAgIGlzVGVzdHM6IGJvb2xlYW4sXG59O1xuXG5leHBvcnQgY2xhc3MgUURhdGFDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgc2NvcGU6IFFEYXRhU2NvcGVUeXBlO1xuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXTtcbiAgICBpbmRleGVzUmVmcmVzaFRpbWU6IG51bWJlcjtcblxuICAgIC8vIERlcGVuZGVuY2llc1xuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgaXNUZXN0czogYm9vbGVhbjtcblxuICAgIC8vIE93blxuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlGYWlsZWQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbjogU3RhdHNDb3VudGVyO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG4gICAgaG90U3Vic2NyaXB0aW9uOiBhbnk7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM6IFFDb2xsZWN0aW9uT3B0aW9ucykge1xuICAgICAgICBjb25zdCBuYW1lID0gb3B0aW9ucy5uYW1lO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBvcHRpb25zLmRvY1R5cGU7XG4gICAgICAgIHRoaXMuc2NvcGUgPSBvcHRpb25zLnNjb3BlO1xuICAgICAgICB0aGlzLmluZGV4ZXMgPSBvcHRpb25zLmluZGV4ZXM7XG5cbiAgICAgICAgdGhpcy5wcm92aWRlciA9IG9wdGlvbnMucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXIgPSBvcHRpb25zLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHRoaXMubG9nID0gb3B0aW9ucy5sb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gb3B0aW9ucy5hdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG9wdGlvbnMudHJhY2VyO1xuICAgICAgICB0aGlzLmlzVGVzdHMgPSBvcHRpb25zLmlzVGVzdHM7XG5cbiAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gMDtcblxuICAgICAgICBjb25zdCBzdGF0cyA9IG9wdGlvbnMuc3RhdHM7XG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZCA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmZhaWxlZCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LnNsb3csIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG5cbiAgICAgICAgdGhpcy5ob3RTdWJzY3JpcHRpb24gPSB0aGlzLnByb3ZpZGVyLnN1YnNjcmliZSh0aGlzLm5hbWUsIGRvYyA9PiB0aGlzLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpKTtcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaG90U3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnVuc3Vic2NyaWJlKHRoaXMuaG90U3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgICAgIGNvbnN0IGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSA9IHRoaXMubmFtZSA9PT0gJ21lc3NhZ2VzJ1xuICAgICAgICAgICAgJiYgZG9jLl9rZXlcbiAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNVxuICAgICAgICBpZiAoaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKCdtZXNzYWdlRGJOb3RpZmljYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb24uaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IFFEYXRhU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdTVUJTQ1JJUFRJT05cXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFyZ3MuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBleHBsYWluUXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgX2NvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIF9pbmZvOiBhbnksXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIHt9LCBncmFudGVkQWNjZXNzKTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGlzRmFzdDogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGF3YWl0IGV4cGxhaW5TbG93UmVhc29uKHRoaXMubmFtZSwgdGhpcy5pbmRleGVzLCB0aGlzLmRvY1R5cGUsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpc0Zhc3Q6IHNsb3dSZWFzb24gPT09IG51bGwsXG4gICAgICAgICAgICAgICAgLi4uKHNsb3dSZWFzb24gPyB7IHNsb3dSZWFzb24gfSA6IHt9KSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBsZXQgcTogP0RhdGFiYXNlUXVlcnkgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8uZmllbGROb2Rlc1swXS5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdCRUZPUkVfUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKHEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGV4cGxhaW5TbG93UmVhc29uKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2xvd1JlYXNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IubWVzc2FnZSArPSBgLiBRdWVyeSB3YXMgZGV0ZWN0ZWQgYXMgYSBzbG93LiAke3Nsb3dSZWFzb24uc3VtbWFyeX0uIFNlZSBlcnJvciBkYXRhIGZvciBkZXRhaWxzLmA7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5kYXRhID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLmVycm9yLmRhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2xvd1JlYXNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlQcm92aWRlcih0ZXh0LCB2YXJzLCBvcmRlckJ5LCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlQcm92aWRlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBwcm92aWRlciA9IGlzRmFzdCA/IHRoaXMucHJvdmlkZXIgOiB0aGlzLnNsb3dRdWVyaWVzUHJvdmlkZXI7XG4gICAgICAgIHJldHVybiBwcm92aWRlci5xdWVyeSh0ZXh0LCB2YXJzLCBvcmRlckJ5KTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBoYXNEYlJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZU9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZUJ5ID0gKHJlYXNvbjogc3RyaW5nLCByZXNvbHZlOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSByZWFzb247XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmV2ZW50cy5vbihSZXF1ZXN0RXZlbnQuQ0xPU0UsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2Nsb3NlJywgcmVzb2x2ZU9uQ2xvc2UsIFtdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlQcm92aWRlcihxLnRleHQsIHEucGFyYW1zLCBxLm9yZGVyQnksIGlzRmFzdCwgY29udGV4dCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhc0RiUmVzcG9uc2UgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdxdWVyeScsIHJlc29sdmUsIGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IFFEYXRhTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ2xpc3RlbmVyJywgcmVzb2x2ZSwgW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1FVRVJZXFx0RkFJTEVEJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocS5maWx0ZXIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRGJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgndGltZW91dCcsIHJlc29sdmUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFFFcnJvci5xdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cbiJdfQ==