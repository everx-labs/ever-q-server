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
    const limit = args.limit || 50;
    const timeout = Number(args.timeout) || 0;
    const orderByText = orderBy.map(field => {
      const direction = field.direction && field.direction.toLowerCase() === "desc" ? " DESC" : "";
      return `doc.${field.path.replace(/\bid\b/gi, "_key")}${direction}`;
    }).join(", ");
    const sortSection = orderByText !== "" ? `SORT ${orderByText}` : "";
    const limitText = Math.min(limit, 50);
    const limitSection = `LIMIT ${limitText}`;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZGF0YS9jb2xsZWN0aW9uLmpzIl0sIm5hbWVzIjpbIklOREVYRVNfUkVGUkVTSF9JTlRFUlZBTCIsIlJlcXVlc3RFdmVudCIsIkNMT1NFIiwiRklOSVNIIiwiUmVxdWVzdENvbnRyb2xsZXIiLCJjb25zdHJ1Y3RvciIsImV2ZW50cyIsIkV2ZW50RW1pdHRlciIsInNldE1heExpc3RlbmVycyIsImVtaXRDbG9zZSIsImVtaXQiLCJmaW5pc2giLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJjaGVja1VzZWRBY2Nlc3NLZXkiLCJ1c2VkQWNjZXNzS2V5IiwiYWNjZXNzS2V5IiwiY29udGV4dCIsIm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkIiwiUUVycm9yIiwibXVsdGlwbGVBY2Nlc3NLZXlzIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhcmdzIiwiYXV0aCIsIm1hbUFjY2Vzc1JlcXVpcmVkIiwidXNlZE1hbUFjY2Vzc0tleSIsImNvbmZpZyIsIm1hbUFjY2Vzc0tleXMiLCJoYXMiLCJBdXRoIiwidW5hdXRob3JpemVkRXJyb3IiLCJhY2Nlc3NHcmFudGVkIiwiZ3JhbnRlZCIsInJlc3RyaWN0VG9BY2NvdW50cyIsIlFEYXRhU2NvcGUiLCJtdXRhYmxlIiwiaW1tdXRhYmxlIiwiY291bnRlcnBhcnRpZXMiLCJRRGF0YUNvbGxlY3Rpb24iLCJvcHRpb25zIiwibmFtZSIsImRvY1R5cGUiLCJzY29wZSIsImluZGV4ZXMiLCJwcm92aWRlciIsImluZGV4ZXNSZWZyZXNoVGltZSIsIkRhdGUiLCJub3ciLCJzbG93UXVlcmllc1Byb3ZpZGVyIiwibG9nIiwibG9ncyIsImNyZWF0ZSIsInRyYWNlciIsImlzVGVzdHMiLCJ3YWl0Rm9yQ291bnQiLCJzdWJzY3JpcHRpb25Db3VudCIsInN0YXRzIiwic3RhdERvYyIsIlN0YXRzQ291bnRlciIsIlNUQVRTIiwiZG9jIiwiY291bnQiLCJzdGF0UXVlcnkiLCJxdWVyeSIsInN0YXRRdWVyeVRpbWUiLCJTdGF0c1RpbWluZyIsInRpbWUiLCJzdGF0UXVlcnlBY3RpdmUiLCJTdGF0c0dhdWdlIiwiYWN0aXZlIiwic3RhdFF1ZXJ5RmFpbGVkIiwiZmFpbGVkIiwic3RhdFF1ZXJ5U2xvdyIsInNsb3ciLCJzdGF0V2FpdEZvckFjdGl2ZSIsIndhaXRGb3IiLCJzdGF0U3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uIiwic3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSIsImRvY0luc2VydE9yVXBkYXRlIiwicXVlcnlTdGF0cyIsIk1hcCIsIm1heFF1ZXVlU2l6ZSIsImhvdFN1YnNjcmlwdGlvbiIsInN1YnNjcmliZSIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsImNsb3NlIiwidW5zdWJzY3JpYmUiLCJkcm9wQ2FjaGVkRGJJbmZvIiwiaW5jcmVtZW50IiwidGhlbiIsImlzRXh0ZXJuYWxJbmJvdW5kRmluYWxpemVkTWVzc2FnZSIsIl9rZXkiLCJtc2dfdHlwZSIsInN0YXR1cyIsInNwYW4iLCJzdGFydFNwYW4iLCJjaGlsZE9mIiwiUVRyYWNlciIsIm1lc3NhZ2VSb290U3BhbkNvbnRleHQiLCJhZGRUYWdzIiwibWVzc2FnZUlkIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJfIiwiaW5mbyIsImFjY2Vzc1JpZ2h0cyIsIlFEYXRhU3Vic2NyaXB0aW9uIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwiZXZlbnRMaXN0ZW5lciIsInB1c2hEb2N1bWVudCIsImVycm9yIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvU3RyaW5nIiwib24iLCJvbkNsb3NlIiwicmVtb3ZlTGlzdGVuZXIiLCJNYXRoIiwibWF4IiwiZ2V0QWRkaXRpb25hbENvbmRpdGlvbiIsInBhcmFtcyIsImFjY291bnRzIiwibGVuZ3RoIiwiY29uZGl0aW9uIiwiYWRkIiwibWFwIiwieCIsImpvaW4iLCJidWlsZEZpbHRlckNvbmRpdGlvbiIsInByaW1hcnlDb25kaXRpb24iLCJPYmplY3QiLCJrZXlzIiwiZmlsdGVyQ29uZGl0aW9uIiwiYWRkaXRpb25hbENvbmRpdGlvbiIsImJ1aWxkUmV0dXJuRXhwcmVzc2lvbiIsInNlbGVjdGlvbnMiLCJvcmRlckJ5IiwiZXhwcmVzc2lvbnMiLCJzZXQiLCJmaWVsZHMiLCJvcmRlckJ5U2VsZWN0aW9uU2V0Iiwia2luZCIsIml0ZW0iLCJwYXRoIiwiZGVsZXRlIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsImxpbWl0IiwidGltZW91dCIsIk51bWJlciIsIm9yZGVyQnlUZXh0IiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInJldHVybkV4cHJlc3Npb24iLCJ0ZXh0Iiwib3BlcmF0aW9uSWQiLCJ2YWx1ZXMiLCJpc0Zhc3RRdWVyeSIsImNoZWNrUmVmcmVzaEluZm8iLCJzdGF0S2V5Iiwic3RhdCIsImdldCIsInVuZGVmaW5lZCIsImlzRmFzdCIsImNvbnNvbGUiLCJleHBsYWluUXVlcnlSZXNvbHZlciIsInBhcmVudCIsIl9jb250ZXh0IiwiX2luZm8iLCJxIiwiZ3JhbnRlZEFjY2VzcyIsInNsb3dSZWFzb24iLCJxdWVyeVJlc29sdmVyIiwic3RhcnQiLCJmaWVsZE5vZGVzIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwiY2hlY2tJc0Zhc3QiLCJ0cmFjZVBhcmFtcyIsInJlc3VsdCIsInF1ZXJ5V2FpdEZvciIsInNwbGljZSIsIm1lc3NhZ2UiLCJzdW1tYXJ5IiwiZGF0YSIsInJlcG9ydCIsImRlY3JlbWVudCIsInJlcXVlc3QiLCJ2YXJzIiwiaW1wbCIsInNldFRhZyIsInF1ZXJ5UHJvdmlkZXIiLCJ0cmFjZSIsInBhcmVudFNwYW4iLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5IiwiaGFzRGJSZXNwb25zZSIsInJlc29sdmVPbkNsb3NlIiwicmVzb2x2ZUJ5IiwicmVhc29uIiwicmVzb2x2ZSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVqZWN0IiwiY2hlY2siLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJhdXRoRmlsdGVyIiwiUURhdGFMaXN0ZW5lciIsImdldEF1dGhGaWx0ZXIiLCJ0ZXN0Iiwib25UaW1lb3V0IiwicXVlcnlUZXJtaW5hdGVkT25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsImNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkiLCJBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkiLCJjcmVhdGVRdWVyeSIsImhlbHBlcnMiLCJpc0Zhc3RBZ2dyZWdhdGlvblF1ZXJ5IiwiaCIsImMiLCJmbiIsIkFnZ3JlZ2F0aW9uRm4iLCJDT1VOVCIsIk1JTiIsIk1BWCIsInN0YXJ0c1dpdGgiLCJzdWJzdHIiLCJhZ2dyZWdhdGlvblJlc29sdmVyIiwiQXJyYXkiLCJpc0FycmF5IiwiY29udmVydFJlc3VsdHMiLCJnZXRJbmRleGVzIiwiZ2V0Q29sbGVjdGlvbkluZGV4ZXMiLCJhY3R1YWxJbmRleGVzIiwic2FtZUluZGV4ZXMiLCJhSW5kZXhlcyIsImJJbmRleGVzIiwiYVJlc3QiLCJTZXQiLCJpbmRleFRvU3RyaW5nIiwiYkluZGV4IiwiYkluZGV4U3RyaW5nIiwic2l6ZSIsImNsZWFyIiwid2FpdEZvckRvYyIsImZpZWxkVmFsdWUiLCJmaWVsZFBhdGgiLCJxdWVyeVBhcmFtcyIsImVuZHNXaXRoIiwic2xpY2UiLCJhbnkiLCJlcSIsInYiLCJpZCIsIndhaXRGb3JEb2NzIiwiZmllbGRWYWx1ZXMiLCJhbGwiLCJ2YWx1ZSIsImZpbmlzaE9wZXJhdGlvbnMiLCJvcGVyYXRpb25JZHMiLCJ0b0Nsb3NlIiwiZGV0ZWN0b3IiLCJzbG93UXVlcmllcyIsImVuYWJsZSIsImRpc2FibGUiLCJFcnJvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUVBOztBQUNBOztBQUdBOztBQVNBOztBQUNBOztB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QSxNQUFJLENBQUNyRyxNQUFELElBQVdwSixNQUFNLENBQUMwUCxXQUFQLEtBQXVCQSxvQkFBWUUsT0FBbEQsRUFBMkQ7QUFDdkQsVUFBTSxJQUFJQyxLQUFKLENBQVUsMkJBQVYsQ0FBTjtBQUNIOztBQUNELFNBQU96RyxNQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbipcbiogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4qIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuKiBMaWNlbnNlIGF0OlxuKlxuKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbipcbiogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4qIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4qL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgeyBUb25DbGllbnQgfSBmcm9tIFwiQHRvbmNsaWVudC9jb3JlXCI7XG5pbXBvcnQgeyBBZ2dyZWdhdGlvbkZuLCBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB0eXBlIHsgRmllbGRBZ2dyZWdhdGlvbiwgQWdncmVnYXRpb25IZWxwZXIgfSBmcm9tIFwiLi9hZ2dyZWdhdGlvbnNcIjtcbmltcG9ydCB0eXBlIHsgUURhdGFQcm92aWRlciwgUUluZGV4SW5mbyB9IGZyb20gXCIuL2RhdGEtcHJvdmlkZXJcIjtcbmltcG9ydCB7IFFEYXRhTGlzdGVuZXIsIFFEYXRhU3Vic2NyaXB0aW9uIH0gZnJvbSBcIi4vbGlzdGVuZXJcIjtcbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4uL2F1dGhcIjtcbmltcG9ydCB7IEF1dGgsIGdyYW50ZWRBY2Nlc3MgfSBmcm9tIFwiLi4vYXV0aFwiO1xuaW1wb3J0IHsgc2xvd1F1ZXJpZXMsIFNUQVRTIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHR5cGUgeyBEYXRhYmFzZVF1ZXJ5LCBHRGVmaW5pdGlvbiwgT3JkZXJCeSwgUVR5cGUsIFF1ZXJ5U3RhdCB9IGZyb20gXCIuLi9maWx0ZXIvZmlsdGVyc1wiO1xuaW1wb3J0IHtcbiAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMsXG4gICAgY29tYmluZVJldHVybkV4cHJlc3Npb25zLFxuICAgIGluZGV4VG9TdHJpbmcsIG1lcmdlRmllbGRXaXRoU2VsZWN0aW9uU2V0LFxuICAgIHBhcnNlU2VsZWN0aW9uU2V0LFxuICAgIFFQYXJhbXMsXG4gICAgc2VsZWN0aW9uVG9TdHJpbmcsXG59IGZyb20gXCIuLi9maWx0ZXIvZmlsdGVyc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4uL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi4vbG9nc1wiO1xuaW1wb3J0IHsgZXhwbGFpblNsb3dSZWFzb24sIGlzRmFzdFF1ZXJ5IH0gZnJvbSBcIi4uL2ZpbHRlci9zbG93LWRldGVjdG9yXCI7XG5pbXBvcnQgdHlwZSB7IElTdGF0cyB9IGZyb20gXCIuLi90cmFjZXJcIjtcbmltcG9ydCB7IFFUcmFjZXIsIFN0YXRzQ291bnRlciwgU3RhdHNHYXVnZSwgU3RhdHNUaW1pbmcgfSBmcm9tIFwiLi4vdHJhY2VyXCI7XG5pbXBvcnQgeyBRRXJyb3IsIHdyYXAgfSBmcm9tIFwiLi4vdXRpbHNcIjtcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSBcImV2ZW50c1wiO1xuXG5jb25zdCBJTkRFWEVTX1JFRlJFU0hfSU5URVJWQUwgPSA2MCAqIDYwICogMTAwMDsgLy8gNjAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgUmVxdWVzdEV2ZW50ID0ge1xuICAgIENMT1NFOiBcImNsb3NlXCIsXG4gICAgRklOSVNIOiBcImZpbmlzaFwiLFxufTtcblxuZXhwb3J0IGNsYXNzIFJlcXVlc3RDb250cm9sbGVyIHtcbiAgICBldmVudHM6IEV2ZW50RW1pdHRlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5ldmVudHMuc2V0TWF4TGlzdGVuZXJzKDApO1xuICAgIH1cblxuICAgIGVtaXRDbG9zZSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuQ0xPU0UpO1xuICAgIH1cblxuICAgIGZpbmlzaCgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChSZXF1ZXN0RXZlbnQuRklOSVNIKTtcbiAgICAgICAgdGhpcy5ldmVudHMucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgcmVxdWVzdDogUmVxdWVzdENvbnRyb2xsZXIsXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgc3RhdHM6IElTdGF0cyxcbiAgICBjbGllbnQ6IFRvbkNsaWVudCxcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYWNjZXNzS2V5OiBzdHJpbmcsXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICB1c2VkTWFtQWNjZXNzS2V5OiA/c3RyaW5nLFxuICAgIG11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkPzogYm9vbGVhbixcbiAgICBwYXJlbnRTcGFuOiAoU3BhbiB8IFNwYW5Db250ZXh0IHwgdHlwZW9mIHVuZGVmaW5lZCksXG5cbiAgICBzaGFyZWQ6IE1hcDxzdHJpbmcsIGFueT4sXG59XG5cbmV4cG9ydCB0eXBlIEFnZ3JlZ2F0aW9uQXJncyA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZHM/OiBGaWVsZEFnZ3JlZ2F0aW9uW10sXG4gICAgYWNjZXNzS2V5Pzogc3RyaW5nLFxufVxuXG5mdW5jdGlvbiBjaGVja1VzZWRBY2Nlc3NLZXkoXG4gICAgdXNlZEFjY2Vzc0tleTogP3N0cmluZyxcbiAgICBhY2Nlc3NLZXk6ID9zdHJpbmcsXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuKTogP3N0cmluZyB7XG4gICAgaWYgKCFhY2Nlc3NLZXkpIHtcbiAgICAgICAgcmV0dXJuIHVzZWRBY2Nlc3NLZXk7XG4gICAgfVxuICAgIGlmICh1c2VkQWNjZXNzS2V5ICYmIGFjY2Vzc0tleSAhPT0gdXNlZEFjY2Vzc0tleSkge1xuICAgICAgICBjb250ZXh0Lm11bHRpcGxlQWNjZXNzS2V5c0RldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhyb3cgUUVycm9yLm11bHRpcGxlQWNjZXNzS2V5cygpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzS2V5O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVxdWlyZUdyYW50ZWRBY2Nlc3MoXG4gICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgIGFyZ3M6IGFueSxcbik6IFByb21pc2U8QWNjZXNzUmlnaHRzPiB7XG4gICAgY29uc3QgYWNjZXNzS2V5ID0gY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXk7XG4gICAgY29udGV4dC51c2VkQWNjZXNzS2V5ID0gY2hlY2tVc2VkQWNjZXNzS2V5KGNvbnRleHQudXNlZEFjY2Vzc0tleSwgYWNjZXNzS2V5LCBjb250ZXh0KTtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGFjY2Vzc0tleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYW1BY2Nlc3NSZXF1aXJlZChjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGFyZ3M6IGFueSkge1xuICAgIGNvbnN0IGFjY2Vzc0tleSA9IGFyZ3MuYWNjZXNzS2V5O1xuICAgIGNvbnRleHQudXNlZE1hbUFjY2Vzc0tleSA9IGNoZWNrVXNlZEFjY2Vzc0tleShjb250ZXh0LnVzZWRNYW1BY2Nlc3NLZXksIGFjY2Vzc0tleSwgY29udGV4dCk7XG4gICAgaWYgKCFhY2Nlc3NLZXkgfHwgIWNvbnRleHQuY29uZmlnLm1hbUFjY2Vzc0tleXMuaGFzKGFjY2Vzc0tleSkpIHtcbiAgICAgICAgdGhyb3cgQXV0aC51bmF1dGhvcml6ZWRFcnJvcigpO1xuICAgIH1cbn1cblxuY29uc3QgYWNjZXNzR3JhbnRlZDogQWNjZXNzUmlnaHRzID0ge1xuICAgIGdyYW50ZWQ6IHRydWUsXG4gICAgcmVzdHJpY3RUb0FjY291bnRzOiBbXSxcbn07XG5cblxuZXhwb3J0IHR5cGUgUURhdGFTY29wZVR5cGUgPSBcIm11dGFibGVcIiB8IFwiaW1tdXRhYmxlXCIgfCBcImNvdW50ZXJwYXJ0aWVzXCI7XG5cbmV4cG9ydCBjb25zdCBRRGF0YVNjb3BlID0ge1xuICAgIG11dGFibGU6IFwibXV0YWJsZVwiLFxuICAgIGltbXV0YWJsZTogXCJpbW11dGFibGVcIixcbiAgICBjb3VudGVycGFydGllczogXCJjb3VudGVycGFydGllc1wiLFxufTtcblxuZXhwb3J0IHR5cGUgUUNvbGxlY3Rpb25PcHRpb25zID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzY29wZTogUURhdGFTY29wZVR5cGUsXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgaW5kZXhlczogUUluZGV4SW5mb1tdLFxuXG4gICAgcHJvdmlkZXI6IFFEYXRhUHJvdmlkZXIsXG4gICAgc2xvd1F1ZXJpZXNQcm92aWRlcjogUURhdGFQcm92aWRlcixcbiAgICBsb2dzOiBRTG9ncyxcbiAgICBhdXRoOiBBdXRoLFxuICAgIHRyYWNlcjogVHJhY2VyLFxuICAgIHN0YXRzOiBJU3RhdHMsXG5cbiAgICBpc1Rlc3RzOiBib29sZWFuLFxufTtcblxuZXhwb3J0IGNsYXNzIFFEYXRhQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuICAgIHNjb3BlOiBRRGF0YVNjb3BlVHlwZTtcbiAgICBpbmRleGVzOiBRSW5kZXhJbmZvW107XG4gICAgaW5kZXhlc1JlZnJlc2hUaW1lOiBudW1iZXI7XG5cbiAgICAvLyBEZXBlbmRlbmNpZXNcbiAgICBwcm92aWRlcjogUURhdGFQcm92aWRlcjtcbiAgICBzbG93UXVlcmllc1Byb3ZpZGVyOiBRRGF0YVByb3ZpZGVyO1xuICAgIGxvZzogUUxvZztcbiAgICBhdXRoOiBBdXRoO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGlzVGVzdHM6IGJvb2xlYW47XG5cbiAgICAvLyBPd25cbiAgICBzdGF0RG9jOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5OiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5VGltZTogU3RhdHNUaW1pbmc7XG4gICAgc3RhdFF1ZXJ5RmFpbGVkOiBTdGF0c0NvdW50ZXI7XG4gICAgc3RhdFF1ZXJ5U2xvdzogU3RhdHNDb3VudGVyO1xuICAgIHN0YXRRdWVyeUFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0V2FpdEZvckFjdGl2ZTogU3RhdHNHYXVnZTtcbiAgICBzdGF0U3Vic2NyaXB0aW9uQWN0aXZlOiBTdGF0c0dhdWdlO1xuICAgIHN0YXRTdWJzY3JpcHRpb246IFN0YXRzQ291bnRlcjtcblxuICAgIHdhaXRGb3JDb3VudDogbnVtYmVyO1xuICAgIHN1YnNjcmlwdGlvbkNvdW50OiBudW1iZXI7XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcbiAgICBkb2NJbnNlcnRPclVwZGF0ZTogRXZlbnRFbWl0dGVyO1xuICAgIGhvdFN1YnNjcmlwdGlvbjogYW55O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zOiBRQ29sbGVjdGlvbk9wdGlvbnMpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gb3B0aW9ucy5kb2NUeXBlO1xuICAgICAgICB0aGlzLnNjb3BlID0gb3B0aW9ucy5zY29wZTtcbiAgICAgICAgdGhpcy5pbmRleGVzID0gb3B0aW9ucy5pbmRleGVzO1xuXG4gICAgICAgIHRoaXMucHJvdmlkZXIgPSBvcHRpb25zLnByb3ZpZGVyO1xuICAgICAgICB0aGlzLmluZGV4ZXNSZWZyZXNoVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgdGhpcy5zbG93UXVlcmllc1Byb3ZpZGVyID0gb3B0aW9ucy5zbG93UXVlcmllc1Byb3ZpZGVyO1xuICAgICAgICB0aGlzLmxvZyA9IG9wdGlvbnMubG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuYXV0aCA9IG9wdGlvbnMuYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSBvcHRpb25zLnRyYWNlcjtcbiAgICAgICAgdGhpcy5pc1Rlc3RzID0gb3B0aW9ucy5pc1Rlc3RzO1xuXG4gICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25Db3VudCA9IDA7XG5cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBvcHRpb25zLnN0YXRzO1xuICAgICAgICB0aGlzLnN0YXREb2MgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5kb2MuY291bnQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeSA9IG5ldyBTdGF0c0NvdW50ZXIoc3RhdHMsIFNUQVRTLnF1ZXJ5LmNvdW50LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlUaW1lID0gbmV3IFN0YXRzVGltaW5nKHN0YXRzLCBTVEFUUy5xdWVyeS50aW1lLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlBY3RpdmUgPSBuZXcgU3RhdHNHYXVnZShzdGF0cywgU1RBVFMucXVlcnkuYWN0aXZlLCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0UXVlcnlGYWlsZWQgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5mYWlsZWQsIFtgY29sbGVjdGlvbjoke25hbWV9YF0pO1xuICAgICAgICB0aGlzLnN0YXRRdWVyeVNsb3cgPSBuZXcgU3RhdHNDb3VudGVyKHN0YXRzLCBTVEFUUy5xdWVyeS5zbG93LCBbYGNvbGxlY3Rpb246JHtuYW1lfWBdKTtcbiAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKFxuICAgICAgICAgICAgc3RhdHMsXG4gICAgICAgICAgICBTVEFUUy53YWl0Rm9yLmFjdGl2ZSxcbiAgICAgICAgICAgIFtgY29sbGVjdGlvbjoke25hbWV9YF0sXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbiA9IG5ldyBTdGF0c0NvdW50ZXIoXG4gICAgICAgICAgICBzdGF0cyxcbiAgICAgICAgICAgIFNUQVRTLnN1YnNjcmlwdGlvbi5jb3VudCxcbiAgICAgICAgICAgIFtgY29sbGVjdGlvbjoke25hbWV9YF0sXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuc3RhdFN1YnNjcmlwdGlvbkFjdGl2ZSA9IG5ldyBTdGF0c0dhdWdlKFxuICAgICAgICAgICAgc3RhdHMsXG4gICAgICAgICAgICBTVEFUUy5zdWJzY3JpcHRpb24uYWN0aXZlLFxuICAgICAgICAgICAgW2Bjb2xsZWN0aW9uOiR7bmFtZX1gXSxcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmRvY0luc2VydE9yVXBkYXRlLnNldE1heExpc3RlbmVycygwKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuXG4gICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gdGhpcy5wcm92aWRlci5zdWJzY3JpYmUoXG4gICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICBkb2MgPT4gdGhpcy5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKSxcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuaG90U3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLnByb3ZpZGVyLnVuc3Vic2NyaWJlKHRoaXMuaG90U3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuaG90U3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRyb3BDYWNoZWREYkluZm8oKSB7XG4gICAgICAgIHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0RG9jLmluY3JlbWVudCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5lbWl0KFwiZG9jXCIsIGRvYyk7XG4gICAgICAgICAgICBjb25zdCBpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UgPSB0aGlzLm5hbWUgPT09IFwibWVzc2FnZXNcIlxuICAgICAgICAgICAgICAgICYmIGRvYy5fa2V5XG4gICAgICAgICAgICAgICAgJiYgZG9jLm1zZ190eXBlID09PSAxXG4gICAgICAgICAgICAgICAgJiYgZG9jLnN0YXR1cyA9PT0gNTtcbiAgICAgICAgICAgIGlmIChpc0V4dGVybmFsSW5ib3VuZEZpbmFsaXplZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGFuID0gdGhpcy50cmFjZXIuc3RhcnRTcGFuKFwibWVzc2FnZURiTm90aWZpY2F0aW9uXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRPZjogUVRyYWNlci5tZXNzYWdlUm9vdFNwYW5Db250ZXh0KGRvYy5fa2V5KSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzcGFuLmFkZFRhZ3Moe1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IGRvYy5fa2V5LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiBhc3luYyAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWNjZXNzUmlnaHRzID0gYXdhaXQgcmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dCwgYXJncyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0U3Vic2NyaXB0aW9uLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG5ldyBRRGF0YVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV2ZW50TGlzdGVuZXIgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24ucHVzaERvY3VtZW50KGRvYyk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvZy5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBEYXRlLm5vdygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlNVQlNDUklQVElPTlxcdEZBSUxFRFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KGFyZ3MuZmlsdGVyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbihcImRvY1wiLCBldmVudExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbkNvdW50ICs9IDE7XG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLm9uQ2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jSW5zZXJ0T3JVcGRhdGUucmVtb3ZlTGlzdGVuZXIoXCJkb2NcIiwgZXZlbnRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uQ291bnQgPSBNYXRoLm1heCgwLCB0aGlzLnN1YnNjcmlwdGlvbkNvdW50IC0gMSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3Vic2NyaXB0aW9uO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBnZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLCBwYXJhbXM6IFFQYXJhbXMpIHtcbiAgICAgICAgY29uc3QgYWNjb3VudHMgPSBhY2Nlc3NSaWdodHMucmVzdHJpY3RUb0FjY291bnRzO1xuICAgICAgICBpZiAoYWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb25kaXRpb24gPSBhY2NvdW50cy5sZW5ndGggPT09IDFcbiAgICAgICAgICAgID8gYD09IEAke3BhcmFtcy5hZGQoYWNjb3VudHNbMF0pfWBcbiAgICAgICAgICAgIDogYElOIFske2FjY291bnRzLm1hcCh4ID0+IGBAJHtwYXJhbXMuYWRkKHgpfWApLmpvaW4oXCIsXCIpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlIFwiYWNjb3VudHNcIjpcbiAgICAgICAgICAgIHJldHVybiBgZG9jLl9rZXkgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSBcInRyYW5zYWN0aW9uc1wiOlxuICAgICAgICAgICAgcmV0dXJuIGBkb2MuYWNjb3VudF9hZGRyICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgXCJtZXNzYWdlc1wiOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBidWlsZEZpbHRlckNvbmRpdGlvbihcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gdGhpcy5kb2NUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIFwiZG9jXCIsIGZpbHRlcilcbiAgICAgICAgICAgIDogXCJcIjtcbiAgICAgICAgY29uc3QgYWRkaXRpb25hbENvbmRpdGlvbiA9IHRoaXMuZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHMsIHBhcmFtcyk7XG4gICAgICAgIGlmIChwcmltYXJ5Q29uZGl0aW9uID09PSBcImZhbHNlXCIgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gXCJmYWxzZVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKHByaW1hcnlDb25kaXRpb24gJiYgYWRkaXRpb25hbENvbmRpdGlvbilcbiAgICAgICAgICAgID8gYCgke3ByaW1hcnlDb25kaXRpb259KSBBTkQgKCR7YWRkaXRpb25hbENvbmRpdGlvbn0pYFxuICAgICAgICAgICAgOiAocHJpbWFyeUNvbmRpdGlvbiB8fCBhZGRpdGlvbmFsQ29uZGl0aW9uKTtcblxuICAgIH1cblxuICAgIGJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdLCBvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KFwiX2tleVwiLCBcImRvYy5fa2V5XCIpO1xuICAgICAgICBjb25zdCBmaWVsZHMgPSB0aGlzLmRvY1R5cGUuZmllbGRzO1xuICAgICAgICBpZiAoZmllbGRzKSB7XG4gICAgICAgICAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgXCJkb2NcIiwgc2VsZWN0aW9ucywgZmllbGRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcmRlckJ5U2VsZWN0aW9uU2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICBraW5kOiBcIlNlbGVjdGlvblNldFwiLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb25zOiBbXSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBvcmRlckJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlRmllbGRXaXRoU2VsZWN0aW9uU2V0KGl0ZW0ucGF0aCwgb3JkZXJCeVNlbGVjdGlvblNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICAgICAgICAgICAgICAgICAgZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICAgICAgICAgIFwiZG9jXCIsXG4gICAgICAgICAgICAgICAgICAgIG9yZGVyQnlTZWxlY3Rpb25TZXQuc2VsZWN0aW9ucyxcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXhwcmVzc2lvbnMuZGVsZXRlKFwiaWRcIik7XG4gICAgICAgIHJldHVybiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgIH1cblxuICAgIGNyZWF0ZURhdGFiYXNlUXVlcnkoXG4gICAgICAgIGFyZ3M6IHtcbiAgICAgICAgICAgIGZpbHRlcj86IGFueSxcbiAgICAgICAgICAgIG9yZGVyQnk/OiBPcmRlckJ5W10sXG4gICAgICAgICAgICBsaW1pdD86IG51bWJlcixcbiAgICAgICAgICAgIHRpbWVvdXQ/OiBudW1iZXIsXG4gICAgICAgICAgICBvcGVyYXRpb25JZD86IHN0cmluZyxcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICApOiA/RGF0YWJhc2VRdWVyeSB7XG4gICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gY29uZGl0aW9uID8gYEZJTFRFUiAke2NvbmRpdGlvbn1gIDogXCJcIjtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnNcbiAgICAgICAgICAgID8gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKVxuICAgICAgICAgICAgOiBzZWxlY3Rpb25JbmZvO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSBcImRlc2NcIilcbiAgICAgICAgICAgICAgICAgICAgPyBcIiBERVNDXCJcbiAgICAgICAgICAgICAgICAgICAgOiBcIlwiO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgXCJfa2V5XCIpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oXCIsIFwiKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlUZXh0ICE9PSBcIlwiID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogXCJcIjtcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG4gICAgICAgIGNvbnN0IHJldHVybkV4cHJlc3Npb24gPSB0aGlzLmJ1aWxkUmV0dXJuRXhwcmVzc2lvbihzZWxlY3Rpb25JbmZvLnNlbGVjdGlvbnMsIG9yZGVyQnkpO1xuICAgICAgICBjb25zdCB0ZXh0ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiAke3JldHVybkV4cHJlc3Npb259YDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIG9wZXJhdGlvbklkOiBhcmdzLm9wZXJhdGlvbklkIHx8IG51bGwsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGlzRmFzdFF1ZXJ5KFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICBhd2FpdCB0aGlzLmNoZWNrUmVmcmVzaEluZm8oKTtcbiAgICAgICAgbGV0IHN0YXRLZXkgPSB0ZXh0O1xuICAgICAgICBpZiAob3JkZXJCeSAmJiBvcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHN0YXRLZXkgPSBgJHtzdGF0S2V5fSR7b3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9ICR7eC5kaXJlY3Rpb259YCkuam9pbihcIiBcIil9YDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc3RhdCA9IHRoaXMucXVlcnlTdGF0cy5nZXQoc3RhdEtleSk7XG4gICAgICAgIGlmIChzdGF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHN0YXQgPSB7XG4gICAgICAgICAgICAgICAgaXNGYXN0OiBpc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluZGV4ZXMsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgICAgICAgICBvcmRlckJ5IHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLFxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChzdGF0S2V5LCBzdGF0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhdC5pc0Zhc3Q7XG4gICAgfVxuXG4gICAgZXhwbGFpblF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IGFueSxcbiAgICAgICAgICAgIF9jb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgICAgICAgICBfaW5mbzogYW55LFxuICAgICAgICApID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY2hlY2tSZWZyZXNoSW5mbygpO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCB7fSwgZ3JhbnRlZEFjY2Vzcyk7XG4gICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpc0Zhc3Q6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNsb3dSZWFzb24gPSBhd2FpdCBleHBsYWluU2xvd1JlYXNvbihcbiAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzLFxuICAgICAgICAgICAgICAgIHRoaXMuZG9jVHlwZSxcbiAgICAgICAgICAgICAgICBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICBxLm9yZGVyQnksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpc0Zhc3Q6IHNsb3dSZWFzb24gPT09IG51bGwsXG4gICAgICAgICAgICAgICAgLi4uKHNsb3dSZWFzb24gPyB7IHNsb3dSZWFzb24gfSA6IHt9KSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChcbiAgICAgICAgICAgIHBhcmVudDogYW55LFxuICAgICAgICAgICAgYXJnczogYW55LFxuICAgICAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICAgICAgICAgaW5mbzogYW55LFxuICAgICAgICApID0+IHdyYXAodGhpcy5sb2csIFwiUVVFUllcIiwgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnkuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeUFjdGl2ZS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGxldCBxOiA/RGF0YWJhc2VRdWVyeSA9IG51bGw7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5maWVsZE5vZGVzWzBdLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXCJRVUVSWVwiLCBhcmdzLCAwLCBcIlNLSVBQRURcIiwgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBpc0Zhc3QgPSBhd2FpdCBjaGVja0lzRmFzdChjb250ZXh0LmNvbmZpZywgKCkgPT4gdGhpcy5pc0Zhc3RRdWVyeShcbiAgICAgICAgICAgICAgICAgICAgKChxOiBhbnkpOiBEYXRhYmFzZVF1ZXJ5KS50ZXh0LFxuICAgICAgICAgICAgICAgICAgICAoKHE6IGFueSk6IERhdGFiYXNlUXVlcnkpLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgKChxOiBhbnkpOiBEYXRhYmFzZVF1ZXJ5KS5vcmRlckJ5LFxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgICAgIGlmICghaXNGYXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5U2xvdy5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2VQYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNlUGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2VQYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgIFwiQkVGT1JFX1FVRVJZXCIsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/IFwiRkFTVFwiIDogXCJTTE9XXCIsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMsIHEub3JkZXJCeSwgaXNGYXN0LCB0cmFjZVBhcmFtcywgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXG4gICAgICAgICAgICAgICAgICAgIFwiUVVFUllcIixcbiAgICAgICAgICAgICAgICAgICAgYXJncyxcbiAgICAgICAgICAgICAgICAgICAgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLFxuICAgICAgICAgICAgICAgICAgICBpc0Zhc3QgPyBcIkZBU1RcIiA6IFwiU0xPV1wiLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0Lmxlbmd0aCA+IHEubGltaXQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNwbGljZShxLmxpbWl0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlGYWlsZWQuaW5jcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgaWYgKHEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2xvd1JlYXNvbiA9IGV4cGxhaW5TbG93UmVhc29uKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleGVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLm9yZGVyQnksXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzbG93UmVhc29uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5tZXNzYWdlICs9IGAuIFF1ZXJ5IHdhcyBkZXRlY3RlZCBhcyBhIHNsb3cuICR7c2xvd1JlYXNvbi5zdW1tYXJ5fS4gU2VlIGVycm9yIGRhdGEgZm9yIGRldGFpbHMuYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLmRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uZXJyb3IuZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzbG93UmVhc29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlUaW1lLnJlcG9ydChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmRlY3JlbWVudCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkoXG4gICAgICAgIHRleHQ6IHN0cmluZyxcbiAgICAgICAgdmFyczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICAgICAgaXNGYXN0OiBib29sZWFuLFxuICAgICAgICB0cmFjZVBhcmFtczogYW55LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgaW1wbCA9IGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBpZiAodHJhY2VQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZyhcInBhcmFtc1wiLCB0cmFjZVBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeVByb3ZpZGVyKHRleHQsIHZhcnMsIG9yZGVyQnksIGlzRmFzdCwgY29udGV4dCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgaW1wbCwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeVByb3ZpZGVyKFxuICAgICAgICB0ZXh0OiBzdHJpbmcsXG4gICAgICAgIHZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgICAgIGlzRmFzdDogYm9vbGVhbixcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHByb3ZpZGVyID0gaXNGYXN0ID8gdGhpcy5wcm92aWRlciA6IHRoaXMuc2xvd1F1ZXJpZXNQcm92aWRlcjtcbiAgICAgICAgcmV0dXJuIHByb3ZpZGVyLnF1ZXJ5KHRleHQsIHZhcnMsIG9yZGVyQnkpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKFxuICAgICAgICBxOiBEYXRhYmFzZVF1ZXJ5LFxuICAgICAgICBpc0Zhc3Q6IGJvb2xlYW4sXG4gICAgICAgIHRyYWNlUGFyYW1zOiBhbnksXG4gICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICApOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBpbXBsID0gYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIGlmICh0cmFjZVBhcmFtcykge1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKFwicGFyYW1zXCIsIHRyYWNlUGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/KChkb2M6IGFueSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgcmVzb2x2ZWRCeTogP3N0cmluZyA9IG51bGw7XG4gICAgICAgICAgICBsZXQgaGFzRGJSZXNwb25zZSA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVPbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IHJlc29sdmVCeSA9IChyZWFzb246IHN0cmluZywgcmVzb2x2ZTogKHJlc3VsdDogYW55KSA9PiB2b2lkLCByZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gcmVhc29uO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnRleHQucmVxdWVzdC5ldmVudHMub24oUmVxdWVzdEV2ZW50LkNMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KFwiY2xvc2VcIiwgcmVzb2x2ZU9uQ2xvc2UsIFtdKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlQcm92aWRlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxLnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcS5wYXJhbXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcS5vcmRlckJ5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRmFzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgKS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzRGJSZXNwb25zZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlQnkoXCJxdWVyeVwiLCByZXNvbHZlLCBkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF1dGhGaWx0ZXIgPSBRRGF0YUxpc3RlbmVyLmdldEF1dGhGaWx0ZXIodGhpcy5uYW1lLCBxLmFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IgPSAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXV0aEZpbHRlciAmJiAhYXV0aEZpbHRlcihkb2MpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBxLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KFwibGlzdGVuZXJcIiwgcmVzb2x2ZSwgW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIERhdGUubm93KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJRVUVSWVxcdEZBSUxFRFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeShxLmZpbHRlciksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yQ291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5vbihcImRvY1wiLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0V2FpdEZvckFjdGl2ZS5pbmNyZW1lbnQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoYXNEYlJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZUJ5KFwidGltZW91dFwiLCByZXNvbHZlLCBbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChRRXJyb3IucXVlcnlUZXJtaW5hdGVkT25UaW1lb3V0KCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2xvc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlT25DbG9zZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgICAgICAgICBvbkNsb3NlLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgICAgIHNwYW4uc2V0VGFnKFwicmVzb2x2ZWRcIiwgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2FpdEZvckNvdW50ID0gTWF0aC5tYXgoMCwgdGhpcy53YWl0Rm9yQ291bnQgLSAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NJbnNlcnRPclVwZGF0ZS5yZW1vdmVMaXN0ZW5lcihcImRvY1wiLCB3YWl0Rm9yKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFdhaXRGb3JBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgaW1wbCwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBBZ2dyZWdhdGVzXG5cblxuICAgIGNyZWF0ZUFnZ3JlZ2F0aW9uUXVlcnkoXG4gICAgICAgIGZpbHRlcjogYW55LFxuICAgICAgICBmaWVsZHM6IEZpZWxkQWdncmVnYXRpb25bXSxcbiAgICAgICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG4gICAgKTogP3tcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgICAgICBoZWxwZXJzOiBBZ2dyZWdhdGlvbkhlbHBlcltdLFxuICAgIH0ge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBjb25kaXRpb24gPSB0aGlzLmJ1aWxkRmlsdGVyQ29uZGl0aW9uKGZpbHRlciwgcGFyYW1zLCBhY2Nlc3NSaWdodHMpO1xuICAgICAgICBpZiAoY29uZGl0aW9uID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBxdWVyeSA9IEFnZ3JlZ2F0aW9uSGVscGVyRmFjdG9yeS5jcmVhdGVRdWVyeSh0aGlzLm5hbWUsIGNvbmRpdGlvbiB8fCBcIlwiLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGV4dDogcXVlcnkudGV4dCxcbiAgICAgICAgICAgIHBhcmFtczogcGFyYW1zLnZhbHVlcyxcbiAgICAgICAgICAgIGhlbHBlcnM6IHF1ZXJ5LmhlbHBlcnMsXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgdGV4dDogc3RyaW5nLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgaGVscGVyczogQWdncmVnYXRpb25IZWxwZXJbXSxcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgZm9yIChjb25zdCBoOiBBZ2dyZWdhdGlvbkhlbHBlciBvZiBoZWxwZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBjID0gaC5jb250ZXh0O1xuICAgICAgICAgICAgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uQ09VTlQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShhd2FpdCB0aGlzLmlzRmFzdFF1ZXJ5KHRleHQsIGZpbHRlcikpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUlOIHx8IGMuZm4gPT09IEFnZ3JlZ2F0aW9uRm4uTUFYKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGggPSBjLmZpZWxkLnBhdGg7XG4gICAgICAgICAgICAgICAgaWYgKHBhdGguc3RhcnRzV2l0aChcImRvYy5cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKFwiZG9jLlwiLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghKGF3YWl0IHRoaXMuaXNGYXN0UXVlcnkoXG4gICAgICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBcIkFTQ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICApKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGFnZ3JlZ2F0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAoXG4gICAgICAgICAgICBwYXJlbnQ6IGFueSxcbiAgICAgICAgICAgIGFyZ3M6IEFnZ3JlZ2F0aW9uQXJncyxcbiAgICAgICAgICAgIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCxcbiAgICAgICAgKSA9PiB3cmFwKHRoaXMubG9nLCBcIkFHR1JFR0FURVwiLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeS5pbmNyZW1lbnQoKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuc3RhdFF1ZXJ5QWN0aXZlLmluY3JlbWVudCgpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCByZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KGFyZ3MuZmllbGRzKSAmJiBhcmdzLmZpZWxkcy5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXJncy5maWVsZHNcbiAgICAgICAgICAgICAgICAgICAgOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IEFnZ3JlZ2F0aW9uRm4uQ09VTlQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlQWdncmVnYXRpb25RdWVyeShmaWx0ZXIsIGZpZWxkcywgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoXCJBR0dSRUdBVEVcIiwgYXJncywgMCwgXCJTS0lQUEVEXCIsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgY2hlY2tJc0Zhc3QoY29udGV4dC5jb25maWcsICgpID0+IHRoaXMuaXNGYXN0QWdncmVnYXRpb25RdWVyeShcbiAgICAgICAgICAgICAgICAgICAgcS50ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIHEuaGVscGVycyxcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5xdWVyeVByb3ZpZGVyKHEudGV4dCwgcS5wYXJhbXMsIFtdLCBpc0Zhc3QsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgICBcIkFHR1JFR0FURVwiLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgICAgICAgICAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsXG4gICAgICAgICAgICAgICAgICAgIGlzRmFzdCA/IFwiRkFTVFwiIDogXCJTTE9XXCIsIGNvbnRleHQucmVtb3RlQWRkcmVzcyxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBBZ2dyZWdhdGlvbkhlbHBlckZhY3RvcnkuY29udmVydFJlc3VsdHMocmVzdWx0LCBxLmhlbHBlcnMpO1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnN0YXRRdWVyeVRpbWUucmVwb3J0KERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zdGF0UXVlcnlBY3RpdmUuZGVjcmVtZW50KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGdldEluZGV4ZXMoKTogUHJvbWlzZTxRSW5kZXhJbmZvW10+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHJvdmlkZXIuZ2V0Q29sbGVjdGlvbkluZGV4ZXModGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJbnRlcm5hbHNcblxuICAgIGFzeW5jIGNoZWNrUmVmcmVzaEluZm8oKSB7XG4gICAgICAgIGlmICh0aGlzLmlzVGVzdHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoRGF0ZS5ub3coKSA8IHRoaXMuaW5kZXhlc1JlZnJlc2hUaW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbmRleGVzUmVmcmVzaFRpbWUgPSBEYXRlLm5vdygpICsgSU5ERVhFU19SRUZSRVNIX0lOVEVSVkFMO1xuICAgICAgICBjb25zdCBhY3R1YWxJbmRleGVzID0gYXdhaXQgdGhpcy5nZXRJbmRleGVzKCk7XG5cbiAgICAgICAgY29uc3Qgc2FtZUluZGV4ZXMgPSAoYUluZGV4ZXM6IFFJbmRleEluZm9bXSwgYkluZGV4ZXM6IFFJbmRleEluZm9bXSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgY29uc3QgYVJlc3QgPSBuZXcgU2V0KGFJbmRleGVzLm1hcChpbmRleFRvU3RyaW5nKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGJJbmRleCBvZiBiSW5kZXhlcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJJbmRleFN0cmluZyA9IGluZGV4VG9TdHJpbmcoYkluZGV4KTtcbiAgICAgICAgICAgICAgICBpZiAoYVJlc3QuaGFzKGJJbmRleFN0cmluZykpIHtcbiAgICAgICAgICAgICAgICAgICAgYVJlc3QuZGVsZXRlKGJJbmRleFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBhUmVzdC5zaXplID09PSAwO1xuICAgICAgICB9O1xuICAgICAgICBpZiAoIXNhbWVJbmRleGVzKGFjdHVhbEluZGV4ZXMsIHRoaXMuaW5kZXhlcykpIHtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKFwiUkVMT0FEX0lOREVYRVNcIiwgYWN0dWFsSW5kZXhlcyk7XG4gICAgICAgICAgICB0aGlzLmluZGV4ZXMgPSBhY3R1YWxJbmRleGVzLm1hcCh4ID0+ICh7IGZpZWxkczogeC5maWVsZHMgfSkpO1xuICAgICAgICAgICAgdGhpcy5xdWVyeVN0YXRzLmNsZWFyKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2MoXG4gICAgICAgIGZpZWxkVmFsdWU6IGFueSxcbiAgICAgICAgZmllbGRQYXRoOiBzdHJpbmcsXG4gICAgICAgIGFyZ3M6IHsgdGltZW91dD86IG51bWJlciB9LFxuICAgICAgICBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZmllbGRQYXRoLmVuZHNXaXRoKFwiWypdXCIpXG4gICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICBmaWx0ZXI6IHsgW2ZpZWxkUGF0aC5zbGljZSgwLCAtMyldOiB7IGFueTogeyBlcTogZmllbGRWYWx1ZSB9IH0gfSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBgRk9SIGRvYyBJTiAke3RoaXMubmFtZX0gRklMVEVSIEB2IElOIGRvYy4ke2ZpZWxkUGF0aH0gUkVUVVJOIGRvY2AsXG4gICAgICAgICAgICAgICAgcGFyYW1zOiB7IHY6IGZpZWxkVmFsdWUgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogeyBpZDogeyBlcTogZmllbGRWYWx1ZSB9IH0sXG4gICAgICAgICAgICAgICAgdGV4dDogYEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9IEZJTFRFUiBkb2MuJHtmaWVsZFBhdGh9ID09IEB2IFJFVFVSTiBkb2NgLFxuICAgICAgICAgICAgICAgIHBhcmFtczogeyB2OiBmaWVsZFZhbHVlIH0sXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoYXJncy50aW1lb3V0ID09PSAwKSA/IDAgOiAoYXJncy50aW1lb3V0IHx8IDQwMDAwKTtcbiAgICAgICAgaWYgKHRpbWVvdXQgPT09IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBhd2FpdCB0aGlzLnF1ZXJ5UHJvdmlkZXIoXG4gICAgICAgICAgICAgICAgcXVlcnlQYXJhbXMudGV4dCxcbiAgICAgICAgICAgICAgICBxdWVyeVBhcmFtcy5wYXJhbXMsXG4gICAgICAgICAgICAgICAgW10sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZG9jcyA9IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpbHRlcjogcXVlcnlQYXJhbXMuZmlsdGVyLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogW10sXG4gICAgICAgICAgICAgICAgb3JkZXJCeTogW10sXG4gICAgICAgICAgICAgICAgbGltaXQ6IDEsXG4gICAgICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25JZDogbnVsbCxcbiAgICAgICAgICAgICAgICB0ZXh0OiBxdWVyeVBhcmFtcy50ZXh0LFxuICAgICAgICAgICAgICAgIHBhcmFtczogcXVlcnlQYXJhbXMucGFyYW1zLFxuICAgICAgICAgICAgICAgIGFjY2Vzc1JpZ2h0czogYWNjZXNzR3JhbnRlZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBkb2NzWzBdO1xuICAgIH1cblxuICAgIGFzeW5jIHdhaXRGb3JEb2NzKFxuICAgICAgICBmaWVsZFZhbHVlczogc3RyaW5nW10sXG4gICAgICAgIGZpZWxkUGF0aDogc3RyaW5nLFxuICAgICAgICBhcmdzOiB7IHRpbWVvdXQ/OiBudW1iZXIgfSxcbiAgICAgICAgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LFxuICAgICk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFmaWVsZFZhbHVlcyB8fCBmaWVsZFZhbHVlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChmaWVsZFZhbHVlcy5tYXAodmFsdWUgPT4gdGhpcy53YWl0Rm9yRG9jKFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICBmaWVsZFBhdGgsXG4gICAgICAgICAgICBhcmdzLFxuICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgKSkpO1xuICAgIH1cblxuICAgIGZpbmlzaE9wZXJhdGlvbnMob3BlcmF0aW9uSWRzOiBTZXQ8c3RyaW5nPik6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IHRvQ2xvc2UgPSBbXTtcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGxpc3RlbmVyIGNhbmNlbGxhdGlvbiBiYXNlZCBvbiBvcGVyYXRpb25JZFxuICAgICAgICAvLyBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLml0ZW1zLnZhbHVlcygpKSB7XG4gICAgICAgIC8vICAgICBpZiAobGlzdGVuZXIub3BlcmF0aW9uSWQgJiYgb3BlcmF0aW9uSWRzLmhhcyhsaXN0ZW5lci5vcGVyYXRpb25JZCkpIHtcbiAgICAgICAgLy8gICAgICAgICB0b0Nsb3NlLnB1c2gobGlzdGVuZXIpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIHRvQ2xvc2UuZm9yRWFjaCh4ID0+IHguY2xvc2UoKSk7XG4gICAgICAgIHJldHVybiB0b0Nsb3NlLmxlbmd0aDtcbiAgICB9XG5cbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tJc0Zhc3QoY29uZmlnOiBRQ29uZmlnLCBkZXRlY3RvcjogKCkgPT4gUHJvbWlzZTxib29sZWFuPik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmIChjb25maWcuc2xvd1F1ZXJpZXMgPT09IHNsb3dRdWVyaWVzLmVuYWJsZSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY29uc3QgaXNGYXN0ID0gYXdhaXQgZGV0ZWN0b3IoKTtcbiAgICBpZiAoIWlzRmFzdCAmJiBjb25maWcuc2xvd1F1ZXJpZXMgPT09IHNsb3dRdWVyaWVzLmRpc2FibGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2xvdyBxdWVyaWVzIGFyZSBkaXNhYmxlZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRmFzdDtcbn1cbiJdfQ==