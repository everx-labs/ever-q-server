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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIk1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCIsInJld3JpdGVfcGZ4IiwiTXNnQWRkcmVzc0ludEFkZHJTdGQiLCJhbnljYXN0IiwiYWRkcmVzcyIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCIsIk1zZ0FkZHJlc3NJbnRBZGRyVmFyIiwiTXNnQWRkcmVzc0ludCIsIkFkZHJOb25lIiwiQWRkclN0ZCIsIkFkZHJWYXIiLCJNc2dBZGRyZXNzSW50UmVzb2x2ZXIiLCJUaWNrVG9jayIsInRpY2siLCJ0b2NrIiwiU3RvcmFnZVVzZWRTaG9ydCIsImNlbGxzIiwiYml0cyIsIlNwbGl0TWVyZ2VJbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJNc2dBZGRyZXNzRXh0QWRkckV4dGVybiIsIkFkZHJFeHRlcm4iLCJNc2dBZGRyZXNzRXh0IiwiTXNnQWRkcmVzc0V4dFJlc29sdmVyIiwiTWVzc2FnZUhlYWRlckludE1zZ0luZm8iLCJpaHJfZGlzYWJsZWQiLCJib3VuY2UiLCJib3VuY2VkIiwic3JjIiwiZHN0IiwidmFsdWUiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mbyIsImltcG9ydF9mZWUiLCJNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXIiLCJJbnRNc2dJbmZvIiwiRXh0SW5Nc2dJbmZvIiwiRXh0T3V0TXNnSW5mbyIsIk1lc3NhZ2VIZWFkZXJSZXNvbHZlciIsIk1lc3NhZ2VJbml0Iiwic3BsaXRfZGVwdGgiLCJzcGVjaWFsIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwiTWVzc2FnZSIsImlkIiwidHJhbnNhY3Rpb25faWQiLCJibG9ja19pZCIsImhlYWRlciIsImluaXQiLCJib2R5Iiwic3RhdHVzIiwiTXNnRW52ZWxvcGUiLCJtc2ciLCJuZXh0X2FkZHIiLCJjdXJfYWRkciIsImZ3ZF9mZWVfcmVtYWluaW5nIiwiSW5Nc2dFeHRlcm5hbCIsInRyYW5zYWN0aW9uIiwiSW5Nc2dJSFIiLCJwcm9vZl9jcmVhdGVkIiwiSW5Nc2dJbW1lZGlhdGVsbHkiLCJpbl9tc2ciLCJJbk1zZ0ZpbmFsIiwiSW5Nc2dUcmFuc2l0Iiwib3V0X21zZyIsInRyYW5zaXRfZmVlIiwiSW5Nc2dEaXNjYXJkZWRGaW5hbCIsIkluTXNnRGlzY2FyZGVkVHJhbnNpdCIsInByb29mX2RlbGl2ZXJlZCIsIkluTXNnIiwiRXh0ZXJuYWwiLCJJSFIiLCJJbW1lZGlhdGVsbHkiLCJGaW5hbCIsIlRyYW5zaXQiLCJEaXNjYXJkZWRGaW5hbCIsIkRpc2NhcmRlZFRyYW5zaXQiLCJJbk1zZ1Jlc29sdmVyIiwiT3V0TXNnRXh0ZXJuYWwiLCJPdXRNc2dJbW1lZGlhdGVseSIsInJlaW1wb3J0IiwiT3V0TXNnT3V0TXNnTmV3IiwiT3V0TXNnVHJhbnNpdCIsImltcG9ydGVkIiwiT3V0TXNnRGVxdWV1ZSIsImltcG9ydF9ibG9ja19sdCIsIk91dE1zZ1RyYW5zaXRSZXF1aXJlZCIsIk91dE1zZyIsIkltbWVkaWF0ZWx5IiwiT3V0TXNnTmV3IiwiRGVxdWV1ZSIsIlRyYW5zaXRSZXF1aXJlZCIsIk91dE1zZ1Jlc29sdmVyIiwiQmxvY2tJbmZvUHJldlJlZlByZXYiLCJCbG9ja0luZm9QcmV2UmVmIiwicHJldiIsIkJsb2NrSW5mb1NoYXJkIiwic2hhcmRfcGZ4X2JpdHMiLCJzaGFyZF9wcmVmaXgiLCJCbG9ja0luZm9NYXN0ZXJSZWYiLCJtYXN0ZXIiLCJCbG9ja0luZm9QcmV2VmVydFJlZiIsInByZXZfYWx0IiwiQmxvY2tJbmZvIiwid2FudF9zcGxpdCIsImFmdGVyX21lcmdlIiwiZ2VuX3V0aW1lIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwiZmxhZ3MiLCJwcmV2X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImJlZm9yZV9zcGxpdCIsImFmdGVyX3NwbGl0Iiwid2FudF9tZXJnZSIsInZlcnRfc2VxX25vIiwic3RhcnRfbHQiLCJzaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl92ZXJ0X3JlZiIsIkJsb2NrVmFsdWVGbG93IiwidG9fbmV4dF9ibGsiLCJleHBvcnRlZCIsImZlZXNfY29sbGVjdGVkIiwiY3JlYXRlZCIsImZyb21fcHJldl9ibGsiLCJtaW50ZWQiLCJmZWVzX2ltcG9ydGVkIiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NTdGF0ZVVwZGF0ZSIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJTdHJpbmdBcnJheSIsIlN0cmluZyIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzIiwiYWNjb3VudF9hZGRyIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJJbk1zZ0FycmF5IiwiT3V0TXNnQXJyYXkiLCJCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc0FycmF5IiwiQmxvY2tFeHRyYSIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsIkJsb2NrU3RhdGVVcGRhdGUiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJCbG9jayIsImdsb2JhbF9pZCIsInZhbHVlX2Zsb3ciLCJleHRyYSIsIkFjY291bnRTdG9yYWdlU3RhdCIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwiQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUiLCJBY2NvdW50U3RvcmFnZVN0YXRlIiwiQWNjb3VudFVuaW5pdCIsIkFjY291bnRBY3RpdmUiLCJBY2NvdW50RnJvemVuIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZVJlc29sdmVyIiwiQWNjb3VudFN0b3JhZ2UiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsInN0YXRlIiwiQWNjb3VudCIsIl9rZXkiLCJzdG9yYWdlX3N0YXQiLCJzdG9yYWdlIiwiYWRkciIsIlRyYW5zYWN0aW9uU3RhdGVVcGRhdGUiLCJUclN0b3JhZ2VQaGFzZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsIlRyQ3JlZGl0UGhhc2UiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXQiLCJUckNvbXB1dGVQaGFzZVNraXBwZWQiLCJyZWFzb24iLCJUckNvbXB1dGVQaGFzZVZtIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsIlRyQ29tcHV0ZVBoYXNlIiwiU2tpcHBlZCIsIlZtIiwiVHJDb21wdXRlUGhhc2VSZXNvbHZlciIsIlRyQWN0aW9uUGhhc2UiLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdF9tc2dfc2l6ZSIsIlRyQm91bmNlUGhhc2VOb2Z1bmRzIiwibXNnX3NpemUiLCJyZXFfZndkX2ZlZXMiLCJUckJvdW5jZVBoYXNlT2siLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZSIsIk5lZ2Z1bmRzIiwiTm9mdW5kcyIsIk9rIiwiVHJCb3VuY2VQaGFzZVJlc29sdmVyIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5IiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZV9waCIsImNyZWRpdF9waCIsImNvbXB1dGVfcGgiLCJhY3Rpb24iLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrIiwidHQiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlIiwic3BsaXRfaW5mbyIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uIiwiT3JkaW5hcnkiLCJTdG9yYWdlIiwiU3BsaXRQcmVwYXJlIiwiU3BsaXRJbnN0YWxsIiwiTWVyZ2VQcmVwYXJlIiwiTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyIiwiTWVzc2FnZUFycmF5IiwiVHJhbnNhY3Rpb24iLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsImRlc2NyaXB0aW9uIiwicm9vdF9jZWxsIiwiY3JlYXRlUmVzb2x2ZXJzIiwiZGIiLCJwYXJlbnQiLCJmZXRjaERvY0J5S2V5IiwibWVzc2FnZXMiLCJmZXRjaERvY3NCeUtleXMiLCJRdWVyeSIsImNvbGxlY3Rpb25RdWVyeSIsImJsb2NrcyIsImFjY291bnRzIiwic2VsZWN0Iiwic2VsZWN0UXVlcnkiLCJTdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uU3Vic2NyaXB0aW9uIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7ZUFBbURBLE9BQU8sQ0FBQyxtQkFBRCxDO0lBQWxEQyxNLFlBQUFBLE07SUFBUUMsTSxZQUFBQSxNO0lBQVFDLEssWUFBQUEsSztJQUFPQyxJLFlBQUFBLEk7SUFBTUMsUyxZQUFBQSxTOztBQUNyQyxJQUFNQyxJQUFJLEdBQUdKLE1BQU0sQ0FBQztBQUNoQkksRUFBQUEsSUFBSSxFQUFFTDtBQURVLENBQUQsQ0FBbkI7QUFJQSxJQUFNTSxrQkFBa0IsR0FBR0wsTUFBTSxDQUFDO0FBQzlCTSxFQUFBQSxLQUFLLEVBQUVQO0FBRHVCLENBQUQsQ0FBakM7QUFJQSxJQUFNUSwwQkFBMEIsR0FBR1AsTUFBTSxDQUFDO0FBQ3RDUSxFQUFBQSxZQUFZLEVBQUVUO0FBRHdCLENBQUQsQ0FBekM7QUFJQSxJQUFNVSx5QkFBeUIsR0FBR1QsTUFBTSxDQUFDO0FBQ3JDVSxFQUFBQSxZQUFZLEVBQUVYLE1BRHVCO0FBRXJDWSxFQUFBQSxRQUFRLEVBQUVaO0FBRjJCLENBQUQsQ0FBeEM7QUFLQSxJQUFNYSxzQkFBc0IsR0FBR1osTUFBTSxDQUFDO0FBQ2xDVSxFQUFBQSxZQUFZLEVBQUVYLE1BRG9CO0FBRWxDWSxFQUFBQSxRQUFRLEVBQUVaO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFNYyxtQkFBbUIsR0FBR2IsTUFBTSxDQUFDO0FBQy9CYyxFQUFBQSxPQUFPLEVBQUVQLDBCQURzQjtBQUUvQlEs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Qk4sRUFBRSxDQUFDRyxRQUF0QixFQUFnQ2xPLE9BQWhDLENBRFA7QUFFSHNPLE1BQUFBLE1BQU0sRUFBRVAsRUFBRSxDQUFDTSxlQUFILENBQW1CTixFQUFFLENBQUNPLE1BQXRCLEVBQThCMUgsS0FBOUIsQ0FGTDtBQUdIMkgsTUFBQUEsUUFBUSxFQUFFUixFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ1EsUUFBdEIsRUFBZ0MxRyxPQUFoQyxDQUhQO0FBSUhoQyxNQUFBQSxZQUFZLEVBQUVrSSxFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ2xJLFlBQXRCLEVBQW9DbUgsV0FBcEMsQ0FKWDtBQUtId0IsTUFBQUEsTUFBTSxFQUFFVCxFQUFFLENBQUNVLFdBQUg7QUFMTCxLQXJDSjtBQTRDSEMsSUFBQUEsWUFBWSxFQUFFO0FBQ1ZSLE1BQUFBLFFBQVEsRUFBRUgsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDRyxRQUE3QixFQUF1Q2xPLE9BQXZDLENBREE7QUFFVnNPLE1BQUFBLE1BQU0sRUFBRVAsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDTyxNQUE3QixFQUFxQzFILEtBQXJDLENBRkU7QUFHVjJILE1BQUFBLFFBQVEsRUFBRVIsRUFBRSxDQUFDWSxzQkFBSCxDQUEwQlosRUFBRSxDQUFDUSxRQUE3QixFQUF1QzFHLE9BQXZDLENBSEE7QUFJVmhDLE1BQUFBLFlBQVksRUFBRWtJLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ2xJLFlBQTdCLEVBQTJDbUgsV0FBM0M7QUFKSjtBQTVDWCxHQUFQO0FBbURIOztBQUNENEIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2JmLEVBQUFBLGVBQWUsRUFBZkE7QUFEYSxDQUFqQiIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHsgc2NhbGFyLCBzdHJ1Y3QsIGFycmF5LCBqb2luLCBqb2luQXJyYXkgfSA9IHJlcXVpcmUoJy4vYXJhbmdvLXR5cGVzLmpzJyk7XG5jb25zdCBOb25lID0gc3RydWN0KHtcbiAgICBOb25lOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQ3VycmVuY3lDb2xsZWN0aW9uID0gc3RydWN0KHtcbiAgICBHcmFtczogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyID0gc3RydWN0KHtcbiAgICB1c2Vfc3JjX2JpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3NFeHQgPSBzdHJ1Y3Qoe1xuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzcyA9IHN0cnVjdCh7XG4gICAgUmVndWxhcjogSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXIsXG4gICAgU2ltcGxlOiBJbnRlcm1lZGlhdGVBZGRyZXNzU2ltcGxlLFxuICAgIEV4dDogSW50ZXJtZWRpYXRlQWRkcmVzc0V4dCxcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdSZWd1bGFyJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW50ZXJtZWRpYXRlQWRkcmVzc1JlZ3VsYXJWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1NpbXBsZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0V4dCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NFeHRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBFeHRCbGtSZWYgPSBzdHJ1Y3Qoe1xuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNlcV9ubzogc2NhbGFyLFxuICAgIHJvb3RfaGFzaDogc2NhbGFyLFxuICAgIGZpbGVfaGFzaDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1zZ0FkZHJlc3NJbnRBZGRyU3RkQW55Y2FzdCA9IHN0cnVjdCh7XG4gICAgcmV3cml0ZV9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclN0ZCA9IHN0cnVjdCh7XG4gICAgYW55Y2FzdDogTXNnQWRkcmVzc0ludEFkZHJTdGRBbnljYXN0LFxuICAgIHdvcmtjaGFpbl9pZDogc2NhbGFyLFxuICAgIGFkZHJlc3M6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzSW50QWRkclZhckFueWNhc3QgPSBzdHJ1Y3Qoe1xuICAgIHJld3JpdGVfcGZ4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludEFkZHJWYXIgPSBzdHJ1Y3Qoe1xuICAgIGFueWNhc3Q6IE1zZ0FkZHJlc3NJbnRBZGRyVmFyQW55Y2FzdCxcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyZXNzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludCA9IHN0cnVjdCh7XG4gICAgQWRkck5vbmU6IE5vbmUsXG4gICAgQWRkclN0ZDogTXNnQWRkcmVzc0ludEFkZHJTdGQsXG4gICAgQWRkclZhcjogTXNnQWRkcmVzc0ludEFkZHJWYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0ludFJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnQWRkck5vbmUnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkck5vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0FkZHJTdGQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNc2dBZGRyZXNzSW50QWRkclN0ZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkclZhcicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NJbnRBZGRyVmFyVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVGlja1RvY2sgPSBzdHJ1Y3Qoe1xuICAgIHRpY2s6IHNjYWxhcixcbiAgICB0b2NrOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RvcmFnZVVzZWRTaG9ydCA9IHN0cnVjdCh7XG4gICAgY2VsbHM6IHNjYWxhcixcbiAgICBiaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3BsaXRNZXJnZUluZm8gPSBzdHJ1Y3Qoe1xuICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBzY2FsYXIsXG4gICAgYWNjX3NwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgdGhpc19hZGRyOiBzY2FsYXIsXG4gICAgc2libGluZ19hZGRyOiBzY2FsYXIsXG59KTtcblxuY29uc3QgTXNnQWRkcmVzc0V4dEFkZHJFeHRlcm4gPSBzdHJ1Y3Qoe1xuICAgIEFkZHJFeHRlcm46IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICBBZGRyTm9uZTogTm9uZSxcbiAgICBBZGRyRXh0ZXJuOiBNc2dBZGRyZXNzRXh0QWRkckV4dGVybixcbn0pO1xuXG5jb25zdCBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdBZGRyTm9uZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWRkckV4dGVybicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01zZ0FkZHJlc3NFeHRBZGRyRXh0ZXJuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUhlYWRlckludE1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIGlocl9kaXNhYmxlZDogc2NhbGFyLFxuICAgIGJvdW5jZTogc2NhbGFyLFxuICAgIGJvdW5jZWQ6IHNjYWxhcixcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzSW50LFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogTXNnQWRkcmVzc0V4dCxcbiAgICBkc3Q6IE1zZ0FkZHJlc3NJbnQsXG4gICAgaW1wb3J0X2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvID0gc3RydWN0KHtcbiAgICBzcmM6IE1zZ0FkZHJlc3NJbnQsXG4gICAgZHN0OiBNc2dBZGRyZXNzRXh0LFxuICAgIGNyZWF0ZWRfbHQ6IHNjYWxhcixcbiAgICBjcmVhdGVkX2F0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlciA9IHN0cnVjdCh7XG4gICAgSW50TXNnSW5mbzogTWVzc2FnZUhlYWRlckludE1zZ0luZm8sXG4gICAgRXh0SW5Nc2dJbmZvOiBNZXNzYWdlSGVhZGVyRXh0SW5Nc2dJbmZvLFxuICAgIEV4dE91dE1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0ludE1zZ0luZm8nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0SW5Nc2dJbmZvJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dEluTXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0T3V0TXNnSW5mbycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRPdXRNc2dJbmZvVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgTWVzc2FnZUluaXQgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgTWVzc2FnZSA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGJsb2NrX2lkOiBzY2FsYXIsXG4gICAgaGVhZGVyOiBNZXNzYWdlSGVhZGVyLFxuICAgIGluaXQ6IE1lc3NhZ2VJbml0LFxuICAgIGJvZHk6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbn0sIHRydWUpO1xuXG5jb25zdCBNc2dFbnZlbG9wZSA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgbmV4dF9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGN1cl9hZGRyOiBJbnRlcm1lZGlhdGVBZGRyZXNzLFxuICAgIGZ3ZF9mZWVfcmVtYWluaW5nOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgSW5Nc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0lIUiA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBpaHJfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfY3JlYXRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSW1tZWRpYXRlbGx5ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRmluYWwgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dUcmFuc2l0ID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zaXRfZmVlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dEaXNjYXJkZWRGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb25faWQ6IHNjYWxhcixcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgcHJvb2ZfZGVsaXZlcmVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2cgPSBzdHJ1Y3Qoe1xuICAgIEV4dGVybmFsOiBJbk1zZ0V4dGVybmFsLFxuICAgIElIUjogSW5Nc2dJSFIsXG4gICAgSW1tZWRpYXRlbGx5OiBJbk1zZ0ltbWVkaWF0ZWxseSxcbiAgICBGaW5hbDogSW5Nc2dGaW5hbCxcbiAgICBUcmFuc2l0OiBJbk1zZ1RyYW5zaXQsXG4gICAgRGlzY2FyZGVkRmluYWw6IEluTXNnRGlzY2FyZGVkRmluYWwsXG4gICAgRGlzY2FyZGVkVHJhbnNpdDogSW5Nc2dEaXNjYXJkZWRUcmFuc2l0LFxufSk7XG5cbmNvbnN0IEluTXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdFeHRlcm5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0lIUicgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSUhSVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdJbW1lZGlhdGVsbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ltbWVkaWF0ZWxseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRmluYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdEaXNjYXJkZWRGaW5hbCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRGlzY2FyZGVkRmluYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ0Rpc2NhcmRlZFRyYW5zaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOb25lJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnTm9uZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRXh0ZXJuYWwnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dFeHRlcm5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnSW1tZWRpYXRlbHknIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnT3V0TXNnTmV3JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnT3V0TXNnTmV3VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUcmFuc2l0JyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnT3V0TXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnRGVxdWV1ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAoJ1RyYW5zaXRSZXF1aXJlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ1RyYW5zaXRSZXF1aXJlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZSZWZQcmV2ID0gc3RydWN0KHtcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBCbG9ja0luZm9QcmV2UmVmUHJldixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9TaGFyZCA9IHN0cnVjdCh7XG4gICAgc2hhcmRfcGZ4X2JpdHM6IHNjYWxhcixcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBzaGFyZF9wcmVmaXg6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9NYXN0ZXJSZWYgPSBzdHJ1Y3Qoe1xuICAgIG1hc3RlcjogRXh0QmxrUmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrSW5mb1ByZXZWZXJ0UmVmID0gc3RydWN0KHtcbiAgICBwcmV2OiBFeHRCbGtSZWYsXG4gICAgcHJldl9hbHQ6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHdhbnRfc3BsaXQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICBhZnRlcl9tZXJnZTogc2NhbGFyLFxuICAgIGdlbl91dGltZTogc2NhbGFyLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogc2NhbGFyLFxuICAgIGZsYWdzOiBzY2FsYXIsXG4gICAgcHJldl9yZWY6IEJsb2NrSW5mb1ByZXZSZWYsXG4gICAgdmVyc2lvbjogc2NhbGFyLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBzY2FsYXIsXG4gICAgYmVmb3JlX3NwbGl0OiBzY2FsYXIsXG4gICAgYWZ0ZXJfc3BsaXQ6IHNjYWxhcixcbiAgICB3YW50X21lcmdlOiBzY2FsYXIsXG4gICAgdmVydF9zZXFfbm86IHNjYWxhcixcbiAgICBzdGFydF9sdDogc2NhbGFyLFxuICAgIGVuZF9sdDogc2NhbGFyLFxuICAgIHNoYXJkOiBCbG9ja0luZm9TaGFyZCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBzY2FsYXIsXG4gICAgbWFzdGVyX3JlZjogQmxvY2tJbmZvTWFzdGVyUmVmLFxuICAgIHByZXZfdmVydF9yZWY6IEJsb2NrSW5mb1ByZXZWZXJ0UmVmLFxufSk7XG5cbmNvbnN0IEJsb2NrVmFsdWVGbG93ID0gc3RydWN0KHtcbiAgICB0b19uZXh0X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGV4cG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19jb2xsZWN0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBjcmVhdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBmcm9tX3ByZXZfYmxrOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgbWludGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZmVlc19pbXBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxufSk7XG5cbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdHJpbmdBcnJheSA9IGFycmF5KFN0cmluZyk7XG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyA9IHN0cnVjdCh7XG4gICAgYWNjb3VudF9hZGRyOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb25zOiBTdHJpbmdBcnJheSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUsXG4gICAgdHJfY291bnQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0FycmF5ID0gYXJyYXkoSW5Nc2cpO1xuY29uc3QgT3V0TXNnQXJyYXkgPSBhcnJheShPdXRNc2cpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSA9IGFycmF5KEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzKTtcbmNvbnN0IEJsb2NrRXh0cmEgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZ19kZXNjcjogSW5Nc2dBcnJheSxcbiAgICByYW5kX3NlZWQ6IHNjYWxhcixcbiAgICBvdXRfbXNnX2Rlc2NyOiBPdXRNc2dBcnJheSxcbiAgICBhY2NvdW50X2Jsb2NrczogQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSxcbn0pO1xuXG5jb25zdCBCbG9ja1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBuZXc6IHNjYWxhcixcbiAgICBuZXdfaGFzaDogc2NhbGFyLFxuICAgIG5ld19kZXB0aDogc2NhbGFyLFxuICAgIG9sZDogc2NhbGFyLFxuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgb2xkX2RlcHRoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2sgPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgc3RhdHVzOiBzY2FsYXIsXG4gICAgZ2xvYmFsX2lkOiBzY2FsYXIsXG4gICAgaW5mbzogQmxvY2tJbmZvLFxuICAgIHZhbHVlX2Zsb3c6IEJsb2NrVmFsdWVGbG93LFxuICAgIGV4dHJhOiBCbG9ja0V4dHJhLFxuICAgIHN0YXRlX3VwZGF0ZTogQmxvY2tTdGF0ZVVwZGF0ZSxcbn0sIHRydWUpO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXQgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfcGFpZDogc2NhbGFyLFxuICAgIGR1ZV9wYXltZW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2RlcHRoOiBzY2FsYXIsXG4gICAgc3BlY2lhbDogVGlja1RvY2ssXG4gICAgY29kZTogc2NhbGFyLFxuICAgIGRhdGE6IHNjYWxhcixcbiAgICBsaWJyYXJ5OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ZSA9IHN0cnVjdCh7XG4gICAgQWNjb3VudFVuaW5pdDogTm9uZSxcbiAgICBBY2NvdW50QWN0aXZlOiBBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudEFjdGl2ZSxcbiAgICBBY2NvdW50RnJvemVuOiBOb25lLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAoJ0FjY291bnRVbmluaXQnIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdBY2NvdW50U3RvcmFnZVN0YXRlQWNjb3VudFVuaW5pdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnQWNjb3VudEFjdGl2ZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdBY2NvdW50RnJvemVuJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRGcm96ZW5WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZSA9IHN0cnVjdCh7XG4gICAgbGFzdF90cmFuc19sdDogc2NhbGFyLFxuICAgIGJhbGFuY2U6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBzdGF0ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50ID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIF9rZXk6IHNjYWxhcixcbiAgICBzdG9yYWdlX3N0YXQ6IEFjY291bnRTdG9yYWdlU3RhdCxcbiAgICBzdG9yYWdlOiBBY2NvdW50U3RvcmFnZSxcbiAgICBhZGRyOiBNc2dBZGRyZXNzSW50LFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUclN0b3JhZ2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDcmVkaXRQaGFzZSA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgY3JlZGl0OiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VTa2lwcGVkID0gc3RydWN0KHtcbiAgICByZWFzb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVZtID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBzY2FsYXIsXG4gICAgZ2FzX3VzZWQ6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIFNraXBwZWQ6IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCxcbiAgICBWbTogVHJDb21wdXRlUGhhc2VWbSxcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmICgnU2tpcHBlZCcgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlU2tpcHBlZFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnVm0nIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVZtVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJBY3Rpb25QaGFzZSA9IHN0cnVjdCh7XG4gICAgc3VjY2Vzczogc2NhbGFyLFxuICAgIHZhbGlkOiBzY2FsYXIsXG4gICAgbm9fZnVuZHM6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG4gICAgdG90YWxfZndkX2ZlZXM6IHNjYWxhcixcbiAgICB0b3RhbF9hY3Rpb25fZmVlczogc2NhbGFyLFxuICAgIHJlc3VsdF9jb2RlOiBzY2FsYXIsXG4gICAgcmVzdWx0X2FyZzogc2NhbGFyLFxuICAgIHRvdF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgc3BlY19hY3Rpb25zOiBzY2FsYXIsXG4gICAgc2tpcHBlZF9hY3Rpb25zOiBzY2FsYXIsXG4gICAgbXNnc19jcmVhdGVkOiBzY2FsYXIsXG4gICAgYWN0aW9uX2xpc3RfaGFzaDogc2NhbGFyLFxuICAgIHRvdF9tc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlTm9mdW5kcyA9IHN0cnVjdCh7XG4gICAgbXNnX3NpemU6IFN0b3JhZ2VVc2VkU2hvcnQsXG4gICAgcmVxX2Z3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZU9rID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICBtc2dfZmVlczogc2NhbGFyLFxuICAgIGZ3ZF9mZWVzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJCb3VuY2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgTmVnZnVuZHM6IE5vbmUsXG4gICAgTm9mdW5kczogVHJCb3VuY2VQaGFzZU5vZnVuZHMsXG4gICAgT2s6IFRyQm91bmNlUGhhc2VPayxcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdOZWdmdW5kcycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOZWdmdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTm9mdW5kcycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOb2Z1bmRzVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdPaycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VPa1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSA9IHN0cnVjdCh7XG4gICAgY3JlZGl0X2ZpcnN0OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBUckJvdW5jZVBoYXNlLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdHQ6IHNjYWxhcixcbiAgICBzdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjb21wdXRlX3BoOiBUckNvbXB1dGVQaGFzZSxcbiAgICBhY3Rpb246IFRyQWN0aW9uUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxuICAgIGRlc3Ryb3llZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdFByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgcHJlcGFyZV90cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGluc3RhbGxlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHN0b3JhZ2VfcGg6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgY3JlZGl0X3BoOiBUckNyZWRpdFBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiA9IHN0cnVjdCh7XG4gICAgT3JkaW5hcnk6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSxcbiAgICBTdG9yYWdlOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBUaWNrVG9jazogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrLFxuICAgIFNwbGl0UHJlcGFyZTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSxcbiAgICBTcGxpdEluc3RhbGw6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGwsXG4gICAgTWVyZ2VQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlLFxuICAgIE1lcmdlSW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbCxcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKCdPcmRpbmFyeScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3RvcmFnZScgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TdG9yYWdlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCdUaWNrVG9jaycgaW4gb2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9ja1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3BsaXRQcmVwYXJlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnU3BsaXRJbnN0YWxsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTWVyZ2VQcmVwYXJlJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmICgnTWVyZ2VJbnN0YWxsJyBpbiBvYmopIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogc2NhbGFyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIGRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uLFxuICAgIHJvb3RfY2VsbDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEludGVybWVkaWF0ZUFkZHJlc3M6IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlcixcbiAgICAgICAgTXNnQWRkcmVzc0ludDogTXNnQWRkcmVzc0ludFJlc29sdmVyLFxuICAgICAgICBNc2dBZGRyZXNzRXh0OiBNc2dBZGRyZXNzRXh0UmVzb2x2ZXIsXG4gICAgICAgIE1lc3NhZ2VIZWFkZXI6IE1lc3NhZ2VIZWFkZXJSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZToge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgSW5Nc2c6IEluTXNnUmVzb2x2ZXIsXG4gICAgICAgIE91dE1zZzogT3V0TXNnUmVzb2x2ZXIsXG4gICAgICAgIEJsb2NrOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBBY2NvdW50U3RvcmFnZVN0YXRlOiBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIsXG4gICAgICAgIEFjY291bnQ6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFRyQ29tcHV0ZVBoYXNlOiBUckNvbXB1dGVQaGFzZVJlc29sdmVyLFxuICAgICAgICBUckJvdW5jZVBoYXNlOiBUckJvdW5jZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyYW5zYWN0aW9uRGVzY3JpcHRpb246IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb246IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpbl9tZXNzYWdlKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYi5mZXRjaERvY0J5S2V5KGRiLm1lc3NhZ2VzLCBwYXJlbnQuaW5fbXNnKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXMocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jc0J5S2V5cyhkYi5tZXNzYWdlcywgcGFyZW50Lm91dF9tc2dzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIFF1ZXJ5OiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmJsb2NrcywgQmxvY2spLFxuICAgICAgICAgICAgYWNjb3VudHM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25RdWVyeShkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgICAgIHNlbGVjdDogZGIuc2VsZWN0UXVlcnkoKSxcbiAgICAgICAgfSxcbiAgICAgICAgU3Vic2NyaXB0aW9uOiB7XG4gICAgICAgICAgICBtZXNzYWdlczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5tZXNzYWdlcywgTWVzc2FnZSksXG4gICAgICAgICAgICBibG9ja3M6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5hY2NvdW50cywgQWNjb3VudCksXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGRiLmNvbGxlY3Rpb25TdWJzY3JpcHRpb24oZGIudHJhbnNhY3Rpb25zLCBUcmFuc2FjdGlvbiksXG4gICAgICAgIH1cbiAgICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBjcmVhdGVSZXNvbHZlcnNcbn07XG4iXX0=