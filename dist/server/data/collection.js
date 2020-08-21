"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QDataCollection = exports.RequestController = exports.RequestEvent = void 0;

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

class QDataCollection {
  constructor(options) {
    const name = options.name;
    this.name = name;
    this.docType = options.docType;
    this.info = _dataProvider.dataCollectionInfo[name];
    this.infoRefreshTime = Date.now();
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
    const listenerProvider = this.getHotProvider();
    listenerProvider.subscribe(this.name, doc => this.onDocumentInsertOrUpdate(doc));
  }

  getHotProvider() {
    return this.info.segment === _dataProvider.dataSegment.MUTABLE ? this.broker.mutable : this.broker.immutableHot;
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
      segment: this.info.segment,
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
    return this.getHotProvider().getCollectionIndexes(this.name);
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

exports.QDataCollection = QDataCollection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklORk9fUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhQ29sbGVjdGlvbiIsIm9wdGlvbnMiLCJuYW1lIiwiZG9jVHlwZSIsImluZm8iLCJkYXRhQ29sbGVjdGlvbkluZm8iLCJpbmZvUmVmcmVzaFRpbWUiLCJEYXRlIiwibm93IiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImJyb2tlciIsInNsb3dRdWVyaWVzQnJva2VyIiwiaXNUZXN0cyIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdHMiLCJzdGF0RG9jIiwiU3RhdHNDb3VudGVyIiwiU1RBVFMiLCJkb2MiLCJjb3VudCIsInN0YXRRdWVyeSIsInF1ZXJ5Iiwic3RhdFF1ZXJ5VGltZSIsIlN0YXRzVGltaW5nIiwidGltZSIsInN0YXRRdWVyeUFjdGl2ZSIsIlN0YXRzR2F1Z2UiLCJhY3RpdmUiLCJzdGF0UXVlcnlGYWlsZWQiLCJmYWlsZWQiLCJzdGF0UXVlcnlTbG93Iiwic2xvdyIsInN0YXRXYWl0Rm9yQWN0aXZlIiwid2FpdEZvciIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJzdWJzY3JpcHRpb24iLCJkb2NJbnNlcnRPclVwZGF0ZSIsInNldE1heExpc3RlbmVycyIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJsaXN0ZW5lclByb3ZpZGVyIiwiZ2V0SG90UHJvdmlkZXIiLCJzdWJzY3JpYmUiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzZWdtZW50IiwiZGF0YVNlZ21lbnQiLCJNVVRBQkxFIiwibXV0YWJsZSIsImltbXV0YWJsZUhvdCIsImRyb3BDYWNoZWREYkluZm8iLCJpbmNyZW1lbnQiLCJpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UiLCJfa2V5IiwibXNnX3R5cGUiLCJzdGF0dXMiLCJzcGFuIiwic3RhcnRTcGFuIiwiY2hpbGRPZiIsIlFUcmFjZXIiLCJtZXNzYWdlUm9vdFNwYW5Db250ZXh0IiwiYWRkVGFncyIsIm1lc3NhZ2VJZCIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwiXyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRGaWx0ZXJDb25kaXRpb24iLCJwcmltYXJ5Q29uZGl0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImZpbHRlckNvbmRpdGlvbiIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJidWlsZFJldHVybkV4cHJlc3Npb24iLCJzZWxlY3Rpb25zIiwiZXhwcmVzc2lvbnMiLCJzZXQiLCJmaWVsZHMiLCJkZWxldGUiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5Iiwic2VsZWN0aW9uSW5mbyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwic2VsZWN0aW9uIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdFRleHQiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJyZXR1cm5FeHByZXNzaW9uIiwidGV4dCIsIm9wZXJhdGlvbklkIiwidmFsdWVzIiwiaXNGYXN0UXVlcnkiLCJjaGVja1JlZnJlc2hJbmZvIiwic3RhdEtleSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsInN0YXQiLCJjb25zb2xlIiwicXVlcnlSZXNvbHZlciIsInBhcmVudCIsInN0YXJ0IiwicSIsImZpZWxkTm9kZXMiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsImVycm9yIiwicmVwb3J0IiwiZGVjcmVtZW50IiwicmVxdWVzdCIsInZhcnMiLCJ0cmFjZSIsInNldFRhZyIsInF1ZXJ5QnJva2VyIiwicGFyZW50U3BhbiIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJyZXNvbHZlT25DbG9zZSIsInJlc29sdmVCeSIsInJlYXNvbiIsInJlc29sdmUiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJRRGF0YUxpc3RlbmVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiaGVscGVycyIsImlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkiLCJoIiwiYyIsImZuIiwiQWdncmVnYXRpb25GbiIsIkNPVU5UIiwiTUlOIiwiTUFYIiwic3RhcnRzV2l0aCIsInN1YnN0ciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJBcnJheSIsImlzQXJyYXkiLCJjb252ZXJ0UmVzdWx0cyIsImdldEluZGV4ZXMiLCJnZXRDb2xsZWN0aW9uSW5kZXhlcyIsImFjdHVhbEluZGV4ZXMiLCJzYW1lSW5kZXhlcyIsImFJbmRleGVzIiwiYkluZGV4ZXMiLCJhUmVzdCIsIlNldCIsImluZGV4VG9TdHJpbmciLCJiSW5kZXgiLCJiSW5kZXhTdHJpbmciLCJzaXplIiwiaW5kZXhlcyIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBU0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUE3Q0E7Ozs7Ozs7Ozs7Ozs7OztBQWdEQSxNQUFNQSxxQkFBcUIsR0FBRyxLQUFLLEVBQUwsR0FBVSxJQUF4QyxDLENBQThDOztBQUV2QyxNQUFNQyxZQUFZLEdBQUc7QUFDeEJDLEVBQUFBLEtBQUssRUFBRSxPQURpQjtBQUV4QkMsRUFBQUEsTUFBTSxFQUFFO0FBRmdCLENBQXJCOzs7QUFLQSxNQUFNQyxpQkFBTixDQUF3QjtBQUczQkMsRUFBQUEsV0FBVyxHQUFHO0FBQ1YsU0FBS0MsTUFBTCxHQUFjLElBQUlDLGVBQUosRUFBZDtBQUNIOztBQUVEQyxFQUFBQSxT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TyxXQUFELElBQWdCQSxXQUFXLENBQUNySSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU80RSxPQUFPLENBQUNGLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9FLE9BQU8sQ0FBQzBELEdBQVIsQ0FBWUQsV0FBVyxDQUFDbEksR0FBWixDQUFnQm9JLEtBQUssSUFBSSxLQUFLYixVQUFMLENBQWdCYSxLQUFoQixFQUF1QlgsU0FBdkIsRUFBa0M1TixJQUFsQyxFQUF3Q0wsT0FBeEMsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRUQ2TyxFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDMUksTUFBZjtBQUNIOztBQXJuQndCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4qXG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiogTGljZW5zZSBhdDpcbipcbiogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4qXG4qIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4qIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gJ29wZW50cmFjaW5nJztcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSAndG9uLWNsaWVudC1qcy90eXBlcyc7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tICcuL2FnZ3JlZ2F0aW9ucyc7XG5pbXBvcnQgdHlwZSB7IEZpZWxkQWdncmVnYXRpb24sIEFnZ3JlZ2F0aW9uSGVscGVyIH0gZnJvbSAnLi9hZ2dyZWdhdGlvbnMnO1xuaW1wb3J0IHsgUURhdGFCcm9rZXIgfSBmcm9tICcuL2RhdGEtYnJva2VyJztcbmltcG9ydCB0eXBlIHsgUUNvbGxlY3Rpb25JbmZvLCBRSW5kZXhJbmZvIH0gZnJvbSAnLi9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IFFEYXRhTGlzdGVuZXIsIFFEYXRhU3Vic2NyaXB0aW9uIH0gZnJvbSAnLi9kYXRhLWxpc3RlbmVyJztcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSAnLi4vYXV0aCc7XG5pbXBvcnQgeyBTVEFUUyB9IGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gJy4uL2ZpbHRlci9kYXRhLXR5cGVzJztcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gJy4uL2ZpbHRlci9kYXRhLXR5cGVzJztcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4uL2xvZ3MnO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuLi9maWx0ZXIvc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4uL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSAnLi4vdHJhY2VyJztcbmltcG9ydCB7IFFFcnJvciwgd3JhcCB9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IGRhdGFDb2xsZWN0aW9uSW5mbywgZGF0YVNlZ21lbnQgfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHR5cGUgeyBRRGF0YVNlZ21lbnQgfSBmcm9tICcuL2RhdGEtcHJvdmlkZXInO1xuXG5jb25zdCBJTkZPX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiAnY2xvc2UnLFxuICAgIEZJTklTSDogJ2ZpbmlzaCcsXG59O1xuXG5leHBvcnQgY2xhc3MgUmVxdWVzdENvbnRyb2xsZXIge1xuICAgIGV2ZW50czogRXZlbnRFbWl0dGVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgIH1cblxuICAgIGVtaXRDbG9zZSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xuICAgIH1cblxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuRklOSVNIKTtcbiAgICAgICAgdGhpcy5ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgcmVxdWVzdDogUmVxdWVzdENvbnRyb2xsZXIsXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgdHlwZSBRQ29sbGVjdGlvbk9wdGlvbnMgPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGxvZ3M6IFFMb2dzLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBicm9rZXI6IFFEYXRhQnJva2VyLFxuICAgIHNsb3dRdWVyaWVzQnJva2VyOiBRRGF0YUJyb2tlcixcbiAgICBpc1Rlc3RzOiBib29sZWFuLFxufTtcblxuZXhwb3J0IGNsYXNzIFFEYXRhQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuICAgIGluZm86IFFDb2xsZWN0aW9uSW5mbztcbiAgICBpbmZvUmVmcmVzaFRpbWU6IG51bWJlcjtcblxuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlGYWlsZWQ6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlTbG93OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG5cbiAgICBicm9rZXI6IFFEYXRhQnJva2VyO1xuICAgIHNsb3dRdWVyaWVzQnJva2VyOiBRRGF0YUJyb2tlcjtcblxuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5pbmZvID0gZGF0YUNvbGxlY3Rpb25JbmZvW25hbWVdO1xuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBvcHRpb25zLmxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBvcHRpb25zLmF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gb3B0aW9ucy50cmFjZXI7XG4gICAgICAgIHRoaXMuYnJva2VyID0gb3B0aW9ucy5icm9rZXI7XG4gICAgICAgIHRoaXMuc2xvd1F1ZXJpZXNCcm9rZXIgPSBvcHRpb25zLnNsb3dRdWVyaWVzQnJva2VyO1xuICAgICAgICB0aGlzLmlzVGVzdHMgPSBvcHRpb25zLmlzVGVzdHM7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgICAgICBjb25zdCBsaXN0ZW5lclByb3ZpZGVyID0gdGhpcy5nZXRIb3RQcm92aWRlcigpO1xuICAgICAgICBsaXN0ZW5lclByb3ZpZGVyLnN1YnNjcmliZSh0aGlzLm5hbWUsIGRvYyA9PiB0aGlzLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpKTtcbiAgICB9XG5cbiAgICBnZXRIb3RQcm92aWRlcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaW5mby5zZWdtZW50ID09PSBkYXRhU2VnbWVudC5NVVRBQkxFID8gdGhpcy5icm9rZXIubXV0YWJsZSA6IHRoaXMuYnJva2VyLmltbXV0YWJsZUhvdDtcbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuXG4gICAgICAgIGNvbnN0IGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSA9IHRoaXMubmFtZSA9PT0gJ21lc3NhZ2VzJ1xuICAgICAgICAgICAgJiYgZG9jLl9rZXlcbiAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNVxuICAgICAgICBpZiAoaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKCdtZXNzYWdlRGJOb3RpZmljYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgUURhdGFTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZpbHRlckNvbmRpdGlvbihcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBidWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQoJ19rZXknLCAnZG9jLl9rZXknKTtcbiAgICAgICAgY29uc3QgZmllbGRzID0gdGhpcy5kb2NUeXBlLmZpZWxkcztcbiAgICAgICAgaWYgKHNlbGVjdGlvbnMgJiYgZmllbGRzKSB7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsICdkb2MnLCBzZWxlY3Rpb25zLCBmaWVsZHMpO1xuICAgICAgICB9XG4gICAgICAgIGV4cHJlc3Npb25zLmRlbGV0ZSgnaWQnKTtcbiAgICAgICAgcmV0dXJuIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuICAgICAgICBjb25zdCByZXR1cm5FeHByZXNzaW9uID0gdGhpcy5idWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zKTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gJHtyZXR1cm5FeHByZXNzaW9ufWA7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgIGxldCBzdGF0S2V5ID0gdGV4dDtcbiAgICAgICAgaWYgKG9yZGVyQnkgJiYgb3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdGF0S2V5ID0gYCR7c3RhdEtleX0ke29yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSAke3guZGlyZWN0aW9ufWApLmpvaW4oJyAnKX1gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQoc3RhdEtleSk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkodGhpcy5pbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGV0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzRmFzdCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIFtdLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlCcm9rZXIodGV4dCwgdmFycywgb3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KTtcbiAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeUJyb2tlcihcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBicm9rZXIgPSBpc0Zhc3QgPyB0aGlzLmJyb2tlciA6IHRoaXMuc2xvd1F1ZXJpZXNCcm9rZXI7XG4gICAgICAgIHJldHVybiBicm9rZXIucXVlcnkoe1xuICAgICAgICAgICAgc2VnbWVudDogdGhpcy5pbmZvLnNlZ21lbnQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgdmFycyxcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVCeSA9IChyZWFzb246IHN0cmluZywgcmVzb2x2ZTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5ldmVudHMub24oUmVxdWVzdEV2ZW50LkNMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KCdjbG9zZScsIHJlc29sdmVPbkNsb3NlLCBbXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5QnJva2VyKHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoJ3F1ZXJ5JywgcmVzb2x2ZSwgZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gUURhdGFMaXN0ZW5lci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeSgnbGlzdGVuZXInLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZUJ5KCd0aW1lb3V0JywgcmVzb2x2ZSwgW10pLCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnkgPSBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY3JlYXRlUXVlcnkodGhpcy5uYW1lLCBjb25kaXRpb24gfHwgJycsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKCdkb2MuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKCdkb2MuJy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogJ0FTQycsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5ULFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoZmlsdGVyLCBmaWVsZHMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KHEudGV4dCwgZmlsdGVyLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5QnJva2VyKHEudGV4dCwgcS5wYXJhbXMsIFtdLCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0WzBdLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEluZGV4ZXMoKTogUHJvbWlzZTxRSW5kZXhJbmZvW10+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SG90UHJvdmlkZXIoKS5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmZvUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZm9SZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkZPX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmZvLmluZGV4ZXMpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUkVMT0FEX0lOREVYRVMnLCBhY3R1YWxJbmRleGVzKTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5pbmRleGVzID0gYWN0dWFsSW5kZXhlcy5tYXAoeCA9PiAoeyBmaWVsZHM6IHguZmllbGRzIH0pKTtcbiAgICAgICAgICAgIHRoaXMucXVlcnlTdGF0cy5jbGVhcigpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlCcm9rZXIoXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgW10sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzLCBjb250ZXh0KSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuIl19