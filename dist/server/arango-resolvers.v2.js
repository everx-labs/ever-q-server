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
  workchain_id: scalar,
  shard: scalar,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInNoYXJkX2hhc2hlcyIsIkFjY291bnRCYWxhbmNlT3RoZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsIm91dF9tc2dzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiUXVlcnkiLCJtZXNzYWdlcyIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxFQUFBQSxTQUFTLEVBQUVYLE1BSFU7QUFJckJZLEVBQUFBLFNBQVMsRUFBRVo7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWEsV0FBVyxHQUFHVCxNQUFNLENBQUM7QUFDdkJVLEVBQUFBLEdBQUcsRUFBRWQs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QVcsRUFBWEE7QUFuQ2EsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgYmlnVUludDEsIGJpZ1VJbnQyLCByZXNvbHZlQmlnVUludCwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlckFycmF5ID0gYXJyYXkoTWVzc2FnZVZhbHVlT3RoZXIpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrU2hhcmRIYXNoZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja0FjY291bnRCbG9ja3MsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXMsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==