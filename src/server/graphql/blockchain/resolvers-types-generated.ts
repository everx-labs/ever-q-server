import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export enum AccountStatusChangeEnum {
  Deleted = 'Deleted',
  Frozen = 'Frozen',
  Unchanged = 'Unchanged'
}

export enum AccountStatusEnum {
  Uninit = 'Uninit',
  Active = 'Active',
  Frozen = 'Frozen',
  NonExist = 'NonExist'
}

/**
 * Due to GraphQL limitations big numbers are returned as a string.
 * You can specify format used to string representation for big integers.
 */
export enum BigIntFormat {
  /**  Hexadecimal representation started with 0x (default)  */
  Hex = 'HEX',
  /**  Decimal representation  */
  Dec = 'DEC'
}

export type BlockchainMasterSeqNoFilter = {
  /** Minimum inclusive seq_no of corresponding master blocks */
  start?: Maybe<Scalars['Int']>;
  /** Maximum exclusive seq_no of corresponding master blocks */
  end?: Maybe<Scalars['Int']>;
};

export type BlockchainMasterSeqNoRange = {
  __typename?: 'BlockchainMasterSeqNoRange';
  /** Minimum inclusive seq_no of corresponding master blocks */
  start?: Maybe<Scalars['Int']>;
  /** Maximum exclusive seq_no of corresponding master blocks */
  end?: Maybe<Scalars['Int']>;
};

export type BlockchainQuery = {
  __typename?: 'BlockchainQuery';
  /**
   * Returns master seq_no range with masterblock(start).gen_utime <= time_start and masterblock(end - 1).gen_utime >= time_end.
   * If time_start is null, then start is null. If time_end is null, then end is null.
   */
  master_seq_no_range?: Maybe<BlockchainMasterSeqNoRange>;
  account_transactions?: Maybe<BlockchainTransactionsConnection>;
  workchain_transactions?: Maybe<BlockchainTransactionsConnection>;
};


export type BlockchainQueryMaster_Seq_No_RangeArgs = {
  time_start?: Maybe<Scalars['Int']>;
  time_end?: Maybe<Scalars['Int']>;
};


export type BlockchainQueryAccount_TransactionsArgs = {
  master_seq_no?: Maybe<BlockchainMasterSeqNoFilter>;
  account_addresses?: Maybe<Array<Scalars['String']>>;
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
};


export type BlockchainQueryWorkchain_TransactionsArgs = {
  master_seq_no?: Maybe<BlockchainMasterSeqNoFilter>;
  workchains?: Maybe<Array<Scalars['Int']>>;
  first?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  last?: Maybe<Scalars['Int']>;
  before?: Maybe<Scalars['String']>;
};

