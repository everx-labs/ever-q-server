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
  block: (0, _dbSchemaTypes.join)('Block', 'block_id', 'id'),
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
  created_at: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.message.created_at),
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
  src_transaction: (0, _dbSchemaTypes.join)('Transaction', 'id', 'out_msgs[*]', 'parent.msg_type !== 1'),
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
  boc: string(_dbShema.docs.transaction.boc)
}; // BLOCK SIGNATURES

const BlockSignatures = {
  _doc: _dbShema.docs.blockSignatures._doc,
  _: {
    collection: 'blocks_signatures'
  },
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.blockSignatures.gen_utime),
  seq_no: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.seq_no),
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
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.shardDescr.gen_utime),
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
  utime_since: (0, _dbSchemaTypes.unixTime)(),
  utime_until: (0, _dbSchemaTypes.unixTime)(),
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
  gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.gen_utime),
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
    min_shard_gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.master.min_shard_gen_utime),
    max_shard_gen_utime: (0, _dbSchemaTypes.unixTime)(_dbShema.docs.block.master.max_shard_gen_utime),
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
        utime_since: (0, _dbSchemaTypes.unixTime)(),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwiZGVxdWV1ZVNob3J0Iiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJsb2NrIiwiYm9keSIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJCbG9ja1NpZ25hdHVyZXMiLCJibG9ja1NpZ25hdHVyZXMiLCJnZW5fdXRpbWUiLCJzZXFfbm8iLCJ2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiY2F0Y2hhaW5fc2Vxbm8iLCJzaWdfd2VpZ2h0Iiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQWlCQTs7QUF0Q0E7Ozs7Ozs7Ozs7Ozs7OztBQXdDQSxNQUFNO0FBQUVBLEVBQUFBLE1BQUY7QUFBVUMsRUFBQUEsSUFBVjtBQUFnQkMsRUFBQUEsR0FBaEI7QUFBcUJDLEVBQUFBO0FBQXJCLElBQWlDQyxXQUF2QztBQUdBLE1BQU1DLGFBQWEsR0FBRywyQkFBTyxlQUFQLEVBQXdCO0FBQzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FEa0M7QUFFMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUZrQztBQUcxQ0MsRUFBQUEsTUFBTSxFQUFFLENBSGtDO0FBSTFDQyxFQUFBQSxRQUFRLEVBQUU7QUFKZ0MsQ0FBeEIsQ0FBdEI7QUFPQSxNQUFNQyxtQkFBbUIsR0FBRywyQkFBTyxxQkFBUCxFQUE4QjtBQUN0REMsRUFBQUEsU0FBUyxFQUFFLENBRDJDO0FBRXRESCxFQUFBQSxNQUFNLEVBQUUsQ0FGOEM7QUFHdERJLEVBQUFBLE9BQU8sRUFBRTtBQUg2QyxDQUE5QixDQUE1QjtBQU1BLE1BQU1DLFVBQVUsR0FB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ZUFBZSxFQUFFbmEsTUFBTSxFQUZkO0FBR1RvYSxRQUFBQSxLQUFLLEVBQUUseUJBSEU7QUFJVEMsUUFBQUEsV0FBVyxFQUFFLHlCQUpKO0FBS1RDLFFBQUFBLFdBQVcsRUFBRXRhLE1BQU0sRUFMVjtBQU1UdWEsUUFBQUEsV0FBVyxFQUFFdmEsTUFBTTtBQU5WLE9BQUQsRUFPVHFFLGNBQUtzQixLQUFMLENBQVdzTyxNQUFYLENBQWtCYSxNQUFsQixDQUF5Qm9GLEdBQXpCLENBQTZCOVYsSUFQcEI7QUFoSFI7QUF2QkosR0ExRVc7QUEyTm5Cd0gsRUFBQUEsVUFBVSxFQUFFLHlCQUFLO0FBQUVQLElBQUFBO0FBQUYsR0FBTCxFQUEwQixJQUExQixFQUFnQyxJQUFoQztBQTNOTyxDQUF2QixDLENBOE5BOztBQUVBLE1BQU1tUCxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxLQUFLLEVBQUU7QUFDSEMsTUFBQUEsYUFBYSxFQUFiQSw0QkFERztBQUVIM08sTUFBQUEsU0FGRztBQUdITSxNQUFBQSxXQUhHO0FBSUhNLE1BQUFBLEtBSkc7QUFLSE8sTUFBQUEsTUFMRztBQU1IN0gsTUFBQUEsT0FORztBQU9IaU0sTUFBQUEsS0FQRztBQVFIcE4sTUFBQUEsT0FSRztBQVNIMEMsTUFBQUEsV0FURztBQVVId0UsTUFBQUEsZUFWRztBQVdIdUQsTUFBQUEsZUFYRztBQVlIUyxNQUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUE7QUFmRztBQURIO0FBRFksQ0FBeEI7ZUFzQmV5SixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1OCxcbiAgICB1OGVudW0sXG4gICAgdW5peFRpbWUsXG4gICAgd2l0aERvY1xufSBmcm9tIFwiLi9kYi1zY2hlbWEtdHlwZXNcIjtcblxuaW1wb3J0IHsgZG9jcyB9IGZyb20gJy4vZGIuc2hlbWEuZG9jcyc7XG5cbmNvbnN0IHsgc3RyaW5nLCBib29sLCByZWYsIGFycmF5T2YgfSA9IERlZjtcblxuXG5jb25zdCBhY2NvdW50U3RhdHVzID0gdThlbnVtKCdBY2NvdW50U3RhdHVzJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxuICAgIG5vbkV4aXN0OiAzLFxufSk7XG5cbmNvbnN0IGFjY291bnRTdGF0dXNDaGFuZ2UgPSB1OGVudW0oJ0FjY291bnRTdGF0dXNDaGFuZ2UnLCB7XG4gICAgdW5jaGFuZ2VkOiAwLFxuICAgIGZyb3plbjogMSxcbiAgICBkZWxldGVkOiAyLFxufSk7XG5cbmNvbnN0IHNraXBSZWFzb24gPSB1OGVudW0oJ1NraXBSZWFzb24nLCB7XG4gICAgbm9TdGF0ZTogMCxcbiAgICBiYWRTdGF0ZTogMSxcbiAgICBub0dhczogMixcbn0pO1xuXG5cbmNvbnN0IGFjY291bnRUeXBlID0gdThlbnVtKCdBY2NvdW50VHlwZScsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbn0pO1xuXG5jb25zdCBtZXNzYWdlVHlwZSA9IHU4ZW51bSgnTWVzc2FnZVR5cGUnLCB7XG4gICAgaW50ZXJuYWw6IDAsXG4gICAgZXh0SW46IDEsXG4gICAgZXh0T3V0OiAyLFxufSk7XG5cblxuY29uc3QgbWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ01lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcXVldWVkOiAxLFxuICAgIHByb2Nlc3Npbmc6IDIsXG4gICAgcHJlbGltaW5hcnk6IDMsXG4gICAgcHJvcG9zZWQ6IDQsXG4gICAgZmluYWxpemVkOiA1LFxuICAgIHJlZnVzZWQ6IDYsXG4gICAgdHJhbnNpdGluZzogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblR5cGUgPSB1OGVudW0oJ1RyYW5zYWN0aW9uVHlwZScsIHtcbiAgICBvcmRpbmFyeTogMCxcbiAgICBzdG9yYWdlOiAxLFxuICAgIHRpY2s6IDIsXG4gICAgdG9jazogMyxcbiAgICBzcGxpdFByZXBhcmU6IDQsXG4gICAgc3BsaXRJbnN0YWxsOiA1LFxuICAgIG1lcmdlUHJlcGFyZTogNixcbiAgICBtZXJnZUluc3RhbGw6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdUcmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcmVsaW1pbmFyeTogMSxcbiAgICBwcm9wb3NlZDogMixcbiAgICBmaW5hbGl6ZWQ6IDMsXG4gICAgcmVmdXNlZDogNCxcbn0pO1xuXG5jb25zdCBjb21wdXRlVHlwZSA9IHU4ZW51bSgnQ29tcHV0ZVR5cGUnLCB7XG4gICAgc2tpcHBlZDogMCxcbiAgICB2bTogMSxcbn0pO1xuXG5jb25zdCBib3VuY2VUeXBlID0gdThlbnVtKCdCb3VuY2VUeXBlJywge1xuICAgIG5lZ0Z1bmRzOiAwLFxuICAgIG5vRnVuZHM6IDEsXG4gICAgb2s6IDIsXG59KTtcblxuY29uc3QgYmxvY2tQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdCbG9ja1Byb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcm9wb3NlZDogMSxcbiAgICBmaW5hbGl6ZWQ6IDIsXG4gICAgcmVmdXNlZDogMyxcbn0pO1xuXG5cbmNvbnN0IGluTXNnVHlwZSA9IHU4ZW51bSgnSW5Nc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGlocjogMSxcbiAgICBpbW1lZGlhdGVseTogMixcbiAgICBmaW5hbDogMyxcbiAgICB0cmFuc2l0OiA0LFxuICAgIGRpc2NhcmRlZEZpbmFsOiA1LFxuICAgIGRpc2NhcmRlZFRyYW5zaXQ6IDYsXG59KTtcblxuY29uc3Qgb3V0TXNnVHlwZSA9IHU4ZW51bSgnT3V0TXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpbW1lZGlhdGVseTogMSxcbiAgICBvdXRNc2dOZXc6IDIsXG4gICAgdHJhbnNpdDogMyxcbiAgICBkZXF1ZXVlSW1tZWRpYXRlbHk6IDQsXG4gICAgZGVxdWV1ZTogNSxcbiAgICB0cmFuc2l0UmVxdWlyZWQ6IDYsXG4gICAgZGVxdWV1ZVNob3J0OiA3LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmFjY291bnQuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmFjY291bnQud29ya2NoYWluX2lkKSxcbiAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFR5cGUoZG9jcy5hY2NvdW50LmFjY190eXBlKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoZG9jcy5hY2NvdW50Lmxhc3RfcGFpZCkpLFxuICAgIGR1ZV9wYXltZW50OiBncmFtcyhkb2NzLmFjY291bnQuZHVlX3BheW1lbnQpLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NChkb2NzLmFjY291bnQubGFzdF90cmFuc19sdCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKGRvY3MuYWNjb3VudC5iYWxhbmNlKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5hY2NvdW50LmJhbGFuY2Vfb3RoZXIpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLmFjY291bnQuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5hY2NvdW50LnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5hY2NvdW50LnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLmFjY291bnQuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MuYWNjb3VudC5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5hY2NvdW50LmxpYnJhcnkpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5hY2NvdW50LnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLmFjY291bnQuYm9jKSxcbn07XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5tZXNzYWdlLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKGRvY3MubWVzc2FnZS5tc2dfdHlwZSkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQobWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMoZG9jcy5tZXNzYWdlLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiByZXF1aXJlZChzdHJpbmcoZG9jcy5tZXNzYWdlLmJsb2NrX2lkKSksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2Jsb2NrX2lkJywgJ2lkJyksXG4gICAgYm9keTogc3RyaW5nKGRvY3MubWVzc2FnZS5ib2R5KSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5tZXNzYWdlLnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MubWVzc2FnZS50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MubWVzc2FnZS50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MubWVzc2FnZS5saWJyYXJ5KSxcbiAgICBzcmM6IHN0cmluZyhkb2NzLm1lc3NhZ2Uuc3JjKSxcbiAgICBkc3Q6IHN0cmluZyhkb2NzLm1lc3NhZ2UuZHN0KSxcbiAgICBzcmNfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLnNyY193b3JrY2hhaW5faWQpLFxuICAgIGRzdF93b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2UuZHN0X3dvcmtjaGFpbl9pZCksXG4gICAgY3JlYXRlZF9sdDogdTY0KGRvY3MubWVzc2FnZS5jcmVhdGVkX2x0KSxcbiAgICBjcmVhdGVkX2F0OiB1bml4VGltZShkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdvdXRfbXNnc1sqXScsICdwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2tTaWduYXR1cmVzLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrU2lnbmF0dXJlcy5nZW5fdXRpbWUpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNlcV9ubyksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMud29ya2NoYWluX2lkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnByb29mKSxcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMudmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5jYXRjaGFpbl9zZXFubyksXG4gICAgc2lnX3dlaWdodDogdTY0KGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ193ZWlnaHQpLFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmcoKSxcbiAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuciksXG4gICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnMpLFxuICAgIH0sIGRvY3MuYmxvY2tTaWduYXR1cmVzLnNpZ25hdHVyZXMuX2RvYyksXG4gICAgYmxvY2s6IGpvaW4oJ0Jsb2NrJywgJ2lkJywgJ2lkJyksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG4gICAgbXNnX2Vudl9oYXNoOiBzdHJpbmcoKSxcbiAgICBuZXh0X3dvcmtjaGFpbjogaTMyKCksXG4gICAgbmV4dF9hZGRyX3BmeDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLnNoYXJkRGVzY3IuZ2VuX3V0aW1lKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxuICAgIHNwbGl0OiB1MzIoZG9jcy5zaGFyZERlc2NyLnNwbGl0KSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIpLFxufSwgZG9jKTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGdhc19wcmljZTogc3RyaW5nKCksXG4gICAgZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZ2FzX2NyZWRpdDogc3RyaW5nKCksXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfcHJpY2U6IHN0cmluZygpLFxufTtcblxuY29uc3QgZ2FzTGltaXRzUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgR2FzTGltaXRzUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrTGltaXRzOiBUeXBlRGVmID0ge1xuICAgIGJ5dGVzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGdhczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBsdF9kZWx0YToge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbn07XG5cbmNvbnN0IGJsb2NrTGltaXRzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQmxvY2tMaW1pdHMgfSwgZG9jKTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlczogVHlwZURlZiA9IHtcbiAgICBsdW1wX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBiaXRfcHJpY2U6IHN0cmluZygpLFxuICAgIGNlbGxfcHJpY2U6IHN0cmluZygpLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHUzMigpLFxuICAgIGZpcnN0X2ZyYWM6IHUxNigpLFxuICAgIG5leHRfZnJhYzogdTE2KCksXG59O1xuXG5jb25zdCBtc2dGb3J3YXJkUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgTXNnRm9yd2FyZFByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBWYWxpZGF0b3JTZXQ6IFR5cGVEZWYgPSB7XG4gICAgdXRpbWVfc2luY2U6IHVuaXhUaW1lKCksXG4gICAgdXRpbWVfdW50aWw6IHVuaXhUaW1lKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogdTY0KCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHU2NCgpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXA6IFR5cGVEZWYgPSB7XG4gICAgbWluX3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWF4X3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWluX3dpbnM6IHU4KCksXG4gICAgbWF4X2xvc3NlczogdTgoKSxcbiAgICBtaW5fc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBtYXhfc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBiaXRfcHJpY2U6IHUzMigpLFxuICAgIGNlbGxfcHJpY2U6IHUzMigpLFxufTtcblxuY29uc3QgY29uZmlnUHJvcG9zYWxTZXR1cCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZ1Byb3Bvc2FsU2V0dXAgfSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9jay5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLmJsb2NrLnN0YXR1cyksXG4gICAgZ2xvYmFsX2lkOiB1MzIoZG9jcy5ibG9jay5nbG9iYWxfaWQpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay53YW50X3NwbGl0KSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrLnNlcV9ubyksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9tZXJnZSksXG4gICAgZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHUzMihkb2NzLmJsb2NrLnByZXZfa2V5X2Jsb2NrX3NlcW5vKSxcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogdTMyKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX3ZlcnNpb24pLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHN0cmluZyhkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1bml4VGltZShkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogdW5peFRpbWUoZG9jcy5ibG9jay5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjciksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlciksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCksXG4gICAgICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnMpLFxuICAgICAgICB9KSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAwKSxcbiAgICAgICAgICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcbiAgICAgICAgICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICAgICAgICAgIHAzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzKSxcbiAgICAgICAgICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA4Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxuICAgICAgICAgICAgcDEwOiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEwLl9kb2MpLFxuICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5fZG9jLFxuICAgICAgICAgICAgICAgIG5vcm1hbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zKSxcbiAgICAgICAgICAgICAgICBjcml0aWNhbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxODogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IHVuaXhUaW1lKCksXG4gICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19iaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxOC5fZG9jKSxcbiAgICAgICAgICAgIHAyMDogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjApLFxuICAgICAgICAgICAgcDIxOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMSksXG4gICAgICAgICAgICBwMjI6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjIpLFxuICAgICAgICAgICAgcDIzOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIzKSxcbiAgICAgICAgICAgIHAyNDogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI0KSxcbiAgICAgICAgICAgIHAyNTogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI1KSxcbiAgICAgICAgICAgIHAyODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjguX2RvYyxcbiAgICAgICAgICAgICAgICBzaHVmZmxlX21jX3ZhbGlkYXRvcnM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI5Ll9kb2MsXG4gICAgICAgICAgICAgICAgbmV3X2NhdGNoYWluX2lkczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICAgICAgICAgIHAzMjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzIpLFxuICAgICAgICAgICAgcDMzOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMyksXG4gICAgICAgICAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICAgICAgICAgIHAzNTogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzUpLFxuICAgICAgICAgICAgcDM2OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNiksXG4gICAgICAgICAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICAgICAgICAgIHAzOTogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNlcW5vOiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogdTMyKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzkuX2RvYyksXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJywgJ2lkJyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0LFxuICAgICAgICAgICAgQ29uZmlnUHJvcG9zYWxTZXR1cFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19