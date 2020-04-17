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
    console.log('>>>', text);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJBZ2dyZWdhdGlvbkZuIiwiQ09VTlQiLCJNSU4iLCJNQVgiLCJTVU0iLCJBVkVSQUdFIiwiU1REREVWX1BPUFVMQVRJT04iLCJTVERERVZfU0FNUExFIiwiVkFSSUFOQ0VfUE9QVUxBVElPTiIsIlZBUklBTkNFX1NBTVBMRSIsImNoZWNrVXNlZEFjY2Vzc0tleSIsInVzZWRBY2Nlc3NLZXkiLCJhY2Nlc3NLZXkiLCJjb250ZXh0IiwibXVsdGlwbGVBY2Nlc3NLZXlzRGV0ZWN0ZWQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImFyZ3MiLCJhdXRoIiwibWFtQWNjZXNzUmVxdWlyZWQiLCJ1c2VkTWFtQWNjZXNzS2V5IiwiY29uZmlnIiwibWFtQWNjZXNzS2V5cyIsImhhcyIsIkF1dGgiLCJ1bmF1dGhvcml6ZWRFcnJvciIsImFjY2Vzc0dyYW50ZWQiLCJncmFudGVkIiwicmVzdHJpY3RUb0FjY291bnRzIiwiQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwidHJhY2VyIiwic3RhdHMiLCJkYiIsInNsb3dEYiIsImxvZyIsImNyZWF0ZSIsIndhaXRGb3JDb3VudCIsInN1YnNjcmlwdGlvbkNvdW50Iiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFdhaXRGb3JBY3RpdmUiLCJ3YWl0Rm9yIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsInN1YnNjcmlwdGlvbiIsImRvY0luc2VydE9yVXBkYXRlIiwiRXZlbnRFbWl0dGVyIiwic2V0TWF4TGlzdGVuZXJzIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImluY3JlbWVudCIsImVtaXQiLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsInN1YnNjcmliZSIsIl8iLCJpbmZvIiwiYWNjZXNzUmlnaHRzIiwiRG9jU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsIm9uIiwib25DbG9zZSIsInJlbW92ZUxpc3RlbmVyIiwiTWF0aCIsIm1heCIsImdldEFkZGl0aW9uYWxDb25kaXRpb24iLCJwYXJhbXMiLCJhY2NvdW50cyIsImxlbmd0aCIsImNvbmRpdGlvbiIsImFkZCIsIm1hcCIsIngiLCJqb2luIiwiYnVpbGRDb25kaXRpb25RTCIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwiTnVtYmVyIiwib3JkZXJCeVRleHQiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJvcGVyYXRpb25JZCIsInZhbHVlcyIsImlzRmFzdFF1ZXJ5IiwiZXhpc3RpbmdTdGF0IiwiZ2V0IiwidW5kZWZpbmVkIiwiaXNGYXN0IiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0IiwiY29uc29sZSIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwidHJhY2VQYXJhbXMiLCJyZXN1bHQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicmVwb3J0IiwiZGVjcmVtZW50IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFRhZyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwiYXV0aEZpbHRlciIsIkRvY1Vwc2VydEhhbmRsZXIiLCJnZXRBdXRoRmlsdGVyIiwidGVzdCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJjcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5IiwiY29sIiwicmV0IiwiYWdncmVnYXRlQ291bnQiLCJpIiwicHVzaCIsImFnZ3JlZ2F0ZU51bWJlciIsImYiLCJmbiIsImFnZ3JlZ2F0ZUJpZ051bWJlciIsInR5cGUiLCJhZ2dyZWdhdGVCaWdOdW1iZXJQYXJ0cyIsImxlbiIsImhIZXgiLCJsSGV4IiwiYWdncmVnYXRlTm9uTnVtYmVyIiwiZmllbGRzIiwiZm9yRWFjaCIsImFnZ3JlZ2F0aW9uIiwic2NhbGFyRmllbGRzIiwiaW52YWxpZFR5cGUiLCJFcnJvciIsImFnZ3JlZ2F0aW9uUmVzb2x2ZXIiLCJhZ2dyZWdhdGUiLCJiaWdJbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsIkJpZ0ludCIsInN1YnN0ciIsInRvU3RyaW5nIiwiaCIsImwiLCJkYkNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFr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SyxFQUFFLENBSjBCO0FBS2pDQyxNQUFBQSxPQUFPLEVBQUUsS0FMd0I7QUFNakNhLE1BQUFBLFdBQVcsRUFBRSxJQU5vQjtBQU9qQ0QsTUFBQUEsSUFBSSxFQUFFMEYsV0FBVyxDQUFDMUYsSUFQZTtBQVFqQ2xDLE1BQUFBLE1BQU0sRUFBRTRILFdBQVcsQ0FBQzVILE1BUmE7QUFTakNiLE1BQUFBLFlBQVksRUFBRTlDO0FBVG1CLEtBQWxCLEVBVWhCLElBVmdCLEVBVVYsSUFWVSxFQVVKLElBVkksQ0FBbkI7QUFXQSxXQUFPd0ksSUFBSSxDQUFDLENBQUQsQ0FBWDtBQUNIOztBQUVELFFBQU1zRCxXQUFOLENBQWtCQyxXQUFsQixFQUF5Q1QsU0FBekMsRUFBNEU7QUFDeEUsUUFBSSxDQUFDUyxXQUFELElBQWdCQSxXQUFXLENBQUNsSSxNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU9zRSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9ELE9BQU8sQ0FBQ0osR0FBUixDQUFZZ0UsV0FBVyxDQUFDL0gsR0FBWixDQUFnQmdJLEtBQUssSUFBSSxLQUFLWixVQUFMLENBQWdCWSxLQUFoQixFQUF1QlYsU0FBdkIsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURXLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUN0SSxNQUFmO0FBQ0g7O0FBM2lCbUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7IFNwYW4sIFNwYW5Db250ZXh0LCBUcmFjZXIgfSBmcm9tIFwib3BlbnRyYWNpbmdcIjtcbmltcG9ydCB0eXBlIHsgVE9OQ2xpZW50IH0gZnJvbSBcInRvbi1jbGllbnQtanMvdHlwZXNcIjtcbmltcG9ydCB7IERvY1Vwc2VydEhhbmRsZXIsIERvY1N1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2FyYW5nby1saXN0ZW5lcnNcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHsgQXV0aCB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEJMT0NLQ0hBSU5fREIsIFNUQVRTIH0gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7IERhdGFiYXNlUXVlcnksIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQsIFNjYWxhckZpZWxkIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB7IHBhcnNlU2VsZWN0aW9uU2V0LCBRUGFyYW1zLCByZXNvbHZlQmlnVUludCwgc2VsZWN0aW9uVG9TdHJpbmcgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB7IGlzRmFzdFF1ZXJ5IH0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHsgSVN0YXRzIH0gZnJvbSAnLi90cmFjZXInO1xuaW1wb3J0IHsgUVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZyB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHsgY3JlYXRlRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHsgc2NhbGFyRmllbGRzIH0gZnJvbSAnLi9yZXNvbHZlcnMtZ2VuZXJhdGVkJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUT05DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgY29uc3QgQWdncmVnYXRpb25GbiA9IHtcbiAgICBDT1VOVDogJ0NPVU5UJyxcbiAgICBNSU46ICdNSU4nLFxuICAgIE1BWDogJ01BWCcsXG4gICAgU1VNOiAnU1VNJyxcbiAgICBBVkVSQUdFOiAnQVZFUkFHRScsXG4gICAgU1REREVWX1BPUFVMQVRJT046ICdTVERERVZfUE9QVUxBVElPTicsXG4gICAgU1REREVWX1NBTVBMRTogJ1NURERFVl9TQU1QTEUnLFxuICAgIFZBUklBTkNFX1BPUFVMQVRJT046ICdWQVJJQU5DRV9QT1BVTEFUSU9OJyxcbiAgICBWQVJJQU5DRV9TQU1QTEU6ICdWQVJJQU5DRV9TQU1QTEUnLFxufVxuXG50eXBlIEFnZ3JlZ2F0aW9uRm5UeXBlID0gJEtleXM8dHlwZW9mIEFnZ3JlZ2F0aW9uRm4+O1xuXG5leHBvcnQgdHlwZSBGaWVsZEFnZ3JlZ2F0aW9uID0ge1xuICAgIGZpZWxkOiBzdHJpbmcsXG4gICAgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlLFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzOiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICA0MDAsXG4gICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGF1dGg6IEF1dGgsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBzdGF0czogSVN0YXRzLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLmVtaXQoJ2RvYycsIGRvYyk7XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IGFzeW5jIChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgRG9jU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXZlbnRMaXN0ZW5lciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IE1hdGgubWF4KDAsIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRDb25kaXRpb25RTChcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcilcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uID09PSAnZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkQ29uZGl0aW9uUUwoZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpc0Zhc3RRdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXVxuICAgICk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBleGlzdGluZ1N0YXQgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHRleHQpO1xuICAgICAgICBpZiAoZXhpc3RpbmdTdGF0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZ1N0YXQuaXNGYXN0O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25JbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeShjb2xsZWN0aW9uSW5mbywgdGhpcy5kb2NUeXBlLCBmaWx0ZXIsIG9yZGVyQnkgfHwgW10sIGNvbnNvbGUpLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHRleHQsIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gdGhpcy5pc0Zhc3RRdWVyeShxLnRleHQsIHEuZmlsdGVyLCBxLm9yZGVyQnkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNlUGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ1FVRVJZJyxcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyAnRkFTVCcgOiAnU0xPVycsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCksXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UodGV4dCwgcGFyYW1zLCBpc0Zhc3QpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHRleHQ6IHN0cmluZywgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSwgaXNGYXN0OiBib29sZWFuKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBpc0Zhc3QgPyB0aGlzLmRiIDogdGhpcy5zbG93RGI7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHRleHQsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpLFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeURhdGFiYXNlKHEudGV4dCwgcS5wYXJhbXMsIGlzRmFzdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IERvY1Vwc2VydEhhbmRsZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbignZG9jJywgd2FpdEZvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIH0ge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZENvbmRpdGlvblFMKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogJyc7XG4gICAgICAgIGNvbnN0IGNvbDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgcmV0OiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUNvdW50KGk6IG51bWJlcikge1xuICAgICAgICAgICAgY29sLnB1c2goYHYke2l9ID0gQ09VTlQoZG9jKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHYke2l9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBhZ2dyZWdhdGVOdW1iZXIoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb2wucHVzaChgdiR7aX0gPSAke2ZufSgke2YucGF0aH0pYCk7XG4gICAgICAgICAgICByZXQucHVzaChgdiR7aX1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZUJpZ051bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB7ICR7Zi50eXBlfTogdiR7aX0gfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYWdncmVnYXRlQmlnTnVtYmVyUGFydHMoaTogbnVtYmVyLCBmOiBTY2FsYXJGaWVsZCwgZm46IEFnZ3JlZ2F0aW9uRm5UeXBlKSB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBmLnR5cGUgPT09ICd1aW50NjQnID8gMSA6IDI7XG4gICAgICAgICAgICBjb25zdCBoSGV4ID0gYFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSwgTEVOR1RIKCR7Zi5wYXRofSkgLSAke2xlbn0gLSA4KWA7XG4gICAgICAgICAgICBjb25zdCBsSGV4ID0gYFJJR0hUKFNVQlNUUklORygke2YucGF0aH0sICR7bGVufSksIDgpYDtcbiAgICAgICAgICAgIGNvbC5wdXNoKGBoJHtpfSA9ICR7Zm59KFRPX05VTUJFUihDT05DQVQoXCIweFwiLCAke2hIZXh9KSkpYCk7XG4gICAgICAgICAgICBjb2wucHVzaChgbCR7aX0gPSAke2ZufShUT19OVU1CRVIoQ09OQ0FUKFwiMHhcIiwgJHtsSGV4fSkpKWApO1xuICAgICAgICAgICAgcmV0LnB1c2goYHsgJHtmLnR5cGV9OiB7IGg6IGgke2l9LCBsOiBsJHtpfSB9IH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZU5vbk51bWJlcihpOiBudW1iZXIsIGY6IFNjYWxhckZpZWxkLCBmbjogQWdncmVnYXRpb25GblR5cGUpIHtcbiAgICAgICAgICAgIGNvbC5wdXNoKGB2JHtpfSA9ICR7Zm59KCR7Zi5wYXRofSlgKTtcbiAgICAgICAgICAgIHJldC5wdXNoKGB2JHtpfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJncy5maWVsZHMuZm9yRWFjaCgoYWdncmVnYXRpb246IEZpZWxkQWdncmVnYXRpb24sIGk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZm4gPSBhZ2dyZWdhdGlvbi5mbiB8fCBBZ2dyZWdhdGlvbkZuLkNPVU5UO1xuICAgICAgICAgICAgaWYgKGZuID09PSBBZ2dyZWdhdGlvbkZuLkNPVU5UKSB7XG4gICAgICAgICAgICAgICAgYWdncmVnYXRlQ291bnQoaSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IGY6ICh0eXBlb2YgdW5kZWZpbmVkIHwgU2NhbGFyRmllbGQpID0gc2NhbGFyRmllbGRzLmdldChgJHt0aGlzLm5hbWV9LiR7YWdncmVnYXRpb24uZmllbGQgfHwgJ2lkJ31gKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbnZhbGlkVHlwZSA9ICgpID0+IG5ldyBFcnJvcihgWyR7YWdncmVnYXRpb24uZmllbGR9XSBjYW4ndCBiZSB1c2VkIHdpdGggWyR7Zm59XWApO1xuICAgICAgICAgICAgICAgIGlmICghZikge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBpbnZhbGlkVHlwZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGYudHlwZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZU51bWJlcihpLCBmLCBmbik7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3VpbnQ2NCc6XG4gICAgICAgICAgICAgICAgY2FzZSAndWludDEwMjQnOlxuICAgICAgICAgICAgICAgICAgICBpZiAoZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlQmlnTnVtYmVyKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZUJpZ051bWJlclBhcnRzKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGZuID09PSBBZ2dyZWdhdGlvbkZuLk1BWCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlTm9uTnVtYmVyKGksIGYsIGZuKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGludmFsaWRUeXBlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURSAke2NvbC5qb2luKCcsICcpfVxuICAgICAgICAgICAgUkVUVVJOIFske3JldC5qb2luKCcsICcpfV1gO1xuICAgICAgICBjb25zb2xlLmxvZygnPj4+JywgdGV4dCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCAnQUdHUkVHQVRFJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlQWdncmVnYXRpb25RdWVyeShhcmdzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnQUdHUkVHQVRFJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkocS50ZXh0LCBhcmdzLmZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgaXNGYXN0LCB7XG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIGFnZ3JlZ2F0ZTogYXJncy5maWVsZHMsXG4gICAgICAgICAgICAgICAgfSwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgJ0FHR1JFR0FURScsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gJ0ZBU1QnIDogJ1NMT1cnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0WzBdLm1hcCgoeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJpZ0ludCA9IHgudWludDY0IHx8IHgudWludDEwMjQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiaWdJbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlbiA9ICgndWludDY0JyBpbiB4KSA/IDEgOiAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBiaWdJbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8kRmxvd0ZpeE1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEJpZ0ludChgMHgke2JpZ0ludC5zdWJzdHIobGVuKX1gKS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyRGbG93Rml4TWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaCA9IEJpZ0ludChgMHgke051bWJlcihiaWdJbnQuaCkudG9TdHJpbmcoMTYpfTAwMDAwMDAwYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGwgPSBCaWdJbnQoYmlnSW50LmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoaCArIGwpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geC50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcih7XG4gICAgICAgICAgICBmaWx0ZXI6IHF1ZXJ5UGFyYW1zLmZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgIGxpbWl0OiAxLFxuICAgICAgICAgICAgdGltZW91dDogNDAwMDAsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgfSwgdHJ1ZSwgbnVsbCwgbnVsbCk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKGZpZWxkVmFsdWVzOiBzdHJpbmdbXSwgZmllbGRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICghZmllbGRWYWx1ZXMgfHwgZmllbGRWYWx1ZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZmllbGRWYWx1ZXMubWFwKHZhbHVlID0+IHRoaXMud2FpdEZvckRvYyh2YWx1ZSwgZmllbGRQYXRoKSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuIl19