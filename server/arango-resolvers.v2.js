const { scalar, bigUInt1, bigUInt2, resolveBigUInt, struct, array, join, joinArray } = require('./arango-types.js');
const ExtBlkRef = struct({
    end_lt: scalar,
    seq_no: scalar,
    root_hash: scalar,
    file_hash: scalar,
});

const MsgEnvelope = struct({
    msg: scalar,
    next_addr: scalar,
    cur_addr: scalar,
    fwd_fee_remaining: scalar,
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
    import_block_lt: scalar,
});

const MessageValueOther = struct({
    currency: scalar,
    value: scalar,
});

const MessageValueOtherArray = array(MessageValueOther);
const MessageValue = struct({
    grams: scalar,
    other: MessageValueOtherArray,
});

const Message = struct({
    id: scalar,
    msg_type: scalar,
    status: scalar,
    transaction_id: scalar,
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
    created_lt: scalar,
    created_at: scalar,
    ihr_disabled: scalar,
    ihr_fee: scalar,
    fwd_fee: scalar,
    import_fee: scalar,
    bounce: scalar,
    bounced: scalar,
    value: MessageValue,
}, true);

const BlockShard = struct({
    shard_pfx_bits: scalar,
    workchain_id: scalar,
    shard_prefix: scalar,
});

const BlockValueFlowToNextBlkOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowToNextBlkOtherArray = array(BlockValueFlowToNextBlkOther);
const BlockValueFlowToNextBlk = struct({
    grams: scalar,
    other: BlockValueFlowToNextBlkOtherArray,
});

const BlockValueFlowExportedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowExportedOtherArray = array(BlockValueFlowExportedOther);
const BlockValueFlowExported = struct({
    grams: scalar,
    other: BlockValueFlowExportedOtherArray,
});

const BlockValueFlowFeesCollectedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowFeesCollectedOtherArray = array(BlockValueFlowFeesCollectedOther);
const BlockValueFlowFeesCollected = struct({
    grams: scalar,
    other: BlockValueFlowFeesCollectedOtherArray,
});

const BlockValueFlowCreatedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowCreatedOtherArray = array(BlockValueFlowCreatedOther);
const BlockValueFlowCreated = struct({
    grams: scalar,
    other: BlockValueFlowCreatedOtherArray,
});

const BlockValueFlowImportedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowImportedOtherArray = array(BlockValueFlowImportedOther);
const BlockValueFlowImported = struct({
    grams: scalar,
    other: BlockValueFlowImportedOtherArray,
});

const BlockValueFlowFromPrevBlkOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowFromPrevBlkOtherArray = array(BlockValueFlowFromPrevBlkOther);
const BlockValueFlowFromPrevBlk = struct({
    grams: scalar,
    other: BlockValueFlowFromPrevBlkOtherArray,
});

const BlockValueFlowMintedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowMintedOtherArray = array(BlockValueFlowMintedOther);
const BlockValueFlowMinted = struct({
    grams: scalar,
    other: BlockValueFlowMintedOtherArray,
});

const BlockValueFlowFeesImportedOther = struct({
    currency: scalar,
    value: scalar,
});

const BlockValueFlowFeesImportedOtherArray = array(BlockValueFlowFeesImportedOther);
const BlockValueFlowFeesImported = struct({
    grams: scalar,
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
    start_lt: scalar,
    end_lt: scalar,
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
    value: scalar,
});

const AccountBalanceOtherArray = array(AccountBalanceOther);
const AccountBalance = struct({
    grams: scalar,
    other: AccountBalanceOtherArray,
});

const Account = struct({
    id: scalar,
    acc_type: scalar,
    last_paid: scalar,
    due_payment: scalar,
    last_trans_lt: scalar,
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
    value: scalar,
});

const TransactionTotalFeesOtherArray = array(TransactionTotalFeesOther);
const TransactionTotalFees = struct({
    grams: scalar,
    other: TransactionTotalFeesOtherArray,
});

const TransactionStorage = struct({
    storage_fees_collected: scalar,
    storage_fees_due: scalar,
    status_change: scalar,
});

const TransactionCreditCreditOther = struct({
    currency: scalar,
    value: scalar,
});

const TransactionCreditCreditOtherArray = array(TransactionCreditCreditOther);
const TransactionCreditCredit = struct({
    grams: scalar,
    other: TransactionCreditCreditOtherArray,
});

const TransactionCredit = struct({
    due_fees_collected: scalar,
    credit: TransactionCreditCredit,
});

const TransactionCompute = struct({
    compute_type: scalar,
    skipped_reason: scalar,
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

const TransactionAction = struct({
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
    total_msg_size_cells: scalar,
    total_msg_size_bits: scalar,
});

const TransactionBounce = struct({
    bounce_type: scalar,
    msg_size_cells: scalar,
    msg_size_bits: scalar,
    req_fwd_fees: scalar,
    msg_fees: scalar,
    fwd_fees: scalar,
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
    lt: scalar,
    prev_trans_hash: scalar,
    prev_trans_lt: scalar,
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
        Message: {
            id(parent) {
                return parent._key;
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
        Transaction: {
            id(parent) {
                return parent._key;
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
