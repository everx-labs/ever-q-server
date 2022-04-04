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
    Tracer,
} from "opentracing";
import md5 from "md5";
import Redis from "ioredis";
import { RedisPubSub } from "graphql-redis-subscriptions";
import postSubscription from "../graphql/post-subscription";
import {
    AggregationFn,
    AggregationQuery,
    FieldAggregation,
} from "./aggregations";
import {
    QDataProvider,
    QDataProviderQueryParams,
    QDoc,
    QIndexInfo,
    QResult,
} from "./data-provider";
import {
    QDataListener,
} from "./listener";
import {
    AccessArgs,
    AccessRights,
    Auth,
    grantedAccess,
} from "../auth";
import {
    QConfig,
    SlowQueriesMode,
    STATS,
} from "../config";
import {
    CollectionFilter,
    indexToString,
    OrderBy,
    QParams,
    QType,
    QueryStat,
    selectionToString,
} from "../filter/filters";
import QLogs, { QLog } from "../logs";
import {
    explainSlowReason,
    isFastQuery,
} from "../filter/slow-detector";
import {
    IStats,
    StatsCounter,
    StatsGauge,
    StatsTiming,
} from "../stats";
import {
    QTraceSpan,
} from "../tracing";
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
import { QCollectionQuery } from "./collection-query";
import { QJoinQuery } from "./collection-joins";

const INDEXES_REFRESH_INTERVAL = 60 * 60 * 1000; // 60 minutes
const KEEP_ALIVE_INTERVAL = 30000; // every 30 secs

let pubsub: RedisPubSub;

