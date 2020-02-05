"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.docs = void 0;
// eslint-disable-next-line import/prefer-default-export
var docs = {
  account: {
    _doc: "\n# Account type\n\nRecall that a smart contract and an account are the same thing in the context\nof the TON Blockchain, and that these terms can be used interchangeably, at\nleast as long as only small (or \u201Cusual\u201D) smart contracts are considered. A large\nsmart-contract may employ several accounts lying in different shardchains of\nthe same workchain for load balancing purposes.\n\nAn account is identified by its full address and is completely described by\nits state. In other words, there is nothing else in an account apart from its\naddress and state.\n           ",
    id: "",
    workchain_id: "Workchain id of the account address (id field).",
    acc_type: "Returns the current status of the account.\n```\n{\n  accounts(filter: {acc_type:{eq:1}}){\n    id\n    acc_type\n  }\n}\n```\n        ",
    last_paid: "\nContains either the unixtime of the most recent storage payment\ncollected (usually this is the unixtime of the most recent transaction),\nor the unixtime when the account was created (again, by a transaction).\n```\nquery{\n  accounts(filter: {\n    last_paid:{ge:1567296000}\n  }) {\n  id\n  last_paid}\n}\n```     \n                ",
    due_payment: "\nIf present, accumulates the storage payments that could not be exacted from the balance of the account, represented by a strictly positive amount of nanograms; it can be present only for uninitialized or frozen accounts that have a balance of zero Grams (but may have non-zero balances in non gram cryptocurrencies). When due_payment becomes larger than the value of a configurable parameter of the blockchain, the ac- count is destroyed altogether, and its balance, if any, is transferred to the zero account.\n```\n{\n  accounts(filter: { due_payment: { ne: null } })\n    {\n      id\n    }\n}\n```\n        ",
    last_trans_lt: " ",
    balance: "\n```\n{\n  accounts(orderBy:{path:\"balance\",direction:DESC}){\n    balance\n  }\n}\n```\n        ",
    balance_other: " ",
    split_depth: "Is present and non-zero only in instances of large smart contracts.",
    tick: "May be present only in the masterchain\u2014and within the masterchain, only in some fundamental smart contracts required for the whole system to function.",
    tock: "May be present only in the masterchain\u2014and within the masterchain, only in some fundamental smart contracts required for the whole system to function.\n```        \n{\n  accounts (filter:{tock:{ne:null}}){\n    id\n    tock\n    tick\n  }\n}\n```\n        ",
    code: "If present, contains smart-contract code encoded with in base64.\n```  \n{\n  accounts (filter:{code:{eq:null}}){\n    id\n    acc_type\n  }\n}   \n```          \n        \n        \n        ",
    data: "If present, contains smart-contract data encoded with in base64.",
    library: "If present, contains library code used in smart-contract.",
    proof: "Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64.",
    boc: "Bag of cells with the account struct encoded as base64."
  },
  message: {
    _doc: "# Message type\n\n           Message layout queries.  A message consists of its header followed by its\n           body or payload. The body is essentially arbitrary, to be interpreted by the\n           destination smart contract. It can be queried with the following fields:",
    msg_type: "Returns the type of message.",
    status: "Returns internal processing status according to the numbers shown.",
    block_id: "Merkle proof that account is a part of shard state it cut from as a bag of cells with Merkle proof struct encoded as base64.",
    body: "Bag of cells with the message body encoded as base64.",
    split_depth: "This is only used for special contracts in masterchain to deploy messages.",
    tick: "This is only used for special contracts in masterchain to deploy messages.",
    tock: "This is only used for special contracts in masterchain to deploy messages",
    code: "Represents contract code in deploy messages.",
    data: "Represents initial data for a contract in deploy messages",
    library: "Represents contract library in deploy messages",
    src: "Returns source address string",
    dst: "Returns destination address string",
    src_workchain_id: "Workchain id of the source address (src field)",
    dst_workchain_id: "Workchain id of the destination address (dst field)",
    created_lt: "Logical creation time automatically set by the generating transaction.",
    created_at: "Creation unixtime automatically set by the generating transaction. The creation unixtime equals the creation unixtime of the block containing the generating transaction.",
    ihr_disabled: "IHR is disabled for the message.",
    ihr_fee: "This value is subtracted from the value attached to the message and awarded to the validators of the destination shardchain if they include the message by the IHR mechanism.",
    fwd_fee: "Original total forwarding fee paid for using the HR mechanism; it is automatically computed from some configuration parameters and the size of the message at the time the message is generated.",
    import_fee: "",
    bounce: "Bounce flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is \u201Cbounced\u201D by automatically generating an outbound message (with the bounce flag clear) to its original sender.",
    bounced: "Bounced flag. If the transaction has been aborted, and the inbound message has its bounce flag set, then it is \u201Cbounced\u201D by automatically generating an outbound message (with the bounce flag clear) to its original sender.",
    value: "May or may not be present",
    value_other: "May or may not be present.",
    proof: "Merkle proof that message is a part of a block it cut from. It is a bag of cells with Merkle proof struct encoded as base64.",
    boc: "A bag of cells with the message structure encoded as base64."
  },
  transaction: {
    _doc: 'TON Transaction',
    _: {
      collection: 'transactions'
    },
    tr_type: "Transaction type according to the original blockchain specification, clause 4.2.4.",
    status: "Transaction processing status",
    block_id: "",
    account_addr: "",
    workchain_id: "Workchain id of the account address (account_addr field)",
    lt: "Logical time. A component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see [the TON blockchain specification](https://test.ton.org/tblkch.pdf).",
    prev_trans_hash: "",
    prev_trans_lt: "",
    now: "",
    outmsg_cnt: "The number of generated outbound messages (one of the common transaction parameters defined by the specification)",
    orig_status: "The initial state of account. Note that in this case the query may return 0, if the account was not active before the transaction and 1 if it was already active",
    end_status: "The end state of an account after a transaction, 1 is returned to indicate a finalized transaction at an active account",
    in_msg: "",
    in_message: "",
    out_msgs: "Dictionary of transaction outbound messages as specified in the specification",
    out_messages: "",
    total_fees: "Total amount of fees that entails account state change and used in Merkle update",
    total_fees_other: "Same as above, but reserved for non gram coins that may appear in the blockchain",
    old_hash: "Merkle update field",
    new_hash: "Merkle update field",
    credit_first: "",
    storage: {
      storage_fees_collected: "This field defines the amount of storage fees collected in grams.",
      storage_fees_due: "This field represents the amount of due fees in grams, it might be empty.",
      status_change: "This field represents account status change after the transaction is completed."
    },
    credit: {
      _doc: "The account is credited with the value of the inbound message received. The credit phase can result in the collection of some due payments",
      due_fees_collected: "The sum of due_fees_collected and credit must equal the value of the message received, plus its ihr_fee if the message has not been received via Instant Hypercube Routing, IHR (otherwise the ihr_fee is awarded to the validators).",
      credit: "",
      credit_other: ""
    },
    compute: {
      _doc: "The code of the smart contract is invoked inside an instance of TVM with adequate parameters, including a copy of the inbound message and of the persistent data, and terminates with an exit code, the new persistent data, and an action list (which includes, for instance, outbound messages to be sent). The processing phase may lead to the creation of a new account (uninitialized or active), or to the activation of a previously uninitialized or frozen account. The gas payment, equal to the product of the gas price and the gas consumed, is exacted from the account balance.\nIf there is no reason to skip the computing phase, TVM is invoked and the results of the computation are logged. Possible parameters are covered below.",
      compute_type: "",
      skipped_reason: "Reason for skipping the compute phase. According to the specification, the phase can be skipped due to the absence of funds to buy gas, absence of state of an account or a message, failure to provide a valid state in the message",
      success: "This flag is set if and only if exit_code is either 0 or 1.",
      msg_state_used: "This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)This parameter reflects whether the state passed in the message has been used. If it is set, the account_activated flag is used (see below)",
      account_activated: "The flag reflects whether this has resulted in the activation of a previously frozen, uninitialized or non-existent account.",
      gas_fees: "This parameter reflects the total gas fees collected by the validators for executing this transaction. It must be equal to the product of gas_used and gas_price from the current block header.",
      gas_used: "",
      gas_limit: "This parameter reflects the gas limit for this instance of TVM. It equals the lesser of either the Grams credited in the credit phase from the value of the inbound message divided by the current gas price, or the global per-transaction gas limit.",
      gas_credit: "This parameter may be non-zero only for external inbound messages. It is the lesser of either the amount of gas that can be paid from the account balance or the maximum gas credit",
      mode: "",
      exit_code: "These parameter represents the status values returned by TVM; for a successful transaction, exit_code has to be 0 or 1",
      exit_arg: "",
      vm_steps: "the total number of steps performed by TVM (usually equal to two plus the number of instructions executed, including implicit RETs)",
      vm_init_state_hash: "This parameter is the representation hashes of the original state of TVM.",
      vm_final_state_hash: "This parameter is the representation hashes of the resulting state of TVM."
    },
    action: {
      _doc: "If the smart contract has terminated successfully (with exit code 0 or 1), the actions from the list are performed. If it is impossible to perform all of them\u2014for example, because of insufficient funds to transfer with an outbound message\u2014then the transaction is aborted and the account state is rolled back. The transaction is also aborted if the smart contract did not terminate successfully, or if it was not possible to invoke the smart contract at all because it is uninitialized or frozen.",
      success: "",
      valid: "",
      no_funds: "The flag indicates absence of funds required to create an outbound message",
      status_change: "",
      total_fwd_fees: "",
      total_action_fees: "",
      result_code: "",
      result_arg: "",
      tot_actions: "",
      spec_actions: "",
      skipped_actions: "",
      msgs_created: "",
      action_list_hash: "",
      total_msg_size_cells: "",
      total_msg_size_bits: ""
    },
    bounce: {
      _doc: "If the transaction has been aborted, and the inbound message has its bounce flag set, then it is \u201Cbounced\u201D by automatically generating an outbound message (with the bounce flag clear) to its original sender. Almost all value of the original inbound message (minus gas payments and forwarding fees) is transferred to the generated message, which otherwise has an empty body.",
      bounce_type: "",
      msg_size_cells: "",
      msg_size_bits: "",
      req_fwd_fees: "",
      msg_fees: "",
      fwd_fees: ""
    },
    aborted: "",
    destroyed: "",
    tt: "",
    split_info: {
      _doc: "The fields below cover split prepare and install transactions and merge prepare and install transactions, the fields correspond to the relevant schemes covered by the blockchain specification.",
      cur_shard_pfx_len: "length of the current shard prefix",
      acc_split_depth: "",
      this_addr: "",
      sibling_addr: ""
    },
    prepare_transaction: "",
    installed: "",
    proof: "",
    boc: ""
  },
  shardDescr: {
    _doc: "ShardHashes is represented by a dictionary with 32-bit workchain_ids as keys, and \u201Cshard binary trees\u201D, represented by TL-B type BinTree ShardDescr, as values. Each leaf of this shard binary tree contains a value of type ShardDescr, which describes a single shard by indicating the sequence number seq_no, the logical time lt, and the hash hash of the latest (signed) block of the corresponding shardchain.",
    seq_no: "uint32 sequence number",
    reg_mc_seqno: "Returns last known master block at the time of shard generation.",
    start_lt: "Logical time of the shardchain start",
    end_lt: "Logical time of the shardchain end",
    root_hash: "Returns last known master block at the time of shard generation. The shard block configuration is derived from that block.",
    file_hash: "Shard block file hash.",
    before_split: "TON Blockchain supports dynamic sharding, so the shard configuration may change from block to block because of shard merge and split events. Therefore, we cannot simply say that each shardchain corresponds to a fixed set of account chains.\nA shardchain block and its state may each be classified into two distinct parts. The parts with the ISP-dictated form of will be called the split parts of the block and its state, while the remainder will be called the non-split parts.\nThe masterchain cannot be split or merged.",
    before_merge: "",
    want_split: "",
    want_merge: "",
    nx_cc_updated: "",
    flags: "",
    next_catchain_seqno: "",
    next_validator_shard: "",
    min_ref_mc_seqno: "",
    gen_utime: "Generation time in uint32",
    split_type: "",
    split: "",
    fees_collected: "Amount of fees collected int his shard in grams.",
    fees_collected_other: "Amount of fees collected int his shard in non gram currencies.",
    funds_created: "Amount of funds created in this shard in grams.",
    funds_created_other: "Amount of funds created in this shard in non gram currencies."
  },
  block: {
    _doc: 'This is Block',
    status: "Returns block processing status",
    global_id: "uint32 global block ID",
    want_split: "",
    seq_no: "",
    after_merge: "",
    gen_utime: "uint 32 generation time stamp",
    gen_catchain_seqno: "",
    flags: "",
    master_ref: "",
    prev_ref: "External block reference for previous block.",
    prev_alt_ref: "External block reference for previous block in case of shard merge.",
    prev_vert_ref: "External block reference for previous block in case of vertical blocks.",
    prev_vert_alt_ref: "",
    version: "uin32 block version identifier",
    gen_validator_list_hash_short: "",
    before_split: "",
    after_split: "",
    want_merge: "",
    vert_seq_no: "",
    start_lt: "Logical creation time automatically set by the block formation start.\nLogical time is a component of the TON Blockchain that also plays an important role in message delivery is the logical time, usually denoted by Lt. It is a non-negative 64-bit integer, assigned to certain events. For more details, see the TON blockchain specification",
    end_lt: "Logical creation time automatically set by the block formation end.",
    workchain_id: "uint32 workchain identifier",
    shard: "",
    min_ref_mc_seqno: "Returns last known master block at the time of shard generation.",
    value_flow: {
      to_next_blk: "Amount of grams amount to the next block.",
      to_next_blk_other: "Amount of non gram cryptocurrencies to the next block.",
      exported: "Amount of grams exported.",
      exported_other: "Amount of non gram cryptocurrencies exported.",
      fees_collected: "",
      fees_collected_other: "",
      created: "",
      created_other: "",
      imported: "Amount of grams imported.",
      imported_other: "Amount of non gram cryptocurrencies imported.",
      from_prev_blk: "Amount of grams transferred from previous block.",
      from_prev_blk_other: "Amount of non gram cryptocurrencies transferred from previous block.",
      minted: "Amount of grams minted in this block.",
      minted_other: "",
      fees_imported: "Amount of import fees in grams",
      fees_imported_other: "Amount of import fees in non gram currencies."
    },
    in_msg_descr: "",
    rand_seed: "",
    out_msg_descr: "",
    account_blocks: {
      account_addr: "",
      transactions: "",
      state_update: {
        old_hash: "old version of block hashes",
        new_hash: "new version of block hashes"
      },
      tr_count: ""
    },
    state_update: {
      "new": "",
      new_hash: "",
      new_depth: "",
      old: "",
      old_hash: "",
      old_depth: ""
    },
    master: {
      shard_hashes: {
        _doc: "Array of shard hashes",
        workchain_id: "Uint32 workchain ID",
        shard: "Shard ID",
        descr: "Shard description"
      },
      shard_fees: {
        workchain_id: "",
        shard: "",
        fees: "Amount of fees in grams",
        fees_other: "Array of fees in non gram crypto currencies",
        create: "Amount of fees created during shard",
        create_other: "Amount of non gram fees created in non gram crypto currencies during the block."
      },
      recover_create_msg: "",
      prev_blk_signatures: {
        _doc: "Array of previous block signatures",
        node_id: "",
        r: "",
        s: ""
      },
      config_addr: "",
      config: {
        p0: "Address of config smart contract in the masterchain",
        p1: "Address of elector smart contract in the masterchain",
        p2: "Address of minter smart contract in the masterchain",
        p3: "Address of fee collector smart contract in the masterchain",
        p4: "Address of TON DNS root smart contract in the masterchain",
        p6: {
          _doc: "Configuration parameter 6",
          mint_new_price: "",
          mint_add_price: ""
        },
        p7: {
          _doc: "Configuration parameter 7",
          currency: "",
          value: ""
        },
        p8: {
          _doc: "Global version",
          version: "",
          capabilities: ""
        },
        p9: "Mandatory params",
        p12: {
          _doc: "Array of all workchains descriptions",
          workchain_id: "",
          enabled_since: "",
          actual_min_split: "",
          min_split: "",
          max_split: "",
          active: "",
          accept_msgs: "",
          flags: "",
          zerostate_root_hash: "",
          zerostate_file_hash: "",
          version: "",
          basic: "",
          vm_version: "",
          vm_mode: "",
          min_addr_len: "",
          max_addr_len: "",
          addr_len_step: "",
          workchain_type_id: ""
        },
        p14: {
          _doc: "Block create fees",
          masterchain_block_fee: "",
          basechain_block_fee: ""
        },
        p15: {
          _doc: "Election parameters",
          validators_elected_for: "",
          elections_start_before: "",
          elections_end_before: "",
          stake_held_for: ""
        },
        p16: {
          _doc: "Validators count",
          max_validators: "",
          max_main_validators: "",
          min_validators: ""
        },
        p17: {
          _doc: "Validator stake parameters",
          min_stake: "",
          max_stake: "",
          min_total_stake: "",
          max_stake_factor: ""
        },
        p18: {
          _doc: "Storage prices",
          utime_since: "",
          bit_price_ps: "",
          cell_price_ps: "",
          mc_bit_price_ps: "",
          mc_cell_price_ps: ""
        },
        p20: "Gas limits and prices in the masterchain",
        p21: "Gas limits and prices in workchains",
        p22: "Block limits in the masterchain",
        p23: "Block limits in workchains",
        p24: "Message forward prices in the masterchain",
        p25: "Message forward prices in workchains",
        p28: {
          _doc: "Catchain config",
          mc_catchain_lifetime: "",
          shard_catchain_lifetime: "",
          shard_validators_lifetime: "",
          shard_validators_num: ""
        },
        p29: {
          _doc: "Consensus config",
          round_candidates: "",
          next_candidate_delay_ms: "",
          consensus_timeout_ms: "",
          fast_attempts: "",
          attempt_duration: "",
          catchain_max_deps: "",
          max_block_bytes: "",
          max_collated_bytes: ""
        },
        p31: "Array of fundamental smart contracts addresses",
        p32: "Previous validators set",
        p33: "Previous temprorary validators set",
        p34: "Current validators set",
        p35: "Current temprorary validators set",
        p36: "Next validators set",
        p37: "Next temprorary validators set",
        p39: {
          _doc: "Array of validator signed temprorary keys",
          adnl_addr: "",
          temp_public_key: "",
          seqno: "",
          valid_until: "",
          signature_r: "",
          signature_s: ""
        }
      }
    }
  }
};
exports.docs = docs;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsIndvcmtjaGFpbl9pZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJzcmNfd29ya2NoYWluX2lkIiwiZHN0X3dvcmtjaGFpbl9pZCIsImNyZWF0ZWRfbHQiLCJjcmVhdGVkX2F0IiwiaWhyX2Rpc2FibGVkIiwiaWhyX2ZlZSIsImZ3ZF9mZWUiLCJpbXBvcnRfZmVlIiwiYm91bmNlIiwiYm91bmNlZCIsInZhbHVlIiwidmFsdWVfb3RoZXIiLCJ0cmFuc2FjdGlvbiIsIl8iLCJjb2xsZWN0aW9uIiwidHJfdHlwZSIsImFjY291bnRfYWRkciIsImx0IiwicHJldl90cmFuc19oYXNoIiwicHJldl90cmFuc19sdCIsIm5vdyIsIm91dG1zZ19jbnQiLCJvcmlnX3N0YXR1cyIsImVuZF9zdGF0dXMiLCJpbl9tc2ciLCJpbl9tZXNzYWdlIiwib3V0X21zZ3MiLCJvdXRfbWVzc2FnZXMiLCJ0b3RhbF9mZWVzIiwidG90YWxfZmVlc19vdGhlciIsIm9sZF9oYXNoIiwibmV3X2hhc2giLCJjcmVkaXRfZmlyc3QiLCJzdG9yYWdlIiwic3RvcmFnZV9mZWVzX2NvbGxlY3RlZCIsInN0b3JhZ2VfZmVlc19kdWUiLCJzdGF0dXNfY2hhbmdlIiwiY3JlZGl0IiwiZHVlX2ZlZXNfY29sbGVjdGVkIiwiY3JlZGl0X290aGVyIiwiY29tcHV0ZSIsImNvbXB1dGVfdHlwZSIsInNraXBwZWRfcmVhc29uIiwic3VjY2VzcyIsIm1zZ19zdGF0ZV91c2VkIiwiYWNjb3VudF9hY3RpdmF0ZWQiLCJnYXNfZmVlcyIsImdhc191c2VkIiwiZ2FzX2xpbWl0IiwiZ2FzX2NyZWRpdCIsIm1vZGUiLCJleGl0X2NvZGUiLCJleGl0X2FyZyIsInZtX3N0ZXBzIiwidm1faW5pdF9zdGF0ZV9oYXNoIiwidm1fZmluYWxfc3RhdGVfaGFzaCIsImFjdGlvbiIsInZhbGlkIiwibm9fZnVuZHMiLCJ0b3RhbF9md2RfZmVlcyIsInRvdGFsX2FjdGlvbl9mZWVzIiwicmVzdWx0X2NvZGUiLCJyZXN1bHRfYXJnIiwidG90X2FjdGlvbnMiLCJzcGVjX2FjdGlvbnMiLCJza2lwcGVkX2FjdGlvbnMiLCJtc2dzX2NyZWF0ZWQiLCJhY3Rpb25fbGlzdF9oYXNoIiwidG90YWxfbXNnX3NpemVfY2VsbHMiLCJ0b3RhbF9tc2dfc2l6ZV9iaXRzIiwiYm91bmNlX3R5cGUiLCJtc2dfc2l6ZV9jZWxscyIsIm1zZ19zaXplX2JpdHMiLCJyZXFfZndkX2ZlZXMiLCJtc2dfZmVlcyIsImZ3ZF9mZWVzIiwiYWJvcnRlZCIsImRlc3Ryb3llZCIsInR0Iiwic3BsaXRfaW5mbyIsImN1cl9zaGFyZF9wZnhfbGVuIiwiYWNjX3NwbGl0X2RlcHRoIiwidGhpc19hZGRyIiwic2libGluZ19hZGRyIiwicHJlcGFyZV90cmFuc2FjdGlvbiIsImluc3RhbGxlZCIsInNoYXJkRGVzY3IiLCJzZXFfbm8iLCJyZWdfbWNfc2Vxbm8iLCJzdGFydF9sdCIsImVuZF9sdCIsInJvb3RfaGFzaCIsImZpbGVfaGFzaCIsImJlZm9yZV9zcGxpdCIsImJlZm9yZV9tZXJnZSIsIndhbnRfc3BsaXQiLCJ3YW50X21lcmdlIiwibnhfY2NfdXBkYXRlZCIsImZsYWdzIiwibmV4dF9jYXRjaGFpbl9zZXFubyIsIm5leHRfdmFsaWRhdG9yX3NoYXJkIiwibWluX3JlZl9tY19zZXFubyIsImdlbl91dGltZSIsInNwbGl0X3R5cGUiLCJzcGxpdCIsImZlZXNfY29sbGVjdGVkIiwiZmVlc19jb2xsZWN0ZWRfb3RoZXIiLCJmdW5kc19jcmVhdGVkIiwiZnVuZHNfY3JlYXRlZF9vdGhlciIsImJsb2NrIiwiZ2xvYmFsX2lkIiwiYWZ0ZXJfbWVyZ2UiLCJnZW5fY2F0Y2hhaW5fc2Vxbm8iLCJtYXN0ZXJfcmVmIiwicHJldl9yZWYiLCJwcmV2X2FsdF9yZWYiLCJwcmV2X3ZlcnRfcmVmIiwicHJldl92ZXJ0X2FsdF9yZWYiLCJ2ZXJzaW9uIiwiZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQiLCJhZnRlcl9zcGxpdCIsInZlcnRfc2VxX25vIiwic2hhcmQiLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJjYXBhYmlsaXRpZXMiLCJwOSIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDTyxJQUFNQSxJQUFJLEdBQUc7QUFDaEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxJQUFJLDRrQkFEQztBQWNMQyxJQUFBQSxFQUFFLElBZEc7QUFlTEMsSUFBQUEsWUFBWSxtREFmUDtBQWdCTEMsSUFBQUEsUUFBUSwySUFoQkg7QUEwQkxDLElBQUFBLFNBQVMscVZBMUJKO0FBd0NMQyxJQUFBQSxXQUFXLHltQkF4Q047QUFtRExDLElBQUFBLGFBQWEsS0FuRFI7QUFvRExDLElBQUFBLE9BQU8sd0dBcERGO0FBNkRMQyxJQUFBQSxhQUFhLEtBN0RSO0FBOERMQyxJQUFBQSxXQUFXLHVFQTlETjtBQStETEMsSUFBQUEsSUFBSSwrSkEvREM7QUFnRUxDLElBQUFBLElBQUkseVFBaEVDO0FBMkVMQyxJQUFBQSxJQUFJLG1NQTNFQztBQXVGTEMsSUFBQUEsSUFBSSxvRUF2RkM7QUF3RkxDLElBQUFBLE9BQU8sNkRBeEZGO0FBeUZMQyxJQUFBQSxLQUFLLGdJQXpGQTtBQTBGTEMsSUFBQUEsR0FBRztBQTFGRSxHQURPO0FBNkZoQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xqQixJQUFBQSxJQUFJLHdSQURDO0FBTUxrQixJQUFBQSxRQUFRLGdDQU5IO0FBT0xDLElBQUFBLE1BQU0sc0VBUEQ7QUFRTEMsSUFBQUEsUUFBUSxnSUFSSDtBQVNMQyxJQUFBQSxJQUFJLHlEQVRDO0FBVUxaLElBQUFBLFdBQVcsOEVBVk47QUFXTEMsSUFBQUEsSUFBSSw4RUFYQztBQVlMQyxJQUFBQSxJQUFJLDZFQVpDO0FBYUxDLElBQUFBLElBQUksZ0RBYkM7QUFjTEMsSUFBQUEsSUFBSSw2REFkQztBQWVMQyxJQUFBQSxPQUFPLGtEQWZGO0FBZ0JM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QVRqQixTQXpGRDtBQW9HSkMsUUFBQUEsR0FBRyxrREFwR0M7QUFxR0pDLFFBQUFBLEdBQUcsMkJBckdDO0FBc0dKQyxRQUFBQSxHQUFHLHNDQXRHQztBQXVHSkMsUUFBQUEsR0FBRywwQkF2R0M7QUF3R0pDLFFBQUFBLEdBQUcscUNBeEdDO0FBeUdKQyxRQUFBQSxHQUFHLHVCQXpHQztBQTBHSkMsUUFBQUEsR0FBRyxrQ0ExR0M7QUEyR0pDLFFBQUFBLEdBQUcsRUFBRTtBQUNEMVEsVUFBQUEsSUFBSSw2Q0FESDtBQUVEMlEsVUFBQUEsU0FBUyxJQUZSO0FBR0RDLFVBQUFBLGVBQWUsSUFIZDtBQUlEQyxVQUFBQSxLQUFLLElBSko7QUFLREMsVUFBQUEsV0FBVyxJQUxWO0FBTURDLFVBQUFBLFdBQVcsSUFOVjtBQU9EQyxVQUFBQSxXQUFXO0FBUFY7QUEzR0Q7QUF2Qko7QUFqRUQ7QUE5UFMsQ0FBYiIsInNvdXJjZXNDb250ZW50IjpbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvcHJlZmVyLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgY29uc3QgZG9jcyA9IHtcbiAgICBhY2NvdW50OiB7XG4gICAgICAgIF9kb2M6IGBcbiMgQWNjb3VudCB0eXBlXG5cblJlY2FsbCB0aGF0IGEgc21hcnQgY29udHJhY3QgYW5kIGFuIGFjY291bnQgYXJlIHRoZSBzYW1lIHRoaW5nIGluIHRoZSBjb250ZXh0XG5vZiB0aGUgVE9OIEJsb2NrY2hhaW4sIGFuZCB0aGF0IHRoZXNlIHRlcm1zIGNhbiBiZSB1c2VkIGludGVyY2hhbmdlYWJseSwgYXRcbmxlYXN0IGFzIGxvbmcgYXMgb25seSBzbWFsbCAob3Ig4oCcdXN1YWzigJ0pIHNtYXJ0IGNvbnRyYWN0cyBhcmUgY29uc2lkZXJlZC4gQSBsYXJnZVxuc21hcnQtY29udHJhY3QgbWF5IGVtcGxveSBzZXZlcmFsIGFjY291bnRzIGx5aW5nIGluIGRpZmZlcmVudCBzaGFyZGNoYWlucyBvZlxudGhlIHNhbWUgd29ya2NoYWluIGZvciBsb2FkIGJhbGFuY2luZyBwdXJwb3Nlcy5cblxuQW4gYWNjb3VudCBpcyBpZGVudGlmaWVkIGJ5IGl0cyBmdWxsIGFkZHJlc3MgYW5kIGlzIGNvbXBsZXRlbHkgZGVzY3JpYmVkIGJ5XG5pdHMgc3RhdGUuIEluIG90aGVyIHdvcmRzLCB0aGVyZSBpcyBub3RoaW5nIGVsc2UgaW4gYW4gYWNjb3VudCBhcGFydCBmcm9tIGl0c1xuYWRkcmVzcyBhbmQgc3RhdGUuXG4gICAgICAgICAgIGAsXG4gICAgICAgIGlkOiBgYCxcbiAgICAgICAgd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBhY2NvdW50IGFkZHJlc3MgKGlkIGZpZWxkKS5gLFxuICAgICAgICBhY2NfdHlwZTogYFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjoge2FjY190eXBlOntlcToxfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfcGFpZDogYFxuQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50XG5jb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSxcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXG5cXGBcXGBcXGBcbnF1ZXJ5e1xuICBhY2NvdW50cyhmaWx0ZXI6IHtcbiAgICBsYXN0X3BhaWQ6e2dlOjE1NjcyOTYwMDB9XG4gIH0pIHtcbiAgaWRcbiAgbGFzdF9wYWlkfVxufVxuXFxgXFxgXFxgICAgICBcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICBkdWVfcGF5bWVudDogYFxuSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjLSBjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7IGR1ZV9wYXltZW50OiB7IG5lOiBudWxsIH0gfSlcbiAgICB7XG4gICAgICBpZFxuICAgIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBsYXN0X3RyYW5zX2x0OiBgIGAsXG4gICAgICAgIGJhbGFuY2U6IGBcblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhvcmRlckJ5OntwYXRoOlwiYmFsYW5jZVwiLGRpcmVjdGlvbjpERVNDfSl7XG4gICAgYmFsYW5jZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgYmFsYW5jZV9vdGhlcjogYCBgLFxuICAgICAgICBzcGxpdF9kZXB0aDogYElzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy5gLFxuICAgICAgICB0aWNrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5gLFxuICAgICAgICB0b2NrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5cblxcYFxcYFxcYCAgICAgICAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e3RvY2s6e25lOm51bGx9fSl7XG4gICAgaWRcbiAgICB0b2NrXG4gICAgdGlja1xuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgY29kZTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGNvZGUgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5cblxcYFxcYFxcYCAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e2NvZGU6e2VxOm51bGx9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59ICAgXG5cXGBcXGBcXGAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgYCxcbiAgICAgICAgZGF0YTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5gLFxuICAgICAgICBsaWJyYXJ5OiBgSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QuYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIGFjY291bnQgc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgfSxcbiAgICBtZXNzYWdlOiB7XG4gICAgICAgIF9kb2M6IGAjIE1lc3NhZ2UgdHlwZVxuXG4gICAgICAgICAgIE1lc3NhZ2UgbGF5b3V0IHF1ZXJpZXMuICBBIG1lc3NhZ2UgY29uc2lzdHMgb2YgaXRzIGhlYWRlciBmb2xsb3dlZCBieSBpdHNcbiAgICAgICAgICAgYm9keSBvciBwYXlsb2FkLiBUaGUgYm9keSBpcyBlc3NlbnRpYWxseSBhcmJpdHJhcnksIHRvIGJlIGludGVycHJldGVkIGJ5IHRoZVxuICAgICAgICAgICBkZXN0aW5hdGlvbiBzbWFydCBjb250cmFjdC4gSXQgY2FuIGJlIHF1ZXJpZWQgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpgLFxuICAgICAgICBtc2dfdHlwZTogYFJldHVybnMgdGhlIHR5cGUgb2YgbWVzc2FnZS5gLFxuICAgICAgICBzdGF0dXM6IGBSZXR1cm5zIGludGVybmFsIHByb2Nlc3Npbmcgc3RhdHVzIGFjY29yZGluZyB0byB0aGUgbnVtYmVycyBzaG93bi5gLFxuICAgICAgICBibG9ja19pZDogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2R5OiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2UgYm9keSBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBzcGxpdF9kZXB0aDogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdGljazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdG9jazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBjb2RlOiBgUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICBkYXRhOiBgUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgbGlicmFyeTogYFJlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBzcmM6IGBSZXR1cm5zIHNvdXJjZSBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIGRzdDogYFJldHVybnMgZGVzdGluYXRpb24gYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBzcmNfd29ya2NoYWluX2lkOiBgV29ya2NoYWluIGlkIG9mIHRoZSBzb3VyY2UgYWRkcmVzcyAoc3JjIGZpZWxkKWAsXG4gICAgICAgIGRzdF93b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKGRzdCBmaWVsZClgLFxuICAgICAgICBjcmVhdGVkX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGNyZWF0ZWRfYXQ6IGBDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgaWhyX2Rpc2FibGVkOiBgSUhSIGlzIGRpc2FibGVkIGZvciB0aGUgbWVzc2FnZS5gLFxuICAgICAgICBpaHJfZmVlOiBgVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS5gLFxuICAgICAgICBmd2RfZmVlOiBgT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuYCxcbiAgICAgICAgaW1wb3J0X2ZlZTogYGAsXG4gICAgICAgIGJvdW5jZTogYEJvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgYm91bmNlZDogYEJvdW5jZWQgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIHZhbHVlOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudGAsXG4gICAgICAgIHZhbHVlX290aGVyOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IG1lc3NhZ2UgaXMgYSBwYXJ0IG9mIGEgYmxvY2sgaXQgY3V0IGZyb20uIEl0IGlzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBBIGJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIHN0cnVjdHVyZSBlbmNvZGVkIGFzIGJhc2U2NC5gXG4gICAgfSxcblxuXG4gICAgdHJhbnNhY3Rpb24gOiB7XG4gICAgICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgICAgICBfOiB7Y29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucyd9LFxuICAgICAgICB0cl90eXBlOiBgVHJhbnNhY3Rpb24gdHlwZSBhY2NvcmRpbmcgdG8gdGhlIG9yaWdpbmFsIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbiwgY2xhdXNlIDQuMi40LmAsXG4gICAgICAgIHN0YXR1czogYFRyYW5zYWN0aW9uIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBgLFxuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB3b3JrY2hhaW5faWQ6IGBXb3JrY2hhaW4gaWQgb2YgdGhlIGFjY291bnQgYWRkcmVzcyAoYWNjb3VudF9hZGRyIGZpZWxkKWAsXG4gICAgICAgIGx0OiBgTG9naWNhbCB0aW1lLiBBIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSBbdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdGVzdC50b24ub3JnL3RibGtjaC5wZGYpLmAsXG4gICAgICAgIHByZXZfdHJhbnNfaGFzaDogYGAsXG4gICAgICAgIHByZXZfdHJhbnNfbHQ6IGBgLFxuICAgICAgICBub3c6IGBgLFxuICAgICAgICBvdXRtc2dfY250OiBgVGhlIG51bWJlciBvZiBnZW5lcmF0ZWQgb3V0Ym91bmQgbWVzc2FnZXMgKG9uZSBvZiB0aGUgY29tbW9uIHRyYW5zYWN0aW9uIHBhcmFtZXRlcnMgZGVmaW5lZCBieSB0aGUgc3BlY2lmaWNhdGlvbilgLFxuICAgICAgICBvcmlnX3N0YXR1czogYFRoZSBpbml0aWFsIHN0YXRlIG9mIGFjY291bnQuIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgdGhlIHF1ZXJ5IG1heSByZXR1cm4gMCwgaWYgdGhlIGFjY291bnQgd2FzIG5vdCBhY3RpdmUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbiBhbmQgMSBpZiBpdCB3YXMgYWxyZWFkeSBhY3RpdmVgLFxuICAgICAgICBlbmRfc3RhdHVzOiBgVGhlIGVuZCBzdGF0ZSBvZiBhbiBhY2NvdW50IGFmdGVyIGEgdHJhbnNhY3Rpb24sIDEgaXMgcmV0dXJuZWQgdG8gaW5kaWNhdGUgYSBmaW5hbGl6ZWQgdHJhbnNhY3Rpb24gYXQgYW4gYWN0aXZlIGFjY291bnRgLFxuICAgICAgICBpbl9tc2c6IGBgLFxuICAgICAgICBpbl9tZXNzYWdlOiBgYCxcbiAgICAgICAgb3V0X21zZ3M6IGBEaWN0aW9uYXJ5IG9mIHRyYW5zYWN0aW9uIG91dGJvdW5kIG1lc3NhZ2VzIGFzIHNwZWNpZmllZCBpbiB0aGUgc3BlY2lmaWNhdGlvbmAsXG4gICAgICAgIG91dF9tZXNzYWdlczogYGAsXG4gICAgICAgIHRvdGFsX2ZlZXM6IGBUb3RhbCBhbW91bnQgb2YgZmVlcyB0aGF0IGVudGFpbHMgYWNjb3VudCBzdGF0ZSBjaGFuZ2UgYW5kIHVzZWQgaW4gTWVya2xlIHVwZGF0ZWAsXG4gICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IGBTYW1lIGFzIGFib3ZlLCBidXQgcmVzZXJ2ZWQgZm9yIG5vbiBncmFtIGNvaW5zIHRoYXQgbWF5IGFwcGVhciBpbiB0aGUgYmxvY2tjaGFpbmAsXG4gICAgICAgIG9sZF9oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIG5ld19oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIGNyZWRpdF9maXJzdDogYGAsXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGBUaGlzIGZpZWxkIGRlZmluZXMgdGhlIGFtb3VudCBvZiBzdG9yYWdlIGZlZXMgY29sbGVjdGVkIGluIGdyYW1zLmAsXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIHRoZSBhbW91bnQgb2YgZHVlIGZlZXMgaW4gZ3JhbXMsIGl0IG1pZ2h0IGJlIGVtcHR5LmAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIGFjY291bnQgc3RhdHVzIGNoYW5nZSBhZnRlciB0aGUgdHJhbnNhY3Rpb24gaXMgY29tcGxldGVkLmAsXG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlZGl0OiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGFjY291bnQgaXMgY3JlZGl0ZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSByZWNlaXZlZC4gVGhlIGNyZWRpdCBwaGFzZSBjYW4gcmVzdWx0IGluIHRoZSBjb2xsZWN0aW9uIG9mIHNvbWUgZHVlIHBheW1lbnRzYCxcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYFRoZSBzdW0gb2YgZHVlX2ZlZXNfY29sbGVjdGVkIGFuZCBjcmVkaXQgbXVzdCBlcXVhbCB0aGUgdmFsdWUgb2YgdGhlIG1lc3NhZ2UgcmVjZWl2ZWQsIHBsdXMgaXRzIGlocl9mZWUgaWYgdGhlIG1lc3NhZ2UgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHZpYSBJbnN0YW50IEh5cGVyY3ViZSBSb3V0aW5nLCBJSFIgKG90aGVyd2lzZSB0aGUgaWhyX2ZlZSBpcyBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzKS5gLFxuICAgICAgICAgICAgY3JlZGl0OiBgYCxcbiAgICAgICAgICAgIGNyZWRpdF9vdGhlcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgY29kZSBvZiB0aGUgc21hcnQgY29udHJhY3QgaXMgaW52b2tlZCBpbnNpZGUgYW4gaW5zdGFuY2Ugb2YgVFZNIHdpdGggYWRlcXVhdGUgcGFyYW1ldGVycywgaW5jbHVkaW5nIGEgY29weSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGFuZCBvZiB0aGUgcGVyc2lzdGVudCBkYXRhLCBhbmQgdGVybWluYXRlcyB3aXRoIGFuIGV4aXQgY29kZSwgdGhlIG5ldyBwZXJzaXN0ZW50IGRhdGEsIGFuZCBhbiBhY3Rpb24gbGlzdCAod2hpY2ggaW5jbHVkZXMsIGZvciBpbnN0YW5jZSwgb3V0Ym91bmQgbWVzc2FnZXMgdG8gYmUgc2VudCkuIFRoZSBwcm9jZXNzaW5nIHBoYXNlIG1heSBsZWFkIHRvIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBhY2NvdW50ICh1bmluaXRpYWxpemVkIG9yIGFjdGl2ZSksIG9yIHRvIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50LiBUaGUgZ2FzIHBheW1lbnQsIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIHRoZSBnYXMgcHJpY2UgYW5kIHRoZSBnYXMgY29uc3VtZWQsIGlzIGV4YWN0ZWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlLlxuSWYgdGhlcmUgaXMgbm8gcmVhc29uIHRvIHNraXAgdGhlIGNvbXB1dGluZyBwaGFzZSwgVFZNIGlzIGludm9rZWQgYW5kIHRoZSByZXN1bHRzIG9mIHRoZSBjb21wdXRhdGlvbiBhcmUgbG9nZ2VkLiBQb3NzaWJsZSBwYXJhbWV0ZXJzIGFyZSBjb3ZlcmVkIGJlbG93LmAsXG4gICAgICAgICAgICBjb21wdXRlX3R5cGU6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb246IGBSZWFzb24gZm9yIHNraXBwaW5nIHRoZSBjb21wdXRlIHBoYXNlLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24sIHRoZSBwaGFzZSBjYW4gYmUgc2tpcHBlZCBkdWUgdG8gdGhlIGFic2VuY2Ugb2YgZnVuZHMgdG8gYnV5IGdhcywgYWJzZW5jZSBvZiBzdGF0ZSBvZiBhbiBhY2NvdW50IG9yIGEgbWVzc2FnZSwgZmFpbHVyZSB0byBwcm92aWRlIGEgdmFsaWQgc3RhdGUgaW4gdGhlIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3VjY2VzczogYFRoaXMgZmxhZyBpcyBzZXQgaWYgYW5kIG9ubHkgaWYgZXhpdF9jb2RlIGlzIGVpdGhlciAwIG9yIDEuYCxcbiAgICAgICAgICAgIG1zZ19zdGF0ZV91c2VkOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KVRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylgLFxuICAgICAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGBUaGUgZmxhZyByZWZsZWN0cyB3aGV0aGVyIHRoaXMgaGFzIHJlc3VsdGVkIGluIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSBmcm96ZW4sIHVuaW5pdGlhbGl6ZWQgb3Igbm9uLWV4aXN0ZW50IGFjY291bnQuYCxcbiAgICAgICAgICAgIGdhc19mZWVzOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIHRvdGFsIGdhcyBmZWVzIGNvbGxlY3RlZCBieSB0aGUgdmFsaWRhdG9ycyBmb3IgZXhlY3V0aW5nIHRoaXMgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgZ2FzX3VzZWQgYW5kIGdhc19wcmljZSBmcm9tIHRoZSBjdXJyZW50IGJsb2NrIGhlYWRlci5gLFxuICAgICAgICAgICAgZ2FzX3VzZWQ6IGBgLFxuICAgICAgICAgICAgZ2FzX2xpbWl0OiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIGdhcyBsaW1pdCBmb3IgdGhpcyBpbnN0YW5jZSBvZiBUVk0uIEl0IGVxdWFscyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgR3JhbXMgY3JlZGl0ZWQgaW4gdGhlIGNyZWRpdCBwaGFzZSBmcm9tIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGRpdmlkZWQgYnkgdGhlIGN1cnJlbnQgZ2FzIHByaWNlLCBvciB0aGUgZ2xvYmFsIHBlci10cmFuc2FjdGlvbiBnYXMgbGltaXQuYCxcbiAgICAgICAgICAgIGdhc19jcmVkaXQ6IGBUaGlzIHBhcmFtZXRlciBtYXkgYmUgbm9uLXplcm8gb25seSBmb3IgZXh0ZXJuYWwgaW5ib3VuZCBtZXNzYWdlcy4gSXQgaXMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIGFtb3VudCBvZiBnYXMgdGhhdCBjYW4gYmUgcGFpZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2Ugb3IgdGhlIG1heGltdW0gZ2FzIGNyZWRpdGAsXG4gICAgICAgICAgICBtb2RlOiBgYCxcbiAgICAgICAgICAgIGV4aXRfY29kZTogYFRoZXNlIHBhcmFtZXRlciByZXByZXNlbnRzIHRoZSBzdGF0dXMgdmFsdWVzIHJldHVybmVkIGJ5IFRWTTsgZm9yIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgZXhpdF9jb2RlIGhhcyB0byBiZSAwIG9yIDFgLFxuICAgICAgICAgICAgZXhpdF9hcmc6IGBgLFxuICAgICAgICAgICAgdm1fc3RlcHM6IGB0aGUgdG90YWwgbnVtYmVyIG9mIHN0ZXBzIHBlcmZvcm1lZCBieSBUVk0gKHVzdWFsbHkgZXF1YWwgdG8gdHdvIHBsdXMgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMgZXhlY3V0ZWQsIGluY2x1ZGluZyBpbXBsaWNpdCBSRVRzKWAsXG4gICAgICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSByZXN1bHRpbmcgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSBzbWFydCBjb250cmFjdCBoYXMgdGVybWluYXRlZCBzdWNjZXNzZnVsbHkgKHdpdGggZXhpdCBjb2RlIDAgb3IgMSksIHRoZSBhY3Rpb25zIGZyb20gdGhlIGxpc3QgYXJlIHBlcmZvcm1lZC4gSWYgaXQgaXMgaW1wb3NzaWJsZSB0byBwZXJmb3JtIGFsbCBvZiB0aGVt4oCUZm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgaW5zdWZmaWNpZW50IGZ1bmRzIHRvIHRyYW5zZmVyIHdpdGggYW4gb3V0Ym91bmQgbWVzc2FnZeKAlHRoZW4gdGhlIHRyYW5zYWN0aW9uIGlzIGFib3J0ZWQgYW5kIHRoZSBhY2NvdW50IHN0YXRlIGlzIHJvbGxlZCBiYWNrLiBUaGUgdHJhbnNhY3Rpb24gaXMgYWxzbyBhYm9ydGVkIGlmIHRoZSBzbWFydCBjb250cmFjdCBkaWQgbm90IHRlcm1pbmF0ZSBzdWNjZXNzZnVsbHksIG9yIGlmIGl0IHdhcyBub3QgcG9zc2libGUgdG8gaW52b2tlIHRoZSBzbWFydCBjb250cmFjdCBhdCBhbGwgYmVjYXVzZSBpdCBpcyB1bmluaXRpYWxpemVkIG9yIGZyb3plbi5gLFxuICAgICAgICAgICAgc3VjY2VzczogYGAsXG4gICAgICAgICAgICB2YWxpZDogYGAsXG4gICAgICAgICAgICBub19mdW5kczogYFRoZSBmbGFnIGluZGljYXRlcyBhYnNlbmNlIG9mIGZ1bmRzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhbiBvdXRib3VuZCBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBgLFxuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2NvZGU6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2FyZzogYGAsXG4gICAgICAgICAgICB0b3RfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBzcGVjX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIG1zZ3NfY3JlYXRlZDogYGAsXG4gICAgICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBib3VuY2U6IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuIEFsbW9zdCBhbGwgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIGluYm91bmQgbWVzc2FnZSAobWludXMgZ2FzIHBheW1lbnRzIGFuZCBmb3J3YXJkaW5nIGZlZXMpIGlzIHRyYW5zZmVycmVkIHRvIHRoZSBnZW5lcmF0ZWQgbWVzc2FnZSwgd2hpY2ggb3RoZXJ3aXNlIGhhcyBhbiBlbXB0eSBib2R5LmAsXG4gICAgICAgICAgICBib3VuY2VfdHlwZTogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgICAgIHJlcV9md2RfZmVlczogYGAsXG4gICAgICAgICAgICBtc2dfZmVlczogYGAsXG4gICAgICAgICAgICBmd2RfZmVlczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGFib3J0ZWQ6IGBgLFxuICAgICAgICBkZXN0cm95ZWQ6IGBgLFxuICAgICAgICB0dDogYGAsXG4gICAgICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgZmllbGRzIGJlbG93IGNvdmVyIHNwbGl0IHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zIGFuZCBtZXJnZSBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucywgdGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSByZWxldmFudCBzY2hlbWVzIGNvdmVyZWQgYnkgdGhlIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbi5gLFxuICAgICAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IGBsZW5ndGggb2YgdGhlIGN1cnJlbnQgc2hhcmQgcHJlZml4YCxcbiAgICAgICAgICAgIGFjY19zcGxpdF9kZXB0aDogYGAsXG4gICAgICAgICAgICB0aGlzX2FkZHI6IGBgLFxuICAgICAgICAgICAgc2libGluZ19hZGRyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgcHJlcGFyZV90cmFuc2FjdGlvbjogYGAsXG4gICAgICAgIGluc3RhbGxlZDogYGAsXG4gICAgICAgIHByb29mOiBgYCxcbiAgICAgICAgYm9jOiBgYCxcbiAgICB9LFxuXG4gICAgc2hhcmREZXNjcjoge1xuICAgICAgICBfZG9jOiBgU2hhcmRIYXNoZXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBkaWN0aW9uYXJ5IHdpdGggMzItYml0IHdvcmtjaGFpbl9pZHMgYXMga2V5cywgYW5kIOKAnHNoYXJkIGJpbmFyeSB0cmVlc+KAnSwgcmVwcmVzZW50ZWQgYnkgVEwtQiB0eXBlIEJpblRyZWUgU2hhcmREZXNjciwgYXMgdmFsdWVzLiBFYWNoIGxlYWYgb2YgdGhpcyBzaGFyZCBiaW5hcnkgdHJlZSBjb250YWlucyBhIHZhbHVlIG9mIHR5cGUgU2hhcmREZXNjciwgd2hpY2ggZGVzY3JpYmVzIGEgc2luZ2xlIHNoYXJkIGJ5IGluZGljYXRpbmcgdGhlIHNlcXVlbmNlIG51bWJlciBzZXFfbm8sIHRoZSBsb2dpY2FsIHRpbWUgbHQsIGFuZCB0aGUgaGFzaCBoYXNoIG9mIHRoZSBsYXRlc3QgKHNpZ25lZCkgYmxvY2sgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2hhcmRjaGFpbi5gLFxuICAgICAgICBzZXFfbm86IGB1aW50MzIgc2VxdWVuY2UgbnVtYmVyYCxcbiAgICAgICAgcmVnX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgICAgIHN0YXJ0X2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIHN0YXJ0YCxcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIGVuZGAsXG4gICAgICAgIHJvb3RfaGFzaDogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi4gVGhlIHNoYXJkIGJsb2NrIGNvbmZpZ3VyYXRpb24gaXMgZGVyaXZlZCBmcm9tIHRoYXQgYmxvY2suYCxcbiAgICAgICAgZmlsZV9oYXNoOiBgU2hhcmQgYmxvY2sgZmlsZSBoYXNoLmAsXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYFRPTiBCbG9ja2NoYWluIHN1cHBvcnRzIGR5bmFtaWMgc2hhcmRpbmcsIHNvIHRoZSBzaGFyZCBjb25maWd1cmF0aW9uIG1heSBjaGFuZ2UgZnJvbSBibG9jayB0byBibG9jayBiZWNhdXNlIG9mIHNoYXJkIG1lcmdlIGFuZCBzcGxpdCBldmVudHMuIFRoZXJlZm9yZSwgd2UgY2Fubm90IHNpbXBseSBzYXkgdGhhdCBlYWNoIHNoYXJkY2hhaW4gY29ycmVzcG9uZHMgdG8gYSBmaXhlZCBzZXQgb2YgYWNjb3VudCBjaGFpbnMuXG5BIHNoYXJkY2hhaW4gYmxvY2sgYW5kIGl0cyBzdGF0ZSBtYXkgZWFjaCBiZSBjbGFzc2lmaWVkIGludG8gdHdvIGRpc3RpbmN0IHBhcnRzLiBUaGUgcGFydHMgd2l0aCB0aGUgSVNQLWRpY3RhdGVkIGZvcm0gb2Ygd2lsbCBiZSBjYWxsZWQgdGhlIHNwbGl0IHBhcnRzIG9mIHRoZSBibG9jayBhbmQgaXRzIHN0YXRlLCB3aGlsZSB0aGUgcmVtYWluZGVyIHdpbGwgYmUgY2FsbGVkIHRoZSBub24tc3BsaXQgcGFydHMuXG5UaGUgbWFzdGVyY2hhaW4gY2Fubm90IGJlIHNwbGl0IG9yIG1lcmdlZC5gLFxuICAgICAgICBiZWZvcmVfbWVyZ2U6IGBgLFxuICAgICAgICB3YW50X3NwbGl0OiBgYCxcbiAgICAgICAgd2FudF9tZXJnZTogYGAsXG4gICAgICAgIG54X2NjX3VwZGF0ZWQ6IGBgLFxuICAgICAgICBmbGFnczogYGAsXG4gICAgICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYGAsXG4gICAgICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBgLFxuICAgICAgICBnZW5fdXRpbWU6IGBHZW5lcmF0aW9uIHRpbWUgaW4gdWludDMyYCxcbiAgICAgICAgc3BsaXRfdHlwZTogYGAsXG4gICAgICAgIHNwbGl0OiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6YEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkX290aGVyOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIHN0YXR1czogYFJldHVybnMgYmxvY2sgcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgIGdsb2JhbF9pZDogYHVpbnQzMiBnbG9iYWwgYmxvY2sgSURgLFxuICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgIHNlcV9ubzogYGAsXG4gICAgYWZ0ZXJfbWVyZ2U6IGBgLFxuICAgIGdlbl91dGltZTogYHVpbnQgMzIgZ2VuZXJhdGlvbiB0aW1lIHN0YW1wYCxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgIGZsYWdzOiBgYCxcbiAgICBtYXN0ZXJfcmVmOiBgYCxcbiAgICBwcmV2X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2suYCxcbiAgICBwcmV2X2FsdF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2Ygc2hhcmQgbWVyZ2UuYCxcbiAgICBwcmV2X3ZlcnRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHZlcnRpY2FsIGJsb2Nrcy5gLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBgYCxcbiAgICB2ZXJzaW9uOiBgdWluMzIgYmxvY2sgdmVyc2lvbiBpZGVudGlmaWVyYCxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgYmVmb3JlX3NwbGl0OiBgYCxcbiAgICBhZnRlcl9zcGxpdDogYGAsXG4gICAgd2FudF9tZXJnZTogYGAsXG4gICAgdmVydF9zZXFfbm86IGBgLFxuICAgIHN0YXJ0X2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gc3RhcnQuXG5Mb2dpY2FsIHRpbWUgaXMgYSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25gLFxuICAgIGVuZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIGVuZC5gLFxuICAgIHdvcmtjaGFpbl9pZDogYHVpbnQzMiB3b3JrY2hhaW4gaWRlbnRpZmllcmAsXG4gICAgc2hhcmQ6IGBgLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBgQW1vdW50IG9mIGdyYW1zIGFtb3VudCB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgIGV4cG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGV4cG9ydGVkLmAsXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGBgLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYGAsXG4gICAgICAgIGNyZWF0ZWQ6IGBgLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBgYCxcbiAgICAgICAgaW1wb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBpbXBvcnRlZC5gLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBgQW1vdW50IG9mIGdyYW1zIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgbWludGVkOiBgQW1vdW50IG9mIGdyYW1zIG1pbnRlZCBpbiB0aGlzIGJsb2NrLmAsXG4gICAgICAgIG1pbnRlZF9vdGhlcjogYGAsXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYGAsXG4gICAgcmFuZF9zZWVkOiBgYCxcbiAgICBvdXRfbXNnX2Rlc2NyOiBgYCxcbiAgICBhY2NvdW50X2Jsb2Nrczoge1xuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGBgLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBgb2xkIHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYCxcbiAgICAgICAgICAgIG5ld19oYXNoOiBgbmV3IHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYFxuICAgICAgICB9LFxuICAgICAgICB0cl9jb3VudDogYGBcbiAgICB9LFxuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IGBgLFxuICAgICAgICBuZXdfaGFzaDogYGAsXG4gICAgICAgIG5ld19kZXB0aDogYGAsXG4gICAgICAgIG9sZDogYGAsXG4gICAgICAgIG9sZF9oYXNoOiBgYCxcbiAgICAgICAgb2xkX2RlcHRoOiBgYFxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIHNoYXJkX2hhc2hlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNoYXJkIGhhc2hlc2AsXG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBVaW50MzIgd29ya2NoYWluIElEYCxcbiAgICAgICAgICAgIHNoYXJkOiBgU2hhcmQgSURgLFxuICAgICAgICAgICAgZGVzY3I6IGBTaGFyZCBkZXNjcmlwdGlvbmAsXG4gICAgICAgIH0sXG4gICAgICAgIHNoYXJkX2ZlZXM6IHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICBzaGFyZDogYGAsXG4gICAgICAgICAgICBmZWVzOiBgQW1vdW50IG9mIGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogYEFycmF5IG9mIGZlZXMgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXNgLFxuICAgICAgICAgICAgY3JlYXRlOiBgQW1vdW50IG9mIGZlZXMgY3JlYXRlZCBkdXJpbmcgc2hhcmRgLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGZlZXMgY3JlYXRlZCBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llcyBkdXJpbmcgdGhlIGJsb2NrLmAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogYGAsXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBwcmV2aW91cyBibG9jayBzaWduYXR1cmVzYCxcbiAgICAgICAgICAgIG5vZGVfaWQ6IGBgLFxuICAgICAgICAgICAgcjogYGAsXG4gICAgICAgICAgICBzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnX2FkZHI6IGBgLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBgQWRkcmVzcyBvZiBjb25maWcgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAxOiBgQWRkcmVzcyBvZiBlbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjogYEFkZHJlc3Mgb2YgbWludGVyIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMzogYEFkZHJlc3Mgb2YgZmVlIGNvbGxlY3RvciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDQ6IGBBZGRyZXNzIG9mIFRPTiBETlMgcm9vdCBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgNmAsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA3YCxcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogYGAsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEdsb2JhbCB2ZXJzaW9uYCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBgTWFuZGF0b3J5IHBhcmFtc2AsXG4gICAgICAgICAgICBwMTI6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgYWxsIHdvcmtjaGFpbnMgZGVzY3JpcHRpb25zYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGBgLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBgYCxcbiAgICAgICAgICAgICAgICBmbGFnczogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgYmFzaWM6IGBgLFxuICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiBgYCxcbiAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEJsb2NrIGNyZWF0ZSBmZWVzYCxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3JzIGNvdW50YCxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3Igc3Rha2UgcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogYGBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgU3RvcmFnZSBwcmljZXNgLFxuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjE6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjI6IGBCbG9jayBsaW1pdHMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgIHAyNDogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyNTogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ2F0Y2hhaW4gY29uZmlnYCxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uc2Vuc3VzIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IGBgLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBgYCxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IGBgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXG4gICAgICAgICAgICBwMzI6IGBQcmV2aW91cyB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzM6IGBQcmV2aW91cyB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM1OiBgQ3VycmVudCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNjogYE5leHQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiB2YWxpZGF0b3Igc2lnbmVkIHRlbXByb3Jhcnkga2V5c2AsXG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IGBgLFxuICAgICAgICAgICAgICAgIHNlcW5vOiBgYCxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IGBgLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9LFxufVxufTtcbiJdfQ==