import {
    AddressArgs,
    BigIntArgs,
    masterSeqNoFromChainOrder,
    resolveAddressField,
    resolveBigUInt,
    unixSecondsToString,
} from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import {
    MessageProcessingStatusEnum,
    MessageTypeEnum,
    Resolvers,
} from "../resolvers-types-generated"

export const resolvers: Resolvers<QRequestContext> = {
    BlockchainMessage: {
        id: parent => `message/${parent._key}`,
        hash: parent => parent._key,
        created_lt: (parent, args) =>
            resolveBigUInt(1, parent.created_lt, args as BigIntArgs),
        fwd_fee: (parent, args) =>
            resolveBigUInt(2, parent.fwd_fee, args as BigIntArgs),
        ihr_fee: (parent, args) =>
            resolveBigUInt(2, parent.ihr_fee, args as BigIntArgs),
        import_fee: (parent, args) =>
            resolveBigUInt(2, parent.import_fee, args as BigIntArgs),
        value: (parent, args) =>
            resolveBigUInt(2, parent.value, args as BigIntArgs),
        created_at_string: parent => unixSecondsToString(parent.created_at),
        msg_type_name: parent => {
            switch (parent.msg_type) {
                case 0:
                    return MessageTypeEnum.Internal
                case 1:
                    return MessageTypeEnum.ExtIn
                case 2:
                    return MessageTypeEnum.ExtOut
                default:
                    return null
            }
        },
        status_name: parent => {
            switch (parent.status) {
                case 0:
                    return MessageProcessingStatusEnum.Unknown
                case 1:
                    return MessageProcessingStatusEnum.Queued
                case 2:
                    return MessageProcessingStatusEnum.Processing
                case 3:
                    return MessageProcessingStatusEnum.Preliminary
                case 4:
                    return MessageProcessingStatusEnum.Proposed
                case 5:
                    return MessageProcessingStatusEnum.Finalized
                case 6:
                    return MessageProcessingStatusEnum.Refused
                case 7:
                    return MessageProcessingStatusEnum.Transiting
                default:
                    return null
            }
        },
        src: (parent, args) =>
            resolveAddressField(parent.src, args as AddressArgs),
        dst: (parent, args) =>
            resolveAddressField(parent.dst, args as AddressArgs),
        master_seq_no: parent =>
            masterSeqNoFromChainOrder(
                parent.src_chain_order ?? parent.dst_chain_order,
            ),
        chain_order: parent => parent.src_chain_order ?? parent.dst_chain_order,
    },
}
