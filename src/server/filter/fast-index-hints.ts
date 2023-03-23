import type { OrderBy } from "./filters"
import {
    findCollectionQueryPattern,
    QueryPatternsByCollection,
} from "./query-pattern"

type QueryIndexHint = {
    filter: Record<string, unknown>
    orderBy: string[]
    indexHint: string
}

const fastIndexHints: QueryPatternsByCollection<QueryIndexHint> = {
    messages: [
        {
            filter: {
                dst: null,
                src: null,
            },
            orderBy: ["created_at"],
            indexHint: "idx_src_dst_created_at",
        },
    ],
}

export function getFastIndexHint(
    collection: string,
    filter: Record<string, unknown> | null | undefined,
    orderBy: OrderBy[] | null | undefined,
): string | undefined {
    return findCollectionQueryPattern(
        fastIndexHints,
        collection,
        filter,
        orderBy,
    )?.indexHint
}
