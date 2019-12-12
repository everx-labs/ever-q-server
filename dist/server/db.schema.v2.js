"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _qSchema = require("./q-schema");

var _dbShema = require("./db.shema.docs");

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */
var string = _schema.Def.string,
    bool = _schema.Def.bool,
    ref = _schema.Def.ref,
    arrayOf = _schema.Def.arrayOf;
var accountStatus = (0, _qSchema.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
var accountStatusChange = (0, _qSchema.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
var skipReason = (0, _qSchema.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
var accountType = (0, _qSchema.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
var messageType = (0, _qSchema.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
var messageProcessingStatus = (0, _qSchema.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
var transactionType = (0, _qSchema.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
var transactionProcessingStatus = (0, _qSchema.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
var computeType = (0, _qSchema.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
var bounceType = (0, _qSchema.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
var blockProcessingStatus = (0, _qSchema.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
var inMsgType = (0, _qSchema.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  "final": 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
var outMsgType = (0, _qSchema.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
var splitType = (0, _qSchema.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
var Account = {
  _doc: _dbShema.docs.account._doc,
  _: {
    collection: 'accounts'
  },
  acc_type: (0, _qSchema.required)(accountType(_dbShema.docs.account.acc_type)),
  last_paid: (0, _qSchema.required)((0, _qSchema.u32)(_dbShema.docs.account.last_paid)),
  due_payment: (0, _qSchema.grams)(_dbShema.docs.account.due_payment),
  last_trans_lt: (0, _qSchema.required)((0, _qSchema.u64)(_dbShema.docs.account.last_trans_lt)),
  // index
  balance: (0, _qSchema.required)((0, _qSchema.grams)(_dbShema.docs.account.balance)),
  // index
  balance_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.account.balance_other),
  split_depth: (0, _qSchema.u8)(_dbShema.docs.account.split_depth),
  tick: bool(_dbShema.docs.account.tick),
  tock: bool(_dbShema.docs.account.tock),
  code: string(_dbShema.docs.account.code),
  data: string(_dbShema.docs.account.data),
  library: string(_dbShema.docs.account.library),
  proof: string(_dbShema.docs.account.proof),
  boc: string(_dbShema.docs.account.boc)
};
var Message = {
  _doc: 'TON Message',
  _: {
    collection: 'messages'
  },
  msg_type: (0, _qSchema.required)(messageType(_dbShema.docs.message.msg_type)),
  status: (0, _qSchema.required)(messageProcessingStatus(_dbShema.docs.message.status)),
  block_id: (0, _qSchema.required)(string(_dbShema.docs.message.block_id)),
  body: string(_dbShema.docs.message.body),
  split_depth: (0, _qSchema.u8)(_dbShema.docs.message.split_depth),
  tick: bool(_dbShema.docs.message.tick),
  tock: bool(_dbShema.docs.message.tock),
  code: string(_dbShema.docs.message.code),
  data: string(_dbShema.docs.message.data),
  library: string(_dbShema.docs.message.library),
  src: string(_dbShema.docs.message.src),
  dst: string(_dbShema.docs.message.dst),
  created_lt: (0, _qSchema.u64)(_dbShema.docs.message.created_lt),
  created_at: (0, _qSchema.u32)(_dbShema.docs.message.created_at),
  ihr_disabled: bool(_dbShema.docs.message.ihr_disabled),
  ihr_fee: (0, _qSchema.grams)(_dbShema.docs.message.ihr_fee),
  fwd_fee: (0, _qSchema.grams)(_dbShema.docs.message.fwd_fee),
  import_fee: (0, _qSchema.grams)(_dbShema.docs.message.import_fee),
  bounce: bool(_dbShema.docs.message.bounce),
  bounced: bool(_dbShema.docs.message.bounced),
  value: (0, _qSchema.grams)(_dbShema.docs.message.value),
  value_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.message.value_other),
  proof: string(_dbShema.docs.message.proof),
  boc: string(_dbShema.docs.message.boc)
};
var Transaction = {
  _doc: _dbShema.docs.transaction._doc,
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _qSchema.required)(transactionType(_dbShema.docs.transaction.tr_type)),
  status: (0, _qSchema.required)(transactionProcessingStatus(_dbShema.docs.transaction.status)),
  block_id: string(_dbShema.docs.transaction.block_id),
  account_addr: string(_dbShema.docs.transaction.account_addr),
  lt: (0, _qSchema.u64)(_dbShema.docs.transaction.lt),
  prev_trans_hash: string(_dbShema.docs.transaction.prev_trans_hash),
  prev_trans_lt: (0, _qSchema.u64)(_dbShema.docs.transaction.prev_trans_lt),
  now: (0, _qSchema.u32)(_dbShema.docs.transaction.now),
  outmsg_cnt: (0, _qSchema.i32)(_dbShema.docs.transaction.outmsg_cnt),
  orig_status: accountStatus(_dbShema.docs.transaction.orig_status),
  end_status: accountStatus(_dbShema.docs.transaction.end_status),
  in_msg: string(_dbShema.docs.transaction.in_msg),
  in_message: (0, _qSchema.join)({
    Message: Message
  }, 'in_msg'),
  out_msgs: arrayOf(string(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _qSchema.join)({
    Message: Message
  }, 'out_msgs')),
  total_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.total_fees),
  total_fees_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.transaction.total_fees_other),
  old_hash: string(_dbShema.docs.transaction.old_hash),
  new_hash: string(_dbShema.docs.transaction.new_hash),
  credit_first: bool(_dbShema.docs.transaction.credit_first),
  storage: {
    storage_fees_collected: (0, _qSchema.grams)(_dbShema.docs.transaction.storage.storage_fees_collected),
    storage_fees_due: (0, _qSchema.grams)(_dbShema.docs.transaction.storage.storage_fees_due),
    status_change: accountStatusChange(_dbShema.docs.transaction.storage.status_change)
  },
  credit: {
    due_fees_collected: (0, _qSchema.grams)(_dbShema.docs.transaction.credit.due_fees_collected),
    credit: (0, _qSchema.grams)(_dbShema.docs.transaction.credit.credit),
    credit_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.transaction.credit.credit_other)
  },
  compute: {
    compute_type: (0, _qSchema.required)(computeType(_dbShema.docs.transaction.compute.compute_type)),
    skipped_reason: skipReason(_dbShema.docs.transaction.compute.skipped_reason),
    success: bool(_dbShema.docs.transaction.compute.success),
    msg_state_used: bool(_dbShema.docs.transaction.compute.msg_state_used),
    account_activated: bool(_dbShema.docs.transaction.compute.account_activated),
    gas_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.compute.gas_fees),
    gas_used: (0, _qSchema.u64)(_dbShema.docs.transaction.compute.gas_used),
    gas_limit: (0, _qSchema.u64)(_dbShema.docs.transaction.compute.gas_limit),
    gas_credit: (0, _qSchema.i32)(_dbShema.docs.transaction.compute.gas_credit),
    mode: (0, _qSchema.i8)(_dbShema.docs.transaction.compute.mode),
    exit_code: (0, _qSchema.i32)(_dbShema.docs.transaction.compute.exit_code),
    exit_arg: (0, _qSchema.i32)(_dbShema.docs.transaction.compute.exit_arg),
    vm_steps: (0, _qSchema.u32)(_dbShema.docs.transaction.compute.vm_steps),
    vm_init_state_hash: string(_dbShema.docs.transaction.compute.vm_init_state_hash),
    vm_final_state_hash: string(_dbShema.docs.transaction.compute.vm_final_state_hash)
  },
  action: {
    success: bool(_dbShema.docs.transaction.action.success),
    valid: bool(_dbShema.docs.transaction.action.valid),
    no_funds: bool(_dbShema.docs.transaction.action.no_funds),
    status_change: accountStatusChange(_dbShema.docs.transaction.action.status_change),
    total_fwd_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.action.total_fwd_fees),
    total_action_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.action.total_action_fees),
    result_code: (0, _qSchema.i32)(_dbShema.docs.transaction.action.result_code),
    result_arg: (0, _qSchema.i32)(_dbShema.docs.transaction.action.result_arg),
    tot_actions: (0, _qSchema.i32)(_dbShema.docs.transaction.action.tot_actions),
    spec_actions: (0, _qSchema.i32)(_dbShema.docs.transaction.action.spec_actions),
    skipped_actions: (0, _qSchema.i32)(_dbShema.docs.transaction.action.skipped_actions),
    msgs_created: (0, _qSchema.i32)(_dbShema.docs.transaction.action.msgs_created),
    action_list_hash: string(_dbShema.docs.transaction.action.action_list_hash),
    total_msg_size_cells: (0, _qSchema.u32)(_dbShema.docs.transaction.action.total_msg_size_cells),
    total_msg_size_bits: (0, _qSchema.u32)(_dbShema.docs.transaction.action.total_msg_size_bits)
  },
  bounce: {
    bounce_type: (0, _qSchema.required)(bounceType(_dbShema.docs.transaction.bounce.bounce_type)),
    msg_size_cells: (0, _qSchema.u32)(_dbShema.docs.transaction.bounce.msg_size_cells),
    msg_size_bits: (0, _qSchema.u32)(_dbShema.docs.transaction.bounce.msg_size_bits),
    req_fwd_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.bounce.req_fwd_fees),
    msg_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.bounce.msg_fees),
    fwd_fees: (0, _qSchema.grams)(_dbShema.docs.transaction.bounce.fwd_fees)
  },
  aborted: bool(_dbShema.docs.transaction.aborted),
  destroyed: bool(_dbShema.docs.transaction.destroyed),
  tt: string(_dbShema.docs.transaction.tt),
  split_info: {
    cur_shard_pfx_len: (0, _qSchema.u8)(_dbShema.docs.transaction.split_info.cur_shard_pfx_len),
    acc_split_depth: (0, _qSchema.u8)(_dbShema.docs.transaction.split_info.acc_split_depth),
    this_addr: string(_dbShema.docs.transaction.split_info.this_addr),
    sibling_addr: string(_dbShema.docs.transaction.split_info.sibling_addr)
  },
  prepare_transaction: string(_dbShema.docs.transaction.prepare_transaction),
  installed: bool(_dbShema.docs.transaction.installed),
  proof: string(_dbShema.docs.transaction.proof),
  boc: string(_dbShema.docs.transaction.boc)
}; // BLOCK

var ExtBlkRef = {
  end_lt: (0, _qSchema.u64)(),
  seq_no: (0, _qSchema.u32)(),
  root_hash: string(),
  file_hash: string()
};

var extBlkRef = function extBlkRef() {
  return ref({
    ExtBlkRef: ExtBlkRef
  });
};

var MsgEnvelope = {
  msg_id: string(),
  next_addr: string(),
  cur_addr: string(),
  fwd_fee_remaining: (0, _qSchema.grams)()
};

var msgEnvelope = function msgEnvelope() {
  return ref({
    MsgEnvelope: MsgEnvelope
  });
};

var InMsg = {
  msg_type: (0, _qSchema.required)(inMsgType()),
  msg: string(),
  transaction: string(),
  ihr_fee: (0, _qSchema.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _qSchema.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _qSchema.grams)(),
  transaction_id: (0, _qSchema.u64)(),
  proof_delivered: string()
};

var inMsg = function inMsg() {
  return ref({
    InMsg: InMsg
  });
};

var OutMsg = {
  msg_type: (0, _qSchema.required)(outMsgType()),
  msg: string(),
  transaction: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _qSchema.u64)()
};

var outMsg = function outMsg() {
  return ref({
    OutMsg: OutMsg
  });
};

var shardDescr = function shardDescr(doc) {
  return (0, _qSchema.withDoc)({
    seq_no: (0, _qSchema.u32)(_dbShema.docs.shardDescr.seq_no),
    reg_mc_seqno: (0, _qSchema.u32)(_dbShema.docs.shardDescr.reg_mc_seqno),
    start_lt: (0, _qSchema.u64)(_dbShema.docs.shardDescr.start_lt),
    end_lt: (0, _qSchema.u64)(_dbShema.docs.shardDescr.end_lt),
    root_hash: string(_dbShema.docs.shardDescr.root_hash),
    file_hash: string(_dbShema.docs.shardDescr.file_hash),
    before_split: bool(_dbShema.docs.shardDescr.before_split),
    before_merge: bool(_dbShema.docs.shardDescr.before_merge),
    want_split: bool(_dbShema.docs.shardDescr.want_split),
    want_merge: bool(_dbShema.docs.shardDescr.want_merge),
    nx_cc_updated: bool(_dbShema.docs.shardDescr.nx_cc_updated),
    flags: (0, _qSchema.u8)(_dbShema.docs.shardDescr.flags),
    next_catchain_seqno: (0, _qSchema.u32)(_dbShema.docs.shardDescr.next_catchain_seqno),
    next_validator_shard: string(_dbShema.docs.shardDescr.next_validator_shard),
    min_ref_mc_seqno: (0, _qSchema.u32)(_dbShema.docs.shardDescr.min_ref_mc_seqno),
    gen_utime: (0, _qSchema.u32)(_dbShema.docs.shardDescr.gen_utime),
    split_type: splitType(_dbShema.docs.shardDescr.split_type),
    split: (0, _qSchema.u32)(_dbShema.docs.shardDescr.split),
    fees_collected: (0, _qSchema.grams)(_dbShema.docs.shardDescr.fees_collected),
    fees_collected_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.shardDescr.fees_collected_other),
    funds_created: (0, _qSchema.grams)(_dbShema.docs.shardDescr.funds_created),
    funds_created_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.shardDescr.funds_created_other)
  }, doc);
};

