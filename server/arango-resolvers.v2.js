const { scalar, bigUInt1, bigUInt2, resolveBigUInt, struct, array, join, joinArray } = require('./arango-types.js');
const ExtBlkRef = struct({
    end_lt: bigUInt1,
    seq_no: scalar,
    root_hash: scalar,
    file_hash: scalar,
});

const MsgEnvelope = struct({
    msg: scalar,
    next_addr: scalar,
    cur_addr: scalar,
    fwd_fee_remaining_grams: bigUInt2,
});

const InMsg = struct({
    msg_type: scalar,
    msg: scalar,
    transaction: scalar,
    ihr_fee: scalar,
    proof_created: scalar,
    in_msg: MsgEnvelope,
    fwd_fee: scalar,
    out_msg: MsgEnvelope,
    transit_fee: scalar,
    transaction_id: scalar,
    proof_delivered: scalar,
});

const OutMsg = struct({
    msg_type: scalar,
    msg: scalar,
    transaction: scalar,
    out_msg: MsgEnvelope,
    reimport: InMsg,
    imported: InMsg,
    import_block_lt: bigUInt1,
});

const Message = struct({
    id: scalar,
    msg_type: scalar,
    transaction_id: scalar,
    block_id: scalar,
    body: scalar,
    status: scalar,
    split_depth: scalar,
    tick: scalar,
    tock: scalar,
    code: scalar,
    data: scalar,
    library: scalar,
    src: scalar,
    dst: scalar,
    created_lt: scalar,
    created_at: scalar,
    ihr_disabled: scalar,
    ihr_fee: scalar,
    fwd_fee: scalar,
    import_fee: scalar,
    bounce: scalar,
    bounced: scalar,
    value_grams: scalar,
}, true);

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
    start_lt: bigUInt1,
    end_lt: bigUInt1,
    shard: BlockInfoShard,
    min_ref_mc_seqno: scalar,
    master_ref: BlockInfoMasterRef,
    prev_vert_ref: BlockInfoPrevVertRef,
});

const BlockValueFlow = struct({
    to_next_blk_grams: bigUInt2,
    exported_grams: bigUInt2,
    fees_collected_grams: bigUInt2,
    created_grams: bigUInt2,
    imported_grams: bigUInt2,
    from_prev_blk_grams: bigUInt2,
    minted_grams: bigUInt2,
    fees_imported_grams: bigUInt2,
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
    id: scalar,
    status: scalar,
    global_id: scalar,
    info: BlockInfo,
    value_flow: BlockValueFlow,
    extra: BlockExtra,
    state_update: BlockStateUpdate,
}, true);

const Account = struct({
    id: scalar,
    acc_type: scalar,
    addr: scalar,
    last_paid: scalar,
    due_payment: scalar,
    last_trans_lt: scalar,
    balance_grams: scalar,
    split_depth: scalar,
    tick: scalar,
    tock: scalar,
    code: scalar,
    data: scalar,
    library: scalar,
}, true);

const TransactionStorage = struct({
    storage_fees_collected: scalar,
    storage_fees_due: scalar,
    status_change: scalar,
});

const TransactionCredit = struct({
    due_fees_collected: scalar,
    credit_grams: bigUInt1,
});

const TransactionCompute = struct({
    type: scalar,
    skipped_reason: scalar,
    success: scalar,
    msg_state_used: scalar,
    account_activated: scalar,
    gas_fees: bigUInt1,
    gas_used: bigUInt1,
    gas_limit: bigUInt1,
    gas_credit: bigUInt1,
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
    total_fwd_fees: bigUInt1,
    total_action_fees: bigUInt1,
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
    type: scalar,
    msg_size_cells: scalar,
    msg_size_bits: scalar,
    req_fwd_fees: bigUInt1,
    msg_fees: bigUInt1,
    fwd_fees: bigUInt1,
});

const TransactionSplitInfo = struct({
    cur_shard_pfx_len: scalar,
    acc_split_depth: scalar,
    this_addr: scalar,
    sibling_addr: scalar,
});

const Transaction = struct({
    id: scalar,
    tr_type: scalar,
    status: scalar,
    account_addr: scalar,
    lt: bigUInt1,
    last_trans_lt: bigUInt1,
    prev_trans_hash: scalar,
    prev_trans_lt: bigUInt1,
    now: scalar,
    outmsg_cnt: scalar,
    orig_status: scalar,
    end_status: scalar,
    in_msg: scalar,
    out_msgs: StringArray,
    total_fees: bigUInt1,
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
}, true);

