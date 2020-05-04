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

import { parseIndex } from "./db-types";

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
        rpcPort: string,
        keepAlive: number,
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
        tags: string[],
    },
    mamAccessKeys: Set<string>,
}

export function ensureProtocol(address: string, defaultProtocol: string): string {
    return /^\w+:\/\//gi.test(address) ? address : `${defaultProtocol}://${address}`;
}

const INDEXES: {
    [string]: string[],
} = {
    blocks: [
        'seq_no, gen_utime',
        'gen_utime',
        'workchain_id, shard, seq_no',
        'workchain_id, seq_no',
        'workchain_id, gen_utime',
        'master.min_shard_gen_utime',
    ],
    accounts: [
        'last_trans_lt',
        'balance',
    ],
    messages: [
        'block_id',
        'value, created_at',
        'src, value, created_at',
        'dst, value, created_at',
        'src, created_at',
        'dst, created_at',
        'src, dst, created_at, _key',
        'created_lt',
        'created_at',
    ],
    transactions: [
        'block_id',
        'in_msg',
        'out_msgs[*]',
        'account_addr, now',
        'now',
        'lt',
        'account_addr, orig_status, end_status',
        'now, account_addr, lt',
    ],
    blocks_signatures: [
        'signatures[*].node_id, gen_utime',
    ],
};

export type IndexInfo = {
    fields: string[],
}

export type CollectionInfo = {
    name: string,
    indexes: IndexInfo[],
};

export type DbInfo = {
    name: string,
    collections: {
        [string]: CollectionInfo,
    }
}

export const BLOCKCHAIN_DB: DbInfo = {
    lastUpdateTime: 0,
    name: 'blockchain',
    collections: {}
};

Object.entries(INDEXES).forEach(([name, indexes]) => {
    BLOCKCHAIN_DB.collections[name] = {
        name,
        indexes: ['_key', ...(indexes: any)].map(parseIndex),
    }
});

export const STATS = {
    prefix: 'qserver.',
    doc: {
        count: 'doc.count',
    },
    post: {
        count: 'post.count',
        failed: 'post.failed',
    },
    query: {
        count: 'query.count',
        time: 'query.time',
        active: 'query.active',
        failed: 'query.failed',
        slow: 'query.slow',
    },
    subscription: {
        active: 'subscription.active',
    },
    waitFor: {
        active: 'waitfor.active',
    },
};

