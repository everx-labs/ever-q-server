"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

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
const {
  string,
  bool,
  ref,
  arrayOf
} = _schema.Def;
const accountStatus = (0, _dbSchemaTypes.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
const accountStatusChange = (0, _dbSchemaTypes.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
const skipReason = (0, _dbSchemaTypes.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
const accountType = (0, _dbSchemaTypes.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
const messageType = (0, _dbSchemaTypes.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
const messageProcessingStatus = (0, _dbSchemaTypes.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
const transactionType = (0, _dbSchemaTypes.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
const transactionProcessingStatus = (0, _dbSchemaTypes.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
const computeType = (0, _dbSchemaTypes.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
const bounceType = (0, _dbSchemaTypes.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
const blockProcessingStatus = (0, _dbSchemaTypes.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
const inMsgType = (0, _dbSchemaTypes.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  final: 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
const outMsgType = (0, _dbSchemaTypes.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
const splitType = (0, _dbSchemaTypes.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
const Account = {
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
const Message = {
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
const Transaction = {
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
    Message
  }, 'in_msg'),
  out_msgs: arrayOf(string(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message
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

const BlockSignatures = {
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

const ExtBlkRef = {
  end_lt: (0, _dbSchemaTypes.u64)(),
  seq_no: (0, _dbSchemaTypes.u32)(),
  root_hash: string(),
  file_hash: string()
};

const extBlkRef = doc => ref({
  ExtBlkRef
}, doc);

const MsgEnvelope = {
  msg_id: string(),
  next_addr: string(),
  cur_addr: string(),
  fwd_fee_remaining: (0, _dbSchemaTypes.grams)()
};

const msgEnvelope = () => ref({
  MsgEnvelope
});

const InMsg = {
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

const inMsg = doc => ref({
  InMsg
}, doc);

const OutMsg = {
  msg_type: (0, _dbSchemaTypes.required)(outMsgType()),
  msg_id: string(),
  transaction_id: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _dbSchemaTypes.u64)()
};

const outMsg = doc => ref({
  OutMsg
}, doc);

const shardDescr = doc => (0, _dbSchemaTypes.withDoc)({
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

const GasLimitsPrices = {
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

const gasLimitsPrices = doc => ref({
  GasLimitsPrices
}, doc);

const BlockLimits = {
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

const blockLimits = doc => ref({
  BlockLimits
}, doc);

const MsgForwardPrices = {
  lump_price: string(),
  bit_price: string(),
  cell_price: string(),
  ihr_price_factor: (0, _dbSchemaTypes.u32)(),
  first_frac: (0, _dbSchemaTypes.u16)(),
  next_frac: (0, _dbSchemaTypes.u16)()
};

const msgForwardPrices = doc => ref({
  MsgForwardPrices
}, doc);

const ValidatorSet = {
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

const validatorSet = doc => ref({
  ValidatorSet
}, doc);

const Block = {
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
    new: string(_dbShema.docs.block.state_update.new),
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
    BlockSignatures
  }, 'id')
}; //Root scheme declaration

const schema = {
  _class: {
    types: {
      OtherCurrency: _dbSchemaTypes.OtherCurrency,
      ExtBlkRef,
      MsgEnvelope,
      InMsg,
      OutMsg,
      Message,
      Block,
      Account,
      Transaction,
      BlockSignatures,
      GasLimitsPrices,
      BlockLimits,
      MsgForwardPrices,
      ValidatorSet
    }
  }
};
var _default = schema;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJtc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJCbG9jayIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJjYXBhYmlsaXRpZXMiLCJwOSIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBR0E7O0FBZ0JBOztBQXJDQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUNBLE1B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RXhZLE1BQU0sRUFGZDtBQUdUeVksUUFBQUEsS0FBSyxFQUFFLHlCQUhFO0FBSVRDLFFBQUFBLFdBQVcsRUFBRSx5QkFKSjtBQUtUQyxRQUFBQSxXQUFXLEVBQUUzWSxNQUFNLEVBTFY7QUFNVDRZLFFBQUFBLFdBQVcsRUFBRTVZLE1BQU07QUFOVixPQUFELEVBT1RvRSxjQUFLa00sS0FBTCxDQUFXd0MsTUFBWCxDQUFrQlcsTUFBbEIsQ0FBeUI4RSxHQUF6QixDQUE2QnBVLElBUHBCO0FBeEdSO0FBckJKLEdBeEVXO0FBK01uQitHLEVBQUFBLFVBQVUsRUFBRSx5QkFBSztBQUFFRCxJQUFBQTtBQUFGLEdBQUwsRUFBMEIsSUFBMUI7QUEvTU8sQ0FBdkIsQyxDQWtOQTs7QUFFQSxNQUFNNE4sTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSDFOLE1BQUFBLFNBRkc7QUFHSE8sTUFBQUEsV0FIRztBQUlITSxNQUFBQSxLQUpHO0FBS0hRLE1BQUFBLE1BTEc7QUFNSHRILE1BQUFBLE9BTkc7QUFPSGdMLE1BQUFBLEtBUEc7QUFRSG5NLE1BQUFBLE9BUkc7QUFTSHVDLE1BQUFBLFdBVEc7QUFVSHdFLE1BQUFBLGVBVkc7QUFXSGlELE1BQUFBLGVBWEc7QUFZSFMsTUFBQUEsV0FaRztBQWFIUSxNQUFBQSxnQkFiRztBQWNIUSxNQUFBQTtBQWRHO0FBREg7QUFEWSxDQUF4QjtlQXFCZWtKLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFNjaGVtYURvYywgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYSc7XG5pbXBvcnQge1xuICAgIGdyYW1zLFxuICAgIGkzMixcbiAgICBpOCxcbiAgICBqb2luLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgcmVxdWlyZWQsXG4gICAgdTE2LFxuICAgIHUzMixcbiAgICB1NjQsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHdpdGhEb2Ncbn0gZnJvbSBcIi4vZGItc2NoZW1hLXR5cGVzXCI7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmFjY291bnQuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmFjY291bnQud29ya2NoYWluX2lkKSxcbiAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFR5cGUoZG9jcy5hY2NvdW50LmFjY190eXBlKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoZG9jcy5hY2NvdW50Lmxhc3RfcGFpZCkpLFxuICAgIGR1ZV9wYXltZW50OiBncmFtcyhkb2NzLmFjY291bnQuZHVlX3BheW1lbnQpLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NChkb2NzLmFjY291bnQubGFzdF90cmFuc19sdCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKGRvY3MuYWNjb3VudC5iYWxhbmNlKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5hY2NvdW50LmJhbGFuY2Vfb3RoZXIpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLmFjY291bnQuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5hY2NvdW50LnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5hY2NvdW50LnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnkpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5hY2NvdW50LnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmFjY291bnQuYm9jKSxcbn07XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5tZXNzYWdlLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKGRvY3MubWVzc2FnZS5tc2dfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQobWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMoZG9jcy5tZXNzYWdlLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiByZXF1aXJlZChzdHJpbmcoZG9jcy5tZXNzYWdlLmJsb2NrX2lkKSksXG4gICAgYm9keTogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5KSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5tZXNzYWdlLnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MubWVzc2FnZS50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MubWVzc2FnZS50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5KSxcbiAgICBzcmM6IHN0cmluZyhkb2NzLm1lc3NhZ2Uuc3JjKSxcbiAgICBkc3Q6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZHN0KSxcbiAgICBzcmNfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLnNyY193b3JrY2hhaW5faWQpLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2UuZHN0X3dvcmtjaGFpbl9pZCksXG4gICAgY3JlYXRlZF9sdDogdTY0KGRvY3MubWVzc2FnZS5jcmVhdGVkX2x0KSxcbiAgICBjcmVhdGVkX2F0OiB1MzIoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfYXQpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbChkb2NzLm1lc3NhZ2UuaWhyX2Rpc2FibGVkKSxcbiAgICBpaHJfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaWhyX2ZlZSksXG4gICAgZndkX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmZ3ZF9mZWUpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5pbXBvcnRfZmVlKSxcbiAgICBib3VuY2U6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZSksXG4gICAgYm91bmNlZDogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlZCksXG4gICAgdmFsdWU6IGdyYW1zKGRvY3MubWVzc2FnZS52YWx1ZSksXG4gICAgdmFsdWVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MubWVzc2FnZS52YWx1ZV9vdGhlciksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLm1lc3NhZ2UucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2MpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MudHJhbnNhY3Rpb24ud29ya2NoYWluX2lkKSxcbiAgICBsdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ubHQpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19oYXNoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcbiAgICBub3c6IHUzMihkb2NzLnRyYW5zYWN0aW9uLm5vdyksXG4gICAgb3V0bXNnX2NudDogaTMyKGRvY3MudHJhbnNhY3Rpb24ub3V0bXNnX2NudCksXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5vcmlnX3N0YXR1cyksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLmVuZF9zdGF0dXMpLFxuICAgIGluX21zZzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uaW5fbXNnKSxcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJyksXG4gICAgb3V0X21zZ3M6IGFycmF5T2Yoc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub3V0X21zZ3MpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlcyksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzX290aGVyKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub2xkX2hhc2gpLFxuICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5uZXdfaGFzaCksXG4gICAgY3JlZGl0X2ZpcnN0OiBib29sKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0X2ZpcnN0KSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdGF0dXNfY2hhbmdlKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0KSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXRfb3RoZXIpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5jb21wdXRlX3R5cGUpKSxcbiAgICAgICAgc2tpcHBlZF9yZWFzb246IHNraXBSZWFzb24oZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnNraXBwZWRfcmVhc29uKSxcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc3VjY2VzcyksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2ZlZXMpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfdXNlZCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfbGltaXQpLFxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19jcmVkaXQpLFxuICAgICAgICBtb2RlOiBpOChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubW9kZSksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2NvZGUpLFxuICAgICAgICBleGl0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2FyZyksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX3N0ZXBzKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCksXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdWNjZXNzKSxcbiAgICAgICAgdmFsaWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udmFsaWQpLFxuICAgICAgICBub19mdW5kczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5ub19mdW5kcyksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3RhdHVzX2NoYW5nZSksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9md2RfZmVlcyksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcyksXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2NvZGUpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2FyZyksXG4gICAgICAgIHRvdF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90X2FjdGlvbnMpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zcGVjX2FjdGlvbnMpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5za2lwcGVkX2FjdGlvbnMpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5tc2dzX2NyZWF0ZWQpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cyksXG4gICAgfSxcbiAgICBib3VuY2U6IHtcbiAgICAgICAgYm91bmNlX3R5cGU6IHJlcXVpcmVkKGJvdW5jZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuYm91bmNlX3R5cGUpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9iaXRzKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5yZXFfZndkX2ZlZXMpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX2ZlZXMpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuZndkX2ZlZXMpLFxuICAgIH0sXG4gICAgYWJvcnRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFib3J0ZWQpLFxuICAgIGRlc3Ryb3llZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmRlc3Ryb3llZCksXG4gICAgdHQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnR0KSxcbiAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uY3VyX3NoYXJkX3BmeF9sZW4pLFxuICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8udGhpc19hZGRyKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkciksXG4gICAgfSxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmVwYXJlX3RyYW5zYWN0aW9uKSxcbiAgICBpbnN0YWxsZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5pbnN0YWxsZWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ib2MpLFxufTtcblxuLy8gQkxPQ0sgU0lHTkFUVVJFU1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1NldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2Nrc19zaWduYXR1cmVzJyB9LFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmcoXCJWYWxpZGF0b3IgSURcIiksXG4gICAgICAgIHI6IHN0cmluZyhcIidSJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICAgICAgczogc3RyaW5nKFwiJ3MnIHBhcnQgb2Ygc2lnbmF0dXJlXCIpLFxuICAgIH0sIFwiQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc1wiKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBFeHRCbGtSZWYgfSwgZG9jKTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiB1NjQoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHN0cmluZygpLFxuICAgIGdhc19saW1pdDogc3RyaW5nKCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGdhc19jcmVkaXQ6IHN0cmluZygpLFxuICAgIGJsb2NrX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogc3RyaW5nKCksXG4gICAgYml0X3ByaWNlOiBzdHJpbmcoKSxcbiAgICBjZWxsX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICB1dGltZV91bnRpbDogdTMyKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogc3RyaW5nKCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHN0cmluZygpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgICAgICAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgICAgICAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgICAgICAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICAgICAgICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxODogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IHUzMigpLFxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTguX2RvYyksXG4gICAgICAgICAgICBwMjA6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIwKSxcbiAgICAgICAgICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgICAgICAgICAgcDIyOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIyKSxcbiAgICAgICAgICAgIHAyMzogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMyksXG4gICAgICAgICAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgICAgICAgICBwMjU6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNSksXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOS5fZG9jLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICAgICAgICAgIHAzMjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzIpLFxuICAgICAgICAgICAgcDMzOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMyksXG4gICAgICAgICAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICAgICAgICAgIHAzNTogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzUpLFxuICAgICAgICAgICAgcDM2OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNiksXG4gICAgICAgICAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICAgICAgICAgIHAzOTogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNlcW5vOiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogdTMyKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzkuX2RvYyksXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=