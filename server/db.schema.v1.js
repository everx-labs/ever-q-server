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

const CurrencyCollection: TypeDef = {
    Grams: u128(),
};

const None: TypeDef = { None: string() };

const IntermediateAddress: TypeDef = unionOf({
    Regular: {
        use_src_bits: u8()
    },
    Simple: {
        workchain_id: i32(),
        addr_pfx: string()
    },
    Ext: {
        workchain_id: i32(),
        addr_pfx: string()
    }
});

const ExtBlkRef: TypeDef = {
    end_lt: u64(),
    seq_no: u32(),
    root_hash: string(),
    file_hash: string()
};

const MsgAddressInt: TypeDef = unionOf({
    AddrNone: ref({ None }),
    AddrStd: {
        anycast: {
            rewrite_pfx: string()
        },
        workchain_id: i8(),
        address: string()
    },
    AddrVar: {
        anycast: {
            rewrite_pfx: string()
        },
        workchain_id: i32(),
        address: string()
    },
});

const MsgAddressExt: TypeDef = unionOf({
    AddrNone: ref({ None }),
    AddrExtern: {
        AddrExtern: string()
    }
});

const TickTock: TypeDef = {
    tick: bool(),
    tock: bool()
};

const StorageUsedShort: TypeDef = {
    cells: i32(),
    bits: i32()
};

const SplitMergeInfo: TypeDef = {
    cur_shard_pfx_len: u8(),
    acc_split_depth: u8(),
    this_addr: string(),
    sibling_addr: string()
};

//Messages scheme begin

const Message: TypeDef = {
    _doc: 'This is message',
    _: { collection: 'messages' },

    transaction_id: string(),
    block_id: string(),
    header: unionOf({
        IntMsgInfo: {
            ihr_disabled: bool(),
            bounce: bool(),
            bounced: bool(),
            src: ref({ MsgAddressInt }),
            dst: ref({ MsgAddressInt }),
            value: ref({ CurrencyCollection }),
            ihr_fee: i32(),
            fwd_fee: i32(),
            created_lt: u64(),
            created_at: i32()
        },
        ExtInMsgInfo: {
            src: ref({ MsgAddressExt }),
            dst: ref({ MsgAddressInt }),
            import_fee: i32()
        },
        ExtOutMsgInfo: {
            src: ref({ MsgAddressInt }),
            dst: ref({ MsgAddressExt }),
            created_lt: u64(),
            created_at: i32()
        }
    }),
    init: {
        split_depth: i32(),
        special: ref({ TickTock }),
        code: string(),
        data: string(),
        library: string(),
    },
    body: string(),
    status: string(),
};


const MsgEnvelope: TypeDef = {
    msg: string(),
    next_addr: ref({ IntermediateAddress }),
    cur_addr: ref({ IntermediateAddress }),
    fwd_fee_remaining: ref({ CurrencyCollection })
};

const InMsg: TypeDef = unionOf({
    External: {
        msg: string(),
        transaction: string()
    },
    IHR: {
        msg: string(),
        transaction: string(),
        ihr_fee: i32(),
        proof_created: string()
    },
    Immediatelly: {
        in_msg: ref({ MsgEnvelope }),
        fwd_fee: i32(),
        transaction: string()
    },
    Final: {
        in_msg: ref({ MsgEnvelope }),
        fwd_fee: i32(),
        transaction: string()
    },
    Transit: {
        in_msg: ref({ MsgEnvelope }),
        out_msg: ref({ MsgEnvelope }),
        transit_fee: i32()
    },
    DiscardedFinal: {
        in_msg: ref({ MsgEnvelope }),
        transaction_id: string(),
        fwd_fee: i32()
    },
    DiscardedTransit: {
        in_msg: ref({ MsgEnvelope }),
        transaction_id: string(),
        fwd_fee: i32(),
        proof_delivered: string()
    }
});

const OutMsg: TypeDef = unionOf({
    None: ref({ None }),
    External: {
        msg: string(),
        transaction: string()
    },
    Immediately: {
        out_msg: ref({ MsgEnvelope }),
        transaction: string(),
        reimport: ref({ InMsg })
    },
    OutMsgNew: {
        out_msg: ref({ MsgEnvelope }),
        transaction: string()
    },
    Transit: {
        out_msg: ref({ MsgEnvelope }),
        imported: ref({ InMsg })
    },
    Dequeue: {
        out_msg: ref({ MsgEnvelope }),
        import_block_lt: u64()
    },
    TransitRequired: {
        out_msg: ref({ MsgEnvelope }),
        imported: ref({ InMsg })
    }
});

//Blocks scheme begin

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
        to_next_blk: ref({ CurrencyCollection }),
        exported: ref({ CurrencyCollection }),
        fees_collected: ref({ CurrencyCollection }),
        created: ref({ CurrencyCollection }),
        imported: ref({ CurrencyCollection }),
        from_prev_blk: ref({ CurrencyCollection }),
        minted: ref({ CurrencyCollection }),
        fees_imported: ref({ CurrencyCollection })
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

//Accounts scheme begin

