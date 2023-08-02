import { Account } from "./resolvers-generated"
import { SelectionNode } from "graphql"
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

export function overrideAccountBocFilter() {
    const fields = Account.fields
    if (fields) {
        fields["boc"] = {
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
                request: QRequestParams,
                path: string,
                def: SelectionNode,
            ): QReturnExpression[] {
                if (def.kind !== "Field") {
                    throw invalidSelection(def.kind)
                }
                const name = def.name.value
                const field = `${path}.${name}`
                return [
                    {
                        name,
                        expression:
                            request.expectedAccountBocVersion === 1
                                ? `${field}1 || ${field}`
                                : field,
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
}
