import QBlockchainData from "../data/blockchain";
import { required } from "../utils";

export function explainResolvers(data: QBlockchainData) {
    return {
        Query: {
            explainQueryBlockSignatures: required(data.blocks_signatures).explainQueryResolver(),
            explainQueryBlocks: required(data.blocks).explainQueryResolver(),
            explainQueryTransactions: required(data.transactions).explainQueryResolver(),
            explainQueryMessages: required(data.messages).explainQueryResolver(),
            explainQueryAccounts: required(data.accounts).explainQueryResolver(),
        },
    };
}
