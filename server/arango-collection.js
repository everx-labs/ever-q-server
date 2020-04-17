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

// @flow

import { Database, DocumentCollection } from "arangojs";
import { Span, SpanContext, Tracer } from "opentracing";
import type { TONClient } from "ton-client-js/types";
import { DocUpsertHandler, DocSubscription } from "./arango-listeners";
import type { AccessRights } from "./auth";
import { Auth } from "./auth";
import { BLOCKCHAIN_DB, STATS } from './config';
import type { QConfig } from "./config";
import type { DatabaseQuery, OrderBy, QType, QueryStat, ScalarField } from "./db-types";
import { parseSelectionSet, QParams, resolveBigUInt, selectionToString } from "./db-types";
import type { QLog } from "./logs";
import QLogs from "./logs";
import { isFastQuery } from './slow-detector';
import type { IStats } from './tracer';
import { QTracer, StatsCounter, StatsGauge, StatsTiming } from "./tracer";
import { createError, wrap } from "./utils";
import { scalarFields } from './resolvers-generated';
import EventEmitter from 'events';

export type GraphQLRequestContext = {
    config: QConfig,
    auth: Auth,
    tracer: Tracer,
    stats: IStats,
    client: TONClient,

    remoteAddress?: string,
    accessKey: string,
    usedAccessKey: ?string,
    usedMamAccessKey: ?string,
    multipleAccessKeysDetected?: boolean,
    parentSpan: (Span | SpanContext | typeof undefined),

    shared: Map<string, any>,
}

export const AggregationFn = {
    COUNT: 'COUNT',
    MIN: 'MIN',
    MAX: 'MAX',
    SUM: 'SUM',
    AVERAGE: 'AVERAGE',
    STDDEV_POPULATION: 'STDDEV_POPULATION',
    STDDEV_SAMPLE: 'STDDEV_SAMPLE',
    VARIANCE_POPULATION: 'VARIANCE_POPULATION',
    VARIANCE_SAMPLE: 'VARIANCE_SAMPLE',
}

type AggregationFnType = $Keys<typeof AggregationFn>;

export type FieldAggregation = {
    field: string,
    fn: AggregationFnType,
}

export type AggregationArgs = {
    filter: any,
    fields: FieldAggregation[],
    accessKey?: string,
}

function checkUsedAccessKey(
    usedAccessKey: ?string,
    accessKey: ?string,
    context: GraphQLRequestContext,
): ?string {
    if (!accessKey) {
        return usedAccessKey;
    }
    if (usedAccessKey && accessKey !== usedAccessKey) {
        context.multipleAccessKeysDetected = true;
        throw createError(
            400,
            'Request must use the same access key for all queries and mutations',
        );
    }
    return accessKey;
}

export async function requireGrantedAccess(context: GraphQLRequestContext, args: any): Promise<AccessRights> {
    const accessKey = context.accessKey || args.accessKey;
    context.usedAccessKey = checkUsedAccessKey(context.usedAccessKey, accessKey, context);
    return context.auth.requireGrantedAccess(accessKey);
}

export function mamAccessRequired(context: GraphQLRequestContext, args: any) {
    const accessKey = args.accessKey;
    context.usedMamAccessKey = checkUsedAccessKey(context.usedMamAccessKey, accessKey, context);
    if (!accessKey || !context.config.mamAccessKeys.has(accessKey)) {
        throw Auth.unauthorizedError();
    }
}

const accessGranted: AccessRights = {
    granted: true,
    restrictToAccounts: [],
};

export class Collection {
    name: string;
    docType: QType;

    log: QLog;
    auth: Auth;
    tracer: Tracer;
    statDoc: StatsCounter;
    statQuery: StatsCounter;
    statQueryTime: StatsTiming;
    statQueryActive: StatsGauge;
    statWaitForActive: StatsGauge;
    statSubscriptionActive: StatsGauge;
    db: Database;
    slowDb: Database;

    waitForCount: number;
    subscriptionCount: number;
    queryStats: Map<string, QueryStat>;
    docInsertOrUpdate: EventEmitter;

