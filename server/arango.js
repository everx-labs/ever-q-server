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
import type { QType } from "./arango-types";
import type { QConfig } from './config'
import type { QLog } from "./logs";
import QLogs from './logs'


export default class Arango {
    config: QConfig;
    log: QLog;
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

    constructor(config: QConfig, logs: QLogs) {
        this.config = config;
        this.log = logs.create('Arango');
        this.serverAddress = config.database.server;
        this.databaseName = config.database.name;

        this.pubsub = new PubSub();

        this.db = new Database(`http://${this.serverAddress}`);
        this.db.useDatabase(this.databaseName);

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
    }

    start() {
        const listenerUrl = `http://${this.serverAddress}/${this.databaseName}`;
        this.listener = new arangochair(listenerUrl);
        this.collections.forEach(collection => {
            const name = collection.name;
            this.listener.subscribe({ collection: name });
            this.listener.on(name, (docJson, type) => {
                if (type === 'insert/update') {
                    const doc = JSON.parse(docJson);
                    this.pubsub.publish(name, { [name]: doc });
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
        return async (parent: any, args: any) => {
            this.log.debug(`Query ${collection.name}`, args);
            return this.fetchDocs(collection, args, filter);
        }
    }

    selectQuery() {
        return async (parent: any, args: any) => {
            const query = args.query;
            const bindVars = JSON.parse(args.bindVarsJson);
            return JSON.stringify(await this.fetchQuery(query, bindVars));
        }
    }


    collectionSubscription(collection: DocumentCollection, docType: QType) {
        return {
            subscribe: withFilter(
                () => {
                    return this.pubsub.asyncIterator(collection.name);
                },
                (data, args) => {
                    return docType.test(data[collection.name], args.filter);
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

    async fetchDocs(collection: DocumentCollection, args: any, docType: QType) {
        return this.wrap(async () => {
            const filter = args.filter || {};
            const filterSection = Object.keys(filter).length > 0
                ? `FILTER ${docType.ql('doc', filter)}`
                : '';
            const orderBy = (args.orderBy || [])
                .map((field) => {
                    const direction = (field.direction && field.direction.toLowerCase() === 'desc')
                        ? ' DESC'
                        : '';
                    return `doc.${field.path}${direction}`;
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
            const cursor = await this.db.query({ query, bindVars: {} });
            return await cursor.all();
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

    async fetchQuery(query: any, bindVars: any) {
        return this.wrap(async () => {
            const cursor = await this.db.query({ query, bindVars });
            return cursor.all();
        });
    }
}
