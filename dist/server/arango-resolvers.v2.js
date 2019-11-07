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
var BlockPrevRefPrev = struct({
  seq_no: scalar,
  file_hash: scalar,
  root_hash: scalar,
  end_lt: bigUInt1
});
var BlockPrevRef = struct({
  prev: BlockPrevRefPrev
});
var BlockShard = struct({
  shard_pfx_bits: scalar,
  workchain_id: scalar,
  shard_prefix: bigUInt1
});
var BlockMasterRef = struct({
  master: ExtBlkRef
});
var BlockPrevVertRef = struct({
  prev: ExtBlkRef,
  prev_alt: ExtBlkRef
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
  prev_ref: BlockPrevRef,
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
  master_ref: BlockMasterRef,
  prev_vert_ref: BlockPrevVertRef,
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
    BlockPrevRefPrev: {
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
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
  BlockPrevRefPrev: BlockPrevRefPrev,
  BlockPrevRef: BlockPrevRef,
  BlockShard: BlockShard,
  BlockMasterRef: BlockMasterRef,
  BlockPrevVertRef: BlockPrevVertRef,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tQcmV2UmVmUHJldiIsIkJsb2NrUHJldlJlZiIsInByZXYiLCJCbG9ja1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrUHJldlZlcnRSZWYiLCJwcmV2X2FsdCIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZCIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJTdHJpbmciLCJCbG9ja0FjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudEJhbGFuY2UiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhZGRyIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlcyIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJhbnNhY3Rpb25Db21wdXRlIiwidHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsIm91dF9tc2dzIiwidG90YWxfZmVlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJRdWVyeSIsIm1lc3NhZ2VzIiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNYSxXQUFXLEdBQUdULE1BQU0sQ0FBQztBQUN2QlUsRUFBQUEsR0FBRyxFQUFFZCxNQURrQjtBQUV2QmUsRUFBQUEsU0FBUyxFQUFFZixNQUZZO0FBR3ZCZ0IsRUFBQUEsUUFBUSxFQUFFaEIsTUFIYTtBQUl2QmlCLEVBQUFBLGlCQUFpQixFQUFFZjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNZ0IsS0FBSyxHQUFHZCxNQUFNLENBQUM7QUFDakJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRE87QUFFakJjLEVBQUFBLEdBQUcsRUFBRWQsTUFGWTtBQUdqQm9CLEVBQUFBLFdBQVcsRUFBRXBCLE1BSEk7QUFJakJxQixFQUFBQSxP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QTtBQWhEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlVmFsdWUgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogTWVzc2FnZVZhbHVlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogTWVzc2FnZVZhbHVlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEJsb2NrUHJldlJlZlByZXYgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgQmxvY2tQcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja1ByZXZSZWZQcmV2LFxufSk7XG5cbmNvbnN0IEJsb2NrU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclJlZiA9IHN0cnVjdCh7XG4gICAgbWFzdGVyOiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tQcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGssXG4gICAgZXhwb3J0ZWQ6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQsXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCxcbiAgICBjcmVhdGVkOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQsXG4gICAgaW1wb3J0ZWQ6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQsXG4gICAgZnJvbV9wcmV2X2JsazogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayxcbiAgICBtaW50ZWQ6IEJsb2NrVmFsdWVGbG93TWludGVkLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkLFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrUHJldlJlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBCbG9ja01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja1ByZXZWZXJ0UmVmLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudEJhbGFuY2UgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhZGRyOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IEFjY291bnRCYWxhbmNlLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0ID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICB0eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIHRvdGFsX2ZlZXM6IFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tQcmV2UmVmUHJldjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmQ6IHtcbiAgICAgICAgICAgIHNoYXJkX3ByZWZpeChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnNoYXJkX3ByZWZpeCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2U6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXM6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZVZhbHVlLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tQcmV2UmVmUHJldixcbiAgICBCbG9ja1ByZXZSZWYsXG4gICAgQmxvY2tTaGFyZCxcbiAgICBCbG9ja01hc3RlclJlZixcbiAgICBCbG9ja1ByZXZWZXJ0UmVmLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayxcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93TWludGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50QmFsYW5jZSxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXMsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==