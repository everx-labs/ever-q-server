/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

// @flow

export const QRequestsMode = {
    kafka: 'kafka',
    rest: 'rest,'
};

export type QDbConfig = {
    server: string,
    name: string,
    auth: string,
    maxSockets: number,
};

export type QConfig = {
    server: {
        host: string,
        port: number,
    },
    requests: {
        mode: 'kafka' | 'rest',
        server: string,
        topic: string,
    },
    database: QDbConfig,
    slowDatabase: QDbConfig,
    listener: {
        restartTimeout: number
    },
    authorization: {
        endpoint: string,
    },
    jaeger: {
        endpoint: string,
        service: string,
        tags: { [string]: string }
    },
    statsd: {
        server: string,
    },
    mamAccessKeys: Set<string>,
}

export function ensureProtocol(address: string, defaultProtocol: string): string {
    return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}

function sortedIndex(fields: string[]): string[] {
    return fields;
}

export type CollectionInfo = {
    name: string,
    indexes: string[][],
};

export type DbInfo = {
    name: string,
    collections: {
        [string]: CollectionInfo,
    }
}

export const BLOCKCHAIN_DB: DbInfo = {
    name: 'blockchain',
    collections: {
        blocks: {
            name: 'blocks',
            indexes: [
                sortedIndex(['seq_no', 'gen_utime']),
                sortedIndex(['gen_utime']),
                sortedIndex(['workchain_id', 'shard', 'seq_no']),
                sortedIndex(['workchain_id', 'seq_no']),
                sortedIndex(['workchain_id', 'gen_utime']),
                sortedIndex(['master.min_shard_gen_utime']),
            ],
        },
        accounts: {
            name: 'accounts',
            indexes: [
                sortedIndex(['last_trans_lt']),
                sortedIndex(['balance']),
            ],
        },
        messages: {
            name: 'messages',
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
            name: 'transactions',
            indexes: [
                sortedIndex(['block_id']),
                sortedIndex(['in_msg']),
                sortedIndex(['out_msgs[*]']),
                sortedIndex(['account_addr', 'now']),
                sortedIndex(['now']),
                sortedIndex(['lt']),
                sortedIndex(['account_addr', 'orig_status', 'end_status']),
            ],
        },
        blocks_signatures: {
            name: 'blocks_signatures',
            indexes: [],
        },
    }
};

export const STATS = {
    prefix: 'qserver.',
    doc: {
        count: 'doc.count',
    },
    query: {
        count: 'query.count',
        time: 'query.time',
        active: 'query.active',
    },
    subscription: {
        count: 'subscription.count',
    },
    waitFor: {
        count: 'waitfor.count',
    },
};

for (const [n, c] of (Object.entries(BLOCKCHAIN_DB.collections): Array<any>)) {
    c.name = n;
    c.indexes.push(['_key']);
}
