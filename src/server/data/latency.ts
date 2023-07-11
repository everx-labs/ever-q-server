import { CachedData } from "../cached-data"
import { QDataCollection } from "./collection"
import { QDatabaseProvider } from "./database-provider"

const LATENCY_UPDATE_FREQUENCY = 25000

const BLOCK_LATENCY_QUERY = `LET last_shard_block_chain_order = (
    FOR b IN blocks
    FILTER b.workchain_id == 0
    SORT b.gen_utime DESC
    LIMIT 1
    RETURN b.chain_order
)[0]
LET master_block_chain_order = CONCAT(SUBSTRING(last_shard_block_chain_order, 0, 2 + TO_NUMBER(CONCAT("0x",SUBSTRING(last_shard_block_chain_order,0,1)))),"m")

FOR b IN blocks
FILTER b.chain_order == master_block_chain_order
RETURN { maxTime: b.gen_utime }`

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
    hotBlocks: QDatabaseProvider | undefined
    messages: QDataCollection
    hotMessages: QDatabaseProvider | undefined
    transactions: QDataCollection
    hotTransactions: QDatabaseProvider | undefined
    ignoreMessages?: boolean
}

class CollectionLatencyCache extends CachedData<CollectionLatency> {
    constructor(
        private collection: QDataCollection,
        private hot: QDatabaseProvider | undefined,
        private field: string,
    ) {
        super({
            ttlMs: LATENCY_UPDATE_FREQUENCY,
        })
    }

    async loadActual(): Promise<CollectionLatency> {
        const collection = this.collection.name
        const field = this.field
        const provider = this.hot
        if (!provider) {
            throw Error(`Internal error: ${collection} hot provider is missing`)
        }
        const query =
            collection == "blocks"
                ? BLOCK_LATENCY_QUERY
                : `RETURN { maxTime: (FOR d IN ${collection} SORT d.${field} DESC LIMIT 1 RETURN d.${field})[0] }`
        const cursor = await provider.connection.database.query(query)
        const fetchedTime = (await cursor.all())[0].maxTime as
            | number
            | null
            | undefined

        const maxTime = fetchedTime ?? 0
        const latency = this.getUpdatedLatency(maxTime)
        if (!latency) {
            throw Error("Internal error: latency can not be undefined")
        }
        return latency
    }

    private getUpdatedLatency(
        timeInSeconds: number | undefined | null,
    ): CollectionLatency | undefined {
        if (timeInSeconds === undefined || timeInSeconds === null) {
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
}

export class LatencyCache {
    private readonly ignoreMessages: boolean
    private blocks: CollectionLatencyCache
    private messages: CollectionLatencyCache
    private transactions: CollectionLatencyCache

    constructor(options: LatencyCacheOptions) {
        this.ignoreMessages = options.ignoreMessages ?? false
        this.blocks = new CollectionLatencyCache(
            options.blocks,
            options.hotBlocks,
            "gen_utime",
        )
        this.messages = new CollectionLatencyCache(
            options.messages,
            options.hotMessages,
            "created_at",
        )
        this.transactions = new CollectionLatencyCache(
            options.transactions,
            options.hotTransactions,
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
