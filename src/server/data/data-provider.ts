import type { OrderBy } from "../filter/filters";
import {
    hash,
    setHasIntersections,
} from "../utils";
import type { QLog } from "../logs";
import { QRequestContext } from "../request";
import { QTraceSpan } from "../tracing";
import { Database } from "arangojs";
import {
    ensureProtocol,
    QArangoConfig,
} from "../config";

export type QShard = {
    database: Database,
    poolIndex: number,
    config: QArangoConfig,
    shard: string,
};

type QDatabasePoolItem = {
    config: QArangoConfig,
    shards: QShard[],
};

export class QDatabasePool {
    private items: QDatabasePoolItem[] = [];

    static sameConfig(a: QArangoConfig, b: QArangoConfig): boolean {
        return a.server === b.server
            && a.name === b.name;
    }

    ensureShard(config: QArangoConfig, shard: string): QShard {
        const [poolIndex, poolItem] = this.ensurePoolItem(config);
        let qShard = poolItem.shards.find(x => x.shard === shard);
        if (qShard) {
            return qShard;
        }

        const database = (poolItem.shards.length > 0)
            ? poolItem.shards[0].database
            : this.createDatabaseHandle(poolItem.config);
        
        qShard = {
            database,
            config: poolItem.config,
            poolIndex,
            shard,
        };

        poolItem.shards.push(qShard);
        return qShard;
    }

    private ensurePoolItem(config: QArangoConfig): [number, QDatabasePoolItem] {
        let poolIndex = this.items.findIndex(x => QDatabasePool.sameConfig(x.config, config));
        if (poolIndex < 0) {
            poolIndex = this.items.length;
            const poolItem = {
                shards: [],
                config,
            };
            this.items.push(poolItem);
            return [poolIndex, poolItem];
        }

        const poolItem = this.items[poolIndex];
        this.upgradeConfigIfNeeded(poolItem, config);
        return [poolIndex, poolItem];
    }

    private upgradeConfigIfNeeded(poolItem: QDatabasePoolItem, config: QArangoConfig): void {
        if (!QDatabasePool.sameConfig(poolItem.config, config)) {
            throw new Error("Invalid upgradeDatabaseHandlesIfNeeded use");
        }
        if (poolItem.config.maxSockets === config.maxSockets &&
            poolItem.config.listenerRestartTimeout === config.listenerRestartTimeout) {
            return;
        }

        const oldDatabase = poolItem.shards[0].database;
        oldDatabase.close();

        const newConfig = {
            ...config,
            maxSockets: Math.max(config.maxSockets, poolItem.config.maxSockets),
            listenerRestartTimeout: Math.min(config.listenerRestartTimeout, poolItem.config.listenerRestartTimeout),
        };

        const database = this.createDatabaseHandle(newConfig);
        poolItem.config = newConfig;
        for (const shard of poolItem.shards) {
            shard.config = newConfig;
            shard.database = database;
        }
    }

    private createDatabaseHandle(config: QArangoConfig): Database {
        const database = new Database({
            url: `${ensureProtocol(config.server, "http")}`,
            agentOptions: {
                maxSockets: config.maxSockets,
            },
        });
        database.useDatabase(config.name);
        if (config.auth) {
            const authParts = config.auth.split(":");
            database.useBasicAuth(authParts[0], authParts.slice(1).join(":"));
        }
        return database;
    }
}

export type QIndexInfo = {
    fields: string[],
    type?: string,
};


export type QDoc = {
    _key: string;
    [name: string]: unknown;
};


export enum QDataEvent {
    UPSERT = "insert/update",
    INSERT = "insert",
    UPDATE = "update",
}

const FETCHING = "FETCHING";

export type QResult = unknown[] | Record<string, unknown> | number | bigint | string | boolean;
type CacheValue = QResult[] | "FETCHING";

export type QDataProviderQueryParams = {
    text: string,
    vars: Record<string, unknown>,
    orderBy: OrderBy[],
    distinctBy?: string,
    request: QRequestContext,
    shards?: Set<string>,
    traceSpan: QTraceSpan,
    maxRuntimeInS?: number,
};

export interface QDataProvider {
    shards: QShard[];
    shardingDegree: number;

    start(collectionsForSubscribe: string[]): Promise<void>;

    stop(): Promise<void>;

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]>;

    loadFingerprint(): Promise<unknown>;

    hotUpdate(): Promise<void>;

    query(params: QDataProviderQueryParams): Promise<QResult[]>;

    subscribe(collection: string, listener: (doc: unknown, event: QDataEvent) => void): unknown;

    unsubscribe(subscription: unknown): void;
}


export interface QDataCache {
    get(key: string): Promise<unknown>;

