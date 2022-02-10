import { GraphQLResolveInfo, SelectionSetNode } from "graphql";
import { convertBigUInt, QParams } from "../../filter/filters";
import { QRequestContext } from "../../request";
import { QError, required } from "../../utils";

import {
    BlockchainAccount,
    BlockchainBlock,
    BlockchainBlocksConnection,
    BlockchainMessage,
    BlockchainQueryAccount_TransactionsArgs,
    BlockchainQueryKey_BlocksArgs,
    BlockchainQueryMaster_Seq_No_RangeArgs,
    BlockchainQueryWorkchain_BlocksArgs,
    BlockchainQueryWorkchain_TransactionsArgs,
    BlockchainTransaction,
    BlockchainTransactionsConnection,
    Maybe,
    Resolvers,
} from "./resolvers-types-generated";
import { QTraceSpan } from "../../tracing";
import { buildReturnExpression, Direction, getFieldSelectionSet, getNodeSelectionSetForConnection, prepareChainOrderFilter, processPaginatedQueryResult, processPaginationArgs } from "./helpers";
import { AccessRights } from "../../../server/auth";

function parseMasterSeqNo(chain_order: string) {
    const length = parseInt(chain_order[0], 16) + 1;
    return parseInt(chain_order.slice(1, length + 1), 16);
}

async function resolve_maser_seq_no_range(args: BlockchainQueryMaster_Seq_No_RangeArgs, context: QRequestContext, traceSpan: QTraceSpan) {
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
) {
    // filters
    const filters: string[] = [];
    const params = new QParams();

    const rename_seq_no = ({ seq_no, ...remainder}: BlockchainQueryKey_BlocksArgs) => ({master_seq_no: seq_no, ...remainder});
    await prepareChainOrderFilter(rename_seq_no(args), params, filters, context);
    filters.push(`doc.key_block == true`);

    const { direction, limit } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = buildReturnExpression({
        type: context.services.data.blocks.docType,
        selectionSet,
        orderBy: [{ path: "chain_order", direction: "ASC" }],
        excludedFields: ["hash"],
    });

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
            orderBy: [{ path: "chain_order", direction: "ASC" }],
            request: context,
            traceSpan,
        },
    ) as BlockchainBlock[];

    return await processPaginatedQueryResult(queryResult, limit, direction) as BlockchainBlocksConnection;
}

function isDefined<T>(value: T | null | undefined): boolean {
    return value !== undefined && value !== null;
}

async function resolve_workchain_blocks(
    args: BlockchainQueryWorkchain_BlocksArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    // validate args
    if (args.thread && !isDefined(args.workchain)) {
        throw QError.invalidQuery("Workchain is required for the thread filter");
    }

    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
    if (isDefined(args.workchain)) {
        filters.push(`doc.workchain_id == @${params.add(args.workchain)}`);
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

    const { direction, limit } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info); 
    const returnExpression = buildReturnExpression({
        type: context.services.data.blocks.docType,
        selectionSet,
        orderBy: [{ path: "chain_order", direction: "ASC" }],
        excludedFields: ["hash"],
    });


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
            orderBy: [{ path: "chain_order", direction: "ASC" }],
            request: context,
            traceSpan,
        },
    ) as BlockchainBlock[];

    return await processPaginatedQueryResult(queryResult, limit, direction) as BlockchainBlocksConnection;
}

