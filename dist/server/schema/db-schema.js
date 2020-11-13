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

const account = () => ref({
  Account
});

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
    config_addr: string(),
    config: config()
  },
  accounts: arrayOf({
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
  }, _dbShema.docs.zerostate.accounts),
  libraries: arrayOf({
    hash: string(_dbShema.docs.zerostate.libraries.hash),
    publishers: arrayOf(string(), _dbShema.docs.zerostate.libraries.publishers),
    lib: string(_dbShema.docs.zerostate.libraries.lib)
  }, _dbShema.docs.zerostate.libraries._doc)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJzdHJpbmciLCJib29sIiwicmVmIiwiYXJyYXlPZiIsIkRlZiIsImFjY291bnRTdGF0dXMiLCJ1bmluaXQiLCJhY3RpdmUiLCJmcm96ZW4iLCJub25FeGlzdCIsImFjY291bnRTdGF0dXNDaGFuZ2UiLCJ1bmNoYW5nZWQiLCJkZWxldGVkIiwic2tpcFJlYXNvbiIsIm5vU3RhdGUiLCJiYWRTdGF0ZSIsIm5vR2FzIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwiZmluYWwiLCJ0cmFuc2l0IiwiZGlzY2FyZGVkRmluYWwiLCJkaXNjYXJkZWRUcmFuc2l0Iiwib3V0TXNnVHlwZSIsIm91dE1zZ05ldyIsImRlcXVldWVJbW1lZGlhdGVseSIsImRlcXVldWUiLCJ0cmFuc2l0UmVxdWlyZWQiLCJkZXF1ZXVlU2hvcnQiLCJub25lIiwic3BsaXRUeXBlIiwic3BsaXQiLCJtZXJnZSIsIkFjY291bnQiLCJfZG9jIiwiZG9jcyIsImFjY291bnQiLCJfIiwiY29sbGVjdGlvbiIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsImNvZGUiLCJjb2RlX2hhc2giLCJkYXRhIiwiZGF0YV9oYXNoIiwibGlicmFyeSIsImxpYnJhcnlfaGFzaCIsInByb29mIiwiYm9jIiwic3RhdGVfaGFzaCIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJsb2NrIiwiYm9keSIsImJvZHlfaGFzaCIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkJsb2NrU2lnbmF0dXJlcyIsImJsb2NrU2lnbmF0dXJlcyIsImdlbl91dGltZSIsInNlcV9ubyIsInNoYXJkIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJkb2MiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4Iiwib3V0TXNnIiwic2hhcmREZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiZ2FzTGltaXRzUHJpY2VzIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiZ2FzIiwibHRfZGVsdGEiLCJibG9ja0xpbWl0cyIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwibXNnRm9yd2FyZFByaWNlcyIsIlZhbGlkYXRvclNldCIsInV0aW1lX3NpbmNlIiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwidmFsaWRhdG9yU2V0IiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJDb25maWciLCJwMCIsIm1hc3RlciIsImNvbmZpZyIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJjcmVhdGVkX2J5Iiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwia2V5X2Jsb2NrIiwiWmVyb3N0YXRlIiwiemVyb3N0YXRlIiwidG90YWxfYmFsYW5jZSIsInRvdGFsX2JhbGFuY2Vfb3RoZXIiLCJnbG9iYWxfYmFsYW5jZSIsImdsb2JhbF9iYWxhbmNlX290aGVyIiwiYWNjb3VudHMiLCJsaWJyYXJpZXMiLCJoYXNoIiwicHVibGlzaGVycyIsImxpYiIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFHQTs7QUFrQkE7O0FBdkNBOzs7Ozs7Ozs7Ozs7Ozs7QUF5Q0EsTUFBTTtBQUFFQSxFQUFBQSxNQUFGO0FBQVVDLEVBQUFBLElBQVY7QUFBZ0JDLEVBQUFBLEdBQWhCO0FBQXFCQyxFQUFBQTtBQUFyQixJQUFpQ0MsV0FBdkM7QUFHQSxNQUFNQyxhQUFhLEdBQUcsMkJBQU8sZUFBUCxFQUF3QjtBQUMxQ0MsRUFB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TUFBTSxDQUFDb0UsY0FBSzhXLFNBQUwsQ0FBZU0sU0FBZixDQUF5QkMsSUFBMUIsQ0FEaEI7QUFFSUMsSUFBQUEsVUFBVSxFQUFFdmIsT0FBTyxDQUFDSCxNQUFNLEVBQVAsRUFBV29FLGNBQUs4VyxTQUFMLENBQWVNLFNBQWYsQ0FBeUJFLFVBQXBDLENBRnZCO0FBR0lDLElBQUFBLEdBQUcsRUFBRTNiLE1BQU0sQ0FBQ29FLGNBQUs4VyxTQUFMLENBQWVNLFNBQWYsQ0FBeUJHLEdBQTFCO0FBSGYsR0FEYyxFQU1kdlgsY0FBSzhXLFNBQUwsQ0FBZU0sU0FBZixDQUF5QnJYLElBTlg7QUFuQ0ssQ0FBM0IsQyxDQTZDQTs7QUFFQSxNQUFNeVgsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSHhQLE1BQUFBLFNBRkc7QUFHSE0sTUFBQUEsV0FIRztBQUlITSxNQUFBQSxLQUpHO0FBS0hPLE1BQUFBLE1BTEc7QUFNSGpJLE1BQUFBLE9BTkc7QUFPSGtTLE1BQUFBLEtBUEc7QUFRSHpULE1BQUFBLE9BUkc7QUFTSCtDLE1BQUFBLFdBVEc7QUFVSDBFLE1BQUFBLGVBVkc7QUFXSHdELE1BQUFBLGVBWEc7QUFZSFMsTUFBQUEsV0FaRztBQWFIUSxNQUFBQSxnQkFiRztBQWNIUSxNQUFBQSxZQWRHO0FBZUhVLE1BQUFBLG1CQWZHO0FBZ0JIUSxNQUFBQSxNQWhCRztBQWlCSG1KLE1BQUFBO0FBakJHO0FBREg7QUFEWSxDQUF4QjtlQXdCZVcsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICcuL3NjaGVtYS5qcyc7XG5cbmltcG9ydCB0eXBlIHsgVHlwZURlZiB9IGZyb20gJy4vc2NoZW1hLmpzJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1MTI4LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB1bml4U2Vjb25kcyxcbiAgICB3aXRoRG9jLFxufSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIGRlcXVldWVTaG9ydDogNyxcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5hY2NvdW50LndvcmtjaGFpbl9pZCksXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRTdGF0dXMoZG9jcy5hY2NvdW50LmFjY190eXBlKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoZG9jcy5hY2NvdW50Lmxhc3RfcGFpZCkpLFxuICAgIGR1ZV9wYXltZW50OiBncmFtcyhkb2NzLmFjY291bnQuZHVlX3BheW1lbnQpLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NChkb2NzLmFjY291bnQubGFzdF90cmFuc19sdCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKGRvY3MuYWNjb3VudC5iYWxhbmNlKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5hY2NvdW50LmJhbGFuY2Vfb3RoZXIpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLmFjY291bnQuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5hY2NvdW50LnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5hY2NvdW50LnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZSksXG4gICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGVfaGFzaCksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhKSxcbiAgICBkYXRhX2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YV9oYXNoKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnkpLFxuICAgIGxpYnJhcnlfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5X2hhc2gpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5hY2NvdW50LnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmFjY291bnQuYm9jKSxcbiAgICBzdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LnN0YXRlX2hhc2gpLFxufTtcblxuY29uc3QgYWNjb3VudCA9ICgpID0+IHJlZih7IEFjY291bnQgfSk7XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5tZXNzYWdlLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKGRvY3MubWVzc2FnZS5tc2dfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQobWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMoZG9jcy5tZXNzYWdlLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiByZXF1aXJlZChzdHJpbmcoZG9jcy5tZXNzYWdlLmJsb2NrX2lkKSksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXG4gICAgYm9keTogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5KSxcbiAgICBib2R5X2hhc2g6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keV9oYXNoKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5tZXNzYWdlLnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MubWVzc2FnZS50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MubWVzc2FnZS50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGUpLFxuICAgIGNvZGVfaGFzaDogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlX2hhc2gpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YSksXG4gICAgZGF0YV9oYXNoOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGFfaGFzaCksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5KSxcbiAgICBsaWJyYXJ5X2hhc2g6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeV9oYXNoKSxcbiAgICBzcmM6IHN0cmluZyhkb2NzLm1lc3NhZ2Uuc3JjKSxcbiAgICBkc3Q6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZHN0KSxcbiAgICBzcmNfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLnNyY193b3JrY2hhaW5faWQpLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2UuZHN0X3dvcmtjaGFpbl9pZCksXG4gICAgY3JlYXRlZF9sdDogdTY0KGRvY3MubWVzc2FnZS5jcmVhdGVkX2x0KSxcbiAgICBjcmVhdGVkX2F0OiB1bml4U2Vjb25kcyhkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdvdXRfbXNnc1sqXScsICdwYXJlbnQuY3JlYXRlZF9sdCAhPT0gXFwnMDBcXCcgJiYgcGFyZW50Lm1zZ190eXBlICE9PSAxJyksXG4gICAgZHN0X3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdpbl9tc2cnLCAncGFyZW50Lm1zZ190eXBlICE9PSAyJyksXG59O1xuXG5cbmNvbnN0IFRyYW5zYWN0aW9uOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MudHJhbnNhY3Rpb24uX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnIH0sXG4gICAgdHJfdHlwZTogcmVxdWlyZWQodHJhbnNhY3Rpb25UeXBlKGRvY3MudHJhbnNhY3Rpb24udHJfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQodHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmJsb2NrX2lkKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcbiAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmFjY291bnRfYWRkciksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi53b3JrY2hhaW5faWQpLFxuICAgIGx0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5sdCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2hhc2gpLFxuICAgIHByZXZfdHJhbnNfbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfbHQpLFxuICAgIG5vdzogdTMyKGRvY3MudHJhbnNhY3Rpb24ubm93KSxcbiAgICBvdXRtc2dfY250OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5vdXRtc2dfY250KSxcbiAgICBvcmlnX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLm9yaWdfc3RhdHVzKSxcbiAgICBlbmRfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24uZW5kX3N0YXR1cyksXG4gICAgaW5fbXNnOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5pbl9tc2cpLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oeyBNZXNzYWdlIH0sICdpbl9tc2cnLCAnaWQnKSxcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5vdXRfbXNncykpLFxuICAgIG91dF9tZXNzYWdlczogYXJyYXlPZihqb2luKHsgTWVzc2FnZSB9LCAnb3V0X21zZ3MnLCAnaWQnKSksXG4gICAgdG90YWxfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzKSxcbiAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXNfb3RoZXIpLFxuICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5vbGRfaGFzaCksXG4gICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm5ld19oYXNoKSxcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jcmVkaXRfZmlyc3QpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2R1ZSksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0YXR1c19jaGFuZ2UpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuZHVlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXQpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdF9vdGhlciksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmNvbXB1dGVfdHlwZSkpLFxuICAgICAgICBza2lwcGVkX3JlYXNvbjogc2tpcFJlYXNvbihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc2tpcHBlZF9yZWFzb24pLFxuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5zdWNjZXNzKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1zZ19zdGF0ZV91c2VkKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmFjY291bnRfYWN0aXZhdGVkKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfZmVlcyksXG4gICAgICAgIGdhc191c2VkOiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc191c2VkKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19saW1pdCksXG4gICAgICAgIGdhc19jcmVkaXQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2NyZWRpdCksXG4gICAgICAgIG1vZGU6IGk4KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tb2RlKSxcbiAgICAgICAgZXhpdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfY29kZSksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmV4aXRfYXJnKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fc3RlcHMpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1faW5pdF9zdGF0ZV9oYXNoKSxcbiAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9maW5hbF9zdGF0ZV9oYXNoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN1Y2Nlc3MpLFxuICAgICAgICB2YWxpZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi52YWxpZCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm5vX2Z1bmRzKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdGF0dXNfY2hhbmdlKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2Z3ZF9mZWVzKSxcbiAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX2FjdGlvbl9mZWVzKSxcbiAgICAgICAgcmVzdWx0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfY29kZSksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5yZXN1bHRfYXJnKSxcbiAgICAgICAgdG90X2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RfYWN0aW9ucyksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNwZWNfYWN0aW9ucyksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnNraXBwZWRfYWN0aW9ucyksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLm1zZ3NfY3JlYXRlZCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5hY3Rpb25fbGlzdF9oYXNoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9tc2dfc2l6ZV9iaXRzKSxcbiAgICB9LFxuICAgIGJvdW5jZToge1xuICAgICAgICBib3VuY2VfdHlwZTogcmVxdWlyZWQoYm91bmNlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5ib3VuY2VfdHlwZSkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19zaXplX2JpdHMpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLnJlcV9md2RfZmVlcyksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfZmVlcyksXG4gICAgICAgIGZ3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5md2RfZmVlcyksXG4gICAgfSxcbiAgICBhYm9ydGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWJvcnRlZCksXG4gICAgZGVzdHJveWVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uZGVzdHJveWVkKSxcbiAgICB0dDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24udHQpLFxuICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5jdXJfc2hhcmRfcGZ4X2xlbiksXG4gICAgICAgIGFjY19zcGxpdF9kZXB0aDogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmFjY19zcGxpdF9kZXB0aCksXG4gICAgICAgIHRoaXNfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby50aGlzX2FkZHIpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uc2libGluZ19hZGRyKSxcbiAgICB9LFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXBhcmVfdHJhbnNhY3Rpb24pLFxuICAgIGluc3RhbGxlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmluc3RhbGxlZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmJvYyksXG4gICAgYmFsYW5jZV9kZWx0YTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5iYWxhbmNlX2RlbHRhKSxcbiAgICBiYWxhbmNlX2RlbHRhX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmJhbGFuY2VfZGVsdGEpLFxufTtcblxuLy8gQkxPQ0sgU0lHTkFUVVJFU1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9ja1NpZ25hdHVyZXMuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2tTaWduYXR1cmVzLmdlbl91dGltZSksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2VxX25vKSxcbiAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNoYXJkKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy53b3JrY2hhaW5faWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMucHJvb2YpLFxuICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy52YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICBjYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLmNhdGNoYWluX3NlcW5vKSxcbiAgICBzaWdfd2VpZ2h0OiB1NjQoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnX3dlaWdodCksXG4gICAgc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgIG5vZGVfaWQ6IHN0cmluZygpLFxuICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMucyksXG4gICAgfSwgZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5fZG9jKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpLFxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpLFxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxuICAgIG1zZ19lbnZfaGFzaDogc3RyaW5nKCksXG4gICAgbmV4dF93b3JrY2hhaW46IGkzMigpLFxuICAgIG5leHRfYWRkcl9wZng6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHU2NCgpLFxuICAgIGdhc19saW1pdDogdTY0KCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGdhc19jcmVkaXQ6IHU2NCgpLFxuICAgIGJsb2NrX2dhc19saW1pdDogdTY0KCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogdTY0KCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiB1NjQoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogdTY0KCksXG4gICAgYml0X3ByaWNlOiB1NjQoKSxcbiAgICBjZWxsX3ByaWNlOiB1NjQoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1bml4U2Vjb25kcygpLFxuICAgIHV0aW1lX3VudGlsOiB1bml4U2Vjb25kcygpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHU2NCgpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiB1NjQoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwOiBUeXBlRGVmID0ge1xuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1heF90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1pbl93aW5zOiB1OCgpLFxuICAgIG1heF9sb3NzZXM6IHU4KCksXG4gICAgbWluX3N0b3JlX3NlYzogdTMyKCksXG4gICAgbWF4X3N0b3JlX3NlYzogdTMyKCksXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcbiAgICBjZWxsX3ByaWNlOiB1MzIoKSxcbn07XG5cbmNvbnN0IGNvbmZpZ1Byb3Bvc2FsU2V0dXAgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWdQcm9wb3NhbFNldHVwIH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZzogVHlwZURlZiA9IHtcbiAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgcDE6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEpLFxuICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgcDQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDQpLFxuICAgIHA2OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICBtaW50X25ld19wcmljZTogc3RyaW5nKCksXG4gICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIHA3OiBhcnJheU9mKHtcbiAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA3Ll9kb2MpLFxuICAgIHA4OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgY2FwYWJpbGl0aWVzOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIHA5OiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDkuX2RvYyksXG4gICAgcDEwOiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEwLl9kb2MpLFxuICAgIHAxMToge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLl9kb2MsXG4gICAgICAgIG5vcm1hbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zKSxcbiAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcbiAgICB9LFxuICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgIGVuYWJsZWRfc2luY2U6IHUzMigpLFxuICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgIG1heF9zcGxpdDogdTgoKSxcbiAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgIGZsYWdzOiB1MTYoKSxcbiAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgIHZtX21vZGU6IHN0cmluZygpLFxuICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICBhZGRyX2xlbl9zdGVwOiB1MTYoKSxcbiAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgcDE0OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxuICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBncmFtcygpLFxuICAgIH0sXG4gICAgcDE1OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxuICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICB9LFxuICAgIHAxNjoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICB9LFxuICAgIHAxNzoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgIG1pbl9zdGFrZTogdTEyOCgpLFxuICAgICAgICBtYXhfc3Rha2U6IHUxMjgoKSxcbiAgICAgICAgbWluX3RvdGFsX3N0YWtlOiB1MTI4KCksXG4gICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpLFxuICAgIH0sXG4gICAgcDE4OiBhcnJheU9mKHtcbiAgICAgICAgdXRpbWVfc2luY2U6IHVuaXhTZWNvbmRzKCksXG4gICAgICAgIGJpdF9wcmljZV9wczogdTY0KCksXG4gICAgICAgIGNlbGxfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICBtY19iaXRfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiB1NjQoKSxcbiAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgIHAyMDogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjApLFxuICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgcDIzOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIzKSxcbiAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgIHAyODoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogYm9vbCgpLFxuICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiB1MzIoKSxcbiAgICB9LFxuICAgIHAyOToge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI5Ll9kb2MsXG4gICAgICAgIG5ld19jYXRjaGFpbl9pZHM6IGJvb2woKSxcbiAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IHUzMigpLFxuICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgIGNhdGNoYWluX21heF9kZXBzOiB1MzIoKSxcbiAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKSxcbiAgICB9LFxuICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICBwMzI6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMyKSxcbiAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICBwMzU6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM1KSxcbiAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICBwMzk6IGFycmF5T2Yoe1xuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICBzZXFubzogdTMyKCksXG4gICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICBzaWduYXR1cmVfczogc3RyaW5nKCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbn07XG5cbmNvbnN0IGNvbmZpZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZyB9LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKGRvY3MuYmxvY2suc3RhdHVzKSxcbiAgICBnbG9iYWxfaWQ6IGkzMihkb2NzLmJsb2NrLmdsb2JhbF9pZCksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2suc2VxX25vKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbChkb2NzLmJsb2NrLmFmdGVyX21lcmdlKSxcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfdmVyc2lvbiksXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc3RyaW5nKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWQpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyKSxcbiAgICAgICAgbWludGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlciksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coZG9jcy5ibG9jay5pbl9tc2dfZGVzY3IpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZyhkb2NzLmJsb2NrLnJhbmRfc2VlZCksXG4gICAgY3JlYXRlZF9ieTogc3RyaW5nKGRvY3MuYmxvY2suY3JlYXRlZF9ieSksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coZG9jcy5ibG9jay5vdXRfbXNnX2Rlc2NyKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZihcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnMsXG4gICAgICAgICksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KSxcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aCksXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2subWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiBjb25maWcoKSxcbiAgICB9LFxuICAgIGtleV9ibG9jazogYm9vbChkb2NzLmJsb2NrLmtleV9ibG9jayksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5ibG9jay5ib2MpLFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJywgJ2lkJyksXG59O1xuXG5jb25zdCBaZXJvc3RhdGU6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy56ZXJvc3RhdGUuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICd6ZXJvc3RhdGVzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuemVyb3N0YXRlLndvcmtjaGFpbl9pZCksXG4gICAgZ2xvYmFsX2lkOiBpMzIoZG9jcy56ZXJvc3RhdGUuZ2xvYmFsX2lkKSxcbiAgICB0b3RhbF9iYWxhbmNlOiBncmFtcyhkb2NzLnplcm9zdGF0ZS50b3RhbF9iYWxhbmNlKSxcbiAgICB0b3RhbF9iYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnplcm9zdGF0ZS50b3RhbF9iYWxhbmNlX290aGVyKSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuemVyb3N0YXRlLm1hc3Rlci52YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICAgICAgZ2xvYmFsX2JhbGFuY2U6IGdyYW1zKGRvY3MuemVyb3N0YXRlLm1hc3Rlci5nbG9iYWxfYmFsYW5jZSksXG4gICAgICAgIGdsb2JhbF9iYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnplcm9zdGF0ZS5tYXN0ZXIuZ2xvYmFsX2JhbGFuY2Vfb3RoZXIpLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIGNvbmZpZzogY29uZmlnKCksXG4gICAgfSxcbiAgICBhY2NvdW50czogYXJyYXlPZih7XG4gICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgICAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFN0YXR1cyhkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICAgICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoZG9jcy5hY2NvdW50Lmxhc3RfcGFpZCkpLFxuICAgICAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICAgICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKGRvY3MuYWNjb3VudC5iYWxhbmNlKSksIC8vIGluZGV4XG4gICAgICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICAgICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgICAgIHRpY2s6IGJvb2woZG9jcy5hY2NvdW50LnRpY2spLFxuICAgICAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICAgICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICAgICAgY29kZV9oYXNoOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGVfaGFzaCksXG4gICAgICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgICAgIGRhdGFfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhX2hhc2gpLFxuICAgICAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnkpLFxuICAgICAgICBsaWJyYXJ5X2hhc2g6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeV9oYXNoKSxcbiAgICAgICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgICAgICBib2M6IHN0cmluZyhkb2NzLmFjY291bnQuYm9jKSxcbiAgICAgICAgc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MuYWNjb3VudC5zdGF0ZV9oYXNoKSxcbiAgICB9LCBkb2NzLnplcm9zdGF0ZS5hY2NvdW50cyksXG4gICAgbGlicmFyaWVzOiBhcnJheU9mKFxuICAgICAgICB7XG4gICAgICAgICAgICBoYXNoOiBzdHJpbmcoZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLmhhc2gpLFxuICAgICAgICAgICAgcHVibGlzaGVyczogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLnB1Ymxpc2hlcnMpLFxuICAgICAgICAgICAgbGliOiBzdHJpbmcoZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLmxpYiksXG4gICAgICAgIH0sXG4gICAgICAgIGRvY3MuemVyb3N0YXRlLmxpYnJhcmllcy5fZG9jLFxuICAgICksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0LFxuICAgICAgICAgICAgQ29uZmlnUHJvcG9zYWxTZXR1cCxcbiAgICAgICAgICAgIENvbmZpZyxcbiAgICAgICAgICAgIFplcm9zdGF0ZSxcbiAgICAgICAgfSxcbiAgICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19