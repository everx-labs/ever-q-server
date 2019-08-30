const { scalar, struct, array } = require('./filters.js');
const None = {
    dispatcher: struct,
    fields: {
        dummy: scalar,
    }
};

const CurrencyCollection = {
    dispatcher: struct,
    fields: {
        Grams: scalar,
    }
};

const IntermediateAddressRegular = {
    dispatcher: struct,
    fields: {
        use_src_bits: scalar,
    }
};

const IntermediateAddressSimple = {
    dispatcher: struct,
    fields: {
        workchain_id: scalar,
        addr_pfx: scalar,
    }
};

const IntermediateAddressExt = {
    dispatcher: struct,
    fields: {
        workchain_id: scalar,
        addr_pfx: scalar,
    }
};

const IntermediateAddress = {
    dispatcher: struct,
    fields: {
        Regular: IntermediateAddressRegular,
        Simple: IntermediateAddressSimple,
        Ext: IntermediateAddressExt,
    }
};

const ExtBlkRef = {
    dispatcher: struct,
    fields: {
        end_lt: scalar,
        seq_no: scalar,
        root_hash: scalar,
        file_hash: scalar,
    }
};

const GenericId = {
    dispatcher: struct,
    fields: {
        ready: scalar,
        data: scalar,
    }
};

const MsgAddressIntAddrStdAnycast = {
    dispatcher: struct,
    fields: {
        rewrite_pfx: scalar,
    }
};

const MsgAddressIntAddrStd = {
    dispatcher: struct,
    fields: {
        anycast: MsgAddressIntAddrStdAnycast,
        workchain_id: scalar,
        address: scalar,
    }
};

const MsgAddressIntAddrVarAnycast = {
    dispatcher: struct,
    fields: {
        rewrite_pfx: scalar,
    }
};

const MsgAddressIntAddrVar = {
    dispatcher: struct,
    fields: {
        anycast: MsgAddressIntAddrVarAnycast,
        workchain_id: scalar,
        address: scalar,
    }
};

const MsgAddressInt = {
    dispatcher: struct,
    fields: {
        AddrNone: None,
        AddrStd: MsgAddressIntAddrStd,
        AddrVar: MsgAddressIntAddrVar,
    }
};

const TickTock = {
    dispatcher: struct,
    fields: {
        tick: scalar,
        tock: scalar,
    }
};

const StateInit = {
    dispatcher: struct,
    fields: {
        split_depth: scalar,
        special: TickTock,
        code: scalar,
        data: scalar,
        library: scalar,
    }
};

const StorageUsedShort = {
    dispatcher: struct,
    fields: {
        cells: scalar,
        bits: scalar,
    }
};

const SplitMergeInfo = {
    dispatcher: struct,
    fields: {
        cur_shard_pfx_len: scalar,
        acc_split_depth: scalar,
        this_addr: scalar,
        sibling_addr: scalar,
    }
};

const CommonMsgInfIntMsgInfo = {
    dispatcher: struct,
    fields: {
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
    }
};

const MsgAddressExtAddrExtern = {
    dispatcher: struct,
    fields: {
        AddrExtern: scalar,
    }
};

const MsgAddressExt = {
    dispatcher: struct,
    fields: {
        AddrNone: None,
        AddrExtern: MsgAddressExtAddrExtern,
    }
};

const CommonMsgInfExtInMsgInfo = {
    dispatcher: struct,
    fields: {
        src: MsgAddressExt,
        dst: MsgAddressInt,
        import_fee: scalar,
    }
};

const CommonMsgInfExtOutMsgInfo = {
    dispatcher: struct,
    fields: {
        src: MsgAddressInt,
        dst: MsgAddressExt,
        created_lt: scalar,
        created_at: scalar,
    }
};

