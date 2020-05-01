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
    }
  },
  blockSignatures: {
    _doc: `Set of validator\'s signatures for the Block with correspond id`,
    gen_utime: `Signed block's gen_utime`,
    seq_no: `Signed block's seq_no`,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImNvZGVfaGFzaCIsImRhdGEiLCJkYXRhX2hhc2giLCJsaWJyYXJ5IiwibGlicmFyeV9oYXNoIiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJib2R5X2hhc2giLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJ0cmFuc2FjdGlvbiIsIl8iLCJjb2xsZWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInNoYXJkRGVzY3IiLCJzZXFfbm8iLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWQiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiYmxvY2tTaWduYXR1cmVzIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ08sTUFBTUEsSUFBSSxHQUFHO0FBQ2hCQyxFQUFBQSxPQUFPLEVBQUU7QUFDTEMsSUFBQUEsSUFBSSxFQUFHOzs7Ozs7Ozs7Ozs7WUFERjtBQWNMQyxJQUFBQSxFQUFFLEVBQUcsRUFkQTtBQWVMQyxJQUFBQSxZQUFZLEVBQUcsaURBZlY7QUFnQkxDLElBQUFBLFFBQVEsRUFBRzs7Ozs7Ozs7O1NBaEJOO0FBMEJMQyxJQUFBQSxTQUFTLEVBQUc7Ozs7Ozs7Ozs7Ozs7aUJBMUJQO0FBd0NMQyxJQUFBQSxXQUFXLEVBQUc7Ozs7Ozs7Ozs7U0F4Q1Q7QUFtRExDLElBQUFBLGFBQWEsRUFBRyxHQW5EWDtBQW9ETEMsSUFBQUEsT0FBTyxFQUFHOzs7Ozs7OztTQXBETDtBQTZETEMsSUFBQUEsYUFBYSxFQUFHLEdBN0RYO0FBOERMQyxJQUFBQSxXQUFXLEVBQUcscUVBOURUO0FBK0RMQyxJQUFBQSxJQUFJLEVBQUcsd0pBL0RGO0FBZ0VMQyxJQUFBQSxJQUFJLEVBQUc7Ozs7Ozs7Ozs7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QUcsRUFIakI7QUFJREMsVUFBQUEsS0FBSyxFQUFHLEVBSlA7QUFLREMsVUFBQUEsV0FBVyxFQUFHLEVBTGI7QUFNREMsVUFBQUEsV0FBVyxFQUFHLEVBTmI7QUFPREMsVUFBQUEsV0FBVyxFQUFHO0FBUGI7QUFqSEQ7QUF6Qko7QUFwRUQsR0FyUVM7QUFnZXBCQyxFQUFBQSxlQUFlLEVBQUU7QUFDYi9SLElBQUFBLElBQUksRUFBRyxpRUFETTtBQUVia0ksSUFBQUEsU0FBUyxFQUFHLDBCQUZDO0FBR2JmLElBQUFBLE1BQU0sRUFBRyx1QkFISTtBQUliakgsSUFBQUEsWUFBWSxFQUFHLDZCQUpGO0FBS2JnQixJQUFBQSxLQUFLLEVBQUcsNkJBTEs7QUFNYjhRLElBQUFBLHlCQUF5QixFQUFHLEVBTmY7QUFPYkMsSUFBQUEsY0FBYyxFQUFHLEVBUEo7QUFRYkMsSUFBQUEsVUFBVSxFQUFHLEVBUkE7QUFTYkMsSUFBQUEsVUFBVSxFQUFFO0FBQ1JuUyxNQUFBQSxJQUFJLEVBQUcsNkNBREM7QUFFUmdNLE1BQUFBLE9BQU8sRUFBRyxjQUZGO0FBR1JDLE1BQUFBLENBQUMsRUFBRyx1QkFISTtBQUlSQyxNQUFBQSxDQUFDLEVBQUc7QUFKSTtBQVRDO0FBaGVHLENBQWIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L3ByZWZlci1kZWZhdWx0LWV4cG9ydFxuZXhwb3J0IGNvbnN0IGRvY3MgPSB7XG4gICAgYWNjb3VudDoge1xuICAgICAgICBfZG9jOiBgXG4jIEFjY291bnQgdHlwZVxuXG5SZWNhbGwgdGhhdCBhIHNtYXJ0IGNvbnRyYWN0IGFuZCBhbiBhY2NvdW50IGFyZSB0aGUgc2FtZSB0aGluZyBpbiB0aGUgY29udGV4dFxub2YgdGhlIFRPTiBCbG9ja2NoYWluLCBhbmQgdGhhdCB0aGVzZSB0ZXJtcyBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHksIGF0XG5sZWFzdCBhcyBsb25nIGFzIG9ubHkgc21hbGwgKG9yIOKAnHVzdWFs4oCdKSBzbWFydCBjb250cmFjdHMgYXJlIGNvbnNpZGVyZWQuIEEgbGFyZ2VcbnNtYXJ0LWNvbnRyYWN0IG1heSBlbXBsb3kgc2V2ZXJhbCBhY2NvdW50cyBseWluZyBpbiBkaWZmZXJlbnQgc2hhcmRjaGFpbnMgb2ZcbnRoZSBzYW1lIHdvcmtjaGFpbiBmb3IgbG9hZCBiYWxhbmNpbmcgcHVycG9zZXMuXG5cbkFuIGFjY291bnQgaXMgaWRlbnRpZmllZCBieSBpdHMgZnVsbCBhZGRyZXNzIGFuZCBpcyBjb21wbGV0ZWx5IGRlc2NyaWJlZCBieVxuaXRzIHN0YXRlLiBJbiBvdGhlciB3b3JkcywgdGhlcmUgaXMgbm90aGluZyBlbHNlIGluIGFuIGFjY291bnQgYXBhcnQgZnJvbSBpdHNcbmFkZHJlc3MgYW5kIHN0YXRlLlxuICAgICAgICAgICBgLFxuICAgICAgICBpZDogYGAsXG4gICAgICAgIHdvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgYWNjb3VudCBhZGRyZXNzIChpZCBmaWVsZCkuYCxcbiAgICAgICAgYWNjX3R5cGU6IGBSZXR1cm5zIHRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgYWNjb3VudC5cblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhmaWx0ZXI6IHthY2NfdHlwZTp7ZXE6MX19KXtcbiAgICBpZFxuICAgIGFjY190eXBlXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBsYXN0X3BhaWQ6IGBcbkNvbnRhaW5zIGVpdGhlciB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHN0b3JhZ2UgcGF5bWVudFxuY29sbGVjdGVkICh1c3VhbGx5IHRoaXMgaXMgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCB0cmFuc2FjdGlvbiksXG5vciB0aGUgdW5peHRpbWUgd2hlbiB0aGUgYWNjb3VudCB3YXMgY3JlYXRlZCAoYWdhaW4sIGJ5IGEgdHJhbnNhY3Rpb24pLlxuXFxgXFxgXFxgXG5xdWVyeXtcbiAgYWNjb3VudHMoZmlsdGVyOiB7XG4gICAgbGFzdF9wYWlkOntnZToxNTY3Mjk2MDAwfVxuICB9KSB7XG4gIGlkXG4gIGxhc3RfcGFpZH1cbn1cblxcYFxcYFxcYCAgICAgXG4gICAgICAgICAgICAgICAgYCxcbiAgICAgICAgZHVlX3BheW1lbnQ6IGBcbklmIHByZXNlbnQsIGFjY3VtdWxhdGVzIHRoZSBzdG9yYWdlIHBheW1lbnRzIHRoYXQgY291bGQgbm90IGJlIGV4YWN0ZWQgZnJvbSB0aGUgYmFsYW5jZSBvZiB0aGUgYWNjb3VudCwgcmVwcmVzZW50ZWQgYnkgYSBzdHJpY3RseSBwb3NpdGl2ZSBhbW91bnQgb2YgbmFub2dyYW1zOyBpdCBjYW4gYmUgcHJlc2VudCBvbmx5IGZvciB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50cyB0aGF0IGhhdmUgYSBiYWxhbmNlIG9mIHplcm8gR3JhbXMgKGJ1dCBtYXkgaGF2ZSBub24temVybyBiYWxhbmNlcyBpbiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzKS4gV2hlbiBkdWVfcGF5bWVudCBiZWNvbWVzIGxhcmdlciB0aGFuIHRoZSB2YWx1ZSBvZiBhIGNvbmZpZ3VyYWJsZSBwYXJhbWV0ZXIgb2YgdGhlIGJsb2NrY2hhaW4sIHRoZSBhYy0gY291bnQgaXMgZGVzdHJveWVkIGFsdG9nZXRoZXIsIGFuZCBpdHMgYmFsYW5jZSwgaWYgYW55LCBpcyB0cmFuc2ZlcnJlZCB0byB0aGUgemVybyBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjogeyBkdWVfcGF5bWVudDogeyBuZTogbnVsbCB9IH0pXG4gICAge1xuICAgICAgaWRcbiAgICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgbGFzdF90cmFuc19sdDogYCBgLFxuICAgICAgICBiYWxhbmNlOiBgXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMob3JkZXJCeTp7cGF0aDpcImJhbGFuY2VcIixkaXJlY3Rpb246REVTQ30pe1xuICAgIGJhbGFuY2VcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGJhbGFuY2Vfb3RoZXI6IGAgYCxcbiAgICAgICAgc3BsaXRfZGVwdGg6IGBJcyBwcmVzZW50IGFuZCBub24temVybyBvbmx5IGluIGluc3RhbmNlcyBvZiBsYXJnZSBzbWFydCBjb250cmFjdHMuYCxcbiAgICAgICAgdGljazogYE1heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uYCxcbiAgICAgICAgdG9jazogYE1heSBiZSBwcmVzZW50IG9ubHkgaW4gdGhlIG1hc3RlcmNoYWlu4oCUYW5kIHdpdGhpbiB0aGUgbWFzdGVyY2hhaW4sIG9ubHkgaW4gc29tZSBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgcmVxdWlyZWQgZm9yIHRoZSB3aG9sZSBzeXN0ZW0gdG8gZnVuY3Rpb24uXG5cXGBcXGBcXGAgICAgICAgIFxue1xuICBhY2NvdW50cyAoZmlsdGVyOnt0b2NrOntuZTpudWxsfX0pe1xuICAgIGlkXG4gICAgdG9ja1xuICAgIHRpY2tcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGNvZGU6IGBJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBjb2RlIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQuXG5cXGBcXGBcXGAgIFxue1xuICBhY2NvdW50cyAoZmlsdGVyOntjb2RlOntlcTpudWxsfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufSAgIFxuXFxgXFxgXFxgICAgICAgICAgIFxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIGAsXG4gICAgICAgIGNvZGVfaGFzaDogYFxcYGNvZGVcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGRhdGE6IGBJZiBwcmVzZW50LCBjb250YWlucyBzbWFydC1jb250cmFjdCBkYXRhIGVuY29kZWQgd2l0aCBpbiBiYXNlNjQuYCxcbiAgICAgICAgZGF0YV9oYXNoOiBgXFxgZGF0YVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgbGlicmFyeTogYElmIHByZXNlbnQsIGNvbnRhaW5zIGxpYnJhcnkgY29kZSB1c2VkIGluIHNtYXJ0LWNvbnRyYWN0LmAsXG4gICAgICAgIGxpYnJhcnlfaGFzaDogYFxcYGxpYnJhcnlcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIHByb29mOiBgTWVya2xlIHByb29mIHRoYXQgYWNjb3VudCBpcyBhIHBhcnQgb2Ygc2hhcmQgc3RhdGUgaXQgY3V0IGZyb20gYXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvYzogYEJhZyBvZiBjZWxscyB3aXRoIHRoZSBhY2NvdW50IHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgIH0sXG4gICAgbWVzc2FnZToge1xuICAgICAgICBfZG9jOiBgIyBNZXNzYWdlIHR5cGVcblxuICAgICAgICAgICBNZXNzYWdlIGxheW91dCBxdWVyaWVzLiAgQSBtZXNzYWdlIGNvbnNpc3RzIG9mIGl0cyBoZWFkZXIgZm9sbG93ZWQgYnkgaXRzXG4gICAgICAgICAgIGJvZHkgb3IgcGF5bG9hZC4gVGhlIGJvZHkgaXMgZXNzZW50aWFsbHkgYXJiaXRyYXJ5LCB0byBiZSBpbnRlcnByZXRlZCBieSB0aGVcbiAgICAgICAgICAgZGVzdGluYXRpb24gc21hcnQgY29udHJhY3QuIEl0IGNhbiBiZSBxdWVyaWVkIHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6YCxcbiAgICAgICAgbXNnX3R5cGU6IGBSZXR1cm5zIHRoZSB0eXBlIG9mIG1lc3NhZ2UuYCxcbiAgICAgICAgc3RhdHVzOiBgUmV0dXJucyBpbnRlcm5hbCBwcm9jZXNzaW5nIHN0YXR1cyBhY2NvcmRpbmcgdG8gdGhlIG51bWJlcnMgc2hvd24uYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9keTogYEJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIGJvZHkgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9keV9oYXNoOiBgXFxgYm9keVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgc3BsaXRfZGVwdGg6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIHRpY2s6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIHRvY2s6IGBUaGlzIGlzIG9ubHkgdXNlZCBmb3Igc3BlY2lhbCBjb250cmFjdHMgaW4gbWFzdGVyY2hhaW4gdG8gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgY29kZTogYFJlcHJlc2VudHMgY29udHJhY3QgY29kZSBpbiBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgY29kZV9oYXNoOiBgXFxgY29kZVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgZGF0YTogYFJlcHJlc2VudHMgaW5pdGlhbCBkYXRhIGZvciBhIGNvbnRyYWN0IGluIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGRhdGFfaGFzaDogYFxcYGRhdGFcXGAgZmllbGQgcm9vdCBoYXNoLmAsXG4gICAgICAgIGxpYnJhcnk6IGBSZXByZXNlbnRzIGNvbnRyYWN0IGxpYnJhcnkgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgbGlicmFyeV9oYXNoOiBgXFxgbGlicmFyeVxcYCBmaWVsZCByb290IGhhc2guYCxcbiAgICAgICAgc3JjOiBgUmV0dXJucyBzb3VyY2UgYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBkc3Q6IGBSZXR1cm5zIGRlc3RpbmF0aW9uIGFkZHJlc3Mgc3RyaW5nYCxcbiAgICAgICAgc3JjX3dvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgc291cmNlIGFkZHJlc3MgKHNyYyBmaWVsZClgLFxuICAgICAgICBkc3Rfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChkc3QgZmllbGQpYCxcbiAgICAgICAgY3JlYXRlZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxuICAgICAgICBjcmVhdGVkX2F0OiBgQ3JlYXRpb24gdW5peHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uIFRoZSBjcmVhdGlvbiB1bml4dGltZSBlcXVhbHMgdGhlIGNyZWF0aW9uIHVuaXh0aW1lIG9mIHRoZSBibG9jayBjb250YWluaW5nIHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGlocl9kaXNhYmxlZDogYElIUiBpcyBkaXNhYmxlZCBmb3IgdGhlIG1lc3NhZ2UuYCxcbiAgICAgICAgaWhyX2ZlZTogYFRoaXMgdmFsdWUgaXMgc3VidHJhY3RlZCBmcm9tIHRoZSB2YWx1ZSBhdHRhY2hlZCB0byB0aGUgbWVzc2FnZSBhbmQgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycyBvZiB0aGUgZGVzdGluYXRpb24gc2hhcmRjaGFpbiBpZiB0aGV5IGluY2x1ZGUgdGhlIG1lc3NhZ2UgYnkgdGhlIElIUiBtZWNoYW5pc20uYCxcbiAgICAgICAgZndkX2ZlZTogYE9yaWdpbmFsIHRvdGFsIGZvcndhcmRpbmcgZmVlIHBhaWQgZm9yIHVzaW5nIHRoZSBIUiBtZWNoYW5pc207IGl0IGlzIGF1dG9tYXRpY2FsbHkgY29tcHV0ZWQgZnJvbSBzb21lIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVycyBhbmQgdGhlIHNpemUgb2YgdGhlIG1lc3NhZ2UgYXQgdGhlIHRpbWUgdGhlIG1lc3NhZ2UgaXMgZ2VuZXJhdGVkLmAsXG4gICAgICAgIGltcG9ydF9mZWU6IGBgLFxuICAgICAgICBib3VuY2U6IGBCb3VuY2UgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIGJvdW5jZWQ6IGBCb3VuY2VkIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci5gLFxuICAgICAgICB2YWx1ZTogYE1heSBvciBtYXkgbm90IGJlIHByZXNlbnRgLFxuICAgICAgICB2YWx1ZV9vdGhlcjogYE1heSBvciBtYXkgbm90IGJlIHByZXNlbnQuYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBtZXNzYWdlIGlzIGEgcGFydCBvZiBhIGJsb2NrIGl0IGN1dCBmcm9tLiBJdCBpcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQSBiYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBzdHJ1Y3R1cmUgZW5jb2RlZCBhcyBiYXNlNjQuYFxuICAgIH0sXG5cblxuICAgIHRyYW5zYWN0aW9uIDoge1xuICAgICAgICBfZG9jOiAnVE9OIFRyYW5zYWN0aW9uJyxcbiAgICAgICAgXzoge2NvbGxlY3Rpb246ICd0cmFuc2FjdGlvbnMnfSxcbiAgICAgICAgdHJfdHlwZTogYFRyYW5zYWN0aW9uIHR5cGUgYWNjb3JkaW5nIHRvIHRoZSBvcmlnaW5hbCBibG9ja2NoYWluIHNwZWNpZmljYXRpb24sIGNsYXVzZSA0LjIuNC5gLFxuICAgICAgICBzdGF0dXM6IGBUcmFuc2FjdGlvbiBwcm9jZXNzaW5nIHN0YXR1c2AsXG4gICAgICAgIGJsb2NrX2lkOiBgYCxcbiAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGFjY291bnRfYWRkciBmaWVsZClgLFxuICAgICAgICBsdDogYExvZ2ljYWwgdGltZS4gQSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgW3RoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uXShodHRwczovL3Rlc3QudG9uLm9yZy90YmxrY2gucGRmKS5gLFxuICAgICAgICBwcmV2X3RyYW5zX2hhc2g6IGBgLFxuICAgICAgICBwcmV2X3RyYW5zX2x0OiBgYCxcbiAgICAgICAgbm93OiBgYCxcbiAgICAgICAgb3V0bXNnX2NudDogYFRoZSBudW1iZXIgb2YgZ2VuZXJhdGVkIG91dGJvdW5kIG1lc3NhZ2VzIChvbmUgb2YgdGhlIGNvbW1vbiB0cmFuc2FjdGlvbiBwYXJhbWV0ZXJzIGRlZmluZWQgYnkgdGhlIHNwZWNpZmljYXRpb24pYCxcbiAgICAgICAgb3JpZ19zdGF0dXM6IGBUaGUgaW5pdGlhbCBzdGF0ZSBvZiBhY2NvdW50LiBOb3RlIHRoYXQgaW4gdGhpcyBjYXNlIHRoZSBxdWVyeSBtYXkgcmV0dXJuIDAsIGlmIHRoZSBhY2NvdW50IHdhcyBub3QgYWN0aXZlIGJlZm9yZSB0aGUgdHJhbnNhY3Rpb24gYW5kIDEgaWYgaXQgd2FzIGFscmVhZHkgYWN0aXZlYCxcbiAgICAgICAgZW5kX3N0YXR1czogYFRoZSBlbmQgc3RhdGUgb2YgYW4gYWNjb3VudCBhZnRlciBhIHRyYW5zYWN0aW9uLCAxIGlzIHJldHVybmVkIHRvIGluZGljYXRlIGEgZmluYWxpemVkIHRyYW5zYWN0aW9uIGF0IGFuIGFjdGl2ZSBhY2NvdW50YCxcbiAgICAgICAgaW5fbXNnOiBgYCxcbiAgICAgICAgaW5fbWVzc2FnZTogYGAsXG4gICAgICAgIG91dF9tc2dzOiBgRGljdGlvbmFyeSBvZiB0cmFuc2FjdGlvbiBvdXRib3VuZCBtZXNzYWdlcyBhcyBzcGVjaWZpZWQgaW4gdGhlIHNwZWNpZmljYXRpb25gLFxuICAgICAgICBvdXRfbWVzc2FnZXM6IGBgLFxuICAgICAgICB0b3RhbF9mZWVzOiBgVG90YWwgYW1vdW50IG9mIGZlZXMgdGhhdCBlbnRhaWxzIGFjY291bnQgc3RhdGUgY2hhbmdlIGFuZCB1c2VkIGluIE1lcmtsZSB1cGRhdGVgLFxuICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBgU2FtZSBhcyBhYm92ZSwgYnV0IHJlc2VydmVkIGZvciBub24gZ3JhbSBjb2lucyB0aGF0IG1heSBhcHBlYXIgaW4gdGhlIGJsb2NrY2hhaW5gLFxuICAgICAgICBvbGRfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBuZXdfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBjcmVkaXRfZmlyc3Q6IGBgLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBgVGhpcyBmaWVsZCBkZWZpbmVzIHRoZSBhbW91bnQgb2Ygc3RvcmFnZSBmZWVzIGNvbGxlY3RlZCBpbiBncmFtcy5gLFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyB0aGUgYW1vdW50IG9mIGR1ZSBmZWVzIGluIGdyYW1zLCBpdCBtaWdodCBiZSBlbXB0eS5gLFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyBhY2NvdW50IHN0YXR1cyBjaGFuZ2UgYWZ0ZXIgdGhlIHRyYW5zYWN0aW9uIGlzIGNvbXBsZXRlZC5gLFxuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWRpdDoge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBhY2NvdW50IGlzIGNyZWRpdGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgcmVjZWl2ZWQuIFRoZSBjcmVkaXQgcGhhc2UgY2FuIHJlc3VsdCBpbiB0aGUgY29sbGVjdGlvbiBvZiBzb21lIGR1ZSBwYXltZW50c2AsXG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGBUaGUgc3VtIG9mIGR1ZV9mZWVzX2NvbGxlY3RlZCBhbmQgY3JlZGl0IG11c3QgZXF1YWwgdGhlIHZhbHVlIG9mIHRoZSBtZXNzYWdlIHJlY2VpdmVkLCBwbHVzIGl0cyBpaHJfZmVlIGlmIHRoZSBtZXNzYWdlIGhhcyBub3QgYmVlbiByZWNlaXZlZCB2aWEgSW5zdGFudCBIeXBlcmN1YmUgUm91dGluZywgSUhSIChvdGhlcndpc2UgdGhlIGlocl9mZWUgaXMgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycykuYCxcbiAgICAgICAgICAgIGNyZWRpdDogYGAsXG4gICAgICAgICAgICBjcmVkaXRfb3RoZXI6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBjb21wdXRlOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGNvZGUgb2YgdGhlIHNtYXJ0IGNvbnRyYWN0IGlzIGludm9rZWQgaW5zaWRlIGFuIGluc3RhbmNlIG9mIFRWTSB3aXRoIGFkZXF1YXRlIHBhcmFtZXRlcnMsIGluY2x1ZGluZyBhIGNvcHkgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBhbmQgb2YgdGhlIHBlcnNpc3RlbnQgZGF0YSwgYW5kIHRlcm1pbmF0ZXMgd2l0aCBhbiBleGl0IGNvZGUsIHRoZSBuZXcgcGVyc2lzdGVudCBkYXRhLCBhbmQgYW4gYWN0aW9uIGxpc3QgKHdoaWNoIGluY2x1ZGVzLCBmb3IgaW5zdGFuY2UsIG91dGJvdW5kIG1lc3NhZ2VzIHRvIGJlIHNlbnQpLiBUaGUgcHJvY2Vzc2luZyBwaGFzZSBtYXkgbGVhZCB0byB0aGUgY3JlYXRpb24gb2YgYSBuZXcgYWNjb3VudCAodW5pbml0aWFsaXplZCBvciBhY3RpdmUpLCBvciB0byB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudC4gVGhlIGdhcyBwYXltZW50LCBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiB0aGUgZ2FzIHByaWNlIGFuZCB0aGUgZ2FzIGNvbnN1bWVkLCBpcyBleGFjdGVkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZS5cbklmIHRoZXJlIGlzIG5vIHJlYXNvbiB0byBza2lwIHRoZSBjb21wdXRpbmcgcGhhc2UsIFRWTSBpcyBpbnZva2VkIGFuZCB0aGUgcmVzdWx0cyBvZiB0aGUgY29tcHV0YXRpb24gYXJlIGxvZ2dlZC4gUG9zc2libGUgcGFyYW1ldGVycyBhcmUgY292ZXJlZCBiZWxvdy5gLFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uOiBgUmVhc29uIGZvciBza2lwcGluZyB0aGUgY29tcHV0ZSBwaGFzZS4gQWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpY2F0aW9uLCB0aGUgcGhhc2UgY2FuIGJlIHNraXBwZWQgZHVlIHRvIHRoZSBhYnNlbmNlIG9mIGZ1bmRzIHRvIGJ1eSBnYXMsIGFic2VuY2Ugb2Ygc3RhdGUgb2YgYW4gYWNjb3VudCBvciBhIG1lc3NhZ2UsIGZhaWx1cmUgdG8gcHJvdmlkZSBhIHZhbGlkIHN0YXRlIGluIHRoZSBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBUaGlzIGZsYWcgaXMgc2V0IGlmIGFuZCBvbmx5IGlmIGV4aXRfY29kZSBpcyBlaXRoZXIgMCBvciAxLmAsXG4gICAgICAgICAgICBtc2dfc3RhdGVfdXNlZDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpYCxcbiAgICAgICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBgVGhlIGZsYWcgcmVmbGVjdHMgd2hldGhlciB0aGlzIGhhcyByZXN1bHRlZCBpbiB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgZnJvemVuLCB1bmluaXRpYWxpemVkIG9yIG5vbi1leGlzdGVudCBhY2NvdW50LmAsXG4gICAgICAgICAgICBnYXNfZmVlczogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSB0b3RhbCBnYXMgZmVlcyBjb2xsZWN0ZWQgYnkgdGhlIHZhbGlkYXRvcnMgZm9yIGV4ZWN1dGluZyB0aGlzIHRyYW5zYWN0aW9uLiBJdCBtdXN0IGJlIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIGdhc191c2VkIGFuZCBnYXNfcHJpY2UgZnJvbSB0aGUgY3VycmVudCBibG9jayBoZWFkZXIuYCxcbiAgICAgICAgICAgIGdhc191c2VkOiBgYCxcbiAgICAgICAgICAgIGdhc19saW1pdDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSBnYXMgbGltaXQgZm9yIHRoaXMgaW5zdGFuY2Ugb2YgVFZNLiBJdCBlcXVhbHMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIEdyYW1zIGNyZWRpdGVkIGluIHRoZSBjcmVkaXQgcGhhc2UgZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBkaXZpZGVkIGJ5IHRoZSBjdXJyZW50IGdhcyBwcmljZSwgb3IgdGhlIGdsb2JhbCBwZXItdHJhbnNhY3Rpb24gZ2FzIGxpbWl0LmAsXG4gICAgICAgICAgICBnYXNfY3JlZGl0OiBgVGhpcyBwYXJhbWV0ZXIgbWF5IGJlIG5vbi16ZXJvIG9ubHkgZm9yIGV4dGVybmFsIGluYm91bmQgbWVzc2FnZXMuIEl0IGlzIHRoZSBsZXNzZXIgb2YgZWl0aGVyIHRoZSBhbW91bnQgb2YgZ2FzIHRoYXQgY2FuIGJlIHBhaWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlIG9yIHRoZSBtYXhpbXVtIGdhcyBjcmVkaXRgLFxuICAgICAgICAgICAgbW9kZTogYGAsXG4gICAgICAgICAgICBleGl0X2NvZGU6IGBUaGVzZSBwYXJhbWV0ZXIgcmVwcmVzZW50cyB0aGUgc3RhdHVzIHZhbHVlcyByZXR1cm5lZCBieSBUVk07IGZvciBhIHN1Y2Nlc3NmdWwgdHJhbnNhY3Rpb24sIGV4aXRfY29kZSBoYXMgdG8gYmUgMCBvciAxYCxcbiAgICAgICAgICAgIGV4aXRfYXJnOiBgYCxcbiAgICAgICAgICAgIHZtX3N0ZXBzOiBgdGhlIHRvdGFsIG51bWJlciBvZiBzdGVwcyBwZXJmb3JtZWQgYnkgVFZNICh1c3VhbGx5IGVxdWFsIHRvIHR3byBwbHVzIHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zIGV4ZWN1dGVkLCBpbmNsdWRpbmcgaW1wbGljaXQgUkVUcylgLFxuICAgICAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgb3JpZ2luYWwgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgcmVzdWx0aW5nIHN0YXRlIG9mIFRWTS5gLFxuICAgICAgICB9LFxuICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgc21hcnQgY29udHJhY3QgaGFzIHRlcm1pbmF0ZWQgc3VjY2Vzc2Z1bGx5ICh3aXRoIGV4aXQgY29kZSAwIG9yIDEpLCB0aGUgYWN0aW9ucyBmcm9tIHRoZSBsaXN0IGFyZSBwZXJmb3JtZWQuIElmIGl0IGlzIGltcG9zc2libGUgdG8gcGVyZm9ybSBhbGwgb2YgdGhlbeKAlGZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGluc3VmZmljaWVudCBmdW5kcyB0byB0cmFuc2ZlciB3aXRoIGFuIG91dGJvdW5kIG1lc3NhZ2XigJR0aGVuIHRoZSB0cmFuc2FjdGlvbiBpcyBhYm9ydGVkIGFuZCB0aGUgYWNjb3VudCBzdGF0ZSBpcyByb2xsZWQgYmFjay4gVGhlIHRyYW5zYWN0aW9uIGlzIGFsc28gYWJvcnRlZCBpZiB0aGUgc21hcnQgY29udHJhY3QgZGlkIG5vdCB0ZXJtaW5hdGUgc3VjY2Vzc2Z1bGx5LCBvciBpZiBpdCB3YXMgbm90IHBvc3NpYmxlIHRvIGludm9rZSB0aGUgc21hcnQgY29udHJhY3QgYXQgYWxsIGJlY2F1c2UgaXQgaXMgdW5pbml0aWFsaXplZCBvciBmcm96ZW4uYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBgLFxuICAgICAgICAgICAgdmFsaWQ6IGBgLFxuICAgICAgICAgICAgbm9fZnVuZHM6IGBUaGUgZmxhZyBpbmRpY2F0ZXMgYWJzZW5jZSBvZiBmdW5kcyByZXF1aXJlZCB0byBjcmVhdGUgYW4gb3V0Ym91bmQgbWVzc2FnZWAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9jb2RlOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9hcmc6IGBgLFxuICAgICAgICAgICAgdG90X2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc3BlY19hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBtc2dzX2NyZWF0ZWQ6IGBgLFxuICAgICAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgYm91bmNlOiB7XG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLiBBbG1vc3QgYWxsIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCBpbmJvdW5kIG1lc3NhZ2UgKG1pbnVzIGdhcyBwYXltZW50cyBhbmQgZm9yd2FyZGluZyBmZWVzKSBpcyB0cmFuc2ZlcnJlZCB0byB0aGUgZ2VuZXJhdGVkIG1lc3NhZ2UsIHdoaWNoIG90aGVyd2lzZSBoYXMgYW4gZW1wdHkgYm9keS5gLFxuICAgICAgICAgICAgYm91bmNlX3R5cGU6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfY2VsbHM6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfYml0czogYGAsXG4gICAgICAgICAgICByZXFfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgbXNnX2ZlZXM6IGBgLFxuICAgICAgICAgICAgZndkX2ZlZXM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBhYm9ydGVkOiBgYCxcbiAgICAgICAgZGVzdHJveWVkOiBgYCxcbiAgICAgICAgdHQ6IGBgLFxuICAgICAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGZpZWxkcyBiZWxvdyBjb3ZlciBzcGxpdCBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucyBhbmQgbWVyZ2UgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMsIHRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgcmVsZXZhbnQgc2NoZW1lcyBjb3ZlcmVkIGJ5IHRoZSBibG9ja2NoYWluIHNwZWNpZmljYXRpb24uYCxcbiAgICAgICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IHNoYXJkIHByZWZpeGAsXG4gICAgICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IGBgLFxuICAgICAgICAgICAgdGhpc19hZGRyOiBgYCxcbiAgICAgICAgICAgIHNpYmxpbmdfYWRkcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IGBgLFxuICAgICAgICBpbnN0YWxsZWQ6IGBgLFxuICAgICAgICBwcm9vZjogYGAsXG4gICAgICAgIGJvYzogYGAsXG4gICAgfSxcblxuICAgIHNoYXJkRGVzY3I6IHtcbiAgICAgICAgX2RvYzogYFNoYXJkSGFzaGVzIGlzIHJlcHJlc2VudGVkIGJ5IGEgZGljdGlvbmFyeSB3aXRoIDMyLWJpdCB3b3JrY2hhaW5faWRzIGFzIGtleXMsIGFuZCDigJxzaGFyZCBiaW5hcnkgdHJlZXPigJ0sIHJlcHJlc2VudGVkIGJ5IFRMLUIgdHlwZSBCaW5UcmVlIFNoYXJkRGVzY3IsIGFzIHZhbHVlcy4gRWFjaCBsZWFmIG9mIHRoaXMgc2hhcmQgYmluYXJ5IHRyZWUgY29udGFpbnMgYSB2YWx1ZSBvZiB0eXBlIFNoYXJkRGVzY3IsIHdoaWNoIGRlc2NyaWJlcyBhIHNpbmdsZSBzaGFyZCBieSBpbmRpY2F0aW5nIHRoZSBzZXF1ZW5jZSBudW1iZXIgc2VxX25vLCB0aGUgbG9naWNhbCB0aW1lIGx0LCBhbmQgdGhlIGhhc2ggaGFzaCBvZiB0aGUgbGF0ZXN0IChzaWduZWQpIGJsb2NrIG9mIHRoZSBjb3JyZXNwb25kaW5nIHNoYXJkY2hhaW4uYCxcbiAgICAgICAgc2VxX25vOiBgdWludDMyIHNlcXVlbmNlIG51bWJlcmAsXG4gICAgICAgIHJlZ19tY19zZXFubzogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi5gLFxuICAgICAgICBzdGFydF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBzdGFydGAsXG4gICAgICAgIGVuZF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBlbmRgLFxuICAgICAgICByb290X2hhc2g6IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uIFRoZSBzaGFyZCBibG9jayBjb25maWd1cmF0aW9uIGlzIGRlcml2ZWQgZnJvbSB0aGF0IGJsb2NrLmAsXG4gICAgICAgIGZpbGVfaGFzaDogYFNoYXJkIGJsb2NrIGZpbGUgaGFzaC5gLFxuICAgICAgICBiZWZvcmVfc3BsaXQ6IGBUT04gQmxvY2tjaGFpbiBzdXBwb3J0cyBkeW5hbWljIHNoYXJkaW5nLCBzbyB0aGUgc2hhcmQgY29uZmlndXJhdGlvbiBtYXkgY2hhbmdlIGZyb20gYmxvY2sgdG8gYmxvY2sgYmVjYXVzZSBvZiBzaGFyZCBtZXJnZSBhbmQgc3BsaXQgZXZlbnRzLiBUaGVyZWZvcmUsIHdlIGNhbm5vdCBzaW1wbHkgc2F5IHRoYXQgZWFjaCBzaGFyZGNoYWluIGNvcnJlc3BvbmRzIHRvIGEgZml4ZWQgc2V0IG9mIGFjY291bnQgY2hhaW5zLlxuQSBzaGFyZGNoYWluIGJsb2NrIGFuZCBpdHMgc3RhdGUgbWF5IGVhY2ggYmUgY2xhc3NpZmllZCBpbnRvIHR3byBkaXN0aW5jdCBwYXJ0cy4gVGhlIHBhcnRzIHdpdGggdGhlIElTUC1kaWN0YXRlZCBmb3JtIG9mIHdpbGwgYmUgY2FsbGVkIHRoZSBzcGxpdCBwYXJ0cyBvZiB0aGUgYmxvY2sgYW5kIGl0cyBzdGF0ZSwgd2hpbGUgdGhlIHJlbWFpbmRlciB3aWxsIGJlIGNhbGxlZCB0aGUgbm9uLXNwbGl0IHBhcnRzLlxuVGhlIG1hc3RlcmNoYWluIGNhbm5vdCBiZSBzcGxpdCBvciBtZXJnZWQuYCxcbiAgICAgICAgYmVmb3JlX21lcmdlOiBgYCxcbiAgICAgICAgd2FudF9zcGxpdDogYGAsXG4gICAgICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgICAgICBueF9jY191cGRhdGVkOiBgYCxcbiAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICAgICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IGBgLFxuICAgICAgICBtaW5fcmVmX21jX3NlcW5vOiBgYCxcbiAgICAgICAgZ2VuX3V0aW1lOiBgR2VuZXJhdGlvbiB0aW1lIGluIHVpbnQzMmAsXG4gICAgICAgIHNwbGl0X3R5cGU6IGBgLFxuICAgICAgICBzcGxpdDogYGAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOmBBbW91bnQgb2YgZmVlcyBjb2xsZWN0ZWQgaW50IGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZDogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgIF9kb2M6ICdUaGlzIGlzIEJsb2NrJyxcbiAgICBzdGF0dXM6IGBSZXR1cm5zIGJsb2NrIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICBnbG9iYWxfaWQ6IGB1aW50MzIgZ2xvYmFsIGJsb2NrIElEYCxcbiAgICB3YW50X3NwbGl0OiBgYCxcbiAgICBzZXFfbm86IGBgLFxuICAgIGFmdGVyX21lcmdlOiBgYCxcbiAgICBnZW5fdXRpbWU6IGB1aW50IDMyIGdlbmVyYXRpb24gdGltZSBzdGFtcGAsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICBmbGFnczogYGAsXG4gICAgbWFzdGVyX3JlZjogYGAsXG4gICAgcHJldl9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgcHJldl9hbHRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHNoYXJkIG1lcmdlLmAsXG4gICAgcHJldl92ZXJ0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiB2ZXJ0aWNhbCBibG9ja3MuYCxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogYGAsXG4gICAgdmVyc2lvbjogYHVpbjMyIGJsb2NrIHZlcnNpb24gaWRlbnRpZmllcmAsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IGBgLFxuICAgIGJlZm9yZV9zcGxpdDogYGAsXG4gICAgYWZ0ZXJfc3BsaXQ6IGBgLFxuICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgIHZlcnRfc2VxX25vOiBgYCxcbiAgICBzdGFydF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIHN0YXJ0LlxuTG9naWNhbCB0aW1lIGlzIGEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uYCxcbiAgICBlbmRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBlbmQuYCxcbiAgICB3b3JrY2hhaW5faWQ6IGB1aW50MzIgd29ya2NoYWluIGlkZW50aWZpZXJgLFxuICAgIHNoYXJkOiBgYCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgcHJldl9rZXlfYmxvY2tfc2Vxbm86IGBSZXR1cm5zIGEgbnVtYmVyIG9mIGEgcHJldmlvdXMga2V5IGJsb2NrLmAsXG4gICAgZ2VuX3NvZnR3YXJlX3ZlcnNpb246IGBgLFxuICAgIGdlbl9zb2Z0d2FyZV9jYXBhYmlsaXRpZXM6IGBgLFxuICAgIHZhbHVlX2Zsb3c6IHtcbiAgICAgICAgdG9fbmV4dF9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgYW1vdW50IHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgIHRvX25leHRfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdG8gdGhlIG5leHQgYmxvY2suYCxcbiAgICAgICAgZXhwb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgZXhwb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBleHBvcnRlZC5gLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDogYGAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgYCxcbiAgICAgICAgY3JlYXRlZDogYGAsXG4gICAgICAgIGNyZWF0ZWRfb3RoZXI6IGBgLFxuICAgICAgICBpbXBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBpbXBvcnRlZC5gLFxuICAgICAgICBpbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGltcG9ydGVkLmAsXG4gICAgICAgIGZyb21fcHJldl9ibGs6IGBBbW91bnQgb2YgZ3JhbXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxuICAgICAgICBmcm9tX3ByZXZfYmxrX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgdHJhbnNmZXJyZWQgZnJvbSBwcmV2aW91cyBibG9jay5gLFxuICAgICAgICBtaW50ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgbWludGVkIGluIHRoaXMgYmxvY2suYCxcbiAgICAgICAgbWludGVkX290aGVyOiBgYCxcbiAgICAgICAgZmVlc19pbXBvcnRlZDogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBncmFtc2AsXG4gICAgICAgIGZlZXNfaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgIH0sXG4gICAgaW5fbXNnX2Rlc2NyOiBgYCxcbiAgICByYW5kX3NlZWQ6IGBgLFxuICAgIG91dF9tc2dfZGVzY3I6IGBgLFxuICAgIGFjY291bnRfYmxvY2tzOiB7XG4gICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgIHRyYW5zYWN0aW9uczogYGAsXG4gICAgICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICAgICAgb2xkX2hhc2g6IGBvbGQgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgLFxuICAgICAgICAgICAgbmV3X2hhc2g6IGBuZXcgdmVyc2lvbiBvZiBibG9jayBoYXNoZXNgXG4gICAgICAgIH0sXG4gICAgICAgIHRyX2NvdW50OiBgYFxuICAgIH0sXG4gICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgIG5ldzogYGAsXG4gICAgICAgIG5ld19oYXNoOiBgYCxcbiAgICAgICAgbmV3X2RlcHRoOiBgYCxcbiAgICAgICAgb2xkOiBgYCxcbiAgICAgICAgb2xkX2hhc2g6IGBgLFxuICAgICAgICBvbGRfZGVwdGg6IGBgXG4gICAgfSxcbiAgICBtYXN0ZXI6IHtcbiAgICAgICAgbWluX3NoYXJkX2dlbl91dGltZTogJ01pbiBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcbiAgICAgICAgbWF4X3NoYXJkX2dlbl91dGltZTogJ01heCBibG9jayBnZW5lcmF0aW9uIHRpbWUgb2Ygc2hhcmRzJyxcbiAgICAgICAgc2hhcmRfaGFzaGVzOiB7XG4gICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2Ygc2hhcmQgaGFzaGVzYCxcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYFVpbnQzMiB3b3JrY2hhaW4gSURgLFxuICAgICAgICAgICAgc2hhcmQ6IGBTaGFyZCBJRGAsXG4gICAgICAgICAgICBkZXNjcjogYFNoYXJkIGRlc2NyaXB0aW9uYCxcbiAgICAgICAgfSxcbiAgICAgICAgc2hhcmRfZmVlczoge1xuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgYCxcbiAgICAgICAgICAgIHNoYXJkOiBgYCxcbiAgICAgICAgICAgIGZlZXM6IGBBbW91bnQgb2YgZmVlcyBpbiBncmFtc2AsXG4gICAgICAgICAgICBmZWVzX290aGVyOiBgQXJyYXkgb2YgZmVlcyBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llc2AsXG4gICAgICAgICAgICBjcmVhdGU6IGBBbW91bnQgb2YgZmVlcyBjcmVhdGVkIGR1cmluZyBzaGFyZGAsXG4gICAgICAgICAgICBjcmVhdGVfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gZmVlcyBjcmVhdGVkIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzIGR1cmluZyB0aGUgYmxvY2suYCxcbiAgICAgICAgfSxcbiAgICAgICAgcmVjb3Zlcl9jcmVhdGVfbXNnOiBgYCxcbiAgICAgICAgcHJldl9ibGtfc2lnbmF0dXJlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHByZXZpb3VzIGJsb2NrIHNpZ25hdHVyZXNgLFxuICAgICAgICAgICAgbm9kZV9pZDogYGAsXG4gICAgICAgICAgICByOiBgYCxcbiAgICAgICAgICAgIHM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBjb25maWdfYWRkcjogYGAsXG4gICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgcDA6IGBBZGRyZXNzIG9mIGNvbmZpZyBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDE6IGBBZGRyZXNzIG9mIGVsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyOiBgQWRkcmVzcyBvZiBtaW50ZXIgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAzOiBgQWRkcmVzcyBvZiBmZWUgY29sbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwNDogYEFkZHJlc3Mgb2YgVE9OIEROUyByb290IHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA2YCxcbiAgICAgICAgICAgICAgICBtaW50X25ld19wcmljZTogYGAsXG4gICAgICAgICAgICAgICAgbWludF9hZGRfcHJpY2U6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA3OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZ3VyYXRpb24gcGFyYW1ldGVyIDdgLFxuICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBgYCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgR2xvYmFsIHZlcnNpb25gLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIGNhcGFiaWxpdGllczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDk6IGBNYW5kYXRvcnkgcGFyYW1zYCxcbiAgICAgICAgICAgIHAxMDogYENyaXRpY2FsIHBhcmFtc2AsXG4gICAgICAgICAgICBwMTE6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlnIHZvdGluZyBzZXR1cGAsXG4gICAgICAgICAgICAgICAgbm9ybWFsX3BhcmFtczogYGAsXG4gICAgICAgICAgICAgICAgY3JpdGljYWxfcGFyYW1zOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTI6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgYWxsIHdvcmtjaGFpbnMgZGVzY3JpcHRpb25zYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGBgLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBgYCxcbiAgICAgICAgICAgICAgICBmbGFnczogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgYmFzaWM6IGBgLFxuICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiBgYCxcbiAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEJsb2NrIGNyZWF0ZSBmZWVzYCxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3JzIGNvdW50YCxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3Igc3Rha2UgcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogYGBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgU3RvcmFnZSBwcmljZXNgLFxuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjE6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjI6IGBCbG9jayBsaW1pdHMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgIHAyNDogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyNTogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ2F0Y2hhaW4gY29uZmlnYCxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uc2Vuc3VzIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IGBgLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBgYCxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IGBgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXG4gICAgICAgICAgICBwMzI6IGBQcmV2aW91cyB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzM6IGBQcmV2aW91cyB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM1OiBgQ3VycmVudCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNjogYE5leHQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiB2YWxpZGF0b3Igc2lnbmVkIHRlbXByb3Jhcnkga2V5c2AsXG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IGBgLFxuICAgICAgICAgICAgICAgIHNlcW5vOiBgYCxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IGBgLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9LFxufSxcblxuYmxvY2tTaWduYXR1cmVzOiB7XG4gICAgX2RvYzogYFNldCBvZiB2YWxpZGF0b3JcXCdzIHNpZ25hdHVyZXMgZm9yIHRoZSBCbG9jayB3aXRoIGNvcnJlc3BvbmQgaWRgLFxuICAgIGdlbl91dGltZTogYFNpZ25lZCBibG9jaydzIGdlbl91dGltZWAsXG4gICAgc2VxX25vOiBgU2lnbmVkIGJsb2NrJ3Mgc2VxX25vYCxcbiAgICB3b3JrY2hhaW5faWQ6IGBTaWduZWQgYmxvY2sncyB3b3JrY2hhaW5faWRgLFxuICAgIHByb29mOiBgU2lnbmVkIGJsb2NrJ3MgbWVya2xlIHByb29mYCxcbiAgICB2YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcbiAgICBjYXRjaGFpbl9zZXFubzogYGAsXG4gICAgc2lnX3dlaWdodDogYGAsXG4gICAgc2lnbmF0dXJlczoge1xuICAgICAgICBfZG9jOiBgQXJyYXkgb2Ygc2lnbmF0dXJlcyBmcm9tIGJsb2NrJ3MgdmFsaWRhdG9yc2AsXG4gICAgICAgIG5vZGVfaWQ6IGBWYWxpZGF0b3IgSURgLFxuICAgICAgICByOiBgJ1InIHBhcnQgb2Ygc2lnbmF0dXJlYCxcbiAgICAgICAgczogYCdzJyBwYXJ0IG9mIHNpZ25hdHVyZWAsXG4gICAgfVxufVxuXG59O1xuIl19