/** TON Transaction */
export type BlockchainTransaction = Node & {
  __typename?: 'BlockchainTransaction';
  _key: Scalars['String'];
  aborted?: Maybe<Scalars['Boolean']>;
  account_addr?: Maybe<Scalars['String']>;
  action?: Maybe<TransactionAction>;
  /** Account balance change after transaction */
  balance_delta?: Maybe<Scalars['String']>;
  /** Account balance change after transaction */
  balance_delta_other?: Maybe<Array<Maybe<OtherCurrency>>>;
  block_id?: Maybe<Scalars['String']>;
  boc?: Maybe<Scalars['String']>;
  bounce?: Maybe<TransactionBounce>;
  /** Collection-unique field for pagination and sorting. This field is designed to retain logical order. */
  chain_order?: Maybe<Scalars['String']>;
  compute?: Maybe<TransactionCompute>;
  credit?: Maybe<TransactionCredit>;
  credit_first?: Maybe<Scalars['Boolean']>;
  destroyed?: Maybe<Scalars['Boolean']>;
  /**
   * The end state of an account after a transaction, 1 is returned to indicate a finalized transaction at an active account
   * - 0 – uninit
   * - 1 – active
   * - 2 – frozen
   * - 3 – nonExist
   */
  end_status?: Maybe<Scalars['Int']>;
  end_status_name?: Maybe<AccountStatusEnum>;
  hash?: Maybe<Scalars['String']>;
  /**
   * BlockchainTransaction.id is "transaction/"-prefixed Transaction.id.
   * For id without prefix see "hash".
   */
  id?: Maybe<Scalars['String']>;
  in_msg?: Maybe<Scalars['String']>;
  installed?: Maybe<Scalars['Boolean']>;
  /** Logical time. A component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see [the TON blockchain specification](https://test.ton.org/tblkch.pdf). */
  lt?: Maybe<Scalars['String']>;
  /** Merkle update field */
  new_hash?: Maybe<Scalars['String']>;
  now?: Maybe<Scalars['Float']>;
  now_string?: Maybe<Scalars['String']>;
  /** Merkle update field */
  old_hash?: Maybe<Scalars['String']>;
  /**
   * The initial state of account. Note that in this case the query may return 0, if the account was not active before the transaction and 1 if it was already active
   * - 0 – uninit
   * - 1 – active
   * - 2 – frozen
   * - 3 – nonExist
   */
  orig_status?: Maybe<Scalars['Int']>;
  orig_status_name?: Maybe<AccountStatusEnum>;
  out_msgs?: Maybe<Array<Maybe<Scalars['String']>>>;
  /** The number of generated outbound messages (one of the common transaction parameters defined by the specification) */
  outmsg_cnt?: Maybe<Scalars['Int']>;
  prepare_transaction?: Maybe<Scalars['String']>;
  prev_trans_hash?: Maybe<Scalars['String']>;
  prev_trans_lt?: Maybe<Scalars['String']>;
  proof?: Maybe<Scalars['String']>;
  split_info?: Maybe<TransactionSplitInfo>;
  /**
   * Transaction processing status
   * - 0 – unknown
   * - 1 – preliminary
   * - 2 – proposed
   * - 3 – finalized
   * - 4 – refused
   */
  status?: Maybe<Scalars['Int']>;
  status_name?: Maybe<TransactionProcessingStatusEnum>;
  storage?: Maybe<TransactionStorage>;
  /** Total amount of fees that entails account state change and used in Merkle update */
  total_fees?: Maybe<Scalars['String']>;
  /** Same as above, but reserved for non gram coins that may appear in the blockchain */
  total_fees_other?: Maybe<Array<Maybe<OtherCurrency>>>;
  /**
   * Transaction type according to the original blockchain specification, clause 4.2.4.
   * - 0 – ordinary
   * - 1 – storage
   * - 2 – tick
   * - 3 – tock
   * - 4 – splitPrepare
   * - 5 – splitInstall
   * - 6 – mergePrepare
   * - 7 – mergeInstall
   */
  tr_type?: Maybe<Scalars['Int']>;
  tr_type_name?: Maybe<TransactionTypeEnum>;
  tt?: Maybe<Scalars['String']>;
  /** Workchain id of the account address (account_addr field) */
  workchain_id?: Maybe<Scalars['Int']>;
};


/** TON Transaction */
export type BlockchainTransactionBalance_DeltaArgs = {
  format?: Maybe<BigIntFormat>;
};


/** TON Transaction */
export type BlockchainTransactionLtArgs = {
  format?: Maybe<BigIntFormat>;
};


/** TON Transaction */
export type BlockchainTransactionPrev_Trans_LtArgs = {
  format?: Maybe<BigIntFormat>;
};


/** TON Transaction */
export type BlockchainTransactionTotal_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};

export type BlockchainTransactionEdge = {
  __typename?: 'BlockchainTransactionEdge';
  node: BlockchainTransaction;
  cursor: Scalars['String'];
};

export type BlockchainTransactionsConnection = {
  __typename?: 'BlockchainTransactionsConnection';
  edges: Array<BlockchainTransactionEdge>;
  pageInfo: PageInfo;
};

export enum BounceTypeEnum {
  NegFunds = 'NegFunds',
  NoFunds = 'NoFunds',
  Ok = 'Ok'
}

export enum ComputeTypeEnum {
  Skipped = 'Skipped',
  Vm = 'Vm'
}

export type Node = {
  __typename?: 'Node';
  id: Scalars['ID'];
};

export type OtherCurrency = {
  __typename?: 'OtherCurrency';
  currency?: Maybe<Scalars['Float']>;
  value?: Maybe<Scalars['String']>;
};


export type OtherCurrencyValueArgs = {
  format?: Maybe<BigIntFormat>;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  startCursor: Scalars['String'];
  endCursor: Scalars['String'];
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  blockchain?: Maybe<BlockchainQuery>;
};

export enum SkipReasonEnum {
  NoState = 'NoState',
  BadState = 'BadState',
  NoGas = 'NoGas'
}

