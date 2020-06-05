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

// @flow


import type {AccessRights} from "./auth";
import type {IndexInfo} from "./config";

declare function BigInt(a: any): any;

export type QFieldExplanation = {
    operations: Set<string>,
}

function combinePath(base: string, path: string): string {
    const b = base.endsWith('.') ? base.slice(0, -1) : base;
    const p = path.startsWith('.') ? path.slice(1) : path;
    const sep = p && b ? '.' : '';
    return `${b}${sep}${p}`;
}

export type ScalarField = {
    path: string,
    type: ('number' | 'uint64' | 'uint1024' | 'boolean' | 'string'),
}

export class QExplanation {
    parentPath: string;
    fields: Map<string, QFieldExplanation>;

    constructor() {
        this.parentPath = '';
        this.fields = new Map();
    }

    explainScalarOperation(path: string, op: string) {
        let p = path;
        if (p.startsWith('CURRENT')) {
            p = combinePath(this.parentPath, p.substr('CURRENT'.length));
        }
        const existing: QFieldExplanation | typeof undefined = this.fields.get(p);
        if (existing) {
            existing.operations.add(op);
        } else {
            this.fields.set(p, {
                operations: new Set([op]),
            })
        }
    }
}

export type QParamsOptions = {
    explain?: boolean,
}

/**
 * Query parameters
 */
export class QParams {
    values: { [string]: any };
    count: number;
    explanation: ?QExplanation;

    constructor(options?: QParamsOptions) {
        this.count = 0;
        this.values = {};
        this.explanation = (options && options.explain)
            ? new QExplanation()
            : null;
    }

    clear() {
        this.count = 0;
        this.values = {};
    }

    add(value: any): string {
        this.count += 1;
        const name = `v${this.count.toString()}`;
        this.values[name] = value;
        return name;
    }

    explainScalarOperation(field: string, op: string) {
        if (this.explanation) {
            this.explanation.explainScalarOperation(field, op);
        }
    }
}

/**
 * Abstract interface for objects that acts as a helpers to perform queries over documents
 * using query filters.
 */
type QType = {
    /**
     * Generates an Arango QL condition for specified field based on specified filter.
     * The condition must be a string expression that evaluates to boolean.
     *
     * @param {string} path Path from document root to concrete field
     * @param {any} filter Filter that will be applied to this field
     * @return {string} Arango QL condition text
     */
    ql: (params: QParams, path: string, filter: any) => string,
    /**
     * Tests value in document from Arango DB against specified filter.
     *
     * @param {any} value Value that must be tested against filter
     * @param {any} filter Filter used to test a value
     * @return true if value matches filter
     */
    test: (parent: any, value: any, filter: any) => boolean,
}


/**
 * Generates AQL condition for complex filter.
 *
 * @param {string} path Path to document field.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} qlField Function that generates condition for a concrete field.
 * @return {string} AQL condition
 */
function qlFields(
    path: string,
    filter: any,
    fieldTypes: { [string]: QType },
    qlField: (field: any, path: string, filterKey: string, filterValue: any) => string,
): string {
    const conditions: string[] = [];
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        if (fieldType) {
            conditions.push(qlField(fieldType, path, filterKey, filterValue))
        } else {
            throw new Error(`Invalid filter field: ${filterKey}`);
        }
    });
    return qlCombine(conditions, 'AND', 'false');
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
function testFields(
    value: any,
    filter: any,
    fieldTypes: { [string]: QType },
    testField: (fieldType: any, value: any, filterKey: string, filterValue: any) => boolean,
): boolean {
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        if (!fieldType) {
            throw new Error(`Invalid filter field: ${filterKey}`);
        }
        return !(fieldType && testField(fieldType, value, filterKey, filterValue));
    });
    return !failed;
}

function qlOp(params: QParams, path: string, op: string, filter: any): string {
    params.explainScalarOperation(path, op);
    const paramName = params.add(filter);

    /*
     * Following TO_STRING cast required due to specific comparision of _key fields in Arango
     * For example this query:
     * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
     * Will return:
     * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
     */
    const isKeyOrderedComparision = (path === '_key' || path.endsWith('._key')) && op !== '==' && op !== '!=';
    const fixedPath = isKeyOrderedComparision ? `TO_STRING(${path})` : path;
    const fixedValue = `@${paramName}`;
    return `${fixedPath} ${op} ${fixedValue}`;
}

function qlCombine(conditions: string[], op: string, defaultConditions: string): string {
    if (conditions.length === 0) {
        return defaultConditions;
    }
    if (conditions.length === 1) {
        return conditions[0];
    }
    return '(' + conditions.join(`) ${op} (`) + ')';
}

function qlIn(params: QParams, path: string, filter: any): string {
    const conditions = filter.map(value => qlOp(params, path, '==', value));
    return qlCombine(conditions, 'OR', 'false');
}

