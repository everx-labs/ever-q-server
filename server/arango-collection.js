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

import { PubSub, withFilter } from "apollo-server";
import { Database, DocumentCollection } from "arangojs";
import QLogs from "./logs";
import type { QLog } from "./logs";
import type { QType } from "./q-types";
import { QParams } from "./q-types";
import { Tracer } from "./tracer";

export type CollectionSubscription = {
    filter: any,
    iter: any,
    eventCount: number,
}

type CollectionWaitFor = {
    filter: any,
    onInsertOrUpdate: (doc: any) => void,
}

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

export class Collection {
    name: string;
    docType: QType;

    pubsub: PubSub;
    log: QLog;
    changeLog: ChangeLog;
    tracer: Tracer;
    db: Database;

    subscriptions: RegistryMap<CollectionSubscription>;
    waitFor: RegistryMap<CollectionWaitFor>;

    constructor(
        name: string,
        docType: QType,
        pubsub: PubSub,
        logs: QLogs,
        changeLog: ChangeLog,
        tracer: Tracer,
        db: Database,
    ) {
        this.name = name;
        this.docType = docType;

        this.pubsub = pubsub;
        this.log = logs.create(name);
        this.changeLog = changeLog;
        this.tracer = tracer;
        this.db = db;

        this.subscriptions = new RegistryMap<CollectionSubscription>(`${name} subscriptions`);
        this.waitFor = new RegistryMap<CollectionWaitFor>(`${name} waitFor`);
    }

    // Subscriptions

    getSubscriptionPubSubName(id: number) {
        return `${this.name}${id}`;
    }

    onDocumentInsertOrUpdate(doc: any) {
        for (const [id, { filter }] of this.subscriptions.entries()) {
            if (this.docType.test(null, doc, filter)) {
                this.pubsub.publish(this.getSubscriptionPubSubName(id), { [this.name]: doc });
            }
        }
        for (const { filter, onInsertOrUpdate } of this.waitFor.items.values()) {
            if (this.docType.test(null, doc, filter)) {
                onInsertOrUpdate(doc);
            }
        }
    }

    subscriptionResolver() {
        return {
            subscribe: withFilter(
                (_, args) => {
                    const subscription: any = {
                        filter: args.filter || {},
                        eventCount: 0,
                    };
                    const subscriptionId = this.subscriptions.add(subscription);
                    const iter = this.pubsub.asyncIterator(this.getSubscriptionPubSubName(subscriptionId));
                    subscription.iter = iter;
                    const _this = this;
                    return {
                        next(value?: any): Promise<any> {
                            subscription.eventCount += 1;
                            return iter.next(value);
                        },
                        return(value?: any): Promise<any> {
                            _this.subscriptions.remove(subscriptionId);
                            return iter.return(value);
                        },
                        throw(e?: any): Promise<any> {
                            _this.subscriptions.remove(subscriptionId);
                            return iter.throw(e);
                        }
                    };
                },
                (data, args) => {
                    try {
                        const doc = data[this.name];
                        if (this.changeLog.enabled) {
                            this.changeLog.log(doc._key, Date.now());
                        }
                        return this.docType.test(null, doc, args.filter || {});
                    } catch (error) {
                        console.error('[Subscription] doc test failed', data, error);
                        throw error;
                    }
                }
            ),
        }
    }

    // Queries

    queryResolver() {
        return async (parent: any, args: any, context: any) => wrap(this.log, 'QUERY', args, async () => {
            this.log.debug('QUERY', args);
            const filter = args.filter || {};
            const orderBy: OrderBy[] = args.orderBy || [];
            const limit: number = args.limit || 50;
            const timeout = (Number(args.timeout) || 0) * 1000;
            const q = this.genQuery(filter, orderBy, limit);

            const span = await this.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);
            try {
                if (timeout > 0) {
                    return await this.queryWaitFor(q, filter, timeout);
                } else {
                    return await this.query(q);
                }
            } finally {
                await span.finish();
            }
        });
    }

    async query(q: Query): Promise<any> {
        const cursor = await this.db.query(q);
        return await cursor.all();
    }


    async queryWaitFor(q: Query, filter: any, timeout: number): Promise<any> {
        let waitForResolve: ?((docs: any[]) => void) = null;
        const waitForId = this.waitFor.add({
            filter,
            onInsertOrUpdate: (doc) => {
                if (waitForResolve) {
                    waitForResolve([doc]);
                }
            }
        });
        try {
            return await Promise.race([
                new Promise((resolve, reject) => {
                    this.query(q)
                        .then((docs) => {
                            if (docs.length > 0) {
                                resolve(docs)
                            }
                        }, (err) => {
                            reject(err);
                        })
                }),
                new Promise((resolve) => {
                    waitForResolve = resolve;
                }),
                new Promise((resolve) => {
                    setTimeout(() => resolve([]), timeout);
                }),
            ]);
        } finally {
            this.waitFor.remove(waitForId);
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