const Account: TypeDef = {
    _doc: 'TON Account',
    _: { collection: 'accounts' },
    _key: string(),
    storage_stat: {
        last_paid: u32(),
        due_payment: i32()
    },
    storage: {
        last_trans_lt: u64(),
        balance: ref({ CurrencyCollection }),
        state: unionOf({
            AccountUninit: ref({ None }),
            AccountActive: {
                split_depth: i32(),
                special: ref({ TickTock }),
                code: string(),
                data: string(),
                library: string()
            },
            AccountFrozen: ref({ None })
        }),
    },
    addr: ref({ MsgAddressInt })
};

//Transaction scheme begin

const TrStoragePhase: TypeDef = {
    storage_fees_collected: i32(),
    storage_fees_due: i32(),
    status_change: string()
};

const TrCreditPhase: TypeDef = {
    due_fees_collected: i32(),
    credit: ref({ CurrencyCollection })
};

const TrComputePhase: TypeDef = unionOf({
    Skipped: {
        reason: string()
    },
    Vm: {
        success: bool(),
        msg_state_used: bool(),
        account_activated: bool(),
        gas_fees: i32(),
        gas_used: i32(),
        gas_limit: i32(),
        gas_credit: i32(),
        mode: i32(),
        exit_code: i32(),
        exit_arg: i32(),
        vm_steps: u32(),
        vm_init_state_hash: string(),
        vm_final_state_hash: string()
    }
});

const TrActionPhase: TypeDef = {
    success: bool(),
    valid: bool(),
    no_funds: bool(),
    status_change: string(),
    total_fwd_fees: i32(),
    total_action_fees: i32(),
    result_code: i32(),
    result_arg: i32(),
    tot_actions: i32(),
    spec_actions: i32(),
    skipped_actions: i32(),
    msgs_created: i32(),
    action_list_hash: string(),
    tot_msg_size: ref({ StorageUsedShort })
};

const TrBouncePhase: TypeDef = unionOf({
    Negfunds: ref({ None }),
    Nofunds: {
        msg_size: ref({ StorageUsedShort }),
        req_fwd_fees: i32(),
    },
    Ok: {
        msg_size: ref({ StorageUsedShort }),
        msg_fees: i32(),
        fwd_fees: i32(),
    },
});

const Transaction: TypeDef = {
    _doc: 'This is transaction',
    _: { collection: 'transactions' },
    block_id: string(),
    status: string(),
    account_addr: string(),
    lt: u64(),
    prev_trans_hash: string(),
    prev_trans_lt: u64(),
    now: u32(),
    outmsg_cnt: i32(),
    orig_status: string(),
    end_status: string(),
    in_msg: string(),
    in_message: join({ Message }, 'in_msg'),
    out_msgs: arrayOf(string()),
    out_messages: arrayOf(join({ Message }, 'out_msgs')),
    total_fees: i32(),
    state_update: {
        old_hash: string(),
        new_hash: string()
    },
    description: unionOf({
        Ordinary: {
            credit_first: bool(),
            storage_ph: ref({ TrStoragePhase }),
            credit_ph: ref({ TrCreditPhase }),
            compute_ph: ref({ TrComputePhase }),
            action: ref({ TrActionPhase }),
            aborted: bool(),
            bounce: ref({ TrBouncePhase }),
            destroyed: bool()
        },
        Storage: ref({ TrStoragePhase }),
        TickTock: {
            tt: string(),
            storage: ref({ TrStoragePhase }),
            compute_ph: ref({ TrComputePhase }),
            action: ref({ TrActionPhase }),
            aborted: bool(),
            destroyed: bool()
        },
        SplitPrepare: {
            split_info: ref({ SplitMergeInfo }),
            compute_ph: ref({ TrComputePhase }),
            action: ref({ TrActionPhase }),
            aborted: bool(),
            destroyed: bool()
        },
        SplitInstall: {
            split_info: ref({ SplitMergeInfo }),
            prepare_transaction: string(),
            installed: bool()
        },
        MergePrepare: {
            split_info: ref({ SplitMergeInfo }),
            storage_ph: ref({ TrStoragePhase }),
            aborted: bool(),
        },
        MergeInstall: {
            split_info: ref({ SplitMergeInfo }),
            prepare_transaction: string(),
            credit_ph: ref({ TrCreditPhase }),
            compute_ph: ref({ TrComputePhase }),
            action: ref({ TrActionPhase }),
            aborted: bool(),
            destroyed: bool()
        }
    }),
    root_cell: string()
};


//Root scheme declaration

const schema: TypeDef = {
    _class: {
        types: {
            None,
            CurrencyCollection,
            IntermediateAddress,
            ExtBlkRef,
            MsgAddressInt,
            TickTock,
            StorageUsedShort,
            SplitMergeInfo,
            MsgAddressExt,
            Message,
            MsgEnvelope,
            InMsg,
            OutMsg,
            Block,
            Account,
            Transaction,
            TrStoragePhase,
            TrCreditPhase,
            TrComputePhase,
            TrActionPhase,
            TrBouncePhase,
        }
    }
};

export default schema;
