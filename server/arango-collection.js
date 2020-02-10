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
import { $$asyncIterator } from 'iterall';
import { Span, SpanContext, Tracer } from "opentracing";
import type { QConfig } from "./config";
import type { QLog } from "./logs";
import QLogs from "./logs";
import QAuth from "./q-auth";
import type { QType } from "./q-types";
import { QParams } from "./q-types";
import { QTracer } from "./tracer";

export type GraphQLRequestContext = {
    config: QConfig,
    auth: QAuth,
    tracer: Tracer,

    remoteAddress?: string,
    accessKey: string,
    parentSpan: (Span | SpanContext | typeof undefined),

    shared: Map<string, any>,
}

type OrderBy = {
    path: string,
    direction: string,
}

export async function wrap<R>(log: QLog, op: string, args: any, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        log.error('FAILED', op, args, err.message || err.ArangoError || err.toString());
        throw err;
    }
}

class RegistryMap<T> {
    name: string;
    items: Map<number, T>;
    lastId: number;

    constructor(name: string) {
        this.name = name;
        this.lastId = 0;
        this.items = new Map();
    }

    add(item: T): number {
        let id = this.lastId;
        do {
            id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
        } while (this.items.has(id));
        this.lastId = id;
        this.items.set(id, item);
        return id;
    }

    remove(id: number) {
        if (!this.items.delete(id)) {
            console.error(`Failed to remove ${this.name}: item with id [${id}] does not exists`);
        }
    }

    entries(): [number, T][] {
        return [...this.items.entries()];
    }

    values(): T[] {
        return [...this.items.values()];
    }
}

export type FieldSelection = {
    name: string,
    selection: FieldSelection[],
}

function parseSelectionSet(selectionSet: any, returnFieldSelection: string): FieldSelection[] {
    const fields: FieldSelection[] = [];
    const selections = selectionSet && selectionSet.selections;
    if (selections) {
        for (const item of selections) {
            const name = (item.name && item.name.value) || '';
            if (name) {
                const field: FieldSelection = {
                    name,
                    selection: parseSelectionSet(item.selectionSet, ''),
                };
                if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
                    return field.selection;
                }
                fields.push(field);
            }
        }
    }
    return fields;
}

export function selectionToString(selection: FieldSelection[]): string {
    return selection
        .filter(x => x.name !== '__typename')
        .map((field: FieldSelection) => {
            const fieldSelection = selectionToString(field.selection);
            return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
        }).join(' ');
}

function selectFields(doc: any, selection: FieldSelection[]): any {
    const selected: any = {};
    if (doc._key) {
        selected._key = doc._key;
        selected.id = doc._key;
    }
    for (const item of selection) {
        const onField = {
            in_message: 'in_msg',
            out_messages: 'out_msg',
            signatures: 'id',
        }[item.name];
        if (onField !== undefined && doc[onField] !== undefined) {
            selected[onField] = doc[onField];
        }
        const value = doc[item.name];
        if (value !== undefined) {
            selected[item.name] = item.selection.length > 0 ? selectFields(value, item.selection) : value;
        }
    }
    return selected;
}

type DatabaseQuery = {
    filter: any,
    selection: FieldSelection[],
    orderBy: OrderBy[],
    limit: number,
    timeout: number,
    text: string,
    params: { [string]: any },
}

export class CollectionListener {
    collection: Collection;
    id: ?number;
    filter: any;
    selection: FieldSelection[];
    startTime: number;

    constructor(collection: Collection, filter: any, selection: FieldSelection[]) {
        this.collection = collection;
        this.filter = filter;
        this.selection = selection;
        this.id = collection.listeners.add(this);
        this.startTime = Date.now();
    }

    close() {
        const id = this.id;
        if (id !== null && id !== undefined) {
            this.id = null;
            this.collection.listeners.remove(id);
        }
    }

    onDocumentInsertOrUpdate(doc: any) {
    }

    getEventCount(): number {
        return 0;
    }
}


export class WaitForListener extends CollectionListener {
    onInsertOrUpdate: (doc: any) => void;

    constructor(collection: Collection, q: DatabaseQuery, onInsertOrUpdate: (doc: any) => void) {
        super(collection, q.filter, q.selection);
        this.onInsertOrUpdate = onInsertOrUpdate;
    }

    onDocumentInsertOrUpdate(doc: any) {
        this.onInsertOrUpdate(doc);
    }
}


//$FlowFixMe
export class SubscriptionListener extends CollectionListener implements AsyncIterator<any> {
    eventCount: number;
    pullQueue: ((value: any) => void)[];
    pushQueue: any[];
    running: boolean;

    constructor(collection: Collection, filter: any, selection: FieldSelection[]) {
        super(collection, filter, selection);
        this.eventCount = 0;
        this.pullQueue = [];
        this.pushQueue = [];
        this.running = true;
    }

