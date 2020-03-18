const {
    scalar,
    bigUInt1,
    bigUInt2,
    resolveBigUInt,
    struct,
    array,
    join,
    joinArray,
    enumName,
    createEnumNameResolver,
} = require('./db-types.js');
const OtherCurrency = struct({
    currency: scalar,
    value: bigUInt2,
});

const ExtBlkRef = struct({
    end_lt: bigUInt1,
    seq_no: scalar,
    root_hash: scalar,
    file_hash: scalar,
});

const MsgEnvelope = struct({
    msg_id: scalar,
    next_addr: scalar,
    cur_addr: scalar,
    fwd_fee_remaining: bigUInt2,
});

const InMsg = struct({
    msg_type: scalar,
    msg_type_name: enumName('msg_type', { External: 0, Ihr: 1, Immediately: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6 }),
    msg_id: scalar,
    ihr_fee: bigUInt2,
    proof_created: scalar,
    in_msg: MsgEnvelope,
    fwd_fee: bigUInt2,
    out_msg: MsgEnvelope,
    transit_fee: bigUInt2,
    transaction_id: scalar,
    proof_delivered: scalar,
});

const OutMsg = struct({
    msg_type: scalar,
    msg_type_name: enumName('msg_type', { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, None: -1 }),
    msg_id: scalar,
    transaction_id: scalar,
    out_msg: MsgEnvelope,
    reimport: InMsg,
    imported: InMsg,
    import_block_lt: bigUInt1,
});

