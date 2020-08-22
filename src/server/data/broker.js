// @flow
import type { OrderBy } from '../filter/filters';
import { dataSegment } from './data';
import type { QDataProvider, QDataCache, QDoc, QDataSegment } from './data';

export type QDataQueryParams = {
    segment: QDataSegment;
    text: string;
    vars: { [string]: any };
    orderBy: OrderBy[];
}


export type QDataBrokerOptions = {
    mut: QDataProvider;
    hot: QDataProvider;
    cold: QDataProvider[];
    cache: QDataCache;
}


export class QDataBroker {
    mut: QDataProvider;
    hot: QDataProvider;
    cold: QDataProvider[];
    cache: QDataCache;


    constructor(options: QDataBrokerOptions) {
        this.mut = options.mut;
        this.hot = options.hot;
        this.cold = options.cold;
        this.cache = options.cache;
    }


    start() {
        this.mut.start();
        this.hot.start();
        this.cold.forEach(x => x.start());
    }

    async query(params: QDataQueryParams): Promise<any> {
        if (params.segment === dataSegment.MUTABLE) {
            return this.mut.query(params.text, params.vars);
        }
        return combineResults(await Promise.all([
            this.hot.query(params.text, params.vars),
            this.queryCold(params),
        ]), params.orderBy);
    }


    async queryCold(params: QDataQueryParams): Promise<QDoc[]> {
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
            const results = await Promise.all(this.cold.map(x => x.query(params.text, params.vars)));
            docs = combineResults(results, params.orderBy);
            await this.cache.set(key, docs);
        }
        return docs;
    }
}


function combineResults(results: any[][], orderBy: OrderBy[]): any[] {
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
