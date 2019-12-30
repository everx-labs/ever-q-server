/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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

import { $$asyncIterator } from 'iterall';
import { Database, DocumentCollection } from "arangojs";
import QLogs from "./logs";
import type { QLog } from "./logs";
import type { QType } from "./q-types";
import { QParams } from "./q-types";
import { Tracer } from "./tracer";

type OrderBy = {
    path: string,
    direction: string,
}

type Query = {
    query: string,
    bindVars: { [string]: any },
}

export async function wrap<R>(log: QLog, op: string, args: any, fetch: () => Promise<R>) {
    try {
        return await fetch();
    } catch (err) {
        const error = {
            message: err.message || err.ArangoError || err.toString(),
            code: err.code
        };
        log.error('FAILED', op, args, error.message);
        throw error;
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

function selectFields(doc: any, selection: FieldSelection[]): any {
    const selected: any = {};
    if (doc._key) {
        selected._key = doc._key;
    }
    for (const item of selection) {
        const value = doc[item.name];
        if (value !== undefined) {
            selected[item.name] = item.selection.length > 0 ? selectFields(value, item.selection) : value;
        }
    }
    return selected;
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

    constructor(collection: Collection, filter: any, selection: FieldSelection[], onInsertOrUpdate: (doc: any) => void) {
        super(collection, filter, selection);
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
    changeLog: ChangeLog;
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
        changeLog: ChangeLog,
        tracer: Tracer,
        db: Database,
        slowDb: Database,
    ) {
        this.name = name;
        this.docType = docType;

        this.log = logs.create(name);
        this.changeLog = changeLog;
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
                return new SubscriptionListener(
                    this,
                    args.filter || {},
                    parseSelectionSet(info.operation.selectionSet, this.name),
                );
            },
        }
    }

    // Queries

    async ensureQueryStat(q: Query): Promise<QueryStat> {
        const existing = this.queryStats.get(q.query);
        if (existing !== undefined) {
            return existing;
        }
        const plan = (await this.db.explain(q)).plan;
        const stat = {
            estimatedCost: plan.estimatedCost,
            slow: false,
            times: [],
        };
        if (plan.nodes.find(node => node.type === 'EnumerateCollectionNode')) {
            stat.slow = true;
        }
        this.queryStats.set(q.query, stat);
        return stat;
    }

    queryResolver() {
        return async (parent: any, args: any, context: any, info: any) => wrap(this.log, 'QUERY', args, async () => {
            const filter = args.filter || {};
            const selection = parseSelectionSet(info.operation.selectionSet, this.name);
            const orderBy: OrderBy[] = args.orderBy || [];
            const limit: number = args.limit || 50;
            const timeout = (Number(args.timeout) || 0) * 1000;
            const q = this.genQuery(filter, orderBy, limit);
            const stat = await this.ensureQueryStat(q);
            const span = await this.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);
            try {
                const start = Date.now();
                const result = timeout > 0
                    ? await this.queryWaitFor(q, stat, filter, selection, timeout)
                    : await this.query(q, stat);
                this.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST');
                return result;
            } finally {
                await span.finish();
            }
        });
    }

    async query(q: Query, stat: QueryStat): Promise<any> {
        const db = stat.slow ? this.slowDb : this.db;
        const start = Date.now();
        const cursor = await db.query(q);
        const result = await cursor.all();
        stat.times.push(Date.now() - start);
        if (stat.times.length > 1000) {
            stat.times.shift();
        }
        return result;
    }


    async queryWaitFor(q: Query, stat: QueryStat, filter: any, selection: FieldSelection[], timeout: number): Promise<any> {
        let waitFor: ?WaitForListener = null;
        let forceTimerId: ?TimeoutID = null;
        try {
            const onQuery = new Promise((resolve, reject) => {
                const check = () => {
                    this.query(q, stat).then((docs) => {
                        if (docs.length > 0) {
                            forceTimerId = null;
                            resolve(docs);
                        } else {
                            forceTimerId = setTimeout(check, 5_000);
                        }
                    }, reject);
                };
                check();
            });
            const onChangesFeed = new Promise((resolve) => {
                waitFor = new WaitForListener(this, filter, selection, (doc) => {
                    resolve([doc])
                });
            });
            const onTimeout = new Promise((resolve) => {
                setTimeout(() => resolve([]), timeout);
            });
            return await Promise.race([
                onQuery,
                onChangesFeed,
                onTimeout,
            ]);
        } finally {
            if (waitFor !== null && waitFor !== undefined) {
                waitFor.close();
            }
            if (forceTimerId !== null) {
                clearTimeout(forceTimerId);
                forceTimerId = null;
            }

        }
    }


    genQuery(filter: any, orderBy: OrderBy[], limit: number): Query {
        const params = new QParams();
        const filterSection = Object.keys(filter).length > 0
            ? `FILTER ${this.docType.ql(params, 'doc', filter)}`
            : '';
        const orderByQl = orderBy
            .map((field) => {
                const direction = (field.direction && field.direction.toLowerCase() === 'desc')
                    ? ' DESC'
                    : '';
                return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
            })
            .join(', ');

        const sortSection = orderByQl !== '' ? `SORT ${orderByQl}` : '';
        const limitQl = Math.min(limit, 50);
        const limitSection = `LIMIT ${limitQl}`;

        const query = `
            FOR doc IN ${this.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
        return {
            query,
            bindVars: params.values
        };
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

export class ChangeLog {
    enabled: boolean;
    records: Map<string, number[]>;

    constructor() {
        this.enabled = false;
        this.records = new Map();
    }

    clear() {
        this.records.clear();
    }

    log(id: string, time: number) {
        if (!this.enabled) {
            return;
        }
        const existing = this.records.get(id);
        if (existing) {
            existing.push(time);
        } else {
            this.records.set(id, [time]);
        }
    }

    get(id: string): number[] {
        return this.records.get(id) || [];
    }
}