    maxQueueSize: number;

    constructor(
        name: string,
        docType: QType,
        logs: QLogs,
        auth: Auth,
        tracer: Tracer,
        stats: IStats,
        db: Database,
        slowDb: Database,
    ) {
        this.name = name;
        this.docType = docType;

        this.log = logs.create(name);
        this.auth = auth;
        this.tracer = tracer;
        this.db = db;
        this.slowDb = slowDb;
        this.waitForCount = 0;
        this.subscriptionCount = 0;

        this.statDoc = new StatsCounter(stats, STATS.doc.count, [`collection:${name}`]);
        this.statQuery = new StatsCounter(stats, STATS.query.count, [`collection:${name}`]);
        this.statQueryTime = new StatsTiming(stats, STATS.query.time, [`collection:${name}`]);
        this.statQueryActive = new StatsGauge(stats, STATS.query.active, [`collection:${name}`]);
        this.statWaitForActive = new StatsGauge(stats, STATS.waitFor.active, [`collection:${name}`]);
        this.statSubscriptionActive = new StatsGauge(stats, STATS.subscription.active, [`collection:${name}`]);

        this.docInsertOrUpdate = new EventEmitter();
        this.docInsertOrUpdate.setMaxListeners(0);
        this.queryStats = new Map<string, QueryStat>();
        this.maxQueueSize = 0;
    }

    // Subscriptions

    onDocumentInsertOrUpdate(doc: any) {
        this.statDoc.increment();
        this.docInsertOrUpdate.emit('doc', doc);
    }

    subscriptionResolver() {
        return {
            subscribe: async (_: any, args: { filter: any }, context: any, info: any) => {
                const accessRights = await requireGrantedAccess(context, args);
                const subscription = new DocSubscription(
                    this.name,
                    this.docType,
                    accessRights,
                    args.filter || {},
                    parseSelectionSet(info.operation.selectionSet, this.name),
                );
                const eventListener = (doc) => {
                    subscription.pushDocument(doc);
                };
                this.docInsertOrUpdate.on('doc', eventListener);
                this.subscriptionCount += 1;
                subscription.onClose = () => {
                    this.docInsertOrUpdate.removeListener('doc', eventListener);
                    this.subscriptionCount = Math.max(0, this.subscriptionCount - 1);
                };
                return subscription;
            },
        }
    }

    // Queries

    getAdditionalCondition(accessRights: AccessRights, params: QParams) {
        const accounts = accessRights.restrictToAccounts;
        if (accounts.length === 0) {
            return '';
        }
        const condition = accounts.length === 1
            ? `== @${params.add(accounts[0])}`
            : `IN [${accounts.map(x => `@${params.add(x)}`).join(',')}]`;
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

    buildConditionQL(
        filter: any,
        params: QParams,
        accessRights: AccessRights,
    ): ?string {
        const primaryCondition = Object.keys(filter).length > 0
            ? this.docType.ql(params, 'doc', filter)
            : '';
        const additionalCondition = this.getAdditionalCondition(accessRights, params);
        if (primaryCondition === 'false' || additionalCondition === 'false') {
            return null;
        }
        return (primaryCondition && additionalCondition)
            ? `(${primaryCondition}) AND (${additionalCondition})`
            : (primaryCondition || additionalCondition);

    }

    createDatabaseQuery(
        args: {
            filter?: any,
            orderBy?: OrderBy[],
            limit?: number,
            timeout?: number,
            operationId?: string,
        },
        selectionInfo: any,
        accessRights: AccessRights,
    ): ?DatabaseQuery {
        const filter = args.filter || {};
        const params = new QParams();
        const condition = this.buildConditionQL(filter, params, accessRights);
        if (condition === null) {
            return null;
        }
        const filterSection = condition ? `FILTER ${condition}` : '';
        const selection = selectionInfo.selections
            ? parseSelectionSet(selectionInfo, this.name)
            : selectionInfo;
        const orderBy: OrderBy[] = args.orderBy || [];
        const limit: number = args.limit || 50;
        const timeout = Number(args.timeout) || 0;
        const orderByText = orderBy
            .map((field) => {
                const direction = (field.direction && field.direction.toLowerCase() === 'desc')
                    ? ' DESC'
                    : '';
                return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
            })
            .join(', ');

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
            accessRights,
        };
    }

