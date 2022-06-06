import { QRequestContext } from "../../request"
import { QTraceSpan } from "../../tracing"
import { QError, required } from "../../utils"

import {
    BlockchainQueryMaster_Seq_No_RangeArgs,
    Resolvers,
} from "./resolvers-types-generated"
import {
    resolve_account,
    resolve_account_transactions,
    resolve_key_blocks,
    resolve_blockchain_blocks,
    resolve_account_messages,
    resolve_blockchain_transactions,
    resolve_block,
    resolve_transaction,
    resolve_message,
    resolve_block_by_seq_no,
} from "./fetchers"
import { isDefined } from "./helpers"

// UUID is a hack to bypass QDataCombiner deduplication
const MASTER_SEQ_NO_RANGE_QUERY = `
    RETURN {
        _key: UUID(),
        first: @time_start ? (
            FOR b IN blocks
            FILTER b.workchain_id == -1
            SORT b.gen_utime ASC
            LIMIT 1
            RETURN b.seq_no
        )[0] : null,
        start: @time_start ? (
            FOR b IN blocks
            FILTER b.workchain_id == -1 && b.gen_utime >= @time_start
            SORT b.gen_utime ASC
            LIMIT 1
            RETURN b.seq_no
        )[0] : null,
        end: @time_end ? (
            FOR b IN blocks
            FILTER b.master.min_shard_gen_utime != null && b.master.min_shard_gen_utime >= @time_end
            SORT b.master.min_shard_gen_utime ASC
            LIMIT 1
            RETURN b.seq_no
        )[0] : null
    }`.replace(/\s+/g, " ")

async function resolve_maser_seq_no_range(
    args: BlockchainQueryMaster_Seq_No_RangeArgs,
    context: QRequestContext,
    traceSpan: QTraceSpan,
) {
    if (args.time_start && args.time_end && args.time_start > args.time_end) {
        throw QError.invalidQuery(
            "time_start should not be greater than time_end",
        )
    }

    const result = (await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text: MASTER_SEQ_NO_RANGE_QUERY,
            vars: {
                time_start: args.time_start ?? null,
                time_end: args.time_end ?? null,
            },
            orderBy: [],
            request: context,
            traceSpan,
        },
    )) as {
        first: number | null
        start: number | null
        end: number | null
    }[]

    // Aggregate data from multiple DB
    // min first, min start, min end
    let first: number | null = null
    let start: number | null = null
    let end: number | null = null
    for (const r of result) {
        if (r.first && (!first || r.first < first)) {
            first = r.first
        }
        if (r.start && (!start || r.start < start)) {
            start = r.start
        }
        if (r.end && (!end || r.end < end)) {
            end = r.end
        }
    }

    // reliable boundary
    const reliable =
        await context.services.data.getReliableChainOrderUpperBoundary(context)
    const max_end = parseMasterSeqNo(reliable.boundary)

    // Edge cases:
    // 1. time_start is ...
    // 1.1. ...after reliable boundary
    //      it is ok to return start >= max_end
    //      (queries just will give empty results for a while)
    // 1.2  ...greater than the last masterblock gen_utime
    //      start == null and we need to coerce
    // 1.3. time_start is less than the first masterblock gen_utime
    //      start == first and if database hasn't all blocks,
    //      we can't properly determine start seq_no
    // 2. time_end ...
    // 2.1. ...is less than the first available block gen_utime
    //      end is defined and doesn't violate definition
    // 2.2. ...is greater than min_shard_gen_utime of the last masterblock
    //      end is automatically null as expected
    // 2.3. ...results to end greater than reliable boundary
    //      it is better to null end to highlight that some data is not accessible yet
    // 3. start is greater than end
    //    it is expected to be impossible

    if (isDefined(args.time_start)) {
        if (start == null) {
            // 1.2
            // the difference between max_end and last is expected to be insignificant
            start = max_end
        } else if (start == first && first > 1) {
            // 1.3
            start = null
        }
    }

    if (end && end > max_end) {
        // 2.3
        end = null
    }

    if (start && end && start > end) {
        // 3
        throw QError.create(
            500,
            "Start is greater than end: " +
                `[${args.time_start},${args.time_end}) -> [${start},${end}) ` +
                `with first = ${first} and max_end = ${max_end}`,
        )
    }

    return {
        start,
        end,
    }

    function parseMasterSeqNo(chain_order: string) {
        const length = parseInt(chain_order[0], 16) + 1
        return parseInt(chain_order.slice(1, length + 1), 16)
    }
}

