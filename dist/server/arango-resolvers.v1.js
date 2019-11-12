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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLnYxLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsIl9rZXkiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQXVGQSxPQUFPLENBQUMsbUJBQUQsQztJQUF0RkMsTSxZQUFBQSxNO0lBQVFDLFEsWUFBQUEsUTtJQUFVQyxRLFlBQUFBLFE7SUFBVUMsYyxZQUFBQSxjO0lBQWdCQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3pFLElBQU1DLElBQUksR0FBR0osTUFBTSxDQUFDO0FBQ2hCSSxFQUFBQSxJQUFJLEVBQUVSO0FBRFUsQ0FBRCxDQUFuQjtBQUlBLElBQU1TLGtCQUFrQixHQUFHTCxNQUFNLENBQUM7QUFDOUJNLEVBQUFBLEtBQUssRUFBRVY7QUFEdUIsQ0FBRCxDQUFqQztBQUlBLElBQU1XLDBCQUEwQixHQUFHUCxNQUFNLENBQUM7QUFDdENRLEVBQUFBLFlBQVksRUFBRVo7QUFEd0IsQ0FBRCxDQUF6QztBQUlBLElBQU1hLHlCQUF5QixHQUFHVCxNQUFNLENBQUM7QUFDckNVLEVBQUFBLFlBQVksRUFBRWQsTUFEdUI7QUFFckNlLEVBQUFBLFFBQVEsRUFBRWY7QUFGMkIsQ0FBRCxDQUF4QztBQUtBLElBQU1nQixzQkFBc0IsR0FBR1osTUFBTSxDQUFDO0FBQ2xDVSxFQUFBQSxZQUFZLEVBQUVkLE1BRG9CO0FBRWxDZSxFQUFBQSxRQUFRLEVBQUVmO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFNaUIs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QUFBQSxjQUFjLEVBQWRBLGNBL0RhO0FBZ0ViSSxFQUFBQSxhQUFhLEVBQWJBLGFBaEVhO0FBaUViYSxFQUFBQSxvQkFBb0IsRUFBcEJBLG9CQWpFYTtBQWtFYkcsRUFBQUEsZUFBZSxFQUFmQSxlQWxFYTtBQW1FYkcsRUFBQUEsYUFBYSxFQUFiQSxhQW5FYTtBQW9FYkssRUFBQUEsOEJBQThCLEVBQTlCQSw4QkFwRWE7QUFxRWJRLEVBQUFBLDhCQUE4QixFQUE5QkEsOEJBckVhO0FBc0ViRSxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXRFYTtBQXVFYkUsRUFBQUEsa0NBQWtDLEVBQWxDQSxrQ0F2RWE7QUF3RWJHLEVBQUFBLGtDQUFrQyxFQUFsQ0Esa0NBeEVhO0FBeUViQyxFQUFBQSxrQ0FBa0MsRUFBbENBLGtDQXpFYTtBQTBFYkMsRUFBQUEsc0JBQXNCLEVBQXRCQSxzQkExRWE7QUEyRWJTLEVBQUFBLFdBQVcsRUFBWEE7QUEzRWEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgYmlnVUludDEsIGJpZ1VJbnQyLCByZXNvbHZlQmlnVUludCwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgTm9uZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnUmVndWxhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTaW1wbGUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGQgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJTdGQ6IE1zZ0FkZHJlc3NJbnRBZGRyU3RkLFxuICAgIEFkZHJWYXI6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FkZHJOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyU3RkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJTdGRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJWYXInIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclZhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0aWNrOiBzY2FsYXIsXG4gICAgdG9jazogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0b3JhZ2VVc2VkU2hvcnQgPSBzdHJ1Y3Qoe1xuICAgIGNlbGxzOiBzY2FsYXIsXG4gICAgYml0czogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFNwbGl0TWVyZ2VJbmZvID0gc3RydWN0KHtcbiAgICBjdXJfc2hhcmRfcGZ4X2xlbjogc2NhbGFyLFxuICAgIGFjY19zcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHRoaXNfYWRkcjogc2NhbGFyLFxuICAgIHNpYmxpbmdfYWRkcjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuID0gc3RydWN0KHtcbiAgICBBZGRyRXh0ZXJuOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkckV4dGVybjogTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4sXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJFeHRlcm4nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzRXh0QWRkckV4dGVyblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBpaHJfZGlzYWJsZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IHNjYWxhcixcbiAgICBib3VuY2VkOiBzY2FsYXIsXG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICB2YWx1ZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0V4dCxcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXIgPSBzdHJ1Y3Qoe1xuICAgIEludE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBFeHRPdXRNc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdJbnRNc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckludE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dEluTXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dE91dE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2RlbGl2ZXJlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnID0gc3RydWN0KHtcbiAgICBFeHRlcm5hbDogSW5Nc2dFeHRlcm5hbCxcbiAgICBJSFI6IEluTXNnSUhSLFxuICAgIEltbWVkaWF0ZWxseTogSW5Nc2dJbW1lZGlhdGVsbHksXG4gICAgRmluYWw6IEluTXNnRmluYWwsXG4gICAgVHJhbnNpdDogSW5Nc2dUcmFuc2l0LFxuICAgIERpc2NhcmRlZEZpbmFsOiBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIERpc2NhcmRlZFRyYW5zaXQ6IEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbn0pO1xuXG5jb25zdCBJbk1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJSFInIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0lIUlZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbGx5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJbW1lZGlhdGVsbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ZpbmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGlzY2FyZGVkRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZEZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgT3V0TXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnSW1tZWRpYXRlbHkgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgcmVpbXBvcnQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ091dE1zZ05ldyA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnRGVxdWV1ZSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0X2Jsb2NrX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdFJlcXVpcmVkID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBOb25lOiBOb25lLFxuICAgIEV4dGVybmFsOiBPdXRNc2dFeHRlcm5hbCxcbiAgICBJbW1lZGlhdGVseTogT3V0TXNnSW1tZWRpYXRlbHksXG4gICAgT3V0TXNnTmV3OiBPdXRNc2dPdXRNc2dOZXcsXG4gICAgVHJhbnNpdDogT3V0TXNnVHJhbnNpdCxcbiAgICBEZXF1ZXVlOiBPdXRNc2dEZXF1ZXVlLFxuICAgIFRyYW5zaXRSZXF1aXJlZDogT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxufSk7XG5cbmNvbnN0IE91dE1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dGVybmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ltbWVkaWF0ZWx5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnSW1tZWRpYXRlbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ091dE1zZ05ldycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0RlcXVldWUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dEZXF1ZXVlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0UmVxdWlyZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBleHBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfY29sbGVjdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgY3JlYXRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZnJvbV9wcmV2X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIG1pbnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShzY2FsYXIpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ID0gc3RydWN0KHtcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGUgPSBzdHJ1Y3Qoe1xuICAgIEFjY291bnRVbmluaXQ6IE5vbmUsXG4gICAgQWNjb3VudEFjdGl2ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudEZyb3plbjogTm9uZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBY2NvdW50VW5pbml0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRVbmluaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRBY3RpdmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEZyb3plbicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ1NraXBwZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1ZtJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTmVnZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ05vZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnT3JkaW5hcnknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1N0b3JhZ2UnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVGlja1RvY2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0UHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0SW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlUHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlSW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIGRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uLFxuICAgIHJvb3RfY2VsbDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEludGVybWVkaWF0ZUFkZHJlc3M6IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0ludDogTXNnQWRkcmVzc0ludFJlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzRXh0OiBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2VIZWFkZXI6IE1lc3NhZ2VIZWFkZXJSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IEluTXNnUmVzb2x2ZXIsXG4gICAgICAgIE91dE1zZzogT3V0TXNnUmVzb2x2ZXIsXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnMsXG4gICAgTm9uZSxcbiAgICBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0LFxuICAgIEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgRXh0QmxrUmVmLFxuICAgIE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCxcbiAgICBNc2dBZGRyZXNzSW50QWRkclN0ZCxcbiAgICBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QsXG4gICAgTXNnQWRkcmVzc0ludEFkZHJWYXIsXG4gICAgTXNnQWRkcmVzc0ludCxcbiAgICBUaWNrVG9jayxcbiAgICBTdG9yYWdlVXNlZFNob3J0LFxuICAgIFNwbGl0TWVyZ2VJbmZvLFxuICAgIE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuLFxuICAgIE1zZ0FkZHJlc3NFeHQsXG4gICAgTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbiAgICBNZXNzYWdlSGVhZGVyLFxuICAgIE1lc3NhZ2VJbml0LFxuICAgIE1lc3NhZ2UsXG4gICAgTXNnRW52ZWxvcGUsXG4gICAgSW5Nc2dFeHRlcm5hbCxcbiAgICBJbk1zZ0lIUixcbiAgICBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBJbk1zZ0ZpbmFsLFxuICAgIEluTXNnVHJhbnNpdCxcbiAgICBJbk1zZ0Rpc2NhcmRlZEZpbmFsLFxuICAgIEluTXNnRGlzY2FyZGVkVHJhbnNpdCxcbiAgICBJbk1zZyxcbiAgICBPdXRNc2dFeHRlcm5hbCxcbiAgICBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dPdXRNc2dOZXcsXG4gICAgT3V0TXNnVHJhbnNpdCxcbiAgICBPdXRNc2dEZXF1ZXVlLFxuICAgIE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbiAgICBPdXRNc2csXG4gICAgQmxvY2tJbmZvUHJldlJlZlByZXYsXG4gICAgQmxvY2tJbmZvUHJldlJlZixcbiAgICBCbG9ja0luZm9TaGFyZCxcbiAgICBCbG9ja0luZm9NYXN0ZXJSZWYsXG4gICAgQmxvY2tJbmZvUHJldlZlcnRSZWYsXG4gICAgQmxvY2tJbmZvLFxuICAgIEJsb2NrVmFsdWVGbG93LFxuICAgIEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MsXG4gICAgQmxvY2tFeHRyYSxcbiAgICBCbG9ja1N0YXRlVXBkYXRlLFxuICAgIEJsb2NrLFxuICAgIEFjY291bnRTdG9yYWdlU3RhdCxcbiAgICBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50U3RvcmFnZVN0YXRlLFxuICAgIEFjY291bnRTdG9yYWdlLFxuICAgIEFjY291bnQsXG4gICAgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBUclN0b3JhZ2VQaGFzZSxcbiAgICBUckNyZWRpdFBoYXNlLFxuICAgIFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCxcbiAgICBUckNvbXB1dGVQaGFzZVZtLFxuICAgIFRyQ29tcHV0ZVBoYXNlLFxuICAgIFRyQWN0aW9uUGhhc2UsXG4gICAgVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgVHJCb3VuY2VQaGFzZU9rLFxuICAgIFRyQm91bmNlUGhhc2UsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwsXG4gICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxuICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgVHJhbnNhY3Rpb24sXG59O1xuIl19