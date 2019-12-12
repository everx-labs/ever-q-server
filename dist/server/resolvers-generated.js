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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0Is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S0FBSyxFQUFMQSxLQUxhO0FBTWJvQixFQUFBQSxNQUFNLEVBQU5BLE1BTmE7QUFPYlUsRUFBQUEsT0FBTyxFQUFQQSxPQVBhO0FBUWJrQyxFQUFBQSxjQUFjLEVBQWRBLGNBUmE7QUFTYmdCLEVBQUFBLDZCQUE2QixFQUE3QkEsNkJBVGE7QUFVYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFWYTtBQVdiSyxFQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQVhhO0FBWWJJLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBWmE7QUFhYm9CLEVBQUFBLHNCQUFzQixFQUF0QkEsc0JBYmE7QUFjYkksRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWZhO0FBZ0JiTyxFQUFBQSxXQUFXLEVBQVhBLFdBaEJhO0FBaUJiUSxFQUFBQSxLQUFLLEVBQUxBLEtBakJhO0FBa0JibUIsRUFBQUEsT0FBTyxFQUFQQSxPQWxCYTtBQW1CYlcsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFuQmE7QUFvQmJPLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBcEJhO0FBcUJiSSxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQXJCYTtBQXNCYnVCLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBdEJhO0FBdUJiYyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXZCYTtBQXdCYlcsRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkF4QmE7QUF5QmJNLEVBQUFBLFdBQVcsRUFBWEE7QUF6QmEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vcS10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3Rlcixcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuZmV0Y2hEb2NCeUtleShjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jc0J5S2V5cyhjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19