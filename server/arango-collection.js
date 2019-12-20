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

type CollectionSubscription = {
    filter: any,
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

export class Collection {
    name: string;
    docType: QType;

    pubsub: PubSub;
    log: QLog;
    changeLog: ChangeLog;
    tracer: Tracer;
    db: Database;

    lastSubscriptionId: number;
    subscriptionsById: Map<number, CollectionSubscription>;

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

        this.lastSubscriptionId = 0;
        this.subscriptionsById = new Map();
    }

    // Subscriptions

    addSubscription(filter: any): number {
        let id = this.lastSubscriptionId;
        do {
            id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
        } while (this.subscriptionsById.has(id));
        this.lastSubscriptionId = id;
        this.subscriptionsById.set(id, { filter });
        return id;
    }

    getSubscriptionPubSubName(id: number) {
        return `${this.name}${id}`;
    }

    removeSubscription(id: number) {
        if (!this.subscriptionsById.delete(id)) {
            console.error(`Failed to remove subscription ${this.name}[${id}]: subscription does not exists`);
        }
    }

    onDocumentInsertOrUpdate(doc: any) {
        for (const [id, { filter }] of this.subscriptionsById.entries()) {
            if (this.docType.test(null, doc, filter || {})) {
                this.pubsub.publish(this.getSubscriptionPubSubName(id), { [this.name]: doc });
            }
        }
    }

    subscriptionResolver() {
        return {
            subscribe: withFilter(
                (_, args) => {
                    const subscriptionId = this.addSubscription(args.filter);
                    const iter = this.pubsub.asyncIterator(this.getSubscriptionPubSubName(subscriptionId));
                    return {
                        next(value?: any): Promise<any> {
                            return iter.next(value);
                        },
                        return(value?: any): Promise<any> {
                            this.removeSubscription(subscriptionId);
                            return iter.return(value);
                        },
                        throw(e?: any): Promise<any> {
                            this.removeSubscription(subscriptionId);
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
            const aql = this.genAQL(args);
            const span = await this.tracer.startSpanLog(
                context,
                'arango.js:fetchDocs',
                'new query',
                args
            );
            try {
                const cursor = await this.db.query(aql);
                return await cursor.all();
            } finally {
                await span.finish();
            }
        });
    }

    genAQL(args: any): { query: string, bindVars: { [string]: any } } {
        const filter = args.filter || {};
        const params = new QParams();
        const filterSection = Object.keys(filter).length > 0
            ? `FILTER ${this.docType.ql(params, 'doc', filter)}`
            : '';
        const orderBy = (args.orderBy || [])
            .map((field) => {
                const direction = (field.direction && field.direction.toLowerCase() === 'desc')
                    ? ' DESC'
                    : '';
                return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
            })
            .join(', ');

        const sortSection = orderBy !== '' ? `SORT ${orderBy}` : '';
        const limit = Math.min(args.limit || 50, 50);
        const limitSection = `LIMIT ${limit}`;

        const query = `
            FOR doc IN ${this.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
        return { query, bindVars: params.values };
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
