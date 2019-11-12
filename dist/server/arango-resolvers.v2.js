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
      transactions: db.collectionQuery(db.transactions, Transaction)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1NoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInNoYXJkX2hhc2hlcyIsIkFjY291bnRCYWxhbmNlT3RoZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxFQUFBQSxTQUFTLEVBQUVYLE1BSFU7QUFJckJZLEVBQUFBLFNBQVMsRUFBRVo7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWEs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c0JiRyxFQUFBQSxxQkFBcUIsRUFBckJBLHFCQXRCYTtBQXVCYmlCLEVBQUFBLGdCQUFnQixFQUFoQkEsZ0JBdkJhO0FBd0JiUSxFQUFBQSxLQUFLLEVBQUxBLEtBeEJhO0FBeUJibUIsRUFBQUEsbUJBQW1CLEVBQW5CQSxtQkF6QmE7QUEwQmJFLEVBQUFBLE9BQU8sRUFBUEEsT0ExQmE7QUEyQmJPLEVBQUFBLHlCQUF5QixFQUF6QkEseUJBM0JhO0FBNEJiQyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQTVCYTtBQTZCYkksRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkE3QmE7QUE4QmJFLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBOUJhO0FBK0JiSSxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQS9CYTtBQWdDYmdCLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBaENhO0FBaUNiYyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQWpDYTtBQWtDYk8sRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFsQ2E7QUFtQ2JPLEVBQUFBLFdBQVcsRUFBWEE7QUFuQ2EsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgYmlnVUludDEsIGJpZ1VJbnQyLCByZXNvbHZlQmlnVUludCwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlckFycmF5ID0gYXJyYXkoTWVzc2FnZVZhbHVlT3RoZXIpO1xuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja1NoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja1NoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrU2hhcmRIYXNoZXNBcnJheSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZVZhbHVlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja1NoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tTaGFyZEhhc2hlcyxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50QmFsYW5jZU90aGVyLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcixcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcixcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19