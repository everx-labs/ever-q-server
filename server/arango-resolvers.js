const { scalar, struct, array } = require('./arango.js');
const None = struct({
    dummy: scalar,
});

const CurrencyCollection = struct({
    Grams: scalar,
});

const IntermediateAddressRegular = struct({
    use_src_bits: scalar,
});

const IntermediateAddressSimple = struct({
    workchain_id: scalar,
    addr_pfx: scalar,
});

const IntermediateAddressExt = struct({
    workchain_id: scalar,
    addr_pfx: scalar,
});

const IntermediateAddress = struct({
    Regular: IntermediateAddressRegular,
    Simple: IntermediateAddressSimple,
    Ext: IntermediateAddressExt,
});

const IntermediateAddressResolver = {
    __resolveType(obj, context, info) {
        if (obj.Regular) {
            return 'IntermediateAddressRegularVariant';
        }
        if (obj.Simple) {
            return 'IntermediateAddressSimpleVariant';
        }
        if (obj.Ext) {
            return 'IntermediateAddressExtVariant';
        }
        return null;
    }
};

const ExtBlkRef = struct({
    end_lt: scalar,
    seq_no: scalar,
    root_hash: scalar,
    file_hash: scalar,
});

const GenericId = struct({
    ready: scalar,
    data: scalar,
});

const MsgAddressIntAddrStdAnycast = struct({
    rewrite_pfx: scalar,
});

const MsgAddressIntAddrStd = struct({
    anycast: MsgAddressIntAddrStdAnycast,
    workchain_id: scalar,
    address: scalar,
});

const MsgAddressIntAddrVarAnycast = struct({
    rewrite_pfx: scalar,
});

const MsgAddressIntAddrVar = struct({
    anycast: MsgAddressIntAddrVarAnycast,
    workchain_id: scalar,
    address: scalar,
});

const MsgAddressInt = struct({
    AddrNone: None,
    AddrStd: MsgAddressIntAddrStd,
    AddrVar: MsgAddressIntAddrVar,
});

const MsgAddressIntResolver = {
    __resolveType(obj, context, info) {
        if (obj.AddrNone) {
            return 'MsgAddressIntAddrNoneVariant';
        }
        if (obj.AddrStd) {
            return 'MsgAddressIntAddrStdVariant';
        }
        if (obj.AddrVar) {
            return 'MsgAddressIntAddrVarVariant';
        }
        return null;
    }
};

const TickTock = struct({
    tick: scalar,
    tock: scalar,
});

const StorageUsedShort = struct({
    cells: scalar,
    bits: scalar,
});

const SplitMergeInfo = struct({
    cur_shard_pfx_len: scalar,
    acc_split_depth: scalar,
    this_addr: scalar,
    sibling_addr: scalar,
});

const MsgAddressExtAddrExtern = struct({
    AddrExtern: scalar,
});

const MsgAddressExt = struct({
    AddrNone: None,
    AddrExtern: MsgAddressExtAddrExtern,
});

const MsgAddressExtResolver = {
    __resolveType(obj, context, info) {
        if (obj.AddrNone) {
            return 'MsgAddressExtAddrNoneVariant';
        }
        if (obj.AddrExtern) {
            return 'MsgAddressExtAddrExternVariant';
        }
        return null;
    }
};

const MessageHeaderIntMsgInfo = struct({
    ihr_disabled: scalar,
    bounce: scalar,
    bounced: scalar,
    src: MsgAddressInt,
    dst: MsgAddressInt,
    value: CurrencyCollection,
    ihr_fee: scalar,
    fwd_fee: scalar,
    created_lt: scalar,
    created_at: scalar,
});

const MessageHeaderExtInMsgInfo = struct({
    src: MsgAddressExt,
    dst: MsgAddressInt,
    import_fee: scalar,
});

const MessageHeaderExtOutMsgInfo = struct({
    src: MsgAddressInt,
    dst: MsgAddressExt,
    created_lt: scalar,
    created_at: scalar,
});

