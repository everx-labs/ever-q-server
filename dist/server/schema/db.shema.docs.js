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
  }
};
exports.docs = docs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJ0cmFuc2FjdGlvbiIsIl8iLCJjb2xsZWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInNoYXJkRGVzY3IiLCJzZXFfbm8iLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJwcmV2X2tleV9ibG9ja19zZXFubyIsImdlbl9zb2Z0d2FyZV92ZXJzaW9uIiwiZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllcyIsInZhbHVlX2Zsb3ciLCJ0b19uZXh0X2JsayIsInRvX25leHRfYmxrX290aGVyIiwiZXhwb3J0ZWQiLCJleHBvcnRlZF9vdGhlciIsImNyZWF0ZWQiLCJjcmVhdGVkX290aGVyIiwiaW1wb3J0ZWQiLCJpbXBvcnRlZF9vdGhlciIsImZyb21fcHJldl9ibGsiLCJmcm9tX3ByZXZfYmxrX290aGVyIiwibWludGVkIiwibWludGVkX290aGVyIiwiZmVlc19pbXBvcnRlZCIsImZlZXNfaW1wb3J0ZWRfb3RoZXIiLCJpbl9tc2dfZGVzY3IiLCJyYW5kX3NlZWQiLCJvdXRfbXNnX2Rlc2NyIiwiYWNjb3VudF9ibG9ja3MiLCJ0cmFuc2FjdGlvbnMiLCJzdGF0ZV91cGRhdGUiLCJ0cl9jb3VudCIsIm5ldyIsIm5ld19kZXB0aCIsIm9sZCIsIm9sZF9kZXB0aCIsIm1hc3RlciIsIm1pbl9zaGFyZF9nZW5fdXRpbWUiLCJtYXhfc2hhcmRfZ2VuX3V0aW1lIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTAiLCJwMTEiLCJub3JtYWxfcGFyYW1zIiwiY3JpdGljYWxfcGFyYW1zIiwicDEyIiwiZW5hYmxlZF9zaW5jZSIsImFjdHVhbF9taW5fc3BsaXQiLCJtaW5fc3BsaXQiLCJtYXhfc3BsaXQiLCJhY3RpdmUiLCJhY2NlcHRfbXNncyIsInplcm9zdGF0ZV9yb290X2hhc2giLCJ6ZXJvc3RhdGVfZmlsZV9oYXNoIiwiYmFzaWMiLCJ2bV92ZXJzaW9uIiwidm1fbW9kZSIsIm1pbl9hZGRyX2xlbiIsIm1heF9hZGRyX2xlbiIsImFkZHJfbGVuX3N0ZXAiLCJ3b3JrY2hhaW5fdHlwZV9pZCIsInAxNCIsIm1hc3RlcmNoYWluX2Jsb2NrX2ZlZSIsImJhc2VjaGFpbl9ibG9ja19mZWUiLCJwMTUiLCJ2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yIiwiZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZSIsImVsZWN0aW9uc19lbmRfYmVmb3JlIiwic3Rha2VfaGVsZF9mb3IiLCJwMTYiLCJtYXhfdmFsaWRhdG9ycyIsIm1heF9tYWluX3ZhbGlkYXRvcnMiLCJtaW5fdmFsaWRhdG9ycyIsInAxNyIsIm1pbl9zdGFrZSIsIm1heF9zdGFrZSIsIm1pbl90b3RhbF9zdGFrZSIsIm1heF9zdGFrZV9mYWN0b3IiLCJwMTgiLCJ1dGltZV9zaW5jZSIsImJpdF9wcmljZV9wcyIsImNlbGxfcHJpY2VfcHMiLCJtY19iaXRfcHJpY2VfcHMiLCJtY19jZWxsX3ByaWNlX3BzIiwicDIwIiwicDIxIiwicDIyIiwicDIzIiwicDI0IiwicDI1IiwicDI4IiwibWNfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF9jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX251bSIsInAyOSIsInJvdW5kX2NhbmRpZGF0ZXMiLCJuZXh0X2NhbmRpZGF0ZV9kZWxheV9tcyIsImNvbnNlbnN1c190aW1lb3V0X21zIiwiZmFzdF9hdHRlbXB0cyIsImF0dGVtcHRfZHVyYXRpb24iLCJjYXRjaGFpbl9tYXhfZGVwcyIsIm1heF9ibG9ja19ieXRlcyIsIm1heF9jb2xsYXRlZF9ieXRlcyIsInAzMSIsInAzMiIsInAzMyIsInAzNCIsInAzNSIsInAzNiIsInAzNyIsInAzOSIsImFkbmxfYWRkciIsInRlbXBfcHVibGljX2tleSIsInNlcW5vIiwidmFsaWRfdW50aWwiLCJzaWduYXR1cmVfciIsInNpZ25hdHVyZV9zIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTtBQUNPLE1BQU1BLElBQUksR0FBRztBQUNoQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xDLElBQUFBLElBQUksRUFBRzs7Ozs7Ozs7Ozs7O1lBREY7QUFjTEMsSUFBQUEsRUFBRSxFQUFHLEVBZEE7QUFlTEMsSUFBQUEsWUFBWSxFQUFHLGlEQWZWO0FBZ0JMQyxJQUFBQSxRQUFRLEVBQUc7Ozs7Ozs7OztTQWhCTjtBQTBCTEMsSUFBQUEsU0FBUyxFQUFHOzs7Ozs7Ozs7Ozs7O2lCQTFCUDtBQXdDTEMsSUFBQUEsV0FBVyxFQUFHOzs7Ozs7Ozs7O1NBeENUO0FBbURMQyxJQUFBQSxhQUFhLEVBQUcsR0FuRFg7QUFvRExDLElBQUFBLE9BQU8sRUFBRzs7Ozs7Ozs7U0FwREw7QUE2RExDLElBQUFBLGFBQWEsRUFBRyxHQTdEWDtBQThETEMsSUFBQUEsV0FBVyxFQUFHLHFFQTlEVDtBQStETEMsSUFBQUEsSUFBSSxFQUFHLHdKQS9ERjtBQWdFTEMsSUFBQUEsSUFBSSxFQUFHOzs7Ozs7Ozs7O1NBaEVGO0FBMkVMQyxJQUFBQSxJQUFJLEVBQUc7Ozs7Ozs7Ozs7O1NBM0VGO0FBdUZMQyxJQUFBQSxJQUFJLEVBQUcsa0VBdkZGO0FBd0ZMQyxJQUFBQSxPQUFPLEVBQUcsMkRBeEZMO0FBeUZMQyxJQUFBQSxLQUFLLEVBQUcsOEhBekZIO0FBMEZM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RURxUSxVQUFBQSxnQkFBZ0IsRUFBRyxFQUZsQjtBQUdEQyxVQUFBQSx1QkFBdUIsRUFBRyxFQUh6QjtBQUlEQyxVQUFBQSxvQkFBb0IsRUFBRyxFQUp0QjtBQUtEQyxVQUFBQSxhQUFhLEVBQUcsRUFMZjtBQU1EQyxVQUFBQSxnQkFBZ0IsRUFBRyxFQU5sQjtBQU9EQyxVQUFBQSxpQkFBaUIsRUFBRyxFQVBuQjtBQVFEQyxVQUFBQSxlQUFlLEVBQUcsRUFSakI7QUFTREMsVUFBQUEsa0JBQWtCLEVBQUc7QUFUcEIsU0EvRkQ7QUEwR0pDLFFBQUFBLEdBQUcsRUFBRyxnREExR0Y7QUEyR0pDLFFBQUFBLEdBQUcsRUFBRyx5QkEzR0Y7QUE0R0pDLFFBQUFBLEdBQUcsRUFBRyxvQ0E1R0Y7QUE2R0pDLFFBQUFBLEdBQUcsRUFBRyx3QkE3R0Y7QUE4R0pDLFFBQUFBLEdBQUcsRUFBRyxtQ0E5R0Y7QUErR0pDLFFBQUFBLEdBQUcsRUFBRyxxQkEvR0Y7QUFnSEpDLFFBQUFBLEdBQUcsRUFBRyxnQ0FoSEY7QUFpSEpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEcFIsVUFBQUEsSUFBSSxFQUFHLDJDQUROO0FBRURxUixVQUFBQSxTQUFTLEVBQUcsRUFGWDtBQUdEQyxVQUFBQSxlQUFlLEVBQUcsRUFIakI7QUFJREMsVUFBQUEsS0FBSyxFQUFHLEVBSlA7QUFLREMsVUFBQUEsV0FBVyxFQUFHLEVBTGI7QUFNREMsVUFBQUEsV0FBVyxFQUFHLEVBTmI7QUFPREMsVUFBQUEsV0FBVyxFQUFHO0FBUGI7QUFqSEQ7QUF6Qko7QUFwRUQ7QUE5UFMsQ0FBYiIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvcHJlZmVyLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgY29uc3QgZG9jcyA9IHtcbiAgICBhY2NvdW50OiB7XG4gICAgICAgIF9kb2M6IGBcbiMgQWNjb3VudCB0eXBlXG5cblJlY2FsbCB0aGF0IGEgc21hcnQgY29udHJhY3QgYW5kIGFuIGFjY291bnQgYXJlIHRoZSBzYW1lIHRoaW5nIGluIHRoZSBjb250ZXh0XG5vZiB0aGUgVE9OIEJsb2NrY2hhaW4sIGFuZCB0aGF0IHRoZXNlIHRlcm1zIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSwgYXRcbmxlYXN0IGFzIGxvbmcgYXMgb25seSBzbWFsbCAob3Ig4oCcdXN1YWzigJ0pIHNtYXJ0IGNvbnRyYWN0cyBhcmUgY29uc2lkZXJlZC4gQSBsYXJnZVxuc21hcnQtY29udHJhY3QgbWF5IGVtcGxveSBzZXZlcmFsIGFjY291bnRzIGx5aW5nIGluIGRpZmZlcmVudCBzaGFyZGNoYWlucyBvZlxudGhlIHNhbWUgd29ya2NoYWluIGZvciBsb2FkIGJhbGFuY2luZyBwdXJwb3Nlcy5cblxuQW4gYWNjb3VudCBpcyBpZGVudGlmaWVkIGJ5IGl0cyBmdWxsIGFkZHJlc3MgYW5kIGlzIGNvbXBsZXRlbHkgZGVzY3JpYmVkIGJ5XG5pdHMgc3RhdGUuIEluIG90aGVyIHdvcmRzLCB0aGVyZSBpcyBub3RoaW5nIGVsc2UgaW4gYW4gYWNjb3VudCBhcGFydCBmcm9tIGl0c1xuYWRkcmVzcyBhbmQgc3RhdGUuXG4gICAgICAgICAgIGAsXG4gICAgICAgIGlkOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGlkIGZpZWxkKS5gLFxuICAgICAgICBhY2NfdHlwZTogYFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjoge2FjY190eXBlOntlcToxfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfcGFpZDogYFxuQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50XG5jb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSxcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXG5cXGBcXGBcXGBcbnF1ZXJ5e1xuICBhY2NvdW50cyhmaWx0ZXI6IHtcbiAgICBsYXN0X3BhaWQ6e2dlOjE1NjcyOTYwMDB9XG4gIH0pIHtcbiAgaWRcbiAgbGFzdF9wYWlkfVxufVxuXFxgXFxgXFxgICAgICBcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICBkdWVfcGF5bWVudDogYFxuSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjLSBjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7IGR1ZV9wYXltZW50OiB7IG5lOiBudWxsIH0gfSlcbiAgICB7XG4gICAgICBpZFxuICAgIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBsYXN0X3RyYW5zX2x0OiBgIGAsXG4gICAgICAgIGJhbGFuY2U6IGBcblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhvcmRlckJ5OntwYXRoOlwiYmFsYW5jZVwiLGRpcmVjdGlvbjpERVNDfSl7XG4gICAgYmFsYW5jZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgYmFsYW5jZV9vdGhlcjogYCBgLFxuICAgICAgICBzcGxpdF9kZXB0aDogYElzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy5gLFxuICAgICAgICB0aWNrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5gLFxuICAgICAgICB0b2NrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5cblxcYFxcYFxcYCAgICAgICAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e3RvY2s6e25lOm51bGx9fSl7XG4gICAgaWRcbiAgICB0b2NrXG4gICAgdGlja1xuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgY29kZTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGNvZGUgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5cblxcYFxcYFxcYCAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e2NvZGU6e2VxOm51bGx9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59ICAgXG5cXGBcXGBcXGAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgYCxcbiAgICAgICAgZGF0YTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5gLFxuICAgICAgICBsaWJyYXJ5OiBgSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QuYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIGFjY291bnQgc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgfSxcbiAgICBtZXNzYWdlOiB7XG4gICAgICAgIF9kb2M6IGAjIE1lc3NhZ2UgdHlwZVxuXG4gICAgICAgICAgIE1lc3NhZ2UgbGF5b3V0IHF1ZXJpZXMuICBBIG1lc3NhZ2UgY29uc2lzdHMgb2YgaXRzIGhlYWRlciBmb2xsb3dlZCBieSBpdHNcbiAgICAgICAgICAgYm9keSBvciBwYXlsb2FkLiBUaGUgYm9keSBpcyBlc3NlbnRpYWxseSBhcmJpdHJhcnksIHRvIGJlIGludGVycHJldGVkIGJ5IHRoZVxuICAgICAgICAgICBkZXN0aW5hdGlvbiBzbWFydCBjb250cmFjdC4gSXQgY2FuIGJlIHF1ZXJpZWQgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpgLFxuICAgICAgICBtc2dfdHlwZTogYFJldHVybnMgdGhlIHR5cGUgb2YgbWVzc2FnZS5gLFxuICAgICAgICBzdGF0dXM6IGBSZXR1cm5zIGludGVybmFsIHByb2Nlc3Npbmcgc3RhdHVzIGFjY29yZGluZyB0byB0aGUgbnVtYmVycyBzaG93bi5gLFxuICAgICAgICBibG9ja19pZDogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2R5OiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2UgYm9keSBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBzcGxpdF9kZXB0aDogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdGljazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdG9jazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBjb2RlOiBgUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICBkYXRhOiBgUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgbGlicmFyeTogYFJlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBzcmM6IGBSZXR1cm5zIHNvdXJjZSBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIGRzdDogYFJldHVybnMgZGVzdGluYXRpb24gYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBzcmNfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBzb3VyY2UgYWRkcmVzcyAoc3JjIGZpZWxkKWAsXG4gICAgICAgIGRzdF93b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKGRzdCBmaWVsZClgLFxuICAgICAgICBjcmVhdGVkX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGNyZWF0ZWRfYXQ6IGBDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgaWhyX2Rpc2FibGVkOiBgSUhSIGlzIGRpc2FibGVkIGZvciB0aGUgbWVzc2FnZS5gLFxuICAgICAgICBpaHJfZmVlOiBgVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS5gLFxuICAgICAgICBmd2RfZmVlOiBgT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuYCxcbiAgICAgICAgaW1wb3J0X2ZlZTogYGAsXG4gICAgICAgIGJvdW5jZTogYEJvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgYm91bmNlZDogYEJvdW5jZWQgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIHZhbHVlOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudGAsXG4gICAgICAgIHZhbHVlX290aGVyOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IG1lc3NhZ2UgaXMgYSBwYXJ0IG9mIGEgYmxvY2sgaXQgY3V0IGZyb20uIEl0IGlzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBBIGJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIHN0cnVjdHVyZSBlbmNvZGVkIGFzIGJhc2U2NC5gXG4gICAgfSxcblxuXG4gICAgdHJhbnNhY3Rpb24gOiB7XG4gICAgICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgICAgICBfOiB7Y29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucyd9LFxuICAgICAgICB0cl90eXBlOiBgVHJhbnNhY3Rpb24gdHlwZSBhY2NvcmRpbmcgdG8gdGhlIG9yaWdpbmFsIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbiwgY2xhdXNlIDQuMi40LmAsXG4gICAgICAgIHN0YXR1czogYFRyYW5zYWN0aW9uIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBgLFxuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoYWNjb3VudF9hZGRyIGZpZWxkKWAsXG4gICAgICAgIGx0OiBgTG9naWNhbCB0aW1lLiBBIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSBbdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdGVzdC50b24ub3JnL3RibGtjaC5wZGYpLmAsXG4gICAgICAgIHByZXZfdHJhbnNfaGFzaDogYGAsXG4gICAgICAgIHByZXZfdHJhbnNfbHQ6IGBgLFxuICAgICAgICBub3c6IGBgLFxuICAgICAgICBvdXRtc2dfY250OiBgVGhlIG51bWJlciBvZiBnZW5lcmF0ZWQgb3V0Ym91bmQgbWVzc2FnZXMgKG9uZSBvZiB0aGUgY29tbW9uIHRyYW5zYWN0aW9uIHBhcmFtZXRlcnMgZGVmaW5lZCBieSB0aGUgc3BlY2lmaWNhdGlvbilgLFxuICAgICAgICBvcmlnX3N0YXR1czogYFRoZSBpbml0aWFsIHN0YXRlIG9mIGFjY291bnQuIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgdGhlIHF1ZXJ5IG1heSByZXR1cm4gMCwgaWYgdGhlIGFjY291bnQgd2FzIG5vdCBhY3RpdmUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbiBhbmQgMSBpZiBpdCB3YXMgYWxyZWFkeSBhY3RpdmVgLFxuICAgICAgICBlbmRfc3RhdHVzOiBgVGhlIGVuZCBzdGF0ZSBvZiBhbiBhY2NvdW50IGFmdGVyIGEgdHJhbnNhY3Rpb24sIDEgaXMgcmV0dXJuZWQgdG8gaW5kaWNhdGUgYSBmaW5hbGl6ZWQgdHJhbnNhY3Rpb24gYXQgYW4gYWN0aXZlIGFjY291bnRgLFxuICAgICAgICBpbl9tc2c6IGBgLFxuICAgICAgICBpbl9tZXNzYWdlOiBgYCxcbiAgICAgICAgb3V0X21zZ3M6IGBEaWN0aW9uYXJ5IG9mIHRyYW5zYWN0aW9uIG91dGJvdW5kIG1lc3NhZ2VzIGFzIHNwZWNpZmllZCBpbiB0aGUgc3BlY2lmaWNhdGlvbmAsXG4gICAgICAgIG91dF9tZXNzYWdlczogYGAsXG4gICAgICAgIHRvdGFsX2ZlZXM6IGBUb3RhbCBhbW91bnQgb2YgZmVlcyB0aGF0IGVudGFpbHMgYWNjb3VudCBzdGF0ZSBjaGFuZ2UgYW5kIHVzZWQgaW4gTWVya2xlIHVwZGF0ZWAsXG4gICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IGBTYW1lIGFzIGFib3ZlLCBidXQgcmVzZXJ2ZWQgZm9yIG5vbiBncmFtIGNvaW5zIHRoYXQgbWF5IGFwcGVhciBpbiB0aGUgYmxvY2tjaGFpbmAsXG4gICAgICAgIG9sZF9oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIG5ld19oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIGNyZWRpdF9maXJzdDogYGAsXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGBUaGlzIGZpZWxkIGRlZmluZXMgdGhlIGFtb3VudCBvZiBzdG9yYWdlIGZlZXMgY29sbGVjdGVkIGluIGdyYW1zLmAsXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIHRoZSBhbW91bnQgb2YgZHVlIGZlZXMgaW4gZ3JhbXMsIGl0IG1pZ2h0IGJlIGVtcHR5LmAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIGFjY291bnQgc3RhdHVzIGNoYW5nZSBhZnRlciB0aGUgdHJhbnNhY3Rpb24gaXMgY29tcGxldGVkLmAsXG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlZGl0OiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGFjY291bnQgaXMgY3JlZGl0ZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSByZWNlaXZlZC4gVGhlIGNyZWRpdCBwaGFzZSBjYW4gcmVzdWx0IGluIHRoZSBjb2xsZWN0aW9uIG9mIHNvbWUgZHVlIHBheW1lbnRzYCxcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYFRoZSBzdW0gb2YgZHVlX2ZlZXNfY29sbGVjdGVkIGFuZCBjcmVkaXQgbXVzdCBlcXVhbCB0aGUgdmFsdWUgb2YgdGhlIG1lc3NhZ2UgcmVjZWl2ZWQsIHBsdXMgaXRzIGlocl9mZWUgaWYgdGhlIG1lc3NhZ2UgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHZpYSBJbnN0YW50IEh5cGVyY3ViZSBSb3V0aW5nLCBJSFIgKG90aGVyd2lzZSB0aGUgaWhyX2ZlZSBpcyBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzKS5gLFxuICAgICAgICAgICAgY3JlZGl0OiBgYCxcbiAgICAgICAgICAgIGNyZWRpdF9vdGhlcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgY29kZSBvZiB0aGUgc21hcnQgY29udHJhY3QgaXMgaW52b2tlZCBpbnNpZGUgYW4gaW5zdGFuY2Ugb2YgVFZNIHdpdGggYWRlcXVhdGUgcGFyYW1ldGVycywgaW5jbHVkaW5nIGEgY29weSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGFuZCBvZiB0aGUgcGVyc2lzdGVudCBkYXRhLCBhbmQgdGVybWluYXRlcyB3aXRoIGFuIGV4aXQgY29kZSwgdGhlIG5ldyBwZXJzaXN0ZW50IGRhdGEsIGFuZCBhbiBhY3Rpb24gbGlzdCAod2hpY2ggaW5jbHVkZXMsIGZvciBpbnN0YW5jZSwgb3V0Ym91bmQgbWVzc2FnZXMgdG8gYmUgc2VudCkuIFRoZSBwcm9jZXNzaW5nIHBoYXNlIG1heSBsZWFkIHRvIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBhY2NvdW50ICh1bmluaXRpYWxpemVkIG9yIGFjdGl2ZSksIG9yIHRvIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50LiBUaGUgZ2FzIHBheW1lbnQsIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIHRoZSBnYXMgcHJpY2UgYW5kIHRoZSBnYXMgY29uc3VtZWQsIGlzIGV4YWN0ZWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlLlxuSWYgdGhlcmUgaXMgbm8gcmVhc29uIHRvIHNraXAgdGhlIGNvbXB1dGluZyBwaGFzZSwgVFZNIGlzIGludm9rZWQgYW5kIHRoZSByZXN1bHRzIG9mIHRoZSBjb21wdXRhdGlvbiBhcmUgbG9nZ2VkLiBQb3NzaWJsZSBwYXJhbWV0ZXJzIGFyZSBjb3ZlcmVkIGJlbG93LmAsXG4gICAgICAgICAgICBjb21wdXRlX3R5cGU6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb246IGBSZWFzb24gZm9yIHNraXBwaW5nIHRoZSBjb21wdXRlIHBoYXNlLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24sIHRoZSBwaGFzZSBjYW4gYmUgc2tpcHBlZCBkdWUgdG8gdGhlIGFic2VuY2Ugb2YgZnVuZHMgdG8gYnV5IGdhcywgYWJzZW5jZSBvZiBzdGF0ZSBvZiBhbiBhY2NvdW50IG9yIGEgbWVzc2FnZSwgZmFpbHVyZSB0byBwcm92aWRlIGEgdmFsaWQgc3RhdGUgaW4gdGhlIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3VjY2VzczogYFRoaXMgZmxhZyBpcyBzZXQgaWYgYW5kIG9ubHkgaWYgZXhpdF9jb2RlIGlzIGVpdGhlciAwIG9yIDEuYCxcbiAgICAgICAgICAgIG1zZ19zdGF0ZV91c2VkOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KVRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylgLFxuICAgICAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGBUaGUgZmxhZyByZWZsZWN0cyB3aGV0aGVyIHRoaXMgaGFzIHJlc3VsdGVkIGluIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSBmcm96ZW4sIHVuaW5pdGlhbGl6ZWQgb3Igbm9uLWV4aXN0ZW50IGFjY291bnQuYCxcbiAgICAgICAgICAgIGdhc19mZWVzOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIHRvdGFsIGdhcyBmZWVzIGNvbGxlY3RlZCBieSB0aGUgdmFsaWRhdG9ycyBmb3IgZXhlY3V0aW5nIHRoaXMgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgZ2FzX3VzZWQgYW5kIGdhc19wcmljZSBmcm9tIHRoZSBjdXJyZW50IGJsb2NrIGhlYWRlci5gLFxuICAgICAgICAgICAgZ2FzX3VzZWQ6IGBgLFxuICAgICAgICAgICAgZ2FzX2xpbWl0OiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIGdhcyBsaW1pdCBmb3IgdGhpcyBpbnN0YW5jZSBvZiBUVk0uIEl0IGVxdWFscyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgR3JhbXMgY3JlZGl0ZWQgaW4gdGhlIGNyZWRpdCBwaGFzZSBmcm9tIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGRpdmlkZWQgYnkgdGhlIGN1cnJlbnQgZ2FzIHByaWNlLCBvciB0aGUgZ2xvYmFsIHBlci10cmFuc2FjdGlvbiBnYXMgbGltaXQuYCxcbiAgICAgICAgICAgIGdhc19jcmVkaXQ6IGBUaGlzIHBhcmFtZXRlciBtYXkgYmUgbm9uLXplcm8gb25seSBmb3IgZXh0ZXJuYWwgaW5ib3VuZCBtZXNzYWdlcy4gSXQgaXMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIGFtb3VudCBvZiBnYXMgdGhhdCBjYW4gYmUgcGFpZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2Ugb3IgdGhlIG1heGltdW0gZ2FzIGNyZWRpdGAsXG4gICAgICAgICAgICBtb2RlOiBgYCxcbiAgICAgICAgICAgIGV4aXRfY29kZTogYFRoZXNlIHBhcmFtZXRlciByZXByZXNlbnRzIHRoZSBzdGF0dXMgdmFsdWVzIHJldHVybmVkIGJ5IFRWTTsgZm9yIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgZXhpdF9jb2RlIGhhcyB0byBiZSAwIG9yIDFgLFxuICAgICAgICAgICAgZXhpdF9hcmc6IGBgLFxuICAgICAgICAgICAgdm1fc3RlcHM6IGB0aGUgdG90YWwgbnVtYmVyIG9mIHN0ZXBzIHBlcmZvcm1lZCBieSBUVk0gKHVzdWFsbHkgZXF1YWwgdG8gdHdvIHBsdXMgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMgZXhlY3V0ZWQsIGluY2x1ZGluZyBpbXBsaWNpdCBSRVRzKWAsXG4gICAgICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSByZXN1bHRpbmcgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSBzbWFydCBjb250cmFjdCBoYXMgdGVybWluYXRlZCBzdWNjZXNzZnVsbHkgKHdpdGggZXhpdCBjb2RlIDAgb3IgMSksIHRoZSBhY3Rpb25zIGZyb20gdGhlIGxpc3QgYXJlIHBlcmZvcm1lZC4gSWYgaXQgaXMgaW1wb3NzaWJsZSB0byBwZXJmb3JtIGFsbCBvZiB0aGVt4oCUZm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgaW5zdWZmaWNpZW50IGZ1bmRzIHRvIHRyYW5zZmVyIHdpdGggYW4gb3V0Ym91bmQgbWVzc2FnZeKAlHRoZW4gdGhlIHRyYW5zYWN0aW9uIGlzIGFib3J0ZWQgYW5kIHRoZSBhY2NvdW50IHN0YXRlIGlzIHJvbGxlZCBiYWNrLiBUaGUgdHJhbnNhY3Rpb24gaXMgYWxzbyBhYm9ydGVkIGlmIHRoZSBzbWFydCBjb250cmFjdCBkaWQgbm90IHRlcm1pbmF0ZSBzdWNjZXNzZnVsbHksIG9yIGlmIGl0IHdhcyBub3QgcG9zc2libGUgdG8gaW52b2tlIHRoZSBzbWFydCBjb250cmFjdCBhdCBhbGwgYmVjYXVzZSBpdCBpcyB1bmluaXRpYWxpemVkIG9yIGZyb3plbi5gLFxuICAgICAgICAgICAgc3VjY2VzczogYGAsXG4gICAgICAgICAgICB2YWxpZDogYGAsXG4gICAgICAgICAgICBub19mdW5kczogYFRoZSBmbGFnIGluZGljYXRlcyBhYnNlbmNlIG9mIGZ1bmRzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhbiBvdXRib3VuZCBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBgLFxuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2NvZGU6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2FyZzogYGAsXG4gICAgICAgICAgICB0b3RfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBzcGVjX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIG1zZ3NfY3JlYXRlZDogYGAsXG4gICAgICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBib3VuY2U6IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuIEFsbW9zdCBhbGwgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIGluYm91bmQgbWVzc2FnZSAobWludXMgZ2FzIHBheW1lbnRzIGFuZCBmb3J3YXJkaW5nIGZlZXMpIGlzIHRyYW5zZmVycmVkIHRvIHRoZSBnZW5lcmF0ZWQgbWVzc2FnZSwgd2hpY2ggb3RoZXJ3aXNlIGhhcyBhbiBlbXB0eSBib2R5LmAsXG4gICAgICAgICAgICBib3VuY2VfdHlwZTogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgICAgIHJlcV9md2RfZmVlczogYGAsXG4gICAgICAgICAgICBtc2dfZmVlczogYGAsXG4gICAgICAgICAgICBmd2RfZmVlczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGFib3J0ZWQ6IGBgLFxuICAgICAgICBkZXN0cm95ZWQ6IGBgLFxuICAgICAgICB0dDogYGAsXG4gICAgICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgZmllbGRzIGJlbG93IGNvdmVyIHNwbGl0IHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zIGFuZCBtZXJnZSBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucywgdGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSByZWxldmFudCBzY2hlbWVzIGNvdmVyZWQgYnkgdGhlIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbi5gLFxuICAgICAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IGBsZW5ndGggb2YgdGhlIGN1cnJlbnQgc2hhcmQgcHJlZml4YCxcbiAgICAgICAgICAgIGFjY19zcGxpdF9kZXB0aDogYGAsXG4gICAgICAgICAgICB0aGlzX2FkZHI6IGBgLFxuICAgICAgICAgICAgc2libGluZ19hZGRyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgcHJlcGFyZV90cmFuc2FjdGlvbjogYGAsXG4gICAgICAgIGluc3RhbGxlZDogYGAsXG4gICAgICAgIHByb29mOiBgYCxcbiAgICAgICAgYm9jOiBgYCxcbiAgICB9LFxuXG4gICAgc2hhcmREZXNjcjoge1xuICAgICAgICBfZG9jOiBgU2hhcmRIYXNoZXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBkaWN0aW9uYXJ5IHdpdGggMzItYml0IHdvcmtjaGFpbl9pZHMgYXMga2V5cywgYW5kIOKAnHNoYXJkIGJpbmFyeSB0cmVlc+KAnSwgcmVwcmVzZW50ZWQgYnkgVEwtQiB0eXBlIEJpblRyZWUgU2hhcmREZXNjciwgYXMgdmFsdWVzLiBFYWNoIGxlYWYgb2YgdGhpcyBzaGFyZCBiaW5hcnkgdHJlZSBjb250YWlucyBhIHZhbHVlIG9mIHR5cGUgU2hhcmREZXNjciwgd2hpY2ggZGVzY3JpYmVzIGEgc2luZ2xlIHNoYXJkIGJ5IGluZGljYXRpbmcgdGhlIHNlcXVlbmNlIG51bWJlciBzZXFfbm8sIHRoZSBsb2dpY2FsIHRpbWUgbHQsIGFuZCB0aGUgaGFzaCBoYXNoIG9mIHRoZSBsYXRlc3QgKHNpZ25lZCkgYmxvY2sgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2hhcmRjaGFpbi5gLFxuICAgICAgICBzZXFfbm86IGB1aW50MzIgc2VxdWVuY2UgbnVtYmVyYCxcbiAgICAgICAgcmVnX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgICAgIHN0YXJ0X2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIHN0YXJ0YCxcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIGVuZGAsXG4gICAgICAgIHJvb3RfaGFzaDogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi4gVGhlIHNoYXJkIGJsb2NrIGNvbmZpZ3VyYXRpb24gaXMgZGVyaXZlZCBmcm9tIHRoYXQgYmxvY2suYCxcbiAgICAgICAgZmlsZV9oYXNoOiBgU2hhcmQgYmxvY2sgZmlsZSBoYXNoLmAsXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYFRPTiBCbG9ja2NoYWluIHN1cHBvcnRzIGR5bmFtaWMgc2hhcmRpbmcsIHNvIHRoZSBzaGFyZCBjb25maWd1cmF0aW9uIG1heSBjaGFuZ2UgZnJvbSBibG9jayB0byBibG9jayBiZWNhdXNlIG9mIHNoYXJkIG1lcmdlIGFuZCBzcGxpdCBldmVudHMuIFRoZXJlZm9yZSwgd2UgY2Fubm90IHNpbXBseSBzYXkgdGhhdCBlYWNoIHNoYXJkY2hhaW4gY29ycmVzcG9uZHMgdG8gYSBmaXhlZCBzZXQgb2YgYWNjb3VudCBjaGFpbnMuXG5BIHNoYXJkY2hhaW4gYmxvY2sgYW5kIGl0cyBzdGF0ZSBtYXkgZWFjaCBiZSBjbGFzc2lmaWVkIGludG8gdHdvIGRpc3RpbmN0IHBhcnRzLiBUaGUgcGFydHMgd2l0aCB0aGUgSVNQLWRpY3RhdGVkIGZvcm0gb2Ygd2lsbCBiZSBjYWxsZWQgdGhlIHNwbGl0IHBhcnRzIG9mIHRoZSBibG9jayBhbmQgaXRzIHN0YXRlLCB3aGlsZSB0aGUgcmVtYWluZGVyIHdpbGwgYmUgY2FsbGVkIHRoZSBub24tc3BsaXQgcGFydHMuXG5UaGUgbWFzdGVyY2hhaW4gY2Fubm90IGJlIHNwbGl0IG9yIG1lcmdlZC5gLFxuICAgICAgICBiZWZvcmVfbWVyZ2U6IGBgLFxuICAgICAgICB3YW50X3NwbGl0OiBgYCxcbiAgICAgICAgd2FudF9tZXJnZTogYGAsXG4gICAgICAgIG54X2NjX3VwZGF0ZWQ6IGBgLFxuICAgICAgICBmbGFnczogYGAsXG4gICAgICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYGAsXG4gICAgICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBgLFxuICAgICAgICBnZW5fdXRpbWU6IGBHZW5lcmF0aW9uIHRpbWUgaW4gdWludDMyYCxcbiAgICAgICAgc3BsaXRfdHlwZTogYGAsXG4gICAgICAgIHNwbGl0OiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6YEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkX290aGVyOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIHN0YXR1czogYFJldHVybnMgYmxvY2sgcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgIGdsb2JhbF9pZDogYHVpbnQzMiBnbG9iYWwgYmxvY2sgSURgLFxuICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgIHNlcV9ubzogYGAsXG4gICAgYWZ0ZXJfbWVyZ2U6IGBgLFxuICAgIGdlbl91dGltZTogYHVpbnQgMzIgZ2VuZXJhdGlvbiB0aW1lIHN0YW1wYCxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgIGZsYWdzOiBgYCxcbiAgICBtYXN0ZXJfcmVmOiBgYCxcbiAgICBwcmV2X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2suYCxcbiAgICBwcmV2X2FsdF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2Ygc2hhcmQgbWVyZ2UuYCxcbiAgICBwcmV2X3ZlcnRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHZlcnRpY2FsIGJsb2Nrcy5gLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBgYCxcbiAgICB2ZXJzaW9uOiBgdWluMzIgYmxvY2sgdmVyc2lvbiBpZGVudGlmaWVyYCxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgYmVmb3JlX3NwbGl0OiBgYCxcbiAgICBhZnRlcl9zcGxpdDogYGAsXG4gICAgd2FudF9tZXJnZTogYGAsXG4gICAgdmVydF9zZXFfbm86IGBgLFxuICAgIHN0YXJ0X2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gc3RhcnQuXG5Mb2dpY2FsIHRpbWUgaXMgYSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25gLFxuICAgIGVuZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIGVuZC5gLFxuICAgIHdvcmtjaGFpbl9pZDogYHVpbnQzMiB3b3JrY2hhaW4gaWRlbnRpZmllcmAsXG4gICAgc2hhcmQ6IGBgLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogYFJldHVybnMgYSBudW1iZXIgb2YgYSBwcmV2aW91cyBrZXkgYmxvY2suYCxcbiAgICBnZW5fc29mdHdhcmVfdmVyc2lvbjogYGAsXG4gICAgZ2VuX3NvZnR3YXJlX2NhcGFiaWxpdGllczogYGAsXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogYEFtb3VudCBvZiBncmFtcyBhbW91bnQgdG8gdGhlIG5leHQgYmxvY2suYCxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICBleHBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBleHBvcnRlZC5gLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGV4cG9ydGVkLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IGBgLFxuICAgICAgICBjcmVhdGVkOiBgYCxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogYGAsXG4gICAgICAgIGltcG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGltcG9ydGVkLmAsXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogYEFtb3VudCBvZiBncmFtcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgIG1pbnRlZDogYEFtb3VudCBvZiBncmFtcyBtaW50ZWQgaW4gdGhpcyBibG9jay5gLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IGBgLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIGdyYW1zYCxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGBgLFxuICAgIHJhbmRfc2VlZDogYGAsXG4gICAgb3V0X21zZ19kZXNjcjogYGAsXG4gICAgYWNjb3VudF9ibG9ja3M6IHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBgYCxcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICBvbGRfaGFzaDogYG9sZCB2ZXJzaW9uIG9mIGJsb2NrIGhhc2hlc2AsXG4gICAgICAgICAgICBuZXdfaGFzaDogYG5ldyB2ZXJzaW9uIG9mIGJsb2NrIGhhc2hlc2BcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGBgXG4gICAgfSxcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBgYCxcbiAgICAgICAgbmV3X2hhc2g6IGBgLFxuICAgICAgICBuZXdfZGVwdGg6IGBgLFxuICAgICAgICBvbGQ6IGBgLFxuICAgICAgICBvbGRfaGFzaDogYGAsXG4gICAgICAgIG9sZF9kZXB0aDogYGBcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBtaW5fc2hhcmRfZ2VuX3V0aW1lOiAnTWluIGJsb2NrIGdlbmVyYXRpb24gdGltZSBvZiBzaGFyZHMnLFxuICAgICAgICBtYXhfc2hhcmRfZ2VuX3V0aW1lOiAnTWF4IGJsb2NrIGdlbmVyYXRpb24gdGltZSBvZiBzaGFyZHMnLFxuICAgICAgICBzaGFyZF9oYXNoZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBzaGFyZCBoYXNoZXNgLFxuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgVWludDMyIHdvcmtjaGFpbiBJRGAsXG4gICAgICAgICAgICBzaGFyZDogYFNoYXJkIElEYCxcbiAgICAgICAgICAgIGRlc2NyOiBgU2hhcmQgZGVzY3JpcHRpb25gLFxuICAgICAgICB9LFxuICAgICAgICBzaGFyZF9mZWVzOiB7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgc2hhcmQ6IGBgLFxuICAgICAgICAgICAgZmVlczogYEFtb3VudCBvZiBmZWVzIGluIGdyYW1zYCxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IGBBcnJheSBvZiBmZWVzIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzYCxcbiAgICAgICAgICAgIGNyZWF0ZTogYEFtb3VudCBvZiBmZWVzIGNyZWF0ZWQgZHVyaW5nIHNoYXJkYCxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBmZWVzIGNyZWF0ZWQgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXMgZHVyaW5nIHRoZSBibG9jay5gLFxuICAgICAgICB9LFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGBgLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgcHJldmlvdXMgYmxvY2sgc2lnbmF0dXJlc2AsXG4gICAgICAgICAgICBub2RlX2lkOiBgYCxcbiAgICAgICAgICAgIHI6IGBgLFxuICAgICAgICAgICAgczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ19hZGRyOiBgYCxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogYEFkZHJlc3Mgb2YgY29uZmlnIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMTogYEFkZHJlc3Mgb2YgZWxlY3RvciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDI6IGBBZGRyZXNzIG9mIG1pbnRlciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDM6IGBBZGRyZXNzIG9mIGZlZSBjb2xsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHA0OiBgQWRkcmVzcyBvZiBUT04gRE5TIHJvb3Qgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZ3VyYXRpb24gcGFyYW1ldGVyIDZgLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgN2AsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IGBgLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBHbG9iYWwgdmVyc2lvbmAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYE1hbmRhdG9yeSBwYXJhbXNgLFxuICAgICAgICAgICAgcDEwOiBgQ3JpdGljYWwgcGFyYW1zYCxcbiAgICAgICAgICAgIHAxMToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWcgdm90aW5nIHNldHVwYCxcbiAgICAgICAgICAgICAgICBub3JtYWxfcGFyYW1zOiBgYCxcbiAgICAgICAgICAgICAgICBjcml0aWNhbF9wYXJhbXM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxMjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBhbGwgd29ya2NoYWlucyBkZXNjcmlwdGlvbnNgLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICAgICAgZW5hYmxlZF9zaW5jZTogYGAsXG4gICAgICAgICAgICAgICAgYWN0dWFsX21pbl9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIGFjdGl2ZTogYGAsXG4gICAgICAgICAgICAgICAgYWNjZXB0X21zZ3M6IGBgLFxuICAgICAgICAgICAgICAgIGZsYWdzOiBgYCxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfcm9vdF9oYXNoOiBgYCxcbiAgICAgICAgICAgICAgICB6ZXJvc3RhdGVfZmlsZV9oYXNoOiBgYCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICBiYXNpYzogYGAsXG4gICAgICAgICAgICAgICAgdm1fdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgdm1fbW9kZTogYGAsXG4gICAgICAgICAgICAgICAgbWluX2FkZHJfbGVuOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgIGFkZHJfbGVuX3N0ZXA6IGBgLFxuICAgICAgICAgICAgICAgIHdvcmtjaGFpbl90eXBlX2lkOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTQ6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQmxvY2sgY3JlYXRlIGZlZXNgLFxuICAgICAgICAgICAgICAgIG1hc3RlcmNoYWluX2Jsb2NrX2ZlZTogYGAsXG4gICAgICAgICAgICAgICAgYmFzZWNoYWluX2Jsb2NrX2ZlZTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE1OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEVsZWN0aW9uIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgIHZhbGlkYXRvcnNfZWxlY3RlZF9mb3I6IGBgLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19zdGFydF9iZWZvcmU6IGBgLFxuICAgICAgICAgICAgICAgIGVsZWN0aW9uc19lbmRfYmVmb3JlOiBgYCxcbiAgICAgICAgICAgICAgICBzdGFrZV9oZWxkX2ZvcjogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYFZhbGlkYXRvcnMgY291bnRgLFxuICAgICAgICAgICAgICAgIG1heF92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfbWFpbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE3OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYFZhbGlkYXRvciBzdGFrZSBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICBtaW5fc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWluX3RvdGFsX3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2VfZmFjdG9yOiBgYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBTdG9yYWdlIHByaWNlc2AsXG4gICAgICAgICAgICAgICAgdXRpbWVfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgIGJpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgbWNfYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICBtY19jZWxsX3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjA6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyMTogYEdhcyBsaW1pdHMgYW5kIHByaWNlcyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgIHAyMjogYEJsb2NrIGxpbWl0cyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDIzOiBgQmxvY2sgbGltaXRzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgcDI0OiBgTWVzc2FnZSBmb3J3YXJkIHByaWNlcyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDI1OiBgTWVzc2FnZSBmb3J3YXJkIHByaWNlcyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgIHAyODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDYXRjaGFpbiBjb25maWdgLFxuICAgICAgICAgICAgICAgIG1jX2NhdGNoYWluX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICBzaGFyZF9jYXRjaGFpbl9saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmRfdmFsaWRhdG9yc19udW06IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25zZW5zdXMgY29uZmlnYCxcbiAgICAgICAgICAgICAgICByb3VuZF9jYW5kaWRhdGVzOiBgYCxcbiAgICAgICAgICAgICAgICBuZXh0X2NhbmRpZGF0ZV9kZWxheV9tczogYGAsXG4gICAgICAgICAgICAgICAgY29uc2Vuc3VzX3RpbWVvdXRfbXM6IGBgLFxuICAgICAgICAgICAgICAgIGZhc3RfYXR0ZW1wdHM6IGBgLFxuICAgICAgICAgICAgICAgIGF0dGVtcHRfZHVyYXRpb246IGBgLFxuICAgICAgICAgICAgICAgIGNhdGNoYWluX21heF9kZXBzOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfYmxvY2tfYnl0ZXM6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9jb2xsYXRlZF9ieXRlczogYGBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMzE6IGBBcnJheSBvZiBmdW5kYW1lbnRhbCBzbWFydCBjb250cmFjdHMgYWRkcmVzc2VzYCxcbiAgICAgICAgICAgIHAzMjogYFByZXZpb3VzIHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzMzogYFByZXZpb3VzIHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM0OiBgQ3VycmVudCB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzU6IGBDdXJyZW50IHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM2OiBgTmV4dCB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzc6IGBOZXh0IHRlbXByb3JhcnkgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHZhbGlkYXRvciBzaWduZWQgdGVtcHJvcmFyeSBrZXlzYCxcbiAgICAgICAgICAgICAgICBhZG5sX2FkZHI6IGBgLFxuICAgICAgICAgICAgICAgIHRlbXBfcHVibGljX2tleTogYGAsXG4gICAgICAgICAgICAgICAgc2Vxbm86IGBgLFxuICAgICAgICAgICAgICAgIHZhbGlkX3VudGlsOiBgYCxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfcjogYGAsXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3M6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH0sXG59XG59O1xuIl19