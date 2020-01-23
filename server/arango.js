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

import arangochair from 'arangochair';
import { Database } from 'arangojs';
import { ChangeLog, Collection, wrap } from "./arango-collection";
import type { QConfig } from './config'
import { ensureProtocol } from './config';
import type { QLog } from './logs';
import QLogs from './logs'
import type { QType } from './q-types';
import { Account, Block, BlockSignatures, Message, Transaction } from './resolvers-generated';
import { Tracer } from "./tracer";


export default class Arango {
    config: QConfig;
    log: QLog;
    serverAddress: string;
    databaseName: string;
    db: Database;

    changeLog: ChangeLog;
    tracer: Tracer;

    transactions: Collection;
    messages: Collection;
    accounts: Collection;
    blocks: Collection;
    blocks_signatures: Collection;

    collections: Collection[];
    collectionsByName: Map<string, Collection>;

    listener: any;

    constructor(config: QConfig, logs: QLogs, tracer: Tracer) {
        this.config = config;
        this.log = logs.create('db');
        this.changeLog = new ChangeLog();
        this.serverAddress = config.database.server;
        this.databaseName = config.database.name;
        this.tracer = tracer;

        this.db = new Database({
            url: `${ensureProtocol(this.serverAddress, 'http')}`,
            agentOptions: {
                maxSockets: 100,
            },
        });
        this.db.useDatabase(this.databaseName);
        if (this.config.database.auth) {
            const authParts = this.config.database.auth.split(':');
            this.db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
        }

        this.collections = [];
        this.collectionsByName = new Map();

        const addCollection = (name: string, docType: QType) => {
            const collection = new Collection(
                name,
                docType,
                logs,
                this.changeLog,
                this.tracer,
                this.db
            );
            this.collections.push(collection);
            this.collectionsByName.set(name, collection);
            return collection;
        };

        this.transactions = addCollection('transactions', Transaction);
        this.messages = addCollection('messages', Message);
        this.accounts = addCollection('accounts', Account);
        this.blocks = addCollection('blocks', Block);
        this.blocks_signatures = addCollection('blocks_signatures', BlockSignatures);
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
                    this.onDocumentInsertOrUpdate(name, JSON.parse(docJson));
                }
            });
        });
        this.listener.start();
        this.log.debug('LISTEN', listenerUrl);
        this.listener.on('error', (err) => {
            this.log.error('FAILED', 'LISTEN', `${err}`);
            setTimeout(() => this.listener.start(), this.config.listener.restartTimeout);
        });
    }

    onDocumentInsertOrUpdate(name: string, doc: any) {
        if (this.changeLog.enabled) {
            this.changeLog.log(doc._key, Date.now());
        }
        const collection: (Collection | typeof undefined) = this.collectionsByName.get(name);
        if (collection) {
            collection.onDocumentInsertOrUpdate(doc);
        }
    }


    async fetchQuery(query: any, bindVars: any, context: any) {
        return wrap(this.log, 'QUERY', { query, bindVars }, async () => {
            const span = await this.tracer.startSpanLog(
                context,
                'arango.js:fetchQuery',
                'new query',
                query,
            );
            const cursor = await this.db.query({ query, bindVars });
            const res = cursor.all();
            await span.finish();
            return res;
        });
    }
}
