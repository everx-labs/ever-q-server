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
  skip_reason: scalar,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZVZhbHVlIiwiZ3JhbXMiLCJvdGhlciIsIk1lc3NhZ2UiLCJpZCIsImJsb2NrX2lkIiwiYm9keSIsInN0YXR1cyIsInNwbGl0X2RlcHRoIiwidGljayIsInRvY2siLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJ3b3JrY2hhaW5faWQiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZCIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsayIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZCIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsImluZm8iLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudEJhbGFuY2UiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJhZGRyIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlcyIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdCIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJhbnNhY3Rpb25Db21wdXRlIiwidHlwZSIsInNraXBfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsIm91dF9tc2dzIiwidG90YWxfZmVlcyIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJjb21wdXRlIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsIl9rZXkiLCJRdWVyeSIsIm1lc3NhZ2VzIiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNYSxXQUFXLEdBQUdULE1BQU0sQ0FBQztBQUN2QlUsRUFBQUEsR0FBRyxFQUFFZCxNQURrQjtBQUV2QmUsRUFBQUEsU0FBUyxFQUFFZixNQUZZO0FBR3ZCZ0IsRUFBQUEsUUFBUSxFQUFFaEIsTUFIYTtBQUl2QmlCLEVBQUFBLGlCQUFpQixFQUFFZjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNZ0IsS0FBSyxHQUFHZCxNQUFNLENBQUM7QUFDakJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRE87QUFF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LGtCQTFDYTtBQTJDYkksRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkEzQ2E7QUE0Q2JFLEVBQUFBLHVCQUF1QixFQUF2QkEsdUJBNUNhO0FBNkNiQyxFQUFBQSxpQkFBaUIsRUFBakJBLGlCQTdDYTtBQThDYkcsRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkE5Q2E7QUErQ2JnQixFQUFBQSxpQkFBaUIsRUFBakJBLGlCQS9DYTtBQWdEYmMsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFoRGE7QUFpRGJNLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBakRhO0FBa0RiSyxFQUFBQSxXQUFXLEVBQVhBO0FBbERhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBzY2FsYXIsXG4gICAgY3VyX2FkZHI6IHNjYWxhcixcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogYmlnVUludDIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogYmlnVUludDIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBNZXNzYWdlVmFsdWVPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXJBcnJheSA9IGFycmF5KE1lc3NhZ2VWYWx1ZU90aGVyKTtcbmNvbnN0IE1lc3NhZ2VWYWx1ZSA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgbXNnX3R5cGU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBzcmM6IHNjYWxhcixcbiAgICBkc3Q6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgaW1wb3J0X2ZlZTogYmlnVUludDIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHZhbHVlOiBNZXNzYWdlVmFsdWUsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZlByZXYgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBiaWdVSW50MSxcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWQgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGsgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZCA9IHN0cnVjdCh7XG4gICAgZ3JhbXM6IGJpZ1VJbnQyLFxuICAgIG90aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsayxcbiAgICBleHBvcnRlZDogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZCxcbiAgICBmZWVzX2NvbGxlY3RlZDogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkLFxuICAgIGNyZWF0ZWQ6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZCxcbiAgICBpbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZCxcbiAgICBmcm9tX3ByZXZfYmxrOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrLFxuICAgIG1pbnRlZDogQmxvY2tWYWx1ZUZsb3dNaW50ZWQsXG4gICAgZmVlc19pbXBvcnRlZDogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWQsXG59KTtcblxuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoU3RyaW5nKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tFeHRyYUFjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2tFeHRyYSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICBpbmZvOiBCbG9ja0luZm8sXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgZXh0cmE6IEJsb2NrRXh0cmEsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudEJhbGFuY2UgPSBzdHJ1Y3Qoe1xuICAgIGdyYW1zOiBiaWdVSW50MixcbiAgICBvdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBhZGRyOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IEFjY291bnRCYWxhbmNlLFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0ID0gc3RydWN0KHtcbiAgICBncmFtczogYmlnVUludDIsXG4gICAgb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgdHlwZTogc2NhbGFyLFxuICAgIHNraXBfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICB0eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICB0b3RhbF9mZWVzOiBUcmFuc2FjdGlvblRvdGFsRmVlcyxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnRW52ZWxvcGU6IHtcbiAgICAgICAgICAgIGZ3ZF9mZWVfcmVtYWluaW5nKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZV9yZW1haW5pbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IHtcbiAgICAgICAgICAgIGlocl9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5paHJfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNpdF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50cmFuc2l0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC50cmFuc2FjdGlvbl9pZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBPdXRNc2c6IHtcbiAgICAgICAgICAgIGltcG9ydF9ibG9ja19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmltcG9ydF9ibG9ja19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlVmFsdWU6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrSW5mb1ByZXZSZWZQcmV2OiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tJbmZvU2hhcmQ6IHtcbiAgICAgICAgICAgIHNoYXJkX3ByZWZpeChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnNoYXJkX3ByZWZpeCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja0luZm86IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGs6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZDoge1xuICAgICAgICAgICAgZ3JhbXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5ncmFtcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzOiB7XG4gICAgICAgICAgICBncmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXQ6IHtcbiAgICAgICAgICAgIGdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2VWYWx1ZU90aGVyLFxuICAgIE1lc3NhZ2VWYWx1ZSxcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrSW5mb1ByZXZSZWZQcmV2LFxuICAgIEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgQmxvY2tJbmZvU2hhcmQsXG4gICAgQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxuICAgIEJsb2NrSW5mbyxcbiAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrLFxuICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWQsXG4gICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGssXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZCxcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MsXG4gICAgQmxvY2tFeHRyYSxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRCYWxhbmNlT3RoZXIsXG4gICAgQWNjb3VudEJhbGFuY2UsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyLFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzLFxuICAgIFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=