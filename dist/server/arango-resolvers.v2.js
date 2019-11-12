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
var StringArray = array(scalar);
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
var MessageArray = array(Message);
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
  in_message: join('in_msg', 'messages', Message),
  out_msgs: StringArray,
  out_messages: joinArray('out_msgs', 'messages', Message),
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
      in_message: function in_message(parent) {
        return db.fetchDocByKey(db.messages, parent.in_msg);
      },
      out_messages: function out_messages(parent) {
        return db.fetchDocsByKeys(db.messages, parent.out_msgs);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInNoYXJkX2hhc2hlcyIsIkFjY291bnRCYWxhbmNlT3RoZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpV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b0JiSSxFQUFBQSx1Q0FBdUMsRUFBdkNBLHVDQXBCYTtBQXFCYkMsRUFBQUEsc0NBQXNDLEVBQXRDQSxzQ0FyQmE7QUFzQmJHLEVBQUFBLHFCQUFxQixFQUFyQkEscUJBdEJhO0FBdUJiaUIsRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkF2QmE7QUF3QmJRLEVBQUFBLEtBQUssRUFBTEEsS0F4QmE7QUF5QmJtQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQXpCYTtBQTBCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQTFCYTtBQTJCYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkEzQmE7QUE0QmJDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBNUJhO0FBNkJiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQTdCYTtBQThCYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkE5QmE7QUErQmJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBL0JhO0FBZ0NiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFoQ2E7QUFpQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBakNhO0FBa0NiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQWxDYTtBQW1DYk8sRUFBQUEsV0FBVyxFQUFYQTtBQW5DYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja1NoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNBcnJheSA9IGFycmF5KEJsb2NrU2hhcmRIYXNoZXMpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIHNoYXJkX2hhc2hlczogQmxvY2tTaGFyZEhhc2hlc0FycmF5LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmRzX2NyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mdW5kc19jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2VWYWx1ZU90aGVyLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja1NoYXJkSGFzaGVzLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRCYWxhbmNlT3RoZXIsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=