//------------------------------------------------------------- Scalars

function undefinedToNull(v: any): any {
    return v !== undefined ? v : null;
}

const scalarEq: QType = {
    ql(params: QParams, path, filter) {
        return qlOp(params, path, '==', filter);
    },
    test(parent, value, filter) {
        return value === filter;
    },
};

const scalarNe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '!=', filter);
    },
    test(parent, value, filter) {
        return value !== filter;
    },
};

const scalarLt: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '<', filter);
    },
    test(parent, value, filter) {
        return value < filter;
    },
};

const scalarLe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '<=', filter);
    },
    test(parent, value, filter) {
        return value <= filter;
    },
};

const scalarGt: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '>', filter);
    },
    test(parent, value, filter) {
        return value > filter;
    },
};

const scalarGe: QType = {
    ql(params, path, filter) {
        return qlOp(params, path, '>=', filter);
    },
    test(parent, value, filter) {
        return value >= filter;
    },
};

const scalarIn: QType = {
    ql(params, path, filter) {
        return qlIn(params, path, filter);
    },
    test(parent, value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn: QType = {
    ql(params, path, filter) {
        return `NOT (${qlIn(params, path, filter)})`;
    },
    test(parent, value, filter) {
        return !filter.includes(value);
    },
};

const scalarOps = {
    eq: scalarEq,
    ne: scalarNe,
    lt: scalarLt,
    le: scalarLe,
    gt: scalarGt,
    ge: scalarGe,
    in: scalarIn,
    notIn: scalarNotIn,
};

function createScalar(): QType {
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                return op.ql(params, path, filterValue);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                return op.test(parent, undefinedToNull(value), filterValue);
            });
        },
    };
}

export function unixMillisecondsToString(value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    const d = new Date(value);

    function pad(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }

    return d.getUTCFullYear() +
        '-' + pad(d.getUTCMonth() + 1) +
        '-' + pad(d.getUTCDate()) +
        ' ' + pad(d.getUTCHours()) +
        ':' + pad(d.getUTCMinutes()) +
        ':' + pad(d.getUTCSeconds()) +
        '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

export function unixSecondsToString(value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    return unixMillisecondsToString(value * 1000);
}

const BigNumberFormat = {
    HEX: 'HEX',
    DEC: 'DEC',
};

function invertedHex(hex: string): string {
    return Array.from(hex)
        .map(c => (Number.parseInt(c, 16) ^ 0xf).toString(16))
        .join('');
}

export function resolveBigUInt(prefixLength: number, value: any, args?: { format?: 'HEX' | 'DEC' }): string {
    if (value === null || value === undefined) {
        return value;
    }
    let neg;
    let hex;
    if (typeof value === 'number') {
        neg = value < 0;
        hex = `0x${(neg ? -value : value).toString(16)}`;
    } else {
        const s = value.toString().trim();
        neg = s.startsWith('-');
        hex = `0x${neg ? invertedHex(s.substr(prefixLength + 1)) : s.substr(prefixLength)}`;
    }
    const format = (args && args.format) || BigNumberFormat.HEX;
    return `${neg ? '-' : ''}${(format === BigNumberFormat.HEX) ? hex : BigInt(hex).toString()}`;
}

export function convertBigUInt(prefixLength: number, value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    let big;
    if (typeof value === 'string') {
        const s = value.trim();
        big = s.startsWith('-') ? -BigInt(s.substr(1)) : BigInt(s);
    } else {
        big = BigInt(value);
    }
    const neg = big < BigInt(0);
    const hex = (neg ? -big : big).toString(16);
    const len = (hex.length - 1).toString(16);
    const missingZeros = prefixLength - len.length;
    const prefix = missingZeros > 0 ? `${'0'.repeat(missingZeros)}${len}` : len;
    const result = `${prefix}${hex}`;
    return neg ? `-${invertedHex(result)}` : result;
}

function createBigUInt(prefixLength: number): QType {
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                const converted = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(x => convertBigUInt(prefixLength, x))
                    : convertBigUInt(prefixLength, filterValue);
                return op.ql(params, path, converted);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                const converted = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(x => convertBigUInt(prefixLength, x))
                    : convertBigUInt(prefixLength, filterValue);
                return op.test(parent, value, converted);
            });
        },
    };
}

export const scalar: QType = createScalar();
export const bigUInt1: QType = createBigUInt(1);
export const bigUInt2: QType = createBigUInt(2);

//------------------------------------------------------------- Structs

export function splitOr(filter: any): any[] {
    const operands = [];
    let operand = filter;
    while (operand) {
        if ('OR' in operand) {
            const withoutOr = Object.assign({}, operand);
            delete withoutOr['OR'];
            operands.push(withoutOr);
            operand = operand.OR;
        } else {
            operands.push(operand);
            operand = null;
        }
    }
    return operands;
}

