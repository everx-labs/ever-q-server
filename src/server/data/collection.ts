/* eslint-disable no-case-declarations */
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

import {
    Span,
    Tracer,
} from "opentracing";
import {
    AggregationFn,
    AggregationQuery,
    FieldAggregation,
} from "./aggregations";
import {
    QDataProvider,
    QDoc,
    QIndexInfo,
    QResult,
} from "./data-provider";
import {
    QDataListener,
    QDataSubscription,
} from "./listener";
import {
    AccessArgs,
    AccessRights,
    Auth,
    grantedAccess,
} from "../auth";
import {
    FilterConfig,
    FilterOrConversion,
    QConfig,
    SlowQueriesMode,
    STATS,
} from "../config";
import {
    CollectionFilter,
    collectReturnExpressions,
    combineReturnExpressions,
    DatabaseQuery,
    FieldSelection,
    indexToString,
    mergeFieldWithSelectionSet,
    OrderBy,
    parseSelectionSet,
    QParams,
    QType,
    QueryStat,
    ScalarFilter,
    selectionToString,
    splitOr,
    StructFilter,
} from "../filter/filters";
import QLogs, { QLog } from "../logs";
import {
    explainSlowReason,
    isFastQuery,
} from "../filter/slow-detector";
import {
    IStats,
    QTracer,
    StatsCounter,
    StatsGauge,
    StatsTiming,
} from "../tracer";
import {
    QError,
    required,
    wrap,
} from "../utils";
import EventEmitter from "events";
import {
    FieldNode,
    SelectionSetNode,
} from "graphql";
import {
    QRequestContext,
    RequestEvent,
} from "../request";

const INDEXES_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes

export type AggregationArgs = {
    filter: CollectionFilter,
    fields?: FieldAggregation[],
    accessKey?: string,
};

export type QCollectionOptions = {
    name: string,
    docType: QType,
    indexes: QIndexInfo[],

    provider: QDataProvider | undefined,
    slowQueriesProvider: QDataProvider | undefined,
    logs: QLogs,
    auth: Auth,
    tracer: Tracer,
    stats: IStats,

    isTests: boolean,
};

export class QDataCollection {
    name: string;
    docType: QType;
    indexes: QIndexInfo[];
    indexesRefreshTime: number;

    // Dependencies
    provider: QDataProvider | undefined;
    slowQueriesProvider: QDataProvider | undefined;
    log: QLog;
    auth: Auth;
    tracer: Tracer;
    isTests: boolean;

    // Own
    statDoc: StatsCounter;
    statQuery: StatsCounter;
    statQueryTime: StatsTiming;
    statQueryFailed: StatsCounter;
    statQuerySlow: StatsCounter;
    statQueryActive: StatsGauge;
    statWaitForActive: StatsGauge;
    statSubscriptionActive: StatsGauge;
    statSubscription: StatsCounter;

    waitForCount: number;
    subscriptionCount: number;
    queryStats: Map<string, QueryStat>;
    docInsertOrUpdate: EventEmitter;
    hotSubscription: unknown;

    maxQueueSize: number;

    constructor(options: QCollectionOptions) {
        const name = options.name;
        this.name = name;
        this.docType = options.docType;
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
        this.statDoc = new StatsCounter(stats, STATS.doc.count, [`collection:${name}`]);
        this.statQuery = new StatsCounter(stats, STATS.query.count, [`collection:${name}`]);
        this.statQueryTime = new StatsTiming(stats, STATS.query.time, [`collection:${name}`]);
        this.statQueryActive = new StatsGauge(stats, STATS.query.active, [`collection:${name}`]);
        this.statQueryFailed = new StatsCounter(stats, STATS.query.failed, [`collection:${name}`]);
        this.statQuerySlow = new StatsCounter(stats, STATS.query.slow, [`collection:${name}`]);
        this.statWaitForActive = new StatsGauge(
            stats,
            STATS.waitFor.active,
            [`collection:${name}`],
        );
        this.statSubscription = new StatsCounter(
            stats,
            STATS.subscription.count,
            [`collection:${name}`],
        );
        this.statSubscriptionActive = new StatsGauge(
            stats,
            STATS.subscription.active,
            [`collection:${name}`],
        );

        this.docInsertOrUpdate = new EventEmitter();
        this.docInsertOrUpdate.setMaxListeners(0);
        this.queryStats = new Map<string, QueryStat>();
        this.maxQueueSize = 0;

        const provider = options.provider;
        if (provider !== undefined) {
            (async () => {
                this.hotSubscription = await provider.subscribe(
                    name,
                    doc => this.onDocumentInsertOrUpdate(doc as QDoc),
                );
            })();
        }
    }

