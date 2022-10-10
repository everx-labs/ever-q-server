import { QRequestContext } from "../request"
import { ConfigParam } from "../config-param"
import {
    RedisClientConfig,
    redisClientConfigParams,
    redisProvider,
} from "../data/kv-redis"
import {
    listChangesConfigParams,
    ListKeys,
    startListChangesIterator,
} from "../data/kv-list-changes"
import { KVProvider } from "../data/kv-provider"
import QLogs from "../logs"

export type RempConfig = {
    enabled: boolean
    redis: RedisClientConfig
    message: ListKeys
}

export enum RempReceiptKind {
    RejectedByFullnode = "RejectedByFullnode",
    SentToValidators = "SentToValidators",
    IncludedIntoBlock = "IncludedIntoBlock",
    IncludedIntoAcceptedBlock = "IncludedIntoAcceptedBlock",
    Finalized = "Finalized",
    Other = "Other",

    AcceptedByFullnode = "AcceptedByFullnode",
    AcceptedByQueue = "AcceptedByQueue",
    Duplicate = "Duplicate",
    IgnoredByCollator = "IgnoredByCollator",
    IgnoredByFullNode = "IgnoredByFullNode",
    IgnoredByQueue = "IgnoredByQueue",
    IgnoredByShardchain = "IgnoredByShardchain",
    PutIntoQueue = "PutIntoQueue",
    RejectedByCollator = "RejectedByCollator",
    RejectedByMasterchain = "RejectedByMasterchain",
    RejectedByQueue = "RejectedByQueue",
    RejectedByShardchain = "RejectedByShardchain",
    Timeout = "Timeout",
}

export type RempReceipt = {
    kind: RempReceiptKind
    messageId: string
    timestamp: number
    json: string
}

export type RempReceiptJson = {
    kind: RempReceiptKind
    timestamp: number
    message_id: string
}

type RempReceiptsArgs = {
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
    redis: redisClientConfigParams("remp"),
    message: listChangesConfigParams(
        "message",
        "remp",
        "remp-receipts:{message}",
        "__keyspace@0__:remp-receipts:{message}",
    ),
}

export function rempResolvers(
    config: RempConfig,
    logs: QLogs,
    customProvider?: KVProvider,
) {
    return {
        Subscription: {
            rempReceipts: rempReceiptsResolver(config, logs, customProvider),
        },
    }
}

function rempReceiptsResolver(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: RempConfig,
    logs: QLogs,
    customProvider?: KVProvider,
) {
    const log = logs.create("remp-redis")
    return {
        subscribe: async (
            _: unknown,
            args: RempReceiptsArgs,
            request: QRequestContext,
        ) => {
            if (!config.enabled) {
                throw new Error("Disabled")
            }
            const provider =
                customProvider ??
                (await request.ensureShared("remp-redis-provider", async () => {
                    return redisProvider(config.redis, log)
                }))
            return await startListChangesIterator(
                provider,
                rempMessageKeys(config, args.messageId),
                rempJsonToReceipt,
                {
                    beforeFirst: 5_000,
                    afterFirst: 600_000,
                },
            )
        },
    }
}

export function rempMessageKeys(
    config: RempConfig,
    messageId: string,
): ListKeys {
    return {
        listKey: config.message.listKey.replace("{message}", messageId),
        changesKey: config.message.changesKey.replace("{message}", messageId),
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
