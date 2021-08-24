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
    QConfig,
    SlowQueriesMode,
    STATS,
} from "../config";
import {
    CollectionFilter,
    indexToString,
    JoinArgs,
    mergeFieldWithSelectionSet,
    OrderBy,
    parseSelectionSet,
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
    ValueNode,
} from "graphql";
import {
    QRequestContext,
    RequestEvent,
} from "../request";
import {
    joinFields,
} from "../graphql/resolvers-generated";
import { QCollectionQuery } from "./collection-query";

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

type JoinInfo = {
    on: string,
    refCollection: QDataCollection,
    refOn: string,
    refOnIsArray: boolean,
    field: FieldNode,
    args: JoinArgs,
    canJoin: (parent: Record<string, unknown>, args: JoinArgs) => boolean,
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
            const q = QCollectionQuery.create(this.name, this.docType, args, undefined, grantedAccess);
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


    static buildJoinPlan(mainRecords: Record<string, unknown>[], join: JoinInfo): Map<string, Record<string, unknown>[]> {
        const plan = new Map<string, Record<string, unknown>[]>();
        for (const record of mainRecords) {
            if (join.canJoin(record, join.field.arguments as JoinArgs)) {
                const onValue = record[join.on === "id" ? "_key" : join.on] as string | string[] | null | undefined;
                if (onValue !== null && onValue !== undefined) {
                    const onValues = Array.isArray(onValue) ? onValue : [onValue];
                    for (const value of onValues) {
                        const valuePlan = plan.get(value);
                        if (valuePlan !== undefined) {
                            valuePlan.push(record);
                        } else {
                            plan.set(value, [record]);
                        }
                    }
                }
            }
        }
        return plan;
    }

    static parseValue(node: ValueNode): unknown {
        switch (node.kind) {
        case "StringValue":
            return node.value;
        case "IntValue":
            return parseInt(node.value);
        case "ObjectValue": {
            const obj: Record<string, unknown> = {};
            for (const field of node.fields) {
                obj[field.name.value] = this.parseValue(field.value);
            }
            return obj;
        }
        case "BooleanValue":
            return node.value;
        case "EnumValue":
            return node.value;
        case "FloatValue":
            return Number(node.value);
        case "NullValue":
            return null;
        case "ListValue": {
            const list = [];
            for (const item of node.values) {
                list.push(this.parseValue(item));
            }
            return list;
        }
        default:
            return undefined;
        }
    }

    static parseArgs(field: FieldNode): Record<string, unknown> {
        const args: Record<string, unknown> = {};
        for (const arg of field.arguments ?? []) {
            const value = this.parseValue(arg.value);
            if (value !== undefined) {
                args[arg.name.value] = value;
            }
        }
        return args;
    }

    static getJoinSummary(
        mainCollectionName: string,
        mainSelection: SelectionSetNode | undefined,
        request: QRequestContext,
    ): JoinInfo[] {
        const joins: JoinInfo[] = [];

        for (const field of (mainSelection?.selections ?? [])) {
            if (field.kind === "Field") {
                const join = joinFields.get(`${mainCollectionName}.${field.name.value}`);
                if (join !== undefined) {
                    const refCollection = request.services.data.collectionsByName.get(join.collection);
                    const refOnIsArray = join.refOn.endsWith("[*]");
                    if (refCollection !== undefined) {
                        joins.push({
                            on: join.on,
                            refCollection,
                            refOn: refOnIsArray ? join.refOn.slice(0, -3) : join.refOn,
                            refOnIsArray,
                            field,
                            args: this.parseArgs(field) as JoinArgs,
                            canJoin: join.canJoin,
                        });
                    }
                }
            }
        }
        return joins;
    }

    static joinRecordToMain(
        mainRecordsByOnValue: Map<string, Record<string, unknown>[]>,
        joinedRecord: Record<string, unknown>,
        join: JoinInfo,
    ) {
        const joinedLinkValues = joinedRecord[join.refOn === "id" ? "_key" : join.refOn] as string;
        for (const joinedLinkValue of Array.isArray(joinedLinkValues) ? joinedLinkValues : [joinedLinkValues]) {
            const mainRecords = mainRecordsByOnValue.get(joinedLinkValue);
            if (mainRecords !== undefined) {
                for (const mainRecord of mainRecords) {
                    const onField = join.on === "id" ? "_key" : join.on;
                    const mainLinkValues = mainRecord[onField];
                    if (Array.isArray(mainLinkValues)) {
                        let joins = mainRecord[join.field.name.value] as unknown[] | undefined;
                        if (joins === undefined) {
                            joins = new Array(mainLinkValues.length);
                            for (let i = 0; i < joins.length; i += 1) {
                                joins[i] = null;
                            }
                            mainRecord[join.field.name.value] = joins;
                        }
                        for (let i = 0; i < joins.length; i += 1) {
                            if (mainLinkValues[i] === joinedLinkValue) {
                                joins[i] = joinedRecord;
                            }
                        }
                    } else {
                        mainRecord[join.field.name.value] = joinedRecord;
                    }
                }
                mainRecordsByOnValue.delete(joinedLinkValue);
            }
        }
    }

    static async fetchJoinedRecords(
        mainCollection: QDataCollection,
        mainRecords: Record<string, unknown>[],
        mainSelection: SelectionSetNode | undefined,
        accessRights: AccessRights,
        defaultTimeout: number | undefined,
        request: QRequestContext,
    ): Promise<Record<string, unknown>[]> {
        const joins = QDataCollection.getJoinSummary(mainCollection.name, mainSelection, request);
        for (const join of joins) {
            const joinPlan = QDataCollection.buildJoinPlan(mainRecords, join);
            const fieldSelection = mergeFieldWithSelectionSet(join.refOn, join.field.selectionSet);
            const timeout = join.args.timeout ?? defaultTimeout ?? 0;
            const timeLimit = Date.now() + timeout;
            while (joinPlan.size > 0) {
                const joinQuery = QCollectionQuery.createForJoin(
                    [...joinPlan.keys()],
                    join.refCollection.name,
                    join.refCollection.docType,
                    join.refOn,
                    join.refOnIsArray,
                    fieldSelection,
                    accessRights,
                    request.services.config,
                );
                if (joinQuery !== null) {
                    const fetcher = async (span: Span) => {
                        span.log({ text: joinQuery.text, params: joinQuery.params, shards: joinQuery.shards });
                        return await join.refCollection.queryProvider(
                            joinQuery.text,
                            joinQuery.params,
                            [],
                            true,
                            request,
                            joinQuery.shards,
                        ) as Record<string, unknown>[];
                    };
                    const joinedRecords = await QTracer.trace(request.services.tracer, `${this.name}.query.join`, fetcher, request.requestSpan);
                    for (const joinedRecord of joinedRecords) {
                        this.joinRecordToMain(joinPlan, joinedRecord, join);
                    }
                    await QDataCollection.fetchJoinedRecords(join.refCollection, joinedRecords, fieldSelection, accessRights, defaultTimeout, request);
                }
                if (Date.now() > timeLimit) {
                    break;
                }
            }
        }
        return mainRecords;
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
            selection: {
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
                const query = QCollectionQuery.create(
                    this.name,
                    this.docType,
                    args,
                    selection.fieldNodes[0].selectionSet,
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
                request.log("collection_resolver_before_querying", this.name);
                const start = Date.now();
                const records = query.timeout > 0
                    ? await this.queryWaitFor(query, isFast, traceParams, request)
                    : await this.query(query.text, query.params, query.orderBy, isFast, traceParams, request, query.shards);
                if (records.length > query.limit) {
                    records.splice(query.limit);
                }
                await QDataCollection.fetchJoinedRecords(
                    this,
                    records as Record<string, unknown>[],
                    selection.fieldNodes[0].selectionSet,
                    query.accessRights,
                    query.timeout,
                    request,
                );
                request.log("collection_resolver_after_querying", this.name);
                this.log.debug(
                    "QUERY",
                    args,
                    (Date.now() - start) / 1000,
                    isFast ? "FAST" : "SLOW", request.remoteAddress,
                );
                return records;
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
        shards?: Set<string>,
    ): Promise<QResult[]> {
        const impl = async (span: Span) => {
            if (traceParams) {
                span.log({ params: traceParams });
            }
            span.log({ text, vars, orderBy, shards });
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
        shards?: Set<string>,
    ): Promise<QResult[]> {
        request.log("collection_queryProvider_start", this.name);
        const provider = required(isFast ? this.provider : this.slowQueriesProvider);
        const result = provider.query(text, vars, orderBy, request, shards);
        request.log("collection_queryProvider_end", this.name);
        return result;
    }


    async queryWaitFor(
        q: QCollectionQuery,
        isFast: boolean,
        traceParams: Record<string, unknown> | null,
        request: QRequestContext,
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
                            q.shards,
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
        const condition = QCollectionQuery.buildFilterCondition(this.name, this.docType, filter, params, accessRights);
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
                    shards = new Set([workchain.toString(2).padStart(5, "0")]);
                }
            }
            break;
        case "blocks":
            if (fieldPath == "_key") {
                const shard_n = parseInt(fieldValue.toString().substr(0, 2), 16) >> 3;
                if (shard_n && shard_n >= 0 && shard_n <= 31) {
                    shards = new Set([shard_n.toString(2).padStart(5, "0")]);
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
                shards,
            },
            true,
            null,
            request,
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
