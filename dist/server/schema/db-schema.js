"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _schema = require("./schema.js");

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
  dequeueShort: 7,
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
  acc_type: (0, _dbSchemaTypes.required)(accountStatus(_dbShema.docs.account.acc_type)),
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
  code_hash: string(_dbShema.docs.account.code_hash),
  data: string(_dbShema.docs.account.data),
  data_hash: string(_dbShema.docs.account.data_hash),
  library: string(_dbShema.docs.account.library),
  library_hash: string(_dbShema.docs.account.library_hash),
  proof: string(_dbShema.docs.account.proof),
  boc: string(_dbShema.docs.account.boc),
  state_hash: string(_dbShema.docs.account.state_hash)
};
const Message = {
  _doc: _dbShema.docs.message._doc,
  _: {
    collection: 'messages'
  },
  msg_type: (0, _dbSchemaTypes.required)(messageType(_dbShema.docs.message.msg_type)),
  status: (0, _dbSchemaTypes.required)(messageProcessingStatus(_dbShema.docs.message.status)),
  block_id: (0, _dbSchemaTypes.required)(string(_dbShema.docs.message.block_id)),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
  body: string(_dbShema.docs.message.body),
  body_hash: string(_dbShema.docs.message.body_hash),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.message.split_depth),
  tick: bool(_dbShema.docs.message.tick),
  tock: bool(_dbShema.docs.message.tock),
  code: string(_dbShema.docs.message.code),
  code_hash: string(_dbShema.docs.message.code_hash),
  data: string(_dbShema.docs.message.data),
  data_hash: string(_dbShema.docs.message.data_hash),
  library: string(_dbShema.docs.message.library),
  library_hash: string(_dbShema.docs.message.library_hash),
  src: string(_dbShema.docs.message.src),
  dst: string(_dbShema.docs.message.dst),
  src_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.src_workchain_id),
  dst_workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.message.dst_workchain_id),
  created_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.message.created_lt),
  created_at: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.message.created_at),
  ihr_disabled: bool(_dbShema.docs.message.ihr_disabled),
  ihr_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.ihr_fee),
  fwd_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.fwd_fee),
  import_fee: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.import_fee),
  bounce: bool(_dbShema.docs.message.bounce),
  bounced: bool(_dbShema.docs.message.bounced),
  value: (0, _dbSchemaTypes.grams)(_dbShema.docs.message.value),
  value_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.message.value_other),
  proof: string(_dbShema.docs.message.proof),
  boc: string(_dbShema.docs.message.boc),
  src_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'out_msgs[*]', 'parent.created_lt !== \'00\' && parent.msg_type !== 1'),
  dst_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'in_msg', 'parent.msg_type !== 2')
};
const Transaction = {
  _doc: _dbShema.docs.transaction._doc,
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _dbSchemaTypes.required)(transactionType(_dbShema.docs.transaction.tr_type)),
  status: (0, _dbSchemaTypes.required)(transactionProcessingStatus(_dbShema.docs.transaction.status)),
  block_id: string(_dbShema.docs.transaction.block_id),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
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
  }, 'in_msg', 'id'),
  out_msgs: arrayOf(string(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message
  }, 'out_msgs', 'id')),
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
  boc: string(_dbShema.docs.transaction.boc),
  balance_delta: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.balance_delta),
  balance_delta_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.balance_delta)
}; // BLOCK SIGNATURES

const BlockSignatures = {
  _doc: _dbShema.docs.blockSignatures._doc,
  _: {
    collection: 'blocks_signatures'
  },
  gen_utime: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.blockSignatures.gen_utime),
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.seq_no),
  shard: string(_dbShema.docs.blockSignatures.shard),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.blockSignatures.workchain_id),
  proof: string(_dbShema.docs.blockSignatures.proof),
  validator_list_hash_short: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.validator_list_hash_short),
  catchain_seqno: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.catchain_seqno),
  sig_weight: (0, _dbSchemaTypes.u64)(_dbShema.docs.blockSignatures.sig_weight),
  signatures: arrayOf({
    node_id: string(),
    r: string(_dbShema.docs.blockSignatures.signatures.r),
    s: string(_dbShema.docs.blockSignatures.signatures.s)
  }, _dbShema.docs.blockSignatures.signatures._doc),
  block: (0, _dbSchemaTypes.join)('Block', 'id', 'id')
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
  import_block_lt: (0, _dbSchemaTypes.u64)(),
  msg_env_hash: string(),
  next_workchain: (0, _dbSchemaTypes.i32)(),
  next_addr_pfx: (0, _dbSchemaTypes.u64)()
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
  gen_utime: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.shardDescr.gen_utime),
  split_type: splitType(_dbShema.docs.shardDescr.split_type),
  split: (0, _dbSchemaTypes.u32)(_dbShema.docs.shardDescr.split),
  fees_collected: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.fees_collected),
  fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.fees_collected_other),
  funds_created: (0, _dbSchemaTypes.grams)(_dbShema.docs.shardDescr.funds_created),
  funds_created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.shardDescr.funds_created_other)
}, doc);

