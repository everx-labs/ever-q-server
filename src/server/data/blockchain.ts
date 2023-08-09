/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

import { Counterparty } from "../graphql/counterparties"
import type { QDataOptions } from "./data"
import QData from "./data"
import { QDataCollection } from "./collection"
import {
    Account,
    Block,
    BlockSignatures,
    Message,
    Transaction,
    Zerostate,
} from "../graphql/resolvers-generated"
import { QDataProvider, QIndexInfo, indexInfo } from "./data-provider"
import { QType } from "../filter/filters"
import { required, toU64String } from "../utils"
import { QRequestContext } from "../request"
import { Latency, LatencyCache } from "./latency"

export const INDEXES: { [name: string]: { indexes: QIndexInfo[] } } = {
    blocks: {
        indexes: [
            indexInfo("seq_no, gen_utime"),
            indexInfo("gen_utime"),
            indexInfo("workchain_id, shard, seq_no"),
            indexInfo("workchain_id, shard, gen_utime"),
            indexInfo("workchain_id, seq_no"),
            indexInfo("workchain_id, key_block, seq_no"),
            indexInfo("workchain_id, gen_utime"),
            indexInfo("workchain_id, tr_count, gen_utime"),
            indexInfo("master.min_shard_gen_utime", { sparse: true }),
            indexInfo("prev_ref.root_hash, _key"),
            indexInfo("prev_alt_ref.root_hash, _key"),
            indexInfo("tr_count, gen_utime"),
            indexInfo("chain_order"),
            indexInfo("key_block, chain_order"),
            indexInfo("workchain_id, chain_order"),
            indexInfo("workchain_id, shard, chain_order"),
        ],
    },
    accounts: {
        indexes: [
            indexInfo("last_trans_lt"),
            indexInfo("balance, _key"),
            indexInfo("code_hash, _key"),
            indexInfo("code_hash, balance"),
            indexInfo("last_paid"),
            indexInfo("acc_type"),
            indexInfo("init_code_hash, _key", {
                name: "idx_init_code_hash_key",
            }),
            indexInfo("prev_code_hash, _key", {
                name: "idx_prev_code_hash_key",
            }),
        ],
    },
    messages: {
        indexes: [
            indexInfo("block_id"),
            indexInfo("value, created_at"),
            indexInfo("src, value, created_at"),
            indexInfo("dst, value, created_at"),
            indexInfo("src, created_at"),
            indexInfo("dst, created_at"),
            indexInfo("created_lt"),
            indexInfo("msg_type, created_at"),
            indexInfo("created_at"),
            indexInfo("code_hash, created_at"),
            indexInfo("code_hash, last_paid"),
            indexInfo("src, dst, created_at", {
                name: "idx_src_dst_created_at",
                storedValues: "value",
            }),
            indexInfo("status, src, created_at, bounced, value"),
            indexInfo("dst, msg_type, created_at, created_lt"),
            indexInfo("src, msg_type, created_at, created_lt"),
            indexInfo("src, dst, value, created_at, created_lt"),
            indexInfo("src, value, msg_type, created_at, created_lt"),
            indexInfo("dst, value, msg_type, created_at, created_lt"),
            indexInfo("src, dst, created_at, created_lt"),
            indexInfo("src, body_hash, created_at, created_lt"),
            indexInfo("chain_order"),
            indexInfo("dst_chain_order"),
            indexInfo("src_chain_order"),
            indexInfo("msg_type, dst_chain_order"),
            indexInfo("msg_type, src_chain_order"),
            indexInfo("dst, dst_chain_order"),
            indexInfo("dst, msg_type, dst_chain_order"),
            indexInfo("dst, msg_type, src, dst_chain_order"),
            indexInfo("src, src_chain_order"),
            indexInfo("src, msg_type, src_chain_order"),
            indexInfo("src, msg_type, dst, src_chain_order"),
            indexInfo("src, dst, msg_type, created_at, value, status"),
        ],
    },
    transactions: {
        indexes: [
            indexInfo("block_id"),
            indexInfo("in_msg"),
            indexInfo("out_msgs[*]"),
            indexInfo("account_addr, now"),
            indexInfo("now, _key", {
                name: "idx_now_key",
                storedValues: "orig_status, end_status",
            }),
            indexInfo("lt"),
            indexInfo("account_addr, orig_status, end_status"),
            indexInfo("now, account_addr, lt"),
            indexInfo("workchain_id, now"),
            indexInfo("block_id, tr_type, outmsg_cnt, now, lt"),
            indexInfo("tr_type, now, lt"),
            indexInfo(
                "account_addr, orig_status, end_status, action.spec_action",
            ),
            indexInfo("account_addr, balance_delta, now, lt"),
            indexInfo("account_addr, lt, now"),
            indexInfo("block_id, lt"),
            indexInfo("balance_delta, now"),
            indexInfo("chain_order"),
            indexInfo("account_addr, chain_order"),
            indexInfo("workchain_id, chain_order"),
            indexInfo("account_addr, aborted, chain_order"),
        ],
    },
    blocks_signatures: {
        indexes: [
            indexInfo("signatures[*].node_id, gen_utime"),
            indexInfo("gen_utime"),
        ],
    },
    zerostates: {
        indexes: [],
    },
    counterparties: {
        indexes: [],
    },
}

