import { createClient } from "@node-redis/client"
import { ConfigParam } from "../config-param"
import { KVIterator, KVProvider } from "./kv-provider"

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

export function redisProvider(config: RedisClientConfig): KVProvider {
    const client = createClient({
        url: config.url,
    })
    let connected = false
    async function ensureConnected() {
        if (!connected) {
            await client.connect()
            connected = true
        }
    }
    return {
        async get<T>(key: string): Promise<T | null | undefined> {
            await ensureConnected()
            const value = await client.get(key)
            if (value === null || value === undefined) {
                return value
            }
            return JSON.parse(value) as unknown as T
        },
        async subscribe<T>(key: string): Promise<AsyncIterator<T>> {
            await ensureConnected()
            const subscriber = client.duplicate()
            await subscriber.connect()
            const iterator = new KVIterator<T>()
            await subscriber.subscribe(key, message => {
                iterator.push(message as unknown as T)
            })
            iterator.onClose = async () => {
                await subscriber.unsubscribe(key)
            }
            return iterator
        },
    }
}
