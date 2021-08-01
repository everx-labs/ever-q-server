import QBlockchainData from "../data/blockchain";

export function explainResolvers(data: QBlockchainData) {
    return {
        Query: {
            explainQueryBlockSignatures: data.blocks_signatures.explainQueryResolver(),
            explainQueryBlocks: data.blocks.explainQueryResolver(),
            explainQueryTransactions: data.transactions.explainQueryResolver(),
            explainQueryMessages: data.messages.explainQueryResolver(),
            explainQueryAccounts: data.accounts.explainQueryResolver(),
        },
    };
}
