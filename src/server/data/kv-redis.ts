import {
    createClient,
    RedisClientType,
    RedisModules,
    RedisScripts,
} from "@node-redis/client"
import { ConfigParam } from "../config-param"
import { KVIterator, KVProvider } from "./kv-provider"
import { QLog } from "../logs"

export type RedisClientConfig = {
    url: string
}

export function redisClientConfigParams(prefix: string) {
    return {
        url: ConfigParam.string(
            `${prefix}-redis-client-url`,
            "redis://localhost:6379",
            `URL to ${prefix} redis`,
        ),
    }
}

type RedisClient = RedisClientType<RedisModules, RedisScripts>
export function redisProvider(
    config: RedisClientConfig,
    log: QLog,
): KVProvider {
    let sharedClient: RedisClient | null = null

    async function ensureClient(): Promise<RedisClient> {
        if (sharedClient !== null) {
            return sharedClient
        }
        const client = createClient({
            url: config.url,
        })
        client.on("error", async error => {
            if (sharedClient !== null) {
                log.error(error)
                sharedClient = null
                await client.disconnect()
            }
        })
        await client.connect()
        sharedClient = client
        return client
    }

    return {
        async get<T>(key: string): Promise<T | null | undefined> {
            const value = await (await ensureClient()).get(key)
            if (value === null || value === undefined) {
                return value
            }
            return JSON.parse(value) as unknown as T
        },

        async list<T>(
            key: string,
            first: number,
            last: number,
        ): Promise<T[] | null | undefined> {
            const values = await (await ensureClient()).lRange(key, first, last)
            if (values === null || values === undefined) {
                return values
            }
            return values.map(x => JSON.parse(x) as unknown as T)
        },

        async subscribe<T>(key: string): Promise<AsyncIterator<T>> {
            const subscriber = (await ensureClient()).duplicate()
            await subscriber.connect()
            const iterator = new KVIterator<T>()
            const onError = () => {
                subscriber.off("error", onError)
                void iterator.throw(
                    new Error(
                        "Subscription was terminated due to internal server error",
                    ),
                )
            }
            await subscriber.subscribe(key, (message: unknown) => {
                iterator.push(message as T)
            })
            subscriber.on("error", onError)
            iterator.onClose = async () => {
                await subscriber.unsubscribe(key)
            }
            return iterator
        },
    }
}