    onDocumentInsertOrUpdate(doc: any) {
        if (!this.isQueueOverflow() && this.collection.docType.test(null, doc, this.filter)) {
            this.pushValue({ [this.collection.name]: selectFields(doc, this.selection) });
        }
    }

    isQueueOverflow(): boolean {
        return this.getQueueSize() >= 10;
    }

    getEventCount(): number {
        return this.eventCount;
    }

    getQueueSize(): number {
        return this.pushQueue.length + this.pullQueue.length;
    }

    pushValue(value: any) {
        const queueSize = this.getQueueSize();
        if (queueSize > this.collection.maxQueueSize) {
            this.collection.maxQueueSize = queueSize;
        }
        this.eventCount += 1;
        if (this.pullQueue.length !== 0) {
            this.pullQueue.shift()(this.running
                ? { value, done: false }
                : { value: undefined, done: true },
            );
        } else {
            this.pushQueue.push(value);
        }
    }

    async next(): Promise<any> {
        return new Promise((resolve) => {
            if (this.pushQueue.length !== 0) {
                resolve(this.running
                    ? { value: this.pushQueue.shift(), done: false }
                    : { value: undefined, done: true },
                );
            } else {
                this.pullQueue.push(resolve);
            }
        });
    }

    async return(): Promise<any> {
        this.close();
        await this.emptyQueue();
        return { value: undefined, done: true };
    }

    async throw(error?: any): Promise<any> {
        this.close();
        await this.emptyQueue();
        return Promise.reject(error);
    }

    //$FlowFixMe
    [$$asyncIterator]() {
        return this;
    }

    async emptyQueue() {
        if (this.running) {
            this.running = false;
            this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
            this.pullQueue = [];
            this.pushQueue = [];
        }
    }

}

export type QueryStat = {
    estimatedCost: number,
    slow: boolean,
    times: number[],
}


export class Collection {
    name: string;
    docType: QType;

    log: QLog;
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
        tracer: Tracer,
        db: Database,
        slowDb: Database,
    ) {
        this.name = name;
        this.docType = docType;

        this.log = logs.create(name);
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
            if (this.docType.test(null, doc, listener.filter)) {
                listener.onDocumentInsertOrUpdate(doc);
            }
        }
    }

    subscriptionResolver() {
        return {
            subscribe: (_: any, args: { filter: any }, _context: any, info: any) => {
                const result = new SubscriptionListener(
                    this,
                    args.filter || {},
                    parseSelectionSet(info.operation.selectionSet, this.name)
                );
                return result;
            },
        }
    }

    // Queries

    createDatabaseQuery(
        args: {
            filter?: any,
            orderBy?: OrderBy[],
            limit?: number,
            timeout?: number,
        },
        selectionInfo: any,
    ): ?DatabaseQuery {
        const filter = args.filter || {};
        const params = new QParams();
        const filterSection = Object.keys(filter).length > 0
            ? `FILTER ${this.docType.ql(params, 'doc', filter)}`
            : '';
        if (filterSection === 'FILTER false') {
            return null;
        }
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
            params: params.values
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
        return async (parent: any, args: any, context: GraphQLRequestContext, info: any) => wrap(this.log, 'QUERY', args, async () => {
            await context.auth.requireGrantedAccess(context.accessKey || args.accessKey);
            const q = this.createDatabaseQuery(args, info.operation.selectionSet);
            if (!q) {
                this.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);
                return [];
            }
            const stat = await this.ensureQueryStat(q);
            const start = Date.now();
            const result = q.timeout > 0
                ? await this.queryWaitFor(q, stat, context.parentSpan)
                : await this.query(q, stat, context.parentSpan);
            this.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST', context.remoteAddress);
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

    async query(q: DatabaseQuery, stat: QueryStat, parentSpan?: (Span | SpanContext)): Promise<any> {
        return QTracer.trace(this.tracer, `${this.name}.query`, async (span: Span) => {
            Collection.setQueryTraceParams(q, span);
            return this.queryDatabase(q, stat);
        }, parentSpan);
    }

    async queryDatabase(q: DatabaseQuery, stat: QueryStat): Promise<any> {
        const db = stat.slow ? this.slowDb : this.db;
        const start = Date.now();
        const cursor = await db.query(q.text, q.params);
        const result = await cursor.all();
        stat.times.push(Date.now() - start);
        if (stat.times.length > 100) {
            stat.times.shift();
        }
        return result;
    }


    async queryWaitFor(q: DatabaseQuery, stat: QueryStat, parentSpan?: (Span | SpanContext)): Promise<any> {
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
                    waitFor = new WaitForListener(this, q, (doc) => {
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

    async fetchDocByKey(key: string): Promise<any> {
        if (!key) {
            return Promise.resolve(null);
        }
        return wrap(this.log, 'FETCH_DOC_BY_KEY', key, async () => {
            return this.dbCollection().document(key, true);
        });
    }

    async fetchDocsByKeys(keys: string[]): Promise<any[]> {
        if (!keys || keys.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(keys.map(key => this.fetchDocByKey(key)));
    }
}

