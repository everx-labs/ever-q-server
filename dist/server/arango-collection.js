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

var _resolversGenerated = require("./resolvers-generated");

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

    const filterSection = condition ? `FILTER ${condition}` : '';
    const col = [];
    const ret = [];

    function aggregateCount(i) {
      col.push(`v${i} = COUNT(doc)`);
      ret.push(`v${i}`);
    }

    function aggregateNumber(i, f, fn) {
      col.push(`v${i} = ${fn}(${f.path})`);
      ret.push(`v${i}`);
    }

    function aggregateBigNumber(i, f, fn) {
      col.push(`v${i} = ${fn}(${f.path})`);
      ret.push(`{ ${f.type}: v${i} }`);
    }

    function aggregateBigNumberParts(i, f, fn) {
      const len = f.type === 'uint64' ? 1 : 2;
      const hHex = `SUBSTRING(${f.path}, ${len}, LENGTH(${f.path}) - ${len} - 8)`;
      const lHex = `RIGHT(SUBSTRING(${f.path}, ${len}), 8)`;
      col.push(`h${i} = ${fn}(TO_NUMBER(CONCAT("0x", ${hHex})))`);
      col.push(`l${i} = ${fn}(TO_NUMBER(CONCAT("0x", ${lHex})))`);
      ret.push(`{ ${f.type}: { h: h${i}, l: l${i} } }`);
    }

    function aggregateNonNumber(i, f, fn) {
      col.push(`v${i} = ${fn}(${f.path})`);
      ret.push(`v${i}`);
    }

    args.fields.forEach((f, i) => {
      const fn = f.fn || AggregationFn.COUNT;

      if (fn === AggregationFn.COUNT) {
        aggregateCount(i);
      } else {
        const scalar = _resolversGenerated.scalarFields.get(`${this.name}.${f.field || 'id'}`);

        const invalidType = () => new Error(`[${f.field}] can't be used with [${fn}]`);

        if (!scalar) {
          throw invalidType();
        }

        switch (scalar.type) {
          case 'number':
            aggregateNumber(i, f, fn);
            break;

          case 'uint64':
          case 'uint1024':
            if (fn === AggregationFn.MIN || fn === AggregationFn.MAX) {
              aggregateBigNumber(i, f, fn);
            } else {
              aggregateBigNumberParts(i, f, fn);
            }

            break;

          default:
            if (fn === AggregationFn.MIN || fn === AggregationFn.MAX) {
              aggregateNonNumber(i, f, fn);
            } else {
              throw invalidType();
            }

            break;
        }
      }
    });
    const text = `
            FOR doc IN ${this.name}
            ${filterSection}
            COLLECT AGGREGATE ${col.join(', ')}
            RETURN [${ret.join(', ')}]`;
    return {
      text,
      params: params.values
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
        return result[0].map(x => {
          return JSON.stringify(x);
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0IiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0IiwiY29uc29sZSIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiY29sIiwicmV0IiwiYWdncmVnYXRlQ291bnQiLCJpIiwicHVzaCIsImFnZ3JlZ2F0ZU51bWJlciIsImYiLCJmbiIsImFnZ3JlZ2F0ZUJpZ051bWJlciIsInR5cGUiLCJhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyIsImxlbiIsImhIZXgiLCJsSGV4IiwiYWdncmVnYXRlTm9uTnVtYmVyIiwiZmllbGRzIiwiZm9yRWFjaCIsInNjYWxhciIsInNjYWxhckZpZWxkcyIsImludmFsaWRUeXBlIiwiRXJyb3IiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiYWdncmVnYXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwid2FpdEZvckRvY3MiLCJmaWVsZFZhbHVlcyIsInZhbHVlIiwiZmluaXNoT3BlcmF0aW9ucyIsIm9wZXJhdGlvbklkcyIsInRvQ2xvc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFDQTs7QUFFQTs7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LypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQgeyBEb2NVcHNlcnRIYW5kbGVyLCBEb2NTdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9hcmFuZ28tbGlzdGVuZXJzXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEF1dGggfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBCTE9DS0NIQUlOX0RCLCBTVEFUUyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBPcmRlckJ5LCBRVHlwZSwgUXVlcnlTdGF0LCBTY2FsYXJGaWVsZCB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgeyBwYXJzZVNlbGVjdGlvblNldCwgUVBhcmFtcywgc2VsZWN0aW9uVG9TdHJpbmcgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgc2NhbGFyRmllbGRzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUT05DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgY29uc3QgQWdncmVnYXRpb25GbiA9IHtcbiAgICBDT1VOVDogJ0NPVU5UJyxcbiAgICBNSU46ICdNSU4nLFxuICAgIE1BWDogJ01BWCcsXG4gICAgU1VNOiAnU1VNJyxcbiAgICBBVkVSQUdFOiAnQVZFUkFHRScsXG4gICAgU1REREVWX1BPUFVMQVRJT046ICdTVERERVZfUE9QVUxBVElPTicsXG4gICAgU1REREVWX1NBTVBMRTogJ1NURERFVl9TQU1QTEUnLFxuICAgIFZBUklBTkNFX1BPUFVMQVRJT046ICdWQVJJQU5DRV9QT1BVTEFUSU9OJyxcbiAgICBWQVJJQU5DRV9TQU1QTEU6ICdWQVJJQU5DRV9TQU1QTEUnLFxufVxuXG50eXBlIEFnZ3JlZ2F0aW9uRm5UeXBlID0gJEtleXM8dHlwZW9mIEFnZ3JlZ2F0aW9uRm4+O1xuXG5leHBvcnQgdHlwZSBGaWVsZEFnZ3JlZ2F0aW9uID0ge1xuICAgIGZpZWxkOiBzdHJpbmcsXG4gICAgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlLFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICA0MDAsXG4gICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGF1dGg6IEF1dGgsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBzdGF0czogSVN0YXRzLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgRG9jU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRDb25kaXRpb25RTChcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXVxuICAgICk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHRleHQpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25JbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeShjb2xsZWN0aW9uSW5mbywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHRleHQsIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UodGV4dCwgcGFyYW1zLCBpc0Zhc3QpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHRleHQ6IHN0cmluZywgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSwgaXNGYXN0OiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBpc0Zhc3QgPyB0aGlzLmRiIDogdGhpcy5zbG93RGI7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHRleHQsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IERvY1Vwc2VydEhhbmRsZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIH0ge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZENvbmRpdGlvblFMKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IGNvbDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgcmV0OiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUNvdW50KGk6IG51bWJlcikge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gQ09VTlQoZG9jKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHYke2l9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVOdW1iZXIoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSAke2ZufSgke2YucGF0aH0pYCk7XG4gICAgICAgICAgICByZXQucHVzaChgdiR7aX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUJpZ051bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB7ICR7Zi50eXBlfTogdiR7aX0gfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQmlnTnVtYmVyUGFydHMoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBmLnR5cGUgPT09ICd1aW50NjQnID8gMSA6IDI7XG4gICAgICAgICAgICBjb25zdCBoSGV4ID0gYFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSwgTEVOR1RIKCR7Zi5wYXRofSkgLSAke2xlbn0gLSA4KWA7XG4gICAgICAgICAgICBjb25zdCBsSGV4ID0gYFJJR0hUKFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSksIDgpYDtcbiAgICAgICAgICAgIGNvbC5wdXNoKGBoJHtpfSA9ICR7Zm59KFRPX05VTUJFUihDT05DQVQoXCIweFwiLCAke2hIZXh9KSkpYCk7XG4gICAgICAgICAgICBjb2wucHVzaChgbCR7aX0gPSAke2ZufShUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgJHtsSGV4fSkpKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHsgJHtmLnR5cGV9OiB7IGg6IGgke2l9LCBsOiBsJHtpfSB9IH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZU5vbk51bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB2JHtpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5maWVsZHMuZm9yRWFjaCgoZjogRmllbGRBZ2dyZWdhdGlvbiwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmbiA9IGYuZm4gfHwgQWdncmVnYXRpb25Gbi5DT1VOVDtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUNvdW50KGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzY2FsYXI6ICh0eXBlb2YgdW5kZWZpbmVkIHwgU2NhbGFyRmllbGQpID0gc2NhbGFyRmllbGRzLmdldChgJHt0aGlzLm5hbWV9LiR7Zi5maWVsZCB8fCAnaWQnfWApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGludmFsaWRUeXBlID0gKCkgPT4gbmV3IEVycm9yKGBbJHtmLmZpZWxkfV0gY2FuJ3QgYmUgdXNlZCB3aXRoIFske2ZufV1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIXNjYWxhcikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHNjYWxhci50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlTnVtYmVyKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAndWludDY0JzpcbiAgICAgICAgICAgICAgICBjYXNlICd1aW50MTAyNCc6XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVCaWdOdW1iZXIoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlQmlnTnVtYmVyUGFydHMoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVOb25OdW1iZXIoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgaW52YWxpZFR5cGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgIENPTExFQ1QgQUdHUkVHQVRFICR7Y29sLmpvaW4oJywgJyl9XG4gICAgICAgICAgICBSRVRVUk4gWyR7cmV0LmpvaW4oJywgJyl9XWA7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnQUdHUkVHQVRFJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlQWdncmVnYXRpb25RdWVyeShhcmdzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBhcmdzLmZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZTogYXJncy5maWVsZHMsXG4gICAgICAgICAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0WzBdLm1hcCgoeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSW50ZXJuYWxzXG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDQwMDAwLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgIH0sIHRydWUsIG51bGwsIG51bGwpO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhmaWVsZFZhbHVlczogc3RyaW5nW10sIGZpZWxkUGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==