function buildTransactionReturnExpression(selectionSet: SelectionSetNode | undefined, context: QRequestContext) {
    const accountSelectionSet = getFieldSelectionSet(selectionSet, "account");
    const inMessageSelectionSet = undefined; //getFieldSelectionSet(selectionSet, "in_message");
    const outMessagesSelectionSet = undefined; //getFieldSelectionSet(selectionSet, "out_messages");
    if (!accountSelectionSet && !inMessageSelectionSet && !outMessagesSelectionSet) {
        return buildReturnExpression({
            type: context.services.data.accounts.docType,
            selectionSet,
            orderBy: [{ path: "chain_order", direction: "ASC" }],
            excludedFields: ["hash"],
        });
    }

    // CAUTION: We also rely on buildReturnExpression to add account_addr, in_msg and out_msgs
    const joinReturnExpressions = new Map();
    if (accountSelectionSet) {
        const accountReturnExpression = buildReturnExpression({
            type: context.services.data.accounts.docType,
            selectionSet: accountSelectionSet,
            excludedFields: ["address"],
            path: "acc",
        });
        const accountQuery = 
            `(FOR acc IN accounts ` +
            `FILTER acc._key == doc.account_addr ` +
            `RETURN ${accountReturnExpression})[0]`;
        joinReturnExpressions.set("account", accountQuery);
    }

    if (inMessageSelectionSet) {
        const inMessageReturnExpression = buildReturnExpression({
            type: context.services.data.messages.docType,
            selectionSet: inMessageSelectionSet,
            excludedFields: ["hash"],
            path: "msg",
        });
        const inMessageQuery = 
            `(FOR msg IN messages ` +
            `FILTER msg._key == doc.in_msg ` +
            `RETURN ${inMessageReturnExpression})[0]`;
        joinReturnExpressions.set("in_message", inMessageQuery);
    }

    if (outMessagesSelectionSet) {
        const outMessagesReturnExpression = buildReturnExpression({
            type: context.services.data.messages.docType,
            selectionSet: outMessagesSelectionSet,
            excludedFields: ["hash"],
            path: "msg",
        });
        const outMessagesQuery = 
            `(FOR msg IN messages ` +
            `FILTER msg._key IN doc.out_msgs ` +
            `RETURN ${outMessagesReturnExpression})`;
        joinReturnExpressions.set("out_messages", outMessagesQuery);
    }

    return buildReturnExpression({
        type: context.services.data.transactions.docType,
        selectionSet,
        orderBy: [{ path: "chain_order", direction: "ASC" }],
        excludedFields: ["hash"],
        overrides: joinReturnExpressions,
    });
}

async function fetchMessagesForTransactionsIfNeeded(
    result: BlockchainTransaction[],
    selectionSet: SelectionSetNode | undefined,
    context: QRequestContext,
    traceSpan: QTraceSpan,
) {
    function getFetchPlan(
        joinedFieldName: string,
        onField: (t: BlockchainTransaction) => Maybe<string> | Maybe<string>[],
        joinNotNeeded: (t: BlockchainTransaction) => boolean,
    ): [SelectionSetNode, Map<string, BlockchainTransaction[]>] | [undefined, undefined] {
        const fieldSelectionSet = getFieldSelectionSet(selectionSet, joinedFieldName);
        if (!fieldSelectionSet || result.every(t => joinNotNeeded(t))) {
            return [undefined, undefined];
        }
        
        const map = new Map<string, BlockchainTransaction[]>();
        result.forEach(t => {
            if (joinNotNeeded(t)) {
                return;
            }

            const onFieldValue = onField(t);
            if (!onFieldValue) {
                // TODO: Consider metric for unexpected errors
                throw QError.create(500, "join field is missing from query result");    
            }

            function addToMap(fieldValue: string) {
                const record = map.get(fieldValue);
                if (record) {
                    record.push(t);
                } else {
                    map.set(fieldValue, [t]);
                }
            }

            if (typeof onFieldValue === "string") {
                addToMap(onFieldValue);
            } else {
                for (const fv of onFieldValue) {
                    if (fv) {
                        addToMap(fv);
                    } // TODO: Else metric?
                }
            }
        });

        return [fieldSelectionSet, map];
    }

    const [inMessageSelectionSet, inMessageTransactionMap] =
        getFetchPlan("in_message", t => t.in_msg, t => !!t.in_message == !!t.in_msg);
    const [outMessagesSelectionSet, outMessagesTransactionMap] =
        getFetchPlan("out_messages", t => t.out_msgs, t => t.out_messages?.length == t.out_msgs?.length);

    if (!inMessageSelectionSet && !outMessagesSelectionSet) {
        return;
    }

    const params = new QParams();
    const queries = [];
    if (inMessageSelectionSet && inMessageTransactionMap) {
        const inMessageReturnExpression = buildReturnExpression({
            type: context.services.data.messages.docType,
            selectionSet: inMessageSelectionSet,
            excludedFields: ["hash"],
            path: "msg",
        });
        const query = `in_messages:` +
            `(FOR msg IN messages ` +
            `FILTER msg._key IN @${params.add([...inMessageTransactionMap.keys()])} ` +
            `RETURN ${inMessageReturnExpression})`;
        queries.push(query);
    }
    if (outMessagesSelectionSet && outMessagesTransactionMap) {
        const outMessagesReturnExpression = buildReturnExpression({
            type: context.services.data.messages.docType,
            selectionSet: outMessagesSelectionSet,
            excludedFields: ["hash"],
            path: "msg",
        });
        const query = `out_messages:` +
            `(FOR msg IN messages ` +
            `FILTER msg._key IN @${params.add([...outMessagesTransactionMap.keys()])} ` +
            `RETURN ${outMessagesReturnExpression})`;
        queries.push(query);
    }

    const queryResult = await context.services.data.query(
        required(context.services.data.messages.provider),
        {
            text: `RETURN {${queries.join(',')}}`,
            vars: params.values,
            orderBy: [],
            request: context,
            traceSpan,
        },
    ) as unknown as { in_messages: BlockchainMessage[], out_messages: BlockchainMessage[] }[];

    if (inMessageTransactionMap) {
        for (const message of queryResult.flatMap(r => r.in_messages)) {
            const transactions = inMessageTransactionMap.get(message._key)
            if (!transactions) {
                continue; // this code branch is expected to never be hit
            }
            for (const transaction of transactions) {
                transaction.in_message = message;
            }
        }
    }
    if (outMessagesTransactionMap) {
        for (const message of queryResult.flatMap(r => r.out_messages)) {
            const transactions = outMessagesTransactionMap.get(message._key)
            if (!transactions) {
                continue; // this code branch is expected to never be hit
            }
            for (const transaction of transactions) {
                if (transaction.out_messages) {
                    transaction.out_messages.push(message);
                } else {
                    transaction.out_messages = [message];
                }
            }
        }
    }
}

