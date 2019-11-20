/*
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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


declare function BigInt(a: any): any;

export class QLContext {
    vars: { [string]: any };
    varCount: number;

    constructor() {
        this.varCount = 0;
        this.vars = {};
    }

    clear() {
        this.varCount = 0;
        this.vars = {};
    }

    bindVar(value: any): string {
        this.varCount += 1;
        const name = `v${this.varCount.toString()}`;
        this.vars[name] = value;
        return name;
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
    ql: (context: QLContext, path: string, filter: any) => string,
    /**
     * Tests value in document from Arango DB against specified filter.
     *
     * @param {any} value Value that must be tested against filter
     * @param {any} filter Filter used to test a value
     * @return true if value matches filter
     */
    test: (value: any, filter: any) => boolean,
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
    qlField: (field: any, path: string, filterKey: string, filterValue: any) => string
): string {
    const conditions: string[] = [];
    Object.entries(filter).forEach(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        if (fieldType) {
            conditions.push(qlField(fieldType, path, filterKey, filterValue))
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
    testField: (fieldType: any, value: any, filterKey: string, filterValue: any) => boolean
): boolean {
    const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
        const fieldType = fieldTypes[filterKey];
        return !(fieldType && testField(fieldType, value, filterKey, filterValue));
    });
    return !failed;
}


function combine(path: string, key: string): string {
    return key !== '' ? `${path}.${key}` : path;
}

/*
 * Following TO_STRING cast required due to specific comparision of _key fields in Arango
 * For example this query:
 * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
 * Will return:
 * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
 */
function fixKeyPath(path: string): string {
    return path.endsWith('._key') ? `TO_STRING(${path})` : path;
}

