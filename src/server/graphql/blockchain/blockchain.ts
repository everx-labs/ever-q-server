import { GraphQLResolveInfo } from "graphql";

import { convertBigUInt, QParams } from "../../filter/filters";
import { QRequestContext } from "../../request";
import { QTraceSpan } from "../../tracing";
import { QError, required } from "../../utils";

import {
    Direction,
    getNodeSelectionSetForConnection,
    isDefined,
    prepareChainOrderFilter,
    processPaginatedQueryResult,
    processPaginationArgs,
} from "./helpers";
import {
    BlockchainAccount,
    BlockchainBlock,
    BlockchainBlocksConnection,
    BlockchainQueryAccount_TransactionsArgs,
    BlockchainQueryArgs,
    BlockchainQueryKey_BlocksArgs,
    BlockchainQueryMaster_Seq_No_RangeArgs,
    BlockchainQueryWorkchain_BlocksArgs,
    BlockchainQueryWorkchain_TransactionsArgs,
    BlockchainTransaction,
    BlockchainTransactionsConnection,
    Resolvers,
} from "./resolvers-types-generated";
import { config } from "./config";

function parseMasterSeqNo(chain_order: string) {
    const length = parseInt(chain_order[0], 16) + 1;
    return parseInt(chain_order.slice(1, length + 1), 16);
}

async function resolve_maser_seq_no_range(
    args: BlockchainQueryMaster_Seq_No_RangeArgs,
    context: QRequestContext,
    traceSpan: QTraceSpan,
) {
    if (args.time_start && args.time_end && args.time_start > args.time_end) {
        throw QError.invalidQuery("time_start should not be greater than time_end");
    }

    // For the start we are:
    // - searching the closest master block at or before time_start - all later blocks will have bigger chain_order
    // - searching the minimum chain_order as a backup plan
    // For the end we are:
    // - trying to reduce amount of blocks to process via end_query_limiter
    // - getting the max chain_order for a blocks at or before time_end
    const text = `
        // ArangoDB most likely will execute all of the queries, but we will give it a chance to optimize
        LET end_query_limiter = @time_end
            ? /* min_gen_utime_for_range_ending_after_time_end */ (
                FOR b IN blocks 
                FILTER b.workchain_id == -1 && b.gen_utime > @time_end 
                SORT b.gen_utime ASC 
                LIMIT 1 
                RETURN MIN(b.master.shard_hashes[*].descr.gen_utime)
            )[0]
            : null
            
        LET end_query_limiter2 = @time_end && (end_query_limiter > @time_end || end_query_limiter == null)
            ? /* min_gen_utime_for_range_ending_right_before_time_end */ (
                FOR b IN blocks 
                FILTER b.workchain_id == -1 && b.gen_utime <= @time_end 
                SORT b.gen_utime DESC 
                LIMIT 1 
                RETURN MIN(b.master.shard_hashes[*].descr.gen_utime)
            )[0]
            : end_query_limiter
            
        LET end_query_limiter3 = end_query_limiter2 || 1
            
        RETURN {
            _key: UUID(),
            first: @time_start ? (FOR b IN blocks SORT b.chain_order ASC LIMIT 1 RETURN b.chain_order)[0] : null,
            start: @time_start ? (FOR b IN blocks FILTER b.workchain_id == -1 && b.gen_utime <= @time_start SORT b.gen_utime DESC LIMIT 1 RETURN b.chain_order)[0] : null,
            end: @time_end ? MAX(FOR b IN blocks FILTER b.gen_utime >= end_query_limiter3 && b.gen_utime <= @time_end SORT b.gen_utime DESC RETURN b.chain_order) : null
        }
    `; // UUID is a hack to bypass QDataCombiner deduplication
    const vars: Record<string, unknown> = {
        time_start: args.time_start ?? null,
        time_end: args.time_end ?? null,
    };
    const result = await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text,
            vars,
            orderBy: [],
            request: context,
            traceSpan,
        },
    ) as { first: string | null, start: string | null, end: string | null }[];

    let first: string | null = null;
    let start: string | null = null;
    let end: string | null = null;
    for (const r of result) {
        if (r.first && (!first || r.first < first)) {
            first = r.first;
        }
        if (r.start && (!start || r.start > start)) {
            start = r.start;
        }
        if (r.end && (!end || r.end > end)) {
            end = r.end;
        }
    }
    if (!start && first) {
        start = first;
    }
    if (args.time_end && !end) {
        start = null;
    }
    if (args.time_start && !start) {
        end = null;
    }

    // reliable boundary
    const reliable = await context.services.data.getReliableChainOrderUpperBoundary(context);
    if (reliable.boundary == "") {
        throw QError.create(500, "Could not determine reliable upper boundary");
    }

    return {
        start: start ? parseMasterSeqNo(start) : null,
        end: end ? Math.min(parseMasterSeqNo(end) + 1, parseMasterSeqNo(reliable.boundary)) : null,
    };
}

