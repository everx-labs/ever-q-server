"use strict";

var _require = require('./q-types.js'),
    scalar = _require.scalar,
    bigUInt1 = _require.bigUInt1,
    bigUInt2 = _require.bigUInt2,
    resolveBigUInt = _require.resolveBigUInt,
    struct = _require.struct,
    array = _require.array,
    join = _require.join,
    joinArray = _require.joinArray,
    enumName = _require.enumName,
    createEnumNameResolver = _require.createEnumNameResolver;

var OtherCurrency = struct({
  currency: scalar,
  value: bigUInt2
});
var ExtBlkRef = struct({
  end_lt: bigUInt1,
  seq_no: scalar,
  root_hash: scalar,
  file_hash: scalar
});
var MsgEnvelope = struct({
  msg_id: scalar,
  next_addr: scalar,
  cur_addr: scalar,
  fwd_fee_remaining: bigUInt2
});
var InMsg = struct({
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    External: 0,
    Ihr: 1,
    Immediately: 2,
    Final: 3,
    Transit: 4,
    DiscardedFinal: 5,
    DiscardedTransit: 6
  }),
  msg: scalar,
  transaction: scalar,
  ihr_fee: bigUInt2,
  proof_created: scalar,
  in_msg: MsgEnvelope,
  fwd_fee: bigUInt2,
  out_msg: MsgEnvelope,
  transit_fee: bigUInt2,
  transaction_id: bigUInt1,
  proof_delivered: scalar
});
var OutMsg = struct({
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    External: 0,
    Immediately: 1,
    OutMsgNew: 2,
    Transit: 3,
    DequeueImmediately: 4,
    Dequeue: 5,
    TransitRequired: 6,
    None: -1
  }),
  msg: scalar,
  transaction: scalar,
  out_msg: MsgEnvelope,
  reimport: InMsg,
  imported: InMsg,
  import_block_lt: bigUInt1
});
var OtherCurrencyArray = array(OtherCurrency);
var Message = struct({
  id: scalar,
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    Internal: 0,
    ExtIn: 1,
    ExtOut: 2
  }),
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Queued: 1,
    Processing: 2,
    Preliminary: 3,
    Proposed: 4,
    Finalized: 5,
    Refused: 6,
    Transiting: 7
  }),
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
  boc: scalar
}, true);
var BlockValueFlow = struct({
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
  fees_imported_other: OtherCurrencyArray
});
var BlockAccountBlocksStateUpdate = struct({
  old_hash: scalar,
  new_hash: scalar
});
var StringArray = array(scalar);
var BlockAccountBlocks = struct({
  account_addr: scalar,
  transactions: StringArray,
  state_update: BlockAccountBlocksStateUpdate,
  tr_count: scalar
});
var BlockStateUpdate = struct({
  "new": scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
var BlockMasterShardHashesDescr = struct({
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
  split_type_name: enumName('split_type', {
    None: 0,
    Split: 2,
    Merge: 3
  }),
  split: scalar,
  fees_collected: bigUInt2,
  fees_collected_other: OtherCurrencyArray,
  funds_created: bigUInt2,
  funds_created_other: OtherCurrencyArray
});
var BlockMasterShardHashes = struct({
  workchain_id: scalar,
  shard: scalar,
  descr: BlockMasterShardHashesDescr
});
var BlockMasterShardFees = struct({
  workchain_id: scalar,
  shard: scalar,
  fees: bigUInt2,
  fees_other: OtherCurrencyArray,
  create: bigUInt2,
  create_other: OtherCurrencyArray
});
var BlockMasterPrevBlkSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
var BlockMasterShardHashesArray = array(BlockMasterShardHashes);
var BlockMasterShardFeesArray = array(BlockMasterShardFees);
var BlockMasterPrevBlkSignaturesArray = array(BlockMasterPrevBlkSignatures);
var BlockMaster = struct({
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg,
  prev_blk_signatures: BlockMasterPrevBlkSignaturesArray
});
var BlockSignaturesSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
var BlockSignaturesSignaturesArray = array(BlockSignaturesSignatures);
var BlockSignatures = struct({
  id: scalar,
  signatures: BlockSignaturesSignaturesArray
}, true);
var InMsgArray = array(InMsg);
var OutMsgArray = array(OutMsg);
var BlockAccountBlocksArray = array(BlockAccountBlocks);
var Block = struct({
  id: scalar,
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Proposed: 1,
    Finalized: 2,
    Refused: 3
  }),
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
  signatures: join('id', 'blocks_signatures', BlockSignatures)
}, true);
var Account = struct({
  id: scalar,
  acc_type: scalar,
  acc_type_name: enumName('acc_type', {
    Uninit: 0,
    Active: 1,
    Frozen: 2
  }),
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
  boc: scalar
}, true);
var TransactionStorage = struct({
  storage_fees_collected: bigUInt2,
  storage_fees_due: bigUInt2,
  status_change: scalar,
  status_change_name: enumName('status_change', {
    Unchanged: 0,
    Frozen: 1,
    Deleted: 2
  })
});
var TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: bigUInt2,
  credit_other: OtherCurrencyArray
});
var TransactionCompute = struct({
  compute_type: scalar,
  compute_type_name: enumName('compute_type', {
    Skipped: 0,
    Vm: 1
  }),
  skipped_reason: scalar,
  skipped_reason_name: enumName('skipped_reason', {
    NoState: 0,
    BadState: 1,
    NoGas: 2
  }),
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
  vm_final_state_hash: scalar
});
var TransactionAction = struct({
  success: scalar,
  valid: scalar,
  no_funds: scalar,
  status_change: scalar,
  status_change_name: enumName('status_change', {
    Unchanged: 0,
    Frozen: 1,
    Deleted: 2
  }),
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
  total_msg_size_bits: scalar
});
var TransactionBounce = struct({
  bounce_type: scalar,
  bounce_type_name: enumName('bounce_type', {
    NegFunds: 0,
    NoFunds: 1,
    Ok: 2
  }),
  msg_size_cells: scalar,
  msg_size_bits: scalar,
  req_fwd_fees: bigUInt2,
  msg_fees: bigUInt2,
  fwd_fees: bigUInt2
});
var TransactionSplitInfo = struct({
  cur_shard_pfx_len: scalar,
  acc_split_depth: scalar,
  this_addr: scalar,
  sibling_addr: scalar
});
var MessageArray = array(Message);
var Transaction = struct({
  id: scalar,
  tr_type: scalar,
  tr_type_name: enumName('tr_type', {
    Ordinary: 0,
    Storage: 1,
    Tick: 2,
    Tock: 3,
    SplitPrepare: 4,
    SplitInstall: 5,
    MergePrepare: 6,
    MergeInstall: 7
  }),
  status: scalar,
  status_name: enumName('status', {
    Unknown: 0,
    Preliminary: 1,
    Proposed: 2,
    Finalized: 3,
    Refused: 4
  }),
  block_id: scalar,
  account_addr: scalar,
  lt: bigUInt1,
  prev_trans_hash: scalar,
  prev_trans_lt: bigUInt1,
  now: scalar,
  outmsg_cnt: scalar,
  orig_status: scalar,
  orig_status_name: enumName('orig_status', {
    Uninit: 0,
    Active: 1,
    Frozen: 2,
    NonExist: 3
  }),
  end_status: scalar,
  end_status_name: enumName('end_status', {
    Uninit: 0,
    Active: 1,
    Frozen: 2,
    NonExist: 3
  }),
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
  boc: scalar
}, true);

