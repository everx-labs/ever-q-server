import { QDoc } from "../server/data/data-provider"
import { ActiveQueries } from "../server/data/database-provider"

const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

const QUERY_EXEC_MILLIS = 200

async function runQuery(): Promise<QDoc[]> {
    await sleep(QUERY_EXEC_MILLIS)
    return [{ _key: "_", data: "_" }]
}

test("3 queries with small pauses beetween them lead to 1 request", async () => {
    const CACHE_TTL_MILLIS = 1000

    const PAUSE_BETWEEN_QUERIES_MILLIS = 100

    const activeQueries = new ActiveQueries(CACHE_TTL_MILLIS)

    const fn = jest.fn(runQuery)

    const q1 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q2 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q3 = activeQueries.query("k1", fn)

    await Promise.all([q1, q2, q3])

    expect(fn.mock.calls).toHaveLength(1)
})

test("3 queries with big pauses beetween them lead to 2 request", async () => {
    const CACHE_TTL_MILLIS = 1000
    const PAUSE_BETWEEN_QUERIES_MILLIS = 600

    const activeQueries = new ActiveQueries(CACHE_TTL_MILLIS)

    const fn = jest.fn(runQuery)

    const q1 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q2 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q3 = activeQueries.query("k1", fn)

    await Promise.all([q1, q2, q3])

    expect(fn.mock.calls).toHaveLength(2)
})

test("3 queries with huge pauses beetween them lead to 3 request", async () => {
    const CACHE_TTL_MILLIS = 1000
    const PAUSE_BETWEEN_QUERIES_MILLIS = 1200

    const activeQueries = new ActiveQueries(CACHE_TTL_MILLIS)

    const fn = jest.fn(runQuery)

    const q1 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q2 = activeQueries.query("k1", fn)

    await sleep(PAUSE_BETWEEN_QUERIES_MILLIS)
    const q3 = activeQueries.query("k1", fn)

    await Promise.all([q1, q2, q3])

    expect(fn.mock.calls).toHaveLength(3)
})
