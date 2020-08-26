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
  }
};
exports.docs = docs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwicHJvb2YiLCJib2MiLCJzdGF0ZV9oYXNoIiwibWVzc2FnZSIsIm1zZ190eXBlIiwic3RhdHVzIiwiYmxvY2tfaWQiLCJib2R5IiwiYm9keV9oYXNoIiwic3JjIiwiZHN0Iiwic3JjX3dvcmtjaGFpbl9pZCIsImRzdF93b3JrY2hhaW5faWQiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwidHJhbnNhY3Rpb24iLCJfIiwiY29sbGVjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJzaGFyZERlc2NyIiwic2VxX25vIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXQiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsInNoYXJkIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJnZW5fc29mdHdhcmVfdmVyc2lvbiIsImdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXMiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwiY3JlYXRlZF9ieSIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwibmV3IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwibWFzdGVyIiwibWluX3NoYXJkX2dlbl91dGltZSIsIm1heF9zaGFyZF9nZW5fdXRpbWUiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJjYXBhYmlsaXRpZXMiLCJwOSIsInAxMCIsInAxMSIsIm5vcm1hbF9wYXJhbXMiLCJjcml0aWNhbF9wYXJhbXMiLCJwMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwicDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsInAxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsInAxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwicDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsInAxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiLCJrZXlfYmxvY2siLCJiYWxhbmNlX2RlbHRhIiwiYmxvY2tTaWduYXR1cmVzIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ08sTUFBTUEsSUFBSSxHQUFHO0FBQ2hCQyxFQUFBQSxPQUFPLEVBQUU7QUFDTEMsSUFBQUEsSUFBSSxFQUFHOzs7Ozs7Ozs7Ozs7WUFERjtBQWNMQyxJQUFBQSxFQUFFLEVBQUcsRUFkQTtBQWVMQyxJQUFBQSxZQUFZLEVBQUcsaURBZlY7QUFnQkxDLElBQUFBLFFBQVEsRUFBRzs7Ozs7Ozs7O1NBaEJOO0FBMEJMQyxJQUFBQSxTQUFTLEVBQUc7Ozs7Ozs7Ozs7Ozs7aUJBMUJQO0FBd0NMQyxJQUFBQSxXQUFXLEVBQUc7Ozs7Ozs7Ozs7U0F4Q1Q7QUFtRExDLElBQUFBLGFBQWEsRUFBRyxHQW5EWDtBQW9ETEMsSUFBQUEsT0FBTyxFQUFHOzs7Ozs7OztTQXBETDtBQTZETEMsSUFBQUEsYUFBYSxFQUFHLEdBN0RYO0FBOERMQyxJQUFBQSxXQUFXLEVBQUcscUVBOURUO0FBK0RMQyxJ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LEdBQUcsRUFBRyxnQ0FoSEY7QUFpSEpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEMVIsVUFBQUEsSUFBSSxFQUFHLDJDQUROO0FBRUQyUixVQUFBQSxTQUFTLEVBQUcsRUFGWDtBQUdEQyxVQUFBQSxlQUFlLEVBQUcsRUFIakI7QUFJREMsVUFBQUEsS0FBSyxFQUFHLEVBSlA7QUFLREMsVUFBQUEsV0FBVyxFQUFHLEVBTGI7QUFNREMsVUFBQUEsV0FBVyxFQUFHLEVBTmI7QUFPREMsVUFBQUEsV0FBVyxFQUFHO0FBUGI7QUFqSEQ7QUF6QkosS0FyRUw7QUEwTkhDLElBQUFBLFNBQVMsRUFBRSxtQ0ExTlI7QUEyTkg5USxJQUFBQSxHQUFHLEVBQUUsMERBM05GO0FBNE5IK1EsSUFBQUEsYUFBYSxFQUFFO0FBNU5aLEdBdFFTO0FBcWVoQkMsRUFBQUEsZUFBZSxFQUFFO0FBQ2JuUyxJQUFBQSxJQUFJLEVBQUcsaUVBRE07QUFFYm1JLElBQUFBLFNBQVMsRUFBRywwQkFGQztBQUdiZixJQUFBQSxNQUFNLEVBQUcsdUJBSEk7QUFJYm1DLElBQUFBLEtBQUssRUFBRyxzQkFKSztBQUtickosSUFBQUEsWUFBWSxFQUFHLDZCQUxGO0FBTWJnQixJQUFBQSxLQUFLLEVBQUcsNkJBTks7QUFPYmtSLElBQUFBLHlCQUF5QixFQUFHLEVBUGY7QUFRYkMsSUFBQUEsY0FBYyxFQUFHLEVBUko7QUFTYkMsSUFBQUEsVUFBVSxFQUFHLEVBVEE7QUFVYkMsSUFBQUEsVUFBVSxFQUFFO0FBQ1J2UyxNQUFBQSxJQUFJLEVBQUcsNkNBREM7QUFFUmtNLE1BQUFBLE9BQU8sRUFBRyxjQUZGO0FBR1JDLE1BQUFBLENBQUMsRUFBRyx1QkFISTtBQUlSQyxNQUFBQSxDQUFDLEVBQUc7QUFKSTtBQVZDO0FBcmVELENBQWIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L3ByZWZlci1kZWZhdWx0LWV4cG9ydFxyXG5leHBvcnQgY29uc3QgZG9jcyA9IHtcclxuICAgIGFjY291bnQ6IHtcclxuICAgICAgICBfZG9jOiBgXHJcbiMgQWNjb3VudCB0eXBlXHJcblxyXG5SZWNhbGwgdGhhdCBhIHNtYXJ0IGNvbnRyYWN0IGFuZCBhbiBhY2NvdW50IGFyZSB0aGUgc2FtZSB0aGluZyBpbiB0aGUgY29udGV4dFxyXG5vZiB0aGUgVE9OIEJsb2NrY2hhaW4sIGFuZCB0aGF0IHRoZXNlIHRlcm1zIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSwgYXRcclxubGVhc3QgYXMgbG9uZyBhcyBvbmx5IHNtYWxsIChvciDigJx1c3VhbOKAnSkgc21hcnQgY29udHJhY3RzIGFyZSBjb25zaWRlcmVkLiBBIGxhcmdlXHJcbnNtYXJ0LWNvbnRyYWN0IG1heSBlbXBsb3kgc2V2ZXJhbCBhY2NvdW50cyBseWluZyBpbiBkaWZmZXJlbnQgc2hhcmRjaGFpbnMgb2ZcclxudGhlIHNhbWUgd29ya2NoYWluIGZvciBsb2FkIGJhbGFuY2luZyBwdXJwb3Nlcy5cclxuXHJcbkFuIGFjY291bnQgaXMgaWRlbnRpZmllZCBieSBpdHMgZnVsbCBhZGRyZXNzIGFuZCBpcyBjb21wbGV0ZWx5IGRlc2NyaWJlZCBieVxyXG5pdHMgc3RhdGUuIEluIG90aGVyIHdvcmRzLCB0aGVyZSBpcyBub3RoaW5nIGVsc2UgaW4gYW4gYWNjb3VudCBhcGFydCBmcm9tIGl0c1xyXG5hZGRyZXNzIGFuZCBzdGF0ZS5cclxuICAgICAgICAgICBgLFxyXG4gICAgICAgIGlkOiBgYCxcclxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoaWQgZmllbGQpLmAsXHJcbiAgICAgICAgYWNjX3R5cGU6IGBSZXR1cm5zIHRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgYWNjb3VudC5cclxuXFxgXFxgXFxgXHJcbntcclxuICBhY2NvdW50cyhmaWx0ZXI6IHthY2NfdHlwZTp7ZXE6MX19KXtcclxuICAgIGlkXHJcbiAgICBhY2NfdHlwZVxyXG4gIH1cclxufVxyXG5cXGBcXGBcXGBcclxuICAgICAgICBgLFxyXG4gICAgICAgIGxhc3RfcGFpZDogYFxyXG5Db250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnRcclxuY29sbGVjdGVkICh1c3VhbGx5IHRoaXMgaXMgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCB0cmFuc2FjdGlvbiksXHJcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXHJcblxcYFxcYFxcYFxyXG5xdWVyeXtcclxuICBhY2NvdW50cyhmaWx0ZXI6IHtcclxuICAgIGxhc3RfcGFpZDp7Z2U6MTU2NzI5NjAwMH1cclxuICB9KSB7XHJcbiAgaWRcclxuICBsYXN0X3BhaWR9XHJcbn1cclxuXFxgXFxgXFxgICAgICBcclxuICAgICAgICAgICAgICAgIGAsXHJcbiAgICAgICAgZHVlX3BheW1lbnQ6IGBcclxuSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjLSBjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuXHJcblxcYFxcYFxcYFxyXG57XHJcbiAgYWNjb3VudHMoZmlsdGVyOiB7IGR1ZV9wYXltZW50OiB7IG5lOiBudWxsIH0gfSlcclxuICAgIHtcclxuICAgICAgaWRcclxuICAgIH1cclxufVxyXG5cXGBcXGBcXGBcclxuICAgICAgICBgLFxyXG4gICAgICAgIGxhc3RfdHJhbnNfbHQ6IGAgYCxcclxuICAgICAgICBiYWxhbmNlOiBgXHJcblxcYFxcYFxcYFxyXG57XHJcbiAgYWNjb3VudHMob3JkZXJCeTp7cGF0aDpcImJhbGFuY2VcIixkaXJlY3Rpb246REVTQ30pe1xyXG4gICAgYmFsYW5jZVxyXG4gIH1cclxufVxyXG5cXGBcXGBcXGBcclxuICAgICAgICBgLFxyXG4gICAgICAgIGJhbGFuY2Vfb3RoZXI6IGAgYCxcclxuICAgICAgICBzcGxpdF9kZXB0aDogYElzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy5gLFxyXG4gICAgICAgIHRpY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLmAsXHJcbiAgICAgICAgdG9jazogYE1heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uXHJcblxcYFxcYFxcYCAgICAgICAgXHJcbntcclxuICBhY2NvdW50cyAoZmlsdGVyOnt0b2NrOntuZTpudWxsfX0pe1xyXG4gICAgaWRcclxuICAgIHRvY2tcclxuICAgIHRpY2tcclxuICB9XHJcbn1cclxuXFxgXFxgXFxgXHJcbiAgICAgICAgYCxcclxuICAgICAgICBjb2RlOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LlxyXG5cXGBcXGBcXGAgIFxyXG57XHJcbiAgYWNjb3VudHMgKGZpbHRlcjp7Y29kZTp7ZXE6bnVsbH19KXtcclxuICAgIGlkXHJcbiAgICBhY2NfdHlwZVxyXG4gIH1cclxufSAgIFxyXG5cXGBcXGBcXGAgICAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgYCxcclxuICAgICAgICBjb2RlX2hhc2g6IGBcXGBjb2RlXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxyXG4gICAgICAgIGRhdGE6IGBJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBkYXRhIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQuYCxcclxuICAgICAgICBkYXRhX2hhc2g6IGBcXGBkYXRhXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxyXG4gICAgICAgIGxpYnJhcnk6IGBJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdC5gLFxyXG4gICAgICAgIGxpYnJhcnlfaGFzaDogYFxcYGxpYnJhcnlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXHJcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcclxuICAgICAgICBib2M6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgYWNjb3VudCBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcclxuICAgICAgICBzdGF0ZV9oYXNoOiBgQ29udGFpbnMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2ggb2YgYW4gaW5zdGFuY2Ugb2YgXFxgU3RhdGVJbml0XFxgIHdoZW4gYW4gYWNjb3VudCBpcyBmcm96ZW4uYCxcclxuICAgIH0sXHJcbiAgICBtZXNzYWdlOiB7XHJcbiAgICAgICAgX2RvYzogYCMgTWVzc2FnZSB0eXBlXHJcblxyXG4gICAgICAgICAgIE1lc3NhZ2UgbGF5b3V0IHF1ZXJpZXMuICBBIG1lc3NhZ2UgY29uc2lzdHMgb2YgaXRzIGhlYWRlciBmb2xsb3dlZCBieSBpdHNcclxuICAgICAgICAgICBib2R5IG9yIHBheWxvYWQuIFRoZSBib2R5IGlzIGVzc2VudGlhbGx5IGFyYml0cmFyeSwgdG8gYmUgaW50ZXJwcmV0ZWQgYnkgdGhlXHJcbiAgICAgICAgICAgZGVzdGluYXRpb24gc21hcnQgY29udHJhY3QuIEl0IGNhbiBiZSBxdWVyaWVkIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6YCxcclxuICAgICAgICBtc2dfdHlwZTogYFJldHVybnMgdGhlIHR5cGUgb2YgbWVzc2FnZS5gLFxyXG4gICAgICAgIHN0YXR1czogYFJldHVybnMgaW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMgYWNjb3JkaW5nIHRvIHRoZSBudW1iZXJzIHNob3duLmAsXHJcbiAgICAgICAgYmxvY2tfaWQ6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcclxuICAgICAgICBib2R5OiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2UgYm9keSBlbmNvZGVkIGFzIGJhc2U2NC5gLFxyXG4gICAgICAgIGJvZHlfaGFzaDogYFxcYGJvZHlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXHJcbiAgICAgICAgc3BsaXRfZGVwdGg6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzLmAsXHJcbiAgICAgICAgdGljazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcclxuICAgICAgICB0b2NrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlc2AsXHJcbiAgICAgICAgY29kZTogYFJlcHJlc2VudHMgY29udHJhY3QgY29kZSBpbiBkZXBsb3kgbWVzc2FnZXMuYCxcclxuICAgICAgICBjb2RlX2hhc2g6IGBcXGBjb2RlXFxgIGZpZWxkIHJvb3QgaGFzaC5gLFxyXG4gICAgICAgIGRhdGE6IGBSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXNgLFxyXG4gICAgICAgIGRhdGFfaGFzaDogYFxcYGRhdGFcXGAgZmllbGQgcm9vdCBoYXNoLmAsXHJcbiAgICAgICAgbGlicmFyeTogYFJlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXNgLFxyXG4gICAgICAgIGxpYnJhcnlfaGFzaDogYFxcYGxpYnJhcnlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXHJcbiAgICAgICAgc3JjOiBgUmV0dXJucyBzb3VyY2UgYWRkcmVzcyBzdHJpbmdgLFxyXG4gICAgICAgIGRzdDogYFJldHVybnMgZGVzdGluYXRpb24gYWRkcmVzcyBzdHJpbmdgLFxyXG4gICAgICAgIHNyY193b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIHNvdXJjZSBhZGRyZXNzIChzcmMgZmllbGQpYCxcclxuICAgICAgICBkc3Rfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChkc3QgZmllbGQpYCxcclxuICAgICAgICBjcmVhdGVkX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXHJcbiAgICAgICAgY3JlYXRlZF9hdDogYENyZWF0aW9uIHVuaXh0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLiBUaGUgY3JlYXRpb24gdW5peHRpbWUgZXF1YWxzIHRoZSBjcmVhdGlvbiB1bml4dGltZSBvZiB0aGUgYmxvY2sgY29udGFpbmluZyB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxyXG4gICAgICAgIGlocl9kaXNhYmxlZDogYElIUiBpcyBkaXNhYmxlZCBmb3IgdGhlIG1lc3NhZ2UuYCxcclxuICAgICAgICBpaHJfZmVlOiBgVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS5gLFxyXG4gICAgICAgIGZ3ZF9mZWU6IGBPcmlnaW5hbCB0b3RhbCBmb3J3YXJkaW5nIGZlZSBwYWlkIGZvciB1c2luZyB0aGUgSFIgbWVjaGFuaXNtOyBpdCBpcyBhdXRvbWF0aWNhbGx5IGNvbXB1dGVkIGZyb20gc29tZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgYW5kIHRoZSBzaXplIG9mIHRoZSBtZXNzYWdlIGF0IHRoZSB0aW1lIHRoZSBtZXNzYWdlIGlzIGdlbmVyYXRlZC5gLFxyXG4gICAgICAgIGltcG9ydF9mZWU6IGBgLFxyXG4gICAgICAgIGJvdW5jZTogYEJvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcclxuICAgICAgICBib3VuY2VkOiBgQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcclxuICAgICAgICB2YWx1ZTogYE1heSBvciBtYXkgbm90IGJlIHByZXNlbnRgLFxyXG4gICAgICAgIHZhbHVlX290aGVyOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudC5gLFxyXG4gICAgICAgIHByb29mOiBgTWVya2xlIHByb29mIHRoYXQgbWVzc2FnZSBpcyBhIHBhcnQgb2YgYSBibG9jayBpdCBjdXQgZnJvbS4gSXQgaXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXHJcbiAgICAgICAgYm9jOiBgQSBiYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBzdHJ1Y3R1cmUgZW5jb2RlZCBhcyBiYXNlNjQuYFxyXG4gICAgfSxcclxuXHJcblxyXG4gICAgdHJhbnNhY3Rpb246IHtcclxuICAgICAgICBfZG9jOiAnVE9OIFRyYW5zYWN0aW9uJyxcclxuICAgICAgICBfOiB7IGNvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnIH0sXHJcbiAgICAgICAgdHJfdHlwZTogYFRyYW5zYWN0aW9uIHR5cGUgYWNjb3JkaW5nIHRvIHRoZSBvcmlnaW5hbCBibG9ja2NoYWluIHNwZWNpZmljYXRpb24sIGNsYXVzZSA0LjIuNC5gLFxyXG4gICAgICAgIHN0YXR1czogYFRyYW5zYWN0aW9uIHByb2Nlc3Npbmcgc3RhdHVzYCxcclxuICAgICAgICBibG9ja19pZDogYGAsXHJcbiAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcclxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoYWNjb3VudF9hZGRyIGZpZWxkKWAsXHJcbiAgICAgICAgbHQ6IGBMb2dpY2FsIHRpbWUuIEEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIFt0aGUgVE9OIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly90ZXN0LnRvbi5vcmcvdGJsa2NoLnBkZikuYCxcclxuICAgICAgICBwcmV2X3RyYW5zX2hhc2g6IGBgLFxyXG4gICAgICAgIHByZXZfdHJhbnNfbHQ6IGBgLFxyXG4gICAgICAgIG5vdzogYGAsXHJcbiAgICAgICAgb3V0bXNnX2NudDogYFRoZSBudW1iZXIgb2YgZ2VuZXJhdGVkIG91dGJvdW5kIG1lc3NhZ2VzIChvbmUgb2YgdGhlIGNvbW1vbiB0cmFuc2FjdGlvbiBwYXJhbWV0ZXJzIGRlZmluZWQgYnkgdGhlIHNwZWNpZmljYXRpb24pYCxcclxuICAgICAgICBvcmlnX3N0YXR1czogYFRoZSBpbml0aWFsIHN0YXRlIG9mIGFjY291bnQuIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgdGhlIHF1ZXJ5IG1heSByZXR1cm4gMCwgaWYgdGhlIGFjY291bnQgd2FzIG5vdCBhY3RpdmUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbiBhbmQgMSBpZiBpdCB3YXMgYWxyZWFkeSBhY3RpdmVgLFxyXG4gICAgICAgIGVuZF9zdGF0dXM6IGBUaGUgZW5kIHN0YXRlIG9mIGFuIGFjY291bnQgYWZ0ZXIgYSB0cmFuc2FjdGlvbiwgMSBpcyByZXR1cm5lZCB0byBpbmRpY2F0ZSBhIGZpbmFsaXplZCB0cmFuc2FjdGlvbiBhdCBhbiBhY3RpdmUgYWNjb3VudGAsXHJcbiAgICAgICAgaW5fbXNnOiBgYCxcclxuICAgICAgICBpbl9tZXNzYWdlOiBgYCxcclxuICAgICAgICBvdXRfbXNnczogYERpY3Rpb25hcnkgb2YgdHJhbnNhY3Rpb24gb3V0Ym91bmQgbWVzc2FnZXMgYXMgc3BlY2lmaWVkIGluIHRoZSBzcGVjaWZpY2F0aW9uYCxcclxuICAgICAgICBvdXRfbWVzc2FnZXM6IGBgLFxyXG4gICAgICAgIHRvdGFsX2ZlZXM6IGBUb3RhbCBhbW91bnQgb2YgZmVlcyB0aGF0IGVudGFpbHMgYWNjb3VudCBzdGF0ZSBjaGFuZ2UgYW5kIHVzZWQgaW4gTWVya2xlIHVwZGF0ZWAsXHJcbiAgICAgICAgdG90YWxfZmVlc19vdGhlcjogYFNhbWUgYXMgYWJvdmUsIGJ1dCByZXNlcnZlZCBmb3Igbm9uIGdyYW0gY29pbnMgdGhhdCBtYXkgYXBwZWFyIGluIHRoZSBibG9ja2NoYWluYCxcclxuICAgICAgICBvbGRfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxyXG4gICAgICAgIG5ld19oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXHJcbiAgICAgICAgY3JlZGl0X2ZpcnN0OiBgYCxcclxuICAgICAgICBzdG9yYWdlOiB7XHJcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGBUaGlzIGZpZWxkIGRlZmluZXMgdGhlIGFtb3VudCBvZiBzdG9yYWdlIGZlZXMgY29sbGVjdGVkIGluIGdyYW1zLmAsXHJcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGBUaGlzIGZpZWxkIHJlcHJlc2VudHMgdGhlIGFtb3VudCBvZiBkdWUgZmVlcyBpbiBncmFtcywgaXQgbWlnaHQgYmUgZW1wdHkuYCxcclxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyBhY2NvdW50IHN0YXR1cyBjaGFuZ2UgYWZ0ZXIgdGhlIHRyYW5zYWN0aW9uIGlzIGNvbXBsZXRlZC5gLFxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIGNyZWRpdDoge1xyXG4gICAgICAgICAgICBfZG9jOiBgVGhlIGFjY291bnQgaXMgY3JlZGl0ZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSByZWNlaXZlZC4gVGhlIGNyZWRpdCBwaGFzZSBjYW4gcmVzdWx0IGluIHRoZSBjb2xsZWN0aW9uIG9mIHNvbWUgZHVlIHBheW1lbnRzYCxcclxuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBgVGhlIHN1bSBvZiBkdWVfZmVlc19jb2xsZWN0ZWQgYW5kIGNyZWRpdCBtdXN0IGVxdWFsIHRoZSB2YWx1ZSBvZiB0aGUgbWVzc2FnZSByZWNlaXZlZCwgcGx1cyBpdHMgaWhyX2ZlZSBpZiB0aGUgbWVzc2FnZSBoYXMgbm90IGJlZW4gcmVjZWl2ZWQgdmlhIEluc3RhbnQgSHlwZXJjdWJlIFJvdXRpbmcsIElIUiAob3RoZXJ3aXNlIHRoZSBpaHJfZmVlIGlzIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMpLmAsXHJcbiAgICAgICAgICAgIGNyZWRpdDogYGAsXHJcbiAgICAgICAgICAgIGNyZWRpdF9vdGhlcjogYGAsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb21wdXRlOiB7XHJcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgY29kZSBvZiB0aGUgc21hcnQgY29udHJhY3QgaXMgaW52b2tlZCBpbnNpZGUgYW4gaW5zdGFuY2Ugb2YgVFZNIHdpdGggYWRlcXVhdGUgcGFyYW1ldGVycywgaW5jbHVkaW5nIGEgY29weSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGFuZCBvZiB0aGUgcGVyc2lzdGVudCBkYXRhLCBhbmQgdGVybWluYXRlcyB3aXRoIGFuIGV4aXQgY29kZSwgdGhlIG5ldyBwZXJzaXN0ZW50IGRhdGEsIGFuZCBhbiBhY3Rpb24gbGlzdCAod2hpY2ggaW5jbHVkZXMsIGZvciBpbnN0YW5jZSwgb3V0Ym91bmQgbWVzc2FnZXMgdG8gYmUgc2VudCkuIFRoZSBwcm9jZXNzaW5nIHBoYXNlIG1heSBsZWFkIHRvIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBhY2NvdW50ICh1bmluaXRpYWxpemVkIG9yIGFjdGl2ZSksIG9yIHRvIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50LiBUaGUgZ2FzIHBheW1lbnQsIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIHRoZSBnYXMgcHJpY2UgYW5kIHRoZSBnYXMgY29uc3VtZWQsIGlzIGV4YWN0ZWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlLlxyXG5JZiB0aGVyZSBpcyBubyByZWFzb24gdG8gc2tpcCB0aGUgY29tcHV0aW5nIHBoYXNlLCBUVk0gaXMgaW52b2tlZCBhbmQgdGhlIHJlc3VsdHMgb2YgdGhlIGNvbXB1dGF0aW9uIGFyZSBsb2dnZWQuIFBvc3NpYmxlIHBhcmFtZXRlcnMgYXJlIGNvdmVyZWQgYmVsb3cuYCxcclxuICAgICAgICAgICAgY29tcHV0ZV90eXBlOiBgYCxcclxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb246IGBSZWFzb24gZm9yIHNraXBwaW5nIHRoZSBjb21wdXRlIHBoYXNlLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24sIHRoZSBwaGFzZSBjYW4gYmUgc2tpcHBlZCBkdWUgdG8gdGhlIGFic2VuY2Ugb2YgZnVuZHMgdG8gYnV5IGdhcywgYWJzZW5jZSBvZiBzdGF0ZSBvZiBhbiBhY2NvdW50IG9yIGEgbWVzc2FnZSwgZmFpbHVyZSB0byBwcm92aWRlIGEgdmFsaWQgc3RhdGUgaW4gdGhlIG1lc3NhZ2VgLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBgVGhpcyBmbGFnIGlzIHNldCBpZiBhbmQgb25seSBpZiBleGl0X2NvZGUgaXMgZWl0aGVyIDAgb3IgMS5gLFxyXG4gICAgICAgICAgICBtc2dfc3RhdGVfdXNlZDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpYCxcclxuICAgICAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGBUaGUgZmxhZyByZWZsZWN0cyB3aGV0aGVyIHRoaXMgaGFzIHJlc3VsdGVkIGluIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSBmcm96ZW4sIHVuaW5pdGlhbGl6ZWQgb3Igbm9uLWV4aXN0ZW50IGFjY291bnQuYCxcclxuICAgICAgICAgICAgZ2FzX2ZlZXM6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB0aGUgdG90YWwgZ2FzIGZlZXMgY29sbGVjdGVkIGJ5IHRoZSB2YWxpZGF0b3JzIGZvciBleGVjdXRpbmcgdGhpcyB0cmFuc2FjdGlvbi4gSXQgbXVzdCBiZSBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiBnYXNfdXNlZCBhbmQgZ2FzX3ByaWNlIGZyb20gdGhlIGN1cnJlbnQgYmxvY2sgaGVhZGVyLmAsXHJcbiAgICAgICAgICAgIGdhc191c2VkOiBgYCxcclxuICAgICAgICAgICAgZ2FzX2xpbWl0OiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIGdhcyBsaW1pdCBmb3IgdGhpcyBpbnN0YW5jZSBvZiBUVk0uIEl0IGVxdWFscyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgR3JhbXMgY3JlZGl0ZWQgaW4gdGhlIGNyZWRpdCBwaGFzZSBmcm9tIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGRpdmlkZWQgYnkgdGhlIGN1cnJlbnQgZ2FzIHByaWNlLCBvciB0aGUgZ2xvYmFsIHBlci10cmFuc2FjdGlvbiBnYXMgbGltaXQuYCxcclxuICAgICAgICAgICAgZ2FzX2NyZWRpdDogYFRoaXMgcGFyYW1ldGVyIG1heSBiZSBub24temVybyBvbmx5IGZvciBleHRlcm5hbCBpbmJvdW5kIG1lc3NhZ2VzLiBJdCBpcyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgYW1vdW50IG9mIGdhcyB0aGF0IGNhbiBiZSBwYWlkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZSBvciB0aGUgbWF4aW11bSBnYXMgY3JlZGl0YCxcclxuICAgICAgICAgICAgbW9kZTogYGAsXHJcbiAgICAgICAgICAgIGV4aXRfY29kZTogYFRoZXNlIHBhcmFtZXRlciByZXByZXNlbnRzIHRoZSBzdGF0dXMgdmFsdWVzIHJldHVybmVkIGJ5IFRWTTsgZm9yIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgZXhpdF9jb2RlIGhhcyB0byBiZSAwIG9yIDFgLFxyXG4gICAgICAgICAgICBleGl0X2FyZzogYGAsXHJcbiAgICAgICAgICAgIHZtX3N0ZXBzOiBgdGhlIHRvdGFsIG51bWJlciBvZiBzdGVwcyBwZXJmb3JtZWQgYnkgVFZNICh1c3VhbGx5IGVxdWFsIHRvIHR3byBwbHVzIHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zIGV4ZWN1dGVkLCBpbmNsdWRpbmcgaW1wbGljaXQgUkVUcylgLFxyXG4gICAgICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiBUVk0uYCxcclxuICAgICAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogYFRoaXMgcGFyYW1ldGVyIGlzIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoZXMgb2YgdGhlIHJlc3VsdGluZyBzdGF0ZSBvZiBUVk0uYCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFjdGlvbjoge1xyXG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGhhcyB0ZXJtaW5hdGVkIHN1Y2Nlc3NmdWxseSAod2l0aCBleGl0IGNvZGUgMCBvciAxKSwgdGhlIGFjdGlvbnMgZnJvbSB0aGUgbGlzdCBhcmUgcGVyZm9ybWVkLiBJZiBpdCBpcyBpbXBvc3NpYmxlIHRvIHBlcmZvcm0gYWxsIG9mIHRoZW3igJRmb3IgZXhhbXBsZSwgYmVjYXVzZSBvZiBpbnN1ZmZpY2llbnQgZnVuZHMgdG8gdHJhbnNmZXIgd2l0aCBhbiBvdXRib3VuZCBtZXNzYWdl4oCUdGhlbiB0aGUgdHJhbnNhY3Rpb24gaXMgYWJvcnRlZCBhbmQgdGhlIGFjY291bnQgc3RhdGUgaXMgcm9sbGVkIGJhY2suIFRoZSB0cmFuc2FjdGlvbiBpcyBhbHNvIGFib3J0ZWQgaWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGRpZCBub3QgdGVybWluYXRlIHN1Y2Nlc3NmdWxseSwgb3IgaWYgaXQgd2FzIG5vdCBwb3NzaWJsZSB0byBpbnZva2UgdGhlIHNtYXJ0IGNvbnRyYWN0IGF0IGFsbCBiZWNhdXNlIGl0IGlzIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuLmAsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBgLFxyXG4gICAgICAgICAgICB2YWxpZDogYGAsXHJcbiAgICAgICAgICAgIG5vX2Z1bmRzOiBgVGhlIGZsYWcgaW5kaWNhdGVzIGFic2VuY2Ugb2YgZnVuZHMgcmVxdWlyZWQgdG8gY3JlYXRlIGFuIG91dGJvdW5kIG1lc3NhZ2VgLFxyXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgYCxcclxuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXM6IGBgLFxyXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogYGAsXHJcbiAgICAgICAgICAgIHJlc3VsdF9jb2RlOiBgYCxcclxuICAgICAgICAgICAgcmVzdWx0X2FyZzogYGAsXHJcbiAgICAgICAgICAgIHRvdF9hY3Rpb25zOiBgYCxcclxuICAgICAgICAgICAgc3BlY19hY3Rpb25zOiBgYCxcclxuICAgICAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBgYCxcclxuICAgICAgICAgICAgbXNnc19jcmVhdGVkOiBgYCxcclxuICAgICAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogYGAsXHJcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBgYCxcclxuICAgICAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogYGAsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBib3VuY2U6IHtcclxuICAgICAgICAgICAgX2RvYzogYElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4gQWxtb3N0IGFsbCB2YWx1ZSBvZiB0aGUgb3JpZ2luYWwgaW5ib3VuZCBtZXNzYWdlIChtaW51cyBnYXMgcGF5bWVudHMgYW5kIGZvcndhcmRpbmcgZmVlcykgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIGdlbmVyYXRlZCBtZXNzYWdlLCB3aGljaCBvdGhlcndpc2UgaGFzIGFuIGVtcHR5IGJvZHkuYCxcclxuICAgICAgICAgICAgYm91bmNlX3R5cGU6IGBgLFxyXG4gICAgICAgICAgICBtc2dfc2l6ZV9jZWxsczogYGAsXHJcbiAgICAgICAgICAgIG1zZ19zaXplX2JpdHM6IGBgLFxyXG4gICAgICAgICAgICByZXFfZndkX2ZlZXM6IGBgLFxyXG4gICAgICAgICAgICBtc2dfZmVlczogYGAsXHJcbiAgICAgICAgICAgIGZ3ZF9mZWVzOiBgYCxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFib3J0ZWQ6IGBgLFxyXG4gICAgICAgIGRlc3Ryb3llZDogYGAsXHJcbiAgICAgICAgdHQ6IGBgLFxyXG4gICAgICAgIHNwbGl0X2luZm86IHtcclxuICAgICAgICAgICAgX2RvYzogYFRoZSBmaWVsZHMgYmVsb3cgY292ZXIgc3BsaXQgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMgYW5kIG1lcmdlIHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zLCB0aGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIHJlbGV2YW50IHNjaGVtZXMgY292ZXJlZCBieSB0aGUgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLmAsXHJcbiAgICAgICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IHNoYXJkIHByZWZpeGAsXHJcbiAgICAgICAgICAgIGFjY19zcGxpdF9kZXB0aDogYGAsXHJcbiAgICAgICAgICAgIHRoaXNfYWRkcjogYGAsXHJcbiAgICAgICAgICAgIHNpYmxpbmdfYWRkcjogYGAsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBgYCxcclxuICAgICAgICBpbnN0YWxsZWQ6IGBgLFxyXG4gICAgICAgIHByb29mOiBgYCxcclxuICAgICAgICBib2M6IGBgLFxyXG4gICAgfSxcclxuXHJcbiAgICBzaGFyZERlc2NyOiB7XHJcbiAgICAgICAgX2RvYzogYFNoYXJkSGFzaGVzIGlzIHJlcHJlc2VudGVkIGJ5IGEgZGljdGlvbmFyeSB3aXRoIDMyLWJpdCB3b3JrY2hhaW5faWRzIGFzIGtleXMsIGFuZCDigJxzaGFyZCBiaW5hcnkgdHJlZXPigJ0sIHJlcHJlc2VudGVkIGJ5IFRMLUIgdHlwZSBCaW5UcmVlIFNoYXJkRGVzY3IsIGFzIHZhbHVlcy4gRWFjaCBsZWFmIG9mIHRoaXMgc2hhcmQgYmluYXJ5IHRyZWUgY29udGFpbnMgYSB2YWx1ZSBvZiB0eXBlIFNoYXJkRGVzY3IsIHdoaWNoIGRlc2NyaWJlcyBhIHNpbmdsZSBzaGFyZCBieSBpbmRpY2F0aW5nIHRoZSBzZXF1ZW5jZSBudW1iZXIgc2VxX25vLCB0aGUgbG9naWNhbCB0aW1lIGx0LCBhbmQgdGhlIGhhc2ggaGFzaCBvZiB0aGUgbGF0ZXN0IChzaWduZWQpIGJsb2NrIG9mIHRoZSBjb3JyZXNwb25kaW5nIHNoYXJkY2hhaW4uYCxcclxuICAgICAgICBzZXFfbm86IGB1aW50MzIgc2VxdWVuY2UgbnVtYmVyYCxcclxuICAgICAgICByZWdfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcclxuICAgICAgICBzdGFydF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBzdGFydGAsXHJcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIGVuZGAsXHJcbiAgICAgICAgcm9vdF9oYXNoOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLiBUaGUgc2hhcmQgYmxvY2sgY29uZmlndXJhdGlvbiBpcyBkZXJpdmVkIGZyb20gdGhhdCBibG9jay5gLFxyXG4gICAgICAgIGZpbGVfaGFzaDogYFNoYXJkIGJsb2NrIGZpbGUgaGFzaC5gLFxyXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYFRPTiBCbG9ja2NoYWluIHN1cHBvcnRzIGR5bmFtaWMgc2hhcmRpbmcsIHNvIHRoZSBzaGFyZCBjb25maWd1cmF0aW9uIG1heSBjaGFuZ2UgZnJvbSBibG9jayB0byBibG9jayBiZWNhdXNlIG9mIHNoYXJkIG1lcmdlIGFuZCBzcGxpdCBldmVudHMuIFRoZXJlZm9yZSwgd2UgY2Fubm90IHNpbXBseSBzYXkgdGhhdCBlYWNoIHNoYXJkY2hhaW4gY29ycmVzcG9uZHMgdG8gYSBmaXhlZCBzZXQgb2YgYWNjb3VudCBjaGFpbnMuXHJcbkEgc2hhcmRjaGFpbiBibG9jayBhbmQgaXRzIHN0YXRlIG1heSBlYWNoIGJlIGNsYXNzaWZpZWQgaW50byB0d28gZGlzdGluY3QgcGFydHMuIFRoZSBwYXJ0cyB3aXRoIHRoZSBJU1AtZGljdGF0ZWQgZm9ybSBvZiB3aWxsIGJlIGNhbGxlZCB0aGUgc3BsaXQgcGFydHMgb2YgdGhlIGJsb2NrIGFuZCBpdHMgc3RhdGUsIHdoaWxlIHRoZSByZW1haW5kZXIgd2lsbCBiZSBjYWxsZWQgdGhlIG5vbi1zcGxpdCBwYXJ0cy5cclxuVGhlIG1hc3RlcmNoYWluIGNhbm5vdCBiZSBzcGxpdCBvciBtZXJnZWQuYCxcclxuICAgICAgICBiZWZvcmVfbWVyZ2U6IGBgLFxyXG4gICAgICAgIHdhbnRfc3BsaXQ6IGBgLFxyXG4gICAgICAgIHdhbnRfbWVyZ2U6IGBgLFxyXG4gICAgICAgIG54X2NjX3VwZGF0ZWQ6IGBgLFxyXG4gICAgICAgIGZsYWdzOiBgYCxcclxuICAgICAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBgYCxcclxuICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYGAsXHJcbiAgICAgICAgbWluX3JlZl9tY19zZXFubzogYGAsXHJcbiAgICAgICAgZ2VuX3V0aW1lOiBgR2VuZXJhdGlvbiB0aW1lIGluIHVpbnQzMmAsXHJcbiAgICAgICAgc3BsaXRfdHlwZTogYGAsXHJcbiAgICAgICAgc3BsaXQ6IGBgLFxyXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcclxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcclxuICAgICAgICBmdW5kc19jcmVhdGVkOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBncmFtcy5gLFxyXG4gICAgICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IGBBbW91bnQgb2YgZnVuZHMgY3JlYXRlZCBpbiB0aGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcclxuICAgIH0sXHJcblxyXG4gICAgYmxvY2s6IHtcclxuICAgICAgICBfZG9jOiAnVGhpcyBpcyBCbG9jaycsXHJcbiAgICAgICAgc3RhdHVzOiBgUmV0dXJucyBibG9jayBwcm9jZXNzaW5nIHN0YXR1c2AsXHJcbiAgICAgICAgZ2xvYmFsX2lkOiBgdWludDMyIGdsb2JhbCBibG9jayBJRGAsXHJcbiAgICAgICAgd2FudF9zcGxpdDogYGAsXHJcbiAgICAgICAgc2VxX25vOiBgYCxcclxuICAgICAgICBhZnRlcl9tZXJnZTogYGAsXHJcbiAgICAgICAgZ2VuX3V0aW1lOiBgdWludCAzMiBnZW5lcmF0aW9uIHRpbWUgc3RhbXBgLFxyXG4gICAgICAgIGdlbl9jYXRjaGFpbl9zZXFubzogYGAsXHJcbiAgICAgICAgZmxhZ3M6IGBgLFxyXG4gICAgICAgIG1hc3Rlcl9yZWY6IGBgLFxyXG4gICAgICAgIHByZXZfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jay5gLFxyXG4gICAgICAgIHByZXZfYWx0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiBzaGFyZCBtZXJnZS5gLFxyXG4gICAgICAgIHByZXZfdmVydF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2YgdmVydGljYWwgYmxvY2tzLmAsXHJcbiAgICAgICAgcHJldl92ZXJ0X2FsdF9yZWY6IGBgLFxyXG4gICAgICAgIHZlcnNpb246IGB1aW4zMiBibG9jayB2ZXJzaW9uIGlkZW50aWZpZXJgLFxyXG4gICAgICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcclxuICAgICAgICBiZWZvcmVfc3BsaXQ6IGBgLFxyXG4gICAgICAgIGFmdGVyX3NwbGl0OiBgYCxcclxuICAgICAgICB3YW50X21lcmdlOiBgYCxcclxuICAgICAgICB2ZXJ0X3NlcV9ubzogYGAsXHJcbiAgICAgICAgc3RhcnRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBzdGFydC5cclxuTG9naWNhbCB0aW1lIGlzIGEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uYCxcclxuICAgICAgICBlbmRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBlbmQuYCxcclxuICAgICAgICB3b3JrY2hhaW5faWQ6IGB1aW50MzIgd29ya2NoYWluIGlkZW50aWZpZXJgLFxyXG4gICAgICAgIHNoYXJkOiBgYCxcclxuICAgICAgICBtaW5fcmVmX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXHJcbiAgICAgICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IGBSZXR1cm5zIGEgbnVtYmVyIG9mIGEgcHJldmlvdXMga2V5IGJsb2NrLmAsXHJcbiAgICAgICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IGBgLFxyXG4gICAgICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IGBgLFxyXG4gICAgICAgIHZhbHVlX2Zsb3c6IHtcclxuICAgICAgICAgICAgdG9fbmV4dF9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgYW1vdW50IHRvIHRoZSBuZXh0IGJsb2NrLmAsXHJcbiAgICAgICAgICAgIHRvX25leHRfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdG8gdGhlIG5leHQgYmxvY2suYCxcclxuICAgICAgICAgICAgZXhwb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgZXhwb3J0ZWQuYCxcclxuICAgICAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBleHBvcnRlZC5gLFxyXG4gICAgICAgICAgICBmZWVzX2NvbGxlY3RlZDogYGAsXHJcbiAgICAgICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgYCxcclxuICAgICAgICAgICAgY3JlYXRlZDogYGAsXHJcbiAgICAgICAgICAgIGNyZWF0ZWRfb3RoZXI6IGBgLFxyXG4gICAgICAgICAgICBpbXBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBpbXBvcnRlZC5gLFxyXG4gICAgICAgICAgICBpbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGltcG9ydGVkLmAsXHJcbiAgICAgICAgICAgIGZyb21fcHJldl9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxyXG4gICAgICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxyXG4gICAgICAgICAgICBtaW50ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgbWludGVkIGluIHRoaXMgYmxvY2suYCxcclxuICAgICAgICAgICAgbWludGVkX290aGVyOiBgYCxcclxuICAgICAgICAgICAgZmVlc19pbXBvcnRlZDogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBncmFtc2AsXHJcbiAgICAgICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5fbXNnX2Rlc2NyOiBgYCxcclxuICAgICAgICByYW5kX3NlZWQ6IGBgLFxyXG4gICAgICAgIGNyZWF0ZWRfYnk6IGBQdWJsaWMga2V5IG9mIHRoZSBjb2xsYXRvciB3aG8gcHJvZHVjZWQgdGhpcyBibG9jay5gLFxyXG4gICAgICAgIG91dF9tc2dfZGVzY3I6IGBgLFxyXG4gICAgICAgIGFjY291bnRfYmxvY2tzOiB7XHJcbiAgICAgICAgICAgIGFjY291bnRfYWRkcjogYGAsXHJcbiAgICAgICAgICAgIHRyYW5zYWN0aW9uczogYGAsXHJcbiAgICAgICAgICAgIHN0YXRlX3VwZGF0ZToge1xyXG4gICAgICAgICAgICAgICAgb2xkX2hhc2g6IGBvbGQgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgLFxyXG4gICAgICAgICAgICAgICAgbmV3X2hhc2g6IGBuZXcgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRyX2NvdW50OiBgYFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XHJcbiAgICAgICAgICAgIG5ldzogYGAsXHJcbiAgICAgICAgICAgIG5ld19oYXNoOiBgYCxcclxuICAgICAgICAgICAgbmV3X2RlcHRoOiBgYCxcclxuICAgICAgICAgICAgb2xkOiBgYCxcclxuICAgICAgICAgICAgb2xkX2hhc2g6IGBgLFxyXG4gICAgICAgICAgICBvbGRfZGVwdGg6IGBgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBtYXN0ZXI6IHtcclxuICAgICAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogJ01pbiBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcclxuICAgICAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogJ01heCBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcclxuICAgICAgICAgICAgc2hhcmRfaGFzaGVzOiB7XHJcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2Ygc2hhcmQgaGFzaGVzYCxcclxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYFVpbnQzMiB3b3JrY2hhaW4gSURgLFxyXG4gICAgICAgICAgICAgICAgc2hhcmQ6IGBTaGFyZCBJRGAsXHJcbiAgICAgICAgICAgICAgICBkZXNjcjogYFNoYXJkIGRlc2NyaXB0aW9uYCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2hhcmRfZmVlczoge1xyXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgYCxcclxuICAgICAgICAgICAgICAgIHNoYXJkOiBgYCxcclxuICAgICAgICAgICAgICAgIGZlZXM6IGBBbW91bnQgb2YgZmVlcyBpbiBncmFtc2AsXHJcbiAgICAgICAgICAgICAgICBmZWVzX290aGVyOiBgQXJyYXkgb2YgZmVlcyBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llc2AsXHJcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGBBbW91bnQgb2YgZmVlcyBjcmVhdGVkIGR1cmluZyBzaGFyZGAsXHJcbiAgICAgICAgICAgICAgICBjcmVhdGVfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gZmVlcyBjcmVhdGVkIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzIGR1cmluZyB0aGUgYmxvY2suYCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBgYCxcclxuICAgICAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczoge1xyXG4gICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHByZXZpb3VzIGJsb2NrIHNpZ25hdHVyZXNgLFxyXG4gICAgICAgICAgICAgICAgbm9kZV9pZDogYGAsXHJcbiAgICAgICAgICAgICAgICByOiBgYCxcclxuICAgICAgICAgICAgICAgIHM6IGBgLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBjb25maWdfYWRkcjogYGAsXHJcbiAgICAgICAgICAgIGNvbmZpZzoge1xyXG4gICAgICAgICAgICAgICAgcDA6IGBBZGRyZXNzIG9mIGNvbmZpZyBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxyXG4gICAgICAgICAgICAgICAgcDE6IGBBZGRyZXNzIG9mIGVsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcclxuICAgICAgICAgICAgICAgIHAyOiBgQWRkcmVzcyBvZiBtaW50ZXIgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcclxuICAgICAgICAgICAgICAgIHAzOiBgQWRkcmVzcyBvZiBmZWUgY29sbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXHJcbiAgICAgICAgICAgICAgICBwNDogYEFkZHJlc3Mgb2YgVE9OIEROUyByb290IHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXHJcbiAgICAgICAgICAgICAgICBwNjoge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA2YCxcclxuICAgICAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IGBgLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHA3OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZ3VyYXRpb24gcGFyYW1ldGVyIDdgLFxyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBgYCxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogYGAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcDg6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgR2xvYmFsIHZlcnNpb25gLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogYGAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcDk6IGBNYW5kYXRvcnkgcGFyYW1zYCxcclxuICAgICAgICAgICAgICAgIHAxMDogYENyaXRpY2FsIHBhcmFtc2AsXHJcbiAgICAgICAgICAgICAgICBwMTE6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlnIHZvdGluZyBzZXR1cGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBgYCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwMTI6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgYWxsIHdvcmtjaGFpbnMgZGVzY3JpcHRpb25zYCxcclxuICAgICAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBhY3RpdmU6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBmbGFnczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFzaWM6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogYGAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcDE0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgX2RvYzogYEJsb2NrIGNyZWF0ZSBmZWVzYCxcclxuICAgICAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHAxNToge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IGBgLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHAxNjoge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3JzIGNvdW50YCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IGBgLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHAxNzoge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3Igc3Rha2UgcGFyYW1ldGVyc2AsXHJcbiAgICAgICAgICAgICAgICAgICAgbWluX3N0YWtlOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogYGBcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwMTg6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgU3RvcmFnZSBwcmljZXNgLFxyXG4gICAgICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogYGAsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXHJcbiAgICAgICAgICAgICAgICBwMjE6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXHJcbiAgICAgICAgICAgICAgICBwMjI6IGBCbG9jayBsaW1pdHMgaW4gdGhlIG1hc3RlcmNoYWluYCxcclxuICAgICAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcclxuICAgICAgICAgICAgICAgIHAyNDogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcclxuICAgICAgICAgICAgICAgIHAyNTogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXHJcbiAgICAgICAgICAgICAgICBwMjg6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ2F0Y2hhaW4gY29uZmlnYCxcclxuICAgICAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBgYCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwMjk6IHtcclxuICAgICAgICAgICAgICAgICAgICBfZG9jOiBgQ29uc2Vuc3VzIGNvbmZpZ2AsXHJcbiAgICAgICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IGBgXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXHJcbiAgICAgICAgICAgICAgICBwMzI6IGBQcmV2aW91cyB2YWxpZGF0b3JzIHNldGAsXHJcbiAgICAgICAgICAgICAgICBwMzM6IGBQcmV2aW91cyB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcclxuICAgICAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxyXG4gICAgICAgICAgICAgICAgcDM1OiBgQ3VycmVudCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcclxuICAgICAgICAgICAgICAgIHAzNjogYE5leHQgdmFsaWRhdG9ycyBzZXRgLFxyXG4gICAgICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcclxuICAgICAgICAgICAgICAgIHAzOToge1xyXG4gICAgICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiB2YWxpZGF0b3Igc2lnbmVkIHRlbXByb3Jhcnkga2V5c2AsXHJcbiAgICAgICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlcW5vOiBgYCxcclxuICAgICAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXHJcbiAgICAgICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IGBgLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBgYCxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGtleV9ibG9jazogJ3RydWUgaWYgdGhpcyBibG9jayBpcyBhIGtleSBibG9jaycsXHJcbiAgICAgICAgYm9jOiAnU2VyaWFsaXplZCBiYWcgb2YgY2VsbCBvZiB0aGlzIGJsb2NrIGVuY29kZWQgd2l0aCBiYXNlNjQnLFxyXG4gICAgICAgIGJhbGFuY2VfZGVsdGE6ICdBY2NvdW50IGJhbGFuY2UgY2hhbmdlIGFmdGVyIHRyYW5zYWN0aW9uJyxcclxuICAgIH0sXHJcblxyXG4gICAgYmxvY2tTaWduYXR1cmVzOiB7XHJcbiAgICAgICAgX2RvYzogYFNldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWRgLFxyXG4gICAgICAgIGdlbl91dGltZTogYFNpZ25lZCBibG9jaydzIGdlbl91dGltZWAsXHJcbiAgICAgICAgc2VxX25vOiBgU2lnbmVkIGJsb2NrJ3Mgc2VxX25vYCxcclxuICAgICAgICBzaGFyZDogYFNpZ25lZCBibG9jaydzIHNoYXJkYCxcclxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBTaWduZWQgYmxvY2sncyB3b3JrY2hhaW5faWRgLFxyXG4gICAgICAgIHByb29mOiBgU2lnbmVkIGJsb2NrJ3MgbWVya2xlIHByb29mYCxcclxuICAgICAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcclxuICAgICAgICBjYXRjaGFpbl9zZXFubzogYGAsXHJcbiAgICAgICAgc2lnX3dlaWdodDogYGAsXHJcbiAgICAgICAgc2lnbmF0dXJlczoge1xyXG4gICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc2AsXHJcbiAgICAgICAgICAgIG5vZGVfaWQ6IGBWYWxpZGF0b3IgSURgLFxyXG4gICAgICAgICAgICByOiBgJ1InIHBhcnQgb2Ygc2lnbmF0dXJlYCxcclxuICAgICAgICAgICAgczogYCdzJyBwYXJ0IG9mIHNpZ25hdHVyZWAsXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufTtcclxuIl19