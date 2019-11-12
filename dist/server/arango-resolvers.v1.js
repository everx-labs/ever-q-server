"use strict";

var _require = require('./arango-types.js'),
    scalar = _require.scalar,
    bigUInt1 = _require.bigUInt1,
    bigUInt2 = _require.bigUInt2,
    resolveBigUInt = _require.resolveBigUInt,
    struct = _require.struct,
    array = _require.array,
    join = _require.join,
    joinArray = _require.joinArray;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYxLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsIl9rZXkiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJJLEVBQUFBLElBQUksRUFBRVI7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTVMsa0JBQWtCLEdBQUdMLE1BQU0sQ0FBQztBQUM5Qk0sRUFBQUEsS0FBSyxFQUFFVjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVcsMEJBQTBCLEdBQUdQLE1BQU0sQ0FBQztBQUN0Q1EsRUFBQUEsWUFBWSxFQUFFWjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTWEseUJBQXlCLEdBQUdULE1BQU0sQ0FBQztBQUNyQ1UsRUFBQUEsWUFBWSxFQUFFZCxNQUR1QjtBQUVyQ2UsRUFBQUEsUUFBUSxFQUFFZjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWdCLHNCQUFzQixHQUFHWixNQUFNLENBQUM7QUFDbENVLEVBQUFBLFlBQVksRUFBRWQsTUFEb0I7QUFFbENlLEVBQUFBLFFBQVEsRUFBRWY7QUFGd0Is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QUFBLHFCQUFxQixFQUFyQkEscUJBN0RhO0FBOERiRSxFQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQTlEYTtBQStEYmMsRUFBQUEsY0FBYyxFQUFkQSxjQS9EYTtBQWdFYkksRUFBQUEsYUFBYSxFQUFiQSxhQWhFYTtBQWlFYmEsRUFBQUEsb0JBQW9CLEVBQXBCQSxvQkFqRWE7QUFrRWJHLEVBQUFBLGVBQWUsRUFBZkEsZUFsRWE7QUFtRWJHLEVBQUFBLGFBQWEsRUFBYkEsYUFuRWE7QUFvRWJLLEVBQUFBLDhCQUE4QixFQUE5QkEsOEJBcEVhO0FBcUViUSxFQUFBQSw4QkFBOEIsRUFBOUJBLDhCQXJFYTtBQXNFYkUsRUFBQUEsa0NBQWtDLEVBQWxDQSxrQ0F0RWE7QUF1RWJFLEVBQUFBLGtDQUFrQyxFQUFsQ0Esa0NBdkVhO0FBd0ViRyxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXhFYTtBQXlFYkMsRUFBQUEsa0NBQWtDLEVBQWxDQSxrQ0F6RWE7QUEwRWJDLEVBQUFBLHNCQUFzQixFQUF0QkEsc0JBMUVhO0FBMkViUyxFQUFBQSxXQUFXLEVBQVhBO0FBM0VhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IE5vbmUgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDdXJyZW5jeUNvbGxlY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIEdyYW1zOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIgPSBzdHJ1Y3Qoe1xuICAgIHVzZV9zcmNfYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzID0gc3RydWN0KHtcbiAgICBSZWd1bGFyOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhcixcbiAgICBTaW1wbGU6IEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUsXG4gICAgRXh0OiBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0LFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ1JlZ3VsYXInIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU2ltcGxlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc0V4dFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEV4dEJsa1JlZiA9IHN0cnVjdCh7XG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhciA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyU3RkOiBNc2dBZGRyZXNzSW50QWRkclN0ZCxcbiAgICBBZGRyVmFyOiBNc2dBZGRyZXNzSW50QWRkclZhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclN0ZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyU3RkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyVmFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJWYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdG9yYWdlVXNlZFNob3J0ID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTcGxpdE1lcmdlSW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0QWRkckV4dGVybiA9IHN0cnVjdCh7XG4gICAgQWRkckV4dGVybjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJFeHRlcm46IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FkZHJOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyRXh0ZXJuJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgdmFsdWU6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzRXh0LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICBpbXBvcnRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NFeHQsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyID0gc3RydWN0KHtcbiAgICBJbnRNc2dJbmZvOiBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBFeHRJbk1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8sXG4gICAgRXh0T3V0TXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8sXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlclJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnSW50TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHRJbk1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHRPdXRNc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSW5pdCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBoZWFkZXI6IE1lc3NhZ2VIZWFkZXIsXG4gICAgaW5pdDogTWVzc2FnZUluaXQsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgY3VyX2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBJbk1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSUhSID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJbW1lZGlhdGVsbHkgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZEZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgRXh0ZXJuYWw6IEluTXNnRXh0ZXJuYWwsXG4gICAgSUhSOiBJbk1zZ0lIUixcbiAgICBJbW1lZGlhdGVsbHk6IEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEZpbmFsOiBJbk1zZ0ZpbmFsLFxuICAgIFRyYW5zaXQ6IEluTXNnVHJhbnNpdCxcbiAgICBEaXNjYXJkZWRGaW5hbDogSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBEaXNjYXJkZWRUcmFuc2l0OiBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG59KTtcblxuY29uc3QgSW5Nc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0V4dGVybmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSUhSJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJSFJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ltbWVkaWF0ZWxseScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSW1tZWRpYXRlbGx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZEZpbmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGlzY2FyZGVkVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE91dE1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ0ltbWVkaWF0ZWx5ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dPdXRNc2dOZXcgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ0RlcXVldWUgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydF9ibG9ja19sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgTm9uZTogTm9uZSxcbiAgICBFeHRlcm5hbDogT3V0TXNnRXh0ZXJuYWwsXG4gICAgSW1tZWRpYXRlbHk6IE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ05ldzogT3V0TXNnT3V0TXNnTmV3LFxuICAgIFRyYW5zaXQ6IE91dE1zZ1RyYW5zaXQsXG4gICAgRGVxdWV1ZTogT3V0TXNnRGVxdWV1ZSxcbiAgICBUcmFuc2l0UmVxdWlyZWQ6IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBPdXRNc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ05vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVseScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0ltbWVkaWF0ZWx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdPdXRNc2dOZXcnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dPdXRNc2dOZXdWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEZXF1ZXVlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRGVxdWV1ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdFJlcXVpcmVkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFJlcXVpcmVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZlByZXYgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEJsb2NrSW5mb1ByZXZSZWZQcmV2LFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1NoYXJkID0gc3RydWN0KHtcbiAgICBzaGFyZF9wZnhfYml0czogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkX3ByZWZpeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb01hc3RlclJlZiA9IHN0cnVjdCh7XG4gICAgbWFzdGVyOiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlZlcnRSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdDogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mbyA9IHN0cnVjdCh7XG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBwcmV2X3JlZjogQmxvY2tJbmZvUHJldlJlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG4gICAgc2hhcmQ6IEJsb2NrSW5mb1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBCbG9ja0luZm9NYXN0ZXJSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogQmxvY2tJbmZvUHJldlZlcnRSZWYsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZXhwb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2NvbGxlY3RlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGNyZWF0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZyb21fcHJldl9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBtaW50ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2ltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoc2NhbGFyKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tFeHRyYUFjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2tFeHRyYSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICBpbmZvOiBCbG9ja0luZm8sXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgZXh0cmE6IEJsb2NrRXh0cmEsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdCA9IHN0cnVjdCh7XG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlID0gc3RydWN0KHtcbiAgICBBY2NvdW50VW5pbml0OiBOb25lLFxuICAgIEFjY291bnRBY3RpdmU6IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRGcm96ZW46IE5vbmUsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWNjb3VudFVuaW5pdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50QWN0aXZlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRGcm96ZW4nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlID0gc3RydWN0KHtcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgYmFsYW5jZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgX2tleTogc2NhbGFyLFxuICAgIHN0b3JhZ2Vfc3RhdDogQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIHN0b3JhZ2U6IEFjY291bnRTdG9yYWdlLFxuICAgIGFkZHI6IE1zZ0FkZHJlc3NJbnQsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyU3RvcmFnZVBoYXNlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNyZWRpdFBoYXNlID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBjcmVkaXQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVNraXBwZWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYXNvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlVm0gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IHNjYWxhcixcbiAgICBnYXNfdXNlZDogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZSA9IHN0cnVjdCh7XG4gICAgU2tpcHBlZDogVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFZtOiBUckNvbXB1dGVQaGFzZVZtLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdTa2lwcGVkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdWbScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlVm1WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUckFjdGlvblBoYXNlID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogc2NhbGFyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBzY2FsYXIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90X21zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VOb2Z1bmRzID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICByZXFfZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlT2sgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIG1zZ19mZWVzOiBzY2FsYXIsXG4gICAgZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlID0gc3RydWN0KHtcbiAgICBOZWdmdW5kczogTm9uZSxcbiAgICBOb2Z1bmRzOiBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBPazogVHJCb3VuY2VQaGFzZU9rLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ05lZ2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5lZ2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdOb2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ09rJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU9rVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5ID0gc3RydWN0KHtcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IFRyQm91bmNlUGhhc2UsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0dDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uID0gc3RydWN0KHtcbiAgICBPcmRpbmFyeTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIFRpY2tUb2NrOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgU3BsaXRQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFNwbGl0SW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBNZXJnZVByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgTWVyZ2VJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ09yZGluYXJ5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTdG9yYWdlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RpY2tUb2NrJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdFByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdEluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZVByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZUluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19oYXNoOiBzY2FsYXIsXG4gICAgcHJldl90cmFuc19sdDogc2NhbGFyLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBJbnRlcm1lZGlhdGVBZGRyZXNzOiBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NJbnQ6IE1zZ0FkZHJlc3NJbnRSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0V4dDogTXNnQWRkcmVzc0V4dFJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2c6IE91dE1zZ1Jlc29sdmVyLFxuICAgICAgICBCbG9jazoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQWNjb3VudFN0b3JhZ2VTdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyLFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUckNvbXB1dGVQaGFzZTogVHJDb21wdXRlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJCb3VuY2VQaGFzZTogVHJCb3VuY2VQaGFzZVJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBRdWVyeToge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgICAgICBzZWxlY3Q6IGRiLnNlbGVjdFF1ZXJ5KCksXG4gICAgICAgIH0sXG4gICAgICAgIFN1YnNjcmlwdGlvbjoge1xuICAgICAgICAgICAgbWVzc2FnZXM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYWNjb3VudHMsIEFjY291bnQpLFxuICAgICAgICAgICAgdHJhbnNhY3Rpb25zOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICB9XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY3JlYXRlUmVzb2x2ZXJzLFxuICAgIE5vbmUsXG4gICAgQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIEludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUsXG4gICAgSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIEV4dEJsa1JlZixcbiAgICBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QsXG4gICAgTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0LFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyVmFyLFxuICAgIE1zZ0FkZHJlc3NJbnQsXG4gICAgVGlja1RvY2ssXG4gICAgU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBTcGxpdE1lcmdlSW5mbyxcbiAgICBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbiAgICBNc2dBZGRyZXNzRXh0LFxuICAgIE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8sXG4gICAgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8sXG4gICAgTWVzc2FnZUhlYWRlcixcbiAgICBNZXNzYWdlSW5pdCxcbiAgICBNZXNzYWdlLFxuICAgIE1zZ0VudmVsb3BlLFxuICAgIEluTXNnRXh0ZXJuYWwsXG4gICAgSW5Nc2dJSFIsXG4gICAgSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgSW5Nc2dGaW5hbCxcbiAgICBJbk1zZ1RyYW5zaXQsXG4gICAgSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG4gICAgSW5Nc2csXG4gICAgT3V0TXNnRXh0ZXJuYWwsXG4gICAgT3V0TXNnSW1tZWRpYXRlbHksXG4gICAgT3V0TXNnT3V0TXNnTmV3LFxuICAgIE91dE1zZ1RyYW5zaXQsXG4gICAgT3V0TXNnRGVxdWV1ZSxcbiAgICBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG4gICAgT3V0TXNnLFxuICAgIEJsb2NrSW5mb1ByZXZSZWZQcmV2LFxuICAgIEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgQmxvY2tJbmZvU2hhcmQsXG4gICAgQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxuICAgIEJsb2NrSW5mbyxcbiAgICBCbG9ja1ZhbHVlRmxvdyxcbiAgICBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzLFxuICAgIEJsb2NrRXh0cmEsXG4gICAgQmxvY2tTdGF0ZVVwZGF0ZSxcbiAgICBCbG9jayxcbiAgICBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudFN0b3JhZ2VTdGF0ZSxcbiAgICBBY2NvdW50U3RvcmFnZSxcbiAgICBBY2NvdW50LFxuICAgIFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgVHJTdG9yYWdlUGhhc2UsXG4gICAgVHJDcmVkaXRQaGFzZSxcbiAgICBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVHJDb21wdXRlUGhhc2VWbSxcbiAgICBUckNvbXB1dGVQaGFzZSxcbiAgICBUckFjdGlvblBoYXNlLFxuICAgIFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIFRyQm91bmNlUGhhc2VPayxcbiAgICBUckJvdW5jZVBoYXNlLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uLFxuICAgIFRyYW5zYWN0aW9uLFxufTtcbiJdfQ==