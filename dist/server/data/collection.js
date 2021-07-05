"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireGrantedAccess = requireGrantedAccess;
exports.mamAccessRequired = mamAccessRequired;
exports.QDataCollection = exports.QDataScope = exports.RequestController = exports.RequestEvent = void 0;

var _opentracing = require("opentracing");

var _core = require("@tonclient/core");

var _aggregations = require("./aggregations");

var _listener = require("./listener");

var _auth = require("../auth");

var _config = require("../config");

var _filters = require("../filter/filters");

var _logs = _interopRequireDefault(require("../logs"));

var _slowDetector = require("../filter/slow-detector");

var _tracer = require("../tracer");

var _utils = require("../utils");

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
const INDEXES_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

const RequestEvent = {
  CLOSE: "close",
  FINISH: "finish"
};
exports.RequestEvent = RequestEvent;

class RequestController {
  constructor() {
    this.events = new _events.default();
    this.events.setMaxListeners(0);
  }

  emitClose() {
    this.events.emit(RequestEvent.CLOSE);
  }

  finish() {
    this.events.emit(RequestEvent.FINISH);
    this.events.removeAllListeners();
  }

}

exports.RequestController = RequestController;

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
const QDataScope = {
  mutable: "mutable",
  immutable: "immutable",
  counterparties: "counterparties"
};
exports.QDataScope = QDataScope;

class QDataCollection {
  // Dependencies
  // Own
  constructor(options) {
    const name = options.name;
    this.name = name;
    this.docType = options.docType;
    this.scope = options.scope;
    this.indexes = options.indexes;
    this.provider = options.provider;
    this.indexesRefreshTime = Date.now();
    this.slowQueriesProvider = options.slowQueriesProvider;
    this.log = options.logs.create(name);
    this.auth = options.auth;
    this.tracer = options.tracer;
    this.isTests = options.isTests;
    this.waitForCount = 0;
    this.subscriptionCount = 0;
    const stats = options.stats;
    this.statDoc = new _tracer.StatsCounter(stats, _config.STATS.doc.count, [`collection:${name}`]);
    this.statQuery = new _tracer.StatsCounter(stats, _config.STATS.query.count, [`collection:${name}`]);
    this.statQueryTime = new _tracer.StatsTiming(stats, _config.STATS.query.time, [`collection:${name}`]);
    this.statQueryActive = new _tracer.StatsGauge(stats, _config.STATS.query.active, [`collection:${name}`]);
    this.statQueryFailed = new _tracer.StatsCounter(stats, _config.STATS.query.failed, [`collection:${name}`]);
    this.statQuerySlow = new _tracer.StatsCounter(stats, _config.STATS.query.slow, [`collection:${name}`]);
    this.statWaitForActive = new _tracer.StatsGauge(stats, _config.STATS.waitFor.active, [`collection:${name}`]);
    this.statSubscription = new _tracer.StatsCounter(stats, _config.STATS.subscription.count, [`collection:${name}`]);
    this.statSubscriptionActive = new _tracer.StatsGauge(stats, _config.STATS.subscription.active, [`collection:${name}`]);
    this.docInsertOrUpdate = new _events.default();
    this.docInsertOrUpdate.setMaxListeners(0);
    this.queryStats = new Map();
    this.maxQueueSize = 0;
    this.hotSubscription = this.provider.subscribe(this.name, doc => this.onDocumentInsertOrUpdate(doc));
  }

  close() {
    if (this.hotSubscription) {
      this.provider.unsubscribe(this.hotSubscription);
      this.hotSubscription = null;
    }
  }

  dropCachedDbInfo() {
    this.indexesRefreshTime = Date.now();
  } // Subscriptions


  onDocumentInsertOrUpdate(doc) {
    this.statDoc.increment().then(() => {
      this.docInsertOrUpdate.emit("doc", doc);
      const isExternalInboundFinalizedMessage = this.name === "messages" && doc._key && doc.msg_type === 1 && doc.status === 5;

      if (isExternalInboundFinalizedMessage) {
        const span = this.tracer.startSpan("messageDbNotification", {
          childOf: _tracer.QTracer.messageRootSpanContext(doc._key)
        });
        span.addTags({
          messageId: doc._key
        });
        span.finish();
      }
    });
  }

