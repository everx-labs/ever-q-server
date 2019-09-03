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
  in_message: Message,
  out_msgs: StringArray,
  out_messages: MessageArray,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsIk5vbmUiLCJkdW1teSIsIkN1cnJlbmN5Q29sbGVjdGlvbiIsIkdyYW1zIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIiLCJ1c2Vfc3JjX2JpdHMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlIiwid29ya2NoYWluX2lkIiwiYWRkcl9wZngiLCJJbnRlcm1lZGlhdGVBZGRyZXNzRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzcyIsIlJlZ3VsYXIiLCJTaW1wbGUiLCJFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIiLCJfX3Jlc29sdmVUeXBlIiwib2JqIiwiY29udGV4dCIsImluZm8iLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJHZW5lcmljSWQiLCJyZWFkeSIsImRhdGEiLCJNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QiLCJyZXdyaXRlX3BmeCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkIiwiYW55Y2FzdCIsImFkZHJlc3MiLCJNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QiLCJNc2dBZGRyZXNzSW50QWRkclZhciIsIk1zZ0FkZHJlc3NJbnQiLCJBZGRyTm9uZSIsIkFkZHJTdGQiLCJBZGRyVmFyIiwiTXNnQWRkcmVzc0ludFJlc29sdmVyIiwiVGlja1RvY2siLCJ0aWNrIiwidG9jayIsIlN0b3JhZ2VVc2VkU2hvcnQiLCJjZWxscyIsImJpdHMiLCJTcGxpdE1lcmdlSW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4iLCJBZGRyRXh0ZXJuIiwiTXNnQWRkcmVzc0V4dCIsIk1zZ0FkZHJlc3NFeHRSZXNvbHZlciIsIk1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvIiwiaWhyX2Rpc2FibGVkIiwiYm91bmNlIiwiYm91bmNlZCIsInNyYyIsImRzdCIsInZhbHVlIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsIk1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8iLCJpbXBvcnRfZmVlIiwiTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyIiwiSW50TXNnSW5mbyIsIkV4dEluTXNnSW5mbyIsIkV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyUmVzb2x2ZXIiLCJNZXNzYWdlSW5pdCIsInNwbGl0X2RlcHRoIiwic3BlY2lhbCIsImNvZGUiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsIl9rZXkiLCJpZCIsInRyYW5zYWN0aW9uX2lkIiwiYmxvY2tfaWQiLCJoZWFkZXIiLCJpbml0IiwiYm9keSIsInN0YXR1cyIsIk1zZ0VudmVsb3BlIiwibXNnIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnRXh0ZXJuYWwiLCJ0cmFuc2FjdGlvbiIsIkluTXNnSUhSIiwicHJvb2ZfY3JlYXRlZCIsIkluTXNnSW1tZWRpYXRlbGx5IiwiaW5fbXNnIiwiSW5Nc2dGaW5hbCIsIkluTXNnVHJhbnNpdCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsIkluTXNnRGlzY2FyZGVkRmluYWwiLCJJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQiLCJwcm9vZl9kZWxpdmVyZWQiLCJJbk1zZyIsIkV4dGVybmFsIiwiSUhSIiwiSW1tZWRpYXRlbGx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwiSW5Nc2dSZXNvbHZlciIsIk91dE1zZ0V4dGVybmFsIiwiT3V0TXNnSW1tZWRpYXRlbHkiLCJyZWltcG9ydCIsIk91dE1zZ091dE1zZ05ldyIsIk91dE1zZ1RyYW5zaXQiLCJpbXBvcnRlZCIsIk91dE1zZ0RlcXVldWUiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdXRNc2dUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2ciLCJJbW1lZGlhdGVseSIsIk91dE1zZ05ldyIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2dSZXNvbHZlciIsIkJsb2NrSW5mb1ByZXZSZWZQcmV2IiwiQmxvY2tJbmZvUHJldlJlZiIsInByZXYiLCJCbG9ja0luZm9TaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwic2hhcmRfcHJlZml4IiwiQmxvY2tJbmZvTWFzdGVyUmVmIiwibWFzdGVyIiwiQmxvY2tJbmZvUHJldlZlcnRSZWYiLCJwcmV2X2FsdCIsIkJsb2NrSW5mbyIsIndhbnRfc3BsaXQiLCJhZnRlcl9tZXJnZSIsImdlbl91dGltZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsImZsYWdzIiwicHJldl9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJiZWZvcmVfc3BsaXQiLCJhZnRlcl9zcGxpdCIsIndhbnRfbWVyZ2UiLCJ2ZXJ0X3NlcV9ubyIsInN0YXJ0X2x0Iiwic2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfdmVydF9yZWYiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwiZXhwb3J0ZWQiLCJmZWVzX2NvbGxlY3RlZCIsImNyZWF0ZWQiLCJmcm9tX3ByZXZfYmxrIiwibWludGVkIiwiZmVlc19pbXBvcnRlZCIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJTdHJpbmciLCJCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrRXh0cmEiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50U3RvcmFnZVN0YXQiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4iLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsInN0b3JhZ2Vfc3RhdCIsInN0b3JhZ2UiLCJhZGRyIiwiVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSIsIlRyU3RvcmFnZVBoYXNlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiVHJDcmVkaXRQaGFzZSIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsIlRyQ29tcHV0ZVBoYXNlU2tpcHBlZCIsInJlYXNvbiIsIlRyQ29tcHV0ZVBoYXNlVm0iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJDb21wdXRlUGhhc2UiLCJTa2lwcGVkIiwiVm0iLCJUckNvbXB1dGVQaGFzZVJlc29sdmVyIiwiVHJBY3Rpb25QaGFzZSIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90X21zZ19zaXplIiwiVHJCb3VuY2VQaGFzZU5vZnVuZHMiLCJtc2dfc2l6ZSIsInJlcV9md2RfZmVlcyIsIlRyQm91bmNlUGhhc2VPayIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlIiwiTmVnZnVuZHMiLCJOb2Z1bmRzIiwiT2siLCJUckJvdW5jZVBoYXNlUmVzb2x2ZXIiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX3BoIiwiY3JlZGl0X3BoIiwiY29tcHV0ZV9waCIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2siLCJ0dCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUiLCJzcGxpdF9pbmZvIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb24iLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJTcGxpdFByZXBhcmUiLCJTcGxpdEluc3RhbGwiLCJNZXJnZVByZXBhcmUiLCJNZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBa0NBLE9BQU8sQ0FBQyxhQUFELEM7SUFBakNDLE0sWUFBQUEsTTtJQUFRQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLOztBQUN4QixJQUFNQyxJQUFJLEdBQUdGLE1BQU0sQ0FBQztBQUNoQkcsRUFBQUEsS0FBSyxFQUFFSjtBQURTLENBQUQsQ0FBbkI7QUFJQSxJQUFNSyxrQkFBa0IsR0FBR0osTUFBTSxDQUFDO0FBQzlCSyxFQUFBQSxLQUFLLEVBQUVOO0FBRHVCLENBQUQsQ0FBakM7QUFJQSxJQUFNTywwQkFBMEIsR0FBR04sTUFBTSxDQUFDO0FBQ3RDTyxFQUFBQSxZQUFZLEVBQUVSO0FBRHdCLENBQUQsQ0FBekM7QUFJQSxJQUFNUyx5QkFBeUIsR0FBR1IsTUFBTSxDQUFDO0FBQ3JDUyxFQUFBQSxZQUFZLEVBQUVWLE1BRHVCO0FBRXJDVyxFQUFBQSxRQUFRLEVBQUVYO0FBRjJCLENBQUQsQ0FBeEM7QUFLQSxJQUFNWSxzQkFBc0IsR0FBR1gsTUFBTSxDQUFDO0FBQ2xDUyxFQUFBQSxZQUFZLEVBQUVWLE1BRG9CO0FBRWxDVyxFQUFBQSxRQUFRLEVBQUVYO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFNYSxtQkFBbUIsR0FBR1osTUFBTSxDQUFDO0FBQy9CYSxFQUFBQSxPQUFPLEVBQUVQLDBCQURzQjtB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LENBQUNPLE1BQXRCLEVBQThCekgsS0FBOUIsQ0FGTDtBQUdIMEgsTUFBQUEsUUFBUSxFQUFFUixFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ1EsUUFBdEIsRUFBZ0N4RyxPQUFoQyxDQUhQO0FBSUhqQyxNQUFBQSxZQUFZLEVBQUVpSSxFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ2pJLFlBQXRCLEVBQW9DbUgsV0FBcEMsQ0FKWDtBQUtIdUIsTUFBQUEsTUFBTSxFQUFFVCxFQUFFLENBQUNVLFdBQUg7QUFMTCxLQW5CSjtBQTBCSEMsSUFBQUEsWUFBWSxFQUFFO0FBQ1ZSLE1BQUFBLFFBQVEsRUFBRUgsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDRyxRQUE3QixFQUF1Q2xPLE9BQXZDLENBREE7QUFFVnNPLE1BQUFBLE1BQU0sRUFBRVAsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDTyxNQUE3QixFQUFxQ3pILEtBQXJDLENBRkU7QUFHVjBILE1BQUFBLFFBQVEsRUFBRVIsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDUSxRQUE3QixFQUF1Q3hHLE9BQXZDLENBSEE7QUFJVmpDLE1BQUFBLFlBQVksRUFBRWlJLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ2pJLFlBQTdCLEVBQTJDbUgsV0FBM0M7QUFKSjtBQTFCWCxHQUFQO0FBaUNIOztBQUNEMkIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JmLEVBQUFBLGVBQWUsRUFBZkE7QUFEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBzdHJ1Y3QsIGFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgZHVtbXk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDdXJyZW5jeUNvbGxlY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIEdyYW1zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIgPSBzdHJ1Y3Qoe1xuICAgIHVzZV9zcmNfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzID0gc3RydWN0KHtcbiAgICBSZWd1bGFyOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBTaW1wbGU6IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUsXG4gICAgRXh0OiBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0LFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLlJlZ3VsYXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlNpbXBsZSkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc0V4dFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgR2VuZXJpY0lkID0gc3RydWN0KHtcbiAgICByZWFkeTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGQgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJTdGQ6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkLFxuICAgIEFkZHJWYXI6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkFkZHJOb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWRkclN0ZCkge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWRkclZhcikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclZhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0b3JhZ2VVc2VkU2hvcnQgPSBzdHJ1Y3Qoe1xuICAgIGNlbGxzOiBzY2FsYXIsXG4gICAgYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFNwbGl0TWVyZ2VJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuID0gc3RydWN0KHtcbiAgICBBZGRyRXh0ZXJuOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkckV4dGVybjogTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWRkck5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BZGRyRXh0ZXJuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0V4dCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgaW1wb3J0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkludE1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckludE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dEluTXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5FeHRPdXRNc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgX2tleTogc2NhbGFyLFxuICAgIGlkOiBHZW5lcmljSWQsXG4gICAgdHJhbnNhY3Rpb25faWQ6IEdlbmVyaWNJZCxcbiAgICBibG9ja19pZDogR2VuZXJpY0lkLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBFeHRlcm5hbDogSW5Nc2dFeHRlcm5hbCxcbiAgICBJSFI6IEluTXNnSUhSLFxuICAgIEltbWVkaWF0ZWxseTogSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgRmluYWw6IEluTXNnRmluYWwsXG4gICAgVHJhbnNpdDogSW5Nc2dUcmFuc2l0LFxuICAgIERpc2NhcmRlZEZpbmFsOiBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIERpc2NhcmRlZFRyYW5zaXQ6IEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbn0pO1xuXG5jb25zdCBJbk1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSUhSKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVsbHkpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJbW1lZGlhdGVsbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkZpbmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRGaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZEZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EaXNjYXJkZWRUcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE91dE1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ0ltbWVkaWF0ZWx5ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dPdXRNc2dOZXcgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ0RlcXVldWUgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydF9ibG9ja19sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgTm9uZTogTm9uZSxcbiAgICBFeHRlcm5hbDogT3V0TXNnRXh0ZXJuYWwsXG4gICAgSW1tZWRpYXRlbHk6IE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ05ldzogT3V0TXNnT3V0TXNnTmV3LFxuICAgIFRyYW5zaXQ6IE91dE1zZ1RyYW5zaXQsXG4gICAgRGVxdWV1ZTogT3V0TXNnRGVxdWV1ZSxcbiAgICBUcmFuc2l0UmVxdWlyZWQ6IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBPdXRNc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk5vbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0ZXJuYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkltbWVkaWF0ZWx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0ltbWVkaWF0ZWx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5PdXRNc2dOZXcpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkRlcXVldWUpIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRGVxdWV1ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdFJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIF9rZXk6IHNjYWxhcixcbiAgICBpZDogR2VuZXJpY0lkLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ID0gc3RydWN0KHtcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuID0gc3RydWN0KHtcbiAgICBkdW1teTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGUgPSBzdHJ1Y3Qoe1xuICAgIEFjY291bnRVbmluaXQ6IE5vbmUsXG4gICAgQWNjb3VudEFjdGl2ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudEZyb3plbjogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW4sXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouQWNjb3VudFVuaW5pdCkge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudFVuaW5pdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWNjb3VudEFjdGl2ZSkge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouQWNjb3VudEZyb3plbikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlID0gc3RydWN0KHtcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgYmFsYW5jZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIF9rZXk6IHNjYWxhcixcbiAgICBzdG9yYWdlX3N0YXQ6IEFjY291bnRTdG9yYWdlU3RhdCxcbiAgICBzdG9yYWdlOiBBY2NvdW50U3RvcmFnZSxcbiAgICBhZGRyOiBNc2dBZGRyZXNzSW50LFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUclN0b3JhZ2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDcmVkaXRQaGFzZSA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgY3JlZGl0OiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VTa2lwcGVkID0gc3RydWN0KHtcbiAgICByZWFzb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVZtID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBzY2FsYXIsXG4gICAgZ2FzX3VzZWQ6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIFNraXBwZWQ6IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCxcbiAgICBWbTogVHJDb21wdXRlUGhhc2VWbSxcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouU2tpcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlZtKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlVm1WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUckFjdGlvblBoYXNlID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogc2NhbGFyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBzY2FsYXIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90X21zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VOb2Z1bmRzID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICByZXFfZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlT2sgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIG1zZ19mZWVzOiBzY2FsYXIsXG4gICAgZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlID0gc3RydWN0KHtcbiAgICBOZWdmdW5kczogTm9uZSxcbiAgICBOb2Z1bmRzOiBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBPazogVHJCb3VuY2VQaGFzZU9rLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk5lZ2Z1bmRzKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOZWdmdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTm9mdW5kcykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouT2spIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU9rVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5ID0gc3RydWN0KHtcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IFRyQm91bmNlUGhhc2UsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0dDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uID0gc3RydWN0KHtcbiAgICBPcmRpbmFyeTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIFRpY2tUb2NrOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgU3BsaXRQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFNwbGl0SW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBNZXJnZVByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgTWVyZ2VJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk9yZGluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3RvcmFnZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVGlja1RvY2spIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TcGxpdFByZXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3BsaXRJbnN0YWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk1lcmdlUHJlcGFyZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5NZXJnZUluc3RhbGwpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIF9rZXk6IHNjYWxhcixcbiAgICBpZDogR2VuZXJpY0lkLFxuICAgIGJsb2NrX2lkOiBHZW5lcmljSWQsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogTWVzc2FnZSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBNZXNzYWdlQXJyYXksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0pO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2c6IE91dE1zZ1Jlc29sdmVyLFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==