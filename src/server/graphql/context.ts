import QBlockchainData from "../data/blockchain";
import type { GraphQLRequestContext } from "../data/collection";

export type GraphQLRequestContextEx = GraphQLRequestContext & {
    data: QBlockchainData,
}


