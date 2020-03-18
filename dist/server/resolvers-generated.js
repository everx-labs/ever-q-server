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
        return parent.msg_type !== 1 ? context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]') : null;
      },

      dst_transaction(parent, _args, context) {
        return parent.msg_type !== 2 ? context.db.transactions.waitForDoc(parent._key, 'in_msg') : null;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsIm1lc3NhZ2VzIiwid2FpdEZvckRvYyIsIndhaXRGb3JEb2NzIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFNO0FBQ0ZBLEVBQUFBLE1BREU7QUFFRkMsRUFBQUEsUUFGRTtBQUdGQyxFQUFBQSxRQUhFO0FBSUZDLEVBQUFBLGNBSkU7QUFLRkMsRUFBQUEsTUFMRTtBQU1GQyxFQUFBQSxLQU5FO0FBT0ZDLEVBQUFBLElBUEU7QUFRRkMsRUFBQUEsU0FSRTtBQVNGQyxFQUFBQSxRQVRFO0FBVUZDLEVBQUFBO0FBVkUsSUFXRkMsT0FBTyxDQUFDLGVBQUQsQ0FYWDs7QUFZQSxNQUFNQyxhQUFhLEdBQUdQLE1BQU0sQ0FBQztBQUN6QlEsRUFBQUEsUUFBUSxFQUFFWixNQURlO0FBRXpCYSxFQUFBQSxLQUFLLEVBQUVYO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxNQUFNWSxTQUFTLEdBQUdWLE1BQU0sQ0FBQztBQUNyQlcsRUFBQUEsTUFBTSxFQUFFZCxRQURh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Q2JJLEVBQUFBLGNBdkNhO0FBd0NiQyxFQUFBQSxrQkF4Q2E7QUF5Q2JDLEVBQUFBLFdBekNhO0FBMENiSSxFQUFBQSxnQkExQ2E7QUEyQ2JLLEVBQUFBLGdCQTNDYTtBQTRDYkksRUFBQUEsWUE1Q2E7QUE2Q2JVLEVBQUFBLGlCQTdDYTtBQThDYm9DLEVBQUFBLFdBOUNhO0FBK0NiUyxFQUFBQSx5QkEvQ2E7QUFnRGJFLEVBQUFBLGVBaERhO0FBaURiSyxFQUFBQSxLQWpEYTtBQWtEYm9CLEVBQUFBO0FBbERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KCgpID0+IE90aGVyQ3VycmVuY3kpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoKCkgPT4gTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwID0gc3RydWN0KHtcbiAgICBtaW5fdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1heF90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWluX3dpbnM6IHNjYWxhcixcbiAgICBtYXhfbG9zc2VzOiBzY2FsYXIsXG4gICAgbWluX3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIG1heF9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTEgPSBzdHJ1Y3Qoe1xuICAgIG5vcm1hbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgY3JpdGljYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KCgpID0+IFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTE6IEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KCgpID0+IEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsICgpID0+IEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDEgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnb3V0X21zZ3NbKl0nKSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Lm1zZ190eXBlICE9PSAyID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ2luX21zZycpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbn07XG4iXX0=