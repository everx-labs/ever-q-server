// @flow
import arangochair from 'arangochair';
import { Database } from 'arangojs';
import EventEmitter from 'events';
import { ensureProtocol } from '../config';
import type { QArangoConfig } from '../config';
import type { QLog } from '../logs';
import type { QDataEvent, QDataProvider, QDoc, QIndexInfo } from './data-provider';
import url from 'url';

type ArangoEventHandler = (err: any, status: string, headers: { [string]: any }, body: string) => void;

interface ArangoListener {
    req: {
        opts: {
            headers: { [string]: any },
        }
    };

    on(event: string, handler: ArangoEventHandler): void;

    subscribe(params: { collection: string }): void;

    start(): void;
}

export class ArangoProvider implements QDataProvider {
    log: QLog;
    config: QArangoConfig;

    started: boolean;
    arango: Database;
    collectionsForSubscribe: string[];
    listener: ?ArangoListener;
    listenerSubscribers: EventEmitter;
    listenerSubscribersCount: number;


    constructor(log: QLog, config: QArangoConfig) {
        this.log = log;
        this.config = config;

        this.started = false;
        this.arango = new Database({
            url: `${ensureProtocol(config.server, 'http')}`,
            agentOptions: {
                maxSockets: config.maxSockets,
            },
        });
        this.arango.useDatabase(config.name);
        if (config.auth) {
            const authParts = config.auth.split(':');
            this.arango.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
        }
        this.collectionsForSubscribe = [];
        this.listener = null;
        this.listenerSubscribers = new EventEmitter();
        this.listenerSubscribers.setMaxListeners(0);
        this.listenerSubscribersCount = 0;
    }

    async start(collectionsForSubscribe: string[]): Promise<any> {
        this.started = true;
        this.collectionsForSubscribe = collectionsForSubscribe;
        this.checkStartListener();
        return Promise.resolve();
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.arango.collection(collection).indexes();
    }

    /**
     * Returns object with collection names in keys and collection size in values.
     */
    async loadFingerprint(): Promise<any> {
        const collectionNames = (await this.arango.listCollections()).map(descr => descr.name);
        // TODO: add this when required a new version arangojs v7.x.x
        // await Promise.all(collections.map(col => this.arango.collection(col).recalculateCount()));
        const results = await Promise.all(collectionNames.map(col => this.arango.collection(col).count()));
        const fingerprint: any = {};
        collectionNames.forEach((collectionName, i) => {
            fingerprint[collectionName] = results[i].count;
        });
        return fingerprint;
    }

    async hotUpdate(): Promise<any> {
        return Promise.resolve();
    }

    async query(text: string, vars: { [string]: any }): Promise<any> {
        const cursor = await this.arango.query(text, vars);
        return cursor.all();
    }

    async subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.on(collection, listener);
            this.listenerSubscribersCount += 1;
        }
        this.checkStartListener();
        return {
            collection,
            listener,
        };
    }


    unsubscribe(subscription: any) {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.removeListener(subscription.collection, subscription.listener);
            this.listenerSubscribersCount = Math.max(this.listenerSubscribersCount - 1, 0);
        }
    }

    // Internals

    checkStartListener() {
        if (!this.started) {
            return;
        }
        if (this.listener) {
            return;
        }
        if (this.collectionsForSubscribe.length === 0) {
            return;
        }
        if (this.listenerSubscribersCount === 0) {
            return;
        }
        this.listener = this.createAndStartListener();
    }

    createAndStartListener(): ArangoListener {
        const { server, name, auth } = this.config;
        const dbUrl = ensureProtocol(server, 'http');
        const listenerUrl = `${dbUrl}/${name}`;

        const listener = new arangochair(listenerUrl);
        const parsedDbUrl = url.parse(dbUrl);

        const pathPrefix = parsedDbUrl.path !== "/" ? (parsedDbUrl.path || "") : "";
        listener._loggerStatePath = `${pathPrefix}/_db/${name}/_api/replication/logger-state`;
        listener._loggerFollowPath = `${pathPrefix}/_db/${name}/_api/replication/logger-follow`;

        if (this.config.auth) {
            const userPassword = Buffer.from(auth).toString('base64');
            listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
        }

        this.collectionsForSubscribe.forEach((collectionName) => {
            listener.subscribe({ collection: collectionName });
            listener.on(collectionName, (docJson, type) => {
                if (type === 'insert/update' || type === 'insert' || type === 'update') {
                    this.onDataEvent(type, collectionName, docJson);
                }
            });
        })

        listener.on('error', (err, status, headers, body) => {
            let error = err;
            try {
                error = JSON.parse(body);
            } catch {
            }
            this.log.error('FAILED', 'LISTEN', `${err}`, error);
            setTimeout(() => listener.start(), this.config.listenerRestartTimeout || 1000);
        });
        listener.start();
        return listener;
    }

    onDataEvent(event: QDataEvent, collection: string, doc: QDoc) {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.emit(collection, doc, event);
        }
    }

}
