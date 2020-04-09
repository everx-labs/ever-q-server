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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRnJvemVuIiwiRGVsZXRlZCIsIk90aGVyQ3VycmVuY3lBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiU3RyaW5nQXJyYXkiLCJNZXNzYWdlQXJyYXkiLCJNZXNzYWdlIiwiVHJhbnNhY3Rpb24iLCJpZCIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiYmxvY2tfaWQiLCJhY2NvdW50X2FkZHIiLCJ3b3JrY2hhaW5faWQiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsInRyYW5zYWN0aW9ucyIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0X3R5cGVfbmFtZSIsIlNwbGl0IiwiTWVyZ2UiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkJsb2NrTWFzdGVyQ29uZmlnUDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQNyIsIkJsb2NrTWFzdGVyQ29uZmlnUDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1AxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTAiLCJwMTEiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiYXJncyIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2MiLCJ3YWl0Rm9yRG9jcyIsImJsb2Nrc19zaWduYXR1cmVzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8sQ0FBQyxlQUFELENBWFg7O0FBWUEsTUFBTUMsYUFBYSxHQUFHUCxNQUFNLENBQUM7QUFD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QyxFQUFBQSxtQkF6QmE7QUEwQmJHLEVBQUFBLG1CQTFCYTtBQTJCYlMsRUFBQUEsb0JBM0JhO0FBNEJiRyxFQUFBQSxvQkE1QmE7QUE2QmJnQixFQUFBQSxvQkE3QmE7QUE4QmJHLEVBQUFBLG9CQTlCYTtBQStCYkssRUFBQUEsb0JBL0JhO0FBZ0NiSSxFQUFBQSxvQkFoQ2E7QUFpQ2JLLEVBQUFBLG9CQWpDYTtBQWtDYk0sRUFBQUEsb0JBbENhO0FBbUNiSyxFQUFBQSxvQkFuQ2E7QUFvQ2JTLEVBQUFBLG9CQXBDYTtBQXFDYk8sRUFBQUEsZUFyQ2E7QUFzQ2JRLEVBQUFBLGdCQXRDYTtBQXVDYkksRUFBQUEsY0F2Q2E7QUF3Q2JDLEVBQUFBLGtCQXhDYTtBQXlDYkMsRUFBQUEsV0F6Q2E7QUEwQ2JJLEVBQUFBLGdCQTFDYTtBQTJDYkssRUFBQUEsZ0JBM0NhO0FBNENiSSxFQUFBQSxZQTVDYTtBQTZDYlUsRUFBQUEsaUJBN0NhO0FBOENicUMsRUFBQUEsV0E5Q2E7QUErQ2JTLEVBQUFBLHlCQS9DYTtBQWdEYkUsRUFBQUEsZUFoRGE7QUFpRGJLLEVBQUFBLEtBakRhO0FBa0Ric0IsRUFBQUE7QUFsRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgRGVxdWV1ZVNob3J0OiA3LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbiAgICBtc2dfZW52X2hhc2g6IHNjYWxhcixcbiAgICBuZXh0X3dvcmtjaGFpbjogc2NhbGFyLFxuICAgIG5leHRfYWRkcl9wZng6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KCgpID0+IE90aGVyQ3VycmVuY3kpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoKCkgPT4gTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdpZCcsICdtZXNzYWdlcycsICgpID0+IE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdvdXRfbXNnc1sqXScsICd0cmFuc2FjdGlvbnMnLCAoKSA9PiBUcmFuc2FjdGlvbiksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdpZCcsICdpbl9tc2cnLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwID0gc3RydWN0KHtcbiAgICBtaW5fdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1heF90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWluX3dpbnM6IHNjYWxhcixcbiAgICBtYXhfbG9zc2VzOiBzY2FsYXIsXG4gICAgbWluX3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIG1heF9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTEgPSBzdHJ1Y3Qoe1xuICAgIG5vcm1hbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgY3JpdGljYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogYmlnVUludDEsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoKCkgPT4gVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogYmlnVUludDEsXG4gICAgbGlzdDogVmFsaWRhdG9yU2V0TGlzdEFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KCgpID0+IHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDE4KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AzOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgcDA6IHNjYWxhcixcbiAgICBwMTogc2NhbGFyLFxuICAgIHAyOiBzY2FsYXIsXG4gICAgcDM6IHNjYWxhcixcbiAgICBwNDogc2NhbGFyLFxuICAgIHA2OiBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIHA3OiBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXksXG4gICAgcDg6IEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgcDk6IEZsb2F0QXJyYXksXG4gICAgcDEwOiBGbG9hdEFycmF5LFxuICAgIHAxMTogQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheSgoKSA9PiBPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgKCkgPT4gQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5leHRfYWRkcl9wZngocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5uZXh0X2FkZHJfcGZ4LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncywgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMSA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDIgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnaW5fbXNnJykgOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uczoge1xuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0TGlzdDoge1xuICAgICAgICAgICAgd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQud2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFZhbGlkYXRvclNldDoge1xuICAgICAgICAgICAgdG90YWxfd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudG90YWxfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTEsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbn07XG4iXX0=