export function struct(fields: { [string]: QType }, isCollection?: boolean): QType {
    return {
        ql(params, path, filter) {
            const orOperands = splitOr(filter).map((operand) => {
                return qlFields(path, operand, fields, (fieldType, path, filterKey, filterValue) => {
                    const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                    return fieldType.ql(params, combinePath(path, fieldName), filterValue);
                });
            });
            return (orOperands.length > 1) ? `(${orOperands.join(') OR (')})` : orOperands[0];
        },
        test(parent, value, filter) {
            if (!value) {
                return false;
            }
            const orOperands = splitOr(filter);
            for (let i = 0; i < orOperands.length; i += 1) {
                if (testFields(value, orOperands[i], fields, (fieldType, value, filterKey, filterValue) => {
                    const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                    return fieldType.test(value, value[fieldName], filterValue);
                })) {
                    return true;
                }
            }
            return false;
        },
    }
}

// Arrays

function getItemQL(itemType: QType, params: QParams, path: string, filter: any): string {
    let itemQl: string;
    const explanation = params.explanation;
    if (explanation) {
        const saveParentPath = explanation.parentPath;
        explanation.parentPath = `${explanation.parentPath}${path}[*]`;
        itemQl = itemType.ql(params, 'CURRENT', filter);
        explanation.parentPath = saveParentPath;
    } else {
        itemQl = itemType.ql(params, 'CURRENT', filter);
    }
    return itemQl;
}

function isValidFieldPathChar(c: string): boolean {
    if (c.length !== 1) {
        return false;
    }
    return (c >= 'A' && c <= 'Z')
        || (c >= 'a' && c <= 'z')
        || (c >= '0' && c <= '9')
        || (c === '_' || c === '[' || c === '*' || c === ']' || c === '.');
}

function isFieldPath(test: string): boolean {
    for (let i = 0; i < test.length; i += 1) {
        if (!isValidFieldPathChar(test[i])) {
            return false;
        }
    }
    return true;
}

function tryOptimizeArrayAny(path: string, itemQl: string, params: QParams): ?string {
    const paramName = `@v${params.count}`;
    const suffix = ` == ${paramName}`;
    if (itemQl === `CURRENT${suffix}`) {
        return `${paramName} IN ${path}[*]`;
    }
    if (itemQl.startsWith('CURRENT.') && itemQl.endsWith(suffix)) {
        const fieldPath = itemQl.slice('CURRENT.'.length, -suffix.length);
        if (isFieldPath(fieldPath)) {
            return `${paramName} IN ${path}[*].${fieldPath}`;
        }
    }
    return null;
}

export function array(resolveItemType: () => QType): QType {
    let resolved: ?QType = null;
    const ops = {
        all: {
            ql(params, path, filter) {
                const itemType = resolved || (resolved = resolveItemType());
                const itemQl = getItemQL(itemType, params, path, filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
            },
            test(parent, value, filter) {
                const itemType = resolved || (resolved = resolveItemType());
                const failedIndex = value.findIndex(x => !itemType.test(parent, x, filter));
                return failedIndex < 0;
            },
        },
        any: {
            ql(params, path, filter) {
                const itemType = resolved || (resolved = resolveItemType());
                const itemQl = getItemQL(itemType, params, path, filter);
                const optimizedQl = tryOptimizeArrayAny(path, itemQl, params);
                if (optimizedQl) {
                    return optimizedQl;
                }
                return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
            },
            test(parent, value, filter) {
                const itemType = resolved || (resolved = resolveItemType());
                const succeededIndex = value.findIndex(x => itemType.test(parent, x, filter));
                return succeededIndex >= 0;
            },
        },
    };
    return {
        ql(params, path, filter) {
            return qlFields(path, filter, ops, (op, path, filterKey, filterValue) => {
                return op.ql(params, path, filterValue);
            });
        },
        test(parent, value, filter) {
            if (!value) {
                return false;
            }
            return testFields(value, filter, ops, (op, value, filterKey, filterValue) => {
                return op.test(parent, value, filterValue);
            });
        },
    }
}

//------------------------------------------------------------- Enum Names

function createEnumNamesMap(values: { [string]: number }): Map<number, string> {
    const names: Map<number, string> = new Map();
    Object.entries(values).forEach(([name, value]) => {
        names.set(Number.parseInt((value: any)), name);
    });
    return names;
}

export function enumName(onField: string, values: { [string]: number }): QType {
    const resolveValue = (name) => {
        let value = values[name];
        if (value === undefined) {
            throw new Error(`Invalid value [${name}] for ${onField}_name`);
        }
        return value;
    };

    return {
        ql(params, path, filter) {
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            return qlFields(on_path, filter, scalarOps, (op, path, filterKey, filterValue) => {
                const resolved = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(resolveValue)
                    : resolveValue(filterValue);
                return op.ql(params, path, resolved);
            });
        },
        test(parent, value, filter) {
            return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
                const resolved = (op === scalarOps.in || op === scalarOps.notIn)
                    ? filterValue.map(resolveValue)
                    : resolveValue(filterValue);
                return op.test(parent, parent[onField], resolved);
            });
        },
    };
}

