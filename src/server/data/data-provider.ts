import type { OrderBy } from "../filter/filters";
import { hash } from "../utils";
import type { QLog } from "../logs";
import { QRequestContext } from "../request";
import QTraceSpan from "../tracing/trace-span";

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
    request: QRequestContext,
    shards?: Set<string>,
    traceSpan: QTraceSpan,
};

export interface QDataProvider {
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

    constructor(providers: QDataProvider[]) {
        this.providers = providers;
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
        params.request.log("QDataCombiner_query_start");
        const results = await Promise.all(this.providers.map(x => x.query(params)));
        params.request.log("QDataCombiner_query_dataIsFetched");
        const result = combineResults(results, params.orderBy);
        params.request.log("QDataCombiner_query_end");
        return result;
    }

    subscribe(collection: string, listener: (doc: unknown, event: QDataEvent) => void): unknown {
        return this.providers.map(p => p.subscribe(collection, listener));
    }

    unsubscribe(subscription: unknown): void {
        (subscription as unknown[]).map((s, i) => this.providers[i].unsubscribe(s));
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
            request,
            text,
            vars,
            orderBy,
            traceSpan,
        } = params;
        request.log("QDataPrecachedCombiner_query_start");
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
                request.log("QDataPrecachedCombiner_query_no_cache");
                await traceSpan.traceChildOperation("QDataPrecachedCombiner_cache_set_fetching", async (span) => {
                    span.setTag("cache_key", key);
                    await this.cache.set(key, FETCHING, this.fetchingExpirationTimeout);
                });
                docs = await super.query(params);
                await traceSpan.traceChildOperation("QDataPrecachedCombiner_cache_set_result", async (span) => {
                    span.setTag("cache_key", key);
                    await this.cache.set(key, docs, (docs && docs.length > 0) ? this.dataExpirationTimeout : Math.min(this.dataExpirationTimeout, 2));
                });
                request.requestSpan.setTag("updated_cache", true);
            } else if (value === FETCHING) {
                request.requestSpan.setTag("waited_for_cache", true);
                request.log("QDataPrecachedCombiner_query_waiting");
                await new Promise(resolve => setTimeout(resolve, this.fetchingPollTimeout * 1000));
            } else {
                request.requestSpan.setTag("fetched_from_cache", true);
                docs = value;
            }
        }
        request.log("QDataPrecachedCombiner_query_end");
        return docs;
    }
}

export function combineResults(results: QResult[][], orderBy: OrderBy[]): QResult[] {
    const docs = collectDistinctDocs(results);
    if (orderBy.length > 0) {
        docs.sort((a: QResult, b: QResult) => compareResults(a, b, orderBy));
    }
    return docs;
}


function collectDistinctDocs(source: QResult[][]): QResult[] {
    const distinctDocs: QResult[] = [];
    const distinctKeys = new Set();
    source.forEach((docs) => {
        docs.forEach((doc) => {
            if (typeof doc === "string" ||
                typeof doc === "bigint" ||
                typeof doc === "boolean" ||
                typeof doc === "number" ||
                Array.isArray(doc) || !("_key" in doc)
            ) {
                distinctDocs.push(doc);
            } else if (!distinctKeys.has(doc._key)) {
                distinctDocs.push(doc);
                distinctKeys.add(doc._key);
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