const GasLimitsPrices = {
  gas_price: (0, _dbSchemaTypes.u64)(),
  gas_limit: (0, _dbSchemaTypes.u64)(),
  special_gas_limit: (0, _dbSchemaTypes.u64)(),
  gas_credit: (0, _dbSchemaTypes.u64)(),
  block_gas_limit: (0, _dbSchemaTypes.u64)(),
  freeze_due_limit: (0, _dbSchemaTypes.u64)(),
  delete_due_limit: (0, _dbSchemaTypes.u64)(),
  flat_gas_limit: (0, _dbSchemaTypes.u64)(),
  flat_gas_price: (0, _dbSchemaTypes.u64)()
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
  lump_price: (0, _dbSchemaTypes.u64)(),
  bit_price: (0, _dbSchemaTypes.u64)(),
  cell_price: (0, _dbSchemaTypes.u64)(),
  ihr_price_factor: (0, _dbSchemaTypes.u32)(),
  first_frac: (0, _dbSchemaTypes.u16)(),
  next_frac: (0, _dbSchemaTypes.u16)()
};

const msgForwardPrices = doc => ref({
  MsgForwardPrices
}, doc);

const ValidatorSet = {
  utime_since: (0, _dbSchemaTypes.unixSeconds)(),
  utime_until: (0, _dbSchemaTypes.unixSeconds)(),
  total: (0, _dbSchemaTypes.u16)(),
  total_weight: (0, _dbSchemaTypes.u64)(),
  list: arrayOf({
    public_key: string(),
    weight: (0, _dbSchemaTypes.u64)(),
    adnl_addr: string()
  })
};

const validatorSet = doc => ref({
  ValidatorSet
}, doc);

const ConfigProposalSetup = {
  min_tot_rounds: (0, _dbSchemaTypes.u8)(),
  max_tot_rounds: (0, _dbSchemaTypes.u8)(),
  min_wins: (0, _dbSchemaTypes.u8)(),
  max_losses: (0, _dbSchemaTypes.u8)(),
  min_store_sec: (0, _dbSchemaTypes.u32)(),
  max_store_sec: (0, _dbSchemaTypes.u32)(),
  bit_price: (0, _dbSchemaTypes.u32)(),
  cell_price: (0, _dbSchemaTypes.u32)()
};

