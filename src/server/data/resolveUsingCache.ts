import Redis from "ioredis"

import { QCollectionQuery } from "./collection-query"
import { CollectionFilter } from "../filter/filters"
import { QTraceSpan /* QTracer */ } from "../tracing"
import { QRequestContext, RequestEvent } from "../request"
import { QDoc } from "./data-provider"
import { QError } from "../utils"
import { QDataCollection } from "./collection"
import md5 from "md5"

const sleep = async (ms: number) => new Promise(x => setTimeout(x, ms))

enum Reason {
    query = "query",
    cache = "cache",
    close = "close",
    timeout = "timeout",
}
export function extract2Hashes(queryFilter: CollectionFilter): string[] | null {
    return JSON.stringify(queryFilter).match(
        new RegExp(
            "^{" +
                '"prev_ref":{"root_hash":{"eq":"([0-9a-f]{64})"}},' +
                '"OR":' +
                '{"prev_alt_ref":{"root_hash":{"eq":"([0-9a-f]{64})"}}}' +
                "}$",
            "i",
        ),
    )
}

export function canUseWalkingCache(query: QCollectionQuery): boolean {
    return (
        extract2Hashes(query.filter)?.length === 3 &&
        query.limit === 1 &&
        query.orderBy.length === 0
    )
}

export async function resolveUsingCache(
    query: QCollectionQuery,
    request: QRequestContext,
    isFast: boolean,
    that: QDataCollection,
    span: QTraceSpan,
): Promise<QDoc[]> {
    const redisClient = await request.ensureShared(
        "cache-redis",
        async () =>
            new Redis(request.services.config.subscriptions.redisOptions),
    )

    that.waitForCount += 1
    that.statWaitForActive.increment().catch(() => {})
    const queryTimeoutAt = Date.now() + query.timeout

    let block: QDoc | undefined
    let reason: Reason | undefined
    let firstQueryCompleted = false

    request.events.on(RequestEvent.CLOSE, () => {
        reason = Reason.close
    })
    try {
        while (!reason) {
            debug("Resolve from cache ....", query.filter)
            const value = await getFromCache(redisClient, query.filter)
            if (value) {
                debug("Resolve from cache. HIT", query.filter)

                block = JSON.parse(value) as QDoc
                block._key = block.id as string
                reason = Reason.cache
                break
            }
            if (!firstQueryCompleted) {
                debug("Resolve from database..", query.filter)
                const docs = await that.queryProvider({
                    text: query.text,
                    vars: query.params,
                    orderBy: query.orderBy,
                    request,
                    traceSpan: span,
                    isFast,
                    maxRuntimeInS: Math.floor(query.timeout / 1000),
                })
                firstQueryCompleted = true
                if (docs.length > 0) {
                    debug("Resolve from database. HIT!", query.filter)
                    block = docs[0] as QDoc
                    reason = Reason.query
                    break
                }
            }
            const timeLeft = queryTimeoutAt - Date.now()
            if (timeLeft <= 0) {
                if (!firstQueryCompleted) {
                    throw QError.queryTerminatedOnTimeout()
                } else {
                    reason = Reason.timeout
                    break
                }
            } else {
                await sleep(100)
            }
        }
    } catch (err: any) {
        that.log.error(
            Date.now(),
            that.name,
            "QUERY\tFAILED",
            JSON.stringify(query.filter),
            err.toString(),
        )
        throw err
    } finally {
        that.statWaitForActive.decrement().catch(() => {})
        that.waitForCount = Math.max(0, that.waitForCount - 1)
    }

    span.setTag("resolved", reason)
    return block ? [block] : []
}

async function getFromCache(
    redisClient: Redis.Redis,
    filter: CollectionFilter,
): Promise<string | null> {
    const [, key1, key2] = extract2Hashes(filter) as [string, string, string]
    const value =
        (await redisClient.get("block_next-" + key1)) ||
        (await redisClient.get("block_next_alt-" + key2))

    return value
}

function debug(message: string, data: any) {
    console.log(message, md5(JSON.stringify(data)))
}
