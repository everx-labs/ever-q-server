"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _dbSchemaTypes = require("./db-schema-types");

var _dbShema = require("./db.shema.docs");

/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.account.workchain_id),
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
  src_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.src_workchain_id),
  dst_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.dst_workchain_id),
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
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.workchain_id),
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

var GasLimitsPrices = {
  gas_price: string(),
  gas_limit: string(),
  special_gas_limit: string(),
  gas_credit: string(),
  block_gas_limit: string(),
  freeze_due_limit: string(),
  delete_due_limit: string(),
  flat_gas_limit: string(),
  flat_gas_price: string()
};

var gasLimitsPrices = function gasLimitsPrices(doc) {
  return ref({
    GasLimitsPrices: GasLimitsPrices
  }, doc);
};

var BlockLimits = {
  bytes: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  },
  gas: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  },
  lt_delta: {
    underload: (0, _dbSchemaTypes.u32)(),
    soft_limit: (0, _dbSchemaTypes.u32)(),
    hard_limit: (0, _dbSchemaTypes.u32)()
  }
};

var blockLimits = function blockLimits(doc) {
  return ref({
    BlockLimits: BlockLimits
  }, doc);
};

var MsgForwardPrices = {
  lump_price: string(),
  bit_price: string(),
  cell_price: string(),
  ihr_price_factor: (0, _dbSchemaTypes.u32)(),
  first_frac: (0, _dbSchemaTypes.u16)(),
  next_frac: (0, _dbSchemaTypes.u16)()
};

var msgForwardPrices = function msgForwardPrices(doc) {
  return ref({
    MsgForwardPrices: MsgForwardPrices
  }, doc);
};

var ValidatorSet = {
  utime_since: (0, _dbSchemaTypes.u32)(),
  utime_until: (0, _dbSchemaTypes.u32)(),
  total: (0, _dbSchemaTypes.u16)(),
  total_weight: string(),
  list: arrayOf({
    public_key: string(),
    weight: string(),
    adnl_addr: string()
  })
};

var validatorSet = function validatorSet(doc) {
  return ref({
    ValidatorSet: ValidatorSet
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
  prev_key_block_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.prev_key_block_seqno),
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
    }),
    config_addr: string(),
    config: {
      p0: string(_dbShema.docs.block.master.config.p0),
      p1: string(_dbShema.docs.block.master.config.p1),
      p2: string(_dbShema.docs.block.master.config.p2),
      p3: string(_dbShema.docs.block.master.config.p3),
      p4: string(_dbShema.docs.block.master.config.p4),
      p6: {
        _doc: _dbShema.docs.block.master.config.p6._doc,
        mint_new_price: string(),
        mint_add_price: string()
      },
      p7: arrayOf({
        currency: (0, _dbSchemaTypes.u32)(),
        value: string()
      }, _dbShema.docs.block.master.config.p7._doc),
      p8: {
        _doc: _dbShema.docs.block.master.config.p8._doc,
        version: (0, _dbSchemaTypes.u32)(),
        capabilities: string()
      },
      p9: arrayOf((0, _dbSchemaTypes.u32)(), _dbShema.docs.block.master.config.p9._doc),
      p12: arrayOf({
        workchain_id: (0, _dbSchemaTypes.i32)(),
        enabled_since: (0, _dbSchemaTypes.u32)(),
        actual_min_split: (0, _dbSchemaTypes.u8)(),
        min_split: (0, _dbSchemaTypes.u8)(),
        max_split: (0, _dbSchemaTypes.u8)(),
        active: bool(),
        accept_msgs: bool(),
        flags: (0, _dbSchemaTypes.u16)(),
        zerostate_root_hash: string(),
        zerostate_file_hash: string(),
        version: (0, _dbSchemaTypes.u32)(),
        basic: bool(),
        vm_version: (0, _dbSchemaTypes.i32)(),
        vm_mode: string(),
        min_addr_len: (0, _dbSchemaTypes.u16)(),
        max_addr_len: (0, _dbSchemaTypes.u16)(),
        addr_len_step: (0, _dbSchemaTypes.u16)(),
        workchain_type_id: (0, _dbSchemaTypes.u32)()
      }, _dbShema.docs.block.master.config.p12._doc),
      p14: {
        _doc: _dbShema.docs.block.master.config.p14._doc,
        masterchain_block_fee: string(),
        basechain_block_fee: string()
      },
      p15: {
        _doc: _dbShema.docs.block.master.config.p15._doc,
        validators_elected_for: (0, _dbSchemaTypes.u32)(),
        elections_start_before: (0, _dbSchemaTypes.u32)(),
        elections_end_before: (0, _dbSchemaTypes.u32)(),
        stake_held_for: (0, _dbSchemaTypes.u32)()
      },
      p16: {
        _doc: _dbShema.docs.block.master.config.p16._doc,
        max_validators: (0, _dbSchemaTypes.u16)(),
        max_main_validators: (0, _dbSchemaTypes.u16)(),
        min_validators: (0, _dbSchemaTypes.u16)()
      },
      p17: {
        _doc: _dbShema.docs.block.master.config.p17._doc,
        min_stake: string(),
        max_stake: string(),
        min_total_stake: string(),
        max_stake_factor: (0, _dbSchemaTypes.u32)()
      },
      p18: arrayOf({
        utime_since: (0, _dbSchemaTypes.u32)(),
        bit_price_ps: string(),
        cell_price_ps: string(),
        mc_bit_price_ps: string(),
        mc_cell_price_ps: string()
      }, _dbShema.docs.block.master.config.p18._doc),
      p20: gasLimitsPrices(_dbShema.docs.block.master.config.p20),
      p21: gasLimitsPrices(_dbShema.docs.block.master.config.p21),
      p22: blockLimits(_dbShema.docs.block.master.config.p22),
      p23: blockLimits(_dbShema.docs.block.master.config.p23),
      p24: msgForwardPrices(_dbShema.docs.block.master.config.p24),
      p25: msgForwardPrices(_dbShema.docs.block.master.config.p25),
      p28: {
        _doc: _dbShema.docs.block.master.config.p28._doc,
        mc_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_num: (0, _dbSchemaTypes.u32)()
      },
      p29: {
        _doc: _dbShema.docs.block.master.config.p29._doc,
        round_candidates: (0, _dbSchemaTypes.u32)(),
        next_candidate_delay_ms: (0, _dbSchemaTypes.u32)(),
        consensus_timeout_ms: (0, _dbSchemaTypes.u32)(),
        fast_attempts: (0, _dbSchemaTypes.u32)(),
        attempt_duration: (0, _dbSchemaTypes.u32)(),
        catchain_max_deps: (0, _dbSchemaTypes.u32)(),
        max_block_bytes: (0, _dbSchemaTypes.u32)(),
        max_collated_bytes: (0, _dbSchemaTypes.u32)()
      },
      p31: arrayOf(string(), _dbShema.docs.block.master.config.p31._doc),
      p32: validatorSet(_dbShema.docs.block.master.config.p32),
      p33: validatorSet(_dbShema.docs.block.master.config.p33),
      p34: validatorSet(_dbShema.docs.block.master.config.p34),
      p35: validatorSet(_dbShema.docs.block.master.config.p35),
      p36: validatorSet(_dbShema.docs.block.master.config.p36),
      p37: validatorSet(_dbShema.docs.block.master.config.p37),
      p39: arrayOf({
        adnl_addr: string(),
        temp_public_key: string(),
        seqno: (0, _dbSchemaTypes.u32)(),
        valid_until: (0, _dbSchemaTypes.u32)(),
        signature_r: string(),
        signature_s: string()
      }, _dbShema.docs.block.master.config.p39._doc)
    }
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
      BlockSignatures: BlockSignatures,
      GasLimitsPrices: GasLimitsPrices,
      BlockLimits: BlockLimits,
      MsgForwardPrices: MsgForwardPrices,
      ValidatorSet: ValidatorSet
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJkb2NzIiwiYWNjb3VudCIsIl8iLCJjb2xsZWN0aW9uIiwid29ya2NoYWluX2lkIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJkb2MiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwibXNnIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0Iiwib3V0TXNnIiwic2hhcmREZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiZ2FzTGltaXRzUHJpY2VzIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiZ2FzIiwibHRfZGVsdGEiLCJibG9ja0xpbWl0cyIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwibXNnRm9yd2FyZFByaWNlcyIsIlZhbGlkYXRvclNldCIsInV0aW1lX3NpbmNlIiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwidmFsaWRhdG9yU2V0IiwiQmxvY2siLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInNoYXJkIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwibWFzdGVyIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwicDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsInAxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsInAxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwicDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsInAxOCIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQWdCQTs7QUFyQ0E7Ozs7Ozs7Ozs7Ozs7OztJQXVDUUEsTSxHQUErQkMsVyxDQUEv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O0FBTUh0SCxNQUFBQSxPQUFPLEVBQVBBLE9BTkc7QUFPSGdMLE1BQUFBLEtBQUssRUFBTEEsS0FQRztBQVFIbk0sTUFBQUEsT0FBTyxFQUFQQSxPQVJHO0FBU0h1QyxNQUFBQSxXQUFXLEVBQVhBLFdBVEc7QUFVSHdFLE1BQUFBLGVBQWUsRUFBZkEsZUFWRztBQVdIaUQsTUFBQUEsZUFBZSxFQUFmQSxlQVhHO0FBWUhTLE1BQUFBLFdBQVcsRUFBWEEsV0FaRztBQWFIUSxNQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQWJHO0FBY0hRLE1BQUFBLFlBQVksRUFBWkE7QUFkRztBQURIO0FBRFksQ0FBeEI7ZUFxQmVpSixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcblxuaW1wb3J0IHR5cGUgeyBTY2hlbWFEb2MsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5hY2NvdW50LndvcmtjaGFpbl9pZCksXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgc3JjOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLmRzdF93b3JrY2hhaW5faWQpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdTMyKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogdTY0KCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdTMyKGRvY3Muc2hhcmREZXNjci5nZW5fdXRpbWUpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZShkb2NzLnNoYXJkRGVzY3Iuc3BsaXRfdHlwZSksXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWQpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlciksXG59LCBkb2MpO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBnYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBnYXNfY3JlZGl0OiBzdHJpbmcoKSxcbiAgICBibG9ja19nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19wcmljZTogc3RyaW5nKCksXG59O1xuXG5jb25zdCBnYXNMaW1pdHNQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBHYXNMaW1pdHNQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XG4gICAgYnl0ZXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgZ2FzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGx0X2RlbHRhOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxufTtcblxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGx1bXBfcHJpY2U6IHN0cmluZygpLFxuICAgIGJpdF9wcmljZTogc3RyaW5nKCksXG4gICAgY2VsbF9wcmljZTogc3RyaW5nKCksXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXG4gICAgZmlyc3RfZnJhYzogdTE2KCksXG4gICAgbmV4dF9mcmFjOiB1MTYoKSxcbn07XG5cbmNvbnN0IG1zZ0ZvcndhcmRQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBNc2dGb3J3YXJkUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IFZhbGlkYXRvclNldDogVHlwZURlZiA9IHtcbiAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgdXRpbWVfdW50aWw6IHUzMigpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHN0cmluZygpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiBzdHJpbmcoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKGRvY3MuYmxvY2suc3RhdHVzKSxcbiAgICBnbG9iYWxfaWQ6IHUzMihkb2NzLmJsb2NrLmdsb2JhbF9pZCksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2suc2VxX25vKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbChkb2NzLmJsb2NrLmFmdGVyX21lcmdlKSxcbiAgICBnZW5fdXRpbWU6IGkzMihkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHUzMihkb2NzLmJsb2NrLnByZXZfa2V5X2Jsb2NrX3NlcW5vKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnNcbiAgICAgICAgKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICB0cl9jb3VudDogaTMyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJfY291bnQpXG4gICAgfSksXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3KSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19kZXB0aCksXG4gICAgICAgIG9sZDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfZGVwdGgpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLnNoYXJkKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZSksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coZG9jcy5ibG9jay5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkKSxcbiAgICAgICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnIpLFxuICAgICAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXG4gICAgICAgIH0pLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgcDA6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDApLFxuICAgICAgICAgICAgcDE6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEpLFxuICAgICAgICAgICAgcDI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIpLFxuICAgICAgICAgICAgcDM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMpLFxuICAgICAgICAgICAgcDQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDQpLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDYuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA3OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA3Ll9kb2MpLFxuICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDguX2RvYyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDkuX2RvYyksXG4gICAgICAgICAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgICAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgICAgICAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICAgICAgICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgICAgICAgICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgICAgICAgICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGZhc3RfYXR0ZW1wdHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGF0dGVtcHRfZHVyYXRpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9jb2xsYXRlZF9ieXRlczogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMzE6IGFycmF5T2Yoc3RyaW5nKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzEuX2RvYyksXG4gICAgICAgICAgICBwMzI6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMyKSxcbiAgICAgICAgICAgIHAzMzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzMpLFxuICAgICAgICAgICAgcDM0OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNCksXG4gICAgICAgICAgICBwMzU6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM1KSxcbiAgICAgICAgICAgIHAzNjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzYpLFxuICAgICAgICAgICAgcDM3OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNyksXG4gICAgICAgICAgICBwMzk6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzZXFubzogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM5Ll9kb2MpLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaWduYXR1cmVzOiBqb2luKHsgQmxvY2tTaWduYXR1cmVzIH0sICdpZCcpLFxufTtcblxuLy9Sb290IHNjaGVtZSBkZWNsYXJhdGlvblxuXG5jb25zdCBzY2hlbWE6IFR5cGVEZWYgPSB7XG4gICAgX2NsYXNzOiB7XG4gICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICBPdGhlckN1cnJlbmN5LFxuICAgICAgICAgICAgRXh0QmxrUmVmLFxuICAgICAgICAgICAgTXNnRW52ZWxvcGUsXG4gICAgICAgICAgICBJbk1zZyxcbiAgICAgICAgICAgIE91dE1zZyxcbiAgICAgICAgICAgIE1lc3NhZ2UsXG4gICAgICAgICAgICBCbG9jayxcbiAgICAgICAgICAgIEFjY291bnQsXG4gICAgICAgICAgICBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICAgICAgICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICAgICAgICAgIEJsb2NrTGltaXRzLFxuICAgICAgICAgICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICAgICAgICAgIFZhbGlkYXRvclNldFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19