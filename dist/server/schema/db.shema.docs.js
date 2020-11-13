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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvc2NoZW1hL2RiLnNoZW1hLmRvY3MuanMiXSwibmFtZXMiOlsiZG9jcyIsImFjY291bnQiLCJfZG9jIiwiaWQiLCJ3b3JrY2hhaW5faWQiLCJhY2NfdHlwZSIsImxhc3RfcGFpZCIsImR1ZV9wYXltZW50IiwibGFzdF90cmFuc19sdCIsImJhbGFuY2UiLCJiYWxhbmNlX290aGVyIiwic3BsaXRfZGVwdGgiLCJ0aWNrIiwidG9jayIsImNvZGUiLCJjb2RlX2hhc2giLCJkYXRhIiwiZGF0YV9oYXNoIiwibGlicmFyeSIsImxpYnJhcnlfaGFzaCIsInByb29mIiwiYm9jIiwic3RhdGVfaGFzaCIsIm1lc3NhZ2UiLCJtc2dfdHlwZSIsInN0YXR1cyIsImJsb2NrX2lkIiwiYm9keSIsImJvZHlfaGFzaCIsInNyYyIsImRzdCIsInNyY193b3JrY2hhaW5faWQiLCJkc3Rfd29ya2NoYWluX2lkIiwiY3JlYXRlZF9sdCIsImNyZWF0ZWRfYXQiLCJpaHJfZGlzYWJsZWQiLCJpaHJfZmVlIiwiZndkX2ZlZSIsImltcG9ydF9mZWUiLCJib3VuY2UiLCJib3VuY2VkIiwidmFsdWUiLCJ2YWx1ZV9vdGhlciIsInRyYW5zYWN0aW9uIiwiXyIsImNvbGxlY3Rpb24iLCJ0cl90eXBlIiwiYWNjb3VudF9hZGRyIiwibHQiLCJwcmV2X3RyYW5zX2hhc2giLCJwcmV2X3RyYW5zX2x0Iiwibm93Iiwib3V0bXNnX2NudCIsIm9yaWdfc3RhdHVzIiwiZW5kX3N0YXR1cyIsImluX21zZyIsImluX21lc3NhZ2UiLCJvdXRfbXNncyIsIm91dF9tZXNzYWdlcyIsInRvdGFsX2ZlZXMiLCJ0b3RhbF9mZWVzX290aGVyIiwib2xkX2hhc2giLCJuZXdfaGFzaCIsImNyZWRpdF9maXJzdCIsInN0b3JhZ2UiLCJzdG9yYWdlX2ZlZXNfY29sbGVjdGVkIiwic3RvcmFnZV9mZWVzX2R1ZSIsInN0YXR1c19jaGFuZ2UiLCJjcmVkaXQiLCJkdWVfZmVlc19jb2xsZWN0ZWQiLCJjcmVkaXRfb3RoZXIiLCJjb21wdXRlIiwiY29tcHV0ZV90eXBlIiwic2tpcHBlZF9yZWFzb24iLCJzdWNjZXNzIiwibXNnX3N0YXRlX3VzZWQiLCJhY2NvdW50X2FjdGl2YXRlZCIsImdhc19mZWVzIiwiZ2FzX3VzZWQiLCJnYXNfbGltaXQiLCJnYXNfY3JlZGl0IiwibW9kZSIsImV4aXRfY29kZSIsImV4aXRfYXJnIiwidm1fc3RlcHMiLCJ2bV9pbml0X3N0YXRlX2hhc2giLCJ2bV9maW5hbF9zdGF0ZV9oYXNoIiwiYWN0aW9uIiwidmFsaWQiLCJub19mdW5kcyIsInRvdGFsX2Z3ZF9mZWVzIiwidG90YWxfYWN0aW9uX2ZlZXMiLCJyZXN1bHRfY29kZSIsInJlc3VsdF9hcmciLCJ0b3RfYWN0aW9ucyIsInNwZWNfYWN0aW9ucyIsInNraXBwZWRfYWN0aW9ucyIsIm1zZ3NfY3JlYXRlZCIsImFjdGlvbl9saXN0X2hhc2giLCJ0b3RhbF9tc2dfc2l6ZV9jZWxscyIsInRvdGFsX21zZ19zaXplX2JpdHMiLCJib3VuY2VfdHlwZSIsIm1zZ19zaXplX2NlbGxzIiwibXNnX3NpemVfYml0cyIsInJlcV9md2RfZmVlcyIsIm1zZ19mZWVzIiwiZndkX2ZlZXMiLCJhYm9ydGVkIiwiZGVzdHJveWVkIiwidHQiLCJzcGxpdF9pbmZvIiwiY3VyX3NoYXJkX3BmeF9sZW4iLCJhY2Nfc3BsaXRfZGVwdGgiLCJ0aGlzX2FkZHIiLCJzaWJsaW5nX2FkZHIiLCJwcmVwYXJlX3RyYW5zYWN0aW9uIiwiaW5zdGFsbGVkIiwic2hhcmREZXNjciIsInNlcV9ubyIsInJlZ19tY19zZXFubyIsInN0YXJ0X2x0IiwiZW5kX2x0Iiwicm9vdF9oYXNoIiwiZmlsZV9oYXNoIiwiYmVmb3JlX3NwbGl0IiwiYmVmb3JlX21lcmdlIiwid2FudF9zcGxpdCIsIndhbnRfbWVyZ2UiLCJueF9jY191cGRhdGVkIiwiZmxhZ3MiLCJuZXh0X2NhdGNoYWluX3NlcW5vIiwibmV4dF92YWxpZGF0b3Jfc2hhcmQiLCJtaW5fcmVmX21jX3NlcW5vIiwiZ2VuX3V0aW1lIiwic3BsaXRfdHlwZSIsInNwbGl0IiwiZmVlc19jb2xsZWN0ZWQiLCJmZWVzX2NvbGxlY3RlZF9vdGhlciIsImZ1bmRzX2NyZWF0ZWQiLCJmdW5kc19jcmVhdGVkX290aGVyIiwiYmxvY2siLCJnbG9iYWxfaWQiLCJhZnRlcl9tZXJnZSIsImdlbl9jYXRjaGFpbl9zZXFubyIsIm1hc3Rlcl9yZWYiLCJwcmV2X3JlZiIsInByZXZfYWx0X3JlZiIsInByZXZfdmVydF9yZWYiLCJwcmV2X3ZlcnRfYWx0X3JlZiIsInZlcnNpb24iLCJnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImFmdGVyX3NwbGl0IiwidmVydF9zZXFfbm8iLCJzaGFyZCIsInByZXZfa2V5X2Jsb2NrX3NlcW5vIiwiZ2VuX3NvZnR3YXJlX3ZlcnNpb24iLCJnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZCIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsImNyZWF0ZWRfYnkiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwia2V5X2Jsb2NrIiwiYmFsYW5jZV9kZWx0YSIsImJsb2NrU2lnbmF0dXJlcyIsInZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJjYXRjaGFpbl9zZXFubyIsInNpZ193ZWlnaHQiLCJzaWduYXR1cmVzIiwiemVyb3N0YXRlIiwiYWNjb3VudHMiLCJ0b3RhbF9iYWxhbmNlIiwidG90YWxfYmFsYW5jZV9vdGhlciIsImdsb2JhbF9iYWxhbmNlIiwiZ2xvYmFsX2JhbGFuY2Vfb3RoZXIiLCJsaWJyYXJpZXMiLCJoYXNoIiwicHVibGlzaGVycyIsImxpYiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDTyxNQUFNQSxJQUFJLEdBQUc7QUFDaEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxJQUFJLEVBQUc7Ozs7Ozs7Ozs7OztZQURGO0FBY0xDLElBQUFBLEVBQUUsRUFBRyxFQWRBO0FBZUxDLElBQUFBLFlBQVksRUFBRyxpREFmVjtBQWdCTEMsSUFBQUEsUUFBUSxFQUFHOzs7Ozs7Ozs7U0FoQk47QUEwQkxDLElBQUFBLFNBQVMsRUFBRzs7Ozs7Ozs7Ozs7OztpQkExQlA7QUF3Q0xDLElBQUFBLFdBQVcsRUFBRzs7Ozs7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RztBQUpJO0FBVkMsR0FyZUQ7QUF1ZmhCb0csRUFBQUEsU0FBUyxFQUFFO0FBQ1B4UyxJQUFBQSxJQUFJLEVBQUcscUVBREE7QUFFUDJJLElBQUFBLFNBQVMsRUFBRywwQkFGTDtBQUdQekksSUFBQUEsWUFBWSxFQUFHLDBCQUhSO0FBSVB1UyxJQUFBQSxRQUFRLEVBQUcsK0NBSko7QUFLUEMsSUFBQUEsYUFBYSxFQUFHLGtEQUxUO0FBTVBDLElBQUFBLG1CQUFtQixFQUFHLHNFQU5mO0FBT1BySCxJQUFBQSxNQUFNLEVBQUU7QUFDSnNILE1BQUFBLGNBQWMsRUFBRyxpQ0FEYjtBQUVKQyxNQUFBQSxvQkFBb0IsRUFBRyxxREFGbkI7QUFHSlQsTUFBQUEseUJBQXlCLEVBQUc7QUFIeEIsS0FQRDtBQVlQalIsSUFBQUEsR0FBRyxFQUFFLDhEQVpFO0FBYVAyUixJQUFBQSxTQUFTLEVBQUU7QUFDUDlTLE1BQUFBLElBQUksRUFBRywwQ0FEQTtBQUVQK1MsTUFBQUEsSUFBSSxFQUFHLGNBRkE7QUFHUEMsTUFBQUEsVUFBVSxFQUFHLDRDQUhOO0FBSVBDLE1BQUFBLEdBQUcsRUFBRztBQUpDO0FBYko7QUF2ZkssQ0FBYiIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvcHJlZmVyLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgY29uc3QgZG9jcyA9IHtcbiAgICBhY2NvdW50OiB7XG4gICAgICAgIF9kb2M6IGBcbiMgQWNjb3VudCB0eXBlXG5cblJlY2FsbCB0aGF0IGEgc21hcnQgY29udHJhY3QgYW5kIGFuIGFjY291bnQgYXJlIHRoZSBzYW1lIHRoaW5nIGluIHRoZSBjb250ZXh0XG5vZiB0aGUgVE9OIEJsb2NrY2hhaW4sIGFuZCB0aGF0IHRoZXNlIHRlcm1zIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSwgYXRcbmxlYXN0IGFzIGxvbmcgYXMgb25seSBzbWFsbCAob3Ig4oCcdXN1YWzigJ0pIHNtYXJ0IGNvbnRyYWN0cyBhcmUgY29uc2lkZXJlZC4gQSBsYXJnZVxuc21hcnQtY29udHJhY3QgbWF5IGVtcGxveSBzZXZlcmFsIGFjY291bnRzIGx5aW5nIGluIGRpZmZlcmVudCBzaGFyZGNoYWlucyBvZlxudGhlIHNhbWUgd29ya2NoYWluIGZvciBsb2FkIGJhbGFuY2luZyBwdXJwb3Nlcy5cblxuQW4gYWNjb3VudCBpcyBpZGVudGlmaWVkIGJ5IGl0cyBmdWxsIGFkZHJlc3MgYW5kIGlzIGNvbXBsZXRlbHkgZGVzY3JpYmVkIGJ5XG5pdHMgc3RhdGUuIEluIG90aGVyIHdvcmRzLCB0aGVyZSBpcyBub3RoaW5nIGVsc2UgaW4gYW4gYWNjb3VudCBhcGFydCBmcm9tIGl0c1xuYWRkcmVzcyBhbmQgc3RhdGUuXG4gICAgICAgICAgIGAsXG4gICAgICAgIGlkOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGlkIGZpZWxkKS5gLFxuICAgICAgICBhY2NfdHlwZTogYFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjoge2FjY190eXBlOntlcToxfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfcGFpZDogYFxuQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50XG5jb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSxcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXG5cXGBcXGBcXGBcbnF1ZXJ5e1xuICBhY2NvdW50cyhmaWx0ZXI6IHtcbiAgICBsYXN0X3BhaWQ6e2dlOjE1NjcyOTYwMDB9XG4gIH0pIHtcbiAgaWRcbiAgbGFzdF9wYWlkfVxufVxuXFxgXFxgXFxgICAgICBcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICBkdWVfcGF5bWVudDogYFxuSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjLSBjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7IGR1ZV9wYXltZW50OiB7IG5lOiBudWxsIH0gfSlcbiAgICB7XG4gICAgICBpZFxuICAgIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBsYXN0X3RyYW5zX2x0OiBgIGAsXG4gICAgICAgIGJhbGFuY2U6IGBcblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhvcmRlckJ5OntwYXRoOlwiYmFsYW5jZVwiLGRpcmVjdGlvbjpERVNDfSl7XG4gICAgYmFsYW5jZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgYmFsYW5jZV9vdGhlcjogYCBgLFxuICAgICAgICBzcGxpdF9kZXB0aDogYElzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy5gLFxuICAgICAgICB0aWNrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5gLFxuICAgICAgICB0b2NrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5cblxcYFxcYFxcYCAgICAgICAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e3RvY2s6e25lOm51bGx9fSl7XG4gICAgaWRcbiAgICB0b2NrXG4gICAgdGlja1xuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgY29kZTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGNvZGUgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5cblxcYFxcYFxcYCAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e2NvZGU6e2VxOm51bGx9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59ICAgXG5cXGBcXGBcXGAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgYCxcbiAgICAgICAgY29kZV9oYXNoOiBgXFxgY29kZVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgZGF0YTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5gLFxuICAgICAgICBkYXRhX2hhc2g6IGBcXGBkYXRhXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBsaWJyYXJ5OiBgSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QuYCxcbiAgICAgICAgbGlicmFyeV9oYXNoOiBgXFxgbGlicmFyeVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIGFjY291bnQgc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIHN0YXRlX2hhc2g6IGBDb250YWlucyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaCBvZiBhbiBpbnN0YW5jZSBvZiBcXGBTdGF0ZUluaXRcXGAgd2hlbiBhbiBhY2NvdW50IGlzIGZyb3plbi5gLFxuICAgIH0sXG4gICAgbWVzc2FnZToge1xuICAgICAgICBfZG9jOiBgIyBNZXNzYWdlIHR5cGVcblxuICAgICAgICAgICBNZXNzYWdlIGxheW91dCBxdWVyaWVzLiAgQSBtZXNzYWdlIGNvbnNpc3RzIG9mIGl0cyBoZWFkZXIgZm9sbG93ZWQgYnkgaXRzXG4gICAgICAgICAgIGJvZHkgb3IgcGF5bG9hZC4gVGhlIGJvZHkgaXMgZXNzZW50aWFsbHkgYXJiaXRyYXJ5LCB0byBiZSBpbnRlcnByZXRlZCBieSB0aGVcbiAgICAgICAgICAgZGVzdGluYXRpb24gc21hcnQgY29udHJhY3QuIEl0IGNhbiBiZSBxdWVyaWVkIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6YCxcbiAgICAgICAgbXNnX3R5cGU6IGBSZXR1cm5zIHRoZSB0eXBlIG9mIG1lc3NhZ2UuYCxcbiAgICAgICAgc3RhdHVzOiBgUmV0dXJucyBpbnRlcm5hbCBwcm9jZXNzaW5nIHN0YXR1cyBhY2NvcmRpbmcgdG8gdGhlIG51bWJlcnMgc2hvd24uYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9keTogYEJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIGJvZHkgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9keV9oYXNoOiBgXFxgYm9keVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgc3BsaXRfZGVwdGg6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIHRpY2s6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIHRvY2s6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgY29kZTogYFJlcHJlc2VudHMgY29udHJhY3QgY29kZSBpbiBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgY29kZV9oYXNoOiBgXFxgY29kZVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgZGF0YTogYFJlcHJlc2VudHMgaW5pdGlhbCBkYXRhIGZvciBhIGNvbnRyYWN0IGluIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGRhdGFfaGFzaDogYFxcYGRhdGFcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGxpYnJhcnk6IGBSZXByZXNlbnRzIGNvbnRyYWN0IGxpYnJhcnkgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgbGlicmFyeV9oYXNoOiBgXFxgbGlicmFyeVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgc3JjOiBgUmV0dXJucyBzb3VyY2UgYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBkc3Q6IGBSZXR1cm5zIGRlc3RpbmF0aW9uIGFkZHJlc3Mgc3RyaW5nYCxcbiAgICAgICAgc3JjX3dvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgc291cmNlIGFkZHJlc3MgKHNyYyBmaWVsZClgLFxuICAgICAgICBkc3Rfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChkc3QgZmllbGQpYCxcbiAgICAgICAgY3JlYXRlZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxuICAgICAgICBjcmVhdGVkX2F0OiBgQ3JlYXRpb24gdW5peHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uIFRoZSBjcmVhdGlvbiB1bml4dGltZSBlcXVhbHMgdGhlIGNyZWF0aW9uIHVuaXh0aW1lIG9mIHRoZSBibG9jayBjb250YWluaW5nIHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGlocl9kaXNhYmxlZDogYElIUiBpcyBkaXNhYmxlZCBmb3IgdGhlIG1lc3NhZ2UuYCxcbiAgICAgICAgaWhyX2ZlZTogYFRoaXMgdmFsdWUgaXMgc3VidHJhY3RlZCBmcm9tIHRoZSB2YWx1ZSBhdHRhY2hlZCB0byB0aGUgbWVzc2FnZSBhbmQgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycyBvZiB0aGUgZGVzdGluYXRpb24gc2hhcmRjaGFpbiBpZiB0aGV5IGluY2x1ZGUgdGhlIG1lc3NhZ2UgYnkgdGhlIElIUiBtZWNoYW5pc20uYCxcbiAgICAgICAgZndkX2ZlZTogYE9yaWdpbmFsIHRvdGFsIGZvcndhcmRpbmcgZmVlIHBhaWQgZm9yIHVzaW5nIHRoZSBIUiBtZWNoYW5pc207IGl0IGlzIGF1dG9tYXRpY2FsbHkgY29tcHV0ZWQgZnJvbSBzb21lIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyBhbmQgdGhlIHNpemUgb2YgdGhlIG1lc3NhZ2UgYXQgdGhlIHRpbWUgdGhlIG1lc3NhZ2UgaXMgZ2VuZXJhdGVkLmAsXG4gICAgICAgIGltcG9ydF9mZWU6IGBgLFxuICAgICAgICBib3VuY2U6IGBCb3VuY2UgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIGJvdW5jZWQ6IGBCb3VuY2VkIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci5gLFxuICAgICAgICB2YWx1ZTogYE1heSBvciBtYXkgbm90IGJlIHByZXNlbnRgLFxuICAgICAgICB2YWx1ZV9vdGhlcjogYE1heSBvciBtYXkgbm90IGJlIHByZXNlbnQuYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBtZXNzYWdlIGlzIGEgcGFydCBvZiBhIGJsb2NrIGl0IGN1dCBmcm9tLiBJdCBpcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQSBiYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBzdHJ1Y3R1cmUgZW5jb2RlZCBhcyBiYXNlNjQuYFxuICAgIH0sXG5cblxuICAgIHRyYW5zYWN0aW9uOiB7XG4gICAgICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgICAgICBfOiB7IGNvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnIH0sXG4gICAgICAgIHRyX3R5cGU6IGBUcmFuc2FjdGlvbiB0eXBlIGFjY29yZGluZyB0byB0aGUgb3JpZ2luYWwgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLCBjbGF1c2UgNC4yLjQuYCxcbiAgICAgICAgc3RhdHVzOiBgVHJhbnNhY3Rpb24gcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgICAgICBibG9ja19pZDogYGAsXG4gICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgIHdvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgYWNjb3VudCBhZGRyZXNzIChhY2NvdW50X2FkZHIgZmllbGQpYCxcbiAgICAgICAgbHQ6IGBMb2dpY2FsIHRpbWUuIEEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIFt0aGUgVE9OIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly90ZXN0LnRvbi5vcmcvdGJsa2NoLnBkZikuYCxcbiAgICAgICAgcHJldl90cmFuc19oYXNoOiBgYCxcbiAgICAgICAgcHJldl90cmFuc19sdDogYGAsXG4gICAgICAgIG5vdzogYGAsXG4gICAgICAgIG91dG1zZ19jbnQ6IGBUaGUgbnVtYmVyIG9mIGdlbmVyYXRlZCBvdXRib3VuZCBtZXNzYWdlcyAob25lIG9mIHRoZSBjb21tb24gdHJhbnNhY3Rpb24gcGFyYW1ldGVycyBkZWZpbmVkIGJ5IHRoZSBzcGVjaWZpY2F0aW9uKWAsXG4gICAgICAgIG9yaWdfc3RhdHVzOiBgVGhlIGluaXRpYWwgc3RhdGUgb2YgYWNjb3VudC4gTm90ZSB0aGF0IGluIHRoaXMgY2FzZSB0aGUgcXVlcnkgbWF5IHJldHVybiAwLCBpZiB0aGUgYWNjb3VudCB3YXMgbm90IGFjdGl2ZSBiZWZvcmUgdGhlIHRyYW5zYWN0aW9uIGFuZCAxIGlmIGl0IHdhcyBhbHJlYWR5IGFjdGl2ZWAsXG4gICAgICAgIGVuZF9zdGF0dXM6IGBUaGUgZW5kIHN0YXRlIG9mIGFuIGFjY291bnQgYWZ0ZXIgYSB0cmFuc2FjdGlvbiwgMSBpcyByZXR1cm5lZCB0byBpbmRpY2F0ZSBhIGZpbmFsaXplZCB0cmFuc2FjdGlvbiBhdCBhbiBhY3RpdmUgYWNjb3VudGAsXG4gICAgICAgIGluX21zZzogYGAsXG4gICAgICAgIGluX21lc3NhZ2U6IGBgLFxuICAgICAgICBvdXRfbXNnczogYERpY3Rpb25hcnkgb2YgdHJhbnNhY3Rpb24gb3V0Ym91bmQgbWVzc2FnZXMgYXMgc3BlY2lmaWVkIGluIHRoZSBzcGVjaWZpY2F0aW9uYCxcbiAgICAgICAgb3V0X21lc3NhZ2VzOiBgYCxcbiAgICAgICAgdG90YWxfZmVlczogYFRvdGFsIGFtb3VudCBvZiBmZWVzIHRoYXQgZW50YWlscyBhY2NvdW50IHN0YXRlIGNoYW5nZSBhbmQgdXNlZCBpbiBNZXJrbGUgdXBkYXRlYCxcbiAgICAgICAgdG90YWxfZmVlc19vdGhlcjogYFNhbWUgYXMgYWJvdmUsIGJ1dCByZXNlcnZlZCBmb3Igbm9uIGdyYW0gY29pbnMgdGhhdCBtYXkgYXBwZWFyIGluIHRoZSBibG9ja2NoYWluYCxcbiAgICAgICAgb2xkX2hhc2g6IGBNZXJrbGUgdXBkYXRlIGZpZWxkYCxcbiAgICAgICAgbmV3X2hhc2g6IGBNZXJrbGUgdXBkYXRlIGZpZWxkYCxcbiAgICAgICAgY3JlZGl0X2ZpcnN0OiBgYCxcbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYFRoaXMgZmllbGQgZGVmaW5lcyB0aGUgYW1vdW50IG9mIHN0b3JhZ2UgZmVlcyBjb2xsZWN0ZWQgaW4gZ3JhbXMuYCxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGBUaGlzIGZpZWxkIHJlcHJlc2VudHMgdGhlIGFtb3VudCBvZiBkdWUgZmVlcyBpbiBncmFtcywgaXQgbWlnaHQgYmUgZW1wdHkuYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBUaGlzIGZpZWxkIHJlcHJlc2VudHMgYWNjb3VudCBzdGF0dXMgY2hhbmdlIGFmdGVyIHRoZSB0cmFuc2FjdGlvbiBpcyBjb21wbGV0ZWQuYCxcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVkaXQ6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgYWNjb3VudCBpcyBjcmVkaXRlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIHJlY2VpdmVkLiBUaGUgY3JlZGl0IHBoYXNlIGNhbiByZXN1bHQgaW4gdGhlIGNvbGxlY3Rpb24gb2Ygc29tZSBkdWUgcGF5bWVudHNgLFxuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBgVGhlIHN1bSBvZiBkdWVfZmVlc19jb2xsZWN0ZWQgYW5kIGNyZWRpdCBtdXN0IGVxdWFsIHRoZSB2YWx1ZSBvZiB0aGUgbWVzc2FnZSByZWNlaXZlZCwgcGx1cyBpdHMgaWhyX2ZlZSBpZiB0aGUgbWVzc2FnZSBoYXMgbm90IGJlZW4gcmVjZWl2ZWQgdmlhIEluc3RhbnQgSHlwZXJjdWJlIFJvdXRpbmcsIElIUiAob3RoZXJ3aXNlIHRoZSBpaHJfZmVlIGlzIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMpLmAsXG4gICAgICAgICAgICBjcmVkaXQ6IGBgLFxuICAgICAgICAgICAgY3JlZGl0X290aGVyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZToge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBjb2RlIG9mIHRoZSBzbWFydCBjb250cmFjdCBpcyBpbnZva2VkIGluc2lkZSBhbiBpbnN0YW5jZSBvZiBUVk0gd2l0aCBhZGVxdWF0ZSBwYXJhbWV0ZXJzLCBpbmNsdWRpbmcgYSBjb3B5IG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgYW5kIG9mIHRoZSBwZXJzaXN0ZW50IGRhdGEsIGFuZCB0ZXJtaW5hdGVzIHdpdGggYW4gZXhpdCBjb2RlLCB0aGUgbmV3IHBlcnNpc3RlbnQgZGF0YSwgYW5kIGFuIGFjdGlvbiBsaXN0ICh3aGljaCBpbmNsdWRlcywgZm9yIGluc3RhbmNlLCBvdXRib3VuZCBtZXNzYWdlcyB0byBiZSBzZW50KS4gVGhlIHByb2Nlc3NpbmcgcGhhc2UgbWF5IGxlYWQgdG8gdGhlIGNyZWF0aW9uIG9mIGEgbmV3IGFjY291bnQgKHVuaW5pdGlhbGl6ZWQgb3IgYWN0aXZlKSwgb3IgdG8gdGhlIGFjdGl2YXRpb24gb2YgYSBwcmV2aW91c2x5IHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnQuIFRoZSBnYXMgcGF5bWVudCwgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgdGhlIGdhcyBwcmljZSBhbmQgdGhlIGdhcyBjb25zdW1lZCwgaXMgZXhhY3RlZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2UuXG5JZiB0aGVyZSBpcyBubyByZWFzb24gdG8gc2tpcCB0aGUgY29tcHV0aW5nIHBoYXNlLCBUVk0gaXMgaW52b2tlZCBhbmQgdGhlIHJlc3VsdHMgb2YgdGhlIGNvbXB1dGF0aW9uIGFyZSBsb2dnZWQuIFBvc3NpYmxlIHBhcmFtZXRlcnMgYXJlIGNvdmVyZWQgYmVsb3cuYCxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZTogYGAsXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbjogYFJlYXNvbiBmb3Igc2tpcHBpbmcgdGhlIGNvbXB1dGUgcGhhc2UuIEFjY29yZGluZyB0byB0aGUgc3BlY2lmaWNhdGlvbiwgdGhlIHBoYXNlIGNhbiBiZSBza2lwcGVkIGR1ZSB0byB0aGUgYWJzZW5jZSBvZiBmdW5kcyB0byBidXkgZ2FzLCBhYnNlbmNlIG9mIHN0YXRlIG9mIGFuIGFjY291bnQgb3IgYSBtZXNzYWdlLCBmYWlsdXJlIHRvIHByb3ZpZGUgYSB2YWxpZCBzdGF0ZSBpbiB0aGUgbWVzc2FnZWAsXG4gICAgICAgICAgICBzdWNjZXNzOiBgVGhpcyBmbGFnIGlzIHNldCBpZiBhbmQgb25seSBpZiBleGl0X2NvZGUgaXMgZWl0aGVyIDAgb3IgMS5gLFxuICAgICAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KWAsXG4gICAgICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYFRoZSBmbGFnIHJlZmxlY3RzIHdoZXRoZXIgdGhpcyBoYXMgcmVzdWx0ZWQgaW4gdGhlIGFjdGl2YXRpb24gb2YgYSBwcmV2aW91c2x5IGZyb3plbiwgdW5pbml0aWFsaXplZCBvciBub24tZXhpc3RlbnQgYWNjb3VudC5gLFxuICAgICAgICAgICAgZ2FzX2ZlZXM6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB0aGUgdG90YWwgZ2FzIGZlZXMgY29sbGVjdGVkIGJ5IHRoZSB2YWxpZGF0b3JzIGZvciBleGVjdXRpbmcgdGhpcyB0cmFuc2FjdGlvbi4gSXQgbXVzdCBiZSBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiBnYXNfdXNlZCBhbmQgZ2FzX3ByaWNlIGZyb20gdGhlIGN1cnJlbnQgYmxvY2sgaGVhZGVyLmAsXG4gICAgICAgICAgICBnYXNfdXNlZDogYGAsXG4gICAgICAgICAgICBnYXNfbGltaXQ6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB0aGUgZ2FzIGxpbWl0IGZvciB0aGlzIGluc3RhbmNlIG9mIFRWTS4gSXQgZXF1YWxzIHRoZSBsZXNzZXIgb2YgZWl0aGVyIHRoZSBHcmFtcyBjcmVkaXRlZCBpbiB0aGUgY3JlZGl0IHBoYXNlIGZyb20gdGhlIHZhbHVlIG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgZGl2aWRlZCBieSB0aGUgY3VycmVudCBnYXMgcHJpY2UsIG9yIHRoZSBnbG9iYWwgcGVyLXRyYW5zYWN0aW9uIGdhcyBsaW1pdC5gLFxuICAgICAgICAgICAgZ2FzX2NyZWRpdDogYFRoaXMgcGFyYW1ldGVyIG1heSBiZSBub24temVybyBvbmx5IGZvciBleHRlcm5hbCBpbmJvdW5kIG1lc3NhZ2VzLiBJdCBpcyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgYW1vdW50IG9mIGdhcyB0aGF0IGNhbiBiZSBwYWlkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZSBvciB0aGUgbWF4aW11bSBnYXMgY3JlZGl0YCxcbiAgICAgICAgICAgIG1vZGU6IGBgLFxuICAgICAgICAgICAgZXhpdF9jb2RlOiBgVGhlc2UgcGFyYW1ldGVyIHJlcHJlc2VudHMgdGhlIHN0YXR1cyB2YWx1ZXMgcmV0dXJuZWQgYnkgVFZNOyBmb3IgYSBzdWNjZXNzZnVsIHRyYW5zYWN0aW9uLCBleGl0X2NvZGUgaGFzIHRvIGJlIDAgb3IgMWAsXG4gICAgICAgICAgICBleGl0X2FyZzogYGAsXG4gICAgICAgICAgICB2bV9zdGVwczogYHRoZSB0b3RhbCBudW1iZXIgb2Ygc3RlcHMgcGVyZm9ybWVkIGJ5IFRWTSAodXN1YWxseSBlcXVhbCB0byB0d28gcGx1cyB0aGUgbnVtYmVyIG9mIGluc3RydWN0aW9ucyBleGVjdXRlZCwgaW5jbHVkaW5nIGltcGxpY2l0IFJFVHMpYCxcbiAgICAgICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogYFRoaXMgcGFyYW1ldGVyIGlzIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoZXMgb2YgdGhlIG9yaWdpbmFsIHN0YXRlIG9mIFRWTS5gLFxuICAgICAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogYFRoaXMgcGFyYW1ldGVyIGlzIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoZXMgb2YgdGhlIHJlc3VsdGluZyBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGhhcyB0ZXJtaW5hdGVkIHN1Y2Nlc3NmdWxseSAod2l0aCBleGl0IGNvZGUgMCBvciAxKSwgdGhlIGFjdGlvbnMgZnJvbSB0aGUgbGlzdCBhcmUgcGVyZm9ybWVkLiBJZiBpdCBpcyBpbXBvc3NpYmxlIHRvIHBlcmZvcm0gYWxsIG9mIHRoZW3igJRmb3IgZXhhbXBsZSwgYmVjYXVzZSBvZiBpbnN1ZmZpY2llbnQgZnVuZHMgdG8gdHJhbnNmZXIgd2l0aCBhbiBvdXRib3VuZCBtZXNzYWdl4oCUdGhlbiB0aGUgdHJhbnNhY3Rpb24gaXMgYWJvcnRlZCBhbmQgdGhlIGFjY291bnQgc3RhdGUgaXMgcm9sbGVkIGJhY2suIFRoZSB0cmFuc2FjdGlvbiBpcyBhbHNvIGFib3J0ZWQgaWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGRpZCBub3QgdGVybWluYXRlIHN1Y2Nlc3NmdWxseSwgb3IgaWYgaXQgd2FzIG5vdCBwb3NzaWJsZSB0byBpbnZva2UgdGhlIHNtYXJ0IGNvbnRyYWN0IGF0IGFsbCBiZWNhdXNlIGl0IGlzIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuLmAsXG4gICAgICAgICAgICBzdWNjZXNzOiBgYCxcbiAgICAgICAgICAgIHZhbGlkOiBgYCxcbiAgICAgICAgICAgIG5vX2Z1bmRzOiBgVGhlIGZsYWcgaW5kaWNhdGVzIGFic2VuY2Ugb2YgZnVuZHMgcmVxdWlyZWQgdG8gY3JlYXRlIGFuIG91dGJvdW5kIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYGAsXG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlczogYGAsXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogYGAsXG4gICAgICAgICAgICByZXN1bHRfY29kZTogYGAsXG4gICAgICAgICAgICByZXN1bHRfYXJnOiBgYCxcbiAgICAgICAgICAgIHRvdF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIHNwZWNfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgbXNnc19jcmVhdGVkOiBgYCxcbiAgICAgICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IGBgLFxuICAgICAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IGBgLFxuICAgICAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGJvdW5jZToge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4gQWxtb3N0IGFsbCB2YWx1ZSBvZiB0aGUgb3JpZ2luYWwgaW5ib3VuZCBtZXNzYWdlIChtaW51cyBnYXMgcGF5bWVudHMgYW5kIGZvcndhcmRpbmcgZmVlcykgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIGdlbmVyYXRlZCBtZXNzYWdlLCB3aGljaCBvdGhlcndpc2UgaGFzIGFuIGVtcHR5IGJvZHkuYCxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlOiBgYCxcbiAgICAgICAgICAgIG1zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIG1zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzOiBgYCxcbiAgICAgICAgICAgIG1zZ19mZWVzOiBgYCxcbiAgICAgICAgICAgIGZ3ZF9mZWVzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgYWJvcnRlZDogYGAsXG4gICAgICAgIGRlc3Ryb3llZDogYGAsXG4gICAgICAgIHR0OiBgYCxcbiAgICAgICAgc3BsaXRfaW5mbzoge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBmaWVsZHMgYmVsb3cgY292ZXIgc3BsaXQgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMgYW5kIG1lcmdlIHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zLCB0aGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIHJlbGV2YW50IHNjaGVtZXMgY292ZXJlZCBieSB0aGUgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLmAsXG4gICAgICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogYGxlbmd0aCBvZiB0aGUgY3VycmVudCBzaGFyZCBwcmVmaXhgLFxuICAgICAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiBgYCxcbiAgICAgICAgICAgIHRoaXNfYWRkcjogYGAsXG4gICAgICAgICAgICBzaWJsaW5nX2FkZHI6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBgYCxcbiAgICAgICAgaW5zdGFsbGVkOiBgYCxcbiAgICAgICAgcHJvb2Y6IGBgLFxuICAgICAgICBib2M6IGBgLFxuICAgIH0sXG5cbiAgICBzaGFyZERlc2NyOiB7XG4gICAgICAgIF9kb2M6IGBTaGFyZEhhc2hlcyBpcyByZXByZXNlbnRlZCBieSBhIGRpY3Rpb25hcnkgd2l0aCAzMi1iaXQgd29ya2NoYWluX2lkcyBhcyBrZXlzLCBhbmQg4oCcc2hhcmQgYmluYXJ5IHRyZWVz4oCdLCByZXByZXNlbnRlZCBieSBUTC1CIHR5cGUgQmluVHJlZSBTaGFyZERlc2NyLCBhcyB2YWx1ZXMuIEVhY2ggbGVhZiBvZiB0aGlzIHNoYXJkIGJpbmFyeSB0cmVlIGNvbnRhaW5zIGEgdmFsdWUgb2YgdHlwZSBTaGFyZERlc2NyLCB3aGljaCBkZXNjcmliZXMgYSBzaW5nbGUgc2hhcmQgYnkgaW5kaWNhdGluZyB0aGUgc2VxdWVuY2UgbnVtYmVyIHNlcV9ubywgdGhlIGxvZ2ljYWwgdGltZSBsdCwgYW5kIHRoZSBoYXNoIGhhc2ggb2YgdGhlIGxhdGVzdCAoc2lnbmVkKSBibG9jayBvZiB0aGUgY29ycmVzcG9uZGluZyBzaGFyZGNoYWluLmAsXG4gICAgICAgIHNlcV9ubzogYHVpbnQzMiBzZXF1ZW5jZSBudW1iZXJgLFxuICAgICAgICByZWdfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICAgICAgc3RhcnRfbHQ6IGBMb2dpY2FsIHRpbWUgb2YgdGhlIHNoYXJkY2hhaW4gc3RhcnRgLFxuICAgICAgICBlbmRfbHQ6IGBMb2dpY2FsIHRpbWUgb2YgdGhlIHNoYXJkY2hhaW4gZW5kYCxcbiAgICAgICAgcm9vdF9oYXNoOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLiBUaGUgc2hhcmQgYmxvY2sgY29uZmlndXJhdGlvbiBpcyBkZXJpdmVkIGZyb20gdGhhdCBibG9jay5gLFxuICAgICAgICBmaWxlX2hhc2g6IGBTaGFyZCBibG9jayBmaWxlIGhhc2guYCxcbiAgICAgICAgYmVmb3JlX3NwbGl0OiBgVE9OIEJsb2NrY2hhaW4gc3VwcG9ydHMgZHluYW1pYyBzaGFyZGluZywgc28gdGhlIHNoYXJkIGNvbmZpZ3VyYXRpb24gbWF5IGNoYW5nZSBmcm9tIGJsb2NrIHRvIGJsb2NrIGJlY2F1c2Ugb2Ygc2hhcmQgbWVyZ2UgYW5kIHNwbGl0IGV2ZW50cy4gVGhlcmVmb3JlLCB3ZSBjYW5ub3Qgc2ltcGx5IHNheSB0aGF0IGVhY2ggc2hhcmRjaGFpbiBjb3JyZXNwb25kcyB0byBhIGZpeGVkIHNldCBvZiBhY2NvdW50IGNoYWlucy5cbkEgc2hhcmRjaGFpbiBibG9jayBhbmQgaXRzIHN0YXRlIG1heSBlYWNoIGJlIGNsYXNzaWZpZWQgaW50byB0d28gZGlzdGluY3QgcGFydHMuIFRoZSBwYXJ0cyB3aXRoIHRoZSBJU1AtZGljdGF0ZWQgZm9ybSBvZiB3aWxsIGJlIGNhbGxlZCB0aGUgc3BsaXQgcGFydHMgb2YgdGhlIGJsb2NrIGFuZCBpdHMgc3RhdGUsIHdoaWxlIHRoZSByZW1haW5kZXIgd2lsbCBiZSBjYWxsZWQgdGhlIG5vbi1zcGxpdCBwYXJ0cy5cblRoZSBtYXN0ZXJjaGFpbiBjYW5ub3QgYmUgc3BsaXQgb3IgbWVyZ2VkLmAsXG4gICAgICAgIGJlZm9yZV9tZXJnZTogYGAsXG4gICAgICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgICAgICB3YW50X21lcmdlOiBgYCxcbiAgICAgICAgbnhfY2NfdXBkYXRlZDogYGAsXG4gICAgICAgIGZsYWdzOiBgYCxcbiAgICAgICAgbmV4dF9jYXRjaGFpbl9zZXFubzogYGAsXG4gICAgICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBgYCxcbiAgICAgICAgbWluX3JlZl9tY19zZXFubzogYGAsXG4gICAgICAgIGdlbl91dGltZTogYEdlbmVyYXRpb24gdGltZSBpbiB1aW50MzJgLFxuICAgICAgICBzcGxpdF90eXBlOiBgYCxcbiAgICAgICAgc3BsaXQ6IGBgLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogYEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkX290aGVyOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICAgIF9kb2M6ICdUaGlzIGlzIEJsb2NrJyxcbiAgICAgICAgc3RhdHVzOiBgUmV0dXJucyBibG9jayBwcm9jZXNzaW5nIHN0YXR1c2AsXG4gICAgICAgIGdsb2JhbF9pZDogYHVpbnQzMiBnbG9iYWwgYmxvY2sgSURgLFxuICAgICAgICB3YW50X3NwbGl0OiBgYCxcbiAgICAgICAgc2VxX25vOiBgYCxcbiAgICAgICAgYWZ0ZXJfbWVyZ2U6IGBgLFxuICAgICAgICBnZW5fdXRpbWU6IGB1aW50IDMyIGdlbmVyYXRpb24gdGltZSBzdGFtcGAsXG4gICAgICAgIGdlbl9jYXRjaGFpbl9zZXFubzogYGAsXG4gICAgICAgIGZsYWdzOiBgYCxcbiAgICAgICAgbWFzdGVyX3JlZjogYGAsXG4gICAgICAgIHByZXZfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jay5gLFxuICAgICAgICBwcmV2X2FsdF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2Ygc2hhcmQgbWVyZ2UuYCxcbiAgICAgICAgcHJldl92ZXJ0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiB2ZXJ0aWNhbCBibG9ja3MuYCxcbiAgICAgICAgcHJldl92ZXJ0X2FsdF9yZWY6IGBgLFxuICAgICAgICB2ZXJzaW9uOiBgdWluMzIgYmxvY2sgdmVyc2lvbiBpZGVudGlmaWVyYCxcbiAgICAgICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IGBgLFxuICAgICAgICBiZWZvcmVfc3BsaXQ6IGBgLFxuICAgICAgICBhZnRlcl9zcGxpdDogYGAsXG4gICAgICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgICAgICB2ZXJ0X3NlcV9ubzogYGAsXG4gICAgICAgIHN0YXJ0X2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gc3RhcnQuXG5Mb2dpY2FsIHRpbWUgaXMgYSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25gLFxuICAgICAgICBlbmRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBlbmQuYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgdWludDMyIHdvcmtjaGFpbiBpZGVudGlmaWVyYCxcbiAgICAgICAgc2hhcmQ6IGBgLFxuICAgICAgICBtaW5fcmVmX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBgUmV0dXJucyBhIG51bWJlciBvZiBhIHByZXZpb3VzIGtleSBibG9jay5gLFxuICAgICAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogYGAsXG4gICAgICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IGBgLFxuICAgICAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgICAgICB0b19uZXh0X2JsazogYEFtb3VudCBvZiBncmFtcyBhbW91bnQgdG8gdGhlIG5leHQgYmxvY2suYCxcbiAgICAgICAgICAgIHRvX25leHRfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdG8gdGhlIG5leHQgYmxvY2suYCxcbiAgICAgICAgICAgIGV4cG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGV4cG9ydGVkLmAsXG4gICAgICAgICAgICBleHBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGV4cG9ydGVkLmAsXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZDogYGAsXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYGAsXG4gICAgICAgICAgICBjcmVhdGVkOiBgYCxcbiAgICAgICAgICAgIGNyZWF0ZWRfb3RoZXI6IGBgLFxuICAgICAgICAgICAgaW1wb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgICAgIGltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxuICAgICAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgICAgIG1pbnRlZDogYEFtb3VudCBvZiBncmFtcyBtaW50ZWQgaW4gdGhpcyBibG9jay5gLFxuICAgICAgICAgICAgbWludGVkX290aGVyOiBgYCxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgICAgIH0sXG4gICAgICAgIGluX21zZ19kZXNjcjogYGAsXG4gICAgICAgIHJhbmRfc2VlZDogYGAsXG4gICAgICAgIGNyZWF0ZWRfYnk6IGBQdWJsaWMga2V5IG9mIHRoZSBjb2xsYXRvciB3aG8gcHJvZHVjZWQgdGhpcyBibG9jay5gLFxuICAgICAgICBvdXRfbXNnX2Rlc2NyOiBgYCxcbiAgICAgICAgYWNjb3VudF9ibG9ja3M6IHtcbiAgICAgICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgb2xkX2hhc2g6IGBvbGQgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgLFxuICAgICAgICAgICAgICAgIG5ld19oYXNoOiBgbmV3IHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX2NvdW50OiBgYFxuICAgICAgICB9LFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG5ldzogYGAsXG4gICAgICAgICAgICBuZXdfaGFzaDogYGAsXG4gICAgICAgICAgICBuZXdfZGVwdGg6IGBgLFxuICAgICAgICAgICAgb2xkOiBgYCxcbiAgICAgICAgICAgIG9sZF9oYXNoOiBgYCxcbiAgICAgICAgICAgIG9sZF9kZXB0aDogYGBcbiAgICAgICAgfSxcbiAgICAgICAgbWFzdGVyOiB7XG4gICAgICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiAnTWluIGJsb2NrIGdlbmVyYXRpb24gdGltZSBvZiBzaGFyZHMnLFxuICAgICAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogJ01heCBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcbiAgICAgICAgICAgIHNoYXJkX2hhc2hlczoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBzaGFyZCBoYXNoZXNgLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYFVpbnQzMiB3b3JrY2hhaW4gSURgLFxuICAgICAgICAgICAgICAgIHNoYXJkOiBgU2hhcmQgSURgLFxuICAgICAgICAgICAgICAgIGRlc2NyOiBgU2hhcmQgZGVzY3JpcHRpb25gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNoYXJkX2ZlZXM6IHtcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkOiBgYCxcbiAgICAgICAgICAgICAgICBmZWVzOiBgQW1vdW50IG9mIGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgICAgIGZlZXNfb3RoZXI6IGBBcnJheSBvZiBmZWVzIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzYCxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGBBbW91bnQgb2YgZmVlcyBjcmVhdGVkIGR1cmluZyBzaGFyZGAsXG4gICAgICAgICAgICAgICAgY3JlYXRlX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGZlZXMgY3JlYXRlZCBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llcyBkdXJpbmcgdGhlIGJsb2NrLmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBgYCxcbiAgICAgICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgcHJldmlvdXMgYmxvY2sgc2lnbmF0dXJlc2AsXG4gICAgICAgICAgICAgICAgbm9kZV9pZDogYGAsXG4gICAgICAgICAgICAgICAgcjogYGAsXG4gICAgICAgICAgICAgICAgczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uZmlnX2FkZHI6IGBgLFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgcDA6IGBBZGRyZXNzIG9mIGNvbmZpZyBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAxOiBgQWRkcmVzcyBvZiBlbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDI6IGBBZGRyZXNzIG9mIG1pbnRlciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAzOiBgQWRkcmVzcyBvZiBmZWUgY29sbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDQ6IGBBZGRyZXNzIG9mIFRPTiBETlMgcm9vdCBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA2YCxcbiAgICAgICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwNzoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgN2AsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEdsb2JhbCB2ZXJzaW9uYCxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwOTogYE1hbmRhdG9yeSBwYXJhbXNgLFxuICAgICAgICAgICAgICAgIHAxMDogYENyaXRpY2FsIHBhcmFtc2AsXG4gICAgICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWcgdm90aW5nIHNldHVwYCxcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNyaXRpY2FsX3BhcmFtczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMTI6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIGFsbCB3b3JrY2hhaW5zIGRlc2NyaXB0aW9uc2AsXG4gICAgICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGBgLFxuICAgICAgICAgICAgICAgICAgICBmbGFnczogYGAsXG4gICAgICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGJhc2ljOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBCbG9jayBjcmVhdGUgZmVlc2AsXG4gICAgICAgICAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9ycyBjb3VudGAsXG4gICAgICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9yIHN0YWtlIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiBgYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE4OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBTdG9yYWdlIHByaWNlc2AsXG4gICAgICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDIxOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgICAgIHAyMjogYEJsb2NrIGxpbWl0cyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgICAgICBwMjQ6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDI1OiBgTWVzc2FnZSBmb3J3YXJkIHByaWNlcyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENhdGNoYWluIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25zZW5zdXMgY29uZmlnYCxcbiAgICAgICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBgYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXG4gICAgICAgICAgICAgICAgcDMyOiBgUHJldmlvdXMgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzMzogYFByZXZpb3VzIHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzNTogYEN1cnJlbnQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM2OiBgTmV4dCB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgICAgICBwMzk6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHZhbGlkYXRvciBzaWduZWQgdGVtcHJvcmFyeSBrZXlzYCxcbiAgICAgICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2Vxbm86IGBgLFxuICAgICAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXG4gICAgICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGtleV9ibG9jazogJ3RydWUgaWYgdGhpcyBibG9jayBpcyBhIGtleSBibG9jaycsXG4gICAgICAgIGJvYzogJ1NlcmlhbGl6ZWQgYmFnIG9mIGNlbGwgb2YgdGhpcyBibG9jayBlbmNvZGVkIHdpdGggYmFzZTY0JyxcbiAgICAgICAgYmFsYW5jZV9kZWx0YTogJ0FjY291bnQgYmFsYW5jZSBjaGFuZ2UgYWZ0ZXIgdHJhbnNhY3Rpb24nLFxuICAgIH0sXG5cbiAgICBibG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgX2RvYzogYFNldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWRgLFxuICAgICAgICBnZW5fdXRpbWU6IGBTaWduZWQgYmxvY2sncyBnZW5fdXRpbWVgLFxuICAgICAgICBzZXFfbm86IGBTaWduZWQgYmxvY2sncyBzZXFfbm9gLFxuICAgICAgICBzaGFyZDogYFNpZ25lZCBibG9jaydzIHNoYXJkYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgU2lnbmVkIGJsb2NrJ3Mgd29ya2NoYWluX2lkYCxcbiAgICAgICAgcHJvb2Y6IGBTaWduZWQgYmxvY2sncyBtZXJrbGUgcHJvb2ZgLFxuICAgICAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcbiAgICAgICAgY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBzaWdfd2VpZ2h0OiBgYCxcbiAgICAgICAgc2lnbmF0dXJlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNgLFxuICAgICAgICAgICAgbm9kZV9pZDogYFZhbGlkYXRvciBJRGAsXG4gICAgICAgICAgICByOiBgJ1InIHBhcnQgb2Ygc2lnbmF0dXJlYCxcbiAgICAgICAgICAgIHM6IGAncycgcGFydCBvZiBzaWduYXR1cmVgLFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIHplcm9zdGF0ZToge1xuICAgICAgICBfZG9jOiBgVGhlIGluaXRpYWwgc3RhdGUgb2YgdGhlIHdvcmtjaGFpbiBiZWZvcmUgZmlyc3QgYmxvY2sgd2FzIGdlbmVyYXRlZGAsXG4gICAgICAgIGdsb2JhbF9pZDogYHVpbnQzMiBnbG9iYWwgbmV0d29yayBJRGAsXG4gICAgICAgIHdvcmtjaGFpbl9pZDogYFplcm9zdGF0ZSdzIHdvcmtjaGFpbl9pZGAsXG4gICAgICAgIGFjY291bnRzOiBgSW5pdGlhbCBhY2NvdW50cyBzdGF0ZSBhdCB0aGUgd29ya2NoYWluIHN0YXJ0YCxcbiAgICAgICAgdG90YWxfYmFsYW5jZTogYE92ZXJhbGwgYmFsYW5jZSBvZiBhbGwgYWNjb3VudHMgb2YgdGhlIHdvcmtjaGFpbmAsXG4gICAgICAgIHRvdGFsX2JhbGFuY2Vfb3RoZXI6IGBPdmVyYWxsIGJhbGFuY2Ugb2YgYWxsIGFjY291bnRzIG9mIHRoZSB3b3JrY2hhaW4gaW4gb3RoZXIgY3VycmVuY2llc2AsXG4gICAgICAgIG1hc3Rlcjoge1xuICAgICAgICAgICAgZ2xvYmFsX2JhbGFuY2U6IGBPdmVyYWxsIGJhbGFuY2Ugb2YgYWxsIGFjY291bnRzYCxcbiAgICAgICAgICAgIGdsb2JhbF9iYWxhbmNlX290aGVyOiBgT3ZlcmFsbCBiYWxhbmNlIG9mIGFsbCBhY2NvdW50cyBpbiBvdGhlciBjdXJyZW5jaWVzYCxcbiAgICAgICAgICAgIHZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBib2M6ICdTZXJpYWxpemVkIGJhZyBvZiBjZWxsIG9mIHRoaXMgemVyb3N0YXRlIGVuY29kZWQgd2l0aCBiYXNlNjQnLFxuICAgICAgICBsaWJyYXJpZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBJbml0aWFsIGxpYnJhcmllcyBhdCB0aGUgd29ya2NoYWluIHN0YXJ0YCxcbiAgICAgICAgICAgIGhhc2g6IGBMaWJyYXJ5IGhhc2hgLFxuICAgICAgICAgICAgcHVibGlzaGVyczogYExpc3Qgb2YgdGhlIGFjY291bnRzIHdoaWNoIHVzZSB0aGUgbGlicmFyeWAsXG4gICAgICAgICAgICBsaWI6IGBTZXJpYWxpemVkIGJhZyBvZiBjZWxsIG9mIHRoaXMgbGlicmFyeSBlbmNvZGVkIHdpdGggYmFzZTY0YCxcbiAgICAgICAgfVxuICAgIH1cblxufTtcbiJdfQ==