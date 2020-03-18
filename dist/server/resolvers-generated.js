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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiYXJncyIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2MiLCJ3YWl0Rm9yRG9jcyIsImJsb2Nrc19zaWduYXR1cmVzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8sQ0FBQyxlQUFELENBWFg7O0FBWUEsTUFBTUMsYUFBYSxHQUFHUCxNQUFNLENBQUM7QUFDekJRLEVBQUFBLFFBQVEsRUFBRVosTUFEZTtBQUV6QmEsRUFBQUEsS0FBSyxFQUFFWDtBQUZrQixDQUFELENBQTVCO0FBS0EsTUFBTVksU0FBUyxHQUFHVixNQUFNLENBQUM7QUFDckJXLEVBQUFBLE1BQU0sRUFB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LEVBQUFBLG9CQXJCYTtBQXNCYkssRUFBQUEsNEJBdEJhO0FBdUJiSSxFQUFBQSxtQkF2QmE7QUF3QmJHLEVBQUFBLG1CQXhCYTtBQXlCYkMsRUFBQUEsbUJBekJhO0FBMEJiRyxFQUFBQSxtQkExQmE7QUEyQmJTLEVBQUFBLG9CQTNCYTtBQTRCYkcsRUFBQUEsb0JBNUJhO0FBNkJiZ0IsRUFBQUEsb0JBN0JhO0FBOEJiRyxFQUFBQSxvQkE5QmE7QUErQmJLLEVBQUFBLG9CQS9CYTtBQWdDYkksRUFBQUEsb0JBaENhO0FBaUNiSyxFQUFBQSxvQkFqQ2E7QUFrQ2JNLEVBQUFBLG9CQWxDYTtBQW1DYkssRUFBQUEsb0JBbkNhO0FBb0NiUyxFQUFBQSxvQkFwQ2E7QUFxQ2JPLEVBQUFBLGVBckNhO0FBc0NiUSxFQUFBQSxnQkF0Q2E7QUF1Q2JJLEVBQUFBLGNBdkNhO0FBd0NiQyxFQUFBQSxrQkF4Q2E7QUF5Q2JDLEVBQUFBLFdBekNhO0FBMENiSSxFQUFBQSxnQkExQ2E7QUEyQ2JLLEVBQUFBLGdCQTNDYTtBQTRDYkksRUFBQUEsWUE1Q2E7QUE2Q2JVLEVBQUFBLGlCQTdDYTtBQThDYm9DLEVBQUFBLFdBOUNhO0FBK0NiUyxFQUFBQSx5QkEvQ2E7QUFnRGJFLEVBQUFBLGVBaERhO0FBaURiSyxFQUFBQSxLQWpEYTtBQWtEYm9CLEVBQUFBO0FBbERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KCgpID0+IE90aGVyQ3VycmVuY3kpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoKCkgPT4gTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwID0gc3RydWN0KHtcbiAgICBtaW5fdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1heF90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWluX3dpbnM6IHNjYWxhcixcbiAgICBtYXhfbG9zc2VzOiBzY2FsYXIsXG4gICAgbWluX3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIG1heF9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTEgPSBzdHJ1Y3Qoe1xuICAgIG5vcm1hbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgY3JpdGljYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KCgpID0+IFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTE6IEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KCgpID0+IEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsICgpID0+IEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDEgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnb3V0X21zZ3NbKl0nKSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Lm1zZ190eXBlICE9PSAyID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ2luX21zZycpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbn07XG4iXX0=