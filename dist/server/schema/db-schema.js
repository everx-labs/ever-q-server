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
  next_addr_pfx: string()
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJtZXNzYWdlVHlwZSIsImludGVybmFsIiwiZXh0SW4iLCJleHRPdXQiLCJtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyIsInVua25vd24iLCJxdWV1ZWQiLCJwcm9jZXNzaW5nIiwicHJlbGltaW5hcnkiLCJwcm9wb3NlZCIsImZpbmFsaXplZCIsInJlZnVzZWQiLCJ0cmFuc2l0aW5nIiwidHJhbnNhY3Rpb25UeXBlIiwib3JkaW5hcnkiLCJzdG9yYWdlIiwidGljayIsInRvY2siLCJzcGxpdFByZXBhcmUiLCJzcGxpdEluc3RhbGwiLCJtZXJnZVByZXBhcmUiLCJtZXJnZUluc3RhbGwiLCJ0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMiLCJjb21wdXRlVHlwZSIsInNraXBwZWQiLCJ2bSIsImJvdW5jZVR5cGUiLCJuZWdGdW5kcyIsIm5vRnVuZHMiLCJvayIsImJsb2NrUHJvY2Vzc2luZ1N0YXR1cyIsImluTXNnVHlwZSIsImV4dGVybmFsIiwiaWhyIiwiaW1tZWRpYXRlbHkiLCJmaW5hbCIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsImRlcXVldWVTaG9ydCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJkb2NzIiwiYWNjb3VudCIsIl8iLCJjb2xsZWN0aW9uIiwid29ya2NoYWluX2lkIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwicHJvb2YiLCJib2MiLCJzdGF0ZV9oYXNoIiwiTWVzc2FnZSIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYmxvY2siLCJib2R5IiwiYm9keV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImJhbGFuY2VfZGVsdGEiLCJiYWxhbmNlX2RlbHRhX290aGVyIiwiQmxvY2tTaWduYXR1cmVzIiwiYmxvY2tTaWduYXR1cmVzIiwiZ2VuX3V0aW1lIiwic2VxX25vIiwic2hhcmQiLCJ2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiY2F0Y2hhaW5fc2Vxbm8iLCJzaWdfd2VpZ2h0Iiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJnZW5fc29mdHdhcmVfdmVyc2lvbiIsImdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJrZXlfYmxvY2siLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBR0E7O0FBa0JBOztBQXZDQTs7Ozs7Ozs7Ozs7Ozs7O0FBeUNBLE1BQU07QUFBRUEsRUFBQUEsTUFBRjtBQUFVQyxFQUFBQSxJQUFWO0FBQWdCQyxFQUFBQSxHQUFoQjtBQUFxQkMsRUFBQUE7QUFBckIsSUFBaUNDLFdBQXZDO0FBR0EsTUFBTUMsYUFBYSxHQUFHLDJCQUFPLGVBQVAsRUFBd0I7QUFDMUNDLEVBQUFBLE1BQU0sRUFBRSxDQURrQztBQUUxQ0MsRUFBQUEsTUFBTSxFQUFFLENBRmtDO0FBRzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FIa0M7QUFJMUNDLEVBQUFBLFFBQVEsRUFBRTtBQUpnQyxDQUF4QixDQUF0QjtBQU9BLE1BQU1DLG1CQUFtQixHQUFHLDJCQUFPLHFCQUFQLEVBQThCO0FBQ3RE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VyxFQUFBQSxTQUFTLEVBQUU5YSxJQUFJLENBQUNtRSxjQUFLMEIsS0FBTCxDQUFXaVYsU0FBWixDQTVOSTtBQTZObkJ4VixFQUFBQSxHQUFHLEVBQUV2RixNQUFNLENBQUNvRSxjQUFLMEIsS0FBTCxDQUFXUCxHQUFaLENBN05RO0FBOE5uQjRHLEVBQUFBLFVBQVUsRUFBRSx5QkFBSztBQUFFUixJQUFBQTtBQUFGLEdBQUwsRUFBMEIsSUFBMUIsRUFBZ0MsSUFBaEM7QUE5Tk8sQ0FBdkIsQyxDQWlPQTs7QUFFQSxNQUFNcVAsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSDVPLE1BQUFBLFNBRkc7QUFHSE0sTUFBQUEsV0FIRztBQUlITSxNQUFBQSxLQUpHO0FBS0hPLE1BQUFBLE1BTEc7QUFNSGpJLE1BQUFBLE9BTkc7QUFPSHFNLE1BQUFBLEtBUEc7QUFRSDVOLE1BQUFBLE9BUkc7QUFTSCtDLE1BQUFBLFdBVEc7QUFVSDBFLE1BQUFBLGVBVkc7QUFXSHdELE1BQUFBLGVBWEc7QUFZSFMsTUFBQUEsV0FaRztBQWFIUSxNQUFBQSxnQkFiRztBQWNIUSxNQUFBQSxZQWRHO0FBZUhVLE1BQUFBO0FBZkc7QUFESDtBQURZLENBQXhCO2VBc0JlMEosTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXHJcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxyXG4gKlxyXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcclxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXHJcbiAqIExpY2Vuc2UgYXQ6XHJcbiAqXHJcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xyXG4gKlxyXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXHJcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcclxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXHJcbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxyXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cclxuICovXHJcblxyXG4vL0BmbG93XHJcblxyXG5pbXBvcnQgeyBEZWYgfSBmcm9tICcuL3NjaGVtYS5qcyc7XHJcblxyXG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICcuL3NjaGVtYS5qcyc7XHJcbmltcG9ydCB7XHJcbiAgICBncmFtcyxcclxuICAgIGkzMixcclxuICAgIGk4LFxyXG4gICAgam9pbixcclxuICAgIE90aGVyQ3VycmVuY3ksXHJcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcclxuICAgIHJlcXVpcmVkLFxyXG4gICAgdTE2LFxyXG4gICAgdTMyLFxyXG4gICAgdTY0LFxyXG4gICAgdTEyOCxcclxuICAgIHU4LFxyXG4gICAgdThlbnVtLFxyXG4gICAgdW5peFNlY29uZHMsXHJcbiAgICB3aXRoRG9jXHJcbn0gZnJvbSBcIi4vZGItc2NoZW1hLXR5cGVzXCI7XHJcblxyXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcclxuXHJcbmNvbnN0IHsgc3RyaW5nLCBib29sLCByZWYsIGFycmF5T2YgfSA9IERlZjtcclxuXHJcblxyXG5jb25zdCBhY2NvdW50U3RhdHVzID0gdThlbnVtKCdBY2NvdW50U3RhdHVzJywge1xyXG4gICAgdW5pbml0OiAwLFxyXG4gICAgYWN0aXZlOiAxLFxyXG4gICAgZnJvemVuOiAyLFxyXG4gICAgbm9uRXhpc3Q6IDMsXHJcbn0pO1xyXG5cclxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcclxuICAgIHVuY2hhbmdlZDogMCxcclxuICAgIGZyb3plbjogMSxcclxuICAgIGRlbGV0ZWQ6IDIsXHJcbn0pO1xyXG5cclxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcclxuICAgIG5vU3RhdGU6IDAsXHJcbiAgICBiYWRTdGF0ZTogMSxcclxuICAgIG5vR2FzOiAyLFxyXG59KTtcclxuXHJcbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcclxuICAgIGludGVybmFsOiAwLFxyXG4gICAgZXh0SW46IDEsXHJcbiAgICBleHRPdXQ6IDIsXHJcbn0pO1xyXG5cclxuXHJcbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcclxuICAgIHVua25vd246IDAsXHJcbiAgICBxdWV1ZWQ6IDEsXHJcbiAgICBwcm9jZXNzaW5nOiAyLFxyXG4gICAgcHJlbGltaW5hcnk6IDMsXHJcbiAgICBwcm9wb3NlZDogNCxcclxuICAgIGZpbmFsaXplZDogNSxcclxuICAgIHJlZnVzZWQ6IDYsXHJcbiAgICB0cmFuc2l0aW5nOiA3LFxyXG59KTtcclxuXHJcbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xyXG4gICAgb3JkaW5hcnk6IDAsXHJcbiAgICBzdG9yYWdlOiAxLFxyXG4gICAgdGljazogMixcclxuICAgIHRvY2s6IDMsXHJcbiAgICBzcGxpdFByZXBhcmU6IDQsXHJcbiAgICBzcGxpdEluc3RhbGw6IDUsXHJcbiAgICBtZXJnZVByZXBhcmU6IDYsXHJcbiAgICBtZXJnZUluc3RhbGw6IDcsXHJcbn0pO1xyXG5cclxuY29uc3QgdHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdUcmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMnLCB7XHJcbiAgICB1bmtub3duOiAwLFxyXG4gICAgcHJlbGltaW5hcnk6IDEsXHJcbiAgICBwcm9wb3NlZDogMixcclxuICAgIGZpbmFsaXplZDogMyxcclxuICAgIHJlZnVzZWQ6IDQsXHJcbn0pO1xyXG5cclxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xyXG4gICAgc2tpcHBlZDogMCxcclxuICAgIHZtOiAxLFxyXG59KTtcclxuXHJcbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XHJcbiAgICBuZWdGdW5kczogMCxcclxuICAgIG5vRnVuZHM6IDEsXHJcbiAgICBvazogMixcclxufSk7XHJcblxyXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcclxuICAgIHVua25vd246IDAsXHJcbiAgICBwcm9wb3NlZDogMSxcclxuICAgIGZpbmFsaXplZDogMixcclxuICAgIHJlZnVzZWQ6IDMsXHJcbn0pO1xyXG5cclxuXHJcbmNvbnN0IGluTXNnVHlwZSA9IHU4ZW51bSgnSW5Nc2dUeXBlJywge1xyXG4gICAgZXh0ZXJuYWw6IDAsXHJcbiAgICBpaHI6IDEsXHJcbiAgICBpbW1lZGlhdGVseTogMixcclxuICAgIGZpbmFsOiAzLFxyXG4gICAgdHJhbnNpdDogNCxcclxuICAgIGRpc2NhcmRlZEZpbmFsOiA1LFxyXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcclxufSk7XHJcblxyXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xyXG4gICAgZXh0ZXJuYWw6IDAsXHJcbiAgICBpbW1lZGlhdGVseTogMSxcclxuICAgIG91dE1zZ05ldzogMixcclxuICAgIHRyYW5zaXQ6IDMsXHJcbiAgICBkZXF1ZXVlSW1tZWRpYXRlbHk6IDQsXHJcbiAgICBkZXF1ZXVlOiA1LFxyXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxyXG4gICAgZGVxdWV1ZVNob3J0OiA3LFxyXG4gICAgbm9uZTogLTEsXHJcbn0pO1xyXG5cclxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XHJcbiAgICBub25lOiAwLFxyXG4gICAgc3BsaXQ6IDIsXHJcbiAgICBtZXJnZTogMyxcclxufSk7XHJcblxyXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xyXG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXHJcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcclxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxyXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRTdGF0dXMoZG9jcy5hY2NvdW50LmFjY190eXBlKSksXHJcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXHJcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcclxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NChkb2NzLmFjY291bnQubGFzdF90cmFuc19sdCkpLCAvLyBpbmRleFxyXG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcclxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcclxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLmFjY291bnQuc3BsaXRfZGVwdGgpLFxyXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXHJcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcclxuICAgIGNvZGU6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZSksXHJcbiAgICBjb2RlX2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZV9oYXNoKSxcclxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXHJcbiAgICBkYXRhX2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YV9oYXNoKSxcclxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXHJcbiAgICBsaWJyYXJ5X2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeV9oYXNoKSxcclxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5hY2NvdW50LnByb29mKSxcclxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxyXG4gICAgc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5zdGF0ZV9oYXNoKSxcclxufTtcclxuXHJcbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XHJcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcclxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxyXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKGRvY3MubWVzc2FnZS5tc2dfdHlwZSkpLFxyXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXHJcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxyXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXHJcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxyXG4gICAgYm9keV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHlfaGFzaCksXHJcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5tZXNzYWdlLnNwbGl0X2RlcHRoKSxcclxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxyXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXHJcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGUpLFxyXG4gICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGVfaGFzaCksXHJcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxyXG4gICAgZGF0YV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGFfaGFzaCksXHJcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxyXG4gICAgbGlicmFyeV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnlfaGFzaCksXHJcbiAgICBzcmM6IHN0cmluZyhkb2NzLm1lc3NhZ2Uuc3JjKSxcclxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxyXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcclxuICAgIGRzdF93b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2UuZHN0X3dvcmtjaGFpbl9pZCksXHJcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxyXG4gICAgY3JlYXRlZF9hdDogdW5peFNlY29uZHMoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfYXQpLFxyXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxyXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxyXG4gICAgZndkX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmZ3ZF9mZWUpLFxyXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxyXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxyXG4gICAgYm91bmNlZDogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlZCksXHJcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcclxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxyXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLm1lc3NhZ2UucHJvb2YpLFxyXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXHJcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ291dF9tc2dzWypdJywgJ3BhcmVudC5jcmVhdGVkX2x0ICE9PSBcXCcwMFxcJyAmJiBwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcclxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnaW5fbXNnJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMicpLFxyXG59O1xyXG5cclxuXHJcbmNvbnN0IFRyYW5zYWN0aW9uOiBUeXBlRGVmID0ge1xyXG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxyXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxyXG4gICAgdHJfdHlwZTogcmVxdWlyZWQodHJhbnNhY3Rpb25UeXBlKGRvY3MudHJhbnNhY3Rpb24udHJfdHlwZSkpLFxyXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcclxuICAgIGJsb2NrX2lkOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXHJcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcclxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcclxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MudHJhbnNhY3Rpb24ud29ya2NoYWluX2lkKSxcclxuICAgIGx0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5sdCksXHJcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXHJcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcclxuICAgIG5vdzogdTMyKGRvY3MudHJhbnNhY3Rpb24ubm93KSxcclxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxyXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5vcmlnX3N0YXR1cyksXHJcbiAgICBlbmRfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uZW5kX3N0YXR1cyksXHJcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXHJcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJywgJ2lkJyksXHJcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5vdXRfbXNncykpLFxyXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcclxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlcyksXHJcbiAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXNfb3RoZXIpLFxyXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcclxuICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5uZXdfaGFzaCksXHJcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jcmVkaXRfZmlyc3QpLFxyXG4gICAgc3RvcmFnZToge1xyXG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKSxcclxuICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZSksXHJcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXHJcbiAgICB9LFxyXG4gICAgY3JlZGl0OiB7XHJcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxyXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0KSxcclxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdF9vdGhlciksXHJcbiAgICB9LFxyXG4gICAgY29tcHV0ZToge1xyXG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmNvbXB1dGVfdHlwZSkpLFxyXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXHJcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc3VjY2VzcyksXHJcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1zZ19zdGF0ZV91c2VkKSxcclxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxyXG4gICAgICAgIGdhc19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2ZlZXMpLFxyXG4gICAgICAgIGdhc191c2VkOiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc191c2VkKSxcclxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcclxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19jcmVkaXQpLFxyXG4gICAgICAgIG1vZGU6IGk4KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tb2RlKSxcclxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcclxuICAgICAgICBleGl0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2FyZyksXHJcbiAgICAgICAgdm1fc3RlcHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fc3RlcHMpLFxyXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxyXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCksXHJcbiAgICB9LFxyXG4gICAgYWN0aW9uOiB7XHJcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdWNjZXNzKSxcclxuICAgICAgICB2YWxpZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi52YWxpZCksXHJcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxyXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3RhdHVzX2NoYW5nZSksXHJcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzKSxcclxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxyXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2NvZGUpLFxyXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfYXJnKSxcclxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcclxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zcGVjX2FjdGlvbnMpLFxyXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNraXBwZWRfYWN0aW9ucyksXHJcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcclxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCksXHJcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscyksXHJcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxyXG4gICAgfSxcclxuICAgIGJvdW5jZToge1xyXG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXHJcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9jZWxscyksXHJcbiAgICAgICAgbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2JpdHMpLFxyXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcclxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX2ZlZXMpLFxyXG4gICAgICAgIGZ3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5md2RfZmVlcyksXHJcbiAgICB9LFxyXG4gICAgYWJvcnRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFib3J0ZWQpLFxyXG4gICAgZGVzdHJveWVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uZGVzdHJveWVkKSxcclxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXHJcbiAgICBzcGxpdF9pbmZvOiB7XHJcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbiksXHJcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcclxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8udGhpc19hZGRyKSxcclxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uc2libGluZ19hZGRyKSxcclxuICAgIH0sXHJcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmVwYXJlX3RyYW5zYWN0aW9uKSxcclxuICAgIGluc3RhbGxlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmluc3RhbGxlZCksXHJcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxyXG4gICAgYm9jOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ib2MpLFxyXG4gICAgYmFsYW5jZV9kZWx0YTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5iYWxhbmNlX2RlbHRhKSxcclxuICAgIGJhbGFuY2VfZGVsdGFfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uYmFsYW5jZV9kZWx0YSksXHJcbn07XHJcblxyXG4vLyBCTE9DSyBTSUdOQVRVUkVTXHJcblxyXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XHJcbiAgICBfZG9jOiBkb2NzLmJsb2NrU2lnbmF0dXJlcy5fZG9jLFxyXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXHJcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2tTaWduYXR1cmVzLmdlbl91dGltZSksXHJcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zZXFfbm8pLFxyXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaGFyZCksXHJcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy53b3JrY2hhaW5faWQpLFxyXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5wcm9vZiksXHJcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXHJcbiAgICBjYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLmNhdGNoYWluX3NlcW5vKSxcclxuICAgIHNpZ193ZWlnaHQ6IHU2NChkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWdfd2VpZ2h0KSxcclxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xyXG4gICAgICAgIG5vZGVfaWQ6IHN0cmluZygpLFxyXG4gICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnIpLFxyXG4gICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnMpLFxyXG4gICAgfSwgZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5fZG9jKSxcclxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdpZCcsICdpZCcpLFxyXG59O1xyXG5cclxuLy8gQkxPQ0tcclxuXHJcbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcclxuICAgIGVuZF9sdDogdTY0KCksXHJcbiAgICBzZXFfbm86IHUzMigpLFxyXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcclxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcclxufTtcclxuXHJcbmNvbnN0IGV4dEJsa1JlZiA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEV4dEJsa1JlZiB9LCBkb2MpO1xyXG5cclxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XHJcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxyXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcclxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcclxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxyXG59O1xyXG5cclxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcclxuXHJcbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xyXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcclxuICAgIG1zZ19pZDogc3RyaW5nKCksXHJcbiAgICBpaHJfZmVlOiBncmFtcygpLFxyXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXHJcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXHJcbiAgICBmd2RfZmVlOiBncmFtcygpLFxyXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcclxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxyXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLFxyXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxyXG59O1xyXG5cclxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xyXG5cclxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xyXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXHJcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxyXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLFxyXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcclxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxyXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXHJcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxyXG4gICAgbXNnX2Vudl9oYXNoOiBzdHJpbmcoKSxcclxuICAgIG5leHRfd29ya2NoYWluOiBpMzIoKSxcclxuICAgIG5leHRfYWRkcl9wZng6IHN0cmluZygpLFxyXG59O1xyXG5cclxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XHJcblxyXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XHJcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcclxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxyXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3Iuc3RhcnRfbHQpLFxyXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXHJcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcclxuICAgIGZpbGVfaGFzaDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5maWxlX2hhc2gpLFxyXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxyXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxyXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9zcGxpdCksXHJcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcclxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxyXG4gICAgZmxhZ3M6IHU4KGRvY3Muc2hhcmREZXNjci5mbGFncyksXHJcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxyXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxyXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5taW5fcmVmX21jX3NlcW5vKSxcclxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXHJcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxyXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxyXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXHJcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcclxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcclxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcclxufSwgZG9jKTtcclxuXHJcbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcclxuICAgIGdhc19wcmljZTogdTY0KCksXHJcbiAgICBnYXNfbGltaXQ6IHU2NCgpLFxyXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHU2NCgpLFxyXG4gICAgZ2FzX2NyZWRpdDogdTY0KCksXHJcbiAgICBibG9ja19nYXNfbGltaXQ6IHU2NCgpLFxyXG4gICAgZnJlZXplX2R1ZV9saW1pdDogdTY0KCksXHJcbiAgICBkZWxldGVfZHVlX2xpbWl0OiB1NjQoKSxcclxuICAgIGZsYXRfZ2FzX2xpbWl0OiB1NjQoKSxcclxuICAgIGZsYXRfZ2FzX3ByaWNlOiB1NjQoKSxcclxufTtcclxuXHJcbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xyXG5cclxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XHJcbiAgICBieXRlczoge1xyXG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXHJcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXHJcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXHJcbiAgICB9LFxyXG4gICAgZ2FzOiB7XHJcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcclxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcclxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcclxuICAgIH0sXHJcbiAgICBsdF9kZWx0YToge1xyXG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXHJcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXHJcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXHJcbiAgICB9LFxyXG59O1xyXG5cclxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xyXG5cclxuY29uc3QgTXNnRm9yd2FyZFByaWNlczogVHlwZURlZiA9IHtcclxuICAgIGx1bXBfcHJpY2U6IHU2NCgpLFxyXG4gICAgYml0X3ByaWNlOiB1NjQoKSxcclxuICAgIGNlbGxfcHJpY2U6IHU2NCgpLFxyXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXHJcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcclxuICAgIG5leHRfZnJhYzogdTE2KCksXHJcbn07XHJcblxyXG5jb25zdCBtc2dGb3J3YXJkUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgTXNnRm9yd2FyZFByaWNlcyB9LCBkb2MpO1xyXG5cclxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xyXG4gICAgdXRpbWVfc2luY2U6IHVuaXhTZWNvbmRzKCksXHJcbiAgICB1dGltZV91bnRpbDogdW5peFNlY29uZHMoKSxcclxuICAgIHRvdGFsOiB1MTYoKSxcclxuICAgIHRvdGFsX3dlaWdodDogdTY0KCksXHJcbiAgICBsaXN0OiBhcnJheU9mKHtcclxuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcclxuICAgICAgICB3ZWlnaHQ6IHU2NCgpLFxyXG4gICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXHJcbiAgICB9KSxcclxufTtcclxuXHJcbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xyXG5cclxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cDogVHlwZURlZiA9IHtcclxuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxyXG4gICAgbWF4X3RvdF9yb3VuZHM6IHU4KCksXHJcbiAgICBtaW5fd2luczogdTgoKSxcclxuICAgIG1heF9sb3NzZXM6IHU4KCksXHJcbiAgICBtaW5fc3RvcmVfc2VjOiB1MzIoKSxcclxuICAgIG1heF9zdG9yZV9zZWM6IHUzMigpLFxyXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcclxuICAgIGNlbGxfcHJpY2U6IHUzMigpLFxyXG59O1xyXG5cclxuY29uc3QgY29uZmlnUHJvcG9zYWxTZXR1cCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZ1Byb3Bvc2FsU2V0dXAgfSwgZG9jKTtcclxuXHJcbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xyXG4gICAgX2RvYzogZG9jcy5ibG9jay5fZG9jLFxyXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxyXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxyXG4gICAgZ2xvYmFsX2lkOiB1MzIoZG9jcy5ibG9jay5nbG9iYWxfaWQpLFxyXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxyXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxyXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9tZXJnZSksXHJcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcclxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2suZ2VuX2NhdGNoYWluX3NlcW5vKSxcclxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXHJcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcclxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3JlZiksXHJcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXHJcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcclxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfYWx0X3JlZiksXHJcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcclxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXHJcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5iZWZvcmVfc3BsaXQpLFxyXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXHJcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXHJcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKGRvY3MuYmxvY2sudmVydF9zZXFfbm8pLFxyXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcclxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcclxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2sud29ya2NoYWluX2lkKSxcclxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXHJcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcclxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5wcmV2X2tleV9ibG9ja19zZXFubyksXHJcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogdTMyKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX3ZlcnNpb24pLFxyXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc3RyaW5nKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyksXHJcbiAgICB2YWx1ZV9mbG93OiB7XHJcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXHJcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXHJcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXHJcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXHJcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXHJcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXHJcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxyXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcclxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcclxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcclxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXHJcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxyXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXHJcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcclxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXHJcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxyXG4gICAgfSxcclxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxyXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxyXG4gICAgY3JlYXRlZF9ieTogc3RyaW5nKGRvY3MuYmxvY2suY3JlYXRlZF9ieSksXHJcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcclxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcclxuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXHJcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHtcclxuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXHJcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksIC8vIFRPRE86IGRvY1xyXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXHJcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnNcclxuICAgICAgICApLFxyXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxyXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxyXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcclxuICAgIH0pLFxyXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcclxuICAgIHN0YXRlX3VwZGF0ZToge1xyXG4gICAgICAgIG5ldzogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ldyksXHJcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXHJcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcclxuICAgICAgICBvbGQ6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGQpLFxyXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxyXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcclxuICAgIH0sXHJcbiAgICBtYXN0ZXI6IHtcclxuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcclxuICAgICAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lKSxcclxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xyXG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcclxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxyXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxyXG4gICAgICAgIH0pLFxyXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xyXG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXHJcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXHJcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXHJcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXHJcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxyXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcclxuICAgICAgICB9KSxcclxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXHJcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XHJcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxyXG4gICAgICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcclxuICAgICAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZygpLFxyXG4gICAgICAgIGNvbmZpZzoge1xyXG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXHJcbiAgICAgICAgICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcclxuICAgICAgICAgICAgcDI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIpLFxyXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXHJcbiAgICAgICAgICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcclxuICAgICAgICAgICAgcDY6IHtcclxuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxyXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IHN0cmluZygpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwNzogYXJyYXlPZih7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdTMyKCksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXHJcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcclxuICAgICAgICAgICAgcDg6IHtcclxuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXHJcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHN0cmluZygpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxyXG4gICAgICAgICAgICBwMTA6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTAuX2RvYyksXHJcbiAgICAgICAgICAgIHAxMToge1xyXG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5fZG9jLFxyXG4gICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogY29uZmlnUHJvcG9zYWxTZXR1cChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMpLFxyXG4gICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcDEyOiBhcnJheU9mKHtcclxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXHJcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IHU4KCksXHJcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXHJcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXHJcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGJvb2woKSxcclxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXHJcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXHJcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXHJcbiAgICAgICAgICAgICAgICBiYXNpYzogYm9vbCgpLFxyXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXHJcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogdTE2KCksXHJcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxyXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXHJcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogdTMyKCksXHJcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXHJcbiAgICAgICAgICAgIHAxNDoge1xyXG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNC5fZG9jLFxyXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxyXG4gICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogZ3JhbXMoKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcDE1OiB7XHJcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXHJcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwMTY6IHtcclxuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcclxuICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcclxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxyXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwMTc6IHtcclxuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcclxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogdTEyOCgpLFxyXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiB1MTI4KCksXHJcbiAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IHUxMjgoKSxcclxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHAxODogYXJyYXlPZih7XHJcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogdW5peFNlY29uZHMoKSxcclxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogdTY0KCksXHJcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiB1NjQoKSxcclxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogdTY0KCksXHJcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiB1NjQoKSxcclxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxOC5fZG9jKSxcclxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXHJcbiAgICAgICAgICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxyXG4gICAgICAgICAgICBwMjI6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjIpLFxyXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxyXG4gICAgICAgICAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXHJcbiAgICAgICAgICAgIHAyNTogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI1KSxcclxuICAgICAgICAgICAgcDI4OiB7XHJcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXHJcbiAgICAgICAgICAgICAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IGJvb2woKSxcclxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwMjk6IHtcclxuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcclxuICAgICAgICAgICAgICAgIG5ld19jYXRjaGFpbl9pZHM6IGJvb2woKSxcclxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXHJcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcclxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXHJcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcclxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXHJcbiAgICAgICAgICAgIHAzMzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzMpLFxyXG4gICAgICAgICAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcclxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXHJcbiAgICAgICAgICAgIHAzNjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzYpLFxyXG4gICAgICAgICAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcclxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcclxuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXHJcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IHUzMigpLFxyXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxyXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM5Ll9kb2MpLFxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBrZXlfYmxvY2s6IGJvb2woZG9jcy5ibG9jay5rZXlfYmxvY2spLFxyXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5ibG9jay5ib2MpLFxyXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcclxufTtcclxuXHJcbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cclxuXHJcbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcclxuICAgIF9jbGFzczoge1xyXG4gICAgICAgIHR5cGVzOiB7XHJcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXHJcbiAgICAgICAgICAgIEV4dEJsa1JlZixcclxuICAgICAgICAgICAgTXNnRW52ZWxvcGUsXHJcbiAgICAgICAgICAgIEluTXNnLFxyXG4gICAgICAgICAgICBPdXRNc2csXHJcbiAgICAgICAgICAgIE1lc3NhZ2UsXHJcbiAgICAgICAgICAgIEJsb2NrLFxyXG4gICAgICAgICAgICBBY2NvdW50LFxyXG4gICAgICAgICAgICBUcmFuc2FjdGlvbixcclxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxyXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXHJcbiAgICAgICAgICAgIEJsb2NrTGltaXRzLFxyXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxyXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXHJcbiAgICAgICAgICAgIENvbmZpZ1Byb3Bvc2FsU2V0dXBcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XHJcbiJdfQ==