/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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

//@flow

import type { TypeDef } from 'ton-labs-dev-ops/src/schema';
import { Def } from 'ton-labs-dev-ops/dist/src/schema';

const { string, bool, ref, arrayOf } = Def;
const withDoc = (def: TypeDef, doc?: string) => ({
    ...def,
    ...(doc ? { _doc: doc } : {})
});
const required = (def: TypeDef) => def;
type IntSize = 8 | 16 | 32 | 64;
const uint = (size: IntSize, doc?: string) => withDoc({ _int: { unsigned: true, size } }, doc);
const int = (size: IntSize, doc?: string) => withDoc({ _int: { unsigned: false, size } }, doc);

const i8 = (doc?: string) => int(8, doc);
const u8 = (doc?: string) => uint(8, doc);
const u16 = (doc?: string) => uint(16, doc);
const u32 = (doc?: string) => uint(32, doc);
const i32 = (doc?: string) => int(32, doc);
const u64 = (doc?: string) => uint(64, doc);
const u128 = (doc?: string) => uint((128: any), doc);
const join = (refDef: { [string]: TypeDef }, on: string): TypeDef => {
    return { ...ref(refDef), _: { join: { on } } }
};
const grams = u128;

function u8enum(values: { [string]: number }, doc?: string) {
    const valuesDoc = Object.entries(values).map(([name, value]) => {
        return `${(value: any)} – ${name}`;
    }).join('\n');
    return uint(8, `${doc ? `${doc}\n` : ''}${valuesDoc}`);
}

const otherCurrencyCollection = (doc?: string): TypeDef => arrayOf({
    currency: i32(),
    value: grams(),
}, doc);

const accountStatus = (doc?: string): TypeDef => u8enum({
    uninit: 0,
    active: 1,
    frozen: 2,
    nonExist: 3,
}, doc);

const accountStatusChange = (doc?: string): TypeDef => u8enum({
    unchanged: 0,
    frozen: 1,
    deleted: 2,
}, doc);

const skipReason = (doc?: string): TypeDef => u8enum({
    noState: 0,
    badState: 1,
    noGas: 2,
}, doc);


const accountType = (doc?: string): TypeDef => u8enum({
    uninit: 0,
    active: 1,
    frozen: 2,
}, doc);

const messageType = (doc?: string): TypeDef => u8enum({
    internal: 0,
    extIn: 2,
    extOut: 3,
}, doc);


const messageProcessingStatus = (doc?: string): TypeDef => u8enum({
    unknown: 0,
    queued: 1,
    processing: 2,
    preliminary: 3,
    proposed: 4,
    finalized: 5,
    refused: 6,
    transiting: 7,
}, doc);

const transactionType = (doc?: string): TypeDef => u8enum({
    ordinary: 0,
    storage: 1,
    tick: 2,
    tock: 3,
    splitPrepare: 4,
    splitInstall: 5,
    mergePrepare: 6,
    mergeInstall: 7,
}, doc);

const transactionProcessingStatus = (doc?: string): TypeDef => u8enum({
    unknown: 0,
    preliminary: 1,
    proposed: 2,
    finalized: 3,
    refused: 4,
}, doc);

const computeType = (doc?: string): TypeDef => u8enum({
    skipped: 0,
    vm: 1,
}, doc);

const bounceType = (doc?: string): TypeDef => u8enum({
    negFunds: 0,
    noFunds: 1,
    ok: 2,
}, doc);

const blockProcessingStatus = (doc?: string): TypeDef => u8enum({
    unknown: 0,
    proposed: 1,
    finalized: 2,
    refused: 3,
}, doc);


const inMsgType = (doc?: string): TypeDef => u8enum({
    external: 0,
    ihr: 1,
    immediately: 2,
    final: 3,
    transit: 4,
    discardedFinal: 5,
    discardedTransit: 6,
}, doc);

const outMsgType = (doc?: string): TypeDef => u8enum({
    external: 0,
    immediately: 1,
    outMsgNew: 2,
    transit: 3,
    dequeueImmediately: 4,
    dequeue: 5,
    transitRequired: 6,
    none: -1,
}, doc);


const Account: TypeDef = {
    _doc: 'TON Account',
    _: { collection: 'accounts' },
    acc_type: accountType(),
    last_paid: u32(),
    due_payment: grams(),
    last_trans_lt: u64(),
    balance: grams(),
    balance_other: otherCurrencyCollection(),
    split_depth: u8(),
    tick: bool(),
    tock: bool(),
    code: string(),
    data: string(),
    library: string(),
};

const Message: TypeDef = {
    _doc: 'TON Message',
    _: { collection: 'messages' },
    msg_type: required(messageType()),
    status: required(messageProcessingStatus()),
    transaction_id: required(string()),
    block_id: required(string()),
    body: string(),
    split_depth: u8(),
    tick: bool(),
    tock: bool(),
    code: string(),
    data: string(),
    library: string(),
    src: string(),
    dst: string(),
    created_lt: u64(),
    created_at: u32(),
    ihr_disabled: bool(),
    ihr_fee: grams(),
    fwd_fee: grams(),
    import_fee: grams(),
    bounce: bool(),
    bounced: bool(),
    value: grams(),
    value_other: otherCurrencyCollection(),
};


