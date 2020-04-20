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
  createEnumNameResolver
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
  min_stake: scalar,
  max_stake: scalar,
  min_total_stake: scalar,
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
  data: scalar,
  library: scalar,
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
    ValidatorSetList: {
      weight(parent, args) {
        return resolveBigUInt(1, parent.weight, args);
      }

    },
    ValidatorSet: {
      total_weight(parent, args) {
        return resolveBigUInt(1, parent.total_weight, args);
      }

    },
    BlockSignatures: {
      id(parent) {
        return parent._key;
      },

      block(parent, _args, context) {
        return context.db.blocks.waitForDoc(parent._key, '_key');
      },

      sig_weight(parent, args) {
        return resolveBigUInt(1, parent.sig_weight, args);
      }

    },
    Block: {
      id(parent) {
        return parent._key;
      },

      signatures(parent, _args, context) {
        return context.db.blocks_signatures.waitForDoc(parent._key, '_key');
      },

      start_lt(parent, args) {
        return resolveBigUInt(1, parent.start_lt, args);
      },

      end_lt(parent, args) {
        return resolveBigUInt(1, parent.end_lt, args);
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

      block(parent, _args, context) {
        return context.db.blocks.waitForDoc(parent.block_id, '_key');
      },

      in_message(parent, _args, context) {
        return context.db.messages.waitForDoc(parent.in_msg, '_key');
      },

      out_messages(parent, _args, context) {
        return context.db.messages.waitForDocs(parent.out_msgs, '_key');
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

      block(parent, _args, context) {
        return context.db.blocks.waitForDoc(parent.block_id, '_key');
      },

      src_transaction(parent, _args, context) {
        return parent.msg_type !== 1 ? context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]') : null;
      },

      dst_transaction(parent, _args, context) {
        return parent.msg_type !== 2 ? context.db.transactions.waitForDoc(parent._key, 'in_msg') : null;
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

module.exports = {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJtaW5fdG90X3JvdW5kcyIsIm1heF90b3Rfcm91bmRzIiwibWluX3dpbnMiLCJtYXhfbG9zc2VzIiwibWluX3N0b3JlX3NlYyIsIm1heF9zdG9yZV9zZWMiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwiQmxvY2tNYXN0ZXJDb25maWdQMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwiQmxvY2tNYXN0ZXJDb25maWdQMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwiQmxvY2tNYXN0ZXJDb25maWdQMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwiZ2FzX2xpbWl0Iiwic3BlY2lhbF9nYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiQmxvY2tMaW1pdHNCeXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiQmxvY2tMaW1pdHNHYXMiLCJCbG9ja0xpbWl0c0x0RGVsdGEiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwiZ2FzIiwibHRfZGVsdGEiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiQmxvY2tNYXN0ZXJDb25maWdQMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwiQmxvY2tNYXN0ZXJDb25maWdQMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJTdHJpbmdBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsInA3IiwicDgiLCJwOSIsInAxMCIsInAxMSIsInAxMiIsInAxNCIsInAxNSIsInAxNiIsInAxNyIsInAxOCIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInAyOSIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsInByb29mIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJibG9jayIsIkJsb2NrIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkZyb3plbiIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiTWVzc2FnZSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiUHJlbGltaW5hcnkiLCJibG9ja19pZCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImJvYyIsIkludGVybmFsIiwiRXh0SW4iLCJFeHRPdXQiLCJRdWV1ZWQiLCJQcm9jZXNzaW5nIiwiVHJhbnNpdGluZyIsImJvZHkiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5Iiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzIiwid2FpdEZvckRvYyIsImJsb2Nrc19zaWduYXR1cmVzIiwibWVzc2FnZXMiLCJ3YWl0Rm9yRG9jcyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU07QUFDRkEsRUFBQUEsTUFERTtBQUVGQyxFQUFBQSxRQUZFO0FBR0ZDLEVBQUFBLFFBSEU7QUFJRkMsRUFBQUEsY0FKRTtBQUtGQyxFQUFBQSxNQUxFO0FBTUZDLEVBQUFBLEtBTkU7QUFPRkMsRUFBQUEsSUFQRTtBQVFG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dXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxuICAgIG1zZ19lbnZfaGFzaDogc2NhbGFyLFxuICAgIG5leHRfd29ya2NoYWluOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyX3BmeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIGJsb2NrX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIG5ld19jYXRjaGFpbl9pZHM6IHNjYWxhcixcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheSgoKSA9PiBWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTA6IEZsb2F0QXJyYXksXG4gICAgcDExOiBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBzaWdfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG4gICAgYmxvY2s6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheSgoKSA9PiBPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgKCkgPT4gQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheSgoKSA9PiBNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJsb2NrOiBqb2luKCdibG9ja19pZCcsICdpZCcsICdibG9ja3MnLCAoKSA9PiBCbG9jayksXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF9hZGRyX3BmeChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfYWRkcl9wZngsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXRMaXN0OiB7XG4gICAgICAgICAgICB3ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC53ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0OiB7XG4gICAgICAgICAgICB0b3RhbF93ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50b3RhbF93ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ193ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zaWdfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5ibG9ja19pZCwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzLndhaXRGb3JEb2MocGFyZW50LmJsb2NrX2lkLCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMSA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDIgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnaW5fbXNnJykgOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG4gICAgTWVzc2FnZSxcbiAgICBBY2NvdW50LFxufTtcbiJdfQ==