var Block = {
  _doc: _dbShema.docs.block._doc,
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(_dbShema.docs.block.status),
  global_id: (0, _qSchema.u32)(_dbShema.docs.block.global_id),
  want_split: bool(_dbShema.docs.block.want_split),
  seq_no: (0, _qSchema.u32)(_dbShema.docs.block.seq_no),
  after_merge: bool(_dbShema.docs.block.after_merge),
  gen_utime: (0, _qSchema.i32)(_dbShema.docs.block.gen_utime),
  gen_catchain_seqno: (0, _qSchema.u32)(_dbShema.docs.block.gen_catchain_seqno),
  flags: (0, _qSchema.u16)(_dbShema.docs.block.flags),
  master_ref: extBlkRef(_dbShema.docs.block.master_ref),
  prev_ref: extBlkRef(_dbShema.docs.block.prev_ref),
  prev_alt_ref: extBlkRef(_dbShema.docs.block.prev_alt_ref),
  prev_vert_ref: extBlkRef(_dbShema.docs.block.prev_vert_ref),
  prev_vert_alt_ref: extBlkRef(_dbShema.docs.block.prev_vert_alt_ref),
  version: (0, _qSchema.u32)(_dbShema.docs.block.version),
  gen_validator_list_hash_short: (0, _qSchema.u32)(_dbShema.docs.block.gen_validator_list_hash_short),
  before_split: bool(_dbShema.docs.block.before_split),
  after_split: bool(_dbShema.docs.block.after_split),
  want_merge: bool(_dbShema.docs.block.want_merge),
  vert_seq_no: (0, _qSchema.u32)(_dbShema.docs.block.vert_seq_no),
  start_lt: (0, _qSchema.u64)(_dbShema.docs.block.start_lt),
  end_lt: (0, _qSchema.u64)(_dbShema.docs.block.end_lt),
  workchain_id: (0, _qSchema.i32)(_dbShema.docs.block.workchain_id),
  shard: string(_dbShema.docs.block.shard),
  min_ref_mc_seqno: (0, _qSchema.u32)(_dbShema.docs.block.min_ref_mc_seqno),
  value_flow: {
    to_next_blk: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.to_next_blk),
    to_next_blk_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.to_next_blk_other),
    exported: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.exported),
    exported_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.exported_other),
    fees_collected: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.fees_collected),
    fees_collected_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_collected_other),
    created: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.created),
    created_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.created_other),
    imported: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.imported),
    imported_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.imported_other),
    from_prev_blk: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.from_prev_blk),
    from_prev_blk_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.from_prev_blk_other),
    minted: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.minted),
    minted_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.minted_other),
    fees_imported: (0, _qSchema.grams)(_dbShema.docs.block.value_flow.fees_imported),
    fees_imported_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_imported_other)
  },
  in_msg_descr: arrayOf(inMsg(_dbShema.docs.block.in_msg_descr)),
  rand_seed: string(_dbShema.docs.block.rand_seed),
  out_msg_descr: arrayOf(outMsg(_dbShema.docs.block.out_msg_descr)),
  account_blocks: arrayOf({
    account_addr: string(_dbShema.docs.block.account_blocks.account_addr),
    transactions: arrayOf(string(_dbShema.docs.block.account_blocks.transactions)),
    state_update: {
      old_hash: string(_dbShema.docs.block.account_blocks.state_update.old_hash),
      new_hash: string(_dbShema.docs.block.account_blocks.state_update.new_hash)
    },
    tr_count: (0, _qSchema.i32)(_dbShema.docs.block.account_blocks.tr_count)
  }),
  state_update: {
    "new": string(_dbShema.docs.block.state_update["new"]),
    new_hash: string(_dbShema.docs.block.state_update.new_hash),
    new_depth: (0, _qSchema.u16)(_dbShema.docs.block.state_update.new_depth),
    old: string(_dbShema.docs.block.state_update.old),
    old_hash: string(_dbShema.docs.block.state_update.old_hash),
    old_depth: (0, _qSchema.u16)(_dbShema.docs.block.state_update.old_depth)
  },
  master: {
    shard_hashes: arrayOf({
      workchain_id: (0, _qSchema.i32)(_dbShema.docs.block.master.shard_hashes.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_hashes.shard),
      descr: shardDescr(_dbShema.docs.block.master.shard_hashes.descr)
    }),
    shard_fees: arrayOf({
      workchain_id: (0, _qSchema.i32)(_dbShema.docs.block.master.shard_fees.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_fees.shard),
      fees: (0, _qSchema.grams)(_dbShema.docs.block.master.shard_fees.fees),
      fees_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.fees_other),
      create: (0, _qSchema.grams)(_dbShema.docs.block.master.shard_fees.create),
      create_other: (0, _qSchema.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.create_other)
    }),
    recover_create_msg: inMsg(_dbShema.docs.block.master.recover_create_msg),
    prev_blk_signatures: arrayOf({
      node_id: string(_dbShema.docs.block.master.prev_blk_signatures.node_id),
      r: string(_dbShema.docs.block.master.prev_blk_signatures.r),
      s: string(_dbShema.docs.block.master.prev_blk_signatures.s)
    })
  }
}; //Root scheme declaration

