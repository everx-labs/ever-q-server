import QBlockchainData from "../data/blockchain"
import { AccessArgs } from "../auth"
import { QRequestContext } from "../request"
import { KVIterator, KVProvider } from "../data/keyvalue"

// enum RempReceiptKind {
//     RempIncludedIntoBlock = "IncludedIntoBlock",
//     RempAcceptedByFullnode = "AcceptedByFullnode",
//     RempFinalized = "Finalized",
//     RempAcceptedByQueue = "AcceptedByQueue",
//     RempIncludedIntoAcceptedBlock = "IncludedIntoAcceptedBlock",
//     RempDuplicate = "Duplicate",
//     RempIgnoredByCollator = "IgnoredByCollator",
//     RempIgnoredByFullNode = "IgnoredByFullNode",
//     RempIgnoredByQueue = "IgnoredByQueue",
//     RempIgnoredByShardchain = "IgnoredByShardchain",
//     RempPutIntoQueue = "PutIntoQueue",
//     RempRejectedByCollator = "RejectedByCollator",
//     RempRejectedByFullnode = "RejectedByFullnode",
//     RempRejectedByMasterchain = "RejectedByMasterchain",
//     RempRejectedByQueue = "RejectedByQueue",
//     RempRejectedByShardchain = "RejectedByShardchain",
//     RempSentToValidators = "SentToValidators",
//     RempTimeout = "Timeout",
//     RempOther = "Other",
// }
//
// type RempReceipt = {
//     kind: RempReceiptKind
//     messageId: string
//     timestamp: number
//     json: string
// }

type RempReceiptsArgs = {
    accessKey?: string | null
    messageId: string
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
            return KVIterator.startOnProviderWithDataAndChangesKeys(
                receiptProvider,
                `remp-receipts:${args.messageId}`,
                `keyspace@0:remp-receipts:${args.messageId}`,
            )
        },
    }
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
