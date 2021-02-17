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
  now: (0, _dbSchemaTypes.u32)(_dbShema.docs.transaction.now),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJzdHJpbmciLCJib29sIiwicmVmIiwiYXJyYXlPZiIsIkRlZiIsImFjY291bnRTdGF0dXMiLCJ1bmluaXQiLCJhY3RpdmUiLCJmcm96ZW4iLCJub25FeGlzdCIsImFjY291bnRTdGF0dXNDaGFuZ2UiLCJ1bmNoYW5nZWQiLCJkZWxldGVkIiwic2tpcFJlYXNvbiIsIm5vU3RhdGUiLCJiYWRTdGF0ZSIsIm5vR2FzIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwiZmluYWwiLCJ0cmFuc2l0IiwiZGlzY2FyZGVkRmluYWwiLCJkaXNjYXJkZWRUcmFuc2l0Iiwib3V0TXNnVHlwZSIsIm91dE1zZ05ldyIsImRlcXVldWVJbW1lZGlhdGVseSIsImRlcXVldWUiLCJ0cmFuc2l0UmVxdWlyZWQiLCJkZXF1ZXVlU2hvcnQiLCJub25lIiwic3BsaXRUeXBlIiwic3BsaXQiLCJtZXJnZSIsIkFjY291bnRCYXNlIiwid29ya2NoYWluX2lkIiwiZG9jcyIsImFjY291bnQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiY29kZV9oYXNoIiwiZGF0YSIsImRhdGFfaGFzaCIsImxpYnJhcnkiLCJsaWJyYXJ5X2hhc2giLCJwcm9vZiIsImJvYyIsInN0YXRlX2hhc2giLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiTWVzc2FnZSIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYmxvY2siLCJib2R5IiwiYm9keV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiVHJhbnNhY3Rpb24iLCJ0cmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsImJhbGFuY2VfZGVsdGEiLCJiYWxhbmNlX2RlbHRhX290aGVyIiwiQmxvY2tTaWduYXR1cmVzIiwiYmxvY2tTaWduYXR1cmVzIiwiZ2VuX3V0aW1lIiwic2VxX25vIiwic2hhcmQiLCJ2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiY2F0Y2hhaW5fc2Vxbm8iLCJzaWdfd2VpZ2h0Iiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkNvbmZpZyIsInAwIiwibWFzdGVyIiwiY29uZmlnIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJ2ZXJzaW9uIiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJnZW5fc29mdHdhcmVfdmVyc2lvbiIsImdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJrZXlfYmxvY2siLCJaZXJvc3RhdGUiLCJ6ZXJvc3RhdGUiLCJ0b3RhbF9iYWxhbmNlIiwidG90YWxfYmFsYW5jZV9vdGhlciIsImdsb2JhbF9iYWxhbmNlIiwiZ2xvYmFsX2JhbGFuY2Vfb3RoZXIiLCJhY2NvdW50cyIsImlkIiwibGlicmFyaWVzIiwiaGFzaCIsInB1Ymxpc2hlcnMiLCJsaWIiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBR0E7O0FBbUJBOztBQXhDQTs7Ozs7Ozs7Ozs7Ozs7O0FBMENBLE1BQU07QUFBRUEsRUFBQUEsTUFBRjtBQUFVQyxFQUFBQSxJQUFWO0FBQWdCQyxFQUFBQSxHQUFoQjtBQUFxQkMsRUFBQUE7QUFBckIsSUFBaUNDLFdBQXZDO0FBR0EsTUFBTUMsYUFBYSxHQUFHLDJCQUFPLGVB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QUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUEsbUJBZkc7QUFnQkhRLE1BQUFBLE1BaEJHO0FBaUJIbUosTUFBQUE7QUFqQkc7QUFESDtBQURZLENBQXhCO2VBd0JlWSxNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJy4vc2NoZW1hLmpzJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAnLi9zY2hlbWEuanMnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHUxMjgsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHVuaXhTZWNvbmRzLFxuICAgIHdpdGhEb2MsXG4gICAgc3RyaW5nV2l0aExvd2VyRmlsdGVyLFxufSBmcm9tICcuL2RiLXNjaGVtYS10eXBlcyc7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIGRlcXVldWVTaG9ydDogNyxcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnRCYXNlOiBUeXBlRGVmID0ge1xuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50U3RhdHVzKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGNvZGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYWNjb3VudC5jb2RlX2hhc2gpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgZGF0YV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5hY2NvdW50LmRhdGFfaGFzaCksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBsaWJyYXJ5X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmFjY291bnQubGlicmFyeV9oYXNoKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG4gICAgc3RhdGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYWNjb3VudC5zdGF0ZV9oYXNoKSxcbn07XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgLi4uQWNjb3VudEJhc2UsXG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgYm9keV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmJvZHlfaGFzaCksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBjb2RlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLm1lc3NhZ2UuY29kZV9oYXNoKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGRhdGFfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5kYXRhX2hhc2gpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgbGlicmFyeV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmxpYnJhcnlfaGFzaCksXG4gICAgc3JjOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLmRzdF93b3JrY2hhaW5faWQpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdW5peFNlY29uZHMoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfYXQpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbChkb2NzLm1lc3NhZ2UuaWhyX2Rpc2FibGVkKSxcbiAgICBpaHJfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaWhyX2ZlZSksXG4gICAgZndkX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmZ3ZF9mZWUpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5pbXBvcnRfZmVlKSxcbiAgICBib3VuY2U6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZSksXG4gICAgYm91bmNlZDogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlZCksXG4gICAgdmFsdWU6IGdyYW1zKGRvY3MubWVzc2FnZS52YWx1ZSksXG4gICAgdmFsdWVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MubWVzc2FnZS52YWx1ZV9vdGhlciksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLm1lc3NhZ2UucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2MpLFxuICAgIHNyY190cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnb3V0X21zZ3NbKl0nLCAncGFyZW50LmNyZWF0ZWRfbHQgIT09IFxcJzAwXFwnICYmIHBhcmVudC5tc2dfdHlwZSAhPT0gMScpLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnaW5fbXNnJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMicpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MudHJhbnNhY3Rpb24ud29ya2NoYWluX2lkKSxcbiAgICBsdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ubHQpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19oYXNoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcbiAgICBub3c6IHUzMihkb2NzLnRyYW5zYWN0aW9uLm5vdyksXG4gICAgb3V0bXNnX2NudDogaTMyKGRvY3MudHJhbnNhY3Rpb24ub3V0bXNnX2NudCksXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5vcmlnX3N0YXR1cyksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLmVuZF9zdGF0dXMpLFxuICAgIGluX21zZzogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uaW5fbXNnKSxcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJywgJ2lkJyksXG4gICAgb3V0X21zZ3M6IGFycmF5T2Yoc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ub3V0X21zZ3MpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJywgJ2lkJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlcyksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzX290aGVyKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ub2xkX2hhc2gpLFxuICAgIG5ld19oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5uZXdfaGFzaCksXG4gICAgY3JlZGl0X2ZpcnN0OiBib29sKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0X2ZpcnN0KSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdGF0dXNfY2hhbmdlKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0KSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXRfb3RoZXIpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5jb21wdXRlX3R5cGUpKSxcbiAgICAgICAgc2tpcHBlZF9yZWFzb246IHNraXBSZWFzb24oZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnNraXBwZWRfcmVhc29uKSxcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc3VjY2VzcyksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2ZlZXMpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfdXNlZCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfbGltaXQpLFxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19jcmVkaXQpLFxuICAgICAgICBtb2RlOiBpOChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubW9kZSksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2NvZGUpLFxuICAgICAgICBleGl0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2FyZyksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX3N0ZXBzKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCksXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdWNjZXNzKSxcbiAgICAgICAgdmFsaWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udmFsaWQpLFxuICAgICAgICBub19mdW5kczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5ub19mdW5kcyksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3RhdHVzX2NoYW5nZSksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9md2RfZmVlcyksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcyksXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2NvZGUpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2FyZyksXG4gICAgICAgIHRvdF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90X2FjdGlvbnMpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zcGVjX2FjdGlvbnMpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5za2lwcGVkX2FjdGlvbnMpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5tc2dzX2NyZWF0ZWQpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cyksXG4gICAgfSxcbiAgICBib3VuY2U6IHtcbiAgICAgICAgYm91bmNlX3R5cGU6IHJlcXVpcmVkKGJvdW5jZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuYm91bmNlX3R5cGUpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9iaXRzKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5yZXFfZndkX2ZlZXMpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX2ZlZXMpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuZndkX2ZlZXMpLFxuICAgIH0sXG4gICAgYWJvcnRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFib3J0ZWQpLFxuICAgIGRlc3Ryb3llZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmRlc3Ryb3llZCksXG4gICAgdHQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnR0KSxcbiAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uY3VyX3NoYXJkX3BmeF9sZW4pLFxuICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8udGhpc19hZGRyKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkciksXG4gICAgfSxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5wcmVwYXJlX3RyYW5zYWN0aW9uKSxcbiAgICBpbnN0YWxsZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5pbnN0YWxsZWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ib2MpLFxuICAgIGJhbGFuY2VfZGVsdGE6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYmFsYW5jZV9kZWx0YSksXG4gICAgYmFsYW5jZV9kZWx0YV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5iYWxhbmNlX2RlbHRhKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2tTaWduYXR1cmVzLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5nZW5fdXRpbWUpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNlcV9ubyksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaGFyZCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMud29ya2NoYWluX2lkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnByb29mKSxcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5jYXRjaGFpbl9zZXFubyksXG4gICAgc2lnX3dlaWdodDogdTY0KGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ193ZWlnaHQpLFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICAgICAgcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuciksXG4gICAgICAgIHM6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnMpLFxuICAgIH0sIGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuX2RvYyksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2lkJywgJ2lkJyksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEV4dEJsa1JlZiB9LCBkb2MpO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IGluTXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgSW5Nc2cgfSwgZG9jKTtcblxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChvdXRNc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgcmVpbXBvcnQ6IGluTXNnKCksXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbiAgICBtc2dfZW52X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIG5leHRfd29ya2NoYWluOiBpMzIoKSxcbiAgICBuZXh0X2FkZHJfcGZ4OiB1NjQoKSxcbn07XG5cbmNvbnN0IG91dE1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE91dE1zZyB9LCBkb2MpO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnNlcV9ubyksXG4gICAgcmVnX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnJlZ19tY19zZXFubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3Iuc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5lbmRfbHQpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3Muc2hhcmREZXNjci5yb290X2hhc2gpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3Muc2hhcmREZXNjci5maWxlX2hhc2gpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX3NwbGl0KSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9tZXJnZSksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9tZXJnZSksXG4gICAgbnhfY2NfdXBkYXRlZDogYm9vbChkb2NzLnNoYXJkRGVzY3IubnhfY2NfdXBkYXRlZCksXG4gICAgZmxhZ3M6IHU4KGRvY3Muc2hhcmREZXNjci5mbGFncyksXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5uZXh0X3ZhbGlkYXRvcl9zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBnZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3Muc2hhcmREZXNjci5nZW5fdXRpbWUpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZShkb2NzLnNoYXJkRGVzY3Iuc3BsaXRfdHlwZSksXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWQpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlciksXG59LCBkb2MpO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgZ2FzX3ByaWNlOiB1NjQoKSxcbiAgICBnYXNfbGltaXQ6IHU2NCgpLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBnYXNfY3JlZGl0OiB1NjQoKSxcbiAgICBibG9ja19nYXNfbGltaXQ6IHU2NCgpLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHU2NCgpLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHU2NCgpLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBmbGF0X2dhc19wcmljZTogdTY0KCksXG59O1xuXG5jb25zdCBnYXNMaW1pdHNQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBHYXNMaW1pdHNQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XG4gICAgYnl0ZXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgZ2FzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGx0X2RlbHRhOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxufTtcblxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGx1bXBfcHJpY2U6IHU2NCgpLFxuICAgIGJpdF9wcmljZTogdTY0KCksXG4gICAgY2VsbF9wcmljZTogdTY0KCksXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXG4gICAgZmlyc3RfZnJhYzogdTE2KCksXG4gICAgbmV4dF9mcmFjOiB1MTYoKSxcbn07XG5cbmNvbnN0IG1zZ0ZvcndhcmRQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBNc2dGb3J3YXJkUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IFZhbGlkYXRvclNldDogVHlwZURlZiA9IHtcbiAgICB1dGltZV9zaW5jZTogdW5peFNlY29uZHMoKSxcbiAgICB1dGltZV91bnRpbDogdW5peFNlY29uZHMoKSxcbiAgICB0b3RhbDogdTE2KCksXG4gICAgdG90YWxfd2VpZ2h0OiB1NjQoKSxcbiAgICBsaXN0OiBhcnJheU9mKHtcbiAgICAgICAgcHVibGljX2tleTogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgICAgIHdlaWdodDogdTY0KCksXG4gICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgfSksXG59O1xuXG5jb25zdCB2YWxpZGF0b3JTZXQgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBWYWxpZGF0b3JTZXQgfSwgZG9jKTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cDogVHlwZURlZiA9IHtcbiAgICBtaW5fdG90X3JvdW5kczogdTgoKSxcbiAgICBtYXhfdG90X3JvdW5kczogdTgoKSxcbiAgICBtaW5fd2luczogdTgoKSxcbiAgICBtYXhfbG9zc2VzOiB1OCgpLFxuICAgIG1pbl9zdG9yZV9zZWM6IHUzMigpLFxuICAgIG1heF9zdG9yZV9zZWM6IHUzMigpLFxuICAgIGJpdF9wcmljZTogdTMyKCksXG4gICAgY2VsbF9wcmljZTogdTMyKCksXG59O1xuXG5jb25zdCBjb25maWdQcm9wb3NhbFNldHVwID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQ29uZmlnUHJvcG9zYWxTZXR1cCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWc6IFR5cGVEZWYgPSB7XG4gICAgcDA6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDApLFxuICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcbiAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgcDM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMpLFxuICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcbiAgICBwNjoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDYuX2RvYyxcbiAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgfSxcbiAgICBwNzogYXJyYXlPZih7XG4gICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgdmFsdWU6IHN0cmluZygpLFxuICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcbiAgICBwODoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDguX2RvYyxcbiAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgIGNhcGFiaWxpdGllczogdTY0KCksXG4gICAgfSxcbiAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxuICAgIHAxMDogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMC5fZG9jKSxcbiAgICBwMTE6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5fZG9jLFxuICAgICAgICBub3JtYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcyksXG4gICAgICAgIGNyaXRpY2FsX3BhcmFtczogY29uZmlnUHJvcG9zYWxTZXR1cChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcyksXG4gICAgfSxcbiAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICBhY2NlcHRfbXNnczogYm9vbCgpLFxuICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgIHZtX3ZlcnNpb246IGkzMigpLFxuICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgbWF4X2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEyLl9kb2MpLFxuICAgIHAxNDoge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogZ3JhbXMoKSxcbiAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogZ3JhbXMoKSxcbiAgICB9LFxuICAgIHAxNToge1xuICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHUzMigpLFxuICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICBzdGFrZV9oZWxkX2ZvcjogdTMyKCksXG4gICAgfSxcbiAgICBwMTY6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNi5fZG9jLFxuICAgICAgICBtYXhfdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICBtaW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgfSxcbiAgICBwMTc6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNy5fZG9jLFxuICAgICAgICBtaW5fc3Rha2U6IHUxMjgoKSxcbiAgICAgICAgbWF4X3N0YWtlOiB1MTI4KCksXG4gICAgICAgIG1pbl90b3RhbF9zdGFrZTogdTEyOCgpLFxuICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiB1MzIoKSxcbiAgICB9LFxuICAgIHAxODogYXJyYXlPZih7XG4gICAgICAgIHV0aW1lX3NpbmNlOiB1bml4U2Vjb25kcygpLFxuICAgICAgICBiaXRfcHJpY2VfcHM6IHU2NCgpLFxuICAgICAgICBjZWxsX3ByaWNlX3BzOiB1NjQoKSxcbiAgICAgICAgbWNfYml0X3ByaWNlX3BzOiB1NjQoKSxcbiAgICAgICAgbWNfY2VsbF9wcmljZV9wczogdTY0KCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxOC5fZG9jKSxcbiAgICBwMjA6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIwKSxcbiAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICBwMjI6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjIpLFxuICAgIHAyMzogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMyksXG4gICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgIHAyNTogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI1KSxcbiAgICBwMjg6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IGJvb2woKSxcbiAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogdTMyKCksXG4gICAgfSxcbiAgICBwMjk6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOS5fZG9jLFxuICAgICAgICBuZXdfY2F0Y2hhaW5faWRzOiBib29sKCksXG4gICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxuICAgICAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogdTMyKCksXG4gICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXG4gICAgICAgIGF0dGVtcHRfZHVyYXRpb246IHUzMigpLFxuICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXG4gICAgICAgIG1heF9jb2xsYXRlZF9ieXRlczogdTMyKCksXG4gICAgfSxcbiAgICBwMzE6IGFycmF5T2Yoc3RyaW5nKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzEuX2RvYyksXG4gICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgcDMzOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMyksXG4gICAgcDM0OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNCksXG4gICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgcDM2OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNiksXG4gICAgcDM3OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNyksXG4gICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICB2YWxpZF91bnRpbDogdTMyKCksXG4gICAgICAgIHNpZ25hdHVyZV9yOiBzdHJpbmcoKSxcbiAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzkuX2RvYyksXG59O1xuXG5jb25zdCBjb25maWcgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWcgfSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9jay5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLmJsb2NrLnN0YXR1cyksXG4gICAgZ2xvYmFsX2lkOiBpMzIoZG9jcy5ibG9jay5nbG9iYWxfaWQpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay53YW50X3NwbGl0KSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrLnNlcV9ubyksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9tZXJnZSksXG4gICAgZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHUzMihkb2NzLmJsb2NrLnByZXZfa2V5X2Jsb2NrX3NlcW5vKSxcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogdTMyKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX3ZlcnNpb24pLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHN0cmluZyhkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIGNyZWF0ZWRfYnk6IHN0cmluZyhkb2NzLmJsb2NrLmNyZWF0ZWRfYnkpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2YoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbHQ6IHU2NCgpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zLFxuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudCksXG4gICAgfSksXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3KSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19kZXB0aCksXG4gICAgICAgIG9sZDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfZGVwdGgpLFxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHVuaXhTZWNvbmRzKGRvY3MuYmxvY2subWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLnNoYXJkKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZSksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coZG9jcy5ibG9jay5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkKSxcbiAgICAgICAgICAgIHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnIpLFxuICAgICAgICAgICAgczogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXG4gICAgICAgIH0pLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgICAgIGNvbmZpZzogY29uZmlnKCksXG4gICAgfSxcbiAgICBrZXlfYmxvY2s6IGJvb2woZG9jcy5ibG9jay5rZXlfYmxvY2spLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYmxvY2suYm9jKSxcbiAgICBzaWduYXR1cmVzOiBqb2luKHsgQmxvY2tTaWduYXR1cmVzIH0sICdpZCcsICdpZCcpLFxufTtcblxuY29uc3QgWmVyb3N0YXRlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuemVyb3N0YXRlLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnemVyb3N0YXRlcycgfSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnplcm9zdGF0ZS53b3JrY2hhaW5faWQpLFxuICAgIGdsb2JhbF9pZDogaTMyKGRvY3MuemVyb3N0YXRlLmdsb2JhbF9pZCksXG4gICAgdG90YWxfYmFsYW5jZTogZ3JhbXMoZG9jcy56ZXJvc3RhdGUudG90YWxfYmFsYW5jZSksXG4gICAgdG90YWxfYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy56ZXJvc3RhdGUudG90YWxfYmFsYW5jZV9vdGhlciksXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLnplcm9zdGF0ZS5tYXN0ZXIudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgICAgIGdsb2JhbF9iYWxhbmNlOiBncmFtcyhkb2NzLnplcm9zdGF0ZS5tYXN0ZXIuZ2xvYmFsX2JhbGFuY2UpLFxuICAgICAgICBnbG9iYWxfYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy56ZXJvc3RhdGUubWFzdGVyLmdsb2JhbF9iYWxhbmNlX290aGVyKSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgICAgICBjb25maWc6IGNvbmZpZygpLFxuICAgIH0sXG4gICAgYWNjb3VudHM6IGFycmF5T2Yoe1xuICAgICAgICAuLi5BY2NvdW50QmFzZSxcbiAgICAgICAgaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIH0sIGRvY3MuemVyb3N0YXRlLmFjY291bnRzKSxcbiAgICBsaWJyYXJpZXM6IGFycmF5T2YoXG4gICAgICAgIHtcbiAgICAgICAgICAgIGhhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnplcm9zdGF0ZS5saWJyYXJpZXMuaGFzaCksXG4gICAgICAgICAgICBwdWJsaXNoZXJzOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLnplcm9zdGF0ZS5saWJyYXJpZXMucHVibGlzaGVycyksXG4gICAgICAgICAgICBsaWI6IHN0cmluZyhkb2NzLnplcm9zdGF0ZS5saWJyYXJpZXMubGliKSxcbiAgICAgICAgfSxcbiAgICAgICAgZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLl9kb2MsXG4gICAgKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgICAgICAgICAgQ29uZmlnLFxuICAgICAgICAgICAgWmVyb3N0YXRlLFxuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=