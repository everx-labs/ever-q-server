import { Database } from "arangojs";
import EventEmitter from "events";
import { ensureProtocol } from "../config";
import type { QArangoConfig } from "../config";
import type { QLog } from "../logs";
import type {
    QDataEvent,
    QDataProvider,
    QDataProviderQueryParams,
    QDoc,
    QIndexInfo,
} from "./data-provider";
import url from "url";
import ArangoChair from "arangochair";
import { QTraceSpan } from "../tracing";

type ArangoCollectionDescr = {
    name: string,
};

type Subscription = {
    collection: string,
    listener: (doc: QDoc, event: QDataEvent) => void
};

export class ArangoProvider implements QDataProvider {
    log: QLog;
    config: QArangoConfig;

    started: boolean;
    arango: Database;
    shard: string;
    collectionsForSubscribe: string[];
    listener: ArangoChair | null;
    listenerSubscribers: EventEmitter;
    listenerSubscribersCount: number;


    constructor(log: QLog, config: QArangoConfig) {
        this.log = log;
        this.config = config;

        this.started = false;
        this.arango = new Database({
            url: `${ensureProtocol(config.server, "http")}`,
            agentOptions: {
                maxSockets: config.maxSockets,
            },
        });
        this.arango.useDatabase(config.name);
        if (config.auth) {
            const authParts = config.auth.split(":");
            this.arango.useBasicAuth(authParts[0], authParts.slice(1).join(":"));
        }
        this.shard = config.name.slice(-5);
        this.collectionsForSubscribe = [];
        this.listener = null;
        this.listenerSubscribers = new EventEmitter();
        this.listenerSubscribers.setMaxListeners(0);
        this.listenerSubscribersCount = 0;
    }

    async start(collectionsForSubscribe: string[]): Promise<void> {
        this.started = true;
        this.collectionsForSubscribe = collectionsForSubscribe;
        this.checkStartListener();
        return Promise.resolve();
    }

    async stop() {
        if (this.listener) {
            this.listener.removeAllListeners();
            this.listener.stop();
            this.listener = null;
        }
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.arango.collection(collection).indexes();
    }

    /**
     * Returns object with collection names in keys and collection size in values.
     */
    async loadFingerprint(): Promise<unknown> {
        const collections: ArangoCollectionDescr[] = await this.arango.listCollections();
        const collectionNames = collections.map(descr => descr.name);
        // TODO: add this when required a new version arangojs v7.x.x
        // await Promise.all(collections.map(col => this.arango.collection(col).recalculateCount()));
        const results = await Promise.all(collectionNames.map(col => this.arango.collection(col).count()));
        const fingerprint: { [name: string]: number } = {};
        collectionNames.forEach((collectionName, i) => {
            fingerprint[collectionName] = results[i].count;
        });
        return fingerprint;
    }

    async hotUpdate(): Promise<void> {
        return Promise.resolve();
    }

    async query(params: QDataProviderQueryParams): Promise<QDoc[]> {
        const {
            shards,
            text,
            vars,
            traceSpan,
        } = params;

        if (shards !== undefined && !shards.has(this.shard)) {
            return [];
        }
        const impl = async (span: QTraceSpan) => {
            const cursor = await this.arango.query(text, vars);
            span.logEvent("cursor_obtained");
            return await cursor.all();
        };
        return traceSpan.traceChildOperation(`arango.query.${this.shard}`, impl);
    }

    subscribe(collection: string, listener: (doc: QDoc, event: QDataEvent) => void): unknown {
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


    unsubscribe(subscription: unknown) {
        if (this.listenerSubscribers) {
            this.listenerSubscribers.removeListener(
                (subscription as Subscription).collection,
                (subscription as Subscription).listener,
            );
            this.listenerSubscribersCount = Math.max(this.listenerSubscribersCount - 1, 0);
        }
    }

    // Internals

    checkStartListener() {
        return;
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

    createAndStartListener(): ArangoChair {
        const {
            server,
            name,
            auth,
        } = this.config;
        const dbUrl = ensureProtocol(server, "http");
        const listenerUrl = `${dbUrl}/${name}`;

        const listener = new ArangoChair(listenerUrl);
        const parsedDbUrl = url.parse(dbUrl);

        const pathPrefix = parsedDbUrl.path !== "/" ? (parsedDbUrl.path || "") : "";
        listener._loggerStatePath = `${pathPrefix}/_db/${name}/_api/replication/logger-state`;
        listener._loggerFollowPath = `${pathPrefix}/_db/${name}/_api/replication/logger-follow`;

        if (this.config.auth) {
            const userPassword = Buffer.from(auth).toString("base64");
            listener.req.opts.headers["Authorization"] = `Basic ${userPassword}`;
        }

        this.collectionsForSubscribe.forEach((collectionName) => {
            listener.subscribe({ collection: collectionName });
            listener.on(collectionName, (docJson: QDoc, type: QDataEvent) => {
                if (type === "insert/update" || type === "insert" || type === "update") {
                    this.onDataEvent(type, collectionName, docJson);
                }
            });
        });

        listener.on("error", (err: Error, _status: unknown, _headers: unknown, body: string) => {
            let error;
            try {
                error = JSON.parse(body);
            } catch {
                error = err;
            }
            this.log.error("FAILED", "LISTEN", `${err}`, error);
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
