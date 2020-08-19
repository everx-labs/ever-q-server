import { Database } from 'arangojs';
import type { QDataConfig } from './config';
import type { OrderBy } from './db-types';

class DataCache {
    async get(key: string): Promise<any> {
        return null;
    }

    async set(key: string, value: any): Promise<void> {
    }
}

class InMemoryCache extends DataCache {
    items: Map<string, any>;

    constructor() {
        super();
        this.items = new Map();
    }

    async get(key: string): Promise<any> {
        return this.items.get(key);
    }

    async set(key: string, value: any): Promise<void> {
        this.items.set(key, value);
    }
}

export type DataQueryParams = {
    text: string;
    vars: { [string]: any };
    orderBy: OrderBy[];
}

type Doc = {
    _key: string;
    [string]: any;
};

export class QDataBroker {
    cold: Database[];
    hot: Database;
    cache: DataCache;

    constructor(config: QDataConfig) {

    }

    async query(params: DataQueryParams): Promise<any> {
        const queryDb = (db: Database): Promise<Doc> => {
            return db.query(params.text, params.vars);
        }

        const queryHot = async () => {
            return queryDb(this.hot);
        }

        const queryCold = async (): Promise<Doc[]> => {
            if (this.cold.length === 0) {
                return [];
            }
            const key = JSON.stringify({
                text: params.text,
                vars: params.vars,
                orderBy: params.orderBy,
            });
            let docs = await this.cache.get(key);
            if (isNullOrUndefined(docs)) {
                const results = await Promise.all(this.cold.map(queryDb));
                docs = combineResults(results);
                await this.cache.set(key, docs);
            }
            return docs;
        }

        const results = await Promise.all([queryHot(), queryCold()]);
        return combineResults(results);
    }

}


function combineResults(results: any[][], orderBy: OrderBy[]): any[] {
    const docs = collectDistinctDocs(results);
    docs.sort((a: Doc, b: Doc) => compareDocs(a, b, orderBy));
    return docs;
}


function collectDistinctDocs(source: Doc[][]): Doc[] {
    const distinctDocs = ([]: Doc[]);
    const distinctKeys = new Set();
    source.forEach((docs) => {
        docs.forEach((doc) => {
            if (!distinctKeys.has(doc._key)) {
                distinctDocs.push(doc);
                distinctKeys.add(doc._key);
            }
        });
    });
    return distinctDocs;
}


function compareDocs(a: Doc, b: Doc, orderBy: OrderBy[]) {
    for (let i = 0; i < orderBy.length; i += 1) {
        const field = orderBy[i];
        const path = field.path.split('.');
        const aValue = getValue(a, path, 0);
        const bValue = getValue(a, path, 0);
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
    return getValue(value[path[pathIndex]], path, pathIndex + 1);
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
    return a === b ? 0 : (a < b ? -1 : 0);
}


function isNullOrUndefined(v: any) {
    return v === null || typeof v === 'undefined';
}
