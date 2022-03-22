import { GraphQLResolveInfo } from "graphql";

import { QParams } from "../../../filter/filters";
import { QRequestContext } from "../../../request";
import { QTraceSpan } from "../../../tracing";
import { QError, required } from "../../../utils";

import { config } from "../config";
import {
    Direction,
    getNodeSelectionSetForConnection,
    isDefined,
    prepareChainOrderFilter,
    processPaginatedQueryResult,
    processPaginationArgs,
} from "../helpers";
import {
    BlockchainBlock,
    BlockchainBlocksConnection,
    BlockchainQueryBlocksArgs,
    BlockchainQueryKey_BlocksArgs,
} from "../resolvers-types-generated";


export async function resolve_block(
    hash: String,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 1;

    const selectionSet = info.fieldNodes[0].selectionSet;
    const returnExpression = config.blocks.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc"
    );

    // query
    const params = new QParams();
    const query =
        "FOR doc IN blocks " +
        `FILTER doc._key == @${params.add(hash)} ` +
        `RETURN ${returnExpression}`;
    const queryResult = await context.services.data.query(
        required(context.services.data.blocks.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [],
            request: context,
            traceSpan,
            // TODO: shard
        },
    ) as BlockchainBlock[];

    await config.blocks.fetchJoins(
        queryResult,
        selectionSet,
        context,
        traceSpan,
        maxJoinDepth,
    );

    return queryResult[0];
}

export async function resolve_key_blocks(
    args: BlockchainQueryKey_BlocksArgs,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    // filters
    const filters: string[] = [];
    const params = new QParams();

    await prepareChainOrderFilter(args, params, filters, context);
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
        "chain_order",
    ) as BlockchainBlocksConnection;
}

export async function resolve_blockchain_blocks(
    args: BlockchainQueryBlocksArgs,
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
        "chain_order",
    ) as BlockchainBlocksConnection;
}
