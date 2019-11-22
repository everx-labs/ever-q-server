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
var BlockMasterPrevBlkSignatures = struct({
  node_id: scalar,
  r: scalar,
  s: scalar
});
var BlockMasterShardHashesArray = array(BlockMasterShardHashes);
var BlockMasterShardFeesArray = array(BlockMasterShardFees);
var BlockMasterPrevBlkSignaturesArray = array(BlockMasterPrevBlkSignatures);
var BlockMaster = struct({
  shard_hashes: BlockMasterShardHashesArray,
  shard_fees: BlockMasterShardFeesArray,
  recover_create_msg: InMsg,
  prev_blk_signatures: BlockMasterPrevBlkSignaturesArray
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
  BlockMasterPrevBlkSignatures: BlockMasterPrevBlkSignatures,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYyLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZyIsIm1zZ190eXBlIiwibXNnIiwidHJhbnNhY3Rpb24iLCJpaHJfZmVlIiwicHJvb2ZfY3JlYXRlZCIsImluX21zZyIsImZ3ZF9mZWUiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJNZXNzYWdlVmFsdWVPdGhlciIsImN1cnJlbmN5IiwidmFsdWUiLCJNZXNzYWdlVmFsdWVPdGhlckFycmF5IiwiTWVzc2FnZSIsImlkIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInNyYyIsImRzdCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZV9vdGhlciIsInByb29mIiwiYm9jIiwiQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIiLCJCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyIiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlciIsIkJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXJBcnJheSIsIkJsb2NrVmFsdWVGbG93RnJvbVByZXZCbGtPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlckFycmF5IiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsIkJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiQmxvY2tBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRmVlc0NvbGxlY3RlZE90aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSIsIkJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwiZGVzY3IiLCJCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlciIsIkJsb2NrTWFzdGVyU2hhcmRGZWVzQ3JlYXRlT3RoZXIiLCJCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlckFycmF5IiwiQmxvY2tNYXN0ZXJTaGFyZEZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsIkJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXkiLCJCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5IiwiQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5IiwiQmxvY2tNYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJzaGFyZF9mZWVzIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ2YWx1ZV9mbG93IiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwibWFzdGVyIiwiQWNjb3VudEJhbGFuY2VPdGhlciIsIkFjY291bnRCYWxhbmNlT3RoZXJBcnJheSIsIkFjY291bnQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwiVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlciIsIlRyYW5zYWN0aW9uU3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIiLCJUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkiLCJUcmFuc2FjdGlvbkNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsImNyZWRpdF9vdGhlciIsIlRyYW5zYWN0aW9uQ29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyYW5zYWN0aW9uQWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJUcmFuc2FjdGlvbkJvdW5jZSIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyYW5zYWN0aW9uU3BsaXRJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwiY29tcHV0ZSIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJfa2V5IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUF1RkEsT0FBTyxDQUFDLG1CQUFELEM7SUFBdEZDLE0sWUFBQUEsTTtJQUFRQyxRLFlBQUFBLFE7SUFBVUMsUSxZQUFBQSxRO0lBQVVDLGMsWUFBQUEsYztJQUFnQkMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUN6RSxJQUFNQyxTQUFTLEdBQUdKLE1BQU0sQ0FBQztBQUNyQkssRUFBQUEsTUFBTSxFQUFFUixRQURhO0FBRXJCUyxFQUFBQSxNQUFNLEVBQUVWLE1BRmE7QUFHckJXLEVBQUFBLFNBQVMsRUFBRVgsTUFIVTtBQUlyQlksRUFBQUEsU0FBUyxFQUFFWjtBQUpVLENBQUQsQ0FBeEI7QUFPQSxJQUFNYSxXQUFXLEdBQUdULE1BQU0sQ0FBQztBQUN2QlUsRUFBQUEsTUFBTSxFQUFFZCxNQURlO0FBRXZCZSxFQUFBQSxTQUFTLEVBQUVmLE1BRlk7QUFHdkJnQixFQUFBQSxRQUFRLEVBQUVoQixNQUhhO0FBSXZCaUIsRUFBQUEsaUJBQWlCLEVBQUVmO0FBSkksQ0FBRCxDQUExQjtBQU9BLElBQU1nQixLQUFLLEdBQUdkLE1BQU0sQ0FBQztBQUNqQmUsRUFBQUEsUUFBUSxFQUFFbkIsTUFETztBQUVqQm9CLEVBQUFBLEdBQUcsRUFBRXBCLE1BRlk7QUFHakJxQixFQUFBQSxXQUFXLEVBQUVyQixNQUhJO0FBSWpCc0IsRUFBQUEsT0FBTyxFQUFFcEIsUUFKUTtBQUtqQnFCLEVBQUFBLGFBQWEsRUFBRXZCLE1BTEU7QUFNakJ3QixFQUFBQSxNQUFNLEVBQUVYLFdBTlM7QUFPakJZLEVBQUFBLE9BQU8sRUFBRXZCLFFBUFE7QUFRakJ3QixFQUFBQSxPQUFPLEVBQUViLFdBUlE7QUFTakJjLEVBQUFBLFdBQVcs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QkFBa0IsRUFBbEJBLGtCQWxCYTtBQW1CYkssRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkFuQmE7QUFvQmJJLEVBQUFBLDZDQUE2QyxFQUE3Q0EsNkNBcEJhO0FBcUJiQyxFQUFBQSw0Q0FBNEMsRUFBNUNBLDRDQXJCYTtBQXNCYkcsRUFBQUEsMkJBQTJCLEVBQTNCQSwyQkF0QmE7QUF1QmJpQixFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQXZCYTtBQXdCYkksRUFBQUEsNkJBQTZCLEVBQTdCQSw2QkF4QmE7QUF5QmJDLEVBQUFBLCtCQUErQixFQUEvQkEsK0JBekJhO0FBMEJiRyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQTFCYTtBQTJCYkssRUFBQUEsNEJBQTRCLEVBQTVCQSw0QkEzQmE7QUE0QmJPLEVBQUFBLFdBQVcsRUFBWEEsV0E1QmE7QUE2QmJRLEVBQUFBLEtBQUssRUFBTEEsS0E3QmE7QUE4QmJtQixFQUFBQSxtQkFBbUIsRUFBbkJBLG1CQTlCYTtBQStCYkUsRUFBQUEsT0FBTyxFQUFQQSxPQS9CYTtBQWdDYk8sRUFBQUEseUJBQXlCLEVBQXpCQSx5QkFoQ2E7QUFpQ2JDLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBakNhO0FBa0NiSSxFQUFBQSw0QkFBNEIsRUFBNUJBLDRCQWxDYTtBQW1DYkUsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFuQ2E7QUFvQ2JJLEVBQUFBLGtCQUFrQixFQUFsQkEsa0JBcENhO0FBcUNiZ0IsRUFBQUEsaUJBQWlCLEVBQWpCQSxpQkFyQ2E7QUFzQ2JjLEVBQUFBLGlCQUFpQixFQUFqQkEsaUJBdENhO0FBdUNiTyxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQXZDYTtBQXdDYk8sRUFBQUEsV0FBVyxFQUFYQTtBQXhDYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBiaWdVSW50MSwgYmlnVUludDIsIHJlc29sdmVCaWdVSW50LCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19pZDogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogc2NhbGFyLFxuICAgIGN1cl9hZGRyOiBzY2FsYXIsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBtc2dfdHlwZTogc2NhbGFyLFxuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogYmlnVUludDIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogYmlnVUludDIsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IGJpZ1VJbnQyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBiaWdVSW50MSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICByZWltcG9ydDogSW5Nc2csXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgTWVzc2FnZVZhbHVlT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VWYWx1ZU90aGVyQXJyYXkgPSBhcnJheShNZXNzYWdlVmFsdWVPdGhlcik7XG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIG1zZ190eXBlOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBpaHJfZmVlOiBiaWdVSW50MixcbiAgICBmd2RfZmVlOiBiaWdVSW50MixcbiAgICBpbXBvcnRfZmVlOiBiaWdVSW50MixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxuICAgIHZhbHVlX290aGVyOiBNZXNzYWdlVmFsdWVPdGhlckFycmF5LFxuICAgIHByb29mOiBzY2FsYXIsXG4gICAgYm9jOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dUb05leHRCbGtPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd01pbnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIpO1xuY29uc3QgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcik7XG5jb25zdCBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXkgPSBhcnJheShCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyKTtcbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogYmlnVUludDIsXG4gICAgdG9fbmV4dF9ibGtfb3RoZXI6IEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXJBcnJheSxcbiAgICBleHBvcnRlZDogYmlnVUludDIsXG4gICAgZXhwb3J0ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlckFycmF5LFxuICAgIGZlZXNfY29sbGVjdGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSxcbiAgICBjcmVhdGVkOiBiaWdVSW50MixcbiAgICBjcmVhdGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlckFycmF5LFxuICAgIGltcG9ydGVkOiBiaWdVSW50MixcbiAgICBpbXBvcnRlZF9vdGhlcjogQmxvY2tWYWx1ZUZsb3dJbXBvcnRlZE90aGVyQXJyYXksXG4gICAgZnJvbV9wcmV2X2JsazogYmlnVUludDIsXG4gICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyQXJyYXksXG4gICAgbWludGVkOiBiaWdVSW50MixcbiAgICBtaW50ZWRfb3RoZXI6IEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXJBcnJheSxcbiAgICBmZWVzX2ltcG9ydGVkOiBiaWdVSW50MixcbiAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0FjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0FjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXIgPSBzdHJ1Y3Qoe1xuICAgIGN1cnJlbmN5OiBzY2FsYXIsXG4gICAgdmFsdWU6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGZWVzQ29sbGVjdGVkT3RoZXJBcnJheSA9IGFycmF5KEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyRnVuZHNDcmVhdGVkT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByZWdfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogYmlnVUludDEsXG4gICAgZW5kX2x0OiBiaWdVSW50MSxcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBiZWZvcmVfbWVyZ2U6IHNjYWxhcixcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIG54X2NjX3VwZGF0ZWQ6IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc2NhbGFyLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBzcGxpdF90eXBlOiBzY2FsYXIsXG4gICAgc3BsaXQ6IHNjYWxhcixcbiAgICBmZWVzX2NvbGxlY3RlZDogYmlnVUludDIsXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlckFycmF5LFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGJpZ1VJbnQyLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZ1bmRzQ3JlYXRlZE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBkZXNjcjogQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0Rlc2NyLFxufSk7XG5cbmNvbnN0IEJsb2NrTWFzdGVyU2hhcmRGZWVzRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXIpO1xuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlckFycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlcik7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlcyA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmQ6IHNjYWxhcixcbiAgICBmZWVzOiBiaWdVSW50MixcbiAgICBmZWVzX290aGVyOiBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlckFycmF5LFxuICAgIGNyZWF0ZTogYmlnVUludDIsXG4gICAgY3JlYXRlX290aGVyOiBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyA9IHN0cnVjdCh7XG4gICAgbm9kZV9pZDogc2NhbGFyLFxuICAgIHI6IHNjYWxhcixcbiAgICBzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyk7XG5jb25zdCBCbG9ja01hc3RlclNoYXJkRmVlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJTaGFyZEZlZXMpO1xuY29uc3QgQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlc0FycmF5ID0gYXJyYXkoQmxvY2tNYXN0ZXJQcmV2QmxrU2lnbmF0dXJlcyk7XG5jb25zdCBCbG9ja01hc3RlciA9IHN0cnVjdCh7XG4gICAgc2hhcmRfaGFzaGVzOiBCbG9ja01hc3RlclNoYXJkSGFzaGVzQXJyYXksXG4gICAgc2hhcmRfZmVlczogQmxvY2tNYXN0ZXJTaGFyZEZlZXNBcnJheSxcbiAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IEluTXNnLFxuICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXNBcnJheSxcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0FjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBFeHRCbGtSZWYsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IEV4dEJsa1JlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkOiBzY2FsYXIsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tBY2NvdW50QmxvY2tzQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIG1hc3RlcjogQmxvY2tNYXN0ZXIsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlciA9IHN0cnVjdCh7XG4gICAgY3VycmVuY3k6IHNjYWxhcixcbiAgICB2YWx1ZTogYmlnVUludDIsXG59KTtcblxuY29uc3QgQWNjb3VudEJhbGFuY2VPdGhlckFycmF5ID0gYXJyYXkoQWNjb3VudEJhbGFuY2VPdGhlcik7XG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGFjY190eXBlOiBzY2FsYXIsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IGJpZ1VJbnQyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIGJhbGFuY2U6IGJpZ1VJbnQyLFxuICAgIGJhbGFuY2Vfb3RoZXI6IEFjY291bnRCYWxhbmNlT3RoZXJBcnJheSxcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IGJpZ1VJbnQyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyID0gc3RydWN0KHtcbiAgICBjdXJyZW5jeTogc2NhbGFyLFxuICAgIHZhbHVlOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uQ3JlZGl0ID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGJpZ1VJbnQyLFxuICAgIGNyZWRpdDogYmlnVUludDIsXG4gICAgY3JlZGl0X290aGVyOiBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyQXJyYXksXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25Db21wdXRlID0gc3RydWN0KHtcbiAgICBjb21wdXRlX3R5cGU6IHNjYWxhcixcbiAgICBza2lwcGVkX3JlYXNvbjogc2NhbGFyLFxuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIGdhc191c2VkOiBiaWdVSW50MSxcbiAgICBnYXNfbGltaXQ6IGJpZ1VJbnQxLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkFjdGlvbiA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBiaWdVSW50MixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkJvdW5jZSA9IHN0cnVjdCh7XG4gICAgYm91bmNlX3R5cGU6IHNjYWxhcixcbiAgICBtc2dfc2l6ZV9jZWxsczogc2NhbGFyLFxuICAgIG1zZ19zaXplX2JpdHM6IHNjYWxhcixcbiAgICByZXFfZndkX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIG1zZ19mZWVzOiBiaWdVSW50MixcbiAgICBmd2RfZmVlczogYmlnVUludDIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TcGxpdEluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyQXJyYXkgPSBhcnJheShUcmFuc2FjdGlvblRvdGFsRmVlc090aGVyKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyX3R5cGU6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IGJpZ1VJbnQyLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXJBcnJheSxcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIGNyZWRpdDogVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgY29tcHV0ZTogVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIGFjdGlvbjogVHJhbnNhY3Rpb25BY3Rpb24sXG4gICAgYm91bmNlOiBUcmFuc2FjdGlvbkJvdW5jZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG4gICAgdHQ6IHNjYWxhcixcbiAgICBzcGxpdF9pbmZvOiBUcmFuc2FjdGlvblNwbGl0SW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG4gICAgcHJvb2Y6IHNjYWxhcixcbiAgICBib2M6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dFbnZlbG9wZToge1xuICAgICAgICAgICAgZndkX2ZlZV9yZW1haW5pbmcocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlX3JlbWFpbmluZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzoge1xuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2l0X2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnRyYW5zaXRfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzoge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VWYWx1ZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaWhyX2ZlZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lmlocl9mZWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ3ZF9mZWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5md2RfZmVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbXBvcnRfZmVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0X2ZlZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd1RvTmV4dEJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93RXhwb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvd0ltcG9ydGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGcm9tUHJldkJsa090aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrVmFsdWVGbG93TWludGVkT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tWYWx1ZUZsb3dGZWVzSW1wb3J0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja1ZhbHVlRmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b19uZXh0X2Jsayk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXhwb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5leHBvcnRlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGltcG9ydGVkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuaW1wb3J0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGsocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mcm9tX3ByZXZfYmxrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtaW50ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5taW50ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2ltcG9ydGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3I6IHtcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5mZWVzX2NvbGxlY3RlZCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuZHNfY3JlYXRlZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ1bmRzX2NyZWF0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNGZWVzT3RoZXI6IHtcbiAgICAgICAgICAgIHZhbHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQudmFsdWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2tNYXN0ZXJTaGFyZEZlZXNDcmVhdGVPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9ja01hc3RlclNoYXJkRmVlczoge1xuICAgICAgICAgICAgZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWF0ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXJ0X2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuc3RhcnRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50QmFsYW5jZU90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkdWVfcGF5bWVudChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmR1ZV9wYXltZW50KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmFsYW5jZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmJhbGFuY2UpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJhbnNhY3Rpb25Ub3RhbEZlZXNPdGhlcjoge1xuICAgICAgICAgICAgdmFsdWUocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC52YWx1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvblN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuc3RvcmFnZV9mZWVzX2R1ZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNyZWRpdENyZWRpdE90aGVyOiB7XG4gICAgICAgICAgICB2YWx1ZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LnZhbHVlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uQ3JlZGl0OiB7XG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC5kdWVfZmVlc19jb2xsZWN0ZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWRpdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmNyZWRpdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkNvbXB1dGU6IHtcbiAgICAgICAgICAgIGdhc19mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuZ2FzX2ZlZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc191c2VkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZ2FzX3VzZWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdhc19saW1pdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmdhc19saW1pdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkFjdGlvbjoge1xuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9md2RfZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9hY3Rpb25fZmVlcyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUcmFuc2FjdGlvbkJvdW5jZToge1xuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQucmVxX2Z3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBtc2dfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50Lm1zZ19mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmd2RfZmVlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LmZ3ZF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRvdGFsX2ZlZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDIsIHBhcmVudC50b3RhbF9mZWVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnLFxuICAgIE91dE1zZyxcbiAgICBNZXNzYWdlVmFsdWVPdGhlcixcbiAgICBNZXNzYWdlLFxuICAgIEJsb2NrVmFsdWVGbG93VG9OZXh0QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dFeHBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93RmVlc0NvbGxlY3RlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93Q3JlYXRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93SW1wb3J0ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0Zyb21QcmV2QmxrT3RoZXIsXG4gICAgQmxvY2tWYWx1ZUZsb3dNaW50ZWRPdGhlcixcbiAgICBCbG9ja1ZhbHVlRmxvd0ZlZXNJbXBvcnRlZE90aGVyLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRIYXNoZXNEZXNjckZlZXNDb2xsZWN0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3JGdW5kc0NyZWF0ZWRPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkSGFzaGVzRGVzY3IsXG4gICAgQmxvY2tNYXN0ZXJTaGFyZEhhc2hlcyxcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0ZlZXNPdGhlcixcbiAgICBCbG9ja01hc3RlclNoYXJkRmVlc0NyZWF0ZU90aGVyLFxuICAgIEJsb2NrTWFzdGVyU2hhcmRGZWVzLFxuICAgIEJsb2NrTWFzdGVyUHJldkJsa1NpZ25hdHVyZXMsXG4gICAgQmxvY2tNYXN0ZXIsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudEJhbGFuY2VPdGhlcixcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uVG90YWxGZWVzT3RoZXIsXG4gICAgVHJhbnNhY3Rpb25TdG9yYWdlLFxuICAgIFRyYW5zYWN0aW9uQ3JlZGl0Q3JlZGl0T3RoZXIsXG4gICAgVHJhbnNhY3Rpb25DcmVkaXQsXG4gICAgVHJhbnNhY3Rpb25Db21wdXRlLFxuICAgIFRyYW5zYWN0aW9uQWN0aW9uLFxuICAgIFRyYW5zYWN0aW9uQm91bmNlLFxuICAgIFRyYW5zYWN0aW9uU3BsaXRJbmZvLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==