const configProposalSetup = doc => ref({
  ConfigProposalSetup
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
  gen_utime: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.block.gen_utime),
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
  gen_software_version: (0, _dbSchemaTypes.u32)(_dbShema.docs.block.gen_software_version),
  gen_software_capabilities: string(_dbShema.docs.block.gen_software_capabilities),
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
  created_by: string(_dbShema.docs.block.created_by),
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
    min_shard_gen_utime: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.block.master.min_shard_gen_utime),
    max_shard_gen_utime: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.block.master.max_shard_gen_utime),
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
      p10: arrayOf((0, _dbSchemaTypes.u32)(), _dbShema.docs.block.master.config.p10._doc),
      p11: {
        _doc: _dbShema.docs.block.master.config.p11._doc,
        normal_params: configProposalSetup(_dbShema.docs.block.master.config.p11.normal_params),
        critical_params: configProposalSetup(_dbShema.docs.block.master.config.p11.critical_params)
      },
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
        masterchain_block_fee: (0, _dbSchemaTypes.grams)(),
        basechain_block_fee: (0, _dbSchemaTypes.grams)()
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
        min_stake: (0, _dbSchemaTypes.u128)(),
        max_stake: (0, _dbSchemaTypes.u128)(),
        min_total_stake: (0, _dbSchemaTypes.u128)(),
        max_stake_factor: (0, _dbSchemaTypes.u32)()
      },
      p18: arrayOf({
        utime_since: (0, _dbSchemaTypes.unixSeconds)(),
        bit_price_ps: (0, _dbSchemaTypes.u64)(),
        cell_price_ps: (0, _dbSchemaTypes.u64)(),
        mc_bit_price_ps: (0, _dbSchemaTypes.u64)(),
        mc_cell_price_ps: (0, _dbSchemaTypes.u64)()
      }, _dbShema.docs.block.master.config.p18._doc),
      p20: gasLimitsPrices(_dbShema.docs.block.master.config.p20),
      p21: gasLimitsPrices(_dbShema.docs.block.master.config.p21),
      p22: blockLimits(_dbShema.docs.block.master.config.p22),
      p23: blockLimits(_dbShema.docs.block.master.config.p23),
      p24: msgForwardPrices(_dbShema.docs.block.master.config.p24),
      p25: msgForwardPrices(_dbShema.docs.block.master.config.p25),
      p28: {
        _doc: _dbShema.docs.block.master.config.p28._doc,
        shuffle_mc_validators: bool(),
        mc_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_catchain_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_lifetime: (0, _dbSchemaTypes.u32)(),
        shard_validators_num: (0, _dbSchemaTypes.u32)()
      },
      p29: {
        _doc: _dbShema.docs.block.master.config.p29._doc,
        new_catchain_ids: bool(),
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
  key_block: bool(_dbShema.docs.block.key_block),
  boc: string(_dbShema.docs.block.boc),
  signatures: (0, _dbSchemaTypes.join)({
    BlockSignatures
  }, 'id', 'id')
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
      ValidatorSet,
      ConfigProposalSetup
    }
  }
};
var _default = schema;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJzdHJpbmciLCJib29sIiwicmVmIiwiYXJyYXlPZiIsIkRlZiIsImFjY291bnRTdGF0dXMiLCJ1bmluaXQiLCJhY3RpdmUiLCJmcm96ZW4iLCJub25FeGlzdCIsImFjY291bnRTdGF0dXNDaGFuZ2UiLCJ1bmNoYW5nZWQiLCJkZWxldGVkIiwic2tpcFJlYXNvbiIsIm5vU3RhdGUiLCJiYWRTdGF0ZSIsIm5vR2FzIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwiZmluYWwiLCJ0cmFuc2l0IiwiZGlzY2FyZGVkRmluYWwiLCJkaXNjYXJkZWRUcmFuc2l0Iiwib3V0TXNnVHlwZSIsIm91dE1zZ05ldyIsImRlcXVldWVJbW1lZGlhdGVseSIsImRlcXVldWUiLCJ0cmFuc2l0UmVxdWlyZWQiLCJkZXF1ZXVlU2hvcnQiLCJub25lIiwic3BsaXRUeXBlIiwic3BsaXQiLCJtZXJnZSIsIkFjY291bnQiLCJfZG9jIiwiZG9jcyIsImFjY291bnQiLCJfIiwiY29sbGVjdGlvbiIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsImNvZGUiLCJjb2RlX2hhc2giLCJkYXRhIiwiZGF0YV9oYXNoIiwibGlicmFyeSIsImxpYnJhcnlfaGFzaCIsInByb29mIiwiYm9jIiwic3RhdGVfaGFzaCIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJsb2NrIiwiYm9keSIsImJvZHlfaGFzaCIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkJsb2NrU2lnbmF0dXJlcyIsImJsb2NrU2lnbmF0dXJlcyIsImdlbl91dGltZSIsInNlcV9ubyIsInNoYXJkIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJkb2MiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4Iiwib3V0TXNnIiwic2hhcmREZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiZ2FzTGltaXRzUHJpY2VzIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiZ2FzIiwibHRfZGVsdGEiLCJibG9ja0xpbWl0cyIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwibXNnRm9yd2FyZFByaWNlcyIsIlZhbGlkYXRvclNldCIsInV0aW1lX3NpbmNlIiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwidmFsaWRhdG9yU2V0IiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJjcmVhdGVkX2J5Iiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwia2V5X2Jsb2NrIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQWtCQTs7QUF2Q0E7Ozs7Ozs7Ozs7Ozs7OztBQXlDQSxNQUFNO0FBQUVBLEVBQUFBLE1BQUY7QUFBVUMsRUFBQUEsSUFBVjtBQUFnQkMsRUFBQUEsR0FBaEI7QUFBcUJDLEVBQUFBO0FBQXJCLElBQWlDQyxXQUF2QztBQUdBLE1BQU1DLGFBQWEsR0FBRywyQkFBTyxlQUFQLEVBQXdCO0FBQzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FEa0M7QUFFMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUZrQztBQUcxQ0MsRUFBQUEsTUFBTSxFQUFFLENBSGtDO0FBSTFDQyxFQUFBQSxRQUFRLEVBQUU7QUFKZ0MsQ0FBeEIsQ0FBdEI7QUFPQSxNQUFNQyxtQkFBbUIsR0FBRywyQkFBTyxxQkFBUCxFQUE4QjtB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QUFBLFNBQVMsRUFBRTlhLElBQUksQ0FBQ21FLGNBQUswQixLQUFMLENBQVdpVixTQUFaLENBNU5JO0FBNk5uQnhWLEVBQUFBLEdBQUcsRUFBRXZGLE1BQU0sQ0FBQ29FLGNBQUswQixLQUFMLENBQVdQLEdBQVosQ0E3TlE7QUE4Tm5CNEcsRUFBQUEsVUFBVSxFQUFFLHlCQUFLO0FBQUVSLElBQUFBO0FBQUYsR0FBTCxFQUEwQixJQUExQixFQUFnQyxJQUFoQztBQTlOTyxDQUF2QixDLENBaU9BOztBQUVBLE1BQU1xUCxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxLQUFLLEVBQUU7QUFDSEMsTUFBQUEsYUFBYSxFQUFiQSw0QkFERztBQUVINU8sTUFBQUEsU0FGRztBQUdITSxNQUFBQSxXQUhHO0FBSUhNLE1BQUFBLEtBSkc7QUFLSE8sTUFBQUEsTUFMRztBQU1IakksTUFBQUEsT0FORztBQU9IcU0sTUFBQUEsS0FQRztBQVFINU4sTUFBQUEsT0FSRztBQVNIK0MsTUFBQUEsV0FURztBQVVIMEUsTUFBQUEsZUFWRztBQVdId0QsTUFBQUEsZUFYRztBQVlIUyxNQUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUE7QUFmRztBQURIO0FBRFksQ0FBeEI7ZUFzQmUwSixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJy4vc2NoZW1hLmpzJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAnLi9zY2hlbWEuanMnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHUxMjgsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHVuaXhTZWNvbmRzLFxuICAgIHdpdGhEb2Ncbn0gZnJvbSBcIi4vZGItc2NoZW1hLXR5cGVzXCI7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIGRlcXVldWVTaG9ydDogNyxcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5hY2NvdW50LndvcmtjaGFpbl9pZCksXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRTdGF0dXMoZG9jcy5hY2NvdW50LmFjY190eXBlKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoZG9jcy5hY2NvdW50Lmxhc3RfcGFpZCkpLFxuICAgIGR1ZV9wYXltZW50OiBncmFtcyhkb2NzLmFjY291bnQuZHVlX3BheW1lbnQpLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NChkb2NzLmFjY291bnQubGFzdF90cmFuc19sdCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKGRvY3MuYWNjb3VudC5iYWxhbmNlKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5hY2NvdW50LmJhbGFuY2Vfb3RoZXIpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLmFjY291bnQuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5hY2NvdW50LnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5hY2NvdW50LnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZSksXG4gICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGVfaGFzaCksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhKSxcbiAgICBkYXRhX2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YV9oYXNoKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnkpLFxuICAgIGxpYnJhcnlfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5X2hhc2gpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5hY2NvdW50LnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmFjY291bnQuYm9jKSxcbiAgICBzdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LnN0YXRlX2hhc2gpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIGJvZHlfaGFzaDogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5X2hhc2gpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGVfaGFzaCksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBkYXRhX2hhc2g6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YV9oYXNoKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIGxpYnJhcnlfaGFzaDogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5X2hhc2gpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHVuaXhTZWNvbmRzKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ291dF9tc2dzWypdJywgJ3BhcmVudC5jcmVhdGVkX2x0ICE9PSBcXCcwMFxcJyAmJiBwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbiAgICBiYWxhbmNlX2RlbHRhOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJhbGFuY2VfZGVsdGEpLFxuICAgIGJhbGFuY2VfZGVsdGFfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uYmFsYW5jZV9kZWx0YSksXG59O1xuXG4vLyBCTE9DSyBTSUdOQVRVUkVTXG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlczogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrU2lnbmF0dXJlcy5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2Nrc19zaWduYXR1cmVzJyB9LFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9ja1NpZ25hdHVyZXMuZ2VuX3V0aW1lKSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zZXFfbm8pLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2hhcmQpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLndvcmtjaGFpbl9pZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5wcm9vZiksXG4gICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGNhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIHNpZ193ZWlnaHQ6IHU2NChkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWdfd2VpZ2h0KSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKCksXG4gICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnIpLFxuICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zKSxcbiAgICB9LCBkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLl9kb2MpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdpZCcsICdpZCcpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEV4dEJsa1JlZiB9LCBkb2MpO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZygpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxuICAgIG1zZ19lbnZfaGFzaDogc3RyaW5nKCksXG4gICAgbmV4dF93b3JrY2hhaW46IGkzMigpLFxuICAgIG5leHRfYWRkcl9wZng6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHU2NCgpLFxuICAgIGdhc19saW1pdDogdTY0KCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGdhc19jcmVkaXQ6IHU2NCgpLFxuICAgIGJsb2NrX2dhc19saW1pdDogdTY0KCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiB1NjQoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogdTY0KCksXG4gICAgYml0X3ByaWNlOiB1NjQoKSxcbiAgICBjZWxsX3ByaWNlOiB1NjQoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1bml4U2Vjb25kcygpLFxuICAgIHV0aW1lX3VudGlsOiB1bml4U2Vjb25kcygpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHU2NCgpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiB1NjQoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwOiBUeXBlRGVmID0ge1xuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1heF90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1pbl93aW5zOiB1OCgpLFxuICAgIG1heF9sb3NzZXM6IHU4KCksXG4gICAgbWluX3N0b3JlX3NlYzogdTMyKCksXG4gICAgbWF4X3N0b3JlX3NlYzogdTMyKCksXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcbiAgICBjZWxsX3ByaWNlOiB1MzIoKSxcbn07XG5cbmNvbnN0IGNvbmZpZ1Byb3Bvc2FsU2V0dXAgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWdQcm9wb3NhbFNldHVwIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5nZW5fdXRpbWUpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2suZ2VuX2NhdGNoYWluX3NlcW5vKSxcbiAgICBmbGFnczogdTE2KGRvY3MuYmxvY2suZmxhZ3MpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLm1hc3Rlcl9yZWYpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3JlZiksXG4gICAgcHJldl9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X2FsdF9yZWYpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9yZWYpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfYWx0X3JlZiksXG4gICAgdmVyc2lvbjogdTMyKGRvY3MuYmxvY2sudmVyc2lvbiksXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLmJsb2NrLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5iZWZvcmVfc3BsaXQpLFxuICAgIGFmdGVyX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay53YW50X21lcmdlKSxcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKGRvY3MuYmxvY2sudmVydF9zZXFfbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5ibG9jay5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5ibG9jay5lbmRfbHQpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2sud29ya2NoYWluX2lkKSxcbiAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2suc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLmJsb2NrLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5wcmV2X2tleV9ibG9ja19zZXFubyksXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHUzMihkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV92ZXJzaW9uKSxcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzdHJpbmcoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBjcmVhdGVkX2J5OiBzdHJpbmcoZG9jcy5ibG9jay5jcmVhdGVkX2J5KSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnNcbiAgICAgICAgKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICB0cl9jb3VudDogaTMyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJfY291bnQpXG4gICAgfSksXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3KSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19kZXB0aCksXG4gICAgICAgIG9sZDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfZGVwdGgpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2subWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgICAgICAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgICAgICAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgICAgICAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICAgICAgICAgIHAxMDogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMC5fZG9jKSxcbiAgICAgICAgICAgIHAxMToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuX2RvYyxcbiAgICAgICAgICAgICAgICBub3JtYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcyksXG4gICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgICAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGdyYW1zKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNS5fZG9jLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzdGFrZV9oZWxkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtaW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE3OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNy5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogdTEyOCgpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogdTEyOCgpLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogdTEyOCgpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE4OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogdW5peFNlY29uZHMoKSxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogdTY0KCksXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogdTY0KCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgICAgICAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICAgICAgICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgICAgICAgICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgICAgICAgICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICAgICAgICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgICAgICAgICBuZXdfY2F0Y2hhaW5faWRzOiBib29sKCksXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgICAgICAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICAgICAgICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgICAgICAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICAgICAgICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAga2V5X2Jsb2NrOiBib29sKGRvY3MuYmxvY2sua2V5X2Jsb2NrKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmJsb2NrLmJvYyksXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=