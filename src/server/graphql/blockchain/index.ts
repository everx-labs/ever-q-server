import { IResolvers } from 'apollo-server'
import { assignDeep } from '../../utils'
import { resolvers as accountResolvers } from './types/account'
import { resolvers as blockResolvers } from './types/block'
import { resolvers as messageResolvers } from './types/message'
import { resolvers as transactionResolvers } from './types/transaction'
import { resolvers as blockchainResolvers } from './blockchain'

const resolvers = {} as IResolvers
;[
    accountResolvers,
    blockchainResolvers,
    blockResolvers,
    messageResolvers,
    transactionResolvers,
].forEach(x => assignDeep(resolvers, x))

export { resolvers as blockchainResolvers }