export const resolvers: Resolvers<QRequestContext> = {
    Query: {
        blockchain: () => ({}),
    },
    BlockchainQuery: {
        account: async (_parent, args, context) => {
            const addressWithoutPrefix = args.address.split(":")[1]
            if (
                addressWithoutPrefix === undefined ||
                addressWithoutPrefix.length !== 64
            ) {
                throw QError.invalidQuery("Invalid account address")
            }
            const restrictToAccounts = (await context.requireGrantedAccess({}))
                .restrictToAccounts
            if (
                restrictToAccounts.length != 0 &&
                !restrictToAccounts.includes(args.address)
            ) {
                throw QError.invalidQuery("This account address is not allowed")
            }
            return {
                address: args.address,
            }
        },
        block: async (_parent, args, context, info) => {
            return context.trace("blockchain-block", async traceSpan => {
                return resolve_block(args.hash, context, info, traceSpan)
            })
        },
        block_by_seq_no: async (_parent, args, context, info) => {
            return context.trace(
                "blockchain-block-by-seq-no",
                async traceSpan => {
                    return resolve_block_by_seq_no(
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
        transaction: async (_parent, args, context, info) => {
            return context.trace("blockchain-transaction", async traceSpan => {
                return resolve_transaction(args.hash, context, info, traceSpan)
            })
        },
        message: async (_parent, args, context, info) => {
            return context.trace("blockchain-message", async traceSpan => {
                return resolve_message(args.hash, context, info, traceSpan)
            })
        },
        master_seq_no_range: (_parent, args, context) => {
            return context.trace(
                "blockchain-master_seq_no_range",
                async traceSpan => {
                    return await resolve_maser_seq_no_range(
                        args,
                        context,
                        traceSpan,
                    )
                },
            )
        },
        key_blocks: async (_parent, args, context, info) => {
            return context.trace(
                "blockchain-resolve_key_blocks",
                async traceSpan => {
                    return await resolve_key_blocks(
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
        blocks: async (_parent, args, context, info) => {
            return context.trace(
                "blockchain-resolve_workchain_blocks",
                async traceSpan => {
                    return await resolve_blockchain_blocks(
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
        transactions: async (_parent, args, context, info) => {
            return context.trace(
                "blockchain-workchain_transactions",
                async traceSpan => {
                    return await resolve_blockchain_transactions(
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
    },
    BlockchainAccountQuery: {
        info: async (parent, _args, context, info) => {
            return context.trace("blockchain-account-info", async traceSpan => {
                return resolve_account(parent.address, context, info, traceSpan)
            })
        },
        transactions: async (parent, args, context, info) => {
            return context.trace(
                "blockchain-account-transactions",
                async traceSpan => {
                    return await resolve_account_transactions(
                        parent.address,
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
        messages: async (parent, args, context, info) => {
            return context.trace(
                "blockchain-account-messages",
                async traceSpan => {
                    return await resolve_account_messages(
                        parent,
                        args,
                        context,
                        info,
                        traceSpan,
                    )
                },
            )
        },
    },
    Node: {
        __resolveType: parent => {
            // it could fail if parent is a value from db instead of a value with resolved fields
            // need to test
            switch (parent.id.split("/")[0]) {
                case "account":
                    return "BlockchainAccount"
                case "block":
                    return "BlockchainBlock"
                case "message":
                    return "BlockchainMessage"
                case "transaction":
                    return "BlockchainTransaction"
                default:
                    return null
            }
        },
    },
}
