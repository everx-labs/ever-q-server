"use strict";

var _require = require('./arango-types.js'),
    scalar = _require.scalar,
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
var AccountStorageStatUsed = struct({
  cells: scalar,
  bits: scalar,
  public_cells: scalar
});
var AccountStorageStat = struct({
  used: AccountStorageStatUsed,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdFVzZWQiLCJwdWJsaWNfY2VsbHMiLCJBY2NvdW50U3RvcmFnZVN0YXQiLCJ1c2VkIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSIsIkFjY291bnRTdG9yYWdlU3RhdGUiLCJBY2NvdW50VW5pbml0IiwiQWNjb3VudEFjdGl2ZSIsIkFjY291bnRGcm96ZW4iLCJBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIiLCJBY2NvdW50U3RvcmFnZSIsImxhc3RfdHJhbnNfbHQiLCJiYWxhbmNlIiwic3RhdGUiLCJBY2NvdW50IiwiX2tleSIsInN0b3JhZ2Vfc3RhdCIsInN0b3JhZ2UiLCJhZGRyIiwiVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSIsIlRyU3RvcmFnZVBoYXNlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiVHJDcmVkaXRQaGFzZSIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdCIsIlRyQ29tcHV0ZVBoYXNlU2tpcHBlZCIsInJlYXNvbiIsIlRyQ29tcHV0ZVBoYXNlVm0iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiVHJDb21wdXRlUGhhc2UiLCJTa2lwcGVkIiwiVm0iLCJUckNvbXB1dGVQaGFzZVJlc29sdmVyIiwiVHJBY3Rpb25QaGFzZSIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90X21zZ19zaXplIiwiVHJCb3VuY2VQaGFzZU5vZnVuZHMiLCJtc2dfc2l6ZSIsInJlcV9md2RfZmVlcyIsIlRyQm91bmNlUGhhc2VPayIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlIiwiTmVnZnVuZHMiLCJOb2Z1bmRzIiwiT2siLCJUckJvdW5jZVBoYXNlUmVzb2x2ZXIiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uT3JkaW5hcnkiLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlX3BoIiwiY3JlZGl0X3BoIiwiY29tcHV0ZV9waCIsImFjdGlvbiIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2siLCJ0dCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUiLCJzcGxpdF9pbmZvIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb24iLCJPcmRpbmFyeSIsIlN0b3JhZ2UiLCJTcGxpdFByZXBhcmUiLCJTcGxpdEluc3RhbGwiLCJNZXJnZVByZXBhcmUiLCJNZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIiLCJNZXNzYWdlQXJyYXkiLCJUcmFuc2FjdGlvbiIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwiZGVzY3JpcHRpb24iLCJyb290X2NlbGwiLCJjcmVhdGVSZXNvbHZlcnMiLCJkYiIsInBhcmVudCIsImZldGNoRG9jQnlLZXkiLCJtZXNzYWdlcyIsImZldGNoRG9jc0J5S2V5cyIsIlF1ZXJ5IiwiY29sbGVjdGlvblF1ZXJ5IiwiYmxvY2tzIiwiYWNjb3VudHMiLCJzZWxlY3QiLCJzZWxlY3RRdWVyeSIsIlN1YnNjcmlwdGlvbiIsImNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztlQUFtREEsT0FBTyxDQUFDLG1CQUFELEM7SUFBbERDLE0sWUFBQUEsTTtJQUFRQyxNLFlBQUFBLE07SUFBUUMsSyxZQUFBQSxLO0lBQU9DLEksWUFBQUEsSTtJQUFNQyxTLFlBQUFBLFM7O0FBQ3JDLElBQU1DLElBQUksR0FBR0osTUFBTSxDQUFDO0FBQ2hCSSxFQUFBQSxJQUFJLEVBQUVMO0FBRFUsQ0FBRCxDQUFuQjtBQUlBLElBQU1NLGtCQUFrQixHQUFHTCxNQUFNLENBQUM7QUFDOUJNLEVBQUFBLEtBQUssRUFBRVA7QUFEdUIsQ0FBRCxDQUFqQztBQUlBLElBQU1RLDBCQUEwQixHQUFHUCxNQUFNLENBQUM7QUFDdENRLEVBQUFBLFlBQVksRUFBRVQ7QUFEd0IsQ0FBRCxDQUF6QztBQUlBLElBQU1VLHlCQUF5QixHQUFHVCxNQUFNLENBQUM7QUFDckNVLEVBQUFBLFlBQVksRUFBRVgsTUFEdUI7QUFFckNZLEVBQUFBLFFBQVEsRUFBRVo7QUFGMkIsQ0FBRCxDQUF4QztBQUtBLElBQU1hLHNCQUFzQixHQUFHWixNQUFNLENBQUM7QUFDbENVLEVBQUFBLFlBQVksRUFBRVgsTUFEb0I7QUFFbENZLEVBQUFBLFFBQVEsRUFBRVo7QUFGd0IsQ0FBRCxDQUFyQztBQUtBLElBQU1jLG1CQUFtQixHQUFHYixN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QTdCLEVBQTJDc0gsV0FBM0M7QUFKSjtBQTVDWCxHQUFQO0FBbURIOztBQUNENEIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JmLEVBQUFBLGVBQWUsRUFBZkE7QUFEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBOb25lID0gc3RydWN0KHtcbiAgICBOb25lOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ3VycmVuY3lDb2xsZWN0aW9uID0gc3RydWN0KHtcbiAgICBHcmFtczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdSZWd1bGFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NpbXBsZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJTdGQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclZhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkckV4dGVybicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0V4dCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgaW1wb3J0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0ludE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0SW5Nc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0T3V0TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0lIUicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVsbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZFRyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT3V0TXNnTmV3JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGVxdWV1ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXRSZXF1aXJlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRVc2VkID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbiAgICBwdWJsaWNfY2VsbHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIHVzZWQ6IEFjY291bnRTdG9yYWdlU3RhdFVzZWQsXG4gICAgbGFzdF9wYWlkOiBzY2FsYXIsXG4gICAgZHVlX3BheW1lbnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlID0gc3RydWN0KHtcbiAgICBBY2NvdW50VW5pbml0OiBOb25lLFxuICAgIEFjY291bnRBY3RpdmU6IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlLFxuICAgIEFjY291bnRGcm96ZW46IE5vbmUsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWNjb3VudFVuaW5pdCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50QWN0aXZlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FjY291bnRGcm96ZW4nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEZyb3plblZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlID0gc3RydWN0KHtcbiAgICBsYXN0X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgYmFsYW5jZTogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIHN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlLFxufSk7XG5cbmNvbnN0IEFjY291bnQgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgX2tleTogc2NhbGFyLFxuICAgIHN0b3JhZ2Vfc3RhdDogQWNjb3VudFN0b3JhZ2VTdGF0LFxuICAgIHN0b3JhZ2U6IEFjY291bnRTdG9yYWdlLFxuICAgIGFkZHI6IE1zZ0FkZHJlc3NJbnQsXG59LCB0cnVlKTtcblxuY29uc3QgVHJhbnNhY3Rpb25TdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgb2xkX2hhc2g6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyU3RvcmFnZVBoYXNlID0gc3RydWN0KHtcbiAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgc3RvcmFnZV9mZWVzX2R1ZTogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNyZWRpdFBoYXNlID0gc3RydWN0KHtcbiAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IHNjYWxhcixcbiAgICBjcmVkaXQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVNraXBwZWQgPSBzdHJ1Y3Qoe1xuICAgIHJlYXNvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlVm0gPSBzdHJ1Y3Qoe1xuICAgIHN1Y2Nlc3M6IHNjYWxhcixcbiAgICBtc2dfc3RhdGVfdXNlZDogc2NhbGFyLFxuICAgIGFjY291bnRfYWN0aXZhdGVkOiBzY2FsYXIsXG4gICAgZ2FzX2ZlZXM6IHNjYWxhcixcbiAgICBnYXNfdXNlZDogc2NhbGFyLFxuICAgIGdhc19saW1pdDogc2NhbGFyLFxuICAgIGdhc19jcmVkaXQ6IHNjYWxhcixcbiAgICBtb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9jb2RlOiBzY2FsYXIsXG4gICAgZXhpdF9hcmc6IHNjYWxhcixcbiAgICB2bV9zdGVwczogc2NhbGFyLFxuICAgIHZtX2luaXRfc3RhdGVfaGFzaDogc2NhbGFyLFxuICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZSA9IHN0cnVjdCh7XG4gICAgU2tpcHBlZDogVHJDb21wdXRlUGhhc2VTa2lwcGVkLFxuICAgIFZtOiBUckNvbXB1dGVQaGFzZVZtLFxufSk7XG5cbmNvbnN0IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdTa2lwcGVkJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJDb21wdXRlUGhhc2VTa2lwcGVkVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdWbScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlVm1WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUckFjdGlvblBoYXNlID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogc2NhbGFyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBzY2FsYXIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90X21zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VOb2Z1bmRzID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICByZXFfZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlT2sgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIG1zZ19mZWVzOiBzY2FsYXIsXG4gICAgZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlID0gc3RydWN0KHtcbiAgICBOZWdmdW5kczogTm9uZSxcbiAgICBOb2Z1bmRzOiBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBPazogVHJCb3VuY2VQaGFzZU9rLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ05lZ2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5lZ2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdOb2Z1bmRzJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU5vZnVuZHNWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ09rJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU9rVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5ID0gc3RydWN0KHtcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IFRyQm91bmNlUGhhc2UsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0dDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uID0gc3RydWN0KHtcbiAgICBPcmRpbmFyeTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIFRpY2tUb2NrOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgU3BsaXRQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFNwbGl0SW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBNZXJnZVByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgTWVyZ2VJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ09yZGluYXJ5JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTdG9yYWdlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblN0b3JhZ2VWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RpY2tUb2NrJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdFByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdTcGxpdEluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZVByZXBhcmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdNZXJnZUluc3RhbGwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUFycmF5ID0gYXJyYXkoTWVzc2FnZSk7XG5jb25zdCBUcmFuc2FjdGlvbiA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBibG9ja19pZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIGx0OiBzY2FsYXIsXG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfaGFzaDogc2NhbGFyLFxuICAgIHByZXZfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBub3c6IHNjYWxhcixcbiAgICBvdXRtc2dfY250OiBzY2FsYXIsXG4gICAgb3JpZ19zdGF0dXM6IHNjYWxhcixcbiAgICBlbmRfc3RhdHVzOiBzY2FsYXIsXG4gICAgaW5fbXNnOiBzY2FsYXIsXG4gICAgaW5fbWVzc2FnZTogam9pbignaW5fbXNnJywgJ21lc3NhZ2VzJywgTWVzc2FnZSksXG4gICAgb3V0X21zZ3M6IFN0cmluZ0FycmF5LFxuICAgIG91dF9tZXNzYWdlczogam9pbkFycmF5KCdvdXRfbXNncycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIHRvdGFsX2ZlZXM6IHNjYWxhcixcbiAgICBzdGF0ZV91cGRhdGU6IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUsXG4gICAgZGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb24sXG4gICAgcm9vdF9jZWxsOiBzY2FsYXIsXG59LCB0cnVlKTtcblxuZnVuY3Rpb24gY3JlYXRlUmVzb2x2ZXJzKGRiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgSW50ZXJtZWRpYXRlQWRkcmVzczogSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzSW50OiBNc2dBZGRyZXNzSW50UmVzb2x2ZXIsXG4gICAgICAgIE1zZ0FkZHJlc3NFeHQ6IE1zZ0FkZHJlc3NFeHRSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJDb21wdXRlUGhhc2U6IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyQm91bmNlUGhhc2U6IFRyQm91bmNlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==