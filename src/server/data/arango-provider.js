// @flow
import arangochair from 'arangochair';
import { Database } from 'arangojs';
import EventEmitter from 'events';
import { ensureProtocol } from '../config';
import type { QArangoConfig } from '../config';
import type { QLog } from '../logs';
import { dataCollectionInfo } from './data';
import type { QDataEvent, QDataProvider, QDataSegment, QDoc, QCollectionInfo, QIndexInfo } from './data';

const DATA_EVENT = 'data';

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
    segment: QDataSegment;
    config: QArangoConfig;

    started: boolean;
    arango: Database;
    listener: ArangoListener;
    listenerSubscribers: EventEmitter;
    listenerStarted: boolean;


    constructor(
        log: QLog,
        segment: QDataSegment,
        config: QArangoConfig,
    ) {
        this.log = log;
        this.segment = segment;
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
        this.listener = this.createListener();
        this.listenerSubscribers = new EventEmitter();
        this.listenerSubscribers.setMaxListeners(0);
        this.listenerStarted = false;
    }

    start() {
        this.checkStartListener();
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.arango.collection(collection).indexes();
    }

    async query(text: string, vars: { [string]: any }): Promise<any> {
        const cursor = await this.arango.query(text, vars);
        return cursor.all();
    }

    async subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any {
        this.listenerSubscribers?.on(DATA_EVENT, listener);
        this.checkStartListener();
        return listener;
    }


    unsubscribe(subscription: any) {
        this.listenerSubscribers?.removeListener(DATA_EVENT, subscription);
    }

    // Internals

    checkStartListener() {
        const hasSubscribers = this.listenerSubscribers.listenerCount(DATA_EVENT) > 0;
        if (this.started && !this.listenerStarted && hasSubscribers) {
            this.listenerStarted = true;
            this.listener.start();
        }
    }

    createListener(): ArangoListener {
        const { server, name, auth } = this.config;
        const listenerUrl = `${ensureProtocol(server, 'http')}/${name}`;

        const listener = new arangochair(listenerUrl);

        if (this.config.auth) {
            const userPassword = Buffer.from(auth).toString('base64');
            listener.req.opts.headers['Authorization'] = `Basic ${userPassword}`;
        }

        Object.values(dataCollectionInfo).forEach((value) => {
            const collectionInfo = ((value: any): QCollectionInfo);
            const collectionName = collectionInfo.name;
            listener.subscribe({ collection: collectionName });
            listener.on(name, (docJson, type) => {
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
        return listener;
    }

    onDataEvent(event: QDataEvent, collection: string, doc: QDoc) {
        this.listenerSubscribers?.emit(collection, doc, event);
    }

}
