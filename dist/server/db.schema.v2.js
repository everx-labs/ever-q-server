"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _schema = require("ton-labs-dev-ops/dist/src/schema");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var string = _schema.Def.string,
    bool = _schema.Def.bool,
    ref = _schema.Def.ref,
    arrayOf = _schema.Def.arrayOf;

var join = function join(refDef, on) {
  return _objectSpread({}, ref(refDef), {
    _: {
      join: {
        on: on
      }
    }
  });
};

var withDoc = function withDoc(def, doc) {
  return _objectSpread({}, def, {}, doc ? {
    _doc: doc
  } : {});
};

var required = function required(def) {
  return def;
};

var uint = function uint(size, doc) {
  return withDoc({
    _int: {
      unsigned: true,
      size: size
    }
  }, doc);
};

var _int = function _int(size, doc) {
  return withDoc({
    _int: {
      unsigned: false,
      size: size
    }
  }, doc);
};

var i8 = function i8(doc) {
  return _int(8, doc);
};

var i32 = function i32(doc) {
  return _int(32, doc);
};

var u8 = function u8(doc) {
  return uint(8, doc);
};

var u16 = function u16(doc) {
  return uint(16, doc);
};

var u32 = function u32(doc) {
  return uint(32, doc);
};

var u64 = function u64(doc) {
  return uint(64, doc);
};

var u128 = function u128(doc) {
  return uint(128, doc);
};

var u256 = function u256(doc) {
  return uint(256, doc);
};

var grams = u128;

function u8enum(name, values) {
  return function (doc) {
    var valuesDoc = Object.entries(values).map(function (_ref) {
      var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
          name = _ref2[0],
          value = _ref2[1];

      return "".concat(value, " \u2013 ").concat(name);
    }).join('\n');
    var effectiveDoc = "".concat(doc ? "".concat(doc, "\n") : '').concat(valuesDoc);
    return withDoc({
      _int: {
        unsigned: true,
        size: 8
      },
      _: {
        "enum": {
          name: name,
          values: values
        }
      }
    }, effectiveDoc);
  };
}

var OtherCurrency = {
  currency: u32(),
  value: u256()
};

var otherCurrencyCollection = function otherCurrencyCollection(doc) {
  return arrayOf(ref({
    OtherCurrency: OtherCurrency
  }), doc);
};

