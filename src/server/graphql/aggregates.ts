import QBlockchainData from "../data/blockchain"

export function aggregatesResolvers(data: QBlockchainData) {
    return {
        Query: {
            aggregateBlockSignatures:
                data.blocks_signatures.aggregationResolver(),
            aggregateBlocks: data.blocks.aggregationResolver(),
            aggregateTransactions: data.transactions.aggregationResolver(),
            aggregateMessages: data.messages.aggregationResolver(),
            aggregateAccounts: data.accounts.aggregationResolver(),
        },
    }
}
