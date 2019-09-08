"use strict";

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
var _require = require('./arango-types.js'),
    scalar = _require.scalar,
    struct = _require.struct,
    array = _require.array,
    join = _require.join,
    joinArray = _require.joinArray;

var None = struct({
  dummy: scalar
});
var CurrencyCollection = struct({
  Grams: scalar
});
var IntermediateAddressRegular = struct({
  use_src_bits: scalar
});
var IntermediateAddressSimple = struct({
  workchain_id: scalar,
  addr_pfx: scalar
});
var IntermediateAddressExt = struct({
  workchain_id: scalar,
  addr_pfx: scalar
});
var IntermediateAddress = struct({
  Regular: IntermediateAddressRegular,
  Simple: IntermediateAddressSimple,
  Ext: IntermediateAddressExt
});
var IntermediateAddressResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.Regular) {
      return 'IntermediateAddressRegularVariant';
    }

    if (obj.Simple) {
      return 'IntermediateAddressSimpleVariant';
    }

    if (obj.Ext) {
      return 'IntermediateAddressExtVariant';
    }

    return null;
  }
};
var ExtBlkRef = struct({
  end_lt: scalar,
  seq_no: scalar,
  root_hash: scalar,
  file_hash: scalar
});
var MsgAddressIntAddrStdAnycast = struct({
  rewrite_pfx: scalar
});
var MsgAddressIntAddrStd = struct({
  anycast: MsgAddressIntAddrStdAnycast,
  workchain_id: scalar,
  address: scalar
});
var MsgAddressIntAddrVarAnycast = struct({
  rewrite_pfx: scalar
});
var MsgAddressIntAddrVar = struct({
  anycast: MsgAddressIntAddrVarAnycast,
  workchain_id: scalar,
  address: scalar
});
var MsgAddressInt = struct({
  AddrNone: None,
  AddrStd: MsgAddressIntAddrStd,
  AddrVar: MsgAddressIntAddrVar
});
var MsgAddressIntResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.AddrNone) {
      return 'MsgAddressIntAddrNoneVariant';
    }

    if (obj.AddrStd) {
      return 'MsgAddressIntAddrStdVariant';
    }

    if (obj.AddrVar) {
      return 'MsgAddressIntAddrVarVariant';
    }

    return null;
  }
};
var TickTock = struct({
  tick: scalar,
  tock: scalar
});
var StorageUsedShort = struct({
  cells: scalar,
  bits: scalar
});
var SplitMergeInfo = struct({
  cur_shard_pfx_len: scalar,
  acc_split_depth: scalar,
  this_addr: scalar,
  sibling_addr: scalar
});
var MsgAddressExtAddrExtern = struct({
  AddrExtern: scalar
});
var MsgAddressExt = struct({
  AddrNone: None,
  AddrExtern: MsgAddressExtAddrExtern
});
var MsgAddressExtResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.AddrNone) {
      return 'MsgAddressExtAddrNoneVariant';
    }

    if (obj.AddrExtern) {
      return 'MsgAddressExtAddrExternVariant';
    }

    return null;
  }
};
var MessageHeaderIntMsgInfo = struct({
  ihr_disabled: scalar,
  bounce: scalar,
  bounced: scalar,
  src: MsgAddressInt,
  dst: MsgAddressInt,
  value: CurrencyCollection,
  ihr_fee: scalar,
  fwd_fee: scalar,
  created_lt: scalar,
  created_at: scalar
});
var MessageHeaderExtInMsgInfo = struct({
  src: MsgAddressExt,
  dst: MsgAddressInt,
  import_fee: scalar
});
var MessageHeaderExtOutMsgInfo = struct({
  src: MsgAddressInt,
  dst: MsgAddressExt,
  created_lt: scalar,
  created_at: scalar
});
var MessageHeader = struct({
  IntMsgInfo: MessageHeaderIntMsgInfo,
  ExtInMsgInfo: MessageHeaderExtInMsgInfo,
  ExtOutMsgInfo: MessageHeaderExtOutMsgInfo
});
var MessageHeaderResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.IntMsgInfo) {
      return 'MessageHeaderIntMsgInfoVariant';
    }

    if (obj.ExtInMsgInfo) {
      return 'MessageHeaderExtInMsgInfoVariant';
    }

    if (obj.ExtOutMsgInfo) {
      return 'MessageHeaderExtOutMsgInfoVariant';
    }

    return null;
  }
};
var MessageInit = struct({
  split_depth: scalar,
  special: TickTock,
  code: scalar,
  data: scalar,
  library: scalar
});
var Message = struct({
  id: scalar,
  transaction_id: scalar,
  block_id: scalar,
  header: MessageHeader,
  init: MessageInit,
  body: scalar,
  status: scalar
}, true);
var MsgEnvelope = struct({
  msg: scalar,
  next_addr: IntermediateAddress,
  cur_addr: IntermediateAddress,
  fwd_fee_remaining: CurrencyCollection
});
var InMsgExternal = struct({
  msg: scalar,
  transaction: scalar
});
var InMsgIHR = struct({
  msg: scalar,
  transaction: scalar,
  ihr_fee: scalar,
  proof_created: scalar
});
var InMsgImmediatelly = struct({
  in_msg: MsgEnvelope,
  fwd_fee: scalar,
  transaction: scalar
});
var InMsgFinal = struct({
  in_msg: MsgEnvelope,
  fwd_fee: scalar,
  transaction: scalar
});
var InMsgTransit = struct({
  in_msg: MsgEnvelope,
  out_msg: MsgEnvelope,
  transit_fee: scalar
});
var InMsgDiscardedFinal = struct({
  in_msg: MsgEnvelope,
  transaction_id: scalar,
  fwd_fee: scalar
});
var InMsgDiscardedTransit = struct({
  in_msg: MsgEnvelope,
  transaction_id: scalar,
  fwd_fee: scalar,
  proof_delivered: scalar
});
var InMsg = struct({
  External: InMsgExternal,
  IHR: InMsgIHR,
  Immediatelly: InMsgImmediatelly,
  Final: InMsgFinal,
  Transit: InMsgTransit,
  DiscardedFinal: InMsgDiscardedFinal,
  DiscardedTransit: InMsgDiscardedTransit
});
var InMsgResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.External) {
      return 'InMsgExternalVariant';
    }

    if (obj.IHR) {
      return 'InMsgIHRVariant';
    }

    if (obj.Immediatelly) {
      return 'InMsgImmediatellyVariant';
    }

    if (obj.Final) {
      return 'InMsgFinalVariant';
    }

    if (obj.Transit) {
      return 'InMsgTransitVariant';
    }

    if (obj.DiscardedFinal) {
      return 'InMsgDiscardedFinalVariant';
    }

    if (obj.DiscardedTransit) {
      return 'InMsgDiscardedTransitVariant';
    }

    return null;
  }
};
var OutMsgExternal = struct({
  msg: scalar,
  transaction: scalar
});
var OutMsgImmediately = struct({
  out_msg: MsgEnvelope,
  transaction: scalar,
  reimport: InMsg
});
var OutMsgOutMsgNew = struct({
  out_msg: MsgEnvelope,
  transaction: scalar
});
var OutMsgTransit = struct({
  out_msg: MsgEnvelope,
  imported: InMsg
});
var OutMsgDequeue = struct({
  out_msg: MsgEnvelope,
  import_block_lt: scalar
});
var OutMsgTransitRequired = struct({
  out_msg: MsgEnvelope,
  imported: InMsg
});
var OutMsg = struct({
  None: None,
  External: OutMsgExternal,
  Immediately: OutMsgImmediately,
  OutMsgNew: OutMsgOutMsgNew,
  Transit: OutMsgTransit,
  Dequeue: OutMsgDequeue,
  TransitRequired: OutMsgTransitRequired
});
var OutMsgResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.None) {
      return 'OutMsgNoneVariant';
    }

    if (obj.External) {
      return 'OutMsgExternalVariant';
    }

    if (obj.Immediately) {
      return 'OutMsgImmediatelyVariant';
    }

    if (obj.OutMsgNew) {
      return 'OutMsgOutMsgNewVariant';
    }

    if (obj.Transit) {
      return 'OutMsgTransitVariant';
    }

    if (obj.Dequeue) {
      return 'OutMsgDequeueVariant';
    }

    if (obj.TransitRequired) {
      return 'OutMsgTransitRequiredVariant';
    }

    return null;
  }
};
var BlockInfoPrevRefPrev = struct({
  seq_no: scalar,
  file_hash: scalar,
  root_hash: scalar,
  end_lt: scalar
});
var BlockInfoPrevRef = struct({
  prev: BlockInfoPrevRefPrev
});
var BlockInfoShard = struct({
  shard_pfx_bits: scalar,
  workchain_id: scalar,
  shard_prefix: scalar
});
var BlockInfoMasterRef = struct({
  master: ExtBlkRef
});
var BlockInfoPrevVertRef = struct({
  prev: ExtBlkRef,
  prev_alt: ExtBlkRef
});
var BlockInfo = struct({
  want_split: scalar,
  seq_no: scalar,
  after_merge: scalar,
  gen_utime: scalar,
  gen_catchain_seqno: scalar,
  flags: scalar,
  prev_ref: BlockInfoPrevRef,
  version: scalar,
  gen_validator_list_hash_short: scalar,
  before_split: scalar,
  after_split: scalar,
  want_merge: scalar,
  vert_seq_no: scalar,
  start_lt: scalar,
  end_lt: scalar,
  shard: BlockInfoShard,
  min_ref_mc_seqno: scalar,
  master_ref: BlockInfoMasterRef,
  prev_vert_ref: BlockInfoPrevVertRef
});
var BlockValueFlow = struct({
  to_next_blk: CurrencyCollection,
  exported: CurrencyCollection,
  fees_collected: CurrencyCollection,
  created: CurrencyCollection,
  imported: CurrencyCollection,
  from_prev_blk: CurrencyCollection,
  minted: CurrencyCollection,
  fees_imported: CurrencyCollection
});
var BlockExtraAccountBlocksStateUpdate = struct({
  old_hash: scalar,
  new_hash: scalar
});
var StringArray = array(String);
var BlockExtraAccountBlocks = struct({
  account_addr: scalar,
  transactions: StringArray,
  state_update: BlockExtraAccountBlocksStateUpdate,
  tr_count: scalar
});
var InMsgArray = array(InMsg);
var OutMsgArray = array(OutMsg);
var BlockExtraAccountBlocksArray = array(BlockExtraAccountBlocks);
var BlockExtra = struct({
  in_msg_descr: InMsgArray,
  rand_seed: scalar,
  out_msg_descr: OutMsgArray,
  account_blocks: BlockExtraAccountBlocksArray
});
var BlockStateUpdate = struct({
  "new": scalar,
  new_hash: scalar,
  new_depth: scalar,
  old: scalar,
  old_hash: scalar,
  old_depth: scalar
});
var Block = struct({
  id: scalar,
  status: scalar,
  global_id: scalar,
  info: BlockInfo,
  value_flow: BlockValueFlow,
  extra: BlockExtra,
  state_update: BlockStateUpdate
}, true);
var AccountStorageStat = struct({
  last_paid: scalar,
  due_payment: scalar
});
var AccountStorageStateAccountActive = struct({
  split_depth: scalar,
  special: TickTock,
  code: scalar,
  data: scalar,
  library: scalar
});
var AccountStorageStateAccountFrozen = struct({
  dummy: scalar
});
var AccountStorageState = struct({
  AccountUninit: None,
  AccountActive: AccountStorageStateAccountActive,
  AccountFrozen: AccountStorageStateAccountFrozen
});
var AccountStorageStateResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.AccountUninit) {
      return 'AccountStorageStateAccountUninitVariant';
    }

    if (obj.AccountActive) {
      return 'AccountStorageStateAccountActiveVariant';
    }

    if (obj.AccountFrozen) {
      return 'AccountStorageStateAccountFrozenVariant';
    }

    return null;
  }
};
var AccountStorage = struct({
  last_trans_lt: scalar,
  balance: CurrencyCollection,
  state: AccountStorageState
});
var Account = struct({
  id: scalar,
  _key: scalar,
  storage_stat: AccountStorageStat,
  storage: AccountStorage,
  addr: MsgAddressInt
}, true);
var TransactionStateUpdate = struct({
  old_hash: scalar,
  new_hash: scalar
});
var TrStoragePhase = struct({
  storage_fees_collected: scalar,
  storage_fees_due: scalar,
  status_change: scalar
});
var TrCreditPhase = struct({
  due_fees_collected: scalar,
  credit: CurrencyCollection
});
var TrComputePhaseSkipped = struct({
  reason: scalar
});
var TrComputePhaseVm = struct({
  success: scalar,
  msg_state_used: scalar,
  account_activated: scalar,
  gas_fees: scalar,
  gas_used: scalar,
  gas_limit: scalar,
  gas_credit: scalar,
  mode: scalar,
  exit_code: scalar,
  exit_arg: scalar,
  vm_steps: scalar,
  vm_init_state_hash: scalar,
  vm_final_state_hash: scalar
});
var TrComputePhase = struct({
  Skipped: TrComputePhaseSkipped,
  Vm: TrComputePhaseVm
});
var TrComputePhaseResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.Skipped) {
      return 'TrComputePhaseSkippedVariant';
    }

    if (obj.Vm) {
      return 'TrComputePhaseVmVariant';
    }

    return null;
  }
};
var TrActionPhase = struct({
  success: scalar,
  valid: scalar,
  no_funds: scalar,
  status_change: scalar,
  total_fwd_fees: scalar,
  total_action_fees: scalar,
  result_code: scalar,
  result_arg: scalar,
  tot_actions: scalar,
  spec_actions: scalar,
  skipped_actions: scalar,
  msgs_created: scalar,
  action_list_hash: scalar,
  tot_msg_size: StorageUsedShort
});
var TrBouncePhaseNofunds = struct({
  msg_size: StorageUsedShort,
  req_fwd_fees: scalar
});
var TrBouncePhaseOk = struct({
  msg_size: StorageUsedShort,
  msg_fees: scalar,
  fwd_fees: scalar
});
var TrBouncePhase = struct({
  Negfunds: None,
  Nofunds: TrBouncePhaseNofunds,
  Ok: TrBouncePhaseOk
});
var TrBouncePhaseResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.Negfunds) {
      return 'TrBouncePhaseNegfundsVariant';
    }

    if (obj.Nofunds) {
      return 'TrBouncePhaseNofundsVariant';
    }

    if (obj.Ok) {
      return 'TrBouncePhaseOkVariant';
    }

    return null;
  }
};
var TransactionDescriptionOrdinary = struct({
  credit_first: scalar,
  storage_ph: TrStoragePhase,
  credit_ph: TrCreditPhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  bounce: TrBouncePhase,
  destroyed: scalar
});
var TransactionDescriptionTickTock = struct({
  tt: scalar,
  storage: TrStoragePhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescriptionSplitPrepare = struct({
  split_info: SplitMergeInfo,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescriptionSplitInstall = struct({
  split_info: SplitMergeInfo,
  prepare_transaction: scalar,
  installed: scalar
});
var TransactionDescriptionMergePrepare = struct({
  split_info: SplitMergeInfo,
  storage_ph: TrStoragePhase,
  aborted: scalar
});
var TransactionDescriptionMergeInstall = struct({
  split_info: SplitMergeInfo,
  prepare_transaction: scalar,
  credit_ph: TrCreditPhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescription = struct({
  Ordinary: TransactionDescriptionOrdinary,
  Storage: TrStoragePhase,
  TickTock: TransactionDescriptionTickTock,
  SplitPrepare: TransactionDescriptionSplitPrepare,
  SplitInstall: TransactionDescriptionSplitInstall,
  MergePrepare: TransactionDescriptionMergePrepare,
  MergeInstall: TransactionDescriptionMergeInstall
});
var TransactionDescriptionResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.Ordinary) {
      return 'TransactionDescriptionOrdinaryVariant';
    }

    if (obj.Storage) {
      return 'TransactionDescriptionStorageVariant';
    }

    if (obj.TickTock) {
      return 'TransactionDescriptionTickTockVariant';
    }

    if (obj.SplitPrepare) {
      return 'TransactionDescriptionSplitPrepareVariant';
    }

    if (obj.SplitInstall) {
      return 'TransactionDescriptionSplitInstallVariant';
    }

    if (obj.MergePrepare) {
      return 'TransactionDescriptionMergePrepareVariant';
    }

    if (obj.MergeInstall) {
      return 'TransactionDescriptionMergeInstallVariant';
    }

    return null;
  }
};
var MessageArray = array(Message);
var Transaction = struct({
  id: scalar,
  block_id: scalar,
  status: scalar,
  account_addr: scalar,
  lt: scalar,
  last_trans_lt: scalar,
  prev_trans_hash: scalar,
  prev_trans_lt: scalar,
  now: scalar,
  outmsg_cnt: scalar,
  orig_status: scalar,
  end_status: scalar,
  in_msg: scalar,
  in_message: join('in_msg', 'messages', Message),
  out_msgs: StringArray,
  out_messages: joinArray('out_msgs', 'messages', Message),
  total_fees: scalar,
  state_update: TransactionStateUpdate,
  description: TransactionDescription,
  root_cell: scalar
}, true);

function createResolvers(db) {
  return {
    IntermediateAddress: IntermediateAddressResolver,
    MsgAddressInt: MsgAddressIntResolver,
    MsgAddressExt: MsgAddressExtResolver,
    MessageHeader: MessageHeaderResolver,
    Message: {
      id: function id(parent) {
        return parent._key;
      }
    },
    InMsg: InMsgResolver,
    OutMsg: OutMsgResolver,
    Block: {
      id: function id(parent) {
        return parent._key;
      }
    },
    AccountStorageState: AccountStorageStateResolver,
    Account: {
      id: function id(parent) {
        return parent._key;
      }
    },
    TrComputePhase: TrComputePhaseResolver,
    TrBouncePhase: TrBouncePhaseResolver,
    TransactionDescription: TransactionDescriptionResolver,
    Transaction: {
      id: function id(parent) {
        return parent._key;
      },
      in_message: function in_message(parent) {
        return db.fetchDocByKey(db.messages, parent.in_msg);
      },
      out_messages: function out_messages(parent) {
        return db.fetchDocsByKeys(db.messages, parent.out_msgs);
      }
    },
    Query: {
      messages: db.collectionQuery(db.messages, Message),
      blocks: db.collectionQuery(db.blocks, Block),
      accounts: db.collectionQuery(db.accounts, Account),
      transactions: db.collectionQuery(db.transactions, Transaction),
      select: db.selectQuery()
    },
    Subscription: {
      messages: db.collectionSubscription(db.messages, Message),
      blocks: db.collectionSubscription(db.blocks, Block),
      accounts: db.collectionSubscription(db.accounts, Account),
      transactions: db.collectionSubscription(db.transactions, Transaction)
    }
  };
}

module.exports = {
  createResolvers: createResolvers
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiZHVtbXkiLCJDdXJyZW5jeUNvbGxlY3Rpb24iLCJHcmFtcyIsIkludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyIiwidXNlX3NyY19iaXRzIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSIsIndvcmtjaGFpbl9pZCIsImFkZHJfcGZ4IiwiSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCIsIkludGVybWVkaWF0ZUFkZHJlc3MiLCJSZWd1bGFyIiwiU2ltcGxlIiwiRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyIiwiX19yZXNvbHZlVHlwZSIsIm9iaiIsImNvbnRleHQiLCJpbmZvIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0IiwicmV3cml0ZV9wZngiLCJNc2dBZGRyZXNzSW50QWRkclN0ZCIsImFueWNhc3QiLCJhZGRyZXNzIiwiTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0IiwiTXNnQWRkcmVzc0ludEFkZHJWYXIiLCJNc2dBZGRyZXNzSW50IiwiQWRkck5vbmUiLCJBZGRyU3RkIiwiQWRkclZhciIsIk1zZ0FkZHJlc3NJbnRSZXNvbHZlciIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJNZXNzYWdlSGVhZGVySW50TXNnSW5mbyIsImlocl9kaXNhYmxlZCIsImJvdW5jZSIsImJvdW5jZWQiLCJzcmMiLCJkc3QiLCJ2YWx1ZSIsImlocl9mZWUiLCJmd2RfZmVlIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvIiwiaW1wb3J0X2ZlZSIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlciIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlclJlc29sdmVyIiwiTWVzc2FnZUluaXQiLCJzcGxpdF9kZXB0aCIsInNwZWNpYWwiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJNZXNzYWdlIiwiaWQiLCJ0cmFuc2FjdGlvbl9pZCIsImJsb2NrX2lkIiwiaGVhZGVyIiwiaW5pdCIsImJvZHkiLCJzdGF0dXMiLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZ0V4dGVybmFsIiwidHJhbnNhY3Rpb24iLCJJbk1zZ0lIUiIsInByb29mX2NyZWF0ZWQiLCJJbk1zZ0ltbWVkaWF0ZWxseSIsImluX21zZyIsIkluTXNnRmluYWwiLCJJbk1zZ1RyYW5zaXQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJJbk1zZ0Rpc2NhcmRlZEZpbmFsIiwiSW5Nc2dEaXNjYXJkZWRUcmFuc2l0IiwicHJvb2ZfZGVsaXZlcmVkIiwiSW5Nc2ciLCJFeHRlcm5hbCIsIklIUiIsIkltbWVkaWF0ZWxseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIkluTXNnUmVzb2x2ZXIiLCJPdXRNc2dFeHRlcm5hbCIsIk91dE1zZ0ltbWVkaWF0ZWx5IiwicmVpbXBvcnQiLCJPdXRNc2dPdXRNc2dOZXciLCJPdXRNc2dUcmFuc2l0IiwiaW1wb3J0ZWQiLCJPdXRNc2dEZXF1ZXVlIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3V0TXNnVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnIiwiSW1tZWRpYXRlbHkiLCJPdXRNc2dOZXciLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnUmVzb2x2ZXIiLCJCbG9ja0luZm9QcmV2UmVmUHJldiIsIkJsb2NrSW5mb1ByZXZSZWYiLCJwcmV2IiwiQmxvY2tJbmZvU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsInNoYXJkX3ByZWZpeCIsIkJsb2NrSW5mb01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrSW5mb1ByZXZWZXJ0UmVmIiwicHJldl9hbHQiLCJCbG9ja0luZm8iLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsInByZXZfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYmVmb3JlX3NwbGl0IiwiYWZ0ZXJfc3BsaXQiLCJ3YW50X21lcmdlIiwidmVydF9zZXFfbm8iLCJzdGFydF9sdCIsInNoYXJkIiwibWluX3JlZl9tY19zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja0V4dHJhIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwidmFsdWVfZmxvdyIsImV4dHJhIiwiQWNjb3VudFN0b3JhZ2VTdGF0IiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztlQWdCbURBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQWxEQyxNLFlBQUFBLE07SUFBUUMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUNyQyxJQUFNQyxJQUFJLEdBQUdKLE1BQU0sQ0FBQztBQUNoQkssRUFBQUEsS0FBSyxFQUFFTjtBQURTLENBQUQsQ0FBbkI7QUFJQSxJQUFNTyxrQkFBa0IsR0FBR04sTUFBTSxDQUFDO0FBQzlCTyxFQUFBQSxLQUFLLEVBQUVSO0FBRHVCLENBQUQsQ0FBakM7QUFJQSxJQUFNUywwQkFBMEIsR0FBR1IsTUFBTSxDQUFDO0FBQ3RDUyxFQUFBQSxZQUFZLEVBQUVWO0FBRHdCLENBQUQsQ0FBekM7QUFJQSxJQUFNVyx5QkFBeUIsR0FBR1YsTUFBTSxDQUFDO0FBQ3JDVyxFQUFBQSxZQUFZLEVBQUVaLE1BRHVCO0FBRXJDYSxFQUFBQSxRQUFRLEVBQUViO0FBRjJCLENBQUQsQ0FBeEM7QUFLQSxJQUFNYyxzQkFBc0IsR0FBR2IsTUFBTSxDQUFDO0FBQ2xDVyxFQUFBQSxZQUFZLEVBQUVaLE1BRG9CO0FBRWxDYSxFQUFBQSxRQUFRLEVBQUViO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFN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RUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDUSxRQUE3QixFQUF1QzFHLE9BQXZDLENBSEE7QUFJVmpDLE1BQUFBLFlBQVksRUFBRW1JLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ25JLFlBQTdCLEVBQTJDb0gsV0FBM0M7QUFKSjtBQTVDWCxHQUFQO0FBbURIOztBQUNENEIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JmLEVBQUFBLGVBQWUsRUFBZkE7QUFEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuY29uc3QgeyBzY2FsYXIsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IE5vbmUgPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ3VycmVuY3lDb2xsZWN0aW9uID0gc3RydWN0KHtcbiAgICBHcmFtczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5SZWd1bGFyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TaW1wbGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWRkck5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyU3RkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyU3RkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyVmFyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BZGRyTm9uZSkge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJFeHRlcm4pIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgdmFsdWU6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzRXh0LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICBpbXBvcnRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NFeHQsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyID0gc3RydWN0KHtcbiAgICBJbnRNc2dJbmZvOiBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBFeHRJbk1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8sXG4gICAgRXh0T3V0TXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8sXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlclJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouSW50TXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0SW5Nc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dE91dE1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSW5pdCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBoZWFkZXI6IE1lc3NhZ2VIZWFkZXIsXG4gICAgaW5pdDogTWVzc2FnZUluaXQsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgY3VyX2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBJbk1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSUhSID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJbW1lZGlhdGVsbHkgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZEZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgRXh0ZXJuYWw6IEluTXNnRXh0ZXJuYWwsXG4gICAgSUhSOiBJbk1zZ0lIUixcbiAgICBJbW1lZGlhdGVsbHk6IEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEZpbmFsOiBJbk1zZ0ZpbmFsLFxuICAgIFRyYW5zaXQ6IEluTXNnVHJhbnNpdCxcbiAgICBEaXNjYXJkZWRGaW5hbDogSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBEaXNjYXJkZWRUcmFuc2l0OiBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG59KTtcblxuY29uc3QgSW5Nc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLklIUikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0lIUlZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSW1tZWRpYXRlbGx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSW1tZWRpYXRlbGx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5GaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkRmluYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5Ob25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVseSkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouT3V0TXNnTmV3KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EZXF1ZXVlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXRSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBleHBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfY29sbGVjdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgY3JlYXRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZnJvbV9wcmV2X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIG1pbnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ID0gc3RydWN0KHtcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuID0gc3RydWN0KHtcbiAgICBkdW1teTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGUgPSBzdHJ1Y3Qoe1xuICAgIEFjY291bnRVbmluaXQ6IE5vbmUsXG4gICAgQWNjb3VudEFjdGl2ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudEZyb3plbjogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4sXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWNjb3VudFVuaW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudFVuaW5pdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWNjb3VudEFjdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWNjb3VudEZyb3plbikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlID0gc3RydWN0KHtcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgYmFsYW5jZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgX2tleTogc2NhbGFyLFxuICAgIHN0b3JhZ2Vfc3RhdDogQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIHN0b3JhZ2U6IEFjY291bnRTdG9yYWdlLFxuICAgIGFkZHI6IE1zZ0FkZHJlc3NJbnQsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyU3RvcmFnZVBoYXNlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNyZWRpdFBoYXNlID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBjcmVkaXQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVNraXBwZWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYXNvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlVm0gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IHNjYWxhcixcbiAgICBnYXNfdXNlZDogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZSA9IHN0cnVjdCh7XG4gICAgU2tpcHBlZDogVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFZtOiBUckNvbXB1dGVQaGFzZVZtLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5Ta2lwcGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlU2tpcHBlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVm0pIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouTmVnZnVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5lZ2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5Ob2Z1bmRzKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOb2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5Paykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouT3JkaW5hcnkpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TdG9yYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TdG9yYWdlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UaWNrVG9jaykge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNwbGl0UHJlcGFyZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TcGxpdEluc3RhbGwpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTWVyZ2VQcmVwYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk1lcmdlSW5zdGFsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBzY2FsYXIsXG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgZGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgcm9vdF9jZWxsOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgSW50ZXJtZWRpYXRlQWRkcmVzczogSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzSW50OiBNc2dBZGRyZXNzSW50UmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NFeHQ6IE1zZ0FkZHJlc3NFeHRSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJDb21wdXRlUGhhc2U6IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyQm91bmNlUGhhc2U6IFRyQm91bmNlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==