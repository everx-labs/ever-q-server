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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tTaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwid29ya2NoYWluX2lkIiwic2hhcmRfcHJlZml4IiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQWNjb3VudEJhbGFuY2VPdGhlciIsIkFjY291bnRCYWxhbmNlT3RoZXJBcnJheSIsIkFjY291bnRCYWxhbmNlIiwiQWNjb3VudCIsImFjY190eXBlIiwiYWRkciIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXMiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwib3V0X21zZ3MiLCJ0b3RhbF9mZWVzIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIlF1ZXJ5IiwibWVzc2FnZXMiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQXVGQSxPQUFPLENBQUMsbUJBQUQsQztJQUF0RkMsTSxZQUFBQSxNO0lBQVFDLFEsWUFBQUEsUTtJQUFVQyxRLFlBQUFBLFE7SUFBVUMsYyxZQUFBQSxjO0lBQWdCQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3pFLElBQU1DLFNBQVMsR0FBR0osTUFBTSxDQUFDO0FBQ3JCSyxFQUFBQSxNQUFNLEVBQUVSLFFBRGE7QUFFckJTLEVBQUFBLE1BQU0sRUFBRVYsTUFGYTtBQUdyQlcsRUFBQUEsU0FBUyxFQUFFWCxNQUhVO0FBSXJCWSxFQUFBQSxTQUFTLEVBQUVaO0FBSlUsQ0FBRCxDQUF4QjtBQU9BLElBQU1hLFdBQVcsR0FBR1QsTUFBTSxDQUFDO0FBQ3ZCVSxFQUFBQSxHQUFHLEVBQUVkLE1BRGtCO0FBRXZCZSxFQUFBQSxTQUFTLEVBQUVmLE1BRlk7QUFHdkJnQixFQUFBQSxRQUFRLEVBQUVoQixNQUhhO0FBSXZCaUIsRUFBQUEsaUJBQWlCLEVBQUVmO0FBSkksQ0FBRCxDQUExQjtBQU9BLElBQU1nQixLQUFLLEdBQUdkLE1BQU0sQ0FBQztBQUNqQmUsRUFBQUEsUUFBUSxFQUFFbkIsTUFETztBQUVqQmMsRUFBQUEsR0FBRyxFQUFFZCxNQUZZO0FBR2pCb0IsRUFBQUEsV0FBVyxFQUFFcEIsTUFISTtBQUlqQnFCLEVBQUFBLE9BQU8sRUFBRW5CLFFBSlE7QUFLakJvQixFQUFBQSxhQUFhLEVBQUV0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NEJBckNhO0FBc0NiRSxFQUFBQSx1QkFBdUIsRUFBdkJBLHVCQXRDYTtBQXVDYkMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF2Q2E7QUF3Q2JHLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBeENhO0FBeUNiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkF6Q2E7QUEwQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBMUNhO0FBMkNiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTNDYTtBQTRDYkssRUFBQUEsV0FBVyxFQUFYQTtBQTVDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlVmFsdWUgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogTWVzc2FnZVZhbHVlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGsgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayxcbiAgICBleHBvcnRlZDogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCxcbiAgICBmZWVzX2NvbGxlY3RlZDogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIGNyZWF0ZWQ6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBpbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBmcm9tX3ByZXZfYmxrOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrLFxuICAgIG1pbnRlZDogQmxvY2tWYWx1ZUZsb3dNaW50ZWQsXG4gICAgZmVlc19pbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnRCYWxhbmNlID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgYWRkcjogc2NhbGFyLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBBY2NvdW50QmFsYW5jZSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlcyA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICB0b3RhbF9mZWVzOiBUcmFuc2FjdGlvblRvdGFsRmVlcyxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWU6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmQ6IHtcbiAgICAgICAgICAgIHNoYXJkX3ByZWZpeChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnNoYXJkX3ByZWZpeCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2U6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXM6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZVZhbHVlLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tTaGFyZCxcbiAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRCYWxhbmNlT3RoZXIsXG4gICAgQWNjb3VudEJhbGFuY2UsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyLFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=