  subscriptionResolver() {
    return {
      subscribe: async (_, args, context, info) => {
        const accessRights = await requireGrantedAccess(context, args);
        await this.statSubscription.increment();
        const subscription = new _listener.QDataSubscription(this.name, this.docType, accessRights, args.filter || {}, (0, _filters.parseSelectionSet)(info.operation.selectionSet, this.name));

        const eventListener = doc => {
          try {
            subscription.pushDocument(doc);
          } catch (error) {
            this.log.error(Date.now(), this.name, "SUBSCRIPTION\tFAILED", JSON.stringify(args.filter), error.toString());
          }
        };

        this.docInsertOrUpdate.on("doc", eventListener);
        this.subscriptionCount += 1;

        subscription.onClose = () => {
          this.docInsertOrUpdate.removeListener("doc", eventListener);
          this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);
        };

        return subscription;
      }
    };
  } // Queries


  getAdditionalCondition(accessRights, params) {
    const accounts = accessRights.restrictToAccounts;

    if (accounts.length === 0) {
      return "";
    }

    const condition = accounts.length === 1 ? `== @${params.add(accounts[0])}` : `IN [${accounts.map(x => `@${params.add(x)}`).join(",")}]`;

    switch (this.name) {
      case "accounts":
        return `doc._key ${condition}`;

      case "transactions":
        return `doc.account_addr ${condition}`;

      case "messages":
        return `(doc.src ${condition}) OR (doc.dst ${condition})`;

      default:
        return "";
    }
  }

  buildFilterCondition(filter, params, accessRights) {
    const primaryCondition = Object.keys(filter).length > 0 ? this.docType.filterCondition(params, "doc", filter) : "";
    const additionalCondition = this.getAdditionalCondition(accessRights, params);

    if (primaryCondition === "false" || additionalCondition === "false") {
      return null;
    }

    return primaryCondition && additionalCondition ? `(${primaryCondition}) AND (${additionalCondition})` : primaryCondition || additionalCondition;
  }

  buildReturnExpression(selections, orderBy) {
    const expressions = new Map();
    expressions.set("_key", "doc._key");
    const fields = this.docType.fields;

    if (fields) {
      if (selections) {
        (0, _filters.collectReturnExpressions)(expressions, "doc", selections, fields);
      }

      if (orderBy.length > 0) {
        const orderBySelectionSet = {
          kind: "SelectionSet",
          selections: []
        };

        for (const item of orderBy) {
          (0, _filters.mergeFieldWithSelectionSet)(item.path, orderBySelectionSet);
        }

        (0, _filters.collectReturnExpressions)(expressions, "doc", orderBySelectionSet.selections, fields);
      }
    }

    expressions.delete("id");
    return (0, _filters.combineReturnExpressions)(expressions);
  }

  createDatabaseQuery(args, selectionInfo, accessRights) {
    const filter = args.filter || {};
    const params = new _filters.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const filterSection = condition ? `FILTER ${condition}` : "";
    const orderBy = args.orderBy || [];
    const selection = selectionInfo.selections ? (0, _filters.parseSelectionSet)(selectionInfo, this.name) : selectionInfo;
    const limit = Math.min(args.limit || 50, 50);
    const timeout = Number(args.timeout) || 0;
    const orderByText = orderBy.map(field => {
      const direction = field.direction && field.direction.toLowerCase() === "desc" ? " DESC" : "";
      return `doc.${field.path.replace(/\bid\b/gi, "_key")}${direction}`;
    }).join(", ");
    const sortSection = orderByText !== "" ? `SORT ${orderByText}` : "";
    const limitSection = `LIMIT ${limit}`;
    const returnExpression = this.buildReturnExpression(selectionInfo.selections, orderBy);
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
      statKey = `${statKey}${orderBy.map(x => `${x.path} ${x.direction}`).join(" ")}`;
    }

    let stat = this.queryStats.get(statKey);

    if (stat === undefined) {
      stat = {
        isFast: (0, _slowDetector.isFastQuery)(this.name, this.indexes, this.docType, filter, orderBy || [], console)
      };
      this.queryStats.set(statKey, stat);
    }

    return stat.isFast;
  }

  explainQueryResolver() {
    return async (parent, args, _context, _info) => {
      await this.checkRefreshInfo();
      const q = this.createDatabaseQuery(args, {}, _auth.grantedAccess);

      if (!q) {
        return {
          isFast: true
        };
      }

      const slowReason = await (0, _slowDetector.explainSlowReason)(this.name, this.indexes, this.docType, q.filter, q.orderBy);
      return {
        isFast: slowReason === null,
        ...(slowReason ? {
          slowReason
        } : {})
      };
    };
  }

  queryResolver() {
    return async (parent, args, context, info) => (0, _utils.wrap)(this.log, "QUERY", args, async () => {
      await this.statQuery.increment();
      await this.statQueryActive.increment();
      const start = Date.now();
      let q = null;

      try {
        const accessRights = await requireGrantedAccess(context, args);
        q = this.createDatabaseQuery(args, info.fieldNodes[0].selectionSet, accessRights);

        if (!q) {
          this.log.debug("QUERY", args, 0, "SKIPPED", context.remoteAddress);
          return [];
        }

        const isFast = await checkIsFast(context.config, () => this.isFastQuery(q.text, q.filter, q.orderBy));

        if (!isFast) {
          await this.statQuerySlow.increment();
        }

        const traceParams = {
          filter: q.filter,
          selection: (0, _filters.selectionToString)(q.selection)
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

        this.log.debug("BEFORE_QUERY", args, isFast ? "FAST" : "SLOW", context.remoteAddress);
        const start = Date.now();
        const result = q.timeout > 0 ? await this.queryWaitFor(q, isFast, traceParams, context) : await this.query(q.text, q.params, q.orderBy, isFast, traceParams, context);
        this.log.debug("QUERY", args, (Date.now() - start) / 1000, isFast ? "FAST" : "SLOW", context.remoteAddress);

        if (result.length > q.limit) {
          result.splice(q.limit);
        }

        return result;
      } catch (error) {
        await this.statQueryFailed.increment();

        if (q) {
          const slowReason = (0, _slowDetector.explainSlowReason)(this.name, this.indexes, this.docType, q.filter, q.orderBy);

          if (slowReason) {
            error.message += `. Query was detected as a slow. ${slowReason.summary}. See error data for details.`;
            error.data = { ...error.data,
              slowReason
            };
          }
        }

        throw error;
      } finally {
        await this.statQueryTime.report(Date.now() - start);
        await this.statQueryActive.decrement();
        context.request.finish();
      }
    });
  }

  async query(text, vars, orderBy, isFast, traceParams, context) {
    const impl = async span => {
      if (traceParams) {
        span.setTag("params", traceParams);
      }

      return this.queryProvider(text, vars, orderBy, isFast, context);
    };

    return _tracer.QTracer.trace(this.tracer, `${this.name}.query`, impl, context.parentSpan);
  }

  async queryProvider(text, vars, orderBy, isFast, context) {
    const provider = isFast ? this.provider : this.slowQueriesProvider;
    return provider.query(text, vars, orderBy);
  }

  async queryWaitFor(q, isFast, traceParams, context) {
    const impl = async span => {
      if (traceParams) {
        span.setTag("params", traceParams);
      }

      let waitFor = null;
      let forceTimerId = null;
      let resolvedBy = null;
      let hasDbResponse = false;

      let resolveOnClose = () => {};

      const resolveBy = (reason, resolve, result) => {
        if (!resolvedBy) {
          resolvedBy = reason;
          resolve(result);
        }
      };

      context.request.events.on(RequestEvent.CLOSE, () => {
        resolveBy("close", resolveOnClose, []);
      });

      try {
        const onQuery = new Promise((resolve, reject) => {
          const check = () => {
            this.queryProvider(q.text, q.params, q.orderBy, isFast, context).then(docs => {
              hasDbResponse = true;

              if (!resolvedBy) {
                if (docs.length > 0) {
                  forceTimerId = null;
                  resolveBy("query", resolve, docs);
                } else {
                  forceTimerId = setTimeout(check, 5000);
                }
              }
            }, reject);
          };

          check();
        });
        const onChangesFeed = new Promise(resolve => {
          const authFilter = _listener.QDataListener.getAuthFilter(this.name, q.accessRights);

          waitFor = doc => {
            if (authFilter && !authFilter(doc)) {
              return;
            }

            try {
              if (this.docType.test(null, doc, q.filter)) {
                resolveBy("listener", resolve, [doc]);
              }
            } catch (error) {
              this.log.error(Date.now(), this.name, "QUERY\tFAILED", JSON.stringify(q.filter), error.toString());
            }
          };

          this.waitForCount += 1;
          this.docInsertOrUpdate.on("doc", waitFor);
          this.statWaitForActive.increment().then(() => {});
        });
        const onTimeout = new Promise((resolve, reject) => {
          setTimeout(() => {
            if (hasDbResponse) {
              resolveBy("timeout", resolve, []);
            } else {
              reject(_utils.QError.queryTerminatedOnTimeout());
            }
          }, q.timeout);
        });
        const onClose = new Promise(resolve => {
          resolveOnClose = resolve;
        });
        const result = await Promise.race([onQuery, onChangesFeed, onTimeout, onClose]);
        span.setTag("resolved", resolvedBy);
        return result;
      } finally {
        if (waitFor !== null && waitFor !== undefined) {
          this.waitForCount = Math.max(0, this.waitForCount - 1);
          this.docInsertOrUpdate.removeListener("doc", waitFor);
          waitFor = null;
          await this.statWaitForActive.decrement();
        }

        if (forceTimerId !== null) {
          clearTimeout(forceTimerId);
          forceTimerId = null;
        }
      }
    };

    return _tracer.QTracer.trace(this.tracer, `${this.name}.waitFor`, impl, context.parentSpan);
  } //--------------------------------------------------------- Aggregates


  createAggregationQuery(filter, fields, accessRights) {
    const params = new _filters.QParams();
    const condition = this.buildFilterCondition(filter, params, accessRights);

    if (condition === null) {
      return null;
    }

    const query = _aggregations.AggregationHelperFactory.createQuery(this.name, condition || "", fields);

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

        if (path.startsWith("doc.")) {
          path = path.substr("doc.".length);
        }

        if (!(await this.isFastQuery(text, filter, [{
          path,
          direction: "ASC"
        }]))) {
          return false;
        }
      }
    }

    return true;
  }

  aggregationResolver() {
    return async (parent, args, context) => (0, _utils.wrap)(this.log, "AGGREGATE", args, async () => {
      await this.statQuery.increment();
      await this.statQueryActive.increment();
      const start = Date.now();

      try {
        const accessRights = await requireGrantedAccess(context, args);
        const filter = args.filter || {};
        const fields = Array.isArray(args.fields) && args.fields.length > 0 ? args.fields : [{
          field: "",
          fn: _aggregations.AggregationFn.COUNT
        }];
        const q = this.createAggregationQuery(filter, fields, accessRights);

        if (!q) {
          this.log.debug("AGGREGATE", args, 0, "SKIPPED", context.remoteAddress);
          return [];
        }

        const isFast = await checkIsFast(context.config, () => this.isFastAggregationQuery(q.text, filter, q.helpers));
        const start = Date.now();
        const result = await this.queryProvider(q.text, q.params, [], isFast, context);
        this.log.debug("AGGREGATE", args, (Date.now() - start) / 1000, isFast ? "FAST" : "SLOW", context.remoteAddress);
        return _aggregations.AggregationHelperFactory.convertResults(result, q.helpers);
      } finally {
        await this.statQueryTime.report(Date.now() - start);
        await this.statQueryActive.decrement();
      }
    });
  }

  async getIndexes() {
    return this.provider.getCollectionIndexes(this.name);
  } //--------------------------------------------------------- Internals


  async checkRefreshInfo() {
    if (this.isTests) {
      return;
    }

    if (Date.now() < this.indexesRefreshTime) {
      return;
    }

    this.indexesRefreshTime = Date.now() + INDEXES_REFRESH_INTERVAL;
    const actualIndexes = await this.getIndexes();

    const sameIndexes = (aIndexes, bIndexes) => {
      const aRest = new Set(aIndexes.map(_filters.indexToString));

      for (const bIndex of bIndexes) {
        const bIndexString = (0, _filters.indexToString)(bIndex);

        if (aRest.has(bIndexString)) {
          aRest.delete(bIndexString);
        } else {
          return false;
        }
      }

      return aRest.size === 0;
    };

    if (!sameIndexes(actualIndexes, this.indexes)) {
      this.log.debug("RELOAD_INDEXES", actualIndexes);
      this.indexes = actualIndexes.map(x => ({
        fields: x.fields
      }));
      this.queryStats.clear();
    }
  }

  async waitForDoc(fieldValue, fieldPath, args, context) {
    if (!fieldValue) {
      return Promise.resolve(null);
    }

    const queryParams = fieldPath.endsWith("[*]") ? {
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
      const docs = await this.queryProvider(queryParams.text, queryParams.params, [], true, context);
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
    }, true, null, context);
    return docs[0];
  }

  async waitForDocs(fieldValues, fieldPath, args, context) {
    if (!fieldValues || fieldValues.length === 0) {
      return Promise.resolve([]);
    }

    return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath, args, context)));
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

