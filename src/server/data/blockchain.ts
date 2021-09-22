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

import { Counterparty } from "../graphql/counterparties";
import type { QDataOptions } from "./data";
import QData from "./data";
import {
    QDataCollection,
} from "./collection";
import {
    Account,
    Block,
    BlockSignatures,
    Message,
    Transaction,
    Zerostate,
} from "../graphql/resolvers-generated";
import {
    QDataProvider,
    QIndexInfo,
    sortedIndex,
} from "./data-provider";
import { QType } from "../filter/filters";
import { required, toU64String } from "../utils";
import { QRequestContext } from "../request";
import { Database } from "arangojs";

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
        indexes: [
            sortedIndex(["last_trans_lt"]),
            sortedIndex(["balance"]),
        ],
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
        indexes: [
            sortedIndex(["signatures[*].node_id", "gen_utime"]),
        ],
    },
    zerostates: {
        indexes: [],
    },
    counterparties: {
        indexes: [],
    },
};


Object.values(INDEXES).forEach((collection: { indexes: QIndexInfo[] }) => {
    collection.indexes = collection.indexes.concat({ fields: ["_key"] });
});

export type CollectionLatency = {
    maxTime: number,
    nextUpdateTime: number,
    latency: number,
};

export type Latency = {
    blocks: CollectionLatency,
    messages: CollectionLatency,
    transactions: CollectionLatency,
    nextUpdateTime: number,
    latency: number,
    lastBlockTime: number,
};

type ChainRangesVerificationSummary = {
    reliable_chain_order_upper_boundary?: string | null,
};

export type ReliableChainOrderUpperBoundary = {
    boundary: string,
    lastCheckTime: number,
};

const LATENCY_UPDATE_FREQUENCY = 25000;
const LATENCY_UPDATE_VARIANCE = 10000;

export default class QBlockchainData extends QData {
    accounts: QDataCollection;
    blocks: QDataCollection;
    blocks_signatures: QDataCollection;
    transactions: QDataCollection;
    messages: QDataCollection;
    zerostates: QDataCollection;
    counterparties: QDataCollection;

    latency: Latency;
    debugLatency: number;

    reliableChainOrderUpperBoundary: ReliableChainOrderUpperBoundary;

    constructor(options: QDataOptions) {
        super(options);
        const fast = options.providers.blockchain;
        const slow = options.slowQueriesProviders;
        const add = (name: string, type: QType, provider?: QDataProvider, slowQueriesProvider?: QDataProvider) => {
            return this.addCollection(name, type, provider, slowQueriesProvider, INDEXES[name].indexes);
        };
        this.accounts = add("accounts", Account, fast?.accounts, slow?.accounts);
        this.blocks = add("blocks", Block, fast?.blocks, slow?.blocks);
        this.blocks_signatures = add("blocks_signatures", BlockSignatures, fast?.blocks, slow?.blocks);
        this.transactions = add("transactions", Transaction, fast?.transactions, slow?.transactions);
        this.messages = add("messages", Message, fast?.transactions, slow?.transactions);
        this.zerostates = add("zerostates", Zerostate, fast?.zerostate, slow?.zerostate);
        this.counterparties = add("counterparties", Counterparty, options.providers.counterparties);

        this.latency = {
            blocks: {
                maxTime: 0,
                nextUpdateTime: 0,
                latency: 0,
            },
            messages: {
                maxTime: 0,
                nextUpdateTime: 0,
                latency: 0,
            },
            transactions: {
                maxTime: 0,
                nextUpdateTime: 0,
                latency: 0,
            },
            nextUpdateTime: 0,
            latency: 0,
            lastBlockTime: 0,
        };
        this.debugLatency = 0;

        this.blocks.docInsertOrUpdate.on("doc", async (block) => {
            this.updateLatency(this.latency.blocks, block.gen_utime);
        });
        this.transactions.docInsertOrUpdate.on("doc", async (tr) => {
            this.updateLatency(this.latency.transactions, tr.now);
        });
        this.messages.docInsertOrUpdate.on("doc", async (msg) => {
            this.updateLatency(this.latency.messages, msg.created_at);
        });

        this.reliableChainOrderUpperBoundary = {
            boundary: "",
            lastCheckTime: 0,
        };
    }

    updateLatency(latency: CollectionLatency, timeInSeconds?: number | null) {
        if (this.updateCollectionLatency(latency, timeInSeconds)) {
            this.updateLatencySummary();
        }
    }

    updateCollectionLatency(latency: CollectionLatency, timeInSeconds?: number | null): boolean {
        if (timeInSeconds === undefined || timeInSeconds === null || timeInSeconds === 0) {
            return false;
        }
        const time = timeInSeconds * 1000;
        const now = Date.now();
        if (time > latency.maxTime) {
            latency.maxTime = time;
        }
        latency.nextUpdateTime = now + LATENCY_UPDATE_FREQUENCY + Math.random() * LATENCY_UPDATE_VARIANCE;
        latency.latency = Math.max(0, now - latency.maxTime);
        return true;
    }

