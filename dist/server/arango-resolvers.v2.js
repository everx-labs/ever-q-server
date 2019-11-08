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
  value_other: MessageValueOtherArray
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
var InMsgArray = array(InMsg);
var OutMsgArray = array(OutMsg);
var BlockAccountBlocksArray = array(BlockAccountBlocks);
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
  state_update: BlockStateUpdate
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
  library: scalar
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
  installed: scalar
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsIkJsb2NrU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsIndvcmtjaGFpbl9pZCIsInNoYXJkX3ByZWZpeCIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQWNjb3VudEJhbGFuY2VPdGhlciIsIkFjY291bnRCYWxhbmNlT3RoZXJBcnJheSIsIkFjY291bnQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwib3V0X21zZ3MiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJRdWVyeSIsIm1lc3NhZ2VzIiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNYSxXQUFXLEdBQUdULE1BQU0sQ0FBQztBQUN2QlUsRUFBQUEsR0FBRyxFQUFFZCxNQURrQjtBQUV2QmUsRUFBQUEsU0FBUyxFQUFFZixNQUZZO0FBR3ZCZ0IsRUFBQUEsUUFBUSxFQUFFaEIsTUFIYTtBQUl2QmlCLEVBQUFBLGlCQUFpQixFQUFFZjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNZ0IsS0FBSyxHQUFHZCxNQUFNLENBQUM7QUFDakJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRE87QUFFakJjLEVBQUFBLEdBQUcsRUFBRWQsTUFGWTtBQUdqQm9CLEVBQUFBLFdBQVcsRUFBRXBCLE1BSEk7QUFJakJxQixFQUFBQSxPQUFPLEVBQUVuQixRQUpRO0FBS2pCb0IsRUFBQUEsYUFBYSxFQUFFdEIsTUFMRTtBQU1qQnVCLEVBQUFBLE1BQU0sRUFBRVYsV0FOUztBQU9qQlcsRUFBQUEsT0FBTyxFQUFFdEIsUUFQUTtBQVFqQnVCLEVBQUFBLE9BQU8sRUFBRVosV0FSUTtB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LDRCQTFCYTtBQTJCYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkEzQmE7QUE0QmJJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBNUJhO0FBNkJiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkE3QmE7QUE4QmJjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBOUJhO0FBK0JiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQS9CYTtBQWdDYk0sRUFBQUEsV0FBVyxFQUFYQTtBQWhDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tTaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzaGFyZDogQmxvY2tTaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlckFycmF5ID0gYXJyYXkoQWNjb3VudEJhbGFuY2VPdGhlcik7XG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1NoYXJkOiB7XG4gICAgICAgICAgICBzaGFyZF9wcmVmaXgocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zaGFyZF9wcmVmaXgpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG9fbmV4dF9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4cG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZXhwb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVhdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnJvbV9wcmV2X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbWludGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubWludGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlc19pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrU2hhcmQsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==