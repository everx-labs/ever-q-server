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
var BlockInfoPrevRefPrev = struct({
  seq_no: scalar,
  file_hash: scalar,
  root_hash: scalar,
  end_lt: bigUInt1
});
var BlockInfoPrevRef = struct({
  prev: BlockInfoPrevRefPrev
});
var BlockInfoShard = struct({
  shard_pfx_bits: scalar,
  workchain_id: scalar,
  shard_prefix: bigUInt1
});
var BlockInfoMasterRef = struct({
  master: ExtBlkRef
});
var BlockInfoPrevVertRef = struct({
  prev: ExtBlkRef,
  prev_alt: ExtBlkRef
});
var BlockInfo = struct({
  want_split: scalar,
  seq_no: scalar,
  after_merge: scalar,
  gen_utime: scalar,
  gen_catchain_seqno: scalar,
  flags: scalar,
  prev_ref: BlockInfoPrevRef,
  version: scalar,
  gen_validator_list_hash_short: scalar,
  before_split: scalar,
  after_split: scalar,
  want_merge: scalar,
  vert_seq_no: scalar,
  start_lt: bigUInt1,
  end_lt: bigUInt1,
  shard: BlockInfoShard,
  min_ref_mc_seqno: scalar,
  master_ref: BlockInfoMasterRef,
  prev_vert_ref: BlockInfoPrevVertRef
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
var BlockExtraAccountBlocksStateUpdate = struct({
  old_hash: scalar,
  new_hash: scalar
});
var StringArray = array(String);
var BlockExtraAccountBlocks = struct({
  account_addr: scalar,
  transactions: StringArray,
  state_update: BlockExtraAccountBlocksStateUpdate,
  tr_count: scalar
});
var InMsgArray = array(InMsg);
var OutMsgArray = array(OutMsg);
var BlockExtraAccountBlocksArray = array(BlockExtraAccountBlocks);
var BlockExtra = struct({
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockExtraAccountBlocksArray
});
var BlockStateUpdate = struct({
  "new": scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
var Block = struct({
  id: scalar,
  status: scalar,
  global_id: scalar,
  info: BlockInfo,
  value_flow: BlockValueFlow,
  extra: BlockExtra,
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
    BlockInfoPrevRefPrev: {
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    BlockInfoShard: {
      shard_prefix: function shard_prefix(parent) {
        return resolveBigUInt(1, parent.shard_prefix);
      }
    },
    BlockInfo: {
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
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
  BlockInfoPrevRefPrev: BlockInfoPrevRefPrev,
  BlockInfoPrevRef: BlockInfoPrevRef,
  BlockInfoShard: BlockInfoShard,
  BlockInfoMasterRef: BlockInfoMasterRef,
  BlockInfoPrevVertRef: BlockInfoPrevVertRef,
  BlockInfo: BlockInfo,
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
  BlockExtraAccountBlocksStateUpdate: BlockExtraAccountBlocksStateUpdate,
  BlockExtraAccountBlocks: BlockExtraAccountBlocks,
  BlockExtra: BlockExtra,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZCIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsImluZm8iLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudEJhbGFuY2UiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhZGRyIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlcyIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJhbnNhY3Rpb25Db21wdXRlIiwidHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsIm91dF9tc2dzIiwidG90YWxfZmVlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJRdWVyeSIsIm1lc3NhZ2VzIiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNYSxXQUFXLEdBQUdULE1BQU0sQ0FBQztBQUN2QlUsRUFBQUEsR0FBRyxFQUFFZCxNQURrQjtBQUV2QmUsRUFBQUEsU0FBUyxFQUFFZixNQUZZO0FBR3ZCZ0IsRUFBQUEsUUFBUSxFQUFFaEIsTUFIYTtBQUl2QmlCLEVBQUFBLGlCQUFpQixFQUFFZjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNZ0IsS0FBSyxHQUFHZCxNQUFNLENBQUM7QUFDakJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRE87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QkEsa0JBMUNhO0FBMkNiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQTNDYTtBQTRDYkUsRUFBQUEsdUJBQXVCLEVBQXZCQSx1QkE1Q2E7QUE2Q2JDLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBN0NhO0FBOENiRyxFQUFBQSxrQkFBa0IsRUFBbEJBLGtCQTlDYTtBQStDYmdCLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBL0NhO0FBZ0RiYyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQWhEYTtBQWlEYk0sRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFqRGE7QUFrRGJLLEVBQUFBLFdBQVcsRUFBWEE7QUFsRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgYmlnVUludDEsIGJpZ1VJbnQyLCByZXNvbHZlQmlnVUludCwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IHNjYWxhcixcbiAgICBjdXJfYWRkcjogc2NhbGFyLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBiaWdVSW50MixcbiAgICB0cmFuc2FjdGlvbl9pZDogYmlnVUludDEsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlckFycmF5ID0gYXJyYXkoTWVzc2FnZVZhbHVlT3RoZXIpO1xuY29uc3QgTWVzc2FnZVZhbHVlID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IE1lc3NhZ2VWYWx1ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb01hc3RlclJlZiA9IHN0cnVjdCh7XG4gICAgbWFzdGVyOiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlZlcnRSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdDogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mbyA9IHN0cnVjdCh7XG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBwcmV2X3JlZjogQmxvY2tJbmZvUHJldlJlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGsgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrLFxuICAgIGV4cG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkLFxuICAgIGZlZXNfY29sbGVjdGVkOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWQsXG4gICAgY3JlYXRlZDogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkLFxuICAgIGltcG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkLFxuICAgIGZyb21fcHJldl9ibGs6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGssXG4gICAgbWludGVkOiBCbG9ja1ZhbHVlRmxvd01pbnRlZCxcbiAgICBmZWVzX2ltcG9ydGVkOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCxcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlckFycmF5ID0gYXJyYXkoQWNjb3VudEJhbGFuY2VPdGhlcik7XG5jb25zdCBBY2NvdW50QmFsYW5jZSA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGFkZHI6IHNjYWxhcixcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogQWNjb3VudEJhbGFuY2UsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXMgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICB0eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIHR5cGU6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIHRvdGFsX2ZlZXM6IFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZToge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmltcG9ydF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tJbmZvUHJldlJlZlByZXY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0luZm9TaGFyZDoge1xuICAgICAgICAgICAgc2hhcmRfcHJlZml4KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc2hhcmRfcHJlZml4KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrSW5mbzoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsazoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2U6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXM6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZVZhbHVlLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tJbmZvUHJldlJlZlByZXYsXG4gICAgQmxvY2tJbmZvUHJldlJlZixcbiAgICBCbG9ja0luZm9TaGFyZCxcbiAgICBCbG9ja0luZm9NYXN0ZXJSZWYsXG4gICAgQmxvY2tJbmZvUHJldlZlcnRSZWYsXG4gICAgQmxvY2tJbmZvLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayxcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93TWludGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja0V4dHJhLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50QmFsYW5jZSxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXMsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==