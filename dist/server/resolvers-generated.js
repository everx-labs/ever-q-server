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
  stringCompanion,
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
  gen_utime_string: stringCompanion('gen_utime'),
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
  utime_since_string: stringCompanion('utime_since'),
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
  utime_since_string: stringCompanion('utime_since'),
  utime_until: scalar,
  utime_until_string: stringCompanion('utime_until'),
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
  min_shard_gen_utime_string: stringCompanion('min_shard_gen_utime'),
  max_shard_gen_utime: scalar,
  max_shard_gen_utime_string: stringCompanion('max_shard_gen_utime'),
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
  gen_utime_string: stringCompanion('gen_utime'),
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
  gen_utime_string: stringCompanion('gen_utime'),
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
  created_by: scalar,
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
  created_at_string: stringCompanion('created_at'),
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
  boc: scalar,
  state_hash: scalar
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
scalarFields.set('blocks.created_by', {
  type: 'string',
  path: 'doc.created_by'
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
scalarFields.set('accounts.state_hash', {
  type: 'string',
  path: 'doc.state_hash'
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwic3RyaW5nQ29tcGFuaW9uIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJyZXF1aXJlIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5IiwidmFsdWUiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnX3R5cGVfbmFtZSIsIkV4dGVybmFsIiwiSWhyIiwiSW1tZWRpYXRlbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJEZXF1ZXVlU2hvcnQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm1zZ19lbnZfaGFzaCIsIm5leHRfd29ya2NoYWluIiwibmV4dF9hZGRyX3BmeCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJnZW5fdXRpbWVfc3RyaW5nIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwidXRpbWVfc2luY2Vfc3RyaW5nIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJnYXNfbGltaXQiLCJzcGVjaWFsX2dhc19saW1pdCIsImdhc19jcmVkaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsIm5ld19jYXRjaGFpbl9pZHMiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsImFkbmxfYWRkciIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidXRpbWVfdW50aWxfc3RyaW5nIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSIsIkZsb2F0QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSIsIlN0cmluZ0FycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwicDciLCJwOCIsInA5IiwicDEwIiwicDExIiwicDEyIiwicDE0IiwicDE1IiwicDE2IiwicDE3IiwicDE4IiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwicDI5IiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwibWluX3NoYXJkX2dlbl91dGltZSIsIm1pbl9zaGFyZF9nZW5fdXRpbWVfc3RyaW5nIiwibWF4X3NoYXJkX2dlbl91dGltZSIsIm1heF9zaGFyZF9nZW5fdXRpbWVfc3RyaW5nIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsInByb29mIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJibG9jayIsIkJsb2NrIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJrZXlfYmxvY2siLCJib2MiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJGcm96ZW4iLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIk1lc3NhZ2UiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlByZWxpbWluYXJ5IiwiYmxvY2tfaWQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYm91bmNlIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJib2R5X2hhc2giLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImNyZWF0ZWRfYXRfc3RyaW5nIiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInN0YXRlX2hhc2giLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJfa2V5IiwiY29udGV4dCIsIndoZW4iLCJ0ZXN0IiwiYmxvY2tzIiwid2FpdEZvckRvYyIsImJsb2Nrc19zaWduYXR1cmVzIiwibWVzc2FnZXMiLCJ3YWl0Rm9yRG9jcyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJzY2FsYXJGaWVsZHMiLCJNYXAiLCJzZXQiLCJ0eXBlIiwicGF0aCIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQSxlQVZFO0FBV0ZDLEVBQUFBLHNCQVhFO0FBWUZDLEVBQUFBLHdCQVpFO0FBYUZDLEVBQUFBO0FBYkUsSUFjRkMsT0FBTyxDQUFDLGVBQUQsQ0FkWDs7QUFlQSxNQUFNQyxhQUFhLEdBQUdWLE1BQU0sQ0FBQztBQUN6QlcsRUFBQUEsUUFBUSxFQUFFZixNQURlO0FBRXpCZ0IsRUFBQUEsS0FBSyxFQUFFZDtBQUZrQixDQUFELENBQTVCO0FBS0EsTUFBTWUsU0FBUyxHQUFHYixNQUFNLENBQUM7QUFDckJjLEVBQUFBLE1BQU0sRUFBRWpCLFFBRGE7QUFFckJrQixFQUFBQSxNQUFNLEVBQUVuQixNQUZhO0FBR3JCb0IsRUFBQUEsU0FBUyxFQUFFcEIsTUFIVTtBQUlyQnFCLEVBQUFBLFNBQVMsRUFBRXJCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLE1BQU1zQixXQUFXLEdBQUdsQixNQUFNLENBQUM7QUFDdkJtQixFQUFBQSxNQUFNLEVBQUV2QixNQURlO0FBRXZCd0IsRUFBQUEsU0FBUyxFQUFFeEIsTUFGWTtBQUd2QnlCLEVBQUFBLFFBQVEsRUFBRXpCLE1B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QUFBQSxvQkFyQmE7QUFzQmJnQixFQUFBQSxvQkF0QmE7QUF1QmJHLEVBQUFBLG9CQXZCYTtBQXdCYkssRUFBQUEsb0JBeEJhO0FBeUJiSSxFQUFBQSxvQkF6QmE7QUEwQmJLLEVBQUFBLG9CQTFCYTtBQTJCYk8sRUFBQUEsZUEzQmE7QUE0QmJVLEVBQUFBLGdCQTVCYTtBQTZCYkksRUFBQUEsY0E3QmE7QUE4QmJDLEVBQUFBLGtCQTlCYTtBQStCYkMsRUFBQUEsV0EvQmE7QUFnQ2JJLEVBQUFBLGdCQWhDYTtBQWlDYkssRUFBQUEsb0JBakNhO0FBa0NiTSxFQUFBQSxvQkFsQ2E7QUFtQ2JVLEVBQUFBLGdCQW5DYTtBQW9DYkssRUFBQUEsWUFwQ2E7QUFxQ2JNLEVBQUFBLG9CQXJDYTtBQXNDYlksRUFBQUEsaUJBdENhO0FBdUNicUMsRUFBQUEsV0F2Q2E7QUF3Q2JXLEVBQUFBLHlCQXhDYTtBQXlDYkUsRUFBQUEsZUF6Q2E7QUEwQ2JRLEVBQUFBLEtBMUNhO0FBMkNia0MsRUFBQUEsa0JBM0NhO0FBNENiUSxFQUFBQSxpQkE1Q2E7QUE2Q2JJLEVBQUFBLGtCQTdDYTtBQThDYnFCLEVBQUFBLGlCQTlDYTtBQStDYmMsRUFBQUEsaUJBL0NhO0FBZ0RiVyxFQUFBQSxvQkFoRGE7QUFpRGJPLEVBQUFBLFdBakRhO0FBa0RiRCxFQUFBQSxPQWxEYTtBQW1EYnVFLEVBQUFBO0FBbkRhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgc3RyaW5nQ29tcGFuaW9uLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nLFxuICAgIHVuaXhTZWNvbmRzVG9TdHJpbmcsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxuICAgIG1zZ19lbnZfaGFzaDogc2NhbGFyLFxuICAgIG5leHRfd29ya2NoYWluOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyX3BmeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lX3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCdnZW5fdXRpbWUnKSxcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwID0gc3RydWN0KHtcbiAgICBtaW5fdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1heF90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWluX3dpbnM6IHNjYWxhcixcbiAgICBtYXhfbG9zc2VzOiBzY2FsYXIsXG4gICAgbWluX3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIG1heF9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTEgPSBzdHJ1Y3Qoe1xuICAgIG5vcm1hbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgY3JpdGljYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogYmlnVUludDIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IGJpZ1VJbnQyLFxuICAgIG1heF9zdGFrZTogYmlnVUludDIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBiaWdVSW50MixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfc2luY2Vfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ3V0aW1lX3NpbmNlJyksXG4gICAgYml0X3ByaWNlX3BzOiBiaWdVSW50MSxcbiAgICBjZWxsX3ByaWNlX3BzOiBiaWdVSW50MSxcbiAgICBtY19iaXRfcHJpY2VfcHM6IGJpZ1VJbnQxLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBiaWdVSW50MSxcbiAgICBibG9ja19nYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBmbGF0X2dhc19wcmljZTogYmlnVUludDEsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBiaWdVSW50MSxcbiAgICBiaXRfcHJpY2U6IGJpZ1VJbnQxLFxuICAgIGNlbGxfcHJpY2U6IGJpZ1VJbnQxLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgbmV3X2NhdGNoYWluX2lkczogc2NhbGFyLFxuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3QgPSBzdHJ1Y3Qoe1xuICAgIHB1YmxpY19rZXk6IHNjYWxhcixcbiAgICB3ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KCgpID0+IFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3NpbmNlX3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCd1dGltZV9zaW5jZScpLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWxfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ3V0aW1lX3VudGlsJyksXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOSA9IHN0cnVjdCh7XG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG4gICAgdGVtcF9wdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgc2Vxbm86IHNjYWxhcixcbiAgICB2YWxpZF91bnRpbDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9yOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMDogRmxvYXRBcnJheSxcbiAgICBwMTE6IEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWVfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ21pbl9zaGFyZF9nZW5fdXRpbWUnKSxcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignbWF4X3NoYXJkX2dlbl91dGltZScpLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl91dGltZV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignZ2VuX3V0aW1lJyksXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBjYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIHNpZ193ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbiAgICBibG9jazogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheSgoKSA9PiBJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KCgpID0+IE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fdXRpbWVfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ2dlbl91dGltZScpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2J5OiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAga2V5X2Jsb2NrOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCAoKSA9PiBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KCgpID0+IE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYmxvY2s6IGpvaW4oJ2Jsb2NrX2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBiYWxhbmNlX2RlbHRhOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX2RlbHRhX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBib2R5X2hhc2g6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdF9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignY3JlYXRlZF9hdCcpLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignaWQnLCAnb3V0X21zZ3NbKl0nLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignaWQnLCAnaW5fbXNnJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBjb2RlX2hhc2g6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgZGF0YV9oYXNoOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIGxpYnJhcnlfaGFzaDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3RhdGVfaGFzaDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0X2FkZHJfcGZ4KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubmV4dF9hZGRyX3BmeCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgRGVxdWV1ZVNob3J0OiA3LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuX3V0aW1lX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQuZ2VuX3V0aW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJDb25maWdQMTQ6IHtcbiAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhc2VjaGFpbl9ibG9ja19mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJDb25maWdQMTc6IHtcbiAgICAgICAgICAgIG1pbl9zdGFrZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbl9zdGFrZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWF4X3N0YWtlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWF4X3N0YWtlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW5fdG90YWxfc3Rha2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW5fdG90YWxfc3Rha2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJDb25maWdQMTg6IHtcbiAgICAgICAgICAgIGJpdF9wcmljZV9wcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmJpdF9wcmljZV9wcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2VsbF9wcmljZV9wcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNlbGxfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm1jX2JpdF9wcmljZV9wcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm1jX2NlbGxfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3NpbmNlX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQudXRpbWVfc2luY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgR2FzTGltaXRzUHJpY2VzOiB7XG4gICAgICAgICAgICBnYXNfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfcHJpY2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BlY2lhbF9nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zcGVjaWFsX2dhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2NyZWRpdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19jcmVkaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrX2dhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmJsb2NrX2dhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJlZXplX2R1ZV9saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmZyZWV6ZV9kdWVfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlbGV0ZV9kdWVfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5kZWxldGVfZHVlX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmbGF0X2dhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmZsYXRfZ2FzX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmbGF0X2dhc19wcmljZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmZsYXRfZ2FzX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0ZvcndhcmRQcmljZXM6IHtcbiAgICAgICAgICAgIGx1bXBfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdW1wX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiaXRfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5iaXRfcHJpY2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNlbGxfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jZWxsX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFZhbGlkYXRvclNldExpc3Q6IHtcbiAgICAgICAgICAgIHdlaWdodChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LndlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXQ6IHtcbiAgICAgICAgICAgIHRvdGFsX3dlaWdodChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRvdGFsX3dlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXRpbWVfc2luY2Vfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC51dGltZV9zaW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXRpbWVfdW50aWxfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC51dGltZV91bnRpbCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFCbG9ja1NpZ25hdHVyZXMudGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ193ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zaWdfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5fdXRpbWVfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC5nZW5fdXRpbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIUJsb2NrLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuX3V0aW1lX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQuZ2VuX3V0aW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIVRyYW5zYWN0aW9uLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuYmxvY2tfaWQsICdfa2V5JywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFUcmFuc2FjdGlvbi50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvYyhwYXJlbnQuaW5fbXNnLCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFUcmFuc2FjdGlvbi50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvY3MocGFyZW50Lm91dF9tc2dzLCAnX2tleScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZV9kZWx0YShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2VfZGVsdGEsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIU1lc3NhZ2UudGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5ibG9ja19pZCwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb24ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCEocGFyZW50LmNyZWF0ZWRfbHQgIT09ICcwMCcgJiYgcGFyZW50Lm1zZ190eXBlICE9PSAxKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhTWVzc2FnZS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShwYXJlbnQubXNnX3R5cGUgIT09IDIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFNZXNzYWdlLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ2luX21zZycsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2F0X3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQuY3JlYXRlZF9hdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXAoKTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5jYXRjaGFpbl9zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2Muc2lnX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLm5vZGVfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ubm9kZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLnInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ucicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaWduYXR1cmVzLnMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNpZ25hdHVyZXNbKl0ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdsb2JhbF9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2xvYmFsX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy53YW50X3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2Mud2FudF9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFmdGVyX21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWZ0ZXJfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fY2F0Y2hhaW5fc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl9jYXRjaGFpbl9zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmZsYWdzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlcl9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXJfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3JlZi5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X2FsdF9yZWYuZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X2FsdF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X2FsdF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfYWx0X3JlZi5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmJlZm9yZV9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmJlZm9yZV9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWZ0ZXJfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hZnRlcl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud2FudF9tZXJnZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLndhbnRfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZlcnRfc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52ZXJ0X3NlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhcnRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnN0YXJ0X2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWluX3JlZl9tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWluX3JlZl9tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9rZXlfYmxvY2tfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnByZXZfa2V5X2Jsb2NrX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fc29mdHdhcmVfdmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZ2VuX3NvZnR3YXJlX3ZlcnNpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGsnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2JsaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuY3JlYXRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmNyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cubWludGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5taW50ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cubWludGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0udHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnJhbmRfc2VlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucmFuZF9zZWVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5jcmVhdGVkX2J5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jcmVhdGVkX2J5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0udHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3Iub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5wcm9vZl9jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQuaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQudHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQudHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnByb29mX2RlbGl2ZXJlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnByb29mX2NyZWF0ZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLmluX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnRyYW5zaXRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLnByb29mX2RlbGl2ZXJlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0X2Jsb2NrX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydF9ibG9ja19sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5tc2dfZW52X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubXNnX2Vudl9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm5leHRfd29ya2NoYWluJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm5leHRfd29ya2NoYWluJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm5leHRfYWRkcl9wZngnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubmV4dF9hZGRyX3BmeCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5hY2NvdW50X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy5sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS5sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMudG90YWxfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRvdGFsX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS50cmFuc2FjdGlvbnNbKipdLnRvdGFsX2ZlZXNfb3RoZXJbKioqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzX290aGVyWyoqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLm9sZF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MubmV3X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJfY291bnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnRyX2NvdW50JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy50cl9jb3VudCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm5ldycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm5ldycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUubmV3X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5vbGQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUub2xkX2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLnNoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IucmVnX21jX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLnJlZ19tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5zdGFydF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5zdGFydF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5yb290X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5iZWZvcmVfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmJlZm9yZV9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5iZWZvcmVfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmJlZm9yZV9tZXJnZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci53YW50X3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci53YW50X3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLndhbnRfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLndhbnRfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubnhfY2NfdXBkYXRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubnhfY2NfdXBkYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mbGFncycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubWluX3JlZl9tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5taW5fcmVmX21jX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmdlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iuc3BsaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZ1bmRzX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mdW5kc19jcmVhdGVkX290aGVyWyoqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5mdW5kc19jcmVhdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlc19vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uZmVlc19vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfZmVlc1sqXS5jcmVhdGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uY3JlYXRlX290aGVyWyoqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmNyZWF0ZV9vdGhlclsqKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNpdF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5ub2RlX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlc1sqXS5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWdfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNi5taW50X25ld19wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNi5taW50X25ld19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNi5taW50X2FkZF9wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wNi5taW50X2FkZF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNy5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wN1sqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wNy52YWx1ZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wN1sqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wOC52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnA4LnZlcnNpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDguY2FwYWJpbGl0aWVzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnA4LmNhcGFiaWxpdGllcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wOScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOVsqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTAnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEwWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl93aW5zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl93aW5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9sb3NzZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X2xvc3NlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1pbl9zdG9yZV9zZWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLmJpdF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5iaXRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuY2VsbF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3RvdF9yb3VuZHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X3RvdF9yb3VuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fd2lucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl93aW5zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X2xvc3NlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9sb3NzZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9zdG9yZV9zZWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuYml0X3ByaWNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMuY2VsbF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmNlbGxfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5lbmFibGVkX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5lbmFibGVkX3NpbmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hY3R1YWxfbWluX3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY3R1YWxfbWluX3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5taW5fc3BsaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLm1pbl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWF4X3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5tYXhfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFjdGl2ZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmFjdGl2ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYWNjZXB0X21zZ3MnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY2NlcHRfbXNncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmZsYWdzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi56ZXJvc3RhdGVfcm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS56ZXJvc3RhdGVfcm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi56ZXJvc3RhdGVfZmlsZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS56ZXJvc3RhdGVfZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5iYXNpYycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmJhc2ljJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52bV92ZXJzaW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52bV92ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi52bV9tb2RlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS52bV9tb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5taW5fYWRkcl9sZW4nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLm1pbl9hZGRyX2xlbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWF4X2FkZHJfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5tYXhfYWRkcl9sZW4nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFkZHJfbGVuX3N0ZXAnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLmFkZHJfbGVuX3N0ZXAnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLndvcmtjaGFpbl90eXBlX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS53b3JrY2hhaW5fdHlwZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTQubWFzdGVyY2hhaW5fYmxvY2tfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE0Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTQuYmFzZWNoYWluX2Jsb2NrX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNC5iYXNlY2hhaW5fYmxvY2tfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfZW5kX2JlZm9yZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX2VuZF9iZWZvcmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE1LnN0YWtlX2hlbGRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5zdGFrZV9oZWxkX2ZvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWF4X3ZhbGlkYXRvcnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE2Lm1heF92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5taW5fdmFsaWRhdG9ycycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTYubWluX3ZhbGlkYXRvcnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1pbl9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1pbl90b3RhbF9zdGFrZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fdG90YWxfc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTguYml0X3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5iaXRfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LmNlbGxfcHJpY2VfcHMnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE4WypdLmNlbGxfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4Lm1jX2JpdF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0ubWNfYml0X3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5tY19jZWxsX3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5tY19jZWxsX3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5iaXRfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQubmV4dF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5uZXh0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1LmJpdF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5uZXh0X2ZyYWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lm5leHRfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOC5tY19jYXRjaGFpbl9saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjgubWNfY2F0Y2hhaW5fbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX2NhdGNoYWluX2xpZmV0aW1lJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF9jYXRjaGFpbl9saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19udW0nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbnVtJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5uZXdfY2F0Y2hhaW5faWRzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubmV3X2NhdGNoYWluX2lkcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm5leHRfY2FuZGlkYXRlX2RlbGF5X21zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5jb25zZW5zdXNfdGltZW91dF9tcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkuY29uc2Vuc3VzX3RpbWVvdXRfbXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmNhdGNoYWluX21heF9kZXBzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5jYXRjaGFpbl9tYXhfZGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2Jsb2NrX2J5dGVzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5tYXhfYmxvY2tfYnl0ZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm1heF9jb2xsYXRlZF9ieXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2NvbGxhdGVkX2J5dGVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzFbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS50ZW1wX3B1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnRlbXBfcHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS52YWxpZF91bnRpbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0udmFsaWRfdW50aWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNpZ25hdHVyZV9yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zaWduYXR1cmVfcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2lnbmF0dXJlX3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNpZ25hdHVyZV9zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5rZXlfYmxvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5rZXlfYmxvY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYmxvY2tfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJsb2NrX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY2NvdW50X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjY291bnRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmx0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMucHJldl90cmFuc19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3RyYW5zX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByZXZfdHJhbnNfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdHJhbnNfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm5vdycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mubm93JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5vdXRtc2dfY250JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5vdXRtc2dfY250JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbl9tc2cnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub3V0X21zZ3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dzWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXNfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudG90YWxfZmVlc19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm9sZF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubmV3X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdF9maXJzdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNyZWRpdF9maXJzdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0JywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY3JlZGl0LmNyZWRpdF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5zdWNjZXNzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5zdWNjZXNzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLm1zZ19zdGF0ZV91c2VkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfdXNlZCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmdhc19jcmVkaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5tb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLm1vZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZXhpdF9jb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLmV4aXRfY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5leGl0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5leGl0X2FyZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9zdGVwcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS52bV9zdGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnN1Y2Nlc3MnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24uc3VjY2VzcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnZhbGlkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLnZhbGlkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubm9fZnVuZHMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24ubm9fZnVuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9md2RfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi5yZXN1bHRfY29kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ucmVzdWx0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9hcmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc3BlY19hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc3BlY19hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubXNnc19jcmVhdGVkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24ubXNnc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UubXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5yZXFfZndkX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYm91bmNlLnJlcV9md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLm1zZ19mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLmZ3ZF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWJvcnRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFib3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmRlc3Ryb3llZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmRlc3Ryb3llZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMudHQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnR0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnNwbGl0X2luZm8udGhpc19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLnRoaXNfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5zaWJsaW5nX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNwbGl0X2luZm8uc2libGluZ19hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcmVwYXJlX3RyYW5zYWN0aW9uJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmVwYXJlX3RyYW5zYWN0aW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbnN0YWxsZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5pbnN0YWxsZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJhbGFuY2VfZGVsdGEnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYmFsYW5jZV9kZWx0YScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYmFsYW5jZV9kZWx0YV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYmFsYW5jZV9kZWx0YV9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYmFsYW5jZV9kZWx0YV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5iYWxhbmNlX2RlbHRhX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJsb2NrX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ibG9ja19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib2R5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2R5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvZHlfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9keV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnNwbGl0X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy50aWNrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudGljaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy50b2NrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudG9jaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jb2RlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNvZGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRhdGEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZGF0YV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMubGlicmFyeScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5saWJyYXJ5X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnlfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5zcmMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNyYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kc3QnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRzdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5zcmNfd29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcmNfd29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRzdF93b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmRzdF93b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY3JlYXRlZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuY3JlYXRlZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jcmVhdGVkX2F0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jcmVhdGVkX2F0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmlocl9kaXNhYmxlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmlocl9kaXNhYmxlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmltcG9ydF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW1wb3J0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib3VuY2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5ib3VuY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm91bmNlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmJvdW5jZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudmFsdWVfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnZhbHVlX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib2MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5sYXN0X3BhaWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmxhc3RfcGFpZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5kdWVfcGF5bWVudCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5kdWVfcGF5bWVudCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5sYXN0X3RyYW5zX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5sYXN0X3RyYW5zX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmJhbGFuY2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYmFsYW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5iYWxhbmNlX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5iYWxhbmNlX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmJhbGFuY2Vfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYmFsYW5jZV9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMudGljaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRpY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMudG9jaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRvY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuY29kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5jb2RlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5kYXRhJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmRhdGFfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxpYnJhcnknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGlicmFyeV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnN0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX2hhc2gnIH0pO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2NhbGFyRmllbGRzLFxuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxuICAgIE1lc3NhZ2UsXG4gICAgQWNjb3VudCxcbn07XG4iXX0=