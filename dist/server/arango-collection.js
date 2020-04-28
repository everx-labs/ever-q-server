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
function checkUsedAccessKey(usedAccessKey, accessKey, context) {
  if (!accessKey) {
    return usedAccessKey;
  }

  if (usedAccessKey && accessKey !== usedAccessKey) {
    context.multipleAccessKeysDetected = true;
    throw (0, _utils.createError)(400, 'Request must use the same access key for all queries and mutations');
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
  constructor(name, docType, logs, auth, tracer, stats, db, slowDb) {
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
    this.auth = auth;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
    this.statDoc = new _tracer.StatsCounter(stats, _config.STATS.doc.count, [`collection:${name}`]);
    this.statQuery = new _tracer.StatsCounter(stats, _config.STATS.query.count, [`collection:${name}`]);
    this.statQueryTime = new _tracer.StatsTiming(stats, _config.STATS.query.time, [`collection:${name}`]);
    this.statQueryActive = new _tracer.StatsGauge(stats, _config.STATS.query.active, [`collection:${name}`]);
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

  buildConditionQL(filter, params, accessRights) {
    const primaryCondition = Object.keys(filter).length > 0 ? this.docType.ql(params, 'doc', filter) : '';
    const additionalCondition = this.getAdditionalCondition(accessRights, params);

    if (primaryCondition === 'false' || additionalCondition === 'false') {
      return null;
    }

    return primaryCondition && additionalCondition ? `(${primaryCondition}) AND (${additionalCondition})` : primaryCondition || additionalCondition;
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildConditionQL(filter, params, accessRights);

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
    const text = `
            FOR doc IN ${this.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
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

  isFastQuery(text, filter, orderBy) {
    const existingStat = this.queryStats.get(text);

    if (existingStat !== undefined) {
      return existingStat.isFast;
    }

    const collectionInfo = _config.BLOCKCHAIN_DB.collections[this.name];
    const stat = {
      isFast: (0, _slowDetector.isFastQuery)(collectionInfo, this.docType, filter, orderBy || [], console)
    };
    this.queryStats.set(text, stat);
    return stat.isFast;
  }

  queryResolver() {
    return async (parent, args, context, info) => (0, _utils.wrap)(this.log, 'QUERY', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const q = this.createDatabaseQuery(args, info.operation.selectionSet, accessRights);

        if (!q) {
          this.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        const isFast = this.isFastQuery(q.text, q.filter, q.orderBy);
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


  createAggregationQuery(args, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildConditionQL(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const query = _aggregations.AggregationHelperFactory.createQuery(this.name, condition, args.fields);

    return {
      text: query.text,
      params: params.values,
      helpers: query.helpers
    };
  }

  aggregationResolver() {
    return async (parent, args, context) => (0, _utils.wrap)(this.log, 'AGGREGATE', args, async () => {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const q = this.createAggregationQuery(args, accessRights);

        if (!q) {
          this.log.debug('AGGREGATE', args, 0, 'SKIPPED', context.remoteAddress);
          return [];
        }

        const isFast = await this.isFastQuery(q.text, args.filter);
        const start = Date.now();
        const result = await this.query(q.text, q.params, isFast, {
          filter: args.filter,
          aggregate: args.fields
        }, context.parentSpan);
        this.log.debug('AGGREGATE', args, (Date.now() - start) / 1000, isFast ? 'FAST' : 'SLOW', context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result[0]);
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  } //--------------------------------------------------------- Internals


  dbCollection() {
    return this.db.collection(this.name);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIkNvbGxlY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJkb2NUeXBlIiwibG9ncyIsInRyYWNlciIsInN0YXRzIiwiZGIiLCJzbG93RGIiLCJsb2ciLCJjcmVhdGUiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRXYWl0Rm9yQWN0aXZlIiwid2FpdEZvciIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJzdWJzY3JpcHRpb24iLCJkb2NJbnNlcnRPclVwZGF0ZSIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJpbmNyZW1lbnQiLCJlbWl0Iiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzdWJzY3JpYmUiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIkRvY1N1YnNjcmlwdGlvbiIsImZpbHRlciIsIm9wZXJhdGlvbiIsInNlbGVjdGlvblNldCIsImV2ZW50TGlzdGVuZXIiLCJwdXNoRG9jdW1lbnQiLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkQ29uZGl0aW9uUUwiLCJwcmltYXJ5Q29uZGl0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25zIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdFRleHQiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsImNvbGxlY3Rpb25JbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwic3RhdCIsImNvbnNvbGUiLCJzZXQiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJEYXRlIiwibm93IiwicSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwicGFyZW50U3BhbiIsInJlcG9ydCIsImRlY3JlbWVudCIsIlFUcmFjZXIiLCJ0cmFjZSIsInNwYW4iLCJzZXRUYWciLCJxdWVyeURhdGFiYXNlIiwiY3Vyc29yIiwiYWxsIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJEb2NVcHNlcnRIYW5kbGVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiY3JlYXRlQWdncmVnYXRpb25RdWVyeSIsIkFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSIsImNyZWF0ZVF1ZXJ5IiwiZmllbGRzIiwiaGVscGVycyIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJhZ2dyZWdhdGUiLCJjb252ZXJ0UmVzdWx0cyIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQXBDQTs7Ozs7Ozs7Ozs7Ozs7O0FBNkRBLFNBQVNBLGtCQUFULENBQ0lDLGFBREosRUFFSUMsU0FGSixFQUdJQyxPQUhKLEVBSVc7QUFDUCxNQUFJLENBQUNELFNBQUwsRUFBZ0I7QUFDWixXQUFPRCxhQUFQO0FBQ0g7O0FBQ0QsTUFBSUEsYUFBYSxJQUFJQyxTQUFTLEtBQUtELGFBQW5DLEVBQWtEO0FBQzlDRSxJQUFBQSxPQUFPLENBQUNDLDBCQUFSLEdBQXFDLElBQXJDO0FBQ0EsVUFBTSx3QkFDRixHQURFLEVBRUYsb0VBRkUsQ0FBTjtBQUlIOztBQUNELFNBQU9GLFNBQVA7QUFDSDs7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akNFLE1BQUFBLE9BQU8sRUFBRSxFQUh3QjtBQUlqQ0MsTUFBQUEsS0FBSyxFQUFFLENBSjBCO0FBS2pDQyxNQUFBQSxPQUxpQztBQU1qQ2EsTUFBQUEsV0FBVyxFQUFFLElBTm9CO0FBT2pDRCxNQUFBQSxJQUFJLEVBQUVrRSxXQUFXLENBQUNsRSxJQVBlO0FBUWpDbEMsTUFBQUEsTUFBTSxFQUFFb0csV0FBVyxDQUFDcEcsTUFSYTtBQVNqQ2IsTUFBQUEsWUFBWSxFQUFFOUM7QUFUbUIsS0FBbEIsRUFVaEIsSUFWZ0IsRUFVVixJQVZVLEVBVUosSUFWSSxDQUFuQjtBQVdBLFdBQU93SSxJQUFJLENBQUMsQ0FBRCxDQUFYO0FBQ0g7O0FBRUQsUUFBTThCLFdBQU4sQ0FDSUMsV0FESixFQUVJVCxTQUZKLEVBR0l2SyxJQUhKLEVBSWtCO0FBQ2QsUUFBSSxDQUFDZ0wsV0FBRCxJQUFnQkEsV0FBVyxDQUFDMUcsTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPc0UsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRCxPQUFPLENBQUNKLEdBQVIsQ0FBWXdDLFdBQVcsQ0FBQ3ZHLEdBQVosQ0FBZ0J3RyxLQUFLLElBQUksS0FBS1osVUFBTCxDQUFnQlksS0FBaEIsRUFBdUJWLFNBQXZCLEVBQWtDdkssSUFBbEMsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURrTCxFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDOUcsTUFBZjtBQUNIOztBQS9kbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSBcInRvbi1jbGllbnQtanMvdHlwZXNcIjtcbmltcG9ydCB7IEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeSB9IGZyb20gXCIuL2FnZ3JlZ2F0aW9uc1wiO1xuaW1wb3J0IHR5cGUgeyBGaWVsZEFnZ3JlZ2F0aW9uLCBBZ2dyZWdhdGlvbkhlbHBlciB9IGZyb20gXCIuL2FnZ3JlZ2F0aW9uc1wiO1xuaW1wb3J0IHsgRG9jVXBzZXJ0SGFuZGxlciwgRG9jU3Vic2NyaXB0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWxpc3RlbmVyc1wiO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQkxPQ0tDSEFJTl9EQiwgU1RBVFMgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgeyBwYXJzZVNlbGVjdGlvblNldCwgUVBhcmFtcywgc2VsZWN0aW9uVG9TdHJpbmcgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihcbiAgICAgICAgICAgIDQwMCxcbiAgICAgICAgICAgICdSZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGFjY2VzcyBrZXkgZm9yIGFsbCBxdWVyaWVzIGFuZCBtdXRhdGlvbnMnLFxuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcbiAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gMDtcblxuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZENvbmRpdGlvblFMKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRDb25kaXRpb25RTChmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG5cbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdXG4gICAgKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQodGV4dCk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbkluZm8gPSBCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zW3RoaXMubmFtZV07XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KGNvbGxlY3Rpb25JbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQodGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZSh0ZXh0LCBwYXJhbXMsIGlzRmFzdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UodGV4dDogc3RyaW5nLCBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LCBpc0Zhc3Q6IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkodGV4dCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uLCBhcmdzLmZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhZ2dyZWdhdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBBZ2dyZWdhdGlvbkFyZ3MsXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ0FHR1JFR0FURScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoYXJncywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0FHR1JFR0FURScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IGFyZ3MuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGU6IGFyZ3MuZmllbGRzLFxuICAgICAgICAgICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHRbMF0pO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoYXJncy50aW1lb3V0ID09PSAwKSA/IDAgOiAoYXJncy50aW1lb3V0IHx8IDQwMDAwKTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5RGF0YWJhc2UocXVlcnlQYXJhbXMudGV4dCwgcXVlcnlQYXJhbXMucGFyYW1zLCB0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcbiAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgIH0sIHRydWUsIG51bGwsIG51bGwpO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhcbiAgICAgICAgZmllbGRWYWx1ZXM6IHN0cmluZ1tdLFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCwgYXJncykpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==