const CommonMsgInf = {
    dispatcher: struct,
    fields: {
        IntMsgInfo: CommonMsgInfIntMsgInfo,
        ExtInMsgInfo: CommonMsgInfExtInMsgInfo,
        ExtOutMsgInfo: CommonMsgInfExtOutMsgInfo,
    }
};

const Message = {
    dispatcher: struct,
    fields: {
        _key: scalar,
        id: GenericId,
        transaction_id: GenericId,
        block_id: GenericId,
        header: CommonMsgInf,
        init: StateInit,
        body: scalar,
        status: scalar,
    }
};

const MsgEnvelope = {
    dispatcher: struct,
    fields: {
        msg: scalar,
        next_addr: IntermediateAddress,
        cur_addr: IntermediateAddress,
        fwd_fee_remaining: CurrencyCollection,
    }
};

const InMsgExternal = {
    dispatcher: struct,
    fields: {
        msg: scalar,
        transaction: scalar,
    }
};

const InMsgIHR = {
    dispatcher: struct,
    fields: {
        msg: scalar,
        transaction: scalar,
        ihr_fee: scalar,
        proof_created: scalar,
    }
};

const InMsgImmediately = {
    dispatcher: struct,
    fields: {
        in_msg: MsgEnvelope,
        fwd_fee: scalar,
        transaction: scalar,
    }
};

const InMsgFinal = {
    dispatcher: struct,
    fields: {
        in_msg: MsgEnvelope,
        fwd_fee: scalar,
        transaction: scalar,
    }
};

const InMsgTransit = {
    dispatcher: struct,
    fields: {
        in_msg: MsgEnvelope,
        out_msg: MsgEnvelope,
        transit_fee: scalar,
    }
};

const InMsgDiscardedFinal = {
    dispatcher: struct,
    fields: {
        in_msg: MsgEnvelope,
        transaction_id: scalar,
        fwd_fee: scalar,
    }
};

const InMsgDiscardedTransit = {
    dispatcher: struct,
    fields: {
        in_msg: MsgEnvelope,
        transaction_id: scalar,
        fwd_fee: scalar,
        proof_delivered: scalar,
    }
};

const InMsg = {
    dispatcher: struct,
    fields: {
        External: InMsgExternal,
        IHR: InMsgIHR,
        Immediately: InMsgImmediately,
        Final: InMsgFinal,
        Transit: InMsgTransit,
        DiscardedFinal: InMsgDiscardedFinal,
        DiscardedTransit: InMsgDiscardedTransit,
    }
};

const OutMsgExternal = {
    dispatcher: struct,
    fields: {
        msg: scalar,
        transaction: scalar,
    }
};

const OutMsgImmediately = {
    dispatcher: struct,
    fields: {
        out_msg: MsgEnvelope,
        transaction: scalar,
        reimport: InMsg,
    }
};

const OutMsgOutMsgNew = {
    dispatcher: struct,
    fields: {
        out_msg: MsgEnvelope,
        transaction: scalar,
    }
};

const OutMsgTransit = {
    dispatcher: struct,
    fields: {
        out_msg: MsgEnvelope,
        imported: InMsg,
    }
};

const OutMsgDequeue = {
    dispatcher: struct,
    fields: {
        out_msg: MsgEnvelope,
        import_block_lt: scalar,
    }
};

const OutMsgTransitRequired = {
    dispatcher: struct,
    fields: {
        out_msg: MsgEnvelope,
        imported: InMsg,
    }
};

const OutMsg = {
    dispatcher: struct,
    fields: {
        None: None,
        External: OutMsgExternal,
        Immediately: OutMsgImmediately,
        OutMsgNew: OutMsgOutMsgNew,
        Transit: OutMsgTransit,
        Dequeue: OutMsgDequeue,
        TransitRequired: OutMsgTransitRequired,
    }
};

const BlockInfoPrevRefPrev = {
    dispatcher: struct,
    fields: {
        seq_no: scalar,
        file_hash: scalar,
        root_hash: scalar,
        end_lt: scalar,
    }
};

