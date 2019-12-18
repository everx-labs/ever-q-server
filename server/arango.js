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
import { Database, DocumentCollection } from 'arangojs';
import arangochair from 'arangochair';
import { PubSub, withFilter } from 'apollo-server';
import { ensureProtocol } from './config';
import { QParams } from './q-types';
import type { QType } from './q-types';
import type { QConfig } from './config'
import type { QLog } from './logs';
import QLogs from './logs'
const { Tags, FORMAT_HTTP_HEADERS, FORMAT_TEXT_MAP } = require('opentracing');

type CollectionFilters = {
    lastId: number,
    docType: QType,
    filtersById: Map<number, any>
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


export default class Arango {
    config: QConfig;
    log: QLog;
    changeLog: ChangeLog;
    serverAddress: string;
    databaseName: string;
    pubsub: PubSub;
    db: Database;
    transactions: DocumentCollection;
    messages: DocumentCollection;
    accounts: DocumentCollection;
    blocks: DocumentCollection;
    collections: DocumentCollection[];
    listener: any;
    filtersByCollectionName: Map<string, CollectionFilters>;

    constructor(config: QConfig, logs: QLogs, tr: JaegerTracer) {
        this.config = config;
        this.log = logs.create('Arango');
        this.changeLog = new ChangeLog();
        this.serverAddress = config.database.server;
        this.databaseName = config.database.name;
        this.tracer = tr;

        this.pubsub = new PubSub();

        this.db = new Database({
            url: `${ensureProtocol(this.serverAddress, 'http')}`,
        });
        this.db.useDatabase(this.databaseName);
        if (this.config.database.auth) {
            const authParts = this.config.database.auth.split(':');
            this.db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
        }

        this.transactions = this.db.collection('transactions');
        this.messages = this.db.collection('messages');
        this.accounts = this.db.collection('accounts');
        this.blocks = this.db.collection('blocks');
        this.collections = [
            this.transactions,
            this.messages,
            this.accounts,
            this.blocks
        ];
        this.filtersByCollectionName = new Map();
    }

    addFilter(collection: string, docType: QType, filter: any): number {
        let filters: CollectionFilters;
        const existing = this.filtersByCollectionName.get(collection);
        if (existing) {
            filters = existing;
        } else {
            filters = {
                lastId: 0,
                docType,
                filtersById: new Map()
            };
            this.filtersByCollectionName.set(collection, filters);
        }
        do {
            filters.lastId = filters.lastId < Number.MAX_SAFE_INTEGER ? filters.lastId + 1 : 1;
        } while (filters.filtersById.has(filters.lastId));
        filters.filtersById.set(filters.lastId, filter);
        return filters.lastId;
    }

    removeFilter(collection: string, id: number) {
        const filters = this.filtersByCollectionName.get(collection);
        if (filters) {
            if (filters.filtersById.delete(id)) {
                return;
            }
        }
        console.error(`Failed to remove filter ${collection}[${id}]: filter does not exists`);
    }

    start() {
        const listenerUrl = `${ensureProtocol(this.serverAddress, 'http')}/${this.databaseName}`;
        this.listener = new arangochair(listenerUrl);

        if (this.config.database.auth) {
            const userPassword = Buffer.from(this.config.database.auth).toString('base64');
            this.listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
        }

        this.collections.forEach(collection => {
            const name = collection.name;
            this.listener.subscribe({ collection: name });
            this.listener.on(name, (docJson, type) => {
                if (type === 'insert/update') {
                    const doc = JSON.parse(docJson);
                    if (this.changeLog.enabled) {
                        this.changeLog.log(doc._key, Date.now());
                    }
                    const filters = this.filtersByCollectionName.get(name);
                    if (filters) {
                        for (const filter of filters.filtersById.values()) {
                            if (filters.docType.test(null, doc, filter || {})) {
                                this.pubsub.publish(name, { [name]: doc });
                                break;
                            }
                        }
                    }

                }
            });
        });
        this.listener.start();
        this.log.debug('Listen database', listenerUrl);
        this.listener.on('error', (err, httpStatus, headers, body) => {
            this.log.error('Listener failed: ', { err, httpStatus, headers, body });
            setTimeout(() => this.listener.start(), this.config.listener.restartTimeout);
        });
    }

    collectionQuery(collection: DocumentCollection, filter: any) {
        return async (parent: any, args: any, context: any) => {
            this.log.debug(`Query ${collection.name}`, args);
            return this.fetchDocs(collection, args, filter, context.span_ctx);
        }
    }

    selectQuery() {
        return async (parent: any, args: any, context: any) => {
            const query = args.query;
            const bindVars = JSON.parse(args.bindVarsJson);
            return JSON.stringify(await this.fetchQuery(query, bindVars, context.span_ctx));
        }
    }


    collectionSubscription(collection: DocumentCollection, docType: QType) {
        return {
            subscribe: withFilter(
                (_, args) => {
                    const iter = this.pubsub.asyncIterator(collection.name);
                    const filterId = this.addFilter(collection.name, docType, args.filter);
                    const _this = this;
                    return {
                        next(value?: any): Promise<any> {
                            return iter.next(value);
                        },
                        return(value?: any): Promise<any> {
                            _this.removeFilter(collection.name, filterId);
                            return iter.return(value);
                        },
                        throw(e?: any): Promise<any> {
                            _this.removeFilter(collection.name, filterId);
                            return iter.throw(e);
                        }
                    };
                },
                (data, args) => {
                    try {
                        const doc = data[collection.name];
                        if (this.changeLog.enabled) {
                            this.changeLog.log(doc._key, Date.now());
                        }
                        return docType.test(null, doc, args.filter || {});
                    } catch (error) {
                        console.error('[Subscription] doc test failed', data, error);
                        throw error;
                    }
                }
            ),
        }
    }

    async wrap<R>(fetch: () => Promise<R>) {
        try {
            return await fetch();
        } catch (err) {
            const error = {
                message: err.message || err.ArangoError || err.toString(),
                code: err.code
            };
            this.log.error('Db operation failed: ', err);
            throw error;
        }
    }

    async fetchDocs(collection: DocumentCollection, args: any, docType: QType, span_ctx: any) {
        return this.wrap(async () => {
            const span = await this.tracer.startSpan('arango.js:fetchDocs', {
                    childOf: span_ctx,
            });
            await span.setTag(Tags.SPAN_KIND, 'server');
            const filter = args.filter || {};
            const params = new QParams();
            const filterSection = Object.keys(filter).length > 0
                ? `FILTER ${docType.ql(params, 'doc', filter)}`
                : '';
            const orderBy = (args.orderBy || [])
                .map((field) => {
                    const direction = (field.direction && field.direction.toLowerCase() === 'desc')
                        ? ' DESC'
                        : '';
                    span.finish();
                    return `doc.${field.path.replace(/\bid\b/gi, '_key')}${direction}`;
                })
                .join(', ');

            const sortSection = orderBy !== '' ? `SORT ${orderBy}` : '';
            const limit = Math.min(args.limit || 50, 50);
            const limitSection = `LIMIT ${limit}`;

            const query = `
            FOR doc IN ${collection.name}
            ${filterSection}
            ${sortSection}
            ${limitSection}
            RETURN doc`;
            await span.log({
                'event': 'new query',
                'value': query
            });
            const cursor = await this.db.query({ query, bindVars: params.values });
            const res = await cursor.all();
            await span.finish();
            return res;
        });
    }

    async fetchDocByKey(collection: DocumentCollection, key: string): Promise<any> {
        if (!key) {
            return Promise.resolve(null);
        }
        return this.wrap(async () => {
            return collection.document(key, true);
        });
    }

    async fetchDocsByKeys(collection: DocumentCollection, keys: string[]): Promise<any[]> {
        if (!keys || keys.length === 0) {
            return Promise.resolve([]);
        }
        return Promise.all(keys.map(key => this.fetchDocByKey(collection, key)));
    }

    async fetchQuery(query: any, bindVars: any, span_ctx: any) {
        return this.wrap(async () => {
            const span = await this.tracer.startSpan('arango.js:fetchQuery', {
                childOf: span_ctx
            });
            await span.setTag(Tags.SPAN_KIND, 'server');
            await span.log({
                'event': 'new query',
                'value': query
            });
            const cursor = await this.db.query({ query, bindVars });
            const res = cursor.all();
            await span.finish();
            return res;
        });
    }
}