export type TransactionAction = {
  __typename?: 'TransactionAction';
  action_list_hash?: Maybe<Scalars['String']>;
  msgs_created?: Maybe<Scalars['Int']>;
  /** The flag indicates absence of funds required to create an outbound message */
  no_funds?: Maybe<Scalars['Boolean']>;
  result_arg?: Maybe<Scalars['Int']>;
  result_code?: Maybe<Scalars['Int']>;
  skipped_actions?: Maybe<Scalars['Int']>;
  spec_actions?: Maybe<Scalars['Int']>;
  /**
   * - 0 – unchanged
   * - 1 – frozen
   * - 2 – deleted
   */
  status_change?: Maybe<Scalars['Int']>;
  status_change_name?: Maybe<AccountStatusChangeEnum>;
  success?: Maybe<Scalars['Boolean']>;
  tot_actions?: Maybe<Scalars['Int']>;
  total_action_fees?: Maybe<Scalars['String']>;
  total_fwd_fees?: Maybe<Scalars['String']>;
  total_msg_size_bits?: Maybe<Scalars['Float']>;
  total_msg_size_cells?: Maybe<Scalars['Float']>;
  valid?: Maybe<Scalars['Boolean']>;
};


export type TransactionActionTotal_Action_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionActionTotal_Fwd_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};

export type TransactionBounce = {
  __typename?: 'TransactionBounce';
  /**
   * - 0 – negFunds
   * - 1 – noFunds
   * - 2 – ok
   */
  bounce_type?: Maybe<Scalars['Int']>;
  bounce_type_name?: Maybe<BounceTypeEnum>;
  fwd_fees?: Maybe<Scalars['String']>;
  msg_fees?: Maybe<Scalars['String']>;
  msg_size_bits?: Maybe<Scalars['Float']>;
  msg_size_cells?: Maybe<Scalars['Float']>;
  req_fwd_fees?: Maybe<Scalars['String']>;
};


export type TransactionBounceFwd_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionBounceMsg_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionBounceReq_Fwd_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};

export type TransactionCompute = {
  __typename?: 'TransactionCompute';
  /** The flag reflects whether this has resulted in the activation of a previously frozen, uninitialized or non-existent account. */
  account_activated?: Maybe<Scalars['Boolean']>;
  /**
   * - 0 – skipped
   * - 1 – vm
   */
  compute_type?: Maybe<Scalars['Int']>;
  compute_type_name?: Maybe<ComputeTypeEnum>;
  exit_arg?: Maybe<Scalars['Int']>;
  /** These parameter represents the status values returned by TVM; for a successful transaction, exit_code has to be 0 or 1 */
  exit_code?: Maybe<Scalars['Int']>;
  /** This parameter may be non-zero only for external inbound messages. It is the lesser of either the amount of gas that can be paid from the account balance or the maximum gas credit */
  gas_credit?: Maybe<Scalars['Int']>;
  /** This parameter reflects the total gas fees collected by the validators for executing this transaction. It must be equal to the product of gas_used and gas_price from the current block header. */
  gas_fees?: Maybe<Scalars['String']>;
  /** This parameter reflects the gas limit for this instance of TVM. It equals the lesser of either the Grams credited in the credit phase from the value of the inbound message divided by the current gas price, or the global per-transaction gas limit. */
  gas_limit?: Maybe<Scalars['String']>;
  gas_used?: Maybe<Scalars['String']>;
  mode?: Maybe<Scalars['Int']>;
  /** This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below) */
  msg_state_used?: Maybe<Scalars['Boolean']>;
  /**
   * Reason for skipping the compute phase. According to the specification, the phase can be skipped due to the absence of funds to buy gas, absence of state of an account or a message, failure to provide a valid state in the message
   * - 0 – noState
   * - 1 – badState
   * - 2 – noGas
   */
  skipped_reason?: Maybe<Scalars['Int']>;
  skipped_reason_name?: Maybe<SkipReasonEnum>;
  /** This flag is set if and only if exit_code is either 0 or 1. */
  success?: Maybe<Scalars['Boolean']>;
  /** This parameter is the representation hashes of the resulting state of TVM. */
  vm_final_state_hash?: Maybe<Scalars['String']>;
  /** This parameter is the representation hashes of the original state of TVM. */
  vm_init_state_hash?: Maybe<Scalars['String']>;
  /** the total number of steps performed by TVM (usually equal to two plus the number of instructions executed, including implicit RETs) */
  vm_steps?: Maybe<Scalars['Float']>;
};


export type TransactionComputeGas_FeesArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionComputeGas_LimitArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionComputeGas_UsedArgs = {
  format?: Maybe<BigIntFormat>;
};

