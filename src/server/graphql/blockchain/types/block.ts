import {
    BigIntArgs,
    resolveBigUInt,
    unixSecondsToString,
} from '../../../filter/filters'
import { QRequestContext } from '../../../request'
import {
    BlockProcessingStatusEnum,
    Resolvers,
} from '../resolvers-types-generated'

export const resolvers: Resolvers<QRequestContext> = {
    BlockchainBlock: {
        id: parent => `block/${parent._key}`,
        hash: parent => parent._key,
        end_lt: (parent, args) =>
            resolveBigUInt(1, parent.end_lt, args as BigIntArgs),
        gen_software_capabilities: (parent, args) =>
            resolveBigUInt(
                1,
                parent.gen_software_capabilities,
                args as BigIntArgs,
            ),
        start_lt: (parent, args) =>
            resolveBigUInt(1, parent.start_lt, args as BigIntArgs),
        gen_utime_string: parent => unixSecondsToString(parent.gen_utime),
        status_name: parent => {
            switch (parent.status) {
                case 0:
                    return BlockProcessingStatusEnum.Unknown
                case 1:
                    return BlockProcessingStatusEnum.Proposed
                case 2:
                    return BlockProcessingStatusEnum.Finalized
                case 3:
                    return BlockProcessingStatusEnum.Refused
                default:
                    return null
            }
        },
    },
}
