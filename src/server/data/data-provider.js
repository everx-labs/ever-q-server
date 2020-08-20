// @flow

export type QIndexInfo = {
    fields: string[],
    type?: string,
}


export type QDoc = {
    _key: string;
    [string]: any;
};


export type QDataEvent = 'insert' | 'update';
export const dataEvent = {
    INSERT: 'insert',
    UPDATE: 'update',
};


export type QDataSegment = 'immutable' | 'mutable';
export const dataSegment = {
    IMMUTABLE: 'immutable',
    MUTABLE: 'mutable',
};

type QCollectionInfo = {
    name: string,
    segment: QDataSegment,
};
export const dataCollectionInfo: { [string]: QCollectionInfo } = {
    messages: {
        name: 'messages',
        segment: dataSegment.IMMUTABLE,
    },
    transactions: {
        name: 'transactions',
        segment: dataSegment.IMMUTABLE,
    },
    blocks: {
        name: 'blocks',
        segment: dataSegment.IMMUTABLE,
    },
    blocks_signatures: {
        name: 'blocks_signatures',
        segment: dataSegment.IMMUTABLE,
    },
    accounts: {
        name: 'accounts',
        segment: dataSegment.MUTABLE,
    },
}

export interface QDataProvider {
    start(): void;

    getCollectionIndexes(collection: string): Promise<QIndexInfo[]>;

    query(text: string, vars: { [string]: any }): Promise<any>;

    subscribe(collection: string, listener: (doc: any, event: QDataEvent) => void): any;

    unsubscribe(subscription: any): void;
}


export interface QDataCache {
    get(key: string): Promise<any>;

    set(key: string, value: any): Promise<void>;
}


export const missingDataCache: QDataCache = {
    get(_key: string): Promise<any> {
        return Promise.resolve(null);
    },

    set(_key: string, _value: any): Promise<void> {
        return Promise.resolve();
    },
}


