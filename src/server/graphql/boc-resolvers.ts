import {
    CollectionFilter,
    convertFilterValue,
    filterConditionForFields,
    invalidSelection,
    QRequestParams,
    QReturnExpression,
    scalarOps,
    StructFilter,
    testFields,
    undefinedToNull,
} from "../filter/filters"
import { Block } from "./resolvers-generated"
import { SelectionNode } from "graphql"
import { BocStorage } from "../data/boc-storage"

export const bocResolvers = (storage: BocStorage) => {
    const blocks = storage.blocks
    if (!blocks) {
        return {}
    }
    return {
        Block: {
            boc: async (parent: {
                _key: string | undefined | null
                boc: string | undefined | null
            }) => {
                if (!parent._key) {
                    return parent.boc
                }
                const resolved = await blocks.resolveBocs([
                    { hash: parent._key, boc: parent.boc },
                ])
                return resolved.get(parent._key) ?? parent.boc
            },
        },
        BlockchainBlock: {
            boc: async (parent: {
                _key: string | undefined | null
                boc: string | undefined | null
            }) => {
                if (!parent._key || (parent.boc ?? "" !== "")) {
                    return parent.boc
                }
                const resolved = await blocks.resolveBocs([
                    { hash: parent._key, boc: parent.boc },
                ])
                return resolved.get(parent._key) ?? parent.boc
            },
        },
    }
}

export function overrideBocs(storage: BocStorage) {
    if (!storage.blocks || !Block.fields) {
        return
    }
    Block.fields["boc"] = {
        filterCondition(params, path, filter) {
            return filterConditionForFields(
                path,
                filter as StructFilter,
                scalarOps,
                (op, path, _filterKey, filterValue) => {
                    const converted = convertFilterValue(
                        filterValue,
                        op,
                        undefined,
                    )
                    return op.filterCondition(
                        params,
                        path,
                        converted as CollectionFilter,
                    )
                },
            )
        },
        returnExpressions(
            _request: QRequestParams,
            path: string,
            def: SelectionNode,
        ): QReturnExpression[] {
            if (def.kind !== "Field") {
                throw invalidSelection(def.kind)
            }
            const name = def.name.value
            return [
                {
                    name,
                    expression: `${path}.${name}`,
                },
                {
                    name: "_key",
                    expression: `${path}._key`,
                },
            ]
        },
        test(parent, value, filter) {
            return testFields(
                value,
                filter,
                scalarOps,
                (op, value, _filterKey, filterValue) => {
                    const converted = convertFilterValue(
                        filterValue,
                        op,
                        undefined,
                    )
                    return op.test(
                        parent,
                        undefinedToNull(value),
                        converted as CollectionFilter,
                    )
                },
            )
        },
    }
}
