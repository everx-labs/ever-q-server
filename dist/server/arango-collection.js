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

    let text;
    const isSingleCount = args.fields.length === 1 && args.fields[0].fn === AggregationFn.COUNT;

    if (isSingleCount) {
      text = `
                FOR doc IN ${this.name}
                ${filterSection}
                COLLECT WITH COUNT INTO v0
                RETURN [v0]`;
    } else {
      args.fields.forEach((aggregation, i) => {
        const fn = aggregation.fn || AggregationFn.COUNT;

        if (fn === AggregationFn.COUNT) {
          aggregateCount(i);
        } else {
          const f = _resolversGenerated.scalarFields.get(`${this.name}.${aggregation.field || 'id'}`);

          const invalidType = () => new Error(`[${aggregation.field}] can't be used with [${fn}]`);

          if (!f) {
            throw invalidType();
          }

          switch (f.type) {
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
      text = `
                FOR doc IN ${this.name}
                ${filterSection}
                COLLECT AGGREGATE ${col.join(', ')}
                RETURN [${ret.join(', ')}]`;
    }

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
          if (x === undefined || x === null) {
            return x;
          }

          const bigInt = x.uint64 || x.uint1024;

          if (bigInt) {
            const len = 'uint64' in x ? 1 : 2;

            if (typeof bigInt === 'number') {
              return bigInt.toString();
            }

            if (typeof bigInt === 'string') {
              //$FlowFixMe
              return BigInt(`0x${bigInt.substr(len)}`).toString();
            } //$FlowFixMe


            let h = BigInt(`0x${Number(bigInt.h).toString(16)}00000000`);
            let l = BigInt(bigInt.l);
            return (h + l).toString();
          } else {
            return x.toString();
          }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0IiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0IiwiY29uc29sZSIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiY29sIiwicmV0IiwiYWdncmVnYXRlQ291bnQiLCJpIiwicHVzaCIsImFnZ3JlZ2F0ZU51bWJlciIsImYiLCJmbiIsImFnZ3JlZ2F0ZUJpZ051bWJlciIsInR5cGUiLCJhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyIsImxlbiIsImhIZXgiLCJsSGV4IiwiYWdncmVnYXRlTm9uTnVtYmVyIiwiaXNTaW5nbGVDb3VudCIsImZpZWxkcyIsImZvckVhY2giLCJhZ2dyZWdhdGlvbiIsInNjYWxhckZpZWxkcyIsImludmFsaWRUeXBlIiwiRXJyb3IiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiYWdncmVnYXRlIiwiYmlnSW50IiwidWludDY0IiwidWludDEwMjQiLCJ0b1N0cmluZyIsIkJpZ0ludCIsInN1YnN0ciIsImgiLCJsIiwiZGJDb2xsZWN0aW9uIiwiY29sbGVjdGlvbiIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUVBOztBQUVBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBbkNBOzs7Ozs7Ozs7Ozs7Ozs7QUFzRE8sTUFBTUEsYUFBYSxHQUFHO0FBQ3pCQyxFQUFBQSxLQUFLLEVBQUUsT0FEa0I7QUFFekJDLEVBQUFBLEdBQUcsRUFBRSxLQUZvQjtBQUd6QkMsRUFBQUEsR0FBRyxFQUFFLEtBSG9CO0FBSXpCQyxFQUFBQSxHQUFHLEVBQUUsS0FKb0I7QUFLekJDLEVBQUFBLE9BQU8sRUFBRSxTQUxnQjtBQU16QkMsRUFBQUEsaUJBQWlCLEVBQUUsbUJBTk07QUFPekJDLEVBQUFBLGFBQWEsRUFBRSxlQVBVO0FBUXpCQyxFQUFBQSxtQkFBbUIsRUFBRSxxQkFSSTtBQVN6QkMsRUFBQUEsZUFBZSxFQUFFO0FBVFEsQ0FBdEI7OztBQXlCUCxTQUFTQyxrQkFBVCxDQUNJQyxhQURKLEVBRUlDLFNBRkosRUFHSUMsT0FISixFQUlXO0FBQ1AsTUFBSSxDQUFDRCxTQUFMLEVBQWdCO0FBQ1osV0FBT0QsYUFBUDtBQUNIOztBQUNELE1BQUlBLGFBQWEsSUFBSUMsU0FBUyxLQUFLRCxhQUFuQyxFQUFrRDtBQUM5Q0UsSUFBQUEsT0FBTyxDQUFDQywwQkFBUixHQUFxQyxJQUFyQztBQUNBLFVBQU0sd0JBQ0YsR0FERSxFQUVGLG9FQUZFLENBQU47QUFJSDs7QUFDRCxTQUFPRixTQUFQO0FBQ0g7O0FBRU0sZUFBZUcsb0JBQWYsQ0FBb0NGLE9BQXBDLEVBQW9FRyxJQUFwRSxFQUFzRztBQUN6RyxRQUFNSixTQUFTLEdBQUdDLE9BQU8sQ0FBQ0QsU0FBUixJQUFxQkksSUFBSSxDQUFDSixTQUE1QztBQUNBQyxFQUFBQSxPQUFPLENBQUNGLGFBQVIsR0FBd0JELGtCQUFrQixDQUFDRyxPQUFPLENBQUNGLGFBQVQsRUFBd0JDLFNBQXhCLEVBQW1DQyxPQUFuQyxDQUExQztBQUNBLFNBQU9BLE9BQU8sQ0FBQ0ksSUFBUixDQUFhRixvQkFBYixDQUFrQ0gsU0FBbEMsQ0FBUDtBQUNIOztBQUVNLFNBQVNNLGlCQUFULENBQTJCTCxPQUEzQixFQUEyREcsSUFBM0QsRUFBc0U7QUFDekUsUUFBTUosU0FBUyxHQUFHSSxJQUFJLENBQUNKLFNBQXZCO0FBQ0FDLEVBQUFBLE9BQU8sQ0FBQ00sZ0JBQVIsR0FBMkJULGtCQUFrQixDQUFDRyxPQUFPLENBQUNNLGdCQUFULEVBQTJCUCxTQUEzQixFQUFzQ0MsT0FBdEMsQ0FBN0M7O0FBQ0EsTUFBSSxDQUFDRCxTQUFELElBQWMsQ0FBQ0MsT0FBTyxDQUFDTyxNQUFSLENBQWVDLGFBQWYsQ0FBNkJDLEdBQTdCLENBQWlDVixTQUFqQyxDQUFuQixFQUFnRTtBQUM1RCxVQUFNVyxXQUFLQyxpQkFBTCxFQUFOO0FBQ0g7QUFDSjs7QUFFRCxNQUFNQyxhQUEyQixHQUFHO0FBQ2hDQyxFQUFBQSxPQUFPLEVBQUUsSUFEdUI7QUFFaENDLEVBQUFBLGtCQUFrQixFQUFFO0FBRlksQ0FBcEM7O0FBS08sTUFBTUMsVUFBTixDQUFpQjtBQXVCcEJDLEVBQUFBLFdBQVcsQ0FDUEMsSUFETyxFQUVQQyxPQUZPLEVBR1BDLElBSE8sRUFJUGYsSUFKTyxFQUtQZ0IsTUFMTyxFQU1QQyxLQU5PLEVBT1BDLEVBUE8sRUFRUEMsTUFSTyxFQVNUO0FBQ0UsU0FBS04sSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsT0FBTCxHQUFlQSxPQUFmO0FBRUEsU0FBS00sR0FBTCxHQUFXTCxJQUFJLENBQUNNLE1BQUwsQ0FBWVIsSUFBWixDQUFYO0FBQ0EsU0FBS2IsSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS2dCLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtFLEVBQUwsR0FBVUEsRUFBVjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtHLFlBQUwsR0FBb0IsQ0FBcEI7QUFDQSxTQUFLQyxpQkFBTCxHQUF5QixDQUF6QjtBQUVBLFNBQUtDLE9BQUwsR0FBZSxJQUFJQyxvQkFBSixDQUFpQlIsS0FBakIsRUFBd0JTLGNBQU1DLEdBQU4sQ0FBVUMsS0FBbEMsRUFBeUMsQ0FBRSxjQUFhZixJQUFLLEVBQXBCLENBQXpDLENBQWY7QUFDQSxTQUFLZ0IsU0FBTCxHQUFpQixJQUFJSixvQkFBSixDQUFpQlIsS0FBakIsRUFBd0JTLGNBQU1JLEtBQU4sQ0FBWUYsS0FBcEMsRUFBMkMsQ0FBRSxjQUFhZixJQUFLLEVBQXBCLENBQTNDLENBQWpCO0FBQ0EsU0FBS2tCLGFBQUwsR0FBcUIsSUFBSUMsbUJBQUosQ0FBZ0JmLEtBQWhCLEVBQXVCUyxjQUFNSSxLQUFOLENBQVlHLElBQW5DLEVBQXlDLENBQUUsY0FBYXBCLElBQUssRUFBcEIsQ0FBekMsQ0FBckI7QUFDQSxTQUFLcUIsZUFBTCxHQUF1QixJQUFJQyxrQkFBSixDQUFlbEIsS0FBZixFQUFzQlMsY0FBTUksS0FBTixDQUFZTSxNQUFsQyxFQUEwQyxDQUFFLGNBQWF2QixJQUFLLEVBQXBCLENBQTFDLENBQXZCO0FBQ0EsU0FBS3dCLGlCQUFMLEdBQXlCLElBQUlGLGtCQUFKLENBQWVsQixLQUFmLEVBQXNCUyxjQUFNWSxPQUFOLENBQWNGLE1BQXBDLEVBQTRDLENBQUUsY0FBYXZCLElBQUssRUFBcEIsQ0FBNUMsQ0FBekI7QUFDQSxTQUFLMEIsc0JBQUwsR0FBOEIsSUFBSUosa0JBQUosQ0FBZWxCLEtBQWYsRUFBc0JTLGNBQU1jLFlBQU4sQ0FBbUJKLE1BQXpDLEVBQWlELENBQUUsY0FBYXZCLElBQUssRUFBcEIsQ0FBakQsQ0FBOUI7QUFFQSxTQUFLNEIsaUJBQUwsR0FBeUIsSUFBSUMsZUFBSixFQUF6QjtBQUNBLFNBQUtELGlCQUFMLENBQXVCRSxlQUF2QixDQUF1QyxDQUF2QztBQUNBLFNBQUtDLFVBQUwsR0FBa0IsSUFBSUMsR0FBSixFQUFsQjtBQUNBLFNBQUtDLFlBQUwsR0FBb0IsQ0FBcEI7QUFDSCxHQXZEbUIsQ0F5RHBCOzs7QUFFQUMsRUFBQUEsd0JBQXdCLENBQUNwQixHQUFELEVBQVc7QUFDL0IsU0FBS0gsT0FBTCxDQUFhd0IsU0FBYjtBQUNBLFNBQUtQLGlCQUFMLENBQXVCUSxJQUF2QixDQUE0QixLQUE1QixFQUFtQ3RCLEdBQW5DO0FBQ0g7O0FBRUR1QixFQUFBQSxvQkFBb0IsR0FBRztBQUNuQixXQUFPO0FBQ0hDLE1BQUFBLFNBQVMsRUFBRSxPQUFPQyxDQUFQLEVBQWVyRCxJQUFmLEVBQXNDSCxPQUF0QyxFQUFvRHlELElBQXBELEtBQWtFO0FBQ3pFLGNBQU1DLFlBQVksR0FBRyxNQUFNeEQsb0JBQW9CLENBQUNGLE9BQUQsRUFBVUcsSUFBVixDQUEvQztBQUNBLGNBQU15QyxZQUFZLEdBQUcsSUFBSWUsZ0NBQUosQ0FDakIsS0FBSzFDLElBRFksRUFFakIsS0FBS0MsT0FGWSxFQUdqQndDLFlBSGlCLEVBSWpCdkQsSUFBSSxDQUFDeUQsTUFBTCxJQUFlLEVBSkUsRUFLakIsZ0NBQWtCSCxJQUFJLENBQUNJLFNBQUwsQ0FBZUMsWUFBakMsRUFBK0MsS0FBSzdDLElBQXBELENBTGlCLENBQXJCOztBQU9BLGNBQU04QyxhQUFhLEdBQUloQyxHQUFELElBQVM7QUFDM0JhLFVBQUFBLFlBQVksQ0FBQ29CLFlBQWIsQ0FBMEJqQyxHQUExQjtBQUNILFNBRkQ7O0FBR0EsYUFBS2MsaUJBQUwsQ0FBdUJvQixFQUF2QixDQUEwQixLQUExQixFQUFpQ0YsYUFBakM7QUFDQSxhQUFLcEMsaUJBQUwsSUFBMEIsQ0FBMUI7O0FBQ0FpQixRQUFBQSxZQUFZLENBQUNzQixPQUFiLEdBQXVCLE1BQU07QUFDekIsZUFBS3JCLGlCQUFMLENBQXVCc0IsY0FBdkIsQ0FBc0MsS0FBdEMsRUFBNkNKLGFBQTdDO0FBQ0EsZUFBS3BDLGlCQUFMLEdBQXlCeUMsSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQUsxQyxpQkFBTCxHQUF5QixDQUFyQyxDQUF6QjtBQUNILFNBSEQ7O0FBSUEsZUFBT2lCLFlBQVA7QUFDSDtBQXBCRSxLQUFQO0FBc0JILEdBdkZtQixDQXlGcEI7OztBQUVBMEIsRUFBQUEsc0JBQXNCLENBQUNaLFlBQUQsRUFBNkJhLE1BQTdCLEVBQThDO0FBQ2hFLFVBQU1DLFFBQVEsR0FBR2QsWUFBWSxDQUFDNUMsa0JBQTlCOztBQUNBLFFBQUkwRCxRQUFRLENBQUNDLE1BQVQsS0FBb0IsQ0FBeEIsRUFBMkI7QUFDdkIsYUFBTyxFQUFQO0FBQ0g7O0FBQ0QsVUFBTUMsU0FBUyxHQUFHRixRQUFRLENBQUNDLE1BQVQsS0FBb0IsQ0FBcEIsR0FDWCxPQUFNRixNQUFNLENBQUNJLEdBQVAsQ0FBV0gsUUFBUSxDQUFDLENBQUQsQ0FBbkIsQ0FBd0IsRUFEbkIsR0FFWCxPQUFNQSxRQUFRLENBQUNJLEdBQVQsQ0FBYUMsQ0FBQyxJQUFLLElBQUdOLE1BQU0sQ0FBQ0ksR0FBUCxDQUFXRSxDQUFYLENBQWMsRUFBcEMsRUFBdUNDLElBQXZDLENBQTRDLEdBQTVDLENBQWlELEdBRjlEOztBQUdBLFlBQVEsS0FBSzdELElBQWI7QUFDQSxXQUFLLFVBQUw7QUFDSSxlQUFRLFlBQVd5RCxTQUFVLEVBQTdCOztBQUNKLFdBQUssY0FBTDtBQUNJLGVBQVEsb0JBQW1CQSxTQUFVLEVBQXJDOztBQUNKLFdBQUssVUFBTDtBQUNJLGVBQVEsWUFBV0EsU0FBVSxpQkFBZ0JBLFNBQVUsR0FBdkQ7O0FBQ0o7QUFDSSxlQUFPLEVBQVA7QUFSSjtBQVVIOztBQUVESyxFQUFBQSxnQkFBZ0IsQ0FDWm5CLE1BRFksRUFFWlcsTUFGWSxFQUdaYixZQUhZLEVBSUw7QUFDUCxVQUFNc0IsZ0JBQWdCLEdBQUdDLE1BQU0sQ0FBQ0MsSUFBUCxDQUFZdEIsTUFBWixFQUFvQmEsTUFBcEIsR0FBNkIsQ0FBN0IsR0FDbkIsS0FBS3ZELE9BQUwsQ0FBYWlFLEVBQWIsQ0FBZ0JaLE1BQWhCLEVBQXdCLEtBQXhCLEVBQStCWCxNQUEvQixDQURtQixHQUVuQixFQUZOO0FBR0EsVUFBTXdCLG1CQUFtQixHQUFHLEtBQUtkLHNCQUFMLENBQTRCWixZQUE1QixFQUEwQ2EsTUFBMUMsQ0FBNUI7O0FBQ0EsUUFBSVMsZ0JBQWdCLEtBQUssT0FBckIsSUFBZ0NJLG1CQUFtQixLQUFLLE9BQTVELEVBQXFFO0FBQ2pFLGFBQU8sSUFBUDtBQUNIOztBQUNELFdBQVFKLGdCQUFnQixJQUFJSSxtQkFBckIsR0FDQSxJQUFHSixnQkFBaUIsVUFBU0ksbUJBQW9CLEdBRGpELEdBRUFKLGdCQUFnQixJQUFJSSxtQkFGM0I7QUFJSDs7QUFFREMsRUFBQUEsbUJBQW1CLENBQ2ZsRixJQURlLEVBUWZtRixhQVJlLEVBU2Y1QixZQVRlLEVBVUQ7QUFDZCxVQUFNRSxNQUFNLEdBQUd6RCxJQUFJLENBQUN5RCxNQUFMLElBQWUsRUFBOUI7QUFDQSxVQUFNVyxNQUFNLEdBQUcsSUFBSWdCLGdCQUFKLEVBQWY7QUFDQSxVQUFNYixTQUFTLEdBQUcsS0FBS0ssZ0JBQUwsQ0FBc0JuQixNQUF0QixFQUE4QlcsTUFBOUIsRUFBc0NiLFlBQXRDLENBQWxCOztBQUNBLFFBQUlnQixTQUFTLEtBQUssSUFBbEIsRUFBd0I7QUFDcEIsYUFBTyxJQUFQO0FBQ0g7O0FBQ0QsVUFBTWMsYUFBYSxHQUFHZCxTQUFTLEdBQUksVUFBU0EsU0FBVSxFQUF2QixHQUEyQixFQUExRDtBQUNBLFVBQU1lLFNBQVMsR0FBR0gsYUFBYSxDQUFDSSxVQUFkLEdBQ1osZ0NBQWtCSixhQUFsQixFQUFpQyxLQUFLckUsSUFBdEMsQ0FEWSxHQUVacUUsYUFGTjtBQUdBLFVBQU1LLE9BQWtCLEdBQUd4RixJQUFJLENBQUN3RixPQUFMLElBQWdCLEVBQTNDO0FBQ0EsVUFBTUMsS0FBYSxHQUFHekYsSUFBSSxDQUFDeUYsS0FBTCxJQUFjLEVBQXBDO0FBQ0EsVUFBTUMsT0FBTyxHQUFHQyxNQUFNLENBQUMzRixJQUFJLENBQUMwRixPQUFOLENBQU4sSUFBd0IsQ0FBeEM7QUFDQSxVQUFNRSxXQUFXLEdBQUdKLE9BQU8sQ0FDdEJmLEdBRGUsQ0FDVm9CLEtBQUQsSUFBVztBQUNaLFlBQU1DLFNBQVMsR0FBSUQsS0FBSyxDQUFDQyxTQUFOLElBQW1CRCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFdBQWhCLE9BQWtDLE1BQXRELEdBQ1osT0FEWSxHQUVaLEVBRk47QUFHQSxhQUFRLE9BQU1GLEtBQUssQ0FBQ0csSUFBTixDQUFXQyxPQUFYLENBQW1CLFVBQW5CLEVBQStCLE1BQS9CLENBQXVDLEdBQUVILFNBQVUsRUFBakU7QUFDSCxLQU5lLEVBT2ZuQixJQVBlLENBT1YsSUFQVSxDQUFwQjtBQVNBLFVBQU11QixXQUFXLEdBQUdOLFdBQVcsS0FBSyxFQUFoQixHQUFzQixRQUFPQSxXQUFZLEVBQXpDLEdBQTZDLEVBQWpFO0FBQ0EsVUFBTU8sU0FBUyxHQUFHbEMsSUFBSSxDQUFDbUMsR0FBTCxDQUFTWCxLQUFULEVBQWdCLEVBQWhCLENBQWxCO0FBQ0EsVUFBTVksWUFBWSxHQUFJLFNBQVFGLFNBQVUsRUFBeEM7QUFFQSxVQUFNRyxJQUFJLEdBQUk7eUJBQ0csS0FBS3hGLElBQUs7Y0FDckJ1RSxhQUFjO2NBQ2RhLFdBQVk7Y0FDWkcsWUFBYTt1QkFKbkI7QUFPQSxXQUFPO0FBQ0g1QyxNQUFBQSxNQURHO0FBRUg2QixNQUFBQSxTQUZHO0FBR0hFLE1BQUFBLE9BSEc7QUFJSEMsTUFBQUEsS0FKRztBQUtIQyxNQUFBQSxPQUxHO0FBTUhhLE1BQUFBLFdBQVcsRUFBRXZHLElBQUksQ0FBQ3VHLFdBQUwsSUFBb0IsSUFOOUI7QUFPSEQsTUFBQUEsSUFQRztBQVFIbEMsTUFBQUEsTUFBTSxFQUFFQSxNQUFNLENBQUNvQyxNQVJaO0FBU0hqRCxNQUFBQTtBQVRHLEtBQVA7QUFXSDs7QUFFRGtELEVBQUFBLFdBQVcsQ0FDUEgsSUFETyxFQUVQN0MsTUFGTyxFQUdQK0IsT0FITyxFQUlBO0FBQ1AsVUFBTWtCLFlBQVksR0FBRyxLQUFLN0QsVUFBTCxDQUFnQjhELEdBQWhCLENBQW9CTCxJQUFwQixDQUFyQjs7QUFDQSxRQUFJSSxZQUFZLEtBQUtFLFNBQXJCLEVBQWdDO0FBQzVCLGFBQU9GLFlBQVksQ0FBQ0csTUFBcEI7QUFDSDs7QUFDRCxVQUFNQyxjQUFjLEdBQUdDLHNCQUFjQyxXQUFkLENBQTBCLEtBQUtsRyxJQUEvQixDQUF2QjtBQUNBLFVBQU1tRyxJQUFJLEdBQUc7QUFDVEosTUFBQUEsTUFBTSxFQUFFLCtCQUFZQyxjQUFaLEVBQTRCLEtBQUsvRixPQUFqQyxFQUEwQzBDLE1BQTFDLEVBQWtEK0IsT0FBTyxJQUFJLEVBQTdELEVBQWlFMEIsT0FBakU7QUFEQyxLQUFiO0FBR0EsU0FBS3JFLFVBQUwsQ0FBZ0JzRSxHQUFoQixDQUFvQmIsSUFBcEIsRUFBMEJXLElBQTFCO0FBQ0EsV0FBT0EsSUFBSSxDQUFDSixNQUFaO0FBQ0g7O0FBRURPLEVBQUFBLGFBQWEsR0FBRztBQUNaLFdBQU8sT0FDSEMsTUFERyxFQUVIckgsSUFGRyxFQUdISCxPQUhHLEVBSUh5RCxJQUpHLEtBS0YsaUJBQUssS0FBS2pDLEdBQVYsRUFBZSxPQUFmLEVBQXdCckIsSUFBeEIsRUFBOEIsWUFBWTtBQUMzQyxXQUFLOEIsU0FBTCxDQUFlbUIsU0FBZjtBQUNBLFdBQUtkLGVBQUwsQ0FBcUJjLFNBQXJCO0FBQ0EsWUFBTXFFLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxHQUFMLEVBQWQ7O0FBQ0EsVUFBSTtBQUNBLGNBQU1qRSxZQUFZLEdBQUcsTUFBTXhELG9CQUFvQixDQUFDRixPQUFELEVBQVVHLElBQVYsQ0FBL0M7QUFDQSxjQUFNeUgsQ0FBQyxHQUFHLEtBQUt2QyxtQkFBTCxDQUF5QmxGLElBQXpCLEVBQStCc0QsSUFBSSxDQUFDSSxTQUFMLENBQWVDLFlBQTlDLEVBQTRESixZQUE1RCxDQUFWOztBQUNBLFlBQUksQ0FBQ2tFLENBQUwsRUFBUTtBQUNKLGVBQUtwRyxHQUFMLENBQVNxRyxLQUFULENBQWUsT0FBZixFQUF3QjFILElBQXhCLEVBQThCLENBQTlCLEVBQWlDLFNBQWpDLEVBQTRDSCxPQUFPLENBQUM4SCxhQUFwRDtBQUNBLGlCQUFPLEVBQVA7QUFDSDs7QUFDRCxjQUFNZCxNQUFNLEdBQUcsS0FBS0osV0FBTCxDQUFpQmdCLENBQUMsQ0FBQ25CLElBQW5CLEVBQXlCbUIsQ0FBQyxDQUFDaEUsTUFBM0IsRUFBbUNnRSxDQUFDLENBQUNqQyxPQUFyQyxDQUFmO0FBQ0EsY0FBTW9DLFdBQWdCLEdBQUc7QUFDckJuRSxVQUFBQSxNQUFNLEVBQUVnRSxDQUFDLENBQUNoRSxNQURXO0FBRXJCNkIsVUFBQUEsU0FBUyxFQUFFLGdDQUFrQm1DLENBQUMsQ0FBQ25DLFNBQXBCO0FBRlUsU0FBekI7O0FBSUEsWUFBSW1DLENBQUMsQ0FBQ2pDLE9BQUYsQ0FBVWxCLE1BQVYsR0FBbUIsQ0FBdkIsRUFBMEI7QUFDdEJzRCxVQUFBQSxXQUFXLENBQUNwQyxPQUFaLEdBQXNCaUMsQ0FBQyxDQUFDakMsT0FBeEI7QUFDSDs7QUFDRCxZQUFJaUMsQ0FBQyxDQUFDaEMsS0FBRixLQUFZLEVBQWhCLEVBQW9CO0FBQ2hCbUMsVUFBQUEsV0FBVyxDQUFDbkMsS0FBWixHQUFvQmdDLENBQUMsQ0FBQ2hDLEtBQXRCO0FBQ0g7O0FBQ0QsWUFBSWdDLENBQUMsQ0FBQy9CLE9BQUYsR0FBWSxDQUFoQixFQUFtQjtBQUNma0MsVUFBQUEsV0FBVyxDQUFDbEMsT0FBWixHQUFzQitCLENBQUMsQ0FBQy9CLE9BQXhCO0FBQ0g7O0FBQ0QsY0FBTTRCLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxHQUFMLEVBQWQ7QUFDQSxjQUFNSyxNQUFNLEdBQUdKLENBQUMsQ0FBQy9CLE9BQUYsR0FBWSxDQUFaLEdBQ1QsTUFBTSxLQUFLb0MsWUFBTCxDQUFrQkwsQ0FBbEIsRUFBcUJaLE1BQXJCLEVBQTZCZSxXQUE3QixFQUEwQy9ILE9BQU8sQ0FBQ2tJLFVBQWxELENBREcsR0FFVCxNQUFNLEtBQUtoRyxLQUFMLENBQVcwRixDQUFDLENBQUNuQixJQUFiLEVBQW1CbUIsQ0FBQyxDQUFDckQsTUFBckIsRUFBNkJ5QyxNQUE3QixFQUFxQ2UsV0FBckMsRUFBa0QvSCxPQUFPLENBQUNrSSxVQUExRCxDQUZaO0FBR0EsYUFBSzFHLEdBQUwsQ0FBU3FHLEtBQVQsQ0FDSSxPQURKLEVBRUkxSCxJQUZKLEVBR0ksQ0FBQ3VILElBQUksQ0FBQ0MsR0FBTCxLQUFhRixLQUFkLElBQXVCLElBSDNCLEVBSUlULE1BQU0sR0FBRyxNQUFILEdBQVksTUFKdEIsRUFJOEJoSCxPQUFPLENBQUM4SCxhQUp0QztBQU1BLGVBQU9FLE1BQVA7QUFDSCxPQWhDRCxTQWdDVTtBQUNOLGFBQUs3RixhQUFMLENBQW1CZ0csTUFBbkIsQ0FBMEJULElBQUksQ0FBQ0MsR0FBTCxLQUFhRixLQUF2QztBQUNBLGFBQUtuRixlQUFMLENBQXFCOEYsU0FBckI7QUFDSDtBQUNKLEtBeENJLENBTEw7QUE4Q0g7O0FBRUQsUUFBTWxHLEtBQU4sQ0FDSXVFLElBREosRUFFSWxDLE1BRkosRUFHSXlDLE1BSEosRUFJSWUsV0FKSixFQUtJRyxVQUxKLEVBTWdCO0FBQ1osV0FBT0csZ0JBQVFDLEtBQVIsQ0FBYyxLQUFLbEgsTUFBbkIsRUFBNEIsR0FBRSxLQUFLSCxJQUFLLFFBQXhDLEVBQWlELE1BQU9zSCxJQUFQLElBQXNCO0FBQzFFLFVBQUlSLFdBQUosRUFBaUI7QUFDYlEsUUFBQUEsSUFBSSxDQUFDQyxNQUFMLENBQVksUUFBWixFQUFzQlQsV0FBdEI7QUFDSDs7QUFDRCxhQUFPLEtBQUtVLGFBQUwsQ0FBbUJoQyxJQUFuQixFQUF5QmxDLE1BQXpCLEVBQWlDeUMsTUFBakMsQ0FBUDtBQUNILEtBTE0sRUFLSmtCLFVBTEksQ0FBUDtBQU1IOztBQUVELFFBQU1PLGFBQU4sQ0FBb0JoQyxJQUFwQixFQUFrQ2xDLE1BQWxDLEVBQTZEeUMsTUFBN0QsRUFBNEY7QUFDeEYsVUFBTTFGLEVBQUUsR0FBRzBGLE1BQU0sR0FBRyxLQUFLMUYsRUFBUixHQUFhLEtBQUtDLE1BQW5DO0FBQ0EsVUFBTW1ILE1BQU0sR0FBRyxNQUFNcEgsRUFBRSxDQUFDWSxLQUFILENBQVN1RSxJQUFULEVBQWVsQyxNQUFmLENBQXJCO0FBQ0EsV0FBT21FLE1BQU0sQ0FBQ0MsR0FBUCxFQUFQO0FBQ0g7O0FBR0QsUUFBTVYsWUFBTixDQUNJTCxDQURKLEVBRUlaLE1BRkosRUFHSWUsV0FISixFQUlJRyxVQUpKLEVBS2dCO0FBQ1osV0FBT0csZ0JBQVFDLEtBQVIsQ0FBYyxLQUFLbEgsTUFBbkIsRUFBNEIsR0FBRSxLQUFLSCxJQUFLLFVBQXhDLEVBQW1ELE1BQU9zSCxJQUFQLElBQXNCO0FBQzVFLFVBQUlSLFdBQUosRUFBaUI7QUFDYlEsUUFBQUEsSUFBSSxDQUFDQyxNQUFMLENBQVksUUFBWixFQUFzQlQsV0FBdEI7QUFDSDs7QUFDRCxVQUFJckYsT0FBOEIsR0FBRyxJQUFyQztBQUNBLFVBQUlrRyxZQUF3QixHQUFHLElBQS9CO0FBQ0EsVUFBSUMsVUFBbUIsR0FBRyxJQUExQjs7QUFDQSxVQUFJO0FBQ0EsY0FBTUMsT0FBTyxHQUFHLElBQUlDLE9BQUosQ0FBWSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDN0MsZ0JBQU1DLEtBQUssR0FBRyxNQUFNO0FBQ2hCLGlCQUFLVCxhQUFMLENBQW1CYixDQUFDLENBQUNuQixJQUFyQixFQUEyQm1CLENBQUMsQ0FBQ3JELE1BQTdCLEVBQXFDeUMsTUFBckMsRUFBNkNtQyxJQUE3QyxDQUFtREMsSUFBRCxJQUFVO0FBQ3hELGtCQUFJLENBQUNQLFVBQUwsRUFBaUI7QUFDYixvQkFBSU8sSUFBSSxDQUFDM0UsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCbUUsa0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0FDLGtCQUFBQSxVQUFVLEdBQUcsT0FBYjtBQUNBRyxrQkFBQUEsT0FBTyxDQUFDSSxJQUFELENBQVA7QUFDSCxpQkFKRCxNQUlPO0FBQ0hSLGtCQUFBQSxZQUFZLEdBQUdTLFVBQVUsQ0FBQ0gsS0FBRCxFQUFRLElBQVIsQ0FBekI7QUFDSDtBQUNKO0FBQ0osYUFWRCxFQVVHRCxNQVZIO0FBV0gsV0FaRDs7QUFhQUMsVUFBQUEsS0FBSztBQUNSLFNBZmUsQ0FBaEI7QUFnQkEsY0FBTUksYUFBYSxHQUFHLElBQUlQLE9BQUosQ0FBYUMsT0FBRCxJQUFhO0FBQzNDLGdCQUFNTyxVQUFVLEdBQUdDLGtDQUFpQkMsYUFBakIsQ0FBK0IsS0FBS3hJLElBQXBDLEVBQTBDMkcsQ0FBQyxDQUFDbEUsWUFBNUMsQ0FBbkI7O0FBQ0FoQixVQUFBQSxPQUFPLEdBQUlYLEdBQUQsSUFBUztBQUNmLGdCQUFJd0gsVUFBVSxJQUFJLENBQUNBLFVBQVUsQ0FBQ3hILEdBQUQsQ0FBN0IsRUFBb0M7QUFDaEM7QUFDSDs7QUFDRCxnQkFBSSxLQUFLYixPQUFMLENBQWF3SSxJQUFiLENBQWtCLElBQWxCLEVBQXdCM0gsR0FBeEIsRUFBNkI2RixDQUFDLENBQUNoRSxNQUEvQixDQUFKLEVBQTRDO0FBQ3hDLGtCQUFJLENBQUNpRixVQUFMLEVBQWlCO0FBQ2JBLGdCQUFBQSxVQUFVLEdBQUcsVUFBYjtBQUNBRyxnQkFBQUEsT0FBTyxDQUFDLENBQUNqSCxHQUFELENBQUQsQ0FBUDtBQUNIO0FBQ0o7QUFDSixXQVZEOztBQVdBLGVBQUtMLFlBQUwsSUFBcUIsQ0FBckI7QUFDQSxlQUFLbUIsaUJBQUwsQ0FBdUJvQixFQUF2QixDQUEwQixLQUExQixFQUFpQ3ZCLE9BQWpDO0FBQ0EsZUFBS0QsaUJBQUwsQ0FBdUJXLFNBQXZCO0FBQ0gsU0FoQnFCLENBQXRCO0FBaUJBLGNBQU11RyxTQUFTLEdBQUcsSUFBSVosT0FBSixDQUFhQyxPQUFELElBQWE7QUFDdkNLLFVBQUFBLFVBQVUsQ0FBQyxNQUFNO0FBQ2IsZ0JBQUksQ0FBQ1IsVUFBTCxFQUFpQjtBQUNiQSxjQUFBQSxVQUFVLEdBQUcsU0FBYjtBQUNBRyxjQUFBQSxPQUFPLENBQUMsRUFBRCxDQUFQO0FBQ0g7QUFDSixXQUxTLEVBS1BwQixDQUFDLENBQUMvQixPQUxLLENBQVY7QUFNSCxTQVBpQixDQUFsQjtBQVFBLGNBQU1tQyxNQUFNLEdBQUcsTUFBTWUsT0FBTyxDQUFDYSxJQUFSLENBQWEsQ0FDOUJkLE9BRDhCLEVBRTlCUSxhQUY4QixFQUc5QkssU0FIOEIsQ0FBYixDQUFyQjtBQUtBcEIsUUFBQUEsSUFBSSxDQUFDQyxNQUFMLENBQVksVUFBWixFQUF3QkssVUFBeEI7QUFDQSxlQUFPYixNQUFQO0FBQ0gsT0FqREQsU0FpRFU7QUFDTixZQUFJdEYsT0FBTyxLQUFLLElBQVosSUFBb0JBLE9BQU8sS0FBS3FFLFNBQXBDLEVBQStDO0FBQzNDLGVBQUtyRixZQUFMLEdBQW9CMEMsSUFBSSxDQUFDQyxHQUFMLENBQVMsQ0FBVCxFQUFZLEtBQUszQyxZQUFMLEdBQW9CLENBQWhDLENBQXBCO0FBQ0EsZUFBS21CLGlCQUFMLENBQXVCc0IsY0FBdkIsQ0FBc0MsS0FBdEMsRUFBNkN6QixPQUE3QztBQUNBQSxVQUFBQSxPQUFPLEdBQUcsSUFBVjtBQUNBLGVBQUtELGlCQUFMLENBQXVCMkYsU0FBdkI7QUFDSDs7QUFDRCxZQUFJUSxZQUFZLEtBQUssSUFBckIsRUFBMkI7QUFDdkJpQixVQUFBQSxZQUFZLENBQUNqQixZQUFELENBQVo7QUFDQUEsVUFBQUEsWUFBWSxHQUFHLElBQWY7QUFDSDtBQUNKO0FBQ0osS0FwRU0sRUFvRUpWLFVBcEVJLENBQVA7QUFxRUgsR0E3Vm1CLENBK1ZwQjs7O0FBR0E0QixFQUFBQSxzQkFBc0IsQ0FDbEIzSixJQURrQixFQUVsQnVELFlBRmtCLEVBTXBCO0FBQ0UsVUFBTUUsTUFBTSxHQUFHekQsSUFBSSxDQUFDeUQsTUFBTCxJQUFlLEVBQTlCO0FBQ0EsVUFBTVcsTUFBTSxHQUFHLElBQUlnQixnQkFBSixFQUFmO0FBQ0EsVUFBTWIsU0FBUyxHQUFHLEtBQUtLLGdCQUFMLENBQXNCbkIsTUFBdEIsRUFBOEJXLE1BQTlCLEVBQXNDYixZQUF0QyxDQUFsQjs7QUFDQSxRQUFJZ0IsU0FBUyxLQUFLLElBQWxCLEVBQXdCO0FBQ3BCLGFBQU8sSUFBUDtBQUNIOztBQUNELFVBQU1jLGFBQWEsR0FBR2QsU0FBUyxHQUFJLFVBQVNBLFNBQVUsRUFBdkIsR0FBMkIsRUFBMUQ7QUFDQSxVQUFNcUYsR0FBYSxHQUFHLEVBQXRCO0FBQ0EsVUFBTUMsR0FBYSxHQUFHLEVBQXRCOztBQUVBLGFBQVNDLGNBQVQsQ0FBd0JDLENBQXhCLEVBQW1DO0FBQy9CSCxNQUFBQSxHQUFHLENBQUNJLElBQUosQ0FBVSxJQUFHRCxDQUFFLGVBQWY7QUFDQUYsTUFBQUEsR0FBRyxDQUFDRyxJQUFKLENBQVUsSUFBR0QsQ0FBRSxFQUFmO0FBQ0g7O0FBRUQsYUFBU0UsZUFBVCxDQUF5QkYsQ0FBekIsRUFBb0NHLENBQXBDLEVBQW9EQyxFQUFwRCxFQUEyRTtBQUN2RVAsTUFBQUEsR0FBRyxDQUFDSSxJQUFKLENBQVUsSUFBR0QsQ0FBRSxNQUFLSSxFQUFHLElBQUdELENBQUMsQ0FBQ2xFLElBQUssR0FBakM7QUFDQTZELE1BQUFBLEdBQUcsQ0FBQ0csSUFBSixDQUFVLElBQUdELENBQUUsRUFBZjtBQUNIOztBQUVELGFBQVNLLGtCQUFULENBQTRCTCxDQUE1QixFQUF1Q0csQ0FBdkMsRUFBdURDLEVBQXZELEVBQThFO0FBQzFFUCxNQUFBQSxHQUFHLENBQUNJLElBQUosQ0FBVSxJQUFHRCxDQUFFLE1BQUtJLEVBQUcsSUFBR0QsQ0FBQyxDQUFDbEUsSUFBSyxHQUFqQztBQUNBNkQsTUFBQUEsR0FBRyxDQUFDRyxJQUFKLENBQVUsS0FBSUUsQ0FBQyxDQUFDRyxJQUFLLE1BQUtOLENBQUUsSUFBNUI7QUFDSDs7QUFFRCxhQUFTTyx1QkFBVCxDQUFpQ1AsQ0FBakMsRUFBNENHLENBQTVDLEVBQTREQyxFQUE1RCxFQUFtRjtBQUMvRSxZQUFNSSxHQUFHLEdBQUdMLENBQUMsQ0FBQ0csSUFBRixLQUFXLFFBQVgsR0FBc0IsQ0FBdEIsR0FBMEIsQ0FBdEM7QUFDQSxZQUFNRyxJQUFJLEdBQUksYUFBWU4sQ0FBQyxDQUFDbEUsSUFBSyxLQUFJdUUsR0FBSSxZQUFXTCxDQUFDLENBQUNsRSxJQUFLLE9BQU11RSxHQUFJLE9BQXJFO0FBQ0EsWUFBTUUsSUFBSSxHQUFJLG1CQUFrQlAsQ0FBQyxDQUFDbEUsSUFBSyxLQUFJdUUsR0FBSSxPQUEvQztBQUNBWCxNQUFBQSxHQUFHLENBQUNJLElBQUosQ0FBVSxJQUFHRCxDQUFFLE1BQUtJLEVBQUcsMkJBQTBCSyxJQUFLLEtBQXREO0FBQ0FaLE1BQUFBLEdBQUcsQ0FBQ0ksSUFBSixDQUFVLElBQUdELENBQUUsTUFBS0ksRUFBRywyQkFBMEJNLElBQUssS0FBdEQ7QUFDQVosTUFBQUEsR0FBRyxDQUFDRyxJQUFKLENBQVUsS0FBSUUsQ0FBQyxDQUFDRyxJQUFLLFdBQVVOLENBQUUsU0FBUUEsQ0FBRSxNQUEzQztBQUNIOztBQUVELGFBQVNXLGtCQUFULENBQTRCWCxDQUE1QixFQUF1Q0csQ0FBdkMsRUFBdURDLEVBQXZELEVBQThFO0FBQzFFUCxNQUFBQSxHQUFHLENBQUNJLElBQUosQ0FBVSxJQUFHRCxDQUFFLE1BQUtJLEVBQUcsSUFBR0QsQ0FBQyxDQUFDbEUsSUFBSyxHQUFqQztBQUNBNkQsTUFBQUEsR0FBRyxDQUFDRyxJQUFKLENBQVUsSUFBR0QsQ0FBRSxFQUFmO0FBQ0g7O0FBRUQsUUFBSXpELElBQUo7QUFDQSxVQUFNcUUsYUFBYSxHQUFJM0ssSUFBSSxDQUFDNEssTUFBTCxDQUFZdEcsTUFBWixLQUF1QixDQUF4QixJQUNkdEUsSUFBSSxDQUFDNEssTUFBTCxDQUFZLENBQVosRUFBZVQsRUFBZixLQUFzQm5MLGFBQWEsQ0FBQ0MsS0FENUM7O0FBRUEsUUFBSTBMLGFBQUosRUFBbUI7QUFDZnJFLE1BQUFBLElBQUksR0FBSTs2QkFDUyxLQUFLeEYsSUFBSztrQkFDckJ1RSxhQUFjOzs0QkFGcEI7QUFLSCxLQU5ELE1BTU87QUFDSHJGLE1BQUFBLElBQUksQ0FBQzRLLE1BQUwsQ0FBWUMsT0FBWixDQUFvQixDQUFDQyxXQUFELEVBQWdDZixDQUFoQyxLQUE4QztBQUM5RCxjQUFNSSxFQUFFLEdBQUdXLFdBQVcsQ0FBQ1gsRUFBWixJQUFrQm5MLGFBQWEsQ0FBQ0MsS0FBM0M7O0FBQ0EsWUFBSWtMLEVBQUUsS0FBS25MLGFBQWEsQ0FBQ0MsS0FBekIsRUFBZ0M7QUFDNUI2SyxVQUFBQSxjQUFjLENBQUNDLENBQUQsQ0FBZDtBQUNILFNBRkQsTUFFTztBQUNILGdCQUFNRyxDQUFtQyxHQUFHYSxpQ0FBYXBFLEdBQWIsQ0FBa0IsR0FBRSxLQUFLN0YsSUFBSyxJQUFHZ0ssV0FBVyxDQUFDakYsS0FBWixJQUFxQixJQUFLLEVBQTNELENBQTVDOztBQUNBLGdCQUFNbUYsV0FBVyxHQUFHLE1BQU0sSUFBSUMsS0FBSixDQUFXLElBQUdILFdBQVcsQ0FBQ2pGLEtBQU0seUJBQXdCc0UsRUFBRyxHQUEzRCxDQUExQjs7QUFDQSxjQUFJLENBQUNELENBQUwsRUFBUTtBQUNKLGtCQUFNYyxXQUFXLEVBQWpCO0FBQ0g7O0FBQ0Qsa0JBQVFkLENBQUMsQ0FBQ0csSUFBVjtBQUNBLGlCQUFLLFFBQUw7QUFDSUosY0FBQUEsZUFBZSxDQUFDRixDQUFELEVBQUlHLENBQUosRUFBT0MsRUFBUCxDQUFmO0FBQ0E7O0FBQ0osaUJBQUssUUFBTDtBQUNBLGlCQUFLLFVBQUw7QUFDSSxrQkFBSUEsRUFBRSxLQUFLbkwsYUFBYSxDQUFDRSxHQUFyQixJQUE0QmlMLEVBQUUsS0FBS25MLGFBQWEsQ0FBQ0csR0FBckQsRUFBMEQ7QUFDdERpTCxnQkFBQUEsa0JBQWtCLENBQUNMLENBQUQsRUFBSUcsQ0FBSixFQUFPQyxFQUFQLENBQWxCO0FBQ0gsZUFGRCxNQUVPO0FBQ0hHLGdCQUFBQSx1QkFBdUIsQ0FBQ1AsQ0FBRCxFQUFJRyxDQUFKLEVBQU9DLEVBQVAsQ0FBdkI7QUFDSDs7QUFDRDs7QUFDSjtBQUNJLGtCQUFJQSxFQUFFLEtBQUtuTCxhQUFhLENBQUNFLEdBQXJCLElBQTRCaUwsRUFBRSxLQUFLbkwsYUFBYSxDQUFDRyxHQUFyRCxFQUEwRDtBQUN0RHVMLGdCQUFBQSxrQkFBa0IsQ0FBQ1gsQ0FBRCxFQUFJRyxDQUFKLEVBQU9DLEVBQVAsQ0FBbEI7QUFDSCxlQUZELE1BRU87QUFDSCxzQkFBTWEsV0FBVyxFQUFqQjtBQUNIOztBQUNEO0FBbEJKO0FBb0JIO0FBQ0osT0EvQkQ7QUFnQ0ExRSxNQUFBQSxJQUFJLEdBQUk7NkJBQ1MsS0FBS3hGLElBQUs7a0JBQ3JCdUUsYUFBYztvQ0FDSXVFLEdBQUcsQ0FBQ2pGLElBQUosQ0FBUyxJQUFULENBQWU7MEJBQ3pCa0YsR0FBRyxDQUFDbEYsSUFBSixDQUFTLElBQVQsQ0FBZSxHQUo3QjtBQUtIOztBQUNELFdBQU87QUFDSDJCLE1BQUFBLElBREc7QUFFSGxDLE1BQUFBLE1BQU0sRUFBRUEsTUFBTSxDQUFDb0M7QUFGWixLQUFQO0FBSUg7O0FBRUQwRSxFQUFBQSxtQkFBbUIsR0FBRztBQUNsQixXQUFPLE9BQ0g3RCxNQURHLEVBRUhySCxJQUZHLEVBR0hILE9BSEcsS0FJRixpQkFBSyxLQUFLd0IsR0FBVixFQUFlLFdBQWYsRUFBNEJyQixJQUE1QixFQUFrQyxZQUFZO0FBQy9DLFdBQUs4QixTQUFMLENBQWVtQixTQUFmO0FBQ0EsV0FBS2QsZUFBTCxDQUFxQmMsU0FBckI7QUFDQSxZQUFNcUUsS0FBSyxHQUFHQyxJQUFJLENBQUNDLEdBQUwsRUFBZDs7QUFDQSxVQUFJO0FBQ0EsY0FBTWpFLFlBQVksR0FBRyxNQUFNeEQsb0JBQW9CLENBQUNGLE9BQUQsRUFBVUcsSUFBVixDQUEvQztBQUNBLGNBQU15SCxDQUFDLEdBQUcsS0FBS2tDLHNCQUFMLENBQTRCM0osSUFBNUIsRUFBa0N1RCxZQUFsQyxDQUFWOztBQUNBLFlBQUksQ0FBQ2tFLENBQUwsRUFBUTtBQUNKLGVBQUtwRyxHQUFMLENBQVNxRyxLQUFULENBQWUsV0FBZixFQUE0QjFILElBQTVCLEVBQWtDLENBQWxDLEVBQXFDLFNBQXJDLEVBQWdESCxPQUFPLENBQUM4SCxhQUF4RDtBQUNBLGlCQUFPLEVBQVA7QUFDSDs7QUFDRCxjQUFNZCxNQUFNLEdBQUcsTUFBTSxLQUFLSixXQUFMLENBQWlCZ0IsQ0FBQyxDQUFDbkIsSUFBbkIsRUFBeUJ0RyxJQUFJLENBQUN5RCxNQUE5QixDQUFyQjtBQUNBLGNBQU02RCxLQUFLLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxFQUFkO0FBQ0EsY0FBTUssTUFBTSxHQUFHLE1BQU0sS0FBSzlGLEtBQUwsQ0FBVzBGLENBQUMsQ0FBQ25CLElBQWIsRUFBbUJtQixDQUFDLENBQUNyRCxNQUFyQixFQUE2QnlDLE1BQTdCLEVBQXFDO0FBQ3REcEQsVUFBQUEsTUFBTSxFQUFFekQsSUFBSSxDQUFDeUQsTUFEeUM7QUFFdEQwSCxVQUFBQSxTQUFTLEVBQUVuTCxJQUFJLENBQUM0SztBQUZzQyxTQUFyQyxFQUdsQi9LLE9BQU8sQ0FBQ2tJLFVBSFUsQ0FBckI7QUFJQSxhQUFLMUcsR0FBTCxDQUFTcUcsS0FBVCxDQUNJLFdBREosRUFFSTFILElBRkosRUFHSSxDQUFDdUgsSUFBSSxDQUFDQyxHQUFMLEtBQWFGLEtBQWQsSUFBdUIsSUFIM0IsRUFJSVQsTUFBTSxHQUFHLE1BQUgsR0FBWSxNQUp0QixFQUk4QmhILE9BQU8sQ0FBQzhILGFBSnRDO0FBTUEsZUFBT0UsTUFBTSxDQUFDLENBQUQsQ0FBTixDQUFVcEQsR0FBVixDQUFlQyxDQUFELElBQU87QUFDeEIsY0FBSUEsQ0FBQyxLQUFLa0MsU0FBTixJQUFtQmxDLENBQUMsS0FBSyxJQUE3QixFQUFtQztBQUMvQixtQkFBT0EsQ0FBUDtBQUNIOztBQUNELGdCQUFNMEcsTUFBTSxHQUFHMUcsQ0FBQyxDQUFDMkcsTUFBRixJQUFZM0csQ0FBQyxDQUFDNEcsUUFBN0I7O0FBQ0EsY0FBSUYsTUFBSixFQUFZO0FBQ1Isa0JBQU1iLEdBQUcsR0FBSSxZQUFZN0YsQ0FBYixHQUFrQixDQUFsQixHQUFzQixDQUFsQzs7QUFDQSxnQkFBSSxPQUFPMEcsTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUM1QixxQkFBT0EsTUFBTSxDQUFDRyxRQUFQLEVBQVA7QUFDSDs7QUFDRCxnQkFBSSxPQUFPSCxNQUFQLEtBQWtCLFFBQXRCLEVBQWdDO0FBQzVCO0FBQ0EscUJBQU9JLE1BQU0sQ0FBRSxLQUFJSixNQUFNLENBQUNLLE1BQVAsQ0FBY2xCLEdBQWQsQ0FBbUIsRUFBekIsQ0FBTixDQUFrQ2dCLFFBQWxDLEVBQVA7QUFDSCxhQVJPLENBU1I7OztBQUNBLGdCQUFJRyxDQUFDLEdBQUdGLE1BQU0sQ0FBRSxLQUFJN0YsTUFBTSxDQUFDeUYsTUFBTSxDQUFDTSxDQUFSLENBQU4sQ0FBaUJILFFBQWpCLENBQTBCLEVBQTFCLENBQThCLFVBQXBDLENBQWQ7QUFDQSxnQkFBSUksQ0FBQyxHQUFHSCxNQUFNLENBQUNKLE1BQU0sQ0FBQ08sQ0FBUixDQUFkO0FBQ0EsbUJBQU8sQ0FBQ0QsQ0FBQyxHQUFHQyxDQUFMLEVBQVFKLFFBQVIsRUFBUDtBQUNILFdBYkQsTUFhTztBQUNILG1CQUFPN0csQ0FBQyxDQUFDNkcsUUFBRixFQUFQO0FBQ0g7QUFDSixTQXJCTSxDQUFQO0FBc0JILE9BekNELFNBeUNVO0FBQ04sYUFBS3ZKLGFBQUwsQ0FBbUJnRyxNQUFuQixDQUEwQlQsSUFBSSxDQUFDQyxHQUFMLEtBQWFGLEtBQXZDO0FBQ0EsYUFBS25GLGVBQUwsQ0FBcUI4RixTQUFyQjtBQUNIO0FBQ0osS0FqREksQ0FKTDtBQXNESCxHQTdmbUIsQ0ErZnBCOzs7QUFFQTJELEVBQUFBLFlBQVksR0FBdUI7QUFDL0IsV0FBTyxLQUFLekssRUFBTCxDQUFRMEssVUFBUixDQUFtQixLQUFLL0ssSUFBeEIsQ0FBUDtBQUNIOztBQUVELFFBQU1nTCxVQUFOLENBQ0lDLFVBREosRUFFSUMsU0FGSixFQUdnQjtBQUNaLFFBQUksQ0FBQ0QsVUFBTCxFQUFpQjtBQUNiLGFBQU9uRCxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsSUFBaEIsQ0FBUDtBQUNIOztBQUNELFVBQU1vRCxXQUFXLEdBQUdELFNBQVMsQ0FBQ0UsUUFBVixDQUFtQixLQUFuQixJQUNkO0FBQ0V6SSxNQUFBQSxNQUFNLEVBQUU7QUFBRSxTQUFDdUksU0FBUyxDQUFDRyxLQUFWLENBQWdCLENBQWhCLEVBQW1CLENBQUMsQ0FBcEIsQ0FBRCxHQUEwQjtBQUFFQyxVQUFBQSxHQUFHLEVBQUU7QUFBRUMsWUFBQUEsRUFBRSxFQUFFTjtBQUFOO0FBQVA7QUFBNUIsT0FEVjtBQUVFekYsTUFBQUEsSUFBSSxFQUFHLGNBQWEsS0FBS3hGLElBQUsscUJBQW9Ca0wsU0FBVSxhQUY5RDtBQUdFNUgsTUFBQUEsTUFBTSxFQUFFO0FBQUVrSSxRQUFBQSxDQUFDLEVBQUVQO0FBQUw7QUFIVixLQURjLEdBTWQ7QUFDRXRJLE1BQUFBLE1BQU0sRUFBRTtBQUFFOEksUUFBQUEsRUFBRSxFQUFFO0FBQUVGLFVBQUFBLEVBQUUsRUFBRU47QUFBTjtBQUFOLE9BRFY7QUFFRXpGLE1BQUFBLElBQUksRUFBRyxjQUFhLEtBQUt4RixJQUFLLGVBQWNrTCxTQUFVLG1CQUZ4RDtBQUdFNUgsTUFBQUEsTUFBTSxFQUFFO0FBQUVrSSxRQUFBQSxDQUFDLEVBQUVQO0FBQUw7QUFIVixLQU5OO0FBWUEsVUFBTTlDLElBQUksR0FBRyxNQUFNLEtBQUtuQixZQUFMLENBQWtCO0FBQ2pDckUsTUFBQUEsTUFBTSxFQUFFd0ksV0FBVyxDQUFDeEksTUFEYTtBQUVqQzZCLE1BQUFBLFNBQVMsRUFBRSxFQUZzQjtBQUdqQ0UsTUFBQUEsT0FBTyxFQUFFLEVBSHdCO0FBSWpDQyxNQUFBQSxLQUFLLEVBQUUsQ0FKMEI7QUFLakNDLE1BQUFBLE9BQU8sRUFBRSxLQUx3QjtBQU1qQ2EsTUFBQUEsV0FBVyxFQUFFLElBTm9CO0FBT2pDRCxNQUFBQSxJQUFJLEVBQUUyRixXQUFXLENBQUMzRixJQVBlO0FBUWpDbEMsTUFBQUEsTUFBTSxFQUFFNkgsV0FBVyxDQUFDN0gsTUFSYTtBQVNqQ2IsTUFBQUEsWUFBWSxFQUFFOUM7QUFUbUIsS0FBbEIsRUFVaEIsSUFWZ0IsRUFVVixJQVZVLEVBVUosSUFWSSxDQUFuQjtBQVdBLFdBQU93SSxJQUFJLENBQUMsQ0FBRCxDQUFYO0FBQ0g7O0FBRUQsUUFBTXVELFdBQU4sQ0FBa0JDLFdBQWxCLEVBQXlDVCxTQUF6QyxFQUE0RTtBQUN4RSxRQUFJLENBQUNTLFdBQUQsSUFBZ0JBLFdBQVcsQ0FBQ25JLE1BQVosS0FBdUIsQ0FBM0MsRUFBOEM7QUFDMUMsYUFBT3NFLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixFQUFoQixDQUFQO0FBQ0g7O0FBQ0QsV0FBT0QsT0FBTyxDQUFDSixHQUFSLENBQVlpRSxXQUFXLENBQUNoSSxHQUFaLENBQWdCaUksS0FBSyxJQUFJLEtBQUtaLFVBQUwsQ0FBZ0JZLEtBQWhCLEVBQXVCVixTQUF2QixDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRFcsRUFBQUEsZ0JBQWdCLENBQUNDLFlBQUQsRUFBb0M7QUFDaEQsVUFBTUMsT0FBTyxHQUFHLEVBQWhCLENBRGdELENBRWhEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLFdBQU9BLE9BQU8sQ0FBQ3ZJLE1BQWY7QUFDSDs7QUF2akJtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHR5cGUgeyBUT05DbGllbnQgfSBmcm9tIFwidG9uLWNsaWVudC1qcy90eXBlc1wiO1xuaW1wb3J0IHsgRG9jVXBzZXJ0SGFuZGxlciwgRG9jU3Vic2NyaXB0aW9uIH0gZnJvbSBcIi4vYXJhbmdvLWxpc3RlbmVyc1wiO1xuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBBdXRoIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQkxPQ0tDSEFJTl9EQiwgU1RBVFMgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCwgU2NhbGFyRmllbGQgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHsgcGFyc2VTZWxlY3Rpb25TZXQsIFFQYXJhbXMsIHJlc29sdmVCaWdVSW50LCBzZWxlY3Rpb25Ub1N0cmluZyB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHsgaXNGYXN0UXVlcnkgfSBmcm9tICcuL3Nsb3ctZGV0ZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tICcuL3RyYWNlcic7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5pbXBvcnQgeyBjcmVhdGVFcnJvciwgd3JhcCB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBzY2FsYXJGaWVsZHMgfSBmcm9tICcuL3Jlc29sdmVycy1nZW5lcmF0ZWQnO1xuaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRPTkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCBjb25zdCBBZ2dyZWdhdGlvbkZuID0ge1xuICAgIENPVU5UOiAnQ09VTlQnLFxuICAgIE1JTjogJ01JTicsXG4gICAgTUFYOiAnTUFYJyxcbiAgICBTVU06ICdTVU0nLFxuICAgIEFWRVJBR0U6ICdBVkVSQUdFJyxcbiAgICBTVERERVZfUE9QVUxBVElPTjogJ1NURERFVl9QT1BVTEFUSU9OJyxcbiAgICBTVERERVZfU0FNUExFOiAnU1REREVWX1NBTVBMRScsXG4gICAgVkFSSUFOQ0VfUE9QVUxBVElPTjogJ1ZBUklBTkNFX1BPUFVMQVRJT04nLFxuICAgIFZBUklBTkNFX1NBTVBMRTogJ1ZBUklBTkNFX1NBTVBMRScsXG59XG5cbnR5cGUgQWdncmVnYXRpb25GblR5cGUgPSAkS2V5czx0eXBlb2YgQWdncmVnYXRpb25Gbj47XG5cbmV4cG9ydCB0eXBlIEZpZWxkQWdncmVnYXRpb24gPSB7XG4gICAgZmllbGQ6IHN0cmluZyxcbiAgICBmbjogQWdncmVnYXRpb25GblR5cGUsXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICBhY2Nlc3NLZXk/OiBzdHJpbmcsXG59XG5cbmZ1bmN0aW9uIGNoZWNrVXNlZEFjY2Vzc0tleShcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4pOiA/c3RyaW5nIHtcbiAgICBpZiAoIWFjY2Vzc0tleSkge1xuICAgICAgICByZXR1cm4gdXNlZEFjY2Vzc0tleTtcbiAgICB9XG4gICAgaWYgKHVzZWRBY2Nlc3NLZXkgJiYgYWNjZXNzS2V5ICE9PSB1c2VkQWNjZXNzS2V5KSB7XG4gICAgICAgIGNvbnRleHQubXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aHJvdyBjcmVhdGVFcnJvcihcbiAgICAgICAgICAgIDQwMCxcbiAgICAgICAgICAgICdSZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGFjY2VzcyBrZXkgZm9yIGFsbCBxdWVyaWVzIGFuZCBtdXRhdGlvbnMnLFxuICAgICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGF1dGg6IEF1dGg7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgd2FpdEZvckNvdW50OiBudW1iZXI7XG4gICAgc3Vic2NyaXB0aW9uQ291bnQ6IG51bWJlcjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuICAgIGRvY0luc2VydE9yVXBkYXRlOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgYXV0aDogQXV0aCxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcbiAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gMDtcblxuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy53YWl0Rm9yLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZENvbmRpdGlvblFMKFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcHJpbWFyeUNvbmRpdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyB0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSAnZmFsc2UnIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09ICdmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAocHJpbWFyeUNvbmRpdGlvbiAmJiBhZGRpdGlvbmFsQ29uZGl0aW9uKVxuICAgICAgICAgICAgPyBgKCR7cHJpbWFyeUNvbmRpdGlvbn0pIEFORCAoJHthZGRpdGlvbmFsQ29uZGl0aW9ufSlgXG4gICAgICAgICAgICA6IChwcmltYXJ5Q29uZGl0aW9uIHx8IGFkZGl0aW9uYWxDb25kaXRpb24pO1xuXG4gICAgfVxuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgICAgIG9wZXJhdGlvbklkPzogc3RyaW5nLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRDb25kaXRpb25RTChmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG5cbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdXG4gICAgKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nU3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQodGV4dCk7XG4gICAgICAgIGlmIChleGlzdGluZ1N0YXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nU3RhdC5pc0Zhc3Q7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29sbGVjdGlvbkluZm8gPSBCTE9DS0NIQUlOX0RCLmNvbGxlY3Rpb25zW3RoaXMubmFtZV07XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KGNvbGxlY3Rpb25JbmZvLCB0aGlzLmRvY1R5cGUsIGZpbHRlciwgb3JkZXJCeSB8fCBbXSwgY29uc29sZSksXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQodGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgcS5maWx0ZXIsIHEub3JkZXJCeSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnUVVFUlknLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZSh0ZXh0LCBwYXJhbXMsIGlzRmFzdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UodGV4dDogc3RyaW5nLCBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LCBpc0Zhc3Q6IGJvb2xlYW4pOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IGlzRmFzdCA/IHRoaXMuZGIgOiB0aGlzLnNsb3dEYjtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkodGV4dCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihcbiAgICAgICAgcTogRGF0YWJhc2VRdWVyeSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3QgY29sOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICBjb25zdCByZXQ6IHN0cmluZ1tdID0gW107XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQ291bnQoaTogbnVtYmVyKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSBDT1VOVChkb2MpYCk7XG4gICAgICAgICAgICByZXQucHVzaChgdiR7aX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZU51bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB2JHtpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQmlnTnVtYmVyKGk6IG51bWJlciwgZjogU2NhbGFyRmllbGQsIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSkge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gJHtmbn0oJHtmLnBhdGh9KWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHsgJHtmLnR5cGV9OiB2JHtpfSB9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyhpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IGYudHlwZSA9PT0gJ3VpbnQ2NCcgPyAxIDogMjtcbiAgICAgICAgICAgIGNvbnN0IGhIZXggPSBgU1VCU1RSSU5HKCR7Zi5wYXRofSwgJHtsZW59LCBMRU5HVEgoJHtmLnBhdGh9KSAtICR7bGVufSAtIDgpYDtcbiAgICAgICAgICAgIGNvbnN0IGxIZXggPSBgUklHSFQoU1VCU1RSSU5HKCR7Zi5wYXRofSwgJHtsZW59KSwgOClgO1xuICAgICAgICAgICAgY29sLnB1c2goYGgke2l9ID0gJHtmbn0oVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsICR7aEhleH0pKSlgKTtcbiAgICAgICAgICAgIGNvbC5wdXNoKGBsJHtpfSA9ICR7Zm59KFRPX05VTUJFUihDT05DQVQoXCIweFwiLCAke2xIZXh9KSkpYCk7XG4gICAgICAgICAgICByZXQucHVzaChgeyAke2YudHlwZX06IHsgaDogaCR7aX0sIGw6IGwke2l9IH0gfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlTm9uTnVtYmVyKGk6IG51bWJlciwgZjogU2NhbGFyRmllbGQsIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSkge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gJHtmbn0oJHtmLnBhdGh9KWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHYke2l9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGV4dDtcbiAgICAgICAgY29uc3QgaXNTaW5nbGVDb3VudCA9IChhcmdzLmZpZWxkcy5sZW5ndGggPT09IDEpXG4gICAgICAgICAgICAmJiAoYXJncy5maWVsZHNbMF0uZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpO1xuICAgICAgICBpZiAoaXNTaW5nbGVDb3VudCkge1xuICAgICAgICAgICAgdGV4dCA9IGBcbiAgICAgICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICAgICBDT0xMRUNUIFdJVEggQ09VTlQgSU5UTyB2MFxuICAgICAgICAgICAgICAgIFJFVFVSTiBbdjBdYDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyZ3MuZmllbGRzLmZvckVhY2goKGFnZ3JlZ2F0aW9uOiBGaWVsZEFnZ3JlZ2F0aW9uLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmbiA9IGFnZ3JlZ2F0aW9uLmZuIHx8IEFnZ3JlZ2F0aW9uRm4uQ09VTlQ7XG4gICAgICAgICAgICAgICAgaWYgKGZuID09PSBBZ2dyZWdhdGlvbkZuLkNPVU5UKSB7XG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUNvdW50KGkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGY6ICh0eXBlb2YgdW5kZWZpbmVkIHwgU2NhbGFyRmllbGQpID0gc2NhbGFyRmllbGRzLmdldChgJHt0aGlzLm5hbWV9LiR7YWdncmVnYXRpb24uZmllbGQgfHwgJ2lkJ31gKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaW52YWxpZFR5cGUgPSAoKSA9PiBuZXcgRXJyb3IoYFske2FnZ3JlZ2F0aW9uLmZpZWxkfV0gY2FuJ3QgYmUgdXNlZCB3aXRoIFske2ZufV1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoZi50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVOdW1iZXIoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VpbnQ2NCc6XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3VpbnQxMDI0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlQmlnTnVtYmVyKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlQmlnTnVtYmVyUGFydHMoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZU5vbk51bWJlcihpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGludmFsaWRUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGV4dCA9IGBcbiAgICAgICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURSAke2NvbC5qb2luKCcsICcpfVxuICAgICAgICAgICAgICAgIFJFVFVSTiBbJHtyZXQuam9pbignLCAnKX1dYDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhZ2dyZWdhdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBBZ2dyZWdhdGlvbkFyZ3MsXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgJ0FHR1JFR0FURScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoYXJncywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0FHR1JFR0FURScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHEudGV4dCwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IGFyZ3MuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGU6IGFyZ3MuZmllbGRzLFxuICAgICAgICAgICAgICAgIH0sIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdBR0dSRUdBVEUnLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/ICdGQVNUJyA6ICdTTE9XJywgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFswXS5tYXAoKHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHggPT09IHVuZGVmaW5lZCB8fCB4ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBiaWdJbnQgPSB4LnVpbnQ2NCB8fCB4LnVpbnQxMDI0O1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmlnSW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSAoJ3VpbnQ2NCcgaW4geCkgPyAxIDogMjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYmlnSW50ID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBiaWdJbnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYmlnSW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBCaWdJbnQoYDB4JHtiaWdJbnQuc3Vic3RyKGxlbil9YCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGggPSBCaWdJbnQoYDB4JHtOdW1iZXIoYmlnSW50LmgpLnRvU3RyaW5nKDE2KX0wMDAwMDAwMGApO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGwgPSBCaWdJbnQoYmlnSW50LmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChoICsgbCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcbiAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICB0aW1lb3V0OiA0MDAwMCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICB9LCB0cnVlLCBudWxsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoZmllbGRWYWx1ZXM6IHN0cmluZ1tdLCBmaWVsZFBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=