export type TransactionCredit = {
  __typename?: 'TransactionCredit';
  credit?: Maybe<Scalars['String']>;
  credit_other?: Maybe<Array<Maybe<OtherCurrency>>>;
  /** The sum of due_fees_collected and credit must equal the value of the message received, plus its ihr_fee if the message has not been received via Instant Hypercube Routing, IHR (otherwise the ihr_fee is awarded to the validators). */
  due_fees_collected?: Maybe<Scalars['String']>;
};


export type TransactionCreditCreditArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionCreditDue_Fees_CollectedArgs = {
  format?: Maybe<BigIntFormat>;
};

export enum TransactionProcessingStatusEnum {
  Unknown = 'Unknown',
  Preliminary = 'Preliminary',
  Proposed = 'Proposed',
  Finalized = 'Finalized',
  Refused = 'Refused'
}

export type TransactionSplitInfo = {
  __typename?: 'TransactionSplitInfo';
  acc_split_depth?: Maybe<Scalars['Int']>;
  /** length of the current shard prefix */
  cur_shard_pfx_len?: Maybe<Scalars['Int']>;
  sibling_addr?: Maybe<Scalars['String']>;
  this_addr?: Maybe<Scalars['String']>;
};

export type TransactionStorage = {
  __typename?: 'TransactionStorage';
  /**
   * This field represents account status change after the transaction is completed.
   * - 0 – unchanged
   * - 1 – frozen
   * - 2 – deleted
   */
  status_change?: Maybe<Scalars['Int']>;
  status_change_name?: Maybe<AccountStatusChangeEnum>;
  /** This field defines the amount of storage fees collected in grams. */
  storage_fees_collected?: Maybe<Scalars['String']>;
  /** This field represents the amount of due fees in grams, it might be empty. */
  storage_fees_due?: Maybe<Scalars['String']>;
};


export type TransactionStorageStorage_Fees_CollectedArgs = {
  format?: Maybe<BigIntFormat>;
};


export type TransactionStorageStorage_Fees_DueArgs = {
  format?: Maybe<BigIntFormat>;
};

export enum TransactionTypeEnum {
  Ordinary = 'Ordinary',
  Storage = 'Storage',
  Tick = 'Tick',
  Tock = 'Tock',
  SplitPrepare = 'SplitPrepare',
  SplitInstall = 'SplitInstall',
  MergePrepare = 'MergePrepare',
  MergeInstall = 'MergeInstall'
}



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AccountStatusChangeEnum: AccountStatusChangeEnum;
  AccountStatusEnum: AccountStatusEnum;
  BigIntFormat: BigIntFormat;
  BlockchainMasterSeqNoFilter: BlockchainMasterSeqNoFilter;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  BlockchainMasterSeqNoRange: ResolverTypeWrapper<BlockchainMasterSeqNoRange>;
  BlockchainQuery: ResolverTypeWrapper<BlockchainQuery>;
  String: ResolverTypeWrapper<Scalars['String']>;
  BlockchainTransaction: ResolverTypeWrapper<BlockchainTransaction>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  BlockchainTransactionEdge: ResolverTypeWrapper<BlockchainTransactionEdge>;
  BlockchainTransactionsConnection: ResolverTypeWrapper<BlockchainTransactionsConnection>;
  BounceTypeEnum: BounceTypeEnum;
  ComputeTypeEnum: ComputeTypeEnum;
  Node: ResolverTypeWrapper<Node>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  OtherCurrency: ResolverTypeWrapper<OtherCurrency>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Query: ResolverTypeWrapper<{}>;
  SkipReasonEnum: SkipReasonEnum;
  TransactionAction: ResolverTypeWrapper<TransactionAction>;
  TransactionBounce: ResolverTypeWrapper<TransactionBounce>;
  TransactionCompute: ResolverTypeWrapper<TransactionCompute>;
  TransactionCredit: ResolverTypeWrapper<TransactionCredit>;
  TransactionProcessingStatusEnum: TransactionProcessingStatusEnum;
  TransactionSplitInfo: ResolverTypeWrapper<TransactionSplitInfo>;
  TransactionStorage: ResolverTypeWrapper<TransactionStorage>;
  TransactionTypeEnum: TransactionTypeEnum;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  BlockchainMasterSeqNoFilter: BlockchainMasterSeqNoFilter;
  Int: Scalars['Int'];
  BlockchainMasterSeqNoRange: BlockchainMasterSeqNoRange;
  BlockchainQuery: BlockchainQuery;
  String: Scalars['String'];
  BlockchainTransaction: BlockchainTransaction;
  Boolean: Scalars['Boolean'];
  Float: Scalars['Float'];
  BlockchainTransactionEdge: BlockchainTransactionEdge;
  BlockchainTransactionsConnection: BlockchainTransactionsConnection;
  Node: Node;
  ID: Scalars['ID'];
  OtherCurrency: OtherCurrency;
  PageInfo: PageInfo;
  Query: {};
  TransactionAction: TransactionAction;
  TransactionBounce: TransactionBounce;
  TransactionCompute: TransactionCompute;
  TransactionCredit: TransactionCredit;
  TransactionSplitInfo: TransactionSplitInfo;
  TransactionStorage: TransactionStorage;
};

