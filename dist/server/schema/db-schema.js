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
const AccountBase = {
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.account.workchain_id),
  acc_type: (0, _dbSchemaTypes.required)(accountStatus(_dbShema.docs.account.acc_type)),
  last_paid: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u32)(_dbShema.docs.account.last_paid)),
  bits: (0, _dbSchemaTypes.u64)(_dbShema.docs.account.bits),
  cells: (0, _dbSchemaTypes.u64)(_dbShema.docs.account.cells),
  public_cells: (0, _dbSchemaTypes.u64)(_dbShema.docs.account.public_cells),
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
  code_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.account.code_hash),
  data: string(_dbShema.docs.account.data),
  data_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.account.data_hash),
  library: string(_dbShema.docs.account.library),
  library_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.account.library_hash),
  proof: string(_dbShema.docs.account.proof),
  boc: string(_dbShema.docs.account.boc),
  state_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.account.state_hash)
};
const Account = { ...AccountBase,
  _doc: _dbShema.docs.account._doc,
  _: {
    collection: 'accounts'
  }
};
const Message = {
  _doc: _dbShema.docs.message._doc,
  _: {
    collection: 'messages'
  },
  msg_type: (0, _dbSchemaTypes.required)(messageType(_dbShema.docs.message.msg_type)),
  status: (0, _dbSchemaTypes.required)(messageProcessingStatus(_dbShema.docs.message.status)),
  block_id: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.block_id)),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
  body: string(_dbShema.docs.message.body),
  body_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.body_hash),
  split_depth: (0, _dbSchemaTypes.u8)(_dbShema.docs.message.split_depth),
  tick: bool(_dbShema.docs.message.tick),
  tock: bool(_dbShema.docs.message.tock),
  code: string(_dbShema.docs.message.code),
  code_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.code_hash),
  data: string(_dbShema.docs.message.data),
  data_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.data_hash),
  library: string(_dbShema.docs.message.library),
  library_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.library_hash),
  src: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.src),
  dst: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.message.dst),
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
  block_id: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.block_id),
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
  account_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.account_addr),
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.workchain_id),
  lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.lt),
  prev_trans_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.prev_trans_hash),
  prev_trans_lt: (0, _dbSchemaTypes.u64)(_dbShema.docs.transaction.prev_trans_lt),
  now: (0, _dbSchemaTypes.unixSeconds)(_dbShema.docs.transaction.now),
  outmsg_cnt: (0, _dbSchemaTypes.i32)(_dbShema.docs.transaction.outmsg_cnt),
  orig_status: accountStatus(_dbShema.docs.transaction.orig_status),
  end_status: accountStatus(_dbShema.docs.transaction.end_status),
  in_msg: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.in_msg),
  in_message: (0, _dbSchemaTypes.join)({
    Message
  }, 'in_msg', 'id'),
  out_msgs: arrayOf((0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.out_msgs)),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message
  }, 'out_msgs', 'id')),
  total_fees: (0, _dbSchemaTypes.grams)(_dbShema.docs.transaction.total_fees),
  total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.transaction.total_fees_other),
  old_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.old_hash),
  new_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.new_hash),
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
    vm_init_state_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.compute.vm_init_state_hash),
    vm_final_state_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.compute.vm_final_state_hash)
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
    action_list_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.action.action_list_hash),
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
    this_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.split_info.this_addr),
    sibling_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.split_info.sibling_addr)
  },
  prepare_transaction: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.transaction.prepare_transaction),
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
    node_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
    r: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.blockSignatures.signatures.r),
    s: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.blockSignatures.signatures.s)
  }, _dbShema.docs.blockSignatures.signatures._doc),
  block: (0, _dbSchemaTypes.join)('Block', 'id', 'id')
}; // BLOCK

const ExtBlkRef = {
  end_lt: (0, _dbSchemaTypes.u64)(),
  seq_no: (0, _dbSchemaTypes.u32)(),
  root_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  file_hash: (0, _dbSchemaTypes.stringWithLowerFilter)()
};

