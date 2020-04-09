"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.Collection = void 0;

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
        return 'false';
    }
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _dbTypes.QParams();
    const primaryCondition = Object.keys(filter).length > 0 ? this.docType.ql(params, 'doc', filter) : '';
    const additionalCondition = this.getAdditionalCondition(accessRights, params);

    if (primaryCondition === 'false' || additionalCondition === 'false') {
      return null;
    }

    let condition = primaryCondition && additionalCondition ? `(${primaryCondition}) AND (${additionalCondition})` : primaryCondition || additionalCondition;
    const filterSection = condition ? `FILTER ${condition}` : '';
    const selection = (0, _dbTypes.parseSelectionSet)(selectionInfo, this.name);
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

  async ensureQueryStat(q) {
    const existing = this.queryStats.get(q.text);

    if (existing !== undefined) {
      return existing;
    }

    const collectionInfo = _config.BLOCKCHAIN_DB.collections[this.name];
    const stat = {
      slow: !(0, _slowDetector.isFastQuery)(collectionInfo, this.docType, q.filter, q.orderBy, console),
      times: []
    };
    this.queryStats.set(q.text, stat);
    return stat;
  }

  queryResolver() {
    return async (parent, args, context, info) =>
    /*wrap(this.log, 'QUERY', args, async () =>*/
    {
      this.statQuery.increment();
      this.statQueryActive.increment();
      const start = Date.now();

      try {
        // await new Promise(resolve => setTimeout(resolve, 1000));
        return []; //todo: const accessRights = await requireGrantedAccess(context, args);
        // const q = this.createDatabaseQuery(args, info.operation.selectionSet, accessRights);
        // if (!q) {
        //     this.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);
        //     return [];
        // }
        // const stat = await this.ensureQueryStat(q);
        // const start = Date.now();
        // const result = q.timeout > 0
        //     ? await this.queryWaitFor(q, stat, context.parentSpan)
        //     : await this.query(q, stat, context.parentSpan);
        // this.log.debug(
        //     'QUERY',
        //     args,
        //     (Date.now() - start) / 1000,
        //     stat.slow ? 'SLOW' : 'FAST', context.remoteAddress,
        // );
        // return result;
      } finally {
        this.statQueryTime.report(Date.now() - start);
        this.statQueryActive.decrement();
      }
    };
  }

  static setQueryTraceParams(q, span) {
    const params = {
      filter: q.filter,
      selection: (0, _dbTypes.selectionToString)(q.selection)
    };

    if (q.orderBy.length > 0) {
      params.orderBy = q.orderBy;
    }

    if (q.limit !== 50) {
      params.limit = q.limit;
    }

    if (q.timeout > 0) {
      params.timeout = q.timeout;
    }

    span.setTag('params', params);
  }

  async query(q, stat, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, async span => {
      Collection.setQueryTraceParams(q, span);
      return this.queryDatabase(q, stat);
    }, parentSpan);
  }

  async queryDatabase(q, stat) {
    const db = stat && stat.slow ? this.slowDb : this.db;
    const start = Date.now();
    const cursor = await db.query(q.text, q.params);
    const result = await cursor.all();

    if (stat) {
      stat.times.push(Date.now() - start);

      if (stat.times.length > 100) {
        stat.times.shift();
      }
    }

    return result;
  }

  async queryWaitFor(q, stat, parentSpan) {
    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, async span => {
      Collection.setQueryTraceParams(q, span);
      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;

      try {
        const onQuery = new Promise((resolve, reject) => {//todo: const check = () => {
          //     this.queryDatabase(q, stat).then((docs) => {
          //         if (!resolvedBy) {
          //             if (docs.length > 0) {
          //                 forceTimerId = null;
          //                 resolvedBy = 'query';
          //                 resolve(docs);
          //             } else {
          //                 forceTimerId = setTimeout(check, 5_000);
          //             }
          //         }
          //     }, reject);
          // };
          // check();
        });
        const onChangesFeed = new Promise(resolve => {//todo: const authFilter = DocUpsertHandler.getAuthFilter(this.name, q.accessRights);
          // waitFor = (doc) => {
          //     if (authFilter && !authFilter(doc)) {
          //         return;
          //     }
          //     if (this.docType.test(null, doc, q.filter)) {
          //         if (!resolvedBy) {
          //             resolvedBy = 'listener';
          //             resolve([doc]);
          //         }
          //     }
          // };
          // this.waitForCount += 1;
          // this.docInsertOrUpdate.on('doc', waitFor);
          // this.statWaitForActive.increment();
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
  }

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
    }, null, null);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIkNvbGxlY3Rpb24iLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJkb2NUeXBlIiwibG9ncyIsInRyYWNlciIsInN0YXRzIiwiZGIiLCJzbG93RGIiLCJsb2ciLCJjcmVhdGUiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXREb2MiLCJTdGF0c0NvdW50ZXIiLCJTVEFUUyIsImRvYyIsImNvdW50Iiwic3RhdFF1ZXJ5IiwicXVlcnkiLCJzdGF0UXVlcnlUaW1lIiwiU3RhdHNUaW1pbmciLCJ0aW1lIiwic3RhdFF1ZXJ5QWN0aXZlIiwiU3RhdHNHYXVnZSIsImFjdGl2ZSIsInN0YXRXYWl0Rm9yQWN0aXZlIiwid2FpdEZvciIsInN0YXRTdWJzY3JpcHRpb25BY3RpdmUiLCJzdWJzY3JpcHRpb24iLCJkb2NJbnNlcnRPclVwZGF0ZSIsIkV2ZW50RW1pdHRlciIsInF1ZXJ5U3RhdHMiLCJNYXAiLCJtYXhRdWV1ZVNpemUiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJpbmNyZW1lbnQiLCJlbWl0Iiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzdWJzY3JpYmUiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIkRvY1N1YnNjcmlwdGlvbiIsImZpbHRlciIsIm9wZXJhdGlvbiIsInNlbGVjdGlvblNldCIsImV2ZW50TGlzdGVuZXIiLCJwdXNoRG9jdW1lbnQiLCJvbiIsIm9uQ2xvc2UiLCJyZW1vdmVMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwicGFyYW1zIiwiYWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJzZWxlY3Rpb25JbmZvIiwiUVBhcmFtcyIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJhZGRpdGlvbmFsQ29uZGl0aW9uIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwibWluIiwibGltaXRTZWN0aW9uIiwidGV4dCIsIm9wZXJhdGlvbklkIiwidmFsdWVzIiwiZW5zdXJlUXVlcnlTdGF0IiwicSIsImV4aXN0aW5nIiwiZ2V0IiwidW5kZWZpbmVkIiwiY29sbGVjdGlvbkluZm8iLCJCTE9DS0NIQUlOX0RCIiwiY29sbGVjdGlvbnMiLCJzdGF0Iiwic2xvdyIsImNvbnNvbGUiLCJ0aW1lcyIsInNldCIsInF1ZXJ5UmVzb2x2ZXIiLCJwYXJlbnQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJyZXBvcnQiLCJkZWNyZW1lbnQiLCJzZXRRdWVyeVRyYWNlUGFyYW1zIiwic3BhbiIsInNldFRhZyIsInBhcmVudFNwYW4iLCJRVHJhY2VyIiwidHJhY2UiLCJxdWVyeURhdGFiYXNlIiwiY3Vyc29yIiwicmVzdWx0IiwiYWxsIiwicHVzaCIsInNoaWZ0IiwicXVlcnlXYWl0Rm9yIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIm9uQ2hhbmdlc0ZlZWQiLCJvblRpbWVvdXQiLCJzZXRUaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImRiQ29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJ3YWl0Rm9yRG9jIiwiZmllbGRWYWx1ZSIsImZpZWxkUGF0aCIsInF1ZXJ5UGFyYW1zIiwiZW5kc1dpdGgiLCJzbGljZSIsImFueSIsImVxIiwidiIsImlkIiwiZG9jcyIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBR0E7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7Ozs7QUFsQ0E7Ozs7Ozs7Ozs7Ozs7OztBQXFEQSxTQUFTQSxrQkFBVCxDQUNJQyxhQURKLEVBRUlDLFNBRkosRUFHSUMsT0FISixFQUlXO0FBQ1AsTUFBSSxDQUFDRCxTQUFMLEVBQWdCO0FBQ1osV0FBT0QsYUFBUDtBQUNIOztBQUNELE1BQUlBLGFBQWEsSUFBSUMsU0FBUyxLQUFLRCxhQUFuQyxFQUFrRDtBQUM5Q0UsSUFBQUEsT0FBTyxDQUFDQywwQkFBUixHQUFxQyxJQUFyQztBQUNBLFVBQU0sd0JBQ0YsR0FERSxFQUVGLG9FQUZFLENBQU47QUFJSDs7QUFDRCxTQUFPRixTQUFQO0FBQ0g7O0FBRU0sZUFBZUcsb0JBQWYsQ0FBb0NGLE9BQXBDLEVBQW9FRyxJQUFwRSxFQUFzRztBQUN6RyxRQUFNSixTQUFTLEdBQUdDLE9BQU8sQ0FBQ0QsU0FBUixJQUFxQkksSUFBSSxDQUFDSixTQUE1QztBQUNBQyxFQUFBQSxPQUFPLENBQUNGLGFBQVIsR0FBd0JELGtCQUFrQixDQUFDRyxPQUFPLENBQUNGLGFBQVQsRUFBd0JDLFNBQXhCLEVBQW1DQyxPQUFuQyxDQUExQztBQUNBLFNBQU9BLE9BQU8sQ0FBQ0ksSUFBUixDQUFhRixvQkFBYixDQUFrQ0gsU0FB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QUFELElBQWdCQSxXQUFXLENBQUMzRixNQUFaLEtBQXVCLENBQTNDLEVBQThDO0FBQzFDLGFBQU9xRSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQ0FBUDtBQUNIOztBQUNELFdBQU9ELE9BQU8sQ0FBQ1AsR0FBUixDQUFZNkIsV0FBVyxDQUFDeEYsR0FBWixDQUFnQnlGLEtBQUssSUFBSSxLQUFLYixVQUFMLENBQWdCYSxLQUFoQixFQUF1QlgsU0FBdkIsQ0FBekIsQ0FBWixDQUFQO0FBQ0g7O0FBRURZLEVBQUFBLGdCQUFnQixDQUFDQyxZQUFELEVBQW9DO0FBQ2hELFVBQU1DLE9BQU8sR0FBRyxFQUFoQixDQURnRCxDQUVoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxXQUFPQSxPQUFPLENBQUMvRixNQUFmO0FBQ0g7O0FBMVltQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHtEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9ufSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7U3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlcn0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7VE9OQ2xpZW50fSBmcm9tIFwidG9uLWNsaWVudC1qcy90eXBlc1wiO1xuaW1wb3J0IHtEb2NVcHNlcnRIYW5kbGVyLCBEb2NTdWJzY3JpcHRpb259IGZyb20gXCIuL2FyYW5nby1saXN0ZW5lcnNcIjtcbmltcG9ydCB0eXBlIHtBY2Nlc3NSaWdodHN9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7QXV0aH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHtCTE9DS0NIQUlOX0RCLCBTVEFUU30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHR5cGUge1FDb25maWd9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHR5cGUge0RhdGFiYXNlUXVlcnksIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXR9IGZyb20gXCIuL2RiLXR5cGVzXCI7XG5pbXBvcnQge3BhcnNlU2VsZWN0aW9uU2V0LCBRUGFyYW1zLCBzZWxlY3Rpb25Ub1N0cmluZ30gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB0eXBlIHtRTG9nfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHtpc0Zhc3RRdWVyeX0gZnJvbSAnLi9zbG93LWRldGVjdG9yJztcbmltcG9ydCB0eXBlIHtJU3RhdHN9IGZyb20gJy4vdHJhY2VyJztcbmltcG9ydCB7UVRyYWNlciwgU3RhdHNDb3VudGVyLCBTdGF0c0dhdWdlLCBTdGF0c1RpbWluZ30gZnJvbSBcIi4vdHJhY2VyXCI7XG5pbXBvcnQge2NyZWF0ZUVycm9yLCBSZWdpc3RyeU1hcCwgd3JhcH0gZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUT05DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoXG4gICAgICAgICAgICA0MDAsXG4gICAgICAgICAgICAnUmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBhY2Nlc3Mga2V5IGZvciBhbGwgcXVlcmllcyBhbmQgbXV0YXRpb25zJyxcbiAgICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KTogUHJvbWlzZTxBY2Nlc3NSaWdodHM+IHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRBY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIHJldHVybiBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoYWNjZXNzS2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hbUFjY2Vzc1JlcXVpcmVkKGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgYXJnczogYW55KSB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkTWFtQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICBpZiAoIWFjY2Vzc0tleSB8fCAhY29udGV4dC5jb25maWcubWFtQWNjZXNzS2V5cy5oYXMoYWNjZXNzS2V5KSkge1xuICAgICAgICB0aHJvdyBBdXRoLnVuYXV0aG9yaXplZEVycm9yKCk7XG4gICAgfVxufVxuXG5jb25zdCBhY2Nlc3NHcmFudGVkOiBBY2Nlc3NSaWdodHMgPSB7XG4gICAgZ3JhbnRlZDogdHJ1ZSxcbiAgICByZXN0cmljdFRvQWNjb3VudHM6IFtdLFxufTtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIHN0YXREb2M6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnk6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlUaW1lOiBTdGF0c1RpbWluZztcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGF1dGg6IEF1dGgsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBzdGF0czogSVN0YXRzLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMud2FpdEZvci5hY3RpdmUsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLnN0YXREb2MuaW5jcmVtZW50KCk7XG4gICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdCgnZG9jJywgZG9jKTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBEb2NTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKCcsJyl9XWA7XG4gICAgICAgIHN3aXRjaCAodGhpcy5uYW1lKSB7XG4gICAgICAgIGNhc2UgJ2FjY291bnRzJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAndHJhbnNhY3Rpb25zJzpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gYChkb2Muc3JjICR7Y29uZGl0aW9ufSkgT1IgKGRvYy5kc3QgJHtjb25kaXRpb259KWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJ2ZhbHNlJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbmRpdGlvbiA9IChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICBvcGVyYXRpb25JZDogYXJncy5vcGVyYXRpb25JZCB8fCBudWxsLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBlbnN1cmVRdWVyeVN0YXQocTogRGF0YWJhc2VRdWVyeSk6IFByb21pc2U8UXVlcnlTdGF0PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5xdWVyeVN0YXRzLmdldChxLnRleHQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbGxlY3Rpb25JbmZvID0gQkxPQ0tDSEFJTl9EQi5jb2xsZWN0aW9uc1t0aGlzLm5hbWVdO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgc2xvdzogIWlzRmFzdFF1ZXJ5KGNvbGxlY3Rpb25JbmZvLCB0aGlzLmRvY1R5cGUsIHEuZmlsdGVyLCBxLm9yZGVyQnksIGNvbnNvbGUpLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEudGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIGluZm86IGFueSxcbiAgICAgICAgKSA9PiAvKndyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+Ki8ge1xuICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgLy8gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMDApKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgLy90b2RvOiBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAvLyBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHN0YXQgPSBhd2FpdCB0aGlzLmVuc3VyZVF1ZXJ5U3RhdChxKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgLy8gY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgIC8vICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIHN0YXQsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICAvLyAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgLy8gICAgICdRVUVSWScsXG4gICAgICAgICAgICAgICAgLy8gICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgLy8gICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAvLyAgICAgc3RhdC5zbG93ID8gJ1NMT1cnIDogJ0ZBU1QnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgLy8gKTtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhdGljIHNldFF1ZXJ5VHJhY2VQYXJhbXMocTogRGF0YWJhc2VRdWVyeSwgc3BhbjogU3Bhbikge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgIHBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgIHBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICB9XG4gICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBzdGF0OiBRdWVyeVN0YXQsXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uLnNldFF1ZXJ5VHJhY2VQYXJhbXMocSwgc3Bhbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURhdGFiYXNlKHEsIHN0YXQpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHE6IERhdGFiYXNlUXVlcnksIHN0YXQ6ID9RdWVyeVN0YXQpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IChzdGF0ICYmIHN0YXQuc2xvdykgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocS50ZXh0LCBxLnBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgaWYgKHN0YXQpIHtcbiAgICAgICAgICAgIHN0YXQudGltZXMucHVzaChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgaWYgKHN0YXQudGltZXMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgICAgICAgICAgc3RhdC50aW1lcy5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIHN0YXQ6ID9RdWVyeVN0YXQsXG4gICAgICAgIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vdG9kbzogY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy90b2RvOiBjb25zdCBhdXRoRmlsdGVyID0gRG9jVXBzZXJ0SGFuZGxlci5nZXRBdXRoRmlsdGVyKHRoaXMubmFtZSwgcS5hY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyB3YWl0Rm9yID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKGF1dGhGaWx0ZXIgJiYgIWF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB9O1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKCdkb2MnLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSAndGltZW91dCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKCdyZXNvbHZlZCcsIHJlc29sdmVkQnkpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMud2FpdEZvckNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoJ2RvYycsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoJ1sqXScpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHtbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHthbnk6IHtlcTogZmllbGRWYWx1ZX19fSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7djogZmllbGRWYWx1ZX0sXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHtpZDoge2VxOiBmaWVsZFZhbHVlfX0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczoge3Y6IGZpZWxkVmFsdWV9LFxuICAgICAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3Ioe1xuICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IFtdLFxuICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IDQwMDAwLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IG51bGwsXG4gICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHM6IGFjY2Vzc0dyYW50ZWQsXG4gICAgICAgIH0sIG51bGwsIG51bGwpO1xuICAgICAgICByZXR1cm4gZG9jc1swXTtcbiAgICB9XG5cbiAgICBhc3luYyB3YWl0Rm9yRG9jcyhmaWVsZFZhbHVlczogc3RyaW5nW10sIGZpZWxkUGF0aDogc3RyaW5nKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2ModmFsdWUsIGZpZWxkUGF0aCkpKTtcbiAgICB9XG5cbiAgICBmaW5pc2hPcGVyYXRpb25zKG9wZXJhdGlvbklkczogU2V0PHN0cmluZz4pOiBudW1iZXIge1xuICAgICAgICBjb25zdCB0b0Nsb3NlID0gW107XG4gICAgICAgIC8vIFRPRE86IEltcGxlbWVudCBsaXN0ZW5lciBjYW5jZWxsYXRpb24gYmFzZWQgb24gb3BlcmF0aW9uSWRcbiAgICAgICAgLy8gZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5pdGVtcy52YWx1ZXMoKSkge1xuICAgICAgICAvLyAgICAgaWYgKGxpc3RlbmVyLm9wZXJhdGlvbklkICYmIG9wZXJhdGlvbklkcy5oYXMobGlzdGVuZXIub3BlcmF0aW9uSWQpKSB7XG4gICAgICAgIC8vICAgICAgICAgdG9DbG9zZS5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuICAgICAgICAvLyB0b0Nsb3NlLmZvckVhY2goeCA9PiB4LmNsb3NlKCkpO1xuICAgICAgICByZXR1cm4gdG9DbG9zZS5sZW5ndGg7XG4gICAgfVxuXG59XG5cbiJdfQ==