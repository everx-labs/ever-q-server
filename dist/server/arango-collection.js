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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0IiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0IiwiY29uc29sZSIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiY29sIiwicmV0IiwiYWdncmVnYXRlQ291bnQiLCJpIiwicHVzaCIsImFnZ3JlZ2F0ZU51bWJlciIsImYiLCJmbiIsImFnZ3JlZ2F0ZUJpZ051bWJlciIsInR5cGUiLCJhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyIsImxlbiIsImhIZXgiLCJsSGV4IiwiYWdncmVnYXRlTm9uTnVtYmVyIiwiaXNTaW5nbGVDb3VudCIsImZpZWxkcyIsImZvckVhY2giLCJhZ2dyZWdhdGlvbiIsInNjYWxhckZpZWxkcyIsImludmFsaWRUeXBlIiwiRXJyb3IiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiYWdncmVnYXRlIiwiYmlnSW50IiwidWludDY0IiwidWludDEwMjQiLCJ0b1N0cmluZyIsIkJpZ0ludCIsInN1YnN0ciIsImgiLCJsIiwiZGJDb2xsZWN0aW9uIiwiY29sbGVjdGlvbiIsIndhaXRGb3JEb2MiLCJmaWVsZFZhbHVlIiwiZmllbGRQYXRoIiwicXVlcnlQYXJhbXMiLCJlbmRzV2l0aCIsInNsaWNlIiwiYW55IiwiZXEiLCJ2IiwiaWQiLCJ3YWl0Rm9yRG9jcyIsImZpZWxkVmFsdWVzIiwidmFsdWUiLCJmaW5pc2hPcGVyYXRpb25zIiwib3BlcmF0aW9uSWRzIiwidG9DbG9zZSJdLCJtYXBwaW5n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SWhNLElBSEosRUFJa0I7QUFDZCxRQUFJLENBQUN5TSxXQUFELElBQWdCQSxXQUFXLENBQUNuSSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU9zRSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9ELE9BQU8sQ0FBQ0osR0FBUixDQUFZaUUsV0FBVyxDQUFDaEksR0FBWixDQUFnQmlJLEtBQUssSUFBSSxLQUFLWixVQUFMLENBQWdCWSxLQUFoQixFQUF1QlYsU0FBdkIsRUFBa0NoTSxJQUFsQyxDQUF6QixDQUFaLENBQVA7QUFDSDs7QUFFRDJNLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUN2SSxNQUFmO0FBQ0g7O0FBbGtCbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSBcInRvbi1jbGllbnQtanMvdHlwZXNcIjtcbmltcG9ydCB7IERvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2FyYW5nby1saXN0ZW5lcnNcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQsIFNjYWxhckZpZWxkIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB7IHBhcnNlU2VsZWN0aW9uU2V0LCBRUGFyYW1zLCByZXNvbHZlQmlnVUludCwgc2VsZWN0aW9uVG9TdHJpbmcgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgc2NhbGFyRmllbGRzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUT05DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgY29uc3QgQWdncmVnYXRpb25GbiA9IHtcbiAgICBDT1VOVDogJ0NPVU5UJyxcbiAgICBNSU46ICdNSU4nLFxuICAgIE1BWDogJ01BWCcsXG4gICAgU1VNOiAnU1VNJyxcbiAgICBBVkVSQUdFOiAnQVZFUkFHRScsXG4gICAgU1REREVWX1BPUFVMQVRJT046ICdTVERERVZfUE9QVUxBVElPTicsXG4gICAgU1REREVWX1NBTVBMRTogJ1NURERFVl9TQU1QTEUnLFxuICAgIFZBUklBTkNFX1BPUFVMQVRJT046ICdWQVJJQU5DRV9QT1BVTEFUSU9OJyxcbiAgICBWQVJJQU5DRV9TQU1QTEU6ICdWQVJJQU5DRV9TQU1QTEUnLFxufVxuXG50eXBlIEFnZ3JlZ2F0aW9uRm5UeXBlID0gJEtleXM8dHlwZW9mIEFnZ3JlZ2F0aW9uRm4+O1xuXG5leHBvcnQgdHlwZSBGaWVsZEFnZ3JlZ2F0aW9uID0ge1xuICAgIGZpZWxkOiBzdHJpbmcsXG4gICAgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlLFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICA0MDAsXG4gICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGF1dGg6IEF1dGgsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBzdGF0czogSVN0YXRzLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgRG9jU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRDb25kaXRpb25RTChcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXVxuICAgICk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHRleHQpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25JbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeShjb2xsZWN0aW9uSW5mbywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHRleHQsIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UodGV4dCwgcGFyYW1zLCBpc0Zhc3QpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHRleHQ6IHN0cmluZywgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSwgaXNGYXN0OiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBpc0Zhc3QgPyB0aGlzLmRiIDogdGhpcy5zbG93RGI7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHRleHQsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IERvY1Vwc2VydEhhbmRsZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIH0ge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZENvbmRpdGlvblFMKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IGNvbDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgcmV0OiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUNvdW50KGk6IG51bWJlcikge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gQ09VTlQoZG9jKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHYke2l9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVOdW1iZXIoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSAke2ZufSgke2YucGF0aH0pYCk7XG4gICAgICAgICAgICByZXQucHVzaChgdiR7aX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUJpZ051bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB7ICR7Zi50eXBlfTogdiR7aX0gfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQmlnTnVtYmVyUGFydHMoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBmLnR5cGUgPT09ICd1aW50NjQnID8gMSA6IDI7XG4gICAgICAgICAgICBjb25zdCBoSGV4ID0gYFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSwgTEVOR1RIKCR7Zi5wYXRofSkgLSAke2xlbn0gLSA4KWA7XG4gICAgICAgICAgICBjb25zdCBsSGV4ID0gYFJJR0hUKFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSksIDgpYDtcbiAgICAgICAgICAgIGNvbC5wdXNoKGBoJHtpfSA9ICR7Zm59KFRPX05VTUJFUihDT05DQVQoXCIweFwiLCAke2hIZXh9KSkpYCk7XG4gICAgICAgICAgICBjb2wucHVzaChgbCR7aX0gPSAke2ZufShUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgJHtsSGV4fSkpKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHsgJHtmLnR5cGV9OiB7IGg6IGgke2l9LCBsOiBsJHtpfSB9IH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZU5vbk51bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB2JHtpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRleHQ7XG4gICAgICAgIGNvbnN0IGlzU2luZ2xlQ291bnQgPSAoYXJncy5maWVsZHMubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgJiYgKGFyZ3MuZmllbGRzWzBdLmZuID09PSBBZ2dyZWdhdGlvbkZuLkNPVU5UKTtcbiAgICAgICAgaWYgKGlzU2luZ2xlQ291bnQpIHtcbiAgICAgICAgICAgIHRleHQgPSBgXG4gICAgICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAgICAgQ09MTEVDVCBXSVRIIENPVU5UIElOVE8gdjBcbiAgICAgICAgICAgICAgICBSRVRVUk4gW3YwXWA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcmdzLmZpZWxkcy5mb3JFYWNoKChhZ2dyZWdhdGlvbjogRmllbGRBZ2dyZWdhdGlvbiwgaTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm4gPSBhZ2dyZWdhdGlvbi5mbiB8fCBBZ2dyZWdhdGlvbkZuLkNPVU5UO1xuICAgICAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVDb3VudChpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmOiAodHlwZW9mIHVuZGVmaW5lZCB8IFNjYWxhckZpZWxkKSA9IHNjYWxhckZpZWxkcy5nZXQoYCR7dGhpcy5uYW1lfS4ke2FnZ3JlZ2F0aW9uLmZpZWxkIHx8ICdpZCd9YCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGludmFsaWRUeXBlID0gKCkgPT4gbmV3IEVycm9yKGBbJHthZ2dyZWdhdGlvbi5maWVsZH1dIGNhbid0IGJlIHVzZWQgd2l0aCBbJHtmbn1dYCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgaW52YWxpZFR5cGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGYudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlTnVtYmVyKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd1aW50NjQnOlxuICAgICAgICAgICAgICAgICAgICBjYXNlICd1aW50MTAyNCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUJpZ051bWJlcihpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUJpZ051bWJlclBhcnRzKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBBZ2dyZWdhdGlvbkZuLk1JTiB8fCBmbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVOb25OdW1iZXIoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHQgPSBgXG4gICAgICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAgICAgQ09MTEVDVCBBR0dSRUdBVEUgJHtjb2wuam9pbignLCAnKX1cbiAgICAgICAgICAgICAgICBSRVRVUk4gWyR7cmV0LmpvaW4oJywgJyl9XWA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGFyZ3MsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIGFyZ3MuZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRbMF0ubWFwKCh4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID09PSB1bmRlZmluZWQgfHwgeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmlnSW50ID0geC51aW50NjQgfHwgeC51aW50MTAyNDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJpZ0ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVuID0gKCd1aW50NjQnIGluIHgpID8gMSA6IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGJpZ0ludCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmlnSW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGJpZ0ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRGbG93Rml4TWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQmlnSW50KGAweCR7YmlnSW50LnN1YnN0cihsZW4pfWApLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyRGbG93Rml4TWVcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoID0gQmlnSW50KGAweCR7TnVtYmVyKGJpZ0ludC5oKS50b1N0cmluZygxNil9MDAwMDAwMDBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsID0gQmlnSW50KGJpZ0ludC5sKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoaCArIGwpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKCdbKl0nKVxuICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IFtmaWVsZFBhdGguc2xpY2UoMCwgLTMpXTogeyBhbnk6IHsgZXE6IGZpZWxkVmFsdWUgfSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBAdiBJTiBkb2MuJHtmaWVsZFBhdGh9IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgaWQ6IHsgZXE6IGZpZWxkVmFsdWUgfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgZG9jLiR7ZmllbGRQYXRofSA9PSBAdiBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gKGFyZ3MudGltZW91dCA9PT0gMCkgPyAwIDogKGFyZ3MudGltZW91dCB8fCA0MDAwMCk7XG4gICAgICAgIGlmICh0aW1lb3V0ID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeURhdGFiYXNlKHF1ZXJ5UGFyYW1zLnRleHQsIHF1ZXJ5UGFyYW1zLnBhcmFtcywgdHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICB9LCB0cnVlLCBudWxsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgsIGFyZ3MpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=