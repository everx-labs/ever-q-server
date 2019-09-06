"use strict";

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiZHVtbXkiLCJDdXJyZW5jeUNvbGxlY3Rpb24iLCJHcmFtcyIsIkludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyIiwidXNlX3NyY19iaXRzIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSIsIndvcmtjaGFpbl9pZCIsImFkZHJfcGZ4IiwiSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCIsIkludGVybWVkaWF0ZUFkZHJlc3MiLCJSZWd1bGFyIiwiU2ltcGxlIiwiRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyIiwiX19yZXNvbHZlVHlwZSIsIm9iaiIsImNvbnRleHQiLCJpbmZvIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0IiwicmV3cml0ZV9wZngiLCJNc2dBZGRyZXNzSW50QWRkclN0ZCIsImFueWNhc3QiLCJhZGRyZXNzIiwiTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0IiwiTXNnQWRkcmVzc0ludEFkZHJWYXIiLCJNc2dBZGRyZXNzSW50IiwiQWRkck5vbmUiLCJBZGRyU3RkIiwiQWRkclZhciIsIk1zZ0FkZHJlc3NJbnRSZXNvbHZlciIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJNZXNzYWdlSGVhZGVySW50TXNnSW5mbyIsImlocl9kaXNhYmxlZCIsImJvdW5jZSIsImJvdW5jZWQiLCJzcmMiLCJkc3QiLCJ2YWx1ZSIsImlocl9mZWUiLCJmd2RfZmVlIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvIiwiaW1wb3J0X2ZlZSIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlciIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlclJlc29sdmVyIiwiTWVzc2FnZUluaXQiLCJzcGxpdF9kZXB0aCIsInNwZWNpYWwiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJNZXNzYWdlIiwiaWQiLCJ0cmFuc2FjdGlvbl9pZCIsImJsb2NrX2lkIiwiaGVhZGVyIiwiaW5pdCIsImJvZHkiLCJzdGF0dXMiLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZ0V4dGVybmFsIiwidHJhbnNhY3Rpb24iLCJJbk1zZ0lIUiIsInByb29mX2NyZWF0ZWQiLCJJbk1zZ0ltbWVkaWF0ZWxseSIsImluX21zZyIsIkluTXNnRmluYWwiLCJJbk1zZ1RyYW5zaXQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJJbk1zZ0Rpc2NhcmRlZEZpbmFsIiwiSW5Nc2dEaXNjYXJkZWRUcmFuc2l0IiwicHJvb2ZfZGVsaXZlcmVkIiwiSW5Nc2ciLCJFeHRlcm5hbCIsIklIUiIsIkltbWVkaWF0ZWxseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIkluTXNnUmVzb2x2ZXIiLCJPdXRNc2dFeHRlcm5hbCIsIk91dE1zZ0ltbWVkaWF0ZWx5IiwicmVpbXBvcnQiLCJPdXRNc2dPdXRNc2dOZXciLCJPdXRNc2dUcmFuc2l0IiwiaW1wb3J0ZWQiLCJPdXRNc2dEZXF1ZXVlIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3V0TXNnVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnIiwiSW1tZWRpYXRlbHkiLCJPdXRNc2dOZXciLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnUmVzb2x2ZXIiLCJCbG9ja0luZm9QcmV2UmVmUHJldiIsIkJsb2NrSW5mb1ByZXZSZWYiLCJwcmV2IiwiQmxvY2tJbmZvU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsInNoYXJkX3ByZWZpeCIsIkJsb2NrSW5mb01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrSW5mb1ByZXZWZXJ0UmVmIiwicHJldl9hbHQiLCJCbG9ja0luZm8iLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsInByZXZfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYmVmb3JlX3NwbGl0IiwiYWZ0ZXJfc3BsaXQiLCJ3YW50X21lcmdlIiwidmVydF9zZXFfbm8iLCJzdGFydF9sdCIsInNoYXJkIiwibWluX3JlZl9tY19zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja0V4dHJhIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwidmFsdWVfZmxvdyIsImV4dHJhIiwiQWNjb3VudFN0b3JhZ2VTdGF0IiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQW1EQSxPQUFPLENBQUMsbUJBQUQsQztJQUFsREMsTSxZQUFBQSxNO0lBQVFDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDckMsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJLLEVBQUFBLEtBQUssRUFBRU47QUFEUyxDQUFELENBQW5CO0FBSUEsSUFBTU8sa0JBQWtCLEdBQUdOLE1BQU0sQ0FBQztBQUM5Qk8sRUFBQUEsS0FBSyxFQUFFUjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVMsMEJBQTBCLEdBQUdSLE1BQU0sQ0FBQztBQUN0Q1MsRUFBQUEsWUFBWSxFQUFFVjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTVcseUJBQXlCLEdBQUdWLE1BQU0sQ0FBQztBQUNyQ1csRUFBQUEsWUFBWSxFQUFFWixNQUR1QjtBQUVyQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWMsc0JBQXNCLEdBQUdiLE1BQU0sQ0FBQztBQUNsQ1csRUFBQUEsWUFBWSxFQUFFWixNQURvQjtBQUVsQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUZ3QixDQUFELENBQXJDO0FBS0EsSUFBTWUsbUJBQW1CLEdBQUdkLE1BQU0s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MEJaLEVBQUUsQ0FBQ1EsUUFBN0IsRUFBdUMxRyxPQUF2QyxDQUhBO0FBSVZqQyxNQUFBQSxZQUFZLEVBQUVtSSxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNuSSxZQUE3QixFQUEyQ29ILFdBQTNDO0FBSko7QUE1Q1gsR0FBUDtBQW1ESDs7QUFDRDRCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNiZixFQUFBQSxlQUFlLEVBQWZBO0FBRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgZHVtbXk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDdXJyZW5jeUNvbGxlY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIEdyYW1zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIgPSBzdHJ1Y3Qoe1xuICAgIHVzZV9zcmNfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzID0gc3RydWN0KHtcbiAgICBSZWd1bGFyOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBTaW1wbGU6IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUsXG4gICAgRXh0OiBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0LFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlJlZ3VsYXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNpbXBsZSkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc0V4dFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhciA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyU3RkOiBNc2dBZGRyZXNzSW50QWRkclN0ZCxcbiAgICBBZGRyVmFyOiBNc2dBZGRyZXNzSW50QWRkclZhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BZGRyTm9uZSkge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJTdGQpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJTdGRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJWYXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJWYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdG9yYWdlVXNlZFNob3J0ID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTcGxpdE1lcmdlSW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0QWRkckV4dGVybiA9IHN0cnVjdCh7XG4gICAgQWRkckV4dGVybjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJFeHRlcm46IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkFkZHJOb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWRkckV4dGVybikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkckV4dGVyblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICB2YWx1ZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0V4dCxcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXIgPSBzdHJ1Y3Qoe1xuICAgIEludE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBFeHRPdXRNc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5JbnRNc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHRJbk1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0T3V0TXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBFeHRlcm5hbDogSW5Nc2dFeHRlcm5hbCxcbiAgICBJSFI6IEluTXNnSUhSLFxuICAgIEltbWVkaWF0ZWxseTogSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgRmluYWw6IEluTXNnRmluYWwsXG4gICAgVHJhbnNpdDogSW5Nc2dUcmFuc2l0LFxuICAgIERpc2NhcmRlZEZpbmFsOiBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIERpc2NhcmRlZFRyYW5zaXQ6IEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbn0pO1xuXG5jb25zdCBJbk1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSUhSKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVsbHkpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJbW1lZGlhdGVsbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkZpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRGaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZEZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRUcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE91dE1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ0ltbWVkaWF0ZWx5ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dPdXRNc2dOZXcgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ0RlcXVldWUgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydF9ibG9ja19sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgTm9uZTogTm9uZSxcbiAgICBFeHRlcm5hbDogT3V0TXNnRXh0ZXJuYWwsXG4gICAgSW1tZWRpYXRlbHk6IE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ05ldzogT3V0TXNnT3V0TXNnTmV3LFxuICAgIFRyYW5zaXQ6IE91dE1zZ1RyYW5zaXQsXG4gICAgRGVxdWV1ZTogT3V0TXNnRGVxdWV1ZSxcbiAgICBUcmFuc2l0UmVxdWlyZWQ6IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBPdXRNc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkltbWVkaWF0ZWx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0ltbWVkaWF0ZWx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5PdXRNc2dOZXcpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkRlcXVldWUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRGVxdWV1ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdFJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4gPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BY2NvdW50VW5pbml0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50QWN0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50RnJvemVuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlNraXBwZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5WbSkge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVZtVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJBY3Rpb25QaGFzZSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IHNjYWxhcixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogc2NhbGFyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdF9tc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlTm9mdW5kcyA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgcmVxX2Z3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU9rID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBtc2dfZmVlczogc2NhbGFyLFxuICAgIGZ3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgTmVnZnVuZHM6IE5vbmUsXG4gICAgTm9mdW5kczogVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgT2s6IFRyQm91bmNlUGhhc2VPayxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5OZWdmdW5kcykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk5vZnVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk9rKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VPa1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSA9IHN0cnVjdCh7XG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBUckJvdW5jZVBoYXNlLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdHQ6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiA9IHN0cnVjdCh7XG4gICAgT3JkaW5hcnk6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSxcbiAgICBTdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBUaWNrVG9jazogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFNwbGl0UHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSxcbiAgICBTcGxpdEluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwsXG4gICAgTWVyZ2VQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIE1lcmdlSW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5PcmRpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRpY2tUb2NrKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9ja1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3BsaXRQcmVwYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNwbGl0SW5zdGFsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5NZXJnZVByZXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTWVyZ2VJbnN0YWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IHNjYWxhcixcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogc2NhbGFyLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2c6IE91dE1zZ1Jlc29sdmVyLFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudFN0b3JhZ2VTdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyLFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUckNvbXB1dGVQaGFzZTogVHJDb21wdXRlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJCb3VuY2VQaGFzZTogVHJCb3VuY2VQaGFzZVJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzXG59O1xuIl19