async function fetchAccountForTransactionsIfNeeded(
    result: BlockchainTransaction[],
    selectionSet: SelectionSetNode | undefined,
    context: QRequestContext,
    traceSpan: QTraceSpan,
) {
    const accountSelectionSet = getFieldSelectionSet(selectionSet, "account");
    if (!accountSelectionSet || result.every(t => isDefined(t.account))) {
        return;
    }
    const transactionsToFix = new Map<string, BlockchainTransaction[]>();
    result.forEach(t => {
        if (isDefined(t.account)) {
            return;
        }
        if (!t.account_addr) {
            throw QError.create(500, "account_addr is missing from query result");
        }
        const arr = transactionsToFix.get(t.account_addr);
        if (arr) {
            arr.push(t);
        } else {
            transactionsToFix.set(t.account_addr, [t]);
        }
    });

    // TODO: Add metric: we want to know if this code branch was hit
    const accountReturnExpression = buildReturnExpression({
        type: context.services.data.accounts.docType,
        selectionSet: accountSelectionSet,
        excludedFields: ["address"],
        path: "acc",
    });
    const params = new QParams();
    const query = `
        FOR acc IN accounts
        FILTER acc._key IN @${params.add([...transactionsToFix.keys()])}
        RETURN ${accountReturnExpression}
    `;
    const queryResult = await context.services.data.query(
        required(context.services.data.accounts.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [],
            request: context,
            traceSpan,
        },
    ) as BlockchainAccount[];

    for (const account of queryResult) {
        const transactions = transactionsToFix.get(account._key)
        if (!transactions) {
            continue; // this code branch is expected to never be hit
        }
        for (const transaction of transactions) {
            transaction.account = account;
        }
    }
}

async function resolve_workchain_transactions(
    args: BlockchainQueryWorkchain_TransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
    
    if (isDefined(args.workchain)) {
        filters.push(`doc.workchain_id == @${params.add(args.workchain)}`);
    }
    if (isDefined(args.min_balance_delta)) {
        const min_balance_delta = convertBigUInt(2, args.min_balance_delta);
        filters.push(`doc.balance_delta >= @${params.add(min_balance_delta)}`);
    }
    if (isDefined(args.max_balance_delta)) {
        const max_balance_delta = convertBigUInt(2, args.max_balance_delta);
        filters.push(`doc.balance_delta <= @${params.add(max_balance_delta)}`);
    }

    const { direction, limit } = processPaginationArgs(args);

    const selectionSet = getNodeSelectionSetForConnection(info);
    const returnExpression = buildTransactionReturnExpression(selectionSet, context);

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
            orderBy: [{ path: "chain_order", direction: "ASC" }],
            request: context,
            traceSpan,
        },
    ) as BlockchainTransaction[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        async r => {
            await fetchAccountForTransactionsIfNeeded(r, selectionSet, context, traceSpan);
            await fetchMessagesForTransactionsIfNeeded(r, selectionSet, context, traceSpan);
        },
    ) as BlockchainTransactionsConnection;
}