    set(key: string, value: unknown, expirationTimeout: number): Promise<void>;
}

export class QDataCombiner implements QDataProvider {
    providers: QDataProvider[];
    providersShards: Set<string>[] = [];
    shards: QShard[] = [];
    shardingDegree: number;

    constructor(providers: QDataProvider[]) {
        this.providers = providers;
        this.shardingDegree = providers.reduce((acc, p) => Math.max(acc, p.shardingDegree), 0);

        for (const provider of providers) {
            const providerShards = new Set<string>(provider.shards.map(x => x.shard));
            this.providersShards.push(this.ensureShardingDegree(providerShards));
            this.shards = this.shards.concat(provider.shards);
        }
        this.shards = [...new Set(this.shards)]; // dedupe
    }

    async start(collectionsForSubscribe: string[]): Promise<void> {
        await Promise.all(this.providers.map((x, i) => x.start(i === 0 ? collectionsForSubscribe : [])));
    }

    async stop(): Promise<void> {
        await Promise.all(this.providers.map(x => x.stop()));
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.providers[0].getCollectionIndexes(collection);
    }

    async loadFingerprint(): Promise<unknown> {
        /** TODO: remove
         * Do not build fingerprint from a `hot` database (index=0).
         * We make fingerprints about the size of collections only on `cold` storages (index>0).
         * The updated fingerprint will change the cache key and the old keys will be removed using by DataCache itself.
         */
        return await Promise.all(this.providers.map(provider => provider.loadFingerprint()));
    }

    async hotUpdate(): Promise<void> {
        await Promise.all(this.providers.map(provider => provider.hotUpdate()));
    }

    async query(params: QDataProviderQueryParams): Promise<QResult[]> {
        const traceSpan = params.traceSpan;
        traceSpan.logEvent("QDataCombiner_query_start");
        const shards = params.shards ? this.ensureShardingDegree(params.shards) : undefined;
        if (this.shardingDegree > 0 && (!shards || shards.size === Math.pow(2, this.shardingDegree))) {
            params.request.requestTags.hasRangedQuery = true;
        }
        const providers = this.getProvidersForShards(shards);
        const results = await Promise.all(providers.map(x => x.query(params)));
        traceSpan.logEvent("QDataCombiner_query_dataIsFetched");
        const result = combineResults(results, params.orderBy, params.distinctBy);
        traceSpan.logEvent("QDataCombiner_query_end");
        return result;
    }

    subscribe(collection: string, listener: (doc: unknown, event: QDataEvent) => void): unknown {
        return this.providers.map(p => p.subscribe(collection, listener));
    }

    unsubscribe(subscription: unknown): void {
        (subscription as unknown[]).map((s, i) => this.providers[i].unsubscribe(s));
    }

    private getProvidersForShards(shards: Set<string> | undefined) {
        if (!shards) {
            return this.providers;
        }

        shards = this.ensureShardingDegree(shards);
        const providers: QDataProvider[] = [];
        for (let i = 0; i < this.providers.length; i += 1) {
            if(setHasIntersections(this.providersShards[i], shards)) {
                providers.push(this.providers[i]);
            }
        }
        return providers;
    }

    private ensureShardingDegree(shards: Set<string>): Set<string> {
        let needToFixShards = false;
        for (const shard of shards) {
            needToFixShards = needToFixShards || shard.length !== this.shardingDegree;
        }

        if (!needToFixShards) {
            return shards;
        }
        
        const fixedShards = new Set<string>();
        for (const shard of shards) {
            const diff = this.shardingDegree - shard.length;
            if (diff > 0) {
                // split shards
                for (const index of Array(diff).keys()) {
                    const append = index.toString(2).padStart(diff, "0");
                    fixedShards.add(`${shard}${append}`);
                }
            } else {
                fixedShards.add(shard.slice(0, this.shardingDegree));
            }
        }
        return fixedShards;
    }
}

export class QDataPrecachedCombiner extends QDataCombiner {
    log: QLog;
    cache: QDataCache;
    networkName: string;
    cacheKeyPrefix: string;
    configHash: string;

    constructor(
        log: QLog,
        cache: QDataCache,
        providers: QDataProvider[],
        networkName: string,
        cacheKeyPrefix: string,
        public dataExpirationTimeout = 0,
        public emptyDataExpirationTimeout = 0,
        public fetchingPollTimeout = 3,
        public fetchingExpirationTimeout = 10,
    ) {
        super(providers);
        this.log = log;
        this.cache = cache;
        this.networkName = networkName;
        this.cacheKeyPrefix = cacheKeyPrefix;
        this.configHash = "";
    }

