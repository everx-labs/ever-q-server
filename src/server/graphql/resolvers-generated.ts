import {
    scalar,
    bigUInt1,
    bigUInt2,
    stringLowerFilter,
    resolveBigUInt,
    struct,
    array,
    join,
    joinArray,
    BigIntArgs,
    JoinArgs,
    enumName,
    stringCompanion,
    createEnumNameResolver,
    unixSecondsToString,
} from "../filter/filters";
import QBlockchainData from "../data/blockchain";
const OtherCurrency = struct({
    currency: scalar,
    value: bigUInt2,
});

const ExtBlkRef = struct({
    end_lt: bigUInt1,
    file_hash: stringLowerFilter,
    root_hash: stringLowerFilter,
    seq_no: scalar,
});

const MsgEnvelope = struct({
    cur_addr: stringLowerFilter,
    fwd_fee_remaining: bigUInt2,
    msg_id: stringLowerFilter,
    next_addr: stringLowerFilter,
});

const InMsg = struct({
    fwd_fee: bigUInt2,
    ihr_fee: bigUInt2,
    in_msg: MsgEnvelope,
    msg_id: stringLowerFilter,
    msg_type: scalar,
    msg_type_name: enumName("msg_type", { External: 0, Ihr: 1, Immediately: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6 }),
    out_msg: MsgEnvelope,
    proof_created: scalar,
    proof_delivered: scalar,
    transaction_id: stringLowerFilter,
    transit_fee: bigUInt2,
});

const OutMsg = struct({
    import_block_lt: bigUInt1,
    imported: InMsg,
    msg_env_hash: stringLowerFilter,
    msg_id: stringLowerFilter,
    msg_type: scalar,
    msg_type_name: enumName("msg_type", { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, DequeueShort: 7, None: -1 }),
    next_addr_pfx: bigUInt1,
    next_workchain: scalar,
    out_msg: MsgEnvelope,
    reimport: InMsg,
    transaction_id: stringLowerFilter,
});

const GasLimitsPrices = struct({
    block_gas_limit: bigUInt1,
    delete_due_limit: bigUInt1,
    flat_gas_limit: bigUInt1,
    flat_gas_price: bigUInt1,
    freeze_due_limit: bigUInt1,
    gas_credit: bigUInt1,
    gas_limit: bigUInt1,
    gas_price: bigUInt1,
    special_gas_limit: bigUInt1,
});

const BlockLimitsBytes = struct({
    hard_limit: scalar,
    soft_limit: scalar,
    underload: scalar,
});

const BlockLimitsGas = struct({
    hard_limit: scalar,
    soft_limit: scalar,
    underload: scalar,
});

const BlockLimitsLtDelta = struct({
    hard_limit: scalar,
    soft_limit: scalar,
    underload: scalar,
});

const BlockLimits = struct({
    bytes: BlockLimitsBytes,
    gas: BlockLimitsGas,
    lt_delta: BlockLimitsLtDelta,
});

const MsgForwardPrices = struct({
    bit_price: bigUInt1,
    cell_price: bigUInt1,
    first_frac: scalar,
    ihr_price_factor: scalar,
    lump_price: bigUInt1,
    next_frac: scalar,
});

const ValidatorSetList = struct({
    adnl_addr: scalar,
    public_key: stringLowerFilter,
    weight: bigUInt1,
});

const ValidatorSetListArray = array(() => ValidatorSetList);
const ValidatorSet = struct({
    list: ValidatorSetListArray,
    main: scalar,
    total: scalar,
    total_weight: bigUInt1,
    utime_since: scalar,
    utime_since_string: stringCompanion("utime_since"),
    utime_until: scalar,
    utime_until_string: stringCompanion("utime_until"),
});

const ConfigProposalSetup = struct({
    bit_price: scalar,
    cell_price: scalar,
    max_losses: scalar,
    max_store_sec: scalar,
    max_tot_rounds: scalar,
    min_store_sec: scalar,
    min_tot_rounds: scalar,
    min_wins: scalar,
});

const ConfigP6 = struct({
    mint_add_price: scalar,
    mint_new_price: scalar,
});

const ConfigP7 = struct({
    currency: scalar,
    value: scalar,
});

const ConfigP8 = struct({
    capabilities: bigUInt1,
    version: scalar,
});

const ConfigP11 = struct({
    critical_params: ConfigProposalSetup,
    normal_params: ConfigProposalSetup,
});

const ConfigP12 = struct({
    accept_msgs: scalar,
    active: scalar,
    actual_min_split: scalar,
    addr_len_step: scalar,
    basic: scalar,
    enabled_since: scalar,
    flags: scalar,
    max_addr_len: scalar,
    max_split: scalar,
    min_addr_len: scalar,
    min_split: scalar,
    version: scalar,
    vm_mode: scalar,
    vm_version: scalar,
    workchain_id: scalar,
    workchain_type_id: scalar,
    zerostate_file_hash: scalar,
    zerostate_root_hash: scalar,
});

const ConfigP14 = struct({
    basechain_block_fee: bigUInt2,
    masterchain_block_fee: bigUInt2,
});

const ConfigP15 = struct({
    elections_end_before: scalar,
    elections_start_before: scalar,
    stake_held_for: scalar,
    validators_elected_for: scalar,
});

const ConfigP16 = struct({
    max_main_validators: scalar,
    max_validators: scalar,
    min_validators: scalar,
});

const ConfigP17 = struct({
    max_stake: bigUInt2,
    max_stake_factor: scalar,
    min_stake: bigUInt2,
    min_total_stake: bigUInt2,
});

const ConfigP18 = struct({
    bit_price_ps: bigUInt1,
    cell_price_ps: bigUInt1,
    mc_bit_price_ps: bigUInt1,
    mc_cell_price_ps: bigUInt1,
    utime_since: scalar,
    utime_since_string: stringCompanion("utime_since"),
});

const ConfigP28 = struct({
    mc_catchain_lifetime: scalar,
    shard_catchain_lifetime: scalar,
    shard_validators_lifetime: scalar,
    shard_validators_num: scalar,
    shuffle_mc_validators: scalar,
});

const ConfigP29 = struct({
    attempt_duration: scalar,
    catchain_max_deps: scalar,
    consensus_timeout_ms: scalar,
    fast_attempts: scalar,
    max_block_bytes: scalar,
    max_collated_bytes: scalar,
    new_catchain_ids: scalar,
    next_candidate_delay_ms: scalar,
    round_candidates: scalar,
});

const ConfigP39 = struct({
    adnl_addr: scalar,
    seqno: scalar,
    signature_r: scalar,
    signature_s: scalar,
    temp_public_key: scalar,
    valid_until: scalar,
});

const FloatArray = array(() => scalar);
const ConfigP12Array = array(() => ConfigP12);
const ConfigP18Array = array(() => ConfigP18);
const StringArray = array(() => scalar);
const ConfigP39Array = array(() => ConfigP39);
const ConfigP7Array = array(() => ConfigP7);
const Config = struct({
    p0: scalar,
    p1: scalar,
    p10: FloatArray,
    p11: ConfigP11,
    p12: ConfigP12Array,
    p14: ConfigP14,
    p15: ConfigP15,
    p16: ConfigP16,
    p17: ConfigP17,
    p18: ConfigP18Array,
    p2: scalar,
    p20: GasLimitsPrices,
    p21: GasLimitsPrices,
    p22: BlockLimits,
    p23: BlockLimits,
    p24: MsgForwardPrices,
    p25: MsgForwardPrices,
    p28: ConfigP28,
    p29: ConfigP29,
    p3: scalar,
    p31: StringArray,
    p32: ValidatorSet,
    p33: ValidatorSet,
    p34: ValidatorSet,
    p35: ValidatorSet,
    p36: ValidatorSet,
    p37: ValidatorSet,
    p39: ConfigP39Array,
    p4: scalar,
    p6: ConfigP6,
    p7: ConfigP7Array,
    p8: ConfigP8,
    p9: FloatArray,
});

const TransactionStorage = struct({
    status_change: scalar,
    status_change_name: enumName("status_change", { Unchanged: 0, Frozen: 1, Deleted: 2 }),
    storage_fees_collected: bigUInt2,
    storage_fees_due: bigUInt2,
});

const OtherCurrencyArray = array(() => OtherCurrency);
const TransactionCredit = struct({
    credit: bigUInt2,
    credit_other: OtherCurrencyArray,
    due_fees_collected: bigUInt2,
});

const TransactionCompute = struct({
    account_activated: scalar,
    compute_type: scalar,
    compute_type_name: enumName("compute_type", { Skipped: 0, Vm: 1 }),
    exit_arg: scalar,
    exit_code: scalar,
    gas_credit: scalar,
    gas_fees: bigUInt2,
    gas_limit: bigUInt1,
    gas_used: bigUInt1,
    mode: scalar,
    msg_state_used: scalar,
    skipped_reason: scalar,
    skipped_reason_name: enumName("skipped_reason", { NoState: 0, BadState: 1, NoGas: 2 }),
    success: scalar,
    vm_final_state_hash: stringLowerFilter,
    vm_init_state_hash: stringLowerFilter,
    vm_steps: scalar,
});

const TransactionAction = struct({
    action_list_hash: stringLowerFilter,
    msgs_created: scalar,
    no_funds: scalar,
    result_arg: scalar,
    result_code: scalar,
    skipped_actions: scalar,
    spec_actions: scalar,
    status_change: scalar,
    status_change_name: enumName("status_change", { Unchanged: 0, Frozen: 1, Deleted: 2 }),
    success: scalar,
    tot_actions: scalar,
    total_action_fees: bigUInt2,
    total_fwd_fees: bigUInt2,
    total_msg_size_bits: scalar,
    total_msg_size_cells: scalar,
    valid: scalar,
});

const TransactionBounce = struct({
    bounce_type: scalar,
    bounce_type_name: enumName("bounce_type", { NegFunds: 0, NoFunds: 1, Ok: 2 }),
    fwd_fees: bigUInt2,
    msg_fees: bigUInt2,
    msg_size_bits: scalar,
    msg_size_cells: scalar,
    req_fwd_fees: bigUInt2,
});

const TransactionSplitInfo = struct({
    acc_split_depth: scalar,
    cur_shard_pfx_len: scalar,
    sibling_addr: stringLowerFilter,
    this_addr: stringLowerFilter,
});

const BlockValueFlow = struct({
    created: bigUInt2,
    created_other: OtherCurrencyArray,
    exported: bigUInt2,
    exported_other: OtherCurrencyArray,
    fees_collected: bigUInt2,
    fees_collected_other: OtherCurrencyArray,
    fees_imported: bigUInt2,
    fees_imported_other: OtherCurrencyArray,
    from_prev_blk: bigUInt2,
    from_prev_blk_other: OtherCurrencyArray,
    imported: bigUInt2,
    imported_other: OtherCurrencyArray,
    minted: bigUInt2,
    minted_other: OtherCurrencyArray,
    to_next_blk: bigUInt2,
    to_next_blk_other: OtherCurrencyArray,
});

const BlockAccountBlocksTransactions = struct({
    lt: bigUInt1,
    total_fees: bigUInt2,
    total_fees_other: OtherCurrencyArray,
    transaction_id: stringLowerFilter,
});

const BlockAccountBlocksTransactionsArray = array(() => BlockAccountBlocksTransactions);
const BlockAccountBlocks = struct({
    account_addr: stringLowerFilter,
    new_hash: stringLowerFilter,
    old_hash: stringLowerFilter,
    tr_count: scalar,
    transactions: BlockAccountBlocksTransactionsArray,
});

const BlockStateUpdate = struct({
    new: scalar,
    new_depth: scalar,
    new_hash: stringLowerFilter,
    old: scalar,
    old_depth: scalar,
    old_hash: stringLowerFilter,
});

const BlockMasterShardHashesDescr = struct({
    before_merge: scalar,
    before_split: scalar,
    end_lt: bigUInt1,
    fees_collected: bigUInt2,
    fees_collected_other: OtherCurrencyArray,
    file_hash: stringLowerFilter,
    flags: scalar,
    funds_created: bigUInt2,
    funds_created_other: OtherCurrencyArray,
    gen_utime: scalar,
    gen_utime_string: stringCompanion("gen_utime"),
    min_ref_mc_seqno: scalar,
    next_catchain_seqno: scalar,
    next_validator_shard: scalar,
    nx_cc_updated: scalar,
    reg_mc_seqno: scalar,
    root_hash: stringLowerFilter,
    seq_no: scalar,
    split: scalar,
    split_type: scalar,
    split_type_name: enumName("split_type", { None: 0, Split: 2, Merge: 3 }),
    start_lt: bigUInt1,
    want_merge: scalar,
    want_split: scalar,
});

const BlockMasterShardHashes = struct({
    descr: BlockMasterShardHashesDescr,
    shard: scalar,
    workchain_id: scalar,
});

const BlockMasterShardFees = struct({
    create: bigUInt2,
    create_other: OtherCurrencyArray,
    fees: bigUInt2,
    fees_other: OtherCurrencyArray,
    shard: scalar,
    workchain_id: scalar,
});

const BlockMasterPrevBlkSignatures = struct({
    node_id: stringLowerFilter,
    r: stringLowerFilter,
    s: stringLowerFilter,
});

const BlockMasterPrevBlkSignaturesArray = array(() => BlockMasterPrevBlkSignatures);
const BlockMasterShardFeesArray = array(() => BlockMasterShardFees);
const BlockMasterShardHashesArray = array(() => BlockMasterShardHashes);
const BlockMaster = struct({
    config: Config,
    config_addr: stringLowerFilter,
    max_shard_gen_utime: scalar,
    max_shard_gen_utime_string: stringCompanion("max_shard_gen_utime"),
    min_shard_gen_utime: scalar,
    min_shard_gen_utime_string: stringCompanion("min_shard_gen_utime"),
    prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
    recover_create_msg: InMsg,
    shard_fees: BlockMasterShardFeesArray,
    shard_hashes: BlockMasterShardHashesArray,
});

const BlockSignaturesSignatures = struct({
    node_id: stringLowerFilter,
    r: stringLowerFilter,
    s: stringLowerFilter,
});

const ZerostateMaster = struct({
    config: Config,
    config_addr: stringLowerFilter,
    global_balance: bigUInt2,
    global_balance_other: OtherCurrencyArray,
    validator_list_hash_short: scalar,
});