    isFastQuery(
        text: string,
        filter: any,
        orderBy?: OrderBy[]
    ): boolean {
        const existingStat = this.queryStats.get(text);
        if (existingStat !== undefined) {
            return existingStat.isFast;
        }
        const collectionInfo = BLOCKCHAIN_DB.collections[this.name];
        const stat = {
            isFast: isFastQuery(collectionInfo, this.docType, filter, orderBy || [], console),
        };
        this.queryStats.set(text, stat);
        return stat.isFast;
    }

    queryResolver() {
        return async (
            parent: any,
            args: any,
            context: GraphQLRequestContext,
            info: any,
        ) => wrap(this.log, 'QUERY', args, async () => {
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
                const traceParams: any = {
                    filter: q.filter,
                    selection: selectionToString(q.selection),
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
                const result = q.timeout > 0
                    ? await this.queryWaitFor(q, isFast, traceParams, context.parentSpan)
                    : await this.query(q.text, q.params, isFast, traceParams, context.parentSpan);
                this.log.debug(
                    'QUERY',
                    args,
                    (Date.now() - start) / 1000,
                    isFast ? 'FAST' : 'SLOW', context.remoteAddress,
                );
                return result;
            } finally {
                this.statQueryTime.report(Date.now() - start);
                this.statQueryActive.decrement();
            }
        });
    }

    async query(
        text: string,
        params: { [string]: any },
        isFast: boolean,
        traceParams: any,
        parentSpan?: (Span | SpanContext),
    ): Promise<any> {
        return QTracer.trace(this.tracer, `${this.name}.query`, async (span: Span) => {
            if (traceParams) {
                span.setTag('params', traceParams);
            }
            return this.queryDatabase(text, params, isFast);
        }, parentSpan);
    }

    async queryDatabase(text: string, params: { [string]: any }, isFast: boolean): Promise<any> {
        const db = isFast ? this.db : this.slowDb;
        const cursor = await db.query(text, params);
        return cursor.all();
    }


