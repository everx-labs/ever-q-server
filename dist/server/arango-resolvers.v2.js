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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tTaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwid29ya2NoYWluX2lkIiwic2hhcmRfcHJlZml4IiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQWNjb3VudEJhbGFuY2VPdGhlciIsIkFjY291bnRCYWxhbmNlT3RoZXJBcnJheSIsIkFjY291bnRCYWxhbmNlIiwiQWNjb3VudCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlcyIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiUXVlcnkiLCJtZXNzYWdlcyIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxFQUFBQSxTQUFTLEVBQUVYLE1BSFU7QUFJckJZLEVBQUFBLFNBQVMsRUFBRVo7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWEsV0FBVyxHQUFHVCxNQUFNLENBQUM7QUFDdkJVLEVBQUFBLEdBQUcsRUFBRWQsTUFEa0I7QUFFdkJlLEVBQUFBLFNBQVMsRUFBRWYsTUFGWTtBQUd2QmdCLEVBQUFBLFFBQVEsRUFBRWhCLE1BSGE7QUFJdkJpQixFQUFBQSxpQkFBaUIsRUFBRWY7QUFKSSxDQUFELENBQTFCO0FBT0EsSUFBTWdCLEtBQUssR0FBR2QsTUFBTSxDQUFDO0FBQ2pCZSxFQUFBQSxRQUFRLEVBQUVuQixNQURPO0FBRWpCYyxFQUFBQSxHQUFHLEVBQUVkLE1BRlk7QUFHakJvQixFQUFBQSxXQUFXLEVBQUVwQixNQUhJO0FBSWpCcUIsRUFBQUEsT0FBTyxFQUFFbkIsUUFKUTtBQUtqQm9CLEVBQUFBLGFBQWEsRUFBRXRCLE1BTEU7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YTtBQXVDYkMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF2Q2E7QUF3Q2JHLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBeENhO0FBeUNiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF6Q2E7QUEwQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBMUNhO0FBMkNiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTNDYTtBQTRDYkssRUFBQUEsV0FBVyxFQUFYQTtBQTVDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlVmFsdWUgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogTWVzc2FnZVZhbHVlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGsgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayxcbiAgICBleHBvcnRlZDogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCxcbiAgICBmZWVzX2NvbGxlY3RlZDogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIGNyZWF0ZWQ6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBpbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBmcm9tX3ByZXZfYmxrOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrLFxuICAgIG1pbnRlZDogQmxvY2tWYWx1ZUZsb3dNaW50ZWQsXG4gICAgZmVlc19pbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnRCYWxhbmNlID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IEFjY291bnRCYWxhbmNlLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0ID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIHRvdGFsX2ZlZXM6IFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tTaGFyZDoge1xuICAgICAgICAgICAgc2hhcmRfcHJlZml4KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2hhcmRfcHJlZml4KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsazoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblRvdGFsRmVlczoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0OiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlVmFsdWUsXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1NoYXJkLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayxcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93TWludGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50QmFsYW5jZSxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXMsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==