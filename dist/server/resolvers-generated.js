"use strict";

var _require = require('./db-types.js'),
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
  src_workchain_id: scalar,
  dst_workchain_id: scalar,
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
var BlockAccountBlocksTransactions = struct({
  lt: bigUInt1,
  transaction_id: scalar,
  total_fees: bigUInt2,
  total_fees_other: OtherCurrencyArray
});
var BlockAccountBlocksTransactionsArray = array(BlockAccountBlocksTransactions);
var BlockAccountBlocks = struct({
  account_addr: scalar,
  transactions: BlockAccountBlocksTransactionsArray,
  old_hash: scalar,
  new_hash: scalar,
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
var BlockMasterConfigP6 = struct({
  mint_new_price: scalar,
  mint_add_price: scalar
});
var BlockMasterConfigP7 = struct({
  currency: scalar,
  value: scalar
});
var BlockMasterConfigP8 = struct({
  version: scalar,
  capabilities: scalar
});
var BlockMasterConfigP12 = struct({
  workchain_id: scalar,
  enabled_since: scalar,
  actual_min_split: scalar,
  min_split: scalar,
  max_split: scalar,
  active: scalar,
  accept_msgs: scalar,
  flags: scalar,
  zerostate_root_hash: scalar,
  zerostate_file_hash: scalar,
  version: scalar,
  basic: scalar,
  vm_version: scalar,
  vm_mode: scalar,
  min_addr_len: scalar,
  max_addr_len: scalar,
  addr_len_step: scalar,
  workchain_type_id: scalar
});
var BlockMasterConfigP14 = struct({
  masterchain_block_fee: scalar,
  basechain_block_fee: scalar
});
var BlockMasterConfigP15 = struct({
  validators_elected_for: scalar,
  elections_start_before: scalar,
  elections_end_before: scalar,
  stake_held_for: scalar
});
var BlockMasterConfigP16 = struct({
  max_validators: scalar,
  max_main_validators: scalar,
  min_validators: scalar
});
var BlockMasterConfigP17 = struct({
  min_stake: scalar,
  max_stake: scalar,
  min_total_stake: scalar,
  max_stake_factor: scalar
});
var BlockMasterConfigP18 = struct({
  utime_since: scalar,
  bit_price_ps: scalar,
  cell_price_ps: scalar,
  mc_bit_price_ps: scalar,
  mc_cell_price_ps: scalar
});
var BlockMasterConfigP28 = struct({
  mc_catchain_lifetime: scalar,
  shard_catchain_lifetime: scalar,
  shard_validators_lifetime: scalar,
  shard_validators_num: scalar
});
var BlockMasterConfigP29 = struct({
  round_candidates: scalar,
  next_candidate_delay_ms: scalar,
  consensus_timeout_ms: scalar,
  fast_attempts: scalar,
  attempt_duration: scalar,
  catchain_max_deps: scalar,
  max_block_bytes: scalar,
  max_collated_bytes: scalar
});
var BlockMasterConfigP39 = struct({
  adnl_addr: scalar,
  temp_public_key: scalar,
  seqno: scalar,
  valid_until: scalar,
  signature_r: scalar,
  signature_s: scalar
});
var GasLimitsPrices = struct({
  gas_price: scalar,
  gas_limit: scalar,
  special_gas_limit: scalar,
  gas_credit: scalar,
  block_gas_limit: scalar,
  freeze_due_limit: scalar,
  delete_due_limit: scalar,
  flat_gas_limit: scalar,
  flat_gas_price: scalar
});
var BlockLimitsBytes = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
var BlockLimitsGas = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
var BlockLimitsLtDelta = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
var BlockLimits = struct({
  bytes: BlockLimitsBytes,
  gas: BlockLimitsGas,
  lt_delta: BlockLimitsLtDelta
});
var MsgForwardPrices = struct({
  lump_price: scalar,
  bit_price: scalar,
  cell_price: scalar,
  ihr_price_factor: scalar,
  first_frac: scalar,
  next_frac: scalar
});
var ValidatorSetList = struct({
  public_key: scalar,
  weight: scalar,
  adnl_addr: scalar
});
var ValidatorSetListArray = array(ValidatorSetList);
var ValidatorSet = struct({
  utime_since: scalar,
  utime_until: scalar,
  total: scalar,
  total_weight: scalar,
  list: ValidatorSetListArray
});
var BlockMasterConfigP7Array = array(BlockMasterConfigP7);
var FloatArray = array(scalar);
var BlockMasterConfigP12Array = array(BlockMasterConfigP12);
var BlockMasterConfigP18Array = array(BlockMasterConfigP18);
var StringArray = array(scalar);
var BlockMasterConfigP39Array = array(BlockMasterConfigP39);
var BlockMasterConfig = struct({
  p0: scalar,
  p1: scalar,
  p2: scalar,
  p3: scalar,
  p4: scalar,
  p6: BlockMasterConfigP6,
  p7: BlockMasterConfigP7Array,
  p8: BlockMasterConfigP8,
  p9: FloatArray,
  p12: BlockMasterConfigP12Array,
  p14: BlockMasterConfigP14,
  p15: BlockMasterConfigP15,
  p16: BlockMasterConfigP16,
  p17: BlockMasterConfigP17,
  p18: BlockMasterConfigP18Array,
  p20: GasLimitsPrices,
  p21: GasLimitsPrices,
  p22: BlockLimits,
  p23: BlockLimits,
  p24: MsgForwardPrices,
  p25: MsgForwardPrices,
  p28: BlockMasterConfigP28,
  p29: BlockMasterConfigP29,
  p31: StringArray,
  p32: ValidatorSet,
  p33: ValidatorSet,
  p34: ValidatorSet,
  p35: ValidatorSet,
  p36: ValidatorSet,
  p37: ValidatorSet,
  p39: BlockMasterConfigP39Array
});
var BlockMasterShardHashesArray = array(BlockMasterShardHashes);
var BlockMasterShardFeesArray = array(BlockMasterShardFees);
var BlockMasterPrevBlkSignaturesArray = array(BlockMasterPrevBlkSignatures);
var BlockMaster = struct({
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg,
  prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
  config_addr: scalar,
  config: BlockMasterConfig
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
  prev_key_block_seqno: scalar,
  value_flow: BlockValueFlow,
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockAccountBlocksArray,
  tr_count: scalar,
  state_update: BlockStateUpdate,
  master: BlockMaster,
  signatures: join('id', 'blocks_signatures', BlockSignatures)
}, true);
var Account = struct({
  id: scalar,
  workchain_id: scalar,
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
  workchain_id: scalar,
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
    BlockAccountBlocksTransactions: {
      lt: function lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },
      total_fees: function total_fees(parent) {
        return resolveBigUInt(2, parent.total_fees);
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
  BlockAccountBlocksTransactions: BlockAccountBlocksTransactions,
  BlockAccountBlocks: BlockAccountBlocks,
  BlockStateUpdate: BlockStateUpdate,
  BlockMasterShardHashesDescr: BlockMasterShardHashesDescr,
  BlockMasterShardHashes: BlockMasterShardHashes,
  BlockMasterShardFees: BlockMasterShardFees,
  BlockMasterPrevBlkSignatures: BlockMasterPrevBlkSignatures,
  BlockMasterConfigP6: BlockMasterConfigP6,
  BlockMasterConfigP7: BlockMasterConfigP7,
  BlockMasterConfigP8: BlockMasterConfigP8,
  BlockMasterConfigP12: BlockMasterConfigP12,
  BlockMasterConfigP14: BlockMasterConfigP14,
  BlockMasterConfigP15: BlockMasterConfigP15,
  BlockMasterConfigP16: BlockMasterConfigP16,
  BlockMasterConfigP17: BlockMasterConfigP17,
  BlockMasterConfigP18: BlockMasterConfigP18,
  BlockMasterConfigP28: BlockMasterConfigP28,
  BlockMasterConfigP29: BlockMasterConfigP29,
  BlockMasterConfigP39: BlockMasterConfigP39,
  GasLimitsPrices: GasLimitsPrices,
  BlockLimitsBytes: BlockLimitsBytes,
  BlockLimitsGas: BlockLimitsGas,
  BlockLimitsLtDelta: BlockLimitsLtDelta,
  BlockLimits: BlockLimits,
  MsgForwardPrices: MsgForwardPrices,
  ValidatorSetList: ValidatorSetList,
  ValidatorSet: ValidatorSet,
  BlockMasterConfig: BlockMasterConfig,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFXSUEsT0FBTyxDQUFDLGVBQUQsQztJQVZQQyxNLFlBQUFBLE07SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxjLFlBQUFBLGM7SUFDQUMsTSxZQUFBQSxNO0lBQ0FDLEssWUFBQUEsSztJQUNBQyxJLFlBQUFBLEk7SUFDQUMsUyxZQUFBQSxTO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxzQixZQUFBQSxzQjs7QUFFSixJQUFNQyxhQUFhLEdBQUdOLE1BQU0sQ0FBQztBQUN6Qk8sRUFBQUEsUUFBUSxFQUFFWCxNQURlO0FBRXpCWSxFQUFBQSxLQUFLLEVBQUVWO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxJQUFNVyxTQUFTLEdBQUdULE1BQU0sQ0FBQztBQUNyQlUsRUFBQUEsTUFBTSxFQUFFYixRQURhO0FBRXJCYyxFQUFBQSxNQUFNLEVBQUVmLE1BRmE7QUFHckJnQixFQUFBQSxTQUFTLEVBQUVoQixNQUhVO0FBSXJCaUIsRUFBQUEsU0FBUyxFQUFFakI7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWtCLFdBQVcsR0FBR2QsTUFBTSxDQUFDO0FBQ3ZCZSxFQUFBQSxNQUFNLEVBQUVuQixNQURlO0FBRXZCb0IsRUFBQUEsU0FBUyxFQUFFcEIsTUFGWTtBQUd2QnFCLEVBQUFBLFFBQVEsRUFBRXJCLE1BSGE7QUFJdkJzQixFQUFBQSxpQkFBaUIsRUFBRXBC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QSxlQUFlLEVBQWZBLGVBdkNhO0FBd0NiSyxFQUFBQSxLQUFLLEVBQUxBLEtBeENhO0FBeUNib0IsRUFBQUEsT0FBTyxFQUFQQSxPQXpDYTtBQTBDYlcsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkExQ2E7QUEyQ2JPLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBM0NhO0FBNENiSSxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQTVDYTtBQTZDYnFCLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBN0NhO0FBOENiYyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQTlDYTtBQStDYlcsRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkEvQ2E7QUFnRGJNLEVBQUFBLFdBQVcsRUFBWEE7QUFoRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KE90aGVyQ3VycmVuY3kpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOSA9IHN0cnVjdCh7XG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG4gICAgdGVtcF9wdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgc2Vxbm86IHNjYWxhcixcbiAgICB2YWxpZF91bnRpbDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9yOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIGJsb2NrX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3QgPSBzdHJ1Y3Qoe1xuICAgIHB1YmxpY19rZXk6IHNjYWxhcixcbiAgICB3ZWlnaHQ6IHNjYWxhcixcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheShWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBzY2FsYXIsXG4gICAgbGlzdDogVmFsaWRhdG9yU2V0TGlzdEFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMTIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDE4KTtcbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AzOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgcDA6IHNjYWxhcixcbiAgICBwMTogc2NhbGFyLFxuICAgIHAyOiBzY2FsYXIsXG4gICAgcDM6IHNjYWxhcixcbiAgICBwNDogc2NhbGFyLFxuICAgIHA2OiBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIHA3OiBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXksXG4gICAgcDg6IEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgcDk6IEZsb2F0QXJyYXksXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLmZldGNoRG9jc0J5S2V5cyhwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==