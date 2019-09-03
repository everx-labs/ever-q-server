//@flow

import type { TypeDef } from 'ton-labs-dev-ops/src/schema';
import { Def } from 'ton-labs-dev-ops/dist/src/schema';

const { string, int, bool, float, ref, arrayOf, unionOf } = Def;

// Types scheme begin

function uint(size: number, doc?: '') {
    return { _int: { unsigned: true, size }, ...(doc ? { _doc: doc } : {}) }
}

const u8 = (doc?: '') => uint(8, doc);
const u16 = (doc?: '') => uint(16, doc);
const u32 = (doc?: '') => uint(32, doc);
const u64 = (doc?: '') => uint(64, doc);
const join = (refDef: { [string]: TypeDef }, on: string): TypeDef => {
    return { ...ref(refDef), _: { join: { on }}}
};

const CurrencyCollection: TypeDef = {
    Grams: float(),
};

const None: TypeDef = { dummy: string() };

const IntermediateAddress: TypeDef = unionOf({
    Regular: {
        use_src_bits: u8()
    },
    Simple: {
        workchain_id: int(),
        addr_pfx: string()
    },
    Ext: {
        workchain_id: int(),
        addr_pfx: string()
    }
});

const ExtBlkRef: TypeDef = {
    end_lt: u64(),
    seq_no: u32(),
    root_hash: string(),
    file_hash: string()
};

const GenericId: TypeDef = {
    ready: bool(),
    data: string()
};

const MsgAddressInt: TypeDef = unionOf({
    AddrNone: ref({ None }),
    AddrStd: {
        anycast: {
            rewrite_pfx: string()
        },
        workchain_id: u8(),
        address: string()
    },
    AddrVar: {
        anycast: {
            rewrite_pfx: string()
        },
        workchain_id: int(),
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
    cells: int(),
    bits: int()
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

    _key: string(),
    id: ref({ GenericId }),
    transaction_id: ref({ GenericId }),
    block_id: ref({ GenericId }),
    header: unionOf({
        IntMsgInfo: {
            ihr_disabled: bool(),
            bounce: bool(),
            bounced: bool(),
            src: ref({ MsgAddressInt }),
            dst: ref({ MsgAddressInt }),
            value: ref({ CurrencyCollection }),
            ihr_fee: int(),
            fwd_fee: int(),
            created_lt: u64(),
            created_at: int()
        },
        ExtInMsgInfo: {
            src: ref({ MsgAddressExt }),
            dst: ref({ MsgAddressInt }),
            import_fee: int()
        },
        ExtOutMsgInfo: {
            src: ref({ MsgAddressInt }),
            dst: ref({ MsgAddressExt }),
            created_lt: u64(),
            created_at: int()
        }
    }),
    init: {
        split_depth: int(),
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
        ihr_fee: int(),
        proof_created: string()
    },
    Immediatelly: {
        in_msg: ref({ MsgEnvelope }),
        fwd_fee: int(),
        transaction: string()
    },
    Final: {
        in_msg: ref({ MsgEnvelope }),
        fwd_fee: int(),
        transaction: string()
    },
    Transit: {
        in_msg: ref({ MsgEnvelope }),
        out_msg: ref({ MsgEnvelope }),
        transit_fee: int()
    },
    DiscardedFinal: {
        in_msg: ref({ MsgEnvelope }),
        transaction_id: u64(),
        fwd_fee: int()
    },
    DiscardedTransit: {
        in_msg: ref({ MsgEnvelope }),
        transaction_id: u64(),
        fwd_fee: int(),
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
    _key: string(),
    id: ref({ GenericId }),
    status: string(),
    global_id: u32(),
    info: {
        want_split: bool(),
        seq_no: u32(),
        after_merge: bool(),
        gen_utime: int(),
        gen_catchain_seqno: u32(),
        flags: u16(),
        prev_ref: {
            prev: {
                seq_no: int(),
                file_hash: string(),
                root_hash: string(),
                end_lt: int()
            }
        },
        version: u32(),
        gen_validator_list_hash_short: u32(),
        before_split: bool(),
        after_split: bool(),
        want_merge: bool(),
        vert_seq_no: int(),
        start_lt: u64(),
        end_lt: u64(),
        shard: {
            shard_pfx_bits: u8(),
            workchain_id: int(),
            shard_prefix: u64(),
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
            tr_count: int()
        })
    },
    state_update: {
        new: string(),
        new_hash: string(),
        new_depth: int(),
        old: string(),
        old_hash: string(),
        old_depth: int()
    }
};

//Accounts scheme begin

const Account: TypeDef = {
    _doc: 'TON Account',
    _: { collection: 'accounts' },
    _key: string(),
    storage_stat: {
        last_paid: u32(),
        due_payment: int()
    },
    storage: {
        last_trans_lt: u32(),
        balance: ref({ CurrencyCollection }),
        state: unionOf({
            AccountUninit: ref({ None }),
            AccountActive: {
                split_depth: int(),
                special: ref({ TickTock }),
                code: string(),
                data: string(),
                library: string()
            },
            AccountFrozen: {
                dummy: string()
            }
        }),
    },
    addr: ref({ MsgAddressInt })
};

//Transaction scheme begin

const TrStoragePhase: TypeDef = {
    storage_fees_collected: int(),
    storage_fees_due: int(),
    status_change: string()
};

const TrCreditPhase: TypeDef = {
    due_fees_collected: int(),
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
        gas_fees: int(),
        gas_used: int(),
        gas_limit: int(),
        gas_credit: int(),
        mode: int(),
        exit_code: int(),
        exit_arg: int(),
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
    total_fwd_fees: int(),
    total_action_fees: int(),
    result_code: int(),
    result_arg: int(),
    tot_actions: int(),
    spec_actions: int(),
    skipped_actions: int(),
    msgs_created: int(),
    action_list_hash: string(),
    tot_msg_size: ref({ StorageUsedShort })
};

const TrBouncePhase: TypeDef = unionOf({
    Negfunds: ref({ None }),
    Nofunds: {
        msg_size: ref({ StorageUsedShort }),
        req_fwd_fees: int(),
    },
    Ok: {
        msg_size: ref({ StorageUsedShort }),
        msg_fees: int(),
        fwd_fees: int(),
    },
});

const Transaction: TypeDef = {
    _doc: 'This is transaction',
    _: { collection: 'transactions' },
    _key: string(),
    id: ref({ GenericId }),
    block_id: ref({ GenericId }),
    status: string(),
    account_addr: string(),
    last_trans_lt: u64(),
    prev_trans_hash: string(),
    prev_trans_lt: u64(),
    now: u32(),
    outmsg_cnt: int(),
    orig_status: string(),
    end_status: string(),
    in_msg: string(),
    in_message: join({Message}, 'in_msg'),
    out_msgs: arrayOf(string()),
    out_messages: arrayOf(join({Message}, 'out_msgs')),
    total_fees: int(),
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
            GenericId,
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
