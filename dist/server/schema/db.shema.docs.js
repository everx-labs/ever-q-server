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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NlcnZlci9zY2hlbWEvZGIuc2hlbWEuZG9jcy5qcyJdLCJuYW1lcyI6WyJkb2NzIiwiYWNjb3VudCIsIl9kb2MiLCJpZCIsImFjY190eXBlIiwibGFzdF9wYWlkIiwiZHVlX3BheW1lbnQiLCJsYXN0X3RyYW5zX2x0IiwiYmFsYW5jZSIsImJhbGFuY2Vfb3RoZXIiLCJzcGxpdF9kZXB0aCIsInRpY2siLCJ0b2NrIiwiY29kZSIsImRhdGEiLCJsaWJyYXJ5IiwicHJvb2YiLCJib2MiLCJtZXNzYWdlIiwibXNnX3R5cGUiLCJzdGF0dXMiLCJibG9ja19pZCIsImJvZHkiLCJzcmMiLCJkc3QiLCJjcmVhdGVkX2x0IiwiY3JlYXRlZF9hdCIsImlocl9kaXNhYmxlZCIsImlocl9mZWUiLCJmd2RfZmVlIiwiaW1wb3J0X2ZlZSIsImJvdW5jZSIsImJvdW5jZWQiLCJ2YWx1ZSIsInZhbHVlX290aGVyIiwidHJhbnNhY3Rpb24iLCJfIiwiY29sbGVjdGlvbiIsInRyX3R5cGUiLCJhY2NvdW50X2FkZHIiLCJsdCIsInByZXZfdHJhbnNfaGFzaCIsInByZXZfdHJhbnNfbHQiLCJub3ciLCJvdXRtc2dfY250Iiwib3JpZ19zdGF0dXMiLCJlbmRfc3RhdHVzIiwiaW5fbXNnIiwiaW5fbWVzc2FnZSIsIm91dF9tc2dzIiwib3V0X21lc3NhZ2VzIiwidG90YWxfZmVlcyIsInRvdGFsX2ZlZXNfb3RoZXIiLCJvbGRfaGFzaCIsIm5ld19oYXNoIiwiY3JlZGl0X2ZpcnN0Iiwic3RvcmFnZSIsInN0b3JhZ2VfZmVlc19jb2xsZWN0ZWQiLCJzdG9yYWdlX2ZlZXNfZHVlIiwic3RhdHVzX2NoYW5nZSIsImNyZWRpdCIsImR1ZV9mZWVzX2NvbGxlY3RlZCIsImNyZWRpdF9vdGhlciIsImNvbXB1dGUiLCJjb21wdXRlX3R5cGUiLCJza2lwcGVkX3JlYXNvbiIsInN1Y2Nlc3MiLCJtc2dfc3RhdGVfdXNlZCIsImFjY291bnRfYWN0aXZhdGVkIiwiZ2FzX2ZlZXMiLCJnYXNfdXNlZCIsImdhc19saW1pdCIsImdhc19jcmVkaXQiLCJtb2RlIiwiZXhpdF9jb2RlIiwiZXhpdF9hcmciLCJ2bV9zdGVwcyIsInZtX2luaXRfc3RhdGVfaGFzaCIsInZtX2ZpbmFsX3N0YXRlX2hhc2giLCJhY3Rpb24iLCJ2YWxpZCIsIm5vX2Z1bmRzIiwidG90YWxfZndkX2ZlZXMiLCJ0b3RhbF9hY3Rpb25fZmVlcyIsInJlc3VsdF9jb2RlIiwicmVzdWx0X2FyZyIsInRvdF9hY3Rpb25zIiwic3BlY19hY3Rpb25zIiwic2tpcHBlZF9hY3Rpb25zIiwibXNnc19jcmVhdGVkIiwiYWN0aW9uX2xpc3RfaGFzaCIsInRvdGFsX21zZ19zaXplX2NlbGxzIiwidG90YWxfbXNnX3NpemVfYml0cyIsImJvdW5jZV90eXBlIiwibXNnX3NpemVfY2VsbHMiLCJtc2dfc2l6ZV9iaXRzIiwicmVxX2Z3ZF9mZWVzIiwibXNnX2ZlZXMiLCJmd2RfZmVlcyIsImFib3J0ZWQiLCJkZXN0cm95ZWQiLCJ0dCIsInNwbGl0X2luZm8iLCJjdXJfc2hhcmRfcGZ4X2xlbiIsImFjY19zcGxpdF9kZXB0aCIsInRoaXNfYWRkciIsInNpYmxpbmdfYWRkciIsInByZXBhcmVfdHJhbnNhY3Rpb24iLCJpbnN0YWxsZWQiLCJzaGFyZERlc2NyIiwic2VxX25vIiwicmVnX21jX3NlcW5vIiwic3RhcnRfbHQiLCJlbmRfbHQiLCJyb290X2hhc2giLCJmaWxlX2hhc2giLCJiZWZvcmVfc3BsaXQiLCJiZWZvcmVfbWVyZ2UiLCJ3YW50X3NwbGl0Iiwid2FudF9tZXJnZSIsIm54X2NjX3VwZGF0ZWQiLCJmbGFncyIsIm5leHRfY2F0Y2hhaW5fc2Vxbm8iLCJuZXh0X3ZhbGlkYXRvcl9zaGFyZCIsIm1pbl9yZWZfbWNfc2Vxbm8iLCJnZW5fdXRpbWUiLCJzcGxpdF90eXBlIiwic3BsaXQiLCJmZWVzX2NvbGxlY3RlZCIsImZlZXNfY29sbGVjdGVkX290aGVyIiwiZnVuZHNfY3JlYXRlZCIsImZ1bmRzX2NyZWF0ZWRfb3RoZXIiLCJibG9jayIsImdsb2JhbF9pZCIsImFmdGVyX21lcmdlIiwiZ2VuX2NhdGNoYWluX3NlcW5vIiwibWFzdGVyX3JlZiIsInByZXZfcmVmIiwicHJldl9hbHRfcmVmIiwicHJldl92ZXJ0X3JlZiIsInByZXZfdmVydF9hbHRfcmVmIiwidmVyc2lvbiIsImdlbl92YWxpZGF0b3JfbGlzdF9oYXNoX3Nob3J0IiwiYWZ0ZXJfc3BsaXQiLCJ2ZXJ0X3NlcV9ubyIsIndvcmtjaGFpbl9pZCIsInNoYXJkIiwidmFsdWVfZmxvdyIsInRvX25leHRfYmxrIiwidG9fbmV4dF9ibGtfb3RoZXIiLCJleHBvcnRlZCIsImV4cG9ydGVkX290aGVyIiwiY3JlYXRlZCIsImNyZWF0ZWRfb3RoZXIiLCJpbXBvcnRlZCIsImltcG9ydGVkX290aGVyIiwiZnJvbV9wcmV2X2JsayIsImZyb21fcHJldl9ibGtfb3RoZXIiLCJtaW50ZWQiLCJtaW50ZWRfb3RoZXIiLCJmZWVzX2ltcG9ydGVkIiwiZmVlc19pbXBvcnRlZF9vdGhlciIsImluX21zZ19kZXNjciIsInJhbmRfc2VlZCIsIm91dF9tc2dfZGVzY3IiLCJhY2NvdW50X2Jsb2NrcyIsInRyYW5zYWN0aW9ucyIsInN0YXRlX3VwZGF0ZSIsInRyX2NvdW50IiwibmV3X2RlcHRoIiwib2xkIiwib2xkX2RlcHRoIiwibWFzdGVyIiwic2hhcmRfaGFzaGVzIiwiZGVzY3IiLCJzaGFyZF9mZWVzIiwiZmVlcyIsImZlZXNfb3RoZXIiLCJjcmVhdGUiLCJjcmVhdGVfb3RoZXIiLCJyZWNvdmVyX2NyZWF0ZV9tc2ciLCJwcmV2X2Jsa19zaWduYXR1cmVzIiwibm9kZV9pZCIsInIiLCJzIiwiY29uZmlnX2FkZHIiLCJjb25maWciLCJwMCIsInAxIiwicDIiLCJwMyIsInA0IiwicDYiLCJtaW50X25ld19wcmljZSIsIm1pbnRfYWRkX3ByaWNlIiwicDciLCJjdXJyZW5jeSIsInA4IiwiY2FwYWJpbGl0aWVzIiwicDkiLCJwMTIiLCJlbmFibGVkX3NpbmNlIiwiYWN0dWFsX21pbl9zcGxpdCIsIm1pbl9zcGxpdCIsIm1heF9zcGxpdCIsImFjdGl2ZSIsImFjY2VwdF9tc2dzIiwiemVyb3N0YXRlX3Jvb3RfaGFzaCIsInplcm9zdGF0ZV9maWxlX2hhc2giLCJiYXNpYyIsInZtX3ZlcnNpb24iLCJ2bV9tb2RlIiwibWluX2FkZHJfbGVuIiwibWF4X2FkZHJfbGVuIiwiYWRkcl9sZW5fc3RlcCIsIndvcmtjaGFpbl90eXBlX2lkIiwicDE0IiwibWFzdGVyY2hhaW5fYmxvY2tfZmVlIiwiYmFzZWNoYWluX2Jsb2NrX2ZlZSIsInAxNSIsInZhbGlkYXRvcnNfZWxlY3RlZF9mb3IiLCJlbGVjdGlvbnNfc3RhcnRfYmVmb3JlIiwiZWxlY3Rpb25zX2VuZF9iZWZvcmUiLCJzdGFrZV9oZWxkX2ZvciIsInAxNiIsIm1heF92YWxpZGF0b3JzIiwibWF4X21haW5fdmFsaWRhdG9ycyIsIm1pbl92YWxpZGF0b3JzIiwicDE3IiwibWluX3N0YWtlIiwibWF4X3N0YWtlIiwibWluX3RvdGFsX3N0YWtlIiwibWF4X3N0YWtlX2ZhY3RvciIsInAxOCIsInV0aW1lX3NpbmNlIiwiYml0X3ByaWNlX3BzIiwiY2VsbF9wcmljZV9wcyIsIm1jX2JpdF9wcmljZV9wcyIsIm1jX2NlbGxfcHJpY2VfcHMiLCJwMjAiLCJwMjEiLCJwMjIiLCJwMjMiLCJwMjQiLCJwMjUiLCJwMjgiLCJtY19jYXRjaGFpbl9saWZldGltZSIsInNoYXJkX2NhdGNoYWluX2xpZmV0aW1lIiwic2hhcmRfdmFsaWRhdG9yc19saWZldGltZSIsInNoYXJkX3ZhbGlkYXRvcnNfbnVtIiwicDI5Iiwicm91bmRfY2FuZGlkYXRlcyIsIm5leHRfY2FuZGlkYXRlX2RlbGF5X21zIiwiY29uc2Vuc3VzX3RpbWVvdXRfbXMiLCJmYXN0X2F0dGVtcHRzIiwiYXR0ZW1wdF9kdXJhdGlvbiIsImNhdGNoYWluX21heF9kZXBzIiwibWF4X2Jsb2NrX2J5dGVzIiwibWF4X2NvbGxhdGVkX2J5dGVzIiwicDMxIiwicDMyIiwicDMzIiwicDM0IiwicDM1IiwicDM2IiwicDM3IiwicDM5IiwiYWRubF9hZGRyIiwidGVtcF9wdWJsaWNfa2V5Iiwic2Vxbm8iLCJ2YWxpZF91bnRpbCIsInNpZ25hdHVyZV9yIiwic2lnbmF0dXJlX3MiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBO0FBQ08sSUFBTUEsSUFBSSxHQUFHO0FBQ2hCQyxFQUFBQSxPQUFPLEVBQUU7QUFDTEMsSUFBQUEsSUFBSSw0a0JBREM7QUFjTEMsSUFBQUEsRUFBRSxJQWRHO0FBZUxDLElBQUFBLFFBQVEsMklBZkg7QUF5QkxDLElBQUFBLFNBQVMscVZBekJKO0FBdUNMQyxJQUFBQSxXQUFXLHltQkF2Q047QUFrRExDLElBQUFBLGFBQWEsS0FsRFI7QUFtRExDLElBQUFBLE9BQU8sd0dBbkRGO0FBNERMQyxJQUFBQSxhQUFhLEtBNURSO0FBNkRMQyxJQUFBQSxXQUFXLHVFQTdETjtBQThETEMsSUFBQUEsSUFBSSwrSkE5REM7QUErRExDLElBQUFBLElBQUkseVFBL0RDO0FBMEVMQyxJQUFBQSxJQUFJLG1NQTFFQztBQXNGTEMsSUFBQUEsSUFBSSxvRUF0RkM7QUF1RkxDLElBQUFBLE9BQU8sNkRBdkZGO0FBd0ZMQyxJQUFBQSxLQUFLLGdJQXhGQTtBQXlGTEMsSUFBQUEsR0FBRztBQXpGRSxHQURPO0FBNEZoQkMsRUFBQUEsT0FBTyxFQUFFO0FBQ0xoQixJQUFBQSxJQUFJLHdSQURDO0FBTUxpQixJQUFBQSxRQUFRLGdDQU5IO0FBT0xDLElBQUFBLE1BQU0sc0VBUEQ7QUFRTEMsSUFBQUEsUUFBUSxnSUFSSDtBQVNMQyxJQUFBQSxJQUFJLHlEQVRDO0FBVUxaLElBQUFBLFdBQVcsOEVBVk47QUFXTEMsSUFBQUEsSUFBSSw4RUFYQztBQVlMQyxJQUFBQSxJQUFJLDZFQVpDO0FBYUxDLElBQUFBLElBQUksZ0RBYkM7QUFjTEMsSUFBQUEsSUFBSSw2REFkQztBQWVMQyxJQUFBQSxPQUFPLGtEQWZGO0FBZ0JMUSxJQUFBQSxHQUFHLGlDQWhCRTtBQWlCTEMsSUFBQUEsR0FBRyxzQ0FqQkU7QUFrQkxDLElBQUFBLFVBQVUsMEVBbEJMO0FBbUJMQyxJQUFBQSxVQUFVLDZLQW5CTDtBQW9CTEMsSUFBQUEsWUFBWSxvQ0FwQlA7QUFxQkxDLElBQUFBLE9BQU8saUxBckJGO0FBc0JMQyxJQUFBQSxPQUFPLG9NQXRCRjtBQXVCTEMsSUFBQUEsVUFBVSxJQXZCTDtBQXdCTEMsSUFBQUEsTUFBTSwwT0F4QkQ7QUF5QkxDLElBQUFBLE9BQU8sMk9BekJGO0FBMEJMQyxJQUFBQSxLQUFLLDZCQTFCQTtBQTJCTEMsSUFBQUEsV0FBVyw4QkEzQk47QUE0QkxsQixJQUFBQSxLQUFLLGdJQTVCQTtBQTZCTEMsSUFBQUEsR0FBRztBQTdCRSxHQTVGTztBQTZIaEJrQixFQUFBQSxXQUFXLEVBQUc7QUFDVmpDLElBQUFBLElBQUksRUFBRSxpQkFESTtBQUVWa0MsSUFBQUEsQ0FBQyxFQUFFO0FBQUNDLE1BQUFBLFVBQVUsRUFBRTtBQUFiLEtBRk87QUFHVkMsSUFBQUEsT0FBTyxzRkFIRztBQUlWbEIsSUFBQUEsTUFBTSxpQ0FKSTtBQUtWQyxJQUFBQSxRQUFRLElBTEU7QUFNVmtCLElBQUFBLFlBQVksSUFORjtBQU9WQyxJQUFBQSxFQUFFLGlUQVBRO0FBUVZDLElBQUFBLGVBQWUsSUFSTDtBQVNWQyxJQUFBQSxhQUFhLElBVEg7QUFVVkMsSUFBQUEsR0FBRyxJQVZPO0FBV1ZDLElBQUFBLFVBQVUscUhBWEE7QUFZVkMsSUFBQUEsV0FBVyxvS0FaRDtBQWFWQyxJQUFBQSxVQUFVLDJIQWJBO0FBY1ZDLElBQUFBLE1BQU0sSUFkSTtBQWVWQyxJQUFBQSxVQUFVLElBZkE7QUFnQlZDLElBQUFBLFFBQVEsaUZBaEJFO0FBaUJWQyxJQUFBQSxZQUFZLElBakJGO0FBa0JWQyxJQUFBQSxVQUFVLG9GQWxCQTtBQW1CVkMsSUFBQUEsZ0JBQWdCLG9GQW5CTjtBQW9CVkMsSUFBQUEsUUFBUSx1QkFwQkU7QUFxQlZDLElBQUFBLFFBQVEsdUJBckJFO0FBc0JWQyxJQUFBQSxZQUFZLElBdEJGO0FBdUJWQyxJQUFBQSxPQUFPLEVBQUU7QUFDTEMsTUFBQUEsc0JBQXNCLHFFQURqQjtBQUVMQyxNQUFBQSxnQkFBZ0IsNkVBRlg7QUFHTEMsTUFBQUEsYUFBYTtBQUhSLEtBdkJDO0FBNkJWQyxJQUFBQSxNQUFNLEVBQUU7QUFDSjFELE1BQUFBLElBQUksOElBREE7QUFFSjJELE1BQUFBLGtCQUFrQix5T0FGZDtBQUdKRCxNQUFBQSxNQUFNLElBSEY7QUFJSkUsTUFBQUEsWUFBWTtBQUpSLEtBN0JFO0FBbUNWQyxJQUFBQSxPQUFPLEVBQUU7QUFDTDdELE1BQUFBLElBQUksNHRCQURDO0FBR0w4RCxNQUFBQSxZQUFZLElBSFA7QUFJTEMsTUFBQUEsY0FBYyx3T0FKVDtBQUtMQyxNQUFBQSxPQUFPLCtEQUxGO0FBTUxDLE1BQUFBLGNBQWMsMFJBTlQ7QUFPTEMsTUFBQUEsaUJBQWlCLGdJQVBaO0FBUUxDLE1BQUFBLFFBQVEsbU1BUkg7QUFTTEMsTUFBQUEsUUFBUSxJQVRIO0FBVUxDLE1BQUFBLFNBQVMsMFBBVko7QUFXTEMsTUFBQUEsVUFBVSx1TEFYTDtBQVlMQyxNQUFBQSxJQUFJLElBWkM7QUFhTEMsTUFBQUEsU0FBUywwSEFiSjtBQWNMQyxNQUFBQSxRQUFRLElBZEg7QUFlTEMsTUFBQUEsUUFBUSx1SUFmSDtBQWdCTEMsTUFBQUEsa0JBQWtCLDZFQWhCYjtBQWlCTEMsTUFBQUEsbUJBQW1CO0FBakJkLEtBbkNDO0FBc0RWQyxJQUFBQSxNQUFNLEVBQUU7QUFDSjdFLE1BQUFBLElBQUksNmZBREE7QUFFSmdFLE1BQUFBLE9BQU8sSUFGSDtBQUdKYyxNQUFBQSxLQUFLLElBSEQ7QUFJSkMsTUFBQUEsUUFBUSw4RUFKSjtBQUtKdEIsTUFBQUEsYUFBYSxJQUxUO0FBTUp1QixNQUFBQSxjQUFjLElBTlY7QUFPSkMsTUFBQUEsaUJBQWlCLElBUGI7QUFRSkMsTUFBQUEsV0FBVyxJQVJQO0FBU0pDLE1BQUFBLFVBQVUsSUFUTjtBQVVKQyxNQUFBQSxXQUFXLElBVlA7QUFXSkMsTUFBQUEsWUFBWSxJQVhSO0FBWUpDLE1BQUFBLGVBQWUsSUFaWDtBQWFKQyxNQUFBQSxZQUFZLElBYlI7QUFjSkMsTUFBQUEsZ0JBQWdCLElBZFo7QUFlSkMsTUFBQUEsb0JBQW9CLElBZmhCO0FBZ0JKQyxNQUFBQSxtQkFBbUI7QUFoQmYsS0F0REU7QUF3RVY3RCxJQUFBQSxNQUFNLEVBQUU7QUFDSjdCLE1BQUFBLElBQUksbVlBREE7QUFFSjJGLE1BQUFBLFdBQVcsSUFGUDtBQUdKQyxNQUFBQSxjQUFjLElBSFY7QUFJSkMsTUFBQUEsYUFBYSxJQUpUO0FBS0pDLE1BQUFBLFlBQVksSUFMUjtBQU1KQyxNQUFBQSxRQUFRLElBTko7QUFPSkMsTUFBQUEsUUFBUTtBQVBKLEtBeEVFO0FBaUZWQyxJQUFBQSxPQUFPLElBakZHO0FBa0ZWQyxJQUFBQSxTQUFTLElBbEZDO0FBbUZWQyxJQUFBQSxFQUFFLElBbkZRO0FBb0ZWQyxJQUFBQSxVQUFVLEVBQUU7QUFDUnBHLE1BQUFBLElBQUksb01BREk7QUFFUnFHLE1BQUFBLGlCQUFpQixzQ0FGVDtBQUdSQyxNQUFBQSxlQUFlLElBSFA7QUFJUkMsTUFBQUEsU0FBUyxJQUpEO0FBS1JDLE1BQUFBLFlBQVk7QUFMSixLQXBGRjtBQTJGVkMsSUFBQUEsbUJBQW1CLElBM0ZUO0FBNEZWQyxJQUFBQSxTQUFTLElBNUZDO0FBNkZWNUYsSUFBQUEsS0FBSyxJQTdGSztBQThGVkMsSUFBQUEsR0FBRztBQTlGTyxHQTdIRTtBQThOaEI0RixFQUFBQSxVQUFVLEVBQUU7QUFDUjNHLElBQUFBLElBQUksb2FBREk7QUFFUjRHLElBQUFBLE1BQU0sMEJBRkU7QUFHUkMsSUFBQUEsWUFBWSxvRUFISjtBQUlSQyxJQUFBQSxRQUFRLHdDQUpBO0FBS1JDLElBQUFBLE1BQU0sc0NBTEU7QUFNUkMsSUFBQUEsU0FBUyw4SEFORDtBQU9SQyxJQUFBQSxTQUFTLDBCQVBEO0FBUVJDLElBQUFBLFlBQVksNGdCQVJKO0FBV1JDLElBQUFBLFlBQVksSUFYSjtBQVlSQyxJQUFBQSxVQUFVLElBWkY7QUFhUkMsSUFBQUEsVUFBVSxJQWJGO0FBY1JDLElBQUFBLGFBQWEsSUFkTDtBQWVSQyxJQUFBQSxLQUFLLElBZkc7QUFnQlJDLElBQUFBLG1CQUFtQixJQWhCWDtBQWlCUkMsSUFBQUEsb0JBQW9CLElBakJaO0FBa0JSQyxJQUFBQSxnQkFBZ0IsSUFsQlI7QUFtQlJDLElBQUFBLFNBQVMsNkJBbkJEO0FBb0JSQyxJQUFBQSxVQUFVLElBcEJGO0FBcUJSQyxJQUFBQSxLQUFLLElBckJHO0FBc0JSQyxJQUFBQSxjQUFjLG9EQXRCTjtBQXVCUkMsSUFBQUEsb0JBQW9CLGtFQXZCWjtBQXdCUkMsSUFBQUEsYUFBYSxtREF4Qkw7QUF5QlJDLElBQUFBLG1CQUFtQjtBQXpCWCxHQTlOSTtBQTBQaEJDLEVBQUFBLEtBQUssRUFBRTtBQUNQbEksSUFBQUEsSUFBSSxFQUFFLGVBREM7QUFFUGtCLElBQUFBLE1BQU0sbUNBRkM7QUFHUGlILElBQUFBLFNBQVMsMEJBSEY7QUFJUGYsSUFBQUEsVUFBVSxJQUpIO0FBS1BSLElBQUFBLE1BQU0sSUFMQztBQU1Qd0IsSUFBQUEsV0FBVyxJQU5KO0FBT1BULElBQUFBLFNBQVMsaUNBUEY7QUFRUFUsSUFBQUEsa0JBQWtCLElBUlg7QUFTUGQsSUFBQUEsS0FBSyxJQVRFO0FBVVBlLElBQUFBLFVBQVUsSUFWSDtBQVdQQyxJQUFBQSxRQUFRLGdEQVhEO0FBWVBDLElBQUFBLFlBQVksdUVBWkw7QUFhUEMsSUFBQUEsYUFBYSwyRUFiTjtBQWNQQyxJQUFBQSxpQkFBaUIsSUFkVjtBQWVQQyxJQUFBQSxPQUFPLGtDQWZBO0FBZ0JQQyxJQUFBQSw2QkFBNkIsSUFoQnRCO0FBaUJQMUIsSUFBQUEsWUFBWSxJQWpCTDtBQWtCUDJCLElBQUFBLFdBQVcsSUFsQko7QUFtQlB4QixJQUFBQSxVQUFVLElBbkJIO0FBb0JQeUIsSUFBQUEsV0FBVyxJQXBCSjtBQXFCUGhDLElBQUFBLFFBQVEsc1ZBckJEO0FBdUJQQyxJQUFBQSxNQUFNLHVFQXZCQztBQXdCUGdDLElBQUFBLFlBQVksK0JBeEJMO0FBeUJQQyxJQUFBQSxLQUFLLElBekJFO0FBMEJQdEIsSUFBQUEsZ0JBQWdCLG9FQTFCVDtBQTJCUHVCLElBQUFBLFVBQVUsRUFBRTtBQUNSQyxNQUFBQSxXQUFXLDZDQURIO0FBRVJDLE1BQUFBLGlCQUFpQiwwREFGVDtBQUdSQyxNQUFBQSxRQUFRLDZCQUhBO0FBSVJDLE1BQUFBLGNBQWMsaURBSk47QUFLUnZCLE1BQUFBLGNBQWMsSUFMTjtBQU1SQyxNQUFBQSxvQkFBb0IsSUFOWjtBQU9SdUIsTUFBQUEsT0FBTyxJQVBDO0FBUVJDLE1BQUFBLGFBQWEsSUFSTDtBQVNSQyxNQUFBQSxRQUFRLDZCQVRBO0FBVVJDLE1BQUFBLGNBQWMsaURBVk47QUFXUkMsTUFBQUEsYUFBYSxvREFYTDtBQVlSQyxNQUFBQSxtQkFBbUIsd0VBWlg7QUFhUkMsTUFBQUEsTUFBTSx5Q0FiRTtBQWNSQyxNQUFBQSxZQUFZLElBZEo7QUFlUkMsTUFBQUEsYUFBYSxrQ0FmTDtBQWdCUkMsTUFBQUEsbUJBQW1CO0FBaEJYLEtBM0JMO0FBNkNQQyxJQUFBQSxZQUFZLElBN0NMO0FBOENQQyxJQUFBQSxTQUFTLElBOUNGO0FBK0NQQyxJQUFBQSxhQUFhLElBL0NOO0FBZ0RQQyxJQUFBQSxjQUFjLEVBQUU7QUFDWjlILE1BQUFBLFlBQVksSUFEQTtBQUVaK0gsTUFBQUEsWUFBWSxJQUZBO0FBR1pDLE1BQUFBLFlBQVksRUFBRTtBQUNWbEgsUUFBQUEsUUFBUSwrQkFERTtBQUVWQyxRQUFBQSxRQUFRO0FBRkUsT0FIRjtBQU9aa0gsTUFBQUEsUUFBUTtBQVBJLEtBaERUO0FBeURQRCxJQUFBQSxZQUFZLEVBQUU7QUFDVixlQURVO0FBRVZqSCxNQUFBQSxRQUFRLElBRkU7QUFHVm1ILE1BQUFBLFNBQVMsSUFIQztBQUlWQyxNQUFBQSxHQUFHLElBSk87QUFLVnJILE1BQUFBLFFBQVEsSUFMRTtBQU1Wc0gsTUFBQUEsU0FBUztBQU5DLEtBekRQO0FBaUVQQyxJQUFBQSxNQUFNLEVBQUU7QUFDSkMsTUFBQUEsWUFBWSxFQUFFO0FBQ1YzSyxRQUFBQSxJQUFJLHlCQURNO0FBRVYrSSxRQUFBQSxZQUFZLHVCQUZGO0FBR1ZDLFFBQUFBLEtBQUssWUFISztBQUlWNEIsUUFBQUEsS0FBSztBQUpLLE9BRFY7QUFPSkMsTUFBQUEsVUFBVSxFQUFFO0FBQ1I5QixRQUFBQSxZQUFZLElBREo7QUFFUkMsUUFBQUEsS0FBSyxJQUZHO0FBR1I4QixRQUFBQSxJQUFJLDJCQUhJO0FBSVJDLFFBQUFBLFVBQVUsK0NBSkY7QUFLUkMsUUFBQUEsTUFBTSx1Q0FMRTtBQU1SQyxRQUFBQSxZQUFZO0FBTkosT0FQUjtBQWVKQyxNQUFBQSxrQkFBa0IsSUFmZDtBQWdCSkMsTUFBQUEsbUJBQW1CLEVBQUU7QUFDakJuTCxRQUFBQSxJQUFJLHNDQURhO0FBRWpCb0wsUUFBQUEsT0FBTyxJQUZVO0FBR2pCQyxRQUFBQSxDQUFDLElBSGdCO0FBSWpCQyxRQUFBQSxDQUFDO0FBSmdCLE9BaEJqQjtBQXNCSkMsTUFBQUEsV0FBVyxJQXRCUDtBQXVCSkMsTUFBQUEsTUFBTSxFQUFFO0FBQ0pDLFFBQUFBLEVBQUUsdURBREU7QUFFSkMsUUFBQUEsRUFBRSx3REFGRTtBQUdKQyxRQUFBQSxFQUFFLHVEQUhFO0FBSUpDLFFBQUFBLEVBQUUsOERBSkU7QUFLSkMsUUFBQUEsRUFBRSw2REFMRTtBQU1KQyxRQUFBQSxFQUFFLEVBQUU7QUFDQTlMLFVBQUFBLElBQUksNkJBREo7QUFFQStMLFVBQUFBLGNBQWMsSUFGZDtBQUdBQyxVQUFBQSxjQUFjO0FBSGQsU0FOQTtBQVdKQyxRQUFBQSxFQUFFLEVBQUU7QUFDQWpNLFVBQUFBLElBQUksNkJBREo7QUFFQWtNLFVBQUFBLFFBQVEsSUFGUjtBQUdBbkssVUFBQUEsS0FBSztBQUhMLFNBWEE7QUFnQkpvSyxRQUFBQSxFQUFFLEVBQUU7QUFDQW5NLFVBQUFBLElBQUksa0JBREo7QUFFQTJJLFVBQUFBLE9BQU8sSUFGUDtBQUdBeUQsVUFBQUEsWUFBWTtBQUhaLFNBaEJBO0FBcUJKQyxRQUFBQSxFQUFFLG9CQXJCRTtBQXNCSkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0R0TSxVQUFBQSxJQUFJLHdDQURIO0FBRUQrSSxVQUFBQSxZQUFZLElBRlg7QUFHRHdELFVBQUFBLGFBQWEsSUFIWjtBQUlEQyxVQUFBQSxnQkFBZ0IsSUFKZjtBQUtEQyxVQUFBQSxTQUFTLElBTFI7QUFNREMsVUFBQUEsU0FBUyxJQU5SO0FBT0RDLFVBQUFBLE1BQU0sSUFQTDtBQVFEQyxVQUFBQSxXQUFXLElBUlY7QUFTRHJGLFVBQUFBLEtBQUssSUFUSjtBQVVEc0YsVUFBQUEsbUJBQW1CLElBVmxCO0FBV0RDLFVBQUFBLG1CQUFtQixJQVhsQjtBQVlEbkUsVUFBQUEsT0FBTyxJQVpOO0FBYURvRSxVQUFBQSxLQUFLLElBYko7QUFjREMsVUFBQUEsVUFBVSxJQWRUO0FBZURDLFVBQUFBLE9BQU8sSUFmTjtBQWdCREMsVUFBQUEsWUFBWSxJQWhCWDtBQWlCREMsVUFBQUEsWUFBWSxJQWpCWDtBQWtCREMsVUFBQUEsYUFBYSxJQWxCWjtBQW1CREMsVUFBQUEsaUJBQWlCO0FBbkJoQixTQXRCRDtBQTJDSkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0R0TixVQUFBQSxJQUFJLHFCQURIO0FBRUR1TixVQUFBQSxxQkFBcUIsSUFGcEI7QUFHREMsVUFBQUEsbUJBQW1CO0FBSGxCLFNBM0NEO0FBZ0RKQyxRQUFBQSxHQUFHLEVBQUU7QUFDRHpOLFVBQUFBLElBQUksdUJBREg7QUFFRDBOLFVBQUFBLHNCQUFzQixJQUZyQjtBQUdEQyxVQUFBQSxzQkFBc0IsSUFIckI7QUFJREMsVUFBQUEsb0JBQW9CLElBSm5CO0FBS0RDLFVBQUFBLGNBQWM7QUFMYixTQWhERDtBQXVESkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0Q5TixVQUFBQSxJQUFJLG9CQURIO0FBRUQrTixVQUFBQSxjQUFjLElBRmI7QUFHREMsVUFBQUEsbUJBQW1CLElBSGxCO0FBSURDLFVBQUFBLGNBQWM7QUFKYixTQXZERDtBQTZESkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0RsTyxVQUFBQSxJQUFJLDhCQURIO0FBRURtTyxVQUFBQSxTQUFTLElBRlI7QUFHREMsVUFBQUEsU0FBUyxJQUhSO0FBSURDLFVBQUFBLGVBQWUsSUFKZDtBQUtEQyxVQUFBQSxnQkFBZ0I7QUFMZixTQTdERDtBQW9FSkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0R2TyxVQUFBQSxJQUFJLGtCQURIO0FBRUR3TyxVQUFBQSxXQUFXLElBRlY7QUFHREMsVUFBQUEsWUFBWSxJQUhYO0FBSURDLFVBQUFBLGFBQWEsSUFKWjtBQUtEQyxVQUFBQSxlQUFlLElBTGQ7QUFNREMsVUFBQUEsZ0JBQWdCO0FBTmYsU0FwRUQ7QUE0RUpDLFFBQUFBLEdBQUcsNENBNUVDO0FBNkVKQyxRQUFBQSxHQUFHLHVDQTdFQztBQThFSkMsUUFBQUEsR0FBRyxtQ0E5RUM7QUErRUpDLFFBQUFBLEdBQUcsOEJBL0VDO0FBZ0ZKQyxRQUFBQSxHQUFHLDZDQWhGQztBQWlGSkMsUUFBQUEsR0FBRyx3Q0FqRkM7QUFrRkpDLFFBQUFBLEdBQUcsRUFBRTtBQUNEblAsVUFBQUEsSUFBSSxtQkFESDtBQUVEb1AsVUFBQUEsb0JBQW9CLElBRm5CO0FBR0RDLFVBQUFBLHVCQUF1QixJQUh0QjtBQUlEQyxVQUFBQSx5QkFBeUIsSUFKeEI7QUFLREMsVUFBQUEsb0JBQW9CO0FBTG5CLFNBbEZEO0FBeUZKQyxRQUFBQSxHQUFHLEVBQUU7QUFDRHhQLFVBQUFBLElBQUksb0JBREg7QUFFRHlQLFVBQUFBLGdCQUFnQixJQUZmO0FBR0RDLFVBQUFBLHVCQUF1QixJQUh0QjtBQUlEQyxVQUFBQSxvQkFBb0IsSUFKbkI7QUFLREMsVUFBQUEsYUFBYSxJQUxaO0FBTURDLFVBQUFBLGdCQUFnQixJQU5mO0FBT0RDLFVBQUFBLGlCQUFpQixJQVBoQjtBQVFEQyxVQUFBQSxlQUFlLElBUmQ7QUFTREMsVUFBQUEsa0JBQWtCO0FBVGpCLFNBekZEO0FBb0dKQyxRQUFBQSxHQUFHLGtEQXBHQztBQXFHSkMsUUFBQUEsR0FBRywyQkFyR0M7QUFzR0pDLFFBQUFBLEdBQUcsc0NBdEdDO0FBdUdKQyxRQUFBQSxHQUFHLDBCQXZHQztBQXdHSkMsUUFBQUEsR0FBRyxxQ0F4R0M7QUF5R0pDLFFBQUFBLEdBQUcsdUJBekdDO0FBMEdKQyxRQUFBQSxHQUFHLGtDQTFHQztBQTJHSkMsUUFBQUEsR0FBRyxFQUFFO0FBQ0R4USxVQUFBQSxJQUFJLDZDQURIO0FBRUR5USxVQUFBQSxTQUFTLElBRlI7QUFHREMsVUFBQUEsZUFBZSxJQUhkO0FBSURDLFVBQUFBLEtBQUssSUFKSjtBQUtEQyxVQUFBQSxXQUFXLElBTFY7QUFNREMsVUFBQUEsV0FBVyxJQU5WO0FBT0RDLFVBQUFBLFdBQVc7QUFQVjtBQTNHRDtBQXZCSjtBQWpFRDtBQTFQUyxDQUFiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9wcmVmZXItZGVmYXVsdC1leHBvcnRcbmV4cG9ydCBjb25zdCBkb2NzID0ge1xuICAgIGFjY291bnQ6IHtcbiAgICAgICAgX2RvYzogYFxuIyBBY2NvdW50IHR5cGVcblxuUmVjYWxsIHRoYXQgYSBzbWFydCBjb250cmFjdCBhbmQgYW4gYWNjb3VudCBhcmUgdGhlIHNhbWUgdGhpbmcgaW4gdGhlIGNvbnRleHRcbm9mIHRoZSBUT04gQmxvY2tjaGFpbiwgYW5kIHRoYXQgdGhlc2UgdGVybXMgY2FuIGJlIHVzZWQgaW50ZXJjaGFuZ2VhYmx5LCBhdFxubGVhc3QgYXMgbG9uZyBhcyBvbmx5IHNtYWxsIChvciDigJx1c3VhbOKAnSkgc21hcnQgY29udHJhY3RzIGFyZSBjb25zaWRlcmVkLiBBIGxhcmdlXG5zbWFydC1jb250cmFjdCBtYXkgZW1wbG95IHNldmVyYWwgYWNjb3VudHMgbHlpbmcgaW4gZGlmZmVyZW50IHNoYXJkY2hhaW5zIG9mXG50aGUgc2FtZSB3b3JrY2hhaW4gZm9yIGxvYWQgYmFsYW5jaW5nIHB1cnBvc2VzLlxuXG5BbiBhY2NvdW50IGlzIGlkZW50aWZpZWQgYnkgaXRzIGZ1bGwgYWRkcmVzcyBhbmQgaXMgY29tcGxldGVseSBkZXNjcmliZWQgYnlcbml0cyBzdGF0ZS4gSW4gb3RoZXIgd29yZHMsIHRoZXJlIGlzIG5vdGhpbmcgZWxzZSBpbiBhbiBhY2NvdW50IGFwYXJ0IGZyb20gaXRzXG5hZGRyZXNzIGFuZCBzdGF0ZS5cbiAgICAgICAgICAgYCxcbiAgICAgICAgaWQ6IGBgLFxuICAgICAgICBhY2NfdHlwZTogYFJldHVybnMgdGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBhY2NvdW50LlxuXFxgXFxgXFxgXG57XG4gIGFjY291bnRzKGZpbHRlcjoge2FjY190eXBlOntlcToxfX0pe1xuICAgIGlkXG4gICAgYWNjX3R5cGVcbiAgfVxufVxuXFxgXFxgXFxgXG4gICAgICAgIGAsXG4gICAgICAgIGxhc3RfcGFpZDogYFxuQ29udGFpbnMgZWl0aGVyIHRoZSB1bml4dGltZSBvZiB0aGUgbW9zdCByZWNlbnQgc3RvcmFnZSBwYXltZW50XG5jb2xsZWN0ZWQgKHVzdWFsbHkgdGhpcyBpcyB0aGUgdW5peHRpbWUgb2YgdGhlIG1vc3QgcmVjZW50IHRyYW5zYWN0aW9uKSxcbm9yIHRoZSB1bml4dGltZSB3aGVuIHRoZSBhY2NvdW50IHdhcyBjcmVhdGVkIChhZ2FpbiwgYnkgYSB0cmFuc2FjdGlvbikuXG5cXGBcXGBcXGBcbnF1ZXJ5e1xuICBhY2NvdW50cyhmaWx0ZXI6IHtcbiAgICBsYXN0X3BhaWQ6e2dlOjE1NjcyOTYwMDB9XG4gIH0pIHtcbiAgaWRcbiAgbGFzdF9wYWlkfVxufVxuXFxgXFxgXFxgICAgICBcbiAgICAgICAgICAgICAgICBgLFxuICAgICAgICBkdWVfcGF5bWVudDogYFxuSWYgcHJlc2VudCwgYWNjdW11bGF0ZXMgdGhlIHN0b3JhZ2UgcGF5bWVudHMgdGhhdCBjb3VsZCBub3QgYmUgZXhhY3RlZCBmcm9tIHRoZSBiYWxhbmNlIG9mIHRoZSBhY2NvdW50LCByZXByZXNlbnRlZCBieSBhIHN0cmljdGx5IHBvc2l0aXZlIGFtb3VudCBvZiBuYW5vZ3JhbXM7IGl0IGNhbiBiZSBwcmVzZW50IG9ubHkgZm9yIHVuaW5pdGlhbGl6ZWQgb3IgZnJvemVuIGFjY291bnRzIHRoYXQgaGF2ZSBhIGJhbGFuY2Ugb2YgemVybyBHcmFtcyAoYnV0IG1heSBoYXZlIG5vbi16ZXJvIGJhbGFuY2VzIGluIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMpLiBXaGVuIGR1ZV9wYXltZW50IGJlY29tZXMgbGFyZ2VyIHRoYW4gdGhlIHZhbHVlIG9mIGEgY29uZmlndXJhYmxlIHBhcmFtZXRlciBvZiB0aGUgYmxvY2tjaGFpbiwgdGhlIGFjLSBjb3VudCBpcyBkZXN0cm95ZWQgYWx0b2dldGhlciwgYW5kIGl0cyBiYWxhbmNlLCBpZiBhbnksIGlzIHRyYW5zZmVycmVkIHRvIHRoZSB6ZXJvIGFjY291bnQuXG5cXGBcXGBcXGBcbntcbiAgYWNjb3VudHMoZmlsdGVyOiB7IGR1ZV9wYXltZW50OiB7IG5lOiBudWxsIH0gfSlcbiAgICB7XG4gICAgICBpZFxuICAgIH1cbn1cblxcYFxcYFxcYFxuICAgICAgICBgLFxuICAgICAgICBsYXN0X3RyYW5zX2x0OiBgIGAsXG4gICAgICAgIGJhbGFuY2U6IGBcblxcYFxcYFxcYFxue1xuICBhY2NvdW50cyhvcmRlckJ5OntwYXRoOlwiYmFsYW5jZVwiLGRpcmVjdGlvbjpERVNDfSl7XG4gICAgYmFsYW5jZVxuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgYmFsYW5jZV9vdGhlcjogYCBgLFxuICAgICAgICBzcGxpdF9kZXB0aDogYElzIHByZXNlbnQgYW5kIG5vbi16ZXJvIG9ubHkgaW4gaW5zdGFuY2VzIG9mIGxhcmdlIHNtYXJ0IGNvbnRyYWN0cy5gLFxuICAgICAgICB0aWNrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5gLFxuICAgICAgICB0b2NrOiBgTWF5IGJlIHByZXNlbnQgb25seSBpbiB0aGUgbWFzdGVyY2hhaW7igJRhbmQgd2l0aGluIHRoZSBtYXN0ZXJjaGFpbiwgb25seSBpbiBzb21lIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyByZXF1aXJlZCBmb3IgdGhlIHdob2xlIHN5c3RlbSB0byBmdW5jdGlvbi5cblxcYFxcYFxcYCAgICAgICAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e3RvY2s6e25lOm51bGx9fSl7XG4gICAgaWRcbiAgICB0b2NrXG4gICAgdGlja1xuICB9XG59XG5cXGBcXGBcXGBcbiAgICAgICAgYCxcbiAgICAgICAgY29kZTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGNvZGUgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5cblxcYFxcYFxcYCAgXG57XG4gIGFjY291bnRzIChmaWx0ZXI6e2NvZGU6e2VxOm51bGx9fSl7XG4gICAgaWRcbiAgICBhY2NfdHlwZVxuICB9XG59ICAgXG5cXGBcXGBcXGAgICAgICAgICAgXG4gICAgICAgIFxuICAgICAgICBcbiAgICAgICAgYCxcbiAgICAgICAgZGF0YTogYElmIHByZXNlbnQsIGNvbnRhaW5zIHNtYXJ0LWNvbnRyYWN0IGRhdGEgZW5jb2RlZCB3aXRoIGluIGJhc2U2NC5gLFxuICAgICAgICBsaWJyYXJ5OiBgSWYgcHJlc2VudCwgY29udGFpbnMgbGlicmFyeSBjb2RlIHVzZWQgaW4gc21hcnQtY29udHJhY3QuYCxcbiAgICAgICAgcHJvb2Y6IGBNZXJrbGUgcHJvb2YgdGhhdCBhY2NvdW50IGlzIGEgcGFydCBvZiBzaGFyZCBzdGF0ZSBpdCBjdXQgZnJvbSBhcyBhIGJhZyBvZiBjZWxscyB3aXRoIE1lcmtsZSBwcm9vZiBzdHJ1Y3QgZW5jb2RlZCBhcyBiYXNlNjQuYCxcbiAgICAgICAgYm9jOiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIGFjY291bnQgc3RydWN0IGVuY29kZWQgYXMgYmFzZTY0LmAsXG4gICAgfSxcbiAgICBtZXNzYWdlOiB7XG4gICAgICAgIF9kb2M6IGAjIE1lc3NhZ2UgdHlwZVxuXG4gICAgICAgICAgIE1lc3NhZ2UgbGF5b3V0IHF1ZXJpZXMuICBBIG1lc3NhZ2UgY29uc2lzdHMgb2YgaXRzIGhlYWRlciBmb2xsb3dlZCBieSBpdHNcbiAgICAgICAgICAgYm9keSBvciBwYXlsb2FkLiBUaGUgYm9keSBpcyBlc3NlbnRpYWxseSBhcmJpdHJhcnksIHRvIGJlIGludGVycHJldGVkIGJ5IHRoZVxuICAgICAgICAgICBkZXN0aW5hdGlvbiBzbWFydCBjb250cmFjdC4gSXQgY2FuIGJlIHF1ZXJpZWQgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpgLFxuICAgICAgICBtc2dfdHlwZTogYFJldHVybnMgdGhlIHR5cGUgb2YgbWVzc2FnZS5gLFxuICAgICAgICBzdGF0dXM6IGBSZXR1cm5zIGludGVybmFsIHByb2Nlc3Npbmcgc3RhdHVzIGFjY29yZGluZyB0byB0aGUgbnVtYmVycyBzaG93bi5gLFxuICAgICAgICBibG9ja19pZDogYE1lcmtsZSBwcm9vZiB0aGF0IGFjY291bnQgaXMgYSBwYXJ0IG9mIHNoYXJkIHN0YXRlIGl0IGN1dCBmcm9tIGFzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2R5OiBgQmFnIG9mIGNlbGxzIHdpdGggdGhlIG1lc3NhZ2UgYm9keSBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBzcGxpdF9kZXB0aDogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdGljazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXMuYCxcbiAgICAgICAgdG9jazogYFRoaXMgaXMgb25seSB1c2VkIGZvciBzcGVjaWFsIGNvbnRyYWN0cyBpbiBtYXN0ZXJjaGFpbiB0byBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBjb2RlOiBgUmVwcmVzZW50cyBjb250cmFjdCBjb2RlIGluIGRlcGxveSBtZXNzYWdlcy5gLFxuICAgICAgICBkYXRhOiBgUmVwcmVzZW50cyBpbml0aWFsIGRhdGEgZm9yIGEgY29udHJhY3QgaW4gZGVwbG95IG1lc3NhZ2VzYCxcbiAgICAgICAgbGlicmFyeTogYFJlcHJlc2VudHMgY29udHJhY3QgbGlicmFyeSBpbiBkZXBsb3kgbWVzc2FnZXNgLFxuICAgICAgICBzcmM6IGBSZXR1cm5zIHNvdXJjZSBhZGRyZXNzIHN0cmluZ2AsXG4gICAgICAgIGRzdDogYFJldHVybnMgZGVzdGluYXRpb24gYWRkcmVzcyBzdHJpbmdgLFxuICAgICAgICBjcmVhdGVkX2x0OiBgTG9naWNhbCBjcmVhdGlvbiB0aW1lIGF1dG9tYXRpY2FsbHkgc2V0IGJ5IHRoZSBnZW5lcmF0aW5nIHRyYW5zYWN0aW9uLmAsXG4gICAgICAgIGNyZWF0ZWRfYXQ6IGBDcmVhdGlvbiB1bml4dGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgZ2VuZXJhdGluZyB0cmFuc2FjdGlvbi4gVGhlIGNyZWF0aW9uIHVuaXh0aW1lIGVxdWFscyB0aGUgY3JlYXRpb24gdW5peHRpbWUgb2YgdGhlIGJsb2NrIGNvbnRhaW5pbmcgdGhlIGdlbmVyYXRpbmcgdHJhbnNhY3Rpb24uYCxcbiAgICAgICAgaWhyX2Rpc2FibGVkOiBgSUhSIGlzIGRpc2FibGVkIGZvciB0aGUgbWVzc2FnZS5gLFxuICAgICAgICBpaHJfZmVlOiBgVGhpcyB2YWx1ZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhlIHZhbHVlIGF0dGFjaGVkIHRvIHRoZSBtZXNzYWdlIGFuZCBhd2FyZGVkIHRvIHRoZSB2YWxpZGF0b3JzIG9mIHRoZSBkZXN0aW5hdGlvbiBzaGFyZGNoYWluIGlmIHRoZXkgaW5jbHVkZSB0aGUgbWVzc2FnZSBieSB0aGUgSUhSIG1lY2hhbmlzbS5gLFxuICAgICAgICBmd2RfZmVlOiBgT3JpZ2luYWwgdG90YWwgZm9yd2FyZGluZyBmZWUgcGFpZCBmb3IgdXNpbmcgdGhlIEhSIG1lY2hhbmlzbTsgaXQgaXMgYXV0b21hdGljYWxseSBjb21wdXRlZCBmcm9tIHNvbWUgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzIGFuZCB0aGUgc2l6ZSBvZiB0aGUgbWVzc2FnZSBhdCB0aGUgdGltZSB0aGUgbWVzc2FnZSBpcyBnZW5lcmF0ZWQuYCxcbiAgICAgICAgaW1wb3J0X2ZlZTogYGAsXG4gICAgICAgIGJvdW5jZTogYEJvdW5jZSBmbGFnLiBJZiB0aGUgdHJhbnNhY3Rpb24gaGFzIGJlZW4gYWJvcnRlZCwgYW5kIHRoZSBpbmJvdW5kIG1lc3NhZ2UgaGFzIGl0cyBib3VuY2UgZmxhZyBzZXQsIHRoZW4gaXQgaXMg4oCcYm91bmNlZOKAnSBieSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRpbmcgYW4gb3V0Ym91bmQgbWVzc2FnZSAod2l0aCB0aGUgYm91bmNlIGZsYWcgY2xlYXIpIHRvIGl0cyBvcmlnaW5hbCBzZW5kZXIuYCxcbiAgICAgICAgYm91bmNlZDogYEJvdW5jZWQgZmxhZy4gSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLmAsXG4gICAgICAgIHZhbHVlOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudGAsXG4gICAgICAgIHZhbHVlX290aGVyOiBgTWF5IG9yIG1heSBub3QgYmUgcHJlc2VudC5gLFxuICAgICAgICBwcm9vZjogYE1lcmtsZSBwcm9vZiB0aGF0IG1lc3NhZ2UgaXMgYSBwYXJ0IG9mIGEgYmxvY2sgaXQgY3V0IGZyb20uIEl0IGlzIGEgYmFnIG9mIGNlbGxzIHdpdGggTWVya2xlIHByb29mIHN0cnVjdCBlbmNvZGVkIGFzIGJhc2U2NC5gLFxuICAgICAgICBib2M6IGBBIGJhZyBvZiBjZWxscyB3aXRoIHRoZSBtZXNzYWdlIHN0cnVjdHVyZSBlbmNvZGVkIGFzIGJhc2U2NC5gXG4gICAgfSxcblxuXG4gICAgdHJhbnNhY3Rpb24gOiB7XG4gICAgICAgIF9kb2M6ICdUT04gVHJhbnNhY3Rpb24nLFxuICAgICAgICBfOiB7Y29sbGVjdGlvbjogJ3RyYW5zYWN0aW9ucyd9LFxuICAgICAgICB0cl90eXBlOiBgVHJhbnNhY3Rpb24gdHlwZSBhY2NvcmRpbmcgdG8gdGhlIG9yaWdpbmFsIGJsb2NrY2hhaW4gc3BlY2lmaWNhdGlvbiwgY2xhdXNlIDQuMi40LmAsXG4gICAgICAgIHN0YXR1czogYFRyYW5zYWN0aW9uIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICAgICAgYmxvY2tfaWQ6IGBgLFxuICAgICAgICBhY2NvdW50X2FkZHI6IGBgLFxuICAgICAgICBsdDogYExvZ2ljYWwgdGltZS4gQSBjb21wb25lbnQgb2YgdGhlIFRPTiBCbG9ja2NoYWluIHRoYXQgYWxzbyBwbGF5cyBhbiBpbXBvcnRhbnQgcm9sZSBpbiBtZXNzYWdlIGRlbGl2ZXJ5IGlzIHRoZSBsb2dpY2FsIHRpbWUsIHVzdWFsbHkgZGVub3RlZCBieSBMdC4gSXQgaXMgYSBub24tbmVnYXRpdmUgNjQtYml0IGludGVnZXIsIGFzc2lnbmVkIHRvIGNlcnRhaW4gZXZlbnRzLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWUgW3RoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uXShodHRwczovL3Rlc3QudG9uLm9yZy90YmxrY2gucGRmKS5gLFxuICAgICAgICBwcmV2X3RyYW5zX2hhc2g6IGBgLFxuICAgICAgICBwcmV2X3RyYW5zX2x0OiBgYCxcbiAgICAgICAgbm93OiBgYCxcbiAgICAgICAgb3V0bXNnX2NudDogYFRoZSBudW1iZXIgb2YgZ2VuZXJhdGVkIG91dGJvdW5kIG1lc3NhZ2VzIChvbmUgb2YgdGhlIGNvbW1vbiB0cmFuc2FjdGlvbiBwYXJhbWV0ZXJzIGRlZmluZWQgYnkgdGhlIHNwZWNpZmljYXRpb24pYCxcbiAgICAgICAgb3JpZ19zdGF0dXM6IGBUaGUgaW5pdGlhbCBzdGF0ZSBvZiBhY2NvdW50LiBOb3RlIHRoYXQgaW4gdGhpcyBjYXNlIHRoZSBxdWVyeSBtYXkgcmV0dXJuIDAsIGlmIHRoZSBhY2NvdW50IHdhcyBub3QgYWN0aXZlIGJlZm9yZSB0aGUgdHJhbnNhY3Rpb24gYW5kIDEgaWYgaXQgd2FzIGFscmVhZHkgYWN0aXZlYCxcbiAgICAgICAgZW5kX3N0YXR1czogYFRoZSBlbmQgc3RhdGUgb2YgYW4gYWNjb3VudCBhZnRlciBhIHRyYW5zYWN0aW9uLCAxIGlzIHJldHVybmVkIHRvIGluZGljYXRlIGEgZmluYWxpemVkIHRyYW5zYWN0aW9uIGF0IGFuIGFjdGl2ZSBhY2NvdW50YCxcbiAgICAgICAgaW5fbXNnOiBgYCxcbiAgICAgICAgaW5fbWVzc2FnZTogYGAsXG4gICAgICAgIG91dF9tc2dzOiBgRGljdGlvbmFyeSBvZiB0cmFuc2FjdGlvbiBvdXRib3VuZCBtZXNzYWdlcyBhcyBzcGVjaWZpZWQgaW4gdGhlIHNwZWNpZmljYXRpb25gLFxuICAgICAgICBvdXRfbWVzc2FnZXM6IGBgLFxuICAgICAgICB0b3RhbF9mZWVzOiBgVG90YWwgYW1vdW50IG9mIGZlZXMgdGhhdCBlbnRhaWxzIGFjY291bnQgc3RhdGUgY2hhbmdlIGFuZCB1c2VkIGluIE1lcmtsZSB1cGRhdGVgLFxuICAgICAgICB0b3RhbF9mZWVzX290aGVyOiBgU2FtZSBhcyBhYm92ZSwgYnV0IHJlc2VydmVkIGZvciBub24gZ3JhbSBjb2lucyB0aGF0IG1heSBhcHBlYXIgaW4gdGhlIGJsb2NrY2hhaW5gLFxuICAgICAgICBvbGRfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBuZXdfaGFzaDogYE1lcmtsZSB1cGRhdGUgZmllbGRgLFxuICAgICAgICBjcmVkaXRfZmlyc3Q6IGBgLFxuICAgICAgICBzdG9yYWdlOiB7XG4gICAgICAgICAgICBzdG9yYWdlX2ZlZXNfY29sbGVjdGVkOiBgVGhpcyBmaWVsZCBkZWZpbmVzIHRoZSBhbW91bnQgb2Ygc3RvcmFnZSBmZWVzIGNvbGxlY3RlZCBpbiBncmFtcy5gLFxuICAgICAgICAgICAgc3RvcmFnZV9mZWVzX2R1ZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyB0aGUgYW1vdW50IG9mIGR1ZSBmZWVzIGluIGdyYW1zLCBpdCBtaWdodCBiZSBlbXB0eS5gLFxuICAgICAgICAgICAgc3RhdHVzX2NoYW5nZTogYFRoaXMgZmllbGQgcmVwcmVzZW50cyBhY2NvdW50IHN0YXR1cyBjaGFuZ2UgYWZ0ZXIgdGhlIHRyYW5zYWN0aW9uIGlzIGNvbXBsZXRlZC5gLFxuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWRpdDoge1xuICAgICAgICAgICAgX2RvYzogYFRoZSBhY2NvdW50IGlzIGNyZWRpdGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBpbmJvdW5kIG1lc3NhZ2UgcmVjZWl2ZWQuIFRoZSBjcmVkaXQgcGhhc2UgY2FuIHJlc3VsdCBpbiB0aGUgY29sbGVjdGlvbiBvZiBzb21lIGR1ZSBwYXltZW50c2AsXG4gICAgICAgICAgICBkdWVfZmVlc19jb2xsZWN0ZWQ6IGBUaGUgc3VtIG9mIGR1ZV9mZWVzX2NvbGxlY3RlZCBhbmQgY3JlZGl0IG11c3QgZXF1YWwgdGhlIHZhbHVlIG9mIHRoZSBtZXNzYWdlIHJlY2VpdmVkLCBwbHVzIGl0cyBpaHJfZmVlIGlmIHRoZSBtZXNzYWdlIGhhcyBub3QgYmVlbiByZWNlaXZlZCB2aWEgSW5zdGFudCBIeXBlcmN1YmUgUm91dGluZywgSUhSIChvdGhlcndpc2UgdGhlIGlocl9mZWUgaXMgYXdhcmRlZCB0byB0aGUgdmFsaWRhdG9ycykuYCxcbiAgICAgICAgICAgIGNyZWRpdDogYGAsXG4gICAgICAgICAgICBjcmVkaXRfb3RoZXI6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBjb21wdXRlOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGNvZGUgb2YgdGhlIHNtYXJ0IGNvbnRyYWN0IGlzIGludm9rZWQgaW5zaWRlIGFuIGluc3RhbmNlIG9mIFRWTSB3aXRoIGFkZXF1YXRlIHBhcmFtZXRlcnMsIGluY2x1ZGluZyBhIGNvcHkgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBhbmQgb2YgdGhlIHBlcnNpc3RlbnQgZGF0YSwgYW5kIHRlcm1pbmF0ZXMgd2l0aCBhbiBleGl0IGNvZGUsIHRoZSBuZXcgcGVyc2lzdGVudCBkYXRhLCBhbmQgYW4gYWN0aW9uIGxpc3QgKHdoaWNoIGluY2x1ZGVzLCBmb3IgaW5zdGFuY2UsIG91dGJvdW5kIG1lc3NhZ2VzIHRvIGJlIHNlbnQpLiBUaGUgcHJvY2Vzc2luZyBwaGFzZSBtYXkgbGVhZCB0byB0aGUgY3JlYXRpb24gb2YgYSBuZXcgYWNjb3VudCAodW5pbml0aWFsaXplZCBvciBhY3RpdmUpLCBvciB0byB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgdW5pbml0aWFsaXplZCBvciBmcm96ZW4gYWNjb3VudC4gVGhlIGdhcyBwYXltZW50LCBlcXVhbCB0byB0aGUgcHJvZHVjdCBvZiB0aGUgZ2FzIHByaWNlIGFuZCB0aGUgZ2FzIGNvbnN1bWVkLCBpcyBleGFjdGVkIGZyb20gdGhlIGFjY291bnQgYmFsYW5jZS5cbklmIHRoZXJlIGlzIG5vIHJlYXNvbiB0byBza2lwIHRoZSBjb21wdXRpbmcgcGhhc2UsIFRWTSBpcyBpbnZva2VkIGFuZCB0aGUgcmVzdWx0cyBvZiB0aGUgY29tcHV0YXRpb24gYXJlIGxvZ2dlZC4gUG9zc2libGUgcGFyYW1ldGVycyBhcmUgY292ZXJlZCBiZWxvdy5gLFxuICAgICAgICAgICAgY29tcHV0ZV90eXBlOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfcmVhc29uOiBgUmVhc29uIGZvciBza2lwcGluZyB0aGUgY29tcHV0ZSBwaGFzZS4gQWNjb3JkaW5nIHRvIHRoZSBzcGVjaWZpY2F0aW9uLCB0aGUgcGhhc2UgY2FuIGJlIHNraXBwZWQgZHVlIHRvIHRoZSBhYnNlbmNlIG9mIGZ1bmRzIHRvIGJ1eSBnYXMsIGFic2VuY2Ugb2Ygc3RhdGUgb2YgYW4gYWNjb3VudCBvciBhIG1lc3NhZ2UsIGZhaWx1cmUgdG8gcHJvdmlkZSBhIHZhbGlkIHN0YXRlIGluIHRoZSBtZXNzYWdlYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBUaGlzIGZsYWcgaXMgc2V0IGlmIGFuZCBvbmx5IGlmIGV4aXRfY29kZSBpcyBlaXRoZXIgMCBvciAxLmAsXG4gICAgICAgICAgICBtc2dfc3RhdGVfdXNlZDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHdoZXRoZXIgdGhlIHN0YXRlIHBhc3NlZCBpbiB0aGUgbWVzc2FnZSBoYXMgYmVlbiB1c2VkLiBJZiBpdCBpcyBzZXQsIHRoZSBhY2NvdW50X2FjdGl2YXRlZCBmbGFnIGlzIHVzZWQgKHNlZSBiZWxvdylUaGlzIHBhcmFtZXRlciByZWZsZWN0cyB3aGV0aGVyIHRoZSBzdGF0ZSBwYXNzZWQgaW4gdGhlIG1lc3NhZ2UgaGFzIGJlZW4gdXNlZC4gSWYgaXQgaXMgc2V0LCB0aGUgYWNjb3VudF9hY3RpdmF0ZWQgZmxhZyBpcyB1c2VkIChzZWUgYmVsb3cpYCxcbiAgICAgICAgICAgIGFjY291bnRfYWN0aXZhdGVkOiBgVGhlIGZsYWcgcmVmbGVjdHMgd2hldGhlciB0aGlzIGhhcyByZXN1bHRlZCBpbiB0aGUgYWN0aXZhdGlvbiBvZiBhIHByZXZpb3VzbHkgZnJvemVuLCB1bmluaXRpYWxpemVkIG9yIG5vbi1leGlzdGVudCBhY2NvdW50LmAsXG4gICAgICAgICAgICBnYXNfZmVlczogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSB0b3RhbCBnYXMgZmVlcyBjb2xsZWN0ZWQgYnkgdGhlIHZhbGlkYXRvcnMgZm9yIGV4ZWN1dGluZyB0aGlzIHRyYW5zYWN0aW9uLiBJdCBtdXN0IGJlIGVxdWFsIHRvIHRoZSBwcm9kdWN0IG9mIGdhc191c2VkIGFuZCBnYXNfcHJpY2UgZnJvbSB0aGUgY3VycmVudCBibG9jayBoZWFkZXIuYCxcbiAgICAgICAgICAgIGdhc191c2VkOiBgYCxcbiAgICAgICAgICAgIGdhc19saW1pdDogYFRoaXMgcGFyYW1ldGVyIHJlZmxlY3RzIHRoZSBnYXMgbGltaXQgZm9yIHRoaXMgaW5zdGFuY2Ugb2YgVFZNLiBJdCBlcXVhbHMgdGhlIGxlc3NlciBvZiBlaXRoZXIgdGhlIEdyYW1zIGNyZWRpdGVkIGluIHRoZSBjcmVkaXQgcGhhc2UgZnJvbSB0aGUgdmFsdWUgb2YgdGhlIGluYm91bmQgbWVzc2FnZSBkaXZpZGVkIGJ5IHRoZSBjdXJyZW50IGdhcyBwcmljZSwgb3IgdGhlIGdsb2JhbCBwZXItdHJhbnNhY3Rpb24gZ2FzIGxpbWl0LmAsXG4gICAgICAgICAgICBnYXNfY3JlZGl0OiBgVGhpcyBwYXJhbWV0ZXIgbWF5IGJlIG5vbi16ZXJvIG9ubHkgZm9yIGV4dGVybmFsIGluYm91bmQgbWVzc2FnZXMuIEl0IGlzIHRoZSBsZXNzZXIgb2YgZWl0aGVyIHRoZSBhbW91bnQgb2YgZ2FzIHRoYXQgY2FuIGJlIHBhaWQgZnJvbSB0aGUgYWNjb3VudCBiYWxhbmNlIG9yIHRoZSBtYXhpbXVtIGdhcyBjcmVkaXRgLFxuICAgICAgICAgICAgbW9kZTogYGAsXG4gICAgICAgICAgICBleGl0X2NvZGU6IGBUaGVzZSBwYXJhbWV0ZXIgcmVwcmVzZW50cyB0aGUgc3RhdHVzIHZhbHVlcyByZXR1cm5lZCBieSBUVk07IGZvciBhIHN1Y2Nlc3NmdWwgdHJhbnNhY3Rpb24sIGV4aXRfY29kZSBoYXMgdG8gYmUgMCBvciAxYCxcbiAgICAgICAgICAgIGV4aXRfYXJnOiBgYCxcbiAgICAgICAgICAgIHZtX3N0ZXBzOiBgdGhlIHRvdGFsIG51bWJlciBvZiBzdGVwcyBwZXJmb3JtZWQgYnkgVFZNICh1c3VhbGx5IGVxdWFsIHRvIHR3byBwbHVzIHRoZSBudW1iZXIgb2YgaW5zdHJ1Y3Rpb25zIGV4ZWN1dGVkLCBpbmNsdWRpbmcgaW1wbGljaXQgUkVUcylgLFxuICAgICAgICAgICAgdm1faW5pdF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgb3JpZ2luYWwgc3RhdGUgb2YgVFZNLmAsXG4gICAgICAgICAgICB2bV9maW5hbF9zdGF0ZV9oYXNoOiBgVGhpcyBwYXJhbWV0ZXIgaXMgdGhlIHJlcHJlc2VudGF0aW9uIGhhc2hlcyBvZiB0aGUgcmVzdWx0aW5nIHN0YXRlIG9mIFRWTS5gLFxuICAgICAgICB9LFxuICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgIF9kb2M6IGBJZiB0aGUgc21hcnQgY29udHJhY3QgaGFzIHRlcm1pbmF0ZWQgc3VjY2Vzc2Z1bGx5ICh3aXRoIGV4aXQgY29kZSAwIG9yIDEpLCB0aGUgYWN0aW9ucyBmcm9tIHRoZSBsaXN0IGFyZSBwZXJmb3JtZWQuIElmIGl0IGlzIGltcG9zc2libGUgdG8gcGVyZm9ybSBhbGwgb2YgdGhlbeKAlGZvciBleGFtcGxlLCBiZWNhdXNlIG9mIGluc3VmZmljaWVudCBmdW5kcyB0byB0cmFuc2ZlciB3aXRoIGFuIG91dGJvdW5kIG1lc3NhZ2XigJR0aGVuIHRoZSB0cmFuc2FjdGlvbiBpcyBhYm9ydGVkIGFuZCB0aGUgYWNjb3VudCBzdGF0ZSBpcyByb2xsZWQgYmFjay4gVGhlIHRyYW5zYWN0aW9uIGlzIGFsc28gYWJvcnRlZCBpZiB0aGUgc21hcnQgY29udHJhY3QgZGlkIG5vdCB0ZXJtaW5hdGUgc3VjY2Vzc2Z1bGx5LCBvciBpZiBpdCB3YXMgbm90IHBvc3NpYmxlIHRvIGludm9rZSB0aGUgc21hcnQgY29udHJhY3QgYXQgYWxsIGJlY2F1c2UgaXQgaXMgdW5pbml0aWFsaXplZCBvciBmcm96ZW4uYCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGBgLFxuICAgICAgICAgICAgdmFsaWQ6IGBgLFxuICAgICAgICAgICAgbm9fZnVuZHM6IGBUaGUgZmxhZyBpbmRpY2F0ZXMgYWJzZW5jZSBvZiBmdW5kcyByZXF1aXJlZCB0byBjcmVhdGUgYW4gb3V0Ym91bmQgbWVzc2FnZWAsXG4gICAgICAgICAgICBzdGF0dXNfY2hhbmdlOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2Z3ZF9mZWVzOiBgYCxcbiAgICAgICAgICAgIHRvdGFsX2FjdGlvbl9mZWVzOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9jb2RlOiBgYCxcbiAgICAgICAgICAgIHJlc3VsdF9hcmc6IGBgLFxuICAgICAgICAgICAgdG90X2FjdGlvbnM6IGBgLFxuICAgICAgICAgICAgc3BlY19hY3Rpb25zOiBgYCxcbiAgICAgICAgICAgIHNraXBwZWRfYWN0aW9uczogYGAsXG4gICAgICAgICAgICBtc2dzX2NyZWF0ZWQ6IGBgLFxuICAgICAgICAgICAgYWN0aW9uX2xpc3RfaGFzaDogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9jZWxsczogYGAsXG4gICAgICAgICAgICB0b3RhbF9tc2dfc2l6ZV9iaXRzOiBgYCxcbiAgICAgICAgfSxcbiAgICAgICAgYm91bmNlOiB7XG4gICAgICAgICAgICBfZG9jOiBgSWYgdGhlIHRyYW5zYWN0aW9uIGhhcyBiZWVuIGFib3J0ZWQsIGFuZCB0aGUgaW5ib3VuZCBtZXNzYWdlIGhhcyBpdHMgYm91bmNlIGZsYWcgc2V0LCB0aGVuIGl0IGlzIOKAnGJvdW5jZWTigJ0gYnkgYXV0b21hdGljYWxseSBnZW5lcmF0aW5nIGFuIG91dGJvdW5kIG1lc3NhZ2UgKHdpdGggdGhlIGJvdW5jZSBmbGFnIGNsZWFyKSB0byBpdHMgb3JpZ2luYWwgc2VuZGVyLiBBbG1vc3QgYWxsIHZhbHVlIG9mIHRoZSBvcmlnaW5hbCBpbmJvdW5kIG1lc3NhZ2UgKG1pbnVzIGdhcyBwYXltZW50cyBhbmQgZm9yd2FyZGluZyBmZWVzKSBpcyB0cmFuc2ZlcnJlZCB0byB0aGUgZ2VuZXJhdGVkIG1lc3NhZ2UsIHdoaWNoIG90aGVyd2lzZSBoYXMgYW4gZW1wdHkgYm9keS5gLFxuICAgICAgICAgICAgYm91bmNlX3R5cGU6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfY2VsbHM6IGBgLFxuICAgICAgICAgICAgbXNnX3NpemVfYml0czogYGAsXG4gICAgICAgICAgICByZXFfZndkX2ZlZXM6IGBgLFxuICAgICAgICAgICAgbXNnX2ZlZXM6IGBgLFxuICAgICAgICAgICAgZndkX2ZlZXM6IGBgLFxuICAgICAgICB9LFxuICAgICAgICBhYm9ydGVkOiBgYCxcbiAgICAgICAgZGVzdHJveWVkOiBgYCxcbiAgICAgICAgdHQ6IGBgLFxuICAgICAgICBzcGxpdF9pbmZvOiB7XG4gICAgICAgICAgICBfZG9jOiBgVGhlIGZpZWxkcyBiZWxvdyBjb3ZlciBzcGxpdCBwcmVwYXJlIGFuZCBpbnN0YWxsIHRyYW5zYWN0aW9ucyBhbmQgbWVyZ2UgcHJlcGFyZSBhbmQgaW5zdGFsbCB0cmFuc2FjdGlvbnMsIHRoZSBmaWVsZHMgY29ycmVzcG9uZCB0byB0aGUgcmVsZXZhbnQgc2NoZW1lcyBjb3ZlcmVkIGJ5IHRoZSBibG9ja2NoYWluIHNwZWNpZmljYXRpb24uYCxcbiAgICAgICAgICAgIGN1cl9zaGFyZF9wZnhfbGVuOiBgbGVuZ3RoIG9mIHRoZSBjdXJyZW50IHNoYXJkIHByZWZpeGAsXG4gICAgICAgICAgICBhY2Nfc3BsaXRfZGVwdGg6IGBgLFxuICAgICAgICAgICAgdGhpc19hZGRyOiBgYCxcbiAgICAgICAgICAgIHNpYmxpbmdfYWRkcjogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIHByZXBhcmVfdHJhbnNhY3Rpb246IGBgLFxuICAgICAgICBpbnN0YWxsZWQ6IGBgLFxuICAgICAgICBwcm9vZjogYGAsXG4gICAgICAgIGJvYzogYGAsXG4gICAgfSxcblxuICAgIHNoYXJkRGVzY3I6IHtcbiAgICAgICAgX2RvYzogYFNoYXJkSGFzaGVzIGlzIHJlcHJlc2VudGVkIGJ5IGEgZGljdGlvbmFyeSB3aXRoIDMyLWJpdCB3b3JrY2hhaW5faWRzIGFzIGtleXMsIGFuZCDigJxzaGFyZCBiaW5hcnkgdHJlZXPigJ0sIHJlcHJlc2VudGVkIGJ5IFRMLUIgdHlwZSBCaW5UcmVlIFNoYXJkRGVzY3IsIGFzIHZhbHVlcy4gRWFjaCBsZWFmIG9mIHRoaXMgc2hhcmQgYmluYXJ5IHRyZWUgY29udGFpbnMgYSB2YWx1ZSBvZiB0eXBlIFNoYXJkRGVzY3IsIHdoaWNoIGRlc2NyaWJlcyBhIHNpbmdsZSBzaGFyZCBieSBpbmRpY2F0aW5nIHRoZSBzZXF1ZW5jZSBudW1iZXIgc2VxX25vLCB0aGUgbG9naWNhbCB0aW1lIGx0LCBhbmQgdGhlIGhhc2ggaGFzaCBvZiB0aGUgbGF0ZXN0IChzaWduZWQpIGJsb2NrIG9mIHRoZSBjb3JyZXNwb25kaW5nIHNoYXJkY2hhaW4uYCxcbiAgICAgICAgc2VxX25vOiBgdWludDMyIHNlcXVlbmNlIG51bWJlcmAsXG4gICAgICAgIHJlZ19tY19zZXFubzogYFJldHVybnMgbGFzdCBrbm93biBtYXN0ZXIgYmxvY2sgYXQgdGhlIHRpbWUgb2Ygc2hhcmQgZ2VuZXJhdGlvbi5gLFxuICAgICAgICBzdGFydF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBzdGFydGAsXG4gICAgICAgIGVuZF9sdDogYExvZ2ljYWwgdGltZSBvZiB0aGUgc2hhcmRjaGFpbiBlbmRgLFxuICAgICAgICByb290X2hhc2g6IGBSZXR1cm5zIGxhc3Qga25vd24gbWFzdGVyIGJsb2NrIGF0IHRoZSB0aW1lIG9mIHNoYXJkIGdlbmVyYXRpb24uIFRoZSBzaGFyZCBibG9jayBjb25maWd1cmF0aW9uIGlzIGRlcml2ZWQgZnJvbSB0aGF0IGJsb2NrLmAsXG4gICAgICAgIGZpbGVfaGFzaDogYFNoYXJkIGJsb2NrIGZpbGUgaGFzaC5gLFxuICAgICAgICBiZWZvcmVfc3BsaXQ6IGBUT04gQmxvY2tjaGFpbiBzdXBwb3J0cyBkeW5hbWljIHNoYXJkaW5nLCBzbyB0aGUgc2hhcmQgY29uZmlndXJhdGlvbiBtYXkgY2hhbmdlIGZyb20gYmxvY2sgdG8gYmxvY2sgYmVjYXVzZSBvZiBzaGFyZCBtZXJnZSBhbmQgc3BsaXQgZXZlbnRzLiBUaGVyZWZvcmUsIHdlIGNhbm5vdCBzaW1wbHkgc2F5IHRoYXQgZWFjaCBzaGFyZGNoYWluIGNvcnJlc3BvbmRzIHRvIGEgZml4ZWQgc2V0IG9mIGFjY291bnQgY2hhaW5zLlxuQSBzaGFyZGNoYWluIGJsb2NrIGFuZCBpdHMgc3RhdGUgbWF5IGVhY2ggYmUgY2xhc3NpZmllZCBpbnRvIHR3byBkaXN0aW5jdCBwYXJ0cy4gVGhlIHBhcnRzIHdpdGggdGhlIElTUC1kaWN0YXRlZCBmb3JtIG9mIHdpbGwgYmUgY2FsbGVkIHRoZSBzcGxpdCBwYXJ0cyBvZiB0aGUgYmxvY2sgYW5kIGl0cyBzdGF0ZSwgd2hpbGUgdGhlIHJlbWFpbmRlciB3aWxsIGJlIGNhbGxlZCB0aGUgbm9uLXNwbGl0IHBhcnRzLlxuVGhlIG1hc3RlcmNoYWluIGNhbm5vdCBiZSBzcGxpdCBvciBtZXJnZWQuYCxcbiAgICAgICAgYmVmb3JlX21lcmdlOiBgYCxcbiAgICAgICAgd2FudF9zcGxpdDogYGAsXG4gICAgICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgICAgICBueF9jY191cGRhdGVkOiBgYCxcbiAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICBuZXh0X2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICAgICAgbmV4dF92YWxpZGF0b3Jfc2hhcmQ6IGBgLFxuICAgICAgICBtaW5fcmVmX21jX3NlcW5vOiBgYCxcbiAgICAgICAgZ2VuX3V0aW1lOiBgR2VuZXJhdGlvbiB0aW1lIGluIHVpbnQzMmAsXG4gICAgICAgIHNwbGl0X3R5cGU6IGBgLFxuICAgICAgICBzcGxpdDogYGAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOmBBbW91bnQgb2YgZmVlcyBjb2xsZWN0ZWQgaW50IGhpcyBzaGFyZCBpbiBncmFtcy5gLFxuICAgICAgICBmZWVzX2NvbGxlY3RlZF9vdGhlcjogYEFtb3VudCBvZiBmZWVzIGNvbGxlY3RlZCBpbnQgaGlzIHNoYXJkIGluIG5vbiBncmFtIGN1cnJlbmNpZXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZDogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gZ3JhbXMuYCxcbiAgICAgICAgZnVuZHNfY3JlYXRlZF9vdGhlcjogYEFtb3VudCBvZiBmdW5kcyBjcmVhdGVkIGluIHRoaXMgc2hhcmQgaW4gbm9uIGdyYW0gY3VycmVuY2llcy5gLFxuICAgIH0sXG5cbiAgICBibG9jazoge1xuICAgIF9kb2M6ICdUaGlzIGlzIEJsb2NrJyxcbiAgICBzdGF0dXM6IGBSZXR1cm5zIGJsb2NrIHByb2Nlc3Npbmcgc3RhdHVzYCxcbiAgICBnbG9iYWxfaWQ6IGB1aW50MzIgZ2xvYmFsIGJsb2NrIElEYCxcbiAgICB3YW50X3NwbGl0OiBgYCxcbiAgICBzZXFfbm86IGBgLFxuICAgIGFmdGVyX21lcmdlOiBgYCxcbiAgICBnZW5fdXRpbWU6IGB1aW50IDMyIGdlbmVyYXRpb24gdGltZSBzdGFtcGAsXG4gICAgZ2VuX2NhdGNoYWluX3NlcW5vOiBgYCxcbiAgICBmbGFnczogYGAsXG4gICAgbWFzdGVyX3JlZjogYGAsXG4gICAgcHJldl9yZWY6IGBFeHRlcm5hbCBibG9jayByZWZlcmVuY2UgZm9yIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgcHJldl9hbHRfcmVmOiBgRXh0ZXJuYWwgYmxvY2sgcmVmZXJlbmNlIGZvciBwcmV2aW91cyBibG9jayBpbiBjYXNlIG9mIHNoYXJkIG1lcmdlLmAsXG4gICAgcHJldl92ZXJ0X3JlZjogYEV4dGVybmFsIGJsb2NrIHJlZmVyZW5jZSBmb3IgcHJldmlvdXMgYmxvY2sgaW4gY2FzZSBvZiB2ZXJ0aWNhbCBibG9ja3MuYCxcbiAgICBwcmV2X3ZlcnRfYWx0X3JlZjogYGAsXG4gICAgdmVyc2lvbjogYHVpbjMyIGJsb2NrIHZlcnNpb24gaWRlbnRpZmllcmAsXG4gICAgZ2VuX3ZhbGlkYXRvcl9saXN0X2hhc2hfc2hvcnQ6IGBgLFxuICAgIGJlZm9yZV9zcGxpdDogYGAsXG4gICAgYWZ0ZXJfc3BsaXQ6IGBgLFxuICAgIHdhbnRfbWVyZ2U6IGBgLFxuICAgIHZlcnRfc2VxX25vOiBgYCxcbiAgICBzdGFydF9sdDogYExvZ2ljYWwgY3JlYXRpb24gdGltZSBhdXRvbWF0aWNhbGx5IHNldCBieSB0aGUgYmxvY2sgZm9ybWF0aW9uIHN0YXJ0LlxuTG9naWNhbCB0aW1lIGlzIGEgY29tcG9uZW50IG9mIHRoZSBUT04gQmxvY2tjaGFpbiB0aGF0IGFsc28gcGxheXMgYW4gaW1wb3J0YW50IHJvbGUgaW4gbWVzc2FnZSBkZWxpdmVyeSBpcyB0aGUgbG9naWNhbCB0aW1lLCB1c3VhbGx5IGRlbm90ZWQgYnkgTHQuIEl0IGlzIGEgbm9uLW5lZ2F0aXZlIDY0LWJpdCBpbnRlZ2VyLCBhc3NpZ25lZCB0byBjZXJ0YWluIGV2ZW50cy4gRm9yIG1vcmUgZGV0YWlscywgc2VlIHRoZSBUT04gYmxvY2tjaGFpbiBzcGVjaWZpY2F0aW9uYCxcbiAgICBlbmRfbHQ6IGBMb2dpY2FsIGNyZWF0aW9uIHRpbWUgYXV0b21hdGljYWxseSBzZXQgYnkgdGhlIGJsb2NrIGZvcm1hdGlvbiBlbmQuYCxcbiAgICB3b3JrY2hhaW5faWQ6IGB1aW50MzIgd29ya2NoYWluIGlkZW50aWZpZXJgLFxuICAgIHNoYXJkOiBgYCxcbiAgICBtaW5fcmVmX21jX3NlcW5vOiBgUmV0dXJucyBsYXN0IGtub3duIG1hc3RlciBibG9jayBhdCB0aGUgdGltZSBvZiBzaGFyZCBnZW5lcmF0aW9uLmAsXG4gICAgdmFsdWVfZmxvdzoge1xuICAgICAgICB0b19uZXh0X2JsazogYEFtb3VudCBvZiBncmFtcyBhbW91bnQgdG8gdGhlIG5leHQgYmxvY2suYCxcbiAgICAgICAgdG9fbmV4dF9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0byB0aGUgbmV4dCBibG9jay5gLFxuICAgICAgICBleHBvcnRlZDogYEFtb3VudCBvZiBncmFtcyBleHBvcnRlZC5gLFxuICAgICAgICBleHBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBjcnlwdG9jdXJyZW5jaWVzIGV4cG9ydGVkLmAsXG4gICAgICAgIGZlZXNfY29sbGVjdGVkOiBgYCxcbiAgICAgICAgZmVlc19jb2xsZWN0ZWRfb3RoZXI6IGBgLFxuICAgICAgICBjcmVhdGVkOiBgYCxcbiAgICAgICAgY3JlYXRlZF9vdGhlcjogYGAsXG4gICAgICAgIGltcG9ydGVkOiBgQW1vdW50IG9mIGdyYW1zIGltcG9ydGVkLmAsXG4gICAgICAgIGltcG9ydGVkX290aGVyOiBgQW1vdW50IG9mIG5vbiBncmFtIGNyeXB0b2N1cnJlbmNpZXMgaW1wb3J0ZWQuYCxcbiAgICAgICAgZnJvbV9wcmV2X2JsazogYEFtb3VudCBvZiBncmFtcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgIGZyb21fcHJldl9ibGtfb3RoZXI6IGBBbW91bnQgb2Ygbm9uIGdyYW0gY3J5cHRvY3VycmVuY2llcyB0cmFuc2ZlcnJlZCBmcm9tIHByZXZpb3VzIGJsb2NrLmAsXG4gICAgICAgIG1pbnRlZDogYEFtb3VudCBvZiBncmFtcyBtaW50ZWQgaW4gdGhpcyBibG9jay5gLFxuICAgICAgICBtaW50ZWRfb3RoZXI6IGBgLFxuICAgICAgICBmZWVzX2ltcG9ydGVkOiBgQW1vdW50IG9mIGltcG9ydCBmZWVzIGluIGdyYW1zYCxcbiAgICAgICAgZmVlc19pbXBvcnRlZF9vdGhlcjogYEFtb3VudCBvZiBpbXBvcnQgZmVlcyBpbiBub24gZ3JhbSBjdXJyZW5jaWVzLmAsXG4gICAgfSxcbiAgICBpbl9tc2dfZGVzY3I6IGBgLFxuICAgIHJhbmRfc2VlZDogYGAsXG4gICAgb3V0X21zZ19kZXNjcjogYGAsXG4gICAgYWNjb3VudF9ibG9ja3M6IHtcbiAgICAgICAgYWNjb3VudF9hZGRyOiBgYCxcbiAgICAgICAgdHJhbnNhY3Rpb25zOiBgYCxcbiAgICAgICAgc3RhdGVfdXBkYXRlOiB7XG4gICAgICAgICAgICBvbGRfaGFzaDogYG9sZCB2ZXJzaW9uIG9mIGJsb2NrIGhhc2hlc2AsXG4gICAgICAgICAgICBuZXdfaGFzaDogYG5ldyB2ZXJzaW9uIG9mIGJsb2NrIGhhc2hlc2BcbiAgICAgICAgfSxcbiAgICAgICAgdHJfY291bnQ6IGBgXG4gICAgfSxcbiAgICBzdGF0ZV91cGRhdGU6IHtcbiAgICAgICAgbmV3OiBgYCxcbiAgICAgICAgbmV3X2hhc2g6IGBgLFxuICAgICAgICBuZXdfZGVwdGg6IGBgLFxuICAgICAgICBvbGQ6IGBgLFxuICAgICAgICBvbGRfaGFzaDogYGAsXG4gICAgICAgIG9sZF9kZXB0aDogYGBcbiAgICB9LFxuICAgIG1hc3Rlcjoge1xuICAgICAgICBzaGFyZF9oYXNoZXM6IHtcbiAgICAgICAgICAgIF9kb2M6IGBBcnJheSBvZiBzaGFyZCBoYXNoZXNgLFxuICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgVWludDMyIHdvcmtjaGFpbiBJRGAsXG4gICAgICAgICAgICBzaGFyZDogYFNoYXJkIElEYCxcbiAgICAgICAgICAgIGRlc2NyOiBgU2hhcmQgZGVzY3JpcHRpb25gLFxuICAgICAgICB9LFxuICAgICAgICBzaGFyZF9mZWVzOiB7XG4gICAgICAgICAgICB3b3JrY2hhaW5faWQ6IGBgLFxuICAgICAgICAgICAgc2hhcmQ6IGBgLFxuICAgICAgICAgICAgZmVlczogYEFtb3VudCBvZiBmZWVzIGluIGdyYW1zYCxcbiAgICAgICAgICAgIGZlZXNfb3RoZXI6IGBBcnJheSBvZiBmZWVzIGluIG5vbiBncmFtIGNyeXB0byBjdXJyZW5jaWVzYCxcbiAgICAgICAgICAgIGNyZWF0ZTogYEFtb3VudCBvZiBmZWVzIGNyZWF0ZWQgZHVyaW5nIHNoYXJkYCxcbiAgICAgICAgICAgIGNyZWF0ZV9vdGhlcjogYEFtb3VudCBvZiBub24gZ3JhbSBmZWVzIGNyZWF0ZWQgaW4gbm9uIGdyYW0gY3J5cHRvIGN1cnJlbmNpZXMgZHVyaW5nIHRoZSBibG9jay5gLFxuICAgICAgICB9LFxuICAgICAgICByZWNvdmVyX2NyZWF0ZV9tc2c6IGBgLFxuICAgICAgICBwcmV2X2Jsa19zaWduYXR1cmVzOiB7XG4gICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgcHJldmlvdXMgYmxvY2sgc2lnbmF0dXJlc2AsXG4gICAgICAgICAgICBub2RlX2lkOiBgYCxcbiAgICAgICAgICAgIHI6IGBgLFxuICAgICAgICAgICAgczogYGAsXG4gICAgICAgIH0sXG4gICAgICAgIGNvbmZpZ19hZGRyOiBgYCxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICBwMDogYEFkZHJlc3Mgb2YgY29uZmlnIHNtYXJ0IGNvbnRyYWN0IGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMTogYEFkZHJlc3Mgb2YgZWxlY3RvciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDI6IGBBZGRyZXNzIG9mIG1pbnRlciBzbWFydCBjb250cmFjdCBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDM6IGBBZGRyZXNzIG9mIGZlZSBjb2xsZWN0b3Igc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHA0OiBgQWRkcmVzcyBvZiBUT04gRE5TIHJvb3Qgc21hcnQgY29udHJhY3QgaW4gdGhlIG1hc3RlcmNoYWluYCxcbiAgICAgICAgICAgIHA2OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbmZpZ3VyYXRpb24gcGFyYW1ldGVyIDZgLFxuICAgICAgICAgICAgICAgIG1pbnRfbmV3X3ByaWNlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW50X2FkZF9wcmljZTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQ29uZmlndXJhdGlvbiBwYXJhbWV0ZXIgN2AsXG4gICAgICAgICAgICAgICAgY3VycmVuY3k6IGBgLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwODoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBHbG9iYWwgdmVyc2lvbmAsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogYGAsXG4gICAgICAgICAgICAgICAgY2FwYWJpbGl0aWVzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwOTogYE1hbmRhdG9yeSBwYXJhbXNgLFxuICAgICAgICAgICAgcDEyOiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYEFycmF5IG9mIGFsbCB3b3JrY2hhaW5zIGRlc2NyaXB0aW9uc2AsXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX2lkOiBgYCxcbiAgICAgICAgICAgICAgICBlbmFibGVkX3NpbmNlOiBgYCxcbiAgICAgICAgICAgICAgICBhY3R1YWxfbWluX3NwbGl0OiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fc3BsaXQ6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9zcGxpdDogYGAsXG4gICAgICAgICAgICAgICAgYWN0aXZlOiBgYCxcbiAgICAgICAgICAgICAgICBhY2NlcHRfbXNnczogYGAsXG4gICAgICAgICAgICAgICAgZmxhZ3M6IGBgLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9yb290X2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgIHplcm9zdGF0ZV9maWxlX2hhc2g6IGBgLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGBgLFxuICAgICAgICAgICAgICAgIGJhc2ljOiBgYCxcbiAgICAgICAgICAgICAgICB2bV92ZXJzaW9uOiBgYCxcbiAgICAgICAgICAgICAgICB2bV9tb2RlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fYWRkcl9sZW46IGBgLFxuICAgICAgICAgICAgICAgIG1heF9hZGRyX2xlbjogYGAsXG4gICAgICAgICAgICAgICAgYWRkcl9sZW5fc3RlcDogYGAsXG4gICAgICAgICAgICAgICAgd29ya2NoYWluX3R5cGVfaWQ6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAxNDoge1xuICAgICAgICAgICAgICAgIF9kb2M6IGBCbG9jayBjcmVhdGUgZmVlc2AsXG4gICAgICAgICAgICAgICAgbWFzdGVyY2hhaW5fYmxvY2tfZmVlOiBgYCxcbiAgICAgICAgICAgICAgICBiYXNlY2hhaW5fYmxvY2tfZmVlOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTU6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgRWxlY3Rpb24gcGFyYW1ldGVyc2AsXG4gICAgICAgICAgICAgICAgdmFsaWRhdG9yc19lbGVjdGVkX2ZvcjogYGAsXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX3N0YXJ0X2JlZm9yZTogYGAsXG4gICAgICAgICAgICAgICAgZWxlY3Rpb25zX2VuZF9iZWZvcmU6IGBgLFxuICAgICAgICAgICAgICAgIHN0YWtlX2hlbGRfZm9yOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTY6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9ycyBjb3VudGAsXG4gICAgICAgICAgICAgICAgbWF4X3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9tYWluX3ZhbGlkYXRvcnM6IGBgLFxuICAgICAgICAgICAgICAgIG1pbl92YWxpZGF0b3JzOiBgYCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwMTc6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgVmFsaWRhdG9yIHN0YWtlIHBhcmFtZXRlcnNgLFxuICAgICAgICAgICAgICAgIG1pbl9zdGFrZTogYGAsXG4gICAgICAgICAgICAgICAgbWF4X3N0YWtlOiBgYCxcbiAgICAgICAgICAgICAgICBtaW5fdG90YWxfc3Rha2U6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9zdGFrZV9mYWN0b3I6IGBgXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDE4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYFN0b3JhZ2UgcHJpY2VzYCxcbiAgICAgICAgICAgICAgICB1dGltZV9zaW5jZTogYGAsXG4gICAgICAgICAgICAgICAgYml0X3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICBjZWxsX3ByaWNlX3BzOiBgYCxcbiAgICAgICAgICAgICAgICBtY19iaXRfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1jX2NlbGxfcHJpY2VfcHM6IGBgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAyMDogYEdhcyBsaW1pdHMgYW5kIHByaWNlcyBpbiB0aGUgbWFzdGVyY2hhaW5gLFxuICAgICAgICAgICAgcDIxOiBgR2FzIGxpbWl0cyBhbmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgcDIyOiBgQmxvY2sgbGltaXRzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjM6IGBCbG9jayBsaW1pdHMgaW4gd29ya2NoYWluc2AsXG4gICAgICAgICAgICBwMjQ6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHRoZSBtYXN0ZXJjaGFpbmAsXG4gICAgICAgICAgICBwMjU6IGBNZXNzYWdlIGZvcndhcmQgcHJpY2VzIGluIHdvcmtjaGFpbnNgLFxuICAgICAgICAgICAgcDI4OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENhdGNoYWluIGNvbmZpZ2AsXG4gICAgICAgICAgICAgICAgbWNfY2F0Y2hhaW5fbGlmZXRpbWU6IGBgLFxuICAgICAgICAgICAgICAgIHNoYXJkX2NhdGNoYWluX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX2xpZmV0aW1lOiBgYCxcbiAgICAgICAgICAgICAgICBzaGFyZF92YWxpZGF0b3JzX251bTogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcDI5OiB7XG4gICAgICAgICAgICAgICAgX2RvYzogYENvbnNlbnN1cyBjb25maWdgLFxuICAgICAgICAgICAgICAgIHJvdW5kX2NhbmRpZGF0ZXM6IGBgLFxuICAgICAgICAgICAgICAgIG5leHRfY2FuZGlkYXRlX2RlbGF5X21zOiBgYCxcbiAgICAgICAgICAgICAgICBjb25zZW5zdXNfdGltZW91dF9tczogYGAsXG4gICAgICAgICAgICAgICAgZmFzdF9hdHRlbXB0czogYGAsXG4gICAgICAgICAgICAgICAgYXR0ZW1wdF9kdXJhdGlvbjogYGAsXG4gICAgICAgICAgICAgICAgY2F0Y2hhaW5fbWF4X2RlcHM6IGBgLFxuICAgICAgICAgICAgICAgIG1heF9ibG9ja19ieXRlczogYGAsXG4gICAgICAgICAgICAgICAgbWF4X2NvbGxhdGVkX2J5dGVzOiBgYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHAzMTogYEFycmF5IG9mIGZ1bmRhbWVudGFsIHNtYXJ0IGNvbnRyYWN0cyBhZGRyZXNzZXNgLFxuICAgICAgICAgICAgcDMyOiBgUHJldmlvdXMgdmFsaWRhdG9ycyBzZXRgLFxuICAgICAgICAgICAgcDMzOiBgUHJldmlvdXMgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzQ6IGBDdXJyZW50IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNTogYEN1cnJlbnQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzY6IGBOZXh0IHZhbGlkYXRvcnMgc2V0YCxcbiAgICAgICAgICAgIHAzNzogYE5leHQgdGVtcHJvcmFyeSB2YWxpZGF0b3JzIHNldGAsXG4gICAgICAgICAgICBwMzk6IHtcbiAgICAgICAgICAgICAgICBfZG9jOiBgQXJyYXkgb2YgdmFsaWRhdG9yIHNpZ25lZCB0ZW1wcm9yYXJ5IGtleXNgLFxuICAgICAgICAgICAgICAgIGFkbmxfYWRkcjogYGAsXG4gICAgICAgICAgICAgICAgdGVtcF9wdWJsaWNfa2V5OiBgYCxcbiAgICAgICAgICAgICAgICBzZXFubzogYGAsXG4gICAgICAgICAgICAgICAgdmFsaWRfdW50aWw6IGBgLFxuICAgICAgICAgICAgICAgIHNpZ25hdHVyZV9yOiBgYCxcbiAgICAgICAgICAgICAgICBzaWduYXR1cmVfczogYGAsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfSxcbn1cbn07XG4iXX0=