"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.Collection = void 0;

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

var _aggregations = require("./aggregations");

var _arangoListeners = require("./arango-listeners");

var _auth = require("./auth");

var _config = require("./config");

var _dbTypes = require("./db-types");

var _logs = _interopRequireDefault(require("./logs"));

var _slowDetector = require("./slow-detector");

var _tracer = require("./tracer");

var _utils = require("./utils");

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
const INFO_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

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

class Collection {
  constructor(name, docType, logs, auth, tracer, stats, db, slowDb, isTests) {
    this.name = name;
    this.docType = docType;
    this.info = _config.BLOCKCHAIN_DB.collections[name];
    this.infoRefreshTime = Date.now();
    this.log = logs.create(name);
    this.auth = auth;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.isTests = isTests;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
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
        const subscription = new _arangoListeners.DocSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _dbTypes.parseSelectionSet)(info.operation.selectionSet, this.name));

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
      (0, _dbTypes.collectReturnExpressions)(expressions, 'doc', selections, fields);
    }

    expressions.delete('id');
    return (0, _dbTypes.combineReturnExpressions)(expressions);
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = selectionInfo.selections ? (0, _dbTypes.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
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
          selection: (0, _dbTypes.selectionToString)(q.selection)
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
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context.parentSpan) : await this.query(q.text, q.params, isFast, traceParams, context.parentSpan);
        this.log.debug('QUERY', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return result;
      } catch (error) {
        this.statQueryFailed.increment();
        throw error;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  }

  async query(text, params, isFast, traceParams, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      return this.queryDatabase(text, params, isFast);
    }, parentSpan);
  }

  async queryDatabase(text, params, isFast) {
    const db = isFast ? this.db : this.slowDb;
    const cursor = await db.query(text, params);
    return cursor.all();
  }

  async queryWaitFor(q, isFast, traceParams, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, async span => {
      if (traceParams) {
        span.setTag('params', traceParams);
      }

      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;

      try {
        const onQuery = new Promise((resolve, reject) => {
          const check = () => {
            this.queryDatabase(q.text, q.params, isFast).then(docs => {
              if (!resolvedBy) {
                if (docs.length > 0) {
                  forceTimerId = null;
                  resolvedBy = 'query';
                  resolve(docs);
                } else {
                  forceTimerId = setTimeout(check, 5000);
                }
              }
            }, reject);
          };

          check();
        });
        const onChangesFeed = new Promise(resolve => {
          const authFilter = _arangoListeners.DocUpsertHandler.getAuthFilter(this.name, q.accessRights);

          waitFor = doc => {
            if (authFilter && !authFilter(doc)) {
              return;
            }

            if (this.docType.test(null, doc, q.filter)) {
              if (!resolvedBy) {
                resolvedBy = 'listener';
                resolve([doc]);
              }
            }
          };

          this.waitForCount += 1;
          this.docInsertOrUpdate.on('doc', waitFor);
          this.statWaitForActive.increment();
        });
        const onTimeout = new Promise(resolve => {
          setTimeout(() => {
            if (!resolvedBy) {
              resolvedBy = 'timeout';
              resolve([]);
            }
          }, q.timeout);
        });
        const result = await Promise.race([onQuery, onChangesFeed, onTimeout]);
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
    }, parentSpan);
  } //--------------------------------------------------------- Aggregates


  createAggregationQuery(filter, fields, accessRights) {
    const params = new _dbTypes.QParams();
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
        const result = await this.query(q.text, q.params, isFast, {
          filter: args.filter,
          aggregate: args.fields
        }, context.parentSpan);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result[0], q.helpers);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  } //--------------------------------------------------------- Internals


  dbCollection() {
    return this.db.collection(this.name);
  }

  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.infoRefreshTime) {
      return;
    }

    this.infoRefreshTime = Date.now() + INFO_REFRESH_INTERVAL;
    const actualIndexes = await this.dbCollection().indexes();

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_dbTypes.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _dbTypes.indexToString)(bIndex);

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

  async waitForDoc(fieldValue, fieldPath, args) {
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
      const docs = await this.queryDatabase(queryParams.text, queryParams.params, true);
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
    }, true, null, null);
    return docs[0];
  }

  async waitForDocs(fieldValues, fieldPath, args) {
    if (!fieldValues || fieldValues.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath, args)));
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

