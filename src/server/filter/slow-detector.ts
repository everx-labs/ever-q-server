import type { QIndexInfo } from "../data/data-provider"
import {
    CollectionFilter,
    indexToString,
    orderByToString,
    QParams,
    splitOr,
} from "./filters"
import type { OrderBy, QFieldExplanation, QType } from "./filters"
import type { QLog } from "../logs"
import { FilterConfig } from "../config"

function setIs1(s: Set<string>, a: string): boolean {
    return s.size === 1 && s.has(a)
}

function setIs2(s: Set<string>, a: string, b: string): boolean {
    return s.size === 2 && s.has(a) && s.has(b)
}

function canUseIndexedRange(ops: Set<string>): boolean {
    return (
        setIs1(ops, "==") ||
        setIs1(ops, "!=") ||
        setIs1(ops, ">") ||
        setIs2(ops, ">", "<") ||
        setIs2(ops, ">", "<=") ||
        setIs1(ops, ">=") ||
        setIs2(ops, ">=", "<") ||
        setIs2(ops, ">=", "<=") ||
        setIs1(ops, "<") ||
        setIs1(ops, "<=")
    )
}

function canUseConditionsForIndexedRange(
    fields: Map<string, QFieldExplanation>,
): boolean {
    for (const explanation of fields.values()) {
        if (!canUseIndexedRange(explanation.operations)) {
            return false
        }
    }
    return true
}

function fieldsCanUseIndex(
    fields: Map<string, QFieldExplanation>,
    index: QIndexInfo,
): boolean {
    if (fields.size > index.fields.length) {
        return false
    }
    for (let i = 0; i < fields.size; i += 1) {
        if (!fields.has(index.fields[i])) {
            return false
        }
    }
    return true
}

function getUsedIndexes(
    fields: Map<string, QFieldExplanation>,
    collectionIndexes: QIndexInfo[],
): QIndexInfo[] | null {
    const indexes = collectionIndexes.filter(x => fieldsCanUseIndex(fields, x))
    return indexes.length > 0 ? indexes : null
}

function orderByCanUseIndex(
    orderBy: OrderBy[],
    fields: Map<string, QFieldExplanation>,
    index: QIndexInfo,
): boolean {
    if (orderBy.length === 0) {
        return true
    }
    let iOrderBy = 0
    for (let iIndex = 0; iIndex < index.fields.length; iIndex += 1) {
        const indexField = index.fields[iIndex]
        if (indexField === orderBy[iOrderBy].path) {
            iOrderBy += 1
            if (iOrderBy >= orderBy.length) {
                return true
            }
        } else {
            if (iOrderBy > 0) {
                return false
            }
            const field = fields.get(indexField)
            if (!field) {
                return false
            }
            if (!setIs1(field.operations, "==")) {
                return false
            }
        }
    }
    return true
}

function orderByCanUseAnyIndex(
    orderBy: OrderBy[],
    fields: Map<string, QFieldExplanation>,
    indexes: QIndexInfo[],
): boolean {
    for (let i = 0; i < indexes.length; i += 1) {
        if (orderByCanUseIndex(orderBy, fields, indexes[i])) {
            return true
        }
    }
    return false
}

function hasKeyEq(fields: Map<string, QFieldExplanation>): boolean {
    const key = fields.get("_key")
    return !!(key && setIs1(key.operations, "=="))
}

function getSlowReason(
    summary: string,
    fields: Map<string, QFieldExplanation>,
    collectionIndexes: QIndexInfo[],
    selectedIndexes: QIndexInfo[],
): SlowReason {
    const logFields: string[] = []
    for (const [name, explanation] of fields.entries()) {
        logFields.push(
            `${name} ${Array.from(explanation.operations).join(" AND ")}`,
        )
    }
    return {
        summary,
        fields: logFields,
        availableIndexes: collectionIndexes.map(indexToString),
        selectedIndexes: selectedIndexes.map(indexToString),
    }
}

function getSlowReasonForOrOperand(
    config: FilterConfig,
    collectionIndexes: QIndexInfo[],
    type: QType,
    filter: CollectionFilter,
    orderBy: OrderBy[],
): SlowReason | null {
    const params = new QParams({
        stringifyKeyInAqlComparison: config.stringifyKeyInAqlComparison,
        explain: true,
    })
    type.filterCondition(params, "", filter)
    if (!params.explanation) {
        return getSlowReason("No filter", new Map(), collectionIndexes, [])
    }
    const fields = new Map<string, QFieldExplanation>()
    for (const [field, explanation] of params.explanation.fields) {
        if (field !== "status") {
            fields.set(field, explanation)
        }
    }
    if (hasKeyEq(fields)) {
        return null
    }
    if (!canUseConditionsForIndexedRange(fields)) {
        return getSlowReason(
            "Filter operations can't be used in ranged queries",
            fields,
            collectionIndexes,
            [],
        )
    }

    const indexes = getUsedIndexes(fields, collectionIndexes)
    if (!indexes) {
        return getSlowReason(
            "Available indexes can't be used for filter fields",
            fields,
            collectionIndexes,
            [],
        )
    }

    if (orderBy.length > 0) {
        if (!orderByCanUseAnyIndex(orderBy, fields, indexes)) {
            return getSlowReason(
                "Order by can't use any selected index",
                fields,
                collectionIndexes,
                indexes,
            )
        }
    }

    return null
}

export type SlowReason = {
    summary: string
    fields: string[]
    selectedIndexes: string[]
    availableIndexes: string[]
}

export function explainSlowReason(
    config: FilterConfig,
    _collectionName: string,
    collectionIndexes: QIndexInfo[],
    type: QType,
    filter: CollectionFilter,
    orderBy: OrderBy[],
): SlowReason | null {
    const orOperands = splitOr(filter)
    for (let i = 0; i < orOperands.length; i += 1) {
        const slowReason = getSlowReasonForOrOperand(
            config,
            collectionIndexes,
            type,
            orOperands[i],
            orderBy,
        )
        if (slowReason) {
            return slowReason
        }
    }
    return null
}

export function isFastQuery(
    config: FilterConfig,
    collectionName: string,
    collectionIndexes: QIndexInfo[],
    type: QType,
    filter: CollectionFilter,
    orderBy: OrderBy[],
    log: QLog | null,
): boolean {
    const slowReason = explainSlowReason(
        config,
        collectionName,
        collectionIndexes,
        type,
        filter,
        orderBy,
    )
    if (slowReason && log) {
        log.debug(slowReason.summary, {
            ...slowReason,
            collection: collectionName,
            filter,
            orderBy: orderByToString(orderBy),
        })
    }
    return slowReason === null
}
