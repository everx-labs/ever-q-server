import { FieldNode, GraphQLResolveInfo, SelectionSetNode } from "graphql"
import { QParams } from "../../filter/filters"
import { QRequestContext } from "../../request"
import { QError, toU64String } from "../../utils"
import {
    BlockchainMasterSeqNoFilter,
    Maybe,
    Scalars,
} from "./resolvers-types-generated"

export const enum Direction {
    Forward,
    Backward,
}

export type PaginationArgs = {
    first?: Maybe<Scalars["Int"]>
    after?: Maybe<Scalars["String"]>
    last?: Maybe<Scalars["Int"]>
    before?: Maybe<Scalars["String"]>
}

export function processPaginationArgs(args: PaginationArgs) {
    if (args.first && args.last) {
        throw QError.invalidQuery(
            '"first" and "last" shouldn\'t be used simultaneously',
        )
    }
    if (args.first && args.before) {
        throw QError.invalidQuery('"first" should not be used with "before"')
    }
    if (args.last && args.after) {
        throw QError.invalidQuery('"last" should not be used with "after"')
    }
    if (args.first && args.first < 1) {
        throw QError.invalidQuery('"first" should not be less than than 1')
    }
    if (args.last && args.last < 1) {
        throw QError.invalidQuery('"last" should not be less than than 1')
    }
    const limit = 1 + Math.min(50, args.first ?? 50, args.last ?? 50)
    const direction =
        args.last || args.before ? Direction.Backward : Direction.Forward
    return {
        direction,
        limit,
    }
}

export type ChainOrderFilterArgs = {
    allow_latest_inconsistent_data?: Maybe<Scalars["Boolean"]>
    master_seq_no_range?: Maybe<BlockchainMasterSeqNoFilter>
    after?: Maybe<Scalars["String"]>
    before?: Maybe<Scalars["String"]>
}

export async function prepareChainOrderFilter(
    args: ChainOrderFilterArgs,
    params: QParams,
    filters: string[],
    context: QRequestContext,
    archive: boolean,
    chainOrderFieldName = "chain_order",
) {
    // master_seq_no
    let start_chain_order = args.master_seq_no_range?.start
        ? toU64String(args.master_seq_no_range.start)
        : null
    let end_chain_order = args.master_seq_no_range?.end
        ? toU64String(args.master_seq_no_range.end)
        : null

    // before, after
    start_chain_order =
        args.after && (!start_chain_order || args.after > start_chain_order)
            ? args.after
            : start_chain_order
    end_chain_order =
        args.before && (!end_chain_order || args.before < end_chain_order)
            ? args.before
            : end_chain_order

    if (!args.allow_latest_inconsistent_data) {
        // reliable boundary
        const reliable =
            await context.services.data.getReliableChainOrderUpperBoundary(
                context,
                archive,
            )

        end_chain_order =
            end_chain_order && end_chain_order < reliable.boundary
                ? end_chain_order
                : reliable.boundary
    }

    // apply
    if (start_chain_order) {
        const paramName = params.add(start_chain_order)
        filters.push(`doc.${chainOrderFieldName} > @${paramName}`)
    } else {
        // Next line is equivalent to "chain_order != null", but the ">=" is better:
        // we doesn't have to rely on arangodb to convert "!= null" to index scan boundary
        filters.push(`doc.${chainOrderFieldName} >= ""`)
    }

    if (end_chain_order) {
        const paramName = params.add(end_chain_order)
        filters.push(`doc.${chainOrderFieldName} < @${paramName}`)
    }
}

export interface CursorConverter {
    toDb(value: string): string
    fromDb(value: string): string
}

export const stringCursor: CursorConverter = {
    fromDb(value) {
        return value
    },
    toDb(value) {
        return value
    },
}

export const u64StringCursor: CursorConverter = {
    fromDb(value) {
        return `0x${value.substring(1)}`
    },
    toDb(value) {
        return toU64String(BigInt(value))
    },
}

function cursorToDb(
    value: string | undefined | null,
    converter: CursorConverter,
): string | undefined | null {
    return value !== undefined && value !== null ? converter.toDb(value) : value
}

function cursorFromDb(
    value: string | null | undefined,
    converter: CursorConverter,
): string | undefined | null {
    return value !== undefined && value !== null
        ? converter.fromDb(value)
        : value
}

