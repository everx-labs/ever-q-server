"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QCollection = exports.RequestController = exports.RequestEvent = void 0;

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _dataBroker = require("./data-broker");

var _dataListener = require("./data-listener");

var _auth = require("../auth");

var _config = require("../config");

var _dataTypes = require("../filter/data-types");

var _logs = _interopRequireDefault(require("../logs"));

var _slowDetector = require("../filter/slow-detector");

var _tracer = require("../tracer");

var _utils = require("../utils");

var _events = _interopRequireDefault(require("events"));

var _dataProvider = require("./data-provider");

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

class QCollection {
  constructor(options) {
    const name = options.name;
    this.name = name;
    this.docType = options.docType;
    this.info = _config.BLOCKCHAIN_DB.collections[name];
    this.infoRefreshTime = Date.now();
    this.segment = _dataProvider.dataCollectionInfo[name].segment;
    this.log = options.logs.create(name);
    this.auth = options.auth;
    this.tracer = options.tracer;
    this.broker = options.broker;
    this.slowQueriesBroker = options.slowQueriesBroker;
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
    const listenerProvider = this.segment === _dataProvider.dataSegment.MUTABLE ? this.broker.mutable : this.broker.immutableHot;
    listenerProvider.subscribe(this.name, doc => this.onDocumentInsertOrUpdate(doc));
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
        const subscription = new _dataListener.QDataSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _dataTypes.parseSelectionSet)(info.operation.selectionSet, this.name));

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
      (0, _dataTypes.collectReturnExpressions)(expressions, 'doc', selections, fields);
    }

    expressions.delete('id');
    return (0, _dataTypes.combineReturnExpressions)(expressions);
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dataTypes.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = selectionInfo.selections ? (0, _dataTypes.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
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
          selection: (0, _dataTypes.selectionToString)(q.selection)
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
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context) : await this.query(q.text, q.params, [], isFast, traceParams, context);
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

      return this.queryBroker(text, vars, orderBy, isFast, context);
    }, context.parentSpan);
  }

  async queryBroker(text, vars, orderBy, isFast, context) {
    const broker = isFast ? this.broker : this.slowQueriesBroker;
    return broker.query({
      segment: this.segment,
      text,
      vars,
      orderBy
    });
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
            this.queryBroker(q.text, q.params, q.orderBy, isFast, context).then(docs => {
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
          const authFilter = _dataListener.QDataListener.getAuthFilter(this.name, q.accessRights);

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
    const params = new _dataTypes.QParams();
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
        const result = await this.queryBroker(q.text, q.params, [], isFast, context);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result[0], q.helpers);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  }

  async getIndexes() {
    const provider = this.segment === _dataProvider.dataSegment.MUTABLE ? this.broker.mutable : this.broker.immutableHot;
    return provider.getCollectionIndexes(this.name);
  } //--------------------------------------------------------- Internals


  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.infoRefreshTime) {
      return;
    }

    this.infoRefreshTime = Date.now() + INFO_REFRESH_INTERVAL;
    const actualIndexes = await this.getIndexes();

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_dataTypes.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _dataTypes.indexToString)(bIndex);

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
      const docs = await this.queryBroker(queryParams.text, queryParams.params, [], true, context);
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

