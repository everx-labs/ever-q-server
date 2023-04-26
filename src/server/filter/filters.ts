/*
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
 *
 * Licensed under the SOFTWARE EVALUATION License (the "License"); you may not use
 * this file except in compliance with the License.  You may obtain a copy of the
 * License at:
 *
 * http://www.ton.dev/licenses
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific TON DEV software governing permissions and
 * limitations under the License.
 */

import type { QDoc, QIndexInfo, Scalar } from "../data/data-provider"

import { FieldNode, SelectionNode, SelectionSetNode } from "graphql"
import { resolveAddress } from "../address"
import {
    addressStringFormatAccountId,
    addressStringFormatBase64,
    addressStringFormatHex,
} from "@eversdk/core"

const NOT_IMPLEMENTED = new Error("Not Implemented")

export interface StructFilter {
    [name: string]: CollectionFilter
}

export type CollectionFilter = StructFilter | ScalarFilter | ArrayFilter | null

export type ScalarFilter = {
    eq?: Scalar | null
    ne?: Scalar | null
    gt?: Scalar
    ge?: Scalar
    lt?: Scalar
    le?: Scalar
    in?: Scalar[]
    notIn?: Scalar[]
    OR?: CollectionFilter
}

export type ArrayFilter =
    | {
          all: CollectionFilter
      }
    | {
          any: CollectionFilter
      }

export type QFieldExplanation = {
    operations: Set<string>
}

export function invalidSelection(info: string): Error {
    return new Error(`Invalid selection field: ${info}`)
}

function combinePath(base: string, path: string): string {
    const b = base.endsWith(".") ? base.slice(0, -1) : base
    const p = path.startsWith(".") ? path.slice(1) : path
    const sep = p && b ? "." : ""
    return `${b}${sep}${p}`
}

export class QExplanation {
    parentPath: string
    fields: Map<string, QFieldExplanation>

    constructor() {
        this.parentPath = ""
        this.fields = new Map()
    }

    explainScalarOperation(path: string, op: string) {
        let p = path
        if (p.startsWith("CURRENT")) {
            p = combinePath(this.parentPath, p.substr("CURRENT".length))
        }
        const existing: QFieldExplanation | typeof undefined =
            this.fields.get(p)
        if (existing) {
            existing.operations.add(op)
        } else {
            this.fields.set(p, {
                operations: new Set([op]),
            })
        }
    }
}

export type QParamsOptions = {
    explain?: boolean
    stringifyKeyInAqlComparison?: boolean
    skipValueConversion?: boolean
}

/**
 * Query parameters
 */
export class QParams {
    values: Record<string, unknown>
    count: number
    explanation: QExplanation | null
    stringifyKeyInAqlComparison: boolean
    skipValueConversion: boolean

    constructor(options?: QParamsOptions) {
        this.count = 0
        this.values = {}
        this.explanation =
            options && options.explain ? new QExplanation() : null
        this.stringifyKeyInAqlComparison =
            options?.stringifyKeyInAqlComparison ?? false
        this.skipValueConversion = options?.skipValueConversion ?? false
    }

    clear() {
        this.count = 0
        this.values = {}
    }

    add(value: unknown): string {
        this.count += 1
        const name = `v${this.count.toString()}`
        this.values[name] = value
        return name
    }

    explainScalarOperation(field: string, op: string) {
        if (this.explanation) {
            this.explanation.explainScalarOperation(field, op)
        }
    }
}

export type QReturnExpression = {
    name: string
    expression: string
}

export interface QRequestParams {
    expectedAccountBocVersion: number
}

/**
 * Abstract interface for objects that acts as a helpers to perform queries over documents
 * using query filters.
 */
type QType = {
    fields?: Record<string, QType>

    /**
     * Generates an Arango QL condition for specified field based on specified filter.
     * The condition must be a string expression that evaluates to boolean.
     *
     * @param {string} path Path from document root to concrete field
     * @param {any} filter Filter that will be applied to this field
     * @return {string} Arango QL condition text
     */
    filterCondition: (
        params: QParams,
        path: string,
        filter: CollectionFilter,
    ) => string | null

    /**
     * Generates AQL expression for return section.
     */
    returnExpressions: (
        request: QRequestParams,
        path: string,
        def: SelectionNode,
    ) => QReturnExpression[]

    /**
     * Tests value in document from Arango DB against specified filter.
     *
     * @param {any} value Value that must be tested against filter
     * @param {any} filter Filter used to test a value
     * @return true if value matches filter
     */
    test: (parent: unknown, value: unknown, filter: CollectionFilter) => boolean
}

