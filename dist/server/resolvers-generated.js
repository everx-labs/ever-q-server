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
        return context.db.blocks_signatures.waitForDoc(parent.id);
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
        return context.db.messages.waitForDoc(parent.in_msg);
      },

      out_messages(parent, _args, context) {
        return context.db.messages.waitForDocs(parent.out_msgs);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJ3YWl0Rm9yRG9jIiwibWVzc2FnZXMiLCJ3YWl0Rm9yRG9jcyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU07QUFDRkEsRUFBQUEsTUFERTtBQUVGQyxFQUFBQSxRQUZFO0FBR0ZDLEVBQUFBLFFBSEU7QUFJRkMsRUFBQUEsY0FKRTtBQUtGQyxFQUFBQSxNQUxFO0FBTUZDLEVBQUFBLEtBTkU7QUFPRkMsRUFBQUEsSUFQRTtBQVFGQyxFQUFBQSxTQVJFO0FBU0ZDLEVBQUFBLFFBVEU7QUFVRkMsRUFBQUE7QUFWRSxJQVdGQyxPQUFPLENBQUMsZUFBRCxDQVhYOztBQVlBLE1BQU1DLGFBQWEsR0FBR1AsTUFBTSxDQUFDO0FBQ3pCUSxFQUFBQSxRQUFRLEVBQUVaLE1BRGU7QUFFekJhLEVBQUFBLEtBQUssRUFBRVg7QUFGa0IsQ0FBRCxDQUE1QjtBQUtBLE1BQU1ZLFNBQVMsR0FBR1YsTUFBTSxDQUFDO0FBQ3JCVyxFQUFBQSxNQUFNLEVBQUVkLFFBRGE7QUFFckJlLEVBQUFBLE1BQU0sRUFBRWhCLE1BRmE7QUFHckJpQixFQUFBQSxTQUFTLEVBQUVqQixNQUhVO0FBSXJCa0IsRUFBQUEsU0FBUyxFQUFFbEI7QUFKVSxDQUFELENBQXhCO0FBT0EsTUFBTW1CLFdBQVcsR0FBR2YsTUFBTSxDQUFDO0FBQ3ZCZ0IsRUFBQUEsTUFBTSxFQUFFcEIsTUFEZTtBQUV2QnFCLEVBQUFBLFNBQVMsRUFBRXJCLE1BRlk7QUFHdkJzQixFQUFBQSxRQUFRLEVBQUV0QixNQUhhO0FBSXZC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QmE7QUFtQmJHLEVBQUFBLG9CQW5CYTtBQW9CYmdCLEVBQUFBLG9CQXBCYTtBQXFCYkcsRUFBQUEsb0JBckJhO0FBc0JiSyxFQUFBQSxvQkF0QmE7QUF1QmJJLEVBQUFBLG9CQXZCYTtBQXdCYkssRUFBQUEsb0JBeEJhO0FBeUJiTSxFQUFBQSxvQkF6QmE7QUEwQmJLLEVBQUFBLG9CQTFCYTtBQTJCYlMsRUFBQUEsb0JBM0JhO0FBNEJiTyxFQUFBQSxlQTVCYTtBQTZCYlUsRUFBQUEsZ0JBN0JhO0FBOEJiSSxFQUFBQSxjQTlCYTtBQStCYkMsRUFBQUEsa0JBL0JhO0FBZ0NiQyxFQUFBQSxXQWhDYTtBQWlDYkksRUFBQUEsZ0JBakNhO0FBa0NiTyxFQUFBQSxnQkFsQ2E7QUFtQ2JJLEVBQUFBLFlBbkNhO0FBb0NiVyxFQUFBQSxpQkFwQ2E7QUFxQ2JtQyxFQUFBQSxXQXJDYTtBQXNDYk8sRUFBQUEseUJBdENhO0FBdUNiRSxFQUFBQSxlQXZDYTtBQXdDYkssRUFBQUEsS0F4Q2E7QUF5Q2JvQixFQUFBQSxPQXpDYTtBQTBDYlcsRUFBQUEsa0JBMUNhO0FBMkNiTyxFQUFBQSxpQkEzQ2E7QUE0Q2JJLEVBQUFBLGtCQTVDYTtBQTZDYnFCLEVBQUFBLGlCQTdDYTtBQThDYmMsRUFBQUEsaUJBOUNhO0FBK0NiVyxFQUFBQSxvQkEvQ2E7QUFnRGJNLEVBQUFBO0FBaERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbiAgICBjb25maWdfYWRkcjogc2NhbGFyLFxuICAgIGNvbmZpZzogQmxvY2tNYXN0ZXJDb25maWcsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlczogQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG4gICAgc2lnbmF0dXJlczogam9pbignaWQnLCAnYmxvY2tzX3NpZ25hdHVyZXMnLCBCbG9ja1NpZ25hdHVyZXMpLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhY2NfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgY29tcHV0ZV90eXBlX25hbWU6IGVudW1OYW1lKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb25fbmFtZTogZW51bU5hbWUoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGVudW1OYW1lKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIGJvdW5jZV90eXBlX25hbWU6IGVudW1OYW1lKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICB0cl90eXBlX25hbWU6IGVudW1OYW1lKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIE90aGVyQ3VycmVuY3k6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJaHI6IDEsIEltbWVkaWF0ZWx5OiAyLCBGaW5hbDogMywgVHJhbnNpdDogNCwgRGlzY2FyZGVkRmluYWw6IDUsIERpc2NhcmRlZFRyYW5zaXQ6IDYgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uczoge1xuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzcGxpdF90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXM6IHtcbiAgICAgICAgICAgIGZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmJsb2Nrc19zaWduYXR1cmVzLndhaXRGb3JEb2MocGFyZW50LmlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFjY190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wdXRlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3NraXBwZWRfcmVhc29uJywgeyBOb1N0YXRlOiAwLCBCYWRTdGF0ZTogMSwgTm9HYXM6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBib3VuY2VfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdib3VuY2VfdHlwZScsIHsgTmVnRnVuZHM6IDAsIE5vRnVuZHM6IDEsIE9rOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2MocGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jcyhwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCd0cl90eXBlJywgeyBPcmRpbmFyeTogMCwgU3RvcmFnZTogMSwgVGljazogMiwgVG9jazogMywgU3BsaXRQcmVwYXJlOiA0LCBTcGxpdEluc3RhbGw6IDUsIE1lcmdlUHJlcGFyZTogNiwgTWVyZ2VJbnN0YWxsOiA3IH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgICAgICAgICBvcmlnX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgICAgICBlbmRfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmJsb2Nrcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTIsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMTgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQMzksXG4gICAgR2FzTGltaXRzUHJpY2VzLFxuICAgIEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgQmxvY2tMaW1pdHNHYXMsXG4gICAgQmxvY2tMaW1pdHNMdERlbHRhLFxuICAgIEJsb2NrTGltaXRzLFxuICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgVmFsaWRhdG9yU2V0TGlzdCxcbiAgICBWYWxpZGF0b3JTZXQsXG4gICAgQmxvY2tNYXN0ZXJDb25maWcsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyxcbiAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==