const extBlkRef = doc => ref({
  ExtBlkRef
}, doc);

const MsgEnvelope = {
  msg_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  next_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  cur_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  fwd_fee_remaining: (0, _dbSchemaTypes.grams)()
};

const msgEnvelope = () => ref({
  MsgEnvelope
});

const InMsg = {
  msg_type: (0, _dbSchemaTypes.required)(inMsgType()),
  msg_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  ihr_fee: (0, _dbSchemaTypes.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _dbSchemaTypes.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _dbSchemaTypes.grams)(),
  transaction_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  proof_delivered: string()
};

const inMsg = doc => ref({
  InMsg
}, doc);

const OutMsg = {
  msg_type: (0, _dbSchemaTypes.required)(outMsgType()),
  msg_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  transaction_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _dbSchemaTypes.u64)(),
  msg_env_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(),
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
  root_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.shardDescr.root_hash),
  file_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.shardDescr.file_hash),
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
    public_key: (0, _dbSchemaTypes.stringWithLowerFilter)(),
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

const Config = {
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
    capabilities: (0, _dbSchemaTypes.u64)()
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
};

const config = doc => ref({
  Config
}, doc);

const Block = {
  _doc: _dbShema.docs.block._doc,
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(_dbShema.docs.block.status),
  global_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.global_id),
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
    account_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.account_blocks.account_addr),
    transactions: arrayOf({
      lt: (0, _dbSchemaTypes.u64)(),
      // TODO: doc
      transaction_id: (0, _dbSchemaTypes.stringWithLowerFilter)(),
      // TODO: doc
      total_fees: (0, _dbSchemaTypes.grams)(),
      // TODO: doc
      total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)() // TODO: doc

    }, _dbShema.docs.block.account_blocks.transactions),
    old_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.account_blocks.state_update.old_hash),
    new_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.account_blocks.state_update.new_hash),
    tr_count: (0, _dbSchemaTypes.i32)(_dbShema.docs.block.account_blocks.tr_count)
  }),
  tr_count: (0, _dbSchemaTypes.i32)(),
  // TODO: doc
  state_update: {
    new: string(_dbShema.docs.block.state_update.new),
    new_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.state_update.new_hash),
    new_depth: (0, _dbSchemaTypes.u16)(_dbShema.docs.block.state_update.new_depth),
    old: string(_dbShema.docs.block.state_update.old),
    old_hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.state_update.old_hash),
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
      node_id: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.master.prev_blk_signatures.node_id),
      r: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.master.prev_blk_signatures.r),
      s: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.block.master.prev_blk_signatures.s)
    }),
    config_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(),
    config: config()
  },
  key_block: bool(_dbShema.docs.block.key_block),
  boc: string(_dbShema.docs.block.boc),
  signatures: (0, _dbSchemaTypes.join)({
    BlockSignatures
  }, 'id', 'id')
};
const Zerostate = {
  _doc: _dbShema.docs.zerostate._doc,
  _: {
    collection: 'zerostates'
  },
  workchain_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.zerostate.workchain_id),
  global_id: (0, _dbSchemaTypes.i32)(_dbShema.docs.zerostate.global_id),
  total_balance: (0, _dbSchemaTypes.grams)(_dbShema.docs.zerostate.total_balance),
  total_balance_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.zerostate.total_balance_other),
  master: {
    validator_list_hash_short: (0, _dbSchemaTypes.u32)(_dbShema.docs.zerostate.master.validator_list_hash_short),
    global_balance: (0, _dbSchemaTypes.grams)(_dbShema.docs.zerostate.master.global_balance),
    global_balance_other: (0, _dbSchemaTypes.otherCurrencyCollection)(_dbShema.docs.zerostate.master.global_balance_other),
    config_addr: (0, _dbSchemaTypes.stringWithLowerFilter)(),
    config: config()
  },
  accounts: arrayOf({ ...AccountBase,
    id: (0, _dbSchemaTypes.stringWithLowerFilter)()
  }, _dbShema.docs.zerostate.accounts),
  libraries: arrayOf({
    hash: (0, _dbSchemaTypes.stringWithLowerFilter)(_dbShema.docs.zerostate.libraries.hash),
    publishers: arrayOf(string(), _dbShema.docs.zerostate.libraries.publishers),
    lib: string(_dbShema.docs.zerostate.libraries.lib)
  }, _dbShema.docs.zerostate.libraries._doc),
  boc: string(_dbShema.docs.zerostate.boc)
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
      ConfigProposalSetup,
      Config,
      Zerostate
    }
  }
};
var _default = schema;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJzdHJpbmciLCJib29sIiwicmVmIiwiYXJyYXlPZiIsIkRlZiIsImFjY291bnRTdGF0dXMiLCJ1bmluaXQiLCJhY3RpdmUiLCJmcm96ZW4iLCJub25FeGlzdCIsImFjY291bnRTdGF0dXNDaGFuZ2UiLCJ1bmNoYW5nZWQiLCJkZWxldGVkIiwic2tpcFJlYXNvbiIsIm5vU3RhdGUiLCJiYWRTdGF0ZSIsIm5vR2FzIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwiZmluYWwiLCJ0cmFuc2l0IiwiZGlzY2FyZGVkRmluYWwiLCJkaXNjYXJkZWRUcmFuc2l0Iiwib3V0TXNnVHlwZSIsIm91dE1zZ05ldyIsImRlcXVldWVJbW1lZGlhdGVseSIsImRlcXVldWUiLCJ0cmFuc2l0UmVxdWlyZWQiLCJkZXF1ZXVlU2hvcnQiLCJub25lIiwic3BsaXRUeXBlIiwic3BsaXQiLCJtZXJnZSIsIkFjY291bnRCYXNlIiwid29ya2NoYWluX2lkIiwiZG9jcyIsImFjY291bnQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImJpdHMiLCJjZWxscyIsInB1YmxpY19jZWxscyIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiY29kZV9oYXNoIiwiZGF0YSIsImRhdGFfaGFzaCIsImxpYnJhcnkiLCJsaWJyYXJ5X2hhc2giLCJwcm9vZiIsImJvYyIsInN0YXRlX2hhc2giLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiTWVzc2FnZSIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYmxvY2siLCJib2R5IiwiYm9keV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImJhbGFuY2VfZGVsdGEiLCJiYWxhbmNlX2RlbHRhX290aGVyIiwiQmxvY2tTaWduYXR1cmVzIiwiYmxvY2tTaWduYXR1cmVzIiwiZ2VuX3V0aW1lIiwic2VxX25vIiwic2hhcmQiLCJ2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiY2F0Y2hhaW5fc2Vxbm8iLCJzaWdfd2VpZ2h0Iiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkNvbmZpZyIsInAwIiwibWFzdGVyIiwiY29uZmlnIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJnZW5fc29mdHdhcmVfdmVyc2lvbiIsImdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJrZXlfYmxvY2siLCJaZXJvc3RhdGUiLCJ6ZXJvc3RhdGUiLCJ0b3RhbF9iYWxhbmNlIiwidG90YWxfYmFsYW5jZV9vdGhlciIsImdsb2JhbF9iYWxhbmNlIiwiZ2xvYmFsX2JhbGFuY2Vfb3RoZXIiLCJhY2NvdW50cyIsImlkIiwibGlicmFyaWVzIiwiaGFzaCIsInB1Ymxpc2hlcnMiLCJsaWIiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBR0E7O0FBbUJBOztBQXhDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUE0QkEsTUFBTTtBQUFFQSxFQUFBQSxNQUFGO0FBQVVDLEVBQUFB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RXZGLE1BQU0sQ0FBQ29FLGNBQUtrWCxTQUFMLENBQWUvVixHQUFoQjtBQTFCWSxDQUEzQixDLENBNkJBOztBQUVBLE1BQU0wVyxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxLQUFLLEVBQUU7QUFDSEMsTUFBQUEsYUFBYSxFQUFiQSw0QkFERztBQUVIelAsTUFBQUEsU0FGRztBQUdITSxNQUFBQSxXQUhHO0FBSUhNLE1BQUFBLEtBSkc7QUFLSE8sTUFBQUEsTUFMRztBQU1IakksTUFBQUEsT0FORztBQU9Ia1MsTUFBQUEsS0FQRztBQVFIdFMsTUFBQUEsT0FSRztBQVNINEIsTUFBQUEsV0FURztBQVVIMEUsTUFBQUEsZUFWRztBQVdId0QsTUFBQUEsZUFYRztBQVlIUyxNQUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUEsbUJBZkc7QUFnQkhRLE1BQUFBLE1BaEJHO0FBaUJIbUosTUFBQUE7QUFqQkc7QUFESDtBQURZLENBQXhCO2VBd0JlWSxNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJy4vc2NoZW1hLmpzJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAnLi9zY2hlbWEuanMnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHUxMjgsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHVuaXhTZWNvbmRzLFxuICAgIHdpdGhEb2MsXG4gICAgc3RyaW5nV2l0aExvd2VyRmlsdGVyLFxufSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIGRlcXVldWVTaG9ydDogNyxcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYXNlOiBUeXBlRGVmID0ge1xuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50U3RhdHVzKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBiaXRzOiB1NjQoZG9jcy5hY2NvdW50LmJpdHMpLFxuICAgIGNlbGxzOiB1NjQoZG9jcy5hY2NvdW50LmNlbGxzKSxcbiAgICBwdWJsaWNfY2VsbHM6IHU2NChkb2NzLmFjY291bnQucHVibGljX2NlbGxzKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGNvZGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYWNjb3VudC5jb2RlX2hhc2gpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgZGF0YV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5hY2NvdW50LmRhdGFfaGFzaCksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBsaWJyYXJ5X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmFjY291bnQubGlicmFyeV9oYXNoKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG4gICAgc3RhdGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYWNjb3VudC5zdGF0ZV9oYXNoKSxcbn07XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgLi4uQWNjb3VudEJhc2UsXG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgYm9keV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmJvZHlfaGFzaCksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBjb2RlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLm1lc3NhZ2UuY29kZV9oYXNoKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGRhdGFfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5kYXRhX2hhc2gpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgbGlicmFyeV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmxpYnJhcnlfaGFzaCksXG4gICAgc3JjOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLmRzdF93b3JrY2hhaW5faWQpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdW5peFNlY29uZHMoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfYXQpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbChkb2NzLm1lc3NhZ2UuaWhyX2Rpc2FibGVkKSxcbiAgICBpaHJfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaWhyX2ZlZSksXG4gICAgZndkX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmZ3ZF9mZWUpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5pbXBvcnRfZmVlKSxcbiAgICBib3VuY2U6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZSksXG4gICAgYm91bmNlZDogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlZCksXG4gICAgdmFsdWU6IGdyYW1zKGRvY3MubWVzc2FnZS52YWx1ZSksXG4gICAgdmFsdWVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MubWVzc2FnZS52YWx1ZV9vdGhlciksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLm1lc3NhZ2UucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2MpLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnb3V0X21zZ3NbKl0nLCAncGFyZW50LmNyZWF0ZWRfbHQgIT09IFxcJzAwXFwnICYmIHBhcmVudC5tc2dfdHlwZSAhPT0gMScpLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnaW5fbXNnJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMicpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MudHJhbnNhY3Rpb24ud29ya2NoYWluX2lkKSxcbiAgICBsdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ubHQpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19oYXNoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcbiAgICBub3c6IHVuaXhTZWNvbmRzKGRvY3MudHJhbnNhY3Rpb24ubm93KSxcbiAgICBvdXRtc2dfY250OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5vdXRtc2dfY250KSxcbiAgICBvcmlnX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLm9yaWdfc3RhdHVzKSxcbiAgICBlbmRfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uZW5kX3N0YXR1cyksXG4gICAgaW5fbXNnOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5pbl9tc2cpLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oeyBNZXNzYWdlIH0sICdpbl9tc2cnLCAnaWQnKSxcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5vdXRfbXNncykpLFxuICAgIG91dF9tZXNzYWdlczogYXJyYXlPZihqb2luKHsgTWVzc2FnZSB9LCAnb3V0X21zZ3MnLCAnaWQnKSksXG4gICAgdG90YWxfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzKSxcbiAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXNfb3RoZXIpLFxuICAgIG9sZF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5vbGRfaGFzaCksXG4gICAgbmV3X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLm5ld19oYXNoKSxcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jcmVkaXRfZmlyc3QpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZSksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0YXR1c19jaGFuZ2UpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXQpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdF9vdGhlciksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmNvbXB1dGVfdHlwZSkpLFxuICAgICAgICBza2lwcGVkX3JlYXNvbjogc2tpcFJlYXNvbihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc2tpcHBlZF9yZWFzb24pLFxuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5zdWNjZXNzKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1zZ19zdGF0ZV91c2VkKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmFjY291bnRfYWN0aXZhdGVkKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfZmVlcyksXG4gICAgICAgIGdhc191c2VkOiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc191c2VkKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19saW1pdCksXG4gICAgICAgIGdhc19jcmVkaXQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2NyZWRpdCksXG4gICAgICAgIG1vZGU6IGk4KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tb2RlKSxcbiAgICAgICAgZXhpdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfY29kZSksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfYXJnKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fc3RlcHMpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoKSxcbiAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9maW5hbF9zdGF0ZV9oYXNoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN1Y2Nlc3MpLFxuICAgICAgICB2YWxpZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi52YWxpZCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm5vX2Z1bmRzKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdGF0dXNfY2hhbmdlKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzKSxcbiAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2FjdGlvbl9mZWVzKSxcbiAgICAgICAgcmVzdWx0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfY29kZSksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfYXJnKSxcbiAgICAgICAgdG90X2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RfYWN0aW9ucyksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNwZWNfYWN0aW9ucyksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNraXBwZWRfYWN0aW9ucyksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm1zZ3NfY3JlYXRlZCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5hY3Rpb25fbGlzdF9oYXNoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9iaXRzKSxcbiAgICB9LFxuICAgIGJvdW5jZToge1xuICAgICAgICBib3VuY2VfdHlwZTogcmVxdWlyZWQoYm91bmNlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5ib3VuY2VfdHlwZSkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2JpdHMpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLnJlcV9md2RfZmVlcyksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfZmVlcyksXG4gICAgICAgIGZ3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5md2RfZmVlcyksXG4gICAgfSxcbiAgICBhYm9ydGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWJvcnRlZCksXG4gICAgZGVzdHJveWVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uZGVzdHJveWVkKSxcbiAgICB0dDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24udHQpLFxuICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbiksXG4gICAgICAgIGFjY19zcGxpdF9kZXB0aDogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCksXG4gICAgICAgIHRoaXNfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby50aGlzX2FkZHIpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uc2libGluZ19hZGRyKSxcbiAgICB9LFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLnByZXBhcmVfdHJhbnNhY3Rpb24pLFxuICAgIGluc3RhbGxlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmluc3RhbGxlZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmJvYyksXG4gICAgYmFsYW5jZV9kZWx0YTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5iYWxhbmNlX2RlbHRhKSxcbiAgICBiYWxhbmNlX2RlbHRhX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmJhbGFuY2VfZGVsdGEpLFxufTtcblxuLy8gQkxPQ0sgU0lHTkFUVVJFU1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9ja1NpZ25hdHVyZXMuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2tTaWduYXR1cmVzLmdlbl91dGltZSksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2VxX25vKSxcbiAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNoYXJkKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy53b3JrY2hhaW5faWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMucHJvb2YpLFxuICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy52YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICBjYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLmNhdGNoYWluX3NlcW5vKSxcbiAgICBzaWdfd2VpZ2h0OiB1NjQoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnX3dlaWdodCksXG4gICAgc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgIG5vZGVfaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgICAgICByOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgczogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMucyksXG4gICAgfSwgZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5fZG9jKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpLFxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxuICAgIG1zZ19lbnZfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgbmV4dF93b3JrY2hhaW46IGkzMigpLFxuICAgIG5leHRfYWRkcl9wZng6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHU2NCgpLFxuICAgIGdhc19saW1pdDogdTY0KCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGdhc19jcmVkaXQ6IHU2NCgpLFxuICAgIGJsb2NrX2dhc19saW1pdDogdTY0KCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiB1NjQoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogdTY0KCksXG4gICAgYml0X3ByaWNlOiB1NjQoKSxcbiAgICBjZWxsX3ByaWNlOiB1NjQoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1bml4U2Vjb25kcygpLFxuICAgIHV0aW1lX3VudGlsOiB1bml4U2Vjb25kcygpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHU2NCgpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICAgICAgd2VpZ2h0OiB1NjQoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwOiBUeXBlRGVmID0ge1xuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1heF90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1pbl93aW5zOiB1OCgpLFxuICAgIG1heF9sb3NzZXM6IHU4KCksXG4gICAgbWluX3N0b3JlX3NlYzogdTMyKCksXG4gICAgbWF4X3N0b3JlX3NlYzogdTMyKCksXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcbiAgICBjZWxsX3ByaWNlOiB1MzIoKSxcbn07XG5cbmNvbnN0IGNvbmZpZ1Byb3Bvc2FsU2V0dXAgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWdQcm9wb3NhbFNldHVwIH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZzogVHlwZURlZiA9IHtcbiAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgcDE6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEpLFxuICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgcDQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDQpLFxuICAgIHA2OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICBtaW50X25ld19wcmljZTogc3RyaW5nKCksXG4gICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIHA3OiBhcnJheU9mKHtcbiAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA3Ll9kb2MpLFxuICAgIHA4OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiB1NjQoKSxcbiAgICB9LFxuICAgIHA5OiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDkuX2RvYyksXG4gICAgcDEwOiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEwLl9kb2MpLFxuICAgIHAxMToge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLl9kb2MsXG4gICAgICAgIG5vcm1hbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zKSxcbiAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcbiAgICB9LFxuICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgIGVuYWJsZWRfc2luY2U6IHUzMigpLFxuICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgIG1heF9zcGxpdDogdTgoKSxcbiAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgIGZsYWdzOiB1MTYoKSxcbiAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgIHZtX21vZGU6IHN0cmluZygpLFxuICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICBhZGRyX2xlbl9zdGVwOiB1MTYoKSxcbiAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgcDE0OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxuICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxuICAgIH0sXG4gICAgcDE1OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxuICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICB9LFxuICAgIHAxNjoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICB9LFxuICAgIHAxNzoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgIG1pbl9zdGFrZTogdTEyOCgpLFxuICAgICAgICBtYXhfc3Rha2U6IHUxMjgoKSxcbiAgICAgICAgbWluX3RvdGFsX3N0YWtlOiB1MTI4KCksXG4gICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpLFxuICAgIH0sXG4gICAgcDE4OiBhcnJheU9mKHtcbiAgICAgICAgdXRpbWVfc2luY2U6IHVuaXhTZWNvbmRzKCksXG4gICAgICAgIGJpdF9wcmljZV9wczogdTY0KCksXG4gICAgICAgIGNlbGxfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICBtY19iaXRfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiB1NjQoKSxcbiAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgIHAyMDogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjApLFxuICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgcDIzOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIzKSxcbiAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgIHAyODoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogYm9vbCgpLFxuICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiB1MzIoKSxcbiAgICB9LFxuICAgIHAyOToge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI5Ll9kb2MsXG4gICAgICAgIG5ld19jYXRjaGFpbl9pZHM6IGJvb2woKSxcbiAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxuICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcbiAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKSxcbiAgICB9LFxuICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICBwMzI6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMyKSxcbiAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICBwMzU6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM1KSxcbiAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICBwMzk6IGFycmF5T2Yoe1xuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICBzZXFubzogdTMyKCksXG4gICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICBzaWduYXR1cmVfczogc3RyaW5nKCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbn07XG5cbmNvbnN0IGNvbmZpZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZyB9LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKGRvY3MuYmxvY2suc3RhdHVzKSxcbiAgICBnbG9iYWxfaWQ6IGkzMihkb2NzLmJsb2NrLmdsb2JhbF9pZCksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2suc2VxX25vKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbChkb2NzLmJsb2NrLmFmdGVyX21lcmdlKSxcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfdmVyc2lvbiksXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc3RyaW5nKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWQpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyKSxcbiAgICAgICAgbWludGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlciksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coZG9jcy5ibG9jay5pbl9tc2dfZGVzY3IpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZyhkb2NzLmJsb2NrLnJhbmRfc2VlZCksXG4gICAgY3JlYXRlZF9ieTogc3RyaW5nKGRvY3MuYmxvY2suY3JlYXRlZF9ieSksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coZG9jcy5ibG9jay5vdXRfbXNnX2Rlc2NyKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMsXG4gICAgICAgICksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KSxcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCksXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2subWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICAgICAgY29uZmlnOiBjb25maWcoKSxcbiAgICB9LFxuICAgIGtleV9ibG9jazogYm9vbChkb2NzLmJsb2NrLmtleV9ibG9jayksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5ibG9jay5ib2MpLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJywgJ2lkJyksXG59O1xuXG5jb25zdCBaZXJvc3RhdGU6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy56ZXJvc3RhdGUuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICd6ZXJvc3RhdGVzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuemVyb3N0YXRlLndvcmtjaGFpbl9pZCksXG4gICAgZ2xvYmFsX2lkOiBpMzIoZG9jcy56ZXJvc3RhdGUuZ2xvYmFsX2lkKSxcbiAgICB0b3RhbF9iYWxhbmNlOiBncmFtcyhkb2NzLnplcm9zdGF0ZS50b3RhbF9iYWxhbmNlKSxcbiAgICB0b3RhbF9iYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnplcm9zdGF0ZS50b3RhbF9iYWxhbmNlX290aGVyKSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuemVyb3N0YXRlLm1hc3Rlci52YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICAgICAgZ2xvYmFsX2JhbGFuY2U6IGdyYW1zKGRvY3MuemVyb3N0YXRlLm1hc3Rlci5nbG9iYWxfYmFsYW5jZSksXG4gICAgICAgIGdsb2JhbF9iYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnplcm9zdGF0ZS5tYXN0ZXIuZ2xvYmFsX2JhbGFuY2Vfb3RoZXIpLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgICAgIGNvbmZpZzogY29uZmlnKCksXG4gICAgfSxcbiAgICBhY2NvdW50czogYXJyYXlPZih7XG4gICAgICAgIC4uLkFjY291bnRCYXNlLFxuICAgICAgICBpZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgfSwgZG9jcy56ZXJvc3RhdGUuYWNjb3VudHMpLFxuICAgIGxpYnJhcmllczogYXJyYXlPZihcbiAgICAgICAge1xuICAgICAgICAgICAgaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuemVyb3N0YXRlLmxpYnJhcmllcy5oYXNoKSxcbiAgICAgICAgICAgIHB1Ymxpc2hlcnM6IGFycmF5T2Yoc3RyaW5nKCksIGRvY3MuemVyb3N0YXRlLmxpYnJhcmllcy5wdWJsaXNoZXJzKSxcbiAgICAgICAgICAgIGxpYjogc3RyaW5nKGRvY3MuemVyb3N0YXRlLmxpYnJhcmllcy5saWIpLFxuICAgICAgICB9LFxuICAgICAgICBkb2NzLnplcm9zdGF0ZS5saWJyYXJpZXMuX2RvYyxcbiAgICApLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuemVyb3N0YXRlLmJvYyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0LFxuICAgICAgICAgICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICAgICAgICAgIENvbmZpZyxcbiAgICAgICAgICAgIFplcm9zdGF0ZSxcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19