const ZerostateAccounts = struct({
    id: stringLowerFilter,
    acc_type: scalar,
    acc_type_name: enumName("acc_type", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    balance: bigUInt2,
    balance_other: OtherCurrencyArray,
    bits: bigUInt1,
    boc: scalar,
    cells: bigUInt1,
    code: scalar,
    code_hash: stringLowerFilter,
    data: scalar,
    data_hash: stringLowerFilter,
    due_payment: bigUInt2,
    last_paid: scalar,
    last_trans_lt: bigUInt1,
    library: scalar,
    library_hash: stringLowerFilter,
    proof: scalar,
    public_cells: bigUInt1,
    split_depth: scalar,
    state_hash: stringLowerFilter,
    tick: scalar,
    tock: scalar,
    workchain_id: scalar,
});

const ZerostateLibraries = struct({
    hash: stringLowerFilter,
    lib: scalar,
    publishers: StringArray,
});

const Account = struct({
    id: scalar,
    acc_type: scalar,
    acc_type_name: enumName("acc_type", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    balance: bigUInt2,
    balance_other: OtherCurrencyArray,
    bits: bigUInt1,
    boc: scalar,
    cells: bigUInt1,
    code: scalar,
    code_hash: stringLowerFilter,
    data: scalar,
    data_hash: stringLowerFilter,
    due_payment: bigUInt2,
    last_paid: scalar,
    last_trans_lt: bigUInt1,
    library: scalar,
    library_hash: stringLowerFilter,
    proof: scalar,
    public_cells: bigUInt1,
    split_depth: scalar,
    state_hash: stringLowerFilter,
    tick: scalar,
    tock: scalar,
    workchain_id: scalar,
}, true);

const Transaction = struct({
    id: scalar,
    aborted: scalar,
    account: join("account_addr", "id", "accounts", [], () => Account),
    account_addr: stringLowerFilter,
    action: TransactionAction,
    balance_delta: bigUInt2,
    balance_delta_other: OtherCurrencyArray,
    block: join("block_id", "id", "blocks", [], () => Block),
    block_id: stringLowerFilter,
    boc: scalar,
    bounce: TransactionBounce,
    chain_order: stringLowerFilter,
    compute: TransactionCompute,
    credit: TransactionCredit,
    credit_first: scalar,
    destroyed: scalar,
    end_status: scalar,
    end_status_name: enumName("end_status", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    ext_in_msg_fee: bigUInt2,
    in_message: join("in_msg", "id", "messages", ["account_addr"], () => Message),
    in_msg: stringLowerFilter,
    installed: scalar,
    lt: bigUInt1,
    new_hash: stringLowerFilter,
    now: scalar,
    now_string: stringCompanion("now"),
    old_hash: stringLowerFilter,
    orig_status: scalar,
    orig_status_name: enumName("orig_status", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
    out_messages: joinArray("out_msgs", "id", "messages", ["account_addr"], () => Message),
    out_msgs: StringArray,
    outmsg_cnt: scalar,
    prepare_transaction: stringLowerFilter,
    prev_trans_hash: stringLowerFilter,
    prev_trans_lt: bigUInt1,
    proof: scalar,
    split_info: TransactionSplitInfo,
    status: scalar,
    status_name: enumName("status", { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
    storage: TransactionStorage,
    total_fees: bigUInt2,
    total_fees_other: OtherCurrencyArray,
    tr_type: scalar,
    tr_type_name: enumName("tr_type", { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
    tt: scalar,
    workchain_id: scalar,
}, true);

const Message = struct({
    id: scalar,
    block: join("block_id", "id", "blocks", [], () => Block),
    block_id: stringLowerFilter,
    boc: scalar,
    body: scalar,
    body_hash: stringLowerFilter,
    bounce: scalar,
    bounced: scalar,
    chain_order: stringLowerFilter,
    code: scalar,
    code_hash: stringLowerFilter,
    created_at: scalar,
    created_at_string: stringCompanion("created_at"),
    created_lt: bigUInt1,
    data: scalar,
    data_hash: stringLowerFilter,
    dst: stringLowerFilter,
    dst_account: join("dst", "id", "accounts", ["msg_type"], () => Account),
    dst_transaction: join("id", "in_msg", "transactions", ["msg_type", "dst"], () => Transaction),
    dst_workchain_id: scalar,
    fwd_fee: bigUInt2,
    ihr_disabled: scalar,
    ihr_fee: bigUInt2,
    import_fee: bigUInt2,
    library: scalar,
    library_hash: stringLowerFilter,
    msg_type: scalar,
    msg_type_name: enumName("msg_type", { Internal: 0, ExtIn: 1, ExtOut: 2 }),
    proof: scalar,
    split_depth: scalar,
    src: stringLowerFilter,
    src_account: join("src", "id", "accounts", ["msg_type"], () => Account),
    src_transaction: join("id", "out_msgs[*]", "transactions", ["created_lt", "msg_type", "src"], () => Transaction),
    src_workchain_id: scalar,
    status: scalar,
    status_name: enumName("status", { Unknown: 0, Queued: 1, Processing: 2, Preliminary: 3, Proposed: 4, Finalized: 5, Refused: 6, Transiting: 7 }),
    tick: scalar,
    tock: scalar,
    value: bigUInt2,
    value_other: OtherCurrencyArray,
}, true);

const BlockAccountBlocksArray = array(() => BlockAccountBlocks);
const InMsgArray = array(() => InMsg);
const OutMsgArray = array(() => OutMsg);
const Block = struct({
    id: scalar,
    account_blocks: BlockAccountBlocksArray,
    after_merge: scalar,
    after_split: scalar,
    before_split: scalar,
    boc: scalar,
    chain_order: stringLowerFilter,
    created_by: scalar,
    end_lt: bigUInt1,
    file_hash: stringLowerFilter,
    flags: scalar,
    gen_catchain_seqno: scalar,
    gen_software_capabilities: bigUInt1,
    gen_software_version: scalar,
    gen_utime: scalar,
    gen_utime_string: stringCompanion("gen_utime"),
    gen_validator_list_hash_short: scalar,
    global_id: scalar,
    in_msg_descr: InMsgArray,
    key_block: scalar,
    master: BlockMaster,
    master_ref: ExtBlkRef,
    min_ref_mc_seqno: scalar,
    out_msg_descr: OutMsgArray,
    prev_alt_ref: ExtBlkRef,
    prev_key_block_seqno: scalar,
    prev_ref: ExtBlkRef,
    prev_vert_alt_ref: ExtBlkRef,
    prev_vert_ref: ExtBlkRef,
    rand_seed: scalar,
    seq_no: scalar,
    shard: scalar,
    signatures: join("id", "id", "blocks_signatures", [], () => BlockSignatures),
    start_lt: bigUInt1,
    state_update: BlockStateUpdate,
    status: scalar,
    status_name: enumName("status", { Unknown: 0, Proposed: 1, Finalized: 2, Refused: 3 }),
    tr_count: scalar,
    value_flow: BlockValueFlow,
    version: scalar,
    vert_seq_no: scalar,
    want_merge: scalar,
    want_split: scalar,
    workchain_id: scalar,
}, true);

const BlockSignaturesSignaturesArray = array(() => BlockSignaturesSignatures);
const BlockSignatures = struct({
    id: scalar,
    block: join("id", "id", "blocks", [], () => Block),
    catchain_seqno: scalar,
    gen_utime: scalar,
    gen_utime_string: stringCompanion("gen_utime"),
    proof: scalar,
    seq_no: scalar,
    shard: scalar,
    sig_weight: bigUInt1,
    signatures: BlockSignaturesSignaturesArray,
    validator_list_hash_short: scalar,
    workchain_id: scalar,
}, true);

const ZerostateAccountsArray = array(() => ZerostateAccounts);
const ZerostateLibrariesArray = array(() => ZerostateLibraries);
const Zerostate = struct({
    id: scalar,
    accounts: ZerostateAccountsArray,
    boc: scalar,
    file_hash: stringLowerFilter,
    global_id: scalar,
    libraries: ZerostateLibrariesArray,
    master: ZerostateMaster,
    root_hash: stringLowerFilter,
    total_balance: bigUInt2,
    total_balance_other: OtherCurrencyArray,
    workchain_id: scalar,
}, true);

function createResolvers(data: QBlockchainData) {
    return {
        OtherCurrency: {
            value(parent: { value: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.value, args);
            },
        },
        ExtBlkRef: {
            end_lt(parent: { end_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
        },
        MsgEnvelope: {
            fwd_fee_remaining(parent: { fwd_fee_remaining: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fwd_fee_remaining, args);
            },
        },
        InMsg: {
            fwd_fee(parent: { fwd_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fwd_fee, args);
            },
            ihr_fee(parent: { ihr_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.ihr_fee, args);
            },
            transit_fee(parent: { transit_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.transit_fee, args);
            },
            msg_type_name: createEnumNameResolver("msg_type", { External: 0, Ihr: 1, Immediately: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6 }),
        },
        OutMsg: {
            import_block_lt(parent: { import_block_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.import_block_lt, args);
            },
            next_addr_pfx(parent: { next_addr_pfx: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.next_addr_pfx, args);
            },
            msg_type_name: createEnumNameResolver("msg_type", { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, DequeueShort: 7, None: -1 }),
        },
        GasLimitsPrices: {
            block_gas_limit(parent: { block_gas_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.block_gas_limit, args);
            },
            delete_due_limit(parent: { delete_due_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.delete_due_limit, args);
            },
            flat_gas_limit(parent: { flat_gas_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.flat_gas_limit, args);
            },
            flat_gas_price(parent: { flat_gas_price: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.flat_gas_price, args);
            },
            freeze_due_limit(parent: { freeze_due_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.freeze_due_limit, args);
            },
            gas_credit(parent: { gas_credit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gas_credit, args);
            },
            gas_limit(parent: { gas_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gas_limit, args);
            },
            gas_price(parent: { gas_price: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gas_price, args);
            },
            special_gas_limit(parent: { special_gas_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.special_gas_limit, args);
            },
        },
        MsgForwardPrices: {
            bit_price(parent: { bit_price: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.bit_price, args);
            },
            cell_price(parent: { cell_price: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.cell_price, args);
            },
            lump_price(parent: { lump_price: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.lump_price, args);
            },
        },
        ValidatorSetList: {
            weight(parent: { weight: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.weight, args);
            },
        },
        ValidatorSet: {
            total_weight(parent: { total_weight: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.total_weight, args);
            },
            utime_since_string(parent: { utime_since: number }) {
                return unixSecondsToString(parent.utime_since);
            },
            utime_until_string(parent: { utime_until: number }) {
                return unixSecondsToString(parent.utime_until);
            },
        },
        ConfigP8: {
            capabilities(parent: { capabilities: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.capabilities, args);
            },
        },
        ConfigP14: {
            basechain_block_fee(parent: { basechain_block_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.basechain_block_fee, args);
            },
            masterchain_block_fee(parent: { masterchain_block_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.masterchain_block_fee, args);
            },
        },
        ConfigP17: {
            max_stake(parent: { max_stake: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.max_stake, args);
            },
            min_stake(parent: { min_stake: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.min_stake, args);
            },
            min_total_stake(parent: { min_total_stake: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.min_total_stake, args);
            },
        },
        ConfigP18: {
            bit_price_ps(parent: { bit_price_ps: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.bit_price_ps, args);
            },
            cell_price_ps(parent: { cell_price_ps: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.cell_price_ps, args);
            },
            mc_bit_price_ps(parent: { mc_bit_price_ps: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.mc_bit_price_ps, args);
            },
            mc_cell_price_ps(parent: { mc_cell_price_ps: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.mc_cell_price_ps, args);
            },
            utime_since_string(parent: { utime_since: number }) {
                return unixSecondsToString(parent.utime_since);
            },
        },
        TransactionStorage: {
            storage_fees_collected(parent: { storage_fees_collected: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.storage_fees_collected, args);
            },
            storage_fees_due(parent: { storage_fees_due: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.storage_fees_due, args);
            },
            status_change_name: createEnumNameResolver("status_change", { Unchanged: 0, Frozen: 1, Deleted: 2 }),
        },
        TransactionCredit: {
            credit(parent: { credit: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.credit, args);
            },
            due_fees_collected(parent: { due_fees_collected: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.due_fees_collected, args);
            },
        },
        TransactionCompute: {
            gas_fees(parent: { gas_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.gas_fees, args);
            },
            gas_limit(parent: { gas_limit: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gas_limit, args);
            },
            gas_used(parent: { gas_used: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gas_used, args);
            },
            compute_type_name: createEnumNameResolver("compute_type", { Skipped: 0, Vm: 1 }),
            skipped_reason_name: createEnumNameResolver("skipped_reason", { NoState: 0, BadState: 1, NoGas: 2 }),
        },
        TransactionAction: {
            total_action_fees(parent: { total_action_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.total_action_fees, args);
            },
            total_fwd_fees(parent: { total_fwd_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.total_fwd_fees, args);
            },
            status_change_name: createEnumNameResolver("status_change", { Unchanged: 0, Frozen: 1, Deleted: 2 }),
        },
        TransactionBounce: {
            fwd_fees(parent: { fwd_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fwd_fees, args);
            },
            msg_fees(parent: { msg_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.msg_fees, args);
            },
            req_fwd_fees(parent: { req_fwd_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.req_fwd_fees, args);
            },
            bounce_type_name: createEnumNameResolver("bounce_type", { NegFunds: 0, NoFunds: 1, Ok: 2 }),
        },
        BlockValueFlow: {
            created(parent: { created: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.created, args);
            },
            exported(parent: { exported: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.exported, args);
            },
            fees_collected(parent: { fees_collected: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fees_collected, args);
            },
            fees_imported(parent: { fees_imported: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fees_imported, args);
            },
            from_prev_blk(parent: { from_prev_blk: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.from_prev_blk, args);
            },
            imported(parent: { imported: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.imported, args);
            },
            minted(parent: { minted: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.minted, args);
            },
            to_next_blk(parent: { to_next_blk: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.to_next_blk, args);
            },
        },
        BlockAccountBlocksTransactions: {
            lt(parent: { lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.lt, args);
            },
            total_fees(parent: { total_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.total_fees, args);
            },
        },
        BlockMasterShardHashesDescr: {
            end_lt(parent: { end_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
            fees_collected(parent: { fees_collected: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fees_collected, args);
            },
            funds_created(parent: { funds_created: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.funds_created, args);
            },
            start_lt(parent: { start_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.start_lt, args);
            },
            gen_utime_string(parent: { gen_utime: number }) {
                return unixSecondsToString(parent.gen_utime);
            },
            split_type_name: createEnumNameResolver("split_type", { None: 0, Split: 2, Merge: 3 }),
        },
        BlockMasterShardFees: {
            create(parent: { create: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.create, args);
            },
            fees(parent: { fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fees, args);
            },
        },
        ZerostateMaster: {
            global_balance(parent: { global_balance: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.global_balance, args);
            },
        },
        ZerostateAccounts: {
            balance(parent: { balance: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.balance, args);
            },
            bits(parent: { bits: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.bits, args);
            },
            cells(parent: { cells: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.cells, args);
            },
            due_payment(parent: { due_payment: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.due_payment, args);
            },
            last_trans_lt(parent: { last_trans_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.last_trans_lt, args);
            },
            public_cells(parent: { public_cells: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.public_cells, args);
            },
            acc_type_name: createEnumNameResolver("acc_type", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
        },
        Account: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            balance(parent: { balance: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.balance, args);
            },
            bits(parent: { bits: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.bits, args);
            },
            cells(parent: { cells: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.cells, args);
            },
            due_payment(parent: { due_payment: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.due_payment, args);
            },
            last_trans_lt(parent: { last_trans_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.last_trans_lt, args);
            },
            public_cells(parent: { public_cells: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.public_cells, args);
            },
            acc_type_name: createEnumNameResolver("acc_type", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
        },
        Transaction: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            balance_delta(parent: { balance_delta: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.balance_delta, args);
            },
            ext_in_msg_fee(parent: { ext_in_msg_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.ext_in_msg_fee, args);
            },
            lt(parent: { lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.lt, args);
            },
            prev_trans_lt(parent: { prev_trans_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.prev_trans_lt, args);
            },
            total_fees(parent: { total_fees: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.total_fees, args);
            },
            now_string(parent: { now: number }) {
                return unixSecondsToString(parent.now);
            },
            end_status_name: createEnumNameResolver("end_status", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
            orig_status_name: createEnumNameResolver("orig_status", { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
            status_name: createEnumNameResolver("status", { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
            tr_type_name: createEnumNameResolver("tr_type", { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
        },
        Message: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            created_lt(parent: { created_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.created_lt, args);
            },
            fwd_fee(parent: { fwd_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.fwd_fee, args);
            },
            ihr_fee(parent: { ihr_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.ihr_fee, args);
            },
            import_fee(parent: { import_fee: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.import_fee, args);
            },
            value(parent: { value: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.value, args);
            },
            created_at_string(parent: { created_at: number }) {
                return unixSecondsToString(parent.created_at);
            },
            msg_type_name: createEnumNameResolver("msg_type", { Internal: 0, ExtIn: 1, ExtOut: 2 }),
            status_name: createEnumNameResolver("status", { Unknown: 0, Queued: 1, Processing: 2, Preliminary: 3, Proposed: 4, Finalized: 5, Refused: 6, Transiting: 7 }),
        },
        Block: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            end_lt(parent: { end_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.end_lt, args);
            },
            gen_software_capabilities(parent: { gen_software_capabilities: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.gen_software_capabilities, args);
            },
            start_lt(parent: { start_lt: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.start_lt, args);
            },
            gen_utime_string(parent: { gen_utime: number }) {
                return unixSecondsToString(parent.gen_utime);
            },
            status_name: createEnumNameResolver("status", { Unknown: 0, Proposed: 1, Finalized: 2, Refused: 3 }),
        },
        BlockSignatures: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            sig_weight(parent: { sig_weight: string }, args: BigIntArgs) {
                return resolveBigUInt(1, parent.sig_weight, args);
            },
            gen_utime_string(parent: { gen_utime: number }) {
                return unixSecondsToString(parent.gen_utime);
            },
        },
        Zerostate: {
            id(parent: { _key: string }) {
                return parent._key;
            },
            total_balance(parent: { total_balance: string }, args: BigIntArgs) {
                return resolveBigUInt(2, parent.total_balance, args);
            },
        },
        Query: {
            accounts: data.accounts.queryResolver(),
            transactions: data.transactions.queryResolver(),
            messages: data.messages.queryResolver(),
            blocks: data.blocks.queryResolver(),
            blocks_signatures: data.blocks_signatures.queryResolver(),
            zerostates: data.zerostates.queryResolver(),
        },
        Subscription: {
            accounts: data.accounts.subscriptionResolver(),
            transactions: data.transactions.subscriptionResolver(),
            messages: data.messages.subscriptionResolver(),
            blocks: data.blocks.subscriptionResolver(),
            blocks_signatures: data.blocks_signatures.subscriptionResolver(),
            zerostates: data.zerostates.subscriptionResolver(),
        }
    };
}

const scalarFields = new Map();
scalarFields.set("accounts.id", { type: "string", path: "doc._key" });
scalarFields.set("accounts.balance", { type: "uint1024", path: "doc.balance" });
scalarFields.set("accounts.balance_other.currency", { type: "number", path: "doc.balance_other[*].currency" });
scalarFields.set("accounts.balance_other.value", { type: "uint1024", path: "doc.balance_other[*].value" });
scalarFields.set("accounts.bits", { type: "uint64", path: "doc.bits" });
scalarFields.set("accounts.boc", { type: "string", path: "doc.boc" });
scalarFields.set("accounts.cells", { type: "uint64", path: "doc.cells" });
scalarFields.set("accounts.code", { type: "string", path: "doc.code" });
scalarFields.set("accounts.code_hash", { type: "string", path: "doc.code_hash" });
scalarFields.set("accounts.data", { type: "string", path: "doc.data" });
scalarFields.set("accounts.data_hash", { type: "string", path: "doc.data_hash" });
scalarFields.set("accounts.due_payment", { type: "uint1024", path: "doc.due_payment" });
scalarFields.set("accounts.last_paid", { type: "number", path: "doc.last_paid" });
scalarFields.set("accounts.last_trans_lt", { type: "uint64", path: "doc.last_trans_lt" });
scalarFields.set("accounts.library", { type: "string", path: "doc.library" });
scalarFields.set("accounts.library_hash", { type: "string", path: "doc.library_hash" });
scalarFields.set("accounts.proof", { type: "string", path: "doc.proof" });
scalarFields.set("accounts.public_cells", { type: "uint64", path: "doc.public_cells" });
scalarFields.set("accounts.split_depth", { type: "number", path: "doc.split_depth" });
scalarFields.set("accounts.state_hash", { type: "string", path: "doc.state_hash" });
scalarFields.set("accounts.tick", { type: "boolean", path: "doc.tick" });
scalarFields.set("accounts.tock", { type: "boolean", path: "doc.tock" });
scalarFields.set("accounts.workchain_id", { type: "number", path: "doc.workchain_id" });
scalarFields.set("transactions.id", { type: "string", path: "doc._key" });
scalarFields.set("transactions.aborted", { type: "boolean", path: "doc.aborted" });
scalarFields.set("transactions.account_addr", { type: "string", path: "doc.account_addr" });
scalarFields.set("transactions.action.action_list_hash", { type: "string", path: "doc.action.action_list_hash" });
scalarFields.set("transactions.action.msgs_created", { type: "number", path: "doc.action.msgs_created" });
scalarFields.set("transactions.action.no_funds", { type: "boolean", path: "doc.action.no_funds" });
scalarFields.set("transactions.action.result_arg", { type: "number", path: "doc.action.result_arg" });
scalarFields.set("transactions.action.result_code", { type: "number", path: "doc.action.result_code" });
scalarFields.set("transactions.action.skipped_actions", { type: "number", path: "doc.action.skipped_actions" });
scalarFields.set("transactions.action.spec_actions", { type: "number", path: "doc.action.spec_actions" });
scalarFields.set("transactions.action.success", { type: "boolean", path: "doc.action.success" });
scalarFields.set("transactions.action.tot_actions", { type: "number", path: "doc.action.tot_actions" });
scalarFields.set("transactions.action.total_action_fees", { type: "uint1024", path: "doc.action.total_action_fees" });
scalarFields.set("transactions.action.total_fwd_fees", { type: "uint1024", path: "doc.action.total_fwd_fees" });
scalarFields.set("transactions.action.total_msg_size_bits", { type: "number", path: "doc.action.total_msg_size_bits" });
scalarFields.set("transactions.action.total_msg_size_cells", { type: "number", path: "doc.action.total_msg_size_cells" });
scalarFields.set("transactions.action.valid", { type: "boolean", path: "doc.action.valid" });
scalarFields.set("transactions.balance_delta", { type: "uint1024", path: "doc.balance_delta" });
scalarFields.set("transactions.balance_delta_other.currency", { type: "number", path: "doc.balance_delta_other[*].currency" });
scalarFields.set("transactions.balance_delta_other.value", { type: "uint1024", path: "doc.balance_delta_other[*].value" });
scalarFields.set("transactions.block_id", { type: "string", path: "doc.block_id" });
scalarFields.set("transactions.boc", { type: "string", path: "doc.boc" });
scalarFields.set("transactions.bounce.fwd_fees", { type: "uint1024", path: "doc.bounce.fwd_fees" });
scalarFields.set("transactions.bounce.msg_fees", { type: "uint1024", path: "doc.bounce.msg_fees" });
scalarFields.set("transactions.bounce.msg_size_bits", { type: "number", path: "doc.bounce.msg_size_bits" });
scalarFields.set("transactions.bounce.msg_size_cells", { type: "number", path: "doc.bounce.msg_size_cells" });
scalarFields.set("transactions.bounce.req_fwd_fees", { type: "uint1024", path: "doc.bounce.req_fwd_fees" });
scalarFields.set("transactions.chain_order", { type: "string", path: "doc.chain_order" });
scalarFields.set("transactions.compute.account_activated", { type: "boolean", path: "doc.compute.account_activated" });
scalarFields.set("transactions.compute.exit_arg", { type: "number", path: "doc.compute.exit_arg" });
scalarFields.set("transactions.compute.exit_code", { type: "number", path: "doc.compute.exit_code" });
scalarFields.set("transactions.compute.gas_credit", { type: "number", path: "doc.compute.gas_credit" });
scalarFields.set("transactions.compute.gas_fees", { type: "uint1024", path: "doc.compute.gas_fees" });
scalarFields.set("transactions.compute.gas_limit", { type: "uint64", path: "doc.compute.gas_limit" });
scalarFields.set("transactions.compute.gas_used", { type: "uint64", path: "doc.compute.gas_used" });
scalarFields.set("transactions.compute.mode", { type: "number", path: "doc.compute.mode" });
scalarFields.set("transactions.compute.msg_state_used", { type: "boolean", path: "doc.compute.msg_state_used" });
scalarFields.set("transactions.compute.success", { type: "boolean", path: "doc.compute.success" });
scalarFields.set("transactions.compute.vm_final_state_hash", { type: "string", path: "doc.compute.vm_final_state_hash" });
scalarFields.set("transactions.compute.vm_init_state_hash", { type: "string", path: "doc.compute.vm_init_state_hash" });
scalarFields.set("transactions.compute.vm_steps", { type: "number", path: "doc.compute.vm_steps" });
scalarFields.set("transactions.credit.credit", { type: "uint1024", path: "doc.credit.credit" });
scalarFields.set("transactions.credit.credit_other.currency", { type: "number", path: "doc.credit.credit_other[*].currency" });
scalarFields.set("transactions.credit.credit_other.value", { type: "uint1024", path: "doc.credit.credit_other[*].value" });
scalarFields.set("transactions.credit.due_fees_collected", { type: "uint1024", path: "doc.credit.due_fees_collected" });
scalarFields.set("transactions.credit_first", { type: "boolean", path: "doc.credit_first" });
scalarFields.set("transactions.destroyed", { type: "boolean", path: "doc.destroyed" });
scalarFields.set("transactions.ext_in_msg_fee", { type: "uint1024", path: "doc.ext_in_msg_fee" });
scalarFields.set("transactions.in_msg", { type: "string", path: "doc.in_msg" });
scalarFields.set("transactions.installed", { type: "boolean", path: "doc.installed" });
scalarFields.set("transactions.lt", { type: "uint64", path: "doc.lt" });
scalarFields.set("transactions.new_hash", { type: "string", path: "doc.new_hash" });
scalarFields.set("transactions.now", { type: "number", path: "doc.now" });
scalarFields.set("transactions.old_hash", { type: "string", path: "doc.old_hash" });
scalarFields.set("transactions.out_msgs", { type: "string", path: "doc.out_msgs[*]" });
scalarFields.set("transactions.outmsg_cnt", { type: "number", path: "doc.outmsg_cnt" });
scalarFields.set("transactions.prepare_transaction", { type: "string", path: "doc.prepare_transaction" });
scalarFields.set("transactions.prev_trans_hash", { type: "string", path: "doc.prev_trans_hash" });
scalarFields.set("transactions.prev_trans_lt", { type: "uint64", path: "doc.prev_trans_lt" });
scalarFields.set("transactions.proof", { type: "string", path: "doc.proof" });
scalarFields.set("transactions.split_info.acc_split_depth", { type: "number", path: "doc.split_info.acc_split_depth" });
scalarFields.set("transactions.split_info.cur_shard_pfx_len", { type: "number", path: "doc.split_info.cur_shard_pfx_len" });
scalarFields.set("transactions.split_info.sibling_addr", { type: "string", path: "doc.split_info.sibling_addr" });
scalarFields.set("transactions.split_info.this_addr", { type: "string", path: "doc.split_info.this_addr" });
scalarFields.set("transactions.storage.storage_fees_collected", { type: "uint1024", path: "doc.storage.storage_fees_collected" });
scalarFields.set("transactions.storage.storage_fees_due", { type: "uint1024", path: "doc.storage.storage_fees_due" });
scalarFields.set("transactions.total_fees", { type: "uint1024", path: "doc.total_fees" });
scalarFields.set("transactions.total_fees_other.currency", { type: "number", path: "doc.total_fees_other[*].currency" });
scalarFields.set("transactions.total_fees_other.value", { type: "uint1024", path: "doc.total_fees_other[*].value" });
scalarFields.set("transactions.tt", { type: "string", path: "doc.tt" });
scalarFields.set("transactions.workchain_id", { type: "number", path: "doc.workchain_id" });
scalarFields.set("messages.id", { type: "string", path: "doc._key" });
scalarFields.set("messages.block_id", { type: "string", path: "doc.block_id" });
scalarFields.set("messages.boc", { type: "string", path: "doc.boc" });
scalarFields.set("messages.body", { type: "string", path: "doc.body" });
scalarFields.set("messages.body_hash", { type: "string", path: "doc.body_hash" });
scalarFields.set("messages.bounce", { type: "boolean", path: "doc.bounce" });
scalarFields.set("messages.bounced", { type: "boolean", path: "doc.bounced" });
scalarFields.set("messages.chain_order", { type: "string", path: "doc.chain_order" });
scalarFields.set("messages.code", { type: "string", path: "doc.code" });
scalarFields.set("messages.code_hash", { type: "string", path: "doc.code_hash" });
scalarFields.set("messages.created_at", { type: "number", path: "doc.created_at" });
scalarFields.set("messages.created_lt", { type: "uint64", path: "doc.created_lt" });
scalarFields.set("messages.data", { type: "string", path: "doc.data" });
scalarFields.set("messages.data_hash", { type: "string", path: "doc.data_hash" });
scalarFields.set("messages.dst", { type: "string", path: "doc.dst" });
scalarFields.set("messages.dst_workchain_id", { type: "number", path: "doc.dst_workchain_id" });
scalarFields.set("messages.fwd_fee", { type: "uint1024", path: "doc.fwd_fee" });
scalarFields.set("messages.ihr_disabled", { type: "boolean", path: "doc.ihr_disabled" });
scalarFields.set("messages.ihr_fee", { type: "uint1024", path: "doc.ihr_fee" });
scalarFields.set("messages.import_fee", { type: "uint1024", path: "doc.import_fee" });
scalarFields.set("messages.library", { type: "string", path: "doc.library" });
scalarFields.set("messages.library_hash", { type: "string", path: "doc.library_hash" });
scalarFields.set("messages.proof", { type: "string", path: "doc.proof" });
scalarFields.set("messages.split_depth", { type: "number", path: "doc.split_depth" });
scalarFields.set("messages.src", { type: "string", path: "doc.src" });
scalarFields.set("messages.src_workchain_id", { type: "number", path: "doc.src_workchain_id" });
scalarFields.set("messages.tick", { type: "boolean", path: "doc.tick" });
scalarFields.set("messages.tock", { type: "boolean", path: "doc.tock" });
scalarFields.set("messages.value", { type: "uint1024", path: "doc.value" });
scalarFields.set("messages.value_other.currency", { type: "number", path: "doc.value_other[*].currency" });
scalarFields.set("messages.value_other.value", { type: "uint1024", path: "doc.value_other[*].value" });
scalarFields.set("blocks.id", { type: "string", path: "doc._key" });
scalarFields.set("blocks.account_blocks.account_addr", { type: "string", path: "doc.account_blocks[*].account_addr" });
scalarFields.set("blocks.account_blocks.new_hash", { type: "string", path: "doc.account_blocks[*].new_hash" });
scalarFields.set("blocks.account_blocks.old_hash", { type: "string", path: "doc.account_blocks[*].old_hash" });
scalarFields.set("blocks.account_blocks.tr_count", { type: "number", path: "doc.account_blocks[*].tr_count" });
scalarFields.set("blocks.account_blocks.transactions.lt", { type: "uint64", path: "doc.account_blocks[*].transactions[**].lt" });
scalarFields.set("blocks.account_blocks.transactions.total_fees", { type: "uint1024", path: "doc.account_blocks[*].transactions[**].total_fees" });
scalarFields.set("blocks.account_blocks.transactions.total_fees_other.currency", { type: "number", path: "doc.account_blocks[*].transactions[**].total_fees_other[***].currency" });
scalarFields.set("blocks.account_blocks.transactions.total_fees_other.value", { type: "uint1024", path: "doc.account_blocks[*].transactions[**].total_fees_other[***].value" });
scalarFields.set("blocks.account_blocks.transactions.transaction_id", { type: "string", path: "doc.account_blocks[*].transactions[**].transaction_id" });
scalarFields.set("blocks.after_merge", { type: "boolean", path: "doc.after_merge" });
scalarFields.set("blocks.after_split", { type: "boolean", path: "doc.after_split" });
scalarFields.set("blocks.before_split", { type: "boolean", path: "doc.before_split" });
scalarFields.set("blocks.boc", { type: "string", path: "doc.boc" });
scalarFields.set("blocks.chain_order", { type: "string", path: "doc.chain_order" });
scalarFields.set("blocks.created_by", { type: "string", path: "doc.created_by" });
scalarFields.set("blocks.end_lt", { type: "uint64", path: "doc.end_lt" });
scalarFields.set("blocks.file_hash", { type: "string", path: "doc.file_hash" });
scalarFields.set("blocks.flags", { type: "number", path: "doc.flags" });
scalarFields.set("blocks.gen_catchain_seqno", { type: "number", path: "doc.gen_catchain_seqno" });
scalarFields.set("blocks.gen_software_capabilities", { type: "uint64", path: "doc.gen_software_capabilities" });
scalarFields.set("blocks.gen_software_version", { type: "number", path: "doc.gen_software_version" });
scalarFields.set("blocks.gen_utime", { type: "number", path: "doc.gen_utime" });
scalarFields.set("blocks.gen_validator_list_hash_short", { type: "number", path: "doc.gen_validator_list_hash_short" });
scalarFields.set("blocks.global_id", { type: "number", path: "doc.global_id" });
scalarFields.set("blocks.in_msg_descr.fwd_fee", { type: "uint1024", path: "doc.in_msg_descr[*].fwd_fee" });
scalarFields.set("blocks.in_msg_descr.ihr_fee", { type: "uint1024", path: "doc.in_msg_descr[*].ihr_fee" });
scalarFields.set("blocks.in_msg_descr.in_msg.cur_addr", { type: "string", path: "doc.in_msg_descr[*].in_msg.cur_addr" });
scalarFields.set("blocks.in_msg_descr.in_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.in_msg_descr[*].in_msg.fwd_fee_remaining" });
scalarFields.set("blocks.in_msg_descr.in_msg.msg_id", { type: "string", path: "doc.in_msg_descr[*].in_msg.msg_id" });
scalarFields.set("blocks.in_msg_descr.in_msg.next_addr", { type: "string", path: "doc.in_msg_descr[*].in_msg.next_addr" });
scalarFields.set("blocks.in_msg_descr.msg_id", { type: "string", path: "doc.in_msg_descr[*].msg_id" });
scalarFields.set("blocks.in_msg_descr.out_msg.cur_addr", { type: "string", path: "doc.in_msg_descr[*].out_msg.cur_addr" });
scalarFields.set("blocks.in_msg_descr.out_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.in_msg_descr[*].out_msg.fwd_fee_remaining" });
scalarFields.set("blocks.in_msg_descr.out_msg.msg_id", { type: "string", path: "doc.in_msg_descr[*].out_msg.msg_id" });
scalarFields.set("blocks.in_msg_descr.out_msg.next_addr", { type: "string", path: "doc.in_msg_descr[*].out_msg.next_addr" });
scalarFields.set("blocks.in_msg_descr.proof_created", { type: "string", path: "doc.in_msg_descr[*].proof_created" });
scalarFields.set("blocks.in_msg_descr.proof_delivered", { type: "string", path: "doc.in_msg_descr[*].proof_delivered" });
scalarFields.set("blocks.in_msg_descr.transaction_id", { type: "string", path: "doc.in_msg_descr[*].transaction_id" });
scalarFields.set("blocks.in_msg_descr.transit_fee", { type: "uint1024", path: "doc.in_msg_descr[*].transit_fee" });
scalarFields.set("blocks.key_block", { type: "boolean", path: "doc.key_block" });
scalarFields.set("blocks.master.config.p0", { type: "string", path: "doc.master.config.p0" });
scalarFields.set("blocks.master.config.p1", { type: "string", path: "doc.master.config.p1" });
scalarFields.set("blocks.master.config.p10", { type: "number", path: "doc.master.config.p10[*]" });
scalarFields.set("blocks.master.config.p11.critical_params.bit_price", { type: "number", path: "doc.master.config.p11.critical_params.bit_price" });
scalarFields.set("blocks.master.config.p11.critical_params.cell_price", { type: "number", path: "doc.master.config.p11.critical_params.cell_price" });
scalarFields.set("blocks.master.config.p11.critical_params.max_losses", { type: "number", path: "doc.master.config.p11.critical_params.max_losses" });
scalarFields.set("blocks.master.config.p11.critical_params.max_store_sec", { type: "number", path: "doc.master.config.p11.critical_params.max_store_sec" });
scalarFields.set("blocks.master.config.p11.critical_params.max_tot_rounds", { type: "number", path: "doc.master.config.p11.critical_params.max_tot_rounds" });
scalarFields.set("blocks.master.config.p11.critical_params.min_store_sec", { type: "number", path: "doc.master.config.p11.critical_params.min_store_sec" });
scalarFields.set("blocks.master.config.p11.critical_params.min_tot_rounds", { type: "number", path: "doc.master.config.p11.critical_params.min_tot_rounds" });
scalarFields.set("blocks.master.config.p11.critical_params.min_wins", { type: "number", path: "doc.master.config.p11.critical_params.min_wins" });
scalarFields.set("blocks.master.config.p11.normal_params.bit_price", { type: "number", path: "doc.master.config.p11.normal_params.bit_price" });
scalarFields.set("blocks.master.config.p11.normal_params.cell_price", { type: "number", path: "doc.master.config.p11.normal_params.cell_price" });
scalarFields.set("blocks.master.config.p11.normal_params.max_losses", { type: "number", path: "doc.master.config.p11.normal_params.max_losses" });
scalarFields.set("blocks.master.config.p11.normal_params.max_store_sec", { type: "number", path: "doc.master.config.p11.normal_params.max_store_sec" });
scalarFields.set("blocks.master.config.p11.normal_params.max_tot_rounds", { type: "number", path: "doc.master.config.p11.normal_params.max_tot_rounds" });
scalarFields.set("blocks.master.config.p11.normal_params.min_store_sec", { type: "number", path: "doc.master.config.p11.normal_params.min_store_sec" });
scalarFields.set("blocks.master.config.p11.normal_params.min_tot_rounds", { type: "number", path: "doc.master.config.p11.normal_params.min_tot_rounds" });
scalarFields.set("blocks.master.config.p11.normal_params.min_wins", { type: "number", path: "doc.master.config.p11.normal_params.min_wins" });
scalarFields.set("blocks.master.config.p12.accept_msgs", { type: "boolean", path: "doc.master.config.p12[*].accept_msgs" });
scalarFields.set("blocks.master.config.p12.active", { type: "boolean", path: "doc.master.config.p12[*].active" });
scalarFields.set("blocks.master.config.p12.actual_min_split", { type: "number", path: "doc.master.config.p12[*].actual_min_split" });
scalarFields.set("blocks.master.config.p12.addr_len_step", { type: "number", path: "doc.master.config.p12[*].addr_len_step" });
scalarFields.set("blocks.master.config.p12.basic", { type: "boolean", path: "doc.master.config.p12[*].basic" });
scalarFields.set("blocks.master.config.p12.enabled_since", { type: "number", path: "doc.master.config.p12[*].enabled_since" });
scalarFields.set("blocks.master.config.p12.flags", { type: "number", path: "doc.master.config.p12[*].flags" });
scalarFields.set("blocks.master.config.p12.max_addr_len", { type: "number", path: "doc.master.config.p12[*].max_addr_len" });
scalarFields.set("blocks.master.config.p12.max_split", { type: "number", path: "doc.master.config.p12[*].max_split" });
scalarFields.set("blocks.master.config.p12.min_addr_len", { type: "number", path: "doc.master.config.p12[*].min_addr_len" });
scalarFields.set("blocks.master.config.p12.min_split", { type: "number", path: "doc.master.config.p12[*].min_split" });
scalarFields.set("blocks.master.config.p12.version", { type: "number", path: "doc.master.config.p12[*].version" });
scalarFields.set("blocks.master.config.p12.vm_mode", { type: "string", path: "doc.master.config.p12[*].vm_mode" });
scalarFields.set("blocks.master.config.p12.vm_version", { type: "number", path: "doc.master.config.p12[*].vm_version" });
scalarFields.set("blocks.master.config.p12.workchain_id", { type: "number", path: "doc.master.config.p12[*].workchain_id" });
scalarFields.set("blocks.master.config.p12.workchain_type_id", { type: "number", path: "doc.master.config.p12[*].workchain_type_id" });
scalarFields.set("blocks.master.config.p12.zerostate_file_hash", { type: "string", path: "doc.master.config.p12[*].zerostate_file_hash" });
scalarFields.set("blocks.master.config.p12.zerostate_root_hash", { type: "string", path: "doc.master.config.p12[*].zerostate_root_hash" });
scalarFields.set("blocks.master.config.p14.basechain_block_fee", { type: "uint1024", path: "doc.master.config.p14.basechain_block_fee" });
scalarFields.set("blocks.master.config.p14.masterchain_block_fee", { type: "uint1024", path: "doc.master.config.p14.masterchain_block_fee" });
scalarFields.set("blocks.master.config.p15.elections_end_before", { type: "number", path: "doc.master.config.p15.elections_end_before" });
scalarFields.set("blocks.master.config.p15.elections_start_before", { type: "number", path: "doc.master.config.p15.elections_start_before" });
scalarFields.set("blocks.master.config.p15.stake_held_for", { type: "number", path: "doc.master.config.p15.stake_held_for" });
scalarFields.set("blocks.master.config.p15.validators_elected_for", { type: "number", path: "doc.master.config.p15.validators_elected_for" });
scalarFields.set("blocks.master.config.p16.max_main_validators", { type: "number", path: "doc.master.config.p16.max_main_validators" });
scalarFields.set("blocks.master.config.p16.max_validators", { type: "number", path: "doc.master.config.p16.max_validators" });
scalarFields.set("blocks.master.config.p16.min_validators", { type: "number", path: "doc.master.config.p16.min_validators" });
scalarFields.set("blocks.master.config.p17.max_stake", { type: "uint1024", path: "doc.master.config.p17.max_stake" });
scalarFields.set("blocks.master.config.p17.max_stake_factor", { type: "number", path: "doc.master.config.p17.max_stake_factor" });
scalarFields.set("blocks.master.config.p17.min_stake", { type: "uint1024", path: "doc.master.config.p17.min_stake" });
scalarFields.set("blocks.master.config.p17.min_total_stake", { type: "uint1024", path: "doc.master.config.p17.min_total_stake" });
scalarFields.set("blocks.master.config.p18.bit_price_ps", { type: "uint64", path: "doc.master.config.p18[*].bit_price_ps" });
scalarFields.set("blocks.master.config.p18.cell_price_ps", { type: "uint64", path: "doc.master.config.p18[*].cell_price_ps" });
scalarFields.set("blocks.master.config.p18.mc_bit_price_ps", { type: "uint64", path: "doc.master.config.p18[*].mc_bit_price_ps" });
scalarFields.set("blocks.master.config.p18.mc_cell_price_ps", { type: "uint64", path: "doc.master.config.p18[*].mc_cell_price_ps" });
scalarFields.set("blocks.master.config.p18.utime_since", { type: "number", path: "doc.master.config.p18[*].utime_since" });
scalarFields.set("blocks.master.config.p2", { type: "string", path: "doc.master.config.p2" });
scalarFields.set("blocks.master.config.p20.block_gas_limit", { type: "uint64", path: "doc.master.config.p20.block_gas_limit" });
scalarFields.set("blocks.master.config.p20.delete_due_limit", { type: "uint64", path: "doc.master.config.p20.delete_due_limit" });
scalarFields.set("blocks.master.config.p20.flat_gas_limit", { type: "uint64", path: "doc.master.config.p20.flat_gas_limit" });
scalarFields.set("blocks.master.config.p20.flat_gas_price", { type: "uint64", path: "doc.master.config.p20.flat_gas_price" });
scalarFields.set("blocks.master.config.p20.freeze_due_limit", { type: "uint64", path: "doc.master.config.p20.freeze_due_limit" });
scalarFields.set("blocks.master.config.p20.gas_credit", { type: "uint64", path: "doc.master.config.p20.gas_credit" });
scalarFields.set("blocks.master.config.p20.gas_limit", { type: "uint64", path: "doc.master.config.p20.gas_limit" });
scalarFields.set("blocks.master.config.p20.gas_price", { type: "uint64", path: "doc.master.config.p20.gas_price" });
scalarFields.set("blocks.master.config.p20.special_gas_limit", { type: "uint64", path: "doc.master.config.p20.special_gas_limit" });
scalarFields.set("blocks.master.config.p21.block_gas_limit", { type: "uint64", path: "doc.master.config.p21.block_gas_limit" });
scalarFields.set("blocks.master.config.p21.delete_due_limit", { type: "uint64", path: "doc.master.config.p21.delete_due_limit" });
scalarFields.set("blocks.master.config.p21.flat_gas_limit", { type: "uint64", path: "doc.master.config.p21.flat_gas_limit" });
scalarFields.set("blocks.master.config.p21.flat_gas_price", { type: "uint64", path: "doc.master.config.p21.flat_gas_price" });
scalarFields.set("blocks.master.config.p21.freeze_due_limit", { type: "uint64", path: "doc.master.config.p21.freeze_due_limit" });
scalarFields.set("blocks.master.config.p21.gas_credit", { type: "uint64", path: "doc.master.config.p21.gas_credit" });
scalarFields.set("blocks.master.config.p21.gas_limit", { type: "uint64", path: "doc.master.config.p21.gas_limit" });
scalarFields.set("blocks.master.config.p21.gas_price", { type: "uint64", path: "doc.master.config.p21.gas_price" });
scalarFields.set("blocks.master.config.p21.special_gas_limit", { type: "uint64", path: "doc.master.config.p21.special_gas_limit" });
scalarFields.set("blocks.master.config.p22.bytes.hard_limit", { type: "number", path: "doc.master.config.p22.bytes.hard_limit" });
scalarFields.set("blocks.master.config.p22.bytes.soft_limit", { type: "number", path: "doc.master.config.p22.bytes.soft_limit" });
scalarFields.set("blocks.master.config.p22.bytes.underload", { type: "number", path: "doc.master.config.p22.bytes.underload" });
scalarFields.set("blocks.master.config.p22.gas.hard_limit", { type: "number", path: "doc.master.config.p22.gas.hard_limit" });
scalarFields.set("blocks.master.config.p22.gas.soft_limit", { type: "number", path: "doc.master.config.p22.gas.soft_limit" });
scalarFields.set("blocks.master.config.p22.gas.underload", { type: "number", path: "doc.master.config.p22.gas.underload" });
scalarFields.set("blocks.master.config.p22.lt_delta.hard_limit", { type: "number", path: "doc.master.config.p22.lt_delta.hard_limit" });
scalarFields.set("blocks.master.config.p22.lt_delta.soft_limit", { type: "number", path: "doc.master.config.p22.lt_delta.soft_limit" });
scalarFields.set("blocks.master.config.p22.lt_delta.underload", { type: "number", path: "doc.master.config.p22.lt_delta.underload" });
scalarFields.set("blocks.master.config.p23.bytes.hard_limit", { type: "number", path: "doc.master.config.p23.bytes.hard_limit" });
scalarFields.set("blocks.master.config.p23.bytes.soft_limit", { type: "number", path: "doc.master.config.p23.bytes.soft_limit" });
scalarFields.set("blocks.master.config.p23.bytes.underload", { type: "number", path: "doc.master.config.p23.bytes.underload" });
scalarFields.set("blocks.master.config.p23.gas.hard_limit", { type: "number", path: "doc.master.config.p23.gas.hard_limit" });
scalarFields.set("blocks.master.config.p23.gas.soft_limit", { type: "number", path: "doc.master.config.p23.gas.soft_limit" });
scalarFields.set("blocks.master.config.p23.gas.underload", { type: "number", path: "doc.master.config.p23.gas.underload" });
scalarFields.set("blocks.master.config.p23.lt_delta.hard_limit", { type: "number", path: "doc.master.config.p23.lt_delta.hard_limit" });
scalarFields.set("blocks.master.config.p23.lt_delta.soft_limit", { type: "number", path: "doc.master.config.p23.lt_delta.soft_limit" });
scalarFields.set("blocks.master.config.p23.lt_delta.underload", { type: "number", path: "doc.master.config.p23.lt_delta.underload" });
scalarFields.set("blocks.master.config.p24.bit_price", { type: "uint64", path: "doc.master.config.p24.bit_price" });
scalarFields.set("blocks.master.config.p24.cell_price", { type: "uint64", path: "doc.master.config.p24.cell_price" });
scalarFields.set("blocks.master.config.p24.first_frac", { type: "number", path: "doc.master.config.p24.first_frac" });
scalarFields.set("blocks.master.config.p24.ihr_price_factor", { type: "number", path: "doc.master.config.p24.ihr_price_factor" });
scalarFields.set("blocks.master.config.p24.lump_price", { type: "uint64", path: "doc.master.config.p24.lump_price" });
scalarFields.set("blocks.master.config.p24.next_frac", { type: "number", path: "doc.master.config.p24.next_frac" });
scalarFields.set("blocks.master.config.p25.bit_price", { type: "uint64", path: "doc.master.config.p25.bit_price" });
scalarFields.set("blocks.master.config.p25.cell_price", { type: "uint64", path: "doc.master.config.p25.cell_price" });
scalarFields.set("blocks.master.config.p25.first_frac", { type: "number", path: "doc.master.config.p25.first_frac" });
scalarFields.set("blocks.master.config.p25.ihr_price_factor", { type: "number", path: "doc.master.config.p25.ihr_price_factor" });
scalarFields.set("blocks.master.config.p25.lump_price", { type: "uint64", path: "doc.master.config.p25.lump_price" });
scalarFields.set("blocks.master.config.p25.next_frac", { type: "number", path: "doc.master.config.p25.next_frac" });
scalarFields.set("blocks.master.config.p28.mc_catchain_lifetime", { type: "number", path: "doc.master.config.p28.mc_catchain_lifetime" });
scalarFields.set("blocks.master.config.p28.shard_catchain_lifetime", { type: "number", path: "doc.master.config.p28.shard_catchain_lifetime" });
scalarFields.set("blocks.master.config.p28.shard_validators_lifetime", { type: "number", path: "doc.master.config.p28.shard_validators_lifetime" });
scalarFields.set("blocks.master.config.p28.shard_validators_num", { type: "number", path: "doc.master.config.p28.shard_validators_num" });
scalarFields.set("blocks.master.config.p28.shuffle_mc_validators", { type: "boolean", path: "doc.master.config.p28.shuffle_mc_validators" });
scalarFields.set("blocks.master.config.p29.attempt_duration", { type: "number", path: "doc.master.config.p29.attempt_duration" });
scalarFields.set("blocks.master.config.p29.catchain_max_deps", { type: "number", path: "doc.master.config.p29.catchain_max_deps" });
scalarFields.set("blocks.master.config.p29.consensus_timeout_ms", { type: "number", path: "doc.master.config.p29.consensus_timeout_ms" });
scalarFields.set("blocks.master.config.p29.fast_attempts", { type: "number", path: "doc.master.config.p29.fast_attempts" });
scalarFields.set("blocks.master.config.p29.max_block_bytes", { type: "number", path: "doc.master.config.p29.max_block_bytes" });
scalarFields.set("blocks.master.config.p29.max_collated_bytes", { type: "number", path: "doc.master.config.p29.max_collated_bytes" });
scalarFields.set("blocks.master.config.p29.new_catchain_ids", { type: "boolean", path: "doc.master.config.p29.new_catchain_ids" });
scalarFields.set("blocks.master.config.p29.next_candidate_delay_ms", { type: "number", path: "doc.master.config.p29.next_candidate_delay_ms" });
scalarFields.set("blocks.master.config.p29.round_candidates", { type: "number", path: "doc.master.config.p29.round_candidates" });
scalarFields.set("blocks.master.config.p3", { type: "string", path: "doc.master.config.p3" });
scalarFields.set("blocks.master.config.p31", { type: "string", path: "doc.master.config.p31[*]" });
scalarFields.set("blocks.master.config.p32.list.adnl_addr", { type: "string", path: "doc.master.config.p32.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p32.list.public_key", { type: "string", path: "doc.master.config.p32.list[*].public_key" });
scalarFields.set("blocks.master.config.p32.list.weight", { type: "uint64", path: "doc.master.config.p32.list[*].weight" });
scalarFields.set("blocks.master.config.p32.main", { type: "number", path: "doc.master.config.p32.main" });
scalarFields.set("blocks.master.config.p32.total", { type: "number", path: "doc.master.config.p32.total" });
scalarFields.set("blocks.master.config.p32.total_weight", { type: "uint64", path: "doc.master.config.p32.total_weight" });
scalarFields.set("blocks.master.config.p32.utime_since", { type: "number", path: "doc.master.config.p32.utime_since" });
scalarFields.set("blocks.master.config.p32.utime_until", { type: "number", path: "doc.master.config.p32.utime_until" });
scalarFields.set("blocks.master.config.p33.list.adnl_addr", { type: "string", path: "doc.master.config.p33.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p33.list.public_key", { type: "string", path: "doc.master.config.p33.list[*].public_key" });
scalarFields.set("blocks.master.config.p33.list.weight", { type: "uint64", path: "doc.master.config.p33.list[*].weight" });
scalarFields.set("blocks.master.config.p33.main", { type: "number", path: "doc.master.config.p33.main" });
scalarFields.set("blocks.master.config.p33.total", { type: "number", path: "doc.master.config.p33.total" });
scalarFields.set("blocks.master.config.p33.total_weight", { type: "uint64", path: "doc.master.config.p33.total_weight" });
scalarFields.set("blocks.master.config.p33.utime_since", { type: "number", path: "doc.master.config.p33.utime_since" });
scalarFields.set("blocks.master.config.p33.utime_until", { type: "number", path: "doc.master.config.p33.utime_until" });
scalarFields.set("blocks.master.config.p34.list.adnl_addr", { type: "string", path: "doc.master.config.p34.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p34.list.public_key", { type: "string", path: "doc.master.config.p34.list[*].public_key" });
scalarFields.set("blocks.master.config.p34.list.weight", { type: "uint64", path: "doc.master.config.p34.list[*].weight" });
scalarFields.set("blocks.master.config.p34.main", { type: "number", path: "doc.master.config.p34.main" });
scalarFields.set("blocks.master.config.p34.total", { type: "number", path: "doc.master.config.p34.total" });
scalarFields.set("blocks.master.config.p34.total_weight", { type: "uint64", path: "doc.master.config.p34.total_weight" });
scalarFields.set("blocks.master.config.p34.utime_since", { type: "number", path: "doc.master.config.p34.utime_since" });
scalarFields.set("blocks.master.config.p34.utime_until", { type: "number", path: "doc.master.config.p34.utime_until" });
scalarFields.set("blocks.master.config.p35.list.adnl_addr", { type: "string", path: "doc.master.config.p35.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p35.list.public_key", { type: "string", path: "doc.master.config.p35.list[*].public_key" });
scalarFields.set("blocks.master.config.p35.list.weight", { type: "uint64", path: "doc.master.config.p35.list[*].weight" });
scalarFields.set("blocks.master.config.p35.main", { type: "number", path: "doc.master.config.p35.main" });
scalarFields.set("blocks.master.config.p35.total", { type: "number", path: "doc.master.config.p35.total" });
scalarFields.set("blocks.master.config.p35.total_weight", { type: "uint64", path: "doc.master.config.p35.total_weight" });
scalarFields.set("blocks.master.config.p35.utime_since", { type: "number", path: "doc.master.config.p35.utime_since" });
scalarFields.set("blocks.master.config.p35.utime_until", { type: "number", path: "doc.master.config.p35.utime_until" });
scalarFields.set("blocks.master.config.p36.list.adnl_addr", { type: "string", path: "doc.master.config.p36.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p36.list.public_key", { type: "string", path: "doc.master.config.p36.list[*].public_key" });
scalarFields.set("blocks.master.config.p36.list.weight", { type: "uint64", path: "doc.master.config.p36.list[*].weight" });
scalarFields.set("blocks.master.config.p36.main", { type: "number", path: "doc.master.config.p36.main" });
scalarFields.set("blocks.master.config.p36.total", { type: "number", path: "doc.master.config.p36.total" });
scalarFields.set("blocks.master.config.p36.total_weight", { type: "uint64", path: "doc.master.config.p36.total_weight" });
scalarFields.set("blocks.master.config.p36.utime_since", { type: "number", path: "doc.master.config.p36.utime_since" });
scalarFields.set("blocks.master.config.p36.utime_until", { type: "number", path: "doc.master.config.p36.utime_until" });
scalarFields.set("blocks.master.config.p37.list.adnl_addr", { type: "string", path: "doc.master.config.p37.list[*].adnl_addr" });
scalarFields.set("blocks.master.config.p37.list.public_key", { type: "string", path: "doc.master.config.p37.list[*].public_key" });
scalarFields.set("blocks.master.config.p37.list.weight", { type: "uint64", path: "doc.master.config.p37.list[*].weight" });
scalarFields.set("blocks.master.config.p37.main", { type: "number", path: "doc.master.config.p37.main" });
scalarFields.set("blocks.master.config.p37.total", { type: "number", path: "doc.master.config.p37.total" });
scalarFields.set("blocks.master.config.p37.total_weight", { type: "uint64", path: "doc.master.config.p37.total_weight" });
scalarFields.set("blocks.master.config.p37.utime_since", { type: "number", path: "doc.master.config.p37.utime_since" });
scalarFields.set("blocks.master.config.p37.utime_until", { type: "number", path: "doc.master.config.p37.utime_until" });
scalarFields.set("blocks.master.config.p39.adnl_addr", { type: "string", path: "doc.master.config.p39[*].adnl_addr" });
scalarFields.set("blocks.master.config.p39.seqno", { type: "number", path: "doc.master.config.p39[*].seqno" });
scalarFields.set("blocks.master.config.p39.signature_r", { type: "string", path: "doc.master.config.p39[*].signature_r" });
scalarFields.set("blocks.master.config.p39.signature_s", { type: "string", path: "doc.master.config.p39[*].signature_s" });
scalarFields.set("blocks.master.config.p39.temp_public_key", { type: "string", path: "doc.master.config.p39[*].temp_public_key" });
scalarFields.set("blocks.master.config.p39.valid_until", { type: "number", path: "doc.master.config.p39[*].valid_until" });
scalarFields.set("blocks.master.config.p4", { type: "string", path: "doc.master.config.p4" });
scalarFields.set("blocks.master.config.p6.mint_add_price", { type: "string", path: "doc.master.config.p6.mint_add_price" });
scalarFields.set("blocks.master.config.p6.mint_new_price", { type: "string", path: "doc.master.config.p6.mint_new_price" });
scalarFields.set("blocks.master.config.p7.currency", { type: "number", path: "doc.master.config.p7[*].currency" });
scalarFields.set("blocks.master.config.p7.value", { type: "string", path: "doc.master.config.p7[*].value" });
scalarFields.set("blocks.master.config.p8.capabilities", { type: "uint64", path: "doc.master.config.p8.capabilities" });
scalarFields.set("blocks.master.config.p8.version", { type: "number", path: "doc.master.config.p8.version" });
scalarFields.set("blocks.master.config.p9", { type: "number", path: "doc.master.config.p9[*]" });
scalarFields.set("blocks.master.config_addr", { type: "string", path: "doc.master.config_addr" });
scalarFields.set("blocks.master.max_shard_gen_utime", { type: "number", path: "doc.master.max_shard_gen_utime" });
scalarFields.set("blocks.master.min_shard_gen_utime", { type: "number", path: "doc.master.min_shard_gen_utime" });
scalarFields.set("blocks.master.prev_blk_signatures.node_id", { type: "string", path: "doc.master.prev_blk_signatures[*].node_id" });
scalarFields.set("blocks.master.prev_blk_signatures.r", { type: "string", path: "doc.master.prev_blk_signatures[*].r" });
scalarFields.set("blocks.master.prev_blk_signatures.s", { type: "string", path: "doc.master.prev_blk_signatures[*].s" });
scalarFields.set("blocks.master.recover_create_msg.fwd_fee", { type: "uint1024", path: "doc.master.recover_create_msg.fwd_fee" });
scalarFields.set("blocks.master.recover_create_msg.ihr_fee", { type: "uint1024", path: "doc.master.recover_create_msg.ihr_fee" });
scalarFields.set("blocks.master.recover_create_msg.in_msg.cur_addr", { type: "string", path: "doc.master.recover_create_msg.in_msg.cur_addr" });
scalarFields.set("blocks.master.recover_create_msg.in_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.master.recover_create_msg.in_msg.fwd_fee_remaining" });
scalarFields.set("blocks.master.recover_create_msg.in_msg.msg_id", { type: "string", path: "doc.master.recover_create_msg.in_msg.msg_id" });
scalarFields.set("blocks.master.recover_create_msg.in_msg.next_addr", { type: "string", path: "doc.master.recover_create_msg.in_msg.next_addr" });
scalarFields.set("blocks.master.recover_create_msg.msg_id", { type: "string", path: "doc.master.recover_create_msg.msg_id" });
scalarFields.set("blocks.master.recover_create_msg.out_msg.cur_addr", { type: "string", path: "doc.master.recover_create_msg.out_msg.cur_addr" });
scalarFields.set("blocks.master.recover_create_msg.out_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.master.recover_create_msg.out_msg.fwd_fee_remaining" });
scalarFields.set("blocks.master.recover_create_msg.out_msg.msg_id", { type: "string", path: "doc.master.recover_create_msg.out_msg.msg_id" });
scalarFields.set("blocks.master.recover_create_msg.out_msg.next_addr", { type: "string", path: "doc.master.recover_create_msg.out_msg.next_addr" });
scalarFields.set("blocks.master.recover_create_msg.proof_created", { type: "string", path: "doc.master.recover_create_msg.proof_created" });
scalarFields.set("blocks.master.recover_create_msg.proof_delivered", { type: "string", path: "doc.master.recover_create_msg.proof_delivered" });
scalarFields.set("blocks.master.recover_create_msg.transaction_id", { type: "string", path: "doc.master.recover_create_msg.transaction_id" });
scalarFields.set("blocks.master.recover_create_msg.transit_fee", { type: "uint1024", path: "doc.master.recover_create_msg.transit_fee" });
scalarFields.set("blocks.master.shard_fees.create", { type: "uint1024", path: "doc.master.shard_fees[*].create" });
scalarFields.set("blocks.master.shard_fees.create_other.currency", { type: "number", path: "doc.master.shard_fees[*].create_other[**].currency" });
scalarFields.set("blocks.master.shard_fees.create_other.value", { type: "uint1024", path: "doc.master.shard_fees[*].create_other[**].value" });
scalarFields.set("blocks.master.shard_fees.fees", { type: "uint1024", path: "doc.master.shard_fees[*].fees" });
scalarFields.set("blocks.master.shard_fees.fees_other.currency", { type: "number", path: "doc.master.shard_fees[*].fees_other[**].currency" });
scalarFields.set("blocks.master.shard_fees.fees_other.value", { type: "uint1024", path: "doc.master.shard_fees[*].fees_other[**].value" });
scalarFields.set("blocks.master.shard_fees.shard", { type: "string", path: "doc.master.shard_fees[*].shard" });
scalarFields.set("blocks.master.shard_fees.workchain_id", { type: "number", path: "doc.master.shard_fees[*].workchain_id" });
scalarFields.set("blocks.master.shard_hashes.descr.before_merge", { type: "boolean", path: "doc.master.shard_hashes[*].descr.before_merge" });
scalarFields.set("blocks.master.shard_hashes.descr.before_split", { type: "boolean", path: "doc.master.shard_hashes[*].descr.before_split" });
scalarFields.set("blocks.master.shard_hashes.descr.end_lt", { type: "uint64", path: "doc.master.shard_hashes[*].descr.end_lt" });
scalarFields.set("blocks.master.shard_hashes.descr.fees_collected", { type: "uint1024", path: "doc.master.shard_hashes[*].descr.fees_collected" });
scalarFields.set("blocks.master.shard_hashes.descr.fees_collected_other.currency", { type: "number", path: "doc.master.shard_hashes[*].descr.fees_collected_other[**].currency" });
scalarFields.set("blocks.master.shard_hashes.descr.fees_collected_other.value", { type: "uint1024", path: "doc.master.shard_hashes[*].descr.fees_collected_other[**].value" });
scalarFields.set("blocks.master.shard_hashes.descr.file_hash", { type: "string", path: "doc.master.shard_hashes[*].descr.file_hash" });
scalarFields.set("blocks.master.shard_hashes.descr.flags", { type: "number", path: "doc.master.shard_hashes[*].descr.flags" });
scalarFields.set("blocks.master.shard_hashes.descr.funds_created", { type: "uint1024", path: "doc.master.shard_hashes[*].descr.funds_created" });
scalarFields.set("blocks.master.shard_hashes.descr.funds_created_other.currency", { type: "number", path: "doc.master.shard_hashes[*].descr.funds_created_other[**].currency" });
scalarFields.set("blocks.master.shard_hashes.descr.funds_created_other.value", { type: "uint1024", path: "doc.master.shard_hashes[*].descr.funds_created_other[**].value" });
scalarFields.set("blocks.master.shard_hashes.descr.gen_utime", { type: "number", path: "doc.master.shard_hashes[*].descr.gen_utime" });
scalarFields.set("blocks.master.shard_hashes.descr.min_ref_mc_seqno", { type: "number", path: "doc.master.shard_hashes[*].descr.min_ref_mc_seqno" });
scalarFields.set("blocks.master.shard_hashes.descr.next_catchain_seqno", { type: "number", path: "doc.master.shard_hashes[*].descr.next_catchain_seqno" });
scalarFields.set("blocks.master.shard_hashes.descr.next_validator_shard", { type: "string", path: "doc.master.shard_hashes[*].descr.next_validator_shard" });
scalarFields.set("blocks.master.shard_hashes.descr.nx_cc_updated", { type: "boolean", path: "doc.master.shard_hashes[*].descr.nx_cc_updated" });
scalarFields.set("blocks.master.shard_hashes.descr.reg_mc_seqno", { type: "number", path: "doc.master.shard_hashes[*].descr.reg_mc_seqno" });
scalarFields.set("blocks.master.shard_hashes.descr.root_hash", { type: "string", path: "doc.master.shard_hashes[*].descr.root_hash" });
scalarFields.set("blocks.master.shard_hashes.descr.seq_no", { type: "number", path: "doc.master.shard_hashes[*].descr.seq_no" });
scalarFields.set("blocks.master.shard_hashes.descr.split", { type: "number", path: "doc.master.shard_hashes[*].descr.split" });
scalarFields.set("blocks.master.shard_hashes.descr.start_lt", { type: "uint64", path: "doc.master.shard_hashes[*].descr.start_lt" });
scalarFields.set("blocks.master.shard_hashes.descr.want_merge", { type: "boolean", path: "doc.master.shard_hashes[*].descr.want_merge" });
scalarFields.set("blocks.master.shard_hashes.descr.want_split", { type: "boolean", path: "doc.master.shard_hashes[*].descr.want_split" });
scalarFields.set("blocks.master.shard_hashes.shard", { type: "string", path: "doc.master.shard_hashes[*].shard" });
scalarFields.set("blocks.master.shard_hashes.workchain_id", { type: "number", path: "doc.master.shard_hashes[*].workchain_id" });
scalarFields.set("blocks.master_ref.end_lt", { type: "uint64", path: "doc.master_ref.end_lt" });
scalarFields.set("blocks.master_ref.file_hash", { type: "string", path: "doc.master_ref.file_hash" });
scalarFields.set("blocks.master_ref.root_hash", { type: "string", path: "doc.master_ref.root_hash" });
scalarFields.set("blocks.master_ref.seq_no", { type: "number", path: "doc.master_ref.seq_no" });
scalarFields.set("blocks.min_ref_mc_seqno", { type: "number", path: "doc.min_ref_mc_seqno" });
scalarFields.set("blocks.out_msg_descr.import_block_lt", { type: "uint64", path: "doc.out_msg_descr[*].import_block_lt" });
scalarFields.set("blocks.out_msg_descr.imported.fwd_fee", { type: "uint1024", path: "doc.out_msg_descr[*].imported.fwd_fee" });
scalarFields.set("blocks.out_msg_descr.imported.ihr_fee", { type: "uint1024", path: "doc.out_msg_descr[*].imported.ihr_fee" });
scalarFields.set("blocks.out_msg_descr.imported.in_msg.cur_addr", { type: "string", path: "doc.out_msg_descr[*].imported.in_msg.cur_addr" });
scalarFields.set("blocks.out_msg_descr.imported.in_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.out_msg_descr[*].imported.in_msg.fwd_fee_remaining" });
scalarFields.set("blocks.out_msg_descr.imported.in_msg.msg_id", { type: "string", path: "doc.out_msg_descr[*].imported.in_msg.msg_id" });
scalarFields.set("blocks.out_msg_descr.imported.in_msg.next_addr", { type: "string", path: "doc.out_msg_descr[*].imported.in_msg.next_addr" });
scalarFields.set("blocks.out_msg_descr.imported.msg_id", { type: "string", path: "doc.out_msg_descr[*].imported.msg_id" });
scalarFields.set("blocks.out_msg_descr.imported.out_msg.cur_addr", { type: "string", path: "doc.out_msg_descr[*].imported.out_msg.cur_addr" });
scalarFields.set("blocks.out_msg_descr.imported.out_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.out_msg_descr[*].imported.out_msg.fwd_fee_remaining" });
scalarFields.set("blocks.out_msg_descr.imported.out_msg.msg_id", { type: "string", path: "doc.out_msg_descr[*].imported.out_msg.msg_id" });
scalarFields.set("blocks.out_msg_descr.imported.out_msg.next_addr", { type: "string", path: "doc.out_msg_descr[*].imported.out_msg.next_addr" });
scalarFields.set("blocks.out_msg_descr.imported.proof_created", { type: "string", path: "doc.out_msg_descr[*].imported.proof_created" });
scalarFields.set("blocks.out_msg_descr.imported.proof_delivered", { type: "string", path: "doc.out_msg_descr[*].imported.proof_delivered" });
scalarFields.set("blocks.out_msg_descr.imported.transaction_id", { type: "string", path: "doc.out_msg_descr[*].imported.transaction_id" });
scalarFields.set("blocks.out_msg_descr.imported.transit_fee", { type: "uint1024", path: "doc.out_msg_descr[*].imported.transit_fee" });
scalarFields.set("blocks.out_msg_descr.msg_env_hash", { type: "string", path: "doc.out_msg_descr[*].msg_env_hash" });
scalarFields.set("blocks.out_msg_descr.msg_id", { type: "string", path: "doc.out_msg_descr[*].msg_id" });
scalarFields.set("blocks.out_msg_descr.next_addr_pfx", { type: "uint64", path: "doc.out_msg_descr[*].next_addr_pfx" });
scalarFields.set("blocks.out_msg_descr.next_workchain", { type: "number", path: "doc.out_msg_descr[*].next_workchain" });
scalarFields.set("blocks.out_msg_descr.out_msg.cur_addr", { type: "string", path: "doc.out_msg_descr[*].out_msg.cur_addr" });
scalarFields.set("blocks.out_msg_descr.out_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.out_msg_descr[*].out_msg.fwd_fee_remaining" });
scalarFields.set("blocks.out_msg_descr.out_msg.msg_id", { type: "string", path: "doc.out_msg_descr[*].out_msg.msg_id" });
scalarFields.set("blocks.out_msg_descr.out_msg.next_addr", { type: "string", path: "doc.out_msg_descr[*].out_msg.next_addr" });
scalarFields.set("blocks.out_msg_descr.reimport.fwd_fee", { type: "uint1024", path: "doc.out_msg_descr[*].reimport.fwd_fee" });
scalarFields.set("blocks.out_msg_descr.reimport.ihr_fee", { type: "uint1024", path: "doc.out_msg_descr[*].reimport.ihr_fee" });
scalarFields.set("blocks.out_msg_descr.reimport.in_msg.cur_addr", { type: "string", path: "doc.out_msg_descr[*].reimport.in_msg.cur_addr" });
scalarFields.set("blocks.out_msg_descr.reimport.in_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.out_msg_descr[*].reimport.in_msg.fwd_fee_remaining" });
scalarFields.set("blocks.out_msg_descr.reimport.in_msg.msg_id", { type: "string", path: "doc.out_msg_descr[*].reimport.in_msg.msg_id" });
scalarFields.set("blocks.out_msg_descr.reimport.in_msg.next_addr", { type: "string", path: "doc.out_msg_descr[*].reimport.in_msg.next_addr" });
scalarFields.set("blocks.out_msg_descr.reimport.msg_id", { type: "string", path: "doc.out_msg_descr[*].reimport.msg_id" });
scalarFields.set("blocks.out_msg_descr.reimport.out_msg.cur_addr", { type: "string", path: "doc.out_msg_descr[*].reimport.out_msg.cur_addr" });
scalarFields.set("blocks.out_msg_descr.reimport.out_msg.fwd_fee_remaining", { type: "uint1024", path: "doc.out_msg_descr[*].reimport.out_msg.fwd_fee_remaining" });
scalarFields.set("blocks.out_msg_descr.reimport.out_msg.msg_id", { type: "string", path: "doc.out_msg_descr[*].reimport.out_msg.msg_id" });
scalarFields.set("blocks.out_msg_descr.reimport.out_msg.next_addr", { type: "string", path: "doc.out_msg_descr[*].reimport.out_msg.next_addr" });
scalarFields.set("blocks.out_msg_descr.reimport.proof_created", { type: "string", path: "doc.out_msg_descr[*].reimport.proof_created" });
scalarFields.set("blocks.out_msg_descr.reimport.proof_delivered", { type: "string", path: "doc.out_msg_descr[*].reimport.proof_delivered" });
scalarFields.set("blocks.out_msg_descr.reimport.transaction_id", { type: "string", path: "doc.out_msg_descr[*].reimport.transaction_id" });
scalarFields.set("blocks.out_msg_descr.reimport.transit_fee", { type: "uint1024", path: "doc.out_msg_descr[*].reimport.transit_fee" });
scalarFields.set("blocks.out_msg_descr.transaction_id", { type: "string", path: "doc.out_msg_descr[*].transaction_id" });
scalarFields.set("blocks.prev_alt_ref.end_lt", { type: "uint64", path: "doc.prev_alt_ref.end_lt" });
scalarFields.set("blocks.prev_alt_ref.file_hash", { type: "string", path: "doc.prev_alt_ref.file_hash" });
scalarFields.set("blocks.prev_alt_ref.root_hash", { type: "string", path: "doc.prev_alt_ref.root_hash" });
scalarFields.set("blocks.prev_alt_ref.seq_no", { type: "number", path: "doc.prev_alt_ref.seq_no" });
scalarFields.set("blocks.prev_key_block_seqno", { type: "number", path: "doc.prev_key_block_seqno" });
scalarFields.set("blocks.prev_ref.end_lt", { type: "uint64", path: "doc.prev_ref.end_lt" });
scalarFields.set("blocks.prev_ref.file_hash", { type: "string", path: "doc.prev_ref.file_hash" });
scalarFields.set("blocks.prev_ref.root_hash", { type: "string", path: "doc.prev_ref.root_hash" });
scalarFields.set("blocks.prev_ref.seq_no", { type: "number", path: "doc.prev_ref.seq_no" });
scalarFields.set("blocks.prev_vert_alt_ref.end_lt", { type: "uint64", path: "doc.prev_vert_alt_ref.end_lt" });
scalarFields.set("blocks.prev_vert_alt_ref.file_hash", { type: "string", path: "doc.prev_vert_alt_ref.file_hash" });
scalarFields.set("blocks.prev_vert_alt_ref.root_hash", { type: "string", path: "doc.prev_vert_alt_ref.root_hash" });
scalarFields.set("blocks.prev_vert_alt_ref.seq_no", { type: "number", path: "doc.prev_vert_alt_ref.seq_no" });
scalarFields.set("blocks.prev_vert_ref.end_lt", { type: "uint64", path: "doc.prev_vert_ref.end_lt" });
scalarFields.set("blocks.prev_vert_ref.file_hash", { type: "string", path: "doc.prev_vert_ref.file_hash" });
scalarFields.set("blocks.prev_vert_ref.root_hash", { type: "string", path: "doc.prev_vert_ref.root_hash" });
scalarFields.set("blocks.prev_vert_ref.seq_no", { type: "number", path: "doc.prev_vert_ref.seq_no" });
scalarFields.set("blocks.rand_seed", { type: "string", path: "doc.rand_seed" });
scalarFields.set("blocks.seq_no", { type: "number", path: "doc.seq_no" });
scalarFields.set("blocks.shard", { type: "string", path: "doc.shard" });
scalarFields.set("blocks.start_lt", { type: "uint64", path: "doc.start_lt" });
scalarFields.set("blocks.state_update.new", { type: "string", path: "doc.state_update.new" });
scalarFields.set("blocks.state_update.new_depth", { type: "number", path: "doc.state_update.new_depth" });
scalarFields.set("blocks.state_update.new_hash", { type: "string", path: "doc.state_update.new_hash" });
scalarFields.set("blocks.state_update.old", { type: "string", path: "doc.state_update.old" });
scalarFields.set("blocks.state_update.old_depth", { type: "number", path: "doc.state_update.old_depth" });
scalarFields.set("blocks.state_update.old_hash", { type: "string", path: "doc.state_update.old_hash" });
scalarFields.set("blocks.tr_count", { type: "number", path: "doc.tr_count" });
scalarFields.set("blocks.value_flow.created", { type: "uint1024", path: "doc.value_flow.created" });
scalarFields.set("blocks.value_flow.created_other.currency", { type: "number", path: "doc.value_flow.created_other[*].currency" });
scalarFields.set("blocks.value_flow.created_other.value", { type: "uint1024", path: "doc.value_flow.created_other[*].value" });
scalarFields.set("blocks.value_flow.exported", { type: "uint1024", path: "doc.value_flow.exported" });
scalarFields.set("blocks.value_flow.exported_other.currency", { type: "number", path: "doc.value_flow.exported_other[*].currency" });
scalarFields.set("blocks.value_flow.exported_other.value", { type: "uint1024", path: "doc.value_flow.exported_other[*].value" });
scalarFields.set("blocks.value_flow.fees_collected", { type: "uint1024", path: "doc.value_flow.fees_collected" });
scalarFields.set("blocks.value_flow.fees_collected_other.currency", { type: "number", path: "doc.value_flow.fees_collected_other[*].currency" });
scalarFields.set("blocks.value_flow.fees_collected_other.value", { type: "uint1024", path: "doc.value_flow.fees_collected_other[*].value" });
scalarFields.set("blocks.value_flow.fees_imported", { type: "uint1024", path: "doc.value_flow.fees_imported" });
scalarFields.set("blocks.value_flow.fees_imported_other.currency", { type: "number", path: "doc.value_flow.fees_imported_other[*].currency" });
scalarFields.set("blocks.value_flow.fees_imported_other.value", { type: "uint1024", path: "doc.value_flow.fees_imported_other[*].value" });
scalarFields.set("blocks.value_flow.from_prev_blk", { type: "uint1024", path: "doc.value_flow.from_prev_blk" });
scalarFields.set("blocks.value_flow.from_prev_blk_other.currency", { type: "number", path: "doc.value_flow.from_prev_blk_other[*].currency" });
scalarFields.set("blocks.value_flow.from_prev_blk_other.value", { type: "uint1024", path: "doc.value_flow.from_prev_blk_other[*].value" });
scalarFields.set("blocks.value_flow.imported", { type: "uint1024", path: "doc.value_flow.imported" });
scalarFields.set("blocks.value_flow.imported_other.currency", { type: "number", path: "doc.value_flow.imported_other[*].currency" });
scalarFields.set("blocks.value_flow.imported_other.value", { type: "uint1024", path: "doc.value_flow.imported_other[*].value" });
scalarFields.set("blocks.value_flow.minted", { type: "uint1024", path: "doc.value_flow.minted" });
scalarFields.set("blocks.value_flow.minted_other.currency", { type: "number", path: "doc.value_flow.minted_other[*].currency" });
scalarFields.set("blocks.value_flow.minted_other.value", { type: "uint1024", path: "doc.value_flow.minted_other[*].value" });
scalarFields.set("blocks.value_flow.to_next_blk", { type: "uint1024", path: "doc.value_flow.to_next_blk" });
scalarFields.set("blocks.value_flow.to_next_blk_other.currency", { type: "number", path: "doc.value_flow.to_next_blk_other[*].currency" });
scalarFields.set("blocks.value_flow.to_next_blk_other.value", { type: "uint1024", path: "doc.value_flow.to_next_blk_other[*].value" });
scalarFields.set("blocks.version", { type: "number", path: "doc.version" });
scalarFields.set("blocks.vert_seq_no", { type: "number", path: "doc.vert_seq_no" });
scalarFields.set("blocks.want_merge", { type: "boolean", path: "doc.want_merge" });
scalarFields.set("blocks.want_split", { type: "boolean", path: "doc.want_split" });
scalarFields.set("blocks.workchain_id", { type: "number", path: "doc.workchain_id" });
scalarFields.set("blocks_signatures.id", { type: "string", path: "doc._key" });
scalarFields.set("blocks_signatures.catchain_seqno", { type: "number", path: "doc.catchain_seqno" });
scalarFields.set("blocks_signatures.gen_utime", { type: "number", path: "doc.gen_utime" });
scalarFields.set("blocks_signatures.proof", { type: "string", path: "doc.proof" });
scalarFields.set("blocks_signatures.seq_no", { type: "number", path: "doc.seq_no" });
scalarFields.set("blocks_signatures.shard", { type: "string", path: "doc.shard" });
scalarFields.set("blocks_signatures.sig_weight", { type: "uint64", path: "doc.sig_weight" });
scalarFields.set("blocks_signatures.signatures.node_id", { type: "string", path: "doc.signatures[*].node_id" });
scalarFields.set("blocks_signatures.signatures.r", { type: "string", path: "doc.signatures[*].r" });
scalarFields.set("blocks_signatures.signatures.s", { type: "string", path: "doc.signatures[*].s" });
scalarFields.set("blocks_signatures.validator_list_hash_short", { type: "number", path: "doc.validator_list_hash_short" });
scalarFields.set("blocks_signatures.workchain_id", { type: "number", path: "doc.workchain_id" });
scalarFields.set("zerostates.id", { type: "string", path: "doc._key" });
scalarFields.set("zerostates.accounts.id", { type: "string", path: "doc.accounts[*].id" });
scalarFields.set("zerostates.accounts.balance", { type: "uint1024", path: "doc.accounts[*].balance" });
scalarFields.set("zerostates.accounts.balance_other.currency", { type: "number", path: "doc.accounts[*].balance_other[**].currency" });
scalarFields.set("zerostates.accounts.balance_other.value", { type: "uint1024", path: "doc.accounts[*].balance_other[**].value" });
scalarFields.set("zerostates.accounts.bits", { type: "uint64", path: "doc.accounts[*].bits" });
scalarFields.set("zerostates.accounts.boc", { type: "string", path: "doc.accounts[*].boc" });
scalarFields.set("zerostates.accounts.cells", { type: "uint64", path: "doc.accounts[*].cells" });
scalarFields.set("zerostates.accounts.code", { type: "string", path: "doc.accounts[*].code" });
scalarFields.set("zerostates.accounts.code_hash", { type: "string", path: "doc.accounts[*].code_hash" });
scalarFields.set("zerostates.accounts.data", { type: "string", path: "doc.accounts[*].data" });
scalarFields.set("zerostates.accounts.data_hash", { type: "string", path: "doc.accounts[*].data_hash" });
scalarFields.set("zerostates.accounts.due_payment", { type: "uint1024", path: "doc.accounts[*].due_payment" });
scalarFields.set("zerostates.accounts.last_paid", { type: "number", path: "doc.accounts[*].last_paid" });
scalarFields.set("zerostates.accounts.last_trans_lt", { type: "uint64", path: "doc.accounts[*].last_trans_lt" });
scalarFields.set("zerostates.accounts.library", { type: "string", path: "doc.accounts[*].library" });
scalarFields.set("zerostates.accounts.library_hash", { type: "string", path: "doc.accounts[*].library_hash" });
scalarFields.set("zerostates.accounts.proof", { type: "string", path: "doc.accounts[*].proof" });
scalarFields.set("zerostates.accounts.public_cells", { type: "uint64", path: "doc.accounts[*].public_cells" });
scalarFields.set("zerostates.accounts.split_depth", { type: "number", path: "doc.accounts[*].split_depth" });
scalarFields.set("zerostates.accounts.state_hash", { type: "string", path: "doc.accounts[*].state_hash" });
scalarFields.set("zerostates.accounts.tick", { type: "boolean", path: "doc.accounts[*].tick" });
scalarFields.set("zerostates.accounts.tock", { type: "boolean", path: "doc.accounts[*].tock" });
scalarFields.set("zerostates.accounts.workchain_id", { type: "number", path: "doc.accounts[*].workchain_id" });
scalarFields.set("zerostates.boc", { type: "string", path: "doc.boc" });
scalarFields.set("zerostates.file_hash", { type: "string", path: "doc.file_hash" });
scalarFields.set("zerostates.global_id", { type: "number", path: "doc.global_id" });
scalarFields.set("zerostates.libraries.hash", { type: "string", path: "doc.libraries[*].hash" });
scalarFields.set("zerostates.libraries.lib", { type: "string", path: "doc.libraries[*].lib" });
scalarFields.set("zerostates.libraries.publishers", { type: "string", path: "doc.libraries[*].publishers[**]" });
scalarFields.set("zerostates.master.config.p0", { type: "string", path: "doc.master.config.p0" });
scalarFields.set("zerostates.master.config.p1", { type: "string", path: "doc.master.config.p1" });
scalarFields.set("zerostates.master.config.p10", { type: "number", path: "doc.master.config.p10[*]" });
scalarFields.set("zerostates.master.config.p11.critical_params.bit_price", { type: "number", path: "doc.master.config.p11.critical_params.bit_price" });
scalarFields.set("zerostates.master.config.p11.critical_params.cell_price", { type: "number", path: "doc.master.config.p11.critical_params.cell_price" });
scalarFields.set("zerostates.master.config.p11.critical_params.max_losses", { type: "number", path: "doc.master.config.p11.critical_params.max_losses" });
scalarFields.set("zerostates.master.config.p11.critical_params.max_store_sec", { type: "number", path: "doc.master.config.p11.critical_params.max_store_sec" });
scalarFields.set("zerostates.master.config.p11.critical_params.max_tot_rounds", { type: "number", path: "doc.master.config.p11.critical_params.max_tot_rounds" });
scalarFields.set("zerostates.master.config.p11.critical_params.min_store_sec", { type: "number", path: "doc.master.config.p11.critical_params.min_store_sec" });
scalarFields.set("zerostates.master.config.p11.critical_params.min_tot_rounds", { type: "number", path: "doc.master.config.p11.critical_params.min_tot_rounds" });
scalarFields.set("zerostates.master.config.p11.critical_params.min_wins", { type: "number", path: "doc.master.config.p11.critical_params.min_wins" });
scalarFields.set("zerostates.master.config.p11.normal_params.bit_price", { type: "number", path: "doc.master.config.p11.normal_params.bit_price" });
scalarFields.set("zerostates.master.config.p11.normal_params.cell_price", { type: "number", path: "doc.master.config.p11.normal_params.cell_price" });
scalarFields.set("zerostates.master.config.p11.normal_params.max_losses", { type: "number", path: "doc.master.config.p11.normal_params.max_losses" });
scalarFields.set("zerostates.master.config.p11.normal_params.max_store_sec", { type: "number", path: "doc.master.config.p11.normal_params.max_store_sec" });
scalarFields.set("zerostates.master.config.p11.normal_params.max_tot_rounds", { type: "number", path: "doc.master.config.p11.normal_params.max_tot_rounds" });
scalarFields.set("zerostates.master.config.p11.normal_params.min_store_sec", { type: "number", path: "doc.master.config.p11.normal_params.min_store_sec" });
scalarFields.set("zerostates.master.config.p11.normal_params.min_tot_rounds", { type: "number", path: "doc.master.config.p11.normal_params.min_tot_rounds" });
scalarFields.set("zerostates.master.config.p11.normal_params.min_wins", { type: "number", path: "doc.master.config.p11.normal_params.min_wins" });
scalarFields.set("zerostates.master.config.p12.accept_msgs", { type: "boolean", path: "doc.master.config.p12[*].accept_msgs" });
scalarFields.set("zerostates.master.config.p12.active", { type: "boolean", path: "doc.master.config.p12[*].active" });
scalarFields.set("zerostates.master.config.p12.actual_min_split", { type: "number", path: "doc.master.config.p12[*].actual_min_split" });
scalarFields.set("zerostates.master.config.p12.addr_len_step", { type: "number", path: "doc.master.config.p12[*].addr_len_step" });
scalarFields.set("zerostates.master.config.p12.basic", { type: "boolean", path: "doc.master.config.p12[*].basic" });
scalarFields.set("zerostates.master.config.p12.enabled_since", { type: "number", path: "doc.master.config.p12[*].enabled_since" });
scalarFields.set("zerostates.master.config.p12.flags", { type: "number", path: "doc.master.config.p12[*].flags" });
scalarFields.set("zerostates.master.config.p12.max_addr_len", { type: "number", path: "doc.master.config.p12[*].max_addr_len" });
scalarFields.set("zerostates.master.config.p12.max_split", { type: "number", path: "doc.master.config.p12[*].max_split" });
scalarFields.set("zerostates.master.config.p12.min_addr_len", { type: "number", path: "doc.master.config.p12[*].min_addr_len" });
scalarFields.set("zerostates.master.config.p12.min_split", { type: "number", path: "doc.master.config.p12[*].min_split" });
scalarFields.set("zerostates.master.config.p12.version", { type: "number", path: "doc.master.config.p12[*].version" });
scalarFields.set("zerostates.master.config.p12.vm_mode", { type: "string", path: "doc.master.config.p12[*].vm_mode" });
scalarFields.set("zerostates.master.config.p12.vm_version", { type: "number", path: "doc.master.config.p12[*].vm_version" });
scalarFields.set("zerostates.master.config.p12.workchain_id", { type: "number", path: "doc.master.config.p12[*].workchain_id" });
scalarFields.set("zerostates.master.config.p12.workchain_type_id", { type: "number", path: "doc.master.config.p12[*].workchain_type_id" });
scalarFields.set("zerostates.master.config.p12.zerostate_file_hash", { type: "string", path: "doc.master.config.p12[*].zerostate_file_hash" });
scalarFields.set("zerostates.master.config.p12.zerostate_root_hash", { type: "string", path: "doc.master.config.p12[*].zerostate_root_hash" });
scalarFields.set("zerostates.master.config.p14.basechain_block_fee", { type: "uint1024", path: "doc.master.config.p14.basechain_block_fee" });
scalarFields.set("zerostates.master.config.p14.masterchain_block_fee", { type: "uint1024", path: "doc.master.config.p14.masterchain_block_fee" });
scalarFields.set("zerostates.master.config.p15.elections_end_before", { type: "number", path: "doc.master.config.p15.elections_end_before" });
scalarFields.set("zerostates.master.config.p15.elections_start_before", { type: "number", path: "doc.master.config.p15.elections_start_before" });
scalarFields.set("zerostates.master.config.p15.stake_held_for", { type: "number", path: "doc.master.config.p15.stake_held_for" });
scalarFields.set("zerostates.master.config.p15.validators_elected_for", { type: "number", path: "doc.master.config.p15.validators_elected_for" });
scalarFields.set("zerostates.master.config.p16.max_main_validators", { type: "number", path: "doc.master.config.p16.max_main_validators" });
scalarFields.set("zerostates.master.config.p16.max_validators", { type: "number", path: "doc.master.config.p16.max_validators" });
scalarFields.set("zerostates.master.config.p16.min_validators", { type: "number", path: "doc.master.config.p16.min_validators" });
scalarFields.set("zerostates.master.config.p17.max_stake", { type: "uint1024", path: "doc.master.config.p17.max_stake" });
scalarFields.set("zerostates.master.config.p17.max_stake_factor", { type: "number", path: "doc.master.config.p17.max_stake_factor" });
scalarFields.set("zerostates.master.config.p17.min_stake", { type: "uint1024", path: "doc.master.config.p17.min_stake" });
scalarFields.set("zerostates.master.config.p17.min_total_stake", { type: "uint1024", path: "doc.master.config.p17.min_total_stake" });
scalarFields.set("zerostates.master.config.p18.bit_price_ps", { type: "uint64", path: "doc.master.config.p18[*].bit_price_ps" });
scalarFields.set("zerostates.master.config.p18.cell_price_ps", { type: "uint64", path: "doc.master.config.p18[*].cell_price_ps" });
scalarFields.set("zerostates.master.config.p18.mc_bit_price_ps", { type: "uint64", path: "doc.master.config.p18[*].mc_bit_price_ps" });
scalarFields.set("zerostates.master.config.p18.mc_cell_price_ps", { type: "uint64", path: "doc.master.config.p18[*].mc_cell_price_ps" });
scalarFields.set("zerostates.master.config.p18.utime_since", { type: "number", path: "doc.master.config.p18[*].utime_since" });
scalarFields.set("zerostates.master.config.p2", { type: "string", path: "doc.master.config.p2" });
scalarFields.set("zerostates.master.config.p20.block_gas_limit", { type: "uint64", path: "doc.master.config.p20.block_gas_limit" });
scalarFields.set("zerostates.master.config.p20.delete_due_limit", { type: "uint64", path: "doc.master.config.p20.delete_due_limit" });
scalarFields.set("zerostates.master.config.p20.flat_gas_limit", { type: "uint64", path: "doc.master.config.p20.flat_gas_limit" });
scalarFields.set("zerostates.master.config.p20.flat_gas_price", { type: "uint64", path: "doc.master.config.p20.flat_gas_price" });
scalarFields.set("zerostates.master.config.p20.freeze_due_limit", { type: "uint64", path: "doc.master.config.p20.freeze_due_limit" });
scalarFields.set("zerostates.master.config.p20.gas_credit", { type: "uint64", path: "doc.master.config.p20.gas_credit" });
scalarFields.set("zerostates.master.config.p20.gas_limit", { type: "uint64", path: "doc.master.config.p20.gas_limit" });
scalarFields.set("zerostates.master.config.p20.gas_price", { type: "uint64", path: "doc.master.config.p20.gas_price" });
scalarFields.set("zerostates.master.config.p20.special_gas_limit", { type: "uint64", path: "doc.master.config.p20.special_gas_limit" });
scalarFields.set("zerostates.master.config.p21.block_gas_limit", { type: "uint64", path: "doc.master.config.p21.block_gas_limit" });
scalarFields.set("zerostates.master.config.p21.delete_due_limit", { type: "uint64", path: "doc.master.config.p21.delete_due_limit" });
scalarFields.set("zerostates.master.config.p21.flat_gas_limit", { type: "uint64", path: "doc.master.config.p21.flat_gas_limit" });
scalarFields.set("zerostates.master.config.p21.flat_gas_price", { type: "uint64", path: "doc.master.config.p21.flat_gas_price" });
scalarFields.set("zerostates.master.config.p21.freeze_due_limit", { type: "uint64", path: "doc.master.config.p21.freeze_due_limit" });
scalarFields.set("zerostates.master.config.p21.gas_credit", { type: "uint64", path: "doc.master.config.p21.gas_credit" });
scalarFields.set("zerostates.master.config.p21.gas_limit", { type: "uint64", path: "doc.master.config.p21.gas_limit" });
scalarFields.set("zerostates.master.config.p21.gas_price", { type: "uint64", path: "doc.master.config.p21.gas_price" });
scalarFields.set("zerostates.master.config.p21.special_gas_limit", { type: "uint64", path: "doc.master.config.p21.special_gas_limit" });
scalarFields.set("zerostates.master.config.p22.bytes.hard_limit", { type: "number", path: "doc.master.config.p22.bytes.hard_limit" });
scalarFields.set("zerostates.master.config.p22.bytes.soft_limit", { type: "number", path: "doc.master.config.p22.bytes.soft_limit" });
scalarFields.set("zerostates.master.config.p22.bytes.underload", { type: "number", path: "doc.master.config.p22.bytes.underload" });
scalarFields.set("zerostates.master.config.p22.gas.hard_limit", { type: "number", path: "doc.master.config.p22.gas.hard_limit" });
scalarFields.set("zerostates.master.config.p22.gas.soft_limit", { type: "number", path: "doc.master.config.p22.gas.soft_limit" });
scalarFields.set("zerostates.master.config.p22.gas.underload", { type: "number", path: "doc.master.config.p22.gas.underload" });
scalarFields.set("zerostates.master.config.p22.lt_delta.hard_limit", { type: "number", path: "doc.master.config.p22.lt_delta.hard_limit" });
scalarFields.set("zerostates.master.config.p22.lt_delta.soft_limit", { type: "number", path: "doc.master.config.p22.lt_delta.soft_limit" });
scalarFields.set("zerostates.master.config.p22.lt_delta.underload", { type: "number", path: "doc.master.config.p22.lt_delta.underload" });
scalarFields.set("zerostates.master.config.p23.bytes.hard_limit", { type: "number", path: "doc.master.config.p23.bytes.hard_limit" });
scalarFields.set("zerostates.master.config.p23.bytes.soft_limit", { type: "number", path: "doc.master.config.p23.bytes.soft_limit" });
scalarFields.set("zerostates.master.config.p23.bytes.underload", { type: "number", path: "doc.master.config.p23.bytes.underload" });
scalarFields.set("zerostates.master.config.p23.gas.hard_limit", { type: "number", path: "doc.master.config.p23.gas.hard_limit" });
scalarFields.set("zerostates.master.config.p23.gas.soft_limit", { type: "number", path: "doc.master.config.p23.gas.soft_limit" });
scalarFields.set("zerostates.master.config.p23.gas.underload", { type: "number", path: "doc.master.config.p23.gas.underload" });
scalarFields.set("zerostates.master.config.p23.lt_delta.hard_limit", { type: "number", path: "doc.master.config.p23.lt_delta.hard_limit" });
scalarFields.set("zerostates.master.config.p23.lt_delta.soft_limit", { type: "number", path: "doc.master.config.p23.lt_delta.soft_limit" });
scalarFields.set("zerostates.master.config.p23.lt_delta.underload", { type: "number", path: "doc.master.config.p23.lt_delta.underload" });
scalarFields.set("zerostates.master.config.p24.bit_price", { type: "uint64", path: "doc.master.config.p24.bit_price" });
scalarFields.set("zerostates.master.config.p24.cell_price", { type: "uint64", path: "doc.master.config.p24.cell_price" });
scalarFields.set("zerostates.master.config.p24.first_frac", { type: "number", path: "doc.master.config.p24.first_frac" });
scalarFields.set("zerostates.master.config.p24.ihr_price_factor", { type: "number", path: "doc.master.config.p24.ihr_price_factor" });
scalarFields.set("zerostates.master.config.p24.lump_price", { type: "uint64", path: "doc.master.config.p24.lump_price" });
scalarFields.set("zerostates.master.config.p24.next_frac", { type: "number", path: "doc.master.config.p24.next_frac" });
scalarFields.set("zerostates.master.config.p25.bit_price", { type: "uint64", path: "doc.master.config.p25.bit_price" });
scalarFields.set("zerostates.master.config.p25.cell_price", { type: "uint64", path: "doc.master.config.p25.cell_price" });
scalarFields.set("zerostates.master.config.p25.first_frac", { type: "number", path: "doc.master.config.p25.first_frac" });
scalarFields.set("zerostates.master.config.p25.ihr_price_factor", { type: "number", path: "doc.master.config.p25.ihr_price_factor" });
scalarFields.set("zerostates.master.config.p25.lump_price", { type: "uint64", path: "doc.master.config.p25.lump_price" });
scalarFields.set("zerostates.master.config.p25.next_frac", { type: "number", path: "doc.master.config.p25.next_frac" });
scalarFields.set("zerostates.master.config.p28.mc_catchain_lifetime", { type: "number", path: "doc.master.config.p28.mc_catchain_lifetime" });
scalarFields.set("zerostates.master.config.p28.shard_catchain_lifetime", { type: "number", path: "doc.master.config.p28.shard_catchain_lifetime" });
scalarFields.set("zerostates.master.config.p28.shard_validators_lifetime", { type: "number", path: "doc.master.config.p28.shard_validators_lifetime" });
scalarFields.set("zerostates.master.config.p28.shard_validators_num", { type: "number", path: "doc.master.config.p28.shard_validators_num" });
scalarFields.set("zerostates.master.config.p28.shuffle_mc_validators", { type: "boolean", path: "doc.master.config.p28.shuffle_mc_validators" });
scalarFields.set("zerostates.master.config.p29.attempt_duration", { type: "number", path: "doc.master.config.p29.attempt_duration" });
scalarFields.set("zerostates.master.config.p29.catchain_max_deps", { type: "number", path: "doc.master.config.p29.catchain_max_deps" });
scalarFields.set("zerostates.master.config.p29.consensus_timeout_ms", { type: "number", path: "doc.master.config.p29.consensus_timeout_ms" });
scalarFields.set("zerostates.master.config.p29.fast_attempts", { type: "number", path: "doc.master.config.p29.fast_attempts" });
scalarFields.set("zerostates.master.config.p29.max_block_bytes", { type: "number", path: "doc.master.config.p29.max_block_bytes" });
scalarFields.set("zerostates.master.config.p29.max_collated_bytes", { type: "number", path: "doc.master.config.p29.max_collated_bytes" });
scalarFields.set("zerostates.master.config.p29.new_catchain_ids", { type: "boolean", path: "doc.master.config.p29.new_catchain_ids" });
scalarFields.set("zerostates.master.config.p29.next_candidate_delay_ms", { type: "number", path: "doc.master.config.p29.next_candidate_delay_ms" });
scalarFields.set("zerostates.master.config.p29.round_candidates", { type: "number", path: "doc.master.config.p29.round_candidates" });
scalarFields.set("zerostates.master.config.p3", { type: "string", path: "doc.master.config.p3" });
scalarFields.set("zerostates.master.config.p31", { type: "string", path: "doc.master.config.p31[*]" });
scalarFields.set("zerostates.master.config.p32.list.adnl_addr", { type: "string", path: "doc.master.config.p32.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p32.list.public_key", { type: "string", path: "doc.master.config.p32.list[*].public_key" });
scalarFields.set("zerostates.master.config.p32.list.weight", { type: "uint64", path: "doc.master.config.p32.list[*].weight" });
scalarFields.set("zerostates.master.config.p32.main", { type: "number", path: "doc.master.config.p32.main" });
scalarFields.set("zerostates.master.config.p32.total", { type: "number", path: "doc.master.config.p32.total" });
scalarFields.set("zerostates.master.config.p32.total_weight", { type: "uint64", path: "doc.master.config.p32.total_weight" });
scalarFields.set("zerostates.master.config.p32.utime_since", { type: "number", path: "doc.master.config.p32.utime_since" });
scalarFields.set("zerostates.master.config.p32.utime_until", { type: "number", path: "doc.master.config.p32.utime_until" });
scalarFields.set("zerostates.master.config.p33.list.adnl_addr", { type: "string", path: "doc.master.config.p33.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p33.list.public_key", { type: "string", path: "doc.master.config.p33.list[*].public_key" });
scalarFields.set("zerostates.master.config.p33.list.weight", { type: "uint64", path: "doc.master.config.p33.list[*].weight" });
scalarFields.set("zerostates.master.config.p33.main", { type: "number", path: "doc.master.config.p33.main" });
scalarFields.set("zerostates.master.config.p33.total", { type: "number", path: "doc.master.config.p33.total" });
scalarFields.set("zerostates.master.config.p33.total_weight", { type: "uint64", path: "doc.master.config.p33.total_weight" });
scalarFields.set("zerostates.master.config.p33.utime_since", { type: "number", path: "doc.master.config.p33.utime_since" });
scalarFields.set("zerostates.master.config.p33.utime_until", { type: "number", path: "doc.master.config.p33.utime_until" });
scalarFields.set("zerostates.master.config.p34.list.adnl_addr", { type: "string", path: "doc.master.config.p34.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p34.list.public_key", { type: "string", path: "doc.master.config.p34.list[*].public_key" });
scalarFields.set("zerostates.master.config.p34.list.weight", { type: "uint64", path: "doc.master.config.p34.list[*].weight" });
scalarFields.set("zerostates.master.config.p34.main", { type: "number", path: "doc.master.config.p34.main" });
scalarFields.set("zerostates.master.config.p34.total", { type: "number", path: "doc.master.config.p34.total" });
scalarFields.set("zerostates.master.config.p34.total_weight", { type: "uint64", path: "doc.master.config.p34.total_weight" });
scalarFields.set("zerostates.master.config.p34.utime_since", { type: "number", path: "doc.master.config.p34.utime_since" });
scalarFields.set("zerostates.master.config.p34.utime_until", { type: "number", path: "doc.master.config.p34.utime_until" });
scalarFields.set("zerostates.master.config.p35.list.adnl_addr", { type: "string", path: "doc.master.config.p35.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p35.list.public_key", { type: "string", path: "doc.master.config.p35.list[*].public_key" });
scalarFields.set("zerostates.master.config.p35.list.weight", { type: "uint64", path: "doc.master.config.p35.list[*].weight" });
scalarFields.set("zerostates.master.config.p35.main", { type: "number", path: "doc.master.config.p35.main" });
scalarFields.set("zerostates.master.config.p35.total", { type: "number", path: "doc.master.config.p35.total" });
scalarFields.set("zerostates.master.config.p35.total_weight", { type: "uint64", path: "doc.master.config.p35.total_weight" });
scalarFields.set("zerostates.master.config.p35.utime_since", { type: "number", path: "doc.master.config.p35.utime_since" });
scalarFields.set("zerostates.master.config.p35.utime_until", { type: "number", path: "doc.master.config.p35.utime_until" });
scalarFields.set("zerostates.master.config.p36.list.adnl_addr", { type: "string", path: "doc.master.config.p36.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p36.list.public_key", { type: "string", path: "doc.master.config.p36.list[*].public_key" });
scalarFields.set("zerostates.master.config.p36.list.weight", { type: "uint64", path: "doc.master.config.p36.list[*].weight" });
scalarFields.set("zerostates.master.config.p36.main", { type: "number", path: "doc.master.config.p36.main" });
scalarFields.set("zerostates.master.config.p36.total", { type: "number", path: "doc.master.config.p36.total" });
scalarFields.set("zerostates.master.config.p36.total_weight", { type: "uint64", path: "doc.master.config.p36.total_weight" });
scalarFields.set("zerostates.master.config.p36.utime_since", { type: "number", path: "doc.master.config.p36.utime_since" });
scalarFields.set("zerostates.master.config.p36.utime_until", { type: "number", path: "doc.master.config.p36.utime_until" });
scalarFields.set("zerostates.master.config.p37.list.adnl_addr", { type: "string", path: "doc.master.config.p37.list[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p37.list.public_key", { type: "string", path: "doc.master.config.p37.list[*].public_key" });
scalarFields.set("zerostates.master.config.p37.list.weight", { type: "uint64", path: "doc.master.config.p37.list[*].weight" });
scalarFields.set("zerostates.master.config.p37.main", { type: "number", path: "doc.master.config.p37.main" });
scalarFields.set("zerostates.master.config.p37.total", { type: "number", path: "doc.master.config.p37.total" });
scalarFields.set("zerostates.master.config.p37.total_weight", { type: "uint64", path: "doc.master.config.p37.total_weight" });
scalarFields.set("zerostates.master.config.p37.utime_since", { type: "number", path: "doc.master.config.p37.utime_since" });
scalarFields.set("zerostates.master.config.p37.utime_until", { type: "number", path: "doc.master.config.p37.utime_until" });
scalarFields.set("zerostates.master.config.p39.adnl_addr", { type: "string", path: "doc.master.config.p39[*].adnl_addr" });
scalarFields.set("zerostates.master.config.p39.seqno", { type: "number", path: "doc.master.config.p39[*].seqno" });
scalarFields.set("zerostates.master.config.p39.signature_r", { type: "string", path: "doc.master.config.p39[*].signature_r" });
scalarFields.set("zerostates.master.config.p39.signature_s", { type: "string", path: "doc.master.config.p39[*].signature_s" });
scalarFields.set("zerostates.master.config.p39.temp_public_key", { type: "string", path: "doc.master.config.p39[*].temp_public_key" });
scalarFields.set("zerostates.master.config.p39.valid_until", { type: "number", path: "doc.master.config.p39[*].valid_until" });
scalarFields.set("zerostates.master.config.p4", { type: "string", path: "doc.master.config.p4" });
scalarFields.set("zerostates.master.config.p6.mint_add_price", { type: "string", path: "doc.master.config.p6.mint_add_price" });
scalarFields.set("zerostates.master.config.p6.mint_new_price", { type: "string", path: "doc.master.config.p6.mint_new_price" });
scalarFields.set("zerostates.master.config.p7.currency", { type: "number", path: "doc.master.config.p7[*].currency" });
scalarFields.set("zerostates.master.config.p7.value", { type: "string", path: "doc.master.config.p7[*].value" });
scalarFields.set("zerostates.master.config.p8.capabilities", { type: "uint64", path: "doc.master.config.p8.capabilities" });
scalarFields.set("zerostates.master.config.p8.version", { type: "number", path: "doc.master.config.p8.version" });
scalarFields.set("zerostates.master.config.p9", { type: "number", path: "doc.master.config.p9[*]" });
scalarFields.set("zerostates.master.config_addr", { type: "string", path: "doc.master.config_addr" });
scalarFields.set("zerostates.master.global_balance", { type: "uint1024", path: "doc.master.global_balance" });
scalarFields.set("zerostates.master.global_balance_other.currency", { type: "number", path: "doc.master.global_balance_other[*].currency" });
scalarFields.set("zerostates.master.global_balance_other.value", { type: "uint1024", path: "doc.master.global_balance_other[*].value" });
scalarFields.set("zerostates.master.validator_list_hash_short", { type: "number", path: "doc.master.validator_list_hash_short" });
scalarFields.set("zerostates.root_hash", { type: "string", path: "doc.root_hash" });
scalarFields.set("zerostates.total_balance", { type: "uint1024", path: "doc.total_balance" });
scalarFields.set("zerostates.total_balance_other.currency", { type: "number", path: "doc.total_balance_other[*].currency" });
scalarFields.set("zerostates.total_balance_other.value", { type: "uint1024", path: "doc.total_balance_other[*].value" });
scalarFields.set("zerostates.workchain_id", { type: "number", path: "doc.workchain_id" });
const joinFields = new Map();
joinFields.set("transactions.account", {
    on: "account_addr",
    collection: "accounts",
    refOn: "id",
    canJoin(parent: { account_addr: string }, args: JoinArgs) {
        return (args.when === undefined || Transaction.test(null, parent, args.when));
    },
});
joinFields.set("transactions.block", {
    on: "block_id",
    collection: "blocks",
    refOn: "id",
    canJoin(parent: { block_id: string }, args: JoinArgs) {
        return (args.when === undefined || Transaction.test(null, parent, args.when));
    },
});
joinFields.set("transactions.in_message", {
    on: "in_msg",
    collection: "messages",
    refOn: "id",
    shardOn: "account_addr",
    canJoin(parent: { in_msg: string }, args: JoinArgs) {
        return (args.when === undefined || Transaction.test(null, parent, args.when));
    },
});
joinFields.set("transactions.out_messages", {
    on: "out_msgs",
    collection: "messages",
    refOn: "id",
    shardOn: "account_addr",
    canJoin(parent: { out_msgs: string[] }, args: JoinArgs) {
        return (args.when === undefined || Transaction.test(null, parent, args.when));
    },
});
joinFields.set("messages.block", {
    on: "block_id",
    collection: "blocks",
    refOn: "id",
    canJoin(parent: { block_id: string }, args: JoinArgs) {
        return (args.when === undefined || Message.test(null, parent, args.when));
    },
});
joinFields.set("messages.dst_account", {
    on: "dst",
    collection: "accounts",
    refOn: "id",
    canJoin(parent: { dst: string, msg_type: number }, args: JoinArgs) {
        if (!(parent.msg_type !== 2)) {
            return false;
        }
        return (args.when === undefined || Message.test(null, parent, args.when));
    },
});
joinFields.set("messages.dst_transaction", {
    on: "id",
    collection: "transactions",
    refOn: "in_msg",
    shardOn: "dst",
    canJoin(parent: { _key: string, msg_type: number }, args: JoinArgs) {
        if (!(parent.msg_type !== 2)) {
            return false;
        }
        return (args.when === undefined || Message.test(null, parent, args.when));
    },
});
joinFields.set("messages.src_account", {
    on: "src",
    collection: "accounts",
    refOn: "id",
    canJoin(parent: { src: string, msg_type: number }, args: JoinArgs) {
        if (!(parent.msg_type !== 1)) {
            return false;
        }
        return (args.when === undefined || Message.test(null, parent, args.when));
    },
});
joinFields.set("messages.src_transaction", {
    on: "id",
    collection: "transactions",
    refOn: "out_msgs[*]",
    shardOn: "src",
    canJoin(parent: { _key: string, created_lt: string, msg_type: number }, args: JoinArgs) {
        if (!(parent.created_lt !== "00" && parent.msg_type !== 1)) {
            return false;
        }
        return (args.when === undefined || Message.test(null, parent, args.when));
    },
});
joinFields.set("blocks.signatures", {
    on: "id",
    collection: "blocks_signatures",
    refOn: "id",
    canJoin(parent: { _key: string }, args: JoinArgs) {
        return (args.when === undefined || Block.test(null, parent, args.when));
    },
});
joinFields.set("blocks_signatures.block", {
    on: "id",
    collection: "blocks",
    refOn: "id",
    canJoin(parent: { _key: string }, args: JoinArgs) {
        return (args.when === undefined || BlockSignatures.test(null, parent, args.when));
    },
});
export {
    scalarFields,
    joinFields,
    createResolvers,
    OtherCurrency,
    ExtBlkRef,
    MsgEnvelope,
    InMsg,
    OutMsg,
    GasLimitsPrices,
    BlockLimitsBytes,
    BlockLimitsGas,
    BlockLimitsLtDelta,
    BlockLimits,
    MsgForwardPrices,
    ValidatorSetList,
    ValidatorSet,
    ConfigProposalSetup,
    ConfigP6,
    ConfigP7,
    ConfigP8,
    ConfigP11,
    ConfigP12,
    ConfigP14,
    ConfigP15,
    ConfigP16,
    ConfigP17,
    ConfigP18,
    ConfigP28,
    ConfigP29,
    ConfigP39,
    Config,
    TransactionStorage,
    TransactionCredit,
    TransactionCompute,
    TransactionAction,
    TransactionBounce,
    TransactionSplitInfo,
    BlockValueFlow,
    BlockAccountBlocksTransactions,
    BlockAccountBlocks,
    BlockStateUpdate,
    BlockMasterShardHashesDescr,
    BlockMasterShardHashes,
    BlockMasterShardFees,
    BlockMasterPrevBlkSignatures,
    BlockMaster,
    BlockSignaturesSignatures,
    ZerostateMaster,
    ZerostateAccounts,
    ZerostateLibraries,
    Account,
    Transaction,
    Message,
    Block,
    BlockSignatures,
    Zerostate,
};
