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
  // index
  balance: (0, _qSchema.required)((0, _qSchema.grams)()),
  // index
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi5zY2hlbWEudjIuanMiXSwibmFtZXMiOlsic3RyaW5nIiwiRGVmIiwiYm9vbCIsInJlZiIsImFycmF5T2YiLCJhY2NvdW50U3RhdHVzIiwidW5pbml0IiwiYWN0aXZlIiwiZnJvemVuIiwibm9uRXhpc3QiLCJhY2NvdW50U3RhdHVzQ2hhbmdlIiwidW5jaGFuZ2VkIiwiZGVsZXRlZCIsInNraXBSZWFzb24iLCJub1N0YXRlIiwiYmFkU3RhdGUiLCJub0dhcyIsImFjY291bnRUeXBlIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwibXNnIiwidHJhbnNhY3Rpb24iLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwiZG9jIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJzY2hlbWEiLCJfY2xhc3MiLCJ0eXBlcyIsIk90aGVyQ3VycmVuY3kiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFrQkE7O0FBRUE7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TUFBQUEsV0FBVyxFQUFYQSxXQUhHO0FBSUhNLE1BQUFBLEtBQUssRUFBTEEsS0FKRztBQUtIUyxNQUFBQSxNQUFNLEVBQU5BLE1BTEc7QUFNSDdHLE1BQUFBLE9BQU8sRUFBUEEsT0FORztBQU9IcUksTUFBQUEsS0FBSyxFQUFMQSxLQVBHO0FBUUhySixNQUFBQSxPQUFPLEVBQVBBLE9BUkc7QUFTSGlDLE1BQUFBLFdBQVcsRUFBWEE7QUFURztBQURIO0FBRFksQ0FBeEI7ZUFnQmV3SyxNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB7IERlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvZGlzdC9zcmMvc2NoZW1hJztcbmltcG9ydCB0eXBlIHsgVHlwZURlZiB9IGZyb20gJ3Rvbi1sYWJzLWRldi1vcHMvc3JjL3NjaGVtYSc7XG5pbXBvcnQge1xuICAgIGdyYW1zLFxuICAgIGkzMixcbiAgICBpOCxcbiAgICBqb2luLFxuICAgIE90aGVyQ3VycmVuY3ksXG4gICAgb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgcmVxdWlyZWQsXG4gICAgdTE2LFxuICAgIHUzMixcbiAgICB1NjQsXG4gICAgdTgsXG4gICAgdThlbnVtLFxuICAgIHdpdGhEb2Ncbn0gZnJvbSBcIi4vcS1zY2hlbWFcIjtcblxuY29uc3QgeyBzdHJpbmcsIGJvb2wsIHJlZiwgYXJyYXlPZiB9ID0gRGVmO1xuXG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBBY2NvdW50JyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcbiAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFR5cGUoJ0N1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50JykpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKCdDb250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnQgY29sbGVjdGVkICh1c3VhbGx5IHRoaXMgaXMgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCB0cmFuc2FjdGlvbiksIG9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbiknKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKCdJZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gb3RoZXIgY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWNjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuJyksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKCkpLCAvLyBpbmRleFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgc3BsaXRfZGVwdGg6IHU4KCdJcyBwcmVzZW50IGFuZCBub24temVybyBvbmx5IGluIGluc3RhbmNlcyBvZiBsYXJnZSBzbWFydCBjb250cmFjdHMuJyksXG4gICAgdGljazogYm9vbCgnTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi4nKSxcbiAgICB0b2NrOiBib29sKCdNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLicpLFxuICAgIGNvZGU6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0JyksXG4gICAgZGF0YTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBkYXRhIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQnKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIGxpYnJhcnkgY29kZSB1c2VkIGluIHNtYXJ0LWNvbnRyYWN0JyksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gTWVzc2FnZScsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKCdNZXNzYWdlIHR5cGUnKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cygnSW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMnKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZygnQmxvY2sgdG8gd2hpY2ggdGhpcyBtZXNzYWdlIGJlbG9uZ3MnKSksXG4gICAgYm9keTogc3RyaW5nKCcnKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgdGljazogYm9vbCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICB0b2NrOiBib29sKCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIGNvZGU6IHN0cmluZygnUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcycpLFxuICAgIGRhdGE6IHN0cmluZygnUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgbGlicmFyeTogc3RyaW5nKCdSZXByZXNlbnRzIGNvbnRyYWN0IGxpYnJhcnkgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgc3JjOiBzdHJpbmcoJ1NvdXJjZSBhZGRyZXNzJyksXG4gICAgZHN0OiBzdHJpbmcoJ0Rlc3RpbmF0aW9uIGFkZHJlc3MnKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoJ0xvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbicpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMignQ3JlYXRpb24gdW5peHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uIFRoZSBjcmVhdGlvbiB1bml4dGltZSBlcXVhbHMgdGhlIGNyZWF0aW9uIHVuaXh0aW1lIG9mIHRoZSBibG9jayBjb250YWluaW5nIHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLicpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbCgnTm90IGRlc2NyaWJlZCBpbiBzcGVjJyksXG4gICAgaWhyX2ZlZTogZ3JhbXMoJ1RoaXMgdmFsdWUgaXMgc3VidHJhY3RlZCBmcm9tIHRoZSB2YWx1ZSBhdHRhY2hlZCB0byB0aGUgbWVzc2FnZSBhbmQgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycyBvZiB0aGUgZGVzdGluYXRpb24gc2hhcmRjaGFpbiBpZiB0aGV5IGluY2x1ZGUgdGhlIG1lc3NhZ2UgYnkgdGhlIElIUiBtZWNoYW5pc20uJyksXG4gICAgZndkX2ZlZTogZ3JhbXMoJ09yaWdpbmFsIHRvdGFsIGZvcndhcmRpbmcgZmVlIHBhaWQgZm9yIHVzaW5nIHRoZSBIUiBtZWNoYW5pc207IGl0IGlzIGF1dG9tYXRpY2FsbHkgY29tcHV0ZWQgZnJvbSBzb21lIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyBhbmQgdGhlIHNpemUgb2YgdGhlIG1lc3NhZ2UgYXQgdGhlIHRpbWUgdGhlIG1lc3NhZ2UgaXMgZ2VuZXJhdGVkLicpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKCdOb3QgZGVzY3JpYmVkIGluIHNwZWMnKSxcbiAgICBib3VuY2U6IGJvb2woJ0JvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuJyksXG4gICAgYm91bmNlZDogYm9vbCgnQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuJyksXG4gICAgdmFsdWU6IGdyYW1zKCdJbnRlcm5hbCBtZXNzYWdlIG1heSBiZWFyIHNvbWUgdmFsdWUgaW4gR3JhbXMnKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oJ0ludGVybmFsIG1lc3NhZ2UgbWF5IGJlYXIgc29tZSB2YWx1ZSBpbiBvdGhlciBjdXJyZW5jaWVzJyksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG5cbmNvbnN0IFRyYW5zYWN0aW9uOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoKSksXG4gICAgYmxvY2tfaWQ6IHN0cmluZygpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKCksXG4gICAgbHQ6IHU2NCgpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nKCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KCksXG4gICAgbm93OiB1MzIoKSxcbiAgICBvdXRtc2dfY250OiBpMzIoKSxcbiAgICBvcmlnX3N0YXR1czogYWNjb3VudFN0YXR1cygpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoKSxcbiAgICBpbl9tc2c6IHN0cmluZygpLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oeyBNZXNzYWdlIH0sICdpbl9tc2cnKSxcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmcoKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcygpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgIG5ld19oYXNoOiBzdHJpbmcoKSxcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woKSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKCksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoKSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKCkpLFxuICAgICAgICBza2lwcGVkX3JlYXNvbjogc2tpcFJlYXNvbigpLFxuICAgICAgICBzdWNjZXNzOiBib29sKCksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcygpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KCksXG4gICAgICAgIGdhc19jcmVkaXQ6IGkzMigpLFxuICAgICAgICBtb2RlOiBpOCgpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMigpLFxuICAgICAgICBleGl0X2FyZzogaTMyKCksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc3RyaW5nKCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbCgpLFxuICAgICAgICB2YWxpZDogYm9vbCgpLFxuICAgICAgICBub19mdW5kczogYm9vbCgpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKCksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcygpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoKSxcbiAgICAgICAgcmVzdWx0X2NvZGU6IGkzMigpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoKSxcbiAgICAgICAgdG90X2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMigpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMigpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoKSxcbiAgICB9LFxuICAgIGJvdW5jZToge1xuICAgICAgICBib3VuY2VfdHlwZTogcmVxdWlyZWQoYm91bmNlVHlwZSgpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMigpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcygpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgfSxcbiAgICBhYm9ydGVkOiBib29sKCksXG4gICAgZGVzdHJveWVkOiBib29sKCksXG4gICAgdHQ6IHN0cmluZygpLFxuICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KCksXG4gICAgICAgIGFjY19zcGxpdF9kZXB0aDogdTgoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGluc3RhbGxlZDogYm9vbCgpLFxuICAgIHByb29mOiBzdHJpbmcoKSxcbiAgICBib2M6IHN0cmluZygpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9ICgpID0+IHJlZih7IEV4dEJsa1JlZiB9KTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiB1NjQoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9ICgpID0+IHJlZih7IEluTXNnIH0pO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKCkgPT4gcmVmKHsgT3V0TXNnIH0pO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woKSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woKSxcbiAgICB3YW50X3NwbGl0OiBib29sKCksXG4gICAgd2FudF9tZXJnZTogYm9vbCgpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woKSxcbiAgICBmbGFnczogdTgoKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKCksXG4gICAgZ2VuX3V0aW1lOiB1MzIoKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoKSxcbiAgICBzcGxpdDogdTMyKCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxufSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cygpLFxuICAgIGdsb2JhbF9pZDogdTMyKCksXG4gICAgd2FudF9zcGxpdDogYm9vbCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woKSxcbiAgICBnZW5fdXRpbWU6IGkzMigpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKCksXG4gICAgZmxhZ3M6IHUxNigpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoKSxcbiAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woKSxcbiAgICB3YW50X21lcmdlOiBib29sKCksXG4gICAgdmVydF9zZXFfbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgc2hhcmQ6IHN0cmluZygpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMigpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKCksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcygpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZygpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZygpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKCkpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICBuZXdfaGFzaDogc3RyaW5nKClcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGkzMigpXG4gICAgfSksXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNigpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZygpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKCksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKCksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKCksXG4gICAgICAgICAgICByOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIHM6IHN0cmluZygpLFxuICAgICAgICB9KSxcbiAgICB9LFxufTtcblxuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19