Object.values(INDEXES).forEach((collection: { indexes: QIndexInfo[] }) => {
    collection.indexes = collection.indexes.concat({ fields: ["_key"] })
})

type ChainRangesVerificationSummary = {
    reliable_chain_order_upper_boundary?: string | null
}

export type ReliableChainOrderUpperBoundary = {
    boundary: string
    lastCheckTime: number
}

export default class QBlockchainData extends QData {
    accounts: QDataCollection
    blocks: QDataCollection
    blocks_signatures: QDataCollection
    transactions: QDataCollection
    messages: QDataCollection
    zerostates: QDataCollection
    counterparties: QDataCollection

    latencyCache: LatencyCache

    reliableChainOrderUpperBoundary: ReliableChainOrderUpperBoundary

    constructor(options: QDataOptions) {
        super(options)
        const fast = options.providers.blockchain
        const slow = options.slowQueriesProviders
        const add = (
            name: string,
            type: QType,
            provider?: QDataProvider,
            slowQueriesProvider?: QDataProvider,
        ) => {
            return this.addCollection(
                name,
                type,
                provider,
                slowQueriesProvider,
                INDEXES[name].indexes,
            )
        }
        this.accounts = add("accounts", Account, fast?.accounts, slow?.accounts)
        this.blocks = add("blocks", Block, fast?.blocks, slow?.blocks)
        this.blocks_signatures = add(
            "blocks_signatures",
            BlockSignatures,
            fast?.blocks,
            slow?.blocks,
        )
        this.transactions = add(
            "transactions",
            Transaction,
            fast?.transactions,
            slow?.transactions,
        )
        this.messages = add(
            "messages",
            Message,
            fast?.transactions,
            slow?.transactions,
        )
        this.zerostates = add(
            "zerostates",
            Zerostate,
            fast?.zerostate,
            slow?.zerostate,
        )
        this.counterparties = add(
            "counterparties",
            Counterparty,
            options.providers.counterparties,
        )

        this.latencyCache = new LatencyCache({
            blocks: this.blocks,
            hotBlocks: options.providers.blockchain?.hotBlocks,
            messages: this.messages,
            hotMessages: options.providers.blockchain?.hotTransactions,
            transactions: this.transactions,
            hotTransactions: options.providers.blockchain?.hotTransactions,
            ignoreMessages: options.ignoreMessagesForLatency,
        })

        this.reliableChainOrderUpperBoundary = {
            boundary: "",
            lastCheckTime: 0,
        }
    }

    async getLatency(_request: QRequestContext): Promise<Latency> {
        return await this.latencyCache.get()
    }

    // Spec: reliable_chain_order_upper_boundary = U64String(last_reliable_mc_seq_no + 1)
    async getReliableChainOrderUpperBoundary(
        context: QRequestContext,
        archive: boolean,
    ): Promise<ReliableChainOrderUpperBoundary> {
        const now = Date.now()
        if (now < this.reliableChainOrderUpperBoundary.lastCheckTime + 1000) {
            // CHAIN_ORDER_UPPER_BOUNDARY_UPDATE_PERIOD
            return this.reliableChainOrderUpperBoundary
        }
        if (this.providers.chainRangesVerification) {
            const result = (await required(
                this.providers.chainRangesVerification,
            ).query({
                text: "RETURN DOCUMENT('chain_ranges_verification/summary')",
                vars: {},
                orderBy: [],
                request: context,
                traceSpan: context.requestSpan,
                archive,
            })) as ChainRangesVerificationSummary[]
            if (result.length > 0) {
                const boundary = result.reduce<string>((prev, summary) => {
                    const curr =
                        summary.reliable_chain_order_upper_boundary ?? ""
                    return curr < prev ? curr : prev
                }, "z")

                this.reliableChainOrderUpperBoundary = {
                    boundary,
                    lastCheckTime: now,
                }
            } else {
                throw new Error(
                    "Couldn't get chain_ranges_verification summary",
                )
            }
        } else {
            const gapInSeconds = 10 // 4 seconds for master block + 6 seconds for eventual consistency with enough margin
            const result = (await required(
                this.providers.blockchain?.blocks,
            ).query({
                text: `
                    LET now = DATE_NOW() / 1000
                    FOR b IN blocks
                        FILTER b.workchain_id == -1 && b.gen_utime < now - ${gapInSeconds}
                        SORT b.gen_utime DESC
                        LIMIT 1
                        RETURN b.seq_no
                `,
                vars: {},
                orderBy: [],
                request: context,
                traceSpan: context.requestSpan,
                archive,
            })) as number[]
            if (result.length > 0) {
                const mc_seq_no = result.reduce((prev, curr) =>
                    Math.max(prev, curr),
                )
                const boundary = toU64String(mc_seq_no + 1)

                this.reliableChainOrderUpperBoundary = {
                    boundary,
                    lastCheckTime: now,
                }
            } else {
                throw new Error(
                    "There is something wrong with chain order boundary",
                )
            }
        }
        return this.reliableChainOrderUpperBoundary
    }
}