function createResolvers(db) {
  return {
    OtherCurrency: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    ExtBlkRef: {
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    MsgEnvelope: {
      fwd_fee_remaining: function fwd_fee_remaining(parent) {
        return resolveBigUInt(2, parent.fwd_fee_remaining);
      }
    },
    InMsg: {
      ihr_fee: function ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },
      fwd_fee: function fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },
      transit_fee: function transit_fee(parent) {
        return resolveBigUInt(2, parent.transit_fee);
      },
      transaction_id: function transaction_id(parent) {
        return resolveBigUInt(1, parent.transaction_id);
      },
      msg_type_name: createEnumNameResolver('msg_type', {
        External: 0,
        Ihr: 1,
        Immediately: 2,
        Final: 3,
        Transit: 4,
        DiscardedFinal: 5,
        DiscardedTransit: 6
      })
    },
    OutMsg: {
      import_block_lt: function import_block_lt(parent) {
        return resolveBigUInt(1, parent.import_block_lt);
      },
      msg_type_name: createEnumNameResolver('msg_type', {
        External: 0,
        Immediately: 1,
        OutMsgNew: 2,
        Transit: 3,
        DequeueImmediately: 4,
        Dequeue: 5,
        TransitRequired: 6,
        None: -1
      })
    },
    Message: {
      id: function id(parent) {
        return parent._key;
      },
      created_lt: function created_lt(parent) {
        return resolveBigUInt(1, parent.created_lt);
      },
      ihr_fee: function ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },
      fwd_fee: function fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },
      import_fee: function import_fee(parent) {
        return resolveBigUInt(2, parent.import_fee);
      },
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      },
      msg_type_name: createEnumNameResolver('msg_type', {
        Internal: 0,
        ExtIn: 1,
        ExtOut: 2
      }),
      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Queued: 1,
        Processing: 2,
        Preliminary: 3,
        Proposed: 4,
        Finalized: 5,
        Refused: 6,
        Transiting: 7
      })
    },
    BlockValueFlow: {
      to_next_blk: function to_next_blk(parent) {
        return resolveBigUInt(2, parent.to_next_blk);
      },
      exported: function exported(parent) {
        return resolveBigUInt(2, parent.exported);
      },
      fees_collected: function fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },
      created: function created(parent) {
        return resolveBigUInt(2, parent.created);
      },
      imported: function imported(parent) {
        return resolveBigUInt(2, parent.imported);
      },
      from_prev_blk: function from_prev_blk(parent) {
        return resolveBigUInt(2, parent.from_prev_blk);
      },
      minted: function minted(parent) {
        return resolveBigUInt(2, parent.minted);
      },
      fees_imported: function fees_imported(parent) {
        return resolveBigUInt(2, parent.fees_imported);
      }
    },
    BlockMasterShardHashesDescr: {
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      },
      fees_collected: function fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },
      funds_created: function funds_created(parent) {
        return resolveBigUInt(2, parent.funds_created);
      },
      split_type_name: createEnumNameResolver('split_type', {
        None: 0,
        Split: 2,
        Merge: 3
      })
    },
    BlockMasterShardFees: {
      fees: function fees(parent) {
        return resolveBigUInt(2, parent.fees);
      },
      create: function create(parent) {
        return resolveBigUInt(2, parent.create);
      }
    },
    BlockSignatures: {
      id: function id(parent) {
        return parent._key;
      }
    },
    Block: {
      id: function id(parent) {
        return parent._key;
      },
      signatures: function signatures(parent, _args, context) {
        return context.db.fetchDocByKey(context.db.blocks_signatures, parent.id);
      },
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      },
      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Proposed: 1,
        Finalized: 2,
        Refused: 3
      })
    },
    Account: {
      id: function id(parent) {
        return parent._key;
      },
      due_payment: function due_payment(parent) {
        return resolveBigUInt(2, parent.due_payment);
      },
      last_trans_lt: function last_trans_lt(parent) {
        return resolveBigUInt(1, parent.last_trans_lt);
      },
      balance: function balance(parent) {
        return resolveBigUInt(2, parent.balance);
      },
      acc_type_name: createEnumNameResolver('acc_type', {
        Uninit: 0,
        Active: 1,
        Frozen: 2
      })
    },
    TransactionStorage: {
      storage_fees_collected: function storage_fees_collected(parent) {
        return resolveBigUInt(2, parent.storage_fees_collected);
      },
      storage_fees_due: function storage_fees_due(parent) {
        return resolveBigUInt(2, parent.storage_fees_due);
      },
      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionCredit: {
      due_fees_collected: function due_fees_collected(parent) {
        return resolveBigUInt(2, parent.due_fees_collected);
      },
      credit: function credit(parent) {
        return resolveBigUInt(2, parent.credit);
      }
    },
    TransactionCompute: {
      gas_fees: function gas_fees(parent) {
        return resolveBigUInt(2, parent.gas_fees);
      },
      gas_used: function gas_used(parent) {
        return resolveBigUInt(1, parent.gas_used);
      },
      gas_limit: function gas_limit(parent) {
        return resolveBigUInt(1, parent.gas_limit);
      },
      compute_type_name: createEnumNameResolver('compute_type', {
        Skipped: 0,
        Vm: 1
      }),
      skipped_reason_name: createEnumNameResolver('skipped_reason', {
        NoState: 0,
        BadState: 1,
        NoGas: 2
      })
    },
    TransactionAction: {
      total_fwd_fees: function total_fwd_fees(parent) {
        return resolveBigUInt(2, parent.total_fwd_fees);
      },
      total_action_fees: function total_action_fees(parent) {
        return resolveBigUInt(2, parent.total_action_fees);
      },
      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionBounce: {
      req_fwd_fees: function req_fwd_fees(parent) {
        return resolveBigUInt(2, parent.req_fwd_fees);
      },
      msg_fees: function msg_fees(parent) {
        return resolveBigUInt(2, parent.msg_fees);
      },
      fwd_fees: function fwd_fees(parent) {
        return resolveBigUInt(2, parent.fwd_fees);
      },
      bounce_type_name: createEnumNameResolver('bounce_type', {
        NegFunds: 0,
        NoFunds: 1,
        Ok: 2
      })
    },
    Transaction: {
      id: function id(parent) {
        return parent._key;
      },
      in_message: function in_message(parent, _args, context) {
        return context.db.fetchDocByKey(context.db.messages, parent.in_msg);
      },
      out_messages: function out_messages(parent, _args, context) {
        return context.db.fetchDocsByKeys(context.db.messages, parent.out_msgs);
      },
      lt: function lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },
      prev_trans_lt: function prev_trans_lt(parent) {
        return resolveBigUInt(1, parent.prev_trans_lt);
      },
      total_fees: function total_fees(parent) {
        return resolveBigUInt(2, parent.total_fees);
      },
      tr_type_name: createEnumNameResolver('tr_type', {
        Ordinary: 0,
        Storage: 1,
        Tick: 2,
        Tock: 3,
        SplitPrepare: 4,
        SplitInstall: 5,
        MergePrepare: 6,
        MergeInstall: 7
      }),
      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Preliminary: 1,
        Proposed: 2,
        Finalized: 3,
        Refused: 4
      }),
      orig_status_name: createEnumNameResolver('orig_status', {
        Uninit: 0,
        Active: 1,
        Frozen: 2,
        NonExist: 3
      }),
      end_status_name: createEnumNameResolver('end_status', {
        Uninit: 0,
        Active: 1,
        Frozen: 2,
        NonExist: 3
      })
    },
    Query: {
      messages: db.collectionQuery(db.messages, Message),
      blocks_signatures: db.collectionQuery(db.blocks_signatures, BlockSignatures),
      blocks: db.collectionQuery(db.blocks, Block),
      accounts: db.collectionQuery(db.accounts, Account),
      transactions: db.collectionQuery(db.transactions, Transaction)
    },
    Subscription: {
      messages: db.collectionSubscription(db.messages, Message),
      blocks_signatures: db.collectionSubscription(db.blocks_signatures, BlockSignatures),
      blocks: db.collectionSubscription(db.blocks, Block),
      accounts: db.collectionSubscription(db.accounts, Account),
      transactions: db.collectionSubscription(db.transactions, Transaction)
    }
  };
}

