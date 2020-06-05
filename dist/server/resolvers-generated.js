"use strict";

const {
  scalar,
  bigUInt1,
  bigUInt2,
  resolveBigUInt,
  struct,
  array,
  join,
  joinArray,
  enumName,
  createEnumNameResolver,
  unixMillisecondsToString,
  unixSecondsToString
} = require('./db-types.js');

const OtherCurrency = struct({
  currency: scalar,
  value: bigUInt2
});
const ExtBlkRef = struct({
  end_lt: bigUInt1,
  seq_no: scalar,
  root_hash: scalar,
  file_hash: scalar
});
const MsgEnvelope = struct({
  msg_id: scalar,
  next_addr: scalar,
  cur_addr: scalar,
  fwd_fee_remaining: bigUInt2
});
const InMsg = struct({
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
  msg_id: scalar,
  ihr_fee: bigUInt2,
  proof_created: scalar,
  in_msg: MsgEnvelope,
  fwd_fee: bigUInt2,
  out_msg: MsgEnvelope,
  transit_fee: bigUInt2,
  transaction_id: scalar,
  proof_delivered: scalar
});
const OutMsg = struct({
  msg_type: scalar,
  msg_type_name: enumName('msg_type', {
    External: 0,
    Immediately: 1,
    OutMsgNew: 2,
    Transit: 3,
    DequeueImmediately: 4,
    Dequeue: 5,
    TransitRequired: 6,
    DequeueShort: 7,
    None: -1
  }),
  msg_id: scalar,
  transaction_id: scalar,
  out_msg: MsgEnvelope,
  reimport: InMsg,
  imported: InMsg,
  import_block_lt: bigUInt1,
  msg_env_hash: scalar,
  next_workchain: scalar,
  next_addr_pfx: bigUInt1
});
const OtherCurrencyArray = array(() => OtherCurrency);
const BlockValueFlow = struct({
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
const BlockAccountBlocksTransactions = struct({
  lt: bigUInt1,
  transaction_id: scalar,
  total_fees: bigUInt2,
  total_fees_other: OtherCurrencyArray
});
const BlockAccountBlocksTransactionsArray = array(() => BlockAccountBlocksTransactions);
const BlockAccountBlocks = struct({
  account_addr: scalar,
  transactions: BlockAccountBlocksTransactionsArray,
  old_hash: scalar,
  new_hash: scalar,
  tr_count: scalar
});
const BlockStateUpdate = struct({
  new: scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
const BlockMasterShardHashesDescr = struct({
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
const BlockMasterShardHashes = struct({
  workchain_id: scalar,
  shard: scalar,
  descr: BlockMasterShardHashesDescr
});
const BlockMasterShardFees = struct({
  workchain_id: scalar,
  shard: scalar,
  fees: bigUInt2,
  fees_other: OtherCurrencyArray,
  create: bigUInt2,
  create_other: OtherCurrencyArray
});
const BlockMasterPrevBlkSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
const BlockMasterConfigP6 = struct({
  mint_new_price: scalar,
  mint_add_price: scalar
});
const BlockMasterConfigP7 = struct({
  currency: scalar,
  value: scalar
});
const BlockMasterConfigP8 = struct({
  version: scalar,
  capabilities: scalar
});
const ConfigProposalSetup = struct({
  min_tot_rounds: scalar,
  max_tot_rounds: scalar,
  min_wins: scalar,
  max_losses: scalar,
  min_store_sec: scalar,
  max_store_sec: scalar,
  bit_price: scalar,
  cell_price: scalar
});
const BlockMasterConfigP11 = struct({
  normal_params: ConfigProposalSetup,
  critical_params: ConfigProposalSetup
});
const BlockMasterConfigP12 = struct({
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
const BlockMasterConfigP14 = struct({
  masterchain_block_fee: bigUInt2,
  basechain_block_fee: bigUInt2
});
const BlockMasterConfigP15 = struct({
  validators_elected_for: scalar,
  elections_start_before: scalar,
  elections_end_before: scalar,
  stake_held_for: scalar
});
const BlockMasterConfigP16 = struct({
  max_validators: scalar,
  max_main_validators: scalar,
  min_validators: scalar
});
const BlockMasterConfigP17 = struct({
  min_stake: bigUInt2,
  max_stake: bigUInt2,
  min_total_stake: bigUInt2,
  max_stake_factor: scalar
});
const BlockMasterConfigP18 = struct({
  utime_since: scalar,
  bit_price_ps: bigUInt1,
  cell_price_ps: bigUInt1,
  mc_bit_price_ps: bigUInt1,
  mc_cell_price_ps: bigUInt1
});
const GasLimitsPrices = struct({
  gas_price: bigUInt1,
  gas_limit: bigUInt1,
  special_gas_limit: bigUInt1,
  gas_credit: bigUInt1,
  block_gas_limit: bigUInt1,
  freeze_due_limit: bigUInt1,
  delete_due_limit: bigUInt1,
  flat_gas_limit: bigUInt1,
  flat_gas_price: bigUInt1
});
const BlockLimitsBytes = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimitsGas = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimitsLtDelta = struct({
  underload: scalar,
  soft_limit: scalar,
  hard_limit: scalar
});
const BlockLimits = struct({
  bytes: BlockLimitsBytes,
  gas: BlockLimitsGas,
  lt_delta: BlockLimitsLtDelta
});
const MsgForwardPrices = struct({
  lump_price: bigUInt1,
  bit_price: bigUInt1,
  cell_price: bigUInt1,
  ihr_price_factor: scalar,
  first_frac: scalar,
  next_frac: scalar
});
const BlockMasterConfigP28 = struct({
  shuffle_mc_validators: scalar,
  mc_catchain_lifetime: scalar,
  shard_catchain_lifetime: scalar,
  shard_validators_lifetime: scalar,
  shard_validators_num: scalar
});
const BlockMasterConfigP29 = struct({
  new_catchain_ids: scalar,
  round_candidates: scalar,
  next_candidate_delay_ms: scalar,
  consensus_timeout_ms: scalar,
  fast_attempts: scalar,
  attempt_duration: scalar,
  catchain_max_deps: scalar,
  max_block_bytes: scalar,
  max_collated_bytes: scalar
});
const ValidatorSetList = struct({
  public_key: scalar,
  weight: bigUInt1,
  adnl_addr: scalar
});
const ValidatorSetListArray = array(() => ValidatorSetList);
const ValidatorSet = struct({
  utime_since: scalar,
  utime_until: scalar,
  total: scalar,
  total_weight: bigUInt1,
  list: ValidatorSetListArray
});
const BlockMasterConfigP39 = struct({
  adnl_addr: scalar,
  temp_public_key: scalar,
  seqno: scalar,
  valid_until: scalar,
  signature_r: scalar,
  signature_s: scalar
});
const BlockMasterConfigP7Array = array(() => BlockMasterConfigP7);
const FloatArray = array(() => scalar);
const BlockMasterConfigP12Array = array(() => BlockMasterConfigP12);
const BlockMasterConfigP18Array = array(() => BlockMasterConfigP18);
const StringArray = array(() => scalar);
const BlockMasterConfigP39Array = array(() => BlockMasterConfigP39);
const BlockMasterConfig = struct({
  p0: scalar,
  p1: scalar,
  p2: scalar,
  p3: scalar,
  p4: scalar,
  p6: BlockMasterConfigP6,
  p7: BlockMasterConfigP7Array,
  p8: BlockMasterConfigP8,
  p9: FloatArray,
  p10: FloatArray,
  p11: BlockMasterConfigP11,
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
const BlockMasterShardHashesArray = array(() => BlockMasterShardHashes);
const BlockMasterShardFeesArray = array(() => BlockMasterShardFees);
const BlockMasterPrevBlkSignaturesArray = array(() => BlockMasterPrevBlkSignatures);
const BlockMaster = struct({
  min_shard_gen_utime: scalar,
  max_shard_gen_utime: scalar,
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg,
  prev_blk_signatures: BlockMasterPrevBlkSignaturesArray,
  config_addr: scalar,
  config: BlockMasterConfig
});
const BlockSignaturesSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
const BlockSignaturesSignaturesArray = array(() => BlockSignaturesSignatures);
const BlockSignatures = struct({
  id: scalar,
  gen_utime: scalar,
  seq_no: scalar,
  shard: scalar,
  workchain_id: scalar,
  proof: scalar,
  validator_list_hash_short: scalar,
  catchain_seqno: scalar,
  sig_weight: bigUInt1,
  signatures: BlockSignaturesSignaturesArray,
  block: join('id', 'id', 'blocks', () => Block)
}, true);
const InMsgArray = array(() => InMsg);
const OutMsgArray = array(() => OutMsg);
const BlockAccountBlocksArray = array(() => BlockAccountBlocks);
const Block = struct({
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
  gen_software_version: scalar,
  gen_software_capabilities: scalar,
  value_flow: BlockValueFlow,
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockAccountBlocksArray,
  tr_count: scalar,
  state_update: BlockStateUpdate,
  master: BlockMaster,
  key_block: scalar,
  boc: scalar,
  signatures: join('id', 'id', 'blocks_signatures', () => BlockSignatures)
}, true);
const TransactionStorage = struct({
  storage_fees_collected: bigUInt2,
  storage_fees_due: bigUInt2,
  status_change: scalar,
  status_change_name: enumName('status_change', {
    Unchanged: 0,
    Frozen: 1,
    Deleted: 2
  })
});
const TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: bigUInt2,
  credit_other: OtherCurrencyArray
});
const TransactionCompute = struct({
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
const TransactionAction = struct({
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
const TransactionBounce = struct({
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
const TransactionSplitInfo = struct({
  cur_shard_pfx_len: scalar,
  acc_split_depth: scalar,
  this_addr: scalar,
  sibling_addr: scalar
});
const MessageArray = array(() => Message);
const Transaction = struct({
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
  block: join('block_id', 'id', 'blocks', () => Block),
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
  in_message: join('in_msg', 'id', 'messages', () => Message),
  out_msgs: StringArray,
  out_messages: joinArray('out_msgs', 'id', 'messages', () => Message),
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
  boc: scalar,
  balance_delta: bigUInt2,
  balance_delta_other: OtherCurrencyArray
}, true);
const Message = struct({
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
  block: join('block_id', 'id', 'blocks', () => Block),
  body: scalar,
  body_hash: scalar,
  split_depth: scalar,
  tick: scalar,
  tock: scalar,
  code: scalar,
  code_hash: scalar,
  data: scalar,
  data_hash: scalar,
  library: scalar,
  library_hash: scalar,
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
  boc: scalar,
  src_transaction: join('id', 'out_msgs[*]', 'transactions', () => Transaction),
  dst_transaction: join('id', 'in_msg', 'transactions', () => Transaction)
}, true);
const Account = struct({
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
  code_hash: scalar,
  data: scalar,
  data_hash: scalar,
  library: scalar,
  library_hash: scalar,
  proof: scalar,
  boc: scalar
}, true);

function createResolvers(db) {
  return {
    OtherCurrency: {
      value(parent, args) {
        return resolveBigUInt(2, parent.value, args);
      }

    },
    ExtBlkRef: {
      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      }

    },
    MsgEnvelope: {
      fwd_fee_remaining(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee_remaining, args);
      }

    },
    InMsg: {
      ihr_fee(parent, args) {
        return resolveBigUInt(2, parent.ihr_fee, args);
      },

      fwd_fee(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee, args);
      },

      transit_fee(parent, args) {
        return resolveBigUInt(2, parent.transit_fee, args);
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
      import_block_lt(parent, args) {
        return resolveBigUInt(1, parent.import_block_lt, args);
      },

      next_addr_pfx(parent, args) {
        return resolveBigUInt(1, parent.next_addr_pfx, args);
      },

      msg_type_name: createEnumNameResolver('msg_type', {
        External: 0,
        Immediately: 1,
        OutMsgNew: 2,
        Transit: 3,
        DequeueImmediately: 4,
        Dequeue: 5,
        TransitRequired: 6,
        DequeueShort: 7,
        None: -1
      })
    },
    BlockValueFlow: {
      to_next_blk(parent, args) {
        return resolveBigUInt(2, parent.to_next_blk, args);
      },

      exported(parent, args) {
        return resolveBigUInt(2, parent.exported, args);
      },

      fees_collected(parent, args) {
        return resolveBigUInt(2, parent.fees_collected, args);
      },

      created(parent, args) {
        return resolveBigUInt(2, parent.created, args);
      },

      imported(parent, args) {
        return resolveBigUInt(2, parent.imported, args);
      },

      from_prev_blk(parent, args) {
        return resolveBigUInt(2, parent.from_prev_blk, args);
      },

      minted(parent, args) {
        return resolveBigUInt(2, parent.minted, args);
      },

      fees_imported(parent, args) {
        return resolveBigUInt(2, parent.fees_imported, args);
      }

    },
    BlockAccountBlocksTransactions: {
      lt(parent, args) {
        return resolveBigUInt(1, parent.lt, args);
      },

      total_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fees, args);
      }

    },
    BlockMasterShardHashesDescr: {
      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      },

      fees_collected(parent, args) {
        return resolveBigUInt(2, parent.fees_collected, args);
      },

      funds_created(parent, args) {
        return resolveBigUInt(2, parent.funds_created, args);
      },

      gen_utime_string(parent, args) {
        return unixSecondsToString(parent.gen_utime);
      },

      split_type_name: createEnumNameResolver('split_type', {
        None: 0,
        Split: 2,
        Merge: 3
      })
    },
    BlockMasterShardFees: {
      fees(parent, args) {
        return resolveBigUInt(2, parent.fees, args);
      },

      create(parent, args) {
        return resolveBigUInt(2, parent.create, args);
      }

    },
    BlockMasterConfigP14: {
      masterchain_block_fee(parent, args) {
        return resolveBigUInt(2, parent.masterchain_block_fee, args);
      },

      basechain_block_fee(parent, args) {
        return resolveBigUInt(2, parent.basechain_block_fee, args);
      }

    },
    BlockMasterConfigP17: {
      min_stake(parent, args) {
        return resolveBigUInt(2, parent.min_stake, args);
      },

      max_stake(parent, args) {
        return resolveBigUInt(2, parent.max_stake, args);
      },

      min_total_stake(parent, args) {
        return resolveBigUInt(2, parent.min_total_stake, args);
      }

    },
    BlockMasterConfigP18: {
      bit_price_ps(parent, args) {
        return resolveBigUInt(1, parent.bit_price_ps, args);
      },

      cell_price_ps(parent, args) {
        return resolveBigUInt(1, parent.cell_price_ps, args);
      },

      mc_bit_price_ps(parent, args) {
        return resolveBigUInt(1, parent.mc_bit_price_ps, args);
      },

      mc_cell_price_ps(parent, args) {
        return resolveBigUInt(1, parent.mc_cell_price_ps, args);
      },

      utime_since_string(parent, args) {
        return unixSecondsToString(parent.utime_since);
      }

    },
    GasLimitsPrices: {
      gas_price(parent, args) {
        return resolveBigUInt(1, parent.gas_price, args);
      },

      gas_limit(parent, args) {
        return resolveBigUInt(1, parent.gas_limit, args);
      },

      special_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.special_gas_limit, args);
      },

      gas_credit(parent, args) {
        return resolveBigUInt(1, parent.gas_credit, args);
      },

      block_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.block_gas_limit, args);
      },

      freeze_due_limit(parent, args) {
        return resolveBigUInt(1, parent.freeze_due_limit, args);
      },

      delete_due_limit(parent, args) {
        return resolveBigUInt(1, parent.delete_due_limit, args);
      },

      flat_gas_limit(parent, args) {
        return resolveBigUInt(1, parent.flat_gas_limit, args);
      },

      flat_gas_price(parent, args) {
        return resolveBigUInt(1, parent.flat_gas_price, args);
      }

    },
    MsgForwardPrices: {
      lump_price(parent, args) {
        return resolveBigUInt(1, parent.lump_price, args);
      },

      bit_price(parent, args) {
        return resolveBigUInt(1, parent.bit_price, args);
      },

      cell_price(parent, args) {
        return resolveBigUInt(1, parent.cell_price, args);
      }

    },
    ValidatorSetList: {
      weight(parent, args) {
        return resolveBigUInt(1, parent.weight, args);
      }

    },
    ValidatorSet: {
      total_weight(parent, args) {
        return resolveBigUInt(1, parent.total_weight, args);
      },

      utime_since_string(parent, args) {
        return unixSecondsToString(parent.utime_since);
      },

      utime_until_string(parent, args) {
        return unixSecondsToString(parent.utime_until);
      }

    },
    BlockSignatures: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        if (args.when && !BlockSignatures.test(null, parent, args.when)) {
          return null;
        }

        return context.db.blocks.waitForDoc(parent._key, '_key', args);
      },

      sig_weight(parent, args) {
        return resolveBigUInt(1, parent.sig_weight, args);
      },

      gen_utime_string(parent, args) {
        return unixSecondsToString(parent.gen_utime);
      }

    },
    Block: {
      id(parent) {
        return parent._key;
      },

      signatures(parent, args, context) {
        if (args.when && !Block.test(null, parent, args.when)) {
          return null;
        }

        return context.db.blocks_signatures.waitForDoc(parent._key, '_key', args);
      },

      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      },

      gen_utime_string(parent, args) {
        return unixSecondsToString(parent.gen_utime);
      },

      status_name: createEnumNameResolver('status', {
        Unknown: 0,
        Proposed: 1,
        Finalized: 2,
        Refused: 3
      })
    },
    TransactionStorage: {
      storage_fees_collected(parent, args) {
        return resolveBigUInt(2, parent.storage_fees_collected, args);
      },

      storage_fees_due(parent, args) {
        return resolveBigUInt(2, parent.storage_fees_due, args);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionCredit: {
      due_fees_collected(parent, args) {
        return resolveBigUInt(2, parent.due_fees_collected, args);
      },

      credit(parent, args) {
        return resolveBigUInt(2, parent.credit, args);
      }

    },
    TransactionCompute: {
      gas_fees(parent, args) {
        return resolveBigUInt(2, parent.gas_fees, args);
      },

      gas_used(parent, args) {
        return resolveBigUInt(1, parent.gas_used, args);
      },

      gas_limit(parent, args) {
        return resolveBigUInt(1, parent.gas_limit, args);
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
      total_fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fwd_fees, args);
      },

      total_action_fees(parent, args) {
        return resolveBigUInt(2, parent.total_action_fees, args);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionBounce: {
      req_fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.req_fwd_fees, args);
      },

      msg_fees(parent, args) {
        return resolveBigUInt(2, parent.msg_fees, args);
      },

      fwd_fees(parent, args) {
        return resolveBigUInt(2, parent.fwd_fees, args);
      },

      bounce_type_name: createEnumNameResolver('bounce_type', {
        NegFunds: 0,
        NoFunds: 1,
        Ok: 2
      })
    },
    Transaction: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        if (args.when && !Transaction.test(null, parent, args.when)) {
          return null;
        }

        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      in_message(parent, args, context) {
        if (args.when && !Transaction.test(null, parent, args.when)) {
          return null;
        }

        return context.db.messages.waitForDoc(parent.in_msg, '_key', args);
      },

      out_messages(parent, args, context) {
        if (args.when && !Transaction.test(null, parent, args.when)) {
          return null;
        }

        return context.db.messages.waitForDocs(parent.out_msgs, '_key', args);
      },

      lt(parent, args) {
        return resolveBigUInt(1, parent.lt, args);
      },

      prev_trans_lt(parent, args) {
        return resolveBigUInt(1, parent.prev_trans_lt, args);
      },

      total_fees(parent, args) {
        return resolveBigUInt(2, parent.total_fees, args);
      },

      balance_delta(parent, args) {
        return resolveBigUInt(2, parent.balance_delta, args);
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
    Message: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        if (args.when && !Message.test(null, parent, args.when)) {
          return null;
        }

        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      src_transaction(parent, args, context) {
        if (!(parent.created_lt !== '00' && parent.msg_type !== 1)) {
          return null;
        }

        if (args.when && !Message.test(null, parent, args.when)) {
          return null;
        }

        return context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]', args);
      },

      dst_transaction(parent, args, context) {
        if (!(parent.msg_type !== 2)) {
          return null;
        }

        if (args.when && !Message.test(null, parent, args.when)) {
          return null;
        }

        return context.db.transactions.waitForDoc(parent._key, 'in_msg', args);
      },

      created_lt(parent, args) {
        return resolveBigUInt(1, parent.created_lt, args);
      },

      ihr_fee(parent, args) {
        return resolveBigUInt(2, parent.ihr_fee, args);
      },

      fwd_fee(parent, args) {
        return resolveBigUInt(2, parent.fwd_fee, args);
      },

      import_fee(parent, args) {
        return resolveBigUInt(2, parent.import_fee, args);
      },

      value(parent, args) {
        return resolveBigUInt(2, parent.value, args);
      },

      created_at_string(parent, args) {
        return unixSecondsToString(parent.created_at);
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
    Account: {
      id(parent) {
        return parent._key;
      },

      due_payment(parent, args) {
        return resolveBigUInt(2, parent.due_payment, args);
      },

      last_trans_lt(parent, args) {
        return resolveBigUInt(1, parent.last_trans_lt, args);
      },

      balance(parent, args) {
        return resolveBigUInt(2, parent.balance, args);
      },

      acc_type_name: createEnumNameResolver('acc_type', {
        Uninit: 0,
        Active: 1,
        Frozen: 2
      })
    },
    Query: {
      blocks_signatures: db.blocks_signatures.queryResolver(),
      blocks: db.blocks.queryResolver(),
      transactions: db.transactions.queryResolver(),
      messages: db.messages.queryResolver(),
      accounts: db.accounts.queryResolver()
    },
    Subscription: {
      blocks_signatures: db.blocks_signatures.subscriptionResolver(),
      blocks: db.blocks.subscriptionResolver(),
      transactions: db.transactions.subscriptionResolver(),
      messages: db.messages.subscriptionResolver(),
      accounts: db.accounts.subscriptionResolver()
    }
  };
}

const scalarFields = new Map();
scalarFields.set('blocks_signatures.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('blocks_signatures.gen_utime', {
  type: 'number',
  path: 'doc.gen_utime'
});
scalarFields.set('blocks_signatures.seq_no', {
  type: 'number',
  path: 'doc.seq_no'
});
scalarFields.set('blocks_signatures.shard', {
  type: 'string',
  path: 'doc.shard'
});
scalarFields.set('blocks_signatures.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('blocks_signatures.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('blocks_signatures.validator_list_hash_short', {
  type: 'number',
  path: 'doc.validator_list_hash_short'
});
scalarFields.set('blocks_signatures.catchain_seqno', {
  type: 'number',
  path: 'doc.catchain_seqno'
});
scalarFields.set('blocks_signatures.sig_weight', {
  type: 'uint64',
  path: 'doc.sig_weight'
});
scalarFields.set('blocks_signatures.signatures.node_id', {
  type: 'string',
  path: 'doc.signatures[*].node_id'
});
scalarFields.set('blocks_signatures.signatures.r', {
  type: 'string',
  path: 'doc.signatures[*].r'
});
scalarFields.set('blocks_signatures.signatures.s', {
  type: 'string',
  path: 'doc.signatures[*].s'
});
scalarFields.set('blocks.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('blocks.global_id', {
  type: 'number',
  path: 'doc.global_id'
});
scalarFields.set('blocks.want_split', {
  type: 'boolean',
  path: 'doc.want_split'
});
scalarFields.set('blocks.seq_no', {
  type: 'number',
  path: 'doc.seq_no'
});
scalarFields.set('blocks.after_merge', {
  type: 'boolean',
  path: 'doc.after_merge'
});
scalarFields.set('blocks.gen_utime', {
  type: 'number',
  path: 'doc.gen_utime'
});
scalarFields.set('blocks.gen_catchain_seqno', {
  type: 'number',
  path: 'doc.gen_catchain_seqno'
});
scalarFields.set('blocks.flags', {
  type: 'number',
  path: 'doc.flags'
});
scalarFields.set('blocks.master_ref.end_lt', {
  type: 'uint64',
  path: 'doc.master_ref.end_lt'
});
scalarFields.set('blocks.master_ref.seq_no', {
  type: 'number',
  path: 'doc.master_ref.seq_no'
});
scalarFields.set('blocks.master_ref.root_hash', {
  type: 'string',
  path: 'doc.master_ref.root_hash'
});
scalarFields.set('blocks.master_ref.file_hash', {
  type: 'string',
  path: 'doc.master_ref.file_hash'
});
scalarFields.set('blocks.prev_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_ref.end_lt'
});
scalarFields.set('blocks.prev_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_ref.seq_no'
});
scalarFields.set('blocks.prev_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_ref.root_hash'
});
scalarFields.set('blocks.prev_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_ref.file_hash'
});
scalarFields.set('blocks.prev_alt_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_alt_ref.end_lt'
});
scalarFields.set('blocks.prev_alt_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_alt_ref.seq_no'
});
scalarFields.set('blocks.prev_alt_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_alt_ref.root_hash'
});
scalarFields.set('blocks.prev_alt_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_alt_ref.file_hash'
});
scalarFields.set('blocks.prev_vert_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_vert_ref.end_lt'
});
scalarFields.set('blocks.prev_vert_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_vert_ref.seq_no'
});
scalarFields.set('blocks.prev_vert_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_vert_ref.root_hash'
});
scalarFields.set('blocks.prev_vert_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_vert_ref.file_hash'
});
scalarFields.set('blocks.prev_vert_alt_ref.end_lt', {
  type: 'uint64',
  path: 'doc.prev_vert_alt_ref.end_lt'
});
scalarFields.set('blocks.prev_vert_alt_ref.seq_no', {
  type: 'number',
  path: 'doc.prev_vert_alt_ref.seq_no'
});
scalarFields.set('blocks.prev_vert_alt_ref.root_hash', {
  type: 'string',
  path: 'doc.prev_vert_alt_ref.root_hash'
});
scalarFields.set('blocks.prev_vert_alt_ref.file_hash', {
  type: 'string',
  path: 'doc.prev_vert_alt_ref.file_hash'
});
scalarFields.set('blocks.version', {
  type: 'number',
  path: 'doc.version'
});
scalarFields.set('blocks.gen_validator_list_hash_short', {
  type: 'number',
  path: 'doc.gen_validator_list_hash_short'
});
scalarFields.set('blocks.before_split', {
  type: 'boolean',
  path: 'doc.before_split'
});
scalarFields.set('blocks.after_split', {
  type: 'boolean',
  path: 'doc.after_split'
});
scalarFields.set('blocks.want_merge', {
  type: 'boolean',
  path: 'doc.want_merge'
});
scalarFields.set('blocks.vert_seq_no', {
  type: 'number',
  path: 'doc.vert_seq_no'
});
scalarFields.set('blocks.start_lt', {
  type: 'uint64',
  path: 'doc.start_lt'
});
scalarFields.set('blocks.end_lt', {
  type: 'uint64',
  path: 'doc.end_lt'
});
scalarFields.set('blocks.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('blocks.shard', {
  type: 'string',
  path: 'doc.shard'
});
scalarFields.set('blocks.min_ref_mc_seqno', {
  type: 'number',
  path: 'doc.min_ref_mc_seqno'
});
scalarFields.set('blocks.prev_key_block_seqno', {
  type: 'number',
  path: 'doc.prev_key_block_seqno'
});
scalarFields.set('blocks.gen_software_version', {
  type: 'number',
  path: 'doc.gen_software_version'
});
scalarFields.set('blocks.gen_software_capabilities', {
  type: 'string',
  path: 'doc.gen_software_capabilities'
});
scalarFields.set('blocks.value_flow.to_next_blk', {
  type: 'uint1024',
  path: 'doc.value_flow.to_next_blk'
});
scalarFields.set('blocks.value_flow.to_next_blk_other.currency', {
  type: 'number',
  path: 'doc.value_flow.to_next_blk_other[*].currency'
});
scalarFields.set('blocks.value_flow.to_next_blk_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.to_next_blk_other[*].value'
});
scalarFields.set('blocks.value_flow.exported', {
  type: 'uint1024',
  path: 'doc.value_flow.exported'
});
scalarFields.set('blocks.value_flow.exported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.exported_other[*].currency'
});
scalarFields.set('blocks.value_flow.exported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.exported_other[*].value'
});
scalarFields.set('blocks.value_flow.fees_collected', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_collected'
});
scalarFields.set('blocks.value_flow.fees_collected_other.currency', {
  type: 'number',
  path: 'doc.value_flow.fees_collected_other[*].currency'
});
scalarFields.set('blocks.value_flow.fees_collected_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_collected_other[*].value'
});
scalarFields.set('blocks.value_flow.created', {
  type: 'uint1024',
  path: 'doc.value_flow.created'
});
scalarFields.set('blocks.value_flow.created_other.currency', {
  type: 'number',
  path: 'doc.value_flow.created_other[*].currency'
});
scalarFields.set('blocks.value_flow.created_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.created_other[*].value'
});
scalarFields.set('blocks.value_flow.imported', {
  type: 'uint1024',
  path: 'doc.value_flow.imported'
});
scalarFields.set('blocks.value_flow.imported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.imported_other[*].currency'
});
scalarFields.set('blocks.value_flow.imported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.imported_other[*].value'
});
scalarFields.set('blocks.value_flow.from_prev_blk', {
  type: 'uint1024',
  path: 'doc.value_flow.from_prev_blk'
});
scalarFields.set('blocks.value_flow.from_prev_blk_other.currency', {
  type: 'number',
  path: 'doc.value_flow.from_prev_blk_other[*].currency'
});
scalarFields.set('blocks.value_flow.from_prev_blk_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.from_prev_blk_other[*].value'
});
scalarFields.set('blocks.value_flow.minted', {
  type: 'uint1024',
  path: 'doc.value_flow.minted'
});
scalarFields.set('blocks.value_flow.minted_other.currency', {
  type: 'number',
  path: 'doc.value_flow.minted_other[*].currency'
});
scalarFields.set('blocks.value_flow.minted_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.minted_other[*].value'
});
scalarFields.set('blocks.value_flow.fees_imported', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_imported'
});
scalarFields.set('blocks.value_flow.fees_imported_other.currency', {
  type: 'number',
  path: 'doc.value_flow.fees_imported_other[*].currency'
});
scalarFields.set('blocks.value_flow.fees_imported_other.value', {
  type: 'uint1024',
  path: 'doc.value_flow.fees_imported_other[*].value'
});
scalarFields.set('blocks.in_msg_descr.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].msg_id'
});
scalarFields.set('blocks.in_msg_descr.ihr_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].ihr_fee'
});
scalarFields.set('blocks.in_msg_descr.proof_created', {
  type: 'string',
  path: 'doc.in_msg_descr[*].proof_created'
});
scalarFields.set('blocks.in_msg_descr.in_msg.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.msg_id'
});
scalarFields.set('blocks.in_msg_descr.in_msg.next_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.next_addr'
});
scalarFields.set('blocks.in_msg_descr.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].in_msg.cur_addr'
});
scalarFields.set('blocks.in_msg_descr.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.in_msg_descr.fwd_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].fwd_fee'
});
scalarFields.set('blocks.in_msg_descr.out_msg.msg_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.msg_id'
});
scalarFields.set('blocks.in_msg_descr.out_msg.next_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.next_addr'
});
scalarFields.set('blocks.in_msg_descr.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.in_msg_descr[*].out_msg.cur_addr'
});
scalarFields.set('blocks.in_msg_descr.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.in_msg_descr.transit_fee', {
  type: 'uint1024',
  path: 'doc.in_msg_descr[*].transit_fee'
});
scalarFields.set('blocks.in_msg_descr.transaction_id', {
  type: 'string',
  path: 'doc.in_msg_descr[*].transaction_id'
});
scalarFields.set('blocks.in_msg_descr.proof_delivered', {
  type: 'string',
  path: 'doc.in_msg_descr[*].proof_delivered'
});
scalarFields.set('blocks.rand_seed', {
  type: 'string',
  path: 'doc.rand_seed'
});
scalarFields.set('blocks.out_msg_descr.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].msg_id'
});
scalarFields.set('blocks.out_msg_descr.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].transaction_id'
});
scalarFields.set('blocks.out_msg_descr.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.ihr_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.ihr_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.proof_created', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.proof_created'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.in_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.fwd_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.fwd_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.reimport.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.reimport.transit_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].reimport.transit_fee'
});
scalarFields.set('blocks.out_msg_descr.reimport.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.transaction_id'
});
scalarFields.set('blocks.out_msg_descr.reimport.proof_delivered', {
  type: 'string',
  path: 'doc.out_msg_descr[*].reimport.proof_delivered'
});
scalarFields.set('blocks.out_msg_descr.imported.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.ihr_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.ihr_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.proof_created', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.proof_created'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.in_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.imported.fwd_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.fwd_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.msg_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.msg_id'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.next_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.next_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.out_msg.cur_addr'
});
scalarFields.set('blocks.out_msg_descr.imported.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.out_msg_descr.imported.transit_fee', {
  type: 'uint1024',
  path: 'doc.out_msg_descr[*].imported.transit_fee'
});
scalarFields.set('blocks.out_msg_descr.imported.transaction_id', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.transaction_id'
});
scalarFields.set('blocks.out_msg_descr.imported.proof_delivered', {
  type: 'string',
  path: 'doc.out_msg_descr[*].imported.proof_delivered'
});
scalarFields.set('blocks.out_msg_descr.import_block_lt', {
  type: 'uint64',
  path: 'doc.out_msg_descr[*].import_block_lt'
});
scalarFields.set('blocks.out_msg_descr.msg_env_hash', {
  type: 'string',
  path: 'doc.out_msg_descr[*].msg_env_hash'
});
scalarFields.set('blocks.out_msg_descr.next_workchain', {
  type: 'number',
  path: 'doc.out_msg_descr[*].next_workchain'
});
scalarFields.set('blocks.out_msg_descr.next_addr_pfx', {
  type: 'uint64',
  path: 'doc.out_msg_descr[*].next_addr_pfx'
});
scalarFields.set('blocks.account_blocks.account_addr', {
  type: 'string',
  path: 'doc.account_blocks[*].account_addr'
});
scalarFields.set('blocks.account_blocks.transactions.lt', {
  type: 'uint64',
  path: 'doc.account_blocks[*].transactions[**].lt'
});
scalarFields.set('blocks.account_blocks.transactions.transaction_id', {
  type: 'string',
  path: 'doc.account_blocks[*].transactions[**].transaction_id'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees', {
  type: 'uint1024',
  path: 'doc.account_blocks[*].transactions[**].total_fees'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees_other.currency', {
  type: 'number',
  path: 'doc.account_blocks[*].transactions[**].total_fees_other[***].currency'
});
scalarFields.set('blocks.account_blocks.transactions.total_fees_other.value', {
  type: 'uint1024',
  path: 'doc.account_blocks[*].transactions[**].total_fees_other[***].value'
});
scalarFields.set('blocks.account_blocks.old_hash', {
  type: 'string',
  path: 'doc.account_blocks[*].old_hash'
});
scalarFields.set('blocks.account_blocks.new_hash', {
  type: 'string',
  path: 'doc.account_blocks[*].new_hash'
});
scalarFields.set('blocks.account_blocks.tr_count', {
  type: 'number',
  path: 'doc.account_blocks[*].tr_count'
});
scalarFields.set('blocks.tr_count', {
  type: 'number',
  path: 'doc.tr_count'
});
scalarFields.set('blocks.state_update.new', {
  type: 'string',
  path: 'doc.state_update.new'
});
scalarFields.set('blocks.state_update.new_hash', {
  type: 'string',
  path: 'doc.state_update.new_hash'
});
scalarFields.set('blocks.state_update.new_depth', {
  type: 'number',
  path: 'doc.state_update.new_depth'
});
scalarFields.set('blocks.state_update.old', {
  type: 'string',
  path: 'doc.state_update.old'
});
scalarFields.set('blocks.state_update.old_hash', {
  type: 'string',
  path: 'doc.state_update.old_hash'
});
scalarFields.set('blocks.state_update.old_depth', {
  type: 'number',
  path: 'doc.state_update.old_depth'
});
scalarFields.set('blocks.master.min_shard_gen_utime', {
  type: 'number',
  path: 'doc.master.min_shard_gen_utime'
});
scalarFields.set('blocks.master.max_shard_gen_utime', {
  type: 'number',
  path: 'doc.master.max_shard_gen_utime'
});
scalarFields.set('blocks.master.shard_hashes.workchain_id', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].workchain_id'
});
scalarFields.set('blocks.master.shard_hashes.shard', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].shard'
});
scalarFields.set('blocks.master.shard_hashes.descr.seq_no', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.seq_no'
});
scalarFields.set('blocks.master.shard_hashes.descr.reg_mc_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.reg_mc_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.start_lt', {
  type: 'uint64',
  path: 'doc.master.shard_hashes[*].descr.start_lt'
});
scalarFields.set('blocks.master.shard_hashes.descr.end_lt', {
  type: 'uint64',
  path: 'doc.master.shard_hashes[*].descr.end_lt'
});
scalarFields.set('blocks.master.shard_hashes.descr.root_hash', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.root_hash'
});
scalarFields.set('blocks.master.shard_hashes.descr.file_hash', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.file_hash'
});
scalarFields.set('blocks.master.shard_hashes.descr.before_split', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.before_split'
});
scalarFields.set('blocks.master.shard_hashes.descr.before_merge', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.before_merge'
});
scalarFields.set('blocks.master.shard_hashes.descr.want_split', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.want_split'
});
scalarFields.set('blocks.master.shard_hashes.descr.want_merge', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.want_merge'
});
scalarFields.set('blocks.master.shard_hashes.descr.nx_cc_updated', {
  type: 'boolean',
  path: 'doc.master.shard_hashes[*].descr.nx_cc_updated'
});
scalarFields.set('blocks.master.shard_hashes.descr.flags', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.flags'
});
scalarFields.set('blocks.master.shard_hashes.descr.next_catchain_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.next_catchain_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.next_validator_shard', {
  type: 'string',
  path: 'doc.master.shard_hashes[*].descr.next_validator_shard'
});
scalarFields.set('blocks.master.shard_hashes.descr.min_ref_mc_seqno', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.min_ref_mc_seqno'
});
scalarFields.set('blocks.master.shard_hashes.descr.gen_utime', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.gen_utime'
});
scalarFields.set('blocks.master.shard_hashes.descr.split', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.split'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.fees_collected'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected_other.currency', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.fees_collected_other[**].currency'
});
scalarFields.set('blocks.master.shard_hashes.descr.fees_collected_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.fees_collected_other[**].value'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.funds_created'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created_other.currency', {
  type: 'number',
  path: 'doc.master.shard_hashes[*].descr.funds_created_other[**].currency'
});
scalarFields.set('blocks.master.shard_hashes.descr.funds_created_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_hashes[*].descr.funds_created_other[**].value'
});
scalarFields.set('blocks.master.shard_fees.workchain_id', {
  type: 'number',
  path: 'doc.master.shard_fees[*].workchain_id'
});
scalarFields.set('blocks.master.shard_fees.shard', {
  type: 'string',
  path: 'doc.master.shard_fees[*].shard'
});
scalarFields.set('blocks.master.shard_fees.fees', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].fees'
});
scalarFields.set('blocks.master.shard_fees.fees_other.currency', {
  type: 'number',
  path: 'doc.master.shard_fees[*].fees_other[**].currency'
});
scalarFields.set('blocks.master.shard_fees.fees_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].fees_other[**].value'
});
scalarFields.set('blocks.master.shard_fees.create', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].create'
});
scalarFields.set('blocks.master.shard_fees.create_other.currency', {
  type: 'number',
  path: 'doc.master.shard_fees[*].create_other[**].currency'
});
scalarFields.set('blocks.master.shard_fees.create_other.value', {
  type: 'uint1024',
  path: 'doc.master.shard_fees[*].create_other[**].value'
});
scalarFields.set('blocks.master.recover_create_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.ihr_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.ihr_fee'
});
scalarFields.set('blocks.master.recover_create_msg.proof_created', {
  type: 'string',
  path: 'doc.master.recover_create_msg.proof_created'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.next_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.next_addr'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.cur_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.in_msg.cur_addr'
});
scalarFields.set('blocks.master.recover_create_msg.in_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.in_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.master.recover_create_msg.fwd_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.fwd_fee'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.msg_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.msg_id'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.next_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.next_addr'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.cur_addr', {
  type: 'string',
  path: 'doc.master.recover_create_msg.out_msg.cur_addr'
});
scalarFields.set('blocks.master.recover_create_msg.out_msg.fwd_fee_remaining', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.out_msg.fwd_fee_remaining'
});
scalarFields.set('blocks.master.recover_create_msg.transit_fee', {
  type: 'uint1024',
  path: 'doc.master.recover_create_msg.transit_fee'
});
scalarFields.set('blocks.master.recover_create_msg.transaction_id', {
  type: 'string',
  path: 'doc.master.recover_create_msg.transaction_id'
});
scalarFields.set('blocks.master.recover_create_msg.proof_delivered', {
  type: 'string',
  path: 'doc.master.recover_create_msg.proof_delivered'
});
scalarFields.set('blocks.master.prev_blk_signatures.node_id', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].node_id'
});
scalarFields.set('blocks.master.prev_blk_signatures.r', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].r'
});
scalarFields.set('blocks.master.prev_blk_signatures.s', {
  type: 'string',
  path: 'doc.master.prev_blk_signatures[*].s'
});
scalarFields.set('blocks.master.config_addr', {
  type: 'string',
  path: 'doc.master.config_addr'
});
scalarFields.set('blocks.master.config.p0', {
  type: 'string',
  path: 'doc.master.config.p0'
});
scalarFields.set('blocks.master.config.p1', {
  type: 'string',
  path: 'doc.master.config.p1'
});
scalarFields.set('blocks.master.config.p2', {
  type: 'string',
  path: 'doc.master.config.p2'
});
scalarFields.set('blocks.master.config.p3', {
  type: 'string',
  path: 'doc.master.config.p3'
});
scalarFields.set('blocks.master.config.p4', {
  type: 'string',
  path: 'doc.master.config.p4'
});
scalarFields.set('blocks.master.config.p6.mint_new_price', {
  type: 'string',
  path: 'doc.master.config.p6.mint_new_price'
});
scalarFields.set('blocks.master.config.p6.mint_add_price', {
  type: 'string',
  path: 'doc.master.config.p6.mint_add_price'
});
scalarFields.set('blocks.master.config.p7.currency', {
  type: 'number',
  path: 'doc.master.config.p7[*].currency'
});
scalarFields.set('blocks.master.config.p7.value', {
  type: 'string',
  path: 'doc.master.config.p7[*].value'
});
scalarFields.set('blocks.master.config.p8.version', {
  type: 'number',
  path: 'doc.master.config.p8.version'
});
scalarFields.set('blocks.master.config.p8.capabilities', {
  type: 'string',
  path: 'doc.master.config.p8.capabilities'
});
scalarFields.set('blocks.master.config.p9', {
  type: 'number',
  path: 'doc.master.config.p9[*]'
});
scalarFields.set('blocks.master.config.p10', {
  type: 'number',
  path: 'doc.master.config.p10[*]'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_wins', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_wins'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_losses', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_losses'
});
scalarFields.set('blocks.master.config.p11.normal_params.min_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.min_store_sec'
});
scalarFields.set('blocks.master.config.p11.normal_params.max_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.max_store_sec'
});
scalarFields.set('blocks.master.config.p11.normal_params.bit_price', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.bit_price'
});
scalarFields.set('blocks.master.config.p11.normal_params.cell_price', {
  type: 'number',
  path: 'doc.master.config.p11.normal_params.cell_price'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_tot_rounds', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_tot_rounds'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_wins', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_wins'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_losses', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_losses'
});
scalarFields.set('blocks.master.config.p11.critical_params.min_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.min_store_sec'
});
scalarFields.set('blocks.master.config.p11.critical_params.max_store_sec', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.max_store_sec'
});
scalarFields.set('blocks.master.config.p11.critical_params.bit_price', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.bit_price'
});
scalarFields.set('blocks.master.config.p11.critical_params.cell_price', {
  type: 'number',
  path: 'doc.master.config.p11.critical_params.cell_price'
});
scalarFields.set('blocks.master.config.p12.workchain_id', {
  type: 'number',
  path: 'doc.master.config.p12[*].workchain_id'
});
scalarFields.set('blocks.master.config.p12.enabled_since', {
  type: 'number',
  path: 'doc.master.config.p12[*].enabled_since'
});
scalarFields.set('blocks.master.config.p12.actual_min_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].actual_min_split'
});
scalarFields.set('blocks.master.config.p12.min_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].min_split'
});
scalarFields.set('blocks.master.config.p12.max_split', {
  type: 'number',
  path: 'doc.master.config.p12[*].max_split'
});
scalarFields.set('blocks.master.config.p12.active', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].active'
});
scalarFields.set('blocks.master.config.p12.accept_msgs', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].accept_msgs'
});
scalarFields.set('blocks.master.config.p12.flags', {
  type: 'number',
  path: 'doc.master.config.p12[*].flags'
});
scalarFields.set('blocks.master.config.p12.zerostate_root_hash', {
  type: 'string',
  path: 'doc.master.config.p12[*].zerostate_root_hash'
});
scalarFields.set('blocks.master.config.p12.zerostate_file_hash', {
  type: 'string',
  path: 'doc.master.config.p12[*].zerostate_file_hash'
});
scalarFields.set('blocks.master.config.p12.version', {
  type: 'number',
  path: 'doc.master.config.p12[*].version'
});
scalarFields.set('blocks.master.config.p12.basic', {
  type: 'boolean',
  path: 'doc.master.config.p12[*].basic'
});
scalarFields.set('blocks.master.config.p12.vm_version', {
  type: 'number',
  path: 'doc.master.config.p12[*].vm_version'
});
scalarFields.set('blocks.master.config.p12.vm_mode', {
  type: 'string',
  path: 'doc.master.config.p12[*].vm_mode'
});
scalarFields.set('blocks.master.config.p12.min_addr_len', {
  type: 'number',
  path: 'doc.master.config.p12[*].min_addr_len'
});
scalarFields.set('blocks.master.config.p12.max_addr_len', {
  type: 'number',
  path: 'doc.master.config.p12[*].max_addr_len'
});
scalarFields.set('blocks.master.config.p12.addr_len_step', {
  type: 'number',
  path: 'doc.master.config.p12[*].addr_len_step'
});
scalarFields.set('blocks.master.config.p12.workchain_type_id', {
  type: 'number',
  path: 'doc.master.config.p12[*].workchain_type_id'
});
scalarFields.set('blocks.master.config.p14.masterchain_block_fee', {
  type: 'uint1024',
  path: 'doc.master.config.p14.masterchain_block_fee'
});
scalarFields.set('blocks.master.config.p14.basechain_block_fee', {
  type: 'uint1024',
  path: 'doc.master.config.p14.basechain_block_fee'
});
scalarFields.set('blocks.master.config.p15.validators_elected_for', {
  type: 'number',
  path: 'doc.master.config.p15.validators_elected_for'
});
scalarFields.set('blocks.master.config.p15.elections_start_before', {
  type: 'number',
  path: 'doc.master.config.p15.elections_start_before'
});
scalarFields.set('blocks.master.config.p15.elections_end_before', {
  type: 'number',
  path: 'doc.master.config.p15.elections_end_before'
});
scalarFields.set('blocks.master.config.p15.stake_held_for', {
  type: 'number',
  path: 'doc.master.config.p15.stake_held_for'
});
scalarFields.set('blocks.master.config.p16.max_validators', {
  type: 'number',
  path: 'doc.master.config.p16.max_validators'
});
scalarFields.set('blocks.master.config.p16.max_main_validators', {
  type: 'number',
  path: 'doc.master.config.p16.max_main_validators'
});
scalarFields.set('blocks.master.config.p16.min_validators', {
  type: 'number',
  path: 'doc.master.config.p16.min_validators'
});
scalarFields.set('blocks.master.config.p17.min_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.min_stake'
});
scalarFields.set('blocks.master.config.p17.max_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.max_stake'
});
scalarFields.set('blocks.master.config.p17.min_total_stake', {
  type: 'uint1024',
  path: 'doc.master.config.p17.min_total_stake'
});
scalarFields.set('blocks.master.config.p17.max_stake_factor', {
  type: 'number',
  path: 'doc.master.config.p17.max_stake_factor'
});
scalarFields.set('blocks.master.config.p18.utime_since', {
  type: 'number',
  path: 'doc.master.config.p18[*].utime_since'
});
scalarFields.set('blocks.master.config.p18.bit_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.cell_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].cell_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_bit_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].mc_bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_cell_price_ps', {
  type: 'uint64',
  path: 'doc.master.config.p18[*].mc_cell_price_ps'
});
scalarFields.set('blocks.master.config.p20.gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_price'
});
scalarFields.set('blocks.master.config.p20.gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_limit'
});
scalarFields.set('blocks.master.config.p20.special_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.special_gas_limit'
});
scalarFields.set('blocks.master.config.p20.gas_credit', {
  type: 'uint64',
  path: 'doc.master.config.p20.gas_credit'
});
scalarFields.set('blocks.master.config.p20.block_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.block_gas_limit'
});
scalarFields.set('blocks.master.config.p20.freeze_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p20.delete_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.delete_due_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p20.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p20.flat_gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_limit'
});
scalarFields.set('blocks.master.config.p21.special_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.special_gas_limit'
});
scalarFields.set('blocks.master.config.p21.gas_credit', {
  type: 'uint64',
  path: 'doc.master.config.p21.gas_credit'
});
scalarFields.set('blocks.master.config.p21.block_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.block_gas_limit'
});
scalarFields.set('blocks.master.config.p21.freeze_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p21.delete_due_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.delete_due_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_limit', {
  type: 'uint64',
  path: 'doc.master.config.p21.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_price', {
  type: 'uint64',
  path: 'doc.master.config.p21.flat_gas_price'
});
scalarFields.set('blocks.master.config.p22.bytes.underload', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.underload'
});
scalarFields.set('blocks.master.config.p22.bytes.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.soft_limit'
});
scalarFields.set('blocks.master.config.p22.bytes.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.bytes.hard_limit'
});
scalarFields.set('blocks.master.config.p22.gas.underload', {
  type: 'number',
  path: 'doc.master.config.p22.gas.underload'
});
scalarFields.set('blocks.master.config.p22.gas.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.gas.soft_limit'
});
scalarFields.set('blocks.master.config.p22.gas.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.gas.hard_limit'
});
scalarFields.set('blocks.master.config.p22.lt_delta.underload', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.underload'
});
scalarFields.set('blocks.master.config.p22.lt_delta.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.soft_limit'
});
scalarFields.set('blocks.master.config.p22.lt_delta.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p22.lt_delta.hard_limit'
});
scalarFields.set('blocks.master.config.p23.bytes.underload', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.underload'
});
scalarFields.set('blocks.master.config.p23.bytes.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.soft_limit'
});
scalarFields.set('blocks.master.config.p23.bytes.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.bytes.hard_limit'
});
scalarFields.set('blocks.master.config.p23.gas.underload', {
  type: 'number',
  path: 'doc.master.config.p23.gas.underload'
});
scalarFields.set('blocks.master.config.p23.gas.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.gas.soft_limit'
});
scalarFields.set('blocks.master.config.p23.gas.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.gas.hard_limit'
});
scalarFields.set('blocks.master.config.p23.lt_delta.underload', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.underload'
});
scalarFields.set('blocks.master.config.p23.lt_delta.soft_limit', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.soft_limit'
});
scalarFields.set('blocks.master.config.p23.lt_delta.hard_limit', {
  type: 'number',
  path: 'doc.master.config.p23.lt_delta.hard_limit'
});
scalarFields.set('blocks.master.config.p24.lump_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.lump_price'
});
scalarFields.set('blocks.master.config.p24.bit_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.bit_price'
});
scalarFields.set('blocks.master.config.p24.cell_price', {
  type: 'uint64',
  path: 'doc.master.config.p24.cell_price'
});
scalarFields.set('blocks.master.config.p24.ihr_price_factor', {
  type: 'number',
  path: 'doc.master.config.p24.ihr_price_factor'
});
scalarFields.set('blocks.master.config.p24.first_frac', {
  type: 'number',
  path: 'doc.master.config.p24.first_frac'
});
scalarFields.set('blocks.master.config.p24.next_frac', {
  type: 'number',
  path: 'doc.master.config.p24.next_frac'
});
scalarFields.set('blocks.master.config.p25.lump_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.lump_price'
});
scalarFields.set('blocks.master.config.p25.bit_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.bit_price'
});
scalarFields.set('blocks.master.config.p25.cell_price', {
  type: 'uint64',
  path: 'doc.master.config.p25.cell_price'
});
scalarFields.set('blocks.master.config.p25.ihr_price_factor', {
  type: 'number',
  path: 'doc.master.config.p25.ihr_price_factor'
});
scalarFields.set('blocks.master.config.p25.first_frac', {
  type: 'number',
  path: 'doc.master.config.p25.first_frac'
});
scalarFields.set('blocks.master.config.p25.next_frac', {
  type: 'number',
  path: 'doc.master.config.p25.next_frac'
});
scalarFields.set('blocks.master.config.p28.shuffle_mc_validators', {
  type: 'boolean',
  path: 'doc.master.config.p28.shuffle_mc_validators'
});
scalarFields.set('blocks.master.config.p28.mc_catchain_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.mc_catchain_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_catchain_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.shard_catchain_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_validators_lifetime', {
  type: 'number',
  path: 'doc.master.config.p28.shard_validators_lifetime'
});
scalarFields.set('blocks.master.config.p28.shard_validators_num', {
  type: 'number',
  path: 'doc.master.config.p28.shard_validators_num'
});
scalarFields.set('blocks.master.config.p29.new_catchain_ids', {
  type: 'boolean',
  path: 'doc.master.config.p29.new_catchain_ids'
});
scalarFields.set('blocks.master.config.p29.round_candidates', {
  type: 'number',
  path: 'doc.master.config.p29.round_candidates'
});
scalarFields.set('blocks.master.config.p29.next_candidate_delay_ms', {
  type: 'number',
  path: 'doc.master.config.p29.next_candidate_delay_ms'
});
scalarFields.set('blocks.master.config.p29.consensus_timeout_ms', {
  type: 'number',
  path: 'doc.master.config.p29.consensus_timeout_ms'
});
scalarFields.set('blocks.master.config.p29.fast_attempts', {
  type: 'number',
  path: 'doc.master.config.p29.fast_attempts'
});
scalarFields.set('blocks.master.config.p29.attempt_duration', {
  type: 'number',
  path: 'doc.master.config.p29.attempt_duration'
});
scalarFields.set('blocks.master.config.p29.catchain_max_deps', {
  type: 'number',
  path: 'doc.master.config.p29.catchain_max_deps'
});
scalarFields.set('blocks.master.config.p29.max_block_bytes', {
  type: 'number',
  path: 'doc.master.config.p29.max_block_bytes'
});
scalarFields.set('blocks.master.config.p29.max_collated_bytes', {
  type: 'number',
  path: 'doc.master.config.p29.max_collated_bytes'
});
scalarFields.set('blocks.master.config.p31', {
  type: 'string',
  path: 'doc.master.config.p31[*]'
});
scalarFields.set('blocks.master.config.p32.utime_since', {
  type: 'number',
  path: 'doc.master.config.p32.utime_since'
});
scalarFields.set('blocks.master.config.p32.utime_until', {
  type: 'number',
  path: 'doc.master.config.p32.utime_until'
});
scalarFields.set('blocks.master.config.p32.total', {
  type: 'number',
  path: 'doc.master.config.p32.total'
});
scalarFields.set('blocks.master.config.p32.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p32.total_weight'
});
scalarFields.set('blocks.master.config.p32.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p32.list[*].public_key'
});
scalarFields.set('blocks.master.config.p32.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p32.list[*].weight'
});
scalarFields.set('blocks.master.config.p32.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p32.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p33.utime_since', {
  type: 'number',
  path: 'doc.master.config.p33.utime_since'
});
scalarFields.set('blocks.master.config.p33.utime_until', {
  type: 'number',
  path: 'doc.master.config.p33.utime_until'
});
scalarFields.set('blocks.master.config.p33.total', {
  type: 'number',
  path: 'doc.master.config.p33.total'
});
scalarFields.set('blocks.master.config.p33.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p33.total_weight'
});
scalarFields.set('blocks.master.config.p33.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p33.list[*].public_key'
});
scalarFields.set('blocks.master.config.p33.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p33.list[*].weight'
});
scalarFields.set('blocks.master.config.p33.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p33.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p34.utime_since', {
  type: 'number',
  path: 'doc.master.config.p34.utime_since'
});
scalarFields.set('blocks.master.config.p34.utime_until', {
  type: 'number',
  path: 'doc.master.config.p34.utime_until'
});
scalarFields.set('blocks.master.config.p34.total', {
  type: 'number',
  path: 'doc.master.config.p34.total'
});
scalarFields.set('blocks.master.config.p34.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p34.total_weight'
});
scalarFields.set('blocks.master.config.p34.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p34.list[*].public_key'
});
scalarFields.set('blocks.master.config.p34.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p34.list[*].weight'
});
scalarFields.set('blocks.master.config.p34.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p34.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p35.utime_since', {
  type: 'number',
  path: 'doc.master.config.p35.utime_since'
});
scalarFields.set('blocks.master.config.p35.utime_until', {
  type: 'number',
  path: 'doc.master.config.p35.utime_until'
});
scalarFields.set('blocks.master.config.p35.total', {
  type: 'number',
  path: 'doc.master.config.p35.total'
});
scalarFields.set('blocks.master.config.p35.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p35.total_weight'
});
scalarFields.set('blocks.master.config.p35.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p35.list[*].public_key'
});
scalarFields.set('blocks.master.config.p35.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p35.list[*].weight'
});
scalarFields.set('blocks.master.config.p35.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p35.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p36.utime_since', {
  type: 'number',
  path: 'doc.master.config.p36.utime_since'
});
scalarFields.set('blocks.master.config.p36.utime_until', {
  type: 'number',
  path: 'doc.master.config.p36.utime_until'
});
scalarFields.set('blocks.master.config.p36.total', {
  type: 'number',
  path: 'doc.master.config.p36.total'
});
scalarFields.set('blocks.master.config.p36.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p36.total_weight'
});
scalarFields.set('blocks.master.config.p36.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p36.list[*].public_key'
});
scalarFields.set('blocks.master.config.p36.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p36.list[*].weight'
});
scalarFields.set('blocks.master.config.p36.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p36.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p37.utime_since', {
  type: 'number',
  path: 'doc.master.config.p37.utime_since'
});
scalarFields.set('blocks.master.config.p37.utime_until', {
  type: 'number',
  path: 'doc.master.config.p37.utime_until'
});
scalarFields.set('blocks.master.config.p37.total', {
  type: 'number',
  path: 'doc.master.config.p37.total'
});
scalarFields.set('blocks.master.config.p37.total_weight', {
  type: 'uint64',
  path: 'doc.master.config.p37.total_weight'
});
scalarFields.set('blocks.master.config.p37.list.public_key', {
  type: 'string',
  path: 'doc.master.config.p37.list[*].public_key'
});
scalarFields.set('blocks.master.config.p37.list.weight', {
  type: 'uint64',
  path: 'doc.master.config.p37.list[*].weight'
});
scalarFields.set('blocks.master.config.p37.list.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p37.list[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p39.adnl_addr', {
  type: 'string',
  path: 'doc.master.config.p39[*].adnl_addr'
});
scalarFields.set('blocks.master.config.p39.temp_public_key', {
  type: 'string',
  path: 'doc.master.config.p39[*].temp_public_key'
});
scalarFields.set('blocks.master.config.p39.seqno', {
  type: 'number',
  path: 'doc.master.config.p39[*].seqno'
});
scalarFields.set('blocks.master.config.p39.valid_until', {
  type: 'number',
  path: 'doc.master.config.p39[*].valid_until'
});
scalarFields.set('blocks.master.config.p39.signature_r', {
  type: 'string',
  path: 'doc.master.config.p39[*].signature_r'
});
scalarFields.set('blocks.master.config.p39.signature_s', {
  type: 'string',
  path: 'doc.master.config.p39[*].signature_s'
});
scalarFields.set('blocks.key_block', {
  type: 'boolean',
  path: 'doc.key_block'
});
scalarFields.set('blocks.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('transactions.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('transactions.block_id', {
  type: 'string',
  path: 'doc.block_id'
});
scalarFields.set('transactions.account_addr', {
  type: 'string',
  path: 'doc.account_addr'
});
scalarFields.set('transactions.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('transactions.lt', {
  type: 'uint64',
  path: 'doc.lt'
});
scalarFields.set('transactions.prev_trans_hash', {
  type: 'string',
  path: 'doc.prev_trans_hash'
});
scalarFields.set('transactions.prev_trans_lt', {
  type: 'uint64',
  path: 'doc.prev_trans_lt'
});
scalarFields.set('transactions.now', {
  type: 'number',
  path: 'doc.now'
});
scalarFields.set('transactions.outmsg_cnt', {
  type: 'number',
  path: 'doc.outmsg_cnt'
});
scalarFields.set('transactions.in_msg', {
  type: 'string',
  path: 'doc.in_msg'
});
scalarFields.set('transactions.out_msgs', {
  type: 'string',
  path: 'doc.out_msgs[*]'
});
scalarFields.set('transactions.total_fees', {
  type: 'uint1024',
  path: 'doc.total_fees'
});
scalarFields.set('transactions.total_fees_other.currency', {
  type: 'number',
  path: 'doc.total_fees_other[*].currency'
});
scalarFields.set('transactions.total_fees_other.value', {
  type: 'uint1024',
  path: 'doc.total_fees_other[*].value'
});
scalarFields.set('transactions.old_hash', {
  type: 'string',
  path: 'doc.old_hash'
});
scalarFields.set('transactions.new_hash', {
  type: 'string',
  path: 'doc.new_hash'
});
scalarFields.set('transactions.credit_first', {
  type: 'boolean',
  path: 'doc.credit_first'
});
scalarFields.set('transactions.storage.storage_fees_collected', {
  type: 'uint1024',
  path: 'doc.storage.storage_fees_collected'
});
scalarFields.set('transactions.storage.storage_fees_due', {
  type: 'uint1024',
  path: 'doc.storage.storage_fees_due'
});
scalarFields.set('transactions.credit.due_fees_collected', {
  type: 'uint1024',
  path: 'doc.credit.due_fees_collected'
});
scalarFields.set('transactions.credit.credit', {
  type: 'uint1024',
  path: 'doc.credit.credit'
});
scalarFields.set('transactions.credit.credit_other.currency', {
  type: 'number',
  path: 'doc.credit.credit_other[*].currency'
});
scalarFields.set('transactions.credit.credit_other.value', {
  type: 'uint1024',
  path: 'doc.credit.credit_other[*].value'
});
scalarFields.set('transactions.compute.success', {
  type: 'boolean',
  path: 'doc.compute.success'
});
scalarFields.set('transactions.compute.msg_state_used', {
  type: 'boolean',
  path: 'doc.compute.msg_state_used'
});
scalarFields.set('transactions.compute.account_activated', {
  type: 'boolean',
  path: 'doc.compute.account_activated'
});
scalarFields.set('transactions.compute.gas_fees', {
  type: 'uint1024',
  path: 'doc.compute.gas_fees'
});
scalarFields.set('transactions.compute.gas_used', {
  type: 'uint64',
  path: 'doc.compute.gas_used'
});
scalarFields.set('transactions.compute.gas_limit', {
  type: 'uint64',
  path: 'doc.compute.gas_limit'
});
scalarFields.set('transactions.compute.gas_credit', {
  type: 'number',
  path: 'doc.compute.gas_credit'
});
scalarFields.set('transactions.compute.mode', {
  type: 'number',
  path: 'doc.compute.mode'
});
scalarFields.set('transactions.compute.exit_code', {
  type: 'number',
  path: 'doc.compute.exit_code'
});
scalarFields.set('transactions.compute.exit_arg', {
  type: 'number',
  path: 'doc.compute.exit_arg'
});
scalarFields.set('transactions.compute.vm_steps', {
  type: 'number',
  path: 'doc.compute.vm_steps'
});
scalarFields.set('transactions.compute.vm_init_state_hash', {
  type: 'string',
  path: 'doc.compute.vm_init_state_hash'
});
scalarFields.set('transactions.compute.vm_final_state_hash', {
  type: 'string',
  path: 'doc.compute.vm_final_state_hash'
});
scalarFields.set('transactions.action.success', {
  type: 'boolean',
  path: 'doc.action.success'
});
scalarFields.set('transactions.action.valid', {
  type: 'boolean',
  path: 'doc.action.valid'
});
scalarFields.set('transactions.action.no_funds', {
  type: 'boolean',
  path: 'doc.action.no_funds'
});
scalarFields.set('transactions.action.total_fwd_fees', {
  type: 'uint1024',
  path: 'doc.action.total_fwd_fees'
});
scalarFields.set('transactions.action.total_action_fees', {
  type: 'uint1024',
  path: 'doc.action.total_action_fees'
});
scalarFields.set('transactions.action.result_code', {
  type: 'number',
  path: 'doc.action.result_code'
});
scalarFields.set('transactions.action.result_arg', {
  type: 'number',
  path: 'doc.action.result_arg'
});
scalarFields.set('transactions.action.tot_actions', {
  type: 'number',
  path: 'doc.action.tot_actions'
});
scalarFields.set('transactions.action.spec_actions', {
  type: 'number',
  path: 'doc.action.spec_actions'
});
scalarFields.set('transactions.action.skipped_actions', {
  type: 'number',
  path: 'doc.action.skipped_actions'
});
scalarFields.set('transactions.action.msgs_created', {
  type: 'number',
  path: 'doc.action.msgs_created'
});
scalarFields.set('transactions.action.action_list_hash', {
  type: 'string',
  path: 'doc.action.action_list_hash'
});
scalarFields.set('transactions.action.total_msg_size_cells', {
  type: 'number',
  path: 'doc.action.total_msg_size_cells'
});
scalarFields.set('transactions.action.total_msg_size_bits', {
  type: 'number',
  path: 'doc.action.total_msg_size_bits'
});
scalarFields.set('transactions.bounce.msg_size_cells', {
  type: 'number',
  path: 'doc.bounce.msg_size_cells'
});
scalarFields.set('transactions.bounce.msg_size_bits', {
  type: 'number',
  path: 'doc.bounce.msg_size_bits'
});
scalarFields.set('transactions.bounce.req_fwd_fees', {
  type: 'uint1024',
  path: 'doc.bounce.req_fwd_fees'
});
scalarFields.set('transactions.bounce.msg_fees', {
  type: 'uint1024',
  path: 'doc.bounce.msg_fees'
});
scalarFields.set('transactions.bounce.fwd_fees', {
  type: 'uint1024',
  path: 'doc.bounce.fwd_fees'
});
scalarFields.set('transactions.aborted', {
  type: 'boolean',
  path: 'doc.aborted'
});
scalarFields.set('transactions.destroyed', {
  type: 'boolean',
  path: 'doc.destroyed'
});
scalarFields.set('transactions.tt', {
  type: 'string',
  path: 'doc.tt'
});
scalarFields.set('transactions.split_info.cur_shard_pfx_len', {
  type: 'number',
  path: 'doc.split_info.cur_shard_pfx_len'
});
scalarFields.set('transactions.split_info.acc_split_depth', {
  type: 'number',
  path: 'doc.split_info.acc_split_depth'
});
scalarFields.set('transactions.split_info.this_addr', {
  type: 'string',
  path: 'doc.split_info.this_addr'
});
scalarFields.set('transactions.split_info.sibling_addr', {
  type: 'string',
  path: 'doc.split_info.sibling_addr'
});
scalarFields.set('transactions.prepare_transaction', {
  type: 'string',
  path: 'doc.prepare_transaction'
});
scalarFields.set('transactions.installed', {
  type: 'boolean',
  path: 'doc.installed'
});
scalarFields.set('transactions.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('transactions.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('transactions.balance_delta', {
  type: 'uint1024',
  path: 'doc.balance_delta'
});
scalarFields.set('transactions.balance_delta_other.currency', {
  type: 'number',
  path: 'doc.balance_delta_other[*].currency'
});
scalarFields.set('transactions.balance_delta_other.value', {
  type: 'uint1024',
  path: 'doc.balance_delta_other[*].value'
});
scalarFields.set('messages.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('messages.block_id', {
  type: 'string',
  path: 'doc.block_id'
});
scalarFields.set('messages.body', {
  type: 'string',
  path: 'doc.body'
});
scalarFields.set('messages.body_hash', {
  type: 'string',
  path: 'doc.body_hash'
});
scalarFields.set('messages.split_depth', {
  type: 'number',
  path: 'doc.split_depth'
});
scalarFields.set('messages.tick', {
  type: 'boolean',
  path: 'doc.tick'
});
scalarFields.set('messages.tock', {
  type: 'boolean',
  path: 'doc.tock'
});
scalarFields.set('messages.code', {
  type: 'string',
  path: 'doc.code'
});
scalarFields.set('messages.code_hash', {
  type: 'string',
  path: 'doc.code_hash'
});
scalarFields.set('messages.data', {
  type: 'string',
  path: 'doc.data'
});
scalarFields.set('messages.data_hash', {
  type: 'string',
  path: 'doc.data_hash'
});
scalarFields.set('messages.library', {
  type: 'string',
  path: 'doc.library'
});
scalarFields.set('messages.library_hash', {
  type: 'string',
  path: 'doc.library_hash'
});
scalarFields.set('messages.src', {
  type: 'string',
  path: 'doc.src'
});
scalarFields.set('messages.dst', {
  type: 'string',
  path: 'doc.dst'
});
scalarFields.set('messages.src_workchain_id', {
  type: 'number',
  path: 'doc.src_workchain_id'
});
scalarFields.set('messages.dst_workchain_id', {
  type: 'number',
  path: 'doc.dst_workchain_id'
});
scalarFields.set('messages.created_lt', {
  type: 'uint64',
  path: 'doc.created_lt'
});
scalarFields.set('messages.created_at', {
  type: 'number',
  path: 'doc.created_at'
});
scalarFields.set('messages.ihr_disabled', {
  type: 'boolean',
  path: 'doc.ihr_disabled'
});
scalarFields.set('messages.ihr_fee', {
  type: 'uint1024',
  path: 'doc.ihr_fee'
});
scalarFields.set('messages.fwd_fee', {
  type: 'uint1024',
  path: 'doc.fwd_fee'
});
scalarFields.set('messages.import_fee', {
  type: 'uint1024',
  path: 'doc.import_fee'
});
scalarFields.set('messages.bounce', {
  type: 'boolean',
  path: 'doc.bounce'
});
scalarFields.set('messages.bounced', {
  type: 'boolean',
  path: 'doc.bounced'
});
scalarFields.set('messages.value', {
  type: 'uint1024',
  path: 'doc.value'
});
scalarFields.set('messages.value_other.currency', {
  type: 'number',
  path: 'doc.value_other[*].currency'
});
scalarFields.set('messages.value_other.value', {
  type: 'uint1024',
  path: 'doc.value_other[*].value'
});
scalarFields.set('messages.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('messages.boc', {
  type: 'string',
  path: 'doc.boc'
});
scalarFields.set('accounts.id', {
  type: 'string',
  path: 'doc._key'
});
scalarFields.set('accounts.workchain_id', {
  type: 'number',
  path: 'doc.workchain_id'
});
scalarFields.set('accounts.last_paid', {
  type: 'number',
  path: 'doc.last_paid'
});
scalarFields.set('accounts.due_payment', {
  type: 'uint1024',
  path: 'doc.due_payment'
});
scalarFields.set('accounts.last_trans_lt', {
  type: 'uint64',
  path: 'doc.last_trans_lt'
});
scalarFields.set('accounts.balance', {
  type: 'uint1024',
  path: 'doc.balance'
});
scalarFields.set('accounts.balance_other.currency', {
  type: 'number',
  path: 'doc.balance_other[*].currency'
});
scalarFields.set('accounts.balance_other.value', {
  type: 'uint1024',
  path: 'doc.balance_other[*].value'
});
scalarFields.set('accounts.split_depth', {
  type: 'number',
  path: 'doc.split_depth'
});
scalarFields.set('accounts.tick', {
  type: 'boolean',
  path: 'doc.tick'
});
scalarFields.set('accounts.tock', {
  type: 'boolean',
  path: 'doc.tock'
});
scalarFields.set('accounts.code', {
  type: 'string',
  path: 'doc.code'
});
scalarFields.set('accounts.code_hash', {
  type: 'string',
  path: 'doc.code_hash'
});
scalarFields.set('accounts.data', {
  type: 'string',
  path: 'doc.data'
});
scalarFields.set('accounts.data_hash', {
  type: 'string',
  path: 'doc.data_hash'
});
scalarFields.set('accounts.library', {
  type: 'string',
  path: 'doc.library'
});
scalarFields.set('accounts.library_hash', {
  type: 'string',
  path: 'doc.library_hash'
});
scalarFields.set('accounts.proof', {
  type: 'string',
  path: 'doc.proof'
});
scalarFields.set('accounts.boc', {
  type: 'string',
  path: 'doc.boc'
});
module.exports = {
  scalarFields,
  createResolvers,
  OtherCurrency,
  ExtBlkRef,
  MsgEnvelope,
  InMsg,
  OutMsg,
  BlockValueFlow,
  BlockAccountBlocksTransactions,
  BlockAccountBlocks,
  BlockStateUpdate,
  BlockMasterShardHashesDescr,
  BlockMasterShardHashes,
  BlockMasterShardFees,
  BlockMasterPrevBlkSignatures,
  BlockMasterConfigP6,
  BlockMasterConfigP7,
  BlockMasterConfigP8,
  ConfigProposalSetup,
  BlockMasterConfigP11,
  BlockMasterConfigP12,
  BlockMasterConfigP14,
  BlockMasterConfigP15,
  BlockMasterConfigP16,
  BlockMasterConfigP17,
  BlockMasterConfigP18,
  GasLimitsPrices,
  BlockLimitsBytes,
  BlockLimitsGas,
  BlockLimitsLtDelta,
  BlockLimits,
  MsgForwardPrices,
  BlockMasterConfigP28,
  BlockMasterConfigP29,
  ValidatorSetList,
  ValidatorSet,
  BlockMasterConfigP39,
  BlockMasterConfig,
  BlockMaster,
  BlockSignaturesSignatures,
  BlockSignatures,
  Block,
  TransactionStorage,
  TransactionCredit,
  TransactionCompute,
  TransactionAction,
  TransactionBounce,
  TransactionSplitInfo,
  Transaction,
  Message,
  Account
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJyZXF1aXJlIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5IiwidmFsdWUiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnX3R5cGVfbmFtZSIsIkV4dGVybmFsIiwiSWhyIiwiSW1tZWRpYXRlbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJEZXF1ZXVlU2hvcnQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm1zZ19lbnZfaGFzaCIsIm5leHRfd29ya2NoYWluIiwibmV4dF9hZGRyX3BmeCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiQmxvY2tNYXN0ZXJDb25maWdQNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1A3IiwiQmxvY2tNYXN0ZXJDb25maWdQOCIsInZlcnNpb24iLCJjYXBhYmlsaXRpZXMiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4Iiwic2h1ZmZsZV9tY192YWxpZGF0b3JzIiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1AzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTAiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwiaWQiLCJwcm9vZiIsInZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJjYXRjaGFpbl9zZXFubyIsInNpZ193ZWlnaHQiLCJzaWduYXR1cmVzIiwiYmxvY2siLCJCbG9jayIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJrZXlfYmxvY2siLCJib2MiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJGcm96ZW4iLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIk1lc3NhZ2UiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlByZWxpbWluYXJ5IiwiYmxvY2tfaWQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYm91bmNlIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJib2R5X2hhc2giLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJnZW5fdXRpbWVfc3RyaW5nIiwidXRpbWVfc2luY2Vfc3RyaW5nIiwidXRpbWVfdW50aWxfc3RyaW5nIiwiX2tleSIsImNvbnRleHQiLCJ3aGVuIiwidGVzdCIsImJsb2NrcyIsIndhaXRGb3JEb2MiLCJibG9ja3Nfc2lnbmF0dXJlcyIsIm1lc3NhZ2VzIiwid2FpdEZvckRvY3MiLCJjcmVhdGVkX2F0X3N0cmluZyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzY2FsYXJGaWVsZHMiLCJNYXAiLCJzZXQiLCJ0eXBlIiwicGF0aCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQSxzQkFWRTtBQVdGQyxFQUFBQSx3QkFYRTtBQVlGQyxFQUFBQTtBQVpFLElBYUZDLE9BQU8sQ0FBQyxlQUFELENBYlg7O0FBY0EsTUFBTUMsYUFBYSxHQUFHVCxNQUFNLENBQUM7QUFDekJVLEVBQUFBLFFBQVEsRUFBRWQsTUFEZTtBQUV6QmUsRUFBQUEsS0FBSyxFQUFFYjtBQUZrQixDQUFELENBQTVCO0FBS0EsTUFBTWMsU0FBUyxHQUFHWixNQUFNLENBQUM7QUFDckJhLEVBQUFBLE1BQU0sRUFBRWhCLFFBRGE7QUFFckJpQixFQUFBQSxNQUFNLEVBQUVsQixNQUZhO0FBR3JCbUIsRUFBQUEsU0FBUyxFQUFFbkIsTUFIVTtBQUlyQm9CLEVBQUFBLFNBQVMsRUFBRXBCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLE1BQU1xQixXQUFXLEdBQUdqQixNQUFNLENBQUM7QUFDdkJrQixFQUFBQSxNQUFNLEVBQUV0QixNQURlO0FBRXZCdUIsRUFBQUEsU0FBUyxFQUFFdkIsTUFGWTtBQUd2QndCLEVBQUFBLFFBQVEsRUFBRXhCLE1BSGE7QUFJdkJ5QixFQUFBQSxpQkFBaUIsRUFBRXZCO0FBSkksQ0FBRCxDQUExQjtBQU9BLE1BQU13QixLQUFLLEdBQUd0QixNQUFNLENBQUM7QUFDakJ1QixFQUFBQSxRQUFRLEVBQUUzQixNQURPO0FBRWpCNEIs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bEJhO0FBbUJiRyxFQUFBQSxtQkFuQmE7QUFvQmJTLEVBQUFBLG9CQXBCYTtBQXFCYkcsRUFBQUEsb0JBckJhO0FBc0JiZ0IsRUFBQUEsb0JBdEJhO0FBdUJiRyxFQUFBQSxvQkF2QmE7QUF3QmJLLEVBQUFBLG9CQXhCYTtBQXlCYkksRUFBQUEsb0JBekJhO0FBMEJiSyxFQUFBQSxvQkExQmE7QUEyQmJNLEVBQUFBLGVBM0JhO0FBNEJiVSxFQUFBQSxnQkE1QmE7QUE2QmJJLEVBQUFBLGNBN0JhO0FBOEJiQyxFQUFBQSxrQkE5QmE7QUErQmJDLEVBQUFBLFdBL0JhO0FBZ0NiSSxFQUFBQSxnQkFoQ2E7QUFpQ2JLLEVBQUFBLG9CQWpDYTtBQWtDYk0sRUFBQUEsb0JBbENhO0FBbUNiVSxFQUFBQSxnQkFuQ2E7QUFvQ2JLLEVBQUFBLFlBcENhO0FBcUNiSyxFQUFBQSxvQkFyQ2E7QUFzQ2JZLEVBQUFBLGlCQXRDYTtBQXVDYnFDLEVBQUFBLFdBdkNhO0FBd0NiUyxFQUFBQSx5QkF4Q2E7QUF5Q2JFLEVBQUFBLGVBekNhO0FBMENiUSxFQUFBQSxLQTFDYTtBQTJDYmlDLEVBQUFBLGtCQTNDYTtBQTRDYlEsRUFBQUEsaUJBNUNhO0FBNkNiSSxFQUFBQSxrQkE3Q2E7QUE4Q2JxQixFQUFBQSxpQkE5Q2E7QUErQ2JjLEVBQUFBLGlCQS9DYTtBQWdEYlcsRUFBQUEsb0JBaERhO0FBaURiTyxFQUFBQSxXQWpEYTtBQWtEYkQsRUFBQUEsT0FsRGE7QUFtRGJzRSxFQUFBQTtBQW5EYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgIHVuaXhTZWNvbmRzVG9TdHJpbmcsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxuICAgIG1zZ19lbnZfaGFzaDogc2NhbGFyLFxuICAgIG5leHRfd29ya2NoYWluOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyX3BmeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGJpZ1VJbnQyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBiaWdVSW50MixcbiAgICBtYXhfc3Rha2U6IGJpZ1VJbnQyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogYmlnVUludDIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogYmlnVUludDEsXG4gICAgY2VsbF9wcmljZV9wczogYmlnVUludDEsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBiaWdVSW50MSxcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogYmlnVUludDEsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBiaWdVSW50MSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBiaWdVSW50MSxcbiAgICBmbGF0X2dhc19saW1pdDogYmlnVUludDEsXG4gICAgZmxhdF9nYXNfcHJpY2U6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogYmlnVUludDEsXG4gICAgYml0X3ByaWNlOiBiaWdVSW50MSxcbiAgICBjZWxsX3ByaWNlOiBiaWdVSW50MSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIG5ld19jYXRjaGFpbl9pZHM6IHNjYWxhcixcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheSgoKSA9PiBWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTA6IEZsb2F0QXJyYXksXG4gICAgcDExOiBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBjYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIHNpZ193ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbiAgICBibG9jazogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheSgoKSA9PiBJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KCgpID0+IE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAga2V5X2Jsb2NrOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCAoKSA9PiBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KCgpID0+IE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYmxvY2s6IGpvaW4oJ2Jsb2NrX2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBiYWxhbmNlX2RlbHRhOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX2RlbHRhX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBib2R5X2hhc2g6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF9hZGRyX3BmeChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfYWRkcl9wZngsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbl91dGltZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50Lmdlbl91dGltZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0OiB7XG4gICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tYXN0ZXJjaGFpbl9ibG9ja19mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYXNlY2hhaW5fYmxvY2tfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3OiB7XG4gICAgICAgICAgICBtaW5fc3Rha2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW5fc3Rha2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1heF9zdGFrZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1heF9zdGFrZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWluX3RvdGFsX3N0YWtlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4OiB7XG4gICAgICAgICAgICBiaXRfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5iaXRfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNlbGxfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jZWxsX3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtY19iaXRfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5tY19iaXRfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5tY19jZWxsX3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1dGltZV9zaW5jZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50LnV0aW1lX3NpbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEdhc0xpbWl0c1ByaWNlczoge1xuICAgICAgICAgICAgZ2FzX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwZWNpYWxfZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3BlY2lhbF9nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19jcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9ja19nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5ibG9ja19nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyZWV6ZV9kdWVfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mcmVlemVfZHVlX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVfZHVlX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZGVsZXRlX2R1ZV9saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dGb3J3YXJkUHJpY2VzOiB7XG4gICAgICAgICAgICBsdW1wX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHVtcF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYml0X3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuYml0X3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjZWxsX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY2VsbF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXRMaXN0OiB7XG4gICAgICAgICAgICB3ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC53ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0OiB7XG4gICAgICAgICAgICB0b3RhbF93ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50b3RhbF93ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3NpbmNlX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQudXRpbWVfc2luY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3VudGlsX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQudXRpbWVfdW50aWwpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhQmxvY2tTaWduYXR1cmVzLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWdfd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2lnX3dlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuX3V0aW1lX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQuZ2VuX3V0aW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFCbG9jay50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbl91dGltZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50Lmdlbl91dGltZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFUcmFuc2FjdGlvbi50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzLndhaXRGb3JEb2MocGFyZW50LmJsb2NrX2lkLCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhVHJhbnNhY3Rpb24udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZywgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhVHJhbnNhY3Rpb24udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncywgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2VfZGVsdGEocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlX2RlbHRhLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFNZXNzYWdlLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuYmxvY2tfaWQsICdfa2V5JywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmICghKHBhcmVudC5jcmVhdGVkX2x0ICE9PSAnMDAnICYmIHBhcmVudC5tc2dfdHlwZSAhPT0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIU1lc3NhZ2UudGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnb3V0X21zZ3NbKl0nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb24ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEocGFyZW50Lm1zZ190eXBlICE9PSAyKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhTWVzc2FnZS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdpbl9tc2cnLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9hdF9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50LmNyZWF0ZWRfYXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNpZ193ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnNpZ193ZWlnaHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5ub2RlX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLm5vZGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nbG9iYWxfaWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdsb2JhbF9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLndhbnRfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hZnRlcl9tZXJnZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFmdGVyX21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX2NhdGNoYWluX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5nZW5fY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlcl9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXJfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X2FsdF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfYWx0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5iZWZvcmVfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFmdGVyX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWZ0ZXJfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndhbnRfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52ZXJ0X3NlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVydF9zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXJ0X2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5zdGFydF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1pbl9yZWZfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfa2V5X2Jsb2NrX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X2tleV9ibG9ja19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3NvZnR3YXJlX3ZlcnNpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl9zb2Z0d2FyZV92ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LnRvX25leHRfYmxrJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5leHBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5pbXBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsaycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0udHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5yYW5kX3NlZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnJhbmRfc2VlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2NyZWF0ZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmluX21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zaXRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2RlbGl2ZXJlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQudHJhbnNpdF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydF9ibG9ja19sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRfYmxvY2tfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IubXNnX2Vudl9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm1zZ19lbnZfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X3dvcmtjaGFpbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5uZXh0X3dvcmtjaGFpbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X2FkZHJfcGZ4JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm5leHRfYWRkcl9wZngnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0uYWNjb3VudF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMubHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0ubHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMudG90YWxfZmVlc19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzX290aGVyWyoqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0udG90YWxfZmVlc19vdGhlclsqKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy5vbGRfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0ub2xkX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLm5ld19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5uZXdfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJfY291bnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyX2NvdW50JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy50cl9jb3VudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudHJfY291bnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXcnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5uZXcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUub2xkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnJlZ19tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5yZWdfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iuc3RhcnRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc3RhcnRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iud2FudF9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci53YW50X21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm54X2NjX3VwZGF0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm54X2NjX3VwZGF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmxhZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubWluX3JlZl9tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnNwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLnNwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mdW5kc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLnNoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uY3JlYXRlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmNyZWF0ZV9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfZmVlc1sqXS5jcmVhdGVfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnByb29mX2RlbGl2ZXJlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ubm9kZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZ19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDAnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDAnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcudmFsdWUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDgudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnA4LmNhcGFiaWxpdGllcycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC5jYXBhYmlsaXRpZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDknLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDlbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMFsqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfbG9zc2VzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9sb3NzZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9zdG9yZV9zZWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5iaXRfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3RvdF9yb3VuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3dpbnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9sb3NzZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfbG9zc2VzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl9zdG9yZV9zZWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuZW5hYmxlZF9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uZW5hYmxlZF9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYWN0dWFsX21pbl9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWN0dWFsX21pbl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hY3RpdmUnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY3RpdmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFjY2VwdF9tc2dzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWNjZXB0X21zZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX3Jvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX3Jvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX2ZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX2ZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYmFzaWMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5iYXNpYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fdmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fdmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fbW9kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fbW9kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX2FkZHJfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fYWRkcl9sZW4nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9hZGRyX2xlbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X2FkZHJfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hZGRyX2xlbl9zdGVwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hZGRyX2xlbl9zdGVwJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5fdHlwZV9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ud29ya2NoYWluX3R5cGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE0Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNC5tYXN0ZXJjaGFpbl9ibG9ja19mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE0LmJhc2VjaGFpbl9ibG9ja19mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTQuYmFzZWNoYWluX2Jsb2NrX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUudmFsaWRhdG9yc19lbGVjdGVkX2ZvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUudmFsaWRhdG9yc19lbGVjdGVkX2ZvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX2VuZF9iZWZvcmUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE1LmVsZWN0aW9uc19lbmRfYmVmb3JlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5zdGFrZV9oZWxkX2ZvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuc3Rha2VfaGVsZF9mb3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE2Lm1heF92YWxpZGF0b3JzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWF4X21haW5fdmFsaWRhdG9ycycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTYubWF4X21haW5fdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWluX3ZhbGlkYXRvcnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE2Lm1pbl92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWluX3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWF4X3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fdG90YWxfc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWluX3RvdGFsX3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2VfZmFjdG9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2VfZmFjdG9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0udXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LmJpdF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0uYml0X3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5jZWxsX3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5jZWxsX3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5tY19iaXRfcHJpY2VfcHMnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE4WypdLm1jX2JpdF9wcmljZV9wcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTgubWNfY2VsbF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0ubWNfY2VsbF9wcmljZV9wcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmdhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5zcGVjaWFsX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuc3BlY2lhbF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmdhc19jcmVkaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmJsb2NrX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuYmxvY2tfZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5mcmVlemVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mcmVlemVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5kZWxldGVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5kZWxldGVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZmxhdF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmdhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5zcGVjaWFsX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuc3BlY2lhbF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmdhc19jcmVkaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmJsb2NrX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuYmxvY2tfZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5mcmVlemVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mcmVlemVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5kZWxldGVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5kZWxldGVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZmxhdF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMudW5kZXJsb2FkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5ieXRlcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnNvZnRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmdhcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmdhcy5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5nYXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmx0X2RlbHRhLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMudW5kZXJsb2FkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5ieXRlcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnNvZnRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmdhcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmdhcy5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5nYXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmx0X2RlbHRhLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQubHVtcF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQubHVtcF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuYml0X3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5iaXRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0LmNlbGxfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmNlbGxfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0Lmlocl9wcmljZV9mYWN0b3InLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0Lmlocl9wcmljZV9mYWN0b3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0LmZpcnN0X2ZyYWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmZpcnN0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0Lm5leHRfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQubmV4dF9mcmFjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5sdW1wX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5sdW1wX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5iaXRfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1LmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuY2VsbF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuaWhyX3ByaWNlX2ZhY3RvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuaWhyX3ByaWNlX2ZhY3RvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuZmlyc3RfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuZmlyc3RfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUubmV4dF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5uZXh0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNodWZmbGVfbWNfdmFsaWRhdG9ycycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNodWZmbGVfbWNfdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjgubWNfY2F0Y2hhaW5fbGlmZXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4Lm1jX2NhdGNoYWluX2xpZmV0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF9jYXRjaGFpbl9saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbnVtJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF92YWxpZGF0b3JzX251bScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubmV3X2NhdGNoYWluX2lkcycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm5ld19jYXRjaGFpbl9pZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LnJvdW5kX2NhbmRpZGF0ZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LnJvdW5kX2NhbmRpZGF0ZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm5leHRfY2FuZGlkYXRlX2RlbGF5X21zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5uZXh0X2NhbmRpZGF0ZV9kZWxheV9tcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkuY29uc2Vuc3VzX3RpbWVvdXRfbXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmNvbnNlbnN1c190aW1lb3V0X21zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5mYXN0X2F0dGVtcHRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5mYXN0X2F0dGVtcHRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5hdHRlbXB0X2R1cmF0aW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5hdHRlbXB0X2R1cmF0aW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5jYXRjaGFpbl9tYXhfZGVwcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkuY2F0Y2hhaW5fbWF4X2RlcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm1heF9ibG9ja19ieXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2Jsb2NrX2J5dGVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5tYXhfY29sbGF0ZWRfYnl0ZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm1heF9jb2xsYXRlZF9ieXRlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMxWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLmFkbmxfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkudGVtcF9wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS50ZW1wX3B1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkudmFsaWRfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnZhbGlkX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS5zaWduYXR1cmVfcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0uc2lnbmF0dXJlX3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNpZ25hdHVyZV9zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zaWduYXR1cmVfcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mua2V5X2Jsb2NrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2Mua2V5X2Jsb2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5ib2MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJsb2NrX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ibG9ja19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWNjb3VudF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByZXZfdHJhbnNfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl90cmFuc19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcmV2X3RyYW5zX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5wcmV2X3RyYW5zX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ub3cnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm5vdycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub3V0bXNnX2NudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mub3V0bXNnX2NudCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaW5fbXNnJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2cnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm91dF9tc2dzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnc1sqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMudG90YWxfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy50b3RhbF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy50b3RhbF9mZWVzX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXNfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm9sZF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMubmV3X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXRfZmlyc3QnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5jcmVkaXRfZmlyc3QnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5zdG9yYWdlLnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY3JlZGl0LmNyZWRpdCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5jcmVkaXQuY3JlZGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0X290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jcmVkaXQuY3JlZGl0X290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0X290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuc3VjY2VzcycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUuc3VjY2VzcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5jb21wdXRlLmFjY291bnRfYWN0aXZhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmdhc19mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX3VzZWQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX3VzZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5jb21wdXRlLmdhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfY3JlZGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUubW9kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5tb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmV4aXRfY29kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5leGl0X2NvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZXhpdF9hcmcnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUuZXhpdF9hcmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUudm1fc3RlcHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1fc3RlcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9maW5hbF9zdGF0ZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi5zdWNjZXNzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLnN1Y2Nlc3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi52YWxpZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFjdGlvbi52YWxpZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLm5vX2Z1bmRzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLm5vX2Z1bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfZndkX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX2FjdGlvbl9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ucmVzdWx0X2NvZGUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi5yZXN1bHRfY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnJlc3VsdF9hcmcnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi5yZXN1bHRfYXJnJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90X2FjdGlvbnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnNwZWNfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnNwZWNfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnNraXBwZWRfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnNraXBwZWRfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLm1zZ3NfY3JlYXRlZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLm1zZ3NfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjdGlvbi5hY3Rpb25fbGlzdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9iaXRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UubXNnX3NpemVfY2VsbHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfc2l6ZV9jZWxscycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLm1zZ19zaXplX2JpdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfc2l6ZV9iaXRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UucmVxX2Z3ZF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5yZXFfZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5tc2dfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5ib3VuY2UubXNnX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5md2RfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5ib3VuY2UuZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFib3J0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hYm9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5kZXN0cm95ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5kZXN0cm95ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnR0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy50dCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLnRoaXNfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby50aGlzX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnNwbGl0X2luZm8uc2libGluZ19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMucHJlcGFyZV90cmFuc2FjdGlvbicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJlcGFyZV90cmFuc2FjdGlvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaW5zdGFsbGVkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuaW5zdGFsbGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5iYWxhbmNlX2RlbHRhJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2VfZGVsdGEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJhbGFuY2VfZGVsdGFfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJhbGFuY2VfZGVsdGFfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJhbGFuY2VfZGVsdGFfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYmFsYW5jZV9kZWx0YV9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ibG9ja19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYmxvY2tfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9keScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9keScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib2R5X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvZHlfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudGljaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRpY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudG9jaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRvY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY29kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jb2RlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kYXRhJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRhdGFfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmxpYnJhcnknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMubGlicmFyeV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3JjJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcmMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZHN0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kc3QnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3JjX3dvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3JjX3dvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kc3Rfd29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5kc3Rfd29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNyZWF0ZWRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNyZWF0ZWRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY3JlYXRlZF9hdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY3JlYXRlZF9hdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5paHJfZGlzYWJsZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5paHJfZGlzYWJsZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5pbXBvcnRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmltcG9ydF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm91bmNlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYm91bmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvdW5jZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5ib3VuY2VkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnZhbHVlX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGFzdF9wYWlkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5sYXN0X3BhaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZHVlX3BheW1lbnQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuZHVlX3BheW1lbnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGFzdF90cmFuc19sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubGFzdF90cmFuc19sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5iYWxhbmNlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYmFsYW5jZV9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5iYWxhbmNlX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2Vfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnRpY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50aWNrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnRvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50b2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmNvZGUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuY29kZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZGF0YScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5kYXRhX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGFfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5saWJyYXJ5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxpYnJhcnlfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5ib2MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvYycgfSk7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzY2FsYXJGaWVsZHMsXG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG4gICAgTWVzc2FnZSxcbiAgICBBY2NvdW50LFxufTtcbiJdfQ==