/**
 * Generates AQL condition for complex filter.
 *
 * @param {string} path Path to document field.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} filterConditionForField Function that generates condition for a concrete field.
 * @return {string} AQL condition
 */
export function filterConditionForFields(
    path: string,
    filter: StructFilter | null,
    fieldTypes: Record<string, QType>,
    filterConditionForField: (
        field: QType,
        path: string,
        filterKey: string,
        filterValue: CollectionFilter,
    ) => string | null,
): string | null {
    if (filter === null) {
        return null
    }
    const conditions: string[] = []
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey]
        if (fieldType) {
            const fieldCondition = filterConditionForField(
                fieldType,
                path,
                filterKey,
                filterValue,
            )
            if (fieldCondition !== null) {
                conditions.push(fieldCondition)
            }
        } else {
            throw new Error(`Invalid filter field: ${filterKey}`)
        }
    })
    return combineFilterConditions(conditions, "AND")
}

export function collectReturnExpressions(
    request: QRequestParams,
    expressions: Map<string, string>,
    path: string,
    selectionSet: SelectionSetNode | undefined,
    fieldTypes: Record<string, QType>,
) {
    if (selectionSet === undefined) {
        return
    }
    selectionSet.selections.forEach((fieldDef: SelectionNode) => {
        if (fieldDef.kind !== "Field") {
            throw invalidSelection(fieldDef.kind)
        }
        const name = fieldDef.name.value
        if (name === "__typename") {
            return
        }

        const fieldType = fieldTypes[name]
        if (!fieldType) {
            throw invalidSelection(name)
        }
        for (const returned of fieldType.returnExpressions(
            request,
            path,
            fieldDef,
        )) {
            expressions.set(returned.name, returned.expression)
        }
    })
}

export function combineReturnExpressions(
    expressions: Map<string, string>,
): string {
    const fields = []
    for (const [key, value] of expressions) {
        fields.push(`${key}: ${value}`)
    }
    return `{ ${fields.join(", ")} }`
}

/**
 * Test document value against complex filter.
 *
 * @param {any} value Value of the field in document.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} testField Function that performs test value against a selected field.
 * @return {string} AQL condition
 */
export function testFields(
    value: unknown,
    filter: CollectionFilter,
    fieldTypes: Record<string, QType>,
    testField: (
        fieldType: QType,
        value: unknown,
        filterKey: string,
        filterValue: unknown,
    ) => boolean,
): boolean {
    if (filter === null) {
        return true
    }
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey]
        if (!fieldType) {
            throw new Error(`Invalid filter field: ${filterKey}`)
        }
        return !(
            fieldType && testField(fieldType, value, filterKey, filterValue)
        )
    })
    return !failed
}

function filterConditionOp(
    params: QParams,
    path: string,
    op: string,
    filter: CollectionFilter,
    explainOp?: string,
): string {
    params.explainScalarOperation(path, explainOp || op)
    const paramName = params.add(filter)

    /*
     * Following TO_STRING cast required due to specific comparison of _key fields in Arango
     * For example this query:
     * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
     * Will return:
     * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
     */

    const isKeyOrderedComparison =
        params.stringifyKeyInAqlComparison &&
        (path === "_key" || path.endsWith("._key")) &&
        op !== "==" &&
        op !== "!="
    const fixedPath = isKeyOrderedComparison ? `TO_STRING(${path})` : path
    const fixedValue = `@${paramName}`
    return `${fixedPath} ${op} ${fixedValue}`
}

function combineFilterConditions(
    conditions: string[],
    op: string,
): string | null {
    if (conditions.length === 0) {
        return null
    }
    if (conditions.length === 1) {
        return conditions[0]
    }
    return "(" + conditions.join(`) ${op} (`) + ")"
}

function filterConditionForIn(
    params: QParams,
    path: string,
    filter: unknown[],
    explainOp?: string,
): string | null {
    if (params.skipValueConversion && !Array.isArray(filter)) {
        return filterConditionOp(params, path, "==", null, explainOp)
    }
    if (filter.length === 0) {
        return "FALSE"
    }
    const conditions = filter.map(value =>
        filterConditionOp(
            params,
            path,
            "==",
            value as CollectionFilter,
            explainOp,
        ),
    )
    return combineFilterConditions(conditions, "OR")
}

//------------------------------------------------------------- Scalars

