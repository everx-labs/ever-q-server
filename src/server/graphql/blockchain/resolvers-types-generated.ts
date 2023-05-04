import { GraphQLResolveInfo } from "graphql"
export type Maybe<T> = T | null | undefined
export type Exact<T extends { [key: string]: unknown }> = {
    [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
    { [SubKey in K]: Maybe<T[SubKey]> }
export type RequireFields<T, K extends keyof T> = {
    [X in Exclude<keyof T, K>]?: T[X]
} &
    { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string
    String: string
    Boolean: boolean
    Int: number
    Float: number
}

export enum AccountStatusChangeEnum {
    Deleted = "Deleted",
    Frozen = "Frozen",
    Unchanged = "Unchanged",
}

export enum AccountStatusEnum {
    Uninit = "Uninit",
    Active = "Active",
    Frozen = "Frozen",
    NonExist = "NonExist",
}

/**
 * Due to GraphQL limitations big numbers are returned as a string.
 * You can specify format used to string representation for big integers.
 */
export enum BigIntFormat {
    /**  Hexadecimal representation started with 0x (default)  */
    Hex = "HEX",
    /**  Decimal representation  */
    Dec = "DEC",
}

export type BlockAccountBlocks = {
    __typename?: "BlockAccountBlocks"
    account_addr?: Maybe<Scalars["String"]>
    /** new version of block hashes */
    new_hash?: Maybe<Scalars["String"]>
    /** old version of block hashes */
    old_hash?: Maybe<Scalars["String"]>
    tr_count?: Maybe<Scalars["Int"]>
    transactions?: Maybe<Array<Maybe<BlockAccountBlocksTransactions>>>
}

export type BlockAccountBlocksTransactions = {
    __typename?: "BlockAccountBlocksTransactions"
    lt?: Maybe<Scalars["String"]>
    total_fees?: Maybe<Scalars["String"]>
    total_fees_other?: Maybe<Array<Maybe<OtherCurrency>>>
    transaction_id?: Maybe<Scalars["String"]>
}

export type BlockAccountBlocksTransactionsLtArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockAccountBlocksTransactionsTotal_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockLimits = {
    __typename?: "BlockLimits"
    bytes?: Maybe<BlockLimitsBytes>
    gas?: Maybe<BlockLimitsGas>
    lt_delta?: Maybe<BlockLimitsLtDelta>
}

export type BlockLimitsBytes = {
    __typename?: "BlockLimitsBytes"
    hard_limit?: Maybe<Scalars["Float"]>
    soft_limit?: Maybe<Scalars["Float"]>
    underload?: Maybe<Scalars["Float"]>
}

export type BlockLimitsGas = {
    __typename?: "BlockLimitsGas"
    hard_limit?: Maybe<Scalars["Float"]>
    soft_limit?: Maybe<Scalars["Float"]>
    underload?: Maybe<Scalars["Float"]>
}

export type BlockLimitsLtDelta = {
    __typename?: "BlockLimitsLtDelta"
    hard_limit?: Maybe<Scalars["Float"]>
    soft_limit?: Maybe<Scalars["Float"]>
    underload?: Maybe<Scalars["Float"]>
}

export type BlockMaster = {
    __typename?: "BlockMaster"
    config?: Maybe<Config>
    config_addr?: Maybe<Scalars["String"]>
    /** Max block generation time of shards */
    max_shard_gen_utime?: Maybe<Scalars["Float"]>
    max_shard_gen_utime_string?: Maybe<Scalars["String"]>
    /** Min block generation time of shards */
    min_shard_gen_utime?: Maybe<Scalars["Float"]>
    min_shard_gen_utime_string?: Maybe<Scalars["String"]>
    prev_blk_signatures?: Maybe<Array<Maybe<BlockMasterPrevBlkSignatures>>>
    recover_create_msg?: Maybe<InMsg>
    shard_fees?: Maybe<Array<Maybe<BlockMasterShardFees>>>
    shard_hashes?: Maybe<Array<Maybe<BlockMasterShardHashes>>>
}

export type BlockMasterPrevBlkSignatures = {
    __typename?: "BlockMasterPrevBlkSignatures"
    node_id?: Maybe<Scalars["String"]>
    r?: Maybe<Scalars["String"]>
    s?: Maybe<Scalars["String"]>
}

export type BlockMasterShardFees = {
    __typename?: "BlockMasterShardFees"
    /** Amount of fees created during shard */
    create?: Maybe<Scalars["String"]>
    /** Amount of non gram fees created in non gram crypto currencies during the block. */
    create_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of fees in grams */
    fees?: Maybe<Scalars["String"]>
    /** Array of fees in non gram crypto currencies */
    fees_other?: Maybe<Array<Maybe<OtherCurrency>>>
    shard?: Maybe<Scalars["String"]>
    workchain_id?: Maybe<Scalars["Int"]>
}

export type BlockMasterShardFeesCreateArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockMasterShardFeesFeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockMasterShardHashes = {
    __typename?: "BlockMasterShardHashes"
    /** Shard description */
    descr?: Maybe<BlockMasterShardHashesDescr>
    /** Shard ID */
    shard?: Maybe<Scalars["String"]>
    /** Uint32 workchain ID */
    workchain_id?: Maybe<Scalars["Int"]>
}

/** Shard description */
export type BlockMasterShardHashesDescr = {
    __typename?: "BlockMasterShardHashesDescr"
    before_merge?: Maybe<Scalars["Boolean"]>
    /**
     * TON Blockchain supports dynamic sharding, so the shard configuration may change from block to block because of shard merge and split events. Therefore, we cannot simply say that each shardchain corresponds to a fixed set of account chains.
     * A shardchain block and its state may each be classified into two distinct parts. The parts with the ISP-dictated form of will be called the split parts of the block and its state, while the remainder will be called the non-split parts.
     * The masterchain cannot be split or merged.
     */
    before_split?: Maybe<Scalars["Boolean"]>
    /** Logical time of the shardchain end */
    end_lt?: Maybe<Scalars["String"]>
    /** Amount of fees collected int his shard in grams. */
    fees_collected?: Maybe<Scalars["String"]>
    /** Amount of fees collected int his shard in non gram currencies. */
    fees_collected_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Shard block file hash. */
    file_hash?: Maybe<Scalars["String"]>
    flags?: Maybe<Scalars["Int"]>
    /** Amount of funds created in this shard in grams. */
    funds_created?: Maybe<Scalars["String"]>
    /** Amount of funds created in this shard in non gram currencies. */
    funds_created_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Generation time in uint32 */
    gen_utime?: Maybe<Scalars["Float"]>
    gen_utime_string?: Maybe<Scalars["String"]>
    min_ref_mc_seqno?: Maybe<Scalars["Float"]>
    next_catchain_seqno?: Maybe<Scalars["Float"]>
    next_validator_shard?: Maybe<Scalars["String"]>
    nx_cc_updated?: Maybe<Scalars["Boolean"]>
    /** Returns last known master block at the time of shard generation. */
    reg_mc_seqno?: Maybe<Scalars["Float"]>
    /** Returns last known master block at the time of shard generation. The shard block configuration is derived from that block. */
    root_hash?: Maybe<Scalars["String"]>
    /** uint32 sequence number */
    seq_no?: Maybe<Scalars["Float"]>
    split?: Maybe<Scalars["Float"]>
    /**
     * - 0 – none
     * - 2 – split
     * - 3 – merge
     */
    split_type?: Maybe<Scalars["Int"]>
    split_type_name?: Maybe<SplitTypeEnum>
    /** Logical time of the shardchain start */
    start_lt?: Maybe<Scalars["String"]>
    want_merge?: Maybe<Scalars["Boolean"]>
    want_split?: Maybe<Scalars["Boolean"]>
}

/** Shard description */
export type BlockMasterShardHashesDescrEnd_LtArgs = {
    format?: Maybe<BigIntFormat>
}

/** Shard description */
export type BlockMasterShardHashesDescrFees_CollectedArgs = {
    format?: Maybe<BigIntFormat>
}

/** Shard description */
export type BlockMasterShardHashesDescrFunds_CreatedArgs = {
    format?: Maybe<BigIntFormat>
}

/** Shard description */
export type BlockMasterShardHashesDescrStart_LtArgs = {
    format?: Maybe<BigIntFormat>
}

export enum BlockProcessingStatusEnum {
    Unknown = "Unknown",
    Proposed = "Proposed",
    Finalized = "Finalized",
    Refused = "Refused",
}

export type BlockSignature = {
    __typename?: "BlockSignature"
    node_id?: Maybe<Scalars["String"]>
    r?: Maybe<Scalars["String"]>
    s?: Maybe<Scalars["String"]>
}

export type BlockStateUpdate = {
    __typename?: "BlockStateUpdate"
    new?: Maybe<Scalars["String"]>
    new_depth?: Maybe<Scalars["Int"]>
    new_hash?: Maybe<Scalars["String"]>
    old?: Maybe<Scalars["String"]>
    old_depth?: Maybe<Scalars["Int"]>
    old_hash?: Maybe<Scalars["String"]>
}

export type BlockValueFlow = {
    __typename?: "BlockValueFlow"
    created?: Maybe<Scalars["String"]>
    created_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of grams exported. */
    exported?: Maybe<Scalars["String"]>
    /** Amount of non gram cryptocurrencies exported. */
    exported_other?: Maybe<Array<Maybe<OtherCurrency>>>
    fees_collected?: Maybe<Scalars["String"]>
    fees_collected_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of import fees in grams */
    fees_imported?: Maybe<Scalars["String"]>
    /** Amount of import fees in non gram currencies. */
    fees_imported_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of grams transferred from previous block. */
    from_prev_blk?: Maybe<Scalars["String"]>
    /** Amount of non gram cryptocurrencies transferred from previous block. */
    from_prev_blk_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of grams imported. */
    imported?: Maybe<Scalars["String"]>
    /** Amount of non gram cryptocurrencies imported. */
    imported_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of grams minted in this block. */
    minted?: Maybe<Scalars["String"]>
    minted_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Amount of grams amount to the next block. */
    to_next_blk?: Maybe<Scalars["String"]>
    /** Amount of non gram cryptocurrencies to the next block. */
    to_next_blk_other?: Maybe<Array<Maybe<OtherCurrency>>>
}

export type BlockValueFlowCreatedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowExportedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowFees_CollectedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowFees_ImportedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowFrom_Prev_BlkArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowImportedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowMintedArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockValueFlowTo_Next_BlkArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccount = Node & {
    __typename?: "BlockchainAccount"
    _key: Scalars["String"]
    /**
     * Returns the current status of the account.
     *
     * - 0 – uninit
     * - 1 – active
     * - 2 – frozen
     * - 3 – nonExist
     */
    acc_type?: Maybe<Scalars["Int"]>
    acc_type_name?: Maybe<AccountStatusEnum>
    address?: Maybe<Scalars["String"]>
    balance?: Maybe<Scalars["String"]>
    balance_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** Contains sum of all the bits used by the cells of the account. Used in storage fee calculation */
    bits?: Maybe<Scalars["String"]>
    /** Bag of cells with the account struct encoded as base64. */
    boc?: Maybe<Scalars["String"]>
    /** Contains number of the cells of the account. Used in storage fee calculation */
    cells?: Maybe<Scalars["String"]>
    /** If present, contains smart-contract code encoded with in base64. */
    code?: Maybe<Scalars["String"]>
    /** `code` field root hash. */
    code_hash?: Maybe<Scalars["String"]>
    /** If present, contains smart-contract data encoded with in base64. */
    data?: Maybe<Scalars["String"]>
    /** `data` field root hash. */
    data_hash?: Maybe<Scalars["String"]>
    /**
     * If present, accumulates the storage payments that could not be exacted from
     * the balance of the account, represented by a strictly positive amount of nano
     * tokens; it can be present only for uninitialized or frozen accounts that have
     * a balance of zero Grams (but may have non-zero balances in non gram
     * cryptocurrencies). When due_payment becomes larger than the value of a
     * configurable parameter of the blockchain, the ac- count is destroyed
     * altogether, and its balance, if any, is transferred to the zero account.
     */
    due_payment?: Maybe<Scalars["String"]>
    /**
     * BlockchainAccount.id is "account/"-prefixed Account.id.
     * For id without prefix see "address".
     */
    id: Scalars["ID"]
    /** account 's initial code hash (when it was deployed) */
    init_code_hash?: Maybe<Scalars["String"]>
    /**
     * Contains either the unixtime of the most recent storage payment
     * collected (usually this is the unixtime of the most recent transaction),
     * or the unixtime when the account was created (again, by a transaction).
     */
    last_paid?: Maybe<Scalars["Float"]>
    last_trans_lt?: Maybe<Scalars["String"]>
    /** If present, contains library code used in smart-contract. */
    library?: Maybe<Scalars["String"]>
    /** `library` field root hash. */
    library_hash?: Maybe<Scalars["String"]>
    prev_code_hash?: Maybe<Scalars["String"]>
    /** Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64. */
    proof?: Maybe<Scalars["String"]>
    /** Contains the number of public cells of the account. Used in storage fee calculation. */
    public_cells?: Maybe<Scalars["String"]>
    /** Is present and non-zero only in instances of large smart contracts. */
    split_depth?: Maybe<Scalars["Int"]>
    /** Contains the representation hash of an instance of `StateInit` when an account is frozen. */
    state_hash?: Maybe<Scalars["String"]>
    /**
     * May be present only in the masterchain—and within the masterchain, only in some
     * fundamental smart contracts required for the whole system to function.
     */
    tick?: Maybe<Scalars["Boolean"]>
    /**
     * May be present only in the masterchain—and within the masterchain, only in some
     * fundamental smart contracts required for the whole system to function.
     */
    tock?: Maybe<Scalars["Boolean"]>
    /** Workchain id of the account address (id field). */
    workchain_id?: Maybe<Scalars["Int"]>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountBalanceArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountBitsArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountCellsArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountDue_PaymentArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountLast_Trans_LtArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Account type
 *
 * Recall that a smart contract and an account are the same thing in the context
 * of the TON Blockchain, and that these terms can be used interchangeably, at
 * least as long as only small (or “usual”) smart contracts are considered. A large
 * smart-contract may employ several accounts lying in different shardchains of
 * the same workchain for load balancing purposes.
 *
 * An account is identified by its full address and is completely described by
 * its state. In other words, there is nothing else in an account apart from its
 * address and state.
 */
export type BlockchainAccountPublic_CellsArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockchainAccountQuery = {
    __typename?: "BlockchainAccountQuery"
    address: Scalars["String"]
    /** Account information (e.g. boc). */
    info?: Maybe<BlockchainAccount>
    /** This node could be used for a cursor-based pagination of account messages. */
    messages?: Maybe<BlockchainMessagesConnection>
    /** This node could be used for a cursor-based pagination of account transactions. */
    transactions?: Maybe<BlockchainTransactionsConnection>
}

export type BlockchainAccountQueryMessagesArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    counterparties?: Maybe<Array<Scalars["String"]>>
    msg_type?: Maybe<Array<BlockchainMessageTypeFilterEnum>>
    min_value?: Maybe<Scalars["String"]>
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

export type BlockchainAccountQueryTransactionsArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    aborted?: Maybe<Scalars["Boolean"]>
    min_balance_delta?: Maybe<Scalars["String"]>
    max_balance_delta?: Maybe<Scalars["String"]>
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

/** Block */
export type BlockchainBlock = Node & {
    __typename?: "BlockchainBlock"
    _key: Scalars["String"]
    account_blocks?: Maybe<Array<Maybe<BlockAccountBlocks>>>
    after_merge?: Maybe<Scalars["Boolean"]>
    after_split?: Maybe<Scalars["Boolean"]>
    before_split?: Maybe<Scalars["Boolean"]>
    /** Serialized bag of cells of this block encoded with base64 */
    boc?: Maybe<Scalars["String"]>
    /** Collection-unique field for pagination and sorting. This field is designed to retain logical order. */
    chain_order?: Maybe<Scalars["String"]>
    /** Public key of the collator who produced this block. */
    created_by?: Maybe<Scalars["String"]>
    /** Logical creation time automatically set by the block formation end. */
    end_lt?: Maybe<Scalars["String"]>
    /** Block file hash */
    file_hash?: Maybe<Scalars["String"]>
    flags?: Maybe<Scalars["Int"]>
    gen_catchain_seqno?: Maybe<Scalars["Float"]>
    gen_software_capabilities?: Maybe<Scalars["String"]>
    gen_software_version?: Maybe<Scalars["Float"]>
    /** uint 32 generation time stamp */
    gen_utime?: Maybe<Scalars["Float"]>
    gen_utime_string?: Maybe<Scalars["String"]>
    gen_validator_list_hash_short?: Maybe<Scalars["Float"]>
    /** uint32 global block ID */
    global_id?: Maybe<Scalars["Int"]>
    hash?: Maybe<Scalars["String"]>
    /**
     * BlockchainBlock.id is "block/"-prefixed Block.id.
     * For id without prefix see "hash".
     */
    id: Scalars["ID"]
    in_msg_descr?: Maybe<Array<Maybe<InMsg>>>
    /** true if this block is a key block */
    key_block?: Maybe<Scalars["Boolean"]>
    master?: Maybe<BlockMaster>
    master_ref?: Maybe<ExtBlkRef>
    /** Returns last known master block at the time of shard generation. */
    min_ref_mc_seqno?: Maybe<Scalars["Float"]>
    out_msg_descr?: Maybe<Array<Maybe<OutMsg>>>
    /** External block reference for previous block in case of shard merge. */
    prev_alt_ref?: Maybe<ExtBlkRef>
    /** Returns a number of a previous key block. */
    prev_key_block_seqno?: Maybe<Scalars["Float"]>
    /** External block reference for previous block. */
    prev_ref?: Maybe<ExtBlkRef>
    prev_vert_alt_ref?: Maybe<ExtBlkRef>
    /** External block reference for previous block in case of vertical blocks. */
    prev_vert_ref?: Maybe<ExtBlkRef>
    rand_seed?: Maybe<Scalars["String"]>
    seq_no?: Maybe<Scalars["Float"]>
    shard?: Maybe<Scalars["String"]>
    signatures?: Maybe<BlockchainBlockSignatures>
    /**
     * Logical creation time automatically set by the block formation start.
     * Logical time is a component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see the TON blockchain specification
     */
    start_lt?: Maybe<Scalars["String"]>
    state_update?: Maybe<BlockStateUpdate>
    /**
     * Returns block processing status
     * - 0 – unknown
     * - 1 – proposed
     * - 2 – finalized
     * - 3 – refused
     */
    status?: Maybe<Scalars["Int"]>
    status_name?: Maybe<BlockProcessingStatusEnum>
    tr_count?: Maybe<Scalars["Int"]>
    value_flow?: Maybe<BlockValueFlow>
    /** uin32 block version identifier */
    version?: Maybe<Scalars["Float"]>
    vert_seq_no?: Maybe<Scalars["Float"]>
    want_merge?: Maybe<Scalars["Boolean"]>
    want_split?: Maybe<Scalars["Boolean"]>
    /** uint32 workchain identifier */
    workchain_id?: Maybe<Scalars["Int"]>
}

/** Block */
export type BlockchainBlockEnd_LtArgs = {
    format?: Maybe<BigIntFormat>
}

/** Block */
export type BlockchainBlockGen_Software_CapabilitiesArgs = {
    format?: Maybe<BigIntFormat>
}

/** Block */
export type BlockchainBlockStart_LtArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockchainBlockSignatures = {
    __typename?: "BlockchainBlockSignatures"
    gen_utime?: Maybe<Scalars["Float"]>
    seq_no?: Maybe<Scalars["Float"]>
    shard?: Maybe<Scalars["String"]>
    workchain_id?: Maybe<Scalars["Int"]>
    proof?: Maybe<Scalars["String"]>
    validator_list_hash_short?: Maybe<Scalars["Int"]>
    catchain_seqno?: Maybe<Scalars["Int"]>
    sig_weight?: Maybe<Scalars["String"]>
    signatures?: Maybe<Array<Maybe<BlockSignature>>>
}

export type BlockchainBlockSignaturesSig_WeightArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockchainBlocksConnection = {
    __typename?: "BlockchainBlocksConnection"
    edges: Array<BlockchainBlocksEdge>
    pageInfo: PageInfo
}

export type BlockchainBlocksEdge = {
    __typename?: "BlockchainBlocksEdge"
    node: BlockchainBlock
    cursor: Scalars["String"]
}

export type BlockchainMasterSeqNoFilter = {
    /** Minimum inclusive seq_no of corresponding master blocks */
    start?: Maybe<Scalars["Int"]>
    /** Maximum exclusive seq_no of corresponding master blocks */
    end?: Maybe<Scalars["Int"]>
}

export type BlockchainMasterSeqNoRange = {
    __typename?: "BlockchainMasterSeqNoRange"
    /**
     * INCLUSIVE seq_no range border.
     * Masterchain block seq_no that corresponds to the specified time_start left border of
     * time interval.
     * Can be used to define pagination range in functions, providing cursor-based pagination.
     *
     * If no corresponding masterchain block was found, null is returned. It may happen when the
     * time_start timestamp refers to the historic data which is not available.
     */
    start?: Maybe<Scalars["Int"]>
    /**
     * EXCLUSIVE seq_no range border.
     * Masterchain block seq_no that corresponds to the specified time_end right border of
     * time interval.
     * Can be used to define pagination range in functions, providing cursor-based pagination.
     *
     * If no seq_no was found, returns `null`.
     * This may happen if there is no corresponding masterchain block yet for
     * the specified `time_end` timestamp when `time_end` is close to `now`. We recommend
     * ommiting the right border seq_no for recent data pagination.
     */
    end?: Maybe<Scalars["Int"]>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessage = Node & {
    __typename?: "BlockchainMessage"
    _key: Scalars["String"]
    /** Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64. */
    block_id?: Maybe<Scalars["String"]>
    /** A bag of cells with the message structure encoded as base64. */
    boc?: Maybe<Scalars["String"]>
    /** Bag of cells with the message body encoded as base64. */
    body?: Maybe<Scalars["String"]>
    /** `body` field root hash. */
    body_hash?: Maybe<Scalars["String"]>
    /** Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender. */
    bounce?: Maybe<Scalars["Boolean"]>
    /** Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender. */
    bounced?: Maybe<Scalars["Boolean"]>
    /** Collection-unique field for pagination and sorting. This field is designed to retain logical output order (for logical input order use transaction.in_message). */
    chain_order?: Maybe<Scalars["String"]>
    /** Represents contract code in deploy messages. */
    code?: Maybe<Scalars["String"]>
    /** `code` field root hash. */
    code_hash?: Maybe<Scalars["String"]>
    /** Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction. */
    created_at?: Maybe<Scalars["Float"]>
    created_at_string?: Maybe<Scalars["String"]>
    /** Logical creation time automatically set by the generating transaction. */
    created_lt?: Maybe<Scalars["String"]>
    /** Represents initial data for a contract in deploy messages */
    data?: Maybe<Scalars["String"]>
    /** `data` field root hash. */
    data_hash?: Maybe<Scalars["String"]>
    /** Returns destination address string */
    dst?: Maybe<Scalars["String"]>
    /** The destination account */
    dst_account?: Maybe<BlockchainAccount>
    dst_chain_order?: Maybe<Scalars["String"]>
    /** The transaction in which this message is in_msg */
    dst_transaction?: Maybe<BlockchainTransaction>
    /** Workchain id of the destination address (dst field) */
    dst_workchain_id?: Maybe<Scalars["Int"]>
    /** Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated. */
    fwd_fee?: Maybe<Scalars["String"]>
    hash?: Maybe<Scalars["String"]>
    /**
     * BlockchainMessage.id is "message/"-prefixed Message.id.
     * For id without prefix see "hash".
     */
    id: Scalars["ID"]
    /** IHR is disabled for the message. */
    ihr_disabled?: Maybe<Scalars["Boolean"]>
    /** This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism. */
    ihr_fee?: Maybe<Scalars["String"]>
    import_fee?: Maybe<Scalars["String"]>
    /** Represents contract library in deploy messages */
    library?: Maybe<Scalars["String"]>
    /** `library` field root hash. */
    library_hash?: Maybe<Scalars["String"]>
    /**
     * Returns the type of message.
     * - 0 – internal
     * - 1 – extIn
     * - 2 – extOut
     */
    msg_type?: Maybe<Scalars["Int"]>
    msg_type_name?: Maybe<MessageTypeEnum>
    /** Merkle proof that message is a part of a block it cut from. It is a bag of cells with Merkle proof struct encoded as base64. */
    proof?: Maybe<Scalars["String"]>
    /** This is only used for special contracts in masterchain to deploy messages. */
    split_depth?: Maybe<Scalars["Int"]>
    /** Returns source address string */
    src?: Maybe<Scalars["String"]>
    /** The source account */
    src_account?: Maybe<BlockchainAccount>
    src_chain_order?: Maybe<Scalars["String"]>
    /** The transaction in which this message is included to out_msgs */
    src_transaction?: Maybe<BlockchainTransaction>
    /** Workchain id of the source address (src field) */
    src_workchain_id?: Maybe<Scalars["Int"]>
    /**
     * Returns internal processing status according to the numbers shown.
     * - 0 – unknown
     * - 1 – queued
     * - 2 – processing
     * - 3 – preliminary
     * - 4 – proposed
     * - 5 – finalized
     * - 6 – refused
     * - 7 – transiting
     */
    status?: Maybe<Scalars["Int"]>
    status_name?: Maybe<MessageProcessingStatusEnum>
    /** This is only used for special contracts in masterchain to deploy messages. */
    tick?: Maybe<Scalars["Boolean"]>
    /** This is only used for special contracts in masterchain to deploy messages */
    tock?: Maybe<Scalars["Boolean"]>
    /** May or may not be present */
    value?: Maybe<Scalars["String"]>
    /** May or may not be present. */
    value_other?: Maybe<Array<Maybe<OtherCurrency>>>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessageCreated_LtArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessageFwd_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessageIhr_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessageImport_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/**
 * # Message type
 *
 * Message layout queries.  A message consists of its header followed by its
 * body or payload. The body is essentially arbitrary, to be interpreted by the
 * destination smart contract. It can be queried with the following fields:
 */
export type BlockchainMessageValueArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockchainMessageEdge = {
    __typename?: "BlockchainMessageEdge"
    node: BlockchainMessage
    cursor: Scalars["String"]
}

export enum BlockchainMessageTypeFilterEnum {
    /** External inbound */
    ExtIn = "ExtIn",
    /** External outbound */
    ExtOut = "ExtOut",
    /** Internal inbound */
    IntIn = "IntIn",
    /** Internal outbound */
    IntOut = "IntOut",
}

export type BlockchainMessagesConnection = {
    __typename?: "BlockchainMessagesConnection"
    edges: Array<BlockchainMessageEdge>
    pageInfo: PageInfo
}

export type BlockchainQuery = {
    __typename?: "BlockchainQuery"
    /** Account-related information */
    account?: Maybe<BlockchainAccountQuery>
    block?: Maybe<BlockchainBlock>
    block_by_seq_no?: Maybe<BlockchainBlock>
    transaction?: Maybe<BlockchainTransaction>
    message?: Maybe<BlockchainMessage>
    /**
     * Returns masterchain seq_no range for the specified time range
     * to be used further in pagination functions.
     * If `time_start` and/or `time_end` is null, then the corresponding seq_no range border
     * is also null.
     */
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoRange>
    /** This node could be used for a cursor-based pagination of key blocks. */
    key_blocks?: Maybe<BlockchainBlocksConnection>
    /** This node could be used for a cursor-based pagination of blocks. */
    blocks?: Maybe<BlockchainBlocksConnection>
    /** This node could be used for a cursor-based pagination of transactions. */
    transactions?: Maybe<BlockchainTransactionsConnection>
}

export type BlockchainQueryAccountArgs = {
    address: Scalars["String"]
}

export type BlockchainQueryBlockArgs = {
    hash: Scalars["String"]
}

export type BlockchainQueryBlock_By_Seq_NoArgs = {
    workchain: Scalars["Int"]
    thread: Scalars["String"]
    seq_no: Scalars["Float"]
}

export type BlockchainQueryTransactionArgs = {
    hash: Scalars["String"]
}

export type BlockchainQueryMessageArgs = {
    hash: Scalars["String"]
}

export type BlockchainQueryMaster_Seq_No_RangeArgs = {
    time_start?: Maybe<Scalars["Int"]>
    time_end?: Maybe<Scalars["Int"]>
}

export type BlockchainQueryKey_BlocksArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

export type BlockchainQueryBlocksArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    workchain?: Maybe<Scalars["Int"]>
    thread?: Maybe<Scalars["String"]>
    min_tr_count?: Maybe<Scalars["Int"]>
    max_tr_count?: Maybe<Scalars["Int"]>
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

export type BlockchainQueryTransactionsArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    workchain?: Maybe<Scalars["Int"]>
    min_balance_delta?: Maybe<Scalars["String"]>
    max_balance_delta?: Maybe<Scalars["String"]>
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

/** Transaction */
export type BlockchainTransaction = Node & {
    __typename?: "BlockchainTransaction"
    _key: Scalars["String"]
    aborted?: Maybe<Scalars["Boolean"]>
    account?: Maybe<BlockchainAccount>
    account_addr?: Maybe<Scalars["String"]>
    action?: Maybe<TransactionAction>
    /** Account balance change after transaction */
    balance_delta?: Maybe<Scalars["String"]>
    /** Account balance change after transaction */
    balance_delta_other?: Maybe<Array<Maybe<OtherCurrency>>>
    block_id?: Maybe<Scalars["String"]>
    boc?: Maybe<Scalars["String"]>
    bounce?: Maybe<TransactionBounce>
    /** Collection-unique field for pagination and sorting. This field is designed to retain logical order. */
    chain_order?: Maybe<Scalars["String"]>
    compute?: Maybe<TransactionCompute>
    credit?: Maybe<TransactionCredit>
    credit_first?: Maybe<Scalars["Boolean"]>
    destroyed?: Maybe<Scalars["Boolean"]>
    /**
     * The end state of an account after a transaction, 1 is returned to indicate a finalized transaction at an active account
     * - 0 – uninit
     * - 1 – active
     * - 2 – frozen
     * - 3 – nonExist
     */
    end_status?: Maybe<Scalars["Int"]>
    end_status_name?: Maybe<AccountStatusEnum>
    /** Fee for inbound external message import. */
    ext_in_msg_fee?: Maybe<Scalars["String"]>
    hash?: Maybe<Scalars["String"]>
    /**
     * BlockchainTransaction.id is "transaction/"-prefixed Transaction.id.
     * For id without prefix see "hash".
     */
    id: Scalars["ID"]
    in_message?: Maybe<BlockchainMessage>
    in_msg?: Maybe<Scalars["String"]>
    installed?: Maybe<Scalars["Boolean"]>
    /** Logical time. A component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see [the TON blockchain specification](https://test.ton.org/tblkch.pdf). */
    lt?: Maybe<Scalars["String"]>
    /** Merkle update field */
    new_hash?: Maybe<Scalars["String"]>
    now?: Maybe<Scalars["Float"]>
    now_string?: Maybe<Scalars["String"]>
    /** Merkle update field */
    old_hash?: Maybe<Scalars["String"]>
    /**
     * The initial state of account. Note that in this case the query may return 0, if the account was not active before the transaction and 1 if it was already active
     * - 0 – uninit
     * - 1 – active
     * - 2 – frozen
     * - 3 – nonExist
     */
    orig_status?: Maybe<Scalars["Int"]>
    orig_status_name?: Maybe<AccountStatusEnum>
    out_messages?: Maybe<Array<Maybe<BlockchainMessage>>>
    out_msgs?: Maybe<Array<Maybe<Scalars["String"]>>>
    /** The number of generated outbound messages (one of the common transaction parameters defined by the specification) */
    outmsg_cnt?: Maybe<Scalars["Int"]>
    prepare_transaction?: Maybe<Scalars["String"]>
    prev_trans_hash?: Maybe<Scalars["String"]>
    prev_trans_lt?: Maybe<Scalars["String"]>
    proof?: Maybe<Scalars["String"]>
    split_info?: Maybe<TransactionSplitInfo>
    /**
     * Transaction processing status
     * - 0 – unknown
     * - 1 – preliminary
     * - 2 – proposed
     * - 3 – finalized
     * - 4 – refused
     */
    status?: Maybe<Scalars["Int"]>
    status_name?: Maybe<TransactionProcessingStatusEnum>
    storage?: Maybe<TransactionStorage>
    /**
     * Total amount of fees collected by the validators.
     * Because fwd_fee is collected by the validators of the receiving shard,
     * total_fees value does not include Sum(out_msg.fwd_fee[]), but includes in_msg.fwd_fee.
     * The formula is:
     * total_fees = in_msg.value - balance_delta - Sum(out_msg.value[]) - Sum(out_msg.fwd_fee[])
     */
    total_fees?: Maybe<Scalars["String"]>
    /** Same as above, but reserved for non gram coins that may appear in the blockchain */
    total_fees_other?: Maybe<Array<Maybe<OtherCurrency>>>
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
    tr_type?: Maybe<Scalars["Int"]>
    tr_type_name?: Maybe<TransactionTypeEnum>
    tt?: Maybe<Scalars["String"]>
    /** Workchain id of the account address (account_addr field) */
    workchain_id?: Maybe<Scalars["Int"]>
}

/** Transaction */
export type BlockchainTransactionBalance_DeltaArgs = {
    format?: Maybe<BigIntFormat>
}

/** Transaction */
export type BlockchainTransactionExt_In_Msg_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/** Transaction */
export type BlockchainTransactionLtArgs = {
    format?: Maybe<BigIntFormat>
}

/** Transaction */
export type BlockchainTransactionPrev_Trans_LtArgs = {
    format?: Maybe<BigIntFormat>
}

/** Transaction */
export type BlockchainTransactionTotal_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type BlockchainTransactionEdge = {
    __typename?: "BlockchainTransactionEdge"
    node: BlockchainTransaction
    cursor: Scalars["String"]
}

export type BlockchainTransactionsConnection = {
    __typename?: "BlockchainTransactionsConnection"
    edges: Array<BlockchainTransactionEdge>
    pageInfo: PageInfo
}

export enum BounceTypeEnum {
    NegFunds = "NegFunds",
    NoFunds = "NoFunds",
    Ok = "Ok",
}

export enum ComputeTypeEnum {
    Skipped = "Skipped",
    Vm = "Vm",
}

export type Config = {
    __typename?: "Config"
    /** Address of config smart contract in the masterchain */
    p0?: Maybe<Scalars["String"]>
    /** Address of elector smart contract in the masterchain */
    p1?: Maybe<Scalars["String"]>
    /** Critical params */
    p10?: Maybe<Array<Maybe<Scalars["Float"]>>>
    /** Config voting setup */
    p11?: Maybe<ConfigP11>
    /** Array of all workchains descriptions */
    p12?: Maybe<Array<Maybe<ConfigP12>>>
    /** Block create fees */
    p14?: Maybe<ConfigP14>
    /** Election parameters */
    p15?: Maybe<ConfigP15>
    /** Validators count */
    p16?: Maybe<ConfigP16>
    /** Validator stake parameters */
    p17?: Maybe<ConfigP17>
    /** Storage prices */
    p18?: Maybe<Array<Maybe<ConfigP18>>>
    /** Address of minter smart contract in the masterchain */
    p2?: Maybe<Scalars["String"]>
    /** Gas limits and prices in the masterchain */
    p20?: Maybe<GasLimitsPrices>
    /** Gas limits and prices in workchains */
    p21?: Maybe<GasLimitsPrices>
    /** Block limits in the masterchain */
    p22?: Maybe<BlockLimits>
    /** Block limits in workchains */
    p23?: Maybe<BlockLimits>
    /** Message forward prices in the masterchain */
    p24?: Maybe<MsgForwardPrices>
    /** Message forward prices in workchains */
    p25?: Maybe<MsgForwardPrices>
    /** Catchain config */
    p28?: Maybe<ConfigP28>
    /** Consensus config */
    p29?: Maybe<ConfigP29>
    /** Address of fee collector smart contract in the masterchain */
    p3?: Maybe<Scalars["String"]>
    /** Array of fundamental smart contracts addresses */
    p31?: Maybe<Array<Maybe<Scalars["String"]>>>
    /** Previous validators set */
    p32?: Maybe<ValidatorSet>
    /** Previous temporary validators set */
    p33?: Maybe<ValidatorSet>
    /** Current validators set */
    p34?: Maybe<ValidatorSet>
    /** Current temporary validators set */
    p35?: Maybe<ValidatorSet>
    /** Next validators set */
    p36?: Maybe<ValidatorSet>
    /** Next temporary validators set */
    p37?: Maybe<ValidatorSet>
    /** Array of validator signed temporary keys */
    p39?: Maybe<Array<Maybe<ConfigP39>>>
    /** Address of TON DNS root smart contract in the masterchain */
    p4?: Maybe<Scalars["String"]>
    /** Configuration parameter 6 */
    p6?: Maybe<ConfigP6>
    /** Configuration parameter 7 */
    p7?: Maybe<Array<Maybe<ConfigP7>>>
    /** Global version */
    p8?: Maybe<ConfigP8>
    /** Mandatory params */
    p9?: Maybe<Array<Maybe<Scalars["Float"]>>>
}

/** Config voting setup */
export type ConfigP11 = {
    __typename?: "ConfigP11"
    critical_params?: Maybe<ConfigProposalSetup>
    normal_params?: Maybe<ConfigProposalSetup>
}

export type ConfigP12 = {
    __typename?: "ConfigP12"
    accept_msgs?: Maybe<Scalars["Boolean"]>
    active?: Maybe<Scalars["Boolean"]>
    actual_min_split?: Maybe<Scalars["Int"]>
    addr_len_step?: Maybe<Scalars["Int"]>
    basic?: Maybe<Scalars["Boolean"]>
    enabled_since?: Maybe<Scalars["Float"]>
    flags?: Maybe<Scalars["Int"]>
    max_addr_len?: Maybe<Scalars["Int"]>
    max_split?: Maybe<Scalars["Int"]>
    min_addr_len?: Maybe<Scalars["Int"]>
    min_split?: Maybe<Scalars["Int"]>
    version?: Maybe<Scalars["Float"]>
    vm_mode?: Maybe<Scalars["String"]>
    vm_version?: Maybe<Scalars["Int"]>
    workchain_id?: Maybe<Scalars["Int"]>
    workchain_type_id?: Maybe<Scalars["Float"]>
    zerostate_file_hash?: Maybe<Scalars["String"]>
    zerostate_root_hash?: Maybe<Scalars["String"]>
}

/** Block create fees */
export type ConfigP14 = {
    __typename?: "ConfigP14"
    basechain_block_fee?: Maybe<Scalars["String"]>
    masterchain_block_fee?: Maybe<Scalars["String"]>
}

/** Block create fees */
export type ConfigP14Basechain_Block_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/** Block create fees */
export type ConfigP14Masterchain_Block_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

/** Election parameters */
export type ConfigP15 = {
    __typename?: "ConfigP15"
    elections_end_before?: Maybe<Scalars["Float"]>
    elections_start_before?: Maybe<Scalars["Float"]>
    stake_held_for?: Maybe<Scalars["Float"]>
    validators_elected_for?: Maybe<Scalars["Float"]>
}

/** Validators count */
export type ConfigP16 = {
    __typename?: "ConfigP16"
    max_main_validators?: Maybe<Scalars["Int"]>
    max_validators?: Maybe<Scalars["Int"]>
    min_validators?: Maybe<Scalars["Int"]>
}

/** Validator stake parameters */
export type ConfigP17 = {
    __typename?: "ConfigP17"
    max_stake?: Maybe<Scalars["String"]>
    max_stake_factor?: Maybe<Scalars["Float"]>
    min_stake?: Maybe<Scalars["String"]>
    min_total_stake?: Maybe<Scalars["String"]>
}

/** Validator stake parameters */
export type ConfigP17Max_StakeArgs = {
    format?: Maybe<BigIntFormat>
}

/** Validator stake parameters */
export type ConfigP17Min_StakeArgs = {
    format?: Maybe<BigIntFormat>
}

/** Validator stake parameters */
export type ConfigP17Min_Total_StakeArgs = {
    format?: Maybe<BigIntFormat>
}

export type ConfigP18 = {
    __typename?: "ConfigP18"
    bit_price_ps?: Maybe<Scalars["String"]>
    cell_price_ps?: Maybe<Scalars["String"]>
    mc_bit_price_ps?: Maybe<Scalars["String"]>
    mc_cell_price_ps?: Maybe<Scalars["String"]>
    utime_since?: Maybe<Scalars["Float"]>
    utime_since_string?: Maybe<Scalars["String"]>
}

export type ConfigP18Bit_Price_PsArgs = {
    format?: Maybe<BigIntFormat>
}

export type ConfigP18Cell_Price_PsArgs = {
    format?: Maybe<BigIntFormat>
}

export type ConfigP18Mc_Bit_Price_PsArgs = {
    format?: Maybe<BigIntFormat>
}

export type ConfigP18Mc_Cell_Price_PsArgs = {
    format?: Maybe<BigIntFormat>
}

/** Catchain config */
export type ConfigP28 = {
    __typename?: "ConfigP28"
    mc_catchain_lifetime?: Maybe<Scalars["Float"]>
    shard_catchain_lifetime?: Maybe<Scalars["Float"]>
    shard_validators_lifetime?: Maybe<Scalars["Float"]>
    shard_validators_num?: Maybe<Scalars["Float"]>
    shuffle_mc_validators?: Maybe<Scalars["Boolean"]>
}

/** Consensus config */
export type ConfigP29 = {
    __typename?: "ConfigP29"
    attempt_duration?: Maybe<Scalars["Float"]>
    catchain_max_deps?: Maybe<Scalars["Float"]>
    consensus_timeout_ms?: Maybe<Scalars["Float"]>
    fast_attempts?: Maybe<Scalars["Float"]>
    max_block_bytes?: Maybe<Scalars["Float"]>
    max_collated_bytes?: Maybe<Scalars["Float"]>
    new_catchain_ids?: Maybe<Scalars["Boolean"]>
    next_candidate_delay_ms?: Maybe<Scalars["Float"]>
    round_candidates?: Maybe<Scalars["Float"]>
}

export type ConfigP39 = {
    __typename?: "ConfigP39"
    adnl_addr?: Maybe<Scalars["String"]>
    seqno?: Maybe<Scalars["Float"]>
    signature_r?: Maybe<Scalars["String"]>
    signature_s?: Maybe<Scalars["String"]>
    temp_public_key?: Maybe<Scalars["String"]>
    valid_until?: Maybe<Scalars["Float"]>
}

/** Configuration parameter 6 */
export type ConfigP6 = {
    __typename?: "ConfigP6"
    mint_add_price?: Maybe<Scalars["String"]>
    mint_new_price?: Maybe<Scalars["String"]>
}

export type ConfigP7 = {
    __typename?: "ConfigP7"
    currency?: Maybe<Scalars["Float"]>
    value?: Maybe<Scalars["String"]>
}

/** Global version */
export type ConfigP8 = {
    __typename?: "ConfigP8"
    capabilities?: Maybe<Scalars["String"]>
    version?: Maybe<Scalars["Float"]>
}

/** Global version */
export type ConfigP8CapabilitiesArgs = {
    format?: Maybe<BigIntFormat>
}

export type ConfigProposalSetup = {
    __typename?: "ConfigProposalSetup"
    bit_price?: Maybe<Scalars["Float"]>
    cell_price?: Maybe<Scalars["Float"]>
    max_losses?: Maybe<Scalars["Int"]>
    max_store_sec?: Maybe<Scalars["Float"]>
    max_tot_rounds?: Maybe<Scalars["Int"]>
    min_store_sec?: Maybe<Scalars["Float"]>
    min_tot_rounds?: Maybe<Scalars["Int"]>
    min_wins?: Maybe<Scalars["Int"]>
}

export type ExtBlkRef = {
    __typename?: "ExtBlkRef"
    end_lt?: Maybe<Scalars["String"]>
    file_hash?: Maybe<Scalars["String"]>
    root_hash?: Maybe<Scalars["String"]>
    seq_no?: Maybe<Scalars["Float"]>
}

export type ExtBlkRefEnd_LtArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPrices = {
    __typename?: "GasLimitsPrices"
    block_gas_limit?: Maybe<Scalars["String"]>
    delete_due_limit?: Maybe<Scalars["String"]>
    flat_gas_limit?: Maybe<Scalars["String"]>
    flat_gas_price?: Maybe<Scalars["String"]>
    freeze_due_limit?: Maybe<Scalars["String"]>
    gas_credit?: Maybe<Scalars["String"]>
    gas_limit?: Maybe<Scalars["String"]>
    gas_price?: Maybe<Scalars["String"]>
    special_gas_limit?: Maybe<Scalars["String"]>
}

export type GasLimitsPricesBlock_Gas_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesDelete_Due_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesFlat_Gas_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesFlat_Gas_PriceArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesFreeze_Due_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesGas_CreditArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesGas_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesGas_PriceArgs = {
    format?: Maybe<BigIntFormat>
}

export type GasLimitsPricesSpecial_Gas_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type InMsg = {
    __typename?: "InMsg"
    fwd_fee?: Maybe<Scalars["String"]>
    ihr_fee?: Maybe<Scalars["String"]>
    in_msg?: Maybe<MsgEnvelope>
    msg_id?: Maybe<Scalars["String"]>
    /**
     * - 0 – external
     * - 1 – ihr
     * - 2 – immediately
     * - 3 – final
     * - 4 – transit
     * - 5 – discardedFinal
     * - 6 – discardedTransit
     */
    msg_type?: Maybe<Scalars["Int"]>
    msg_type_name?: Maybe<InMsgTypeEnum>
    out_msg?: Maybe<MsgEnvelope>
    proof_created?: Maybe<Scalars["String"]>
    proof_delivered?: Maybe<Scalars["String"]>
    transaction_id?: Maybe<Scalars["String"]>
    transit_fee?: Maybe<Scalars["String"]>
}

export type InMsgFwd_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

export type InMsgIhr_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

export type InMsgTransit_FeeArgs = {
    format?: Maybe<BigIntFormat>
}

export enum InMsgTypeEnum {
    External = "External",
    Ihr = "Ihr",
    Immediately = "Immediately",
    Final = "Final",
    Transit = "Transit",
    DiscardedFinal = "DiscardedFinal",
    DiscardedTransit = "DiscardedTransit",
}

export enum MessageProcessingStatusEnum {
    Unknown = "Unknown",
    Queued = "Queued",
    Processing = "Processing",
    Preliminary = "Preliminary",
    Proposed = "Proposed",
    Finalized = "Finalized",
    Refused = "Refused",
    Transiting = "Transiting",
}

export enum MessageTypeEnum {
    Internal = "Internal",
    ExtIn = "ExtIn",
    ExtOut = "ExtOut",
}

export type MsgEnvelope = {
    __typename?: "MsgEnvelope"
    cur_addr?: Maybe<Scalars["String"]>
    fwd_fee_remaining?: Maybe<Scalars["String"]>
    msg_id?: Maybe<Scalars["String"]>
    next_addr?: Maybe<Scalars["String"]>
}

export type MsgEnvelopeFwd_Fee_RemainingArgs = {
    format?: Maybe<BigIntFormat>
}

export type MsgForwardPrices = {
    __typename?: "MsgForwardPrices"
    bit_price?: Maybe<Scalars["String"]>
    cell_price?: Maybe<Scalars["String"]>
    first_frac?: Maybe<Scalars["Int"]>
    ihr_price_factor?: Maybe<Scalars["Float"]>
    lump_price?: Maybe<Scalars["String"]>
    next_frac?: Maybe<Scalars["Int"]>
}

export type MsgForwardPricesBit_PriceArgs = {
    format?: Maybe<BigIntFormat>
}

export type MsgForwardPricesCell_PriceArgs = {
    format?: Maybe<BigIntFormat>
}

export type MsgForwardPricesLump_PriceArgs = {
    format?: Maybe<BigIntFormat>
}

export type Node = {
    id: Scalars["ID"]
}

export type OtherCurrency = {
    __typename?: "OtherCurrency"
    currency?: Maybe<Scalars["Float"]>
    value?: Maybe<Scalars["String"]>
}

export type OtherCurrencyValueArgs = {
    format?: Maybe<BigIntFormat>
}

export type OutMsg = {
    __typename?: "OutMsg"
    import_block_lt?: Maybe<Scalars["String"]>
    imported?: Maybe<InMsg>
    msg_env_hash?: Maybe<Scalars["String"]>
    msg_id?: Maybe<Scalars["String"]>
    /**
     * - 0 – external
     * - 1 – immediately
     * - 2 – outMsgNew
     * - 3 – transit
     * - 4 – dequeueImmediately
     * - 5 – dequeue
     * - 6 – transitRequired
     * - 7 – dequeueShort
     * - -1 – none
     */
    msg_type?: Maybe<Scalars["Int"]>
    msg_type_name?: Maybe<OutMsgTypeEnum>
    next_addr_pfx?: Maybe<Scalars["String"]>
    next_workchain?: Maybe<Scalars["Int"]>
    out_msg?: Maybe<MsgEnvelope>
    reimport?: Maybe<InMsg>
    transaction_id?: Maybe<Scalars["String"]>
}

export type OutMsgImport_Block_LtArgs = {
    format?: Maybe<BigIntFormat>
}

export type OutMsgNext_Addr_PfxArgs = {
    format?: Maybe<BigIntFormat>
}

export enum OutMsgTypeEnum {
    External = "External",
    Immediately = "Immediately",
    OutMsgNew = "OutMsgNew",
    Transit = "Transit",
    DequeueImmediately = "DequeueImmediately",
    Dequeue = "Dequeue",
    TransitRequired = "TransitRequired",
    DequeueShort = "DequeueShort",
    None = "None",
}

export type PageInfo = {
    __typename?: "PageInfo"
    startCursor?: Maybe<Scalars["String"]>
    endCursor?: Maybe<Scalars["String"]>
    hasNextPage: Scalars["Boolean"]
    hasPreviousPage: Scalars["Boolean"]
}

export type Query = {
    __typename?: "Query"
    /** Blockchain-related information (blocks, transactions, etc.) */
    blockchain?: Maybe<BlockchainQuery>
}

export enum SkipReasonEnum {
    NoState = "NoState",
    BadState = "BadState",
    NoGas = "NoGas",
}

export enum SplitTypeEnum {
    None = "None",
    Split = "Split",
    Merge = "Merge",
}

export type TransactionAction = {
    __typename?: "TransactionAction"
    action_list_hash?: Maybe<Scalars["String"]>
    msgs_created?: Maybe<Scalars["Int"]>
    /** The flag indicates absence of funds required to create an outbound message */
    no_funds?: Maybe<Scalars["Boolean"]>
    result_arg?: Maybe<Scalars["Int"]>
    result_code?: Maybe<Scalars["Int"]>
    skipped_actions?: Maybe<Scalars["Int"]>
    spec_actions?: Maybe<Scalars["Int"]>
    /**
     * - 0 – unchanged
     * - 1 – frozen
     * - 2 – deleted
     */
    status_change?: Maybe<Scalars["Int"]>
    status_change_name?: Maybe<AccountStatusChangeEnum>
    success?: Maybe<Scalars["Boolean"]>
    tot_actions?: Maybe<Scalars["Int"]>
    total_action_fees?: Maybe<Scalars["String"]>
    total_fwd_fees?: Maybe<Scalars["String"]>
    total_msg_size_bits?: Maybe<Scalars["Float"]>
    total_msg_size_cells?: Maybe<Scalars["Float"]>
    valid?: Maybe<Scalars["Boolean"]>
}

export type TransactionActionTotal_Action_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionActionTotal_Fwd_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionBounce = {
    __typename?: "TransactionBounce"
    /**
     * - 0 – negFunds
     * - 1 – noFunds
     * - 2 – ok
     */
    bounce_type?: Maybe<Scalars["Int"]>
    bounce_type_name?: Maybe<BounceTypeEnum>
    fwd_fees?: Maybe<Scalars["String"]>
    msg_fees?: Maybe<Scalars["String"]>
    msg_size_bits?: Maybe<Scalars["Float"]>
    msg_size_cells?: Maybe<Scalars["Float"]>
    req_fwd_fees?: Maybe<Scalars["String"]>
}

export type TransactionBounceFwd_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionBounceMsg_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionBounceReq_Fwd_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionCompute = {
    __typename?: "TransactionCompute"
    /** The flag reflects whether this has resulted in the activation of a previously frozen, uninitialized or non-existent account. */
    account_activated?: Maybe<Scalars["Boolean"]>
    /**
     * - 0 – skipped
     * - 1 – vm
     */
    compute_type?: Maybe<Scalars["Int"]>
    compute_type_name?: Maybe<ComputeTypeEnum>
    exit_arg?: Maybe<Scalars["Int"]>
    /** These parameter represents the status values returned by TVM; for a successful transaction, exit_code has to be 0 or 1 */
    exit_code?: Maybe<Scalars["Int"]>
    /** This parameter may be non-zero only for external inbound messages. It is the lesser of either the amount of gas that can be paid from the account balance or the maximum gas credit */
    gas_credit?: Maybe<Scalars["Int"]>
    /** This parameter reflects the total gas fees collected by the validators for executing this transaction. It must be equal to the product of gas_used and gas_price from the current block header. */
    gas_fees?: Maybe<Scalars["String"]>
    /** This parameter reflects the gas limit for this instance of TVM. It equals the lesser of either the Grams credited in the credit phase from the value of the inbound message divided by the current gas price, or the global per-transaction gas limit. */
    gas_limit?: Maybe<Scalars["String"]>
    gas_used?: Maybe<Scalars["String"]>
    mode?: Maybe<Scalars["Int"]>
    /** This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below) */
    msg_state_used?: Maybe<Scalars["Boolean"]>
    /**
     * Reason for skipping the compute phase. According to the specification, the phase can be skipped due to the absence of funds to buy gas, absence of state of an account or a message, failure to provide a valid state in the message
     * - 0 – noState
     * - 1 – badState
     * - 2 – noGas
     */
    skipped_reason?: Maybe<Scalars["Int"]>
    skipped_reason_name?: Maybe<SkipReasonEnum>
    /** This flag is set if and only if exit_code is either 0 or 1. */
    success?: Maybe<Scalars["Boolean"]>
    /** This parameter is the representation hashes of the resulting state of TVM. */
    vm_final_state_hash?: Maybe<Scalars["String"]>
    /** This parameter is the representation hashes of the original state of TVM. */
    vm_init_state_hash?: Maybe<Scalars["String"]>
    /** the total number of steps performed by TVM (usually equal to two plus the number of instructions executed, including implicit RETs) */
    vm_steps?: Maybe<Scalars["Float"]>
}

export type TransactionComputeGas_FeesArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionComputeGas_LimitArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionComputeGas_UsedArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionCredit = {
    __typename?: "TransactionCredit"
    credit?: Maybe<Scalars["String"]>
    credit_other?: Maybe<Array<Maybe<OtherCurrency>>>
    /** The sum of due_fees_collected and credit must equal the value of the message received, plus its ihr_fee if the message has not been received via Instant Hypercube Routing, IHR (otherwise the ihr_fee is awarded to the validators). */
    due_fees_collected?: Maybe<Scalars["String"]>
}

export type TransactionCreditCreditArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionCreditDue_Fees_CollectedArgs = {
    format?: Maybe<BigIntFormat>
}

export enum TransactionProcessingStatusEnum {
    Unknown = "Unknown",
    Preliminary = "Preliminary",
    Proposed = "Proposed",
    Finalized = "Finalized",
    Refused = "Refused",
}

export type TransactionSplitInfo = {
    __typename?: "TransactionSplitInfo"
    acc_split_depth?: Maybe<Scalars["Int"]>
    /** length of the current shard prefix */
    cur_shard_pfx_len?: Maybe<Scalars["Int"]>
    sibling_addr?: Maybe<Scalars["String"]>
    this_addr?: Maybe<Scalars["String"]>
}

export type TransactionStorage = {
    __typename?: "TransactionStorage"
    /**
     * This field represents account status change after the transaction is completed.
     * - 0 – unchanged
     * - 1 – frozen
     * - 2 – deleted
     */
    status_change?: Maybe<Scalars["Int"]>
    status_change_name?: Maybe<AccountStatusChangeEnum>
    /** This field defines the amount of storage fees collected in grams. */
    storage_fees_collected?: Maybe<Scalars["String"]>
    /** This field represents the amount of due fees in grams, it might be empty. */
    storage_fees_due?: Maybe<Scalars["String"]>
}

export type TransactionStorageStorage_Fees_CollectedArgs = {
    format?: Maybe<BigIntFormat>
}

export type TransactionStorageStorage_Fees_DueArgs = {
    format?: Maybe<BigIntFormat>
}

export enum TransactionTypeEnum {
    Ordinary = "Ordinary",
    Storage = "Storage",
    Tick = "Tick",
    Tock = "Tock",
    SplitPrepare = "SplitPrepare",
    SplitInstall = "SplitInstall",
    MergePrepare = "MergePrepare",
    MergeInstall = "MergeInstall",
}

export type ValidatorSet = {
    __typename?: "ValidatorSet"
    list?: Maybe<Array<Maybe<ValidatorSetList>>>
    main?: Maybe<Scalars["Int"]>
    total?: Maybe<Scalars["Int"]>
    total_weight?: Maybe<Scalars["String"]>
    utime_since?: Maybe<Scalars["Float"]>
    utime_since_string?: Maybe<Scalars["String"]>
    utime_until?: Maybe<Scalars["Float"]>
    utime_until_string?: Maybe<Scalars["String"]>
}

export type ValidatorSetTotal_WeightArgs = {
    format?: Maybe<BigIntFormat>
}

export type ValidatorSetList = {
    __typename?: "ValidatorSetList"
    adnl_addr?: Maybe<Scalars["String"]>
    public_key?: Maybe<Scalars["String"]>
    weight?: Maybe<Scalars["String"]>
}

export type ValidatorSetListWeightArgs = {
    format?: Maybe<BigIntFormat>
}

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
    resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
    | ResolverFn<TResult, TParent, TContext, TArgs>
    | ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => AsyncIterator<TResult> | Promise<AsyncIterator<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<
    TResult,
    TKey extends string,
    TParent,
    TContext,
    TArgs,
> {
    subscribe: SubscriptionSubscribeFn<
        { [key in TKey]: TResult },
        TParent,
        TContext,
        TArgs
    >
    resolve?: SubscriptionResolveFn<
        TResult,
        { [key in TKey]: TResult },
        TContext,
        TArgs
    >
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
    subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
    resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<
    TResult,
    TKey extends string,
    TParent,
    TContext,
    TArgs,
> =
    | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
    | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
    TResult,
    TKey extends string,
    TParent = {},
    TContext = {},
    TArgs = {},
> =
    | ((
          ...args: any[]
      ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
    | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
    parent: TParent,
    context: TContext,
    info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
    obj: T,
    context: TContext,
    info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
    TResult = {},
    TParent = {},
    TContext = {},
    TArgs = {},
> = (
    next: NextResolverFn<TResult>,
    parent: TParent,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
    AccountStatusChangeEnum: AccountStatusChangeEnum
    AccountStatusEnum: AccountStatusEnum
    BigIntFormat: BigIntFormat
    BlockAccountBlocks: ResolverTypeWrapper<BlockAccountBlocks>
    String: ResolverTypeWrapper<Scalars["String"]>
    Int: ResolverTypeWrapper<Scalars["Int"]>
    BlockAccountBlocksTransactions: ResolverTypeWrapper<BlockAccountBlocksTransactions>
    BlockLimits: ResolverTypeWrapper<BlockLimits>
    BlockLimitsBytes: ResolverTypeWrapper<BlockLimitsBytes>
    Float: ResolverTypeWrapper<Scalars["Float"]>
    BlockLimitsGas: ResolverTypeWrapper<BlockLimitsGas>
    BlockLimitsLtDelta: ResolverTypeWrapper<BlockLimitsLtDelta>
    BlockMaster: ResolverTypeWrapper<BlockMaster>
    BlockMasterPrevBlkSignatures: ResolverTypeWrapper<BlockMasterPrevBlkSignatures>
    BlockMasterShardFees: ResolverTypeWrapper<BlockMasterShardFees>
    BlockMasterShardHashes: ResolverTypeWrapper<BlockMasterShardHashes>
    BlockMasterShardHashesDescr: ResolverTypeWrapper<BlockMasterShardHashesDescr>
    Boolean: ResolverTypeWrapper<Scalars["Boolean"]>
    BlockProcessingStatusEnum: BlockProcessingStatusEnum
    BlockSignature: ResolverTypeWrapper<BlockSignature>
    BlockStateUpdate: ResolverTypeWrapper<BlockStateUpdate>
    BlockValueFlow: ResolverTypeWrapper<BlockValueFlow>
    BlockchainAccount: ResolverTypeWrapper<BlockchainAccount>
    ID: ResolverTypeWrapper<Scalars["ID"]>
    BlockchainAccountQuery: ResolverTypeWrapper<BlockchainAccountQuery>
    BlockchainBlock: ResolverTypeWrapper<BlockchainBlock>
    BlockchainBlockSignatures: ResolverTypeWrapper<BlockchainBlockSignatures>
    BlockchainBlocksConnection: ResolverTypeWrapper<BlockchainBlocksConnection>
    BlockchainBlocksEdge: ResolverTypeWrapper<BlockchainBlocksEdge>
    BlockchainMasterSeqNoFilter: BlockchainMasterSeqNoFilter
    BlockchainMasterSeqNoRange: ResolverTypeWrapper<BlockchainMasterSeqNoRange>
    BlockchainMessage: ResolverTypeWrapper<BlockchainMessage>
    BlockchainMessageEdge: ResolverTypeWrapper<BlockchainMessageEdge>
    BlockchainMessageTypeFilterEnum: BlockchainMessageTypeFilterEnum
    BlockchainMessagesConnection: ResolverTypeWrapper<BlockchainMessagesConnection>
    BlockchainQuery: ResolverTypeWrapper<BlockchainQuery>
    BlockchainTransaction: ResolverTypeWrapper<BlockchainTransaction>
    BlockchainTransactionEdge: ResolverTypeWrapper<BlockchainTransactionEdge>
    BlockchainTransactionsConnection: ResolverTypeWrapper<BlockchainTransactionsConnection>
    BounceTypeEnum: BounceTypeEnum
    ComputeTypeEnum: ComputeTypeEnum
    Config: ResolverTypeWrapper<Config>
    ConfigP11: ResolverTypeWrapper<ConfigP11>
    ConfigP12: ResolverTypeWrapper<ConfigP12>
    ConfigP14: ResolverTypeWrapper<ConfigP14>
    ConfigP15: ResolverTypeWrapper<ConfigP15>
    ConfigP16: ResolverTypeWrapper<ConfigP16>
    ConfigP17: ResolverTypeWrapper<ConfigP17>
    ConfigP18: ResolverTypeWrapper<ConfigP18>
    ConfigP28: ResolverTypeWrapper<ConfigP28>
    ConfigP29: ResolverTypeWrapper<ConfigP29>
    ConfigP39: ResolverTypeWrapper<ConfigP39>
    ConfigP6: ResolverTypeWrapper<ConfigP6>
    ConfigP7: ResolverTypeWrapper<ConfigP7>
    ConfigP8: ResolverTypeWrapper<ConfigP8>
    ConfigProposalSetup: ResolverTypeWrapper<ConfigProposalSetup>
    ExtBlkRef: ResolverTypeWrapper<ExtBlkRef>
    GasLimitsPrices: ResolverTypeWrapper<GasLimitsPrices>
    InMsg: ResolverTypeWrapper<InMsg>
    InMsgTypeEnum: InMsgTypeEnum
    MessageProcessingStatusEnum: MessageProcessingStatusEnum
    MessageTypeEnum: MessageTypeEnum
    MsgEnvelope: ResolverTypeWrapper<MsgEnvelope>
    MsgForwardPrices: ResolverTypeWrapper<MsgForwardPrices>
    Node:
        | ResolversTypes["BlockchainAccount"]
        | ResolversTypes["BlockchainBlock"]
        | ResolversTypes["BlockchainMessage"]
        | ResolversTypes["BlockchainTransaction"]
    OtherCurrency: ResolverTypeWrapper<OtherCurrency>
    OutMsg: ResolverTypeWrapper<OutMsg>
    OutMsgTypeEnum: OutMsgTypeEnum
    PageInfo: ResolverTypeWrapper<PageInfo>
    Query: ResolverTypeWrapper<{}>
    SkipReasonEnum: SkipReasonEnum
    SplitTypeEnum: SplitTypeEnum
    TransactionAction: ResolverTypeWrapper<TransactionAction>
    TransactionBounce: ResolverTypeWrapper<TransactionBounce>
    TransactionCompute: ResolverTypeWrapper<TransactionCompute>
    TransactionCredit: ResolverTypeWrapper<TransactionCredit>
    TransactionProcessingStatusEnum: TransactionProcessingStatusEnum
    TransactionSplitInfo: ResolverTypeWrapper<TransactionSplitInfo>
    TransactionStorage: ResolverTypeWrapper<TransactionStorage>
    TransactionTypeEnum: TransactionTypeEnum
    ValidatorSet: ResolverTypeWrapper<ValidatorSet>
    ValidatorSetList: ResolverTypeWrapper<ValidatorSetList>
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
    BlockAccountBlocks: BlockAccountBlocks
    String: Scalars["String"]
    Int: Scalars["Int"]
    BlockAccountBlocksTransactions: BlockAccountBlocksTransactions
    BlockLimits: BlockLimits
    BlockLimitsBytes: BlockLimitsBytes
    Float: Scalars["Float"]
    BlockLimitsGas: BlockLimitsGas
    BlockLimitsLtDelta: BlockLimitsLtDelta
    BlockMaster: BlockMaster
    BlockMasterPrevBlkSignatures: BlockMasterPrevBlkSignatures
    BlockMasterShardFees: BlockMasterShardFees
    BlockMasterShardHashes: BlockMasterShardHashes
    BlockMasterShardHashesDescr: BlockMasterShardHashesDescr
    Boolean: Scalars["Boolean"]
    BlockSignature: BlockSignature
    BlockStateUpdate: BlockStateUpdate
    BlockValueFlow: BlockValueFlow
    BlockchainAccount: BlockchainAccount
    ID: Scalars["ID"]
    BlockchainAccountQuery: BlockchainAccountQuery
    BlockchainBlock: BlockchainBlock
    BlockchainBlockSignatures: BlockchainBlockSignatures
    BlockchainBlocksConnection: BlockchainBlocksConnection
    BlockchainBlocksEdge: BlockchainBlocksEdge
    BlockchainMasterSeqNoFilter: BlockchainMasterSeqNoFilter
    BlockchainMasterSeqNoRange: BlockchainMasterSeqNoRange
    BlockchainMessage: BlockchainMessage
    BlockchainMessageEdge: BlockchainMessageEdge
    BlockchainMessagesConnection: BlockchainMessagesConnection
    BlockchainQuery: BlockchainQuery
    BlockchainTransaction: BlockchainTransaction
    BlockchainTransactionEdge: BlockchainTransactionEdge
    BlockchainTransactionsConnection: BlockchainTransactionsConnection
    Config: Config
    ConfigP11: ConfigP11
    ConfigP12: ConfigP12
    ConfigP14: ConfigP14
    ConfigP15: ConfigP15
    ConfigP16: ConfigP16
    ConfigP17: ConfigP17
    ConfigP18: ConfigP18
    ConfigP28: ConfigP28
    ConfigP29: ConfigP29
    ConfigP39: ConfigP39
    ConfigP6: ConfigP6
    ConfigP7: ConfigP7
    ConfigP8: ConfigP8
    ConfigProposalSetup: ConfigProposalSetup
    ExtBlkRef: ExtBlkRef
    GasLimitsPrices: GasLimitsPrices
    InMsg: InMsg
    MsgEnvelope: MsgEnvelope
    MsgForwardPrices: MsgForwardPrices
    Node:
        | ResolversParentTypes["BlockchainAccount"]
        | ResolversParentTypes["BlockchainBlock"]
        | ResolversParentTypes["BlockchainMessage"]
        | ResolversParentTypes["BlockchainTransaction"]
    OtherCurrency: OtherCurrency
    OutMsg: OutMsg
    PageInfo: PageInfo
    Query: {}
    TransactionAction: TransactionAction
    TransactionBounce: TransactionBounce
    TransactionCompute: TransactionCompute
    TransactionCredit: TransactionCredit
    TransactionSplitInfo: TransactionSplitInfo
    TransactionStorage: TransactionStorage
    ValidatorSet: ValidatorSet
    ValidatorSetList: ValidatorSetList
}

export type BlockAccountBlocksResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockAccountBlocks"] = ResolversParentTypes["BlockAccountBlocks"],
> = {
    account_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    new_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    old_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    tr_count?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    transactions?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockAccountBlocksTransactions"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockAccountBlocksTransactionsResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockAccountBlocksTransactions"] = ResolversParentTypes["BlockAccountBlocksTransactions"],
> = {
    lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockAccountBlocksTransactionsLtArgs, never>
    >
    total_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockAccountBlocksTransactionsTotal_FeesArgs, never>
    >
    total_fees_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    transaction_id?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockLimitsResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockLimits"] = ResolversParentTypes["BlockLimits"],
> = {
    bytes?: Resolver<
        Maybe<ResolversTypes["BlockLimitsBytes"]>,
        ParentType,
        ContextType
    >
    gas?: Resolver<
        Maybe<ResolversTypes["BlockLimitsGas"]>,
        ParentType,
        ContextType
    >
    lt_delta?: Resolver<
        Maybe<ResolversTypes["BlockLimitsLtDelta"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockLimitsBytesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockLimitsBytes"] = ResolversParentTypes["BlockLimitsBytes"],
> = {
    hard_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    soft_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    underload?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockLimitsGasResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockLimitsGas"] = ResolversParentTypes["BlockLimitsGas"],
> = {
    hard_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    soft_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    underload?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockLimitsLtDeltaResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockLimitsLtDelta"] = ResolversParentTypes["BlockLimitsLtDelta"],
> = {
    hard_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    soft_limit?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    underload?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockMasterResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockMaster"] = ResolversParentTypes["BlockMaster"],
> = {
    config?: Resolver<Maybe<ResolversTypes["Config"]>, ParentType, ContextType>
    config_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    max_shard_gen_utime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    max_shard_gen_utime_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    min_shard_gen_utime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    min_shard_gen_utime_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    prev_blk_signatures?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockMasterPrevBlkSignatures"]>>>,
        ParentType,
        ContextType
    >
    recover_create_msg?: Resolver<
        Maybe<ResolversTypes["InMsg"]>,
        ParentType,
        ContextType
    >
    shard_fees?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockMasterShardFees"]>>>,
        ParentType,
        ContextType
    >
    shard_hashes?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockMasterShardHashes"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockMasterPrevBlkSignaturesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockMasterPrevBlkSignatures"] = ResolversParentTypes["BlockMasterPrevBlkSignatures"],
> = {
    node_id?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    r?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    s?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockMasterShardFeesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockMasterShardFees"] = ResolversParentTypes["BlockMasterShardFees"],
> = {
    create?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardFeesCreateArgs, never>
    >
    create_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardFeesFeesArgs, never>
    >
    fees_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    shard?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockMasterShardHashesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockMasterShardHashes"] = ResolversParentTypes["BlockMasterShardHashes"],
> = {
    descr?: Resolver<
        Maybe<ResolversTypes["BlockMasterShardHashesDescr"]>,
        ParentType,
        ContextType
    >
    shard?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockMasterShardHashesDescrResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockMasterShardHashesDescr"] = ResolversParentTypes["BlockMasterShardHashesDescr"],
> = {
    before_merge?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    before_split?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    end_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardHashesDescrEnd_LtArgs, never>
    >
    fees_collected?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardHashesDescrFees_CollectedArgs, never>
    >
    fees_collected_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    file_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    flags?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    funds_created?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardHashesDescrFunds_CreatedArgs, never>
    >
    funds_created_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    gen_utime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    gen_utime_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    min_ref_mc_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    next_catchain_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    next_validator_shard?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    nx_cc_updated?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    reg_mc_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    root_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    seq_no?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    split?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    split_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    split_type_name?: Resolver<
        Maybe<ResolversTypes["SplitTypeEnum"]>,
        ParentType,
        ContextType
    >
    start_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockMasterShardHashesDescrStart_LtArgs, never>
    >
    want_merge?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    want_split?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockSignatureResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockSignature"] = ResolversParentTypes["BlockSignature"],
> = {
    node_id?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    r?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    s?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockStateUpdateResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockStateUpdate"] = ResolversParentTypes["BlockStateUpdate"],
> = {
    new?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    new_depth?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    new_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    old?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    old_depth?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    old_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockValueFlowResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockValueFlow"] = ResolversParentTypes["BlockValueFlow"],
> = {
    created?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowCreatedArgs, never>
    >
    created_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    exported?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowExportedArgs, never>
    >
    exported_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    fees_collected?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowFees_CollectedArgs, never>
    >
    fees_collected_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    fees_imported?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowFees_ImportedArgs, never>
    >
    fees_imported_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    from_prev_blk?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowFrom_Prev_BlkArgs, never>
    >
    from_prev_blk_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    imported?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowImportedArgs, never>
    >
    imported_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    minted?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowMintedArgs, never>
    >
    minted_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    to_next_blk?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockValueFlowTo_Next_BlkArgs, never>
    >
    to_next_blk_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainAccountResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainAccount"] = ResolversParentTypes["BlockchainAccount"],
> = {
    _key?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    acc_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    acc_type_name?: Resolver<
        Maybe<ResolversTypes["AccountStatusEnum"]>,
        ParentType,
        ContextType
    >
    address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    balance?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountBalanceArgs, never>
    >
    balance_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    bits?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountBitsArgs, never>
    >
    boc?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    cells?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountCellsArgs, never>
    >
    code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    code_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    data?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    data_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    due_payment?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountDue_PaymentArgs, never>
    >
    id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
    init_code_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    last_paid?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    last_trans_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountLast_Trans_LtArgs, never>
    >
    library?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    library_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    prev_code_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    proof?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    public_cells?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountPublic_CellsArgs, never>
    >
    split_depth?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    state_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    tick?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    tock?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainAccountQueryResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainAccountQuery"] = ResolversParentTypes["BlockchainAccountQuery"],
> = {
    address?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    info?: Resolver<
        Maybe<ResolversTypes["BlockchainAccount"]>,
        ParentType,
        ContextType
    >
    messages?: Resolver<
        Maybe<ResolversTypes["BlockchainMessagesConnection"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountQueryMessagesArgs, never>
    >
    transactions?: Resolver<
        Maybe<ResolversTypes["BlockchainTransactionsConnection"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainAccountQueryTransactionsArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainBlockResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainBlock"] = ResolversParentTypes["BlockchainBlock"],
> = {
    _key?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    account_blocks?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockAccountBlocks"]>>>,
        ParentType,
        ContextType
    >
    after_merge?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    after_split?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    before_split?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    boc?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    chain_order?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    created_by?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    end_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainBlockEnd_LtArgs, never>
    >
    file_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    flags?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    gen_catchain_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    gen_software_capabilities?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainBlockGen_Software_CapabilitiesArgs, never>
    >
    gen_software_version?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    gen_utime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    gen_utime_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    gen_validator_list_hash_short?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    global_id?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    hash?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
    in_msg_descr?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["InMsg"]>>>,
        ParentType,
        ContextType
    >
    key_block?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    master?: Resolver<
        Maybe<ResolversTypes["BlockMaster"]>,
        ParentType,
        ContextType
    >
    master_ref?: Resolver<
        Maybe<ResolversTypes["ExtBlkRef"]>,
        ParentType,
        ContextType
    >
    min_ref_mc_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    out_msg_descr?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OutMsg"]>>>,
        ParentType,
        ContextType
    >
    prev_alt_ref?: Resolver<
        Maybe<ResolversTypes["ExtBlkRef"]>,
        ParentType,
        ContextType
    >
    prev_key_block_seqno?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    prev_ref?: Resolver<
        Maybe<ResolversTypes["ExtBlkRef"]>,
        ParentType,
        ContextType
    >
    prev_vert_alt_ref?: Resolver<
        Maybe<ResolversTypes["ExtBlkRef"]>,
        ParentType,
        ContextType
    >
    prev_vert_ref?: Resolver<
        Maybe<ResolversTypes["ExtBlkRef"]>,
        ParentType,
        ContextType
    >
    rand_seed?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    seq_no?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    shard?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    signatures?: Resolver<
        Maybe<ResolversTypes["BlockchainBlockSignatures"]>,
        ParentType,
        ContextType
    >
    start_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainBlockStart_LtArgs, never>
    >
    state_update?: Resolver<
        Maybe<ResolversTypes["BlockStateUpdate"]>,
        ParentType,
        ContextType
    >
    status?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    status_name?: Resolver<
        Maybe<ResolversTypes["BlockProcessingStatusEnum"]>,
        ParentType,
        ContextType
    >
    tr_count?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    value_flow?: Resolver<
        Maybe<ResolversTypes["BlockValueFlow"]>,
        ParentType,
        ContextType
    >
    version?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    vert_seq_no?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    want_merge?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    want_split?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainBlockSignaturesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainBlockSignatures"] = ResolversParentTypes["BlockchainBlockSignatures"],
> = {
    gen_utime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    seq_no?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    shard?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    proof?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    validator_list_hash_short?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    catchain_seqno?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    sig_weight?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainBlockSignaturesSig_WeightArgs, never>
    >
    signatures?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockSignature"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainBlocksConnectionResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainBlocksConnection"] = ResolversParentTypes["BlockchainBlocksConnection"],
> = {
    edges?: Resolver<
        Array<ResolversTypes["BlockchainBlocksEdge"]>,
        ParentType,
        ContextType
    >
    pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainBlocksEdgeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainBlocksEdge"] = ResolversParentTypes["BlockchainBlocksEdge"],
> = {
    node?: Resolver<ResolversTypes["BlockchainBlock"], ParentType, ContextType>
    cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainMasterSeqNoRangeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainMasterSeqNoRange"] = ResolversParentTypes["BlockchainMasterSeqNoRange"],
> = {
    start?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    end?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainMessageResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainMessage"] = ResolversParentTypes["BlockchainMessage"],
> = {
    _key?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    block_id?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    boc?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    body?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    body_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    bounce?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    bounced?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    chain_order?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    code?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    code_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    created_at?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    created_at_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    created_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainMessageCreated_LtArgs, never>
    >
    data?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    data_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    dst?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    dst_account?: Resolver<
        Maybe<ResolversTypes["BlockchainAccount"]>,
        ParentType,
        ContextType
    >
    dst_chain_order?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    dst_transaction?: Resolver<
        Maybe<ResolversTypes["BlockchainTransaction"]>,
        ParentType,
        ContextType
    >
    dst_workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    fwd_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainMessageFwd_FeeArgs, never>
    >
    hash?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
    ihr_disabled?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    ihr_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainMessageIhr_FeeArgs, never>
    >
    import_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainMessageImport_FeeArgs, never>
    >
    library?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    library_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    msg_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    msg_type_name?: Resolver<
        Maybe<ResolversTypes["MessageTypeEnum"]>,
        ParentType,
        ContextType
    >
    proof?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    split_depth?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    src?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    src_account?: Resolver<
        Maybe<ResolversTypes["BlockchainAccount"]>,
        ParentType,
        ContextType
    >
    src_chain_order?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    src_transaction?: Resolver<
        Maybe<ResolversTypes["BlockchainTransaction"]>,
        ParentType,
        ContextType
    >
    src_workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    status?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    status_name?: Resolver<
        Maybe<ResolversTypes["MessageProcessingStatusEnum"]>,
        ParentType,
        ContextType
    >
    tick?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    tock?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    value?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainMessageValueArgs, never>
    >
    value_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainMessageEdgeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainMessageEdge"] = ResolversParentTypes["BlockchainMessageEdge"],
> = {
    node?: Resolver<
        ResolversTypes["BlockchainMessage"],
        ParentType,
        ContextType
    >
    cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainMessagesConnectionResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainMessagesConnection"] = ResolversParentTypes["BlockchainMessagesConnection"],
> = {
    edges?: Resolver<
        Array<ResolversTypes["BlockchainMessageEdge"]>,
        ParentType,
        ContextType
    >
    pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainQueryResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainQuery"] = ResolversParentTypes["BlockchainQuery"],
> = {
    account?: Resolver<
        Maybe<ResolversTypes["BlockchainAccountQuery"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryAccountArgs, "address">
    >
    block?: Resolver<
        Maybe<ResolversTypes["BlockchainBlock"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryBlockArgs, "hash">
    >
    block_by_seq_no?: Resolver<
        Maybe<ResolversTypes["BlockchainBlock"]>,
        ParentType,
        ContextType,
        RequireFields<
            BlockchainQueryBlock_By_Seq_NoArgs,
            "workchain" | "thread" | "seq_no"
        >
    >
    transaction?: Resolver<
        Maybe<ResolversTypes["BlockchainTransaction"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryTransactionArgs, "hash">
    >
    message?: Resolver<
        Maybe<ResolversTypes["BlockchainMessage"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryMessageArgs, "hash">
    >
    master_seq_no_range?: Resolver<
        Maybe<ResolversTypes["BlockchainMasterSeqNoRange"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryMaster_Seq_No_RangeArgs, never>
    >
    key_blocks?: Resolver<
        Maybe<ResolversTypes["BlockchainBlocksConnection"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryKey_BlocksArgs, never>
    >
    blocks?: Resolver<
        Maybe<ResolversTypes["BlockchainBlocksConnection"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryBlocksArgs, never>
    >
    transactions?: Resolver<
        Maybe<ResolversTypes["BlockchainTransactionsConnection"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainQueryTransactionsArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainTransactionResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainTransaction"] = ResolversParentTypes["BlockchainTransaction"],
> = {
    _key?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    aborted?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    account?: Resolver<
        Maybe<ResolversTypes["BlockchainAccount"]>,
        ParentType,
        ContextType
    >
    account_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    action?: Resolver<
        Maybe<ResolversTypes["TransactionAction"]>,
        ParentType,
        ContextType
    >
    balance_delta?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainTransactionBalance_DeltaArgs, never>
    >
    balance_delta_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    block_id?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    boc?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    bounce?: Resolver<
        Maybe<ResolversTypes["TransactionBounce"]>,
        ParentType,
        ContextType
    >
    chain_order?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    compute?: Resolver<
        Maybe<ResolversTypes["TransactionCompute"]>,
        ParentType,
        ContextType
    >
    credit?: Resolver<
        Maybe<ResolversTypes["TransactionCredit"]>,
        ParentType,
        ContextType
    >
    credit_first?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    destroyed?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    end_status?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    end_status_name?: Resolver<
        Maybe<ResolversTypes["AccountStatusEnum"]>,
        ParentType,
        ContextType
    >
    ext_in_msg_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainTransactionExt_In_Msg_FeeArgs, never>
    >
    hash?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
    in_message?: Resolver<
        Maybe<ResolversTypes["BlockchainMessage"]>,
        ParentType,
        ContextType
    >
    in_msg?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    installed?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainTransactionLtArgs, never>
    >
    new_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    now?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    now_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    old_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    orig_status?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    orig_status_name?: Resolver<
        Maybe<ResolversTypes["AccountStatusEnum"]>,
        ParentType,
        ContextType
    >
    out_messages?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["BlockchainMessage"]>>>,
        ParentType,
        ContextType
    >
    out_msgs?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["String"]>>>,
        ParentType,
        ContextType
    >
    outmsg_cnt?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    prepare_transaction?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    prev_trans_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    prev_trans_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainTransactionPrev_Trans_LtArgs, never>
    >
    proof?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    split_info?: Resolver<
        Maybe<ResolversTypes["TransactionSplitInfo"]>,
        ParentType,
        ContextType
    >
    status?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    status_name?: Resolver<
        Maybe<ResolversTypes["TransactionProcessingStatusEnum"]>,
        ParentType,
        ContextType
    >
    storage?: Resolver<
        Maybe<ResolversTypes["TransactionStorage"]>,
        ParentType,
        ContextType
    >
    total_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<BlockchainTransactionTotal_FeesArgs, never>
    >
    total_fees_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    tr_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    tr_type_name?: Resolver<
        Maybe<ResolversTypes["TransactionTypeEnum"]>,
        ParentType,
        ContextType
    >
    tt?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainTransactionEdgeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainTransactionEdge"] = ResolversParentTypes["BlockchainTransactionEdge"],
> = {
    node?: Resolver<
        ResolversTypes["BlockchainTransaction"],
        ParentType,
        ContextType
    >
    cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type BlockchainTransactionsConnectionResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["BlockchainTransactionsConnection"] = ResolversParentTypes["BlockchainTransactionsConnection"],
> = {
    edges?: Resolver<
        Array<ResolversTypes["BlockchainTransactionEdge"]>,
        ParentType,
        ContextType
    >
    pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["Config"] = ResolversParentTypes["Config"],
> = {
    p0?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    p1?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    p10?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["Float"]>>>,
        ParentType,
        ContextType
    >
    p11?: Resolver<Maybe<ResolversTypes["ConfigP11"]>, ParentType, ContextType>
    p12?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["ConfigP12"]>>>,
        ParentType,
        ContextType
    >
    p14?: Resolver<Maybe<ResolversTypes["ConfigP14"]>, ParentType, ContextType>
    p15?: Resolver<Maybe<ResolversTypes["ConfigP15"]>, ParentType, ContextType>
    p16?: Resolver<Maybe<ResolversTypes["ConfigP16"]>, ParentType, ContextType>
    p17?: Resolver<Maybe<ResolversTypes["ConfigP17"]>, ParentType, ContextType>
    p18?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["ConfigP18"]>>>,
        ParentType,
        ContextType
    >
    p2?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    p20?: Resolver<
        Maybe<ResolversTypes["GasLimitsPrices"]>,
        ParentType,
        ContextType
    >
    p21?: Resolver<
        Maybe<ResolversTypes["GasLimitsPrices"]>,
        ParentType,
        ContextType
    >
    p22?: Resolver<
        Maybe<ResolversTypes["BlockLimits"]>,
        ParentType,
        ContextType
    >
    p23?: Resolver<
        Maybe<ResolversTypes["BlockLimits"]>,
        ParentType,
        ContextType
    >
    p24?: Resolver<
        Maybe<ResolversTypes["MsgForwardPrices"]>,
        ParentType,
        ContextType
    >
    p25?: Resolver<
        Maybe<ResolversTypes["MsgForwardPrices"]>,
        ParentType,
        ContextType
    >
    p28?: Resolver<Maybe<ResolversTypes["ConfigP28"]>, ParentType, ContextType>
    p29?: Resolver<Maybe<ResolversTypes["ConfigP29"]>, ParentType, ContextType>
    p3?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    p31?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["String"]>>>,
        ParentType,
        ContextType
    >
    p32?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p33?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p34?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p35?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p36?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p37?: Resolver<
        Maybe<ResolversTypes["ValidatorSet"]>,
        ParentType,
        ContextType
    >
    p39?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["ConfigP39"]>>>,
        ParentType,
        ContextType
    >
    p4?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    p6?: Resolver<Maybe<ResolversTypes["ConfigP6"]>, ParentType, ContextType>
    p7?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["ConfigP7"]>>>,
        ParentType,
        ContextType
    >
    p8?: Resolver<Maybe<ResolversTypes["ConfigP8"]>, ParentType, ContextType>
    p9?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["Float"]>>>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP11Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP11"] = ResolversParentTypes["ConfigP11"],
> = {
    critical_params?: Resolver<
        Maybe<ResolversTypes["ConfigProposalSetup"]>,
        ParentType,
        ContextType
    >
    normal_params?: Resolver<
        Maybe<ResolversTypes["ConfigProposalSetup"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP12Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP12"] = ResolversParentTypes["ConfigP12"],
> = {
    accept_msgs?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    active?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    actual_min_split?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    addr_len_step?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    basic?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    enabled_since?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    flags?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    max_addr_len?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    max_split?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    min_addr_len?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    min_split?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    version?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    vm_mode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    vm_version?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    workchain_id?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    workchain_type_id?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    zerostate_file_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    zerostate_root_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP14Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP14"] = ResolversParentTypes["ConfigP14"],
> = {
    basechain_block_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP14Basechain_Block_FeeArgs, never>
    >
    masterchain_block_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP14Masterchain_Block_FeeArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP15Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP15"] = ResolversParentTypes["ConfigP15"],
> = {
    elections_end_before?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    elections_start_before?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    stake_held_for?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    validators_elected_for?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP16Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP16"] = ResolversParentTypes["ConfigP16"],
> = {
    max_main_validators?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    max_validators?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    min_validators?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP17Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP17"] = ResolversParentTypes["ConfigP17"],
> = {
    max_stake?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP17Max_StakeArgs, never>
    >
    max_stake_factor?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    min_stake?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP17Min_StakeArgs, never>
    >
    min_total_stake?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP17Min_Total_StakeArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP18Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP18"] = ResolversParentTypes["ConfigP18"],
> = {
    bit_price_ps?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP18Bit_Price_PsArgs, never>
    >
    cell_price_ps?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP18Cell_Price_PsArgs, never>
    >
    mc_bit_price_ps?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP18Mc_Bit_Price_PsArgs, never>
    >
    mc_cell_price_ps?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP18Mc_Cell_Price_PsArgs, never>
    >
    utime_since?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    utime_since_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP28Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP28"] = ResolversParentTypes["ConfigP28"],
> = {
    mc_catchain_lifetime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    shard_catchain_lifetime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    shard_validators_lifetime?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    shard_validators_num?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    shuffle_mc_validators?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP29Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP29"] = ResolversParentTypes["ConfigP29"],
> = {
    attempt_duration?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    catchain_max_deps?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    consensus_timeout_ms?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    fast_attempts?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    max_block_bytes?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    max_collated_bytes?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    new_catchain_ids?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    next_candidate_delay_ms?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    round_candidates?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP39Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP39"] = ResolversParentTypes["ConfigP39"],
> = {
    adnl_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    seqno?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    signature_r?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    signature_s?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    temp_public_key?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    valid_until?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP6Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP6"] = ResolversParentTypes["ConfigP6"],
> = {
    mint_add_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    mint_new_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP7Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP7"] = ResolversParentTypes["ConfigP7"],
> = {
    currency?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    value?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigP8Resolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigP8"] = ResolversParentTypes["ConfigP8"],
> = {
    capabilities?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ConfigP8CapabilitiesArgs, never>
    >
    version?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ConfigProposalSetupResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ConfigProposalSetup"] = ResolversParentTypes["ConfigProposalSetup"],
> = {
    bit_price?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    cell_price?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    max_losses?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    max_store_sec?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    max_tot_rounds?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    min_store_sec?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    min_tot_rounds?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    min_wins?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ExtBlkRefResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ExtBlkRef"] = ResolversParentTypes["ExtBlkRef"],
> = {
    end_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ExtBlkRefEnd_LtArgs, never>
    >
    file_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    root_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    seq_no?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type GasLimitsPricesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["GasLimitsPrices"] = ResolversParentTypes["GasLimitsPrices"],
> = {
    block_gas_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesBlock_Gas_LimitArgs, never>
    >
    delete_due_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesDelete_Due_LimitArgs, never>
    >
    flat_gas_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesFlat_Gas_LimitArgs, never>
    >
    flat_gas_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesFlat_Gas_PriceArgs, never>
    >
    freeze_due_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesFreeze_Due_LimitArgs, never>
    >
    gas_credit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesGas_CreditArgs, never>
    >
    gas_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesGas_LimitArgs, never>
    >
    gas_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesGas_PriceArgs, never>
    >
    special_gas_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<GasLimitsPricesSpecial_Gas_LimitArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type InMsgResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["InMsg"] = ResolversParentTypes["InMsg"],
> = {
    fwd_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<InMsgFwd_FeeArgs, never>
    >
    ihr_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<InMsgIhr_FeeArgs, never>
    >
    in_msg?: Resolver<
        Maybe<ResolversTypes["MsgEnvelope"]>,
        ParentType,
        ContextType
    >
    msg_id?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    msg_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    msg_type_name?: Resolver<
        Maybe<ResolversTypes["InMsgTypeEnum"]>,
        ParentType,
        ContextType
    >
    out_msg?: Resolver<
        Maybe<ResolversTypes["MsgEnvelope"]>,
        ParentType,
        ContextType
    >
    proof_created?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    proof_delivered?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    transaction_id?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    transit_fee?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<InMsgTransit_FeeArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MsgEnvelopeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["MsgEnvelope"] = ResolversParentTypes["MsgEnvelope"],
> = {
    cur_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    fwd_fee_remaining?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<MsgEnvelopeFwd_Fee_RemainingArgs, never>
    >
    msg_id?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    next_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type MsgForwardPricesResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["MsgForwardPrices"] = ResolversParentTypes["MsgForwardPrices"],
> = {
    bit_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<MsgForwardPricesBit_PriceArgs, never>
    >
    cell_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<MsgForwardPricesCell_PriceArgs, never>
    >
    first_frac?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    ihr_price_factor?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    lump_price?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<MsgForwardPricesLump_PriceArgs, never>
    >
    next_frac?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type NodeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["Node"] = ResolversParentTypes["Node"],
> = {
    __resolveType: TypeResolveFn<
        | "BlockchainAccount"
        | "BlockchainBlock"
        | "BlockchainMessage"
        | "BlockchainTransaction",
        ParentType,
        ContextType
    >
    id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>
}

export type OtherCurrencyResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["OtherCurrency"] = ResolversParentTypes["OtherCurrency"],
> = {
    currency?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    value?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<OtherCurrencyValueArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type OutMsgResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["OutMsg"] = ResolversParentTypes["OutMsg"],
> = {
    import_block_lt?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<OutMsgImport_Block_LtArgs, never>
    >
    imported?: Resolver<Maybe<ResolversTypes["InMsg"]>, ParentType, ContextType>
    msg_env_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    msg_id?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>
    msg_type?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    msg_type_name?: Resolver<
        Maybe<ResolversTypes["OutMsgTypeEnum"]>,
        ParentType,
        ContextType
    >
    next_addr_pfx?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<OutMsgNext_Addr_PfxArgs, never>
    >
    next_workchain?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    out_msg?: Resolver<
        Maybe<ResolversTypes["MsgEnvelope"]>,
        ParentType,
        ContextType
    >
    reimport?: Resolver<Maybe<ResolversTypes["InMsg"]>, ParentType, ContextType>
    transaction_id?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type PageInfoResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["PageInfo"] = ResolversParentTypes["PageInfo"],
> = {
    startCursor?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    endCursor?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    hasNextPage?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>
    hasPreviousPage?: Resolver<
        ResolversTypes["Boolean"],
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type QueryResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = {
    blockchain?: Resolver<
        Maybe<ResolversTypes["BlockchainQuery"]>,
        ParentType,
        ContextType
    >
}

export type TransactionActionResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionAction"] = ResolversParentTypes["TransactionAction"],
> = {
    action_list_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    msgs_created?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    no_funds?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    result_arg?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    result_code?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    skipped_actions?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    spec_actions?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    status_change?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    status_change_name?: Resolver<
        Maybe<ResolversTypes["AccountStatusChangeEnum"]>,
        ParentType,
        ContextType
    >
    success?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    tot_actions?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    total_action_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionActionTotal_Action_FeesArgs, never>
    >
    total_fwd_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionActionTotal_Fwd_FeesArgs, never>
    >
    total_msg_size_bits?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    total_msg_size_cells?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    valid?: Resolver<Maybe<ResolversTypes["Boolean"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TransactionBounceResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionBounce"] = ResolversParentTypes["TransactionBounce"],
> = {
    bounce_type?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    bounce_type_name?: Resolver<
        Maybe<ResolversTypes["BounceTypeEnum"]>,
        ParentType,
        ContextType
    >
    fwd_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionBounceFwd_FeesArgs, never>
    >
    msg_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionBounceMsg_FeesArgs, never>
    >
    msg_size_bits?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    msg_size_cells?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    req_fwd_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionBounceReq_Fwd_FeesArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TransactionComputeResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionCompute"] = ResolversParentTypes["TransactionCompute"],
> = {
    account_activated?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    compute_type?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    compute_type_name?: Resolver<
        Maybe<ResolversTypes["ComputeTypeEnum"]>,
        ParentType,
        ContextType
    >
    exit_arg?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    exit_code?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    gas_credit?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    gas_fees?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionComputeGas_FeesArgs, never>
    >
    gas_limit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionComputeGas_LimitArgs, never>
    >
    gas_used?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionComputeGas_UsedArgs, never>
    >
    mode?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    msg_state_used?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    skipped_reason?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    skipped_reason_name?: Resolver<
        Maybe<ResolversTypes["SkipReasonEnum"]>,
        ParentType,
        ContextType
    >
    success?: Resolver<
        Maybe<ResolversTypes["Boolean"]>,
        ParentType,
        ContextType
    >
    vm_final_state_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    vm_init_state_hash?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    vm_steps?: Resolver<Maybe<ResolversTypes["Float"]>, ParentType, ContextType>
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TransactionCreditResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionCredit"] = ResolversParentTypes["TransactionCredit"],
> = {
    credit?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionCreditCreditArgs, never>
    >
    credit_other?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["OtherCurrency"]>>>,
        ParentType,
        ContextType
    >
    due_fees_collected?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionCreditDue_Fees_CollectedArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TransactionSplitInfoResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionSplitInfo"] = ResolversParentTypes["TransactionSplitInfo"],
> = {
    acc_split_depth?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    cur_shard_pfx_len?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    sibling_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    this_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type TransactionStorageResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["TransactionStorage"] = ResolversParentTypes["TransactionStorage"],
> = {
    status_change?: Resolver<
        Maybe<ResolversTypes["Int"]>,
        ParentType,
        ContextType
    >
    status_change_name?: Resolver<
        Maybe<ResolversTypes["AccountStatusChangeEnum"]>,
        ParentType,
        ContextType
    >
    storage_fees_collected?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionStorageStorage_Fees_CollectedArgs, never>
    >
    storage_fees_due?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<TransactionStorageStorage_Fees_DueArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ValidatorSetResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ValidatorSet"] = ResolversParentTypes["ValidatorSet"],
> = {
    list?: Resolver<
        Maybe<Array<Maybe<ResolversTypes["ValidatorSetList"]>>>,
        ParentType,
        ContextType
    >
    main?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    total?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>
    total_weight?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ValidatorSetTotal_WeightArgs, never>
    >
    utime_since?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    utime_since_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    utime_until?: Resolver<
        Maybe<ResolversTypes["Float"]>,
        ParentType,
        ContextType
    >
    utime_until_string?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type ValidatorSetListResolvers<
    ContextType = any,
    ParentType extends ResolversParentTypes["ValidatorSetList"] = ResolversParentTypes["ValidatorSetList"],
> = {
    adnl_addr?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    public_key?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType
    >
    weight?: Resolver<
        Maybe<ResolversTypes["String"]>,
        ParentType,
        ContextType,
        RequireFields<ValidatorSetListWeightArgs, never>
    >
    __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
    BlockAccountBlocks?: BlockAccountBlocksResolvers<ContextType>
    BlockAccountBlocksTransactions?: BlockAccountBlocksTransactionsResolvers<ContextType>
    BlockLimits?: BlockLimitsResolvers<ContextType>
    BlockLimitsBytes?: BlockLimitsBytesResolvers<ContextType>
    BlockLimitsGas?: BlockLimitsGasResolvers<ContextType>
    BlockLimitsLtDelta?: BlockLimitsLtDeltaResolvers<ContextType>
    BlockMaster?: BlockMasterResolvers<ContextType>
    BlockMasterPrevBlkSignatures?: BlockMasterPrevBlkSignaturesResolvers<ContextType>
    BlockMasterShardFees?: BlockMasterShardFeesResolvers<ContextType>
    BlockMasterShardHashes?: BlockMasterShardHashesResolvers<ContextType>
    BlockMasterShardHashesDescr?: BlockMasterShardHashesDescrResolvers<ContextType>
    BlockSignature?: BlockSignatureResolvers<ContextType>
    BlockStateUpdate?: BlockStateUpdateResolvers<ContextType>
    BlockValueFlow?: BlockValueFlowResolvers<ContextType>
    BlockchainAccount?: BlockchainAccountResolvers<ContextType>
    BlockchainAccountQuery?: BlockchainAccountQueryResolvers<ContextType>
    BlockchainBlock?: BlockchainBlockResolvers<ContextType>
    BlockchainBlockSignatures?: BlockchainBlockSignaturesResolvers<ContextType>
    BlockchainBlocksConnection?: BlockchainBlocksConnectionResolvers<ContextType>
    BlockchainBlocksEdge?: BlockchainBlocksEdgeResolvers<ContextType>
    BlockchainMasterSeqNoRange?: BlockchainMasterSeqNoRangeResolvers<ContextType>
    BlockchainMessage?: BlockchainMessageResolvers<ContextType>
    BlockchainMessageEdge?: BlockchainMessageEdgeResolvers<ContextType>
    BlockchainMessagesConnection?: BlockchainMessagesConnectionResolvers<ContextType>
    BlockchainQuery?: BlockchainQueryResolvers<ContextType>
    BlockchainTransaction?: BlockchainTransactionResolvers<ContextType>
    BlockchainTransactionEdge?: BlockchainTransactionEdgeResolvers<ContextType>
    BlockchainTransactionsConnection?: BlockchainTransactionsConnectionResolvers<ContextType>
    Config?: ConfigResolvers<ContextType>
    ConfigP11?: ConfigP11Resolvers<ContextType>
    ConfigP12?: ConfigP12Resolvers<ContextType>
    ConfigP14?: ConfigP14Resolvers<ContextType>
    ConfigP15?: ConfigP15Resolvers<ContextType>
    ConfigP16?: ConfigP16Resolvers<ContextType>
    ConfigP17?: ConfigP17Resolvers<ContextType>
    ConfigP18?: ConfigP18Resolvers<ContextType>
    ConfigP28?: ConfigP28Resolvers<ContextType>
    ConfigP29?: ConfigP29Resolvers<ContextType>
    ConfigP39?: ConfigP39Resolvers<ContextType>
    ConfigP6?: ConfigP6Resolvers<ContextType>
    ConfigP7?: ConfigP7Resolvers<ContextType>
    ConfigP8?: ConfigP8Resolvers<ContextType>
    ConfigProposalSetup?: ConfigProposalSetupResolvers<ContextType>
    ExtBlkRef?: ExtBlkRefResolvers<ContextType>
    GasLimitsPrices?: GasLimitsPricesResolvers<ContextType>
    InMsg?: InMsgResolvers<ContextType>
    MsgEnvelope?: MsgEnvelopeResolvers<ContextType>
    MsgForwardPrices?: MsgForwardPricesResolvers<ContextType>
    Node?: NodeResolvers<ContextType>
    OtherCurrency?: OtherCurrencyResolvers<ContextType>
    OutMsg?: OutMsgResolvers<ContextType>
    PageInfo?: PageInfoResolvers<ContextType>
    Query?: QueryResolvers<ContextType>
    TransactionAction?: TransactionActionResolvers<ContextType>
    TransactionBounce?: TransactionBounceResolvers<ContextType>
    TransactionCompute?: TransactionComputeResolvers<ContextType>
    TransactionCredit?: TransactionCreditResolvers<ContextType>
    TransactionSplitInfo?: TransactionSplitInfoResolvers<ContextType>
    TransactionStorage?: TransactionStorageResolvers<ContextType>
    ValidatorSet?: ValidatorSetResolvers<ContextType>
    ValidatorSetList?: ValidatorSetListResolvers<ContextType>
}