const MessageHeader = struct({
    IntMsgInfo: MessageHeaderIntMsgInfo,
    ExtInMsgInfo: MessageHeaderExtInMsgInfo,
    ExtOutMsgInfo: MessageHeaderExtOutMsgInfo,
});

const MessageHeaderResolver = {
    __resolveType(obj, context, info) {
        if (obj.IntMsgInfo) {
            return 'MessageHeaderIntMsgInfoVariant';
        }
        if (obj.ExtInMsgInfo) {
            return 'MessageHeaderExtInMsgInfoVariant';
        }
        if (obj.ExtOutMsgInfo) {
            return 'MessageHeaderExtOutMsgInfoVariant';
        }
        return null;
    }
};

const MessageInit = struct({
    split_depth: scalar,
    special: TickTock,
    code: scalar,
    data: scalar,
    library: scalar,
});

const Message = struct({
    _key: scalar,
    id: GenericId,
    transaction_id: GenericId,
    block_id: GenericId,
    header: MessageHeader,
    init: MessageInit,
    body: scalar,
    status: scalar,
});

const MsgEnvelope = struct({
    msg: scalar,
    next_addr: IntermediateAddress,
    cur_addr: IntermediateAddress,
    fwd_fee_remaining: CurrencyCollection,
});

const InMsgExternal = struct({
    msg: scalar,
    transaction: scalar,
});

const InMsgIHR = struct({
    msg: scalar,
    transaction: scalar,
    ihr_fee: scalar,
    proof_created: scalar,
});

const InMsgImmediatelly = struct({
    in_msg: MsgEnvelope,
    fwd_fee: scalar,
    transaction: scalar,
});

const InMsgFinal = struct({
    in_msg: MsgEnvelope,
    fwd_fee: scalar,
    transaction: scalar,
});

const InMsgTransit = struct({
    in_msg: MsgEnvelope,
    out_msg: MsgEnvelope,
    transit_fee: scalar,
});

const InMsgDiscardedFinal = struct({
    in_msg: MsgEnvelope,
    transaction_id: scalar,
    fwd_fee: scalar,
});

const InMsgDiscardedTransit = struct({
    in_msg: MsgEnvelope,
    transaction_id: scalar,
    fwd_fee: scalar,
    proof_delivered: scalar,
});

const InMsg = struct({
    External: InMsgExternal,
    IHR: InMsgIHR,
    Immediatelly: InMsgImmediatelly,
    Final: InMsgFinal,
    Transit: InMsgTransit,
    DiscardedFinal: InMsgDiscardedFinal,
    DiscardedTransit: InMsgDiscardedTransit,
});

const InMsgResolver = {
    __resolveType(obj, context, info) {
        if (obj.External) {
            return 'InMsgExternalVariant';
        }
        if (obj.IHR) {
            return 'InMsgIHRVariant';
        }
        if (obj.Immediatelly) {
            return 'InMsgImmediatellyVariant';
        }
        if (obj.Final) {
            return 'InMsgFinalVariant';
        }
        if (obj.Transit) {
            return 'InMsgTransitVariant';
        }
        if (obj.DiscardedFinal) {
            return 'InMsgDiscardedFinalVariant';
        }
        if (obj.DiscardedTransit) {
            return 'InMsgDiscardedTransitVariant';
        }
        return null;
    }
};

const OutMsgExternal = struct({
    msg: scalar,
    transaction: scalar,
});

const OutMsgImmediately = struct({
    out_msg: MsgEnvelope,
    transaction: scalar,
    reimport: InMsg,
});

const OutMsgOutMsgNew = struct({
    out_msg: MsgEnvelope,
    transaction: scalar,
});

const OutMsgTransit = struct({
    out_msg: MsgEnvelope,
    imported: InMsg,
});

const OutMsgDequeue = struct({
    out_msg: MsgEnvelope,
    import_block_lt: scalar,
});

const OutMsgTransitRequired = struct({
    out_msg: MsgEnvelope,
    imported: InMsg,
});

const OutMsg = struct({
    None: None,
    External: OutMsgExternal,
    Immediately: OutMsgImmediately,
    OutMsgNew: OutMsgOutMsgNew,
    Transit: OutMsgTransit,
    Dequeue: OutMsgDequeue,
    TransitRequired: OutMsgTransitRequired,
});

