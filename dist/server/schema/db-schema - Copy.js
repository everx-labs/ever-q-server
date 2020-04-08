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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFHQTs7QUFnQkE7O0FBckNBOzs7Ozs7Ozs7Ozs7Ozs7QUF1Q0EsTUFBTTtBQUFFQSxFQUFBQSxNQUFGO0FBQVVDLEVBQUFBLElBQVY7QUFBZ0JDLEVBQUFBLEdBQWhCO0FBQXFCQyxFQUFBQTtBQUFyQixJQUFpQ0MsV0FBdkM7QUFHQSxNQUFNQyxhQUFhLEdBQUcsMkJBQU8sZUFBUCxFQUF3QjtBQUMxQ0MsRUFBQUEsTUFBTSxFQUFFLENBRGtDO0FBRTFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FGa0M7QUFHMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUhrQztBQUkxQ0MsRUFBQUEsUUFBUSxFQUFFO0FBSmdDLENBQXhCLENBQXRCO0FBT0EsTUFBTUMsbUJBQW1CLEdBQUcsMkJBQU8scUJBQVAsRUFBOEI7QUFDdERDLEVBQUFBLFNBQVMsRUFBRSxDQUQyQztBQUV0REgsRUFBQUEsTUFBTSxFQUFFLENBRjhDO0FBR3RESSxFQUFBQSxPQUFPLEVBQUU7QUFINkMsQ0FBOUIsQ0FBNUI7QUFNQSxNQUFNQyxVQUFVLEdBQUcsMkJBQU8sWUFBUCxFQUFxQjtBQUNwQ0MsRUFBQUEsT0FBTyxFQUFFLENBRDJCO0FBRXBDQyxFQUFBQSxRQUFRLEVBQUUsQ0FGMEI7QUFHcENDLEVBQUFBLEtBQUssRUFBRTtBQUg2QixDQUFyQixDQUFuQjtBQU9BLE1BQU1DLFdBQVcsR0FBRywyQkFBTyxhQUFQLEVBQXNCO0FBQ3RDWCxFQUFBQSxNQUFNLEVBQUUsQ0FE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QUF5Tm5CaUgsRUFBQUEsVUFBVSxFQUFFLHlCQUFLO0FBQUVELElBQUFBO0FBQUYsR0FBTCxFQUEwQixJQUExQixFQUFnQyxJQUFoQztBQXpOTyxDQUF2QixDLENBNE5BOztBQUVBLE1BQU0yTyxNQUFlLEdBQUc7QUFDcEJDLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxLQUFLLEVBQUU7QUFDSEMsTUFBQUEsYUFBYSxFQUFiQSw0QkFERztBQUVIek8sTUFBQUEsU0FGRztBQUdITyxNQUFBQSxXQUhHO0FBSUhNLE1BQUFBLEtBSkc7QUFLSE8sTUFBQUEsTUFMRztBQU1IdkgsTUFBQUEsT0FORztBQU9IeUwsTUFBQUEsS0FQRztBQVFINU0sTUFBQUEsT0FSRztBQVNIeUMsTUFBQUEsV0FURztBQVVId0UsTUFBQUEsZUFWRztBQVdIZ0QsTUFBQUEsZUFYRztBQVlIUyxNQUFBQSxXQVpHO0FBYUhRLE1BQUFBLGdCQWJHO0FBY0hRLE1BQUFBLFlBZEc7QUFlSFUsTUFBQUE7QUFmRztBQURIO0FBRFksQ0FBeEI7ZUFzQmV3SixNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcblxuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1OCxcbiAgICB1OGVudW0sXG4gICAgd2l0aERvY1xufSBmcm9tIFwiLi9kYi1zY2hlbWEtdHlwZXNcIjtcblxuaW1wb3J0IHsgZG9jcyB9IGZyb20gJy4vZGIuc2hlbWEuZG9jcyc7XG5cbmNvbnN0IHsgc3RyaW5nLCBib29sLCByZWYsIGFycmF5T2YgfSA9IERlZjtcblxuXG5jb25zdCBhY2NvdW50U3RhdHVzID0gdThlbnVtKCdBY2NvdW50U3RhdHVzJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxuICAgIG5vbkV4aXN0OiAzLFxufSk7XG5cbmNvbnN0IGFjY291bnRTdGF0dXNDaGFuZ2UgPSB1OGVudW0oJ0FjY291bnRTdGF0dXNDaGFuZ2UnLCB7XG4gICAgdW5jaGFuZ2VkOiAwLFxuICAgIGZyb3plbjogMSxcbiAgICBkZWxldGVkOiAyLFxufSk7XG5cbmNvbnN0IHNraXBSZWFzb24gPSB1OGVudW0oJ1NraXBSZWFzb24nLCB7XG4gICAgbm9TdGF0ZTogMCxcbiAgICBiYWRTdGF0ZTogMSxcbiAgICBub0dhczogMixcbn0pO1xuXG5cbmNvbnN0IGFjY291bnRUeXBlID0gdThlbnVtKCdBY2NvdW50VHlwZScsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbn0pO1xuXG5jb25zdCBtZXNzYWdlVHlwZSA9IHU4ZW51bSgnTWVzc2FnZVR5cGUnLCB7XG4gICAgaW50ZXJuYWw6IDAsXG4gICAgZXh0SW46IDEsXG4gICAgZXh0T3V0OiAyLFxufSk7XG5cblxuY29uc3QgbWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ01lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcXVldWVkOiAxLFxuICAgIHByb2Nlc3Npbmc6IDIsXG4gICAgcHJlbGltaW5hcnk6IDMsXG4gICAgcHJvcG9zZWQ6IDQsXG4gICAgZmluYWxpemVkOiA1LFxuICAgIHJlZnVzZWQ6IDYsXG4gICAgdHJhbnNpdGluZzogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblR5cGUgPSB1OGVudW0oJ1RyYW5zYWN0aW9uVHlwZScsIHtcbiAgICBvcmRpbmFyeTogMCxcbiAgICBzdG9yYWdlOiAxLFxuICAgIHRpY2s6IDIsXG4gICAgdG9jazogMyxcbiAgICBzcGxpdFByZXBhcmU6IDQsXG4gICAgc3BsaXRJbnN0YWxsOiA1LFxuICAgIG1lcmdlUHJlcGFyZTogNixcbiAgICBtZXJnZUluc3RhbGw6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdUcmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcmVsaW1pbmFyeTogMSxcbiAgICBwcm9wb3NlZDogMixcbiAgICBmaW5hbGl6ZWQ6IDMsXG4gICAgcmVmdXNlZDogNCxcbn0pO1xuXG5jb25zdCBjb21wdXRlVHlwZSA9IHU4ZW51bSgnQ29tcHV0ZVR5cGUnLCB7XG4gICAgc2tpcHBlZDogMCxcbiAgICB2bTogMSxcbn0pO1xuXG5jb25zdCBib3VuY2VUeXBlID0gdThlbnVtKCdCb3VuY2VUeXBlJywge1xuICAgIG5lZ0Z1bmRzOiAwLFxuICAgIG5vRnVuZHM6IDEsXG4gICAgb2s6IDIsXG59KTtcblxuY29uc3QgYmxvY2tQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdCbG9ja1Byb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcm9wb3NlZDogMSxcbiAgICBmaW5hbGl6ZWQ6IDIsXG4gICAgcmVmdXNlZDogMyxcbn0pO1xuXG5cbmNvbnN0IGluTXNnVHlwZSA9IHU4ZW51bSgnSW5Nc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGlocjogMSxcbiAgICBpbW1lZGlhdGVseTogMixcbiAgICBmaW5hbDogMyxcbiAgICB0cmFuc2l0OiA0LFxuICAgIGRpc2NhcmRlZEZpbmFsOiA1LFxuICAgIGRpc2NhcmRlZFRyYW5zaXQ6IDYsXG59KTtcblxuY29uc3Qgb3V0TXNnVHlwZSA9IHU4ZW51bSgnT3V0TXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpbW1lZGlhdGVseTogMSxcbiAgICBvdXRNc2dOZXc6IDIsXG4gICAgdHJhbnNpdDogMyxcbiAgICBkZXF1ZXVlSW1tZWRpYXRlbHk6IDQsXG4gICAgZGVxdWV1ZTogNSxcbiAgICB0cmFuc2l0UmVxdWlyZWQ6IDYsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZShkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMihkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdvdXRfbXNnc1sqXScsICdwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBPdXRNc2cgfSwgZG9jKTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKGRvY3Muc2hhcmREZXNjci5zZXFfbm8pLFxuICAgIHJlZ19tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5yZWdfbWNfc2Vxbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3IuZW5kX2x0KSxcbiAgICByb290X2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3Iucm9vdF9oYXNoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IuZmlsZV9oYXNoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9zcGxpdCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfbWVyZ2UpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLndhbnRfbWVyZ2UpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woZG9jcy5zaGFyZERlc2NyLm54X2NjX3VwZGF0ZWQpLFxuICAgIGZsYWdzOiB1OChkb2NzLnNoYXJkRGVzY3IuZmxhZ3MpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubmV4dF9jYXRjaGFpbl9zZXFubyksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZyhkb2NzLnNoYXJkRGVzY3IubmV4dF92YWxpZGF0b3Jfc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IubWluX3JlZl9tY19zZXFubyksXG4gICAgZ2VuX3V0aW1lOiB1MzIoZG9jcy5zaGFyZERlc2NyLmdlbl91dGltZSksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKGRvY3Muc2hhcmREZXNjci5zcGxpdF90eXBlKSxcbiAgICBzcGxpdDogdTMyKGRvY3Muc2hhcmREZXNjci5zcGxpdCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWQpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkX290aGVyKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEdhc0xpbWl0c1ByaWNlczogVHlwZURlZiA9IHtcbiAgICBnYXNfcHJpY2U6IHN0cmluZygpLFxuICAgIGdhc19saW1pdDogc3RyaW5nKCksXG4gICAgc3BlY2lhbF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGdhc19jcmVkaXQ6IHN0cmluZygpLFxuICAgIGJsb2NrX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZnJlZXplX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZGVsZXRlX2R1ZV9saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IGdhc0xpbWl0c1ByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEdhc0xpbWl0c1ByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBCbG9ja0xpbWl0czogVHlwZURlZiA9IHtcbiAgICBieXRlczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBnYXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgbHRfZGVsdGE6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG59O1xuXG5jb25zdCBibG9ja0xpbWl0cyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEJsb2NrTGltaXRzIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0ZvcndhcmRQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgbHVtcF9wcmljZTogc3RyaW5nKCksXG4gICAgYml0X3ByaWNlOiBzdHJpbmcoKSxcbiAgICBjZWxsX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBpaHJfcHJpY2VfZmFjdG9yOiB1MzIoKSxcbiAgICBmaXJzdF9mcmFjOiB1MTYoKSxcbiAgICBuZXh0X2ZyYWM6IHUxNigpLFxufTtcblxuY29uc3QgbXNnRm9yd2FyZFByaWNlcyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE1zZ0ZvcndhcmRQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgVmFsaWRhdG9yU2V0OiBUeXBlRGVmID0ge1xuICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICB1dGltZV91bnRpbDogdTMyKCksXG4gICAgdG90YWw6IHUxNigpLFxuICAgIHRvdGFsX3dlaWdodDogdTY0KCksXG4gICAgbGlzdDogYXJyYXlPZih7XG4gICAgICAgIHB1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICB3ZWlnaHQ6IHU2NCgpLFxuICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgIH0pLFxufTtcblxuY29uc3QgdmFsaWRhdG9yU2V0ID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgVmFsaWRhdG9yU2V0IH0sIGRvYyk7XG5cbmNvbnN0IENvbmZpZ1Byb3Bvc2FsU2V0dXA6IFR5cGVEZWYgPSB7XG4gICAgbWluX3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWF4X3RvdF9yb3VuZHM6IHU4KCksXG4gICAgbWluX3dpbnM6IHU4KCksXG4gICAgbWF4X2xvc3NlczogdTgoKSxcbiAgICBtaW5fc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBtYXhfc3RvcmVfc2VjOiB1MzIoKSxcbiAgICBiaXRfcHJpY2U6IHUzMigpLFxuICAgIGNlbGxfcHJpY2U6IHUzMigpLFxufTtcblxuY29uc3QgY29uZmlnUHJvcG9zYWxTZXR1cCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IENvbmZpZ1Byb3Bvc2FsU2V0dXAgfSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5ibG9jay5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLmJsb2NrLnN0YXR1cyksXG4gICAgZ2xvYmFsX2lkOiB1MzIoZG9jcy5ibG9jay5nbG9iYWxfaWQpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay53YW50X3NwbGl0KSxcbiAgICBzZXFfbm86IHUzMihkb2NzLmJsb2NrLnNlcV9ubyksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9tZXJnZSksXG4gICAgZ2VuX3V0aW1lOiBpMzIoZG9jcy5ibG9jay5nZW5fdXRpbWUpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3MuYmxvY2suZ2VuX2NhdGNoYWluX3NlcW5vKSxcbiAgICBmbGFnczogdTE2KGRvY3MuYmxvY2suZmxhZ3MpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLm1hc3Rlcl9yZWYpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3JlZiksXG4gICAgcHJldl9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X2FsdF9yZWYpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9yZWYpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfYWx0X3JlZiksXG4gICAgdmVyc2lvbjogdTMyKGRvY3MuYmxvY2sudmVyc2lvbiksXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMihkb2NzLmJsb2NrLmdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0KSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5iZWZvcmVfc3BsaXQpLFxuICAgIGFmdGVyX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfc3BsaXQpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woZG9jcy5ibG9jay53YW50X21lcmdlKSxcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKGRvY3MuYmxvY2sudmVydF9zZXFfbm8pLFxuICAgIHN0YXJ0X2x0OiB1NjQoZG9jcy5ibG9jay5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5ibG9jay5lbmRfbHQpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2sud29ya2NoYWluX2lkKSxcbiAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2suc2hhcmQpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMihkb2NzLmJsb2NrLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5wcmV2X2tleV9ibG9ja19zZXFubyksXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IHUzMihkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV92ZXJzaW9uKSxcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBzdHJpbmcoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGspLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrX290aGVyKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZF9vdGhlciksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWRfb3RoZXIpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZF9vdGhlciksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGtfb3RoZXIpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWQpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5taW50ZWRfb3RoZXIpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkX290aGVyKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZyhkb2NzLmJsb2NrLmluX21zZ19kZXNjcikpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKGRvY3MuYmxvY2sucmFuZF9zZWVkKSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZyhkb2NzLmJsb2NrLm91dF9tc2dfZGVzY3IpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MuYWNjb3VudF9hZGRyKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBsdDogdTY0KCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlczogZ3JhbXMoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cmFuc2FjdGlvbnNcbiAgICAgICAgKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICB0cl9jb3VudDogaTMyKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJfY291bnQpXG4gICAgfSksXG4gICAgdHJfY291bnQ6IGkzMigpLCAvLyBUT0RPOiBkb2NcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3KSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19kZXB0aCksXG4gICAgICAgIG9sZDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfZGVwdGgpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogdTMyKGRvY3MuYmxvY2subWFzdGVyLm1pbl9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiB1MzIoZG9jcy5ibG9jay5tYXN0ZXIubWF4X3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLnNoYXJkKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5kZXNjciksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMud29ya2NoYWluX2lkKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5zaGFyZCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXMpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzX290aGVyKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGUpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZV9vdGhlciksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKGRvY3MuYmxvY2subWFzdGVyLnJlY292ZXJfY3JlYXRlX21zZyksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMubm9kZV9pZCksXG4gICAgICAgICAgICByOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5yKSxcbiAgICAgICAgICAgIHM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnMpLFxuICAgICAgICB9KSxcbiAgICAgICAgY29uZmlnX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAwKSxcbiAgICAgICAgICAgIHAxOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxKSxcbiAgICAgICAgICAgIHAyOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyKSxcbiAgICAgICAgICAgIHAzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzKSxcbiAgICAgICAgICAgIHA0OiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA0KSxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNy5fZG9jKSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA4Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA5Ll9kb2MpLFxuICAgICAgICAgICAgcDEwOiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEwLl9kb2MpLFxuICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5fZG9jLFxuICAgICAgICAgICAgICAgIG5vcm1hbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5ub3JtYWxfcGFyYW1zKSxcbiAgICAgICAgICAgICAgICBjcml0aWNhbF9wYXJhbXM6IGNvbmZpZ1Byb3Bvc2FsU2V0dXAoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMS5jcml0aWNhbF9wYXJhbXMpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxMjogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBib29sKCksXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBmbGFnczogdTE2KCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgYmFzaWM6IGJvb2woKSxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBpMzIoKSxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogdTE2KCksXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IHUzMigpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMi5fZG9jKSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTQuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTUuX2RvYyxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTYuX2RvYyxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTcuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxODogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IHUzMigpLFxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTguX2RvYyksXG4gICAgICAgICAgICBwMjA6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIwKSxcbiAgICAgICAgICAgIHAyMTogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjEpLFxuICAgICAgICAgICAgcDIyOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIyKSxcbiAgICAgICAgICAgIHAyMzogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMyksXG4gICAgICAgICAgICBwMjQ6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNCksXG4gICAgICAgICAgICBwMjU6IG1zZ0ZvcndhcmRQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyNSksXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI4Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOS5fZG9jLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogdTMyKCksXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogdTMyKCksXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogdTMyKCksXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IHUzMigpLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiB1MzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYXJyYXlPZihzdHJpbmcoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMS5fZG9jKSxcbiAgICAgICAgICAgIHAzMjogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzIpLFxuICAgICAgICAgICAgcDMzOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMyksXG4gICAgICAgICAgICBwMzQ6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM0KSxcbiAgICAgICAgICAgIHAzNTogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzUpLFxuICAgICAgICAgICAgcDM2OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNiksXG4gICAgICAgICAgICBwMzc6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM3KSxcbiAgICAgICAgICAgIHAzOTogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNlcW5vOiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogdTMyKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzkuX2RvYyksXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJywgJ2lkJyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICAgICAgR2FzTGltaXRzUHJpY2VzLFxuICAgICAgICAgICAgQmxvY2tMaW1pdHMsXG4gICAgICAgICAgICBNc2dGb3J3YXJkUHJpY2VzLFxuICAgICAgICAgICAgVmFsaWRhdG9yU2V0LFxuICAgICAgICAgICAgQ29uZmlnUHJvcG9zYWxTZXR1cFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19