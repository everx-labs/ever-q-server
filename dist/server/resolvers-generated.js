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
  msg: scalar,
  transaction: scalar,
  ihr_fee: bigUInt2,
  proof_created: scalar,
  in_msg: MsgEnvelope,
  fwd_fee: bigUInt2,
  out_msg: MsgEnvelope,
  transit_fee: bigUInt2,
  transaction_id: bigUInt1,
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
const OtherCurrencyArray = array(OtherCurrency);
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
  boc: scalar
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
const BlockAccountBlocksTransactionsArray = array(BlockAccountBlocksTransactions);
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
const ValidatorSetListArray = array(ValidatorSetList);
const ValidatorSet = struct({
  utime_since: scalar,
  utime_until: scalar,
  total: scalar,
  total_weight: scalar,
  list: ValidatorSetListArray
});
const BlockMasterConfigP7Array = array(BlockMasterConfigP7);
const FloatArray = array(scalar);
const BlockMasterConfigP12Array = array(BlockMasterConfigP12);
const BlockMasterConfigP18Array = array(BlockMasterConfigP18);
const StringArray = array(scalar);
const BlockMasterConfigP39Array = array(BlockMasterConfigP39);
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
const BlockMasterShardHashesArray = array(BlockMasterShardHashes);
const BlockMasterShardFeesArray = array(BlockMasterShardFees);
const BlockMasterPrevBlkSignaturesArray = array(BlockMasterPrevBlkSignatures);
const BlockMaster = struct({
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
const BlockSignaturesSignaturesArray = array(BlockSignaturesSignatures);
const BlockSignatures = struct({
  id: scalar,
  signatures: BlockSignaturesSignaturesArray
}, true);
const InMsgArray = array(InMsg);
const OutMsgArray = array(OutMsg);
const BlockAccountBlocksArray = array(BlockAccountBlocks);
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
  signatures: join('id', 'blocks_signatures', BlockSignatures)
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
const MessageArray = array(Message);
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
  in_message: join('in_msg', 'messages', Message),
  out_msgs: StringArray,
  out_messages: joinArray('out_msgs', 'messages', Message),
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

      transaction_id(parent) {
        return resolveBigUInt(1, parent.transaction_id);
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
    Message: {
      id(parent) {
        return parent._key;
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
        return context.db.blocks_signatures.fetchDocByKey(parent.id);
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
        return context.db.messages.fetchDocByKey(parent.in_msg);
      },

      out_messages(parent, _args, context) {
        return context.db.messages.fetchDocsByKeys(parent.out_msgs);
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
    Query: {
      messages: db.messages.queryResolver(),
      blocks_signatures: db.blocks_signatures.queryResolver(),
      blocks: db.blocks.queryResolver(),
      accounts: db.accounts.queryResolver(),
      transactions: db.transactions.queryResolver()
    },
    Subscription: {
      messages: db.messages.subscriptionResolver(),
      blocks_signatures: db.blocks_signatures.subscriptionResolver(),
      blocks: db.blocks.subscriptionResolver(),
      accounts: db.accounts.subscriptionResolver(),
      transactions: db.transactions.subscriptionResolver()
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
  Account,
  TransactionStorage,
  TransactionCredit,
  TransactionCompute,
  TransactionAction,
  TransactionBounce,
  TransactionSplitInfo,
  Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFNO0FBQ0ZBLEVBQUFBLE1BREU7QUFFRkMsRUFBQUEsUUFGRTtBQUdGQyxFQUFBQSxRQUhFO0FBSUZDLEVBQUFBLGNBSkU7QUFLRkMsRUFBQUEsTUFMRTtBQU1GQyxFQUFBQSxLQU5FO0FBT0ZDLEVBQUFBLElBUEU7QUFRRkMsRUFBQUEsU0FSRTtBQVNGQyxFQUFBQSxRQVRFO0FBVUZDLEVBQUFBO0FBVkUsSUFXRkMsT0FBTyxDQUFDLGVBQUQsQ0FYWDs7QUFZQSxNQUFNQyxhQUFhLEdBQUdQLE1BQU0sQ0FBQztBQUN6QlEsRUFBQUEsUUFBUSxFQUFFWixNQURlO0FBRXpCYSxFQUFBQSxLQUFLLEVBQUVYO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxNQUFNWSxTQUFTLEdBQUdWLE1BQU0sQ0FBQztBQUNyQlcsRUFBQUEsTUFBTSxFQUFFZCxRQURhO0FBRXJCZSxFQUFBQSxNQUFNLEVBQUVoQixNQUZhO0FBR3JCaUIsRUFBQUEsU0FBUyxFQUFFakIsTUFIVTtBQUlyQmtCLEVBQUFBLFNBQVMsRUFBRWxCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLE1BQU1tQixXQUFXLEdBQUdmLE1BQU0sQ0FBQztBQUN2QmdCLEVBQUFBLE1BQU0sRUFBRXBCLE1BRGU7QUFFdkJxQixFQUFBQSxTQUFTLEVBQUVyQixNQUZZO0FBR3ZCc0IsRUFBQUEsUUFBUSxFQUFFdEIsTUFI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QUEsbUJBbEJhO0FBbUJiRyxFQUFBQSxvQkFuQmE7QUFvQmJnQixFQUFBQSxvQkFwQmE7QUFxQmJHLEVBQUFBLG9CQXJCYTtBQXNCYkssRUFBQUEsb0JBdEJhO0FBdUJiSSxFQUFBQSxvQkF2QmE7QUF3QmJLLEVBQUFBLG9CQXhCYTtBQXlCYk0sRUFBQUEsb0JBekJhO0FBMEJiSyxFQUFBQSxvQkExQmE7QUEyQmJTLEVBQUFBLG9CQTNCYTtBQTRCYk8sRUFBQUEsZUE1QmE7QUE2QmJVLEVBQUFBLGdCQTdCYTtBQThCYkksRUFBQUEsY0E5QmE7QUErQmJDLEVBQUFBLGtCQS9CYTtBQWdDYkMsRUFBQUEsV0FoQ2E7QUFpQ2JJLEVBQUFBLGdCQWpDYTtBQWtDYk8sRUFBQUEsZ0JBbENhO0FBbUNiSSxFQUFBQSxZQW5DYTtBQW9DYlcsRUFBQUEsaUJBcENhO0FBcUNibUMsRUFBQUEsV0FyQ2E7QUFzQ2JPLEVBQUFBLHlCQXRDYTtBQXVDYkUsRUFBQUEsZUF2Q2E7QUF3Q2JLLEVBQUFBLEtBeENhO0FBeUNib0IsRUFBQUEsT0F6Q2E7QUEwQ2JXLEVBQUFBLGtCQTFDYTtBQTJDYk8sRUFBQUEsaUJBM0NhO0FBNENiSSxFQUFBQSxrQkE1Q2E7QUE2Q2JxQixFQUFBQSxpQkE3Q2E7QUE4Q2JjLEVBQUFBLGlCQTlDYTtBQStDYlcsRUFBQUEsb0JBL0NhO0FBZ0RiTSxFQUFBQTtBQWhEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9kYi10eXBlcy5qcycpO1xuY29uc3QgT3RoZXJDdXJyZW5jeSA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3RoZXJDdXJyZW5jeUFycmF5ID0gYXJyYXkoT3RoZXJDdXJyZW5jeSk7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zID0gc3RydWN0KHtcbiAgICBsdDogYmlnVUludDEsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlX25hbWU6IGVudW1OYW1lKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGU6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDYgPSBzdHJ1Y3Qoe1xuICAgIG1pbnRfbmV3X3ByaWNlOiBzY2FsYXIsXG4gICAgbWludF9hZGRfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQOCA9IHN0cnVjdCh7XG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGNhcGFiaWxpdGllczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTI6IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXksXG4gICAgcDE0OiBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBwMTU6IEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIHAxNjogQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgcDE3OiBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBwMTg6IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXksXG4gICAgcDIwOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIxOiBHYXNMaW1pdHNQcmljZXMsXG4gICAgcDIyOiBCbG9ja0xpbWl0cyxcbiAgICBwMjM6IEJsb2NrTGltaXRzLFxuICAgIHAyNDogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjU6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI4OiBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBwMjk6IEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIHAzMTogU3RyaW5nQXJyYXksXG4gICAgcDMyOiBWYWxpZGF0b3JTZXQsXG4gICAgcDMzOiBWYWxpZGF0b3JTZXQsXG4gICAgcDM0OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM1OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM2OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM3OiBWYWxpZGF0b3JTZXQsXG4gICAgcDM5OiBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRGZWVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXIgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy5mZXRjaERvY0J5S2V5KHBhcmVudC5pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy5mZXRjaERvY0J5S2V5KHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMuZmV0Y2hEb2NzQnlLZXlzKHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19