export async function prepareNonChainOrderPaginationFilter(
    args: ChainOrderFilterArgs,
    params: QParams,
    filters: string[],
    context: QRequestContext,
    archive: boolean,
    paginationFieldName: string,
    cursorConverter: CursorConverter,
    chainOrderFieldName = "chain_order",
) {
    // master_seq_no
    const start_chain_order = args.master_seq_no_range?.start
        ? toU64String(args.master_seq_no_range.start)
        : null
    let end_chain_order = args.master_seq_no_range?.end
        ? toU64String(args.master_seq_no_range.end)
        : null

    if (!args.allow_latest_inconsistent_data) {
        // reliable boundary
        const reliable =
            await context.services.data.getReliableChainOrderUpperBoundary(
                context,
                archive,
            )

        end_chain_order =
            end_chain_order && end_chain_order < reliable.boundary
                ? end_chain_order
                : reliable.boundary
    }

    // apply
    if (start_chain_order) {
        const paramName = params.add(start_chain_order)
        filters.push(`doc.${chainOrderFieldName} > @${paramName}`)
    }

    if (end_chain_order) {
        const paramName = params.add(end_chain_order)
        filters.push(`doc.${chainOrderFieldName} < @${paramName}`)
    }

    if (args.after) {
        const paramName = params.add(cursorToDb(args.after, cursorConverter))
        filters.push(`doc.${paginationFieldName} > @${paramName}`)
    }

    if (args.before) {
        const paramName = params.add(cursorToDb(args.before, cursorConverter))
        filters.push(`doc.${paginationFieldName} < @${paramName}`)
    }
}

export function getNodeSelectionSetForConnection(info: GraphQLResolveInfo) {
    const edgesNode = info.fieldNodes[0].selectionSet?.selections.find(
        s => s.kind == "Field" && s.name.value == "edges",
    ) as FieldNode | undefined
    const nodeNode = edgesNode?.selectionSet?.selections.find(
        s => s.kind == "Field" && s.name.value == "node",
    ) as FieldNode | undefined
    return nodeNode?.selectionSet
}

export function getFieldSelectionSet(
    selectionSet: SelectionSetNode | undefined,
    fieldName: string,
): SelectionSetNode | undefined {
    return (
        selectionSet?.selections?.find(
            s => s.kind == "Field" && s.name.value == fieldName,
        ) as FieldNode
    )?.selectionSet
}

export async function processPaginatedQueryResult<T>(
    queryResult: T[],
    limit: number,
    direction: Direction,
    cursorField: KeyOfWithValueOf<T, Maybe<Scalars["String"]>>,
    cursorConverter: CursorConverter,
    afterFilterCallback?: (result: T[]) => Promise<void>,
) {
    // sort query result by chain_order ASC
    queryResult.sort((a, b) => {
        if (!a[cursorField] || !b[cursorField]) {
            throw QError.create(500, "sort field not found")
        }
        if (a[cursorField] > b[cursorField]) {
            return 1
        }
        if (a[cursorField] < b[cursorField]) {
            return -1
        }
        throw QError.create(500, "two entities with the same sort field")
    })

    // limit result length
    const hasMore = queryResult.length >= limit
    if (hasMore) {
        switch (direction) {
            case Direction.Forward:
                queryResult.splice(limit - 1)
                break
            case Direction.Backward:
                queryResult.splice(0, queryResult.length - limit + 1)
                break
        }
    }

    if (afterFilterCallback) {
        await afterFilterCallback(queryResult)
    }

    return {
        edges: queryResult.map(record => {
            return {
                node: record,
                cursor: cursorFromDb(
                    record[cursorField] as any,
                    cursorConverter,
                ),
            }
        }),
        pageInfo: {
            startCursor:
                queryResult.length > 0
                    ? cursorFromDb(
                          queryResult[0][cursorField] as any,
                          cursorConverter,
                      )
                    : "",
            endCursor:
                queryResult.length > 0
                    ? cursorFromDb(
                          queryResult[queryResult.length - 1][
                              cursorField
                          ] as any,
                          cursorConverter,
                      )
                    : "",
            hasNextPage: direction == Direction.Forward ? hasMore : false,
            hasPreviousPage: direction == Direction.Backward ? hasMore : false,
        },
    }
}

export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== undefined && value !== null
}

export type KeyOf<T> = Extract<keyof T, string>
export type KeyOfWithValueOf<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T]
