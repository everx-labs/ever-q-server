"use strict";

var _require = require('./q-types.js'),
    scalar = _require.scalar,
    bigUInt1 = _require.bigUInt1,
    bigUInt2 = _require.bigUInt2,
    resolveBigUInt = _require.resolveBigUInt,
    struct = _require.struct,
    array = _require.array,
    join = _require.join,
    joinArray = _require.joinArray,
    enumName = _require.enumName,
    createEnumNameResolver = _require.createEnumNameResolver;

var None = struct({
  None: scalar
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
var StringArray = array(scalar);
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
var AccountStorageState = struct({
  AccountUninit: None,
  AccountActive: AccountStorageStateAccountActive,
  AccountFrozen: None
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
      transactions: db.collectionQuery(db.transactions, Transaction)
    },
    Subscription: {
      messages: db.collectionSubscription(db.messages, Message),
      blocks: db.collectionSubscription(db.blocks, Block),
      accounts: db.collectionSubscription(db.accounts, Account),
      transactions: db.collectionSubscription(db.transactions, Transaction)
    },
    Mutation: {}
  };
}

module.exports = {
  createResolvers: createResolvers,
  None: None,
  CurrencyCollection: CurrencyCollection,
  IntermediateAddressRegular: IntermediateAddressRegular,
  IntermediateAddressSimple: IntermediateAddressSimple,
  IntermediateAddressExt: IntermediateAddressExt,
  IntermediateAddress: IntermediateAddress,
  ExtBlkRef: ExtBlkRef,
  MsgAddressIntAddrStdAnycast: MsgAddressIntAddrStdAnycast,
  MsgAddressIntAddrStd: MsgAddressIntAddrStd,
  MsgAddressIntAddrVarAnycast: MsgAddressIntAddrVarAnycast,
  MsgAddressIntAddrVar: MsgAddressIntAddrVar,
  MsgAddressInt: MsgAddressInt,
  TickTock: TickTock,
  StorageUsedShort: StorageUsedShort,
  SplitMergeInfo: SplitMergeInfo,
  MsgAddressExtAddrExtern: MsgAddressExtAddrExtern,
  MsgAddressExt: MsgAddressExt,
  MessageHeaderIntMsgInfo: MessageHeaderIntMsgInfo,
  MessageHeaderExtInMsgInfo: MessageHeaderExtInMsgInfo,
  MessageHeaderExtOutMsgInfo: MessageHeaderExtOutMsgInfo,
  MessageHeader: MessageHeader,
  MessageInit: MessageInit,
  Message: Message,
  MsgEnvelope: MsgEnvelope,
  InMsgExternal: InMsgExternal,
  InMsgIHR: InMsgIHR,
  InMsgImmediatelly: InMsgImmediatelly,
  InMsgFinal: InMsgFinal,
  InMsgTransit: InMsgTransit,
  InMsgDiscardedFinal: InMsgDiscardedFinal,
  InMsgDiscardedTransit: InMsgDiscardedTransit,
  InMsg: InMsg,
  OutMsgExternal: OutMsgExternal,
  OutMsgImmediately: OutMsgImmediately,
  OutMsgOutMsgNew: OutMsgOutMsgNew,
  OutMsgTransit: OutMsgTransit,
  OutMsgDequeue: OutMsgDequeue,
  OutMsgTransitRequired: OutMsgTransitRequired,
  OutMsg: OutMsg,
  BlockInfoPrevRefPrev: BlockInfoPrevRefPrev,
  BlockInfoPrevRef: BlockInfoPrevRef,
  BlockInfoShard: BlockInfoShard,
  BlockInfoMasterRef: BlockInfoMasterRef,
  BlockInfoPrevVertRef: BlockInfoPrevVertRef,
  BlockInfo: BlockInfo,
  BlockValueFlow: BlockValueFlow,
  BlockExtraAccountBlocksStateUpdate: BlockExtraAccountBlocksStateUpdate,
  BlockExtraAccountBlocks: BlockExtraAccountBlocks,
  BlockExtra: BlockExtra,
  BlockStateUpdate: BlockStateUpdate,
  Block: Block,
  AccountStorageStat: AccountStorageStat,
  AccountStorageStateAccountActive: AccountStorageStateAccountActive,
  AccountStorageState: AccountStorageState,
  AccountStorage: AccountStorage,
  Account: Account,
  TransactionStateUpdate: TransactionStateUpdate,
  TrStoragePhase: TrStoragePhase,
  TrCreditPhase: TrCreditPhase,
  TrComputePhaseSkipped: TrComputePhaseSkipped,
  TrComputePhaseVm: TrComputePhaseVm,
  TrComputePhase: TrComputePhase,
  TrActionPhase: TrActionPhase,
  TrBouncePhaseNofunds: TrBouncePhaseNofunds,
  TrBouncePhaseOk: TrBouncePhaseOk,
  TrBouncePhase: TrBouncePhase,
  TransactionDescriptionOrdinary: TransactionDescriptionOrdinary,
  TransactionDescriptionTickTock: TransactionDescriptionTickTock,
  TransactionDescriptionSplitPrepare: TransactionDescriptionSplitPrepare,
  TransactionDescriptionSplitInstall: TransactionDescriptionSplitInstall,
  TransactionDescriptionMergePrepare: TransactionDescriptionMergePrepare,
  TransactionDescriptionMergeInstall: TransactionDescriptionMergeInstall,
  TransactionDescription: TransactionDescription,
  Transaction: Transaction
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52MS5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiTm9uZSIsIkN1cnJlbmN5Q29sbGVjdGlvbiIsIkdyYW1zIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIiLCJ1c2Vfc3JjX2JpdHMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlIiwid29ya2NoYWluX2lkIiwiYWRkcl9wZngiLCJJbnRlcm1lZGlhdGVBZGRyZXNzRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzcyIsIlJlZ3VsYXIiLCJTaW1wbGUiLCJFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIiLCJfX3Jlc29sdmVUeXBlIiwib2JqIiwiY29udGV4dCIsImluZm8iLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QiLCJyZXdyaXRlX3BmeCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkIiwiYW55Y2FzdCIsImFkZHJlc3MiLCJNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QiLCJNc2dBZGRyZXNzSW50QWRkclZhciIsIk1zZ0FkZHJlc3NJbnQiLCJBZGRyTm9uZSIsIkFkZHJTdGQiLCJBZGRyVmFyIiwiTXNnQWRkcmVzc0ludFJlc29sdmVyIiwiVGlja1RvY2siLCJ0aWNrIiwidG9jayIsIlN0b3JhZ2VVc2VkU2hvcnQiLCJjZWxscyIsImJpdHMiLCJTcGxpdE1lcmdlSW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4iLCJBZGRyRXh0ZXJuIiwiTXNnQWRkcmVzc0V4dCIsIk1zZ0FkZHJlc3NFeHRSZXNvbHZlciIsIk1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvIiwiaWhyX2Rpc2FibGVkIiwiYm91bmNlIiwiYm91bmNlZCIsInNyYyIsImRzdCIsInZhbHVlIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsIk1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8iLCJpbXBvcnRfZmVlIiwiTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyIiwiSW50TXNnSW5mbyIsIkV4dEluTXNnSW5mbyIsIkV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyUmVzb2x2ZXIiLCJNZXNzYWdlSW5pdCIsInNwbGl0X2RlcHRoIiwic3BlY2lhbCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsIk1lc3NhZ2UiLCJpZCIsInRyYW5zYWN0aW9uX2lkIiwiYmxvY2tfaWQiLCJoZWFkZXIiLCJpbml0IiwiYm9keSIsInN0YXR1cyIsIk1zZ0VudmVsb3BlIiwibXNnIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnRXh0ZXJuYWwiLCJ0cmFuc2FjdGlvbiIsIkluTXNnSUhSIiwicHJvb2ZfY3JlYXRlZCIsIkluTXNnSW1tZWRpYXRlbGx5IiwiaW5fbXNnIiwiSW5Nc2dGaW5hbCIsIkluTXNnVHJhbnNpdCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsIkluTXNnRGlzY2FyZGVkRmluYWwiLCJJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQiLCJwcm9vZl9kZWxpdmVyZWQiLCJJbk1zZyIsIkV4dGVybmFsIiwiSUhSIiwiSW1tZWRpYXRlbGx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwiSW5Nc2dSZXNvbHZlciIsIk91dE1zZ0V4dGVybmFsIiwiT3V0TXNnSW1tZWRpYXRlbHkiLCJyZWltcG9ydCIsIk91dE1zZ091dE1zZ05ldyIsIk91dE1zZ1RyYW5zaXQiLCJpbXBvcnRlZCIsIk91dE1zZ0RlcXVldWUiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdXRNc2dUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2ciLCJJbW1lZGlhdGVseSIsIk91dE1zZ05ldyIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2dSZXNvbHZlciIsIkJsb2NrSW5mb1ByZXZSZWZQcmV2IiwiQmxvY2tJbmZvUHJldlJlZiIsInByZXYiLCJCbG9ja0luZm9TaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwic2hhcmRfcHJlZml4IiwiQmxvY2tJbmZvTWFzdGVyUmVmIiwibWFzdGVyIiwiQmxvY2tJbmZvUHJldlZlcnRSZWYiLCJwcmV2X2FsdCIsIkJsb2NrSW5mbyIsIndhbnRfc3BsaXQiLCJhZnRlcl9tZXJnZSIsImdlbl91dGltZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsImZsYWdzIiwicHJldl9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJiZWZvcmVfc3BsaXQiLCJhZnRlcl9zcGxpdCIsIndhbnRfbWVyZ2UiLCJ2ZXJ0X3NlcV9ubyIsInN0YXJ0X2x0Iiwic2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfdmVydF9yZWYiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwiZXhwb3J0ZWQiLCJmZWVzX2NvbGxlY3RlZCIsImNyZWF0ZWQiLCJmcm9tX3ByZXZfYmxrIiwibWludGVkIiwiZmVlc19pbXBvcnRlZCIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrRXh0cmEiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50U3RvcmFnZVN0YXQiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJNdXRhdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0IsWUFBQUEsc0I7O0FBRUosSUFBTUMsSUFBSSxHQUFHTixNQUFNLENBQUM7QUFDaEJNLEVBQUFBLElBQUksRUFBRVY7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTVcsa0JBQWtCLEdBQUdQLE1BQU0sQ0FBQztBQUM5QlEsRUFBQUEsS0FBSyxFQUFFWjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTWEsMEJBQTBCLEdBQUdULE1BQU0sQ0FBQztBQUN0Q1UsRUFBQUEsWUFBWSxFQUFFZDtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTWUseUJBQXlCLEdBQUdYLE1BQU0sQ0FBQztBQUNyQ1ksRUFBQUEsWUFBWSxFQUFFaEIsTUFEdUI7QUFFckNpQixFQUFBQSxRQUFRLEVBQUVqQjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWtCLHNCQUFzQixHQUFHZCxNQUFNLENBQUM7QUFDbENZLEVB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QTNEYTtBQTREYkksRUFBQUEsYUFBYSxFQUFiQSxhQTVEYTtBQTZEYkcsRUFBQUEscUJBQXFCLEVBQXJCQSxxQkE3RGE7QUE4RGJFLEVBQUFBLGdCQUFnQixFQUFoQkEsZ0JBOURhO0FBK0RiYyxFQUFBQSxjQUFjLEVBQWRBLGNBL0RhO0FBZ0ViSSxFQUFBQSxhQUFhLEVBQWJBLGFBaEVhO0FBaUViYSxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQWpFYTtBQWtFYkcsRUFBQUEsZUFBZSxFQUFmQSxlQWxFYTtBQW1FYkcsRUFBQUEsYUFBYSxFQUFiQSxhQW5FYTtBQW9FYkssRUFBQUEsOEJBQThCLEVBQTlCQSw4QkFwRWE7QUFxRWJRLEVBQUFBLDhCQUE4QixFQUE5QkEsOEJBckVhO0FBc0ViRSxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXRFYTtBQXVFYkUsRUFBQUEsa0NBQWtDLEVBQWxDQSxrQ0F2RWE7QUF3RWJHLEVBQUFBLGtDQUFrQyxFQUFsQ0Esa0NBeEVhO0FBeUViQyxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXpFYTtBQTBFYkMsRUFBQUEsc0JBQXNCLEVBQXRCQSxzQkExRWE7QUEyRWJTLEVBQUFBLFdBQVcsRUFBWEE7QUEzRWEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheSxcbiAgICBlbnVtTmFtZSxcbiAgICBjcmVhdGVFbnVtTmFtZVJlc29sdmVyLFxufSA9IHJlcXVpcmUoJy4vcS10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgTm9uZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnUmVndWxhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTaW1wbGUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGQgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJTdGQ6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkLFxuICAgIEFkZHJWYXI6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FkZHJOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyU3RkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJTdGRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJWYXInIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclZhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0b3JhZ2VVc2VkU2hvcnQgPSBzdHJ1Y3Qoe1xuICAgIGNlbGxzOiBzY2FsYXIsXG4gICAgYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFNwbGl0TWVyZ2VJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuID0gc3RydWN0KHtcbiAgICBBZGRyRXh0ZXJuOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkckV4dGVybjogTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJFeHRlcm4nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkckV4dGVyblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICB2YWx1ZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0V4dCxcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXIgPSBzdHJ1Y3Qoe1xuICAgIEludE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBFeHRPdXRNc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdJbnRNc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckludE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dEluTXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dE91dE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBFeHRlcm5hbDogSW5Nc2dFeHRlcm5hbCxcbiAgICBJSFI6IEluTXNnSUhSLFxuICAgIEltbWVkaWF0ZWxseTogSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgRmluYWw6IEluTXNnRmluYWwsXG4gICAgVHJhbnNpdDogSW5Nc2dUcmFuc2l0LFxuICAgIERpc2NhcmRlZEZpbmFsOiBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIERpc2NhcmRlZFRyYW5zaXQ6IEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbn0pO1xuXG5jb25zdCBJbk1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJSFInIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0lIUlZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbGx5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJbW1lZGlhdGVsbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ZpbmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGlzY2FyZGVkRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZEZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgT3V0TXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnSW1tZWRpYXRlbHkgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ091dE1zZ05ldyA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnRGVxdWV1ZSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdFJlcXVpcmVkID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBOb25lOiBOb25lLFxuICAgIEV4dGVybmFsOiBPdXRNc2dFeHRlcm5hbCxcbiAgICBJbW1lZGlhdGVseTogT3V0TXNnSW1tZWRpYXRlbHksXG4gICAgT3V0TXNnTmV3OiBPdXRNc2dPdXRNc2dOZXcsXG4gICAgVHJhbnNpdDogT3V0TXNnVHJhbnNpdCxcbiAgICBEZXF1ZXVlOiBPdXRNc2dEZXF1ZXVlLFxuICAgIFRyYW5zaXRSZXF1aXJlZDogT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxufSk7XG5cbmNvbnN0IE91dE1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dGVybmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ltbWVkaWF0ZWx5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnSW1tZWRpYXRlbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ091dE1zZ05ldycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0RlcXVldWUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dEZXF1ZXVlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0UmVxdWlyZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBleHBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfY29sbGVjdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgY3JlYXRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZnJvbV9wcmV2X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIG1pbnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ID0gc3RydWN0KHtcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGUgPSBzdHJ1Y3Qoe1xuICAgIEFjY291bnRVbmluaXQ6IE5vbmUsXG4gICAgQWNjb3VudEFjdGl2ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudEZyb3plbjogTm9uZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBY2NvdW50VW5pbml0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRVbmluaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRBY3RpdmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEZyb3plbicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ1NraXBwZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1ZtJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTmVnZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ05vZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnT3JkaW5hcnknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1N0b3JhZ2UnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVGlja1RvY2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0UHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0SW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlUHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlSW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIGRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uLFxuICAgIHJvb3RfY2VsbDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEludGVybWVkaWF0ZUFkZHJlc3M6IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0ludDogTXNnQWRkcmVzc0ludFJlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzRXh0OiBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2VIZWFkZXI6IE1lc3NhZ2VIZWFkZXJSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IEluTXNnUmVzb2x2ZXIsXG4gICAgICAgIE91dE1zZzogT3V0TXNnUmVzb2x2ZXIsXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH0sXG4gICAgICAgIE11dGF0aW9uOiB7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBOb25lLFxuICAgIEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG4gICAgSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyU3RkLFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICBNc2dBZGRyZXNzSW50QWRkclZhcixcbiAgICBNc2dBZGRyZXNzSW50LFxuICAgIFRpY2tUb2NrLFxuICAgIFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgU3BsaXRNZXJnZUluZm8sXG4gICAgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG4gICAgTXNnQWRkcmVzc0V4dCxcbiAgICBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxuICAgIE1lc3NhZ2VIZWFkZXIsXG4gICAgTWVzc2FnZUluaXQsXG4gICAgTWVzc2FnZSxcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZ0V4dGVybmFsLFxuICAgIEluTXNnSUhSLFxuICAgIEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEluTXNnRmluYWwsXG4gICAgSW5Nc2dUcmFuc2l0LFxuICAgIEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxuICAgIEluTXNnLFxuICAgIE91dE1zZ0V4dGVybmFsLFxuICAgIE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ091dE1zZ05ldyxcbiAgICBPdXRNc2dUcmFuc2l0LFxuICAgIE91dE1zZ0RlcXVldWUsXG4gICAgT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxuICAgIE91dE1zZyxcbiAgICBCbG9ja0luZm9QcmV2UmVmUHJldixcbiAgICBCbG9ja0luZm9QcmV2UmVmLFxuICAgIEJsb2NrSW5mb1NoYXJkLFxuICAgIEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBCbG9ja0luZm9QcmV2VmVydFJlZixcbiAgICBCbG9ja0luZm8sXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja0V4dHJhLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRTdG9yYWdlU3RhdGUsXG4gICAgQWNjb3VudFN0b3JhZ2UsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIFRyU3RvcmFnZVBoYXNlLFxuICAgIFRyQ3JlZGl0UGhhc2UsXG4gICAgVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFRyQ29tcHV0ZVBoYXNlVm0sXG4gICAgVHJDb21wdXRlUGhhc2UsXG4gICAgVHJBY3Rpb25QaGFzZSxcbiAgICBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBUckJvdW5jZVBoYXNlT2ssXG4gICAgVHJCb3VuY2VQaGFzZSxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=