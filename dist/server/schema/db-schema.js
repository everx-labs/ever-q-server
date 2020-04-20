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
  gen_utime: (0, _dbSchemaTypes.u32)(_dbShema.docs.blockSignatures.gen_utime),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwiZGVxdWV1ZVNob3J0Iiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJsb2NrIiwiYm9keSIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsIlRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJCbG9ja1NpZ25hdHVyZXMiLCJibG9ja1NpZ25hdHVyZXMiLCJnZW5fdXRpbWUiLCJzZXFfbm8iLCJ2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiY2F0Y2hhaW5fc2Vxbm8iLCJzaWdfd2VpZ2h0Iiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXciLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJtaW5fc2hhcmRfZ2VuX3V0aW1lIiwibWF4X3NoYXJkX2dlbl91dGltZSIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsImNvbmZpZ19hZGRyIiwiY29uZmlnIiwicDAiLCJwMSIsInAyIiwicDMiLCJwNCIsInA2IiwibWludF9uZXdfcHJpY2UiLCJtaW50X2FkZF9wcmljZSIsInA3IiwiY3VycmVuY3kiLCJwOCIsImNhcGFiaWxpdGllcyIsInA5IiwicDEwIiwicDExIiwibm9ybWFsX3BhcmFtcyIsImNyaXRpY2FsX3BhcmFtcyIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJzaHVmZmxlX21jX3ZhbGlkYXRvcnMiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5IiwibmV3X2NhdGNoYWluX2lkcyIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUdBOztBQWdCQTs7QUFyQ0E7Ozs7Ozs7Ozs7Ozs7OztBQXVDQSxNQUFNO0FBQUVBLEVBQUFBLE1BQUY7QUFBVUMsRUFBQUEsSUFBVjtBQUFnQkMsRUFBQUEsR0FBaEI7QUFBcUJDLEVBQUFBO0FBQXJCLElBQWlDQyxXQUF2QztBQUdBLE1BQU1DLGFBQWEsR0FBRywyQkFBTyxlQUFQLEVBQXdCO0FBQzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FEa0M7QUFFMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUZrQztBQUcxQ0MsRUFBQUEsTUFBTSxFQUFFLENBSGtDO0FBSTFDQyxFQUFBQSxRQUFRLEVBQUU7QUFKZ0MsQ0FBeEIsQ0FBdEI7QUFPQSxNQUFNQyxtQkFBbUIsR0FBRywyQkFBTyxxQkFBUCxFQUE4QjtBQUN0REMsRUFBQUEsU0FBUyxFQUFFLENBRDJDO0FBRXRESCxFQUFBQSxNQUFNLEVBQUUsQ0FGOEM7QUFHdERJLEVBQUFBLE9BQU8sRUFBRTtBQUg2QyxDQUE5QixDQUE1QjtBQU1BLE1BQU1DLFVBQVUsR0FB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QUFlLEVBQUVuYSxNQUFNLEVBRmQ7QUFHVG9hLFFBQUFBLEtBQUssRUFBRSx5QkFIRTtBQUlUQyxRQUFBQSxXQUFXLEVBQUUseUJBSko7QUFLVEMsUUFBQUEsV0FBVyxFQUFFdGEsTUFBTSxFQUxWO0FBTVR1YSxRQUFBQSxXQUFXLEVBQUV2YSxNQUFNO0FBTlYsT0FBRCxFQU9UcUUsY0FBS3NCLEtBQUwsQ0FBV3NPLE1BQVgsQ0FBa0JhLE1BQWxCLENBQXlCb0YsR0FBekIsQ0FBNkI5VixJQVBwQjtBQWhIUjtBQXZCSixHQTFFVztBQTJObkJ3SCxFQUFBQSxVQUFVLEVBQUUseUJBQUs7QUFBRVAsSUFBQUE7QUFBRixHQUFMLEVBQTBCLElBQTFCLEVBQWdDLElBQWhDO0FBM05PLENBQXZCLEMsQ0E4TkE7O0FBRUEsTUFBTW1QLE1BQWUsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLEtBQUssRUFBRTtBQUNIQyxNQUFBQSxhQUFhLEVBQWJBLDRCQURHO0FBRUgzTyxNQUFBQSxTQUZHO0FBR0hNLE1BQUFBLFdBSEc7QUFJSE0sTUFBQUEsS0FKRztBQUtITyxNQUFBQSxNQUxHO0FBTUg3SCxNQUFBQSxPQU5HO0FBT0hpTSxNQUFBQSxLQVBHO0FBUUhwTixNQUFBQSxPQVJHO0FBU0gwQyxNQUFBQSxXQVRHO0FBVUh3RSxNQUFBQSxlQVZHO0FBV0h1RCxNQUFBQSxlQVhHO0FBWUhTLE1BQUFBLFdBWkc7QUFhSFEsTUFBQUEsZ0JBYkc7QUFjSFEsTUFBQUEsWUFkRztBQWVIVSxNQUFBQTtBQWZHO0FBREg7QUFEWSxDQUF4QjtlQXNCZXlKLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBkZXF1ZXVlU2hvcnQ6IDcsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZShkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBibG9jazogam9pbignQmxvY2snLCAnYmxvY2tfaWQnLCAnaWQnKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMihkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdvdXRfbXNnc1sqXScsICdwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdibG9ja19pZCcsICdpZCcpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2tTaWduYXR1cmVzLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuZ2VuX3V0aW1lKSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrU2lnbmF0dXJlcy5zZXFfbm8pLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLndvcmtjaGFpbl9pZCksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5wcm9vZiksXG4gICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2tTaWduYXR1cmVzLnZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGNhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9ja1NpZ25hdHVyZXMuY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIHNpZ193ZWlnaHQ6IHU2NChkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWdfd2VpZ2h0KSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKCksXG4gICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLnIpLFxuICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9ja1NpZ25hdHVyZXMuc2lnbmF0dXJlcy5zKSxcbiAgICB9LCBkb2NzLmJsb2NrU2lnbmF0dXJlcy5zaWduYXR1cmVzLl9kb2MpLFxuICAgIGJsb2NrOiBqb2luKCdCbG9jaycsICdpZCcsICdpZCcpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEV4dEJsa1JlZiB9LCBkb2MpO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZygpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBJbk1zZyB9LCBkb2MpO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxuICAgIG1zZ19lbnZfaGFzaDogc3RyaW5nKCksXG4gICAgbmV4dF93b3JrY2hhaW46IGkzMigpLFxuICAgIG5leHRfYWRkcl9wZng6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdTMyKGRvY3Muc2hhcmREZXNjci5nZW5fdXRpbWUpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZShkb2NzLnNoYXJkRGVzY3Iuc3BsaXRfdHlwZSksXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWQpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlciksXG59LCBkb2MpO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBnYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBnYXNfY3JlZGl0OiBzdHJpbmcoKSxcbiAgICBibG9ja19nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19wcmljZTogc3RyaW5nKCksXG59O1xuXG5jb25zdCBnYXNMaW1pdHNQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBHYXNMaW1pdHNQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XG4gICAgYnl0ZXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgZ2FzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGx0X2RlbHRhOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxufTtcblxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGx1bXBfcHJpY2U6IHN0cmluZygpLFxuICAgIGJpdF9wcmljZTogc3RyaW5nKCksXG4gICAgY2VsbF9wcmljZTogc3RyaW5nKCksXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXG4gICAgZmlyc3RfZnJhYzogdTE2KCksXG4gICAgbmV4dF9mcmFjOiB1MTYoKSxcbn07XG5cbmNvbnN0IG1zZ0ZvcndhcmRQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBNc2dGb3J3YXJkUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IFZhbGlkYXRvclNldDogVHlwZURlZiA9IHtcbiAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgdXRpbWVfdW50aWw6IHUzMigpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHU2NCgpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiB1NjQoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwOiBUeXBlRGVmID0ge1xuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1heF90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1pbl93aW5zOiB1OCgpLFxuICAgIG1heF9sb3NzZXM6IHU4KCksXG4gICAgbWluX3N0b3JlX3NlYzogdTMyKCksXG4gICAgbWF4X3N0b3JlX3NlYzogdTMyKCksXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcbiAgICBjZWxsX3ByaWNlOiB1MzIoKSxcbn07XG5cbmNvbnN0IGNvbmZpZ1Byb3Bvc2FsU2V0dXAgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWdQcm9wb3NhbFNldHVwIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfdmVyc2lvbiksXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc3RyaW5nKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWQpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyKSxcbiAgICAgICAgbWludGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlciksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coZG9jcy5ibG9jay5pbl9tc2dfZGVzY3IpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZyhkb2NzLmJsb2NrLnJhbmRfc2VlZCksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coZG9jcy5ibG9jay5vdXRfbXNnX2Rlc2NyKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgbHQ6IHU2NCgpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zXG4gICAgICAgICksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KVxuICAgIH0pLFxuICAgIHRyX2NvdW50OiBpMzIoKSwgLy8gVE9ETzogZG9jXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ldyksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgpLFxuICAgICAgICBvbGQ6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGQpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgb2xkX2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2RlcHRoKVxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHUzMihkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogdTMyKGRvY3MuYmxvY2subWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgICAgICAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgICAgICAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgICAgICAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICAgICAgICAgIHAxMDogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMC5fZG9jKSxcbiAgICAgICAgICAgIHAxMToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuX2RvYyxcbiAgICAgICAgICAgICAgICBub3JtYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcyksXG4gICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgICAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgICAgICAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICAgICAgICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgICAgICAgICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgICAgICAgICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICAgICAgICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgICAgICAgICBuZXdfY2F0Y2hhaW5faWRzOiBib29sKCksXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgICAgICAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICAgICAgICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgICAgICAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICAgICAgICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=