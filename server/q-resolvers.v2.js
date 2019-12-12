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
} = require('./q-types.js');
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
    msg_type_name: enumName('msg_type', { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, None: -1 }),
    msg: scalar,
    transaction: scalar,
    out_msg: MsgEnvelope,
    reimport: InMsg,
    imported: InMsg,
    import_block_lt: bigUInt1,
});

const OtherCurrencyArray = array(OtherCurrency);
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

const BlockAccountBlocksStateUpdate = struct({
    old_hash: scalar,
    new_hash: scalar,
});

const StringArray = array(scalar);
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

const BlockMasterShardHashesArray = array(BlockMasterShardHashes);
const BlockMasterShardFeesArray = array(BlockMasterShardFees);
const BlockMasterPrevBlkSignaturesArray = array(BlockMasterPrevBlkSignatures);
const BlockMaster = struct({
    shard_hashes: BlockMasterShardHashesArray,
    shard_fees: BlockMasterShardFeesArray,
    recover_create_msg: InMsg,
    prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
});

const BlockSignaturesSignatures = struct({
    node_id: scalar,
    r: scalar,
    s: scalar,
});

const BlockSignaturesSignaturesArray = array(BlockSignaturesSignatures);
const BlockSignatures = struct({
    id: scalar,
    signatures: BlockSignaturesSignaturesArray,
}, true);

const InMsgArray = array(InMsg);
const OutMsgArray = array(OutMsg);
const BlockAccountBlocksArray = array(BlockAccountBlocks);
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
    value_flow: BlockValueFlow,
    in_msg_descr: InMsgArray,
    rand_seed: scalar,
    out_msg_descr: OutMsgArray,
    account_blocks: BlockAccountBlocksArray,
    state_update: BlockStateUpdate,
    master: BlockMaster,
    signatures: join('id', 'blocks_signatures', BlockSignatures),
}, true);

