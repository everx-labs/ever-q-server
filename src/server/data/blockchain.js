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

import { Counterparty } from "../graphql/counterparties";
import type { QDataOptions } from './data';
import QData from './data';
import { QDataCollection, QDataScope } from './collection';
import {
    Account,
    Block,
    BlockSignatures,
    Message,
    Transaction,
    Zerostate,
} from '../graphql/resolvers-generated';
import { sortedIndex } from './data-provider';

export const INDEXES = {
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
    zerostates: {
        indexes: [],
    },
    counterparties: {
        indexes: [],
    },
};


Object.values(INDEXES).forEach((collection: any) => {
    collection.indexes = collection.indexes.concat({ fields: ['_key'] });
});


export default class QBlockchainData extends QData {
    transactions: QDataCollection;
    messages: QDataCollection;
    accounts: QDataCollection;
    blocks: QDataCollection;
    blocks_signatures: QDataCollection;
    zerostates: QDataCollection;
    counterparties: QDataCollection;

    constructor(options: QDataOptions) {
        super(options);
        const add = (name, type, mutable) => {
            return this.addCollection(name, type, mutable, INDEXES[name].indexes);
        };
        this.accounts = add('accounts', Account, QDataScope.mutable);
        this.transactions = add('transactions', Transaction, QDataScope.immutable);
        this.messages = add('messages', Message, QDataScope.immutable);
        this.blocks = add('blocks', Block, QDataScope.immutable);
        this.blocks_signatures = add('blocks_signatures', BlockSignatures, QDataScope.immutable);
        this.zerostates = add('zerostates', Zerostate, QDataScope.immutable);
        this.counterparties = add('counterparties', Counterparty, QDataScope.counterparties);
    }
}
