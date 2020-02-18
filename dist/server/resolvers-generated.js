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
  msg_id: scalar,
  transaction_id: scalar,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFXSUEsT0FBTyxDQUFDLGVBQUQsQztJQVZQQyxNLFlBQUFBLE07SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxjLFlBQUFBLGM7SUFDQUMsTSxZQUFBQSxNO0lBQ0FDLEssWUFBQUEsSztJQUNBQyxJLFlBQUFBLEk7SUFDQUMsUyxZQUFBQSxTO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxzQixZQUFBQSxzQjs7QUFFSixJQUFNQyxhQUFhLEdBQUdOLE1BQU0sQ0FBQztBQUN6Qk8sRUFBQUEsUUFBUSxFQUFFWCxNQURlO0FBRXpCWSxFQUFBQSxLQUFLLEVBQUVWO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxJQUFNVyxTQUFTLEdBQUdULE1BQU0sQ0FBQztBQUNyQlUsRUFBQUEsTUFBTSxFQUFFYixRQURhO0FBRXJCYyxFQUFBQSxNQUFNLEVBQUVmLE1BRmE7QUFHckJnQixFQUFBQSxTQUFTLEVBQUVoQixNQUhVO0FBSXJCaUIsRUFBQUEsU0FBUyxFQUFFakI7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWtCLFdBQVcsR0FBR2QsTUFBTSxDQUFDO0FBQ3ZCZSxFQUFBQSxNQUFNLEVBQUVuQixNQURlO0FBRXZCb0IsRUFBQUEsU0FBUyxFQUFFcEIsTUFGWTtBQUd2QnFCLEVBQUFBLFFBQVEsRUFBRXJCLE1BSGE7QUFJdkJzQixFQUFBQSxpQkFBaUIsRUFBRXBC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QUEsZUFBZSxFQUFmQSxlQXZDYTtBQXdDYkssRUFBQUEsS0FBSyxFQUFMQSxLQXhDYTtBQXlDYm9CLEVBQUFBLE9BQU8sRUFBUEEsT0F6Q2E7QUEwQ2JXLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBMUNhO0FBMkNiTyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQTNDYTtBQTRDYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkE1Q2E7QUE2Q2JxQixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQTdDYTtBQThDYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkE5Q2E7QUErQ2JXLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBL0NhO0FBZ0RiTSxFQUFBQSxXQUFXLEVBQVhBO0FBaERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uczoge1xuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLmZldGNoRG9jQnlLZXkocGFyZW50LmlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLmZldGNoRG9jQnlLZXkocGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy5mZXRjaERvY3NCeUtleXMocGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=