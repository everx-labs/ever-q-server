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
  import_block_lt: (0, _dbSchemaTypes.u64)(),
  msg_env_hash: string(),
  next_workchain: (0, _dbSchemaTypes.i32)(),
  next_addr_pfx: (0, _dbSchemaTypes.u64)(),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwiZGVxdWV1ZVNob3J0Iiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsInNodWZmbGVfbWNfdmFsaWRhdG9ycyIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJuZXdfY2F0Y2hhaW5faWRzIiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBR0E7O0FBZ0JBOztBQXJDQTs7Ozs7Ozs7Ozs7Ozs7O0FBdUNBLE1BQU07QUFBRUEsRUFBQUEsTUFBRjtBQUFVQyxFQUFBQSxJQUFWO0FBQWdCQyxFQUFBQSxHQUFoQjtBQUFxQkMsRUFBQUE7QUFBckIsSUFBaUNDLFdBQXZDO0FBR0EsTUFBTUMsYUFBYSxHQUFHLDJCQUFPLGVBQVAsRUFBd0I7QUFDMUNDLEVBQUFBLE1BQU0sRUFBRSxDQURrQztBQUUxQ0MsRUFBQUEsTUFBTSxFQUFFLENBRmtDO0FBRzFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FIa0M7QUFJMUNDLEVBQUFBLFFBQVEsRUFBRTtBQUpnQyxDQUF4QixDQUF0QjtBQU9BLE1BQU1DLG1CQUFtQixHQUFHLDJCQUFPLHFCQUFQLEVBQThCO0FBQ3REQyxFQUFBQSxTQUFTLEVBQUUsQ0FEMkM7QUFFdERILEVBQUFBLE1BQU0sRUFBRSxDQUY4QztBQUd0REksRUFBQUEsT0FBTyxFQUFFO0FBSDZDLENBQTlCLENBQTVCO0FBTUEsTUFBTUMsVUFBVSxHQUFHLDJCQUFPLFlBQVAsRUFBcUI7QUFDcENDLEVBQUFBLE9BQU8sRUFBRSxDQUQyQjtBQUVwQ0MsRUFBQUEsUUFBUSxFQUFFLENBRjBC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QixDQS9HYjtBQWdISkMsTUFBQUEsR0FBRyxFQUFFM1osT0FBTyxDQUFDO0FBQ1RxUSxRQUFBQSxTQUFTLEVBQUV4USxNQUFNLEVBRFI7QUFFVCtaLFFBQUFBLGVBQWUsRUFBRS9aLE1BQU0sRUFGZDtBQUdUZ2EsUUFBQUEsS0FBSyxFQUFFLHlCQUhFO0FBSVRDLFFBQUFBLFdBQVcsRUFBRSx5QkFKSjtBQUtUQyxRQUFBQSxXQUFXLEVBQUVsYSxNQUFNLEVBTFY7QUFNVG1hLFFBQUFBLFdBQVcsRUFBRW5hLE1BQU07QUFOVixPQUFELEVBT1RxRSxjQUFLOE0sS0FBTCxDQUFXMEMsTUFBWCxDQUFrQmEsTUFBbEIsQ0FBeUJvRixHQUF6QixDQUE2QjFWLElBUHBCO0FBaEhSO0FBdkJKLEdBMUVXO0FBMk5uQmlILEVBQUFBLFVBQVUsRUFBRSx5QkFBSztBQUFFRCxJQUFBQTtBQUFGLEdBQUwsRUFBMEIsSUFBMUIsRUFBZ0MsSUFBaEM7QUEzTk8sQ0FBdkIsQyxDQThOQTs7QUFFQSxNQUFNZ1AsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSDlPLE1BQUFBLFNBRkc7QUFHSE8sTUFBQUEsV0FIRztBQUlITSxNQUFBQSxLQUpHO0FBS0hPLE1BQUFBLE1BTEc7QUFNSHZILE1BQUFBLE9BTkc7QUFPSDRMLE1BQUFBLEtBUEc7QUFRSC9NLE1BQUFBLE9BUkc7QUFTSHlDLE1BQUFBLFdBVEc7QUFVSHdFLE1BQUFBLGVBVkc7QUFXSG1ELE1BQUFBLGVBWEc7QUFZSFMsTUFBQUEsV0FaRztBQWFIUSxNQUFBQSxnQkFiRztBQWNIUSxNQUFBQSxZQWRHO0FBZUhVLE1BQUFBO0FBZkc7QUFESDtBQURZLENBQXhCO2VBc0JlMEosTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYSc7XG5cbmltcG9ydCB0eXBlIHsgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYSc7XG5pbXBvcnQge1xuICAgIGdyYW1zLFxuICAgIGkzMixcbiAgICBpOCxcbiAgICBqb2luLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgcmVxdWlyZWQsXG4gICAgdTE2LFxuICAgIHUzMixcbiAgICB1NjQsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHdpdGhEb2Ncbn0gZnJvbSBcIi4vZGItc2NoZW1hLXR5cGVzXCI7XG5cbmltcG9ydCB7IGRvY3MgfSBmcm9tICcuL2RiLnNoZW1hLmRvY3MnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIGRlcXVldWVTaG9ydDogNyxcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy5hY2NvdW50Ll9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5hY2NvdW50LndvcmtjaGFpbl9pZCksXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKGRvY3MuYWNjb3VudC5hY2NfdHlwZSkpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKGRvY3MuYWNjb3VudC5sYXN0X3BhaWQpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoZG9jcy5hY2NvdW50LmR1ZV9wYXltZW50KSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoZG9jcy5hY2NvdW50Lmxhc3RfdHJhbnNfbHQpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcyhkb2NzLmFjY291bnQuYmFsYW5jZSkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYWNjb3VudC5iYWxhbmNlX290aGVyKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoZG9jcy5hY2NvdW50LnNwbGl0X2RlcHRoKSxcbiAgICB0aWNrOiBib29sKGRvY3MuYWNjb3VudC50aWNrKSxcbiAgICB0b2NrOiBib29sKGRvY3MuYWNjb3VudC50b2NrKSxcbiAgICBjb2RlOiBzdHJpbmcoZG9jcy5hY2NvdW50LmNvZGUpLFxuICAgIGRhdGE6IHN0cmluZyhkb2NzLmFjY291bnQuZGF0YSksXG4gICAgbGlicmFyeTogc3RyaW5nKGRvY3MuYWNjb3VudC5saWJyYXJ5KSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MuYWNjb3VudC5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5hY2NvdW50LmJvYyksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MubWVzc2FnZS5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZShkb2NzLm1lc3NhZ2UubXNnX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKGRvY3MubWVzc2FnZS5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKGRvY3MubWVzc2FnZS5ibG9ja19pZCkpLFxuICAgIGJvZHk6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9keSksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MubWVzc2FnZS5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLm1lc3NhZ2UudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLm1lc3NhZ2UudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MubWVzc2FnZS5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLm1lc3NhZ2UubGlicmFyeSksXG4gICAgc3JjOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnNyYyksXG4gICAgZHN0OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmRzdCksXG4gICAgc3JjX3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5zcmNfd29ya2NoYWluX2lkKSxcbiAgICBkc3Rfd29ya2NoYWluX2lkOiBpMzIoZG9jcy5tZXNzYWdlLmRzdF93b3JrY2hhaW5faWQpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NChkb2NzLm1lc3NhZ2UuY3JlYXRlZF9sdCksXG4gICAgY3JlYXRlZF9hdDogdTMyKGRvY3MubWVzc2FnZS5jcmVhdGVkX2F0KSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmlocl9kaXNhYmxlZCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmlocl9mZWUpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5md2RfZmVlKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuaW1wb3J0X2ZlZSksXG4gICAgYm91bmNlOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2UpLFxuICAgIGJvdW5jZWQ6IGJvb2woZG9jcy5tZXNzYWdlLmJvdW5jZWQpLFxuICAgIHZhbHVlOiBncmFtcyhkb2NzLm1lc3NhZ2UudmFsdWUpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLm1lc3NhZ2UudmFsdWVfb3RoZXIpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy5tZXNzYWdlLnByb29mKSxcbiAgICBib2M6IHN0cmluZyhkb2NzLm1lc3NhZ2UuYm9jKSxcbiAgICBzcmNfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ291dF9tc2dzWypdJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMScpLFxuICAgIGRzdF90cmFuc2FjdGlvbjogam9pbignVHJhbnNhY3Rpb24nLCAnaWQnLCAnaW5fbXNnJywgJ3BhcmVudC5tc2dfdHlwZSAhPT0gMicpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLnRyYW5zYWN0aW9uLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZShkb2NzLnRyYW5zYWN0aW9uLnRyX3R5cGUpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLnN0YXR1cykpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ibG9ja19pZCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY2NvdW50X2FkZHIpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MudHJhbnNhY3Rpb24ud29ya2NoYWluX2lkKSxcbiAgICBsdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ubHQpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19oYXNoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoZG9jcy50cmFuc2FjdGlvbi5wcmV2X3RyYW5zX2x0KSxcbiAgICBub3c6IHUzMihkb2NzLnRyYW5zYWN0aW9uLm5vdyksXG4gICAgb3V0bXNnX2NudDogaTMyKGRvY3MudHJhbnNhY3Rpb24ub3V0bXNnX2NudCksXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5vcmlnX3N0YXR1cyksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cyhkb2NzLnRyYW5zYWN0aW9uLmVuZF9zdGF0dXMpLFxuICAgIGluX21zZzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uaW5fbXNnKSxcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJywgJ2lkJyksXG4gICAgb3V0X21zZ3M6IGFycmF5T2Yoc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub3V0X21zZ3MpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJywgJ2lkJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlcyksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi50b3RhbF9mZWVzX290aGVyKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ub2xkX2hhc2gpLFxuICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5uZXdfaGFzaCksXG4gICAgY3JlZGl0X2ZpcnN0OiBib29sKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0X2ZpcnN0KSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfY29sbGVjdGVkKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5zdG9yYWdlLnN0b3JhZ2VfZmVlc19kdWUpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdGF0dXNfY2hhbmdlKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmR1ZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0KSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5jcmVkaXRfb3RoZXIpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5jb21wdXRlX3R5cGUpKSxcbiAgICAgICAgc2tpcHBlZF9yZWFzb246IHNraXBSZWFzb24oZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnNraXBwZWRfcmVhc29uKSxcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuc3VjY2VzcyksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5tc2dfc3RhdGVfdXNlZCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5hY2NvdW50X2FjdGl2YXRlZCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2ZlZXMpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfdXNlZCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfbGltaXQpLFxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19jcmVkaXQpLFxuICAgICAgICBtb2RlOiBpOChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubW9kZSksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2NvZGUpLFxuICAgICAgICBleGl0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5leGl0X2FyZyksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX3N0ZXBzKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2luaXRfc3RhdGVfaGFzaCksXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUudm1fZmluYWxfc3RhdGVfaGFzaCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zdWNjZXNzKSxcbiAgICAgICAgdmFsaWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udmFsaWQpLFxuICAgICAgICBub19mdW5kczogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5ub19mdW5kcyksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3RhdHVzX2NoYW5nZSksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9md2RfZmVlcyksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi50b3RhbF9hY3Rpb25fZmVlcyksXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2NvZGUpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ucmVzdWx0X2FyZyksXG4gICAgICAgIHRvdF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90X2FjdGlvbnMpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5zcGVjX2FjdGlvbnMpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5za2lwcGVkX2FjdGlvbnMpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmFjdGlvbi5tc2dzX2NyZWF0ZWQpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uYWN0aW9uX2xpc3RfaGFzaCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfY2VsbHMpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfbXNnX3NpemVfYml0cyksXG4gICAgfSxcbiAgICBib3VuY2U6IHtcbiAgICAgICAgYm91bmNlX3R5cGU6IHJlcXVpcmVkKGJvdW5jZVR5cGUoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuYm91bmNlX3R5cGUpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9jZWxscyksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMihkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5tc2dfc2l6ZV9iaXRzKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmJvdW5jZS5yZXFfZndkX2ZlZXMpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX2ZlZXMpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UuZndkX2ZlZXMpLFxuICAgIH0sXG4gICAgYWJvcnRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmFib3J0ZWQpLFxuICAgIGRlc3Ryb3llZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmRlc3Ryb3llZCksXG4gICAgdHQ6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnR0KSxcbiAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uY3VyX3NoYXJkX3BmeF9sZW4pLFxuICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IHU4KGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5hY2Nfc3BsaXRfZGVwdGgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8udGhpc19hZGRyKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnNpYmxpbmdfYWRkciksXG4gICAgfSxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcmVwYXJlX3RyYW5zYWN0aW9uKSxcbiAgICBpbnN0YWxsZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5pbnN0YWxsZWQpLFxuICAgIHByb29mOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5ib2MpLFxufTtcblxuLy8gQkxPQ0sgU0lHTkFUVVJFU1xuXG5jb25zdCBCbG9ja1NpZ25hdHVyZXM6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1NldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2Nrc19zaWduYXR1cmVzJyB9LFxuICAgIHNpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICBub2RlX2lkOiBzdHJpbmcoXCJWYWxpZGF0b3IgSURcIiksXG4gICAgICAgIHI6IHN0cmluZyhcIidSJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICAgICAgczogc3RyaW5nKFwiJ3MnIHBhcnQgb2Ygc2lnbmF0dXJlXCIpLFxuICAgIH0sIFwiQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc1wiKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBFeHRCbGtSZWYgfSwgZG9jKTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBpaHJfZmVlOiBncmFtcygpLFxuICAgIHByb29mX2NyZWF0ZWQ6IHN0cmluZygpLFxuICAgIGluX21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICBmd2RfZmVlOiBncmFtcygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgdHJhbnNpdF9mZWU6IGdyYW1zKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGluTXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgSW5Nc2cgfSwgZG9jKTtcblxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChvdXRNc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgcmVpbXBvcnQ6IGluTXNnKCksXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbiAgICBtc2dfZW52X2hhc2g6IHN0cmluZygpLFxuICAgIG5leHRfd29ya2NoYWluOiBpMzIoKSxcbiAgICBuZXh0X2FkZHJfcGZ4OiB1NjQoKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgT3V0TXNnIH0sIGRvYyk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMihkb2NzLnNoYXJkRGVzY3Iuc2VxX25vKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMihkb2NzLnNoYXJkRGVzY3IucmVnX21jX3NlcW5vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5zdGFydF9sdCksXG4gICAgZW5kX2x0OiB1NjQoZG9jcy5zaGFyZERlc2NyLmVuZF9sdCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLnJvb3RfaGFzaCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLmZpbGVfaGFzaCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci5iZWZvcmVfc3BsaXQpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX21lcmdlKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3Muc2hhcmREZXNjci53YW50X21lcmdlKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKGRvY3Muc2hhcmREZXNjci5ueF9jY191cGRhdGVkKSxcbiAgICBmbGFnczogdTgoZG9jcy5zaGFyZERlc2NyLmZsYWdzKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm5leHRfY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoZG9jcy5zaGFyZERlc2NyLm5leHRfdmFsaWRhdG9yX3NoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLm1pbl9yZWZfbWNfc2Vxbm8pLFxuICAgIGdlbl91dGltZTogdTMyKGRvY3Muc2hhcmREZXNjci5nZW5fdXRpbWUpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZShkb2NzLnNoYXJkRGVzY3Iuc3BsaXRfdHlwZSksXG4gICAgc3BsaXQ6IHUzMihkb2NzLnNoYXJkRGVzY3Iuc3BsaXQpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWQpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKGRvY3Muc2hhcmREZXNjci5mdW5kc19jcmVhdGVkKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZF9vdGhlciksXG59LCBkb2MpO1xuXG5jb25zdCBHYXNMaW1pdHNQcmljZXM6IFR5cGVEZWYgPSB7XG4gICAgZ2FzX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBnYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIHNwZWNpYWxfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBnYXNfY3JlZGl0OiBzdHJpbmcoKSxcbiAgICBibG9ja19nYXNfbGltaXQ6IHN0cmluZygpLFxuICAgIGZyZWV6ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGRlbGV0ZV9kdWVfbGltaXQ6IHN0cmluZygpLFxuICAgIGZsYXRfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19wcmljZTogc3RyaW5nKCksXG59O1xuXG5jb25zdCBnYXNMaW1pdHNQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBHYXNMaW1pdHNQcmljZXMgfSwgZG9jKTtcblxuY29uc3QgQmxvY2tMaW1pdHM6IFR5cGVEZWYgPSB7XG4gICAgYnl0ZXM6IHtcbiAgICAgICAgdW5kZXJsb2FkOiB1MzIoKSxcbiAgICAgICAgc29mdF9saW1pdDogdTMyKCksXG4gICAgICAgIGhhcmRfbGltaXQ6IHUzMigpLFxuICAgIH0sXG4gICAgZ2FzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGx0X2RlbHRhOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxufTtcblxuY29uc3QgYmxvY2tMaW1pdHMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBCbG9ja0xpbWl0cyB9LCBkb2MpO1xuXG5jb25zdCBNc2dGb3J3YXJkUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGx1bXBfcHJpY2U6IHN0cmluZygpLFxuICAgIGJpdF9wcmljZTogc3RyaW5nKCksXG4gICAgY2VsbF9wcmljZTogc3RyaW5nKCksXG4gICAgaWhyX3ByaWNlX2ZhY3RvcjogdTMyKCksXG4gICAgZmlyc3RfZnJhYzogdTE2KCksXG4gICAgbmV4dF9mcmFjOiB1MTYoKSxcbn07XG5cbmNvbnN0IG1zZ0ZvcndhcmRQcmljZXMgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBNc2dGb3J3YXJkUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IFZhbGlkYXRvclNldDogVHlwZURlZiA9IHtcbiAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgdXRpbWVfdW50aWw6IHUzMigpLFxuICAgIHRvdGFsOiB1MTYoKSxcbiAgICB0b3RhbF93ZWlnaHQ6IHU2NCgpLFxuICAgIGxpc3Q6IGFycmF5T2Yoe1xuICAgICAgICBwdWJsaWNfa2V5OiBzdHJpbmcoKSxcbiAgICAgICAgd2VpZ2h0OiB1NjQoKSxcbiAgICAgICAgYWRubF9hZGRyOiBzdHJpbmcoKSxcbiAgICB9KSxcbn07XG5cbmNvbnN0IHZhbGlkYXRvclNldCA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IFZhbGlkYXRvclNldCB9LCBkb2MpO1xuXG5jb25zdCBDb25maWdQcm9wb3NhbFNldHVwOiBUeXBlRGVmID0ge1xuICAgIG1pbl90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1heF90b3Rfcm91bmRzOiB1OCgpLFxuICAgIG1pbl93aW5zOiB1OCgpLFxuICAgIG1heF9sb3NzZXM6IHU4KCksXG4gICAgbWluX3N0b3JlX3NlYzogdTMyKCksXG4gICAgbWF4X3N0b3JlX3NlYzogdTMyKCksXG4gICAgYml0X3ByaWNlOiB1MzIoKSxcbiAgICBjZWxsX3ByaWNlOiB1MzIoKSxcbn07XG5cbmNvbnN0IGNvbmZpZ1Byb3Bvc2FsU2V0dXAgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBDb25maWdQcm9wb3NhbFNldHVwIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYmxvY2suX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoZG9jcy5ibG9jay5zdGF0dXMpLFxuICAgIGdsb2JhbF9pZDogdTMyKGRvY3MuYmxvY2suZ2xvYmFsX2lkKSxcbiAgICB3YW50X3NwbGl0OiBib29sKGRvY3MuYmxvY2sud2FudF9zcGxpdCksXG4gICAgc2VxX25vOiB1MzIoZG9jcy5ibG9jay5zZXFfbm8pLFxuICAgIGFmdGVyX21lcmdlOiBib29sKGRvY3MuYmxvY2suYWZ0ZXJfbWVyZ2UpLFxuICAgIGdlbl91dGltZTogaTMyKGRvY3MuYmxvY2suZ2VuX3V0aW1lKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMihkb2NzLmJsb2NrLmdlbl9jYXRjaGFpbl9zZXFubyksXG4gICAgZmxhZ3M6IHUxNihkb2NzLmJsb2NrLmZsYWdzKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5tYXN0ZXJfcmVmKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9yZWYpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl9hbHRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoZG9jcy5ibG9jay5wcmV2X3ZlcnRfcmVmKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X2FsdF9yZWYpLFxuICAgIHZlcnNpb246IHUzMihkb2NzLmJsb2NrLnZlcnNpb24pLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoZG9jcy5ibG9jay5nZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKGRvY3MuYmxvY2suYmVmb3JlX3NwbGl0KSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmFmdGVyX3NwbGl0KSxcbiAgICB3YW50X21lcmdlOiBib29sKGRvY3MuYmxvY2sud2FudF9tZXJnZSksXG4gICAgdmVydF9zZXFfbm86IHUzMihkb2NzLmJsb2NrLnZlcnRfc2VxX25vKSxcbiAgICBzdGFydF9sdDogdTY0KGRvY3MuYmxvY2suc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3MuYmxvY2suZW5kX2x0KSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLndvcmtjaGFpbl9pZCksXG4gICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLnNoYXJkKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogdTMyKGRvY3MuYmxvY2sucHJldl9rZXlfYmxvY2tfc2Vxbm8pLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay5nZW5fc29mdHdhcmVfdmVyc2lvbiksXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogc3RyaW5nKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LnRvX25leHRfYmxrKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2Jsa19vdGhlciksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZXhwb3J0ZWQpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkX290aGVyKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWRfb3RoZXIpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5jcmVhdGVkX290aGVyKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5pbXBvcnRlZCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWRfb3RoZXIpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2JsayksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mcm9tX3ByZXZfYmxrX290aGVyKSxcbiAgICAgICAgbWludGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cubWludGVkX290aGVyKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWQpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19pbXBvcnRlZF9vdGhlciksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coZG9jcy5ibG9jay5pbl9tc2dfZGVzY3IpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZyhkb2NzLmJsb2NrLnJhbmRfc2VlZCksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coZG9jcy5ibG9jay5vdXRfbXNnX2Rlc2NyKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLmFjY291bnRfYWRkciksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZih7XG4gICAgICAgICAgICAgICAgbHQ6IHU2NCgpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbl9pZDogc3RyaW5nKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksIC8vIFRPRE86IGRvY1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3MudHJhbnNhY3Rpb25zXG4gICAgICAgICksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5zdGF0ZV91cGRhdGUub2xkX2hhc2gpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgdHJfY291bnQ6IGkzMihkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyX2NvdW50KVxuICAgIH0pLFxuICAgIHRyX2NvdW50OiBpMzIoKSwgLy8gVE9ETzogZG9jXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ldyksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2hhc2gpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNihkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXdfZGVwdGgpLFxuICAgICAgICBvbGQ6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGQpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgb2xkX2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkX2RlcHRoKVxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6IHUzMihkb2NzLmJsb2NrLm1hc3Rlci5taW5fc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogdTMyKGRvY3MuYmxvY2subWFzdGVyLm1heF9zaGFyZF9nZW5fdXRpbWUpLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy5zaGFyZCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuZGVzY3IpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLndvcmtjaGFpbl9pZCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuc2hhcmQpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5mZWVzKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlc19vdGhlciksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy5jcmVhdGVfb3RoZXIpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZyhkb2NzLmJsb2NrLm1hc3Rlci5yZWNvdmVyX2NyZWF0ZV9tc2cpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLm5vZGVfaWQpLFxuICAgICAgICAgICAgcjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMuciksXG4gICAgICAgICAgICBzOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5zKSxcbiAgICAgICAgfSksXG4gICAgICAgIGNvbmZpZ19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMCksXG4gICAgICAgICAgICBwMTogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMSksXG4gICAgICAgICAgICBwMjogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMiksXG4gICAgICAgICAgICBwMzogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMyksXG4gICAgICAgICAgICBwNDogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNCksXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDcuX2RvYyksXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOC5fZG9jLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wOS5fZG9jKSxcbiAgICAgICAgICAgIHAxMDogYXJyYXlPZih1MzIoKSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxMC5fZG9jKSxcbiAgICAgICAgICAgIHAxMToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuX2RvYyxcbiAgICAgICAgICAgICAgICBub3JtYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEubm9ybWFsX3BhcmFtcyksXG4gICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBjb25maWdQcm9wb3NhbFNldHVwKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTEuY3JpdGljYWxfcGFyYW1zKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTI6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBib29sKCksXG4gICAgICAgICAgICAgICAgZmxhZ3M6IHUxNigpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IHUzMigpLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBib29sKCksXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogaTMyKCksXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IHUxNigpLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IHUxNigpLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiB1MzIoKSxcbiAgICAgICAgICAgIH0sIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTIuX2RvYyksXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE0Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE1Ll9kb2MsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogdTMyKCksXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE2Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IHUxNigpLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE3Ll9kb2MsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogdTMyKClcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogc3RyaW5nKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDE4Ll9kb2MpLFxuICAgICAgICAgICAgcDIwOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMCksXG4gICAgICAgICAgICBwMjE6IGdhc0xpbWl0c1ByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIxKSxcbiAgICAgICAgICAgIHAyMjogYmxvY2tMaW1pdHMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMiksXG4gICAgICAgICAgICBwMjM6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjMpLFxuICAgICAgICAgICAgcDI0OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjQpLFxuICAgICAgICAgICAgcDI1OiBtc2dGb3J3YXJkUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjUpLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyOC5fZG9jLFxuICAgICAgICAgICAgICAgIHNodWZmbGVfbWNfdmFsaWRhdG9yczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IHUzMigpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjkuX2RvYyxcbiAgICAgICAgICAgICAgICBuZXdfY2F0Y2hhaW5faWRzOiBib29sKCksXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgICAgICAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICAgICAgICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgICAgICAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICAgICAgICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=