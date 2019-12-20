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
        return context.db.blocks_signatures.fetchDocByKey(parent.id);
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
        return context.db.messages.fetchDocByKey(parent.in_msg);
      },
      out_messages: function out_messages(parent, _args, context) {
        return context.db.messages.fetchDocsByKeys(parent.out_msgs);
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
      messages: db.messages.queryResolver(),
      blocks_signatures: db.blocks_signatures.queryResolver(),
      blocks: db.blocks.queryResolver(),
      accounts: db.accounts.queryResolver(),
      transactions: db.transactions.queryResolver()
    },
    Subscription: {
      messages: db.messages.subscriptionResolver(),
      blocks_signatures: db.blocks_signatures.subscriptionResolver(),
      blocks: db.blocks.subscriptionResolver(),
      accounts: db.accounts.subscriptionResolver(),
      transactions: db.transactions.subscriptionResolver()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJVbmluaXQiLCJBY3RpdmUiLCJGcm96ZW4iLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsImJsb2Nrc19zaWduYXR1cmVzIiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0IsWUFBQUEsc0I7O0FBRUosSUFBTUMsYUFBYSxHQUFHTixNQUFNLENBQUM7QUFDekJPLEVBQUFBLFFBQVEsRUFBRVgsTUFEZTtBQUV6QlksRUFBQUEsS0FBSyxFQUFFVjtBQUZrQixDQUFELENBQTVCO0FBS0EsSUFBTVcsU0FBUyxHQUFHVCxNQUFNLENBQUM7QUFDckJVLEVBQUFBLE1BQU0sRUFBRWIsUUFEYTtBQUVyQmMsRUFBQUEsTUFBTSxFQUFFZixNQUZhO0FBR3JCZ0IsRUFBQUEsU0FBUyxFQUFFaEIsTUFIVTtBQUlyQmlCLEVBQUFBLFNBQVMsRUFBRWpCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLElBQU1rQixXQUFXLEdBQUdkLE1BQU0sQ0FBQztBQUN2QmUsRUFBQUEsTUFBTSxFQUFFbkIsTUFEZTtBQUV2Qm9CLEVBQUFBLFNBQVMsRUFBRXBCLE1BRlk7QUFHdkJxQixFQUFBQSxRQUFRLEVBQUVyQixNQUhhO0FBSXZCc0IsRUFBQUEsaUJBQWlCLEVBQUVwQjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNcUIsS0FBSyxHQUFHbkIsTUFBTSxDQUFDO0FBQ2pCb0IsRUFBQUEsUUFBUSxFQUFFeEIsTUFETztBQUVqQnlCLEVBQUFBLGFBQWEsRUFBRWpCLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRWtCLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEdBQUcsRUFBRSxDQUFwQjtBQUF1QkMsSUFBQUEsV0FBVyxFQUFFLENBQXBDO0FBQXVDQyxJQUFBQSxLQUFLLEVBQUUsQ0FBOUM7QUFBaURDLElBQUFBLE9BQU8sRUFBRSxDQUExRDtBQUE2REMsSUFBQUEsY0FBYyxFQUFFLENBQTdFO0FBQWdGQyxJQUFBQSxnQkFBZ0IsRUFBRTtBQUFsRyxHQUFiLENBRk47QUFHakJDLEVBQUFBLEdBQUcsRUFBRWpDLE1BSFk7QUFJakJrQyxFQUFBQSxXQUFXLEVBQUVsQyxNQUpJO0FBS2pCbUMsRUFBQUEsT0FBTyxFQUFFakMsUUFMUTtBQU1qQmtDLEVBQUFBLGFBQWEsRUFBRXBDLE1BTkU7QUFPakJxQyxFQUFBQSxNQUFNLEVBQUVuQixXQVBTO0FBUWpCb0IsRUFBQUEsT0FBTyxFQUFFcEMsUUFSUTtBQVNqQnFDLEVBQUFBLE9BQU8sRUFBRXJCLFdBVFE7QUFVakJzQixFQUFBQSxXQUFXLEVBQUV0QyxRQVZJO0FBV2pCdUMsRUFBQUEsY0FBYyxFQUFFeEMsUUFYQztBQVlqQnlDLEVBQUFBLGVBQWUsRUFBRTFDO0FBWkEsQ0FBRCxDQUFwQjtBQWVBLElBQU0yQyxNQUFNLEdBQUd2QyxNQUFNLENBQUM7QUFDbEJvQixFQUFBQSxRQUFRLEVBQUV4QixNQURRO0FBRWxCeUIsRUFBQUEsYUFBYSxFQUFFakIsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFa0IsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsSUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCZ0IsSUFBQUEsU0FBUyxFQUFFLENBQTFDO0FBQTZDZCxJQUFBQSxPQUFPLEVBQUUsQ0FBdEQ7QUFBeURlLElBQUFBLGtCQUFrQixFQUFFLENBQTdFO0FBQWdGQyxJQUFBQSxPQUFPLEVBQUUsQ0FBekY7QUFBNEZDLElBQUFBLGVBQWUsRUFBRSxDQUE3RztBQUFnSEMsSUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBdkgsR0FBYixDQUZMO0FBR2xCZixFQUFBQSxHQUFHLEVBQUVqQyxNQUhhO0FBSWxCa0MsRUFBQUEsV0FBVyxFQUFFbEMsTUFKSztBQUtsQnVDLEVBQUFBLE9BQU8sRUFBRXJCLFdBTFM7QUFNbEIrQixFQUFBQSxRQUFRLEVBQUUxQixLQU5RO0FBT2xCMkIsRUFBQUEsUUFBUSxFQUFFM0IsS0FQUTtBQVFsQjRCLEVBQUFBLGVBQWUsRUFBRWxEO0FBUkMsQ0FBRCxDQUFyQjtBQVdBLElBQU1tRCxrQkFBa0IsR0FBRy9DLEtBQUssQ0FBQ0ssYUFBRCxDQUFoQztBQUNBLElBQU0yQyxPQUFPLEdBQUdqRCxNQUFNLENBQUM7QUFDbkJrRCxFQUFBQSxFQUFFLEVBQUV0RCxNQURlO0FBRW5Cd0IsRUFBQUEsUUFBUSxFQUFFeEIsTUFGUztBQUduQnlCLEVBQUFBLGFBQWEsRUFBRWpCLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRStDLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEtBQUssRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsTUFBTSxFQUFFO0FBQWpDLEdBQWIsQ0FISjtBQUluQkMsRUFBQUEsTUFBTSxFQUFFMUQsTUFKVztBQUtuQjJELEVBQUFBLFdBQVcsRUFBRW5ELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW9ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDQyxJQUFBQSxXQUFXLEVBQUUsQ0FBckQ7QUFBd0RDLElBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsSUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxJQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0ZDLElBQUFBLFVBQVUsRUFBRTtBQUEzRyxHQUFYLENBTEY7QUFNbkJDLEVBQUFBLFFBQVEsRUFBRXBFLE1BTlM7QUFPbkJxRSxFQUFBQSxJQUFJLEVBQUVyRSxNQVBhO0FBUW5Cc0UsRUFBQUEsV0FBVyxFQUFFdEUsTUFSTTtBQVNuQnVFLEVBQUFBLElBQUksRUFBRXZFLE1BVGE7QUFVbkJ3RSxFQUFBQSxJQUFJLEVBQUV4RSxNQVZhO0FBV25CeUUsRUFBQUEsSUFBSSxFQUFFekUsTUFYYTtBQVluQjBFLEVBQUFBLElBQUksRUFBRTFFLE1BWmE7QUFhbkIyRSxFQUFBQSxPQUFPLEVBQUUzRSxNQWJVO0FBY25CNEUsRUFBQUEsR0FBRyxFQUFFNUUsTUFkYztBQWVuQjZFLEVBQUFBLEdBQUcsRUFBRTdFLE1BZmM7QUFnQm5COEUsRUFBQUEsVUFBVSxFQUFFN0UsUUFoQk87QUFpQm5COEUsRUFBQUEsVUFBVSxFQUFFL0UsTUFqQk87QUFrQm5CZ0YsRUFBQUEsWUFBWSxFQUFFaEYsTUFsQks7QUFtQm5CbUMsRUFBQUEsT0FBTyxFQUFFakMsUUFuQlU7QUFvQm5Cb0MsRUFBQUEsT0FBTyxFQUFFcEMsUUFwQlU7QUFxQm5CK0UsRUFBQUEsVUFBVSxFQUFFL0UsUUFyQk87QUFzQm5CZ0YsRUFBQUEsTUFBTSxFQUFFbEYsTUF0Qlc7QUF1Qm5CbUYsRUFBQUEsT0FBTyxFQUFFbkYsTUF2QlU7QUF3Qm5CWSxFQUFBQSxLQUFLLEVBQUVWLFFBeEJZO0FBeUJuQmtGLEVBQUFBLFdBQVcsRUFBRWhDLGtCQXpCTTtBQTBCbkJpQyxFQUFBQSxLQUFLLEVBQUVyRixNQTFCWTtBQTJCbkJzRixFQUFBQSxHQUFHLEVBQUV0RjtBQTNCYyxDQUFELEVBNEJuQixJQTVCbUIsQ0FBdEI7QUE4QkEsSUFBTXVGLGNBQWMsR0FBR25GLE1BQU0sQ0FBQztBQUMxQm9GLEVBQUFBLFdBQVcsRUFBRXRGLFFBRGE7QUFFMUJ1RixFQUFBQSxpQkFBaUIsRUFBRXJDLGtCQUZPO0FBRzFCc0MsRUFBQUEsUUFBUSxFQUFFeEYsUUFIZ0I7QUFJMUJ5RixFQUFBQSxjQUFjLEVBQUV2QyxrQkFKVTtBQUsxQndDLEVBQUFBLGNBQWMsRUFBRTFGLFFBTFU7QUFNMUIyRixFQUFBQSxvQkFBb0IsRUFBRXpDLGtCQU5JO0FBTzFCMEMsRUFBQUEsT0FBTyxFQUFFNUYsUUFQaUI7QUFRMUI2RixFQUFBQSxhQUFhLEVBQUUzQyxrQkFSVztBQVMxQkYsRUFBQUEsUUFBUSxFQUFFaEQsUUFUZ0I7QUFVMUI4RixFQUFBQSxjQUFjLEVBQUU1QyxrQkFWVTtBQVcxQjZDLEVBQUFBLGFBQWEsRUFBRS9GLFFBWFc7QUFZMUJnRyxFQUFBQSxtQkFBbUIsRUFBRTlDLGtCQVpLO0FBYTFCK0MsRUFBQUEsTUFBTSxFQUFFakcsUUFia0I7QUFjMUJrRyxFQUFBQSxZQUFZLEVBQUVoRCxrQkFkWTtBQWUxQmlELEVBQUFBLGFBQWEsRUFBRW5HLFFBZlc7QUFnQjFCb0csRUFBQUEsbUJBQW1CLEVBQUVsRDtBQWhCSyxDQUFELENBQTdCO0FBbUJBLElBQU1tRCw2QkFBNkIsR0FBR25HLE1BQU0sQ0FBQztBQUN6Q29HLEVBQUFBLFFBQVEsRUFBRXhHLE1BRCtCO0FBRXpDeUcsRUFBQUEsUUFBUSxFQUFFekc7QUFGK0IsQ0FBRCxDQUE1QztBQUtBLElBQU0wRyxXQUFXLEdBQUdyRyxLQUFLLENBQUNMLE1BQUQsQ0FBekI7QUFDQSxJQUFNMkcsa0JBQWtCLEdBQUd2RyxNQUFNLENBQUM7QUFDOUJ3RyxFQUFBQSxZQUFZLEVBQUU1RyxNQURnQjtBQUU5QjZHLEVBQUFBLFlBQVksRUFBRUgsV0FGZ0I7QUFHOUJJLEVBQUFBLFlBQVksRUFBRVAsNkJBSGdCO0FBSTlCUSxFQUFBQSxRQUFRLEVBQUUvRztBQUpvQixDQUFELENBQWpDO0FBT0EsSUFBTWdILGdCQUFnQixHQUFHNUcsTUFBTSxDQUFDO0FBQzVCLFNBQUtKLE1BRHVCO0FBRTVCeUcsRUFBQUEsUUFBUSxFQUFFekcsTUFGa0I7QUFHNUJpSCxFQUFBQSxTQUFTLEVBQUVqSCxNQUhpQjtBQUk1QmtILEVBQUFBLEdBQUcsRUFBRWxILE1BSnVCO0FBSzVCd0csRUFBQUEsUUFBUSxFQUFFeEcsTUFMa0I7QUFNNUJtSCxFQUFBQSxTQUFTLEVBQUVuSDtBQU5pQixDQUFELENBQS9CO0FBU0EsSUFBTW9ILDJCQUEyQixHQUFHaEgsTUFBTSxDQUFDO0FBQ3ZDVyxFQUFBQSxNQUFNLEVBQUVmLE1BRCtCO0FBRXZDcUgsRUFBQUEsWUFBWSxFQUFFckgsTUFGeUI7QUFHdkNzSCxFQUFBQSxRQUFRLEVBQUVySCxRQUg2QjtBQUl2Q2EsRUFBQUEsTUFBTSxFQUFFYixRQUorQjtBQUt2Q2UsRUFBQUEsU0FBUyxFQUFFaEIsTUFMNEI7QUFNdkNpQixFQUFBQSxTQUFTLEVBQUVqQixNQU40QjtBQU92Q3VILEVBQUFBLFlBQVksRUFBRXZILE1BUHlCO0FBUXZDd0gsRUFBQUEsWUFBWSxFQUFFeEgsTUFSeUI7QUFTdkN5SCxFQUFBQSxVQUFVLEVBQUV6SCxNQVQyQjtBQVV2QzBILEVBQUFBLFVBQVUsRUFBRTFILE1BVjJCO0FBV3ZDMkgsRUFBQUEsYUFBYSxFQUFFM0gsTUFYd0I7QUFZdkM0SCxFQUFBQSxLQUFLLEVBQUU1SCxNQVpnQztBQWF2QzZILEVBQUFBLG1CQUFtQixFQUFFN0gsTUFia0I7QUFjdkM4SCxFQUFBQSxvQkFBb0IsRUFBRTlILE1BZGlCO0FBZXZDK0gsRUFBQUEsZ0JBQWdCLEVBQUUvSCxNQWZxQjtBQWdCdkNnSSxFQUFBQSxTQUFTLEVBQUVoSSxNQWhCNEI7QUFpQnZDaUksRUFBQUEsVUFBVSxFQUFFakksTUFqQjJCO0FBa0J2Q2tJLEVBQUFBLGVBQWUsRUFBRTFILFFBQVEsQ0FBQyxZQUFELEVBQWU7QUFBRXdDLElBQUFBLElBQUksRUFBRSxDQUFSO0FBQVdtRixJQUFBQSxLQUFLLEVBQUUsQ0FBbEI7QUFBcUJDLElBQUFBLEtBQUssRUFBRTtBQUE1QixHQUFmLENBbEJjO0FBbUJ2Q0MsRUFBQUEsS0FBSyxFQUFFckksTUFuQmdDO0FBb0J2QzRGLEVBQUFBLGNBQWMsRUFBRTFGLFFBcEJ1QjtBQXFCdkMyRixFQUFBQSxvQkFBb0IsRUFBRXpDLGtCQXJCaUI7QUFzQnZDa0YsRUFBQUEsYUFBYSxFQUFFcEksUUF0QndCO0FBdUJ2Q3FJLEVBQUFBLG1CQUFtQixFQUFFbkY7QUF2QmtCLENBQUQsQ0FBMUM7QUEwQkEsSUFBTW9GLHNCQUFzQixHQUFHcEksTUFBTSxDQUFDO0FBQ2xDcUksRUFBQUEsWUFBWSxFQUFFekksTUFEb0I7QUFFbEMwSSxFQUFBQSxLQUFLLEVBQUUxSSxNQUYyQjtBQUdsQzJJLEVBQUFBLEtBQUssRUFBRXZCO0FBSDJCLENBQUQsQ0FBckM7QUFNQSxJQUFNd0Isb0JBQW9CLEdBQUd4SSxNQUFNLENBQUM7QUFDaENxSSxFQUFBQSxZQUFZLEVBQUV6SSxNQURrQjtBQUVoQzBJLEVBQUFBLEtBQUssRUFBRTFJLE1BRnlCO0FBR2hDNkksRUFBQUEsSUFBSSxFQUFFM0ksUUFIMEI7QUFJaEM0SSxFQUFBQSxVQUFVLEVBQUUxRixrQkFKb0I7QUFLaEMyRixFQUFBQSxNQUFNLEVBQUU3SSxRQUx3QjtBQU1oQzhJLEVBQUFBLFlBQVksRUFBRTVGO0FBTmtCLENBQUQsQ0FBbkM7QUFTQSxJQUFNNkYsNEJBQTRCLEdBQUc3SSxNQUFNLENBQUM7QUFDeEM4SSxFQUFBQSxPQUFPLEVBQUVsSixNQUQrQjtBQUV4Q21KLEVBQUFBLENBQUMsRUFBRW5KLE1BRnFDO0FBR3hDb0osRUFBQUEsQ0FBQyxFQUFFcEo7QUFIcUMsQ0FBRCxDQUEzQztBQU1BLElBQU1xSiwyQkFBMkIsR0FBR2hKLEtBQUssQ0FBQ21JLHNCQUFELENBQXpDO0FBQ0EsSUFBTWMseUJBQXlCLEdBQUdqSixLQUFLLENBQUN1SSxvQkFBRCxDQUF2QztBQUNBLElBQU1XLGlDQUFpQyxHQUFHbEosS0FBSyxDQUFDNEksNEJBQUQsQ0FBL0M7QUFDQSxJQUFNTyxXQUFXLEdBQUdwSixNQUFNLENBQUM7QUFDdkJxSixFQUFBQSxZQUFZLEVBQUVKLDJCQURTO0FBRXZCSyxFQUFBQSxVQUFVLEVBQUVKLHlCQUZXO0FBR3ZCSyxFQUFBQSxrQkFBa0IsRUFBRXBJLEtBSEc7QUFJdkJxSSxFQUFBQSxtQkFBbUIsRUFBRUw7QUFKRSxDQUFELENBQTFCO0FBT0EsSUFBTU0seUJBQXlCLEdBQUd6SixNQUFNLENBQUM7QUFDckM4SSxFQUFBQSxPQUFPLEVBQUVsSixNQUQ0QjtBQUVyQ21KLEVBQUFBLENBQUMsRUFBRW5KLE1BRmtDO0FBR3JDb0osRUFBQUEsQ0FBQyxFQUFFcEo7QUFIa0MsQ0FBRCxDQUF4QztBQU1BLElBQU04Siw4QkFBOEIsR0FBR3pKLEtBQUssQ0FBQ3dKLHlCQUFELENBQTVDO0FBQ0EsSUFBTUUsZUFBZSxHQUFHM0osTUFBTSxDQUFDO0FBQzNCa0QsRUFBQUEsRUFBRSxFQUFFdEQsTUFEdUI7QUFFM0JnSyxFQUFBQSxVQUFVLEVBQUVGO0FBRmUsQ0FBRCxFQUczQixJQUgyQixDQUE5QjtBQUtBLElBQU1HLFVBQVUsR0FBRzVKLEtBQUssQ0FBQ2tCLEtBQUQsQ0FBeEI7QUFDQSxJQUFNMkksV0FBVyxHQUFHN0osS0FBSyxDQUFDc0MsTUFBRCxDQUF6QjtBQUNBLElBQU13SCx1QkFBdUIsR0FBRzlKLEtBQUssQ0FBQ3NHLGtCQUFELENBQXJDO0FBQ0EsSUFBTXlELEtBQUssR0FBR2hLLE1BQU0sQ0FBQztBQUNqQmtELEVBQUFBLEVBQUUsRUFBRXRELE1BRGE7QUFFakIwRCxFQUFBQSxNQUFNLEVBQUUxRCxNQUZTO0FBR2pCMkQsRUFBQUEsV0FBVyxFQUFFbkQsUUFBUSxDQUFDLFFBQUQsRUFBVztBQUFFb0QsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0ksSUFBQUEsUUFBUSxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxTQUFTLEVBQUUsQ0FBdEM7QUFBeUNDLElBQUFBLE9BQU8sRUFBRTtBQUFsRCxHQUFYLENBSEo7QUFJakJtRyxFQUFBQSxTQUFTLEVBQUVySyxNQUpNO0FBS2pCeUgsRUFBQUEsVUFBVSxFQUFFekgsTUFMSztBQU1qQmUsRUFBQUEsTUFBTSxFQUFFZixNQU5TO0FBT2pCc0ssRUFBQUEsV0FBVyxFQUFFdEssTUFQSTtBQVFqQmdJLEVBQUFBLFNBQVMsRUFBRWhJLE1BUk07QUFTakJ1SyxFQUFBQSxrQkFBa0IsRUFBRXZLLE1BVEg7QUFVakI0SCxFQUFBQSxLQUFLLEVBQUU1SCxNQVZVO0FBV2pCd0ssRUFBQUEsVUFBVSxFQUFFM0osU0FYSztBQVlqQjRKLEVBQUFBLFFBQVEsRUFBRTVKLFNBWk87QUFhakI2SixFQUFBQSxZQUFZLEVBQUU3SixTQWJHO0FBY2pCOEosRUFBQUEsYUFBYSxFQUFFOUosU0FkRTtBQWVqQitKLEVBQUFBLGlCQUFpQixFQUFFL0osU0FmRjtBQWdCakJnSyxFQUFBQSxPQUFPLEVBQUU3SyxNQWhCUTtBQWlCakI4SyxFQUFBQSw2QkFBNkIsRUFBRTlLLE1BakJkO0FBa0JqQnVILEVBQUFBLFlBQVksRUFBRXZILE1BbEJHO0FBbUJqQitLLEVBQUFBLFdBQVcsRUFBRS9LLE1BbkJJO0FBb0JqQjBILEVBQUFBLFVBQVUsRUFBRTFILE1BcEJLO0FBcUJqQmdMLEVBQUFBLFdBQVcsRUFBRWhMLE1BckJJO0FBc0JqQnNILEVBQUFBLFFBQVEsRUFBRXJILFFBdEJPO0FBdUJqQmEsRUFBQUEsTUFBTSxFQUFFYixRQXZCUztBQXdCakJ3SSxFQUFBQSxZQUFZLEVBQUV6SSxNQXhCRztBQXlCakIwSSxFQUFBQSxLQUFLLEVBQUUxSSxNQXpCVTtBQTBCakIrSCxFQUFBQSxnQkFBZ0IsRUFBRS9ILE1BMUJEO0FBMkJqQmlMLEVBQUFBLFVBQVUsRUFBRTFGLGNBM0JLO0FBNEJqQjJGLEVBQUFBLFlBQVksRUFBRWpCLFVBNUJHO0FBNkJqQmtCLEVBQUFBLFNBQVMsRUFBRW5MLE1BN0JNO0FBOEJqQm9MLEVBQUFBLGFBQWEsRUFBRWxCLFdBOUJFO0FBK0JqQm1CLEVBQUFBLGNBQWMsRUFBRWxCLHVCQS9CQztBQWdDakJyRCxFQUFBQSxZQUFZLEVBQUVFLGdCQWhDRztBQWlDakJzRSxFQUFBQSxNQUFNLEVBQUU5QixXQWpDUztBQWtDakJRLEVBQUFBLFVBQVUsRUFBRTFKLElBQUksQ0FBQyxJQUFELEVBQU8sbUJBQVAsRUFBNEJ5SixlQUE1QjtBQWxDQyxDQUFELEVBbUNqQixJQW5DaUIsQ0FBcEI7QUFxQ0EsSUFBTXdCLE9BQU8sR0FBR25MLE1BQU0sQ0FBQztBQUNuQmtELEVBQUFBLEVBQUUsRUFBRXRELE1BRGU7QUFFbkJ3TCxFQUFBQSxRQUFRLEVBQUV4TCxNQUZTO0FBR25CeUwsRUFBQUEsYUFBYSxFQUFFakwsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFa0wsSUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsSUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxJQUFBQSxNQUFNLEVBQUU7QUFBaEMsR0FBYixDQUhKO0FBSW5CQyxFQUFBQSxTQUFTLEVBQUU3TCxNQUpRO0FBS25COEwsRUFBQUEsV0FBVyxFQUFFNUwsUUFMTTtBQU1uQjZMLEVBQUFBLGFBQWEsRUFBRTlMLFFBTkk7QUFPbkIrTCxFQUFBQSxPQUFPLEVBQUU5TCxRQVBVO0FBUW5CK0wsRUFBQUEsYUFBYSxFQUFFN0ksa0JBUkk7QUFTbkJrQixFQUFBQSxXQUFXLEVBQUV0RSxNQVRNO0FBVW5CdUUsRUFBQUEsSUFBSSxFQUFFdkUsTUFWYTtBQVduQndFLEVBQUFBLElBQUksRUFBRXhFLE1BWGE7QUFZbkJ5RSxFQUFBQSxJQUFJLEVBQUV6RSxNQVphO0FBYW5CMEUsRUFBQUEsSUFBSSxFQUFFMUUsTUFiYTtBQWNuQjJFLEVBQUFBLE9BQU8sRUFBRTNFLE1BZFU7QUFlbkJxRixFQUFBQSxLQUFLLEVBQUVyRixNQWZZO0FBZ0JuQnNGLEVBQUFBLEdBQUcsRUFBRXRGO0FBaEJjLENBQUQsRUFpQm5CLElBakJtQixDQUF0QjtBQW1CQSxJQUFNa00sa0JBQWtCLEdBQUc5TCxNQUFNLENBQUM7QUFDOUIrTCxFQUFBQSxzQkFBc0IsRUFBRWpNLFFBRE07QUFFOUJrTSxFQUFBQSxnQkFBZ0IsRUFBRWxNLFFBRlk7QUFHOUJtTSxFQUFBQSxhQUFhLEVBQUVyTSxNQUhlO0FBSTlCc00sRUFBQUEsa0JBQWtCLEVBQUU5TCxRQUFRLENBQUMsZUFBRCxFQUFrQjtBQUFFK0wsSUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JYLElBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQlksSUFBQUEsT0FBTyxFQUFFO0FBQXBDLEdBQWxCO0FBSkUsQ0FBRCxDQUFqQztBQU9BLElBQU1DLGlCQUFpQixHQUFHck0sTUFBTSxDQUFDO0FBQzdCc00sRUFBQUEsa0JBQWtCLEVBQUV4TSxRQURTO0FBRTdCeU0sRUFBQUEsTUFBTSxFQUFFek0sUUFGcUI7QUFHN0IwTSxFQUFBQSxZQUFZLEVBQUV4SjtBQUhlLENBQUQsQ0FBaEM7QUFNQSxJQUFNeUosa0JBQWtCLEdBQUd6TSxNQUFNLENBQUM7QUFDOUIwTSxFQUFBQSxZQUFZLEVBQUU5TSxNQURnQjtBQUU5QitNLEVBQUFBLGlCQUFpQixFQUFFdk0sUUFBUSxDQUFDLGNBQUQsRUFBaUI7QUFBRXdNLElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLEVBQUUsRUFBRTtBQUFsQixHQUFqQixDQUZHO0FBRzlCQyxFQUFBQSxjQUFjLEVBQUVsTixNQUhjO0FBSTlCbU4sRUFBQUEsbUJBQW1CLEVBQUUzTSxRQUFRLENBQUMsZ0JBQUQsRUFBbUI7QUFBRTRNLElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsS0FBSyxFQUFFO0FBQWxDLEdBQW5CLENBSkM7QUFLOUJDLEVBQUFBLE9BQU8sRUFBRXZOLE1BTHFCO0FBTTlCd04sRUFBQUEsY0FBYyxFQUFFeE4sTUFOYztBQU85QnlOLEVBQUFBLGlCQUFpQixFQUFFek4sTUFQVztBQVE5QjBOLEVBQUFBLFFBQVEsRUFBRXhOLFFBUm9CO0FBUzlCeU4sRUFBQUEsUUFBUSxFQUFFMU4sUUFUb0I7QUFVOUIyTixFQUFBQSxTQUFTLEVBQUUzTixRQVZtQjtBQVc5QjROLEVBQUFBLFVBQVUsRUFBRTdOLE1BWGtCO0FBWTlCOE4sRUFBQUEsSUFBSSxFQUFFOU4sTUFad0I7QUFhOUIrTixFQUFBQSxTQUFTLEVBQUUvTixNQWJtQjtBQWM5QmdPLEVBQUFBLFFBQVEsRUFBRWhPLE1BZG9CO0FBZTlCaU8sRUFBQUEsUUFBUSxFQUFFak8sTUFmb0I7QUFnQjlCa08sRUFBQUEsa0JBQWtCLEVBQUVsTyxNQWhCVTtBQWlCOUJtTyxFQUFBQSxtQkFBbUIsRUFBRW5PO0FBakJTLENBQUQsQ0FBakM7QUFvQkEsSUFBTW9PLGlCQUFpQixHQUFHaE8sTUFBTSxDQUFDO0FBQzdCbU4sRUFBQUEsT0FBTyxFQUFFdk4sTUFEb0I7QUFFN0JxTyxFQUFBQSxLQUFLLEVBQUVyTyxNQUZzQjtBQUc3QnNPLEVBQUFBLFFBQVEsRUFBRXRPLE1BSG1CO0FBSTdCcU0sRUFBQUEsYUFBYSxFQUFFck0sTUFKYztBQUs3QnNNLEVBQUFBLGtCQUFrQixFQUFFOUwsUUFBUSxDQUFDLGVBQUQsRUFBa0I7QUFBRStMLElBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWCxJQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJZLElBQUFBLE9BQU8sRUFBRTtBQUFwQyxHQUFsQixDQUxDO0FBTTdCK0IsRUFBQUEsY0FBYyxFQUFFck8sUUFOYTtBQU83QnNPLEVBQUFBLGlCQUFpQixFQUFFdE8sUUFQVTtBQVE3QnVPLEVBQUFBLFdBQVcsRUFBRXpPLE1BUmdCO0FBUzdCME8sRUFBQUEsVUFBVSxFQUFFMU8sTUFUaUI7QUFVN0IyTyxFQUFBQSxXQUFXLEVBQUUzTyxNQVZnQjtBQVc3QjRPLEVBQUFBLFlBQVksRUFBRTVPLE1BWGU7QUFZN0I2TyxFQUFBQSxlQUFlLEVBQUU3TyxNQVpZO0FBYTdCOE8sRUFBQUEsWUFBWSxFQUFFOU8sTUFiZTtBQWM3QitPLEVBQUFBLGdCQUFnQixFQUFFL08sTUFkVztBQWU3QmdQLEVBQUFBLG9CQUFvQixFQUFFaFAsTUFmTztBQWdCN0JpUCxFQUFBQSxtQkFBbUIsRUFBRWpQO0FBaEJRLENBQUQsQ0FBaEM7QUFtQkEsSUFBTWtQLGlCQUFpQixHQUFHOU8sTUFBTSxDQUFDO0FBQzdCK08sRUFBQUEsV0FBVyxFQUFFblAsTUFEZ0I7QUFFN0JvUCxFQUFBQSxnQkFBZ0IsRUFBRTVPLFFBQVEsQ0FBQyxhQUFELEVBQWdCO0FBQUU2TyxJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxJQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLEVBQUUsRUFBRTtBQUEvQixHQUFoQixDQUZHO0FBRzdCQyxFQUFBQSxjQUFjLEVBQUV4UCxNQUhhO0FBSTdCeVAsRUFBQUEsYUFBYSxFQUFFelAsTUFKYztBQUs3QjBQLEVBQUFBLFlBQVksRUFBRXhQLFFBTGU7QUFNN0J5UCxFQUFBQSxRQUFRLEVBQUV6UCxRQU5tQjtBQU83QjBQLEVBQUFBLFFBQVEsRUFBRTFQO0FBUG1CLENBQUQsQ0FBaEM7QUFVQSxJQUFNMlAsb0JBQW9CLEdBQUd6UCxNQUFNLENBQUM7QUFDaEMwUCxFQUFBQSxpQkFBaUIsRUFBRTlQLE1BRGE7QUFFaEMrUCxFQUFBQSxlQUFlLEVBQUUvUCxNQUZlO0FBR2hDZ1EsRUFBQUEsU0FBUyxFQUFFaFEsTUFIcUI7QUFJaENpUSxFQUFBQSxZQUFZLEVBQUVqUTtBQUprQixDQUFELENBQW5DO0FBT0EsSUFBTWtRLFlBQVksR0FBRzdQLEtBQUssQ0FBQ2dELE9BQUQsQ0FBMUI7QUFDQSxJQUFNOE0sV0FBVyxHQUFHL1AsTUFBTSxDQUFDO0FBQ3ZCa0QsRUFBQUEsRUFBRSxFQUFFdEQsTUFEbUI7QUFFdkJvUSxFQUFBQSxPQUFPLEVBQUVwUSxNQUZjO0FBR3ZCcVEsRUFBQUEsWUFBWSxFQUFFN1AsUUFBUSxDQUFDLFNBQUQsRUFBWTtBQUFFOFAsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxJQUFJLEVBQUUsQ0FBakM7QUFBb0NDLElBQUFBLElBQUksRUFBRSxDQUExQztBQUE2Q0MsSUFBQUEsWUFBWSxFQUFFLENBQTNEO0FBQThEQyxJQUFBQSxZQUFZLEVBQUUsQ0FBNUU7QUFBK0VDLElBQUFBLFlBQVksRUFBRSxDQUE3RjtBQUFnR0MsSUFBQUEsWUFBWSxFQUFFO0FBQTlHLEdBQVosQ0FIQztBQUl2Qm5OLEVBQUFBLE1BQU0sRUFBRTFELE1BSmU7QUFLdkIyRCxFQUFBQSxXQUFXLEVBQUVuRCxRQUFRLENBQUMsUUFBRCxFQUFXO0FBQUVvRCxJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjRyxJQUFBQSxXQUFXLEVBQUUsQ0FBM0I7QUFBOEJDLElBQUFBLFFBQVEsRUFBRSxDQUF4QztBQUEyQ0MsSUFBQUEsU0FBUyxFQUFFLENBQXREO0FBQXlEQyxJQUFBQSxPQUFPLEVBQUU7QUFBbEUsR0FBWCxDQUxFO0FBTXZCRSxFQUFBQSxRQUFRLEVBQUVwRSxNQU5hO0FBT3ZCNEcsRUFBQUEsWUFBWSxFQUFFNUcsTUFQUztBQVF2QjhRLEVBQUFBLEVBQUUsRUFBRTdRLFFBUm1CO0FBU3ZCOFEsRUFBQUEsZUFBZSxFQUFFL1EsTUFUTTtBQVV2QmdSLEVBQUFBLGFBQWEsRUFBRS9RLFFBVlE7QUFXdkJnUixFQUFBQSxHQUFHLEVBQUVqUixNQVhrQjtBQVl2QmtSLEVBQUFBLFVBQVUsRUFBRWxSLE1BWlc7QUFhdkJtUixFQUFBQSxXQUFXLEVBQUVuUixNQWJVO0FBY3ZCb1IsRUFBQUEsZ0JBQWdCLEVBQUU1USxRQUFRLENBQUMsYUFBRCxFQUFnQjtBQUFFa0wsSUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsSUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxJQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUN5RixJQUFBQSxRQUFRLEVBQUU7QUFBN0MsR0FBaEIsQ0FkSDtBQWV2QkMsRUFBQUEsVUFBVSxFQUFFdFIsTUFmVztBQWdCdkJ1UixFQUFBQSxlQUFlLEVBQUUvUSxRQUFRLENBQUMsWUFBRCxFQUFlO0FBQUVrTCxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLElBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ3lGLElBQUFBLFFBQVEsRUFBRTtBQUE3QyxHQUFmLENBaEJGO0FBaUJ2QmhQLEVBQUFBLE1BQU0sRUFBRXJDLE1BakJlO0FBa0J2QndSLEVBQUFBLFVBQVUsRUFBRWxSLElBQUksQ0FBQyxRQUFELEVBQVcsVUFBWCxFQUF1QitDLE9BQXZCLENBbEJPO0FBbUJ2Qm9PLEVBQUFBLFFBQVEsRUFBRS9LLFdBbkJhO0FBb0J2QmdMLEVBQUFBLFlBQVksRUFBRW5SLFNBQVMsQ0FBQyxVQUFELEVBQWEsVUFBYixFQUF5QjhDLE9BQXpCLENBcEJBO0FBcUJ2QnNPLEVBQUFBLFVBQVUsRUFBRXpSLFFBckJXO0FBc0J2QjBSLEVBQUFBLGdCQUFnQixFQUFFeE8sa0JBdEJLO0FBdUJ2Qm9ELEVBQUFBLFFBQVEsRUFBRXhHLE1BdkJhO0FBd0J2QnlHLEVBQUFBLFFBQVEsRUFBRXpHLE1BeEJhO0FBeUJ2QjZSLEVBQUFBLFlBQVksRUFBRTdSLE1BekJTO0FBMEJ2QjhSLEVBQUFBLE9BQU8sRUFBRTVGLGtCQTFCYztBQTJCdkJTLEVBQUFBLE1BQU0sRUFBRUYsaUJBM0JlO0FBNEJ2QnNGLEVBQUFBLE9BQU8sRUFBRWxGLGtCQTVCYztBQTZCdkJtRixFQUFBQSxNQUFNLEVBQUU1RCxpQkE3QmU7QUE4QnZCbEosRUFBQUEsTUFBTSxFQUFFZ0ssaUJBOUJlO0FBK0J2QitDLEVBQUFBLE9BQU8sRUFBRWpTLE1BL0JjO0FBZ0N2QmtTLEVBQUFBLFNBQVMsRUFBRWxTLE1BaENZO0FBaUN2Qm1TLEVBQUFBLEVBQUUsRUFBRW5TLE1BakNtQjtBQWtDdkJvUyxFQUFBQSxVQUFVLEVBQUV2QyxvQkFsQ1c7QUFtQ3ZCd0MsRUFBQUEsbUJBQW1CLEVBQUVyUyxNQW5DRTtBQW9DdkJzUyxFQUFBQSxTQUFTLEVBQUV0UyxNQXBDWTtBQXFDdkJxRixFQUFBQSxLQUFLLEVBQUVyRixNQXJDZ0I7QUFzQ3ZCc0YsRUFBQUEsR0FBRyxFQUFFdEY7QUF0Q2tCLENBQUQsRUF1Q3ZCLElBdkN1QixDQUExQjs7QUF5Q0EsU0FBU3VTLGVBQVQsQ0FBeUJDLEVBQXpCLEVBQTZCO0FBQ3pCLFNBQU87QUFDSDlSLElBQUFBLGFBQWEsRUFBRTtBQUNYRSxNQUFBQSxLQURXLGlCQUNMNlIsTUFESyxFQUNHO0FBQ1YsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUM3UixLQUFYLENBQXJCO0FBQ0g7QUFIVSxLQURaO0FBTUhDLElBQUFBLFNBQVMsRUFBRTtBQUNQQyxNQUFBQSxNQURPLGtCQUNBMlIsTUFEQSxFQUNRO0FBQ1gsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUMzUixNQUFYLENBQXJCO0FBQ0g7QUFITSxLQU5SO0FBV0hJLElBQUFBLFdBQVcsRUFBRTtBQUNUSSxNQUFBQSxpQkFEUyw2QkFDU21SLE1BRFQsRUFDaUI7QUFDdEIsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNuUixpQkFBWCxDQUFyQjtBQUNIO0FBSFEsS0FYVjtBQWdCSEMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hZLE1BQUFBLE9BREcsbUJBQ0tzUSxNQURMLEVBQ2E7QUFDWixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ3RRLE9BQVgsQ0FBckI7QUFDSCxPQUhFO0FBSUhHLE1BQUFBLE9BSkcsbUJBSUttUSxNQUpMLEVBSWE7QUFDWixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ25RLE9BQVgsQ0FBckI7QUFDSCxPQU5FO0FBT0hFLE1BQUFBLFdBUEcsdUJBT1NpUSxNQVBULEVBT2lCO0FBQ2hCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDalEsV0FBWCxDQUFyQjtBQUNILE9BVEU7QUFVSEMsTUFBQUEsY0FWRywwQkFVWWdRLE1BVlosRUFVb0I7QUFDbkIsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNoUSxjQUFYLENBQXJCO0FBQ0gsT0FaRTtBQWFIaEIsTUFBQUEsYUFBYSxFQUFFaEIsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUVpQixRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxHQUFHLEVBQUUsQ0FBcEI7QUFBdUJDLFFBQUFBLFdBQVcsRUFBRSxDQUFwQztBQUF1Q0MsUUFBQUEsS0FBSyxFQUFFLENBQTlDO0FBQWlEQyxRQUFBQSxPQUFPLEVBQUUsQ0FBMUQ7QUFBNkRDLFFBQUFBLGNBQWMsRUFBRSxDQUE3RTtBQUFnRkMsUUFBQUEsZ0JBQWdCLEVBQUU7QUFBbEcsT0FBYjtBQWJsQyxLQWhCSjtBQStCSFcsSUFBQUEsTUFBTSxFQUFFO0FBQ0pRLE1BQUFBLGVBREksMkJBQ1lzUCxNQURaLEVBQ29CO0FBQ3BCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDdFAsZUFBWCxDQUFyQjtBQUNILE9BSEc7QUFJSjFCLE1BQUFBLGFBQWEsRUFBRWhCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFaUIsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsUUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCZ0IsUUFBQUEsU0FBUyxFQUFFLENBQTFDO0FBQTZDZCxRQUFBQSxPQUFPLEVBQUUsQ0FBdEQ7QUFBeURlLFFBQUFBLGtCQUFrQixFQUFFLENBQTdFO0FBQWdGQyxRQUFBQSxPQUFPLEVBQUUsQ0FBekY7QUFBNEZDLFFBQUFBLGVBQWUsRUFBRSxDQUE3RztBQUFnSEMsUUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBdkgsT0FBYjtBQUpqQyxLQS9CTDtBQXFDSEssSUFBQUEsT0FBTyxFQUFFO0FBQ0xDLE1BQUFBLEVBREssY0FDRm1QLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7QUFJTDVOLE1BQUFBLFVBSkssc0JBSU0yTixNQUpOLEVBSWM7QUFDZixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzNOLFVBQVgsQ0FBckI7QUFDSCxPQU5JO0FBT0wzQyxNQUFBQSxPQVBLLG1CQU9Hc1EsTUFQSCxFQU9XO0FBQ1osZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUN0USxPQUFYLENBQXJCO0FBQ0gsT0FUSTtBQVVMRyxNQUFBQSxPQVZLLG1CQVVHbVEsTUFWSCxFQVVXO0FBQ1osZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNuUSxPQUFYLENBQXJCO0FBQ0gsT0FaSTtBQWFMMkMsTUFBQUEsVUFiSyxzQkFhTXdOLE1BYk4sRUFhYztBQUNmLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDeE4sVUFBWCxDQUFyQjtBQUNILE9BZkk7QUFnQkxyRSxNQUFBQSxLQWhCSyxpQkFnQkM2UixNQWhCRCxFQWdCUztBQUNWLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDN1IsS0FBWCxDQUFyQjtBQUNILE9BbEJJO0FBbUJMYSxNQUFBQSxhQUFhLEVBQUVoQixzQkFBc0IsQ0FBQyxVQUFELEVBQWE7QUFBRThDLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLFFBQUFBLEtBQUssRUFBRSxDQUF0QjtBQUF5QkMsUUFBQUEsTUFBTSxFQUFFO0FBQWpDLE9BQWIsQ0FuQmhDO0FBb0JMRSxNQUFBQSxXQUFXLEVBQUVsRCxzQkFBc0IsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLFFBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsUUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDQyxRQUFBQSxXQUFXLEVBQUUsQ0FBckQ7QUFBd0RDLFFBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsUUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxRQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0ZDLFFBQUFBLFVBQVUsRUFBRTtBQUEzRyxPQUFYO0FBcEI5QixLQXJDTjtBQTJESG9CLElBQUFBLGNBQWMsRUFBRTtBQUNaQyxNQUFBQSxXQURZLHVCQUNBaU4sTUFEQSxFQUNRO0FBQ2hCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDak4sV0FBWCxDQUFyQjtBQUNILE9BSFc7QUFJWkUsTUFBQUEsUUFKWSxvQkFJSCtNLE1BSkcsRUFJSztBQUNiLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDL00sUUFBWCxDQUFyQjtBQUNILE9BTlc7QUFPWkUsTUFBQUEsY0FQWSwwQkFPRzZNLE1BUEgsRUFPVztBQUNuQixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzdNLGNBQVgsQ0FBckI7QUFDSCxPQVRXO0FBVVpFLE1BQUFBLE9BVlksbUJBVUoyTSxNQVZJLEVBVUk7QUFDWixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzNNLE9BQVgsQ0FBckI7QUFDSCxPQVpXO0FBYVo1QyxNQUFBQSxRQWJZLG9CQWFIdVAsTUFiRyxFQWFLO0FBQ2IsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUN2UCxRQUFYLENBQXJCO0FBQ0gsT0FmVztBQWdCWitDLE1BQUFBLGFBaEJZLHlCQWdCRXdNLE1BaEJGLEVBZ0JVO0FBQ2xCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDeE0sYUFBWCxDQUFyQjtBQUNILE9BbEJXO0FBbUJaRSxNQUFBQSxNQW5CWSxrQkFtQkxzTSxNQW5CSyxFQW1CRztBQUNYLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDdE0sTUFBWCxDQUFyQjtBQUNILE9BckJXO0FBc0JaRSxNQUFBQSxhQXRCWSx5QkFzQkVvTSxNQXRCRixFQXNCVTtBQUNsQixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ3BNLGFBQVgsQ0FBckI7QUFDSDtBQXhCVyxLQTNEYjtBQXFGSGUsSUFBQUEsMkJBQTJCLEVBQUU7QUFDekJFLE1BQUFBLFFBRHlCLG9CQUNoQm1MLE1BRGdCLEVBQ1I7QUFDYixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ25MLFFBQVgsQ0FBckI7QUFDSCxPQUh3QjtBQUl6QnhHLE1BQUFBLE1BSnlCLGtCQUlsQjJSLE1BSmtCLEVBSVY7QUFDWCxlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzNSLE1BQVgsQ0FBckI7QUFDSCxPQU53QjtBQU96QjhFLE1BQUFBLGNBUHlCLDBCQU9WNk0sTUFQVSxFQU9GO0FBQ25CLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDN00sY0FBWCxDQUFyQjtBQUNILE9BVHdCO0FBVXpCMEMsTUFBQUEsYUFWeUIseUJBVVhtSyxNQVZXLEVBVUg7QUFDbEIsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNuSyxhQUFYLENBQXJCO0FBQ0gsT0Fad0I7QUFhekJKLE1BQUFBLGVBQWUsRUFBRXpILHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUFFdUMsUUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBV21GLFFBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsUUFBQUEsS0FBSyxFQUFFO0FBQTVCLE9BQWY7QUFiZCxLQXJGMUI7QUFvR0hRLElBQUFBLG9CQUFvQixFQUFFO0FBQ2xCQyxNQUFBQSxJQURrQixnQkFDYjRKLE1BRGEsRUFDTDtBQUNULGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDNUosSUFBWCxDQUFyQjtBQUNILE9BSGlCO0FBSWxCRSxNQUFBQSxNQUprQixrQkFJWDBKLE1BSlcsRUFJSDtBQUNYLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDMUosTUFBWCxDQUFyQjtBQUNIO0FBTmlCLEtBcEduQjtBQTRHSGdCLElBQUFBLGVBQWUsRUFBRTtBQUNiekcsTUFBQUEsRUFEYSxjQUNWbVAsTUFEVSxFQUNGO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0g7QUFIWSxLQTVHZDtBQWlISHRJLElBQUFBLEtBQUssRUFBRTtBQUNIOUcsTUFBQUEsRUFERyxjQUNBbVAsTUFEQSxFQUNRO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FIRTtBQUlIMUksTUFBQUEsVUFKRyxzQkFJUXlJLE1BSlIsRUFJZ0JFLEtBSmhCLEVBSXVCQyxPQUp2QixFQUlnQztBQUMvQixlQUFPQSxPQUFPLENBQUNKLEVBQVIsQ0FBV0ssaUJBQVgsQ0FBNkJDLGFBQTdCLENBQTJDTCxNQUFNLENBQUNuUCxFQUFsRCxDQUFQO0FBQ0gsT0FORTtBQU9IZ0UsTUFBQUEsUUFQRyxvQkFPTW1MLE1BUE4sRUFPYztBQUNiLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDbkwsUUFBWCxDQUFyQjtBQUNILE9BVEU7QUFVSHhHLE1BQUFBLE1BVkcsa0JBVUkyUixNQVZKLEVBVVk7QUFDWCxlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzNSLE1BQVgsQ0FBckI7QUFDSCxPQVpFO0FBYUg2QyxNQUFBQSxXQUFXLEVBQUVsRCxzQkFBc0IsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNJLFFBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsU0FBUyxFQUFFLENBQXRDO0FBQXlDQyxRQUFBQSxPQUFPLEVBQUU7QUFBbEQsT0FBWDtBQWJoQyxLQWpISjtBQWdJSHFILElBQUFBLE9BQU8sRUFBRTtBQUNMakksTUFBQUEsRUFESyxjQUNGbVAsTUFERSxFQUNNO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FISTtBQUlMNUcsTUFBQUEsV0FKSyx1QkFJTzJHLE1BSlAsRUFJZTtBQUNoQixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQzNHLFdBQVgsQ0FBckI7QUFDSCxPQU5JO0FBT0xDLE1BQUFBLGFBUEsseUJBT1MwRyxNQVBULEVBT2lCO0FBQ2xCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDMUcsYUFBWCxDQUFyQjtBQUNILE9BVEk7QUFVTEMsTUFBQUEsT0FWSyxtQkFVR3lHLE1BVkgsRUFVVztBQUNaLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDekcsT0FBWCxDQUFyQjtBQUNILE9BWkk7QUFhTFAsTUFBQUEsYUFBYSxFQUFFaEwsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUVpTCxRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLFFBQUFBLE1BQU0sRUFBRTtBQUFoQyxPQUFiO0FBYmhDLEtBaElOO0FBK0lITSxJQUFBQSxrQkFBa0IsRUFBRTtBQUNoQkMsTUFBQUEsc0JBRGdCLGtDQUNPc0csTUFEUCxFQUNlO0FBQzNCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDdEcsc0JBQVgsQ0FBckI7QUFDSCxPQUhlO0FBSWhCQyxNQUFBQSxnQkFKZ0IsNEJBSUNxRyxNQUpELEVBSVM7QUFDckIsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNyRyxnQkFBWCxDQUFyQjtBQUNILE9BTmU7QUFPaEJFLE1BQUFBLGtCQUFrQixFQUFFN0wsc0JBQXNCLENBQUMsZUFBRCxFQUFrQjtBQUFFOEwsUUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JYLFFBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQlksUUFBQUEsT0FBTyxFQUFFO0FBQXBDLE9BQWxCO0FBUDFCLEtBL0lqQjtBQXdKSEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkMsTUFBQUEsa0JBRGUsOEJBQ0krRixNQURKLEVBQ1k7QUFDdkIsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUMvRixrQkFBWCxDQUFyQjtBQUNILE9BSGM7QUFJZkMsTUFBQUEsTUFKZSxrQkFJUjhGLE1BSlEsRUFJQTtBQUNYLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDOUYsTUFBWCxDQUFyQjtBQUNIO0FBTmMsS0F4SmhCO0FBZ0tIRSxJQUFBQSxrQkFBa0IsRUFBRTtBQUNoQmEsTUFBQUEsUUFEZ0Isb0JBQ1ArRSxNQURPLEVBQ0M7QUFDYixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQy9FLFFBQVgsQ0FBckI7QUFDSCxPQUhlO0FBSWhCQyxNQUFBQSxRQUpnQixvQkFJUDhFLE1BSk8sRUFJQztBQUNiLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDOUUsUUFBWCxDQUFyQjtBQUNILE9BTmU7QUFPaEJDLE1BQUFBLFNBUGdCLHFCQU9ONkUsTUFQTSxFQU9FO0FBQ2QsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUM3RSxTQUFYLENBQXJCO0FBQ0gsT0FUZTtBQVVoQmIsTUFBQUEsaUJBQWlCLEVBQUV0TSxzQkFBc0IsQ0FBQyxjQUFELEVBQWlCO0FBQUV1TSxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxRQUFBQSxFQUFFLEVBQUU7QUFBbEIsT0FBakIsQ0FWekI7QUFXaEJFLE1BQUFBLG1CQUFtQixFQUFFMU0sc0JBQXNCLENBQUMsZ0JBQUQsRUFBbUI7QUFBRTJNLFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLFFBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsS0FBSyxFQUFFO0FBQWxDLE9BQW5CO0FBWDNCLEtBaEtqQjtBQTZLSGMsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkcsTUFBQUEsY0FEZSwwQkFDQWtFLE1BREEsRUFDUTtBQUNuQixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ2xFLGNBQVgsQ0FBckI7QUFDSCxPQUhjO0FBSWZDLE1BQUFBLGlCQUplLDZCQUlHaUUsTUFKSCxFQUlXO0FBQ3RCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDakUsaUJBQVgsQ0FBckI7QUFDSCxPQU5jO0FBT2ZsQyxNQUFBQSxrQkFBa0IsRUFBRTdMLHNCQUFzQixDQUFDLGVBQUQsRUFBa0I7QUFBRThMLFFBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWCxRQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJZLFFBQUFBLE9BQU8sRUFBRTtBQUFwQyxPQUFsQjtBQVAzQixLQTdLaEI7QUFzTEgwQyxJQUFBQSxpQkFBaUIsRUFBRTtBQUNmUSxNQUFBQSxZQURlLHdCQUNGK0MsTUFERSxFQUNNO0FBQ2pCLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDL0MsWUFBWCxDQUFyQjtBQUNILE9BSGM7QUFJZkMsTUFBQUEsUUFKZSxvQkFJTjhDLE1BSk0sRUFJRTtBQUNiLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDOUMsUUFBWCxDQUFyQjtBQUNILE9BTmM7QUFPZkMsTUFBQUEsUUFQZSxvQkFPTjZDLE1BUE0sRUFPRTtBQUNiLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDN0MsUUFBWCxDQUFyQjtBQUNILE9BVGM7QUFVZlIsTUFBQUEsZ0JBQWdCLEVBQUUzTyxzQkFBc0IsQ0FBQyxhQUFELEVBQWdCO0FBQUU0TyxRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLEVBQUUsRUFBRTtBQUEvQixPQUFoQjtBQVZ6QixLQXRMaEI7QUFrTUhZLElBQUFBLFdBQVcsRUFBRTtBQUNUN00sTUFBQUEsRUFEUyxjQUNObVAsTUFETSxFQUNFO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FIUTtBQUlUbEIsTUFBQUEsVUFKUyxzQkFJRWlCLE1BSkYsRUFJVUUsS0FKVixFQUlpQkMsT0FKakIsRUFJMEI7QUFDL0IsZUFBT0EsT0FBTyxDQUFDSixFQUFSLENBQVdPLFFBQVgsQ0FBb0JELGFBQXBCLENBQWtDTCxNQUFNLENBQUNwUSxNQUF6QyxDQUFQO0FBQ0gsT0FOUTtBQU9UcVAsTUFBQUEsWUFQUyx3QkFPSWUsTUFQSixFQU9ZRSxLQVBaLEVBT21CQyxPQVBuQixFQU80QjtBQUNqQyxlQUFPQSxPQUFPLENBQUNKLEVBQVIsQ0FBV08sUUFBWCxDQUFvQkMsZUFBcEIsQ0FBb0NQLE1BQU0sQ0FBQ2hCLFFBQTNDLENBQVA7QUFDSCxPQVRRO0FBVVRYLE1BQUFBLEVBVlMsY0FVTjJCLE1BVk0sRUFVRTtBQUNQLGVBQU90UyxjQUFjLENBQUMsQ0FBRCxFQUFJc1MsTUFBTSxDQUFDM0IsRUFBWCxDQUFyQjtBQUNILE9BWlE7QUFhVEUsTUFBQUEsYUFiUyx5QkFhS3lCLE1BYkwsRUFhYTtBQUNsQixlQUFPdFMsY0FBYyxDQUFDLENBQUQsRUFBSXNTLE1BQU0sQ0FBQ3pCLGFBQVgsQ0FBckI7QUFDSCxPQWZRO0FBZ0JUVyxNQUFBQSxVQWhCUyxzQkFnQkVjLE1BaEJGLEVBZ0JVO0FBQ2YsZUFBT3RTLGNBQWMsQ0FBQyxDQUFELEVBQUlzUyxNQUFNLENBQUNkLFVBQVgsQ0FBckI7QUFDSCxPQWxCUTtBQW1CVHRCLE1BQUFBLFlBQVksRUFBRTVQLHNCQUFzQixDQUFDLFNBQUQsRUFBWTtBQUFFNlAsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxJQUFJLEVBQUUsQ0FBakM7QUFBb0NDLFFBQUFBLElBQUksRUFBRSxDQUExQztBQUE2Q0MsUUFBQUEsWUFBWSxFQUFFLENBQTNEO0FBQThEQyxRQUFBQSxZQUFZLEVBQUUsQ0FBNUU7QUFBK0VDLFFBQUFBLFlBQVksRUFBRSxDQUE3RjtBQUFnR0MsUUFBQUEsWUFBWSxFQUFFO0FBQTlHLE9BQVosQ0FuQjNCO0FBb0JUbE4sTUFBQUEsV0FBVyxFQUFFbEQsc0JBQXNCLENBQUMsUUFBRCxFQUFXO0FBQUVtRCxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjRyxRQUFBQSxXQUFXLEVBQUUsQ0FBM0I7QUFBOEJDLFFBQUFBLFFBQVEsRUFBRSxDQUF4QztBQUEyQ0MsUUFBQUEsU0FBUyxFQUFFLENBQXREO0FBQXlEQyxRQUFBQSxPQUFPLEVBQUU7QUFBbEUsT0FBWCxDQXBCMUI7QUFxQlRrTixNQUFBQSxnQkFBZ0IsRUFBRTNRLHNCQUFzQixDQUFDLGFBQUQsRUFBZ0I7QUFBRWlMLFFBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLFFBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3QkMsUUFBQUEsTUFBTSxFQUFFLENBQWhDO0FBQW1DeUYsUUFBQUEsUUFBUSxFQUFFO0FBQTdDLE9BQWhCLENBckIvQjtBQXNCVEUsTUFBQUEsZUFBZSxFQUFFOVEsc0JBQXNCLENBQUMsWUFBRCxFQUFlO0FBQUVpTCxRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLFFBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ3lGLFFBQUFBLFFBQVEsRUFBRTtBQUE3QyxPQUFmO0FBdEI5QixLQWxNVjtBQTBOSDRCLElBQUFBLEtBQUssRUFBRTtBQUNIRixNQUFBQSxRQUFRLEVBQUVQLEVBQUUsQ0FBQ08sUUFBSCxDQUFZRyxhQUFaLEVBRFA7QUFFSEwsTUFBQUEsaUJBQWlCLEVBQUVMLEVBQUUsQ0FBQ0ssaUJBQUgsQ0FBcUJLLGFBQXJCLEVBRmhCO0FBR0hDLE1BQUFBLE1BQU0sRUFBRVgsRUFBRSxDQUFDVyxNQUFILENBQVVELGFBQVYsRUFITDtBQUlIRSxNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRixhQUFaLEVBSlA7QUFLSHJNLE1BQUFBLFlBQVksRUFBRTJMLEVBQUUsQ0FBQzNMLFlBQUgsQ0FBZ0JxTSxhQUFoQjtBQUxYLEtBMU5KO0FBaU9IRyxJQUFBQSxZQUFZLEVBQUU7QUFDVk4sTUFBQUEsUUFBUSxFQUFFUCxFQUFFLENBQUNPLFFBQUgsQ0FBWU8sb0JBQVosRUFEQTtBQUVWVCxNQUFBQSxpQkFBaUIsRUFBRUwsRUFBRSxDQUFDSyxpQkFBSCxDQUFxQlMsb0JBQXJCLEVBRlQ7QUFHVkgsTUFBQUEsTUFBTSxFQUFFWCxFQUFFLENBQUNXLE1BQUgsQ0FBVUcsb0JBQVYsRUFIRTtBQUlWRixNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRSxvQkFBWixFQUpBO0FBS1Z6TSxNQUFBQSxZQUFZLEVBQUUyTCxFQUFFLENBQUMzTCxZQUFILENBQWdCeU0sb0JBQWhCO0FBTEo7QUFqT1gsR0FBUDtBQXlPSDs7QUFFREMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JqQixFQUFBQSxlQUFlLEVBQWZBLGVBRGE7QUFFYjdSLEVBQUFBLGFBQWEsRUFBYkEsYUFGYTtBQUdiRyxFQUFBQSxTQUFTLEVBQVRBLFNBSGE7QUFJYkssRUFBQUEsV0FBVyxFQUFYQSxXQUphO0FBS2JLLEVBQUFBLEtBQUssRUFBTEEsS0FMYTtBQU1ib0IsRUFBQUEsTUFBTSxFQUFOQSxNQU5hO0FBT2JVLEVBQUFBLE9BQU8sRUFBUEEsT0FQYTtBQVFia0MsRUFBQUEsY0FBYyxFQUFkQSxjQVJhO0FBU2JnQixFQUFBQSw2QkFBNkIsRUFBN0JBLDZCQVRhO0FBVWJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBVmE7QUFXYkssRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFYYTtBQVliSSxFQUFBQSwyQkFBMkIsRUFBM0JBLDJCQVphO0FBYWJvQixFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQWJhO0FBY2JJLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBZGE7QUFlYkssRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkFmYTtBQWdCYk8sRUFBQUEsV0FBVyxFQUFYQSxXQWhCYTtBQWlCYkssRUFBQUEseUJBQXlCLEVBQXpCQSx5QkFqQmE7QUFrQmJFLEVBQUFBLGVBQWUsRUFBZkEsZUFsQmE7QUFtQmJLLEVBQUFBLEtBQUssRUFBTEEsS0FuQmE7QUFvQmJtQixFQUFBQSxPQUFPLEVBQVBBLE9BcEJhO0FBcUJiVyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQXJCYTtBQXNCYk8sRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF0QmE7QUF1QmJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBdkJhO0FBd0JidUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF4QmE7QUF5QmJjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBekJhO0FBMEJiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTFCYTtBQTJCYk0sRUFBQUEsV0FBVyxFQUFYQTtBQTNCYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLmZldGNoRG9jQnlLZXkocGFyZW50LmlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLmZldGNoRG9jQnlLZXkocGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy5mZXRjaERvY3NCeUtleXMocGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==