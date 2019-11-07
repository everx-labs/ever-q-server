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
var MessageValue = struct({
  grams: bigUInt2,
  other: MessageValueOtherArray
});
var Message = struct({
  id: scalar,
  msg_type: scalar,
  transaction_id: scalar,
  block_id: scalar,
  body: scalar,
  status: scalar,
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
  value: MessageValue
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
var BlockValueFlowToNextBlkOtherArray = array(BlockValueFlowToNextBlkOther);
var BlockValueFlowToNextBlk = struct({
  grams: bigUInt2,
  other: BlockValueFlowToNextBlkOtherArray
});
var BlockValueFlowExportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowExportedOtherArray = array(BlockValueFlowExportedOther);
var BlockValueFlowExported = struct({
  grams: bigUInt2,
  other: BlockValueFlowExportedOtherArray
});
var BlockValueFlowFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesCollectedOtherArray = array(BlockValueFlowFeesCollectedOther);
var BlockValueFlowFeesCollected = struct({
  grams: bigUInt2,
  other: BlockValueFlowFeesCollectedOtherArray
});
var BlockValueFlowCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowCreatedOtherArray = array(BlockValueFlowCreatedOther);
var BlockValueFlowCreated = struct({
  grams: bigUInt2,
  other: BlockValueFlowCreatedOtherArray
});
var BlockValueFlowImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowImportedOtherArray = array(BlockValueFlowImportedOther);
var BlockValueFlowImported = struct({
  grams: bigUInt2,
  other: BlockValueFlowImportedOtherArray
});
var BlockValueFlowFromPrevBlkOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFromPrevBlkOtherArray = array(BlockValueFlowFromPrevBlkOther);
var BlockValueFlowFromPrevBlk = struct({
  grams: bigUInt2,
  other: BlockValueFlowFromPrevBlkOtherArray
});
var BlockValueFlowMintedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowMintedOtherArray = array(BlockValueFlowMintedOther);
var BlockValueFlowMinted = struct({
  grams: bigUInt2,
  other: BlockValueFlowMintedOtherArray
});
var BlockValueFlowFeesImportedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockValueFlowFeesImportedOtherArray = array(BlockValueFlowFeesImportedOther);
var BlockValueFlowFeesImported = struct({
  grams: bigUInt2,
  other: BlockValueFlowFeesImportedOtherArray
});
var BlockValueFlow = struct({
  to_next_blk: BlockValueFlowToNextBlk,
  exported: BlockValueFlowExported,
  fees_collected: BlockValueFlowFeesCollected,
  created: BlockValueFlowCreated,
  imported: BlockValueFlowImported,
  from_prev_blk: BlockValueFlowFromPrevBlk,
  minted: BlockValueFlowMinted,
  fees_imported: BlockValueFlowFeesImported
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
var AccountBalance = struct({
  grams: bigUInt2,
  other: AccountBalanceOtherArray
});
var Account = struct({
  id: scalar,
  acc_type: scalar,
  addr: scalar,
  last_paid: scalar,
  due_payment: bigUInt2,
  last_trans_lt: bigUInt1,
  balance: AccountBalance,
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
var TransactionTotalFeesOtherArray = array(TransactionTotalFeesOther);
var TransactionTotalFees = struct({
  grams: bigUInt2,
  other: TransactionTotalFeesOtherArray
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
var TransactionCreditCredit = struct({
  grams: bigUInt2,
  other: TransactionCreditCreditOtherArray
});
var TransactionCredit = struct({
  due_fees_collected: bigUInt2,
  credit: TransactionCreditCredit
});
var TransactionCompute = struct({
  type: scalar,
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
  type: scalar,
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
  total_fees: TransactionTotalFees,
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
    MessageValue: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
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
    BlockValueFlowToNextBlk: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowExportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowExported: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesCollected: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowCreated: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowImported: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowFromPrevBlkOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFromPrevBlk: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowMintedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowMinted: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    BlockValueFlowFeesImportedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockValueFlowFeesImported: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
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
    AccountBalance: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
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
      }
    },
    TransactionTotalFeesOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    TransactionTotalFees: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
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
    TransactionCreditCredit: {
      grams: function grams(parent) {
        return resolveBigUInt(2, parent.grams);
      }
    },
    TransactionCredit: {
      due_fees_collected: function due_fees_collected(parent) {
        return resolveBigUInt(2, parent.due_fees_collected);
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
  MessageValue: MessageValue,
  Message: Message,
  BlockShard: BlockShard,
  BlockValueFlowToNextBlkOther: BlockValueFlowToNextBlkOther,
  BlockValueFlowToNextBlk: BlockValueFlowToNextBlk,
  BlockValueFlowExportedOther: BlockValueFlowExportedOther,
  BlockValueFlowExported: BlockValueFlowExported,
  BlockValueFlowFeesCollectedOther: BlockValueFlowFeesCollectedOther,
  BlockValueFlowFeesCollected: BlockValueFlowFeesCollected,
  BlockValueFlowCreatedOther: BlockValueFlowCreatedOther,
  BlockValueFlowCreated: BlockValueFlowCreated,
  BlockValueFlowImportedOther: BlockValueFlowImportedOther,
  BlockValueFlowImported: BlockValueFlowImported,
  BlockValueFlowFromPrevBlkOther: BlockValueFlowFromPrevBlkOther,
  BlockValueFlowFromPrevBlk: BlockValueFlowFromPrevBlk,
  BlockValueFlowMintedOther: BlockValueFlowMintedOther,
  BlockValueFlowMinted: BlockValueFlowMinted,
  BlockValueFlowFeesImportedOther: BlockValueFlowFeesImportedOther,
  BlockValueFlowFeesImported: BlockValueFlowFeesImported,
  BlockValueFlow: BlockValueFlow,
  BlockAccountBlocksStateUpdate: BlockAccountBlocksStateUpdate,
  BlockAccountBlocks: BlockAccountBlocks,
  BlockStateUpdate: BlockStateUpdate,
  Block: Block,
  AccountBalanceOther: AccountBalanceOther,
  AccountBalance: AccountBalance,
  Account: Account,
  TransactionTotalFeesOther: TransactionTotalFeesOther,
  TransactionTotalFees: TransactionTotalFees,
  TransactionStorage: TransactionStorage,
  TransactionCreditCreditOther: TransactionCreditCreditOther,
  TransactionCreditCredit: TransactionCreditCredit,
  TransactionCredit: TransactionCredit,
  TransactionCompute: TransactionCompute,
  TransactionAction: TransactionAction,
  TransactionBounce: TransactionBounce,
  TransactionSplitInfo: TransactionSplitInfo,
  Transaction: Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tTaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwid29ya2NoYWluX2lkIiwic2hhcmRfcHJlZml4IiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQWNjb3VudEJhbGFuY2VPdGhlciIsIkFjY291bnRCYWxhbmNlT3RoZXJBcnJheSIsIkFjY291bnRCYWxhbmNlIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWRkciIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXMiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsInR5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiUXVlcnkiLCJtZXNzYWdlcyIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxFQUFBQSxTQUFTLEVBQUVYLE1BSFU7QUFJckJZLEVBQUFBLFNBQVMsRUFBRVo7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWEsV0FBVyxHQUFHVCxNQUFNLENBQUM7QUFDdkJVLEVBQUFBLEdBQUcsRUFBRWQsTUFEa0I7QUFFdkJlLEVBQUFBLFNBQVMsRUFBRWYsTUFGWTtBQUd2QmdCLEVBQUFBLFFBQVEsRUFBRWhCLE1BSGE7QUFJdkJpQixFQUFBQSxpQkFBaUIsRUFBRWY7QUFKSSxDQUFELENBQTFCO0FBT0EsSUFBTWdCLEtBQUssR0FBR2QsTUFBTSxDQUFDO0FBQ2pCZSxFQUFBQSxRQUFRLEVBQUVuQixNQURPO0FBRWpCYyxFQUFBQSxHQUFHLEVBQUVkLE1BRlk7QUFHakJvQixFQUFBQSxXQUFXLEVBQUVwQixNQUhJO0FBSWpCcUIsRUFBQUEsT0FBTyxFQUFFbkIsUUFKUTtBQUtqQm9CLEVBQUFBLGFBQWEsRUFBRXRCLE1BTEU7QUFNakJ1QixFQUFBQSxN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QUF1QixFQUF2QkEsdUJBdENhO0FBdUNiQyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXZDYTtBQXdDYkcsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkF4Q2E7QUF5Q2JnQixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQXpDYTtBQTBDYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkExQ2E7QUEyQ2JNLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBM0NhO0FBNENiSyxFQUFBQSxXQUFXLEVBQVhBO0FBNUNhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXJBcnJheSA9IGFycmF5KE1lc3NhZ2VWYWx1ZU90aGVyKTtcbmNvbnN0IE1lc3NhZ2VWYWx1ZSA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBNZXNzYWdlVmFsdWUsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tTaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGsgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrLFxuICAgIGV4cG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkLFxuICAgIGZlZXNfY29sbGVjdGVkOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWQsXG4gICAgY3JlYXRlZDogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkLFxuICAgIGltcG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkLFxuICAgIGZyb21fcHJldl9ibGs6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGssXG4gICAgbWludGVkOiBCbG9ja1ZhbHVlRmxvd01pbnRlZCxcbiAgICBmZWVzX2ltcG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoU3RyaW5nKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2hhcmQ6IEJsb2NrU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudEJhbGFuY2UgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhZGRyOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IEFjY291bnRCYWxhbmNlLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0ID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICB0eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIHRvdGFsX2ZlZXM6IFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZDoge1xuICAgICAgICAgICAgc2hhcmRfcHJlZml4KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2hhcmRfcHJlZml4KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsazoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblRvdGFsRmVlczoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0OiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlVmFsdWUsXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1NoYXJkLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayxcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93TWludGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50QmFsYW5jZSxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXMsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==