"use strict";

var _require = require('./arango.js'),
    scalar = _require.scalar,
    struct = _require.struct,
    array = _require.array;

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
var StateInit = struct({
  split_depth: scalar,
  special: TickTock,
  code: scalar,
  data: scalar,
  library: scalar
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
var CommonMsgInfIntMsgInfo = struct({
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
var CommonMsgInfExtInMsgInfo = struct({
  src: MsgAddressExt,
  dst: MsgAddressInt,
  import_fee: scalar
});
var CommonMsgInfExtOutMsgInfo = struct({
  src: MsgAddressInt,
  dst: MsgAddressExt,
  created_lt: scalar,
  created_at: scalar
});
var CommonMsgInf = struct({
  IntMsgInfo: CommonMsgInfIntMsgInfo,
  ExtInMsgInfo: CommonMsgInfExtInMsgInfo,
  ExtOutMsgInfo: CommonMsgInfExtOutMsgInfo
});
var CommonMsgInfResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.IntMsgInfo) {
      return 'CommonMsgInfIntMsgInfoVariant';
    }

    if (obj.ExtInMsgInfo) {
      return 'CommonMsgInfExtInMsgInfoVariant';
    }

    if (obj.ExtOutMsgInfo) {
      return 'CommonMsgInfExtOutMsgInfoVariant';
    }

    return null;
  }
};
var Message = struct({
  _key: scalar,
  id: GenericId,
  transaction_id: GenericId,
  block_id: GenericId,
  header: CommonMsgInf,
  init: StateInit,
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
var TransactionDescrOrdinary = struct({
  credit_first: scalar,
  storage_ph: TrStoragePhase,
  credit_ph: TrCreditPhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  bounce: TrBouncePhase,
  destroyed: scalar
});
var TransactionDescrTickTock = struct({
  tt: scalar,
  storage: TrStoragePhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescrSplitPrepare = struct({
  split_info: SplitMergeInfo,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescrSplitInstall = struct({
  split_info: SplitMergeInfo,
  prepare_transaction: scalar,
  installed: scalar
});
var TransactionDescrMergePrepare = struct({
  split_info: SplitMergeInfo,
  storage_ph: TrStoragePhase,
  aborted: scalar
});
var TransactionDescrMergeInstall = struct({
  split_info: SplitMergeInfo,
  prepare_transaction: scalar,
  credit_ph: TrCreditPhase,
  compute_ph: TrComputePhase,
  action: TrActionPhase,
  aborted: scalar,
  destroyed: scalar
});
var TransactionDescr = struct({
  Ordinary: TransactionDescrOrdinary,
  Storage: TrStoragePhase,
  TickTock: TransactionDescrTickTock,
  SplitPrepare: TransactionDescrSplitPrepare,
  SplitInstall: TransactionDescrSplitInstall,
  MergePrepare: TransactionDescrMergePrepare,
  MergeInstall: TransactionDescrMergeInstall
});
var TransactionDescrResolver = {
  __resolveType: function __resolveType(obj, context, info) {
    if (obj.Ordinary) {
      return 'TransactionDescrOrdinaryVariant';
    }

    if (obj.Storage) {
      return 'TransactionDescrStorageVariant';
    }

    if (obj.TickTock) {
      return 'TransactionDescrTickTockVariant';
    }

    if (obj.SplitPrepare) {
      return 'TransactionDescrSplitPrepareVariant';
    }

    if (obj.SplitInstall) {
      return 'TransactionDescrSplitInstallVariant';
    }

    if (obj.MergePrepare) {
      return 'TransactionDescrMergePrepareVariant';
    }

    if (obj.MergeInstall) {
      return 'TransactionDescrMergeInstallVariant';
    }

    return null;
  }
};
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
  out_msgs: StringArray,
  total_fees: scalar,
  state_update: TransactionStateUpdate,
  description: TransactionDescr,
  root_cell: scalar
});

function createResolvers(db) {
  return {
    IntermediateAddress: IntermediateAddressResolver,
    MsgAddressInt: MsgAddressIntResolver,
    MsgAddressExt: MsgAddressExtResolver,
    CommonMsgInf: CommonMsgInfResolver,
    InMsg: InMsgResolver,
    OutMsg: OutMsgResolver,
    AccountStorageState: AccountStorageStateResolver,
    TrComputePhase: TrComputePhaseResolver,
    TrBouncePhase: TrBouncePhaseResolver,
    TransactionDescr: TransactionDescrResolver,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsIk5vbmUiLCJkdW1teSIsIkN1cnJlbmN5Q29sbGVjdGlvbiIsIkdyYW1zIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIiLCJ1c2Vfc3JjX2JpdHMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlIiwid29ya2NoYWluX2lkIiwiYWRkcl9wZngiLCJJbnRlcm1lZGlhdGVBZGRyZXNzRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzcyIsIlJlZ3VsYXIiLCJTaW1wbGUiLCJFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIiLCJfX3Jlc29sdmVUeXBlIiwib2JqIiwiY29udGV4dCIsImluZm8iLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJHZW5lcmljSWQiLCJyZWFkeSIsImRhdGEiLCJNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QiLCJyZXdyaXRlX3BmeCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkIiwiYW55Y2FzdCIsImFkZHJlc3MiLCJNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QiLCJNc2dBZGRyZXNzSW50QWRkclZhciIsIk1zZ0FkZHJlc3NJbnQiLCJBZGRyTm9uZSIsIkFkZHJTdGQiLCJBZGRyVmFyIiwiTXNnQWRkcmVzc0ludFJlc29sdmVyIiwiVGlja1RvY2siLCJ0aWNrIiwidG9jayIsIlN0YXRlSW5pdCIsInNwbGl0X2RlcHRoIiwic3BlY2lhbCIsImNvZGUiLCJsaWJyYXJ5IiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJDb21tb25Nc2dJbmZJbnRNc2dJbmZvIiwiaWhyX2Rpc2FibGVkIiwiYm91bmNlIiwiYm91bmNlZCIsInNyYyIsImRzdCIsInZhbHVlIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsIk1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuIiwiQWRkckV4dGVybiIsIk1zZ0FkZHJlc3NFeHQiLCJNc2dBZGRyZXNzRXh0UmVzb2x2ZXIiLCJDb21tb25Nc2dJbmZFeHRJbk1zZ0luZm8iLCJpbXBvcnRfZmVlIiwiQ29tbW9uTXNnSW5mRXh0T3V0TXNnSW5mbyIsIkNvbW1vbk1zZ0luZiIsIkludE1zZ0luZm8iLCJFeHRJbk1zZ0luZm8iLCJFeHRPdXRNc2dJbmZvIiwiQ29tbW9uTXNnSW5mUmVzb2x2ZXIiLCJNZXNzYWdlIiwiX2tleSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGUiLCJBY2NvdW50VW5pbml0IiwiQWNjb3VudEFjdGl2ZSIsIkFjY291bnRGcm96ZW4iLCJBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIiLCJBY2NvdW50U3RvcmFnZSIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwic3RhdGUiLCJBY2NvdW50Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JPcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JUaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjclNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JNZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjciIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JSZXNvbHZlciIsIlRyYW5zYWN0aW9uIiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJvdXRfbXNncyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwiUXVlcnkiLCJtZXNzYWdlcyIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBa0NBLE9BQU8sQ0FBQyxhQUFELEM7SUFBakNDLE0sWUFBQUEsTTtJQUFRQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLOztBQUN4QixJQUFNQyxJQUFJLEdBQUdGLE1BQU0sQ0FBQztBQUNoQkcsRUFBQUEsS0FBSyxFQUFFSjtBQURTLENBQUQsQ0FBbkI7QUFJQSxJQUFNSyxrQkFBa0IsR0FBR0osTUFBTSxDQUFDO0FBQzlCSyxFQUFBQSxLQUFLLEVBQUVOO0FBRHVCLENBQUQsQ0FBakM7QUFJQSxJQUFNTywwQkFBMEIsR0FBR04sTUFBTSxDQUFDO0FBQ3RDTyxFQUFBQSxZQUFZLEVBQUVSO0FBRHdCLENBQUQsQ0FBekM7QUFJQSxJQUFNUyx5QkFBeUIsR0FBR1IsTUFBTSxDQUFDO0FBQ3JDUyxFQUFBQSxZQUFZLEVBQUVWLE1BRHVCO0FBRXJDVyxFQUFBQSxRQUFRLEVBQUVYO0FBRjJCLENBQUQsQ0FBeEM7QUFLQSxJQUFNWSxzQkFBc0IsR0FBR1gsTUFBTSxDQUFDO0FBQ2xDUyxFQUFBQSxZQUFZLEVBQUVWLE1BRG9CO0FBRWxDVyxFQUFBQSxRQUFRLEVBQUVYO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFNYSxtQkFBbUIsR0FBR1osTUFBTSxDQUFDO0FBQy9CYSxFQUFBQSxPQUFPLEVBQUVQLDBCQURzQjtBQUUvQlEsRUFBQUEsTUFBTSxFQUFFTix5QkFGdUI7QUFHL0JPLEVBQUFBLEdBQUcsRUFBRUo7QUFIMEIsQ0FBRCxDQUFsQztBQU1BLElBQU1LLDJCQUEyQixHQUFHO0FBQ2hDQyxFQUFBQSxhQURnQyx5QkFDbEJDLEdBRGtCLEVBQ2JDLE9BRGEsRUFD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QUFFOEgsRUFBRSxDQUFDUyxzQkFBSCxDQUEwQlQsRUFBRSxDQUFDOUgsWUFBN0IsRUFBMkNrSCxXQUEzQztBQUpKO0FBbEJYLEdBQVA7QUF5Qkg7O0FBQ0RzQixNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDYlosRUFBQUEsZUFBZSxFQUFmQTtBQURhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIHN0cnVjdCwgYXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLmpzJyk7XG5jb25zdCBOb25lID0gc3RydWN0KHtcbiAgICBkdW1teTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouUmVndWxhcikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU2ltcGxlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBHZW5lcmljSWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYWR5OiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWRkck5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyU3RkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyU3RkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyVmFyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RhdGVJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0b3JhZ2VVc2VkU2hvcnQgPSBzdHJ1Y3Qoe1xuICAgIGNlbGxzOiBzY2FsYXIsXG4gICAgYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFNwbGl0TWVyZ2VJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IENvbW1vbk1zZ0luZkludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuID0gc3RydWN0KHtcbiAgICBBZGRyRXh0ZXJuOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkckV4dGVybjogTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWRkck5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyRXh0ZXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQ29tbW9uTXNnSW5mRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDb21tb25Nc2dJbmZFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ29tbW9uTXNnSW5mID0gc3RydWN0KHtcbiAgICBJbnRNc2dJbmZvOiBDb21tb25Nc2dJbmZJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogQ29tbW9uTXNnSW5mRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IENvbW1vbk1zZ0luZkV4dE91dE1zZ0luZm8sXG59KTtcblxuY29uc3QgQ29tbW9uTXNnSW5mUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5JbnRNc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0NvbW1vbk1zZ0luZkludE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dEluTXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdDb21tb25Nc2dJbmZFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dE91dE1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnQ29tbW9uTXNnSW5mRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIF9rZXk6IHNjYWxhcixcbiAgICBpZDogR2VuZXJpY0lkLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBHZW5lcmljSWQsXG4gICAgYmxvY2tfaWQ6IEdlbmVyaWNJZCxcbiAgICBoZWFkZXI6IENvbW1vbk1zZ0luZixcbiAgICBpbml0OiBTdGF0ZUluaXQsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgY3VyX2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBJbk1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSUhSID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJbW1lZGlhdGVsbHkgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZEZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgRXh0ZXJuYWw6IEluTXNnRXh0ZXJuYWwsXG4gICAgSUhSOiBJbk1zZ0lIUixcbiAgICBJbW1lZGlhdGVsbHk6IEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEZpbmFsOiBJbk1zZ0ZpbmFsLFxuICAgIFRyYW5zaXQ6IEluTXNnVHJhbnNpdCxcbiAgICBEaXNjYXJkZWRGaW5hbDogSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBEaXNjYXJkZWRUcmFuc2l0OiBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG59KTtcblxuY29uc3QgSW5Nc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLklIUikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0lIUlZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSW1tZWRpYXRlbGx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSW1tZWRpYXRlbGx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5GaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkRmluYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5Ob25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVseSkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouT3V0TXNnTmV3KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EZXF1ZXVlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXRSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBleHBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfY29sbGVjdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgY3JlYXRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZnJvbV9wcmV2X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIG1pbnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgaWQ6IEdlbmVyaWNJZCxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICBpbmZvOiBCbG9ja0luZm8sXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgZXh0cmE6IEJsb2NrRXh0cmEsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdCA9IHN0cnVjdCh7XG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plbiA9IHN0cnVjdCh7XG4gICAgZHVtbXk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlID0gc3RydWN0KHtcbiAgICBBY2NvdW50VW5pbml0OiBOb25lLFxuICAgIEFjY291bnRBY3RpdmU6IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRGcm96ZW46IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkFjY291bnRVbmluaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRVbmluaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFjY291bnRBY3RpdmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkFjY291bnRGcm96ZW4pIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIGJhbGFuY2U6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBzdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlNraXBwZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5WbSkge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVZtVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJBY3Rpb25QaGFzZSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IHNjYWxhcixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogc2NhbGFyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdF9tc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlTm9mdW5kcyA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgcmVxX2Z3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU9rID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBtc2dfZmVlczogc2NhbGFyLFxuICAgIGZ3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgTmVnZnVuZHM6IE5vbmUsXG4gICAgTm9mdW5kczogVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgT2s6IFRyQm91bmNlUGhhc2VPayxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5OZWdmdW5kcykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk5vZnVuZHMpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk9rKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VPa1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JPcmRpbmFyeSA9IHN0cnVjdCh7XG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBUckJvdW5jZVBoYXNlLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdHQ6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JTcGxpdFByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjclNwbGl0SW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JNZXJnZVByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyTWVyZ2VJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjciA9IHN0cnVjdCh7XG4gICAgT3JkaW5hcnk6IFRyYW5zYWN0aW9uRGVzY3JPcmRpbmFyeSxcbiAgICBTdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBUaWNrVG9jazogVHJhbnNhY3Rpb25EZXNjclRpY2tUb2NrLFxuICAgIFNwbGl0UHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjclNwbGl0UHJlcGFyZSxcbiAgICBTcGxpdEluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JTcGxpdEluc3RhbGwsXG4gICAgTWVyZ2VQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyTWVyZ2VQcmVwYXJlLFxuICAgIE1lcmdlSW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjck1lcmdlSW5zdGFsbCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5PcmRpbmFyeSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlN0b3JhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjclN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRpY2tUb2NrKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JUaWNrVG9ja1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3BsaXRQcmVwYXJlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JTcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNwbGl0SW5zdGFsbCkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5NZXJnZVByZXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjck1lcmdlUHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTWVyZ2VJbnN0YWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JNZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgX2tleTogc2NhbGFyLFxuICAgIGlkOiBHZW5lcmljSWQsXG4gICAgYmxvY2tfaWQ6IEdlbmVyaWNJZCxcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogc2NhbGFyLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBDb21tb25Nc2dJbmY6IENvbW1vbk1zZ0luZlJlc29sdmVyLFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudFN0b3JhZ2VTdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyLFxuICAgICAgICBUckNvbXB1dGVQaGFzZTogVHJDb21wdXRlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJCb3VuY2VQaGFzZTogVHJCb3VuY2VQaGFzZVJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbkRlc2NyOiBUcmFuc2FjdGlvbkRlc2NyUmVzb2x2ZXIsXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnNcbn07XG4iXX0=