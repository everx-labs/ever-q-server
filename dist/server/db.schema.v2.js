"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _qSchema = require("./q-schema");

/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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
var string = _schema.Def.string,
    bool = _schema.Def.bool,
    ref = _schema.Def.ref,
    arrayOf = _schema.Def.arrayOf;
var accountStatus = (0, _qSchema.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
var accountStatusChange = (0, _qSchema.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
var skipReason = (0, _qSchema.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
var accountType = (0, _qSchema.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
var messageType = (0, _qSchema.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
var messageProcessingStatus = (0, _qSchema.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
var transactionType = (0, _qSchema.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
var transactionProcessingStatus = (0, _qSchema.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
var computeType = (0, _qSchema.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
var bounceType = (0, _qSchema.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
var blockProcessingStatus = (0, _qSchema.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
var inMsgType = (0, _qSchema.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  "final": 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
var outMsgType = (0, _qSchema.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
var splitType = (0, _qSchema.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
var Account = {
  _doc: 'TON Account',
  _: {
    collection: 'accounts'
  },
  acc_type: (0, _qSchema.required)(accountType('Current status of the account')),
  last_paid: (0, _qSchema.required)((0, _qSchema.u32)('Contains either the unixtime of the most recent storage payment collected (usually this is the unixtime of the most recent transaction), or the unixtime when the account was created (again, by a transaction)')),
  due_payment: (0, _qSchema.grams)('If present, accumulates the storage payments that could not be exacted from the balance of the account, represented by a strictly positive amount of nanograms; it can be present only for uninitialized or frozen accounts that have a balance of zero Grams (but may have non-zero balances in other cryptocurrencies). When due_payment becomes larger than the value of a configurable parameter of the blockchain, the account is destroyed altogether, and its balance, if any, is transferred to the zero account.'),
  last_trans_lt: (0, _qSchema.required)((0, _qSchema.u64)()),
  balance: (0, _qSchema.required)((0, _qSchema.grams)()),
  balance_other: (0, _qSchema.otherCurrencyCollection)(),
  split_depth: (0, _qSchema.u8)('Is present and non-zero only in instances of large smart contracts.'),
  tick: bool('May be present only in the masterchain—and within the masterchain, only in some fundamental smart contracts required for the whole system to function.'),
  tock: bool('May be present only in the masterchain—and within the masterchain, only in some fundamental smart contracts required for the whole system to function.'),
  code: string('If present, contains smart-contract code encoded with in base64'),
  data: string('If present, contains smart-contract data encoded with in base64'),
  library: string('If present, contains library code used in smart-contract'),
  proof: string(),
  boc: string()
};
var Message = {
  _doc: 'TON Message',
  _: {
    collection: 'messages'
  },
  msg_type: (0, _qSchema.required)(messageType('Message type')),
  status: (0, _qSchema.required)(messageProcessingStatus('Internal processing status')),
  block_id: (0, _qSchema.required)(string('Block to which this message belongs')),
  body: string(''),
  split_depth: (0, _qSchema.u8)('Used in deploy message for special contracts in masterchain'),
  tick: bool('Used in deploy message for special contracts in masterchain'),
  tock: bool('Used in deploy message for special contracts in masterchain'),
  code: string('Represents contract code in deploy messages'),
  data: string('Represents initial data for a contract in deploy messages'),
  library: string('Represents contract library in deploy messages'),
  src: string('Source address'),
  dst: string('Destination address'),
  created_lt: (0, _qSchema.u64)('Logical creation time automatically set by the generating transaction'),
  created_at: (0, _qSchema.u32)('Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction.'),
  ihr_disabled: bool('Not described in spec'),
  ihr_fee: (0, _qSchema.grams)('This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism.'),
  fwd_fee: (0, _qSchema.grams)('Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated.'),
  import_fee: (0, _qSchema.grams)('Not described in spec'),
  bounce: bool('Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  bounced: bool('Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  value: (0, _qSchema.grams)('Internal message may bear some value in Grams'),
  value_other: (0, _qSchema.otherCurrencyCollection)('Internal message may bear some value in other currencies'),
  proof: string(),
  boc: string()
};
var Transaction = {
  _doc: 'TON Transaction',
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _qSchema.required)(transactionType()),
  status: (0, _qSchema.required)(transactionProcessingStatus()),
  block_id: string(),
  account_addr: string(),
  lt: (0, _qSchema.u64)(),
  prev_trans_hash: string(),
  prev_trans_lt: (0, _qSchema.u64)(),
  now: (0, _qSchema.u32)(),
  outmsg_cnt: (0, _qSchema.i32)(),
  orig_status: accountStatus(),
  end_status: accountStatus(),
  in_msg: string(),
  in_message: (0, _qSchema.join)({
    Message: Message
  }, 'in_msg'),
  out_msgs: arrayOf(string()),
  out_messages: arrayOf((0, _qSchema.join)({
    Message: Message
  }, 'out_msgs')),
  total_fees: (0, _qSchema.grams)(),
  total_fees_other: (0, _qSchema.otherCurrencyCollection)(),
  old_hash: string(),
  new_hash: string(),
  credit_first: bool(),
  storage: {
    storage_fees_collected: (0, _qSchema.grams)(),
    storage_fees_due: (0, _qSchema.grams)(),
    status_change: accountStatusChange()
  },
  credit: {
    due_fees_collected: (0, _qSchema.grams)(),
    credit: (0, _qSchema.grams)(),
    credit_other: (0, _qSchema.otherCurrencyCollection)()
  },
  compute: {
    compute_type: (0, _qSchema.required)(computeType()),
    skipped_reason: skipReason(),
    success: bool(),
    msg_state_used: bool(),
    account_activated: bool(),
    gas_fees: (0, _qSchema.grams)(),
    gas_used: (0, _qSchema.u64)(),
    gas_limit: (0, _qSchema.u64)(),
    gas_credit: (0, _qSchema.i32)(),
    mode: (0, _qSchema.i8)(),
    exit_code: (0, _qSchema.i32)(),
    exit_arg: (0, _qSchema.i32)(),
    vm_steps: (0, _qSchema.u32)(),
    vm_init_state_hash: string(),
    vm_final_state_hash: string()
  },
  action: {
    success: bool(),
    valid: bool(),
    no_funds: bool(),
    status_change: accountStatusChange(),
    total_fwd_fees: (0, _qSchema.grams)(),
    total_action_fees: (0, _qSchema.grams)(),
    result_code: (0, _qSchema.i32)(),
    result_arg: (0, _qSchema.i32)(),
    tot_actions: (0, _qSchema.i32)(),
    spec_actions: (0, _qSchema.i32)(),
    skipped_actions: (0, _qSchema.i32)(),
    msgs_created: (0, _qSchema.i32)(),
    action_list_hash: string(),
    total_msg_size_cells: (0, _qSchema.u32)(),
    total_msg_size_bits: (0, _qSchema.u32)()
  },
  bounce: {
    bounce_type: (0, _qSchema.required)(bounceType()),
    msg_size_cells: (0, _qSchema.u32)(),
    msg_size_bits: (0, _qSchema.u32)(),
    req_fwd_fees: (0, _qSchema.grams)(),
    msg_fees: (0, _qSchema.grams)(),
    fwd_fees: (0, _qSchema.grams)()
  },
  aborted: bool(),
  destroyed: bool(),
  tt: string(),
  split_info: {
    cur_shard_pfx_len: (0, _qSchema.u8)(),
    acc_split_depth: (0, _qSchema.u8)(),
    this_addr: string(),
    sibling_addr: string()
  },
  prepare_transaction: string(),
  installed: bool(),
  proof: string(),
  boc: string()
}; // BLOCK

var ExtBlkRef = {
  end_lt: (0, _qSchema.u64)(),
  seq_no: (0, _qSchema.u32)(),
  root_hash: string(),
  file_hash: string()
};

var extBlkRef = function extBlkRef() {
  return ref({
    ExtBlkRef: ExtBlkRef
  });
};

var MsgEnvelope = {
  msg_id: string(),
  next_addr: string(),
  cur_addr: string(),
  fwd_fee_remaining: (0, _qSchema.grams)()
};

var msgEnvelope = function msgEnvelope() {
  return ref({
    MsgEnvelope: MsgEnvelope
  });
};

var InMsg = {
  msg_type: (0, _qSchema.required)(inMsgType()),
  msg: string(),
  transaction: string(),
  ihr_fee: (0, _qSchema.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _qSchema.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _qSchema.grams)(),
  transaction_id: (0, _qSchema.u64)(),
  proof_delivered: string()
};

var inMsg = function inMsg() {
  return ref({
    InMsg: InMsg
  });
};

var OutMsg = {
  msg_type: (0, _qSchema.required)(outMsgType()),
  msg: string(),
  transaction: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _qSchema.u64)()
};

var outMsg = function outMsg() {
  return ref({
    OutMsg: OutMsg
  });
};

var shardDescr = function shardDescr(doc) {
  return (0, _qSchema.withDoc)({
    seq_no: (0, _qSchema.u32)(),
    reg_mc_seqno: (0, _qSchema.u32)(),
    start_lt: (0, _qSchema.u64)(),
    end_lt: (0, _qSchema.u64)(),
    root_hash: string(),
    file_hash: string(),
    before_split: bool(),
    before_merge: bool(),
    want_split: bool(),
    want_merge: bool(),
    nx_cc_updated: bool(),
    flags: (0, _qSchema.u8)(),
    next_catchain_seqno: (0, _qSchema.u32)(),
    next_validator_shard: string(),
    min_ref_mc_seqno: (0, _qSchema.u32)(),
    gen_utime: (0, _qSchema.u32)(),
    split_type: splitType(),
    split: (0, _qSchema.u32)(),
    fees_collected: (0, _qSchema.grams)(),
    fees_collected_other: (0, _qSchema.otherCurrencyCollection)(),
    funds_created: (0, _qSchema.grams)(),
    funds_created_other: (0, _qSchema.otherCurrencyCollection)()
  }, doc);
};

var Block = {
  _doc: 'This is Block',
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(),
  global_id: (0, _qSchema.u32)(),
  want_split: bool(),
  seq_no: (0, _qSchema.u32)(),
  after_merge: bool(),
  gen_utime: (0, _qSchema.i32)(),
  gen_catchain_seqno: (0, _qSchema.u32)(),
  flags: (0, _qSchema.u16)(),
  master_ref: extBlkRef(),
  prev_ref: extBlkRef(),
  prev_alt_ref: extBlkRef(),
  prev_vert_ref: extBlkRef(),
  prev_vert_alt_ref: extBlkRef(),
  version: (0, _qSchema.u32)(),
  gen_validator_list_hash_short: (0, _qSchema.u32)(),
  before_split: bool(),
  after_split: bool(),
  want_merge: bool(),
  vert_seq_no: (0, _qSchema.u32)(),
  start_lt: (0, _qSchema.u64)(),
  end_lt: (0, _qSchema.u64)(),
  workchain_id: (0, _qSchema.i32)(),
  shard: string(),
  min_ref_mc_seqno: (0, _qSchema.u32)(),
  value_flow: {
    to_next_blk: (0, _qSchema.grams)(),
    to_next_blk_other: (0, _qSchema.otherCurrencyCollection)(),
    exported: (0, _qSchema.grams)(),
    exported_other: (0, _qSchema.otherCurrencyCollection)(),
    fees_collected: (0, _qSchema.grams)(),
    fees_collected_other: (0, _qSchema.otherCurrencyCollection)(),
    created: (0, _qSchema.grams)(),
    created_other: (0, _qSchema.otherCurrencyCollection)(),
    imported: (0, _qSchema.grams)(),
    imported_other: (0, _qSchema.otherCurrencyCollection)(),
    from_prev_blk: (0, _qSchema.grams)(),
    from_prev_blk_other: (0, _qSchema.otherCurrencyCollection)(),
    minted: (0, _qSchema.grams)(),
    minted_other: (0, _qSchema.otherCurrencyCollection)(),
    fees_imported: (0, _qSchema.grams)(),
    fees_imported_other: (0, _qSchema.otherCurrencyCollection)()
  },
  in_msg_descr: arrayOf(inMsg()),
  rand_seed: string(),
  out_msg_descr: arrayOf(outMsg()),
  account_blocks: arrayOf({
    account_addr: string(),
    transactions: arrayOf(string()),
    state_update: {
      old_hash: string(),
      new_hash: string()
    },
    tr_count: (0, _qSchema.i32)()
  }),
  state_update: {
    "new": string(),
    new_hash: string(),
    new_depth: (0, _qSchema.u16)(),
    old: string(),
    old_hash: string(),
    old_depth: (0, _qSchema.u16)()
  },
  master: {
    shard_hashes: arrayOf({
      workchain_id: (0, _qSchema.i32)(),
      shard: string(),
      descr: shardDescr()
    }),
    shard_fees: arrayOf({
      workchain_id: (0, _qSchema.i32)(),
      shard: string(),
      fees: (0, _qSchema.grams)(),
      fees_other: (0, _qSchema.otherCurrencyCollection)(),
      create: (0, _qSchema.grams)(),
      create_other: (0, _qSchema.otherCurrencyCollection)()
    }),
    recover_create_msg: inMsg(),
    prev_blk_signatures: arrayOf({
      node_id: string(),
      r: string(),
      s: string()
    })
  }
}; //Root scheme declaration

var schema = {
  _class: {
    types: {
      OtherCurrency: _qSchema.OtherCurrency,
      ExtBlkRef: ExtBlkRef,
      MsgEnvelope: MsgEnvelope,
      InMsg: InMsg,
      OutMsg: OutMsg,
      Message: Message,
      Block: Block,
      Account: Account,
      Transaction: Transaction
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi5zY2hlbWEudjIuanMiXSwibmFtZXMiOlsic3RyaW5nIiwiRGVmIiwiYm9vbCIsInJlZiIsImFycmF5T2YiLCJhY2NvdW50U3RhdHVzIiwidW5pbml0IiwiYWN0aXZlIiwiZnJvemVuIiwibm9uRXhpc3QiLCJhY2NvdW50U3RhdHVzQ2hhbmdlIiwidW5jaGFuZ2VkIiwiZGVsZXRlZCIsInNraXBSZWFzb24iLCJub1N0YXRlIiwiYmFkU3RhdGUiLCJub0dhcyIsImFjY291bnRUeXBlIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwibXNnIiwidHJhbnNhY3Rpb24iLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwiZG9jIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBRUE7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LEVBQVhBLFdBSEc7QUFJSE0sTUFBQUEsS0FBSyxFQUFMQSxLQUpHO0FBS0hTLE1BQUFBLE1BQU0sRUFBTkEsTUFMRztBQU1IN0csTUFBQUEsT0FBTyxFQUFQQSxPQU5HO0FBT0hxSSxNQUFBQSxLQUFLLEVBQUxBLEtBUEc7QUFRSHJKLE1BQUFBLE9BQU8sRUFBUEEsT0FSRztBQVNIaUMsTUFBQUEsV0FBVyxFQUFYQTtBQVRHO0FBREg7QUFEWSxDQUF4QjtlQWdCZXdLLE0iLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vQGZsb3dcblxuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuaW1wb3J0IHR5cGUgeyBUeXBlRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9zcmMvc2NoZW1hJztcbmltcG9ydCB7XG4gICAgZ3JhbXMsXG4gICAgaTMyLFxuICAgIGk4LFxuICAgIGpvaW4sXG4gICAgT3RoZXJDdXJyZW5jeSxcbiAgICBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICByZXF1aXJlZCxcbiAgICB1MTYsXG4gICAgdTMyLFxuICAgIHU2NCxcbiAgICB1OCxcbiAgICB1OGVudW0sXG4gICAgd2l0aERvY1xufSBmcm9tIFwiLi9xLXNjaGVtYVwiO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVE9OIEFjY291bnQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZSgnQ3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQnKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoJ0NvbnRhaW5zIGVpdGhlciB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHN0b3JhZ2UgcGF5bWVudCBjb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSwgb3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKScpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoJ0lmIHByZXNlbnQsIGFjY3VtdWxhdGVzIHRoZSBzdG9yYWdlIHBheW1lbnRzIHRoYXQgY291bGQgbm90IGJlIGV4YWN0ZWQgZnJvbSB0aGUgYmFsYW5jZSBvZiB0aGUgYWNjb3VudCwgcmVwcmVzZW50ZWQgYnkgYSBzdHJpY3RseSBwb3NpdGl2ZSBhbW91bnQgb2YgbmFub2dyYW1zOyBpdCBjYW4gYmUgcHJlc2VudCBvbmx5IGZvciB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50cyB0aGF0IGhhdmUgYSBiYWxhbmNlIG9mIHplcm8gR3JhbXMgKGJ1dCBtYXkgaGF2ZSBub24temVybyBiYWxhbmNlcyBpbiBvdGhlciBjcnlwdG9jdXJyZW5jaWVzKS4gV2hlbiBkdWVfcGF5bWVudCBiZWNvbWVzIGxhcmdlciB0aGFuIHRoZSB2YWx1ZSBvZiBhIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXIgb2YgdGhlIGJsb2NrY2hhaW4sIHRoZSBhY2NvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC4nKSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoKSksXG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoKSksXG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoJ0lzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy4nKSxcbiAgICB0aWNrOiBib29sKCdNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLicpLFxuICAgIHRvY2s6IGJvb2woJ01heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uJyksXG4gICAgY29kZTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBjb2RlIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQnKSxcbiAgICBkYXRhOiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NCcpLFxuICAgIGxpYnJhcnk6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBNZXNzYWdlJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoJ01lc3NhZ2UgdHlwZScpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKCdJbnRlcm5hbCBwcm9jZXNzaW5nIHN0YXR1cycpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKCdCbG9jayB0byB3aGljaCB0aGlzIG1lc3NhZ2UgYmVsb25ncycpKSxcbiAgICBib2R5OiBzdHJpbmcoJycpLFxuICAgIHNwbGl0X2RlcHRoOiB1OCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICB0aWNrOiBib29sKCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIHRvY2s6IGJvb2woJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgY29kZTogc3RyaW5nKCdSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgZGF0YTogc3RyaW5nKCdSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoJ1JlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBzcmM6IHN0cmluZygnU291cmNlIGFkZHJlc3MnKSxcbiAgICBkc3Q6IHN0cmluZygnRGVzdGluYXRpb24gYWRkcmVzcycpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NCgnTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uJyksXG4gICAgY3JlYXRlZF9hdDogdTMyKCdDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uJyksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKCdOb3QgZGVzY3JpYmVkIGluIHNwZWMnKSxcbiAgICBpaHJfZmVlOiBncmFtcygnVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS4nKSxcbiAgICBmd2RfZmVlOiBncmFtcygnT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuJyksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoJ05vdCBkZXNjcmliZWQgaW4gc3BlYycpLFxuICAgIGJvdW5jZTogYm9vbCgnQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICBib3VuY2VkOiBib29sKCdCb3VuY2VkIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICB2YWx1ZTogZ3JhbXMoJ0ludGVybmFsIG1lc3NhZ2UgbWF5IGJlYXIgc29tZSB2YWx1ZSBpbiBHcmFtcycpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbignSW50ZXJuYWwgbWVzc2FnZSBtYXkgYmVhciBzb21lIHZhbHVlIGluIG90aGVyIGN1cnJlbmNpZXMnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZSgpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cygpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICBsdDogdTY0KCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmcoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoKSxcbiAgICBub3c6IHUzMigpLFxuICAgIG91dG1zZ19jbnQ6IGkzMigpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKCksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cygpLFxuICAgIGluX21zZzogc3RyaW5nKCksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgbmV3X2hhc2g6IHN0cmluZygpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbCgpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZSgpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcygpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKCksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIGdhc191c2VkOiB1NjQoKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKCksXG4gICAgICAgIG1vZGU6IGk4KCksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKCksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMigpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKCksXG4gICAgICAgIHZhbGlkOiBib29sKCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKCksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcygpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKCksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMigpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKCksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZygpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKCkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcygpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woKSxcbiAgICB0dDogc3RyaW5nKCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OCgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZygpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaW5zdGFsbGVkOiBib29sKCksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKCkgPT4gcmVmKHsgRXh0QmxrUmVmIH0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZygpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBpaHJfZmVlOiBncmFtcygpLFxuICAgIHByb29mX2NyZWF0ZWQ6IHN0cmluZygpLFxuICAgIGluX21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICBmd2RfZmVlOiBncmFtcygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgdHJhbnNpdF9mZWU6IGdyYW1zKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHU2NCgpLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGluTXNnID0gKCkgPT4gcmVmKHsgSW5Nc2cgfSk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoKSA9PiByZWYoeyBPdXRNc2cgfSk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJlZ19tY19zZXFubzogdTMyKCksXG4gICAgc3RhcnRfbHQ6IHU2NCgpLFxuICAgIGVuZF9sdDogdTY0KCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbCgpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbCgpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woKSxcbiAgICB3YW50X21lcmdlOiBib29sKCksXG4gICAgbnhfY2NfdXBkYXRlZDogYm9vbCgpLFxuICAgIGZsYWdzOiB1OCgpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMigpLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoKSxcbiAgICBnZW5fdXRpbWU6IHUzMigpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZSgpLFxuICAgIHNwbGl0OiB1MzIoKSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcygpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG59LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVGhpcyBpcyBCbG9jaycsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKCksXG4gICAgZ2xvYmFsX2lkOiB1MzIoKSxcbiAgICB3YW50X3NwbGl0OiBib29sKCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbCgpLFxuICAgIGdlbl91dGltZTogaTMyKCksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoKSxcbiAgICBmbGFnczogdTE2KCksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHZlcnNpb246IHUzMigpLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woKSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbCgpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woKSxcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKCksXG4gICAgc3RhcnRfbHQ6IHU2NCgpLFxuICAgIGVuZF9sdDogdTY0KCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKCksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcygpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcygpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKCksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcygpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKCkpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKCksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZygpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoc3RyaW5nKCkpLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIG5ld19oYXNoOiBzdHJpbmcoKVxuICAgICAgICB9LFxuICAgICAgICB0cl9jb3VudDogaTMyKClcbiAgICB9KSxcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZygpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNigpLFxuICAgICAgICBvbGQ6IHN0cmluZygpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcygpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIHI6IHN0cmluZygpLFxuICAgICAgICAgICAgczogc3RyaW5nKCksXG4gICAgICAgIH0pLFxuICAgIH0sXG59O1xuXG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=