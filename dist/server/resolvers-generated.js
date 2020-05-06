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
  resolveUnixTimeString
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
  masterchain_block_fee: scalar,
  basechain_block_fee: scalar
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
  min_stake: bigUInt1,
  max_stake: bigUInt1,
  min_total_stake: bigUInt1,
  max_stake_factor: scalar
});
const BlockMasterConfigP18 = struct({
  utime_since: scalar,
  bit_price_ps: scalar,
  cell_price_ps: scalar,
  mc_bit_price_ps: scalar,
  mc_cell_price_ps: scalar
});
const GasLimitsPrices = struct({
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
  lump_price: scalar,
  bit_price: scalar,
  cell_price: scalar,
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
  boc: scalar
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
        return resolveUnixTimeString(parent.gen_utime);
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
    BlockMasterConfigP17: {
      min_stake(parent, args) {
        return resolveBigUInt(1, parent.min_stake, args);
      },

      max_stake(parent, args) {
        return resolveBigUInt(1, parent.max_stake, args);
      },

      min_total_stake(parent, args) {
        return resolveBigUInt(1, parent.min_total_stake, args);
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
        return resolveUnixTimeString(parent.utime_since);
      },

      utime_until_string(parent, args) {
        return resolveUnixTimeString(parent.utime_until);
      }

    },
    BlockSignatures: {
      id(parent) {
        return parent._key;
      },

      block(parent, args, context) {
        return context.db.blocks.waitForDoc(parent._key, '_key', args);
      },

      sig_weight(parent, args) {
        return resolveBigUInt(1, parent.sig_weight, args);
      },

      gen_utime_string(parent, args) {
        return resolveUnixTimeString(parent.gen_utime);
      }

    },
    Block: {
      id(parent) {
        return parent._key;
      },

      signatures(parent, args, context) {
        return context.db.blocks_signatures.waitForDoc(parent._key, '_key', args);
      },

      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
      },

      gen_utime_string(parent, args) {
        return resolveUnixTimeString(parent.gen_utime);
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
        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      in_message(parent, args, context) {
        return context.db.messages.waitForDoc(parent.in_msg, '_key', args);
      },

      out_messages(parent, args, context) {
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
        return context.db.blocks.waitForDoc(parent.block_id, '_key', args);
      },

      src_transaction(parent, args, context) {
        return parent.msg_type !== 1 ? context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]', args) : null;
      },

      dst_transaction(parent, args, context) {
        return parent.msg_type !== 2 ? context.db.transactions.waitForDoc(parent._key, 'in_msg', args) : null;
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
        return resolveUnixTimeString(parent.created_at);
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
  type: 'string',
  path: 'doc.master.config.p14.masterchain_block_fee'
});
scalarFields.set('blocks.master.config.p14.basechain_block_fee', {
  type: 'string',
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
  type: 'uint64',
  path: 'doc.master.config.p17.min_stake'
});
scalarFields.set('blocks.master.config.p17.max_stake', {
  type: 'uint64',
  path: 'doc.master.config.p17.max_stake'
});
scalarFields.set('blocks.master.config.p17.min_total_stake', {
  type: 'uint64',
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
  type: 'string',
  path: 'doc.master.config.p18[*].bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.cell_price_ps', {
  type: 'string',
  path: 'doc.master.config.p18[*].cell_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_bit_price_ps', {
  type: 'string',
  path: 'doc.master.config.p18[*].mc_bit_price_ps'
});
scalarFields.set('blocks.master.config.p18.mc_cell_price_ps', {
  type: 'string',
  path: 'doc.master.config.p18[*].mc_cell_price_ps'
});
scalarFields.set('blocks.master.config.p20.gas_price', {
  type: 'string',
  path: 'doc.master.config.p20.gas_price'
});
scalarFields.set('blocks.master.config.p20.gas_limit', {
  type: 'string',
  path: 'doc.master.config.p20.gas_limit'
});
scalarFields.set('blocks.master.config.p20.special_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p20.special_gas_limit'
});
scalarFields.set('blocks.master.config.p20.gas_credit', {
  type: 'string',
  path: 'doc.master.config.p20.gas_credit'
});
scalarFields.set('blocks.master.config.p20.block_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p20.block_gas_limit'
});
scalarFields.set('blocks.master.config.p20.freeze_due_limit', {
  type: 'string',
  path: 'doc.master.config.p20.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p20.delete_due_limit', {
  type: 'string',
  path: 'doc.master.config.p20.delete_due_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p20.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p20.flat_gas_price', {
  type: 'string',
  path: 'doc.master.config.p20.flat_gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_price', {
  type: 'string',
  path: 'doc.master.config.p21.gas_price'
});
scalarFields.set('blocks.master.config.p21.gas_limit', {
  type: 'string',
  path: 'doc.master.config.p21.gas_limit'
});
scalarFields.set('blocks.master.config.p21.special_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p21.special_gas_limit'
});
scalarFields.set('blocks.master.config.p21.gas_credit', {
  type: 'string',
  path: 'doc.master.config.p21.gas_credit'
});
scalarFields.set('blocks.master.config.p21.block_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p21.block_gas_limit'
});
scalarFields.set('blocks.master.config.p21.freeze_due_limit', {
  type: 'string',
  path: 'doc.master.config.p21.freeze_due_limit'
});
scalarFields.set('blocks.master.config.p21.delete_due_limit', {
  type: 'string',
  path: 'doc.master.config.p21.delete_due_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_limit', {
  type: 'string',
  path: 'doc.master.config.p21.flat_gas_limit'
});
scalarFields.set('blocks.master.config.p21.flat_gas_price', {
  type: 'string',
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
  type: 'string',
  path: 'doc.master.config.p24.lump_price'
});
scalarFields.set('blocks.master.config.p24.bit_price', {
  type: 'string',
  path: 'doc.master.config.p24.bit_price'
});
scalarFields.set('blocks.master.config.p24.cell_price', {
  type: 'string',
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
  type: 'string',
  path: 'doc.master.config.p25.lump_price'
});
scalarFields.set('blocks.master.config.p25.bit_price', {
  type: 'string',
  path: 'doc.master.config.p25.bit_price'
});
scalarFields.set('blocks.master.config.p25.cell_price', {
  type: 'string',
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlc29sdmVVbml4VGltZVN0cmluZyIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJtaW5fdG90X3JvdW5kcyIsIm1heF90b3Rfcm91bmRzIiwibWluX3dpbnMiLCJtYXhfbG9zc2VzIiwibWluX3N0b3JlX3NlYyIsIm1heF9zdG9yZV9zZWMiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwiQmxvY2tNYXN0ZXJDb25maWdQMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwiQmxvY2tNYXN0ZXJDb25maWdQMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwiQmxvY2tNYXN0ZXJDb25maWdQMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwiZ2FzX2xpbWl0Iiwic3BlY2lhbF9nYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiQmxvY2tMaW1pdHNCeXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiQmxvY2tMaW1pdHNHYXMiLCJCbG9ja0xpbWl0c0x0RGVsdGEiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwiZ2FzIiwibHRfZGVsdGEiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiQmxvY2tNYXN0ZXJDb25maWdQMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwiQmxvY2tNYXN0ZXJDb25maWdQMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJTdHJpbmdBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsInA3IiwicDgiLCJwOSIsInAxMCIsInAxMSIsInAxMiIsInAxNCIsInAxNSIsInAxNiIsInAxNyIsInAxOCIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInAyOSIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsInByb29mIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJibG9jayIsIkJsb2NrIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkZyb3plbiIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiTWVzc2FnZSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiUHJlbGltaW5hcnkiLCJibG9ja19pZCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImJvYyIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJib2R5X2hhc2giLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJnZW5fdXRpbWVfc3RyaW5nIiwidXRpbWVfc2luY2Vfc3RyaW5nIiwidXRpbWVfdW50aWxfc3RyaW5nIiwiX2tleSIsImNvbnRleHQiLCJibG9ja3MiLCJ3YWl0Rm9yRG9jIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2NzIiwiY3JlYXRlZF9hdF9zdHJpbmciLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwic2NhbGFyRmllbGRzIiwiTWFw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QUE2QmJJLEVBQUFBLGNBN0JhO0FBOEJiQyxFQUFBQSxrQkE5QmE7QUErQmJDLEVBQUFBLFdBL0JhO0FBZ0NiSSxFQUFBQSxnQkFoQ2E7QUFpQ2JLLEVBQUFBLG9CQWpDYTtBQWtDYk0sRUFBQUEsb0JBbENhO0FBbUNiVSxFQUFBQSxnQkFuQ2E7QUFvQ2JLLEVBQUFBLFlBcENhO0FBcUNiSyxFQUFBQSxvQkFyQ2E7QUFzQ2JZLEVBQUFBLGlCQXRDYTtBQXVDYnFDLEVBQUFBLFdBdkNhO0FBd0NiUyxFQUFBQSx5QkF4Q2E7QUF5Q2JFLEVBQUFBLGVBekNhO0FBMENiUSxFQUFBQSxLQTFDYTtBQTJDYitCLEVBQUFBLGtCQTNDYTtBQTRDYlEsRUFBQUEsaUJBNUNhO0FBNkNiSSxFQUFBQSxrQkE3Q2E7QUE4Q2JxQixFQUFBQSxpQkE5Q2E7QUErQ2JjLEVBQUFBLGlCQS9DYTtBQWdEYlcsRUFBQUEsb0JBaERhO0FBaURiTyxFQUFBQSxXQWpEYTtBQWtEYkQsRUFBQUEsT0FsRGE7QUFtRGJxRSxFQUFBQTtBQW5EYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG4gICAgcmVzb2x2ZVVuaXhUaW1lU3RyaW5nLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgRGVxdWV1ZVNob3J0OiA3LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbiAgICBtc2dfZW52X2hhc2g6IHNjYWxhcixcbiAgICBuZXh0X3dvcmtjaGFpbjogc2NhbGFyLFxuICAgIG5leHRfYWRkcl9wZng6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KCgpID0+IE90aGVyQ3VycmVuY3kpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXAgPSBzdHJ1Y3Qoe1xuICAgIG1pbl90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWF4X3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtaW5fd2luczogc2NhbGFyLFxuICAgIG1heF9sb3NzZXM6IHNjYWxhcixcbiAgICBtaW5fc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgbWF4X3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMSA9IHN0cnVjdCh7XG4gICAgbm9ybWFsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBjcml0aWNhbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBiaWdVSW50MSxcbiAgICBtYXhfc3Rha2U6IGJpZ1VJbnQxLFxuICAgIG1pbl90b3RhbF9zdGFrZTogYmlnVUludDEsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgc2h1ZmZsZV9tY192YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICBuZXdfY2F0Y2hhaW5faWRzOiBzY2FsYXIsXG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogYmlnVUludDEsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoKCkgPT4gVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogYmlnVUludDEsXG4gICAgbGlzdDogVmFsaWRhdG9yU2V0TGlzdEFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDE4KTtcbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AzOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgcDA6IHNjYWxhcixcbiAgICBwMTogc2NhbGFyLFxuICAgIHAyOiBzY2FsYXIsXG4gICAgcDM6IHNjYWxhcixcbiAgICBwNDogc2NhbGFyLFxuICAgIHA2OiBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIHA3OiBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXksXG4gICAgcDg6IEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgcDk6IEZsb2F0QXJyYXksXG4gICAgcDEwOiBGbG9hdEFycmF5LFxuICAgIHAxMTogQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBzaWdfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG4gICAgYmxvY2s6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheSgoKSA9PiBPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgKCkgPT4gQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheSgoKSA9PiBNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJsb2NrOiBqb2luKCdibG9ja19pZCcsICdpZCcsICdibG9ja3MnLCAoKSA9PiBCbG9jayksXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBib2R5X2hhc2g6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGNvZGVfaGFzaDogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBkYXRhX2hhc2g6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgbGlicmFyeV9oYXNoOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF9hZGRyX3BmeChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfYWRkcl9wZngsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdlbl91dGltZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVVbml4VGltZVN0cmluZyhwYXJlbnQuZ2VuX3V0aW1lKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJDb25maWdQMTc6IHtcbiAgICAgICAgICAgIG1pbl9zdGFrZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm1pbl9zdGFrZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWF4X3N0YWtlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubWF4X3N0YWtlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW5fdG90YWxfc3Rha2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5taW5fdG90YWxfc3Rha2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0TGlzdDoge1xuICAgICAgICAgICAgd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQud2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFZhbGlkYXRvclNldDoge1xuICAgICAgICAgICAgdG90YWxfd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudG90YWxfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1dGltZV9zaW5jZV9zdHJpbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVVbml4VGltZVN0cmluZyhwYXJlbnQudXRpbWVfc2luY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHV0aW1lX3VudGlsX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVVuaXhUaW1lU3RyaW5nKHBhcmVudC51dGltZV91bnRpbCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWdfd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2lnX3dlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2VuX3V0aW1lX3N0cmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZVVuaXhUaW1lU3RyaW5nKHBhcmVudC5nZW5fdXRpbWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdfa2V5JywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnZW5fdXRpbWVfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50Lmdlbl91dGltZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuYmxvY2tfaWQsICdfa2V5JywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIGFyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5JywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncywgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5ibG9ja19pZCwgJ19rZXknLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb24ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMSA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScsIGFyZ3MpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb24ocGFyZW50LCBhcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMiA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdpbl9tc2cnLCBhcmdzKSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfYXRfc3RyaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlVW5peFRpbWVTdHJpbmcocGFyZW50LmNyZWF0ZWRfYXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwKCk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Nfc2lnbmF0dXJlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrc19zaWduYXR1cmVzLnNpZ193ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnNpZ193ZWlnaHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5ub2RlX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLm5vZGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzX3NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zaWduYXR1cmVzWypdLnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nbG9iYWxfaWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdsb2JhbF9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLndhbnRfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hZnRlcl9tZXJnZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFmdGVyX21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl91dGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX2NhdGNoYWluX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5nZW5fY2F0Y2hhaW5fc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXJfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyX3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlcl9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXJfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyX3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlcl9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmVuZF9sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnNlcV9ubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZW5kX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfcmVmLnNlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MucHJldl92ZXJ0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9yZWYucm9vdF9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfcmVmLnJvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9yZWYuZmlsZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5lbmRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MucHJldl92ZXJ0X2FsdF9yZWYuc2VxX25vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X3ZlcnRfYWx0X3JlZi5zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfdmVydF9hbHRfcmVmLnJvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJldl92ZXJ0X2FsdF9yZWYucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5wcmV2X3ZlcnRfYWx0X3JlZi5maWxlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByZXZfdmVydF9hbHRfcmVmLmZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5iZWZvcmVfc3BsaXQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFmdGVyX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWZ0ZXJfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndhbnRfbWVyZ2UnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52ZXJ0X3NlcV9ubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmVydF9zZXFfbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXJ0X2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5zdGFydF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5lbmRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc2hhcmQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1pbl9yZWZfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnByZXZfa2V5X2Jsb2NrX3NlcW5vJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5wcmV2X2tleV9ibG9ja19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuZ2VuX3NvZnR3YXJlX3ZlcnNpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmdlbl9zb2Z0d2FyZV92ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LnRvX25leHRfYmxrJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5leHBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS5jdXJyZW5jeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5pbXBvcnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsaycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGsnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cubWludGVkX290aGVyWypdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyLmN1cnJlbmN5JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0uaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3Iub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZ19kZXNjclsqXS5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuaW5fbXNnX2Rlc2NyLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0udHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmluX21zZ19kZXNjci50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuaW5fbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5pbl9tc2dfZGVzY3IucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5pbl9tc2dfZGVzY3JbKl0ucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5yYW5kX3NlZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnJhbmRfc2VlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5paHJfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2NyZWF0ZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQucHJvb2ZfY3JlYXRlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5pbl9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LmluX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmluX21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5pbl9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQuaW5fbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LmZ3ZF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5md2RfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0Lm91dF9tc2cubmV4dF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0Lm91dF9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0ucmVpbXBvcnQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5yZWltcG9ydC50cmFuc2l0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zaXRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLnJlaW1wb3J0LnRyYW5zYWN0aW9uX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLnJlaW1wb3J0LnByb29mX2RlbGl2ZXJlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5yZWltcG9ydC5wcm9vZl9kZWxpdmVyZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQubXNnX2lkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5paHJfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9jcmVhdGVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLnByb29mX2NyZWF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQuaW5fbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5pbl9tc2cubXNnX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5pbl9tc2cuY3VyX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuaW5fbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLmluX21zZy5md2RfZmVlX3JlbWFpbmluZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQuZndkX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC5vdXRfbXNnLm5leHRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5vdXRfbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuY3VyX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQub3V0X21zZy5md2RfZmVlX3JlbWFpbmluZycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLmltcG9ydGVkLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IuaW1wb3J0ZWQudHJhbnNpdF9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2l0X2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRlZC50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5pbXBvcnRlZC5wcm9vZl9kZWxpdmVyZWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dfZGVzY3JbKl0uaW1wb3J0ZWQucHJvb2ZfZGVsaXZlcmVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5vdXRfbXNnX2Rlc2NyLmltcG9ydF9ibG9ja19sdCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5pbXBvcnRfYmxvY2tfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm91dF9tc2dfZGVzY3IubXNnX2Vudl9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm1zZ19lbnZfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X3dvcmtjaGFpbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mub3V0X21zZ19kZXNjclsqXS5uZXh0X3dvcmtjaGFpbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Mub3V0X21zZ19kZXNjci5uZXh0X2FkZHJfcGZ4JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5vdXRfbXNnX2Rlc2NyWypdLm5leHRfYWRkcl9wZngnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0uYWNjb3VudF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMubHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0ubHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50cmFuc2FjdGlvbl9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50cmFuc2FjdGlvbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMudG90YWxfZmVlc19vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0udHJhbnNhY3Rpb25zWyoqXS50b3RhbF9mZWVzX290aGVyWyoqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucy50b3RhbF9mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyYW5zYWN0aW9uc1sqKl0udG90YWxfZmVlc19vdGhlclsqKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5hY2NvdW50X2Jsb2Nrcy5vbGRfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWNjb3VudF9ibG9ja3NbKl0ub2xkX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLmFjY291bnRfYmxvY2tzLm5ld19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5hY2NvdW50X2Jsb2Nrc1sqXS5uZXdfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MuYWNjb3VudF9ibG9ja3MudHJfY291bnQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmFjY291bnRfYmxvY2tzWypdLnRyX2NvdW50JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy50cl9jb3VudCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudHJfY291bnQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXcnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5uZXcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm5ld19oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUubmV3X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zdGF0ZV91cGRhdGUub2xkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5zaGFyZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5zZXFfbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc2VxX25vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnJlZ19tY19zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5yZWdfbWNfc2Vxbm8nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iuc3RhcnRfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iuc3RhcnRfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZW5kX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmVuZF9sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5yb290X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iucm9vdF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5maWxlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX3NwbGl0JywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuYmVmb3JlX21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5iZWZvcmVfbWVyZ2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3Iud2FudF9zcGxpdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3Iud2FudF9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci53YW50X21lcmdlJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci53YW50X21lcmdlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm54X2NjX3VwZGF0ZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm54X2NjX3VwZGF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmxhZ3MnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmxhZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLm1pbl9yZWZfbWNfc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IubWluX3JlZl9tY19zZXFubycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjci5nZW5fdXRpbWUnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZ2VuX3V0aW1lJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLnNwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLnNwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWQnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2hhc2hlc1sqXS5kZXNjci5mdW5kc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9oYXNoZXNbKl0uZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfaGFzaGVzWypdLmRlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLnNoYXJkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLmN1cnJlbmN5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyLnZhbHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmZlZXNfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnNoYXJkX2ZlZXNbKl0uY3JlYXRlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5zaGFyZF9mZWVzWypdLmNyZWF0ZV9vdGhlclsqKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIuc2hhcmRfZmVlc1sqXS5jcmVhdGVfb3RoZXJbKipdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm1zZ19pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaWhyX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmlocl9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfY3JlYXRlZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5wcm9vZl9jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLm1zZ19pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cubmV4dF9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuaW5fbXNnLmN1cl9hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmluX21zZy5jdXJfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5pbl9tc2cuZndkX2ZlZV9yZW1haW5pbmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cuZndkX2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5tc2dfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5uZXh0X2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cub3V0X21zZy5jdXJfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmN1cl9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLm91dF9tc2cuZndkX2ZlZV9yZW1haW5pbmcnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MubWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZy5vdXRfbXNnLmZ3ZF9mZWVfcmVtYWluaW5nJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnRyYW5zaXRfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNpdF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cudHJhbnNhY3Rpb25faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cucHJvb2ZfZGVsaXZlcmVkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnLnByb29mX2RlbGl2ZXJlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ubm9kZV9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXNbKl0ucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZ19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDAnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDAnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9uZXdfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDYubWludF9hZGRfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDcudmFsdWUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDdbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDgudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC52ZXJzaW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnA4LmNhcGFiaWxpdGllcycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wOC5jYXBhYmlsaXRpZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDknLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDlbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMFsqXScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5tYXhfbG9zc2VzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9sb3NzZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5taW5fc3RvcmVfc2VjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLm1heF9zdG9yZV9zZWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcy5iaXRfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl90b3Rfcm91bmRzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3RvdF9yb3VuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfdG90X3JvdW5kcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF90b3Rfcm91bmRzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3dpbnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5taW5fd2lucycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1heF9sb3NzZXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfbG9zc2VzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWluX3N0b3JlX3NlYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLm1pbl9zdG9yZV9zZWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5tYXhfc3RvcmVfc2VjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMubWF4X3N0b3JlX3NlYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zLmNlbGxfcHJpY2UnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcy5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDEyWypdLndvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuZW5hYmxlZF9zaW5jZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uZW5hYmxlZF9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYWN0dWFsX21pbl9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWN0dWFsX21pbl9zcGxpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX3NwbGl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fc3BsaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9zcGxpdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X3NwbGl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hY3RpdmUnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hY3RpdmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmFjY2VwdF9tc2dzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uYWNjZXB0X21zZ3MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLmZsYWdzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5mbGFncycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX3Jvb3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX3Jvb3RfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuemVyb3N0YXRlX2ZpbGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0uemVyb3N0YXRlX2ZpbGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIuYmFzaWMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5iYXNpYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fdmVyc2lvbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fdmVyc2lvbicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIudm1fbW9kZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0udm1fbW9kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTIubWluX2FkZHJfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5taW5fYWRkcl9sZW4nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDEyLm1heF9hZGRyX2xlbicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ubWF4X2FkZHJfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi5hZGRyX2xlbl9zdGVwJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxMlsqXS5hZGRyX2xlbl9zdGVwJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxMi53b3JrY2hhaW5fdHlwZV9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTJbKl0ud29ya2NoYWluX3R5cGVfaWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE0Lm1hc3RlcmNoYWluX2Jsb2NrX2ZlZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTQubWFzdGVyY2hhaW5fYmxvY2tfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNC5iYXNlY2hhaW5fYmxvY2tfZmVlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNC5iYXNlY2hhaW5fYmxvY2tfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS52YWxpZGF0b3JzX2VsZWN0ZWRfZm9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfc3RhcnRfYmVmb3JlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNS5lbGVjdGlvbnNfZW5kX2JlZm9yZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTUuZWxlY3Rpb25zX2VuZF9iZWZvcmUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE1LnN0YWtlX2hlbGRfZm9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNS5zdGFrZV9oZWxkX2ZvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTYubWF4X3ZhbGlkYXRvcnMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE2Lm1heF92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNi5tYXhfbWFpbl92YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNi5taW5fdmFsaWRhdG9ycycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTYubWluX3ZhbGlkYXRvcnMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1pbl9zdGFrZScsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMTcubWluX3N0YWtlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxNy5tYXhfc3Rha2UnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTcubWluX3RvdGFsX3N0YWtlJywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxNy5taW5fdG90YWxfc3Rha2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE3Lm1heF9zdGFrZV9mYWN0b3InIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMTguYml0X3ByaWNlX3BzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5iaXRfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4LmNlbGxfcHJpY2VfcHMnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDE4WypdLmNlbGxfcHJpY2VfcHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDE4Lm1jX2JpdF9wcmljZV9wcycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMThbKl0ubWNfYml0X3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAxOC5tY19jZWxsX3ByaWNlX3BzJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAxOFsqXS5tY19jZWxsX3ByaWNlX3BzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjAuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMC5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjAuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIwLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmdhc19wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLnNwZWNpYWxfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5zcGVjaWFsX2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjEuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuYmxvY2tfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5ibG9ja19nYXNfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZyZWV6ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmRlbGV0ZV9kdWVfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX2xpbWl0JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMS5mbGF0X2dhc19saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjEuZmxhdF9nYXNfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIxLmZsYXRfZ2FzX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIyLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIyLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjIubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMi5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5ieXRlcy51bmRlcmxvYWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmJ5dGVzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuc29mdF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuYnl0ZXMuaGFyZF9saW1pdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnVuZGVybG9hZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLnNvZnRfbGltaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDIzLmdhcy5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5nYXMuaGFyZF9saW1pdCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMuZ2FzLmhhcmRfbGltaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDIzLmx0X2RlbHRhLnVuZGVybG9hZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjMubHRfZGVsdGEudW5kZXJsb2FkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5zb2Z0X2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyMy5sdF9kZWx0YS5oYXJkX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5sdW1wX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNC5iaXRfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI0LmJpdF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuY2VsbF9wcmljZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuaWhyX3ByaWNlX2ZhY3RvcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjQuZmlyc3RfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjQubmV4dF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNC5uZXh0X2ZyYWMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lmx1bXBfcHJpY2UnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI1LmJpdF9wcmljZScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjUuYml0X3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5jZWxsX3ByaWNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5paHJfcHJpY2VfZmFjdG9yJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyNS5maXJzdF9mcmFjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyNS5uZXh0X2ZyYWMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI1Lm5leHRfZnJhYycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2h1ZmZsZV9tY192YWxpZGF0b3JzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOC5tY19jYXRjaGFpbl9saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjgubWNfY2F0Y2hhaW5fbGlmZXRpbWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX2NhdGNoYWluX2xpZmV0aW1lJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOC5zaGFyZF9jYXRjaGFpbl9saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19saWZldGltZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjguc2hhcmRfdmFsaWRhdG9yc19udW0nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI4LnNoYXJkX3ZhbGlkYXRvcnNfbnVtJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5uZXdfY2F0Y2hhaW5faWRzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubmV3X2NhdGNoYWluX2lkcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkucm91bmRfY2FuZGlkYXRlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5Lm5leHRfY2FuZGlkYXRlX2RlbGF5X21zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAyOS5jb25zZW5zdXNfdGltZW91dF9tcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkuY29uc2Vuc3VzX3RpbWVvdXRfbXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmZhc3RfYXR0ZW1wdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDI5LmF0dGVtcHRfZHVyYXRpb24nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5LmNhdGNoYWluX21heF9kZXBzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5jYXRjaGFpbl9tYXhfZGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2Jsb2NrX2J5dGVzJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAyOS5tYXhfYmxvY2tfYnl0ZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDI5Lm1heF9jb2xsYXRlZF9ieXRlcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMjkubWF4X2NvbGxhdGVkX2J5dGVzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzFbKl0nIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMyLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzIubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMyLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzIubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzMy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDMzLnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzMubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDMzLmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzMy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzMubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNC51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM0LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzQubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM0Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNC5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzQubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNS51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM1LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzUubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM1Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNS5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzUubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNi51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM2LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzYubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM2Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNi5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzYubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3NpbmNlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzNy51dGltZV9zaW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcudXRpbWVfdW50aWwnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3LnV0aW1lX3VudGlsJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy50b3RhbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM3LnRvdGFsX3dlaWdodCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcudG90YWxfd2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LnB1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ucHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzcubGlzdC53ZWlnaHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM3Lmxpc3RbKl0ud2VpZ2h0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzNy5saXN0LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzcubGlzdFsqXS5hZG5sX2FkZHInIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LmFkbmxfYWRkcicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0uYWRubF9hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS50ZW1wX3B1YmxpY19rZXknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnRlbXBfcHVibGljX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2Vxbm8nLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNlcW5vJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2Jsb2Nrcy5tYXN0ZXIuY29uZmlnLnAzOS52YWxpZF91bnRpbCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubWFzdGVyLmNvbmZpZy5wMzlbKl0udmFsaWRfdW50aWwnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYmxvY2tzLm1hc3Rlci5jb25maWcucDM5LnNpZ25hdHVyZV9yJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5tYXN0ZXIuY29uZmlnLnAzOVsqXS5zaWduYXR1cmVfcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdibG9ja3MubWFzdGVyLmNvbmZpZy5wMzkuc2lnbmF0dXJlX3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm1hc3Rlci5jb25maWcucDM5WypdLnNpZ25hdHVyZV9zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pZCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuX2tleScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYmxvY2tfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJsb2NrX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY2NvdW50X2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmFjY291bnRfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMud29ya2NoYWluX2lkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy53b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmx0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5sdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMucHJldl90cmFuc19oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmV2X3RyYW5zX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByZXZfdHJhbnNfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLnByZXZfdHJhbnNfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLm5vdycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mubm93JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5vdXRtc2dfY250JywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5vdXRtc2dfY250JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbl9tc2cnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmluX21zZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub3V0X21zZ3MnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm91dF9tc2dzWypdJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy50b3RhbF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnRvdGFsX2ZlZXNfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnRvdGFsX2ZlZXNfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudG90YWxfZmVlc19vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMub2xkX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLm9sZF9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5uZXdfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubmV3X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdF9maXJzdCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNyZWRpdF9maXJzdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCcsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jcmVkaXQuY3JlZGl0JywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNyZWRpdC5jcmVkaXRfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNyZWRpdC5jcmVkaXRfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY3JlZGl0LmNyZWRpdF9vdGhlclsqXS52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5zdWNjZXNzJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5zdWNjZXNzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLm1zZ19zdGF0ZV91c2VkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZ2FzX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfdXNlZCcsIHsgdHlwZTogJ3VpbnQ2NCcsIHBhdGg6ICdkb2MuY29tcHV0ZS5nYXNfdXNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5nYXNfbGltaXQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2xpbWl0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLmdhc19jcmVkaXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNvbXB1dGUuZ2FzX2NyZWRpdCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5tb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLm1vZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmNvbXB1dGUuZXhpdF9jb2RlJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5jb21wdXRlLmV4aXRfY29kZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS5leGl0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS5leGl0X2FyZycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9zdGVwcycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuY29tcHV0ZS52bV9zdGVwcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnN1Y2Nlc3MnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24uc3VjY2VzcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWN0aW9uLnZhbGlkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYWN0aW9uLnZhbGlkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubm9fZnVuZHMnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5hY3Rpb24ubm9fZnVuZHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9md2RfZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfZndkX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcycsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi5yZXN1bHRfY29kZScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ucmVzdWx0X2FyZycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnJlc3VsdF9hcmcnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RfYWN0aW9ucycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc3BlY19hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc3BlY19hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24ubXNnc19jcmVhdGVkJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5hY3Rpb24ubXNnc19jcmVhdGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5tc2dfc2l6ZV9jZWxscycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2NlbGxzJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5ib3VuY2UubXNnX3NpemVfYml0cycsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuYm91bmNlLm1zZ19zaXplX2JpdHMnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmJvdW5jZS5yZXFfZndkX2ZlZXMnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuYm91bmNlLnJlcV9md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLm1zZ19mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5tc2dfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm91bmNlLmZ3ZF9mZWVzJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmJvdW5jZS5md2RfZmVlcycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYWJvcnRlZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmFib3J0ZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLmRlc3Ryb3llZCcsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmRlc3Ryb3llZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMudHQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnR0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Muc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnNwbGl0X2luZm8udGhpc19hZGRyJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5zcGxpdF9pbmZvLnRoaXNfYWRkcicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuc3BsaXRfaW5mby5zaWJsaW5nX2FkZHInLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnNwbGl0X2luZm8uc2libGluZ19hZGRyJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5wcmVwYXJlX3RyYW5zYWN0aW9uJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcmVwYXJlX3RyYW5zYWN0aW9uJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ3RyYW5zYWN0aW9ucy5pbnN0YWxsZWQnLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy5pbnN0YWxsZWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgndHJhbnNhY3Rpb25zLnByb29mJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5wcm9vZicgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCd0cmFuc2FjdGlvbnMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLl9rZXknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYmxvY2tfaWQnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJsb2NrX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvZHknLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmJvZHknIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuYm9keV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2R5X2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuc3BsaXRfZGVwdGgnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNwbGl0X2RlcHRoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnRpY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50aWNrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnRvY2snLCB7IHR5cGU6ICdib29sZWFuJywgcGF0aDogJ2RvYy50b2NrJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNvZGUnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmNvZGUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuY29kZV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZGF0YScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZGF0YScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5kYXRhX2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGFfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5saWJyYXJ5JywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5saWJyYXJ5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmxpYnJhcnlfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnNyYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2Muc3JjJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmRzdCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuZHN0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLnNyY193b3JrY2hhaW5faWQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLnNyY193b3JrY2hhaW5faWQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuZHN0X3dvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MuZHN0X3dvcmtjaGFpbl9pZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5jcmVhdGVkX2x0JywgeyB0eXBlOiAndWludDY0JywgcGF0aDogJ2RvYy5jcmVhdGVkX2x0JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmNyZWF0ZWRfYXQnLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmNyZWF0ZWRfYXQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaWhyX2Rpc2FibGVkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuaWhyX2Rpc2FibGVkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmlocl9mZWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MuaWhyX2ZlZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5md2RfZmVlJywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmZ3ZF9mZWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMuaW1wb3J0X2ZlZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5pbXBvcnRfZmVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvdW5jZScsIHsgdHlwZTogJ2Jvb2xlYW4nLCBwYXRoOiAnZG9jLmJvdW5jZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy5ib3VuY2VkJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MuYm91bmNlZCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy52YWx1ZScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdtZXNzYWdlcy52YWx1ZV9vdGhlci5jdXJyZW5jeScsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MudmFsdWVfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMudmFsdWVfb3RoZXIudmFsdWUnLCB7IHR5cGU6ICd1aW50MTAyNCcsIHBhdGg6ICdkb2MudmFsdWVfb3RoZXJbKl0udmFsdWUnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnbWVzc2FnZXMucHJvb2YnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLnByb29mJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ21lc3NhZ2VzLmJvYycsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuYm9jJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmlkJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5fa2V5JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLndvcmtjaGFpbl9pZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2Mud29ya2NoYWluX2lkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxhc3RfcGFpZCcsIHsgdHlwZTogJ251bWJlcicsIHBhdGg6ICdkb2MubGFzdF9wYWlkJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmR1ZV9wYXltZW50JywgeyB0eXBlOiAndWludDEwMjQnLCBwYXRoOiAnZG9jLmR1ZV9wYXltZW50JyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmxhc3RfdHJhbnNfbHQnLCB7IHR5cGU6ICd1aW50NjQnLCBwYXRoOiAnZG9jLmxhc3RfdHJhbnNfbHQnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5iYWxhbmNlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmJhbGFuY2Vfb3RoZXIuY3VycmVuY3knLCB7IHR5cGU6ICdudW1iZXInLCBwYXRoOiAnZG9jLmJhbGFuY2Vfb3RoZXJbKl0uY3VycmVuY3knIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYmFsYW5jZV9vdGhlci52YWx1ZScsIHsgdHlwZTogJ3VpbnQxMDI0JywgcGF0aDogJ2RvYy5iYWxhbmNlX290aGVyWypdLnZhbHVlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLnNwbGl0X2RlcHRoJywgeyB0eXBlOiAnbnVtYmVyJywgcGF0aDogJ2RvYy5zcGxpdF9kZXB0aCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy50aWNrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudGljaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy50b2NrJywgeyB0eXBlOiAnYm9vbGVhbicsIHBhdGg6ICdkb2MudG9jaycgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5jb2RlJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5jb2RlJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmNvZGVfaGFzaCcsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MuY29kZV9oYXNoJyB9KTtcbnNjYWxhckZpZWxkcy5zZXQoJ2FjY291bnRzLmRhdGEnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmRhdGEnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuZGF0YV9oYXNoJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5kYXRhX2hhc2gnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMubGlicmFyeScsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MubGlicmFyeScgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5saWJyYXJ5X2hhc2gnLCB7IHR5cGU6ICdzdHJpbmcnLCBwYXRoOiAnZG9jLmxpYnJhcnlfaGFzaCcgfSk7XG5zY2FsYXJGaWVsZHMuc2V0KCdhY2NvdW50cy5wcm9vZicsIHsgdHlwZTogJ3N0cmluZycsIHBhdGg6ICdkb2MucHJvb2YnIH0pO1xuc2NhbGFyRmllbGRzLnNldCgnYWNjb3VudHMuYm9jJywgeyB0eXBlOiAnc3RyaW5nJywgcGF0aDogJ2RvYy5ib2MnIH0pO1xubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2NhbGFyRmllbGRzLFxuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxuICAgIE1lc3NhZ2UsXG4gICAgQWNjb3VudCxcbn07XG4iXX0=