export type BlockchainMasterSeqNoRangeResolvers<ContextType = any, ParentType extends ResolversParentTypes['BlockchainMasterSeqNoRange'] = ResolversParentTypes['BlockchainMasterSeqNoRange']> = {
  start?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  end?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockchainQueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['BlockchainQuery'] = ResolversParentTypes['BlockchainQuery']> = {
  master_seq_no_range?: Resolver<Maybe<ResolversTypes['BlockchainMasterSeqNoRange']>, ParentType, ContextType, RequireFields<BlockchainQueryMaster_Seq_No_RangeArgs, never>>;
  account_transactions?: Resolver<Maybe<ResolversTypes['BlockchainTransactionsConnection']>, ParentType, ContextType, RequireFields<BlockchainQueryAccount_TransactionsArgs, never>>;
  workchain_transactions?: Resolver<Maybe<ResolversTypes['BlockchainTransactionsConnection']>, ParentType, ContextType, RequireFields<BlockchainQueryWorkchain_TransactionsArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockchainTransactionResolvers<ContextType = any, ParentType extends ResolversParentTypes['BlockchainTransaction'] = ResolversParentTypes['BlockchainTransaction']> = {
  _key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  aborted?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  account_addr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  action?: Resolver<Maybe<ResolversTypes['TransactionAction']>, ParentType, ContextType>;
  balance_delta?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<BlockchainTransactionBalance_DeltaArgs, never>>;
  balance_delta_other?: Resolver<Maybe<Array<Maybe<ResolversTypes['OtherCurrency']>>>, ParentType, ContextType>;
  block_id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  boc?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bounce?: Resolver<Maybe<ResolversTypes['TransactionBounce']>, ParentType, ContextType>;
  chain_order?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  compute?: Resolver<Maybe<ResolversTypes['TransactionCompute']>, ParentType, ContextType>;
  credit?: Resolver<Maybe<ResolversTypes['TransactionCredit']>, ParentType, ContextType>;
  credit_first?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  destroyed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  end_status?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  end_status_name?: Resolver<Maybe<ResolversTypes['AccountStatusEnum']>, ParentType, ContextType>;
  hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  in_msg?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  installed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  lt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<BlockchainTransactionLtArgs, never>>;
  new_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  now?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  now_string?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  old_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  orig_status?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  orig_status_name?: Resolver<Maybe<ResolversTypes['AccountStatusEnum']>, ParentType, ContextType>;
  out_msgs?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  outmsg_cnt?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  prepare_transaction?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  prev_trans_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  prev_trans_lt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<BlockchainTransactionPrev_Trans_LtArgs, never>>;
  proof?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  split_info?: Resolver<Maybe<ResolversTypes['TransactionSplitInfo']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status_name?: Resolver<Maybe<ResolversTypes['TransactionProcessingStatusEnum']>, ParentType, ContextType>;
  storage?: Resolver<Maybe<ResolversTypes['TransactionStorage']>, ParentType, ContextType>;
  total_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<BlockchainTransactionTotal_FeesArgs, never>>;
  total_fees_other?: Resolver<Maybe<Array<Maybe<ResolversTypes['OtherCurrency']>>>, ParentType, ContextType>;
  tr_type?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  tr_type_name?: Resolver<Maybe<ResolversTypes['TransactionTypeEnum']>, ParentType, ContextType>;
  tt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  workchain_id?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockchainTransactionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['BlockchainTransactionEdge'] = ResolversParentTypes['BlockchainTransactionEdge']> = {
  node?: Resolver<ResolversTypes['BlockchainTransaction'], ParentType, ContextType>;
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type BlockchainTransactionsConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['BlockchainTransactionsConnection'] = ResolversParentTypes['BlockchainTransactionsConnection']> = {
  edges?: Resolver<Array<ResolversTypes['BlockchainTransactionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type NodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Node'] = ResolversParentTypes['Node']> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OtherCurrencyResolvers<ContextType = any, ParentType extends ResolversParentTypes['OtherCurrency'] = ResolversParentTypes['OtherCurrency']> = {
  currency?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<OtherCurrencyValueArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  startCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endCursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  blockchain?: Resolver<Maybe<ResolversTypes['BlockchainQuery']>, ParentType, ContextType>;
};

export type TransactionActionResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionAction'] = ResolversParentTypes['TransactionAction']> = {
  action_list_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  msgs_created?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  no_funds?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  result_arg?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  result_code?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  skipped_actions?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  spec_actions?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status_change?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status_change_name?: Resolver<Maybe<ResolversTypes['AccountStatusChangeEnum']>, ParentType, ContextType>;
  success?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  tot_actions?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  total_action_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionActionTotal_Action_FeesArgs, never>>;
  total_fwd_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionActionTotal_Fwd_FeesArgs, never>>;
  total_msg_size_bits?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  total_msg_size_cells?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  valid?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionBounceResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionBounce'] = ResolversParentTypes['TransactionBounce']> = {
  bounce_type?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  bounce_type_name?: Resolver<Maybe<ResolversTypes['BounceTypeEnum']>, ParentType, ContextType>;
  fwd_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionBounceFwd_FeesArgs, never>>;
  msg_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionBounceMsg_FeesArgs, never>>;
  msg_size_bits?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  msg_size_cells?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  req_fwd_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionBounceReq_Fwd_FeesArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionComputeResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionCompute'] = ResolversParentTypes['TransactionCompute']> = {
  account_activated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  compute_type?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  compute_type_name?: Resolver<Maybe<ResolversTypes['ComputeTypeEnum']>, ParentType, ContextType>;
  exit_arg?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  exit_code?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  gas_credit?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  gas_fees?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionComputeGas_FeesArgs, never>>;
  gas_limit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionComputeGas_LimitArgs, never>>;
  gas_used?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionComputeGas_UsedArgs, never>>;
  mode?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  msg_state_used?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  skipped_reason?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  skipped_reason_name?: Resolver<Maybe<ResolversTypes['SkipReasonEnum']>, ParentType, ContextType>;
  success?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  vm_final_state_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vm_init_state_hash?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  vm_steps?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionCreditResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionCredit'] = ResolversParentTypes['TransactionCredit']> = {
  credit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionCreditCreditArgs, never>>;
  credit_other?: Resolver<Maybe<Array<Maybe<ResolversTypes['OtherCurrency']>>>, ParentType, ContextType>;
  due_fees_collected?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionCreditDue_Fees_CollectedArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionSplitInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionSplitInfo'] = ResolversParentTypes['TransactionSplitInfo']> = {
  acc_split_depth?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  cur_shard_pfx_len?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  sibling_addr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  this_addr?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TransactionStorageResolvers<ContextType = any, ParentType extends ResolversParentTypes['TransactionStorage'] = ResolversParentTypes['TransactionStorage']> = {
  status_change?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status_change_name?: Resolver<Maybe<ResolversTypes['AccountStatusChangeEnum']>, ParentType, ContextType>;
  storage_fees_collected?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionStorageStorage_Fees_CollectedArgs, never>>;
  storage_fees_due?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<TransactionStorageStorage_Fees_DueArgs, never>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  BlockchainMasterSeqNoRange?: BlockchainMasterSeqNoRangeResolvers<ContextType>;
  BlockchainQuery?: BlockchainQueryResolvers<ContextType>;
  BlockchainTransaction?: BlockchainTransactionResolvers<ContextType>;
  BlockchainTransactionEdge?: BlockchainTransactionEdgeResolvers<ContextType>;
  BlockchainTransactionsConnection?: BlockchainTransactionsConnectionResolvers<ContextType>;
  Node?: NodeResolvers<ContextType>;
  OtherCurrency?: OtherCurrencyResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  TransactionAction?: TransactionActionResolvers<ContextType>;
  TransactionBounce?: TransactionBounceResolvers<ContextType>;
  TransactionCompute?: TransactionComputeResolvers<ContextType>;
  TransactionCredit?: TransactionCreditResolvers<ContextType>;
  TransactionSplitInfo?: TransactionSplitInfoResolvers<ContextType>;
  TransactionStorage?: TransactionStorageResolvers<ContextType>;
};

