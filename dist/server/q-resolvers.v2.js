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
  master: BlockMaster
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
    Block: {
      id: function id(parent) {
        return parent._key;
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
      blocks: db.collectionQuery(db.blocks, Block),
      accounts: db.collectionQuery(db.accounts, Account),
      transactions: db.collectionQuery(db.transactions, Transaction)
    },
    Subscription: {
      messages: db.collectionSubscription(db.messages, Message),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52Mi5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5IiwidmFsdWUiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnX3R5cGVfbmFtZSIsIkV4dGVybmFsIiwiSWhyIiwiSW1tZWRpYXRlbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJtc2ciLCJ0cmFuc2FjdGlvbiIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiTWVzc2FnZSIsImlkIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJQcmVsaW1pbmFyeSIsIlByb3Bvc2VkIiwiRmluYWxpemVkIiwiUmVmdXNlZCIsIlRyYW5zaXRpbmciLCJibG9ja19pZCIsImJvZHkiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlX290aGVyIiwicHJvb2YiLCJib2MiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwibWFzdGVyIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRGVsZXRlZCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwidHJfdHlwZV9uYW1lIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiVGljayIsIlRvY2siLCJTcGxpdFByZXBhcmUiLCJTcGxpdEluc3RhbGwiLCJNZXJnZVByZXBhcmUiLCJNZXJnZUluc3RhbGwiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQVdJQSxPQUFPLENBQUMsY0FBRCxDO0lBVlBDLE0sWUFBQUEsTTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLGMsWUFBQUEsYztJQUNBQyxNLFlBQUFBLE07SUFDQUMsSyxZQUFBQSxLO0lBQ0FDLEksWUFBQUEsSTtJQUNBQyxTLFlBQUFBLFM7SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLHNCLFlBQUFB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RUFBTEEsS0FMYTtBQU1ib0IsRUFBQUEsTUFBTSxFQUFOQSxNQU5hO0FBT2JVLEVBQUFBLE9BQU8sRUFBUEEsT0FQYTtBQVFia0MsRUFBQUEsY0FBYyxFQUFkQSxjQVJhO0FBU2JnQixFQUFBQSw2QkFBNkIsRUFBN0JBLDZCQVRhO0FBVWJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBVmE7QUFXYkssRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFYYTtBQVliSSxFQUFBQSwyQkFBMkIsRUFBM0JBLDJCQVphO0FBYWJvQixFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQWJhO0FBY2JJLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBZGE7QUFlYkssRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkFmYTtBQWdCYk8sRUFBQUEsV0FBVyxFQUFYQSxXQWhCYTtBQWlCYlEsRUFBQUEsS0FBSyxFQUFMQSxLQWpCYTtBQWtCYm1CLEVBQUFBLE9BQU8sRUFBUEEsT0FsQmE7QUFtQmJXLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBbkJhO0FBb0JiTyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXBCYTtBQXFCYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFyQmE7QUFzQmJ1QixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXRCYTtBQXVCYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF2QmE7QUF3QmJXLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBeEJhO0FBeUJiTSxFQUFBQSxXQUFXLEVBQVhBO0FBekJhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KE90aGVyQ3VycmVuY3kpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY3NCeUtleXMoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==