import { 
    BigIntArgs,
    resolveBigUInt,
    unixSecondsToString,
} from "../../filter/filters";
import { QRequestContext } from "../../request";
import { AccountStatusEnum, Resolvers, TransactionProcessingStatusEnum, TransactionTypeEnum } from "./resolvers-types-generated";

export const resolvers: Resolvers<QRequestContext> = {
    BlockchainTransaction: {
        id: parent => `message/${parent._key}`,
        hash: parent => parent._key,
        balance_delta: (parent, args) => resolveBigUInt(2, parent.balance_delta, args as BigIntArgs),
        lt: (parent, args) => resolveBigUInt(1, parent.lt, args as BigIntArgs),
        prev_trans_lt: (parent, args) => resolveBigUInt(1, parent.prev_trans_lt, args as BigIntArgs),
        total_fees: (parent, args) => resolveBigUInt(2, parent.total_fees, args as BigIntArgs),
        now_string: parent => unixSecondsToString(parent.now),
        end_status_name: parent => {
            switch(parent.end_status) {
                case 0: return AccountStatusEnum.Uninit;
                case 1: return AccountStatusEnum.Active;
                case 2: return AccountStatusEnum.Frozen;
                case 3: return AccountStatusEnum.NonExist;
                default: return null;
            }
        },
        orig_status_name: parent => {
            switch(parent.end_status) {
                case 0: return AccountStatusEnum.Uninit;
                case 1: return AccountStatusEnum.Active;
                case 2: return AccountStatusEnum.Frozen;
                case 3: return AccountStatusEnum.NonExist;
                default: return null;
            }
        },
        status_name: parent => {
            switch(parent.end_status) {
                case 0: return TransactionProcessingStatusEnum.Unknown;
                case 1: return TransactionProcessingStatusEnum.Preliminary;
                case 2: return TransactionProcessingStatusEnum.Proposed;
                case 3: return TransactionProcessingStatusEnum.Finalized;
                case 4: return TransactionProcessingStatusEnum.Refused;
                default: return null;
            }
        },
        tr_type_name: parent => {
            switch(parent.end_status) {
                case 0: return TransactionTypeEnum.Ordinary;
                case 1: return TransactionTypeEnum.Storage;
                case 2: return TransactionTypeEnum.Tick;
                case 3: return TransactionTypeEnum.Tock;
                case 4: return TransactionTypeEnum.SplitPrepare;
                case 5: return TransactionTypeEnum.SplitInstall;
                case 6: return TransactionTypeEnum.MergePrepare;
                case 7: return TransactionTypeEnum.MergeInstall;
                default: return null;
            }
        },
    }
};
