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
var MessageValueOther = struct({
  currency: scalar,
  value: bigUInt2
});
var MessageValueOtherArray = array(MessageValueOther);
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
  value_other: MessageValueOtherArray,
  proof: scalar,
  boc: scalar
}, true);
var BlockValueFlowToNextBlkOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowExportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFromPrevBlkOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowMintedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowToNextBlkOtherArray = array(BlockValueFlowToNextBlkOther);
var BlockValueFlowExportedOtherArray = array(BlockValueFlowExportedOther);
var BlockValueFlowFeesCollectedOtherArray = array(BlockValueFlowFeesCollectedOther);
var BlockValueFlowCreatedOtherArray = array(BlockValueFlowCreatedOther);
var BlockValueFlowImportedOtherArray = array(BlockValueFlowImportedOther);
var BlockValueFlowFromPrevBlkOtherArray = array(BlockValueFlowFromPrevBlkOther);
var BlockValueFlowMintedOtherArray = array(BlockValueFlowMintedOther);
var BlockValueFlowFeesImportedOtherArray = array(BlockValueFlowFeesImportedOther);
var BlockValueFlow = struct({
  to_next_blk: bigUInt2,
  to_next_blk_other: BlockValueFlowToNextBlkOtherArray,
  exported: bigUInt2,
  exported_other: BlockValueFlowExportedOtherArray,
  fees_collected: bigUInt2,
  fees_collected_other: BlockValueFlowFeesCollectedOtherArray,
  created: bigUInt2,
  created_other: BlockValueFlowCreatedOtherArray,
  imported: bigUInt2,
  imported_other: BlockValueFlowImportedOtherArray,
  from_prev_blk: bigUInt2,
  from_prev_blk_other: BlockValueFlowFromPrevBlkOtherArray,
  minted: bigUInt2,
  minted_other: BlockValueFlowMintedOtherArray,
  fees_imported: bigUInt2,
  fees_imported_other: BlockValueFlowFeesImportedOtherArray
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
var BlockMasterShardHashesDescrFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardHashesDescrFundsCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardHashesDescrFeesCollectedOtherArray = array(BlockMasterShardHashesDescrFeesCollectedOther);
var BlockMasterShardHashesDescrFundsCreatedOtherArray = array(BlockMasterShardHashesDescrFundsCreatedOther);
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
  fees_collected_other: BlockMasterShardHashesDescrFeesCollectedOtherArray,
  funds_created: bigUInt2,
  funds_created_other: BlockMasterShardHashesDescrFundsCreatedOtherArray
});
var BlockMasterShardHashes = struct({
  workchain_id: scalar,
  shard: scalar,
  descr: BlockMasterShardHashesDescr
});
var BlockMasterShardFeesFeesOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardFeesCreateOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardFeesFeesOtherArray = array(BlockMasterShardFeesFeesOther);
var BlockMasterShardFeesCreateOtherArray = array(BlockMasterShardFeesCreateOther);
var BlockMasterShardFees = struct({
  workchain_id: scalar,
  shard: scalar,
  fees: bigUInt2,
  fees_other: BlockMasterShardFeesFeesOtherArray,
  create: bigUInt2,
  create_other: BlockMasterShardFeesCreateOtherArray
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
var AccountBalanceOther = struct({
  currency: scalar,
  value: bigUInt2
});
var AccountBalanceOtherArray = array(AccountBalanceOther);
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
  balance_other: AccountBalanceOtherArray,
  split_depth: scalar,
  tick: scalar,
  tock: scalar,
  code: scalar,
  data: scalar,
  library: scalar,
  proof: scalar,
  boc: scalar
}, true);
var TransactionTotalFeesOther = struct({
  currency: scalar,
  value: bigUInt2
});
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
var TransactionCreditCreditOther = struct({
  currency: scalar,
  value: bigUInt2
});
var TransactionCreditCreditOtherArray = array(TransactionCreditCreditOther);
var TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: bigUInt2,
  credit_other: TransactionCreditCreditOtherArray
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
var TransactionTotalFeesOtherArray = array(TransactionTotalFeesOther);
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
  total_fees_other: TransactionTotalFeesOtherArray,
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
    MessageValueOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
    BlockValueFlowToNextBlkOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowExportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFromPrevBlkOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowMintedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
    BlockMasterShardHashesDescrFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardHashesDescrFundsCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
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
    BlockMasterShardFeesFeesOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardFeesCreateOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
    AccountBalanceOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
    TransactionTotalFeesOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
    TransactionCreditCreditOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
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
  ExtBlkRef: ExtBlkRef,
  MsgEnvelope: MsgEnvelope,
  InMsg: InMsg,
  OutMsg: OutMsg,
  MessageValueOther: MessageValueOther,
  Message: Message,
  BlockValueFlowToNextBlkOther: BlockValueFlowToNextBlkOther,
  BlockValueFlowExportedOther: BlockValueFlowExportedOther,
  BlockValueFlowFeesCollectedOther: BlockValueFlowFeesCollectedOther,
  BlockValueFlowCreatedOther: BlockValueFlowCreatedOther,
  BlockValueFlowImportedOther: BlockValueFlowImportedOther,
  BlockValueFlowFromPrevBlkOther: BlockValueFlowFromPrevBlkOther,
  BlockValueFlowMintedOther: BlockValueFlowMintedOther,
  BlockValueFlowFeesImportedOther: BlockValueFlowFeesImportedOther,
  BlockValueFlow: BlockValueFlow,
  BlockAccountBlocksStateUpdate: BlockAccountBlocksStateUpdate,
  BlockAccountBlocks: BlockAccountBlocks,
  BlockStateUpdate: BlockStateUpdate,
  BlockMasterShardHashesDescrFeesCollectedOther: BlockMasterShardHashesDescrFeesCollectedOther,
  BlockMasterShardHashesDescrFundsCreatedOther: BlockMasterShardHashesDescrFundsCreatedOther,
  BlockMasterShardHashesDescr: BlockMasterShardHashesDescr,
  BlockMasterShardHashes: BlockMasterShardHashes,
  BlockMasterShardFeesFeesOther: BlockMasterShardFeesFeesOther,
  BlockMasterShardFeesCreateOther: BlockMasterShardFeesCreateOther,
  BlockMasterShardFees: BlockMasterShardFees,
  BlockMasterPrevBlkSignatures: BlockMasterPrevBlkSignatures,
  BlockMaster: BlockMaster,
  Block: Block,
  AccountBalanceOther: AccountBalanceOther,
  Account: Account,
  TransactionTotalFeesOther: TransactionTotalFeesOther,
  TransactionStorage: TransactionStorage,
  TransactionCreditCreditOther: TransactionCreditCreditOther,
  TransactionCredit: TransactionCredit,
  TransactionCompute: TransactionCompute,
  TransactionAction: TransactionAction,
  TransactionBounce: TransactionBounce,
  TransactionSplitInfo: TransactionSplitInfo,
  Transaction: Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52Mi5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2ciLCJtc2dfdHlwZSIsIm1zZ190eXBlX25hbWUiLCJFeHRlcm5hbCIsIklociIsIkltbWVkaWF0ZWx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwibXNnIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIk1lc3NhZ2VWYWx1ZU90aGVyIiwiY3VycmVuY3kiLCJ2YWx1ZSIsIk1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FB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QTRCYk8sRUFBQUEsV0FBVyxFQUFYQSxXQTVCYTtBQTZCYlEsRUFBQUEsS0FBSyxFQUFMQSxLQTdCYTtBQThCYm1CLEVBQUFBLG1CQUFtQixFQUFuQkEsbUJBOUJhO0FBK0JiRSxFQUFBQSxPQUFPLEVBQVBBLE9BL0JhO0FBZ0NiVyxFQUFBQSx5QkFBeUIsRUFBekJBLHlCQWhDYTtBQWlDYkMsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFqQ2E7QUFrQ2JPLEVBQUFBLDRCQUE0QixFQUE1QkEsNEJBbENhO0FBbUNiRSxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQW5DYTtBQW9DYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFwQ2E7QUFxQ2J1QixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXJDYTtBQXNDYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF0Q2E7QUF1Q2JXLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBdkNhO0FBd0NiTyxFQUFBQSxXQUFXLEVBQVhBO0FBeENhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL3EtdHlwZXMuanMnKTtcbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlckFycmF5ID0gYXJyYXkoTWVzc2FnZVZhbHVlT3RoZXIpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXJBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuZmV0Y2hEb2NCeUtleShjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jc0J5S2V5cyhjb250ZXh0LmRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==