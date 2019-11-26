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
    Mutation: {}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52Mi5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2ciLCJtc2dfdHlwZSIsIm1zZ190eXBlX25hbWUiLCJFeHRlcm5hbCIsIklociIsIkltbWVkaWF0ZWx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwibXNnIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIk1lc3NhZ2VWYWx1ZU90aGVyIiwiY3VycmVuY3kiLCJ2YWx1ZSIsIk1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIk11dGF0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFXSUEsT0FBTyxDQUFDLGNBQUQs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QkFBbUIsRUFBbkJBLG1CQTlCYTtBQStCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQS9CYTtBQWdDYlcsRUFBQUEseUJBQXlCLEVBQXpCQSx5QkFoQ2E7QUFpQ2JDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBakNhO0FBa0NiTyxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWxDYTtBQW1DYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFuQ2E7QUFvQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBcENhO0FBcUNidUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFyQ2E7QUFzQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBdENhO0FBdUNiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXZDYTtBQXdDYk8sRUFBQUEsV0FBVyxFQUFYQTtBQXhDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXJBcnJheSA9IGFycmF5KE1lc3NhZ2VWYWx1ZU90aGVyKTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3Rlcixcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9LFxuICAgICAgICBNdXRhdGlvbjoge1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==