async function resolve_account_transactions(
    accessRights: AccessRights,
    args: BlockchainQueryAccount_TransactionsArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    // validate args
    const restrictToAccounts = accessRights.restrictToAccounts;
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

    const { direction, limit } = processPaginationArgs(args);

    let selectionSet = getNodeSelectionSetForConnection(info);
    let returnExpression = buildTransactionReturnExpression(selectionSet, context);

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
            orderBy: [{ path: "chain_order", direction: "ASC" }],
            request: context,
            traceSpan,
        },
    ) as BlockchainTransaction[];

    return await processPaginatedQueryResult(
        queryResult,
        limit,
        direction,
        async r => {
            await fetchAccountForTransactionsIfNeeded(r, selectionSet, context, traceSpan);
            await fetchMessagesForTransactionsIfNeeded(r, selectionSet, context, traceSpan);
        },
    ) as BlockchainTransactionsConnection;
}

export const resolvers: Resolvers<QRequestContext> = {
    Query: {
        master_seq_no_range: (_parent, args, context) => {
            return context.trace("master_seq_no_range", async traceSpan => {
                return await resolve_maser_seq_no_range(args, context, traceSpan);
            });
        },
        key_blocks: async (_parent, args, context, info) => {
            return context.trace("resolve_key_blocks", async traceSpan => {
                return await resolve_key_blocks(args, context, info, traceSpan);
            });
        },
        workchain_blocks: async (_parent, args, context, info) => {
            return context.trace("resolve_workchain_blocks", async traceSpan => {
                return await resolve_workchain_blocks(args, context, info, traceSpan);
            });
        },
        workchain_transactions: async (_parent, args, context, info) => {
            return context.trace("workchain_transactions", async traceSpan => {
                return await resolve_workchain_transactions(args, context, info, traceSpan);
            });
        },
        account_transactions: async (_parent, args, context, info) => {
            const accessRights = await context.requireGrantedAccess(args);
            return context.trace("account_transactions", async traceSpan => {
                return await resolve_account_transactions(accessRights, args, context, info, traceSpan);
            });
        },
        blockchain: async (_parent, args, context) => {
            return {
                accessRights: await context.requireGrantedAccess(args)
            };
        },
    },
    BlockchainQuery: {
        master_seq_no_range: (_parent, args, context) => {
            return context.trace("blockchain-master_seq_no_range", async traceSpan => {
                return await resolve_maser_seq_no_range(args, context, traceSpan);
            });
        },
        key_blocks: async (_parent, args, context, info) => {
            return context.trace("blockchain-resolve_key_blocks", async traceSpan => {
                return await resolve_key_blocks(args, context, info, traceSpan);
            });
        },
        workchain_blocks: async (_parent, args, context, info) => {
            return context.trace("blockchain-resolve_workchain_blocks", async traceSpan => {
                return await resolve_workchain_blocks(args, context, info, traceSpan);
            });
        },
        workchain_transactions: async (_parent, args, context, info) => {
            return context.trace("blockchain-workchain_transactions", async traceSpan => {
                return await resolve_workchain_transactions(args, context, info, traceSpan);
            });
        },
        account_transactions: async (parent, args, context, info) => {
            return context.trace("blockchain-account_transactions", async traceSpan => {
                return await resolve_account_transactions(parent.accessRights, args, context, info, traceSpan);
            });
        },
    },
    Node: {
        __resolveType: (parent) => {
            // it could fail if parent is a value from db instead of a value with resolved fields
            // need to test
            switch(parent.id.split("/")[0]) {
                case "transaction":
                    return "BlockchainTransaction";
                default:
                    return null;
            }
        }
    },
};
