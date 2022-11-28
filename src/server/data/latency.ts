import { CachedData } from "../cached-data"
import { QDataCollection } from "./collection"
import { Database } from "arangojs"
import { QDataProvider } from "./data-provider"

const LATENCY_UPDATE_FREQUENCY = 25000

export type CollectionLatency = {
    maxTime: number
    latency: number
}

export type Latency = {
    blocks: CollectionLatency
    messages: CollectionLatency
    transactions: CollectionLatency
    latency: number
    lastBlockTime: number
}

type LatencyCacheOptions = {
    blocks: QDataCollection
    messages: QDataCollection
    transactions: QDataCollection
    ignoreMessages?: boolean
}

class CollectionLatencyCache extends CachedData<CollectionLatency> {
    constructor(private collection: QDataCollection, private field: string) {
        super({
            ttlMs: LATENCY_UPDATE_FREQUENCY,
        })
        void this.get()
        this.update({
            maxTime: 0,
            latency: Date.now(),
        })
        collection.docInsertOrUpdate.on("doc", async doc => {
            this.updateLatency(doc[this.field])
        })
    }

    async loadActual(): Promise<CollectionLatency> {
        const fetchersByDatabasePoolIndex = new Map<
            number,
            { database: Database; returns: string[] }
        >()
        const collection = this.collection.name
        const field = this.field
        const provider = this.collection.provider as QDataProvider
        const shards = provider.shards
        const returnExpression = `${collection}: (FOR d IN ${collection} SORT d.${field} DESC LIMIT 1 RETURN d.${field})[0]`
        for (const shard of shards) {
            const existing = fetchersByDatabasePoolIndex.get(shard.poolIndex)
            if (existing !== undefined) {
                existing.returns.push(returnExpression)
            } else {
                fetchersByDatabasePoolIndex.set(shard.poolIndex, {
                    database: shard.database,
                    returns: [returnExpression],
                })
            }
        }
        const fetchedTimes = await Promise.all(
            [...fetchersByDatabasePoolIndex.values()].map(async fetcher => {
                const query = `RETURN {${fetcher.returns.join(",\n")}}`
                return (
                    await (await fetcher.database.query(query)).all()
                )[0] as Record<string, number | null>
            }),
        )

        let maxTime: number | null = null
        for (const fetchedTime of fetchedTimes) {
            const time = fetchedTime[collection]
            if (
                time !== undefined &&
                time !== null &&
                (maxTime === null || time > maxTime)
            ) {
                maxTime = time
            }
        }
        const latency = this.getUpdatedLatency(maxTime)
        if (!latency) {
            throw Error("Internal error: latency can not be undefined")
        }
        return latency
    }

    private getUpdatedLatency(
        timeInSeconds: number | undefined | null,
    ): CollectionLatency | undefined {
        if (
            timeInSeconds === undefined ||
            timeInSeconds === null ||
            timeInSeconds === 0
        ) {
            return this.data
        }
        const time = timeInSeconds * 1000
        if (time < (this.data?.maxTime ?? 0)) {
            return this.data
        }
        return {
            maxTime: time,
            latency: Math.max(0, Date.now() - time),
        }
    }

    updateLatency(timeInSeconds: number | undefined | null) {
        const newData = this.getUpdatedLatency(timeInSeconds)
        if (newData && newData !== this.data) {
            this.update(newData)
        }
    }
}

export class LatencyCache {
    private readonly ignoreMessages: boolean
    private blocks: CollectionLatencyCache
    private messages: CollectionLatencyCache
    private transactions: CollectionLatencyCache

    constructor(options: LatencyCacheOptions) {
        this.ignoreMessages = options.ignoreMessages ?? false
        this.blocks = new CollectionLatencyCache(options.blocks, "gen_utime")
        this.messages = new CollectionLatencyCache(
            options.messages,
            "created_at",
        )
        this.transactions = new CollectionLatencyCache(
            options.transactions,
            "now",
        )
    }

    async get(): Promise<Latency> {
        const blocks = await this.blocks.get()
        const messages = await this.messages.get()
        const transactions = await this.transactions.get()
        return {
            blocks,
            messages,
            transactions,
            latency: Math.max(
                blocks.latency,
                this.ignoreMessages ? 0 : messages.latency,
                transactions.latency,
            ),
            lastBlockTime: blocks.maxTime,
        }
    }
}
