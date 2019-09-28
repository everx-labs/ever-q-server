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
    if ('Regular' in obj) {
      return 'IntermediateAddressRegularVariant';
    }

    if ('Simple' in obj) {
      return 'IntermediateAddressSimpleVariant';
    }

    if ('Ext' in obj) {
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
    if ('AddrNone' in obj) {
      return 'MsgAddressIntAddrNoneVariant';
    }

    if ('AddrStd' in obj) {
      return 'MsgAddressIntAddrStdVariant';
    }

    if ('AddrVar' in obj) {
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
    if ('AddrNone' in obj) {
      return 'MsgAddressExtAddrNoneVariant';
    }

    if ('AddrExtern' in obj) {
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
    if ('IntMsgInfo' in obj) {
      return 'MessageHeaderIntMsgInfoVariant';
    }

    if ('ExtInMsgInfo' in obj) {
      return 'MessageHeaderExtInMsgInfoVariant';
    }

    if ('ExtOutMsgInfo' in obj) {
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
    if ('External' in obj) {
      return 'InMsgExternalVariant';
    }

    if ('IHR' in obj) {
      return 'InMsgIHRVariant';
    }

    if ('Immediatelly' in obj) {
      return 'InMsgImmediatellyVariant';
    }

    if ('Final' in obj) {
      return 'InMsgFinalVariant';
    }

    if ('Transit' in obj) {
      return 'InMsgTransitVariant';
    }

    if ('DiscardedFinal' in obj) {
      return 'InMsgDiscardedFinalVariant';
    }

    if ('DiscardedTransit' in obj) {
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
    if ('None' in obj) {
      return 'OutMsgNoneVariant';
    }

    if ('External' in obj) {
      return 'OutMsgExternalVariant';
    }

    if ('Immediately' in obj) {
      return 'OutMsgImmediatelyVariant';
    }

    if ('OutMsgNew' in obj) {
      return 'OutMsgOutMsgNewVariant';
    }

    if ('Transit' in obj) {
      return 'OutMsgTransitVariant';
    }

    if ('Dequeue' in obj) {
      return 'OutMsgDequeueVariant';
    }

    if ('TransitRequired' in obj) {
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
    if ('AccountUninit' in obj) {
      return 'AccountStorageStateAccountUninitVariant';
    }

    if ('AccountActive' in obj) {
      return 'AccountStorageStateAccountActiveVariant';
    }

    if ('AccountFrozen' in obj) {
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
    if ('Skipped' in obj) {
      return 'TrComputePhaseSkippedVariant';
    }

    if ('Vm' in obj) {
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
    if ('Negfunds' in obj) {
      return 'TrBouncePhaseNegfundsVariant';
    }

    if ('Nofunds' in obj) {
      return 'TrBouncePhaseNofundsVariant';
    }

    if ('Ok' in obj) {
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
    if ('Ordinary' in obj) {
      return 'TransactionDescriptionOrdinaryVariant';
    }

    if ('Storage' in obj) {
      return 'TransactionDescriptionStorageVariant';
    }

    if ('TickTock' in obj) {
      return 'TransactionDescriptionTickTockVariant';
    }

    if ('SplitPrepare' in obj) {
      return 'TransactionDescriptionSplitPrepareVariant';
    }

    if ('SplitInstall' in obj) {
      return 'TransactionDescriptionSplitInstallVariant';
    }

    if ('MergePrepare' in obj) {
      return 'TransactionDescriptionMergePrepareVariant';
    }

    if ('MergeInstall' in obj) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiZHVtbXkiLCJDdXJyZW5jeUNvbGxlY3Rpb24iLCJHcmFtcyIsIkludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyIiwidXNlX3NyY19iaXRzIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSIsIndvcmtjaGFpbl9pZCIsImFkZHJfcGZ4IiwiSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCIsIkludGVybWVkaWF0ZUFkZHJlc3MiLCJSZWd1bGFyIiwiU2ltcGxlIiwiRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyIiwiX19yZXNvbHZlVHlwZSIsIm9iaiIsImNvbnRleHQiLCJpbmZvIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0IiwicmV3cml0ZV9wZngiLCJNc2dBZGRyZXNzSW50QWRkclN0ZCIsImFueWNhc3QiLCJhZGRyZXNzIiwiTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0IiwiTXNnQWRkcmVzc0ludEFkZHJWYXIiLCJNc2dBZGRyZXNzSW50IiwiQWRkck5vbmUiLCJBZGRyU3RkIiwiQWRkclZhciIsIk1zZ0FkZHJlc3NJbnRSZXNvbHZlciIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJNZXNzYWdlSGVhZGVySW50TXNnSW5mbyIsImlocl9kaXNhYmxlZCIsImJvdW5jZSIsImJvdW5jZWQiLCJzcmMiLCJkc3QiLCJ2YWx1ZSIsImlocl9mZWUiLCJmd2RfZmVlIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvIiwiaW1wb3J0X2ZlZSIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlciIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlclJlc29sdmVyIiwiTWVzc2FnZUluaXQiLCJzcGxpdF9kZXB0aCIsInNwZWNpYWwiLCJjb2RlIiwiZGF0YSIsImxpYnJhcnkiLCJNZXNzYWdlIiwiaWQiLCJ0cmFuc2FjdGlvbl9pZCIsImJsb2NrX2lkIiwiaGVhZGVyIiwiaW5pdCIsImJvZHkiLCJzdGF0dXMiLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZ0V4dGVybmFsIiwidHJhbnNhY3Rpb24iLCJJbk1zZ0lIUiIsInByb29mX2NyZWF0ZWQiLCJJbk1zZ0ltbWVkaWF0ZWxseSIsImluX21zZyIsIkluTXNnRmluYWwiLCJJbk1zZ1RyYW5zaXQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJJbk1zZ0Rpc2NhcmRlZEZpbmFsIiwiSW5Nc2dEaXNjYXJkZWRUcmFuc2l0IiwicHJvb2ZfZGVsaXZlcmVkIiwiSW5Nc2ciLCJFeHRlcm5hbCIsIklIUiIsIkltbWVkaWF0ZWxseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIkluTXNnUmVzb2x2ZXIiLCJPdXRNc2dFeHRlcm5hbCIsIk91dE1zZ0ltbWVkaWF0ZWx5IiwicmVpbXBvcnQiLCJPdXRNc2dPdXRNc2dOZXciLCJPdXRNc2dUcmFuc2l0IiwiaW1wb3J0ZWQiLCJPdXRNc2dEZXF1ZXVlIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3V0TXNnVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnIiwiSW1tZWRpYXRlbHkiLCJPdXRNc2dOZXciLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnUmVzb2x2ZXIiLCJCbG9ja0luZm9QcmV2UmVmUHJldiIsIkJsb2NrSW5mb1ByZXZSZWYiLCJwcmV2IiwiQmxvY2tJbmZvU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsInNoYXJkX3ByZWZpeCIsIkJsb2NrSW5mb01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrSW5mb1ByZXZWZXJ0UmVmIiwicHJldl9hbHQiLCJCbG9ja0luZm8iLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsInByZXZfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYmVmb3JlX3NwbGl0IiwiYWZ0ZXJfc3BsaXQiLCJ3YW50X21lcmdlIiwidmVydF9zZXFfbm8iLCJzdGFydF9sdCIsInNoYXJkIiwibWluX3JlZl9tY19zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja0V4dHJhIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwidmFsdWVfZmxvdyIsImV4dHJhIiwiQWNjb3VudFN0b3JhZ2VTdGF0IiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQW1EQSxPQUFPLENBQUMsbUJBQUQsQztJQUFsREMsTSxZQUFBQSxNO0lBQVFDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDckMsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJLLEVBQUFBLEtBQUssRUFBRU47QUFEUyxDQUFELENBQW5CO0FBSUEsSUFBTU8sa0JBQWtCLEdBQUdOLE1BQU0sQ0FBQztBQUM5Qk8sRUFBQUEsS0FBSyxFQUFFUjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVMsMEJBQTBCLEdBQUdSLE1BQU0sQ0FBQztBQUN0Q1MsRUFBQUEsWUFBWSxFQUFFVjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTVcseUJBQXlCLEdBQUdWLE1BQU0sQ0FBQztBQUNyQ1csRUFBQUEsWUFBWSxFQUFFWixNQUR1QjtBQUVyQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWMsc0JBQXNCLEdBQUdiLE1BQU0sQ0FBQztBQUNsQ1csRUFBQUEsWUFBWSxFQUFFWixNQURvQjtBQUVsQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUZ3QixDQUFELENBQXJDO0FBS0EsSUFBTWUsbUJBQW1CLEdBQUdkLE1BQU0s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Iiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IE5vbmUgPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ3VycmVuY3lDb2xsZWN0aW9uID0gc3RydWN0KHtcbiAgICBHcmFtczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdSZWd1bGFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NpbXBsZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJTdGQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclZhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkckV4dGVybicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0V4dCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgaW1wb3J0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0ludE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0SW5Nc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0T3V0TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0lIUicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVsbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZFRyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT3V0TXNnTmV3JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGVxdWV1ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXRSZXF1aXJlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4gPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBY2NvdW50VW5pbml0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRVbmluaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRBY3RpdmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEZyb3plbicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ1NraXBwZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1ZtJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTmVnZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ05vZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnT3JkaW5hcnknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1N0b3JhZ2UnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVGlja1RvY2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0UHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0SW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlUHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlSW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IHNjYWxhcixcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogc2NhbGFyLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2c6IE91dE1zZ1Jlc29sdmVyLFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudFN0b3JhZ2VTdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyLFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUckNvbXB1dGVQaGFzZTogVHJDb21wdXRlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJCb3VuY2VQaGFzZTogVHJCb3VuY2VQaGFzZVJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzXG59O1xuIl19