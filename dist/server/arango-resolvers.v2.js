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
  workchain_id: scalar,
  shard: scalar
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
  next_validator_shard: scalar,
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
  workchain_id: scalar,
  shard: scalar,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tTaGFyZCIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tTaGFyZEhhc2hlcyIsImRlc2NyIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJzaGFyZF9oYXNoZXMiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIlF1ZXJ5IiwibWVzc2FnZXMiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQXVGQSxPQUFPLENBQUMsbUJBQUQsQztJQUF0RkMsTSxZQUFBQSxNO0lBQVFDLFEsWUFBQUEsUTtJQUFVQyxRLFlBQUFBLFE7SUFBVUMsYyxZQUFBQSxjO0lBQWdCQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3pFLElBQU1DLFNBQVMsR0FBR0osTUFBTSxDQUFDO0FBQ3JCSyxFQUFBQSxNQUFNLEVBQUVSLFFBRGE7QUFFckJTLEVBQUFBLE1BQU0sRUFBRVYsTUFGYTtBQUdyQlcsRUFBQUEsU0FBUyxFQUFFWCxNQUhVO0FBSXJCWSxFQUFBQSxTQUFTLEVBQUVaO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLElBQU1hLFdBQVcsR0FBR1QsTUFBTSxDQUFDO0FBQ3ZCVSxFQUFB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aUNiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFqQ2E7QUFrQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBbENhO0FBbUNiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQW5DYTtBQW9DYk0sRUFBQUEsV0FBVyxFQUFYQTtBQXBDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1NoYXJkID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgc3BsaXRfdHlwZTogc2NhbGFyLFxuICAgIHNwbGl0OiBzY2FsYXIsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBmdW5kc19jcmVhdGVkOiBiaWdVSW50MixcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXMgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2hhcmQ6IEJsb2NrU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tTaGFyZEhhc2hlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZVZhbHVlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrU2hhcmQsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja1NoYXJkSGFzaGVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRCYWxhbmNlT3RoZXIsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=