function createResolvers(db) {
    return {
        ExtBlkRef: {
            end_lt(parent) {
                return resolveBigUInt(1, parent.end_lt);
            },
        },
        MsgEnvelope: {
            fwd_fee_remaining_grams(parent) {
                return resolveBigUInt(2, parent.fwd_fee_remaining_grams);
            },
        },
        OutMsg: {
            import_block_lt(parent) {
                return resolveBigUInt(1, parent.import_block_lt);
            },
        },
        Message: {
            id(parent) {
                return parent._key;
            },
        },
        BlockInfo: {
            start_lt(parent) {
                return resolveBigUInt(1, parent.start_lt);
            },
            end_lt(parent) {
                return resolveBigUInt(1, parent.end_lt);
            },
        },
        BlockValueFlow: {
            to_next_blk_grams(parent) {
                return resolveBigUInt(2, parent.to_next_blk_grams);
            },
            exported_grams(parent) {
                return resolveBigUInt(2, parent.exported_grams);
            },
            fees_collected_grams(parent) {
                return resolveBigUInt(2, parent.fees_collected_grams);
            },
            created_grams(parent) {
                return resolveBigUInt(2, parent.created_grams);
            },
            imported_grams(parent) {
                return resolveBigUInt(2, parent.imported_grams);
            },
            from_prev_blk_grams(parent) {
                return resolveBigUInt(2, parent.from_prev_blk_grams);
            },
            minted_grams(parent) {
                return resolveBigUInt(2, parent.minted_grams);
            },
            fees_imported_grams(parent) {
                return resolveBigUInt(2, parent.fees_imported_grams);
            },
        },
        Block: {
            id(parent) {
                return parent._key;
            },
        },
        Account: {
            id(parent) {
                return parent._key;
            },
        },
        TransactionCredit: {
            credit_grams(parent) {
                return resolveBigUInt(1, parent.credit_grams);
            },
        },
        TransactionCompute: {
            gas_fees(parent) {
                return resolveBigUInt(1, parent.gas_fees);
            },
            gas_used(parent) {
                return resolveBigUInt(1, parent.gas_used);
            },
            gas_limit(parent) {
                return resolveBigUInt(1, parent.gas_limit);
            },
            gas_credit(parent) {
                return resolveBigUInt(1, parent.gas_credit);
            },
        },
        TransactionAction: {
            total_fwd_fees(parent) {
                return resolveBigUInt(1, parent.total_fwd_fees);
            },
            total_action_fees(parent) {
                return resolveBigUInt(1, parent.total_action_fees);
            },
        },
        TransactionBounce: {
            req_fwd_fees(parent) {
                return resolveBigUInt(1, parent.req_fwd_fees);
            },
            msg_fees(parent) {
                return resolveBigUInt(1, parent.msg_fees);
            },
            fwd_fees(parent) {
                return resolveBigUInt(1, parent.fwd_fees);
            },
        },
        Transaction: {
            id(parent) {
                return parent._key;
            },
            lt(parent) {
                return resolveBigUInt(1, parent.lt);
            },
            last_trans_lt(parent) {
                return resolveBigUInt(1, parent.last_trans_lt);
            },
            prev_trans_lt(parent) {
                return resolveBigUInt(1, parent.prev_trans_lt);
            },
            total_fees(parent) {
                return resolveBigUInt(1, parent.total_fees);
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
    createResolvers,
    ExtBlkRef,
    MsgEnvelope,
    InMsg,
    OutMsg,
    Message,
    BlockInfoPrevRefPrev,
    BlockInfoPrevRef,
    BlockInfoShard,
    BlockInfoMasterRef,
    BlockInfoPrevVertRef,
    BlockInfo,
    BlockValueFlow,
    BlockExtraAccountBlocksStateUpdate,
    BlockExtraAccountBlocks,
    BlockExtra,
    BlockStateUpdate,
    Block,
    Account,
    TransactionStorage,
    TransactionCredit,
    TransactionCompute,
    TransactionAction,
    TransactionBounce,
    TransactionSplitInfo,
    Transaction,
};