const OutMsgResolver = {
    __resolveType(obj, context, info) {
        if (obj.None) {
            return 'OutMsgNoneVariant';
        }
        if (obj.External) {
            return 'OutMsgExternalVariant';
        }
        if (obj.Immediately) {
            return 'OutMsgImmediatelyVariant';
        }
        if (obj.OutMsgNew) {
            return 'OutMsgOutMsgNewVariant';
        }
        if (obj.Transit) {
            return 'OutMsgTransitVariant';
        }
        if (obj.Dequeue) {
            return 'OutMsgDequeueVariant';
        }
        if (obj.TransitRequired) {
            return 'OutMsgTransitRequiredVariant';
        }
        return null;
    }
};

const BlockInfoPrevRefPrev = struct({
    seq_no: scalar,
    file_hash: scalar,
    root_hash: scalar,
    end_lt: scalar,
});

const BlockInfoPrevRef = struct({
    prev: BlockInfoPrevRefPrev,
});

const BlockInfoShard = struct({
    shard_pfx_bits: scalar,
    workchain_id: scalar,
    shard_prefix: scalar,
});

const BlockInfoMasterRef = struct({
    master: ExtBlkRef,
});

const BlockInfoPrevVertRef = struct({
    prev: ExtBlkRef,
    prev_alt: ExtBlkRef,
});

const BlockInfo = struct({
    want_split: scalar,
    seq_no: scalar,
    after_merge: scalar,
    gen_utime: scalar,
    gen_catchain_seqno: scalar,
    flags: scalar,
    prev_ref: BlockInfoPrevRef,
    version: scalar,
    gen_validator_list_hash_short: scalar,
    before_split: scalar,
    after_split: scalar,
    want_merge: scalar,
    vert_seq_no: scalar,
    start_lt: scalar,
    end_lt: scalar,
    shard: BlockInfoShard,
    min_ref_mc_seqno: scalar,
    master_ref: BlockInfoMasterRef,
    prev_vert_ref: BlockInfoPrevVertRef,
});

const BlockValueFlow = struct({
    to_next_blk: CurrencyCollection,
    exported: CurrencyCollection,
    fees_collected: CurrencyCollection,
    created: CurrencyCollection,
    imported: CurrencyCollection,
    from_prev_blk: CurrencyCollection,
    minted: CurrencyCollection,
    fees_imported: CurrencyCollection,
});

const BlockExtraAccountBlocksStateUpdate = struct({
    old_hash: scalar,
    new_hash: scalar,
});

const StringArray = array(String);
const BlockExtraAccountBlocks = struct({
    account_addr: scalar,
    transactions: StringArray,
    state_update: BlockExtraAccountBlocksStateUpdate,
    tr_count: scalar,
});

const InMsgArray = array(InMsg);
const OutMsgArray = array(OutMsg);
const BlockExtraAccountBlocksArray = array(BlockExtraAccountBlocks);
const BlockExtra = struct({
    in_msg_descr: InMsgArray,
    rand_seed: scalar,
    out_msg_descr: OutMsgArray,
    account_blocks: BlockExtraAccountBlocksArray,
});

const BlockStateUpdate = struct({
    new: scalar,
    new_hash: scalar,
    new_depth: scalar,
    old: scalar,
    old_hash: scalar,
    old_depth: scalar,
});

const Block = struct({
    _key: scalar,
    id: GenericId,
    status: scalar,
    global_id: scalar,
    info: BlockInfo,
    value_flow: BlockValueFlow,
    extra: BlockExtra,
    state_update: BlockStateUpdate,
});

const AccountStorageStat = struct({
    last_paid: scalar,
    due_payment: scalar,
});

const AccountStorageStateAccountActive = struct({
    split_depth: scalar,
    special: TickTock,
    code: scalar,
    data: scalar,
    library: scalar,
});

const AccountStorageStateAccountFrozen = struct({
    dummy: scalar,
});

