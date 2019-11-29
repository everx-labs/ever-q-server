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
      in_message: function in_message(parent, _args, context) {
        return context.db.fetchDocByKey(context.db.messages, parent.in_msg);
      },
      out_messages: function out_messages(parent, _args, context) {
        return context.db.fetchDocsByKeys(context.db.messages, parent.out_msgs);
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
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXJlc29sdmVycy52MS5qcyJdLCJuYW1lcyI6WyJyZXF1aXJlIiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInJlc29sdmVCaWdVSW50Iiwic3RydWN0IiwiYXJyYXkiLCJqb2luIiwiam9pbkFycmF5IiwiZW51bU5hbWUiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiTm9uZSIsIkN1cnJlbmN5Q29sbGVjdGlvbiIsIkdyYW1zIiwiSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIiLCJ1c2Vfc3JjX2JpdHMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlIiwid29ya2NoYWluX2lkIiwiYWRkcl9wZngiLCJJbnRlcm1lZGlhdGVBZGRyZXNzRXh0IiwiSW50ZXJtZWRpYXRlQWRkcmVzcyIsIlJlZ3VsYXIiLCJTaW1wbGUiLCJFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIiLCJfX3Jlc29sdmVUeXBlIiwib2JqIiwiY29udGV4dCIsImluZm8iLCJFeHRCbGtSZWYiLCJlbmRfbHQiLCJzZXFfbm8iLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QiLCJyZXdyaXRlX3BmeCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkIiwiYW55Y2FzdCIsImFkZHJlc3MiLCJNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QiLCJNc2dBZGRyZXNzSW50QWRkclZhciIsIk1zZ0FkZHJlc3NJbnQiLCJBZGRyTm9uZSIsIkFkZHJTdGQiLCJBZGRyVmFyIiwiTXNnQWRkcmVzc0ludFJlc29sdmVyIiwiVGlja1RvY2siLCJ0aWNrIiwidG9jayIsIlN0b3JhZ2VVc2VkU2hvcnQiLCJjZWxscyIsImJpdHMiLCJTcGxpdE1lcmdlSW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwiTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4iLCJBZGRyRXh0ZXJuIiwiTXNnQWRkcmVzc0V4dCIsIk1zZ0FkZHJlc3NFeHRSZXNvbHZlciIsIk1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvIiwiaWhyX2Rpc2FibGVkIiwiYm91bmNlIiwiYm91bmNlZCIsInNyYyIsImRzdCIsInZhbHVlIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsIk1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8iLCJpbXBvcnRfZmVlIiwiTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyIiwiSW50TXNnSW5mbyIsIkV4dEluTXNnSW5mbyIsIkV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyUmVzb2x2ZXIiLCJNZXNzYWdlSW5pdCIsInNwbGl0X2RlcHRoIiwic3BlY2lhbCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsIk1lc3NhZ2UiLCJpZCIsInRyYW5zYWN0aW9uX2lkIiwiYmxvY2tfaWQiLCJoZWFkZXIiLCJpbml0IiwiYm9keSIsInN0YXR1cyIsIk1zZ0VudmVsb3BlIiwibXNnIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnRXh0ZXJuYWwiLCJ0cmFuc2FjdGlvbiIsIkluTXNnSUhSIiwicHJvb2ZfY3JlYXRlZCIsIkluTXNnSW1tZWRpYXRlbGx5IiwiaW5fbXNnIiwiSW5Nc2dGaW5hbCIsIkluTXNnVHJhbnNpdCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsIkluTXNnRGlzY2FyZGVkRmluYWwiLCJJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQiLCJwcm9vZl9kZWxpdmVyZWQiLCJJbk1zZyIsIkV4dGVybmFsIiwiSUhSIiwiSW1tZWRpYXRlbGx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwiSW5Nc2dSZXNvbHZlciIsIk91dE1zZ0V4dGVybmFsIiwiT3V0TXNnSW1tZWRpYXRlbHkiLCJyZWltcG9ydCIsIk91dE1zZ091dE1zZ05ldyIsIk91dE1zZ1RyYW5zaXQiLCJpbXBvcnRlZCIsIk91dE1zZ0RlcXVldWUiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdXRNc2dUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2ciLCJJbW1lZGlhdGVseSIsIk91dE1zZ05ldyIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2dSZXNvbHZlciIsIkJsb2NrSW5mb1ByZXZSZWZQcmV2IiwiQmxvY2tJbmZvUHJldlJlZiIsInByZXYiLCJCbG9ja0luZm9TaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwic2hhcmRfcHJlZml4IiwiQmxvY2tJbmZvTWFzdGVyUmVmIiwibWFzdGVyIiwiQmxvY2tJbmZvUHJldlZlcnRSZWYiLCJwcmV2X2FsdCIsIkJsb2NrSW5mbyIsIndhbnRfc3BsaXQiLCJhZnRlcl9tZXJnZSIsImdlbl91dGltZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsImZsYWdzIiwicHJldl9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJiZWZvcmVfc3BsaXQiLCJhZnRlcl9zcGxpdCIsIndhbnRfbWVyZ2UiLCJ2ZXJ0X3NlcV9ubyIsInN0YXJ0X2x0Iiwic2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfdmVydF9yZWYiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwiZXhwb3J0ZWQiLCJmZWVzX2NvbGxlY3RlZCIsImNyZWF0ZWQiLCJmcm9tX3ByZXZfYmxrIiwibWludGVkIiwiZmVlc19pbXBvcnRlZCIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrRXh0cmEiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50U3RvcmFnZVN0YXQiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiX2FyZ3MiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBV0lBLE9BQU8sQ0FBQyxjQUFELEM7SUFWUEMsTSxZQUFBQSxNO0lBQ0FDLFEsWUFBQUEsUTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsYyxZQUFBQSxjO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxLLFlBQUFBLEs7SUFDQUMsSSxZQUFBQSxJO0lBQ0FDLFMsWUFBQUEsUztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsc0IsWUFBQUEsc0I7O0FBRUosSUFBTUMsSUFBSSxHQUFHTixNQUFNLENBQUM7QUFDaEJNLEVBQUFBLElBQUksRUFBRVY7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTVcsa0JBQWtCLEdBQUdQLE1BQU0sQ0FBQztBQUM5QlEsRUFBQUEsS0FBSyxFQUFFWjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTWEsMEJBQTBCLEdBQUdULE1BQU0sQ0FBQztBQUN0Q1UsRUFBQUEsWUFBWSxFQUFFZDtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTWUseUJBQXlCLEdBQUdYLE1BQU0sQ0FBQztBQUNyQ1ksRUFBQUEsWUFBWSxFQUFFaEIsTUFEdUI7QUFFckNpQixFQUFBQSxRQUFRLEVBQUVqQjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWtCLHNCQUFzQixHQUFHZCxNQUFNLENBQUM7QUFDbENZLEVBQUFB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RUFBUEEsT0F6RGE7QUEwRGJLLEVBQUFBLHNCQUFzQixFQUF0QkEsc0JBMURhO0FBMkRiQyxFQUFBQSxjQUFjLEVBQWRBLGNBM0RhO0FBNERiSSxFQUFBQSxhQUFhLEVBQWJBLGFBNURhO0FBNkRiRyxFQUFBQSxxQkFBcUIsRUFBckJBLHFCQTdEYTtBQThEYkUsRUFBQUEsZ0JBQWdCLEVBQWhCQSxnQkE5RGE7QUErRGJjLEVBQUFBLGNBQWMsRUFBZEEsY0EvRGE7QUFnRWJJLEVBQUFBLGFBQWEsRUFBYkEsYUFoRWE7QUFpRWJhLEVBQUFBLG9CQUFvQixFQUFwQkEsb0JBakVhO0FBa0ViRyxFQUFBQSxlQUFlLEVBQWZBLGVBbEVhO0FBbUViRyxFQUFBQSxhQUFhLEVBQWJBLGFBbkVhO0FBb0ViSyxFQUFBQSw4QkFBOEIsRUFBOUJBLDhCQXBFYTtBQXFFYlEsRUFBQUEsOEJBQThCLEVBQTlCQSw4QkFyRWE7QUFzRWJFLEVBQUFBLGtDQUFrQyxFQUFsQ0Esa0NBdEVhO0FBdUViRSxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXZFYTtBQXdFYkcsRUFBQUEsa0NBQWtDLEVBQWxDQSxrQ0F4RWE7QUF5RWJDLEVBQUFBLGtDQUFrQyxFQUFsQ0Esa0NBekVhO0FBMEViQyxFQUFBQSxzQkFBc0IsRUFBdEJBLHNCQTFFYTtBQTJFYlMsRUFBQUEsV0FBVyxFQUFYQTtBQTNFYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5LFxuICAgIGVudW1OYW1lLFxuICAgIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIsXG59ID0gcmVxdWlyZSgnLi9xLXR5cGVzLmpzJyk7XG5jb25zdCBOb25lID0gc3RydWN0KHtcbiAgICBOb25lOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ3VycmVuY3lDb2xsZWN0aW9uID0gc3RydWN0KHtcbiAgICBHcmFtczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdSZWd1bGFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NpbXBsZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJTdGQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclZhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkckV4dGVybicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0V4dCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgaW1wb3J0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0ludE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0SW5Nc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0T3V0TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0lIUicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVsbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZFRyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT3V0TXNnTmV3JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGVxdWV1ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXRSZXF1aXJlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KHNjYWxhcik7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBOb25lLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FjY291bnRVbmluaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudFVuaW5pdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEFjdGl2ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50RnJvemVuJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIGJhbGFuY2U6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBzdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIF9rZXk6IHNjYWxhcixcbiAgICBzdG9yYWdlX3N0YXQ6IEFjY291bnRTdG9yYWdlU3RhdCxcbiAgICBzdG9yYWdlOiBBY2NvdW50U3RvcmFnZSxcbiAgICBhZGRyOiBNc2dBZGRyZXNzSW50LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUclN0b3JhZ2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDcmVkaXRQaGFzZSA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgY3JlZGl0OiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VTa2lwcGVkID0gc3RydWN0KHtcbiAgICByZWFzb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVZtID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBzY2FsYXIsXG4gICAgZ2FzX3VzZWQ6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIFNraXBwZWQ6IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCxcbiAgICBWbTogVHJDb21wdXRlUGhhc2VWbSxcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnU2tpcHBlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlU2tpcHBlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVm0nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVZtVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJBY3Rpb25QaGFzZSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IHNjYWxhcixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogc2NhbGFyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdF9tc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlTm9mdW5kcyA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgcmVxX2Z3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU9rID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBtc2dfZmVlczogc2NhbGFyLFxuICAgIGZ3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgTmVnZnVuZHM6IE5vbmUsXG4gICAgTm9mdW5kczogVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgT2s6IFRyQm91bmNlUGhhc2VPayxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOZWdmdW5kcycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOZWdmdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTm9mdW5kcycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOb2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdPaycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VPa1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSA9IHN0cnVjdCh7XG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBUckJvdW5jZVBoYXNlLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdHQ6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiA9IHN0cnVjdCh7XG4gICAgT3JkaW5hcnk6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSxcbiAgICBTdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBUaWNrVG9jazogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFNwbGl0UHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSxcbiAgICBTcGxpdEluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwsXG4gICAgTWVyZ2VQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIE1lcmdlSW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdPcmRpbmFyeScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3RvcmFnZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TdG9yYWdlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUaWNrVG9jaycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9ja1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3BsaXRQcmVwYXJlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3BsaXRJbnN0YWxsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTWVyZ2VQcmVwYXJlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTWVyZ2VJbnN0YWxsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgZGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgcm9vdF9jZWxsOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgSW50ZXJtZWRpYXRlQWRkcmVzczogSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzSW50OiBNc2dBZGRyZXNzSW50UmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NFeHQ6IE1zZ0FkZHJlc3NFeHRSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJDb21wdXRlUGhhc2U6IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyQm91bmNlUGhhc2U6IFRyQm91bmNlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50LCBfYXJncywgY29udGV4dCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZXh0LmRiLmZldGNoRG9jQnlLZXkoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCwgX2FyZ3MsIGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29udGV4dC5kYi5mZXRjaERvY3NCeUtleXMoY29udGV4dC5kYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVycyxcbiAgICBOb25lLFxuICAgIEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG4gICAgSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBFeHRCbGtSZWYsXG4gICAgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyU3RkLFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICBNc2dBZGRyZXNzSW50QWRkclZhcixcbiAgICBNc2dBZGRyZXNzSW50LFxuICAgIFRpY2tUb2NrLFxuICAgIFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgU3BsaXRNZXJnZUluZm8sXG4gICAgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG4gICAgTXNnQWRkcmVzc0V4dCxcbiAgICBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxuICAgIE1lc3NhZ2VIZWFkZXIsXG4gICAgTWVzc2FnZUluaXQsXG4gICAgTWVzc2FnZSxcbiAgICBNc2dFbnZlbG9wZSxcbiAgICBJbk1zZ0V4dGVybmFsLFxuICAgIEluTXNnSUhSLFxuICAgIEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEluTXNnRmluYWwsXG4gICAgSW5Nc2dUcmFuc2l0LFxuICAgIEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxuICAgIEluTXNnLFxuICAgIE91dE1zZ0V4dGVybmFsLFxuICAgIE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ091dE1zZ05ldyxcbiAgICBPdXRNc2dUcmFuc2l0LFxuICAgIE91dE1zZ0RlcXVldWUsXG4gICAgT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxuICAgIE91dE1zZyxcbiAgICBCbG9ja0luZm9QcmV2UmVmUHJldixcbiAgICBCbG9ja0luZm9QcmV2UmVmLFxuICAgIEJsb2NrSW5mb1NoYXJkLFxuICAgIEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBCbG9ja0luZm9QcmV2VmVydFJlZixcbiAgICBCbG9ja0luZm8sXG4gICAgQmxvY2tWYWx1ZUZsb3csXG4gICAgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyxcbiAgICBCbG9ja0V4dHJhLFxuICAgIEJsb2NrU3RhdGVVcGRhdGUsXG4gICAgQmxvY2ssXG4gICAgQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRTdG9yYWdlU3RhdGUsXG4gICAgQWNjb3VudFN0b3JhZ2UsXG4gICAgQWNjb3VudCxcbiAgICBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIFRyU3RvcmFnZVBoYXNlLFxuICAgIFRyQ3JlZGl0UGhhc2UsXG4gICAgVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFRyQ29tcHV0ZVBoYXNlVm0sXG4gICAgVHJDb21wdXRlUGhhc2UsXG4gICAgVHJBY3Rpb25QaGFzZSxcbiAgICBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBUckJvdW5jZVBoYXNlT2ssXG4gICAgVHJCb3VuY2VQaGFzZSxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICBUcmFuc2FjdGlvbixcbn07XG4iXX0=