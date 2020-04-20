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
    data: `If present, contains smart-contract data encoded with in base64.`,
    library: `If present, contains library code used in smart-contract.`,
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
    split_depth: `This is only used for special contracts in masterchain to deploy messages.`,
    tick: `This is only used for special contracts in masterchain to deploy messages.`,
    tock: `This is only used for special contracts in masterchain to deploy messages`,
    code: `Represents contract code in deploy messages.`,
    data: `Represents initial data for a contract in deploy messages`,
    library: `Represents contract library in deploy messages`,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJ0cmFuc2FjdGlvbiIsIl8iLCJjb2xsZWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInNoYXJkRGVzY3IiLCJzZXFfbm8iLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWQiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIiwiYmxvY2tTaWduYXR1cmVzIiwidmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydCIsImNhdGNoYWluX3NlcW5vIiwic2lnX3dlaWdodCIsInNpZ25hdHVyZXMiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ08sTUFBTUEsSUFBSSxHQUFHO0FBQ2hCQyxFQUFBQSxPQUFPLEVBQUU7QUFDTEMsSUFBQUEsSUFBSSxFQUFHOzs7Ozs7Ozs7Ozs7WUFERjtBQWNMQyxJQUFBQSxFQUFFLEVBQUcsRUFkQTtBQWVMQyxJQUFBQSxZQUFZLEVBQUcsaURBZlY7QUFnQkxDLElBQUFBLFFBQVEsRUFBRzs7Ozs7Ozs7O1NBaEJOO0FBMEJMQyxJQUFBQSxTQUFTLEVBQUc7Ozs7Ozs7Ozs7Ozs7aUJBMUJQO0FBd0NMQyxJQUFBQSxXQUFXLEVBQUc7Ozs7Ozs7Ozs7U0F4Q1Q7QUFtRExDLElBQUFBLGFBQWEsRUFBRyxHQW5EWDtBQW9ETEMsSUFBQUEsT0FBTyxFQUFHOzs7Ozs7OztTQXBETDtBQTZETEMsSUFBQUEsYUFBYSxFQUFHLEdBN0RYO0FBOERMQyxJQUFBQSxXQUFXLEVBQUcscUVBOURUO0FBK0RMQyxJQUFBQSxJQUFJLEVBQUcsd0pBL0RGO0FBZ0VMQyxJQUFBQSxJQUFJLEVBQUc7Ozs7Ozs7Ozs7U0FoRUY7QUEyRUxDLElBQUFBLElBQUksRUFBRzs7Ozs7Ozs7Ozs7U0EzRUY7QUF1RkxDLElBQUFBLElBQUksRUFBRyxrRUF2RkY7QUF3RkxDLElBQUFBLE9BQU8sRUFBRywyREF4Rkw7QUF5RkxDLElBQUFBLEtBQUssRUFBRyw4SEF6Rkg7QUEwRkxDLElBQUFBLEdBQUcsRUFBRztBQTFGRCxHQURPO0FBNkZoQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xqQixJQUFBQSxJQUFJLEVBQUc7Ozs7b0ZBREY7QUFNTGtCLElBQUFBLFFBQVEsRUFBRyw4QkFOTjtBQU9MQyxJQUFBQSxNQUFNLEVBQUcsb0VBUEo7QUFRTEMsSUFBQUEsUUFBUSxFQUFHLDhIQVJOO0FBU0xDLElBQUFBLElBQUksRUFBRyx1REFURjtBQVVMWixJQUFBQSxXQUFXLEVBQUcsNEVBVlQ7QUFXTEMsSUFBQUEsSUFBSSxFQUFHLDRFQVhGO0FBWUxDLElBQUFBLElBQUksRUFBRywyRUFaRjtBQWFMQyxJQUFBQSxJQUFJLEVBQUcsOENBYkY7QUFjTEMsSUFBQUEsSUFBSSxFQUFHLDJEQWRGO0FBZUxDLElBQUFBLE9BQU8sRUFBRyxnREFmTDtBQWdCTFEsSUFBQUEsR0FBRyxFQUFHLCtCQWhCRDtBQWlCTEMsSUFBQUEsR0FBRyxFQUFHLG9DQWpCRDtBQWtCTEMsSUFBQUEsZ0JBQWdCLEVBQUcsZ0RBbEJkO0FBbUJMQyxJQUFBQSxnQkFBZ0IsRUFBRyxxREFuQmQ7QUFvQkxDLElBQUFBLFVBQVUsRUFBRyx3RUFwQlI7QUFxQkxDLElBQUFBLFVBQVUsRUFBRywyS0FyQlI7QUFzQkxDLElBQUFBLFlBQVksRUFBRyxrQ0F0QlY7QUF1QkxDLElBQUFBLE9BQU8sRUFBRywrS0F2Qkw7QUF3QkxDLElBQUFBLE9BQU8sRUFBRyxrTUF4Qkw7QUF5QkxDLElBQUFBLFVBQVUsRUFBRyxFQXpCUjtBQTBCTEMsSUFBQUEsTUFBTSxFQUFHLDhOQTFCSjtBQTJCTEMsSUFBQUEsT0FBTyxFQUFHLCtOQTNCTDtBQTRCTEMsSUFBQUEsS0FBSyxFQUFHLDJCQTVCSDtBQTZCTEMsSUFBQUEsV0FBVyxFQUFHLDRCQTdCVDtBQThCTHBCLElBQUFBLEtBQUssRUFBRyw4SEE5Qkg7QUErQkxDLElBQUFBLEdBQUcsRUFBRztBQS9CRCxHQTdGTztBQWdJaEJvQixFQUFBQSxXQUFXLEVBQUc7QUFDVnBDLElBQUFBLElBQUksRUFBRSxpQkFESTtBQUVWcUMsSUFBQUEsQ0FBQyxFQUFFO0FBQUNDLE1BQUFBLFVBQVUsRUFBRTtBQUFiLEtBRk87QUFHVkMsSUFBQUEsT0FBTyxFQUFHLG9GQUhBO0FBSVZwQixJQUFBQSxNQUFNLEVBQUcsK0JBSkM7QUFLVkMsSUFBQUEsUUFBUSxFQUFHLEVBTEQ7QUFNVm9CLElBQUFBLFlBQVksRUFBRyxFQU5MO0FBT1Z0QyxJQUFBQSxZQUFZLEVBQUcsMERBUEw7QUFRVnVDLElBQUFBLEVBQUUsRUFBRywrU0FSSztBQVNWQyxJQUFBQSxlQUFlLEVBQUcsRUFUUjtBQVVWQyxJQUFBQSxhQUFhLEVBQUcsRUFWTjtBQVdWQyxJQUFBQSxHQUFHLEVBQUcsRUFYSTtBQVlWQyxJQUFBQSxVQUFVLEVBQUcsbUhBWkg7QUFhVkMsSUFBQUEsV0FBVyxFQUFHLGtLQWJKO0FBY1ZDLElBQUFBLFVBQVUsRUFBRyx5SEFkSDtBQWVWQyxJQUFBQSxNQUFNLEVBQUcsRUFmQztBQWdCVkMsSUFBQUEsVUFBVSxFQUFHLEVBaEJIO0FBaUJWQyxJQUFBQSxRQUFRLEVBQUcsK0VBakJEO0FBa0JWQyxJQUFBQSxZQUFZLEVBQUcsRUFsQkw7QUFtQlZDLElBQUFBLFVBQVUsRUFBRyxrRkFuQkg7QUFvQlZDLElBQUFBLGdCQUFnQixFQUFHLGtGQXBCVDtBQXFCVkMsSUFBQUEsUUFBUSxFQUFHLHFCQXJCRDtBQXNCVkMsSUFBQUEsUUFBUSxFQUFHLHFCQXRCRDtBQXVCVkMsSUFBQUEsWUFBWSxFQUFHLEVBdkJMO0FBd0JWQyxJQUFBQSxPQUFPLEVBQUU7QUFDTEMsTUFBQUEsc0JBQXNCLEVBQUcsbUVBRHBCO0FBRUxDLE1BQUFBLGdCQUFnQixFQUFHLDJFQUZkO0FBR0xDLE1BQUFBLGFBQWEsRUFBRztBQUhYLEtBeEJDO0FBOEJWQyxJQUFBQSxNQUFNLEVBQUU7QUFDSjdELE1BQUFBLElBQUksRUFBRyw0SUFESDtBQUVKOEQsTUFBQUEsa0JBQWtCLEVBQUcsdU9BRmpCO0FBR0pELE1BQUFBLE1BQU0sRUFBRyxFQUhMO0FBSUpFLE1BQUFBLFlBQVksRUFBRztBQUpYLEtBOUJFO0FBb0NWQyxJQUFBQSxPQUFPLEVBQUU7QUFDTGhFLE1BQUFBLElBQUksRUFBRzt3SkFERjtBQUdMaUUsTUFBQUEsWUFBWSxFQUFHLEVBSFY7QUFJTEMsTUFBQUEsY0FBYyxFQUFHLHNPQUpaO0FBS0xDLE1BQUFBLE9BQU8sRUFBRyw2REFMTDtBQU1MQyxNQUFBQSxjQUFjLEVBQUcsd1JBTlo7QUFPTEMsTUFBQUEsaUJBQWlCLEVBQUcsOEhBUGY7QUFRTEMsTUFBQUEsUUFBUSxFQUFHLGlNQVJOO0FBU0xDLE1BQUFBLFFBQVEsRUFBRyxFQVROO0FBVUxDLE1BQUFBLFNBQVMsRUFBRyx3UEFWUDtBQVdMQyxNQUFBQSxVQUFVLEVBQUcscUxBWFI7QUFZTEMsTUFBQUEsSUFBSSxFQUFHLEVBWkY7QUFhTEMsTUFBQUEsU0FBUyxFQUFHLHdIQWJQO0FBY0xDLE1BQUFBLFFBQVEsRUFBRyxFQWROO0FBZUxDLE1BQUFBLFFBQVEsRUFBRyxxSUFmTjtBQWdCTEMsTUFBQUEsa0JBQWtCLEVBQUcsMkVBaEJoQjtBQWlCTEMsTUFBQUEsbUJBQW1CLEVBQUc7QUFqQmpCLEtBcENDO0FBdURWQyxJQUFBQSxNQUFNLEVBQUU7QUFDSmhGLE1BQUFBLElBQUksRUFBRyxpZkFESDtBQUVKbUUsTUFBQUEsT0FBTyxFQUFHLEVBRk47QUFHSmMsTUFBQUEsS0FBSyxFQUFHLEVBSEo7QUFJSkMsTUFBQUEsUUFBUSxFQUFHLDRFQUpQO0FBS0p0QixNQUFBQSxhQUFhLEVBQUcsRUFMWjtBQU1KdUIsTUFBQUEsY0FBYyxFQUFHLEVBTmI7QUFPSkMsTUFBQUEsaUJBQWlCLEVBQUcsRUFQaEI7QUFRSkMsTUFBQUEsV0FBVyxFQUFHLEVBUlY7QUFTSkMsTUFBQUEsVUFBVSxFQUFHLEVBVFQ7QUFVSkMsTUFBQUEsV0FBVyxFQUFHLEVBVlY7QUFXSkMsTUFBQUEsWUFBWSxFQUFHLEVBWFg7QUFZSkMsTUFBQUEsZUFBZSxFQUFHLEVBWmQ7QUFhSkMsTUFBQUEsWUFBWSxFQUFHLEVBYlg7QUFjSkMsTUFBQUEsZ0JBQWdCLEVBQUcsRUFkZjtBQWVKQyxNQUFBQSxvQkFBb0IsRUFBRyxFQWZuQjtBQWdCSkMsTUFBQUEsbUJBQW1CLEVBQUc7QUFoQmxCLEtBdkRFO0FBeUVWN0QsSUFBQUEsTUFBTSxFQUFFO0FBQ0poQyxNQUFBQSxJQUFJLEVBQUcsdVhBREg7QUFFSjhGLE1BQUFBLFdBQVcsRUFBRyxFQUZWO0FBR0pDLE1BQUFBLGNBQWMsRUFBRyxFQUhiO0FBSUpDLE1BQUFBLGFBQWEsRUFBRyxFQUpaO0FBS0pDLE1BQUFBLFlBQVksRUFBRyxFQUxYO0FBTUpDLE1BQUFBLFFBQVEsRUFBRyxFQU5QO0FBT0pDLE1BQUFBLFFBQVEsRUFBRztBQVBQLEtBekVFO0FBa0ZWQyxJQUFBQSxPQUFPLEVBQUcsRUFsRkE7QUFtRlZDLElBQUFBLFNBQVMsRUFBRyxFQW5GRjtBQW9GVkMsSUFBQUEsRUFBRSxFQUFHLEVBcEZLO0FBcUZWQyxJQUFBQSxVQUFVLEVBQUU7QUFDUnZHLE1BQUFBLElBQUksRUFBRyxrTUFEQztBQUVSd0csTUFBQUEsaUJBQWlCLEVBQUcsb0NBRlo7QUFHUkMsTUFBQUEsZUFBZSxFQUFHLEVBSFY7QUFJUkMsTUFBQUEsU0FBUyxFQUFHLEVBSko7QUFLUkMsTUFBQUEsWUFBWSxFQUFHO0FBTFAsS0FyRkY7QUE0RlZDLElBQUFBLG1CQUFtQixFQUFHLEVBNUZaO0FBNkZWQyxJQUFBQSxTQUFTLEVBQUcsRUE3RkY7QUE4RlY5RixJQUFBQSxLQUFLLEVBQUcsRUE5RkU7QUErRlZDLElBQUFBLEdBQUcsRUFBRztBQS9GSSxHQWhJRTtBQWtPaEI4RixFQUFBQSxVQUFVLEVBQUU7QUFDUjlHLElBQUFBLElBQUksRUFBRyx3WkFEQztBQUVSK0csSUFBQUEsTUFBTSxFQUFHLHdCQUZEO0FBR1JDLElBQUFBLFlBQVksRUFBRyxrRUFIUDtBQUlSQyxJQUFBQSxRQUFRLEVBQUcsc0NBSkg7QUFLUkMsSUFBQUEsTUFBTSxFQUFHLG9DQUxEO0FBTVJDLElBQUFBLFNBQVMsRUFBRyw0SEFOSjtBQU9SQyxJQUFBQSxTQUFTLEVBQUcsd0JBUEo7QUFRUkMsSUFBQUEsWUFBWSxFQUFHOzsyQ0FSUDtBQVdSQyxJQUFBQSxZQUFZLEVBQUcsRUFYUDtBQVlSQyxJQUFBQSxVQUFVLEVBQUcsRUFaTDtBQWFSQyxJQUFBQSxVQUFVLEVBQUcsRUFiTDtBQWNSQyxJQUFBQSxhQUFhLEVBQUcsRUFkUjtBQWVSQyxJQUFBQSxLQUFLLEVBQUcsRUFmQTtBQWdCUkMsSUFBQUEsbUJBQW1CLEVBQUcsRUFoQmQ7QUFpQlJDLElBQUFBLG9CQUFvQixFQUFHLEVBakJmO0FBa0JSQyxJQUFBQSxnQkFBZ0IsRUFBRyxFQWxCWDtBQW1CUkMsSUFBQUEsU0FBUyxFQUFHLDJCQW5CSjtBQW9CUkMsSUFBQUEsVUFBVSxFQUFHLEVBcEJMO0FBcUJSQyxJQUFBQSxLQUFLLEVBQUcsRUFyQkE7QUFzQlJDLElBQUFBLGNBQWMsRUFBRSxrREF0QlI7QUF1QlJDLElBQUFBLG9CQUFvQixFQUFHLGdFQXZCZjtBQXdCUkMsSUFBQUEsYUFBYSxFQUFHLGlEQXhCUjtBQXlCUkMsSUFBQUEsbUJBQW1CLEVBQUc7QUF6QmQsR0FsT0k7QUE4UGhCQyxFQUFBQSxLQUFLLEVBQUU7QUFDUHJJLElBQUFBLElBQUksRUFBRSxlQURDO0FBRVBtQixJQUFBQSxNQUFNLEVBQUcsaUNBRkY7QUFHUG1ILElBQUFBLFNBQVMsRUFBRyx3QkFITDtBQUlQZixJQUFBQSxVQUFVLEVBQUcsRUFKTjtBQUtQUixJQUFBQSxNQUFNLEVBQUcsRUFMRjtBQU1Qd0IsSUFBQUEsV0FBVyxFQUFHLEVBTlA7QUFPUFQsSUFBQUEsU0FBUyxFQUFHLCtCQVBMO0FBUVBVLElBQUFBLGtCQUFrQixFQUFHLEVBUmQ7QUFTUGQsSUFBQUEsS0FBSyxFQUFHLEVBVEQ7QUFVUGUsSUFBQUEsVUFBVSxFQUFHLEVBVk47QUFXUEMsSUFBQUEsUUFBUSxFQUFHLDhDQVhKO0FBWVBDLElBQUFBLFlBQVksRUFBRyxxRUFaUjtBQWFQQyxJQUFBQSxhQUFhLEVBQUcseUVBYlQ7QUFjUEMsSUFBQUEsaUJBQWlCLEVBQUcsRUFkYjtBQWVQQyxJQUFBQSxPQUFPLEVBQUcsZ0NBZkg7QUFnQlBDLElBQUFBLDZCQUE2QixFQUFHLEVBaEJ6QjtBQWlCUDFCLElBQUFBLFlBQVksRUFBRyxFQWpCUjtBQWtCUDJCLElBQUFBLFdBQVcsRUFBRyxFQWxCUDtBQW1CUHhCLElBQUFBLFVBQVUsRUFBRyxFQW5CTjtBQW9CUHlCLElBQUFBLFdBQVcsRUFBRyxFQXBCUDtBQXFCUGhDLElBQUFBLFFBQVEsRUFBRzs0UUFyQko7QUF1QlBDLElBQUFBLE1BQU0sRUFBRyxxRUF2QkY7QUF3QlBoSCxJQUFBQSxZQUFZLEVBQUcsNkJBeEJSO0FBeUJQZ0osSUFBQUEsS0FBSyxFQUFHLEVBekJEO0FBMEJQckIsSUFBQUEsZ0JBQWdCLEVBQUcsa0VBMUJaO0FBMkJQc0IsSUFBQUEsb0JBQW9CLEVBQUcsMkNBM0JoQjtBQTRCUEMsSUFBQUEsb0JBQW9CLEVBQUcsRUE1QmhCO0FBNkJQQyxJQUFBQSx5QkFBeUIsRUFBRyxFQTdCckI7QUE4QlBDLElBQUFBLFVBQVUsRUFBRTtBQUNSQyxNQUFBQSxXQUFXLEVBQUcsMkNBRE47QUFFUkMsTUFBQUEsaUJBQWlCLEVBQUcsd0RBRlo7QUFHUkMsTUFBQUEsUUFBUSxFQUFHLDJCQUhIO0FBSVJDLE1BQUFBLGNBQWMsRUFBRywrQ0FKVDtBQUtSekIsTUFBQUEsY0FBYyxFQUFHLEVBTFQ7QUFNUkMsTUFBQUEsb0JBQW9CLEVBQUcsRUFOZjtBQU9SeUIsTUFBQUEsT0FBTyxFQUFHLEVBUEY7QUFRUkMsTUFBQUEsYUFBYSxFQUFHLEVBUlI7QUFTUkMsTUFBQUEsUUFBUSxFQUFHLDJCQVRIO0FBVVJDLE1BQUFBLGNBQWMsRUFBRywrQ0FWVDtBQVdSQyxNQUFBQSxhQUFhLEVBQUcsa0RBWFI7QUFZUkMsTUFBQUEsbUJBQW1CLEVBQUcsc0VBWmQ7QUFhUkMsTUFBQUEsTUFBTSxFQUFHLHVDQWJEO0FBY1JDLE1BQUFBLFlBQVksRUFBRyxFQWRQO0FBZVJDLE1BQUFBLGFBQWEsRUFBRyxnQ0FmUjtBQWdCUkMsTUFBQUEsbUJBQW1CLEVBQUc7QUFoQmQsS0E5Qkw7QUFnRFBDLElBQUFBLFlBQVksRUFBRyxFQWhEUjtBQWlEUEMsSUFBQUEsU0FBUyxFQUFHLEVBakRMO0FBa0RQQyxJQUFBQSxhQUFhLEVBQUcsRUFsRFQ7QUFtRFBDLElBQUFBLGNBQWMsRUFBRTtBQUNaaEksTUFBQUEsWUFBWSxFQUFHLEVBREg7QUFFWmlJLE1BQUFBLFlBQVksRUFBRyxFQUZIO0FBR1pDLE1BQUFBLFlBQVksRUFBRTtBQUNWcEgsUUFBQUEsUUFBUSxFQUFHLDZCQUREO0FBRVZDLFFBQUFBLFFBQVEsRUFBRztBQUZELE9BSEY7QUFPWm9ILE1BQUFBLFFBQVEsRUFBRztBQVBDLEtBbkRUO0FBNERQRCxJQUFBQSxZQUFZLEVBQUU7QUFDVkUsTUFBQUEsR0FBRyxFQUFHLEVBREk7QUFFVnJILE1BQUFBLFFBQVEsRUFBRyxFQUZEO0FBR1ZzSCxNQUFBQSxTQUFTLEVBQUcsRUFIRjtBQUlWQyxNQUFBQSxHQUFHLEVBQUcsRUFKSTtBQUtWeEgsTUFBQUEsUUFBUSxFQUFHLEVBTEQ7QUFNVnlILE1BQUFBLFNBQVMsRUFBRztBQU5GLEtBNURQO0FBb0VQQyxJQUFBQSxNQUFNLEVBQUU7QUFDSkMsTUFBQUEsbUJBQW1CLEVBQUUscUNBRGpCO0FBRUpDLE1BQUFBLG1CQUFtQixFQUFFLHFDQUZqQjtBQUdKQyxNQUFBQSxZQUFZLEVBQUU7QUFDVm5MLFFBQUFBLElBQUksRUFBRyx1QkFERztBQUVWRSxRQUFBQSxZQUFZLEVBQUcscUJBRkw7QUFHVmdKLFFBQUFBLEtBQUssRUFBRyxVQUhFO0FBSVZrQyxRQUFBQSxLQUFLLEVBQUc7QUFKRSxPQUhWO0FBU0pDLE1BQUFBLFVBQVUsRUFBRTtBQUNSbkwsUUFBQUEsWUFBWSxFQUFHLEVBRFA7QUFFUmdKLFFBQUFBLEtBQUssRUFBRyxFQUZBO0FBR1JvQyxRQUFBQSxJQUFJLEVBQUcseUJBSEM7QUFJUkMsUUFBQUEsVUFBVSxFQUFHLDZDQUpMO0FBS1JDLFFBQUFBLE1BQU0sRUFBRyxxQ0FMRDtBQU1SQyxRQUFBQSxZQUFZLEVBQUc7QUFOUCxPQVRSO0FBaUJKQyxNQUFBQSxrQkFBa0IsRUFBRyxFQWpCakI7QUFrQkpDLE1BQUFBLG1CQUFtQixFQUFFO0FBQ2pCM0wsUUFBQUEsSUFBSSxFQUFHLG9DQURVO0FBRWpCNEwsUUFBQUEsT0FBTyxFQUFHLEVBRk87QUFHakJDLFFBQUFBLENBQUMsRUFBRyxFQUhhO0FBSWpCQyxRQUFBQSxDQUFDLEVBQUc7QUFKYSxPQWxCakI7QUF3QkpDLE1BQUFBLFdBQVcsRUFBRyxFQXhCVjtBQXlCSkMsTUFBQUEsTUFBTSxFQUFFO0FBQ0pDLFFBQUFBLEVBQUUsRUFBRyxxREFERDtBQUVKQyxRQUFBQSxFQUFFLEVBQUcsc0RBRkQ7QUFHSkMsUUFBQUEsRUFBRSxFQUFHLHFEQUhEO0FBSUpDLFFBQUFBLEVBQUUsRUFBRyw0REFKRDtBQUtKQyxRQUFBQSxFQUFFLEVBQUcsMkRBTEQ7QUFNSkMsUUFBQUEsRUFBRSxFQUFFO0FBQ0F0TSxVQUFBQSxJQUFJLEVBQUcsMkJBRFA7QUFFQXVNLFVBQUFBLGNBQWMsRUFBRyxFQUZqQjtBQUdBQyxVQUFBQSxjQUFjLEVBQUc7QUFIakIsU0FOQTtBQVdKQyxRQUFBQSxFQUFFLEVBQUU7QUFDQXpNLFVBQUFBLElBQUksRUFBRywyQkFEUDtBQUVBME0sVUFBQUEsUUFBUSxFQUFHLEVBRlg7QUFHQXhLLFVBQUFBLEtBQUssRUFBRztBQUhSLFNBWEE7QUFnQkp5SyxRQUFBQSxFQUFFLEVBQUU7QUFDQTNNLFVBQUFBLElBQUksRUFBRyxnQkFEUDtBQUVBOEksVUFBQUEsT0FBTyxFQUFHLEVBRlY7QUFHQThELFVBQUFBLFlBQVksRUFBRztBQUhmLFNBaEJBO0FBcUJKQyxRQUFBQSxFQUFFLEVBQUcsa0JBckJEO0FBc0JKQyxRQUFBQSxHQUFHLEVBQUcsaUJBdEJGO0FBdUJKQyxRQUFBQSxHQUFHLEVBQUU7QUFDRC9NLFVBQUFBLElBQUksRUFBRyxxQkFETjtBQUVEZ04sVUFBQUEsYUFBYSxFQUFHLEVBRmY7QUFHREMsVUFBQUEsZUFBZSxFQUFHO0FBSGpCLFNBdkJEO0FBNEJKQyxRQUFBQSxHQUFHLEVBQUU7QUFDRGxOLFVBQUFBLElBQUksRUFBRyxzQ0FETjtBQUVERSxVQUFBQSxZQUFZLEVBQUcsRUFGZDtBQUdEaU4sVUFBQUEsYUFBYSxFQUFHLEVBSGY7QUFJREMsVUFBQUEsZ0JBQWdCLEVBQUcsRUFKbEI7QUFLREMsVUFBQUEsU0FBUyxFQUFHLEVBTFg7QUFNREMsVUFBQUEsU0FBUyxFQUFHLEVBTlg7QUFPREMsVUFBQUEsTUFBTSxFQUFHLEVBUFI7QUFRREMsVUFBQUEsV0FBVyxFQUFHLEVBUmI7QUFTRDlGLFVBQUFBLEtBQUssRUFBRyxFQVRQO0FBVUQrRixVQUFBQSxtQkFBbUIsRUFBRyxFQVZyQjtBQVdEQyxVQUFBQSxtQkFBbUIsRUFBRyxFQVhyQjtBQVlENUUsVUFBQUEsT0FBTyxFQUFHLEVBWlQ7QUFhRDZFLFVBQUFBLEtBQUssRUFBRyxFQWJQO0FBY0RDLFVBQUFBLFVBQVUsRUFBRyxFQWRaO0FBZURDLFVBQUFBLE9BQU8sRUFBRyxFQWZUO0FBZ0JEQyxVQUFBQSxZQUFZLEVBQUcsRUFoQmQ7QUFpQkRDLFVBQUFBLFlBQVksRUFBRyxFQWpCZDtBQWtCREMsVUFBQUEsYUFBYSxFQUFHLEVBbEJmO0FBbUJEQyxVQUFBQSxpQkFBaUIsRUFBRztBQW5CbkIsU0E1QkQ7QUFpREpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEbE8sVUFBQUEsSUFBSSxFQUFHLG1CQUROO0FBRURtTyxVQUFBQSxxQkFBcUIsRUFBRyxFQUZ2QjtBQUdEQyxVQUFBQSxtQkFBbUIsRUFBRztBQUhyQixTQWpERDtBQXNESkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0RyTyxVQUFBQSxJQUFJLEVBQUcscUJBRE47QUFFRHNPLFVBQUFBLHNCQUFzQixFQUFHLEVBRnhCO0FBR0RDLFVBQUFBLHNCQUFzQixFQUFHLEVBSHhCO0FBSURDLFVBQUFBLG9CQUFvQixFQUFHLEVBSnRCO0FBS0RDLFVBQUFBLGNBQWMsRUFBRztBQUxoQixTQXRERDtBQTZESkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0QxTyxVQUFBQSxJQUFJLEVBQUcsa0JBRE47QUFFRDJPLFVBQUFBLGNBQWMsRUFBRyxFQUZoQjtBQUdEQyxVQUFBQSxtQkFBbUIsRUFBRyxFQUhyQjtBQUlEQyxVQUFBQSxjQUFjLEVBQUc7QUFKaEIsU0E3REQ7QUFtRUpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEOU8sVUFBQUEsSUFBSSxFQUFHLDRCQUROO0FBRUQrTyxVQUFBQSxTQUFTLEVBQUcsRUFGWDtBQUdEQyxVQUFBQSxTQUFTLEVBQUcsRUFIWDtBQUlEQyxVQUFBQSxlQUFlLEVBQUcsRUFKakI7QUFLREMsVUFBQUEsZ0JBQWdCLEVBQUc7QUFMbEIsU0FuRUQ7QUEwRUpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEblAsVUFBQUEsSUFBSSxFQUFHLGdCQUROO0FBRURvUCxVQUFBQSxXQUFXLEVBQUcsRUFGYjtBQUdEQyxVQUFBQSxZQUFZLEVBQUcsRUFIZDtBQUlEQyxVQUFBQSxhQUFhLEVBQUcsRUFKZjtBQUtEQyxVQUFBQSxlQUFlLEVBQUcsRUFMakI7QUFNREMsVUFBQUEsZ0JBQWdCLEVBQUc7QUFObEIsU0ExRUQ7QUFrRkpDLFFBQUFBLEdBQUcsRUFBRywwQ0FsRkY7QUFtRkpDLFFBQUFBLEdBQUcsRUFBRyxxQ0FuRkY7QUFvRkpDLFFBQUFBLEdBQUcsRUFBRyxpQ0FwRkY7QUFxRkpDLFFBQUFBLEdBQUcsRUFBRyw0QkFyRkY7QUFzRkpDLFFBQUFBLEdBQUcsRUFBRywyQ0F0RkY7QUF1RkpDLFFBQUFBLEdBQUcsRUFBRyxzQ0F2RkY7QUF3RkpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEL1AsVUFBQUEsSUFBSSxFQUFHLGlCQUROO0FBRURnUSxVQUFBQSxvQkFBb0IsRUFBRyxFQUZ0QjtBQUdEQyxVQUFBQSx1QkFBdUIsRUFBRyxFQUh6QjtBQUlEQyxVQUFBQSx5QkFBeUIsRUFBRyxFQUozQjtBQUtEQyxVQUFBQSxvQkFBb0IsRUFBRztBQUx0QixTQXhGRDtBQStGSkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0RwUSxVQUFBQSxJQUFJLEVBQUcsa0JBRE47QUFFRHFRLFVBQUFBLGdCQUFnQixFQUFHLEVBRmxCO0FBR0RDLFVBQUFBLHVCQUF1QixFQUFHLEVBSHpCO0FBSURDLFVBQUFBLG9CQUFvQixFQUFHLEVBSnRCO0FBS0RDLFVBQUFBLGFBQWEsRUFBRyxFQUxmO0FBTURDLFVBQUFBLGdCQUFnQixFQUFHLEVBTmxCO0FBT0RDLFVBQUFBLGlCQUFpQixFQUFHLEVBUG5CO0FBUURDLFVBQUFBLGVBQWUsRUFBRyxFQVJqQjtBQVNEQyxVQUFBQSxrQkFBa0IsRUFBRztBQVRwQixTQS9GRDtBQTBHSkMsUUFBQUEsR0FBRyxFQUFHLGdEQTFHRjtBQTJHSkMsUUFBQUEsR0FBRyxFQUFHLHlCQTNHRjtBQTRHSkMsUUFBQUEsR0FBRyxFQUFHLG9DQTVHRjtBQTZHSkMsUUFBQUEsR0FBRyxFQUFHLHdCQTdHRjtBQThHSkMsUUFBQUEsR0FBRyxFQUFHLG1DQTlHRjtBQStHSkMsUUFBQUEsR0FBRyxFQUFHLHFCQS9HRjtBQWdISkMsUUFBQUEsR0FBRyxFQUFHLGdDQWhIRjtBQWlISkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0RwUixVQUFBQSxJQUFJLEVBQUcsMkNBRE47QUFFRHFSLFVBQUFBLFNBQVMsRUFBRyxFQUZYO0FBR0RDLFVBQUFBLGVBQWUsRUFBRyxFQUhqQjtBQUlEQyxVQUFBQSxLQUFLLEVBQUcsRUFKUDtBQUtEQyxVQUFBQSxXQUFXLEVBQUcsRUFMYjtBQU1EQyxVQUFBQSxXQUFXLEVBQUcsRUFOYjtBQU9EQyxVQUFBQSxXQUFXLEVBQUc7QUFQYjtBQWpIRDtBQXpCSjtBQXBFRCxHQTlQUztBQXlkcEJDLEVBQUFBLGVBQWUsRUFBRTtBQUNiM1IsSUFBQUEsSUFBSSxFQUFHLGlFQURNO0FBRWI4SCxJQUFBQSxTQUFTLEVBQUcsMEJBRkM7QUFHYmYsSUFBQUEsTUFBTSxFQUFHLHVCQUhJO0FBSWI3RyxJQUFBQSxZQUFZLEVBQUcsNkJBSkY7QUFLYmEsSUFBQUEsS0FBSyxFQUFHLDZCQUxLO0FBTWI2USxJQUFBQSx5QkFBeUIsRUFBRyxFQU5mO0FBT2JDLElBQUFBLGNBQWMsRUFBRyxFQVBKO0FBUWJDLElBQUFBLFVBQVUsRUFBRyxFQVJBO0FBU2JDLElBQUFBLFVBQVUsRUFBRTtBQUNSL1IsTUFBQUEsSUFBSSxFQUFHLDZDQURDO0FBRVI0TCxNQUFBQSxPQUFPLEVBQUcsY0FGRjtBQUdSQyxNQUFBQSxDQUFDLEVBQUcsdUJBSEk7QUFJUkMsTUFBQUEsQ0FBQyxFQUFHO0FBSkk7QUFUQztBQXpkRyxDQUFiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9wcmVmZXItZGVmYXVsdC1leHBvcnRcbmV4cG9ydCBjb25zdCBkb2NzID0ge1xuICAgIGFjY291bnQ6IHtcbiAgICAgICAgX2RvYzogYFxuIyBBY2NvdW50IHR5cGVcblxuUmVjYWxsIHRoYXQgYSBzbWFydCBjb250cmFjdCBhbmQgYW4gYWNjb3VudCBhcmUgdGhlIHNhbWUgdGhpbmcgaW4gdGhlIGNvbnRleHRcbm9mIHRoZSBUT04gQmxvY2tjaGFpbiwgYW5kIHRoYXQgdGhlc2UgdGVybXMgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5LCBhdFxubGVhc3QgYXMgbG9uZyBhcyBvbmx5IHNtYWxsIChvciDigJx1c3VhbOKAnSkgc21hcnQgY29udHJhY3RzIGFyZSBjb25zaWRlcmVkLiBBIGxhcmdlXG5zbWFydC1jb250cmFjdCBtYXkgZW1wbG95IHNldmVyYWwgYWNjb3VudHMgbHlpbmcgaW4gZGlmZmVyZW50IHNoYXJkY2hhaW5zIG9mXG50aGUgc2FtZSB3b3JrY2hhaW4gZm9yIGxvYWQgYmFsYW5jaW5nIHB1cnBvc2VzLlxuXG5BbiBhY2NvdW50IGlzIGlkZW50aWZpZWQgYnkgaXRzIGZ1bGwgYWRkcmVzcyBhbmQgaXMgY29tcGxldGVseSBkZXNjcmliZWQgYnlcbml0cyBzdGF0ZS4gSW4gb3RoZXIgd29yZHMsIHRoZXJlIGlzIG5vdGhpbmcgZWxzZSBpbiBhbiBhY2NvdW50IGFwYXJ0IGZyb20gaXRzXG5hZGRyZXNzIGFuZCBzdGF0ZS5cbiAgICAgICAgICAgYCxcbiAgICAgICAgaWQ6IGBgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoaWQgZmllbGQpLmAsXG4gICAgICAgIGFjY190eXBlOiBgUmV0dXJucyB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7YWNjX3R5cGU6e2VxOjF9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgbGFzdF9wYWlkOiBgXG5Db250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnRcbmNvbGxlY3RlZCAodXN1YWxseSB0aGlzIGlzIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdHJhbnNhY3Rpb24pLFxub3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKS5cblxcYFxcYFxcYFxucXVlcnl7XG4gIGFjY291bnRzKGZpbHRlcjoge1xuICAgIGxhc3RfcGFpZDp7Z2U6MTU2NzI5NjAwMH1cbiAgfSkge1xuICBpZFxuICBsYXN0X3BhaWR9XG59XG5cXGBcXGBcXGAgICAgIFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgIGR1ZV9wYXltZW50OiBgXG5JZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWMtIGNvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC5cblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhmaWx0ZXI6IHsgZHVlX3BheW1lbnQ6IHsgbmU6IG51bGwgfSB9KVxuICAgIHtcbiAgICAgIGlkXG4gICAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfdHJhbnNfbHQ6IGAgYCxcbiAgICAgICAgYmFsYW5jZTogYFxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKG9yZGVyQnk6e3BhdGg6XCJiYWxhbmNlXCIsZGlyZWN0aW9uOkRFU0N9KXtcbiAgICBiYWxhbmNlXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBiYWxhbmNlX290aGVyOiBgIGAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgSXMgcHJlc2VudCBhbmQgbm9uLXplcm8gb25seSBpbiBpbnN0YW5jZXMgb2YgbGFyZ2Ugc21hcnQgY29udHJhY3RzLmAsXG4gICAgICAgIHRpY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLmAsXG4gICAgICAgIHRvY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLlxuXFxgXFxgXFxgICAgICAgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7dG9jazp7bmU6bnVsbH19KXtcbiAgICBpZFxuICAgIHRvY2tcbiAgICB0aWNrXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBjb2RlOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LlxuXFxgXFxgXFxgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7Y29kZTp7ZXE6bnVsbH19KXtcbiAgICBpZFxuICAgIGFjY190eXBlXG4gIH1cbn0gICBcblxcYFxcYFxcYCAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBgLFxuICAgICAgICBkYXRhOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgZGF0YSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LmAsXG4gICAgICAgIGxpYnJhcnk6IGBJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgYWNjb3VudCBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICB9LFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgX2RvYzogYCMgTWVzc2FnZSB0eXBlXG5cbiAgICAgICAgICAgTWVzc2FnZSBsYXlvdXQgcXVlcmllcy4gIEEgbWVzc2FnZSBjb25zaXN0cyBvZiBpdHMgaGVhZGVyIGZvbGxvd2VkIGJ5IGl0c1xuICAgICAgICAgICBib2R5IG9yIHBheWxvYWQuIFRoZSBib2R5IGlzIGVzc2VudGlhbGx5IGFyYml0cmFyeSwgdG8gYmUgaW50ZXJwcmV0ZWQgYnkgdGhlXG4gICAgICAgICAgIGRlc3RpbmF0aW9uIHNtYXJ0IGNvbnRyYWN0LiBJdCBjYW4gYmUgcXVlcmllZCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOmAsXG4gICAgICAgIG1zZ190eXBlOiBgUmV0dXJucyB0aGUgdHlwZSBvZiBtZXNzYWdlLmAsXG4gICAgICAgIHN0YXR1czogYFJldHVybnMgaW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMgYWNjb3JkaW5nIHRvIHRoZSBudW1iZXJzIHNob3duLmAsXG4gICAgICAgIGJsb2NrX2lkOiBgTWVya2xlIHByb29mIHRoYXQgYWNjb3VudCBpcyBhIHBhcnQgb2Ygc2hhcmQgc3RhdGUgaXQgY3V0IGZyb20gYXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvZHk6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBib2R5IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0aWNrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0b2NrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGNvZGU6IGBSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIGRhdGE6IGBSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBsaWJyYXJ5OiBgUmVwcmVzZW50cyBjb250cmFjdCBsaWJyYXJ5IGluIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIHNyYzogYFJldHVybnMgc291cmNlIGFkZHJlc3Mgc3RyaW5nYCxcbiAgICAgICAgZHN0OiBgUmV0dXJucyBkZXN0aW5hdGlvbiBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIHNyY193b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIHNvdXJjZSBhZGRyZXNzIChzcmMgZmllbGQpYCxcbiAgICAgICAgZHN0X3dvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgZGVzdGluYXRpb24gYWRkcmVzcyAoZHN0IGZpZWxkKWAsXG4gICAgICAgIGNyZWF0ZWRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgY3JlYXRlZF9hdDogYENyZWF0aW9uIHVuaXh0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLiBUaGUgY3JlYXRpb24gdW5peHRpbWUgZXF1YWxzIHRoZSBjcmVhdGlvbiB1bml4dGltZSBvZiB0aGUgYmxvY2sgY29udGFpbmluZyB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxuICAgICAgICBpaHJfZGlzYWJsZWQ6IGBJSFIgaXMgZGlzYWJsZWQgZm9yIHRoZSBtZXNzYWdlLmAsXG4gICAgICAgIGlocl9mZWU6IGBUaGlzIHZhbHVlIGlzIHN1YnRyYWN0ZWQgZnJvbSB0aGUgdmFsdWUgYXR0YWNoZWQgdG8gdGhlIG1lc3NhZ2UgYW5kIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMgb2YgdGhlIGRlc3RpbmF0aW9uIHNoYXJkY2hhaW4gaWYgdGhleSBpbmNsdWRlIHRoZSBtZXNzYWdlIGJ5IHRoZSBJSFIgbWVjaGFuaXNtLmAsXG4gICAgICAgIGZ3ZF9mZWU6IGBPcmlnaW5hbCB0b3RhbCBmb3J3YXJkaW5nIGZlZSBwYWlkIGZvciB1c2luZyB0aGUgSFIgbWVjaGFuaXNtOyBpdCBpcyBhdXRvbWF0aWNhbGx5IGNvbXB1dGVkIGZyb20gc29tZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgYW5kIHRoZSBzaXplIG9mIHRoZSBtZXNzYWdlIGF0IHRoZSB0aW1lIHRoZSBtZXNzYWdlIGlzIGdlbmVyYXRlZC5gLFxuICAgICAgICBpbXBvcnRfZmVlOiBgYCxcbiAgICAgICAgYm91bmNlOiBgQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci5gLFxuICAgICAgICBib3VuY2VkOiBgQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgdmFsdWU6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50YCxcbiAgICAgICAgdmFsdWVfb3RoZXI6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50LmAsXG4gICAgICAgIHByb29mOiBgTWVya2xlIHByb29mIHRoYXQgbWVzc2FnZSBpcyBhIHBhcnQgb2YgYSBibG9jayBpdCBjdXQgZnJvbS4gSXQgaXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvYzogYEEgYmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2Ugc3RydWN0dXJlIGVuY29kZWQgYXMgYmFzZTY0LmBcbiAgICB9LFxuXG5cbiAgICB0cmFuc2FjdGlvbiA6IHtcbiAgICAgICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgICAgIF86IHtjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJ30sXG4gICAgICAgIHRyX3R5cGU6IGBUcmFuc2FjdGlvbiB0eXBlIGFjY29yZGluZyB0byB0aGUgb3JpZ2luYWwgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLCBjbGF1c2UgNC4yLjQuYCxcbiAgICAgICAgc3RhdHVzOiBgVHJhbnNhY3Rpb24gcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgICAgICBibG9ja19pZDogYGAsXG4gICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgIHdvcmtjaGFpbl9pZDogYFdvcmtjaGFpbiBpZCBvZiB0aGUgYWNjb3VudCBhZGRyZXNzIChhY2NvdW50X2FkZHIgZmllbGQpYCxcbiAgICAgICAgbHQ6IGBMb2dpY2FsIHRpbWUuIEEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIFt0aGUgVE9OIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbl0oaHR0cHM6Ly90ZXN0LnRvbi5vcmcvdGJsa2NoLnBkZikuYCxcbiAgICAgICAgcHJldl90cmFuc19oYXNoOiBgYCxcbiAgICAgICAgcHJldl90cmFuc19sdDogYGAsXG4gICAgICAgIG5vdzogYGAsXG4gICAgICAgIG91dG1zZ19jbnQ6IGBUaGUgbnVtYmVyIG9mIGdlbmVyYXRlZCBvdXRib3VuZCBtZXNzYWdlcyAob25lIG9mIHRoZSBjb21tb24gdHJhbnNhY3Rpb24gcGFyYW1ldGVycyBkZWZpbmVkIGJ5IHRoZSBzcGVjaWZpY2F0aW9uKWAsXG4gICAgICAgIG9yaWdfc3RhdHVzOiBgVGhlIGluaXRpYWwgc3RhdGUgb2YgYWNjb3VudC4gTm90ZSB0aGF0IGluIHRoaXMgY2FzZSB0aGUgcXVlcnkgbWF5IHJldHVybiAwLCBpZiB0aGUgYWNjb3VudCB3YXMgbm90IGFjdGl2ZSBiZWZvcmUgdGhlIHRyYW5zYWN0aW9uIGFuZCAxIGlmIGl0IHdhcyBhbHJlYWR5IGFjdGl2ZWAsXG4gICAgICAgIGVuZF9zdGF0dXM6IGBUaGUgZW5kIHN0YXRlIG9mIGFuIGFjY291bnQgYWZ0ZXIgYSB0cmFuc2FjdGlvbiwgMSBpcyByZXR1cm5lZCB0byBpbmRpY2F0ZSBhIGZpbmFsaXplZCB0cmFuc2FjdGlvbiBhdCBhbiBhY3RpdmUgYWNjb3VudGAsXG4gICAgICAgIGluX21zZzogYGAsXG4gICAgICAgIGluX21lc3NhZ2U6IGBgLFxuICAgICAgICBvdXRfbXNnczogYERpY3Rpb25hcnkgb2YgdHJhbnNhY3Rpb24gb3V0Ym91bmQgbWVzc2FnZXMgYXMgc3BlY2lmaWVkIGluIHRoZSBzcGVjaWZpY2F0aW9uYCxcbiAgICAgICAgb3V0X21lc3NhZ2VzOiBgYCxcbiAgICAgICAgdG90YWxfZmVlczogYFRvdGFsIGFtb3VudCBvZiBmZWVzIHRoYXQgZW50YWlscyBhY2NvdW50IHN0YXRlIGNoYW5nZSBhbmQgdXNlZCBpbiBNZXJrbGUgdXBkYXRlYCxcbiAgICAgICAgdG90YWxfZmVlc19vdGhlcjogYFNhbWUgYXMgYWJvdmUsIGJ1dCByZXNlcnZlZCBmb3Igbm9uIGdyYW0gY29pbnMgdGhhdCBtYXkgYXBwZWFyIGluIHRoZSBibG9ja2NoYWluYCxcbiAgICAgICAgb2xkX2hhc2g6IGBNZXJrbGUgdXBkYXRlIGZpZWxkYCxcbiAgICAgICAgbmV3X2hhc2g6IGBNZXJrbGUgdXBkYXRlIGZpZWxkYCxcbiAgICAgICAgY3JlZGl0X2ZpcnN0OiBgYCxcbiAgICAgICAgc3RvcmFnZToge1xuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2NvbGxlY3RlZDogYFRoaXMgZmllbGQgZGVmaW5lcyB0aGUgYW1vdW50IG9mIHN0b3JhZ2UgZmVlcyBjb2xsZWN0ZWQgaW4gZ3JhbXMuYCxcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19kdWU6IGBUaGlzIGZpZWxkIHJlcHJlc2VudHMgdGhlIGFtb3VudCBvZiBkdWUgZmVlcyBpbiBncmFtcywgaXQgbWlnaHQgYmUgZW1wdHkuYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBUaGlzIGZpZWxkIHJlcHJlc2VudHMgYWNjb3VudCBzdGF0dXMgY2hhbmdlIGFmdGVyIHRoZSB0cmFuc2FjdGlvbiBpcyBjb21wbGV0ZWQuYCxcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVkaXQ6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgYWNjb3VudCBpcyBjcmVkaXRlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIHJlY2VpdmVkLiBUaGUgY3JlZGl0IHBoYXNlIGNhbiByZXN1bHQgaW4gdGhlIGNvbGxlY3Rpb24gb2Ygc29tZSBkdWUgcGF5bWVudHNgLFxuICAgICAgICAgICAgZHVlX2ZlZXNfY29sbGVjdGVkOiBgVGhlIHN1bSBvZiBkdWVfZmVlc19jb2xsZWN0ZWQgYW5kIGNyZWRpdCBtdXN0IGVxdWFsIHRoZSB2YWx1ZSBvZiB0aGUgbWVzc2FnZSByZWNlaXZlZCwgcGx1cyBpdHMgaWhyX2ZlZSBpZiB0aGUgbWVzc2FnZSBoYXMgbm90IGJlZW4gcmVjZWl2ZWQgdmlhIEluc3RhbnQgSHlwZXJjdWJlIFJvdXRpbmcsIElIUiAob3RoZXJ3aXNlIHRoZSBpaHJfZmVlIGlzIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMpLmAsXG4gICAgICAgICAgICBjcmVkaXQ6IGBgLFxuICAgICAgICAgICAgY3JlZGl0X290aGVyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgY29tcHV0ZToge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBjb2RlIG9mIHRoZSBzbWFydCBjb250cmFjdCBpcyBpbnZva2VkIGluc2lkZSBhbiBpbnN0YW5jZSBvZiBUVk0gd2l0aCBhZGVxdWF0ZSBwYXJhbWV0ZXJzLCBpbmNsdWRpbmcgYSBjb3B5IG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgYW5kIG9mIHRoZSBwZXJzaXN0ZW50IGRhdGEsIGFuZCB0ZXJtaW5hdGVzIHdpdGggYW4gZXhpdCBjb2RlLCB0aGUgbmV3IHBlcnNpc3RlbnQgZGF0YSwgYW5kIGFuIGFjdGlvbiBsaXN0ICh3aGljaCBpbmNsdWRlcywgZm9yIGluc3RhbmNlLCBvdXRib3VuZCBtZXNzYWdlcyB0byBiZSBzZW50KS4gVGhlIHByb2Nlc3NpbmcgcGhhc2UgbWF5IGxlYWQgdG8gdGhlIGNyZWF0aW9uIG9mIGEgbmV3IGFjY291bnQgKHVuaW5pdGlhbGl6ZWQgb3IgYWN0aXZlKSwgb3IgdG8gdGhlIGFjdGl2YXRpb24gb2YgYSBwcmV2aW91c2x5IHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnQuIFRoZSBnYXMgcGF5bWVudCwgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgdGhlIGdhcyBwcmljZSBhbmQgdGhlIGdhcyBjb25zdW1lZCwgaXMgZXhhY3RlZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2UuXG5JZiB0aGVyZSBpcyBubyByZWFzb24gdG8gc2tpcCB0aGUgY29tcHV0aW5nIHBoYXNlLCBUVk0gaXMgaW52b2tlZCBhbmQgdGhlIHJlc3VsdHMgb2YgdGhlIGNvbXB1dGF0aW9uIGFyZSBsb2dnZWQuIFBvc3NpYmxlIHBhcmFtZXRlcnMgYXJlIGNvdmVyZWQgYmVsb3cuYCxcbiAgICAgICAgICAgIGNvbXB1dGVfdHlwZTogYGAsXG4gICAgICAgICAgICBza2lwcGVkX3JlYXNvbjogYFJlYXNvbiBmb3Igc2tpcHBpbmcgdGhlIGNvbXB1dGUgcGhhc2UuIEFjY29yZGluZyB0byB0aGUgc3BlY2lmaWNhdGlvbiwgdGhlIHBoYXNlIGNhbiBiZSBza2lwcGVkIGR1ZSB0byB0aGUgYWJzZW5jZSBvZiBmdW5kcyB0byBidXkgZ2FzLCBhYnNlbmNlIG9mIHN0YXRlIG9mIGFuIGFjY291bnQgb3IgYSBtZXNzYWdlLCBmYWlsdXJlIHRvIHByb3ZpZGUgYSB2YWxpZCBzdGF0ZSBpbiB0aGUgbWVzc2FnZWAsXG4gICAgICAgICAgICBzdWNjZXNzOiBgVGhpcyBmbGFnIGlzIHNldCBpZiBhbmQgb25seSBpZiBleGl0X2NvZGUgaXMgZWl0aGVyIDAgb3IgMS5gLFxuICAgICAgICAgICAgbXNnX3N0YXRlX3VzZWQ6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KWAsXG4gICAgICAgICAgICBhY2NvdW50X2FjdGl2YXRlZDogYFRoZSBmbGFnIHJlZmxlY3RzIHdoZXRoZXIgdGhpcyBoYXMgcmVzdWx0ZWQgaW4gdGhlIGFjdGl2YXRpb24gb2YgYSBwcmV2aW91c2x5IGZyb3plbiwgdW5pbml0aWFsaXplZCBvciBub24tZXhpc3RlbnQgYWNjb3VudC5gLFxuICAgICAgICAgICAgZ2FzX2ZlZXM6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB0aGUgdG90YWwgZ2FzIGZlZXMgY29sbGVjdGVkIGJ5IHRoZSB2YWxpZGF0b3JzIGZvciBleGVjdXRpbmcgdGhpcyB0cmFuc2FjdGlvbi4gSXQgbXVzdCBiZSBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiBnYXNfdXNlZCBhbmQgZ2FzX3ByaWNlIGZyb20gdGhlIGN1cnJlbnQgYmxvY2sgaGVhZGVyLmAsXG4gICAgICAgICAgICBnYXNfdXNlZDogYGAsXG4gICAgICAgICAgICBnYXNfbGltaXQ6IGBUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB0aGUgZ2FzIGxpbWl0IGZvciB0aGlzIGluc3RhbmNlIG9mIFRWTS4gSXQgZXF1YWxzIHRoZSBsZXNzZXIgb2YgZWl0aGVyIHRoZSBHcmFtcyBjcmVkaXRlZCBpbiB0aGUgY3JlZGl0IHBoYXNlIGZyb20gdGhlIHZhbHVlIG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgZGl2aWRlZCBieSB0aGUgY3VycmVudCBnYXMgcHJpY2UsIG9yIHRoZSBnbG9iYWwgcGVyLXRyYW5zYWN0aW9uIGdhcyBsaW1pdC5gLFxuICAgICAgICAgICAgZ2FzX2NyZWRpdDogYFRoaXMgcGFyYW1ldGVyIG1heSBiZSBub24temVybyBvbmx5IGZvciBleHRlcm5hbCBpbmJvdW5kIG1lc3NhZ2VzLiBJdCBpcyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgYW1vdW50IG9mIGdhcyB0aGF0IGNhbiBiZSBwYWlkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZSBvciB0aGUgbWF4aW11bSBnYXMgY3JlZGl0YCxcbiAgICAgICAgICAgIG1vZGU6IGBgLFxuICAgICAgICAgICAgZXhpdF9jb2RlOiBgVGhlc2UgcGFyYW1ldGVyIHJlcHJlc2VudHMgdGhlIHN0YXR1cyB2YWx1ZXMgcmV0dXJuZWQgYnkgVFZNOyBmb3IgYSBzdWNjZXNzZnVsIHRyYW5zYWN0aW9uLCBleGl0X2NvZGUgaGFzIHRvIGJlIDAgb3IgMWAsXG4gICAgICAgICAgICBleGl0X2FyZzogYGAsXG4gICAgICAgICAgICB2bV9zdGVwczogYHRoZSB0b3RhbCBudW1iZXIgb2Ygc3RlcHMgcGVyZm9ybWVkIGJ5IFRWTSAodXN1YWxseSBlcXVhbCB0byB0d28gcGx1cyB0aGUgbnVtYmVyIG9mIGluc3RydWN0aW9ucyBleGVjdXRlZCwgaW5jbHVkaW5nIGltcGxpY2l0IFJFVHMpYCxcbiAgICAgICAgICAgIHZtX2luaXRfc3RhdGVfaGFzaDogYFRoaXMgcGFyYW1ldGVyIGlzIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoZXMgb2YgdGhlIG9yaWdpbmFsIHN0YXRlIG9mIFRWTS5gLFxuICAgICAgICAgICAgdm1fZmluYWxfc3RhdGVfaGFzaDogYFRoaXMgcGFyYW1ldGVyIGlzIHRoZSByZXByZXNlbnRhdGlvbiBoYXNoZXMgb2YgdGhlIHJlc3VsdGluZyBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgfSxcbiAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGhhcyB0ZXJtaW5hdGVkIHN1Y2Nlc3NmdWxseSAod2l0aCBleGl0IGNvZGUgMCBvciAxKSwgdGhlIGFjdGlvbnMgZnJvbSB0aGUgbGlzdCBhcmUgcGVyZm9ybWVkLiBJZiBpdCBpcyBpbXBvc3NpYmxlIHRvIHBlcmZvcm0gYWxsIG9mIHRoZW3igJRmb3IgZXhhbXBsZSwgYmVjYXVzZSBvZiBpbnN1ZmZpY2llbnQgZnVuZHMgdG8gdHJhbnNmZXIgd2l0aCBhbiBvdXRib3VuZCBtZXNzYWdl4oCUdGhlbiB0aGUgdHJhbnNhY3Rpb24gaXMgYWJvcnRlZCBhbmQgdGhlIGFjY291bnQgc3RhdGUgaXMgcm9sbGVkIGJhY2suIFRoZSB0cmFuc2FjdGlvbiBpcyBhbHNvIGFib3J0ZWQgaWYgdGhlIHNtYXJ0IGNvbnRyYWN0IGRpZCBub3QgdGVybWluYXRlIHN1Y2Nlc3NmdWxseSwgb3IgaWYgaXQgd2FzIG5vdCBwb3NzaWJsZSB0byBpbnZva2UgdGhlIHNtYXJ0IGNvbnRyYWN0IGF0IGFsbCBiZWNhdXNlIGl0IGlzIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuLmAsXG4gICAgICAgICAgICBzdWNjZXNzOiBgYCxcbiAgICAgICAgICAgIHZhbGlkOiBgYCxcbiAgICAgICAgICAgIG5vX2Z1bmRzOiBgVGhlIGZsYWcgaW5kaWNhdGVzIGFic2VuY2Ugb2YgZnVuZHMgcmVxdWlyZWQgdG8gY3JlYXRlIGFuIG91dGJvdW5kIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYGAsXG4gICAgICAgICAgICB0b3RhbF9md2RfZmVlczogYGAsXG4gICAgICAgICAgICB0b3RhbF9hY3Rpb25fZmVlczogYGAsXG4gICAgICAgICAgICByZXN1bHRfY29kZTogYGAsXG4gICAgICAgICAgICByZXN1bHRfYXJnOiBgYCxcbiAgICAgICAgICAgIHRvdF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIHNwZWNfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBza2lwcGVkX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgbXNnc19jcmVhdGVkOiBgYCxcbiAgICAgICAgICAgIGFjdGlvbl9saXN0X2hhc2g6IGBgLFxuICAgICAgICAgICAgdG90YWxfbXNnX3NpemVfY2VsbHM6IGBgLFxuICAgICAgICAgICAgdG90YWxfbXNnX3NpemVfYml0czogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGJvdW5jZToge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci4gQWxtb3N0IGFsbCB2YWx1ZSBvZiB0aGUgb3JpZ2luYWwgaW5ib3VuZCBtZXNzYWdlIChtaW51cyBnYXMgcGF5bWVudHMgYW5kIGZvcndhcmRpbmcgZmVlcykgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIGdlbmVyYXRlZCBtZXNzYWdlLCB3aGljaCBvdGhlcndpc2UgaGFzIGFuIGVtcHR5IGJvZHkuYCxcbiAgICAgICAgICAgIGJvdW5jZV90eXBlOiBgYCxcbiAgICAgICAgICAgIG1zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIG1zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICAgICAgcmVxX2Z3ZF9mZWVzOiBgYCxcbiAgICAgICAgICAgIG1zZ19mZWVzOiBgYCxcbiAgICAgICAgICAgIGZ3ZF9mZWVzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgYWJvcnRlZDogYGAsXG4gICAgICAgIGRlc3Ryb3llZDogYGAsXG4gICAgICAgIHR0OiBgYCxcbiAgICAgICAgc3BsaXRfaW5mbzoge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBmaWVsZHMgYmVsb3cgY292ZXIgc3BsaXQgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMgYW5kIG1lcmdlIHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zLCB0aGUgZmllbGRzIGNvcnJlc3BvbmQgdG8gdGhlIHJlbGV2YW50IHNjaGVtZXMgY292ZXJlZCBieSB0aGUgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLmAsXG4gICAgICAgICAgICBjdXJfc2hhcmRfcGZ4X2xlbjogYGxlbmd0aCBvZiB0aGUgY3VycmVudCBzaGFyZCBwcmVmaXhgLFxuICAgICAgICAgICAgYWNjX3NwbGl0X2RlcHRoOiBgYCxcbiAgICAgICAgICAgIHRoaXNfYWRkcjogYGAsXG4gICAgICAgICAgICBzaWJsaW5nX2FkZHI6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBwcmVwYXJlX3RyYW5zYWN0aW9uOiBgYCxcbiAgICAgICAgaW5zdGFsbGVkOiBgYCxcbiAgICAgICAgcHJvb2Y6IGBgLFxuICAgICAgICBib2M6IGBgLFxuICAgIH0sXG5cbiAgICBzaGFyZERlc2NyOiB7XG4gICAgICAgIF9kb2M6IGBTaGFyZEhhc2hlcyBpcyByZXByZXNlbnRlZCBieSBhIGRpY3Rpb25hcnkgd2l0aCAzMi1iaXQgd29ya2NoYWluX2lkcyBhcyBrZXlzLCBhbmQg4oCcc2hhcmQgYmluYXJ5IHRyZWVz4oCdLCByZXByZXNlbnRlZCBieSBUTC1CIHR5cGUgQmluVHJlZSBTaGFyZERlc2NyLCBhcyB2YWx1ZXMuIEVhY2ggbGVhZiBvZiB0aGlzIHNoYXJkIGJpbmFyeSB0cmVlIGNvbnRhaW5zIGEgdmFsdWUgb2YgdHlwZSBTaGFyZERlc2NyLCB3aGljaCBkZXNjcmliZXMgYSBzaW5nbGUgc2hhcmQgYnkgaW5kaWNhdGluZyB0aGUgc2VxdWVuY2UgbnVtYmVyIHNlcV9ubywgdGhlIGxvZ2ljYWwgdGltZSBsdCwgYW5kIHRoZSBoYXNoIGhhc2ggb2YgdGhlIGxhdGVzdCAoc2lnbmVkKSBibG9jayBvZiB0aGUgY29ycmVzcG9uZGluZyBzaGFyZGNoYWluLmAsXG4gICAgICAgIHNlcV9ubzogYHVpbnQzMiBzZXF1ZW5jZSBudW1iZXJgLFxuICAgICAgICByZWdfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICAgICAgc3RhcnRfbHQ6IGBMb2dpY2FsIHRpbWUgb2YgdGhlIHNoYXJkY2hhaW4gc3RhcnRgLFxuICAgICAgICBlbmRfbHQ6IGBMb2dpY2FsIHRpbWUgb2YgdGhlIHNoYXJkY2hhaW4gZW5kYCxcbiAgICAgICAgcm9vdF9oYXNoOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLiBUaGUgc2hhcmQgYmxvY2sgY29uZmlndXJhdGlvbiBpcyBkZXJpdmVkIGZyb20gdGhhdCBibG9jay5gLFxuICAgICAgICBmaWxlX2hhc2g6IGBTaGFyZCBibG9jayBmaWxlIGhhc2guYCxcbiAgICAgICAgYmVmb3JlX3NwbGl0OiBgVE9OIEJsb2NrY2hhaW4gc3VwcG9ydHMgZHluYW1pYyBzaGFyZGluZywgc28gdGhlIHNoYXJkIGNvbmZpZ3VyYXRpb24gbWF5IGNoYW5nZSBmcm9tIGJsb2NrIHRvIGJsb2NrIGJlY2F1c2Ugb2Ygc2hhcmQgbWVyZ2UgYW5kIHNwbGl0IGV2ZW50cy4gVGhlcmVmb3JlLCB3ZSBjYW5ub3Qgc2ltcGx5IHNheSB0aGF0IGVhY2ggc2hhcmRjaGFpbiBjb3JyZXNwb25kcyB0byBhIGZpeGVkIHNldCBvZiBhY2NvdW50IGNoYWlucy5cbkEgc2hhcmRjaGFpbiBibG9jayBhbmQgaXRzIHN0YXRlIG1heSBlYWNoIGJlIGNsYXNzaWZpZWQgaW50byB0d28gZGlzdGluY3QgcGFydHMuIFRoZSBwYXJ0cyB3aXRoIHRoZSBJU1AtZGljdGF0ZWQgZm9ybSBvZiB3aWxsIGJlIGNhbGxlZCB0aGUgc3BsaXQgcGFydHMgb2YgdGhlIGJsb2NrIGFuZCBpdHMgc3RhdGUsIHdoaWxlIHRoZSByZW1haW5kZXIgd2lsbCBiZSBjYWxsZWQgdGhlIG5vbi1zcGxpdCBwYXJ0cy5cblRoZSBtYXN0ZXJjaGFpbiBjYW5ub3QgYmUgc3BsaXQgb3IgbWVyZ2VkLmAsXG4gICAgICAgIGJlZm9yZV9tZXJnZTogYGAsXG4gICAgICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgICAgICB3YW50X21lcmdlOiBgYCxcbiAgICAgICAgbnhfY2NfdXBkYXRlZDogYGAsXG4gICAgICAgIGZsYWdzOiBgYCxcbiAgICAgICAgbmV4dF9jYXRjaGFpbl9zZXFubzogYGAsXG4gICAgICAgIG5leHRfdmFsaWRhdG9yX3NoYXJkOiBgYCxcbiAgICAgICAgbWluX3JlZl9tY19zZXFubzogYGAsXG4gICAgICAgIGdlbl91dGltZTogYEdlbmVyYXRpb24gdGltZSBpbiB1aW50MzJgLFxuICAgICAgICBzcGxpdF90eXBlOiBgYCxcbiAgICAgICAgc3BsaXQ6IGBgLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZDpgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IGBBbW91bnQgb2YgZmVlcyBjb2xsZWN0ZWQgaW50IGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgICAgIGZ1bmRzX2NyZWF0ZWQ6IGBBbW91bnQgb2YgZnVuZHMgY3JlYXRlZCBpbiB0aGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZ1bmRzX2NyZWF0ZWRfb3RoZXI6IGBBbW91bnQgb2YgZnVuZHMgY3JlYXRlZCBpbiB0aGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICB9LFxuXG4gICAgYmxvY2s6IHtcbiAgICBfZG9jOiAnVGhpcyBpcyBCbG9jaycsXG4gICAgc3RhdHVzOiBgUmV0dXJucyBibG9jayBwcm9jZXNzaW5nIHN0YXR1c2AsXG4gICAgZ2xvYmFsX2lkOiBgdWludDMyIGdsb2JhbCBibG9jayBJRGAsXG4gICAgd2FudF9zcGxpdDogYGAsXG4gICAgc2VxX25vOiBgYCxcbiAgICBhZnRlcl9tZXJnZTogYGAsXG4gICAgZ2VuX3V0aW1lOiBgdWludCAzMiBnZW5lcmF0aW9uIHRpbWUgc3RhbXBgLFxuICAgIGdlbl9jYXRjaGFpbl9zZXFubzogYGAsXG4gICAgZmxhZ3M6IGBgLFxuICAgIG1hc3Rlcl9yZWY6IGBgLFxuICAgIHByZXZfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jay5gLFxuICAgIHByZXZfYWx0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiBzaGFyZCBtZXJnZS5gLFxuICAgIHByZXZfdmVydF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2YgdmVydGljYWwgYmxvY2tzLmAsXG4gICAgcHJldl92ZXJ0X2FsdF9yZWY6IGBgLFxuICAgIHZlcnNpb246IGB1aW4zMiBibG9jayB2ZXJzaW9uIGlkZW50aWZpZXJgLFxuICAgIGdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0OiBgYCxcbiAgICBiZWZvcmVfc3BsaXQ6IGBgLFxuICAgIGFmdGVyX3NwbGl0OiBgYCxcbiAgICB3YW50X21lcmdlOiBgYCxcbiAgICB2ZXJ0X3NlcV9ubzogYGAsXG4gICAgc3RhcnRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBzdGFydC5cbkxvZ2ljYWwgdGltZSBpcyBhIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUgVE9OIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbmAsXG4gICAgZW5kX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gZW5kLmAsXG4gICAgd29ya2NoYWluX2lkOiBgdWludDMyIHdvcmtjaGFpbiBpZGVudGlmaWVyYCxcbiAgICBzaGFyZDogYGAsXG4gICAgbWluX3JlZl9tY19zZXFubzogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi5gLFxuICAgIHByZXZfa2V5X2Jsb2NrX3NlcW5vOiBgUmV0dXJucyBhIG51bWJlciBvZiBhIHByZXZpb3VzIGtleSBibG9jay5gLFxuICAgIGdlbl9zb2Z0d2FyZV92ZXJzaW9uOiBgYCxcbiAgICBnZW5fc29mdHdhcmVfY2FwYWJpbGl0aWVzOiBgYCxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBgQW1vdW50IG9mIGdyYW1zIGFtb3VudCB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgIGV4cG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGV4cG9ydGVkLmAsXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGBgLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYGAsXG4gICAgICAgIGNyZWF0ZWQ6IGBgLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBgYCxcbiAgICAgICAgaW1wb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBpbXBvcnRlZC5gLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBgQW1vdW50IG9mIGdyYW1zIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgbWludGVkOiBgQW1vdW50IG9mIGdyYW1zIG1pbnRlZCBpbiB0aGlzIGJsb2NrLmAsXG4gICAgICAgIG1pbnRlZF9vdGhlcjogYGAsXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYGAsXG4gICAgcmFuZF9zZWVkOiBgYCxcbiAgICBvdXRfbXNnX2Rlc2NyOiBgYCxcbiAgICBhY2NvdW50X2Jsb2Nrczoge1xuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGBgLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBgb2xkIHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYCxcbiAgICAgICAgICAgIG5ld19oYXNoOiBgbmV3IHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYFxuICAgICAgICB9LFxuICAgICAgICB0cl9jb3VudDogYGBcbiAgICB9LFxuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IGBgLFxuICAgICAgICBuZXdfaGFzaDogYGAsXG4gICAgICAgIG5ld19kZXB0aDogYGAsXG4gICAgICAgIG9sZDogYGAsXG4gICAgICAgIG9sZF9oYXNoOiBgYCxcbiAgICAgICAgb2xkX2RlcHRoOiBgYFxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIG1pbl9zaGFyZF9nZW5fdXRpbWU6ICdNaW4gYmxvY2sgZ2VuZXJhdGlvbiB0aW1lIG9mIHNoYXJkcycsXG4gICAgICAgIG1heF9zaGFyZF9nZW5fdXRpbWU6ICdNYXggYmxvY2sgZ2VuZXJhdGlvbiB0aW1lIG9mIHNoYXJkcycsXG4gICAgICAgIHNoYXJkX2hhc2hlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNoYXJkIGhhc2hlc2AsXG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBVaW50MzIgd29ya2NoYWluIElEYCxcbiAgICAgICAgICAgIHNoYXJkOiBgU2hhcmQgSURgLFxuICAgICAgICAgICAgZGVzY3I6IGBTaGFyZCBkZXNjcmlwdGlvbmAsXG4gICAgICAgIH0sXG4gICAgICAgIHNoYXJkX2ZlZXM6IHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICBzaGFyZDogYGAsXG4gICAgICAgICAgICBmZWVzOiBgQW1vdW50IG9mIGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogYEFycmF5IG9mIGZlZXMgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXNgLFxuICAgICAgICAgICAgY3JlYXRlOiBgQW1vdW50IG9mIGZlZXMgY3JlYXRlZCBkdXJpbmcgc2hhcmRgLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGZlZXMgY3JlYXRlZCBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llcyBkdXJpbmcgdGhlIGJsb2NrLmAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogYGAsXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBwcmV2aW91cyBibG9jayBzaWduYXR1cmVzYCxcbiAgICAgICAgICAgIG5vZGVfaWQ6IGBgLFxuICAgICAgICAgICAgcjogYGAsXG4gICAgICAgICAgICBzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnX2FkZHI6IGBgLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBgQWRkcmVzcyBvZiBjb25maWcgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAxOiBgQWRkcmVzcyBvZiBlbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjogYEFkZHJlc3Mgb2YgbWludGVyIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMzogYEFkZHJlc3Mgb2YgZmVlIGNvbGxlY3RvciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDQ6IGBBZGRyZXNzIG9mIFRPTiBETlMgcm9vdCBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgNmAsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA3YCxcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogYGAsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEdsb2JhbCB2ZXJzaW9uYCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBgTWFuZGF0b3J5IHBhcmFtc2AsXG4gICAgICAgICAgICBwMTA6IGBDcml0aWNhbCBwYXJhbXNgLFxuICAgICAgICAgICAgcDExOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZyB2b3Rpbmcgc2V0dXBgLFxuICAgICAgICAgICAgICAgIG5vcm1hbF9wYXJhbXM6IGBgLFxuICAgICAgICAgICAgICAgIGNyaXRpY2FsX3BhcmFtczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDEyOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIGFsbCB3b3JrY2hhaW5zIGRlc2NyaXB0aW9uc2AsXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgYCxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBgYCxcbiAgICAgICAgICAgICAgICBhY2NlcHRfbXNnczogYGAsXG4gICAgICAgICAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBgYCxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogYGAsXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBCbG9jayBjcmVhdGUgZmVlc2AsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBgYCxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgRWxlY3Rpb24gcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogYGAsXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IGBgLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9ycyBjb3VudGAsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9yIHN0YWtlIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IGBgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYFN0b3JhZ2UgcHJpY2VzYCxcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogYGAsXG4gICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICBtY19iaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyMDogYEdhcyBsaW1pdHMgYW5kIHByaWNlcyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDIxOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgcDIyOiBgQmxvY2sgbGltaXRzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjM6IGBCbG9jayBsaW1pdHMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjQ6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjU6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENhdGNoYWluIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbnNlbnN1cyBjb25maWdgLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IGBgLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBgYCxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogYGAsXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogYGAsXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogYGAsXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBgYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYEFycmF5IG9mIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyBhZGRyZXNzZXNgLFxuICAgICAgICAgICAgcDMyOiBgUHJldmlvdXMgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDMzOiBgUHJldmlvdXMgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzQ6IGBDdXJyZW50IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNTogYEN1cnJlbnQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzY6IGBOZXh0IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNzogYE5leHQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgdmFsaWRhdG9yIHNpZ25lZCB0ZW1wcm9yYXJ5IGtleXNgLFxuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogYGAsXG4gICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBgYCxcbiAgICAgICAgICAgICAgICBzZXFubzogYGAsXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IGBgLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBgYCxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfSxcbn0sXG5cbmJsb2NrU2lnbmF0dXJlczoge1xuICAgIF9kb2M6IGBTZXQgb2YgdmFsaWRhdG9yXFwncyBzaWduYXR1cmVzIGZvciB0aGUgQmxvY2sgd2l0aCBjb3JyZXNwb25kIGlkYCxcbiAgICBnZW5fdXRpbWU6IGBTaWduZWQgYmxvY2sncyBnZW5fdXRpbWVgLFxuICAgIHNlcV9ubzogYFNpZ25lZCBibG9jaydzIHNlcV9ub2AsXG4gICAgd29ya2NoYWluX2lkOiBgU2lnbmVkIGJsb2NrJ3Mgd29ya2NoYWluX2lkYCxcbiAgICBwcm9vZjogYFNpZ25lZCBibG9jaydzIG1lcmtsZSBwcm9vZmAsXG4gICAgdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgIHNpZ193ZWlnaHQ6IGBgLFxuICAgIHNpZ25hdHVyZXM6IHtcbiAgICAgICAgX2RvYzogYEFycmF5IG9mIHNpZ25hdHVyZXMgZnJvbSBibG9jaydzIHZhbGlkYXRvcnNgLFxuICAgICAgICBub2RlX2lkOiBgVmFsaWRhdG9yIElEYCxcbiAgICAgICAgcjogYCdSJyBwYXJ0IG9mIHNpZ25hdHVyZWAsXG4gICAgICAgIHM6IGAncycgcGFydCBvZiBzaWduYXR1cmVgLFxuICAgIH1cbn1cblxufTtcbiJdfQ==