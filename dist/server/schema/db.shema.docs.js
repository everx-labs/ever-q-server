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
    prev_key_block_seqno: "Returns a number of a previous key block.",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwidHJhbnNhY3Rpb24iLCJfIiwiY29sbGVjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJzaGFyZERlc2NyIiwic2VxX25vIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXQiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwicHJldl9rZXlfYmxvY2tfc2Vxbm8iLCJ2YWx1ZV9mbG93IiwidG9fbmV4dF9ibGsiLCJ0b19uZXh0X2Jsa19vdGhlciIsImV4cG9ydGVkIiwiZXhwb3J0ZWRfb3RoZXIiLCJjcmVhdGVkIiwiY3JlYXRlZF9vdGhlciIsImltcG9ydGVkIiwiaW1wb3J0ZWRfb3RoZXIiLCJmcm9tX3ByZXZfYmxrIiwiZnJvbV9wcmV2X2Jsa19vdGhlciIsIm1pbnRlZCIsIm1pbnRlZF9vdGhlciIsImZlZXNfaW1wb3J0ZWQiLCJmZWVzX2ltcG9ydGVkX290aGVyIiwiaW5fbXNnX2Rlc2NyIiwicmFuZF9zZWVkIiwib3V0X21zZ19kZXNjciIsImFjY291bnRfYmxvY2tzIiwidHJhbnNhY3Rpb25zIiwic3RhdGVfdXBkYXRlIiwidHJfY291bnQiLCJuZXdfZGVwdGgiLCJvbGQiLCJvbGRfZGVwdGgiLCJtYXN0ZXIiLCJzaGFyZF9oYXNoZXMiLCJkZXNjciIsInNoYXJkX2ZlZXMiLCJmZWVzIiwiZmVlc19vdGhlciIsImNyZWF0ZSIsImNyZWF0ZV9vdGhlciIsInJlY292ZXJfY3JlYXRlX21zZyIsInByZXZfYmxrX3NpZ25hdHVyZXMiLCJub2RlX2lkIiwiciIsInMiLCJjb25maWdfYWRkciIsImNvbmZpZyIsInAwIiwicDEiLCJwMiIsInAzIiwicDQiLCJwNiIsIm1pbnRfbmV3X3ByaWNlIiwibWludF9hZGRfcHJpY2UiLCJwNyIsImN1cnJlbmN5IiwicDgiLCJjYXBhYmlsaXRpZXMiLCJwOSIsInAxMiIsImVuYWJsZWRfc2luY2UiLCJhY3R1YWxfbWluX3NwbGl0IiwibWluX3NwbGl0IiwibWF4X3NwbGl0IiwiYWN0aXZlIiwiYWNjZXB0X21zZ3MiLCJ6ZXJvc3RhdGVfcm9vdF9oYXNoIiwiemVyb3N0YXRlX2ZpbGVfaGFzaCIsImJhc2ljIiwidm1fdmVyc2lvbiIsInZtX21vZGUiLCJtaW5fYWRkcl9sZW4iLCJtYXhfYWRkcl9sZW4iLCJhZGRyX2xlbl9zdGVwIiwid29ya2NoYWluX3R5cGVfaWQiLCJwMTQiLCJtYXN0ZXJjaGFpbl9ibG9ja19mZWUiLCJiYXNlY2hhaW5fYmxvY2tfZmVlIiwicDE1IiwidmFsaWRhdG9yc19lbGVjdGVkX2ZvciIsImVsZWN0aW9uc19zdGFydF9iZWZvcmUiLCJlbGVjdGlvbnNfZW5kX2JlZm9yZSIsInN0YWtlX2hlbGRfZm9yIiwicDE2IiwibWF4X3ZhbGlkYXRvcnMiLCJtYXhfbWFpbl92YWxpZGF0b3JzIiwibWluX3ZhbGlkYXRvcnMiLCJwMTciLCJtaW5fc3Rha2UiLCJtYXhfc3Rha2UiLCJtaW5fdG90YWxfc3Rha2UiLCJtYXhfc3Rha2VfZmFjdG9yIiwicDE4IiwidXRpbWVfc2luY2UiLCJiaXRfcHJpY2VfcHMiLCJjZWxsX3ByaWNlX3BzIiwibWNfYml0X3ByaWNlX3BzIiwibWNfY2VsbF9wcmljZV9wcyIsInAyMCIsInAyMSIsInAyMiIsInAyMyIsInAyNCIsInAyNSIsInAyOCIsIm1jX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWUiLCJzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19udW0iLCJwMjkiLCJyb3VuZF9jYW5kaWRhdGVzIiwibmV4dF9jYW5kaWRhdGVfZGVsYXlfbXMiLCJjb25zZW5zdXNfdGltZW91dF9tcyIsImZhc3RfYXR0ZW1wdHMiLCJhdHRlbXB0X2R1cmF0aW9uIiwiY2F0Y2hhaW5fbWF4X2RlcHMiLCJtYXhfYmxvY2tfYnl0ZXMiLCJtYXhfY29sbGF0ZWRfYnl0ZXMiLCJwMzEiLCJwMzIiLCJwMzMiLCJwMzQiLCJwMzUiLCJwMzYiLCJwMzciLCJwMzkiLCJhZG5sX2FkZHIiLCJ0ZW1wX3B1YmxpY19rZXkiLCJzZXFubyIsInZhbGlkX3VudGlsIiwic2lnbmF0dXJlX3IiLCJzaWduYXR1cmVfcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDTyxJQUFNQSxJQUFJLEdBQUc7QUFDaEJDLEVBQUFBLE9BQU8sRUFBRTtBQUNMQyxJQUFBQSxJQUFJLDRrQkFEQztBQWNMQyxJQUFBQSxFQUFFLElBZEc7QUFlTEMsSUFBQUEsUUFBUSwySUFmSDtBQXlCTEMsSUFBQUEsU0FBUyxxVkF6Qko7QUF1Q0xDLElBQUFBLFdBQVcseW1CQXZDTjtBQWtETEMsSUFBQUEsYUFBYSxLQWxEUjtBQW1ETEMsSUFBQUEsT0FBTyx3R0FuREY7QUE0RExDLElBQUFBLGFBQWEsS0E1RFI7QUE2RExDLElBQUFBLFdBQVcsdUVBN0ROO0FBOERMQyxJQUFBQSxJQUFJLCtKQTlEQztBQStETEMsSUFBQUEsSUFBSSx5UUEvREM7QUEwRUxDLElBQUFBLElBQUksbU1BMUVDO0FBc0ZMQyxJQUFBQSxJQUFJLG9FQXRGQztBQXVGTEMsSUFBQUEsT0FBTyw2REF2RkY7QUF3RkxDLElBQUFBLEtBQUssZ0lBeEZBO0FBeUZMQyxJQUFBQSxHQUFHO0FBekZFLEdBRE87QUE0RmhCQyxFQUFBQSxPQUFPLEVBQUU7QUFDTGhCLElBQUFBLElBQUksd1JBREM7QUFNTGlCLElBQUFBLFFBQVEsZ0NBTkg7QUFPTEMsSUFBQUEsTUFBTSxzRUFQRDtBQVFMQyxJQUFBQSxRQUFRLGdJQVJIO0FBU0xDLElBQUFBLElBQUkseURBVEM7QUFVTFosSUFBQUEsV0FBVyw4RUFWTjtBQVdMQyxJQUFBQSxJQUFJLDhFQVhDO0FBWUxDLElBQUFBLElBQUksNkVBWkM7QUFhTEMsSUFBQUEsSUFBSSxnREFiQztBQWNMQyxJQUFBQSxJQUFJLDZEQWRDO0FBZUxDLElBQUFBLE9BQU8sa0RBZkY7QUFnQkxRLElBQUFBLEdBQUcsaUNBaEJFO0FBaUJMQyxJQUFBQSxHQUFHLHND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QUFBLEdBQUcsMEJBdkdDO0FBd0dKQyxRQUFBQSxHQUFHLHFDQXhHQztBQXlHSkMsUUFBQUEsR0FBRyx1QkF6R0M7QUEwR0pDLFFBQUFBLEdBQUcsa0NBMUdDO0FBMkdKQyxRQUFBQSxHQUFHLEVBQUU7QUFDRHpRLFVBQUFBLElBQUksNkNBREg7QUFFRDBRLFVBQUFBLFNBQVMsSUFGUjtBQUdEQyxVQUFBQSxlQUFlLElBSGQ7QUFJREMsVUFBQUEsS0FBSyxJQUpKO0FBS0RDLFVBQUFBLFdBQVcsSUFMVjtBQU1EQyxVQUFBQSxXQUFXLElBTlY7QUFPREMsVUFBQUEsV0FBVztBQVBWO0FBM0dEO0FBdkJKO0FBbEVEO0FBMVBTLENBQWIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L3ByZWZlci1kZWZhdWx0LWV4cG9ydFxuZXhwb3J0IGNvbnN0IGRvY3MgPSB7XG4gICAgYWNjb3VudDoge1xuICAgICAgICBfZG9jOiBgXG4jIEFjY291bnQgdHlwZVxuXG5SZWNhbGwgdGhhdCBhIHNtYXJ0IGNvbnRyYWN0IGFuZCBhbiBhY2NvdW50IGFyZSB0aGUgc2FtZSB0aGluZyBpbiB0aGUgY29udGV4dFxub2YgdGhlIFRPTiBCbG9ja2NoYWluLCBhbmQgdGhhdCB0aGVzZSB0ZXJtcyBjYW4gYmUgdXNlZCBpbnRlcmNoYW5nZWFibHksIGF0XG5sZWFzdCBhcyBsb25nIGFzIG9ubHkgc21hbGwgKG9yIOKAnHVzdWFs4oCdKSBzbWFydCBjb250cmFjdHMgYXJlIGNvbnNpZGVyZWQuIEEgbGFyZ2VcbnNtYXJ0LWNvbnRyYWN0IG1heSBlbXBsb3kgc2V2ZXJhbCBhY2NvdW50cyBseWluZyBpbiBkaWZmZXJlbnQgc2hhcmRjaGFpbnMgb2ZcbnRoZSBzYW1lIHdvcmtjaGFpbiBmb3IgbG9hZCBiYWxhbmNpbmcgcHVycG9zZXMuXG5cbkFuIGFjY291bnQgaXMgaWRlbnRpZmllZCBieSBpdHMgZnVsbCBhZGRyZXNzIGFuZCBpcyBjb21wbGV0ZWx5IGRlc2NyaWJlZCBieVxuaXRzIHN0YXRlLiBJbiBvdGhlciB3b3JkcywgdGhlcmUgaXMgbm90aGluZyBlbHNlIGluIGFuIGFjY291bnQgYXBhcnQgZnJvbSBpdHNcbmFkZHJlc3MgYW5kIHN0YXRlLlxuICAgICAgICAgICBgLFxuICAgICAgICBpZDogYGAsXG4gICAgICAgIGFjY190eXBlOiBgUmV0dXJucyB0aGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7YWNjX3R5cGU6e2VxOjF9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgbGFzdF9wYWlkOiBgXG5Db250YWlucyBlaXRoZXIgdGhlIHVuaXh0aW1lIG9mIHRoZSBtb3N0IHJlY2VudCBzdG9yYWdlIHBheW1lbnRcbmNvbGxlY3RlZCAodXN1YWxseSB0aGlzIGlzIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgdHJhbnNhY3Rpb24pLFxub3IgdGhlIHVuaXh0aW1lIHdoZW4gdGhlIGFjY291bnQgd2FzIGNyZWF0ZWQgKGFnYWluLCBieSBhIHRyYW5zYWN0aW9uKS5cblxcYFxcYFxcYFxucXVlcnl7XG4gIGFjY291bnRzKGZpbHRlcjoge1xuICAgIGxhc3RfcGFpZDp7Z2U6MTU2NzI5NjAwMH1cbiAgfSkge1xuICBpZFxuICBsYXN0X3BhaWR9XG59XG5cXGBcXGBcXGAgICAgIFxuICAgICAgICAgICAgICAgIGAsXG4gICAgICAgIGR1ZV9wYXltZW50OiBgXG5JZiBwcmVzZW50LCBhY2N1bXVsYXRlcyB0aGUgc3RvcmFnZSBwYXltZW50cyB0aGF0IGNvdWxkIG5vdCBiZSBleGFjdGVkIGZyb20gdGhlIGJhbGFuY2Ugb2YgdGhlIGFjY291bnQsIHJlcHJlc2VudGVkIGJ5IGEgc3RyaWN0bHkgcG9zaXRpdmUgYW1vdW50IG9mIG5hbm9ncmFtczsgaXQgY2FuIGJlIHByZXNlbnQgb25seSBmb3IgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudHMgdGhhdCBoYXZlIGEgYmFsYW5jZSBvZiB6ZXJvIEdyYW1zIChidXQgbWF5IGhhdmUgbm9uLXplcm8gYmFsYW5jZXMgaW4gbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcykuIFdoZW4gZHVlX3BheW1lbnQgYmVjb21lcyBsYXJnZXIgdGhhbiB0aGUgdmFsdWUgb2YgYSBjb25maWd1cmFibGUgcGFyYW1ldGVyIG9mIHRoZSBibG9ja2NoYWluLCB0aGUgYWMtIGNvdW50IGlzIGRlc3Ryb3llZCBhbHRvZ2V0aGVyLCBhbmQgaXRzIGJhbGFuY2UsIGlmIGFueSwgaXMgdHJhbnNmZXJyZWQgdG8gdGhlIHplcm8gYWNjb3VudC5cblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhmaWx0ZXI6IHsgZHVlX3BheW1lbnQ6IHsgbmU6IG51bGwgfSB9KVxuICAgIHtcbiAgICAgIGlkXG4gICAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfdHJhbnNfbHQ6IGAgYCxcbiAgICAgICAgYmFsYW5jZTogYFxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKG9yZGVyQnk6e3BhdGg6XCJiYWxhbmNlXCIsZGlyZWN0aW9uOkRFU0N9KXtcbiAgICBiYWxhbmNlXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBiYWxhbmNlX290aGVyOiBgIGAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgSXMgcHJlc2VudCBhbmQgbm9uLXplcm8gb25seSBpbiBpbnN0YW5jZXMgb2YgbGFyZ2Ugc21hcnQgY29udHJhY3RzLmAsXG4gICAgICAgIHRpY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLmAsXG4gICAgICAgIHRvY2s6IGBNYXkgYmUgcHJlc2VudCBvbmx5IGluIHRoZSBtYXN0ZXJjaGFpbuKAlGFuZCB3aXRoaW4gdGhlIG1hc3RlcmNoYWluLCBvbmx5IGluIHNvbWUgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIHJlcXVpcmVkIGZvciB0aGUgd2hvbGUgc3lzdGVtIHRvIGZ1bmN0aW9uLlxuXFxgXFxgXFxgICAgICAgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7dG9jazp7bmU6bnVsbH19KXtcbiAgICBpZFxuICAgIHRvY2tcbiAgICB0aWNrXG4gIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBjb2RlOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgY29kZSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LlxuXFxgXFxgXFxgICBcbntcbiAgYWNjb3VudHMgKGZpbHRlcjp7Y29kZTp7ZXE6bnVsbH19KXtcbiAgICBpZFxuICAgIGFjY190eXBlXG4gIH1cbn0gICBcblxcYFxcYFxcYCAgICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBgLFxuICAgICAgICBkYXRhOiBgSWYgcHJlc2VudCwgY29udGFpbnMgc21hcnQtY29udHJhY3QgZGF0YSBlbmNvZGVkIHdpdGggaW4gYmFzZTY0LmAsXG4gICAgICAgIGxpYnJhcnk6IGBJZiBwcmVzZW50LCBjb250YWlucyBsaWJyYXJ5IGNvZGUgdXNlZCBpbiBzbWFydC1jb250cmFjdC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgYWNjb3VudCBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICB9LFxuICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgX2RvYzogYCMgTWVzc2FnZSB0eXBlXG5cbiAgICAgICAgICAgTWVzc2FnZSBsYXlvdXQgcXVlcmllcy4gIEEgbWVzc2FnZSBjb25zaXN0cyBvZiBpdHMgaGVhZGVyIGZvbGxvd2VkIGJ5IGl0c1xuICAgICAgICAgICBib2R5IG9yIHBheWxvYWQuIFRoZSBib2R5IGlzIGVzc2VudGlhbGx5IGFyYml0cmFyeSwgdG8gYmUgaW50ZXJwcmV0ZWQgYnkgdGhlXG4gICAgICAgICAgIGRlc3RpbmF0aW9uIHNtYXJ0IGNvbnRyYWN0LiBJdCBjYW4gYmUgcXVlcmllZCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOmAsXG4gICAgICAgIG1zZ190eXBlOiBgUmV0dXJucyB0aGUgdHlwZSBvZiBtZXNzYWdlLmAsXG4gICAgICAgIHN0YXR1czogYFJldHVybnMgaW50ZXJuYWwgcHJvY2Vzc2luZyBzdGF0dXMgYWNjb3JkaW5nIHRvIHRoZSBudW1iZXJzIHNob3duLmAsXG4gICAgICAgIGJsb2NrX2lkOiBgTWVya2xlIHByb29mIHRoYXQgYWNjb3VudCBpcyBhIHBhcnQgb2Ygc2hhcmQgc3RhdGUgaXQgY3V0IGZyb20gYXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvZHk6IGBCYWcgb2YgY2VsbHMgd2l0aCB0aGUgbWVzc2FnZSBib2R5IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIHNwbGl0X2RlcHRoOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0aWNrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICB0b2NrOiBgVGhpcyBpcyBvbmx5IHVzZWQgZm9yIHNwZWNpYWwgY29udHJhY3RzIGluIG1hc3RlcmNoYWluIHRvIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIGNvZGU6IGBSZXByZXNlbnRzIGNvbnRyYWN0IGNvZGUgaW4gZGVwbG95IG1lc3NhZ2VzLmAsXG4gICAgICAgIGRhdGE6IGBSZXByZXNlbnRzIGluaXRpYWwgZGF0YSBmb3IgYSBjb250cmFjdCBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBsaWJyYXJ5OiBgUmVwcmVzZW50cyBjb250cmFjdCBsaWJyYXJ5IGluIGRlcGxveSBtZXNzYWdlc2AsXG4gICAgICAgIHNyYzogYFJldHVybnMgc291cmNlIGFkZHJlc3Mgc3RyaW5nYCxcbiAgICAgICAgZHN0OiBgUmV0dXJucyBkZXN0aW5hdGlvbiBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIGNyZWF0ZWRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgY3JlYXRlZF9hdDogYENyZWF0aW9uIHVuaXh0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLiBUaGUgY3JlYXRpb24gdW5peHRpbWUgZXF1YWxzIHRoZSBjcmVhdGlvbiB1bml4dGltZSBvZiB0aGUgYmxvY2sgY29udGFpbmluZyB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi5gLFxuICAgICAgICBpaHJfZGlzYWJsZWQ6IGBJSFIgaXMgZGlzYWJsZWQgZm9yIHRoZSBtZXNzYWdlLmAsXG4gICAgICAgIGlocl9mZWU6IGBUaGlzIHZhbHVlIGlzIHN1YnRyYWN0ZWQgZnJvbSB0aGUgdmFsdWUgYXR0YWNoZWQgdG8gdGhlIG1lc3NhZ2UgYW5kIGF3YXJkZWQgdG8gdGhlIHZhbGlkYXRvcnMgb2YgdGhlIGRlc3RpbmF0aW9uIHNoYXJkY2hhaW4gaWYgdGhleSBpbmNsdWRlIHRoZSBtZXNzYWdlIGJ5IHRoZSBJSFIgbWVjaGFuaXNtLmAsXG4gICAgICAgIGZ3ZF9mZWU6IGBPcmlnaW5hbCB0b3RhbCBmb3J3YXJkaW5nIGZlZSBwYWlkIGZvciB1c2luZyB0aGUgSFIgbWVjaGFuaXNtOyBpdCBpcyBhdXRvbWF0aWNhbGx5IGNvbXB1dGVkIGZyb20gc29tZSBjb25maWd1cmF0aW9uIHBhcmFtZXRlcnMgYW5kIHRoZSBzaXplIG9mIHRoZSBtZXNzYWdlIGF0IHRoZSB0aW1lIHRoZSBtZXNzYWdlIGlzIGdlbmVyYXRlZC5gLFxuICAgICAgICBpbXBvcnRfZmVlOiBgYCxcbiAgICAgICAgYm91bmNlOiBgQm91bmNlIGZsYWcuIElmIHRoZSB0cmFuc2FjdGlvbiBoYXMgYmVlbiBhYm9ydGVkLCBhbmQgdGhlIGluYm91bmQgbWVzc2FnZSBoYXMgaXRzIGJvdW5jZSBmbGFnIHNldCwgdGhlbiBpdCBpcyDigJxib3VuY2Vk4oCdIGJ5IGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGluZyBhbiBvdXRib3VuZCBtZXNzYWdlICh3aXRoIHRoZSBib3VuY2UgZmxhZyBjbGVhcikgdG8gaXRzIG9yaWdpbmFsIHNlbmRlci5gLFxuICAgICAgICBib3VuY2VkOiBgQm91bmNlZCBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgdmFsdWU6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50YCxcbiAgICAgICAgdmFsdWVfb3RoZXI6IGBNYXkgb3IgbWF5IG5vdCBiZSBwcmVzZW50LmAsXG4gICAgICAgIHByb29mOiBgTWVya2xlIHByb29mIHRoYXQgbWVzc2FnZSBpcyBhIHBhcnQgb2YgYSBibG9jayBpdCBjdXQgZnJvbS4gSXQgaXMgYSBiYWcgb2YgY2VsbHMgd2l0aCBNZXJrbGUgcHJvb2Ygc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgICAgIGJvYzogYEEgYmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2Ugc3RydWN0dXJlIGVuY29kZWQgYXMgYmFzZTY0LmBcbiAgICB9LFxuXG5cbiAgICB0cmFuc2FjdGlvbiA6IHtcbiAgICAgICAgX2RvYzogJ1RPTiBUcmFuc2FjdGlvbicsXG4gICAgICAgIF86IHtjb2xsZWN0aW9uOiAndHJhbnNhY3Rpb25zJ30sXG4gICAgICAgIHRyX3R5cGU6IGBUcmFuc2FjdGlvbiB0eXBlIGFjY29yZGluZyB0byB0aGUgb3JpZ2luYWwgYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uLCBjbGF1c2UgNC4yLjQuYCxcbiAgICAgICAgc3RhdHVzOiBgVHJhbnNhY3Rpb24gcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgICAgICBibG9ja19pZDogYGAsXG4gICAgICAgIGFjY291bnRfYWRkcjogYGAsXG4gICAgICAgIGx0OiBgTG9naWNhbCB0aW1lLiBBIGNvbXBvbmVudCBvZiB0aGUgVE9OIEJsb2NrY2hhaW4gdGhhdCBhbHNvIHBsYXlzIGFuIGltcG9ydGFudCByb2xlIGluIG1lc3NhZ2UgZGVsaXZlcnkgaXMgdGhlIGxvZ2ljYWwgdGltZSwgdXN1YWxseSBkZW5vdGVkIGJ5IEx0LiBJdCBpcyBhIG5vbi1uZWdhdGl2ZSA2NC1iaXQgaW50ZWdlciwgYXNzaWduZWQgdG8gY2VydGFpbiBldmVudHMuIEZvciBtb3JlIGRldGFpbHMsIHNlZSBbdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25dKGh0dHBzOi8vdGVzdC50b24ub3JnL3RibGtjaC5wZGYpLmAsXG4gICAgICAgIHByZXZfdHJhbnNfaGFzaDogYGAsXG4gICAgICAgIHByZXZfdHJhbnNfbHQ6IGBgLFxuICAgICAgICBub3c6IGBgLFxuICAgICAgICBvdXRtc2dfY250OiBgVGhlIG51bWJlciBvZiBnZW5lcmF0ZWQgb3V0Ym91bmQgbWVzc2FnZXMgKG9uZSBvZiB0aGUgY29tbW9uIHRyYW5zYWN0aW9uIHBhcmFtZXRlcnMgZGVmaW5lZCBieSB0aGUgc3BlY2lmaWNhdGlvbilgLFxuICAgICAgICBvcmlnX3N0YXR1czogYFRoZSBpbml0aWFsIHN0YXRlIG9mIGFjY291bnQuIE5vdGUgdGhhdCBpbiB0aGlzIGNhc2UgdGhlIHF1ZXJ5IG1heSByZXR1cm4gMCwgaWYgdGhlIGFjY291bnQgd2FzIG5vdCBhY3RpdmUgYmVmb3JlIHRoZSB0cmFuc2FjdGlvbiBhbmQgMSBpZiBpdCB3YXMgYWxyZWFkeSBhY3RpdmVgLFxuICAgICAgICBlbmRfc3RhdHVzOiBgVGhlIGVuZCBzdGF0ZSBvZiBhbiBhY2NvdW50IGFmdGVyIGEgdHJhbnNhY3Rpb24sIDEgaXMgcmV0dXJuZWQgdG8gaW5kaWNhdGUgYSBmaW5hbGl6ZWQgdHJhbnNhY3Rpb24gYXQgYW4gYWN0aXZlIGFjY291bnRgLFxuICAgICAgICBpbl9tc2c6IGBgLFxuICAgICAgICBpbl9tZXNzYWdlOiBgYCxcbiAgICAgICAgb3V0X21zZ3M6IGBEaWN0aW9uYXJ5IG9mIHRyYW5zYWN0aW9uIG91dGJvdW5kIG1lc3NhZ2VzIGFzIHNwZWNpZmllZCBpbiB0aGUgc3BlY2lmaWNhdGlvbmAsXG4gICAgICAgIG91dF9tZXNzYWdlczogYGAsXG4gICAgICAgIHRvdGFsX2ZlZXM6IGBUb3RhbCBhbW91bnQgb2YgZmVlcyB0aGF0IGVudGFpbHMgYWNjb3VudCBzdGF0ZSBjaGFuZ2UgYW5kIHVzZWQgaW4gTWVya2xlIHVwZGF0ZWAsXG4gICAgICAgIHRvdGFsX2ZlZXNfb3RoZXI6IGBTYW1lIGFzIGFib3ZlLCBidXQgcmVzZXJ2ZWQgZm9yIG5vbiBncmFtIGNvaW5zIHRoYXQgbWF5IGFwcGVhciBpbiB0aGUgYmxvY2tjaGFpbmAsXG4gICAgICAgIG9sZF9oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIG5ld19oYXNoOiBgTWVya2xlIHVwZGF0ZSBmaWVsZGAsXG4gICAgICAgIGNyZWRpdF9maXJzdDogYGAsXG4gICAgICAgIHN0b3JhZ2U6IHtcbiAgICAgICAgICAgIHN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQ6IGBUaGlzIGZpZWxkIGRlZmluZXMgdGhlIGFtb3VudCBvZiBzdG9yYWdlIGZlZXMgY29sbGVjdGVkIGluIGdyYW1zLmAsXG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfZHVlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIHRoZSBhbW91bnQgb2YgZHVlIGZlZXMgaW4gZ3JhbXMsIGl0IG1pZ2h0IGJlIGVtcHR5LmAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgVGhpcyBmaWVsZCByZXByZXNlbnRzIGFjY291bnQgc3RhdHVzIGNoYW5nZSBhZnRlciB0aGUgdHJhbnNhY3Rpb24gaXMgY29tcGxldGVkLmAsXG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlZGl0OiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGFjY291bnQgaXMgY3JlZGl0ZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSByZWNlaXZlZC4gVGhlIGNyZWRpdCBwaGFzZSBjYW4gcmVzdWx0IGluIHRoZSBjb2xsZWN0aW9uIG9mIHNvbWUgZHVlIHBheW1lbnRzYCxcbiAgICAgICAgICAgIGR1ZV9mZWVzX2NvbGxlY3RlZDogYFRoZSBzdW0gb2YgZHVlX2ZlZXNfY29sbGVjdGVkIGFuZCBjcmVkaXQgbXVzdCBlcXVhbCB0aGUgdmFsdWUgb2YgdGhlIG1lc3NhZ2UgcmVjZWl2ZWQsIHBsdXMgaXRzIGlocl9mZWUgaWYgdGhlIG1lc3NhZ2UgaGFzIG5vdCBiZWVuIHJlY2VpdmVkIHZpYSBJbnN0YW50IEh5cGVyY3ViZSBSb3V0aW5nLCBJSFIgKG90aGVyd2lzZSB0aGUgaWhyX2ZlZSBpcyBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzKS5gLFxuICAgICAgICAgICAgY3JlZGl0OiBgYCxcbiAgICAgICAgICAgIGNyZWRpdF9vdGhlcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbXB1dGU6IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgY29kZSBvZiB0aGUgc21hcnQgY29udHJhY3QgaXMgaW52b2tlZCBpbnNpZGUgYW4gaW5zdGFuY2Ugb2YgVFZNIHdpdGggYWRlcXVhdGUgcGFyYW1ldGVycywgaW5jbHVkaW5nIGEgY29weSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGFuZCBvZiB0aGUgcGVyc2lzdGVudCBkYXRhLCBhbmQgdGVybWluYXRlcyB3aXRoIGFuIGV4aXQgY29kZSwgdGhlIG5ldyBwZXJzaXN0ZW50IGRhdGEsIGFuZCBhbiBhY3Rpb24gbGlzdCAod2hpY2ggaW5jbHVkZXMsIGZvciBpbnN0YW5jZSwgb3V0Ym91bmQgbWVzc2FnZXMgdG8gYmUgc2VudCkuIFRoZSBwcm9jZXNzaW5nIHBoYXNlIG1heSBsZWFkIHRvIHRoZSBjcmVhdGlvbiBvZiBhIG5ldyBhY2NvdW50ICh1bmluaXRpYWxpemVkIG9yIGFjdGl2ZSksIG9yIHRvIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSB1bmluaXRpYWxpemVkIG9yIGZyb3plbiBhY2NvdW50LiBUaGUgZ2FzIHBheW1lbnQsIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIHRoZSBnYXMgcHJpY2UgYW5kIHRoZSBnYXMgY29uc3VtZWQsIGlzIGV4YWN0ZWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlLlxuSWYgdGhlcmUgaXMgbm8gcmVhc29uIHRvIHNraXAgdGhlIGNvbXB1dGluZyBwaGFzZSwgVFZNIGlzIGludm9rZWQgYW5kIHRoZSByZXN1bHRzIG9mIHRoZSBjb21wdXRhdGlvbiBhcmUgbG9nZ2VkLiBQb3NzaWJsZSBwYXJhbWV0ZXJzIGFyZSBjb3ZlcmVkIGJlbG93LmAsXG4gICAgICAgICAgICBjb21wdXRlX3R5cGU6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9yZWFzb246IGBSZWFzb24gZm9yIHNraXBwaW5nIHRoZSBjb21wdXRlIHBoYXNlLiBBY2NvcmRpbmcgdG8gdGhlIHNwZWNpZmljYXRpb24sIHRoZSBwaGFzZSBjYW4gYmUgc2tpcHBlZCBkdWUgdG8gdGhlIGFic2VuY2Ugb2YgZnVuZHMgdG8gYnV5IGdhcywgYWJzZW5jZSBvZiBzdGF0ZSBvZiBhbiBhY2NvdW50IG9yIGEgbWVzc2FnZSwgZmFpbHVyZSB0byBwcm92aWRlIGEgdmFsaWQgc3RhdGUgaW4gdGhlIG1lc3NhZ2VgLFxuICAgICAgICAgICAgc3VjY2VzczogYFRoaXMgZmxhZyBpcyBzZXQgaWYgYW5kIG9ubHkgaWYgZXhpdF9jb2RlIGlzIGVpdGhlciAwIG9yIDEuYCxcbiAgICAgICAgICAgIG1zZ19zdGF0ZV91c2VkOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgd2hldGhlciB0aGUgc3RhdGUgcGFzc2VkIGluIHRoZSBtZXNzYWdlIGhhcyBiZWVuIHVzZWQuIElmIGl0IGlzIHNldCwgdGhlIGFjY291bnRfYWN0aXZhdGVkIGZsYWcgaXMgdXNlZCAoc2VlIGJlbG93KVRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylgLFxuICAgICAgICAgICAgYWNjb3VudF9hY3RpdmF0ZWQ6IGBUaGUgZmxhZyByZWZsZWN0cyB3aGV0aGVyIHRoaXMgaGFzIHJlc3VsdGVkIGluIHRoZSBhY3RpdmF0aW9uIG9mIGEgcHJldmlvdXNseSBmcm96ZW4sIHVuaW5pdGlhbGl6ZWQgb3Igbm9uLWV4aXN0ZW50IGFjY291bnQuYCxcbiAgICAgICAgICAgIGdhc19mZWVzOiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIHRvdGFsIGdhcyBmZWVzIGNvbGxlY3RlZCBieSB0aGUgdmFsaWRhdG9ycyBmb3IgZXhlY3V0aW5nIHRoaXMgdHJhbnNhY3Rpb24uIEl0IG11c3QgYmUgZXF1YWwgdG8gdGhlIHByb2R1Y3Qgb2YgZ2FzX3VzZWQgYW5kIGdhc19wcmljZSBmcm9tIHRoZSBjdXJyZW50IGJsb2NrIGhlYWRlci5gLFxuICAgICAgICAgICAgZ2FzX3VzZWQ6IGBgLFxuICAgICAgICAgICAgZ2FzX2xpbWl0OiBgVGhpcyBwYXJhbWV0ZXIgcmVmbGVjdHMgdGhlIGdhcyBsaW1pdCBmb3IgdGhpcyBpbnN0YW5jZSBvZiBUVk0uIEl0IGVxdWFscyB0aGUgbGVzc2VyIG9mIGVpdGhlciB0aGUgR3JhbXMgY3JlZGl0ZWQgaW4gdGhlIGNyZWRpdCBwaGFzZSBmcm9tIHRoZSB2YWx1ZSBvZiB0aGUgaW5ib3VuZCBtZXNzYWdlIGRpdmlkZWQgYnkgdGhlIGN1cnJlbnQgZ2FzIHByaWNlLCBvciB0aGUgZ2xvYmFsIHBlci10cmFuc2FjdGlvbiBnYXMgbGltaXQuYCxcbiAgICAgICAgICAgIGdhc19jcmVkaXQ6IGBUaGlzIHBhcmFtZXRlciBtYXkgYmUgbm9uLXplcm8gb25seSBmb3IgZXh0ZXJuYWwgaW5ib3VuZCBtZXNzYWdlcy4gSXQgaXMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIGFtb3VudCBvZiBnYXMgdGhhdCBjYW4gYmUgcGFpZCBmcm9tIHRoZSBhY2NvdW50IGJhbGFuY2Ugb3IgdGhlIG1heGltdW0gZ2FzIGNyZWRpdGAsXG4gICAgICAgICAgICBtb2RlOiBgYCxcbiAgICAgICAgICAgIGV4aXRfY29kZTogYFRoZXNlIHBhcmFtZXRlciByZXByZXNlbnRzIHRoZSBzdGF0dXMgdmFsdWVzIHJldHVybmVkIGJ5IFRWTTsgZm9yIGEgc3VjY2Vzc2Z1bCB0cmFuc2FjdGlvbiwgZXhpdF9jb2RlIGhhcyB0byBiZSAwIG9yIDFgLFxuICAgICAgICAgICAgZXhpdF9hcmc6IGBgLFxuICAgICAgICAgICAgdm1fc3RlcHM6IGB0aGUgdG90YWwgbnVtYmVyIG9mIHN0ZXBzIHBlcmZvcm1lZCBieSBUVk0gKHVzdWFsbHkgZXF1YWwgdG8gdHdvIHBsdXMgdGhlIG51bWJlciBvZiBpbnN0cnVjdGlvbnMgZXhlY3V0ZWQsIGluY2x1ZGluZyBpbXBsaWNpdCBSRVRzKWAsXG4gICAgICAgICAgICB2bV9pbml0X3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSBvcmlnaW5hbCBzdGF0ZSBvZiBUVk0uYCxcbiAgICAgICAgICAgIHZtX2ZpbmFsX3N0YXRlX2hhc2g6IGBUaGlzIHBhcmFtZXRlciBpcyB0aGUgcmVwcmVzZW50YXRpb24gaGFzaGVzIG9mIHRoZSByZXN1bHRpbmcgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgIH0sXG4gICAgICAgIGFjdGlvbjoge1xuICAgICAgICAgICAgX2RvYzogYElmIHRoZSBzbWFydCBjb250cmFjdCBoYXMgdGVybWluYXRlZCBzdWNjZXNzZnVsbHkgKHdpdGggZXhpdCBjb2RlIDAgb3IgMSksIHRoZSBhY3Rpb25zIGZyb20gdGhlIGxpc3QgYXJlIHBlcmZvcm1lZC4gSWYgaXQgaXMgaW1wb3NzaWJsZSB0byBwZXJmb3JtIGFsbCBvZiB0aGVt4oCUZm9yIGV4YW1wbGUsIGJlY2F1c2Ugb2YgaW5zdWZmaWNpZW50IGZ1bmRzIHRvIHRyYW5zZmVyIHdpdGggYW4gb3V0Ym91bmQgbWVzc2FnZeKAlHRoZW4gdGhlIHRyYW5zYWN0aW9uIGlzIGFib3J0ZWQgYW5kIHRoZSBhY2NvdW50IHN0YXRlIGlzIHJvbGxlZCBiYWNrLiBUaGUgdHJhbnNhY3Rpb24gaXMgYWxzbyBhYm9ydGVkIGlmIHRoZSBzbWFydCBjb250cmFjdCBkaWQgbm90IHRlcm1pbmF0ZSBzdWNjZXNzZnVsbHksIG9yIGlmIGl0IHdhcyBub3QgcG9zc2libGUgdG8gaW52b2tlIHRoZSBzbWFydCBjb250cmFjdCBhdCBhbGwgYmVjYXVzZSBpdCBpcyB1bmluaXRpYWxpemVkIG9yIGZyb3plbi5gLFxuICAgICAgICAgICAgc3VjY2VzczogYGAsXG4gICAgICAgICAgICB2YWxpZDogYGAsXG4gICAgICAgICAgICBub19mdW5kczogYFRoZSBmbGFnIGluZGljYXRlcyBhYnNlbmNlIG9mIGZ1bmRzIHJlcXVpcmVkIHRvIGNyZWF0ZSBhbiBvdXRib3VuZCBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN0YXR1c19jaGFuZ2U6IGBgLFxuICAgICAgICAgICAgdG90YWxfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgdG90YWxfYWN0aW9uX2ZlZXM6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2NvZGU6IGBgLFxuICAgICAgICAgICAgcmVzdWx0X2FyZzogYGAsXG4gICAgICAgICAgICB0b3RfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBzcGVjX2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc2tpcHBlZF9hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIG1zZ3NfY3JlYXRlZDogYGAsXG4gICAgICAgICAgICBhY3Rpb25fbGlzdF9oYXNoOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2NlbGxzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX21zZ19zaXplX2JpdHM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBib3VuY2U6IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuIEFsbW9zdCBhbGwgdmFsdWUgb2YgdGhlIG9yaWdpbmFsIGluYm91bmQgbWVzc2FnZSAobWludXMgZ2FzIHBheW1lbnRzIGFuZCBmb3J3YXJkaW5nIGZlZXMpIGlzIHRyYW5zZmVycmVkIHRvIHRoZSBnZW5lcmF0ZWQgbWVzc2FnZSwgd2hpY2ggb3RoZXJ3aXNlIGhhcyBhbiBlbXB0eSBib2R5LmAsXG4gICAgICAgICAgICBib3VuY2VfdHlwZTogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICBtc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgICAgIHJlcV9md2RfZmVlczogYGAsXG4gICAgICAgICAgICBtc2dfZmVlczogYGAsXG4gICAgICAgICAgICBmd2RfZmVlczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGFib3J0ZWQ6IGBgLFxuICAgICAgICBkZXN0cm95ZWQ6IGBgLFxuICAgICAgICB0dDogYGAsXG4gICAgICAgIHNwbGl0X2luZm86IHtcbiAgICAgICAgICAgIF9kb2M6IGBUaGUgZmllbGRzIGJlbG93IGNvdmVyIHNwbGl0IHByZXBhcmUgYW5kIGluc3RhbGwgdHJhbnNhY3Rpb25zIGFuZCBtZXJnZSBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucywgdGhlIGZpZWxkcyBjb3JyZXNwb25kIHRvIHRoZSByZWxldmFudCBzY2hlbWVzIGNvdmVyZWQgYnkgdGhlIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbi5gLFxuICAgICAgICAgICAgY3VyX3NoYXJkX3BmeF9sZW46IGBsZW5ndGggb2YgdGhlIGN1cnJlbnQgc2hhcmQgcHJlZml4YCxcbiAgICAgICAgICAgIGFjY19zcGxpdF9kZXB0aDogYGAsXG4gICAgICAgICAgICB0aGlzX2FkZHI6IGBgLFxuICAgICAgICAgICAgc2libGluZ19hZGRyOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgcHJlcGFyZV90cmFuc2FjdGlvbjogYGAsXG4gICAgICAgIGluc3RhbGxlZDogYGAsXG4gICAgICAgIHByb29mOiBgYCxcbiAgICAgICAgYm9jOiBgYCxcbiAgICB9LFxuXG4gICAgc2hhcmREZXNjcjoge1xuICAgICAgICBfZG9jOiBgU2hhcmRIYXNoZXMgaXMgcmVwcmVzZW50ZWQgYnkgYSBkaWN0aW9uYXJ5IHdpdGggMzItYml0IHdvcmtjaGFpbl9pZHMgYXMga2V5cywgYW5kIOKAnHNoYXJkIGJpbmFyeSB0cmVlc+KAnSwgcmVwcmVzZW50ZWQgYnkgVEwtQiB0eXBlIEJpblRyZWUgU2hhcmREZXNjciwgYXMgdmFsdWVzLiBFYWNoIGxlYWYgb2YgdGhpcyBzaGFyZCBiaW5hcnkgdHJlZSBjb250YWlucyBhIHZhbHVlIG9mIHR5cGUgU2hhcmREZXNjciwgd2hpY2ggZGVzY3JpYmVzIGEgc2luZ2xlIHNoYXJkIGJ5IGluZGljYXRpbmcgdGhlIHNlcXVlbmNlIG51bWJlciBzZXFfbm8sIHRoZSBsb2dpY2FsIHRpbWUgbHQsIGFuZCB0aGUgaGFzaCBoYXNoIG9mIHRoZSBsYXRlc3QgKHNpZ25lZCkgYmxvY2sgb2YgdGhlIGNvcnJlc3BvbmRpbmcgc2hhcmRjaGFpbi5gLFxuICAgICAgICBzZXFfbm86IGB1aW50MzIgc2VxdWVuY2UgbnVtYmVyYCxcbiAgICAgICAgcmVnX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgICAgIHN0YXJ0X2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIHN0YXJ0YCxcbiAgICAgICAgZW5kX2x0OiBgTG9naWNhbCB0aW1lIG9mIHRoZSBzaGFyZGNoYWluIGVuZGAsXG4gICAgICAgIHJvb3RfaGFzaDogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi4gVGhlIHNoYXJkIGJsb2NrIGNvbmZpZ3VyYXRpb24gaXMgZGVyaXZlZCBmcm9tIHRoYXQgYmxvY2suYCxcbiAgICAgICAgZmlsZV9oYXNoOiBgU2hhcmQgYmxvY2sgZmlsZSBoYXNoLmAsXG4gICAgICAgIGJlZm9yZV9zcGxpdDogYFRPTiBCbG9ja2NoYWluIHN1cHBvcnRzIGR5bmFtaWMgc2hhcmRpbmcsIHNvIHRoZSBzaGFyZCBjb25maWd1cmF0aW9uIG1heSBjaGFuZ2UgZnJvbSBibG9jayB0byBibG9jayBiZWNhdXNlIG9mIHNoYXJkIG1lcmdlIGFuZCBzcGxpdCBldmVudHMuIFRoZXJlZm9yZSwgd2UgY2Fubm90IHNpbXBseSBzYXkgdGhhdCBlYWNoIHNoYXJkY2hhaW4gY29ycmVzcG9uZHMgdG8gYSBmaXhlZCBzZXQgb2YgYWNjb3VudCBjaGFpbnMuXG5BIHNoYXJkY2hhaW4gYmxvY2sgYW5kIGl0cyBzdGF0ZSBtYXkgZWFjaCBiZSBjbGFzc2lmaWVkIGludG8gdHdvIGRpc3RpbmN0IHBhcnRzLiBUaGUgcGFydHMgd2l0aCB0aGUgSVNQLWRpY3RhdGVkIGZvcm0gb2Ygd2lsbCBiZSBjYWxsZWQgdGhlIHNwbGl0IHBhcnRzIG9mIHRoZSBibG9jayBhbmQgaXRzIHN0YXRlLCB3aGlsZSB0aGUgcmVtYWluZGVyIHdpbGwgYmUgY2FsbGVkIHRoZSBub24tc3BsaXQgcGFydHMuXG5UaGUgbWFzdGVyY2hhaW4gY2Fubm90IGJlIHNwbGl0IG9yIG1lcmdlZC5gLFxuICAgICAgICBiZWZvcmVfbWVyZ2U6IGBgLFxuICAgICAgICB3YW50X3NwbGl0OiBgYCxcbiAgICAgICAgd2FudF9tZXJnZTogYGAsXG4gICAgICAgIG54X2NjX3VwZGF0ZWQ6IGBgLFxuICAgICAgICBmbGFnczogYGAsXG4gICAgICAgIG5leHRfY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgICAgICBuZXh0X3ZhbGlkYXRvcl9zaGFyZDogYGAsXG4gICAgICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBgLFxuICAgICAgICBnZW5fdXRpbWU6IGBHZW5lcmF0aW9uIHRpbWUgaW4gdWludDMyYCxcbiAgICAgICAgc3BsaXRfdHlwZTogYGAsXG4gICAgICAgIHNwbGl0OiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6YEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIGdyYW1zLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkX290aGVyOiBgQW1vdW50IG9mIGZlZXMgY29sbGVjdGVkIGludCBoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmdW5kc19jcmVhdGVkX290aGVyOiBgQW1vdW50IG9mIGZ1bmRzIGNyZWF0ZWQgaW4gdGhpcyBzaGFyZCBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgX2RvYzogJ1RoaXMgaXMgQmxvY2snLFxuICAgIHN0YXR1czogYFJldHVybnMgYmxvY2sgcHJvY2Vzc2luZyBzdGF0dXNgLFxuICAgIGdsb2JhbF9pZDogYHVpbnQzMiBnbG9iYWwgYmxvY2sgSURgLFxuICAgIHdhbnRfc3BsaXQ6IGBgLFxuICAgIHNlcV9ubzogYGAsXG4gICAgYWZ0ZXJfbWVyZ2U6IGBgLFxuICAgIGdlbl91dGltZTogYHVpbnQgMzIgZ2VuZXJhdGlvbiB0aW1lIHN0YW1wYCxcbiAgICBnZW5fY2F0Y2hhaW5fc2Vxbm86IGBgLFxuICAgIGZsYWdzOiBgYCxcbiAgICBtYXN0ZXJfcmVmOiBgYCxcbiAgICBwcmV2X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2suYCxcbiAgICBwcmV2X2FsdF9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrIGluIGNhc2Ugb2Ygc2hhcmQgbWVyZ2UuYCxcbiAgICBwcmV2X3ZlcnRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHZlcnRpY2FsIGJsb2Nrcy5gLFxuICAgIHByZXZfdmVydF9hbHRfcmVmOiBgYCxcbiAgICB2ZXJzaW9uOiBgdWluMzIgYmxvY2sgdmVyc2lvbiBpZGVudGlmaWVyYCxcbiAgICBnZW5fdmFsaWRhdG9yX2xpc3RfaGFzaF9zaG9ydDogYGAsXG4gICAgYmVmb3JlX3NwbGl0OiBgYCxcbiAgICBhZnRlcl9zcGxpdDogYGAsXG4gICAgd2FudF9tZXJnZTogYGAsXG4gICAgdmVydF9zZXFfbm86IGBgLFxuICAgIHN0YXJ0X2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBibG9jayBmb3JtYXRpb24gc3RhcnQuXG5Mb2dpY2FsIHRpbWUgaXMgYSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgdGhlIFRPTiBibG9ja2NoYWluIHNwZWNpZmljYXRpb25gLFxuICAgIGVuZF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIGVuZC5gLFxuICAgIHdvcmtjaGFpbl9pZDogYHVpbnQzMiB3b3JrY2hhaW4gaWRlbnRpZmllcmAsXG4gICAgc2hhcmQ6IGBgLFxuICAgIG1pbl9yZWZfbWNfc2Vxbm86IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uYCxcbiAgICBwcmV2X2tleV9ibG9ja19zZXFubzogYFJldHVybnMgYSBudW1iZXIgb2YgYSBwcmV2aW91cyBrZXkgYmxvY2suYCxcbiAgICB2YWx1ZV9mbG93OiB7XG4gICAgICAgIHRvX25leHRfYmxrOiBgQW1vdW50IG9mIGdyYW1zIGFtb3VudCB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICB0b19uZXh0X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRvIHRoZSBuZXh0IGJsb2NrLmAsXG4gICAgICAgIGV4cG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGV4cG9ydGVkLmAsXG4gICAgICAgIGV4cG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgZXhwb3J0ZWQuYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWQ6IGBgLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYGAsXG4gICAgICAgIGNyZWF0ZWQ6IGBgLFxuICAgICAgICBjcmVhdGVkX290aGVyOiBgYCxcbiAgICAgICAgaW1wb3J0ZWQ6IGBBbW91bnQgb2YgZ3JhbXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgaW1wb3J0ZWRfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyBpbXBvcnRlZC5gLFxuICAgICAgICBmcm9tX3ByZXZfYmxrOiBgQW1vdW50IG9mIGdyYW1zIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgZnJvbV9wcmV2X2Jsa19vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIHRyYW5zZmVycmVkIGZyb20gcHJldmlvdXMgYmxvY2suYCxcbiAgICAgICAgbWludGVkOiBgQW1vdW50IG9mIGdyYW1zIG1pbnRlZCBpbiB0aGlzIGJsb2NrLmAsXG4gICAgICAgIG1pbnRlZF9vdGhlcjogYGAsXG4gICAgICAgIGZlZXNfaW1wb3J0ZWQ6IGBBbW91bnQgb2YgaW1wb3J0IGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICBmZWVzX2ltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICB9LFxuICAgIGluX21zZ19kZXNjcjogYGAsXG4gICAgcmFuZF9zZWVkOiBgYCxcbiAgICBvdXRfbXNnX2Rlc2NyOiBgYCxcbiAgICBhY2NvdW50X2Jsb2Nrczoge1xuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICB0cmFuc2FjdGlvbnM6IGBgLFxuICAgICAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgICAgIG9sZF9oYXNoOiBgb2xkIHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYCxcbiAgICAgICAgICAgIG5ld19oYXNoOiBgbmV3IHZlcnNpb24gb2YgYmxvY2sgaGFzaGVzYFxuICAgICAgICB9LFxuICAgICAgICB0cl9jb3VudDogYGBcbiAgICB9LFxuICAgIHN0YXRlX3VwZGF0ZToge1xuICAgICAgICBuZXc6IGBgLFxuICAgICAgICBuZXdfaGFzaDogYGAsXG4gICAgICAgIG5ld19kZXB0aDogYGAsXG4gICAgICAgIG9sZDogYGAsXG4gICAgICAgIG9sZF9oYXNoOiBgYCxcbiAgICAgICAgb2xkX2RlcHRoOiBgYFxuICAgIH0sXG4gICAgbWFzdGVyOiB7XG4gICAgICAgIHNoYXJkX2hhc2hlczoge1xuICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIHNoYXJkIGhhc2hlc2AsXG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBVaW50MzIgd29ya2NoYWluIElEYCxcbiAgICAgICAgICAgIHNoYXJkOiBgU2hhcmQgSURgLFxuICAgICAgICAgICAgZGVzY3I6IGBTaGFyZCBkZXNjcmlwdGlvbmAsXG4gICAgICAgIH0sXG4gICAgICAgIHNoYXJkX2ZlZXM6IHtcbiAgICAgICAgICAgIHdvcmtjaGFpbl9pZDogYGAsXG4gICAgICAgICAgICBzaGFyZDogYGAsXG4gICAgICAgICAgICBmZWVzOiBgQW1vdW50IG9mIGZlZXMgaW4gZ3JhbXNgLFxuICAgICAgICAgICAgZmVlc19vdGhlcjogYEFycmF5IG9mIGZlZXMgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXNgLFxuICAgICAgICAgICAgY3JlYXRlOiBgQW1vdW50IG9mIGZlZXMgY3JlYXRlZCBkdXJpbmcgc2hhcmRgLFxuICAgICAgICAgICAgY3JlYXRlX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGZlZXMgY3JlYXRlZCBpbiBub24gZ3JhbSBjcnlwdG8gY3VycmVuY2llcyBkdXJpbmcgdGhlIGJsb2NrLmAsXG4gICAgICAgIH0sXG4gICAgICAgIHJlY292ZXJfY3JlYXRlX21zZzogYGAsXG4gICAgICAgIHByZXZfYmxrX3NpZ25hdHVyZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBwcmV2aW91cyBibG9jayBzaWduYXR1cmVzYCxcbiAgICAgICAgICAgIG5vZGVfaWQ6IGBgLFxuICAgICAgICAgICAgcjogYGAsXG4gICAgICAgICAgICBzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnX2FkZHI6IGBgLFxuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIHAwOiBgQWRkcmVzcyBvZiBjb25maWcgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAxOiBgQWRkcmVzcyBvZiBlbGVjdG9yIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjogYEFkZHJlc3Mgb2YgbWludGVyIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMzogYEFkZHJlc3Mgb2YgZmVlIGNvbGxlY3RvciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDQ6IGBBZGRyZXNzIG9mIFRPTiBETlMgcm9vdCBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgNmAsXG4gICAgICAgICAgICAgICAgbWludF9uZXdfcHJpY2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbnRfYWRkX3ByaWNlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBDb25maWd1cmF0aW9uIHBhcmFtZXRlciA3YCxcbiAgICAgICAgICAgICAgICBjdXJyZW5jeTogYGAsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEdsb2JhbCB2ZXJzaW9uYCxcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXBhYmlsaXRpZXM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHA5OiBgTWFuZGF0b3J5IHBhcmFtc2AsXG4gICAgICAgICAgICBwMTI6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgYWxsIHdvcmtjaGFpbnMgZGVzY3JpcHRpb25zYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgICAgIGVuYWJsZWRfc2luY2U6IGBgLFxuICAgICAgICAgICAgICAgIGFjdHVhbF9taW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBhY3RpdmU6IGBgLFxuICAgICAgICAgICAgICAgIGFjY2VwdF9tc2dzOiBgYCxcbiAgICAgICAgICAgICAgICBmbGFnczogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX3Jvb3RfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgemVyb3N0YXRlX2ZpbGVfaGFzaDogYGAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgYmFzaWM6IGBgLFxuICAgICAgICAgICAgICAgIHZtX3ZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIHZtX21vZGU6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2FkZHJfbGVuOiBgYCxcbiAgICAgICAgICAgICAgICBhZGRyX2xlbl9zdGVwOiBgYCxcbiAgICAgICAgICAgICAgICB3b3JrY2hhaW5fdHlwZV9pZDogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE0OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEJsb2NrIGNyZWF0ZSBmZWVzYCxcbiAgICAgICAgICAgICAgICBtYXN0ZXJjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgICAgIGJhc2VjaGFpbl9ibG9ja19mZWU6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBFbGVjdGlvbiBwYXJhbWV0ZXJzYCxcbiAgICAgICAgICAgICAgICB2YWxpZGF0b3JzX2VsZWN0ZWRfZm9yOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfc3RhcnRfYmVmb3JlOiBgYCxcbiAgICAgICAgICAgICAgICBlbGVjdGlvbnNfZW5kX2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgc3Rha2VfaGVsZF9mb3I6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNjoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3JzIGNvdW50YCxcbiAgICAgICAgICAgICAgICBtYXhfdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X21haW5fdmFsaWRhdG9yczogYGAsXG4gICAgICAgICAgICAgICAgbWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNzoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBWYWxpZGF0b3Igc3Rha2UgcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgbWluX3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl90b3RhbF9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlX2ZhY3RvcjogYGBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgU3RvcmFnZSBwcmljZXNgLFxuICAgICAgICAgICAgICAgIHV0aW1lX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICBiaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIGNlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1jX2JpdF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICAgICAgbWNfY2VsbF9wcmljZV9wczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDIwOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjE6IGBHYXMgbGltaXRzIGFuZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjI6IGBCbG9jayBsaW1pdHMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyMzogYEJsb2NrIGxpbWl0cyBpbiB3b3JrY2hhaW5zYCxcbiAgICAgICAgICAgIHAyNDogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHAyNTogYE1lc3NhZ2UgZm9yd2FyZCBwcmljZXMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjg6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ2F0Y2hhaW4gY29uZmlnYCxcbiAgICAgICAgICAgICAgICBtY19jYXRjaGFpbl9saWZldGltZTogYGAsXG4gICAgICAgICAgICAgICAgc2hhcmRfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX3ZhbGlkYXRvcnNfbnVtOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMjk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uc2Vuc3VzIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgcm91bmRfY2FuZGlkYXRlczogYGAsXG4gICAgICAgICAgICAgICAgbmV4dF9jYW5kaWRhdGVfZGVsYXlfbXM6IGBgLFxuICAgICAgICAgICAgICAgIGNvbnNlbnN1c190aW1lb3V0X21zOiBgYCxcbiAgICAgICAgICAgICAgICBmYXN0X2F0dGVtcHRzOiBgYCxcbiAgICAgICAgICAgICAgICBhdHRlbXB0X2R1cmF0aW9uOiBgYCxcbiAgICAgICAgICAgICAgICBjYXRjaGFpbl9tYXhfZGVwczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2Jsb2NrX2J5dGVzOiBgYCxcbiAgICAgICAgICAgICAgICBtYXhfY29sbGF0ZWRfYnl0ZXM6IGBgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDMxOiBgQXJyYXkgb2YgZnVuZGFtZW50YWwgc21hcnQgY29udHJhY3RzIGFkZHJlc3Nlc2AsXG4gICAgICAgICAgICBwMzI6IGBQcmV2aW91cyB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzM6IGBQcmV2aW91cyB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNDogYEN1cnJlbnQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM1OiBgQ3VycmVudCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNjogYE5leHQgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDM3OiBgTmV4dCB0ZW1wcm9yYXJ5IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzOToge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiB2YWxpZGF0b3Igc2lnbmVkIHRlbXByb3Jhcnkga2V5c2AsXG4gICAgICAgICAgICAgICAgYWRubF9hZGRyOiBgYCxcbiAgICAgICAgICAgICAgICB0ZW1wX3B1YmxpY19rZXk6IGBgLFxuICAgICAgICAgICAgICAgIHNlcW5vOiBgYCxcbiAgICAgICAgICAgICAgICB2YWxpZF91bnRpbDogYGAsXG4gICAgICAgICAgICAgICAgc2lnbmF0dXJlX3I6IGBgLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9zOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9LFxufVxufTtcbiJdfQ==