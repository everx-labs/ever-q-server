import { IResolvers } from "apollo-server-express"
import { CollectionFilter, OrderBy } from "../filter/filters"
import { QRequestContext, QRequestServices } from "../request"
import { GraphQLResolveInfo } from "graphql"
import { QResult } from "../data/data-provider"
import {
    BlockchainBlock,
    BlockchainQueryKey_BlocksArgs,
} from "./blockchain/resolvers-types-generated"
import { CachedData, CachedDataOptions } from "../cached-data"
import { QTraceSpan } from "../tracing"
import {
    Direction,
    processPaginatedQueryResult,
    stringCursor,
} from "./blockchain/helpers"

type OriginalResolvers = {
    Query: {
        blocks: (
            parent: unknown,
            args: {
                filter?: CollectionFilter | null
                orderBy?: OrderBy[] | null
                limit?: number | null
                timeout?: number | null
            },
            context: QRequestContext,
            info: GraphQLResolveInfo,
        ) => Promise<QResult[]>
    }
    BlockchainQuery: {
        key_blocks: (
            parent: unknown,
            args: BlockchainQueryKey_BlocksArgs,
            context: QRequestContext,
            info: GraphQLResolveInfo,
        ) => Promise<QResult[]>
    }
}

export function lastKeyBlockResolvers(
    originalResolvers: IResolvers,
    services: QRequestServices,
    ttlMs: number,
) {
    const originalBlocks = (originalResolvers as OriginalResolvers).Query.blocks
    const originalKeyBlocks = (originalResolvers as OriginalResolvers)
        .BlockchainQuery.key_blocks
    const lastKeyBlocks = new LastKeyBlocksCache(services, {
        ttlMs,
    })
    return {
        Query: {
            blocks: async (
                parent: unknown,
                args: {
                    filter?: CollectionFilter | null
                    orderBy?: OrderBy[] | null
                    limit?: number | null
                    timeout?: number | null
                },
                context: QRequestContext,
                info: GraphQLResolveInfo,
            ) => {
                if (isLastKeyBlockBlocksQuery(args)) {
                    return await lastKeyBlocks.get()
                }
                return await originalBlocks(parent, args, context, info)
            },
        },
        BlockchainQuery: {
            key_blocks: async (
                parent: unknown,
                args: BlockchainQueryKey_BlocksArgs,
                context: QRequestContext,
                info: GraphQLResolveInfo,
            ) => {
                if (isLastKeyBlockBlockchainQuery(args)) {
                    return await processPaginatedQueryResult(
                        await lastKeyBlocks.get(),
                        2,
                        Direction.Backward,
                        "chain_order",
                        stringCursor,
                    )
                }
                return await originalKeyBlocks(parent, args, context, info)
            },
        },
    }
}

function isLastKeyBlockBlockchainQuery(
    args: BlockchainQueryKey_BlocksArgs,
): boolean {
    return (
        !args.master_seq_no_range &&
        !args.first &&
        !args.after &&
        args.last === 1 &&
        !args.before
    )
}

const keyBlockAndWorkchainId = new Set(["key_block", "workchain_id"])
const eq = new Set(["eq"])

function isLastKeyBlockBlocksQuery(args: {
    filter?: CollectionFilter | null
    orderBy?: OrderBy[] | null
    limit?: number | null
    timeout?: number | null
}): boolean {
    if (args.limit !== 1) {
        return false
    }
    if (!args.orderBy || args.orderBy.length !== 1) {
        return false
    }
    const orderBy = args.orderBy[0]
    if (!(orderBy.direction === "DESC" && orderBy.path === "seq_no")) {
        return false
    }
    if (!args.filter) {
        return false
    }
    const filter = args.filter as any
    return (
        hasExactOwnProperties(filter, keyBlockAndWorkchainId) &&
        hasExactOwnProperties(filter.key_block, eq) &&
        hasExactOwnProperties(filter.workchain_id, eq) &&
        filter.key_block.eq === true &&
        filter.workchain_id.eq === -1
    )
}

function hasExactOwnProperties(
    obj: Record<string, any>,
    names: Set<string>,
): boolean {
    for (const name of Object.getOwnPropertyNames(obj)) {
        if (!names.has(name)) {
            return false
        }
    }
    return true
}

export class LastKeyBlocksCache extends CachedData<BlockchainBlock[]> {
    private readonly traceSpan: QTraceSpan
    constructor(
        private services: QRequestServices,
        options: CachedDataOptions,
    ) {
        super(options)
        this.traceSpan = QTraceSpan.create(
            services.tracer,
            "last-key-block-cache",
        )
    }

    async loadActual(): Promise<BlockchainBlock[]> {
        const request = new QRequestContext(this.services, undefined, undefined)
        const result = (await this.services.data.blocks.provider?.query({
            text: `
                FOR block IN blocks
                FILTER block.workchain_id == -1 AND block.key_block
                SORT block.chain_order DESC
                LIMIT 1
                RETURN block
            `,
            vars: {},
            orderBy: [{ path: "seq_no", direction: "DESC" }],
            request,
            traceSpan: this.traceSpan,
        })) as BlockchainBlock[] | undefined
        if (!result) {
            return []
        }
        if (result.length > 0) {
            result[0].hash = result[0]._key
        }
        return result
    }
}
