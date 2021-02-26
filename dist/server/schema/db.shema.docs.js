"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.docs = void 0;
// eslint-disable-next-line import/prefer-default-export
const docs = {
  account: {
    _doc: `
# Account type

Recall that a smart contract and an account are the same thing in the context
of the TON Blockchain, and that these terms can be used interchangeably, at
least as long as only small (or “usual”) smart contracts are considered. A large
smart-contract may employ several accounts lying in different shardchains of
the same workchain for load balancing purposes.

An account is identified by its full address and is completely described by
its state. In other words, there is nothing else in an account apart from its
address and state.
           `,
    id: ``,
    workchain_id: `Workchain id of the account address (id field).`,
    acc_type: `Returns the current status of the account.
\`\`\`
{
  accounts(filter: {acc_type:{eq:1}}){
    id
    acc_type
  }
}
\`\`\`
        `,
    last_paid: `
Contains either the unixtime of the most recent storage payment
collected (usually this is the unixtime of the most recent transaction),
or the unixtime when the account was created (again, by a transaction).
\`\`\`
query{
  accounts(filter: {
    last_paid:{ge:1567296000}
  }) {
  id
  last_paid}
}
\`\`\`     
                `,
    bits: 'Contains sum of all the bits used by the cells of the account. Used in storage fee calculation',
    cells: 'Contains number of the cells of the account. Used in storage fee calculation',
    public_cells: 'Contains the number of public cells of the account. Used in storage fee calculation.',
    due_payment: `
If present, accumulates the storage payments that could not be exacted from the balance of the account, represented by a strictly positive amount of nanograms; it can be present only for uninitialized or frozen accounts that have a balance of zero Grams (but may have non-zero balances in non gram cryptocurrencies). When due_payment becomes larger than the value of a configurable parameter of the blockchain, the ac- count is destroyed altogether, and its balance, if any, is transferred to the zero account.
\`\`\`
{
  accounts(filter: { due_payment: { ne: null } })
    {
      id
    }
}
\`\`\`
        `,
    last_trans_lt: ` `,
    balance: `
\`\`\`
{
  accounts(orderBy:{path:"balance",direction:DESC}){
    balance
  }
}
\`\`\`
        `,
    balance_other: ` `,
    split_depth: `Is present and non-zero only in instances of large smart contracts.`,
    tick: `May be present only in the masterchain—and within the masterchain, only in some fundamental smart contracts required for the whole system to function.`,
    tock: `May be present only in the masterchain—and within the masterchain, only in some fundamental smart contracts required for the whole system to function.
\`\`\`        
{
  accounts (filter:{tock:{ne:null}}){
    id
    tock
    tick
  }
}
\`\`\`
        `,
    code: `If present, contains smart-contract code encoded with in base64.
\`\`\`  
{
  accounts (filter:{code:{eq:null}}){
    id
    acc_type
  }
}   
\`\`\`          
        
        
        `,
    code_hash: `\`code\` field root hash.`,
    data: `If present, contains smart-contract data encoded with in base64.`,
    data_hash: `\`data\` field root hash.`,
    library: `If present, contains library code used in smart-contract.`,
    library_hash: `\`library\` field root hash.`,
    proof: `Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64.`,
    boc: `Bag of cells with the account struct encoded as base64.`,
    state_hash: `Contains the representation hash of an instance of \`StateInit\` when an account is frozen.`
  },
  message: {
    _doc: `# Message type

           Message layout queries.  A message consists of its header followed by its
           body or payload. The body is essentially arbitrary, to be interpreted by the
           destination smart contract. It can be queried with the following fields:`,
    msg_type: `Returns the type of message.`,
    status: `Returns internal processing status according to the numbers shown.`,
    block_id: `Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64.`,
    body: `Bag of cells with the message body encoded as base64.`,
    body_hash: `\`body\` field root hash.`,
    split_depth: `This is only used for special contracts in masterchain to deploy messages.`,
    tick: `This is only used for special contracts in masterchain to deploy messages.`,
    tock: `This is only used for special contracts in masterchain to deploy messages`,
    code: `Represents contract code in deploy messages.`,
    code_hash: `\`code\` field root hash.`,
    data: `Represents initial data for a contract in deploy messages`,
    data_hash: `\`data\` field root hash.`,
    library: `Represents contract library in deploy messages`,
    library_hash: `\`library\` field root hash.`,
    src: `Returns source address string`,
    dst: `Returns destination address string`,
    src_workchain_id: `Workchain id of the source address (src field)`,
    dst_workchain_id: `Workchain id of the destination address (dst field)`,
    created_lt: `Logical creation time automatically set by the generating transaction.`,
    created_at: `Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction.`,
    ihr_disabled: `IHR is disabled for the message.`,
    ihr_fee: `This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism.`,
    fwd_fee: `Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated.`,
    import_fee: ``,
    bounce: `Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.`,
    bounced: `Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender.`,
    value: `May or may not be present`,
    value_other: `May or may not be present.`,
    proof: `Merkle proof that message is a part of a block it cut from. It is a bag of cells with Merkle proof struct encoded as base64.`,
    boc: `A bag of cells with the message structure encoded as base64.`
  },
  transaction: {
    _doc: 'TON Transaction',
    _: {
      collection: 'transactions'
    },
    tr_type: `Transaction type according to the original blockchain specification, clause 4.2.4.`,
    status: `Transaction processing status`,
    block_id: ``,
    account_addr: ``,
    workchain_id: `Workchain id of the account address (account_addr field)`,
    lt: `Logical time. A component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see [the TON blockchain specification](https://test.ton.org/tblkch.pdf).`,
    prev_trans_hash: ``,
    prev_trans_lt: ``,
    now: ``,
    outmsg_cnt: `The number of generated outbound messages (one of the common transaction parameters defined by the specification)`,
    orig_status: `The initial state of account. Note that in this case the query may return 0, if the account was not active before the transaction and 1 if it was already active`,
    end_status: `The end state of an account after a transaction, 1 is returned to indicate a finalized transaction at an active account`,
    in_msg: ``,
    in_message: ``,
    out_msgs: `Dictionary of transaction outbound messages as specified in the specification`,
    out_messages: ``,
    total_fees: `Total amount of fees that entails account state change and used in Merkle update`,
    total_fees_other: `Same as above, but reserved for non gram coins that may appear in the blockchain`,
    old_hash: `Merkle update field`,
    new_hash: `Merkle update field`,
    credit_first: ``,
    storage: {
      storage_fees_collected: `This field defines the amount of storage fees collected in grams.`,
      storage_fees_due: `This field represents the amount of due fees in grams, it might be empty.`,
      status_change: `This field represents account status change after the transaction is completed.`
    },
    credit: {
      _doc: `The account is credited with the value of the inbound message received. The credit phase can result in the collection of some due payments`,
      due_fees_collected: `The sum of due_fees_collected and credit must equal the value of the message received, plus its ihr_fee if the message has not been received via Instant Hypercube Routing, IHR (otherwise the ihr_fee is awarded to the validators).`,
      credit: ``,
      credit_other: ``
    },
    compute: {
      _doc: `The code of the smart contract is invoked inside an instance of TVM with adequate parameters, including a copy of the inbound message and of the persistent data, and terminates with an exit code, the new persistent data, and an action list (which includes, for instance, outbound messages to be sent). The processing phase may lead to the creation of a new account (uninitialized or active), or to the activation of a previously uninitialized or frozen account. The gas payment, equal to the product of the gas price and the gas consumed, is exacted from the account balance.
If there is no reason to skip the computing phase, TVM is invoked and the results of the computation are logged. Possible parameters are covered below.`,
      compute_type: ``,
      skipped_reason: `Reason for skipping the compute phase. According to the specification, the phase can be skipped due to the absence of funds to buy gas, absence of state of an account or a message, failure to provide a valid state in the message`,
      success: `This flag is set if and only if exit_code is either 0 or 1.`,
      msg_state_used: `This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)`,
      account_activated: `The flag reflects whether this has resulted in the activation of a previously frozen, uninitialized or non-existent account.`,
      gas_fees: `This parameter reflects the total gas fees collected by the validators for executing this transaction. It must be equal to the product of gas_used and gas_price from the current block header.`,
      gas_used: ``,
      gas_limit: `This parameter reflects the gas limit for this instance of TVM. It equals the lesser of either the Grams credited in the credit phase from the value of the inbound message divided by the current gas price, or the global per-transaction gas limit.`,
      gas_credit: `This parameter may be non-zero only for external inbound messages. It is the lesser of either the amount of gas that can be paid from the account balance or the maximum gas credit`,
      mode: ``,
      exit_code: `These parameter represents the status values returned by TVM; for a successful transaction, exit_code has to be 0 or 1`,
      exit_arg: ``,
      vm_steps: `the total number of steps performed by TVM (usually equal to two plus the number of instructions executed, including implicit RETs)`,
      vm_init_state_hash: `This parameter is the representation hashes of the original state of TVM.`,
      vm_final_state_hash: `This parameter is the representation hashes of the resulting state of TVM.`
    },
    action: {
      _doc: `If the smart contract has terminated successfully (with exit code 0 or 1), the actions from the list are performed. If it is impossible to perform all of them—for example, because of insufficient funds to transfer with an outbound message—then the transaction is aborted and the account state is rolled back. The transaction is also aborted if the smart contract did not terminate successfully, or if it was not possible to invoke the smart contract at all because it is uninitialized or frozen.`,
      success: ``,
      valid: ``,
      no_funds: `The flag indicates absence of funds required to create an outbound message`,
      status_change: ``,
      total_fwd_fees: ``,
      total_action_fees: ``,
      result_code: ``,
      result_arg: ``,
      tot_actions: ``,
      spec_actions: ``,
      skipped_actions: ``,
      msgs_created: ``,
      action_list_hash: ``,
      total_msg_size_cells: ``,
      total_msg_size_bits: ``
    },
    bounce: {
      _doc: `If the transaction has been aborted, and the inbound message has its bounce flag set, then it is “bounced” by automatically generating an outbound message (with the bounce flag clear) to its original sender. Almost all value of the original inbound message (minus gas payments and forwarding fees) is transferred to the generated message, which otherwise has an empty body.`,
      bounce_type: ``,
      msg_size_cells: ``,
      msg_size_bits: ``,
      req_fwd_fees: ``,
      msg_fees: ``,
      fwd_fees: ``
    },
    aborted: ``,
    destroyed: ``,
    tt: ``,
    split_info: {
      _doc: `The fields below cover split prepare and install transactions and merge prepare and install transactions, the fields correspond to the relevant schemes covered by the blockchain specification.`,
      cur_shard_pfx_len: `length of the current shard prefix`,
      acc_split_depth: ``,
      this_addr: ``,
      sibling_addr: ``
    },
    prepare_transaction: ``,
    installed: ``,
    proof: ``,
    boc: ``
  },
  shardDescr: {
    _doc: `ShardHashes is represented by a dictionary with 32-bit workchain_ids as keys, and “shard binary trees”, represented by TL-B type BinTree ShardDescr, as values. Each leaf of this shard binary tree contains a value of type ShardDescr, which describes a single shard by indicating the sequence number seq_no, the logical time lt, and the hash hash of the latest (signed) block of the corresponding shardchain.`,
    seq_no: `uint32 sequence number`,
    reg_mc_seqno: `Returns last known master block at the time of shard generation.`,
    start_lt: `Logical time of the shardchain start`,
    end_lt: `Logical time of the shardchain end`,
    root_hash: `Returns last known master block at the time of shard generation. The shard block configuration is derived from that block.`,
    file_hash: `Shard block file hash.`,
    before_split: `TON Blockchain supports dynamic sharding, so the shard configuration may change from block to block because of shard merge and split events. Therefore, we cannot simply say that each shardchain corresponds to a fixed set of account chains.
A shardchain block and its state may each be classified into two distinct parts. The parts with the ISP-dictated form of will be called the split parts of the block and its state, while the remainder will be called the non-split parts.
The masterchain cannot be split or merged.`,
    before_merge: ``,
    want_split: ``,
    want_merge: ``,
    nx_cc_updated: ``,
    flags: ``,
    next_catchain_seqno: ``,
    next_validator_shard: ``,
    min_ref_mc_seqno: ``,
    gen_utime: `Generation time in uint32`,
    split_type: ``,
    split: ``,
    fees_collected: `Amount of fees collected int his shard in grams.`,
    fees_collected_other: `Amount of fees collected int his shard in non gram currencies.`,
    funds_created: `Amount of funds created in this shard in grams.`,
    funds_created_other: `Amount of funds created in this shard in non gram currencies.`
  },
  block: {
    _doc: 'This is Block',
    status: `Returns block processing status`,
    global_id: `uint32 global block ID`,
    want_split: ``,
    seq_no: ``,
    after_merge: ``,
    gen_utime: `uint 32 generation time stamp`,
    gen_catchain_seqno: ``,
    flags: ``,
    master_ref: ``,
    prev_ref: `External block reference for previous block.`,
    prev_alt_ref: `External block reference for previous block in case of shard merge.`,
    prev_vert_ref: `External block reference for previous block in case of vertical blocks.`,
    prev_vert_alt_ref: ``,
    version: `uin32 block version identifier`,
    gen_validator_list_hash_short: ``,
    before_split: ``,
    after_split: ``,
    want_merge: ``,
    vert_seq_no: ``,
    start_lt: `Logical creation time automatically set by the block formation start.
Logical time is a component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see the TON blockchain specification`,
    end_lt: `Logical creation time automatically set by the block formation end.`,
    workchain_id: `uint32 workchain identifier`,
    shard: ``,
    min_ref_mc_seqno: `Returns last known master block at the time of shard generation.`,
    prev_key_block_seqno: `Returns a number of a previous key block.`,
    gen_software_version: ``,
    gen_software_capabilities: ``,
    value_flow: {
      to_next_blk: `Amount of grams amount to the next block.`,
      to_next_blk_other: `Amount of non gram cryptocurrencies to the next block.`,
      exported: `Amount of grams exported.`,
      exported_other: `Amount of non gram cryptocurrencies exported.`,
      fees_collected: ``,
      fees_collected_other: ``,
      created: ``,
      created_other: ``,
      imported: `Amount of grams imported.`,
      imported_other: `Amount of non gram cryptocurrencies imported.`,
      from_prev_blk: `Amount of grams transferred from previous block.`,
      from_prev_blk_other: `Amount of non gram cryptocurrencies transferred from previous block.`,
      minted: `Amount of grams minted in this block.`,
      minted_other: ``,
      fees_imported: `Amount of import fees in grams`,
      fees_imported_other: `Amount of import fees in non gram currencies.`
    },
    in_msg_descr: ``,
    rand_seed: ``,
    created_by: `Public key of the collator who produced this block.`,
    out_msg_descr: ``,
    account_blocks: {
      account_addr: ``,
      transactions: ``,
      state_update: {
        old_hash: `old version of block hashes`,
        new_hash: `new version of block hashes`
      },
      tr_count: ``
    },
    state_update: {
      new: ``,
      new_hash: ``,
      new_depth: ``,
      old: ``,
      old_hash: ``,
      old_depth: ``
    },
    master: {
      min_shard_gen_utime: 'Min block generation time of shards',
      max_shard_gen_utime: 'Max block generation time of shards',
      shard_hashes: {
        _doc: `Array of shard hashes`,
        workchain_id: `Uint32 workchain ID`,
        shard: `Shard ID`,
        descr: `Shard description`
      },
      shard_fees: {
        workchain_id: ``,
        shard: ``,
        fees: `Amount of fees in grams`,
        fees_other: `Array of fees in non gram crypto currencies`,
        create: `Amount of fees created during shard`,
        create_other: `Amount of non gram fees created in non gram crypto currencies during the block.`
      },
      recover_create_msg: ``,
      prev_blk_signatures: {
        _doc: `Array of previous block signatures`,
        node_id: ``,
        r: ``,
        s: ``
      },
      config_addr: ``,
      config: {
        p0: `Address of config smart contract in the masterchain`,
        p1: `Address of elector smart contract in the masterchain`,
        p2: `Address of minter smart contract in the masterchain`,
        p3: `Address of fee collector smart contract in the masterchain`,
        p4: `Address of TON DNS root smart contract in the masterchain`,
        p6: {
          _doc: `Configuration parameter 6`,
          mint_new_price: ``,
          mint_add_price: ``
        },
        p7: {
          _doc: `Configuration parameter 7`,
          currency: ``,
          value: ``
        },
        p8: {
          _doc: `Global version`,
          version: ``,
          capabilities: ``
        },
        p9: `Mandatory params`,
        p10: `Critical params`,
        p11: {
          _doc: `Config voting setup`,
          normal_params: ``,
          critical_params: ``
        },
        p12: {
          _doc: `Array of all workchains descriptions`,
          workchain_id: ``,
          enabled_since: ``,
          actual_min_split: ``,
          min_split: ``,
          max_split: ``,
          active: ``,
          accept_msgs: ``,
          flags: ``,
          zerostate_root_hash: ``,
          zerostate_file_hash: ``,
          version: ``,
          basic: ``,
          vm_version: ``,
          vm_mode: ``,
          min_addr_len: ``,
          max_addr_len: ``,
          addr_len_step: ``,
          workchain_type_id: ``
        },
        p14: {
          _doc: `Block create fees`,
          masterchain_block_fee: ``,
          basechain_block_fee: ``
        },
        p15: {
          _doc: `Election parameters`,
          validators_elected_for: ``,
          elections_start_before: ``,
          elections_end_before: ``,
          stake_held_for: ``
        },
        p16: {
          _doc: `Validators count`,
          max_validators: ``,
          max_main_validators: ``,
          min_validators: ``
        },
        p17: {
          _doc: `Validator stake parameters`,
          min_stake: ``,
          max_stake: ``,
          min_total_stake: ``,
          max_stake_factor: ``
        },
        p18: {
          _doc: `Storage prices`,
          utime_since: ``,
          bit_price_ps: ``,
          cell_price_ps: ``,
          mc_bit_price_ps: ``,
          mc_cell_price_ps: ``
        },
        p20: `Gas limits and prices in the masterchain`,
        p21: `Gas limits and prices in workchains`,
        p22: `Block limits in the masterchain`,
        p23: `Block limits in workchains`,
        p24: `Message forward prices in the masterchain`,
        p25: `Message forward prices in workchains`,
        p28: {
          _doc: `Catchain config`,
          mc_catchain_lifetime: ``,
          shard_catchain_lifetime: ``,
          shard_validators_lifetime: ``,
          shard_validators_num: ``
        },
        p29: {
          _doc: `Consensus config`,
          round_candidates: ``,
          next_candidate_delay_ms: ``,
          consensus_timeout_ms: ``,
          fast_attempts: ``,
          attempt_duration: ``,
          catchain_max_deps: ``,
          max_block_bytes: ``,
          max_collated_bytes: ``
        },
        p31: `Array of fundamental smart contracts addresses`,
        p32: `Previous validators set`,
        p33: `Previous temprorary validators set`,
        p34: `Current validators set`,
        p35: `Current temprorary validators set`,
        p36: `Next validators set`,
        p37: `Next temprorary validators set`,
        p39: {
          _doc: `Array of validator signed temprorary keys`,
          adnl_addr: ``,
          temp_public_key: ``,
          seqno: ``,
          valid_until: ``,
          signature_r: ``,
          signature_s: ``
        }
      }
    },
    key_block: 'true if this block is a key block',
    boc: 'Serialized bag of cell of this block encoded with base64',
    balance_delta: 'Account balance change after transaction'
  },
  blockSignatures: {
    _doc: `Set of validator\'s signatures for the Block with correspond id`,
    gen_utime: `Signed block's gen_utime`,
    seq_no: `Signed block's seq_no`,
    shard: `Signed block's shard`,
    workchain_id: `Signed block's workchain_id`,
    proof: `Signed block's merkle proof`,
    validator_list_hash_short: ``,
    catchain_seqno: ``,
    sig_weight: ``,
    signatures: {
      _doc: `Array of signatures from block's validators`,
      node_id: `Validator ID`,
      r: `'R' part of signature`,
      s: `'s' part of signature`
    }
  },
  zerostate: {
    _doc: `The initial state of the workchain before first block was generated`,
    global_id: `uint32 global network ID`,
    workchain_id: `Zerostate's workchain_id`,
    accounts: `Initial accounts state at the workchain start`,
    total_balance: `Overall balance of all accounts of the workchain`,
    total_balance_other: `Overall balance of all accounts of the workchain in other currencies`,
    master: {
      global_balance: `Overall balance of all accounts`,
      global_balance_other: `Overall balance of all accounts in other currencies`,
      validator_list_hash_short: ``
    },
    boc: 'Serialized bag of cell of this zerostate encoded with base64',
    libraries: {
      _doc: `Initial libraries at the workchain start`,
      hash: `Library hash`,
      publishers: `List of the accounts which use the library`,
      lib: `Serialized bag of cell of this library encoded with base64`
    }
  }
};
exports.docs = docs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLnNoZW1hLmRvY3MuanMiXSwibmFtZXMiOlsiZG9jcyIsImFjY291bnQiLCJfZG9jIiwiaWQiLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImJpdHMiLCJjZWxscyIsInB1YmxpY19jZWxscyIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJjb2RlX2hhc2giLCJkYXRhIiwiZGF0YV9oYXNoIiwibGlicmFyeSIsImxpYnJhcnlfaGFzaCIsInByb29mIiwiYm9jIiwic3RhdGVfaGFzaCIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYm9keSIsImJvZHlfaGFzaCIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInRyYW5zYWN0aW9uIiwiXyIsImNvbGxlY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwic2hhcmREZXNjciIsInNlcV9ubyIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiZW5kX2x0Iiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0IiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZCIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwia2V5X2Jsb2NrIiwiYmFsYW5jZV9kZWx0YSIsImJsb2NrU2lnbmF0dXJlcyIsInZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJjYXRjaGFpbl9zZXFubyIsInNpZ193ZWlnaHQiLCJzaWduYXR1cmVzIiwiemVyb3N0YXRlIiwiYWNjb3VudHMiLCJ0b3RhbF9iYWxhbmNlIiwidG90YWxfYmFsYW5jZV9vdGhlciIsImdsb2JhbF9iYWxhbmNlIiwiZ2xvYmFsX2JhbGFuY2Vfb3RoZXIiLCJsaWJyYXJpZXMiLCJoYXNoIiwicHVibGlzaGVycyIsImxpYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDTyxNQUFNQSxJQUFJLEdBQUc7QUFDaEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxJQUFJLEVBQUc7Ozs7Ozs7Ozs7OztZQURGO0FBY0xDLElBQUFBLEVBQUUsRUFBRyxFQWRBO0FBZUxDLElBQUFBLFlBQVksRUFBRyxpREFmVjtBQWdCTEMsSUFBQUEsUUFBUSxFQUFHOzs7Ozs7Ozs7U0FoQk47QUEwQkxDLElBQUFBLFNBQVMsRUFBRzs7Ozs7Ozs7Ozs7OztpQkEx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QUFBQSxVQUFVLEVBQUU7QUFDUjFTLE1BQUFBLElBQUksRUFBRyw2Q0FEQztBQUVScU0sTUFBQUEsT0FBTyxFQUFHLGNBRkY7QUFHUkMsTUFBQUEsQ0FBQyxFQUFHLHVCQUhJO0FBSVJDLE1BQUFBLENBQUMsRUFBRztBQUpJO0FBVkMsR0F4ZUQ7QUEwZmhCb0csRUFBQUEsU0FBUyxFQUFFO0FBQ1AzUyxJQUFBQSxJQUFJLEVBQUcscUVBREE7QUFFUDhJLElBQUFBLFNBQVMsRUFBRywwQkFGTDtBQUdQNUksSUFBQUEsWUFBWSxFQUFHLDBCQUhSO0FBSVAwUyxJQUFBQSxRQUFRLEVBQUcsK0NBSko7QUFLUEMsSUFBQUEsYUFBYSxFQUFHLGtEQUxUO0FBTVBDLElBQUFBLG1CQUFtQixFQUFHLHNFQU5mO0FBT1BySCxJQUFBQSxNQUFNLEVBQUU7QUFDSnNILE1BQUFBLGNBQWMsRUFBRyxpQ0FEYjtBQUVKQyxNQUFBQSxvQkFBb0IsRUFBRyxxREFGbkI7QUFHSlQsTUFBQUEseUJBQXlCLEVBQUc7QUFIeEIsS0FQRDtBQVlQalIsSUFBQUEsR0FBRyxFQUFFLDhEQVpFO0FBYVAyUixJQUFBQSxTQUFTLEVBQUU7QUFDUGpULE1BQUFBLElBQUksRUFBRywwQ0FEQTtBQUVQa1QsTUFBQUEsSUFBSSxFQUFHLGNBRkE7QUFHUEMsTUFBQUEsVUFBVSxFQUFHLDRDQUhOO0FBSVBDLE1BQUFBLEdBQUcsRUFBRztBQUpDO0FBYko7QUExZkssQ0FBYiIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvcHJlZmVyLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgY29uc3QgZG9jcyA9IHtcbiAgICBhY2NvdW50OiB7XG4gICAgICAgIF9kb2M6IGBcbiMgQWNjb3VudCB0eXBlXG5cblJlY2FsbCB0aGF0IGEgc21hcnQgY29udHJhY3QgYW5kIGFuIGFjY291bnQgYXJlIHRoZSBzYW1lIHRoaW5nIGluIHRoZSBjb250ZXh0XG5vZiB0aGUgVE9OIEJsb2NrY2hhaW4sIGFuZCB0aGF0IHRoZXNlIHRlcm1zIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSwgYXRcbmxlYXN0IGFzIGxvbmcgYXMgb25seSBzbWFsbCAob3Ig4oCcdXN1YWzigJ0pIHNtYXJ0IGNvbnRyYWN0cyBhcmUgY29uc2lkZXJlZC4gQSBsYXJnZVxuc21hcnQtY29udHJhY3QgbWF5IGVtcGxveSBzZXZlcmFsIGFjY291bnRzIGx5aW5nIGluIGRpZmZlcmVudCBzaGFyZGNoYWlucyBvZlxudGhlIHNhbWUgd29ya2NoYWluIGZvciBsb2FkIGJhbGFuY2luZyBwdXJwb3Nlcy5cblxuQW4gYWNjb3VudCBpcyBpZGVudGlmaWVkIGJ5IGl0cyBmdWxsIGFkZHJlc3MgYW5kIGlzIGNvbXBsZXRlbHkgZGVzY3JpYmVkIGJ5XG5pdHMgc3RhdGUuIEluIG90aGVyIHdvcmRzLCB0aGVyZSBpcyBub3RoaW5nIGVsc2UgaW4gYW4gYWNjb3VudCBhcGFydCBmcm9tIGl0c1xuYWRkcmVzcyBhbmQgc3RhdGUuXG4gICAgICAgICAgIGAsXG4gICAgICAgIGlkOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGlkIGZpZWxkKS5gLFxuICAgICAgICBhY2NfdHlwZTogYFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjoge2FjY190eXBlOntlcToxfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfcGFpZDogYFxuQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50XG5jb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSxcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXG5cXGBcXGBcXGBcbnF1ZXJ5e1xuICBhY2NvdW50cyhmaWx0ZXI6IHtcbiAgICBsYXN0X3BhaWQ6e2dlOjE1NjcyOTYwMDB9XG4gIH0pIHtcbiAgaWRcbiAgbGFzdF9wYWlkfVxufVxuXFxgXFxgXFxgICAgICBcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICBiaXRzOiAnQ29udGFpbnMgc3VtIG9mIGFsbCB0aGUgYml0cyB1c2VkIGJ5IHRoZSBjZWxscyBvZiB0aGUgYWNjb3VudC4gVXNlZCBpbiBzdG9yYWdlIGZlZSBjYWxjdWxhdGlvbicsXG4gICAgICAgIGNlbGxzOiAnQ29udGFpbnMgbnVtYmVyIG9mIHRoZSBjZWxscyBvZiB0aGUgYWNjb3VudC4gVXNlZCBpbiBzdG9yYWdlIGZlZSBjYWxjdWxhdGlvbicsXG4gICAgICAgIHB1YmxpY19jZWxsczogJ0NvbnRhaW5zIHRoZSBudW1iZXIgb2YgcHVibGljIGNlbGxzIG9mIHRoZSBhY2NvdW50LiBVc2VkIGluIHN0b3JhZ2UgZmVlIGNhbGN1bGF0aW9uLicsXG4gICAgICAgIGR1ZV9wYXltZW50OiBgXG5JZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWMtIGNvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC5cblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhmaWx0ZXI6IHsgZHVlX3BheW1lbnQ6IHsgbmU6IG51bGwgfSB9KVxuICAgIHtcbiAgICAgIGlkXG4gICAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfdHJhbnNfbHQ6IGAgYCxcbiAgICAgICAgYmFsYW5jZTogYFxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKG9yZGVyQnk6e3BhdGg6XCJiYWxhbmNlXCIsZGlyZWN0aW9uOkRFU0N9KXtcbiAgICBiYWxhbmNlXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBiYWxhbmNlX290aGVyOiBgIGAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgSXMgcHJlc2VudCBhbmQgbm9uLXplcm8gb25seSBpbiBpbnN0YW5jZXMgb2YgbGFyZ2Ugc21hcnQgY29udHJhY3RzLmAsXG4gICAgICAgIHRpY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLmAsXG4gICAgICAgIHRvY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLlxuXFxgXFxgXFxgICAgICAgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7dG9jazp7bmU6bnVsbH19KXtcbiAgICBpZFxuICAgIHRvY2tcbiAgICB0aWNrXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBjb2RlOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LlxuXFxgXFxgXFxgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7Y29kZTp7ZXE6bnVsbH19KXtcbiAgICBpZFxuICAgIGFjY190eXBlXG4gIH1cbn0gICBcblxcYFxcYFxcYCAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBgLFxuICAgICAgICBjb2RlX2hhc2g6IGBcXGBjb2RlXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBkYXRhOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgZGF0YSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LmAsXG4gICAgICAgIGRhdGFfaGFzaDogYFxcYGRhdGFcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGxpYnJhcnk6IGBJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdC5gLFxuICAgICAgICBsaWJyYXJ5X2hhc2g6IGBcXGBsaWJyYXJ5XFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgYWNjb3VudCBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgc3RhdGVfaGFzaDogYENvbnRhaW5zIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoIG9mIGFuIGluc3RhbmNlIG9mIFxcYFN0YXRlSW5pdFxcYCB3aGVuIGFuIGFjY291bnQgaXMgZnJvemVuLmAsXG4gICAgfSxcbiAgICBtZXNzYWdlOiB7XG4gICAgICAgIF9kb2M6IGAjIE1lc3NhZ2UgdHlwZVxuXG4gICAgICAgICAgIE1lc3NhZ2UgbGF5b3V0IHF1ZXJpZXMuICBBIG1lc3NhZ2UgY29uc2lzdHMgb2YgaXRzIGhlYWRlciBmb2xsb3dlZCBieSBpdHNcbiAgICAgICAgICAgYm9keSBvciBwYXlsb2FkLiBUaGUgYm9keSBpcyBlc3NlbnRpYWxseSBhcmJpdHJhcnksIHRvIGJlIGludGVycHJldGVkIGJ5IHRoZVxuICAgICAgICAgICBkZXN0aW5hdGlvbiBzbWFydCBjb250cmFjdC4gSXQgY2FuIGJlIHF1ZXJpZWQgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpgLFxuICAgICAgICBtc2dfdHlwZTogYFJldHVybnMgdGhlIHR5cGUgb2YgbWVzc2FnZS5gLFxuICAgICAgICBzdGF0dXM6IGBSZXR1cm5zIGludGVybmFsIHByb2Nlc3Npbmcgc3RhdHVzIGFjY29yZGluZyB0byB0aGUgbnVtYmVycyBzaG93bi5gLFxuICAgICAgICBibG9ja19pZDogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2R5OiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2UgYm9keSBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2R5X2hhc2g6IGBcXGBib2R5XFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBzcGxpdF9kZXB0aDogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdGljazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdG9jazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBjb2RlOiBgUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICBjb2RlX2hhc2g6IGBcXGBjb2RlXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBkYXRhOiBgUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgZGF0YV9oYXNoOiBgXFxgZGF0YVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgbGlicmFyeTogYFJlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBsaWJyYXJ5X2hhc2g6IGBcXGBsaWJyYXJ5XFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBzcmM6IGBSZXR1cm5zIHNvdXJjZSBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIGRzdDogYFJldHVybnMgZGVzdGluYXRpb24gYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBzcmNfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBzb3VyY2UgYWRkcmVzcyAoc3JjIGZpZWxkKWAsXG4gICAgICAgIGRzdF93b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKGRzdCBmaWVsZClgLFxuICAgICAgICBjcmVhdGVkX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGNyZWF0ZWRfYXQ6IGBDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgaWhyX2Rpc2FibGVkOiBgSUhSIGlzIGRpc2FibGVkIGZvciB0aGUgbWVzc2FnZS5gLFxuICAgICAgICBpaHJfZmVlOiBgVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS5gLFxuICAgICAgICBmd2RfZmVlOiBgT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuYCxcbiAgICAgICAgaW1wb3J0X2ZlZTogYGAsXG4gICAgICAgIGJvdW5jZTogYEJvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgYm91bmNlZDogYEJvdW5jZWQgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIHZhbHVlOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudGAsXG4gICAgICAgIHZhbHVlX290aGVyOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IG1lc3NhZ2UgaXMgYSBwYXJ0IG9mIGEgYmxvY2sgaXQgY3V0IGZyb20uIEl0IGlzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBBIGJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIHN0cnVjdHVyZSBlbmNvZGVkIGFzIGJhc2U2NC5gXG4gICAgfSxcblxuXG4gICAgdHJhbnNhY3Rpb246IHtcbiAgICAgICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgICAgIF86IHsgY29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucycgfSxcbiAgICAgICAgdHJfdHlwZTogYFRyYW5zYWN0aW9uIHR5cGUgYWNjb3JkaW5nIHRvIHRoZSBvcmlnaW5hbCBibG9ja2NoYWluIHNwZWNpZmljYXRpb24sIGNsYXVzZSA0LjIuNC5gLFxuICAgICAgICBzdGF0dXM6IGBUcmFuc2FjdGlvbiBwcm9jZXNzaW5nIHN0YXR1c2AsXG4gICAgICAgIGJsb2NrX2lkOiBgYCxcbiAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGFjY291bnRfYWRkciBmaWVsZClgLFxuICAgICAgICBsdDogYExvZ2ljYWwgdGltZS4gQSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgW3RoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uXShodHRwczovL3Rlc3QudG9uLm9yZy90YmxrY2gucGRmKS5gLFxuICAgICAgICBwcmV2X3RyYW5zX2hhc2g6IGBgLFxuICAgICAgICBwcmV2X3RyYW5zX2x0OiBgYCxcbiAgICAgICAgbm93OiBgYCxcbiAgICAgICAgb3V0bXNnX2NudDogYFRoZSBudW1iZXIgb2YgZ2VuZXJhdGVkIG91dGJvdW5kIG1lc3NhZ2VzIChvbmUgb2YgdGhlIGNvbW1vbiB0cmFuc2FjdGlvbiBwYXJhbWV0ZXJzIGRlZmluZWQgYnkgdGhlIHNwZWNpZmljYXRpb24pYCxcbiAgICAgICAgb3JpZ19zdGF0dXM6IGBUaGUgaW5pdGlhbCBzdGF0ZSBvZiBhY2NvdW50LiBOb3RlIHRoYXQgaW4gdGhpcyBjYXNlIHRoZSBxdWVyeSBtYXkgcmV0dXJuIDAsIGlmIHRoZSBhY2NvdW50IHdhcyBub3QgYWN0aXZlIGJlZm9yZSB0aGUgdHJhbnNhY3Rpb24gYW5kIDEgaWYgaXQgd2FzIGFscmVhZHkgYWN0aXZlYCxcbiAgICAgICAgZW5kX3N0YXR1czogYFRoZSBlbmQgc3RhdGUgb2YgYW4gYWNjb3VudCBhZnRlciBhIHRyYW5zYWN0aW9uLCAxIGlzIHJldHVybmVkIHRvIGluZGljYXRlIGEgZmluYWxpemVkIHRyYW5zYWN0aW9uIGF0IGFuIGFjdGl2ZSBhY2NvdW50YCxcbiAgICAgICAgaW5fbXNnOiBgYCxcbiAgICAgICAgaW5fbWVzc2FnZTogYGAsXG4gICAgICAgIG91dF9tc2dzOiBgRGljdGlvbmFyeSBvZiB0cmFuc2FjdGlvbiBvdXRib3VuZCBtZXNzYWdlcyBhcyBzcGVjaWZpZWQgaW4gdGhlIHNwZWNpZmljYXRpb25gLFxuICAgICAgICBvdXRfbWVzc2FnZXM6IGBgLFxuICAgICAgICB0b3RhbF9mZWVzOiBgVG90YWwgYW1vdW50IG9mIGZlZXMgdGhhdCBlbnRhaWxzIGFjY291bnQgc3RhdGUgY2hhbmdlIGFuZCB1c2VkIGluIE1lcmtsZSB1cGRhdGVgLFxuICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBgU2FtZSBhcyBhYm92ZSwgYnV0IHJlc2VydmVkIGZvciBub24gZ3JhbSBjb2lucyB0aGF0IG1heSBhcHBlYXIgaW4gdGhlIGJsb2NrY2hhaW5gLFxuICAgICAgICBvbGRfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBuZXdfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBjcmVkaXRfZmlyc3Q6IGBgLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBgVGhpcyBmaWVsZCBkZWZpbmVzIHRoZSBhbW91bnQgb2Ygc3RvcmFnZSBmZWVzIGNvbGxlY3RlZCBpbiBncmFtcy5gLFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyB0aGUgYW1vdW50IG9mIGR1ZSBmZWVzIGluIGdyYW1zLCBpdCBtaWdodCBiZSBlbXB0eS5gLFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyBhY2NvdW50IHN0YXR1cyBjaGFuZ2UgYWZ0ZXIgdGhlIHRyYW5zYWN0aW9uIGlzIGNvbXBsZXRlZC5gLFxuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWRpdDoge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBhY2NvdW50IGlzIGNyZWRpdGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgcmVjZWl2ZWQuIFRoZSBjcmVkaXQgcGhhc2UgY2FuIHJlc3VsdCBpbiB0aGUgY29sbGVjdGlvbiBvZiBzb21lIGR1ZSBwYXltZW50c2AsXG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGBUaGUgc3VtIG9mIGR1ZV9mZWVzX2NvbGxlY3RlZCBhbmQgY3JlZGl0IG11c3QgZXF1YWwgdGhlIHZhbHVlIG9mIHRoZSBtZXNzYWdlIHJlY2VpdmVkLCBwbHVzIGl0cyBpaHJfZmVlIGlmIHRoZSBtZXNzYWdlIGhhcyBub3QgYmVlbiByZWNlaXZlZCB2aWEgSW5zdGFudCBIeXBlcmN1YmUgUm91dGluZywgSUhSIChvdGhlcndpc2UgdGhlIGlocl9mZWUgaXMgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycykuYCxcbiAgICAgICAgICAgIGNyZWRpdDogYGAsXG4gICAgICAgICAgICBjcmVkaXRfb3RoZXI6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBjb21wdXRlOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGNvZGUgb2YgdGhlIHNtYXJ0IGNvbnRyYWN0IGlzIGludm9rZWQgaW5zaWRlIGFuIGluc3RhbmNlIG9mIFRWTSB3aXRoIGFkZXF1YXRlIHBhcmFtZXRlcnMsIGluY2x1ZGluZyBhIGNvcHkgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBhbmQgb2YgdGhlIHBlcnNpc3RlbnQgZGF0YSwgYW5kIHRlcm1pbmF0ZXMgd2l0aCBhbiBleGl0IGNvZGUsIHRoZSBuZXcgcGVyc2lzdGVudCBkYXRhLCBhbmQgYW4gYWN0aW9uIGxpc3QgKHdoaWNoIGluY2x1ZGVzLCBmb3IgaW5zdGFuY2UsIG91dGJvdW5kIG1lc3NhZ2VzIHRvIGJlIHNlbnQpLiBUaGUgcHJvY2Vzc2luZyBwaGFzZSBtYXkgbGVhZCB0byB0aGUgY3JlYXRpb24gb2YgYSBuZXcgYWNjb3VudCAodW5pbml0aWFsaXplZCBvciBhY3RpdmUpLCBvciB0byB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudC4gVGhlIGdhcyBwYXltZW50LCBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiB0aGUgZ2FzIHByaWNlIGFuZCB0aGUgZ2FzIGNvbnN1bWVkLCBpcyBleGFjdGVkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZS5cbklmIHRoZXJlIGlzIG5vIHJlYXNvbiB0byBza2lwIHRoZSBjb21wdXRpbmcgcGhhc2UsIFRWTSBpcyBpbnZva2VkIGFuZCB0aGUgcmVzdWx0cyBvZiB0aGUgY29tcHV0YXRpb24gYXJlIGxvZ2dlZC4gUG9zc2libGUgcGFyYW1ldGVycyBhcmUgY292ZXJlZCBiZWxvdy5gLFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uOiBgUmVhc29uIGZvciBza2lwcGluZyB0aGUgY29tcHV0ZSBwaGFzZS4gQWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpY2F0aW9uLCB0aGUgcGhhc2UgY2FuIGJlIHNraXBwZWQgZHVlIHRvIHRoZSBhYnNlbmNlIG9mIGZ1bmRzIHRvIGJ1eSBnYXMsIGFic2VuY2Ugb2Ygc3RhdGUgb2YgYW4gYWNjb3VudCBvciBhIG1lc3NhZ2UsIGZhaWx1cmUgdG8gcHJvdmlkZSBhIHZhbGlkIHN0YXRlIGluIHRoZSBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBUaGlzIGZsYWcgaXMgc2V0IGlmIGFuZCBvbmx5IGlmIGV4aXRfY29kZSBpcyBlaXRoZXIgMCBvciAxLmAsXG4gICAgICAgICAgICBtc2dfc3RhdGVfdXNlZDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpYCxcbiAgICAgICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBgVGhlIGZsYWcgcmVmbGVjdHMgd2hldGhlciB0aGlzIGhhcyByZXN1bHRlZCBpbiB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgZnJvemVuLCB1bmluaXRpYWxpemVkIG9yIG5vbi1leGlzdGVudCBhY2NvdW50LmAsXG4gICAgICAgICAgICBnYXNfZmVlczogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSB0b3RhbCBnYXMgZmVlcyBjb2xsZWN0ZWQgYnkgdGhlIHZhbGlkYXRvcnMgZm9yIGV4ZWN1dGluZyB0aGlzIHRyYW5zYWN0aW9uLiBJdCBtdXN0IGJlIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIGdhc191c2VkIGFuZCBnYXNfcHJpY2UgZnJvbSB0aGUgY3VycmVudCBibG9jayBoZWFkZXIuYCxcbiAgICAgICAgICAgIGdhc191c2VkOiBgYCxcbiAgICAgICAgICAgIGdhc19saW1pdDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSBnYXMgbGltaXQgZm9yIHRoaXMgaW5zdGFuY2Ugb2YgVFZNLiBJdCBlcXVhbHMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIEdyYW1zIGNyZWRpdGVkIGluIHRoZSBjcmVkaXQgcGhhc2UgZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBkaXZpZGVkIGJ5IHRoZSBjdXJyZW50IGdhcyBwcmljZSwgb3IgdGhlIGdsb2JhbCBwZXItdHJhbnNhY3Rpb24gZ2FzIGxpbWl0LmAsXG4gICAgICAgICAgICBnYXNfY3JlZGl0OiBgVGhpcyBwYXJhbWV0ZXIgbWF5IGJlIG5vbi16ZXJvIG9ubHkgZm9yIGV4dGVybmFsIGluYm91bmQgbWVzc2FnZXMuIEl0IGlzIHRoZSBsZXNzZXIgb2YgZWl0aGVyIHRoZSBhbW91bnQgb2YgZ2FzIHRoYXQgY2FuIGJlIHBhaWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlIG9yIHRoZSBtYXhpbXVtIGdhcyBjcmVkaXRgLFxuICAgICAgICAgICAgbW9kZTogYGAsXG4gICAgICAgICAgICBleGl0X2NvZGU6IGBUaGVzZSBwYXJhbWV0ZXIgcmVwcmVzZW50cyB0aGUgc3RhdHVzIHZhbHVlcyByZXR1cm5lZCBieSBUVk07IGZvciBhIHN1Y2Nlc3NmdWwgdHJhbnNhY3Rpb24sIGV4aXRfY29kZSBoYXMgdG8gYmUgMCBvciAxYCxcbiAgICAgICAgICAgIGV4aXRfYXJnOiBgYCxcbiAgICAgICAgICAgIHZtX3N0ZXBzOiBgdGhlIHRvdGFsIG51bWJlciBvZiBzdGVwcyBwZXJmb3JtZWQgYnkgVFZNICh1c3VhbGx5IGVxdWFsIHRvIHR3byBwbHVzIHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zIGV4ZWN1dGVkLCBpbmNsdWRpbmcgaW1wbGljaXQgUkVUcylgLFxuICAgICAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgb3JpZ2luYWwgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgcmVzdWx0aW5nIHN0YXRlIG9mIFRWTS5gLFxuICAgICAgICB9LFxuICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgc21hcnQgY29udHJhY3QgaGFzIHRlcm1pbmF0ZWQgc3VjY2Vzc2Z1bGx5ICh3aXRoIGV4aXQgY29kZSAwIG9yIDEpLCB0aGUgYWN0aW9ucyBmcm9tIHRoZSBsaXN0IGFyZSBwZXJmb3JtZWQuIElmIGl0IGlzIGltcG9zc2libGUgdG8gcGVyZm9ybSBhbGwgb2YgdGhlbeKAlGZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGluc3VmZmljaWVudCBmdW5kcyB0byB0cmFuc2ZlciB3aXRoIGFuIG91dGJvdW5kIG1lc3NhZ2XigJR0aGVuIHRoZSB0cmFuc2FjdGlvbiBpcyBhYm9ydGVkIGFuZCB0aGUgYWNjb3VudCBzdGF0ZSBpcyByb2xsZWQgYmFjay4gVGhlIHRyYW5zYWN0aW9uIGlzIGFsc28gYWJvcnRlZCBpZiB0aGUgc21hcnQgY29udHJhY3QgZGlkIG5vdCB0ZXJtaW5hdGUgc3VjY2Vzc2Z1bGx5LCBvciBpZiBpdCB3YXMgbm90IHBvc3NpYmxlIHRvIGludm9rZSB0aGUgc21hcnQgY29udHJhY3QgYXQgYWxsIGJlY2F1c2UgaXQgaXMgdW5pbml0aWFsaXplZCBvciBmcm96ZW4uYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBgLFxuICAgICAgICAgICAgdmFsaWQ6IGBgLFxuICAgICAgICAgICAgbm9fZnVuZHM6IGBUaGUgZmxhZyBpbmRpY2F0ZXMgYWJzZW5jZSBvZiBmdW5kcyByZXF1aXJlZCB0byBjcmVhdGUgYW4gb3V0Ym91bmQgbWVzc2FnZWAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9jb2RlOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9hcmc6IGBgLFxuICAgICAgICAgICAgdG90X2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc3BlY19hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBtc2dzX2NyZWF0ZWQ6IGBgLFxuICAgICAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgYm91bmNlOiB7XG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLiBBbG1vc3QgYWxsIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCBpbmJvdW5kIG1lc3NhZ2UgKG1pbnVzIGdhcyBwYXltZW50cyBhbmQgZm9yd2FyZGluZyBmZWVzKSBpcyB0cmFuc2ZlcnJlZCB0byB0aGUgZ2VuZXJhdGVkIG1lc3NhZ2UsIHdoaWNoIG90aGVyd2lzZSBoYXMgYW4gZW1wdHkgYm9keS5gLFxuICAgICAgICAgICAgYm91bmNlX3R5cGU6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfY2VsbHM6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfYml0czogYGAsXG4gICAgICAgICAgICByZXFfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgbXNnX2ZlZXM6IGBgLFxuICAgICAgICAgICAgZndkX2ZlZXM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBhYm9ydGVkOiBgYCxcbiAgICAgICAgZGVzdHJveWVkOiBgYCxcbiAgICAgICAgdHQ6IGBgLFxuICAgICAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGZpZWxkcyBiZWxvdyBjb3ZlciBzcGxpdCBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucyBhbmQgbWVyZ2UgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMsIHRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgcmVsZXZhbnQgc2NoZW1lcyBjb3ZlcmVkIGJ5IHRoZSBibG9ja2NoYWluIHNwZWNpZmljYXRpb24uYCxcbiAgICAgICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IHNoYXJkIHByZWZpeGAsXG4gICAgICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IGBgLFxuICAgICAgICAgICAgdGhpc19hZGRyOiBgYCxcbiAgICAgICAgICAgIHNpYmxpbmdfYWRkcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IGBgLFxuICAgICAgICBpbnN0YWxsZWQ6IGBgLFxuICAgICAgICBwcm9vZjogYGAsXG4gICAgICAgIGJvYzogYGAsXG4gICAgfSxcblxuICAgIHNoYXJkRGVzY3I6IHtcbiAgICAgICAgX2RvYzogYFNoYXJkSGFzaGVzIGlzIHJlcHJlc2VudGVkIGJ5IGEgZGljdGlvbmFyeSB3aXRoIDMyLWJpdCB3b3JrY2hhaW5faWRzIGFzIGtleXMsIGFuZCDigJxzaGFyZCBiaW5hcnkgdHJlZXPigJ0sIHJlcHJlc2VudGVkIGJ5IFRMLUIgdHlwZSBCaW5UcmVlIFNoYXJkRGVzY3IsIGFzIHZhbHVlcy4gRWFjaCBsZWFmIG9mIHRoaXMgc2hhcmQgYmluYXJ5IHRyZWUgY29udGFpbnMgYSB2YWx1ZSBvZiB0eXBlIFNoYXJkRGVzY3IsIHdoaWNoIGRlc2NyaWJlcyBhIHNpbmdsZSBzaGFyZCBieSBpbmRpY2F0aW5nIHRoZSBzZXF1ZW5jZSBudW1iZXIgc2VxX25vLCB0aGUgbG9naWNhbCB0aW1lIGx0LCBhbmQgdGhlIGhhc2ggaGFzaCBvZiB0aGUgbGF0ZXN0IChzaWduZWQpIGJsb2NrIG9mIHRoZSBjb3JyZXNwb25kaW5nIHNoYXJkY2hhaW4uYCxcbiAgICAgICAgc2VxX25vOiBgdWludDMyIHNlcXVlbmNlIG51bWJlcmAsXG4gICAgICAgIHJlZ19tY19zZXFubzogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi5gLFxuICAgICAgICBzdGFydF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBzdGFydGAsXG4gICAgICAgIGVuZF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBlbmRgLFxuICAgICAgICByb290X2hhc2g6IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uIFRoZSBzaGFyZCBibG9jayBjb25maWd1cmF0aW9uIGlzIGRlcml2ZWQgZnJvbSB0aGF0IGJsb2NrLmAsXG4gICAgICAgIGZpbGVfaGFzaDogYFNoYXJkIGJsb2NrIGZpbGUgaGFzaC5gLFxuICAgICAgICBiZWZvcmVfc3BsaXQ6IGBUT04gQmxvY2tjaGFpbiBzdXBwb3J0cyBkeW5hbWljIHNoYXJkaW5nLCBzbyB0aGUgc2hhcmQgY29uZmlndXJhdGlvbiBtYXkgY2hhbmdlIGZyb20gYmxvY2sgdG8gYmxvY2sgYmVjYXVzZSBvZiBzaGFyZCBtZXJnZSBhbmQgc3BsaXQgZXZlbnRzLiBUaGVyZWZvcmUsIHdlIGNhbm5vdCBzaW1wbHkgc2F5IHRoYXQgZWFjaCBzaGFyZGNoYWluIGNvcnJlc3BvbmRzIHRvIGEgZml4ZWQgc2V0IG9mIGFjY291bnQgY2hhaW5zLlxuQSBzaGFyZGNoYWluIGJsb2NrIGFuZCBpdHMgc3RhdGUgbWF5IGVhY2ggYmUgY2xhc3NpZmllZCBpbnRvIHR3byBkaXN0aW5jdCBwYXJ0cy4gVGhlIHBhcnRzIHdpdGggdGhlIElTUC1kaWN0YXRlZCBmb3JtIG9mIHdpbGwgYmUgY2FsbGVkIHRoZSBzcGxpdCBwYXJ0cyBvZiB0aGUgYmxvY2sgYW5kIGl0cyBzdGF0ZSwgd2hpbGUgdGhlIHJlbWFpbmRlciB3aWxsIGJlIGNhbGxlZCB0aGUgbm9uLXNwbGl0IHBhcnRzLlxuVGhlIG1hc3RlcmNoYWluIGNhbm5vdCBiZSBzcGxpdCBvciBtZXJnZWQuYCxcbiAgICAgICAgYmVmb3JlX21lcmdlOiBgYCxcbiAgICAgICAgd2FudF9zcGxpdDogYGAsXG4gICAgICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgICAgICBueF9jY191cGRhdGVkOiBgYCxcbiAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICAgICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IGBgLFxuICAgICAgICBtaW5fcmVmX21jX3NlcW5vOiBgYCxcbiAgICAgICAgZ2VuX3V0aW1lOiBgR2VuZXJhdGlvbiB0aW1lIGluIHVpbnQzMmAsXG4gICAgICAgIHNwbGl0X3R5cGU6IGBgLFxuICAgICAgICBzcGxpdDogYGAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IGBBbW91bnQgb2YgZmVlcyBjb2xsZWN0ZWQgaW50IGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgICAgIGZ1bmRzX2NyZWF0ZWQ6IGBBbW91bnQgb2YgZnVuZHMgY3JlYXRlZCBpbiB0aGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IGBBbW91bnQgb2YgZnVuZHMgY3JlYXRlZCBpbiB0aGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICB9LFxuXG4gICAgYmxvY2s6IHtcbiAgICAgICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgICAgICBzdGF0dXM6IGBSZXR1cm5zIGJsb2NrIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICAgICAgZ2xvYmFsX2lkOiBgdWludDMyIGdsb2JhbCBibG9jayBJRGAsXG4gICAgICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgICAgICBzZXFfbm86IGBgLFxuICAgICAgICBhZnRlcl9tZXJnZTogYGAsXG4gICAgICAgIGdlbl91dGltZTogYHVpbnQgMzIgZ2VuZXJhdGlvbiB0aW1lIHN0YW1wYCxcbiAgICAgICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICBtYXN0ZXJfcmVmOiBgYCxcbiAgICAgICAgcHJldl9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgIHByZXZfYWx0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiBzaGFyZCBtZXJnZS5gLFxuICAgICAgICBwcmV2X3ZlcnRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHZlcnRpY2FsIGJsb2Nrcy5gLFxuICAgICAgICBwcmV2X3ZlcnRfYWx0X3JlZjogYGAsXG4gICAgICAgIHZlcnNpb246IGB1aW4zMiBibG9jayB2ZXJzaW9uIGlkZW50aWZpZXJgLFxuICAgICAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYGAsXG4gICAgICAgIGFmdGVyX3NwbGl0OiBgYCxcbiAgICAgICAgd2FudF9tZXJnZTogYGAsXG4gICAgICAgIHZlcnRfc2VxX25vOiBgYCxcbiAgICAgICAgc3RhcnRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBzdGFydC5cbkxvZ2ljYWwgdGltZSBpcyBhIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgVE9OIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbmAsXG4gICAgICAgIGVuZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIGVuZC5gLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGB1aW50MzIgd29ya2NoYWluIGlkZW50aWZpZXJgLFxuICAgICAgICBzaGFyZDogYGAsXG4gICAgICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICAgICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IGBSZXR1cm5zIGEgbnVtYmVyIG9mIGEgcHJldmlvdXMga2V5IGJsb2NrLmAsXG4gICAgICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiBgYCxcbiAgICAgICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogYGAsXG4gICAgICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgICAgIHRvX25leHRfYmxrOiBgQW1vdW50IG9mIGdyYW1zIGFtb3VudCB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICAgICAgZXhwb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgICAgIGV4cG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkOiBgYCxcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgYCxcbiAgICAgICAgICAgIGNyZWF0ZWQ6IGBgLFxuICAgICAgICAgICAgY3JlYXRlZF9vdGhlcjogYGAsXG4gICAgICAgICAgICBpbXBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBpbXBvcnRlZC5gLFxuICAgICAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBpbXBvcnRlZC5gLFxuICAgICAgICAgICAgZnJvbV9wcmV2X2JsazogYEFtb3VudCBvZiBncmFtcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxuICAgICAgICAgICAgbWludGVkOiBgQW1vdW50IG9mIGdyYW1zIG1pbnRlZCBpbiB0aGlzIGJsb2NrLmAsXG4gICAgICAgICAgICBtaW50ZWRfb3RoZXI6IGBgLFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZDogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBncmFtc2AsXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICAgICAgfSxcbiAgICAgICAgaW5fbXNnX2Rlc2NyOiBgYCxcbiAgICAgICAgcmFuZF9zZWVkOiBgYCxcbiAgICAgICAgY3JlYXRlZF9ieTogYFB1YmxpYyBrZXkgb2YgdGhlIGNvbGxhdG9yIHdobyBwcm9kdWNlZCB0aGlzIGJsb2NrLmAsXG4gICAgICAgIG91dF9tc2dfZGVzY3I6IGBgLFxuICAgICAgICBhY2NvdW50X2Jsb2Nrczoge1xuICAgICAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogYGAsXG4gICAgICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgICAgICBvbGRfaGFzaDogYG9sZCB2ZXJzaW9uIG9mIGJsb2NrIGhhc2hlc2AsXG4gICAgICAgICAgICAgICAgbmV3X2hhc2g6IGBuZXcgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJfY291bnQ6IGBgXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICAgICAgbmV3OiBgYCxcbiAgICAgICAgICAgIG5ld19oYXNoOiBgYCxcbiAgICAgICAgICAgIG5ld19kZXB0aDogYGAsXG4gICAgICAgICAgICBvbGQ6IGBgLFxuICAgICAgICAgICAgb2xkX2hhc2g6IGBgLFxuICAgICAgICAgICAgb2xkX2RlcHRoOiBgYFxuICAgICAgICB9LFxuICAgICAgICBtYXN0ZXI6IHtcbiAgICAgICAgICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6ICdNaW4gYmxvY2sgZ2VuZXJhdGlvbiB0aW1lIG9mIHNoYXJkcycsXG4gICAgICAgICAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiAnTWF4IGJsb2NrIGdlbmVyYXRpb24gdGltZSBvZiBzaGFyZHMnLFxuICAgICAgICAgICAgc2hhcmRfaGFzaGVzOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNoYXJkIGhhc2hlc2AsXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgVWludDMyIHdvcmtjaGFpbiBJRGAsXG4gICAgICAgICAgICAgICAgc2hhcmQ6IGBTaGFyZCBJRGAsXG4gICAgICAgICAgICAgICAgZGVzY3I6IGBTaGFyZCBkZXNjcmlwdGlvbmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2hhcmRfZmVlczoge1xuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmQ6IGBgLFxuICAgICAgICAgICAgICAgIGZlZXM6IGBBbW91bnQgb2YgZmVlcyBpbiBncmFtc2AsXG4gICAgICAgICAgICAgICAgZmVlc19vdGhlcjogYEFycmF5IG9mIGZlZXMgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXNgLFxuICAgICAgICAgICAgICAgIGNyZWF0ZTogYEFtb3VudCBvZiBmZWVzIGNyZWF0ZWQgZHVyaW5nIHNoYXJkYCxcbiAgICAgICAgICAgICAgICBjcmVhdGVfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gZmVlcyBjcmVhdGVkIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzIGR1cmluZyB0aGUgYmxvY2suYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGBgLFxuICAgICAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBwcmV2aW91cyBibG9jayBzaWduYXR1cmVzYCxcbiAgICAgICAgICAgICAgICBub2RlX2lkOiBgYCxcbiAgICAgICAgICAgICAgICByOiBgYCxcbiAgICAgICAgICAgICAgICBzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb25maWdfYWRkcjogYGAsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBwMDogYEFkZHJlc3Mgb2YgY29uZmlnIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDE6IGBBZGRyZXNzIG9mIGVsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgICAgICBwMjogYEFkZHJlc3Mgb2YgbWludGVyIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDM6IGBBZGRyZXNzIG9mIGZlZSBjb2xsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgICAgICBwNDogYEFkZHJlc3Mgb2YgVE9OIEROUyByb290IHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZ3VyYXRpb24gcGFyYW1ldGVyIDZgLFxuICAgICAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHA3OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA3YCxcbiAgICAgICAgICAgICAgICAgICAgY3VycmVuY3k6IGBgLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgR2xvYmFsIHZlcnNpb25gLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHA5OiBgTWFuZGF0b3J5IHBhcmFtc2AsXG4gICAgICAgICAgICAgICAgcDEwOiBgQ3JpdGljYWwgcGFyYW1zYCxcbiAgICAgICAgICAgICAgICBwMTE6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZyB2b3Rpbmcgc2V0dXBgLFxuICAgICAgICAgICAgICAgICAgICBub3JtYWxfcGFyYW1zOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHAxMjoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgYWxsIHdvcmtjaGFpbnMgZGVzY3JpcHRpb25zYCxcbiAgICAgICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBhY2NlcHRfbXNnczogYGAsXG4gICAgICAgICAgICAgICAgICAgIGZsYWdzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYmFzaWM6IGBgLFxuICAgICAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdm1fbW9kZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IGBgLFxuICAgICAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEJsb2NrIGNyZWF0ZSBmZWVzYCxcbiAgICAgICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEVsZWN0aW9uIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE2OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3JzIGNvdW50YCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE3OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3Igc3Rha2UgcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1heF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IGBgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMTg6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYFN0b3JhZ2UgcHJpY2VzYCxcbiAgICAgICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMjA6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgICAgICBwMjE6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICAgICAgcDIyOiBgQmxvY2sgbGltaXRzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDIzOiBgQmxvY2sgbGltaXRzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgICAgIHAyNDogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgICAgICBwMjU6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgICAgIHAyODoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ2F0Y2hhaW4gY29uZmlnYCxcbiAgICAgICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENvbnNlbnN1cyBjb25maWdgLFxuICAgICAgICAgICAgICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogYGAsXG4gICAgICAgICAgICAgICAgICAgIGZhc3RfYXR0ZW1wdHM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IGBgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMzE6IGBBcnJheSBvZiBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgYWRkcmVzc2VzYCxcbiAgICAgICAgICAgICAgICBwMzI6IGBQcmV2aW91cyB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDMzOiBgUHJldmlvdXMgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM0OiBgQ3VycmVudCB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM1OiBgQ3VycmVudCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgICAgICBwMzY6IGBOZXh0IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgICAgICBwMzc6IGBOZXh0IHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzOToge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgdmFsaWRhdG9yIHNpZ25lZCB0ZW1wcm9yYXJ5IGtleXNgLFxuICAgICAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IGBgLFxuICAgICAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzZXFubzogYGAsXG4gICAgICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAga2V5X2Jsb2NrOiAndHJ1ZSBpZiB0aGlzIGJsb2NrIGlzIGEga2V5IGJsb2NrJyxcbiAgICAgICAgYm9jOiAnU2VyaWFsaXplZCBiYWcgb2YgY2VsbCBvZiB0aGlzIGJsb2NrIGVuY29kZWQgd2l0aCBiYXNlNjQnLFxuICAgICAgICBiYWxhbmNlX2RlbHRhOiAnQWNjb3VudCBiYWxhbmNlIGNoYW5nZSBhZnRlciB0cmFuc2FjdGlvbicsXG4gICAgfSxcblxuICAgIGJsb2NrU2lnbmF0dXJlczoge1xuICAgICAgICBfZG9jOiBgU2V0IG9mIHZhbGlkYXRvclxcJ3Mgc2lnbmF0dXJlcyBmb3IgdGhlIEJsb2NrIHdpdGggY29ycmVzcG9uZCBpZGAsXG4gICAgICAgIGdlbl91dGltZTogYFNpZ25lZCBibG9jaydzIGdlbl91dGltZWAsXG4gICAgICAgIHNlcV9ubzogYFNpZ25lZCBibG9jaydzIHNlcV9ub2AsXG4gICAgICAgIHNoYXJkOiBgU2lnbmVkIGJsb2NrJ3Mgc2hhcmRgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBTaWduZWQgYmxvY2sncyB3b3JrY2hhaW5faWRgLFxuICAgICAgICBwcm9vZjogYFNpZ25lZCBibG9jaydzIG1lcmtsZSBwcm9vZmAsXG4gICAgICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IGBgLFxuICAgICAgICBjYXRjaGFpbl9zZXFubzogYGAsXG4gICAgICAgIHNpZ193ZWlnaHQ6IGBgLFxuICAgICAgICBzaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc2AsXG4gICAgICAgICAgICBub2RlX2lkOiBgVmFsaWRhdG9yIElEYCxcbiAgICAgICAgICAgIHI6IGAnUicgcGFydCBvZiBzaWduYXR1cmVgLFxuICAgICAgICAgICAgczogYCdzJyBwYXJ0IG9mIHNpZ25hdHVyZWAsXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgemVyb3N0YXRlOiB7XG4gICAgICAgIF9kb2M6IGBUaGUgaW5pdGlhbCBzdGF0ZSBvZiB0aGUgd29ya2NoYWluIGJlZm9yZSBmaXJzdCBibG9jayB3YXMgZ2VuZXJhdGVkYCxcbiAgICAgICAgZ2xvYmFsX2lkOiBgdWludDMyIGdsb2JhbCBuZXR3b3JrIElEYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgWmVyb3N0YXRlJ3Mgd29ya2NoYWluX2lkYCxcbiAgICAgICAgYWNjb3VudHM6IGBJbml0aWFsIGFjY291bnRzIHN0YXRlIGF0IHRoZSB3b3JrY2hhaW4gc3RhcnRgLFxuICAgICAgICB0b3RhbF9iYWxhbmNlOiBgT3ZlcmFsbCBiYWxhbmNlIG9mIGFsbCBhY2NvdW50cyBvZiB0aGUgd29ya2NoYWluYCxcbiAgICAgICAgdG90YWxfYmFsYW5jZV9vdGhlcjogYE92ZXJhbGwgYmFsYW5jZSBvZiBhbGwgYWNjb3VudHMgb2YgdGhlIHdvcmtjaGFpbiBpbiBvdGhlciBjdXJyZW5jaWVzYCxcbiAgICAgICAgbWFzdGVyOiB7XG4gICAgICAgICAgICBnbG9iYWxfYmFsYW5jZTogYE92ZXJhbGwgYmFsYW5jZSBvZiBhbGwgYWNjb3VudHNgLFxuICAgICAgICAgICAgZ2xvYmFsX2JhbGFuY2Vfb3RoZXI6IGBPdmVyYWxsIGJhbGFuY2Ugb2YgYWxsIGFjY291bnRzIGluIG90aGVyIGN1cnJlbmNpZXNgLFxuICAgICAgICAgICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGJvYzogJ1NlcmlhbGl6ZWQgYmFnIG9mIGNlbGwgb2YgdGhpcyB6ZXJvc3RhdGUgZW5jb2RlZCB3aXRoIGJhc2U2NCcsXG4gICAgICAgIGxpYnJhcmllczoge1xuICAgICAgICAgICAgX2RvYzogYEluaXRpYWwgbGlicmFyaWVzIGF0IHRoZSB3b3JrY2hhaW4gc3RhcnRgLFxuICAgICAgICAgICAgaGFzaDogYExpYnJhcnkgaGFzaGAsXG4gICAgICAgICAgICBwdWJsaXNoZXJzOiBgTGlzdCBvZiB0aGUgYWNjb3VudHMgd2hpY2ggdXNlIHRoZSBsaWJyYXJ5YCxcbiAgICAgICAgICAgIGxpYjogYFNlcmlhbGl6ZWQgYmFnIG9mIGNlbGwgb2YgdGhpcyBsaWJyYXJ5IGVuY29kZWQgd2l0aCBiYXNlNjRgLFxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19