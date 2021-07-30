import QBlockchainData from "../data/blockchain";
import { QDataCollection } from "../data/collection";
import { QError } from "../utils";

function required(collection: QDataCollection | undefined): QDataCollection {
    if (collection !== undefined) {
        return collection;
    }
    throw QError.serviceUnavailable();
}

export function aggregatesResolvers(data: QBlockchainData) {
    return {
        Query: {
            aggregateBlockSignatures: required(data.blocks_signatures).aggregationResolver(),
            aggregateBlocks: required(data.blocks).aggregationResolver(),
            aggregateTransactions: required(data.transactions).aggregationResolver(),
            aggregateMessages: required(data.messages).aggregationResolver(),
            aggregateAccounts: required(data.accounts).aggregationResolver(),
        },
    };
}
