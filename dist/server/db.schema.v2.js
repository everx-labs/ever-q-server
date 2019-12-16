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
  },
  signatures: (0, _qSchema.join)({
    BlockSignatures: BlockSignatures
  }, 'id')
};
var BlockSignatures = {
  _doc: 'Set of validator\'s signstures for the Block with cerrespond id',
  _: {
    collection: 'blocks_signatures'
  },
  signatures: arrayOf({
    node_id: string("Validator ID"),
    r: string("'R' part of signature"),
    s: string("'s' part of signature")
  }, "Array of signatures from block's validators")
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
      Transaction: Transaction,
      BlockSignatures: BlockSignatures
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi5zY2hlbWEudjIuanMiXSwibmFtZXMiOlsic3RyaW5nIiwiRGVmIiwiYm9vbCIsInJlZiIsImFycmF5T2YiLCJhY2NvdW50U3RhdHVzIiwidW5pbml0IiwiYWN0aXZlIiwiZnJvemVuIiwibm9uRXhpc3QiLCJhY2NvdW50U3RhdHVzQ2hhbmdlIiwidW5jaGFuZ2VkIiwiZGVsZXRlZCIsInNraXBSZWFzb24iLCJub1N0YXRlIiwiYmFkU3RhdGUiLCJub0dhcyIsImFjY291bnRUeXBlIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiX2RvYyIsIl8iLCJjb2xsZWN0aW9uIiwiYWNjX3R5cGUiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwiYmFsYW5jZV9vdGhlciIsInNwbGl0X2RlcHRoIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJNZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwiVHJhbnNhY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJleHRCbGtSZWYiLCJNc2dFbnZlbG9wZSIsIm1zZ19pZCIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJtc2dFbnZlbG9wZSIsIkluTXNnIiwibXNnIiwidHJhbnNhY3Rpb24iLCJwcm9vZl9jcmVhdGVkIiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwidHJhbnNhY3Rpb25faWQiLCJwcm9vZl9kZWxpdmVyZWQiLCJpbk1zZyIsIk91dE1zZyIsInJlaW1wb3J0IiwiaW1wb3J0ZWQiLCJpbXBvcnRfYmxvY2tfbHQiLCJvdXRNc2ciLCJzaGFyZERlc2NyIiwiZG9jIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJ3b3JrY2hhaW5faWQiLCJzaGFyZCIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJzaWduYXR1cmVzIiwiQmxvY2tTaWduYXR1cmVzIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JBOztBQUVBOztBQXBCQTs7Ozs7Ozs7Ozs7Ozs7O0lBb0NRQSxNLEdBQStCQyxXLENBQS9CRCxNO0lBQVFFLEksR0FBdUJELFcsQ0FBdkJDLEk7SUFBTUMsRyxHQUFpQkYsVyxDQUFqQkUsRztJQUFLQyxPLEdBQVlILFcsQ0FBWkcsTztBQUczQixJQUFNQyxhQUFhLEdBQUcscUJBQU8sZUFBUCxFQUF3QjtBQUMxQ0MsRUFBQUEsTUFBTSxFQUFFLENBRGtDO0FBRTFDQyxFQUFBQSxNQUFNLEVBQUUsQ0FGa0M7QUFHMUNDLEVBQUFBLE1BQU0sRUFBRSxDQUhrQztBQUkxQ0MsRUFBQUEsUUFBUSxFQUFFO0FBSmdDLENBQXhCLENBQXRCO0FBT0EsSUFBTUMsbUJBQW1CLEdBQUcscUJBQU8scUJBQVAsRUFBOEI7QUFDdERDLEVBQUFBLFNBQVMsRUFBRSxDQUQyQztBQUV0REgsRUFBQUEsTUFBTSxFQUFFLENBRjhDO0FBR3RESSxFQUFBQSxPQUFPLEVBQUU7QUFINkMsQ0FBOUIsQ0FBNUI7QUFNQSxJQUFNQyxVQUFVLEdBQUcscUJBQU8sWUFBUCxFQUFxQjtBQUNwQ0MsRUFBQUEsT0FBTyxFQUFFLENBRDJCO0FBRXBDQyxFQUFBQSxRQUFRLEVBQUUsQ0FGMEI7QUFHcENDLEVBQUFBLEtBQUssRUFBRTtBQUg2QixDQUFyQixDQUFuQjtBQU9BLElBQU1DLFdBQVcsR0FBRyxxQkFBTyxhQUFQLEVBQXNCO0FBQ3RDWCxFQUFBQSxNQUFNLEVBQUUsQ0FEOEI7QUFFdENDLEVBQUFBLE1BQU0sRUFBRSxDQUY4QjtBQUd0Q0MsRUFBQUEsTUFBTSxFQUFFO0FBSDhCLENBQXRCLENBQXBCO0FBTUEsSUFBTVUsV0FBVyxHQUFHLHFCQUFPLGFBQVAsRUFBc0I7QUFDdENDLEVBQUFBLFFBQVEsRUFBRSxDQUQ0QjtBQUV0Q0MsRUFBQUEsS0FBSyxFQUFFLENBRitCO0FBR3RDQyxFQUFBQSxNQUFNLEVBQUU7QUFIOEIsQ0FBdEIsQ0FBcEI7QUFPQSxJQUFNQyx1QkFBdUIsR0FBRyxxQkFBTyx5QkFBUCxFQUFrQztBQUM5REMsRUFBQUEsT0FBTyxFQUFFLENBRHFEO0FBRTlEQyxFQUFBQSxNQUFNLEVBQUUsQ0FGc0Q7QUFHOURDLEVBQUFBLFVBQVUsRUFBRSxDQUhrRDtBQUk5REMsRUFBQUEsV0FBVyxFQUFFLENBSmlEO0FBSzlEQyxFQUFBQSxRQUFRLEVBQUUsQ0FMb0Q7QUFNOURDLEVBQUFBLFNBQVMsRUFBRSxDQU5tRDtBQU85REMsRUFBQUEsT0FBTyxFQUFFLENBUHFEO0FBUTlEQyxFQUFBQSxVQUFVLEVBQUU7QUFSa0QsQ0FBbEMsQ0FBaEM7QUFXQSxJQUFNQyxlQUFlLEdBQUcscUJBQU8saUJBQVAsRUFBMEI7QUFDOUNDLEVBQUFBLFFBQVEsRUFBRSxDQURvQztBQUU5Q0MsRUFBQUEsT0FBTyxFQUFFLENBRnFDO0FBRzlDQyxFQUFBQSxJQUFJLEVBQUUsQ0FId0M7QUFJOUNDLEVBQUFBLElBQUksRUFBRSxDQUp3QztBQUs5Q0MsRUFBQUEsWUFBWSxFQUFFLENBTGdDO0FBTTlDQyxFQUFBQSxZQUFZLEVBQUUsQ0FOZ0M7QUFPOUNDLEVBQUFBLFlBQVksRUFBRSxDQVBnQztBQVE5Q0MsRUFBQUEsWUFBWSxFQUFFO0FBUmdDLENBQTFCLENBQXhCO0FBV0EsSUFBTUMsMkJBQTJCLEdBQUcscUJBQU8sNkJBQVAsRUFBc0M7QUFDdEVqQixFQUFBQSxPQUFPLEVBQUUsQ0FENkQ7QUFFdEVHLEVBQUFBLFdBQVcsRUFBRSxDQUZ5RDtBQUd0RUMsRUFBQUEsUUFBUSxFQUFFLENBSDREO0FBSXRFQyxFQUFBQSxTQUFTLEVBQUUsQ0FKMkQ7QUFLdEVDLEVBQUFBLE9BQU8sRUFBRTtBQUw2RCxDQUF0QyxDQUFwQztBQVFBLElBQU1ZLFdBQVcsR0FBRyxxQkFBTyxhQUFQLEVBQXNCO0FBQ3RDQyxFQUFBQSxPQUFPLEVBQUUsQ0FENkI7QUFFdENDLEVBQUFBLEVBQUUsRUFBRTtBQUZrQyxDQUF0QixDQUFwQjtBQUtBLElBQU1DLFVBQVUsR0FBRyxxQkFBTyxZQUFQLEVBQXFCO0FBQ3BDQyxFQUFBQSxRQUFRLEVBQUUsQ0FEMEI7QUFFcENDLEVBQUFBLE9BQU8sRUFBRSxDQUYyQjtBQUdwQ0MsRUFBQUEsRUFBRSxFQUFFO0FBSGdDLENBQXJCLENBQW5CO0FBTUEsSUFBTUMscUJBQXFCLEdBQUcscUJBQU8sdUJBQVAsRUFBZ0M7QUFDMUR6QixFQUFBQSxPQUFPLEVBQUUsQ0FEaUQ7QUFFMURJLEVBQUFBLFFBQVEsRUFBRSxDQUZnRDtBQUcxREMsRUFBQUEsU0FBUyxFQUFFLENBSCtDO0FBSTFEQyxFQUFBQSxPQUFPLEVBQUU7QUFKaUQsQ0FBaEMsQ0FBOUI7QUFRQSxJQUFNb0IsU0FBUyxHQUFHLHFCQUFPLFdBQVAsRUFBb0I7QUFDbENDLEVBQUFBLFFBQVEsRUFBRSxDQUR3QjtBQUVsQ0MsRUFBQUEsR0FBRyxFQUFFLENBRjZCO0FBR2xDQyxFQUFBQSxXQUFXLEVBQUUsQ0FIcUI7QUFJbEMsV0FBTyxDQUoyQjtBQUtsQ0MsRUFBQUEsT0FBTyxFQUFFLENBTHlCO0FBTWxDQyxFQUFBQSxjQUFjLEVBQUUsQ0FOa0I7QUFPbENDLEVBQUFBLGdCQUFnQixFQUFFO0FBUGdCLENBQXBCLENBQWxCO0FBVUEsSUFBTUMsVUFBVSxHQUFHLHFCQUFPLFlBQVAsRUFBcUI7QUFDcENOLEVBQUFBLFFBQVEsRUFBRSxDQUQwQjtBQUVwQ0UsRUFBQUEsV0FBVyxFQUFFLENBRnVCO0FBR3BDSyxFQUFBQSxTQUFTLEVBQUUsQ0FIeUI7QUFJcENKLEVBQUFBLE9BQU8sRUFBRSxDQUoyQjtBQUtwQ0ssRUFBQUEsa0JBQWtCLEVBQUUsQ0FMZ0I7QUFNcENDLEVBQUFBLE9BQU8sRUFBRSxDQU4yQjtBQU9wQ0MsRUFBQUEsZUFBZSxFQUFFLENBUG1CO0FBUXBDQyxFQUFBQSxJQUFJLEVBQUUsQ0FBQztBQVI2QixDQUFyQixDQUFuQjtBQVdBLElBQU1DLFNBQVMsR0FBRyxxQkFBTyxXQUFQLEVBQW9CO0FBQ2xDRCxFQUFBQSxJQUFJLEVBQUUsQ0FENEI7QUFFbENFLEVBQUFBLEtBQUssRUFBRSxDQUYyQjtBQUdsQ0MsRUFBQUEsS0FBSyxFQUFFO0FBSDJCLENBQXBCLENBQWxCO0FBTUEsSUFBTUMsT0FBZ0IsR0FBRztBQUNyQkMsRUFBQUEsSUFBSSxFQUFFLGFBRGU7QUFFckJDLEVBQUFBLENBQUMsRUFBRTtBQUFFQyxJQUFBQSxVQUFVLEVBQUU7QUFBZCxHQUZrQjtBQUdyQkMsRUFBQUEsUUFBUSxFQUFFLHVCQUFTcEQsV0FBVyxDQUFDLCtCQUFELENBQXBCLENBSFc7QUFJckJxRCxFQUFBQSxTQUFTLEVBQUUsdUJBQVMsa0JBQUksaU5BQUosQ0FBVCxDQUpVO0FBS3JCQyxFQUFBQSxXQUFXLEVBQUUsb0JBQU0sMmZBQU4sQ0FMUTtBQU1yQkMsRUFBQUEsYUFBYSxFQUFFLHVCQUFTLG1CQUFULENBTk07QUFPckJDLEVBQUFBLE9BQU8sRUFBRSx1QkFBUyxxQkFBVCxDQVBZO0FBUXJCQyxFQUFBQSxhQUFhLEVBQUUsdUNBUk07QUFTckJDLEVBQUFBLFdBQVcsRUFBRSxpQkFBRyxxRUFBSCxDQVRRO0FBVXJCekMsRUFBQUEsSUFBSSxFQUFFaEMsSUFBSSxDQUFDLHdKQUFELENBVlc7QUFXckJpQyxFQUFBQSxJQUFJLEVBQUVqQyxJQUFJLENBQUMsd0pBQUQsQ0FYVztBQVlyQjBFLEVBQUFBLElBQUksRUFBRTVFLE1BQU0sQ0FBQyxpRUFBRCxDQVpTO0FBYXJCNkUsRUFBQUEsSUFBSSxFQUFFN0UsTUFBTSxDQUFDLGlFQUFELENBYlM7QUFjckI4RSxFQUFBQSxPQUFPLEVBQUU5RSxNQUFNLENBQUMsMERBQUQsQ0FkTTtBQWVyQitFLEVBQUFBLEtBQUssRUFBRS9FLE1BQU0sRUFmUTtBQWdCckJnRixFQUFBQSxHQUFHLEVBQUVoRixNQUFNO0FBaEJVLENBQXpCO0FBbUJBLElBQU1pRixPQUFnQixHQUFHO0FBQ3JCZixFQUFBQSxJQUFJLEVBQUUsYUFEZTtBQUVyQkMsRUFBQUEsQ0FBQyxFQUFFO0FBQUVDLElBQUFBLFVBQVUsRUFBRTtBQUFkLEdBRmtCO0FBR3JCYyxFQUFBQSxRQUFRLEVBQUUsdUJBQVNoRSxXQUFXLENBQUMsY0FBRCxDQUFwQixDQUhXO0FBSXJCaUUsRUFBQUEsTUFBTSxFQUFFLHVCQUFTN0QsdUJBQXVCLENBQUMsNEJBQUQsQ0FBaEMsQ0FKYTtBQUtyQjhELEVBQUFBLFFBQVEsRUFBRSx1QkFBU3BGLE1BQU0sQ0FBQyxxQ0FBRCxDQUFmLENBTFc7QUFNckJxRixFQUFBQSxJQUFJLEVBQUVyRixNQUFNLENBQUMsRUFBRCxDQU5TO0FBT3JCMkUsRUFBQUEsV0FBVyxFQUFFLGlCQUFHLDZEQUFILENBUFE7QUFRckJ6QyxFQUFBQSxJQUFJLEVBQUVoQyxJQUFJLENBQUMsNkRBQUQsQ0FSVztBQVNyQmlDLEVBQUFBLElBQUksRUFBRWpDLElBQUksQ0FBQyw2REFBRCxDQVRXO0FBVXJCMEUsRUFBQUEsSUFBSSxFQUFFNUUsTUFBTSxDQUFDLDZDQUFELENBVlM7QUFXckI2RSxFQUFBQSxJQUFJLEVBQUU3RSxNQUFNLENBQUMsMkRBQUQsQ0FYUztBQVlyQjhFLEVBQUFBLE9BQU8sRUFBRTlFLE1BQU0sQ0FBQyxnREFBRCxDQVpNO0FBYXJCc0YsRUFBQUEsR0FBRyxFQUFFdEYsTUFBTSxDQUFDLGdCQUFELENBYlU7QUFjckJ1RixFQUFBQSxHQUFHLEVBQUV2RixNQUFNLENBQUMscUJBQUQsQ0FkVTtBQWVyQndGLEVBQUFBLFVBQVUsRUFBRSxrQkFBSSx1RUFBSixDQWZTO0FBZ0JyQkMsRUFBQUEsVUFBVSxFQUFFLGtCQUFJLDJLQUFKLENBaEJTO0FBaUJyQkMsRUFBQUEsWUFBWSxFQUFFeEYsSUFBSSxDQUFDLHVCQUFELENBakJHO0FBa0JyQnlGLEVBQUFBLE9BQU8sRUFBRSxvQkFBTSwrS0FBTixDQWxCWTtBQW1CckJDLEVBQUFBLE9BQU8sRUFBRSxvQkFBTSxrTUFBTixDQW5CWTtBQW9CckJDLEVBQUFBLFVBQVUsRUFBRSxvQkFBTSx1QkFBTixDQXBCUztBQXFCckJDLEVBQUFBLE1BQU0sRUFBRTVGLElBQUksQ0FBQyw4TkFBRCxDQXJCUztBQXNCckI2RixFQUFBQSxPQUFPLEVBQUU3RixJQUFJLENBQUMsK05BQUQsQ0F0QlE7QUF1QnJCOEYsRUFBQUEsS0FBSyxFQUFFLG9CQUFNLCtDQUFOLENBdkJjO0FBd0JyQkMsRUFBQUEsV0FBVyxFQUFFLHNDQUF3QiwwREFBeEIsQ0F4QlE7QUF5QnJCbEIsRUFBQUEsS0FBSyxFQUFFL0UsTUFBTSxFQXpCUTtBQTBCckJnRixFQUFBQSxHQUFHLEVBQUVoRixNQUFNO0FBMUJVLENBQXpCO0FBOEJBLElBQU1rRyxXQUFvQixHQUFHO0FBQ3pCaEMsRUFBQUEsSUFBSSxFQUFFLGlCQURtQjtBQUV6QkMsRUFBQUEsQ0FBQyxFQUFFO0FBQUVDLElBQUFBLFVBQVUsRUFBRTtBQUFkLEdBRnNCO0FBR3pCK0IsRUFBQUEsT0FBTyxFQUFFLHVCQUFTcEUsZUFBZSxFQUF4QixDQUhnQjtBQUl6Qm9ELEVBQUFBLE1BQU0sRUFBRSx1QkFBUzNDLDJCQUEyQixFQUFwQyxDQUppQjtBQUt6QjRDLEVBQUFBLFFBQVEsRUFBRXBGLE1BQU0sRUFMUztBQU16Qm9HLEVBQUFBLFlBQVksRUFBRXBHLE1BQU0sRUFOSztBQU96QnFHLEVBQUFBLEVBQUUsRUFBRSxtQkFQcUI7QUFRekJDLEVBQUFBLGVBQWUsRUFBRXRHLE1BQU0sRUFSRTtBQVN6QnVHLEVBQUFBLGFBQWEsRUFBRSxtQkFUVTtBQVV6QkMsRUFBQUEsR0FBRyxFQUFFLG1CQVZvQjtBQVd6QkMsRUFBQUEsVUFBVSxFQUFFLG1CQVhhO0FBWXpCQyxFQUFBQSxXQUFXLEVBQUVyRyxhQUFhLEVBWkQ7QUFhekJzRyxFQUFBQSxVQUFVLEVBQUV0RyxhQUFhLEVBYkE7QUFjekJ1RyxFQUFBQSxNQUFNLEVBQUU1RyxNQUFNLEVBZFc7QUFlekI2RyxFQUFBQSxVQUFVLEVBQUUsbUJBQUs7QUFBRTVCLElBQUFBLE9BQU8sRUFBUEE7QUFBRixHQUFMLEVBQWtCLFFBQWxCLENBZmE7QUFnQnpCNkIsRUFBQUEsUUFBUSxFQUFFMUcsT0FBTyxDQUFDSixNQUFNLEVBQVAsQ0FoQlE7QUFpQnpCK0csRUFBQUEsWUFBWSxFQUFFM0csT0FBTyxDQUFDLG1CQUFLO0FBQUU2RSxJQUFBQSxPQUFPLEVBQVBBO0FBQUYsR0FBTCxFQUFrQixVQUFsQixDQUFELENBakJJO0FBa0J6QitCLEVBQUFBLFVBQVUsRUFBRSxxQkFsQmE7QUFtQnpCQyxFQUFBQSxnQkFBZ0IsRUFBRSx1Q0FuQk87QUFvQnpCQyxFQUFBQSxRQUFRLEVBQUVsSCxNQUFNLEVBcEJTO0FBcUJ6Qm1ILEVBQUFBLFFBQVEsRUFBRW5ILE1BQU0sRUFyQlM7QUFzQnpCb0gsRUFBQUEsWUFBWSxFQUFFbEgsSUFBSSxFQXRCTztBQXVCekIrQixFQUFBQSxPQUFPLEVBQUU7QUFDTG9GLElBQUFBLHNCQUFzQixFQUFFLHFCQURuQjtBQUVMQyxJQUFBQSxnQkFBZ0IsRUFBRSxxQkFGYjtBQUdMQyxJQUFBQSxhQUFhLEVBQUU3RyxtQkFBbUI7QUFIN0IsR0F2QmdCO0FBNEJ6QjhHLEVBQUFBLE1BQU0sRUFBRTtBQUNKQyxJQUFBQSxrQkFBa0IsRUFBRSxxQkFEaEI7QUFFSkQsSUFBQUEsTUFBTSxFQUFFLHFCQUZKO0FBR0pFLElBQUFBLFlBQVksRUFBRTtBQUhWLEdBNUJpQjtBQWlDekJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxZQUFZLEVBQUUsdUJBQVNuRixXQUFXLEVBQXBCLENBRFQ7QUFFTG9GLElBQUFBLGNBQWMsRUFBRWhILFVBQVUsRUFGckI7QUFHTGlILElBQUFBLE9BQU8sRUFBRTVILElBQUksRUFIUjtBQUlMNkgsSUFBQUEsY0FBYyxFQUFFN0gsSUFBSSxFQUpmO0FBS0w4SCxJQUFBQSxpQkFBaUIsRUFBRTlILElBQUksRUFMbEI7QUFNTCtILElBQUFBLFFBQVEsRUFBRSxxQkFOTDtBQU9MQyxJQUFBQSxRQUFRLEVBQUUsbUJBUEw7QUFRTEMsSUFBQUEsU0FBUyxFQUFFLG1CQVJOO0FBU0xDLElBQUFBLFVBQVUsRUFBRSxtQkFUUDtBQVVMQyxJQUFBQSxJQUFJLEVBQUUsa0JBVkQ7QUFXTEMsSUFBQUEsU0FBUyxFQUFFLG1CQVhOO0FBWUxDLElBQUFBLFFBQVEsRUFBRSxtQkFaTDtBQWFMQyxJQUFBQSxRQUFRLEVBQUUsbUJBYkw7QUFjTEMsSUFBQUEsa0JBQWtCLEVBQUV6SSxNQUFNLEVBZHJCO0FBZUwwSSxJQUFBQSxtQkFBbUIsRUFBRTFJLE1BQU07QUFmdEIsR0FqQ2dCO0FBa0R6QjJJLEVBQUFBLE1BQU0sRUFBRTtBQUNKYixJQUFBQSxPQUFPLEVBQUU1SCxJQUFJLEVBRFQ7QUFFSjBJLElBQUFBLEtBQUssRUFBRTFJLElBQUksRUFGUDtBQUdKMkksSUFBQUEsUUFBUSxFQUFFM0ksSUFBSSxFQUhWO0FBSUpxSCxJQUFBQSxhQUFhLEVBQUU3RyxtQkFBbUIsRUFKOUI7QUFLSm9JLElBQUFBLGNBQWMsRUFBRSxxQkFMWjtBQU1KQyxJQUFBQSxpQkFBaUIsRUFBRSxxQkFOZjtBQU9KQyxJQUFBQSxXQUFXLEVBQUUsbUJBUFQ7QUFRSkMsSUFBQUEsVUFBVSxFQUFFLG1CQVJSO0FBU0pDLElBQUFBLFdBQVcsRUFBRSxtQkFUVDtBQVVKQyxJQUFBQSxZQUFZLEVBQUUsbUJBVlY7QUFXSkMsSUFBQUEsZUFBZSxFQUFFLG1CQVhiO0FBWUpDLElBQUFBLFlBQVksRUFBRSxtQkFaVjtBQWFKQyxJQUFBQSxnQkFBZ0IsRUFBRXRKLE1BQU0sRUFicEI7QUFjSnVKLElBQUFBLG9CQUFvQixFQUFFLG1CQWRsQjtBQWVKQyxJQUFBQSxtQkFBbUIsRUFBRTtBQWZqQixHQWxEaUI7QUFtRXpCMUQsRUFBQUEsTUFBTSxFQUFFO0FBQ0oyRCxJQUFBQSxXQUFXLEVBQUUsdUJBQVM3RyxVQUFVLEVBQW5CLENBRFQ7QUFFSjhHLElBQUFBLGNBQWMsRUFBRSxtQkFGWjtBQUdKQyxJQUFBQSxhQUFhLEVBQUUsbUJBSFg7QUFJSkMsSUFBQUEsWUFBWSxFQUFFLHFCQUpWO0FBS0pDLElBQUFBLFFBQVEsRUFBRSxxQkFMTjtBQU1KQyxJQUFBQSxRQUFRLEVBQUU7QUFOTixHQW5FaUI7QUEyRXpCQyxFQUFBQSxPQUFPLEVBQUU3SixJQUFJLEVBM0VZO0FBNEV6QjhKLEVBQUFBLFNBQVMsRUFBRTlKLElBQUksRUE1RVU7QUE2RXpCK0osRUFBQUEsRUFBRSxFQUFFakssTUFBTSxFQTdFZTtBQThFekJrSyxFQUFBQSxVQUFVLEVBQUU7QUFDUkMsSUFBQUEsaUJBQWlCLEVBQUUsa0JBRFg7QUFFUkMsSUFBQUEsZUFBZSxFQUFFLGtCQUZUO0FBR1JDLElBQUFBLFNBQVMsRUFBRXJLLE1BQU0sRUFIVDtBQUlSc0ssSUFBQUEsWUFBWSxFQUFFdEssTUFBTTtBQUpaLEdBOUVhO0FBb0Z6QnVLLEVBQUFBLG1CQUFtQixFQUFFdkssTUFBTSxFQXBGRjtBQXFGekJ3SyxFQUFBQSxTQUFTLEVBQUV0SyxJQUFJLEVBckZVO0FBc0Z6QjZFLEVBQUFBLEtBQUssRUFBRS9FLE1BQU0sRUF0Rlk7QUF1RnpCZ0YsRUFBQUEsR0FBRyxFQUFFaEYsTUFBTTtBQXZGYyxDQUE3QixDLENBMEZBOztBQUVBLElBQU15SyxTQUFrQixHQUFHO0FBQ3ZCQyxFQUFBQSxNQUFNLEVBQUUsbUJBRGU7QUFFdkJDLEVBQUFBLE1BQU0sRUFBRSxtQkFGZTtBQUd2QkMsRUFBQUEsU0FBUyxFQUFFNUssTUFBTSxFQUhNO0FBSXZCNkssRUFBQUEsU0FBUyxFQUFFN0ssTUFBTTtBQUpNLENBQTNCOztBQU9BLElBQU04SyxTQUFTLEdBQUcsU0FBWkEsU0FBWTtBQUFBLFNBQU0zSyxHQUFHLENBQUM7QUFBRXNLLElBQUFBLFNBQVMsRUFBVEE7QUFBRixHQUFELENBQVQ7QUFBQSxDQUFsQjs7QUFFQSxJQUFNTSxXQUFvQixHQUFHO0FBQ3pCQyxFQUFBQSxNQUFNLEVBQUVoTCxNQUFNLEVBRFc7QUFFekJpTCxFQUFBQSxTQUFTLEVBQUVqTCxNQUFNLEVBRlE7QUFHekJrTCxFQUFBQSxRQUFRLEVBQUVsTCxNQUFNLEVBSFM7QUFJekJtTCxFQUFBQSxpQkFBaUIsRUFBRTtBQUpNLENBQTdCOztBQU9BLElBQU1DLFdBQVcsR0FBRyxTQUFkQSxXQUFjO0FBQUEsU0FBTWpMLEdBQUcsQ0FBQztBQUFFNEssSUFBQUEsV0FBVyxFQUFYQTtBQUFGLEdBQUQsQ0FBVDtBQUFBLENBQXBCOztBQUVBLElBQU1NLEtBQWMsR0FBRztBQUNuQm5HLEVBQUFBLFFBQVEsRUFBRSx1QkFBU2pDLFNBQVMsRUFBbEIsQ0FEUztBQUVuQnFJLEVBQUFBLEdBQUcsRUFBRXRMLE1BQU0sRUFGUTtBQUduQnVMLEVBQUFBLFdBQVcsRUFBRXZMLE1BQU0sRUFIQTtBQUluQjJGLEVBQUFBLE9BQU8sRUFBRSxxQkFKVTtBQUtuQjZGLEVBQUFBLGFBQWEsRUFBRXhMLE1BQU0sRUFMRjtBQU1uQjRHLEVBQUFBLE1BQU0sRUFBRXdFLFdBQVcsRUFOQTtBQU9uQnhGLEVBQUFBLE9BQU8sRUFBRSxxQkFQVTtBQVFuQjZGLEVBQUFBLE9BQU8sRUFBRUwsV0FBVyxFQVJEO0FBU25CTSxFQUFBQSxXQUFXLEVBQUUscUJBVE07QUFVbkJDLEVBQUFBLGNBQWMsRUFBRSxtQkFWRztBQVduQkMsRUFBQUEsZUFBZSxFQUFFNUwsTUFBTTtBQVhKLENBQXZCOztBQWNBLElBQU02TCxLQUFLLEdBQUcsU0FBUkEsS0FBUTtBQUFBLFNBQU0xTCxHQUFHLENBQUM7QUFBRWtMLElBQUFBLEtBQUssRUFBTEE7QUFBRixHQUFELENBQVQ7QUFBQSxDQUFkOztBQUVBLElBQU1TLE1BQWUsR0FBRztBQUNwQjVHLEVBQUFBLFFBQVEsRUFBRSx1QkFBUzFCLFVBQVUsRUFBbkIsQ0FEVTtBQUVwQjhILEVBQUFBLEdBQUcsRUFBRXRMLE1BQU0sRUFGUztBQUdwQnVMLEVBQUFBLFdBQVcsRUFBRXZMLE1BQU0sRUFIQztBQUlwQnlMLEVBQUFBLE9BQU8sRUFBRUwsV0FBVyxFQUpBO0FBS3BCVyxFQUFBQSxRQUFRLEVBQUVGLEtBQUssRUFMSztBQU1wQkcsRUFBQUEsUUFBUSxFQUFFSCxLQUFLLEVBTks7QUFPcEJJLEVBQUFBLGVBQWUsRUFBRTtBQVBHLENBQXhCOztBQVVBLElBQU1DLE1BQU0sR0FBRyxTQUFUQSxNQUFTO0FBQUEsU0FBTS9MLEdBQUcsQ0FBQztBQUFFMkwsSUFBQUEsTUFBTSxFQUFOQTtBQUFGLEdBQUQsQ0FBVDtBQUFBLENBQWY7O0FBRUEsSUFBTUssVUFBVSxHQUFHLFNBQWJBLFVBQWEsQ0FBQ0MsR0FBRDtBQUFBLFNBQTJCLHNCQUFRO0FBQ2xEekIsSUFBQUEsTUFBTSxFQUFFLG1CQUQwQztBQUVsRDBCLElBQUFBLFlBQVksRUFBRSxtQkFGb0M7QUFHbERDLElBQUFBLFFBQVEsRUFBRSxtQkFId0M7QUFJbEQ1QixJQUFBQSxNQUFNLEVBQUUsbUJBSjBDO0FBS2xERSxJQUFBQSxTQUFTLEVBQUU1SyxNQUFNLEVBTGlDO0FBTWxENkssSUFBQUEsU0FBUyxFQUFFN0ssTUFBTSxFQU5pQztBQU9sRHVNLElBQUFBLFlBQVksRUFBRXJNLElBQUksRUFQZ0M7QUFRbERzTSxJQUFBQSxZQUFZLEVBQUV0TSxJQUFJLEVBUmdDO0FBU2xEdU0sSUFBQUEsVUFBVSxFQUFFdk0sSUFBSSxFQVRrQztBQVVsRHdNLElBQUFBLFVBQVUsRUFBRXhNLElBQUksRUFWa0M7QUFXbER5TSxJQUFBQSxhQUFhLEVBQUV6TSxJQUFJLEVBWCtCO0FBWWxEME0sSUFBQUEsS0FBSyxFQUFFLGtCQVoyQztBQWFsREMsSUFBQUEsbUJBQW1CLEVBQUUsbUJBYjZCO0FBY2xEQyxJQUFBQSxvQkFBb0IsRUFBRTlNLE1BQU0sRUFkc0I7QUFlbEQrTSxJQUFBQSxnQkFBZ0IsRUFBRSxtQkFmZ0M7QUFnQmxEQyxJQUFBQSxTQUFTLEVBQUUsbUJBaEJ1QztBQWlCbERDLElBQUFBLFVBQVUsRUFBRW5KLFNBQVMsRUFqQjZCO0FBa0JsREMsSUFBQUEsS0FBSyxFQUFFLG1CQWxCMkM7QUFtQmxEbUosSUFBQUEsY0FBYyxFQUFFLHFCQW5Ca0M7QUFvQmxEQyxJQUFBQSxvQkFBb0IsRUFBRSx1Q0FwQjRCO0FBcUJsREMsSUFBQUEsYUFBYSxFQUFFLHFCQXJCbUM7QUFzQmxEQyxJQUFBQSxtQkFBbUIsRUFBRTtBQXRCNkIsR0FBUixFQXVCM0NqQixHQXZCMkMsQ0FBM0I7QUFBQSxDQUFuQjs7QUF5QkEsSUFBTWtCLEtBQWMsR0FBRztBQUNuQnBKLEVBQUFBLElBQUksRUFBRSxlQURhO0FBRW5CQyxFQUFBQSxDQUFDLEVBQUU7QUFBRUMsSUFBQUEsVUFBVSxFQUFFO0FBQWQsR0FGZ0I7QUFHbkJlLEVBQUFBLE1BQU0sRUFBRW5DLHFCQUFxQixFQUhWO0FBSW5CdUssRUFBQUEsU0FBUyxFQUFFLG1CQUpRO0FBS25CZCxFQUFBQSxVQUFVLEVBQUV2TSxJQUFJLEVBTEc7QUFNbkJ5SyxFQUFBQSxNQUFNLEVBQUUsbUJBTlc7QUFPbkI2QyxFQUFBQSxXQUFXLEVBQUV0TixJQUFJLEVBUEU7QUFRbkI4TSxFQUFBQSxTQUFTLEVBQUUsbUJBUlE7QUFTbkJTLEVBQUFBLGtCQUFrQixFQUFFLG1CQVREO0FBVW5CYixFQUFBQSxLQUFLLEVBQUUsbUJBVlk7QUFXbkJjLEVBQUFBLFVBQVUsRUFBRTVDLFNBQVMsRUFYRjtBQVluQjZDLEVBQUFBLFFBQVEsRUFBRTdDLFNBQVMsRUFaQTtBQWFuQjhDLEVBQUFBLFlBQVksRUFBRTlDLFNBQVMsRUFiSjtBQWNuQitDLEVBQUFBLGFBQWEsRUFBRS9DLFNBQVMsRUFkTDtBQWVuQmdELEVBQUFBLGlCQUFpQixFQUFFaEQsU0FBUyxFQWZUO0FBZ0JuQmlELEVBQUFBLE9BQU8sRUFBRSxtQkFoQlU7QUFpQm5CQyxFQUFBQSw2QkFBNkIsRUFBRSxtQkFqQlo7QUFrQm5CekIsRUFBQUEsWUFBWSxFQUFFck0sSUFBSSxFQWxCQztBQW1CbkIrTixFQUFBQSxXQUFXLEVBQUUvTixJQUFJLEVBbkJFO0FBb0JuQndNLEVBQUFBLFVBQVUsRUFBRXhNLElBQUksRUFwQkc7QUFxQm5CZ08sRUFBQUEsV0FBVyxFQUFFLG1CQXJCTTtBQXNCbkI1QixFQUFBQSxRQUFRLEVBQUUsbUJBdEJTO0FBdUJuQjVCLEVBQUFBLE1BQU0sRUFBRSxtQkF2Qlc7QUF3Qm5CeUQsRUFBQUEsWUFBWSxFQUFFLG1CQXhCSztBQXlCbkJDLEVBQUFBLEtBQUssRUFBRXBPLE1BQU0sRUF6Qk07QUEwQm5CK00sRUFBQUEsZ0JBQWdCLEVBQUUsbUJBMUJDO0FBMkJuQnNCLEVBQUFBLFVBQVUsRUFBRTtBQUNSQyxJQUFBQSxXQUFXLEVBQUUscUJBREw7QUFFUkMsSUFBQUEsaUJBQWlCLEVBQUUsdUNBRlg7QUFHUkMsSUFBQUEsUUFBUSxFQUFFLHFCQUhGO0FBSVJDLElBQUFBLGNBQWMsRUFBRSx1Q0FKUjtBQUtSdkIsSUFBQUEsY0FBYyxFQUFFLHFCQUxSO0FBTVJDLElBQUFBLG9CQUFvQixFQUFFLHVDQU5kO0FBT1J1QixJQUFBQSxPQUFPLEVBQUUscUJBUEQ7QUFRUkMsSUFBQUEsYUFBYSxFQUFFLHVDQVJQO0FBU1IzQyxJQUFBQSxRQUFRLEVBQUUscUJBVEY7QUFVUjRDLElBQUFBLGNBQWMsRUFBRSx1Q0FWUjtBQVdSQyxJQUFBQSxhQUFhLEVBQUUscUJBWFA7QUFZUkMsSUFBQUEsbUJBQW1CLEVBQUUsdUNBWmI7QUFhUkMsSUFBQUEsTUFBTSxFQUFFLHFCQWJBO0FBY1JDLElBQUFBLFlBQVksRUFBRSx1Q0FkTjtBQWVSQyxJQUFBQSxhQUFhLEVBQUUscUJBZlA7QUFnQlJDLElBQUFBLG1CQUFtQixFQUFFO0FBaEJiLEdBM0JPO0FBNkNuQkMsRUFBQUEsWUFBWSxFQUFFL08sT0FBTyxDQUFDeUwsS0FBSyxFQUFOLENBN0NGO0FBOENuQnVELEVBQUFBLFNBQVMsRUFBRXBQLE1BQU0sRUE5Q0U7QUErQ25CcVAsRUFBQUEsYUFBYSxFQUFFalAsT0FBTyxDQUFDOEwsTUFBTSxFQUFQLENBL0NIO0FBZ0RuQm9ELEVBQUFBLGNBQWMsRUFBRWxQLE9BQU8sQ0FBQztBQUNwQmdHLElBQUFBLFlBQVksRUFBRXBHLE1BQU0sRUFEQTtBQUVwQnVQLElBQUFBLFlBQVksRUFBRW5QLE9BQU8sQ0FBQ0osTUFBTSxFQUFQLENBRkQ7QUFHcEJ3UCxJQUFBQSxZQUFZLEVBQUU7QUFDVnRJLE1BQUFBLFFBQVEsRUFBRWxILE1BQU0sRUFETjtBQUVWbUgsTUFBQUEsUUFBUSxFQUFFbkgsTUFBTTtBQUZOLEtBSE07QUFPcEJ5UCxJQUFBQSxRQUFRLEVBQUU7QUFQVSxHQUFELENBaERKO0FBeURuQkQsRUFBQUEsWUFBWSxFQUFFO0FBQ1YsV0FBS3hQLE1BQU0sRUFERDtBQUVWbUgsSUFBQUEsUUFBUSxFQUFFbkgsTUFBTSxFQUZOO0FBR1YwUCxJQUFBQSxTQUFTLEVBQUUsbUJBSEQ7QUFJVkMsSUFBQUEsR0FBRyxFQUFFM1AsTUFBTSxFQUpEO0FBS1ZrSCxJQUFBQSxRQUFRLEVBQUVsSCxNQUFNLEVBTE47QUFNVjRQLElBQUFBLFNBQVMsRUFBRTtBQU5ELEdBekRLO0FBaUVuQkMsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLFlBQVksRUFBRTFQLE9BQU8sQ0FBQztBQUNsQitOLE1BQUFBLFlBQVksRUFBRSxtQkFESTtBQUVsQkMsTUFBQUEsS0FBSyxFQUFFcE8sTUFBTSxFQUZLO0FBR2xCK1AsTUFBQUEsS0FBSyxFQUFFNUQsVUFBVTtBQUhDLEtBQUQsQ0FEakI7QUFNSjZELElBQUFBLFVBQVUsRUFBRTVQLE9BQU8sQ0FBQztBQUNoQitOLE1BQUFBLFlBQVksRUFBRSxtQkFERTtBQUVoQkMsTUFBQUEsS0FBSyxFQUFFcE8sTUFBTSxFQUZHO0FBR2hCaVEsTUFBQUEsSUFBSSxFQUFFLHFCQUhVO0FBSWhCQyxNQUFBQSxVQUFVLEVBQUUsdUNBSkk7QUFLaEJDLE1BQUFBLE1BQU0sRUFBRSxxQkFMUTtBQU1oQkMsTUFBQUEsWUFBWSxFQUFFO0FBTkUsS0FBRCxDQU5mO0FBY0pDLElBQUFBLGtCQUFrQixFQUFFeEUsS0FBSyxFQWRyQjtBQWVKeUUsSUFBQUEsbUJBQW1CLEVBQUVsUSxPQUFPLENBQUM7QUFDekJtUSxNQUFBQSxPQUFPLEVBQUV2USxNQUFNLEVBRFU7QUFFekJ3USxNQUFBQSxDQUFDLEVBQUV4USxNQUFNLEVBRmdCO0FBR3pCeVEsTUFBQUEsQ0FBQyxFQUFFelEsTUFBTTtBQUhnQixLQUFEO0FBZnhCLEdBakVXO0FBc0ZuQjBRLEVBQUFBLFVBQVUsRUFBRSxtQkFBSztBQUFFQyxJQUFBQSxlQUFlLEVBQWZBO0FBQUYsR0FBTCxFQUEwQixJQUExQjtBQXRGTyxDQUF2QjtBQXlGQSxJQUFNQSxlQUF3QixHQUFHO0FBQzdCek0sRUFBQUEsSUFBSSxFQUFFLGlFQUR1QjtBQUU3QkMsRUFBQUEsQ0FBQyxFQUFFO0FBQUVDLElBQUFBLFVBQVUsRUFBRTtBQUFkLEdBRjBCO0FBRzdCc00sRUFBQUEsVUFBVSxFQUFFdFEsT0FBTyxDQUFDO0FBQ2hCbVEsSUFBQUEsT0FBTyxFQUFFdlEsTUFBTSxDQUFDLGNBQUQsQ0FEQztBQUVoQndRLElBQUFBLENBQUMsRUFBRXhRLE1BQU0sQ0FBQyx1QkFBRCxDQUZPO0FBR2hCeVEsSUFBQUEsQ0FBQyxFQUFFelEsTUFBTSxDQUFDLHVCQUFEO0FBSE8sR0FBRCxFQUloQiw2Q0FKZ0I7QUFIVSxDQUFqQyxDLENBVUE7O0FBRUEsSUFBTTRRLE1BQWUsR0FBRztBQUNwQkMsRUFBQUEsTUFBTSxFQUFFO0FBQ0pDLElBQUFBLEtBQUssRUFBRTtBQUNIQyxNQUFBQSxhQUFhLEVBQWJBLHNCQURHO0FBRUh0RyxNQUFBQSxTQUFTLEVBQVRBLFNBRkc7QUFHSE0sTUFBQUEsV0FBVyxFQUFYQSxXQUhHO0FBSUhNLE1BQUFBLEtBQUssRUFBTEEsS0FKRztBQUtIUyxNQUFBQSxNQUFNLEVBQU5BLE1BTEc7QUFNSDdHLE1BQUFBLE9BQU8sRUFBUEEsT0FORztBQU9IcUksTUFBQUEsS0FBSyxFQUFMQSxLQVBHO0FBUUhySixNQUFBQSxPQUFPLEVBQVBBLE9BUkc7QUFTSGlDLE1BQUFBLFdBQVcsRUFBWEEsV0FURztBQVVIeUssTUFBQUEsZUFBZSxFQUFmQTtBQVZHO0FBREg7QUFEWSxDQUF4QjtlQWlCZUMsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYSc7XG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL3Etc2NoZW1hXCI7XG5cbmNvbnN0IHsgc3RyaW5nLCBib29sLCByZWYsIGFycmF5T2YgfSA9IERlZjtcblxuXG5jb25zdCBhY2NvdW50U3RhdHVzID0gdThlbnVtKCdBY2NvdW50U3RhdHVzJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxuICAgIG5vbkV4aXN0OiAzLFxufSk7XG5cbmNvbnN0IGFjY291bnRTdGF0dXNDaGFuZ2UgPSB1OGVudW0oJ0FjY291bnRTdGF0dXNDaGFuZ2UnLCB7XG4gICAgdW5jaGFuZ2VkOiAwLFxuICAgIGZyb3plbjogMSxcbiAgICBkZWxldGVkOiAyLFxufSk7XG5cbmNvbnN0IHNraXBSZWFzb24gPSB1OGVudW0oJ1NraXBSZWFzb24nLCB7XG4gICAgbm9TdGF0ZTogMCxcbiAgICBiYWRTdGF0ZTogMSxcbiAgICBub0dhczogMixcbn0pO1xuXG5cbmNvbnN0IGFjY291bnRUeXBlID0gdThlbnVtKCdBY2NvdW50VHlwZScsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbn0pO1xuXG5jb25zdCBtZXNzYWdlVHlwZSA9IHU4ZW51bSgnTWVzc2FnZVR5cGUnLCB7XG4gICAgaW50ZXJuYWw6IDAsXG4gICAgZXh0SW46IDEsXG4gICAgZXh0T3V0OiAyLFxufSk7XG5cblxuY29uc3QgbWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ01lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcXVldWVkOiAxLFxuICAgIHByb2Nlc3Npbmc6IDIsXG4gICAgcHJlbGltaW5hcnk6IDMsXG4gICAgcHJvcG9zZWQ6IDQsXG4gICAgZmluYWxpemVkOiA1LFxuICAgIHJlZnVzZWQ6IDYsXG4gICAgdHJhbnNpdGluZzogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblR5cGUgPSB1OGVudW0oJ1RyYW5zYWN0aW9uVHlwZScsIHtcbiAgICBvcmRpbmFyeTogMCxcbiAgICBzdG9yYWdlOiAxLFxuICAgIHRpY2s6IDIsXG4gICAgdG9jazogMyxcbiAgICBzcGxpdFByZXBhcmU6IDQsXG4gICAgc3BsaXRJbnN0YWxsOiA1LFxuICAgIG1lcmdlUHJlcGFyZTogNixcbiAgICBtZXJnZUluc3RhbGw6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdUcmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcmVsaW1pbmFyeTogMSxcbiAgICBwcm9wb3NlZDogMixcbiAgICBmaW5hbGl6ZWQ6IDMsXG4gICAgcmVmdXNlZDogNCxcbn0pO1xuXG5jb25zdCBjb21wdXRlVHlwZSA9IHU4ZW51bSgnQ29tcHV0ZVR5cGUnLCB7XG4gICAgc2tpcHBlZDogMCxcbiAgICB2bTogMSxcbn0pO1xuXG5jb25zdCBib3VuY2VUeXBlID0gdThlbnVtKCdCb3VuY2VUeXBlJywge1xuICAgIG5lZ0Z1bmRzOiAwLFxuICAgIG5vRnVuZHM6IDEsXG4gICAgb2s6IDIsXG59KTtcblxuY29uc3QgYmxvY2tQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdCbG9ja1Byb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBwcm9wb3NlZDogMSxcbiAgICBmaW5hbGl6ZWQ6IDIsXG4gICAgcmVmdXNlZDogMyxcbn0pO1xuXG5cbmNvbnN0IGluTXNnVHlwZSA9IHU4ZW51bSgnSW5Nc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGlocjogMSxcbiAgICBpbW1lZGlhdGVseTogMixcbiAgICBmaW5hbDogMyxcbiAgICB0cmFuc2l0OiA0LFxuICAgIGRpc2NhcmRlZEZpbmFsOiA1LFxuICAgIGRpc2NhcmRlZFRyYW5zaXQ6IDYsXG59KTtcblxuY29uc3Qgb3V0TXNnVHlwZSA9IHU4ZW51bSgnT3V0TXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpbW1lZGlhdGVseTogMSxcbiAgICBvdXRNc2dOZXc6IDIsXG4gICAgdHJhbnNpdDogMyxcbiAgICBkZXF1ZXVlSW1tZWRpYXRlbHk6IDQsXG4gICAgZGVxdWV1ZTogNSxcbiAgICB0cmFuc2l0UmVxdWlyZWQ6IDYsXG4gICAgbm9uZTogLTEsXG59KTtcblxuY29uc3Qgc3BsaXRUeXBlID0gdThlbnVtKCdTcGxpdFR5cGUnLCB7XG4gICAgbm9uZTogMCxcbiAgICBzcGxpdDogMixcbiAgICBtZXJnZTogMyxcbn0pO1xuXG5jb25zdCBBY2NvdW50OiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gQWNjb3VudCcsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYWNjb3VudHMnIH0sXG4gICAgYWNjX3R5cGU6IHJlcXVpcmVkKGFjY291bnRUeXBlKCdDdXJyZW50IHN0YXR1cyBvZiB0aGUgYWNjb3VudCcpKSxcbiAgICBsYXN0X3BhaWQ6IHJlcXVpcmVkKHUzMignQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50IGNvbGxlY3RlZCAodXN1YWxseSB0aGlzIGlzIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdHJhbnNhY3Rpb24pLCBvciB0aGUgdW5peHRpbWUgd2hlbiB0aGUgYWNjb3VudCB3YXMgY3JlYXRlZCAoYWdhaW4sIGJ5IGEgdHJhbnNhY3Rpb24pJykpLFxuICAgIGR1ZV9wYXltZW50OiBncmFtcygnSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG90aGVyIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjY291bnQgaXMgZGVzdHJveWVkIGFsdG9nZXRoZXIsIGFuZCBpdHMgYmFsYW5jZSwgaWYgYW55LCBpcyB0cmFuc2ZlcnJlZCB0byB0aGUgemVybyBhY2NvdW50LicpLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHJlcXVpcmVkKHU2NCgpKSxcbiAgICBiYWxhbmNlOiByZXF1aXJlZChncmFtcygpKSxcbiAgICBiYWxhbmNlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIHNwbGl0X2RlcHRoOiB1OCgnSXMgcHJlc2VudCBhbmQgbm9uLXplcm8gb25seSBpbiBpbnN0YW5jZXMgb2YgbGFyZ2Ugc21hcnQgY29udHJhY3RzLicpLFxuICAgIHRpY2s6IGJvb2woJ01heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uJyksXG4gICAgdG9jazogYm9vbCgnTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi4nKSxcbiAgICBjb2RlOiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGNvZGUgZW5jb2RlZCB3aXRoIGluIGJhc2U2NCcpLFxuICAgIGRhdGE6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgZGF0YSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0JyksXG4gICAgbGlicmFyeTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdCcpLFxuICAgIHByb29mOiBzdHJpbmcoKSxcbiAgICBib2M6IHN0cmluZygpLFxufTtcblxuY29uc3QgTWVzc2FnZTogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVE9OIE1lc3NhZ2UnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ21lc3NhZ2VzJyB9LFxuICAgIG1zZ190eXBlOiByZXF1aXJlZChtZXNzYWdlVHlwZSgnTWVzc2FnZSB0eXBlJykpLFxuICAgIHN0YXR1czogcmVxdWlyZWQobWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMoJ0ludGVybmFsIHByb2Nlc3Npbmcgc3RhdHVzJykpLFxuICAgIGJsb2NrX2lkOiByZXF1aXJlZChzdHJpbmcoJ0Jsb2NrIHRvIHdoaWNoIHRoaXMgbWVzc2FnZSBiZWxvbmdzJykpLFxuICAgIGJvZHk6IHN0cmluZygnJyksXG4gICAgc3BsaXRfZGVwdGg6IHU4KCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIHRpY2s6IGJvb2woJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgdG9jazogYm9vbCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICBjb2RlOiBzdHJpbmcoJ1JlcHJlc2VudHMgY29udHJhY3QgY29kZSBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBkYXRhOiBzdHJpbmcoJ1JlcHJlc2VudHMgaW5pdGlhbCBkYXRhIGZvciBhIGNvbnRyYWN0IGluIGRlcGxveSBtZXNzYWdlcycpLFxuICAgIGxpYnJhcnk6IHN0cmluZygnUmVwcmVzZW50cyBjb250cmFjdCBsaWJyYXJ5IGluIGRlcGxveSBtZXNzYWdlcycpLFxuICAgIHNyYzogc3RyaW5nKCdTb3VyY2UgYWRkcmVzcycpLFxuICAgIGRzdDogc3RyaW5nKCdEZXN0aW5hdGlvbiBhZGRyZXNzJyksXG4gICAgY3JlYXRlZF9sdDogdTY0KCdMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24nKSxcbiAgICBjcmVhdGVkX2F0OiB1MzIoJ0NyZWF0aW9uIHVuaXh0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLiBUaGUgY3JlYXRpb24gdW5peHRpbWUgZXF1YWxzIHRoZSBjcmVhdGlvbiB1bml4dGltZSBvZiB0aGUgYmxvY2sgY29udGFpbmluZyB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4nKSxcbiAgICBpaHJfZGlzYWJsZWQ6IGJvb2woJ05vdCBkZXNjcmliZWQgaW4gc3BlYycpLFxuICAgIGlocl9mZWU6IGdyYW1zKCdUaGlzIHZhbHVlIGlzIHN1YnRyYWN0ZWQgZnJvbSB0aGUgdmFsdWUgYXR0YWNoZWQgdG8gdGhlIG1lc3NhZ2UgYW5kIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMgb2YgdGhlIGRlc3RpbmF0aW9uIHNoYXJkY2hhaW4gaWYgdGhleSBpbmNsdWRlIHRoZSBtZXNzYWdlIGJ5IHRoZSBJSFIgbWVjaGFuaXNtLicpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCdPcmlnaW5hbCB0b3RhbCBmb3J3YXJkaW5nIGZlZSBwYWlkIGZvciB1c2luZyB0aGUgSFIgbWVjaGFuaXNtOyBpdCBpcyBhdXRvbWF0aWNhbGx5IGNvbXB1dGVkIGZyb20gc29tZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgYW5kIHRoZSBzaXplIG9mIHRoZSBtZXNzYWdlIGF0IHRoZSB0aW1lIHRoZSBtZXNzYWdlIGlzIGdlbmVyYXRlZC4nKSxcbiAgICBpbXBvcnRfZmVlOiBncmFtcygnTm90IGRlc2NyaWJlZCBpbiBzcGVjJyksXG4gICAgYm91bmNlOiBib29sKCdCb3VuY2UgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLicpLFxuICAgIGJvdW5jZWQ6IGJvb2woJ0JvdW5jZWQgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLicpLFxuICAgIHZhbHVlOiBncmFtcygnSW50ZXJuYWwgbWVzc2FnZSBtYXkgYmVhciBzb21lIHZhbHVlIGluIEdyYW1zJyksXG4gICAgdmFsdWVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCdJbnRlcm5hbCBtZXNzYWdlIG1heSBiZWFyIHNvbWUgdmFsdWUgaW4gb3RoZXIgY3VycmVuY2llcycpLFxuICAgIHByb29mOiBzdHJpbmcoKSxcbiAgICBib2M6IHN0cmluZygpLFxufTtcblxuXG5jb25zdCBUcmFuc2FjdGlvbjogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVE9OIFRyYW5zYWN0aW9uJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnIH0sXG4gICAgdHJfdHlwZTogcmVxdWlyZWQodHJhbnNhY3Rpb25UeXBlKCkpLFxuICAgIHN0YXR1czogcmVxdWlyZWQodHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzKCkpLFxuICAgIGJsb2NrX2lkOiBzdHJpbmcoKSxcbiAgICBhY2NvdW50X2FkZHI6IHN0cmluZygpLFxuICAgIGx0OiB1NjQoKSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHN0cmluZygpLFxuICAgIHByZXZfdHJhbnNfbHQ6IHU2NCgpLFxuICAgIG5vdzogdTMyKCksXG4gICAgb3V0bXNnX2NudDogaTMyKCksXG4gICAgb3JpZ19zdGF0dXM6IGFjY291bnRTdGF0dXMoKSxcbiAgICBlbmRfc3RhdHVzOiBhY2NvdW50U3RhdHVzKCksXG4gICAgaW5fbXNnOiBzdHJpbmcoKSxcbiAgICBpbl9tZXNzYWdlOiBqb2luKHsgTWVzc2FnZSB9LCAnaW5fbXNnJyksXG4gICAgb3V0X21zZ3M6IGFycmF5T2Yoc3RyaW5nKCkpLFxuICAgIG91dF9tZXNzYWdlczogYXJyYXlPZihqb2luKHsgTWVzc2FnZSB9LCAnb3V0X21zZ3MnKSksXG4gICAgdG90YWxfZmVlczogZ3JhbXMoKSxcbiAgICB0b3RhbF9mZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIG9sZF9oYXNoOiBzdHJpbmcoKSxcbiAgICBuZXdfaGFzaDogc3RyaW5nKCksXG4gICAgY3JlZGl0X2ZpcnN0OiBib29sKCksXG4gICAgc3RvcmFnZToge1xuICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBncmFtcygpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKCksXG4gICAgfSxcbiAgICBjcmVkaXQ6IHtcbiAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgICAgICBjcmVkaXQ6IGdyYW1zKCksXG4gICAgICAgIGNyZWRpdF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICB9LFxuICAgIGNvbXB1dGU6IHtcbiAgICAgICAgY29tcHV0ZV90eXBlOiByZXF1aXJlZChjb21wdXRlVHlwZSgpKSxcbiAgICAgICAgc2tpcHBlZF9yZWFzb246IHNraXBSZWFzb24oKSxcbiAgICAgICAgc3VjY2VzczogYm9vbCgpLFxuICAgICAgICBtc2dfc3RhdGVfdXNlZDogYm9vbCgpLFxuICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYm9vbCgpLFxuICAgICAgICBnYXNfZmVlczogZ3JhbXMoKSxcbiAgICAgICAgZ2FzX3VzZWQ6IHU2NCgpLFxuICAgICAgICBnYXNfbGltaXQ6IHU2NCgpLFxuICAgICAgICBnYXNfY3JlZGl0OiBpMzIoKSxcbiAgICAgICAgbW9kZTogaTgoKSxcbiAgICAgICAgZXhpdF9jb2RlOiBpMzIoKSxcbiAgICAgICAgZXhpdF9hcmc6IGkzMigpLFxuICAgICAgICB2bV9zdGVwczogdTMyKCksXG4gICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHN0cmluZygpLFxuICAgIH0sXG4gICAgYWN0aW9uOiB7XG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woKSxcbiAgICAgICAgdmFsaWQ6IGJvb2woKSxcbiAgICAgICAgbm9fZnVuZHM6IGJvb2woKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZSgpLFxuICAgICAgICB0b3RhbF9md2RfZmVlczogZ3JhbXMoKSxcbiAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIHJlc3VsdF9jb2RlOiBpMzIoKSxcbiAgICAgICAgcmVzdWx0X2FyZzogaTMyKCksXG4gICAgICAgIHRvdF9hY3Rpb25zOiBpMzIoKSxcbiAgICAgICAgc3BlY19hY3Rpb25zOiBpMzIoKSxcbiAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBpMzIoKSxcbiAgICAgICAgbXNnc19jcmVhdGVkOiBpMzIoKSxcbiAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiB1MzIoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogdTMyKCksXG4gICAgfSxcbiAgICBib3VuY2U6IHtcbiAgICAgICAgYm91bmNlX3R5cGU6IHJlcXVpcmVkKGJvdW5jZVR5cGUoKSksXG4gICAgICAgIG1zZ19zaXplX2NlbGxzOiB1MzIoKSxcbiAgICAgICAgbXNnX3NpemVfYml0czogdTMyKCksXG4gICAgICAgIHJlcV9md2RfZmVlczogZ3JhbXMoKSxcbiAgICAgICAgbXNnX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIGZ3ZF9mZWVzOiBncmFtcygpLFxuICAgIH0sXG4gICAgYWJvcnRlZDogYm9vbCgpLFxuICAgIGRlc3Ryb3llZDogYm9vbCgpLFxuICAgIHR0OiBzdHJpbmcoKSxcbiAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiB1OCgpLFxuICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IHU4KCksXG4gICAgICAgIHRoaXNfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIHNpYmxpbmdfYWRkcjogc3RyaW5nKCksXG4gICAgfSxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBpbnN0YWxsZWQ6IGJvb2woKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cbi8vIEJMT0NLXG5cbmNvbnN0IEV4dEJsa1JlZjogVHlwZURlZiA9IHtcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpXG59O1xuXG5jb25zdCBleHRCbGtSZWYgPSAoKSA9PiByZWYoeyBFeHRCbGtSZWYgfSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlOiBUeXBlRGVmID0ge1xuICAgIG1zZ19pZDogc3RyaW5nKCksXG4gICAgbmV4dF9hZGRyOiBzdHJpbmcoKSxcbiAgICBjdXJfYWRkcjogc3RyaW5nKCksXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IGdyYW1zKCksXG59O1xuXG5jb25zdCBtc2dFbnZlbG9wZSA9ICgpID0+IHJlZih7IE1zZ0VudmVsb3BlIH0pO1xuXG5jb25zdCBJbk1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQoaW5Nc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGlocl9mZWU6IGdyYW1zKCksXG4gICAgcHJvb2ZfY3JlYXRlZDogc3RyaW5nKCksXG4gICAgaW5fbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIGZ3ZF9mZWU6IGdyYW1zKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICB0cmFuc2l0X2ZlZTogZ3JhbXMoKSxcbiAgICB0cmFuc2FjdGlvbl9pZDogdTY0KCksXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzdHJpbmcoKVxufTtcblxuY29uc3QgaW5Nc2cgPSAoKSA9PiByZWYoeyBJbk1zZyB9KTtcblxuY29uc3QgT3V0TXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChvdXRNc2dUeXBlKCkpLFxuICAgIG1zZzogc3RyaW5nKCksXG4gICAgdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgcmVpbXBvcnQ6IGluTXNnKCksXG4gICAgaW1wb3J0ZWQ6IGluTXNnKCksXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiB1NjQoKSxcbn07XG5cbmNvbnN0IG91dE1zZyA9ICgpID0+IHJlZih7IE91dE1zZyB9KTtcblxuY29uc3Qgc2hhcmREZXNjciA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IHdpdGhEb2Moe1xuICAgIHNlcV9ubzogdTMyKCksXG4gICAgcmVnX21jX3NlcW5vOiB1MzIoKSxcbiAgICBzdGFydF9sdDogdTY0KCksXG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKCksXG4gICAgYmVmb3JlX21lcmdlOiBib29sKCksXG4gICAgd2FudF9zcGxpdDogYm9vbCgpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woKSxcbiAgICBueF9jY191cGRhdGVkOiBib29sKCksXG4gICAgZmxhZ3M6IHU4KCksXG4gICAgbmV4dF9jYXRjaGFpbl9zZXFubzogdTMyKCksXG4gICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IHN0cmluZygpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMigpLFxuICAgIGdlbl91dGltZTogdTMyKCksXG4gICAgc3BsaXRfdHlwZTogc3BsaXRUeXBlKCksXG4gICAgc3BsaXQ6IHUzMigpLFxuICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIGZ1bmRzX2NyZWF0ZWQ6IGdyYW1zKCksXG4gICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbn0sIGRvYyk7XG5cbmNvbnN0IEJsb2NrOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUaGlzIGlzIEJsb2NrJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3MnIH0sXG4gICAgc3RhdHVzOiBibG9ja1Byb2Nlc3NpbmdTdGF0dXMoKSxcbiAgICBnbG9iYWxfaWQ6IHUzMigpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIGFmdGVyX21lcmdlOiBib29sKCksXG4gICAgZ2VuX3V0aW1lOiBpMzIoKSxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHUzMigpLFxuICAgIGZsYWdzOiB1MTYoKSxcbiAgICBtYXN0ZXJfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl9hbHRfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X3ZlcnRfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogZXh0QmxrUmVmKCksXG4gICAgdmVyc2lvbjogdTMyKCksXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHUzMigpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbCgpLFxuICAgIGFmdGVyX3NwbGl0OiBib29sKCksXG4gICAgd2FudF9tZXJnZTogYm9vbCgpLFxuICAgIHZlcnRfc2VxX25vOiB1MzIoKSxcbiAgICBzdGFydF9sdDogdTY0KCksXG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgIHNoYXJkOiBzdHJpbmcoKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoKSxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBncmFtcygpLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZXhwb3J0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGNyZWF0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGltcG9ydGVkOiBncmFtcygpLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogZ3JhbXMoKSxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgbWludGVkOiBncmFtcygpLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGFycmF5T2YoaW5Nc2coKSksXG4gICAgcmFuZF9zZWVkOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnX2Rlc2NyOiBhcnJheU9mKG91dE1zZygpKSxcbiAgICBhY2NvdW50X2Jsb2NrczogYXJyYXlPZih7XG4gICAgICAgIGFjY291bnRfYWRkcjogc3RyaW5nKCksXG4gICAgICAgIHRyYW5zYWN0aW9uczogYXJyYXlPZihzdHJpbmcoKSksXG4gICAgICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICAgICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgICAgICAgICAgbmV3X2hhc2g6IHN0cmluZygpXG4gICAgICAgIH0sXG4gICAgICAgIHRyX2NvdW50OiBpMzIoKVxuICAgIH0pLFxuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IHN0cmluZygpLFxuICAgICAgICBuZXdfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIG5ld19kZXB0aDogdTE2KCksXG4gICAgICAgIG9sZDogc3RyaW5nKCksXG4gICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgb2xkX2RlcHRoOiB1MTYoKVxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIHNoYXJkX2hhc2hlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZygpLFxuICAgICAgICAgICAgZGVzY3I6IHNoYXJkRGVzY3IoKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNoYXJkX2ZlZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIGZlZXM6IGdyYW1zKCksXG4gICAgICAgICAgICBmZWVzX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICAgICAgY3JlYXRlOiBncmFtcygpLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICB9KSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBpbk1zZygpLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIG5vZGVfaWQ6IHN0cmluZygpLFxuICAgICAgICAgICAgcjogc3RyaW5nKCksXG4gICAgICAgICAgICBzOiBzdHJpbmcoKSxcbiAgICAgICAgfSksXG4gICAgfSxcbiAgICBzaWduYXR1cmVzOiBqb2luKHsgQmxvY2tTaWduYXR1cmVzIH0sICdpZCcpLFxufTtcblxuY29uc3QgQmxvY2tTaWduYXR1cmVzOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduc3R1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjZXJyZXNwb25kIGlkJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdibG9ja3Nfc2lnbmF0dXJlcycgfSxcbiAgICBzaWduYXR1cmVzOiBhcnJheU9mKHtcbiAgICAgICAgbm9kZV9pZDogc3RyaW5nKFwiVmFsaWRhdG9yIElEXCIpLFxuICAgICAgICByOiBzdHJpbmcoXCInUicgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgICAgIHM6IHN0cmluZyhcIidzJyBwYXJ0IG9mIHNpZ25hdHVyZVwiKSxcbiAgICB9LCBcIkFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNcIiksXG59XG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgICAgICBCbG9ja1NpZ25hdHVyZXMsXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=