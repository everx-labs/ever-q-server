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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJVbmluaXQiLCJBY3RpdmUiLCJGcm96ZW4iLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsImZldGNoRG9jQnlLZXkiLCJibG9ja3Nfc2lnbmF0dXJlcyIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQVdJQSxPQUFPLENBQUMsY0FBRCxDO0lBVlBDLE0sWUFBQUEsTTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsUSxZ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VEEsU0FIYTtBQUliSyxFQUFBQSxXQUFXLEVBQVhBLFdBSmE7QUFLYkssRUFBQUEsS0FBSyxFQUFMQSxLQUxhO0FBTWJvQixFQUFBQSxNQUFNLEVBQU5BLE1BTmE7QUFPYlUsRUFBQUEsT0FBTyxFQUFQQSxPQVBhO0FBUWJrQyxFQUFBQSxjQUFjLEVBQWRBLGNBUmE7QUFTYmdCLEVBQUFBLDZCQUE2QixFQUE3QkEsNkJBVGE7QUFVYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFWYTtBQVdiSyxFQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQVhhO0FBWWJJLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBWmE7QUFhYm9CLEVBQUFBLHNCQUFzQixFQUF0QkEsc0JBYmE7QUFjYkksRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWZhO0FBZ0JiTyxFQUFBQSxXQUFXLEVBQVhBLFdBaEJhO0FBaUJiSyxFQUFBQSx5QkFBeUIsRUFBekJBLHlCQWpCYTtBQWtCYkUsRUFBQUEsZUFBZSxFQUFmQSxlQWxCYTtBQW1CYkssRUFBQUEsS0FBSyxFQUFMQSxLQW5CYTtBQW9CYm1CLEVBQUFBLE9BQU8sRUFBUEEsT0FwQmE7QUFxQmJXLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBckJhO0FBc0JiTyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXRCYTtBQXVCYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkF2QmE7QUF3QmJ1QixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXhCYTtBQXlCYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF6QmE7QUEwQmJXLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBMUJhO0FBMkJiTSxFQUFBQSxXQUFXLEVBQVhBO0FBM0JhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KE90aGVyQ3VycmVuY3kpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuZmV0Y2hEb2NCeUtleShjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLCBwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuZmV0Y2hEb2NCeUtleShjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jc0J5S2V5cyhjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2Nrc19zaWduYXR1cmVzLCBCbG9ja1NpZ25hdHVyZXMpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2Nrc19zaWduYXR1cmVzLCBCbG9ja1NpZ25hdHVyZXMpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19