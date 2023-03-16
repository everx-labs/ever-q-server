import type { OrderBy } from "./filters"

export interface CollectionQueryPattern {
    filter: Record<string, unknown>
    orderBy: string[]
}

export type QueryPatternsByCollection<P extends CollectionQueryPattern> = {
    [collection: string]: P[]
}

export function findCollectionQueryPattern<P extends CollectionQueryPattern>(
    patterns: QueryPatternsByCollection<P>,
    collection: string,
    filter: Record<string, unknown> | null | undefined,
    orderBy: OrderBy[] | null | undefined,
): P | undefined {
    if (!filter) {
        return undefined
    }
    const collectionPatterns = patterns[collection]
    if (collectionPatterns === undefined) {
        return undefined
    }
    for (const pattern of collectionPatterns) {
        if (
            filterMatch(filter, pattern.filter) &&
            orderByMatch(orderBy, pattern.orderBy)
        ) {
            return pattern
        }
    }
    return undefined
}

function filterMatch(
    filter: Record<string, unknown>,
    pattern: Record<string, unknown>,
): boolean {
    for (const [name, nestedPattern] of Object.entries(pattern)) {
        const nestedFilter = filter[name]
        if (nestedFilter === undefined) {
            return false
        }
        if (nestedPattern !== null) {
            if (
                !filterMatch(
                    nestedFilter as Record<string, unknown>,
                    nestedPattern as Record<string, unknown>,
                )
            ) {
                return false
            }
        }
    }
    return true
}

function orderByMatch(
    orderBy: OrderBy[] | null | undefined,
    pattern: string[],
) {
    if (orderBy === null || orderBy === undefined) {
        return pattern.length === 0
    }
    for (const orderByPath of pattern) {
        if (!orderBy.find(x => x.path === orderByPath)) {
            return false
        }
    }
    return true
}
