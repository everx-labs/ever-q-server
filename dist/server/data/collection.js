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
    this.statDoc.increment().then(() => {
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
    });
  }

  subscriptionResolver() {
    return {
      subscribe: async (_, args, context, info) => {
        const accessRights = await requireGrantedAccess(context, args);
        await this.statSubscription.increment();
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
      await this.statQuery.increment();
      await this.statQueryActive.increment();
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
          await this.statQuerySlow.increment();
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
        await this.statQueryFailed.increment();

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
        await this.statQueryTime.report(Date.now() - start);
        await this.statQueryActive.decrement();
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
          this.statWaitForActive.increment().then(() => {});
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
          await this.statWaitForActive.decrement();
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
      await this.statQuery.increment();
      await this.statQueryActive.increment();
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
        await this.statQueryTime.report(Date.now() - start);
        await this.statQueryActive.decrement();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhU2NvcGUiLCJtdXRhYmxlIiwiaW1tdXRhYmxlIiwiY291bnRlcnBhcnRpZXMiLCJRRGF0YUNvbGxlY3Rpb24iLCJvcHRpb25zIiwibmFtZSIsImRvY1R5cGUiLCJzY29wZSIsImluZGV4ZXMiLCJwcm92aWRlciIsImluZGV4ZXNSZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJzbG93UXVlcmllc1Byb3ZpZGVyIiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImlzVGVzdHMiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXRzIiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwidGhlbiIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJleHByZXNzaW9ucyIsInNldCIsImZpZWxkcyIsImRlbGV0ZSIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJleHBsYWluUXVlcnlSZXNvbHZlciIsInBhcmVudCIsIl9jb250ZXh0IiwiX2luZm8iLCJxIiwiZ3JhbnRlZEFjY2VzcyIsInNsb3dSZWFzb24iLCJxdWVyeVJlc29sdmVyIiwic3RhcnQiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJzcGxpY2UiLCJtZXNzYWdlIiwic3VtbWFyeSIsImRhdGEiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJyZXF1ZXN0IiwidmFycyIsImltcGwiLCJzZXRUYWciLCJxdWVyeVByb3ZpZGVyIiwidHJhY2UiLCJwYXJlbnRTcGFuIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsImhhc0RiUmVzcG9uc2UiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIlFEYXRhTGlzdGVuZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInF1ZXJ5VGVybWluYXRlZE9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IiwiY3JlYXRlUXVlcnkiLCJoZWxwZXJzIiwiaXNGYXN0QWdncmVnYXRpb25RdWVyeSIsImgiLCJjIiwiZm4iLCJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwiYWdncmVnYXRpb25SZXNvbHZlciIsIkFycmF5IiwiaXNBcnJheSIsImNvbnZlcnRSZXN1bHRzIiwiZ2V0SW5kZXhlcyIsImdldENvbGxlY3Rpb25JbmRleGVzIiwiYWN0dWFsSW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJjbGVhciIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwiYWxsIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOzs7O0FBM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUFaLENBQWdCNkksS0FBSyxJQUFJLEtBQUtiLFVBQUwsQ0FBZ0JhLEtBQWhCLEVBQXVCWCxTQUF2QixFQUFrQzNPLElBQWxDLEVBQXdDTCxPQUF4QyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRDRQLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUNuSixNQUFmO0FBQ0g7O0FBeHNCd0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbipcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4qIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuKiBMaWNlbnNlIGF0OlxuKlxuKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbipcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4qIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSAnb3BlbnRyYWNpbmcnO1xuaW1wb3J0IHsgVG9uQ2xpZW50IH0gZnJvbSAnQHRvbmNsaWVudC9jb3JlJztcbmltcG9ydCB7IEFnZ3JlZ2F0aW9uRm4sIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IFFEYXRhUHJvdmlkZXIsIFFJbmRleEluZm8gfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHsgUURhdGFMaXN0ZW5lciwgUURhdGFTdWJzY3JpcHRpb24gfSBmcm9tICcuL2xpc3RlbmVyJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBBdXRoLCBncmFudGVkQWNjZXNzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBTVEFUUyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4uL2ZpbHRlci9maWx0ZXJzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IHsgZXhwbGFpblNsb3dSZWFzb24sIGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi4vZmlsdGVyL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRRXJyb3IsIHdyYXAgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IElOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCA9IDYwICogNjAgKiAxMDAwOyAvLyA2MCBtaW51dGVzXG5cbmV4cG9ydCBjb25zdCBSZXF1ZXN0RXZlbnQgPSB7XG4gICAgQ0xPU0U6ICdjbG9zZScsXG4gICAgRklOSVNIOiAnZmluaXNoJyxcbn07XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XG4gICAgZXZlbnRzOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnNldE1heExpc3RlbmVycygwKTtcbiAgICB9XG5cbiAgICBlbWl0Q2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkNMT1NFKTtcbiAgICB9XG5cbiAgICBmaW5pc2goKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkZJTklTSCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIHJlcXVlc3Q6IFJlcXVlc3RDb250cm9sbGVyLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUb25DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzPzogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgIGFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gY2hlY2tVc2VkQWNjZXNzS2V5KFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbik6ID9zdHJpbmcge1xuICAgIGlmICghYWNjZXNzS2V5KSB7XG4gICAgICAgIHJldHVybiB1c2VkQWNjZXNzS2V5O1xuICAgIH1cbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcbiAgICAgICAgY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgIHRocm93IFFFcnJvci5tdWx0aXBsZUFjY2Vzc0tleXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuXG5leHBvcnQgdHlwZSBRRGF0YVNjb3BlVHlwZSA9IFwibXV0YWJsZVwiIHwgXCJpbW11dGFibGVcIiB8IFwiY291bnRlcnBhcnRpZXNcIjtcblxuZXhwb3J0IGNvbnN0IFFEYXRhU2NvcGUgPSB7XG4gICAgbXV0YWJsZTogXCJtdXRhYmxlXCIsXG4gICAgaW1tdXRhYmxlOiBcImltbXV0YWJsZVwiLFxuICAgIGNvdW50ZXJwYXJ0aWVzOiBcImNvdW50ZXJwYXJ0aWVzXCIsXG59XG5cbmV4cG9ydCB0eXBlIFFDb2xsZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2NvcGU6IFFEYXRhU2NvcGVUeXBlLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXSxcblxuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgbG9nczogUUxvZ3MsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuXG4gICAgaXNUZXN0czogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBRRGF0YUNvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBzY29wZTogUURhdGFTY29wZVR5cGU7XG4gICAgaW5kZXhlczogUUluZGV4SW5mb1tdO1xuICAgIGluZGV4ZXNSZWZyZXNoVGltZTogbnVtYmVyO1xuXG4gICAgLy8gRGVwZW5kZW5jaWVzXG4gICAgcHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgc2xvd1F1ZXJpZXNQcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBpc1Rlc3RzOiBib29sZWFuO1xuXG4gICAgLy8gT3duXG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uOiBTdGF0c0NvdW50ZXI7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcbiAgICBob3RTdWJzY3JpcHRpb246IGFueTtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5zY29wZSA9IG9wdGlvbnMuc2NvcGU7XG4gICAgICAgIHRoaXMuaW5kZXhlcyA9IG9wdGlvbnMuaW5kZXhlcztcblxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gb3B0aW9ucy5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHRoaXMuc2xvd1F1ZXJpZXNQcm92aWRlciA9IG9wdGlvbnMuc2xvd1F1ZXJpZXNQcm92aWRlcjtcbiAgICAgICAgdGhpcy5sb2cgPSBvcHRpb25zLmxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBvcHRpb25zLmF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gb3B0aW9ucy50cmFjZXI7XG4gICAgICAgIHRoaXMuaXNUZXN0cyA9IG9wdGlvbnMuaXNUZXN0cztcblxuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzID0gb3B0aW9ucy5zdGF0cztcbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb24gPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcblxuICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IHRoaXMucHJvdmlkZXIuc3Vic2NyaWJlKHRoaXMubmFtZSwgZG9jID0+IHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYykpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5ob3RTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIHRoaXMucHJvdmlkZXIudW5zdWJzY3JpYmUodGhpcy5ob3RTdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5ob3RTdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZHJvcENhY2hlZERiSW5mbygpIHtcbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09ICdtZXNzYWdlcydcbiAgICAgICAgICAgICAgICAmJiBkb2MuX2tleVxuICAgICAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDVcbiAgICAgICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKCdtZXNzYWdlRGJOb3RpZmljYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFN1YnNjcmlwdGlvbi5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgUURhdGFTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1NVQlNDUklQVElPTlxcdEZBSUxFRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoYXJncy5maWx0ZXIpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZpbHRlckNvbmRpdGlvbihcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBidWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQoJ19rZXknLCAnZG9jLl9rZXknKTtcbiAgICAgICAgY29uc3QgZmllbGRzID0gdGhpcy5kb2NUeXBlLmZpZWxkcztcbiAgICAgICAgaWYgKHNlbGVjdGlvbnMgJiYgZmllbGRzKSB7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsICdkb2MnLCBzZWxlY3Rpb25zLCBmaWVsZHMpO1xuICAgICAgICB9XG4gICAgICAgIGV4cHJlc3Npb25zLmRlbGV0ZSgnaWQnKTtcbiAgICAgICAgcmV0dXJuIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuICAgICAgICBjb25zdCByZXR1cm5FeHByZXNzaW9uID0gdGhpcy5idWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gJHtyZXR1cm5FeHByZXNzaW9ufWA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgIGxldCBzdGF0S2V5ID0gdGV4dDtcbiAgICAgICAgaWYgKG9yZGVyQnkgJiYgb3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdGF0S2V5ID0gYCR7c3RhdEtleX0ke29yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSAke3guZGlyZWN0aW9ufWApLmpvaW4oJyAnKX1gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQoc3RhdEtleSk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkodGhpcy5uYW1lLCB0aGlzLmluZGV4ZXMsIHRoaXMuZG9jVHlwZSwgZmlsdGVyLCBvcmRlckJ5IHx8IFtdLCBjb25zb2xlKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChzdGF0S2V5LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNGYXN0O1xuICAgIH1cblxuICAgIGV4cGxhaW5RdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBfY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgX2luZm86IGFueSxcbiAgICAgICAgKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywge30sIGdyYW50ZWRBY2Nlc3MpO1xuICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgaXNGYXN0OiB0cnVlIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzbG93UmVhc29uID0gYXdhaXQgZXhwbGFpblNsb3dSZWFzb24odGhpcy5uYW1lLCB0aGlzLmluZGV4ZXMsIHRoaXMuZG9jVHlwZSwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzRmFzdDogc2xvd1JlYXNvbiA9PT0gbnVsbCxcbiAgICAgICAgICAgICAgICAuLi4oc2xvd1JlYXNvbiA/IHsgc2xvd1JlYXNvbiB9IDoge30pLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGxldCBxOiA/RGF0YWJhc2VRdWVyeSA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5maWVsZE5vZGVzWzBdLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0JFRk9SRV9RVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgcS5vcmRlckJ5LCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQubGVuZ3RoID4gcS5saW1pdCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuc3BsaWNlKHEubGltaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUZhaWxlZC5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBpZiAocSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbG93UmVhc29uID0gZXhwbGFpblNsb3dSZWFzb24oXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGV4ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbG93UmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlICs9IGAuIFF1ZXJ5IHdhcyBkZXRlY3RlZCBhcyBhIHNsb3cuICR7c2xvd1JlYXNvbi5zdW1tYXJ5fS4gU2VlIGVycm9yIGRhdGEgZm9yIGRldGFpbHMuYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLmRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZXJyb3IuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbG93UmVhc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBpbXBsID0gYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVByb3ZpZGVyKHRleHQsIHZhcnMsIG9yZGVyQnksIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgaW1wbCwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVByb3ZpZGVyKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyID0gaXNGYXN0ID8gdGhpcy5wcm92aWRlciA6IHRoaXMuc2xvd1F1ZXJpZXNQcm92aWRlcjtcbiAgICAgICAgcmV0dXJuIHByb3ZpZGVyLnF1ZXJ5KHRleHQsIHZhcnMsIG9yZGVyQnkpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBpbXBsID0gYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGhhc0RiUmVzcG9uc2UgPSBmYWxzZTtcbiAgICAgICAgICAgIGxldCByZXNvbHZlT25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCByZXNvbHZlQnkgPSAocmVhc29uOiBzdHJpbmcsIHJlc29sdmU6IChyZXN1bHQ6IGFueSkgPT4gdm9pZCwgcmVzdWx0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9IHJlYXNvbjtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZXZlbnRzLm9uKFJlcXVlc3RFdmVudC5DTE9TRSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnY2xvc2UnLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRGJSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgcS5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUVVFUllcXHRGQUlMRUQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShxLmZpbHRlciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGFzRGJSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgndGltZW91dCcsIHJlc29sdmUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFFFcnJvci5xdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGltcGwsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cbiJdfQ==