    async queryWaitFor(
        q: DatabaseQuery,
        isFast: boolean,
        traceParams: any,
        parentSpan?: (Span | SpanContext),
    ): Promise<any> {
        return QTracer.trace(this.tracer, `${this.name}.waitFor`, async (span: Span) => {
            if (traceParams) {
                span.setTag('params', traceParams);
            }
            let waitFor: ?((doc: any) => void) = null;
            let forceTimerId: ?TimeoutID = null;
            let resolvedBy: ?string = null;
            try {
                const onQuery = new Promise((resolve, reject) => {
                    const check = () => {
                        this.queryDatabase(q.text, q.params, isFast).then((docs) => {
                            if (!resolvedBy) {
                                if (docs.length > 0) {
                                    forceTimerId = null;
                                    resolvedBy = 'query';
                                    resolve(docs);
                                } else {
                                    forceTimerId = setTimeout(check, 5_000);
                                }
                            }
                        }, reject);
                    };
                    check();
                });
                const onChangesFeed = new Promise((resolve) => {
                    const authFilter = DocUpsertHandler.getAuthFilter(this.name, q.accessRights);
                    waitFor = (doc) => {
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
                const onTimeout = new Promise((resolve) => {
                    setTimeout(() => {
                        if (!resolvedBy) {
                            resolvedBy = 'timeout';
                            resolve([]);
                        }
                    }, q.timeout);
                });
                const result = await Promise.race([
                    onQuery,
                    onChangesFeed,
                    onTimeout,
                ]);
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

    //--------------------------------------------------------- Aggregates


    createAggregationQuery(
        args: AggregationArgs,
        accessRights: AccessRights,
    ): ?{
        text: string,
        params: { [string]: any },
    } {
        const filter = args.filter || {};
        const params = new QParams();
        const condition = this.buildConditionQL(filter, params, accessRights);
        if (condition === null) {
            return null;
        }
        const filterSection = condition ? `FILTER ${condition}` : '';
        const col: string[] = [];
        const ret: string[] = [];

        function aggregateCount(i: number) {
            col.push(`v${i} = COUNT(doc)`);
            ret.push(`v${i}`);
        }

        function aggregateNumber(i: number, f: ScalarField, fn: AggregationFnType) {
            col.push(`v${i} = ${fn}(${f.path})`);
            ret.push(`v${i}`);
        }

        function aggregateBigNumber(i: number, f: ScalarField, fn: AggregationFnType) {
            col.push(`v${i} = ${fn}(${f.path})`);
            ret.push(`{ ${f.type}: v${i} }`);
        }

        function aggregateBigNumberParts(i: number, f: ScalarField, fn: AggregationFnType) {
            const len = f.type === 'uint64' ? 1 : 2;
            const hHex = `SUBSTRING(${f.path}, ${len}, LENGTH(${f.path}) - ${len} - 8)`;
            const lHex = `RIGHT(SUBSTRING(${f.path}, ${len}), 8)`;
            col.push(`h${i} = ${fn}(TO_NUMBER(CONCAT("0x", ${hHex})))`);
            col.push(`l${i} = ${fn}(TO_NUMBER(CONCAT("0x", ${lHex})))`);
            ret.push(`{ ${f.type}: { h: h${i}, l: l${i} } }`);
        }

        function aggregateNonNumber(i: number, f: ScalarField, fn: AggregationFnType) {
            col.push(`v${i} = ${fn}(${f.path})`);
            ret.push(`v${i}`);
        }

        args.fields.forEach((aggregation: FieldAggregation, i: number) => {
            const fn = aggregation.fn || AggregationFn.COUNT;
            if (fn === AggregationFn.COUNT) {
                aggregateCount(i);
            } else {
                const f: (typeof undefined | ScalarField) = scalarFields.get(`${this.name}.${aggregation.field || 'id'}`);
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
            params: params.values,
        };
    }

    aggregationResolver() {
        return async (
            parent: any,
            args: AggregationArgs,
            context: GraphQLRequestContext,
        ) => wrap(this.log, 'AGGREGATE', args, async () => {
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
                    aggregate: args.fields,
                }, context.parentSpan);
                this.log.debug(
                    'AGGREGATE',
                    args,
                    (Date.now() - start) / 1000,
                    isFast ? 'FAST' : 'SLOW', context.remoteAddress,
                );
                return result[0].map((x) => {
                    if (x === undefined || x === null) {
                        return x;
                    }
                    const bigInt = x.uint64 || x.uint1024;
                    if (bigInt) {
                        const len = ('uint64' in x) ? 1 : 2;
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
                        return x.toString()
                    }
                });
            } finally {
                this.statQueryTime.report(Date.now() - start);
                this.statQueryActive.decrement();
            }
        });
    }

    //--------------------------------------------------------- Internals

    dbCollection(): DocumentCollection {
        return this.db.collection(this.name);
    }

    async waitForDoc(
        fieldValue: any,
        fieldPath: string,
    ): Promise<any> {
        if (!fieldValue) {
            return Promise.resolve(null);
        }
        const queryParams = fieldPath.endsWith('[*]')
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

        const docs = await this.queryWaitFor({
            filter: queryParams.filter,
            selection: [],
            orderBy: [],
            limit: 1,
            timeout: 40000,
            operationId: null,
            text: queryParams.text,
            params: queryParams.params,
            accessRights: accessGranted,
        }, true, null, null);
        return docs[0];
    }

    async waitForDocs(fieldValues: string[], fieldPath: string): Promise<any[]> {
        if (!fieldValues || fieldValues.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(fieldValues.map(value => this.waitForDoc(value, fieldPath)));
    }

    finishOperations(operationIds: Set<string>): number {
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

