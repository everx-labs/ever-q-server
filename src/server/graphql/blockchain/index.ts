import { IResolvers } from "apollo-server";
import { assignDeep } from "../../utils";
import { resolvers as blockchainResolvers } from "./blockchain";
import { resolvers as transactionResolvers } from "./transaction";

const resolvers = {} as IResolvers;
[
    blockchainResolvers,
    transactionResolvers,
].forEach(x => assignDeep(resolvers, x));

export { resolvers as blockchainResolvers };