exports.Collection = Collection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJJTkZPX1JFRlJFU0hfSU5URVJWQUwiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIkNvbGxlY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJkb2NUeXBlIiwibG9ncyIsInRyYWNlciIsInN0YXRzIiwiZGIiLCJzbG93RGIiLCJpc1Rlc3RzIiwiaW5mbyIsIkJMT0NLQ0hBSU5fREIiLCJjb2xsZWN0aW9ucyIsImluZm9SZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJsb2ciLCJjcmVhdGUiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRRdWVyeUZhaWxlZCIsImZhaWxlZCIsInN0YXRRdWVyeVNsb3ciLCJzbG93Iiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UiLCJfa2V5IiwibXNnX3R5cGUiLCJzdGF0dXMiLCJzcGFuIiwic3RhcnRTcGFuIiwiY2hpbGRPZiIsIlFUcmFjZXIiLCJtZXNzYWdlUm9vdFNwYW5Db250ZXh0IiwiYWRkVGFncyIsIm1lc3NhZ2VJZCIsImZpbmlzaCIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwic3Vic2NyaWJlIiwiXyIsImFjY2Vzc1JpZ2h0cyIsIkRvY1N1YnNjcmlwdGlvbiIsImZpbHRlciIsIm9wZXJhdGlvbiIsInNlbGVjdGlvblNldCIsImV2ZW50TGlzdGVuZXIiLCJwdXNoRG9jdW1lbnQiLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkRmlsdGVyQ29uZGl0aW9uIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJmaWx0ZXJDb25kaXRpb24iLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiYnVpbGRSZXR1cm5FeHByZXNzaW9uIiwic2VsZWN0aW9ucyIsImV4cHJlc3Npb25zIiwic2V0IiwiZmllbGRzIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwicmV0dXJuRXhwcmVzc2lvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiY2hlY2tSZWZyZXNoSW5mbyIsInN0YXRLZXkiLCJleGlzdGluZ1N0YXQiLCJnZXQiLCJ1bmRlZmluZWQiLCJpc0Zhc3QiLCJzdGF0IiwiY29uc29sZSIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsInEiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJ0cmFjZSIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IiwiY3JlYXRlUXVlcnkiLCJoZWxwZXJzIiwiaXNGYXN0QWdncmVnYXRpb25RdWVyeSIsImgiLCJjIiwiZm4iLCJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJzdGFydHNXaXRoIiwic3Vic3RyIiwiYWdncmVnYXRpb25SZXNvbHZlciIsIkFycmF5IiwiaXNBcnJheSIsImFnZ3JlZ2F0ZSIsImNvbnZlcnRSZXN1bHRzIiwiZGJDb2xsZWN0aW9uIiwiY29sbGVjdGlvbiIsImFjdHVhbEluZGV4ZXMiLCJpbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBU0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUEzQ0E7Ozs7Ozs7Ozs7Ozs7OztBQTZDQSxNQUFNQSxxQkFBcUIsR0FBRyxLQUFLLEVBQUwsR0FBVSxJQUF4QyxDLENBQThDOztBQXlCOUMsU0FBU0Msa0JBQVQsQ0FDSUMsYUFESixFQUVJQyxTQUZKLEVBR0lDLE9BSEosRUFJVztBQUNQLE1BQUksQ0FBQ0QsU0FBTCxFQUFnQjtBQUNaLFdBQU9ELGFBQVA7QUFDSDs7QUFDRCxNQUFJQSxhQUFhLElBQUlDLFNBQVMsS0FBS0QsYUFBbkMsRUFBa0Q7QUFDOUNFLElBQUFBLE9BQU8sQ0FBQ0MsMEJBQVIsR0FBcUMsSUFBckM7QUFDQSxVQUFNQyxjQUFPQyxrQkFBUCxFQUFOO0FBQ0g7O0FBQ0QsU0FBT0osU0FBUDtBQUNIOztBQUVNLGVBQWVLLG9CQUFmLENBQW9DSixPQUFwQyxFQUFvRUssSUFBcEUsRUFBc0c7QUFDekcsUUFBTU4sU0FBUyxHQUFHQyxPQUFPLENBQUNELFNBQVIsSUFBcUJNLElBQUksQ0FBQ04sU0FBNUM7QUFDQUMsRUFBQUEsT0FBTyxDQUFDRixhQUFSLEdBQXdCRCxrQkFBa0IsQ0FBQ0csT0FBTyxDQUFDRixhQUFULEVBQXdCQyxTQUF4QixFQUFtQ0MsT0FBbkMsQ0FBMUM7QUFDQSxTQUFPQSxP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RUFBRTZILFdBQVcsQ0FBQzdILE1BUmE7QUFTakNiLE1BQUFBLFlBQVksRUFBRXBFO0FBVG1CLEtBQWxCLEVBVWhCLElBVmdCLEVBVVYsSUFWVSxFQVVKLElBVkksQ0FBbkI7QUFXQSxXQUFPZ0ssSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1xRCxXQUFOLENBQ0lDLFdBREosRUFFSVQsU0FGSixFQUdJdE4sSUFISixFQUlrQjtBQUNkLFFBQUksQ0FBQytOLFdBQUQsSUFBZ0JBLFdBQVcsQ0FBQ25JLE1BQVosS0FBdUIsQ0FBM0MsRUFBOEM7QUFDMUMsYUFBT3dFLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixFQUFoQixDQUFQO0FBQ0g7O0FBQ0QsV0FBT0QsT0FBTyxDQUFDSixHQUFSLENBQVkrRCxXQUFXLENBQUNoSSxHQUFaLENBQWdCaUksS0FBSyxJQUFJLEtBQUtaLFVBQUwsQ0FBZ0JZLEtBQWhCLEVBQXVCVixTQUF2QixFQUFrQ3ROLElBQWxDLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEaU8sRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQ3ZJLE1BQWY7QUFDSDs7QUF0bEJtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4qIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuKlxuKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4qIExpY2Vuc2UgYXQ6XG4qXG4qIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuKlxuKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4qIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4qIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7RGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbn0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQge1NwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXJ9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHR5cGUge1RPTkNsaWVudH0gZnJvbSBcInRvbi1jbGllbnQtanMvdHlwZXNcIjtcbmltcG9ydCB7QWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5fSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB0eXBlIHtGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlcn0gZnJvbSBcIi4vYWdncmVnYXRpb25zXCI7XG5pbXBvcnQge0RvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbn0gZnJvbSBcIi4vYXJhbmdvLWxpc3RlbmVyc1wiO1xuaW1wb3J0IHR5cGUge0FjY2Vzc1JpZ2h0c30gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHtBdXRofSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQge0JMT0NLQ0hBSU5fREIsIFNUQVRTfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7Q29sbGVjdGlvbkluZm8sIEluZGV4SW5mbywgUUNvbmZpZ30gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7RGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXR9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQge1xuICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgaW5kZXhUb1N0cmluZyxcbiAgICBwYXJzZVNlbGVjdGlvblNldCxcbiAgICBRUGFyYW1zLFxuICAgIHNlbGVjdGlvblRvU3RyaW5nLFxufSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUge1FMb2d9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQge2lzRmFzdFF1ZXJ5fSBmcm9tICcuL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUge0lTdGF0c30gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHtRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7UUVycm9yLCB3cmFwfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5jb25zdCBJTkZPX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuICAgIGluZm86IENvbGxlY3Rpb25JbmZvO1xuICAgIGluZm9SZWZyZXNoVGltZTogbnVtYmVyO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcbiAgICBpc1Rlc3RzOiBib29sZWFuO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICAgICAgaXNUZXN0czogYm9vbGVhbixcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcbiAgICAgICAgdGhpcy5pbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1tuYW1lXTtcbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgIHRoaXMuc2xvd0RiID0gc2xvd0RiO1xuICAgICAgICB0aGlzLmlzVGVzdHMgPSBpc1Rlc3RzO1xuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZCA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmZhaWxlZCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LnNsb3csIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuXG4gICAgICAgIGNvbnN0IGlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSA9IHRoaXMubmFtZSA9PT0gJ21lc3NhZ2VzJ1xuICAgICAgICAgICAgJiYgZG9jLl9rZXlcbiAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNVxuICAgICAgICBpZiAoaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKCdtZXNzYWdlRGJOb3RpZmljYXRpb24nLCB7XG4gICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgRG9jU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KCdfa2V5JywgJ2RvYy5fa2V5Jyk7XG4gICAgICAgIGNvbnN0IGZpZWxkcyA9IHRoaXMuZG9jVHlwZS5maWVsZHM7XG4gICAgICAgIGlmIChzZWxlY3Rpb25zICYmIGZpZWxkcykge1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCAnZG9jJywgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgICBleHByZXNzaW9ucy5kZWxldGUoJ2lkJyk7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucyk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKCcgJyl9YDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHN0YXRLZXkpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KHRoaXMuaW5mbywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5maWVsZE5vZGVzWzBdLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZC5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZSh0ZXh0LCBwYXJhbXMsIGlzRmFzdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UodGV4dDogc3RyaW5nLCBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LCBpc0Zhc3Q6IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkodGV4dCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uIHx8ICcnLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHF1ZXJ5LmhlbHBlcnMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgZm9yIChjb25zdCBoOiBBZ2dyZWdhdGlvbkhlbHBlciBvZiBoZWxwZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xuICAgICAgICAgICAgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHRleHQsIGZpbHRlcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnZG9jLicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cignZG9jLicubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246ICdBU0MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICApKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnQUdHUkVHQVRFJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gQXJyYXkuaXNBcnJheShhcmdzLmZpZWxkcykgJiYgYXJncy5maWVsZHMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGFyZ3MuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgIDogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjogQWdncmVnYXRpb25Gbi5DT1VOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0QWdncmVnYXRpb25RdWVyeShxLnRleHQsIGZpbHRlciwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0WzBdLCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBjaGVja1JlZnJlc2hJbmZvKCkge1xuICAgICAgICBpZiAodGhpcy5pc1Rlc3RzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKERhdGUubm93KCkgPCB0aGlzLmluZm9SZWZyZXNoVGltZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5mb1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKSArIElORk9fUkVGUkVTSF9JTlRFUlZBTDtcbiAgICAgICAgY29uc3QgYWN0dWFsSW5kZXhlcyA9IGF3YWl0IHRoaXMuZGJDb2xsZWN0aW9uKCkuaW5kZXhlcygpO1xuXG4gICAgICAgIGNvbnN0IHNhbWVJbmRleGVzID0gKGFJbmRleGVzOiBJbmRleEluZm9bXSwgYkluZGV4ZXM6IEluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmZvLmluZGV4ZXMpKSB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUkVMT0FEX0lOREVYRVMnLCBhY3R1YWxJbmRleGVzKTtcbiAgICAgICAgICAgIHRoaXMuaW5mby5pbmRleGVzID0gYWN0dWFsSW5kZXhlcy5tYXAoeCA9PiAoe2ZpZWxkczogeC5maWVsZHN9KSk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7W2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7YW55OiB7ZXE6IGZpZWxkVmFsdWV9fX0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczoge3Y6IGZpZWxkVmFsdWV9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7aWQ6IHtlcTogZmllbGRWYWx1ZX19LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHt2OiBmaWVsZFZhbHVlfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlEYXRhYmFzZShxdWVyeVBhcmFtcy50ZXh0LCBxdWVyeVBhcmFtcy5wYXJhbXMsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgfSwgdHJ1ZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKFxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzKSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuIl19