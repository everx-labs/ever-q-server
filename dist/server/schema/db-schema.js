"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _dbSchemaTypes = require("./db-schema-types");

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
var accountStatus = (0, _dbSchemaTypes.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
var accountStatusChange = (0, _dbSchemaTypes.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
var skipReason = (0, _dbSchemaTypes.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
var accountType = (0, _dbSchemaTypes.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
var messageType = (0, _dbSchemaTypes.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
var messageProcessingStatus = (0, _dbSchemaTypes.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
var transactionType = (0, _dbSchemaTypes.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
var transactionProcessingStatus = (0, _dbSchemaTypes.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
var computeType = (0, _dbSchemaTypes.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
var bounceType = (0, _dbSchemaTypes.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
var blockProcessingStatus = (0, _dbSchemaTypes.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
var inMsgType = (0, _dbSchemaTypes.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  "final": 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
var outMsgType = (0, _dbSchemaTypes.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
var splitType = (0, _dbSchemaTypes.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
var Account = {
  _doc: _dbShema.docs.account._doc,
  _: {
    collection: 'accounts'
  },
  acc_type: (0, _dbSchemaTypes.required)(accountType(_dbShema.docs.account.acc_type)),
  last_paid: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u32)(_dbShema.docs.account.last_paid)),
  due_payment: (0, _dbSchemaTypes.grams)(_dbShema.docs.account.due_payment),
  last_trans_lt: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u64)(_dbShema.docs.account.last_trans_lt)),
  // index
  balance: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.grams)(_dbShema.docs.account.balance)),
  // index
  balance_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.account.balance_other),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.account.split_depth),
  tick: bool(_dbShema.docs.account.tick),
  tock: bool(_dbShema.docs.account.tock),
  code: string(_dbShema.docs.account.code),
  data: string(_dbShema.docs.account.data),
  library: string(_dbShema.docs.account.library),
  proof: string(_dbShema.docs.account.proof),
  boc: string(_dbShema.docs.account.boc)
};
var Message = {
  _doc: _dbShema.docs.message._doc,
  _: {
    collection: 'messages'
  },
  msg_type: (0, _dbSchemaTypes.required)(messageType(_dbShema.docs.message.msg_type)),
  status: (0, _dbSchemaTypes.required)(messageProcessingStatus(_dbShema.docs.message.status)),
  block_id: (0, _dbSchemaTypes.required)(string(_dbShema.docs.message.block_id)),
  body: string(_dbShema.docs.message.body),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.message.split_depth),
  tick: bool(_dbShema.docs.message.tick),
  tock: bool(_dbShema.docs.message.tock),
  code: string(_dbShema.docs.message.code),
  data: string(_dbShema.docs.message.data),
  library: string(_dbShema.docs.message.library),
  src: string(_dbShema.docs.message.src),
  dst: string(_dbShema.docs.message.dst),
  created_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.message.created_lt),
  created_at: (0, _dbSchemaTypes.u32)(_dbShema.docs.message.created_at),
  ihr_disabled: bool(_dbShema.docs.message.ihr_disabled),
  ihr_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.ihr_fee),
  fwd_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.fwd_fee),
  import_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.import_fee),
  bounce: bool(_dbShema.docs.message.bounce),
  bounced: bool(_dbShema.docs.message.bounced),
  value: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.value),
  value_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.message.value_other),
  proof: string(_dbShema.docs.message.proof),
  boc: string(_dbShema.docs.message.boc)
};
var Transaction = {
  _doc: _dbShema.docs.transaction._doc,
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _dbSchemaTypes.required)(transactionType(_dbShema.docs.transaction.tr_type)),
  status: (0, _dbSchemaTypes.required)(transactionProcessingStatus(_dbShema.docs.transaction.status)),
  block_id: string(_dbShema.docs.transaction.block_id),
  account_addr: string(_dbShema.docs.transaction.account_addr),
  lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.lt),
  prev_trans_hash: string(_dbShema.docs.transaction.prev_trans_hash),
  prev_trans_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.prev_trans_lt),
  now: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.now),
  outmsg_cnt: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.outmsg_cnt),
  orig_status: accountStatus(_dbShema.docs.transaction.orig_status),
  end_status: accountStatus(_dbShema.docs.transaction.end_status),
  in_msg: string(_dbShema.docs.transaction.in_msg),
  in_message: (0, _dbSchemaTypes.join)({
    Message: Message
  }, 'in_msg'),
  out_msgs: arrayOf(string(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message: Message
  }, 'out_msgs')),
  total_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.total_fees),
  total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.total_fees_other),
  old_hash: string(_dbShema.docs.transaction.old_hash),
  new_hash: string(_dbShema.docs.transaction.new_hash),
  credit_first: bool(_dbShema.docs.transaction.credit_first),
  storage: {
    storage_fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.storage.storage_fees_collected),
    storage_fees_due: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.storage.storage_fees_due),
    status_change: accountStatusChange(_dbShema.docs.transaction.storage.status_change)
  },
  credit: {
    due_fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.credit.due_fees_collected),
    credit: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.credit.credit),
    credit_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.credit.credit_other)
  },
  compute: {
    compute_type: (0, _dbSchemaTypes.required)(computeType(_dbShema.docs.transaction.compute.compute_type)),
    skipped_reason: skipReason(_dbShema.docs.transaction.compute.skipped_reason),
    success: bool(_dbShema.docs.transaction.compute.success),
    msg_state_used: bool(_dbShema.docs.transaction.compute.msg_state_used),
    account_activated: bool(_dbShema.docs.transaction.compute.account_activated),
    gas_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.compute.gas_fees),
    gas_used: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.compute.gas_used),
    gas_limit: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.compute.gas_limit),
    gas_credit: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.gas_credit),
    mode: (0, _dbSchemaTypes.i8)(_dbShema.docs.transaction.compute.mode),
    exit_code: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.exit_code),
    exit_arg: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.compute.exit_arg),
    vm_steps: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.compute.vm_steps),
    vm_init_state_hash: string(_dbShema.docs.transaction.compute.vm_init_state_hash),
    vm_final_state_hash: string(_dbShema.docs.transaction.compute.vm_final_state_hash)
  },
  action: {
    success: bool(_dbShema.docs.transaction.action.success),
    valid: bool(_dbShema.docs.transaction.action.valid),
    no_funds: bool(_dbShema.docs.transaction.action.no_funds),
    status_change: accountStatusChange(_dbShema.docs.transaction.action.status_change),
    total_fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.action.total_fwd_fees),
    total_action_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.action.total_action_fees),
    result_code: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.result_code),
    result_arg: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.result_arg),
    tot_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.tot_actions),
    spec_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.spec_actions),
    skipped_actions: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.skipped_actions),
    msgs_created: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.action.msgs_created),
    action_list_hash: string(_dbShema.docs.transaction.action.action_list_hash),
    total_msg_size_cells: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.action.total_msg_size_cells),
    total_msg_size_bits: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.action.total_msg_size_bits)
  },
  bounce: {
    bounce_type: (0, _dbSchemaTypes.required)(bounceType(_dbShema.docs.transaction.bounce.bounce_type)),
    msg_size_cells: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.bounce.msg_size_cells),
    msg_size_bits: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.bounce.msg_size_bits),
    req_fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.req_fwd_fees),
    msg_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.msg_fees),
    fwd_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.bounce.fwd_fees)
  },
  aborted: bool(_dbShema.docs.transaction.aborted),
  destroyed: bool(_dbShema.docs.transaction.destroyed),
  tt: string(_dbShema.docs.transaction.tt),
  split_info: {
    cur_shard_pfx_len: (0, _dbSchemaTypes.u8)(_dbShema.docs.transaction.split_info.cur_shard_pfx_len),
    acc_split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.transaction.split_info.acc_split_depth),
    this_addr: string(_dbShema.docs.transaction.split_info.this_addr),
    sibling_addr: string(_dbShema.docs.transaction.split_info.sibling_addr)
  },
  prepare_transaction: string(_dbShema.docs.transaction.prepare_transaction),
  installed: bool(_dbShema.docs.transaction.installed),
  proof: string(_dbShema.docs.transaction.proof),
  boc: string(_dbShema.docs.transaction.boc)
}; // BLOCK SIGNATURES

var BlockSignatures = {
  _doc: 'Set of validator\'s signatures for the Block with correspond id',
  _: {
    collection: 'blocks_signatures'
  },
  signatures: arrayOf({
    node_id: string("Validator ID"),
    r: string("'R' part of signature"),
    s: string("'s' part of signature")
  }, "Array of signatures from block's validators")
}; // BLOCK

var ExtBlkRef = {
  end_lt: (0, _dbSchemaTypes.u64)(),
  seq_no: (0, _dbSchemaTypes.u32)(),
  root_hash: string(),
  file_hash: string()
};

var extBlkRef = function extBlkRef(doc) {
  return ref({
    ExtBlkRef: ExtBlkRef
  }, doc);
};

var MsgEnvelope = {
  msg_id: string(),
  next_addr: string(),
  cur_addr: string(),
  fwd_fee_remaining: (0, _dbSchemaTypes.grams)()
};

var msgEnvelope = function msgEnvelope() {
  return ref({
    MsgEnvelope: MsgEnvelope
  });
};

var InMsg = {
  msg_type: (0, _dbSchemaTypes.required)(inMsgType()),
  msg: string(),
  transaction: string(),
  ihr_fee: (0, _dbSchemaTypes.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _dbSchemaTypes.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _dbSchemaTypes.grams)(),
  transaction_id: (0, _dbSchemaTypes.u64)(),
  proof_delivered: string()
};

var inMsg = function inMsg(doc) {
  return ref({
    InMsg: InMsg
  }, doc);
};

var OutMsg = {
  msg_type: (0, _dbSchemaTypes.required)(outMsgType()),
  msg: string(),
  transaction: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _dbSchemaTypes.u64)()
};

var outMsg = function outMsg(doc) {
  return ref({
    OutMsg: OutMsg
  }, doc);
};

var shardDescr = function shardDescr(doc) {
  return (0, _dbSchemaTypes.withDoc)({
    seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.seq_no),
    reg_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.reg_mc_seqno),
    start_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.shardDescr.start_lt),
    end_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.shardDescr.end_lt),
    root_hash: string(_dbShema.docs.shardDescr.root_hash),
    file_hash: string(_dbShema.docs.shardDescr.file_hash),
    before_split: bool(_dbShema.docs.shardDescr.before_split),
    before_merge: bool(_dbShema.docs.shardDescr.before_merge),
    want_split: bool(_dbShema.docs.shardDescr.want_split),
    want_merge: bool(_dbShema.docs.shardDescr.want_merge),
    nx_cc_updated: bool(_dbShema.docs.shardDescr.nx_cc_updated),
    flags: (0, _dbSchemaTypes.u8)(_dbShema.docs.shardDescr.flags),
    next_catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.next_catchain_seqno),
    next_validator_shard: string(_dbShema.docs.shardDescr.next_validator_shard),
    min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.min_ref_mc_seqno),
    gen_utime: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.gen_utime),
    split_type: splitType(_dbShema.docs.shardDescr.split_type),
    split: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.split),
    fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.fees_collected),
    fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.fees_collected_other),
    funds_created: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.funds_created),
    funds_created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.funds_created_other)
  }, doc);
};

var Block = {
  _doc: _dbShema.docs.block._doc,
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(_dbShema.docs.block.status),
  global_id: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.global_id),
  want_split: bool(_dbShema.docs.block.want_split),
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.seq_no),
  after_merge: bool(_dbShema.docs.block.after_merge),
  gen_utime: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.gen_utime),
  gen_catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_catchain_seqno),
  flags: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.flags),
  master_ref: extBlkRef(_dbShema.docs.block.master_ref),
  prev_ref: extBlkRef(_dbShema.docs.block.prev_ref),
  prev_alt_ref: extBlkRef(_dbShema.docs.block.prev_alt_ref),
  prev_vert_ref: extBlkRef(_dbShema.docs.block.prev_vert_ref),
  prev_vert_alt_ref: extBlkRef(_dbShema.docs.block.prev_vert_alt_ref),
  version: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.version),
  gen_validator_list_hash_short: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_validator_list_hash_short),
  before_split: bool(_dbShema.docs.block.before_split),
  after_split: bool(_dbShema.docs.block.after_split),
  want_merge: bool(_dbShema.docs.block.want_merge),
  vert_seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.vert_seq_no),
  start_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.block.start_lt),
  end_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.block.end_lt),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.workchain_id),
  shard: string(_dbShema.docs.block.shard),
  min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.min_ref_mc_seqno),
  value_flow: {
    to_next_blk: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.to_next_blk),
    to_next_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.to_next_blk_other),
    exported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.exported),
    exported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.exported_other),
    fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.fees_collected),
    fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_collected_other),
    created: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.created),
    created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.created_other),
    imported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.imported),
    imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.imported_other),
    from_prev_blk: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.from_prev_blk),
    from_prev_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.from_prev_blk_other),
    minted: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.minted),
    minted_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.minted_other),
    fees_imported: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.value_flow.fees_imported),
    fees_imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.value_flow.fees_imported_other)
  },
  in_msg_descr: arrayOf(inMsg(_dbShema.docs.block.in_msg_descr)),
  rand_seed: string(_dbShema.docs.block.rand_seed),
  out_msg_descr: arrayOf(outMsg(_dbShema.docs.block.out_msg_descr)),
  account_blocks: arrayOf({
    account_addr: string(_dbShema.docs.block.account_blocks.account_addr),
    transactions: arrayOf({
      lt: (0, _dbSchemaTypes.u64)(),
      // TODO: doc
      transaction_id: string(),
      // TODO: doc
      total_fees: (0, _dbSchemaTypes.grams)(),
      // TODO: doc
      total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)() // TODO: doc

    }, _dbShema.docs.block.account_blocks.transactions),
    old_hash: string(_dbShema.docs.block.account_blocks.state_update.old_hash),
    new_hash: string(_dbShema.docs.block.account_blocks.state_update.new_hash),
    tr_count: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.account_blocks.tr_count)
  }),
  tr_count: (0, _dbSchemaTypes.i32)(),
  // TODO: doc
  state_update: {
    "new": string(_dbShema.docs.block.state_update["new"]),
    new_hash: string(_dbShema.docs.block.state_update.new_hash),
    new_depth: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.state_update.new_depth),
    old: string(_dbShema.docs.block.state_update.old),
    old_hash: string(_dbShema.docs.block.state_update.old_hash),
    old_depth: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.state_update.old_depth)
  },
  master: {
    shard_hashes: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.master.shard_hashes.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_hashes.shard),
      descr: shardDescr(_dbShema.docs.block.master.shard_hashes.descr)
    }),
    shard_fees: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.master.shard_fees.workchain_id),
      shard: string(_dbShema.docs.block.master.shard_fees.shard),
      fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.master.shard_fees.fees),
      fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.fees_other),
      create: (0, _dbSchemaTypes.grams)(_dbShema.docs.block.master.shard_fees.create),
      create_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.block.master.shard_fees.create_other)
    }),
    recover_create_msg: inMsg(_dbShema.docs.block.master.recover_create_msg),
    prev_blk_signatures: arrayOf({
      node_id: string(_dbShema.docs.block.master.prev_blk_signatures.node_id),
      r: string(_dbShema.docs.block.master.prev_blk_signatures.r),
      s: string(_dbShema.docs.block.master.prev_blk_signatures.s)
    })
  },
  signatures: (0, _dbSchemaTypes.join)({
    BlockSignatures: BlockSignatures
  }, 'id')
}; //Root scheme declaration

var schema = {
  _class: {
    types: {
      OtherCurrency: _dbSchemaTypes.OtherCurrency,
      ExtBlkRef: ExtBlkRef,
      MsgEnvelope: MsgEnvelope,
      InMsg: InMsg,
      OutMsg: OutMsg,
      Message: Message,
      Block: Block,
      Account: Account,
      Transaction: Transaction,
      BlockSignatures: BlockSignatures
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJkb2NzIiwiYWNjb3VudCIsIl8iLCJjb2xsZWN0aW9uIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJCbG9ja1NpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiZXh0QmxrUmVmIiwiZG9jIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwibXNnRW52ZWxvcGUiLCJJbk1zZyIsIm1zZyIsInByb29mX2NyZWF0ZWQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsImluTXNnIiwiT3V0TXNnIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm91dE1zZyIsInNoYXJkRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9jayIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwibWFzdGVyIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwi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LEtBUEc7QUFRSDdKLE1BQUFBLE9BQU8sRUFBUEEsT0FSRztBQVNIb0MsTUFBQUEsV0FBVyxFQUFYQSxXQVRHO0FBVUh3RSxNQUFBQSxlQUFlLEVBQWZBO0FBVkc7QUFESDtBQURZLENBQXhCO2VBaUJlbUcsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYSc7XG5cbmltcG9ydCB0eXBlIHsgU2NoZW1hRG9jLCBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1OCxcbiAgICB1OGVudW0sXG4gICAgd2l0aERvY1xufSBmcm9tIFwiLi9kYi1zY2hlbWEtdHlwZXNcIjtcblxuaW1wb3J0IHsgZG9jcyB9IGZyb20gJy4vZGIuc2hlbWEuZG9jcyc7XG5cbmNvbnN0IHsgc3RyaW5nLCBib29sLCByZWYsIGFycmF5T2YgfSA9IERlZjtcblxuXG5jb25zdCBhY2NvdW50U3RhdHVzID0gdThlbnVtKCdBY2NvdW50U3RhdHVzJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxuICAgIG5vbkV4aXN0OiAzLFxufSk7XG5cbmNvbnN0IGFjY291bnRTdGF0dXNDaGFuZ2UgPSB1OGVudW0oJ0FjY291bnRTdGF0dXNDaGFuZ2UnLCB7XG4gICAgdW5jaGFuZ2VkOiAwLFxuICAgIGZyb3plbjogMSxcbiAgICBkZWxldGVkOiAyLFxufSk7XG5cbmNvbnN0IHNraXBSZWFzb24gPSB1OGVudW0oJ1NraXBSZWFzb24nLCB7XG4gICAgbm9TdGF0ZTogMCxcbiAgICBiYWRTdGF0ZTogMSxcbiAgICBub0dhczogMixcbn0pO1xuXG5cbmNvbnN0IGFjY291bnRUeXBlID0gdThlbnVtKCdBY2NvdW50VHlwZScsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbn0pO1xuXG5jb25zdCBtZXNzYWdlVHlwZSA9IHU4ZW51bSgnTWVzc2FnZVR5cGUnLCB7XG4gICAgaW50ZXJuYWw6IDAsXG4gICAgZXh0SW46IDEsXG4gICAgZXh0T3V0OiAyLFxufSk7XG5cblxuY29uc3QgbWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ01lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcXVldWVkOiAxLFxuICAgIHByb2Nlc3Npbmc6IDIsXG4gICAgcHJlbGltaW5hcnk6IDMsXG4gICAgcHJvcG9zZWQ6IDQsXG4gICAgZmluYWxpemVkOiA1LFxuICAgIHJlZnVzZWQ6IDYsXG4gICAgdHJhbnNpdGluZzogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblR5cGUgPSB1OGVudW0oJ1RyYW5zYWN0aW9uVHlwZScsIHtcbiAgICBvcmRpbmFyeTogMCxcbiAgICBzdG9yYWdlOiAxLFxuICAgIHRpY2s6IDIsXG4gICAgdG9jazogMyxcbiAgICBzcGxpdFByZXBhcmU6IDQsXG4gICAgc3BsaXRJbnN0YWxsOiA1LFxuICAgIG1lcmdlUHJlcGFyZTogNixcbiAgICBtZXJnZUluc3RhbGw6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdUcmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcmVsaW1pbmFyeTogMSxcbiAgICBwcm9wb3NlZDogMixcbiAgICBmaW5hbGl6ZWQ6IDMsXG4gICAgcmVmdXNlZDogNCxcbn0pO1xuXG5jb25zdCBjb21wdXRlVHlwZSA9IHU4ZW51bSgnQ29tcHV0ZVR5cGUnLCB7XG4gICAgc2tpcHBlZDogMCxcbiAgICB2bTogMSxcbn0pO1xuXG5jb25zdCBib3VuY2VUeXBlID0gdThlbnVtKCdCb3VuY2VUeXBlJywge1xuICAgIG5lZ0Z1bmRzOiAwLFxuICAgIG5vRnVuZHM6IDEsXG4gICAgb2s6IDIsXG59KTtcblxuY29uc3QgYmxvY2tQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdCbG9ja1Byb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcm9wb3NlZDogMSxcbiAgICBmaW5hbGl6ZWQ6IDIsXG4gICAgcmVmdXNlZDogMyxcbn0pO1xuXG5cbmNvbnN0IGluTXNnVHlwZSA9IHU4ZW51bSgnSW5Nc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGlocjogMSxcbiAgICBpbW1lZGlhdGVseTogMixcbiAgICBmaW5hbDogMyxcbiAgICB0cmFuc2l0OiA0LFxuICAgIGRpc2NhcmRlZEZpbmFsOiA1LFxuICAgIGRpc2NhcmRlZFRyYW5zaXQ6IDYsXG59KTtcblxuY29uc3Qgb3V0TXNnVHlwZSA9IHU4ZW51bSgnT3V0TXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpbW1lZGlhdGVseTogMSxcbiAgICBvdXRNc2dOZXc6IDIsXG4gICAgdHJhbnNpdDogMyxcbiAgICBkZXF1ZXVlSW1tZWRpYXRlbHk6IDQsXG4gICAgZGVxdWV1ZTogNSxcbiAgICB0cmFuc2l0UmVxdWlyZWQ6IDYsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZShkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdTMyKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICBsdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ubHQpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19oYXNoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcbiAgICBub3c6IHUzMihkb2NzLnRyYW5zYWN0aW9uLm5vdyksXG4gICAgb3V0bXNnX2NudDogaTMyKGRvY3MudHJhbnNhY3Rpb24ub3V0bXNnX2NudCksXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5vcmlnX3N0YXR1cyksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLmVuZF9zdGF0dXMpLFxuICAgIGluX21zZzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uaW5fbXNnKSxcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJyksXG4gICAgb3V0X21zZ3M6IGFycmF5T2Yoc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub3V0X21zZ3MpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlcyksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzX290aGVyKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub2xkX2hhc2gpLFxuICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5uZXdfaGFzaCksXG4gICAgY3JlZGl0X2ZpcnN0OiBib29sKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0X2ZpcnN0KSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdGF0dXNfY2hhbmdlKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0KSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXRfb3RoZXIpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5jb21wdXRlX3R5cGUpKSxcbiAgICAgICAgc2tpcHBlZF9yZWFzb246IHNraXBSZWFzb24oZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnNraXBwZWRfcmVhc29uKSxcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc3VjY2VzcyksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2ZlZXMpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfdXNlZCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfbGltaXQpLFxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19jcmVkaXQpLFxuICAgICAgICBtb2RlOiBpOChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubW9kZSksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2NvZGUpLFxuICAgICAgICBleGl0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2FyZyksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX3N0ZXBzKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCksXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdWNjZXNzKSxcbiAgICAgICAgdmFsaWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udmFsaWQpLFxuICAgICAgICBub19mdW5kczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5ub19mdW5kcyksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3RhdHVzX2NoYW5nZSksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9md2RfZmVlcyksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcyksXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2NvZGUpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2FyZyksXG4gICAgICAgIHRvdF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90X2FjdGlvbnMpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zcGVjX2FjdGlvbnMpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5za2lwcGVkX2FjdGlvbnMpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5tc2dzX2NyZWF0ZWQpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cyksXG4gICAgfSxcbiAgICBib3VuY2U6IHtcbiAgICAgICAgYm91bmNlX3R5cGU6IHJlcXVpcmVkKGJvdW5jZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuYm91bmNlX3R5cGUpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9iaXRzKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5yZXFfZndkX2ZlZXMpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX2ZlZXMpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuZndkX2ZlZXMpLFxuICAgIH0sXG4gICAgYWJvcnRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFib3J0ZWQpLFxuICAgIGRlc3Ryb3llZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmRlc3Ryb3llZCksXG4gICAgdHQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnR0KSxcbiAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uY3VyX3NoYXJkX3BmeF9sZW4pLFxuICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8udGhpc19hZGRyKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkciksXG4gICAgfSxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmVwYXJlX3RyYW5zYWN0aW9uKSxcbiAgICBpbnN0YWxsZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5pbnN0YWxsZWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ib2MpLFxufTtcblxuLy8gQkxPQ0sgU0lHTkFUVVJFU1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1NldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2Nrc19zaWduYXR1cmVzJyB9LFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmcoXCJWYWxpZGF0b3IgSURcIiksXG4gICAgICAgIHI6IHN0cmluZyhcIidSJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICAgICAgczogc3RyaW5nKFwiJ3MnIHBhcnQgb2Ygc2lnbmF0dXJlXCIpLFxuICAgIH0sIFwiQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc1wiKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBFeHRCbGtSZWYgfSwgZG9jKTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiB1NjQoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnNcbiAgICAgICAgKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICB0cl9jb3VudDogaTMyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJfY291bnQpXG4gICAgfSksXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3KSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19kZXB0aCksXG4gICAgICAgIG9sZDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfZGVwdGgpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLnNoYXJkKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZSksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coZG9jcy5ibG9jay5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkKSxcbiAgICAgICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnIpLFxuICAgICAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXG4gICAgICAgIH0pLFxuICAgIH0sXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=