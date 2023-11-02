import { GraphQLResolveInfo, SelectionSetNode } from "graphql"

import {
    convertBigUInt,
    NumericScalar,
    QParams,
    resolveBigUInt,
} from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import { QTraceSpan } from "../../../tracing"
import { cloneValue, QError, required } from "../../../utils"

import { config } from "../config"
import {
    BlockchainAccount,
    BlockchainAccountQueryInfoArgs,
} from "../resolvers-types-generated"
import { INodeClient } from "../../../data/node-client"
import { BocModule } from "@eversdk/core"

type DbDocFields = {
    bigUInt1: Set<string>
    bigUInt2: Set<string>
}

export function convertDocFromDb(
    doc: any,
    format: "HEX" | "DEC",
    fields: DbDocFields,
): any {
    return cloneValue(doc, (p, v) => {
        if (fields.bigUInt1.has(p)) {
            return resolveBigUInt(1, v as NumericScalar, { format })
        }
        if (fields.bigUInt2.has(p)) {
            return resolveBigUInt(2, v as NumericScalar, { format })
        }
        return v
    })
}

export function convertDocToDb(doc: any, fields: DbDocFields): any {
    const dbDoc = cloneValue(doc, (p, v) => {
        if (fields.bigUInt1.has(p)) {
            return convertBigUInt(1, v as NumericScalar)
        }
        if (fields.bigUInt2.has(p)) {
            return convertBigUInt(2, v as NumericScalar)
        }
        return v
    })
    if (!dbDoc._key && dbDoc.id) {
        dbDoc._key = dbDoc.id
    }
    return dbDoc
}

export const accountDbFields = {
    bigUInt1: new Set(["bits", "cells", "public_cells", "last_trans_lt"]),
    bigUInt2: new Set(["balance"]),
}
export async function resolve_account(
    address: string,
    byBlock: string | undefined | null,
    context: QRequestContext,
    info: GraphQLResolveInfo,
    traceSpan: QTraceSpan,
) {
    const maxJoinDepth = 1

    const selectionSet = info.fieldNodes[0].selectionSet ?? {
        kind: "SelectionSet",
        selections: [],
    }
    let queryResult: BlockchainAccount[]
    const provider = context.services.data.nodeClient
    if (provider) {
        queryResult = await queryNode(
            address,
            byBlock,
            selectionSet,
            provider,
            context.services.client.boc,
        )
    } else {
        if (byBlock !== undefined && byBlock !== null) {
            throw QError.invalidQuery(
                "`byBlock` parameter is not supported on this endpoint",
            )
        }
        const returnExpression = config.accounts.buildReturnExpression(
            selectionSet,
            context,
            maxJoinDepth,
            "doc",
        )

        // query
        const params = new QParams({
            stringifyKeyInAqlComparison:
                context.services.config.queries.filter
                    .stringifyKeyInAqlComparison,
        })
        const query =
            "FOR doc IN accounts " +
            `FILTER doc._key == @${params.add(address)} ` +
            `RETURN ${returnExpression}`
        queryResult = (await context.services.data.query(
            required(context.services.data.accounts.provider),
            {
                text: query,
                vars: params.values,
                orderBy: [],
                request: context,
                traceSpan,
            },
        )) as BlockchainAccount[]
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

async function queryNode(
    address: string,
    byBlock: string | undefined | null,
    selection: SelectionSetNode,
    provider: INodeClient,
    sdk: BocModule,
): Promise<BlockchainAccount[]> {
    let bocRequested = false
    let dataRequested = false
    let codeRequested = false
    let metaRequested = false
    for (const field of selection.selections) {
        if (field.kind === "Field") {
            switch (field.name.value) {
                case "boc":
                    bocRequested = true
                    break
                case "code":
                    codeRequested = true
                    break
                case "data":
                    dataRequested = true
                    break
                default:
                    metaRequested = true
                    break
            }
        }
    }
    let result: BlockchainAccount | undefined = undefined
    if (bocRequested || dataRequested || codeRequested) {
        const bocs = await provider.getAccountBocs([{ address, byBlock }])
        const boc = bocs.get(address)
        if (boc) {
            if (dataRequested || codeRequested || metaRequested) {
                result = (await sdk.parse_account({ boc })).parsed
            } else {
                result = { _key: address, id: address, boc }
            }
        }
    } else if (metaRequested) {
        const metas = await provider.getAccountMetas([{ address, byBlock }])
        const meta = metas.get(address)
        if (meta) {
            meta.id = meta.address
            result = meta
        }
    }
    return result ? [convertDocToDb(result, accountDbFields)] : []
}

export function accountResolver(addressField: string) {
    return async (
        parent: Record<string, any>,
        args: BlockchainAccountQueryInfoArgs,
        context: QRequestContext,
        info: GraphQLResolveInfo,
    ) => {
        return context.trace("blockchain-account-info", async traceSpan => {
            const address = parent[addressField]
            if (!address) {
                return null
            }
            return resolve_account(
                address,
                args.byBlock,
                context,
                info,
                traceSpan,
            )
        })
    }
}