var schema = {
  _class: {
    types: {
      OtherCurrency: _qSchema.OtherCurrency,
      ExtBlkRef: ExtBlkRef,
      MsgEnvelope: MsgEnvelope,
      InMsg: InMsg,
      OutMsg: OutMsg,
      Message: Message,
      Block: Block,
      Account: Account,
      Transaction: Transaction
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi5zY2hlbWEudjIuanMiXSwibmFtZXMiOlsic3RyaW5nIiwiRGVmIiwiYm9vbCIsInJlZiIsImFycmF5T2YiLCJhY2NvdW50U3RhdHVzIiwidW5pbml0IiwiYWN0aXZlIiwiZnJvemVuIiwibm9uRXhpc3QiLCJhY2NvdW50U3RhdHVzQ2hhbmdlIiwidW5jaGFuZ2VkIiwiZGVsZXRlZCIsInNraXBSZWFzb24iLCJub1N0YXRlIiwiYmFkU3RhdGUiLCJub0dhcyIsImFjY291bnRUeXBlIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtc2dfdHlwZSIsIm1lc3NhZ2UiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJtc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwiZG9jIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2siLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5j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SyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsc0JBREc7QUFFSHBHLE1BQUFBLFNBQVMsRUFBVEEsU0FGRztBQUdITSxNQUFBQSxXQUFXLEVBQVhBLFdBSEc7QUFJSE0sTUFBQUEsS0FBSyxFQUFMQSxLQUpHO0FBS0hRLE1BQUFBLE1BQU0sRUFBTkEsTUFMRztBQU1IOUcsTUFBQUEsT0FBTyxFQUFQQSxPQU5HO0FBT0hzSSxNQUFBQSxLQUFLLEVBQUxBLEtBUEc7QUFRSHhKLE1BQUFBLE9BQU8sRUFBUEEsT0FSRztBQVNIb0MsTUFBQUEsV0FBVyxFQUFYQTtBQVRHO0FBREg7QUFEWSxDQUF4QjtlQWdCZXlLLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL3Etc2NoZW1hXCI7XG5cbmltcG9ydCB7ZG9jc30gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gTWVzc2FnZScsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKGRvY3MubWVzc2FnZS5tc2dfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQobWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMoZG9jcy5tZXNzYWdlLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiByZXF1aXJlZChzdHJpbmcoZG9jcy5tZXNzYWdlLmJsb2NrX2lkKSksXG4gICAgYm9keTogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5KSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5tZXNzYWdlLnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MubWVzc2FnZS50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MubWVzc2FnZS50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5KSxcbiAgICBzcmM6IHN0cmluZyhkb2NzLm1lc3NhZ2Uuc3JjKSxcbiAgICBkc3Q6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZHN0KSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMihkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG59O1xuXG5cbmNvbnN0IFRyYW5zYWN0aW9uOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MudHJhbnNhY3Rpb24uX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnIH0sXG4gICAgdHJfdHlwZTogcmVxdWlyZWQodHJhbnNhY3Rpb25UeXBlKGRvY3MudHJhbnNhY3Rpb24udHJfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQodHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmJsb2NrX2lkKSxcbiAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmFjY291bnRfYWRkciksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoKSA9PiByZWYoeyBFeHRCbGtSZWYgfSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogdTY0KCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoKSA9PiByZWYoeyBJbk1zZyB9KTtcblxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChvdXRNc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgcmVpbXBvcnQ6IGluTXNnKCksXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbn07XG5cbmNvbnN0IG91dE1zZyA9ICgpID0+IHJlZih7IE91dE1zZyB9KTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucykpLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaClcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KVxuICAgIH0pLFxuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgfSxcbn07XG5cblxuLy9Sb290IHNjaGVtZSBkZWNsYXJhdGlvblxuXG5jb25zdCBzY2hlbWE6IFR5cGVEZWYgPSB7XG4gICAgX2NsYXNzOiB7XG4gICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICBPdGhlckN1cnJlbmN5LFxuICAgICAgICAgICAgRXh0QmxrUmVmLFxuICAgICAgICAgICAgTXNnRW52ZWxvcGUsXG4gICAgICAgICAgICBJbk1zZyxcbiAgICAgICAgICAgIE91dE1zZyxcbiAgICAgICAgICAgIE1lc3NhZ2UsXG4gICAgICAgICAgICBCbG9jayxcbiAgICAgICAgICAgIEFjY291bnQsXG4gICAgICAgICAgICBUcmFuc2FjdGlvbixcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNjaGVtYTtcbiJdfQ==