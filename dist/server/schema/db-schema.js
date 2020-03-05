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
  msg_id: string(),
  ihr_fee: (0, _dbSchemaTypes.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _dbSchemaTypes.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _dbSchemaTypes.grams)(),
  transaction_id: string(),
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
    min_shard_gen_utime: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.master.min_shard_gen_utime),
    max_shard_gen_utime: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.master.max_shard_gen_utime),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJCbG9jayIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFH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UyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5hY2NvdW50LndvcmtjaGFpbl9pZCksXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgc3JjOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLmRzdF93b3JrY2hhaW5faWQpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdTMyKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHN0cmluZygpLFxuICAgIGdhc19saW1pdDogc3RyaW5nKCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGdhc19jcmVkaXQ6IHN0cmluZygpLFxuICAgIGJsb2NrX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogc3RyaW5nKCksXG4gICAgYml0X3ByaWNlOiBzdHJpbmcoKSxcbiAgICBjZWxsX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICB1dGltZV91bnRpbDogdTMyKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogc3RyaW5nKCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHN0cmluZygpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1MzIoZG9jcy5ibG9jay5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHUzMihkb2NzLmJsb2NrLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLnNoYXJkKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZSksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coZG9jcy5ibG9jay5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkKSxcbiAgICAgICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnIpLFxuICAgICAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXG4gICAgICAgIH0pLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgcDA6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDApLFxuICAgICAgICAgICAgcDE6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEpLFxuICAgICAgICAgICAgcDI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIpLFxuICAgICAgICAgICAgcDM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMpLFxuICAgICAgICAgICAgcDQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDQpLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDYuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA3OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA3Ll9kb2MpLFxuICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDguX2RvYyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDkuX2RvYyksXG4gICAgICAgICAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgICAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgICAgICAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICAgICAgICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgICAgICAgICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgICAgICAgICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGZhc3RfYXR0ZW1wdHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGF0dGVtcHRfZHVyYXRpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9jb2xsYXRlZF9ieXRlczogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMzE6IGFycmF5T2Yoc3RyaW5nKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzEuX2RvYyksXG4gICAgICAgICAgICBwMzI6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMyKSxcbiAgICAgICAgICAgIHAzMzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzMpLFxuICAgICAgICAgICAgcDM0OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNCksXG4gICAgICAgICAgICBwMzU6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM1KSxcbiAgICAgICAgICAgIHAzNjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzYpLFxuICAgICAgICAgICAgcDM3OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNyksXG4gICAgICAgICAgICBwMzk6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzZXFubzogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM5Ll9kb2MpLFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaWduYXR1cmVzOiBqb2luKHsgQmxvY2tTaWduYXR1cmVzIH0sICdpZCcpLFxufTtcblxuLy9Sb290IHNjaGVtZSBkZWNsYXJhdGlvblxuXG5jb25zdCBzY2hlbWE6IFR5cGVEZWYgPSB7XG4gICAgX2NsYXNzOiB7XG4gICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICBPdGhlckN1cnJlbmN5LFxuICAgICAgICAgICAgRXh0QmxrUmVmLFxuICAgICAgICAgICAgTXNnRW52ZWxvcGUsXG4gICAgICAgICAgICBJbk1zZyxcbiAgICAgICAgICAgIE91dE1zZyxcbiAgICAgICAgICAgIE1lc3NhZ2UsXG4gICAgICAgICAgICBCbG9jayxcbiAgICAgICAgICAgIEFjY291bnQsXG4gICAgICAgICAgICBUcmFuc2FjdGlvbixcbiAgICAgICAgICAgIEJsb2NrU2lnbmF0dXJlcyxcbiAgICAgICAgICAgIEdhc0xpbWl0c1ByaWNlcyxcbiAgICAgICAgICAgIEJsb2NrTGltaXRzLFxuICAgICAgICAgICAgTXNnRm9yd2FyZFByaWNlcyxcbiAgICAgICAgICAgIFZhbGlkYXRvclNldFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19