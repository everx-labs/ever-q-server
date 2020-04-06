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
    None: -1
  }),
  msg_id: scalar,
  transaction_id: scalar,
  out_msg: MsgEnvelope,
  reimport: InMsg,
  imported: InMsg,
  import_block_lt: bigUInt1
});
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
const OtherCurrencyArray = array(() => OtherCurrency);
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
const StringArray = array(() => scalar);
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
const BlockMasterConfigP28 = struct({
  mc_catchain_lifetime: scalar,
  shard_catchain_lifetime: scalar,
  shard_validators_lifetime: scalar,
  shard_validators_num: scalar
});
const BlockMasterConfigP29 = struct({
  round_candidates: scalar,
  next_candidate_delay_ms: scalar,
  consensus_timeout_ms: scalar,
  fast_attempts: scalar,
  attempt_duration: scalar,
  catchain_max_deps: scalar,
  max_block_bytes: scalar,
  max_collated_bytes: scalar
});
const BlockMasterConfigP39 = struct({
  adnl_addr: scalar,
  temp_public_key: scalar,
  seqno: scalar,
  valid_until: scalar,
  signature_r: scalar,
  signature_s: scalar
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
const BlockMasterConfigP7Array = array(() => BlockMasterConfigP7);
const FloatArray = array(() => scalar);
const BlockMasterConfigP12Array = array(() => BlockMasterConfigP12);
const BlockMasterConfigP18Array = array(() => BlockMasterConfigP18);
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
  signatures: BlockSignaturesSignaturesArray
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
      transactions: db.transactions.queryResolver(),
      messages: db.messages.queryResolver(),
      blocks_signatures: db.blocks_signatures.queryResolver(),
      blocks: db.blocks.queryResolver(),
      accounts: db.accounts.queryResolver()
    },
    Subscription: {
      transactions: db.transactions.subscriptionResolver(),
      messages: db.messages.subscriptionResolver(),
      blocks_signatures: db.blocks_signatures.subscriptionResolver(),
      blocks: db.blocks.subscriptionResolver(),
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
  TransactionStorage,
  TransactionCredit,
  TransactionCompute,
  TransactionAction,
  TransactionBounce,
  TransactionSplitInfo,
  Transaction,
  Message,
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
  BlockMasterConfigP28,
  BlockMasterConfigP29,
  BlockMasterConfigP39,
  GasLimitsPrices,
  BlockLimitsBytes,
  BlockLimitsGas,
  BlockLimitsLtDelta,
  BlockLimits,
  MsgForwardPrices,
  ValidatorSetList,
  ValidatorSet,
  BlockMasterConfig,
  BlockMaster,
  BlockSignaturesSignatures,
  BlockSignatures,
  Block,
  Account
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTAiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiYXJncyIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2MiLCJ3YWl0Rm9yRG9jcyIsImJsb2Nrc19zaWduYXR1cmVzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8sQ0FBQyxlQUFELENBWFg7O0FBWUEsTUFBTUMsYUFBYSxHQUFHUCxNQUFNLENBQUM7QUFDekJRLEVBQUFBLFFBQVEsRUFBRVosTUFEZTtBQUV6QmEsRUFBQUEsS0FBSyxFQUFFWDtBQUZrQixDQUFELENB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QUEsZ0JBMUNhO0FBMkNiSyxFQUFBQSxnQkEzQ2E7QUE0Q2JJLEVBQUFBLFlBNUNhO0FBNkNiVSxFQUFBQSxpQkE3Q2E7QUE4Q2JxQyxFQUFBQSxXQTlDYTtBQStDYlMsRUFBQUEseUJBL0NhO0FBZ0RiRSxFQUFBQSxlQWhEYTtBQWlEYkssRUFBQUEsS0FqRGE7QUFrRGJzQixFQUFBQTtBQWxEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheSgoKSA9PiBPdGhlckN1cnJlbmN5KTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KCgpID0+IE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignaWQnLCAnb3V0X21zZ3NbKl0nLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignaWQnLCAnaW5fbXNnJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOSA9IHN0cnVjdCh7XG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG4gICAgdGVtcF9wdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgc2Vxbm86IHNjYWxhcixcbiAgICB2YWxpZF91bnRpbDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9yOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIGJsb2NrX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3QgPSBzdHJ1Y3Qoe1xuICAgIHB1YmxpY19rZXk6IHNjYWxhcixcbiAgICB3ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KCgpID0+IFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IGJpZ1VJbnQxLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMDogRmxvYXRBcnJheSxcbiAgICBwMTE6IEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KCgpID0+IEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsICgpID0+IEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDEgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnb3V0X21zZ3NbKl0nKSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Lm1zZ190eXBlICE9PSAyID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ2luX21zZycpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFZhbGlkYXRvclNldExpc3Q6IHtcbiAgICAgICAgICAgIHdlaWdodChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LndlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXQ6IHtcbiAgICAgICAgICAgIHRvdGFsX3dlaWdodChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRvdGFsX3dlaWdodCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnQsXG59O1xuIl19