const AccountStorageState = struct({
    AccountUninit: None,
    AccountActive: AccountStorageStateAccountActive,
    AccountFrozen: AccountStorageStateAccountFrozen,
});

const AccountStorageStateResolver = {
    __resolveType(obj, context, info) {
        if (obj.AccountUninit) {
            return 'AccountStorageStateAccountUninitVariant';
        }
        if (obj.AccountActive) {
            return 'AccountStorageStateAccountActiveVariant';
        }
        if (obj.AccountFrozen) {
            return 'AccountStorageStateAccountFrozenVariant';
        }
        return null;
    }
};

const AccountStorage = struct({
    last_trans_lt: scalar,
    balance: CurrencyCollection,
    state: AccountStorageState,
});

const Account = struct({
    _key: scalar,
    storage_stat: AccountStorageStat,
    storage: AccountStorage,
    addr: MsgAddressInt,
});

const TransactionStateUpdate = struct({
    old_hash: scalar,
    new_hash: scalar,
});

const TrStoragePhase = struct({
    storage_fees_collected: scalar,
    storage_fees_due: scalar,
    status_change: scalar,
});

const TrCreditPhase = struct({
    due_fees_collected: scalar,
    credit: CurrencyCollection,
});

const TrComputePhaseSkipped = struct({
    reason: scalar,
});

const TrComputePhaseVm = struct({
    success: scalar,
    msg_state_used: scalar,
    account_activated: scalar,
    gas_fees: scalar,
    gas_used: scalar,
    gas_limit: scalar,
    gas_credit: scalar,
    mode: scalar,
    exit_code: scalar,
    exit_arg: scalar,
    vm_steps: scalar,
    vm_init_state_hash: scalar,
    vm_final_state_hash: scalar,
});

const TrComputePhase = struct({
    Skipped: TrComputePhaseSkipped,
    Vm: TrComputePhaseVm,
});

const TrComputePhaseResolver = {
    __resolveType(obj, context, info) {
        if (obj.Skipped) {
            return 'TrComputePhaseSkippedVariant';
        }
        if (obj.Vm) {
            return 'TrComputePhaseVmVariant';
        }
        return null;
    }
};

const TrActionPhase = struct({
    success: scalar,
    valid: scalar,
    no_funds: scalar,
    status_change: scalar,
    total_fwd_fees: scalar,
    total_action_fees: scalar,
    result_code: scalar,
    result_arg: scalar,
    tot_actions: scalar,
    spec_actions: scalar,
    skipped_actions: scalar,
    msgs_created: scalar,
    action_list_hash: scalar,
    tot_msg_size: StorageUsedShort,
});

const TrBouncePhaseNofunds = struct({
    msg_size: StorageUsedShort,
    req_fwd_fees: scalar,
});

const TrBouncePhaseOk = struct({
    msg_size: StorageUsedShort,
    msg_fees: scalar,
    fwd_fees: scalar,
});

const TrBouncePhase = struct({
    Negfunds: None,
    Nofunds: TrBouncePhaseNofunds,
    Ok: TrBouncePhaseOk,
});

const TrBouncePhaseResolver = {
    __resolveType(obj, context, info) {
        if (obj.Negfunds) {
            return 'TrBouncePhaseNegfundsVariant';
        }
        if (obj.Nofunds) {
            return 'TrBouncePhaseNofundsVariant';
        }
        if (obj.Ok) {
            return 'TrBouncePhaseOkVariant';
        }
        return null;
    }
};

const TransactionDescriptionOrdinary = struct({
    credit_first: scalar,
    storage_ph: TrStoragePhase,
    credit_ph: TrCreditPhase,
    compute_ph: TrComputePhase,
    action: TrActionPhase,
    aborted: scalar,
    bounce: TrBouncePhase,
    destroyed: scalar,
});

const TransactionDescriptionTickTock = struct({
    tt: scalar,
    storage: TrStoragePhase,
    compute_ph: TrComputePhase,
    action: TrActionPhase,
    aborted: scalar,
    destroyed: scalar,
});

const TransactionDescriptionSplitPrepare = struct({
    split_info: SplitMergeInfo,
    compute_ph: TrComputePhase,
    action: TrActionPhase,
    aborted: scalar,
    destroyed: scalar,
});