function qlOp(context: QLContext, path: string, op: string, filter: any): string {
    const varName = context.bindVar(filter);
    return `${fixKeyPath(path)} ${op} @${varName}`;
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

function qlIn(context: QLContext, path: string, filter: any): string {
    const conditions = filter.map(value => qlOp(context, fixKeyPath(path), '==', value));
    return qlCombine(conditions, 'OR', 'false');
}

// Scalars

const scalarEq: QType = {
    ql(context: QLContext, path, filter) {
        return qlOp(context, path, '==', filter);
    },
    test(value, filter) {
        return value === filter;
    },
};

const scalarNe: QType = {
    ql(context, path, filter) {
        return qlOp(context, path, '!=', filter);
    },
    test(value, filter) {
        return value !== filter;
    },
};

const scalarLt: QType = {
    ql(context, path, filter) {
        return qlOp(context, path, '<', filter);
    },
    test(value, filter) {
        return value < filter;
    },
};

const scalarLe: QType = {
    ql(context, path, filter) {
        return qlOp(context, path, '<=', filter);
    },
    test(value, filter) {
        return value <= filter;
    },
};

const scalarGt: QType = {
    ql(context, path, filter) {
        return qlOp(context, path, '>', filter);
    },
    test(value, filter) {
        return value > filter;
    },
};

const scalarGe: QType = {
    ql(context, path, filter) {
        return qlOp(context, path, '>=', filter);
    },
    test(value, filter) {
        return value >= filter;
    },
};

const scalarIn: QType = {
    ql(context, path, filter) {
        return qlIn(context, path, filter);
    },
    test(value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn: QType = {
    ql(context, path, filter) {
        return `NOT (${qlIn(context, path, filter)})`;
    },
    test(value, filter) {
        return !filter.includes(value);
    }
};

function createScalar(): QType {
    const fields = {
        eq: scalarEq,
        ne: scalarNe,
        lt: scalarLt,
        le: scalarLe,
        gt: scalarGt,
        ge: scalarGe,
        in: scalarIn,
        notIn: scalarNotIn,
    };
    return {
        ql(context, path, filter) {
            return qlFields(path, filter, fields, (op, path, filterKey, filterValue) => {
                return op.ql(context, path, filterValue);
            });
        },
        test(value, filter) {
            return testFields(value, filter, fields, (op, value, filterKey, filterValue) => {
                return op.test(value, filterValue);
            });
        },
    };
}

function resolveBigUInt(prefixLength: number, value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    return (typeof value === 'number')
        ? `0x${value.toString(16)}`
        : `0x${value.toString().substr(prefixLength)}`;
}

function convertBigUInt(prefixLength: number, value: any): string {
    if (value === null || value === undefined) {
        return value;
    }
    const hex = BigInt(value).toString(16);
    const len = hex.length.toString(16);
    const missingZeros = prefixLength - len.length;
    const prefix = missingZeros > 0 ? `${'0'.repeat(missingZeros)}${len}` : len;
    return `${prefix}${hex}`;
}

function createBigUInt(prefixLength: number): QType {
    const fields = {
        eq: scalarEq,
        ne: scalarNe,
        lt: scalarLt,
        le: scalarLe,
        gt: scalarGt,
        ge: scalarGe,
        in: scalarIn,
        notIn: scalarNotIn,
    };
    return {
        ql(context, path, filter) {
            return qlFields(path, filter, fields, (op, path, filterKey, filterValue) => {
                return op.ql(context, path, convertBigUInt(prefixLength, filterValue));
            });
        },
        test(value, filter) {
            return testFields(value, filter, fields, (op, value, filterKey, filterValue) => {
                return op.test(value, convertBigUInt(prefixLength, filterValue));
            });
        },
    };
}

const scalar: QType = createScalar();
const bigUInt1: QType = createBigUInt(1);
const bigUInt2: QType = createBigUInt(2);

// Structs

function struct(fields: { [string]: QType }, isCollection?: boolean): QType {
    return {
        ql(context, path, filter) {
            return qlFields(path, filter, fields, (fieldType, path, filterKey, filterValue) => {
                const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                return fieldType.ql(context, combine(path, fieldName), filterValue);
            });
        },
        test(value, filter) {
            if (!value) {
                return false;
            }
            return testFields(value, filter, fields, (fieldType, value, filterKey, filterValue) => {
                const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                return fieldType.test(value[fieldName], filterValue);
            });
        }
    }
}

// Arrays

function array(itemType: QType): QType {
    const ops = {
        all: {
            ql(context, path, filter) {
                const itemQl = itemType.ql(context, 'CURRENT', filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
            },
            test(value, filter) {
                const failedIndex = value.findIndex(x => !itemType.test(x, filter));
                return failedIndex < 0;
            },
        },
        any: {
            ql(context, path, filter) {
                const itemQl = itemType.ql(context, 'CURRENT', filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
            },
            test(value, filter) {
                const succeededIndex = value.findIndex(x => itemType.test(x, filter));
                return succeededIndex >= 0;
            }
        },
    };
    return {
        ql(context, path, filter) {
            return qlFields(path, filter, ops, (op, path, filterKey, filterValue) => {
                return op.ql(context, path, filterValue);
            });
        },
        test(value, filter) {
            if (!value) {
                return false;
            }
            return testFields(value, filter, ops, (op, value, filterKey, filterValue) => {
                return op.test(value, filterValue);
            });
        }
    }
}

// Joins

function join(onField: string, refCollection: string, refType: QType): QType {
    return {
        ql(context, path, filter) {
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(context, alias, filter);
            return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refQl})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
        },
        test: refType.test,
    };
}

function joinArray(onField: string, refCollection: string, refType: QType): QType {
    return {
        ql(context, path, filter) {
            const refFilter = filter.all || filter.any;
            const all = !!filter.all;
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(context, alias, refFilter);
            return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refQl})
                    ${!all ? 'LIMIT 1' : ''}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : '> 0'})`;
        },
        test: refType.test,
    };
}

export {
    scalar,
    bigUInt1,
    bigUInt2,
    resolveBigUInt,
    convertBigUInt,
    struct,
    array,
    join,
    joinArray
}

export type {
    QType
}

