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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiRGVmIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsImZpbmFsIiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwiZGVxdWV1ZVNob3J0Iiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsImRvY3MiLCJhY2NvdW50IiwiXyIsImNvbGxlY3Rpb24iLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJwcm9vZiIsImJvYyIsIk1lc3NhZ2UiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJUcmFuc2FjdGlvbiIsInRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsImRvYyIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJtc2dfZW52X2hhc2giLCJuZXh0X3dvcmtjaGFpbiIsIm5leHRfYWRkcl9wZngiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiR2FzTGltaXRzUHJpY2VzIiwiZ2FzX3ByaWNlIiwic3BlY2lhbF9nYXNfbGltaXQiLCJibG9ja19nYXNfbGltaXQiLCJmcmVlemVfZHVlX2xpbWl0IiwiZGVsZXRlX2R1ZV9saW1pdCIsImZsYXRfZ2FzX2xpbWl0IiwiZmxhdF9nYXNfcHJpY2UiLCJnYXNMaW1pdHNQcmljZXMiLCJCbG9ja0xpbWl0cyIsImJ5dGVzIiwidW5kZXJsb2FkIiwic29mdF9saW1pdCIsImhhcmRfbGltaXQiLCJnYXMiLCJsdF9kZWx0YSIsImJsb2NrTGltaXRzIiwiTXNnRm9yd2FyZFByaWNlcyIsImx1bXBfcHJpY2UiLCJiaXRfcHJpY2UiLCJjZWxsX3ByaWNlIiwiaWhyX3ByaWNlX2ZhY3RvciIsImZpcnN0X2ZyYWMiLCJuZXh0X2ZyYWMiLCJtc2dGb3J3YXJkUHJpY2VzIiwiVmFsaWRhdG9yU2V0IiwidXRpbWVfc2luY2UiLCJ1dGltZV91bnRpbCIsInRvdGFsIiwidG90YWxfd2VpZ2h0IiwibGlzdCIsInB1YmxpY19rZXkiLCJ3ZWlnaHQiLCJhZG5sX2FkZHIiLCJ2YWxpZGF0b3JTZXQiLCJDb25maWdQcm9wb3NhbFNldHVwIiwibWluX3RvdF9yb3VuZHMiLCJtYXhfdG90X3JvdW5kcyIsIm1pbl93aW5zIiwibWF4X2xvc3NlcyIsIm1pbl9zdG9yZV9zZWMiLCJtYXhfc3RvcmVfc2VjIiwiY29uZmlnUHJvcG9zYWxTZXR1cCIsIkJsb2NrIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJyZW5jeSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQWtCQTs7QUFHQTs7QUFnQkE7O0FBckNBOzs7Ozs7Ozs7Ozs7Ozs7QUF1Q0EsTUFBTTtBQUFFQSxFQUFBQSxNQUFGO0FBQVVDLEVBQUFBLElBQVY7QUFBZ0JDLEVBQUFBLEdBQWhCO0FBQXFCQyxFQUFBQTtBQUFyQixJQUFpQ0MsV0FBdkM7QUFHQSxNQUFNQyxhQUFhLEdBQUcsMkJBQU8sZUFBUCxFQUF3QjtBQUMxQ0MsRUFBQUEsTUFBTSxFQUFFLENBRGtDO0FBRTFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FGa0M7QUFHMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUhrQztBQUkxQ0MsRUFBQUEsUUFBUSxFQUFFO0FBSmdDLENBQXhCLENBQXRCO0FBT0EsTUFBTUMsbUJBQW1CLEdBQUcsMkJBQU8scUJBQVAsRUFBOEI7QUFDdERDLEVBQUFBLFNBQVMsRUFBRSxDQUQyQztBQUV0REgsRUFBQUEsTUFBTSxFQUFFLENBRjhDO0FBR3RESSxFQUFBQSxPQUFPLEVBQUU7QUFINkMsQ0FBOUIsQ0FBNUI7QUFNQSxNQUFNQyxVQUFVLEdBQUcsMkJBQU8sWUFBUCxFQUFxQjtBQUNwQ0MsRUFBQUEsT0FBTyxFQUFFLENBRDJCO0FBRXBDQyxFQUFBQSxRQUFRLEVBQUUsQ0FGMEI7QUFHcENDLEVBQUFBLEtBQUssRUFBRTtBQUg2QixDQUFyQixDQUFuQjtB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LFFBQUFBLEtBQUssRUFBRSx5QkFIRTtBQUlUQyxRQUFBQSxXQUFXLEVBQUUseUJBSko7QUFLVEMsUUFBQUEsV0FBVyxFQUFFaGEsTUFBTSxFQUxWO0FBTVRpYSxRQUFBQSxXQUFXLEVBQUVqYSxNQUFNO0FBTlYsT0FBRCxFQU9UcUUsY0FBSzhNLEtBQUwsQ0FBVzBDLE1BQVgsQ0FBa0JhLE1BQWxCLENBQXlCa0YsR0FBekIsQ0FBNkJ4VixJQVBwQjtBQTlHUjtBQXZCSixHQTFFVztBQXlObkJpSCxFQUFBQSxVQUFVLEVBQUUseUJBQUs7QUFBRUQsSUFBQUE7QUFBRixHQUFMLEVBQTBCLElBQTFCLEVBQWdDLElBQWhDO0FBek5PLENBQXZCLEMsQ0E0TkE7O0FBRUEsTUFBTThPLE1BQWUsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLEtBQUssRUFBRTtBQUNIQyxNQUFBQSxhQUFhLEVBQWJBLDRCQURHO0FBRUg1TyxNQUFBQSxTQUZHO0FBR0hPLE1BQUFBLFdBSEc7QUFJSE0sTUFBQUEsS0FKRztBQUtITyxNQUFBQSxNQUxHO0FBTUh2SCxNQUFBQSxPQU5HO0FBT0g0TCxNQUFBQSxLQVBHO0FBUUgvTSxNQUFBQSxPQVJHO0FBU0h5QyxNQUFBQSxXQVRHO0FBVUh3RSxNQUFBQSxlQVZHO0FBV0htRCxNQUFBQSxlQVhHO0FBWUhTLE1BQUFBLFdBWkc7QUFhSFEsTUFBQUEsZ0JBYkc7QUFjSFEsTUFBQUEsWUFkRztBQWVIVSxNQUFBQTtBQWZHO0FBREg7QUFEWSxDQUF4QjtlQXNCZXdKLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5pbXBvcnQgeyBkb2NzIH0gZnJvbSAnLi9kYi5zaGVtYS5kb2NzJztcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBkZXF1ZXVlU2hvcnQ6IDcsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6IGRvY3MuYWNjb3VudC5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYWNjb3VudC53b3JrY2hhaW5faWQpLFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZShkb2NzLmFjY291bnQuYWNjX3R5cGUpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMihkb2NzLmFjY291bnQubGFzdF9wYWlkKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKGRvY3MuYWNjb3VudC5kdWVfcGF5bWVudCksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KGRvY3MuYWNjb3VudC5sYXN0X3RyYW5zX2x0KSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoZG9jcy5hY2NvdW50LmJhbGFuY2UpKSwgLy8gaW5kZXhcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmFjY291bnQuYmFsYW5jZV9vdGhlciksXG4gICAgc3BsaXRfZGVwdGg6IHU4KGRvY3MuYWNjb3VudC5zcGxpdF9kZXB0aCksXG4gICAgdGljazogYm9vbChkb2NzLmFjY291bnQudGljayksXG4gICAgdG9jazogYm9vbChkb2NzLmFjY291bnQudG9jayksXG4gICAgY29kZTogc3RyaW5nKGRvY3MuYWNjb3VudC5jb2RlKSxcbiAgICBkYXRhOiBzdHJpbmcoZG9jcy5hY2NvdW50LmRhdGEpLFxuICAgIGxpYnJhcnk6IHN0cmluZyhkb2NzLmFjY291bnQubGlicmFyeSksXG4gICAgcHJvb2Y6IHN0cmluZyhkb2NzLmFjY291bnQucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MuYWNjb3VudC5ib2MpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLm1lc3NhZ2UuX2RvYyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoZG9jcy5tZXNzYWdlLm1zZ190eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyhkb2NzLm1lc3NhZ2Uuc3RhdHVzKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZyhkb2NzLm1lc3NhZ2UuYmxvY2tfaWQpKSxcbiAgICBib2R5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvZHkpLFxuICAgIHNwbGl0X2RlcHRoOiB1OChkb2NzLm1lc3NhZ2Uuc3BsaXRfZGVwdGgpLFxuICAgIHRpY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRpY2spLFxuICAgIHRvY2s6IGJvb2woZG9jcy5tZXNzYWdlLnRvY2spLFxuICAgIGNvZGU6IHN0cmluZyhkb2NzLm1lc3NhZ2UuY29kZSksXG4gICAgZGF0YTogc3RyaW5nKGRvY3MubWVzc2FnZS5kYXRhKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoZG9jcy5tZXNzYWdlLmxpYnJhcnkpLFxuICAgIHNyYzogc3RyaW5nKGRvY3MubWVzc2FnZS5zcmMpLFxuICAgIGRzdDogc3RyaW5nKGRvY3MubWVzc2FnZS5kc3QpLFxuICAgIHNyY193b3JrY2hhaW5faWQ6IGkzMihkb2NzLm1lc3NhZ2Uuc3JjX3dvcmtjaGFpbl9pZCksXG4gICAgZHN0X3dvcmtjaGFpbl9pZDogaTMyKGRvY3MubWVzc2FnZS5kc3Rfd29ya2NoYWluX2lkKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoZG9jcy5tZXNzYWdlLmNyZWF0ZWRfbHQpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMihkb2NzLm1lc3NhZ2UuY3JlYXRlZF9hdCksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKGRvY3MubWVzc2FnZS5paHJfZGlzYWJsZWQpLFxuICAgIGlocl9mZWU6IGdyYW1zKGRvY3MubWVzc2FnZS5paHJfZmVlKSxcbiAgICBmd2RfZmVlOiBncmFtcyhkb2NzLm1lc3NhZ2UuZndkX2ZlZSksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoZG9jcy5tZXNzYWdlLmltcG9ydF9mZWUpLFxuICAgIGJvdW5jZTogYm9vbChkb2NzLm1lc3NhZ2UuYm91bmNlKSxcbiAgICBib3VuY2VkOiBib29sKGRvY3MubWVzc2FnZS5ib3VuY2VkKSxcbiAgICB2YWx1ZTogZ3JhbXMoZG9jcy5tZXNzYWdlLnZhbHVlKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5tZXNzYWdlLnZhbHVlX290aGVyKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MubWVzc2FnZS5wcm9vZiksXG4gICAgYm9jOiBzdHJpbmcoZG9jcy5tZXNzYWdlLmJvYyksXG4gICAgc3JjX3RyYW5zYWN0aW9uOiBqb2luKCdUcmFuc2FjdGlvbicsICdpZCcsICdvdXRfbXNnc1sqXScsICdwYXJlbnQubXNnX3R5cGUgIT09IDEnKSxcbiAgICBkc3RfdHJhbnNhY3Rpb246IGpvaW4oJ1RyYW5zYWN0aW9uJywgJ2lkJywgJ2luX21zZycsICdwYXJlbnQubXNnX3R5cGUgIT09IDInKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogZG9jcy50cmFuc2FjdGlvbi5fZG9jLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoZG9jcy50cmFuc2FjdGlvbi50cl90eXBlKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5zdGF0dXMpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYmxvY2tfaWQpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWNjb3VudF9hZGRyKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLndvcmtjaGFpbl9pZCksXG4gICAgbHQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmx0KSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLnByZXZfdHJhbnNfaGFzaCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KGRvY3MudHJhbnNhY3Rpb24ucHJldl90cmFuc19sdCksXG4gICAgbm93OiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ub3cpLFxuICAgIG91dG1zZ19jbnQ6IGkzMihkb2NzLnRyYW5zYWN0aW9uLm91dG1zZ19jbnQpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKGRvY3MudHJhbnNhY3Rpb24ub3JpZ19zdGF0dXMpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoZG9jcy50cmFuc2FjdGlvbi5lbmRfc3RhdHVzKSxcbiAgICBpbl9tc2c6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLmluX21zZyksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycsICdpZCcpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm91dF9tc2dzKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycsICdpZCcpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnRvdGFsX2ZlZXMpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MudHJhbnNhY3Rpb24udG90YWxfZmVlc19vdGhlciksXG4gICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLnRyYW5zYWN0aW9uLm9sZF9oYXNoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ubmV3X2hhc2gpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdF9maXJzdCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RvcmFnZV9mZWVzX2NvbGxlY3RlZCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uc3RvcmFnZS5zdG9yYWdlX2ZlZXNfZHVlKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZShkb2NzLnRyYW5zYWN0aW9uLnN0b3JhZ2Uuc3RhdHVzX2NoYW5nZSksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLnRyYW5zYWN0aW9uLmNyZWRpdC5kdWVfZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uY3JlZGl0LmNyZWRpdCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy50cmFuc2FjdGlvbi5jcmVkaXQuY3JlZGl0X290aGVyKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZShkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuY29tcHV0ZV90eXBlKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5za2lwcGVkX3JlYXNvbiksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnN1Y2Nlc3MpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUubXNnX3N0YXRlX3VzZWQpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuYWNjb3VudF9hY3RpdmF0ZWQpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLmdhc19mZWVzKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX3VzZWQpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NChkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZ2FzX2xpbWl0KSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS5nYXNfY3JlZGl0KSxcbiAgICAgICAgbW9kZTogaTgoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLm1vZGUpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9jb2RlKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMihkb2NzLnRyYW5zYWN0aW9uLmNvbXB1dGUuZXhpdF9hcmcpLFxuICAgICAgICB2bV9zdGVwczogdTMyKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9zdGVwcyksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uY29tcHV0ZS52bV9pbml0X3N0YXRlX2hhc2gpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5jb21wdXRlLnZtX2ZpbmFsX3N0YXRlX2hhc2gpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3VjY2VzcyksXG4gICAgICAgIHZhbGlkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnZhbGlkKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubm9fZnVuZHMpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnN0YXR1c19jaGFuZ2UpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfZndkX2ZlZXMpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24udG90YWxfYWN0aW9uX2ZlZXMpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9jb2RlKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnJlc3VsdF9hcmcpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdF9hY3Rpb25zKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc3BlY19hY3Rpb25zKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24uc2tpcHBlZF9hY3Rpb25zKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoZG9jcy50cmFuc2FjdGlvbi5hY3Rpb24ubXNnc19jcmVhdGVkKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLmFjdGlvbl9saXN0X2hhc2gpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2NlbGxzKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKGRvY3MudHJhbnNhY3Rpb24uYWN0aW9uLnRvdGFsX21zZ19zaXplX2JpdHMpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmJvdW5jZV90eXBlKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfY2VsbHMpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UubXNnX3NpemVfYml0cyksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoZG9jcy50cmFuc2FjdGlvbi5ib3VuY2UucmVxX2Z3ZF9mZWVzKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLm1zZ19mZWVzKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKGRvY3MudHJhbnNhY3Rpb24uYm91bmNlLmZ3ZF9mZWVzKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5hYm9ydGVkKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woZG9jcy50cmFuc2FjdGlvbi5kZXN0cm95ZWQpLFxuICAgIHR0OiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi50dCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLmN1cl9zaGFyZF9wZnhfbGVuKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OChkb2NzLnRyYW5zYWN0aW9uLnNwbGl0X2luZm8uYWNjX3NwbGl0X2RlcHRoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoZG9jcy50cmFuc2FjdGlvbi5zcGxpdF9pbmZvLnRoaXNfYWRkciksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uc3BsaXRfaW5mby5zaWJsaW5nX2FkZHIpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJlcGFyZV90cmFuc2FjdGlvbiksXG4gICAgaW5zdGFsbGVkOiBib29sKGRvY3MudHJhbnNhY3Rpb24uaW5zdGFsbGVkKSxcbiAgICBwcm9vZjogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24ucHJvb2YpLFxuICAgIGJvYzogc3RyaW5nKGRvY3MudHJhbnNhY3Rpb24uYm9jKSxcbn07XG5cbi8vIEJMT0NLIFNJR05BVFVSRVNcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgRXh0QmxrUmVmIH0sIGRvYyk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IEluTXNnIH0sIGRvYyk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG4gICAgbXNnX2Vudl9oYXNoOiBzdHJpbmcoKSxcbiAgICBuZXh0X3dvcmtjaGFpbjogaTMyKCksXG4gICAgbmV4dF9hZGRyX3BmeDogdTY0KCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbn07XG5cbmNvbnN0IG91dE1zZyA9IChkb2M/OiBzdHJpbmcpID0+IHJlZih7IE91dE1zZyB9LCBkb2MpO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnNlcV9ubyksXG4gICAgcmVnX21jX3NlcW5vOiB1MzIoZG9jcy5zaGFyZERlc2NyLnJlZ19tY19zZXFubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLnNoYXJkRGVzY3Iuc3RhcnRfbHQpLFxuICAgIGVuZF9sdDogdTY0KGRvY3Muc2hhcmREZXNjci5lbmRfbHQpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5yb290X2hhc2gpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5maWxlX2hhc2gpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3IuYmVmb3JlX3NwbGl0KSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woZG9jcy5zaGFyZERlc2NyLmJlZm9yZV9tZXJnZSksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLnNoYXJkRGVzY3Iud2FudF9tZXJnZSksXG4gICAgbnhfY2NfdXBkYXRlZDogYm9vbChkb2NzLnNoYXJkRGVzY3IubnhfY2NfdXBkYXRlZCksXG4gICAgZmxhZ3M6IHU4KGRvY3Muc2hhcmREZXNjci5mbGFncyksXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5uZXh0X2NhdGNoYWluX3NlcW5vKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKGRvY3Muc2hhcmREZXNjci5uZXh0X3ZhbGlkYXRvcl9zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3Muc2hhcmREZXNjci5taW5fcmVmX21jX3NlcW5vKSxcbiAgICBnZW5fdXRpbWU6IHUzMihkb2NzLnNoYXJkRGVzY3IuZ2VuX3V0aW1lKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoZG9jcy5zaGFyZERlc2NyLnNwbGl0X3R5cGUpLFxuICAgIHNwbGl0OiB1MzIoZG9jcy5zaGFyZERlc2NyLnNwbGl0KSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcyhkb2NzLnNoYXJkRGVzY3IuZnVuZHNfY3JlYXRlZCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5zaGFyZERlc2NyLmZ1bmRzX2NyZWF0ZWRfb3RoZXIpLFxufSwgZG9jKTtcblxuY29uc3QgR2FzTGltaXRzUHJpY2VzOiBUeXBlRGVmID0ge1xuICAgIGdhc19wcmljZTogc3RyaW5nKCksXG4gICAgZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBzcGVjaWFsX2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZ2FzX2NyZWRpdDogc3RyaW5nKCksXG4gICAgYmxvY2tfZ2FzX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmcmVlemVfZHVlX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBkZWxldGVfZHVlX2xpbWl0OiBzdHJpbmcoKSxcbiAgICBmbGF0X2dhc19saW1pdDogc3RyaW5nKCksXG4gICAgZmxhdF9nYXNfcHJpY2U6IHN0cmluZygpLFxufTtcblxuY29uc3QgZ2FzTGltaXRzUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgR2FzTGltaXRzUHJpY2VzIH0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrTGltaXRzOiBUeXBlRGVmID0ge1xuICAgIGJ5dGVzOiB7XG4gICAgICAgIHVuZGVybG9hZDogdTMyKCksXG4gICAgICAgIHNvZnRfbGltaXQ6IHUzMigpLFxuICAgICAgICBoYXJkX2xpbWl0OiB1MzIoKSxcbiAgICB9LFxuICAgIGdhczoge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbiAgICBsdF9kZWx0YToge1xuICAgICAgICB1bmRlcmxvYWQ6IHUzMigpLFxuICAgICAgICBzb2Z0X2xpbWl0OiB1MzIoKSxcbiAgICAgICAgaGFyZF9saW1pdDogdTMyKCksXG4gICAgfSxcbn07XG5cbmNvbnN0IGJsb2NrTGltaXRzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQmxvY2tMaW1pdHMgfSwgZG9jKTtcblxuY29uc3QgTXNnRm9yd2FyZFByaWNlczogVHlwZURlZiA9IHtcbiAgICBsdW1wX3ByaWNlOiBzdHJpbmcoKSxcbiAgICBiaXRfcHJpY2U6IHN0cmluZygpLFxuICAgIGNlbGxfcHJpY2U6IHN0cmluZygpLFxuICAgIGlocl9wcmljZV9mYWN0b3I6IHUzMigpLFxuICAgIGZpcnN0X2ZyYWM6IHUxNigpLFxuICAgIG5leHRfZnJhYzogdTE2KCksXG59O1xuXG5jb25zdCBtc2dGb3J3YXJkUHJpY2VzID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgTXNnRm9yd2FyZFByaWNlcyB9LCBkb2MpO1xuXG5jb25zdCBWYWxpZGF0b3JTZXQ6IFR5cGVEZWYgPSB7XG4gICAgdXRpbWVfc2luY2U6IHUzMigpLFxuICAgIHV0aW1lX3VudGlsOiB1MzIoKSxcbiAgICB0b3RhbDogdTE2KCksXG4gICAgdG90YWxfd2VpZ2h0OiB1NjQoKSxcbiAgICBsaXN0OiBhcnJheU9mKHtcbiAgICAgICAgcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgIHdlaWdodDogdTY0KCksXG4gICAgICAgIGFkbmxfYWRkcjogc3RyaW5nKCksXG4gICAgfSksXG59O1xuXG5jb25zdCB2YWxpZGF0b3JTZXQgPSAoZG9jPzogc3RyaW5nKSA9PiByZWYoeyBWYWxpZGF0b3JTZXQgfSwgZG9jKTtcblxuY29uc3QgQ29uZmlnUHJvcG9zYWxTZXR1cDogVHlwZURlZiA9IHtcbiAgICBtaW5fdG90X3JvdW5kczogdTgoKSxcbiAgICBtYXhfdG90X3JvdW5kczogdTgoKSxcbiAgICBtaW5fd2luczogdTgoKSxcbiAgICBtYXhfbG9zc2VzOiB1OCgpLFxuICAgIG1pbl9zdG9yZV9zZWM6IHUzMigpLFxuICAgIG1heF9zdG9yZV9zZWM6IHUzMigpLFxuICAgIGJpdF9wcmljZTogdTMyKCksXG4gICAgY2VsbF9wcmljZTogdTMyKCksXG59O1xuXG5jb25zdCBjb25maWdQcm9wb3NhbFNldHVwID0gKGRvYz86IHN0cmluZykgPT4gcmVmKHsgQ29uZmlnUHJvcG9zYWxTZXR1cCB9LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiBkb2NzLmJsb2NrLl9kb2MsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKGRvY3MuYmxvY2suc3RhdHVzKSxcbiAgICBnbG9iYWxfaWQ6IHUzMihkb2NzLmJsb2NrLmdsb2JhbF9pZCksXG4gICAgd2FudF9zcGxpdDogYm9vbChkb2NzLmJsb2NrLndhbnRfc3BsaXQpLFxuICAgIHNlcV9ubzogdTMyKGRvY3MuYmxvY2suc2VxX25vKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbChkb2NzLmJsb2NrLmFmdGVyX21lcmdlKSxcbiAgICBnZW5fdXRpbWU6IGkzMihkb2NzLmJsb2NrLmdlbl91dGltZSksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoZG9jcy5ibG9jay5nZW5fY2F0Y2hhaW5fc2Vxbm8pLFxuICAgIGZsYWdzOiB1MTYoZG9jcy5ibG9jay5mbGFncyksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2subWFzdGVyX3JlZiksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfcmVmKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfYWx0X3JlZiksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKGRvY3MuYmxvY2sucHJldl92ZXJ0X3JlZiksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZihkb2NzLmJsb2NrLnByZXZfdmVydF9hbHRfcmVmKSxcbiAgICB2ZXJzaW9uOiB1MzIoZG9jcy5ibG9jay52ZXJzaW9uKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKGRvY3MuYmxvY2suZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbChkb2NzLmJsb2NrLmJlZm9yZV9zcGxpdCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woZG9jcy5ibG9jay5hZnRlcl9zcGxpdCksXG4gICAgd2FudF9tZXJnZTogYm9vbChkb2NzLmJsb2NrLndhbnRfbWVyZ2UpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoZG9jcy5ibG9jay52ZXJ0X3NlcV9ubyksXG4gICAgc3RhcnRfbHQ6IHU2NChkb2NzLmJsb2NrLnN0YXJ0X2x0KSxcbiAgICBlbmRfbHQ6IHU2NChkb2NzLmJsb2NrLmVuZF9sdCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay53b3JrY2hhaW5faWQpLFxuICAgIHNoYXJkOiBzdHJpbmcoZG9jcy5ibG9jay5zaGFyZCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKGRvY3MuYmxvY2subWluX3JlZl9tY19zZXFubyksXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IHUzMihkb2NzLmJsb2NrLnByZXZfa2V5X2Jsb2NrX3NlcW5vKSxcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogdTMyKGRvY3MuYmxvY2suZ2VuX3NvZnR3YXJlX3ZlcnNpb24pLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IHN0cmluZyhkb2NzLmJsb2NrLmdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy50b19uZXh0X2JsayksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cudG9fbmV4dF9ibGtfb3RoZXIpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmV4cG9ydGVkKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5leHBvcnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZmVlc19jb2xsZWN0ZWQpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfY29sbGVjdGVkX290aGVyKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmNyZWF0ZWQpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuY3JlYXRlZF9vdGhlciksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcyhkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuaW1wb3J0ZWQpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmltcG9ydGVkX290aGVyKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93LmZyb21fcHJldl9ibGspLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLnZhbHVlX2Zsb3cuZnJvbV9wcmV2X2Jsa19vdGhlciksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93Lm1pbnRlZF9vdGhlciksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKGRvY3MuYmxvY2sudmFsdWVfZmxvdy5mZWVzX2ltcG9ydGVkKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oZG9jcy5ibG9jay52YWx1ZV9mbG93LmZlZXNfaW1wb3J0ZWRfb3RoZXIpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKGRvY3MuYmxvY2suaW5fbXNnX2Rlc2NyKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoZG9jcy5ibG9jay5yYW5kX3NlZWQpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKGRvY3MuYmxvY2sub3V0X21zZ19kZXNjcikpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy5hY2NvdW50X2FkZHIpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgICAgIGx0OiB1NjQoKSwgLy8gVE9ETzogZG9jXG4gICAgICAgICAgICAgICAgdHJhbnNhY3Rpb25faWQ6IHN0cmluZygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzOiBncmFtcygpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLCAvLyBUT0RPOiBkb2NcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnRyYW5zYWN0aW9uc1xuICAgICAgICApLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suYWNjb3VudF9ibG9ja3Muc3RhdGVfdXBkYXRlLm9sZF9oYXNoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLmFjY291bnRfYmxvY2tzLnN0YXRlX3VwZGF0ZS5uZXdfaGFzaCksXG4gICAgICAgIHRyX2NvdW50OiBpMzIoZG9jcy5ibG9jay5hY2NvdW50X2Jsb2Nrcy50cl9jb3VudClcbiAgICB9KSxcbiAgICB0cl9jb3VudDogaTMyKCksIC8vIFRPRE86IGRvY1xuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5uZXcpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm5ld19oYXNoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUubmV3X2RlcHRoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoZG9jcy5ibG9jay5zdGF0ZV91cGRhdGUub2xkKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZyhkb2NzLmJsb2NrLnN0YXRlX3VwZGF0ZS5vbGRfaGFzaCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KGRvY3MuYmxvY2suc3RhdGVfdXBkYXRlLm9sZF9kZXB0aClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiB1MzIoZG9jcy5ibG9jay5tYXN0ZXIubWluX3NoYXJkX2dlbl91dGltZSksXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6IHUzMihkb2NzLmJsb2NrLm1hc3Rlci5tYXhfc2hhcmRfZ2VuX3V0aW1lKSxcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2hhc2hlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9oYXNoZXMuc2hhcmQpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfaGFzaGVzLmRlc2NyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoZG9jcy5ibG9jay5tYXN0ZXIuc2hhcmRfZmVlcy53b3JrY2hhaW5faWQpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLnNoYXJkKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuZmVlcyksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbihkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmZlZXNfb3RoZXIpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcyhkb2NzLmJsb2NrLm1hc3Rlci5zaGFyZF9mZWVzLmNyZWF0ZSksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKGRvY3MuYmxvY2subWFzdGVyLnNoYXJkX2ZlZXMuY3JlYXRlX290aGVyKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coZG9jcy5ibG9jay5tYXN0ZXIucmVjb3Zlcl9jcmVhdGVfbXNnKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoZG9jcy5ibG9jay5tYXN0ZXIucHJldl9ibGtfc2lnbmF0dXJlcy5ub2RlX2lkKSxcbiAgICAgICAgICAgIHI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5wcmV2X2Jsa19zaWduYXR1cmVzLnIpLFxuICAgICAgICAgICAgczogc3RyaW5nKGRvY3MuYmxvY2subWFzdGVyLnByZXZfYmxrX3NpZ25hdHVyZXMucyksXG4gICAgICAgIH0pLFxuICAgICAgICBjb25maWdfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgcDA6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDApLFxuICAgICAgICAgICAgcDE6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEpLFxuICAgICAgICAgICAgcDI6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIpLFxuICAgICAgICAgICAgcDM6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMpLFxuICAgICAgICAgICAgcDQ6IHN0cmluZyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDQpLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDYuX2RvYyxcbiAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA3OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogdTMyKCksXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnA3Ll9kb2MpLFxuICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDguX2RvYyxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBhcnJheU9mKHUzMigpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDkuX2RvYyksXG4gICAgICAgICAgICBwMTA6IGFycmF5T2YodTMyKCksIGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMTAuX2RvYyksXG4gICAgICAgICAgICBwMTE6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLl9kb2MsXG4gICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogY29uZmlnUHJvcG9zYWxTZXR1cChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLm5vcm1hbF9wYXJhbXMpLFxuICAgICAgICAgICAgICAgIGNyaXRpY2FsX3BhcmFtczogY29uZmlnUHJvcG9zYWxTZXR1cChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDExLmNyaXRpY2FsX3BhcmFtcyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDEyOiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IHUzMigpLFxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IHU4KCksXG4gICAgICAgICAgICAgICAgbWluX3NwbGl0OiB1OCgpLFxuICAgICAgICAgICAgICAgIG1heF9zcGxpdDogdTgoKSxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGJvb2woKSxcbiAgICAgICAgICAgICAgICBhY2NlcHRfbXNnczogYm9vbCgpLFxuICAgICAgICAgICAgICAgIGZsYWdzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBiYXNpYzogYm9vbCgpLFxuICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGkzMigpLFxuICAgICAgICAgICAgICAgIHZtX21vZGU6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogdTE2KCksXG4gICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiB1MTYoKSxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogdTMyKCksXG4gICAgICAgICAgICB9LCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDEyLl9kb2MpLFxuICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNC5fZG9jLFxuICAgICAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogc3RyaW5nKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNS5fZG9jLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IHUzMigpLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzdGFrZV9oZWxkX2ZvcjogdTMyKCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNi5fZG9jLFxuICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiB1MTYoKSxcbiAgICAgICAgICAgICAgICBtaW5fdmFsaWRhdG9yczogdTE2KCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE3OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxNy5fZG9jLFxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE4OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogdTMyKCksXG4gICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBzdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBtY19iaXRfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAxOC5fZG9jKSxcbiAgICAgICAgICAgIHAyMDogZ2FzTGltaXRzUHJpY2VzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjApLFxuICAgICAgICAgICAgcDIxOiBnYXNMaW1pdHNQcmljZXMoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAyMSksXG4gICAgICAgICAgICBwMjI6IGJsb2NrTGltaXRzKGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjIpLFxuICAgICAgICAgICAgcDIzOiBibG9ja0xpbWl0cyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDIzKSxcbiAgICAgICAgICAgIHAyNDogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI0KSxcbiAgICAgICAgICAgIHAyNTogbXNnRm9yd2FyZFByaWNlcyhkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI1KSxcbiAgICAgICAgICAgIHAyODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMjguX2RvYyxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogdTMyKCksXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IHUzMigpLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiB1MzIoKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDI5Ll9kb2MsXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogdTMyKCksXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IHUzMigpLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogdTMyKCksXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IHUzMigpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBhcnJheU9mKHN0cmluZygpLCBkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMxLl9kb2MpLFxuICAgICAgICAgICAgcDMyOiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzMiksXG4gICAgICAgICAgICBwMzM6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDMzKSxcbiAgICAgICAgICAgIHAzNDogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzQpLFxuICAgICAgICAgICAgcDM1OiB2YWxpZGF0b3JTZXQoZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzNSksXG4gICAgICAgICAgICBwMzY6IHZhbGlkYXRvclNldChkb2NzLmJsb2NrLm1hc3Rlci5jb25maWcucDM2KSxcbiAgICAgICAgICAgIHAzNzogdmFsaWRhdG9yU2V0KGRvY3MuYmxvY2subWFzdGVyLmNvbmZpZy5wMzcpLFxuICAgICAgICAgICAgcDM5OiBhcnJheU9mKHtcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IHN0cmluZygpLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2Vxbm86IHUzMigpLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiB1MzIoKSxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogc3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IHN0cmluZygpLFxuICAgICAgICAgICAgfSwgZG9jcy5ibG9jay5tYXN0ZXIuY29uZmlnLnAzOS5fZG9jKSxcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2lnbmF0dXJlczogam9pbih7IEJsb2NrU2lnbmF0dXJlcyB9LCAnaWQnLCAnaWQnKSxcbn07XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgICAgICBHYXNMaW1pdHNQcmljZXMsXG4gICAgICAgICAgICBCbG9ja0xpbWl0cyxcbiAgICAgICAgICAgIE1zZ0ZvcndhcmRQcmljZXMsXG4gICAgICAgICAgICBWYWxpZGF0b3JTZXQsXG4gICAgICAgICAgICBDb25maWdQcm9wb3NhbFNldHVwXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=