export type AggregationArgs = {
    filter?: CollectionFilter | null,
    fields?: FieldAggregation[] | null,
    accessKey?: string | null,
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
    }

    close() {
    }

    dropCachedDbInfo() {
        this.indexesRefreshTime = Date.now();
    }

    // Subscriptions

    subscriptionResolver() {
        return {
            subscribe: async (
                _: unknown,
                args: AccessArgs & { filter: CollectionFilter | null },
                request: QRequestContext,
                info: Record<string, unknown>
            ) => {
                if (!request.services.config.useListeners) {
                    throw new Error("Disabled");
                }

                if (!pubsub) {
                    const {redisOptions} = request.services.config.subscriptions;
                    redisOptions.retryStrategy =  (times: number) => Math.min(times * 50, 2000);
                    pubsub = new RedisPubSub({
                        publisher: new Redis(redisOptions),
                        subscriber: new Redis(redisOptions),
                    });
                }

                // const accessRights = await request.requireGrantedAccess(args);
                await this.statSubscription.increment();

                const value = JSON.stringify(args.filter);
                const key = info.fieldName + md5(value);

                await postSubscription(request, { key, value });

                const timerId = setInterval(() => {
                    postSubscription(request, { key, value: "" }).catch((err) => {
                        // Can't help, can log an error only
                        this.log.error("SUBSCRIPTIONS", err);
                    });
                }, KEEP_ALIVE_INTERVAL);

                const asyncIterator =  pubsub.asyncIterator([key]);
                //
                // For explanations, see https://github.com/apollographql/graphql-subscriptions/issues/99
                //
                if (!asyncIterator.return) {
                    asyncIterator.return = () => Promise.resolve({ value: undefined, done: true });
                }

                const savedReturn = asyncIterator.return.bind(asyncIterator);
                asyncIterator.return = () => {
                    clearInterval(timerId);
                    return savedReturn();
                };
                return asyncIterator;
            },

            // eslint-disable-next-line  @typescript-eslint/no-explicit-any
            resolve: (payload: any) => {
                // Add _key to mimic "old" behavior
                if (payload._key === undefined && payload?.id !== undefined) {
                    payload._key = payload.id;
                }
                return payload;
            },
        };
    }

    // Queries

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
                filter?: CollectionFilter | null,
                orderBy?: OrderBy[] | null,
            },
        ) => {
            await this.checkRefreshInfo();
            const q = QCollectionQuery.create(
                { expectedAccountBocVersion: 1 },
                this.name,
                this.docType,
                args,
                undefined,
                grantedAccess,
                0,
            );
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

    async optimizeSortedQueryWithSingleResult(
        args: {
            accessKey?: string | null,
            filter?: CollectionFilter | null,
            orderBy?: OrderBy[] | null,
            limit?: number | null,
            timeout?: number | null,
            operationId?: string | null,
        },
        accessRights: AccessRights,
        request: QRequestContext,
        traceSpan: QTraceSpan,
    ): Promise<boolean> {
        if (!args.orderBy || args.orderBy.length === 0) {
            return true;
        }
        if (!args.orderBy || args.orderBy.length === 0) {
            return true;
        }
        if (args.limit === undefined || args.limit !== 1) {
            return true;
        }
        const selection: SelectionSetNode = {
            kind: "SelectionSet",
            selections: [
                {
                    kind: "Field",
                    name: {
                        kind: "Name",
                        value: "id",
                    },
                },
            ],
        };
        const query = QCollectionQuery.create(
            request,
            this.name,
            this.docType,
            args,
            selection,
            accessRights,
            required(this.provider).shardingDegree,
            request.services.config.queries.filter,
        );
        if (query === null) {
            return false;
        }
        const records = await this.fetchRecords(query, args, selection, request, traceSpan);
        if (records.length === 0) {
            return false;
        }
        if (records.length > 1) {
            return true;
        }
        const id = (records[0] as Record<string, unknown>)["_key"] as string;
        args.filter = { id: { eq: id } };
        args.orderBy = undefined;
        return true;
    }

    async fetchRecords(
        query: QCollectionQuery,
        args: {
            accessKey?: string | null,
            filter?: CollectionFilter | null,
            orderBy?: OrderBy[] | null,
            limit?: number | null,
            timeout?: number | null,
            operationId?: string | null,
        },
        selection: SelectionSetNode | undefined,
        request: QRequestContext,
        traceSpan: QTraceSpan,
    ): Promise<QResult[]> {
        const isFast = await checkIsFast(request.services.config, () => this.isFastQuery(
            query.text,
            query.filter,
            query.orderBy,
        ));

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
                shards: query.shards,
            },
            isFast ? "FAST" : "SLOW", request.remoteAddress,
        );
        traceSpan.logEvent("ready_to_fetch");
        const start = Date.now();
        const records = query.timeout > 0
            ? await this.queryWaitFor(query, isFast, traceParams, request, traceSpan)
            : await this.query({
                text: query.text,
                orderBy: query.orderBy,
                vars: query.params,
                shards: query.shards,
                request,
                traceSpan,
                isFast,
                traceParams,
            });
        if (records.length > query.limit) {
            records.splice(query.limit);
        }
        traceSpan.logEvent("ready_to_fetch_joins");
        await QJoinQuery.fetchJoinedRecords(
            this,
            records as Record<string, unknown>[],
            selection,
            query.accessRights,
            query.timeout || 40000,
            request,
            traceSpan,
        );
        traceSpan.logEvent("joins_are_fetched");
        this.log.debug(
            "QUERY",
            args,
            (Date.now() - start) / 1000,
            isFast ? "FAST" : "SLOW", request.remoteAddress,
        );
        return records;
    }

    queryResolver() {
        return async (
            _parent: unknown,
            args: {
                accessKey?: string | null,
                filter?: CollectionFilter | null,
                orderBy?: OrderBy[] | null,
                limit?: number | null,
                timeout?: number | null,
                operationId?: string | null,
            },
            request: QRequestContext,
            selection: {
                fieldNodes: FieldNode[],
            },
        ) => wrap(this.log, "QUERY", args, async () => {
            return await request.trace(`${this.name}.queryResolver`, async traceSpan => {
                await this.statQuery.increment();
                await this.statQueryActive.increment();
                const start = Date.now();
                const queryProcessing = {
                    created: false,
                };
                try {
                    const accessRights = await request.requireGrantedAccess(args);
                    const selectionSet = selection.fieldNodes[0].selectionSet;
                    const optimizationPassed = await this.optimizeSortedQueryWithSingleResult(
                        args,
                        accessRights,
                        request,
                        traceSpan,
                    );
                    const query = optimizationPassed
                        ? QCollectionQuery.create(
                            request,
                            this.name,
                            this.docType,
                            args,
                            selectionSet,
                            accessRights,
                            required(this.provider).shardingDegree,
                            request.services.config.queries.filter,
                        )
                        : null;
                    if (query === null) {
                        this.log.debug("QUERY", args, 0, "SKIPPED", request.remoteAddress);
                        return [];
                    }
                    queryProcessing.created = true;
                    return await this.fetchRecords(query, args, selectionSet, request, traceSpan);
                } catch (error: any) {
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
        });
    }

    async query(
        params: QDataProviderQueryParams & {
            isFast: boolean,
            traceParams: Record<string, unknown>,
        },
    ): Promise<QResult[]> {
        const impl = async (span: QTraceSpan) => {
            if (params.traceParams) {
                span.log({ params: params.traceParams });
            }
            span.log({
                text: params.text,
                vars: params.vars,
                orderBy: params.orderBy,
                shards: params.shards,
            });
            return this.queryProvider({
                ...params,
                traceSpan: span,
            });
        };
        return params.traceSpan.traceChildOperation(`${this.name}.query`, impl);
    }

    async queryProvider(
        params: QDataProviderQueryParams & { isFast: boolean },
    ): Promise<QResult[]> {
        const traceSpan = params.traceSpan;
        traceSpan.logEvent("collection_queryProvider_start");
        const provider = required(params.isFast ? this.provider : this.slowQueriesProvider);
        const result = await provider.query(params);
        traceSpan.logEvent("collection_queryProvider_end");
        return result;
    }


    async queryWaitFor(
        q: QCollectionQuery,
        isFast: boolean,
        traceParams: Record<string, unknown> | null,
        request: QRequestContext,
        traceSpan: QTraceSpan,
    ): Promise<QDoc[]> {
        const impl = async (span: QTraceSpan): Promise<QDoc[]> => {
            request.requestTags.hasWaitFor = true;
            if (traceParams) {
                span.log({ params: traceParams });
            }
            let waitFor: ((doc: QDoc) => void) | null = null;
            let forceTimerId: unknown | undefined = undefined;
            let resolvedBy: string | null = null;
            let hasDbResponse = false;
            let resolveOnClose: ((doc: QDoc[]) => void) = () => {
            };
            const resolveBy = (
                reason: string,
                resolve: (result: QDoc[]) => void,
                result: QDoc[],
            ) => {
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
                    let queryCount = 0;
                    let period = request.services.config.queries.waitForPeriod;
                    const check = () => {
                        const checkStart = Date.now();
                        this.queryProvider({
                            text: q.text,
                            vars: q.params,
                            orderBy: q.orderBy,
                            shards: q.shards,
                            request,
                            traceSpan: span,
                            isFast,
                            maxRuntimeInS: Math.ceil((queryTimeoutAt - checkStart) / 1000),
                        }).then((docs) => {
                            queryCount += 1;
                            if (queryCount >= 7) {
                                period = period * 1.5;
                            }
                            hasDbResponse = true;
                            if (!resolvedBy) {
                                if (docs.length > 0) {
                                    forceTimerId = undefined;
                                    resolveBy("query", resolve, docs as QDoc[]);
                                } else {
                                    const now = Date.now();
                                    const checkDuration = now - checkStart;
                                    const timeLeft = queryTimeoutAt - now;
                                    const toWait = Math.min(
                                        period,
                                        timeLeft - 2 * checkDuration,
                                        timeLeft - 200,
                                    );
                                    forceTimerId = setTimeout(check, Math.max(toWait, 100));
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
                        } catch (error: any) {
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
                    void this.statWaitForActive.increment().then(() => {
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
        return traceSpan.traceChildOperation(`${this.name}.waitFor`, impl);
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
        shards?: Set<string>,
    } | null {
        const params = new QParams();
        const condition = QCollectionQuery.buildFilterCondition(
            this.name,
            this.docType,
            filter,
            params,
            accessRights,
        );
        const shards = QCollectionQuery.getShards(
            this.name,
            filter,
            required(this.provider).shardingDegree,
        );
        // TODO: consider making query to two collections in one shard if (this.name === "messages" && shard.size === 1)
        const query = AggregationQuery.createForFields(this.name, condition || "", fields);
        return {
            text: query.text,
            params: params.values,
            queries: query.queries,
            shards: (this.name !== "messages") ? shards : undefined,
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
            return await request.trace(`${this.name}.aggregationResolver`, async traceSpan => {
                request.requestTags.hasAggregations = true;
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
                    const isFast = await checkIsFast(
                        request.services.config,
                        () => this.isFastAggregationQuery(
                            q.text,
                            filter,
                            q.queries,
                        ),
                    );
                    traceSpan.log({
                        text: q.text,
                        vars: q.params,
                        isFast,
                    });
                    const start = Date.now();
                    traceSpan.logEvent("ready_to_fetch");
                    const result = await this.queryProvider({
                        text: q.text,
                        vars: q.params,
                        orderBy: [],
                        isFast,
                        request,
                        traceSpan,
                        shards: q.shards,
                    });
                    traceSpan.logEvent("data_is_fetched");
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
    if (config.queries.slowQueries === SlowQueriesMode.ENABLE) {
        return true;
    }
    const isFast = await detector();
    if (!isFast && config.queries.slowQueries === SlowQueriesMode.DISABLE) {
        throw new Error("Slow queries are disabled");
    }
    return isFast;
}