async function resolve_key_blocks(
    args: BlockchainQueryKey_BlocksArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
    parentArgs: BlockchainQueryArgs,
) {
    // filters
    const filters: string[] = [];
    const params = new QParams();

    if (parentArgs.workchains &&
        parentArgs.workchains.length > 0 &&
        !parentArgs.workchains.includes(-1)
    ) {
        throw QError.invalidQuery("key_blocks are available only for workchain -1 (masterchain)");
    }

    if (args.seq_no && parentArgs.time_range) {
        throw QError.invalidQuery("seq_no in key_blocks and time_range in blockchain should not be used simultaneously");
    }
    args.seq_no = args.seq_no || parentArgs.time_range;

    const rename_seq_no = ({
        seq_no,
        ...remainder
    }: BlockchainQueryKey_BlocksArgs) => ({ master_seq_no: seq_no, ...remainder });
    await prepareChainOrderFilter(rename_seq_no(args), params, filters, context);
    filters.push("doc.key_block == true");

    const {
        direction,
        limit,
    } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = config.blocks.buildReturnExpression(
        selectionSet,
        context,
        0,
        "doc",
    );

    // query
    const query = `
        FOR doc IN blocks
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [
                {
                    path: "chain_order",
                    direction: "ASC",
                },
            ],
            request: context,
            traceSpan,
        },
    ) as BlockchainBlock[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
    ) as BlockchainBlocksConnection;
}

async function resolve_workchain_blocks(
    args: BlockchainQueryWorkchain_BlocksArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
    parentArgs: BlockchainQueryArgs,
) {
    // validate args
    if (args.thread && !isDefined(args.workchain)) {
        throw QError.invalidQuery("Workchain is required for the thread filter");
    }

    if (args.master_seq_no && parentArgs.time_range) {
        throw QError.invalidQuery("master_seq_no in resolve_workchain_blocks and time_range in blockchain should not be used simultaneously");
    }
    args.master_seq_no = args.master_seq_no || parentArgs.time_range;

    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
    if (isDefined(args.workchain)) {
        filters.push(`doc.workchain_id == @${params.add(args.workchain)}`);
    }
    if (parentArgs.workchains && parentArgs.workchains.length > 0) {
        // TODO: Optimize
        filters.push(`doc.workchain_id IN @${params.add(parentArgs.workchains)}`);
    }
    if (isDefined(args.thread)) {
        filters.push(`doc.shard == @${params.add(args.thread)}`);
    }
    if (isDefined(args.min_tr_count)) {
        filters.push(`doc.tr_count >= @${params.add(args.min_tr_count)}`);
    }
    if (isDefined(args.max_tr_count)) {
        filters.push(`doc.tr_count <= @${params.add(args.max_tr_count)}`);
    }

    const {
        direction,
        limit,
    } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = config.blocks.buildReturnExpression(
        selectionSet,
        context,
        0,
        "doc",
    );


    // query
    const query = `
        FOR doc IN blocks
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [
                {
                    path: "chain_order",
                    direction: "ASC",
                },
            ],
            request: context,
            traceSpan,
        },
    ) as BlockchainBlock[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
    ) as BlockchainBlocksConnection;
}