exports.QDataCollection = QDataCollection;

async function checkIsFast(config, detector) {
  if (config.slowQueries === _config.slowQueries.enable) {
    return true;
  }

  const isFast = await detector();

  if (!isFast && config.slowQueries === _config.slowQueries.disable) {
    throw new Error("Slow queries are disabled");
  }

  return isFast;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhU2NvcGUiLCJtdXRhYmxlIiwiaW1tdXRhYmxlIiwiY291bnRlcnBhcnRpZXMiLCJRRGF0YUNvbGxlY3Rpb24iLCJvcHRpb25zIiwibmFtZSIsImRvY1R5cGUiLCJzY29wZSIsImluZGV4ZXMiLCJwcm92aWRlciIsImluZGV4ZXNSZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJzbG93UXVlcmllc1Byb3ZpZGVyIiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImlzVGVzdHMiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXRzIiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwidGhlbiIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwiZXhwcmVzc2lvbnMiLCJzZXQiLCJmaWVsZHMiLCJvcmRlckJ5U2VsZWN0aW9uU2V0Iiwia2luZCIsIml0ZW0iLCJwYXRoIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsImxpbWl0IiwibWluIiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5Iiwic3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsImNvbnNvbGUiLCJleHBsYWluUXVlcnlSZXNvbHZlciIsInBhcmVudCIsIl9jb250ZXh0IiwiX2luZm8iLCJxIiwiZ3JhbnRlZEFjY2VzcyIsInNsb3dSZWFzb24iLCJxdWVyeVJlc29sdmVyIiwic3RhcnQiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwiY2hlY2tJc0Zhc3QiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsInNwbGljZSIsIm1lc3NhZ2UiLCJzdW1tYXJ5IiwiZGF0YSIsInJlcG9ydCIsImRlY3JlbWVudCIsInJlcXVlc3QiLCJ2YXJzIiwiaW1wbCIsInNldFRhZyIsInF1ZXJ5UHJvdmlkZXIiLCJ0cmFjZSIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwiaGFzRGJSZXNwb25zZSIsInJlc29sdmVPbkNsb3NlIiwicmVzb2x2ZUJ5IiwicmVhc29uIiwicmVzb2x2ZSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVqZWN0IiwiY2hlY2siLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiUURhdGFMaXN0ZW5lciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicXVlcnlUZXJtaW5hdGVkT25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udmVydFJlc3VsdHMiLCJnZXRJbmRleGVzIiwiZ2V0Q29sbGVjdGlvbkluZGV4ZXMiLCJhY3R1YWxJbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIiwiZGV0ZWN0b3IiLCJzbG93UXVlcmllcyIsImVuYWJsZSIsImRpc2FibGUiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztBQUVBOztBQUNBOztB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V0FBUCxLQUF1QkEsb0JBQVlFLE9BQWxELEVBQTJEO0FBQ3ZELFVBQU0sSUFBSUMsS0FBSixDQUFVLDJCQUFWLENBQU47QUFDSDs7QUFDRCxTQUFPekcsTUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4qXG4qIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiogTGljZW5zZSBhdDpcbipcbiogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4qXG4qIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4qIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHsgVG9uQ2xpZW50IH0gZnJvbSBcIkB0b25jbGllbnQvY29yZVwiO1xuaW1wb3J0IHsgQWdncmVnYXRpb25GbiwgQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5IH0gZnJvbSBcIi4vYWdncmVnYXRpb25zXCI7XG5pbXBvcnQgdHlwZSB7IEZpZWxkQWdncmVnYXRpb24sIEFnZ3JlZ2F0aW9uSGVscGVyIH0gZnJvbSBcIi4vYWdncmVnYXRpb25zXCI7XG5pbXBvcnQgdHlwZSB7IFFEYXRhUHJvdmlkZXIsIFFJbmRleEluZm8gfSBmcm9tIFwiLi9kYXRhLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBRRGF0YUxpc3RlbmVyLCBRRGF0YVN1YnNjcmlwdGlvbiB9IGZyb20gXCIuL2xpc3RlbmVyXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuLi9hdXRoXCI7XG5pbXBvcnQgeyBBdXRoLCBncmFudGVkQWNjZXNzIH0gZnJvbSBcIi4uL2F1dGhcIjtcbmltcG9ydCB7IHNsb3dRdWVyaWVzLCBTVEFUUyB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgRGF0YWJhc2VRdWVyeSwgR0RlZmluaXRpb24sIE9yZGVyQnksIFFUeXBlLCBRdWVyeVN0YXQgfSBmcm9tIFwiLi4vZmlsdGVyL2ZpbHRlcnNcIjtcbmltcG9ydCB7XG4gICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zLFxuICAgIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyxcbiAgICBpbmRleFRvU3RyaW5nLCBtZXJnZUZpZWxkV2l0aFNlbGVjdGlvblNldCxcbiAgICBwYXJzZVNlbGVjdGlvblNldCxcbiAgICBRUGFyYW1zLFxuICAgIHNlbGVjdGlvblRvU3RyaW5nLFxufSBmcm9tIFwiLi4vZmlsdGVyL2ZpbHRlcnNcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4uL2xvZ3NcIjtcbmltcG9ydCB7IGV4cGxhaW5TbG93UmVhc29uLCBpc0Zhc3RRdWVyeSB9IGZyb20gXCIuLi9maWx0ZXIvc2xvdy1kZXRlY3RvclwiO1xuaW1wb3J0IHR5cGUgeyBJU3RhdHMgfSBmcm9tIFwiLi4vdHJhY2VyXCI7XG5pbXBvcnQgeyBRVHJhY2VyLCBTdGF0c0NvdW50ZXIsIFN0YXRzR2F1Z2UsIFN0YXRzVGltaW5nIH0gZnJvbSBcIi4uL3RyYWNlclwiO1xuaW1wb3J0IHsgUUVycm9yLCB3cmFwIH0gZnJvbSBcIi4uL3V0aWxzXCI7XG5pbXBvcnQgRXZlbnRFbWl0dGVyIGZyb20gXCJldmVudHNcIjtcblxuY29uc3QgSU5ERVhFU19SRUZSRVNIX0lOVEVSVkFMID0gNjAgKiA2MCAqIDEwMDA7IC8vIDYwIG1pbnV0ZXNcblxuZXhwb3J0IGNvbnN0IFJlcXVlc3RFdmVudCA9IHtcbiAgICBDTE9TRTogXCJjbG9zZVwiLFxuICAgIEZJTklTSDogXCJmaW5pc2hcIixcbn07XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29udHJvbGxlciB7XG4gICAgZXZlbnRzOiBFdmVudEVtaXR0ZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnNldE1heExpc3RlbmVycygwKTtcbiAgICB9XG5cbiAgICBlbWl0Q2xvc2UoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkNMT1NFKTtcbiAgICB9XG5cbiAgICBmaW5pc2goKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoUmVxdWVzdEV2ZW50LkZJTklTSCk7XG4gICAgICAgIHRoaXMuZXZlbnRzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIHJlcXVlc3Q6IFJlcXVlc3RDb250cm9sbGVyLFxuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG4gICAgY2xpZW50OiBUb25DbGllbnQsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgdXNlZE1hbUFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBtdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZD86IGJvb2xlYW4sXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG5leHBvcnQgdHlwZSBBZ2dyZWdhdGlvbkFyZ3MgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRzPzogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgIGFjY2Vzc0tleT86IHN0cmluZyxcbn1cblxuZnVuY3Rpb24gY2hlY2tVc2VkQWNjZXNzS2V5KFxuICAgIHVzZWRBY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgYWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbik6ID9zdHJpbmcge1xuICAgIGlmICghYWNjZXNzS2V5KSB7XG4gICAgICAgIHJldHVybiB1c2VkQWNjZXNzS2V5O1xuICAgIH1cbiAgICBpZiAodXNlZEFjY2Vzc0tleSAmJiBhY2Nlc3NLZXkgIT09IHVzZWRBY2Nlc3NLZXkpIHtcbiAgICAgICAgY29udGV4dC5tdWx0aXBsZUFjY2Vzc0tleXNEZXRlY3RlZCA9IHRydWU7XG4gICAgICAgIHRocm93IFFFcnJvci5tdWx0aXBsZUFjY2Vzc0tleXMoKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc0tleTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVHcmFudGVkQWNjZXNzKFxuICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICBhcmdzOiBhbnksXG4pOiBQcm9taXNlPEFjY2Vzc1JpZ2h0cz4ge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZEFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRBY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2VzcyhhY2Nlc3NLZXkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFtQWNjZXNzUmVxdWlyZWQoY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBhcmdzOiBhbnkpIHtcbiAgICBjb25zdCBhY2Nlc3NLZXkgPSBhcmdzLmFjY2Vzc0tleTtcbiAgICBjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXkgPSBjaGVja1VzZWRBY2Nlc3NLZXkoY29udGV4dC51c2VkTWFtQWNjZXNzS2V5LCBhY2Nlc3NLZXksIGNvbnRleHQpO1xuICAgIGlmICghYWNjZXNzS2V5IHx8ICFjb250ZXh0LmNvbmZpZy5tYW1BY2Nlc3NLZXlzLmhhcyhhY2Nlc3NLZXkpKSB7XG4gICAgICAgIHRocm93IEF1dGgudW5hdXRob3JpemVkRXJyb3IoKTtcbiAgICB9XG59XG5cbmNvbnN0IGFjY2Vzc0dyYW50ZWQ6IEFjY2Vzc1JpZ2h0cyA9IHtcbiAgICBncmFudGVkOiB0cnVlLFxuICAgIHJlc3RyaWN0VG9BY2NvdW50czogW10sXG59O1xuXG5cbmV4cG9ydCB0eXBlIFFEYXRhU2NvcGVUeXBlID0gXCJtdXRhYmxlXCIgfCBcImltbXV0YWJsZVwiIHwgXCJjb3VudGVycGFydGllc1wiO1xuXG5leHBvcnQgY29uc3QgUURhdGFTY29wZSA9IHtcbiAgICBtdXRhYmxlOiBcIm11dGFibGVcIixcbiAgICBpbW11dGFibGU6IFwiaW1tdXRhYmxlXCIsXG4gICAgY291bnRlcnBhcnRpZXM6IFwiY291bnRlcnBhcnRpZXNcIixcbn07XG5cbmV4cG9ydCB0eXBlIFFDb2xsZWN0aW9uT3B0aW9ucyA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2NvcGU6IFFEYXRhU2NvcGVUeXBlLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGluZGV4ZXM6IFFJbmRleEluZm9bXSxcblxuICAgIHByb3ZpZGVyOiBRRGF0YVByb3ZpZGVyLFxuICAgIHNsb3dRdWVyaWVzUHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgbG9nczogUUxvZ3MsXG4gICAgYXV0aDogQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcbiAgICBzdGF0czogSVN0YXRzLFxuXG4gICAgaXNUZXN0czogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBjbGFzcyBRRGF0YUNvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBzY29wZTogUURhdGFTY29wZVR5cGU7XG4gICAgaW5kZXhlczogUUluZGV4SW5mb1tdO1xuICAgIGluZGV4ZXNSZWZyZXNoVGltZTogbnVtYmVyO1xuXG4gICAgLy8gRGVwZW5kZW5jaWVzXG4gICAgcHJvdmlkZXI6IFFEYXRhUHJvdmlkZXI7XG4gICAgc2xvd1F1ZXJpZXNQcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBpc1Rlc3RzOiBib29sZWFuO1xuXG4gICAgLy8gT3duXG4gICAgc3RhdERvYzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeTogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVRpbWU6IFN0YXRzVGltaW5nO1xuICAgIHN0YXRRdWVyeUZhaWxlZDogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeVNsb3c6IFN0YXRzQ291bnRlcjtcbiAgICBzdGF0UXVlcnlBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFdhaXRGb3JBY3RpdmU6IFN0YXRzR2F1Z2U7XG4gICAgc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uOiBTdGF0c0NvdW50ZXI7XG5cbiAgICB3YWl0Rm9yQ291bnQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25Db3VudDogbnVtYmVyO1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG4gICAgZG9jSW5zZXJ0T3JVcGRhdGU6IEV2ZW50RW1pdHRlcjtcbiAgICBob3RTdWJzY3JpcHRpb246IGFueTtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogUUNvbGxlY3Rpb25PcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBvcHRpb25zLm5hbWU7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IG9wdGlvbnMuZG9jVHlwZTtcbiAgICAgICAgdGhpcy5zY29wZSA9IG9wdGlvbnMuc2NvcGU7XG4gICAgICAgIHRoaXMuaW5kZXhlcyA9IG9wdGlvbnMuaW5kZXhlcztcblxuICAgICAgICB0aGlzLnByb3ZpZGVyID0gb3B0aW9ucy5wcm92aWRlcjtcbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgIHRoaXMuc2xvd1F1ZXJpZXNQcm92aWRlciA9IG9wdGlvbnMuc2xvd1F1ZXJpZXNQcm92aWRlcjtcbiAgICAgICAgdGhpcy5sb2cgPSBvcHRpb25zLmxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmF1dGggPSBvcHRpb25zLmF1dGg7XG4gICAgICAgIHRoaXMudHJhY2VyID0gb3B0aW9ucy50cmFjZXI7XG4gICAgICAgIHRoaXMuaXNUZXN0cyA9IG9wdGlvbnMuaXNUZXN0cztcblxuICAgICAgICB0aGlzLndhaXRGb3JDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSAwO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzID0gb3B0aW9ucy5zdGF0cztcbiAgICAgICAgdGhpcy5zdGF0RG9jID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMuZG9jLmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnkgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5jb3VudCwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5VGltZSA9IG5ldyBTdGF0c1RpbWluZyhzdGF0cywgU1RBVFMucXVlcnkudGltZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5QWN0aXZlID0gbmV3IFN0YXRzR2F1Z2Uoc3RhdHMsIFNUQVRTLnF1ZXJ5LmFjdGl2ZSwgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFF1ZXJ5RmFpbGVkID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuZmFpbGVkLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlTbG93ID0gbmV3IFN0YXRzQ291bnRlcihzdGF0cywgU1RBVFMucXVlcnkuc2xvdywgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSk7XG4gICAgICAgIHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShcbiAgICAgICAgICAgIHN0YXRzLFxuICAgICAgICAgICAgU1RBVFMud2FpdEZvci5hY3RpdmUsXG4gICAgICAgICAgICBbYGNvbGxlY3Rpb246JHtuYW1lfWBdLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb24gPSBuZXcgU3RhdHNDb3VudGVyKFxuICAgICAgICAgICAgc3RhdHMsXG4gICAgICAgICAgICBTVEFUUy5zdWJzY3JpcHRpb24uY291bnQsXG4gICAgICAgICAgICBbYGNvbGxlY3Rpb246JHtuYW1lfWBdLFxuICAgICAgICApO1xuICAgICAgICB0aGlzLnN0YXRTdWJzY3JpcHRpb25BY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShcbiAgICAgICAgICAgIHN0YXRzLFxuICAgICAgICAgICAgU1RBVFMuc3Vic2NyaXB0aW9uLmFjdGl2ZSxcbiAgICAgICAgICAgIFtgY29sbGVjdGlvbjoke25hbWV9YF0sXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZSA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5zZXRNYXhMaXN0ZW5lcnMoMCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcblxuICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IHRoaXMucHJvdmlkZXIuc3Vic2NyaWJlKFxuICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgZG9jID0+IHRoaXMub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyksXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLmhvdFN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5wcm92aWRlci51bnN1YnNjcmliZSh0aGlzLmhvdFN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmhvdFN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBkcm9wQ2FjaGVkRGJJbmZvKCkge1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdERvYy5pbmNyZW1lbnQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUuZW1pdChcImRvY1wiLCBkb2MpO1xuICAgICAgICAgICAgY29uc3QgaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlID0gdGhpcy5uYW1lID09PSBcIm1lc3NhZ2VzXCJcbiAgICAgICAgICAgICAgICAmJiBkb2MuX2tleVxuICAgICAgICAgICAgICAgICYmIGRvYy5tc2dfdHlwZSA9PT0gMVxuICAgICAgICAgICAgICAgICYmIGRvYy5zdGF0dXMgPT09IDU7XG4gICAgICAgICAgICBpZiAoaXNFeHRlcm5hbEluYm91bmRGaW5hbGl6ZWRNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbihcIm1lc3NhZ2VEYk5vdGlmaWNhdGlvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkT2Y6IFFUcmFjZXIubWVzc2FnZVJvb3RTcGFuQ29udGV4dChkb2MuX2tleSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5hZGRUYWdzKHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUlkOiBkb2MuX2tleSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFN1YnNjcmlwdGlvbi5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBuZXcgUURhdGFTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBldmVudExpc3RlbmVyID0gKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLnB1c2hEb2N1bWVudChkb2MpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJTVUJTQ1JJUFRJT05cXHRGQUlMRURcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShhcmdzLmZpbHRlciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUub24oXCJkb2NcIiwgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCArPSAxO1xuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKFwiZG9jXCIsIGV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy5zdWJzY3JpcHRpb25Db3VudCAtIDEpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gYWNjb3VudHMubGVuZ3RoID09PSAxXG4gICAgICAgICAgICA/IGA9PSBAJHtwYXJhbXMuYWRkKGFjY291bnRzWzBdKX1gXG4gICAgICAgICAgICA6IGBJTiBbJHthY2NvdW50cy5tYXAoeCA9PiBgQCR7cGFyYW1zLmFkZCh4KX1gKS5qb2luKFwiLFwiKX1dYDtcbiAgICAgICAgc3dpdGNoICh0aGlzLm5hbWUpIHtcbiAgICAgICAgY2FzZSBcImFjY291bnRzXCI6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgXCJ0cmFuc2FjdGlvbnNcIjpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLmFjY291bnRfYWRkciAke2NvbmRpdGlvbn1gO1xuICAgICAgICBjYXNlIFwibWVzc2FnZXNcIjpcbiAgICAgICAgICAgIHJldHVybiBgKGRvYy5zcmMgJHtjb25kaXRpb259KSBPUiAoZG9jLmRzdCAke2NvbmRpdGlvbn0pYDtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYnVpbGRGaWx0ZXJDb25kaXRpb24oXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBwYXJhbXM6IFFQYXJhbXMsXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwcmltYXJ5Q29uZGl0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IHRoaXMuZG9jVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBcImRvY1wiLCBmaWx0ZXIpXG4gICAgICAgICAgICA6IFwiXCI7XG4gICAgICAgIGNvbnN0IGFkZGl0aW9uYWxDb25kaXRpb24gPSB0aGlzLmdldEFkZGl0aW9uYWxDb25kaXRpb24oYWNjZXNzUmlnaHRzLCBwYXJhbXMpO1xuICAgICAgICBpZiAocHJpbWFyeUNvbmRpdGlvbiA9PT0gXCJmYWxzZVwiIHx8IGFkZGl0aW9uYWxDb25kaXRpb24gPT09IFwiZmFsc2VcIikge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG5cbiAgICB9XG5cbiAgICBidWlsZFJldHVybkV4cHJlc3Npb24oc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSwgb3JkZXJCeTogT3JkZXJCeVtdKTogc3RyaW5nIHtcbiAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldChcIl9rZXlcIiwgXCJkb2MuX2tleVwiKTtcbiAgICAgICAgY29uc3QgZmllbGRzID0gdGhpcy5kb2NUeXBlLmZpZWxkcztcbiAgICAgICAgaWYgKGZpZWxkcykge1xuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsIFwiZG9jXCIsIHNlbGVjdGlvbnMsIGZpZWxkcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3JkZXJCeVNlbGVjdGlvblNldCA9IHtcbiAgICAgICAgICAgICAgICAgICAga2luZDogXCJTZWxlY3Rpb25TZXRcIixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uczogW10sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygb3JkZXJCeSkge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZUZpZWxkV2l0aFNlbGVjdGlvblNldChpdGVtLnBhdGgsIG9yZGVyQnlTZWxlY3Rpb25TZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgICAgICBcImRvY1wiLFxuICAgICAgICAgICAgICAgICAgICBvcmRlckJ5U2VsZWN0aW9uU2V0LnNlbGVjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGV4cHJlc3Npb25zLmRlbGV0ZShcImlkXCIpO1xuICAgICAgICByZXR1cm4gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ/OiBzdHJpbmcsXG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdGlvbkluZm86IGFueSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgY29uZGl0aW9uID0gdGhpcy5idWlsZEZpbHRlckNvbmRpdGlvbihmaWx0ZXIsIHBhcmFtcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgaWYgKGNvbmRpdGlvbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IGNvbmRpdGlvbiA/IGBGSUxURVIgJHtjb25kaXRpb259YCA6IFwiXCI7XG4gICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gc2VsZWN0aW9uSW5mby5zZWxlY3Rpb25zXG4gICAgICAgICAgICA/IHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvbkluZm8sIHRoaXMubmFtZSlcbiAgICAgICAgICAgIDogc2VsZWN0aW9uSW5mbztcbiAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IE1hdGgubWluKGFyZ3MubGltaXQgfHwgNTAsIDUwKTtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSBcImRlc2NcIilcbiAgICAgICAgICAgICAgICAgICAgPyBcIiBERVNDXCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgXCJfa2V5XCIpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIsIFwiKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSBcIlwiID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogXCJcIjtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcbiAgICAgICAgY29uc3QgcmV0dXJuRXhwcmVzc2lvbiA9IHRoaXMuYnVpbGRSZXR1cm5FeHByZXNzaW9uKHNlbGVjdGlvbkluZm8uc2VsZWN0aW9ucywgb3JkZXJCeSk7XG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOICR7cmV0dXJuRXhwcmVzc2lvbn1gO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb24sXG4gICAgICAgICAgICBvcmRlckJ5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgb3BlcmF0aW9uSWQ6IGFyZ3Mub3BlcmF0aW9uSWQgfHwgbnVsbCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXMsXG4gICAgICAgICAgICBhY2Nlc3NSaWdodHMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0UXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICBsZXQgc3RhdEtleSA9IHRleHQ7XG4gICAgICAgIGlmIChvcmRlckJ5ICYmIG9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3RhdEtleSA9IGAke3N0YXRLZXl9JHtvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0gJHt4LmRpcmVjdGlvbn1gKS5qb2luKFwiIFwiKX1gO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzdGF0ID0gdGhpcy5xdWVyeVN0YXRzLmdldChzdGF0S2V5KTtcbiAgICAgICAgaWYgKHN0YXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc3RhdCA9IHtcbiAgICAgICAgICAgICAgICBpc0Zhc3Q6IGlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlcyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyQnkgfHwgW10sXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUsXG4gICAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHN0YXRLZXksIHN0YXQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdGF0LmlzRmFzdDtcbiAgICB9XG5cbiAgICBleHBsYWluUXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgX2NvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgICAgIF9pbmZvOiBhbnksXG4gICAgICAgICkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jaGVja1JlZnJlc2hJbmZvKCk7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIHt9LCBncmFudGVkQWNjZXNzKTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGlzRmFzdDogdHJ1ZSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGF3YWl0IGV4cGxhaW5TbG93UmVhc29uKFxuICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4ZXMsXG4gICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgIHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgIHEub3JkZXJCeSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGlzRmFzdDogc2xvd1JlYXNvbiA9PT0gbnVsbCxcbiAgICAgICAgICAgICAgICAuLi4oc2xvd1JlYXNvbiA/IHsgc2xvd1JlYXNvbiB9IDoge30pLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKFxuICAgICAgICAgICAgcGFyZW50OiBhbnksXG4gICAgICAgICAgICBhcmdzOiBhbnksXG4gICAgICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBpbmZvOiBhbnksXG4gICAgICAgICkgPT4gd3JhcCh0aGlzLmxvZywgXCJRVUVSWVwiLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgbGV0IHE6ID9EYXRhYmFzZVF1ZXJ5ID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLmZpZWxkTm9kZXNbMF0uc2VsZWN0aW9uU2V0LCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcIlFVRVJZXCIsIGFyZ3MsIDAsIFwiU0tJUFBFRFwiLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGlzRmFzdCA9IGF3YWl0IGNoZWNrSXNGYXN0KGNvbnRleHQuY29uZmlnLCAoKSA9PiB0aGlzLmlzRmFzdFF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICAoKHE6IGFueSk6IERhdGFiYXNlUXVlcnkpLnRleHQsXG4gICAgICAgICAgICAgICAgICAgICgocTogYW55KTogRGF0YWJhc2VRdWVyeSkuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICAoKHE6IGFueSk6IERhdGFiYXNlUXVlcnkpLm9yZGVyQnksXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc0Zhc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlTbG93LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB0cmFjZVBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFjZVBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgXCJCRUZPUkVfUVVFUllcIixcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gXCJGQVNUXCIgOiBcIlNMT1dcIiwgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocS50ZXh0LCBxLnBhcmFtcywgcS5vcmRlckJ5LCBpc0Zhc3QsIHRyYWNlUGFyYW1zLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgXCJRVUVSWVwiLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/IFwiRkFTVFwiIDogXCJTTE9XXCIsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQubGVuZ3RoID4gcS5saW1pdCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuc3BsaWNlKHEubGltaXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUZhaWxlZC5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICBpZiAocSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbG93UmVhc29uID0gZXhwbGFpblNsb3dSZWFzb24oXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGV4ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHEub3JkZXJCeSxcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNsb3dSZWFzb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgKz0gYC4gUXVlcnkgd2FzIGRldGVjdGVkIGFzIGEgc2xvdy4gJHtzbG93UmVhc29uLnN1bW1hcnl9LiBTZWUgZXJyb3IgZGF0YSBmb3IgZGV0YWlscy5gO1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IuZGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuLi5lcnJvci5kYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNsb3dSZWFzb24sXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICB2YXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICAgICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBpbXBsID0gYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKFwicGFyYW1zXCIsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5UHJvdmlkZXIodGV4dCwgdmFycywgb3JkZXJCeSwgaXNGYXN0LCBjb250ZXh0KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnlgLCBpbXBsLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5UHJvdmlkZXIoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBpc0Zhc3QgPyB0aGlzLnByb3ZpZGVyIDogdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICByZXR1cm4gcHJvdmlkZXIucXVlcnkodGV4dCwgdmFycywgb3JkZXJCeSk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IoXG4gICAgICAgIHE6IERhdGFiYXNlUXVlcnksXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgdHJhY2VQYXJhbXM6IGFueSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGltcGwgPSBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHRyYWNlUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoXCJwYXJhbXNcIiwgdHJhY2VQYXJhbXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHdhaXRGb3I6ID8oKGRvYzogYW55KSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBoYXNEYlJlc3BvbnNlID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZU9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29uc3QgcmVzb2x2ZUJ5ID0gKHJlYXNvbjogc3RyaW5nLCByZXNvbHZlOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHJlc3VsdDogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVkQnkgPSByZWFzb247XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgY29udGV4dC5yZXF1ZXN0LmV2ZW50cy5vbihSZXF1ZXN0RXZlbnQuQ0xPU0UsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlQnkoXCJjbG9zZVwiLCByZXNvbHZlT25DbG9zZSwgW10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeVByb3ZpZGVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEudGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLm9yZGVyQnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNGYXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICApLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNEYlJlc3BvbnNlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmVCeShcInF1ZXJ5XCIsIHJlc29sdmUsIGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXV0aEZpbHRlciA9IFFEYXRhTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcih0aGlzLm5hbWUsIHEuYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXRoRmlsdGVyICYmICFhdXRoRmlsdGVyKGRvYykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHEuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoXCJsaXN0ZW5lclwiLCByZXNvbHZlLCBbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRGF0ZS5ub3coKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlFVRVJZXFx0RkFJTEVEXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHEuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3IudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndhaXRGb3JDb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLm9uKFwiZG9jXCIsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRXYWl0Rm9yQWN0aXZlLmluY3JlbWVudCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0RiUmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoXCJ0aW1lb3V0XCIsIHJlc29sdmUsIFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KFFFcnJvci5xdWVyeVRlcm1pbmF0ZWRPblRpbWVvdXQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHEudGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DbG9zZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmVPbkNsb3NlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xvc2UsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoXCJyZXNvbHZlZFwiLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLndhaXRGb3JDb3VudCAtIDEpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnJlbW92ZUxpc3RlbmVyKFwiZG9jXCIsIHdhaXRGb3IpO1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3JgLCBpbXBsLCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEFnZ3JlZ2F0ZXNcblxuXG4gICAgY3JlYXRlQWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIGZpZWxkczogRmllbGRBZ2dyZWdhdGlvbltdLFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/e1xuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIGhlbHBlcnM6IEFnZ3JlZ2F0aW9uSGVscGVyW10sXG4gICAgfSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IHRoaXMuYnVpbGRGaWx0ZXJDb25kaXRpb24oZmlsdGVyLCBwYXJhbXMsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gQWdncmVnYXRpb25IZWxwZXJGYWN0b3J5LmNyZWF0ZVF1ZXJ5KHRoaXMubmFtZSwgY29uZGl0aW9uIHx8IFwiXCIsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0ZXh0OiBxdWVyeS50ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgaGVscGVyczogcXVlcnkuaGVscGVycyxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBmb3IgKGNvbnN0IGg6IEFnZ3JlZ2F0aW9uSGVscGVyIG9mIGhlbHBlcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGMgPSBoLmNvbnRleHQ7XG4gICAgICAgICAgICBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5DT1VOVCkge1xuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkodGV4dCwgZmlsdGVyKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NSU4gfHwgYy5mbiA9PT0gQWdncmVnYXRpb25Gbi5NQVgpIHtcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGMuZmllbGQucGF0aDtcbiAgICAgICAgICAgICAgICBpZiAocGF0aC5zdGFydHNXaXRoKFwiZG9jLlwiKSkge1xuICAgICAgICAgICAgICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHIoXCJkb2MuXCIubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IFwiQVNDXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgYWdncmVnYXRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogQWdncmVnYXRpb25BcmdzLFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csIFwiQUdHUkVHQVRFXCIsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5LmluY3JlbWVudCgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlBY3RpdmUuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IEFycmF5LmlzQXJyYXkoYXJncy5maWVsZHMpICYmIGFyZ3MuZmllbGRzLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhcmdzLmZpZWxkc1xuICAgICAgICAgICAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjogQWdncmVnYXRpb25Gbi5DT1VOVCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVBZ2dyZWdhdGlvblF1ZXJ5KGZpbHRlciwgZmllbGRzLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhcIkFHR1JFR0FURVwiLCBhcmdzLCAwLCBcIlNLSVBQRURcIiwgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCBjaGVja0lzRmFzdChjb250ZXh0LmNvbmZpZywgKCkgPT4gdGhpcy5pc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5KFxuICAgICAgICAgICAgICAgICAgICBxLnRleHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgcS5oZWxwZXJzLFxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIocS50ZXh0LCBxLnBhcmFtcywgW10sIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgIFwiQUdHUkVHQVRFXCIsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCxcbiAgICAgICAgICAgICAgICAgICAgaXNGYXN0ID8gXCJGQVNUXCIgOiBcIlNMT1dcIiwgY29udGV4dC5yZW1vdGVBZGRyZXNzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jb252ZXJ0UmVzdWx0cyhyZXN1bHQsIHEuaGVscGVycyk7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5VGltZS5yZXBvcnQoRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5kZWNyZW1lbnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0SW5kZXhlcygpOiBQcm9taXNlPFFJbmRleEluZm9bXT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wcm92aWRlci5nZXRDb2xsZWN0aW9uSW5kZXhlcyh0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEludGVybmFsc1xuXG4gICAgYXN5bmMgY2hlY2tSZWZyZXNoSW5mbygpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUZXN0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChEYXRlLm5vdygpIDwgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCkgKyBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUw7XG4gICAgICAgIGNvbnN0IGFjdHVhbEluZGV4ZXMgPSBhd2FpdCB0aGlzLmdldEluZGV4ZXMoKTtcblxuICAgICAgICBjb25zdCBzYW1lSW5kZXhlcyA9IChhSW5kZXhlczogUUluZGV4SW5mb1tdLCBiSW5kZXhlczogUUluZGV4SW5mb1tdKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBhUmVzdCA9IG5ldyBTZXQoYUluZGV4ZXMubWFwKGluZGV4VG9TdHJpbmcpKTtcbiAgICAgICAgICAgIGZvciAoY29uc3QgYkluZGV4IG9mIGJJbmRleGVzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYkluZGV4U3RyaW5nID0gaW5kZXhUb1N0cmluZyhiSW5kZXgpO1xuICAgICAgICAgICAgICAgIGlmIChhUmVzdC5oYXMoYkluZGV4U3RyaW5nKSkge1xuICAgICAgICAgICAgICAgICAgICBhUmVzdC5kZWxldGUoYkluZGV4U3RyaW5nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFSZXN0LnNpemUgPT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIGlmICghc2FtZUluZGV4ZXMoYWN0dWFsSW5kZXhlcywgdGhpcy5pbmRleGVzKSkge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXCJSRUxPQURfSU5ERVhFU1wiLCBhY3R1YWxJbmRleGVzKTtcbiAgICAgICAgICAgIHRoaXMuaW5kZXhlcyA9IGFjdHVhbEluZGV4ZXMubWFwKHggPT4gKHsgZmllbGRzOiB4LmZpZWxkcyB9KSk7XG4gICAgICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuY2xlYXIoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvYyhcbiAgICAgICAgZmllbGRWYWx1ZTogYW55LFxuICAgICAgICBmaWVsZFBhdGg6IHN0cmluZyxcbiAgICAgICAgYXJnczogeyB0aW1lb3V0PzogbnVtYmVyIH0sXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXMgPSBmaWVsZFBhdGguZW5kc1dpdGgoXCJbKl1cIilcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBbZmllbGRQYXRoLnNsaWNlKDAsIC0zKV06IHsgYW55OiB7IGVxOiBmaWVsZFZhbHVlIH0gfSB9LFxuICAgICAgICAgICAgICAgIHRleHQ6IGBGT1IgZG9jIElOICR7dGhpcy5uYW1lfSBGSUxURVIgQHYgSU4gZG9jLiR7ZmllbGRQYXRofSBSRVRVUk4gZG9jYCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IHsgdjogZmllbGRWYWx1ZSB9LFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgOiB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiB7IGlkOiB7IGVxOiBmaWVsZFZhbHVlIH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIGRvYy4ke2ZpZWxkUGF0aH0gPT0gQHYgUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IChhcmdzLnRpbWVvdXQgPT09IDApID8gMCA6IChhcmdzLnRpbWVvdXQgfHwgNDAwMDApO1xuICAgICAgICBpZiAodGltZW91dCA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlQcm92aWRlcihcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHF1ZXJ5UGFyYW1zLnBhcmFtcyxcbiAgICAgICAgICAgICAgICBbXSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBkb2NzID0gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBxdWVyeVBhcmFtcy5maWx0ZXIsXG4gICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBbXSxcbiAgICAgICAgICAgICAgICBvcmRlckJ5OiBbXSxcbiAgICAgICAgICAgICAgICBsaW1pdDogMSxcbiAgICAgICAgICAgICAgICB0aW1lb3V0LFxuICAgICAgICAgICAgICAgIG9wZXJhdGlvbklkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRleHQ6IHF1ZXJ5UGFyYW1zLnRleHQsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzOiBhY2Nlc3NHcmFudGVkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRvY3NbMF07XG4gICAgfVxuXG4gICAgYXN5bmMgd2FpdEZvckRvY3MoXG4gICAgICAgIGZpZWxkVmFsdWVzOiBzdHJpbmdbXSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWZpZWxkVmFsdWVzIHx8IGZpZWxkVmFsdWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGZpZWxkVmFsdWVzLm1hcCh2YWx1ZSA9PiB0aGlzLndhaXRGb3JEb2MoXG4gICAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICAgIGZpZWxkUGF0aCxcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICApKSk7XG4gICAgfVxuXG4gICAgZmluaXNoT3BlcmF0aW9ucyhvcGVyYXRpb25JZHM6IFNldDxzdHJpbmc+KTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgdG9DbG9zZSA9IFtdO1xuICAgICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgbGlzdGVuZXIgY2FuY2VsbGF0aW9uIGJhc2VkIG9uIG9wZXJhdGlvbklkXG4gICAgICAgIC8vIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgLy8gICAgIGlmIChsaXN0ZW5lci5vcGVyYXRpb25JZCAmJiBvcGVyYXRpb25JZHMuaGFzKGxpc3RlbmVyLm9wZXJhdGlvbklkKSkge1xuICAgICAgICAvLyAgICAgICAgIHRvQ2xvc2UucHVzaChsaXN0ZW5lcik7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gdG9DbG9zZS5mb3JFYWNoKHggPT4geC5jbG9zZSgpKTtcbiAgICAgICAgcmV0dXJuIHRvQ2xvc2UubGVuZ3RoO1xuICAgIH1cblxufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0lzRmFzdChjb25maWc6IFFDb25maWcsIGRldGVjdG9yOiAoKSA9PiBQcm9taXNlPGJvb2xlYW4+KTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKGNvbmZpZy5zbG93UXVlcmllcyA9PT0gc2xvd1F1ZXJpZXMuZW5hYmxlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCBkZXRlY3RvcigpO1xuICAgIGlmICghaXNGYXN0ICYmIGNvbmZpZy5zbG93UXVlcmllcyA9PT0gc2xvd1F1ZXJpZXMuZGlzYWJsZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTbG93IHF1ZXJpZXMgYXJlIGRpc2FibGVkXCIpO1xuICAgIH1cbiAgICByZXR1cm4gaXNGYXN0O1xufVxuIl19