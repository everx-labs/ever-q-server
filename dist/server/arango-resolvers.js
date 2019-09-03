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
var GenericId = struct({
  ready: scalar,
  data: scalar
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
  _key: scalar,
  id: GenericId,
  transaction_id: GenericId,
  block_id: GenericId,
  header: MessageHeader,
  init: MessageInit,
  body: scalar,
  status: scalar
});
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
  _key: scalar,
  id: GenericId,
  status: scalar,
  global_id: scalar,
  info: BlockInfo,
  value_flow: BlockValueFlow,
  extra: BlockExtra,
  state_update: BlockStateUpdate
});
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
  _key: scalar,
  storage_stat: AccountStorageStat,
  storage: AccountStorage,
  addr: MsgAddressInt
});
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
  _key: scalar,
  id: GenericId,
  block_id: GenericId,
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
});

function createResolvers(db) {
  return {
    IntermediateAddress: IntermediateAddressResolver,
    MsgAddressInt: MsgAddressIntResolver,
    MsgAddressExt: MsgAddressExtResolver,
    MessageHeader: MessageHeaderResolver,
    InMsg: InMsgResolver,
    OutMsg: OutMsgResolver,
    AccountStorageState: AccountStorageStateResolver,
    TrComputePhase: TrComputePhaseResolver,
    TrBouncePhase: TrBouncePhaseResolver,
    TransactionDescription: TransactionDescriptionResolver,
    Transaction: {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiZHVtbXkiLCJDdXJyZW5jeUNvbGxlY3Rpb24iLCJHcmFtcyIsIkludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyIiwidXNlX3NyY19iaXRzIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSIsIndvcmtjaGFpbl9pZCIsImFkZHJfcGZ4IiwiSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCIsIkludGVybWVkaWF0ZUFkZHJlc3MiLCJSZWd1bGFyIiwiU2ltcGxlIiwiRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyIiwiX19yZXNvbHZlVHlwZSIsIm9iaiIsImNvbnRleHQiLCJpbmZvIiwiRXh0QmxrUmVmIiwiZW5kX2x0Iiwic2VxX25vIiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiR2VuZXJpY0lkIiwicmVhZHkiLCJkYXRhIiwiTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0IiwicmV3cml0ZV9wZngiLCJNc2dBZGRyZXNzSW50QWRkclN0ZCIsImFueWNhc3QiLCJhZGRyZXNzIiwiTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0IiwiTXNnQWRkcmVzc0ludEFkZHJWYXIiLCJNc2dBZGRyZXNzSW50IiwiQWRkck5vbmUiLCJBZGRyU3RkIiwiQWRkclZhciIsIk1zZ0FkZHJlc3NJbnRSZXNvbHZlciIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJNZXNzYWdlSGVhZGVySW50TXNnSW5mbyIsImlocl9kaXNhYmxlZCIsImJvdW5jZSIsImJvdW5jZWQiLCJzcmMiLCJkc3QiLCJ2YWx1ZSIsImlocl9mZWUiLCJmd2RfZmVlIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvIiwiaW1wb3J0X2ZlZSIsIk1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlciIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiTWVzc2FnZUhlYWRlclJlc29sdmVyIiwiTWVzc2FnZUluaXQiLCJzcGxpdF9kZXB0aCIsInNwZWNpYWwiLCJjb2RlIiwibGlicmFyeSIsIk1lc3NhZ2UiLCJfa2V5IiwiaWQiLCJ0cmFuc2FjdGlvbl9pZCIsImJsb2NrX2lkIiwiaGVhZGVyIiwiaW5pdCIsImJvZHkiLCJzdGF0dXMiLCJNc2dFbnZlbG9wZSIsIm1zZyIsIm5leHRfYWRkciIsImN1cl9hZGRyIiwiZndkX2ZlZV9yZW1haW5pbmciLCJJbk1zZ0V4dGVybmFsIiwidHJhbnNhY3Rpb24iLCJJbk1zZ0lIUiIsInByb29mX2NyZWF0ZWQiLCJJbk1zZ0ltbWVkaWF0ZWxseSIsImluX21zZyIsIkluTXNnRmluYWwiLCJJbk1zZ1RyYW5zaXQiLCJvdXRfbXNnIiwidHJhbnNpdF9mZWUiLCJJbk1zZ0Rpc2NhcmRlZEZpbmFsIiwiSW5Nc2dEaXNjYXJkZWRUcmFuc2l0IiwicHJvb2ZfZGVsaXZlcmVkIiwiSW5Nc2ciLCJFeHRlcm5hbCIsIklIUiIsIkltbWVkaWF0ZWxseSIsIkZpbmFsIiwiVHJhbnNpdCIsIkRpc2NhcmRlZEZpbmFsIiwiRGlzY2FyZGVkVHJhbnNpdCIsIkluTXNnUmVzb2x2ZXIiLCJPdXRNc2dFeHRlcm5hbCIsIk91dE1zZ0ltbWVkaWF0ZWx5IiwicmVpbXBvcnQiLCJPdXRNc2dPdXRNc2dOZXciLCJPdXRNc2dUcmFuc2l0IiwiaW1wb3J0ZWQiLCJPdXRNc2dEZXF1ZXVlIiwiaW1wb3J0X2Jsb2NrX2x0IiwiT3V0TXNnVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnIiwiSW1tZWRpYXRlbHkiLCJPdXRNc2dOZXciLCJEZXF1ZXVlIiwiVHJhbnNpdFJlcXVpcmVkIiwiT3V0TXNnUmVzb2x2ZXIiLCJCbG9ja0luZm9QcmV2UmVmUHJldiIsIkJsb2NrSW5mb1ByZXZSZWYiLCJwcmV2IiwiQmxvY2tJbmZvU2hhcmQiLCJzaGFyZF9wZnhfYml0cyIsInNoYXJkX3ByZWZpeCIsIkJsb2NrSW5mb01hc3RlclJlZiIsIm1hc3RlciIsIkJsb2NrSW5mb1ByZXZWZXJ0UmVmIiwicHJldl9hbHQiLCJCbG9ja0luZm8iLCJ3YW50X3NwbGl0IiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fdXRpbWUiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJmbGFncyIsInByZXZfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYmVmb3JlX3NwbGl0IiwiYWZ0ZXJfc3BsaXQiLCJ3YW50X21lcmdlIiwidmVydF9zZXFfbm8iLCJzdGFydF9sdCIsInNoYXJkIiwibWluX3JlZl9tY19zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwiQmxvY2tWYWx1ZUZsb3ciLCJ0b19uZXh0X2JsayIsImV4cG9ydGVkIiwiZmVlc19jb2xsZWN0ZWQiLCJjcmVhdGVkIiwiZnJvbV9wcmV2X2JsayIsIm1pbnRlZCIsImZlZXNfaW1wb3J0ZWQiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsIlN0cmluZ0FycmF5IiwiU3RyaW5nIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3MiLCJhY2NvdW50X2FkZHIiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIkluTXNnQXJyYXkiLCJPdXRNc2dBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkiLCJCbG9ja0V4dHJhIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwiQmxvY2tTdGF0ZVVwZGF0ZSIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIkJsb2NrIiwiZ2xvYmFsX2lkIiwidmFsdWVfZmxvdyIsImV4dHJhIiwiQWNjb3VudFN0b3JhZ2VTdGF0IiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQW1EQSxPQUFPLENBQUMsbUJBQUQsQztJQUFsREMsTSxZQUFBQSxNO0lBQVFDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDckMsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJLLEVBQUFBLEtBQUssRUFBRU47QUFEUyxDQUFELENBQW5CO0FBSUEsSUFBTU8sa0JBQWtCLEdBQUdOLE1BQU0sQ0FBQztBQUM5Qk8sRUFBQUEsS0FBSyxFQUFFUjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVMsMEJBQTBCLEdBQUdSLE1BQU0sQ0FBQztBQUN0Q1MsRUFBQUEsWUFBWSxFQUFFVjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTVcseUJBQXlCLEdBQUdWLE1BQU0sQ0FBQztBQUNyQ1csRUFBQUEsWUFBWSxFQUFFWixNQUR1QjtBQUVyQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWMsc0JBQXNCLEdBQUdiLE1BQU0sQ0FBQztBQUNsQ1csRUFBQUEsWUFBWSxFQUFFWixNQURvQjtBQUVsQ2EsRUFBQUEsUUFBUSxFQUFFYjtBQUZ3QixDQUFELENBQXJDO0FBS0EsSUFBTWUsbUJB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QUNIRixNQUFBQSxRQUFRLEVBQUVILEVBQUUsQ0FBQ00sZUFBSCxDQUFtQk4sRUFBRSxDQUFDRyxRQUF0QixFQUFnQ2xPLE9BQWhDLENBRFA7QUFFSHNPLE1BQUFBLE1BQU0sRUFBRVAsRUFBRSxDQUFDTSxlQUFILENBQW1CTixFQUFFLENBQUNPLE1BQXRCLEVBQThCekgsS0FBOUIsQ0FGTDtBQUdIMEgsTUFBQUEsUUFBUSxFQUFFUixFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ1EsUUFBdEIsRUFBZ0N4RyxPQUFoQyxDQUhQO0FBSUhqQyxNQUFBQSxZQUFZLEVBQUVpSSxFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ2pJLFlBQXRCLEVBQW9DbUgsV0FBcEMsQ0FKWDtBQUtIdUIsTUFBQUEsTUFBTSxFQUFFVCxFQUFFLENBQUNVLFdBQUg7QUFMTCxLQW5CSjtBQTBCSEMsSUFBQUEsWUFBWSxFQUFFO0FBQ1ZSLE1BQUFBLFFBQVEsRUFBRUgsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDRyxRQUE3QixFQUF1Q2xPLE9BQXZDLENBREE7QUFFVnNPLE1BQUFBLE1BQU0sRUFBRVAsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDTyxNQUE3QixFQUFxQ3pILEtBQXJDLENBRkU7QUFHVjBILE1BQUFBLFFBQVEsRUFBRVIsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDUSxRQUE3QixFQUF1Q3hHLE9BQXZDLENBSEE7QUFJVmpDLE1BQUFBLFlBQVksRUFBRWlJLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ2pJLFlBQTdCLEVBQTJDbUgsV0FBM0M7QUFKSjtBQTFCWCxHQUFQO0FBaUNIOztBQUNEMkIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JmLEVBQUFBLGVBQWUsRUFBZkE7QUFEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBOb25lID0gc3RydWN0KHtcbiAgICBkdW1teTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouUmVndWxhcikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU2ltcGxlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHZW5lcmljSWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYWR5OiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWRkck5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyU3RkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyU3RkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyVmFyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BZGRyTm9uZSkge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFkZHJFeHRlcm4pIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgdmFsdWU6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzRXh0LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICBpbXBvcnRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NFeHQsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyID0gc3RydWN0KHtcbiAgICBJbnRNc2dJbmZvOiBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBFeHRJbk1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8sXG4gICAgRXh0T3V0TXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8sXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlclJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouSW50TXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0SW5Nc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dE91dE1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSW5pdCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgaWQ6IEdlbmVyaWNJZCxcbiAgICB0cmFuc2FjdGlvbl9pZDogR2VuZXJpY0lkLFxuICAgIGJsb2NrX2lkOiBHZW5lcmljSWQsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5FeHRlcm5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JSFIpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJSFJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkltbWVkaWF0ZWxseSkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRmluYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkRpc2NhcmRlZEZpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkRpc2NhcmRlZFRyYW5zaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgT3V0TXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnSW1tZWRpYXRlbHkgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ091dE1zZ05ldyA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnRGVxdWV1ZSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdFJlcXVpcmVkID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBOb25lOiBOb25lLFxuICAgIEV4dGVybmFsOiBPdXRNc2dFeHRlcm5hbCxcbiAgICBJbW1lZGlhdGVseTogT3V0TXNnSW1tZWRpYXRlbHksXG4gICAgT3V0TXNnTmV3OiBPdXRNc2dPdXRNc2dOZXcsXG4gICAgVHJhbnNpdDogT3V0TXNnVHJhbnNpdCxcbiAgICBEZXF1ZXVlOiBPdXRNc2dEZXF1ZXVlLFxuICAgIFRyYW5zaXRSZXF1aXJlZDogT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxufSk7XG5cbmNvbnN0IE91dE1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouTm9uZSkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHRlcm5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSW1tZWRpYXRlbHkpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnSW1tZWRpYXRlbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk91dE1zZ05ldykge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dPdXRNc2dOZXdWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGVxdWV1ZSkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dEZXF1ZXVlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0UmVxdWlyZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFJlcXVpcmVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZlByZXYgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEJsb2NrSW5mb1ByZXZSZWZQcmV2LFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1NoYXJkID0gc3RydWN0KHtcbiAgICBzaGFyZF9wZnhfYml0czogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkX3ByZWZpeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb01hc3RlclJlZiA9IHN0cnVjdCh7XG4gICAgbWFzdGVyOiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlZlcnRSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdDogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mbyA9IHN0cnVjdCh7XG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBwcmV2X3JlZjogQmxvY2tJbmZvUHJldlJlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2hhcmQ6IEJsb2NrSW5mb1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBCbG9ja0luZm9NYXN0ZXJSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogQmxvY2tJbmZvUHJldlZlcnRSZWYsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZXhwb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2NvbGxlY3RlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGNyZWF0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZyb21fcHJldl9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBtaW50ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2ltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoU3RyaW5nKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tFeHRyYUFjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2tFeHRyYSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgX2tleTogc2NhbGFyLFxuICAgIGlkOiBHZW5lcmljSWQsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4gPSBzdHJ1Y3Qoe1xuICAgIGR1bW15OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BY2NvdW50VW5pbml0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50QWN0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50RnJvemVuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgX2tleTogc2NhbGFyLFxuICAgIHN0b3JhZ2Vfc3RhdDogQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIHN0b3JhZ2U6IEFjY291bnRTdG9yYWdlLFxuICAgIGFkZHI6IE1zZ0FkZHJlc3NJbnQsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyU3RvcmFnZVBoYXNlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNyZWRpdFBoYXNlID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBjcmVkaXQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVNraXBwZWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYXNvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlVm0gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IHNjYWxhcixcbiAgICBnYXNfdXNlZDogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZSA9IHN0cnVjdCh7XG4gICAgU2tpcHBlZDogVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFZtOiBUckNvbXB1dGVQaGFzZVZtLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5Ta2lwcGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlU2tpcHBlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVm0pIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouTmVnZnVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5lZ2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5Ob2Z1bmRzKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOb2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5Paykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouT3JkaW5hcnkpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TdG9yYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TdG9yYWdlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UaWNrVG9jaykge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNwbGl0UHJlcGFyZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TcGxpdEluc3RhbGwpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTWVyZ2VQcmVwYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk1lcmdlSW5zdGFsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgX2tleTogc2NhbGFyLFxuICAgIGlkOiBHZW5lcmljSWQsXG4gICAgYmxvY2tfaWQ6IEdlbmVyaWNJZCxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogc2NhbGFyLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2c6IE91dE1zZ1Jlc29sdmVyLFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==