async function resolve_workchain_transactions(
    args: BlockchainQueryWorkchain_TransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
    parentArgs: BlockchainQueryArgs,
) {
    const maxJoinDepth = 1;

    if (args.master_seq_no && parentArgs.time_range) {
        throw QError.invalidQuery("master_seq_no in resolve_workchain_blocks and time_range in blockchain should not be used simultaneously");
    }
    args.master_seq_no = args.master_seq_no || parentArgs.time_range;

    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);

    if (isDefined(args.workchain)) {
        filters.push(`doc.workchain_id == @${params.add(args.workchain)}`);
    }
    if (parentArgs.workchains && parentArgs.workchains.length > 0) {
        filters.push(`doc.workchain_id IN @${params.add(parentArgs.workchains)}`);
    }
    if (isDefined(args.min_balance_delta)) {
        const min_balance_delta = convertBigUInt(2, args.min_balance_delta);
        filters.push(`doc.balance_delta >= @${params.add(min_balance_delta)}`);
    }
    if (isDefined(args.max_balance_delta)) {
        const max_balance_delta = convertBigUInt(2, args.max_balance_delta);
        filters.push(`doc.balance_delta <= @${params.add(max_balance_delta)}`);
    }

    const {
        direction,
        limit,
    } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    );

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.transactions.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [
                {
                    path: "chain_order",
                    direction: "ASC",
                },
            ],
            request: context,
            traceSpan,
        },
    ) as BlockchainTransaction[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        async r => {
            await config.transactions.fetchJoins(r, selectionSet, context, traceSpan, maxJoinDepth);
        },
    ) as BlockchainTransactionsConnection;
}

