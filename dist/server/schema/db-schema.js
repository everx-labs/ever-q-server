"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _schema = require("ton-labs-dev-ops/dist/src/schema");

var _dbSchemaTypes = require("./db-schema-types");

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
var accountStatus = (0, _dbSchemaTypes.u8enum)('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
var accountStatusChange = (0, _dbSchemaTypes.u8enum)('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
var skipReason = (0, _dbSchemaTypes.u8enum)('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
var accountType = (0, _dbSchemaTypes.u8enum)('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
var messageType = (0, _dbSchemaTypes.u8enum)('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
var messageProcessingStatus = (0, _dbSchemaTypes.u8enum)('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
var transactionType = (0, _dbSchemaTypes.u8enum)('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
var transactionProcessingStatus = (0, _dbSchemaTypes.u8enum)('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
var computeType = (0, _dbSchemaTypes.u8enum)('ComputeType', {
  skipped: 0,
  vm: 1
});
var bounceType = (0, _dbSchemaTypes.u8enum)('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
var blockProcessingStatus = (0, _dbSchemaTypes.u8enum)('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
var inMsgType = (0, _dbSchemaTypes.u8enum)('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  "final": 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
var outMsgType = (0, _dbSchemaTypes.u8enum)('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
var splitType = (0, _dbSchemaTypes.u8enum)('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
var Account = {
  _doc: 'TON Account',
  _: {
    collection: 'accounts'
  },
  acc_type: (0, _dbSchemaTypes.required)(accountType('Current status of the account')),
  last_paid: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u32)('Contains either the unixtime of the most recent storage payment collected (usually this is the unixtime of the most recent transaction), or the unixtime when the account was created (again, by a transaction)')),
  due_payment: (0, _dbSchemaTypes.grams)('If present, accumulates the storage payments that could not be exacted from the balance of the account, represented by a strictly positive amount of nanograms; it can be present only for uninitialized or frozen accounts that have a balance of zero Grams (but may have non-zero balances in other cryptocurrencies). When due_payment becomes larger than the value of a configurable parameter of the blockchain, the account is destroyed altogether, and its balance, if any, is transferred to the zero account.'),
  last_trans_lt: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.u64)()),
  // index
  balance: (0, _dbSchemaTypes.required)((0, _dbSchemaTypes.grams)()),
  // index
  balance_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
  split_depth: (0, _dbSchemaTypes.u8)('Is present and non-zero only in instances of large smart contracts.'),
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
  msg_type: (0, _dbSchemaTypes.required)(messageType('Message type')),
  status: (0, _dbSchemaTypes.required)(messageProcessingStatus('Internal processing status')),
  block_id: (0, _dbSchemaTypes.required)(string('Block to which this message belongs')),
  body: string(''),
  split_depth: (0, _dbSchemaTypes.u8)('Used in deploy message for special contracts in masterchain'),
  tick: bool('Used in deploy message for special contracts in masterchain'),
  tock: bool('Used in deploy message for special contracts in masterchain'),
  code: string('Represents contract code in deploy messages'),
  data: string('Represents initial data for a contract in deploy messages'),
  library: string('Represents contract library in deploy messages'),
  src: string('Source address'),
  dst: string('Destination address'),
  created_lt: (0, _dbSchemaTypes.u64)('Logical creation time automatically set by the generating transaction'),
  created_at: (0, _dbSchemaTypes.u32)('Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction.'),
  ihr_disabled: bool('Not described in spec'),
  ihr_fee: (0, _dbSchemaTypes.grams)('This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism.'),
  fwd_fee: (0, _dbSchemaTypes.grams)('Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated.'),
  import_fee: (0, _dbSchemaTypes.grams)('Not described in spec'),
  bounce: bool('Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  bounced: bool('Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  value: (0, _dbSchemaTypes.grams)('Internal message may bear some value in Grams'),
  value_other: (0, _dbSchemaTypes.otherCurrencyCollection)('Internal message may bear some value in other currencies'),
  proof: string(),
  boc: string()
};
var Transaction = {
  _doc: 'TON Transaction',
  _: {
    collection: 'transactions'
  },
  tr_type: (0, _dbSchemaTypes.required)(transactionType()),
  status: (0, _dbSchemaTypes.required)(transactionProcessingStatus()),
  block_id: string(),
  account_addr: string(),
  lt: (0, _dbSchemaTypes.u64)(),
  prev_trans_hash: string(),
  prev_trans_lt: (0, _dbSchemaTypes.u64)(),
  now: (0, _dbSchemaTypes.u32)(),
  outmsg_cnt: (0, _dbSchemaTypes.i32)(),
  orig_status: accountStatus(),
  end_status: accountStatus(),
  in_msg: string(),
  in_message: (0, _dbSchemaTypes.join)({
    Message: Message
  }, 'in_msg'),
  out_msgs: arrayOf(string()),
  out_messages: arrayOf((0, _dbSchemaTypes.join)({
    Message: Message
  }, 'out_msgs')),
  total_fees: (0, _dbSchemaTypes.grams)(),
  total_fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
  old_hash: string(),
  new_hash: string(),
  credit_first: bool(),
  storage: {
    storage_fees_collected: (0, _dbSchemaTypes.grams)(),
    storage_fees_due: (0, _dbSchemaTypes.grams)(),
    status_change: accountStatusChange()
  },
  credit: {
    due_fees_collected: (0, _dbSchemaTypes.grams)(),
    credit: (0, _dbSchemaTypes.grams)(),
    credit_other: (0, _dbSchemaTypes.otherCurrencyCollection)()
  },
  compute: {
    compute_type: (0, _dbSchemaTypes.required)(computeType()),
    skipped_reason: skipReason(),
    success: bool(),
    msg_state_used: bool(),
    account_activated: bool(),
    gas_fees: (0, _dbSchemaTypes.grams)(),
    gas_used: (0, _dbSchemaTypes.u64)(),
    gas_limit: (0, _dbSchemaTypes.u64)(),
    gas_credit: (0, _dbSchemaTypes.i32)(),
    mode: (0, _dbSchemaTypes.i8)(),
    exit_code: (0, _dbSchemaTypes.i32)(),
    exit_arg: (0, _dbSchemaTypes.i32)(),
    vm_steps: (0, _dbSchemaTypes.u32)(),
    vm_init_state_hash: string(),
    vm_final_state_hash: string()
  },
  action: {
    success: bool(),
    valid: bool(),
    no_funds: bool(),
    status_change: accountStatusChange(),
    total_fwd_fees: (0, _dbSchemaTypes.grams)(),
    total_action_fees: (0, _dbSchemaTypes.grams)(),
    result_code: (0, _dbSchemaTypes.i32)(),
    result_arg: (0, _dbSchemaTypes.i32)(),
    tot_actions: (0, _dbSchemaTypes.i32)(),
    spec_actions: (0, _dbSchemaTypes.i32)(),
    skipped_actions: (0, _dbSchemaTypes.i32)(),
    msgs_created: (0, _dbSchemaTypes.i32)(),
    action_list_hash: string(),
    total_msg_size_cells: (0, _dbSchemaTypes.u32)(),
    total_msg_size_bits: (0, _dbSchemaTypes.u32)()
  },
  bounce: {
    bounce_type: (0, _dbSchemaTypes.required)(bounceType()),
    msg_size_cells: (0, _dbSchemaTypes.u32)(),
    msg_size_bits: (0, _dbSchemaTypes.u32)(),
    req_fwd_fees: (0, _dbSchemaTypes.grams)(),
    msg_fees: (0, _dbSchemaTypes.grams)(),
    fwd_fees: (0, _dbSchemaTypes.grams)()
  },
  aborted: bool(),
  destroyed: bool(),
  tt: string(),
  split_info: {
    cur_shard_pfx_len: (0, _dbSchemaTypes.u8)(),
    acc_split_depth: (0, _dbSchemaTypes.u8)(),
    this_addr: string(),
    sibling_addr: string()
  },
  prepare_transaction: string(),
  installed: bool(),
  proof: string(),
  boc: string()
}; // BLOCK

var ExtBlkRef = {
  end_lt: (0, _dbSchemaTypes.u64)(),
  seq_no: (0, _dbSchemaTypes.u32)(),
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
  fwd_fee_remaining: (0, _dbSchemaTypes.grams)()
};

var msgEnvelope = function msgEnvelope() {
  return ref({
    MsgEnvelope: MsgEnvelope
  });
};

var InMsg = {
  msg_type: (0, _dbSchemaTypes.required)(inMsgType()),
  msg: string(),
  transaction: string(),
  ihr_fee: (0, _dbSchemaTypes.grams)(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: (0, _dbSchemaTypes.grams)(),
  out_msg: msgEnvelope(),
  transit_fee: (0, _dbSchemaTypes.grams)(),
  transaction_id: (0, _dbSchemaTypes.u64)(),
  proof_delivered: string()
};

var inMsg = function inMsg() {
  return ref({
    InMsg: InMsg
  });
};

var OutMsg = {
  msg_type: (0, _dbSchemaTypes.required)(outMsgType()),
  msg: string(),
  transaction: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: (0, _dbSchemaTypes.u64)()
};

var outMsg = function outMsg() {
  return ref({
    OutMsg: OutMsg
  });
};

var shardDescr = function shardDescr(doc) {
  return (0, _dbSchemaTypes.withDoc)({
    seq_no: (0, _dbSchemaTypes.u32)(),
    reg_mc_seqno: (0, _dbSchemaTypes.u32)(),
    start_lt: (0, _dbSchemaTypes.u64)(),
    end_lt: (0, _dbSchemaTypes.u64)(),
    root_hash: string(),
    file_hash: string(),
    before_split: bool(),
    before_merge: bool(),
    want_split: bool(),
    want_merge: bool(),
    nx_cc_updated: bool(),
    flags: (0, _dbSchemaTypes.u8)(),
    next_catchain_seqno: (0, _dbSchemaTypes.u32)(),
    next_validator_shard: string(),
    min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(),
    gen_utime: (0, _dbSchemaTypes.u32)(),
    split_type: splitType(),
    split: (0, _dbSchemaTypes.u32)(),
    fees_collected: (0, _dbSchemaTypes.grams)(),
    fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    funds_created: (0, _dbSchemaTypes.grams)(),
    funds_created_other: (0, _dbSchemaTypes.otherCurrencyCollection)()
  }, doc);
};

var Block = {
  _doc: 'This is Block',
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(),
  global_id: (0, _dbSchemaTypes.u32)(),
  want_split: bool(),
  seq_no: (0, _dbSchemaTypes.u32)(),
  after_merge: bool(),
  gen_utime: (0, _dbSchemaTypes.i32)(),
  gen_catchain_seqno: (0, _dbSchemaTypes.u32)(),
  flags: (0, _dbSchemaTypes.u16)(),
  master_ref: extBlkRef(),
  prev_ref: extBlkRef(),
  prev_alt_ref: extBlkRef(),
  prev_vert_ref: extBlkRef(),
  prev_vert_alt_ref: extBlkRef(),
  version: (0, _dbSchemaTypes.u32)(),
  gen_validator_list_hash_short: (0, _dbSchemaTypes.u32)(),
  before_split: bool(),
  after_split: bool(),
  want_merge: bool(),
  vert_seq_no: (0, _dbSchemaTypes.u32)(),
  start_lt: (0, _dbSchemaTypes.u64)(),
  end_lt: (0, _dbSchemaTypes.u64)(),
  workchain_id: (0, _dbSchemaTypes.i32)(),
  shard: string(),
  min_ref_mc_seqno: (0, _dbSchemaTypes.u32)(),
  value_flow: {
    to_next_blk: (0, _dbSchemaTypes.grams)(),
    to_next_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    exported: (0, _dbSchemaTypes.grams)(),
    exported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    fees_collected: (0, _dbSchemaTypes.grams)(),
    fees_collected_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    created: (0, _dbSchemaTypes.grams)(),
    created_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    imported: (0, _dbSchemaTypes.grams)(),
    imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    from_prev_blk: (0, _dbSchemaTypes.grams)(),
    from_prev_blk_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    minted: (0, _dbSchemaTypes.grams)(),
    minted_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
    fees_imported: (0, _dbSchemaTypes.grams)(),
    fees_imported_other: (0, _dbSchemaTypes.otherCurrencyCollection)()
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
    tr_count: (0, _dbSchemaTypes.i32)()
  }),
  state_update: {
    "new": string(),
    new_hash: string(),
    new_depth: (0, _dbSchemaTypes.u16)(),
    old: string(),
    old_hash: string(),
    old_depth: (0, _dbSchemaTypes.u16)()
  },
  master: {
    shard_hashes: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(),
      shard: string(),
      descr: shardDescr()
    }),
    shard_fees: arrayOf({
      workchain_id: (0, _dbSchemaTypes.i32)(),
      shard: string(),
      fees: (0, _dbSchemaTypes.grams)(),
      fees_other: (0, _dbSchemaTypes.otherCurrencyCollection)(),
      create: (0, _dbSchemaTypes.grams)(),
      create_other: (0, _dbSchemaTypes.otherCurrencyCollection)()
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
      OtherCurrency: _dbSchemaTypes.OtherCurrency,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJfIiwiY29sbGVjdGlvbiIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInByb29mIiwiYm9jIiwiTWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiZXh0QmxrUmVmIiwiTXNnRW52ZWxvcGUiLCJtc2dfaWQiLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwibXNnRW52ZWxvcGUiLCJJbk1zZyIsIm1zZyIsInRyYW5zYWN0aW9uIiwicHJvb2ZfY3JlYXRlZCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsInRyYW5zYWN0aW9uX2lkIiwicHJvb2ZfZGVsaXZlcmVkIiwiaW5Nc2ciLCJPdXRNc2ciLCJyZWltcG9ydCIsImltcG9ydGVkIiwiaW1wb3J0X2Jsb2NrX2x0Iiwib3V0TXNnIiwic2hhcmREZXNjciIsImRvYyIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwid29ya2NoYWluX2lkIiwic2hhcmQiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwibWFzdGVyIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwic2NoZW1hIiwiX2NsYXNzIiwidHlwZXMiLCJPdGhlckN1cnJlbmN5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBa0JB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O0FBR0hNLE1BQUFBLFdBQVcsRUFBWEEsV0FIRztBQUlITSxNQUFBQSxLQUFLLEVBQUxBLEtBSkc7QUFLSFMsTUFBQUEsTUFBTSxFQUFOQSxNQUxHO0FBTUg3RyxNQUFBQSxPQUFPLEVBQVBBLE9BTkc7QUFPSHFJLE1BQUFBLEtBQUssRUFBTEEsS0FQRztBQVFIckosTUFBQUEsT0FBTyxFQUFQQSxPQVJHO0FBU0hpQyxNQUFBQSxXQUFXLEVBQVhBO0FBVEc7QUFESDtBQURZLENBQXhCO2VBZ0Jld0ssTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYSc7XG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVE9OIEFjY291bnQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZSgnQ3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQnKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoJ0NvbnRhaW5zIGVpdGhlciB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHN0b3JhZ2UgcGF5bWVudCBjb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSwgb3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKScpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoJ0lmIHByZXNlbnQsIGFjY3VtdWxhdGVzIHRoZSBzdG9yYWdlIHBheW1lbnRzIHRoYXQgY291bGQgbm90IGJlIGV4YWN0ZWQgZnJvbSB0aGUgYmFsYW5jZSBvZiB0aGUgYWNjb3VudCwgcmVwcmVzZW50ZWQgYnkgYSBzdHJpY3RseSBwb3NpdGl2ZSBhbW91bnQgb2YgbmFub2dyYW1zOyBpdCBjYW4gYmUgcHJlc2VudCBvbmx5IGZvciB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50cyB0aGF0IGhhdmUgYSBiYWxhbmNlIG9mIHplcm8gR3JhbXMgKGJ1dCBtYXkgaGF2ZSBub24temVybyBiYWxhbmNlcyBpbiBvdGhlciBjcnlwdG9jdXJyZW5jaWVzKS4gV2hlbiBkdWVfcGF5bWVudCBiZWNvbWVzIGxhcmdlciB0aGFuIHRoZSB2YWx1ZSBvZiBhIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXIgb2YgdGhlIGJsb2NrY2hhaW4sIHRoZSBhY2NvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC4nKSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoJ0lzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy4nKSxcbiAgICB0aWNrOiBib29sKCdNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLicpLFxuICAgIHRvY2s6IGJvb2woJ01heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uJyksXG4gICAgY29kZTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBjb2RlIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQnKSxcbiAgICBkYXRhOiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NCcpLFxuICAgIGxpYnJhcnk6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBNZXNzYWdlJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoJ01lc3NhZ2UgdHlwZScpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKCdJbnRlcm5hbCBwcm9jZXNzaW5nIHN0YXR1cycpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKCdCbG9jayB0byB3aGljaCB0aGlzIG1lc3NhZ2UgYmVsb25ncycpKSxcbiAgICBib2R5OiBzdHJpbmcoJycpLFxuICAgIHNwbGl0X2RlcHRoOiB1OCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICB0aWNrOiBib29sKCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIHRvY2s6IGJvb2woJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgY29kZTogc3RyaW5nKCdSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgZGF0YTogc3RyaW5nKCdSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoJ1JlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBzcmM6IHN0cmluZygnU291cmNlIGFkZHJlc3MnKSxcbiAgICBkc3Q6IHN0cmluZygnRGVzdGluYXRpb24gYWRkcmVzcycpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NCgnTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uJyksXG4gICAgY3JlYXRlZF9hdDogdTMyKCdDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uJyksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKCdOb3QgZGVzY3JpYmVkIGluIHNwZWMnKSxcbiAgICBpaHJfZmVlOiBncmFtcygnVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS4nKSxcbiAgICBmd2RfZmVlOiBncmFtcygnT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuJyksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoJ05vdCBkZXNjcmliZWQgaW4gc3BlYycpLFxuICAgIGJvdW5jZTogYm9vbCgnQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICBib3VuY2VkOiBib29sKCdCb3VuY2VkIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICB2YWx1ZTogZ3JhbXMoJ0ludGVybmFsIG1lc3NhZ2UgbWF5IGJlYXIgc29tZSB2YWx1ZSBpbiBHcmFtcycpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbignSW50ZXJuYWwgbWVzc2FnZSBtYXkgYmVhciBzb21lIHZhbHVlIGluIG90aGVyIGN1cnJlbmNpZXMnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZSgpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cygpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICBsdDogdTY0KCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmcoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoKSxcbiAgICBub3c6IHUzMigpLFxuICAgIG91dG1zZ19jbnQ6IGkzMigpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKCksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cygpLFxuICAgIGluX21zZzogc3RyaW5nKCksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgbmV3X2hhc2g6IHN0cmluZygpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbCgpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZSgpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcygpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKCksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIGdhc191c2VkOiB1NjQoKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKCksXG4gICAgICAgIG1vZGU6IGk4KCksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKCksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMigpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKCksXG4gICAgICAgIHZhbGlkOiBib29sKCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKCksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcygpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKCksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMigpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKCksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZygpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKCkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcygpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woKSxcbiAgICB0dDogc3RyaW5nKCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OCgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZygpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaW5zdGFsbGVkOiBib29sKCksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG4vLyBCTE9DS1xuXG5jb25zdCBFeHRCbGtSZWY6IFR5cGVEZWYgPSB7XG4gICAgZW5kX2x0OiB1NjQoKSxcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKVxufTtcblxuY29uc3QgZXh0QmxrUmVmID0gKCkgPT4gcmVmKHsgRXh0QmxrUmVmIH0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZTogVHlwZURlZiA9IHtcbiAgICBtc2dfaWQ6IHN0cmluZygpLFxuICAgIG5leHRfYWRkcjogc3RyaW5nKCksXG4gICAgY3VyX2FkZHI6IHN0cmluZygpLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBncmFtcygpLFxufTtcblxuY29uc3QgbXNnRW52ZWxvcGUgPSAoKSA9PiByZWYoeyBNc2dFbnZlbG9wZSB9KTtcblxuY29uc3QgSW5Nc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKGluTXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBpaHJfZmVlOiBncmFtcygpLFxuICAgIHByb29mX2NyZWF0ZWQ6IHN0cmluZygpLFxuICAgIGluX21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICBmd2RfZmVlOiBncmFtcygpLFxuICAgIG91dF9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgdHJhbnNpdF9mZWU6IGdyYW1zKCksXG4gICAgdHJhbnNhY3Rpb25faWQ6IHU2NCgpLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGluTXNnID0gKCkgPT4gcmVmKHsgSW5Nc2cgfSk7XG5cbmNvbnN0IE91dE1zZzogVHlwZURlZiA9IHtcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQob3V0TXNnVHlwZSgpKSxcbiAgICBtc2c6IHN0cmluZygpLFxuICAgIHRyYW5zYWN0aW9uOiBzdHJpbmcoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHJlaW1wb3J0OiBpbk1zZygpLFxuICAgIGltcG9ydGVkOiBpbk1zZygpLFxuICAgIGltcG9ydF9ibG9ja19sdDogdTY0KCksXG59O1xuXG5jb25zdCBvdXRNc2cgPSAoKSA9PiByZWYoeyBPdXRNc2cgfSk7XG5cbmNvbnN0IHNoYXJkRGVzY3IgPSAoZG9jPzogc3RyaW5nKTogVHlwZURlZiA9PiB3aXRoRG9jKHtcbiAgICBzZXFfbm86IHUzMigpLFxuICAgIHJlZ19tY19zZXFubzogdTMyKCksXG4gICAgc3RhcnRfbHQ6IHU2NCgpLFxuICAgIGVuZF9sdDogdTY0KCksXG4gICAgcm9vdF9oYXNoOiBzdHJpbmcoKSxcbiAgICBmaWxlX2hhc2g6IHN0cmluZygpLFxuICAgIGJlZm9yZV9zcGxpdDogYm9vbCgpLFxuICAgIGJlZm9yZV9tZXJnZTogYm9vbCgpLFxuICAgIHdhbnRfc3BsaXQ6IGJvb2woKSxcbiAgICB3YW50X21lcmdlOiBib29sKCksXG4gICAgbnhfY2NfdXBkYXRlZDogYm9vbCgpLFxuICAgIGZsYWdzOiB1OCgpLFxuICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IHUzMigpLFxuICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBzdHJpbmcoKSxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiB1MzIoKSxcbiAgICBnZW5fdXRpbWU6IHUzMigpLFxuICAgIHNwbGl0X3R5cGU6IHNwbGl0VHlwZSgpLFxuICAgIHNwbGl0OiB1MzIoKSxcbiAgICBmZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBmdW5kc19jcmVhdGVkOiBncmFtcygpLFxuICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG59LCBkb2MpO1xuXG5jb25zdCBCbG9jazogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVGhpcyBpcyBCbG9jaycsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzJyB9LFxuICAgIHN0YXR1czogYmxvY2tQcm9jZXNzaW5nU3RhdHVzKCksXG4gICAgZ2xvYmFsX2lkOiB1MzIoKSxcbiAgICB3YW50X3NwbGl0OiBib29sKCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICBhZnRlcl9tZXJnZTogYm9vbCgpLFxuICAgIGdlbl91dGltZTogaTMyKCksXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiB1MzIoKSxcbiAgICBmbGFnczogdTE2KCksXG4gICAgbWFzdGVyX3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfYWx0X3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl92ZXJ0X3JlZjogZXh0QmxrUmVmKCksXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHZlcnNpb246IHUzMigpLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiB1MzIoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woKSxcbiAgICBhZnRlcl9zcGxpdDogYm9vbCgpLFxuICAgIHdhbnRfbWVyZ2U6IGJvb2woKSxcbiAgICB2ZXJ0X3NlcV9ubzogdTMyKCksXG4gICAgc3RhcnRfbHQ6IHU2NCgpLFxuICAgIGVuZF9sdDogdTY0KCksXG4gICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKCksXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogZ3JhbXMoKSxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGV4cG9ydGVkOiBncmFtcygpLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBjcmVhdGVkOiBncmFtcygpLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBpbXBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGdyYW1zKCksXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIG1pbnRlZDogZ3JhbXMoKSxcbiAgICAgICAgbWludGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBncmFtcygpLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBhcnJheU9mKGluTXNnKCkpLFxuICAgIHJhbmRfc2VlZDogc3RyaW5nKCksXG4gICAgb3V0X21zZ19kZXNjcjogYXJyYXlPZihvdXRNc2coKSksXG4gICAgYWNjb3VudF9ibG9ja3M6IGFycmF5T2Yoe1xuICAgICAgICBhY2NvdW50X2FkZHI6IHN0cmluZygpLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGFycmF5T2Yoc3RyaW5nKCkpLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIG5ld19oYXNoOiBzdHJpbmcoKVxuICAgICAgICB9LFxuICAgICAgICB0cl9jb3VudDogaTMyKClcbiAgICB9KSxcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBzdHJpbmcoKSxcbiAgICAgICAgbmV3X2hhc2g6IHN0cmluZygpLFxuICAgICAgICBuZXdfZGVwdGg6IHUxNigpLFxuICAgICAgICBvbGQ6IHN0cmluZygpLFxuICAgICAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgICAgIG9sZF9kZXB0aDogdTE2KClcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBpMzIoKSxcbiAgICAgICAgICAgIHNoYXJkOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIGRlc2NyOiBzaGFyZERlc2NyKCksXG4gICAgICAgIH0pLFxuICAgICAgICBzaGFyZF9mZWVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgICAgICAgICBmZWVzOiBncmFtcygpLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgICAgIGNyZWF0ZTogZ3JhbXMoKSxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgfSksXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogaW5Nc2coKSxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgICAgICBub2RlX2lkOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIHI6IHN0cmluZygpLFxuICAgICAgICAgICAgczogc3RyaW5nKCksXG4gICAgICAgIH0pLFxuICAgIH0sXG59O1xuXG5cbi8vUm9vdCBzY2hlbWUgZGVjbGFyYXRpb25cblxuY29uc3Qgc2NoZW1hOiBUeXBlRGVmID0ge1xuICAgIF9jbGFzczoge1xuICAgICAgICB0eXBlczoge1xuICAgICAgICAgICAgT3RoZXJDdXJyZW5jeSxcbiAgICAgICAgICAgIEV4dEJsa1JlZixcbiAgICAgICAgICAgIE1zZ0VudmVsb3BlLFxuICAgICAgICAgICAgSW5Nc2csXG4gICAgICAgICAgICBPdXRNc2csXG4gICAgICAgICAgICBNZXNzYWdlLFxuICAgICAgICAgICAgQmxvY2ssXG4gICAgICAgICAgICBBY2NvdW50LFxuICAgICAgICAgICAgVHJhbnNhY3Rpb24sXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBzY2hlbWE7XG4iXX0=