    async hotUpdate(): Promise<void> {
        const fingerprint = JSON.stringify(await this.loadFingerprint());
        this.log.debug("FINGERPRINT", fingerprint);
        this.configHash = hash(this.networkName, fingerprint);
        await super.hotUpdate();
    }

    cacheKey(aql: string): string {
        return this.cacheKeyPrefix + hash(this.configHash, aql);
    }

    async query(params: QDataProviderQueryParams): Promise<QResult[]> {
        const {
            text,
            vars,
            orderBy,
            traceSpan,
        } = params;
        traceSpan.logEvent("QDataPrecachedCombiner_query_start");
        const aql = JSON.stringify({
            text,
            vars,
            orderBy,
        });
        const key = this.cacheKey(aql);
        let docs: QResult[] | undefined = undefined;
        while (docs === undefined) {
            const value = await traceSpan.traceChildOperation("QDataPrecachedCombiner_cache_get", async (span) => {
                span.setTag("cache_key", key);
                return await this.cache.get(key) as CacheValue | undefined | null;
            });
            if (value === undefined || value === null) {
                await traceSpan.traceChildOperation("QDataPrecachedCombiner_cache_set_fetching", async (span) => {
                    span.setTag("cache_key", key);
                    await this.cache.set(key, FETCHING, this.fetchingExpirationTimeout);
                });
                docs = await super.query(params);
                await traceSpan.traceChildOperation("QDataPrecachedCombiner_cache_set_result", async (span) => {
                    span.setTag("cache_key", key);

                    const expiration = (docs && docs.length > 0)
                        ? this.dataExpirationTimeout
                        : Math.min(this.dataExpirationTimeout, this.emptyDataExpirationTimeout);

                    await this.cache.set(key, docs, expiration);
                });
                traceSpan.setTag("updated_cache", true);
            } else if (value === FETCHING) {
                traceSpan.setTag("waited_for_cache", true);
                traceSpan.logEvent("QDataPrecachedCombiner_query_waiting");
                await new Promise(resolve => setTimeout(resolve, this.fetchingPollTimeout * 1000));
            } else {
                traceSpan.setTag("fetched_from_cache", true);
                docs = value;
            }
        }
        traceSpan.logEvent("QDataPrecachedCombiner_query_end");
        return docs;
    }
}

export function combineResults(
    results: QResult[][],
    orderBy: OrderBy[],
    distinctBy = "_key",
): QResult[] {
    const docs = collectDistinctDocs(results, distinctBy);
    if (orderBy.length > 0) {
        docs.sort((a: QResult, b: QResult) => compareResults(a, b, orderBy));
    }
    return docs;
}


function collectDistinctDocs(source: QResult[][], key: string): QResult[] {
    const distinctDocs: QResult[] = [];
    const distinctKeys = new Set();
    source.forEach((docs) => {
        docs.forEach((doc) => {
            if (typeof doc === "string" ||
                typeof doc === "bigint" ||
                typeof doc === "boolean" ||
                typeof doc === "number" ||
                Array.isArray(doc) || !(key in doc)
            ) {
                distinctDocs.push(doc);
            } else if (!distinctKeys.has(doc[key])) {
                distinctDocs.push(doc);
                distinctKeys.add(doc[key]);
            }
        });
    });
    return distinctDocs;
}


function compareResults(a: QResult, b: QResult, orderBy: OrderBy[]) {
    for (let i = 0; i < orderBy.length; i += 1) {
        const field = orderBy[i];
        const path = field.path.split(".");
        const aValue = getValue(a, path, 0);
        const bValue = getValue(b, path, 0);
        const comparison = compareValues(aValue, bValue);
        if (comparison !== 0) {
            return field.direction === "DESC" ? -comparison : comparison;
        }
    }
    return 0;
}


function getValue(value: unknown, path: string[], pathIndex: number): unknown {
    if (isNullOrUndefined(value) || pathIndex >= path.length) {
        return value;
    }
    const isCollection = pathIndex === 0;
    const name = isCollection && path[pathIndex] === "id" ? "_key" : path[pathIndex];
    return getValue((value as { [name: string]: unknown })[name], path, pathIndex + 1);
}

export type Scalar = number | string | boolean | Date | bigint;

function compareValues(a: unknown, b: unknown): number {
    const aHasValue = !isNullOrUndefined(a);
    const bHasValue = !isNullOrUndefined(b);
    if (!aHasValue) {
        return bHasValue ? -1 : 0;
    }
    if (!bHasValue) {
        return 1;
    }
    return a === b ? 0 : ((a as Scalar) < (b as Scalar) ? -1 : 1);
}


function isNullOrUndefined(v: unknown): boolean {
    return v === null || typeof v === "undefined";
}

export function sortedIndex(fields: string[]): QIndexInfo {
    return {
        type: "persistent",
        fields,
    };
}