    updateLatencySummary() {
        const {
            blocks,
            messages,
            transactions,
        } = this.latency;
        this.latency.nextUpdateTime = Math.min(
            blocks.nextUpdateTime,
            messages.nextUpdateTime,
            transactions.nextUpdateTime,
        );
        this.latency.latency = Math.max(
            blocks.latency,
            messages.latency,
            transactions.latency,
        );
        this.latency.lastBlockTime = blocks.maxTime;
    }

    async fetchMaxTimes(
        collections: { latency: CollectionLatency, collection: QDataCollection, field: string }[],
        request: QRequestContext,
    ): Promise<boolean> {
        const now = Date.now();
        const updates = collections
            .filter(x => x.collection.provider !== undefined && now > x.latency.nextUpdateTime)
            .map(x => ({
                latency: x.latency,
                provider: x.collection.provider as QDataProvider,
                shards: required(x.collection.provider).shards,
                collection: x.collection.name,
                field: x.field,
            }));
        if (updates.length === 0) {
            return false;
        }
        const fetchersByDatabasePoolIndex = new Map<number, { database: Database, returns: string[] }>();
        for (const {
            shards,
            collection,
            field
        } of updates) {
            const returnExpression =
                `${collection}: (FOR d IN ${collection} SORT d.${field} DESC LIMIT 1 RETURN d.${field})[0]`;
            for (const shard of shards) {
                const existing = fetchersByDatabasePoolIndex.get(shard.poolIndex);
                if (existing !== undefined) {
                    existing.returns.push(returnExpression);
                } else {
                    fetchersByDatabasePoolIndex.set(shard.poolIndex, {
                        database: shard.database,
                        returns: [returnExpression],
                    });
                }
                if (shard.shard.length > 0) {
                    request.requestTags.hasRangedQuery = true;
                }
            }
        }

        const fetchedTimes = await request.trace("fetchLatencyTimes", async () => {
            const fetchers = [...fetchersByDatabasePoolIndex.values()];
            request.requestTags.arangoCalls += fetchers.length;
            return await Promise.all(fetchers.map(async (fetcher) => {
                const query = `RETURN {${fetcher.returns.join(",\n")}}`;
                return (await (await fetcher.database.query(query)).all())[0] as Record<string, number | null>;
            }));
        });

        let hasUpdates = false;
        for (const {
            latency,
            collection,
        } of updates) {
            let maxTime: number | null = null;
            for (const fetchedTime of fetchedTimes) {
                const time = fetchedTime[collection];
                if (time !== undefined && time !== null && (maxTime === null || time > maxTime)) {
                    maxTime = time;
                }
            }
            if (this.updateCollectionLatency(latency, maxTime)) {
                hasUpdates = true;
            }
        }
        return hasUpdates;
    }

    updateDebugLatency(latency: number) {
        this.debugLatency = latency;
    }

    async getLatency(request: QRequestContext): Promise<Latency> {
        const latency = this.latency;
        if (Date.now() > latency.nextUpdateTime) {
            const hasUpdates = await this.fetchMaxTimes(
                [
                    {
                        latency: latency.blocks,
                        collection: this.blocks,
                        field: "gen_utime",
                    },
                    {
                        latency: latency.messages,
                        collection: this.messages,
                        field: "created_at",
                    },
                    {
                        latency: latency.transactions,
                        collection: this.transactions,
                        field: "now",
                    },
                ], request);
            if (hasUpdates) {
                this.updateLatencySummary();
            }
        }
        return latency;
    }

    async getReliableChainOrderUpperBoundary(context: QRequestContext): Promise<ReliableChainOrderUpperBoundary> {
        const now = Date.now();
        if (now < this.reliableChainOrderUpperBoundary.lastCheckTime + 1000) { // CHAIN_ORDER_UPPER_BOUNDARY_UPDATE_PERIOD
            return this.reliableChainOrderUpperBoundary;
        }
        if (this.providers.chainRangesVerification) {
            const result = await required(this.providers.chainRangesVerification).query({
                text: "RETURN DOCUMENT('chain_ranges_verification/summary')",
                vars: {},
                orderBy: [],
                request: context,
                traceSpan: context.requestSpan,
            }) as ChainRangesVerificationSummary[];
            if (result.length > 0) {
                const boundary =
                    result.reduce<string>((prev, summary) => {
                        const curr = summary.reliable_chain_order_upper_boundary ?? "";
                        return curr < prev ? curr : prev;
                    }, "z");

                this.reliableChainOrderUpperBoundary = {
                    boundary,
                    lastCheckTime: now,
                };
            } else {
                throw new Error("Couldn't get chain_ranges_verification summary");
            }
        } else {
            const gapInSeconds = 120;
            const result = await required(this.providers.blockchain?.blocks).query({
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
            }) as number[];
            if (result.length > 0) {
                const mc_seq_no = result.reduce((prev, curr) => Math.max(prev, curr));
                const boundary = toU64String(mc_seq_no + 1);

                this.reliableChainOrderUpperBoundary = {
                    boundary,
                    lastCheckTime: now,
                };
            } else {
                throw new Error("There is something wrong with chain order boundary");
            }
        }
        return this.reliableChainOrderUpperBoundary;
    }
}
