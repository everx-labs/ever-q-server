// @flow

import type { OrderBy } from '../filter/filters';
import { hash } from '../utils';
import type { QLog } from '../logs';

export type QIndexInfo = {
    fields: string[],
    type?: string,
}


export type QDoc = {
    _key: string;
    [string]: any;
};


export type QDataEvent = 'insert/update' | 'insert' | 'update';
export const dataEvent = {
    UPSERT: 'insert/update',
    INSERT: 'insert',
    UPDATE: 'update',
};


export interface QDataProvider {
    start(collectionsForSubscribe: string[]): Promise<any>;

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]>;

    loadFingerprint(): Promise<any>;

    hotUpdate(): Promise<any>;

    query(text: string, vars: { [string]: any }, orderBy: OrderBy[]): Promise<any>;

    subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any;

    unsubscribe(subscription: any): void;
}


export interface QDataCache {
    get(key: string): Promise<any>;

    set(key: string, value: any): Promise<void>;
}

export class QDataCombiner implements QDataProvider {
    providers: QDataProvider[];

    constructor(providers: QDataProvider[]) {
        this.providers = providers;
    }

    async start(collectionsForSubscribe: string[]): Promise<any> {
        await Promise.all(this.providers.map((x, i) => x.start(i === 0 ? collectionsForSubscribe : [])));
    }

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]> {
        return this.providers[0].getCollectionIndexes(collection);
    }

    async loadFingerprint(): Promise<any> {
        /** TODO: remove
         * Do not build fingerprint from a `hot` database (index=0).
         * We make fingerprints about the size of collections only on `cold` storages (index>0).
         * The updated fingerprint will change the cache key and the old keys will be removed using by DataCache itself.
         */
        return await Promise.all(this.providers.map(provider => provider.loadFingerprint()));
    }

    async hotUpdate(): Promise<any> {
        await Promise.all(this.providers.map(provider => provider.hotUpdate()));
    }

    async query(text: string, vars: { [string]: any }, orderBy: OrderBy[]): Promise<any> {
        const results = await Promise.all(this.providers.map(x => x.query(text, vars, orderBy)));
        return combineResults(results, orderBy);
    }

    subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any {
        return this.providers[0].subscribe(collection, listener);
    }

    unsubscribe(subscription: any): void {
        this.providers[0].unsubscribe(subscription);
    }
}

export class QDataPrecachedCombiner extends QDataCombiner {
    log: QLog;
    cache: QDataCache;
    networkName: string;
    cacheKeyPrefix: string;
    configHash: string;

    constructor(log: QLog, cache: QDataCache, providers: QDataProvider[], networkName: string, cacheKeyPrefix: string) {
        super(providers);
        this.log = log;
        this.cache = cache;
        this.networkName = networkName;
        this.cacheKeyPrefix = cacheKeyPrefix;
        this.configHash = '';
    }

    async hotUpdate(): Promise<any> {
        const fingerprint = JSON.stringify(await this.loadFingerprint());
        this.log.debug('FINGERPRINT', fingerprint);
        this.configHash = hash(this.networkName, fingerprint);
        await super.hotUpdate();
    }

    cacheKey(aql: string): string {
        return this.cacheKeyPrefix + hash(this.configHash, aql);
    }

    async query(text: string, vars: { [string]: any }, orderBy: OrderBy[]): Promise<any> {
        const aql = JSON.stringify({ text, vars, orderBy });
        const key = this.cacheKey(aql);
        let docs = await this.cache.get(key);
        if (isNullOrUndefined(docs)) {
            docs = await super.query(text, vars, orderBy);
            await this.cache.set(key, docs);
        }
        return docs;
    }
}

export function combineResults(results: any[][], orderBy: OrderBy[]): any[] {
    const docs = collectDistinctDocs(results);
    if (orderBy.length > 0) {
        docs.sort((a: QDoc, b: QDoc) => compareDocs(a, b, orderBy));
    }
    return docs;
}


function collectDistinctDocs(source: QDoc[][]): QDoc[] {
    const distinctDocs = ([]: QDoc[]);
    const distinctKeys = new Set();
    source.forEach((docs) => {
        docs.forEach((doc) => {
            if (!doc._key) {
                distinctDocs.push(doc);
            } else if (!distinctKeys.has(doc._key)) {
                distinctDocs.push(doc);
                distinctKeys.add(doc._key);
            }
        });
    });
    return distinctDocs;
}


function compareDocs(a: QDoc, b: QDoc, orderBy: OrderBy[]) {
    for (let i = 0; i < orderBy.length; i += 1) {
        const field = orderBy[i];
        const path = field.path.split('.');
        const aValue = getValue(a, path, 0);
        const bValue = getValue(b, path, 0);
        let comparison = compareValues(aValue, bValue);
        if (comparison !== 0) {
            return field.direction === 'DESC' ? -comparison : comparison;
        }
    }
    return 0;
}


function getValue(value: any, path: string[], pathIndex: number): any {
    if (isNullOrUndefined(value) || pathIndex >= path.length) {
        return value;
    }
    const isCollection = pathIndex === 0;
    const name = isCollection && path[pathIndex] === 'id' ? '_key' : path[pathIndex];
    return getValue(value[name], path, pathIndex + 1);
}


function compareValues(a: any, b: any): number {
    const aHasValue = !isNullOrUndefined(a);
    const bHasValue = !isNullOrUndefined(b);
    if (!aHasValue) {
        return bHasValue ? -1 : 0;
    }
    if (!bHasValue) {
        return 1;
    }
    return a === b ? 0 : (a < b ? -1 : 1);
}


function isNullOrUndefined(v: any): boolean {
    return v === null || typeof v === 'undefined';
}

export function sortedIndex(fields: string[]): QIndexInfo {
    return { type: 'persistent', fields };
}

export const missingDataCache: QDataCache = {
    get(_key: string): Promise<any> {
        return Promise.resolve(null);
    },

    set(_key: string, _value: any): Promise<void> {
        return Promise.resolve();
    },
}
