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
  workchain_id: (0, _dbSchemaTypes.i32)(),
  // TODO: add doc
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
  src_workchain_id: (0, _dbSchemaTypes.i32)(),
  // TODO: add doc
  dst_workchain_id: (0, _dbSchemaTypes.i32)(),
  // TODO: add doc
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
  workchain_id: (0, _dbSchemaTypes.i32)(),
  // TODO: add doc
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJkb2NzIiwiYWNjb3VudCIsIl8iLCJjb2xsZWN0aW9uIiwid29ya2NoYWluX2lkIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIkJsb2NrU2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJkb2MiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwibXNnIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0Iiwib3V0TXNnIiwic2hhcmREZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiZ2FzTGltaXRzUHJpY2VzIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiZ2FzIiwibHRfZGVsdGEiLCJibG9ja0xpbWl0cyIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwibXNnRm9yd2FyZFByaWNlcyIsIlZhbGlkYXRvclNldCIsInV0aW1lX3NpbmNlIiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwidmFsaWRhdG9yU2V0IiwiQmxvY2siLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInNoYXJkIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFHQTs7QUFnQkE7O0FBckNBOzs7Ozs7Ozs7Ozs7Ozs7SUF1Q1FBLE0sR0FBK0JDLFcsQ0FBL0JELE07SUFBUUUsSSxHQUF1QkQsVyxD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QUFYQSxXQVpHO0FBYUhRLE1BQUFBLGdCQUFnQixFQUFoQkEsZ0JBYkc7QUFjSFEsTUFBQUEsWUFBWSxFQUFaQTtBQWRHO0FBREg7QUFEWSxDQUF4QjtlQXFCZWdKLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYSc7XG5pbXBvcnQge1xuICAgIGdyYW1zLFxuICAgIGkzMixcbiAgICBpOCxcbiAgICBqb2luLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgcmVxdWlyZWQsXG4gICAgdTE2LFxuICAgIHUzMixcbiAgICB1NjQsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHdpdGhEb2Ncbn0gZnJvbSBcIi4vZGItc2NoZW1hLXR5cGVzXCI7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmFjY291bnQuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMigpLCAvLyBUT0RPOiBhZGQgZG9jXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgc3JjOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKCksIC8vIFRPRE86IGFkZCBkb2NcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoKSwgLy8gVE9ETzogYWRkIGRvY1xuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdTMyKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMigpLCAvLyBUT0RPOiBhZGQgZG9jXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogdTY0KCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdTMyKGRvY3Muc2hhcmREZXNjci5nZW5fdXRpbWUpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZShkb2NzLnNoYXJkRGVzY3Iuc3BsaXRfdHlwZSksXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWQpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlciksXG59LCBkb2MpO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBnYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBnYXNfY3JlZGl0OiBzdHJpbmcoKSxcbiAgICBibG9ja19nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19wcmljZTogc3RyaW5nKCksXG59O1xuXG5jb25zdCBnYXNMaW1pdHNQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBHYXNMaW1pdHNQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XG4gICAgYnl0ZXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgZ2FzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGx0X2RlbHRhOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxufTtcblxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGx1bXBfcHJpY2U6IHN0cmluZygpLFxuICAgIGJpdF9wcmljZTogc3RyaW5nKCksXG4gICAgY2VsbF9wcmljZTogc3RyaW5nKCksXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXG4gICAgZmlyc3RfZnJhYzogdTE2KCksXG4gICAgbmV4dF9mcmFjOiB1MTYoKSxcbn07XG5cbmNvbnN0IG1zZ0ZvcndhcmRQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBNc2dGb3J3YXJkUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IFZhbGlkYXRvclNldDogVHlwZURlZiA9IHtcbiAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgdXRpbWVfdW50aWw6IHUzMigpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHN0cmluZygpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiBzdHJpbmcoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKGRvY3MuYmxvY2suc3RhdHVzKSxcbiAgICBnbG9iYWxfaWQ6IHUzMihkb2NzLmJsb2NrLmdsb2JhbF9pZCksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2suc2VxX25vKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbChkb2NzLmJsb2NrLmFmdGVyX21lcmdlKSxcbiAgICBnZW5fdXRpbWU6IGkzMihkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWQpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyKSxcbiAgICAgICAgbWludGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlciksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coZG9jcy5ibG9jay5pbl9tc2dfZGVzY3IpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZyhkb2NzLmJsb2NrLnJhbmRfc2VlZCksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coZG9jcy5ibG9jay5vdXRfbXNnX2Rlc2NyKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgbHQ6IHU2NCgpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zXG4gICAgICAgICksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KVxuICAgIH0pLFxuICAgIHRyX2NvdW50OiBpMzIoKSwgLy8gVE9ETzogZG9jXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ldyksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgpLFxuICAgICAgICBvbGQ6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGQpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgb2xkX2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2RlcHRoKVxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjciksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlciksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCksXG4gICAgICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnMpLFxuICAgICAgICB9KSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAwKSxcbiAgICAgICAgICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcbiAgICAgICAgICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICAgICAgICAgIHAzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzKSxcbiAgICAgICAgICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA4Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxuICAgICAgICAgICAgcDEyOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IHUzMigpLFxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1heF9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBhY2NlcHRfbXNnczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGZsYWdzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiYXNpYzogYm9vbCgpLFxuICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGkzMigpLFxuICAgICAgICAgICAgICAgIHZtX21vZGU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiB1MTYoKSxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogdTMyKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEyLl9kb2MpLFxuICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNC5fZG9jLFxuICAgICAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNS5fZG9jLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzdGFrZV9oZWxkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtaW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE3OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNy5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE4OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19iaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxOC5fZG9jKSxcbiAgICAgICAgICAgIHAyMDogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjApLFxuICAgICAgICAgICAgcDIxOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMSksXG4gICAgICAgICAgICBwMjI6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjIpLFxuICAgICAgICAgICAgcDIzOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIzKSxcbiAgICAgICAgICAgIHAyNDogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI0KSxcbiAgICAgICAgICAgIHAyNTogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI1KSxcbiAgICAgICAgICAgIHAyODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjguX2RvYyxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI5Ll9kb2MsXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgICAgICAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICAgICAgICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgICAgICAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICAgICAgICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXRcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHNjaGVtYTtcbiJdfQ==