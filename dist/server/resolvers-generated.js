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
        return context.db.transactions.waitForDoc(parent._key, 'out_msgs[*]');
      },

      dst_transaction(parent, _args, context) {
        return context.db.transactions.waitForDoc(parent._key, 'in_msg');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiYXJncyIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2MiLCJ3YWl0Rm9yRG9jcyIsImJsb2Nrc19zaWduYXR1cmVzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8sQ0FBQyxlQUFELENBWFg7O0FBWUEsTUFBTUMsYUFBYSxHQUFHUCxNQUFNLENBQUM7QUFDekJRLEVBQUFBLFFBQVEsRUFBRVosTUFEZTtBQUV6QmEsRUFBQUEsS0FBSyxFQUFFWDtBQUZrQixDQUFELENBQTVCO0FBS0EsTUFBTVksU0FBUyxHQUFHVixNQUFNLENBQUM7QUFDckJXLEVBQUFBLE1BQU0sRUFB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LEVBQUFBLG1CQTFCYTtBQTJCYlMsRUFBQUEsb0JBM0JhO0FBNEJiRyxFQUFBQSxvQkE1QmE7QUE2QmJnQixFQUFBQSxvQkE3QmE7QUE4QmJHLEVBQUFBLG9CQTlCYTtBQStCYkssRUFBQUEsb0JBL0JhO0FBZ0NiSSxFQUFBQSxvQkFoQ2E7QUFpQ2JLLEVBQUFBLG9CQWpDYTtBQWtDYk0sRUFBQUEsb0JBbENhO0FBbUNiSyxFQUFBQSxvQkFuQ2E7QUFvQ2JTLEVBQUFBLG9CQXBDYTtBQXFDYk8sRUFBQUEsZUFyQ2E7QUFzQ2JRLEVBQUFBLGdCQXRDYTtBQXVDYkksRUFBQUEsY0F2Q2E7QUF3Q2JDLEVBQUFBLGtCQXhDYTtBQXlDYkMsRUFBQUEsV0F6Q2E7QUEwQ2JJLEVBQUFBLGdCQTFDYTtBQTJDYkssRUFBQUEsZ0JBM0NhO0FBNENiSSxFQUFBQSxZQTVDYTtBQTZDYlUsRUFBQUEsaUJBN0NhO0FBOENib0MsRUFBQUEsV0E5Q2E7QUErQ2JTLEVBQUFBLHlCQS9DYTtBQWdEYkUsRUFBQUEsZUFoRGE7QUFpRGJLLEVBQUFBLEtBakRhO0FBa0Rib0IsRUFBQUE7QUFsRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheSgoKSA9PiBNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ291dF9tc2dzWypdJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ2lkJywgJ2luX21zZycsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXAgPSBzdHJ1Y3Qoe1xuICAgIG1pbl90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWF4X3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtaW5fd2luczogc2NhbGFyLFxuICAgIG1heF9sb3NzZXM6IHNjYWxhcixcbiAgICBtaW5fc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgbWF4X3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMSA9IHN0cnVjdCh7XG4gICAgbm9ybWFsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBjcml0aWNhbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoKCkgPT4gVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMTogQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheSgoKSA9PiBPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgKCkgPT4gQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdpbl9tc2cnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbn07XG4iXX0=