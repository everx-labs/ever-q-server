"use strict";

var _require = require('./arango-types.js'),
    scalar = _require.scalar,
    bigUInt1 = _require.bigUInt1,
    bigUInt2 = _require.bigUInt2,
    resolveBigUInt = _require.resolveBigUInt,
    struct = _require.struct,
    array = _require.array,
    join = _require.join,
    joinArray = _require.joinArray;

var ExtBlkRef = struct({
  end_lt: bigUInt1,
  seq_no: scalar,
  root_hash: scalar,
  file_hash: scalar
});
var MsgEnvelope = struct({
  msg: scalar,
  next_addr: scalar,
  cur_addr: scalar,
  fwd_fee_remaining: bigUInt2
});
var InMsg = struct({
  msg_type: scalar,
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
var OutMsg = struct({
  msg_type: scalar,
  msg: scalar,
  transaction: scalar,
  out_msg: MsgEnvelope,
  reimport: InMsg,
  imported: InMsg,
  import_block_lt: bigUInt1
});
var MessageValueOther = struct({
  currency: scalar,
  value: bigUInt2
});
var MessageValueOtherArray = array(MessageValueOther);
var Message = struct({
  id: scalar,
  msg_type: scalar,
  status: scalar,
  transaction_id: scalar,
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
  created_lt: bigUInt1,
  created_at: scalar,
  ihr_disabled: scalar,
  ihr_fee: bigUInt2,
  fwd_fee: bigUInt2,
  import_fee: bigUInt2,
  bounce: scalar,
  bounced: scalar,
  value: bigUInt2,
  value_other: MessageValueOtherArray,
  proof: scalar,
  boc: scalar
}, true);
var BlockShard = struct({
  shard_pfx_bits: scalar,
  workchain_id: scalar,
  shard_prefix: bigUInt1
});
var BlockValueFlowToNextBlkOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowExportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFromPrevBlkOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowMintedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowToNextBlkOtherArray = array(BlockValueFlowToNextBlkOther);
var BlockValueFlowExportedOtherArray = array(BlockValueFlowExportedOther);
var BlockValueFlowFeesCollectedOtherArray = array(BlockValueFlowFeesCollectedOther);
var BlockValueFlowCreatedOtherArray = array(BlockValueFlowCreatedOther);
var BlockValueFlowImportedOtherArray = array(BlockValueFlowImportedOther);
var BlockValueFlowFromPrevBlkOtherArray = array(BlockValueFlowFromPrevBlkOther);
var BlockValueFlowMintedOtherArray = array(BlockValueFlowMintedOther);
var BlockValueFlowFeesImportedOtherArray = array(BlockValueFlowFeesImportedOther);
var BlockValueFlow = struct({
  to_next_blk: bigUInt2,
  to_next_blk_other: BlockValueFlowToNextBlkOtherArray,
  exported: bigUInt2,
  exported_other: BlockValueFlowExportedOtherArray,
  fees_collected: bigUInt2,
  fees_collected_other: BlockValueFlowFeesCollectedOtherArray,
  created: bigUInt2,
  created_other: BlockValueFlowCreatedOtherArray,
  imported: bigUInt2,
  imported_other: BlockValueFlowImportedOtherArray,
  from_prev_blk: bigUInt2,
  from_prev_blk_other: BlockValueFlowFromPrevBlkOtherArray,
  minted: bigUInt2,
  minted_other: BlockValueFlowMintedOtherArray,
  fees_imported: bigUInt2,
  fees_imported_other: BlockValueFlowFeesImportedOtherArray
});
var BlockAccountBlocksStateUpdate = struct({
  old_hash: scalar,
  new_hash: scalar
});
var StringArray = array(String);
var BlockAccountBlocks = struct({
  account_addr: scalar,
  transactions: StringArray,
  state_update: BlockAccountBlocksStateUpdate,
  tr_count: scalar
});
var BlockStateUpdate = struct({
  "new": scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
var BlockShardHashesDescrFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockShardHashesDescrFundsCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockShardHashesDescrFeesCollectedOtherArray = array(BlockShardHashesDescrFeesCollectedOther);
var BlockShardHashesDescrFundsCreatedOtherArray = array(BlockShardHashesDescrFundsCreatedOther);
var BlockShardHashesDescr = struct({
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
  next_validator_shard: bigUInt1,
  min_ref_mc_seqno: scalar,
  gen_utime: scalar,
  split_type: scalar,
  split: scalar,
  fees_collected: bigUInt2,
  fees_collected_other: BlockShardHashesDescrFeesCollectedOtherArray,
  funds_created: bigUInt2,
  funds_created_other: BlockShardHashesDescrFundsCreatedOtherArray
});
var BlockShardHashes = struct({
  hash: scalar,
  descr: BlockShardHashesDescr
});
var InMsgArray = array(InMsg);
var OutMsgArray = array(OutMsg);
var BlockAccountBlocksArray = array(BlockAccountBlocks);
var BlockShardHashesArray = array(BlockShardHashes);
var Block = struct({
  id: scalar,
  status: scalar,
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
  shard: BlockShard,
  min_ref_mc_seqno: scalar,
  value_flow: BlockValueFlow,
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockAccountBlocksArray,
  state_update: BlockStateUpdate,
  shard_hashes: BlockShardHashesArray
}, true);
var AccountBalanceOther = struct({
  currency: scalar,
  value: bigUInt2
});
var AccountBalanceOtherArray = array(AccountBalanceOther);
var Account = struct({
  id: scalar,
  acc_type: scalar,
  last_paid: scalar,
  due_payment: bigUInt2,
  last_trans_lt: bigUInt1,
  balance: bigUInt2,
  balance_other: AccountBalanceOtherArray,
  split_depth: scalar,
  tick: scalar,
  tock: scalar,
  code: scalar,
  data: scalar,
  library: scalar,
  proof: scalar,
  boc: scalar
}, true);
var TransactionTotalFeesOther = struct({
  currency: scalar,
  value: bigUInt2
});
var TransactionStorage = struct({
  storage_fees_collected: bigUInt2,
  storage_fees_due: bigUInt2,
  status_change: scalar
});
var TransactionCreditCreditOther = struct({
  currency: scalar,
  value: bigUInt2
});
var TransactionCreditCreditOtherArray = array(TransactionCreditCreditOther);
var TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: bigUInt2,
  credit_other: TransactionCreditCreditOtherArray
});
var TransactionCompute = struct({
  compute_type: scalar,
  skipped_reason: scalar,
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
var TransactionAction = struct({
  success: scalar,
  valid: scalar,
  no_funds: scalar,
  status_change: scalar,
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
var TransactionBounce = struct({
  bounce_type: scalar,
  msg_size_cells: scalar,
  msg_size_bits: scalar,
  req_fwd_fees: bigUInt2,
  msg_fees: bigUInt2,
  fwd_fees: bigUInt2
});
var TransactionSplitInfo = struct({
  cur_shard_pfx_len: scalar,
  acc_split_depth: scalar,
  this_addr: scalar,
  sibling_addr: scalar
});
var TransactionTotalFeesOtherArray = array(TransactionTotalFeesOther);
var Transaction = struct({
  id: scalar,
  tr_type: scalar,
  status: scalar,
  block_id: scalar,
  account_addr: scalar,
  lt: bigUInt1,
  prev_trans_hash: scalar,
  prev_trans_lt: bigUInt1,
  now: scalar,
  outmsg_cnt: scalar,
  orig_status: scalar,
  end_status: scalar,
  in_msg: scalar,
  out_msgs: StringArray,
  total_fees: bigUInt2,
  total_fees_other: TransactionTotalFeesOtherArray,
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
    ExtBlkRef: {
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    MsgEnvelope: {
      fwd_fee_remaining: function fwd_fee_remaining(parent) {
        return resolveBigUInt(2, parent.fwd_fee_remaining);
      }
    },
    InMsg: {
      ihr_fee: function ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },
      fwd_fee: function fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },
      transit_fee: function transit_fee(parent) {
        return resolveBigUInt(2, parent.transit_fee);
      },
      transaction_id: function transaction_id(parent) {
        return resolveBigUInt(1, parent.transaction_id);
      }
    },
    OutMsg: {
      import_block_lt: function import_block_lt(parent) {
        return resolveBigUInt(1, parent.import_block_lt);
      }
    },
    MessageValueOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    Message: {
      id: function id(parent) {
        return parent._key;
      },
      created_lt: function created_lt(parent) {
        return resolveBigUInt(1, parent.created_lt);
      },
      ihr_fee: function ihr_fee(parent) {
        return resolveBigUInt(2, parent.ihr_fee);
      },
      fwd_fee: function fwd_fee(parent) {
        return resolveBigUInt(2, parent.fwd_fee);
      },
      import_fee: function import_fee(parent) {
        return resolveBigUInt(2, parent.import_fee);
      },
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockShard: {
      shard_prefix: function shard_prefix(parent) {
        return resolveBigUInt(1, parent.shard_prefix);
      }
    },
    BlockValueFlowToNextBlkOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowExportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFromPrevBlkOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowMintedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlow: {
      to_next_blk: function to_next_blk(parent) {
        return resolveBigUInt(2, parent.to_next_blk);
      },
      exported: function exported(parent) {
        return resolveBigUInt(2, parent.exported);
      },
      fees_collected: function fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },
      created: function created(parent) {
        return resolveBigUInt(2, parent.created);
      },
      imported: function imported(parent) {
        return resolveBigUInt(2, parent.imported);
      },
      from_prev_blk: function from_prev_blk(parent) {
        return resolveBigUInt(2, parent.from_prev_blk);
      },
      minted: function minted(parent) {
        return resolveBigUInt(2, parent.minted);
      },
      fees_imported: function fees_imported(parent) {
        return resolveBigUInt(2, parent.fees_imported);
      }
    },
    BlockShardHashesDescrFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockShardHashesDescrFundsCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockShardHashesDescr: {
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      },
      next_validator_shard: function next_validator_shard(parent) {
        return resolveBigUInt(1, parent.next_validator_shard);
      },
      fees_collected: function fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },
      funds_created: function funds_created(parent) {
        return resolveBigUInt(2, parent.funds_created);
      }
    },
    Block: {
      id: function id(parent) {
        return parent._key;
      },
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    AccountBalanceOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    Account: {
      id: function id(parent) {
        return parent._key;
      },
      due_payment: function due_payment(parent) {
        return resolveBigUInt(2, parent.due_payment);
      },
      last_trans_lt: function last_trans_lt(parent) {
        return resolveBigUInt(1, parent.last_trans_lt);
      },
      balance: function balance(parent) {
        return resolveBigUInt(2, parent.balance);
      }
    },
    TransactionTotalFeesOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    TransactionStorage: {
      storage_fees_collected: function storage_fees_collected(parent) {
        return resolveBigUInt(2, parent.storage_fees_collected);
      },
      storage_fees_due: function storage_fees_due(parent) {
        return resolveBigUInt(2, parent.storage_fees_due);
      }
    },
    TransactionCreditCreditOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    TransactionCredit: {
      due_fees_collected: function due_fees_collected(parent) {
        return resolveBigUInt(2, parent.due_fees_collected);
      },
      credit: function credit(parent) {
        return resolveBigUInt(2, parent.credit);
      }
    },
    TransactionCompute: {
      gas_fees: function gas_fees(parent) {
        return resolveBigUInt(2, parent.gas_fees);
      },
      gas_used: function gas_used(parent) {
        return resolveBigUInt(1, parent.gas_used);
      },
      gas_limit: function gas_limit(parent) {
        return resolveBigUInt(1, parent.gas_limit);
      }
    },
    TransactionAction: {
      total_fwd_fees: function total_fwd_fees(parent) {
        return resolveBigUInt(2, parent.total_fwd_fees);
      },
      total_action_fees: function total_action_fees(parent) {
        return resolveBigUInt(2, parent.total_action_fees);
      }
    },
    TransactionBounce: {
      req_fwd_fees: function req_fwd_fees(parent) {
        return resolveBigUInt(2, parent.req_fwd_fees);
      },
      msg_fees: function msg_fees(parent) {
        return resolveBigUInt(2, parent.msg_fees);
      },
      fwd_fees: function fwd_fees(parent) {
        return resolveBigUInt(2, parent.fwd_fees);
      }
    },
    Transaction: {
      id: function id(parent) {
        return parent._key;
      },
      lt: function lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },
      prev_trans_lt: function prev_trans_lt(parent) {
        return resolveBigUInt(1, parent.prev_trans_lt);
      },
      total_fees: function total_fees(parent) {
        return resolveBigUInt(2, parent.total_fees);
      }
    },
    Query: {
      messages: db.collectionQuery(db.messages, Message),
      blocks: db.collectionQuery(db.blocks, Block),
      accounts: db.collectionQuery(db.accounts, Account),
      transactions: db.collectionQuery(db.transactions, Transaction),
      select: db.selectQuery()
    },
    Subscription: {
      messages: db.collectionSubscription(db.messages, Message),
      blocks: db.collectionSubscription(db.blocks, Block),
      accounts: db.collectionSubscription(db.accounts, Account),
      transactions: db.collectionSubscription(db.transactions, Transaction)
    }
  };
}

module.exports = {
  createResolvers: createResolvers,
  ExtBlkRef: ExtBlkRef,
  MsgEnvelope: MsgEnvelope,
  InMsg: InMsg,
  OutMsg: OutMsg,
  MessageValueOther: MessageValueOther,
  Message: Message,
  BlockShard: BlockShard,
  BlockValueFlowToNextBlkOther: BlockValueFlowToNextBlkOther,
  BlockValueFlowExportedOther: BlockValueFlowExportedOther,
  BlockValueFlowFeesCollectedOther: BlockValueFlowFeesCollectedOther,
  BlockValueFlowCreatedOther: BlockValueFlowCreatedOther,
  BlockValueFlowImportedOther: BlockValueFlowImportedOther,
  BlockValueFlowFromPrevBlkOther: BlockValueFlowFromPrevBlkOther,
  BlockValueFlowMintedOther: BlockValueFlowMintedOther,
  BlockValueFlowFeesImportedOther: BlockValueFlowFeesImportedOther,
  BlockValueFlow: BlockValueFlow,
  BlockAccountBlocksStateUpdate: BlockAccountBlocksStateUpdate,
  BlockAccountBlocks: BlockAccountBlocks,
  BlockStateUpdate: BlockStateUpdate,
  BlockShardHashesDescrFeesCollectedOther: BlockShardHashesDescrFeesCollectedOther,
  BlockShardHashesDescrFundsCreatedOther: BlockShardHashesDescrFundsCreatedOther,
  BlockShardHashesDescr: BlockShardHashesDescr,
  BlockShardHashes: BlockShardHashes,
  Block: Block,
  AccountBalanceOther: AccountBalanceOther,
  Account: Account,
  TransactionTotalFeesOther: TransactionTotalFeesOther,
  TransactionStorage: TransactionStorage,
  TransactionCreditCreditOther: TransactionCreditCreditOther,
  TransactionCredit: TransactionCredit,
  TransactionCompute: TransactionCompute,
  TransactionAction: TransactionAction,
  TransactionBounce: TransactionBounce,
  TransactionSplitInfo: TransactionSplitInfo,
  Transaction: Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tTaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwid29ya2NoYWluX2lkIiwic2hhcmRfcHJlZml4IiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tTaGFyZEhhc2hlcyIsImhhc2giLCJkZXNjciIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tTaGFyZEhhc2hlc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzaGFyZF9oYXNoZXMiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIlF1ZXJ5IiwibWVzc2FnZXMiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQXVGQSxPQUFPLENBQUMsbUJBQUQsQztJQUF0RkMsTSxZQUFBQSxNO0lBQVFDLFEsWUFBQUEsUTtJQUFVQyxRLFlBQUFBLFE7SUFBVUMsYyxZQUFBQSxjO0lBQWdCQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3pFLElBQU1DLFNBQVMsR0FBR0osTUFBTSxDQUFDO0FBQ3JCSyxFQUFBQSxNQUFNLEVBQUVSLFFBRGE7QUFFckJTLEVBQUFBLE1BQU0sRUFBRVYsTUFGYTtBQUdyQlcsRUFBQUEsU0FBUyxFQUFFWCxNQUhVO0FBSXJCWSxFQUFBQSxTQUFTLEVBQUVaO0FBSlUsQ0FBRCxDQUF4QjtBQU9B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RUFBaEJBLGdCQXhCYTtBQXlCYk8sRUFBQUEsS0FBSyxFQUFMQSxLQXpCYTtBQTBCYm9CLEVBQUFBLG1CQUFtQixFQUFuQkEsbUJBMUJhO0FBMkJiRSxFQUFBQSxPQUFPLEVBQVBBLE9BM0JhO0FBNEJiTyxFQUFBQSx5QkFBeUIsRUFBekJBLHlCQTVCYTtBQTZCYkMsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkE3QmE7QUE4QmJJLEVBQUFBLDRCQUE0QixFQUE1QkEsNEJBOUJhO0FBK0JiRSxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQS9CYTtBQWdDYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFoQ2E7QUFpQ2JnQixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQWpDYTtBQWtDYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFsQ2E7QUFtQ2JPLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBbkNhO0FBb0NiTSxFQUFBQSxXQUFXLEVBQVhBO0FBcENhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXJBcnJheSA9IGFycmF5KE1lc3NhZ2VWYWx1ZU90aGVyKTtcbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50MixcbiAgICB2YWx1ZV9vdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoU3RyaW5nKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBiaWdVSW50MSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIGhhc2g6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzaGFyZDogQmxvY2tTaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja1NoYXJkSGFzaGVzQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlckFycmF5ID0gYXJyYXkoQWNjb3VudEJhbGFuY2VPdGhlcik7XG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZDoge1xuICAgICAgICAgICAgc2hhcmRfcHJlZml4KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2hhcmRfcHJlZml4KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lm5leHRfdmFsaWRhdG9yX3NoYXJkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrU2hhcmQsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja1NoYXJkSGFzaGVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRCYWxhbmNlT3RoZXIsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=