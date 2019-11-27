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

function createResolvers(db, postRequests, info) {
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
      in_message: function in_message(parent) {
        return db.fetchDocByKey(db.messages, parent.in_msg);
      },
      out_messages: function out_messages(parent) {
        return db.fetchDocsByKeys(db.messages, parent.out_msgs);
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
      info: info,
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
    },
    Mutation: {
      postRequests: postRequests
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52Mi5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2ciLCJtc2dfdHlwZSIsIm1zZ190eXBlX25hbWUiLCJFeHRlcm5hbCIsIklociIsIkltbWVkaWF0ZWx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwibXNnIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIk1lc3NhZ2VWYWx1ZU90aGVyIiwiY3VycmVuY3kiLCJ2YWx1ZSIsIk1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBvc3RSZXF1ZXN0cyIsImluZm8iLCJwYXJlbnQiLCJfa2V5IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJNdXRhdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0IsWUFBQUEsc0I7O0FBRUosSUFBTUMsU0FBUyxHQUFHTixNQUFNLENBQUM7QUFDckJPLEVBQUFBLE1BQU0sRUFBRVYsUUFEYTtBQUVyQlcsRUFBQUEsTUFBTSxFQUFFWixNQUZhO0FBR3JCYSxFQUFBQSxTQUFTLEVBQUViLE1BSFU7QUFJckJjLEVBQUFBLFNBQVMsRUFBRWQ7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWUsV0FBVyxHQUFHWCxNQUFNLENBQUM7QUFDdkJZLEVBQUFBLE1BQU0sRUFBRWhCLE1BRGU7QUFFdkJpQixFQUFBQSxTQUFTLEVBQUVqQixNQUZZO0FBR3ZCa0IsRUFBQUEsUUFBUSxFQUFFbEIsTUFIYTtBQUl2Qm1CLEVBQUFBLGlCQUFpQixFQUFFakI7QUFKSSxDQUFELENBQTFCO0FBT0EsSUFBTWtCLEtBQUssR0FBR2hCLE1BQU0sQ0FBQztBQUNqQmlCLEVBQUFBLFFBQVEsRUFBRXJCLE1BRE87QUFFakJzQixFQUFBQSxhQUFhLEVBQUVkLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRWUsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsR0FBRyxFQUFFLENBQXBCO0FBQXVCQyxJQUFBQSxXQUFXLEVBQUUsQ0FBcEM7QUFBdUNDLElBQUFBLEtBQUssRUFBRSxDQUE5QztBQUFpREMsSUFBQUEsT0FBTyxFQUFFLENBQTFEO0FBQTZEQyxJQUFBQSxjQUFjLEVBQUUsQ0FBN0U7QUFBZ0ZDLElBQUFBLGdCQUFnQixFQUFFO0FBQWxHLEdBQWIsQ0FGTjtBQUdqQkMsRUFBQUEsR0FBRyxFQUFFOUIsTUFIWTtBQUlqQitCLEVBQUFBLFdBQVcsRUFBRS9CLE1BSkk7QUFLakJnQyxFQUFBQSxPQUFPLEVBQUU5QixRQUxRO0FBTWpCK0IsRUFBQUEsYUFBYSxFQUFFakMsTUFORTtBQU9qQmtDLEVBQUFBLE1BQU0sRUFBRW5CLFdBUFM7QUFRakJvQixFQUFBQSxPQUFPLEVBQUVqQyxRQVJRO0FBU2pCa0MsRUFBQUEsT0FBTyxFQUFFckIsV0FUUTtBQVVqQnNCLEVBQUFBLFdBQVcsRUFBRW5DLFFBVkk7QUFXakJvQyxFQUFBQSxjQUFjLEVBQUVyQyxRQVhDO0FBWWpCc0MsRUFBQUEsZUFBZSxFQUFFdkM7QUFaQSxDQUFELENBQXBCO0FBZUEsSUFBTXdDLE1BQU0sR0FBR3BDLE1BQU0sQ0FBQztBQUNsQmlCLEVBQUFBLFFBQVEsRUFBRXJCLE1BRFE7QUFFbEJzQixFQUFBQSxhQUFhLEVBQUVkLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRWUsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsSUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCZ0IsSUFBQUEsU0FBUyxFQUFFLENBQTFDO0FBQTZDZCxJQUFBQSxPQUFPLEVBQUUsQ0FBdEQ7QUFBeURlLElBQUFBLGtCQUFrQixFQUFFLENBQTdFO0FBQWdGQyxJQUFBQSxPQUFPLEVBQUUsQ0FBekY7QUFBNEZDLElBQUFBLGVBQWUsRUFBRSxDQUE3RztBQUFnSEMsSUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBdkgsR0FBYixDQUZMO0FBR2xCZixFQUFBQSxHQUFHLEVBQUU5QixNQUhhO0FBSWxCK0IsRUFBQUEsV0FBVyxFQUFFL0IsTUFKSztBQUtsQm9DLEVBQUFBLE9BQU8sRUFBRXJCLFdBTFM7QUFNbEIrQixFQUFBQSxRQUFRLEVBQUUxQixLQU5RO0FBT2xCMkIsRUFBQUEsUUFBUSxFQUFFM0IsS0FQUTtBQVFsQjRCLEVBQUFBLGVBQWUsRUFBRS9DO0FBUkMsQ0FBRCxDQUFyQjtBQVdBLElBQU1nRCxpQkFBaUIsR0FBRzdDLE1BQU0sQ0FBQztBQUM3QjhDLEVBQUFBLFFBQVEsRUFBRWxELE1BRG1CO0FBRTdCbUQsRUFBQUEsS0FBSyxFQUFFakQ7QUFGc0IsQ0FBRCxDQUFoQztBQUtBLElBQU1rRCxzQkFBc0IsR0FBRy9DLEtBQUssQ0FBQzRDLGlCQUFELENBQXBDO0FBQ0EsSUFBTUksT0FBTyxHQUFHakQsTUFBTSxDQUFDO0FBQ25Ca0QsRUFBQUEsRUFBRSxFQUFFdEQsTUFEZTtBQUVuQnFCLEVBQUFBLFFBQVEsRUFBRXJCLE1BRlM7QUFHbkJzQixFQUFBQSxhQUFhLEVBQUVkLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRStDLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEtBQUssRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsTUFBTSxFQUFFO0FBQWpDLEdBQWIsQ0FISjtBQUluQkMsRUFBQUEsTUFBTSxFQUFFMUQsTUFKVztBQUtuQjJELEVBQUFBLFdBQVcsRUFBRW5ELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW9ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDQyxJQUFBQSxXQUFXLEVBQUUsQ0FBckQ7QUFBd0RDLElBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsSUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxJQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0ZDLElBQUFBLFVBQVUsRUFBRTtBQUEzRyxHQUFYLENBTEY7QUFNbkJDLEVBQUFBLFFBQVEsRUFBRXBFLE1BTlM7QUFPbkJxRSxFQUFBQSxJQUFJLEVBQUVyRSxNQVBhO0FBUW5Cc0UsRUFBQUEsV0FBVyxFQUFFdEUsTUFSTTtBQVNuQnVFLEVBQUFBLElBQUksRUFBRXZFLE1BVGE7QUFVbkJ3RSxFQUFBQSxJQUFJLEVBQUV4RSxNQVZhO0FBV25CeUUsRUFBQUEsSUFBSSxFQUFFekUsTUFYYTtBQVluQjBFLEVBQUFBLElBQUksRUFBRTFFLE1BWmE7QUFhbkIyRSxFQUFBQSxPQUFPLEVBQUUzRSxNQWJVO0FBY25CNEUsRUFBQUEsR0FBRyxFQUFFNUUsTUFkYztBQWVuQjZFLEVBQUFBLEdBQUcsRUFBRTdFLE1BZmM7QUFnQm5COEUsRUFBQUEsVUFBVSxFQUFFN0UsUUFoQk87QUFpQm5COEUsRUFBQUEsVUFBVSxFQUFFL0UsTUFqQk87QUFrQm5CZ0YsRUFBQUEsWUFBWSxFQUFFaEYsTUFsQks7QUFtQm5CZ0MsRUFBQUEsT0FBTyxFQUFFOUIsUUFuQlU7QUFvQm5CaUMsRUFBQUEsT0FBTyxFQUFFakMsUUFwQlU7QUFxQm5CK0UsRUFBQUEsVUFBVSxFQUFFL0UsUUFyQk87QUFzQm5CZ0YsRUFBQUEsTUFBTSxFQUFFbEYsTUF0Qlc7QUF1Qm5CbUYsRUFBQUEsT0FBTyxFQUFFbkYsTUF2QlU7QUF3Qm5CbUQsRUFBQUEsS0FBSyxFQUFFakQsUUF4Qlk7QUF5Qm5Ca0YsRUFBQUEsV0FBVyxFQUFFaEMsc0JBekJNO0FBMEJuQmlDLEVBQUFBLEtBQUssRUFBRXJGLE1BMUJZO0FBMkJuQnNGLEVBQUFBLEdBQUcsRUFBRXRGO0FBM0JjLENBQUQsRUE0Qm5CLElBNUJtQixDQUF0QjtBQThCQSxJQUFNdUYsNEJBQTRCLEdBQUduRixNQUFNLENBQUM7QUFDeEM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQ4QjtBQUV4Q21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRmlDLENBQUQsQ0FBM0M7QUFLQSxJQUFNc0YsMkJBQTJCLEdBQUdwRixNQUFNLENBQUM7QUFDdkM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQ2QjtBQUV2Q21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRmdDLENBQUQsQ0FBMUM7QUFLQSxJQUFNdUYsZ0NBQWdDLEdBQUdyRixNQUFNLENBQUM7QUFDNUM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQURrQztBQUU1Q21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRnFDLENBQUQsQ0FBL0M7QUFLQSxJQUFNd0YsMEJBQTBCLEdBQUd0RixNQUFNLENBQUM7QUFDdEM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQ0QjtBQUV0Q21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRitCLENBQUQsQ0FBekM7QUFLQSxJQUFNeUYsMkJBQTJCLEdBQUd2RixNQUFNLENBQUM7QUFDdkM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQ2QjtBQUV2Q21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRmdDLENBQUQsQ0FBMUM7QUFLQSxJQUFNMEYsOEJBQThCLEdBQUd4RixNQUFNLENBQUM7QUFDMUM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQURnQztBQUUxQ21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRm1DLENBQUQsQ0FBN0M7QUFLQSxJQUFNMkYseUJBQXlCLEdBQUd6RixNQUFNLENBQUM7QUFDckM4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQyQjtBQUVyQ21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRjhCLENBQUQsQ0FBeEM7QUFLQSxJQUFNNEYsK0JBQStCLEdBQUcxRixNQUFNLENBQUM7QUFDM0M4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQURpQztBQUUzQ21ELEVBQUFBLEtBQUssRUFBRWpEO0FBRm9DLENBQUQsQ0FBOUM7QUFLQSxJQUFNNkYsaUNBQWlDLEdBQUcxRixLQUFLLENBQUNrRiw0QkFBRCxDQUEvQztBQUNBLElBQU1TLGdDQUFnQyxHQUFHM0YsS0FBSyxDQUFDbUYsMkJBQUQsQ0FBOUM7QUFDQSxJQUFNUyxxQ0FBcUMsR0FBRzVGLEtBQUssQ0FBQ29GLGdDQUFELENBQW5EO0FBQ0EsSUFBTVMsK0JBQStCLEdBQUc3RixLQUFLLENBQUNxRiwwQkFBRCxDQUE3QztBQUNBLElBQU1TLGdDQUFnQyxHQUFHOUYsS0FBSyxDQUFDc0YsMkJBQUQsQ0FBOUM7QUFDQSxJQUFNUyxtQ0FBbUMsR0FBRy9GLEtBQUssQ0FBQ3VGLDhCQUFELENBQWpEO0FBQ0EsSUFBTVMsOEJBQThCLEdBQUdoRyxLQUFLLENBQUN3Rix5QkFBRCxDQUE1QztBQUNBLElBQU1TLG9DQUFvQyxHQUFHakcsS0FBSyxDQUFDeUYsK0JBQUQsQ0FBbEQ7QUFDQSxJQUFNUyxjQUFjLEdBQUduRyxNQUFNLENBQUM7QUFDMUJvRyxFQUFBQSxXQUFXLEVBQUV0RyxRQURhO0FBRTFCdUcsRUFBQUEsaUJBQWlCLEVBQUVWLGlDQUZPO0FBRzFCVyxFQUFBQSxRQUFRLEVBQUV4RyxRQUhnQjtBQUkxQnlHLEVBQUFBLGNBQWMsRUFBRVgsZ0NBSlU7QUFLMUJZLEVBQUFBLGNBQWMsRUFBRTFHLFFBTFU7QUFNMUIyRyxFQUFBQSxvQkFBb0IsRUFBRVoscUNBTkk7QUFPMUJhLEVBQUFBLE9BQU8sRUFBRTVHLFFBUGlCO0FBUTFCNkcsRUFBQUEsYUFBYSxFQUFFYiwrQkFSVztBQVMxQm5ELEVBQUFBLFFBQVEsRUFBRTdDLFFBVGdCO0FBVTFCOEcsRUFBQUEsY0FBYyxFQUFFYixnQ0FWVTtBQVcxQmMsRUFBQUEsYUFBYSxFQUFFL0csUUFYVztBQVkxQmdILEVBQUFBLG1CQUFtQixFQUFFZCxtQ0FaSztBQWExQmUsRUFBQUEsTUFBTSxFQUFFakgsUUFia0I7QUFjMUJrSCxFQUFBQSxZQUFZLEVBQUVmLDhCQWRZO0FBZTFCZ0IsRUFBQUEsYUFBYSxFQUFFbkgsUUFmVztBQWdCMUJvSCxFQUFBQSxtQkFBbUIsRUFBRWhCO0FBaEJLLENBQUQsQ0FBN0I7QUFtQkEsSUFBTWlCLDZCQUE2QixHQUFHbkgsTUFBTSxDQUFDO0FBQ3pDb0gsRUFBQUEsUUFBUSxFQUFFeEgsTUFEK0I7QUFFekN5SCxFQUFBQSxRQUFRLEVBQUV6SDtBQUYrQixDQUFELENBQTVDO0FBS0EsSUFBTTBILFdBQVcsR0FBR3JILEtBQUssQ0FBQ0wsTUFBRCxDQUF6QjtBQUNBLElBQU0ySCxrQkFBa0IsR0FBR3ZILE1BQU0sQ0FBQztBQUM5QndILEVBQUFBLFlBQVksRUFBRTVILE1BRGdCO0FBRTlCNkgsRUFBQUEsWUFBWSxFQUFFSCxXQUZnQjtBQUc5QkksRUFBQUEsWUFBWSxFQUFFUCw2QkFIZ0I7QUFJOUJRLEVBQUFBLFFBQVEsRUFBRS9IO0FBSm9CLENBQUQsQ0FBakM7QUFPQSxJQUFNZ0ksZ0JBQWdCLEdBQUc1SCxNQUFNLENBQUM7QUFDNUIsU0FBS0osTUFEdUI7QUFFNUJ5SCxFQUFBQSxRQUFRLEVBQUV6SCxNQUZrQjtBQUc1QmlJLEVBQUFBLFNBQVMsRUFBRWpJLE1BSGlCO0FBSTVCa0ksRUFBQUEsR0FBRyxFQUFFbEksTUFKdUI7QUFLNUJ3SCxFQUFBQSxRQUFRLEVBQUV4SCxNQUxrQjtBQU01Qm1JLEVBQUFBLFNBQVMsRUFBRW5JO0FBTmlCLENBQUQsQ0FBL0I7QUFTQSxJQUFNb0ksNkNBQTZDLEdBQUdoSSxNQUFNLENBQUM7QUFDekQ4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQrQztBQUV6RG1ELEVBQUFBLEtBQUssRUFBRWpEO0FBRmtELENBQUQsQ0FBNUQ7QUFLQSxJQUFNbUksNENBQTRDLEdBQUdqSSxNQUFNLENBQUM7QUFDeEQ4QyxFQUFBQSxRQUFRLEVBQUVsRCxNQUQ4QztBQUV4RG1ELEVBQUFBLEtBQUssRUFBRWpEO0FBRmlELENBQUQsQ0FBM0Q7QUFLQSxJQUFNb0ksa0RBQWtELEdBQUdqSSxLQUFLLENBQUMrSCw2Q0FBRCxDQUFoRTtBQUNBLElBQU1HLGlEQUFpRCxHQUFHbEksS0FBSyxDQUFDZ0ksNENBQUQsQ0FBL0Q7QUFDQSxJQUFNRywyQkFBMkIsR0FBR3BJLE1BQU0sQ0FBQztBQUN2Q1EsRUFBQUEsTUFBTSxFQUFFWixNQUQrQjtBQUV2Q3lJLEVBQUFBLFlBQVksRUFBRXpJLE1BRnlCO0FBR3ZDMEksRUFBQUEsUUFBUSxFQUFFekksUUFINkI7QUFJdkNVLEVBQUFBLE1BQU0sRUFBRVYsUUFKK0I7QUFLdkNZLEVBQUFBLFNBQVMsRUFBRWIsTUFMNEI7QUFNdkNjLEVBQUFBLFNBQVMsRUFBRWQsTUFONEI7QUFPdkMySSxFQUFBQSxZQUFZLEVBQUUzSSxNQVB5QjtBQVF2QzRJLEVBQUFBLFlBQVksRUFBRTVJLE1BUnlCO0FBU3ZDNkksRUFBQUEsVUFBVSxFQUFFN0ksTUFUMkI7QUFVdkM4SSxFQUFBQSxVQUFVLEVBQUU5SSxNQVYyQjtBQVd2QytJLEVBQUFBLGFBQWEsRUFBRS9JLE1BWHdCO0FBWXZDZ0osRUFBQUEsS0FBSyxFQUFFaEosTUFaZ0M7QUFhdkNpSixFQUFBQSxtQkFBbUIsRUFBRWpKLE1BYmtCO0FBY3ZDa0osRUFBQUEsb0JBQW9CLEVBQUVsSixNQWRpQjtBQWV2Q21KLEVBQUFBLGdCQUFnQixFQUFFbkosTUFmcUI7QUFnQnZDb0osRUFBQUEsU0FBUyxFQUFFcEosTUFoQjRCO0FBaUJ2Q3FKLEVBQUFBLFVBQVUsRUFBRXJKLE1BakIyQjtBQWtCdkNzSixFQUFBQSxlQUFlLEVBQUU5SSxRQUFRLENBQUMsWUFBRCxFQUFlO0FBQUVxQyxJQUFBQSxJQUFJLEVBQUUsQ0FBUjtBQUFXMEcsSUFBQUEsS0FBSyxFQUFFLENBQWxCO0FBQXFCQyxJQUFBQSxLQUFLLEVBQUU7QUFBNUIsR0FBZixDQWxCYztBQW1CdkNDLEVBQUFBLEtBQUssRUFBRXpKLE1BbkJnQztBQW9CdkM0RyxFQUFBQSxjQUFjLEVBQUUxRyxRQXBCdUI7QUFxQnZDMkcsRUFBQUEsb0JBQW9CLEVBQUV5QixrREFyQmlCO0FBc0J2Q29CLEVBQUFBLGFBQWEsRUFBRXhKLFFBdEJ3QjtBQXVCdkN5SixFQUFBQSxtQkFBbUIsRUFBRXBCO0FBdkJrQixDQUFELENBQTFDO0FBMEJBLElBQU1xQixzQkFBc0IsR0FBR3hKLE1BQU0sQ0FBQztBQUNsQ3lKLEVBQUFBLFlBQVksRUFBRTdKLE1BRG9CO0FBRWxDOEosRUFBQUEsS0FBSyxFQUFFOUosTUFGMkI7QUFHbEMrSixFQUFBQSxLQUFLLEVBQUV2QjtBQUgyQixDQUFELENBQXJDO0FBTUEsSUFBTXdCLDZCQUE2QixHQUFHNUosTUFBTSxDQUFDO0FBQ3pDOEMsRUFBQUEsUUFBUSxFQUFFbEQsTUFEK0I7QUFFekNtRCxFQUFBQSxLQUFLLEVBQUVqRDtBQUZrQyxDQUFELENBQTVDO0FBS0EsSUFBTStKLCtCQUErQixHQUFHN0osTUFBTSxDQUFDO0FBQzNDOEMsRUFBQUEsUUFBUSxFQUFFbEQsTUFEaUM7QUFFM0NtRCxFQUFBQSxLQUFLLEVBQUVqRDtBQUZvQyxDQUFELENBQTlDO0FBS0EsSUFBTWdLLGtDQUFrQyxHQUFHN0osS0FBSyxDQUFDMkosNkJBQUQsQ0FBaEQ7QUFDQSxJQUFNRyxvQ0FBb0MsR0FBRzlKLEtBQUssQ0FBQzRKLCtCQUFELENBQWxEO0FBQ0EsSUFBTUcsb0JBQW9CLEdBQUdoSyxNQUFNLENBQUM7QUFDaEN5SixFQUFBQSxZQUFZLEVBQUU3SixNQURrQjtBQUVoQzhKLEVBQUFBLEtBQUssRUFBRTlKLE1BRnlCO0FBR2hDcUssRUFBQUEsSUFBSSxFQUFFbkssUUFIMEI7QUFJaENvSyxFQUFBQSxVQUFVLEVBQUVKLGtDQUpvQjtBQUtoQ0ssRUFBQUEsTUFBTSxFQUFFckssUUFMd0I7QUFNaENzSyxFQUFBQSxZQUFZLEVBQUVMO0FBTmtCLENBQUQsQ0FBbkM7QUFTQSxJQUFNTSw0QkFBNEIsR0FBR3JLLE1BQU0sQ0FBQztBQUN4Q3NLLEVBQUFBLE9BQU8sRUFBRTFLLE1BRCtCO0FBRXhDMkssRUFBQUEsQ0FBQyxFQUFFM0ssTUFGcUM7QUFHeEM0SyxFQUFBQSxDQUFDLEVBQUU1SztBQUhxQyxDQUFELENBQTNDO0FBTUEsSUFBTTZLLDJCQUEyQixHQUFHeEssS0FBSyxDQUFDdUosc0JBQUQsQ0FBekM7QUFDQSxJQUFNa0IseUJBQXlCLEdBQUd6SyxLQUFLLENBQUMrSixvQkFBRCxDQUF2QztBQUNBLElBQU1XLGlDQUFpQyxHQUFHMUssS0FBSyxDQUFDb0ssNEJBQUQsQ0FBL0M7QUFDQSxJQUFNTyxXQUFXLEdBQUc1SyxNQUFNLENBQUM7QUFDdkI2SyxFQUFBQSxZQUFZLEVBQUVKLDJCQURTO0FBRXZCSyxFQUFBQSxVQUFVLEVBQUVKLHlCQUZXO0FBR3ZCSyxFQUFBQSxrQkFBa0IsRUFBRS9KLEtBSEc7QUFJdkJnSyxFQUFBQSxtQkFBbUIsRUFBRUw7QUFKRSxDQUFELENBQTFCO0FBT0EsSUFBTU0sVUFBVSxHQUFHaEwsS0FBSyxDQUFDZSxLQUFELENBQXhCO0FBQ0EsSUFBTWtLLFdBQVcsR0FBR2pMLEtBQUssQ0FBQ21DLE1BQUQsQ0FBekI7QUFDQSxJQUFNK0ksdUJBQXVCLEdBQUdsTCxLQUFLLENBQUNzSCxrQkFBRCxDQUFyQztBQUNBLElBQU02RCxLQUFLLEdBQUdwTCxNQUFNLENBQUM7QUFDakJrRCxFQUFBQSxFQUFFLEVBQUV0RCxNQURhO0FBRWpCMEQsRUFBQUEsTUFBTSxFQUFFMUQsTUFGUztBQUdqQjJELEVBQUFBLFdBQVcsRUFBRW5ELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW9ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNJLElBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsU0FBUyxFQUFFLENBQXRDO0FBQXlDQyxJQUFBQSxPQUFPLEVBQUU7QUFBbEQsR0FBWCxDQUhKO0FBSWpCdUgsRUFBQUEsU0FBUyxFQUFFekwsTUFKTTtBQUtqQjZJLEVBQUFBLFVBQVUsRUFBRTdJLE1BTEs7QUFNakJZLEVBQUFBLE1BQU0sRUFBRVosTUFOUztBQU9qQjBMLEVBQUFBLFdBQVcsRUFBRTFMLE1BUEk7QUFRakJvSixFQUFBQSxTQUFTLEVBQUVwSixNQVJNO0FBU2pCMkwsRUFBQUEsa0JBQWtCLEVBQUUzTCxNQVRIO0FBVWpCZ0osRUFBQUEsS0FBSyxFQUFFaEosTUFWVTtBQVdqQjRMLEVBQUFBLFVBQVUsRUFBRWxMLFNBWEs7QUFZakJtTCxFQUFBQSxRQUFRLEVBQUVuTCxTQVpPO0FBYWpCb0wsRUFBQUEsWUFBWSxFQUFFcEwsU0FiRztBQWNqQnFMLEVBQUFBLGFBQWEsRUFBRXJMLFNBZEU7QUFlakJzTCxFQUFBQSxpQkFBaUIsRUFBRXRMLFNBZkY7QUFnQmpCdUwsRUFBQUEsT0FBTyxFQUFFak0sTUFoQlE7QUFpQmpCa00sRUFBQUEsNkJBQTZCLEVBQUVsTSxNQWpCZDtBQWtCakIySSxFQUFBQSxZQUFZLEVBQUUzSSxNQWxCRztBQW1CakJtTSxFQUFBQSxXQUFXLEVBQUVuTSxNQW5CSTtBQW9CakI4SSxFQUFBQSxVQUFVLEVBQUU5SSxNQXBCSztBQXFCakJvTSxFQUFBQSxXQUFXLEVBQUVwTSxNQXJCSTtBQXNCakIwSSxFQUFBQSxRQUFRLEVBQUV6SSxRQXRCTztBQXVCakJVLEVBQUFBLE1BQU0sRUFBRVYsUUF2QlM7QUF3QmpCNEosRUFBQUEsWUFBWSxFQUFFN0osTUF4Qkc7QUF5QmpCOEosRUFBQUEsS0FBSyxFQUFFOUosTUF6QlU7QUEwQmpCbUosRUFBQUEsZ0JBQWdCLEVBQUVuSixNQTFCRDtBQTJCakJxTSxFQUFBQSxVQUFVLEVBQUU5RixjQTNCSztBQTRCakIrRixFQUFBQSxZQUFZLEVBQUVqQixVQTVCRztBQTZCakJrQixFQUFBQSxTQUFTLEVBQUV2TSxNQTdCTTtBQThCakJ3TSxFQUFBQSxhQUFhLEVBQUVsQixXQTlCRTtBQStCakJtQixFQUFBQSxjQUFjLEVBQUVsQix1QkEvQkM7QUFnQ2pCekQsRUFBQUEsWUFBWSxFQUFFRSxnQkFoQ0c7QUFpQ2pCMEUsRUFBQUEsTUFBTSxFQUFFMUI7QUFqQ1MsQ0FBRCxFQWtDakIsSUFsQ2lCLENBQXBCO0FBb0NBLElBQU0yQixtQkFBbUIsR0FBR3ZNLE1BQU0sQ0FBQztBQUMvQjhDLEVBQUFBLFFBQVEsRUFBRWxELE1BRHFCO0FBRS9CbUQsRUFBQUEsS0FBSyxFQUFFakQ7QUFGd0IsQ0FBRCxDQUFsQztBQUtBLElBQU0wTSx3QkFBd0IsR0FBR3ZNLEtBQUssQ0FBQ3NNLG1CQUFELENBQXRDO0FBQ0EsSUFBTUUsT0FBTyxHQUFHek0sTUFBTSxDQUFDO0FBQ25Ca0QsRUFBQUEsRUFBRSxFQUFFdEQsTUFEZTtBQUVuQjhNLEVBQUFBLFFBQVEsRUFBRTlNLE1BRlM7QUFHbkIrTSxFQUFBQSxhQUFhLEVBQUV2TSxRQUFRLENBQUMsVUFBRCxFQUFhO0FBQUV3TSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLElBQUFBLE1BQU0sRUFBRTtBQUFoQyxHQUFiLENBSEo7QUFJbkJDLEVBQUFBLFNBQVMsRUFBRW5OLE1BSlE7QUFLbkJvTixFQUFBQSxXQUFXLEVBQUVsTixRQUxNO0FBTW5CbU4sRUFBQUEsYUFBYSxFQUFFcE4sUUFOSTtBQU9uQnFOLEVBQUFBLE9BQU8sRUFBRXBOLFFBUFU7QUFRbkJxTixFQUFBQSxhQUFhLEVBQUVYLHdCQVJJO0FBU25CdEksRUFBQUEsV0FBVyxFQUFFdEUsTUFUTTtBQVVuQnVFLEVBQUFBLElBQUksRUFBRXZFLE1BVmE7QUFXbkJ3RSxFQUFBQSxJQUFJLEVBQUV4RSxNQVhhO0FBWW5CeUUsRUFBQUEsSUFBSSxFQUFFekUsTUFaYTtBQWFuQjBFLEVBQUFBLElBQUksRUFBRTFFLE1BYmE7QUFjbkIyRSxFQUFBQSxPQUFPLEVBQUUzRSxNQWRVO0FBZW5CcUYsRUFBQUEsS0FBSyxFQUFFckYsTUFmWTtBQWdCbkJzRixFQUFBQSxHQUFHLEVBQUV0RjtBQWhCYyxDQUFELEVBaUJuQixJQWpCbUIsQ0FBdEI7QUFtQkEsSUFBTXdOLHlCQUF5QixHQUFHcE4sTUFBTSxDQUFDO0FBQ3JDOEMsRUFBQUEsUUFBUSxFQUFFbEQsTUFEMkI7QUFFckNtRCxFQUFBQSxLQUFLLEVBQUVqRDtBQUY4QixDQUFELENBQXhDO0FBS0EsSUFBTXVOLGtCQUFrQixHQUFHck4sTUFBTSxDQUFDO0FBQzlCc04sRUFBQUEsc0JBQXNCLEVBQUV4TixRQURNO0FBRTlCeU4sRUFBQUEsZ0JBQWdCLEVBQUV6TixRQUZZO0FBRzlCME4sRUFBQUEsYUFBYSxFQUFFNU4sTUFIZTtBQUk5QjZOLEVBQUFBLGtCQUFrQixFQUFFck4sUUFBUSxDQUFDLGVBQUQsRUFBa0I7QUFBRXNOLElBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWixJQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJhLElBQUFBLE9BQU8sRUFBRTtBQUFwQyxHQUFsQjtBQUpFLENBQUQsQ0FBakM7QUFPQSxJQUFNQyw0QkFBNEIsR0FBRzVOLE1BQU0sQ0FBQztBQUN4QzhDLEVBQUFBLFFBQVEsRUFBRWxELE1BRDhCO0FBRXhDbUQsRUFBQUEsS0FBSyxFQUFFakQ7QUFGaUMsQ0FBRCxDQUEzQztBQUtBLElBQU0rTixpQ0FBaUMsR0FBRzVOLEtBQUssQ0FBQzJOLDRCQUFELENBQS9DO0FBQ0EsSUFBTUUsaUJBQWlCLEdBQUc5TixNQUFNLENBQUM7QUFDN0IrTixFQUFBQSxrQkFBa0IsRUFBRWpPLFFBRFM7QUFFN0JrTyxFQUFBQSxNQUFNLEVBQUVsTyxRQUZxQjtBQUc3Qm1PLEVBQUFBLFlBQVksRUFBRUo7QUFIZSxDQUFELENBQWhDO0FBTUEsSUFBTUssa0JBQWtCLEdBQUdsTyxNQUFNLENBQUM7QUFDOUJtTyxFQUFBQSxZQUFZLEVBQUV2TyxNQURnQjtBQUU5QndPLEVBQUFBLGlCQUFpQixFQUFFaE8sUUFBUSxDQUFDLGNBQUQsRUFBaUI7QUFBRWlPLElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLEVBQUUsRUFBRTtBQUFsQixHQUFqQixDQUZHO0FBRzlCQyxFQUFBQSxjQUFjLEVBQUUzTyxNQUhjO0FBSTlCNE8sRUFBQUEsbUJBQW1CLEVBQUVwTyxRQUFRLENBQUMsZ0JBQUQsRUFBbUI7QUFBRXFPLElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsS0FBSyxFQUFFO0FBQWxDLEdBQW5CLENBSkM7QUFLOUJDLEVBQUFBLE9BQU8sRUFBRWhQLE1BTHFCO0FBTTlCaVAsRUFBQUEsY0FBYyxFQUFFalAsTUFOYztBQU85QmtQLEVBQUFBLGlCQUFpQixFQUFFbFAsTUFQVztBQVE5Qm1QLEVBQUFBLFFBQVEsRUFBRWpQLFFBUm9CO0FBUzlCa1AsRUFBQUEsUUFBUSxFQUFFblAsUUFUb0I7QUFVOUJvUCxFQUFBQSxTQUFTLEVBQUVwUCxRQVZtQjtBQVc5QnFQLEVBQUFBLFVBQVUsRUFBRXRQLE1BWGtCO0FBWTlCdVAsRUFBQUEsSUFBSSxFQUFFdlAsTUFad0I7QUFhOUJ3UCxFQUFBQSxTQUFTLEVBQUV4UCxNQWJtQjtBQWM5QnlQLEVBQUFBLFFBQVEsRUFBRXpQLE1BZG9CO0FBZTlCMFAsRUFBQUEsUUFBUSxFQUFFMVAsTUFmb0I7QUFnQjlCMlAsRUFBQUEsa0JBQWtCLEVBQUUzUCxNQWhCVTtBQWlCOUI0UCxFQUFBQSxtQkFBbUIsRUFBRTVQO0FBakJTLENBQUQsQ0FBakM7QUFvQkEsSUFBTTZQLGlCQUFpQixHQUFHelAsTUFBTSxDQUFDO0FBQzdCNE8sRUFBQUEsT0FBTyxFQUFFaFAsTUFEb0I7QUFFN0I4UCxFQUFBQSxLQUFLLEVBQUU5UCxNQUZzQjtBQUc3QitQLEVBQUFBLFFBQVEsRUFBRS9QLE1BSG1CO0FBSTdCNE4sRUFBQUEsYUFBYSxFQUFFNU4sTUFKYztBQUs3QjZOLEVBQUFBLGtCQUFrQixFQUFFck4sUUFBUSxDQUFDLGVBQUQsRUFBa0I7QUFBRXNOLElBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWixJQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJhLElBQUFBLE9BQU8sRUFBRTtBQUFwQyxHQUFsQixDQUxDO0FBTTdCaUMsRUFBQUEsY0FBYyxFQUFFOVAsUUFOYTtBQU83QitQLEVBQUFBLGlCQUFpQixFQUFFL1AsUUFQVTtBQVE3QmdRLEVBQUFBLFdBQVcsRUFBRWxRLE1BUmdCO0FBUzdCbVEsRUFBQUEsVUFBVSxFQUFFblEsTUFUaUI7QUFVN0JvUSxFQUFBQSxXQUFXLEVBQUVwUSxNQVZnQjtBQVc3QnFRLEVBQUFBLFlBQVksRUFBRXJRLE1BWGU7QUFZN0JzUSxFQUFBQSxlQUFlLEVBQUV0USxNQVpZO0FBYTdCdVEsRUFBQUEsWUFBWSxFQUFFdlEsTUFiZTtBQWM3QndRLEVBQUFBLGdCQUFnQixFQUFFeFEsTUFkVztBQWU3QnlRLEVBQUFBLG9CQUFvQixFQUFFelEsTUFmTztBQWdCN0IwUSxFQUFBQSxtQkFBbUIsRUFBRTFRO0FBaEJRLENBQUQsQ0FBaEM7QUFtQkEsSUFBTTJRLGlCQUFpQixHQUFHdlEsTUFBTSxDQUFDO0FBQzdCd1EsRUFBQUEsV0FBVyxFQUFFNVEsTUFEZ0I7QUFFN0I2USxFQUFBQSxnQkFBZ0IsRUFBRXJRLFFBQVEsQ0FBQyxhQUFELEVBQWdCO0FBQUVzUSxJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxJQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLEVBQUUsRUFBRTtBQUEvQixHQUFoQixDQUZHO0FBRzdCQyxFQUFBQSxjQUFjLEVBQUVqUixNQUhhO0FBSTdCa1IsRUFBQUEsYUFBYSxFQUFFbFIsTUFKYztBQUs3Qm1SLEVBQUFBLFlBQVksRUFBRWpSLFFBTGU7QUFNN0JrUixFQUFBQSxRQUFRLEVBQUVsUixRQU5tQjtBQU83Qm1SLEVBQUFBLFFBQVEsRUFBRW5SO0FBUG1CLENBQUQsQ0FBaEM7QUFVQSxJQUFNb1Isb0JBQW9CLEdBQUdsUixNQUFNLENBQUM7QUFDaENtUixFQUFBQSxpQkFBaUIsRUFBRXZSLE1BRGE7QUFFaEN3UixFQUFBQSxlQUFlLEVBQUV4UixNQUZlO0FBR2hDeVIsRUFBQUEsU0FBUyxFQUFFelIsTUFIcUI7QUFJaEMwUixFQUFBQSxZQUFZLEVBQUUxUjtBQUprQixDQUFELENBQW5DO0FBT0EsSUFBTTJSLFlBQVksR0FBR3RSLEtBQUssQ0FBQ2dELE9BQUQsQ0FBMUI7QUFDQSxJQUFNdU8sOEJBQThCLEdBQUd2UixLQUFLLENBQUNtTix5QkFBRCxDQUE1QztBQUNBLElBQU1xRSxXQUFXLEdBQUd6UixNQUFNLENBQUM7QUFDdkJrRCxFQUFBQSxFQUFFLEVBQUV0RCxNQURtQjtBQUV2QjhSLEVBQUFBLE9BQU8sRUFBRTlSLE1BRmM7QUFHdkIrUixFQUFBQSxZQUFZLEVBQUV2UixRQUFRLENBQUMsU0FBRCxFQUFZO0FBQUV3UixJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxJQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLElBQUksRUFBRSxDQUFqQztBQUFvQ0MsSUFBQUEsSUFBSSxFQUFFLENBQTFDO0FBQTZDQyxJQUFBQSxZQUFZLEVBQUUsQ0FBM0Q7QUFBOERDLElBQUFBLFlBQVksRUFBRSxDQUE1RTtBQUErRUMsSUFBQUEsWUFBWSxFQUFFLENBQTdGO0FBQWdHQyxJQUFBQSxZQUFZLEVBQUU7QUFBOUcsR0FBWixDQUhDO0FBSXZCN08sRUFBQUEsTUFBTSxFQUFFMUQsTUFKZTtBQUt2QjJELEVBQUFBLFdBQVcsRUFBRW5ELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW9ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNHLElBQUFBLFdBQVcsRUFBRSxDQUEzQjtBQUE4QkMsSUFBQUEsUUFBUSxFQUFFLENBQXhDO0FBQTJDQyxJQUFBQSxTQUFTLEVBQUUsQ0FBdEQ7QUFBeURDLElBQUFBLE9BQU8sRUFBRTtBQUFsRSxHQUFYLENBTEU7QUFNdkJFLEVBQUFBLFFBQVEsRUFBRXBFLE1BTmE7QUFPdkI0SCxFQUFBQSxZQUFZLEVBQUU1SCxNQVBTO0FBUXZCd1MsRUFBQUEsRUFBRSxFQUFFdlMsUUFSbUI7QUFTdkJ3UyxFQUFBQSxlQUFlLEVBQUV6UyxNQVRNO0FBVXZCMFMsRUFBQUEsYUFBYSxFQUFFelMsUUFWUTtBQVd2QjBTLEVBQUFBLEdBQUcsRUFBRTNTLE1BWGtCO0FBWXZCNFMsRUFBQUEsVUFBVSxFQUFFNVMsTUFaVztBQWF2QjZTLEVBQUFBLFdBQVcsRUFBRTdTLE1BYlU7QUFjdkI4UyxFQUFBQSxnQkFBZ0IsRUFBRXRTLFFBQVEsQ0FBQyxhQUFELEVBQWdCO0FBQUV3TSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLElBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQzZGLElBQUFBLFFBQVEsRUFBRTtBQUE3QyxHQUFoQixDQWRIO0FBZXZCQyxFQUFBQSxVQUFVLEVBQUVoVCxNQWZXO0FBZ0J2QmlULEVBQUFBLGVBQWUsRUFBRXpTLFFBQVEsQ0FBQyxZQUFELEVBQWU7QUFBRXdNLElBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLElBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3QkMsSUFBQUEsTUFBTSxFQUFFLENBQWhDO0FBQW1DNkYsSUFBQUEsUUFBUSxFQUFFO0FBQTdDLEdBQWYsQ0FoQkY7QUFpQnZCN1EsRUFBQUEsTUFBTSxFQUFFbEMsTUFqQmU7QUFrQnZCa1QsRUFBQUEsVUFBVSxFQUFFNVMsSUFBSSxDQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCK0MsT0FBdkIsQ0FsQk87QUFtQnZCOFAsRUFBQUEsUUFBUSxFQUFFekwsV0FuQmE7QUFvQnZCMEwsRUFBQUEsWUFBWSxFQUFFN1MsU0FBUyxDQUFDLFVBQUQsRUFBYSxVQUFiLEVBQXlCOEMsT0FBekIsQ0FwQkE7QUFxQnZCZ1EsRUFBQUEsVUFBVSxFQUFFblQsUUFyQlc7QUFzQnZCb1QsRUFBQUEsZ0JBQWdCLEVBQUUxQiw4QkF0Qks7QUF1QnZCcEssRUFBQUEsUUFBUSxFQUFFeEgsTUF2QmE7QUF3QnZCeUgsRUFBQUEsUUFBUSxFQUFFekgsTUF4QmE7QUF5QnZCdVQsRUFBQUEsWUFBWSxFQUFFdlQsTUF6QlM7QUEwQnZCd1QsRUFBQUEsT0FBTyxFQUFFL0Ysa0JBMUJjO0FBMkJ2QlcsRUFBQUEsTUFBTSxFQUFFRixpQkEzQmU7QUE0QnZCdUYsRUFBQUEsT0FBTyxFQUFFbkYsa0JBNUJjO0FBNkJ2Qm9GLEVBQUFBLE1BQU0sRUFBRTdELGlCQTdCZTtBQThCdkIzSyxFQUFBQSxNQUFNLEVBQUV5TCxpQkE5QmU7QUErQnZCZ0QsRUFBQUEsT0FBTyxFQUFFM1QsTUEvQmM7QUFnQ3ZCNFQsRUFBQUEsU0FBUyxFQUFFNVQsTUFoQ1k7QUFpQ3ZCNlQsRUFBQUEsRUFBRSxFQUFFN1QsTUFqQ21CO0FBa0N2QjhULEVBQUFBLFVBQVUsRUFBRXhDLG9CQWxDVztBQW1DdkJ5QyxFQUFBQSxtQkFBbUIsRUFBRS9ULE1BbkNFO0FBb0N2QmdVLEVBQUFBLFNBQVMsRUFBRWhVLE1BcENZO0FBcUN2QnFGLEVBQUFBLEtBQUssRUFBRXJGLE1BckNnQjtBQXNDdkJzRixFQUFBQSxHQUFHLEVBQUV0RjtBQXRDa0IsQ0FBRCxFQXVDdkIsSUF2Q3VCLENBQTFCOztBQXlDQSxTQUFTaVUsZUFBVCxDQUF5QkMsRUFBekIsRUFBNkJDLFlBQTdCLEVBQTJDQyxJQUEzQyxFQUFpRDtBQUM3QyxTQUFPO0FBQ0gxVCxJQUFBQSxTQUFTLEVBQUU7QUFDUEMsTUFBQUEsTUFETyxrQkFDQTBULE1BREEsRUFDUTtBQUNYLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDMVQsTUFBWCxDQUFyQjtBQUNIO0FBSE0sS0FEUjtBQU1ISSxJQUFBQSxXQUFXLEVBQUU7QUFDVEksTUFBQUEsaUJBRFMsNkJBQ1NrVCxNQURULEVBQ2lCO0FBQ3RCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFQsaUJBQVgsQ0FBckI7QUFDSDtBQUhRLEtBTlY7QUFXSEMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hZLE1BQUFBLE9BREcsbUJBQ0txUyxNQURMLEVBQ2E7QUFDWixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ3JTLE9BQVgsQ0FBckI7QUFDSCxPQUhFO0FBSUhHLE1BQUFBLE9BSkcsbUJBSUtrUyxNQUpMLEVBSWE7QUFDWixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xTLE9BQVgsQ0FBckI7QUFDSCxPQU5FO0FBT0hFLE1BQUFBLFdBUEcsdUJBT1NnUyxNQVBULEVBT2lCO0FBQ2hCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDaFMsV0FBWCxDQUFyQjtBQUNILE9BVEU7QUFVSEMsTUFBQUEsY0FWRywwQkFVWStSLE1BVlosRUFVb0I7QUFDbkIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUMvUixjQUFYLENBQXJCO0FBQ0gsT0FaRTtBQWFIaEIsTUFBQUEsYUFBYSxFQUFFYixzQkFBc0IsQ0FBQyxVQUFELEVBQWE7QUFBRWMsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsR0FBRyxFQUFFLENBQXBCO0FBQXVCQyxRQUFBQSxXQUFXLEVBQUUsQ0FBcEM7QUFBdUNDLFFBQUFBLEtBQUssRUFBRSxDQUE5QztBQUFpREMsUUFBQUEsT0FBTyxFQUFFLENBQTFEO0FBQTZEQyxRQUFBQSxjQUFjLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLGdCQUFnQixFQUFFO0FBQWxHLE9BQWI7QUFibEMsS0FYSjtBQTBCSFcsSUFBQUEsTUFBTSxFQUFFO0FBQ0pRLE1BQUFBLGVBREksMkJBQ1lxUixNQURaLEVBQ29CO0FBQ3BCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDclIsZUFBWCxDQUFyQjtBQUNILE9BSEc7QUFJSjFCLE1BQUFBLGFBQWEsRUFBRWIsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUVjLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVFLFFBQUFBLFdBQVcsRUFBRSxDQUE1QjtBQUErQmdCLFFBQUFBLFNBQVMsRUFBRSxDQUExQztBQUE2Q2QsUUFBQUEsT0FBTyxFQUFFLENBQXREO0FBQXlEZSxRQUFBQSxrQkFBa0IsRUFBRSxDQUE3RTtBQUFnRkMsUUFBQUEsT0FBTyxFQUFFLENBQXpGO0FBQTRGQyxRQUFBQSxlQUFlLEVBQUUsQ0FBN0c7QUFBZ0hDLFFBQUFBLElBQUksRUFBRSxDQUFDO0FBQXZILE9BQWI7QUFKakMsS0ExQkw7QUFnQ0hJLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZFLE1BQUFBLEtBRGUsaUJBQ1RrUixNQURTLEVBQ0Q7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUhjLEtBaENoQjtBQXFDSEUsSUFBQUEsT0FBTyxFQUFFO0FBQ0xDLE1BQUFBLEVBREssY0FDRitRLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7QUFJTHhQLE1BQUFBLFVBSkssc0JBSU11UCxNQUpOLEVBSWM7QUFDZixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ3ZQLFVBQVgsQ0FBckI7QUFDSCxPQU5JO0FBT0w5QyxNQUFBQSxPQVBLLG1CQU9HcVMsTUFQSCxFQU9XO0FBQ1osZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNyUyxPQUFYLENBQXJCO0FBQ0gsT0FUSTtBQVVMRyxNQUFBQSxPQVZLLG1CQVVHa1MsTUFWSCxFQVVXO0FBQ1osZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNsUyxPQUFYLENBQXJCO0FBQ0gsT0FaSTtBQWFMOEMsTUFBQUEsVUFiSyxzQkFhTW9QLE1BYk4sRUFhYztBQUNmLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDcFAsVUFBWCxDQUFyQjtBQUNILE9BZkk7QUFnQkw5QixNQUFBQSxLQWhCSyxpQkFnQkNrUixNQWhCRCxFQWdCUztBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNILE9BbEJJO0FBbUJMN0IsTUFBQUEsYUFBYSxFQUFFYixzQkFBc0IsQ0FBQyxVQUFELEVBQWE7QUFBRThDLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLFFBQUFBLEtBQUssRUFBRSxDQUF0QjtBQUF5QkMsUUFBQUEsTUFBTSxFQUFFO0FBQWpDLE9BQWIsQ0FuQmhDO0FBb0JMRSxNQUFBQSxXQUFXLEVBQUVsRCxzQkFBc0IsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLFFBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsUUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDQyxRQUFBQSxXQUFXLEVBQUUsQ0FBckQ7QUFBd0RDLFFBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsUUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxRQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0ZDLFFBQUFBLFVBQVUsRUFBRTtBQUEzRyxPQUFYO0FBcEI5QixLQXJDTjtBQTJESG9CLElBQUFBLDRCQUE0QixFQUFFO0FBQzFCcEMsTUFBQUEsS0FEMEIsaUJBQ3BCa1IsTUFEb0IsRUFDWjtBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNIO0FBSHlCLEtBM0QzQjtBQWdFSHFDLElBQUFBLDJCQUEyQixFQUFFO0FBQ3pCckMsTUFBQUEsS0FEeUIsaUJBQ25Ca1IsTUFEbUIsRUFDWDtBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNIO0FBSHdCLEtBaEUxQjtBQXFFSHNDLElBQUFBLGdDQUFnQyxFQUFFO0FBQzlCdEMsTUFBQUEsS0FEOEIsaUJBQ3hCa1IsTUFEd0IsRUFDaEI7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUg2QixLQXJFL0I7QUEwRUh1QyxJQUFBQSwwQkFBMEIsRUFBRTtBQUN4QnZDLE1BQUFBLEtBRHdCLGlCQUNsQmtSLE1BRGtCLEVBQ1Y7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUh1QixLQTFFekI7QUErRUh3QyxJQUFBQSwyQkFBMkIsRUFBRTtBQUN6QnhDLE1BQUFBLEtBRHlCLGlCQUNuQmtSLE1BRG1CLEVBQ1g7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUh3QixLQS9FMUI7QUFvRkh5QyxJQUFBQSw4QkFBOEIsRUFBRTtBQUM1QnpDLE1BQUFBLEtBRDRCLGlCQUN0QmtSLE1BRHNCLEVBQ2Q7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUgyQixLQXBGN0I7QUF5RkgwQyxJQUFBQSx5QkFBeUIsRUFBRTtBQUN2QjFDLE1BQUFBLEtBRHVCLGlCQUNqQmtSLE1BRGlCLEVBQ1Q7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUhzQixLQXpGeEI7QUE4RkgyQyxJQUFBQSwrQkFBK0IsRUFBRTtBQUM3QjNDLE1BQUFBLEtBRDZCLGlCQUN2QmtSLE1BRHVCLEVBQ2Y7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUg0QixLQTlGOUI7QUFtR0hvRCxJQUFBQSxjQUFjLEVBQUU7QUFDWkMsTUFBQUEsV0FEWSx1QkFDQTZOLE1BREEsRUFDUTtBQUNoQixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzdOLFdBQVgsQ0FBckI7QUFDSCxPQUhXO0FBSVpFLE1BQUFBLFFBSlksb0JBSUgyTixNQUpHLEVBSUs7QUFDYixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzNOLFFBQVgsQ0FBckI7QUFDSCxPQU5XO0FBT1pFLE1BQUFBLGNBUFksMEJBT0d5TixNQVBILEVBT1c7QUFDbkIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUN6TixjQUFYLENBQXJCO0FBQ0gsT0FUVztBQVVaRSxNQUFBQSxPQVZZLG1CQVVKdU4sTUFWSSxFQVVJO0FBQ1osZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUN2TixPQUFYLENBQXJCO0FBQ0gsT0FaVztBQWFaL0QsTUFBQUEsUUFiWSxvQkFhSHNSLE1BYkcsRUFhSztBQUNiLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDdFIsUUFBWCxDQUFyQjtBQUNILE9BZlc7QUFnQlprRSxNQUFBQSxhQWhCWSx5QkFnQkVvTixNQWhCRixFQWdCVTtBQUNsQixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ3BOLGFBQVgsQ0FBckI7QUFDSCxPQWxCVztBQW1CWkUsTUFBQUEsTUFuQlksa0JBbUJMa04sTUFuQkssRUFtQkc7QUFDWCxlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xOLE1BQVgsQ0FBckI7QUFDSCxPQXJCVztBQXNCWkUsTUFBQUEsYUF0QlkseUJBc0JFZ04sTUF0QkYsRUFzQlU7QUFDbEIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNoTixhQUFYLENBQXJCO0FBQ0g7QUF4QlcsS0FuR2I7QUE2SEhlLElBQUFBLDZDQUE2QyxFQUFFO0FBQzNDakYsTUFBQUEsS0FEMkMsaUJBQ3JDa1IsTUFEcUMsRUFDN0I7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUgwQyxLQTdINUM7QUFrSUhrRixJQUFBQSw0Q0FBNEMsRUFBRTtBQUMxQ2xGLE1BQUFBLEtBRDBDLGlCQUNwQ2tSLE1BRG9DLEVBQzVCO0FBQ1YsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNsUixLQUFYLENBQXJCO0FBQ0g7QUFIeUMsS0FsSTNDO0FBdUlIcUYsSUFBQUEsMkJBQTJCLEVBQUU7QUFDekJFLE1BQUFBLFFBRHlCLG9CQUNoQjJMLE1BRGdCLEVBQ1I7QUFDYixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzNMLFFBQVgsQ0FBckI7QUFDSCxPQUh3QjtBQUl6Qi9ILE1BQUFBLE1BSnlCLGtCQUlsQjBULE1BSmtCLEVBSVY7QUFDWCxlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzFULE1BQVgsQ0FBckI7QUFDSCxPQU53QjtBQU96QmlHLE1BQUFBLGNBUHlCLDBCQU9WeU4sTUFQVSxFQU9GO0FBQ25CLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDek4sY0FBWCxDQUFyQjtBQUNILE9BVHdCO0FBVXpCOEMsTUFBQUEsYUFWeUIseUJBVVgySyxNQVZXLEVBVUg7QUFDbEIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUMzSyxhQUFYLENBQXJCO0FBQ0gsT0Fad0I7QUFhekJKLE1BQUFBLGVBQWUsRUFBRTdJLHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUFFb0MsUUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBVzBHLFFBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsUUFBQUEsS0FBSyxFQUFFO0FBQTVCLE9BQWY7QUFiZCxLQXZJMUI7QUFzSkhRLElBQUFBLDZCQUE2QixFQUFFO0FBQzNCN0csTUFBQUEsS0FEMkIsaUJBQ3JCa1IsTUFEcUIsRUFDYjtBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNIO0FBSDBCLEtBdEo1QjtBQTJKSDhHLElBQUFBLCtCQUErQixFQUFFO0FBQzdCOUcsTUFBQUEsS0FENkIsaUJBQ3ZCa1IsTUFEdUIsRUFDZjtBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNIO0FBSDRCLEtBM0o5QjtBQWdLSGlILElBQUFBLG9CQUFvQixFQUFFO0FBQ2xCQyxNQUFBQSxJQURrQixnQkFDYmdLLE1BRGEsRUFDTDtBQUNULGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDaEssSUFBWCxDQUFyQjtBQUNILE9BSGlCO0FBSWxCRSxNQUFBQSxNQUprQixrQkFJWDhKLE1BSlcsRUFJSDtBQUNYLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDOUosTUFBWCxDQUFyQjtBQUNIO0FBTmlCLEtBaEtuQjtBQXdLSGlCLElBQUFBLEtBQUssRUFBRTtBQUNIbEksTUFBQUEsRUFERyxjQUNBK1EsTUFEQSxFQUNRO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FIRTtBQUlINUwsTUFBQUEsUUFKRyxvQkFJTTJMLE1BSk4sRUFJYztBQUNiLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDM0wsUUFBWCxDQUFyQjtBQUNILE9BTkU7QUFPSC9ILE1BQUFBLE1BUEcsa0JBT0kwVCxNQVBKLEVBT1k7QUFDWCxlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzFULE1BQVgsQ0FBckI7QUFDSCxPQVRFO0FBVUhnRCxNQUFBQSxXQUFXLEVBQUVsRCxzQkFBc0IsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNJLFFBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsU0FBUyxFQUFFLENBQXRDO0FBQXlDQyxRQUFBQSxPQUFPLEVBQUU7QUFBbEQsT0FBWDtBQVZoQyxLQXhLSjtBQW9MSHlJLElBQUFBLG1CQUFtQixFQUFFO0FBQ2pCeEosTUFBQUEsS0FEaUIsaUJBQ1hrUixNQURXLEVBQ0g7QUFDVixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xSLEtBQVgsQ0FBckI7QUFDSDtBQUhnQixLQXBMbEI7QUF5TEgwSixJQUFBQSxPQUFPLEVBQUU7QUFDTHZKLE1BQUFBLEVBREssY0FDRitRLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7QUFJTGxILE1BQUFBLFdBSkssdUJBSU9pSCxNQUpQLEVBSWU7QUFDaEIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNqSCxXQUFYLENBQXJCO0FBQ0gsT0FOSTtBQU9MQyxNQUFBQSxhQVBLLHlCQU9TZ0gsTUFQVCxFQU9pQjtBQUNsQixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2hILGFBQVgsQ0FBckI7QUFDSCxPQVRJO0FBVUxDLE1BQUFBLE9BVkssbUJBVUcrRyxNQVZILEVBVVc7QUFDWixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQy9HLE9BQVgsQ0FBckI7QUFDSCxPQVpJO0FBYUxQLE1BQUFBLGFBQWEsRUFBRXRNLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFdU0sUUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsUUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxRQUFBQSxNQUFNLEVBQUU7QUFBaEMsT0FBYjtBQWJoQyxLQXpMTjtBQXdNSE0sSUFBQUEseUJBQXlCLEVBQUU7QUFDdkJySyxNQUFBQSxLQUR1QixpQkFDakJrUixNQURpQixFQUNUO0FBQ1YsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNsUixLQUFYLENBQXJCO0FBQ0g7QUFIc0IsS0F4TXhCO0FBNk1Ic0ssSUFBQUEsa0JBQWtCLEVBQUU7QUFDaEJDLE1BQUFBLHNCQURnQixrQ0FDTzJHLE1BRFAsRUFDZTtBQUMzQixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQzNHLHNCQUFYLENBQXJCO0FBQ0gsT0FIZTtBQUloQkMsTUFBQUEsZ0JBSmdCLDRCQUlDMEcsTUFKRCxFQUlTO0FBQ3JCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDMUcsZ0JBQVgsQ0FBckI7QUFDSCxPQU5lO0FBT2hCRSxNQUFBQSxrQkFBa0IsRUFBRXBOLHNCQUFzQixDQUFDLGVBQUQsRUFBa0I7QUFBRXFOLFFBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWixRQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJhLFFBQUFBLE9BQU8sRUFBRTtBQUFwQyxPQUFsQjtBQVAxQixLQTdNakI7QUFzTkhDLElBQUFBLDRCQUE0QixFQUFFO0FBQzFCN0ssTUFBQUEsS0FEMEIsaUJBQ3BCa1IsTUFEb0IsRUFDWjtBQUNWLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbFIsS0FBWCxDQUFyQjtBQUNIO0FBSHlCLEtBdE4zQjtBQTJOSCtLLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZDLE1BQUFBLGtCQURlLDhCQUNJa0csTUFESixFQUNZO0FBQ3ZCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDbEcsa0JBQVgsQ0FBckI7QUFDSCxPQUhjO0FBSWZDLE1BQUFBLE1BSmUsa0JBSVJpRyxNQUpRLEVBSUE7QUFDWCxlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2pHLE1BQVgsQ0FBckI7QUFDSDtBQU5jLEtBM05oQjtBQW1PSEUsSUFBQUEsa0JBQWtCLEVBQUU7QUFDaEJhLE1BQUFBLFFBRGdCLG9CQUNQa0YsTUFETyxFQUNDO0FBQ2IsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNsRixRQUFYLENBQXJCO0FBQ0gsT0FIZTtBQUloQkMsTUFBQUEsUUFKZ0Isb0JBSVBpRixNQUpPLEVBSUM7QUFDYixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2pGLFFBQVgsQ0FBckI7QUFDSCxPQU5lO0FBT2hCQyxNQUFBQSxTQVBnQixxQkFPTmdGLE1BUE0sRUFPRTtBQUNkLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDaEYsU0FBWCxDQUFyQjtBQUNILE9BVGU7QUFVaEJiLE1BQUFBLGlCQUFpQixFQUFFL04sc0JBQXNCLENBQUMsY0FBRCxFQUFpQjtBQUFFZ08sUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsRUFBRSxFQUFFO0FBQWxCLE9BQWpCLENBVnpCO0FBV2hCRSxNQUFBQSxtQkFBbUIsRUFBRW5PLHNCQUFzQixDQUFDLGdCQUFELEVBQW1CO0FBQUVvTyxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxRQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLEtBQUssRUFBRTtBQUFsQyxPQUFuQjtBQVgzQixLQW5PakI7QUFnUEhjLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZHLE1BQUFBLGNBRGUsMEJBQ0FxRSxNQURBLEVBQ1E7QUFDbkIsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNyRSxjQUFYLENBQXJCO0FBQ0gsT0FIYztBQUlmQyxNQUFBQSxpQkFKZSw2QkFJR29FLE1BSkgsRUFJVztBQUN0QixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ3BFLGlCQUFYLENBQXJCO0FBQ0gsT0FOYztBQU9mcEMsTUFBQUEsa0JBQWtCLEVBQUVwTixzQkFBc0IsQ0FBQyxlQUFELEVBQWtCO0FBQUVxTixRQUFBQSxTQUFTLEVBQUUsQ0FBYjtBQUFnQlosUUFBQUEsTUFBTSxFQUFFLENBQXhCO0FBQTJCYSxRQUFBQSxPQUFPLEVBQUU7QUFBcEMsT0FBbEI7QUFQM0IsS0FoUGhCO0FBeVBINEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZlEsTUFBQUEsWUFEZSx3QkFDRmtELE1BREUsRUFDTTtBQUNqQixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2xELFlBQVgsQ0FBckI7QUFDSCxPQUhjO0FBSWZDLE1BQUFBLFFBSmUsb0JBSU5pRCxNQUpNLEVBSUU7QUFDYixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2pELFFBQVgsQ0FBckI7QUFDSCxPQU5jO0FBT2ZDLE1BQUFBLFFBUGUsb0JBT05nRCxNQVBNLEVBT0U7QUFDYixlQUFPbFUsY0FBYyxDQUFDLENBQUQsRUFBSWtVLE1BQU0sQ0FBQ2hELFFBQVgsQ0FBckI7QUFDSCxPQVRjO0FBVWZSLE1BQUFBLGdCQUFnQixFQUFFcFEsc0JBQXNCLENBQUMsYUFBRCxFQUFnQjtBQUFFcVEsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxFQUFFLEVBQUU7QUFBL0IsT0FBaEI7QUFWekIsS0F6UGhCO0FBcVFIYSxJQUFBQSxXQUFXLEVBQUU7QUFDVHZPLE1BQUFBLEVBRFMsY0FDTitRLE1BRE0sRUFDRTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSFE7QUFJVHBCLE1BQUFBLFVBSlMsc0JBSUVtQixNQUpGLEVBSVU7QUFDZixlQUFPSCxFQUFFLENBQUNLLGFBQUgsQ0FBaUJMLEVBQUUsQ0FBQ00sUUFBcEIsRUFBOEJILE1BQU0sQ0FBQ25TLE1BQXJDLENBQVA7QUFDSCxPQU5RO0FBT1RrUixNQUFBQSxZQVBTLHdCQU9JaUIsTUFQSixFQU9ZO0FBQ2pCLGVBQU9ILEVBQUUsQ0FBQ08sZUFBSCxDQUFtQlAsRUFBRSxDQUFDTSxRQUF0QixFQUFnQ0gsTUFBTSxDQUFDbEIsUUFBdkMsQ0FBUDtBQUNILE9BVFE7QUFVVFgsTUFBQUEsRUFWUyxjQVVONkIsTUFWTSxFQVVFO0FBQ1AsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUM3QixFQUFYLENBQXJCO0FBQ0gsT0FaUTtBQWFURSxNQUFBQSxhQWJTLHlCQWFLMkIsTUFiTCxFQWFhO0FBQ2xCLGVBQU9sVSxjQUFjLENBQUMsQ0FBRCxFQUFJa1UsTUFBTSxDQUFDM0IsYUFBWCxDQUFyQjtBQUNILE9BZlE7QUFnQlRXLE1BQUFBLFVBaEJTLHNCQWdCRWdCLE1BaEJGLEVBZ0JVO0FBQ2YsZUFBT2xVLGNBQWMsQ0FBQyxDQUFELEVBQUlrVSxNQUFNLENBQUNoQixVQUFYLENBQXJCO0FBQ0gsT0FsQlE7QUFtQlR0QixNQUFBQSxZQUFZLEVBQUV0UixzQkFBc0IsQ0FBQyxTQUFELEVBQVk7QUFBRXVSLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLFFBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsSUFBSSxFQUFFLENBQWpDO0FBQW9DQyxRQUFBQSxJQUFJLEVBQUUsQ0FBMUM7QUFBNkNDLFFBQUFBLFlBQVksRUFBRSxDQUEzRDtBQUE4REMsUUFBQUEsWUFBWSxFQUFFLENBQTVFO0FBQStFQyxRQUFBQSxZQUFZLEVBQUUsQ0FBN0Y7QUFBZ0dDLFFBQUFBLFlBQVksRUFBRTtBQUE5RyxPQUFaLENBbkIzQjtBQW9CVDVPLE1BQUFBLFdBQVcsRUFBRWxELHNCQUFzQixDQUFDLFFBQUQsRUFBVztBQUFFbUQsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0csUUFBQUEsV0FBVyxFQUFFLENBQTNCO0FBQThCQyxRQUFBQSxRQUFRLEVBQUUsQ0FBeEM7QUFBMkNDLFFBQUFBLFNBQVMsRUFBRSxDQUF0RDtBQUF5REMsUUFBQUEsT0FBTyxFQUFFO0FBQWxFLE9BQVgsQ0FwQjFCO0FBcUJUNE8sTUFBQUEsZ0JBQWdCLEVBQUVyUyxzQkFBc0IsQ0FBQyxhQUFELEVBQWdCO0FBQUV1TSxRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLFFBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQzZGLFFBQUFBLFFBQVEsRUFBRTtBQUE3QyxPQUFoQixDQXJCL0I7QUFzQlRFLE1BQUFBLGVBQWUsRUFBRXhTLHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUFFdU0sUUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsUUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxRQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUM2RixRQUFBQSxRQUFRLEVBQUU7QUFBN0MsT0FBZjtBQXRCOUIsS0FyUVY7QUE2UkgyQixJQUFBQSxLQUFLLEVBQUU7QUFDSE4sTUFBQUEsSUFBSSxFQUFKQSxJQURHO0FBRUhJLE1BQUFBLFFBQVEsRUFBRU4sRUFBRSxDQUFDUyxlQUFILENBQW1CVCxFQUFFLENBQUNNLFFBQXRCLEVBQWdDblIsT0FBaEMsQ0FGUDtBQUdIdVIsTUFBQUEsTUFBTSxFQUFFVixFQUFFLENBQUNTLGVBQUgsQ0FBbUJULEVBQUUsQ0FBQ1UsTUFBdEIsRUFBOEJwSixLQUE5QixDQUhMO0FBSUhxSixNQUFBQSxRQUFRLEVBQUVYLEVBQUUsQ0FBQ1MsZUFBSCxDQUFtQlQsRUFBRSxDQUFDVyxRQUF0QixFQUFnQ2hJLE9BQWhDLENBSlA7QUFLSGhGLE1BQUFBLFlBQVksRUFBRXFNLEVBQUUsQ0FBQ1MsZUFBSCxDQUFtQlQsRUFBRSxDQUFDck0sWUFBdEIsRUFBb0NnSyxXQUFwQztBQUxYLEtBN1JKO0FBb1NIaUQsSUFBQUEsWUFBWSxFQUFFO0FBQ1ZOLE1BQUFBLFFBQVEsRUFBRU4sRUFBRSxDQUFDYSxzQkFBSCxDQUEwQmIsRUFBRSxDQUFDTSxRQUE3QixFQUF1Q25SLE9BQXZDLENBREE7QUFFVnVSLE1BQUFBLE1BQU0sRUFBRVYsRUFBRSxDQUFDYSxzQkFBSCxDQUEwQmIsRUFBRSxDQUFDVSxNQUE3QixFQUFxQ3BKLEtBQXJDLENBRkU7QUFHVnFKLE1BQUFBLFFBQVEsRUFBRVgsRUFBRSxDQUFDYSxzQkFBSCxDQUEwQmIsRUFBRSxDQUFDVyxRQUE3QixFQUF1Q2hJLE9BQXZDLENBSEE7QUFJVmhGLE1BQUFBLFlBQVksRUFBRXFNLEVBQUUsQ0FBQ2Esc0JBQUgsQ0FBMEJiLEVBQUUsQ0FBQ3JNLFlBQTdCLEVBQTJDZ0ssV0FBM0M7QUFKSixLQXBTWDtBQTBTSG1ELElBQUFBLFFBQVEsRUFBRTtBQUNOYixNQUFBQSxZQUFZLEVBQVpBO0FBRE07QUExU1AsR0FBUDtBQThTSDs7QUFFRGMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JqQixFQUFBQSxlQUFlLEVBQWZBLGVBRGE7QUFFYnZULEVBQUFBLFNBQVMsRUFBVEEsU0FGYTtBQUdiSyxFQUFBQSxXQUFXLEVBQVhBLFdBSGE7QUFJYkssRUFBQUEsS0FBSyxFQUFMQSxLQUphO0FBS2JvQixFQUFBQSxNQUFNLEVBQU5BLE1BTGE7QUFNYlMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFOYTtBQU9iSSxFQUFBQSxPQUFPLEVBQVBBLE9BUGE7QUFRYmtDLEVBQUFBLDRCQUE0QixFQUE1QkEsNEJBUmE7QUFTYkMsRUFBQUEsMkJBQTJCLEVBQTNCQSwyQkFUYTtBQVViQyxFQUFBQSxnQ0FBZ0MsRUFBaENBLGdDQVZhO0FBV2JDLEVBQUFBLDBCQUEwQixFQUExQkEsMEJBWGE7QUFZYkMsRUFBQUEsMkJBQTJCLEVBQTNCQSwyQkFaYTtBQWFiQyxFQUFBQSw4QkFBOEIsRUFBOUJBLDhCQWJhO0FBY2JDLEVBQUFBLHlCQUF5QixFQUF6QkEseUJBZGE7QUFlYkMsRUFBQUEsK0JBQStCLEVBQS9CQSwrQkFmYTtBQWdCYlMsRUFBQUEsY0FBYyxFQUFkQSxjQWhCYTtBQWlCYmdCLEVBQUFBLDZCQUE2QixFQUE3QkEsNkJBakJhO0FBa0JiSSxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQWxCYTtBQW1CYkssRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFuQmE7QUFvQmJJLEVBQUFBLDZDQUE2QyxFQUE3Q0EsNkNBcEJhO0FBcUJiQyxFQUFBQSw0Q0FBNEMsRUFBNUNBLDRDQXJCYTtBQXNCYkcsRUFBQUEsMkJBQTJCLEVBQTNCQSwyQkF0QmE7QUF1QmJvQixFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQXZCYTtBQXdCYkksRUFBQUEsNkJBQTZCLEVBQTdCQSw2QkF4QmE7QUF5QmJDLEVBQUFBLCtCQUErQixFQUEvQkEsK0JBekJhO0FBMEJiRyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTFCYTtBQTJCYkssRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkEzQmE7QUE0QmJPLEVBQUFBLFdBQVcsRUFBWEEsV0E1QmE7QUE2QmJRLEVBQUFBLEtBQUssRUFBTEEsS0E3QmE7QUE4QmJtQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQTlCYTtBQStCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQS9CYTtBQWdDYlcsRUFBQUEseUJBQXlCLEVBQXpCQSx5QkFoQ2E7QUFpQ2JDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBakNhO0FBa0NiTyxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWxDYTtBQW1DYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFuQ2E7QUFvQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBcENhO0FBcUNidUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFyQ2E7QUFzQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBdENhO0FBdUNiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXZDYTtBQXdDYk8sRUFBQUEsV0FBVyxFQUFYQTtBQXhDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXJBcnJheSA9IGFycmF5KE1lc3NhZ2VWYWx1ZU90aGVyKTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3Rlcixcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIsIHBvc3RSZXF1ZXN0cywgaW5mbykge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBpbmZvLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9LFxuICAgICAgICBNdXRhdGlvbjoge1xuICAgICAgICAgICAgcG9zdFJlcXVlc3RzLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==