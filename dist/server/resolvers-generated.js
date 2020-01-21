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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiQmxvY2tNYXN0ZXJDb25maWdQNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1A3IiwiQmxvY2tNYXN0ZXJDb25maWdQOCIsInZlcnNpb24iLCJjYXBhYmlsaXRpZXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJnYXNfbGltaXQiLCJzcGVjaWFsX2dhc19saW1pdCIsImdhc19jcmVkaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSIsIkZsb2F0QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSIsIlN0cmluZ0FycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwicDciLCJwOCIsInA5IiwicDEyIiwicDE0IiwicDE1IiwicDE2IiwicDE3IiwicDE4IiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwicDI5IiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJVbmluaXQiLCJBY3RpdmUiLCJGcm96ZW4iLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwidHJfdHlwZV9uYW1lIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiVGljayIsIlRvY2siLCJTcGxpdFByZXBhcmUiLCJTcGxpdEluc3RhbGwiLCJNZXJnZVByZXBhcmUiLCJNZXJnZUluc3RhbGwiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJibG9ja3Nfc2lnbmF0dXJlcyIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQVdJQSxPQUFPLENBQUMsY0FBRCxDO0lBVlBDLE0sWUFBQUEsTTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLGMsWUFBQUEsYztJQUNBQyxNLFlBQUFBLE07SUFDQUMsSyxZQUFBQSxLO0lBQ0FDLEksWUFBQUEsSTtJQUNBQyxTLFlBQUFBLFM7SUFDQUMsUSxZQUFBQSxRO0lBQ0FDLHNCLFlBQUFBLHNCOztBQUVKLElBQU1DLGFBQWEsR0FBR04sTUFBTSxDQUFDO0FBQ3pCTyxFQUFBQSxRQUFRLEVBQUVYLE1BRGU7QUFFekJZLEVBQUFBLEtBQUssRUFBRVY7QUFGa0IsQ0FBRCxDQUE1QjtBQUtBLElBQU1XLFNBQVMsR0FBR1QsTUFBTSxDQUFDO0FBQ3JCVSxFQUFBQSxNQUFNLEVBQUViLFFBRGE7QUFFckJjLEVBQUFBLE1BQU0sRUFBRWYsTUFGYTtBQUdyQmdCLEVBQUFBLFNBQVMsRUFBRWhCLE1BSFU7QUFJckJpQixFQUFBQSxTQUFTLEVBQUVqQjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNa0IsV0FBVyxHQUFHZCxNQUFNLENBQUM7QUFDdkJlLEVBQUFBLE1BQU0sRUFBRW5CLE1BRGU7QUFFdkJvQixFQUFBQSxTQUFTLEVBQUVwQixNQUZZO0FBR3ZCcUIsRUFBQUEsUUFBUSxFQUFFckIsTUFIYTtBQUl2QnNCLEVBQUFBLGlCQUFpQixFQUFFcEI7QUFKSSxDQUFELENBQTFCO0FBT0EsSUFBTXFCLEtBQUssR0FBR25CLE1BQU0sQ0FBQztBQUNqQm9CLEVB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QUFpQixFQUFqQkEsaUJBOUNhO0FBK0NiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQS9DYTtBQWdEYk0sRUFBQUEsV0FBVyxFQUFYQTtBQWhEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLmZldGNoRG9jc0J5S2V5cyhwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==