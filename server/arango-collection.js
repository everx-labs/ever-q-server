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
import type { QConfig } from "./config";
import type { QLog } from "./logs";
import QLogs from "./logs";
import type { AccessRights } from "./auth";
import { Auth } from "./auth";
import type { QType } from "./db-types";
import { QParams } from "./db-types";
import { QTracer } from "./tracer";
import type { FieldSelection } from "./utils";
import { parseSelectionSet, RegistryMap, selectionToString, wrap } from "./utils";


export type GraphQLRequestContext = {
    config: QConfig,
    auth: Auth,
    tracer: Tracer,
    client: TONClient,

    remoteAddress?: string,
    accessKey: string,
    parentSpan: (Span | SpanContext | typeof undefined),

    shared: Map<string, any>,
}

type OrderBy = {
    path: string,
    direction: string,
}

type DatabaseQuery = {
    filter: any,
    selection: FieldSelection[],
    orderBy: OrderBy[],
    limit: number,
    timeout: number,
    text: string,
    params: { [string]: any },
    accessRights: AccessRights,
}

export type QueryStat = {
    estimatedCost: number,
    slow: boolean,
    times: number[],
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

        this.listeners = new RegistryMap<CollectionListener>(`${name} listeners`);
        this.queryStats = new Map<string, QueryStat>();
        this.maxQueueSize = 0;
    }

    // Subscriptions

    onDocumentInsertOrUpdate(doc: any) {
        for (const listener of this.listeners.values()) {
            if (listener.isFiltered(doc)) {
                listener.onDocumentInsertOrUpdate(doc);
            }
        }
    }

    subscriptionResolver() {
        return {
            subscribe: async (_: any, args: { filter: any, accessKey?: string }, context: any, info: any) => {
                const accessRights = await this.auth.requireGrantedAccess(
                    context.accessKey || args.accessKey
                );
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
        const plan = (await this.db.explain(q.text, q.params)).plan;
        const stat = {
            estimatedCost: plan.estimatedCost,
            slow: false,
            times: [],
        };
        if (plan.nodes.find(node => node.type === 'EnumerateCollectionNode')) {
            stat.slow = true;
        }
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
            const accessRights = await context.auth.requireGrantedAccess(
                context.accessKey || args.accessKey,
            );
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

    async waitForDoc(key: string): Promise<any> {
        if (!key) {
            return Promise.resolve(null);
        }
        const docs = await this.queryWaitFor({
            filter: { id: { eq: key } },
            selection: [],
            orderBy: [],
            limit: 1,
            timeout: 40000,
            text: `FOR doc IN ${this.name} FILTER doc._key == @key RETURN doc`,
            params: { key },
            accessRights: accessGranted,
        }, null, null);
        return docs[0];
    }

    async waitForDocs(keys: string[]): Promise<any[]> {
        if (!keys || keys.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(keys.map(key => this.waitForDoc(key)));
    }
}