export function undefinedToNull(v: unknown | undefined): unknown | null {
    return v !== undefined ? v : null
}

const scalarEq: QType = {
    filterCondition(params: QParams, path, filter) {
        return filterConditionOp(params, path, "==", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return value === filter
    },
}

const scalarNe: QType = {
    filterCondition(params, path, filter) {
        return filterConditionOp(params, path, "!=", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return value !== filter
    },
}

const scalarLt: QType = {
    filterCondition(params, path, filter) {
        return filterConditionOp(params, path, "<", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return (value as Scalar) < (filter as unknown as Scalar)
    },
}

const scalarLe: QType = {
    filterCondition(params, path, filter) {
        return filterConditionOp(params, path, "<=", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return (value as Scalar) <= (filter as unknown as Scalar)
    },
}

const scalarGt: QType = {
    filterCondition(params, path, filter) {
        return filterConditionOp(params, path, ">", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return (value as Scalar) > (filter as unknown as Scalar)
    },
}

const scalarGe: QType = {
    filterCondition(params, path, filter) {
        return filterConditionOp(params, path, ">=", filter)
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return (value as Scalar) >= (filter as unknown as Scalar)
    },
}

const scalarIn: QType = {
    filterCondition(params, path, filter) {
        return filterConditionForIn(
            params,
            path,
            filter as unknown as unknown[],
        )
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return (filter as unknown as unknown[]).includes(value)
    },
}

const scalarNotIn: QType = {
    filterCondition(params, path, filter) {
        const inCondition = filterConditionForIn(
            params,
            path,
            filter as unknown as unknown[],
            "!=",
        )
        return inCondition === "FALSE" ? "TRUE" : `NOT (${inCondition})`
    },
    returnExpressions(): QReturnExpression[] {
        throw NOT_IMPLEMENTED
    },
    test(_parent, value, filter) {
        return !(filter as unknown as unknown[]).includes(value)
    },
}

export const scalarOps = {
    eq: scalarEq,
    ne: scalarNe,
    lt: scalarLt,
    le: scalarLe,
    gt: scalarGt,
    ge: scalarGe,
    in: scalarIn,
    notIn: scalarNotIn,
}

export function convertFilterValue(
    value: unknown,
    op: QType,
    converter?: (value: unknown) => unknown,
): unknown {
    if (converter) {
        const conv = converter
        return op === scalarOps.in || op === scalarOps.notIn
            ? (value as unknown[]).map(x => conv(x))
            : conv(value)
    }
    return value
}

function createScalar(
    filterValueConverter?: (value: unknown) => unknown,
): QType {
    return {
        filterCondition(params, path, filter) {
            return filterConditionForFields(
                path,
                filter as StructFilter,
                scalarOps,
                (op, path, _filterKey, filterValue) => {
                    const converted = params.skipValueConversion
                        ? filterValue
                        : convertFilterValue(
                              filterValue,
                              op,
                              filterValueConverter,
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
            const isCollection = path === "doc"
            let name = def.name.value
            if (isCollection && name === "id") {
                name = "_key"
            }
            return [
                {
                    name,
                    expression: `${path}.${name}`,
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
                        filterValueConverter,
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

export type NumericScalar = string | number | bigint | null | undefined

export function unixMillisecondsToString(
    value: NumericScalar,
): string | null | undefined {
    if (value === null || value === undefined) {
        return value
    }
    const d = new Date(typeof value === "bigint" ? Number(value) : value)

    function pad(number: number | string): number | string {
        if (number < 10) {
            return "0" + number
        }
        return number
    }

    return (
        d.getUTCFullYear() +
        "-" +
        pad(d.getUTCMonth() + 1) +
        "-" +
        pad(d.getUTCDate()) +
        " " +
        pad(d.getUTCHours()) +
        ":" +
        pad(d.getUTCMinutes()) +
        ":" +
        pad(d.getUTCSeconds()) +
        "." +
        (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5)
    )
}

export function unixSecondsToString(
    value: NumericScalar,
): string | null | undefined {
    if (value === null || value === undefined) {
        return value
    }
    return unixMillisecondsToString(Number(value) * 1000)
}

const BigNumberFormat = {
    HEX: "HEX",
    DEC: "DEC",
}

function invertedHex(hex: string): string {
    return Array.from(hex)
        .map(c => (Number.parseInt(c, 16) ^ 0xf).toString(16))
        .join("")
}

export type BigIntArgs = { format?: "HEX" | "DEC" }
export type AddressArgs = {
    format?: "HEX" | "ACCOUNT_ID" | "BASE64"
    bounceable?: boolean
    testOnly?: boolean
    urlSafe?: boolean
}
export type JoinArgs = { when?: CollectionFilter; timeout?: number }

export function parseBigUInt(
    prefixLength: number,
    value: NumericScalar,
): number | null | undefined {
    if (value === null || value === undefined) {
        return value
    }
    if (typeof value === "number") {
        return value
    }
    const s = value.toString().trim()
    const neg = s.startsWith("-")
    const hex = `0x${
        neg ? invertedHex(s.substr(prefixLength + 1)) : s.substr(prefixLength)
    }`
    const num = Number(hex)
    return neg ? -num : num
}

export function resolveBigUInt(
    prefixLength: number,
    value: NumericScalar,
    args?: BigIntArgs,
): string | null | undefined {
    if (value === null || value === undefined) {
        return value
    }
    let neg
    let hex
    if (typeof value === "number") {
        neg = value < 0
        hex = `0x${(neg ? -value : value).toString(16)}`
    } else {
        const s = value.toString().trim()
        neg = s.startsWith("-")
        hex = `0x${
            neg
                ? invertedHex(s.substr(prefixLength + 1))
                : s.substr(prefixLength)
        }`
    }
    const format = (args && args.format) || BigNumberFormat.HEX
    return `${neg ? "-" : ""}${
        format === BigNumberFormat.HEX ? hex : BigInt(hex).toString()
    }`
}

export function resolveAddressField(
    value: string | null | undefined,
    args?: AddressArgs,
): string | null | undefined {
    if (value === null || value === undefined || value === "") {
        return value
    }
    let format
    switch (args?.format ?? "HEX") {
        case "ACCOUNT_ID":
            format = addressStringFormatAccountId()
            break
        case "BASE64":
            format = addressStringFormatBase64(
                args?.urlSafe ?? false,
                args?.testOnly ?? false,
                args?.bounceable ?? false,
            )
            break
        default:
            format = addressStringFormatHex()
    }
    return resolveAddress(value, format)
}

export function convertBigUInt(
    prefixLength: number,
    value: NumericScalar,
): string | null | undefined {
    if (value === null || value === undefined) {
        return value
    }
    let big
    if (typeof value === "string") {
        const s = value.trim()
        big = s.startsWith("-") ? -BigInt(s.substr(1)) : BigInt(s)
    } else {
        big = BigInt(value)
    }
    const neg = big < BigInt(0)
    const hex = (neg ? -big : big).toString(16)
    const len = (hex.length - 1).toString(16)
    const missingZeros = prefixLength - len.length
    const prefix = missingZeros > 0 ? `${"0".repeat(missingZeros)}${len}` : len
    const result = `${prefix}${hex}`
    return neg ? `-${invertedHex(result)}` : result
}

export const scalar: QType = createScalar()
export const stringLowerFilter: QType = createScalar(x =>
    x ? `${x}`.toLowerCase() : x,
)
export const addressFilter: QType = createScalar(x =>
    x ? resolveAddress(`${x}`) : x,
)
export const bigUInt1: QType = createScalar(x =>
    convertBigUInt(1, x as NumericScalar),
)
export const bigUInt2: QType = createScalar(x =>
    convertBigUInt(2, x as NumericScalar),
)

//------------------------------------------------------------- Structs

export function splitOr(filter: CollectionFilter): CollectionFilter[] {
    const operands: CollectionFilter[] = []
    let operand: CollectionFilter | null = filter
    while (operand) {
        if ("OR" in operand) {
            const withoutOr = Object.assign({}, operand)
            delete withoutOr["OR"]
            operands.push(withoutOr)
            operand = operand.OR ?? null
        } else {
            operands.push(operand)
            operand = null
        }
    }
    return operands
}

export function struct(
    fields: { [name: string]: QType },
    isCollection?: boolean,
): QType {
    return {
        fields,
        filterCondition(params, path, filter) {
            const orOperands = splitOr(filter).map(operand => {
                return filterConditionForFields(
                    path,
                    operand as StructFilter,
                    fields,
                    (fieldType, path, filterKey, filterValue) => {
                        const fieldName =
                            isCollection && filterKey === "id"
                                ? "_key"
                                : filterKey
                        return fieldType.filterCondition(
                            params,
                            combinePath(path, fieldName),
                            filterValue,
                        )
                    },
                )
            })
            return orOperands.length > 1
                ? `(${orOperands.join(") OR (")})`
                : orOperands[0]
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
            const expressions = new Map()
            collectReturnExpressions(
                request,
                expressions,
                `${path}.${name}`,
                def.selectionSet,
                fields,
            )
            return [
                {
                    name,
                    expression: `( ${path}.${name} && ${combineReturnExpressions(
                        expressions,
                    )} )`,
                },
            ]
        },
        test(_parent, value, filter) {
            if (!value) {
                return false
            }
            const orOperands = splitOr(filter)
            for (let i = 0; i < orOperands.length; i += 1) {
                if (
                    testFields(
                        value,
                        orOperands[i],
                        fields,
                        (fieldType, value, filterKey, filterValue) => {
                            const fieldName =
                                isCollection && filterKey === "id"
                                    ? "_key"
                                    : filterKey
                            return fieldType.test(
                                value,
                                (value as { [name: string]: unknown })[
                                    fieldName
                                ],
                                filterValue as CollectionFilter,
                            )
                        },
                    )
                ) {
                    return true
                }
            }
            return false
        },
    }
}

// Arrays

function getItemFilterCondition(
    itemType: QType,
    params: QParams,
    path: string,
    filter: CollectionFilter,
): string | null {
    let itemFilterCondition: string | null
    const explanation = params.explanation
    if (explanation) {
        const saveParentPath = explanation.parentPath
        explanation.parentPath = `${explanation.parentPath}${path}[*]`
        itemFilterCondition = itemType.filterCondition(
            params,
            "CURRENT",
            filter,
        )
        explanation.parentPath = saveParentPath
    } else {
        itemFilterCondition = itemType.filterCondition(
            params,
            "CURRENT",
            filter,
        )
    }
    return itemFilterCondition
}

function isValidFieldPathChar(c: string): boolean {
    if (c.length !== 1) {
        return false
    }
    return (
        (c >= "A" && c <= "Z") ||
        (c >= "a" && c <= "z") ||
        (c >= "0" && c <= "9") ||
        c === "_" ||
        c === "[" ||
        c === "*" ||
        c === "]" ||
        c === "."
    )
}

function isFieldPath(test: string): boolean {
    for (let i = 0; i < test.length; i += 1) {
        if (!isValidFieldPathChar(test[i])) {
            return false
        }
    }
    return true
}

function tryOptimizeArrayAny(
    path: string,
    itemFilterCondition: string | null,
    params: QParams,
): string | null {
    function tryOptimize(
        filterCondition: string,
        paramIndex: number,
    ): string | null {
        const paramName = `@v${paramIndex + 1}`
        const suffix = ` == ${paramName}`
        if (filterCondition === `CURRENT${suffix}`) {
            return `${paramName} IN ${path}[*]`
        }
        if (
            filterCondition.startsWith("CURRENT.") &&
            filterCondition.endsWith(suffix)
        ) {
            const fieldPath = filterCondition.slice(
                "CURRENT.".length,
                -suffix.length,
            )
            if (isFieldPath(fieldPath)) {
                return `${paramName} IN ${path}[*].${fieldPath}`
            }
        }
        return null
    }

    if (itemFilterCondition === null) {
        return null
    }
    if (
        !itemFilterCondition.startsWith("(") ||
        !itemFilterCondition.endsWith(")")
    ) {
        return tryOptimize(itemFilterCondition, params.count - 1)
    }
    const filterConditionParts = itemFilterCondition
        .slice(1, -1)
        .split(") OR (")
    if (filterConditionParts.length === 1) {
        return tryOptimize(itemFilterCondition, params.count - 1)
    }
    const optimizedParts = filterConditionParts
        .map((x, i) =>
            tryOptimize(x, params.count - filterConditionParts.length + i),
        )
        .filter(x => x !== null)
    if (optimizedParts.length !== filterConditionParts.length) {
        return null
    }
    return `(${optimizedParts.join(") OR (")})`
}

export function array(resolveItemType: () => QType): QType {
    let resolved: QType | null = null
    const ops = {
        all: {
            filterCondition(
                params: QParams,
                path: string,
                filter: CollectionFilter,
            ) {
                const itemType = resolved || (resolved = resolveItemType())
                const itemFilterCondition = getItemFilterCondition(
                    itemType,
                    params,
                    path,
                    filter,
                )
                return `LENGTH(${path}[* FILTER ${itemFilterCondition}]) == LENGTH(${path})`
            },
            returnExpressions(): QReturnExpression[] {
                throw NOT_IMPLEMENTED
            },
            test(parent: unknown, value: unknown, filter: CollectionFilter) {
                const itemType = resolved || (resolved = resolveItemType())
                const failedIndex = (value as unknown[]).findIndex(
                    x => !itemType.test(parent, x, filter),
                )
                return failedIndex < 0
            },
        },
        any: {
            filterCondition(
                params: QParams,
                path: string,
                filter: CollectionFilter,
            ) {
                const itemType = resolved || (resolved = resolveItemType())
                const itemFilterCondition = getItemFilterCondition(
                    itemType,
                    params,
                    path,
                    filter,
                )
                const optimizedFilterCondition = tryOptimizeArrayAny(
                    path,
                    itemFilterCondition,
                    params,
                )
                if (optimizedFilterCondition) {
                    return optimizedFilterCondition
                }
                return `LENGTH(${path}[* FILTER ${itemFilterCondition}]) > 0`
            },
            returnExpressions(): QReturnExpression[] {
                throw NOT_IMPLEMENTED
            },
            test(parent: unknown, value: unknown, filter: CollectionFilter) {
                const itemType = resolved || (resolved = resolveItemType())
                const succeededIndex = (value as unknown[]).findIndex(x =>
                    itemType.test(parent, x, filter),
                )
                return succeededIndex >= 0
            },
        },
    }
    return {
        filterCondition(params, path, filter) {
            return filterConditionForFields(
                path,
                filter as StructFilter,
                ops,
                (op, path, _filterKey, filterValue) => {
                    return op.filterCondition(params, path, filterValue)
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
            let expression
            if (
                def.selectionSet !== undefined &&
                def.selectionSet.selections.length > 0
            ) {
                const itemType = resolved || (resolved = resolveItemType())
                const fieldPath = `${path}.${name}`
                const alias = fieldPath.split(".").join("__")
                const expressions = new Map()
                collectReturnExpressions(
                    request,
                    expressions,
                    alias,
                    def.selectionSet,
                    itemType.fields || {},
                )
                const itemExpression = combineReturnExpressions(expressions)
                expression = `( ${fieldPath} && ( FOR ${alias} IN ${fieldPath} || [] RETURN ${itemExpression} ) )`
            } else {
                expression = `${path}.${name}`
            }
            return [
                {
                    name,
                    expression,
                },
            ]
        },
        test(parent, value, filter) {
            if (!value) {
                return false
            }
            return testFields(
                value,
                filter,
                ops,
                (op, value, _filterKey, filterValue) => {
                    return op.test(
                        parent,
                        value,
                        filterValue as CollectionFilter,
                    )
                },
            )
        },
    }
}

//------------------------------------------------------------- Enum Names

function createEnumNamesMap(values: {
    [name: string]: number
}): Map<number, string> {
    const names: Map<number, string> = new Map()
    Object.entries(values).forEach(([name, value]) => {
        names.set(value, name)
    })
    return names
}

export function enumName(
    onField: string,
    values: { [name: string]: number },
): QType {
    const resolveValue = (name: string) => {
        const value = values[name]
        if (value === undefined) {
            throw new Error(`Invalid value [${name}] for ${onField}_name`)
        }
        return value
    }

    return {
        filterCondition(params, path, filter) {
            const on_path = path
                .split(".")
                .slice(0, -1)
                .concat(onField)
                .join(".")
            return filterConditionForFields(
                on_path,
                filter as StructFilter,
                scalarOps,
                (op, path, _filterKey, filterValue) => {
                    const resolved =
                        op === scalarOps.in || op === scalarOps.notIn
                            ? (filterValue as string[]).map(resolveValue)
                            : resolveValue(filterValue as string)
                    return op.filterCondition(
                        params,
                        path,
                        resolved as CollectionFilter,
                    )
                },
            )
        },
        returnExpressions(
            _request: QRequestParams,
            path: string,
        ): QReturnExpression[] {
            return [
                {
                    name: onField,
                    expression: `${path}.${onField}`,
                },
            ]
        },
        test(parent, value, filter) {
            return testFields(
                value,
                filter,
                scalarOps,
                (op, _value, _filterKey, filterValue) => {
                    const resolved =
                        op === scalarOps.in || op === scalarOps.notIn
                            ? (filterValue as string[]).map(resolveValue)
                            : resolveValue(filterValue as string)
                    return op.test(
                        parent,
                        (parent as { [name: string]: unknown })[onField],
                        resolved as CollectionFilter,
                    )
                },
            )
        },
    }
}

export function createEnumNameResolver(
    onField: string,
    values: { [name: string]: number },
): (parent: { [name: string]: unknown }) => string | null {
    const names = createEnumNamesMap(values)
    return parent => {
        const value = parent[onField] as number
        const name = names.get(value)
        return name !== undefined ? name : null
    }
}

export function intFlags(onField: string): QType {
    return {
        filterCondition(_params, _path, _filter) {
            return "false"
        },
        returnExpressions(
            _request: QRequestParams,
            path: string,
        ): QReturnExpression[] {
            return [
                {
                    name: onField,
                    expression: `${path}.${onField}`,
                },
            ]
        },
        test(_parent, _value, _filter) {
            return false
        },
    }
}

export function createFlagsResolver(
    onField: string,
    values: { [name: string]: number },
): (parent: { [name: string]: unknown }) => string[] | null {
    return parent => {
        const flags = parseBigUInt(1, parent[onField] as NumericScalar)
        if (flags === undefined || flags === null) {
            return null
        }
        if (flags === 0) {
            return []
        }
        const names = []
        for (const [name, flag] of Object.entries(values)) {
            if ((flag & flags) !== 0) {
                names.push(name)
            }
        }
        return names
    }
}

//------------------------------------------------------------- String Companions

export function stringCompanion(onField: string): QType {
    return {
        filterCondition() {
            return "false"
        },
        returnExpressions(_request: QRequestParams, path: string) {
            return [
                {
                    name: onField,
                    expression: `${path}.${onField}`,
                },
            ]
        },
        test() {
            return false
        },
    }
}

//------------------------------------------------------------- Joins

export function join(
    onField: string,
    _refField: string,
    refCollection: string,
    extraFields: string[],
    resolveRefType: () => QType,
): QType {
    let resolved: QType | null = null
    const name = onField === "id" ? "_key" : onField
    return {
        filterCondition(params, path, filter) {
            const refType = resolved || (resolved = resolveRefType())
            const on_path = path
                .split(".")
                .slice(0, -1)
                .concat(onField)
                .join(".")
            const alias = `${on_path.replace(".", "_")}`
            const refFilterCondition = refType.filterCondition(
                params,
                alias,
                filter,
            )
            return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refFilterCondition})
                    LIMIT 1
                    RETURN 1
                ) > 0`
        },
        returnExpressions(
            _request: QRequestParams,
            path: string,
        ): QReturnExpression[] {
            return [
                {
                    name,
                    expression: `${path}.${name}`,
                },
                ...extraFields.map(x => ({
                    name: x,
                    expression: `${path}.${x}`,
                })),
            ]
        },
        test(parent, value, filter) {
            const refType = resolved || (resolved = resolveRefType())
            return refType.test(parent, value, filter)
        },
    }
}

export function joinArray(
    onField: string,
    _refField: string,
    refCollection: string,
    extraFields: string[],
    resolveRefType: () => QType,
): QType {
    let resolved: QType | null = null
    return {
        filterCondition(params, path, filter) {
            const refType = resolved || (resolved = resolveRefType())
            const arrayFilter = filter as ArrayFilter
            const all = "all" in arrayFilter
            const refFilter =
                "all" in arrayFilter ? arrayFilter.all : arrayFilter.any
            const on_path = path
                .split(".")
                .slice(0, -1)
                .concat(onField)
                .join(".")
            const alias = `${on_path.replace(".", "_")}`
            const refFilterCondition = refType.filterCondition(
                params,
                alias,
                refFilter,
            )
            return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refFilterCondition})
                    ${!all ? "LIMIT 1" : ""}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : "> 0"})`
        },
        returnExpressions(
            _request: QRequestParams,
            path: string,
        ): QReturnExpression[] {
            return [
                {
                    name: onField,
                    expression: `${path}.${onField}`,
                },
                ...extraFields.map(x => ({
                    name: x,
                    expression: `${path}.${x}`,
                })),
            ]
        },
        test(parent, value, filter) {
            const refType = resolved || (resolved = resolveRefType())
            return refType.test(parent, value, filter)
        },
    }
}

export type { QType }

export type FieldSelection = {
    name: string
    selection: FieldSelection[]
}

function isFieldWithName(def: SelectionNode, name: string): boolean {
    return (
        def.kind === "Field" &&
        def.name.value.toLowerCase() === name.toLowerCase()
    )
}

export function mergeFieldWithSelectionSet(
    fieldPath: string,
    selectionSet: SelectionSetNode | undefined,
): SelectionSetNode {
    const dotPos = fieldPath.indexOf(".")
    const name = dotPos >= 0 ? fieldPath.substr(0, dotPos) : fieldPath
    const tail = dotPos >= 0 ? fieldPath.substr(dotPos + 1) : ""
    const selections = selectionSet?.selections ?? []
    const oldField = selections.find(x => isFieldWithName(x, name)) as
        | FieldNode
        | undefined
    const tailSelectionSet =
        tail !== ""
            ? mergeFieldWithSelectionSet(tail, oldField?.selectionSet)
            : oldField?.selectionSet
    if (
        selectionSet !== undefined &&
        oldField !== undefined &&
        tailSelectionSet === oldField?.selectionSet
    ) {
        return selectionSet
    }
    const newField: FieldNode = {
        ...(oldField ?? {
            kind: "Field",
            name: {
                kind: "Name",
                value: name,
            },
            arguments: [],
            directives: [],
        }),
        selectionSet: tailSelectionSet,
    }
    return {
        kind: "SelectionSet",
        selections:
            oldField === undefined
                ? [...selections, newField]
                : selections.map(x => (x === oldField ? newField : x)),
    }
}

export function parseSelectionSet(
    selectionSet: SelectionSetNode | undefined,
    returnFieldSelection: string,
): FieldSelection[] {
    const fields: FieldSelection[] = []
    const selections = selectionSet?.selections
    if (selections !== undefined) {
        for (const item of selections) {
            if (item.kind === "Field") {
                const field: FieldSelection = {
                    name: item.name.value,
                    selection: parseSelectionSet(item.selectionSet, ""),
                }
                if (
                    returnFieldSelection !== "" &&
                    field.name === returnFieldSelection
                ) {
                    return field.selection
                }
                fields.push(field)
            }
        }
    }
    return fields
}

export function selectionToString(selection: FieldSelection[]): string {
    return selection
        .filter(x => x.name !== "__typename")
        .map((field: FieldSelection) => {
            const fieldSelection = selectionToString(field.selection)
            return `${field.name}${
                fieldSelection !== "" ? ` { ${fieldSelection} }` : ""
            }`
        })
        .join(" ")
}

export function selectFields(
    doc: QDoc | unknown[],
    selection: FieldSelection[],
): unknown {
    if (selection.length === 0) {
        return doc
    }
    if (Array.isArray(doc)) {
        return doc.map(x => selectFields(x as QDoc, selection))
    }
    const selected: { [name: string]: unknown } = {}
    if (doc._key) {
        selected._key = doc._key
        selected.id = doc._key
    }
    for (const item of selection) {
        let companionFields = {
            in_message: ["in_msg"],
            out_messages: ["out_msg"],
            signatures: ["id"],
            src_transaction: ["id", "msg_type"],
            dst_transaction: ["id", "msg_type"],
        }[item.name]
        if (companionFields === undefined) {
            if (item.name.endsWith("_name")) {
                companionFields = [item.name.slice(0, -5)]
            } else if (item.name.endsWith("_string")) {
                companionFields = [item.name.slice(0, -7)]
            } else if (item.name.endsWith("_flags")) {
                companionFields = [item.name.slice(0, -6)]
            }
        }
        if (companionFields !== undefined) {
            companionFields.forEach(field => {
                if (doc[field] !== undefined) {
                    selected[field] = doc[field]
                }
            })
        }
        const value = doc[item.name]
        if (value !== undefined) {
            selected[item.name] =
                item.selection.length > 0
                    ? selectFields(value as QDoc, item.selection)
                    : value
        }
    }
    return selected
}

export type OrderBy = {
    path: string
    direction: string
}

export type QueryStat = {
    isFast: boolean
}

export function indexToString(index: QIndexInfo): string {
    return index.fields.join(", ")
}

export function orderByToString(orderBy: OrderBy[]): string {
    return orderBy
        .map(x => `${x.path}${(x.direction || "") === "DESC" ? " DESC" : ""}`)
        .join(", ")
}

export function parseOrderBy(s: string): OrderBy[] {
    return s
        .split(",")
        .map(x => x.trim())
        .filter(x => x)
        .map(s => {
            const parts = s.split(" ").filter(x => x)
            return {
                path: parts[0],
                direction:
                    (parts[1] || "").toLowerCase() === "desc" ? "DESC" : "ASC",
            }
        })
}