export function createEnumNameResolver(onField: string, values: { [string]: number }): (parent) => ?string {
    const names = createEnumNamesMap(values);
    return (parent) => {
        const value = parent[onField];
        const name = names.get(value);
        return name !== undefined ? name : null;
    };
}

//------------------------------------------------------------- Joins

export function join(onField: string, refField: string, refCollection: string, resolveRefType: () => QType): QType {
    let resolved: ?QType = null;
    return {
        ql(params, path, filter) {
            const refType = resolved || (resolved = resolveRefType());
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(params, alias, filter);
            return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refQl})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
        },
        test(parent, value, filter) {
            const refType = resolved || (resolved = resolveRefType());
            return refType.test(parent, value, filter);
        },
    };
}

export function joinArray(
    onField: string,
    refField: string,
    refCollection: string,
    resolveRefType: () => QType,
): QType {
    let resolved: ?QType = null;
    return {
        ql(params, path, filter) {
            const refType = resolved || (resolved = resolveRefType());
            const refFilter = filter.all || filter.any;
            const all = !!filter.all;
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(params, alias, refFilter);
            return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refQl})
                    ${!all ? 'LIMIT 1' : ''}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : '> 0'})`;
        },
        test(parent, value, filter) {
            const refType = resolved || (resolved = resolveRefType());
            return refType.test(parent, value, filter);
        },
    };
}

export type {
    QType,
}

export type FieldSelection = {
    name: string,
    selection: FieldSelection[],
}

export function parseSelectionSet(selectionSet: any, returnFieldSelection: string): FieldSelection[] {
    const fields: FieldSelection[] = [];
    const selections = selectionSet && selectionSet.selections;
    if (selections) {
        for (const item of selections) {
            const name = (item.name && item.name.value) || '';
            if (name) {
                const field: FieldSelection = {
                    name,
                    selection: parseSelectionSet(item.selectionSet, ''),
                };
                if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
                    return field.selection;
                }
                fields.push(field);
            }
        }
    }
    return fields;
}

export function selectionToString(selection: FieldSelection[]): string {
    return selection
        .filter(x => x.name !== '__typename')
        .map((field: FieldSelection) => {
            const fieldSelection = selectionToString(field.selection);
            return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
        }).join(' ');
}

export function selectFields(doc: any, selection: FieldSelection[]): any {
    if (selection.length === 0) {
        return doc;
    }
    if (Array.isArray(doc)) {
        return doc.map(x => selectFields(x, selection));
    }
    const selected: any = {};
    if (doc._key) {
        selected._key = doc._key;
        selected.id = doc._key;
    }
    for (const item of selection) {
        const requiredForJoin = {
            in_message: ['in_msg'],
            out_messages: ['out_msg'],
            signatures: ['id'],
            src_transaction: ['id', 'msg_type'],
            dst_transaction: ['id', 'msg_type'],
        }[item.name];
        if (requiredForJoin !== undefined) {
            requiredForJoin.forEach((field) => {
                if (doc[field] !== undefined) {
                    selected[field] = doc[field];
                }
            });
        }
        const value = doc[item.name];
        if (value !== undefined) {
            selected[item.name] = item.selection.length > 0
                ? selectFields(value, item.selection)
                : value;
        }
    }
    return selected;
}

export type OrderBy = {
    path: string,
    direction: string,
}

export type DatabaseQuery = {
    filter: any,
    selection: FieldSelection[],
    orderBy: OrderBy[],
    limit: number,
    timeout: number,
    operationId: ?string,
    text: string,
    params: { [string]: any },
    accessRights: AccessRights,
}

export type QueryStat = {
    isFast: boolean,
}

export function indexToString(index: IndexInfo): string {
    return index.fields.join(', ');
}

export function parseIndex(s: string): IndexInfo {
    return {
        fields: s.split(',').map(x => x.trim()).filter(x => x),
    }
}

export function orderByToString(orderBy: OrderBy[]): string {
    return orderBy.map(x => `${x.path}${(x.direction || '') === 'DESC' ? ' DESC' : ''}`).join(', ');
}

export function parseOrderBy(s: string): OrderBy[] {
    return s.split(',')
        .map(x => x.trim())
        .filter(x => x)
        .map((s) => {
            const parts = s.split(' ').filter(x => x);
            return {
                path: parts[0],
                direction: (parts[1] || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC',
            }
        });
}


