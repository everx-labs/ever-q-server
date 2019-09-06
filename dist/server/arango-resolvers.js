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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiZHVtbXkiLCJDdXJyZW5jeUNvbGxlY3Rpb24iLCJHcmFtcyIsIkludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyIiwidXNlX3NyY19iaXRzIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSIsIndvcmtjaGFpbl9pZCIsImFkZHJfcGZ4IiwiSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCIsIkludGVybWVkaWF0ZUFkZHJlc3MiLCJSZWd1bGFyIiwiU2ltcGxlIiwiRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyIiwiX19yZXNvbHZlVHlwZSIsIm9iaiIsImNvbnRleHQiLCJpbmZvIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0IiwicmV3cml0ZV9wZngiLCJNc2dBZGRyZXNzSW50QWRkclN0ZCIsImFueWNhc3QiLCJhZGRyZXNzIiwiTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0IiwiTXNnQWRkcmVzc0ludEFkZHJWYXIiLCJNc2dBZGRyZXNzSW50IiwiQWRkck5vbmUiLCJBZGRyU3RkIiwiQWRkclZhciIsIk1zZ0FkZHJlc3NJbnRSZXNvbHZlciIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJNZXNzYWdlSGVhZGVySW50TXNnSW5mbyIsImlocl9kaXNhYmxlZCIsImJvdW5jZSIsImJvdW5jZWQiLCJzcmMiLCJkc3QiLCJ2YWx1ZSIsImlocl9mZWUiLCJmd2RfZmVlIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvIiwiaW1wb3J0X2ZlZSIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlciIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlclJlc29sdmVyIiwiTWVzc2FnZUluaXQiLCJzcGxpdF9kZXB0aCIsInNwZWNpYWwiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJNZXNzYWdlIiwiaWQiLCJ0cmFuc2FjdGlvbl9pZCIsImJsb2NrX2lkIiwiaGVhZGVyIiwiaW5pdCIsImJvZHkiLCJzdGF0dXMiLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZ0V4dGVybmFsIiwidHJhbnNhY3Rpb24iLCJJbk1zZ0lIUiIsInByb29mX2NyZWF0ZWQiLCJJbk1zZ0ltbWVkaWF0ZWxseSIsImluX21zZyIsIkluTXNnRmluYWwiLCJJbk1zZ1RyYW5zaXQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJJbk1zZ0Rpc2NhcmRlZEZpbmFsIiwiSW5Nc2dEaXNjYXJkZWRUcmFuc2l0IiwicHJvb2ZfZGVsaXZlcmVkIiwiSW5Nc2ciLCJFeHRlcm5hbCIsIklIUiIsIkltbWVkaWF0ZWxseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIkluTXNnUmVzb2x2ZXIiLCJPdXRNc2dFeHRlcm5hbCIsIk91dE1zZ0ltbWVkaWF0ZWx5IiwicmVpbXBvcnQiLCJPdXRNc2dPdXRNc2dOZXciLCJPdXRNc2dUcmFuc2l0IiwiaW1wb3J0ZWQiLCJPdXRNc2dEZXF1ZXVlIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3V0TXNnVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnIiwiSW1tZWRpYXRlbHkiLCJPdXRNc2dOZXciLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnUmVzb2x2ZXIiLCJCbG9ja0luZm9QcmV2UmVmUHJldiIsIkJsb2NrSW5mb1ByZXZSZWYiLCJwcmV2IiwiQmxvY2tJbmZvU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsInNoYXJkX3ByZWZpeCIsIkJsb2NrSW5mb01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrSW5mb1ByZXZWZXJ0UmVmIiwicHJldl9hbHQiLCJCbG9ja0luZm8iLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsInByZXZfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYmVmb3JlX3NwbGl0IiwiYWZ0ZXJfc3BsaXQiLCJ3YW50X21lcmdlIiwidmVydF9zZXFfbm8iLCJzdGFydF9sdCIsInNoYXJkIiwibWluX3JlZl9tY19zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja0V4dHJhIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwidmFsdWVfZmxvdyIsImV4dHJhIiwiQWNjb3VudFN0b3JhZ2VTdGF0IiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwiZGVzY3JpcHRpb24iLCJyb290X2NlbGwiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUFtREEsT0FBTyxDQUFDLG1CQUFELEM7SUFBbERDLE0sWUFBQUEsTTtJQUFRQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3JDLElBQU1DLElBQUksR0FBR0osTUFBTSxDQUFDO0FBQ2hCSyxFQUFBQSxLQUFLLEVBQUVOO0FBRFMsQ0FBRCxDQUFuQjtBQUlBLElBQU1PLGtCQUFrQixHQUFHTixNQUFNLENBQUM7QUFDOUJPLEVBQUFBLEtBQUssRUFBRVI7QUFEdUIsQ0FBRCxDQUFqQztBQUlBLElBQU1TLDBCQUEwQixHQUFHUixNQUFNLENBQUM7QUFDdENTLEVBQUFBLFlBQVksRUFBRVY7QUFEd0IsQ0FBRCxDQUF6QztBQUlBLElBQU1XLHlCQUF5QixHQUFHVixNQUFNLENBQUM7QUFDckNXLEVBQUFBLFlBQVksRUFBRVosTUFEdUI7QUFFckNhLEVBQUFBLFFBQVEsRUFBRWI7QUFGMkIsQ0FBRCxDQUF4QztBQUtBLElBQU1jLHNCQUFzQixHQUFHYixNQUFNLENBQUM7QUFDbENXLEVBQUFBLFlBQVksRUFBRVosTUFEb0I7QUFFbENhLEVBQUFBLFFBQVEsRUFBRWI7QUFGd0IsQ0FBRCxDQUFyQztBQUtBLElBQU1lLG1CQUFtQixHQUFHZCxNQUFNLENBQUM7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O0FBSVZqQyxNQUFBQSxZQUFZLEVBQUVrSSxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNsSSxZQUE3QixFQUEyQ29ILFdBQTNDO0FBSko7QUE1Q1gsR0FBUDtBQW1ESDs7QUFDRDJCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNiZixFQUFBQSxlQUFlLEVBQWZBO0FBRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgZHVtbXk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDdXJyZW5jeUNvbGxlY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIEdyYW1zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIgPSBzdHJ1Y3Qoe1xuICAgIHVzZV9zcmNfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzID0gc3RydWN0KHtcbiAgICBSZWd1bGFyOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBTaW1wbGU6IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUsXG4gICAgRXh0OiBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0LFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlJlZ3VsYXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNpbXBsZSkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc0V4dFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhciA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyU3RkOiBNc2dBZGRyZXNzSW50QWRkclN0ZCxcbiAgICBBZGRyVmFyOiBNc2dBZGRyZXNzSW50QWRkclZhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BZGRyTm9uZSkge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJTdGQpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJTdGRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJWYXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJWYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdG9yYWdlVXNlZFNob3J0ID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTcGxpdE1lcmdlSW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0QWRkckV4dGVybiA9IHN0cnVjdCh7XG4gICAgQWRkckV4dGVybjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJFeHRlcm46IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkFkZHJOb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWRkckV4dGVybikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkckV4dGVyblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICB2YWx1ZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0V4dCxcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXIgPSBzdHJ1Y3Qoe1xuICAgIEludE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBFeHRPdXRNc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5JbnRNc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHRJbk1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0T3V0TXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBFeHRlcm5hbDogSW5Nc2dFeHRlcm5hbCxcbiAgICBJSFI6IEluTXNnSUhSLFxuICAgIEltbWVkaWF0ZWxseTogSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgRmluYWw6IEluTXNnRmluYWwsXG4gICAgVHJhbnNpdDogSW5Nc2dUcmFuc2l0LFxuICAgIERpc2NhcmRlZEZpbmFsOiBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIERpc2NhcmRlZFRyYW5zaXQ6IEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbn0pO1xuXG5jb25zdCBJbk1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSUhSKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVsbHkpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJbW1lZGlhdGVsbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkZpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRGaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZEZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRUcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE91dE1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ0ltbWVkaWF0ZWx5ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dPdXRNc2dOZXcgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ0RlcXVldWUgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydF9ibG9ja19sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgTm9uZTogTm9uZSxcbiAgICBFeHRlcm5hbDogT3V0TXNnRXh0ZXJuYWwsXG4gICAgSW1tZWRpYXRlbHk6IE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ05ldzogT3V0TXNnT3V0TXNnTmV3LFxuICAgIFRyYW5zaXQ6IE91dE1zZ1RyYW5zaXQsXG4gICAgRGVxdWV1ZTogT3V0TXNnRGVxdWV1ZSxcbiAgICBUcmFuc2l0UmVxdWlyZWQ6IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBPdXRNc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkltbWVkaWF0ZWx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0ltbWVkaWF0ZWx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5PdXRNc2dOZXcpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkRlcXVldWUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRGVxdWV1ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdFJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4gPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BY2NvdW50VW5pbml0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50QWN0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50RnJvemVuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlNraXBwZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5WbSkge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVZtVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJBY3Rpb25QaGFzZSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IHNjYWxhcixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogc2NhbGFyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdF9tc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlTm9mdW5kcyA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgcmVxX2Z3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU9rID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBtc2dfZmVlczogc2NhbGFyLFxuICAgIGZ3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgTmVnZnVuZHM6IE5vbmUsXG4gICAgTm9mdW5kczogVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgT2s6IFRyQm91bmNlUGhhc2VPayxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5OZWdmdW5kcykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk5vZnVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk9rKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VPa1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSA9IHN0cnVjdCh7XG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBUckJvdW5jZVBoYXNlLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdHQ6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiA9IHN0cnVjdCh7XG4gICAgT3JkaW5hcnk6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSxcbiAgICBTdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBUaWNrVG9jazogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFNwbGl0UHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSxcbiAgICBTcGxpdEluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwsXG4gICAgTWVyZ2VQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIE1lcmdlSW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5PcmRpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRpY2tUb2NrKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9ja1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3BsaXRQcmVwYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNwbGl0SW5zdGFsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5NZXJnZVByZXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTWVyZ2VJbnN0YWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgZGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgcm9vdF9jZWxsOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgSW50ZXJtZWRpYXRlQWRkcmVzczogSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzSW50OiBNc2dBZGRyZXNzSW50UmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NFeHQ6IE1zZ0FkZHJlc3NFeHRSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJDb21wdXRlUGhhc2U6IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyQm91bmNlUGhhc2U6IFRyQm91bmNlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==