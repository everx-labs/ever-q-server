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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwic3RhdGVfdXBkYXRlIiwibWFzdGVyIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRGVsZXRlZCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsImJsb2Nrc19zaWduYXR1cmVzIiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0IsWUFBQUEsc0I7O0FBRUosSUFBTUMsYUFBYSxHQUFHTixNQUFNLENBQUM7QUFDekJPLEVBQUFBLFFBQVEsRUFBRVgsTUFEZTtBQUV6QlksRUFBQUEsS0FBSyxFQUFFVjtBQUZrQixDQUFELENBQTVCO0FBS0EsSUFBTVcsU0FBUyxHQUFHVCxNQUFNLENBQUM7QUFDckJVLEVBQUFBLE1BQU0sRUFBRWIsUUFEYTtBQUVyQmMsRUFBQUEsTUFBTSxFQUFFZixNQUZhO0FBR3JCZ0IsRUFBQUEsU0FBUyxFQUFFaEIsTUFIVTtBQUlyQmlCLEVBQUFBLFNBQVMsRUFBRWpCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLElBQU1rQixXQUFXLEdBQUdkLE1BQU0sQ0FBQztBQUN2QmUsRUFBQUEsTUFBTSxFQUFFbkIsTUFEZTtBQUV2Qm9CLEVBQUFBLFNBQVMsRUFBRXBCLE1BRlk7QUFHdkJxQixFQUFBQSxRQUFRLEVBQUVyQixNQUhhO0FBSXZCc0IsRUFBQUEsaUJBQWlCLEVBQUVwQjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJ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QUFBQSxPQUFPLEVBQVBBLE9BekNhO0FBMENiVyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQTFDYTtBQTJDYk8sRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkEzQ2E7QUE0Q2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBNUNhO0FBNkNicUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkE3Q2E7QUE4Q2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBOUNhO0FBK0NiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQS9DYTtBQWdEYk0sRUFBQUEsV0FBVyxFQUFYQTtBQWhEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy5mZXRjaERvY0J5S2V5KHBhcmVudC5pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy5mZXRjaERvY0J5S2V5KHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMuZmV0Y2hEb2NzQnlLZXlzKHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19