async function resolve_account_transactions(
    args: BlockchainQueryAccount_TransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 1;
    // validate args
    const restrictToAccounts = (await context.requireGrantedAccess({})).restrictToAccounts;
    if (restrictToAccounts.length != 0 && !restrictToAccounts.includes(args.account_address)) {
        throw QError.invalidQuery("This account_addr is not allowed");
    }

    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
    filters.push(`doc.account_addr == @${params.add(args.account_address)}`);
    if (isDefined(args.aborted)) {
        filters.push(`doc.aborted == @${params.add(args.aborted)}`);
    }
    if (isDefined(args.min_balance_delta)) {
        const min_balance_delta = convertBigUInt(2, args.min_balance_delta);
        filters.push(`doc.balance_delta >= @${params.add(min_balance_delta)}`);
    }
    if (isDefined(args.max_balance_delta)) {
        const max_balance_delta = convertBigUInt(2, args.max_balance_delta);
        filters.push(`doc.balance_delta <= @${params.add(max_balance_delta)}`);
    }

    const {
        direction,
        limit,
    } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = config.transactions.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc"
    );

    // query
    const query = `
        FOR doc IN transactions
        FILTER ${filters.join(" AND ")}
        SORT doc.chain_order ${direction == Direction.Backward ? "DESC" : "ASC"}
        LIMIT ${limit}
        RETURN ${returnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.transactions.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [
                {
                    path: "chain_order",
                    direction: "ASC",
                },
            ],
            request: context,
            traceSpan,
            // TODO: shard
        },
    ) as BlockchainTransaction[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        async r => {
            await config.transactions.fetchJoins(r, selectionSet, context, traceSpan, maxJoinDepth);
        },
    ) as BlockchainTransactionsConnection;
}

async function resolve_account(
    address: String,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 1;

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = config.accounts.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc"
    );

    // query
    const params = new QParams();
    const query =
        "FOR doc IN accounts " +
        `FILTER doc._key == @${params.add(address)} ` +
        `RETURN ${returnExpression}`;
    const queryResult = await context.services.data.query(
        required(context.services.data.accounts.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [],
            request: context,
            traceSpan,
            // TODO: shard
        },
    ) as BlockchainAccount[];

    return queryResult[0];
}

export const resolvers: Resolvers<QRequestContext> = {
    Query: {
        master_seq_no_range: (_parent, args, context) => {
            return context.trace("master_seq_no_range", async traceSpan => {
                return await resolve_maser_seq_no_range(args, context, traceSpan);
            });
        },
        blockchain: async (_parent, args) => {
            if (args.workchains && args.workchains.length > 3) {
                throw QError.invalidQuery("workchains filter is limited by 3 workchains");
            }
            return {
                args,
            };
        },
        account: async (_parent, args, context) => {
            const addressWithoutPrefix = args.address.split(":")[1];
            if (addressWithoutPrefix === undefined || addressWithoutPrefix.length !== 64) {
                throw QError.invalidQuery("Invalid account address");
            }
            const restrictToAccounts = (await context.requireGrantedAccess({})).restrictToAccounts;
            if (restrictToAccounts.length != 0 && !restrictToAccounts.includes(args.address)) {
                throw QError.invalidQuery("This account address is not allowed");
            }
            return {
                address: args.address
            }
        }
    },
    BlockchainQuery: {
        master_seq_no_range: (_parent, args, context) => {
            return context.trace("blockchain-master_seq_no_range", async traceSpan => {
                return await resolve_maser_seq_no_range(args, context, traceSpan);
            });
        },
        key_blocks: async (parent, args, context, info) => {
            return context.trace("blockchain-resolve_key_blocks", async traceSpan => {
                return await resolve_key_blocks(args, context, info, traceSpan, parent.args);
            });
        },
        workchain_blocks: async (parent, args, context, info) => {
            return context.trace("blockchain-resolve_workchain_blocks", async traceSpan => {
                return await resolve_workchain_blocks(
                    args,
                    context,
                    info,
                    traceSpan,
                    parent.args,
                );
            });
        },
        workchain_transactions: async (parent, args, context, info) => {
            return context.trace("blockchain-workchain_transactions", async traceSpan => {
                return await resolve_workchain_transactions(
                    args,
                    context,
                    info,
                    traceSpan,
                    parent.args,
                );
            });
        },
        account_transactions: async (parent, args, context, info) => {
            if (parent.args.time_range || parent.args.workchains) {
                throw QError.invalidQuery(
                    "account_transactions should not be used with time_range or workchain in blockchain args." +
                    "Use query { account(address) { transactions }} instead");
            }
            return context.trace("blockchain-account_transactions", async traceSpan => {
                return await resolve_account_transactions(
                    args,
                    context,
                    info,
                    traceSpan,
                );
            });
        },
        blocks: async (parent, args, context, info) => {
            return context.trace("blockchain-resolve_workchain_blocks", async traceSpan => {
                return await resolve_workchain_blocks(
                    args,
                    context,
                    info,
                    traceSpan,
                    parent.args,
                );
            });
        },
        transactions: async (parent, args, context, info) => {
            return context.trace("blockchain-workchain_transactions", async traceSpan => {
                return await resolve_workchain_transactions(
                    args,
                    context,
                    info,
                    traceSpan,
                    parent.args,
                );
            });
        },
    },
    BlockchainAccountQuery: {
        info: async (parent, _args, context, info) => {
            return context.trace("account-info", async traceSpan => {
                return resolve_account(parent.address, context, info, traceSpan);
            });
        }, 
        transactions: async (parent, args, context, info) => {
            return context.trace("account-transactions", async traceSpan => {
                return await resolve_account_transactions(
                    {
                        account_address: parent.address,
                        ...args,
                    },
                    context,
                    info,
                    traceSpan,
                );
            });
        },
    },
    Node: {
        __resolveType: (parent) => {
            // it could fail if parent is a value from db instead of a value with resolved fields
            // need to test
            switch (parent.id.split("/")[0]) {
            case "transaction":
                return "BlockchainTransaction";
            default:
                return null;
            }
        },
    },
};
