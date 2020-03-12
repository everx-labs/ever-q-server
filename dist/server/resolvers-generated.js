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
  Account,
  TransactionStorage,
  TransactionCredit,
  TransactionCompute,
  TransactionAction,
  TransactionBounce,
  TransactionSplitInfo,
  Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtZ2VuZXJhdGVkLmpzIl0sIm5hbWVzIjpbInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJyZXNvbHZlQmlnVUludCIsInN0cnVjdCIsImFycmF5Iiwiam9pbiIsImpvaW5BcnJheSIsImVudW1OYW1lIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlcXVpcmUiLCJPdGhlckN1cnJlbmN5IiwiY3VycmVuY3kiLCJ2YWx1ZSIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnIiwibXNnX3R5cGUiLCJtc2dfdHlwZV9uYW1lIiwiRXh0ZXJuYWwiLCJJaHIiLCJJbW1lZGlhdGVseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsImlocl9mZWUiLCJwcm9vZl9jcmVhdGVkIiwiaW5fbXNnIiwiZndkX2ZlZSIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiT3V0TXNnIiwiT3V0TXNnTmV3IiwiRGVxdWV1ZUltbWVkaWF0ZWx5IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk5vbmUiLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3RoZXJDdXJyZW5jeUFycmF5IiwiTWVzc2FnZSIsImlkIiwiSW50ZXJuYWwiLCJFeHRJbiIsIkV4dE91dCIsInN0YXR1cyIsInN0YXR1c19uYW1lIiwiVW5rbm93biIsIlF1ZXVlZCIsIlByb2Nlc3NpbmciLCJQcmVsaW1pbmFyeSIsIlByb3Bvc2VkIiwiRmluYWxpemVkIiwiUmVmdXNlZCIsIlRyYW5zaXRpbmciLCJibG9ja19pZCIsImJvZHkiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5Iiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJwcm9vZiIsImJvYyIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMiLCJsdCIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXRfdHlwZV9uYW1lIiwiU3BsaXQiLCJNZXJnZSIsInNwbGl0IiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiQmxvY2tNYXN0ZXJDb25maWdQNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJCbG9ja01hc3RlckNvbmZpZ1A3IiwiQmxvY2tNYXN0ZXJDb25maWdQOCIsInZlcnNpb24iLCJjYXBhYmlsaXRpZXMiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsIkJsb2NrTWFzdGVyQ29uZmlnUDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwiQmxvY2tNYXN0ZXJDb25maWdQMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsIkJsb2NrTWFzdGVyQ29uZmlnUDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsIkJsb2NrTWFzdGVyQ29uZmlnUDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsIkJsb2NrTWFzdGVyQ29uZmlnUDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwiQmxvY2tNYXN0ZXJDb25maWdQMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsImdhc19saW1pdCIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsIkJsb2NrTGltaXRzQnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsIkJsb2NrTGltaXRzR2FzIiwiQmxvY2tMaW1pdHNMdERlbHRhIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsImdhcyIsImx0X2RlbHRhIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIlZhbGlkYXRvclNldExpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiVmFsaWRhdG9yU2V0TGlzdEFycmF5IiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJCbG9ja01hc3RlckNvbmZpZ1A3QXJyYXkiLCJGbG9hdEFycmF5IiwiQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDE4QXJyYXkiLCJTdHJpbmdBcnJheSIsIkJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXkiLCJCbG9ja01hc3RlckNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsInA3IiwicDgiLCJwOSIsInAxMSIsInAxMiIsInAxNCIsInAxNSIsInAxNiIsInAxNyIsInAxOCIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInAyOSIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzQXJyYXkiLCJCbG9ja01hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwic2hhcmRfZmVlcyIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsIkJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMiLCJCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkiLCJCbG9ja1NpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwic3RhdGVfdXBkYXRlIiwibWFzdGVyIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWNjX3R5cGVfbmFtZSIsIlVuaW5pdCIsIkFjdGl2ZSIsIkZyb3plbiIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwic3RhdHVzX2NoYW5nZV9uYW1lIiwiVW5jaGFuZ2VkIiwiRGVsZXRlZCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwiY29tcHV0ZV90eXBlX25hbWUiLCJTa2lwcGVkIiwiVm0iLCJza2lwcGVkX3JlYXNvbiIsInNraXBwZWRfcmVhc29uX25hbWUiLCJOb1N0YXRlIiwiQmFkU3RhdGUiLCJOb0dhcyIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwiYm91bmNlX3R5cGVfbmFtZSIsIk5lZ0Z1bmRzIiwiTm9GdW5kcyIsIk9rIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJ0cl90eXBlX25hbWUiLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJUaWNrIiwiVG9jayIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJvcmlnX3N0YXR1c19uYW1lIiwiTm9uRXhpc3QiLCJlbmRfc3RhdHVzIiwiZW5kX3N0YXR1c19uYW1lIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIl9hcmdzIiwiY29udGV4dCIsImJsb2Nrc19zaWduYXR1cmVzIiwid2FpdEZvckRvYyIsIm1lc3NhZ2VzIiwid2FpdEZvckRvY3MiLCJRdWVyeSIsInF1ZXJ5UmVzb2x2ZXIiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblJlc29sdmVyIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQSxNQUFNO0FBQ0ZBLEVBQUFBLE1BREU7QUFFRkMsRUFBQUEsUUFGRTtBQUdGQyxFQUFBQSxRQUhFO0FBSUZDLEVBQUFBLGNBSkU7QUFLRkMsRUFBQUEsTUFMRTtBQU1GQyxFQUFBQSxLQU5FO0FBT0ZDLEVBQUFBLElBUEU7QUFRRkMsRUFBQUEsU0FSRTtBQVNGQyxFQUFBQSxRQVRFO0FBVUZDLEVBQUFBO0FBVkUsSUFXRkMsT0FBTyxDQUFDLGVBQUQsQ0FYWDs7QUFZQSxNQUFNQyxhQUFhLEdBQUdQLE1BQU0sQ0FBQztBQUN6QlEsRUFBQUEsUUFBUSxFQUFFWixNQURlO0FBRXpCYSxFQUFBQSxLQUFLLEVBQUVYO0FBRmtCLENBQUQsQ0FBNUI7QUFLQSxNQUFNWSxTQUFTLEdBQUdWLE1BQU0sQ0FBQztBQUNyQlcsRUFBQUEsTUFBTSxFQUFFZCxRQURhO0FBRXJCZSxFQUFBQSxNQUFNLEVBQUVoQixNQUZhO0FBR3JCaUIsRUFBQUEsU0FBUyxFQUFFakIsTUFIVTtBQUlyQmtCLEVBQUFBLFNBQVMsRUFBRWxCO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLE1BQU1tQixXQUFXLEdBQUdmLE1BQU0sQ0FBQztBQUN2QmdCLEVBQUFBLE1BQU0sRUFBRXBCLE1BRGU7QUFFdkJxQixFQUFBQSxTQUFTLEVBQUVyQixNQUZZO0FBR3ZCc0IsRUFBQUEsUUFBUSxFQUFFdEIsTUFIYTtBQUl2QnVCLEVBQUFBLGlCQUFpQixFQUFFckI7QUFKSSxDQUFELENBQTFCO0FBT0EsTUFBTXNCLEtBQUssR0FBR3BCLE1BQU0sQ0FBQztBQUNqQnFCLEVBQUFBLFFBQVEsRUFBRXpCLE1BRE87QUFFakIwQixFQUFBQSxhQUFhLEVBQUVsQixRQUFRLENBQUMsVUFBRCxFQUFhO0FBQUVtQixJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxJQUFBQSxHQUFHLEVBQUUsQ0FBcEI7QUFBdUJDLElBQUFBLFdBQVcsRUFBRSxDQUFwQztBQUF1Q0MsSUFBQUEsS0FBSyxFQUFFLENBQTlDO0FBQWlEQyxJQUFBQSxPQUFPLEVBQUUsQ0FBMUQ7QUFBNkRDLElBQUFBLGNBQWMsRUFBRSxDQUE3RTtBQUFnRkMsSUFBQUEsZ0JBQWdCLEVBQUU7QUFBbEcsR0FBYixDQUZOO0FBR2pCYixFQUFBQSxNQUFNLEVBQUVwQixNQUhTO0FBSWpCa0MsRUFBQUEsT0FBTyxFQUFFaEMsUUFKUTtBQUtqQmlDLEVBQUFBLGFBQWEsRUFBRW5DLE1BTEU7QUFNakJvQyxFQUFBQSxNQUFNLEVBQUVqQixXQU5TO0FBT2pCa0IsRUFBQUEsT0FBTyxFQUFFbkMsUUFQUTtBQVFqQm9DLEVBQUFBLE9BQU8sRUFBRW5CLFdBUlE7QUFTakJvQixFQUFBQSxXQUFXLEVBQUVyQyxRQVRJO0FBVWpCc0MsRUFBQUEsY0FBYyxFQUFFeEMsTUFWQztBQVdqQnlDLEVBQUFBLGVBQWUsRUFBRXpDO0FBWEEsQ0FBRCxDQUFwQjtBQWNBLE1BQU0wQyxNQUFNLEdBQUd0QyxNQUFNLENBQUM7QUFDbEJxQixFQUFBQSxRQUFRLEVBQUV6QixNQURRO0FBRWxCMEIsRUFBQUEsYUFBYSxFQUFFbEIsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFbUIsSUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsSUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCYyxJQUFBQSxTQUFTLEVBQUUsQ0FBMUM7QUFBNkNaLElBQUFBLE9BQU8sRUFBRSxDQUF0RDtBQUF5RGEsSUFBQUEsa0JBQWtCLEVBQUUsQ0FBN0U7QUFBZ0ZDLElBQUFBLE9BQU8sRUFBRSxDQUF6RjtBQUE0RkMsSUFBQUEsZUFBZSxFQUFFLENBQTdHO0FBQWdIQyxJQUFBQSxJQUFJLEVBQUUsQ0FBQztBQUF2SCxHQUFiLENBRkw7QUFHbEIzQixFQUFBQSxNQUFNLEVBQUVwQixNQUhVO0FBSWxCd0MsRUFBQUEsY0FBYyxFQUFFeEMsTUFKRTtBQUtsQnNDLEVBQUFBLE9BQU8sRUFBRW5CLFdBTFM7QUFNbEI2QixFQUFBQSxRQUFRLEVBQUV4QixLQU5RO0FBT2xCeUIsRUFBQUEsUUFBUSxFQUFFekIsS0FQUTtBQVFsQjBCLEVBQUFBLGVBQWUsRUFBRWpEO0FBUkMsQ0FBRCxDQUFyQjtBQVdBLE1BQU1rRCxrQkFBa0IsR0FBRzlDLEtBQUssQ0FBQ00sYUFBRCxDQUFoQztBQUNBLE1BQU15QyxPQUFPLEdBQUdoRCxNQUFNLENBQUM7QUFDbkJpRCxFQUFBQSxFQUFFLEVBQUVyRCxNQURlO0FBRW5CeUIsRUFBQUEsUUFBUSxFQUFFekIsTUFGUztBQUduQjBCLEVBQUFBLGFBQWEsRUFBRWxCLFFBQVEsQ0FBQyxVQUFELEVBQWE7QUFBRThDLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLEtBQUssRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsTUFBTSxFQUFFO0FBQWpDLEdBQWIsQ0FISjtBQUluQkMsRUFBQUEsTUFBTSxFQUFFekQsTUFKVztBQUtuQjBELEVBQUFBLFdBQVcsRUFBRWxELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNDLElBQUFBLE1BQU0sRUFBRSxDQUF0QjtBQUF5QkMsSUFBQUEsVUFBVSxFQUFFLENBQXJDO0FBQXdDQyxJQUFBQSxXQUFXLEVBQUUsQ0FBckQ7QUFBd0RDLElBQUFBLFFBQVEsRUFBRSxDQUFsRTtBQUFxRUMsSUFBQUEsU0FBUyxFQUFFLENBQWhGO0FBQW1GQyxJQUFBQSxPQUFPLEVBQUUsQ0FBNUY7QUFBK0ZDLElBQUFBLFVBQVUsRUFBRTtBQUEzRyxHQUFYLENBTEY7QUFNbkJDLEVBQUFBLFFBQVEsRUFBRW5FLE1BTlM7QUFPbkJvRSxFQUFBQSxJQUFJLEVBQUVwRSxNQVBhO0FBUW5CcUUsRUFBQUEsV0FBVyxFQUFFckUsTUFSTTtBQVNuQnNFLEVBQUFBLElBQUksRUFBRXRFLE1BVGE7QUFVbkJ1RSxFQUFBQSxJQUFJLEVBQUV2RSxNQVZhO0FBV25Cd0UsRUFBQUEsSUFBSSxFQUFFeEUsTUFYYTtBQVluQnlFLEVBQUFBLElBQUksRUFBRXpFLE1BWmE7QUFhbkIwRSxFQUFBQSxPQUFPLEVBQUUxRSxNQWJVO0FBY25CMkUsRUFBQUEsR0FBRyxFQUFFM0UsTUFkYztBQWVuQjRFLEVBQUFBLEdBQUcsRUFBRTVFLE1BZmM7QUFnQm5CNkUsRUFBQUEsZ0JBQWdCLEVBQUU3RSxNQWhCQztBQWlCbkI4RSxFQUFBQSxnQkFBZ0IsRUFBRTlFLE1BakJDO0FBa0JuQitFLEVBQUFBLFVBQVUsRUFBRTlFLFFBbEJPO0FBbUJuQitFLEVBQUFBLFVBQVUsRUFBRWhGLE1BbkJPO0FBb0JuQmlGLEVBQUFBLFlBQVksRUFBRWpGLE1BcEJLO0FBcUJuQmtDLEVBQUFBLE9BQU8sRUFBRWhDLFFBckJVO0FBc0JuQm1DLEVBQUFBLE9BQU8sRUFBRW5DLFFBdEJVO0FBdUJuQmdGLEVBQUFBLFVBQVUsRUFBRWhGLFFBdkJPO0FBd0JuQmlGLEVBQUFBLE1BQU0sRUFBRW5GLE1BeEJXO0FBeUJuQm9GLEVBQUFBLE9BQU8sRUFBRXBGLE1BekJVO0FBMEJuQmEsRUFBQUEsS0FBSyxFQUFFWCxRQTFCWTtBQTJCbkJtRixFQUFBQSxXQUFXLEVBQUVsQyxrQkEzQk07QUE0Qm5CbUMsRUFBQUEsS0FBSyxFQUFFdEYsTUE1Qlk7QUE2Qm5CdUYsRUFBQUEsR0FBRyxFQUFFdkY7QUE3QmMsQ0FBRCxFQThCbkIsSUE5Qm1CLENBQXRCO0FBZ0NBLE1BQU13RixjQUFjLEdBQUdwRixNQUFNLENBQUM7QUFDMUJxRixFQUFBQSxXQUFXLEVBQUV2RixRQURhO0FBRTFCd0YsRUFBQUEsaUJBQWlCLEVBQUV2QyxrQkFGTztBQUcxQndDLEVBQUFBLFFBQVEsRUFBRXpGLFFBSGdCO0FBSTFCMEYsRUFBQUEsY0FBYyxFQUFFekMsa0JBSlU7QUFLMUIwQyxFQUFBQSxjQUFjLEVBQUUzRixRQUxVO0FBTTFCNEYsRUFBQUEsb0JBQW9CLEVBQUUzQyxrQkFOSTtBQU8xQjRDLEVBQUFBLE9BQU8sRUFBRTdGLFFBUGlCO0FBUTFCOEYsRUFBQUEsYUFBYSxFQUFFN0Msa0JBUlc7QUFTMUJGLEVBQUFBLFFBQVEsRUFBRS9DLFFBVGdCO0FBVTFCK0YsRUFBQUEsY0FBYyxFQUFFOUMsa0JBVlU7QUFXMUIrQyxFQUFBQSxhQUFhLEVBQUVoRyxRQVhXO0FBWTFCaUcsRUFBQUEsbUJBQW1CLEVBQUVoRCxrQkFaSztBQWExQmlELEVBQUFBLE1BQU0sRUFBRWxHLFFBYmtCO0FBYzFCbUcsRUFBQUEsWUFBWSxFQUFFbEQsa0JBZFk7QUFlMUJtRCxFQUFBQSxhQUFhLEVBQUVwRyxRQWZXO0FBZ0IxQnFHLEVBQUFBLG1CQUFtQixFQUFFcEQ7QUFoQkssQ0FBRCxDQUE3QjtBQW1CQSxNQUFNcUQsOEJBQThCLEdBQUdwRyxNQUFNLENBQUM7QUFDMUNxRyxFQUFBQSxFQUFFLEVBQUV4RyxRQURzQztBQUUxQ3VDLEVBQUFBLGNBQWMsRUFBRXhDLE1BRjBCO0FBRzFDMEcsRUFBQUEsVUFBVSxFQUFFeEcsUUFIOEI7QUFJMUN5RyxFQUFBQSxnQkFBZ0IsRUFBRXhEO0FBSndCLENBQUQsQ0FBN0M7QUFPQSxNQUFNeUQsbUNBQW1DLEdBQUd2RyxLQUFLLENBQUNtRyw4QkFBRCxDQUFqRDtBQUNBLE1BQU1LLGtCQUFrQixHQUFHekcsTUFBTSxDQUFDO0FBQzlCMEcsRUFBQUEsWUFBWSxFQUFFOUcsTUFEZ0I7QUFFOUIrRyxFQUFBQSxZQUFZLEVBQUVILG1DQUZnQjtBQUc5QkksRUFBQUEsUUFBUSxFQUFFaEgsTUFIb0I7QUFJOUJpSCxFQUFBQSxRQUFRLEVBQUVqSCxNQUpvQjtBQUs5QmtILEVBQUFBLFFBQVEsRUFBRWxIO0FBTG9CLENBQUQsQ0FBakM7QUFRQSxNQUFNbUgsZ0JBQWdCLEdBQUcvRyxNQUFNLENBQUM7QUFDNUJnSCxFQUFBQSxHQUFHLEVBQUVwSCxNQUR1QjtBQUU1QmlILEVBQUFBLFFBQVEsRUFBRWpILE1BRmtCO0FBRzVCcUgsRUFBQUEsU0FBUyxFQUFFckgsTUFIaUI7QUFJNUJzSCxFQUFBQSxHQUFHLEVBQUV0SCxNQUp1QjtBQUs1QmdILEVBQUFBLFFBQVEsRUFBRWhILE1BTGtCO0FBTTVCdUgsRUFBQUEsU0FBUyxFQUFFdkg7QUFOaUIsQ0FBRCxDQUEvQjtBQVNBLE1BQU13SCwyQkFBMkIsR0FBR3BILE1BQU0sQ0FBQztBQUN2Q1ksRUFBQUEsTUFBTSxFQUFFaEIsTUFEK0I7QUFFdkN5SCxFQUFBQSxZQUFZLEVBQUV6SCxNQUZ5QjtBQUd2QzBILEVBQUFBLFFBQVEsRUFBRXpILFFBSDZCO0FBSXZDYyxFQUFBQSxNQUFNLEVBQUVkLFFBSitCO0FBS3ZDZ0IsRUFBQUEsU0FBUyxFQUFFakIsTUFMNEI7QUFNdkNrQixFQUFBQSxTQUFTLEVBQUVsQixNQU40QjtBQU92QzJILEVBQUFBLFlBQVksRUFBRTNILE1BUHlCO0FBUXZDNEgsRUFBQUEsWUFBWSxFQUFFNUgsTUFSeUI7QUFTdkM2SCxFQUFBQSxVQUFVLEVBQUU3SCxNQVQyQjtBQVV2QzhILEVBQUFBLFVBQVUsRUFBRTlILE1BVjJCO0FBV3ZDK0gsRUFBQUEsYUFBYSxFQUFFL0gsTUFYd0I7QUFZdkNnSSxFQUFBQSxLQUFLLEVBQUVoSSxNQVpnQztBQWF2Q2lJLEVBQUFBLG1CQUFtQixFQUFFakksTUFia0I7QUFjdkNrSSxFQUFBQSxvQkFBb0IsRUFBRWxJLE1BZGlCO0FBZXZDbUksRUFBQUEsZ0JBQWdCLEVBQUVuSSxNQWZxQjtBQWdCdkNvSSxFQUFBQSxTQUFTLEVBQUVwSSxNQWhCNEI7QUFpQnZDcUksRUFBQUEsVUFBVSxFQUFFckksTUFqQjJCO0FBa0J2Q3NJLEVBQUFBLGVBQWUsRUFBRTlILFFBQVEsQ0FBQyxZQUFELEVBQWU7QUFBRXVDLElBQUFBLElBQUksRUFBRSxDQUFSO0FBQVd3RixJQUFBQSxLQUFLLEVBQUUsQ0FBbEI7QUFBcUJDLElBQUFBLEtBQUssRUFBRTtBQUE1QixHQUFmLENBbEJjO0FBbUJ2Q0MsRUFBQUEsS0FBSyxFQUFFekksTUFuQmdDO0FBb0J2QzZGLEVBQUFBLGNBQWMsRUFBRTNGLFFBcEJ1QjtBQXFCdkM0RixFQUFBQSxvQkFBb0IsRUFBRTNDLGtCQXJCaUI7QUFzQnZDdUYsRUFBQUEsYUFBYSxFQUFFeEksUUF0QndCO0FBdUJ2Q3lJLEVBQUFBLG1CQUFtQixFQUFFeEY7QUF2QmtCLENBQUQsQ0FBMUM7QUEwQkEsTUFBTXlGLHNCQUFzQixHQUFHeEksTUFBTSxDQUFDO0FBQ2xDeUksRUFBQUEsWUFBWSxFQUFFN0ksTUFEb0I7QUFFbEM4SSxFQUFBQSxLQUFLLEVBQUU5SSxNQUYyQjtBQUdsQytJLEVBQUFBLEtBQUssRUFBRXZCO0FBSDJCLENBQUQsQ0FBckM7QUFNQSxNQUFNd0Isb0JBQW9CLEdBQUc1SSxNQUFNLENBQUM7QUFDaEN5SSxFQUFBQSxZQUFZLEVBQUU3SSxNQURrQjtBQUVoQzhJLEVBQUFBLEtBQUssRUFBRTlJLE1BRnlCO0FBR2hDaUosRUFBQUEsSUFBSSxFQUFFL0ksUUFIMEI7QUFJaENnSixFQUFBQSxVQUFVLEVBQUUvRixrQkFKb0I7QUFLaENnRyxFQUFBQSxNQUFNLEVBQUVqSixRQUx3QjtBQU1oQ2tKLEVBQUFBLFlBQVksRUFBRWpHO0FBTmtCLENBQUQsQ0FBbkM7QUFTQSxNQUFNa0csNEJBQTRCLEdBQUdqSixNQUFNLENBQUM7QUFDeENrSixFQUFBQSxPQUFPLEVBQUV0SixNQUQrQjtBQUV4Q3VKLEVBQUFBLENBQUMsRUFBRXZKLE1BRnFDO0FBR3hDd0osRUFBQUEsQ0FBQyxFQUFFeEo7QUFIcUMsQ0FBRCxDQUEzQztBQU1BLE1BQU15SixtQkFBbUIsR0FBR3JKLE1BQU0sQ0FBQztBQUMvQnNKLEVBQUFBLGNBQWMsRUFBRTFKLE1BRGU7QUFFL0IySixFQUFBQSxjQUFjLEVBQUUzSjtBQUZlLENBQUQsQ0FBbEM7QUFLQSxNQUFNNEosbUJBQW1CLEdBQUd4SixNQUFNLENBQUM7QUFDL0JRLEVBQUFBLFFBQVEsRUFBRVosTUFEcUI7QUFFL0JhLEVBQUFBLEtBQUssRUFBRWI7QUFGd0IsQ0FBRCxDQUFsQztBQUtBLE1BQU02SixtQkFBbUIsR0FBR3pKLE1BQU0sQ0FBQztBQUMvQjBKLEVBQUFBLE9BQU8sRUFBRTlKLE1BRHNCO0FBRS9CK0osRUFBQUEsWUFBWSxFQUFFL0o7QUFGaUIsQ0FBRCxDQUFsQztBQUtBLE1BQU1nSyxtQkFBbUIsR0FBRzVKLE1BQU0sQ0FBQztBQUMvQjZKLEVBQUFBLGNBQWMsRUFBRWpLLE1BRGU7QUFFL0JrSyxFQUFBQSxjQUFjLEVBQUVsSyxNQUZlO0FBRy9CbUssRUFBQUEsUUFBUSxFQUFFbkssTUFIcUI7QUFJL0JvSyxFQUFBQSxVQUFVLEVBQUVwSyxNQUptQjtBQUsvQnFLLEVBQUFBLGFBQWEsRUFBRXJLLE1BTGdCO0FBTS9Cc0ssRUFBQUEsYUFBYSxFQUFFdEssTUFOZ0I7QUFPL0J1SyxFQUFBQSxTQUFTLEVBQUV2SyxNQVBvQjtBQVEvQndLLEVBQUFBLFVBQVUsRUFBRXhLO0FBUm1CLENBQUQsQ0FBbEM7QUFXQSxNQUFNeUssb0JBQW9CLEdBQUdySyxNQUFNLENBQUM7QUFDaENzSyxFQUFBQSxhQUFhLEVBQUVWLG1CQURpQjtBQUVoQ1csRUFBQUEsZUFBZSxFQUFFWDtBQUZlLENBQUQsQ0FBbkM7QUFLQSxNQUFNWSxvQkFBb0IsR0FBR3hLLE1BQU0sQ0FBQztBQUNoQ3lJLEVBQUFBLFlBQVksRUFBRTdJLE1BRGtCO0FBRWhDNkssRUFBQUEsYUFBYSxFQUFFN0ssTUFGaUI7QUFHaEM4SyxFQUFBQSxnQkFBZ0IsRUFBRTlLLE1BSGM7QUFJaEMrSyxFQUFBQSxTQUFTLEVBQUUvSyxNQUpxQjtBQUtoQ2dMLEVBQUFBLFNBQVMsRUFBRWhMLE1BTHFCO0FBTWhDaUwsRUFBQUEsTUFBTSxFQUFFakwsTUFOd0I7QUFPaENrTCxFQUFBQSxXQUFXLEVBQUVsTCxNQVBtQjtBQVFoQ2dJLEVBQUFBLEtBQUssRUFBRWhJLE1BUnlCO0FBU2hDbUwsRUFBQUEsbUJBQW1CLEVBQUVuTCxNQVRXO0FBVWhDb0wsRUFBQUEsbUJBQW1CLEVBQUVwTCxNQVZXO0FBV2hDOEosRUFBQUEsT0FBTyxFQUFFOUosTUFYdUI7QUFZaENxTCxFQUFBQSxLQUFLLEVBQUVyTCxNQVp5QjtBQWFoQ3NMLEVBQUFBLFVBQVUsRUFBRXRMLE1BYm9CO0FBY2hDdUwsRUFBQUEsT0FBTyxFQUFFdkwsTUFkdUI7QUFlaEN3TCxFQUFBQSxZQUFZLEVBQUV4TCxNQWZrQjtBQWdCaEN5TCxFQUFBQSxZQUFZLEVBQUV6TCxNQWhCa0I7QUFpQmhDMEwsRUFBQUEsYUFBYSxFQUFFMUwsTUFqQmlCO0FBa0JoQzJMLEVBQUFBLGlCQUFpQixFQUFFM0w7QUFsQmEsQ0FBRCxDQUFuQztBQXFCQSxNQUFNNEwsb0JBQW9CLEdBQUd4TCxNQUFNLENBQUM7QUFDaEN5TCxFQUFBQSxxQkFBcUIsRUFBRTdMLE1BRFM7QUFFaEM4TCxFQUFBQSxtQkFBbUIsRUFBRTlMO0FBRlcsQ0FBRCxDQUFuQztBQUtBLE1BQU0rTCxvQkFBb0IsR0FBRzNMLE1BQU0sQ0FBQztBQUNoQzRMLEVBQUFBLHNCQUFzQixFQUFFaE0sTUFEUTtBQUVoQ2lNLEVBQUFBLHNCQUFzQixFQUFFak0sTUFGUTtBQUdoQ2tNLEVBQUFBLG9CQUFvQixFQUFFbE0sTUFIVTtBQUloQ21NLEVBQUFBLGNBQWMsRUFBRW5NO0FBSmdCLENBQUQsQ0FBbkM7QUFPQSxNQUFNb00sb0JBQW9CLEdBQUdoTSxNQUFNLENBQUM7QUFDaENpTSxFQUFBQSxjQUFjLEVBQUVyTSxNQURnQjtBQUVoQ3NNLEVBQUFBLG1CQUFtQixFQUFFdE0sTUFGVztBQUdoQ3VNLEVBQUFBLGNBQWMsRUFBRXZNO0FBSGdCLENBQUQsQ0FBbkM7QUFNQSxNQUFNd00sb0JBQW9CLEdBQUdwTSxNQUFNLENBQUM7QUFDaENxTSxFQUFBQSxTQUFTLEVBQUV6TSxNQURxQjtBQUVoQzBNLEVBQUFBLFNBQVMsRUFBRTFNLE1BRnFCO0FBR2hDMk0sRUFBQUEsZUFBZSxFQUFFM00sTUFIZTtBQUloQzRNLEVBQUFBLGdCQUFnQixFQUFFNU07QUFKYyxDQUFELENBQW5DO0FBT0EsTUFBTTZNLG9CQUFvQixHQUFHek0sTUFBTSxDQUFDO0FBQ2hDME0sRUFBQUEsV0FBVyxFQUFFOU0sTUFEbUI7QUFFaEMrTSxFQUFBQSxZQUFZLEVBQUUvTSxNQUZrQjtBQUdoQ2dOLEVBQUFBLGFBQWEsRUFBRWhOLE1BSGlCO0FBSWhDaU4sRUFBQUEsZUFBZSxFQUFFak4sTUFKZTtBQUtoQ2tOLEVBQUFBLGdCQUFnQixFQUFFbE47QUFMYyxDQUFELENBQW5DO0FBUUEsTUFBTW1OLG9CQUFvQixHQUFHL00sTUFBTSxDQUFDO0FBQ2hDZ04sRUFBQUEsb0JBQW9CLEVBQUVwTixNQURVO0FBRWhDcU4sRUFBQUEsdUJBQXVCLEVBQUVyTixNQUZPO0FBR2hDc04sRUFBQUEseUJBQXlCLEVBQUV0TixNQUhLO0FBSWhDdU4sRUFBQUEsb0JBQW9CLEVBQUV2TjtBQUpVLENBQUQsQ0FBbkM7QUFPQSxNQUFNd04sb0JBQW9CLEdBQUdwTixNQUFNLENBQUM7QUFDaENxTixFQUFBQSxnQkFBZ0IsRUFBRXpOLE1BRGM7QUFFaEMwTixFQUFBQSx1QkFBdUIsRUFBRTFOLE1BRk87QUFHaEMyTixFQUFBQSxvQkFBb0IsRUFBRTNOLE1BSFU7QUFJaEM0TixFQUFBQSxhQUFhLEVBQUU1TixNQUppQjtBQUtoQzZOLEVBQUFBLGdCQUFnQixFQUFFN04sTUFMYztBQU1oQzhOLEVBQUFBLGlCQUFpQixFQUFFOU4sTUFOYTtBQU9oQytOLEVBQUFBLGVBQWUsRUFBRS9OLE1BUGU7QUFRaENnTyxFQUFBQSxrQkFBa0IsRUFBRWhPO0FBUlksQ0FBRCxDQUFuQztBQVdBLE1BQU1pTyxvQkFBb0IsR0FBRzdOLE1BQU0sQ0FBQztBQUNoQzhOLEVBQUFBLFNBQVMsRUFBRWxPLE1BRHFCO0FBRWhDbU8sRUFBQUEsZUFBZSxFQUFFbk8sTUFGZTtBQUdoQ29PLEVBQUFBLEtBQUssRUFBRXBPLE1BSHlCO0FBSWhDcU8sRUFBQUEsV0FBVyxFQUFFck8sTUFKbUI7QUFLaENzTyxFQUFBQSxXQUFXLEVBQUV0TyxNQUxtQjtBQU1oQ3VPLEVBQUFBLFdBQVcsRUFBRXZPO0FBTm1CLENBQUQsQ0FBbkM7QUFTQSxNQUFNd08sZUFBZSxHQUFHcE8sTUFBTSxDQUFDO0FBQzNCcU8sRUFBQUEsU0FBUyxFQUFFek8sTUFEZ0I7QUFFM0IwTyxFQUFBQSxTQUFTLEVBQUUxTyxNQUZnQjtBQUczQjJPLEVBQUFBLGlCQUFpQixFQUFFM08sTUFIUTtBQUkzQjRPLEVBQUFBLFVBQVUsRUFBRTVPLE1BSmU7QUFLM0I2TyxFQUFBQSxlQUFlLEVBQUU3TyxNQUxVO0FBTTNCOE8sRUFBQUEsZ0JBQWdCLEVBQUU5TyxNQU5TO0FBTzNCK08sRUFBQUEsZ0JBQWdCLEVBQUUvTyxNQVBTO0FBUTNCZ1AsRUFBQUEsY0FBYyxFQUFFaFAsTUFSVztBQVMzQmlQLEVBQUFBLGNBQWMsRUFBRWpQO0FBVFcsQ0FBRCxDQUE5QjtBQVlBLE1BQU1rUCxnQkFBZ0IsR0FBRzlPLE1BQU0sQ0FBQztBQUM1QitPLEVBQUFBLFNBQVMsRUFBRW5QLE1BRGlCO0FBRTVCb1AsRUFBQUEsVUFBVSxFQUFFcFAsTUFGZ0I7QUFHNUJxUCxFQUFBQSxVQUFVLEVBQUVyUDtBQUhnQixDQUFELENBQS9CO0FBTUEsTUFBTXNQLGNBQWMsR0FBR2xQLE1BQU0sQ0FBQztBQUMxQitPLEVBQUFBLFNBQVMsRUFBRW5QLE1BRGU7QUFFMUJvUCxFQUFBQSxVQUFVLEVBQUVwUCxNQUZjO0FBRzFCcVAsRUFBQUEsVUFBVSxFQUFFclA7QUFIYyxDQUFELENBQTdCO0FBTUEsTUFBTXVQLGtCQUFrQixHQUFHblAsTUFBTSxDQUFDO0FBQzlCK08sRUFBQUEsU0FBUyxFQUFFblAsTUFEbUI7QUFFOUJvUCxFQUFBQSxVQUFVLEVBQUVwUCxNQUZrQjtBQUc5QnFQLEVBQUFBLFVBQVUsRUFBRXJQO0FBSGtCLENBQUQsQ0FBakM7QUFNQSxNQUFNd1AsV0FBVyxHQUFHcFAsTUFBTSxDQUFDO0FBQ3ZCcVAsRUFBQUEsS0FBSyxFQUFFUCxnQkFEZ0I7QUFFdkJRLEVBQUFBLEdBQUcsRUFBRUosY0FGa0I7QUFHdkJLLEVBQUFBLFFBQVEsRUFBRUo7QUFIYSxDQUFELENBQTFCO0FBTUEsTUFBTUssZ0JBQWdCLEdBQUd4UCxNQUFNLENBQUM7QUFDNUJ5UCxFQUFBQSxVQUFVLEVBQUU3UCxNQURnQjtBQUU1QnVLLEVBQUFBLFNBQVMsRUFBRXZLLE1BRmlCO0FBRzVCd0ssRUFBQUEsVUFBVSxFQUFFeEssTUFIZ0I7QUFJNUI4UCxFQUFBQSxnQkFBZ0IsRUFBRTlQLE1BSlU7QUFLNUIrUCxFQUFBQSxVQUFVLEVBQUUvUCxNQUxnQjtBQU01QmdRLEVBQUFBLFNBQVMsRUFBRWhRO0FBTmlCLENBQUQsQ0FBL0I7QUFTQSxNQUFNaVEsZ0JBQWdCLEdBQUc3UCxNQUFNLENBQUM7QUFDNUI4UCxFQUFBQSxVQUFVLEVBQUVsUSxNQURnQjtBQUU1Qm1RLEVBQUFBLE1BQU0sRUFBRW5RLE1BRm9CO0FBRzVCa08sRUFBQUEsU0FBUyxFQUFFbE87QUFIaUIsQ0FBRCxDQUEvQjtBQU1BLE1BQU1vUSxxQkFBcUIsR0FBRy9QLEtBQUssQ0FBQzRQLGdCQUFELENBQW5DO0FBQ0EsTUFBTUksWUFBWSxHQUFHalEsTUFBTSxDQUFDO0FBQ3hCME0sRUFBQUEsV0FBVyxFQUFFOU0sTUFEVztBQUV4QnNRLEVBQUFBLFdBQVcsRUFBRXRRLE1BRlc7QUFHeEJ1USxFQUFBQSxLQUFLLEVBQUV2USxNQUhpQjtBQUl4QndRLEVBQUFBLFlBQVksRUFBRXhRLE1BSlU7QUFLeEJ5USxFQUFBQSxJQUFJLEVBQUVMO0FBTGtCLENBQUQsQ0FBM0I7QUFRQSxNQUFNTSx3QkFBd0IsR0FBR3JRLEtBQUssQ0FBQ3VKLG1CQUFELENBQXRDO0FBQ0EsTUFBTStHLFVBQVUsR0FBR3RRLEtBQUssQ0FBQ0wsTUFBRCxDQUF4QjtBQUNBLE1BQU00USx5QkFBeUIsR0FBR3ZRLEtBQUssQ0FBQ3VLLG9CQUFELENBQXZDO0FBQ0EsTUFBTWlHLHlCQUF5QixHQUFHeFEsS0FBSyxDQUFDd00sb0JBQUQsQ0FBdkM7QUFDQSxNQUFNaUUsV0FBVyxHQUFHelEsS0FBSyxDQUFDTCxNQUFELENBQXpCO0FBQ0EsTUFBTStRLHlCQUF5QixHQUFHMVEsS0FBSyxDQUFDNE4sb0JBQUQsQ0FBdkM7QUFDQSxNQUFNK0MsaUJBQWlCLEdBQUc1USxNQUFNLENBQUM7QUFDN0I2USxFQUFBQSxFQUFFLEVBQUVqUixNQUR5QjtBQUU3QmtSLEVBQUFBLEVBQUUsRUFBRWxSLE1BRnlCO0FBRzdCbVIsRUFBQUEsRUFBRSxFQUFFblIsTUFIeUI7QUFJN0JvUixFQUFBQSxFQUFFLEVBQUVwUixNQUp5QjtBQUs3QnFSLEVBQUFBLEVBQUUsRUFBRXJSLE1BTHlCO0FBTTdCc1IsRUFBQUEsRUFBRSxFQUFFN0gsbUJBTnlCO0FBTzdCOEgsRUFBQUEsRUFBRSxFQUFFYix3QkFQeUI7QUFRN0JjLEVBQUFBLEVBQUUsRUFBRTNILG1CQVJ5QjtBQVM3QjRILEVBQUFBLEVBQUUsRUFBRWQsVUFUeUI7QUFVN0JlLEVBQUFBLEdBQUcsRUFBRWpILG9CQVZ3QjtBQVc3QmtILEVBQUFBLEdBQUcsRUFBRWYseUJBWHdCO0FBWTdCZ0IsRUFBQUEsR0FBRyxFQUFFaEcsb0JBWndCO0FBYTdCaUcsRUFBQUEsR0FBRyxFQUFFOUYsb0JBYndCO0FBYzdCK0YsRUFBQUEsR0FBRyxFQUFFMUYsb0JBZHdCO0FBZTdCMkYsRUFBQUEsR0FBRyxFQUFFdkYsb0JBZndCO0FBZ0I3QndGLEVBQUFBLEdBQUcsRUFBRW5CLHlCQWhCd0I7QUFpQjdCb0IsRUFBQUEsR0FBRyxFQUFFekQsZUFqQndCO0FBa0I3QjBELEVBQUFBLEdBQUcsRUFBRTFELGVBbEJ3QjtBQW1CN0IyRCxFQUFBQSxHQUFHLEVBQUUzQyxXQW5Cd0I7QUFvQjdCNEMsRUFBQUEsR0FBRyxFQUFFNUMsV0FwQndCO0FBcUI3QjZDLEVBQUFBLEdBQUcsRUFBRXpDLGdCQXJCd0I7QUFzQjdCMEMsRUFBQUEsR0FBRyxFQUFFMUMsZ0JBdEJ3QjtBQXVCN0IyQyxFQUFBQSxHQUFHLEVBQUVwRixvQkF2QndCO0FBd0I3QnFGLEVBQUFBLEdBQUcsRUFBRWhGLG9CQXhCd0I7QUF5QjdCaUYsRUFBQUEsR0FBRyxFQUFFM0IsV0F6QndCO0FBMEI3QjRCLEVBQUFBLEdBQUcsRUFBRXJDLFlBMUJ3QjtBQTJCN0JzQyxFQUFBQSxHQUFHLEVBQUV0QyxZQTNCd0I7QUE0QjdCdUMsRUFBQUEsR0FBRyxFQUFFdkMsWUE1QndCO0FBNkI3QndDLEVBQUFBLEdBQUcsRUFBRXhDLFlBN0J3QjtBQThCN0J5QyxFQUFBQSxHQUFHLEVBQUV6QyxZQTlCd0I7QUErQjdCMEMsRUFBQUEsR0FBRyxFQUFFMUMsWUEvQndCO0FBZ0M3QjJDLEVBQUFBLEdBQUcsRUFBRWpDO0FBaEN3QixDQUFELENBQWhDO0FBbUNBLE1BQU1rQywyQkFBMkIsR0FBRzVTLEtBQUssQ0FBQ3VJLHNCQUFELENBQXpDO0FBQ0EsTUFBTXNLLHlCQUF5QixHQUFHN1MsS0FBSyxDQUFDMkksb0JBQUQsQ0FBdkM7QUFDQSxNQUFNbUssaUNBQWlDLEdBQUc5UyxLQUFLLENBQUNnSiw0QkFBRCxDQUEvQztBQUNBLE1BQU0rSixXQUFXLEdBQUdoVCxNQUFNLENBQUM7QUFDdkJpVCxFQUFBQSxtQkFBbUIsRUFBRXJULE1BREU7QUFFdkJzVCxFQUFBQSxtQkFBbUIsRUFBRXRULE1BRkU7QUFHdkJ1VCxFQUFBQSxZQUFZLEVBQUVOLDJCQUhTO0FBSXZCTyxFQUFBQSxVQUFVLEVBQUVOLHlCQUpXO0FBS3ZCTyxFQUFBQSxrQkFBa0IsRUFBRWpTLEtBTEc7QUFNdkJrUyxFQUFBQSxtQkFBbUIsRUFBRVAsaUNBTkU7QUFPdkJRLEVBQUFBLFdBQVcsRUFBRTNULE1BUFU7QUFRdkI0VCxFQUFBQSxNQUFNLEVBQUU1QztBQVJlLENBQUQsQ0FBMUI7QUFXQSxNQUFNNkMseUJBQXlCLEdBQUd6VCxNQUFNLENBQUM7QUFDckNrSixFQUFBQSxPQUFPLEVBQUV0SixNQUQ0QjtBQUVyQ3VKLEVBQUFBLENBQUMsRUFBRXZKLE1BRmtDO0FBR3JDd0osRUFBQUEsQ0FBQyxFQUFFeEo7QUFIa0MsQ0FBRCxDQUF4QztBQU1BLE1BQU04VCw4QkFBOEIsR0FBR3pULEtBQUssQ0FBQ3dULHlCQUFELENBQTVDO0FBQ0EsTUFBTUUsZUFBZSxHQUFHM1QsTUFBTSxDQUFDO0FBQzNCaUQsRUFBQUEsRUFBRSxFQUFFckQsTUFEdUI7QUFFM0JnVSxFQUFBQSxVQUFVLEVBQUVGO0FBRmUsQ0FBRCxFQUczQixJQUgyQixDQUE5QjtBQUtBLE1BQU1HLFVBQVUsR0FBRzVULEtBQUssQ0FBQ21CLEtBQUQsQ0FBeEI7QUFDQSxNQUFNMFMsV0FBVyxHQUFHN1QsS0FBSyxDQUFDcUMsTUFBRCxDQUF6QjtBQUNBLE1BQU15Uix1QkFBdUIsR0FBRzlULEtBQUssQ0FBQ3dHLGtCQUFELENBQXJDO0FBQ0EsTUFBTXVOLEtBQUssR0FBR2hVLE1BQU0sQ0FBQztBQUNqQmlELEVBQUFBLEVBQUUsRUFBRXJELE1BRGE7QUFFakJ5RCxFQUFBQSxNQUFNLEVBQUV6RCxNQUZTO0FBR2pCMEQsRUFBQUEsV0FBVyxFQUFFbEQsUUFBUSxDQUFDLFFBQUQsRUFBVztBQUFFbUQsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0ksSUFBQUEsUUFBUSxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxTQUFTLEVBQUUsQ0FBdEM7QUFBeUNDLElBQUFBLE9BQU8sRUFBRTtBQUFsRCxHQUFYLENBSEo7QUFJakJvUSxFQUFBQSxTQUFTLEVBQUVyVSxNQUpNO0FBS2pCNkgsRUFBQUEsVUFBVSxFQUFFN0gsTUFMSztBQU1qQmdCLEVBQUFBLE1BQU0sRUFBRWhCLE1BTlM7QUFPakJzVSxFQUFBQSxXQUFXLEVBQUV0VSxNQVBJO0FBUWpCb0ksRUFBQUEsU0FBUyxFQUFFcEksTUFSTTtBQVNqQnVVLEVBQUFBLGtCQUFrQixFQUFFdlUsTUFUSDtBQVVqQmdJLEVBQUFBLEtBQUssRUFBRWhJLE1BVlU7QUFXakJ3VSxFQUFBQSxVQUFVLEVBQUUxVCxTQVhLO0FBWWpCMlQsRUFBQUEsUUFBUSxFQUFFM1QsU0FaTztBQWFqQjRULEVBQUFBLFlBQVksRUFBRTVULFNBYkc7QUFjakI2VCxFQUFBQSxhQUFhLEVBQUU3VCxTQWRFO0FBZWpCOFQsRUFBQUEsaUJBQWlCLEVBQUU5VCxTQWZGO0FBZ0JqQmdKLEVBQUFBLE9BQU8sRUFBRTlKLE1BaEJRO0FBaUJqQjZVLEVBQUFBLDZCQUE2QixFQUFFN1UsTUFqQmQ7QUFrQmpCMkgsRUFBQUEsWUFBWSxFQUFFM0gsTUFsQkc7QUFtQmpCOFUsRUFBQUEsV0FBVyxFQUFFOVUsTUFuQkk7QUFvQmpCOEgsRUFBQUEsVUFBVSxFQUFFOUgsTUFwQks7QUFxQmpCK1UsRUFBQUEsV0FBVyxFQUFFL1UsTUFyQkk7QUFzQmpCMEgsRUFBQUEsUUFBUSxFQUFFekgsUUF0Qk87QUF1QmpCYyxFQUFBQSxNQUFNLEVBQUVkLFFBdkJTO0FBd0JqQjRJLEVBQUFBLFlBQVksRUFBRTdJLE1BeEJHO0FBeUJqQjhJLEVBQUFBLEtBQUssRUFBRTlJLE1BekJVO0FBMEJqQm1JLEVBQUFBLGdCQUFnQixFQUFFbkksTUExQkQ7QUEyQmpCZ1YsRUFBQUEsb0JBQW9CLEVBQUVoVixNQTNCTDtBQTRCakJpVixFQUFBQSxVQUFVLEVBQUV6UCxjQTVCSztBQTZCakIwUCxFQUFBQSxZQUFZLEVBQUVqQixVQTdCRztBQThCakJrQixFQUFBQSxTQUFTLEVBQUVuVixNQTlCTTtBQStCakJvVixFQUFBQSxhQUFhLEVBQUVsQixXQS9CRTtBQWdDakJtQixFQUFBQSxjQUFjLEVBQUVsQix1QkFoQ0M7QUFpQ2pCak4sRUFBQUEsUUFBUSxFQUFFbEgsTUFqQ087QUFrQ2pCc1YsRUFBQUEsWUFBWSxFQUFFbk8sZ0JBbENHO0FBbUNqQm9PLEVBQUFBLE1BQU0sRUFBRW5DLFdBbkNTO0FBb0NqQlksRUFBQUEsVUFBVSxFQUFFMVQsSUFBSSxDQUFDLElBQUQsRUFBTyxtQkFBUCxFQUE0QnlULGVBQTVCO0FBcENDLENBQUQsRUFxQ2pCLElBckNpQixDQUFwQjtBQXVDQSxNQUFNeUIsT0FBTyxHQUFHcFYsTUFBTSxDQUFDO0FBQ25CaUQsRUFBQUEsRUFBRSxFQUFFckQsTUFEZTtBQUVuQjZJLEVBQUFBLFlBQVksRUFBRTdJLE1BRks7QUFHbkJ5VixFQUFBQSxRQUFRLEVBQUV6VixNQUhTO0FBSW5CMFYsRUFBQUEsYUFBYSxFQUFFbFYsUUFBUSxDQUFDLFVBQUQsRUFBYTtBQUFFbVYsSUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsSUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxJQUFBQSxNQUFNLEVBQUU7QUFBaEMsR0FBYixDQUpKO0FBS25CQyxFQUFBQSxTQUFTLEVBQUU5VixNQUxRO0FBTW5CK1YsRUFBQUEsV0FBVyxFQUFFN1YsUUFOTTtBQU9uQjhWLEVBQUFBLGFBQWEsRUFBRS9WLFFBUEk7QUFRbkJnVyxFQUFBQSxPQUFPLEVBQUUvVixRQVJVO0FBU25CZ1csRUFBQUEsYUFBYSxFQUFFL1Msa0JBVEk7QUFVbkJrQixFQUFBQSxXQUFXLEVBQUVyRSxNQVZNO0FBV25Cc0UsRUFBQUEsSUFBSSxFQUFFdEUsTUFYYTtBQVluQnVFLEVBQUFBLElBQUksRUFBRXZFLE1BWmE7QUFhbkJ3RSxFQUFBQSxJQUFJLEVBQUV4RSxNQWJhO0FBY25CeUUsRUFBQUEsSUFBSSxFQUFFekUsTUFkYTtBQWVuQjBFLEVBQUFBLE9BQU8sRUFBRTFFLE1BZlU7QUFnQm5Cc0YsRUFBQUEsS0FBSyxFQUFFdEYsTUFoQlk7QUFpQm5CdUYsRUFBQUEsR0FBRyxFQUFFdkY7QUFqQmMsQ0FBRCxFQWtCbkIsSUFsQm1CLENBQXRCO0FBb0JBLE1BQU1tVyxrQkFBa0IsR0FBRy9WLE1BQU0sQ0FBQztBQUM5QmdXLEVBQUFBLHNCQUFzQixFQUFFbFcsUUFETTtBQUU5Qm1XLEVBQUFBLGdCQUFnQixFQUFFblcsUUFGWTtBQUc5Qm9XLEVBQUFBLGFBQWEsRUFBRXRXLE1BSGU7QUFJOUJ1VyxFQUFBQSxrQkFBa0IsRUFBRS9WLFFBQVEsQ0FBQyxlQUFELEVBQWtCO0FBQUVnVyxJQUFBQSxTQUFTLEVBQUUsQ0FBYjtBQUFnQlgsSUFBQUEsTUFBTSxFQUFFLENBQXhCO0FBQTJCWSxJQUFBQSxPQUFPLEVBQUU7QUFBcEMsR0FBbEI7QUFKRSxDQUFELENBQWpDO0FBT0EsTUFBTUMsaUJBQWlCLEdBQUd0VyxNQUFNLENBQUM7QUFDN0J1VyxFQUFBQSxrQkFBa0IsRUFBRXpXLFFBRFM7QUFFN0IwVyxFQUFBQSxNQUFNLEVBQUUxVyxRQUZxQjtBQUc3QjJXLEVBQUFBLFlBQVksRUFBRTFUO0FBSGUsQ0FBRCxDQUFoQztBQU1BLE1BQU0yVCxrQkFBa0IsR0FBRzFXLE1BQU0sQ0FBQztBQUM5QjJXLEVBQUFBLFlBQVksRUFBRS9XLE1BRGdCO0FBRTlCZ1gsRUFBQUEsaUJBQWlCLEVBQUV4VyxRQUFRLENBQUMsY0FBRCxFQUFpQjtBQUFFeVcsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsSUFBQUEsRUFBRSxFQUFFO0FBQWxCLEdBQWpCLENBRkc7QUFHOUJDLEVBQUFBLGNBQWMsRUFBRW5YLE1BSGM7QUFJOUJvWCxFQUFBQSxtQkFBbUIsRUFBRTVXLFFBQVEsQ0FBQyxnQkFBRCxFQUFtQjtBQUFFNlcsSUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsSUFBQUEsUUFBUSxFQUFFLENBQXhCO0FBQTJCQyxJQUFBQSxLQUFLLEVBQUU7QUFBbEMsR0FBbkIsQ0FKQztBQUs5QkMsRUFBQUEsT0FBTyxFQUFFeFgsTUFMcUI7QUFNOUJ5WCxFQUFBQSxjQUFjLEVBQUV6WCxNQU5jO0FBTzlCMFgsRUFBQUEsaUJBQWlCLEVBQUUxWCxNQVBXO0FBUTlCMlgsRUFBQUEsUUFBUSxFQUFFelgsUUFSb0I7QUFTOUIwWCxFQUFBQSxRQUFRLEVBQUUzWCxRQVRvQjtBQVU5QnlPLEVBQUFBLFNBQVMsRUFBRXpPLFFBVm1CO0FBVzlCMk8sRUFBQUEsVUFBVSxFQUFFNU8sTUFYa0I7QUFZOUI2WCxFQUFBQSxJQUFJLEVBQUU3WCxNQVp3QjtBQWE5QjhYLEVBQUFBLFNBQVMsRUFBRTlYLE1BYm1CO0FBYzlCK1gsRUFBQUEsUUFBUSxFQUFFL1gsTUFkb0I7QUFlOUJnWSxFQUFBQSxRQUFRLEVBQUVoWSxNQWZvQjtBQWdCOUJpWSxFQUFBQSxrQkFBa0IsRUFBRWpZLE1BaEJVO0FBaUI5QmtZLEVBQUFBLG1CQUFtQixFQUFFbFk7QUFqQlMsQ0FBRCxDQUFqQztBQW9CQSxNQUFNbVksaUJBQWlCLEdBQUcvWCxNQUFNLENBQUM7QUFDN0JvWCxFQUFBQSxPQUFPLEVBQUV4WCxNQURvQjtBQUU3Qm9ZLEVBQUFBLEtBQUssRUFBRXBZLE1BRnNCO0FBRzdCcVksRUFBQUEsUUFBUSxFQUFFclksTUFIbUI7QUFJN0JzVyxFQUFBQSxhQUFhLEVBQUV0VyxNQUpjO0FBSzdCdVcsRUFBQUEsa0JBQWtCLEVBQUUvVixRQUFRLENBQUMsZUFBRCxFQUFrQjtBQUFFZ1csSUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JYLElBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQlksSUFBQUEsT0FBTyxFQUFFO0FBQXBDLEdBQWxCLENBTEM7QUFNN0I2QixFQUFBQSxjQUFjLEVBQUVwWSxRQU5hO0FBTzdCcVksRUFBQUEsaUJBQWlCLEVBQUVyWSxRQVBVO0FBUTdCc1ksRUFBQUEsV0FBVyxFQUFFeFksTUFSZ0I7QUFTN0J5WSxFQUFBQSxVQUFVLEVBQUV6WSxNQVRpQjtBQVU3QjBZLEVBQUFBLFdBQVcsRUFBRTFZLE1BVmdCO0FBVzdCMlksRUFBQUEsWUFBWSxFQUFFM1ksTUFYZTtBQVk3QjRZLEVBQUFBLGVBQWUsRUFBRTVZLE1BWlk7QUFhN0I2WSxFQUFBQSxZQUFZLEVBQUU3WSxNQWJlO0FBYzdCOFksRUFBQUEsZ0JBQWdCLEVBQUU5WSxNQWRXO0FBZTdCK1ksRUFBQUEsb0JBQW9CLEVBQUUvWSxNQWZPO0FBZ0I3QmdaLEVBQUFBLG1CQUFtQixFQUFFaFo7QUFoQlEsQ0FBRCxDQUFoQztBQW1CQSxNQUFNaVosaUJBQWlCLEdBQUc3WSxNQUFNLENBQUM7QUFDN0I4WSxFQUFBQSxXQUFXLEVBQUVsWixNQURnQjtBQUU3Qm1aLEVBQUFBLGdCQUFnQixFQUFFM1ksUUFBUSxDQUFDLGFBQUQsRUFBZ0I7QUFBRTRZLElBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLElBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsSUFBQUEsRUFBRSxFQUFFO0FBQS9CLEdBQWhCLENBRkc7QUFHN0JDLEVBQUFBLGNBQWMsRUFBRXZaLE1BSGE7QUFJN0J3WixFQUFBQSxhQUFhLEVBQUV4WixNQUpjO0FBSzdCeVosRUFBQUEsWUFBWSxFQUFFdlosUUFMZTtBQU03QndaLEVBQUFBLFFBQVEsRUFBRXhaLFFBTm1CO0FBTzdCeVosRUFBQUEsUUFBUSxFQUFFelo7QUFQbUIsQ0FBRCxDQUFoQztBQVVBLE1BQU0wWixvQkFBb0IsR0FBR3haLE1BQU0sQ0FBQztBQUNoQ3laLEVBQUFBLGlCQUFpQixFQUFFN1osTUFEYTtBQUVoQzhaLEVBQUFBLGVBQWUsRUFBRTlaLE1BRmU7QUFHaEMrWixFQUFBQSxTQUFTLEVBQUUvWixNQUhxQjtBQUloQ2dhLEVBQUFBLFlBQVksRUFBRWhhO0FBSmtCLENBQUQsQ0FBbkM7QUFPQSxNQUFNaWEsWUFBWSxHQUFHNVosS0FBSyxDQUFDK0MsT0FBRCxDQUExQjtBQUNBLE1BQU04VyxXQUFXLEdBQUc5WixNQUFNLENBQUM7QUFDdkJpRCxFQUFBQSxFQUFFLEVBQUVyRCxNQURtQjtBQUV2Qm1hLEVBQUFBLE9BQU8sRUFBRW5hLE1BRmM7QUFHdkJvYSxFQUFBQSxZQUFZLEVBQUU1WixRQUFRLENBQUMsU0FBRCxFQUFZO0FBQUU2WixJQUFBQSxRQUFRLEVBQUUsQ0FBWjtBQUFlQyxJQUFBQSxPQUFPLEVBQUUsQ0FBeEI7QUFBMkJDLElBQUFBLElBQUksRUFBRSxDQUFqQztBQUFvQ0MsSUFBQUEsSUFBSSxFQUFFLENBQTFDO0FBQTZDQyxJQUFBQSxZQUFZLEVBQUUsQ0FBM0Q7QUFBOERDLElBQUFBLFlBQVksRUFBRSxDQUE1RTtBQUErRUMsSUFBQUEsWUFBWSxFQUFFLENBQTdGO0FBQWdHQyxJQUFBQSxZQUFZLEVBQUU7QUFBOUcsR0FBWixDQUhDO0FBSXZCblgsRUFBQUEsTUFBTSxFQUFFekQsTUFKZTtBQUt2QjBELEVBQUFBLFdBQVcsRUFBRWxELFFBQVEsQ0FBQyxRQUFELEVBQVc7QUFBRW1ELElBQUFBLE9BQU8sRUFBRSxDQUFYO0FBQWNHLElBQUFBLFdBQVcsRUFBRSxDQUEzQjtBQUE4QkMsSUFBQUEsUUFBUSxFQUFFLENBQXhDO0FBQTJDQyxJQUFBQSxTQUFTLEVBQUUsQ0FBdEQ7QUFBeURDLElBQUFBLE9BQU8sRUFBRTtBQUFsRSxHQUFYLENBTEU7QUFNdkJFLEVBQUFBLFFBQVEsRUFBRW5FLE1BTmE7QUFPdkI4RyxFQUFBQSxZQUFZLEVBQUU5RyxNQVBTO0FBUXZCNkksRUFBQUEsWUFBWSxFQUFFN0ksTUFSUztBQVN2QnlHLEVBQUFBLEVBQUUsRUFBRXhHLFFBVG1CO0FBVXZCNGEsRUFBQUEsZUFBZSxFQUFFN2EsTUFWTTtBQVd2QjhhLEVBQUFBLGFBQWEsRUFBRTdhLFFBWFE7QUFZdkI4YSxFQUFBQSxHQUFHLEVBQUUvYSxNQVprQjtBQWF2QmdiLEVBQUFBLFVBQVUsRUFBRWhiLE1BYlc7QUFjdkJpYixFQUFBQSxXQUFXLEVBQUVqYixNQWRVO0FBZXZCa2IsRUFBQUEsZ0JBQWdCLEVBQUUxYSxRQUFRLENBQUMsYUFBRCxFQUFnQjtBQUFFbVYsSUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsSUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxJQUFBQSxNQUFNLEVBQUUsQ0FBaEM7QUFBbUNzRixJQUFBQSxRQUFRLEVBQUU7QUFBN0MsR0FBaEIsQ0FmSDtBQWdCdkJDLEVBQUFBLFVBQVUsRUFBRXBiLE1BaEJXO0FBaUJ2QnFiLEVBQUFBLGVBQWUsRUFBRTdhLFFBQVEsQ0FBQyxZQUFELEVBQWU7QUFBRW1WLElBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLElBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3QkMsSUFBQUEsTUFBTSxFQUFFLENBQWhDO0FBQW1Dc0YsSUFBQUEsUUFBUSxFQUFFO0FBQTdDLEdBQWYsQ0FqQkY7QUFrQnZCL1ksRUFBQUEsTUFBTSxFQUFFcEMsTUFsQmU7QUFtQnZCc2IsRUFBQUEsVUFBVSxFQUFFaGIsSUFBSSxDQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCOEMsT0FBdkIsQ0FuQk87QUFvQnZCbVksRUFBQUEsUUFBUSxFQUFFekssV0FwQmE7QUFxQnZCMEssRUFBQUEsWUFBWSxFQUFFamIsU0FBUyxDQUFDLFVBQUQsRUFBYSxVQUFiLEVBQXlCNkMsT0FBekIsQ0FyQkE7QUFzQnZCc0QsRUFBQUEsVUFBVSxFQUFFeEcsUUF0Qlc7QUF1QnZCeUcsRUFBQUEsZ0JBQWdCLEVBQUV4RCxrQkF2Qks7QUF3QnZCNkQsRUFBQUEsUUFBUSxFQUFFaEgsTUF4QmE7QUF5QnZCaUgsRUFBQUEsUUFBUSxFQUFFakgsTUF6QmE7QUEwQnZCeWIsRUFBQUEsWUFBWSxFQUFFemIsTUExQlM7QUEyQnZCMGIsRUFBQUEsT0FBTyxFQUFFdkYsa0JBM0JjO0FBNEJ2QlMsRUFBQUEsTUFBTSxFQUFFRixpQkE1QmU7QUE2QnZCaUYsRUFBQUEsT0FBTyxFQUFFN0Usa0JBN0JjO0FBOEJ2QjhFLEVBQUFBLE1BQU0sRUFBRXpELGlCQTlCZTtBQStCdkJoVCxFQUFBQSxNQUFNLEVBQUU4VCxpQkEvQmU7QUFnQ3ZCNEMsRUFBQUEsT0FBTyxFQUFFN2IsTUFoQ2M7QUFpQ3ZCOGIsRUFBQUEsU0FBUyxFQUFFOWIsTUFqQ1k7QUFrQ3ZCK2IsRUFBQUEsRUFBRSxFQUFFL2IsTUFsQ21CO0FBbUN2QmdjLEVBQUFBLFVBQVUsRUFBRXBDLG9CQW5DVztBQW9DdkJxQyxFQUFBQSxtQkFBbUIsRUFBRWpjLE1BcENFO0FBcUN2QmtjLEVBQUFBLFNBQVMsRUFBRWxjLE1BckNZO0FBc0N2QnNGLEVBQUFBLEtBQUssRUFBRXRGLE1BdENnQjtBQXVDdkJ1RixFQUFBQSxHQUFHLEVBQUV2RjtBQXZDa0IsQ0FBRCxFQXdDdkIsSUF4Q3VCLENBQTFCOztBQTBDQSxTQUFTbWMsZUFBVCxDQUF5QkMsRUFBekIsRUFBNkI7QUFDekIsU0FBTztBQUNIemIsSUFBQUEsYUFBYSxFQUFFO0FBQ1hFLE1BQUFBLEtBQUssQ0FBQ3diLE1BQUQsRUFBUztBQUNWLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDeGIsS0FBWCxDQUFyQjtBQUNIOztBQUhVLEtBRFo7QUFNSEMsSUFBQUEsU0FBUyxFQUFFO0FBQ1BDLE1BQUFBLE1BQU0sQ0FBQ3NiLE1BQUQsRUFBUztBQUNYLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDdGIsTUFBWCxDQUFyQjtBQUNIOztBQUhNLEtBTlI7QUFXSEksSUFBQUEsV0FBVyxFQUFFO0FBQ1RJLE1BQUFBLGlCQUFpQixDQUFDOGEsTUFBRCxFQUFTO0FBQ3RCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDOWEsaUJBQVgsQ0FBckI7QUFDSDs7QUFIUSxLQVhWO0FBZ0JIQyxJQUFBQSxLQUFLLEVBQUU7QUFDSFUsTUFBQUEsT0FBTyxDQUFDbWEsTUFBRCxFQUFTO0FBQ1osZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNuYSxPQUFYLENBQXJCO0FBQ0gsT0FIRTs7QUFJSEcsTUFBQUEsT0FBTyxDQUFDZ2EsTUFBRCxFQUFTO0FBQ1osZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNoYSxPQUFYLENBQXJCO0FBQ0gsT0FORTs7QUFPSEUsTUFBQUEsV0FBVyxDQUFDOFosTUFBRCxFQUFTO0FBQ2hCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDOVosV0FBWCxDQUFyQjtBQUNILE9BVEU7O0FBVUhiLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFa0IsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsR0FBRyxFQUFFLENBQXBCO0FBQXVCQyxRQUFBQSxXQUFXLEVBQUUsQ0FBcEM7QUFBdUNDLFFBQUFBLEtBQUssRUFBRSxDQUE5QztBQUFpREMsUUFBQUEsT0FBTyxFQUFFLENBQTFEO0FBQTZEQyxRQUFBQSxjQUFjLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLGdCQUFnQixFQUFFO0FBQWxHLE9BQWI7QUFWbEMsS0FoQko7QUE0QkhTLElBQUFBLE1BQU0sRUFBRTtBQUNKUSxNQUFBQSxlQUFlLENBQUNtWixNQUFELEVBQVM7QUFDcEIsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNuWixlQUFYLENBQXJCO0FBQ0gsT0FIRzs7QUFJSnhCLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFa0IsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUUsUUFBQUEsV0FBVyxFQUFFLENBQTVCO0FBQStCYyxRQUFBQSxTQUFTLEVBQUUsQ0FBMUM7QUFBNkNaLFFBQUFBLE9BQU8sRUFBRSxDQUF0RDtBQUF5RGEsUUFBQUEsa0JBQWtCLEVBQUUsQ0FBN0U7QUFBZ0ZDLFFBQUFBLE9BQU8sRUFBRSxDQUF6RjtBQUE0RkMsUUFBQUEsZUFBZSxFQUFFLENBQTdHO0FBQWdIQyxRQUFBQSxJQUFJLEVBQUUsQ0FBQztBQUF2SCxPQUFiO0FBSmpDLEtBNUJMO0FBa0NISyxJQUFBQSxPQUFPLEVBQUU7QUFDTEMsTUFBQUEsRUFBRSxDQUFDZ1osTUFBRCxFQUFTO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FISTs7QUFJTHZYLE1BQUFBLFVBQVUsQ0FBQ3NYLE1BQUQsRUFBUztBQUNmLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDdFgsVUFBWCxDQUFyQjtBQUNILE9BTkk7O0FBT0w3QyxNQUFBQSxPQUFPLENBQUNtYSxNQUFELEVBQVM7QUFDWixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ25hLE9BQVgsQ0FBckI7QUFDSCxPQVRJOztBQVVMRyxNQUFBQSxPQUFPLENBQUNnYSxNQUFELEVBQVM7QUFDWixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ2hhLE9BQVgsQ0FBckI7QUFDSCxPQVpJOztBQWFMNkMsTUFBQUEsVUFBVSxDQUFDbVgsTUFBRCxFQUFTO0FBQ2YsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNuWCxVQUFYLENBQXJCO0FBQ0gsT0FmSTs7QUFnQkxyRSxNQUFBQSxLQUFLLENBQUN3YixNQUFELEVBQVM7QUFDVixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ3hiLEtBQVgsQ0FBckI7QUFDSCxPQWxCSTs7QUFtQkxhLE1BQUFBLGFBQWEsRUFBRWpCLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFNkMsUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsS0FBSyxFQUFFLENBQXRCO0FBQXlCQyxRQUFBQSxNQUFNLEVBQUU7QUFBakMsT0FBYixDQW5CaEM7QUFvQkxFLE1BQUFBLFdBQVcsRUFBRWpELHNCQUFzQixDQUFDLFFBQUQsRUFBVztBQUFFa0QsUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsTUFBTSxFQUFFLENBQXRCO0FBQXlCQyxRQUFBQSxVQUFVLEVBQUUsQ0FBckM7QUFBd0NDLFFBQUFBLFdBQVcsRUFBRSxDQUFyRDtBQUF3REMsUUFBQUEsUUFBUSxFQUFFLENBQWxFO0FBQXFFQyxRQUFBQSxTQUFTLEVBQUUsQ0FBaEY7QUFBbUZDLFFBQUFBLE9BQU8sRUFBRSxDQUE1RjtBQUErRkMsUUFBQUEsVUFBVSxFQUFFO0FBQTNHLE9BQVg7QUFwQjlCLEtBbENOO0FBd0RIc0IsSUFBQUEsY0FBYyxFQUFFO0FBQ1pDLE1BQUFBLFdBQVcsQ0FBQzRXLE1BQUQsRUFBUztBQUNoQixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzVXLFdBQVgsQ0FBckI7QUFDSCxPQUhXOztBQUlaRSxNQUFBQSxRQUFRLENBQUMwVyxNQUFELEVBQVM7QUFDYixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzFXLFFBQVgsQ0FBckI7QUFDSCxPQU5XOztBQU9aRSxNQUFBQSxjQUFjLENBQUN3VyxNQUFELEVBQVM7QUFDbkIsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUN4VyxjQUFYLENBQXJCO0FBQ0gsT0FUVzs7QUFVWkUsTUFBQUEsT0FBTyxDQUFDc1csTUFBRCxFQUFTO0FBQ1osZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUN0VyxPQUFYLENBQXJCO0FBQ0gsT0FaVzs7QUFhWjlDLE1BQUFBLFFBQVEsQ0FBQ29aLE1BQUQsRUFBUztBQUNiLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDcFosUUFBWCxDQUFyQjtBQUNILE9BZlc7O0FBZ0JaaUQsTUFBQUEsYUFBYSxDQUFDbVcsTUFBRCxFQUFTO0FBQ2xCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDblcsYUFBWCxDQUFyQjtBQUNILE9BbEJXOztBQW1CWkUsTUFBQUEsTUFBTSxDQUFDaVcsTUFBRCxFQUFTO0FBQ1gsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNqVyxNQUFYLENBQXJCO0FBQ0gsT0FyQlc7O0FBc0JaRSxNQUFBQSxhQUFhLENBQUMrVixNQUFELEVBQVM7QUFDbEIsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUMvVixhQUFYLENBQXJCO0FBQ0g7O0FBeEJXLEtBeERiO0FBa0ZIRSxJQUFBQSw4QkFBOEIsRUFBRTtBQUM1QkMsTUFBQUEsRUFBRSxDQUFDNFYsTUFBRCxFQUFTO0FBQ1AsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUM1VixFQUFYLENBQXJCO0FBQ0gsT0FIMkI7O0FBSTVCQyxNQUFBQSxVQUFVLENBQUMyVixNQUFELEVBQVM7QUFDZixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzNWLFVBQVgsQ0FBckI7QUFDSDs7QUFOMkIsS0FsRjdCO0FBMEZIYyxJQUFBQSwyQkFBMkIsRUFBRTtBQUN6QkUsTUFBQUEsUUFBUSxDQUFDMlUsTUFBRCxFQUFTO0FBQ2IsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUMzVSxRQUFYLENBQXJCO0FBQ0gsT0FId0I7O0FBSXpCM0csTUFBQUEsTUFBTSxDQUFDc2IsTUFBRCxFQUFTO0FBQ1gsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUN0YixNQUFYLENBQXJCO0FBQ0gsT0FOd0I7O0FBT3pCOEUsTUFBQUEsY0FBYyxDQUFDd1csTUFBRCxFQUFTO0FBQ25CLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDeFcsY0FBWCxDQUFyQjtBQUNILE9BVHdCOztBQVV6QjZDLE1BQUFBLGFBQWEsQ0FBQzJULE1BQUQsRUFBUztBQUNsQixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzNULGFBQVgsQ0FBckI7QUFDSCxPQVp3Qjs7QUFhekJKLE1BQUFBLGVBQWUsRUFBRTdILHNCQUFzQixDQUFDLFlBQUQsRUFBZTtBQUFFc0MsUUFBQUEsSUFBSSxFQUFFLENBQVI7QUFBV3dGLFFBQUFBLEtBQUssRUFBRSxDQUFsQjtBQUFxQkMsUUFBQUEsS0FBSyxFQUFFO0FBQTVCLE9BQWY7QUFiZCxLQTFGMUI7QUF5R0hRLElBQUFBLG9CQUFvQixFQUFFO0FBQ2xCQyxNQUFBQSxJQUFJLENBQUNvVCxNQUFELEVBQVM7QUFDVCxlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ3BULElBQVgsQ0FBckI7QUFDSCxPQUhpQjs7QUFJbEJFLE1BQUFBLE1BQU0sQ0FBQ2tULE1BQUQsRUFBUztBQUNYLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDbFQsTUFBWCxDQUFyQjtBQUNIOztBQU5pQixLQXpHbkI7QUFpSEg0SyxJQUFBQSxlQUFlLEVBQUU7QUFDYjFRLE1BQUFBLEVBQUUsQ0FBQ2daLE1BQUQsRUFBUztBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNIOztBQUhZLEtBakhkO0FBc0hIbEksSUFBQUEsS0FBSyxFQUFFO0FBQ0gvUSxNQUFBQSxFQUFFLENBQUNnWixNQUFELEVBQVM7QUFDUCxlQUFPQSxNQUFNLENBQUNDLElBQWQ7QUFDSCxPQUhFOztBQUlIdEksTUFBQUEsVUFBVSxDQUFDcUksTUFBRCxFQUFTRSxLQUFULEVBQWdCQyxPQUFoQixFQUF5QjtBQUMvQixlQUFPQSxPQUFPLENBQUNKLEVBQVIsQ0FBV0ssaUJBQVgsQ0FBNkJDLFVBQTdCLENBQXdDTCxNQUFNLENBQUNoWixFQUEvQyxDQUFQO0FBQ0gsT0FORTs7QUFPSHFFLE1BQUFBLFFBQVEsQ0FBQzJVLE1BQUQsRUFBUztBQUNiLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDM1UsUUFBWCxDQUFyQjtBQUNILE9BVEU7O0FBVUgzRyxNQUFBQSxNQUFNLENBQUNzYixNQUFELEVBQVM7QUFDWCxlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ3RiLE1BQVgsQ0FBckI7QUFDSCxPQVpFOztBQWFIMkMsTUFBQUEsV0FBVyxFQUFFakQsc0JBQXNCLENBQUMsUUFBRCxFQUFXO0FBQUVrRCxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjSSxRQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLFNBQVMsRUFBRSxDQUF0QztBQUF5Q0MsUUFBQUEsT0FBTyxFQUFFO0FBQWxELE9BQVg7QUFiaEMsS0F0SEo7QUFxSUh1UixJQUFBQSxPQUFPLEVBQUU7QUFDTG5TLE1BQUFBLEVBQUUsQ0FBQ2daLE1BQUQsRUFBUztBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7O0FBSUx2RyxNQUFBQSxXQUFXLENBQUNzRyxNQUFELEVBQVM7QUFDaEIsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUN0RyxXQUFYLENBQXJCO0FBQ0gsT0FOSTs7QUFPTEMsTUFBQUEsYUFBYSxDQUFDcUcsTUFBRCxFQUFTO0FBQ2xCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDckcsYUFBWCxDQUFyQjtBQUNILE9BVEk7O0FBVUxDLE1BQUFBLE9BQU8sQ0FBQ29HLE1BQUQsRUFBUztBQUNaLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDcEcsT0FBWCxDQUFyQjtBQUNILE9BWkk7O0FBYUxQLE1BQUFBLGFBQWEsRUFBRWpWLHNCQUFzQixDQUFDLFVBQUQsRUFBYTtBQUFFa1YsUUFBQUEsTUFBTSxFQUFFLENBQVY7QUFBYUMsUUFBQUEsTUFBTSxFQUFFLENBQXJCO0FBQXdCQyxRQUFBQSxNQUFNLEVBQUU7QUFBaEMsT0FBYjtBQWJoQyxLQXJJTjtBQW9KSE0sSUFBQUEsa0JBQWtCLEVBQUU7QUFDaEJDLE1BQUFBLHNCQUFzQixDQUFDaUcsTUFBRCxFQUFTO0FBQzNCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDakcsc0JBQVgsQ0FBckI7QUFDSCxPQUhlOztBQUloQkMsTUFBQUEsZ0JBQWdCLENBQUNnRyxNQUFELEVBQVM7QUFDckIsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUNoRyxnQkFBWCxDQUFyQjtBQUNILE9BTmU7O0FBT2hCRSxNQUFBQSxrQkFBa0IsRUFBRTlWLHNCQUFzQixDQUFDLGVBQUQsRUFBa0I7QUFBRStWLFFBQUFBLFNBQVMsRUFBRSxDQUFiO0FBQWdCWCxRQUFBQSxNQUFNLEVBQUUsQ0FBeEI7QUFBMkJZLFFBQUFBLE9BQU8sRUFBRTtBQUFwQyxPQUFsQjtBQVAxQixLQXBKakI7QUE2SkhDLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZDLE1BQUFBLGtCQUFrQixDQUFDMEYsTUFBRCxFQUFTO0FBQ3ZCLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDMUYsa0JBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxNQUFNLENBQUN5RixNQUFELEVBQVM7QUFDWCxlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ3pGLE1BQVgsQ0FBckI7QUFDSDs7QUFOYyxLQTdKaEI7QUFxS0hFLElBQUFBLGtCQUFrQixFQUFFO0FBQ2hCYSxNQUFBQSxRQUFRLENBQUMwRSxNQUFELEVBQVM7QUFDYixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzFFLFFBQVgsQ0FBckI7QUFDSCxPQUhlOztBQUloQkMsTUFBQUEsUUFBUSxDQUFDeUUsTUFBRCxFQUFTO0FBQ2IsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUN6RSxRQUFYLENBQXJCO0FBQ0gsT0FOZTs7QUFPaEJsSixNQUFBQSxTQUFTLENBQUMyTixNQUFELEVBQVM7QUFDZCxlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzNOLFNBQVgsQ0FBckI7QUFDSCxPQVRlOztBQVVoQnNJLE1BQUFBLGlCQUFpQixFQUFFdlcsc0JBQXNCLENBQUMsY0FBRCxFQUFpQjtBQUFFd1csUUFBQUEsT0FBTyxFQUFFLENBQVg7QUFBY0MsUUFBQUEsRUFBRSxFQUFFO0FBQWxCLE9BQWpCLENBVnpCO0FBV2hCRSxNQUFBQSxtQkFBbUIsRUFBRTNXLHNCQUFzQixDQUFDLGdCQUFELEVBQW1CO0FBQUU0VyxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjQyxRQUFBQSxRQUFRLEVBQUUsQ0FBeEI7QUFBMkJDLFFBQUFBLEtBQUssRUFBRTtBQUFsQyxPQUFuQjtBQVgzQixLQXJLakI7QUFrTEhZLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZHLE1BQUFBLGNBQWMsQ0FBQytELE1BQUQsRUFBUztBQUNuQixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQy9ELGNBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxpQkFBaUIsQ0FBQzhELE1BQUQsRUFBUztBQUN0QixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzlELGlCQUFYLENBQXJCO0FBQ0gsT0FOYzs7QUFPZmhDLE1BQUFBLGtCQUFrQixFQUFFOVYsc0JBQXNCLENBQUMsZUFBRCxFQUFrQjtBQUFFK1YsUUFBQUEsU0FBUyxFQUFFLENBQWI7QUFBZ0JYLFFBQUFBLE1BQU0sRUFBRSxDQUF4QjtBQUEyQlksUUFBQUEsT0FBTyxFQUFFO0FBQXBDLE9BQWxCO0FBUDNCLEtBbExoQjtBQTJMSHdDLElBQUFBLGlCQUFpQixFQUFFO0FBQ2ZRLE1BQUFBLFlBQVksQ0FBQzRDLE1BQUQsRUFBUztBQUNqQixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzVDLFlBQVgsQ0FBckI7QUFDSCxPQUhjOztBQUlmQyxNQUFBQSxRQUFRLENBQUMyQyxNQUFELEVBQVM7QUFDYixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzNDLFFBQVgsQ0FBckI7QUFDSCxPQU5jOztBQU9mQyxNQUFBQSxRQUFRLENBQUMwQyxNQUFELEVBQVM7QUFDYixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQzFDLFFBQVgsQ0FBckI7QUFDSCxPQVRjOztBQVVmUixNQUFBQSxnQkFBZ0IsRUFBRTFZLHNCQUFzQixDQUFDLGFBQUQsRUFBZ0I7QUFBRTJZLFFBQUFBLFFBQVEsRUFBRSxDQUFaO0FBQWVDLFFBQUFBLE9BQU8sRUFBRSxDQUF4QjtBQUEyQkMsUUFBQUEsRUFBRSxFQUFFO0FBQS9CLE9BQWhCO0FBVnpCLEtBM0xoQjtBQXVNSFksSUFBQUEsV0FBVyxFQUFFO0FBQ1Q3VyxNQUFBQSxFQUFFLENBQUNnWixNQUFELEVBQVM7QUFDUCxlQUFPQSxNQUFNLENBQUNDLElBQWQ7QUFDSCxPQUhROztBQUlUaEIsTUFBQUEsVUFBVSxDQUFDZSxNQUFELEVBQVNFLEtBQVQsRUFBZ0JDLE9BQWhCLEVBQXlCO0FBQy9CLGVBQU9BLE9BQU8sQ0FBQ0osRUFBUixDQUFXTyxRQUFYLENBQW9CRCxVQUFwQixDQUErQkwsTUFBTSxDQUFDamEsTUFBdEMsQ0FBUDtBQUNILE9BTlE7O0FBT1RvWixNQUFBQSxZQUFZLENBQUNhLE1BQUQsRUFBU0UsS0FBVCxFQUFnQkMsT0FBaEIsRUFBeUI7QUFDakMsZUFBT0EsT0FBTyxDQUFDSixFQUFSLENBQVdPLFFBQVgsQ0FBb0JDLFdBQXBCLENBQWdDUCxNQUFNLENBQUNkLFFBQXZDLENBQVA7QUFDSCxPQVRROztBQVVUOVUsTUFBQUEsRUFBRSxDQUFDNFYsTUFBRCxFQUFTO0FBQ1AsZUFBT2xjLGNBQWMsQ0FBQyxDQUFELEVBQUlrYyxNQUFNLENBQUM1VixFQUFYLENBQXJCO0FBQ0gsT0FaUTs7QUFhVHFVLE1BQUFBLGFBQWEsQ0FBQ3VCLE1BQUQsRUFBUztBQUNsQixlQUFPbGMsY0FBYyxDQUFDLENBQUQsRUFBSWtjLE1BQU0sQ0FBQ3ZCLGFBQVgsQ0FBckI7QUFDSCxPQWZROztBQWdCVHBVLE1BQUFBLFVBQVUsQ0FBQzJWLE1BQUQsRUFBUztBQUNmLGVBQU9sYyxjQUFjLENBQUMsQ0FBRCxFQUFJa2MsTUFBTSxDQUFDM1YsVUFBWCxDQUFyQjtBQUNILE9BbEJROztBQW1CVDBULE1BQUFBLFlBQVksRUFBRTNaLHNCQUFzQixDQUFDLFNBQUQsRUFBWTtBQUFFNFosUUFBQUEsUUFBUSxFQUFFLENBQVo7QUFBZUMsUUFBQUEsT0FBTyxFQUFFLENBQXhCO0FBQTJCQyxRQUFBQSxJQUFJLEVBQUUsQ0FBakM7QUFBb0NDLFFBQUFBLElBQUksRUFBRSxDQUExQztBQUE2Q0MsUUFBQUEsWUFBWSxFQUFFLENBQTNEO0FBQThEQyxRQUFBQSxZQUFZLEVBQUUsQ0FBNUU7QUFBK0VDLFFBQUFBLFlBQVksRUFBRSxDQUE3RjtBQUFnR0MsUUFBQUEsWUFBWSxFQUFFO0FBQTlHLE9BQVosQ0FuQjNCO0FBb0JUbFgsTUFBQUEsV0FBVyxFQUFFakQsc0JBQXNCLENBQUMsUUFBRCxFQUFXO0FBQUVrRCxRQUFBQSxPQUFPLEVBQUUsQ0FBWDtBQUFjRyxRQUFBQSxXQUFXLEVBQUUsQ0FBM0I7QUFBOEJDLFFBQUFBLFFBQVEsRUFBRSxDQUF4QztBQUEyQ0MsUUFBQUEsU0FBUyxFQUFFLENBQXREO0FBQXlEQyxRQUFBQSxPQUFPLEVBQUU7QUFBbEUsT0FBWCxDQXBCMUI7QUFxQlRpWCxNQUFBQSxnQkFBZ0IsRUFBRXphLHNCQUFzQixDQUFDLGFBQUQsRUFBZ0I7QUFBRWtWLFFBQUFBLE1BQU0sRUFBRSxDQUFWO0FBQWFDLFFBQUFBLE1BQU0sRUFBRSxDQUFyQjtBQUF3QkMsUUFBQUEsTUFBTSxFQUFFLENBQWhDO0FBQW1Dc0YsUUFBQUEsUUFBUSxFQUFFO0FBQTdDLE9BQWhCLENBckIvQjtBQXNCVEUsTUFBQUEsZUFBZSxFQUFFNWEsc0JBQXNCLENBQUMsWUFBRCxFQUFlO0FBQUVrVixRQUFBQSxNQUFNLEVBQUUsQ0FBVjtBQUFhQyxRQUFBQSxNQUFNLEVBQUUsQ0FBckI7QUFBd0JDLFFBQUFBLE1BQU0sRUFBRSxDQUFoQztBQUFtQ3NGLFFBQUFBLFFBQVEsRUFBRTtBQUE3QyxPQUFmO0FBdEI5QixLQXZNVjtBQStOSDBCLElBQUFBLEtBQUssRUFBRTtBQUNIRixNQUFBQSxRQUFRLEVBQUVQLEVBQUUsQ0FBQ08sUUFBSCxDQUFZRyxhQUFaLEVBRFA7QUFFSEwsTUFBQUEsaUJBQWlCLEVBQUVMLEVBQUUsQ0FBQ0ssaUJBQUgsQ0FBcUJLLGFBQXJCLEVBRmhCO0FBR0hDLE1BQUFBLE1BQU0sRUFBRVgsRUFBRSxDQUFDVyxNQUFILENBQVVELGFBQVYsRUFITDtBQUlIRSxNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRixhQUFaLEVBSlA7QUFLSC9WLE1BQUFBLFlBQVksRUFBRXFWLEVBQUUsQ0FBQ3JWLFlBQUgsQ0FBZ0IrVixhQUFoQjtBQUxYLEtBL05KO0FBc09IRyxJQUFBQSxZQUFZLEVBQUU7QUFDVk4sTUFBQUEsUUFBUSxFQUFFUCxFQUFFLENBQUNPLFFBQUgsQ0FBWU8sb0JBQVosRUFEQTtBQUVWVCxNQUFBQSxpQkFBaUIsRUFBRUwsRUFBRSxDQUFDSyxpQkFBSCxDQUFxQlMsb0JBQXJCLEVBRlQ7QUFHVkgsTUFBQUEsTUFBTSxFQUFFWCxFQUFFLENBQUNXLE1BQUgsQ0FBVUcsb0JBQVYsRUFIRTtBQUlWRixNQUFBQSxRQUFRLEVBQUVaLEVBQUUsQ0FBQ1ksUUFBSCxDQUFZRSxvQkFBWixFQUpBO0FBS1ZuVyxNQUFBQSxZQUFZLEVBQUVxVixFQUFFLENBQUNyVixZQUFILENBQWdCbVcsb0JBQWhCO0FBTEo7QUF0T1gsR0FBUDtBQThPSDs7QUFFREMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JqQixFQUFBQSxlQURhO0FBRWJ4YixFQUFBQSxhQUZhO0FBR2JHLEVBQUFBLFNBSGE7QUFJYkssRUFBQUEsV0FKYTtBQUtiSyxFQUFBQSxLQUxhO0FBTWJrQixFQUFBQSxNQU5hO0FBT2JVLEVBQUFBLE9BUGE7QUFRYm9DLEVBQUFBLGNBUmE7QUFTYmdCLEVBQUFBLDhCQVRhO0FBVWJLLEVBQUFBLGtCQVZhO0FBV2JNLEVBQUFBLGdCQVhhO0FBWWJLLEVBQUFBLDJCQVphO0FBYWJvQixFQUFBQSxzQkFiYTtBQWNiSSxFQUFBQSxvQkFkYTtBQWViSyxFQUFBQSw0QkFmYTtBQWdCYkksRUFBQUEsbUJBaEJhO0FBaUJiRyxFQUFBQSxtQkFqQmE7QUFrQmJDLEVBQUFBLG1CQWxCYTtBQW1CYkcsRUFBQUEsbUJBbkJhO0FBb0JiUyxFQUFBQSxvQkFwQmE7QUFxQmJHLEVBQUFBLG9CQXJCYTtBQXNCYmdCLEVBQUFBLG9CQXRCYTtBQXVCYkcsRUFBQUEsb0JBdkJhO0FBd0JiSyxFQUFBQSxvQkF4QmE7QUF5QmJJLEVBQUFBLG9CQXpCYTtBQTBCYkssRUFBQUEsb0JBMUJhO0FBMkJiTSxFQUFBQSxvQkEzQmE7QUE0QmJLLEVBQUFBLG9CQTVCYTtBQTZCYlMsRUFBQUEsb0JBN0JhO0FBOEJiTyxFQUFBQSxlQTlCYTtBQStCYlUsRUFBQUEsZ0JBL0JhO0FBZ0NiSSxFQUFBQSxjQWhDYTtBQWlDYkMsRUFBQUEsa0JBakNhO0FBa0NiQyxFQUFBQSxXQWxDYTtBQW1DYkksRUFBQUEsZ0JBbkNhO0FBb0NiSyxFQUFBQSxnQkFwQ2E7QUFxQ2JJLEVBQUFBLFlBckNhO0FBc0NiVyxFQUFBQSxpQkF0Q2E7QUF1Q2JvQyxFQUFBQSxXQXZDYTtBQXdDYlMsRUFBQUEseUJBeENhO0FBeUNiRSxFQUFBQSxlQXpDYTtBQTBDYkssRUFBQUEsS0ExQ2E7QUEyQ2JvQixFQUFBQSxPQTNDYTtBQTRDYlcsRUFBQUEsa0JBNUNhO0FBNkNiTyxFQUFBQSxpQkE3Q2E7QUE4Q2JJLEVBQUFBLGtCQTlDYTtBQStDYnFCLEVBQUFBLGlCQS9DYTtBQWdEYmMsRUFBQUEsaUJBaERhO0FBaURiVyxFQUFBQSxvQkFqRGE7QUFrRGJNLEVBQUFBO0FBbERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3Qge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXksXG4gICAgZW51bU5hbWUsXG4gICAgY3JlYXRlRW51bU5hbWVSZXNvbHZlcixcbn0gPSByZXF1aXJlKCcuL2RiLXR5cGVzLmpzJyk7XG5jb25zdCBPdGhlckN1cnJlbmN5ID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICBtc2dfaWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnX3R5cGVfbmFtZTogZW51bU5hbWUoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE90aGVyQ3VycmVuY3lBcnJheSA9IGFycmF5KE90aGVyQ3VycmVuY3kpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZ190eXBlX25hbWU6IGVudW1OYW1lKCdtc2dfdHlwZScsIHsgSW50ZXJuYWw6IDAsIEV4dEluOiAxLCBFeHRPdXQ6IDIgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9ucyA9IHN0cnVjdCh7XG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1RyYW5zYWN0aW9uc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnNBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZV9uYW1lOiBlbnVtTmFtZSgnc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IE90aGVyQ3VycmVuY3lBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclByZXZCbGtTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1A2ID0gc3RydWN0KHtcbiAgICBtaW50X25ld19wcmljZTogc2NhbGFyLFxuICAgIG1pbnRfYWRkX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQNyA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDggPSBzdHJ1Y3Qoe1xuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBjYXBhYmlsaXRpZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwID0gc3RydWN0KHtcbiAgICBtaW5fdG90X3JvdW5kczogc2NhbGFyLFxuICAgIG1heF90b3Rfcm91bmRzOiBzY2FsYXIsXG4gICAgbWluX3dpbnM6IHNjYWxhcixcbiAgICBtYXhfbG9zc2VzOiBzY2FsYXIsXG4gICAgbWluX3N0b3JlX3NlYzogc2NhbGFyLFxuICAgIG1heF9zdG9yZV9zZWM6IHNjYWxhcixcbiAgICBiaXRfcHJpY2U6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTEgPSBzdHJ1Y3Qoe1xuICAgIG5vcm1hbF9wYXJhbXM6IENvbmZpZ1Byb3Bvc2FsU2V0dXAsXG4gICAgY3JpdGljYWxfcGFyYW1zOiBDb25maWdQcm9wb3NhbFNldHVwLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBlbmFibGVkX3NpbmNlOiBzY2FsYXIsXG4gICAgYWN0dWFsX21pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1pbl9zcGxpdDogc2NhbGFyLFxuICAgIG1heF9zcGxpdDogc2NhbGFyLFxuICAgIGFjdGl2ZTogc2NhbGFyLFxuICAgIGFjY2VwdF9tc2dzOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBiYXNpYzogc2NhbGFyLFxuICAgIHZtX3ZlcnNpb246IHNjYWxhcixcbiAgICB2bV9tb2RlOiBzY2FsYXIsXG4gICAgbWluX2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgbWF4X2FkZHJfbGVuOiBzY2FsYXIsXG4gICAgYWRkcl9sZW5fc3RlcDogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl90eXBlX2lkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTQgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc2NhbGFyLFxuICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxNSA9IHN0cnVjdCh7XG4gICAgdmFsaWRhdG9yc19lbGVjdGVkX2Zvcjogc2NhbGFyLFxuICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHNjYWxhcixcbiAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogc2NhbGFyLFxuICAgIHN0YWtlX2hlbGRfZm9yOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTYgPSBzdHJ1Y3Qoe1xuICAgIG1heF92YWxpZGF0b3JzOiBzY2FsYXIsXG4gICAgbWF4X21haW5fdmFsaWRhdG9yczogc2NhbGFyLFxuICAgIG1pbl92YWxpZGF0b3JzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMTcgPSBzdHJ1Y3Qoe1xuICAgIG1pbl9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZTogc2NhbGFyLFxuICAgIG1pbl90b3RhbF9zdGFrZTogc2NhbGFyLFxuICAgIG1heF9zdGFrZV9mYWN0b3I6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOCA9IHN0cnVjdCh7XG4gICAgdXRpbWVfc2luY2U6IHNjYWxhcixcbiAgICBiaXRfcHJpY2VfcHM6IHNjYWxhcixcbiAgICBjZWxsX3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfYml0X3ByaWNlX3BzOiBzY2FsYXIsXG4gICAgbWNfY2VsbF9wcmljZV9wczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDI4ID0gc3RydWN0KHtcbiAgICBtY19jYXRjaGFpbl9saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBzY2FsYXIsXG4gICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogc2NhbGFyLFxuICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMjkgPSBzdHJ1Y3Qoe1xuICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHNjYWxhcixcbiAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogc2NhbGFyLFxuICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBzY2FsYXIsXG4gICAgZmFzdF9hdHRlbXB0czogc2NhbGFyLFxuICAgIGF0dGVtcHRfZHVyYXRpb246IHNjYWxhcixcbiAgICBjYXRjaGFpbl9tYXhfZGVwczogc2NhbGFyLFxuICAgIG1heF9ibG9ja19ieXRlczogc2NhbGFyLFxuICAgIG1heF9jb2xsYXRlZF9ieXRlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDM5ID0gc3RydWN0KHtcbiAgICBhZG5sX2FkZHI6IHNjYWxhcixcbiAgICB0ZW1wX3B1YmxpY19rZXk6IHNjYWxhcixcbiAgICBzZXFubzogc2NhbGFyLFxuICAgIHZhbGlkX3VudGlsOiBzY2FsYXIsXG4gICAgc2lnbmF0dXJlX3I6IHNjYWxhcixcbiAgICBzaWduYXR1cmVfczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlcyA9IHN0cnVjdCh7XG4gICAgZ2FzX3ByaWNlOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc2NhbGFyLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHNjYWxhcixcbiAgICBmbGF0X2dhc19saW1pdDogc2NhbGFyLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHNCeXRlcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0dhcyA9IHN0cnVjdCh7XG4gICAgdW5kZXJsb2FkOiBzY2FsYXIsXG4gICAgc29mdF9saW1pdDogc2NhbGFyLFxuICAgIGhhcmRfbGltaXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0xpbWl0c0x0RGVsdGEgPSBzdHJ1Y3Qoe1xuICAgIHVuZGVybG9hZDogc2NhbGFyLFxuICAgIHNvZnRfbGltaXQ6IHNjYWxhcixcbiAgICBoYXJkX2xpbWl0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tMaW1pdHMgPSBzdHJ1Y3Qoe1xuICAgIGJ5dGVzOiBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIGdhczogQmxvY2tMaW1pdHNHYXMsXG4gICAgbHRfZGVsdGE6IEJsb2NrTGltaXRzTHREZWx0YSxcbn0pO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzID0gc3RydWN0KHtcbiAgICBsdW1wX3ByaWNlOiBzY2FsYXIsXG4gICAgYml0X3ByaWNlOiBzY2FsYXIsXG4gICAgY2VsbF9wcmljZTogc2NhbGFyLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHNjYWxhcixcbiAgICBmaXJzdF9mcmFjOiBzY2FsYXIsXG4gICAgbmV4dF9mcmFjOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVmFsaWRhdG9yU2V0TGlzdCA9IHN0cnVjdCh7XG4gICAgcHVibGljX2tleTogc2NhbGFyLFxuICAgIHdlaWdodDogc2NhbGFyLFxuICAgIGFkbmxfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFZhbGlkYXRvclNldExpc3RBcnJheSA9IGFycmF5KFZhbGlkYXRvclNldExpc3QpO1xuY29uc3QgVmFsaWRhdG9yU2V0ID0gc3RydWN0KHtcbiAgICB1dGltZV9zaW5jZTogc2NhbGFyLFxuICAgIHV0aW1lX3VudGlsOiBzY2FsYXIsXG4gICAgdG90YWw6IHNjYWxhcixcbiAgICB0b3RhbF93ZWlnaHQ6IHNjYWxhcixcbiAgICBsaXN0OiBWYWxpZGF0b3JTZXRMaXN0QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQN0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQNyk7XG5jb25zdCBGbG9hdEFycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnUDEyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlckNvbmZpZ1AxMik7XG5jb25zdCBCbG9ja01hc3RlckNvbmZpZ1AxOEFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJDb25maWdQMTgpO1xuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJDb25maWdQMzlBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyQ29uZmlnUDM5KTtcbmNvbnN0IEJsb2NrTWFzdGVyQ29uZmlnID0gc3RydWN0KHtcbiAgICBwMDogc2NhbGFyLFxuICAgIHAxOiBzY2FsYXIsXG4gICAgcDI6IHNjYWxhcixcbiAgICBwMzogc2NhbGFyLFxuICAgIHA0OiBzY2FsYXIsXG4gICAgcDY6IEJsb2NrTWFzdGVyQ29uZmlnUDYsXG4gICAgcDc6IEJsb2NrTWFzdGVyQ29uZmlnUDdBcnJheSxcbiAgICBwODogQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBwOTogRmxvYXRBcnJheSxcbiAgICBwMTE6IEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIHAxMjogQmxvY2tNYXN0ZXJDb25maWdQMTJBcnJheSxcbiAgICBwMTQ6IEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIHAxNTogQmxvY2tNYXN0ZXJDb25maWdQMTUsXG4gICAgcDE2OiBCbG9ja01hc3RlckNvbmZpZ1AxNixcbiAgICBwMTc6IEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIHAxODogQmxvY2tNYXN0ZXJDb25maWdQMThBcnJheSxcbiAgICBwMjA6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjE6IEdhc0xpbWl0c1ByaWNlcyxcbiAgICBwMjI6IEJsb2NrTGltaXRzLFxuICAgIHAyMzogQmxvY2tMaW1pdHMsXG4gICAgcDI0OiBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIHAyNTogTXNnRm9yd2FyZFByaWNlcyxcbiAgICBwMjg6IEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIHAyOTogQmxvY2tNYXN0ZXJDb25maWdQMjksXG4gICAgcDMxOiBTdHJpbmdBcnJheSxcbiAgICBwMzI6IFZhbGlkYXRvclNldCxcbiAgICBwMzM6IFZhbGlkYXRvclNldCxcbiAgICBwMzQ6IFZhbGlkYXRvclNldCxcbiAgICBwMzU6IFZhbGlkYXRvclNldCxcbiAgICBwMzY6IFZhbGlkYXRvclNldCxcbiAgICBwMzc6IFZhbGlkYXRvclNldCxcbiAgICBwMzk6IEJsb2NrTWFzdGVyQ29uZmlnUDM5QXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgbWluX3NoYXJkX2dlbl91dGltZTogc2NhbGFyLFxuICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbiAgICBzaGFyZF9mZWVzOiBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5LFxuICAgIHJlY292ZXJfY3JlYXRlX21zZzogSW5Nc2csXG4gICAgcHJldl9ibGtfc2lnbmF0dXJlczogQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5LFxuICAgIGNvbmZpZ19hZGRyOiBzY2FsYXIsXG4gICAgY29uZmlnOiBCbG9ja01hc3RlckNvbmZpZyxcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzID0gc3RydWN0KHtcbiAgICBub2RlX2lkOiBzY2FsYXIsXG4gICAgcjogc2NhbGFyLFxuICAgIHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXkgPSBhcnJheShCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzKTtcbmNvbnN0IEJsb2NrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzaWduYXR1cmVzOiBCbG9ja1NpZ25hdHVyZXNTaWduYXR1cmVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHN0YXR1c19uYW1lOiBlbnVtTmFtZSgnc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcm9wb3NlZDogMSwgRmluYWxpemVkOiAyLCBSZWZ1c2VkOiAzIH0pLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3RlcixcbiAgICBzaWduYXR1cmVzOiBqb2luKCdpZCcsICdibG9ja3Nfc2lnbmF0dXJlcycsIEJsb2NrU2lnbmF0dXJlcyksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFjY190eXBlX25hbWU6IGVudW1OYW1lKCdhY2NfdHlwZScsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiB9KSxcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogT3RoZXJDdXJyZW5jeUFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBjb21wdXRlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2NvbXB1dGVfdHlwZScsIHsgU2tpcHBlZDogMCwgVm06IDEgfSksXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbl9uYW1lOiBlbnVtTmFtZSgnc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogZW51bU5hbWUoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgYm91bmNlX3R5cGVfbmFtZTogZW51bU5hbWUoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHRyX3R5cGVfbmFtZTogZW51bU5hbWUoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3RhdHVzX25hbWU6IGVudW1OYW1lKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFByZWxpbWluYXJ5OiAxLCBQcm9wb3NlZDogMiwgRmluYWxpemVkOiAzLCBSZWZ1c2VkOiA0IH0pLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzX25hbWU6IGVudW1OYW1lKCdvcmlnX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXNfbmFtZTogZW51bU5hbWUoJ2VuZF9zdGF0dXMnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIsIE5vbkV4aXN0OiAzIH0pLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBPdGhlckN1cnJlbmN5QXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgT3RoZXJDdXJyZW5jeToge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdtc2dfdHlwZScsIHsgRXh0ZXJuYWw6IDAsIElocjogMSwgSW1tZWRpYXRlbHk6IDIsIEZpbmFsOiAzLCBUcmFuc2l0OiA0LCBEaXNjYXJkZWRGaW5hbDogNSwgRGlzY2FyZGVkVHJhbnNpdDogNiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBFeHRlcm5hbDogMCwgSW1tZWRpYXRlbHk6IDEsIE91dE1zZ05ldzogMiwgVHJhbnNpdDogMywgRGVxdWV1ZUltbWVkaWF0ZWx5OiA0LCBEZXF1ZXVlOiA1LCBUcmFuc2l0UmVxdWlyZWQ6IDYsIE5vbmU6IC0xIH0pLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ190eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ21zZ190eXBlJywgeyBJbnRlcm5hbDogMCwgRXh0SW46IDEsIEV4dE91dDogMiB9KSxcbiAgICAgICAgICAgIHN0YXR1c19uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdzdGF0dXMnLCB7IFVua25vd246IDAsIFF1ZXVlZDogMSwgUHJvY2Vzc2luZzogMiwgUHJlbGltaW5hcnk6IDMsIFByb3Bvc2VkOiA0LCBGaW5hbGl6ZWQ6IDUsIFJlZnVzZWQ6IDYsIFRyYW5zaXRpbmc6IDcgfSksXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tBY2NvdW50QmxvY2tzVHJhbnNhY3Rpb25zOiB7XG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwbGl0X3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3BsaXRfdHlwZScsIHsgTm9uZTogMCwgU3BsaXQ6IDIsIE1lcmdlOiAzIH0pLFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2lnbmF0dXJlcyhwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIuYmxvY2tzX3NpZ25hdHVyZXMud2FpdEZvckRvYyhwYXJlbnQuaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1cycsIHsgVW5rbm93bjogMCwgUHJvcG9zZWQ6IDEsIEZpbmFsaXplZDogMiwgUmVmdXNlZDogMyB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWNjX3R5cGVfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignYWNjX3R5cGUnLCB7IFVuaW5pdDogMCwgQWN0aXZlOiAxLCBGcm96ZW46IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3N0YXR1c19jaGFuZ2UnLCB7IFVuY2hhbmdlZDogMCwgRnJvemVuOiAxLCBEZWxldGVkOiAyIH0pLFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZV9uYW1lOiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKCdjb21wdXRlX3R5cGUnLCB7IFNraXBwZWQ6IDAsIFZtOiAxIH0pLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb25fbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc2tpcHBlZF9yZWFzb24nLCB7IE5vU3RhdGU6IDAsIEJhZFN0YXRlOiAxLCBOb0dhczogMiB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2VfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzX2NoYW5nZScsIHsgVW5jaGFuZ2VkOiAwLCBGcm96ZW46IDEsIERlbGV0ZWQ6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ2JvdW5jZV90eXBlJywgeyBOZWdGdW5kczogMCwgTm9GdW5kczogMSwgT2s6IDIgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQsIF9hcmdzLCBjb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuZGIubWVzc2FnZXMud2FpdEZvckRvYyhwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLm1lc3NhZ2VzLndhaXRGb3JEb2NzKHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cl90eXBlX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ3RyX3R5cGUnLCB7IE9yZGluYXJ5OiAwLCBTdG9yYWdlOiAxLCBUaWNrOiAyLCBUb2NrOiAzLCBTcGxpdFByZXBhcmU6IDQsIFNwbGl0SW5zdGFsbDogNSwgTWVyZ2VQcmVwYXJlOiA2LCBNZXJnZUluc3RhbGw6IDcgfSksXG4gICAgICAgICAgICBzdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignc3RhdHVzJywgeyBVbmtub3duOiAwLCBQcmVsaW1pbmFyeTogMSwgUHJvcG9zZWQ6IDIsIEZpbmFsaXplZDogMywgUmVmdXNlZDogNCB9KSxcbiAgICAgICAgICAgIG9yaWdfc3RhdHVzX25hbWU6IGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIoJ29yaWdfc3RhdHVzJywgeyBVbmluaXQ6IDAsIEFjdGl2ZTogMSwgRnJvemVuOiAyLCBOb25FeGlzdDogMyB9KSxcbiAgICAgICAgICAgIGVuZF9zdGF0dXNfbmFtZTogY3JlYXRlRW51bU5hbWVSZXNvbHZlcignZW5kX3N0YXR1cycsIHsgVW5pbml0OiAwLCBBY3RpdmU6IDEsIEZyb3plbjogMiwgTm9uRXhpc3Q6IDMgfSksXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIubWVzc2FnZXMucXVlcnlSZXNvbHZlcigpLFxuICAgICAgICAgICAgYmxvY2tzX3NpZ25hdHVyZXM6IGRiLmJsb2Nrc19zaWduYXR1cmVzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnF1ZXJ5UmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5hY2NvdW50cy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLnRyYW5zYWN0aW9ucy5xdWVyeVJlc29sdmVyKCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLm1lc3NhZ2VzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBibG9ja3Nfc2lnbmF0dXJlczogZGIuYmxvY2tzX3NpZ25hdHVyZXMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuYmxvY2tzLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuYWNjb3VudHMuc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIudHJhbnNhY3Rpb25zLnN1YnNjcmlwdGlvblJlc29sdmVyKCksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NUcmFuc2FjdGlvbnMsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXMsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyxcbiAgICBCbG9ja01hc3RlckNvbmZpZ1A2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDcsXG4gICAgQmxvY2tNYXN0ZXJDb25maWdQOCxcbiAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDExLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDEyLFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE1LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE2LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE3LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDE4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI4LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDI5LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnUDM5LFxuICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICBCbG9ja0xpbWl0c0J5dGVzLFxuICAgIEJsb2NrTGltaXRzR2FzLFxuICAgIEJsb2NrTGltaXRzTHREZWx0YSxcbiAgICBCbG9ja0xpbWl0cyxcbiAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgIFZhbGlkYXRvclNldExpc3QsXG4gICAgVmFsaWRhdG9yU2V0LFxuICAgIEJsb2NrTWFzdGVyQ29uZmlnLFxuICAgIEJsb2NrTWFzdGVyLFxuICAgIEJsb2NrU2lnbmF0dXJlc1NpZ25hdHVyZXMsXG4gICAgQmxvY2tTaWduYXR1cmVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=