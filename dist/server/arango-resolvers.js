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
var MessageHeaderIntMsgInfo = struct({
  ihr_disabled: scalar,
  bounce: scalar,
  bounced: scalar,
  src: scalar,
  dst: scalar,
  value: CurrencyCollection,
  ihr_fee: scalar,
  fwd_fee: scalar,
  created_lt: scalar,
  created_at: scalar
});
var MessageHeaderExtInMsgInfo = struct({
  src: scalar,
  dst: scalar,
  import_fee: scalar
});
var MessageHeaderExtOutMsgInfo = struct({
  src: scalar,
  dst: scalar,
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
  id: scalar,
  _key: scalar,
  storage_stat: AccountStorageStat,
  storage: AccountStorage,
  addr: scalar
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tcmVzb2x2ZXJzLmpzIl0sIm5hbWVzIjpbInJlcXVpcmUiLCJzY2FsYXIiLCJzdHJ1Y3QiLCJhcnJheSIsImpvaW4iLCJqb2luQXJyYXkiLCJOb25lIiwiQ3VycmVuY3lDb2xsZWN0aW9uIiwiR3JhbXMiLCJJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciIsInVzZV9zcmNfYml0cyIsIkludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGUiLCJ3b3JrY2hhaW5faWQiLCJhZGRyX3BmeCIsIkludGVybWVkaWF0ZUFkZHJlc3NFeHQiLCJJbnRlcm1lZGlhdGVBZGRyZXNzIiwiUmVndWxhciIsIlNpbXBsZSIsIkV4dCIsIkludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlciIsIl9fcmVzb2x2ZVR5cGUiLCJvYmoiLCJjb250ZXh0IiwiaW5mbyIsIkV4dEJsa1JlZiIsImVuZF9sdCIsInNlcV9ubyIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsIlRpY2tUb2NrIiwidGljayIsInRvY2siLCJTdG9yYWdlVXNlZFNob3J0IiwiY2VsbHMiLCJiaXRzIiwiU3BsaXRNZXJnZUluZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsIk1lc3NhZ2VIZWFkZXJJbnRNc2dJbmZvIiwiaWhyX2Rpc2FibGVkIiwiYm91bmNlIiwiYm91bmNlZCIsInNyYyIsImRzdCIsInZhbHVlIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsIk1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8iLCJpbXBvcnRfZmVlIiwiTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyIiwiSW50TXNnSW5mbyIsIkV4dEluTXNnSW5mbyIsIkV4dE91dE1zZ0luZm8iLCJNZXNzYWdlSGVhZGVyUmVzb2x2ZXIiLCJNZXNzYWdlSW5pdCIsInNwbGl0X2RlcHRoIiwic3BlY2lhbCIsImNvZGUiLCJkYXRhIiwibGlicmFyeSIsIk1lc3NhZ2UiLCJpZCIsInRyYW5zYWN0aW9uX2lkIiwiYmxvY2tfaWQiLCJoZWFkZXIiLCJpbml0IiwiYm9keSIsInN0YXR1cyIsIk1zZ0VudmVsb3BlIiwibXNnIiwibmV4dF9hZGRyIiwiY3VyX2FkZHIiLCJmd2RfZmVlX3JlbWFpbmluZyIsIkluTXNnRXh0ZXJuYWwiLCJ0cmFuc2FjdGlvbiIsIkluTXNnSUhSIiwicHJvb2ZfY3JlYXRlZCIsIkluTXNnSW1tZWRpYXRlbGx5IiwiaW5fbXNnIiwiSW5Nc2dGaW5hbCIsIkluTXNnVHJhbnNpdCIsIm91dF9tc2ciLCJ0cmFuc2l0X2ZlZSIsIkluTXNnRGlzY2FyZGVkRmluYWwiLCJJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQiLCJwcm9vZl9kZWxpdmVyZWQiLCJJbk1zZyIsIkV4dGVybmFsIiwiSUhSIiwiSW1tZWRpYXRlbGx5IiwiRmluYWwiLCJUcmFuc2l0IiwiRGlzY2FyZGVkRmluYWwiLCJEaXNjYXJkZWRUcmFuc2l0IiwiSW5Nc2dSZXNvbHZlciIsIk91dE1zZ0V4dGVybmFsIiwiT3V0TXNnSW1tZWRpYXRlbHkiLCJyZWltcG9ydCIsIk91dE1zZ091dE1zZ05ldyIsIk91dE1zZ1RyYW5zaXQiLCJpbXBvcnRlZCIsIk91dE1zZ0RlcXVldWUiLCJpbXBvcnRfYmxvY2tfbHQiLCJPdXRNc2dUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2ciLCJJbW1lZGlhdGVseSIsIk91dE1zZ05ldyIsIkRlcXVldWUiLCJUcmFuc2l0UmVxdWlyZWQiLCJPdXRNc2dSZXNvbHZlciIsIkJsb2NrSW5mb1ByZXZSZWZQcmV2IiwiQmxvY2tJbmZvUHJldlJlZiIsInByZXYiLCJCbG9ja0luZm9TaGFyZCIsInNoYXJkX3BmeF9iaXRzIiwic2hhcmRfcHJlZml4IiwiQmxvY2tJbmZvTWFzdGVyUmVmIiwibWFzdGVyIiwiQmxvY2tJbmZvUHJldlZlcnRSZWYiLCJwcmV2X2FsdCIsIkJsb2NrSW5mbyIsIndhbnRfc3BsaXQiLCJhZnRlcl9tZXJnZSIsImdlbl91dGltZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsImZsYWdzIiwicHJldl9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJiZWZvcmVfc3BsaXQiLCJhZnRlcl9zcGxpdCIsIndhbnRfbWVyZ2UiLCJ2ZXJ0X3NlcV9ubyIsInN0YXJ0X2x0Iiwic2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfdmVydF9yZWYiLCJCbG9ja1ZhbHVlRmxvdyIsInRvX25leHRfYmxrIiwiZXhwb3J0ZWQiLCJmZWVzX2NvbGxlY3RlZCIsImNyZWF0ZWQiLCJmcm9tX3ByZXZfYmxrIiwibWludGVkIiwiZmVlc19pbXBvcnRlZCIsIkJsb2NrRXh0cmFBY2NvdW50QmxvY2tzU3RhdGVVcGRhdGUiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiU3RyaW5nQXJyYXkiLCJTdHJpbmciLCJCbG9ja0V4dHJhQWNjb3VudEJsb2NrcyIsImFjY291bnRfYWRkciIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwiSW5Nc2dBcnJheSIsIk91dE1zZ0FycmF5IiwiQmxvY2tFeHRyYUFjY291bnRCbG9ja3NBcnJheSIsIkJsb2NrRXh0cmEiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJCbG9ja1N0YXRlVXBkYXRlIiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwiQmxvY2siLCJnbG9iYWxfaWQiLCJ2YWx1ZV9mbG93IiwiZXh0cmEiLCJBY2NvdW50U3RvcmFnZVN0YXQiLCJsYXN0X3BhaWQiLCJkdWVfcGF5bWVudCIsIkFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlIiwiQWNjb3VudFN0b3JhZ2VTdGF0ZSIsIkFjY291bnRVbmluaXQiLCJBY2NvdW50QWN0aXZlIiwiQWNjb3VudEZyb3plbiIsIkFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlciIsIkFjY291bnRTdG9yYWdlIiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJzdGF0ZSIsIkFjY291bnQiLCJfa2V5Iiwic3RvcmFnZV9zdGF0Iiwic3RvcmFnZSIsImFkZHIiLCJUcmFuc2FjdGlvblN0YXRlVXBkYXRlIiwiVHJTdG9yYWdlUGhhc2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJUckNyZWRpdFBoYXNlIiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0IiwiVHJDb21wdXRlUGhhc2VTa2lwcGVkIiwicmVhc29uIiwiVHJDb21wdXRlUGhhc2VWbSIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJUckNvbXB1dGVQaGFzZSIsIlNraXBwZWQiLCJWbSIsIlRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIiLCJUckFjdGlvblBoYXNlIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RfbXNnX3NpemUiLCJUckJvdW5jZVBoYXNlTm9mdW5kcyIsIm1zZ19zaXplIiwicmVxX2Z3ZF9mZWVzIiwiVHJCb3VuY2VQaGFzZU9rIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsIlRyQm91bmNlUGhhc2UiLCJOZWdmdW5kcyIsIk5vZnVuZHMiLCJPayIsIlRyQm91bmNlUGhhc2VSZXNvbHZlciIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeSIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2VfcGgiLCJjcmVkaXRfcGgiLCJjb21wdXRlX3BoIiwiYWN0aW9uIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25UaWNrVG9jayIsInR0IiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSIsInNwbGl0X2luZm8iLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUiLCJUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsIiwiVHJhbnNhY3Rpb25EZXNjcmlwdGlvbiIsIk9yZGluYXJ5IiwiU3RvcmFnZSIsIlNwbGl0UHJlcGFyZSIsIlNwbGl0SW5zdGFsbCIsIk1lcmdlUHJlcGFyZSIsIk1lcmdlSW5zdGFsbCIsIlRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciIsIk1lc3NhZ2VBcnJheSIsIlRyYW5zYWN0aW9uIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJkZXNjcmlwdGlvbiIsInJvb3RfY2VsbCIsImNyZWF0ZVJlc29sdmVycyIsImRiIiwicGFyZW50IiwiZmV0Y2hEb2NCeUtleSIsIm1lc3NhZ2VzIiwiZmV0Y2hEb2NzQnlLZXlzIiwiUXVlcnkiLCJjb2xsZWN0aW9uUXVlcnkiLCJibG9ja3MiLCJhY2NvdW50cyIsInNlbGVjdCIsInNlbGVjdFF1ZXJ5IiwiU3Vic2NyaXB0aW9uIiwiY29sbGVjdGlvblN1YnNjcmlwdGlvbiIsIm1vZHVsZSIsImV4cG9ydHMiXSwibWFwcGluZ3MiOiI7O2VBQW1EQSxPQUFPLENBQUMsbUJBQUQsQztJQUFsREMsTSxZQUFBQSxNO0lBQVFDLE0sWUFBQUEsTTtJQUFRQyxLLFlBQUFBLEs7SUFBT0MsSSxZQUFBQSxJO0lBQU1DLFMsWUFBQUEsUzs7QUFDckMsSUFBTUMsSUFBSSxHQUFHSixNQUFNLENBQUM7QUFDaEJJLEVBQUFBLElBQUksRUFBRUw7QUFEVSxDQUFELENBQW5CO0FBSUEsSUFBTU0sa0JBQWtCLEdBQUdMLE1BQU0sQ0FBQztBQUM5Qk0sRUFBQUEsS0FBSyxFQUFFUDtBQUR1QixDQUFELENBQWpDO0FBSUEsSUFBTVEsMEJBQTBCLEdBQUdQLE1BQU0sQ0FBQztBQUN0Q1EsRUFBQUEsWUFBWSxFQUFFVDtBQUR3QixDQUFELENBQXpDO0FBSUEsSUFBTVUseUJBQXlCLEdBQUdULE1BQU0sQ0FBQztBQUNyQ1UsRUFBQUEsWUFBWSxFQUFFWCxNQUR1QjtBQUVyQ1ksRUFBQUEsUUFBUSxFQUFFWjtBQUYyQixDQUFELENBQXhDO0FBS0EsSUFBTWEsc0JBQXNCLEdBQUdaLE1BQU0sQ0FBQztBQUNsQ1UsRUFBQUEsWUFBWSxFQUFFWCxNQURvQjtBQUVsQ1ksRUFBQUEsUUFBUSxFQUFFWjtBQUZ3QixDQUFELENBQXJDO0FBS0EsSUFBTWMsbUJBQW1CLEdBQUdiLE1BQU0sQ0FBQztBQUMvQmMsRUFBQUEsT0FBTyxFQUFFUCwwQkFEc0I7QUFFL0JRLEVBQUFBLE1BQU0sRUFBRU4seUJBRnVCO0FBRy9CTyxFQUFBQSxHQUFHLEVBQUVKO0FBSDBCLENBQUQsQ0FBbEM7QUFNQSxJQUFNSywyQkFBMkIsR0FBRztBQUNoQ0MsRUFBQUEsYUFEZ0MseUJBQ2xCQyxHQURrQixFQUNiQyxPQURhLEVBQ0pDLElBREksRUFDRTtBQUM5QixRQUFJRixHQUFHLENBQUNMLE9BQVIsRUFBaUI7QUFDYixhQUFPLG1DQUFQO0FBQ0g7O0FBQ0QsUUFBSUssR0FBRyxDQUFDSixNQUFSLEVBQWdCO0FBQ1osYUFBTyxrQ0FBUDtBQUNIOztBQUNELFFBQUlJLEdBQUcsQ0FBQ0gsR0FBUixFQUFhO0FBQ1QsYUFBTywrQkFBUDtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIO0FBWitCLENBQXBDO0FBZUEsSUFBTU0sU0FBUyxHQUFHdEIsTUFBTSxDQUFDO0FBQ3JCdUIsRUFBQUEsTUFBTSxFQUFFeEIsTUFEYTtBQUVyQnlCLEVBQUFBLE1BQU0sRUFBRXpCLE1BRmE7QUFHckIwQixFQUFBQSxTQUFTLEVBQUUxQixNQUhVO0FBSXJCMkIsRUFBQUEsU0FBUyxFQUFFM0I7QUFKVSxDQUFELENBQXhCO0FBT0EsSUFBTTRCLFFBQVEsR0FBRzNCLE1BQU0sQ0FBQztBQUNwQjRCLEVBQUFBLElBQUksRUFBRTdCLE1BRGM7QUFFcEI4QixFQUFBQSxJQUFJLEVBQUU5QjtBQUZjLENBQUQsQ0FBdkI7QUFLQSxJQUFNK0IsZ0JBQWdCLEdBQUc5QixNQUFNLENBQUM7QUFDNUIrQixFQUFBQSxLQUFLLEVBQUVoQyxNQURxQjtBQUU1QmlDLEVBQUFBLElBQUksRUFBRWpDO0FBRnNCLENBQUQsQ0FBL0I7QUFLQSxJQUFNa0MsY0FBYyxHQUFHakMsTUFBTSxDQUFDO0FBQzFCa0MsRUFBQUEsaUJBQWlCLEVBQUVuQyxNQURPO0FBRTFCb0MsRUFBQUEsZUFBZSxFQUFFcEMsTUFGUztBQUcxQnFDLEVBQUFBLFNBQVMsRUFBRXJDLE1BSGU7QUFJMUJzQyxFQUFBQSxZQUFZLEVBQUV0QztBQUpZLENBQUQsQ0FBN0I7QUFPQSxJQUFNdUMsdUJBQXVCLEdBQUd0QyxNQUFNLENBQUM7QUFDbkN1QyxFQUFBQSxZQUFZLEVBQUV4QyxNQURxQjtBQUVuQ3lDLEVBQUFBLE1BQU0sRUFBRXpDLE1BRjJCO0FBR25DMEMsRUFBQUEsT0FBTyxFQUFFMUMsTUFIMEI7QUFJbkMyQyxFQUFBQSxHQUFHLEVBQUUzQyxNQUo4QjtBQUtuQzRDLEVBQUFBLEdBQUcsRUFBRTVDLE1BTDhCO0FBTW5DNkMsRUFBQUEsS0FBSyxFQUFFdkMsa0JBTjRCO0FBT25Dd0MsRUFBQUEsT0FBTyxFQUFFOUMsTUFQMEI7QUFRbkMrQyxFQUFBQSxPQUFPLEVBQUUvQyxNQVIwQjtBQVNuQ2dELEVBQUFBLFVBQVUsRUFBRWhELE1BVHVCO0FBVW5DaUQsRUFBQUEsVUFBVSxFQUFFakQ7QUFWdUIsQ0FBRCxDQUF0QztBQWFBLElBQU1rRCx5QkFBeUIsR0FBR2pELE1BQU0sQ0FBQztBQUNyQzBDLEVBQUFBLEdBQUcsRUFBRTNDLE1BRGdDO0FBRXJDNEMsRUFBQUEsR0FBRyxFQUFFNUMsTUFGZ0M7QUFHckNtRCxFQUFBQSxVQUFVLEVBQUVuRDtBQUh5QixDQUFELENBQXhDO0FBTUEsSUFBTW9ELDBCQUEwQixHQUFHbkQsTUFBTSxDQUFDO0FBQ3RDMEMsRUFBQUEsR0FBRyxFQUFFM0MsTUFEaUM7QUFFdEM0QyxFQUFBQSxHQUFHLEVBQUU1QyxNQUZpQztBQUd0Q2dELEVBQUFBLFVBQVUsRUFBRWhELE1BSDBCO0FBSXRDaUQsRUFBQUEsVUFBVSxFQUFFakQ7QUFKMEIsQ0FBRCxDQUF6QztBQU9BLElBQU1xRCxhQUFhLEdBQUdwRCxNQUFNLENBQUM7QUFDekJxRCxFQUFBQSxVQUFVLEVBQUVmLHVCQURhO0FBRXpCZ0IsRUFBQUEsWUFBWSxFQUFFTCx5QkFGVztBQUd6Qk0sRUFBQUEsYUFBYSxFQUFFSjtBQUhVLENBQUQsQ0FBNUI7QUFNQSxJQUFNSyxxQkFBcUIsR0FBRztBQUMxQnRDLEVBQUFBLGFBRDBCLHlCQUNaQyxHQURZLEVBQ1BDLE9BRE8sRUFDRUMsSUFERixFQUNRO0FBQzlCLFFBQUlGLEdBQUcsQ0FBQ2tDLFVBQVIsRUFBb0I7QUFDaEIsYUFBTyxnQ0FBUDtBQUNIOztBQUNELFFBQUlsQyxHQUFHLENBQUNtQyxZQUFSLEVBQXNCO0FBQ2xCLGFBQU8sa0NBQVA7QUFDSDs7QUFDRCxRQUFJbkMsR0FBRyxDQUFDb0MsYUFBUixFQUF1QjtBQUNuQixhQUFPLG1DQUFQO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7QUFaeUIsQ0FBOUI7QUFlQSxJQUFNRSxXQUFXLEdBQUd6RCxNQUFNLENBQUM7QUFDdkIwRCxFQUFBQSxXQUFXLEVBQUUzRCxNQURVO0FBRXZCNEQsRUFBQUEsT0FBTyxFQUFFaEMsUUFGYztBQUd2QmlDLEVBQUFBLElBQUksRUFBRTdELE1BSGlCO0FBSXZCOEQsRUFBQUEsSUFBSSxFQUFFOUQsTUFKaUI7QUFLdkIrRCxFQUFBQSxPQUFPLEVBQUUvRDtBQUxjLENBQUQsQ0FBMUI7QUFRQSxJQUFNZ0UsT0FBTyxHQUFHL0QsTUFBTSxDQUFDO0FBQ25CZ0UsRUFBQUEsRUFBRSxFQUFFakUsTUFEZTtBQUVuQmtFLEVBQUFBLGNBQWMsRUFBRWxFLE1BRkc7QUFHbkJtRSxFQUFBQSxRQUFRLEVBQUVuRSxNQUhTO0FBSW5Cb0UsRUFBQUEsTUFBTSxFQUFFZixhQUpXO0FBS25CZ0IsRUFBQUEsSUFBSSxFQUFFWCxXQUxhO0FBTW5CWSxFQUFBQSxJQUFJLEVBQUV0RSxNQU5hO0FBT25CdUUsRUFBQUEsTUFBTSxFQUFFdkU7QUFQVyxDQUFELEVBUW5CLElBUm1CLENBQXRCO0FBVUEsSUFBTXdFLFdBQVcsR0FBR3ZFLE1BQU0sQ0FBQztBQUN2QndFLEVBQUFBLEdBQUcsRUFBRXpFLE1BRGtCO0FBRXZCMEUsRUFBQUEsU0FBUyxFQUFFNUQsbUJBRlk7QUFHdkI2RCxFQUFBQSxRQUFRLEVBQUU3RCxtQkFIYTtBQUl2QjhELEVBQUFBLGlCQUFpQixFQUFFdEU7QUFKSSxDQUFELENBQTFCO0FBT0EsSUFBTXVFLGFBQWEsR0FBRzVFLE1BQU0sQ0FBQztBQUN6QndFLEVBQUFBLEdBQUcsRUFBRXpFLE1BRG9CO0FBRXpCOEUsRUFBQUEsV0FBVyxFQUFFOUU7QUFGWSxDQUFELENBQTVCO0FBS0EsSUFBTStFLFFBQVEsR0FBRzlFLE1BQU0sQ0FBQztBQUNwQndFLEVBQUFBLEdBQUcsRUFBRXpFLE1BRGU7QUFFcEI4RSxFQUFBQSxXQUFXLEVBQUU5RSxNQUZPO0FBR3BCOEMsRUFBQUEsT0FBTyxFQUFFOUMsTUFIVztBQUlwQmdGLEVBQUFBLGFBQWEsRUFBRWhGO0FBSkssQ0FBRCxDQUF2QjtBQU9BLElBQU1pRixpQkFBaUIsR0FBR2hGLE1BQU0sQ0FBQztBQUM3QmlGLEVBQUFBLE1BQU0sRUFBRVYsV0FEcUI7QUFFN0J6QixFQUFBQSxPQUFPLEVBQUUvQyxNQUZvQjtBQUc3QjhFLEVBQUFBLFdBQVcsRUFBRTlFO0FBSGdCLENBQUQsQ0FBaEM7QUFNQSxJQUFNbUYsVUFBVSxHQUFHbEYsTUFBTSxDQUFDO0FBQ3RCaUYsRUFBQUEsTUFBTSxFQUFFVixXQURjO0FBRXRCekIsRUFBQUEsT0FBTyxFQUFFL0MsTUFGYTtBQUd0QjhFLEVBQUFBLFdBQVcsRUFBRTlFO0FBSFMsQ0FBRCxDQUF6QjtBQU1BLElBQU1vRixZQUFZLEdBQUduRixNQUFNLENBQUM7QUFDeEJpRixFQUFBQSxNQUFNLEVBQUVWLFdBRGdCO0FBRXhCYSxFQUFBQSxPQUFPLEVBQUViLFdBRmU7QUFHeEJjLEVBQUFBLFdBQVcsRUFBRXRGO0FBSFcsQ0FBRCxDQUEzQjtBQU1BLElBQU11RixtQkFBbUIsR0FBR3RGLE1BQU0sQ0FBQztBQUMvQmlGLEVBQUFBLE1BQU0sRUFBRVYsV0FEdUI7QUFFL0JOLEVBQUFBLGNBQWMsRUFBRWxFLE1BRmU7QUFHL0IrQyxFQUFBQSxPQUFPLEVBQUUvQztBQUhzQixDQUFELENBQWxDO0FBTUEsSUFBTXdGLHFCQUFxQixHQUFHdkYsTUFBTSxDQUFDO0FBQ2pDaUYsRUFBQUEsTUFBTSxFQUFFVixXQUR5QjtBQUVqQ04sRUFBQUEsY0FBYyxFQUFFbEUsTUFGaUI7QUFHakMrQyxFQUFBQSxPQUFPLEVBQUUvQyxNQUh3QjtBQUlqQ3lGLEVBQUFBLGVBQWUsRUFBRXpGO0FBSmdCLENBQUQsQ0FBcEM7QUFPQSxJQUFNMEYsS0FBSyxHQUFHekYsTUFBTSxDQUFDO0FBQ2pCMEYsRUFBQUEsUUFBUSxFQUFFZCxhQURPO0FBRWpCZSxFQUFBQSxHQUFHLEVBQUViLFFBRlk7QUFHakJjLEVBQUFBLFlBQVksRUFBRVosaUJBSEc7QUFJakJhLEVBQUFBLEtBQUssRUFBRVgsVUFKVTtBQUtqQlksRUFBQUEsT0FBTyxFQUFFWCxZQUxRO0FBTWpCWSxFQUFBQSxjQUFjLEVBQUVULG1CQU5DO0FBT2pCVSxFQUFBQSxnQkFBZ0IsRUFBRVQ7QUFQRCxDQUFELENBQXBCO0FBVUEsSUFBTVUsYUFBYSxHQUFHO0FBQ2xCL0UsRUFBQUEsYUFEa0IseUJBQ0pDLEdBREksRUFDQ0MsT0FERCxFQUNVQyxJQURWLEVBQ2dCO0FBQzlCLFFBQUlGLEdBQUcsQ0FBQ3VFLFFBQVIsRUFBa0I7QUFDZCxhQUFPLHNCQUFQO0FBQ0g7O0FBQ0QsUUFBSXZFLEdBQUcsQ0FBQ3dFLEdBQVIsRUFBYTtBQUNULGFBQU8saUJBQVA7QUFDSDs7QUFDRCxRQUFJeEUsR0FBRyxDQUFDeUUsWUFBUixFQUFzQjtBQUNsQixhQUFPLDBCQUFQO0FBQ0g7O0FBQ0QsUUFBSXpFLEdBQUcsQ0FBQzBFLEtBQVIsRUFBZTtBQUNYLGFBQU8sbUJBQVA7QUFDSDs7QUFDRCxRQUFJMUUsR0FBRyxDQUFDMkUsT0FBUixFQUFpQjtBQUNiLGFBQU8scUJBQVA7QUFDSDs7QUFDRCxRQUFJM0UsR0FBRyxDQUFDNEUsY0FBUixFQUF3QjtBQUNwQixhQUFPLDRCQUFQO0FBQ0g7O0FBQ0QsUUFBSTVFLEdBQUcsQ0FBQzZFLGdCQUFSLEVBQTBCO0FBQ3RCLGFBQU8sOEJBQVA7QUFDSDs7QUFDRCxXQUFPLElBQVA7QUFDSDtBQXhCaUIsQ0FBdEI7QUEyQkEsSUFBTUUsY0FBYyxHQUFHbEcsTUFBTSxDQUFDO0FBQzFCd0UsRUFBQUEsR0FBRyxFQUFFekUsTUFEcUI7QUFFMUI4RSxFQUFBQSxXQUFXLEVBQUU5RTtBQUZhLENBQUQsQ0FBN0I7QUFLQSxJQUFNb0csaUJBQWlCLEdBQUduRyxNQUFNLENBQUM7QUFDN0JvRixFQUFBQSxPQUFPLEVBQUViLFdBRG9CO0FBRTdCTSxFQUFBQSxXQUFXLEVBQUU5RSxNQUZnQjtBQUc3QnFHLEVBQUFBLFFBQVEsRUFBRVg7QUFIbUIsQ0FBRCxDQUFoQztBQU1BLElBQU1ZLGVBQWUsR0FBR3JHLE1BQU0sQ0FBQztBQUMzQm9GLEVBQUFBLE9BQU8sRUFBRWIsV0FEa0I7QUFFM0JNLEVBQUFBLFdBQVcsRUFBRTlFO0FBRmMsQ0FBRCxDQUE5QjtBQUtBLElBQU11RyxhQUFhLEdBQUd0RyxNQUFNLENBQUM7QUFDekJvRixFQUFBQSxPQUFPLEVBQUViLFdBRGdCO0FBRXpCZ0MsRUFBQUEsUUFBUSxFQUFFZDtBQUZlLENBQUQsQ0FBNUI7QUFLQSxJQUFNZSxhQUFhLEdBQUd4RyxNQUFNLENBQUM7QUFDekJvRixFQUFBQSxPQUFPLEVBQUViLFdBRGdCO0FBRXpCa0MsRUFBQUEsZUFBZSxFQUFFMUc7QUFGUSxDQUFELENBQTVCO0FBS0EsSUFBTTJHLHFCQUFxQixHQUFHMUcsTUFBTSxDQUFDO0FBQ2pDb0YsRUFBQUEsT0FBTyxFQUFFYixXQUR3QjtBQUVqQ2dDLEVBQUFBLFFBQVEsRUFBRWQ7QUFGdUIsQ0FBRCxDQUFwQztBQUtBLElBQU1rQixNQUFNLEdBQUczRyxNQUFNLENBQUM7QUFDbEJJLEVBQUFBLElBQUksRUFBRUEsSUFEWTtBQUVsQnNGLEVBQUFBLFFBQVEsRUFBRVEsY0FGUTtBQUdsQlUsRUFBQUEsV0FBVyxFQUFFVCxpQkFISztBQUlsQlUsRUFBQUEsU0FBUyxFQUFFUixlQUpPO0FBS2xCUCxFQUFBQSxPQUFPLEVBQUVRLGFBTFM7QUFNbEJRLEVBQUFBLE9BQU8sRUFBRU4sYUFOUztBQU9sQk8sRUFBQUEsZUFBZSxFQUFFTDtBQVBDLENBQUQsQ0FBckI7QUFVQSxJQUFNTSxjQUFjLEdBQUc7QUFDbkI5RixFQUFBQSxhQURtQix5QkFDTEMsR0FESyxFQUNBQyxPQURBLEVBQ1NDLElBRFQsRUFDZTtBQUM5QixRQUFJRixHQUFHLENBQUNmLElBQVIsRUFBYztBQUNWLGFBQU8sbUJBQVA7QUFDSDs7QUFDRCxRQUFJZSxHQUFHLENBQUN1RSxRQUFSLEVBQWtCO0FBQ2QsYUFBTyx1QkFBUDtBQUNIOztBQUNELFFBQUl2RSxHQUFHLENBQUN5RixXQUFSLEVBQXFCO0FBQ2pCLGFBQU8sMEJBQVA7QUFDSDs7QUFDRCxRQUFJekYsR0FBRyxDQUFDMEYsU0FBUixFQUFtQjtBQUNmLGFBQU8sd0JBQVA7QUFDSDs7QUFDRCxRQUFJMUYsR0FBRyxDQUFDMkUsT0FBUixFQUFpQjtBQUNiLGFBQU8sc0JBQVA7QUFDSDs7QUFDRCxRQUFJM0UsR0FBRyxDQUFDMkYsT0FBUixFQUFpQjtBQUNiLGFBQU8sc0JBQVA7QUFDSDs7QUFDRCxRQUFJM0YsR0FBRyxDQUFDNEYsZUFBUixFQUF5QjtBQUNyQixhQUFPLDhCQUFQO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7QUF4QmtCLENBQXZCO0FBMkJBLElBQU1FLG9CQUFvQixHQUFHakgsTUFBTSxDQUFDO0FBQ2hDd0IsRUFBQUEsTUFBTSxFQUFFekIsTUFEd0I7QUFFaEMyQixFQUFBQSxTQUFTLEVBQUUzQixNQUZxQjtBQUdoQzBCLEVBQUFBLFNBQVMsRUFBRTFCLE1BSHFCO0FBSWhDd0IsRUFBQUEsTUFBTSxFQUFFeEI7QUFKd0IsQ0FBRCxDQUFuQztBQU9BLElBQU1tSCxnQkFBZ0IsR0FBR2xILE1BQU0sQ0FBQztBQUM1Qm1ILEVBQUFBLElBQUksRUFBRUY7QUFEc0IsQ0FBRCxDQUEvQjtBQUlBLElBQU1HLGNBQWMsR0FBR3BILE1BQU0sQ0FBQztBQUMxQnFILEVBQUFBLGNBQWMsRUFBRXRILE1BRFU7QUFFMUJXLEVBQUFBLFlBQVksRUFBRVgsTUFGWTtBQUcxQnVILEVBQUFBLFlBQVksRUFBRXZIO0FBSFksQ0FBRCxDQUE3QjtBQU1BLElBQU13SCxrQkFBa0IsR0FBR3ZILE1BQU0sQ0FBQztBQUM5QndILEVBQUFBLE1BQU0sRUFBRWxHO0FBRHNCLENBQUQsQ0FBakM7QUFJQSxJQUFNbUcsb0JBQW9CLEdBQUd6SCxNQUFNLENBQUM7QUFDaENtSCxFQUFBQSxJQUFJLEVBQUU3RixTQUQwQjtBQUVoQ29HLEVBQUFBLFFBQVEsRUFBRXBHO0FBRnNCLENBQUQsQ0FBbkM7QUFLQSxJQUFNcUcsU0FBUyxHQUFHM0gsTUFBTSxDQUFDO0FBQ3JCNEgsRUFBQUEsVUFBVSxFQUFFN0gsTUFEUztBQUVyQnlCLEVBQUFBLE1BQU0sRUFBRXpCLE1BRmE7QUFHckI4SCxFQUFBQSxXQUFXLEVBQUU5SCxNQUhRO0FBSXJCK0gsRUFBQUEsU0FBUyxFQUFFL0gsTUFKVTtBQUtyQmdJLEVBQUFBLGtCQUFrQixFQUFFaEksTUFMQztBQU1yQmlJLEVBQUFBLEtBQUssRUFBRWpJLE1BTmM7QUFPckJrSSxFQUFBQSxRQUFRLEVBQUVmLGdCQVBXO0FBUXJCZ0IsRUFBQUEsT0FBTyxFQUFFbkksTUFSWTtBQVNyQm9JLEVBQUFBLDZCQUE2QixFQUFFcEksTUFUVjtBQVVyQnFJLEVBQUFBLFlBQVksRUFBRXJJLE1BVk87QUFXckJzSSxFQUFBQSxXQUFXLEVBQUV0SSxNQVhRO0FBWXJCdUksRUFBQUEsVUFBVSxFQUFFdkksTUFaUztBQWFyQndJLEVBQUFBLFdBQVcsRUFBRXhJLE1BYlE7QUFjckJ5SSxFQUFBQSxRQUFRLEVBQUV6SSxNQWRXO0FBZXJCd0IsRUFBQUEsTUFBTSxFQUFFeEIsTUFmYTtBQWdCckIwSSxFQUFBQSxLQUFLLEVBQUVyQixjQWhCYztBQWlCckJzQixFQUFBQSxnQkFBZ0IsRUFBRTNJLE1BakJHO0FBa0JyQjRJLEVBQUFBLFVBQVUsRUFBRXBCLGtCQWxCUztBQW1CckJxQixFQUFBQSxhQUFhLEVBQUVuQjtBQW5CTSxDQUFELENBQXhCO0FBc0JBLElBQU1vQixjQUFjLEdBQUc3SSxNQUFNLENBQUM7QUFDMUI4SSxFQUFBQSxXQUFXLEVBQUV6SSxrQkFEYTtBQUUxQjBJLEVBQUFBLFFBQVEsRUFBRTFJLGtCQUZnQjtBQUcxQjJJLEVBQUFBLGNBQWMsRUFBRTNJLGtCQUhVO0FBSTFCNEksRUFBQUEsT0FBTyxFQUFFNUksa0JBSmlCO0FBSzFCa0csRUFBQUEsUUFBUSxFQUFFbEcsa0JBTGdCO0FBTTFCNkksRUFBQUEsYUFBYSxFQUFFN0ksa0JBTlc7QUFPMUI4SSxFQUFBQSxNQUFNLEVBQUU5SSxrQkFQa0I7QUFRMUIrSSxFQUFBQSxhQUFhLEVBQUUvSTtBQVJXLENBQUQsQ0FBN0I7QUFXQSxJQUFNZ0osa0NBQWtDLEdBQUdySixNQUFNLENBQUM7QUFDOUNzSixFQUFBQSxRQUFRLEVBQUV2SixNQURvQztBQUU5Q3dKLEVBQUFBLFFBQVEsRUFBRXhKO0FBRm9DLENBQUQsQ0FBakQ7QUFLQSxJQUFNeUosV0FBVyxHQUFHdkosS0FBSyxDQUFDd0osTUFBRCxDQUF6QjtBQUNBLElBQU1DLHVCQUF1QixHQUFHMUosTUFBTSxDQUFDO0FBQ25DMkosRUFBQUEsWUFBWSxFQUFFNUosTUFEcUI7QUFFbkM2SixFQUFBQSxZQUFZLEVBQUVKLFdBRnFCO0FBR25DSyxFQUFBQSxZQUFZLEVBQUVSLGtDQUhxQjtBQUluQ1MsRUFBQUEsUUFBUSxFQUFFL0o7QUFKeUIsQ0FBRCxDQUF0QztBQU9BLElBQU1nSyxVQUFVLEdBQUc5SixLQUFLLENBQUN3RixLQUFELENBQXhCO0FBQ0EsSUFBTXVFLFdBQVcsR0FBRy9KLEtBQUssQ0FBQzBHLE1BQUQsQ0FBekI7QUFDQSxJQUFNc0QsNEJBQTRCLEdBQUdoSyxLQUFLLENBQUN5Six1QkFBRCxDQUExQztBQUNBLElBQU1RLFVBQVUsR0FBR2xLLE1BQU0sQ0FBQztBQUN0Qm1LLEVBQUFBLFlBQVksRUFBRUosVUFEUTtBQUV0QkssRUFBQUEsU0FBUyxFQUFFckssTUFGVztBQUd0QnNLLEVBQUFBLGFBQWEsRUFBRUwsV0FITztBQUl0Qk0sRUFBQUEsY0FBYyxFQUFFTDtBQUpNLENBQUQsQ0FBekI7QUFPQSxJQUFNTSxnQkFBZ0IsR0FBR3ZLLE1BQU0sQ0FBQztBQUM1QixTQUFLRCxNQUR1QjtBQUU1QndKLEVBQUFBLFFBQVEsRUFBRXhKLE1BRmtCO0FBRzVCeUssRUFBQUEsU0FBUyxFQUFFekssTUFIaUI7QUFJNUIwSyxFQUFBQSxHQUFHLEVBQUUxSyxNQUp1QjtBQUs1QnVKLEVBQUFBLFFBQVEsRUFBRXZKLE1BTGtCO0FBTTVCMkssRUFBQUEsU0FBUyxFQUFFM0s7QUFOaUIsQ0FBRCxDQUEvQjtBQVNBLElBQU00SyxLQUFLLEdBQUczSyxNQUFNLENBQUM7QUFDakJnRSxFQUFBQSxFQUFFLEVBQUVqRSxNQURhO0FBRWpCdUUsRUFBQUEsTUFBTSxFQUFFdkUsTUFGUztBQUdqQjZLLEVBQUFBLFNBQVMsRUFBRTdLLE1BSE07QUFJakJzQixFQUFBQSxJQUFJLEVBQUVzRyxTQUpXO0FBS2pCa0QsRUFBQUEsVUFBVSxFQUFFaEMsY0FMSztBQU1qQmlDLEVBQUFBLEtBQUssRUFBRVosVUFOVTtBQU9qQkwsRUFBQUEsWUFBWSxFQUFFVTtBQVBHLENBQUQsRUFRakIsSUFSaUIsQ0FBcEI7QUFVQSxJQUFNUSxrQkFBa0IsR0FBRy9LLE1BQU0sQ0FBQztBQUM5QmdMLEVBQUFBLFNBQVMsRUFBRWpMLE1BRG1CO0FBRTlCa0wsRUFBQUEsV0FBVyxFQUFFbEw7QUFGaUIsQ0FBRCxDQUFqQztBQUtBLElBQU1tTCxnQ0FBZ0MsR0FBR2xMLE1BQU0sQ0FBQztBQUM1QzBELEVBQUFBLFdBQVcsRUFBRTNELE1BRCtCO0FBRTVDNEQsRUFBQUEsT0FBTyxFQUFFaEMsUUFGbUM7QUFHNUNpQyxFQUFBQSxJQUFJLEVBQUU3RCxNQUhzQztBQUk1QzhELEVBQUFBLElBQUksRUFBRTlELE1BSnNDO0FBSzVDK0QsRUFBQUEsT0FBTyxFQUFFL0Q7QUFMbUMsQ0FBRCxDQUEvQztBQVFBLElBQU1vTCxtQkFBbUIsR0FBR25MLE1BQU0sQ0FBQztBQUMvQm9MLEVBQUFBLGFBQWEsRUFBRWhMLElBRGdCO0FBRS9CaUwsRUFBQUEsYUFBYSxFQUFFSCxnQ0FGZ0I7QUFHL0JJLEVBQUFBLGFBQWEsRUFBRWxMO0FBSGdCLENBQUQsQ0FBbEM7QUFNQSxJQUFNbUwsMkJBQTJCLEdBQUc7QUFDaENySyxFQUFBQSxhQURnQyx5QkFDbEJDLEdBRGtCLEVBQ2JDLE9BRGEsRUFDSkMsSUFESSxFQUNFO0FBQzlCLFFBQUlGLEdBQUcsQ0FBQ2lLLGFBQVIsRUFBdUI7QUFDbkIsYUFBTyx5Q0FBUDtBQUNIOztBQUNELFFBQUlqSyxHQUFHLENBQUNrSyxhQUFSLEVBQXVCO0FBQ25CLGFBQU8seUNBQVA7QUFDSDs7QUFDRCxRQUFJbEssR0FBRyxDQUFDbUssYUFBUixFQUF1QjtBQUNuQixhQUFPLHlDQUFQO0FBQ0g7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7QUFaK0IsQ0FBcEM7QUFlQSxJQUFNRSxjQUFjLEdBQUd4TCxNQUFNLENBQUM7QUFDMUJ5TCxFQUFBQSxhQUFhLEVBQUUxTCxNQURXO0FBRTFCMkwsRUFBQUEsT0FBTyxFQUFFckwsa0JBRmlCO0FBRzFCc0wsRUFBQUEsS0FBSyxFQUFFUjtBQUhtQixDQUFELENBQTdCO0FBTUEsSUFBTVMsT0FBTyxHQUFHNUwsTUFBTSxDQUFDO0FBQ25CZ0UsRUFBQUEsRUFBRSxFQUFFakUsTUFEZTtBQUVuQjhMLEVBQUFBLElBQUksRUFBRTlMLE1BRmE7QUFHbkIrTCxFQUFBQSxZQUFZLEVBQUVmLGtCQUhLO0FBSW5CZ0IsRUFBQUEsT0FBTyxFQUFFUCxjQUpVO0FBS25CUSxFQUFBQSxJQUFJLEVBQUVqTTtBQUxhLENBQUQsRUFNbkIsSUFObUIsQ0FBdEI7QUFRQSxJQUFNa00sc0JBQXNCLEdBQUdqTSxNQUFNLENBQUM7QUFDbENzSixFQUFBQSxRQUFRLEVBQUV2SixNQUR3QjtBQUVsQ3dKLEVBQUFBLFFBQVEsRUFBRXhKO0FBRndCLENBQUQsQ0FBckM7QUFLQSxJQUFNbU0sY0FBYyxHQUFHbE0sTUFBTSxDQUFDO0FBQzFCbU0sRUFBQUEsc0JBQXNCLEVBQUVwTSxNQURFO0FBRTFCcU0sRUFBQUEsZ0JBQWdCLEVBQUVyTSxNQUZRO0FBRzFCc00sRUFBQUEsYUFBYSxFQUFFdE07QUFIVyxDQUFELENBQTdCO0FBTUEsSUFBTXVNLGFBQWEsR0FBR3RNLE1BQU0sQ0FBQztBQUN6QnVNLEVBQUFBLGtCQUFrQixFQUFFeE0sTUFESztBQUV6QnlNLEVBQUFBLE1BQU0sRUFBRW5NO0FBRmlCLENBQUQsQ0FBNUI7QUFLQSxJQUFNb00scUJBQXFCLEdBQUd6TSxNQUFNLENBQUM7QUFDakMwTSxFQUFBQSxNQUFNLEVBQUUzTTtBQUR5QixDQUFELENBQXBDO0FBSUEsSUFBTTRNLGdCQUFnQixHQUFHM00sTUFBTSxDQUFDO0FBQzVCNE0sRUFBQUEsT0FBTyxFQUFFN00sTUFEbUI7QUFFNUI4TSxFQUFBQSxjQUFjLEVBQUU5TSxNQUZZO0FBRzVCK00sRUFBQUEsaUJBQWlCLEVBQUUvTSxNQUhTO0FBSTVCZ04sRUFBQUEsUUFBUSxFQUFFaE4sTUFKa0I7QUFLNUJpTixFQUFBQSxRQUFRLEVBQUVqTixNQUxrQjtBQU01QmtOLEVBQUFBLFNBQVMsRUFBRWxOLE1BTmlCO0FBTzVCbU4sRUFBQUEsVUFBVSxFQUFFbk4sTUFQZ0I7QUFRNUJvTixFQUFBQSxJQUFJLEVBQUVwTixNQVJzQjtBQVM1QnFOLEVBQUFBLFNBQVMsRUFBRXJOLE1BVGlCO0FBVTVCc04sRUFBQUEsUUFBUSxFQUFFdE4sTUFWa0I7QUFXNUJ1TixFQUFBQSxRQUFRLEVBQUV2TixNQVhrQjtBQVk1QndOLEVBQUFBLGtCQUFrQixFQUFFeE4sTUFaUTtBQWE1QnlOLEVBQUFBLG1CQUFtQixFQUFFek47QUFiTyxDQUFELENBQS9CO0FBZ0JBLElBQU0wTixjQUFjLEdBQUd6TixNQUFNLENBQUM7QUFDMUIwTixFQUFBQSxPQUFPLEVBQUVqQixxQkFEaUI7QUFFMUJrQixFQUFBQSxFQUFFLEVBQUVoQjtBQUZzQixDQUFELENBQTdCO0FBS0EsSUFBTWlCLHNCQUFzQixHQUFHO0FBQzNCMU0sRUFBQUEsYUFEMkIseUJBQ2JDLEdBRGEsRUFDUkMsT0FEUSxFQUNDQyxJQURELEVBQ087QUFDOUIsUUFBSUYsR0FBRyxDQUFDdU0sT0FBUixFQUFpQjtBQUNiLGFBQU8sOEJBQVA7QUFDSDs7QUFDRCxRQUFJdk0sR0FBRyxDQUFDd00sRUFBUixFQUFZO0FBQ1IsYUFBTyx5QkFBUDtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIO0FBVDBCLENBQS9CO0FBWUEsSUFBTUUsYUFBYSxHQUFHN04sTUFBTSxDQUFDO0FBQ3pCNE0sRUFBQUEsT0FBTyxFQUFFN00sTUFEZ0I7QUFFekIrTixFQUFBQSxLQUFLLEVBQUUvTixNQUZrQjtBQUd6QmdPLEVBQUFBLFFBQVEsRUFBRWhPLE1BSGU7QUFJekJzTSxFQUFBQSxhQUFhLEVBQUV0TSxNQUpVO0FBS3pCaU8sRUFBQUEsY0FBYyxFQUFFak8sTUFMUztBQU16QmtPLEVBQUFBLGlCQUFpQixFQUFFbE8sTUFOTTtBQU96Qm1PLEVBQUFBLFdBQVcsRUFBRW5PLE1BUFk7QUFRekJvTyxFQUFBQSxVQUFVLEVBQUVwTyxNQVJhO0FBU3pCcU8sRUFBQUEsV0FBVyxFQUFFck8sTUFUWTtBQVV6QnNPLEVBQUFBLFlBQVksRUFBRXRPLE1BVlc7QUFXekJ1TyxFQUFBQSxlQUFlLEVBQUV2TyxNQVhRO0FBWXpCd08sRUFBQUEsWUFBWSxFQUFFeE8sTUFaVztBQWF6QnlPLEVBQUFBLGdCQUFnQixFQUFFek8sTUFiTztBQWN6QjBPLEVBQUFBLFlBQVksRUFBRTNNO0FBZFcsQ0FBRCxDQUE1QjtBQWlCQSxJQUFNNE0sb0JBQW9CLEdBQUcxTyxNQUFNLENBQUM7QUFDaEMyTyxFQUFBQSxRQUFRLEVBQUU3TSxnQkFEc0I7QUFFaEM4TSxFQUFBQSxZQUFZLEVBQUU3TztBQUZrQixDQUFELENBQW5DO0FBS0EsSUFBTThPLGVBQWUsR0FBRzdPLE1BQU0sQ0FBQztBQUMzQjJPLEVBQUFBLFFBQVEsRUFBRTdNLGdCQURpQjtBQUUzQmdOLEVBQUFBLFFBQVEsRUFBRS9PLE1BRmlCO0FBRzNCZ1AsRUFBQUEsUUFBUSxFQUFFaFA7QUFIaUIsQ0FBRCxDQUE5QjtBQU1BLElBQU1pUCxhQUFhLEdBQUdoUCxNQUFNLENBQUM7QUFDekJpUCxFQUFBQSxRQUFRLEVBQUU3TyxJQURlO0FBRXpCOE8sRUFBQUEsT0FBTyxFQUFFUixvQkFGZ0I7QUFHekJTLEVBQUFBLEVBQUUsRUFBRU47QUFIcUIsQ0FBRCxDQUE1QjtBQU1BLElBQU1PLHFCQUFxQixHQUFHO0FBQzFCbE8sRUFBQUEsYUFEMEIseUJBQ1pDLEdBRFksRUFDUEMsT0FETyxFQUNFQyxJQURGLEVBQ1E7QUFDOUIsUUFBSUYsR0FBRyxDQUFDOE4sUUFBUixFQUFrQjtBQUNkLGFBQU8sOEJBQVA7QUFDSDs7QUFDRCxRQUFJOU4sR0FBRyxDQUFDK04sT0FBUixFQUFpQjtBQUNiLGFBQU8sNkJBQVA7QUFDSDs7QUFDRCxRQUFJL04sR0FBRyxDQUFDZ08sRUFBUixFQUFZO0FBQ1IsYUFBTyx3QkFBUDtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIO0FBWnlCLENBQTlCO0FBZUEsSUFBTUUsOEJBQThCLEdBQUdyUCxNQUFNLENBQUM7QUFDMUNzUCxFQUFBQSxZQUFZLEVBQUV2UCxNQUQ0QjtBQUUxQ3dQLEVBQUFBLFVBQVUsRUFBRXJELGNBRjhCO0FBRzFDc0QsRUFBQUEsU0FBUyxFQUFFbEQsYUFIK0I7QUFJMUNtRCxFQUFBQSxVQUFVLEVBQUVoQyxjQUo4QjtBQUsxQ2lDLEVBQUFBLE1BQU0sRUFBRTdCLGFBTGtDO0FBTTFDOEIsRUFBQUEsT0FBTyxFQUFFNVAsTUFOaUM7QUFPMUN5QyxFQUFBQSxNQUFNLEVBQUV3TSxhQVBrQztBQVExQ1ksRUFBQUEsU0FBUyxFQUFFN1A7QUFSK0IsQ0FBRCxDQUE3QztBQVdBLElBQU04UCw4QkFBOEIsR0FBRzdQLE1BQU0sQ0FBQztBQUMxQzhQLEVBQUFBLEVBQUUsRUFBRS9QLE1BRHNDO0FBRTFDZ00sRUFBQUEsT0FBTyxFQUFFRyxjQUZpQztBQUcxQ3VELEVBQUFBLFVBQVUsRUFBRWhDLGNBSDhCO0FBSTFDaUMsRUFBQUEsTUFBTSxFQUFFN0IsYUFKa0M7QUFLMUM4QixFQUFBQSxPQUFPLEVBQUU1UCxNQUxpQztBQU0xQzZQLEVBQUFBLFNBQVMsRUFBRTdQO0FBTitCLENBQUQsQ0FBN0M7QUFTQSxJQUFNZ1Esa0NBQWtDLEdBQUcvUCxNQUFNLENBQUM7QUFDOUNnUSxFQUFBQSxVQUFVLEVBQUUvTixjQURrQztBQUU5Q3dOLEVBQUFBLFVBQVUsRUFBRWhDLGNBRmtDO0FBRzlDaUMsRUFBQUEsTUFBTSxFQUFFN0IsYUFIc0M7QUFJOUM4QixFQUFBQSxPQUFPLEVBQUU1UCxNQUpxQztBQUs5QzZQLEVBQUFBLFNBQVMsRUFBRTdQO0FBTG1DLENBQUQsQ0FBakQ7QUFRQSxJQUFNa1Esa0NBQWtDLEdBQUdqUSxNQUFNLENBQUM7QUFDOUNnUSxFQUFBQSxVQUFVLEVBQUUvTixjQURrQztBQUU5Q2lPLEVBQUFBLG1CQUFtQixFQUFFblEsTUFGeUI7QUFHOUNvUSxFQUFBQSxTQUFTLEVBQUVwUTtBQUhtQyxDQUFELENBQWpEO0FBTUEsSUFBTXFRLGtDQUFrQyxHQUFHcFEsTUFBTSxDQUFDO0FBQzlDZ1EsRUFBQUEsVUFBVSxFQUFFL04sY0FEa0M7QUFFOUNzTixFQUFBQSxVQUFVLEVBQUVyRCxjQUZrQztBQUc5Q3lELEVBQUFBLE9BQU8sRUFBRTVQO0FBSHFDLENBQUQsQ0FBakQ7QUFNQSxJQUFNc1Esa0NBQWtDLEdBQUdyUSxNQUFNLENBQUM7QUFDOUNnUSxFQUFBQSxVQUFVLEVBQUUvTixjQURrQztBQUU5Q2lPLEVBQUFBLG1CQUFtQixFQUFFblEsTUFGeUI7QUFHOUN5UCxFQUFBQSxTQUFTLEVBQUVsRCxhQUhtQztBQUk5Q21ELEVBQUFBLFVBQVUsRUFBRWhDLGNBSmtDO0FBSzlDaUMsRUFBQUEsTUFBTSxFQUFFN0IsYUFMc0M7QUFNOUM4QixFQUFBQSxPQUFPLEVBQUU1UCxNQU5xQztBQU85QzZQLEVBQUFBLFNBQVMsRUFBRTdQO0FBUG1DLENBQUQsQ0FBakQ7QUFVQSxJQUFNdVEsc0JBQXNCLEdBQUd0USxNQUFNLENBQUM7QUFDbEN1USxFQUFBQSxRQUFRLEVBQUVsQiw4QkFEd0I7QUFFbENtQixFQUFBQSxPQUFPLEVBQUV0RSxjQUZ5QjtBQUdsQ3ZLLEVBQUFBLFFBQVEsRUFBRWtPLDhCQUh3QjtBQUlsQ1ksRUFBQUEsWUFBWSxFQUFFVixrQ0FKb0I7QUFLbENXLEVBQUFBLFlBQVksRUFBRVQsa0NBTG9CO0FBTWxDVSxFQUFBQSxZQUFZLEVBQUVQLGtDQU5vQjtBQU9sQ1EsRUFBQUEsWUFBWSxFQUFFUDtBQVBvQixDQUFELENBQXJDO0FBVUEsSUFBTVEsOEJBQThCLEdBQUc7QUFDbkMzUCxFQUFBQSxhQURtQyx5QkFDckJDLEdBRHFCLEVBQ2hCQyxPQURnQixFQUNQQyxJQURPLEVBQ0Q7QUFDOUIsUUFBSUYsR0FBRyxDQUFDb1AsUUFBUixFQUFrQjtBQUNkLGFBQU8sdUNBQVA7QUFDSDs7QUFDRCxRQUFJcFAsR0FBRyxDQUFDcVAsT0FBUixFQUFpQjtBQUNiLGFBQU8sc0NBQVA7QUFDSDs7QUFDRCxRQUFJclAsR0FBRyxDQUFDUSxRQUFSLEVBQWtCO0FBQ2QsYUFBTyx1Q0FBUDtBQUNIOztBQUNELFFBQUlSLEdBQUcsQ0FBQ3NQLFlBQVIsRUFBc0I7QUFDbEIsYUFBTywyQ0FBUDtBQUNIOztBQUNELFFBQUl0UCxHQUFHLENBQUN1UCxZQUFSLEVBQXNCO0FBQ2xCLGFBQU8sMkNBQVA7QUFDSDs7QUFDRCxRQUFJdlAsR0FBRyxDQUFDd1AsWUFBUixFQUFzQjtBQUNsQixhQUFPLDJDQUFQO0FBQ0g7O0FBQ0QsUUFBSXhQLEdBQUcsQ0FBQ3lQLFlBQVIsRUFBc0I7QUFDbEIsYUFBTywyQ0FBUDtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIO0FBeEJrQyxDQUF2QztBQTJCQSxJQUFNRSxZQUFZLEdBQUc3USxLQUFLLENBQUM4RCxPQUFELENBQTFCO0FBQ0EsSUFBTWdOLFdBQVcsR0FBRy9RLE1BQU0sQ0FBQztBQUN2QmdFLEVBQUFBLEVBQUUsRUFBRWpFLE1BRG1CO0FBRXZCbUUsRUFBQUEsUUFBUSxFQUFFbkUsTUFGYTtBQUd2QnVFLEVBQUFBLE1BQU0sRUFBRXZFLE1BSGU7QUFJdkI0SixFQUFBQSxZQUFZLEVBQUU1SixNQUpTO0FBS3ZCaVIsRUFBQUEsRUFBRSxFQUFFalIsTUFMbUI7QUFNdkIwTCxFQUFBQSxhQUFhLEVBQUUxTCxNQU5RO0FBT3ZCa1IsRUFBQUEsZUFBZSxFQUFFbFIsTUFQTTtBQVF2Qm1SLEVBQUFBLGFBQWEsRUFBRW5SLE1BUlE7QUFTdkJvUixFQUFBQSxHQUFHLEVBQUVwUixNQVRrQjtBQVV2QnFSLEVBQUFBLFVBQVUsRUFBRXJSLE1BVlc7QUFXdkJzUixFQUFBQSxXQUFXLEVBQUV0UixNQVhVO0FBWXZCdVIsRUFBQUEsVUFBVSxFQUFFdlIsTUFaVztBQWF2QmtGLEVBQUFBLE1BQU0sRUFBRWxGLE1BYmU7QUFjdkJ3UixFQUFBQSxVQUFVLEVBQUVyUixJQUFJLENBQUMsUUFBRCxFQUFXLFVBQVgsRUFBdUI2RCxPQUF2QixDQWRPO0FBZXZCeU4sRUFBQUEsUUFBUSxFQUFFaEksV0FmYTtBQWdCdkJpSSxFQUFBQSxZQUFZLEVBQUV0UixTQUFTLENBQUMsVUFBRCxFQUFhLFVBQWIsRUFBeUI0RCxPQUF6QixDQWhCQTtBQWlCdkIyTixFQUFBQSxVQUFVLEVBQUUzUixNQWpCVztBQWtCdkI4SixFQUFBQSxZQUFZLEVBQUVvQyxzQkFsQlM7QUFtQnZCMEYsRUFBQUEsV0FBVyxFQUFFckIsc0JBbkJVO0FBb0J2QnNCLEVBQUFBLFNBQVMsRUFBRTdSO0FBcEJZLENBQUQsRUFxQnZCLElBckJ1QixDQUExQjs7QUF1QkEsU0FBUzhSLGVBQVQsQ0FBeUJDLEVBQXpCLEVBQTZCO0FBQ3pCLFNBQU87QUFDSGpSLElBQUFBLG1CQUFtQixFQUFFSSwyQkFEbEI7QUFFSG1DLElBQUFBLGFBQWEsRUFBRUkscUJBRlo7QUFHSE8sSUFBQUEsT0FBTyxFQUFFO0FBQ0xDLE1BQUFBLEVBREssY0FDRitOLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ2xHLElBQWQ7QUFDSDtBQUhJLEtBSE47QUFRSHBHLElBQUFBLEtBQUssRUFBRVEsYUFSSjtBQVNIVSxJQUFBQSxNQUFNLEVBQUVLLGNBVEw7QUFVSDJELElBQUFBLEtBQUssRUFBRTtBQUNIM0csTUFBQUEsRUFERyxjQUNBK04sTUFEQSxFQUNRO0FBQ1AsZUFBT0EsTUFBTSxDQUFDbEcsSUFBZDtBQUNIO0FBSEUsS0FWSjtBQWVIVixJQUFBQSxtQkFBbUIsRUFBRUksMkJBZmxCO0FBZ0JISyxJQUFBQSxPQUFPLEVBQUU7QUFDTDVILE1BQUFBLEVBREssY0FDRitOLE1BREUsRUFDTTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ2xHLElBQWQ7QUFDSDtBQUhJLEtBaEJOO0FBcUJINEIsSUFBQUEsY0FBYyxFQUFFRyxzQkFyQmI7QUFzQkhvQixJQUFBQSxhQUFhLEVBQUVJLHFCQXRCWjtBQXVCSGtCLElBQUFBLHNCQUFzQixFQUFFTyw4QkF2QnJCO0FBd0JIRSxJQUFBQSxXQUFXLEVBQUU7QUFDVC9NLE1BQUFBLEVBRFMsY0FDTitOLE1BRE0sRUFDRTtBQUNQLGVBQU9BLE1BQU0sQ0FBQ2xHLElBQWQ7QUFDSCxPQUhRO0FBSVQwRixNQUFBQSxVQUpTLHNCQUlFUSxNQUpGLEVBSVU7QUFDZixlQUFPRCxFQUFFLENBQUNFLGFBQUgsQ0FBaUJGLEVBQUUsQ0FBQ0csUUFBcEIsRUFBOEJGLE1BQU0sQ0FBQzlNLE1BQXJDLENBQVA7QUFDSCxPQU5RO0FBT1R3TSxNQUFBQSxZQVBTLHdCQU9JTSxNQVBKLEVBT1k7QUFDakIsZUFBT0QsRUFBRSxDQUFDSSxlQUFILENBQW1CSixFQUFFLENBQUNHLFFBQXRCLEVBQWdDRixNQUFNLENBQUNQLFFBQXZDLENBQVA7QUFDSDtBQVRRLEtBeEJWO0FBbUNIVyxJQUFBQSxLQUFLLEVBQUU7QUFDSEYsTUFBQUEsUUFBUSxFQUFFSCxFQUFFLENBQUNNLGVBQUgsQ0FBbUJOLEVBQUUsQ0FBQ0csUUFBdEIsRUFBZ0NsTyxPQUFoQyxDQURQO0FBRUhzTyxNQUFBQSxNQUFNLEVBQUVQLEVBQUUsQ0FBQ00sZUFBSCxDQUFtQk4sRUFBRSxDQUFDTyxNQUF0QixFQUE4QjFILEtBQTlCLENBRkw7QUFHSDJILE1BQUFBLFFBQVEsRUFBRVIsRUFBRSxDQUFDTSxlQUFILENBQW1CTixFQUFFLENBQUNRLFFBQXRCLEVBQWdDMUcsT0FBaEMsQ0FIUDtBQUlIaEMsTUFBQUEsWUFBWSxFQUFFa0ksRUFBRSxDQUFDTSxlQUFILENBQW1CTixFQUFFLENBQUNsSSxZQUF0QixFQUFvQ21ILFdBQXBDLENBSlg7QUFLSHdCLE1BQUFBLE1BQU0sRUFBRVQsRUFBRSxDQUFDVSxXQUFIO0FBTEwsS0FuQ0o7QUEwQ0hDLElBQUFBLFlBQVksRUFBRTtBQUNWUixNQUFBQSxRQUFRLEVBQUVILEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ0csUUFBN0IsRUFBdUNsTyxPQUF2QyxDQURBO0FBRVZzTyxNQUFBQSxNQUFNLEVBQUVQLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ08sTUFBN0IsRUFBcUMxSCxLQUFyQyxDQUZFO0FBR1YySCxNQUFBQSxRQUFRLEVBQUVSLEVBQUUsQ0FBQ1ksc0JBQUgsQ0FBMEJaLEVBQUUsQ0FBQ1EsUUFBN0IsRUFBdUMxRyxPQUF2QyxDQUhBO0FBSVZoQyxNQUFBQSxZQUFZLEVBQUVrSSxFQUFFLENBQUNZLHNCQUFILENBQTBCWixFQUFFLENBQUNsSSxZQUE3QixFQUEyQ21ILFdBQTNDO0FBSko7QUExQ1gsR0FBUDtBQWlESDs7QUFDRDRCLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNiZixFQUFBQSxlQUFlLEVBQWZBO0FBRGEsQ0FBakIiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCB7IHNjYWxhciwgc3RydWN0LCBhcnJheSwgam9pbiwgam9pbkFycmF5IH0gPSByZXF1aXJlKCcuL2FyYW5nby10eXBlcy5qcycpO1xuY29uc3QgTm9uZSA9IHN0cnVjdCh7XG4gICAgTm9uZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEN1cnJlbmN5Q29sbGVjdGlvbiA9IHN0cnVjdCh7XG4gICAgR3JhbXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhciA9IHN0cnVjdCh7XG4gICAgdXNlX3NyY19iaXRzOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSA9IHN0cnVjdCh7XG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgYWRkcl9wZng6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbnRlcm1lZGlhdGVBZGRyZXNzRXh0ID0gc3RydWN0KHtcbiAgICB3b3JrY2hhaW5faWQ6IHNjYWxhcixcbiAgICBhZGRyX3BmeDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEludGVybWVkaWF0ZUFkZHJlc3MgPSBzdHJ1Y3Qoe1xuICAgIFJlZ3VsYXI6IEludGVybWVkaWF0ZUFkZHJlc3NSZWd1bGFyLFxuICAgIFNpbXBsZTogSW50ZXJtZWRpYXRlQWRkcmVzc1NpbXBsZSxcbiAgICBFeHQ6IEludGVybWVkaWF0ZUFkZHJlc3NFeHQsXG59KTtcblxuY29uc3QgSW50ZXJtZWRpYXRlQWRkcmVzc1Jlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouUmVndWxhcikge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzUmVndWxhclZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU2ltcGxlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0ludGVybWVkaWF0ZUFkZHJlc3NTaW1wbGVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbnRlcm1lZGlhdGVBZGRyZXNzRXh0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgRXh0QmxrUmVmID0gc3RydWN0KHtcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzZXFfbm86IHNjYWxhcixcbiAgICByb290X2hhc2g6IHNjYWxhcixcbiAgICBmaWxlX2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUaWNrVG9jayA9IHN0cnVjdCh7XG4gICAgdGljazogc2NhbGFyLFxuICAgIHRvY2s6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTdG9yYWdlVXNlZFNob3J0ID0gc3RydWN0KHtcbiAgICBjZWxsczogc2NhbGFyLFxuICAgIGJpdHM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBTcGxpdE1lcmdlSW5mbyA9IHN0cnVjdCh7XG4gICAgY3VyX3NoYXJkX3BmeF9sZW46IHNjYWxhcixcbiAgICBhY2Nfc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICB0aGlzX2FkZHI6IHNjYWxhcixcbiAgICBzaWJsaW5nX2FkZHI6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgaWhyX2Rpc2FibGVkOiBzY2FsYXIsXG4gICAgYm91bmNlOiBzY2FsYXIsXG4gICAgYm91bmNlZDogc2NhbGFyLFxuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIHZhbHVlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgaWhyX2ZlZTogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBjcmVhdGVkX2x0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9hdDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8gPSBzdHJ1Y3Qoe1xuICAgIHNyYzogc2NhbGFyLFxuICAgIGRzdDogc2NhbGFyLFxuICAgIGltcG9ydF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyRXh0T3V0TXNnSW5mbyA9IHN0cnVjdCh7XG4gICAgc3JjOiBzY2FsYXIsXG4gICAgZHN0OiBzY2FsYXIsXG4gICAgY3JlYXRlZF9sdDogc2NhbGFyLFxuICAgIGNyZWF0ZWRfYXQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlSGVhZGVyID0gc3RydWN0KHtcbiAgICBJbnRNc2dJbmZvOiBNZXNzYWdlSGVhZGVySW50TXNnSW5mbyxcbiAgICBFeHRJbk1zZ0luZm86IE1lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm8sXG4gICAgRXh0T3V0TXNnSW5mbzogTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm8sXG59KTtcblxuY29uc3QgTWVzc2FnZUhlYWRlclJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouSW50TXNnSW5mbykge1xuICAgICAgICAgICAgcmV0dXJuICdNZXNzYWdlSGVhZGVySW50TXNnSW5mb1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRXh0SW5Nc2dJbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gJ01lc3NhZ2VIZWFkZXJFeHRJbk1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dE91dE1zZ0luZm8pIHtcbiAgICAgICAgICAgIHJldHVybiAnTWVzc2FnZUhlYWRlckV4dE91dE1zZ0luZm9WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBNZXNzYWdlSW5pdCA9IHN0cnVjdCh7XG4gICAgc3BsaXRfZGVwdGg6IHNjYWxhcixcbiAgICBzcGVjaWFsOiBUaWNrVG9jayxcbiAgICBjb2RlOiBzY2FsYXIsXG4gICAgZGF0YTogc2NhbGFyLFxuICAgIGxpYnJhcnk6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBNZXNzYWdlID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBoZWFkZXI6IE1lc3NhZ2VIZWFkZXIsXG4gICAgaW5pdDogTWVzc2FnZUluaXQsXG4gICAgYm9keTogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IE1zZ0VudmVsb3BlID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICBuZXh0X2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgY3VyX2FkZHI6IEludGVybWVkaWF0ZUFkZHJlc3MsXG4gICAgZndkX2ZlZV9yZW1haW5pbmc6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBJbk1zZ0V4dGVybmFsID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnSUhSID0gc3RydWN0KHtcbiAgICBtc2c6IHNjYWxhcixcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxuICAgIGlocl9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9jcmVhdGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dJbW1lZGlhdGVsbHkgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uOiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dGaW5hbCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBmd2RfZmVlOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIGluX21zZzogTXNnRW52ZWxvcGUsXG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNpdF9mZWU6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZ0Rpc2NhcmRlZEZpbmFsID0gc3RydWN0KHtcbiAgICBpbl9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIHRyYW5zYWN0aW9uX2lkOiBzY2FsYXIsXG4gICAgZndkX2ZlZTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEluTXNnRGlzY2FyZGVkVHJhbnNpdCA9IHN0cnVjdCh7XG4gICAgaW5fbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbl9pZDogc2NhbGFyLFxuICAgIGZ3ZF9mZWU6IHNjYWxhcixcbiAgICBwcm9vZl9kZWxpdmVyZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBJbk1zZyA9IHN0cnVjdCh7XG4gICAgRXh0ZXJuYWw6IEluTXNnRXh0ZXJuYWwsXG4gICAgSUhSOiBJbk1zZ0lIUixcbiAgICBJbW1lZGlhdGVsbHk6IEluTXNnSW1tZWRpYXRlbGx5LFxuICAgIEZpbmFsOiBJbk1zZ0ZpbmFsLFxuICAgIFRyYW5zaXQ6IEluTXNnVHJhbnNpdCxcbiAgICBEaXNjYXJkZWRGaW5hbDogSW5Nc2dEaXNjYXJkZWRGaW5hbCxcbiAgICBEaXNjYXJkZWRUcmFuc2l0OiBJbk1zZ0Rpc2NhcmRlZFRyYW5zaXQsXG59KTtcblxuY29uc3QgSW5Nc2dSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnRXh0ZXJuYWxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLklIUikge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0lIUlZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouSW1tZWRpYXRlbGx5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnSW1tZWRpYXRlbGx5VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5GaW5hbCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0ZpbmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5UcmFuc2l0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0luTXNnVHJhbnNpdFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkRmluYWwpIHtcbiAgICAgICAgICAgIHJldHVybiAnSW5Nc2dEaXNjYXJkZWRGaW5hbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouRGlzY2FyZGVkVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdJbk1zZ0Rpc2NhcmRlZFRyYW5zaXRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBPdXRNc2dFeHRlcm5hbCA9IHN0cnVjdCh7XG4gICAgbXNnOiBzY2FsYXIsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dJbW1lZGlhdGVseSA9IHN0cnVjdCh7XG4gICAgb3V0X21zZzogTXNnRW52ZWxvcGUsXG4gICAgdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICByZWltcG9ydDogSW5Nc2csXG59KTtcblxuY29uc3QgT3V0TXNnT3V0TXNnTmV3ID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICB0cmFuc2FjdGlvbjogc2NhbGFyLFxufSk7XG5cbmNvbnN0IE91dE1zZ1RyYW5zaXQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2dEZXF1ZXVlID0gc3RydWN0KHtcbiAgICBvdXRfbXNnOiBNc2dFbnZlbG9wZSxcbiAgICBpbXBvcnRfYmxvY2tfbHQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBPdXRNc2dUcmFuc2l0UmVxdWlyZWQgPSBzdHJ1Y3Qoe1xuICAgIG91dF9tc2c6IE1zZ0VudmVsb3BlLFxuICAgIGltcG9ydGVkOiBJbk1zZyxcbn0pO1xuXG5jb25zdCBPdXRNc2cgPSBzdHJ1Y3Qoe1xuICAgIE5vbmU6IE5vbmUsXG4gICAgRXh0ZXJuYWw6IE91dE1zZ0V4dGVybmFsLFxuICAgIEltbWVkaWF0ZWx5OiBPdXRNc2dJbW1lZGlhdGVseSxcbiAgICBPdXRNc2dOZXc6IE91dE1zZ091dE1zZ05ldyxcbiAgICBUcmFuc2l0OiBPdXRNc2dUcmFuc2l0LFxuICAgIERlcXVldWU6IE91dE1zZ0RlcXVldWUsXG4gICAgVHJhbnNpdFJlcXVpcmVkOiBPdXRNc2dUcmFuc2l0UmVxdWlyZWQsXG59KTtcblxuY29uc3QgT3V0TXNnUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5Ob25lKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ05vbmVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLkV4dGVybmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0V4dGVybmFsVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5JbW1lZGlhdGVseSkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dJbW1lZGlhdGVseVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouT3V0TXNnTmV3KSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ091dE1zZ05ld1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVHJhbnNpdCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5EZXF1ZXVlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ091dE1zZ0RlcXVldWVWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlRyYW5zaXRSZXF1aXJlZCkge1xuICAgICAgICAgICAgcmV0dXJuICdPdXRNc2dUcmFuc2l0UmVxdWlyZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBCbG9ja0luZm9QcmV2UmVmUHJldiA9IHN0cnVjdCh7XG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgZmlsZV9oYXNoOiBzY2FsYXIsXG4gICAgcm9vdF9oYXNoOiBzY2FsYXIsXG4gICAgZW5kX2x0OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvUHJldlJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogQmxvY2tJbmZvUHJldlJlZlByZXYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvU2hhcmQgPSBzdHJ1Y3Qoe1xuICAgIHNoYXJkX3BmeF9iaXRzOiBzY2FsYXIsXG4gICAgd29ya2NoYWluX2lkOiBzY2FsYXIsXG4gICAgc2hhcmRfcHJlZml4OiBzY2FsYXIsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvTWFzdGVyUmVmID0gc3RydWN0KHtcbiAgICBtYXN0ZXI6IEV4dEJsa1JlZixcbn0pO1xuXG5jb25zdCBCbG9ja0luZm9QcmV2VmVydFJlZiA9IHN0cnVjdCh7XG4gICAgcHJldjogRXh0QmxrUmVmLFxuICAgIHByZXZfYWx0OiBFeHRCbGtSZWYsXG59KTtcblxuY29uc3QgQmxvY2tJbmZvID0gc3RydWN0KHtcbiAgICB3YW50X3NwbGl0OiBzY2FsYXIsXG4gICAgc2VxX25vOiBzY2FsYXIsXG4gICAgYWZ0ZXJfbWVyZ2U6IHNjYWxhcixcbiAgICBnZW5fdXRpbWU6IHNjYWxhcixcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IHNjYWxhcixcbiAgICBmbGFnczogc2NhbGFyLFxuICAgIHByZXZfcmVmOiBCbG9ja0luZm9QcmV2UmVmLFxuICAgIHZlcnNpb246IHNjYWxhcixcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogc2NhbGFyLFxuICAgIGJlZm9yZV9zcGxpdDogc2NhbGFyLFxuICAgIGFmdGVyX3NwbGl0OiBzY2FsYXIsXG4gICAgd2FudF9tZXJnZTogc2NhbGFyLFxuICAgIHZlcnRfc2VxX25vOiBzY2FsYXIsXG4gICAgc3RhcnRfbHQ6IHNjYWxhcixcbiAgICBlbmRfbHQ6IHNjYWxhcixcbiAgICBzaGFyZDogQmxvY2tJbmZvU2hhcmQsXG4gICAgbWluX3JlZl9tY19zZXFubzogc2NhbGFyLFxuICAgIG1hc3Rlcl9yZWY6IEJsb2NrSW5mb01hc3RlclJlZixcbiAgICBwcmV2X3ZlcnRfcmVmOiBCbG9ja0luZm9QcmV2VmVydFJlZixcbn0pO1xuXG5jb25zdCBCbG9ja1ZhbHVlRmxvdyA9IHN0cnVjdCh7XG4gICAgdG9fbmV4dF9ibGs6IEN1cnJlbmN5Q29sbGVjdGlvbixcbiAgICBleHBvcnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfY29sbGVjdGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgY3JlYXRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGltcG9ydGVkOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgZnJvbV9wcmV2X2JsazogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIG1pbnRlZDogQ3VycmVuY3lDb2xsZWN0aW9uLFxuICAgIGZlZXNfaW1wb3J0ZWQ6IEN1cnJlbmN5Q29sbGVjdGlvbixcbn0pO1xuXG5jb25zdCBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlID0gc3RydWN0KHtcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG5ld19oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgU3RyaW5nQXJyYXkgPSBhcnJheShTdHJpbmcpO1xuY29uc3QgQmxvY2tFeHRyYUFjY291bnRCbG9ja3MgPSBzdHJ1Y3Qoe1xuICAgIGFjY291bnRfYWRkcjogc2NhbGFyLFxuICAgIHRyYW5zYWN0aW9uczogU3RyaW5nQXJyYXksXG4gICAgc3RhdGVfdXBkYXRlOiBCbG9ja0V4dHJhQWNjb3VudEJsb2Nrc1N0YXRlVXBkYXRlLFxuICAgIHRyX2NvdW50OiBzY2FsYXIsXG59KTtcblxuY29uc3QgSW5Nc2dBcnJheSA9IGFycmF5KEluTXNnKTtcbmNvbnN0IE91dE1zZ0FycmF5ID0gYXJyYXkoT3V0TXNnKTtcbmNvbnN0IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXkgPSBhcnJheShCbG9ja0V4dHJhQWNjb3VudEJsb2Nrcyk7XG5jb25zdCBCbG9ja0V4dHJhID0gc3RydWN0KHtcbiAgICBpbl9tc2dfZGVzY3I6IEluTXNnQXJyYXksXG4gICAgcmFuZF9zZWVkOiBzY2FsYXIsXG4gICAgb3V0X21zZ19kZXNjcjogT3V0TXNnQXJyYXksXG4gICAgYWNjb3VudF9ibG9ja3M6IEJsb2NrRXh0cmFBY2NvdW50QmxvY2tzQXJyYXksXG59KTtcblxuY29uc3QgQmxvY2tTdGF0ZVVwZGF0ZSA9IHN0cnVjdCh7XG4gICAgbmV3OiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbiAgICBuZXdfZGVwdGg6IHNjYWxhcixcbiAgICBvbGQ6IHNjYWxhcixcbiAgICBvbGRfaGFzaDogc2NhbGFyLFxuICAgIG9sZF9kZXB0aDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEJsb2NrID0gc3RydWN0KHtcbiAgICBpZDogc2NhbGFyLFxuICAgIHN0YXR1czogc2NhbGFyLFxuICAgIGdsb2JhbF9pZDogc2NhbGFyLFxuICAgIGluZm86IEJsb2NrSW5mbyxcbiAgICB2YWx1ZV9mbG93OiBCbG9ja1ZhbHVlRmxvdyxcbiAgICBleHRyYTogQmxvY2tFeHRyYSxcbiAgICBzdGF0ZV91cGRhdGU6IEJsb2NrU3RhdGVVcGRhdGUsXG59LCB0cnVlKTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2VTdGF0ID0gc3RydWN0KHtcbiAgICBsYXN0X3BhaWQ6IHNjYWxhcixcbiAgICBkdWVfcGF5bWVudDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlID0gc3RydWN0KHtcbiAgICBzcGxpdF9kZXB0aDogc2NhbGFyLFxuICAgIHNwZWNpYWw6IFRpY2tUb2NrLFxuICAgIGNvZGU6IHNjYWxhcixcbiAgICBkYXRhOiBzY2FsYXIsXG4gICAgbGlicmFyeTogc2NhbGFyLFxufSk7XG5cbmNvbnN0IEFjY291bnRTdG9yYWdlU3RhdGUgPSBzdHJ1Y3Qoe1xuICAgIEFjY291bnRVbmluaXQ6IE5vbmUsXG4gICAgQWNjb3VudEFjdGl2ZTogQWNjb3VudFN0b3JhZ2VTdGF0ZUFjY291bnRBY3RpdmUsXG4gICAgQWNjb3VudEZyb3plbjogTm9uZSxcbn0pO1xuXG5jb25zdCBBY2NvdW50U3RvcmFnZVN0YXRlUmVzb2x2ZXIgPSB7XG4gICAgX19yZXNvbHZlVHlwZShvYmosIGNvbnRleHQsIGluZm8pIHtcbiAgICAgICAgaWYgKG9iai5BY2NvdW50VW5pbml0KSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50VW5pbml0VmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50QWN0aXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50QWN0aXZlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5BY2NvdW50RnJvemVuKSB7XG4gICAgICAgICAgICByZXR1cm4gJ0FjY291bnRTdG9yYWdlU3RhdGVBY2NvdW50RnJvemVuVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgQWNjb3VudFN0b3JhZ2UgPSBzdHJ1Y3Qoe1xuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBiYWxhbmNlOiBDdXJyZW5jeUNvbGxlY3Rpb24sXG4gICAgc3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGUsXG59KTtcblxuY29uc3QgQWNjb3VudCA9IHN0cnVjdCh7XG4gICAgaWQ6IHNjYWxhcixcbiAgICBfa2V5OiBzY2FsYXIsXG4gICAgc3RvcmFnZV9zdGF0OiBBY2NvdW50U3RvcmFnZVN0YXQsXG4gICAgc3RvcmFnZTogQWNjb3VudFN0b3JhZ2UsXG4gICAgYWRkcjogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uU3RhdGVVcGRhdGUgPSBzdHJ1Y3Qoe1xuICAgIG9sZF9oYXNoOiBzY2FsYXIsXG4gICAgbmV3X2hhc2g6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUclN0b3JhZ2VQaGFzZSA9IHN0cnVjdCh7XG4gICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogc2NhbGFyLFxuICAgIHN0b3JhZ2VfZmVlc19kdWU6IHNjYWxhcixcbiAgICBzdGF0dXNfY2hhbmdlOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDcmVkaXRQaGFzZSA9IHN0cnVjdCh7XG4gICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBzY2FsYXIsXG4gICAgY3JlZGl0OiBDdXJyZW5jeUNvbGxlY3Rpb24sXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2VTa2lwcGVkID0gc3RydWN0KHtcbiAgICByZWFzb246IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVZtID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgbXNnX3N0YXRlX3VzZWQ6IHNjYWxhcixcbiAgICBhY2NvdW50X2FjdGl2YXRlZDogc2NhbGFyLFxuICAgIGdhc19mZWVzOiBzY2FsYXIsXG4gICAgZ2FzX3VzZWQ6IHNjYWxhcixcbiAgICBnYXNfbGltaXQ6IHNjYWxhcixcbiAgICBnYXNfY3JlZGl0OiBzY2FsYXIsXG4gICAgbW9kZTogc2NhbGFyLFxuICAgIGV4aXRfY29kZTogc2NhbGFyLFxuICAgIGV4aXRfYXJnOiBzY2FsYXIsXG4gICAgdm1fc3RlcHM6IHNjYWxhcixcbiAgICB2bV9pbml0X3N0YXRlX2hhc2g6IHNjYWxhcixcbiAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJDb21wdXRlUGhhc2UgPSBzdHJ1Y3Qoe1xuICAgIFNraXBwZWQ6IFRyQ29tcHV0ZVBoYXNlU2tpcHBlZCxcbiAgICBWbTogVHJDb21wdXRlUGhhc2VWbSxcbn0pO1xuXG5jb25zdCBUckNvbXB1dGVQaGFzZVJlc29sdmVyID0ge1xuICAgIF9fcmVzb2x2ZVR5cGUob2JqLCBjb250ZXh0LCBpbmZvKSB7XG4gICAgICAgIGlmIChvYmouU2tpcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuICdUckNvbXB1dGVQaGFzZVNraXBwZWRWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLlZtKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQ29tcHV0ZVBoYXNlVm1WYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59O1xuXG5jb25zdCBUckFjdGlvblBoYXNlID0gc3RydWN0KHtcbiAgICBzdWNjZXNzOiBzY2FsYXIsXG4gICAgdmFsaWQ6IHNjYWxhcixcbiAgICBub19mdW5kczogc2NhbGFyLFxuICAgIHN0YXR1c19jaGFuZ2U6IHNjYWxhcixcbiAgICB0b3RhbF9md2RfZmVlczogc2NhbGFyLFxuICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBzY2FsYXIsXG4gICAgcmVzdWx0X2NvZGU6IHNjYWxhcixcbiAgICByZXN1bHRfYXJnOiBzY2FsYXIsXG4gICAgdG90X2FjdGlvbnM6IHNjYWxhcixcbiAgICBzcGVjX2FjdGlvbnM6IHNjYWxhcixcbiAgICBza2lwcGVkX2FjdGlvbnM6IHNjYWxhcixcbiAgICBtc2dzX2NyZWF0ZWQ6IHNjYWxhcixcbiAgICBhY3Rpb25fbGlzdF9oYXNoOiBzY2FsYXIsXG4gICAgdG90X21zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VOb2Z1bmRzID0gc3RydWN0KHtcbiAgICBtc2dfc2l6ZTogU3RvcmFnZVVzZWRTaG9ydCxcbiAgICByZXFfZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlT2sgPSBzdHJ1Y3Qoe1xuICAgIG1zZ19zaXplOiBTdG9yYWdlVXNlZFNob3J0LFxuICAgIG1zZ19mZWVzOiBzY2FsYXIsXG4gICAgZndkX2ZlZXM6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUckJvdW5jZVBoYXNlID0gc3RydWN0KHtcbiAgICBOZWdmdW5kczogTm9uZSxcbiAgICBOb2Z1bmRzOiBUckJvdW5jZVBoYXNlTm9mdW5kcyxcbiAgICBPazogVHJCb3VuY2VQaGFzZU9rLFxufSk7XG5cbmNvbnN0IFRyQm91bmNlUGhhc2VSZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk5lZ2Z1bmRzKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyQm91bmNlUGhhc2VOZWdmdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouTm9mdW5kcykge1xuICAgICAgICAgICAgcmV0dXJuICdUckJvdW5jZVBoYXNlTm9mdW5kc1ZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouT2spIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJCb3VuY2VQaGFzZU9rVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5ID0gc3RydWN0KHtcbiAgICBjcmVkaXRfZmlyc3Q6IHNjYWxhcixcbiAgICBzdG9yYWdlX3BoOiBUclN0b3JhZ2VQaGFzZSxcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBib3VuY2U6IFRyQm91bmNlUGhhc2UsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrID0gc3RydWN0KHtcbiAgICB0dDogc2NhbGFyLFxuICAgIHN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIGNvbXB1dGVfcGg6IFRyQ29tcHV0ZVBoYXNlLFxuICAgIGFjdGlvbjogVHJBY3Rpb25QaGFzZSxcbiAgICBhYm9ydGVkOiBzY2FsYXIsXG4gICAgZGVzdHJveWVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRJbnN0YWxsID0gc3RydWN0KHtcbiAgICBzcGxpdF9pbmZvOiBTcGxpdE1lcmdlSW5mbyxcbiAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBzY2FsYXIsXG4gICAgaW5zdGFsbGVkOiBzY2FsYXIsXG59KTtcblxuY29uc3QgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlUHJlcGFyZSA9IHN0cnVjdCh7XG4gICAgc3BsaXRfaW5mbzogU3BsaXRNZXJnZUluZm8sXG4gICAgc3RvcmFnZV9waDogVHJTdG9yYWdlUGhhc2UsXG4gICAgYWJvcnRlZDogc2NhbGFyLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZUluc3RhbGwgPSBzdHJ1Y3Qoe1xuICAgIHNwbGl0X2luZm86IFNwbGl0TWVyZ2VJbmZvLFxuICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IHNjYWxhcixcbiAgICBjcmVkaXRfcGg6IFRyQ3JlZGl0UGhhc2UsXG4gICAgY29tcHV0ZV9waDogVHJDb21wdXRlUGhhc2UsXG4gICAgYWN0aW9uOiBUckFjdGlvblBoYXNlLFxuICAgIGFib3J0ZWQ6IHNjYWxhcixcbiAgICBkZXN0cm95ZWQ6IHNjYWxhcixcbn0pO1xuXG5jb25zdCBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uID0gc3RydWN0KHtcbiAgICBPcmRpbmFyeTogVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk9yZGluYXJ5LFxuICAgIFN0b3JhZ2U6IFRyU3RvcmFnZVBoYXNlLFxuICAgIFRpY2tUb2NrOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uVGlja1RvY2ssXG4gICAgU3BsaXRQcmVwYXJlOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3BsaXRQcmVwYXJlLFxuICAgIFNwbGl0SW5zdGFsbDogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0SW5zdGFsbCxcbiAgICBNZXJnZVByZXBhcmU6IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25NZXJnZVByZXBhcmUsXG4gICAgTWVyZ2VJbnN0YWxsOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VJbnN0YWxsLFxufSk7XG5cbmNvbnN0IFRyYW5zYWN0aW9uRGVzY3JpcHRpb25SZXNvbHZlciA9IHtcbiAgICBfX3Jlc29sdmVUeXBlKG9iaiwgY29udGV4dCwgaW5mbykge1xuICAgICAgICBpZiAob2JqLk9yZGluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25PcmRpbmFyeVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3RvcmFnZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uU3RvcmFnZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouVGlja1RvY2spIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblRpY2tUb2NrVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5TcGxpdFByZXBhcmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvblNwbGl0UHJlcGFyZVZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvYmouU3BsaXRJbnN0YWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1RyYW5zYWN0aW9uRGVzY3JpcHRpb25TcGxpdEluc3RhbGxWYXJpYW50JztcbiAgICAgICAgfVxuICAgICAgICBpZiAob2JqLk1lcmdlUHJlcGFyZSkge1xuICAgICAgICAgICAgcmV0dXJuICdUcmFuc2FjdGlvbkRlc2NyaXB0aW9uTWVyZ2VQcmVwYXJlVmFyaWFudCc7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9iai5NZXJnZUluc3RhbGwpIHtcbiAgICAgICAgICAgIHJldHVybiAnVHJhbnNhY3Rpb25EZXNjcmlwdGlvbk1lcmdlSW5zdGFsbFZhcmlhbnQnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn07XG5cbmNvbnN0IE1lc3NhZ2VBcnJheSA9IGFycmF5KE1lc3NhZ2UpO1xuY29uc3QgVHJhbnNhY3Rpb24gPSBzdHJ1Y3Qoe1xuICAgIGlkOiBzY2FsYXIsXG4gICAgYmxvY2tfaWQ6IHNjYWxhcixcbiAgICBzdGF0dXM6IHNjYWxhcixcbiAgICBhY2NvdW50X2FkZHI6IHNjYWxhcixcbiAgICBsdDogc2NhbGFyLFxuICAgIGxhc3RfdHJhbnNfbHQ6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2hhc2g6IHNjYWxhcixcbiAgICBwcmV2X3RyYW5zX2x0OiBzY2FsYXIsXG4gICAgbm93OiBzY2FsYXIsXG4gICAgb3V0bXNnX2NudDogc2NhbGFyLFxuICAgIG9yaWdfc3RhdHVzOiBzY2FsYXIsXG4gICAgZW5kX3N0YXR1czogc2NhbGFyLFxuICAgIGluX21zZzogc2NhbGFyLFxuICAgIGluX21lc3NhZ2U6IGpvaW4oJ2luX21zZycsICdtZXNzYWdlcycsIE1lc3NhZ2UpLFxuICAgIG91dF9tc2dzOiBTdHJpbmdBcnJheSxcbiAgICBvdXRfbWVzc2FnZXM6IGpvaW5BcnJheSgnb3V0X21zZ3MnLCAnbWVzc2FnZXMnLCBNZXNzYWdlKSxcbiAgICB0b3RhbF9mZWVzOiBzY2FsYXIsXG4gICAgc3RhdGVfdXBkYXRlOiBUcmFuc2FjdGlvblN0YXRlVXBkYXRlLFxuICAgIGRlc2NyaXB0aW9uOiBUcmFuc2FjdGlvbkRlc2NyaXB0aW9uLFxuICAgIHJvb3RfY2VsbDogc2NhbGFyLFxufSwgdHJ1ZSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJlc29sdmVycyhkYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIEludGVybWVkaWF0ZUFkZHJlc3M6IEludGVybWVkaWF0ZUFkZHJlc3NSZXNvbHZlcixcbiAgICAgICAgTWVzc2FnZUhlYWRlcjogTWVzc2FnZUhlYWRlclJlc29sdmVyLFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgICBpZChwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyZW50Ll9rZXk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBJbk1zZzogSW5Nc2dSZXNvbHZlcixcbiAgICAgICAgT3V0TXNnOiBPdXRNc2dSZXNvbHZlcixcbiAgICAgICAgQmxvY2s6IHtcbiAgICAgICAgICAgIGlkKHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJlbnQuX2tleTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIEFjY291bnRTdG9yYWdlU3RhdGU6IEFjY291bnRTdG9yYWdlU3RhdGVSZXNvbHZlcixcbiAgICAgICAgQWNjb3VudDoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgVHJDb21wdXRlUGhhc2U6IFRyQ29tcHV0ZVBoYXNlUmVzb2x2ZXIsXG4gICAgICAgIFRyQm91bmNlUGhhc2U6IFRyQm91bmNlUGhhc2VSZXNvbHZlcixcbiAgICAgICAgVHJhbnNhY3Rpb25EZXNjcmlwdGlvbjogVHJhbnNhY3Rpb25EZXNjcmlwdGlvblJlc29sdmVyLFxuICAgICAgICBUcmFuc2FjdGlvbjoge1xuICAgICAgICAgICAgaWQocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5fa2V5O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGluX21lc3NhZ2UocGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRiLmZldGNoRG9jQnlLZXkoZGIubWVzc2FnZXMsIHBhcmVudC5pbl9tc2cpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlcyhwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGIuZmV0Y2hEb2NzQnlLZXlzKGRiLm1lc3NhZ2VzLCBwYXJlbnQub3V0X21zZ3MpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgUXVlcnk6IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIubWVzc2FnZXMsIE1lc3NhZ2UpLFxuICAgICAgICAgICAgYmxvY2tzOiBkYi5jb2xsZWN0aW9uUXVlcnkoZGIuYmxvY2tzLCBCbG9jayksXG4gICAgICAgICAgICBhY2NvdW50czogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblF1ZXJ5KGRiLnRyYW5zYWN0aW9ucywgVHJhbnNhY3Rpb24pLFxuICAgICAgICAgICAgc2VsZWN0OiBkYi5zZWxlY3RRdWVyeSgpLFxuICAgICAgICB9LFxuICAgICAgICBTdWJzY3JpcHRpb246IHtcbiAgICAgICAgICAgIG1lc3NhZ2VzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLm1lc3NhZ2VzLCBNZXNzYWdlKSxcbiAgICAgICAgICAgIGJsb2NrczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi5ibG9ja3MsIEJsb2NrKSxcbiAgICAgICAgICAgIGFjY291bnRzOiBkYi5jb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGRiLmFjY291bnRzLCBBY2NvdW50KSxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogZGIuY29sbGVjdGlvblN1YnNjcmlwdGlvbihkYi50cmFuc2FjdGlvbnMsIFRyYW5zYWN0aW9uKSxcbiAgICAgICAgfVxuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGNyZWF0ZVJlc29sdmVyc1xufTtcbiJdfQ==