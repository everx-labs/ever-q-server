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
  transaction_id: bigUInt1,
  fwd_fee: scalar
});
var InMsgDiscardedTransit = struct({
  in_msg: MsgEnvelope,
  transaction_id: bigUInt1,
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
  last_trans_lt: bigUInt1,
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
    InMsgDiscardedFinal: {
      transaction_id: function transaction_id(parent) {
        return resolveBigUInt(1, parent.transaction_id);
      }
    },
    InMsgDiscardedTransit: {
      transaction_id: function transaction_id(parent) {
        return resolveBigUInt(1, parent.transaction_id);
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
      last_trans_lt: function last_trans_lt(parent) {
        return resolveBigUInt(1, parent.last_trans_lt);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwicmVzb2x2ZUJpZ1VJbnQiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsIl9rZXkiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBdUZBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQXRGQyxNLFlBQUFBLE07SUFBUUMsUSxZQUFBQSxRO0lBQVVDLFEsWUFBQUEsUTtJQUFVQyxjLFlBQUFBLGM7SUFBZ0JDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDekUsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJJLEVBQUFBLElBQUksRUFBRVI7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTVMsa0JBQWtCLEdBQUdMLE1BQU0sQ0FBQztBQUM5Qk0sRUFBQUEsS0FBSyxFQUFFUjtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVMsMEJBQTBCLEdBQUdQLE1BQU0sQ0FBQztBQUN0Q1EsRUFBQUEsWUFBWSxFQUFFWjtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTWEseUJBQXlCLEdBQUdULE1BQU0sQ0FBQztBQUNyQ1UsRUFBQUEsWUFBWSxFQUFFZCxNQUR1QjtBQUVyQ2UsRUFBQUEsUUFBUSxFQUFFZjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWdCLHNCQUFzQixHQUFHWixNQUFNLENBQUM7QUFDbENVLEVBQUFBLFlBQVksRUFBRWQsTUFEb0I7QUFFbENlLEVBQUFBLFFBQVEsRUFBRWY7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QUgsQ0FBbUJOLEVBQUUsQ0FBQ08sTUFBdEIsRUFBOEIxSCxLQUE5QixDQUZMO0FBR0gySCxNQUFBQSxRQUFRLEVBQUVSLEVBQUUsQ0FBQ00sZUFBSCxDQUFtQk4sRUFBRSxDQUFDUSxRQUF0QixFQUFnQzFHLE9BQWhDLENBSFA7QUFJSGhDLE1BQUFBLFlBQVksRUFBRWtJLEVBQUUsQ0FBQ00sZUFBSCxDQUFtQk4sRUFBRSxDQUFDbEksWUFBdEIsRUFBb0NtSCxXQUFwQyxDQUpYO0FBS0h3QixNQUFBQSxNQUFNLEVBQUVULEVBQUUsQ0FBQ1UsV0FBSDtBQUxMLEtBOUZKO0FBcUdIQyxJQUFBQSxZQUFZLEVBQUU7QUFDVlIsTUFBQUEsUUFBUSxFQUFFSCxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNHLFFBQTdCLEVBQXVDbE8sT0FBdkMsQ0FEQTtBQUVWc08sTUFBQUEsTUFBTSxFQUFFUCxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNPLE1BQTdCLEVBQXFDMUgsS0FBckMsQ0FGRTtBQUdWMkgsTUFBQUEsUUFBUSxFQUFFUixFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNRLFFBQTdCLEVBQXVDMUcsT0FBdkMsQ0FIQTtBQUlWaEMsTUFBQUEsWUFBWSxFQUFFa0ksRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDbEksWUFBN0IsRUFBMkNtSCxXQUEzQztBQUpKO0FBckdYLEdBQVA7QUE0R0g7O0FBQ0Q0QixNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDYmYsRUFBQUEsZUFBZSxFQUFmQTtBQURhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgeyBzY2FsYXIsIGJpZ1VJbnQxLCBiaWdVSW50MiwgcmVzb2x2ZUJpZ1VJbnQsIHN0cnVjdCwgYXJyYXksIGpvaW4sIGpvaW5BcnJheSB9ID0gcmVxdWlyZSgnLi9hcmFuZ28tdHlwZXMuanMnKTtcbmNvbnN0IE5vbmUgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBDdXJyZW5jeUNvbGxlY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIEdyYW1zOiBiaWdVSW50Mixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnUmVndWxhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTaW1wbGUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdFeHQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IGJpZ1VJbnQxLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJTdGQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclZhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkckV4dGVybicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBiaWdVSW50MSxcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBNc2dBZGRyZXNzRXh0LFxuICAgIGRzdDogTXNnQWRkcmVzc0ludCxcbiAgICBpbXBvcnRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0ludCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NFeHQsXG4gICAgY3JlYXRlZF9sdDogYmlnVUludDEsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXIgPSBzdHJ1Y3Qoe1xuICAgIEludE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvLFxuICAgIEV4dEluTXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyxcbiAgICBFeHRPdXRNc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyxcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdJbnRNc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckludE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dEluTXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dE91dE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VJbml0ID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIGhlYWRlcjogTWVzc2FnZUhlYWRlcixcbiAgICBpbml0OiBNZXNzYWdlSW5pdCxcbiAgICBib2R5OiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuY29uc3QgTXNnRW52ZWxvcGUgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIG5leHRfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBjdXJfYWRkcjogSW50ZXJtZWRpYXRlQWRkcmVzcyxcbiAgICBmd2RfZmVlX3JlbWFpbmluZzogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEluTXNnRXh0ZXJuYWwgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJSFIgPSBzdHJ1Y3Qoe1xuICAgIG1zZzogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIHByb29mX2NyZWF0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ltbWVkaWF0ZWxseSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0ZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2l0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IGJpZ1VJbnQxLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgRXh0ZXJuYWw6IEluTXNnRXh0ZXJuYWwsXG4gICAgSUhSOiBJbk1zZ0lIUixcbiAgICBJbW1lZGlhdGVsbHk6IEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEZpbmFsOiBJbk1zZ0ZpbmFsLFxuICAgIFRyYW5zaXQ6IEluTXNnVHJhbnNpdCxcbiAgICBEaXNjYXJkZWRGaW5hbDogSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBEaXNjYXJkZWRUcmFuc2l0OiBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG59KTtcblxuY29uc3QgSW5Nc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0V4dGVybmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSUhSJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dJSFJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ltbWVkaWF0ZWxseScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSW1tZWRpYXRlbGx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZEZpbmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGlzY2FyZGVkVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE91dE1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ0ltbWVkaWF0ZWx5ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIHJlaW1wb3J0OiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dPdXRNc2dOZXcgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgaW1wb3J0ZWQ6IEluTXNnLFxufSk7XG5cbmNvbnN0IE91dE1zZ0RlcXVldWUgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydF9ibG9ja19sdDogYmlnVUludDEsXG59KTtcblxuY29uc3QgT3V0TXNnVHJhbnNpdFJlcXVpcmVkID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRlZDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnID0gc3RydWN0KHtcbiAgICBOb25lOiBOb25lLFxuICAgIEV4dGVybmFsOiBPdXRNc2dFeHRlcm5hbCxcbiAgICBJbW1lZGlhdGVseTogT3V0TXNnSW1tZWRpYXRlbHksXG4gICAgT3V0TXNnTmV3OiBPdXRNc2dPdXRNc2dOZXcsXG4gICAgVHJhbnNpdDogT3V0TXNnVHJhbnNpdCxcbiAgICBEZXF1ZXVlOiBPdXRNc2dEZXF1ZXVlLFxuICAgIFRyYW5zaXRSZXF1aXJlZDogT3V0TXNnVHJhbnNpdFJlcXVpcmVkLFxufSk7XG5cbmNvbnN0IE91dE1zZ1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dGVybmFsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0ltbWVkaWF0ZWx5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnSW1tZWRpYXRlbHlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ091dE1zZ05ldycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVHJhbnNpdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0RlcXVldWUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dEZXF1ZXVlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0UmVxdWlyZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IGJpZ1VJbnQxLFxuICAgIGVuZF9sdDogYmlnVUludDEsXG4gICAgc2hhcmQ6IEJsb2NrSW5mb1NoYXJkLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IHNjYWxhcixcbiAgICBtYXN0ZXJfcmVmOiBCbG9ja0luZm9NYXN0ZXJSZWYsXG4gICAgcHJldl92ZXJ0X3JlZjogQmxvY2tJbmZvUHJldlZlcnRSZWYsXG59KTtcblxuY29uc3QgQmxvY2tWYWx1ZUZsb3cgPSBzdHJ1Y3Qoe1xuICAgIHRvX25leHRfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZXhwb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2NvbGxlY3RlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGNyZWF0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBpbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZyb21fcHJldl9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBtaW50ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmZWVzX2ltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFN0cmluZ0FycmF5ID0gYXJyYXkoU3RyaW5nKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzID0gc3RydWN0KHtcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbnM6IFN0cmluZ0FycmF5LFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSxcbiAgICB0cl9jb3VudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnQXJyYXkgPSBhcnJheShJbk1zZyk7XG5jb25zdCBPdXRNc2dBcnJheSA9IGFycmF5KE91dE1zZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5ID0gYXJyYXkoQmxvY2tFeHRyYUFjY291bnRCbG9ja3MpO1xuY29uc3QgQmxvY2tFeHRyYSA9IHN0cnVjdCh7XG4gICAgaW5fbXNnX2Rlc2NyOiBJbk1zZ0FycmF5LFxuICAgIHJhbmRfc2VlZDogc2NhbGFyLFxuICAgIG91dF9tc2dfZGVzY3I6IE91dE1zZ0FycmF5LFxuICAgIGFjY291bnRfYmxvY2tzOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5LFxufSk7XG5cbmNvbnN0IEJsb2NrU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG5ldzogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2RlcHRoOiBzY2FsYXIsXG4gICAgb2xkOiBzY2FsYXIsXG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBvbGRfZGVwdGg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9jayA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBnbG9iYWxfaWQ6IHNjYWxhcixcbiAgICBpbmZvOiBCbG9ja0luZm8sXG4gICAgdmFsdWVfZmxvdzogQmxvY2tWYWx1ZUZsb3csXG4gICAgZXh0cmE6IEJsb2NrRXh0cmEsXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja1N0YXRlVXBkYXRlLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdCA9IHN0cnVjdCh7XG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlID0gc3RydWN0KHtcbiAgICBBY2NvdW50VW5pbml0OiBOb25lLFxuICAgIEFjY291bnRBY3RpdmU6IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRGcm96ZW46IE5vbmUsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWNjb3VudFVuaW5pdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50QWN0aXZlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRGcm96ZW4nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlID0gc3RydWN0KHtcbiAgICBsYXN0X3RyYW5zX2x0OiBiaWdVSW50MSxcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogTXNnQWRkcmVzc0ludCxcbn0sIHRydWUpO1xuXG5jb25zdCBUcmFuc2FjdGlvblN0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJTdG9yYWdlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBzdG9yYWdlX2ZlZXNfZHVlOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ3JlZGl0UGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIGNyZWRpdDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCA9IHN0cnVjdCh7XG4gICAgcmVhc29uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VWbSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIG1zZ19zdGF0ZV91c2VkOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hY3RpdmF0ZWQ6IHNjYWxhcixcbiAgICBnYXNfZmVlczogc2NhbGFyLFxuICAgIGdhc191c2VkOiBzY2FsYXIsXG4gICAgZ2FzX2xpbWl0OiBzY2FsYXIsXG4gICAgZ2FzX2NyZWRpdDogc2NhbGFyLFxuICAgIG1vZGU6IHNjYWxhcixcbiAgICBleGl0X2NvZGU6IHNjYWxhcixcbiAgICBleGl0X2FyZzogc2NhbGFyLFxuICAgIHZtX3N0ZXBzOiBzY2FsYXIsXG4gICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG4gICAgdm1fZmluYWxfc3RhdGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlID0gc3RydWN0KHtcbiAgICBTa2lwcGVkOiBUckNvbXB1dGVQaGFzZVNraXBwZWQsXG4gICAgVm06IFRyQ29tcHV0ZVBoYXNlVm0sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ1NraXBwZWQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1ZtJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VWbVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyQWN0aW9uUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICB2YWxpZDogc2NhbGFyLFxuICAgIG5vX2Z1bmRzOiBzY2FsYXIsXG4gICAgc3RhdHVzX2NoYW5nZTogc2NhbGFyLFxuICAgIHRvdGFsX2Z3ZF9mZWVzOiBzY2FsYXIsXG4gICAgdG90YWxfYWN0aW9uX2ZlZXM6IHNjYWxhcixcbiAgICByZXN1bHRfY29kZTogc2NhbGFyLFxuICAgIHJlc3VsdF9hcmc6IHNjYWxhcixcbiAgICB0b3RfYWN0aW9uczogc2NhbGFyLFxuICAgIHNwZWNfYWN0aW9uczogc2NhbGFyLFxuICAgIHNraXBwZWRfYWN0aW9uczogc2NhbGFyLFxuICAgIG1zZ3NfY3JlYXRlZDogc2NhbGFyLFxuICAgIGFjdGlvbl9saXN0X2hhc2g6IHNjYWxhcixcbiAgICB0b3RfbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU5vZnVuZHMgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIHJlcV9md2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VPayA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgbXNnX2ZlZXM6IHNjYWxhcixcbiAgICBmd2RfZmVlczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIE5lZ2Z1bmRzOiBOb25lLFxuICAgIE5vZnVuZHM6IFRyQm91bmNlUGhhc2VOb2Z1bmRzLFxuICAgIE9rOiBUckJvdW5jZVBoYXNlT2ssXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnTmVnZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTmVnZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ05vZnVuZHMnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlT2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkgPSBzdHJ1Y3Qoe1xuICAgIGNyZWRpdF9maXJzdDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogVHJCb3VuY2VQaGFzZSxcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHR0OiBzY2FsYXIsXG4gICAgc3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpbnN0YWxsZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGNyZWRpdF9waDogVHJDcmVkaXRQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24gPSBzdHJ1Y3Qoe1xuICAgIE9yZGluYXJ5OiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnksXG4gICAgU3RvcmFnZTogVHJTdG9yYWdlUGhhc2UsXG4gICAgVGlja1RvY2s6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayxcbiAgICBTcGxpdFByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUsXG4gICAgU3BsaXRJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsLFxuICAgIE1lcmdlUHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSxcbiAgICBNZXJnZUluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnT3JkaW5hcnknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnlWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1N0b3JhZ2UnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVGlja1RvY2snIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2tWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0UHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NwbGl0SW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlUHJlcGFyZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ01lcmdlSW5zdGFsbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlQXJyYXkgPSBhcnJheShNZXNzYWdlKTtcbmNvbnN0IFRyYW5zYWN0aW9uID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgbHQ6IGJpZ1VJbnQxLFxuICAgIGxhc3RfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IGJpZ1VJbnQxLFxuICAgIG5vdzogc2NhbGFyLFxuICAgIG91dG1zZ19jbnQ6IHNjYWxhcixcbiAgICBvcmlnX3N0YXR1czogc2NhbGFyLFxuICAgIGVuZF9zdGF0dXM6IHNjYWxhcixcbiAgICBpbl9tc2c6IHNjYWxhcixcbiAgICBpbl9tZXNzYWdlOiBqb2luKCdpbl9tc2cnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICBvdXRfbXNnczogU3RyaW5nQXJyYXksXG4gICAgb3V0X21lc3NhZ2VzOiBqb2luQXJyYXkoJ291dF9tc2dzJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgdG90YWxfZmVlczogc2NhbGFyLFxuICAgIHN0YXRlX3VwZGF0ZTogVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSxcbiAgICBkZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbixcbiAgICByb290X2NlbGw6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5mdW5jdGlvbiBjcmVhdGVSZXNvbHZlcnMoZGIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBDdXJyZW5jeUNvbGxlY3Rpb246IHtcbiAgICAgICAgICAgIEdyYW1zKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgyLCBwYXJlbnQuR3JhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW50ZXJtZWRpYXRlQWRkcmVzczogSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyLFxuICAgICAgICBFeHRCbGtSZWY6IHtcbiAgICAgICAgICAgIGVuZF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LmVuZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNc2dBZGRyZXNzSW50OiBNc2dBZGRyZXNzSW50UmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NFeHQ6IE1zZ0FkZHJlc3NFeHRSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlckludE1zZ0luZm86IHtcbiAgICAgICAgICAgIGNyZWF0ZWRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5jcmVhdGVkX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvOiB7XG4gICAgICAgICAgICBjcmVhdGVkX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQuY3JlYXRlZF9sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlSGVhZGVyOiBNZXNzYWdlSGVhZGVyUmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnRGlzY2FyZGVkRmluYWw6IHtcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uX2lkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQudHJhbnNhY3Rpb25faWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2dEaXNjYXJkZWRUcmFuc2l0OiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbl9pZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnRyYW5zYWN0aW9uX2lkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEluTXNnOiBJbk1zZ1Jlc29sdmVyLFxuICAgICAgICBPdXRNc2dEZXF1ZXVlOiB7XG4gICAgICAgICAgICBpbXBvcnRfYmxvY2tfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5pbXBvcnRfYmxvY2tfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2tJbmZvOiB7XG4gICAgICAgICAgICBzdGFydF9sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnN0YXJ0X2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmRfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5lbmRfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudFN0b3JhZ2U6IHtcbiAgICAgICAgICAgIGxhc3RfdHJhbnNfbHQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmVCaWdVSW50KDEsIHBhcmVudC5sYXN0X3RyYW5zX2x0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50Lmx0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsYXN0X3RyYW5zX2x0KHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlQmlnVUludCgxLCBwYXJlbnQubGFzdF90cmFuc19sdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJldl90cmFuc19sdChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzb2x2ZUJpZ1VJbnQoMSwgcGFyZW50LnByZXZfdHJhbnNfbHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==