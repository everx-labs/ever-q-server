"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.Collection = exports.AggregationFn = void 0;

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

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
const AggregationFn = {
  COUNT: 'COUNT',
  MIN: 'MIN',
  MAX: 'MAX',
  SUM: 'SUM',
  AVERAGE: 'AVERAGE',
  STDDEV_POPULATION: 'STDDEV_POPULATION',
  STDDEV_SAMPLE: 'STDDEV_SAMPLE',
  VARIANCE_POPULATION: 'VARIANCE_POPULATION',
  VARIANCE_SAMPLE: 'VARIANCE_SAMPLE'
};
exports.AggregationFn = AggregationFn;

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

  createAggregationQuery(args, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const condition = this.buildConditionQL(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : '';
    const text = `
            FOR doc IN ${this.name}
            ${filterSection}
            RETURN doc`;
    return {
      text,
      params: params.values
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
        return result;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    });
  } //--------------------------------------------------------- Internals


  dbCollection() {
    return this.db.collection(this.name);
  }

  async waitForDoc(fieldValue, fieldPath) {
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
    const docs = await this.queryWaitFor({
      filter: queryParams.filter,
      selection: [],
      orderBy: [],
      limit: 1,
      timeout: 40000,
      operationId: null,
      text: queryParams.text,
      params: queryParams.params,
      accessRights: accessGranted
    }, true, null, null);
    return docs[0];
  }

  async waitForDocs(fieldValues, fieldPath) {
    if (!fieldValues || fieldValues.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath)));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJpc0Zhc3RRdWVyeSIsImV4aXN0aW5nU3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsImNvbGxlY3Rpb25JbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwic3RhdCIsImNvbnNvbGUiLCJzZXQiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJEYXRlIiwibm93IiwicSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsInRyYWNlUGFyYW1zIiwicmVzdWx0IiwicXVlcnlXYWl0Rm9yIiwicGFyZW50U3BhbiIsInJlcG9ydCIsImRlY3JlbWVudCIsIlFUcmFjZXIiLCJ0cmFjZSIsInNwYW4iLCJzZXRUYWciLCJxdWVyeURhdGFiYXNlIiwiY3Vyc29yIiwiYWxsIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsImF1dGhGaWx0ZXIiLCJEb2NVcHNlcnRIYW5kbGVyIiwiZ2V0QXV0aEZpbHRlciIsInRlc3QiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwiYWdncmVnYXRpb25SZXNvbHZlciIsImFnZ3JlZ2F0ZSIsImZpZWxkcyIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUFDQTs7OztBQWxDQTs7Ozs7Ozs7Ozs7Ozs7O0FBcURPLE1BQU1BLGFBQWEsR0FBRztBQUN6QkMsRUFBQUEsS0FBSyxFQUFFLE9BRGtCO0FBRXpCQyxFQUFBQSxHQUFHLEVBQUUsS0FGb0I7QUFHekJDLEVBQUFBLEdBQUcsRUFBRSxLQUhvQjtBQUl6QkMsRUFBQUEsR0FBRyxFQUFFLEtBSm9CO0FBS3pCQyxFQUFBQSxPQUFPLEVBQUUsU0FMZ0I7QUFNekJDLEVBQUFBLGlCQUFpQixFQUFFLG1CQU5NO0FBT3pCQyxFQUFBQSxhQUFhLEVBQUUsZUFQVTtBQVF6QkMsRUFBQUEsbUJBQW1CLEVBQUUscUJBUkk7QUFTekJDLEVBQUFBLGVBQWUsRUFBRTtBQVRRLENBQXRCOzs7QUF5QlAsU0FBU0Msa0JBQVQsQ0FDSUMsYUFESixFQUVJQyxTQUZKLEVBR0lDLE9BSEosRUFJVztBQUNQLE1BQUksQ0FBQ0QsU0FBTCxFQUFnQjtBQUNaLFdBQU9ELGFBQVA7QUFDSDs7QUFDRCxNQUFJQSxhQUFhLElBQUlDLFNBQVMsS0FBS0QsYUFBbkMsRUFBa0Q7QUFDOUNFLElBQUFBLE9BQU8sQ0FBQ0MsMEJBQVIsR0FBcUMsSUFBckM7QUFDQSxVQUFNLHdCQUNGLEdBREUsRUFFRixvRUFGRSxDQUFOO0FBSUg7O0FBQ0QsU0FBT0YsU0FBUDtBQUNIOztBQUVNLGVBQWVHLG9CQUFmLENBQW9DRixPQUFwQyxFQUFvRUcsSUFBcEUsRUFBc0c7QUFDekcsUUFBTUosU0FBUyxHQUFHQyxPQUFPLENBQUNELFNBQVIsSUFBcUJJLElBQUksQ0FBQ0osU0FBNUM7QUFDQUMsRUFBQUEsT0FBTyxDQUFDRixhQUFSLEdBQXdCRCxrQkFBa0IsQ0FBQ0csT0FBTyxDQUFDRixhQUFULEVBQXdCQyxTQUF4QixFQUFtQ0MsT0FBbkMsQ0FBMUM7QUFDQSxTQUFPQSxPQUFPLENBQUNJLElBQVIsQ0FBYUYsb0JBQWIsQ0FBa0NILFNBQWxDLENBQVA7QUFDSDs7QUFFTSxTQUFTTSxpQkFBVCxDQUEyQkwsT0FBM0IsRUFBMkRHLElBQTNELEVBQXNFO0FBQ3pFLFFBQU1KLFNBQVMsR0FBR0ksSUFBSSxDQUFDSixTQUF2QjtBQUNBQyxFQUFBQSxPQUFPLENBQUNNLGdCQUFSLEdBQTJCVCxrQkFBa0IsQ0FBQ0csT0FBTyxDQUFDTSxnQkFBVCxFQUEyQlAsU0FBM0IsRUFBc0NDLE9BQXRDLENBQTdDOztBQUNBLE1BQUksQ0FBQ0QsU0FBRCxJQUFjLENBQUNDLE9BQU8sQ0FBQ08sTUFBUixDQUFlQyxhQUFmLENBQTZCQyxHQUE3QixDQUFpQ1YsU0FBakMsQ0FBbkIsRUFBZ0U7QUFDNUQsVUFBTVcsV0FBS0MsaUJBQUwsRUFBTjtBQUNIO0FBQ0o7O0FBRUQsTUFBTUMsYUFBMkIsR0FBRztBQUNoQ0MsRUFBQUEsT0FBTyxFQUFFLElBRHVCO0FBRWhDQyxFQUFBQSxrQkFBa0IsRUFBRTtBQUZZLENBQXBDOztBQUtPLE1BQU1DLFVBQU4sQ0FBaUI7QUF1QnBCQyxFQUFBQSxXQUFXLENBQ1BDLElBRE8sRUFFUEMsT0FGTyxFQUdQQyxJQUhPLEVBSVBmLElBSk8sRUFLUGdCLE1BTE8sRUFNUEMsS0FOTyxFQU9QQyxFQVBPLEVBUVBDLE1BUk8sRUFTVDtBQUNFLFNBQUtOLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLE9BQUwsR0FBZUEsT0FBZjtBQUVBLFNBQUtNLEdBQUwsR0FBV0wsSUFBSSxDQUFDTSxNQUFMLENBQVlSLElBQVosQ0FBWDtBQUNBLFNBQUtiLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtnQixNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRSxFQUFMLEdBQVVBLEVBQVY7QUFDQSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRyxZQUFMLEdBQW9CLENBQXBCO0FBQ0EsU0FBS0MsaUJBQUwsR0FBeUIsQ0FBekI7QUFFQSxTQUFLQyxPQUFMLEdBQWUsSUFBSUMsb0JBQUosQ0FBaUJSLEtBQWpCLEVBQXdCUyxjQUFNQyxHQUFOLENBQVVDLEtBQWxDLEVBQXlDLENBQUUsY0FBYWYsSUFBSyxFQUFwQixDQUF6QyxDQUFmO0FBQ0EsU0FBS2dCLFNBQUwsR0FBaUIsSUFBSUosb0JBQUosQ0FBaUJSLEtBQWpCLEVBQXdCUyxjQUFNSSxLQUFOLENBQVlGLEtBQXBDLEVBQTJDLENBQUUsY0FBYWYsSUFBSyxFQUFwQixDQUEzQyxDQUFqQjtBQUNBLFNBQUtrQixhQUFMLEdBQXFCLElBQUlDLG1CQUFKLENBQWdCZixLQUFoQixFQUF1QlMsY0FBTUksS0FBTixDQUFZRyxJQUFuQyxFQUF5QyxDQUFFLGNBQWFwQixJQUFLLEVBQXBCLENBQXpDLENBQXJCO0FBQ0EsU0FBS3FCLGVBQUwsR0FBdUIsSUFBSUMsa0JBQUosQ0FBZWxCLEtBQWYsRUFBc0JTLGNBQU1JLEtBQU4sQ0FBWU0sTUFBbEMsRUFBMEMsQ0FBRSxjQUFhdkIsSUFBSyxFQUFwQixDQUExQyxDQUF2QjtBQUNBLFNBQUt3QixpQkFBTCxHQUF5QixJQUFJRixrQkFBSixDQUFlbEIsS0FBZixFQUFzQlMsY0FBTVksT0FBTixDQUFjRixNQUFwQyxFQUE0QyxDQUFFLGNBQWF2QixJQUFLLEVBQXBCLENBQTVDLENBQXpCO0FBQ0EsU0FBSzBCLHNCQUFMLEdBQThCLElBQUlKLGtCQUFKLENBQWVsQixLQUFmLEVBQXNCUyxjQUFNYyxZQUFOLENBQW1CSixNQUF6QyxFQUFpRCxDQUFFLGNBQWF2QixJQUFLLEVBQXBCLENBQWpELENBQTlCO0FBRUEsU0FBSzRCLGlCQUFMLEdBQXlCLElBQUlDLGVBQUosRUFBekI7QUFDQSxTQUFLRCxpQkFBTCxDQUF1QkUsZUFBdkIsQ0FBdUMsQ0FBdkM7QUFDQSxTQUFLQyxVQUFMLEdBQWtCLElBQUlDLEdBQUosRUFBbEI7QUFDQSxTQUFLQyxZQUFMLEdBQW9CLENBQXBCO0FBQ0gsR0F2RG1CLENBeURwQjs7O0FBRUFDLEVBQUFBLHdCQUF3QixDQUFDcEIsR0FBRCxFQUFXO0FBQy9CLFNBQUtILE9BQUwsQ0FBYXdCLFNBQWI7QUFDQSxTQUFLUCxpQkFBTCxDQUF1QlEsSUFBdkIsQ0FBNEIsS0FBNUIsRUFBbUN0QixHQUFuQztBQUNIOztBQUVEdUIsRUFBQUEsb0JBQW9CLEdBQUc7QUFDbkIsV0FBTztBQUNIQyxNQUFBQSxTQUFTLEVBQUUsT0FBT0MsQ0FBUCxFQUFlckQsSUFBZixFQUFzQ0gsT0FBdEMsRUFBb0R5RCxJQUFwRCxLQUFrRTtBQUN6RSxjQUFNQyxZQUFZLEdBQUcsTUFBTXhELG9CQUFvQixDQUFDRixPQUFELEVBQVVHLElBQVYsQ0FBL0M7QUFDQSxjQUFNeUMsWUFBWSxHQUFHLElBQUllLGdDQUFKLENBQ2pCLEtBQUsxQyxJQURZLEVBRWpCLEtBQUtDLE9BRlksRUFHakJ3QyxZQUhpQixFQUlqQnZELElBQUksQ0FBQ3lELE1BQUwsSUFBZSxFQUpFLEVBS2pCLGdDQUFrQkgsSUFBSSxDQUFDSSxTQUFMLENBQWVDLFlBQWpDLEVBQStDLEtBQUs3QyxJQUFwRCxDQUxpQixDQUFyQjs7QUFPQSxjQUFNOEMsYUFBYSxHQUFJaEMsR0FBRCxJQUFTO0FBQzNCYSxVQUFBQSxZQUFZLENBQUNvQixZQUFiLENBQTBCakMsR0FBMUI7QUFDSCxTQUZEOztBQUdBLGFBQUtjLGlCQUFMLENBQXVCb0IsRUFBdkIsQ0FBMEIsS0FBMUIsRUFBaUNGLGFBQWpDO0FBQ0EsYUFBS3BDLGlCQUFMLElBQTBCLENBQTFCOztBQUNBaUIsUUFBQUEsWUFBWSxDQUFDc0IsT0FBYixHQUF1QixNQUFNO0FBQ3pCLGVBQUtyQixpQkFBTCxDQUF1QnNCLGNBQXZCLENBQXNDLEtBQXRDLEVBQTZDSixhQUE3QztBQUNBLGVBQUtwQyxpQkFBTCxHQUF5QnlDLElBQUksQ0FBQ0MsR0FBTCxDQUFTLENBQVQsRUFBWSxLQUFLMUMsaUJBQUwsR0FBeUIsQ0FBckMsQ0FBekI7QUFDSCxTQUhEOztBQUlBLGVBQU9pQixZQUFQO0FBQ0g7QUFwQkUsS0FBUDtBQXNCSCxHQXZGbUIsQ0F5RnBCOzs7QUFFQTBCLEVBQUFBLHNCQUFzQixDQUFDWixZQUFELEVBQTZCYSxNQUE3QixFQUE4QztBQUNoRSxVQUFNQyxRQUFRLEdBQUdkLFlBQVksQ0FBQzVDLGtCQUE5Qjs7QUFDQSxRQUFJMEQsUUFBUSxDQUFDQyxNQUFULEtBQW9CLENBQXhCLEVBQTJCO0FBQ3ZCLGFBQU8sRUFBUDtBQUNIOztBQUNELFVBQU1DLFNBQVMsR0FBR0YsUUFBUSxDQUFDQyxNQUFULEtBQW9CLENBQXBCLEdBQ1gsT0FBTUYsTUFBTSxDQUFDSSxHQUFQLENBQVdILFFBQVEsQ0FBQyxDQUFELENBQW5CLENBQXdCLEVBRG5CLEdBRVgsT0FBTUEsUUFBUSxDQUFDSSxHQUFULENBQWFDLENBQUMsSUFBSyxJQUFHTixNQUFNLENBQUNJLEdBQVAsQ0FBV0UsQ0FBWCxDQUFjLEVBQXBDLEVBQXVDQyxJQUF2QyxDQUE0QyxHQUE1QyxDQUFpRCxHQUY5RDs7QUFHQSxZQUFRLEtBQUs3RCxJQUFiO0FBQ0EsV0FBSyxVQUFMO0FBQ0ksZUFBUSxZQUFXeUQsU0FBVSxFQUE3Qjs7QUFDSixXQUFLLGNBQUw7QUFDSSxlQUFRLG9CQUFtQkEsU0FBVSxFQUFyQzs7QUFDSixXQUFLLFVBQUw7QUFDSSxlQUFRLFlBQVdBLFNBQVUsaUJBQWdCQSxTQUFVLEdBQXZEOztBQUNKO0FBQ0ksZUFBTyxFQUFQO0FBUko7QUFVSDs7QUFFREssRUFBQUEsZ0JBQWdCLENBQ1puQixNQURZLEVBRVpXLE1BRlksRUFHWmIsWUFIWSxFQUlMO0FBQ1AsVUFBTXNCLGdCQUFnQixHQUFHQyxNQUFNLENBQUNDLElBQVAsQ0FBWXRCLE1BQVosRUFBb0JhLE1BQXBCLEdBQTZCLENBQTdCLEdBQ25CLEtBQUt2RCxPQUFMLENBQWFpRSxFQUFiLENBQWdCWixNQUFoQixFQUF3QixLQUF4QixFQUErQlgsTUFBL0IsQ0FEbUIsR0FFbkIsRUFGTjtBQUdBLFVBQU13QixtQkFBbUIsR0FBRyxLQUFLZCxzQkFBTCxDQUE0QlosWUFBNUIsRUFBMENhLE1BQTFDLENBQTVCOztBQUNBLFFBQUlTLGdCQUFnQixLQUFLLE9BQXJCLElBQWdDSSxtQkFBbUIsS0FBSyxPQUE1RCxFQUFxRTtBQUNqRSxhQUFPLElBQVA7QUFDSDs7QUFDRCxXQUFRSixnQkFBZ0IsSUFBSUksbUJBQXJCLEdBQ0EsSUFBR0osZ0JBQWlCLFVBQVNJLG1CQUFvQixHQURqRCxHQUVBSixnQkFBZ0IsSUFBSUksbUJBRjNCO0FBSUg7O0FBRURDLEVBQUFBLG1CQUFtQixDQUNmbEYsSUFEZSxFQVFmbUYsYUFSZSxFQVNmNUIsWUFUZSxFQVVEO0FBQ2QsVUFBTUUsTUFBTSxHQUFHekQsSUFBSSxDQUFDeUQsTUFBTCxJQUFlLEVBQTlCO0FBQ0EsVUFBTVcsTUFBTSxHQUFHLElBQUlnQixnQkFBSixFQUFmO0FBQ0EsVUFBTWIsU0FBUyxHQUFHLEtBQUtLLGdCQUFMLENBQXNCbkIsTUFBdEIsRUFBOEJXLE1BQTlCLEVBQXNDYixZQUF0QyxDQUFsQjs7QUFDQSxRQUFJZ0IsU0FBUyxLQUFLLElBQWxCLEVBQXdCO0FBQ3BCLGFBQU8sSUFBUDtBQUNIOztBQUNELFVBQU1jLGFBQWEsR0FBR2QsU0FBUyxHQUFJLFVBQVNBLFNBQVUsRUFBdkIsR0FBMkIsRUFBMUQ7QUFDQSxVQUFNZSxTQUFTLEdBQUdILGFBQWEsQ0FBQ0ksVUFBZCxHQUNaLGdDQUFrQkosYUFBbEIsRUFBaUMsS0FBS3JFLElBQXRDLENBRFksR0FFWnFFLGFBRk47QUFHQSxVQUFNSyxPQUFrQixHQUFHeEYsSUFBSSxDQUFDd0YsT0FBTCxJQUFnQixFQUEzQztBQUNBLFVBQU1DLEtBQWEsR0FBR3pGLElBQUksQ0FBQ3lGLEtBQUwsSUFBYyxFQUFwQztBQUNBLFVBQU1DLE9BQU8sR0FBR0MsTUFBTSxDQUFDM0YsSUFBSSxDQUFDMEYsT0FBTixDQUFOLElBQXdCLENBQXhDO0FBQ0EsVUFBTUUsV0FBVyxHQUFHSixPQUFPLENBQ3RCZixHQURlLENBQ1ZvQixLQUFELElBQVc7QUFDWixZQUFNQyxTQUFTLEdBQUlELEtBQUssQ0FBQ0MsU0FBTixJQUFtQkQsS0FBSyxDQUFDQyxTQUFOLENBQWdCQyxXQUFoQixPQUFrQyxNQUF0RCxHQUNaLE9BRFksR0FFWixFQUZOO0FBR0EsYUFBUSxPQUFNRixLQUFLLENBQUNHLElBQU4sQ0FBV0MsT0FBWCxDQUFtQixVQUFuQixFQUErQixNQUEvQixDQUF1QyxHQUFFSCxTQUFVLEVBQWpFO0FBQ0gsS0FOZSxFQU9mbkIsSUFQZSxDQU9WLElBUFUsQ0FBcEI7QUFTQSxVQUFNdUIsV0FBVyxHQUFHTixXQUFXLEtBQUssRUFBaEIsR0FBc0IsUUFBT0EsV0FBWSxFQUF6QyxHQUE2QyxFQUFqRTtBQUNBLFVBQU1PLFNBQVMsR0FBR2xDLElBQUksQ0FBQ21DLEdBQUwsQ0FBU1gsS0FBVCxFQUFnQixFQUFoQixDQUFsQjtBQUNBLFVBQU1ZLFlBQVksR0FBSSxTQUFRRixTQUFVLEVBQXhDO0FBRUEsVUFBTUcsSUFBSSxHQUFJO3lCQUNHLEtBQUt4RixJQUFLO2NBQ3JCdUUsYUFBYztjQUNkYSxXQUFZO2NBQ1pHLFlBQWE7dUJBSm5CO0FBT0EsV0FBTztBQUNINUMsTUFBQUEsTUFERztBQUVINkIsTUFBQUEsU0FGRztBQUdIRSxNQUFBQSxPQUhHO0FBSUhDLE1BQUFBLEtBSkc7QUFLSEMsTUFBQUEsT0FMRztBQU1IYSxNQUFBQSxXQUFXLEVBQUV2RyxJQUFJLENBQUN1RyxXQUFMLElBQW9CLElBTjlCO0FBT0hELE1BQUFBLElBUEc7QUFRSGxDLE1BQUFBLE1BQU0sRUFBRUEsTUFBTSxDQUFDb0MsTUFSWjtBQVNIakQsTUFBQUE7QUFURyxLQUFQO0FBV0g7O0FBRURrRCxFQUFBQSxzQkFBc0IsQ0FDbEJ6RyxJQURrQixFQUVsQnVELFlBRmtCLEVBTXBCO0FBQ0UsVUFBTUUsTUFBTSxHQUFHekQsSUFBSSxDQUFDeUQsTUFBTCxJQUFlLEVBQTlCO0FBQ0EsVUFBTVcsTUFBTSxHQUFHLElBQUlnQixnQkFBSixFQUFmO0FBQ0EsVUFBTWIsU0FBUyxHQUFHLEtBQUtLLGdCQUFMLENBQXNCbkIsTUFBdEIsRUFBOEJXLE1BQTlCLEVBQXNDYixZQUF0QyxDQUFsQjs7QUFDQSxRQUFJZ0IsU0FBUyxLQUFLLElBQWxCLEVBQXdCO0FBQ3BCLGFBQU8sSUFBUDtBQUNIOztBQUNELFVBQU1jLGFBQWEsR0FBR2QsU0FBUyxHQUFJLFVBQVNBLFNBQVUsRUFBdkIsR0FBMkIsRUFBMUQ7QUFDQSxVQUFNK0IsSUFBSSxHQUFJO3lCQUNHLEtBQUt4RixJQUFLO2NBQ3JCdUUsYUFBYzt1QkFGcEI7QUFJQSxXQUFPO0FBQ0hpQixNQUFBQSxJQURHO0FBRUhsQyxNQUFBQSxNQUFNLEVBQUVBLE1BQU0sQ0FBQ29DO0FBRlosS0FBUDtBQUlIOztBQUVERSxFQUFBQSxXQUFXLENBQ1BKLElBRE8sRUFFUDdDLE1BRk8sRUFHUCtCLE9BSE8sRUFJQTtBQUNQLFVBQU1tQixZQUFZLEdBQUcsS0FBSzlELFVBQUwsQ0FBZ0IrRCxHQUFoQixDQUFvQk4sSUFBcEIsQ0FBckI7O0FBQ0EsUUFBSUssWUFBWSxLQUFLRSxTQUFyQixFQUFnQztBQUM1QixhQUFPRixZQUFZLENBQUNHLE1BQXBCO0FBQ0g7O0FBQ0QsVUFBTUMsY0FBYyxHQUFHQyxzQkFBY0MsV0FBZCxDQUEwQixLQUFLbkcsSUFBL0IsQ0FBdkI7QUFDQSxVQUFNb0csSUFBSSxHQUFHO0FBQ1RKLE1BQUFBLE1BQU0sRUFBRSwrQkFBWUMsY0FBWixFQUE0QixLQUFLaEcsT0FBakMsRUFBMEMwQyxNQUExQyxFQUFrRCtCLE9BQU8sSUFBSSxFQUE3RCxFQUFpRTJCLE9BQWpFO0FBREMsS0FBYjtBQUdBLFNBQUt0RSxVQUFMLENBQWdCdUUsR0FBaEIsQ0FBb0JkLElBQXBCLEVBQTBCWSxJQUExQjtBQUNBLFdBQU9BLElBQUksQ0FBQ0osTUFBWjtBQUNIOztBQUVETyxFQUFBQSxhQUFhLEdBQUc7QUFDWixXQUFPLE9BQ0hDLE1BREcsRUFFSHRILElBRkcsRUFHSEgsT0FIRyxFQUlIeUQsSUFKRyxLQUtGLGlCQUFLLEtBQUtqQyxHQUFWLEVBQWUsT0FBZixFQUF3QnJCLElBQXhCLEVBQThCLFlBQVk7QUFDM0MsV0FBSzhCLFNBQUwsQ0FBZW1CLFNBQWY7QUFDQSxXQUFLZCxlQUFMLENBQXFCYyxTQUFyQjtBQUNBLFlBQU1zRSxLQUFLLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxFQUFkOztBQUNBLFVBQUk7QUFDQSxjQUFNbEUsWUFBWSxHQUFHLE1BQU14RCxvQkFBb0IsQ0FBQ0YsT0FBRCxFQUFVRyxJQUFWLENBQS9DO0FBQ0EsY0FBTTBILENBQUMsR0FBRyxLQUFLeEMsbUJBQUwsQ0FBeUJsRixJQUF6QixFQUErQnNELElBQUksQ0FBQ0ksU0FBTCxDQUFlQyxZQUE5QyxFQUE0REosWUFBNUQsQ0FBVjs7QUFDQSxZQUFJLENBQUNtRSxDQUFMLEVBQVE7QUFDSixlQUFLckcsR0FBTCxDQUFTc0csS0FBVCxDQUFlLE9BQWYsRUFBd0IzSCxJQUF4QixFQUE4QixDQUE5QixFQUFpQyxTQUFqQyxFQUE0Q0gsT0FBTyxDQUFDK0gsYUFBcEQ7QUFDQSxpQkFBTyxFQUFQO0FBQ0g7O0FBQ0QsY0FBTWQsTUFBTSxHQUFHLEtBQUtKLFdBQUwsQ0FBaUJnQixDQUFDLENBQUNwQixJQUFuQixFQUF5Qm9CLENBQUMsQ0FBQ2pFLE1BQTNCLEVBQW1DaUUsQ0FBQyxDQUFDbEMsT0FBckMsQ0FBZjtBQUNBLGNBQU1xQyxXQUFnQixHQUFHO0FBQ3JCcEUsVUFBQUEsTUFBTSxFQUFFaUUsQ0FBQyxDQUFDakUsTUFEVztBQUVyQjZCLFVBQUFBLFNBQVMsRUFBRSxnQ0FBa0JvQyxDQUFDLENBQUNwQyxTQUFwQjtBQUZVLFNBQXpCOztBQUlBLFlBQUlvQyxDQUFDLENBQUNsQyxPQUFGLENBQVVsQixNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3RCdUQsVUFBQUEsV0FBVyxDQUFDckMsT0FBWixHQUFzQmtDLENBQUMsQ0FBQ2xDLE9BQXhCO0FBQ0g7O0FBQ0QsWUFBSWtDLENBQUMsQ0FBQ2pDLEtBQUYsS0FBWSxFQUFoQixFQUFvQjtBQUNoQm9DLFVBQUFBLFdBQVcsQ0FBQ3BDLEtBQVosR0FBb0JpQyxDQUFDLENBQUNqQyxLQUF0QjtBQUNIOztBQUNELFlBQUlpQyxDQUFDLENBQUNoQyxPQUFGLEdBQVksQ0FBaEIsRUFBbUI7QUFDZm1DLFVBQUFBLFdBQVcsQ0FBQ25DLE9BQVosR0FBc0JnQyxDQUFDLENBQUNoQyxPQUF4QjtBQUNIOztBQUNELGNBQU02QixLQUFLLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxFQUFkO0FBQ0EsY0FBTUssTUFBTSxHQUFHSixDQUFDLENBQUNoQyxPQUFGLEdBQVksQ0FBWixHQUNULE1BQU0sS0FBS3FDLFlBQUwsQ0FBa0JMLENBQWxCLEVBQXFCWixNQUFyQixFQUE2QmUsV0FBN0IsRUFBMENoSSxPQUFPLENBQUNtSSxVQUFsRCxDQURHLEdBRVQsTUFBTSxLQUFLakcsS0FBTCxDQUFXMkYsQ0FBQyxDQUFDcEIsSUFBYixFQUFtQm9CLENBQUMsQ0FBQ3RELE1BQXJCLEVBQTZCMEMsTUFBN0IsRUFBcUNlLFdBQXJDLEVBQWtEaEksT0FBTyxDQUFDbUksVUFBMUQsQ0FGWjtBQUdBLGFBQUszRyxHQUFMLENBQVNzRyxLQUFULENBQ0ksT0FESixFQUVJM0gsSUFGSixFQUdJLENBQUN3SCxJQUFJLENBQUNDLEdBQUwsS0FBYUYsS0FBZCxJQUF1QixJQUgzQixFQUlJVCxNQUFNLEdBQUcsTUFBSCxHQUFZLE1BSnRCLEVBSThCakgsT0FBTyxDQUFDK0gsYUFKdEM7QUFNQSxlQUFPRSxNQUFQO0FBQ0gsT0FoQ0QsU0FnQ1U7QUFDTixhQUFLOUYsYUFBTCxDQUFtQmlHLE1BQW5CLENBQTBCVCxJQUFJLENBQUNDLEdBQUwsS0FBYUYsS0FBdkM7QUFDQSxhQUFLcEYsZUFBTCxDQUFxQitGLFNBQXJCO0FBQ0g7QUFDSixLQXhDSSxDQUxMO0FBOENIOztBQUVELFFBQU1uRyxLQUFOLENBQ0l1RSxJQURKLEVBRUlsQyxNQUZKLEVBR0kwQyxNQUhKLEVBSUllLFdBSkosRUFLSUcsVUFMSixFQU1nQjtBQUNaLFdBQU9HLGdCQUFRQyxLQUFSLENBQWMsS0FBS25ILE1BQW5CLEVBQTRCLEdBQUUsS0FBS0gsSUFBSyxRQUF4QyxFQUFpRCxNQUFPdUgsSUFBUCxJQUFzQjtBQUMxRSxVQUFJUixXQUFKLEVBQWlCO0FBQ2JRLFFBQUFBLElBQUksQ0FBQ0MsTUFBTCxDQUFZLFFBQVosRUFBc0JULFdBQXRCO0FBQ0g7O0FBQ0QsYUFBTyxLQUFLVSxhQUFMLENBQW1CakMsSUFBbkIsRUFBeUJsQyxNQUF6QixFQUFpQzBDLE1BQWpDLENBQVA7QUFDSCxLQUxNLEVBS0prQixVQUxJLENBQVA7QUFNSDs7QUFFRCxRQUFNTyxhQUFOLENBQW9CakMsSUFBcEIsRUFBa0NsQyxNQUFsQyxFQUE2RDBDLE1BQTdELEVBQTRGO0FBQ3hGLFVBQU0zRixFQUFFLEdBQUcyRixNQUFNLEdBQUcsS0FBSzNGLEVBQVIsR0FBYSxLQUFLQyxNQUFuQztBQUNBLFVBQU1vSCxNQUFNLEdBQUcsTUFBTXJILEVBQUUsQ0FBQ1ksS0FBSCxDQUFTdUUsSUFBVCxFQUFlbEMsTUFBZixDQUFyQjtBQUNBLFdBQU9vRSxNQUFNLENBQUNDLEdBQVAsRUFBUDtBQUNIOztBQUdELFFBQU1WLFlBQU4sQ0FDSUwsQ0FESixFQUVJWixNQUZKLEVBR0llLFdBSEosRUFJSUcsVUFKSixFQUtnQjtBQUNaLFdBQU9HLGdCQUFRQyxLQUFSLENBQWMsS0FBS25ILE1BQW5CLEVBQTRCLEdBQUUsS0FBS0gsSUFBSyxVQUF4QyxFQUFtRCxNQUFPdUgsSUFBUCxJQUFzQjtBQUM1RSxVQUFJUixXQUFKLEVBQWlCO0FBQ2JRLFFBQUFBLElBQUksQ0FBQ0MsTUFBTCxDQUFZLFFBQVosRUFBc0JULFdBQXRCO0FBQ0g7O0FBQ0QsVUFBSXRGLE9BQThCLEdBQUcsSUFBckM7QUFDQSxVQUFJbUcsWUFBd0IsR0FBRyxJQUEvQjtBQUNBLFVBQUlDLFVBQW1CLEdBQUcsSUFBMUI7O0FBQ0EsVUFBSTtBQUNBLGNBQU1DLE9BQU8sR0FBRyxJQUFJQyxPQUFKLENBQVksQ0FBQ0MsT0FBRCxFQUFVQyxNQUFWLEtBQXFCO0FBQzdDLGdCQUFNQyxLQUFLLEdBQUcsTUFBTTtBQUNoQixpQkFBS1QsYUFBTCxDQUFtQmIsQ0FBQyxDQUFDcEIsSUFBckIsRUFBMkJvQixDQUFDLENBQUN0RCxNQUE3QixFQUFxQzBDLE1BQXJDLEVBQTZDbUMsSUFBN0MsQ0FBbURDLElBQUQsSUFBVTtBQUN4RCxrQkFBSSxDQUFDUCxVQUFMLEVBQWlCO0FBQ2Isb0JBQUlPLElBQUksQ0FBQzVFLE1BQUwsR0FBYyxDQUFsQixFQUFxQjtBQUNqQm9FLGtCQUFBQSxZQUFZLEdBQUcsSUFBZjtBQUNBQyxrQkFBQUEsVUFBVSxHQUFHLE9BQWI7QUFDQUcsa0JBQUFBLE9BQU8sQ0FBQ0ksSUFBRCxDQUFQO0FBQ0gsaUJBSkQsTUFJTztBQUNIUixrQkFBQUEsWUFBWSxHQUFHUyxVQUFVLENBQUNILEtBQUQsRUFBUSxJQUFSLENBQXpCO0FBQ0g7QUFDSjtBQUNKLGFBVkQsRUFVR0QsTUFWSDtBQVdILFdBWkQ7O0FBYUFDLFVBQUFBLEtBQUs7QUFDUixTQWZlLENBQWhCO0FBZ0JBLGNBQU1JLGFBQWEsR0FBRyxJQUFJUCxPQUFKLENBQWFDLE9BQUQsSUFBYTtBQUMzQyxnQkFBTU8sVUFBVSxHQUFHQyxrQ0FBaUJDLGFBQWpCLENBQStCLEtBQUt6SSxJQUFwQyxFQUEwQzRHLENBQUMsQ0FBQ25FLFlBQTVDLENBQW5COztBQUNBaEIsVUFBQUEsT0FBTyxHQUFJWCxHQUFELElBQVM7QUFDZixnQkFBSXlILFVBQVUsSUFBSSxDQUFDQSxVQUFVLENBQUN6SCxHQUFELENBQTdCLEVBQW9DO0FBQ2hDO0FBQ0g7O0FBQ0QsZ0JBQUksS0FBS2IsT0FBTCxDQUFheUksSUFBYixDQUFrQixJQUFsQixFQUF3QjVILEdBQXhCLEVBQTZCOEYsQ0FBQyxDQUFDakUsTUFBL0IsQ0FBSixFQUE0QztBQUN4QyxrQkFBSSxDQUFDa0YsVUFBTCxFQUFpQjtBQUNiQSxnQkFBQUEsVUFBVSxHQUFHLFVBQWI7QUFDQUcsZ0JBQUFBLE9BQU8sQ0FBQyxDQUFDbEgsR0FBRCxDQUFELENBQVA7QUFDSDtBQUNKO0FBQ0osV0FWRDs7QUFXQSxlQUFLTCxZQUFMLElBQXFCLENBQXJCO0FBQ0EsZUFBS21CLGlCQUFMLENBQXVCb0IsRUFBdkIsQ0FBMEIsS0FBMUIsRUFBaUN2QixPQUFqQztBQUNBLGVBQUtELGlCQUFMLENBQXVCVyxTQUF2QjtBQUNILFNBaEJxQixDQUF0QjtBQWlCQSxjQUFNd0csU0FBUyxHQUFHLElBQUlaLE9BQUosQ0FBYUMsT0FBRCxJQUFhO0FBQ3ZDSyxVQUFBQSxVQUFVLENBQUMsTUFBTTtBQUNiLGdCQUFJLENBQUNSLFVBQUwsRUFBaUI7QUFDYkEsY0FBQUEsVUFBVSxHQUFHLFNBQWI7QUFDQUcsY0FBQUEsT0FBTyxDQUFDLEVBQUQsQ0FBUDtBQUNIO0FBQ0osV0FMUyxFQUtQcEIsQ0FBQyxDQUFDaEMsT0FMSyxDQUFWO0FBTUgsU0FQaUIsQ0FBbEI7QUFRQSxjQUFNb0MsTUFBTSxHQUFHLE1BQU1lLE9BQU8sQ0FBQ2EsSUFBUixDQUFhLENBQzlCZCxPQUQ4QixFQUU5QlEsYUFGOEIsRUFHOUJLLFNBSDhCLENBQWIsQ0FBckI7QUFLQXBCLFFBQUFBLElBQUksQ0FBQ0MsTUFBTCxDQUFZLFVBQVosRUFBd0JLLFVBQXhCO0FBQ0EsZUFBT2IsTUFBUDtBQUNILE9BakRELFNBaURVO0FBQ04sWUFBSXZGLE9BQU8sS0FBSyxJQUFaLElBQW9CQSxPQUFPLEtBQUtzRSxTQUFwQyxFQUErQztBQUMzQyxlQUFLdEYsWUFBTCxHQUFvQjBDLElBQUksQ0FBQ0MsR0FBTCxDQUFTLENBQVQsRUFBWSxLQUFLM0MsWUFBTCxHQUFvQixDQUFoQyxDQUFwQjtBQUNBLGVBQUttQixpQkFBTCxDQUF1QnNCLGNBQXZCLENBQXNDLEtBQXRDLEVBQTZDekIsT0FBN0M7QUFDQUEsVUFBQUEsT0FBTyxHQUFHLElBQVY7QUFDQSxlQUFLRCxpQkFBTCxDQUF1QjRGLFNBQXZCO0FBQ0g7O0FBQ0QsWUFBSVEsWUFBWSxLQUFLLElBQXJCLEVBQTJCO0FBQ3ZCaUIsVUFBQUEsWUFBWSxDQUFDakIsWUFBRCxDQUFaO0FBQ0FBLFVBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0g7QUFDSjtBQUNKLEtBcEVNLEVBb0VKVixVQXBFSSxDQUFQO0FBcUVILEdBclhtQixDQXVYcEI7OztBQUVBNEIsRUFBQUEsbUJBQW1CLEdBQUc7QUFDbEIsV0FBTyxPQUNIdEMsTUFERyxFQUVIdEgsSUFGRyxFQUdISCxPQUhHLEtBSUYsaUJBQUssS0FBS3dCLEdBQVYsRUFBZSxXQUFmLEVBQTRCckIsSUFBNUIsRUFBa0MsWUFBWTtBQUMvQyxXQUFLOEIsU0FBTCxDQUFlbUIsU0FBZjtBQUNBLFdBQUtkLGVBQUwsQ0FBcUJjLFNBQXJCO0FBQ0EsWUFBTXNFLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxHQUFMLEVBQWQ7O0FBQ0EsVUFBSTtBQUNBLGNBQU1sRSxZQUFZLEdBQUcsTUFBTXhELG9CQUFvQixDQUFDRixPQUFELEVBQVVHLElBQVYsQ0FBL0M7QUFDQSxjQUFNMEgsQ0FBQyxHQUFHLEtBQUtqQixzQkFBTCxDQUE0QnpHLElBQTVCLEVBQWtDdUQsWUFBbEMsQ0FBVjs7QUFDQSxZQUFJLENBQUNtRSxDQUFMLEVBQVE7QUFDSixlQUFLckcsR0FBTCxDQUFTc0csS0FBVCxDQUFlLFdBQWYsRUFBNEIzSCxJQUE1QixFQUFrQyxDQUFsQyxFQUFxQyxTQUFyQyxFQUFnREgsT0FBTyxDQUFDK0gsYUFBeEQ7QUFDQSxpQkFBTyxFQUFQO0FBQ0g7O0FBQ0QsY0FBTWQsTUFBTSxHQUFHLE1BQU0sS0FBS0osV0FBTCxDQUFpQmdCLENBQUMsQ0FBQ3BCLElBQW5CLEVBQXlCdEcsSUFBSSxDQUFDeUQsTUFBOUIsQ0FBckI7QUFDQSxjQUFNOEQsS0FBSyxHQUFHQyxJQUFJLENBQUNDLEdBQUwsRUFBZDtBQUNBLGNBQU1LLE1BQU0sR0FBRyxNQUFNLEtBQUsvRixLQUFMLENBQVcyRixDQUFDLENBQUNwQixJQUFiLEVBQW1Cb0IsQ0FBQyxDQUFDdEQsTUFBckIsRUFBNkIwQyxNQUE3QixFQUFxQztBQUN0RHJELFVBQUFBLE1BQU0sRUFBRXpELElBQUksQ0FBQ3lELE1BRHlDO0FBRXREb0csVUFBQUEsU0FBUyxFQUFFN0osSUFBSSxDQUFDOEo7QUFGc0MsU0FBckMsRUFHbEJqSyxPQUFPLENBQUNtSSxVQUhVLENBQXJCO0FBSUEsYUFBSzNHLEdBQUwsQ0FBU3NHLEtBQVQsQ0FDSSxXQURKLEVBRUkzSCxJQUZKLEVBR0ksQ0FBQ3dILElBQUksQ0FBQ0MsR0FBTCxLQUFhRixLQUFkLElBQXVCLElBSDNCLEVBSUlULE1BQU0sR0FBRyxNQUFILEdBQVksTUFKdEIsRUFJOEJqSCxPQUFPLENBQUMrSCxhQUp0QztBQU1BLGVBQU9FLE1BQVA7QUFDSCxPQXBCRCxTQW9CVTtBQUNOLGFBQUs5RixhQUFMLENBQW1CaUcsTUFBbkIsQ0FBMEJULElBQUksQ0FBQ0MsR0FBTCxLQUFhRixLQUF2QztBQUNBLGFBQUtwRixlQUFMLENBQXFCK0YsU0FBckI7QUFDSDtBQUNKLEtBNUJJLENBSkw7QUFpQ0gsR0EzWm1CLENBNlpwQjs7O0FBRUE2QixFQUFBQSxZQUFZLEdBQXVCO0FBQy9CLFdBQU8sS0FBSzVJLEVBQUwsQ0FBUTZJLFVBQVIsQ0FBbUIsS0FBS2xKLElBQXhCLENBQVA7QUFDSDs7QUFFRCxRQUFNbUosVUFBTixDQUNJQyxVQURKLEVBRUlDLFNBRkosRUFHZ0I7QUFDWixRQUFJLENBQUNELFVBQUwsRUFBaUI7QUFDYixhQUFPckIsT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLENBQVA7QUFDSDs7QUFDRCxVQUFNc0IsV0FBVyxHQUFHRCxTQUFTLENBQUNFLFFBQVYsQ0FBbUIsS0FBbkIsSUFDZDtBQUNFNUcsTUFBQUEsTUFBTSxFQUFFO0FBQUUsU0FBQzBHLFNBQVMsQ0FBQ0csS0FBVixDQUFnQixDQUFoQixFQUFtQixDQUFDLENBQXBCLENBQUQsR0FBMEI7QUFBRUMsVUFBQUEsR0FBRyxFQUFFO0FBQUVDLFlBQUFBLEVBQUUsRUFBRU47QUFBTjtBQUFQO0FBQTVCLE9BRFY7QUFFRTVELE1BQUFBLElBQUksRUFBRyxjQUFhLEtBQUt4RixJQUFLLHFCQUFvQnFKLFNBQVUsYUFGOUQ7QUFHRS9GLE1BQUFBLE1BQU0sRUFBRTtBQUFFcUcsUUFBQUEsQ0FBQyxFQUFFUDtBQUFMO0FBSFYsS0FEYyxHQU1kO0FBQ0V6RyxNQUFBQSxNQUFNLEVBQUU7QUFBRWlILFFBQUFBLEVBQUUsRUFBRTtBQUFFRixVQUFBQSxFQUFFLEVBQUVOO0FBQU47QUFBTixPQURWO0FBRUU1RCxNQUFBQSxJQUFJLEVBQUcsY0FBYSxLQUFLeEYsSUFBSyxlQUFjcUosU0FBVSxtQkFGeEQ7QUFHRS9GLE1BQUFBLE1BQU0sRUFBRTtBQUFFcUcsUUFBQUEsQ0FBQyxFQUFFUDtBQUFMO0FBSFYsS0FOTjtBQVlBLFVBQU1oQixJQUFJLEdBQUcsTUFBTSxLQUFLbkIsWUFBTCxDQUFrQjtBQUNqQ3RFLE1BQUFBLE1BQU0sRUFBRTJHLFdBQVcsQ0FBQzNHLE1BRGE7QUFFakM2QixNQUFBQSxTQUFTLEVBQUUsRUFGc0I7QUFHakNFLE1BQUFBLE9BQU8sRUFBRSxFQUh3QjtBQUlqQ0MsTUFBQUEsS0FBSyxFQUFFLENBSjBCO0FBS2pDQyxNQUFBQSxPQUFPLEVBQUUsS0FMd0I7QUFNakNhLE1BQUFBLFdBQVcsRUFBRSxJQU5vQjtBQU9qQ0QsTUFBQUEsSUFBSSxFQUFFOEQsV0FBVyxDQUFDOUQsSUFQZTtBQVFqQ2xDLE1BQUFBLE1BQU0sRUFBRWdHLFdBQVcsQ0FBQ2hHLE1BUmE7QUFTakNiLE1BQUFBLFlBQVksRUFBRTlDO0FBVG1CLEtBQWxCLEVBVWhCLElBVmdCLEVBVVYsSUFWVSxFQVVKLElBVkksQ0FBbkI7QUFXQSxXQUFPeUksSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU15QixXQUFOLENBQWtCQyxXQUFsQixFQUF5Q1QsU0FBekMsRUFBNEU7QUFDeEUsUUFBSSxDQUFDUyxXQUFELElBQWdCQSxXQUFXLENBQUN0RyxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU91RSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9ELE9BQU8sQ0FBQ0osR0FBUixDQUFZbUMsV0FBVyxDQUFDbkcsR0FBWixDQUFnQm9HLEtBQUssSUFBSSxLQUFLWixVQUFMLENBQWdCWSxLQUFoQixFQUF1QlYsU0FBdkIsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURXLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUMxRyxNQUFmO0FBQ0g7O0FBcmRtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHR5cGUgeyBUT05DbGllbnQgfSBmcm9tIFwidG9uLWNsaWVudC1qcy90eXBlc1wiO1xuaW1wb3J0IHsgRG9jVXBzZXJ0SGFuZGxlciwgRG9jU3Vic2NyaXB0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWxpc3RlbmVyc1wiO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQkxPQ0tDSEFJTl9EQiwgU1RBVFMgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgeyBwYXJzZVNlbGVjdGlvblNldCwgUVBhcmFtcywgc2VsZWN0aW9uVG9TdHJpbmcgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCBjb25zdCBBZ2dyZWdhdGlvbkZuID0ge1xuICAgIENPVU5UOiAnQ09VTlQnLFxuICAgIE1JTjogJ01JTicsXG4gICAgTUFYOiAnTUFYJyxcbiAgICBTVU06ICdTVU0nLFxuICAgIEFWRVJBR0U6ICdBVkVSQUdFJyxcbiAgICBTVERERVZfUE9QVUxBVElPTjogJ1NURERFVl9QT1BVTEFUSU9OJyxcbiAgICBTVERERVZfU0FNUExFOiAnU1REREVWX1NBTVBMRScsXG4gICAgVkFSSUFOQ0VfUE9QVUxBVElPTjogJ1ZBUklBTkNFX1BPUFVMQVRJT04nLFxuICAgIFZBUklBTkNFX1NBTVBMRTogJ1ZBUklBTkNFX1NBTVBMRScsXG59XG5cbnR5cGUgQWdncmVnYXRpb25GblR5cGUgPSAkS2V5czx0eXBlb2YgQWdncmVnYXRpb25Gbj47XG5cbmV4cG9ydCB0eXBlIEZpZWxkQWdncmVnYXRpb24gPSB7XG4gICAgZmllbGQ6IHN0cmluZyxcbiAgICBmbjogQWdncmVnYXRpb25GblR5cGUsXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihcbiAgICAgICAgICAgIDQwMCxcbiAgICAgICAgICAgICdSZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGFjY2VzcyBrZXkgZm9yIGFsbCBxdWVyaWVzIGFuZCBtdXRhdGlvbnMnLFxuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcbiAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gMDtcblxuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZENvbmRpdGlvblFMKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRDb25kaXRpb25RTChmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG5cbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W11cbiAgICApOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldCh0ZXh0KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uSW5mbyA9IEJMT0NLQ0hBSU5fREIuY29sbGVjdGlvbnNbdGhpcy5uYW1lXTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkoY29sbGVjdGlvbkluZm8sIHRoaXMuZG9jVHlwZSwgZmlsdGVyLCBvcmRlckJ5IHx8IFtdLCBjb25zb2xlKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldCh0ZXh0LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNGYXN0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURhdGFiYXNlKHRleHQsIHBhcmFtcywgaXNGYXN0KTtcbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlEYXRhYmFzZSh0ZXh0OiBzdHJpbmcsIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sIGlzRmFzdDogYm9vbGVhbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGRiID0gaXNGYXN0ID8gdGhpcy5kYiA6IHRoaXMuc2xvd0RiO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeSh0ZXh0LCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlEYXRhYmFzZShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QpLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAncXVlcnknO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhGaWx0ZXIgPSBEb2NVcHNlcnRIYW5kbGVyLmdldEF1dGhGaWx0ZXIodGhpcy5uYW1lLCBxLmFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0aEZpbHRlciAmJiAhYXV0aEZpbHRlcihkb2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgcS5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAnbGlzdGVuZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGFyZ3MsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIGFyZ3MuZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSW50ZXJuYWxzXG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDQwMDAwLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgIH0sIHRydWUsIG51bGwsIG51bGwpO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhmaWVsZFZhbHVlczogc3RyaW5nW10sIGZpZWxkUGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==