const TransactionDescriptionSplitInstall = struct({
    split_info: SplitMergeInfo,
    prepare_transaction: scalar,
    installed: scalar,
});

const TransactionDescriptionMergePrepare = struct({
    split_info: SplitMergeInfo,
    storage_ph: TrStoragePhase,
    aborted: scalar,
});

const TransactionDescriptionMergeInstall = struct({
    split_info: SplitMergeInfo,
    prepare_transaction: scalar,
    credit_ph: TrCreditPhase,
    compute_ph: TrComputePhase,
    action: TrActionPhase,
    aborted: scalar,
    destroyed: scalar,
});

const TransactionDescription = struct({
    Ordinary: TransactionDescriptionOrdinary,
    Storage: TrStoragePhase,
    TickTock: TransactionDescriptionTickTock,
    SplitPrepare: TransactionDescriptionSplitPrepare,
    SplitInstall: TransactionDescriptionSplitInstall,
    MergePrepare: TransactionDescriptionMergePrepare,
    MergeInstall: TransactionDescriptionMergeInstall,
});

const TransactionDescriptionResolver = {
    __resolveType(obj, context, info) {
        if (obj.Ordinary) {
            return 'TransactionDescriptionOrdinaryVariant';
        }
        if (obj.Storage) {
            return 'TransactionDescriptionStorageVariant';
        }
        if (obj.TickTock) {
            return 'TransactionDescriptionTickTockVariant';
        }
        if (obj.SplitPrepare) {
            return 'TransactionDescriptionSplitPrepareVariant';
        }
        if (obj.SplitInstall) {
            return 'TransactionDescriptionSplitInstallVariant';
        }
        if (obj.MergePrepare) {
            return 'TransactionDescriptionMergePrepareVariant';
        }
        if (obj.MergeInstall) {
            return 'TransactionDescriptionMergeInstallVariant';
        }
        return null;
    }
};

const MessageArray = array(Message);
const Transaction = struct({
    _key: scalar,
    id: GenericId,
    block_id: GenericId,
    status: scalar,
    account_addr: scalar,
    last_trans_lt: scalar,
    prev_trans_hash: scalar,
    prev_trans_lt: scalar,
    now: scalar,
    outmsg_cnt: scalar,
    orig_status: scalar,
    end_status: scalar,
    in_msg: scalar,
    in_message: Message,
    out_msgs: StringArray,
    out_messages: MessageArray,
    total_fees: scalar,
    state_update: TransactionStateUpdate,
    description: TransactionDescription,
    root_cell: scalar,
});

function createResolvers(db) {
    return {
        IntermediateAddress: IntermediateAddressResolver,
        MsgAddressInt: MsgAddressIntResolver,
        MsgAddressExt: MsgAddressExtResolver,
        MessageHeader: MessageHeaderResolver,
        InMsg: InMsgResolver,
        OutMsg: OutMsgResolver,
        AccountStorageState: AccountStorageStateResolver,
        TrComputePhase: TrComputePhaseResolver,
        TrBouncePhase: TrBouncePhaseResolver,
        TransactionDescription: TransactionDescriptionResolver,
        Transaction: {
            in_message(parent) {
                return db.fetchDocByKey(db.messages, parent.in_msg);
            },
            out_messages(parent) {
                return db.fetchDocsByKeys(db.messages, parent.out_msgs);
            },
        },
        Query: {
            messages: db.collectionQuery(db.messages, Message),
            blocks: db.collectionQuery(db.blocks, Block),
            accounts: db.collectionQuery(db.accounts, Account),
            transactions: db.collectionQuery(db.transactions, Transaction),
            select: db.selectQuery(),
        },
        Subscription: {
            messages: db.collectionSubscription(db.messages, Message),
            blocks: db.collectionSubscription(db.blocks, Block),
            accounts: db.collectionSubscription(db.accounts, Account),
            transactions: db.collectionSubscription(db.transactions, Transaction),
        }
    }
}
module.exports = {
    createResolvers
};
