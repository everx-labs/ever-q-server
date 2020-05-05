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
    this.info = _config.BLOCKCHAIN_DB.collections[name];
    this.infoRefreshTime = Date.now();
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
        const q = this.createDatabaseQuery(args, info.operation.selectionSet, accessRights);

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
    const condition = this.buildConditionQL(filter, params, accessRights);

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
    if (Date.now() >= this.infoRefreshTime) {
      this.infoRefreshTime = Date.now() + INFO_REFRESH_INTERVAL;
      const indexes = (await this.dbCollection().indexes()).map(x => ({
        fields: x.fields
      }));

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

      if (!sameIndexes(indexes, this.info.indexes)) {
        this.log.debug('RELOAD_INDEXES', indexes);
        this.info.indexes = indexes;
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJJTkZPX1JFRlJFU0hfSU5URVJWQUwiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIkNvbGxlY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJkb2NUeXBlIiwibG9ncyIsInRyYWNlciIsInN0YXRzIiwiZGIiLCJzbG93RGIiLCJpbmZvIiwiQkxPQ0tDSEFJTl9EQiIsImNvbGxlY3Rpb25zIiwiaW5mb1JlZnJlc2hUaW1lIiwiRGF0ZSIsIm5vdyIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uQWN0aXZlIiwic3Vic2NyaXB0aW9uIiwiZG9jSW5zZXJ0T3JVcGRhdGUiLCJFdmVudEVtaXR0ZXIiLCJzZXRNYXhMaXN0ZW5lcnMiLCJxdWVyeVN0YXRzIiwiTWFwIiwibWF4UXVldWVTaXplIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwiaW5jcmVtZW50IiwiZW1pdCIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwic3Vic2NyaWJlIiwiXyIsImFjY2Vzc1JpZ2h0cyIsIkRvY1N1YnNjcmlwdGlvbiIsImZpbHRlciIsIm9wZXJhdGlvbiIsInNlbGVjdGlvblNldCIsImV2ZW50TGlzdGVuZXIiLCJwdXNoRG9jdW1lbnQiLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImJ1aWxkQ29uZGl0aW9uUUwiLCJwcmltYXJ5Q29uZGl0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25zIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdFRleHQiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0Iiwic3RhdCIsImNvbnNvbGUiLCJzZXQiLCJxdWVyeVJlc29sdmVyIiwicGFyZW50Iiwic3RhcnQiLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwiZXJyb3IiLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJRVHJhY2VyIiwidHJhY2UiLCJzcGFuIiwic2V0VGFnIiwicXVlcnlEYXRhYmFzZSIsImN1cnNvciIsImFsbCIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJvblF1ZXJ5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiRG9jVXBzZXJ0SGFuZGxlciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJmaWVsZHMiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiYWdncmVnYXRlIiwiY29udmVydFJlc3VsdHMiLCJkYkNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uIiwiaW5kZXhlcyIsInNhbWVJbmRleGVzIiwiYUluZGV4ZXMiLCJiSW5kZXhlcyIsImFSZXN0IiwiU2V0IiwiaW5kZXhUb1N0cmluZyIsImJJbmRleCIsImJJbmRleFN0cmluZyIsImRlbGV0ZSIsInNpemUiLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFD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S1osVUFBTCxDQUFnQlksS0FBaEIsRUFBdUJWLFNBQXZCLEVBQWtDck0sSUFBbEMsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURnTixFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDbkksTUFBZjtBQUNIOztBQTNpQm1CIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB7IERvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2FyYW5nby1saXN0ZW5lcnNcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBDb2xsZWN0aW9uSW5mbywgSW5kZXhJbmZvLCBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHsgaW5kZXhUb1N0cmluZywgcGFyc2VTZWxlY3Rpb25TZXQsIFFQYXJhbXMsIHNlbGVjdGlvblRvU3RyaW5nIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgeyBpc0Zhc3RRdWVyeSB9IGZyb20gJy4vc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7IGNyZWF0ZUVycm9yLCB3cmFwIH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuY29uc3QgSU5GT19SRUZSRVNIX0lOVEVSVkFMID0gNjAgKiA2MCAqIDEwMDA7IC8vIDYwIG1pbnV0ZXNcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUT05DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzPzogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgIGFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gY2hlY2tVc2VkQWNjZXNzS2V5KFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbik6ID9zdHJpbmcge1xuICAgIGlmICghYWNjZXNzS2V5KSB7XG4gICAgICAgIHJldHVybiB1c2VkQWNjZXNzS2V5O1xuICAgIH1cbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcbiAgICAgICAgY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgIHRocm93IGNyZWF0ZUVycm9yKFxuICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgJ1JlcXVlc3QgbXVzdCB1c2UgdGhlIHNhbWUgYWNjZXNzIGtleSBmb3IgYWxsIHF1ZXJpZXMgYW5kIG11dGF0aW9ucycsXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG4gICAgaW5mbzogQ29sbGVjdGlvbkluZm87XG4gICAgaW5mb1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcbiAgICAgICAgdGhpcy5pbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1tuYW1lXTtcbiAgICAgICAgdGhpcy5pbmZvUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgIHRoaXMuc2xvd0RiID0gc2xvd0RiO1xuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUZhaWxlZCA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmZhaWxlZCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LnNsb3csIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IERvY1N1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ub25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsIHBhcmFtczogUVBhcmFtcykge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHM7XG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oJywnKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuX2tleSAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ21lc3NhZ2VzJzpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkQ29uZGl0aW9uUUwoXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZENvbmRpdGlvblFMKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcblxuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W11cbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgIGxldCBzdGF0S2V5ID0gdGV4dDtcbiAgICAgICAgaWYgKG9yZGVyQnkgJiYgb3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdGF0S2V5ID0gYCR7c3RhdEtleX0ke29yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSAke3guZGlyZWN0aW9ufWApLmpvaW4oJyAnKX1gO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQoc3RhdEtleSk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkodGhpcy5pbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQoc3RhdEtleSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UodGV4dCwgcGFyYW1zLCBpc0Zhc3QpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHRleHQ6IHN0cmluZywgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSwgaXNGYXN0OiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBpc0Zhc3QgPyB0aGlzLmRiIDogdGhpcy5zbG93RGI7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHRleHQsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IERvY1Vwc2VydEhhbmRsZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uIHx8ICcnLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHF1ZXJ5LmhlbHBlcnMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgZm9yIChjb25zdCBoOiBBZ2dyZWdhdGlvbkhlbHBlciBvZiBoZWxwZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xuICAgICAgICAgICAgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHRleHQsIGZpbHRlcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnZG9jLicpKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnN1YnN0cignZG9jLicubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBbeyBwYXRoLCBkaXJlY3Rpb246ICdBU0MnIH1dLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbeyBmaWVsZDogJycsIGZuOiBBZ2dyZWdhdGlvbkZuLkNPVU5UIH1dO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlQWdncmVnYXRpb25RdWVyeShmaWx0ZXIsIGZpZWxkcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0FHR1JFR0FURScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdEFnZ3JlZ2F0aW9uUXVlcnkocS50ZXh0LCBmaWx0ZXIsIHEuaGVscGVycyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZTogYXJncy5maWVsZHMsXG4gICAgICAgICAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNvbnZlcnRSZXN1bHRzKHJlc3VsdFswXSwgcS5oZWxwZXJzKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKERhdGUubm93KCkgPj0gdGhpcy5pbmZvUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKSArIElORk9fUkVGUkVTSF9JTlRFUlZBTDtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ZXMgPSAoYXdhaXQgdGhpcy5kYkNvbGxlY3Rpb24oKS5pbmRleGVzKCkpXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuXG4gICAgICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogSW5kZXhJbmZvW10sIGJJbmRleGVzOiBJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFSZXN0ID0gbmV3IFNldChhSW5kZXhlcy5tYXAoaW5kZXhUb1N0cmluZykpO1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFSZXN0LmhhcyhiSW5kZXhTdHJpbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYVJlc3Quc2l6ZSA9PT0gMDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGluZGV4ZXMsIHRoaXMuaW5mby5pbmRleGVzKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdSRUxPQURfSU5ERVhFUycsIGluZGV4ZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaW5mby5pbmRleGVzID0gaW5kZXhlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlEYXRhYmFzZShxdWVyeVBhcmFtcy50ZXh0LCBxdWVyeVBhcmFtcy5wYXJhbXMsIHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgfSwgdHJ1ZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKFxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICApOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoLCBhcmdzKSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuIl19