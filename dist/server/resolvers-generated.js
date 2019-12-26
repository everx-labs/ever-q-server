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
var BlockMasterConfig6 = struct({
  mint_new_price: scalar,
  mint_add_price: scalar
});
var BlockMasterConfig7 = struct({
  currency: scalar,
  value: scalar
});
var BlockMasterConfig8 = struct({
  version: scalar,
  capabilities: scalar
});
var BlockMasterConfig12 = struct({
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
var BlockMasterConfig14 = struct({
  masterchain_block_fee: scalar,
  basechain_block_fee: scalar
});
var BlockMasterConfig15 = struct({
  validators_elected_for: scalar,
  elections_start_before: scalar,
  elections_end_before: scalar,
  stake_held_for: scalar
});
var BlockMasterConfig16 = struct({
  max_validators: scalar,
  max_main_validators: scalar,
  min_validators: scalar
});
var BlockMasterConfig17 = struct({
  min_stake: scalar,
  max_stake: scalar,
  min_total_stake: scalar,
  max_stake_factor: scalar
});
var BlockMasterConfig18 = struct({
  utime_since: scalar,
  bit_price_ps: scalar,
  cell_price_ps: scalar,
  mc_bit_price_ps: scalar,
  mc_cell_price_ps: scalar
});
var BlockMasterConfig28 = struct({
  mc_catchain_lifetime: scalar,
  shard_catchain_lifetime: scalar,
  shard_validators_lifetime: scalar,
  shard_validators_num: scalar
});
var BlockMasterConfig29 = struct({
  round_candidates: scalar,
  next_candidate_delay_ms: scalar,
  consensus_timeout_ms: scalar,
  fast_attempts: scalar,
  attempt_duration: scalar,
  catchain_max_deps: scalar,
  max_block_bytes: scalar,
  max_collated_bytes: scalar
});
var BlockMasterConfig39 = struct({
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
var BlockMasterConfig7Array = array(BlockMasterConfig7);
var FloatArray = array(scalar);
var BlockMasterConfig12Array = array(BlockMasterConfig12);
var BlockMasterConfig18Array = array(BlockMasterConfig18);
var StringArray = array(scalar);
var BlockMasterConfig39Array = array(BlockMasterConfig39);
var BlockMasterConfig = struct({
  0: scalar,
  1: scalar,
  2: scalar,
  3: scalar,
  4: scalar,
  6: BlockMasterConfig6,
  7: BlockMasterConfig7Array,
  8: BlockMasterConfig8,
  9: FloatArray,
  12: BlockMasterConfig12Array,
  14: BlockMasterConfig14,
  15: BlockMasterConfig15,
  16: BlockMasterConfig16,
  17: BlockMasterConfig17,
  18: BlockMasterConfig18Array,
  20: GasLimitsPrices,
  21: GasLimitsPrices,
  22: BlockLimits,
  23: BlockLimits,
  24: MsgForwardPrices,
  25: MsgForwardPrices,
  28: BlockMasterConfig28,
  29: BlockMasterConfig29,
  31: StringArray,
  32: ValidatorSet,
  33: ValidatorSet,
  34: ValidatorSet,
  35: ValidatorSet,
  36: ValidatorSet,
  37: ValidatorSet,
  39: BlockMasterConfig39Array
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
  BlockMasterConfig6: BlockMasterConfig6,
  BlockMasterConfig7: BlockMasterConfig7,
  BlockMasterConfig8: BlockMasterConfig8,
  BlockMasterConfig12: BlockMasterConfig12,
  BlockMasterConfig14: BlockMasterConfig14,
  BlockMasterConfig15: BlockMasterConfig15,
  BlockMasterConfig16: BlockMasterConfig16,
  BlockMasterConfig17: BlockMasterConfig17,
  BlockMasterConfig18: BlockMasterConfig18,
  BlockMasterConfig28: BlockMasterConfig28,
  BlockMasterConfig29: BlockMasterConfig29,
  BlockMasterConfig39: BlockMasterConfig39,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJlbnVtTmFtZSIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiQmxvY2tNYXN0ZXJDb25maWc2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnNyIsIkJsb2NrTWFzdGVyQ29uZmlnOCIsInZlcnNpb24iLCJjYXBhYmlsaXRpZXMiLCJCbG9ja01hc3RlckNvbmZpZzEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwiQmxvY2tNYXN0ZXJDb25maWcxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwiQmxvY2tNYXN0ZXJDb25maWcxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZzI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJCbG9ja01hc3RlckNvbmZpZzM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJnYXNfbGltaXQiLCJzcGVjaWFsX2dhc19saW1pdCIsImdhc19jcmVkaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnMThBcnJheSIsIlN0cmluZ0FycmF5IiwiQmxvY2tNYXN0ZXJDb25maWczOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwic3RhdGVfdXBkYXRlIiwibWFzdGVyIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRGVsZXRlZCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsImJsb2Nrc19zaWduYXR1cmVzIiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25S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QXJDYTtBQXNDYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkF0Q2E7QUF1Q2JFLEVBQUFBLGVBQWUsRUFBZkEsZUF2Q2E7QUF3Q2JLLEVBQUFBLEtBQUssRUFBTEEsS0F4Q2E7QUF5Q2JtQixFQUFBQSxPQUFPLEVBQVBBLE9BekNhO0FBMENiVyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQTFDYTtBQTJDYk8sRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkEzQ2E7QUE0Q2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBNUNhO0FBNkNicUIsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkE3Q2E7QUE4Q2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBOUNhO0FBK0NiVyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQS9DYTtBQWdEYk0sRUFBQUEsV0FBVyxFQUFYQTtBQWhEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZzE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZzE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZzI5ID0gc3RydWN0KHtcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZzM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWc3QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZzcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZzEyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZzEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnMThBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWczOUFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWczOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgMDogc2NhbGFyLFxuICAgIDE6IHNjYWxhcixcbiAgICAyOiBzY2FsYXIsXG4gICAgMzogc2NhbGFyLFxuICAgIDQ6IHNjYWxhcixcbiAgICA2OiBCbG9ja01hc3RlckNvbmZpZzYsXG4gICAgNzogQmxvY2tNYXN0ZXJDb25maWc3QXJyYXksXG4gICAgODogQmxvY2tNYXN0ZXJDb25maWc4LFxuICAgIDk6IEZsb2F0QXJyYXksXG4gICAgMTI6IEJsb2NrTWFzdGVyQ29uZmlnMTJBcnJheSxcbiAgICAxNDogQmxvY2tNYXN0ZXJDb25maWcxNCxcbiAgICAxNTogQmxvY2tNYXN0ZXJDb25maWcxNSxcbiAgICAxNjogQmxvY2tNYXN0ZXJDb25maWcxNixcbiAgICAxNzogQmxvY2tNYXN0ZXJDb25maWcxNyxcbiAgICAxODogQmxvY2tNYXN0ZXJDb25maWcxOEFycmF5LFxuICAgIDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICAyMjogQmxvY2tMaW1pdHMsXG4gICAgMjM6IEJsb2NrTGltaXRzLFxuICAgIDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIDI4OiBCbG9ja01hc3RlckNvbmZpZzI4LFxuICAgIDI5OiBCbG9ja01hc3RlckNvbmZpZzI5LFxuICAgIDMxOiBTdHJpbmdBcnJheSxcbiAgICAzMjogVmFsaWRhdG9yU2V0LFxuICAgIDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgMzQ6IFZhbGlkYXRvclNldCxcbiAgICAzNTogVmFsaWRhdG9yU2V0LFxuICAgIDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgMzc6IFZhbGlkYXRvclNldCxcbiAgICAzOTogQmxvY2tNYXN0ZXJDb25maWczOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMuZmV0Y2hEb2NCeUtleShwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLmZldGNoRG9jc0J5S2V5cyhwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWc2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZzgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZzE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZzE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZzI5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==