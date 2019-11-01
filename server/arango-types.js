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

type QType = {
    ql: (path: string, filter: any) => string,
    test: (value: any, filter: any) => boolean,
}

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

function qlOp(path: string, op: string, filter: any): string {
    return `${path} ${op} ${JSON.stringify(filter)}`;
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

function qlIn(path: string, filter: any): string {
    const conditions = filter.map(value => qlOp(path, '==', value));
    return qlCombine(conditions, 'OR', 'false');
}

// Scalars

const scalarEq: QType = {
    ql(path, filter) {
        return qlOp(path, '==', filter);
    },
    test(value, filter) {
        return value === filter;
    },
};

const scalarNe: QType = {
    ql(path, filter) {
        return qlOp(path, '!=', filter);
    },
    test(value, filter) {
        return value !== filter;
    },
};

const scalarLt: QType = {
    ql(path, filter) {
        return qlOp(path, '<', filter);
    },
    test(value, filter) {
        return value < filter;
    },
};

const scalarLe: QType = {
    ql(path, filter) {
        return qlOp(path, '<=', filter);
    },
    test(value, filter) {
        return value <= filter;
    },
};

const scalarGt: QType = {
    ql(path, filter) {
        return qlOp(path, '>', filter);
    },
    test(value, filter) {
        return value > filter;
    },
};

const scalarGe: QType = {
    ql(path, filter) {
        return qlOp(path, '>=', filter);
    },
    test(value, filter) {
        return value >= filter;
    },
};

const scalarIn: QType = {
    ql(path, filter) {
        return qlIn(path, filter);
    },
    test(value, filter) {
        return filter.includes(value);
    },
};

const scalarNotIn: QType = {
    ql(path, filter) {
        return `NOT (${qlIn(path, filter)})`;
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
        ql(path, filter) {
            return qlFields(path, filter, fields, (op, path, filterKey, filterValue) => {
                return op.ql(path, filterValue);
            });
        },
        test(value, filter) {
            return testFields(value, filter, fields, (op, value, filterKey, filterValue) => {
                return op.test(value, filterValue);
            });
        }
    };
}

const scalar: QType = createScalar();

// Structs

function struct(fields: { [string]: QType }, isCollection?: boolean): QType {
    return {
        ql(path, filter) {
            return qlFields(path, filter, fields, (fieldType, path, filterKey, filterValue) => {
                const fieldName = isCollection && (filterKey === 'id') ? '_key' : filterKey;
                return fieldType.ql(combine(path, fieldName), filterValue);
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
            ql(path, filter) {
                const itemQl = itemType.ql('CURRENT', filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
            },
            test(value, filter) {
                const failedIndex = value.findIndex(x => !itemType.test(x, filter));
                return failedIndex < 0;
            },
        },
        any: {
            ql(path, filter) {
                const itemQl = itemType.ql('CURRENT', filter);
                return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
            },
            test(value, filter) {
                const succeededIndex = value.findIndex(x => itemType.test(x, filter));
                return succeededIndex >= 0;
            }
        },
    };
    return {
        ql(path, filter) {
            return qlFields(path, filter, ops, (op, path, filterKey, filterValue) => {
                return op.ql(path, filterValue);
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
        ql(path, filter) {
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(alias, filter);
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
        ql(path, filter) {
            const refFilter = filter.all || filter.any;
            const all = !!filter.all;
            const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
            const alias = `${on_path.replace('.', '_')}`;
            const refQl = refType.ql(alias, refFilter);
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
    struct,
    array,
    join,
    joinArray
}

export type {
    QType
}

