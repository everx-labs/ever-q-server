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
    fwd_fee_remaining: bigUInt2,
});

const InMsg = struct({
    msg_type: scalar,
    msg: scalar,
    transaction: scalar,
    ihr_fee: bigUInt2,
    proof_created: scalar,
    in_msg: MsgEnvelope,
    fwd_fee: bigUInt2,
    out_msg: MsgEnvelope,
    transit_fee: bigUInt2,
    transaction_id: bigUInt1,
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

const MessageValueOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const MessageValueOtherArray = array(MessageValueOther);
const MessageValue = struct({
    grams: bigUInt2,
    other: MessageValueOtherArray,
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
    created_lt: bigUInt1,
    created_at: scalar,
    ihr_disabled: scalar,
    ihr_fee: bigUInt2,
    fwd_fee: bigUInt2,
    import_fee: bigUInt2,
    bounce: scalar,
    bounced: scalar,
    value: MessageValue,
}, true);

const BlockShard = struct({
    shard_pfx_bits: scalar,
    workchain_id: scalar,
    shard_prefix: bigUInt1,
});

const BlockValueFlowToNextBlkOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowToNextBlkOtherArray = array(BlockValueFlowToNextBlkOther);
const BlockValueFlowToNextBlk = struct({
    grams: bigUInt2,
    other: BlockValueFlowToNextBlkOtherArray,
});

const BlockValueFlowExportedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowExportedOtherArray = array(BlockValueFlowExportedOther);
const BlockValueFlowExported = struct({
    grams: bigUInt2,
    other: BlockValueFlowExportedOtherArray,
});

const BlockValueFlowFeesCollectedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowFeesCollectedOtherArray = array(BlockValueFlowFeesCollectedOther);
const BlockValueFlowFeesCollected = struct({
    grams: bigUInt2,
    other: BlockValueFlowFeesCollectedOtherArray,
});

const BlockValueFlowCreatedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowCreatedOtherArray = array(BlockValueFlowCreatedOther);
const BlockValueFlowCreated = struct({
    grams: bigUInt2,
    other: BlockValueFlowCreatedOtherArray,
});

const BlockValueFlowImportedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowImportedOtherArray = array(BlockValueFlowImportedOther);
const BlockValueFlowImported = struct({
    grams: bigUInt2,
    other: BlockValueFlowImportedOtherArray,
});

const BlockValueFlowFromPrevBlkOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowFromPrevBlkOtherArray = array(BlockValueFlowFromPrevBlkOther);
const BlockValueFlowFromPrevBlk = struct({
    grams: bigUInt2,
    other: BlockValueFlowFromPrevBlkOtherArray,
});

const BlockValueFlowMintedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowMintedOtherArray = array(BlockValueFlowMintedOther);
const BlockValueFlowMinted = struct({
    grams: bigUInt2,
    other: BlockValueFlowMintedOtherArray,
});

const BlockValueFlowFeesImportedOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const BlockValueFlowFeesImportedOtherArray = array(BlockValueFlowFeesImportedOther);
const BlockValueFlowFeesImported = struct({
    grams: bigUInt2,
    other: BlockValueFlowFeesImportedOtherArray,
});

const BlockValueFlow = struct({
    to_next_blk: BlockValueFlowToNextBlk,
    exported: BlockValueFlowExported,
    fees_collected: BlockValueFlowFeesCollected,
    created: BlockValueFlowCreated,
    imported: BlockValueFlowImported,
    from_prev_blk: BlockValueFlowFromPrevBlk,
    minted: BlockValueFlowMinted,
    fees_imported: BlockValueFlowFeesImported,
});

const BlockAccountBlocksStateUpdate = struct({
    old_hash: scalar,
    new_hash: scalar,
});

const StringArray = array(String);
const BlockAccountBlocks = struct({
    account_addr: scalar,
    transactions: StringArray,
    state_update: BlockAccountBlocksStateUpdate,
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

const InMsgArray = array(InMsg);
const OutMsgArray = array(OutMsg);
const BlockAccountBlocksArray = array(BlockAccountBlocks);
const Block = struct({
    id: scalar,
    status: scalar,
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
    shard: BlockShard,
    min_ref_mc_seqno: scalar,
    value_flow: BlockValueFlow,
    in_msg_descr: InMsgArray,
    rand_seed: scalar,
    out_msg_descr: OutMsgArray,
    account_blocks: BlockAccountBlocksArray,
    state_update: BlockStateUpdate,
}, true);

const AccountBalanceOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const AccountBalanceOtherArray = array(AccountBalanceOther);
const AccountBalance = struct({
    grams: bigUInt2,
    other: AccountBalanceOtherArray,
});

const Account = struct({
    id: scalar,
    acc_type: scalar,
    last_paid: scalar,
    due_payment: bigUInt2,
    last_trans_lt: bigUInt1,
    balance: AccountBalance,
    split_depth: scalar,
    tick: scalar,
    tock: scalar,
    code: scalar,
    data: scalar,
    library: scalar,
}, true);

const TransactionTotalFeesOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const TransactionTotalFeesOtherArray = array(TransactionTotalFeesOther);
const TransactionTotalFees = struct({
    grams: bigUInt2,
    other: TransactionTotalFeesOtherArray,
});

const TransactionStorage = struct({
    storage_fees_collected: bigUInt2,
    storage_fees_due: bigUInt2,
    status_change: scalar,
});

const TransactionCreditCreditOther = struct({
    currency: scalar,
    value: bigUInt2,
});

const TransactionCreditCreditOtherArray = array(TransactionCreditCreditOther);
const TransactionCreditCredit = struct({
    grams: bigUInt2,
    other: TransactionCreditCreditOtherArray,
});

const TransactionCredit = struct({
    due_fees_collected: bigUInt2,
    credit: TransactionCreditCredit,
});

const TransactionCompute = struct({
    compute_type: scalar,
    skipped_reason: scalar,
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

const Transaction = struct({
    id: scalar,
    tr_type: scalar,
    status: scalar,
    block_id: scalar,
    account_addr: scalar,
    lt: bigUInt1,
    prev_trans_hash: scalar,
    prev_trans_lt: bigUInt1,
    now: scalar,
    outmsg_cnt: scalar,
    orig_status: scalar,
    end_status: scalar,
    in_msg: scalar,
    out_msgs: StringArray,
    total_fees: TransactionTotalFees,
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
            fwd_fee_remaining(parent) {
                return resolveBigUInt(2, parent.fwd_fee_remaining);
            },
        },
        InMsg: {
            ihr_fee(parent) {
                return resolveBigUInt(2, parent.ihr_fee);
            },
            fwd_fee(parent) {
                return resolveBigUInt(2, parent.fwd_fee);
            },
            transit_fee(parent) {
                return resolveBigUInt(2, parent.transit_fee);
            },
            transaction_id(parent) {
                return resolveBigUInt(1, parent.transaction_id);
            },
        },
        OutMsg: {
            import_block_lt(parent) {
                return resolveBigUInt(1, parent.import_block_lt);
            },
        },
        MessageValueOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        MessageValue: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        Message: {
            id(parent) {
                return parent._key;
            },
            created_lt(parent) {
                return resolveBigUInt(1, parent.created_lt);
            },
            ihr_fee(parent) {
                return resolveBigUInt(2, parent.ihr_fee);
            },
            fwd_fee(parent) {
                return resolveBigUInt(2, parent.fwd_fee);
            },
            import_fee(parent) {
                return resolveBigUInt(2, parent.import_fee);
            },
        },
        BlockShard: {
            shard_prefix(parent) {
                return resolveBigUInt(1, parent.shard_prefix);
            },
        },
        BlockValueFlowToNextBlkOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowToNextBlk: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowExportedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowExported: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowFeesCollectedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowFeesCollected: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowCreatedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowCreated: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowImportedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowImported: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowFromPrevBlkOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowFromPrevBlk: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowMintedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowMinted: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        BlockValueFlowFeesImportedOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        BlockValueFlowFeesImported: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        Block: {
            id(parent) {
                return parent._key;
            },
            start_lt(parent) {
                return resolveBigUInt(1, parent.start_lt);
            },
            end_lt(parent) {
                return resolveBigUInt(1, parent.end_lt);
            },
        },
        AccountBalanceOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        AccountBalance: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        Account: {
            id(parent) {
                return parent._key;
            },
            due_payment(parent) {
                return resolveBigUInt(2, parent.due_payment);
            },
            last_trans_lt(parent) {
                return resolveBigUInt(1, parent.last_trans_lt);
            },
        },
        TransactionTotalFeesOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        TransactionTotalFees: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        TransactionStorage: {
            storage_fees_collected(parent) {
                return resolveBigUInt(2, parent.storage_fees_collected);
            },
            storage_fees_due(parent) {
                return resolveBigUInt(2, parent.storage_fees_due);
            },
        },
        TransactionCreditCreditOther: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
        TransactionCreditCredit: {
            grams(parent) {
                return resolveBigUInt(2, parent.grams);
            },
        },
        TransactionCredit: {
            due_fees_collected(parent) {
                return resolveBigUInt(2, parent.due_fees_collected);
            },
        },
        TransactionCompute: {
            gas_fees(parent) {
                return resolveBigUInt(2, parent.gas_fees);
            },
            gas_used(parent) {
                return resolveBigUInt(1, parent.gas_used);
            },
            gas_limit(parent) {
                return resolveBigUInt(1, parent.gas_limit);
            },
        },
        TransactionAction: {
            total_fwd_fees(parent) {
                return resolveBigUInt(2, parent.total_fwd_fees);
            },
            total_action_fees(parent) {
                return resolveBigUInt(2, parent.total_action_fees);
            },
        },
        TransactionBounce: {
            req_fwd_fees(parent) {
                return resolveBigUInt(2, parent.req_fwd_fees);
            },
            msg_fees(parent) {
                return resolveBigUInt(2, parent.msg_fees);
            },
            fwd_fees(parent) {
                return resolveBigUInt(2, parent.fwd_fees);
            },
        },
        Transaction: {
            id(parent) {
                return parent._key;
            },
            lt(parent) {
                return resolveBigUInt(1, parent.lt);
            },
            prev_trans_lt(parent) {
                return resolveBigUInt(1, parent.prev_trans_lt);
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
    MessageValueOther,
    MessageValue,
    Message,
    BlockShard,
    BlockValueFlowToNextBlkOther,
    BlockValueFlowToNextBlk,
    BlockValueFlowExportedOther,
    BlockValueFlowExported,
    BlockValueFlowFeesCollectedOther,
    BlockValueFlowFeesCollected,
    BlockValueFlowCreatedOther,
    BlockValueFlowCreated,
    BlockValueFlowImportedOther,
    BlockValueFlowImported,
    BlockValueFlowFromPrevBlkOther,
    BlockValueFlowFromPrevBlk,
    BlockValueFlowMintedOther,
    BlockValueFlowMinted,
    BlockValueFlowFeesImportedOther,
    BlockValueFlowFeesImported,
    BlockValueFlow,
    BlockAccountBlocksStateUpdate,
    BlockAccountBlocks,
    BlockStateUpdate,
    Block,
    AccountBalanceOther,
    AccountBalance,
    Account,
    TransactionTotalFeesOther,
    TransactionTotalFees,
    TransactionStorage,
    TransactionCreditCreditOther,
    TransactionCreditCredit,
    TransactionCredit,
    TransactionCompute,
    TransactionAction,
    TransactionBounce,
    TransactionSplitInfo,
    Transaction,
};
