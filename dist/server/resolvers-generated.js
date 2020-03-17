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
  weight: scalar,
  adnl_addr: scalar
});
const ValidatorSetListArray = array(() => ValidatorSetList);
const ValidatorSet = struct({
  utime_since: scalar,
  utime_until: scalar,
  total: scalar,
  total_weight: scalar,
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
      value(parent) {
        return resolveBigUInt(2, parent.value);
      }

    },
    ExtBlkRef: {
      end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }

    },
    MsgEnvelope: {
      fwd_fee_remaining(parent) {
        return resolveBigUInt(2, parent.fwd_fee_remaining);
      }

    },
    InMsg: {
      ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },

      fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },

      transit_fee(parent) {
        return resolveBigUInt(2, parent.transit_fee);
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
      import_block_lt(parent) {
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
    TransactionStorage: {
      storage_fees_collected(parent) {
        return resolveBigUInt(2, parent.storage_fees_collected);
      },

      storage_fees_due(parent) {
        return resolveBigUInt(2, parent.storage_fees_due);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionCredit: {
      due_fees_collected(parent) {
        return resolveBigUInt(2, parent.due_fees_collected);
      },

      credit(parent) {
        return resolveBigUInt(2, parent.credit);
      }

    },
    TransactionCompute: {
      gas_fees(parent) {
        return resolveBigUInt(2, parent.gas_fees);
      },

      gas_used(parent) {
        return resolveBigUInt(1, parent.gas_used);
      },

      gas_limit(parent) {
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
      total_fwd_fees(parent) {
        return resolveBigUInt(2, parent.total_fwd_fees);
      },

      total_action_fees(parent) {
        return resolveBigUInt(2, parent.total_action_fees);
      },

      status_change_name: createEnumNameResolver('status_change', {
        Unchanged: 0,
        Frozen: 1,
        Deleted: 2
      })
    },
    TransactionBounce: {
      req_fwd_fees(parent) {
        return resolveBigUInt(2, parent.req_fwd_fees);
      },

      msg_fees(parent) {
        return resolveBigUInt(2, parent.msg_fees);
      },

      fwd_fees(parent) {
        return resolveBigUInt(2, parent.fwd_fees);
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

      lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },

      prev_trans_lt(parent) {
        return resolveBigUInt(1, parent.prev_trans_lt);
      },

      total_fees(parent) {
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
    Message: {
      id(parent) {
        return parent._key;
      },

      src_transaction(parent, _args, context) {
        return context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]');
      },

      dst_transaction(parent, _args, context) {
        return context.db.transactions.waitForDoc(parent._key, 'in_msg');
      },

      created_lt(parent) {
        return resolveBigUInt(1, parent.created_lt);
      },

      ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },

      fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },

      import_fee(parent) {
        return resolveBigUInt(2, parent.import_fee);
      },

      value(parent) {
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
      to_next_blk(parent) {
        return resolveBigUInt(2, parent.to_next_blk);
      },

      exported(parent) {
        return resolveBigUInt(2, parent.exported);
      },

      fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },

      created(parent) {
        return resolveBigUInt(2, parent.created);
      },

      imported(parent) {
        return resolveBigUInt(2, parent.imported);
      },

      from_prev_blk(parent) {
        return resolveBigUInt(2, parent.from_prev_blk);
      },

      minted(parent) {
        return resolveBigUInt(2, parent.minted);
      },

      fees_imported(parent) {
        return resolveBigUInt(2, parent.fees_imported);
      }

    },
    BlockAccountBlocksTransactions: {
      lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },

      total_fees(parent) {
        return resolveBigUInt(2, parent.total_fees);
      }

    },
    BlockMasterShardHashesDescr: {
      start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },

      end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      },

      fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },

      funds_created(parent) {
        return resolveBigUInt(2, parent.funds_created);
      },

      split_type_name: createEnumNameResolver('split_type', {
        None: 0,
        Split: 2,
        Merge: 3
      })
    },
    BlockMasterShardFees: {
      fees(parent) {
        return resolveBigUInt(2, parent.fees);
      },

      create(parent) {
        return resolveBigUInt(2, parent.create);
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

      start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },

      end_lt(parent) {
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
      id(parent) {
        return parent._key;
      },

      due_payment(parent) {
        return resolveBigUInt(2, parent.due_payment);
      },

      last_trans_lt(parent) {
        return resolveBigUInt(1, parent.last_trans_lt);
      },

      balance(parent) {
        return resolveBigUInt(2, parent.balance);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsIm1lc3NhZ2VzIiwid2FpdEZvckRvYyIsIndhaXRGb3JEb2NzIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFNO0FBQ0ZBLEVBQUFBLE1BREU7QUFFRkMsRUFBQUEsUUFGRTtBQUdGQyxFQUFBQSxRQUhFO0FBSUZDLEVBQUFBLGNBSkU7QUFLRkMsRUFBQUEsTUFMRTtBQU1GQyxFQUFBQSxLQU5FO0FBT0ZDLEVBQUFBLElBUEU7QUFRRkMsRUFBQUEsU0FSRTtBQVNGQyxFQUFBQSxRQVRFO0FBVUZDLEVBQUFBO0FBVkUsSUFXRkMsT0FBTyxDQUFDLGVBQUQsQ0FYWDs7QUFZQSxNQUFNQyxhQUFhLEdBQUdQLE1BQU0sQ0FBQztBQUN6QlEsRUFBQUEsUUFBUSxFQUFFWixNQURlO0FBRXpCYSxFQUFBQSxLQUFLLEVBQUVYO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxNQUFNWSxTQUFTLEdBQUdWLE1BQU0sQ0FBQztBQUNyQlcsRUFBQUEsTUFBTSxFQUFFZCxRQURh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SSxFQUFBQSxZQTVDYTtBQTZDYlUsRUFBQUEsaUJBN0NhO0FBOENib0MsRUFBQUEsV0E5Q2E7QUErQ2JTLEVBQUFBLHlCQS9DYTtBQWdEYkUsRUFBQUEsZUFoRGE7QUFpRGJLLEVBQUFBLEtBakRhO0FBa0Rib0IsRUFBQUE7QUFsRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheSgoKSA9PiBNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ291dF9tc2dzWypdJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ2luX21zZycsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXAgPSBzdHJ1Y3Qoe1xuICAgIG1pbl90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWF4X3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtaW5fd2luczogc2NhbGFyLFxuICAgIG1heF9sb3NzZXM6IHNjYWxhcixcbiAgICBtaW5fc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgbWF4X3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMSA9IHN0cnVjdCh7XG4gICAgbm9ybWFsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBjcml0aWNhbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoKCkgPT4gVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMTogQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheSgoKSA9PiBPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgKCkgPT4gQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdpbl9tc2cnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbn07XG4iXX0=