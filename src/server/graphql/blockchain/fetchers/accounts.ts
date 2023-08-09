import { GraphQLResolveInfo, SelectionSetNode } from "graphql"

import { QParams } from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import { QTraceSpan } from "../../../tracing"
import { required } from "../../../utils"

import { config } from "../config"
import { BlockchainAccount } from "../resolvers-types-generated"
import { selectionContains } from "../boc-parsers"
import { IAccountProvider } from "../../../data/account-provider"
import { BocModule } from "@eversdk/core"

export async function resolve_account(
    address: String,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 1

    const selectionSet = info.fieldNodes[0].selectionSet
    const returnExpression = config.accounts.buildReturnExpression(
        selectionSet,
        context,
        maxJoinDepth,
        "doc",
    )

    // query
    const params = new QParams({
        stringifyKeyInAqlComparison:
            context.services.config.queries.filter.stringifyKeyInAqlComparison,
    })
    const query =
        "FOR doc IN accounts " +
        `FILTER doc._key == @${params.add(address)} ` +
        `RETURN ${returnExpression}`
    const queryResult = (await context.services.data.query(
        required(context.services.data.accounts.provider),
        {
            text: query,
            vars: params.values,
            orderBy: [],
            request: context,
            traceSpan,
        },
    )) as BlockchainAccount[]

    const provider = context.services.data.accountProvider
    if (provider && selectionSet) {
        await getBocFields(
            queryResult,
            selectionSet,
            provider,
            context.services.client.boc,
        )
    }
    if (queryResult.length === 0) {
        queryResult.push({
            _key: `${address}`,
            acc_type: 3,
            balance: "000",
            workchain_id: parseInt(address.split(":")[0]) || 0,
        } as BlockchainAccount)
    }
    await config.accounts.fetchJoins(
        queryResult,
        selectionSet,
        context,
        traceSpan,
        maxJoinDepth,
        false,
    )

    return queryResult[0]
}

async function getBocFields(
    accounts: BlockchainAccount[],
    selection: SelectionSetNode,
    provider: IAccountProvider,
    sdk: BocModule,
) {
    const bocRequested = selectionContains(selection, "boc")
    const dataRequested = selectionContains(selection, "data")
    const codeRequested = selectionContains(selection, "code")
    if (!(bocRequested || dataRequested || codeRequested)) {
        return
    }
    const bocs = await provider.getBocs(accounts.map(x => x._key))
    for (const account of accounts) {
        const boc = bocs.get(account._key)
        if (!boc) {
            continue
        }
        if (bocRequested) {
            account.boc = boc
        }
        if (dataRequested || codeRequested) {
            const parsed = (await sdk.parse_account({ boc })).parsed
            if (dataRequested) {
                account.data = parsed.data
            }
            if (codeRequested) {
                account.code = parsed.code
            }
        }
    }
}

export function accountResolver(addressField: string) {
    return async (
        parent: Record<string, any>,
        _args: unknown,
        context: QRequestContext,
        info: GraphQLResolveInfo,
    ) => {
        return context.trace("blockchain-account-info", async traceSpan => {
            const address = parent[addressField]
            if (!address) {
                return null
            }
            return resolve_account(address, context, info, traceSpan)
        })
    }
}
