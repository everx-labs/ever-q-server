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
}; // BLOCK SIGNATURES

var BlockSignatures = {
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
  },
  signatures: (0, _dbSchemaTypes.join)({
    BlockSignatures: BlockSignatures
  }, 'id')
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
      Transaction: Transaction,
      BlockSignatures: BlockSignatures
    }
  }
};
var _default = schema;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGItc2NoZW1hLmpzIl0sIm5hbWVzIjpbInN0cmluZyIsIkRlZiIsImJvb2wiLCJyZWYiLCJhcnJheU9mIiwiYWNjb3VudFN0YXR1cyIsInVuaW5pdCIsImFjdGl2ZSIsImZyb3plbiIsIm5vbkV4aXN0IiwiYWNjb3VudFN0YXR1c0NoYW5nZSIsInVuY2hhbmdlZCIsImRlbGV0ZWQiLCJza2lwUmVhc29uIiwibm9TdGF0ZSIsImJhZFN0YXRlIiwibm9HYXMiLCJhY2NvdW50VHlwZSIsIm1lc3NhZ2VUeXBlIiwiaW50ZXJuYWwiLCJleHRJbiIsImV4dE91dCIsIm1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzIiwidW5rbm93biIsInF1ZXVlZCIsInByb2Nlc3NpbmciLCJwcmVsaW1pbmFyeSIsInByb3Bvc2VkIiwiZmluYWxpemVkIiwicmVmdXNlZCIsInRyYW5zaXRpbmciLCJ0cmFuc2FjdGlvblR5cGUiLCJvcmRpbmFyeSIsInN0b3JhZ2UiLCJ0aWNrIiwidG9jayIsInNwbGl0UHJlcGFyZSIsInNwbGl0SW5zdGFsbCIsIm1lcmdlUHJlcGFyZSIsIm1lcmdlSW5zdGFsbCIsInRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyIsImNvbXB1dGVUeXBlIiwic2tpcHBlZCIsInZtIiwiYm91bmNlVHlwZSIsIm5lZ0Z1bmRzIiwibm9GdW5kcyIsIm9rIiwiYmxvY2tQcm9jZXNzaW5nU3RhdHVzIiwiaW5Nc2dUeXBlIiwiZXh0ZXJuYWwiLCJpaHIiLCJpbW1lZGlhdGVseSIsInRyYW5zaXQiLCJkaXNjYXJkZWRGaW5hbCIsImRpc2NhcmRlZFRyYW5zaXQiLCJvdXRNc2dUeXBlIiwib3V0TXNnTmV3IiwiZGVxdWV1ZUltbWVkaWF0ZWx5IiwiZGVxdWV1ZSIsInRyYW5zaXRSZXF1aXJlZCIsIm5vbmUiLCJzcGxpdFR5cGUiLCJzcGxpdCIsIm1lcmdlIiwiQWNjb3VudCIsIl9kb2MiLCJfIiwiY29sbGVjdGlvbiIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInByb29mIiwiYm9jIiwiTWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsIlRyYW5zYWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiQmxvY2tTaWduYXR1cmVzIiwic2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJtc2ciLCJ0cmFuc2FjdGlvbiIsInByb29mX2NyZWF0ZWQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsImluTXNnIiwiT3V0TXNnIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm91dE1zZyIsInNoYXJkRGVzY3IiLCJkb2MiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIiwiT3RoZXJDdXJy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QU5FLEtBQUQsQ0FOZjtBQWNKQyxJQUFBQSxrQkFBa0IsRUFBRXhFLEtBQUssRUFkckI7QUFlSnlFLElBQUFBLG1CQUFtQixFQUFFdlEsT0FBTyxDQUFDO0FBQ3pCdUssTUFBQUEsT0FBTyxFQUFFM0ssTUFBTSxFQURVO0FBRXpCNEssTUFBQUEsQ0FBQyxFQUFFNUssTUFBTSxFQUZnQjtBQUd6QjZLLE1BQUFBLENBQUMsRUFBRTdLLE1BQU07QUFIZ0IsS0FBRDtBQWZ4QixHQWpFVztBQXNGbkIwSyxFQUFBQSxVQUFVLEVBQUUseUJBQUs7QUFBRUQsSUFBQUEsZUFBZSxFQUFmQTtBQUFGLEdBQUwsRUFBMEIsSUFBMUI7QUF0Rk8sQ0FBdkIsQyxDQXlGQTs7QUFFQSxJQUFNbUcsTUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxNQUFNLEVBQUU7QUFDSkMsSUFBQUEsS0FBSyxFQUFFO0FBQ0hDLE1BQUFBLGFBQWEsRUFBYkEsNEJBREc7QUFFSGpHLE1BQUFBLFNBQVMsRUFBVEEsU0FGRztBQUdITSxNQUFBQSxXQUFXLEVBQVhBLFdBSEc7QUFJSE0sTUFBQUEsS0FBSyxFQUFMQSxLQUpHO0FBS0hTLE1BQUFBLE1BQU0sRUFBTkEsTUFMRztBQU1IbEgsTUFBQUEsT0FBTyxFQUFQQSxPQU5HO0FBT0gwSSxNQUFBQSxLQUFLLEVBQUxBLEtBUEc7QUFRSDFKLE1BQUFBLE9BQU8sRUFBUEEsT0FSRztBQVNIaUMsTUFBQUEsV0FBVyxFQUFYQSxXQVRHO0FBVUh1RSxNQUFBQSxlQUFlLEVBQWZBO0FBVkc7QUFESDtBQURZLENBQXhCO2VBaUJlbUcsTSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy9AZmxvd1xuXG5pbXBvcnQgeyBEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL2Rpc3Qvc3JjL3NjaGVtYSc7XG5pbXBvcnQgdHlwZSB7IFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHtcbiAgICBncmFtcyxcbiAgICBpMzIsXG4gICAgaTgsXG4gICAgam9pbixcbiAgICBPdGhlckN1cnJlbmN5LFxuICAgIG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIHUxNixcbiAgICB1MzIsXG4gICAgdTY0LFxuICAgIHU4LFxuICAgIHU4ZW51bSxcbiAgICB3aXRoRG9jXG59IGZyb20gXCIuL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5cblxuY29uc3QgYWNjb3VudFN0YXR1cyA9IHU4ZW51bSgnQWNjb3VudFN0YXR1cycsIHtcbiAgICB1bmluaXQ6IDAsXG4gICAgYWN0aXZlOiAxLFxuICAgIGZyb3plbjogMixcbiAgICBub25FeGlzdDogMyxcbn0pO1xuXG5jb25zdCBhY2NvdW50U3RhdHVzQ2hhbmdlID0gdThlbnVtKCdBY2NvdW50U3RhdHVzQ2hhbmdlJywge1xuICAgIHVuY2hhbmdlZDogMCxcbiAgICBmcm96ZW46IDEsXG4gICAgZGVsZXRlZDogMixcbn0pO1xuXG5jb25zdCBza2lwUmVhc29uID0gdThlbnVtKCdTa2lwUmVhc29uJywge1xuICAgIG5vU3RhdGU6IDAsXG4gICAgYmFkU3RhdGU6IDEsXG4gICAgbm9HYXM6IDIsXG59KTtcblxuXG5jb25zdCBhY2NvdW50VHlwZSA9IHU4ZW51bSgnQWNjb3VudFR5cGUnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG59KTtcblxuY29uc3QgbWVzc2FnZVR5cGUgPSB1OGVudW0oJ01lc3NhZ2VUeXBlJywge1xuICAgIGludGVybmFsOiAwLFxuICAgIGV4dEluOiAxLFxuICAgIGV4dE91dDogMixcbn0pO1xuXG5cbmNvbnN0IG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzID0gdThlbnVtKCdNZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHF1ZXVlZDogMSxcbiAgICBwcm9jZXNzaW5nOiAyLFxuICAgIHByZWxpbWluYXJ5OiAzLFxuICAgIHByb3Bvc2VkOiA0LFxuICAgIGZpbmFsaXplZDogNSxcbiAgICByZWZ1c2VkOiA2LFxuICAgIHRyYW5zaXRpbmc6IDcsXG59KTtcblxuY29uc3QgdHJhbnNhY3Rpb25UeXBlID0gdThlbnVtKCdUcmFuc2FjdGlvblR5cGUnLCB7XG4gICAgb3JkaW5hcnk6IDAsXG4gICAgc3RvcmFnZTogMSxcbiAgICB0aWNrOiAyLFxuICAgIHRvY2s6IDMsXG4gICAgc3BsaXRQcmVwYXJlOiA0LFxuICAgIHNwbGl0SW5zdGFsbDogNSxcbiAgICBtZXJnZVByZXBhcmU6IDYsXG4gICAgbWVyZ2VJbnN0YWxsOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnVHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJlbGltaW5hcnk6IDEsXG4gICAgcHJvcG9zZWQ6IDIsXG4gICAgZmluYWxpemVkOiAzLFxuICAgIHJlZnVzZWQ6IDQsXG59KTtcblxuY29uc3QgY29tcHV0ZVR5cGUgPSB1OGVudW0oJ0NvbXB1dGVUeXBlJywge1xuICAgIHNraXBwZWQ6IDAsXG4gICAgdm06IDEsXG59KTtcblxuY29uc3QgYm91bmNlVHlwZSA9IHU4ZW51bSgnQm91bmNlVHlwZScsIHtcbiAgICBuZWdGdW5kczogMCxcbiAgICBub0Z1bmRzOiAxLFxuICAgIG9rOiAyLFxufSk7XG5cbmNvbnN0IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnQmxvY2tQcm9jZXNzaW5nU3RhdHVzJywge1xuICAgIHVua25vd246IDAsXG4gICAgcHJvcG9zZWQ6IDEsXG4gICAgZmluYWxpemVkOiAyLFxuICAgIHJlZnVzZWQ6IDMsXG59KTtcblxuXG5jb25zdCBpbk1zZ1R5cGUgPSB1OGVudW0oJ0luTXNnVHlwZScsIHtcbiAgICBleHRlcm5hbDogMCxcbiAgICBpaHI6IDEsXG4gICAgaW1tZWRpYXRlbHk6IDIsXG4gICAgZmluYWw6IDMsXG4gICAgdHJhbnNpdDogNCxcbiAgICBkaXNjYXJkZWRGaW5hbDogNSxcbiAgICBkaXNjYXJkZWRUcmFuc2l0OiA2LFxufSk7XG5cbmNvbnN0IG91dE1zZ1R5cGUgPSB1OGVudW0oJ091dE1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaW1tZWRpYXRlbHk6IDEsXG4gICAgb3V0TXNnTmV3OiAyLFxuICAgIHRyYW5zaXQ6IDMsXG4gICAgZGVxdWV1ZUltbWVkaWF0ZWx5OiA0LFxuICAgIGRlcXVldWU6IDUsXG4gICAgdHJhbnNpdFJlcXVpcmVkOiA2LFxuICAgIG5vbmU6IC0xLFxufSk7XG5cbmNvbnN0IHNwbGl0VHlwZSA9IHU4ZW51bSgnU3BsaXRUeXBlJywge1xuICAgIG5vbmU6IDAsXG4gICAgc3BsaXQ6IDIsXG4gICAgbWVyZ2U6IDMsXG59KTtcblxuY29uc3QgQWNjb3VudDogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnVE9OIEFjY291bnQnLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2FjY291bnRzJyB9LFxuICAgIGFjY190eXBlOiByZXF1aXJlZChhY2NvdW50VHlwZSgnQ3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQnKSksXG4gICAgbGFzdF9wYWlkOiByZXF1aXJlZCh1MzIoJ0NvbnRhaW5zIGVpdGhlciB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHN0b3JhZ2UgcGF5bWVudCBjb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSwgb3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKScpKSxcbiAgICBkdWVfcGF5bWVudDogZ3JhbXMoJ0lmIHByZXNlbnQsIGFjY3VtdWxhdGVzIHRoZSBzdG9yYWdlIHBheW1lbnRzIHRoYXQgY291bGQgbm90IGJlIGV4YWN0ZWQgZnJvbSB0aGUgYmFsYW5jZSBvZiB0aGUgYWNjb3VudCwgcmVwcmVzZW50ZWQgYnkgYSBzdHJpY3RseSBwb3NpdGl2ZSBhbW91bnQgb2YgbmFub2dyYW1zOyBpdCBjYW4gYmUgcHJlc2VudCBvbmx5IGZvciB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50cyB0aGF0IGhhdmUgYSBiYWxhbmNlIG9mIHplcm8gR3JhbXMgKGJ1dCBtYXkgaGF2ZSBub24temVybyBiYWxhbmNlcyBpbiBvdGhlciBjcnlwdG9jdXJyZW5jaWVzKS4gV2hlbiBkdWVfcGF5bWVudCBiZWNvbWVzIGxhcmdlciB0aGFuIHRoZSB2YWx1ZSBvZiBhIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXIgb2YgdGhlIGJsb2NrY2hhaW4sIHRoZSBhY2NvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC4nKSxcbiAgICBsYXN0X3RyYW5zX2x0OiByZXF1aXJlZCh1NjQoKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZTogcmVxdWlyZWQoZ3JhbXMoKSksIC8vIGluZGV4XG4gICAgYmFsYW5jZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoJ0lzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy4nKSxcbiAgICB0aWNrOiBib29sKCdNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLicpLFxuICAgIHRvY2s6IGJvb2woJ01heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uJyksXG4gICAgY29kZTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBjb2RlIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQnKSxcbiAgICBkYXRhOiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NCcpLFxuICAgIGxpYnJhcnk6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cbmNvbnN0IE1lc3NhZ2U6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBNZXNzYWdlJyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdtZXNzYWdlcycgfSxcbiAgICBtc2dfdHlwZTogcmVxdWlyZWQobWVzc2FnZVR5cGUoJ01lc3NhZ2UgdHlwZScpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKG1lc3NhZ2VQcm9jZXNzaW5nU3RhdHVzKCdJbnRlcm5hbCBwcm9jZXNzaW5nIHN0YXR1cycpKSxcbiAgICBibG9ja19pZDogcmVxdWlyZWQoc3RyaW5nKCdCbG9jayB0byB3aGljaCB0aGlzIG1lc3NhZ2UgYmVsb25ncycpKSxcbiAgICBib2R5OiBzdHJpbmcoJycpLFxuICAgIHNwbGl0X2RlcHRoOiB1OCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICB0aWNrOiBib29sKCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIHRvY2s6IGJvb2woJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgY29kZTogc3RyaW5nKCdSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgZGF0YTogc3RyaW5nKCdSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoJ1JlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXMnKSxcbiAgICBzcmM6IHN0cmluZygnU291cmNlIGFkZHJlc3MnKSxcbiAgICBkc3Q6IHN0cmluZygnRGVzdGluYXRpb24gYWRkcmVzcycpLFxuICAgIGNyZWF0ZWRfbHQ6IHU2NCgnTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uJyksXG4gICAgY3JlYXRlZF9hdDogdTMyKCdDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uJyksXG4gICAgaWhyX2Rpc2FibGVkOiBib29sKCdOb3QgZGVzY3JpYmVkIGluIHNwZWMnKSxcbiAgICBpaHJfZmVlOiBncmFtcygnVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS4nKSxcbiAgICBmd2RfZmVlOiBncmFtcygnT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuJyksXG4gICAgaW1wb3J0X2ZlZTogZ3JhbXMoJ05vdCBkZXNjcmliZWQgaW4gc3BlYycpLFxuICAgIGJvdW5jZTogYm9vbCgnQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICBib3VuY2VkOiBib29sKCdCb3VuY2VkIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4nKSxcbiAgICB2YWx1ZTogZ3JhbXMoJ0ludGVybmFsIG1lc3NhZ2UgbWF5IGJlYXIgc29tZSB2YWx1ZSBpbiBHcmFtcycpLFxuICAgIHZhbHVlX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbignSW50ZXJuYWwgbWVzc2FnZSBtYXkgYmVhciBzb21lIHZhbHVlIGluIG90aGVyIGN1cnJlbmNpZXMnKSxcbiAgICBwcm9vZjogc3RyaW5nKCksXG4gICAgYm9jOiBzdHJpbmcoKSxcbn07XG5cblxuY29uc3QgVHJhbnNhY3Rpb246IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgIHRyX3R5cGU6IHJlcXVpcmVkKHRyYW5zYWN0aW9uVHlwZSgpKSxcbiAgICBzdGF0dXM6IHJlcXVpcmVkKHRyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cygpKSxcbiAgICBibG9ja19pZDogc3RyaW5nKCksXG4gICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICBsdDogdTY0KCksXG4gICAgcHJldl90cmFuc19oYXNoOiBzdHJpbmcoKSxcbiAgICBwcmV2X3RyYW5zX2x0OiB1NjQoKSxcbiAgICBub3c6IHUzMigpLFxuICAgIG91dG1zZ19jbnQ6IGkzMigpLFxuICAgIG9yaWdfc3RhdHVzOiBhY2NvdW50U3RhdHVzKCksXG4gICAgZW5kX3N0YXR1czogYWNjb3VudFN0YXR1cygpLFxuICAgIGluX21zZzogc3RyaW5nKCksXG4gICAgaW5fbWVzc2FnZTogam9pbih7IE1lc3NhZ2UgfSwgJ2luX21zZycpLFxuICAgIG91dF9tc2dzOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICBvdXRfbWVzc2FnZXM6IGFycmF5T2Yoam9pbih7IE1lc3NhZ2UgfSwgJ291dF9tc2dzJykpLFxuICAgIHRvdGFsX2ZlZXM6IGdyYW1zKCksXG4gICAgdG90YWxfZmVlc19vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgbmV3X2hhc2g6IHN0cmluZygpLFxuICAgIGNyZWRpdF9maXJzdDogYm9vbCgpLFxuICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogZ3JhbXMoKSxcbiAgICAgICAgc3RhdHVzX2NoYW5nZTogYWNjb3VudFN0YXR1c0NoYW5nZSgpLFxuICAgIH0sXG4gICAgY3JlZGl0OiB7XG4gICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlZGl0OiBncmFtcygpLFxuICAgICAgICBjcmVkaXRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgfSxcbiAgICBjb21wdXRlOiB7XG4gICAgICAgIGNvbXB1dGVfdHlwZTogcmVxdWlyZWQoY29tcHV0ZVR5cGUoKSksXG4gICAgICAgIHNraXBwZWRfcmVhc29uOiBza2lwUmVhc29uKCksXG4gICAgICAgIHN1Y2Nlc3M6IGJvb2woKSxcbiAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGJvb2woKSxcbiAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGJvb2woKSxcbiAgICAgICAgZ2FzX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIGdhc191c2VkOiB1NjQoKSxcbiAgICAgICAgZ2FzX2xpbWl0OiB1NjQoKSxcbiAgICAgICAgZ2FzX2NyZWRpdDogaTMyKCksXG4gICAgICAgIG1vZGU6IGk4KCksXG4gICAgICAgIGV4aXRfY29kZTogaTMyKCksXG4gICAgICAgIGV4aXRfYXJnOiBpMzIoKSxcbiAgICAgICAgdm1fc3RlcHM6IHUzMigpLFxuICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHN0cmluZygpLFxuICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIGFjdGlvbjoge1xuICAgICAgICBzdWNjZXNzOiBib29sKCksXG4gICAgICAgIHZhbGlkOiBib29sKCksXG4gICAgICAgIG5vX2Z1bmRzOiBib29sKCksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoKSxcbiAgICAgICAgdG90YWxfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBncmFtcygpLFxuICAgICAgICByZXN1bHRfY29kZTogaTMyKCksXG4gICAgICAgIHJlc3VsdF9hcmc6IGkzMigpLFxuICAgICAgICB0b3RfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNwZWNfYWN0aW9uczogaTMyKCksXG4gICAgICAgIHNraXBwZWRfYWN0aW9uczogaTMyKCksXG4gICAgICAgIG1zZ3NfY3JlYXRlZDogaTMyKCksXG4gICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IHN0cmluZygpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgIH0sXG4gICAgYm91bmNlOiB7XG4gICAgICAgIGJvdW5jZV90eXBlOiByZXF1aXJlZChib3VuY2VUeXBlKCkpLFxuICAgICAgICBtc2dfc2l6ZV9jZWxsczogdTMyKCksXG4gICAgICAgIG1zZ19zaXplX2JpdHM6IHUzMigpLFxuICAgICAgICByZXFfZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgICAgIG1zZ19mZWVzOiBncmFtcygpLFxuICAgICAgICBmd2RfZmVlczogZ3JhbXMoKSxcbiAgICB9LFxuICAgIGFib3J0ZWQ6IGJvb2woKSxcbiAgICBkZXN0cm95ZWQ6IGJvb2woKSxcbiAgICB0dDogc3RyaW5nKCksXG4gICAgc3BsaXRfaW5mbzoge1xuICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogdTgoKSxcbiAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiB1OCgpLFxuICAgICAgICB0aGlzX2FkZHI6IHN0cmluZygpLFxuICAgICAgICBzaWJsaW5nX2FkZHI6IHN0cmluZygpLFxuICAgIH0sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaW5zdGFsbGVkOiBib29sKCksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG4vLyBCTE9DSyBTSUdOQVRVUkVTXG5cbmNvbnN0IEJsb2NrU2lnbmF0dXJlczogVHlwZURlZiA9IHtcbiAgICBfZG9jOiAnU2V0IG9mIHZhbGlkYXRvclxcJ3Mgc2lnbmF0dXJlcyBmb3IgdGhlIEJsb2NrIHdpdGggY29ycmVzcG9uZCBpZCcsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnYmxvY2tzX3NpZ25hdHVyZXMnIH0sXG4gICAgc2lnbmF0dXJlczogYXJyYXlPZih7XG4gICAgICAgIG5vZGVfaWQ6IHN0cmluZyhcIlZhbGlkYXRvciBJRFwiKSxcbiAgICAgICAgcjogc3RyaW5nKFwiJ1InIHBhcnQgb2Ygc2lnbmF0dXJlXCIpLFxuICAgICAgICBzOiBzdHJpbmcoXCIncycgcGFydCBvZiBzaWduYXR1cmVcIiksXG4gICAgfSwgXCJBcnJheSBvZiBzaWduYXR1cmVzIGZyb20gYmxvY2sncyB2YWxpZGF0b3JzXCIpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9ICgpID0+IHJlZih7IEV4dEJsa1JlZiB9KTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiB1NjQoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9ICgpID0+IHJlZih7IEluTXNnIH0pO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKCkgPT4gcmVmKHsgT3V0TXNnIH0pO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woKSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woKSxcbiAgICB3YW50X3NwbGl0OiBib29sKCksXG4gICAgd2FudF9tZXJnZTogYm9vbCgpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woKSxcbiAgICBmbGFnczogdTgoKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKCksXG4gICAgZ2VuX3V0aW1lOiB1MzIoKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoKSxcbiAgICBzcGxpdDogdTMyKCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxufSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cygpLFxuICAgIGdsb2JhbF9pZDogdTMyKCksXG4gICAgd2FudF9zcGxpdDogYm9vbCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woKSxcbiAgICBnZW5fdXRpbWU6IGkzMigpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKCksXG4gICAgZmxhZ3M6IHUxNigpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoKSxcbiAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woKSxcbiAgICB3YW50X21lcmdlOiBib29sKCksXG4gICAgdmVydF9zZXFfbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgc2hhcmQ6IHN0cmluZygpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMigpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKCksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcygpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZygpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZygpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKCkpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICBuZXdfaGFzaDogc3RyaW5nKClcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGkzMigpXG4gICAgfSksXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNigpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZygpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKCksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKCksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKCksXG4gICAgICAgICAgICByOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIHM6IHN0cmluZygpLFxuICAgICAgICB9KSxcbiAgICB9LFxuICAgIHNpZ25hdHVyZXM6IGpvaW4oeyBCbG9ja1NpZ25hdHVyZXMgfSwgJ2lkJyksXG59O1xuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICAgICAgQmxvY2tTaWduYXR1cmVzLFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19