exports.QCollection = QCollection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklORk9fUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFDb2xsZWN0aW9uIiwib3B0aW9ucyIsIm5hbWUiLCJkb2NUeXBlIiwiaW5mbyIsIkJMT0NLQ0hBSU5fREIiLCJjb2xsZWN0aW9ucyIsImluZm9SZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJzZWdtZW50IiwiZGF0YUNvbGxlY3Rpb25JbmZvIiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImJyb2tlciIsInNsb3dRdWVyaWVzQnJva2VyIiwiaXNUZXN0cyIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdHMiLCJzdGF0RG9jIiwiU3RhdHNDb3VudGVyIiwiU1RBVFMiLCJkb2MiLCJjb3VudCIsInN0YXRRdWVyeSIsInF1ZXJ5Iiwic3RhdFF1ZXJ5VGltZSIsIlN0YXRzVGltaW5nIiwidGltZSIsInN0YXRRdWVyeUFjdGl2ZSIsIlN0YXRzR2F1Z2UiLCJhY3RpdmUiLCJzdGF0UXVlcnlGYWlsZWQiLCJmYWlsZWQiLCJzdGF0UXVlcnlTbG93Iiwic2xvdyIsInN0YXRXYWl0Rm9yQWN0aXZlIiwid2FpdEZvciIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJzdWJzY3JpcHRpb24iLCJkb2NJbnNlcnRPclVwZGF0ZSIsInNldE1heExpc3RlbmVycyIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJsaXN0ZW5lclByb3ZpZGVyIiwiZGF0YVNlZ21lbnQiLCJNVVRBQkxFIiwibXV0YWJsZSIsImltbXV0YWJsZUhvdCIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImRyb3BDYWNoZWREYkluZm8iLCJpbmNyZW1lbnQiLCJpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UiLCJfa2V5IiwibXNnX3R5cGUiLCJzdGF0dXMiLCJzcGFuIiwic3RhcnRTcGFuIiwiY2hpbGRPZiIsIlFUcmFjZXIiLCJtZXNzYWdlUm9vdFNwYW5Db250ZXh0IiwiYWRkVGFncyIsIm1lc3NhZ2VJZCIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwiXyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRGaWx0ZXJDb25kaXRpb24iLCJwcmltYXJ5Q29uZGl0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlckNvbmRpdGlvbiIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJidWlsZFJldHVybkV4cHJlc3Npb24iLCJzZWxlY3Rpb25zIiwiZXhwcmVzc2lvbnMiLCJzZXQiLCJmaWVsZHMiLCJkZWxldGUiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5Iiwic2VsZWN0aW9uSW5mbyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwic2VsZWN0aW9uIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdFRleHQiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJyZXR1cm5FeHByZXNzaW9uIiwidGV4dCIsIm9wZXJhdGlvbklkIiwidmFsdWVzIiwiaXNGYXN0UXVlcnkiLCJjaGVja1JlZnJlc2hJbmZvIiwic3RhdEtleSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsInN0YXQiLCJjb25zb2xlIiwicXVlcnlSZXNvbHZlciIsInBhcmVudCIsInN0YXJ0IiwicSIsImZpZWxkTm9kZXMiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsImVycm9yIiwicmVwb3J0IiwiZGVjcmVtZW50IiwicmVxdWVzdCIsInZhcnMiLCJ0cmFjZSIsInNldFRhZyIsInF1ZXJ5QnJva2VyIiwicGFyZW50U3BhbiIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJRRGF0YUxpc3RlbmVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJjb252ZXJ0UmVzdWx0cyIsImdldEluZGV4ZXMiLCJwcm92aWRlciIsImdldENvbGxlY3Rpb25JbmRleGVzIiwiYWN0dWFsSW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsInNpemUiLCJpbmRleGVzIiwiY2xlYXIiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsImFsbCIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFTQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQTdDQTs7Ozs7Ozs7Ozs7Ozs7O0FBZ0RBLE1BQU1BLHFCQUFxQixHQUFHLEtBQUssRUFBTCxHQUFVLElBQXhDLEMsQ0FBOEM7O0FBRXZDLE1BQU1DLFlBQVksR0FBRztBQUN4QkMsRUFBQUEsS0FBSyxFQUFFLE9BRGlCO0FBRXhCQyxFQUFBQSxNQUFNLEVBQUU7QUFGZ0IsQ0FBckI7OztBQUtBLE1BQU1DLGlCQUFOLENBQXdCO0FBRzNCQyxFQUFBQSxXQUFXLEdBQUc7QUFDVixTQUFLQyxNQUFMLEdBQWMsSUFBSUMsZUFBSixFQUFk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c0wsSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1xRCxXQUFOLENBQ0lDLFdBREosRUFFSVQsU0FGSixFQUdJOU4sSUFISixFQUlJTCxPQUpKLEVBS2tCO0FBQ2QsUUFBSSxDQUFDNE8sV0FBRCxJQUFnQkEsV0FBVyxDQUFDdEksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPNEUsT0FBTyxDQUFDRixPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRSxPQUFPLENBQUMyRCxHQUFSLENBQVlELFdBQVcsQ0FBQ25JLEdBQVosQ0FBZ0JxSSxLQUFLLElBQUksS0FBS2IsVUFBTCxDQUFnQmEsS0FBaEIsRUFBdUJYLFNBQXZCLEVBQWtDOU4sSUFBbEMsRUFBd0NMLE9BQXhDLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEK08sRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQzNJLE1BQWY7QUFDSDs7QUFwbkJvQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gJ3Rvbi1jbGllbnQtanMvdHlwZXMnO1xuaW1wb3J0IHsgQWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHR5cGUgeyBGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlciB9IGZyb20gJy4vYWdncmVnYXRpb25zJztcbmltcG9ydCB7IFFEYXRhQnJva2VyIH0gZnJvbSAnLi9kYXRhLWJyb2tlcic7XG5pbXBvcnQgdHlwZSB7IFFJbmRleEluZm8gfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHsgUURhdGFMaXN0ZW5lciwgUURhdGFTdWJzY3JpcHRpb24gfSBmcm9tICcuL2RhdGEtbGlzdGVuZXInO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IEF1dGggfSBmcm9tICcuLi9hdXRoJztcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgQ29sbGVjdGlvbkluZm8sIFFDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gJy4uL2ZpbHRlci9kYXRhLXR5cGVzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4uL2ZpbHRlci9kYXRhLXR5cGVzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuLi9maWx0ZXIvc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGRhdGFDb2xsZWN0aW9uSW5mbywgZGF0YVNlZ21lbnQgfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHR5cGUgeyBRRGF0YVNlZ21lbnQgfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuXG5jb25zdCBJTkZPX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIH1cblxuICAgIGVtaXRDbG9zZSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xuICAgIH1cblxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuRklOSVNIKTtcbiAgICAgICAgdGhpcy5ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgcmVxdWVzdDogUmVxdWVzdENvbnRyb2xsZXIsXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgdHlwZSBRQ29sbGVjdGlvbk9wdGlvbnMgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGxvZ3M6IFFMb2dzLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBicm9rZXI6IFFEYXRhQnJva2VyLFxuICAgIHNsb3dRdWVyaWVzQnJva2VyOiBRRGF0YUJyb2tlcixcbiAgICBpc1Rlc3RzOiBib29sZWFuLFxufTtcblxuZXhwb3J0IGNsYXNzIFFDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgaW5mbzogQ29sbGVjdGlvbkluZm87XG4gICAgaW5mb1JlZnJlc2hUaW1lOiBudW1iZXI7XG4gICAgc2VnbWVudDogUURhdGFTZWdtZW50O1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcblxuICAgIGJyb2tlcjogUURhdGFCcm9rZXI7XG4gICAgc2xvd1F1ZXJpZXNCcm9rZXI6IFFEYXRhQnJva2VyO1xuXG4gICAgaXNUZXN0czogYm9vbGVhbjtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRQ29sbGVjdGlvbk9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gb3B0aW9ucy5kb2NUeXBlO1xuICAgICAgICB0aGlzLmluZm8gPSBCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zW25hbWVdO1xuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHRoaXMuc2VnbWVudCA9IGRhdGFDb2xsZWN0aW9uSW5mb1tuYW1lXS5zZWdtZW50O1xuXG4gICAgICAgIHRoaXMubG9nID0gb3B0aW9ucy5sb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gb3B0aW9ucy5hdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IG9wdGlvbnMudHJhY2VyO1xuICAgICAgICB0aGlzLmJyb2tlciA9IG9wdGlvbnMuYnJva2VyO1xuICAgICAgICB0aGlzLnNsb3dRdWVyaWVzQnJva2VyID0gb3B0aW9ucy5zbG93UXVlcmllc0Jyb2tlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzID0gb3B0aW9ucy5zdGF0cztcbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJQcm92aWRlciA9IHRoaXMuc2VnbWVudCA9PT0gZGF0YVNlZ21lbnQuTVVUQUJMRSA/IHRoaXMuYnJva2VyLm11dGFibGUgOiB0aGlzLmJyb2tlci5pbW11dGFibGVIb3Q7XG4gICAgICAgIGxpc3RlbmVyUHJvdmlkZXIuc3Vic2NyaWJlKHRoaXMubmFtZSwgZG9jID0+IHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYykpO1xuICAgIH1cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuaW5mb1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG5cbiAgICAgICAgY29uc3QgaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlID0gdGhpcy5uYW1lID09PSAnbWVzc2FnZXMnXG4gICAgICAgICAgICAmJiBkb2MuX2tleVxuICAgICAgICAgICAgJiYgZG9jLm1zZ190eXBlID09PSAxXG4gICAgICAgICAgICAmJiBkb2Muc3RhdHVzID09PSA1XG4gICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSB0aGlzLnRyYWNlci5zdGFydFNwYW4oJ21lc3NhZ2VEYk5vdGlmaWNhdGlvbicsIHtcbiAgICAgICAgICAgICAgICBjaGlsZE9mOiBRVHJhY2VyLm1lc3NhZ2VSb290U3BhbkNvbnRleHQoZG9jLl9rZXkpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmFkZFRhZ3Moe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VJZDogZG9jLl9rZXksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBRRGF0YVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ub25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsIHBhcmFtczogUVBhcmFtcykge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHM7XG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oJywnKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuX2tleSAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ21lc3NhZ2VzJzpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkRmlsdGVyQ29uZGl0aW9uKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldCgnX2tleScsICdkb2MuX2tleScpO1xuICAgICAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmRvY1R5cGUuZmllbGRzO1xuICAgICAgICBpZiAoc2VsZWN0aW9ucyAmJiBmaWVsZHMpIHtcbiAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgJ2RvYycsIHNlbGVjdGlvbnMsIGZpZWxkcyk7XG4gICAgICAgIH1cbiAgICAgICAgZXhwcmVzc2lvbnMuZGVsZXRlKCdpZCcpO1xuICAgICAgICByZXR1cm4gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG4gICAgICAgIGNvbnN0IHJldHVybkV4cHJlc3Npb24gPSB0aGlzLmJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnMpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiAke3JldHVybkV4cHJlc3Npb259YDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgbGV0IHN0YXRLZXkgPSB0ZXh0O1xuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YXRLZXkgPSBgJHtzdGF0S2V5fSR7b3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9ICR7eC5kaXJlY3Rpb259YCkuam9pbignICcpfWA7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeSh0aGlzLmluZm8sIHRoaXMuZG9jVHlwZSwgZmlsdGVyLCBvcmRlckJ5IHx8IFtdLCBjb25zb2xlKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChzdGF0S2V5LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNGYXN0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8uZmllbGROb2Rlc1swXS5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcXVlc3QuZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeUJyb2tlcih0ZXh0LCB2YXJzLCBvcmRlckJ5LCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5QnJva2VyKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGJyb2tlciA9IGlzRmFzdCA/IHRoaXMuYnJva2VyIDogdGhpcy5zbG93UXVlcmllc0Jyb2tlcjtcbiAgICAgICAgcmV0dXJuIGJyb2tlci5xdWVyeSh7XG4gICAgICAgICAgICBzZWdtZW50OiB0aGlzLnNlZ21lbnQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgdmFycyxcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVCeSA9IChyZWFzb246IHN0cmluZywgcmVzb2x2ZTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5ldmVudHMub24oUmVxdWVzdEV2ZW50LkNMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdjbG9zZScsIHJlc29sdmVPbkNsb3NlLCBbXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5QnJva2VyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5QnJva2VyKHEudGV4dCwgcS5wYXJhbXMsIFtdLCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0WzBdLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEluZGV4ZXMoKTogUHJvbWlzZTxRSW5kZXhJbmZvW10+IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSB0aGlzLnNlZ21lbnQgPT09IGRhdGFTZWdtZW50Lk1VVEFCTEUgPyB0aGlzLmJyb2tlci5tdXRhYmxlIDogdGhpcy5icm9rZXIuaW1tdXRhYmxlSG90O1xuICAgICAgICByZXR1cm4gcHJvdmlkZXIuZ2V0Q29sbGVjdGlvbkluZGV4ZXModGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGFzeW5jIGNoZWNrUmVmcmVzaEluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGVzdHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMuaW5mb1JlZnJlc2hUaW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpICsgSU5GT19SRUZSRVNIX0lOVEVSVkFMO1xuICAgICAgICBjb25zdCBhY3R1YWxJbmRleGVzID0gYXdhaXQgdGhpcy5nZXRJbmRleGVzKCk7XG5cbiAgICAgICAgY29uc3Qgc2FtZUluZGV4ZXMgPSAoYUluZGV4ZXM6IFFJbmRleEluZm9bXSwgYkluZGV4ZXM6IFFJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJJbmRleCBvZiBiSW5kZXhlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYVJlc3QuZGVsZXRlKGJJbmRleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGFjdHVhbEluZGV4ZXMsIHRoaXMuaW5mby5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1JFTE9BRF9JTkRFWEVTJywgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZm8uaW5kZXhlcyA9IGFjdHVhbEluZGV4ZXMubWFwKHggPT4gKHsgZmllbGRzOiB4LmZpZWxkcyB9KSk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoYXJncy50aW1lb3V0ID09PSAwKSA/IDAgOiAoYXJncy50aW1lb3V0IHx8IDQwMDAwKTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5QnJva2VyKFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIFtdLFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCwgYXJncywgY29udGV4dCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==