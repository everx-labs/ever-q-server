import { Block, Message, Transaction } from "./resolvers-generated"
import { QRequestParams, masterSeqNoFromChainOrder } from "../filter/filters"

export const masterSeqNoResolvers = {
    Message: {
        master_seq_no(parent: {
            src_chain_order: string | undefined | null
            dst_chain_order: string | undefined | null
        }) {
            return masterSeqNoFromChainOrder(
                parent.src_chain_order ?? parent.dst_chain_order,
            )
        },
        chain_order(parent: {
            src_chain_order: string | undefined | null
            dst_chain_order: string | undefined | null
        }) {
            return parent.src_chain_order ?? parent.dst_chain_order
        },
    },
    Block: {
        master_seq_no(parent: { chain_order: string | undefined | null }) {
            return masterSeqNoFromChainOrder(parent.chain_order)
        },
    },
    Transaction: {
        master_seq_no(parent: { chain_order: string | undefined | null }) {
            return masterSeqNoFromChainOrder(parent.chain_order)
        },
    },
}

export function addMasterSeqNoFilters() {
    const messageFields = Message.fields
    if (messageFields) {
        messageFields["master_seq_no"] = {
            filterCondition() {
                return "false"
            },
            returnExpressions(_request: QRequestParams, path: string) {
                return [
                    {
                        name: "src_chain_order",
                        expression: `${path}.src_chain_order`,
                    },
                    {
                        name: "dst_chain_order",
                        expression: `${path}.dst_chain_order`,
                    },
                ]
            },
            test() {
                return false
            },
        }
        messageFields["chain_order"] = {
            filterCondition() {
                return "false"
            },
            returnExpressions(_request: QRequestParams, path: string) {
                return [
                    {
                        name: "src_chain_order",
                        expression: `${path}.src_chain_order`,
                    },
                    {
                        name: "dst_chain_order",
                        expression: `${path}.dst_chain_order`,
                    },
                ]
            },
            test() {
                return false
            },
        }
    }

    const blockFields = Block.fields
    if (blockFields) {
        blockFields["master_seq_no"] = {
            filterCondition() {
                return "false"
            },
            returnExpressions(_request: QRequestParams, path: string) {
                return [
                    {
                        name: "chain_order",
                        expression: `${path}.chain_order`,
                    },
                ]
            },
            test() {
                return false
            },
        }
    }

    const transactionFields = Transaction.fields
    if (transactionFields) {
        transactionFields["master_seq_no"] = {
            filterCondition() {
                return "false"
            },
            returnExpressions(_request: QRequestParams, path: string) {
                return [
                    {
                        name: "chain_order",
                        expression: `${path}.chain_order`,
                    },
                ]
            },
            test() {
                return false
            },
        }
    }
}