const BlockInfoPrevRef = {
    dispatcher: struct,
    fields: {
        prev: BlockInfoPrevRefPrev,
    }
};

const BlockInfoShard = {
    dispatcher: struct,
    fields: {
        shard_pfx_bits: scalar,
        workchain_id: scalar,
        shard_prefix: scalar,
    }
};

const BlockInfoMasterRef = {
    dispatcher: struct,
    fields: {
        master: ExtBlkRef,
    }
};

const BlockInfoPrevVertRef = {
    dispatcher: struct,
    fields: {
        prev: ExtBlkRef,
        prev_alt: ExtBlkRef,
    }
};

const BlockInfo = {
    dispatcher: struct,
    fields: {
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
    }
};

const BlockValueFlow = {
    dispatcher: struct,
    fields: {
        to_next_blk: CurrencyCollection,
        exported: CurrencyCollection,
        fees_collected: CurrencyCollection,
        created: CurrencyCollection,
        imported: CurrencyCollection,
        from_prev_blk: CurrencyCollection,
        minted: CurrencyCollection,
        fees_imported: CurrencyCollection,
    }
};

const BlockExtraAccountBlocksStateUpdate = {
    dispatcher: struct,
    fields: {
        old_hash: scalar,
        new_hash: scalar,
    }
};

const StringArray = {
    type: array,
    fields: {
        all: String,
        any: String,
    }
};

const BlockExtraAccountBlocks = {
    dispatcher: struct,
    fields: {
        account_addr: scalar,
        transactions: StringArray,
        state_update: BlockExtraAccountBlocksStateUpdate,
        tr_count: scalar,
    }
};

const InMsgArray = {
    type: array,
    fields: {
        all: InMsg,
        any: InMsg,
    }
};

const OutMsgArray = {
    type: array,
    fields: {
        all: OutMsg,
        any: OutMsg,
    }
};

const BlockExtraAccountBlocksArray = {
    type: array,
    fields: {
        all: BlockExtraAccountBlocks,
        any: BlockExtraAccountBlocks,
    }
};

const BlockExtra = {
    dispatcher: struct,
    fields: {
        in_msg_descr: InMsgArray,
        rand_seed: scalar,
        out_msg_descr: OutMsgArray,
        account_blocks: BlockExtraAccountBlocksArray,
    }
};

const BlockStateUpdate = {
    dispatcher: struct,
    fields: {
        new: scalar,
        new_hash: scalar,
        new_depth: scalar,
        old: scalar,
        old_hash: scalar,
        old_depth: scalar,
    }
};

const Block = {
    dispatcher: struct,
    fields: {
        _key: scalar,
        id: GenericId,
        status: scalar,
        global_id: scalar,
        info: BlockInfo,
        value_flow: BlockValueFlow,
        extra: BlockExtra,
        state_update: BlockStateUpdate,
    }
};

const AccountStorageStat = {
    dispatcher: struct,
    fields: {
        last_paid: scalar,
        due_payment: scalar,
    }
};

const AccountStorageStateAccountActive = {
    dispatcher: struct,
    fields: {
        split_depth: scalar,
        special: TickTock,
        code: scalar,
        data: scalar,
        library: scalar,
    }
};

const AccountStorageState = {
    dispatcher: struct,
    fields: {
        AccountUninit: None,
        AccountActive: AccountStorageStateAccountActive,
        AccountFrozen: scalar,
    }
};

const AccountStorage = {
    dispatcher: struct,
    fields: {
        last_trans_lt: scalar,
        balance: CurrencyCollection,
        state: AccountStorageState,
    }
};

const Account = {
    dispatcher: struct,
    fields: {
        _key: scalar,
        storage_stat: AccountStorageStat,
        storage: AccountStorage,
        addr: MsgAddressInt,
    }
};

const TransactionStateUpdate = {
    dispatcher: struct,
    fields: {
        old_hash: scalar,
        new_hash: scalar,
    }
};

