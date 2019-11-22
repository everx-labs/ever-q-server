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
  msg_id: scalar,
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
  next_validator_shard: scalar,
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
  workchain_id: scalar,
  shard: scalar,
  descr: BlockMasterShardHashesDescr
});
var BlockMasterShardFeesFeesOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardFeesCreateOther = struct({
  currency: scalar,
  value: bigUInt2
});
var BlockMasterShardFeesFeesOtherArray = array(BlockMasterShardFeesFeesOther);
var BlockMasterShardFeesCreateOtherArray = array(BlockMasterShardFeesCreateOther);
var BlockMasterShardFees = struct({
  workchain_id: scalar,
  shard: scalar,
  fees: bigUInt2,
  fees_other: BlockMasterShardFeesFeesOtherArray,
  create: bigUInt2,
  create_other: BlockMasterShardFeesCreateOtherArray
});
var BlockMasterShardHashesArray = array(BlockMasterShardHashes);
var BlockMasterShardFeesArray = array(BlockMasterShardFees);
var BlockMaster = struct({
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg
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
  workchain_id: scalar,
  shard: scalar,
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
      fees_collected: function fees_collected(parent) {
        return resolveBigUInt(2, parent.fees_collected);
      },
      funds_created: function funds_created(parent) {
        return resolveBigUInt(2, parent.funds_created);
      }
    },
    BlockMasterShardFeesFeesOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardFeesCreateOther: {
      value: function value(parent) {
        return resolveBigUInt(2, parent.value);
      }
    },
    BlockMasterShardFees: {
      fees: function fees(parent) {
        return resolveBigUInt(2, parent.fees);
      },
      create: function create(parent) {
        return resolveBigUInt(2, parent.create);
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
  BlockMasterShardHashesDescrFeesCollectedOther: BlockMasterShardHashesDescrFeesCollectedOther,
  BlockMasterShardHashesDescrFundsCreatedOther: BlockMasterShardHashesDescrFundsCreatedOther,
  BlockMasterShardHashesDescr: BlockMasterShardHashesDescr,
  BlockMasterShardHashes: BlockMasterShardHashes,
  BlockMasterShardFeesFeesOther: BlockMasterShardFeesFeesOther,
  BlockMasterShardFeesCreateOther: BlockMasterShardFeesCreateOther,
  BlockMasterShardFees: BlockMasterShardFees,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIiLCJCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkiLCJCbG9ja01hc3RlciIsInNoYXJkX2hhc2hlcyIsInNoYXJkX2ZlZXMiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0FjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwidmFsdWVfZmxvdyIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIm1hc3RlciIsIkFjY291bnRCYWxhbmNlT3RoZXIiLCJBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkiLCJBY2NvdW50IiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsIlRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIiLCJUcmFuc2FjdGlvblN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyIiwiVHJhbnNhY3Rpb25DcmVkaXRDcmVkaXRPdGhlckFycmF5IiwiVHJhbnNhY3Rpb25DcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJjcmVkaXRfb3RoZXIiLCJUcmFuc2FjdGlvbkNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUcmFuc2FjdGlvbkFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiVHJhbnNhY3Rpb25Cb3VuY2UiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUcmFuc2FjdGlvblNwbGl0SW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5IiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsImNvbXB1dGUiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2tleSIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsU0FBUyxHQUFHSixNQUFNLENBQUM7QUFDckJLLEVBQUFBLE1BQU0sRUFBRVIsUUFEYTtBQUVyQlMsRUFBQUEsTUFBTSxFQUFFVixNQUZhO0FBR3JCVyxFQUFBQSxTQUFTLEVBQUVYLE1BSFU7QUFJckJZLEVBQUFBLFNBQVMsRUFBRVo7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTWEsV0FBVyxHQUFHVCxNQUFNLENBQUM7QUFDdkJVLEVBQUFBLE1BQU0sRUFBRWQsTUFEZTtBQUV2QmUsRUFBQUEsU0FBUyxFQUFFZixNQUZZO0FBR3ZCZ0IsRUFBQUEsUUFBUSxFQUFFaEIsTUFIYTtBQUl2QmlCLEVBQUFBLGlCQUFpQixFQUFFZjtBQUpJLENBQUQsQ0FBMUI7QUFPQSxJQUFNZ0IsS0FBSyxHQUFHZCxNQUFNLENBQUM7QUFDakJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRE87QUFFakJvQixFQUFBQSxHQUFHLEVBQUVwQixNQUZZO0FBR2pCcUIsRUFBQUEsV0FBVyxFQUFFckIsTUFISTtBQUlqQnNCLEVBQUFBLE9BQU8sRUFBRXBCLFFBSlE7QUFLakJxQixFQUFBQSxhQUFhLEVBQUV2QixNQUxFO0FBTWpCd0IsRUFBQUEsTUFBTSxFQUFFWCxXQU5TO0FBT2pCWSxFQUFBQSxPQUFPLEVBQUV2QixRQVBRO0FBUWpCd0IsRUFBQUEsT0FBTyxFQUFFYixXQVJRO0FBU2pCYyxFQUFBQSxXQUFXLEVBQUV6QixRQVRJO0FBVWpCMEIsRUFBQUEsY0FBYyxFQUFFM0IsUUFWQztBQVdqQjRCLEVBQUFBLGVBQWUsRUFBRTdCO0FBWEEsQ0FBRCxDQUFwQjtBQWNBLElBQU04QixNQUFNLEdBQUcxQixNQUFNLENBQUM7QUFDbEJlLEVBQUFBLFFBQVEsRUFBRW5CLE1BRFE7QUFFbEJvQixFQUFBQSxHQUFHLEVBQUVwQixNQUZhO0FBR2xCcUIsRUFBQUEsV0FBVyxFQUFFckIsTUFISztBQUlsQjBCLEVBQUFBLE9BQU8sRUFBRWIsV0FKUztBQUtsQmtCLEVBQUFBLFFBQVEsRUFBRWIsS0FMUTtBQU1sQmMsRUFBQUEsUUFBUSxFQUFFZCxLQU5RO0FBT2xCZSxFQUFBQSxlQUFlLEVBQUVoQztBQVBDLENBQUQsQ0FBckI7QUFVQSxJQUFNaUMsaUJBQWlCLEdBQUc5QixNQUFNLENBQUM7QUFDN0IrQixFQUFBQSxRQUFRLEVBQUVuQyxNQURtQjtBQUU3Qm9DLEVBQUFBLEtBQUssRUFBRWxDO0FBRnNCLENBQUQsQ0FBaEM7QUFLQSxJQUFNbUMsc0JBQXNCLEdBQUdoQyxLQUFLLENBQUM2QixpQkFBRCxDQUFwQztBQUNBLElBQU1JLE9BQU8sR0FBR2xDLE1BQU0sQ0FBQztBQUNuQm1DLEVBQUFBLEVBQUUsRUFBRXZDLE1BRGU7QUFFbkJtQixFQUFBQSxRQUFRLEVBQUVuQixNQUZTO0FBR25Cd0MsRUFBQUEsTUFBTSxFQUFFeEMsTUFIVztBQUluQjRCLEVBQUFBLGNBQWMsRUFBRTVCLE1BSkc7QUFLbkJ5QyxFQUFBQSxRQUFRLEVBQUV6QyxNQUxTO0FBTW5CMEMsRUFBQUEsSUFBSSxFQUFFMUMsTUFOYTtBQU9uQjJDLEVBQUFBLFdBQVcsRUFBRTNDLE1BUE07QUFRbkI0QyxFQUFBQSxJQUFJLEVBQUU1QyxNQVJhO0FBU25CNkMsRUFBQUEsSUFBSSxFQUFFN0MsTUFUYTtBQVVuQjhDLEVBQUFBLElBQUksRUFBRTlDLE1BVmE7QUFXbkIrQyxFQUFBQSxJQUFJLEVBQUUvQyxNQVhhO0FBWW5CZ0QsRUFBQUEsT0FBTyxFQUFFaEQsTUFaVTtBQWFuQmlELEVBQUFBLEdBQUcsRUFBRWpELE1BYmM7QUFjbkJrRCxFQUFBQSxHQUFHLEVBQUVsRCxNQWRjO0FBZW5CbUQsRUFBQUEsVUFBVSxFQUFFbEQsUUFmTztBQWdCbkJtRCxFQUFBQSxVQUFVLEVBQUVwRCxNQWhCTztBQWlCbkJxRCxFQUFBQSxZQUFZLEVBQUVyRCxNQWpCSztBQWtCbkJzQixFQUFBQSxPQUFPLEVBQUVwQixRQWxCVTtBQW1CbkJ1QixFQUFBQSxPQUFPLEVBQUV2QixRQW5CVTtBQW9CbkJvRCxFQUFBQSxVQUFVLEVBQUVwRCxRQXBCTztBQXFCbkJxRCxFQUFBQSxNQUFNLEVBQUV2RCxNQXJCVztBQXNCbkJ3RCxFQUFBQSxPQUFPLEVBQUV4RCxNQXRCVTtBQXVCbkJvQyxFQUFBQSxLQUFLLEVBQUVsQyxRQXZCWTtBQXdCbkJ1RCxFQUFBQSxXQUFXLEVBQUVwQixzQkF4Qk07QUF5Qm5CcUIsRUFBQUEsS0FBSyxFQUFFMUQsTUF6Qlk7QUEwQm5CMkQsRUFBQUEsR0FBRyxFQUFFM0Q7QUExQmMsQ0FBRCxFQTJCbkIsSUEzQm1CLENBQXRCO0FBNkJBLElBQU00RCw0QkFBNEIsR0FBR3hELE1BQU0sQ0FBQztBQUN4QytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDhCO0FBRXhDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGaUMsQ0FBRCxDQUEzQztBQUtBLElBQU0yRCwyQkFBMkIsR0FBR3pELE1BQU0sQ0FBQztBQUN2QytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDZCO0FBRXZDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGZ0MsQ0FBRCxDQUExQztBQUtBLElBQU00RCxnQ0FBZ0MsR0FBRzFELE1BQU0sQ0FBQztBQUM1QytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRGtDO0FBRTVDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGcUMsQ0FBRCxDQUEvQztBQUtBLElBQU02RCwwQkFBMEIsR0FBRzNELE1BQU0sQ0FBQztBQUN0QytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDRCO0FBRXRDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGK0IsQ0FBRCxDQUF6QztBQUtBLElBQU04RCwyQkFBMkIsR0FBRzVELE1BQU0sQ0FBQztBQUN2QytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDZCO0FBRXZDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGZ0MsQ0FBRCxDQUExQztBQUtBLElBQU0rRCw4QkFBOEIsR0FBRzdELE1BQU0sQ0FBQztBQUMxQytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRGdDO0FBRTFDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGbUMsQ0FBRCxDQUE3QztBQUtBLElBQU1nRSx5QkFBeUIsR0FBRzlELE1BQU0sQ0FBQztBQUNyQytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDJCO0FBRXJDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGOEIsQ0FBRCxDQUF4QztBQUtBLElBQU1pRSwrQkFBK0IsR0FBRy9ELE1BQU0sQ0FBQztBQUMzQytCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRGlDO0FBRTNDb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGb0MsQ0FBRCxDQUE5QztBQUtBLElBQU1rRSxpQ0FBaUMsR0FBRy9ELEtBQUssQ0FBQ3VELDRCQUFELENBQS9DO0FBQ0EsSUFBTVMsZ0NBQWdDLEdBQUdoRSxLQUFLLENBQUN3RCwyQkFBRCxDQUE5QztBQUNBLElBQU1TLHFDQUFxQyxHQUFHakUsS0FBSyxDQUFDeUQsZ0NBQUQsQ0FBbkQ7QUFDQSxJQUFNUywrQkFBK0IsR0FBR2xFLEtBQUssQ0FBQzBELDBCQUFELENBQTdDO0FBQ0EsSUFBTVMsZ0NBQWdDLEdBQUduRSxLQUFLLENBQUMyRCwyQkFBRCxDQUE5QztBQUNBLElBQU1TLG1DQUFtQyxHQUFHcEUsS0FBSyxDQUFDNEQsOEJBQUQsQ0FBakQ7QUFDQSxJQUFNUyw4QkFBOEIsR0FBR3JFLEtBQUssQ0FBQzZELHlCQUFELENBQTVDO0FBQ0EsSUFBTVMsb0NBQW9DLEdBQUd0RSxLQUFLLENBQUM4RCwrQkFBRCxDQUFsRDtBQUNBLElBQU1TLGNBQWMsR0FBR3hFLE1BQU0sQ0FBQztBQUMxQnlFLEVBQUFBLFdBQVcsRUFBRTNFLFFBRGE7QUFFMUI0RSxFQUFBQSxpQkFBaUIsRUFBRVYsaUNBRk87QUFHMUJXLEVBQUFBLFFBQVEsRUFBRTdFLFFBSGdCO0FBSTFCOEUsRUFBQUEsY0FBYyxFQUFFWCxnQ0FKVTtBQUsxQlksRUFBQUEsY0FBYyxFQUFFL0UsUUFMVTtBQU0xQmdGLEVBQUFBLG9CQUFvQixFQUFFWixxQ0FOSTtBQU8xQmEsRUFBQUEsT0FBTyxFQUFFakYsUUFQaUI7QUFRMUJrRixFQUFBQSxhQUFhLEVBQUViLCtCQVJXO0FBUzFCdkMsRUFBQUEsUUFBUSxFQUFFOUIsUUFUZ0I7QUFVMUJtRixFQUFBQSxjQUFjLEVBQUViLGdDQVZVO0FBVzFCYyxFQUFBQSxhQUFhLEVBQUVwRixRQVhXO0FBWTFCcUYsRUFBQUEsbUJBQW1CLEVBQUVkLG1DQVpLO0FBYTFCZSxFQUFBQSxNQUFNLEVBQUV0RixRQWJrQjtBQWMxQnVGLEVBQUFBLFlBQVksRUFBRWYsOEJBZFk7QUFlMUJnQixFQUFBQSxhQUFhLEVBQUV4RixRQWZXO0FBZ0IxQnlGLEVBQUFBLG1CQUFtQixFQUFFaEI7QUFoQkssQ0FBRCxDQUE3QjtBQW1CQSxJQUFNaUIsNkJBQTZCLEdBQUd4RixNQUFNLENBQUM7QUFDekN5RixFQUFBQSxRQUFRLEVBQUU3RixNQUQrQjtBQUV6QzhGLEVBQUFBLFFBQVEsRUFBRTlGO0FBRitCLENBQUQsQ0FBNUM7QUFLQSxJQUFNK0YsV0FBVyxHQUFHMUYsS0FBSyxDQUFDTCxNQUFELENBQXpCO0FBQ0EsSUFBTWdHLGtCQUFrQixHQUFHNUYsTUFBTSxDQUFDO0FBQzlCNkYsRUFBQUEsWUFBWSxFQUFFakcsTUFEZ0I7QUFFOUJrRyxFQUFBQSxZQUFZLEVBQUVILFdBRmdCO0FBRzlCSSxFQUFBQSxZQUFZLEVBQUVQLDZCQUhnQjtBQUk5QlEsRUFBQUEsUUFBUSxFQUFFcEc7QUFKb0IsQ0FBRCxDQUFqQztBQU9BLElBQU1xRyxnQkFBZ0IsR0FBR2pHLE1BQU0sQ0FBQztBQUM1QixTQUFLSixNQUR1QjtBQUU1QjhGLEVBQUFBLFFBQVEsRUFBRTlGLE1BRmtCO0FBRzVCc0csRUFBQUEsU0FBUyxFQUFFdEcsTUFIaUI7QUFJNUJ1RyxFQUFBQSxHQUFHLEVBQUV2RyxNQUp1QjtBQUs1QjZGLEVBQUFBLFFBQVEsRUFBRTdGLE1BTGtCO0FBTTVCd0csRUFBQUEsU0FBUyxFQUFFeEc7QUFOaUIsQ0FBRCxDQUEvQjtBQVNBLElBQU15Ryw2Q0FBNkMsR0FBR3JHLE1BQU0sQ0FBQztBQUN6RCtCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRCtDO0FBRXpEb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGa0QsQ0FBRCxDQUE1RDtBQUtBLElBQU13Ryw0Q0FBNEMsR0FBR3RHLE1BQU0sQ0FBQztBQUN4RCtCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRDhDO0FBRXhEb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGaUQsQ0FBRCxDQUEzRDtBQUtBLElBQU15RyxrREFBa0QsR0FBR3RHLEtBQUssQ0FBQ29HLDZDQUFELENBQWhFO0FBQ0EsSUFBTUcsaURBQWlELEdBQUd2RyxLQUFLLENBQUNxRyw0Q0FBRCxDQUEvRDtBQUNBLElBQU1HLDJCQUEyQixHQUFHekcsTUFBTSxDQUFDO0FBQ3ZDTSxFQUFBQSxNQUFNLEVBQUVWLE1BRCtCO0FBRXZDOEcsRUFBQUEsWUFBWSxFQUFFOUcsTUFGeUI7QUFHdkMrRyxFQUFBQSxRQUFRLEVBQUU5RyxRQUg2QjtBQUl2Q1EsRUFBQUEsTUFBTSxFQUFFUixRQUorQjtBQUt2Q1UsRUFBQUEsU0FBUyxFQUFFWCxNQUw0QjtBQU12Q1ksRUFBQUEsU0FBUyxFQUFFWixNQU40QjtBQU92Q2dILEVBQUFBLFlBQVksRUFBRWhILE1BUHlCO0FBUXZDaUgsRUFBQUEsWUFBWSxFQUFFakgsTUFSeUI7QUFTdkNrSCxFQUFBQSxVQUFVLEVBQUVsSCxNQVQyQjtBQVV2Q21ILEVBQUFBLFVBQVUsRUFBRW5ILE1BVjJCO0FBV3ZDb0gsRUFBQUEsYUFBYSxFQUFFcEgsTUFYd0I7QUFZdkNxSCxFQUFBQSxLQUFLLEVBQUVySCxNQVpnQztBQWF2Q3NILEVBQUFBLG1CQUFtQixFQUFFdEgsTUFia0I7QUFjdkN1SCxFQUFBQSxvQkFBb0IsRUFBRXZILE1BZGlCO0FBZXZDd0gsRUFBQUEsZ0JBQWdCLEVBQUV4SCxNQWZxQjtBQWdCdkN5SCxFQUFBQSxTQUFTLEVBQUV6SCxNQWhCNEI7QUFpQnZDMEgsRUFBQUEsVUFBVSxFQUFFMUgsTUFqQjJCO0FBa0J2QzJILEVBQUFBLEtBQUssRUFBRTNILE1BbEJnQztBQW1CdkNpRixFQUFBQSxjQUFjLEVBQUUvRSxRQW5CdUI7QUFvQnZDZ0YsRUFBQUEsb0JBQW9CLEVBQUV5QixrREFwQmlCO0FBcUJ2Q2lCLEVBQUFBLGFBQWEsRUFBRTFILFFBckJ3QjtBQXNCdkMySCxFQUFBQSxtQkFBbUIsRUFBRWpCO0FBdEJrQixDQUFELENBQTFDO0FBeUJBLElBQU1rQixzQkFBc0IsR0FBRzFILE1BQU0sQ0FBQztBQUNsQzJILEVBQUFBLFlBQVksRUFBRS9ILE1BRG9CO0FBRWxDZ0ksRUFBQUEsS0FBSyxFQUFFaEksTUFGMkI7QUFHbENpSSxFQUFBQSxLQUFLLEVBQUVwQjtBQUgyQixDQUFELENBQXJDO0FBTUEsSUFBTXFCLDZCQUE2QixHQUFHOUgsTUFBTSxDQUFDO0FBQ3pDK0IsRUFBQUEsUUFBUSxFQUFFbkMsTUFEK0I7QUFFekNvQyxFQUFBQSxLQUFLLEVBQUVsQztBQUZrQyxDQUFELENBQTVDO0FBS0EsSUFBTWlJLCtCQUErQixHQUFHL0gsTUFBTSxDQUFDO0FBQzNDK0IsRUFBQUEsUUFBUSxFQUFFbkMsTUFEaUM7QUFFM0NvQyxFQUFBQSxLQUFLLEVBQUVsQztBQUZvQyxDQUFELENBQTlDO0FBS0EsSUFBTWtJLGtDQUFrQyxHQUFHL0gsS0FBSyxDQUFDNkgsNkJBQUQsQ0FBaEQ7QUFDQSxJQUFNRyxvQ0FBb0MsR0FBR2hJLEtBQUssQ0FBQzhILCtCQUFELENBQWxEO0FBQ0EsSUFBTUcsb0JBQW9CLEdBQUdsSSxNQUFNLENBQUM7QUFDaEMySCxFQUFBQSxZQUFZLEVBQUUvSCxNQURrQjtBQUVoQ2dJLEVBQUFBLEtBQUssRUFBRWhJLE1BRnlCO0FBR2hDdUksRUFBQUEsSUFBSSxFQUFFckksUUFIMEI7QUFJaENzSSxFQUFBQSxVQUFVLEVBQUVKLGtDQUpvQjtBQUtoQ0ssRUFBQUEsTUFBTSxFQUFFdkksUUFMd0I7QUFNaEN3SSxFQUFBQSxZQUFZLEVBQUVMO0FBTmtCLENBQUQsQ0FBbkM7QUFTQSxJQUFNTSwyQkFBMkIsR0FBR3RJLEtBQUssQ0FBQ3lILHNCQUFELENBQXpDO0FBQ0EsSUFBTWMseUJBQXlCLEdBQUd2SSxLQUFLLENBQUNpSSxvQkFBRCxDQUF2QztBQUNBLElBQU1PLFdBQVcsR0FBR3pJLE1BQU0sQ0FBQztBQUN2QjBJLEVBQUFBLFlBQVksRUFBRUgsMkJBRFM7QUFFdkJJLEVBQUFBLFVBQVUsRUFBRUgseUJBRlc7QUFHdkJJLEVBQUFBLGtCQUFrQixFQUFFOUg7QUFIRyxDQUFELENBQTFCO0FBTUEsSUFBTStILFVBQVUsR0FBRzVJLEtBQUssQ0FBQ2EsS0FBRCxDQUF4QjtBQUNBLElBQU1nSSxXQUFXLEdBQUc3SSxLQUFLLENBQUN5QixNQUFELENBQXpCO0FBQ0EsSUFBTXFILHVCQUF1QixHQUFHOUksS0FBSyxDQUFDMkYsa0JBQUQsQ0FBckM7QUFDQSxJQUFNb0QsS0FBSyxHQUFHaEosTUFBTSxDQUFDO0FBQ2pCbUMsRUFBQUEsRUFBRSxFQUFFdkMsTUFEYTtBQUVqQndDLEVBQUFBLE1BQU0sRUFBRXhDLE1BRlM7QUFHakJxSixFQUFBQSxTQUFTLEVBQUVySixNQUhNO0FBSWpCa0gsRUFBQUEsVUFBVSxFQUFFbEgsTUFKSztBQUtqQlUsRUFBQUEsTUFBTSxFQUFFVixNQUxTO0FBTWpCc0osRUFBQUEsV0FBVyxFQUFFdEosTUFOSTtBQU9qQnlILEVBQUFBLFNBQVMsRUFBRXpILE1BUE07QUFRakJ1SixFQUFBQSxrQkFBa0IsRUFBRXZKLE1BUkg7QUFTakJxSCxFQUFBQSxLQUFLLEVBQUVySCxNQVRVO0FBVWpCd0osRUFBQUEsVUFBVSxFQUFFaEosU0FWSztBQVdqQmlKLEVBQUFBLFFBQVEsRUFBRWpKLFNBWE87QUFZakJrSixFQUFBQSxZQUFZLEVBQUVsSixTQVpHO0FBYWpCbUosRUFBQUEsYUFBYSxFQUFFbkosU0FiRTtBQWNqQm9KLEVBQUFBLGlCQUFpQixFQUFFcEosU0FkRjtBQWVqQnFKLEVBQUFBLE9BQU8sRUFBRTdKLE1BZlE7QUFnQmpCOEosRUFBQUEsNkJBQTZCLEVBQUU5SixNQWhCZDtBQWlCakJnSCxFQUFBQSxZQUFZLEVBQUVoSCxNQWpCRztBQWtCakIrSixFQUFBQSxXQUFXLEVBQUUvSixNQWxCSTtBQW1CakJtSCxFQUFBQSxVQUFVLEVBQUVuSCxNQW5CSztBQW9CakJnSyxFQUFBQSxXQUFXLEVBQUVoSyxNQXBCSTtBQXFCakIrRyxFQUFBQSxRQUFRLEVBQUU5RyxRQXJCTztBQXNCakJRLEVBQUFBLE1BQU0sRUFBRVIsUUF0QlM7QUF1QmpCOEgsRUFBQUEsWUFBWSxFQUFFL0gsTUF2Qkc7QUF3QmpCZ0ksRUFBQUEsS0FBSyxFQUFFaEksTUF4QlU7QUF5QmpCd0gsRUFBQUEsZ0JBQWdCLEVBQUV4SCxNQXpCRDtBQTBCakJpSyxFQUFBQSxVQUFVLEVBQUVyRixjQTFCSztBQTJCakJzRixFQUFBQSxZQUFZLEVBQUVqQixVQTNCRztBQTRCakJrQixFQUFBQSxTQUFTLEVBQUVuSyxNQTVCTTtBQTZCakJvSyxFQUFBQSxhQUFhLEVBQUVsQixXQTdCRTtBQThCakJtQixFQUFBQSxjQUFjLEVBQUVsQix1QkE5QkM7QUErQmpCaEQsRUFBQUEsWUFBWSxFQUFFRSxnQkEvQkc7QUFnQ2pCaUUsRUFBQUEsTUFBTSxFQUFFekI7QUFoQ1MsQ0FBRCxFQWlDakIsSUFqQ2lCLENBQXBCO0FBbUNBLElBQU0wQixtQkFBbUIsR0FBR25LLE1BQU0sQ0FBQztBQUMvQitCLEVBQUFBLFFBQVEsRUFBRW5DLE1BRHFCO0FBRS9Cb0MsRUFBQUEsS0FBSyxFQUFFbEM7QUFGd0IsQ0FBRCxDQUFsQztBQUtBLElBQU1zSyx3QkFBd0IsR0FBR25LLEtBQUssQ0FBQ2tLLG1CQUFELENBQXRDO0FBQ0EsSUFBTUUsT0FBTyxHQUFHckssTUFBTSxDQUFDO0FBQ25CbUMsRUFBQUEsRUFBRSxFQUFFdkMsTUFEZTtBQUVuQjBLLEVBQUFBLFFBQVEsRUFBRTFLLE1BRlM7QUFHbkIySyxFQUFBQSxTQUFTLEVBQUUzSyxNQUhRO0FBSW5CNEssRUFBQUEsV0FBVyxFQUFFMUssUUFKTTtBQUtuQjJLLEVBQUFBLGFBQWEsRUFBRTVLLFFBTEk7QUFNbkI2SyxFQUFBQSxPQUFPLEVBQUU1SyxRQU5VO0FBT25CNkssRUFBQUEsYUFBYSxFQUFFUCx3QkFQSTtBQVFuQjdILEVBQUFBLFdBQVcsRUFBRTNDLE1BUk07QUFTbkI0QyxFQUFBQSxJQUFJLEVBQUU1QyxNQVRhO0FBVW5CNkMsRUFBQUEsSUFBSSxFQUFFN0MsTUFWYTtBQVduQjhDLEVBQUFBLElBQUksRUFBRTlDLE1BWGE7QUFZbkIrQyxFQUFBQSxJQUFJLEVBQUUvQyxNQVphO0FBYW5CZ0QsRUFBQUEsT0FBTyxFQUFFaEQsTUFiVTtBQWNuQjBELEVBQUFBLEtBQUssRUFBRTFELE1BZFk7QUFlbkIyRCxFQUFBQSxHQUFHLEVBQUUzRDtBQWZjLENBQUQsRUFnQm5CLElBaEJtQixDQUF0QjtBQWtCQSxJQUFNZ0wseUJBQXlCLEdBQUc1SyxNQUFNLENBQUM7QUFDckMrQixFQUFBQSxRQUFRLEVBQUVuQyxNQUQyQjtBQUVyQ29DLEVBQUFBLEtBQUssRUFBRWxDO0FBRjhCLENBQUQsQ0FBeEM7QUFLQSxJQUFNK0ssa0JBQWtCLEdBQUc3SyxNQUFNLENBQUM7QUFDOUI4SyxFQUFBQSxzQkFBc0IsRUFBRWhMLFFBRE07QUFFOUJpTCxFQUFBQSxnQkFBZ0IsRUFBRWpMLFFBRlk7QUFHOUJrTCxFQUFBQSxhQUFhLEVBQUVwTDtBQUhlLENBQUQsQ0FBakM7QUFNQSxJQUFNcUwsNEJBQTRCLEdBQUdqTCxNQUFNLENBQUM7QUFDeEMrQixFQUFBQSxRQUFRLEVBQUVuQyxNQUQ4QjtBQUV4Q29DLEVBQUFBLEtBQUssRUFBRWxDO0FBRmlDLENBQUQsQ0FBM0M7QUFLQSxJQUFNb0wsaUNBQWlDLEdBQUdqTCxLQUFLLENBQUNnTCw0QkFBRCxDQUEvQztBQUNBLElBQU1FLGlCQUFpQixHQUFHbkwsTUFBTSxDQUFDO0FBQzdCb0wsRUFBQUEsa0JBQWtCLEVBQUV0TCxRQURTO0FBRTdCdUwsRUFBQUEsTUFBTSxFQUFFdkwsUUFGcUI7QUFHN0J3TCxFQUFBQSxZQUFZLEVBQUVKO0FBSGUsQ0FBRCxDQUFoQztBQU1BLElBQU1LLGtCQUFrQixHQUFHdkwsTUFBTSxDQUFDO0FBQzlCd0wsRUFBQUEsWUFBWSxFQUFFNUwsTUFEZ0I7QUFFOUI2TCxFQUFBQSxjQUFjLEVBQUU3TCxNQUZjO0FBRzlCOEwsRUFBQUEsT0FBTyxFQUFFOUwsTUFIcUI7QUFJOUIrTCxFQUFBQSxjQUFjLEVBQUUvTCxNQUpjO0FBSzlCZ00sRUFBQUEsaUJBQWlCLEVBQUVoTSxNQUxXO0FBTTlCaU0sRUFBQUEsUUFBUSxFQUFFL0wsUUFOb0I7QUFPOUJnTSxFQUFBQSxRQUFRLEVBQUVqTSxRQVBvQjtBQVE5QmtNLEVBQUFBLFNBQVMsRUFBRWxNLFFBUm1CO0FBUzlCbU0sRUFBQUEsVUFBVSxFQUFFcE0sTUFUa0I7QUFVOUJxTSxFQUFBQSxJQUFJLEVBQUVyTSxNQVZ3QjtBQVc5QnNNLEVBQUFBLFNBQVMsRUFBRXRNLE1BWG1CO0FBWTlCdU0sRUFBQUEsUUFBUSxFQUFFdk0sTUFab0I7QUFhOUJ3TSxFQUFBQSxRQUFRLEVBQUV4TSxNQWJvQjtBQWM5QnlNLEVBQUFBLGtCQUFrQixFQUFFek0sTUFkVTtBQWU5QjBNLEVBQUFBLG1CQUFtQixFQUFFMU07QUFmUyxDQUFELENBQWpDO0FBa0JBLElBQU0yTSxpQkFBaUIsR0FBR3ZNLE1BQU0sQ0FBQztBQUM3QjBMLEVBQUFBLE9BQU8sRUFBRTlMLE1BRG9CO0FBRTdCNE0sRUFBQUEsS0FBSyxFQUFFNU0sTUFGc0I7QUFHN0I2TSxFQUFBQSxRQUFRLEVBQUU3TSxNQUhtQjtBQUk3Qm9MLEVBQUFBLGFBQWEsRUFBRXBMLE1BSmM7QUFLN0I4TSxFQUFBQSxjQUFjLEVBQUU1TSxRQUxhO0FBTTdCNk0sRUFBQUEsaUJBQWlCLEVBQUU3TSxRQU5VO0FBTzdCOE0sRUFBQUEsV0FBVyxFQUFFaE4sTUFQZ0I7QUFRN0JpTixFQUFBQSxVQUFVLEVBQUVqTixNQVJpQjtBQVM3QmtOLEVBQUFBLFdBQVcsRUFBRWxOLE1BVGdCO0FBVTdCbU4sRUFBQUEsWUFBWSxFQUFFbk4sTUFWZTtBQVc3Qm9OLEVBQUFBLGVBQWUsRUFBRXBOLE1BWFk7QUFZN0JxTixFQUFBQSxZQUFZLEVBQUVyTixNQVplO0FBYTdCc04sRUFBQUEsZ0JBQWdCLEVBQUV0TixNQWJXO0FBYzdCdU4sRUFBQUEsb0JBQW9CLEVBQUV2TixNQWRPO0FBZTdCd04sRUFBQUEsbUJBQW1CLEVBQUV4TjtBQWZRLENBQUQsQ0FBaEM7QUFrQkEsSUFBTXlOLGlCQUFpQixHQUFHck4sTUFBTSxDQUFDO0FBQzdCc04sRUFBQUEsV0FBVyxFQUFFMU4sTUFEZ0I7QUFFN0IyTixFQUFBQSxjQUFjLEVBQUUzTixNQUZhO0FBRzdCNE4sRUFBQUEsYUFBYSxFQUFFNU4sTUFIYztBQUk3QjZOLEVBQUFBLFlBQVksRUFBRTNOLFFBSmU7QUFLN0I0TixFQUFBQSxRQUFRLEVBQUU1TixRQUxtQjtBQU03QjZOLEVBQUFBLFFBQVEsRUFBRTdOO0FBTm1CLENBQUQsQ0FBaEM7QUFTQSxJQUFNOE4sb0JBQW9CLEdBQUc1TixNQUFNLENBQUM7QUFDaEM2TixFQUFBQSxpQkFBaUIsRUFBRWpPLE1BRGE7QUFFaENrTyxFQUFBQSxlQUFlLEVBQUVsTyxNQUZlO0FBR2hDbU8sRUFBQUEsU0FBUyxFQUFFbk8sTUFIcUI7QUFJaENvTyxFQUFBQSxZQUFZLEVBQUVwTztBQUprQixDQUFELENBQW5DO0FBT0EsSUFBTXFPLFlBQVksR0FBR2hPLEtBQUssQ0FBQ2lDLE9BQUQsQ0FBMUI7QUFDQSxJQUFNZ00sOEJBQThCLEdBQUdqTyxLQUFLLENBQUMySyx5QkFBRCxDQUE1QztBQUNBLElBQU11RCxXQUFXLEdBQUduTyxNQUFNLENBQUM7QUFDdkJtQyxFQUFBQSxFQUFFLEVBQUV2QyxNQURtQjtBQUV2QndPLEVBQUFBLE9BQU8sRUFBRXhPLE1BRmM7QUFHdkJ3QyxFQUFBQSxNQUFNLEVBQUV4QyxNQUhlO0FBSXZCeUMsRUFBQUEsUUFBUSxFQUFFekMsTUFKYTtBQUt2QmlHLEVBQUFBLFlBQVksRUFBRWpHLE1BTFM7QUFNdkJ5TyxFQUFBQSxFQUFFLEVBQUV4TyxRQU5tQjtBQU92QnlPLEVBQUFBLGVBQWUsRUFBRTFPLE1BUE07QUFRdkIyTyxFQUFBQSxhQUFhLEVBQUUxTyxRQVJRO0FBU3ZCMk8sRUFBQUEsR0FBRyxFQUFFNU8sTUFUa0I7QUFVdkI2TyxFQUFBQSxVQUFVLEVBQUU3TyxNQVZXO0FBV3ZCOE8sRUFBQUEsV0FBVyxFQUFFOU8sTUFYVTtBQVl2QitPLEVBQUFBLFVBQVUsRUFBRS9PLE1BWlc7QUFhdkJ3QixFQUFBQSxNQUFNLEVBQUV4QixNQWJlO0FBY3ZCZ1AsRUFBQUEsVUFBVSxFQUFFMU8sSUFBSSxDQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCZ0MsT0FBdkIsQ0FkTztBQWV2QjJNLEVBQUFBLFFBQVEsRUFBRWxKLFdBZmE7QUFnQnZCbUosRUFBQUEsWUFBWSxFQUFFM08sU0FBUyxDQUFDLFVBQUQsRUFBYSxVQUFiLEVBQXlCK0IsT0FBekIsQ0FoQkE7QUFpQnZCNk0sRUFBQUEsVUFBVSxFQUFFalAsUUFqQlc7QUFrQnZCa1AsRUFBQUEsZ0JBQWdCLEVBQUVkLDhCQWxCSztBQW1CdkJ6SSxFQUFBQSxRQUFRLEVBQUU3RixNQW5CYTtBQW9CdkI4RixFQUFBQSxRQUFRLEVBQUU5RixNQXBCYTtBQXFCdkJxUCxFQUFBQSxZQUFZLEVBQUVyUCxNQXJCUztBQXNCdkJzUCxFQUFBQSxPQUFPLEVBQUVyRSxrQkF0QmM7QUF1QnZCUSxFQUFBQSxNQUFNLEVBQUVGLGlCQXZCZTtBQXdCdkJnRSxFQUFBQSxPQUFPLEVBQUU1RCxrQkF4QmM7QUF5QnZCNkQsRUFBQUEsTUFBTSxFQUFFN0MsaUJBekJlO0FBMEJ2QnBKLEVBQUFBLE1BQU0sRUFBRWtLLGlCQTFCZTtBQTJCdkJnQyxFQUFBQSxPQUFPLEVBQUV6UCxNQTNCYztBQTRCdkIwUCxFQUFBQSxTQUFTLEVBQUUxUCxNQTVCWTtBQTZCdkIyUCxFQUFBQSxFQUFFLEVBQUUzUCxNQTdCbUI7QUE4QnZCNFAsRUFBQUEsVUFBVSxFQUFFNUIsb0JBOUJXO0FBK0J2QjZCLEVBQUFBLG1CQUFtQixFQUFFN1AsTUEvQkU7QUFnQ3ZCOFAsRUFBQUEsU0FBUyxFQUFFOVAsTUFoQ1k7QUFpQ3ZCMEQsRUFBQUEsS0FBSyxFQUFFMUQsTUFqQ2dCO0FBa0N2QjJELEVBQUFBLEdBQUcsRUFBRTNEO0FBbENrQixDQUFELEVBbUN2QixJQW5DdUIsQ0FBMUI7O0FBcUNBLFNBQVMrUCxlQUFULENBQXlCQyxFQUF6QixFQUE2QjtBQUN6QixTQUFPO0FBQ0h4UCxJQUFBQSxTQUFTLEVBQUU7QUFDUEMsTUFBQUEsTUFETyxrQkFDQXdQLE1BREEsRUFDUTtBQUNYLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDeFAsTUFBWCxDQUFyQjtBQUNIO0FBSE0sS0FEUjtBQU1ISSxJQUFBQSxXQUFXLEVBQUU7QUFDVEksTUFBQUEsaUJBRFMsNkJBQ1NnUCxNQURULEVBQ2lCO0FBQ3RCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDaFAsaUJBQVgsQ0FBckI7QUFDSDtBQUhRLEtBTlY7QUFXSEMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hJLE1BQUFBLE9BREcsbUJBQ0syTyxNQURMLEVBQ2E7QUFDWixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzNPLE9BQVgsQ0FBckI7QUFDSCxPQUhFO0FBSUhHLE1BQUFBLE9BSkcsbUJBSUt3TyxNQUpMLEVBSWE7QUFDWixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ3hPLE9BQVgsQ0FBckI7QUFDSCxPQU5FO0FBT0hFLE1BQUFBLFdBUEcsdUJBT1NzTyxNQVBULEVBT2lCO0FBQ2hCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDdE8sV0FBWCxDQUFyQjtBQUNILE9BVEU7QUFVSEMsTUFBQUEsY0FWRywwQkFVWXFPLE1BVlosRUFVb0I7QUFDbkIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNyTyxjQUFYLENBQXJCO0FBQ0g7QUFaRSxLQVhKO0FBeUJIRSxJQUFBQSxNQUFNLEVBQUU7QUFDSkcsTUFBQUEsZUFESSwyQkFDWWdPLE1BRFosRUFDb0I7QUFDcEIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNoTyxlQUFYLENBQXJCO0FBQ0g7QUFIRyxLQXpCTDtBQThCSEMsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkUsTUFBQUEsS0FEZSxpQkFDVDZOLE1BRFMsRUFDRDtBQUNWLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDN04sS0FBWCxDQUFyQjtBQUNIO0FBSGMsS0E5QmhCO0FBbUNIRSxJQUFBQSxPQUFPLEVBQUU7QUFDTEMsTUFBQUEsRUFESyxjQUNGME4sTUFERSxFQUNNO0FBQ1AsZUFBT0EsTUFBTSxDQUFDQyxJQUFkO0FBQ0gsT0FISTtBQUlML00sTUFBQUEsVUFKSyxzQkFJTThNLE1BSk4sRUFJYztBQUNmLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDOU0sVUFBWCxDQUFyQjtBQUNILE9BTkk7QUFPTDdCLE1BQUFBLE9BUEssbUJBT0cyTyxNQVBILEVBT1c7QUFDWixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzNPLE9BQVgsQ0FBckI7QUFDSCxPQVRJO0FBVUxHLE1BQUFBLE9BVkssbUJBVUd3TyxNQVZILEVBVVc7QUFDWixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ3hPLE9BQVgsQ0FBckI7QUFDSCxPQVpJO0FBYUw2QixNQUFBQSxVQWJLLHNCQWFNMk0sTUFiTixFQWFjO0FBQ2YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUMzTSxVQUFYLENBQXJCO0FBQ0gsT0FmSTtBQWdCTGxCLE1BQUFBLEtBaEJLLGlCQWdCQzZOLE1BaEJELEVBZ0JTO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFsQkksS0FuQ047QUF1REh3QixJQUFBQSw0QkFBNEIsRUFBRTtBQUMxQnhCLE1BQUFBLEtBRDBCLGlCQUNwQjZOLE1BRG9CLEVBQ1o7QUFDVixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzdOLEtBQVgsQ0FBckI7QUFDSDtBQUh5QixLQXZEM0I7QUE0REh5QixJQUFBQSwyQkFBMkIsRUFBRTtBQUN6QnpCLE1BQUFBLEtBRHlCLGlCQUNuQjZOLE1BRG1CLEVBQ1g7QUFDVixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzdOLEtBQVgsQ0FBckI7QUFDSDtBQUh3QixLQTVEMUI7QUFpRUgwQixJQUFBQSxnQ0FBZ0MsRUFBRTtBQUM5QjFCLE1BQUFBLEtBRDhCLGlCQUN4QjZOLE1BRHdCLEVBQ2hCO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFINkIsS0FqRS9CO0FBc0VIMkIsSUFBQUEsMEJBQTBCLEVBQUU7QUFDeEIzQixNQUFBQSxLQUR3QixpQkFDbEI2TixNQURrQixFQUNWO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFIdUIsS0F0RXpCO0FBMkVINEIsSUFBQUEsMkJBQTJCLEVBQUU7QUFDekI1QixNQUFBQSxLQUR5QixpQkFDbkI2TixNQURtQixFQUNYO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFId0IsS0EzRTFCO0FBZ0ZINkIsSUFBQUEsOEJBQThCLEVBQUU7QUFDNUI3QixNQUFBQSxLQUQ0QixpQkFDdEI2TixNQURzQixFQUNkO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFIMkIsS0FoRjdCO0FBcUZIOEIsSUFBQUEseUJBQXlCLEVBQUU7QUFDdkI5QixNQUFBQSxLQUR1QixpQkFDakI2TixNQURpQixFQUNUO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFIc0IsS0FyRnhCO0FBMEZIK0IsSUFBQUEsK0JBQStCLEVBQUU7QUFDN0IvQixNQUFBQSxLQUQ2QixpQkFDdkI2TixNQUR1QixFQUNmO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFINEIsS0ExRjlCO0FBK0ZId0MsSUFBQUEsY0FBYyxFQUFFO0FBQ1pDLE1BQUFBLFdBRFksdUJBQ0FvTCxNQURBLEVBQ1E7QUFDaEIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNwTCxXQUFYLENBQXJCO0FBQ0gsT0FIVztBQUlaRSxNQUFBQSxRQUpZLG9CQUlIa0wsTUFKRyxFQUlLO0FBQ2IsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNsTCxRQUFYLENBQXJCO0FBQ0gsT0FOVztBQU9aRSxNQUFBQSxjQVBZLDBCQU9HZ0wsTUFQSCxFQU9XO0FBQ25CLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDaEwsY0FBWCxDQUFyQjtBQUNILE9BVFc7QUFVWkUsTUFBQUEsT0FWWSxtQkFVSjhLLE1BVkksRUFVSTtBQUNaLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDOUssT0FBWCxDQUFyQjtBQUNILE9BWlc7QUFhWm5ELE1BQUFBLFFBYlksb0JBYUhpTyxNQWJHLEVBYUs7QUFDYixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ2pPLFFBQVgsQ0FBckI7QUFDSCxPQWZXO0FBZ0Jac0QsTUFBQUEsYUFoQlkseUJBZ0JFMkssTUFoQkYsRUFnQlU7QUFDbEIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUMzSyxhQUFYLENBQXJCO0FBQ0gsT0FsQlc7QUFtQlpFLE1BQUFBLE1BbkJZLGtCQW1CTHlLLE1BbkJLLEVBbUJHO0FBQ1gsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN6SyxNQUFYLENBQXJCO0FBQ0gsT0FyQlc7QUFzQlpFLE1BQUFBLGFBdEJZLHlCQXNCRXVLLE1BdEJGLEVBc0JVO0FBQ2xCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDdkssYUFBWCxDQUFyQjtBQUNIO0FBeEJXLEtBL0ZiO0FBeUhIZSxJQUFBQSw2Q0FBNkMsRUFBRTtBQUMzQ3JFLE1BQUFBLEtBRDJDLGlCQUNyQzZOLE1BRHFDLEVBQzdCO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFIMEMsS0F6SDVDO0FBOEhIc0UsSUFBQUEsNENBQTRDLEVBQUU7QUFDMUN0RSxNQUFBQSxLQUQwQyxpQkFDcEM2TixNQURvQyxFQUM1QjtBQUNWLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDN04sS0FBWCxDQUFyQjtBQUNIO0FBSHlDLEtBOUgzQztBQW1JSHlFLElBQUFBLDJCQUEyQixFQUFFO0FBQ3pCRSxNQUFBQSxRQUR5QixvQkFDaEJrSixNQURnQixFQUNSO0FBQ2IsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNsSixRQUFYLENBQXJCO0FBQ0gsT0FId0I7QUFJekJ0RyxNQUFBQSxNQUp5QixrQkFJbEJ3UCxNQUprQixFQUlWO0FBQ1gsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN4UCxNQUFYLENBQXJCO0FBQ0gsT0FOd0I7QUFPekJ3RSxNQUFBQSxjQVB5QiwwQkFPVmdMLE1BUFUsRUFPRjtBQUNuQixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ2hMLGNBQVgsQ0FBckI7QUFDSCxPQVR3QjtBQVV6QjJDLE1BQUFBLGFBVnlCLHlCQVVYcUksTUFWVyxFQVVIO0FBQ2xCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDckksYUFBWCxDQUFyQjtBQUNIO0FBWndCLEtBbkkxQjtBQWlKSE0sSUFBQUEsNkJBQTZCLEVBQUU7QUFDM0I5RixNQUFBQSxLQUQyQixpQkFDckI2TixNQURxQixFQUNiO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFIMEIsS0FqSjVCO0FBc0pIK0YsSUFBQUEsK0JBQStCLEVBQUU7QUFDN0IvRixNQUFBQSxLQUQ2QixpQkFDdkI2TixNQUR1QixFQUNmO0FBQ1YsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM3TixLQUFYLENBQXJCO0FBQ0g7QUFINEIsS0F0SjlCO0FBMkpIa0csSUFBQUEsb0JBQW9CLEVBQUU7QUFDbEJDLE1BQUFBLElBRGtCLGdCQUNiMEgsTUFEYSxFQUNMO0FBQ1QsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUMxSCxJQUFYLENBQXJCO0FBQ0gsT0FIaUI7QUFJbEJFLE1BQUFBLE1BSmtCLGtCQUlYd0gsTUFKVyxFQUlIO0FBQ1gsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN4SCxNQUFYLENBQXJCO0FBQ0g7QUFOaUIsS0EzSm5CO0FBbUtIVyxJQUFBQSxLQUFLLEVBQUU7QUFDSDdHLE1BQUFBLEVBREcsY0FDQTBOLE1BREEsRUFDUTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEU7QUFJSG5KLE1BQUFBLFFBSkcsb0JBSU1rSixNQUpOLEVBSWM7QUFDYixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ2xKLFFBQVgsQ0FBckI7QUFDSCxPQU5FO0FBT0h0RyxNQUFBQSxNQVBHLGtCQU9Jd1AsTUFQSixFQU9ZO0FBQ1gsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN4UCxNQUFYLENBQXJCO0FBQ0g7QUFURSxLQW5LSjtBQThLSDhKLElBQUFBLG1CQUFtQixFQUFFO0FBQ2pCbkksTUFBQUEsS0FEaUIsaUJBQ1g2TixNQURXLEVBQ0g7QUFDVixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzdOLEtBQVgsQ0FBckI7QUFDSDtBQUhnQixLQTlLbEI7QUFtTEhxSSxJQUFBQSxPQUFPLEVBQUU7QUFDTGxJLE1BQUFBLEVBREssY0FDRjBOLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ0MsSUFBZDtBQUNILE9BSEk7QUFJTHRGLE1BQUFBLFdBSkssdUJBSU9xRixNQUpQLEVBSWU7QUFDaEIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUNyRixXQUFYLENBQXJCO0FBQ0gsT0FOSTtBQU9MQyxNQUFBQSxhQVBLLHlCQU9Tb0YsTUFQVCxFQU9pQjtBQUNsQixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ3BGLGFBQVgsQ0FBckI7QUFDSCxPQVRJO0FBVUxDLE1BQUFBLE9BVkssbUJBVUdtRixNQVZILEVBVVc7QUFDWixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ25GLE9BQVgsQ0FBckI7QUFDSDtBQVpJLEtBbkxOO0FBaU1IRSxJQUFBQSx5QkFBeUIsRUFBRTtBQUN2QjVJLE1BQUFBLEtBRHVCLGlCQUNqQjZOLE1BRGlCLEVBQ1Q7QUFDVixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzdOLEtBQVgsQ0FBckI7QUFDSDtBQUhzQixLQWpNeEI7QUFzTUg2SSxJQUFBQSxrQkFBa0IsRUFBRTtBQUNoQkMsTUFBQUEsc0JBRGdCLGtDQUNPK0UsTUFEUCxFQUNlO0FBQzNCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDL0Usc0JBQVgsQ0FBckI7QUFDSCxPQUhlO0FBSWhCQyxNQUFBQSxnQkFKZ0IsNEJBSUM4RSxNQUpELEVBSVM7QUFDckIsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUM5RSxnQkFBWCxDQUFyQjtBQUNIO0FBTmUsS0F0TWpCO0FBOE1IRSxJQUFBQSw0QkFBNEIsRUFBRTtBQUMxQmpKLE1BQUFBLEtBRDBCLGlCQUNwQjZOLE1BRG9CLEVBQ1o7QUFDVixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzdOLEtBQVgsQ0FBckI7QUFDSDtBQUh5QixLQTlNM0I7QUFtTkhtSixJQUFBQSxpQkFBaUIsRUFBRTtBQUNmQyxNQUFBQSxrQkFEZSw4QkFDSXlFLE1BREosRUFDWTtBQUN2QixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ3pFLGtCQUFYLENBQXJCO0FBQ0gsT0FIYztBQUlmQyxNQUFBQSxNQUplLGtCQUlSd0UsTUFKUSxFQUlBO0FBQ1gsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN4RSxNQUFYLENBQXJCO0FBQ0g7QUFOYyxLQW5OaEI7QUEyTkhFLElBQUFBLGtCQUFrQixFQUFFO0FBQ2hCTSxNQUFBQSxRQURnQixvQkFDUGdFLE1BRE8sRUFDQztBQUNiLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDaEUsUUFBWCxDQUFyQjtBQUNILE9BSGU7QUFJaEJDLE1BQUFBLFFBSmdCLG9CQUlQK0QsTUFKTyxFQUlDO0FBQ2IsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUMvRCxRQUFYLENBQXJCO0FBQ0gsT0FOZTtBQU9oQkMsTUFBQUEsU0FQZ0IscUJBT044RCxNQVBNLEVBT0U7QUFDZCxlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQzlELFNBQVgsQ0FBckI7QUFDSDtBQVRlLEtBM05qQjtBQXNPSFEsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkcsTUFBQUEsY0FEZSwwQkFDQW1ELE1BREEsRUFDUTtBQUNuQixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ25ELGNBQVgsQ0FBckI7QUFDSCxPQUhjO0FBSWZDLE1BQUFBLGlCQUplLDZCQUlHa0QsTUFKSCxFQUlXO0FBQ3RCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDbEQsaUJBQVgsQ0FBckI7QUFDSDtBQU5jLEtBdE9oQjtBQThPSFUsSUFBQUEsaUJBQWlCLEVBQUU7QUFDZkksTUFBQUEsWUFEZSx3QkFDRm9DLE1BREUsRUFDTTtBQUNqQixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ3BDLFlBQVgsQ0FBckI7QUFDSCxPQUhjO0FBSWZDLE1BQUFBLFFBSmUsb0JBSU5tQyxNQUpNLEVBSUU7QUFDYixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ25DLFFBQVgsQ0FBckI7QUFDSCxPQU5jO0FBT2ZDLE1BQUFBLFFBUGUsb0JBT05rQyxNQVBNLEVBT0U7QUFDYixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ2xDLFFBQVgsQ0FBckI7QUFDSDtBQVRjLEtBOU9oQjtBQXlQSFEsSUFBQUEsV0FBVyxFQUFFO0FBQ1RoTSxNQUFBQSxFQURTLGNBQ04wTixNQURNLEVBQ0U7QUFDUCxlQUFPQSxNQUFNLENBQUNDLElBQWQ7QUFDSCxPQUhRO0FBSVRsQixNQUFBQSxVQUpTLHNCQUlFaUIsTUFKRixFQUlVO0FBQ2YsZUFBT0QsRUFBRSxDQUFDRyxhQUFILENBQWlCSCxFQUFFLENBQUNJLFFBQXBCLEVBQThCSCxNQUFNLENBQUN6TyxNQUFyQyxDQUFQO0FBQ0gsT0FOUTtBQU9UME4sTUFBQUEsWUFQUyx3QkFPSWUsTUFQSixFQU9ZO0FBQ2pCLGVBQU9ELEVBQUUsQ0FBQ0ssZUFBSCxDQUFtQkwsRUFBRSxDQUFDSSxRQUF0QixFQUFnQ0gsTUFBTSxDQUFDaEIsUUFBdkMsQ0FBUDtBQUNILE9BVFE7QUFVVFIsTUFBQUEsRUFWUyxjQVVOd0IsTUFWTSxFQVVFO0FBQ1AsZUFBTzlQLGNBQWMsQ0FBQyxDQUFELEVBQUk4UCxNQUFNLENBQUN4QixFQUFYLENBQXJCO0FBQ0gsT0FaUTtBQWFURSxNQUFBQSxhQWJTLHlCQWFLc0IsTUFiTCxFQWFhO0FBQ2xCLGVBQU85UCxjQUFjLENBQUMsQ0FBRCxFQUFJOFAsTUFBTSxDQUFDdEIsYUFBWCxDQUFyQjtBQUNILE9BZlE7QUFnQlRRLE1BQUFBLFVBaEJTLHNCQWdCRWMsTUFoQkYsRUFnQlU7QUFDZixlQUFPOVAsY0FBYyxDQUFDLENBQUQsRUFBSThQLE1BQU0sQ0FBQ2QsVUFBWCxDQUFyQjtBQUNIO0FBbEJRLEtBelBWO0FBNlFIbUIsSUFBQUEsS0FBSyxFQUFFO0FBQ0hGLE1BQUFBLFFBQVEsRUFBRUosRUFBRSxDQUFDTyxlQUFILENBQW1CUCxFQUFFLENBQUNJLFFBQXRCLEVBQWdDOU4sT0FBaEMsQ0FEUDtBQUVIa08sTUFBQUEsTUFBTSxFQUFFUixFQUFFLENBQUNPLGVBQUgsQ0FBbUJQLEVBQUUsQ0FBQ1EsTUFBdEIsRUFBOEJwSCxLQUE5QixDQUZMO0FBR0hxSCxNQUFBQSxRQUFRLEVBQUVULEVBQUUsQ0FBQ08sZUFBSCxDQUFtQlAsRUFBRSxDQUFDUyxRQUF0QixFQUFnQ2hHLE9BQWhDLENBSFA7QUFJSHZFLE1BQUFBLFlBQVksRUFBRThKLEVBQUUsQ0FBQ08sZUFBSCxDQUFtQlAsRUFBRSxDQUFDOUosWUFBdEIsRUFBb0NxSSxXQUFwQztBQUpYLEtBN1FKO0FBbVJIbUMsSUFBQUEsWUFBWSxFQUFFO0FBQ1ZOLE1BQUFBLFFBQVEsRUFBRUosRUFBRSxDQUFDVyxzQkFBSCxDQUEwQlgsRUFBRSxDQUFDSSxRQUE3QixFQUF1QzlOLE9BQXZDLENBREE7QUFFVmtPLE1BQUFBLE1BQU0sRUFBRVIsRUFBRSxDQUFDVyxzQkFBSCxDQUEwQlgsRUFBRSxDQUFDUSxNQUE3QixFQUFxQ3BILEtBQXJDLENBRkU7QUFHVnFILE1BQUFBLFFBQVEsRUFBRVQsRUFBRSxDQUFDVyxzQkFBSCxDQUEwQlgsRUFBRSxDQUFDUyxRQUE3QixFQUF1Q2hHLE9BQXZDLENBSEE7QUFJVnZFLE1BQUFBLFlBQVksRUFBRThKLEVBQUUsQ0FBQ1csc0JBQUgsQ0FBMEJYLEVBQUUsQ0FBQzlKLFlBQTdCLEVBQTJDcUksV0FBM0M7QUFKSjtBQW5SWCxHQUFQO0FBMFJIOztBQUNEcUMsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JkLEVBQUFBLGVBQWUsRUFBZkEsZUFEYTtBQUVidlAsRUFBQUEsU0FBUyxFQUFUQSxTQUZhO0FBR2JLLEVBQUFBLFdBQVcsRUFBWEEsV0FIYTtBQUliSyxFQUFBQSxLQUFLLEVBQUxBLEtBSmE7QUFLYlksRUFBQUEsTUFBTSxFQUFOQSxNQUxhO0FBTWJJLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBTmE7QUFPYkksRUFBQUEsT0FBTyxFQUFQQSxPQVBhO0FBUWJzQixFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQVJhO0FBU2JDLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBVGE7QUFVYkMsRUFBQUEsZ0NBQWdDLEVBQWhDQSxnQ0FWYTtBQVdiQyxFQUFBQSwwQkFBMEIsRUFBMUJBLDBCQVhhO0FBWWJDLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBWmE7QUFhYkMsRUFBQUEsOEJBQThCLEVBQTlCQSw4QkFiYTtBQWNiQyxFQUFBQSx5QkFBeUIsRUFBekJBLHlCQWRhO0FBZWJDLEVBQUFBLCtCQUErQixFQUEvQkEsK0JBZmE7QUFnQmJTLEVBQUFBLGNBQWMsRUFBZEEsY0FoQmE7QUFpQmJnQixFQUFBQSw2QkFBNkIsRUFBN0JBLDZCQWpCYTtBQWtCYkksRUFBQUEsa0JBQWtCLEVBQWxCQSxrQkFsQmE7QUFtQmJLLEVBQUFBLGdCQUFnQixFQUFoQkEsZ0JBbkJhO0FBb0JiSSxFQUFBQSw2Q0FBNkMsRUFBN0NBLDZDQXBCYTtBQXFCYkMsRUFBQUEsNENBQTRDLEVBQTVDQSw0Q0FyQmE7QUFzQmJHLEVBQUFBLDJCQUEyQixFQUEzQkEsMkJBdEJhO0FBdUJiaUIsRUFBQUEsc0JBQXNCLEVBQXRCQSxzQkF2QmE7QUF3QmJJLEVBQUFBLDZCQUE2QixFQUE3QkEsNkJBeEJhO0FBeUJiQyxFQUFBQSwrQkFBK0IsRUFBL0JBLCtCQXpCYTtBQTBCYkcsRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkExQmE7QUEyQmJPLEVBQUFBLFdBQVcsRUFBWEEsV0EzQmE7QUE0QmJPLEVBQUFBLEtBQUssRUFBTEEsS0E1QmE7QUE2QmJtQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQTdCYTtBQThCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQTlCYTtBQStCYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkEvQmE7QUFnQ2JDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBaENhO0FBaUNiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWpDYTtBQWtDYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFsQ2E7QUFtQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBbkNhO0FBb0NiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFwQ2E7QUFxQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBckNhO0FBc0NiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXRDYTtBQXVDYk8sRUFBQUEsV0FBVyxFQUFYQTtBQXZDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGlocl9mZWU6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWU6IGJpZ1VJbnQyLFxuICAgIGltcG9ydF9mZWU6IGJpZ1VJbnQyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG4gICAgdmFsdWVfb3RoZXI6IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXksXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBiaWdVSW50MixcbiAgICB0b19uZXh0X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlckFycmF5LFxuICAgIGV4cG9ydGVkOiBiaWdVSW50MixcbiAgICBleHBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyQXJyYXksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGNyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWF0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXksXG4gICAgaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSxcbiAgICBmcm9tX3ByZXZfYmxrOiBiaWdVSW50MixcbiAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXJBcnJheSxcbiAgICBtaW50ZWQ6IGJpZ1VJbnQyLFxuICAgIG1pbnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfaW1wb3J0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJlZ19tY19zZXFubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGJlZm9yZV9tZXJnZTogc2NhbGFyLFxuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgbnhfY2NfdXBkYXRlZDogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIHNwbGl0X3R5cGU6IHNjYWxhcixcbiAgICBzcGxpdDogc2NhbGFyLFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyQXJyYXksXG4gICAgZnVuZHNfY3JlYXRlZDogYmlnVUludDIsXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGRlc2NyOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZDogc2NhbGFyLFxuICAgIGZlZXM6IGJpZ1VJbnQyLFxuICAgIGZlZXNfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyQXJyYXksXG4gICAgY3JlYXRlOiBiaWdVSW50MixcbiAgICBjcmVhdGVfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkSGFzaGVzKTtcbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzQXJyYXkgPSBhcnJheShCbG9ja01hc3RlclNoYXJkRmVlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogRXh0QmxrUmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0FjY291bnRCbG9ja3NBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgbWFzdGVyOiBCbG9ja01hc3Rlcixcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFsYW5jZU90aGVyQXJyYXkgPSBhcnJheShBY2NvdW50QmFsYW5jZU90aGVyKTtcbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYWNjX3R5cGU6IHNjYWxhcixcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogYmlnVUludDIsXG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogYmlnVUludDIsXG4gICAgYmFsYW5jZV9vdGhlcjogQWNjb3VudEJhbGFuY2VPdGhlckFycmF5LFxuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogYmlnVUludDIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb25DcmVkaXQgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgY3JlZGl0OiBiaWdVSW50MixcbiAgICBjcmVkaXRfb3RoZXI6IFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXJBcnJheSxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNvbXB1dGUgPSBzdHJ1Y3Qoe1xuICAgIGNvbXB1dGVfdHlwZTogc2NhbGFyLFxuICAgIHNraXBwZWRfcmVhc29uOiBzY2FsYXIsXG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogYmlnVUludDIsXG4gICAgZ2FzX3VzZWQ6IGJpZ1VJbnQxLFxuICAgIGdhc19saW1pdDogYmlnVUludDEsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQWN0aW9uID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgdG90YWxfbXNnX3NpemVfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uQm91bmNlID0gc3RydWN0KHtcbiAgICBib3VuY2VfdHlwZTogc2NhbGFyLFxuICAgIG1zZ19zaXplX2NlbGxzOiBzY2FsYXIsXG4gICAgbXNnX3NpemVfYml0czogc2NhbGFyLFxuICAgIHJlcV9md2RfZmVlczogYmlnVUludDIsXG4gICAgbXNnX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGZ3ZF9mZWVzOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblNwbGl0SW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSA9IGFycmF5KFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJfdHlwZTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogYmlnVUludDIsXG4gICAgdG90YWxfZmVlc19vdGhlcjogVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlckFycmF5LFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUcmFuc2FjdGlvblN0b3JhZ2UsXG4gICAgY3JlZGl0OiBUcmFuc2FjdGlvbkNyZWRpdCxcbiAgICBjb21wdXRlOiBUcmFuc2FjdGlvbkNvbXB1dGUsXG4gICAgYWN0aW9uOiBUcmFuc2FjdGlvbkFjdGlvbixcbiAgICBib3VuY2U6IFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbiAgICB0dDogc2NhbGFyLFxuICAgIHNwbGl0X2luZm86IFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbiAgICBwcm9vZjogc2NhbGFyLFxuICAgIGJvYzogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEV4dEJsa1JlZjoge1xuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1zZ0VudmVsb3BlOiB7XG4gICAgICAgICAgICBmd2RfZmVlX3JlbWFpbmluZyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVfcmVtYWluaW5nKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiB7XG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zaXRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudHJhbnNpdF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZVZhbHVlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpaHJfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaWhyX2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZndkX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvX25leHRfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBleHBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmV4cG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5pbXBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsayhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZyb21fcHJldl9ibGspO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1pbnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1pbnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcjoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5kc19jcmVhdGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZnVuZHNfY3JlYXRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzOiB7XG4gICAgICAgICAgICBmZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlYXRlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRCYWxhbmNlT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGR1ZV9wYXltZW50KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZHVlX3BheW1lbnQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYWxhbmNlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuYmFsYW5jZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uU3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfZHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25DcmVkaXQ6IHtcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlZGl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuY3JlZGl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ29tcHV0ZToge1xuICAgICAgICAgICAgZ2FzX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5nYXNfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX3VzZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5nYXNfdXNlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2FzX2xpbWl0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX2xpbWl0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQWN0aW9uOiB7XG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2FjdGlvbl9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQm91bmNlOiB7XG4gICAgICAgICAgICByZXFfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5yZXFfZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG1zZ19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQubXNnX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZndkX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcmV2X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQucHJldl90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRvdGFsX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnLFxuICAgIE1lc3NhZ2VWYWx1ZU90aGVyLFxuICAgIE1lc3NhZ2UsXG4gICAgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0V4cG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0ltcG9ydGVkT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==