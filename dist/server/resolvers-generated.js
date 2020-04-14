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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsIm5ld19jYXRjaGFpbl9pZHMiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJCbG9ja01hc3RlckNvbmZpZ1AzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwicDciLCJwOCIsInA5IiwicDEwIiwicDExIiwicDEyIiwicDE0IiwicDE1IiwicDE2IiwicDE3IiwicDE4IiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwicDI5IiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwibWluX3NoYXJkX2dlbl91dGltZSIsIm1heF9zaGFyZF9nZW5fdXRpbWUiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImFyZ3MiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwibWVzc2FnZXMiLCJ3YWl0Rm9yRG9jIiwid2FpdEZvckRvY3MiLCJibG9ja3Nfc2lnbmF0dXJlcyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU07QUFDRkEsRUFBQUEsTUFERTtBQUVGQyxFQUFBQSxRQUZFO0FBR0ZDLEVBQUFBLFFBSEU7QUFJRkMsRUFBQUEsY0FKRTtBQUtGQyxFQUFBQSxNQUxFO0FBTUZDLEVBQUFBLEtBTkU7QUFPRkMsRUFBQUEsSUFQRTtBQVFGQyxFQUFBQSxTQVJFO0FBU0ZDLEVBQUFBLFFBVEU7QUFVRkMsRUFBQUE7QUFWRSxJQVdGQyxPQUFPLENBQUMsZUFB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QmE7QUFvQmJvQixFQUFBQSxzQkFwQmE7QUFxQmJHLEVBQUFBLG9CQXJCYTtBQXNCYkssRUFBQUEsNEJBdEJhO0FBdUJiSSxFQUFBQSxtQkF2QmE7QUF3QmJHLEVBQUFBLG1CQXhCYTtBQXlCYkMsRUFBQUEsbUJBekJhO0FBMEJiRyxFQUFBQSxtQkExQmE7QUEyQmJTLEVBQUFBLG9CQTNCYTtBQTRCYkcsRUFBQUEsb0JBNUJhO0FBNkJiZ0IsRUFBQUEsb0JBN0JhO0FBOEJiRyxFQUFBQSxvQkE5QmE7QUErQmJLLEVBQUFBLG9CQS9CYTtBQWdDYkksRUFBQUEsb0JBaENhO0FBaUNiSyxFQUFBQSxvQkFqQ2E7QUFrQ2JNLEVBQUFBLG9CQWxDYTtBQW1DYk0sRUFBQUEsb0JBbkNhO0FBb0NiVSxFQUFBQSxvQkFwQ2E7QUFxQ2JPLEVBQUFBLGVBckNhO0FBc0NiUSxFQUFBQSxnQkF0Q2E7QUF1Q2JJLEVBQUFBLGNBdkNhO0FBd0NiQyxFQUFBQSxrQkF4Q2E7QUF5Q2JDLEVBQUFBLFdBekNhO0FBMENiSSxFQUFBQSxnQkExQ2E7QUEyQ2JLLEVBQUFBLGdCQTNDYTtBQTRDYkksRUFBQUEsWUE1Q2E7QUE2Q2JVLEVBQUFBLGlCQTdDYTtBQThDYnFDLEVBQUFBLFdBOUNhO0FBK0NiUyxFQUFBQSx5QkEvQ2E7QUFnRGJFLEVBQUFBLGVBaERhO0FBaURiSyxFQUFBQSxLQWpEYTtBQWtEYnNCLEVBQUFBO0FBbERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG4gICAgbXNnX2Vudl9oYXNoOiBzY2FsYXIsXG4gICAgbmV4dF93b3JrY2hhaW46IHNjYWxhcixcbiAgICBuZXh0X2FkZHJfcGZ4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheSgoKSA9PiBPdGhlckN1cnJlbmN5KTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KCgpID0+IE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignaWQnLCAnb3V0X21zZ3NbKl0nLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignaWQnLCAnaW5fbXNnJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgc2h1ZmZsZV9tY192YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICBuZXdfY2F0Y2hhaW5faWRzOiBzY2FsYXIsXG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheSgoKSA9PiBWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTA6IEZsb2F0QXJyYXksXG4gICAgcDExOiBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheSgoKSA9PiBJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KCgpID0+IE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCAoKSA9PiBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF9hZGRyX3BmeChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfYWRkcl9wZngsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIERlcXVldWVTaG9ydDogNywgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvYyhwYXJlbnQuaW5fbXNnLCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvY3MocGFyZW50Lm91dF9tc2dzLCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Lm1zZ190eXBlICE9PSAxID8gY29udGV4dC5kYi50cmFuc2FjdGlvbnMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ291dF9tc2dzWypdJykgOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMiA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdpbl9tc2cnKSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGssIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBWYWxpZGF0b3JTZXRMaXN0OiB7XG4gICAgICAgICAgICB3ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC53ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0OiB7XG4gICAgICAgICAgICB0b3RhbF93ZWlnaHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50b3RhbF93ZWlnaHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxufTtcbiJdfQ==