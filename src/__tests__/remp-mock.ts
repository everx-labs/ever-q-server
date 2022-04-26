import { KVProvider } from "../server/data/kv-provider"
import {
    RempConfig,
    rempMessageKeys,
    RempReceiptJson,
    RempReceiptKind,
} from "../server/graphql/remp"
import { kvMockEntry, KVMockEntry, kvMockProvider } from "./kv-mock"

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
    return kvMockEntry(rempMessageKeys(config, messageId), entries)
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
