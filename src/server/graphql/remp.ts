import { AccessArgs } from "../auth"
import { QRequestContext } from "../request"
import {
    KVIterator,
    KVProvider,
    kvMockProvider,
    KVDataWithChangesKeys,
    kvMockEntry,
    KVMockEntry,
} from "../data/keyvalue"
import { createClient } from "@node-redis/client"
import { ConfigParam } from "../config-param"

export type RempConfig = {
    enabled: boolean
    redis: {
        url: string
        messageDataKey: string
        messageChangesKey: string
    }
}

enum RempReceiptKind {
    IncludedIntoBlock = "IncludedIntoBlock",
    AcceptedByFullnode = "AcceptedByFullnode",
    Finalized = "Finalized",
    AcceptedByQueue = "AcceptedByQueue",
    IncludedIntoAcceptedBlock = "IncludedIntoAcceptedBlock",
    Duplicate = "Duplicate",
    IgnoredByCollator = "IgnoredByCollator",
    IgnoredByFullNode = "IgnoredByFullNode",
    IgnoredByQueue = "IgnoredByQueue",
    IgnoredByShardchain = "IgnoredByShardchain",
    PutIntoQueue = "PutIntoQueue",
    RejectedByCollator = "RejectedByCollator",
    RejectedByFullnode = "RejectedByFullnode",
    RejectedByMasterchain = "RejectedByMasterchain",
    RejectedByQueue = "RejectedByQueue",
    RejectedByShardchain = "RejectedByShardchain",
    SentToValidators = "SentToValidators",
    Timeout = "Timeout",
    Other = "Other",
}

type RempReceipt = {
    kind: RempReceiptKind
    messageId: string
    timestamp: number
    json: string
}

type RempReceiptJson = {
    kind: RempReceiptKind
    timestamp: number
    message_id: string
}

type RempReceiptsArgs = {
    accessKey?: string | null
    messageId: string
}

const knownKinds = new Set<RempReceiptKind>([
    RempReceiptKind.RejectedByFullnode,
    RempReceiptKind.SentToValidators,
    RempReceiptKind.IncludedIntoBlock,
    RempReceiptKind.IncludedIntoAcceptedBlock,
    RempReceiptKind.Finalized,
])

export const rempConfigParams = {
    enabled: ConfigParam.boolean("remp-enabled", false, "REMP enabled"),
    redis: {
        url: ConfigParam.string(
            "remp-redis-url",
            "redis://localhost:6379",
            "URL to REMP redis",
        ),
        messageDataKey: ConfigParam.string(
            "remp-redis-message-data-key",
            "remp-receipts:{messageId}",
            "Redis key for message REMP notifications\n" +
                "This parameter must contain substring `{messageId}`\n" +
                "that will be replaced with actual message id",
        ),
        messageChangesKey: ConfigParam.string(
            "remp-redis-message-changes-key",
            "keyspace@0:remp-receipts:{messageId}",
            "Redis key for message REMP changes channel\n" +
                "This parameter must contain substring `{messageId}`\n" +
                "that will be replaced with actual message id",
        ),
    },
}

export function rempResolvers(config: RempConfig, customProvider?: KVProvider) {
    return {
        Subscription: {
            rempReceipts: rempReceiptsResolver(config, customProvider),
        },
    }
}

function rempReceiptsResolver(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: RempConfig,
    customProvider?: KVProvider,
) {
    return {
        subscribe: async (
            _: unknown,
            args: AccessArgs & RempReceiptsArgs,
            request: QRequestContext,
        ) => {
            if (!config.enabled) {
                throw new Error("Disabled")
            }
            await request.requireGrantedAccess(args)
            const provider =
                customProvider ??
                (await request.ensureShared("remp-redis-provider", async () => {
                    return redisRempProvider(config)
                }))
            return await KVIterator.startWithDataAndChangesKeys(
                provider,
                messageKeys(config, args.messageId),
                rempJsonToReceipt,
            )
        },
    }
}

function messageKeys(
    config: RempConfig,
    messageId: string,
): KVDataWithChangesKeys {
    return {
        data: config.redis.messageDataKey.replace("{messageId}", messageId),
        changes: config.redis.messageChangesKey.replace(
            "{messageId}",
            messageId,
        ),
    }
}

function rempJsonToReceipt(data: unknown): {
    rempReceipts: RempReceipt
} {
    const json = data as RempReceiptJson
    return {
        rempReceipts: {
            kind: knownKinds.has(json.kind) ? json.kind : RempReceiptKind.Other,
            timestamp: json.timestamp,
            messageId: json.message_id,
            json: JSON.stringify(json),
        },
    }
}
function redisRempProvider(config: RempConfig): KVProvider {
    const client = createClient({
        url: config.redis.url,
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

function mockReceipts(
    config: RempConfig,
    messageId: string,
    flow: (RempReceiptKind | number)[],
): KVMockEntry<RempReceiptJson> {
    const entries = flow.map(kind => {
        if (typeof kind === "number") {
            return kind
        }
        const timestamp = Date.now()
        return {
            kind,
            timestamp,
            message_id: messageId,
        }
    })
    return kvMockEntry(messageKeys(config, messageId), entries)
}

export function mockRempProvider(config: RempConfig): KVProvider {
    return kvMockProvider([
        mockReceipts(config, "1", [
            RempReceiptKind.AcceptedByFullnode,
            500,
            RempReceiptKind.SentToValidators,
            1000,
            RempReceiptKind.AcceptedByQueue,
            1500,
            RempReceiptKind.IncludedIntoAcceptedBlock,
            2000,
            RempReceiptKind.Finalized,
        ]),
    ])
}
