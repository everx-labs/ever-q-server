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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tTaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwid29ya2NoYWluX2lkIiwic2hhcmRfcHJlZml4IiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsImhhc2giLCJkZXNjciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyIiwic2hhcmRfaGFzaGVzIiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInNoYXJkIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIm1hc3RlciIsIkFjY291bnRCYWxhbmNlT3RoZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsIm91dF9tc2dzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiUXVlcnkiLCJtZXNzYWdlcyIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxF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QUFBLGdCQUFnQixFQUFoQkEsZ0JBcEJhO0FBcUJiSSxFQUFBQSw2Q0FBNkMsRUFBN0NBLDZDQXJCYTtBQXNCYkMsRUFBQUEsNENBQTRDLEVBQTVDQSw0Q0F0QmE7QUF1QmJHLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBdkJhO0FBd0JiaUIsRUFBQUEsc0JBQXNCLEVBQXRCQSxzQkF4QmE7QUF5QmJJLEVBQUFBLFdBQVcsRUFBWEEsV0F6QmE7QUEwQmJLLEVBQUFBLEtBQUssRUFBTEEsS0ExQmE7QUEyQmJvQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQTNCYTtBQTRCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQTVCYTtBQTZCYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkE3QmE7QUE4QmJDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBOUJhO0FBK0JiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQS9CYTtBQWdDYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFoQ2E7QUFpQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBakNhO0FBa0NiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFsQ2E7QUFtQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBbkNhO0FBb0NiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXBDYTtBQXFDYk0sRUFBQUEsV0FBVyxFQUFYQTtBQXJDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1NoYXJkID0gc3RydWN0KHtcbiAgICBzaGFyZF9wZnhfYml0czogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkX3ByZWZpeDogYmlnVUludDEsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYmlnVUludDEsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICBoYXNoOiBzY2FsYXIsXG4gICAgZGVzY3I6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyID0gc3RydWN0KHtcbiAgICBzaGFyZF9oYXNoZXM6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSxcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrQWNjb3VudEJsb2Nrc0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBtYXN0ZXI6IEJsb2NrTWFzdGVyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSA9IGFycmF5KEFjY291bnRCYWxhbmNlT3RoZXIpO1xuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBhY2NfdHlwZTogc2NhbGFyLFxuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBiaWdVSW50MixcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBiaWdVSW50MixcbiAgICBiYWxhbmNlX290aGVyOiBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXksXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdG9yYWdlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBiaWdVSW50MixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5ID0gYXJyYXkoVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcik7XG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdCA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBjcmVkaXQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdF9vdGhlcjogVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ29tcHV0ZSA9IHN0cnVjdCh7XG4gICAgY29tcHV0ZV90eXBlOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9yZWFzb246IHNjYWxhcixcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBiaWdVSW50MixcbiAgICBnYXNfdXNlZDogYmlnVUludDEsXG4gICAgZ2FzX2xpbWl0OiBiaWdVSW50MSxcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25BY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogYmlnVUludDIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Cb3VuY2UgPSBzdHJ1Y3Qoe1xuICAgIGJvdW5jZV90eXBlOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfY2VsbHM6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9iaXRzOiBzY2FsYXIsXG4gICAgcmVxX2Z3ZF9mZWVzOiBiaWdVSW50MixcbiAgICBtc2dfZmVlczogYmlnVUludDIsXG4gICAgZndkX2ZlZXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3BsaXRJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZVZhbHVlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrU2hhcmQ6IHtcbiAgICAgICAgICAgIHNoYXJkX3ByZWZpeChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnNoYXJkX3ByZWZpeCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5uZXh0X3ZhbGlkYXRvcl9zaGFyZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudEJhbGFuY2VPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZHVlX3BheW1lbnQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfcGF5bWVudCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGFzdF90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmxhc3RfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJhbGFuY2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5iYWxhbmNlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25TdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19kdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdDoge1xuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVkaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5jcmVkaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Db21wdXRlOiB7XG4gICAgICAgICAgICBnYXNfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmdhc19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfdXNlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc191c2VkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBnYXNfbGltaXQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfbGltaXQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25BY3Rpb246IHtcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfYWN0aW9uX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Cb3VuY2U6IHtcbiAgICAgICAgICAgIHJlcV9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnJlcV9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbXNnX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5tc2dfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGx0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByZXZfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5wcmV2X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudG90YWxfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2csXG4gICAgTWVzc2FnZVZhbHVlT3RoZXIsXG4gICAgTWVzc2FnZSxcbiAgICBCbG9ja1NoYXJkLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlcixcbiAgICBCbG9jayxcbiAgICBBY2NvdW50QmFsYW5jZU90aGVyLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcixcbiAgICBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlcixcbiAgICBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgVHJhbnNhY3Rpb25Cb3VuY2UsXG4gICAgVHJhbnNhY3Rpb25TcGxpdEluZm8sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19