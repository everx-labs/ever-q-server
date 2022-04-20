import { BigIntArgs, resolveBigUInt } from "../../../filter/filters"
import { QRequestContext } from "../../../request"
import { AccountStatusEnum, Resolvers } from "../resolvers-types-generated"

export const resolvers: Resolvers<QRequestContext> = {
    BlockchainAccount: {
        id: parent => `account/${parent._key}`,
        address: parent => parent._key,
        balance: (parent, args) =>
            resolveBigUInt(2, parent.balance, args as BigIntArgs),
        bits: (parent, args) =>
            resolveBigUInt(1, parent.bits, args as BigIntArgs),
        cells: (parent, args) =>
            resolveBigUInt(1, parent.cells, args as BigIntArgs),
        due_payment: (parent, args) =>
            resolveBigUInt(2, parent.due_payment, args as BigIntArgs),
        last_trans_lt: (parent, args) =>
            resolveBigUInt(1, parent.last_trans_lt, args as BigIntArgs),
        public_cells: (parent, args) =>
            resolveBigUInt(1, parent.public_cells, args as BigIntArgs),
        acc_type_name: parent => {
            switch (parent.acc_type) {
                case 0:
                    return AccountStatusEnum.Uninit
                case 1:
                    return AccountStatusEnum.Active
                case 2:
                    return AccountStatusEnum.Frozen
                case 3:
                    return AccountStatusEnum.NonExist
                default:
                    return null
            }
        },
    },
}
