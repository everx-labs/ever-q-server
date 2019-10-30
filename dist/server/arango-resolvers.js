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
  Grams: bigUInt2
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
  end_lt: bigUInt1,
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
  created_lt: bigUInt1,
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
  created_lt: bigUInt1,
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
  import_block_lt: bigUInt1
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
  start_lt: bigUInt1,
  end_lt: bigUInt1,
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
  last_trans_lt: bigUInt1,
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
  lt: bigUInt1,
  prev_trans_hash: scalar,
  prev_trans_lt: bigUInt1,
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
    CurrencyCollection: {
      Grams: function Grams(parent) {
        return resolveBigUInt(2, parent.Grams);
      }
    },
    IntermediateAddress: IntermediateAddressResolver,
    ExtBlkRef: {
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    MsgAddressInt: MsgAddressIntResolver,
    MsgAddressExt: MsgAddressExtResolver,
    MessageHeaderIntMsgInfo: {
      created_lt: function created_lt(parent) {
        return resolveBigUInt(1, parent.created_lt);
      }
    },
    MessageHeaderExtOutMsgInfo: {
      created_lt: function created_lt(parent) {
        return resolveBigUInt(1, parent.created_lt);
      }
    },
    MessageHeader: MessageHeaderResolver,
    Message: {
      id: function id(parent) {
        return parent._key;
      }
    },
    InMsg: InMsgResolver,
    OutMsgDequeue: {
      import_block_lt: function import_block_lt(parent) {
        return resolveBigUInt(1, parent.import_block_lt);
      }
    },
    OutMsg: OutMsgResolver,
    BlockInfo: {
      start_lt: function start_lt(parent) {
        return resolveBigUInt(1, parent.start_lt);
      },
      end_lt: function end_lt(parent) {
        return resolveBigUInt(1, parent.end_lt);
      }
    },
    Block: {
      id: function id(parent) {
        return parent._key;
      }
    },
    AccountStorageState: AccountStorageStateResolver,
    AccountStorage: {
      last_trans_lt: function last_trans_lt(parent) {
        return resolveBigUInt(1, parent.last_trans_lt);
      }
    },
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
      },
      lt: function lt(parent) {
        return resolveBigUInt(1, parent.lt);
      },
      prev_trans_lt: function prev_trans_lt(parent) {
        return resolveBigUInt(1, parent.prev_trans_lt);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsIl9rZXkiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJJLEVBQUFBLElBQUksRUFBRVI7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTVMsa0JBQWtCLEdBQUdMLE1BQU0sQ0FBQztBQUM5Qk0sRUFBQUEsS0FBSyxFQUFFUjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVMsMEJBQTBCLEdBQUdQLE1BQU0sQ0FBQztBQUN0Q1EsRUFBQUEsWUFBWSxFQUFFWjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTWEseUJBQXlCLEdBQUdULE1BQU0sQ0FBQztBQUNyQ1UsRUFBQUEsWUFBWSxFQUFFZCxNQUR1QjtBQUVyQ2UsRUFBQUEsUUFBUSxFQUFFZjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWdCLHNCQUFzQixHQUFHWixNQUFNLENBQUM7QUFDbENVLEVBQUFBLFlBQVksRUFBRWQsTUFEb0I7QUFFbENlLEVBQUFBLFFBQVEsRUFBRWY7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Q0FBQ08sTUFBN0IsRUFBcUMxSCxLQUFyQyxDQUZFO0FBR1YySCxNQUFBQSxRQUFRLEVBQUVSLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ1EsUUFBN0IsRUFBdUMxRyxPQUF2QyxDQUhBO0FBSVZoQyxNQUFBQSxZQUFZLEVBQUVrSSxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNsSSxZQUE3QixFQUEyQ21ILFdBQTNDO0FBSko7QUF4RlgsR0FBUDtBQStGSDs7QUFDRDRCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNiZixFQUFBQSxlQUFlLEVBQWZBO0FBRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgYmlnVUludDEsIGJpZ1VJbnQyLCByZXNvbHZlQmlnVUludCwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgTm9uZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IGJpZ1VJbnQyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdSZWd1bGFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NpbXBsZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0ID0gc3RydWN0KHtcbiAgICByZXdyaXRlX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkID0gc3RydWN0KHtcbiAgICBhbnljYXN0OiBNc2dBZGRyZXNzSW50QWRkclN0ZEFueWNhc3QsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcmVzczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhciA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJWYXJBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyU3RkOiBNc2dBZGRyZXNzSW50QWRkclN0ZCxcbiAgICBBZGRyVmFyOiBNc2dBZGRyZXNzSW50QWRkclZhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclN0ZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyU3RkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyVmFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0ludEFkZHJWYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdG9yYWdlVXNlZFNob3J0ID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTcGxpdE1lcmdlSW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0QWRkckV4dGVybiA9IHN0cnVjdCh7XG4gICAgQWRkckV4dGVybjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIEFkZHJOb25lOiBOb25lLFxuICAgIEFkZHJFeHRlcm46IE1zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NFeHRSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FkZHJOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBZGRyRXh0ZXJuJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgdmFsdWU6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIGNyZWF0ZWRfbHQ6IGJpZ1VJbnQxLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NFeHQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzSW50LFxuICAgIGRzdDogTXNnQWRkcmVzc0V4dCxcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0ludE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0SW5Nc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0T3V0TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0lIUicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVsbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZFRyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IGJpZ1VJbnQxLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZyA9IHN0cnVjdCh7XG4gICAgTm9uZTogTm9uZSxcbiAgICBFeHRlcm5hbDogT3V0TXNnRXh0ZXJuYWwsXG4gICAgSW1tZWRpYXRlbHk6IE91dE1zZ0ltbWVkaWF0ZWx5LFxuICAgIE91dE1zZ05ldzogT3V0TXNnT3V0TXNnTmV3LFxuICAgIFRyYW5zaXQ6IE91dE1zZ1RyYW5zaXQsXG4gICAgRGVxdWV1ZTogT3V0TXNnRGVxdWV1ZSxcbiAgICBUcmFuc2l0UmVxdWlyZWQ6IE91dE1zZ1RyYW5zaXRSZXF1aXJlZCxcbn0pO1xuXG5jb25zdCBPdXRNc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ05vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dOb25lVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVseScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0ltbWVkaWF0ZWx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdPdXRNc2dOZXcnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dPdXRNc2dOZXdWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEZXF1ZXVlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRGVxdWV1ZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdFJlcXVpcmVkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFJlcXVpcmVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZlByZXYgPSBzdHJ1Y3Qoe1xuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEJsb2NrSW5mb1ByZXZSZWZQcmV2LFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1NoYXJkID0gc3RydWN0KHtcbiAgICBzaGFyZF9wZnhfYml0czogc2NhbGFyLFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIHNoYXJkX3ByZWZpeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb01hc3RlclJlZiA9IHN0cnVjdCh7XG4gICAgbWFzdGVyOiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlZlcnRSZWYgPSBzdHJ1Y3Qoe1xuICAgIHByZXY6IEV4dEJsa1JlZixcbiAgICBwcmV2X2FsdDogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mbyA9IHN0cnVjdCh7XG4gICAgd2FudF9zcGxpdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIGFmdGVyX21lcmdlOiBzY2FsYXIsXG4gICAgZ2VuX3V0aW1lOiBzY2FsYXIsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBzY2FsYXIsXG4gICAgZmxhZ3M6IHNjYWxhcixcbiAgICBwcmV2X3JlZjogQmxvY2tJbmZvUHJldlJlZixcbiAgICB2ZXJzaW9uOiBzY2FsYXIsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IHNjYWxhcixcbiAgICBiZWZvcmVfc3BsaXQ6IHNjYWxhcixcbiAgICBhZnRlcl9zcGxpdDogc2NhbGFyLFxuICAgIHdhbnRfbWVyZ2U6IHNjYWxhcixcbiAgICB2ZXJ0X3NlcV9ubzogc2NhbGFyLFxuICAgIHN0YXJ0X2x0OiBiaWdVSW50MSxcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBOb25lLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FjY291bnRVbmluaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudFVuaW5pdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEFjdGl2ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50RnJvemVuJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgbGFzdF90cmFuc19sdDogYmlnVUludDEsXG4gICAgYmFsYW5jZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgX2tleTogc2NhbGFyLFxuICAgIHN0b3JhZ2Vfc3RhdDogQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIHN0b3JhZ2U6IEFjY291bnRTdG9yYWdlLFxuICAgIGFkZHI6IE1zZ0FkZHJlc3NJbnQsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyU3RvcmFnZVBoYXNlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNyZWRpdFBoYXNlID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBjcmVkaXQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVNraXBwZWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYXNvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlVm0gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IHNjYWxhcixcbiAgICBnYXNfdXNlZDogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZSA9IHN0cnVjdCh7XG4gICAgU2tpcHBlZDogVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFZtOiBUckNvbXB1dGVQaGFzZVZtLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdTa2lwcGVkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdWbScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlVm1WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUckFjdGlvblBoYXNlID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogc2NhbGFyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBzY2FsYXIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90X21zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VOb2Z1bmRzID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICByZXFfZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlT2sgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIG1zZ19mZWVzOiBzY2FsYXIsXG4gICAgZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlID0gc3RydWN0KHtcbiAgICBOZWdmdW5kczogTm9uZSxcbiAgICBOb2Z1bmRzOiBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBPazogVHJCb3VuY2VQaGFzZU9rLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ05lZ2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5lZ2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdOb2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ09rJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU9rVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5ID0gc3RydWN0KHtcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IFRyQm91bmNlUGhhc2UsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0dDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uID0gc3RydWN0KHtcbiAgICBPcmRpbmFyeTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIFRpY2tUb2NrOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgU3BsaXRQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFNwbGl0SW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBNZXJnZVByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgTWVyZ2VJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ09yZGluYXJ5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTdG9yYWdlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RpY2tUb2NrJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdFByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdEluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZVByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZUluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBiaWdVSW50MSxcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgZGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgcm9vdF9jZWxsOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgQ3VycmVuY3lDb2xsZWN0aW9uOiB7XG4gICAgICAgICAgICBHcmFtcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMiwgcGFyZW50LkdyYW1zKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEludGVybWVkaWF0ZUFkZHJlc3M6IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlcixcbiAgICAgICAgRXh0QmxrUmVmOiB7XG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTXNnQWRkcmVzc0ludDogTXNnQWRkcmVzc0ludFJlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzRXh0OiBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvOiB7XG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbzoge1xuICAgICAgICAgICAgY3JlYXRlZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmNyZWF0ZWRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnRGVxdWV1ZToge1xuICAgICAgICAgICAgaW1wb3J0X2Jsb2NrX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuaW1wb3J0X2Jsb2NrX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dE1zZzogT3V0TXNnUmVzb2x2ZXIsXG4gICAgICAgIEJsb2NrSW5mbzoge1xuICAgICAgICAgICAgc3RhcnRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5zdGFydF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZW5kX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuZW5kX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIEFjY291bnRTdG9yYWdlOiB7XG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50OiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBUckNvbXB1dGVQaGFzZTogVHJDb21wdXRlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJCb3VuY2VQaGFzZTogVHJCb3VuY2VQaGFzZVJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5fbWVzc2FnZShwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NCeUtleShkYi5tZXNzYWdlcywgcGFyZW50LmluX21zZyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY3NCeUtleXMoZGIubWVzc2FnZXMsIHBhcmVudC5vdXRfbXNncyk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==