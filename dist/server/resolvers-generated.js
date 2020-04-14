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
  block: join('id', 'id', 'blocks', () => Block),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIkRlcXVldWVTaG9ydCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJtaW5fdG90X3JvdW5kcyIsIm1heF90b3Rfcm91bmRzIiwibWluX3dpbnMiLCJtYXhfbG9zc2VzIiwibWluX3N0b3JlX3NlYyIsIm1heF9zdG9yZV9zZWMiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwiQmxvY2tNYXN0ZXJDb25maWdQMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwiQmxvY2tNYXN0ZXJDb25maWdQMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwiQmxvY2tNYXN0ZXJDb25maWdQMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwiQmxvY2tNYXN0ZXJDb25maWdQMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwiZ2FzX2xpbWl0Iiwic3BlY2lhbF9nYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiQmxvY2tMaW1pdHNCeXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiQmxvY2tMaW1pdHNHYXMiLCJCbG9ja0xpbWl0c0x0RGVsdGEiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwiZ2FzIiwibHRfZGVsdGEiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiQmxvY2tNYXN0ZXJDb25maWdQMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwiQmxvY2tNYXN0ZXJDb25maWdQMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJTdHJpbmdBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsInA3IiwicDgiLCJwOSIsInAxMCIsInAxMSIsInAxMiIsInAxNCIsInAxNSIsInAxNiIsInAxNyIsInAxOCIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInAyOSIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJpZCIsImJsb2NrIiwiQmxvY2siLCJzaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJzdGF0dXMiLCJzdGF0dXNfbmFtZSIsIlVua25vd24iLCJQcm9wb3NlZCIsIkZpbmFsaXplZCIsIlJlZnVzZWQiLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkZyb3plbiIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiTWVzc2FnZSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiUHJlbGltaW5hcnkiLCJibG9ja19pZCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJib3VuY2UiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInByb29mIiwiYm9jIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJUcmFuc2l0aW5nIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiYXJncyIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJibG9ja3MiLCJ3YWl0Rm9yRG9jIiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2NzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8s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MUJhO0FBMkJiVSxFQUFBQSxnQkEzQmE7QUE0QmJJLEVBQUFBLGNBNUJhO0FBNkJiQyxFQUFBQSxrQkE3QmE7QUE4QmJDLEVBQUFBLFdBOUJhO0FBK0JiSSxFQUFBQSxnQkEvQmE7QUFnQ2JLLEVBQUFBLG9CQWhDYTtBQWlDYk0sRUFBQUEsb0JBakNhO0FBa0NiVSxFQUFBQSxnQkFsQ2E7QUFtQ2JLLEVBQUFBLFlBbkNhO0FBb0NiSyxFQUFBQSxvQkFwQ2E7QUFxQ2JZLEVBQUFBLGlCQXJDYTtBQXNDYnFDLEVBQUFBLFdBdENhO0FBdUNiUyxFQUFBQSx5QkF2Q2E7QUF3Q2JFLEVBQUFBLGVBeENhO0FBeUNiRyxFQUFBQSxLQXpDYTtBQTBDYmdDLEVBQUFBLGtCQTFDYTtBQTJDYlEsRUFBQUEsaUJBM0NhO0FBNENiSSxFQUFBQSxrQkE1Q2E7QUE2Q2JxQixFQUFBQSxpQkE3Q2E7QUE4Q2JjLEVBQUFBLGlCQTlDYTtBQStDYlcsRUFBQUEsb0JBL0NhO0FBZ0RiTyxFQUFBQSxXQWhEYTtBQWlEYkQsRUFBQUEsT0FqRGE7QUFrRGJrRSxFQUFBQTtBQWxEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxuICAgIG1zZ19lbnZfaGFzaDogc2NhbGFyLFxuICAgIG5leHRfd29ya2NoYWluOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyX3BmeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoKCkgPT4gT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cCA9IHN0cnVjdCh7XG4gICAgbWluX3RvdF9yb3VuZHM6IHNjYWxhcixcbiAgICBtYXhfdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1pbl93aW5zOiBzY2FsYXIsXG4gICAgbWF4X2xvc3Nlczogc2NhbGFyLFxuICAgIG1pbl9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBtYXhfc3RvcmVfc2VjOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDExID0gc3RydWN0KHtcbiAgICBub3JtYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIGNyaXRpY2FsX3BhcmFtczogQ29uZmlnUHJvcG9zYWxTZXR1cCxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIGJsb2NrX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIG5ld19jYXRjaGFpbl9pZHM6IHNjYWxhcixcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheSgoKSA9PiBWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBiaWdVSW50MSxcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoKCkgPT4gc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheSgoKSA9PiBCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheSgoKSA9PiBzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTA6IEZsb2F0QXJyYXksXG4gICAgcDExOiBCbG9ja01hc3RlckNvbmZpZ1AxMSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KCgpID0+IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYmxvY2s6IGpvaW4oJ2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KCgpID0+IEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoKCkgPT4gT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoKCkgPT4gQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsICgpID0+IEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoKCkgPT4gTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBibG9jazogam9pbignYmxvY2tfaWQnLCAnaWQnLCAnYmxvY2tzJywgKCkgPT4gQmxvY2spLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnaWQnLCAnbWVzc2FnZXMnLCAoKSA9PiBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ2lkJywgJ21lc3NhZ2VzJywgKCkgPT4gTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYmxvY2s6IGpvaW4oJ2Jsb2NrX2lkJywgJ2lkJywgJ2Jsb2NrcycsICgpID0+IEJsb2NrKSxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignaWQnLCAnb3V0X21zZ3NbKl0nLCAndHJhbnNhY3Rpb25zJywgKCkgPT4gVHJhbnNhY3Rpb24pLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignaWQnLCAnaW5fbXNnJywgJ3RyYW5zYWN0aW9ucycsICgpID0+IFRyYW5zYWN0aW9uKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5leHRfYWRkcl9wZngocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5uZXh0X2FkZHJfcGZ4LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBEZXF1ZXVlU2hvcnQ6IDcsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2JsaywgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uczoge1xuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVmFsaWRhdG9yU2V0TGlzdDoge1xuICAgICAgICAgICAgd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQud2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFZhbGlkYXRvclNldDoge1xuICAgICAgICAgICAgdG90YWxfd2VpZ2h0KHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudG90YWxfd2VpZ2h0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJsb2NrKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Mud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuX2tleSwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2socGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrcy53YWl0Rm9yRG9jKHBhcmVudC5ibG9ja19pZCwgJ19rZXknKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2csICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MsICdfa2V5Jyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBibG9jayhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzLndhaXRGb3JEb2MocGFyZW50LmJsb2NrX2lkLCAnX2tleScpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbihwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5tc2dfdHlwZSAhPT0gMSA/IGNvbnRleHQuZGIudHJhbnNhY3Rpb25zLndhaXRGb3JEb2MocGFyZW50Ll9rZXksICdvdXRfbXNnc1sqXScpIDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb24ocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQubXNnX3R5cGUgIT09IDIgPyBjb250ZXh0LmRiLnRyYW5zYWN0aW9ucy53YWl0Rm9yRG9jKHBhcmVudC5fa2V5LCAnaW5fbXNnJykgOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0LCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCwgYXJncykge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCwgYXJncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQsIGFyZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50LCBhcmdzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG4gICAgTWVzc2FnZSxcbiAgICBBY2NvdW50LFxufTtcbiJdfQ==