const TrStoragePhase = {
    dispatcher: struct,
    fields: {
        storage_fees_collected: scalar,
        storage_fees_due: scalar,
        status_change: scalar,
    }
};

const TrCreditPhase = {
    dispatcher: struct,
    fields: {
        due_fees_collected: scalar,
        credit: CurrencyCollection,
    }
};

const TrComputePhaseSkipped = {
    dispatcher: struct,
    fields: {
        reason: scalar,
    }
};

const TrComputePhaseVm = {
    dispatcher: struct,
    fields: {
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
    }
};

const TrComputePhase = {
    dispatcher: struct,
    fields: {
        Skipped: TrComputePhaseSkipped,
        Vm: TrComputePhaseVm,
    }
};

const TrActionPhase = {
    dispatcher: struct,
    fields: {
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
    }
};

const TrBouncePhaseNofunds = {
    dispatcher: struct,
    fields: {
        msg_size: StorageUsedShort,
        req_fwd_fees: scalar,
    }
};

const TrBouncePhaseOk = {
    dispatcher: struct,
    fields: {
        msg_size: StorageUsedShort,
        msg_fees: scalar,
        fwd_fees: scalar,
    }
};

const TrBouncePhase = {
    dispatcher: struct,
    fields: {
        Negfunds: None,
        Nofunds: TrBouncePhaseNofunds,
        Ok: TrBouncePhaseOk,
    }
};

const TransactionDescrOrdinary = {
    dispatcher: struct,
    fields: {
        credit_first: scalar,
        storage_ph: TrStoragePhase,
        credit_ph: TrCreditPhase,
        compute_ph: TrComputePhase,
        action: TrActionPhase,
        aborted: scalar,
        bounce: TrBouncePhase,
        destroyed: scalar,
    }
};

const TransactionDescrTickTock = {
    dispatcher: struct,
    fields: {
        tt: scalar,
        storage: TrStoragePhase,
        compute_ph: TrComputePhase,
        action: TrActionPhase,
        aborted: scalar,
        destroyed: scalar,
    }
};

const TransactionDescrSplitPrepare = {
    dispatcher: struct,
    fields: {
        split_info: SplitMergeInfo,
        compute_ph: TrComputePhase,
        action: TrActionPhase,
        aborted: scalar,
        destroyed: scalar,
    }
};

const TransactionDescrSplitInstall = {
    dispatcher: struct,
    fields: {
        split_info: SplitMergeInfo,
        prepare_transaction: scalar,
        installed: scalar,
    }
};

const TransactionDescrMergePrepare = {
    dispatcher: struct,
    fields: {
        split_info: SplitMergeInfo,
        storage_ph: TrStoragePhase,
        aborted: scalar,
    }
};

const TransactionDescrMergeInstall = {
    dispatcher: struct,
    fields: {
        split_info: SplitMergeInfo,
        prepare_transaction: scalar,
        credit_ph: TrCreditPhase,
        compute_ph: TrComputePhase,
        action: TrActionPhase,
        aborted: scalar,
        destroyed: scalar,
    }
};

const TransactionDescr = {
    dispatcher: struct,
    fields: {
        Ordinary: TransactionDescrOrdinary,
        Storage: TrStoragePhase,
        TickTock: TransactionDescrTickTock,
        SplitPrepare: TransactionDescrSplitPrepare,
        SplitInstall: TransactionDescrSplitInstall,
        MergePrepare: TransactionDescrMergePrepare,
        MergeInstall: TransactionDescrMergeInstall,
    }
};

const Transaction = {
    dispatcher: struct,
    fields: {
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
        out_msgs: StringArray,
        total_fees: scalar,
        state_update: TransactionStateUpdate,
        description: TransactionDescr,
        root_cell: scalar,
    }
};

module.exports = {
    Message,
    Block,
    Account,
    Transaction,
};
