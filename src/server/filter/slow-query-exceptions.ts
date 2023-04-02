import type { OrderBy } from "./filters"
import {
    findCollectionQueryPattern,
    QueryPatternsByCollection,
} from "./query-pattern"

type SlowQueryException = {
    filter: Record<string, unknown>
    orderBy: string[]
    msMed: number
    count: number
}

const slowQueryExceptions: QueryPatternsByCollection<SlowQueryException> = {
    transactions: [
        {
            filter: { lt: { gt: null }, workchain_id: { eq: null } },
            orderBy: ["lt"],
            msMed: 29,
            count: 2252143,
        },
        {
            filter: {
                destroyed: { ne: null },
                lt: { ge: null },
                now: { ge: null, lt: null },
                tr_type: { eq: null },
                workchain_id: { eq: null },
            },
            orderBy: [],
            msMed: 15,
            count: 123457,
        },
        {
            filter: { balance_delta: { gt: null } },
            orderBy: ["lt"],
            msMed: 246,
            count: 57419,
        },
        {
            filter: {
                balance_delta: { gt: null },
                bounce: { bounce_type: { ne: null } },
                now: { ge: null, lt: null },
            },
            orderBy: [],
            msMed: 74,
            count: 10264,
        },
        {
            filter: {
                account_addr: { eq: null },
                end_status: { eq: null },
                in_message: { msg_type: { eq: null } },
                orig_status: { eq: null },
            },
            orderBy: [],
            msMed: 17,
            count: 1226,
        },
    ],
    messages: [
        {
            filter: {
                created_at: { gt: null },
                created_lt: { gt: null },
                msg_type: { eq: null },
                src: { eq: null },
                status: { eq: null },
            },
            orderBy: ["created_lt"],
            msMed: 19,
            count: 370565,
        },
        {
            filter: {
                OR: {
                    created_at: { lt: null },
                    created_lt: { gt: null },
                    dst: { eq: null },
                    msg_type: { eq: null },
                    value: { gt: null },
                },
                created_at: { lt: null },
                created_lt: { gt: null },
                msg_type: { eq: null },
                src: { eq: null },
                value: { gt: null },
            },
            orderBy: ["created_lt", "created_at"],
            msMed: 24,
            count: 149791,
        },
        {
            filter: {
                created_lt: { gt: null },
                dst: { eq: null },
                msg_type: { eq: null },
                src: { eq: null },
            },
            orderBy: ["created_at"],
            msMed: 23,
            count: 120314,
        },
        {
            filter: {
                created_at: { gt: null },
                created_lt: { gt: null },
                dst: { eq: null },
                msg_type: { eq: null },
                status: { eq: null },
            },
            orderBy: ["created_lt"],
            msMed: 19,
            count: 104943,
        },
        {
            filter: { dst: { eq: null }, value: { ne: null } },
            orderBy: ["created_at", "created_lt"],
            msMed: 31,
            count: 10260,
        },
        {
            filter: {
                created_at: { ge: null, lt: null },
                dst: { eq: null },
                value: { gt: null },
            },
            orderBy: ["created_at", "id"],
            msMed: 64,
            count: 6891,
        },
        {
            filter: {
                created_at: { gt: null, lt: null },
                dst: { eq: null },
                value: { gt: null },
            },
            orderBy: ["created_at", "id"],
            msMed: 71,
            count: 5244,
        },
        {
            filter: {
                created_at: { eq: null },
                dst: { eq: null },
                id: { gt: null },
                value: { gt: null },
            },
            orderBy: ["created_at", "id"],
            msMed: 21,
            count: 1160,
        },
        {
            filter: {
                created_at: { le: null },
                id: { ge: null, le: null },
                msg_type: { eq: null },
                src: { eq: null },
            },
            orderBy: ["created_at"],
            msMed: 52,
            count: 1092,
        },
    ],
    blocks: [
        {
            filter: {
                gen_utime: { ge: null, lt: null },
                tr_count: { gt: null },
                workchain_id: { eq: null },
            },
            orderBy: ["gen_utime"],
            msMed: 10,
            count: 61575,
        },
    ],
    accounts: [
        {
            filter: { code_hash: { eq: null } },
            orderBy: ["last_paid"],
            msMed: 13,
            count: 8286,
        },
        {
            filter: { code_hash: { eq: null } },
            orderBy: ["last_paid"],
            msMed: 14,
            count: 8225,
        },
        {
            filter: { code_hash: { in: null } },
            orderBy: ["last_trans_lt"],
            msMed: 33,
            count: 3745,
        },
    ],
}

export function isSlowQueryException(
    collection: string,
    filter: Record<string, unknown> | null | undefined,
    orderBy: OrderBy[] | null | undefined,
): boolean {
    return !!findCollectionQueryPattern(
        slowQueryExceptions,
        collection,
        filter,
        orderBy,
    )
}
