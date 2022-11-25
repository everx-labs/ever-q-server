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
import { QDataProvider, QIndexInfo, sortedIndex } from "./data-provider"
import { QType } from "../filter/filters"
import { required, toU64String } from "../utils"
import { QRequestContext } from "../request"
import { Latency, LatencyCache } from "./latency"

export const INDEXES: { [name: string]: { indexes: QIndexInfo[] } } = {
    blocks: {
        indexes: [
            sortedIndex(["seq_no", "gen_utime"]),
            sortedIndex(["gen_utime"]),
            sortedIndex(["workchain_id", "shard", "seq_no"]),
            sortedIndex(["workchain_id", "shard", "gen_utime"]),
            sortedIndex(["workchain_id", "seq_no"]),
            sortedIndex(["workchain_id", "gen_utime"]),
            sortedIndex(["master.min_shard_gen_utime"]),
            sortedIndex(["prev_ref.root_hash", "_key"]),
            sortedIndex(["prev_alt_ref.root_hash", "_key"]),
        ],
    },
    accounts: {
        indexes: [sortedIndex(["last_trans_lt"]), sortedIndex(["balance"])],
    },
    messages: {
        indexes: [
            sortedIndex(["block_id"]),
            sortedIndex(["value", "created_at"]),
            sortedIndex(["src", "value", "created_at"]),
            sortedIndex(["dst", "value", "created_at"]),
            sortedIndex(["src", "created_at"]),
            sortedIndex(["dst", "created_at"]),
            sortedIndex(["created_lt"]),
            sortedIndex(["created_at"]),
        ],
    },
    transactions: {
        indexes: [
            sortedIndex(["block_id"]),
            sortedIndex(["in_msg"]),
            sortedIndex(["out_msgs[*]"]),
            sortedIndex(["account_addr", "now"]),
            sortedIndex(["now"]),
            sortedIndex(["lt"]),
            sortedIndex(["account_addr", "orig_status", "end_status"]),
            sortedIndex(["now", "account_addr", "lt"]),
        ],
    },
    blocks_signatures: {
        indexes: [sortedIndex(["signatures[*].node_id", "gen_utime"])],
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
            messages: this.messages,
            transactions: this.transactions,
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
