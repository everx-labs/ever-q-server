import { IResolvers } from "apollo-server";
import { assignDeep } from "../../utils";
import { resolvers as accountResolvers } from "./account";
import { resolvers as blockchainResolvers } from "./blockchain";
import { resolvers as blockResolvers } from "./block";
import { resolvers as messageResolvers } from "./message";
import { resolvers as transactionResolvers } from "./transaction";

const resolvers = {} as IResolvers;
[
    accountResolvers,
    blockchainResolvers,
    blockResolvers,
    messageResolvers,
    transactionResolvers,
].forEach(x => assignDeep(resolvers, x));

export { resolvers as blockchainResolvers };
