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
var BlockMasterShardHashesDescrFeesCollectedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardHashesDescrFundsCreatedOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardHashesDescrFeesCollectedOtherArray = array(BlockMasterShardHashesDescrFeesCollectedOther);
var BlockMasterShardHashesDescrFundsCreatedOtherArray = array(BlockMasterShardHashesDescrFundsCreatedOther);
var BlockMasterShardHashesDescr = struct({
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
  next_validator_shard: bigUInt1,
  min_ref_mc_seqno: scalar,
  gen_utime: scalar,
  split_type: scalar,
  split: scalar,
  fees_collected: bigUInt2,
  fees_collected_other: BlockMasterShardHashesDescrFeesCollectedOtherArray,
  funds_created: bigUInt2,
  funds_created_other: BlockMasterShardHashesDescrFundsCreatedOtherArray
});
var BlockMasterShardHashes = struct({
  hash: scalar,
  descr: BlockMasterShardHashesDescr
});
var BlockMasterShardHashesArray = array(BlockMasterShardHashes);
var BlockMaster = struct({
  shard_hashes: BlockMasterShardHashesArray
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
  state_update: BlockStateUpdate,
  master: BlockMaster
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
    BlockMasterShardHashesDescrFeesCollectedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardHashesDescrFundsCreatedOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardHashesDescr: {
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      },
      next_validator_shard: function next_validator_shard(parent) {
        return resolveBigUInt(1, parent.next_validator_shard);
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
  BlockMasterShardHashesDescrFeesCollectedOther: BlockMasterShardHashesDescrFeesCollectedOther,
  BlockMasterShardHashesDescrFundsCreatedOther: BlockMasterShardHashesDescrFundsCreatedOther,
  BlockMasterShardHashesDescr: BlockMasterShardHashesDescr,
  BlockMasterShardHashes: BlockMasterShardHashes,
  BlockMaster: BlockMaster,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsIkJsb2NrU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsIndvcmtjaGFpbl9pZCIsInNoYXJkX3ByZWZpeCIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyIiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXQiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXMiLCJoYXNoIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInZhbHVlX2Zsb3ciLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJtYXN0ZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlckFycmF5IiwiQWNjb3VudCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyIiwiVHJhbnNhY3Rpb25TdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uQ3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiY3JlZGl0X290aGVyIiwiVHJhbnNhY3Rpb25Db21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJhbnNhY3Rpb25BY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsIlRyYW5zYWN0aW9uQm91bmNlIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJhbnNhY3Rpb25TcGxpdEluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsIlF1ZXJ5IiwibWVzc2FnZXMiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQXVGQSxPQUFPLENBQUMsbUJBQUQsQztJQUF0RkMsTSxZQUFBQSxNO0lBQVFDLFEsWUFBQUEsUTtJQUFVQyxRLFlBQUFBLFE7SUFBVUMsYyxZQUFBQSxjO0lBQWdCQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3pFLElBQU1DLFNBQVMsR0FBR0osTUFBTSxDQUFDO0FBQ3JCSyxFQUFBQSxNQUFNLEVBQUVSLFFBRGE7QUFFckJTLEVBQUFBLE1BQU0sRUFBRVYsTUFGYTtBQUdyQlcsRUFBQUEsU0FBUyxFQUFF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TEEsS0ExQmE7QUEyQmJvQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQTNCYTtBQTRCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQTVCYTtBQTZCYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkE3QmE7QUE4QmJDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBOUJhO0FBK0JiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQS9CYTtBQWdDYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFoQ2E7QUFpQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBakNhO0FBa0NiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFsQ2E7QUFtQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBbkNhO0FBb0NiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXBDYTtBQXFDYk0sRUFBQUEsV0FBVyxFQUFYQTtBQXJDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tTaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IGJpZ1VJbnQyLFxuICAgIHRvX25leHRfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXksXG4gICAgZXhwb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGV4cG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgY3JlYXRlZDogYmlnVUludDIsXG4gICAgY3JlYXRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXJBcnJheSxcbiAgICBpbXBvcnRlZDogYmlnVUludDIsXG4gICAgaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlckFycmF5LFxuICAgIGZyb21fcHJldl9ibGs6IGJpZ1VJbnQyLFxuICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5LFxuICAgIG1pbnRlZDogYmlnVUludDIsXG4gICAgbWludGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19pbXBvcnRlZDogYmlnVUludDIsXG4gICAgZmVlc19pbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjciA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcmVnX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYmVmb3JlX21lcmdlOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICBueF9jY191cGRhdGVkOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IGJpZ1VJbnQxLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgaGFzaDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBFeHRCbGtSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICBzaGFyZDogQmxvY2tTaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3Rlcixcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cl90eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogYmlnVUludDEsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogYmlnVUludDEsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICB0b3RhbF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9mZWVzX290aGVyOiBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXksXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyYW5zYWN0aW9uU3RvcmFnZSxcbiAgICBjcmVkaXQ6IFRyYW5zYWN0aW9uQ3JlZGl0LFxuICAgIGNvbXB1dGU6IFRyYW5zYWN0aW9uQ29tcHV0ZSxcbiAgICBhY3Rpb246IFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIGJvdW5jZTogVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxuICAgIHR0OiBzY2FsYXIsXG4gICAgc3BsaXRfaW5mbzogVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZVZhbHVlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmQ6IHtcbiAgICAgICAgICAgIHNoYXJkX3ByZWZpeChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnNoYXJkX3ByZWZpeCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5uZXh0X3ZhbGlkYXRvcl9zaGFyZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1NoYXJkLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9jayxcbiAgICBBY2NvdW50QmFsYW5jZU90aGVyLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcixcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcixcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19