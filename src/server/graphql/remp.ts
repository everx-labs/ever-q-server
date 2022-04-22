import QBlockchainData from "../data/blockchain"
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

type RempReceiptsArgs = {
    accessKey?: string | null
    messageId: string
}

function rempKeys(messageId: string): KVDataWithChangesKeys {
    return {
        data: `remp-receipts:${messageId}`,
        changes: `keyspace@0:remp-receipts:${messageId}`,
    }
}

function rempReceiptsResolver(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _data: QBlockchainData,
    receiptProvider: KVProvider,
) {
    return {
        subscribe: async (
            _: unknown,
            args: AccessArgs & RempReceiptsArgs,
            request: QRequestContext,
        ) => {
            if (!request.services.config.useListeners) {
                throw new Error("Disabled")
            }
            await request.requireGrantedAccess(args)
            return await KVIterator.startWithDataAndChangesKeys(
                receiptProvider,
                rempKeys(args.messageId),
            )
        },
    }
}

function mockReceipts(
    messageId: string,
    flow: (RempReceiptKind | number)[],
): KVMockEntry<RempReceipt> {
    const entries = flow.map(kind => {
        if (typeof kind === "number") {
            return kind
        }
        const timestamp = Date.now()
        return {
            kind,
            timestamp,
            messageId,
            json: JSON.stringify({
                kind,
                timestamp,
                messageId,
            }),
        }
    })
    return kvMockEntry(rempKeys(messageId), entries)
}

export function mockRempProvider(): KVProvider {
    return kvMockProvider([
        mockReceipts("1", [
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

export function rempResolvers(
    data: QBlockchainData,
    receiptProvider: KVProvider,
) {
    return {
        Subscription: {
            rempReceipts: rempReceiptsResolver(data, receiptProvider),
        },
    }
}
