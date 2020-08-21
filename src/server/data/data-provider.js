// @flow

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


export type QDataSegment = 'immutable' | 'mutable';
export const dataSegment = {
    IMMUTABLE: 'immutable',
    MUTABLE: 'mutable',
};

export type QCollectionInfo = {
    name: string,
    segment: QDataSegment,
    indexes: QIndexInfo[],
};

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

const INDEXES = {
    blocks: {
        indexes: [
            sortedIndex(['seq_no', 'gen_utime']),
            sortedIndex(['gen_utime']),
            sortedIndex(['workchain_id', 'shard', 'seq_no']),
            sortedIndex(['workchain_id', 'shard', 'gen_utime']),
            sortedIndex(['workchain_id', 'seq_no']),
            sortedIndex(['workchain_id', 'gen_utime']),
            sortedIndex(['master.min_shard_gen_utime']),
            sortedIndex(['prev_ref.root_hash', '_key']),
            sortedIndex(['prev_alt_ref.root_hash', '_key']),
        ],
    },
    accounts: {
        indexes: [
            sortedIndex(['last_trans_lt']),
            sortedIndex(['balance']),
        ],
    },
    messages: {
        indexes: [
            sortedIndex(['block_id']),
            sortedIndex(['value', 'created_at']),
            sortedIndex(['src', 'value', 'created_at']),
            sortedIndex(['dst', 'value', 'created_at']),
            sortedIndex(['src', 'created_at']),
            sortedIndex(['dst', 'created_at']),
            sortedIndex(['created_lt']),
            sortedIndex(['created_at']),
        ],
    },
    transactions: {
        indexes: [
            sortedIndex(['block_id']),
            sortedIndex(['in_msg']),
            sortedIndex(['out_msgs[*]']),
            sortedIndex(['account_addr', 'now']),
            sortedIndex(['now']),
            sortedIndex(['lt']),
            sortedIndex(['account_addr', 'orig_status', 'end_status']),
            sortedIndex(['now', 'account_addr', 'lt']),
        ],
    },
    blocks_signatures: {
        indexes: [
            sortedIndex(['signatures[*].node_id', 'gen_utime']),
        ],
    },
};

const col = (name, segment) => ({ name, segment, indexes: INDEXES[name].indexes.concat({ fields: ['_key'] }) });
export const dataCollectionInfo: { [string]: QCollectionInfo } = {
    accounts: col('accounts', dataSegment.MUTABLE),
    messages: col('messages', dataSegment.IMMUTABLE),
    transactions: col('transactions', dataSegment.IMMUTABLE),
    blocks: col('blocks', dataSegment.IMMUTABLE),
    blocks_signatures: col('blocks_signatures', dataSegment.IMMUTABLE),
}


function sortedIndex(fields: string[]): QIndexInfo {
    return {
        type: 'persistent',
        fields,
    };
}