const Account = struct({
    id: scalar,
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

const TransactionStorage = struct({
    storage_fees_collected: bigUInt2,
    storage_fees_due: bigUInt2,
    status_change: scalar,
    status_change_name: enumName('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
});

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

const MessageArray = array(Message);
const Transaction = struct({
    id: scalar,
    tr_type: scalar,
    tr_type_name: enumName('tr_type', { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
    status: scalar,
    status_name: enumName('status', { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
    block_id: scalar,
    account_addr: scalar,
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
    in_message: join('in_msg', 'messages', Message),
    out_msgs: StringArray,
    out_messages: joinArray('out_msgs', 'messages', Message),
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

function createResolvers(db) {
    return {
        OtherCurrency: {
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
        },
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
            msg_type_name: createEnumNameResolver('msg_type', { External: 0, Ihr: 1, Immediately: 2, Final: 3, Transit: 4, DiscardedFinal: 5, DiscardedTransit: 6 }),
        },
        OutMsg: {
            import_block_lt(parent) {
                return resolveBigUInt(1, parent.import_block_lt);
            },
            msg_type_name: createEnumNameResolver('msg_type', { External: 0, Immediately: 1, OutMsgNew: 2, Transit: 3, DequeueImmediately: 4, Dequeue: 5, TransitRequired: 6, None: -1 }),
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
            value(parent) {
                return resolveBigUInt(2, parent.value);
            },
            msg_type_name: createEnumNameResolver('msg_type', { Internal: 0, ExtIn: 1, ExtOut: 2 }),
            status_name: createEnumNameResolver('status', { Unknown: 0, Queued: 1, Processing: 2, Preliminary: 3, Proposed: 4, Finalized: 5, Refused: 6, Transiting: 7 }),
        },
        BlockValueFlow: {
            to_next_blk(parent) {
                return resolveBigUInt(2, parent.to_next_blk);
            },
            exported(parent) {
                return resolveBigUInt(2, parent.exported);
            },
            fees_collected(parent) {
                return resolveBigUInt(2, parent.fees_collected);
            },
            created(parent) {
                return resolveBigUInt(2, parent.created);
            },
            imported(parent) {
                return resolveBigUInt(2, parent.imported);
            },
            from_prev_blk(parent) {
                return resolveBigUInt(2, parent.from_prev_blk);
            },
            minted(parent) {
                return resolveBigUInt(2, parent.minted);
            },
            fees_imported(parent) {
                return resolveBigUInt(2, parent.fees_imported);
            },
        },
        BlockMasterShardHashesDescr: {
            start_lt(parent) {
                return resolveBigUInt(1, parent.start_lt);
            },
            end_lt(parent) {
                return resolveBigUInt(1, parent.end_lt);
            },
            fees_collected(parent) {
                return resolveBigUInt(2, parent.fees_collected);
            },
            funds_created(parent) {
                return resolveBigUInt(2, parent.funds_created);
            },
            split_type_name: createEnumNameResolver('split_type', { None: 0, Split: 2, Merge: 3 }),
        },
        BlockMasterShardFees: {
            fees(parent) {
                return resolveBigUInt(2, parent.fees);
            },
            create(parent) {
                return resolveBigUInt(2, parent.create);
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
                return context.db.fetchDocByKey(context.db.blocks_signatures, parent.id);
            },
            start_lt(parent) {
                return resolveBigUInt(1, parent.start_lt);
            },
            end_lt(parent) {
                return resolveBigUInt(1, parent.end_lt);
            },
            status_name: createEnumNameResolver('status', { Unknown: 0, Proposed: 1, Finalized: 2, Refused: 3 }),
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
            balance(parent) {
                return resolveBigUInt(2, parent.balance);
            },
            acc_type_name: createEnumNameResolver('acc_type', { Uninit: 0, Active: 1, Frozen: 2 }),
        },
        TransactionStorage: {
            storage_fees_collected(parent) {
                return resolveBigUInt(2, parent.storage_fees_collected);
            },
            storage_fees_due(parent) {
                return resolveBigUInt(2, parent.storage_fees_due);
            },
            status_change_name: createEnumNameResolver('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
        },
        TransactionCredit: {
            due_fees_collected(parent) {
                return resolveBigUInt(2, parent.due_fees_collected);
            },
            credit(parent) {
                return resolveBigUInt(2, parent.credit);
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
            compute_type_name: createEnumNameResolver('compute_type', { Skipped: 0, Vm: 1 }),
            skipped_reason_name: createEnumNameResolver('skipped_reason', { NoState: 0, BadState: 1, NoGas: 2 }),
        },
        TransactionAction: {
            total_fwd_fees(parent) {
                return resolveBigUInt(2, parent.total_fwd_fees);
            },
            total_action_fees(parent) {
                return resolveBigUInt(2, parent.total_action_fees);
            },
            status_change_name: createEnumNameResolver('status_change', { Unchanged: 0, Frozen: 1, Deleted: 2 }),
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
            bounce_type_name: createEnumNameResolver('bounce_type', { NegFunds: 0, NoFunds: 1, Ok: 2 }),
        },
        Transaction: {
            id(parent) {
                return parent._key;
            },
            in_message(parent, _args, context) {
                return context.db.fetchDocByKey(context.db.messages, parent.in_msg);
            },
            out_messages(parent, _args, context) {
                return context.db.fetchDocsByKeys(context.db.messages, parent.out_msgs);
            },
            lt(parent) {
                return resolveBigUInt(1, parent.lt);
            },
            prev_trans_lt(parent) {
                return resolveBigUInt(1, parent.prev_trans_lt);
            },
            total_fees(parent) {
                return resolveBigUInt(2, parent.total_fees);
            },
            tr_type_name: createEnumNameResolver('tr_type', { Ordinary: 0, Storage: 1, Tick: 2, Tock: 3, SplitPrepare: 4, SplitInstall: 5, MergePrepare: 6, MergeInstall: 7 }),
            status_name: createEnumNameResolver('status', { Unknown: 0, Preliminary: 1, Proposed: 2, Finalized: 3, Refused: 4 }),
            orig_status_name: createEnumNameResolver('orig_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
            end_status_name: createEnumNameResolver('end_status', { Uninit: 0, Active: 1, Frozen: 2, NonExist: 3 }),
        },
        Query: {
            messages: db.collectionQuery(db.messages, Message),
            blocks_signatures: db.collectionQuery(db.blocks_signatures, BlockSignatures),
            blocks: db.collectionQuery(db.blocks, Block),
            accounts: db.collectionQuery(db.accounts, Account),
            transactions: db.collectionQuery(db.transactions, Transaction),
        },
        Subscription: {
            messages: db.collectionSubscription(db.messages, Message),
            blocks_signatures: db.collectionSubscription(db.blocks_signatures, BlockSignatures),
            blocks: db.collectionSubscription(db.blocks, Block),
            accounts: db.collectionSubscription(db.accounts, Account),
            transactions: db.collectionSubscription(db.transactions, Transaction),
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
    Message,
    BlockValueFlow,
    BlockAccountBlocksStateUpdate,
    BlockAccountBlocks,
    BlockStateUpdate,
    BlockMasterShardHashesDescr,
    BlockMasterShardHashes,
    BlockMasterShardFees,
    BlockMasterPrevBlkSignatures,
    BlockMaster,
    BlockSignaturesSignatures,
    BlockSignatures,
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
