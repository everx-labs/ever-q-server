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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiTWVzc2FnZSIsImlkIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJQcmVsaW1pbmFyeSIsIlByb3Bvc2VkIiwiRmluYWxpemVkIiwiUmVmdXNlZCIsIlRyYW5zaXRpbmciLCJibG9ja19pZCIsImJvZHkiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5Iiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiQmxvY2tNYXN0ZXJDb25maWdQNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1A3IiwiQmxvY2tNYXN0ZXJDb25maWdQOCIsInZlcnNpb24iLCJjYXBhYmlsaXRpZXMiLCJCbG9ja01hc3RlckNvbmZpZ1AxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJCbG9ja01hc3RlckNvbmZpZ1AxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJCbG9ja01hc3RlckNvbmZpZ1AxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJCbG9ja01hc3RlckNvbmZpZ1AxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJCbG9ja01hc3RlckNvbmZpZ1AxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJCbG9ja01hc3RlckNvbmZpZ1AyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJCbG9ja01hc3RlckNvbmZpZ1AyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJnYXNfbGltaXQiLCJzcGVjaWFsX2dhc19saW1pdCIsImdhc19jcmVkaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJCbG9ja0xpbWl0c0J5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJCbG9ja0xpbWl0c0dhcyIsIkJsb2NrTGltaXRzTHREZWx0YSIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJnYXMiLCJsdF9kZWx0YSIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwiVmFsaWRhdG9yU2V0TGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJWYWxpZGF0b3JTZXRMaXN0QXJyYXkiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsIkJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSIsIkZsb2F0QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZ1AxMkFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSIsIlN0cmluZ0FycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwicDciLCJwOCIsInA5IiwicDEyIiwicDE0IiwicDE1IiwicDE2IiwicDE3IiwicDE4IiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwicDI5IiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwibWluX3NoYXJkX2dlbl91dGltZSIsIm1heF9zaGFyZF9nZW5fdXRpbWUiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwiQmxvY2tTaWduYXR1cmVzU2lnbmF0dXJlcyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXNBcnJheSIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzdGF0ZV91cGRhdGUiLCJtYXN0ZXIiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhY2NfdHlwZV9uYW1lIiwiVW5pbml0IiwiQWN0aXZlIiwiRnJvemVuIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJzdGF0dXNfY2hhbmdlX25hbWUiLCJVbmNoYW5nZWQiLCJEZWxldGVkIiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJjb21wdXRlX3R5cGVfbmFtZSIsIlNraXBwZWQiLCJWbSIsInNraXBwZWRfcmVhc29uIiwic2tpcHBlZF9yZWFzb25fbmFtZSIsIk5vU3RhdGUiLCJCYWRTdGF0ZSIsIk5vR2FzIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJib3VuY2VfdHlwZV9uYW1lIiwiTmVnRnVuZHMiLCJOb0Z1bmRzIiwiT2siLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsInRyX3R5cGVfbmFtZSIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlRpY2siLCJUb2NrIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsIm9yaWdfc3RhdHVzX25hbWUiLCJOb25FeGlzdCIsImVuZF9zdGF0dXMiLCJlbmRfc3RhdHVzX25hbWUiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiX2FyZ3MiLCJjb250ZXh0IiwiYmxvY2tzX3NpZ25hdHVyZXMiLCJ3YWl0Rm9yRG9jIiwibWVzc2FnZXMiLCJ3YWl0Rm9yRG9jcyIsIlF1ZXJ5IiwicXVlcnlSZXNvbHZlciIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uUmVzb2x2ZXIiLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLE1BQU07QUFDRkEsRUFBQUEsTUFERTtBQUVGQyxFQUFBQSxRQUZFO0FBR0ZDLEVBQUFBLFFBSEU7QUFJRkMsRUFBQUEsY0FKRTtBQUtGQyxFQUFBQSxNQUxFO0FBTUZDLEVBQUFBLEtBTkU7QUFPRkMsRUFBQUEsSUFQRTtBQVFGQyxFQUFBQSxTQVJFO0FBU0ZDLEVBQUFBLFFBVEU7QUFVRkMsRUFBQUE7QUFWRSxJQVdGQyxPQUFPLENBQUMsZUFBRCxDQVhYOztBQVlBLE1BQU1DLGFBQWEsR0FBR1AsTUFBTSxDQUFDO0FBQ3pCUSxFQUFBQSxRQUFRLEVBQUVaLE1BRGU7QUFFekJhLEVBQUFBLEtBQUssRUFBRVg7QUFGa0IsQ0FBRCxDQUE1QjtBQUtBLE1BQU1ZLFNBQVMsR0FBR1YsTUFBTSxDQUFDO0FBQ3JCVyxFQUFBQSxNQUFNLEVBQUVkLFFBRGE7QUFFckJlLEVBQUFBLE1BQU0sRUFBRWhCLE1BRmE7QUFHckJpQixFQUFBQSxTQUFTLEVBQUVqQixNQUhVO0FBSXJCa0IsRUFBQUEsU0FBUyxFQUFFbEI7QUFKVSxDQUFELENBQXhCO0FBT0EsTUFBTW1CLFdBQVcsR0FBR2YsTUFBTSxDQUFDO0FBQ3ZCZ0IsRUFBQUEsTUFBTSxFQUFFcEIsTUFEZTtBQUV2QnFCLEVBQUFBLFNBQVMsRUFBRXJCLE1BRlk7QUFHdkJzQixFQUFBQSxRQUFRLEVBQUV0QixNQUhhO0FBSXZCdUIsRUFBQUEsaUJBQWlCLEVBQUVyQjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxNQUFNc0IsS0FBSyxHQUFHcEIsTUFBTSxDQUFDO0FBQ2pCcUIsRUFBQUEsUUFBUSxFQUFFekIsTUFETztBQUVqQjBCLEVBQUFBLGFBQWEsRUFBRWxCLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRW1CLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEdBQUcsRUFBRSxDQUFwQjtBQUF1QkMsSUFBQUEsV0FBVyxFQUFFLENBQXBDO0FBQXVDQyxJQUFBQSxLQUFLLEVBQUUsQ0FBOUM7QUFBaURDLElBQUFBLE9BQU8sRUFBRSxDQUExRDtBQUE2REMsSUFBQUEsY0FBYyxFQUFFLENBQTdFO0FBQWdGQyxJQUFBQSxnQkFBZ0IsRUFBRTtBQUFsRyxHQUFiLENBRk47QUFHakJiLEVBQUFBLE1BQU0sRUFBRXBCLE1BSFM7QUFJakJrQyxFQUFBQSxPQUFPLEVBQUVoQyxRQUpRO0FBS2pCaUMsRUFBQUEsYUFBYSxFQUFFbkMsTUFMRTtBQU1qQm9DLEVBQUFBLE1BQU0sRUFBRWpCLFdBTlM7QUFPakJrQixFQUFBQSxPQUFPLEVBQUVuQyxRQVBRO0FBUWpCb0MsRUFBQUEsT0FBTyxFQUFFbkIsV0FSUTtBQVNqQm9CLEVBQUFBLFdBQVcsRUFBRXJDLFFBVEk7QUFVakJzQyxFQUFBQSxjQUFjLEVBQUV2QyxRQVZDO0FBV2pCd0MsRUFBQUEsZUFBZSxFQUFFekM7QUFYQSxDQUFELENBQXBCO0FBY0EsTUFBTTBDLE1BQU0sR0FBR3RDLE1BQU0sQ0FBQztBQUNsQnFCLEVBQUFBLFFBQVEsRUFBRXpCLE1BRFE7QUFFbEIwQixFQUFBQSxhQUFhLEVBQUVsQixRQUFRLENBQUMsVUFBRCxFQUFhO0FBQUVtQixJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlRSxJQUFBQSxXQUFXLEVBQUUsQ0FBNUI7QUFBK0JjLElBQUFBLFNBQVMsRUFBRSxDQUExQztBQUE2Q1osSUFBQUEsT0FBTyxFQUFFLENBQXREO0FBQXlEYSxJQUFBQSxrQkFBa0IsRUFBRSxDQUE3RTtBQUFnRkMsSUFBQUEsT0FBTyxFQUFFLENBQXpGO0FBQTRGQyxJQUFBQSxlQUFlLEVBQUUsQ0FBN0c7QUFBZ0hDLElBQUFBLElBQUksRUFBRSxDQUFDO0FBQXZILEdBQWIsQ0FGTDtBQUdsQjNCLEVBQUFBLE1BQU0sRUFBRXBCLE1BSFU7QUFJbEJ3QyxFQUFBQSxjQUFjLEVBQUV4QyxNQUpFO0FBS2xCc0MsRUFBQUEsT0FBTyxFQUFFbkIsV0FMUztBQU1sQjZCLEVBQUFBLFFBQVEsRUFBRXhCLEtBTlE7QUFPbEJ5QixFQUFBQSxRQUFRLEVBQUV6QixLQVBRO0FBUWxCMEIsRUFBQUEsZUFBZSxFQUFFakQ7QUFSQyxDQUFELENBQXJCO0FBV0EsTUFBTWtELGtCQUFrQixHQUFHOUMsS0FBSyxDQUFDTSxhQUFELENBQWhDO0FBQ0EsTUFBTXlDLE9BQU8sR0FBR2hELE1BQU0sQ0FBQztBQUNuQmlELEVBQUFBLEVBQUUsRUFBRXJELE1BRGU7QUFFbkJ5QixFQUFBQSxRQUFRLEVBQUV6QixNQUZTO0FBR25CMEIsRUFBQUEsYUFBYSxFQUFFbEIsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFOEMsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsS0FBSyxFQUFFLENBQXRCO0FBQXlCQyxJQUFBQSxNQUFNLEVBQUU7QUFBakMsR0FBYixDQUhKO0FBSW5CQyxFQUFBQSxNQUFNLEVBQUV6RCxNQUpXO0FBS25CMEQsRUFBQUEsV0FBVyxFQUFFbEQsUUFBUSxDQUFDLFFBQUQsRUFBVztBQUFFbUQsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsSUFBQUEsTUFBTSxFQUFFLENBQXRCO0FBQXlCQyxJQUFBQSxVQUFVLEVBQUUsQ0FBckM7QUFBd0NDLElBQUFBLFdBQVcsRUFBRSxDQUFyRDtBQUF3REMsSUFBQUEsUUFBUSxFQUFFLENBQWxFO0FBQXFFQyxJQUFBQSxTQUFTLEVBQUUsQ0FBaEY7QUFBbUZDLElBQUFBLE9BQU8sRUFBRSxDQUE1RjtBQUErRkMsSUFBQUEsVUFBVSxFQUFFO0FBQTNHLEdBQVgsQ0FMRjtBQU1uQkMsRUFBQUEsUUFBUSxFQUFFbkUsTUFOUztBQU9uQm9FLEVBQUFBLElBQUksRUFBRXBFLE1BUGE7QUFRbkJxRSxFQUFBQSxXQUFXLEVBQUVyRSxNQVJNO0FBU25Cc0UsRUFBQUEsSUFBSSxFQUFFdEUsTUFUYTtBQVVuQnVFLEVBQUFBLElBQUksRUFBRXZFLE1BVmE7QUFXbkJ3RSxFQUFBQSxJQUFJLEVBQUV4RSxNQVhhO0FBWW5CeUUsRUFBQUEsSUFBSSxFQUFFekUsTUFaYTtBQWFuQjBFLEVBQUFBLE9BQU8sRUFBRTFFLE1BYlU7QUFjbkIyRSxFQUFBQSxHQUFHLEVBQUUzRSxNQWRjO0FBZW5CNEUsRUFBQUEsR0FBRyxFQUFFNUUsTUFmYztBQWdCbkI2RSxFQUFBQSxnQkFBZ0IsRUFBRTdFLE1BaEJDO0FBaUJuQjhFLEVBQUFBLGdCQUFnQixFQUFFOUUsTUFqQkM7QUFrQm5CK0UsRUFBQUEsVUFBVSxFQUFFOUUsUUFsQk87QUFtQm5CK0UsRUFBQUEsVUFBVSxFQUFFaEYsTUFuQk87QUFvQm5CaUYsRUFBQUEsWUFBWSxFQUFFakYsTUFwQks7QUFxQm5Ca0MsRUFBQUEsT0FBTyxFQUFFaEMsUUFyQlU7QUFzQm5CbUMsRUFBQUEsT0FBTyxFQUFFbkMsUUF0QlU7QUF1Qm5CZ0YsRUFBQUEsVUFBVSxFQUFFaEYsUUF2Qk87QUF3Qm5CaUYsRUFBQUEsTUFBTSxFQUFFbkYsTUF4Qlc7QUF5Qm5Cb0YsRUFBQUEsT0FBTyxFQUFFcEYsTUF6QlU7QUEwQm5CYSxFQUFBQSxLQUFLLEVBQUVYLFFBMUJZO0FBMkJuQm1GLEVBQUFBLFdBQVcsRUFBRWxDLGtCQTNCTTtBQTRCbkJtQyxFQUFBQSxLQUFLLEVBQUV0RixNQTVCWTtBQTZCbkJ1RixFQUFBQSxHQUFHLEVBQUV2RjtBQTdCYyxDQUFELEVBOEJuQixJQTlCbUIsQ0FBdEI7QUFnQ0EsTUFBTXdGLGNBQWMsR0FBR3BGLE1BQU0sQ0FBQztBQUMxQnFGLEVBQUFBLFdBQVcsRUFBRXZGLFFBRGE7QUFFMUJ3RixFQUFBQSxpQkFBaUIsRUFBRXZDLGtCQUZPO0FBRzFCd0MsRUFBQUEsUUFBUSxFQUFFekYsUUFIZ0I7QUFJMUIwRixFQUFBQSxjQUFjLEVBQUV6QyxrQkFKVTtBQUsxQjBDLEVBQUFBLGNBQWMsRUFBRTNGLFFBTFU7QUFNMUI0RixFQUFBQSxvQkFBb0IsRUFBRTNDLGtCQU5JO0FBTzFCNEMsRUFBQUEsT0FBTyxFQUFFN0YsUUFQaUI7QUFRMUI4RixFQUFBQSxhQUFhLEVBQUU3QyxrQkFSVztBQVMxQkYsRUFBQUEsUUFBUSxFQUFFL0MsUUFUZ0I7QUFVMUIrRixFQUFBQSxjQUFjLEVBQUU5QyxrQkFWVTtBQVcxQitDLEVBQUFBLGFBQWEsRUFBRWhHLFFBWFc7QUFZMUJpRyxFQUFBQSxtQkFBbUIsRUFBRWhELGtCQVpLO0FBYTFCaUQsRUFBQUEsTUFBTSxFQUFFbEcsUUFia0I7QUFjMUJtRyxFQUFBQSxZQUFZLEVBQUVsRCxrQkFkWTtBQWUxQm1ELEVBQUFBLGFBQWEsRUFBRXBHLFFBZlc7QUFnQjFCcUcsRUFBQUEsbUJBQW1CLEVBQUVwRDtBQWhCSyxDQUFELENBQTdCO0FBbUJBLE1BQU1xRCw4QkFBOEIsR0FBR3BHLE1BQU0sQ0FBQztBQUMxQ3FHLEVBQUFBLEVBQUUsRUFBRXhHLFFBRHNDO0FBRTFDdUMsRUFBQUEsY0FBYyxFQUFFeEMsTUFGMEI7QUFHMUMwRyxFQUFBQSxVQUFVLEVBQUV4RyxRQUg4QjtBQUkxQ3lHLEVBQUFBLGdCQUFnQixFQUFFeEQ7QUFKd0IsQ0FBRCxDQUE3QztBQU9BLE1BQU15RCxtQ0FBbUMsR0FBR3ZHLEtBQUssQ0FBQ21HLDhCQUFELENBQWpEO0FBQ0EsTUFBTUssa0JBQWtCLEdBQUd6RyxNQUFNLENBQUM7QUFDOUIwRyxFQUFBQSxZQUFZLEVBQUU5RyxNQURnQjtBQUU5QitHLEVBQUFBLFlBQVksRUFBRUgsbUNBRmdCO0FBRzlCSSxFQUFBQSxRQUFRLEVBQUVoSCxNQUhvQjtBQUk5QmlILEVBQUFBLFFBQVEsRUFBRWpILE1BSm9CO0FBSzlCa0gsRUFBQUEsUUFBUSxFQUFFbEg7QUFMb0IsQ0FBRCxDQUFqQztBQVFBLE1BQU1tSCxnQkFBZ0IsR0FBRy9HLE1BQU0sQ0FBQztBQUM1QmdILEVBQUFBLEdBQUcsRUFBRXBILE1BRHVCO0FBRTVCaUgsRUFBQUEsUUFBUSxFQUFFakgsTUFGa0I7QUFHNUJxSCxFQUFBQSxTQUFTLEVBQUVySCxNQUhpQjtBQUk1QnNILEVBQUFBLEdBQUcsRUFBRXRILE1BSnVCO0FBSzVCZ0gsRUFBQUEsUUFBUSxFQUFFaEgsTUFMa0I7QUFNNUJ1SCxFQUFBQSxTQUFTLEVBQUV2SDtBQU5pQixDQUFELENBQS9CO0FBU0EsTUFBTXdILDJCQUEyQixHQUFHcEgsTUFBTSxDQUFDO0FBQ3ZDWSxFQUFBQSxNQUFNLEVBQUVoQixNQUQrQjtBQUV2Q3lILEVBQUFBLFlBQVksRUFBRXpILE1BRnlCO0FBR3ZDMEgsRUFBQUEsUUFBUSxFQUFFekgsUUFINkI7QUFJdkNjLEVBQUFBLE1BQU0sRUFBRWQsUUFKK0I7QUFLdkNnQixFQUFBQSxTQUFTLEVBQUVqQixNQUw0QjtBQU12Q2tCLEVBQUFBLFNBQVMsRUFBRWxCLE1BTjRCO0FBT3ZDMkgsRUFBQUEsWUFBWSxFQUFFM0gsTUFQeUI7QUFRdkM0SCxFQUFBQSxZQUFZLEVBQUU1SCxNQVJ5QjtBQVN2QzZILEVBQUFBLFVBQVUsRUFBRTdILE1BVDJCO0FBVXZDOEgsRUFBQUEsVUFBVSxFQUFFOUgsTUFWMkI7QUFXdkMrSCxFQUFBQSxhQUFhLEVBQUUvSCxNQVh3QjtBQVl2Q2dJLEVBQUFBLEtBQUssRUFBRWhJLE1BWmdDO0FBYXZDaUksRUFBQUEsbUJBQW1CLEVBQUVqSSxNQWJrQjtBQWN2Q2tJLEVBQUFBLG9CQUFvQixFQUFFbEksTUFkaUI7QUFldkNtSSxFQUFBQSxnQkFBZ0IsRUFBRW5JLE1BZnFCO0FBZ0J2Q29JLEVBQUFBLFNBQVMsRUFBRXBJLE1BaEI0QjtBQWlCdkNxSSxFQUFBQSxVQUFVLEVBQUVySSxNQWpCMkI7QUFrQnZDc0ksRUFBQUEsZUFBZSxFQUFFOUgsUUFBUSxDQUFDLFlBQUQsRUFBZTtBQUFFdUMsSUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBV3dGLElBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsSUFBQUEsS0FBSyxFQUFFO0FBQTVCLEdBQWYsQ0FsQmM7QUFtQnZDQyxFQUFBQSxLQUFLLEVBQUV6SSxNQW5CZ0M7QUFvQnZDNkYsRUFBQUEsY0FBYyxFQUFFM0YsUUFwQnVCO0FBcUJ2QzRGLEVBQUFBLG9CQUFvQixFQUFFM0Msa0JBckJpQjtBQXNCdkN1RixFQUFBQSxhQUFhLEVBQUV4SSxRQXRCd0I7QUF1QnZDeUksRUFBQUEsbUJBQW1CLEVBQUV4RjtBQXZCa0IsQ0FBRCxDQUExQztBQTBCQSxNQUFNeUYsc0JBQXNCLEdBQUd4SSxNQUFNLENBQUM7QUFDbEN5SSxFQUFBQSxZQUFZLEVBQUU3SSxNQURvQjtBQUVsQzhJLEVBQUFBLEtBQUssRUFBRTlJLE1BRjJCO0FBR2xDK0ksRUFBQUEsS0FBSyxFQUFFdkI7QUFIMkIsQ0FBRCxDQUFyQztBQU1BLE1BQU13QixvQkFBb0IsR0FBRzVJLE1BQU0sQ0FBQztBQUNoQ3lJLEVBQUFBLFlBQVksRUFBRTdJLE1BRGtCO0FBRWhDOEksRUFBQUEsS0FBSyxFQUFFOUksTUFGeUI7QUFHaENpSixFQUFBQSxJQUFJLEVBQUUvSSxRQUgwQjtBQUloQ2dKLEVBQUFBLFVBQVUsRUFBRS9GLGtCQUpvQjtBQUtoQ2dHLEVBQUFBLE1BQU0sRUFBRWpKLFFBTHdCO0FBTWhDa0osRUFBQUEsWUFBWSxFQUFFakc7QUFOa0IsQ0FBRCxDQUFuQztBQVNBLE1BQU1rRyw0QkFBNEIsR0FBR2pKLE1BQU0sQ0FBQztBQUN4Q2tKLEVBQUFBLE9BQU8sRUFBRXRKLE1BRCtCO0FBRXhDdUosRUFBQUEsQ0FBQyxFQUFFdkosTUFGcUM7QUFHeEN3SixFQUFBQSxDQUFDLEVBQUV4SjtBQUhxQyxDQUFELENBQTNDO0FBTUEsTUFBTXlKLG1CQUFtQixHQUFHckosTUFBTSxDQUFDO0FBQy9Cc0osRUFBQUEsY0FBYyxFQUFFMUosTUFEZTtBQUUvQjJKLEVBQUFBLGNBQWMsRUFBRTNKO0FBRmUsQ0FBRCxDQUFsQztBQUtBLE1BQU00SixtQkFBbUIsR0FBR3hKLE1BQU0sQ0FBQztBQUMvQlEsRUFBQUEsUUFBUSxFQUFFWixNQURxQjtBQUUvQmEsRUFBQUEsS0FBSyxFQUFFYjtBQUZ3QixDQUFELENBQWxDO0FBS0EsTUFBTTZKLG1CQUFtQixHQUFHekosTUFBTSxDQUFDO0FBQy9CMEosRUFBQUEsT0FBTyxFQUFFOUosTUFEc0I7QUFFL0IrSixFQUFBQSxZQUFZLEVBQUUvSjtBQUZpQixDQUFELENBQWxDO0FBS0EsTUFBTWdLLG9CQUFvQixHQUFHNUosTUFBTSxDQUFDO0FBQ2hDeUksRUFBQUEsWUFBWSxFQUFFN0ksTUFEa0I7QUFFaENpSyxFQUFBQSxhQUFhLEVBQUVqSyxNQUZpQjtBQUdoQ2tLLEVBQUFBLGdCQUFnQixFQUFFbEssTUFIYztBQUloQ21LLEVBQUFBLFNBQVMsRUFBRW5LLE1BSnFCO0FBS2hDb0ssRUFBQUEsU0FBUyxFQUFFcEssTUFMcUI7QUFNaENxSyxFQUFBQSxNQUFNLEVBQUVySyxNQU53QjtBQU9oQ3NLLEVBQUFBLFdBQVcsRUFBRXRLLE1BUG1CO0FBUWhDZ0ksRUFBQUEsS0FBSyxFQUFFaEksTUFSeUI7QUFTaEN1SyxFQUFBQSxtQkFBbUIsRUFBRXZLLE1BVFc7QUFVaEN3SyxFQUFBQSxtQkFBbUIsRUFBRXhLLE1BVlc7QUFXaEM4SixFQUFBQSxPQUFPLEVBQUU5SixNQVh1QjtBQVloQ3lLLEVBQUFBLEtBQUssRUFBRXpLLE1BWnlCO0FBYWhDMEssRUFBQUEsVUFBVSxFQUFFMUssTUFib0I7QUFjaEMySyxFQUFBQSxPQUFPLEVBQUUzSyxNQWR1QjtBQWVoQzRLLEVBQUFBLFlBQVksRUFBRTVLLE1BZmtCO0FBZ0JoQzZLLEVBQUFBLFlBQVksRUFBRTdLLE1BaEJrQjtBQWlCaEM4SyxFQUFBQSxhQUFhLEVBQUU5SyxNQWpCaUI7QUFrQmhDK0ssRUFBQUEsaUJBQWlCLEVBQUUvSztBQWxCYSxDQUFELENBQW5DO0FBcUJBLE1BQU1nTCxvQkFBb0IsR0FBRzVLLE1BQU0sQ0FBQztBQUNoQzZLLEVBQUFBLHFCQUFxQixFQUFFakwsTUFEUztBQUVoQ2tMLEVBQUFBLG1CQUFtQixFQUFFbEw7QUFGVyxDQUFELENBQW5DO0FBS0EsTUFBTW1MLG9CQUFvQixHQUFHL0ssTUFBTSxDQUFDO0FBQ2hDZ0wsRUFBQUEsc0JBQXNCLEVBQUVwTCxNQURRO0FBRWhDcUwsRUFBQUEsc0JBQXNCLEVBQUVyTCxNQUZRO0FBR2hDc0wsRUFBQUEsb0JBQW9CLEVBQUV0TCxNQUhVO0FBSWhDdUwsRUFBQUEsY0FBYyxFQUFFdkw7QUFKZ0IsQ0FBRCxDQUFuQztBQU9BLE1BQU13TCxvQkFBb0IsR0FBR3BMLE1BQU0sQ0FBQztBQUNoQ3FMLEVBQUFBLGNBQWMsRUFBRXpMLE1BRGdCO0FBRWhDMEwsRUFBQUEsbUJBQW1CLEVBQUUxTCxNQUZXO0FBR2hDMkwsRUFBQUEsY0FBYyxFQUFFM0w7QUFIZ0IsQ0FBRCxDQUFuQztBQU1BLE1BQU00TCxvQkFBb0IsR0FBR3hMLE1BQU0sQ0FBQztBQUNoQ3lMLEVBQUFBLFNBQVMsRUFBRTdMLE1BRHFCO0FBRWhDOEwsRUFBQUEsU0FBUyxFQUFFOUwsTUFGcUI7QUFHaEMrTCxFQUFBQSxlQUFlLEVBQUUvTCxNQUhlO0FBSWhDZ00sRUFBQUEsZ0JBQWdCLEVBQUVoTTtBQUpjLENBQUQsQ0FBbkM7QUFPQSxNQUFNaU0sb0JBQW9CLEdBQUc3TCxNQUFNLENBQUM7QUFDaEM4TCxFQUFBQSxXQUFXLEVBQUVsTSxNQURtQjtBQUVoQ21NLEVBQUFBLFlBQVksRUFBRW5NLE1BRmtCO0FBR2hDb00sRUFBQUEsYUFBYSxFQUFFcE0sTUFIaUI7QUFJaENxTSxFQUFBQSxlQUFlLEVBQUVyTSxNQUplO0FBS2hDc00sRUFBQUEsZ0JBQWdCLEVBQUV0TTtBQUxjLENBQUQsQ0FBbkM7QUFRQSxNQUFNdU0sb0JBQW9CLEdBQUduTSxNQUFNLENBQUM7QUFDaENvTSxFQUFBQSxvQkFBb0IsRUFBRXhNLE1BRFU7QUFFaEN5TSxFQUFBQSx1QkFBdUIsRUFBRXpNLE1BRk87QUFHaEMwTSxFQUFBQSx5QkFBeUIsRUFBRTFNLE1BSEs7QUFJaEMyTSxFQUFBQSxvQkFBb0IsRUFBRTNNO0FBSlUsQ0FBRCxDQUFuQztBQU9BLE1BQU00TSxvQkFBb0IsR0FBR3hNLE1BQU0sQ0FBQztBQUNoQ3lNLEVBQUFBLGdCQUFnQixFQUFFN00sTUFEYztBQUVoQzhNLEVBQUFBLHVCQUF1QixFQUFFOU0sTUFGTztBQUdoQytNLEVBQUFBLG9CQUFvQixFQUFFL00sTUFIVTtBQUloQ2dOLEVBQUFBLGFBQWEsRUFBRWhOLE1BSmlCO0FBS2hDaU4sRUFBQUEsZ0JBQWdCLEVBQUVqTixNQUxjO0FBTWhDa04sRUFBQUEsaUJBQWlCLEVBQUVsTixNQU5hO0FBT2hDbU4sRUFBQUEsZUFBZSxFQUFFbk4sTUFQZTtBQVFoQ29OLEVBQUFBLGtCQUFrQixFQUFFcE47QUFSWSxDQUFELENBQW5DO0FBV0EsTUFBTXFOLG9CQUFvQixHQUFHak4sTUFBTSxDQUFDO0FBQ2hDa04sRUFBQUEsU0FBUyxFQUFFdE4sTUFEcUI7QUFFaEN1TixFQUFBQSxlQUFlLEVBQUV2TixNQUZlO0FBR2hDd04sRUFBQUEsS0FBSyxFQUFFeE4sTUFIeUI7QUFJaEN5TixFQUFBQSxXQUFXLEVBQUV6TixNQUptQjtBQUtoQzBOLEVBQUFBLFdBQVcsRUFBRTFOLE1BTG1CO0FBTWhDMk4sRUFBQUEsV0FBVyxFQUFFM047QUFObUIsQ0FBRCxDQUFuQztBQVNBLE1BQU00TixlQUFlLEdBQUd4TixNQUFNLENBQUM7QUFDM0J5TixFQUFBQSxTQUFTLEVBQUU3TixNQURnQjtBQUUzQjhOLEVBQUFBLFNBQVMsRUFBRTlOLE1BRmdCO0FBRzNCK04sRUFBQUEsaUJBQWlCLEVBQUUvTixNQUhRO0FBSTNCZ08sRUFBQUEsVUFBVSxFQUFFaE8sTUFKZTtBQUszQmlPLEVBQUFBLGVBQWUsRUFBRWpPLE1BTFU7QUFNM0JrTyxFQUFBQSxnQkFBZ0IsRUFBRWxPLE1BTlM7QUFPM0JtTyxFQUFBQSxnQkFBZ0IsRUFBRW5PLE1BUFM7QUFRM0JvTyxFQUFBQSxjQUFjLEVBQUVwTyxNQVJXO0FBUzNCcU8sRUFBQUEsY0FBYyxFQUFFck87QUFUVyxDQUFELENBQTlCO0FBWUEsTUFBTXNPLGdCQUFnQixHQUFHbE8sTUFBTSxDQUFDO0FBQzVCbU8sRUFBQUEsU0FBUyxFQUFFdk8sTUFEaUI7QUFFNUJ3TyxFQUFBQSxVQUFVLEVBQUV4TyxNQUZnQjtBQUc1QnlPLEVBQUFBLFVBQVUsRUFBRXpPO0FBSGdCLENBQUQsQ0FBL0I7QUFNQSxNQUFNME8sY0FBYyxHQUFHdE8sTUFBTSxDQUFDO0FBQzFCbU8sRUFBQUEsU0FBUyxFQUFFdk8sTUFEZTtBQUUxQndPLEVBQUFBLFVBQVUsRUFBRXhPLE1BRmM7QUFHMUJ5TyxFQUFBQSxVQUFVLEVBQUV6TztBQUhjLENBQUQsQ0FBN0I7QUFNQSxNQUFNMk8sa0JBQWtCLEdBQUd2TyxNQUFNLENBQUM7QUFDOUJtTyxFQUFBQSxTQUFTLEVBQUV2TyxNQURtQjtBQUU5QndPLEVBQUFBLFVBQVUsRUFBRXhPLE1BRmtCO0FBRzlCeU8sRUFBQUEsVUFBVSxFQUFFek87QUFIa0IsQ0FBRCxDQUFqQztBQU1BLE1BQU00TyxXQUFXLEdBQUd4TyxNQUFNLENBQUM7QUFDdkJ5TyxFQUFBQSxLQUFLLEVBQUVQLGdCQURnQjtBQUV2QlEsRUFBQUEsR0FBRyxFQUFFSixjQUZrQjtBQUd2QkssRUFBQUEsUUFBUSxFQUFFSjtBQUhhLENBQUQsQ0FBMUI7QUFNQSxNQUFNSyxnQkFBZ0IsR0FBRzVPLE1BQU0sQ0FBQztBQUM1QjZPLEVBQUFBLFVBQVUsRUFBRWpQLE1BRGdCO0FBRTVCa1AsRUFBQUEsU0FBUyxFQUFFbFAsTUFGaUI7QUFHNUJtUCxFQUFBQSxVQUFVLEVBQUVuUCxNQUhnQjtBQUk1Qm9QLEVBQUFBLGdCQUFnQixFQUFFcFAsTUFKVTtBQUs1QnFQLEVBQUFBLFVBQVUsRUFBRXJQLE1BTGdCO0FBTTVCc1AsRUFBQUEsU0FBUyxFQUFFdFA7QUFOaUIsQ0FBRCxDQUEvQjtBQVNBLE1BQU11UCxnQkFBZ0IsR0FBR25QLE1BQU0sQ0FBQztBQUM1Qm9QLEVBQUFBLFVBQVUsRUFBRXhQLE1BRGdCO0FBRTVCeVAsRUFBQUEsTUFBTSxFQUFFelAsTUFGb0I7QUFHNUJzTixFQUFBQSxTQUFTLEVBQUV0TjtBQUhpQixDQUFELENBQS9CO0FBTUEsTUFBTTBQLHFCQUFxQixHQUFHclAsS0FBSyxDQUFDa1AsZ0JBQUQsQ0FBbkM7QUFDQSxNQUFNSSxZQUFZLEdBQUd2UCxNQUFNLENBQUM7QUFDeEI4TCxFQUFBQSxXQUFXLEVBQUVsTSxNQURXO0FBRXhCNFAsRUFBQUEsV0FBVyxFQUFFNVAsTUFGVztBQUd4QjZQLEVBQUFBLEtBQUssRUFBRTdQLE1BSGlCO0FBSXhCOFAsRUFBQUEsWUFBWSxFQUFFOVAsTUFKVTtBQUt4QitQLEVBQUFBLElBQUksRUFBRUw7QUFMa0IsQ0FBRCxDQUEzQjtBQVFBLE1BQU1NLHdCQUF3QixHQUFHM1AsS0FBSyxDQUFDdUosbUJBQUQsQ0FBdEM7QUFDQSxNQUFNcUcsVUFBVSxHQUFHNVAsS0FBSyxDQUFDTCxNQUFELENBQXhCO0FBQ0EsTUFBTWtRLHlCQUF5QixHQUFHN1AsS0FBSyxDQUFDMkosb0JBQUQsQ0FBdkM7QUFDQSxNQUFNbUcseUJBQXlCLEdBQUc5UCxLQUFLLENBQUM0TCxvQkFBRCxDQUF2QztBQUNBLE1BQU1tRSxXQUFXLEdBQUcvUCxLQUFLLENBQUNMLE1BQUQsQ0FBekI7QUFDQSxNQUFNcVEseUJBQXlCLEdBQUdoUSxLQUFLLENBQUNnTixvQkFBRCxDQUF2QztBQUNBLE1BQU1pRCxpQkFBaUIsR0FBR2xRLE1BQU0sQ0FBQztBQUM3Qm1RLEVBQUFBLEVBQUUsRUFBRXZRLE1BRHlCO0FBRTdCd1EsRUFBQUEsRUFBRSxFQUFFeFEsTUFGeUI7QUFHN0J5USxFQUFBQSxFQUFFLEVBQUV6USxNQUh5QjtBQUk3QjBRLEVBQUFBLEVBQUUsRUFBRTFRLE1BSnlCO0FBSzdCMlEsRUFBQUEsRUFBRSxFQUFFM1EsTUFMeUI7QUFNN0I0USxFQUFBQSxFQUFFLEVBQUVuSCxtQkFOeUI7QUFPN0JvSCxFQUFBQSxFQUFFLEVBQUViLHdCQVB5QjtBQVE3QmMsRUFBQUEsRUFBRSxFQUFFakgsbUJBUnlCO0FBUzdCa0gsRUFBQUEsRUFBRSxFQUFFZCxVQVR5QjtBQVU3QmUsRUFBQUEsR0FBRyxFQUFFZCx5QkFWd0I7QUFXN0JlLEVBQUFBLEdBQUcsRUFBRWpHLG9CQVh3QjtBQVk3QmtHLEVBQUFBLEdBQUcsRUFBRS9GLG9CQVp3QjtBQWE3QmdHLEVBQUFBLEdBQUcsRUFBRTNGLG9CQWJ3QjtBQWM3QjRGLEVBQUFBLEdBQUcsRUFBRXhGLG9CQWR3QjtBQWU3QnlGLEVBQUFBLEdBQUcsRUFBRWxCLHlCQWZ3QjtBQWdCN0JtQixFQUFBQSxHQUFHLEVBQUUxRCxlQWhCd0I7QUFpQjdCMkQsRUFBQUEsR0FBRyxFQUFFM0QsZUFqQndCO0FBa0I3QjRELEVBQUFBLEdBQUcsRUFBRTVDLFdBbEJ3QjtBQW1CN0I2QyxFQUFBQSxHQUFHLEVBQUU3QyxXQW5Cd0I7QUFvQjdCOEMsRUFBQUEsR0FBRyxFQUFFMUMsZ0JBcEJ3QjtBQXFCN0IyQyxFQUFBQSxHQUFHLEVBQUUzQyxnQkFyQndCO0FBc0I3QjRDLEVBQUFBLEdBQUcsRUFBRXJGLG9CQXRCd0I7QUF1QjdCc0YsRUFBQUEsR0FBRyxFQUFFakYsb0JBdkJ3QjtBQXdCN0JrRixFQUFBQSxHQUFHLEVBQUUxQixXQXhCd0I7QUF5QjdCMkIsRUFBQUEsR0FBRyxFQUFFcEMsWUF6QndCO0FBMEI3QnFDLEVBQUFBLEdBQUcsRUFBRXJDLFlBMUJ3QjtBQTJCN0JzQyxFQUFBQSxHQUFHLEVBQUV0QyxZQTNCd0I7QUE0QjdCdUMsRUFBQUEsR0FBRyxFQUFFdkMsWUE1QndCO0FBNkI3QndDLEVBQUFBLEdBQUcsRUFBRXhDLFlBN0J3QjtBQThCN0J5QyxFQUFBQSxHQUFHLEVBQUV6QyxZQTlCd0I7QUErQjdCMEMsRUFBQUEsR0FBRyxFQUFFaEM7QUEvQndCLENBQUQsQ0FBaEM7QUFrQ0EsTUFBTWlDLDJCQUEyQixHQUFHalMsS0FBSyxDQUFDdUksc0JBQUQsQ0FBekM7QUFDQSxNQUFNMkoseUJBQXlCLEdBQUdsUyxLQUFLLENBQUMySSxvQkFBRCxDQUF2QztBQUNBLE1BQU13SixpQ0FBaUMsR0FBR25TLEtBQUssQ0FBQ2dKLDRCQUFELENBQS9DO0FBQ0EsTUFBTW9KLFdBQVcsR0FBR3JTLE1BQU0sQ0FBQztBQUN2QnNTLEVBQUFBLG1CQUFtQixFQUFFMVMsTUFERTtBQUV2QjJTLEVBQUFBLG1CQUFtQixFQUFFM1MsTUFGRTtBQUd2QjRTLEVBQUFBLFlBQVksRUFBRU4sMkJBSFM7QUFJdkJPLEVBQUFBLFVBQVUsRUFBRU4seUJBSlc7QUFLdkJPLEVBQUFBLGtCQUFrQixFQUFFdFIsS0FMRztBQU12QnVSLEVBQUFBLG1CQUFtQixFQUFFUCxpQ0FORTtBQU92QlEsRUFBQUEsV0FBVyxFQUFFaFQsTUFQVTtBQVF2QmlULEVBQUFBLE1BQU0sRUFBRTNDO0FBUmUsQ0FBRCxDQUExQjtBQVdBLE1BQU00Qyx5QkFBeUIsR0FBRzlTLE1BQU0sQ0FBQztBQUNyQ2tKLEVBQUFBLE9BQU8sRUFBRXRKLE1BRDRCO0FBRXJDdUosRUFBQUEsQ0FBQyxFQUFFdkosTUFGa0M7QUFHckN3SixFQUFBQSxDQUFDLEVBQUV4SjtBQUhrQyxDQUFELENBQXhDO0FBTUEsTUFBTW1ULDhCQUE4QixHQUFHOVMsS0FBSyxDQUFDNlMseUJBQUQsQ0FBNUM7QUFDQSxNQUFNRSxlQUFlLEdBQUdoVCxNQUFNLENBQUM7QUFDM0JpRCxFQUFBQSxFQUFFLEVBQUVyRCxNQUR1QjtBQUUzQnFULEVBQUFBLFVBQVUsRUFBRUY7QUFGZSxDQUFELEVBRzNCLElBSDJCLENBQTlCO0FBS0EsTUFBTUcsVUFBVSxHQUFHalQsS0FBSyxDQUFDbUIsS0FBRCxDQUF4QjtBQUNBLE1BQU0rUixXQUFXLEdBQUdsVCxLQUFLLENBQUNxQyxNQUFELENBQXpCO0FBQ0EsTUFBTThRLHVCQUF1QixHQUFHblQsS0FBSyxDQUFDd0csa0JBQUQsQ0FBckM7QUFDQSxNQUFNNE0sS0FBSyxHQUFHclQsTUFBTSxDQUFDO0FBQ2pCaUQsRUFBQUEsRUFBRSxFQUFFckQsTUFEYTtBQUVqQnlELEVBQUFBLE1BQU0sRUFBRXpELE1BRlM7QUFHakIwRCxFQUFBQSxXQUFXLEVBQUVsRCxRQUFRLENBQUMsUUFBRCxFQUFXO0FBQUVtRCxJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjSSxJQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLFNBQVMsRUFBRSxDQUF0QztBQUF5Q0MsSUFBQUEsT0FBTyxFQUFFO0FBQWxELEdBQVgsQ0FISjtBQUlqQnlQLEVBQUFBLFNBQVMsRUFBRTFULE1BSk07QUFLakI2SCxFQUFBQSxVQUFVLEVBQUU3SCxNQUxLO0FBTWpCZ0IsRUFBQUEsTUFBTSxFQUFFaEIsTUFOUztBQU9qQjJULEVBQUFBLFdBQVcsRUFBRTNULE1BUEk7QUFRakJvSSxFQUFBQSxTQUFTLEVBQUVwSSxNQVJNO0FBU2pCNFQsRUFBQUEsa0JBQWtCLEVBQUU1VCxNQVRIO0FBVWpCZ0ksRUFBQUEsS0FBSyxFQUFFaEksTUFWVTtBQVdqQjZULEVBQUFBLFVBQVUsRUFBRS9TLFNBWEs7QUFZakJnVCxFQUFBQSxRQUFRLEVBQUVoVCxTQVpPO0FBYWpCaVQsRUFBQUEsWUFBWSxFQUFFalQsU0FiRztBQWNqQmtULEVBQUFBLGFBQWEsRUFBRWxULFNBZEU7QUFlakJtVCxFQUFBQSxpQkFBaUIsRUFBRW5ULFNBZkY7QUFnQmpCZ0osRUFBQUEsT0FBTyxFQUFFOUosTUFoQlE7QUFpQmpCa1UsRUFBQUEsNkJBQTZCLEVBQUVsVSxNQWpCZDtBQWtCakIySCxFQUFBQSxZQUFZLEVBQUUzSCxNQWxCRztBQW1CakJtVSxFQUFBQSxXQUFXLEVBQUVuVSxNQW5CSTtBQW9CakI4SCxFQUFBQSxVQUFVLEVBQUU5SCxNQXBCSztBQXFCakJvVSxFQUFBQSxXQUFXLEVBQUVwVSxNQXJCSTtBQXNCakIwSCxFQUFBQSxRQUFRLEVBQUV6SCxRQXRCTztBQXVCakJjLEVBQUFBLE1BQU0sRUFBRWQsUUF2QlM7QUF3QmpCNEksRUFBQUEsWUFBWSxFQUFFN0ksTUF4Qkc7QUF5QmpCOEksRUFBQUEsS0FBSyxFQUFFOUksTUF6QlU7QUEwQmpCbUksRUFBQUEsZ0JBQWdCLEVBQUVuSSxNQTFCRDtBQTJCakJxVSxFQUFBQSxvQkFBb0IsRUFBRXJVLE1BM0JMO0FBNEJqQnNVLEVBQUFBLFVBQVUsRUFBRTlPLGNBNUJLO0FBNkJqQitPLEVBQUFBLFlBQVksRUFBRWpCLFVBN0JHO0FBOEJqQmtCLEVBQUFBLFNBQVMsRUFBRXhVLE1BOUJNO0FBK0JqQnlVLEVBQUFBLGFBQWEsRUFBRWxCLFdBL0JFO0FBZ0NqQm1CLEVBQUFBLGNBQWMsRUFBRWxCLHVCQWhDQztBQWlDakJ0TSxFQUFBQSxRQUFRLEVBQUVsSCxNQWpDTztBQWtDakIyVSxFQUFBQSxZQUFZLEVBQUV4TixnQkFsQ0c7QUFtQ2pCeU4sRUFBQUEsTUFBTSxFQUFFbkMsV0FuQ1M7QUFvQ2pCWSxFQUFBQSxVQUFVLEVBQUUvUyxJQUFJLENBQUMsSUFBRCxFQUFPLG1CQUFQLEVBQTRCOFMsZUFBNUI7QUFwQ0MsQ0FBRCxFQXFDakIsSUFyQ2lCLENBQXBCO0FBdUNBLE1BQU15QixPQUFPLEdBQUd6VSxNQUFNLENBQUM7QUFDbkJpRCxFQUFBQSxFQUFFLEVBQUVyRCxNQURlO0FBRW5CNkksRUFBQUEsWUFBWSxFQUFFN0ksTUFGSztBQUduQjhVLEVBQUFBLFFBQVEsRUFBRTlVLE1BSFM7QUFJbkIrVSxFQUFBQSxhQUFhLEVBQUV2VSxRQUFRLENBQUMsVUFBRCxFQUFhO0FBQUV3VSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLElBQUFBLE1BQU0sRUFBRTtBQUFoQyxHQUFiLENBSko7QUFLbkJDLEVBQUFBLFNBQVMsRUFBRW5WLE1BTFE7QUFNbkJvVixFQUFBQSxXQUFXLEVBQUVsVixRQU5NO0FBT25CbVYsRUFBQUEsYUFBYSxFQUFFcFYsUUFQSTtBQVFuQnFWLEVBQUFBLE9BQU8sRUFBRXBWLFFBUlU7QUFTbkJxVixFQUFBQSxhQUFhLEVBQUVwUyxrQkFUSTtBQVVuQmtCLEVBQUFBLFdBQVcsRUFBRXJFLE1BVk07QUFXbkJzRSxFQUFBQSxJQUFJLEVBQUV0RSxNQVhhO0FBWW5CdUUsRUFBQUEsSUFBSSxFQUFFdkUsTUFaYTtBQWFuQndFLEVBQUFBLElBQUksRUFBRXhFLE1BYmE7QUFjbkJ5RSxFQUFBQSxJQUFJLEVBQUV6RSxNQWRhO0FBZW5CMEUsRUFBQUEsT0FBTyxFQUFFMUUsTUFmVTtBQWdCbkJzRixFQUFBQSxLQUFLLEVBQUV0RixNQWhCWTtBQWlCbkJ1RixFQUFBQSxHQUFHLEVBQUV2RjtBQWpCYyxDQUFELEVBa0JuQixJQWxCbUIsQ0FBdEI7QUFvQkEsTUFBTXdWLGtCQUFrQixHQUFHcFYsTUFBTSxDQUFDO0FBQzlCcVYsRUFBQUEsc0JBQXNCLEVBQUV2VixRQURNO0FBRTlCd1YsRUFBQUEsZ0JBQWdCLEVBQUV4VixRQUZZO0FBRzlCeVYsRUFBQUEsYUFBYSxFQUFFM1YsTUFIZTtBQUk5QjRWLEVBQUFBLGtCQUFrQixFQUFFcFYsUUFBUSxDQUFDLGVBQUQsRUFBa0I7QUFBRXFWLElBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWCxJQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJZLElBQUFBLE9BQU8sRUFBRTtBQUFwQyxHQUFsQjtBQUpFLENBQUQsQ0FBakM7QUFPQSxNQUFNQyxpQkFBaUIsR0FBRzNWLE1BQU0sQ0FBQztBQUM3QjRWLEVBQUFBLGtCQUFrQixFQUFFOVYsUUFEUztBQUU3QitWLEVBQUFBLE1BQU0sRUFBRS9WLFFBRnFCO0FBRzdCZ1csRUFBQUEsWUFBWSxFQUFFL1M7QUFIZSxDQUFELENBQWhDO0FBTUEsTUFBTWdULGtCQUFrQixHQUFHL1YsTUFBTSxDQUFDO0FBQzlCZ1csRUFBQUEsWUFBWSxFQUFFcFcsTUFEZ0I7QUFFOUJxVyxFQUFBQSxpQkFBaUIsRUFBRTdWLFFBQVEsQ0FBQyxjQUFELEVBQWlCO0FBQUU4VixJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxJQUFBQSxFQUFFLEVBQUU7QUFBbEIsR0FBakIsQ0FGRztBQUc5QkMsRUFBQUEsY0FBYyxFQUFFeFcsTUFIYztBQUk5QnlXLEVBQUFBLG1CQUFtQixFQUFFalcsUUFBUSxDQUFDLGdCQUFELEVBQW1CO0FBQUVrVyxJQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxJQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLEtBQUssRUFBRTtBQUFsQyxHQUFuQixDQUpDO0FBSzlCQyxFQUFBQSxPQUFPLEVBQUU3VyxNQUxxQjtBQU05QjhXLEVBQUFBLGNBQWMsRUFBRTlXLE1BTmM7QUFPOUIrVyxFQUFBQSxpQkFBaUIsRUFBRS9XLE1BUFc7QUFROUJnWCxFQUFBQSxRQUFRLEVBQUU5VyxRQVJvQjtBQVM5QitXLEVBQUFBLFFBQVEsRUFBRWhYLFFBVG9CO0FBVTlCNk4sRUFBQUEsU0FBUyxFQUFFN04sUUFWbUI7QUFXOUIrTixFQUFBQSxVQUFVLEVBQUVoTyxNQVhrQjtBQVk5QmtYLEVBQUFBLElBQUksRUFBRWxYLE1BWndCO0FBYTlCbVgsRUFBQUEsU0FBUyxFQUFFblgsTUFibUI7QUFjOUJvWCxFQUFBQSxRQUFRLEVBQUVwWCxNQWRvQjtBQWU5QnFYLEVBQUFBLFFBQVEsRUFBRXJYLE1BZm9CO0FBZ0I5QnNYLEVBQUFBLGtCQUFrQixFQUFFdFgsTUFoQlU7QUFpQjlCdVgsRUFBQUEsbUJBQW1CLEVBQUV2WDtBQWpCUyxDQUFELENBQWpDO0FBb0JBLE1BQU13WCxpQkFBaUIsR0FBR3BYLE1BQU0sQ0FBQztBQUM3QnlXLEVBQUFBLE9BQU8sRUFBRTdXLE1BRG9CO0FBRTdCeVgsRUFBQUEsS0FBSyxFQUFFelgsTUFGc0I7QUFHN0IwWCxFQUFBQSxRQUFRLEVBQUUxWCxNQUhtQjtBQUk3QjJWLEVBQUFBLGFBQWEsRUFBRTNWLE1BSmM7QUFLN0I0VixFQUFBQSxrQkFBa0IsRUFBRXBWLFFBQVEsQ0FBQyxlQUFELEVBQWtCO0FBQUVxVixJQUFBQSxTQUFTLEVBQUUsQ0FBYjtBQUFnQlgsSUFBQUEsTUFBTSxFQUFFLENBQXhCO0FBQTJCWSxJQUFBQSxPQUFPLEVBQUU7QUFBcEMsR0FBbEIsQ0FMQztBQU03QjZCLEVBQUFBLGNBQWMsRUFBRXpYLFFBTmE7QUFPN0IwWCxFQUFBQSxpQkFBaUIsRUFBRTFYLFFBUFU7QUFRN0IyWCxFQUFBQSxXQUFXLEVBQUU3WCxNQVJnQjtBQVM3QjhYLEVBQUFBLFVBQVUsRUFBRTlYLE1BVGlCO0FBVTdCK1gsRUFBQUEsV0FBVyxFQUFFL1gsTUFWZ0I7QUFXN0JnWSxFQUFBQSxZQUFZLEVBQUVoWSxNQVhlO0FBWTdCaVksRUFBQUEsZUFBZSxFQUFFalksTUFaWTtBQWE3QmtZLEVBQUFBLFlBQVksRUFBRWxZLE1BYmU7QUFjN0JtWSxFQUFBQSxnQkFBZ0IsRUFBRW5ZLE1BZFc7QUFlN0JvWSxFQUFBQSxvQkFBb0IsRUFBRXBZLE1BZk87QUFnQjdCcVksRUFBQUEsbUJBQW1CLEVBQUVyWTtBQWhCUSxDQUFELENBQWhDO0FBbUJBLE1BQU1zWSxpQkFBaUIsR0FBR2xZLE1BQU0sQ0FBQztBQUM3Qm1ZLEVBQUFBLFdBQVcsRUFBRXZZLE1BRGdCO0FBRTdCd1ksRUFBQUEsZ0JBQWdCLEVBQUVoWSxRQUFRLENBQUMsYUFBRCxFQUFnQjtBQUFFaVksSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsSUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxFQUFFLEVBQUU7QUFBL0IsR0FBaEIsQ0FGRztBQUc3QkMsRUFBQUEsY0FBYyxFQUFFNVksTUFIYTtBQUk3QjZZLEVBQUFBLGFBQWEsRUFBRTdZLE1BSmM7QUFLN0I4WSxFQUFBQSxZQUFZLEVBQUU1WSxRQUxlO0FBTTdCNlksRUFBQUEsUUFBUSxFQUFFN1ksUUFObUI7QUFPN0I4WSxFQUFBQSxRQUFRLEVBQUU5WTtBQVBtQixDQUFELENBQWhDO0FBVUEsTUFBTStZLG9CQUFvQixHQUFHN1ksTUFBTSxDQUFDO0FBQ2hDOFksRUFBQUEsaUJBQWlCLEVBQUVsWixNQURhO0FBRWhDbVosRUFBQUEsZUFBZSxFQUFFblosTUFGZTtBQUdoQ29aLEVBQUFBLFNBQVMsRUFBRXBaLE1BSHFCO0FBSWhDcVosRUFBQUEsWUFBWSxFQUFFclo7QUFKa0IsQ0FBRCxDQUFuQztBQU9BLE1BQU1zWixZQUFZLEdBQUdqWixLQUFLLENBQUMrQyxPQUFELENBQTFCO0FBQ0EsTUFBTW1XLFdBQVcsR0FBR25aLE1BQU0sQ0FBQztBQUN2QmlELEVBQUFBLEVBQUUsRUFBRXJELE1BRG1CO0FBRXZCd1osRUFBQUEsT0FBTyxFQUFFeFosTUFGYztBQUd2QnlaLEVBQUFBLFlBQVksRUFBRWpaLFFBQVEsQ0FBQyxTQUFELEVBQVk7QUFBRWtaLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsSUFBSSxFQUFFLENBQWpDO0FBQW9DQyxJQUFBQSxJQUFJLEVBQUUsQ0FBMUM7QUFBNkNDLElBQUFBLFlBQVksRUFBRSxDQUEzRDtBQUE4REMsSUFBQUEsWUFBWSxFQUFFLENBQTVFO0FBQStFQyxJQUFBQSxZQUFZLEVBQUUsQ0FBN0Y7QUFBZ0dDLElBQUFBLFlBQVksRUFBRTtBQUE5RyxHQUFaLENBSEM7QUFJdkJ4VyxFQUFBQSxNQUFNLEVBQUV6RCxNQUplO0FBS3ZCMEQsRUFBQUEsV0FBVyxFQUFFbEQsUUFBUSxDQUFDLFFBQUQsRUFBVztBQUFFbUQsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0csSUFBQUEsV0FBVyxFQUFFLENBQTNCO0FBQThCQyxJQUFBQSxRQUFRLEVBQUUsQ0FBeEM7QUFBMkNDLElBQUFBLFNBQVMsRUFBRSxDQUF0RDtBQUF5REMsSUFBQUEsT0FBTyxFQUFFO0FBQWxFLEdBQVgsQ0FMRTtBQU12QkUsRUFBQUEsUUFBUSxFQUFFbkUsTUFOYTtBQU92QjhHLEVBQUFBLFlBQVksRUFBRTlHLE1BUFM7QUFRdkI2SSxFQUFBQSxZQUFZLEVBQUU3SSxNQVJTO0FBU3ZCeUcsRUFBQUEsRUFBRSxFQUFFeEcsUUFUbUI7QUFVdkJpYSxFQUFBQSxlQUFlLEVBQUVsYSxNQVZNO0FBV3ZCbWEsRUFBQUEsYUFBYSxFQUFFbGEsUUFYUTtBQVl2Qm1hLEVBQUFBLEdBQUcsRUFBRXBhLE1BWmtCO0FBYXZCcWEsRUFBQUEsVUFBVSxFQUFFcmEsTUFiVztBQWN2QnNhLEVBQUFBLFdBQVcsRUFBRXRhLE1BZFU7QUFldkJ1YSxFQUFBQSxnQkFBZ0IsRUFBRS9aLFFBQVEsQ0FBQyxhQUFELEVBQWdCO0FBQUV3VSxJQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxJQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLElBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ3NGLElBQUFBLFFBQVEsRUFBRTtBQUE3QyxHQUFoQixDQWZIO0FBZ0J2QkMsRUFBQUEsVUFBVSxFQUFFemEsTUFoQlc7QUFpQnZCMGEsRUFBQUEsZUFBZSxFQUFFbGEsUUFBUSxDQUFDLFlBQUQsRUFBZTtBQUFFd1UsSUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsSUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxJQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUNzRixJQUFBQSxRQUFRLEVBQUU7QUFBN0MsR0FBZixDQWpCRjtBQWtCdkJwWSxFQUFBQSxNQUFNLEVBQUVwQyxNQWxCZTtBQW1CdkIyYSxFQUFBQSxVQUFVLEVBQUVyYSxJQUFJLENBQUMsUUFBRCxFQUFXLFVBQVgsRUFBdUI4QyxPQUF2QixDQW5CTztBQW9CdkJ3WCxFQUFBQSxRQUFRLEVBQUV4SyxXQXBCYTtBQXFCdkJ5SyxFQUFBQSxZQUFZLEVBQUV0YSxTQUFTLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUI2QyxPQUF6QixDQXJCQTtBQXNCdkJzRCxFQUFBQSxVQUFVLEVBQUV4RyxRQXRCVztBQXVCdkJ5RyxFQUFBQSxnQkFBZ0IsRUFBRXhELGtCQXZCSztBQXdCdkI2RCxFQUFBQSxRQUFRLEVBQUVoSCxNQXhCYTtBQXlCdkJpSCxFQUFBQSxRQUFRLEVBQUVqSCxNQXpCYTtBQTBCdkI4YSxFQUFBQSxZQUFZLEVBQUU5YSxNQTFCUztBQTJCdkIrYSxFQUFBQSxPQUFPLEVBQUV2RixrQkEzQmM7QUE0QnZCUyxFQUFBQSxNQUFNLEVBQUVGLGlCQTVCZTtBQTZCdkJpRixFQUFBQSxPQUFPLEVBQUU3RSxrQkE3QmM7QUE4QnZCOEUsRUFBQUEsTUFBTSxFQUFFekQsaUJBOUJlO0FBK0J2QnJTLEVBQUFBLE1BQU0sRUFBRW1ULGlCQS9CZTtBQWdDdkI0QyxFQUFBQSxPQUFPLEVBQUVsYixNQWhDYztBQWlDdkJtYixFQUFBQSxTQUFTLEVBQUVuYixNQWpDWTtBQWtDdkJvYixFQUFBQSxFQUFFLEVBQUVwYixNQWxDbUI7QUFtQ3ZCcWIsRUFBQUEsVUFBVSxFQUFFcEMsb0JBbkNXO0FBb0N2QnFDLEVBQUFBLG1CQUFtQixFQUFFdGIsTUFwQ0U7QUFxQ3ZCdWIsRUFBQUEsU0FBUyxFQUFFdmIsTUFyQ1k7QUFzQ3ZCc0YsRUFBQUEsS0FBSyxFQUFFdEYsTUF0Q2dCO0FBdUN2QnVGLEVBQUFBLEdBQUcsRUFBRXZGO0FBdkNrQixDQUFELEVBd0N2QixJQXhDdUIsQ0FBMUI7O0FBMENBLFNBQVN3YixlQUFULENBQXlCQyxFQUF6QixFQUE2QjtBQUN6QixTQUFPO0FBQ0g5YSxJQUFBQSxhQUFhLEVBQUU7QUFDWEUsTUFBQUEsS0FBSyxDQUFDNmEsTUFBRCxFQUFTO0FBQ1YsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUM3YSxLQUFYLENBQXJCO0FBQ0g7O0FBSFUsS0FEWjtBQU1IQyxJQUFBQSxTQUFTLEVBQUU7QUFDUEMsTUFBQUEsTUFBTSxDQUFDMmEsTUFBRCxFQUFTO0FBQ1gsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUMzYSxNQUFYLENBQXJCO0FBQ0g7O0FBSE0sS0FOUjtBQVdISSxJQUFBQSxXQUFXLEVBQUU7QUFDVEksTUFBQUEsaUJBQWlCLENBQUNtYSxNQUFELEVBQVM7QUFDdEIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNuYSxpQkFBWCxDQUFyQjtBQUNIOztBQUhRLEtBWFY7QUFnQkhDLElBQUFBLEtBQUssRUFBRTtBQUNIVSxNQUFBQSxPQUFPLENBQUN3WixNQUFELEVBQVM7QUFDWixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3haLE9BQVgsQ0FBckI7QUFDSCxPQUhFOztBQUlIRyxNQUFBQSxPQUFPLENBQUNxWixNQUFELEVBQVM7QUFDWixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3JaLE9BQVgsQ0FBckI7QUFDSCxPQU5FOztBQU9IRSxNQUFBQSxXQUFXLENBQUNtWixNQUFELEVBQVM7QUFDaEIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNuWixXQUFYLENBQXJCO0FBQ0gsT0FURTs7QUFVSEMsTUFBQUEsY0FBYyxDQUFDa1osTUFBRCxFQUFTO0FBQ25CLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDbFosY0FBWCxDQUFyQjtBQUNILE9BWkU7O0FBYUhkLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFa0IsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsR0FBRyxFQUFFLENBQXBCO0FBQXVCQyxRQUFBQSxXQUFXLEVBQUUsQ0FBcEM7QUFBdUNDLFFBQUFBLEtBQUssRUFBRSxDQUE5QztBQUFpREMsUUFBQUEsT0FBTyxFQUFFLENBQTFEO0FBQTZEQyxRQUFBQSxjQUFjLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLGdCQUFnQixFQUFFO0FBQWxHLE9BQWI7QUFibEMsS0FoQko7QUErQkhTLElBQUFBLE1BQU0sRUFBRTtBQUNKUSxNQUFBQSxlQUFlLENBQUN3WSxNQUFELEVBQVM7QUFDcEIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUN4WSxlQUFYLENBQXJCO0FBQ0gsT0FIRzs7QUFJSnhCLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFa0IsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsUUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCYyxRQUFBQSxTQUFTLEVBQUUsQ0FBMUM7QUFBNkNaLFFBQUFBLE9BQU8sRUFBRSxDQUF0RDtBQUF5RGEsUUFBQUEsa0JBQWtCLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLE9BQU8sRUFBRSxDQUF6RjtBQUE0RkMsUUFBQUEsZUFBZSxFQUFFLENBQTdHO0FBQWdIQyxRQUFBQSxJQUFJLEVBQUUsQ0FBQztBQUF2SCxPQUFiO0FBSmpDLEtBL0JMO0FBcUNISyxJQUFBQSxPQUFPLEVBQUU7QUFDTEMsTUFBQUEsRUFBRSxDQUFDcVksTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FISTs7QUFJTDVXLE1BQUFBLFVBQVUsQ0FBQzJXLE1BQUQsRUFBUztBQUNmLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDM1csVUFBWCxDQUFyQjtBQUNILE9BTkk7O0FBT0w3QyxNQUFBQSxPQUFPLENBQUN3WixNQUFELEVBQVM7QUFDWixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3haLE9BQVgsQ0FBckI7QUFDSCxPQVRJOztBQVVMRyxNQUFBQSxPQUFPLENBQUNxWixNQUFELEVBQVM7QUFDWixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3JaLE9BQVgsQ0FBckI7QUFDSCxPQVpJOztBQWFMNkMsTUFBQUEsVUFBVSxDQUFDd1csTUFBRCxFQUFTO0FBQ2YsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUN4VyxVQUFYLENBQXJCO0FBQ0gsT0FmSTs7QUFnQkxyRSxNQUFBQSxLQUFLLENBQUM2YSxNQUFELEVBQVM7QUFDVixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzdhLEtBQVgsQ0FBckI7QUFDSCxPQWxCSTs7QUFtQkxhLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFNkMsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsS0FBSyxFQUFFLENBQXRCO0FBQXlCQyxRQUFBQSxNQUFNLEVBQUU7QUFBakMsT0FBYixDQW5CaEM7QUFvQkxFLE1BQUFBLFdBQVcsRUFBRWpELHNCQUFzQixDQUFDLFFBQUQsRUFBVztBQUFFa0QsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsTUFBTSxFQUFFLENBQXRCO0FBQXlCQyxRQUFBQSxVQUFVLEVBQUUsQ0FBckM7QUFBd0NDLFFBQUFBLFdBQVcsRUFBRSxDQUFyRDtBQUF3REMsUUFBQUEsUUFBUSxFQUFFLENBQWxFO0FBQXFFQyxRQUFBQSxTQUFTLEVBQUUsQ0FBaEY7QUFBbUZDLFFBQUFBLE9BQU8sRUFBRSxDQUE1RjtBQUErRkMsUUFBQUEsVUFBVSxFQUFFO0FBQTNHLE9BQVg7QUFwQjlCLEtBckNOO0FBMkRIc0IsSUFBQUEsY0FBYyxFQUFFO0FBQ1pDLE1BQUFBLFdBQVcsQ0FBQ2lXLE1BQUQsRUFBUztBQUNoQixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ2pXLFdBQVgsQ0FBckI7QUFDSCxPQUhXOztBQUlaRSxNQUFBQSxRQUFRLENBQUMrVixNQUFELEVBQVM7QUFDYixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQy9WLFFBQVgsQ0FBckI7QUFDSCxPQU5XOztBQU9aRSxNQUFBQSxjQUFjLENBQUM2VixNQUFELEVBQVM7QUFDbkIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUM3VixjQUFYLENBQXJCO0FBQ0gsT0FUVzs7QUFVWkUsTUFBQUEsT0FBTyxDQUFDMlYsTUFBRCxFQUFTO0FBQ1osZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUMzVixPQUFYLENBQXJCO0FBQ0gsT0FaVzs7QUFhWjlDLE1BQUFBLFFBQVEsQ0FBQ3lZLE1BQUQsRUFBUztBQUNiLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDelksUUFBWCxDQUFyQjtBQUNILE9BZlc7O0FBZ0JaaUQsTUFBQUEsYUFBYSxDQUFDd1YsTUFBRCxFQUFTO0FBQ2xCLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDeFYsYUFBWCxDQUFyQjtBQUNILE9BbEJXOztBQW1CWkUsTUFBQUEsTUFBTSxDQUFDc1YsTUFBRCxFQUFTO0FBQ1gsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUN0VixNQUFYLENBQXJCO0FBQ0gsT0FyQlc7O0FBc0JaRSxNQUFBQSxhQUFhLENBQUNvVixNQUFELEVBQVM7QUFDbEIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNwVixhQUFYLENBQXJCO0FBQ0g7O0FBeEJXLEtBM0RiO0FBcUZIRSxJQUFBQSw4QkFBOEIsRUFBRTtBQUM1QkMsTUFBQUEsRUFBRSxDQUFDaVYsTUFBRCxFQUFTO0FBQ1AsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNqVixFQUFYLENBQXJCO0FBQ0gsT0FIMkI7O0FBSTVCQyxNQUFBQSxVQUFVLENBQUNnVixNQUFELEVBQVM7QUFDZixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ2hWLFVBQVgsQ0FBckI7QUFDSDs7QUFOMkIsS0FyRjdCO0FBNkZIYyxJQUFBQSwyQkFBMkIsRUFBRTtBQUN6QkUsTUFBQUEsUUFBUSxDQUFDZ1UsTUFBRCxFQUFTO0FBQ2IsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNoVSxRQUFYLENBQXJCO0FBQ0gsT0FId0I7O0FBSXpCM0csTUFBQUEsTUFBTSxDQUFDMmEsTUFBRCxFQUFTO0FBQ1gsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUMzYSxNQUFYLENBQXJCO0FBQ0gsT0FOd0I7O0FBT3pCOEUsTUFBQUEsY0FBYyxDQUFDNlYsTUFBRCxFQUFTO0FBQ25CLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDN1YsY0FBWCxDQUFyQjtBQUNILE9BVHdCOztBQVV6QjZDLE1BQUFBLGFBQWEsQ0FBQ2dULE1BQUQsRUFBUztBQUNsQixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ2hULGFBQVgsQ0FBckI7QUFDSCxPQVp3Qjs7QUFhekJKLE1BQUFBLGVBQWUsRUFBRTdILHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUFFc0MsUUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBV3dGLFFBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsUUFBQUEsS0FBSyxFQUFFO0FBQTVCLE9BQWY7QUFiZCxLQTdGMUI7QUE0R0hRLElBQUFBLG9CQUFvQixFQUFFO0FBQ2xCQyxNQUFBQSxJQUFJLENBQUN5UyxNQUFELEVBQVM7QUFDVCxlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3pTLElBQVgsQ0FBckI7QUFDSCxPQUhpQjs7QUFJbEJFLE1BQUFBLE1BQU0sQ0FBQ3VTLE1BQUQsRUFBUztBQUNYLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDdlMsTUFBWCxDQUFyQjtBQUNIOztBQU5pQixLQTVHbkI7QUFvSEhpSyxJQUFBQSxlQUFlLEVBQUU7QUFDYi9QLE1BQUFBLEVBQUUsQ0FBQ3FZLE1BQUQsRUFBUztBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNIOztBQUhZLEtBcEhkO0FBeUhIbEksSUFBQUEsS0FBSyxFQUFFO0FBQ0hwUSxNQUFBQSxFQUFFLENBQUNxWSxNQUFELEVBQVM7QUFDUCxlQUFPQSxNQUFNLENBQUNDLElBQWQ7QUFDSCxPQUhFOztBQUlIdEksTUFBQUEsVUFBVSxDQUFDcUksTUFBRCxFQUFTRSxLQUFULEVBQWdCQyxPQUFoQixFQUF5QjtBQUMvQixlQUFPQSxPQUFPLENBQUNKLEVBQVIsQ0FBV0ssaUJBQVgsQ0FBNkJDLFVBQTdCLENBQXdDTCxNQUFNLENBQUNyWSxFQUEvQyxDQUFQO0FBQ0gsT0FORTs7QUFPSHFFLE1BQUFBLFFBQVEsQ0FBQ2dVLE1BQUQsRUFBUztBQUNiLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDaFUsUUFBWCxDQUFyQjtBQUNILE9BVEU7O0FBVUgzRyxNQUFBQSxNQUFNLENBQUMyYSxNQUFELEVBQVM7QUFDWCxlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzNhLE1BQVgsQ0FBckI7QUFDSCxPQVpFOztBQWFIMkMsTUFBQUEsV0FBVyxFQUFFakQsc0JBQXNCLENBQUMsUUFBRCxFQUFXO0FBQUVrRCxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjSSxRQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLFNBQVMsRUFBRSxDQUF0QztBQUF5Q0MsUUFBQUEsT0FBTyxFQUFFO0FBQWxELE9BQVg7QUFiaEMsS0F6SEo7QUF3SUg0USxJQUFBQSxPQUFPLEVBQUU7QUFDTHhSLE1BQUFBLEVBQUUsQ0FBQ3FZLE1BQUQsRUFBUztBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7O0FBSUx2RyxNQUFBQSxXQUFXLENBQUNzRyxNQUFELEVBQVM7QUFDaEIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUN0RyxXQUFYLENBQXJCO0FBQ0gsT0FOSTs7QUFPTEMsTUFBQUEsYUFBYSxDQUFDcUcsTUFBRCxFQUFTO0FBQ2xCLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDckcsYUFBWCxDQUFyQjtBQUNILE9BVEk7O0FBVUxDLE1BQUFBLE9BQU8sQ0FBQ29HLE1BQUQsRUFBUztBQUNaLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDcEcsT0FBWCxDQUFyQjtBQUNILE9BWkk7O0FBYUxQLE1BQUFBLGFBQWEsRUFBRXRVLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFdVUsUUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsUUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxRQUFBQSxNQUFNLEVBQUU7QUFBaEMsT0FBYjtBQWJoQyxLQXhJTjtBQXVKSE0sSUFBQUEsa0JBQWtCLEVBQUU7QUFDaEJDLE1BQUFBLHNCQUFzQixDQUFDaUcsTUFBRCxFQUFTO0FBQzNCLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDakcsc0JBQVgsQ0FBckI7QUFDSCxPQUhlOztBQUloQkMsTUFBQUEsZ0JBQWdCLENBQUNnRyxNQUFELEVBQVM7QUFDckIsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNoRyxnQkFBWCxDQUFyQjtBQUNILE9BTmU7O0FBT2hCRSxNQUFBQSxrQkFBa0IsRUFBRW5WLHNCQUFzQixDQUFDLGVBQUQsRUFBa0I7QUFBRW9WLFFBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWCxRQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJZLFFBQUFBLE9BQU8sRUFBRTtBQUFwQyxPQUFsQjtBQVAxQixLQXZKakI7QUFnS0hDLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZDLE1BQUFBLGtCQUFrQixDQUFDMEYsTUFBRCxFQUFTO0FBQ3ZCLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDMUYsa0JBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxNQUFNLENBQUN5RixNQUFELEVBQVM7QUFDWCxlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3pGLE1BQVgsQ0FBckI7QUFDSDs7QUFOYyxLQWhLaEI7QUF3S0hFLElBQUFBLGtCQUFrQixFQUFFO0FBQ2hCYSxNQUFBQSxRQUFRLENBQUMwRSxNQUFELEVBQVM7QUFDYixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzFFLFFBQVgsQ0FBckI7QUFDSCxPQUhlOztBQUloQkMsTUFBQUEsUUFBUSxDQUFDeUUsTUFBRCxFQUFTO0FBQ2IsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUN6RSxRQUFYLENBQXJCO0FBQ0gsT0FOZTs7QUFPaEJuSixNQUFBQSxTQUFTLENBQUM0TixNQUFELEVBQVM7QUFDZCxlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzVOLFNBQVgsQ0FBckI7QUFDSCxPQVRlOztBQVVoQnVJLE1BQUFBLGlCQUFpQixFQUFFNVYsc0JBQXNCLENBQUMsY0FBRCxFQUFpQjtBQUFFNlYsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsRUFBRSxFQUFFO0FBQWxCLE9BQWpCLENBVnpCO0FBV2hCRSxNQUFBQSxtQkFBbUIsRUFBRWhXLHNCQUFzQixDQUFDLGdCQUFELEVBQW1CO0FBQUVpVyxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxRQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLEtBQUssRUFBRTtBQUFsQyxPQUFuQjtBQVgzQixLQXhLakI7QUFxTEhZLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZHLE1BQUFBLGNBQWMsQ0FBQytELE1BQUQsRUFBUztBQUNuQixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQy9ELGNBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxpQkFBaUIsQ0FBQzhELE1BQUQsRUFBUztBQUN0QixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzlELGlCQUFYLENBQXJCO0FBQ0gsT0FOYzs7QUFPZmhDLE1BQUFBLGtCQUFrQixFQUFFblYsc0JBQXNCLENBQUMsZUFBRCxFQUFrQjtBQUFFb1YsUUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JYLFFBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQlksUUFBQUEsT0FBTyxFQUFFO0FBQXBDLE9BQWxCO0FBUDNCLEtBckxoQjtBQThMSHdDLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZRLE1BQUFBLFlBQVksQ0FBQzRDLE1BQUQsRUFBUztBQUNqQixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzVDLFlBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxRQUFRLENBQUMyQyxNQUFELEVBQVM7QUFDYixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzNDLFFBQVgsQ0FBckI7QUFDSCxPQU5jOztBQU9mQyxNQUFBQSxRQUFRLENBQUMwQyxNQUFELEVBQVM7QUFDYixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQzFDLFFBQVgsQ0FBckI7QUFDSCxPQVRjOztBQVVmUixNQUFBQSxnQkFBZ0IsRUFBRS9YLHNCQUFzQixDQUFDLGFBQUQsRUFBZ0I7QUFBRWdZLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLFFBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsRUFBRSxFQUFFO0FBQS9CLE9BQWhCO0FBVnpCLEtBOUxoQjtBQTBNSFksSUFBQUEsV0FBVyxFQUFFO0FBQ1RsVyxNQUFBQSxFQUFFLENBQUNxWSxNQUFELEVBQVM7QUFDUCxlQUFPQSxNQUFNLENBQUNDLElBQWQ7QUFDSCxPQUhROztBQUlUaEIsTUFBQUEsVUFBVSxDQUFDZSxNQUFELEVBQVNFLEtBQVQsRUFBZ0JDLE9BQWhCLEVBQXlCO0FBQy9CLGVBQU9BLE9BQU8sQ0FBQ0osRUFBUixDQUFXTyxRQUFYLENBQW9CRCxVQUFwQixDQUErQkwsTUFBTSxDQUFDdFosTUFBdEMsQ0FBUDtBQUNILE9BTlE7O0FBT1R5WSxNQUFBQSxZQUFZLENBQUNhLE1BQUQsRUFBU0UsS0FBVCxFQUFnQkMsT0FBaEIsRUFBeUI7QUFDakMsZUFBT0EsT0FBTyxDQUFDSixFQUFSLENBQVdPLFFBQVgsQ0FBb0JDLFdBQXBCLENBQWdDUCxNQUFNLENBQUNkLFFBQXZDLENBQVA7QUFDSCxPQVRROztBQVVUblUsTUFBQUEsRUFBRSxDQUFDaVYsTUFBRCxFQUFTO0FBQ1AsZUFBT3ZiLGNBQWMsQ0FBQyxDQUFELEVBQUl1YixNQUFNLENBQUNqVixFQUFYLENBQXJCO0FBQ0gsT0FaUTs7QUFhVDBULE1BQUFBLGFBQWEsQ0FBQ3VCLE1BQUQsRUFBUztBQUNsQixlQUFPdmIsY0FBYyxDQUFDLENBQUQsRUFBSXViLE1BQU0sQ0FBQ3ZCLGFBQVgsQ0FBckI7QUFDSCxPQWZROztBQWdCVHpULE1BQUFBLFVBQVUsQ0FBQ2dWLE1BQUQsRUFBUztBQUNmLGVBQU92YixjQUFjLENBQUMsQ0FBRCxFQUFJdWIsTUFBTSxDQUFDaFYsVUFBWCxDQUFyQjtBQUNILE9BbEJROztBQW1CVCtTLE1BQUFBLFlBQVksRUFBRWhaLHNCQUFzQixDQUFDLFNBQUQsRUFBWTtBQUFFaVosUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxJQUFJLEVBQUUsQ0FBakM7QUFBb0NDLFFBQUFBLElBQUksRUFBRSxDQUExQztBQUE2Q0MsUUFBQUEsWUFBWSxFQUFFLENBQTNEO0FBQThEQyxRQUFBQSxZQUFZLEVBQUUsQ0FBNUU7QUFBK0VDLFFBQUFBLFlBQVksRUFBRSxDQUE3RjtBQUFnR0MsUUFBQUEsWUFBWSxFQUFFO0FBQTlHLE9BQVosQ0FuQjNCO0FBb0JUdlcsTUFBQUEsV0FBVyxFQUFFakQsc0JBQXNCLENBQUMsUUFBRCxFQUFXO0FBQUVrRCxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjRyxRQUFBQSxXQUFXLEVBQUUsQ0FBM0I7QUFBOEJDLFFBQUFBLFFBQVEsRUFBRSxDQUF4QztBQUEyQ0MsUUFBQUEsU0FBUyxFQUFFLENBQXREO0FBQXlEQyxRQUFBQSxPQUFPLEVBQUU7QUFBbEUsT0FBWCxDQXBCMUI7QUFxQlRzVyxNQUFBQSxnQkFBZ0IsRUFBRTlaLHNCQUFzQixDQUFDLGFBQUQsRUFBZ0I7QUFBRXVVLFFBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLFFBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3QkMsUUFBQUEsTUFBTSxFQUFFLENBQWhDO0FBQW1Dc0YsUUFBQUEsUUFBUSxFQUFFO0FBQTdDLE9BQWhCLENBckIvQjtBQXNCVEUsTUFBQUEsZUFBZSxFQUFFamEsc0JBQXNCLENBQUMsWUFBRCxFQUFlO0FBQUV1VSxRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLFFBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ3NGLFFBQUFBLFFBQVEsRUFBRTtBQUE3QyxPQUFmO0FBdEI5QixLQTFNVjtBQWtPSDBCLElBQUFBLEtBQUssRUFBRTtBQUNIRixNQUFBQSxRQUFRLEVBQUVQLEVBQUUsQ0FBQ08sUUFBSCxDQUFZRyxhQUFaLEVBRFA7QUFFSEwsTUFBQUEsaUJBQWlCLEVBQUVMLEVBQUUsQ0FBQ0ssaUJBQUgsQ0FBcUJLLGFBQXJCLEVBRmhCO0FBR0hDLE1BQUFBLE1BQU0sRUFBRVgsRUFBRSxDQUFDVyxNQUFILENBQVVELGFBQVYsRUFITDtBQUlIRSxNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRixhQUFaLEVBSlA7QUFLSHBWLE1BQUFBLFlBQVksRUFBRTBVLEVBQUUsQ0FBQzFVLFlBQUgsQ0FBZ0JvVixhQUFoQjtBQUxYLEtBbE9KO0FBeU9IRyxJQUFBQSxZQUFZLEVBQUU7QUFDVk4sTUFBQUEsUUFBUSxFQUFFUCxFQUFFLENBQUNPLFFBQUgsQ0FBWU8sb0JBQVosRUFEQTtBQUVWVCxNQUFBQSxpQkFBaUIsRUFBRUwsRUFBRSxDQUFDSyxpQkFBSCxDQUFxQlMsb0JBQXJCLEVBRlQ7QUFHVkgsTUFBQUEsTUFBTSxFQUFFWCxFQUFFLENBQUNXLE1BQUgsQ0FBVUcsb0JBQVYsRUFIRTtBQUlWRixNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRSxvQkFBWixFQUpBO0FBS1Z4VixNQUFBQSxZQUFZLEVBQUUwVSxFQUFFLENBQUMxVSxZQUFILENBQWdCd1Ysb0JBQWhCO0FBTEo7QUF6T1gsR0FBUDtBQWlQSDs7QUFFREMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JqQixFQUFBQSxlQURhO0FBRWI3YSxFQUFBQSxhQUZhO0FBR2JHLEVBQUFBLFNBSGE7QUFJYkssRUFBQUEsV0FKYTtBQUtiSyxFQUFBQSxLQUxhO0FBTWJrQixFQUFBQSxNQU5hO0FBT2JVLEVBQUFBLE9BUGE7QUFRYm9DLEVBQUFBLGNBUmE7QUFTYmdCLEVBQUFBLDhCQVRhO0FBVWJLLEVBQUFBLGtCQVZhO0FBV2JNLEVBQUFBLGdCQVhhO0FBWWJLLEVBQUFBLDJCQVphO0FBYWJvQixFQUFBQSxzQkFiYTtBQWNiSSxFQUFBQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFmYTtBQWdCYkksRUFBQUEsbUJBaEJhO0FBaUJiRyxFQUFBQSxtQkFqQmE7QUFrQmJDLEVBQUFBLG1CQWxCYTtBQW1CYkcsRUFBQUEsb0JBbkJhO0FBb0JiZ0IsRUFBQUEsb0JBcEJhO0FBcUJiRyxFQUFBQSxvQkFyQmE7QUFzQmJLLEVBQUFBLG9CQXRCYTtBQXVCYkksRUFBQUEsb0JBdkJhO0FBd0JiSyxFQUFBQSxvQkF4QmE7QUF5QmJNLEVBQUFBLG9CQXpCYTtBQTBCYkssRUFBQUEsb0JBMUJhO0FBMkJiUyxFQUFBQSxvQkEzQmE7QUE0QmJPLEVBQUFBLGVBNUJhO0FBNkJiVSxFQUFBQSxnQkE3QmE7QUE4QmJJLEVBQUFBLGNBOUJhO0FBK0JiQyxFQUFBQSxrQkEvQmE7QUFnQ2JDLEVBQUFBLFdBaENhO0FBaUNiSSxFQUFBQSxnQkFqQ2E7QUFrQ2JPLEVBQUFBLGdCQWxDYTtBQW1DYkksRUFBQUEsWUFuQ2E7QUFvQ2JXLEVBQUFBLGlCQXBDYTtBQXFDYm1DLEVBQUFBLFdBckNhO0FBc0NiUyxFQUFBQSx5QkF0Q2E7QUF1Q2JFLEVBQUFBLGVBdkNhO0FBd0NiSyxFQUFBQSxLQXhDYTtBQXlDYm9CLEVBQUFBLE9BekNhO0FBMENiVyxFQUFBQSxrQkExQ2E7QUEyQ2JPLEVBQUFBLGlCQTNDYTtBQTRDYkksRUFBQUEsa0JBNUNhO0FBNkNicUIsRUFBQUEsaUJBN0NhO0FBOENiYyxFQUFBQSxpQkE5Q2E7QUErQ2JXLEVBQUFBLG9CQS9DYTtBQWdEYk0sRUFBQUE7QUFoRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vZGItdHlwZXMuanMnKTtcbmNvbnN0IE90aGVyQ3VycmVuY3kgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnX2lkOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSWhyOiAxLCBJbW1lZGlhdGVseTogMiwgRmluYWw6IDMsIFRyYW5zaXQ6IDQsIERpc2NhcmRlZEZpbmFsOiA1LCBEaXNjYXJkZWRUcmFuc2l0OiA2IH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIEltbWVkaWF0ZWx5OiAxLCBPdXRNc2dOZXc6IDIsIFRyYW5zaXQ6IDMsIERlcXVldWVJbW1lZGlhdGVseTogNCwgRGVxdWV1ZTogNSwgVHJhbnNpdFJlcXVpcmVkOiA2LCBOb25lOiAtMSB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBPdGhlckN1cnJlbmN5QXJyYXkgPSBhcnJheShPdGhlckN1cnJlbmN5KTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfdHlwZV9uYW1lOiBlbnVtTmFtZSgnbXNnX3R5cGUnLCB7IEludGVybmFsOiAwLCBFeHRJbjogMSwgRXh0T3V0OiAyIH0pLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBRdWV1ZWQ6IDEsIFByb2Nlc3Npbmc6IDIsIFByZWxpbWluYXJ5OiAzLCBQcm9wb3NlZDogNCwgRmluYWxpemVkOiA1LCBSZWZ1c2VkOiA2LCBUcmFuc2l0aW5nOiA3IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBzcmNfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMgPSBzdHJ1Y3Qoe1xuICAgIGx0OiBiaWdVSW50MSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGVfbmFtZTogZW51bU5hbWUoJ3NwbGl0X3R5cGUnLCB7IE5vbmU6IDAsIFNwbGl0OiAyLCBNZXJnZTogMyB9KSxcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZmVlczogYmlnVUludDIsXG4gICAgZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNiA9IHN0cnVjdCh7XG4gICAgbWludF9uZXdfcHJpY2U6IHNjYWxhcixcbiAgICBtaW50X2FkZF9wcmljZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDcgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A4ID0gc3RydWN0KHtcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgY2FwYWJpbGl0aWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTIgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGVuYWJsZWRfc2luY2U6IHNjYWxhcixcbiAgICBhY3R1YWxfbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWluX3NwbGl0OiBzY2FsYXIsXG4gICAgbWF4X3NwbGl0OiBzY2FsYXIsXG4gICAgYWN0aXZlOiBzY2FsYXIsXG4gICAgYWNjZXB0X21zZ3M6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGJhc2ljOiBzY2FsYXIsXG4gICAgdm1fdmVyc2lvbjogc2NhbGFyLFxuICAgIHZtX21vZGU6IHNjYWxhcixcbiAgICBtaW5fYWRkcl9sZW46IHNjYWxhcixcbiAgICBtYXhfYWRkcl9sZW46IHNjYWxhcixcbiAgICBhZGRyX2xlbl9zdGVwOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX3R5cGVfaWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNCA9IHN0cnVjdCh7XG4gICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzY2FsYXIsXG4gICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE1ID0gc3RydWN0KHtcbiAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBzY2FsYXIsXG4gICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBzY2FsYXIsXG4gICAgc3Rha2VfaGVsZF9mb3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNiA9IHN0cnVjdCh7XG4gICAgbWF4X3ZhbGlkYXRvcnM6IHNjYWxhcixcbiAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWluX3ZhbGlkYXRvcnM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNyA9IHN0cnVjdCh7XG4gICAgbWluX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlOiBzY2FsYXIsXG4gICAgbWluX3RvdGFsX3N0YWtlOiBzY2FsYXIsXG4gICAgbWF4X3N0YWtlX2ZhY3Rvcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIGJpdF9wcmljZV9wczogc2NhbGFyLFxuICAgIGNlbGxfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19iaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBtY19jZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjggPSBzdHJ1Y3Qoe1xuICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AyOSA9IHN0cnVjdCh7XG4gICAgcm91bmRfY2FuZGlkYXRlczogc2NhbGFyLFxuICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBzY2FsYXIsXG4gICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHNjYWxhcixcbiAgICBmYXN0X2F0dGVtcHRzOiBzY2FsYXIsXG4gICAgYXR0ZW1wdF9kdXJhdGlvbjogc2NhbGFyLFxuICAgIGNhdGNoYWluX21heF9kZXBzOiBzY2FsYXIsXG4gICAgbWF4X2Jsb2NrX2J5dGVzOiBzY2FsYXIsXG4gICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzkgPSBzdHJ1Y3Qoe1xuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxuICAgIHRlbXBfcHVibGljX2tleTogc2NhbGFyLFxuICAgIHNlcW5vOiBzY2FsYXIsXG4gICAgdmFsaWRfdW50aWw6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfcjogc2NhbGFyLFxuICAgIHNpZ25hdHVyZV9zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzID0gc3RydWN0KHtcbiAgICBnYXNfcHJpY2U6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBibG9ja19nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzY2FsYXIsXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZmxhdF9nYXNfcHJpY2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0J5dGVzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzR2FzID0gc3RydWN0KHtcbiAgICB1bmRlcmxvYWQ6IHNjYWxhcixcbiAgICBzb2Z0X2xpbWl0OiBzY2FsYXIsXG4gICAgaGFyZF9saW1pdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTGltaXRzTHREZWx0YSA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0cyA9IHN0cnVjdCh7XG4gICAgYnl0ZXM6IEJsb2NrTGltaXRzQnl0ZXMsXG4gICAgZ2FzOiBCbG9ja0xpbWl0c0dhcyxcbiAgICBsdF9kZWx0YTogQmxvY2tMaW1pdHNMdERlbHRhLFxufSk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXMgPSBzdHJ1Y3Qoe1xuICAgIGx1bXBfcHJpY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG4gICAgaWhyX3ByaWNlX2ZhY3Rvcjogc2NhbGFyLFxuICAgIGZpcnN0X2ZyYWM6IHNjYWxhcixcbiAgICBuZXh0X2ZyYWM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBWYWxpZGF0b3JTZXRMaXN0ID0gc3RydWN0KHtcbiAgICBwdWJsaWNfa2V5OiBzY2FsYXIsXG4gICAgd2VpZ2h0OiBzY2FsYXIsXG4gICAgYWRubF9hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdEFycmF5ID0gYXJyYXkoVmFsaWRhdG9yU2V0TGlzdCk7XG5jb25zdCBWYWxpZGF0b3JTZXQgPSBzdHJ1Y3Qoe1xuICAgIHV0aW1lX3NpbmNlOiBzY2FsYXIsXG4gICAgdXRpbWVfdW50aWw6IHNjYWxhcixcbiAgICB0b3RhbDogc2NhbGFyLFxuICAgIHRvdGFsX3dlaWdodDogc2NhbGFyLFxuICAgIGxpc3Q6IFZhbGlkYXRvclNldExpc3RBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1A3KTtcbmNvbnN0IEZsb2F0QXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDEyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxOCk7XG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AzOUFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMzkpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWcgPSBzdHJ1Y3Qoe1xuICAgIHAwOiBzY2FsYXIsXG4gICAgcDE6IHNjYWxhcixcbiAgICBwMjogc2NhbGFyLFxuICAgIHAzOiBzY2FsYXIsXG4gICAgcDQ6IHNjYWxhcixcbiAgICBwNjogQmxvY2tNYXN0ZXJDb25maWdQNixcbiAgICBwNzogQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5LFxuICAgIHA4OiBCbG9ja01hc3RlckNvbmZpZ1A4LFxuICAgIHA5OiBGbG9hdEFycmF5LFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvYyhwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxMixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxNyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AxOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOCxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AyOSxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1AzOSxcbiAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgQmxvY2tMaW1pdHNCeXRlcyxcbiAgICBCbG9ja0xpbWl0c0dhcyxcbiAgICBCbG9ja0xpbWl0c0x0RGVsdGEsXG4gICAgQmxvY2tMaW1pdHMsXG4gICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICBWYWxpZGF0b3JTZXRMaXN0LFxuICAgIFZhbGlkYXRvclNldCxcbiAgICBCbG9ja01hc3RlckNvbmZpZyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzLFxuICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19