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
          if (x === undefined || x === null) {
            return x;
          }

          const bigInt = x.uint64 || x.uint1024;

          if (bigInt) {
            const len = 'uint64' in x ? 1 : 2;

            if (typeof bigInt === 'string') {
              //$FlowFixMe
              return BigInt(`0x${bigInt.substr(len)}`).toString();
            } else {
              //$FlowFixMe
              let h = BigInt(`0x${Number(bigInt.h).toString(16)}00000000`);
              let l = BigInt(bigInt.l);
              return (h + l).toString();
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0IiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0IiwiY29uc29sZSIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiY29sIiwicmV0IiwiYWdncmVnYXRlQ291bnQiLCJpIiwicHVzaCIsImFnZ3JlZ2F0ZU51bWJlciIsImYiLCJmbiIsImFnZ3JlZ2F0ZUJpZ051bWJlciIsInR5cGUiLCJhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyIsImxlbiIsImhIZXgiLCJsSGV4IiwiYWdncmVnYXRlTm9uTnVtYmVyIiwiZmllbGRzIiwiZm9yRWFjaCIsImFnZ3JlZ2F0aW9uIiwic2NhbGFyRmllbGRzIiwiaW52YWxpZFR5cGUiLCJFcnJvciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJhZ2dyZWdhdGUiLCJiaWdJbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsIkJpZ0ludCIsInN1YnN0ciIsInRvU3RyaW5nIiwiaCIsImwiLCJkYkNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFr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QSxXQUFXLEVBQUUsSUFOb0I7QUFPakNELE1BQUFBLElBQUksRUFBRTBGLFdBQVcsQ0FBQzFGLElBUGU7QUFRakNsQyxNQUFBQSxNQUFNLEVBQUU0SCxXQUFXLENBQUM1SCxNQVJhO0FBU2pDYixNQUFBQSxZQUFZLEVBQUU5QztBQVRtQixLQUFsQixFQVVoQixJQVZnQixFQVVWLElBVlUsRUFVSixJQVZJLENBQW5CO0FBV0EsV0FBT3dJLElBQUksQ0FBQyxDQUFELENBQVg7QUFDSDs7QUFFRCxRQUFNc0QsV0FBTixDQUFrQkMsV0FBbEIsRUFBeUNULFNBQXpDLEVBQTRFO0FBQ3hFLFFBQUksQ0FBQ1MsV0FBRCxJQUFnQkEsV0FBVyxDQUFDbEksTUFBWixLQUF1QixDQUEzQyxFQUE4QztBQUMxQyxhQUFPc0UsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLENBQVA7QUFDSDs7QUFDRCxXQUFPRCxPQUFPLENBQUNKLEdBQVIsQ0FBWWdFLFdBQVcsQ0FBQy9ILEdBQVosQ0FBZ0JnSSxLQUFLLElBQUksS0FBS1osVUFBTCxDQUFnQlksS0FBaEIsRUFBdUJWLFNBQXZCLENBQXpCLENBQVosQ0FBUDtBQUNIOztBQUVEVyxFQUFBQSxnQkFBZ0IsQ0FBQ0MsWUFBRCxFQUFvQztBQUNoRCxVQUFNQyxPQUFPLEdBQUcsRUFBaEIsQ0FEZ0QsQ0FFaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsV0FBT0EsT0FBTyxDQUFDdEksTUFBZjtBQUNIOztBQTFpQm1CIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFRPTkNsaWVudCB9IGZyb20gXCJ0b24tY2xpZW50LWpzL3R5cGVzXCI7XG5pbXBvcnQgeyBEb2NVcHNlcnRIYW5kbGVyLCBEb2NTdWJzY3JpcHRpb24gfSBmcm9tIFwiLi9hcmFuZ28tbGlzdGVuZXJzXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEF1dGggfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgeyBCTE9DS0NIQUlOX0RCLCBTVEFUUyB9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBPcmRlckJ5LCBRVHlwZSwgUXVlcnlTdGF0LCBTY2FsYXJGaWVsZCB9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQgeyBwYXJzZVNlbGVjdGlvblNldCwgUVBhcmFtcywgcmVzb2x2ZUJpZ1VJbnQsIHNlbGVjdGlvblRvU3RyaW5nIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgeyBpc0Zhc3RRdWVyeSB9IGZyb20gJy4vc2xvdy1kZXRlY3Rvcic7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gJy4vdHJhY2VyJztcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tIFwiLi90cmFjZXJcIjtcbmltcG9ydCB7IGNyZWF0ZUVycm9yLCB3cmFwIH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCB7IHNjYWxhckZpZWxkcyB9IGZyb20gJy4vcmVzb2x2ZXJzLWdlbmVyYXRlZCc7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gJ2V2ZW50cyc7XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuICAgIGNsaWVudDogVE9OQ2xpZW50LFxuXG4gICAgcmVtb3RlQWRkcmVzcz86IHN0cmluZyxcbiAgICBhY2Nlc3NLZXk6IHN0cmluZyxcbiAgICB1c2VkQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIHVzZWRNYW1BY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgbXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQ/OiBib29sZWFuLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxuZXhwb3J0IGNvbnN0IEFnZ3JlZ2F0aW9uRm4gPSB7XG4gICAgQ09VTlQ6ICdDT1VOVCcsXG4gICAgTUlOOiAnTUlOJyxcbiAgICBNQVg6ICdNQVgnLFxuICAgIFNVTTogJ1NVTScsXG4gICAgQVZFUkFHRTogJ0FWRVJBR0UnLFxuICAgIFNURERFVl9QT1BVTEFUSU9OOiAnU1REREVWX1BPUFVMQVRJT04nLFxuICAgIFNURERFVl9TQU1QTEU6ICdTVERERVZfU0FNUExFJyxcbiAgICBWQVJJQU5DRV9QT1BVTEFUSU9OOiAnVkFSSUFOQ0VfUE9QVUxBVElPTicsXG4gICAgVkFSSUFOQ0VfU0FNUExFOiAnVkFSSUFOQ0VfU0FNUExFJyxcbn1cblxudHlwZSBBZ2dyZWdhdGlvbkZuVHlwZSA9ICRLZXlzPHR5cGVvZiBBZ2dyZWdhdGlvbkZuPjtcblxuZXhwb3J0IHR5cGUgRmllbGRBZ2dyZWdhdGlvbiA9IHtcbiAgICBmaWVsZDogc3RyaW5nLFxuICAgIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSxcbn1cblxuZXhwb3J0IHR5cGUgQWdncmVnYXRpb25BcmdzID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgIGFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gY2hlY2tVc2VkQWNjZXNzS2V5KFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbik6ID9zdHJpbmcge1xuICAgIGlmICghYWNjZXNzS2V5KSB7XG4gICAgICAgIHJldHVybiB1c2VkQWNjZXNzS2V5O1xuICAgIH1cbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcbiAgICAgICAgY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgIHRocm93IGNyZWF0ZUVycm9yKFxuICAgICAgICAgICAgNDAwLFxuICAgICAgICAgICAgJ1JlcXVlc3QgbXVzdCB1c2UgdGhlIHNhbWUgYWNjZXNzIGtleSBmb3IgYWxsIHF1ZXJpZXMgYW5kIG11dGF0aW9ucycsXG4gICAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NLZXk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSk6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5QWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRXYWl0Rm9yQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb25BY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHNsb3dEYjogRGF0YWJhc2U7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZG9jVHlwZTogUVR5cGUsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBhdXRoOiBBdXRoLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgc3RhdHM6IElTdGF0cyxcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IGF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgIHRoaXMuc2xvd0RiID0gc2xvd0RiO1xuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIHRoaXMuc3RhdERvYyA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLmRvYy5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUgPSBuZXcgU3RhdHNUaW1pbmcoc3RhdHMsIFNUQVRTLnF1ZXJ5LnRpbWUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKHN0YXRzLCBTVEFUUy5xdWVyeS5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLndhaXRGb3IuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0U3Vic2NyaXB0aW9uQWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnN1YnNjcmlwdGlvbi5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuXG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KCdkb2MnLCBkb2MpO1xuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gbmV3IERvY1N1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5wdXNoRG9jdW1lbnQoZG9jKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ub25DbG9zZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsIHBhcmFtczogUVBhcmFtcykge1xuICAgICAgICBjb25zdCBhY2NvdW50cyA9IGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHM7XG4gICAgICAgIGlmIChhY2NvdW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oJywnKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuX2tleSAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICd0cmFuc2FjdGlvbnMnOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ21lc3NhZ2VzJzpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGJ1aWxkQ29uZGl0aW9uUUwoXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZENvbmRpdGlvblFMKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHNlbGVjdGlvbkluZm8uc2VsZWN0aW9uc1xuICAgICAgICAgICAgPyBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpXG4gICAgICAgICAgICA6IHNlbGVjdGlvbkluZm87XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICBjb25zdCBvcmRlckJ5VGV4dCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVRleHR9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFRleHQgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFRleHR9YDtcblxuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W11cbiAgICApOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmdTdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldCh0ZXh0KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nU3RhdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3RpbmdTdGF0LmlzRmFzdDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2xsZWN0aW9uSW5mbyA9IEJMT0NLQ0hBSU5fREIuY29sbGVjdGlvbnNbdGhpcy5uYW1lXTtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGlzRmFzdDogaXNGYXN0UXVlcnkoY29sbGVjdGlvbkluZm8sIHRoaXMuZG9jVHlwZSwgZmlsdGVyLCBvcmRlckJ5IHx8IFtdLCBjb25zb2xlKSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldCh0ZXh0LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQuaXNGYXN0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBxLmZpbHRlciwgcS5vcmRlckJ5KTtcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCwgdHJhY2VQYXJhbXMsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURhdGFiYXNlKHRleHQsIHBhcmFtcywgaXNGYXN0KTtcbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlEYXRhYmFzZSh0ZXh0OiBzdHJpbmcsIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sIGlzRmFzdDogYm9vbGVhbik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGRiID0gaXNGYXN0ID8gdGhpcy5kYiA6IHRoaXMuc2xvd0RiO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeSh0ZXh0LCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogPygoZG9jOiBhbnkpID0+IHZvaWQpID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlEYXRhYmFzZShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QpLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAncXVlcnknO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhGaWx0ZXIgPSBEb2NVcHNlcnRIYW5kbGVyLmdldEF1dGhGaWx0ZXIodGhpcy5uYW1lLCBxLmFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0aEZpbHRlciAmJiAhYXV0aEZpbHRlcihkb2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgcS5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAnbGlzdGVuZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQWdncmVnYXRlc1xuXG5cbiAgICBjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICBhcmdzOiBBZ2dyZWdhdGlvbkFyZ3MsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID97XG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICB9IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRDb25kaXRpb25RTChmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6ICcnO1xuICAgICAgICBjb25zdCBjb2w6IHN0cmluZ1tdID0gW107XG4gICAgICAgIGNvbnN0IHJldDogc3RyaW5nW10gPSBbXTtcblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVDb3VudChpOiBudW1iZXIpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9IENPVU5UKGRvYylgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB2JHtpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlTnVtYmVyKGk6IG51bWJlciwgZjogU2NhbGFyRmllbGQsIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSkge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gJHtmbn0oJHtmLnBhdGh9KWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHYke2l9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVCaWdOdW1iZXIoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSAke2ZufSgke2YucGF0aH0pYCk7XG4gICAgICAgICAgICByZXQucHVzaChgeyAke2YudHlwZX06IHYke2l9IH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUJpZ051bWJlclBhcnRzKGk6IG51bWJlciwgZjogU2NhbGFyRmllbGQsIGZuOiBBZ2dyZWdhdGlvbkZuVHlwZSkge1xuICAgICAgICAgICAgY29uc3QgbGVuID0gZi50eXBlID09PSAndWludDY0JyA/IDEgOiAyO1xuICAgICAgICAgICAgY29uc3QgaEhleCA9IGBTVUJTVFJJTkcoJHtmLnBhdGh9LCAke2xlbn0sIExFTkdUSCgke2YucGF0aH0pIC0gJHtsZW59IC0gOClgO1xuICAgICAgICAgICAgY29uc3QgbEhleCA9IGBSSUdIVChTVUJTVFJJTkcoJHtmLnBhdGh9LCAke2xlbn0pLCA4KWA7XG4gICAgICAgICAgICBjb2wucHVzaChgaCR7aX0gPSAke2ZufShUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgJHtoSGV4fSkpKWApO1xuICAgICAgICAgICAgY29sLnB1c2goYGwke2l9ID0gJHtmbn0oVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsICR7bEhleH0pKSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB7ICR7Zi50eXBlfTogeyBoOiBoJHtpfSwgbDogbCR7aX0gfSB9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVOb25OdW1iZXIoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSAke2ZufSgke2YucGF0aH0pYCk7XG4gICAgICAgICAgICByZXQucHVzaChgdiR7aX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ3MuZmllbGRzLmZvckVhY2goKGFnZ3JlZ2F0aW9uOiBGaWVsZEFnZ3JlZ2F0aW9uLCBpOiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZuID0gYWdncmVnYXRpb24uZm4gfHwgQWdncmVnYXRpb25Gbi5DT1VOVDtcbiAgICAgICAgICAgIGlmIChmbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUNvdW50KGkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmOiAodHlwZW9mIHVuZGVmaW5lZCB8IFNjYWxhckZpZWxkKSA9IHNjYWxhckZpZWxkcy5nZXQoYCR7dGhpcy5uYW1lfS4ke2FnZ3JlZ2F0aW9uLmZpZWxkIHx8ICdpZCd9YCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW52YWxpZFR5cGUgPSAoKSA9PiBuZXcgRXJyb3IoYFske2FnZ3JlZ2F0aW9uLmZpZWxkfV0gY2FuJ3QgYmUgdXNlZCB3aXRoIFske2ZufV1gKTtcbiAgICAgICAgICAgICAgICBpZiAoIWYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgaW52YWxpZFR5cGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3dpdGNoIChmLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVOdW1iZXIoaSwgZiwgZm4pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd1aW50NjQnOlxuICAgICAgICAgICAgICAgIGNhc2UgJ3VpbnQxMDI0JzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBBZ2dyZWdhdGlvbkZuLk1JTiB8fCBmbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUJpZ051bWJlcihpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyhpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZuID09PSBBZ2dyZWdhdGlvbkZuLk1JTiB8fCBmbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZU5vbk51bWJlcihpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgQ09MTEVDVCBBR0dSRUdBVEUgJHtjb2wuam9pbignLCAnKX1cbiAgICAgICAgICAgIFJFVFVSTiBbJHtyZXQuam9pbignLCAnKX1dYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdBR0dSRUdBVEUnLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGFyZ3MsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdBR0dSRUdBVEUnLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIGFyZ3MuZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeShxLnRleHQsIHEucGFyYW1zLCBpc0Zhc3QsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBhcmdzLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlOiBhcmdzLmZpZWxkcyxcbiAgICAgICAgICAgICAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICAnQUdHUkVHQVRFJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHRbMF0ubWFwKCh4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh4ID09PSB1bmRlZmluZWQgfHwgeCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYmlnSW50ID0geC51aW50NjQgfHwgeC51aW50MTAyNDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJpZ0ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgbGVuID0gKCd1aW50NjQnIGluIHgpID8gMSA6IDI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGJpZ0ludCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRGbG93Rml4TWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQmlnSW50KGAweCR7YmlnSW50LnN1YnN0cihsZW4pfWApLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBoID0gQmlnSW50KGAweCR7TnVtYmVyKGJpZ0ludC5oKS50b1N0cmluZygxNil9MDAwMDAwMDBgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbCA9IEJpZ0ludChiaWdJbnQubCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChoICsgbCkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4LnRvU3RyaW5nKClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jKFxuICAgICAgICBmaWVsZFZhbHVlOiBhbnksXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGZpZWxkUGF0aC5lbmRzV2l0aCgnWypdJylcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHtcbiAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgIG9yZGVyQnk6IFtdLFxuICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICB0aW1lb3V0OiA0MDAwMCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgdGV4dDogcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICB9LCB0cnVlLCBudWxsLCBudWxsKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoZmllbGRWYWx1ZXM6IHN0cmluZ1tdLCBmaWVsZFBhdGg6IHN0cmluZyk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKHZhbHVlLCBmaWVsZFBhdGgpKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG4iXX0=