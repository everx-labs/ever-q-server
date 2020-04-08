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
import { CollectionListener, SubscriptionListener, WaitForListener } from "./arango-listeners";
import type { AccessRights } from "./auth";
import { Auth } from "./auth";
import {BLOCKCHAIN_DB, STATS} from './config';
import type { QConfig } from "./config";
import type { DatabaseQuery, OrderBy, QType, QueryStat } from "./db-types";
import { parseSelectionSet, QParams, selectionToString } from "./db-types";
import type { QLog } from "./logs";
import QLogs from "./logs";
import {isFastQuery} from './slow-detector';
import type {IStats} from './tracer';
import {QTracer, StatsCounter, StatsGauge, StatsTiming} from "./tracer";
import {createError, RegistryMap, wrap} from "./utils";


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

function checkUsedAccessKey(
    usedAccessKey: ?string,
    accessKey: ?string,
    context: GraphQLRequestContext
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
    restrictToAccounts: []
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
    db: Database;
    slowDb: Database;

    listeners: RegistryMap<CollectionListener>;
    queryStats: Map<string, QueryStat>;

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

        this.statDoc = new StatsCounter(stats, STATS.doc.count, [`collection:${name}`]);
        this.statQuery = new StatsCounter(stats, STATS.query.count, [`collection:${name}`]);
        this.statQueryTime = new StatsTiming(stats, STATS.query.time, [`collection:${name}`]);
        this.statQueryActive = new StatsGauge(stats, STATS.query.active, [`collection:${name}`]);

        this.listeners = new RegistryMap<CollectionListener>(`${name} listeners`);
        this.queryStats = new Map<string, QueryStat>();
        this.maxQueueSize = 0;
    }

    // Subscriptions

    onDocumentInsertOrUpdate(doc: any) {
        this.statDoc.increment();
        for (const listener of this.listeners.values()) {
            if (listener.isFiltered(doc)) {
                listener.onDocumentInsertOrUpdate(doc);
            }
        }
    }

    subscriptionResolver() {
        return {
            subscribe: async (_: any, args: { filter: any }, context: any, info: any) => {
                const accessRights = await requireGrantedAccess(context, args);
                return new SubscriptionListener(
                    this.name,
                    this.docType,
                    this.listeners,
                    accessRights,
                    args.filter || {},
                    parseSelectionSet(info.operation.selectionSet, this.name),
                );
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
            return 'false';
        }
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
        const primaryCondition = Object.keys(filter).length > 0
            ? this.docType.ql(params, 'doc', filter)
            : '';
        const additionalCondition = this.getAdditionalCondition(accessRights, params);
        if (primaryCondition === 'false' || additionalCondition === 'false') {
            return null;
        }
        let condition = (primaryCondition && additionalCondition)
            ? `(${primaryCondition}) AND (${additionalCondition})`
            : (primaryCondition || additionalCondition);
        const filterSection = condition ? `FILTER ${condition}` : '';
        const selection = parseSelectionSet(selectionInfo, this.name);
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

    async ensureQueryStat(q: DatabaseQuery): Promise<QueryStat> {
        const existing = this.queryStats.get(q.text);
        if (existing !== undefined) {
            return existing;
        }
        const collectionInfo = BLOCKCHAIN_DB.collections[this.name];
        const stat = {
            slow: !isFastQuery(collectionInfo, this.docType, q.filter, q.orderBy, console),
            times: [],
        };
        this.queryStats.set(q.text, stat);
        return stat;
    }

    queryResolver() {
        return async (
            parent: any,
            args: any,
            context: GraphQLRequestContext,
            info: any
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
                const stat = await this.ensureQueryStat(q);
                const start = Date.now();
                const result = q.timeout > 0
                    ? await this.queryWaitFor(q, stat, context.parentSpan)
                    : await this.query(q, stat, context.parentSpan);
                this.log.debug(
                    'QUERY',
                    args,
                    (Date.now() - start) / 1000,
                    stat.slow ? 'SLOW' : 'FAST', context.remoteAddress,
                );
                return result;
            } finally {
                this.statQueryTime.report(Date.now() - start);
                this.statQueryActive.decrement();
            }
        });
    }

    static setQueryTraceParams(q: DatabaseQuery, span: Span) {
        const params: any = {
            filter: q.filter,
            selection: selectionToString(q.selection),
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

    async query(
        q: DatabaseQuery,
        stat: QueryStat,
        parentSpan?: (Span | SpanContext),
    ): Promise<any> {
        return QTracer.trace(this.tracer, `${this.name}.query`, async (span: Span) => {
            Collection.setQueryTraceParams(q, span);
            return this.queryDatabase(q, stat);
        }, parentSpan);
    }

    async queryDatabase(q: DatabaseQuery, stat: ?QueryStat): Promise<any> {
        const db = (stat && stat.slow) ? this.slowDb : this.db;
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


    async queryWaitFor(
        q: DatabaseQuery,
        stat: ?QueryStat,
        parentSpan?: (Span | SpanContext),
    ): Promise<any> {
        return QTracer.trace(this.tracer, `${this.name}.waitFor`, async (span: Span) => {
            Collection.setQueryTraceParams(q, span);
            let waitFor: ?WaitForListener = null;
            let forceTimerId: ?TimeoutID = null;
            let resolvedBy: ?string = null;
            try {
                const onQuery = new Promise((resolve, reject) => {
                    const check = () => {
                        this.queryDatabase(q, stat).then((docs) => {
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
                    waitFor = new WaitForListener(
                        this.name,
                        this.docType,
                        this.listeners,
                        q.accessRights,
                        q.filter,
                        q.selection,
                        q.operationId,
                        (doc) => {
                            if (!resolvedBy) {
                                resolvedBy = 'listener';
                                resolve([doc]);
                            }
                        });
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
                    waitFor.close();
                    waitFor = null;
                }
                if (forceTimerId !== null) {
                    clearTimeout(forceTimerId);
                    forceTimerId = null;
                }
            }
        }, parentSpan);
    }

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
        }, null, null);
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
        for (const listener of this.listeners.items.values()) {
            if (listener.operationId && operationIds.has(listener.operationId)) {
                toClose.push(listener);
            }
        }
        toClose.forEach(x => x.close());
        return toClose.length;
    }

}

