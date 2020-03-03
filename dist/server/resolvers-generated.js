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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIm1zZyIsInRyYW5zYWN0aW9uIiwiaWhyX2ZlZSIsInByb29mX2NyZWF0ZWQiLCJpbl9tc2ciLCJmd2RfZmVlIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJPdXRNc2ciLCJPdXRNc2dOZXciLCJEZXF1ZXVlSW1tZWRpYXRlbHkiLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiTm9uZSIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdGhlckN1cnJlbmN5QXJyYXkiLCJNZXNzYWdlIiwiaWQiLCJJbnRlcm5hbCIsIkV4dEluIiwiRXh0T3V0Iiwic3RhdHVzIiwic3RhdHVzX25hbWUiLCJVbmtub3duIiwiUXVldWVkIiwiUHJvY2Vzc2luZyIsIlByZWxpbWluYXJ5IiwiUHJvcG9zZWQiLCJGaW5hbGl6ZWQiLCJSZWZ1c2VkIiwiVHJhbnNpdGluZyIsImJsb2NrX2lkIiwiYm9keSIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyIsImx0IiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdF90eXBlX25hbWUiLCJTcGxpdCIsIk1lcmdlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsImRlc2NyIiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlckNvbmZpZ1A2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDciLCJCbG9ja01hc3RlckNvbmZpZ1A4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJWYWxpZGF0b3JTZXRMaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsIlZhbGlkYXRvclNldExpc3RBcnJheSIsIlZhbGlkYXRvclNldCIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwiQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5IiwiRmxvYXRBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5IiwiU3RyaW5nQXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJwNyIsInA4IiwicDkiLCJwMTIiLCJwMTQiLCJwMTUiLCJwMTYiLCJwMTciLCJwMTgiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJwMjkiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInN0YXRlX3VwZGF0ZSIsIm1hc3RlciIsIkFjY291bnQiLCJhY2NfdHlwZSIsImFjY190eXBlX25hbWUiLCJVbmluaXQiLCJBY3RpdmUiLCJGcm96ZW4iLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsInN0YXR1c19jaGFuZ2VfbmFtZSIsIlVuY2hhbmdlZCIsIkRlbGV0ZWQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsImNvbXB1dGVfdHlwZV9uYW1lIiwiU2tpcHBlZCIsIlZtIiwic2tpcHBlZF9yZWFzb24iLCJza2lwcGVkX3JlYXNvbl9uYW1lIiwiTm9TdGF0ZSIsIkJhZFN0YXRlIiwiTm9HYXMiLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsImJvdW5jZV90eXBlX25hbWUiLCJOZWdGdW5kcyIsIk5vRnVuZHMiLCJPayIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwidHJfdHlwZV9uYW1lIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiVGljayIsIlRvY2siLCJTcGxpdFByZXBhcmUiLCJTcGxpdEluc3RhbGwiLCJNZXJnZVByZXBhcmUiLCJNZXJnZUluc3RhbGwiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwib3JpZ19zdGF0dXNfbmFtZSIsIk5vbkV4aXN0IiwiZW5kX3N0YXR1cyIsImVuZF9zdGF0dXNfbmFtZSIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJfYXJncyIsImNvbnRleHQiLCJibG9ja3Nfc2lnbmF0dXJlcyIsIndhaXRGb3JEb2MiLCJtZXNzYWdlcyIsIndhaXRGb3JEb2NzIiwiUXVlcnkiLCJxdWVyeVJlc29sdmVyIiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJzdWJzY3JpcHRpb25SZXNvbHZlciIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUEsTUFBTTtBQUNGQSxFQUFBQSxNQURFO0FBRUZDLEVBQUFBLFFBRkU7QUFHRkMsRUFBQUEsUUFIRTtBQUlGQyxFQUFBQSxjQUpFO0FBS0ZDLEVBQUFBLE1BTEU7QUFNRkMsRUFBQUEsS0FORTtBQU9GQyxFQUFBQSxJQVBFO0FBUUZDLEVBQUFBLFNBUkU7QUFTRkMsRUFBQUEsUUFURTtBQVVGQyxFQUFBQTtBQVZFLElBV0ZDLE9BQU8sQ0FBQyxlQUFELENBWFg7O0FBWUEsTUFBTUMsYUFBYSxHQUFHUCxNQUFNLENBQUM7QUFDekJRLEVBQUFBLFFBQVEsRUFBRVosTUFEZTtBQUV6QmEsRUFBQUEsS0FBSyxFQUFFWDtBQUZrQixDQUFELENBQTVCO0FBS0EsTUFBTVksU0FBUyxHQUFHVixNQUFNLENBQUM7QUFDckJXLEVBQUFBLE1BQU0sRUFBRWQsUUFEYTtBQUVyQmUsRUFBQUEsTUFBTSxFQUFFaEIsTUFGYTtBQUdyQmlCLEVBQUFBLFNBQVMsRUFBRWpCLE1BSFU7QUFJckJrQixFQUFBQSxTQUFTLEVBQUVsQjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxNQUFNbUIsV0FBVyxHQUFHZixNQUFNLENBQUM7QUFDdkJnQixFQUFBQSxNQUFNLEVBQUVwQixNQURlO0FBRXZCcUIsRUFBQUEsU0FBUyxFQUFF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YWJvQixFQUFBQSxzQkFiYTtBQWNiSSxFQUFBQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFmYTtBQWdCYkksRUFBQUEsbUJBaEJhO0FBaUJiRyxFQUFBQSxtQkFqQmE7QUFrQmJDLEVBQUFBLG1CQWxCYTtBQW1CYkcsRUFBQUEsb0JBbkJhO0FBb0JiZ0IsRUFBQUEsb0JBcEJhO0FBcUJiRyxFQUFBQSxvQkFyQmE7QUFzQmJLLEVBQUFBLG9CQXRCYTtBQXVCYkksRUFBQUEsb0JBdkJhO0FBd0JiSyxFQUFBQSxvQkF4QmE7QUF5QmJNLEVBQUFBLG9CQXpCYTtBQTBCYkssRUFBQUEsb0JBMUJhO0FBMkJiUyxFQUFBQSxvQkEzQmE7QUE0QmJPLEVBQUFBLGVBNUJhO0FBNkJiVSxFQUFBQSxnQkE3QmE7QUE4QmJJLEVBQUFBLGNBOUJhO0FBK0JiQyxFQUFBQSxrQkEvQmE7QUFnQ2JDLEVBQUFBLFdBaENhO0FBaUNiSSxFQUFBQSxnQkFqQ2E7QUFrQ2JPLEVBQUFBLGdCQWxDYTtBQW1DYkksRUFBQUEsWUFuQ2E7QUFvQ2JXLEVBQUFBLGlCQXBDYTtBQXFDYm1DLEVBQUFBLFdBckNhO0FBc0NiUyxFQUFBQSx5QkF0Q2E7QUF1Q2JFLEVBQUFBLGVBdkNhO0FBd0NiSyxFQUFBQSxLQXhDYTtBQXlDYm9CLEVBQUFBLE9BekNhO0FBMENiVyxFQUFBQSxrQkExQ2E7QUEyQ2JPLEVBQUFBLGlCQTNDYTtBQTRDYkksRUFBQUEsa0JBNUNhO0FBNkNicUIsRUFBQUEsaUJBN0NhO0FBOENiYyxFQUFBQSxpQkE5Q2E7QUErQ2JXLEVBQUFBLG9CQS9DYTtBQWdEYk0sRUFBQUE7QUFoRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KE90aGVyQ3VycmVuY3kpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMiA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZW5hYmxlZF9zaW5jZTogc2NhbGFyLFxuICAgIGFjdHVhbF9taW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtaW5fc3BsaXQ6IHNjYWxhcixcbiAgICBtYXhfc3BsaXQ6IHNjYWxhcixcbiAgICBhY3RpdmU6IHNjYWxhcixcbiAgICBhY2NlcHRfbXNnczogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHNjYWxhcixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgYmFzaWM6IHNjYWxhcixcbiAgICB2bV92ZXJzaW9uOiBzY2FsYXIsXG4gICAgdm1fbW9kZTogc2NhbGFyLFxuICAgIG1pbl9hZGRyX2xlbjogc2NhbGFyLFxuICAgIG1heF9hZGRyX2xlbjogc2NhbGFyLFxuICAgIGFkZHJfbGVuX3N0ZXA6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5fdHlwZV9pZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE0ID0gc3RydWN0KHtcbiAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbiAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTUgPSBzdHJ1Y3Qoe1xuICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHNjYWxhcixcbiAgICBzdGFrZV9oZWxkX2Zvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE2ID0gc3RydWN0KHtcbiAgICBtYXhfdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtaW5fdmFsaWRhdG9yczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE3ID0gc3RydWN0KHtcbiAgICBtaW5fc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2U6IHNjYWxhcixcbiAgICBtaW5fdG90YWxfc3Rha2U6IHNjYWxhcixcbiAgICBtYXhfc3Rha2VfZmFjdG9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTggPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2JpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIG1jX2NlbGxfcHJpY2VfcHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOCA9IHN0cnVjdCh7XG4gICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX251bTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI5ID0gc3RydWN0KHtcbiAgICByb3VuZF9jYW5kaWRhdGVzOiBzY2FsYXIsXG4gICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHNjYWxhcixcbiAgICBjb25zZW5zdXNfdGltZW91dF9tczogc2NhbGFyLFxuICAgIGZhc3RfYXR0ZW1wdHM6IHNjYWxhcixcbiAgICBhdHRlbXB0X2R1cmF0aW9uOiBzY2FsYXIsXG4gICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHNjYWxhcixcbiAgICBtYXhfYmxvY2tfYnl0ZXM6IHNjYWxhcixcbiAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOSA9IHN0cnVjdCh7XG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG4gICAgdGVtcF9wdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgc2Vxbm86IHNjYWxhcixcbiAgICB2YWxpZF91bnRpbDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9yOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGdhc19wcmljZTogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIGJsb2NrX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzQnl0ZXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNHYXMgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNMdERlbHRhID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzID0gc3RydWN0KHtcbiAgICBieXRlczogQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBnYXM6IEJsb2NrTGltaXRzR2FzLFxuICAgIGx0X2RlbHRhOiBCbG9ja0xpbWl0c0x0RGVsdGEsXG59KTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlcyA9IHN0cnVjdCh7XG4gICAgbHVtcF9wcmljZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZTogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2U6IHNjYWxhcixcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiBzY2FsYXIsXG4gICAgZmlyc3RfZnJhYzogc2NhbGFyLFxuICAgIG5leHRfZnJhYzogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3QgPSBzdHJ1Y3Qoe1xuICAgIHB1YmxpY19rZXk6IHNjYWxhcixcbiAgICB3ZWlnaHQ6IHNjYWxhcixcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0QXJyYXkgPSBhcnJheShWYWxpZGF0b3JTZXRMaXN0KTtcbmNvbnN0IFZhbGlkYXRvclNldCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICB1dGltZV91bnRpbDogc2NhbGFyLFxuICAgIHRvdGFsOiBzY2FsYXIsXG4gICAgdG90YWxfd2VpZ2h0OiBzY2FsYXIsXG4gICAgbGlzdDogVmFsaWRhdG9yU2V0TGlzdEFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDcpO1xuY29uc3QgRmxvYXRBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMTIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDE4KTtcbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AzOSk7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZyA9IHN0cnVjdCh7XG4gICAgcDA6IHNjYWxhcixcbiAgICBwMTogc2NhbGFyLFxuICAgIHAyOiBzY2FsYXIsXG4gICAgcDM6IHNjYWxhcixcbiAgICBwNDogc2NhbGFyLFxuICAgIHA2OiBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIHA3OiBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXksXG4gICAgcDg6IEJsb2NrTWFzdGVyQ29uZmlnUDgsXG4gICAgcDk6IEZsb2F0QXJyYXksXG4gICAgcDEyOiBCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5LFxuICAgIHAxNDogQmxvY2tNYXN0ZXJDb25maWdQMTQsXG4gICAgcDE1OiBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBwMTY6IEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIHAxNzogQmxvY2tNYXN0ZXJDb25maWdQMTcsXG4gICAgcDE4OiBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5LFxuICAgIHAyMDogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMTogR2FzTGltaXRzUHJpY2VzLFxuICAgIHAyMjogQmxvY2tMaW1pdHMsXG4gICAgcDIzOiBCbG9ja0xpbWl0cyxcbiAgICBwMjQ6IE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgcDI1OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyODogQmxvY2tNYXN0ZXJDb25maWdQMjgsXG4gICAgcDI5OiBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBwMzE6IFN0cmluZ0FycmF5LFxuICAgIHAzMjogVmFsaWRhdG9yU2V0LFxuICAgIHAzMzogVmFsaWRhdG9yU2V0LFxuICAgIHAzNDogVmFsaWRhdG9yU2V0LFxuICAgIHAzNTogVmFsaWRhdG9yU2V0LFxuICAgIHAzNjogVmFsaWRhdG9yU2V0LFxuICAgIHAzNzogVmFsaWRhdG9yU2V0LFxuICAgIHAzOTogQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgbWF4X3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5LFxuICAgIHNoYXJkX2ZlZXM6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXksXG4gICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBJbk1zZyxcbiAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXksXG4gICAgY29uZmlnX2FkZHI6IHNjYWxhcixcbiAgICBjb25maWc6IEJsb2NrTWFzdGVyQ29uZmlnLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMgPSBzdHJ1Y3Qoe1xuICAgIG5vZGVfaWQ6IHNjYWxhcixcbiAgICByOiBzY2FsYXIsXG4gICAgczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSA9IGFycmF5KEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMpO1xuY29uc3QgQmxvY2tTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHNpZ25hdHVyZXM6IEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByb3Bvc2VkOiAxLCBGaW5hbGl6ZWQ6IDIsIFJlZnVzZWQ6IDMgfSksXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oJ2lkJywgJ2Jsb2Nrc19zaWduYXR1cmVzJywgQmxvY2tTaWduYXR1cmVzKSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWNjX3R5cGVfbmFtZTogZW51bU5hbWUoJ2FjY190eXBlJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyIH0pLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBlbnVtTmFtZSgnY29tcHV0ZV90eXBlJywgeyBTa2lwcGVkOiAwLCBWbTogMSB9KSxcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uX25hbWU6IGVudW1OYW1lKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBlbnVtTmFtZSgnc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBib3VuY2VfdHlwZV9uYW1lOiBlbnVtTmFtZSgnYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgdHJfdHlwZV9uYW1lOiBlbnVtTmFtZSgndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzdGF0dXNfbmFtZTogZW51bU5hbWUoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJlbGltaW5hcnk6IDEsIFByb3Bvc2VkOiAyLCBGaW5hbGl6ZWQ6IDMsIFJlZnVzZWQ6IDQgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXNfbmFtZTogZW51bU5hbWUoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1c19uYW1lOiBlbnVtTmFtZSgnZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBPdGhlckN1cnJlbmN5OiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEV4dGVybmFsOiAwLCBJbW1lZGlhdGVseTogMSwgT3V0TXNnTmV3OiAyLCBUcmFuc2l0OiAzLCBEZXF1ZXVlSW1tZWRpYXRlbHk6IDQsIERlcXVldWU6IDUsIFRyYW5zaXRSZXF1aXJlZDogNiwgTm9uZTogLTEgfSksXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUXVldWVkOiAxLCBQcm9jZXNzaW5nOiAyLCBQcmVsaW1pbmFyeTogMywgUHJvcG9zZWQ6IDQsIEZpbmFsaXplZDogNSwgUmVmdXNlZDogNiwgVHJhbnNpdGluZzogNyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnM6IHtcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3BsaXRfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzcGxpdF90eXBlJywgeyBOb25lOiAwLCBTcGxpdDogMiwgTWVyZ2U6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaWduYXR1cmVzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5ibG9ja3Nfc2lnbmF0dXJlcy53YWl0Rm9yRG9jKHBhcmVudC5pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhY2NfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdza2lwcGVkX3JlYXNvbicsIHsgTm9TdGF0ZTogMCwgQmFkU3RhdGU6IDEsIE5vR2FzOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXNfY2hhbmdlJywgeyBVbmNoYW5nZWQ6IDAsIEZyb3plbjogMSwgRGVsZXRlZDogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm91bmNlX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYm91bmNlX3R5cGUnLCB7IE5lZ0Z1bmRzOiAwLCBOb0Z1bmRzOiAxLCBPazogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5tZXNzYWdlcy53YWl0Rm9yRG9jKHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvY3MocGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcigndHJfdHlwZScsIHsgT3JkaW5hcnk6IDAsIFN0b3JhZ2U6IDEsIFRpY2s6IDIsIFRvY2s6IDMsIFNwbGl0UHJlcGFyZTogNCwgU3BsaXRJbnN0YWxsOiA1LCBNZXJnZVByZXBhcmU6IDYsIE1lcmdlSW5zdGFsbDogNyB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgICAgICAgICAgb3JpZ19zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignb3JpZ19zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgICAgICAgICAgZW5kX3N0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdlbmRfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5tZXNzYWdlcy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3MucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmFjY291bnRzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2Nrc19zaWduYXR1cmVzOiBkYi5ibG9ja3Nfc2lnbmF0dXJlcy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5ibG9ja3Muc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5zdWJzY3JpcHRpb25SZXNvbHZlcigpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi50cmFuc2FjdGlvbnMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlcyxcbiAgICBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=