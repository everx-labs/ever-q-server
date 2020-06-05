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
    boc: `Bag of cells with the account struct encoded as base64.`
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
  }
};
exports.docs = docs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJib2R5X2hhc2giLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJ0cmFuc2FjdGlvbiIsIl8iLCJjb2xsZWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInNoYXJkRGVzY3IiLCJzZXFfbm8iLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWQiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwia2V5X2Jsb2NrIiwiYmFsYW5jZV9kZWx0YSIsImJsb2NrU2lnbmF0dXJlcyIsInZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJjYXRjaGFpbl9zZXFubyIsInNpZ193ZWlnaHQiLCJzaWduYXR1cmVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNPLE1BQU1BLElBQUksR0FBRztBQUNoQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xDLElBQUFBLElBQUksRUFBRzs7Ozs7Ozs7Ozs7O1lBREY7QUFjTEMsSUFBQUEsRUFBRSxFQUFHLEVBZEE7QUFlTEMsSUFBQUEsWUFBWSxFQUFHLGlEQWZWO0FBZ0JMQyxJQUFBQSxRQUFRLEVBQUc7Ozs7Ozs7OztTQWhCTjtBQTBCTEMsSUFBQUEsU0FBUyxFQUFHOzs7Ozs7Ozs7Ozs7O2lCQTFCUDtBQXdDTEMsSUFBQUEsV0FBVyxFQUFHOzs7Ozs7Ozs7O1NBeENUO0FBbURMQyxJQUFBQSxhQUFhLEVBQUcsR0FuRFg7QUFvRExDLElBQUFBLE9BQU8sRUFBRzs7Ozs7Ozs7U0FwREw7QUE2RExDLElBQUFBLGFBQWEsRUFBRyxHQTdEWDtBQThETEMsSUFBQUEsV0FBVyxFQUFHLHFFQTlEVDtBQStETEMsSUFBQUEsSUFBSSxFQUFHLHdKQS9ERjtBQWdF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UyxFQUFHLEVBRlg7QUFHREMsVUFBQUEsZUFBZSxFQUFHLEVBSGpCO0FBSURDLFVBQUFBLEtBQUssRUFBRyxFQUpQO0FBS0RDLFVBQUFBLFdBQVcsRUFBRyxFQUxiO0FBTURDLFVBQUFBLFdBQVcsRUFBRyxFQU5iO0FBT0RDLFVBQUFBLFdBQVcsRUFBRztBQVBiO0FBakhEO0FBekJKLEtBcEVMO0FBeU5IQyxJQUFBQSxTQUFTLEVBQUUsbUNBek5SO0FBME5INVEsSUFBQUEsR0FBRyxFQUFFLDBEQTFORjtBQTJOSDZRLElBQUFBLGFBQWEsRUFBRTtBQTNOWixHQXJRUztBQW1laEJDLEVBQUFBLGVBQWUsRUFBRTtBQUNialMsSUFBQUEsSUFBSSxFQUFHLGlFQURNO0FBRWJrSSxJQUFBQSxTQUFTLEVBQUcsMEJBRkM7QUFHYmYsSUFBQUEsTUFBTSxFQUFHLHVCQUhJO0FBSWJtQyxJQUFBQSxLQUFLLEVBQUcsc0JBSks7QUFLYnBKLElBQUFBLFlBQVksRUFBRyw2QkFMRjtBQU1iZ0IsSUFBQUEsS0FBSyxFQUFHLDZCQU5LO0FBT2JnUixJQUFBQSx5QkFBeUIsRUFBRyxFQVBmO0FBUWJDLElBQUFBLGNBQWMsRUFBRyxFQVJKO0FBU2JDLElBQUFBLFVBQVUsRUFBRyxFQVRBO0FBVWJDLElBQUFBLFVBQVUsRUFBRTtBQUNSclMsTUFBQUEsSUFBSSxFQUFHLDZDQURDO0FBRVJnTSxNQUFBQSxPQUFPLEVBQUcsY0FGRjtBQUdSQyxNQUFBQSxDQUFDLEVBQUcsdUJBSEk7QUFJUkMsTUFBQUEsQ0FBQyxFQUFHO0FBSkk7QUFWQztBQW5lRCxDQUFiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9wcmVmZXItZGVmYXVsdC1leHBvcnRcbmV4cG9ydCBjb25zdCBkb2NzID0ge1xuICAgIGFjY291bnQ6IHtcbiAgICAgICAgX2RvYzogYFxuIyBBY2NvdW50IHR5cGVcblxuUmVjYWxsIHRoYXQgYSBzbWFydCBjb250cmFjdCBhbmQgYW4gYWNjb3VudCBhcmUgdGhlIHNhbWUgdGhpbmcgaW4gdGhlIGNvbnRleHRcbm9mIHRoZSBUT04gQmxvY2tjaGFpbiwgYW5kIHRoYXQgdGhlc2UgdGVybXMgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5LCBhdFxubGVhc3QgYXMgbG9uZyBhcyBvbmx5IHNtYWxsIChvciDigJx1c3VhbOKAnSkgc21hcnQgY29udHJhY3RzIGFyZSBjb25zaWRlcmVkLiBBIGxhcmdlXG5zbWFydC1jb250cmFjdCBtYXkgZW1wbG95IHNldmVyYWwgYWNjb3VudHMgbHlpbmcgaW4gZGlmZmVyZW50IHNoYXJkY2hhaW5zIG9mXG50aGUgc2FtZSB3b3JrY2hhaW4gZm9yIGxvYWQgYmFsYW5jaW5nIHB1cnBvc2VzLlxuXG5BbiBhY2NvdW50IGlzIGlkZW50aWZpZWQgYnkgaXRzIGZ1bGwgYWRkcmVzcyBhbmQgaXMgY29tcGxldGVseSBkZXNjcmliZWQgYnlcbml0cyBzdGF0ZS4gSW4gb3RoZXIgd29yZHMsIHRoZXJlIGlzIG5vdGhpbmcgZWxzZSBpbiBhbiBhY2NvdW50IGFwYXJ0IGZyb20gaXRzXG5hZGRyZXNzIGFuZCBzdGF0ZS5cbiAgICAgICAgICAgYCxcbiAgICAgICAgaWQ6IGBgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoaWQgZmllbGQpLmAsXG4gICAgICAgIGFjY190eXBlOiBgUmV0dXJucyB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7YWNjX3R5cGU6e2VxOjF9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgbGFzdF9wYWlkOiBgXG5Db250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnRcbmNvbGxlY3RlZCAodXN1YWxseSB0aGlzIGlzIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdHJhbnNhY3Rpb24pLFxub3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKS5cblxcYFxcYFxcYFxucXVlcnl7XG4gIGFjY291bnRzKGZpbHRlcjoge1xuICAgIGxhc3RfcGFpZDp7Z2U6MTU2NzI5NjAwMH1cbiAgfSkge1xuICBpZFxuICBsYXN0X3BhaWR9XG59XG5cXGBcXGBcXGAgICAgIFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgIGR1ZV9wYXltZW50OiBgXG5JZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWMtIGNvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC5cblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhmaWx0ZXI6IHsgZHVlX3BheW1lbnQ6IHsgbmU6IG51bGwgfSB9KVxuICAgIHtcbiAgICAgIGlkXG4gICAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfdHJhbnNfbHQ6IGAgYCxcbiAgICAgICAgYmFsYW5jZTogYFxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKG9yZGVyQnk6e3BhdGg6XCJiYWxhbmNlXCIsZGlyZWN0aW9uOkRFU0N9KXtcbiAgICBiYWxhbmNlXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBiYWxhbmNlX290aGVyOiBgIGAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgSXMgcHJlc2VudCBhbmQgbm9uLXplcm8gb25seSBpbiBpbnN0YW5jZXMgb2YgbGFyZ2Ugc21hcnQgY29udHJhY3RzLmAsXG4gICAgICAgIHRpY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLmAsXG4gICAgICAgIHRvY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLlxuXFxgXFxgXFxgICAgICAgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7dG9jazp7bmU6bnVsbH19KXtcbiAgICBpZFxuICAgIHRvY2tcbiAgICB0aWNrXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBjb2RlOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LlxuXFxgXFxgXFxgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7Y29kZTp7ZXE6bnVsbH19KXtcbiAgICBpZFxuICAgIGFjY190eXBlXG4gIH1cbn0gICBcblxcYFxcYFxcYCAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBgLFxuICAgICAgICBjb2RlX2hhc2g6IGBcXGBjb2RlXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBkYXRhOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgZGF0YSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LmAsXG4gICAgICAgIGRhdGFfaGFzaDogYFxcYGRhdGFcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGxpYnJhcnk6IGBJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdC5gLFxuICAgICAgICBsaWJyYXJ5X2hhc2g6IGBcXGBsaWJyYXJ5XFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgYWNjb3VudCBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICB9LFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgX2RvYzogYCMgTWVzc2FnZSB0eXBlXG5cbiAgICAgICAgICAgTWVzc2FnZSBsYXlvdXQgcXVlcmllcy4gIEEgbWVzc2FnZSBjb25zaXN0cyBvZiBpdHMgaGVhZGVyIGZvbGxvd2VkIGJ5IGl0c1xuICAgICAgICAgICBib2R5IG9yIHBheWxvYWQuIFRoZSBib2R5IGlzIGVzc2VudGlhbGx5IGFyYml0cmFyeSwgdG8gYmUgaW50ZXJwcmV0ZWQgYnkgdGhlXG4gICAgICAgICAgIGRlc3RpbmF0aW9uIHNtYXJ0IGNvbnRyYWN0LiBJdCBjYW4gYmUgcXVlcmllZCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOmAsXG4gICAgICAgIG1zZ190eXBlOiBgUmV0dXJucyB0aGUgdHlwZSBvZiBtZXNzYWdlLmAsXG4gICAgICAgIHN0YXR1czogYFJldHVybnMgaW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMgYWNjb3JkaW5nIHRvIHRoZSBudW1iZXJzIHNob3duLmAsXG4gICAgICAgIGJsb2NrX2lkOiBgTWVya2xlIHByb29mIHRoYXQgYWNjb3VudCBpcyBhIHBhcnQgb2Ygc2hhcmQgc3RhdGUgaXQgY3V0IGZyb20gYXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvZHk6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBib2R5IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvZHlfaGFzaDogYFxcYGJvZHlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0aWNrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0b2NrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGNvZGU6IGBSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIGNvZGVfaGFzaDogYFxcYGNvZGVcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGRhdGE6IGBSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBkYXRhX2hhc2g6IGBcXGBkYXRhXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxuICAgICAgICBsaWJyYXJ5OiBgUmVwcmVzZW50cyBjb250cmFjdCBsaWJyYXJ5IGluIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGxpYnJhcnlfaGFzaDogYFxcYGxpYnJhcnlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIHNyYzogYFJldHVybnMgc291cmNlIGFkZHJlc3Mgc3RyaW5nYCxcbiAgICAgICAgZHN0OiBgUmV0dXJucyBkZXN0aW5hdGlvbiBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIHNyY193b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIHNvdXJjZSBhZGRyZXNzIChzcmMgZmllbGQpYCxcbiAgICAgICAgZHN0X3dvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgZGVzdGluYXRpb24gYWRkcmVzcyAoZHN0IGZpZWxkKWAsXG4gICAgICAgIGNyZWF0ZWRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgY3JlYXRlZF9hdDogYENyZWF0aW9uIHVuaXh0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLiBUaGUgY3JlYXRpb24gdW5peHRpbWUgZXF1YWxzIHRoZSBjcmVhdGlvbiB1bml4dGltZSBvZiB0aGUgYmxvY2sgY29udGFpbmluZyB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxuICAgICAgICBpaHJfZGlzYWJsZWQ6IGBJSFIgaXMgZGlzYWJsZWQgZm9yIHRoZSBtZXNzYWdlLmAsXG4gICAgICAgIGlocl9mZWU6IGBUaGlzIHZhbHVlIGlzIHN1YnRyYWN0ZWQgZnJvbSB0aGUgdmFsdWUgYXR0YWNoZWQgdG8gdGhlIG1lc3NhZ2UgYW5kIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMgb2YgdGhlIGRlc3RpbmF0aW9uIHNoYXJkY2hhaW4gaWYgdGhleSBpbmNsdWRlIHRoZSBtZXNzYWdlIGJ5IHRoZSBJSFIgbWVjaGFuaXNtLmAsXG4gICAgICAgIGZ3ZF9mZWU6IGBPcmlnaW5hbCB0b3RhbCBmb3J3YXJkaW5nIGZlZSBwYWlkIGZvciB1c2luZyB0aGUgSFIgbWVjaGFuaXNtOyBpdCBpcyBhdXRvbWF0aWNhbGx5IGNvbXB1dGVkIGZyb20gc29tZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgYW5kIHRoZSBzaXplIG9mIHRoZSBtZXNzYWdlIGF0IHRoZSB0aW1lIHRoZSBtZXNzYWdlIGlzIGdlbmVyYXRlZC5gLFxuICAgICAgICBpbXBvcnRfZmVlOiBgYCxcbiAgICAgICAgYm91bmNlOiBgQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci5gLFxuICAgICAgICBib3VuY2VkOiBgQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgdmFsdWU6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50YCxcbiAgICAgICAgdmFsdWVfb3RoZXI6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50LmAsXG4gICAgICAgIHByb29mOiBgTWVya2xlIHByb29mIHRoYXQgbWVzc2FnZSBpcyBhIHBhcnQgb2YgYSBibG9jayBpdCBjdXQgZnJvbS4gSXQgaXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvYzogYEEgYmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2Ugc3RydWN0dXJlIGVuY29kZWQgYXMgYmFzZTY0LmBcbiAgICB9LFxuXG5cbiAgICB0cmFuc2FjdGlvbjoge1xuICAgICAgICBfZG9jOiAnVE9OIFRyYW5zYWN0aW9uJyxcbiAgICAgICAgXzogeyBjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJyB9LFxuICAgICAgICB0cl90eXBlOiBgVHJhbnNhY3Rpb24gdHlwZSBhY2NvcmRpbmcgdG8gdGhlIG9yaWdpbmFsIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbiwgY2xhdXNlIDQuMi40LmAsXG4gICAgICAgIHN0YXR1czogYFRyYW5zYWN0aW9uIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBgLFxuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoYWNjb3VudF9hZGRyIGZpZWxkKWAsXG4gICAgICAgIGx0OiBgTG9naWNhbCB0aW1lLiBBIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSBbdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdGVzdC50b24ub3JnL3RibGtjaC5wZGYpLmAsXG4gICAgICAgIHByZXZfdHJhbnNfaGFzaDogYGAsXG4gICAgICAgIHByZXZfdHJhbnNfbHQ6IGBgLFxuICAgICAgICBub3c6IGBgLFxuICAgICAgICBvdXRtc2dfY250OiBgVGhlIG51bWJlciBvZiBnZW5lcmF0ZWQgb3V0Ym91bmQgbWVzc2FnZXMgKG9uZSBvZiB0aGUgY29tbW9uIHRyYW5zYWN0aW9uIHBhcmFtZXRlcnMgZGVmaW5lZCBieSB0aGUgc3BlY2lmaWNhdGlvbilgLFxuICAgICAgICBvcmlnX3N0YXR1czogYFRoZSBpbml0aWFsIHN0YXRlIG9mIGFjY291bnQuIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgdGhlIHF1ZXJ5IG1heSByZXR1cm4gMCwgaWYgdGhlIGFjY291bnQgd2FzIG5vdCBhY3RpdmUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbiBhbmQgMSBpZiBpdCB3YXMgYWxyZWFkeSBhY3RpdmVgLFxuICAgICAgICBlbmRfc3RhdHVzOiBgVGhlIGVuZCBzdGF0ZSBvZiBhbiBhY2NvdW50IGFmdGVyIGEgdHJhbnNhY3Rpb24sIDEgaXMgcmV0dXJuZWQgdG8gaW5kaWNhdGUgYSBmaW5hbGl6ZWQgdHJhbnNhY3Rpb24gYXQgYW4gYWN0aXZlIGFjY291bnRgLFxuICAgICAgICBpbl9tc2c6IGBgLFxuICAgICAgICBpbl9tZXNzYWdlOiBgYCxcbiAgICAgICAgb3V0X21zZ3M6IGBEaWN0aW9uYXJ5IG9mIHRyYW5zYWN0aW9uIG91dGJvdW5kIG1lc3NhZ2VzIGFzIHNwZWNpZmllZCBpbiB0aGUgc3BlY2lmaWNhdGlvbmAsXG4gICAgICAgIG91dF9tZXNzYWdlczogYGAsXG4gICAgICAgIHRvdGFsX2ZlZXM6IGBUb3RhbCBhbW91bnQgb2YgZmVlcyB0aGF0IGVudGFpbHMgYWNjb3VudCBzdGF0ZSBjaGFuZ2UgYW5kIHVzZWQgaW4gTWVya2xlIHVwZGF0ZWAsXG4gICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IGBTYW1lIGFzIGFib3ZlLCBidXQgcmVzZXJ2ZWQgZm9yIG5vbiBncmFtIGNvaW5zIHRoYXQgbWF5IGFwcGVhciBpbiB0aGUgYmxvY2tjaGFpbmAsXG4gICAgICAgIG9sZF9oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIG5ld19oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIGNyZWRpdF9maXJzdDogYGAsXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGBUaGlzIGZpZWxkIGRlZmluZXMgdGhlIGFtb3VudCBvZiBzdG9yYWdlIGZlZXMgY29sbGVjdGVkIGluIGdyYW1zLmAsXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIHRoZSBhbW91bnQgb2YgZHVlIGZlZXMgaW4gZ3JhbXMsIGl0IG1pZ2h0IGJlIGVtcHR5LmAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIGFjY291bnQgc3RhdHVzIGNoYW5nZSBhZnRlciB0aGUgdHJhbnNhY3Rpb24gaXMgY29tcGxldGVkLmAsXG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlZGl0OiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGFjY291bnQgaXMgY3JlZGl0ZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSByZWNlaXZlZC4gVGhlIGNyZWRpdCBwaGFzZSBjYW4gcmVzdWx0IGluIHRoZSBjb2xsZWN0aW9uIG9mIHNvbWUgZHVlIHBheW1lbnRzYCxcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYFRoZSBzdW0gb2YgZHVlX2ZlZXNfY29sbGVjdGVkIGFuZCBjcmVkaXQgbXVzdCBlcXVhbCB0aGUgdmFsdWUgb2YgdGhlIG1lc3NhZ2UgcmVjZWl2ZWQsIHBsdXMgaXRzIGlocl9mZWUgaWYgdGhlIG1lc3NhZ2UgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHZpYSBJbnN0YW50IEh5cGVyY3ViZSBSb3V0aW5nLCBJSFIgKG90aGVyd2lzZSB0aGUgaWhyX2ZlZSBpcyBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzKS5gLFxuICAgICAgICAgICAgY3JlZGl0OiBgYCxcbiAgICAgICAgICAgIGNyZWRpdF9vdGhlcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgY29kZSBvZiB0aGUgc21hcnQgY29udHJhY3QgaXMgaW52b2tlZCBpbnNpZGUgYW4gaW5zdGFuY2Ugb2YgVFZNIHdpdGggYWRlcXVhdGUgcGFyYW1ldGVycywgaW5jbHVkaW5nIGEgY29weSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGFuZCBvZiB0aGUgcGVyc2lzdGVudCBkYXRhLCBhbmQgdGVybWluYXRlcyB3aXRoIGFuIGV4aXQgY29kZSwgdGhlIG5ldyBwZXJzaXN0ZW50IGRhdGEsIGFuZCBhbiBhY3Rpb24gbGlzdCAod2hpY2ggaW5jbHVkZXMsIGZvciBpbnN0YW5jZSwgb3V0Ym91bmQgbWVzc2FnZXMgdG8gYmUgc2VudCkuIFRoZSBwcm9jZXNzaW5nIHBoYXNlIG1heSBsZWFkIHRvIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBhY2NvdW50ICh1bmluaXRpYWxpemVkIG9yIGFjdGl2ZSksIG9yIHRvIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50LiBUaGUgZ2FzIHBheW1lbnQsIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIHRoZSBnYXMgcHJpY2UgYW5kIHRoZSBnYXMgY29uc3VtZWQsIGlzIGV4YWN0ZWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlLlxuSWYgdGhlcmUgaXMgbm8gcmVhc29uIHRvIHNraXAgdGhlIGNvbXB1dGluZyBwaGFzZSwgVFZNIGlzIGludm9rZWQgYW5kIHRoZSByZXN1bHRzIG9mIHRoZSBjb21wdXRhdGlvbiBhcmUgbG9nZ2VkLiBQb3NzaWJsZSBwYXJhbWV0ZXJzIGFyZSBjb3ZlcmVkIGJlbG93LmAsXG4gICAgICAgICAgICBjb21wdXRlX3R5cGU6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb246IGBSZWFzb24gZm9yIHNraXBwaW5nIHRoZSBjb21wdXRlIHBoYXNlLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24sIHRoZSBwaGFzZSBjYW4gYmUgc2tpcHBlZCBkdWUgdG8gdGhlIGFic2VuY2Ugb2YgZnVuZHMgdG8gYnV5IGdhcywgYWJzZW5jZSBvZiBzdGF0ZSBvZiBhbiBhY2NvdW50IG9yIGEgbWVzc2FnZSwgZmFpbHVyZSB0byBwcm92aWRlIGEgdmFsaWQgc3RhdGUgaW4gdGhlIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3VjY2VzczogYFRoaXMgZmxhZyBpcyBzZXQgaWYgYW5kIG9ubHkgaWYgZXhpdF9jb2RlIGlzIGVpdGhlciAwIG9yIDEuYCxcbiAgICAgICAgICAgIG1zZ19zdGF0ZV91c2VkOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KVRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylgLFxuICAgICAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGBUaGUgZmxhZyByZWZsZWN0cyB3aGV0aGVyIHRoaXMgaGFzIHJlc3VsdGVkIGluIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSBmcm96ZW4sIHVuaW5pdGlhbGl6ZWQgb3Igbm9uLWV4aXN0ZW50IGFjY291bnQuYCxcbiAgICAgICAgICAgIGdhc19mZWVzOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIHRvdGFsIGdhcyBmZWVzIGNvbGxlY3RlZCBieSB0aGUgdmFsaWRhdG9ycyBmb3IgZXhlY3V0aW5nIHRoaXMgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgZ2FzX3VzZWQgYW5kIGdhc19wcmljZSBmcm9tIHRoZSBjdXJyZW50IGJsb2NrIGhlYWRlci5gLFxuICAgICAgICAgICAgZ2FzX3VzZWQ6IGBgLFxuICAgICAgICAgICAgZ2FzX2xpbWl0OiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIGdhcyBsaW1pdCBmb3IgdGhpcyBpbnN0YW5jZSBvZiBUVk0uIEl0IGVxdWFscyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgR3JhbXMgY3JlZGl0ZWQgaW4gdGhlIGNyZWRpdCBwaGFzZSBmcm9tIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGRpdmlkZWQgYnkgdGhlIGN1cnJlbnQgZ2FzIHByaWNlLCBvciB0aGUgZ2xvYmFsIHBlci10cmFuc2FjdGlvbiBnYXMgbGltaXQuYCxcbiAgICAgICAgICAgIGdhc19jcmVkaXQ6IGBUaGlzIHBhcmFtZXRlciBtYXkgYmUgbm9uLXplcm8gb25seSBmb3IgZXh0ZXJuYWwgaW5ib3VuZCBtZXNzYWdlcy4gSXQgaXMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIGFtb3VudCBvZiBnYXMgdGhhdCBjYW4gYmUgcGFpZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2Ugb3IgdGhlIG1heGltdW0gZ2FzIGNyZWRpdGAsXG4gICAgICAgICAgICBtb2RlOiBgYCxcbiAgICAgICAgICAgIGV4aXRfY29kZTogYFRoZXNlIHBhcmFtZXRlciByZXByZXNlbnRzIHRoZSBzdGF0dXMgdmFsdWVzIHJldHVybmVkIGJ5IFRWTTsgZm9yIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgZXhpdF9jb2RlIGhhcyB0byBiZSAwIG9yIDFgLFxuICAgICAgICAgICAgZXhpdF9hcmc6IGBgLFxuICAgICAgICAgICAgdm1fc3RlcHM6IGB0aGUgdG90YWwgbnVtYmVyIG9mIHN0ZXBzIHBlcmZvcm1lZCBieSBUVk0gKHVzdWFsbHkgZXF1YWwgdG8gdHdvIHBsdXMgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMgZXhlY3V0ZWQsIGluY2x1ZGluZyBpbXBsaWNpdCBSRVRzKWAsXG4gICAgICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSByZXN1bHRpbmcgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSBzbWFydCBjb250cmFjdCBoYXMgdGVybWluYXRlZCBzdWNjZXNzZnVsbHkgKHdpdGggZXhpdCBjb2RlIDAgb3IgMSksIHRoZSBhY3Rpb25zIGZyb20gdGhlIGxpc3QgYXJlIHBlcmZvcm1lZC4gSWYgaXQgaXMgaW1wb3NzaWJsZSB0byBwZXJmb3JtIGFsbCBvZiB0aGVt4oCUZm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgaW5zdWZmaWNpZW50IGZ1bmRzIHRvIHRyYW5zZmVyIHdpdGggYW4gb3V0Ym91bmQgbWVzc2FnZeKAlHRoZW4gdGhlIHRyYW5zYWN0aW9uIGlzIGFib3J0ZWQgYW5kIHRoZSBhY2NvdW50IHN0YXRlIGlzIHJvbGxlZCBiYWNrLiBUaGUgdHJhbnNhY3Rpb24gaXMgYWxzbyBhYm9ydGVkIGlmIHRoZSBzbWFydCBjb250cmFjdCBkaWQgbm90IHRlcm1pbmF0ZSBzdWNjZXNzZnVsbHksIG9yIGlmIGl0IHdhcyBub3QgcG9zc2libGUgdG8gaW52b2tlIHRoZSBzbWFydCBjb250cmFjdCBhdCBhbGwgYmVjYXVzZSBpdCBpcyB1bmluaXRpYWxpemVkIG9yIGZyb3plbi5gLFxuICAgICAgICAgICAgc3VjY2VzczogYGAsXG4gICAgICAgICAgICB2YWxpZDogYGAsXG4gICAgICAgICAgICBub19mdW5kczogYFRoZSBmbGFnIGluZGljYXRlcyBhYnNlbmNlIG9mIGZ1bmRzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhbiBvdXRib3VuZCBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBgLFxuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2NvZGU6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2FyZzogYGAsXG4gICAgICAgICAgICB0b3RfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBzcGVjX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIG1zZ3NfY3JlYXRlZDogYGAsXG4gICAgICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBib3VuY2U6IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuIEFsbW9zdCBhbGwgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIGluYm91bmQgbWVzc2FnZSAobWludXMgZ2FzIHBheW1lbnRzIGFuZCBmb3J3YXJkaW5nIGZlZXMpIGlzIHRyYW5zZmVycmVkIHRvIHRoZSBnZW5lcmF0ZWQgbWVzc2FnZSwgd2hpY2ggb3RoZXJ3aXNlIGhhcyBhbiBlbXB0eSBib2R5LmAsXG4gICAgICAgICAgICBib3VuY2VfdHlwZTogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgICAgIHJlcV9md2RfZmVlczogYGAsXG4gICAgICAgICAgICBtc2dfZmVlczogYGAsXG4gICAgICAgICAgICBmd2RfZmVlczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGFib3J0ZWQ6IGBgLFxuICAgICAgICBkZXN0cm95ZWQ6IGBgLFxuICAgICAgICB0dDogYGAsXG4gICAgICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgZmllbGRzIGJlbG93IGNvdmVyIHNwbGl0IHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zIGFuZCBtZXJnZSBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucywgdGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSByZWxldmFudCBzY2hlbWVzIGNvdmVyZWQgYnkgdGhlIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbi5gLFxuICAgICAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IGBsZW5ndGggb2YgdGhlIGN1cnJlbnQgc2hhcmQgcHJlZml4YCxcbiAgICAgICAgICAgIGFjY19zcGxpdF9kZXB0aDogYGAsXG4gICAgICAgICAgICB0aGlzX2FkZHI6IGBgLFxuICAgICAgICAgICAgc2libGluZ19hZGRyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgcHJlcGFyZV90cmFuc2FjdGlvbjogYGAsXG4gICAgICAgIGluc3RhbGxlZDogYGAsXG4gICAgICAgIHByb29mOiBgYCxcbiAgICAgICAgYm9jOiBgYCxcbiAgICB9LFxuXG4gICAgc2hhcmREZXNjcjoge1xuICAgICAgICBfZG9jOiBgU2hhcmRIYXNoZXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBkaWN0aW9uYXJ5IHdpdGggMzItYml0IHdvcmtjaGFpbl9pZHMgYXMga2V5cywgYW5kIOKAnHNoYXJkIGJpbmFyeSB0cmVlc+KAnSwgcmVwcmVzZW50ZWQgYnkgVEwtQiB0eXBlIEJpblRyZWUgU2hhcmREZXNjciwgYXMgdmFsdWVzLiBFYWNoIGxlYWYgb2YgdGhpcyBzaGFyZCBiaW5hcnkgdHJlZSBjb250YWlucyBhIHZhbHVlIG9mIHR5cGUgU2hhcmREZXNjciwgd2hpY2ggZGVzY3JpYmVzIGEgc2luZ2xlIHNoYXJkIGJ5IGluZGljYXRpbmcgdGhlIHNlcXVlbmNlIG51bWJlciBzZXFfbm8sIHRoZSBsb2dpY2FsIHRpbWUgbHQsIGFuZCB0aGUgaGFzaCBoYXNoIG9mIHRoZSBsYXRlc3QgKHNpZ25lZCkgYmxvY2sgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2hhcmRjaGFpbi5gLFxuICAgICAgICBzZXFfbm86IGB1aW50MzIgc2VxdWVuY2UgbnVtYmVyYCxcbiAgICAgICAgcmVnX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgICAgIHN0YXJ0X2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIHN0YXJ0YCxcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIGVuZGAsXG4gICAgICAgIHJvb3RfaGFzaDogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi4gVGhlIHNoYXJkIGJsb2NrIGNvbmZpZ3VyYXRpb24gaXMgZGVyaXZlZCBmcm9tIHRoYXQgYmxvY2suYCxcbiAgICAgICAgZmlsZV9oYXNoOiBgU2hhcmQgYmxvY2sgZmlsZSBoYXNoLmAsXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYFRPTiBCbG9ja2NoYWluIHN1cHBvcnRzIGR5bmFtaWMgc2hhcmRpbmcsIHNvIHRoZSBzaGFyZCBjb25maWd1cmF0aW9uIG1heSBjaGFuZ2UgZnJvbSBibG9jayB0byBibG9jayBiZWNhdXNlIG9mIHNoYXJkIG1lcmdlIGFuZCBzcGxpdCBldmVudHMuIFRoZXJlZm9yZSwgd2UgY2Fubm90IHNpbXBseSBzYXkgdGhhdCBlYWNoIHNoYXJkY2hhaW4gY29ycmVzcG9uZHMgdG8gYSBmaXhlZCBzZXQgb2YgYWNjb3VudCBjaGFpbnMuXG5BIHNoYXJkY2hhaW4gYmxvY2sgYW5kIGl0cyBzdGF0ZSBtYXkgZWFjaCBiZSBjbGFzc2lmaWVkIGludG8gdHdvIGRpc3RpbmN0IHBhcnRzLiBUaGUgcGFydHMgd2l0aCB0aGUgSVNQLWRpY3RhdGVkIGZvcm0gb2Ygd2lsbCBiZSBjYWxsZWQgdGhlIHNwbGl0IHBhcnRzIG9mIHRoZSBibG9jayBhbmQgaXRzIHN0YXRlLCB3aGlsZSB0aGUgcmVtYWluZGVyIHdpbGwgYmUgY2FsbGVkIHRoZSBub24tc3BsaXQgcGFydHMuXG5UaGUgbWFzdGVyY2hhaW4gY2Fubm90IGJlIHNwbGl0IG9yIG1lcmdlZC5gLFxuICAgICAgICBiZWZvcmVfbWVyZ2U6IGBgLFxuICAgICAgICB3YW50X3NwbGl0OiBgYCxcbiAgICAgICAgd2FudF9tZXJnZTogYGAsXG4gICAgICAgIG54X2NjX3VwZGF0ZWQ6IGBgLFxuICAgICAgICBmbGFnczogYGAsXG4gICAgICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYGAsXG4gICAgICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBgLFxuICAgICAgICBnZW5fdXRpbWU6IGBHZW5lcmF0aW9uIHRpbWUgaW4gdWludDMyYCxcbiAgICAgICAgc3BsaXRfdHlwZTogYGAsXG4gICAgICAgIHNwbGl0OiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGBBbW91bnQgb2YgZmVlcyBjb2xsZWN0ZWQgaW50IGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZDogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgICAgICBfZG9jOiAnVGhpcyBpcyBCbG9jaycsXG4gICAgICAgIHN0YXR1czogYFJldHVybnMgYmxvY2sgcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgICAgICBnbG9iYWxfaWQ6IGB1aW50MzIgZ2xvYmFsIGJsb2NrIElEYCxcbiAgICAgICAgd2FudF9zcGxpdDogYGAsXG4gICAgICAgIHNlcV9ubzogYGAsXG4gICAgICAgIGFmdGVyX21lcmdlOiBgYCxcbiAgICAgICAgZ2VuX3V0aW1lOiBgdWludCAzMiBnZW5lcmF0aW9uIHRpbWUgc3RhbXBgLFxuICAgICAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBmbGFnczogYGAsXG4gICAgICAgIG1hc3Rlcl9yZWY6IGBgLFxuICAgICAgICBwcmV2X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgcHJldl9hbHRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHNoYXJkIG1lcmdlLmAsXG4gICAgICAgIHByZXZfdmVydF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2YgdmVydGljYWwgYmxvY2tzLmAsXG4gICAgICAgIHByZXZfdmVydF9hbHRfcmVmOiBgYCxcbiAgICAgICAgdmVyc2lvbjogYHVpbjMyIGJsb2NrIHZlcnNpb24gaWRlbnRpZmllcmAsXG4gICAgICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcbiAgICAgICAgYmVmb3JlX3NwbGl0OiBgYCxcbiAgICAgICAgYWZ0ZXJfc3BsaXQ6IGBgLFxuICAgICAgICB3YW50X21lcmdlOiBgYCxcbiAgICAgICAgdmVydF9zZXFfbm86IGBgLFxuICAgICAgICBzdGFydF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIHN0YXJ0LlxuTG9naWNhbCB0aW1lIGlzIGEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uYCxcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gZW5kLmAsXG4gICAgICAgIHdvcmtjaGFpbl9pZDogYHVpbnQzMiB3b3JrY2hhaW4gaWRlbnRpZmllcmAsXG4gICAgICAgIHNoYXJkOiBgYCxcbiAgICAgICAgbWluX3JlZl9tY19zZXFubzogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi5gLFxuICAgICAgICBwcmV2X2tleV9ibG9ja19zZXFubzogYFJldHVybnMgYSBudW1iZXIgb2YgYSBwcmV2aW91cyBrZXkgYmxvY2suYCxcbiAgICAgICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IGBgLFxuICAgICAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBgYCxcbiAgICAgICAgdmFsdWVfZmxvdzoge1xuICAgICAgICAgICAgdG9fbmV4dF9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgYW1vdW50IHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgICAgICBleHBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBleHBvcnRlZC5gLFxuICAgICAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBleHBvcnRlZC5gLFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGBgLFxuICAgICAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IGBgLFxuICAgICAgICAgICAgY3JlYXRlZDogYGAsXG4gICAgICAgICAgICBjcmVhdGVkX290aGVyOiBgYCxcbiAgICAgICAgICAgIGltcG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGltcG9ydGVkLmAsXG4gICAgICAgICAgICBpbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGltcG9ydGVkLmAsXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrOiBgQW1vdW50IG9mIGdyYW1zIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgICAgICBtaW50ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgbWludGVkIGluIHRoaXMgYmxvY2suYCxcbiAgICAgICAgICAgIG1pbnRlZF9vdGhlcjogYGAsXG4gICAgICAgICAgICBmZWVzX2ltcG9ydGVkOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIGdyYW1zYCxcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgICAgICB9LFxuICAgICAgICBpbl9tc2dfZGVzY3I6IGBgLFxuICAgICAgICByYW5kX3NlZWQ6IGBgLFxuICAgICAgICBvdXRfbXNnX2Rlc2NyOiBgYCxcbiAgICAgICAgYWNjb3VudF9ibG9ja3M6IHtcbiAgICAgICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgICAgICB0cmFuc2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICAgICAgb2xkX2hhc2g6IGBvbGQgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgLFxuICAgICAgICAgICAgICAgIG5ld19oYXNoOiBgbmV3IHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRyX2NvdW50OiBgYFxuICAgICAgICB9LFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG5ldzogYGAsXG4gICAgICAgICAgICBuZXdfaGFzaDogYGAsXG4gICAgICAgICAgICBuZXdfZGVwdGg6IGBgLFxuICAgICAgICAgICAgb2xkOiBgYCxcbiAgICAgICAgICAgIG9sZF9oYXNoOiBgYCxcbiAgICAgICAgICAgIG9sZF9kZXB0aDogYGBcbiAgICAgICAgfSxcbiAgICAgICAgbWFzdGVyOiB7XG4gICAgICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiAnTWluIGJsb2NrIGdlbmVyYXRpb24gdGltZSBvZiBzaGFyZHMnLFxuICAgICAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogJ01heCBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcbiAgICAgICAgICAgIHNoYXJkX2hhc2hlczoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBzaGFyZCBoYXNoZXNgLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYFVpbnQzMiB3b3JrY2hhaW4gSURgLFxuICAgICAgICAgICAgICAgIHNoYXJkOiBgU2hhcmQgSURgLFxuICAgICAgICAgICAgICAgIGRlc2NyOiBgU2hhcmQgZGVzY3JpcHRpb25gLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNoYXJkX2ZlZXM6IHtcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkOiBgYCxcbiAgICAgICAgICAgICAgICBmZWVzOiBgQW1vdW50IG9mIGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgICAgIGZlZXNfb3RoZXI6IGBBcnJheSBvZiBmZWVzIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzYCxcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGBBbW91bnQgb2YgZmVlcyBjcmVhdGVkIGR1cmluZyBzaGFyZGAsXG4gICAgICAgICAgICAgICAgY3JlYXRlX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGZlZXMgY3JlYXRlZCBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llcyBkdXJpbmcgdGhlIGJsb2NrLmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBgYCxcbiAgICAgICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgcHJldmlvdXMgYmxvY2sgc2lnbmF0dXJlc2AsXG4gICAgICAgICAgICAgICAgbm9kZV9pZDogYGAsXG4gICAgICAgICAgICAgICAgcjogYGAsXG4gICAgICAgICAgICAgICAgczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29uZmlnX2FkZHI6IGBgLFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgcDA6IGBBZGRyZXNzIG9mIGNvbmZpZyBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAxOiBgQWRkcmVzcyBvZiBlbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDI6IGBBZGRyZXNzIG9mIG1pbnRlciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAzOiBgQWRkcmVzcyBvZiBmZWUgY29sbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDQ6IGBBZGRyZXNzIG9mIFRPTiBETlMgcm9vdCBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA2YCxcbiAgICAgICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwNzoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgN2AsXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEdsb2JhbCB2ZXJzaW9uYCxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwOTogYE1hbmRhdG9yeSBwYXJhbXNgLFxuICAgICAgICAgICAgICAgIHAxMDogYENyaXRpY2FsIHBhcmFtc2AsXG4gICAgICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWcgdm90aW5nIHNldHVwYCxcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNyaXRpY2FsX3BhcmFtczogYGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBwMTI6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIGFsbCB3b3JrY2hhaW5zIGRlc2NyaXB0aW9uc2AsXG4gICAgICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGBgLFxuICAgICAgICAgICAgICAgICAgICBmbGFnczogYGAsXG4gICAgICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGJhc2ljOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBCbG9jayBjcmVhdGUgZmVlc2AsXG4gICAgICAgICAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9ycyBjb3VudGAsXG4gICAgICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9yIHN0YWtlIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiBgYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDE4OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBTdG9yYWdlIHByaWNlc2AsXG4gICAgICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDIxOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgICAgIHAyMjogYEJsb2NrIGxpbWl0cyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgICAgICBwMjQ6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICAgICAgcDI1OiBgTWVzc2FnZSBmb3J3YXJkIHByaWNlcyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENhdGNoYWluIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25zZW5zdXMgY29uZmlnYCxcbiAgICAgICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXG4gICAgICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IGBgLFxuICAgICAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogYGAsXG4gICAgICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBgYFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXG4gICAgICAgICAgICAgICAgcDMyOiBgUHJldmlvdXMgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzMzogYFByZXZpb3VzIHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgICAgIHAzNTogYEN1cnJlbnQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM2OiBgTmV4dCB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgICAgICBwMzk6IHtcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHZhbGlkYXRvciBzaWduZWQgdGVtcHJvcmFyeSBrZXlzYCxcbiAgICAgICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2Vxbm86IGBgLFxuICAgICAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXG4gICAgICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBgYCxcbiAgICAgICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IGBgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGtleV9ibG9jazogJ3RydWUgaWYgdGhpcyBibG9jayBpcyBhIGtleSBibG9jaycsXG4gICAgICAgIGJvYzogJ1NlcmlhbGl6ZWQgYmFnIG9mIGNlbGwgb2YgdGhpcyBibG9jayBlbmNvZGVkIHdpdGggYmFzZTY0JyxcbiAgICAgICAgYmFsYW5jZV9kZWx0YTogJ0FjY291bnQgYmFsYW5jZSBjaGFuZ2UgYWZ0ZXIgdHJhbnNhY3Rpb24nLFxuICAgIH0sXG5cbiAgICBibG9ja1NpZ25hdHVyZXM6IHtcbiAgICAgICAgX2RvYzogYFNldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWRgLFxuICAgICAgICBnZW5fdXRpbWU6IGBTaWduZWQgYmxvY2sncyBnZW5fdXRpbWVgLFxuICAgICAgICBzZXFfbm86IGBTaWduZWQgYmxvY2sncyBzZXFfbm9gLFxuICAgICAgICBzaGFyZDogYFNpZ25lZCBibG9jaydzIHNoYXJkYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgU2lnbmVkIGJsb2NrJ3Mgd29ya2NoYWluX2lkYCxcbiAgICAgICAgcHJvb2Y6IGBTaWduZWQgYmxvY2sncyBtZXJrbGUgcHJvb2ZgLFxuICAgICAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcbiAgICAgICAgY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBzaWdfd2VpZ2h0OiBgYCxcbiAgICAgICAgc2lnbmF0dXJlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNgLFxuICAgICAgICAgICAgbm9kZV9pZDogYFZhbGlkYXRvciBJRGAsXG4gICAgICAgICAgICByOiBgJ1InIHBhcnQgb2Ygc2lnbmF0dXJlYCxcbiAgICAgICAgICAgIHM6IGAncycgcGFydCBvZiBzaWduYXR1cmVgLFxuICAgICAgICB9XG4gICAgfVxuXG59O1xuIl19