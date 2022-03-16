import { GraphQLResolveInfo } from "graphql";

import { QParams } from "../../../filter/filters";
import { QRequestContext } from "../../../request";
import { QTraceSpan } from "../../../tracing";
import { required } from "../../../utils";

import { config } from "../config";
import { getNodeSelectionSetForConnection } from "../helpers";
import { BlockchainAccount } from "../resolvers-types-generated";

export async function resolve_account(
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