const Transaction: TypeDef = {
    _doc: 'TON Transaction',
    _: { collection: 'transactions' },
    tr_type: required(transactionType()),
    status: required(transactionProcessingStatus()),
    block_id: string(),
    account_addr: string(),
    lt: u64(),
    prev_trans_hash: string(),
    prev_trans_lt: u64(),
    now: u32(),
    outmsg_cnt: i32(),
    orig_status: accountStatus(),
    end_status: accountStatus(),
    in_msg: string(),
    out_msgs: arrayOf(string()),
    total_fees: grams(),
    total_fees_other: otherCurrencyCollection(),
    old_hash: string(),
    new_hash: string(),
    credit_first: bool(),
    storage: {
        storage_fees_collected: grams(),
        storage_fees_due: grams(),
        status_change: accountStatusChange(),
    },
    credit: {
        due_fees_collected: grams(),
        credit: grams(),
        credit_other: otherCurrencyCollection(),
    },
    compute: {
        compute_type: required(computeType()),
        skipped_reason: skipReason(),
        success: bool(),
        msg_state_used: bool(),
        account_activated: bool(),
        gas_fees: grams(),
        gas_used: u64(),
        gas_limit: u64(),
        gas_credit: i32(),
        mode: i8(),
        exit_code: i32(),
        exit_arg: i32(),
        vm_steps: u32(),
        vm_init_state_hash: string(),
        vm_final_state_hash: string(),
    },
    action: {
        success: bool(),
        valid: bool(),
        no_funds: bool(),
        status_change: accountStatusChange(),
        total_fwd_fees: grams(),
        total_action_fees: grams(),
        result_code: i32(),
        result_arg: i32(),
        tot_actions: i32(),
        spec_actions: i32(),
        skipped_actions: i32(),
        msgs_created: i32(),
        action_list_hash: string(),
        total_msg_size_cells: u32(),
        total_msg_size_bits: u32(),
    },
    bounce: {
        bounce_type: required(bounceType()),
        msg_size_cells: u32(),
        msg_size_bits: u32(),
        req_fwd_fees: grams(),
        msg_fees: grams(),
        fwd_fees: grams(),
    },
    aborted: bool(),
    destroyed: bool(),
    tt: string(),
    split_info: {
        cur_shard_pfx_len: u8(),
        acc_split_depth: u8(),
        this_addr: string(),
        sibling_addr: string(),
    },
    prepare_transaction: string(),
    installed: bool(),
};

// BLOCK

const ExtBlkRef: TypeDef = {
    end_lt: u64(),
    seq_no: u32(),
    root_hash: string(),
    file_hash: string()
};

const extBlkRef = () => ref({ ExtBlkRef });

const MsgEnvelope: TypeDef = {
    msg: string(),
    next_addr: string(),
    cur_addr: string(),
    fwd_fee_remaining: grams(),
};

const msgEnvelope = () => ref({ MsgEnvelope });

const InMsg: TypeDef = {
    msg_type: required(inMsgType()),
    msg: string(),
    transaction: string(),
    ihr_fee: grams(),
    proof_created: string(),
    in_msg: msgEnvelope(),
    fwd_fee: grams(),
    out_msg: msgEnvelope(),
    transit_fee: grams(),
    transaction_id: u64(),
    proof_delivered: string()
};

const inMsg = () => ref({ InMsg });

const OutMsg: TypeDef = {
    msg_type: required(outMsgType()),
    msg: string(),
    transaction: string(),
    out_msg: msgEnvelope(),
    reimport: inMsg(),
    imported: inMsg(),
    import_block_lt: u64(),
};

const outMsg = () => ref({ OutMsg });

const Block: TypeDef = {
    _doc: 'This is Block',
    _: { collection: 'blocks' },
    status: blockProcessingStatus(),
    global_id: u32(),
    want_split: bool(),
    seq_no: u32(),
    after_merge: bool(),
    gen_utime: i32(),
    gen_catchain_seqno: u32(),
    flags: u16(),
    master_ref: extBlkRef(),
    prev_ref: extBlkRef(),
    prev_alt_ref: extBlkRef(),
    prev_vert_ref: extBlkRef(),
    prev_vert_alt_ref: extBlkRef(),
    version: u32(),
    gen_validator_list_hash_short: u32(),
    before_split: bool(),
    after_split: bool(),
    want_merge: bool(),
    vert_seq_no: u32(),
    start_lt: u64(),
    end_lt: u64(),
    shard: {
        shard_pfx_bits: u8(),
        workchain_id: i32(),
        shard_prefix: u64(),
    },
    min_ref_mc_seqno: u32(),
    value_flow: {
        to_next_blk: grams(),
        to_next_blk_other: otherCurrencyCollection(),
        exported: grams(),
        exported_other: otherCurrencyCollection(),
        fees_collected: grams(),
        fees_collected_other: otherCurrencyCollection(),
        created: grams(),
        created_other: otherCurrencyCollection(),
        imported: grams(),
        imported_other: otherCurrencyCollection(),
        from_prev_blk: grams(),
        from_prev_blk_other: otherCurrencyCollection(),
        minted: grams(),
        minted_other: otherCurrencyCollection(),
        fees_imported: grams(),
        fees_imported_other: otherCurrencyCollection(),
    },
    in_msg_descr: arrayOf(inMsg()),
    rand_seed: string(),
    out_msg_descr: arrayOf(outMsg()),
    account_blocks: arrayOf({
        account_addr: string(),
        transactions: arrayOf(string()),
        state_update: {
            old_hash: string(),
            new_hash: string()
        },
        tr_count: i32()
    }),
    state_update: {
        new: string(),
        new_hash: string(),
        new_depth: u16(),
        old: string(),
        old_hash: string(),
        old_depth: u16()
    }
};


//Root scheme declaration

const schema: TypeDef = {
    _class: {
        types: {
            ExtBlkRef,
            MsgEnvelope,
            InMsg,
            OutMsg,
            Message,
            Block,
            Account,
            Transaction,
        }
    }
};

export default schema;
