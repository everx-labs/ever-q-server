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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJkb2NzIiwiYWNjb3VudCIsIl8iLCJjb2xsZWN0aW9uIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJCbG9ja1NpZ25hdHVyZXMiLCJzaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiZXh0QmxrUmVmIiwiZG9jIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwibXNnRW52ZWxvcGUiLCJJbk1zZyIsIm1zZyIsInByb29mX2NyZWF0ZWQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsImluTXNnIiwiT3V0TXNnIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm91dE1zZyIsInNoYXJkRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJHYXNMaW1pdHNQcmljZXMiLCJnYXNfcHJpY2UiLCJzcGVjaWFsX2dhc19saW1pdCIsImJsb2NrX2dhc19saW1pdCIsImZyZWV6ZV9kdWVfbGltaXQiLCJkZWxldGVfZHVlX2xpbWl0IiwiZmxhdF9nYXNfbGltaXQiLCJmbGF0X2dhc19wcmljZSIsImdhc0xpbWl0c1ByaWNlcyIsIkJsb2NrTGltaXRzIiwiYnl0ZXMiLCJ1bmRlcmxvYWQiLCJzb2Z0X2xpbWl0IiwiaGFyZF9saW1pdCIsImdhcyIsImx0X2RlbHRhIiwiYmxvY2tMaW1pdHMiLCJNc2dGb3J3YXJkUHJpY2VzIiwibHVtcF9wcmljZSIsImJpdF9wcmljZSIsImNlbGxfcHJpY2UiLCJpaHJfcHJpY2VfZmFjdG9yIiwiZmlyc3RfZnJhYyIsIm5leHRfZnJhYyIsIm1zZ0ZvcndhcmRQcmljZXMiLCJWYWxpZGF0b3JTZXQiLCJ1dGltZV9zaW5jZSIsInV0aW1lX3VudGlsIiwidG90YWwiLCJ0b3RhbF93ZWlnaHQiLCJsaXN0IiwicHVibGljX2tleSIsIndlaWdodCIsImFkbmxfYWRkciIsInZhbGlkYXRvclNldCIsIkJsb2NrIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFHQTs7QUFnQkE7O0FBckNBOzs7Ozs7Ozs7Ozs7Ozs7SUF1Q1FBLE0sR0FBK0JDLFcsQ0FBL0JELE07SUFBUUUsSSxHQUF1QkQsVyxDQUF2QkMsSTtJQUFNQyxH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QmVrSixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcblxuaW1wb3J0IHR5cGUgeyBTY2hlbWFEb2MsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgc3JjOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgY3JlYXRlZF9sdDogdTY0KGRvY3MubWVzc2FnZS5jcmVhdGVkX2x0KSxcbiAgICBjcmVhdGVkX2F0OiB1MzIoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfYXQpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbChkb2NzLm1lc3NhZ2UuaWhyX2Rpc2FibGVkKSxcbiAgICBpaHJfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaWhyX2ZlZSksXG4gICAgZndkX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmZ3ZF9mZWUpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5pbXBvcnRfZmVlKSxcbiAgICBib3VuY2U6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZSksXG4gICAgYm91bmNlZDogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlZCksXG4gICAgdmFsdWU6IGdyYW1zKGRvY3MubWVzc2FnZS52YWx1ZSksXG4gICAgdmFsdWVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MubWVzc2FnZS52YWx1ZV9vdGhlciksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLm1lc3NhZ2UucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2MpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIGx0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5sdCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2hhc2gpLFxuICAgIHByZXZfdHJhbnNfbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfbHQpLFxuICAgIG5vdzogdTMyKGRvY3MudHJhbnNhY3Rpb24ubm93KSxcbiAgICBvdXRtc2dfY250OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5vdXRtc2dfY250KSxcbiAgICBvcmlnX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLm9yaWdfc3RhdHVzKSxcbiAgICBlbmRfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uZW5kX3N0YXR1cyksXG4gICAgaW5fbXNnOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5pbl9tc2cpLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oeyBNZXNzYWdlIH0sICdpbl9tc2cnKSxcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5vdXRfbXNncykpLFxuICAgIG91dF9tZXNzYWdlczogYXJyYXlPZihqb2luKHsgTWVzc2FnZSB9LCAnb3V0X21zZ3MnKSksXG4gICAgdG90YWxfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzKSxcbiAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXNfb3RoZXIpLFxuICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5vbGRfaGFzaCksXG4gICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm5ld19oYXNoKSxcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jcmVkaXRfZmlyc3QpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZSksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0YXR1c19jaGFuZ2UpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXQpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdF9vdGhlciksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmNvbXB1dGVfdHlwZSkpLFxuICAgICAgICBza2lwcGVkX3JlYXNvbjogc2tpcFJlYXNvbihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc2tpcHBlZF9yZWFzb24pLFxuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5zdWNjZXNzKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1zZ19zdGF0ZV91c2VkKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmFjY291bnRfYWN0aXZhdGVkKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfZmVlcyksXG4gICAgICAgIGdhc191c2VkOiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc191c2VkKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19saW1pdCksXG4gICAgICAgIGdhc19jcmVkaXQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2NyZWRpdCksXG4gICAgICAgIG1vZGU6IGk4KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tb2RlKSxcbiAgICAgICAgZXhpdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfY29kZSksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfYXJnKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fc3RlcHMpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoKSxcbiAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9maW5hbF9zdGF0ZV9oYXNoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN1Y2Nlc3MpLFxuICAgICAgICB2YWxpZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi52YWxpZCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm5vX2Z1bmRzKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdGF0dXNfY2hhbmdlKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzKSxcbiAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2FjdGlvbl9mZWVzKSxcbiAgICAgICAgcmVzdWx0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfY29kZSksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfYXJnKSxcbiAgICAgICAgdG90X2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RfYWN0aW9ucyksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNwZWNfYWN0aW9ucyksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNraXBwZWRfYWN0aW9ucyksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm1zZ3NfY3JlYXRlZCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5hY3Rpb25fbGlzdF9oYXNoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9iaXRzKSxcbiAgICB9LFxuICAgIGJvdW5jZToge1xuICAgICAgICBib3VuY2VfdHlwZTogcmVxdWlyZWQoYm91bmNlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5ib3VuY2VfdHlwZSkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2JpdHMpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLnJlcV9md2RfZmVlcyksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfZmVlcyksXG4gICAgICAgIGZ3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5md2RfZmVlcyksXG4gICAgfSxcbiAgICBhYm9ydGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWJvcnRlZCksXG4gICAgZGVzdHJveWVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uZGVzdHJveWVkKSxcbiAgICB0dDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24udHQpLFxuICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbiksXG4gICAgICAgIGFjY19zcGxpdF9kZXB0aDogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCksXG4gICAgICAgIHRoaXNfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby50aGlzX2FkZHIpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uc2libGluZ19hZGRyKSxcbiAgICB9LFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXBhcmVfdHJhbnNhY3Rpb24pLFxuICAgIGluc3RhbGxlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmluc3RhbGxlZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmJvYyksXG59O1xuXG4vLyBCTE9DSyBTSUdOQVRVUkVTXG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlczogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnU2V0IG9mIHZhbGlkYXRvclxcJ3Mgc2lnbmF0dXJlcyBmb3IgdGhlIEJsb2NrIHdpdGggY29ycmVzcG9uZCBpZCcsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgIG5vZGVfaWQ6IHN0cmluZyhcIlZhbGlkYXRvciBJRFwiKSxcbiAgICAgICAgcjogc3RyaW5nKFwiJ1InIHBhcnQgb2Ygc2lnbmF0dXJlXCIpLFxuICAgICAgICBzOiBzdHJpbmcoXCIncycgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgfSwgXCJBcnJheSBvZiBzaWduYXR1cmVzIGZyb20gYmxvY2sncyB2YWxpZGF0b3JzXCIpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEV4dEJsa1JlZiB9LCBkb2MpO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZygpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBpaHJfZmVlOiBncmFtcygpLFxuICAgIHByb29mX2NyZWF0ZWQ6IHN0cmluZygpLFxuICAgIGluX21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICBmd2RfZmVlOiBncmFtcygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgdHJhbnNpdF9mZWU6IGdyYW1zKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHU2NCgpLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGluTXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgSW5Nc2cgfSwgZG9jKTtcblxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChvdXRNc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgcmVpbXBvcnQ6IGluTXNnKCksXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbn07XG5cbmNvbnN0IG91dE1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE91dE1zZyB9LCBkb2MpO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnNlcV9ubyksXG4gICAgcmVnX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnJlZ19tY19zZXFubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3Iuc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5lbmRfbHQpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5yb290X2hhc2gpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5maWxlX2hhc2gpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX3NwbGl0KSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9tZXJnZSksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9tZXJnZSksXG4gICAgbnhfY2NfdXBkYXRlZDogYm9vbChkb2NzLnNoYXJkRGVzY3IubnhfY2NfdXBkYXRlZCksXG4gICAgZmxhZ3M6IHU4KGRvY3Muc2hhcmREZXNjci5mbGFncyksXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5uZXh0X3ZhbGlkYXRvcl9zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBnZW5fdXRpbWU6IHUzMihkb2NzLnNoYXJkRGVzY3IuZ2VuX3V0aW1lKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxuICAgIHNwbGl0OiB1MzIoZG9jcy5zaGFyZERlc2NyLnNwbGl0KSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIpLFxufSwgZG9jKTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGdhc19wcmljZTogc3RyaW5nKCksXG4gICAgZ2FzX2xpbWl0OiBzdHJpbmcoKSwgXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGdhc19jcmVkaXQ6IHN0cmluZygpLFxuICAgIGJsb2NrX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogc3RyaW5nKCksXG4gICAgYml0X3ByaWNlOiBzdHJpbmcoKSxcbiAgICBjZWxsX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICB1dGltZV91bnRpbDogdTMyKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogc3RyaW5nKCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHN0cmluZygpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgICAgICAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgICAgICAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgICAgICAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICAgICAgICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxODogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IHUzMigpLFxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTguX2RvYyksXG4gICAgICAgICAgICBwMjA6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIwKSxcbiAgICAgICAgICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgICAgICAgICAgcDIyOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIyKSxcbiAgICAgICAgICAgIHAyMzogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMyksXG4gICAgICAgICAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgICAgICAgICBwMjU6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNSksXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOS5fZG9jLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICAgICAgICAgIHAzMjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzIpLFxuICAgICAgICAgICAgcDMzOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMyksXG4gICAgICAgICAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICAgICAgICAgIHAzNTogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzUpLFxuICAgICAgICAgICAgcDM2OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNiksXG4gICAgICAgICAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICAgICAgICAgIHAzOTogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNlcW5vOiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogdTMyKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzkuX2RvYyksXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=