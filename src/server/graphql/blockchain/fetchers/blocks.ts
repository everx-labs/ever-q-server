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
    BlockchainQueryArgs,
    BlockchainQueryKey_BlocksArgs,
    BlockchainQueryWorkchain_BlocksArgs,
} from "../resolvers-types-generated";


export async function resolve_key_blocks(
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

export async function resolve_workchain_blocks(
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