var accountStatus = u8enum('AccountStatus', {
  uninit: 0,
  active: 1,
  frozen: 2,
  nonExist: 3
});
var accountStatusChange = u8enum('AccountStatusChange', {
  unchanged: 0,
  frozen: 1,
  deleted: 2
});
var skipReason = u8enum('SkipReason', {
  noState: 0,
  badState: 1,
  noGas: 2
});
var accountType = u8enum('AccountType', {
  uninit: 0,
  active: 1,
  frozen: 2
});
var messageType = u8enum('MessageType', {
  internal: 0,
  extIn: 1,
  extOut: 2
});
var messageProcessingStatus = u8enum('MessageProcessingStatus', {
  unknown: 0,
  queued: 1,
  processing: 2,
  preliminary: 3,
  proposed: 4,
  finalized: 5,
  refused: 6,
  transiting: 7
});
var transactionType = u8enum('TransactionType', {
  ordinary: 0,
  storage: 1,
  tick: 2,
  tock: 3,
  splitPrepare: 4,
  splitInstall: 5,
  mergePrepare: 6,
  mergeInstall: 7
});
var transactionProcessingStatus = u8enum('TransactionProcessingStatus', {
  unknown: 0,
  preliminary: 1,
  proposed: 2,
  finalized: 3,
  refused: 4
});
var computeType = u8enum('ComputeType', {
  skipped: 0,
  vm: 1
});
var bounceType = u8enum('BounceType', {
  negFunds: 0,
  noFunds: 1,
  ok: 2
});
var blockProcessingStatus = u8enum('BlockProcessingStatus', {
  unknown: 0,
  proposed: 1,
  finalized: 2,
  refused: 3
});
var inMsgType = u8enum('InMsgType', {
  external: 0,
  ihr: 1,
  immediately: 2,
  "final": 3,
  transit: 4,
  discardedFinal: 5,
  discardedTransit: 6
});
var outMsgType = u8enum('OutMsgType', {
  external: 0,
  immediately: 1,
  outMsgNew: 2,
  transit: 3,
  dequeueImmediately: 4,
  dequeue: 5,
  transitRequired: 6,
  none: -1
});
var splitType = u8enum('SplitType', {
  none: 0,
  split: 2,
  merge: 3
});
var Account = {
  _doc: 'TON Account',
  _: {
    collection: 'accounts'
  },
  acc_type: required(accountType('Current status of the account')),
  last_paid: required(u32('Contains either the unixtime of the most recent storage payment collected (usually this is the unixtime of the most recent transaction), or the unixtime when the account was created (again, by a transaction)')),
  due_payment: grams('If present, accumulates the storage payments that could not be exacted from the balance of the account, represented by a strictly positive amount of nanograms; it can be present only for uninitialized or frozen accounts that have a balance of zero Grams (but may have non-zero balances in other cryptocurrencies). When due_payment becomes larger than the value of a configurable parameter of the blockchain, the account is destroyed altogether, and its balance, if any, is transferred to the zero account.'),
  last_trans_lt: required(u64()),
  balance: required(grams()),
  balance_other: otherCurrencyCollection(),
  split_depth: u8('Is present and non-zero only in instances of large smart contracts.'),
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
  msg_type: required(messageType('Message type')),
  status: required(messageProcessingStatus('Internal processing status')),
  block_id: required(string('Block to which this message belongs')),
  body: string(''),
  split_depth: u8('Used in deploy message for special contracts in masterchain'),
  tick: bool('Used in deploy message for special contracts in masterchain'),
  tock: bool('Used in deploy message for special contracts in masterchain'),
  code: string('Represents contract code in deploy messages'),
  data: string('Represents initial data for a contract in deploy messages'),
  library: string('Represents contract library in deploy messages'),
  src: string('Source address'),
  dst: string('Destination address'),
  created_lt: u64('Logical creation time automatically set by the generating transaction'),
  created_at: u32('Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction.'),
  ihr_disabled: bool('Not described in spec'),
  ihr_fee: grams('This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism.'),
  fwd_fee: grams('Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated.'),
  import_fee: grams('Not described in spec'),
  bounce: bool('Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  bounced: bool('Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.'),
  value: grams('Internal message may bear some value in Grams'),
  value_other: otherCurrencyCollection('Internal message may bear some value in other currencies'),
  proof: string(),
  boc: string()
};
var Transaction = {
  _doc: 'TON Transaction',
  _: {
    collection: 'transactions'
  },
  tr_type: required(transactionType()),
  status: required(transactionProcessingStatus()),
  block_id: string(),
  account_addr: string(),
  lt: u64(),
  prev_trans_hash: string(),
  prev_trans_lt: u64(),
  now: u32(),
  outmsg_cnt: i32(),
  orig_status: accountStatus(),
  end_status: accountStatus(),
  in_msg: string(),
  in_message: join({
    Message: Message
  }, 'in_msg'),
  out_msgs: arrayOf(string()),
  out_messages: arrayOf(join({
    Message: Message
  }, 'out_msgs')),
  total_fees: grams(),
  total_fees_other: otherCurrencyCollection(),
  old_hash: string(),
  new_hash: string(),
  credit_first: bool(),
  storage: {
    storage_fees_collected: grams(),
    storage_fees_due: grams(),
    status_change: accountStatusChange()
  },
  credit: {
    due_fees_collected: grams(),
    credit: grams(),
    credit_other: otherCurrencyCollection()
  },
  compute: {
    compute_type: required(computeType()),
    skipped_reason: skipReason(),
    success: bool(),
    msg_state_used: bool(),
    account_activated: bool(),
    gas_fees: grams(),
    gas_used: u64(),
    gas_limit: u64(),
    gas_credit: i32(),
    mode: i8(),
    exit_code: i32(),
    exit_arg: i32(),
    vm_steps: u32(),
    vm_init_state_hash: string(),
    vm_final_state_hash: string()
  },
  action: {
    success: bool(),
    valid: bool(),
    no_funds: bool(),
    status_change: accountStatusChange(),
    total_fwd_fees: grams(),
    total_action_fees: grams(),
    result_code: i32(),
    result_arg: i32(),
    tot_actions: i32(),
    spec_actions: i32(),
    skipped_actions: i32(),
    msgs_created: i32(),
    action_list_hash: string(),
    total_msg_size_cells: u32(),
    total_msg_size_bits: u32()
  },
  bounce: {
    bounce_type: required(bounceType()),
    msg_size_cells: u32(),
    msg_size_bits: u32(),
    req_fwd_fees: grams(),
    msg_fees: grams(),
    fwd_fees: grams()
  },
  aborted: bool(),
  destroyed: bool(),
  tt: string(),
  split_info: {
    cur_shard_pfx_len: u8(),
    acc_split_depth: u8(),
    this_addr: string(),
    sibling_addr: string()
  },
  prepare_transaction: string(),
  installed: bool(),
  proof: string(),
  boc: string()
}; // BLOCK

var ExtBlkRef = {
  end_lt: u64(),
  seq_no: u32(),
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
  fwd_fee_remaining: grams()
};

var msgEnvelope = function msgEnvelope() {
  return ref({
    MsgEnvelope: MsgEnvelope
  });
};

var InMsg = {
  msg_type: required(inMsgType()),
  msg: string(),
  transaction: string(),
  ihr_fee: grams(),
  proof_created: string(),
  in_msg: msgEnvelope(),
  fwd_fee: grams(),
  out_msg: msgEnvelope(),
  transit_fee: grams(),
  transaction_id: u64(),
  proof_delivered: string()
};

var inMsg = function inMsg() {
  return ref({
    InMsg: InMsg
  });
};

var OutMsg = {
  msg_type: required(outMsgType()),
  msg: string(),
  transaction: string(),
  out_msg: msgEnvelope(),
  reimport: inMsg(),
  imported: inMsg(),
  import_block_lt: u64()
};

var outMsg = function outMsg() {
  return ref({
    OutMsg: OutMsg
  });
};

var shardDescr = function shardDescr(doc) {
  return withDoc({
    seq_no: u32(),
    reg_mc_seqno: u32(),
    start_lt: u64(),
    end_lt: u64(),
    root_hash: string(),
    file_hash: string(),
    before_split: bool(),
    before_merge: bool(),
    want_split: bool(),
    want_merge: bool(),
    nx_cc_updated: bool(),
    flags: u8(),
    next_catchain_seqno: u32(),
    next_validator_shard: string(),
    min_ref_mc_seqno: u32(),
    gen_utime: u32(),
    split_type: splitType(),
    split: u32(),
    fees_collected: grams(),
    fees_collected_other: otherCurrencyCollection(),
    funds_created: grams(),
    funds_created_other: otherCurrencyCollection()
  }, doc);
};

var Block = {
  _doc: 'This is Block',
  _: {
    collection: 'blocks'
  },
  status: blockProcessingStatus(),
  global_id: u32(),
  want_split: bool(),
  seq_no: u32(),
  after_merge: bool(),
  gen_utime: i32(),
  gen_catchain_seqno: u32(),
  flags: u16(),
  master_ref: extBlkRef(),
  prev_ref: extBlkRef(),
  prev_alt_ref: extBlkRef(),
  prev_vert_ref: extBlkRef(),
  prev_vert_alt_ref: extBlkRef(),
  version: u32(),
  gen_validator_list_hash_short: u32(),
  before_split: bool(),
  after_split: bool(),
  want_merge: bool(),
  vert_seq_no: u32(),
  start_lt: u64(),
  end_lt: u64(),
  workchain_id: i32(),
  shard: string(),
  min_ref_mc_seqno: u32(),
  value_flow: {
    to_next_blk: grams(),
    to_next_blk_other: otherCurrencyCollection(),
    exported: grams(),
    exported_other: otherCurrencyCollection(),
    fees_collected: grams(),
    fees_collected_other: otherCurrencyCollection(),
    created: grams(),
    created_other: otherCurrencyCollection(),
    imported: grams(),
    imported_other: otherCurrencyCollection(),
    from_prev_blk: grams(),
    from_prev_blk_other: otherCurrencyCollection(),
    minted: grams(),
    minted_other: otherCurrencyCollection(),
    fees_imported: grams(),
    fees_imported_other: otherCurrencyCollection()
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
    tr_count: i32()
  }),
  state_update: {
    "new": string(),
    new_hash: string(),
    new_depth: u16(),
    old: string(),
    old_hash: string(),
    old_depth: u16()
  },
  master: {
    shard_hashes: arrayOf({
      workchain_id: i32(),
      shard: string(),
      descr: shardDescr()
    }),
    shard_fees: arrayOf({
      workchain_id: i32(),
      shard: string(),
      fees: grams(),
      fees_other: otherCurrencyCollection(),
      create: grams(),
      create_other: otherCurrencyCollection()
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
      OtherCurrency: OtherCurrency,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi5zY2hlbWEudjIuanMiXSwibmFtZXMiOlsic3RyaW5nIiwiRGVmIiwiYm9vbCIsInJlZiIsImFycmF5T2YiLCJqb2luIiwicmVmRGVmIiwib24iLCJfIiwid2l0aERvYyIsImRlZiIsImRvYyIsIl9kb2MiLCJyZXF1aXJlZCIsInVpbnQiLCJzaXplIiwiX2ludCIsInVuc2lnbmVkIiwiaW50IiwiaTgiLCJpMzIiLCJ1OCIsInUxNiIsInUzMiIsInU2NCIsInUxMjgiLCJ1MjU2IiwiZ3JhbXMiLCJ1OGVudW0iLCJuYW1lIiwidmFsdWVzIiwidmFsdWVzRG9jIiwiT2JqZWN0IiwiZW50cmllcyIsIm1hcCIsInZhbHVlIiwiZWZmZWN0aXZlRG9jIiwiT3RoZXJDdXJyZW5jeSIsImN1cnJlbmN5Iiwib3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24iLCJhY2NvdW50U3RhdHVzIiwidW5pbml0IiwiYWN0aXZlIiwiZnJvemVuIiwibm9uRXhpc3QiLCJhY2NvdW50U3RhdHVzQ2hhbmdlIiwidW5jaGFuZ2VkIiwiZGVsZXRlZCIsInNraXBSZWFzb24iLCJub1N0YXRlIiwiYmFkU3RhdGUiLCJub0dhcyIsImFjY291bnRUeXBlIiwibWVzc2FnZVR5cGUiLCJpbnRlcm5hbCIsImV4dEluIiwiZXh0T3V0IiwibWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMiLCJ1bmtub3duIiwicXVldWVkIiwicHJvY2Vzc2luZyIsInByZWxpbWluYXJ5IiwicHJvcG9zZWQiLCJmaW5hbGl6ZWQiLCJyZWZ1c2VkIiwidHJhbnNpdGluZyIsInRyYW5zYWN0aW9uVHlwZSIsIm9yZGluYXJ5Iiwic3RvcmFnZSIsInRpY2siLCJ0b2NrIiwic3BsaXRQcmVwYXJlIiwic3BsaXRJbnN0YWxsIiwibWVyZ2VQcmVwYXJlIiwibWVyZ2VJbnN0YWxsIiwidHJhbnNhY3Rpb25Qcm9jZXNzaW5nU3RhdHVzIiwiY29tcHV0ZVR5cGUiLCJza2lwcGVkIiwidm0iLCJib3VuY2VUeXBlIiwibmVnRnVuZHMiLCJub0Z1bmRzIiwib2siLCJibG9ja1Byb2Nlc3NpbmdTdGF0dXMiLCJpbk1zZ1R5cGUiLCJleHRlcm5hbCIsImlociIsImltbWVkaWF0ZWx5IiwidHJhbnNpdCIsImRpc2NhcmRlZEZpbmFsIiwiZGlzY2FyZGVkVHJhbnNpdCIsIm91dE1zZ1R5cGUiLCJvdXRNc2dOZXciLCJkZXF1ZXVlSW1tZWRpYXRlbHkiLCJkZXF1ZXVlIiwidHJhbnNpdFJlcXVpcmVkIiwibm9uZSIsInNwbGl0VHlwZSIsInNwbGl0IiwibWVyZ2UiLCJBY2NvdW50IiwiY29sbGVjdGlvbiIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsInByb29mIiwiYm9jIiwiTWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5Iiwic3JjIiwiZHN0IiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWVfb3RoZXIiLCJUcmFuc2FjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImV4dEJsa1JlZiIsIk1zZ0VudmVsb3BlIiwibXNnX2lkIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIm1zZ0VudmVsb3BlIiwiSW5Nc2ciLCJtc2ciLCJ0cmFuc2FjdGlvbiIsInByb29mX2NyZWF0ZWQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJ0cmFuc2FjdGlvbl9pZCIsInByb29mX2RlbGl2ZXJlZCIsImluTXNnIiwiT3V0TXNnIiwicmVpbXBvcnQiLCJpbXBvcnRlZCIsImltcG9ydF9ibG9ja19sdCIsIm91dE1zZyIsInNoYXJkRGVzY3IiLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJCbG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsInNoYXJkX2hhc2hlcyIsImRlc2NyIiwic2hhcmRfZmVlcyIsImZlZXMiLCJmZWVzX290aGVyIiwiY3JlYXRlIiwiY3JlYXRlX290aGVyIiwicmVjb3Zlcl9jcmVhdGVfbXNnIiwicHJldl9ibGtfc2lnbmF0dXJlcyIsIm5vZGVfaWQiLCJyIiwicyIsInNjaGVtYSIsIl9jbGFzcyIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBbUJBOzs7Ozs7SUFFUUEsTSxHQUErQkMsVyxDQUEvQkQsTTtJQUFRRSxJLEdBQXVCRCxXLENBQXZCQyxJO0lBQU1DLEcsR0FBaUJGLFcsQ0FBakJFLEc7SUFBS0MsTyxHQUFZSCxXLENBQVpHLE87O0FBQzNCLElBQU1DLElBQUksR0FBRyxTQUFQQSxJQUFPLENBQUNDLE1BQUQsRUFBZ0NDLEVBQWhDLEVBQXdEO0FBQ2pFLDJCQUFZSixHQUFHLENBQUNHLE1BQUQsQ0FBZjtBQUF5QkUsSUFBQUEsQ0FBQyxFQUFFO0FBQUVILE1BQUFBLElBQUksRUFBRTtBQUFFRSxRQUFBQSxFQUFFLEVBQUZBO0FBQUY7QUFBUjtBQUE1QjtBQUNILENBRkQ7O0FBR0EsSUFBTUUsT0FBTyxHQUFHLFNBQVZBLE9BQVUsQ0FBQ0MsR0FBRCxFQUFlQyxHQUFmO0FBQUEsMkJBQ1RELEdBRFMsTUFFUkMsR0FBRyxHQUFHO0FBQUVDLElBQUFBLElBQUksRUFBRUQ7QUFBUixHQUFILEdBQW1CLEVBRmQ7QUFBQSxDQUFoQjs7QUFJQSxJQUFNRSxRQUFRLEdBQUcsU0FBWEEsUUFBVyxDQUFDSCxHQUFEO0FBQUEsU0FBa0JBLEdBQWxCO0FBQUEsQ0FBakI7O0FBRUEsSUFBTUksSUFBSSxHQUFHLFNBQVBBLElBQU8sQ0FBQ0MsSUFBRCxFQUFvQkosR0FBcEI7QUFBQSxTQUFxQ0YsT0FBTyxDQUFDO0FBQ3RETyxJQUFBQSxJQUFJLEVBQUU7QUFBRUMsTUFBQUEsUUFBUSxFQUFFLElBQVo7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QURHO0FBRUhvSyxNQUFBQSxTQUFTLEVBQVRBLFNBRkc7QUFHSE0sTUFBQUEsV0FBVyxFQUFYQSxXQUhHO0FBSUhNLE1BQUFBLEtBQUssRUFBTEEsS0FKRztBQUtIUyxNQUFBQSxNQUFNLEVBQU5BLE1BTEc7QUFNSDVHLE1BQUFBLE9BQU8sRUFBUEEsT0FORztBQU9IbUksTUFBQUEsS0FBSyxFQUFMQSxLQVBHO0FBUUhqSixNQUFBQSxPQUFPLEVBQVBBLE9BUkc7QUFTSDhCLE1BQUFBLFdBQVcsRUFBWEE7QUFURztBQURIO0FBRFksQ0FBeEI7ZUFnQmV1SyxNIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vL0BmbG93XG5cbmltcG9ydCB0eXBlIHsgSW50U2l6ZVR5cGUsIFR5cGVEZWYgfSBmcm9tICd0b24tbGFicy1kZXYtb3BzL3NyYy9zY2hlbWEnO1xuaW1wb3J0IHsgRGVmIH0gZnJvbSAndG9uLWxhYnMtZGV2LW9wcy9kaXN0L3NyYy9zY2hlbWEnO1xuXG5jb25zdCB7IHN0cmluZywgYm9vbCwgcmVmLCBhcnJheU9mIH0gPSBEZWY7XG5jb25zdCBqb2luID0gKHJlZkRlZjogeyBbc3RyaW5nXTogVHlwZURlZiB9LCBvbjogc3RyaW5nKTogVHlwZURlZiA9PiB7XG4gICAgcmV0dXJuIHsgLi4ucmVmKHJlZkRlZiksIF86IHsgam9pbjogeyBvbiB9IH0gfVxufTtcbmNvbnN0IHdpdGhEb2MgPSAoZGVmOiBUeXBlRGVmLCBkb2M/OiBzdHJpbmcpID0+ICh7XG4gICAgLi4uZGVmLFxuICAgIC4uLihkb2MgPyB7IF9kb2M6IGRvYyB9IDoge30pXG59KTtcbmNvbnN0IHJlcXVpcmVkID0gKGRlZjogVHlwZURlZikgPT4gZGVmO1xuXG5jb25zdCB1aW50ID0gKHNpemU6IEludFNpemVUeXBlLCBkb2M/OiBzdHJpbmcpID0+IHdpdGhEb2Moe1xuICAgIF9pbnQ6IHsgdW5zaWduZWQ6IHRydWUsIHNpemUgfVxufSwgZG9jKTtcblxuY29uc3QgaW50ID0gKHNpemU6IEludFNpemVUeXBlLCBkb2M/OiBzdHJpbmcpID0+IHdpdGhEb2Moe1xuICAgIF9pbnQ6IHsgdW5zaWduZWQ6IGZhbHNlLCBzaXplIH1cbn0sIGRvYyk7XG5cbmNvbnN0IGk4ID0gKGRvYz86IHN0cmluZykgPT4gaW50KDgsIGRvYyk7XG5jb25zdCBpMzIgPSAoZG9jPzogc3RyaW5nKSA9PiBpbnQoMzIsIGRvYyk7XG5cbmNvbnN0IHU4ID0gKGRvYz86IHN0cmluZykgPT4gdWludCg4LCBkb2MpO1xuY29uc3QgdTE2ID0gKGRvYz86IHN0cmluZykgPT4gdWludCgxNiwgZG9jKTtcbmNvbnN0IHUzMiA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMzIsIGRvYyk7XG5jb25zdCB1NjQgPSAoZG9jPzogc3RyaW5nKSA9PiB1aW50KDY0LCBkb2MpO1xuY29uc3QgdTEyOCA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMTI4LCBkb2MpO1xuY29uc3QgdTI1NiA9IChkb2M/OiBzdHJpbmcpID0+IHVpbnQoMjU2LCBkb2MpO1xuXG5jb25zdCBncmFtcyA9IHUxMjg7XG5cbnR5cGUgSW50RW51bVZhbHVlcyA9IHtcbiAgICBbc3RyaW5nXTogbnVtYmVyXG59O1xuXG5mdW5jdGlvbiB1OGVudW0obmFtZTogc3RyaW5nLCB2YWx1ZXM6IEludEVudW1WYWx1ZXMpIHtcbiAgICByZXR1cm4gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZXNEb2MgPSBPYmplY3QuZW50cmllcyh2YWx1ZXMpLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGAkeyh2YWx1ZTogYW55KX0g4oCTICR7bmFtZX1gO1xuICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgY29uc3QgZWZmZWN0aXZlRG9jID0gYCR7ZG9jID8gYCR7ZG9jfVxcbmAgOiAnJ30ke3ZhbHVlc0RvY31gO1xuICAgICAgICByZXR1cm4gd2l0aERvYyh7XG4gICAgICAgICAgICBfaW50OiB7XG4gICAgICAgICAgICAgICAgdW5zaWduZWQ6IHRydWUsXG4gICAgICAgICAgICAgICAgc2l6ZTogOCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfOiB7XG4gICAgICAgICAgICAgICAgZW51bToge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGVmZmVjdGl2ZURvYyk7XG4gICAgfVxufVxuXG5jb25zdCBPdGhlckN1cnJlbmN5OiBUeXBlRGVmID0ge1xuICAgIGN1cnJlbmN5OiB1MzIoKSxcbiAgICB2YWx1ZTogdTI1NigpLFxufTtcblxuXG5jb25zdCBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbiA9IChkb2M/OiBzdHJpbmcpOiBUeXBlRGVmID0+IGFycmF5T2YocmVmKHtPdGhlckN1cnJlbmN5fSksIGRvYyk7XG5cbmNvbnN0IGFjY291bnRTdGF0dXMgPSB1OGVudW0oJ0FjY291bnRTdGF0dXMnLCB7XG4gICAgdW5pbml0OiAwLFxuICAgIGFjdGl2ZTogMSxcbiAgICBmcm96ZW46IDIsXG4gICAgbm9uRXhpc3Q6IDMsXG59KTtcblxuY29uc3QgYWNjb3VudFN0YXR1c0NoYW5nZSA9IHU4ZW51bSgnQWNjb3VudFN0YXR1c0NoYW5nZScsIHtcbiAgICB1bmNoYW5nZWQ6IDAsXG4gICAgZnJvemVuOiAxLFxuICAgIGRlbGV0ZWQ6IDIsXG59KTtcblxuY29uc3Qgc2tpcFJlYXNvbiA9IHU4ZW51bSgnU2tpcFJlYXNvbicsIHtcbiAgICBub1N0YXRlOiAwLFxuICAgIGJhZFN0YXRlOiAxLFxuICAgIG5vR2FzOiAyLFxufSk7XG5cblxuY29uc3QgYWNjb3VudFR5cGUgPSB1OGVudW0oJ0FjY291bnRUeXBlJywge1xuICAgIHVuaW5pdDogMCxcbiAgICBhY3RpdmU6IDEsXG4gICAgZnJvemVuOiAyLFxufSk7XG5cbmNvbnN0IG1lc3NhZ2VUeXBlID0gdThlbnVtKCdNZXNzYWdlVHlwZScsIHtcbiAgICBpbnRlcm5hbDogMCxcbiAgICBleHRJbjogMSxcbiAgICBleHRPdXQ6IDIsXG59KTtcblxuXG5jb25zdCBtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cyA9IHU4ZW51bSgnTWVzc2FnZVByb2Nlc3NpbmdTdGF0dXMnLCB7XG4gICAgdW5rbm93bjogMCxcbiAgICBxdWV1ZWQ6IDEsXG4gICAgcHJvY2Vzc2luZzogMixcbiAgICBwcmVsaW1pbmFyeTogMyxcbiAgICBwcm9wb3NlZDogNCxcbiAgICBmaW5hbGl6ZWQ6IDUsXG4gICAgcmVmdXNlZDogNixcbiAgICB0cmFuc2l0aW5nOiA3LFxufSk7XG5cbmNvbnN0IHRyYW5zYWN0aW9uVHlwZSA9IHU4ZW51bSgnVHJhbnNhY3Rpb25UeXBlJywge1xuICAgIG9yZGluYXJ5OiAwLFxuICAgIHN0b3JhZ2U6IDEsXG4gICAgdGljazogMixcbiAgICB0b2NrOiAzLFxuICAgIHNwbGl0UHJlcGFyZTogNCxcbiAgICBzcGxpdEluc3RhbGw6IDUsXG4gICAgbWVyZ2VQcmVwYXJlOiA2LFxuICAgIG1lcmdlSW5zdGFsbDogNyxcbn0pO1xuXG5jb25zdCB0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ1RyYW5zYWN0aW9uUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByZWxpbWluYXJ5OiAxLFxuICAgIHByb3Bvc2VkOiAyLFxuICAgIGZpbmFsaXplZDogMyxcbiAgICByZWZ1c2VkOiA0LFxufSk7XG5cbmNvbnN0IGNvbXB1dGVUeXBlID0gdThlbnVtKCdDb21wdXRlVHlwZScsIHtcbiAgICBza2lwcGVkOiAwLFxuICAgIHZtOiAxLFxufSk7XG5cbmNvbnN0IGJvdW5jZVR5cGUgPSB1OGVudW0oJ0JvdW5jZVR5cGUnLCB7XG4gICAgbmVnRnVuZHM6IDAsXG4gICAgbm9GdW5kczogMSxcbiAgICBvazogMixcbn0pO1xuXG5jb25zdCBibG9ja1Byb2Nlc3NpbmdTdGF0dXMgPSB1OGVudW0oJ0Jsb2NrUHJvY2Vzc2luZ1N0YXR1cycsIHtcbiAgICB1bmtub3duOiAwLFxuICAgIHByb3Bvc2VkOiAxLFxuICAgIGZpbmFsaXplZDogMixcbiAgICByZWZ1c2VkOiAzLFxufSk7XG5cblxuY29uc3QgaW5Nc2dUeXBlID0gdThlbnVtKCdJbk1zZ1R5cGUnLCB7XG4gICAgZXh0ZXJuYWw6IDAsXG4gICAgaWhyOiAxLFxuICAgIGltbWVkaWF0ZWx5OiAyLFxuICAgIGZpbmFsOiAzLFxuICAgIHRyYW5zaXQ6IDQsXG4gICAgZGlzY2FyZGVkRmluYWw6IDUsXG4gICAgZGlzY2FyZGVkVHJhbnNpdDogNixcbn0pO1xuXG5jb25zdCBvdXRNc2dUeXBlID0gdThlbnVtKCdPdXRNc2dUeXBlJywge1xuICAgIGV4dGVybmFsOiAwLFxuICAgIGltbWVkaWF0ZWx5OiAxLFxuICAgIG91dE1zZ05ldzogMixcbiAgICB0cmFuc2l0OiAzLFxuICAgIGRlcXVldWVJbW1lZGlhdGVseTogNCxcbiAgICBkZXF1ZXVlOiA1LFxuICAgIHRyYW5zaXRSZXF1aXJlZDogNixcbiAgICBub25lOiAtMSxcbn0pO1xuXG5jb25zdCBzcGxpdFR5cGUgPSB1OGVudW0oJ1NwbGl0VHlwZScsIHtcbiAgICBub25lOiAwLFxuICAgIHNwbGl0OiAyLFxuICAgIG1lcmdlOiAzLFxufSk7XG5cbmNvbnN0IEFjY291bnQ6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RPTiBBY2NvdW50JyxcbiAgICBfOiB7IGNvbGxlY3Rpb246ICdhY2NvdW50cycgfSxcbiAgICBhY2NfdHlwZTogcmVxdWlyZWQoYWNjb3VudFR5cGUoJ0N1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50JykpLFxuICAgIGxhc3RfcGFpZDogcmVxdWlyZWQodTMyKCdDb250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnQgY29sbGVjdGVkICh1c3VhbGx5IHRoaXMgaXMgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCB0cmFuc2FjdGlvbiksIG9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbiknKSksXG4gICAgZHVlX3BheW1lbnQ6IGdyYW1zKCdJZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gb3RoZXIgY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWNjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuJyksXG4gICAgbGFzdF90cmFuc19sdDogcmVxdWlyZWQodTY0KCkpLFxuICAgIGJhbGFuY2U6IHJlcXVpcmVkKGdyYW1zKCkpLFxuICAgIGJhbGFuY2Vfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgc3BsaXRfZGVwdGg6IHU4KCdJcyBwcmVzZW50IGFuZCBub24temVybyBvbmx5IGluIGluc3RhbmNlcyBvZiBsYXJnZSBzbWFydCBjb250cmFjdHMuJyksXG4gICAgdGljazogYm9vbCgnTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi4nKSxcbiAgICB0b2NrOiBib29sKCdNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLicpLFxuICAgIGNvZGU6IHN0cmluZygnSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0JyksXG4gICAgZGF0YTogc3RyaW5nKCdJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBkYXRhIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQnKSxcbiAgICBsaWJyYXJ5OiBzdHJpbmcoJ0lmIHByZXNlbnQsIGNvbnRhaW5zIGxpYnJhcnkgY29kZSB1c2VkIGluIHNtYXJ0LWNvbnRyYWN0JyksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG5jb25zdCBNZXNzYWdlOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gTWVzc2FnZScsXG4gICAgXzogeyBjb2xsZWN0aW9uOiAnbWVzc2FnZXMnIH0sXG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG1lc3NhZ2VUeXBlKCdNZXNzYWdlIHR5cGUnKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZChtZXNzYWdlUHJvY2Vzc2luZ1N0YXR1cygnSW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMnKSksXG4gICAgYmxvY2tfaWQ6IHJlcXVpcmVkKHN0cmluZygnQmxvY2sgdG8gd2hpY2ggdGhpcyBtZXNzYWdlIGJlbG9uZ3MnKSksXG4gICAgYm9keTogc3RyaW5nKCcnKSxcbiAgICBzcGxpdF9kZXB0aDogdTgoJ1VzZWQgaW4gZGVwbG95IG1lc3NhZ2UgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluJyksXG4gICAgdGljazogYm9vbCgnVXNlZCBpbiBkZXBsb3kgbWVzc2FnZSBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4nKSxcbiAgICB0b2NrOiBib29sKCdVc2VkIGluIGRlcGxveSBtZXNzYWdlIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbicpLFxuICAgIGNvZGU6IHN0cmluZygnUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcycpLFxuICAgIGRhdGE6IHN0cmluZygnUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgbGlicmFyeTogc3RyaW5nKCdSZXByZXNlbnRzIGNvbnRyYWN0IGxpYnJhcnkgaW4gZGVwbG95IG1lc3NhZ2VzJyksXG4gICAgc3JjOiBzdHJpbmcoJ1NvdXJjZSBhZGRyZXNzJyksXG4gICAgZHN0OiBzdHJpbmcoJ0Rlc3RpbmF0aW9uIGFkZHJlc3MnKSxcbiAgICBjcmVhdGVkX2x0OiB1NjQoJ0xvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbicpLFxuICAgIGNyZWF0ZWRfYXQ6IHUzMignQ3JlYXRpb24gdW5peHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uIFRoZSBjcmVhdGlvbiB1bml4dGltZSBlcXVhbHMgdGhlIGNyZWF0aW9uIHVuaXh0aW1lIG9mIHRoZSBibG9jayBjb250YWluaW5nIHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLicpLFxuICAgIGlocl9kaXNhYmxlZDogYm9vbCgnTm90IGRlc2NyaWJlZCBpbiBzcGVjJyksXG4gICAgaWhyX2ZlZTogZ3JhbXMoJ1RoaXMgdmFsdWUgaXMgc3VidHJhY3RlZCBmcm9tIHRoZSB2YWx1ZSBhdHRhY2hlZCB0byB0aGUgbWVzc2FnZSBhbmQgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycyBvZiB0aGUgZGVzdGluYXRpb24gc2hhcmRjaGFpbiBpZiB0aGV5IGluY2x1ZGUgdGhlIG1lc3NhZ2UgYnkgdGhlIElIUiBtZWNoYW5pc20uJyksXG4gICAgZndkX2ZlZTogZ3JhbXMoJ09yaWdpbmFsIHRvdGFsIGZvcndhcmRpbmcgZmVlIHBhaWQgZm9yIHVzaW5nIHRoZSBIUiBtZWNoYW5pc207IGl0IGlzIGF1dG9tYXRpY2FsbHkgY29tcHV0ZWQgZnJvbSBzb21lIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyBhbmQgdGhlIHNpemUgb2YgdGhlIG1lc3NhZ2UgYXQgdGhlIHRpbWUgdGhlIG1lc3NhZ2UgaXMgZ2VuZXJhdGVkLicpLFxuICAgIGltcG9ydF9mZWU6IGdyYW1zKCdOb3QgZGVzY3JpYmVkIGluIHNwZWMnKSxcbiAgICBib3VuY2U6IGJvb2woJ0JvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuJyksXG4gICAgYm91bmNlZDogYm9vbCgnQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuJyksXG4gICAgdmFsdWU6IGdyYW1zKCdJbnRlcm5hbCBtZXNzYWdlIG1heSBiZWFyIHNvbWUgdmFsdWUgaW4gR3JhbXMnKSxcbiAgICB2YWx1ZV9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oJ0ludGVybmFsIG1lc3NhZ2UgbWF5IGJlYXIgc29tZSB2YWx1ZSBpbiBvdGhlciBjdXJyZW5jaWVzJyksXG4gICAgcHJvb2Y6IHN0cmluZygpLFxuICAgIGJvYzogc3RyaW5nKCksXG59O1xuXG5cbmNvbnN0IFRyYW5zYWN0aW9uOiBUeXBlRGVmID0ge1xuICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICB0cl90eXBlOiByZXF1aXJlZCh0cmFuc2FjdGlvblR5cGUoKSksXG4gICAgc3RhdHVzOiByZXF1aXJlZCh0cmFuc2FjdGlvblByb2Nlc3NpbmdTdGF0dXMoKSksXG4gICAgYmxvY2tfaWQ6IHN0cmluZygpLFxuICAgIGFjY291bnRfYWRkcjogc3RyaW5nKCksXG4gICAgbHQ6IHU2NCgpLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc3RyaW5nKCksXG4gICAgcHJldl90cmFuc19sdDogdTY0KCksXG4gICAgbm93OiB1MzIoKSxcbiAgICBvdXRtc2dfY250OiBpMzIoKSxcbiAgICBvcmlnX3N0YXR1czogYWNjb3VudFN0YXR1cygpLFxuICAgIGVuZF9zdGF0dXM6IGFjY291bnRTdGF0dXMoKSxcbiAgICBpbl9tc2c6IHN0cmluZygpLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oeyBNZXNzYWdlIH0sICdpbl9tc2cnKSxcbiAgICBvdXRfbXNnczogYXJyYXlPZihzdHJpbmcoKSksXG4gICAgb3V0X21lc3NhZ2VzOiBhcnJheU9mKGpvaW4oeyBNZXNzYWdlIH0sICdvdXRfbXNncycpKSxcbiAgICB0b3RhbF9mZWVzOiBncmFtcygpLFxuICAgIHRvdGFsX2ZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgIG5ld19oYXNoOiBzdHJpbmcoKSxcbiAgICBjcmVkaXRfZmlyc3Q6IGJvb2woKSxcbiAgICBzdG9yYWdlOiB7XG4gICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGdyYW1zKCksXG4gICAgICAgIHN0YXR1c19jaGFuZ2U6IGFjY291bnRTdGF0dXNDaGFuZ2UoKSxcbiAgICB9LFxuICAgIGNyZWRpdDoge1xuICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGNyZWRpdDogZ3JhbXMoKSxcbiAgICAgICAgY3JlZGl0X290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgIH0sXG4gICAgY29tcHV0ZToge1xuICAgICAgICBjb21wdXRlX3R5cGU6IHJlcXVpcmVkKGNvbXB1dGVUeXBlKCkpLFxuICAgICAgICBza2lwcGVkX3JlYXNvbjogc2tpcFJlYXNvbigpLFxuICAgICAgICBzdWNjZXNzOiBib29sKCksXG4gICAgICAgIG1zZ19zdGF0ZV91c2VkOiBib29sKCksXG4gICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBib29sKCksXG4gICAgICAgIGdhc19mZWVzOiBncmFtcygpLFxuICAgICAgICBnYXNfdXNlZDogdTY0KCksXG4gICAgICAgIGdhc19saW1pdDogdTY0KCksXG4gICAgICAgIGdhc19jcmVkaXQ6IGkzMigpLFxuICAgICAgICBtb2RlOiBpOCgpLFxuICAgICAgICBleGl0X2NvZGU6IGkzMigpLFxuICAgICAgICBleGl0X2FyZzogaTMyKCksXG4gICAgICAgIHZtX3N0ZXBzOiB1MzIoKSxcbiAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc3RyaW5nKCksXG4gICAgfSxcbiAgICBhY3Rpb246IHtcbiAgICAgICAgc3VjY2VzczogYm9vbCgpLFxuICAgICAgICB2YWxpZDogYm9vbCgpLFxuICAgICAgICBub19mdW5kczogYm9vbCgpLFxuICAgICAgICBzdGF0dXNfY2hhbmdlOiBhY2NvdW50U3RhdHVzQ2hhbmdlKCksXG4gICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBncmFtcygpLFxuICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogZ3JhbXMoKSxcbiAgICAgICAgcmVzdWx0X2NvZGU6IGkzMigpLFxuICAgICAgICByZXN1bHRfYXJnOiBpMzIoKSxcbiAgICAgICAgdG90X2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBzcGVjX2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGkzMigpLFxuICAgICAgICBtc2dzX2NyZWF0ZWQ6IGkzMigpLFxuICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IHUzMigpLFxuICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiB1MzIoKSxcbiAgICB9LFxuICAgIGJvdW5jZToge1xuICAgICAgICBib3VuY2VfdHlwZTogcmVxdWlyZWQoYm91bmNlVHlwZSgpKSxcbiAgICAgICAgbXNnX3NpemVfY2VsbHM6IHUzMigpLFxuICAgICAgICBtc2dfc2l6ZV9iaXRzOiB1MzIoKSxcbiAgICAgICAgcmVxX2Z3ZF9mZWVzOiBncmFtcygpLFxuICAgICAgICBtc2dfZmVlczogZ3JhbXMoKSxcbiAgICAgICAgZndkX2ZlZXM6IGdyYW1zKCksXG4gICAgfSxcbiAgICBhYm9ydGVkOiBib29sKCksXG4gICAgZGVzdHJveWVkOiBib29sKCksXG4gICAgdHQ6IHN0cmluZygpLFxuICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IHU4KCksXG4gICAgICAgIGFjY19zcGxpdF9kZXB0aDogdTgoKSxcbiAgICAgICAgdGhpc19hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgc2libGluZ19hZGRyOiBzdHJpbmcoKSxcbiAgICB9LFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHN0cmluZygpLFxuICAgIGluc3RhbGxlZDogYm9vbCgpLFxuICAgIHByb29mOiBzdHJpbmcoKSxcbiAgICBib2M6IHN0cmluZygpLFxufTtcblxuLy8gQkxPQ0tcblxuY29uc3QgRXh0QmxrUmVmOiBUeXBlRGVmID0ge1xuICAgIGVuZF9sdDogdTY0KCksXG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByb290X2hhc2g6IHN0cmluZygpLFxuICAgIGZpbGVfaGFzaDogc3RyaW5nKClcbn07XG5cbmNvbnN0IGV4dEJsa1JlZiA9ICgpID0+IHJlZih7IEV4dEJsa1JlZiB9KTtcblxuY29uc3QgTXNnRW52ZWxvcGU6IFR5cGVEZWYgPSB7XG4gICAgbXNnX2lkOiBzdHJpbmcoKSxcbiAgICBuZXh0X2FkZHI6IHN0cmluZygpLFxuICAgIGN1cl9hZGRyOiBzdHJpbmcoKSxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogZ3JhbXMoKSxcbn07XG5cbmNvbnN0IG1zZ0VudmVsb3BlID0gKCkgPT4gcmVmKHsgTXNnRW52ZWxvcGUgfSk7XG5cbmNvbnN0IEluTXNnOiBUeXBlRGVmID0ge1xuICAgIG1zZ190eXBlOiByZXF1aXJlZChpbk1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgaWhyX2ZlZTogZ3JhbXMoKSxcbiAgICBwcm9vZl9jcmVhdGVkOiBzdHJpbmcoKSxcbiAgICBpbl9tc2c6IG1zZ0VudmVsb3BlKCksXG4gICAgZndkX2ZlZTogZ3JhbXMoKSxcbiAgICBvdXRfbXNnOiBtc2dFbnZlbG9wZSgpLFxuICAgIHRyYW5zaXRfZmVlOiBncmFtcygpLFxuICAgIHRyYW5zYWN0aW9uX2lkOiB1NjQoKSxcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHN0cmluZygpXG59O1xuXG5jb25zdCBpbk1zZyA9ICgpID0+IHJlZih7IEluTXNnIH0pO1xuXG5jb25zdCBPdXRNc2c6IFR5cGVEZWYgPSB7XG4gICAgbXNnX3R5cGU6IHJlcXVpcmVkKG91dE1zZ1R5cGUoKSksXG4gICAgbXNnOiBzdHJpbmcoKSxcbiAgICB0cmFuc2FjdGlvbjogc3RyaW5nKCksXG4gICAgb3V0X21zZzogbXNnRW52ZWxvcGUoKSxcbiAgICByZWltcG9ydDogaW5Nc2coKSxcbiAgICBpbXBvcnRlZDogaW5Nc2coKSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHU2NCgpLFxufTtcblxuY29uc3Qgb3V0TXNnID0gKCkgPT4gcmVmKHsgT3V0TXNnIH0pO1xuXG5jb25zdCBzaGFyZERlc2NyID0gKGRvYz86IHN0cmluZyk6IFR5cGVEZWYgPT4gd2l0aERvYyh7XG4gICAgc2VxX25vOiB1MzIoKSxcbiAgICByZWdfbWNfc2Vxbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHJvb3RfaGFzaDogc3RyaW5nKCksXG4gICAgZmlsZV9oYXNoOiBzdHJpbmcoKSxcbiAgICBiZWZvcmVfc3BsaXQ6IGJvb2woKSxcbiAgICBiZWZvcmVfbWVyZ2U6IGJvb2woKSxcbiAgICB3YW50X3NwbGl0OiBib29sKCksXG4gICAgd2FudF9tZXJnZTogYm9vbCgpLFxuICAgIG54X2NjX3VwZGF0ZWQ6IGJvb2woKSxcbiAgICBmbGFnczogdTgoKSxcbiAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiB1MzIoKSxcbiAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogc3RyaW5nKCksXG4gICAgbWluX3JlZl9tY19zZXFubzogdTMyKCksXG4gICAgZ2VuX3V0aW1lOiB1MzIoKSxcbiAgICBzcGxpdF90eXBlOiBzcGxpdFR5cGUoKSxcbiAgICBzcGxpdDogdTMyKCksXG4gICAgZmVlc19jb2xsZWN0ZWQ6IGdyYW1zKCksXG4gICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgZnVuZHNfY3JlYXRlZDogZ3JhbXMoKSxcbiAgICBmdW5kc19jcmVhdGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxufSwgZG9jKTtcblxuY29uc3QgQmxvY2s6IFR5cGVEZWYgPSB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIF86IHsgY29sbGVjdGlvbjogJ2Jsb2NrcycgfSxcbiAgICBzdGF0dXM6IGJsb2NrUHJvY2Vzc2luZ1N0YXR1cygpLFxuICAgIGdsb2JhbF9pZDogdTMyKCksXG4gICAgd2FudF9zcGxpdDogYm9vbCgpLFxuICAgIHNlcV9ubzogdTMyKCksXG4gICAgYWZ0ZXJfbWVyZ2U6IGJvb2woKSxcbiAgICBnZW5fdXRpbWU6IGkzMigpLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogdTMyKCksXG4gICAgZmxhZ3M6IHUxNigpLFxuICAgIG1hc3Rlcl9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfcmVmOiBleHRCbGtSZWYoKSxcbiAgICBwcmV2X2FsdF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9yZWY6IGV4dEJsa1JlZigpLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBleHRCbGtSZWYoKSxcbiAgICB2ZXJzaW9uOiB1MzIoKSxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogdTMyKCksXG4gICAgYmVmb3JlX3NwbGl0OiBib29sKCksXG4gICAgYWZ0ZXJfc3BsaXQ6IGJvb2woKSxcbiAgICB3YW50X21lcmdlOiBib29sKCksXG4gICAgdmVydF9zZXFfbm86IHUzMigpLFxuICAgIHN0YXJ0X2x0OiB1NjQoKSxcbiAgICBlbmRfbHQ6IHU2NCgpLFxuICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgc2hhcmQ6IHN0cmluZygpLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHUzMigpLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGdyYW1zKCksXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBleHBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBncmFtcygpLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgY3JlYXRlZDogZ3JhbXMoKSxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgaW1wb3J0ZWQ6IGdyYW1zKCksXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBncmFtcygpLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBvdGhlckN1cnJlbmN5Q29sbGVjdGlvbigpLFxuICAgICAgICBtaW50ZWQ6IGdyYW1zKCksXG4gICAgICAgIG1pbnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogZ3JhbXMoKSxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogb3RoZXJDdXJyZW5jeUNvbGxlY3Rpb24oKSxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYXJyYXlPZihpbk1zZygpKSxcbiAgICByYW5kX3NlZWQ6IHN0cmluZygpLFxuICAgIG91dF9tc2dfZGVzY3I6IGFycmF5T2Yob3V0TXNnKCkpLFxuICAgIGFjY291bnRfYmxvY2tzOiBhcnJheU9mKHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBzdHJpbmcoKSxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBhcnJheU9mKHN0cmluZygpKSxcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICBvbGRfaGFzaDogc3RyaW5nKCksXG4gICAgICAgICAgICBuZXdfaGFzaDogc3RyaW5nKClcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGkzMigpXG4gICAgfSksXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogc3RyaW5nKCksXG4gICAgICAgIG5ld19oYXNoOiBzdHJpbmcoKSxcbiAgICAgICAgbmV3X2RlcHRoOiB1MTYoKSxcbiAgICAgICAgb2xkOiBzdHJpbmcoKSxcbiAgICAgICAgb2xkX2hhc2g6IHN0cmluZygpLFxuICAgICAgICBvbGRfZGVwdGg6IHUxNigpXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgc2hhcmRfaGFzaGVzOiBhcnJheU9mKHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogaTMyKCksXG4gICAgICAgICAgICBzaGFyZDogc3RyaW5nKCksXG4gICAgICAgICAgICBkZXNjcjogc2hhcmREZXNjcigpLFxuICAgICAgICB9KSxcbiAgICAgICAgc2hhcmRfZmVlczogYXJyYXlPZih7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGkzMigpLFxuICAgICAgICAgICAgc2hhcmQ6IHN0cmluZygpLFxuICAgICAgICAgICAgZmVlczogZ3JhbXMoKSxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgICAgICBjcmVhdGU6IGdyYW1zKCksXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IG90aGVyQ3VycmVuY3lDb2xsZWN0aW9uKCksXG4gICAgICAgIH0pLFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGluTXNnKCksXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IGFycmF5T2Yoe1xuICAgICAgICAgICAgbm9kZV9pZDogc3RyaW5nKCksXG4gICAgICAgICAgICByOiBzdHJpbmcoKSxcbiAgICAgICAgICAgIHM6IHN0cmluZygpLFxuICAgICAgICB9KSxcbiAgICB9LFxufTtcblxuXG4vL1Jvb3Qgc2NoZW1lIGRlY2xhcmF0aW9uXG5cbmNvbnN0IHNjaGVtYTogVHlwZURlZiA9IHtcbiAgICBfY2xhc3M6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICAgIE90aGVyQ3VycmVuY3ksXG4gICAgICAgICAgICBFeHRCbGtSZWYsXG4gICAgICAgICAgICBNc2dFbnZlbG9wZSxcbiAgICAgICAgICAgIEluTXNnLFxuICAgICAgICAgICAgT3V0TXNnLFxuICAgICAgICAgICAgTWVzc2FnZSxcbiAgICAgICAgICAgIEJsb2NrLFxuICAgICAgICAgICAgQWNjb3VudCxcbiAgICAgICAgICAgIFRyYW5zYWN0aW9uLFxuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgc2NoZW1hO1xuIl19