    close() {
        if (this.provider !== undefined && this.hotSubscription) {
            this.provider.unsubscribe(this.hotSubscription);
            this.hotSubscription = null;
            this.provider = undefined;
        }
    }

    dropCachedDbInfo() {
        this.indexesRefreshTime = Date.now();
    }

    // Subscriptions

    onDocumentInsertOrUpdate(doc: QDoc) {
        this.statDoc.increment().then(() => {
            this.docInsertOrUpdate.emit("doc", doc);
            const isExternalInboundFinalizedMessage = this.name === "messages"
                && doc._key
                && doc.msg_type === 1
                && doc.status === 5;
            if (isExternalInboundFinalizedMessage) {
                const span = this.tracer.startSpan("messageDbNotification", {
                    childOf: QTracer.messageRootSpanContext(doc._key),
                });
                span.addTags({
                    messageId: doc._key,
                });
                span.finish();
            }
        });
    }

    subscriptionResolver() {
        return {
            subscribe: async (
                _: unknown,
                args: AccessArgs & { filter: CollectionFilter },
                request: QRequestContext,
                info: { operation: { selectionSet: SelectionSetNode } },
            ) => {
                throw new Error("Disabled");
                const accessRights = await request.requireGrantedAccess(args);
                await this.statSubscription.increment();
                const subscription = new QDataSubscription(
                    this.name,
                    this.docType,
                    accessRights,
                    args.filter ?? {},
                    parseSelectionSet(info.operation.selectionSet, this.name),
                );
                const eventListener = (doc: QDoc) => {
                    try {
                        subscription.pushDocument(doc);
                    } catch (error) {
                        this.log.error(
                            Date.now(),
                            this.name,
                            "SUBSCRIPTION\tFAILED",
                            JSON.stringify(args.filter),
                            error.toString(),
                        );
                    }
                };
                this.docInsertOrUpdate.on("doc", eventListener);
                this.subscriptionCount += 1;
                subscription.onClose = () => {
                    this.docInsertOrUpdate.removeListener("doc", eventListener);
                    this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);
                };
                return subscription;
            },
        };
    }

    // Queries

    getAdditionalCondition(accessRights: AccessRights, params: QParams) {
        const accounts = accessRights.restrictToAccounts;
        if (accounts.length === 0) {
            return "";
        }
        const condition = accounts.length === 1
            ? `== @${params.add(accounts[0])}`
            : `IN [${accounts.map(x => `@${params.add(x)}`).join(",")}]`;
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

    buildFilterCondition(
        filter: { [name: string]: unknown },
        params: QParams,
        accessRights: AccessRights,
    ): string | null {
        const primaryCondition = Object.keys(filter).length > 0
            ? this.docType.filterCondition(params, "doc", filter)
            : "";
        const additionalCondition = this.getAdditionalCondition(accessRights, params);
        if (primaryCondition === "false" || additionalCondition === "false") {
            return null;
        }
        return (primaryCondition && additionalCondition)
            ? `(${primaryCondition}) AND (${additionalCondition})`
            : (primaryCondition || additionalCondition);

    }

    buildReturnExpression(selectionSet: SelectionSetNode | undefined, orderBy: OrderBy[]): string {
        const expressions = new Map();
        expressions.set("_key", "doc._key");
        const fields = this.docType.fields;
        if (fields) {
            collectReturnExpressions(expressions, "doc", selectionSet, fields);
            if (orderBy.length > 0) {
                let orderBySelectionSet: SelectionSetNode | undefined = undefined;
                for (const item of orderBy) {
                    orderBySelectionSet = mergeFieldWithSelectionSet(item.path, orderBySelectionSet);
                }
                collectReturnExpressions(
                    expressions,
                    "doc",
                    orderBySelectionSet,
                    fields,
                );
            }
        }
        expressions.delete("id");
        return combineReturnExpressions(expressions);
    }

    createDatabaseQuery(
        args: {
            filter?: CollectionFilter,
            orderBy?: OrderBy[],
            limit?: number,
            timeout?: number,
            operationId?: string,
        },
        selectionSet: SelectionSetNode | undefined,
        accessRights: AccessRights,
        config?: FilterConfig,
    ): DatabaseQuery | null {
        const orderBy: OrderBy[] = args.orderBy || [];
        const orderByText = orderBy
            .map((field) => {
                const direction = (field.direction && field.direction.toLowerCase() === "desc")
                    ? " DESC"
                    : "";
                return `doc.${field.path.replace(/\bid\b/gi, "_key")}${direction}`;
            })
            .join(", ");

        const sortSection = orderByText !== "" ? `SORT ${orderByText}` : "";
        const limit: number = Math.min(args.limit || 50, 50);
        const limitSection = `LIMIT ${limit}`;

        const params = new QParams();
        const orConversion = config?.orConversion ?? FilterOrConversion.SUB_QUERIES;
        const useSubQueries = orConversion === FilterOrConversion.SUB_QUERIES;
        const filter = args.filter ?? {};
        const subFilters = useSubQueries ? splitOr(filter) : [filter];

        const texts: string[] = [];

        for (const subFilter of subFilters) {
            const condition = this.buildFilterCondition(subFilter, params, accessRights);
            if (condition !== null) {
                const filterSection = condition ? `FILTER ${condition}` : "";
                const returnExpression = this.buildReturnExpression(selectionSet, orderBy);
                texts.push(`
                    FOR doc IN ${this.name}
                    ${filterSection}
                    ${sortSection}
                    ${limitSection}
                    RETURN ${returnExpression}
                `);
            }
        }

        if (texts.length === 0) {
            return null;
        }

        const text = texts.length === 1
            ? texts[0]
            : `
                FOR doc IN UNION_DISTINCT(${texts.map(x => `${x}`).join(", ")})
                ${sortSection}
                ${limitSection}
                RETURN doc`;
        const timeout = Number(args.timeout) || 0;
        const selection: FieldSelection[] = parseSelectionSet(selectionSet, this.name);

        return {
            filter,
            selection,
            orderBy,
            limit,
            timeout,
            operationId: args.operationId || null,
            text,
            params: params.values,
            accessRights,
        };
    }

    async isFastQuery(
        text: string,
        filter: CollectionFilter,
        orderBy?: OrderBy[],
    ): Promise<boolean> {
        await this.checkRefreshInfo();
        let statKey = text;
        if (orderBy && orderBy.length > 0) {
            statKey = `${statKey}${orderBy.map(x => `${x.path} ${x.direction}`).join(" ")}`;
        }
        let stat = this.queryStats.get(statKey);
        if (stat === undefined) {
            stat = {
                isFast: isFastQuery(
                    this.name,
                    this.indexes,
                    this.docType,
                    filter,
                    orderBy || [],
                    console,
                ),
            };
            this.queryStats.set(statKey, stat);
        }
        return stat.isFast;
    }

    explainQueryResolver() {
        return async (
            _parent: unknown,
            args: {
                filter?: CollectionFilter,
                orderBy?: OrderBy[],
            },
        ) => {
            await this.checkRefreshInfo();
            const q = this.createDatabaseQuery(args, undefined, grantedAccess);
            if (!q) {
                return { isFast: true };
            }
            const slowReason = await explainSlowReason(
                this.name,
                this.indexes,
                this.docType,
                q.filter,
                q.orderBy,
            );
            return {
                isFast: slowReason === null,
                ...(slowReason ? { slowReason } : {}),
            };
        };
    }

    static shardNtoShard(n: number | undefined) {
        if (n && n >= 0 && n <= 31) {
            return n.toString(2).padStart(5, "0");
        }
        return undefined;
    }

    getAccountsShards(filter: StructFilter) {
        const idFilter = filter["id"] as ScalarFilter | undefined;
        const idEqFilter = idFilter?.eq;
        const idValue = idEqFilter?.toString();
        const idPrefix = idValue?.split(":")[0] ?? "undefined";
        let workchain = parseInt(idPrefix);
        if (workchain == -1) {
            workchain = 0;
        }
        return [QDataCollection.shardNtoShard(workchain)];
    }

    getBlocksShards(filter: StructFilter) {
        const idFilter = filter["id"] as ScalarFilter | undefined;
        const idEqFilter = idFilter?.eq;
        const idValue = idEqFilter?.toString();
        const shard_n = idValue ? (parseInt(idValue.substr(0, 2), 16) >> 3) : undefined;
        return [QDataCollection.shardNtoShard(shard_n)];
    }

    getMessagesShards(filter: StructFilter) {
        const srcFilter = filter["src"] as ScalarFilter | undefined;
        const srcValue = srcFilter?.eq?.toString();
        const srcShard_n = srcValue ? (parseInt(srcValue.split(":")[1].substr(0, 2), 16) >> 3) : undefined;
        const srcShard = QDataCollection.shardNtoShard(srcShard_n);

        const dstFilter = filter["dst"] as ScalarFilter | undefined;
        const dstValue = dstFilter?.eq?.toString();
        const dstShard_n = dstValue ? (parseInt(dstValue.split(":")[1].substr(0, 2), 16) >> 3) : undefined;
        const dstShard = QDataCollection.shardNtoShard(dstShard_n);

        if (srcShard && dstShard) {
            return [srcShard, dstShard];
        }
        return srcShard ? [srcShard] : [dstShard];

    }

    getTransactionsShards(filter: StructFilter) {
        const accountAddrFilter = filter["account_addr"] as ScalarFilter | undefined;
        const idValue = accountAddrFilter?.eq?.toString();
        const shard_n = idValue ? (parseInt(idValue.split(":")[1].substr(0, 2), 16) >> 3) : undefined;
        return [QDataCollection.shardNtoShard(shard_n)];
    }

    getShards(query: DatabaseQuery) {
        const shards = splitOr(query.filter).map(orOperand => {
            const filter = orOperand as StructFilter;
            switch (this.name) {
            case "accounts":
                return this.getAccountsShards(filter);
            case "blocks":
                return this.getBlocksShards(filter);
            case "messages":
                return this.getMessagesShards(filter);
            case "transactions":
                return this.getTransactionsShards(filter);
            default:
                return [undefined];
            }
        }).flat() as string[];

        for (const s of shards) {
            if (!s) {
                return undefined;
            }
        }
        return shards;
    }

    queryResolver() {
        return async (
            _parent: unknown,
            args: {
                accessKey?: string | null,
                filter?: CollectionFilter,
                orderBy?: OrderBy[],
                limit?: number,
                timeout?: number,
                operationId?: string,
            },
            request: QRequestContext,
            info: {
                fieldNodes: FieldNode[],
            },
        ) => wrap(this.log, "QUERY", args, async () => {
            await this.statQuery.increment();
            await this.statQueryActive.increment();
            const start = Date.now();
            const queryProcessing = {
                created: false,
            };
            try {
                request.log("collection_resolver_start", this.name);
                const accessRights = await request.requireGrantedAccess(args);
                const query = this.createDatabaseQuery(
                    args,
                    info.fieldNodes[0].selectionSet,
                    accessRights,
                    request.services.config.filter,
                );
                if (query === null) {
                    this.log.debug("QUERY", args, 0, "SKIPPED", request.remoteAddress);
                    return [];
                }
                queryProcessing.created = true;
                const isFast = await checkIsFast(request.services.config, () => this.isFastQuery(
                    query.text,
                    query.filter,
                    query.orderBy,
                ));
                const shards = this.getShards(query);

                if (!isFast) {
                    await this.statQuerySlow.increment();
                }
                const traceParams: Record<string, unknown> = {
                    filter: query.filter,
                    selection: selectionToString(query.selection),
                };
                if (query.orderBy.length > 0) {
                    traceParams.orderBy = query.orderBy;
                }
                if (query.limit !== 50) {
                    traceParams.limit = query.limit;
                }
                if (query.timeout > 0) {
                    traceParams.timeout = query.timeout;
                }
                this.log.debug(
                    "BEFORE_QUERY",
                    {
                        ...args,
                        shards: shards,
                    },
                    isFast ? "FAST" : "SLOW", request.remoteAddress,
                );
                request.log("collection_resolver_before_querying", this.name);
                const start = Date.now();
                const result = query.timeout > 0
                    ? await this.queryWaitFor(query, isFast, traceParams, request, shards)
                    : await this.query(query.text, query.params, query.orderBy, isFast, traceParams, request, shards);
                request.log("collection_resolver_after_querying", this.name);
                this.log.debug(
                    "QUERY",
                    args,
                    (Date.now() - start) / 1000,
                    isFast ? "FAST" : "SLOW", request.remoteAddress,
                );
                if (result.length > query.limit) {
                    result.splice(query.limit);
                }
                return result;
            } catch (error) {
                await this.statQueryFailed.increment();
                if (queryProcessing.created) {
                    const slowReason = explainSlowReason(
                        this.name,
                        this.indexes,
                        this.docType,
                        args.filter ?? {},
                        args.orderBy ?? [],
                    );
                    if (slowReason) {
                        error.message += `. Query was detected as a slow. ${slowReason.summary}. See error data for details.`;
                        error.data = {
                            ...error.data,
                            slowReason,
                        };
                    }
                }
                throw error;
            } finally {
                await this.statQueryTime.report(Date.now() - start);
                await this.statQueryActive.decrement();
                request.finish();
            }
        });
    }

    async query(
        text: string,
        vars: Record<string, unknown>,
        orderBy: OrderBy[],
        isFast: boolean,
        traceParams: Record<string, unknown>,
        request: QRequestContext,
        shards?: string[],
    ): Promise<QResult[]> {
        const impl = async (span: Span) => {
            if (traceParams) {
                span.log({ params: traceParams });
            }
            return this.queryProvider(text, vars, orderBy, isFast, request, shards);
        };
        return QTracer.trace(this.tracer, `${this.name}.query`, impl, request.requestSpan);
    }

    async queryProvider(
        text: string,
        vars: Record<string, unknown>,
        orderBy: OrderBy[],
        isFast: boolean,
        request: QRequestContext,
        shards?: string[],
    ): Promise<QResult[]> {
        request.log("collection_queryProvider_start", this.name);
        const provider = required(isFast ? this.provider : this.slowQueriesProvider);
        const result = provider.query(text, vars, orderBy, request, shards);
        request.log("collection_queryProvider_end", this.name);
        return result;
    }


    async queryWaitFor(
        q: DatabaseQuery,
        isFast: boolean,
        traceParams: Record<string, unknown> | null,
        request: QRequestContext,
        shards?: string[],
    ): Promise<QDoc[]> {
        const impl = async (span: Span): Promise<QDoc[]> => {
            request.log("collection_queryWaitFor_start", this.name);
            if (traceParams) {
                span.log({ params: traceParams });
            }
            let waitFor: ((doc: QDoc) => void) | null = null;
            let forceTimerId: unknown | undefined = undefined;
            let resolvedBy: string | null = null;
            let hasDbResponse = false;
            let resolveOnClose: ((doc: QDoc[]) => void) = () => {
            };
            const resolveBy = (reason: string, resolve: (result: QDoc[]) => void, result: QDoc[]) => {
                if (!resolvedBy) {
                    resolvedBy = reason;
                    resolve(result);
                }
            };
            request.events.on(RequestEvent.CLOSE, () => {
                resolveBy("close", resolveOnClose, []);
            });
            try {
                const queryTimeoutAt = Date.now() + q.timeout;
                const onQuery = new Promise<QDoc[]>((resolve, reject) => {
                    const check = () => {
                        const checkStart = Date.now();
                        this.queryProvider(
                            q.text,
                            q.params,
                            q.orderBy,
                            isFast,
                            request,
                            shards,
                        ).then((docs) => {
                            hasDbResponse = true;
                            if (!resolvedBy) {
                                if (docs.length > 0) {
                                    forceTimerId = undefined;
                                    resolveBy("query", resolve, docs as QDoc[]);
                                } else {
                                    const now = Date.now();
                                    const checkDuration = now - checkStart;
                                    const timeLeft = queryTimeoutAt - now;
                                    const toWait = Math.min(5_000, timeLeft - 2 * checkDuration, timeLeft - 100);
                                    forceTimerId = setTimeout(check, Math.max(toWait, 0));
                                }
                            }
                        }, reject);
                    };
                    check();
                });
                const onChangesFeed = new Promise<QDoc[]>((resolve) => {
                    const authFilter = QDataListener.getAuthFilter(this.name, q.accessRights);
                    waitFor = (doc) => {
                        if (authFilter && !authFilter(doc)) {
                            return;
                        }
                        try {
                            if (this.docType.test(null, doc, q.filter)) {
                                resolveBy("listener", resolve, [doc]);
                            }
                        } catch (error) {
                            this.log.error(
                                Date.now(),
                                this.name,
                                "QUERY\tFAILED",
                                JSON.stringify(q.filter),
                                error.toString(),
                            );
                        }
                    };
                    this.waitForCount += 1;
                    this.docInsertOrUpdate.on("doc", waitFor);
                    this.statWaitForActive.increment().then(() => {
                    });
                });
                const onTimeout = new Promise<QDoc[]>((resolve, reject) => {
                    setTimeout(() => {
                        if (hasDbResponse) {
                            resolveBy("timeout", resolve, []);
                        } else {
                            reject(QError.queryTerminatedOnTimeout());
                        }
                    }, q.timeout);
                });
                const onClose = new Promise<QDoc[]>((resolve) => {
                    resolveOnClose = resolve;
                });
                const result = await Promise.race<Promise<QDoc[]>>([
                    onQuery,
                    onChangesFeed,
                    onTimeout,
                    onClose,
                ]);
                span.setTag("resolved", resolvedBy);
                request.log("collection_queryWaitFor_end", this.name);
                return result;
            } finally {
                if (waitFor !== null && waitFor !== undefined) {
                    this.waitForCount = Math.max(0, this.waitForCount - 1);
                    this.docInsertOrUpdate.removeListener("doc", waitFor);
                    waitFor = null;
                    await this.statWaitForActive.decrement();
                }
                if (forceTimerId !== undefined) {
                    clearTimeout(forceTimerId as number);
                    forceTimerId = null;
                }
            }
        };
        return QTracer.trace(this.tracer, `${this.name}.waitFor`, impl, request.requestSpan);
    }

    //--------------------------------------------------------- Aggregates


    createAggregationQuery(
        filter: CollectionFilter,
        fields: FieldAggregation[],
        accessRights: AccessRights,
    ): {
        text: string,
        params: Record<string, unknown>,
        queries: AggregationQuery[],
    } | null {
        const params = new QParams();
        const condition = this.buildFilterCondition(filter, params, accessRights);
        if (condition === null) {
            return null;
        }
        const query = AggregationQuery.createForFields(this.name, condition || "", fields);
        return {
            text: query.text,
            params: params.values,
            queries: query.queries,
        };
    }

    async isFastAggregationQuery(
        text: string,
        filter: CollectionFilter,
        queries: AggregationQuery[],
    ): Promise<boolean> {
        for (const q of queries) {
            if (q.fn === AggregationFn.COUNT) {
                if (!(await this.isFastQuery(text, filter))) {
                    return false;
                }
            } else if (q.fn === AggregationFn.MIN || q.fn === AggregationFn.MAX) {
                let path = q.path;
                if (path.startsWith("doc.")) {
                    path = path.substr("doc.".length);
                }
                if (!(await this.isFastQuery(
                    text,
                    filter,
                    [
                        {
                            path,
                            direction: "ASC",
                        },
                    ],
                ))) {
                    return false;
                }
            }
        }
        return true;
    }

    aggregationResolver() {
        return async (
            _parent: unknown,
            args: AggregationArgs,
            request: QRequestContext,
        ) => wrap(this.log, "AGGREGATE", args, async () => {
            await this.statQuery.increment();
            await this.statQueryActive.increment();
            const start = Date.now();
            try {
                const accessRights = await request.requireGrantedAccess(args);
                const filter = args.filter || {};
                const fields = Array.isArray(args.fields) && args.fields.length > 0
                    ? args.fields
                    : [
                        {
                            field: "",
                            fn: AggregationFn.COUNT,
                        },
                    ];

                const q = this.createAggregationQuery(filter, fields, accessRights);
                if (!q) {
                    this.log.debug("AGGREGATE", args, 0, "SKIPPED", request.remoteAddress);
                    return [];
                }
                const isFast = await checkIsFast(request.services.config, () => this.isFastAggregationQuery(
                    q.text,
                    filter,
                    q.queries,
                ));
                const start = Date.now();
                const result = await this.queryProvider(q.text, q.params, [], isFast, request);
                this.log.debug(
                    "AGGREGATE",
                    args,
                    (Date.now() - start) / 1000,
                    isFast ? "FAST" : "SLOW", request.remoteAddress,
                );
                return AggregationQuery.reduceResults(result, q.queries);
            } finally {
                await this.statQueryTime.report(Date.now() - start);
                await this.statQueryActive.decrement();
            }
        });
    }

    async getIndexes(): Promise<QIndexInfo[]> {
        return (await this.provider?.getCollectionIndexes(this.name)) ?? [];
    }

    //--------------------------------------------------------- Internals

    async checkRefreshInfo() {
        if (this.isTests) {
            return;
        }
        if (Date.now() < this.indexesRefreshTime) {
            return;
        }
        this.indexesRefreshTime = Date.now() + INDEXES_REFRESH_INTERVAL;
        const actualIndexes = await this.getIndexes();

        const sameIndexes = (aIndexes: QIndexInfo[], bIndexes: QIndexInfo[]): boolean => {
            const aRest = new Set(aIndexes.map(indexToString));
            for (const bIndex of bIndexes) {
                const bIndexString = indexToString(bIndex);
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
            this.indexes = actualIndexes.map(x => ({ fields: x.fields }));
            this.queryStats.clear();
        }

    }

    async waitForDoc(
        fieldValue: string | number | undefined | null,
        fieldPath: string,
        args: { timeout?: number },
        request: QRequestContext,
    ): Promise<QDoc | null> {
        if (fieldValue === undefined || fieldValue === null) {
            return null;
        }
        const queryParams = fieldPath.endsWith("[*]")
            ? {
                filter: { [fieldPath.slice(0, -3)]: { any: { eq: fieldValue } } },
                text: `FOR doc IN ${this.name} FILTER @v IN doc.${fieldPath} RETURN doc`,
                params: { v: fieldValue },
            }
            : {
                filter: { id: { eq: fieldValue } },
                text: `FOR doc IN ${this.name} FILTER doc.${fieldPath} == @v RETURN doc`,
                params: { v: fieldValue },
            };

        let shards = undefined;
        switch (this.name) {
        case "accounts":
            if (fieldPath == "_key") {
                const idPrefix = fieldValue.toString().split(":")[0];
                let workchain = parseInt(idPrefix);
                if (workchain == -1) {
                    workchain = 0;
                }
                if (workchain >= 0 && workchain <= 31) {
                    shards = [workchain.toString(2).padStart(5, "0")];
                }
            }
            break;
        case "blocks":
            if (fieldPath == "_key") {
                const shard_n = parseInt(fieldValue.toString().substr(0, 2), 16) >> 3;
                if (shard_n && shard_n >= 0 && shard_n <= 31) {
                    shards = [shard_n.toString(2).padStart(5, "0")];
                }
            }
        }

        const timeout = (args.timeout === 0) ? 0 : (args.timeout || 40000);
        if (timeout === 0) {
            const docs = await this.queryProvider(
                queryParams.text,
                queryParams.params,
                [],
                true,
                request,
                shards,
            );
            return docs[0] as QDoc;
        }

        const docs = await this.queryWaitFor(
            {
                filter: queryParams.filter,
                selection: [],
                orderBy: [],
                limit: 1,
                timeout,
                operationId: null,
                text: queryParams.text,
                params: queryParams.params,
                accessRights: Auth.accessGranted,
            },
            true,
            null,
            request,
            shards,
        );
        return docs[0];
    }

    async waitForDocs(
        fieldValues: (string | number | undefined | null)[] | undefined | null,
        fieldPath: string,
        args: { timeout?: number },
        request: QRequestContext,
    ): Promise<(QDoc | null)[]> {
        if (fieldValues === undefined || fieldValues === null || fieldValues.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(fieldValues.map(value => this.waitForDoc(
            value,
            fieldPath,
            args,
            request,
        )));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    finishOperations(_operationIds: Set<string>): number {
        const toClose = [];
        // TODO: Implement listener cancellation based on operationId
        // for (const listener of this.listeners.items.values()) {
        //     if (listener.operationId && operationIds.has(listener.operationId)) {
        //         toClose.push(listener);
        //     }
        // }
        // toClose.forEach(x => x.close());
        return toClose.length;
    }

}

async function checkIsFast(config: QConfig, detector: () => Promise<boolean>): Promise<boolean> {
    if (config.slowQueries === SlowQueriesMode.ENABLE) {
        return true;
    }
    const isFast = await detector();
    if (!isFast && config.slowQueries === SlowQueriesMode.DISABLE) {
        throw new Error("Slow queries are disabled");
    }
    return isFast;
}
