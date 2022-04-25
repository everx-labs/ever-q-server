import { AccessArgs } from "../auth"
import { QRequestContext } from "../request"
import { ConfigParam } from "../config-param"
import {
    RedisClientConfig,
    redisClientConfigParams,
    redisProvider,
} from "../data/kv-redis"
import {
    dataChangesConfigParams,
    DataChangesKeys,
    startDataChangesIterator,
} from "../data/kv-data-changes"
import { KVProvider } from "../data/kv-provider"
import { kvMockEntry, KVMockEntry, kvMockProvider } from "../data/kv-mock"

export type RempConfig = {
    enabled: boolean
    redis: RedisClientConfig
    message: DataChangesKeys
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
    redis: redisClientConfigParams("remp"),
    message: dataChangesConfigParams("remp", "message"),
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
                    return redisProvider(config.redis)
                }))
            return await startDataChangesIterator(
                provider,
                messageKeys(config, args.messageId),
                rempJsonToReceipt,
            )
        },
    }
}

function messageKeys(config: RempConfig, messageId: string): DataChangesKeys {
    return {
        dataKey: config.message.dataKey.replace("{messageId}", messageId),
        changesKey: config.message.changesKey.replace("{messageId}", messageId),
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
