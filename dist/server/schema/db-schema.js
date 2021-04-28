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
  dst_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'in_msg', 'parent.msg_type !== 2'),
  src_account: (0, _dbSchemaTypes.join)('Account', 'src', 'id', 'parent.msg_type !== 1'),
  dst_account: (0, _dbSchemaTypes.join)('Account', 'dst', 'id', 'parent.msg_type !== 2')
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
  account: (0, _dbSchemaTypes.join)('Account', 'account_addr', 'id'),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLXNjaGVtYS5qcyJdLCJuYW1lcyI6WyJzdHJpbmciLCJib29sIiwicmVmIiwiYXJyYXlPZiIsIkRlZiIsImFjY291bnRTdGF0dXMiLCJ1bmluaXQiLCJhY3RpdmUiLCJmcm96ZW4iLCJub25FeGlzdCIsImFjY291bnRTdGF0dXNDaGFuZ2UiLCJ1bmNoYW5nZWQiLCJkZWxldGVkIiwic2tpcFJlYXNvbiIsIm5vU3RhdGUiLCJiYWRTdGF0ZSIsIm5vR2FzIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwiZmluYWwiLCJ0cmFuc2l0IiwiZGlzY2FyZGVkRmluYWwiLCJkaXNjYXJkZWRUcmFuc2l0Iiwib3V0TXNnVHlwZSIsIm91dE1zZ05ldyIsImRlcXVldWVJbW1lZGlhdGVseSIsImRlcXVldWUiLCJ0cmFuc2l0UmVxdWlyZWQiLCJkZXF1ZXVlU2hvcnQiLCJub25lIiwic3BsaXRUeXBlIiwic3BsaXQiLCJtZXJnZSIsIkFjY291bnRCYXNlIiwid29ya2NoYWluX2lkIiwiZG9jcyIsImFjY291bnQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImJpdHMiLCJjZWxscyIsInB1YmxpY19jZWxscyIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiY29kZV9oYXNoIiwiZGF0YSIsImRhdGFfaGFzaCIsImxpYnJhcnkiLCJsaWJyYXJ5X2hhc2giLCJwcm9vZiIsImJvYyIsInN0YXRlX2hhc2giLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiTWVzc2FnZSIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYmxvY2siLCJib2R5IiwiYm9keV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwic3JjX2FjY291bnQiLCJkc3RfYWNjb3VudCIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJiYWxhbmNlX2RlbHRhIiwiYmFsYW5jZV9kZWx0YV9vdGhlciIsIkJsb2NrU2lnbmF0dXJlcyIsImJsb2NrU2lnbmF0dXJlcyIsImdlbl91dGltZSIsInNlcV9ubyIsInNoYXJkIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJkb2MiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0IiwibXNnX2Vudl9oYXNoIiwibmV4dF93b3JrY2hhaW4iLCJuZXh0X2FkZHJfcGZ4Iiwib3V0TXNnIiwic2hhcmREZXNjciIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkdhc0xpbWl0c1ByaWNlcyIsImdhc19wcmljZSIsInNwZWNpYWxfZ2FzX2xpbWl0IiwiYmxvY2tfZ2FzX2xpbWl0IiwiZnJlZXplX2R1ZV9saW1pdCIsImRlbGV0ZV9kdWVfbGltaXQiLCJmbGF0X2dhc19saW1pdCIsImZsYXRfZ2FzX3ByaWNlIiwiZ2FzTGltaXRzUHJpY2VzIiwiQmxvY2tMaW1pdHMiLCJieXRlcyIsInVuZGVybG9hZCIsInNvZnRfbGltaXQiLCJoYXJkX2xpbWl0IiwiZ2FzIiwibHRfZGVsdGEiLCJibG9ja0xpbWl0cyIsIk1zZ0ZvcndhcmRQcmljZXMiLCJsdW1wX3ByaWNlIiwiYml0X3ByaWNlIiwiY2VsbF9wcmljZSIsImlocl9wcmljZV9mYWN0b3IiLCJmaXJzdF9mcmFjIiwibmV4dF9mcmFjIiwibXNnRm9yd2FyZFByaWNlcyIsIlZhbGlkYXRvclNldCIsInV0aW1lX3NpbmNlIiwidXRpbWVfdW50aWwiLCJ0b3RhbCIsInRvdGFsX3dlaWdodCIsImxpc3QiLCJwdWJsaWNfa2V5Iiwid2VpZ2h0IiwiYWRubF9hZGRyIiwidmFsaWRhdG9yU2V0IiwiQ29uZmlnUHJvcG9zYWxTZXR1cCIsIm1pbl90b3Rfcm91bmRzIiwibWF4X3RvdF9yb3VuZHMiLCJtaW5fd2lucyIsIm1heF9sb3NzZXMiLCJtaW5fc3RvcmVfc2VjIiwibWF4X3N0b3JlX3NlYyIsImNvbmZpZ1Byb3Bvc2FsU2V0dXAiLCJDb25maWciLCJwMCIsIm1hc3RlciIsImNvbmZpZyIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwidmVyc2lvbiIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJjcmVhdGVkX2J5Iiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwia2V5X2Jsb2NrIiwiWmVyb3N0YXRlIiwiemVyb3N0YXRlIiwidG90YWxfYmFsYW5jZSIsInRvdGFsX2JhbGFuY2Vfb3RoZXIiLCJnbG9iYWxfYmFsYW5jZSIsImdsb2JhbF9iYWxhbmNlX290aGVyIiwiYWNjb3VudHMiLCJpZCIsImxpYnJhcmllcyIsImhhc2giLCJwdWJsaXNoZXJzIiwibGliIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQW1CQTs7QUF4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBNEJBLE1BQU07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RFY7QUFFSUMsSUFBQUEsVUFBVSxFQUFFOWIsT0FBTyxDQUFDSCxNQUFNLEVBQVAsRUFBV29FLGNBQUtvWCxTQUFMLENBQWVPLFNBQWYsQ0FBeUJFLFVBQXBDLENBRnZCO0FBR0lDLElBQUFBLEdBQUcsRUFBRWxjLE1BQU0sQ0FBQ29FLGNBQUtvWCxTQUFMLENBQWVPLFNBQWYsQ0FBeUJHLEdBQTFCO0FBSGYsR0FEYyxFQU1kOVgsY0FBS29YLFNBQUwsQ0FBZU8sU0FBZixDQUF5QnJXLElBTlgsQ0FsQks7QUEwQnZCSCxFQUFBQSxHQUFHLEVBQUV2RixNQUFNLENBQUNvRSxjQUFLb1gsU0FBTCxDQUFlalcsR0FBaEI7QUExQlksQ0FBM0IsQyxDQTZCQTs7QUFFQSxNQUFNNFcsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSHpQLE1BQUFBLFNBRkc7QUFHSE0sTUFBQUEsV0FIRztBQUlITSxNQUFBQSxLQUpHO0FBS0hPLE1BQUFBLE1BTEc7QUFNSG5JLE1BQUFBLE9BTkc7QUFPSG9TLE1BQUFBLEtBUEc7QUFRSHhTLE1BQUFBLE9BUkc7QUFTSDhCLE1BQUFBLFdBVEc7QUFVSDBFLE1BQUFBLGVBVkc7QUFXSHdELE1BQUFBLGVBWEc7QUFZSFMsTUFBQUEsV0FaRztBQWFIUSxNQUFBQSxnQkFiRztBQWNIUSxNQUFBQSxZQWRHO0FBZUhVLE1BQUFBLG1CQWZHO0FBZ0JIUSxNQUFBQSxNQWhCRztBQWlCSG1KLE1BQUFBO0FBakJHO0FBREg7QUFEWSxDQUF4QjtlQXdCZVksTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICcuL3NjaGVtYS5qcyc7XG5cbmltcG9ydCB0eXBlIHsgVHlwZURlZiB9IGZyb20gJy4vc2NoZW1hLmpzJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1MTI4LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB1bml4U2Vjb25kcyxcbiAgICB3aXRoRG9jLFxuICAgIHN0cmluZ1dpdGhMb3dlckZpbHRlcixcbn0gZnJvbSAnLi9kYi1zY2hlbWEtdHlwZXMnO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBkZXF1ZXVlU2hvcnQ6IDcsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50QmFzZTogVHlwZURlZiA9IHtcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmFjY291bnQud29ya2NoYWluX2lkKSxcbiAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFN0YXR1cyhkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgYml0czogdTY0KGRvY3MuYWNjb3VudC5iaXRzKSxcbiAgICBjZWxsczogdTY0KGRvY3MuYWNjb3VudC5jZWxscyksXG4gICAgcHVibGljX2NlbGxzOiB1NjQoZG9jcy5hY2NvdW50LnB1YmxpY19jZWxscyksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBjb2RlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmFjY291bnQuY29kZV9oYXNoKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGRhdGFfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYWNjb3VudC5kYXRhX2hhc2gpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgbGlicmFyeV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5hY2NvdW50LmxpYnJhcnlfaGFzaCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxuICAgIHN0YXRlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmFjY291bnQuc3RhdGVfaGFzaCksXG59O1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIC4uLkFjY291bnRCYXNlLFxuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIGJvZHlfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5ib2R5X2hhc2gpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgY29kZV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5tZXNzYWdlLmNvZGVfaGFzaCksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBkYXRhX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLm1lc3NhZ2UuZGF0YV9oYXNoKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIGxpYnJhcnlfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5saWJyYXJ5X2hhc2gpLFxuICAgIHNyYzogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHVuaXhTZWNvbmRzKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ291dF9tc2dzWypdJywgJ3BhcmVudC5jcmVhdGVkX2x0ICE9PSBcXCcwMFxcJyAmJiBwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbiAgICBzcmNfYWNjb3VudDogam9pbignQWNjb3VudCcsICdzcmMnLCAnaWQnLCAncGFyZW50Lm1zZ190eXBlICE9PSAxJyksXG4gICAgZHN0X2FjY291bnQ6IGpvaW4oJ0FjY291bnQnLCAnZHN0JywgJ2lkJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMicpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIGFjY291bnQ6IGpvaW4oJ0FjY291bnQnLCAnYWNjb3VudF9hZGRyJywgJ2lkJyksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi53b3JrY2hhaW5faWQpLFxuICAgIGx0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5sdCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2hhc2gpLFxuICAgIHByZXZfdHJhbnNfbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfbHQpLFxuICAgIG5vdzogdW5peFNlY29uZHMoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbiAgICBiYWxhbmNlX2RlbHRhOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJhbGFuY2VfZGVsdGEpLFxuICAgIGJhbGFuY2VfZGVsdGFfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24uYmFsYW5jZV9kZWx0YSksXG59O1xuXG4vLyBCTE9DSyBTSUdOQVRVUkVTXG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlczogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrU2lnbmF0dXJlcy5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2Nrc19zaWduYXR1cmVzJyB9LFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9ja1NpZ25hdHVyZXMuZ2VuX3V0aW1lKSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zZXFfbm8pLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2hhcmQpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLndvcmtjaGFpbl9pZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5wcm9vZiksXG4gICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGNhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIHNpZ193ZWlnaHQ6IHU2NChkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWdfd2VpZ2h0KSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG4gICAgICAgIHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnIpLFxuICAgICAgICBzOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zKSxcbiAgICB9LCBkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLl9kb2MpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdpZCcsICdpZCcpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKCksXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBFeHRCbGtSZWYgfSwgZG9jKTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBpaHJfZmVlOiBncmFtcygpLFxuICAgIHByb29mX2NyZWF0ZWQ6IHN0cmluZygpLFxuICAgIGluX21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICBmd2RfZmVlOiBncmFtcygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgdHJhbnNpdF9mZWU6IGdyYW1zKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc3RyaW5nKCksXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG4gICAgbXNnX2Vudl9oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICBuZXh0X3dvcmtjaGFpbjogaTMyKCksXG4gICAgbmV4dF9hZGRyX3BmeDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLnNoYXJkRGVzY3IuZ2VuX3V0aW1lKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxuICAgIHNwbGl0OiB1MzIoZG9jcy5zaGFyZERlc2NyLnNwbGl0KSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIpLFxufSwgZG9jKTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGdhc19wcmljZTogdTY0KCksXG4gICAgZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogdTY0KCksXG4gICAgZ2FzX2NyZWRpdDogdTY0KCksXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiB1NjQoKSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiB1NjQoKSxcbiAgICBmbGF0X2dhc19saW1pdDogdTY0KCksXG4gICAgZmxhdF9nYXNfcHJpY2U6IHU2NCgpLFxufTtcblxuY29uc3QgZ2FzTGltaXRzUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgR2FzTGltaXRzUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrTGltaXRzOiBUeXBlRGVmID0ge1xuICAgIGJ5dGVzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGdhczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBsdF9kZWx0YToge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbn07XG5cbmNvbnN0IGJsb2NrTGltaXRzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQmxvY2tMaW1pdHMgfSwgZG9jKTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlczogVHlwZURlZiA9IHtcbiAgICBsdW1wX3ByaWNlOiB1NjQoKSxcbiAgICBiaXRfcHJpY2U6IHU2NCgpLFxuICAgIGNlbGxfcHJpY2U6IHU2NCgpLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHUzMigpLFxuICAgIGZpcnN0X2ZyYWM6IHUxNigpLFxuICAgIG5leHRfZnJhYzogdTE2KCksXG59O1xuXG5jb25zdCBtc2dGb3J3YXJkUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgTXNnRm9yd2FyZFByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBWYWxpZGF0b3JTZXQ6IFR5cGVEZWYgPSB7XG4gICAgdXRpbWVfc2luY2U6IHVuaXhTZWNvbmRzKCksXG4gICAgdXRpbWVfdW50aWw6IHVuaXhTZWNvbmRzKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogdTY0KCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgICAgICB3ZWlnaHQ6IHU2NCgpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXA6IFR5cGVEZWYgPSB7XG4gICAgbWluX3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWF4X3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWluX3dpbnM6IHU4KCksXG4gICAgbWF4X2xvc3NlczogdTgoKSxcbiAgICBtaW5fc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBtYXhfc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBiaXRfcHJpY2U6IHUzMigpLFxuICAgIGNlbGxfcHJpY2U6IHUzMigpLFxufTtcblxuY29uc3QgY29uZmlnUHJvcG9zYWxTZXR1cCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZ1Byb3Bvc2FsU2V0dXAgfSwgZG9jKTtcblxuY29uc3QgQ29uZmlnOiBUeXBlRGVmID0ge1xuICAgIHAwOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAwKSxcbiAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgcDI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIpLFxuICAgIHAzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzKSxcbiAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgcDY6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA2Ll9kb2MsXG4gICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgbWludF9hZGRfcHJpY2U6IHN0cmluZygpLFxuICAgIH0sXG4gICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICBjdXJyZW5jeTogdTMyKCksXG4gICAgICAgIHZhbHVlOiBzdHJpbmcoKSxcbiAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgcDg6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA4Ll9kb2MsXG4gICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICBjYXBhYmlsaXRpZXM6IHU2NCgpLFxuICAgIH0sXG4gICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICBwMTA6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTAuX2RvYyksXG4gICAgcDExOiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuX2RvYyxcbiAgICAgICAgbm9ybWFsX3BhcmFtczogY29uZmlnUHJvcG9zYWxTZXR1cChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMpLFxuICAgICAgICBjcml0aWNhbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMpLFxuICAgIH0sXG4gICAgcDEyOiBhcnJheU9mKHtcbiAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IHU4KCksXG4gICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICBhY3RpdmU6IGJvb2woKSxcbiAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICBiYXNpYzogYm9vbCgpLFxuICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgIG1pbl9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogdTMyKCksXG4gICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICBwMTQ6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNC5fZG9jLFxuICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGdyYW1zKCksXG4gICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGdyYW1zKCksXG4gICAgfSxcbiAgICBwMTU6IHtcbiAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNS5fZG9jLFxuICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcbiAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxuICAgIH0sXG4gICAgcDE2OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcbiAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgIH0sXG4gICAgcDE3OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcbiAgICAgICAgbWluX3N0YWtlOiB1MTI4KCksXG4gICAgICAgIG1heF9zdGFrZTogdTEyOCgpLFxuICAgICAgICBtaW5fdG90YWxfc3Rha2U6IHUxMjgoKSxcbiAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKCksXG4gICAgfSxcbiAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICB1dGltZV9zaW5jZTogdW5peFNlY29uZHMoKSxcbiAgICAgICAgYml0X3ByaWNlX3BzOiB1NjQoKSxcbiAgICAgICAgY2VsbF9wcmljZV9wczogdTY0KCksXG4gICAgICAgIG1jX2JpdF9wcmljZV9wczogdTY0KCksXG4gICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IHU2NCgpLFxuICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTguX2RvYyksXG4gICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgcDIxOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMSksXG4gICAgcDIyOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIyKSxcbiAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgIHAyNDogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI0KSxcbiAgICBwMjU6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNSksXG4gICAgcDI4OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjguX2RvYyxcbiAgICAgICAgc2h1ZmZsZV9tY192YWxpZGF0b3JzOiBib29sKCksXG4gICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgIH0sXG4gICAgcDI5OiB7XG4gICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgbmV3X2NhdGNoYWluX2lkczogYm9vbCgpLFxuICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiB1MzIoKSxcbiAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogdTMyKCksXG4gICAgICAgIGZhc3RfYXR0ZW1wdHM6IHUzMigpLFxuICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHUzMigpLFxuICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IHUzMigpLFxuICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpLFxuICAgIH0sXG4gICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgIHAzMjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzIpLFxuICAgIHAzMzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzMpLFxuICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgIHAzNTogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzUpLFxuICAgIHAzNjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzYpLFxuICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgIHAzOTogYXJyYXlPZih7XG4gICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgIHNlcW5vOiB1MzIoKSxcbiAgICAgICAgdmFsaWRfdW50aWw6IHUzMigpLFxuICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgIHNpZ25hdHVyZV9zOiBzdHJpbmcoKSxcbiAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM5Ll9kb2MpLFxufTtcblxuY29uc3QgY29uZmlnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQ29uZmlnIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogaTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5nZW5fdXRpbWUpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2suZ2VuX2NhdGNoYWluX3NlcW5vKSxcbiAgICBmbGFnczogdTE2KGRvY3MuYmxvY2suZmxhZ3MpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLm1hc3Rlcl9yZWYpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3JlZiksXG4gICAgcHJldl9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X2FsdF9yZWYpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9yZWYpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfYWx0X3JlZiksXG4gICAgdmVyc2lvbjogdTMyKGRvY3MuYmxvY2sudmVyc2lvbiksXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLmJsb2NrLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5iZWZvcmVfc3BsaXQpLFxuICAgIGFmdGVyX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay53YW50X21lcmdlKSxcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKGRvY3MuYmxvY2sudmVydF9zZXFfbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5ibG9jay5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5ibG9jay5lbmRfbHQpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2sud29ya2NoYWluX2lkKSxcbiAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2suc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLmJsb2NrLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5wcmV2X2tleV9ibG9ja19zZXFubyksXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHUzMihkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV92ZXJzaW9uKSxcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzdHJpbmcoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBjcmVhdGVkX2J5OiBzdHJpbmcoZG9jcy5ibG9jay5jcmVhdGVkX2J5KSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICB0cl9jb3VudDogaTMyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJfY291bnQpLFxuICAgIH0pLFxuICAgIHRyX2NvdW50OiBpMzIoKSwgLy8gVE9ETzogZG9jXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ldyksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgpLFxuICAgICAgICBvbGQ6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGQpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgb2xkX2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2RlcHRoKSxcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1bml4U2Vjb25kcyhkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogdW5peFNlY29uZHMoZG9jcy5ibG9jay5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjciksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlciksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nV2l0aExvd2VyRmlsdGVyKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCksXG4gICAgICAgICAgICByOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgICAgIHM6IHN0cmluZ1dpdGhMb3dlckZpbHRlcihkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnMpLFxuICAgICAgICB9KSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZ1dpdGhMb3dlckZpbHRlcigpLFxuICAgICAgICBjb25maWc6IGNvbmZpZygpLFxuICAgIH0sXG4gICAga2V5X2Jsb2NrOiBib29sKGRvY3MuYmxvY2sua2V5X2Jsb2NrKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmJsb2NrLmJvYyksXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcbn07XG5cbmNvbnN0IFplcm9zdGF0ZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnplcm9zdGF0ZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3plcm9zdGF0ZXMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy56ZXJvc3RhdGUud29ya2NoYWluX2lkKSxcbiAgICBnbG9iYWxfaWQ6IGkzMihkb2NzLnplcm9zdGF0ZS5nbG9iYWxfaWQpLFxuICAgIHRvdGFsX2JhbGFuY2U6IGdyYW1zKGRvY3MuemVyb3N0YXRlLnRvdGFsX2JhbGFuY2UpLFxuICAgIHRvdGFsX2JhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuemVyb3N0YXRlLnRvdGFsX2JhbGFuY2Vfb3RoZXIpLFxuICAgIG1hc3Rlcjoge1xuICAgICAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy56ZXJvc3RhdGUubWFzdGVyLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgICAgICBnbG9iYWxfYmFsYW5jZTogZ3JhbXMoZG9jcy56ZXJvc3RhdGUubWFzdGVyLmdsb2JhbF9iYWxhbmNlKSxcbiAgICAgICAgZ2xvYmFsX2JhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuemVyb3N0YXRlLm1hc3Rlci5nbG9iYWxfYmFsYW5jZV9vdGhlciksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICAgICAgY29uZmlnOiBjb25maWcoKSxcbiAgICB9LFxuICAgIGFjY291bnRzOiBhcnJheU9mKHtcbiAgICAgICAgLi4uQWNjb3VudEJhc2UsXG4gICAgICAgIGlkOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoKSxcbiAgICB9LCBkb2NzLnplcm9zdGF0ZS5hY2NvdW50cyksXG4gICAgbGlicmFyaWVzOiBhcnJheU9mKFxuICAgICAgICB7XG4gICAgICAgICAgICBoYXNoOiBzdHJpbmdXaXRoTG93ZXJGaWx0ZXIoZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLmhhc2gpLFxuICAgICAgICAgICAgcHVibGlzaGVyczogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLnB1Ymxpc2hlcnMpLFxuICAgICAgICAgICAgbGliOiBzdHJpbmcoZG9jcy56ZXJvc3RhdGUubGlicmFyaWVzLmxpYiksXG4gICAgICAgIH0sXG4gICAgICAgIGRvY3MuemVyb3N0YXRlLmxpYnJhcmllcy5fZG9jLFxuICAgICksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy56ZXJvc3RhdGUuYm9jKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwLFxuICAgICAgICAgICAgQ29uZmlnLFxuICAgICAgICAgICAgWmVyb3N0YXRlLFxuICAgICAgICB9LFxuICAgIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=