module.exports = {
  createResolvers: createResolvers,
  OtherCurrency: OtherCurrency,
  ExtBlkRef: ExtBlkRef,
  MsgEnvelope: MsgEnvelope,
  InMsg: InMsg,
  OutMsg: OutMsg,
  Message: Message,
  BlockValueFlow: BlockValueFlow,
  BlockAccountBlocksStateUpdate: BlockAccountBlocksStateUpdate,
  BlockAccountBlocks: BlockAccountBlocks,
  BlockStateUpdate: BlockStateUpdate,
  BlockMasterShardHashesDescr: BlockMasterShardHashesDescr,
  BlockMasterShardHashes: BlockMasterShardHashes,
  BlockMasterShardFees: BlockMasterShardFees,
  BlockMasterPrevBlkSignatures: BlockMasterPrevBlkSignatures,
  BlockMaster: BlockMaster,
  BlockSignaturesSignatures: BlockSignaturesSignatures,
  BlockSignatures: BlockSignatures,
  Block: Block,
  Account: Account,
  TransactionStorage: TransactionStorage,
  TransactionCredit: TransactionCredit,
  TransactionCompute: TransactionCompute,
  TransactionAction: TransactionAction,
  TransactionBounce: TransactionBounce,
  TransactionSplitInfo: TransactionSplitInfo,
  Transaction: Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52Mi5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5IiwidmFsdWUiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnX3R5cGVfbmFtZSIsIkV4dGVybmFsIiwiSWhyIiwiSW1tZWRpYXRlbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJtc2ciLCJ0cmFuc2FjdGlvbiIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiTWVzc2FnZSIsImlkIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJQcmVsaW1pbmFyeSIsIlByb3Bvc2VkIiwiRmluYWxpemVkIiwiUmVmdXNlZCIsIlRyYW5zaXRpbmciLCJibG9ja19pZCIsImJvZHkiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlX290aGVyIiwicHJvb2YiLCJib2MiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJmZXRjaERvY0J5S2V5IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFXSUEsT0FBTyxDQUFDLGNBQUQsQztJQVZQQyxNLFlBQUFBLE07SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLFEsWUFBQUEs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SGE7QUFJYkssRUFBQUEsV0FBVyxFQUFYQSxXQUphO0FBS2JLLEVBQUFBLEtBQUssRUFBTEEsS0FMYTtBQU1ib0IsRUFBQUEsTUFBTSxFQUFOQSxNQU5hO0FBT2JVLEVBQUFBLE9BQU8sRUFBUEEsT0FQYTtBQVFia0MsRUFBQUEsY0FBYyxFQUFkQSxjQVJhO0FBU2JnQixFQUFBQSw2QkFBNkIsRUFBN0JBLDZCQVRhO0FBVWJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBVmE7QUFXYkssRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFYYTtBQVliSSxFQUFBQSwyQkFBMkIsRUFBM0JBLDJCQVphO0FBYWJvQixFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQWJhO0FBY2JJLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBZGE7QUFlYkssRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkFmYTtBQWdCYk8sRUFBQUEsV0FBVyxFQUFYQSxXQWhCYTtBQWlCYkssRUFBQUEseUJBQXlCLEVBQXpCQSx5QkFqQmE7QUFrQmJFLEVBQUFBLGVBQWUsRUFBZkEsZUFsQmE7QUFtQmJLLEVBQUFBLEtBQUssRUFBTEEsS0FuQmE7QUFvQmJtQixFQUFBQSxPQUFPLEVBQVBBLE9BcEJhO0FBcUJiVyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQXJCYTtBQXNCYk8sRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF0QmE7QUF1QmJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBdkJhO0FBd0JidUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF4QmE7QUF5QmJjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBekJhO0FBMEJiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTFCYTtBQTJCYk0sRUFBQUEsV0FBVyxFQUFYQTtBQTNCYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcywgcGFyZW50LmlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY3NCeUtleXMoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3Nfc2lnbmF0dXJlcywgQmxvY2tTaWduYXR1cmVzKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3Nfc2lnbmF0dXJlcywgQmxvY2tTaWduYXR1cmVzKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==