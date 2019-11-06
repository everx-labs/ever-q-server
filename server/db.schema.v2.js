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

const { string, int, bool, ref, arrayOf, unionOf } = Def;

// Types scheme begin

function uint(size: number, doc?: '') {
    return { _int: { unsigned: size }, ...(doc ? { _doc: doc } : {}) }
}

function i8(doc?: '') {
    return { _int: { signed: 8 }, ...(doc ? { _doc: doc } : {}) }
}

function i32(doc?: '') {
    return { _int: { signed: 32 }, ...(doc ? { _doc: doc } : {}) }
}

const u8 = (doc?: '') => uint(8, doc);
const u16 = (doc?: '') => uint(16, doc);
const u32 = (doc?: '') => uint(32, doc);
const u64 = (doc?: '') => uint(64, doc);
const u128 = (doc?: '') => uint(128, doc);
const join = (refDef: { [string]: TypeDef }, on: string): TypeDef => {
    return { ...ref(refDef), _: { join: { on } } }
};

const Account: TypeDef = {
    _doc: 'TON Account',
    _: { collection: 'accounts' },
    acc_type: u8(),
    addr: string(),
    last_paid: u32(),
    due_payment: u32(),
    last_trans_lt: u32(),
    balance_grams: string(),
    split_depth: u32(),
    tick: bool(),
    tock: bool(),
    code: string(),
    data: string(),
    library: string(),
};

const Message: TypeDef = {
    _doc: 'This is message',
    _: { collection: 'messages' },
    msg_type: u8(),
    transaction_id: string(),
    block_id: string(),
    body: string(),
    status: u8(),
    split_depth: u8(),
    tick: bool(),
    tock: bool(),
    code: string(),
    data: string(),
    library: string(),
    src: string(),
    dst: string(),
    created_lt: u32(),
    created_at: u32(),
    ihr_disabled: bool(),
    ihr_fee: u32(),
    fwd_fee: u32(),
    import_fee: u32(),
    bounce: bool(),
    bounced: bool(),
    value_grams: string(),
};


const Transaction: TypeDef = {
    _doc: 'This is transaction',
    _: { collection: 'transactions' },
    tr_type: u8(),
    status: u8(),
    account_addr: string(),
    lt: u64(),
    last_trans_lt: u64(),
    prev_trans_hash: string(),
    prev_trans_lt: u64(),
    now: u32(),
    outmsg_cnt: u32(),
    orig_status: u8(),
    end_status: u8(),
    in_msg: string(),
    out_msgs: arrayOf(string()),
    total_fees: u64(),
    old_hash: string(),
    new_hash: string(),
    credit_first: bool(),
    storage: {
        storage_fees_collected: u32(),
        storage_fees_due: u32(),
        status_change: u8(),
    },
    credit: {
        due_fees_collected: u32(),
        credit_grams: u64(),
    },
    compute: {
        type: u8(), // 0: skipped, 1: VM
        skipped_reason: u8(),
        success: bool(),
        msg_state_used: bool(),
        account_activated: bool(),
        gas_fees: u64(),
        gas_used: u64(),
        gas_limit: u64(),
        gas_credit: u64(),
        mode: u8(),
        exit_code: u32(),
        exit_arg: u32(),
        vm_steps: u32(),
        vm_init_state_hash: string(),
        vm_final_state_hash: string(),
    },
    action: {
        success: bool(),
        valid: bool(),
        no_funds: bool(),
        status_change: u8(),
        total_fwd_fees: u64(),
        total_action_fees: u64(),
        result_code: u32(),
        result_arg: u32(),
        tot_actions: u32(),
        spec_actions: u32(),
        skipped_actions: u32(),
        msgs_created: u32(),
        action_list_hash: string(),
        total_msg_size_cells: u32(),
        total_msg_size_bits: u32(),
    },
    bounce: {
        type: u8(), // 0: Negfunds, 1: Nofunds, 2: Ok
        msg_size_cells: u32(),
        msg_size_bits: u32(),
        req_fwd_fees: u64(),
        msg_fees: u64(),
        fwd_fees: u64(),
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

const MsgEnvelope: TypeDef = {
    msg: string(),
    next_addr: string(),
    cur_addr: string(),
    fwd_fee_remaining_grams: u128(),
};

const InMsg: TypeDef = {
    msg_type: u8(), // External: 0, IHR: 1, Immediatelly: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6
    msg: string(),
    transaction: string(),
    ihr_fee: i32(),
    proof_created: string(),
    in_msg: ref({ MsgEnvelope }),
    fwd_fee: i32(),
    out_msg: ref({ MsgEnvelope }),
    transit_fee: i32(),
    transaction_id: string(),
    proof_delivered: string()
};

const OutMsg: TypeDef = {
    msg_type: u8(), // None: 0, External: 1, Immediately: 2, OutMsgNew: 3, Transit: 4, Dequeue: 5, TransitRequired: 6
    msg: string(),
    transaction: string(),
    out_msg: ref({ MsgEnvelope }),
    reimport: ref({ InMsg }),
    imported: ref({ InMsg }),
    import_block_lt: u64(),
};

const Block: TypeDef = {
    _doc: 'This is Block',
    _: { collection: 'blocks' },
    status: string(),
    global_id: u32(),
    info: {
        want_split: bool(),
        seq_no: u32(),
        after_merge: bool(),
        gen_utime: i32(),
        gen_catchain_seqno: u32(),
        flags: u16(),
        prev_ref: {
            prev: {
                seq_no: i32(),
                file_hash: string(),
                root_hash: string(),
                end_lt: i32()
            }
        },
        version: u32(),
        gen_validator_list_hash_short: u32(),
        before_split: bool(),
        after_split: bool(),
        want_merge: bool(),
        vert_seq_no: i32(),
        start_lt: u64(),
        end_lt: u64(),
        shard: {
            shard_pfx_bits: u8(),
            workchain_id: i32(),
            shard_prefix: string(),
        },
        min_ref_mc_seqno: u32(),
        master_ref: {
            master: ref({ ExtBlkRef })
        },
        prev_vert_ref: {
            prev: ref({ ExtBlkRef }),
            prev_alt: ref({ ExtBlkRef })
        }
    },
    value_flow: {
        to_next_blk_grams: u128(),
        exported_grams: u128(),
        fees_collected_grams: u128(),
        created_grams: u128(),
        imported_grams: u128(),
        from_prev_blk_grams: u128(),
        minted_grams: u128(),
        fees_imported_grams: u128(),
    },
    extra: {
        in_msg_descr: arrayOf(ref({ InMsg })),
        rand_seed: string(),
        out_msg_descr: arrayOf(ref({ OutMsg })),
        account_blocks: arrayOf({
            account_addr: string(),
            transactions: arrayOf(string()),
            state_update: {
                old_hash: string(),
                new_hash: string()
            },
            tr_count: i32()
        })
    },
    state_update: {
        new: string(),
        new_hash: string(),
        new_depth: i32(),
        old: string(),
        old_hash: string(),
        old_depth: i32()
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
