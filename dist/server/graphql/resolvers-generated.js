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

function createResolvers(data) {
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

        return context.data.blocks.waitForDoc(parent._key, '_key', args, context);
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

        return context.data.blocks_signatures.waitForDoc(parent._key, '_key', args, context);
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

        return context.data.blocks.waitForDoc(parent.block_id, '_key', args, context);
      },

      in_message(parent, args, context) {
        if (args.when && !Transaction.test(null, parent, args.when)) {
          return null;
        }

        return context.data.messages.waitForDoc(parent.in_msg, '_key', args, context);
      },

      out_messages(parent, args, context) {
        if (args.when && !Transaction.test(null, parent, args.when)) {
          return null;
        }

        return context.data.messages.waitForDocs(parent.out_msgs, '_key', args, context);
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

        return context.data.blocks.waitForDoc(parent.block_id, '_key', args, context);
      },

      src_transaction(parent, args, context) {
        if (!(parent.created_lt !== '00' && parent.msg_type !== 1)) {
          return null;
        }

        if (args.when && !Message.test(null, parent, args.when)) {
          return null;
        }

        return context.data.transactions.waitForDoc(parent._key, 'out_msgs[*]', args, context);
      },

      dst_transaction(parent, args, context) {
        if (!(parent.msg_type !== 2)) {
          return null;
        }

        if (args.when && !Message.test(null, parent, args.when)) {
          return null;
        }

        return context.data.transactions.waitForDoc(parent._key, 'in_msg', args, context);
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
      blocks_signatures: data.blocks_signatures.queryResolver(),
      blocks: data.blocks.queryResolver(),
      transactions: data.transactions.queryResolver(),
      messages: data.messages.queryResolver(),
      accounts: data.accounts.queryResolver()
    },
    Subscription: {
      blocks_signatures: data.blocks_signatures.subscriptionResolver(),
      blocks: data.blocks.subscriptionResolver(),
      transactions: data.transactions.subscriptionResolver(),
      messages: data.messages.subscriptionResolver(),
      accounts: data.accounts.subscriptionResolver()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZ3JhcGhxbC9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwic3RyaW5nQ29tcGFuaW9uIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJyZXF1aXJlIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5IiwidmFsdWUiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnX3R5cGVfbmFtZSIsIkV4dGVybmFsIiwiSWhyIiwiSW1tZWRpYXRlbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsIk91dE1zZ05ldyIsIkRlcXVldWVJbW1lZGlhdGVseSIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJEZXF1ZXVlU2hvcnQiLCJOb25lIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm1zZ19lbnZfaGFzaCIsIm5leHRfd29ya2NoYWluIiwibmV4dF9hZGRyX3BmeCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJnZW5fdXRpbWVfc3RyaW5nIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwidXRpbWVfc2luY2Vfc3RyaW5nIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJnYXNfbGltaXQiLCJzcGVjaWFsX2dhc19saW1pdCIsImdhc19jcmVkaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsIm5ld19jYXRjaGFpbl9pZHMiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsImFkbmxfYWRkciIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidXRpbWVfdW50aWxfc3RyaW5nIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSIsIkZsb2F0QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSIsIlN0cmluZ0FycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwicDciLCJwOCIsInA5IiwicDEwIiwicDExIiwicDEyIiwicDE0IiwicDE1IiwicDE2IiwicDE3IiwicDE4IiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwicDI5IiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwibWluX3NoYXJkX2dlbl91dGltZSIsIm1pbl9zaGFyZF9nZW5fdXRpbWVfc3RyaW5nIiwibWF4X3NoYXJkX2dlbl91dGltZSIsIm1heF9zaGFyZF9nZW5fdXRpbWVfc3RyaW5nIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsInByb29mIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJibG9jayIsIkJsb2NrIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJrZXlfYmxvY2siLCJib2MiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJGcm96ZW4iLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIk1lc3NhZ2UiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlByZWxpbWluYXJ5IiwiYmxvY2tfaWQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYm91bmNlIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJib2R5X2hhc2giLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImNyZWF0ZWRfYXRfc3RyaW5nIiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInN0YXRlX2hhc2giLCJjcmVhdGVSZXNvbHZlcnMiLCJwYXJlbnQiLCJhcmdzIiwiX2tleSIsImNvbnRleHQiLCJ3aGVuIiwidGVzdCIsImJsb2NrcyIsIndhaXRGb3JEb2MiLCJibG9ja3Nfc2lnbmF0dXJlcyIsIm1lc3NhZ2VzIiwid2FpdEZvckRvY3MiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwic2NhbGFyRmllbGRzIiwiTWFwIiwic2V0IiwidHlwZSIsInBhdGgiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU07QUFDRkEsRUFBQUEsTUFERTtBQUVGQyxFQUFBQSxRQUZFO0FBR0ZDLEVBQUFBLFFBSEU7QUFJRkMsRUFBQUEsY0FKRTtBQUtGQyxFQUFBQSxNQUxFO0FBTUZDLEVBQUFBLEtBTkU7QUFPRkMsRUFBQUEsSUFQRTtBQVFGQyxFQUFBQSxTQVJFO0FBU0ZDLEVBQUFBLFFBVEU7QUFVRkMsRUFBQUEsZUFWRTtBQVdGQyxFQUFBQSxzQkFYRTtBQVlGQyxFQUFBQSx3QkFaRTtBQWFGQyxFQUFBQTtBQWJFLElBY0ZDLE9BQU8sQ0FBQyxlQUFELENBZFg7O0FBZUEsTUFBTUMsYUFBYSxHQUFHVixNQUFNLENBQUM7QUFDekJXLEVBQUFBLFFBQVEsRUFBRWYsTUFEZTtBQUV6QmdCLEVBQUFBLEtBQUssRUFBRWQ7QUFGa0IsQ0FBRCxDQUE1QjtBQUtBLE1BQU1lLFNBQVMsR0FBR2IsTUFBTSxDQUFDO0FBQ3JCYyxFQUFBQSxNQUFNLEVBQUVqQixRQURhO0FBRXJCa0IsRUFBQUEsTUFBTSxFQUFFbkIsTUFGYTtBQUdyQm9CLEVBQUFBLFNBQVMsRUFBRXBCLE1BSFU7QUFJckJxQixFQUFBQSxTQUFTLEVBQUVyQjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxNQUFNc0IsV0FBVyxHQUFHbEIsTUFBTSxDQUFDO0FBQ3ZCbUIsRUFBQUEsTUFBTSxFQUFFdkIsTUFEZTtBQUV2QndCLEVBQUFBLFNBQVMsRUFBRXhCLE1BRlk7QUFHdkJ5QixFQUFBQSxRQUFRLEVBQUV6QixNQUhhO0FBSXZCMEIsRUFBQUEsaUJBQWlCLEVBQUV4QjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxNQUFNeUIsS0FBSyxHQUFHdkIsTUFBTSxDQUFDO0FBQ2pCd0IsRUFBQUEsUUFBUSxFQUFFNUIsTUFETztBQUVqQjZCLEVBQUFBLGFBQWEsRUFBRXJCLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRXNCLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEdBQUcsRUFBRSxDQUFwQjtBQUF1QkMsSUFBQUEsV0FBVyxFQUFFLENBQXBDO0FBQXVDQyxJQUFBQSxLQUFLLEVBQUUsQ0FBOUM7QUFBaURDLElBQUFBLE9BQU8sRUFBRSxDQUExRDtBQUE2REMsSUFBQUEsY0FBYyxFQUFFLENBQTdFO0FBQWdGQyxJQUFBQSxnQkFBZ0IsRUFBRTtBQUFsRyxHQUFiLENBRk47QUFHakJiLEVBQUFBLE1BQU0sRUFBRXZCLE1BSFM7QUFJakJxQyxFQUFBQSxPQUFPLEVBQUVuQyxRQUpRO0FBS2pCb0MsRUFBQUEsYUFBYSxFQUFFdEMsTUFMRTtBQU1qQnVDLEVBQUFBLE1BQU0sRUFBRWpCLFdBTlM7QUFPakJrQixFQUFBQSxPQUFPLEVBQUV0QyxRQVBRO0FBUWpCdUMsRUFBQUEsT0FBTyxFQUFFbkIsV0FSUTtBQVNqQm9CLEVBQUFBLFdBQVcsRUFBRXhDLFFBVEk7QUFVakJ5QyxFQUFBQSxjQUFjLEVBQUUzQyxNQVZDO0FBV2pCNEMsRUFBQUEsZUFBZSxFQUFFNUM7QUFYQSxDQUFELENBQXBCO0FBY0EsTUFBTTZDLE1BQU0sR0FBR3pDLE1BQU0sQ0FBQztBQUNsQndCLEVBQUFBLFFBQVEsRUFBRTVCLE1BRFE7QUFFbEI2QixFQUFBQSxhQUFhLEVBQUVyQixRQUFRLENBQUMsVUFBRCxFQUFhO0FBQUVzQixJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlRSxJQUFBQSxXQUFXLEVBQUUsQ0FBNUI7QUFBK0JjLElBQUFBLFNBQVMsRUFBRSxDQUExQztBQUE2Q1osSUFBQUEsT0FBTyxFQUFFLENBQXREO0FBQXlEYSxJQUFBQSxrQkFBa0IsRUFBRSxDQUE3RTtBQUFnRkMsSUFBQUEsT0FBTyxFQUFFLENBQXpGO0FBQTRGQyxJQUFBQSxlQUFlLEVBQUUsQ0FBN0c7QUFBZ0hDLElBQUFBLFlBQVksRUFBRSxDQUE5SDtBQUFpSUMsSUFBQUEsSUFBSSxFQUFFLENBQUM7QUFBeEksR0FBYixDQUZMO0FBR2xCNUIsRUFBQUEsTUFBTSxFQUFFdkIsTUFIVTtBQUlsQjJDLEVBQUFBLGNBQWMsRUFBRTNDLE1BSkU7QUFLbEJ5QyxFQUFBQSxPQUFPLEVBQUVuQixXQUxTO0FBTWxCOEIsRUFBQUEsUUFBUSxFQUFFekIsS0FOUTtBQU9sQjBCLEVBQUFBLFFBQVEsRUFBRTFCLEtBUFE7QUFRbEIyQixFQUFBQSxlQUFlLEVBQUVyRCxRQVJDO0FBU2xCc0QsRUFBQUEsWUFBWSxFQUFFdkQsTUFUSTtBQVVsQndELEVBQUFBLGNBQWMsRUFBRXhELE1BVkU7QUFXbEJ5RCxFQUFBQSxhQUFhLEVBQUV4RDtBQVhHLENBQUQsQ0FBckI7QUFjQSxNQUFNeUQsa0JBQWtCLEdBQUdyRCxLQUFLLENBQUMsTUFBTVMsYUFBUCxDQUFoQztBQUNBLE1BQU02QyxjQUFjLEdBQUd2RCxNQUFNLENBQUM7QUFDMUJ3RCxFQUFBQSxXQUFXLEVBQUUxRCxRQURhO0FBRTFCMkQsRUFBQUEsaUJBQWlCLEVBQUVILGtCQUZPO0FBRzFCSSxFQUFBQSxRQUFRLEVBQUU1RCxRQUhnQjtBQUkxQjZELEVBQUFBLGNBQWMsRUFBRUwsa0JBSlU7QUFLMUJNLEVBQUFBLGNBQWMsRUFBRTlELFFBTFU7QUFNMUIrRCxFQUFBQSxvQkFBb0IsRUFBRVAsa0JBTkk7QUFPMUJRLEVBQUFBLE9BQU8sRUFBRWhFLFFBUGlCO0FBUTFCaUUsRUFBQUEsYUFBYSxFQUFFVCxrQkFSVztBQVMxQkwsRUFBQUEsUUFBUSxFQUFFbkQsUUFUZ0I7QUFVMUJrRSxFQUFBQSxjQUFjLEVBQUVWLGtCQVZVO0FBVzFCVyxFQUFBQSxhQUFhLEVBQUVuRSxRQVhXO0FBWTFCb0UsRUFBQUEsbUJBQW1CLEVBQUVaLGtCQVpLO0FBYTFCYSxFQUFBQSxNQUFNLEVBQUVyRSxRQWJrQjtBQWMxQnNFLEVBQUFBLFlBQVksRUFBRWQsa0JBZFk7QUFlMUJlLEVBQUFBLGFBQWEsRUFBRXZFLFFBZlc7QUFnQjFCd0UsRUFBQUEsbUJBQW1CLEVBQUVoQjtBQWhCSyxDQUFELENBQTdCO0FBbUJBLE1BQU1pQiw4QkFBOEIsR0FBR3ZFLE1BQU0sQ0FBQztBQUMxQ3dFLEVBQUFBLEVBQUUsRUFBRTNFLFFBRHNDO0FBRTFDMEMsRUFBQUEsY0FBYyxFQUFFM0MsTUFGMEI7QUFHMUM2RSxFQUFBQSxVQUFVLEVBQUUzRSxRQUg4QjtBQUkxQzRFLEVBQUFBLGdCQUFnQixFQUFFcEI7QUFKd0IsQ0FBRCxDQUE3QztBQU9BLE1BQU1xQixtQ0FBbUMsR0FBRzFFLEtBQUssQ0FBQyxNQUFNc0UsOEJBQVAsQ0FBakQ7QUFDQSxNQUFNSyxrQkFBa0IsR0FBRzVFLE1BQU0sQ0FBQztBQUM5QjZFLEVBQUFBLFlBQVksRUFBRWpGLE1BRGdCO0FBRTlCa0YsRUFBQUEsWUFBWSxFQUFFSCxtQ0FGZ0I7QUFHOUJJLEVBQUFBLFFBQVEsRUFBRW5GLE1BSG9CO0FBSTlCb0YsRUFBQUEsUUFBUSxFQUFFcEYsTUFKb0I7QUFLOUJxRixFQUFBQSxRQUFRLEVBQUVyRjtBQUxvQixDQUFELENBQWpDO0FBUUEsTUFBTXNGLGdCQUFnQixHQUFHbEYsTUFBTSxDQUFDO0FBQzVCbUYsRUFBQUEsR0FBRyxFQUFFdkYsTUFEdUI7QUFFNUJvRixFQUFBQSxRQUFRLEVBQUVwRixNQUZrQjtBQUc1QndGLEVBQUFBLFNBQVMsRUFBRXhGLE1BSGlCO0FBSTVCeUYsRUFBQUEsR0FBRyxFQUFFekYsTUFKdUI7QUFLNUJtRixFQUFBQSxRQUFRLEVBQUVuRixNQUxrQjtBQU01QjBGLEVBQUFBLFNBQVMsRUFBRTFGO0FBTmlCLENBQUQsQ0FBL0I7QUFTQSxNQUFNMkYsMkJBQTJCLEdBQUd2RixNQUFNLENBQUM7QUFDdkNlLEVBQUFBLE1BQU0sRUFBRW5CLE1BRCtCO0FBRXZDNEYsRUFBQUEsWUFBWSxFQUFFNUYsTUFGeUI7QUFHdkM2RixFQUFBQSxRQUFRLEVBQUU1RixRQUg2QjtBQUl2Q2lCLEVBQUFBLE1BQU0sRUFBRWpCLFFBSitCO0FBS3ZDbUIsRUFBQUEsU0FBUyxFQUFFcEIsTUFMNEI7QUFNdkNxQixFQUFBQSxTQUFTLEVBQUVyQixNQU40QjtBQU92QzhGLEVBQUFBLFlBQVksRUFBRTlGLE1BUHlCO0FBUXZDK0YsRUFBQUEsWUFBWSxFQUFFL0YsTUFSeUI7QUFTdkNnRyxFQUFBQSxVQUFVLEVBQUVoRyxNQVQyQjtBQVV2Q2lHLEVBQUFBLFVBQVUsRUFBRWpHLE1BVjJCO0FBV3ZDa0csRUFBQUEsYUFBYSxFQUFFbEcsTUFYd0I7QUFZdkNtRyxFQUFBQSxLQUFLLEVBQUVuRyxNQVpnQztBQWF2Q29HLEVBQUFBLG1CQUFtQixFQUFFcEcsTUFia0I7QUFjdkNxRyxFQUFBQSxvQkFBb0IsRUFBRXJHLE1BZGlCO0FBZXZDc0csRUFBQUEsZ0JBQWdCLEVBQUV0RyxNQWZxQjtBQWdCdkN1RyxFQUFBQSxTQUFTLEVBQUV2RyxNQWhCNEI7QUFpQnZDd0csRUFBQUEsZ0JBQWdCLEVBQUUvRixlQUFlLENBQUMsV0FBRCxDQWpCTTtBQWtCdkNnRyxFQUFBQSxVQUFVLEVBQUV6RyxNQWxCMkI7QUFtQnZDMEcsRUFBQUEsZUFBZSxFQUFFbEcsUUFBUSxDQUFDLFlBQUQsRUFBZTtBQUFFMkMsSUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBV3dELElBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsSUFBQUEsS0FBSyxFQUFFO0FBQTVCLEdBQWYsQ0FuQmM7QUFvQnZDQyxFQUFBQSxLQUFLLEVBQUU3RyxNQXBCZ0M7QUFxQnZDZ0UsRUFBQUEsY0FBYyxFQUFFOUQsUUFyQnVCO0FBc0J2QytELEVBQUFBLG9CQUFvQixFQUFFUCxrQkF0QmlCO0FBdUJ2Q29ELEVBQUFBLGFBQWEsRUFBRTVHLFFBdkJ3QjtBQXdCdkM2RyxFQUFBQSxtQkFBbUIsRUFBRXJEO0FBeEJrQixDQUFELENBQTFDO0FBMkJBLE1BQU1zRCxzQkFBc0IsR0FBRzVHLE1BQU0sQ0FBQztBQUNsQzZHLEVBQUFBLFlBQVksRUFBRWpILE1BRG9CO0FBRWxDa0gsRUFBQUEsS0FBSyxFQUFFbEgsTUFGMkI7QUFHbENtSCxFQUFBQSxLQUFLLEVBQUV4QjtBQUgyQixDQUFELENBQXJDO0FBTUEsTUFBTXlCLG9CQUFvQixHQUFHaEgsTUFBTSxDQUFDO0FBQ2hDNkcsRUFBQUEsWUFBWSxFQUFFakgsTUFEa0I7QUFFaENrSCxFQUFBQSxLQUFLLEVBQUVsSCxNQUZ5QjtBQUdoQ3FILEVBQUFBLElBQUksRUFBRW5ILFFBSDBCO0FBSWhDb0gsRUFBQUEsVUFBVSxFQUFFNUQsa0JBSm9CO0FBS2hDNkQsRUFBQUEsTUFBTSxFQUFFckgsUUFMd0I7QUFNaENzSCxFQUFBQSxZQUFZLEVBQUU5RDtBQU5rQixDQUFELENBQW5DO0FBU0EsTUFBTStELDRCQUE0QixHQUFHckgsTUFBTSxDQUFDO0FBQ3hDc0gsRUFBQUEsT0FBTyxFQUFFMUgsTUFEK0I7QUFFeEMySCxFQUFBQSxDQUFDLEVBQUUzSCxNQUZxQztBQUd4QzRILEVBQUFBLENBQUMsRUFBRTVIO0FBSHFDLENBQUQsQ0FBM0M7QUFNQSxNQUFNNkgsbUJBQW1CLEdBQUd6SCxNQUFNLENBQUM7QUFDL0IwSCxFQUFBQSxjQUFjLEVBQUU5SCxNQURlO0FBRS9CK0gsRUFBQUEsY0FBYyxFQUFFL0g7QUFGZSxDQUFELENBQWxDO0FBS0EsTUFBTWdJLG1CQUFtQixHQUFHNUgsTUFBTSxDQUFDO0FBQy9CVyxFQUFBQSxRQUFRLEVBQUVmLE1BRHFCO0FBRS9CZ0IsRUFBQUEsS0FBSyxFQUFFaEI7QUFGd0IsQ0FBRCxDQUFsQztBQUtBLE1BQU1pSSxtQkFBbUIsR0FBRzdILE1BQU0sQ0FBQztBQUMvQjhILEVBQUFBLE9BQU8sRUFBRWxJLE1BRHNCO0FBRS9CbUksRUFBQUEsWUFBWSxFQUFFbkk7QUFGaUIsQ0FBRCxDQUFsQztBQUtBLE1BQU1vSSxtQkFBbUIsR0FBR2hJLE1BQU0sQ0FBQztBQUMvQmlJLEVBQUFBLGNBQWMsRUFBRXJJLE1BRGU7QUFFL0JzSSxFQUFBQSxjQUFjLEVBQUV0SSxNQUZlO0FBRy9CdUksRUFBQUEsUUFBUSxFQUFFdkksTUFIcUI7QUFJL0J3SSxFQUFBQSxVQUFVLEVBQUV4SSxNQUptQjtBQUsvQnlJLEVBQUFBLGFBQWEsRUFBRXpJLE1BTGdCO0FBTS9CMEksRUFBQUEsYUFBYSxFQUFFMUksTUFOZ0I7QUFPL0IySSxFQUFBQSxTQUFTLEVBQUUzSSxNQVBvQjtBQVEvQjRJLEVBQUFBLFVBQVUsRUFBRTVJO0FBUm1CLENBQUQsQ0FBbEM7QUFXQSxNQUFNNkksb0JBQW9CLEdBQUd6SSxNQUFNLENBQUM7QUFDaEMwSSxFQUFBQSxhQUFhLEVBQUVWLG1CQURpQjtBQUVoQ1csRUFBQUEsZUFBZSxFQUFFWDtBQUZlLENBQUQsQ0FBbkM7QUFLQSxNQUFNWSxvQkFBb0IsR0FBRzVJLE1BQU0sQ0FBQztBQUNoQzZHLEVBQUFBLFlBQVksRUFBRWpILE1BRGtCO0FBRWhDaUosRUFBQUEsYUFBYSxFQUFFakosTUFGaUI7QUFHaENrSixFQUFBQSxnQkFBZ0IsRUFBRWxKLE1BSGM7QUFJaENtSixFQUFBQSxTQUFTLEVBQUVuSixNQUpxQjtBQUtoQ29KLEVBQUFBLFNBQVMsRUFBRXBKLE1BTHFCO0FBTWhDcUosRUFBQUEsTUFBTSxFQUFFckosTUFOd0I7QUFPaENzSixFQUFBQSxXQUFXLEVBQUV0SixNQVBtQjtBQVFoQ21HLEVBQUFBLEtBQUssRUFBRW5HLE1BUnlCO0FBU2hDdUosRUFBQUEsbUJBQW1CLEVBQUV2SixNQVRXO0FBVWhDd0osRUFBQUEsbUJBQW1CLEVBQUV4SixNQVZXO0FBV2hDa0ksRUFBQUEsT0FBTyxFQUFFbEksTUFYdUI7QUFZaEN5SixFQUFBQSxLQUFLLEVBQUV6SixNQVp5QjtBQWFoQzBKLEVBQUFBLFVBQVUsRUFBRTFKLE1BYm9CO0FBY2hDMkosRUFBQUEsT0FBTyxFQUFFM0osTUFkdUI7QUFlaEM0SixFQUFBQSxZQUFZLEVBQUU1SixNQWZrQjtBQWdCaEM2SixFQUFBQSxZQUFZLEVBQUU3SixNQWhCa0I7QUFpQmhDOEosRUFBQUEsYUFBYSxFQUFFOUosTUFqQmlCO0FBa0JoQytKLEVBQUFBLGlCQUFpQixFQUFFL0o7QUFsQmEsQ0FBRCxDQUFuQztBQXFCQSxNQUFNZ0ssb0JBQW9CLEdBQUc1SixNQUFNLENBQUM7QUFDaEM2SixFQUFBQSxxQkFBcUIsRUFBRS9KLFFBRFM7QUFFaENnSyxFQUFBQSxtQkFBbUIsRUFBRWhLO0FBRlcsQ0FBRCxDQUFuQztBQUtBLE1BQU1pSyxvQkFBb0IsR0FBRy9KLE1BQU0sQ0FBQztBQUNoQ2dLLEVBQUFBLHNCQUFzQixFQUFFcEssTUFEUTtBQUVoQ3FLLEVBQUFBLHNCQUFzQixFQUFFckssTUFGUTtBQUdoQ3NLLEVBQUFBLG9CQUFvQixFQUFFdEssTUFIVTtBQUloQ3VLLEVBQUFBLGNBQWMsRUFBRXZLO0FBSmdCLENBQUQsQ0FBbkM7QUFPQSxNQUFNd0ssb0JBQW9CLEdBQUdwSyxNQUFNLENBQUM7QUFDaENxSyxFQUFBQSxjQUFjLEVBQUV6SyxNQURnQjtBQUVoQzBLLEVBQUFBLG1CQUFtQixFQUFFMUssTUFGVztBQUdoQzJLLEVBQUFBLGNBQWMsRUFBRTNLO0FBSGdCLENBQUQsQ0FBbkM7QUFNQSxNQUFNNEssb0JBQW9CLEdBQUd4SyxNQUFNLENBQUM7QUFDaEN5SyxFQUFBQSxTQUFTLEVBQUUzSyxRQURxQjtBQUVoQzRLLEVBQUFBLFNBQVMsRUFBRTVLLFFBRnFCO0FBR2hDNkssRUFBQUEsZUFBZSxFQUFFN0ssUUFIZTtBQUloQzhLLEVBQUFBLGdCQUFnQixFQUFFaEw7QUFKYyxDQUFELENBQW5DO0FBT0EsTUFBTWlMLG9CQUFvQixHQUFHN0ssTUFBTSxDQUFDO0FBQ2hDOEssRUFBQUEsV0FBVyxFQUFFbEwsTUFEbUI7QUFFaENtTCxFQUFBQSxrQkFBa0IsRUFBRTFLLGVBQWUsQ0FBQyxhQUFELENBRkg7QUFHaEMySyxFQUFBQSxZQUFZLEVBQUVuTCxRQUhrQjtBQUloQ29MLEVBQUFBLGFBQWEsRUFBRXBMLFFBSmlCO0FBS2hDcUwsRUFBQUEsZUFBZSxFQUFFckwsUUFMZTtBQU1oQ3NMLEVBQUFBLGdCQUFnQixFQUFFdEw7QUFOYyxDQUFELENBQW5DO0FBU0EsTUFBTXVMLGVBQWUsR0FBR3BMLE1BQU0sQ0FBQztBQUMzQnFMLEVBQUFBLFNBQVMsRUFBRXhMLFFBRGdCO0FBRTNCeUwsRUFBQUEsU0FBUyxFQUFFekwsUUFGZ0I7QUFHM0IwTCxFQUFBQSxpQkFBaUIsRUFBRTFMLFFBSFE7QUFJM0IyTCxFQUFBQSxVQUFVLEVBQUUzTCxRQUplO0FBSzNCNEwsRUFBQUEsZUFBZSxFQUFFNUwsUUFMVTtBQU0zQjZMLEVBQUFBLGdCQUFnQixFQUFFN0wsUUFOUztBQU8zQjhMLEVBQUFBLGdCQUFnQixFQUFFOUwsUUFQUztBQVEzQitMLEVBQUFBLGNBQWMsRUFBRS9MLFFBUlc7QUFTM0JnTSxFQUFBQSxjQUFjLEVBQUVoTTtBQVRXLENBQUQsQ0FBOUI7QUFZQSxNQUFNaU0sZ0JBQWdCLEdBQUc5TCxNQUFNLENBQUM7QUFDNUIrTCxFQUFBQSxTQUFTLEVBQUVuTSxNQURpQjtBQUU1Qm9NLEVBQUFBLFVBQVUsRUFBRXBNLE1BRmdCO0FBRzVCcU0sRUFBQUEsVUFBVSxFQUFFck07QUFIZ0IsQ0FBRCxDQUEvQjtBQU1BLE1BQU1zTSxjQUFjLEdBQUdsTSxNQUFNLENBQUM7QUFDMUIrTCxFQUFBQSxTQUFTLEVBQUVuTSxNQURlO0FBRTFCb00sRUFBQUEsVUFBVSxFQUFFcE0sTUFGYztBQUcxQnFNLEVBQUFBLFVBQVUsRUFBRXJNO0FBSGMsQ0FBRCxDQUE3QjtBQU1BLE1BQU11TSxrQkFBa0IsR0FBR25NLE1BQU0sQ0FBQztBQUM5QitMLEVBQUFBLFNBQVMsRUFBRW5NLE1BRG1CO0FBRTlCb00sRUFBQUEsVUFBVSxFQUFFcE0sTUFGa0I7QUFHOUJxTSxFQUFBQSxVQUFVLEVBQUVyTTtBQUhrQixDQUFELENBQWpDO0FBTUEsTUFBTXdNLFdBQVcsR0FBR3BNLE1BQU0sQ0FBQztBQUN2QnFNLEVBQUFBLEtBQUssRUFBRVAsZ0JBRGdCO0FBRXZCUSxFQUFBQSxHQUFHLEVBQUVKLGNBRmtCO0FBR3ZCSyxFQUFBQSxRQUFRLEVBQUVKO0FBSGEsQ0FBRCxDQUExQjtBQU1BLE1BQU1LLGdCQUFnQixHQUFHeE0sTUFBTSxDQUFDO0FBQzVCeU0sRUFBQUEsVUFBVSxFQUFFNU0sUUFEZ0I7QUFFNUIwSSxFQUFBQSxTQUFTLEVBQUUxSSxRQUZpQjtBQUc1QjJJLEVBQUFBLFVBQVUsRUFBRTNJLFFBSGdCO0FBSTVCNk0sRUFBQUEsZ0JBQWdCLEVBQUU5TSxNQUpVO0FBSzVCK00sRUFBQUEsVUFBVSxFQUFFL00sTUFMZ0I7QUFNNUJnTixFQUFBQSxTQUFTLEVBQUVoTjtBQU5pQixDQUFELENBQS9CO0FBU0EsTUFBTWlOLG9CQUFvQixHQUFHN00sTUFBTSxDQUFDO0FBQ2hDOE0sRUFBQUEscUJBQXFCLEVBQUVsTixNQURTO0FBRWhDbU4sRUFBQUEsb0JBQW9CLEVBQUVuTixNQUZVO0FBR2hDb04sRUFBQUEsdUJBQXVCLEVBQUVwTixNQUhPO0FBSWhDcU4sRUFBQUEseUJBQXlCLEVBQUVyTixNQUpLO0FBS2hDc04sRUFBQUEsb0JBQW9CLEVBQUV0TjtBQUxVLENBQUQsQ0FBbkM7QUFRQSxNQUFNdU4sb0JBQW9CLEdBQUduTixNQUFNLENBQUM7QUFDaENvTixFQUFBQSxnQkFBZ0IsRUFBRXhOLE1BRGM7QUFFaEN5TixFQUFBQSxnQkFBZ0IsRUFBRXpOLE1BRmM7QUFHaEMwTixFQUFBQSx1QkFBdUIsRUFBRTFOLE1BSE87QUFJaEMyTixFQUFBQSxvQkFBb0IsRUFBRTNOLE1BSlU7QUFLaEM0TixFQUFBQSxhQUFhLEVBQUU1TixNQUxpQjtBQU1oQzZOLEVBQUFBLGdCQUFnQixFQUFFN04sTUFOYztBQU9oQzhOLEVBQUFBLGlCQUFpQixFQUFFOU4sTUFQYTtBQVFoQytOLEVBQUFBLGVBQWUsRUFBRS9OLE1BUmU7QUFTaENnTyxFQUFBQSxrQkFBa0IsRUFBRWhPO0FBVFksQ0FBRCxDQUFuQztBQVlBLE1BQU1pTyxnQkFBZ0IsR0FBRzdOLE1BQU0sQ0FBQztBQUM1QjhOLEVBQUFBLFVBQVUsRUFBRWxPLE1BRGdCO0FBRTVCbU8sRUFBQUEsTUFBTSxFQUFFbE8sUUFGb0I7QUFHNUJtTyxFQUFBQSxTQUFTLEVBQUVwTztBQUhpQixDQUFELENBQS9CO0FBTUEsTUFBTXFPLHFCQUFxQixHQUFHaE8sS0FBSyxDQUFDLE1BQU00TixnQkFBUCxDQUFuQztBQUNBLE1BQU1LLFlBQVksR0FBR2xPLE1BQU0sQ0FBQztBQUN4QjhLLEVBQUFBLFdBQVcsRUFBRWxMLE1BRFc7QUFFeEJtTCxFQUFBQSxrQkFBa0IsRUFBRTFLLGVBQWUsQ0FBQyxhQUFELENBRlg7QUFHeEI4TixFQUFBQSxXQUFXLEVBQUV2TyxNQUhXO0FBSXhCd08sRUFBQUEsa0JBQWtCLEVBQUUvTixlQUFlLENBQUMsYUFBRCxDQUpYO0FBS3hCZ08sRUFBQUEsS0FBSyxFQUFFek8sTUFMaUI7QUFNeEIwTyxFQUFBQSxZQUFZLEVBQUV6TyxRQU5VO0FBT3hCME8sRUFBQUEsSUFBSSxFQUFFTjtBQVBrQixDQUFELENBQTNCO0FBVUEsTUFBTU8sb0JBQW9CLEdBQUd4TyxNQUFNLENBQUM7QUFDaENnTyxFQUFBQSxTQUFTLEVBQUVwTyxNQURxQjtBQUVoQzZPLEVBQUFBLGVBQWUsRUFBRTdPLE1BRmU7QUFHaEM4TyxFQUFBQSxLQUFLLEVBQUU5TyxNQUh5QjtBQUloQytPLEVBQUFBLFdBQVcsRUFBRS9PLE1BSm1CO0FBS2hDZ1AsRUFBQUEsV0FBVyxFQUFFaFAsTUFMbUI7QUFNaENpUCxFQUFBQSxXQUFXLEVBQUVqUDtBQU5tQixDQUFELENBQW5DO0FBU0EsTUFBTWtQLHdCQUF3QixHQUFHN08sS0FBSyxDQUFDLE1BQU0ySCxtQkFBUCxDQUF0QztBQUNBLE1BQU1tSCxVQUFVLEdBQUc5TyxLQUFLLENBQUMsTUFBTUwsTUFBUCxDQUF4QjtBQUNBLE1BQU1vUCx5QkFBeUIsR0FBRy9PLEtBQUssQ0FBQyxNQUFNMkksb0JBQVAsQ0FBdkM7QUFDQSxNQUFNcUcseUJBQXlCLEdBQUdoUCxLQUFLLENBQUMsTUFBTTRLLG9CQUFQLENBQXZDO0FBQ0EsTUFBTXFFLFdBQVcsR0FBR2pQLEtBQUssQ0FBQyxNQUFNTCxNQUFQLENBQXpCO0FBQ0EsTUFBTXVQLHlCQUF5QixHQUFHbFAsS0FBSyxDQUFDLE1BQU11TyxvQkFBUCxDQUF2QztBQUNBLE1BQU1ZLGlCQUFpQixHQUFHcFAsTUFBTSxDQUFDO0FBQzdCcVAsRUFBQUEsRUFBRSxFQUFFelAsTUFEeUI7QUFFN0IwUCxFQUFBQSxFQUFFLEVBQUUxUCxNQUZ5QjtBQUc3QjJQLEVBQUFBLEVBQUUsRUFBRTNQLE1BSHlCO0FBSTdCNFAsRUFBQUEsRUFBRSxFQUFFNVAsTUFKeUI7QUFLN0I2UCxFQUFBQSxFQUFFLEVBQUU3UCxNQUx5QjtBQU03QjhQLEVBQUFBLEVBQUUsRUFBRWpJLG1CQU55QjtBQU83QmtJLEVBQUFBLEVBQUUsRUFBRWIsd0JBUHlCO0FBUTdCYyxFQUFBQSxFQUFFLEVBQUUvSCxtQkFSeUI7QUFTN0JnSSxFQUFBQSxFQUFFLEVBQUVkLFVBVHlCO0FBVTdCZSxFQUFBQSxHQUFHLEVBQUVmLFVBVndCO0FBVzdCZ0IsRUFBQUEsR0FBRyxFQUFFdEgsb0JBWHdCO0FBWTdCdUgsRUFBQUEsR0FBRyxFQUFFaEIseUJBWndCO0FBYTdCaUIsRUFBQUEsR0FBRyxFQUFFckcsb0JBYndCO0FBYzdCc0csRUFBQUEsR0FBRyxFQUFFbkcsb0JBZHdCO0FBZTdCb0csRUFBQUEsR0FBRyxFQUFFL0Ysb0JBZndCO0FBZ0I3QmdHLEVBQUFBLEdBQUcsRUFBRTVGLG9CQWhCd0I7QUFpQjdCNkYsRUFBQUEsR0FBRyxFQUFFcEIseUJBakJ3QjtBQWtCN0JxQixFQUFBQSxHQUFHLEVBQUVsRixlQWxCd0I7QUFtQjdCbUYsRUFBQUEsR0FBRyxFQUFFbkYsZUFuQndCO0FBb0I3Qm9GLEVBQUFBLEdBQUcsRUFBRXBFLFdBcEJ3QjtBQXFCN0JxRSxFQUFBQSxHQUFHLEVBQUVyRSxXQXJCd0I7QUFzQjdCc0UsRUFBQUEsR0FBRyxFQUFFbEUsZ0JBdEJ3QjtBQXVCN0JtRSxFQUFBQSxHQUFHLEVBQUVuRSxnQkF2QndCO0FBd0I3Qm9FLEVBQUFBLEdBQUcsRUFBRS9ELG9CQXhCd0I7QUF5QjdCZ0UsRUFBQUEsR0FBRyxFQUFFMUQsb0JBekJ3QjtBQTBCN0IyRCxFQUFBQSxHQUFHLEVBQUU1QixXQTFCd0I7QUEyQjdCNkIsRUFBQUEsR0FBRyxFQUFFN0MsWUEzQndCO0FBNEI3QjhDLEVBQUFBLEdBQUcsRUFBRTlDLFlBNUJ3QjtBQTZCN0IrQyxFQUFBQSxHQUFHLEVBQUUvQyxZQTdCd0I7QUE4QjdCZ0QsRUFBQUEsR0FBRyxFQUFFaEQsWUE5QndCO0FBK0I3QmlELEVBQUFBLEdBQUcsRUFBRWpELFlBL0J3QjtBQWdDN0JrRCxFQUFBQSxHQUFHLEVBQUVsRCxZQWhDd0I7QUFpQzdCbUQsRUFBQUEsR0FBRyxFQUFFbEM7QUFqQ3dCLENBQUQsQ0FBaEM7QUFvQ0EsTUFBTW1DLDJCQUEyQixHQUFHclIsS0FBSyxDQUFDLE1BQU0yRyxzQkFBUCxDQUF6QztBQUNBLE1BQU0ySyx5QkFBeUIsR0FBR3RSLEtBQUssQ0FBQyxNQUFNK0csb0JBQVAsQ0FBdkM7QUFDQSxNQUFNd0ssaUNBQWlDLEdBQUd2UixLQUFLLENBQUMsTUFBTW9ILDRCQUFQLENBQS9DO0FBQ0EsTUFBTW9LLFdBQVcsR0FBR3pSLE1BQU0sQ0FBQztBQUN2QjBSLEVBQUFBLG1CQUFtQixFQUFFOVIsTUFERTtBQUV2QitSLEVBQUFBLDBCQUEwQixFQUFFdFIsZUFBZSxDQUFDLHFCQUFELENBRnBCO0FBR3ZCdVIsRUFBQUEsbUJBQW1CLEVBQUVoUyxNQUhFO0FBSXZCaVMsRUFBQUEsMEJBQTBCLEVBQUV4UixlQUFlLENBQUMscUJBQUQsQ0FKcEI7QUFLdkJ5UixFQUFBQSxZQUFZLEVBQUVSLDJCQUxTO0FBTXZCUyxFQUFBQSxVQUFVLEVBQUVSLHlCQU5XO0FBT3ZCUyxFQUFBQSxrQkFBa0IsRUFBRXpRLEtBUEc7QUFRdkIwUSxFQUFBQSxtQkFBbUIsRUFBRVQsaUNBUkU7QUFTdkJVLEVBQUFBLFdBQVcsRUFBRXRTLE1BVFU7QUFVdkJ1UyxFQUFBQSxNQUFNLEVBQUUvQztBQVZlLENBQUQsQ0FBMUI7QUFhQSxNQUFNZ0QseUJBQXlCLEdBQUdwUyxNQUFNLENBQUM7QUFDckNzSCxFQUFBQSxPQUFPLEVBQUUxSCxNQUQ0QjtBQUVyQzJILEVBQUFBLENBQUMsRUFBRTNILE1BRmtDO0FBR3JDNEgsRUFBQUEsQ0FBQyxFQUFFNUg7QUFIa0MsQ0FBRCxDQUF4QztBQU1BLE1BQU15Uyw4QkFBOEIsR0FBR3BTLEtBQUssQ0FBQyxNQUFNbVMseUJBQVAsQ0FBNUM7QUFDQSxNQUFNRSxlQUFlLEdBQUd0UyxNQUFNLENBQUM7QUFDM0J1UyxFQUFBQSxFQUFFLEVBQUUzUyxNQUR1QjtBQUUzQnVHLEVBQUFBLFNBQVMsRUFBRXZHLE1BRmdCO0FBRzNCd0csRUFBQUEsZ0JBQWdCLEVBQUUvRixlQUFlLENBQUMsV0FBRCxDQUhOO0FBSTNCVSxFQUFBQSxNQUFNLEVBQUVuQixNQUptQjtBQUszQmtILEVBQUFBLEtBQUssRUFBRWxILE1BTG9CO0FBTTNCaUgsRUFBQUEsWUFBWSxFQUFFakgsTUFOYTtBQU8zQjRTLEVBQUFBLEtBQUssRUFBRTVTLE1BUG9CO0FBUTNCNlMsRUFBQUEseUJBQXlCLEVBQUU3UyxNQVJBO0FBUzNCOFMsRUFBQUEsY0FBYyxFQUFFOVMsTUFUVztBQVUzQitTLEVBQUFBLFVBQVUsRUFBRTlTLFFBVmU7QUFXM0IrUyxFQUFBQSxVQUFVLEVBQUVQLDhCQVhlO0FBWTNCUSxFQUFBQSxLQUFLLEVBQUUzUyxJQUFJLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxRQUFiLEVBQXVCLE1BQU00UyxLQUE3QjtBQVpnQixDQUFELEVBYTNCLElBYjJCLENBQTlCO0FBZUEsTUFBTUMsVUFBVSxHQUFHOVMsS0FBSyxDQUFDLE1BQU1zQixLQUFQLENBQXhCO0FBQ0EsTUFBTXlSLFdBQVcsR0FBRy9TLEtBQUssQ0FBQyxNQUFNd0MsTUFBUCxDQUF6QjtBQUNBLE1BQU13USx1QkFBdUIsR0FBR2hULEtBQUssQ0FBQyxNQUFNMkUsa0JBQVAsQ0FBckM7QUFDQSxNQUFNa08sS0FBSyxHQUFHOVMsTUFBTSxDQUFDO0FBQ2pCdVMsRUFBQUEsRUFBRSxFQUFFM1MsTUFEYTtBQUVqQnNULEVBQUFBLE1BQU0sRUFBRXRULE1BRlM7QUFHakJ1VCxFQUFBQSxXQUFXLEVBQUUvUyxRQUFRLENBQUMsUUFBRCxFQUFXO0FBQUVnVCxJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxJQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLFNBQVMsRUFBRSxDQUF0QztBQUF5Q0MsSUFBQUEsT0FBTyxFQUFFO0FBQWxELEdBQVgsQ0FISjtBQUlqQkMsRUFBQUEsU0FBUyxFQUFFNVQsTUFKTTtBQUtqQmdHLEVBQUFBLFVBQVUsRUFBRWhHLE1BTEs7QUFNakJtQixFQUFBQSxNQUFNLEVBQUVuQixNQU5TO0FBT2pCNlQsRUFBQUEsV0FBVyxFQUFFN1QsTUFQSTtBQVFqQnVHLEVBQUFBLFNBQVMsRUFBRXZHLE1BUk07QUFTakJ3RyxFQUFBQSxnQkFBZ0IsRUFBRS9GLGVBQWUsQ0FBQyxXQUFELENBVGhCO0FBVWpCcVQsRUFBQUEsa0JBQWtCLEVBQUU5VCxNQVZIO0FBV2pCbUcsRUFBQUEsS0FBSyxFQUFFbkcsTUFYVTtBQVlqQitULEVBQUFBLFVBQVUsRUFBRTlTLFNBWks7QUFhakIrUyxFQUFBQSxRQUFRLEVBQUUvUyxTQWJPO0FBY2pCZ1QsRUFBQUEsWUFBWSxFQUFFaFQsU0FkRztBQWVqQmlULEVBQUFBLGFBQWEsRUFBRWpULFNBZkU7QUFnQmpCa1QsRUFBQUEsaUJBQWlCLEVBQUVsVCxTQWhCRjtBQWlCakJpSCxFQUFBQSxPQUFPLEVBQUVsSSxNQWpCUTtBQWtCakJvVSxFQUFBQSw2QkFBNkIsRUFBRXBVLE1BbEJkO0FBbUJqQjhGLEVBQUFBLFlBQVksRUFBRTlGLE1BbkJHO0FBb0JqQnFVLEVBQUFBLFdBQVcsRUFBRXJVLE1BcEJJO0FBcUJqQmlHLEVBQUFBLFVBQVUsRUFBRWpHLE1BckJLO0FBc0JqQnNVLEVBQUFBLFdBQVcsRUFBRXRVLE1BdEJJO0FBdUJqQjZGLEVBQUFBLFFBQVEsRUFBRTVGLFFBdkJPO0FBd0JqQmlCLEVBQUFBLE1BQU0sRUFBRWpCLFFBeEJTO0FBeUJqQmdILEVBQUFBLFlBQVksRUFBRWpILE1BekJHO0FBMEJqQmtILEVBQUFBLEtBQUssRUFBRWxILE1BMUJVO0FBMkJqQnNHLEVBQUFBLGdCQUFnQixFQUFFdEcsTUEzQkQ7QUE0QmpCdVUsRUFBQUEsb0JBQW9CLEVBQUV2VSxNQTVCTDtBQTZCakJ3VSxFQUFBQSxvQkFBb0IsRUFBRXhVLE1BN0JMO0FBOEJqQnlVLEVBQUFBLHlCQUF5QixFQUFFelUsTUE5QlY7QUErQmpCMFUsRUFBQUEsVUFBVSxFQUFFL1EsY0EvQks7QUFnQ2pCZ1IsRUFBQUEsWUFBWSxFQUFFeEIsVUFoQ0c7QUFpQ2pCeUIsRUFBQUEsU0FBUyxFQUFFNVUsTUFqQ007QUFrQ2pCNlUsRUFBQUEsVUFBVSxFQUFFN1UsTUFsQ0s7QUFtQ2pCOFUsRUFBQUEsYUFBYSxFQUFFMUIsV0FuQ0U7QUFvQ2pCMkIsRUFBQUEsY0FBYyxFQUFFMUIsdUJBcENDO0FBcUNqQmhPLEVBQUFBLFFBQVEsRUFBRXJGLE1BckNPO0FBc0NqQmdWLEVBQUFBLFlBQVksRUFBRTFQLGdCQXRDRztBQXVDakIyUCxFQUFBQSxNQUFNLEVBQUVwRCxXQXZDUztBQXdDakJxRCxFQUFBQSxTQUFTLEVBQUVsVixNQXhDTTtBQXlDakJtVixFQUFBQSxHQUFHLEVBQUVuVixNQXpDWTtBQTBDakJnVCxFQUFBQSxVQUFVLEVBQUUxUyxJQUFJLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxtQkFBYixFQUFrQyxNQUFNb1MsZUFBeEM7QUExQ0MsQ0FBRCxFQTJDakIsSUEzQ2lCLENBQXBCO0FBNkNBLE1BQU0wQyxrQkFBa0IsR0FBR2hWLE1BQU0sQ0FBQztBQUM5QmlWLEVBQUFBLHNCQUFzQixFQUFFblYsUUFETTtBQUU5Qm9WLEVBQUFBLGdCQUFnQixFQUFFcFYsUUFGWTtBQUc5QnFWLEVBQUFBLGFBQWEsRUFBRXZWLE1BSGU7QUFJOUJ3VixFQUFBQSxrQkFBa0IsRUFBRWhWLFFBQVEsQ0FBQyxlQUFELEVBQWtCO0FBQUVpVixJQUFBQSxTQUFTLEVBQUUsQ0FBYjtBQUFnQkMsSUFBQUEsTUFBTSxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxPQUFPLEVBQUU7QUFBcEMsR0FBbEI7QUFKRSxDQUFELENBQWpDO0FBT0EsTUFBTUMsaUJBQWlCLEdBQUd4VixNQUFNLENBQUM7QUFDN0J5VixFQUFBQSxrQkFBa0IsRUFBRTNWLFFBRFM7QUFFN0I0VixFQUFBQSxNQUFNLEVBQUU1VixRQUZxQjtBQUc3QjZWLEVBQUFBLFlBQVksRUFBRXJTO0FBSGUsQ0FBRCxDQUFoQztBQU1BLE1BQU1zUyxrQkFBa0IsR0FBRzVWLE1BQU0sQ0FBQztBQUM5QjZWLEVBQUFBLFlBQVksRUFBRWpXLE1BRGdCO0FBRTlCa1csRUFBQUEsaUJBQWlCLEVBQUUxVixRQUFRLENBQUMsY0FBRCxFQUFpQjtBQUFFMlYsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsSUFBQUEsRUFBRSxFQUFFO0FBQWxCLEdBQWpCLENBRkc7QUFHOUJDLEVBQUFBLGNBQWMsRUFBRXJXLE1BSGM7QUFJOUJzVyxFQUFBQSxtQkFBbUIsRUFBRTlWLFFBQVEsQ0FBQyxnQkFBRCxFQUFtQjtBQUFFK1YsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsSUFBQUEsUUFBUSxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxLQUFLLEVBQUU7QUFBbEMsR0FBbkIsQ0FKQztBQUs5QkMsRUFBQUEsT0FBTyxFQUFFMVcsTUFMcUI7QUFNOUIyVyxFQUFBQSxjQUFjLEVBQUUzVyxNQU5jO0FBTzlCNFcsRUFBQUEsaUJBQWlCLEVBQUU1VyxNQVBXO0FBUTlCNlcsRUFBQUEsUUFBUSxFQUFFM1csUUFSb0I7QUFTOUI0VyxFQUFBQSxRQUFRLEVBQUU3VyxRQVRvQjtBQVU5QnlMLEVBQUFBLFNBQVMsRUFBRXpMLFFBVm1CO0FBVzlCMkwsRUFBQUEsVUFBVSxFQUFFNUwsTUFYa0I7QUFZOUIrVyxFQUFBQSxJQUFJLEVBQUUvVyxNQVp3QjtBQWE5QmdYLEVBQUFBLFNBQVMsRUFBRWhYLE1BYm1CO0FBYzlCaVgsRUFBQUEsUUFBUSxFQUFFalgsTUFkb0I7QUFlOUJrWCxFQUFBQSxRQUFRLEVBQUVsWCxNQWZvQjtBQWdCOUJtWCxFQUFBQSxrQkFBa0IsRUFBRW5YLE1BaEJVO0FBaUI5Qm9YLEVBQUFBLG1CQUFtQixFQUFFcFg7QUFqQlMsQ0FBRCxDQUFqQztBQW9CQSxNQUFNcVgsaUJBQWlCLEdBQUdqWCxNQUFNLENBQUM7QUFDN0JzVyxFQUFBQSxPQUFPLEVBQUUxVyxNQURvQjtBQUU3QnNYLEVBQUFBLEtBQUssRUFBRXRYLE1BRnNCO0FBRzdCdVgsRUFBQUEsUUFBUSxFQUFFdlgsTUFIbUI7QUFJN0J1VixFQUFBQSxhQUFhLEVBQUV2VixNQUpjO0FBSzdCd1YsRUFBQUEsa0JBQWtCLEVBQUVoVixRQUFRLENBQUMsZUFBRCxFQUFrQjtBQUFFaVYsSUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JDLElBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsT0FBTyxFQUFFO0FBQXBDLEdBQWxCLENBTEM7QUFNN0I2QixFQUFBQSxjQUFjLEVBQUV0WCxRQU5hO0FBTzdCdVgsRUFBQUEsaUJBQWlCLEVBQUV2WCxRQVBVO0FBUTdCd1gsRUFBQUEsV0FBVyxFQUFFMVgsTUFSZ0I7QUFTN0IyWCxFQUFBQSxVQUFVLEVBQUUzWCxNQVRpQjtBQVU3QjRYLEVBQUFBLFdBQVcsRUFBRTVYLE1BVmdCO0FBVzdCNlgsRUFBQUEsWUFBWSxFQUFFN1gsTUFYZTtBQVk3QjhYLEVBQUFBLGVBQWUsRUFBRTlYLE1BWlk7QUFhN0IrWCxFQUFBQSxZQUFZLEVBQUUvWCxNQWJlO0FBYzdCZ1ksRUFBQUEsZ0JBQWdCLEVBQUVoWSxNQWRXO0FBZTdCaVksRUFBQUEsb0JBQW9CLEVBQUVqWSxNQWZPO0FBZ0I3QmtZLEVBQUFBLG1CQUFtQixFQUFFbFk7QUFoQlEsQ0FBRCxDQUFoQztBQW1CQSxNQUFNbVksaUJBQWlCLEdBQUcvWCxNQUFNLENBQUM7QUFDN0JnWSxFQUFBQSxXQUFXLEVBQUVwWSxNQURnQjtBQUU3QnFZLEVBQUFBLGdCQUFnQixFQUFFN1gsUUFBUSxDQUFDLGFBQUQsRUFBZ0I7QUFBRThYLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsRUFBRSxFQUFFO0FBQS9CLEdBQWhCLENBRkc7QUFHN0JDLEVBQUFBLGNBQWMsRUFBRXpZLE1BSGE7QUFJN0IwWSxFQUFBQSxhQUFhLEVBQUUxWSxNQUpjO0FBSzdCMlksRUFBQUEsWUFBWSxFQUFFelksUUFMZTtBQU03QjBZLEVBQUFBLFFBQVEsRUFBRTFZLFFBTm1CO0FBTzdCMlksRUFBQUEsUUFBUSxFQUFFM1k7QUFQbUIsQ0FBRCxDQUFoQztBQVVBLE1BQU00WSxvQkFBb0IsR0FBRzFZLE1BQU0sQ0FBQztBQUNoQzJZLEVBQUFBLGlCQUFpQixFQUFFL1ksTUFEYTtBQUVoQ2daLEVBQUFBLGVBQWUsRUFBRWhaLE1BRmU7QUFHaENpWixFQUFBQSxTQUFTLEVBQUVqWixNQUhxQjtBQUloQ2taLEVBQUFBLFlBQVksRUFBRWxaO0FBSmtCLENBQUQsQ0FBbkM7QUFPQSxNQUFNbVosWUFBWSxHQUFHOVksS0FBSyxDQUFDLE1BQU0rWSxPQUFQLENBQTFCO0FBQ0EsTUFBTUMsV0FBVyxHQUFHalosTUFBTSxDQUFDO0FBQ3ZCdVMsRUFBQUEsRUFBRSxFQUFFM1MsTUFEbUI7QUFFdkJzWixFQUFBQSxPQUFPLEVBQUV0WixNQUZjO0FBR3ZCdVosRUFBQUEsWUFBWSxFQUFFL1ksUUFBUSxDQUFDLFNBQUQsRUFBWTtBQUFFZ1osSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxJQUFJLEVBQUUsQ0FBakM7QUFBb0NDLElBQUFBLElBQUksRUFBRSxDQUExQztBQUE2Q0MsSUFBQUEsWUFBWSxFQUFFLENBQTNEO0FBQThEQyxJQUFBQSxZQUFZLEVBQUUsQ0FBNUU7QUFBK0VDLElBQUFBLFlBQVksRUFBRSxDQUE3RjtBQUFnR0MsSUFBQUEsWUFBWSxFQUFFO0FBQTlHLEdBQVosQ0FIQztBQUl2QnpHLEVBQUFBLE1BQU0sRUFBRXRULE1BSmU7QUFLdkJ1VCxFQUFBQSxXQUFXLEVBQUUvUyxRQUFRLENBQUMsUUFBRCxFQUFXO0FBQUVnVCxJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjd0csSUFBQUEsV0FBVyxFQUFFLENBQTNCO0FBQThCdkcsSUFBQUEsUUFBUSxFQUFFLENBQXhDO0FBQTJDQyxJQUFBQSxTQUFTLEVBQUUsQ0FBdEQ7QUFBeURDLElBQUFBLE9BQU8sRUFBRTtBQUFsRSxHQUFYLENBTEU7QUFNdkJzRyxFQUFBQSxRQUFRLEVBQUVqYSxNQU5hO0FBT3ZCaVQsRUFBQUEsS0FBSyxFQUFFM1MsSUFBSSxDQUFDLFVBQUQsRUFBYSxJQUFiLEVBQW1CLFFBQW5CLEVBQTZCLE1BQU00UyxLQUFuQyxDQVBZO0FBUXZCak8sRUFBQUEsWUFBWSxFQUFFakYsTUFSUztBQVN2QmlILEVBQUFBLFlBQVksRUFBRWpILE1BVFM7QUFVdkI0RSxFQUFBQSxFQUFFLEVBQUUzRSxRQVZtQjtBQVd2QmlhLEVBQUFBLGVBQWUsRUFBRWxhLE1BWE07QUFZdkJtYSxFQUFBQSxhQUFhLEVBQUVsYSxRQVpRO0FBYXZCbWEsRUFBQUEsR0FBRyxFQUFFcGEsTUFia0I7QUFjdkJxYSxFQUFBQSxVQUFVLEVBQUVyYSxNQWRXO0FBZXZCc2EsRUFBQUEsV0FBVyxFQUFFdGEsTUFmVTtBQWdCdkJ1YSxFQUFBQSxnQkFBZ0IsRUFBRS9aLFFBQVEsQ0FBQyxhQUFELEVBQWdCO0FBQUVnYSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0IvRSxJQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUNnRixJQUFBQSxRQUFRLEVBQUU7QUFBN0MsR0FBaEIsQ0FoQkg7QUFpQnZCQyxFQUFBQSxVQUFVLEVBQUUzYSxNQWpCVztBQWtCdkI0YSxFQUFBQSxlQUFlLEVBQUVwYSxRQUFRLENBQUMsWUFBRCxFQUFlO0FBQUVnYSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0IvRSxJQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUNnRixJQUFBQSxRQUFRLEVBQUU7QUFBN0MsR0FBZixDQWxCRjtBQW1CdkJuWSxFQUFBQSxNQUFNLEVBQUV2QyxNQW5CZTtBQW9CdkI2YSxFQUFBQSxVQUFVLEVBQUV2YSxJQUFJLENBQUMsUUFBRCxFQUFXLElBQVgsRUFBaUIsVUFBakIsRUFBNkIsTUFBTThZLE9BQW5DLENBcEJPO0FBcUJ2QjBCLEVBQUFBLFFBQVEsRUFBRXhMLFdBckJhO0FBc0J2QnlMLEVBQUFBLFlBQVksRUFBRXhhLFNBQVMsQ0FBQyxVQUFELEVBQWEsSUFBYixFQUFtQixVQUFuQixFQUErQixNQUFNNlksT0FBckMsQ0F0QkE7QUF1QnZCdlUsRUFBQUEsVUFBVSxFQUFFM0UsUUF2Qlc7QUF3QnZCNEUsRUFBQUEsZ0JBQWdCLEVBQUVwQixrQkF4Qks7QUF5QnZCeUIsRUFBQUEsUUFBUSxFQUFFbkYsTUF6QmE7QUEwQnZCb0YsRUFBQUEsUUFBUSxFQUFFcEYsTUExQmE7QUEyQnZCZ2IsRUFBQUEsWUFBWSxFQUFFaGIsTUEzQlM7QUE0QnZCaWIsRUFBQUEsT0FBTyxFQUFFN0Ysa0JBNUJjO0FBNkJ2QlUsRUFBQUEsTUFBTSxFQUFFRixpQkE3QmU7QUE4QnZCc0YsRUFBQUEsT0FBTyxFQUFFbEYsa0JBOUJjO0FBK0J2Qm1GLEVBQUFBLE1BQU0sRUFBRTlELGlCQS9CZTtBQWdDdkIrRCxFQUFBQSxNQUFNLEVBQUVqRCxpQkFoQ2U7QUFpQ3ZCa0QsRUFBQUEsT0FBTyxFQUFFcmIsTUFqQ2M7QUFrQ3ZCc2IsRUFBQUEsU0FBUyxFQUFFdGIsTUFsQ1k7QUFtQ3ZCdWIsRUFBQUEsRUFBRSxFQUFFdmIsTUFuQ21CO0FBb0N2QndiLEVBQUFBLFVBQVUsRUFBRTFDLG9CQXBDVztBQXFDdkIyQyxFQUFBQSxtQkFBbUIsRUFBRXpiLE1BckNFO0FBc0N2QjBiLEVBQUFBLFNBQVMsRUFBRTFiLE1BdENZO0FBdUN2QjRTLEVBQUFBLEtBQUssRUFBRTVTLE1BdkNnQjtBQXdDdkJtVixFQUFBQSxHQUFHLEVBQUVuVixNQXhDa0I7QUF5Q3ZCMmIsRUFBQUEsYUFBYSxFQUFFemIsUUF6Q1E7QUEwQ3ZCMGIsRUFBQUEsbUJBQW1CLEVBQUVsWTtBQTFDRSxDQUFELEVBMkN2QixJQTNDdUIsQ0FBMUI7QUE2Q0EsTUFBTTBWLE9BQU8sR0FBR2haLE1BQU0sQ0FBQztBQUNuQnVTLEVBQUFBLEVBQUUsRUFBRTNTLE1BRGU7QUFFbkI0QixFQUFBQSxRQUFRLEVBQUU1QixNQUZTO0FBR25CNkIsRUFBQUEsYUFBYSxFQUFFckIsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFcWIsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsS0FBSyxFQUFFLENBQXRCO0FBQXlCQyxJQUFBQSxNQUFNLEVBQUU7QUFBakMsR0FBYixDQUhKO0FBSW5CekksRUFBQUEsTUFBTSxFQUFFdFQsTUFKVztBQUtuQnVULEVBQUFBLFdBQVcsRUFBRS9TLFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRWdULElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWN3SSxJQUFBQSxNQUFNLEVBQUUsQ0FBdEI7QUFBeUJDLElBQUFBLFVBQVUsRUFBRSxDQUFyQztBQUF3Q2pDLElBQUFBLFdBQVcsRUFBRSxDQUFyRDtBQUF3RHZHLElBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsSUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxJQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0Z1SSxJQUFBQSxVQUFVLEVBQUU7QUFBM0csR0FBWCxDQUxGO0FBTW5CakMsRUFBQUEsUUFBUSxFQUFFamEsTUFOUztBQU9uQmlULEVBQUFBLEtBQUssRUFBRTNTLElBQUksQ0FBQyxVQUFELEVBQWEsSUFBYixFQUFtQixRQUFuQixFQUE2QixNQUFNNFMsS0FBbkMsQ0FQUTtBQVFuQmlKLEVBQUFBLElBQUksRUFBRW5jLE1BUmE7QUFTbkJvYyxFQUFBQSxTQUFTLEVBQUVwYyxNQVRRO0FBVW5CcWMsRUFBQUEsV0FBVyxFQUFFcmMsTUFWTTtBQVduQnNjLEVBQUFBLElBQUksRUFBRXRjLE1BWGE7QUFZbkJ1YyxFQUFBQSxJQUFJLEVBQUV2YyxNQVphO0FBYW5Cd2MsRUFBQUEsSUFBSSxFQUFFeGMsTUFiYTtBQWNuQnljLEVBQUFBLFNBQVMsRUFBRXpjLE1BZFE7QUFlbkIwYyxFQUFBQSxJQUFJLEVBQUUxYyxNQWZhO0FBZ0JuQjJjLEVBQUFBLFNBQVMsRUFBRTNjLE1BaEJRO0FBaUJuQjRjLEVBQUFBLE9BQU8sRUFBRTVjLE1BakJVO0FBa0JuQjZjLEVBQUFBLFlBQVksRUFBRTdjLE1BbEJLO0FBbUJuQjhjLEVBQUFBLEdBQUcsRUFBRTljLE1BbkJjO0FBb0JuQitjLEVBQUFBLEdBQUcsRUFBRS9jLE1BcEJjO0FBcUJuQmdkLEVBQUFBLGdCQUFnQixFQUFFaGQsTUFyQkM7QUFzQm5CaWQsRUFBQUEsZ0JBQWdCLEVBQUVqZCxNQXRCQztBQXVCbkJrZCxFQUFBQSxVQUFVLEVBQUVqZCxRQXZCTztBQXdCbkJrZCxFQUFBQSxVQUFVLEVBQUVuZCxNQXhCTztBQXlCbkJvZCxFQUFBQSxpQkFBaUIsRUFBRTNjLGVBQWUsQ0FBQyxZQUFELENBekJmO0FBMEJuQjRjLEVBQUFBLFlBQVksRUFBRXJkLE1BMUJLO0FBMkJuQnFDLEVBQUFBLE9BQU8sRUFBRW5DLFFBM0JVO0FBNEJuQnNDLEVBQUFBLE9BQU8sRUFBRXRDLFFBNUJVO0FBNkJuQm9kLEVBQUFBLFVBQVUsRUFBRXBkLFFBN0JPO0FBOEJuQmtiLEVBQUFBLE1BQU0sRUFBRXBiLE1BOUJXO0FBK0JuQnVkLEVBQUFBLE9BQU8sRUFBRXZkLE1BL0JVO0FBZ0NuQmdCLEVBQUFBLEtBQUssRUFBRWQsUUFoQ1k7QUFpQ25Cc2QsRUFBQUEsV0FBVyxFQUFFOVosa0JBakNNO0FBa0NuQmtQLEVBQUFBLEtBQUssRUFBRTVTLE1BbENZO0FBbUNuQm1WLEVBQUFBLEdBQUcsRUFBRW5WLE1BbkNjO0FBb0NuQnlkLEVBQUFBLGVBQWUsRUFBRW5kLElBQUksQ0FBQyxJQUFELEVBQU8sYUFBUCxFQUFzQixjQUF0QixFQUFzQyxNQUFNK1ksV0FBNUMsQ0FwQ0Y7QUFxQ25CcUUsRUFBQUEsZUFBZSxFQUFFcGQsSUFBSSxDQUFDLElBQUQsRUFBTyxRQUFQLEVBQWlCLGNBQWpCLEVBQWlDLE1BQU0rWSxXQUF2QztBQXJDRixDQUFELEVBc0NuQixJQXRDbUIsQ0FBdEI7QUF3Q0EsTUFBTXNFLE9BQU8sR0FBR3ZkLE1BQU0sQ0FBQztBQUNuQnVTLEVBQUFBLEVBQUUsRUFBRTNTLE1BRGU7QUFFbkJpSCxFQUFBQSxZQUFZLEVBQUVqSCxNQUZLO0FBR25CNGQsRUFBQUEsUUFBUSxFQUFFNWQsTUFIUztBQUluQjZkLEVBQUFBLGFBQWEsRUFBRXJkLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRWdhLElBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLElBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3Qi9FLElBQUFBLE1BQU0sRUFBRTtBQUFoQyxHQUFiLENBSko7QUFLbkJvSSxFQUFBQSxTQUFTLEVBQUU5ZCxNQUxRO0FBTW5CK2QsRUFBQUEsV0FBVyxFQUFFN2QsUUFOTTtBQU9uQjhkLEVBQUFBLGFBQWEsRUFBRS9kLFFBUEk7QUFRbkJnZSxFQUFBQSxPQUFPLEVBQUUvZCxRQVJVO0FBU25CZ2UsRUFBQUEsYUFBYSxFQUFFeGEsa0JBVEk7QUFVbkIyWSxFQUFBQSxXQUFXLEVBQUVyYyxNQVZNO0FBV25Cc2MsRUFBQUEsSUFBSSxFQUFFdGMsTUFYYTtBQVluQnVjLEVBQUFBLElBQUksRUFBRXZjLE1BWmE7QUFhbkJ3YyxFQUFBQSxJQUFJLEVBQUV4YyxNQWJhO0FBY25CeWMsRUFBQUEsU0FBUyxFQUFFemMsTUFkUTtBQWVuQjBjLEVBQUFBLElBQUksRUFBRTFjLE1BZmE7QUFnQm5CMmMsRUFBQUEsU0FBUyxFQUFFM2MsTUFoQlE7QUFpQm5CNGMsRUFBQUEsT0FBTyxFQUFFNWMsTUFqQlU7QUFrQm5CNmMsRUFBQUEsWUFBWSxFQUFFN2MsTUFsQks7QUFtQm5CNFMsRUFBQUEsS0FBSyxFQUFFNVMsTUFuQlk7QUFvQm5CbVYsRUFBQUEsR0FBRyxFQUFFblYsTUFwQmM7QUFxQm5CbWUsRUFBQUEsVUFBVSxFQUFFbmU7QUFyQk8sQ0FBRCxFQXNCbkIsSUF0Qm1CLENBQXRCOztBQXdCQSxTQUFTb2UsZUFBVCxDQUF5QjFCLElBQXpCLEVBQStCO0FBQzNCLFNBQU87QUFDSDViLElBQUFBLGFBQWEsRUFBRTtBQUNYRSxNQUFBQSxLQUFLLENBQUNxZCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNoQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3JkLEtBQVgsRUFBa0JzZCxJQUFsQixDQUFyQjtBQUNIOztBQUhVLEtBRFo7QUFNSHJkLElBQUFBLFNBQVMsRUFBRTtBQUNQQyxNQUFBQSxNQUFNLENBQUNtZCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNqQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ25kLE1BQVgsRUFBbUJvZCxJQUFuQixDQUFyQjtBQUNIOztBQUhNLEtBTlI7QUFXSGhkLElBQUFBLFdBQVcsRUFBRTtBQUNUSSxNQUFBQSxpQkFBaUIsQ0FBQzJjLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQzVCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDM2MsaUJBQVgsRUFBOEI0YyxJQUE5QixDQUFyQjtBQUNIOztBQUhRLEtBWFY7QUFnQkgzYyxJQUFBQSxLQUFLLEVBQUU7QUFDSFUsTUFBQUEsT0FBTyxDQUFDZ2MsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNoYyxPQUFYLEVBQW9CaWMsSUFBcEIsQ0FBckI7QUFDSCxPQUhFOztBQUlIOWIsTUFBQUEsT0FBTyxDQUFDNmIsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUM3YixPQUFYLEVBQW9COGIsSUFBcEIsQ0FBckI7QUFDSCxPQU5FOztBQU9INWIsTUFBQUEsV0FBVyxDQUFDMmIsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDdEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUMzYixXQUFYLEVBQXdCNGIsSUFBeEIsQ0FBckI7QUFDSCxPQVRFOztBQVVIemMsTUFBQUEsYUFBYSxFQUFFbkIsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUVvQixRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxHQUFHLEVBQUUsQ0FBcEI7QUFBdUJDLFFBQUFBLFdBQVcsRUFBRSxDQUFwQztBQUF1Q0MsUUFBQUEsS0FBSyxFQUFFLENBQTlDO0FBQWlEQyxRQUFBQSxPQUFPLEVBQUUsQ0FBMUQ7QUFBNkRDLFFBQUFBLGNBQWMsRUFBRSxDQUE3RTtBQUFnRkMsUUFBQUEsZ0JBQWdCLEVBQUU7QUFBbEcsT0FBYjtBQVZsQyxLQWhCSjtBQTRCSFMsSUFBQUEsTUFBTSxFQUFFO0FBQ0pTLE1BQUFBLGVBQWUsQ0FBQythLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQzFCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDL2EsZUFBWCxFQUE0QmdiLElBQTVCLENBQXJCO0FBQ0gsT0FIRzs7QUFJSjdhLE1BQUFBLGFBQWEsQ0FBQzRhLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDNWEsYUFBWCxFQUEwQjZhLElBQTFCLENBQXJCO0FBQ0gsT0FORzs7QUFPSnpjLE1BQUFBLGFBQWEsRUFBRW5CLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFb0IsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsUUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCYyxRQUFBQSxTQUFTLEVBQUUsQ0FBMUM7QUFBNkNaLFFBQUFBLE9BQU8sRUFBRSxDQUF0RDtBQUF5RGEsUUFBQUEsa0JBQWtCLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLE9BQU8sRUFBRSxDQUF6RjtBQUE0RkMsUUFBQUEsZUFBZSxFQUFFLENBQTdHO0FBQWdIQyxRQUFBQSxZQUFZLEVBQUUsQ0FBOUg7QUFBaUlDLFFBQUFBLElBQUksRUFBRSxDQUFDO0FBQXhJLE9BQWI7QUFQakMsS0E1Qkw7QUFxQ0hRLElBQUFBLGNBQWMsRUFBRTtBQUNaQyxNQUFBQSxXQUFXLENBQUN5YSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN0QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3phLFdBQVgsRUFBd0IwYSxJQUF4QixDQUFyQjtBQUNILE9BSFc7O0FBSVp4YSxNQUFBQSxRQUFRLENBQUN1YSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNuQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3ZhLFFBQVgsRUFBcUJ3YSxJQUFyQixDQUFyQjtBQUNILE9BTlc7O0FBT1p0YSxNQUFBQSxjQUFjLENBQUNxYSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN6QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3JhLGNBQVgsRUFBMkJzYSxJQUEzQixDQUFyQjtBQUNILE9BVFc7O0FBVVpwYSxNQUFBQSxPQUFPLENBQUNtYSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNsQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ25hLE9BQVgsRUFBb0JvYSxJQUFwQixDQUFyQjtBQUNILE9BWlc7O0FBYVpqYixNQUFBQSxRQUFRLENBQUNnYixNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNuQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ2hiLFFBQVgsRUFBcUJpYixJQUFyQixDQUFyQjtBQUNILE9BZlc7O0FBZ0JaamEsTUFBQUEsYUFBYSxDQUFDZ2EsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDeEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNoYSxhQUFYLEVBQTBCaWEsSUFBMUIsQ0FBckI7QUFDSCxPQWxCVzs7QUFtQlovWixNQUFBQSxNQUFNLENBQUM4WixNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNqQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzlaLE1BQVgsRUFBbUIrWixJQUFuQixDQUFyQjtBQUNILE9BckJXOztBQXNCWjdaLE1BQUFBLGFBQWEsQ0FBQzRaLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDNVosYUFBWCxFQUEwQjZaLElBQTFCLENBQXJCO0FBQ0g7O0FBeEJXLEtBckNiO0FBK0RIM1osSUFBQUEsOEJBQThCLEVBQUU7QUFDNUJDLE1BQUFBLEVBQUUsQ0FBQ3laLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ2IsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN6WixFQUFYLEVBQWUwWixJQUFmLENBQXJCO0FBQ0gsT0FIMkI7O0FBSTVCelosTUFBQUEsVUFBVSxDQUFDd1osTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4WixVQUFYLEVBQXVCeVosSUFBdkIsQ0FBckI7QUFDSDs7QUFOMkIsS0EvRDdCO0FBdUVIM1ksSUFBQUEsMkJBQTJCLEVBQUU7QUFDekJFLE1BQUFBLFFBQVEsQ0FBQ3dZLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ25CLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDeFksUUFBWCxFQUFxQnlZLElBQXJCLENBQXJCO0FBQ0gsT0FId0I7O0FBSXpCcGQsTUFBQUEsTUFBTSxDQUFDbWQsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDakIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNuZCxNQUFYLEVBQW1Cb2QsSUFBbkIsQ0FBckI7QUFDSCxPQU53Qjs7QUFPekJ0YSxNQUFBQSxjQUFjLENBQUNxYSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN6QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3JhLGNBQVgsRUFBMkJzYSxJQUEzQixDQUFyQjtBQUNILE9BVHdCOztBQVV6QnhYLE1BQUFBLGFBQWEsQ0FBQ3VYLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDdlgsYUFBWCxFQUEwQndYLElBQTFCLENBQXJCO0FBQ0gsT0Fad0I7O0FBYXpCOVgsTUFBQUEsZ0JBQWdCLENBQUM2WCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMzQixlQUFPMWQsbUJBQW1CLENBQUN5ZCxNQUFNLENBQUM5WCxTQUFSLENBQTFCO0FBQ0gsT0Fmd0I7O0FBZ0J6QkcsTUFBQUEsZUFBZSxFQUFFaEcsc0JBQXNCLENBQUMsWUFBRCxFQUFlO0FBQUV5QyxRQUFBQSxJQUFJLEVBQUUsQ0FBUjtBQUFXd0QsUUFBQUEsS0FBSyxFQUFFLENBQWxCO0FBQXFCQyxRQUFBQSxLQUFLLEVBQUU7QUFBNUIsT0FBZjtBQWhCZCxLQXZFMUI7QUF5RkhRLElBQUFBLG9CQUFvQixFQUFFO0FBQ2xCQyxNQUFBQSxJQUFJLENBQUNnWCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNmLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDaFgsSUFBWCxFQUFpQmlYLElBQWpCLENBQXJCO0FBQ0gsT0FIaUI7O0FBSWxCL1csTUFBQUEsTUFBTSxDQUFDOFcsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDakIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUM5VyxNQUFYLEVBQW1CK1csSUFBbkIsQ0FBckI7QUFDSDs7QUFOaUIsS0F6Rm5CO0FBaUdIdFUsSUFBQUEsb0JBQW9CLEVBQUU7QUFDbEJDLE1BQUFBLHFCQUFxQixDQUFDb1UsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDaEMsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNwVSxxQkFBWCxFQUFrQ3FVLElBQWxDLENBQXJCO0FBQ0gsT0FIaUI7O0FBSWxCcFUsTUFBQUEsbUJBQW1CLENBQUNtVSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM5QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ25VLG1CQUFYLEVBQWdDb1UsSUFBaEMsQ0FBckI7QUFDSDs7QUFOaUIsS0FqR25CO0FBeUdIMVQsSUFBQUEsb0JBQW9CLEVBQUU7QUFDbEJDLE1BQUFBLFNBQVMsQ0FBQ3dULE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3BCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDeFQsU0FBWCxFQUFzQnlULElBQXRCLENBQXJCO0FBQ0gsT0FIaUI7O0FBSWxCeFQsTUFBQUEsU0FBUyxDQUFDdVQsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDcEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN2VCxTQUFYLEVBQXNCd1QsSUFBdEIsQ0FBckI7QUFDSCxPQU5pQjs7QUFPbEJ2VCxNQUFBQSxlQUFlLENBQUNzVCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMxQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3RULGVBQVgsRUFBNEJ1VCxJQUE1QixDQUFyQjtBQUNIOztBQVRpQixLQXpHbkI7QUFvSEhyVCxJQUFBQSxvQkFBb0IsRUFBRTtBQUNsQkcsTUFBQUEsWUFBWSxDQUFDaVQsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDdkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNqVCxZQUFYLEVBQXlCa1QsSUFBekIsQ0FBckI7QUFDSCxPQUhpQjs7QUFJbEJqVCxNQUFBQSxhQUFhLENBQUNnVCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN4QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ2hULGFBQVgsRUFBMEJpVCxJQUExQixDQUFyQjtBQUNILE9BTmlCOztBQU9sQmhULE1BQUFBLGVBQWUsQ0FBQytTLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQzFCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDL1MsZUFBWCxFQUE0QmdULElBQTVCLENBQXJCO0FBQ0gsT0FUaUI7O0FBVWxCL1MsTUFBQUEsZ0JBQWdCLENBQUM4UyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMzQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzlTLGdCQUFYLEVBQTZCK1MsSUFBN0IsQ0FBckI7QUFDSCxPQVppQjs7QUFhbEJuVCxNQUFBQSxrQkFBa0IsQ0FBQ2tULE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQzdCLGVBQU8xZCxtQkFBbUIsQ0FBQ3lkLE1BQU0sQ0FBQ25ULFdBQVIsQ0FBMUI7QUFDSDs7QUFmaUIsS0FwSG5CO0FBcUlITSxJQUFBQSxlQUFlLEVBQUU7QUFDYkMsTUFBQUEsU0FBUyxDQUFDNFMsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDcEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUM1UyxTQUFYLEVBQXNCNlMsSUFBdEIsQ0FBckI7QUFDSCxPQUhZOztBQUliNVMsTUFBQUEsU0FBUyxDQUFDMlMsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDcEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUMzUyxTQUFYLEVBQXNCNFMsSUFBdEIsQ0FBckI7QUFDSCxPQU5ZOztBQU9iM1MsTUFBQUEsaUJBQWlCLENBQUMwUyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM1QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzFTLGlCQUFYLEVBQThCMlMsSUFBOUIsQ0FBckI7QUFDSCxPQVRZOztBQVViMVMsTUFBQUEsVUFBVSxDQUFDeVMsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN6UyxVQUFYLEVBQXVCMFMsSUFBdkIsQ0FBckI7QUFDSCxPQVpZOztBQWFielMsTUFBQUEsZUFBZSxDQUFDd1MsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDMUIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4UyxlQUFYLEVBQTRCeVMsSUFBNUIsQ0FBckI7QUFDSCxPQWZZOztBQWdCYnhTLE1BQUFBLGdCQUFnQixDQUFDdVMsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDM0IsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN2UyxnQkFBWCxFQUE2QndTLElBQTdCLENBQXJCO0FBQ0gsT0FsQlk7O0FBbUJidlMsTUFBQUEsZ0JBQWdCLENBQUNzUyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMzQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3RTLGdCQUFYLEVBQTZCdVMsSUFBN0IsQ0FBckI7QUFDSCxPQXJCWTs7QUFzQmJ0UyxNQUFBQSxjQUFjLENBQUNxUyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN6QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3JTLGNBQVgsRUFBMkJzUyxJQUEzQixDQUFyQjtBQUNILE9BeEJZOztBQXlCYnJTLE1BQUFBLGNBQWMsQ0FBQ29TLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3pCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDcFMsY0FBWCxFQUEyQnFTLElBQTNCLENBQXJCO0FBQ0g7O0FBM0JZLEtBcklkO0FBa0tIMVIsSUFBQUEsZ0JBQWdCLEVBQUU7QUFDZEMsTUFBQUEsVUFBVSxDQUFDd1IsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4UixVQUFYLEVBQXVCeVIsSUFBdkIsQ0FBckI7QUFDSCxPQUhhOztBQUlkM1YsTUFBQUEsU0FBUyxDQUFDMFYsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDcEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUMxVixTQUFYLEVBQXNCMlYsSUFBdEIsQ0FBckI7QUFDSCxPQU5hOztBQU9kMVYsTUFBQUEsVUFBVSxDQUFDeVYsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN6VixVQUFYLEVBQXVCMFYsSUFBdkIsQ0FBckI7QUFDSDs7QUFUYSxLQWxLZjtBQTZLSHJRLElBQUFBLGdCQUFnQixFQUFFO0FBQ2RFLE1BQUFBLE1BQU0sQ0FBQ2tRLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ2pCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDbFEsTUFBWCxFQUFtQm1RLElBQW5CLENBQXJCO0FBQ0g7O0FBSGEsS0E3S2Y7QUFrTEhoUSxJQUFBQSxZQUFZLEVBQUU7QUFDVkksTUFBQUEsWUFBWSxDQUFDMlAsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDdkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUMzUCxZQUFYLEVBQXlCNFAsSUFBekIsQ0FBckI7QUFDSCxPQUhTOztBQUlWblQsTUFBQUEsa0JBQWtCLENBQUNrVCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM3QixlQUFPMWQsbUJBQW1CLENBQUN5ZCxNQUFNLENBQUNuVCxXQUFSLENBQTFCO0FBQ0gsT0FOUzs7QUFPVnNELE1BQUFBLGtCQUFrQixDQUFDNlAsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDN0IsZUFBTzFkLG1CQUFtQixDQUFDeWQsTUFBTSxDQUFDOVAsV0FBUixDQUExQjtBQUNIOztBQVRTLEtBbExYO0FBNkxIbUUsSUFBQUEsZUFBZSxFQUFFO0FBQ2JDLE1BQUFBLEVBQUUsQ0FBQzBMLE1BQUQsRUFBUztBQUNQLGVBQU9BLE1BQU0sQ0FBQ0UsSUFBZDtBQUNILE9BSFk7O0FBSWJ0TCxNQUFBQSxLQUFLLENBQUNvTCxNQUFELEVBQVNDLElBQVQsRUFBZUUsT0FBZixFQUF3QjtBQUN6QixZQUFJRixJQUFJLENBQUNHLElBQUwsSUFBYSxDQUFDL0wsZUFBZSxDQUFDZ00sSUFBaEIsQ0FBcUIsSUFBckIsRUFBMkJMLE1BQTNCLEVBQW1DQyxJQUFJLENBQUNHLElBQXhDLENBQWxCLEVBQWlFO0FBQzdELGlCQUFPLElBQVA7QUFDSDs7QUFDRCxlQUFPRCxPQUFPLENBQUM5QixJQUFSLENBQWFpQyxNQUFiLENBQW9CQyxVQUFwQixDQUErQlAsTUFBTSxDQUFDRSxJQUF0QyxFQUE0QyxNQUE1QyxFQUFvREQsSUFBcEQsRUFBMERFLE9BQTFELENBQVA7QUFDSCxPQVRZOztBQVViekwsTUFBQUEsVUFBVSxDQUFDc0wsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN0TCxVQUFYLEVBQXVCdUwsSUFBdkIsQ0FBckI7QUFDSCxPQVpZOztBQWFiOVgsTUFBQUEsZ0JBQWdCLENBQUM2WCxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMzQixlQUFPMWQsbUJBQW1CLENBQUN5ZCxNQUFNLENBQUM5WCxTQUFSLENBQTFCO0FBQ0g7O0FBZlksS0E3TGQ7QUE4TUgyTSxJQUFBQSxLQUFLLEVBQUU7QUFDSFAsTUFBQUEsRUFBRSxDQUFDMEwsTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDRSxJQUFkO0FBQ0gsT0FIRTs7QUFJSHZMLE1BQUFBLFVBQVUsQ0FBQ3FMLE1BQUQsRUFBU0MsSUFBVCxFQUFlRSxPQUFmLEVBQXdCO0FBQzlCLFlBQUlGLElBQUksQ0FBQ0csSUFBTCxJQUFhLENBQUN2TCxLQUFLLENBQUN3TCxJQUFOLENBQVcsSUFBWCxFQUFpQkwsTUFBakIsRUFBeUJDLElBQUksQ0FBQ0csSUFBOUIsQ0FBbEIsRUFBdUQ7QUFDbkQsaUJBQU8sSUFBUDtBQUNIOztBQUNELGVBQU9ELE9BQU8sQ0FBQzlCLElBQVIsQ0FBYW1DLGlCQUFiLENBQStCRCxVQUEvQixDQUEwQ1AsTUFBTSxDQUFDRSxJQUFqRCxFQUF1RCxNQUF2RCxFQUErREQsSUFBL0QsRUFBcUVFLE9BQXJFLENBQVA7QUFDSCxPQVRFOztBQVVIM1ksTUFBQUEsUUFBUSxDQUFDd1ksTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4WSxRQUFYLEVBQXFCeVksSUFBckIsQ0FBckI7QUFDSCxPQVpFOztBQWFIcGQsTUFBQUEsTUFBTSxDQUFDbWQsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDakIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNuZCxNQUFYLEVBQW1Cb2QsSUFBbkIsQ0FBckI7QUFDSCxPQWZFOztBQWdCSDlYLE1BQUFBLGdCQUFnQixDQUFDNlgsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDM0IsZUFBTzFkLG1CQUFtQixDQUFDeWQsTUFBTSxDQUFDOVgsU0FBUixDQUExQjtBQUNILE9BbEJFOztBQW1CSGdOLE1BQUFBLFdBQVcsRUFBRTdTLHNCQUFzQixDQUFDLFFBQUQsRUFBVztBQUFFOFMsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsUUFBUSxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxTQUFTLEVBQUUsQ0FBdEM7QUFBeUNDLFFBQUFBLE9BQU8sRUFBRTtBQUFsRCxPQUFYO0FBbkJoQyxLQTlNSjtBQW1PSHlCLElBQUFBLGtCQUFrQixFQUFFO0FBQ2hCQyxNQUFBQSxzQkFBc0IsQ0FBQ2dKLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ2pDLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDaEosc0JBQVgsRUFBbUNpSixJQUFuQyxDQUFyQjtBQUNILE9BSGU7O0FBSWhCaEosTUFBQUEsZ0JBQWdCLENBQUMrSSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUMzQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQy9JLGdCQUFYLEVBQTZCZ0osSUFBN0IsQ0FBckI7QUFDSCxPQU5lOztBQU9oQjlJLE1BQUFBLGtCQUFrQixFQUFFOVUsc0JBQXNCLENBQUMsZUFBRCxFQUFrQjtBQUFFK1UsUUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JDLFFBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsT0FBTyxFQUFFO0FBQXBDLE9BQWxCO0FBUDFCLEtBbk9qQjtBQTRPSEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkMsTUFBQUEsa0JBQWtCLENBQUN3SSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM3QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3hJLGtCQUFYLEVBQStCeUksSUFBL0IsQ0FBckI7QUFDSCxPQUhjOztBQUlmeEksTUFBQUEsTUFBTSxDQUFDdUksTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDakIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN2SSxNQUFYLEVBQW1Cd0ksSUFBbkIsQ0FBckI7QUFDSDs7QUFOYyxLQTVPaEI7QUFvUEh0SSxJQUFBQSxrQkFBa0IsRUFBRTtBQUNoQmEsTUFBQUEsUUFBUSxDQUFDd0gsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4SCxRQUFYLEVBQXFCeUgsSUFBckIsQ0FBckI7QUFDSCxPQUhlOztBQUloQnhILE1BQUFBLFFBQVEsQ0FBQ3VILE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ25CLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDdkgsUUFBWCxFQUFxQndILElBQXJCLENBQXJCO0FBQ0gsT0FOZTs7QUFPaEI1UyxNQUFBQSxTQUFTLENBQUMyUyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNwQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzNTLFNBQVgsRUFBc0I0UyxJQUF0QixDQUFyQjtBQUNILE9BVGU7O0FBVWhCcEksTUFBQUEsaUJBQWlCLEVBQUV4VixzQkFBc0IsQ0FBQyxjQUFELEVBQWlCO0FBQUV5VixRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxRQUFBQSxFQUFFLEVBQUU7QUFBbEIsT0FBakIsQ0FWekI7QUFXaEJFLE1BQUFBLG1CQUFtQixFQUFFNVYsc0JBQXNCLENBQUMsZ0JBQUQsRUFBbUI7QUFBRTZWLFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLFFBQUFBLFFBQVEsRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsS0FBSyxFQUFFO0FBQWxDLE9BQW5CO0FBWDNCLEtBcFBqQjtBQWlRSFksSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkcsTUFBQUEsY0FBYyxDQUFDNkcsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDekIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUM3RyxjQUFYLEVBQTJCOEcsSUFBM0IsQ0FBckI7QUFDSCxPQUhjOztBQUlmN0csTUFBQUEsaUJBQWlCLENBQUM0RyxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM1QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzVHLGlCQUFYLEVBQThCNkcsSUFBOUIsQ0FBckI7QUFDSCxPQU5jOztBQU9mOUksTUFBQUEsa0JBQWtCLEVBQUU5VSxzQkFBc0IsQ0FBQyxlQUFELEVBQWtCO0FBQUUrVSxRQUFBQSxTQUFTLEVBQUUsQ0FBYjtBQUFnQkMsUUFBQUEsTUFBTSxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxPQUFPLEVBQUU7QUFBcEMsT0FBbEI7QUFQM0IsS0FqUWhCO0FBMFFId0MsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZlEsTUFBQUEsWUFBWSxDQUFDMEYsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDdkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUMxRixZQUFYLEVBQXlCMkYsSUFBekIsQ0FBckI7QUFDSCxPQUhjOztBQUlmMUYsTUFBQUEsUUFBUSxDQUFDeUYsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN6RixRQUFYLEVBQXFCMEYsSUFBckIsQ0FBckI7QUFDSCxPQU5jOztBQU9mekYsTUFBQUEsUUFBUSxDQUFDd0YsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbkIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN4RixRQUFYLEVBQXFCeUYsSUFBckIsQ0FBckI7QUFDSCxPQVRjOztBQVVmakcsTUFBQUEsZ0JBQWdCLEVBQUUzWCxzQkFBc0IsQ0FBQyxhQUFELEVBQWdCO0FBQUU0WCxRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLEVBQUUsRUFBRTtBQUEvQixPQUFoQjtBQVZ6QixLQTFRaEI7QUFzUkhhLElBQUFBLFdBQVcsRUFBRTtBQUNUMUcsTUFBQUEsRUFBRSxDQUFDMEwsTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDRSxJQUFkO0FBQ0gsT0FIUTs7QUFJVHRMLE1BQUFBLEtBQUssQ0FBQ29MLE1BQUQsRUFBU0MsSUFBVCxFQUFlRSxPQUFmLEVBQXdCO0FBQ3pCLFlBQUlGLElBQUksQ0FBQ0csSUFBTCxJQUFhLENBQUNwRixXQUFXLENBQUNxRixJQUFaLENBQWlCLElBQWpCLEVBQXVCTCxNQUF2QixFQUErQkMsSUFBSSxDQUFDRyxJQUFwQyxDQUFsQixFQUE2RDtBQUN6RCxpQkFBTyxJQUFQO0FBQ0g7O0FBQ0QsZUFBT0QsT0FBTyxDQUFDOUIsSUFBUixDQUFhaUMsTUFBYixDQUFvQkMsVUFBcEIsQ0FBK0JQLE1BQU0sQ0FBQ3BFLFFBQXRDLEVBQWdELE1BQWhELEVBQXdEcUUsSUFBeEQsRUFBOERFLE9BQTlELENBQVA7QUFDSCxPQVRROztBQVVUM0QsTUFBQUEsVUFBVSxDQUFDd0QsTUFBRCxFQUFTQyxJQUFULEVBQWVFLE9BQWYsRUFBd0I7QUFDOUIsWUFBSUYsSUFBSSxDQUFDRyxJQUFMLElBQWEsQ0FBQ3BGLFdBQVcsQ0FBQ3FGLElBQVosQ0FBaUIsSUFBakIsRUFBdUJMLE1BQXZCLEVBQStCQyxJQUFJLENBQUNHLElBQXBDLENBQWxCLEVBQTZEO0FBQ3pELGlCQUFPLElBQVA7QUFDSDs7QUFDRCxlQUFPRCxPQUFPLENBQUM5QixJQUFSLENBQWFvQyxRQUFiLENBQXNCRixVQUF0QixDQUFpQ1AsTUFBTSxDQUFDOWIsTUFBeEMsRUFBZ0QsTUFBaEQsRUFBd0QrYixJQUF4RCxFQUE4REUsT0FBOUQsQ0FBUDtBQUNILE9BZlE7O0FBZ0JUekQsTUFBQUEsWUFBWSxDQUFDc0QsTUFBRCxFQUFTQyxJQUFULEVBQWVFLE9BQWYsRUFBd0I7QUFDaEMsWUFBSUYsSUFBSSxDQUFDRyxJQUFMLElBQWEsQ0FBQ3BGLFdBQVcsQ0FBQ3FGLElBQVosQ0FBaUIsSUFBakIsRUFBdUJMLE1BQXZCLEVBQStCQyxJQUFJLENBQUNHLElBQXBDLENBQWxCLEVBQTZEO0FBQ3pELGlCQUFPLElBQVA7QUFDSDs7QUFDRCxlQUFPRCxPQUFPLENBQUM5QixJQUFSLENBQWFvQyxRQUFiLENBQXNCQyxXQUF0QixDQUFrQ1YsTUFBTSxDQUFDdkQsUUFBekMsRUFBbUQsTUFBbkQsRUFBMkR3RCxJQUEzRCxFQUFpRUUsT0FBakUsQ0FBUDtBQUNILE9BckJROztBQXNCVDVaLE1BQUFBLEVBQUUsQ0FBQ3laLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ2IsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUN6WixFQUFYLEVBQWUwWixJQUFmLENBQXJCO0FBQ0gsT0F4QlE7O0FBeUJUbkUsTUFBQUEsYUFBYSxDQUFDa0UsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDeEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNsRSxhQUFYLEVBQTBCbUUsSUFBMUIsQ0FBckI7QUFDSCxPQTNCUTs7QUE0QlR6WixNQUFBQSxVQUFVLENBQUN3WixNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNyQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ3haLFVBQVgsRUFBdUJ5WixJQUF2QixDQUFyQjtBQUNILE9BOUJROztBQStCVDNDLE1BQUFBLGFBQWEsQ0FBQzBDLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDMUMsYUFBWCxFQUEwQjJDLElBQTFCLENBQXJCO0FBQ0gsT0FqQ1E7O0FBa0NUL0UsTUFBQUEsWUFBWSxFQUFFN1ksc0JBQXNCLENBQUMsU0FBRCxFQUFZO0FBQUU4WSxRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLElBQUksRUFBRSxDQUFqQztBQUFvQ0MsUUFBQUEsSUFBSSxFQUFFLENBQTFDO0FBQTZDQyxRQUFBQSxZQUFZLEVBQUUsQ0FBM0Q7QUFBOERDLFFBQUFBLFlBQVksRUFBRSxDQUE1RTtBQUErRUMsUUFBQUEsWUFBWSxFQUFFLENBQTdGO0FBQWdHQyxRQUFBQSxZQUFZLEVBQUU7QUFBOUcsT0FBWixDQWxDM0I7QUFtQ1R4RyxNQUFBQSxXQUFXLEVBQUU3UyxzQkFBc0IsQ0FBQyxRQUFELEVBQVc7QUFBRThTLFFBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWN3RyxRQUFBQSxXQUFXLEVBQUUsQ0FBM0I7QUFBOEJ2RyxRQUFBQSxRQUFRLEVBQUUsQ0FBeEM7QUFBMkNDLFFBQUFBLFNBQVMsRUFBRSxDQUF0RDtBQUF5REMsUUFBQUEsT0FBTyxFQUFFO0FBQWxFLE9BQVgsQ0FuQzFCO0FBb0NUNEcsTUFBQUEsZ0JBQWdCLEVBQUU3WixzQkFBc0IsQ0FBQyxhQUFELEVBQWdCO0FBQUU4WixRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0IvRSxRQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUNnRixRQUFBQSxRQUFRLEVBQUU7QUFBN0MsT0FBaEIsQ0FwQy9CO0FBcUNURSxNQUFBQSxlQUFlLEVBQUVsYSxzQkFBc0IsQ0FBQyxZQUFELEVBQWU7QUFBRThaLFFBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLFFBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3Qi9FLFFBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ2dGLFFBQUFBLFFBQVEsRUFBRTtBQUE3QyxPQUFmO0FBckM5QixLQXRSVjtBQTZUSHRCLElBQUFBLE9BQU8sRUFBRTtBQUNMekcsTUFBQUEsRUFBRSxDQUFDMEwsTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDRSxJQUFkO0FBQ0gsT0FISTs7QUFJTHRMLE1BQUFBLEtBQUssQ0FBQ29MLE1BQUQsRUFBU0MsSUFBVCxFQUFlRSxPQUFmLEVBQXdCO0FBQ3pCLFlBQUlGLElBQUksQ0FBQ0csSUFBTCxJQUFhLENBQUNyRixPQUFPLENBQUNzRixJQUFSLENBQWEsSUFBYixFQUFtQkwsTUFBbkIsRUFBMkJDLElBQUksQ0FBQ0csSUFBaEMsQ0FBbEIsRUFBeUQ7QUFDckQsaUJBQU8sSUFBUDtBQUNIOztBQUNELGVBQU9ELE9BQU8sQ0FBQzlCLElBQVIsQ0FBYWlDLE1BQWIsQ0FBb0JDLFVBQXBCLENBQStCUCxNQUFNLENBQUNwRSxRQUF0QyxFQUFnRCxNQUFoRCxFQUF3RHFFLElBQXhELEVBQThERSxPQUE5RCxDQUFQO0FBQ0gsT0FUSTs7QUFVTGYsTUFBQUEsZUFBZSxDQUFDWSxNQUFELEVBQVNDLElBQVQsRUFBZUUsT0FBZixFQUF3QjtBQUNuQyxZQUFJLEVBQUVILE1BQU0sQ0FBQ25CLFVBQVAsS0FBc0IsSUFBdEIsSUFBOEJtQixNQUFNLENBQUN6YyxRQUFQLEtBQW9CLENBQXBELENBQUosRUFBNEQ7QUFDeEQsaUJBQU8sSUFBUDtBQUNIOztBQUNELFlBQUkwYyxJQUFJLENBQUNHLElBQUwsSUFBYSxDQUFDckYsT0FBTyxDQUFDc0YsSUFBUixDQUFhLElBQWIsRUFBbUJMLE1BQW5CLEVBQTJCQyxJQUFJLENBQUNHLElBQWhDLENBQWxCLEVBQXlEO0FBQ3JELGlCQUFPLElBQVA7QUFDSDs7QUFDRCxlQUFPRCxPQUFPLENBQUM5QixJQUFSLENBQWF4WCxZQUFiLENBQTBCMFosVUFBMUIsQ0FBcUNQLE1BQU0sQ0FBQ0UsSUFBNUMsRUFBa0QsYUFBbEQsRUFBaUVELElBQWpFLEVBQXVFRSxPQUF2RSxDQUFQO0FBQ0gsT0FsQkk7O0FBbUJMZCxNQUFBQSxlQUFlLENBQUNXLE1BQUQsRUFBU0MsSUFBVCxFQUFlRSxPQUFmLEVBQXdCO0FBQ25DLFlBQUksRUFBRUgsTUFBTSxDQUFDemMsUUFBUCxLQUFvQixDQUF0QixDQUFKLEVBQThCO0FBQzFCLGlCQUFPLElBQVA7QUFDSDs7QUFDRCxZQUFJMGMsSUFBSSxDQUFDRyxJQUFMLElBQWEsQ0FBQ3JGLE9BQU8sQ0FBQ3NGLElBQVIsQ0FBYSxJQUFiLEVBQW1CTCxNQUFuQixFQUEyQkMsSUFBSSxDQUFDRyxJQUFoQyxDQUFsQixFQUF5RDtBQUNyRCxpQkFBTyxJQUFQO0FBQ0g7O0FBQ0QsZUFBT0QsT0FBTyxDQUFDOUIsSUFBUixDQUFheFgsWUFBYixDQUEwQjBaLFVBQTFCLENBQXFDUCxNQUFNLENBQUNFLElBQTVDLEVBQWtELFFBQWxELEVBQTRERCxJQUE1RCxFQUFrRUUsT0FBbEUsQ0FBUDtBQUNILE9BM0JJOztBQTRCTHRCLE1BQUFBLFVBQVUsQ0FBQ21CLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3JCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDbkIsVUFBWCxFQUF1Qm9CLElBQXZCLENBQXJCO0FBQ0gsT0E5Qkk7O0FBK0JMamMsTUFBQUEsT0FBTyxDQUFDZ2MsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNoYyxPQUFYLEVBQW9CaWMsSUFBcEIsQ0FBckI7QUFDSCxPQWpDSTs7QUFrQ0w5YixNQUFBQSxPQUFPLENBQUM2YixNQUFELEVBQVNDLElBQVQsRUFBZTtBQUNsQixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQzdiLE9BQVgsRUFBb0I4YixJQUFwQixDQUFyQjtBQUNILE9BcENJOztBQXFDTGhCLE1BQUFBLFVBQVUsQ0FBQ2UsTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDckIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNmLFVBQVgsRUFBdUJnQixJQUF2QixDQUFyQjtBQUNILE9BdkNJOztBQXdDTHRkLE1BQUFBLEtBQUssQ0FBQ3FkLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ2hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDcmQsS0FBWCxFQUFrQnNkLElBQWxCLENBQXJCO0FBQ0gsT0ExQ0k7O0FBMkNMbEIsTUFBQUEsaUJBQWlCLENBQUNpQixNQUFELEVBQVNDLElBQVQsRUFBZTtBQUM1QixlQUFPMWQsbUJBQW1CLENBQUN5ZCxNQUFNLENBQUNsQixVQUFSLENBQTFCO0FBQ0gsT0E3Q0k7O0FBOENMdGIsTUFBQUEsYUFBYSxFQUFFbkIsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUVtYixRQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxRQUFBQSxLQUFLLEVBQUUsQ0FBdEI7QUFBeUJDLFFBQUFBLE1BQU0sRUFBRTtBQUFqQyxPQUFiLENBOUNoQztBQStDTHhJLE1BQUFBLFdBQVcsRUFBRTdTLHNCQUFzQixDQUFDLFFBQUQsRUFBVztBQUFFOFMsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY3dJLFFBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsUUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDakMsUUFBQUEsV0FBVyxFQUFFLENBQXJEO0FBQXdEdkcsUUFBQUEsUUFBUSxFQUFFLENBQWxFO0FBQXFFQyxRQUFBQSxTQUFTLEVBQUUsQ0FBaEY7QUFBbUZDLFFBQUFBLE9BQU8sRUFBRSxDQUE1RjtBQUErRnVJLFFBQUFBLFVBQVUsRUFBRTtBQUEzRyxPQUFYO0FBL0M5QixLQTdUTjtBQThXSHlCLElBQUFBLE9BQU8sRUFBRTtBQUNMaEwsTUFBQUEsRUFBRSxDQUFDMEwsTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDRSxJQUFkO0FBQ0gsT0FISTs7QUFJTFIsTUFBQUEsV0FBVyxDQUFDTSxNQUFELEVBQVNDLElBQVQsRUFBZTtBQUN0QixlQUFPbmUsY0FBYyxDQUFDLENBQUQsRUFBSWtlLE1BQU0sQ0FBQ04sV0FBWCxFQUF3Qk8sSUFBeEIsQ0FBckI7QUFDSCxPQU5JOztBQU9MTixNQUFBQSxhQUFhLENBQUNLLE1BQUQsRUFBU0MsSUFBVCxFQUFlO0FBQ3hCLGVBQU9uZSxjQUFjLENBQUMsQ0FBRCxFQUFJa2UsTUFBTSxDQUFDTCxhQUFYLEVBQTBCTSxJQUExQixDQUFyQjtBQUNILE9BVEk7O0FBVUxMLE1BQUFBLE9BQU8sQ0FBQ0ksTUFBRCxFQUFTQyxJQUFULEVBQWU7QUFDbEIsZUFBT25lLGNBQWMsQ0FBQyxDQUFELEVBQUlrZSxNQUFNLENBQUNKLE9BQVgsRUFBb0JLLElBQXBCLENBQXJCO0FBQ0gsT0FaSTs7QUFhTFQsTUFBQUEsYUFBYSxFQUFFbmQsc0JBQXNCLENBQUMsVUFBRCxFQUFhO0FBQUU4WixRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0IvRSxRQUFBQSxNQUFNLEVBQUU7QUFBaEMsT0FBYjtBQWJoQyxLQTlXTjtBQTZYSHNKLElBQUFBLEtBQUssRUFBRTtBQUNISCxNQUFBQSxpQkFBaUIsRUFBRW5DLElBQUksQ0FBQ21DLGlCQUFMLENBQXVCSSxhQUF2QixFQURoQjtBQUVITixNQUFBQSxNQUFNLEVBQUVqQyxJQUFJLENBQUNpQyxNQUFMLENBQVlNLGFBQVosRUFGTDtBQUdIL1osTUFBQUEsWUFBWSxFQUFFd1gsSUFBSSxDQUFDeFgsWUFBTCxDQUFrQitaLGFBQWxCLEVBSFg7QUFJSEgsTUFBQUEsUUFBUSxFQUFFcEMsSUFBSSxDQUFDb0MsUUFBTCxDQUFjRyxhQUFkLEVBSlA7QUFLSEMsTUFBQUEsUUFBUSxFQUFFeEMsSUFBSSxDQUFDd0MsUUFBTCxDQUFjRCxhQUFkO0FBTFAsS0E3WEo7QUFvWUhFLElBQUFBLFlBQVksRUFBRTtBQUNWTixNQUFBQSxpQkFBaUIsRUFBRW5DLElBQUksQ0FBQ21DLGlCQUFMLENBQXVCTyxvQkFBdkIsRUFEVDtBQUVWVCxNQUFBQSxNQUFNLEVBQUVqQyxJQUFJLENBQUNpQyxNQUFMLENBQVlTLG9CQUFaLEVBRkU7QUFHVmxhLE1BQUFBLFlBQVksRUFBRXdYLElBQUksQ0FBQ3hYLFlBQUwsQ0FBa0JrYSxvQkFBbEIsRUFISjtBQUlWTixNQUFBQSxRQUFRLEVBQUVwQyxJQUFJLENBQUNvQyxRQUFMLENBQWNNLG9CQUFkLEVBSkE7QUFLVkYsTUFBQUEsUUFBUSxFQUFFeEMsSUFBSSxDQUFDd0MsUUFBTCxDQUFjRSxvQkFBZDtBQUxBO0FBcFlYLEdBQVA7QUE0WUg7O0FBRUQsTUFBTUMsWUFBWSxHQUFHLElBQUlDLEdBQUosRUFBckI7QUFDQUQsWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNCQUFqQixFQUF5QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2QkFBakIsRUFBZ0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMEJBQWpCLEVBQTZDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlCQUFqQixFQUE0QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUJBQWpCLEVBQTRDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQ0FBakIsRUFBcUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOEJBQWpCLEVBQWlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLFdBQWpCLEVBQThCO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUI7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixtQkFBakIsRUFBc0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUF0QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0JBQWpCLEVBQXVDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBdkM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQkFBakIsRUFBOEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsY0FBakIsRUFBaUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMEJBQWpCLEVBQTZDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDBCQUFqQixFQUE2QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTdDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2QkFBakIsRUFBZ0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdCQUFqQixFQUEyQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTNDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3QkFBakIsRUFBMkM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkJBQWpCLEVBQThDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJCQUFqQixFQUE4QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0QkFBakIsRUFBK0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEvQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNEJBQWpCLEVBQStDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBL0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLCtCQUFqQixFQUFrRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWxEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZCQUFqQixFQUFnRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlDQUFqQixFQUFvRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9DQUFqQixFQUF1RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQkFBakIsRUFBbUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFCQUFqQixFQUF3QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQXhDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQkFBakIsRUFBdUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUF2QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUJBQWpCLEVBQXNDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBdEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9CQUFqQixFQUF1QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQkFBakIsRUFBb0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUJBQWpCLEVBQXdDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlCQUFqQixFQUE0QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2QkFBakIsRUFBZ0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtDQUFqQixFQUFxRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0QkFBakIsRUFBK0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUEvQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQ0FBakIsRUFBcUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFyRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaURBQWpCLEVBQW9FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhDQUFqQixFQUFpRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQWpFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQkFBakIsRUFBOEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUE5QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0QkFBakIsRUFBK0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUEvQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0RBQWpCLEVBQW1FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQkFBakIsRUFBNkM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUE3QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0RBQWpCLEVBQW1FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0QkFBakIsRUFBK0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEvQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG1DQUFqQixFQUFzRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXREO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixtQ0FBakIsRUFBc0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF0RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4Q0FBakIsRUFBaUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFqRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9DQUFqQixFQUF1RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLCtDQUFqQixFQUFrRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQWxFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQkFBakIsRUFBcUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUJBQWpCLEVBQXNDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZCQUFqQixFQUFnRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0RBQWpCLEVBQW1FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBbkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkNBQWpCLEVBQWdFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdEQUFqQixFQUEyRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlEQUFqQixFQUFvRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseURBQWpCLEVBQTRFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBNUU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4Q0FBakIsRUFBaUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkNBQWpCLEVBQWdFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdEQUFqQixFQUEyRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlEQUFqQixFQUFvRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseURBQWpCLEVBQTRFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBNUU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4Q0FBakIsRUFBaUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixtQ0FBakIsRUFBc0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF0RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9DQUFqQixFQUF1RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUNBQWpCLEVBQTBEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG1EQUFqQixFQUFzRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXRFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQ0FBakIsRUFBa0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFsRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOERBQWpCLEVBQWlGO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakY7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJEQUFqQixFQUE4RTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTlFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQkFBakIsRUFBb0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUJBQWpCLEVBQTRDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhCQUFqQixFQUFpRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUJBQWpCLEVBQTRDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhCQUFqQixFQUFpRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUNBQWpCLEVBQXNEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG1DQUFqQixFQUFzRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXREO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsa0NBQWpCLEVBQXFEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBckQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQ0FBakIsRUFBa0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0Q0FBakIsRUFBK0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEvRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNENBQWpCLEVBQStEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBL0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLCtDQUFqQixFQUFrRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQWxFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQ0FBakIsRUFBa0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFsRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkNBQWpCLEVBQWdFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBaEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0NBQWpCLEVBQTJEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNEQUFqQixFQUF5RTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1REFBakIsRUFBMEU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbURBQWpCLEVBQXNFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRDQUFqQixFQUErRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQS9EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaURBQWpCLEVBQW9FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBcEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdFQUFqQixFQUFtRjtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5GO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2REFBakIsRUFBZ0Y7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFoRjtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0RBQWpCLEVBQW1FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBbkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLCtEQUFqQixFQUFrRjtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWxGO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0REFBakIsRUFBK0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUEvRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUNBQWpCLEVBQTBEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0RBQWpCLEVBQW1FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDZDQUFqQixFQUFnRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQWhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdEQUFqQixFQUFtRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5FO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbURBQWpCLEVBQXNFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtEQUFqQixFQUFxRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyREFBakIsRUFBOEU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUE5RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlEQUFqQixFQUFvRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvREFBakIsRUFBdUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbURBQWpCLEVBQXNFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDREQUFqQixFQUErRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQS9FO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4Q0FBakIsRUFBaUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFqRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaURBQWpCLEVBQW9FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtEQUFqQixFQUFxRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQkFBakIsRUFBOEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUJBQWpCLEVBQTRDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlCQUFqQixFQUE0QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5QkFBakIsRUFBNEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUJBQWpCLEVBQTRDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlCQUFqQixFQUE0QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0NBQWpCLEVBQTJEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtDQUFqQixFQUFxRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaUNBQWpCLEVBQW9EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5QkFBakIsRUFBNEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMEJBQWpCLEVBQTZDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVEQUFqQixFQUEwRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1REFBakIsRUFBMEU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaURBQWpCLEVBQW9FO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG1EQUFqQixFQUFzRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXRFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzREFBakIsRUFBeUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0RBQWpCLEVBQXlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtEQUFqQixFQUFxRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixtREFBakIsRUFBc0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF0RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseURBQWpCLEVBQTRFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlEQUFqQixFQUE0RTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixtREFBakIsRUFBc0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF0RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscURBQWpCLEVBQXdFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdEQUFqQixFQUEyRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTNFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3REFBakIsRUFBMkU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0RBQWpCLEVBQXVFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFEQUFqQixFQUF3RTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0NBQWpCLEVBQTJEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlDQUFqQixFQUFvRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQXBEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhDQUFqQixFQUFpRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWpFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4Q0FBakIsRUFBaUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsa0NBQWpCLEVBQXFEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBckQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsa0NBQWpCLEVBQXFEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBckQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0NBQWpCLEVBQTJEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRDQUFqQixFQUErRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQS9EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlEQUFqQixFQUFvRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpREFBakIsRUFBb0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDBDQUFqQixFQUE2RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTdEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRDQUFqQixFQUErRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQS9EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRDQUFqQixFQUErRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQS9EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2Q0FBakIsRUFBZ0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhDQUFqQixFQUFpRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWpFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2Q0FBakIsRUFBZ0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOENBQWpCLEVBQWlFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDhDQUFqQixFQUFpRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWpFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9DQUFqQixFQUF1RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQ0FBakIsRUFBd0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF4RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9DQUFqQixFQUF1RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnREFBakIsRUFBbUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFuRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtEQUFqQixFQUFxRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvREFBakIsRUFBdUU7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0NBQWpCLEVBQWtFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQ0FBakIsRUFBOEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsa0RBQWpCLEVBQXFFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBckU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLCtDQUFqQixFQUFrRTtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWxFO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRDQUFqQixFQUErRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQS9EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkNBQWpCLEVBQWdFO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBaEU7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDBCQUFqQixFQUE2QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTdDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUNBQWpCLEVBQTBEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDBDQUFqQixFQUE2RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTdEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1Q0FBakIsRUFBMEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQ0FBakIsRUFBbUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUNBQWpCLEVBQTBEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDBDQUFqQixFQUE2RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTdEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIseUNBQWpCLEVBQTREO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBNUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsc0NBQWpCLEVBQXlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBekQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQkFBakIsRUFBcUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFyQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsWUFBakIsRUFBK0I7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUEvQjtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaUJBQWpCLEVBQW9DO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVCQUFqQixFQUEwQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQkFBakIsRUFBOEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkJBQWpCLEVBQThDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlCQUFqQixFQUFvQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4QkFBakIsRUFBaUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNEJBQWpCLEVBQStDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBL0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5QkFBakIsRUFBNEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUJBQWpCLEVBQXdDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVCQUFqQixFQUEwQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTFDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5QkFBakIsRUFBNEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUE1QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0NBQWpCLEVBQTJEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFDQUFqQixFQUF3RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQXhEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1QkFBakIsRUFBMEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUJBQWpCLEVBQTBDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJCQUFqQixFQUE4QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQTlDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw2Q0FBakIsRUFBZ0U7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFoRTtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUNBQWpCLEVBQTBEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBMUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw0QkFBakIsRUFBK0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUEvQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkNBQWpCLEVBQThEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4QkFBakIsRUFBaUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFqRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHdDQUFqQixFQUEyRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQTNEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0JBQWpCLEVBQWtEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMkJBQWpCLEVBQThDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBOUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGdDQUFqQixFQUFtRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQW5EO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwrQkFBakIsRUFBa0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0JBQWpCLEVBQWtEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwwQ0FBakIsRUFBNkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE3RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQWdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBaEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJCQUFqQixFQUE4QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQTlDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4QkFBakIsRUFBaUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFqRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0NBQWpCLEVBQXVEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBdkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHVDQUFqQixFQUEwRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQTFEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0NBQWpCLEVBQW1EO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGlDQUFqQixFQUFvRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXBEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQ0FBakIsRUFBcUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUNBQWpCLEVBQXdEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtDQUFqQixFQUFxRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQ0FBakIsRUFBeUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsMENBQWpCLEVBQTZEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBN0Q7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHlDQUFqQixFQUE0RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTVEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQ0FBakIsRUFBdUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUNBQWpCLEVBQXNEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtDQUFqQixFQUFxRDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQXJEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiw4QkFBakIsRUFBaUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFqRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOEJBQWpCLEVBQWlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBakQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNCQUFqQixFQUF5QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQXpDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3QkFBakIsRUFBMkM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUEzQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaUJBQWpCLEVBQW9DO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBcEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix5Q0FBakIsRUFBNEQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE1RDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUNBQWpCLEVBQXNEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNDQUFqQixFQUF5RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQ0FBakIsRUFBcUQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0JBQWpCLEVBQTJDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBM0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9CQUFqQixFQUF1QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQkFBakIsRUFBcUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsNEJBQWpCLEVBQStDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBL0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJDQUFqQixFQUE4RDtBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlEO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix3Q0FBakIsRUFBMkQ7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUEzRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsYUFBakIsRUFBZ0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsbUJBQWpCLEVBQXNDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGVBQWpCLEVBQWtDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9CQUFqQixFQUF1QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQkFBakIsRUFBeUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF6QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0JBQWpCLEVBQXVDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGVBQWpCLEVBQWtDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9CQUFqQixFQUF1QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixrQkFBakIsRUFBcUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFyQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUJBQWpCLEVBQTBDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDJCQUFqQixFQUE4QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQTlDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQiwyQkFBakIsRUFBOEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUE5QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIscUJBQWpCLEVBQXdDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBeEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFCQUFqQixFQUF3QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1QkFBakIsRUFBMEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFNBQVI7QUFBbUJDLEVBQUFBLElBQUksRUFBRTtBQUF6QixDQUExQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsa0JBQWpCLEVBQXFDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBckM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixxQkFBakIsRUFBd0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUF4QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsaUJBQWpCLEVBQW9DO0FBQUVDLEVBQUFBLElBQUksRUFBRSxTQUFSO0FBQW1CQyxFQUFBQSxJQUFJLEVBQUU7QUFBekIsQ0FBcEM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQkFBakIsRUFBbUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUFuQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsK0JBQWpCLEVBQWtEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbEQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLDRCQUFqQixFQUErQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQS9DO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixnQkFBakIsRUFBbUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFuQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsY0FBakIsRUFBaUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFqQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsYUFBakIsRUFBZ0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFoQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsdUJBQWpCLEVBQTBDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBMUM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLG9CQUFqQixFQUF1QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXZDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixzQkFBakIsRUFBeUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFVBQVI7QUFBb0JDLEVBQUFBLElBQUksRUFBRTtBQUExQixDQUF6QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsd0JBQWpCLEVBQTJDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBM0M7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsVUFBUjtBQUFvQkMsRUFBQUEsSUFBSSxFQUFFO0FBQTFCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixpQ0FBakIsRUFBb0Q7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFwRDtBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsOEJBQWpCLEVBQWlEO0FBQUVDLEVBQUFBLElBQUksRUFBRSxVQUFSO0FBQW9CQyxFQUFBQSxJQUFJLEVBQUU7QUFBMUIsQ0FBakQ7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHNCQUFqQixFQUF5QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXpDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixlQUFqQixFQUFrQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQWxDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixlQUFqQixFQUFrQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsU0FBUjtBQUFtQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXpCLENBQWxDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixlQUFqQixFQUFrQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQWxDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQixvQkFBakIsRUFBdUM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUF2QztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZUFBakIsRUFBa0M7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUFsQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsb0JBQWpCLEVBQXVDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBdkM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGtCQUFqQixFQUFxQztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXJDO0FBQ0FKLFlBQVksQ0FBQ0UsR0FBYixDQUFpQix1QkFBakIsRUFBMEM7QUFBRUMsRUFBQUEsSUFBSSxFQUFFLFFBQVI7QUFBa0JDLEVBQUFBLElBQUksRUFBRTtBQUF4QixDQUExQztBQUNBSixZQUFZLENBQUNFLEdBQWIsQ0FBaUIsZ0JBQWpCLEVBQW1DO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBbkM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDO0FBQUVDLEVBQUFBLElBQUksRUFBRSxRQUFSO0FBQWtCQyxFQUFBQSxJQUFJLEVBQUU7QUFBeEIsQ0FBakM7QUFDQUosWUFBWSxDQUFDRSxHQUFiLENBQWlCLHFCQUFqQixFQUF3QztBQUFFQyxFQUFBQSxJQUFJLEVBQUUsUUFBUjtBQUFrQkMsRUFBQUEsSUFBSSxFQUFFO0FBQXhCLENBQXhDO0FBQ0FDLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNiTixFQUFBQSxZQURhO0FBRWJqQixFQUFBQSxlQUZhO0FBR2J0ZCxFQUFBQSxhQUhhO0FBSWJHLEVBQUFBLFNBSmE7QUFLYkssRUFBQUEsV0FMYTtBQU1iSyxFQUFBQSxLQU5hO0FBT2JrQixFQUFBQSxNQVBhO0FBUWJjLEVBQUFBLGNBUmE7QUFTYmdCLEVBQUFBLDhCQVRhO0FBVWJLLEVBQUFBLGtCQVZhO0FBV2JNLEVBQUFBLGdCQVhhO0FBWWJLLEVBQUFBLDJCQVphO0FBYWJxQixFQUFBQSxzQkFiYTtBQWNiSSxFQUFBQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFmYTtBQWdCYkksRUFBQUEsbUJBaEJhO0FBaUJiRyxFQUFBQSxtQkFqQmE7QUFrQmJDLEVBQUFBLG1CQWxCYTtBQW1CYkcsRUFBQUEsbUJBbkJhO0FBb0JiUyxFQUFBQSxvQkFwQmE7QUFxQmJHLEVBQUFBLG9CQXJCYTtBQXNCYmdCLEVBQUFBLG9CQXRCYTtBQXVCYkcsRUFBQUEsb0JBdkJhO0FBd0JiSyxFQUFBQSxvQkF4QmE7QUF5QmJJLEVBQUFBLG9CQXpCYTtBQTBCYkssRUFBQUEsb0JBMUJhO0FBMkJiTyxFQUFBQSxlQTNCYTtBQTRCYlUsRUFBQUEsZ0JBNUJhO0FBNkJiSSxFQUFBQSxjQTdCYTtBQThCYkMsRUFBQUEsa0JBOUJhO0FBK0JiQyxFQUFBQSxXQS9CYTtBQWdDYkksRUFBQUEsZ0JBaENhO0FBaUNiSyxFQUFBQSxvQkFqQ2E7QUFrQ2JNLEVBQUFBLG9CQWxDYTtBQW1DYlUsRUFBQUEsZ0JBbkNhO0FBb0NiSyxFQUFBQSxZQXBDYTtBQXFDYk0sRUFBQUEsb0JBckNhO0FBc0NiWSxFQUFBQSxpQkF0Q2E7QUF1Q2JxQyxFQUFBQSxXQXZDYTtBQXdDYlcsRUFBQUEseUJBeENhO0FBeUNiRSxFQUFBQSxlQXpDYTtBQTBDYlEsRUFBQUEsS0ExQ2E7QUEyQ2JrQyxFQUFBQSxrQkEzQ2E7QUE0Q2JRLEVBQUFBLGlCQTVDYTtBQTZDYkksRUFBQUEsa0JBN0NhO0FBOENicUIsRUFBQUEsaUJBOUNhO0FBK0NiYyxFQUFBQSxpQkEvQ2E7QUFnRGJXLEVBQUFBLG9CQWhEYTtBQWlEYk8sRUFBQUEsV0FqRGE7QUFrRGJELEVBQUFBLE9BbERhO0FBbURidUUsRUFBQUE7QUFuRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBzdHJpbmdDb21wYW5pb24sXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbiAgICB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcsXG4gICAgdW5peFNlY29uZHNUb1N0cmluZyxcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG4gICAgbXNnX2Vudl9oYXNoOiBzY2FsYXIsXG4gICAgbmV4dF93b3JrY2hhaW46IHNjYWxhcixcbiAgICBuZXh0X2FkZHJfcGZ4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheSgoKSA9PiBPdGhlckN1cnJlbmN5KTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fdXRpbWVfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ2dlbl91dGltZScpLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXAgPSBzdHJ1Y3Qoe1xuICAgIG1pbl90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWF4X3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtaW5fd2luczogc2NhbGFyLFxuICAgIG1heF9sb3NzZXM6IHNjYWxhcixcbiAgICBtaW5fc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgbWF4X3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMSA9IHN0cnVjdCh7XG4gICAgbm9ybWFsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBjcml0aWNhbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBiaWdVSW50MixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogYmlnVUludDIsXG4gICAgbWF4X3N0YWtlOiBiaWdVSW50MixcbiAgICBtaW5fdG90YWxfc3Rha2U6IGJpZ1VJbnQyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV9zaW5jZV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbigndXRpbWVfc2luY2UnKSxcbiAgICBiaXRfcHJpY2VfcHM6IGJpZ1VJbnQxLFxuICAgIGNlbGxfcHJpY2VfcHM6IGJpZ1VJbnQxLFxuICAgIG1jX2JpdF9wcmljZV9wczogYmlnVUludDEsXG4gICAgbWNfY2VsbF9wcmljZV9wczogYmlnVUludDEsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IGJpZ1VJbnQxLFxuICAgIGJsb2NrX2dhc19saW1pdDogYmlnVUludDEsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogYmlnVUludDEsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogYmlnVUludDEsXG4gICAgZmxhdF9nYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IGJpZ1VJbnQxLFxuICAgIGJpdF9wcmljZTogYmlnVUludDEsXG4gICAgY2VsbF9wcmljZTogYmlnVUludDEsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgc2h1ZmZsZV9tY192YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICBuZXdfY2F0Y2hhaW5faWRzOiBzY2FsYXIsXG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogYmlnVUludDEsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoKCkgPT4gVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfc2luY2Vfc3RyaW5nOiBzdHJpbmdDb21wYW5pb24oJ3V0aW1lX3NpbmNlJyksXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbF9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbigndXRpbWVfdW50aWwnKSxcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogYmlnVUludDEsXG4gICAgbGlzdDogVmFsaWRhdG9yU2V0TGlzdEFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDE4KTtcbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AzOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgcDA6IHNjYWxhcixcbiAgICBwMTogc2NhbGFyLFxuICAgIHAyOiBzY2FsYXIsXG4gICAgcDM6IHNjYWxhcixcbiAgICBwNDogc2NhbGFyLFxuICAgIHA2OiBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIHA3OiBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXksXG4gICAgcDg6IEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgcDk6IEZsb2F0QXJyYXksXG4gICAgcDEwOiBGbG9hdEFycmF5LFxuICAgIHAxMTogQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWluX3NoYXJkX2dlbl91dGltZV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignbWluX3NoYXJkX2dlbl91dGltZScpLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lX3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCdtYXhfc2hhcmRfZ2VuX3V0aW1lJyksXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lX3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCdnZW5fdXRpbWUnKSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGNhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgc2lnX3dlaWdodDogYmlnVUludDEsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxuICAgIGJsb2NrOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3MnLCAoKSA9PiBCbG9jayksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KCgpID0+IEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl91dGltZV9zdHJpbmc6IHN0cmluZ0NvbXBhbmlvbignZ2VuX3V0aW1lJyksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYnk6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBrZXlfYmxvY2s6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsICgpID0+IEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoKCkgPT4gTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxuICAgIGJhbGFuY2VfZGVsdGE6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2VfZGVsdGFfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJsb2NrOiBqb2luKCdibG9ja19pZCcsICdpZCcsICdibG9ja3MnLCAoKSA9PiBCbG9jayksXG4gICAgYm9keTogc2NhbGFyLFxuICAgIGJvZHlfaGFzaDogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgY29kZV9oYXNoOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGRhdGFfaGFzaDogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBsaWJyYXJ5X2hhc2g6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0X3N0cmluZzogc3RyaW5nQ29tcGFuaW9uKCdjcmVhdGVkX2F0JyksXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBzdGF0ZV9oYXNoOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRhdGEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF9hZGRyX3BmeChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfYWRkcl9wZngsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbl91dGltZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50Lmdlbl91dGltZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0OiB7XG4gICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tYXN0ZXJjaGFpbl9ibG9ja19mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYXNlY2hhaW5fYmxvY2tfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3OiB7XG4gICAgICAgICAgICBtaW5fc3Rha2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW5fc3Rha2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1heF9zdGFrZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1heF9zdGFrZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWluX3RvdGFsX3N0YWtlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4OiB7XG4gICAgICAgICAgICBiaXRfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5iaXRfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNlbGxfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jZWxsX3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtY19iaXRfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5tY19iaXRfcHJpY2VfcHMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5tY19jZWxsX3ByaWNlX3BzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1dGltZV9zaW5jZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuaXhTZWNvbmRzVG9TdHJpbmcocGFyZW50LnV0aW1lX3NpbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEdhc0xpbWl0c1ByaWNlczoge1xuICAgICAgICAgICAgZ2FzX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwZWNpYWxfZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3BlY2lhbF9nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19jcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9ja19nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5ibG9ja19nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyZWV6ZV9kdWVfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mcmVlemVfZHVlX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZWxldGVfZHVlX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZGVsZXRlX2R1ZV9saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmxhdF9nYXNfcHJpY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5mbGF0X2dhc19wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dGb3J3YXJkUHJpY2VzOiB7XG4gICAgICAgICAgICBsdW1wX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHVtcF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYml0X3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuYml0X3ByaWNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjZWxsX3ByaWNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY2VsbF9wcmljZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXRMaXN0OiB7XG4gICAgICAgICAgICB3ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC53ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0OiB7XG4gICAgICAgICAgICB0b3RhbF93ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50b3RhbF93ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3NpbmNlX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQudXRpbWVfc2luY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3VudGlsX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5peFNlY29uZHNUb1N0cmluZyhwYXJlbnQudXRpbWVfdW50aWwpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhQmxvY2tTaWduYXR1cmVzLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScsIGFyZ3MsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ193ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zaWdfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5fdXRpbWVfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC5nZW5fdXRpbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIUJsb2NrLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLmJsb2Nrc19zaWduYXR1cmVzLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdfa2V5JywgYXJncywgY29udGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5fdXRpbWVfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC5nZW5fdXRpbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhVHJhbnNhY3Rpb24udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEuYmxvY2tzLndhaXRGb3JEb2MocGFyZW50LmJsb2NrX2lkLCAnX2tleScsIGFyZ3MsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhVHJhbnNhY3Rpb24udGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEubWVzc2FnZXMud2FpdEZvckRvYyhwYXJlbnQuaW5fbXNnLCAnX2tleScsIGFyZ3MsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFUcmFuc2FjdGlvbi50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5JywgYXJncywgY29udGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlX2RlbHRhKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZV9kZWx0YSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mud2hlbiAmJiAhTWVzc2FnZS50ZXN0KG51bGwsIHBhcmVudCwgYXJncy53aGVuKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGF0YS5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuYmxvY2tfaWQsICdfa2V5JywgYXJncywgY29udGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIGlmICghKHBhcmVudC5jcmVhdGVkX2x0ICE9PSAnMDAnICYmIHBhcmVudC5tc2dfdHlwZSAhPT0gMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhcmdzLndoZW4gJiYgIU1lc3NhZ2UudGVzdChudWxsLCBwYXJlbnQsIGFyZ3Mud2hlbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRhdGEudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScsIGFyZ3MsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIShwYXJlbnQubXNnX3R5cGUgIT09IDIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYXJncy53aGVuICYmICFNZXNzYWdlLnRlc3QobnVsbCwgcGFyZW50LCBhcmdzLndoZW4pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYXRhLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnaW5fbXNnJywgYXJncywgY29udGV4dCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfYXRfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bml4U2Vjb25kc1RvU3RyaW5nKHBhcmVudC5jcmVhdGVkX2F0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYXRhLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGF0YS5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYXRhLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGF0YS5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGF0YS5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRhdGEuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGF0YS5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGF0YS50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYXRhLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGF0YS5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNpZ193ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnNpZ193ZWlnaHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5ub2RlX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLm5vZGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nbG9iYWxfaWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdsb2JhbF9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLndhbnRfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hZnRlcl9tZXJnZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFmdGVyX21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX2NhdGNoYWluX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5nZW5fY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlcl9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXJfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X2FsdF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfYWx0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5iZWZvcmVfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFmdGVyX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWZ0ZXJfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndhbnRfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52ZXJ0X3NlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVydF9zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXJ0X2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5zdGFydF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1pbl9yZWZfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfa2V5X2Jsb2NrX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X2tleV9ibG9ja19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3NvZnR3YXJlX3ZlcnNpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl9zb2Z0d2FyZV92ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LnRvX25leHRfYmxrJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5leHBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5pbXBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsaycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0udHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5yYW5kX3NlZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnJhbmRfc2VlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuY3JlYXRlZF9ieScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY3JlYXRlZF9ieScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2NyZWF0ZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmluX21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zaXRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2RlbGl2ZXJlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQudHJhbnNpdF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydF9ibG9ja19sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRfYmxvY2tfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IubXNnX2Vudl9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm1zZ19lbnZfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X3dvcmtjaGFpbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5uZXh0X3dvcmtjaGFpbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X2FkZHJfcGZ4JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm5leHRfYWRkcl9wZngnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0uYWNjb3VudF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMubHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0ubHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMudG90YWxfZmVlc19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzX290aGVyWyoqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0udG90YWxfZmVlc19vdGhlclsqKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy5vbGRfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0ub2xkX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLm5ld19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5uZXdfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJfY291bnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyX2NvdW50JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy50cl9jb3VudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudHJfY291bnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXcnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5uZXcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUub2xkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnJlZ19tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5yZWdfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iuc3RhcnRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc3RhcnRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iud2FudF9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci53YW50X21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm54X2NjX3VwZGF0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm54X2NjX3VwZGF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmxhZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubWluX3JlZl9tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnNwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLnNwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mdW5kc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLnNoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uY3JlYXRlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmNyZWF0ZV9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfZmVlc1sqXS5jcmVhdGVfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnByb29mX2RlbGl2ZXJlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ubm9kZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZ19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDAnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDAnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcudmFsdWUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDgudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnA4LmNhcGFiaWxpdGllcycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC5jYXBhYmlsaXRpZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDknLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDlbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMFsqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfbG9zc2VzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9sb3NzZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9zdG9yZV9zZWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5iaXRfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3RvdF9yb3VuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3dpbnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9sb3NzZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfbG9zc2VzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl9zdG9yZV9zZWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuZW5hYmxlZF9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uZW5hYmxlZF9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYWN0dWFsX21pbl9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWN0dWFsX21pbl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hY3RpdmUnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY3RpdmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFjY2VwdF9tc2dzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWNjZXB0X21zZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX3Jvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX3Jvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX2ZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX2ZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYmFzaWMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5iYXNpYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fdmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fdmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fbW9kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fbW9kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX2FkZHJfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fYWRkcl9sZW4nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9hZGRyX2xlbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X2FkZHJfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hZGRyX2xlbl9zdGVwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hZGRyX2xlbl9zdGVwJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5fdHlwZV9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ud29ya2NoYWluX3R5cGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE0Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNC5tYXN0ZXJjaGFpbl9ibG9ja19mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE0LmJhc2VjaGFpbl9ibG9ja19mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTQuYmFzZWNoYWluX2Jsb2NrX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUudmFsaWRhdG9yc19lbGVjdGVkX2ZvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUudmFsaWRhdG9yc19lbGVjdGVkX2ZvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX2VuZF9iZWZvcmUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE1LmVsZWN0aW9uc19lbmRfYmVmb3JlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5zdGFrZV9oZWxkX2ZvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuc3Rha2VfaGVsZF9mb3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE2Lm1heF92YWxpZGF0b3JzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWF4X21haW5fdmFsaWRhdG9ycycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTYubWF4X21haW5fdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWluX3ZhbGlkYXRvcnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE2Lm1pbl92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWluX3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWF4X3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fdG90YWxfc3Rha2UnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWluX3RvdGFsX3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2VfZmFjdG9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2VfZmFjdG9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0udXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LmJpdF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0uYml0X3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5jZWxsX3ByaWNlX3BzJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5jZWxsX3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5tY19iaXRfcHJpY2VfcHMnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE4WypdLm1jX2JpdF9wcmljZV9wcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTgubWNfY2VsbF9wcmljZV9wcycsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0ubWNfY2VsbF9wcmljZV9wcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmdhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5zcGVjaWFsX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuc3BlY2lhbF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmdhc19jcmVkaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmJsb2NrX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuYmxvY2tfZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5mcmVlemVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mcmVlemVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5kZWxldGVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5kZWxldGVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZmxhdF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmdhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5zcGVjaWFsX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuc3BlY2lhbF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmdhc19jcmVkaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmJsb2NrX2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuYmxvY2tfZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5mcmVlemVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mcmVlemVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5kZWxldGVfZHVlX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5kZWxldGVfZHVlX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19saW1pdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZmxhdF9nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMudW5kZXJsb2FkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5ieXRlcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnNvZnRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmdhcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmdhcy5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5nYXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmx0X2RlbHRhLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMudW5kZXJsb2FkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5ieXRlcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnNvZnRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmdhcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy51bmRlcmxvYWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmdhcy5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5nYXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLmhhcmRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmx0X2RlbHRhLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQubHVtcF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQubHVtcF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuYml0X3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5iaXRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0LmNlbGxfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmNlbGxfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0Lmlocl9wcmljZV9mYWN0b3InLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0Lmlocl9wcmljZV9mYWN0b3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0LmZpcnN0X2ZyYWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmZpcnN0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI0Lm5leHRfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQubmV4dF9mcmFjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5sdW1wX3ByaWNlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5sdW1wX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5iaXRfcHJpY2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1LmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuY2VsbF9wcmljZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuaWhyX3ByaWNlX2ZhY3RvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuaWhyX3ByaWNlX2ZhY3RvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUuZmlyc3RfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuZmlyc3RfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjUubmV4dF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5uZXh0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNodWZmbGVfbWNfdmFsaWRhdG9ycycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNodWZmbGVfbWNfdmFsaWRhdG9ycycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjgubWNfY2F0Y2hhaW5fbGlmZXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4Lm1jX2NhdGNoYWluX2xpZmV0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF9jYXRjaGFpbl9saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbnVtJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF92YWxpZGF0b3JzX251bScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubmV3X2NhdGNoYWluX2lkcycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm5ld19jYXRjaGFpbl9pZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LnJvdW5kX2NhbmRpZGF0ZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LnJvdW5kX2NhbmRpZGF0ZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm5leHRfY2FuZGlkYXRlX2RlbGF5X21zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5uZXh0X2NhbmRpZGF0ZV9kZWxheV9tcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkuY29uc2Vuc3VzX3RpbWVvdXRfbXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmNvbnNlbnN1c190aW1lb3V0X21zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5mYXN0X2F0dGVtcHRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5mYXN0X2F0dGVtcHRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5hdHRlbXB0X2R1cmF0aW9uJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5hdHRlbXB0X2R1cmF0aW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5jYXRjaGFpbl9tYXhfZGVwcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkuY2F0Y2hhaW5fbWF4X2RlcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm1heF9ibG9ja19ieXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2Jsb2NrX2J5dGVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5tYXhfY29sbGF0ZWRfYnl0ZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm1heF9jb2xsYXRlZF9ieXRlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMxWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudXRpbWVfc2luY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3VudGlsJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV91bnRpbCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcudG90YWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnRvdGFsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy50b3RhbF93ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnRvdGFsX3dlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC5wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0WypdLnB1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3Lmxpc3Qud2VpZ2h0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0WypdLndlaWdodCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS5hZG5sX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLmFkbmxfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkudGVtcF9wdWJsaWNfa2V5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS50ZW1wX3B1YmxpY19rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkudmFsaWRfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnZhbGlkX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS5zaWduYXR1cmVfcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0uc2lnbmF0dXJlX3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNpZ25hdHVyZV9zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zaWduYXR1cmVfcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mua2V5X2Jsb2NrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2Mua2V5X2Jsb2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5ib2MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJsb2NrX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ibG9ja19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWNjb3VudF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByZXZfdHJhbnNfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl90cmFuc19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcmV2X3RyYW5zX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5wcmV2X3RyYW5zX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ub3cnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm5vdycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub3V0bXNnX2NudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mub3V0bXNnX2NudCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaW5fbXNnJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2cnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm91dF9tc2dzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnc1sqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMudG90YWxfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy50b3RhbF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy50b3RhbF9mZWVzX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXNfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm9sZF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMubmV3X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXRfZmlyc3QnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5jcmVkaXRfZmlyc3QnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5zdG9yYWdlLnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY3JlZGl0LmNyZWRpdCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5jcmVkaXQuY3JlZGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0X290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jcmVkaXQuY3JlZGl0X290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0X290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuc3VjY2VzcycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUuc3VjY2VzcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5jb21wdXRlLmFjY291bnRfYWN0aXZhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmdhc19mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX3VzZWQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX3VzZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX2xpbWl0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5jb21wdXRlLmdhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfY3JlZGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLmdhc19jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUubW9kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5tb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmV4aXRfY29kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5leGl0X2NvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZXhpdF9hcmcnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUuZXhpdF9hcmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUudm1fc3RlcHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1fc3RlcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9maW5hbF9zdGF0ZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi5zdWNjZXNzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLnN1Y2Nlc3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi52YWxpZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFjdGlvbi52YWxpZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLm5vX2Z1bmRzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLm5vX2Z1bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfZndkX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX2FjdGlvbl9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ucmVzdWx0X2NvZGUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi5yZXN1bHRfY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnJlc3VsdF9hcmcnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi5yZXN1bHRfYXJnJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90X2FjdGlvbnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnNwZWNfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnNwZWNfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnNraXBwZWRfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnNraXBwZWRfYWN0aW9ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLm1zZ3NfY3JlYXRlZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLm1zZ3NfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjdGlvbi5hY3Rpb25fbGlzdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9iaXRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UubXNnX3NpemVfY2VsbHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfc2l6ZV9jZWxscycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLm1zZ19zaXplX2JpdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfc2l6ZV9iaXRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UucmVxX2Z3ZF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5yZXFfZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5tc2dfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5ib3VuY2UubXNnX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5md2RfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5ib3VuY2UuZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFib3J0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hYm9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5kZXN0cm95ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5kZXN0cm95ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnR0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy50dCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLnRoaXNfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby50aGlzX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnNwbGl0X2luZm8uc2libGluZ19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMucHJlcGFyZV90cmFuc2FjdGlvbicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJlcGFyZV90cmFuc2FjdGlvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuaW5zdGFsbGVkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuaW5zdGFsbGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5iYWxhbmNlX2RlbHRhJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2VfZGVsdGEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJhbGFuY2VfZGVsdGFfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJhbGFuY2VfZGVsdGFfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJhbGFuY2VfZGVsdGFfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYmFsYW5jZV9kZWx0YV9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ibG9ja19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYmxvY2tfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9keScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9keScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib2R5X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvZHlfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudGljaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRpY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudG9jaycsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLnRvY2snIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY29kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jb2RlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kYXRhJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRhdGFfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmxpYnJhcnknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMubGlicmFyeV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3JjJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcmMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZHN0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kc3QnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3JjX3dvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3JjX3dvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kc3Rfd29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5kc3Rfd29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNyZWF0ZWRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNyZWF0ZWRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY3JlYXRlZF9hdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY3JlYXRlZF9hdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5paHJfZGlzYWJsZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5paHJfZGlzYWJsZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5pbXBvcnRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmltcG9ydF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm91bmNlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYm91bmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvdW5jZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5ib3VuY2VkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnZhbHVlX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGFzdF9wYWlkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5sYXN0X3BhaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZHVlX3BheW1lbnQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuZHVlX3BheW1lbnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGFzdF90cmFuc19sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubGFzdF90cmFuc19sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5iYWxhbmNlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYmFsYW5jZV9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5iYWxhbmNlX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJhbGFuY2Vfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnRpY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50aWNrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnRvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50b2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmNvZGUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuY29kZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZGF0YScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5kYXRhX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGFfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5saWJyYXJ5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxpYnJhcnlfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5ib2MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5zdGF0ZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV9oYXNoJyB9KTtcbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNjYWxhckZpZWxkcyxcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEFjY291bnQsXG59O1xuIl19