const TransactionStorage = struct({
    storage_fees_collected: bigUInt2,
    storage_fees_due: bigUInt2,
    status_change: scalar,
    status_change_name: enumName('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
});

const OtherCurrencyArray = array(() => OtherCurrency);
const TransactionCredit = struct({
    due_fees_collected: bigUInt2,
    credit: bigUInt2,
    credit_other: OtherCurrencyArray,
});

const TransactionCompute = struct({
    compute_type: scalar,
    compute_type_name: enumName('compute_type', { Skipped: 0, Vm: 1 }),
    skipped_reason: scalar,
    skipped_reason_name: enumName('skipped_reason', { NoState: 0, BadState: 1, NoGas: 2 }),
    success: scalar,
    msg_state_used: scalar,
    account_activated: scalar,
    gas_fees: bigUInt2,
    gas_used: bigUInt1,
    gas_limit: bigUInt1,
    gas_credit: scalar,
    mode: scalar,
    exit_code: scalar,
    exit_arg: scalar,
    vm_steps: scalar,
    vm_init_state_hash: scalar,
    vm_final_state_hash: scalar,
});

const TransactionAction = struct({
    success: scalar,
    valid: scalar,
    no_funds: scalar,
    status_change: scalar,
    status_change_name: enumName('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
    total_fwd_fees: bigUInt2,
    total_action_fees: bigUInt2,
    result_code: scalar,
    result_arg: scalar,
    tot_actions: scalar,
    spec_actions: scalar,
    skipped_actions: scalar,
    msgs_created: scalar,
    action_list_hash: scalar,
    total_msg_size_cells: scalar,
    total_msg_size_bits: scalar,
});

const TransactionBounce = struct({
    bounce_type: scalar,
    bounce_type_name: enumName('bounce_type', { NegFunds: 0, NoFunds: 1, Ok: 2 }),
    msg_size_cells: scalar,
    msg_size_bits: scalar,
    req_fwd_fees: bigUInt2,
    msg_fees: bigUInt2,
    fwd_fees: bigUInt2,
});

const TransactionSplitInfo = struct({
    cur_shard_pfx_len: scalar,
    acc_split_depth: scalar,
    this_addr: scalar,
    sibling_addr: scalar,
});

const StringArray = array(() => scalar);
const MessageArray = array(() => Message);
const Transaction = struct({
    id: scalar,
    tr_type: scalar,
    tr_type_name: enumName('tr_type', { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
    status: scalar,
    status_name: enumName('status', { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
    block_id: scalar,
    account_addr: scalar,
    workchain_id: scalar,
    lt: bigUInt1,
    prev_trans_hash: scalar,
    prev_trans_lt: bigUInt1,
    now: scalar,
    outmsg_cnt: scalar,
    orig_status: scalar,
    orig_status_name: enumName('orig_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    end_status: scalar,
    end_status_name: enumName('end_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    in_msg: scalar,
    in_message: join('in_msg', 'id', 'messages', () => Message),
    out_msgs: StringArray,
    out_messages: joinArray('out_msgs', 'id', 'messages', () => Message),
    total_fees: bigUInt2,
    total_fees_other: OtherCurrencyArray,
    old_hash: scalar,
    new_hash: scalar,
    credit_first: scalar,
    storage: TransactionStorage,
    credit: TransactionCredit,
    compute: TransactionCompute,
    action: TransactionAction,
    bounce: TransactionBounce,
    aborted: scalar,
    destroyed: scalar,
    tt: scalar,
    split_info: TransactionSplitInfo,
    prepare_transaction: scalar,
    installed: scalar,
    proof: scalar,
    boc: scalar,
}, true);

const Message = struct({
    id: scalar,
    msg_type: scalar,
    msg_type_name: enumName('msg_type', { Internal: 0, ExtIn: 1, ExtOut: 2 }),
    status: scalar,
    status_name: enumName('status', { Unknown: 0, Queued: 1, Processing: 2, Preliminary: 3, Proposed: 4, Finalized: 5, Refused: 6, Transiting: 7 }),
    block_id: scalar,
    body: scalar,
    split_depth: scalar,
    tick: scalar,
    tock: scalar,
    code: scalar,
    data: scalar,
    library: scalar,
    src: scalar,
    dst: scalar,
    src_workchain_id: scalar,
    dst_workchain_id: scalar,
    created_lt: bigUInt1,
    created_at: scalar,
    ihr_disabled: scalar,
    ihr_fee: bigUInt2,
    fwd_fee: bigUInt2,
    import_fee: bigUInt2,
    bounce: scalar,
    bounced: scalar,
    value: bigUInt2,
    value_other: OtherCurrencyArray,
    proof: scalar,
    boc: scalar,
    src_transaction: join('id', 'out_msgs[*]', 'transactions', () => Transaction),
    dst_transaction: join('id', 'in_msg', 'transactions', () => Transaction),
}, true);

const BlockValueFlow = struct({
    to_next_blk: bigUInt2,
    to_next_blk_other: OtherCurrencyArray,
    exported: bigUInt2,
    exported_other: OtherCurrencyArray,
    fees_collected: bigUInt2,
    fees_collected_other: OtherCurrencyArray,
    created: bigUInt2,
    created_other: OtherCurrencyArray,
    imported: bigUInt2,
    imported_other: OtherCurrencyArray,
    from_prev_blk: bigUInt2,
    from_prev_blk_other: OtherCurrencyArray,
    minted: bigUInt2,
    minted_other: OtherCurrencyArray,
    fees_imported: bigUInt2,
    fees_imported_other: OtherCurrencyArray,
});

const BlockAccountBlocksTransactions = struct({
    lt: bigUInt1,
    transaction_id: scalar,
    total_fees: bigUInt2,
    total_fees_other: OtherCurrencyArray,
});

const BlockAccountBlocksTransactionsArray = array(() => BlockAccountBlocksTransactions);
const BlockAccountBlocks = struct({
    account_addr: scalar,
    transactions: BlockAccountBlocksTransactionsArray,
    old_hash: scalar,
    new_hash: scalar,
    tr_count: scalar,
});

const BlockStateUpdate = struct({
    new: scalar,
    new_hash: scalar,
    new_depth: scalar,
    old: scalar,
    old_hash: scalar,
    old_depth: scalar,
});

const BlockMasterShardHashesDescr = struct({
    seq_no: scalar,
    reg_mc_seqno: scalar,
    start_lt: bigUInt1,
    end_lt: bigUInt1,
    root_hash: scalar,
    file_hash: scalar,
    before_split: scalar,
    before_merge: scalar,
    want_split: scalar,
    want_merge: scalar,
    nx_cc_updated: scalar,
    flags: scalar,
    next_catchain_seqno: scalar,
    next_validator_shard: scalar,
    min_ref_mc_seqno: scalar,
    gen_utime: scalar,
    split_type: scalar,
    split_type_name: enumName('split_type', { None: 0, Split: 2, Merge: 3 }),
    split: scalar,
    fees_collected: bigUInt2,
    fees_collected_other: OtherCurrencyArray,
    funds_created: bigUInt2,
    funds_created_other: OtherCurrencyArray,
});

const BlockMasterShardHashes = struct({
    workchain_id: scalar,
    shard: scalar,
    descr: BlockMasterShardHashesDescr,
});

const BlockMasterShardFees = struct({
    workchain_id: scalar,
    shard: scalar,
    fees: bigUInt2,
    fees_other: OtherCurrencyArray,
    create: bigUInt2,
    create_other: OtherCurrencyArray,
});

const BlockMasterPrevBlkSignatures = struct({
    node_id: scalar,
    r: scalar,
    s: scalar,
});

const BlockMasterConfigP6 = struct({
    mint_new_price: scalar,
    mint_add_price: scalar,
});

const BlockMasterConfigP7 = struct({
    currency: scalar,
    value: scalar,
});

const BlockMasterConfigP8 = struct({
    version: scalar,
    capabilities: scalar,
});

const ConfigProposalSetup = struct({
    min_tot_rounds: scalar,
    max_tot_rounds: scalar,
    min_wins: scalar,
    max_losses: scalar,
    min_store_sec: scalar,
    max_store_sec: scalar,
    bit_price: scalar,
    cell_price: scalar,
});

const BlockMasterConfigP11 = struct({
    normal_params: ConfigProposalSetup,
    critical_params: ConfigProposalSetup,
});

const BlockMasterConfigP12 = struct({
    workchain_id: scalar,
    enabled_since: scalar,
    actual_min_split: scalar,
    min_split: scalar,
    max_split: scalar,
    active: scalar,
    accept_msgs: scalar,
    flags: scalar,
    zerostate_root_hash: scalar,
    zerostate_file_hash: scalar,
    version: scalar,
    basic: scalar,
    vm_version: scalar,
    vm_mode: scalar,
    min_addr_len: scalar,
    max_addr_len: scalar,
    addr_len_step: scalar,
    workchain_type_id: scalar,
});

const BlockMasterConfigP14 = struct({
    masterchain_block_fee: scalar,
    basechain_block_fee: scalar,
});

const BlockMasterConfigP15 = struct({
    validators_elected_for: scalar,
    elections_start_before: scalar,
    elections_end_before: scalar,
    stake_held_for: scalar,
});

const BlockMasterConfigP16 = struct({
    max_validators: scalar,
    max_main_validators: scalar,
    min_validators: scalar,
});

const BlockMasterConfigP17 = struct({
    min_stake: scalar,
    max_stake: scalar,
    min_total_stake: scalar,
    max_stake_factor: scalar,
});

const BlockMasterConfigP18 = struct({
    utime_since: scalar,
    bit_price_ps: scalar,
    cell_price_ps: scalar,
    mc_bit_price_ps: scalar,
    mc_cell_price_ps: scalar,
});

const BlockMasterConfigP28 = struct({
    mc_catchain_lifetime: scalar,
    shard_catchain_lifetime: scalar,
    shard_validators_lifetime: scalar,
    shard_validators_num: scalar,
});

const BlockMasterConfigP29 = struct({
    round_candidates: scalar,
    next_candidate_delay_ms: scalar,
    consensus_timeout_ms: scalar,
    fast_attempts: scalar,
    attempt_duration: scalar,
    catchain_max_deps: scalar,
    max_block_bytes: scalar,
    max_collated_bytes: scalar,
});

const BlockMasterConfigP39 = struct({
    adnl_addr: scalar,
    temp_public_key: scalar,
    seqno: scalar,
    valid_until: scalar,
    signature_r: scalar,
    signature_s: scalar,
});

const GasLimitsPrices = struct({
    gas_price: scalar,
    gas_limit: scalar,
    special_gas_limit: scalar,
    gas_credit: scalar,
    block_gas_limit: scalar,
    freeze_due_limit: scalar,
    delete_due_limit: scalar,
    flat_gas_limit: scalar,
    flat_gas_price: scalar,
});

const BlockLimitsBytes = struct({
    underload: scalar,
    soft_limit: scalar,
    hard_limit: scalar,
});

const BlockLimitsGas = struct({
    underload: scalar,
    soft_limit: scalar,
    hard_limit: scalar,
});

const BlockLimitsLtDelta = struct({
    underload: scalar,
    soft_limit: scalar,
    hard_limit: scalar,
});

const BlockLimits = struct({
    bytes: BlockLimitsBytes,
    gas: BlockLimitsGas,
    lt_delta: BlockLimitsLtDelta,
});

const MsgForwardPrices = struct({
    lump_price: scalar,
    bit_price: scalar,
    cell_price: scalar,
    ihr_price_factor: scalar,
    first_frac: scalar,
    next_frac: scalar,
});

const ValidatorSetList = struct({
    public_key: scalar,
    weight: scalar,
    adnl_addr: scalar,
});

const ValidatorSetListArray = array(() => ValidatorSetList);
const ValidatorSet = struct({
    utime_since: scalar,
    utime_until: scalar,
    total: scalar,
    total_weight: scalar,
    list: ValidatorSetListArray,
});

const BlockMasterConfigP7Array = array(() => BlockMasterConfigP7);
const FloatArray = array(() => scalar);
const BlockMasterConfigP12Array = array(() => BlockMasterConfigP12);
const BlockMasterConfigP18Array = array(() => BlockMasterConfigP18);
const BlockMasterConfigP39Array = array(() => BlockMasterConfigP39);
const BlockMasterConfig = struct({
    p0: scalar,
    p1: scalar,
    p2: scalar,
    p3: scalar,
    p4: scalar,
    p6: BlockMasterConfigP6,
    p7: BlockMasterConfigP7Array,
    p8: BlockMasterConfigP8,
    p9: FloatArray,
    p11: BlockMasterConfigP11,
    p12: BlockMasterConfigP12Array,
    p14: BlockMasterConfigP14,
    p15: BlockMasterConfigP15,
    p16: BlockMasterConfigP16,
    p17: BlockMasterConfigP17,
    p18: BlockMasterConfigP18Array,
    p20: GasLimitsPrices,
    p21: GasLimitsPrices,
    p22: BlockLimits,
    p23: BlockLimits,
    p24: MsgForwardPrices,
    p25: MsgForwardPrices,
    p28: BlockMasterConfigP28,
    p29: BlockMasterConfigP29,
    p31: StringArray,
    p32: ValidatorSet,
    p33: ValidatorSet,
    p34: ValidatorSet,
    p35: ValidatorSet,
    p36: ValidatorSet,
    p37: ValidatorSet,
    p39: BlockMasterConfigP39Array,
});

const BlockMasterShardHashesArray = array(() => BlockMasterShardHashes);
const BlockMasterShardFeesArray = array(() => BlockMasterShardFees);
const BlockMasterPrevBlkSignaturesArray = array(() => BlockMasterPrevBlkSignatures);
const BlockMaster = struct({
    min_shard_gen_utime: scalar,
    max_shard_gen_utime: scalar,
    shard_hashes: BlockMasterShardHashesArray,
    shard_fees: BlockMasterShardFeesArray,
    recover_create_msg: InMsg,
    prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
    config_addr: scalar,
    config: BlockMasterConfig,
});

const BlockSignaturesSignatures = struct({
    node_id: scalar,
    r: scalar,
    s: scalar,
});

const BlockSignaturesSignaturesArray = array(() => BlockSignaturesSignatures);
const BlockSignatures = struct({
    id: scalar,
    signatures: BlockSignaturesSignaturesArray,
}, true);

const InMsgArray = array(() => InMsg);
const OutMsgArray = array(() => OutMsg);
const BlockAccountBlocksArray = array(() => BlockAccountBlocks);
const Block = struct({
    id: scalar,
    status: scalar,
    status_name: enumName('status', { Unknown: 0, Proposed: 1, Finalized: 2, Refused: 3 }),
    global_id: scalar,
    want_split: scalar,
    seq_no: scalar,
    after_merge: scalar,
    gen_utime: scalar,
    gen_catchain_seqno: scalar,
    flags: scalar,
    master_ref: ExtBlkRef,
    prev_ref: ExtBlkRef,
    prev_alt_ref: ExtBlkRef,
    prev_vert_ref: ExtBlkRef,
    prev_vert_alt_ref: ExtBlkRef,
    version: scalar,
    gen_validator_list_hash_short: scalar,
    before_split: scalar,
    after_split: scalar,
    want_merge: scalar,
    vert_seq_no: scalar,
    start_lt: bigUInt1,
    end_lt: bigUInt1,
    workchain_id: scalar,
    shard: scalar,
    min_ref_mc_seqno: scalar,
    prev_key_block_seqno: scalar,
    value_flow: BlockValueFlow,
    in_msg_descr: InMsgArray,
    rand_seed: scalar,
    out_msg_descr: OutMsgArray,
    account_blocks: BlockAccountBlocksArray,
    tr_count: scalar,
    state_update: BlockStateUpdate,
    master: BlockMaster,
    signatures: join('id', 'id', 'blocks_signatures', () => BlockSignatures),
}, true);

const Account = struct({
    id: scalar,
    workchain_id: scalar,
    acc_type: scalar,
    acc_type_name: enumName('acc_type', { Uninit: 0, Active: 1, Frozen: 2 }),
    last_paid: scalar,
    due_payment: bigUInt2,
    last_trans_lt: bigUInt1,
    balance: bigUInt2,
    balance_other: OtherCurrencyArray,
    split_depth: scalar,
    tick: scalar,
    tock: scalar,
    code: scalar,
    data: scalar,
    library: scalar,
    proof: scalar,
    boc: scalar,
}, true);

function createResolvers(db) {
    return {
        OtherCurrency: {
            value(parent, args) {
                return resolveBigUInt(2, parent.value, args);
            },
        },
        ExtBlkRef: {
            end_lt(parent, args) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
        },
        MsgEnvelope: {
            fwd_fee_remaining(parent, args) {
                return resolveBigUInt(2, parent.fwd_fee_remaining, args);
            },
        },
        InMsg: {
            ihr_fee(parent, args) {
                return resolveBigUInt(2, parent.ihr_fee, args);
            },
            fwd_fee(parent, args) {
                return resolveBigUInt(2, parent.fwd_fee, args);
            },
            transit_fee(parent, args) {
                return resolveBigUInt(2, parent.transit_fee, args);
            },
            msg_type_name: createEnumNameResolver('msg_type', { External: 0, Ihr: 1, Immediately: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6 }),
        },
        OutMsg: {
            import_block_lt(parent, args) {
                return resolveBigUInt(1, parent.import_block_lt, args);
            },
            msg_type_name: createEnumNameResolver('msg_type', { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, None: -1 }),
        },
        TransactionStorage: {
            storage_fees_collected(parent, args) {
                return resolveBigUInt(2, parent.storage_fees_collected, args);
            },
            storage_fees_due(parent, args) {
                return resolveBigUInt(2, parent.storage_fees_due, args);
            },
            status_change_name: createEnumNameResolver('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
        },
        TransactionCredit: {
            due_fees_collected(parent, args) {
                return resolveBigUInt(2, parent.due_fees_collected, args);
            },
            credit(parent, args) {
                return resolveBigUInt(2, parent.credit, args);
            },
        },
        TransactionCompute: {
            gas_fees(parent, args) {
                return resolveBigUInt(2, parent.gas_fees, args);
            },
            gas_used(parent, args) {
                return resolveBigUInt(1, parent.gas_used, args);
            },
            gas_limit(parent, args) {
                return resolveBigUInt(1, parent.gas_limit, args);
            },
            compute_type_name: createEnumNameResolver('compute_type', { Skipped: 0, Vm: 1 }),
            skipped_reason_name: createEnumNameResolver('skipped_reason', { NoState: 0, BadState: 1, NoGas: 2 }),
        },
        TransactionAction: {
            total_fwd_fees(parent, args) {
                return resolveBigUInt(2, parent.total_fwd_fees, args);
            },
            total_action_fees(parent, args) {
                return resolveBigUInt(2, parent.total_action_fees, args);
            },
            status_change_name: createEnumNameResolver('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
        },
        TransactionBounce: {
            req_fwd_fees(parent, args) {
                return resolveBigUInt(2, parent.req_fwd_fees, args);
            },
            msg_fees(parent, args) {
                return resolveBigUInt(2, parent.msg_fees, args);
            },
            fwd_fees(parent, args) {
                return resolveBigUInt(2, parent.fwd_fees, args);
            },
            bounce_type_name: createEnumNameResolver('bounce_type', { NegFunds: 0, NoFunds: 1, Ok: 2 }),
        },
        Transaction: {
            id(parent) {
                return parent._key;
            },
            in_message(parent, _args, context) {
                return context.db.messages.waitForDoc(parent.in_msg, '_key');
            },
            out_messages(parent, _args, context) {
                return context.db.messages.waitForDocs(parent.out_msgs, '_key');
            },
            lt(parent, args) {
                return resolveBigUInt(1, parent.lt, args);
            },
            prev_trans_lt(parent, args) {
                return resolveBigUInt(1, parent.prev_trans_lt, args);
            },
            total_fees(parent, args) {
                return resolveBigUInt(2, parent.total_fees, args);
            },
            tr_type_name: createEnumNameResolver('tr_type', { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
            status_name: createEnumNameResolver('status', { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
            orig_status_name: createEnumNameResolver('orig_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
            end_status_name: createEnumNameResolver('end_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
        },
        Message: {
            id(parent) {
                return parent._key;
            },
            src_transaction(parent, _args, context) {
                return context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]');
            },
            dst_transaction(parent, _args, context) {
                return context.db.transactions.waitForDoc(parent._key, 'in_msg');
            },
            created_lt(parent, args) {
                return resolveBigUInt(1, parent.created_lt, args);
            },
            ihr_fee(parent, args) {
                return resolveBigUInt(2, parent.ihr_fee, args);
            },
            fwd_fee(parent, args) {
                return resolveBigUInt(2, parent.fwd_fee, args);
            },
            import_fee(parent, args) {
                return resolveBigUInt(2, parent.import_fee, args);
            },
            value(parent, args) {
                return resolveBigUInt(2, parent.value, args);
            },
            msg_type_name: createEnumNameResolver('msg_type', { Internal: 0, ExtIn: 1, ExtOut: 2 }),
            status_name: createEnumNameResolver('status', { Unknown: 0, Queued: 1, Processing: 2, Preliminary: 3, Proposed: 4, Finalized: 5, Refused: 6, Transiting: 7 }),
        },
        BlockValueFlow: {
            to_next_blk(parent, args) {
                return resolveBigUInt(2, parent.to_next_blk, args);
            },
            exported(parent, args) {
                return resolveBigUInt(2, parent.exported, args);
            },
            fees_collected(parent, args) {
                return resolveBigUInt(2, parent.fees_collected, args);
            },
            created(parent, args) {
                return resolveBigUInt(2, parent.created, args);
            },
            imported(parent, args) {
                return resolveBigUInt(2, parent.imported, args);
            },
            from_prev_blk(parent, args) {
                return resolveBigUInt(2, parent.from_prev_blk, args);
            },
            minted(parent, args) {
                return resolveBigUInt(2, parent.minted, args);
            },
            fees_imported(parent, args) {
                return resolveBigUInt(2, parent.fees_imported, args);
            },
        },
        BlockAccountBlocksTransactions: {
            lt(parent, args) {
                return resolveBigUInt(1, parent.lt, args);
            },
            total_fees(parent, args) {
                return resolveBigUInt(2, parent.total_fees, args);
            },
        },
        BlockMasterShardHashesDescr: {
            start_lt(parent, args) {
                return resolveBigUInt(1, parent.start_lt, args);
            },
            end_lt(parent, args) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
            fees_collected(parent, args) {
                return resolveBigUInt(2, parent.fees_collected, args);
            },
            funds_created(parent, args) {
                return resolveBigUInt(2, parent.funds_created, args);
            },
            split_type_name: createEnumNameResolver('split_type', { None: 0, Split: 2, Merge: 3 }),
        },
        BlockMasterShardFees: {
            fees(parent, args) {
                return resolveBigUInt(2, parent.fees, args);
            },
            create(parent, args) {
                return resolveBigUInt(2, parent.create, args);
            },
        },
        BlockSignatures: {
            id(parent) {
                return parent._key;
            },
        },
        Block: {
            id(parent) {
                return parent._key;
            },
            signatures(parent, _args, context) {
                return context.db.blocks_signatures.waitForDoc(parent._key, '_key');
            },
            start_lt(parent, args) {
                return resolveBigUInt(1, parent.start_lt, args);
            },
            end_lt(parent, args) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
            status_name: createEnumNameResolver('status', { Unknown: 0, Proposed: 1, Finalized: 2, Refused: 3 }),
        },
        Account: {
            id(parent) {
                return parent._key;
            },
            due_payment(parent, args) {
                return resolveBigUInt(2, parent.due_payment, args);
            },
            last_trans_lt(parent, args) {
                return resolveBigUInt(1, parent.last_trans_lt, args);
            },
            balance(parent, args) {
                return resolveBigUInt(2, parent.balance, args);
            },
            acc_type_name: createEnumNameResolver('acc_type', { Uninit: 0, Active: 1, Frozen: 2 }),
        },
        Query: {
            transactions: db.transactions.queryResolver(),
            messages: db.messages.queryResolver(),
            blocks_signatures: db.blocks_signatures.queryResolver(),
            blocks: db.blocks.queryResolver(),
            accounts: db.accounts.queryResolver(),
        },
        Subscription: {
            transactions: db.transactions.subscriptionResolver(),
            messages: db.messages.subscriptionResolver(),
            blocks_signatures: db.blocks_signatures.subscriptionResolver(),
            blocks: db.blocks.subscriptionResolver(),
            accounts: db.accounts.subscriptionResolver(),
        }
    }
}

module.exports = {
    createResolvers,
    OtherCurrency,
    ExtBlkRef,
    MsgEnvelope,
    InMsg,
    OutMsg,
    TransactionStorage,
    TransactionCredit,
    TransactionCompute,
    TransactionAction,
    TransactionBounce,
    TransactionSplitInfo,
    Transaction,
    Message,
    BlockValueFlow,
    BlockAccountBlocksTransactions,
    BlockAccountBlocks,
    BlockStateUpdate,
    BlockMasterShardHashesDescr,
    BlockMasterShardHashes,
    BlockMasterShardFees,
    BlockMasterPrevBlkSignatures,
    BlockMasterConfigP6,
    BlockMasterConfigP7,
    BlockMasterConfigP8,
    ConfigProposalSetup,
    BlockMasterConfigP11,
    BlockMasterConfigP12,
    BlockMasterConfigP14,
    BlockMasterConfigP15,
    BlockMasterConfigP16,
    BlockMasterConfigP17,
    BlockMasterConfigP18,
    BlockMasterConfigP28,
    BlockMasterConfigP29,
    BlockMasterConfigP39,
    GasLimitsPrices,
    BlockLimitsBytes,
    BlockLimitsGas,
    BlockLimitsLtDelta,
    BlockLimits,
    MsgForwardPrices,
    ValidatorSetList,
    ValidatorSet,
    BlockMasterConfig,
    BlockMaster,
    BlockSignaturesSignatures,
    BlockSignatures,
    Block,
    Account,
};
