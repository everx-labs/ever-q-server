"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collectReturnExpressions = collectReturnExpressions;
exports.combineReturnExpressions = combineReturnExpressions;
exports.unixMillisecondsToString = unixMillisecondsToString;
exports.unixSecondsToString = unixSecondsToString;
exports.resolveBigUInt = resolveBigUInt;
exports.convertBigUInt = convertBigUInt;
exports.splitOr = splitOr;
exports.struct = struct;
exports.array = array;
exports.enumName = enumName;
exports.createEnumNameResolver = createEnumNameResolver;
exports.stringCompanion = stringCompanion;
exports.join = join;
exports.joinArray = joinArray;
exports.parseSelectionSet = parseSelectionSet;
exports.selectionToString = selectionToString;
exports.selectFields = selectFields;
exports.indexToString = indexToString;
exports.parseIndex = parseIndex;
exports.orderByToString = orderByToString;
exports.parseOrderBy = parseOrderBy;
exports.createScalarFields = createScalarFields;
exports.bigUInt2 = exports.bigUInt1 = exports.stringLowerFilter = exports.scalar = exports.QParams = exports.QExplanation = void 0;

var _dbSchemaTypes = require("../schema/db-schema-types");

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
const NOT_IMPLEMENTED = new Error('Not Implemented');

function combinePath(base, path) {
  const b = base.endsWith('.') ? base.slice(0, -1) : base;
  const p = path.startsWith('.') ? path.slice(1) : path;
  const sep = p && b ? '.' : '';
  return `${b}${sep}${p}`;
}

class QExplanation {
  constructor() {
    this.parentPath = '';
    this.fields = new Map();
  }

  explainScalarOperation(path, op) {
    let p = path;

    if (p.startsWith('CURRENT')) {
      p = combinePath(this.parentPath, p.substr('CURRENT'.length));
    }

    const existing = this.fields.get(p);

    if (existing) {
      existing.operations.add(op);
    } else {
      this.fields.set(p, {
        operations: new Set([op])
      });
    }
  }

}

exports.QExplanation = QExplanation;

/**
 * Query parameters
 */
class QParams {
  constructor(options) {
    this.count = 0;
    this.values = {};
    this.explanation = options && options.explain ? new QExplanation() : null;
  }

  clear() {
    this.count = 0;
    this.values = {};
  }

  add(value) {
    this.count += 1;
    const name = `v${this.count.toString()}`;
    this.values[name] = value;
    return name;
  }

  explainScalarOperation(field, op) {
    if (this.explanation) {
      this.explanation.explainScalarOperation(field, op);
    }
  }

}

exports.QParams = QParams;

/**
 * Generates AQL condition for complex filter.
 *
 * @param {string} path Path to document field.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} filterConditionForField Function that generates condition for a concrete field.
 * @return {string} AQL condition
 */
function filterConditionForFields(path, filter, fieldTypes, filterConditionForField) {
  const conditions = [];
  Object.entries(filter).forEach(([filterKey, filterValue]) => {
    const fieldType = fieldTypes[filterKey];

    if (fieldType) {
      conditions.push(filterConditionForField(fieldType, path, filterKey, filterValue));
    } else {
      throw new Error(`Invalid filter field: ${filterKey}`);
    }
  });
  return combineFilterConditions(conditions, 'AND', 'false');
}

function collectReturnExpressions(expressions, path, fields, fieldTypes) {
  fields.forEach(fieldDef => {
    const name = fieldDef.name && fieldDef.name.value || '';

    if (name === '') {
      throw new Error(`Invalid selection field: ${fieldDef.kind}`);
    }

    if (name === '__typename') {
      return;
    }

    const fieldType = fieldTypes[name];

    if (!fieldType) {
      throw new Error(`Invalid selection field: ${name}`);
    }

    for (const returned of fieldType.returnExpressions(path, fieldDef)) {
      expressions.set(returned.name, returned.expression);
    }
  });
}

function combineReturnExpressions(expressions) {
  const fields = [];

  for (const [key, value] of expressions) {
    fields.push(`${key}: ${value}`);
  }

  return `{ ${fields.join(', ')} }`;
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


function testFields(value, filter, fieldTypes, testField) {
  const failed = Object.entries(filter).find(([filterKey, filterValue]) => {
    const fieldType = fieldTypes[filterKey];

    if (!fieldType) {
      throw new Error(`Invalid filter field: ${filterKey}`);
    }

    return !(fieldType && testField(fieldType, value, filterKey, filterValue));
  });
  return !failed;
}

function filterConditionOp(params, path, op, filter, explainOp) {
  params.explainScalarOperation(path, explainOp || op);
  const paramName = params.add(filter);
  /*
   * Following TO_STRING cast required due to specific comparision of _key fields in Arango
   * For example this query:
   * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
   * Will return:
   * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
   */

  const isKeyOrderedComparison = (path === '_key' || path.endsWith('._key')) && op !== '==' && op !== '!=';
  const fixedPath = isKeyOrderedComparison ? `TO_STRING(${path})` : path;
  const fixedValue = `@${paramName}`;
  return `${fixedPath} ${op} ${fixedValue}`;
}

function combineFilterConditions(conditions, op, defaultConditions) {
  if (conditions.length === 0) {
    return defaultConditions;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return '(' + conditions.join(`) ${op} (`) + ')';
}

function filterConditionForIn(params, path, filter, explainOp) {
  const conditions = filter.map(value => filterConditionOp(params, path, "==", value, explainOp));
  return combineFilterConditions(conditions, 'OR', 'false');
} //------------------------------------------------------------- Scalars


function undefinedToNull(v) {
  return v !== undefined ? v : null;
}

const scalarEq = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '==', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value === filter;
  }

};
const scalarNe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '!=', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value !== filter;
  }

};
const scalarLt = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '<', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value < filter;
  }

};
const scalarLe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '<=', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value <= filter;
  }

};
const scalarGt = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '>', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value > filter;
  }

};
const scalarGe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, '>=', filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value >= filter;
  }

};
const scalarIn = {
  filterCondition(params, path, filter) {
    return filterConditionForIn(params, path, filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return filter.includes(value);
  }

};
const scalarNotIn = {
  filterCondition(params, path, filter) {
    return `NOT (${filterConditionForIn(params, path, filter, "!=")})`;
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return !filter.includes(value);
  }

};
const scalarOps = {
  eq: scalarEq,
  ne: scalarNe,
  lt: scalarLt,
  le: scalarLe,
  gt: scalarGt,
  ge: scalarGe,
  in: scalarIn,
  notIn: scalarNotIn
};

function convertFilterValue(value, op, converter) {
  if (converter) {
    const conv = converter;
    return op === scalarOps.in || op === scalarOps.notIn ? value.map(x => conv(x)) : conv(value);
  }

  return value;
}

function createScalar(filterValueConverter) {
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const converted = convertFilterValue(filterValue, op, filterValueConverter);
        return op.filterCondition(params, path, converted);
      });
    },

    returnExpressions(path, def) {
      const isCollection = path === 'doc';
      let name = def.name.value;

      if (isCollection && name === 'id') {
        name = '_key';
      }

      return [{
        name,
        expression: `${path}.${name}`
      }];
    },

    test(parent, value, filter) {
      return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
        const converted = convertFilterValue(filterValue, op, filterValueConverter);
        return op.test(parent, undefinedToNull(value), converted);
      });
    }

  };
}

function unixMillisecondsToString(value) {
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

  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

function unixSecondsToString(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return unixMillisecondsToString(value * 1000);
}

const BigNumberFormat = {
  HEX: 'HEX',
  DEC: 'DEC'
};

function invertedHex(hex) {
  return Array.from(hex).map(c => (Number.parseInt(c, 16) ^ 0xf).toString(16)).join('');
}

function resolveBigUInt(prefixLength, value, args) {
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

  const format = args && args.format || BigNumberFormat.HEX;
  return `${neg ? '-' : ''}${format === BigNumberFormat.HEX ? hex : BigInt(hex).toString()}`;
}

function convertBigUInt(prefixLength, value) {
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

const scalar = createScalar();
exports.scalar = scalar;
const stringLowerFilter = createScalar(x => x ? x.toString().toLowerCase() : x);
exports.stringLowerFilter = stringLowerFilter;
const bigUInt1 = createScalar(x => convertBigUInt(1, x));
exports.bigUInt1 = bigUInt1;
const bigUInt2 = createScalar(x => convertBigUInt(2, x)); //------------------------------------------------------------- Structs

exports.bigUInt2 = bigUInt2;

function splitOr(filter) {
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

function struct(fields, isCollection) {
  return {
    fields,

    filterCondition(params, path, filter) {
      const orOperands = splitOr(filter).map(operand => {
        return filterConditionForFields(path, operand, fields, (fieldType, path, filterKey, filterValue) => {
          const fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
          return fieldType.filterCondition(params, combinePath(path, fieldName), filterValue);
        });
      });
      return orOperands.length > 1 ? `(${orOperands.join(') OR (')})` : orOperands[0];
    },

    returnExpressions(path, def) {
      const name = def.name.value;
      const expressions = new Map();
      collectReturnExpressions(expressions, `${path}.${name}`, def.selectionSet && def.selectionSet.selections || [], fields);
      return [{
        name,
        expression: `( ${path}.${name} && ${combineReturnExpressions(expressions)} )`
      }];
    },

    test(parent, value, filter) {
      if (!value) {
        return false;
      }

      const orOperands = splitOr(filter);

      for (let i = 0; i < orOperands.length; i += 1) {
        if (testFields(value, orOperands[i], fields, (fieldType, value, filterKey, filterValue) => {
          const fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
          return fieldType.test(value, value[fieldName], filterValue);
        })) {
          return true;
        }
      }

      return false;
    }

  };
} // Arrays


function getItemFilterCondition(itemType, params, path, filter) {
  let itemFilterCondition;
  const explanation = params.explanation;

  if (explanation) {
    const saveParentPath = explanation.parentPath;
    explanation.parentPath = `${explanation.parentPath}${path}[*]`;
    itemFilterCondition = itemType.filterCondition(params, 'CURRENT', filter);
    explanation.parentPath = saveParentPath;
  } else {
    itemFilterCondition = itemType.filterCondition(params, 'CURRENT', filter);
  }

  return itemFilterCondition;
}

function isValidFieldPathChar(c) {
  if (c.length !== 1) {
    return false;
  }

  return c >= 'A' && c <= 'Z' || c >= 'a' && c <= 'z' || c >= '0' && c <= '9' || c === '_' || c === '[' || c === '*' || c === ']' || c === '.';
}

function isFieldPath(test) {
  for (let i = 0; i < test.length; i += 1) {
    if (!isValidFieldPathChar(test[i])) {
      return false;
    }
  }

  return true;
}

function tryOptimizeArrayAny(path, itemFilterCondition, params) {
  function tryOptimize(filterCondition, paramIndex) {
    const paramName = `@v${paramIndex + 1}`;
    const suffix = ` == ${paramName}`;

    if (filterCondition === `CURRENT${suffix}`) {
      return `${paramName} IN ${path}[*]`;
    }

    if (filterCondition.startsWith('CURRENT.') && filterCondition.endsWith(suffix)) {
      const fieldPath = filterCondition.slice('CURRENT.'.length, -suffix.length);

      if (isFieldPath(fieldPath)) {
        return `${paramName} IN ${path}[*].${fieldPath}`;
      }
    }

    return null;
  }

  if (!itemFilterCondition.startsWith('(') || !itemFilterCondition.endsWith(')')) {
    return tryOptimize(itemFilterCondition, params.count - 1);
  }

  const filterConditionParts = itemFilterCondition.slice(1, -1).split(') OR (');

  if (filterConditionParts.length === 1) {
    return tryOptimize(itemFilterCondition, params.count - 1);
  }

  const optimizedParts = filterConditionParts.map((x, i) => tryOptimize(x, params.count - filterConditionParts.length + i)).filter(x => x !== null);

  if (optimizedParts.length !== filterConditionParts.length) {
    return null;
  }

  return `(${optimizedParts.join(') OR (')})`;
}

function array(resolveItemType) {
  let resolved = null;
  const ops = {
    all: {
      filterCondition(params, path, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const itemFilterCondition = getItemFilterCondition(itemType, params, path, filter);
        return `LENGTH(${path}[* FILTER ${itemFilterCondition}]) == LENGTH(${path})`;
      },

      returnExpressions(_path, _def) {
        throw NOT_IMPLEMENTED;
      },

      test(parent, value, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const failedIndex = value.findIndex(x => !itemType.test(parent, x, filter));
        return failedIndex < 0;
      }

    },
    any: {
      filterCondition(params, path, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const itemFilterCondition = getItemFilterCondition(itemType, params, path, filter);
        const optimizedFilterCondition = tryOptimizeArrayAny(path, itemFilterCondition, params);

        if (optimizedFilterCondition) {
          return optimizedFilterCondition;
        }

        return `LENGTH(${path}[* FILTER ${itemFilterCondition}]) > 0`;
      },

      returnExpressions(_path, _def) {
        throw NOT_IMPLEMENTED;
      },

      test(parent, value, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const succeededIndex = value.findIndex(x => itemType.test(parent, x, filter));
        return succeededIndex >= 0;
      }

    }
  };
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, ops, (op, path, filterKey, filterValue) => {
        return op.filterCondition(params, path, filterValue);
      });
    },

    returnExpressions(path, def) {
      const name = def.name.value;
      const itemSelections = def.selectionSet && def.selectionSet.selections;
      let expression;

      if (itemSelections && itemSelections.length > 0) {
        const itemType = resolved || (resolved = resolveItemType());
        const fieldPath = `${path}.${name}`;
        const alias = fieldPath.split('.').join('__');
        const expressions = new Map();
        collectReturnExpressions(expressions, alias, itemSelections, itemType.fields || {});
        const itemExpression = combineReturnExpressions(expressions);
        expression = `( ${fieldPath} && ( FOR ${alias} IN ${fieldPath} || [] RETURN ${itemExpression} ) )`;
      } else {
        expression = `${path}.${name}`;
      }

      return [{
        name,
        expression
      }];
    },

    test(parent, value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, ops, (op, value, filterKey, filterValue) => {
        return op.test(parent, value, filterValue);
      });
    }

  };
} //------------------------------------------------------------- Enum Names


function createEnumNamesMap(values) {
  const names = new Map();
  Object.entries(values).forEach(([name, value]) => {
    names.set(Number.parseInt(value), name);
  });
  return names;
}

function enumName(onField, values) {
  const resolveValue = name => {
    let value = values[name];

    if (value === undefined) {
      throw new Error(`Invalid value [${name}] for ${onField}_name`);
    }

    return value;
  };

  return {
    filterCondition(params, path, filter) {
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      return filterConditionForFields(on_path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const resolved = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.filterCondition(params, path, resolved);
      });
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
    },

    test(parent, value, filter) {
      return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
        const resolved = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.test(parent, parent[onField], resolved);
      });
    }

  };
}

function createEnumNameResolver(onField, values) {
  const names = createEnumNamesMap(values);
  return parent => {
    const value = parent[onField];
    const name = names.get(value);
    return name !== undefined ? name : null;
  };
} //------------------------------------------------------------- String Companions


function stringCompanion(onField) {
  return {
    filterCondition(_params, _path, _filter) {
      return 'false';
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
    },

    test(_parent, _value, _filter) {
      return false;
    }

  };
} //------------------------------------------------------------- Joins


function join(onField, refField, refCollection, extraFields, resolveRefType) {
  let resolved = null;
  const name = onField === 'id' ? '_key' : onField;
  return {
    filterCondition(params, path, filter) {
      const refType = resolved || (resolved = resolveRefType());
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      const alias = `${on_path.replace('.', '_')}`;
      const refFilterCondition = refType.filterCondition(params, alias, filter);
      return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refFilterCondition})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
    },

    returnExpressions(path, _def) {
      return [{
        name,
        expression: `${path}.${name}`
      }, ...extraFields.map(x => ({
        name: x,
        expression: `${path}.${x}`
      }))];
    },

    test(parent, value, filter) {
      const refType = resolved || (resolved = resolveRefType());
      return refType.test(parent, value, filter);
    }

  };
}

function joinArray(onField, refField, refCollection, resolveRefType) {
  let resolved = null;
  return {
    filterCondition(params, path, filter) {
      const refType = resolved || (resolved = resolveRefType());
      const refFilter = filter.all || filter.any;
      const all = !!filter.all;
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      const alias = `${on_path.replace('.', '_')}`;
      const refFilterCondition = refType.filterCondition(params, alias, refFilter);
      return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refFilterCondition})
                    ${!all ? 'LIMIT 1' : ''}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : '> 0'})`;
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
    },

    test(parent, value, filter) {
      const refType = resolved || (resolved = resolveRefType());
      return refType.test(parent, value, filter);
    }

  };
}

function parseSelectionSet(selectionSet, returnFieldSelection) {
  const fields = [];
  const selections = selectionSet && selectionSet.selections;

  if (selections) {
    for (const item of selections) {
      const name = item.name && item.name.value || '';

      if (name) {
        const field = {
          name,
          selection: parseSelectionSet(item.selectionSet, '')
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

function selectionToString(selection) {
  return selection.filter(x => x.name !== '__typename').map(field => {
    const fieldSelection = selectionToString(field.selection);
    return `${field.name}${fieldSelection !== '' ? ` { ${fieldSelection} }` : ''}`;
  }).join(' ');
}

function selectFields(doc, selection) {
  if (selection.length === 0) {
    return doc;
  }

  if (Array.isArray(doc)) {
    return doc.map(x => selectFields(x, selection));
  }

  const selected = {};

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
      dst_transaction: ['id', 'msg_type']
    }[item.name];

    if (requiredForJoin !== undefined) {
      requiredForJoin.forEach(field => {
        if (doc[field] !== undefined) {
          selected[field] = doc[field];
        }
      });
    }

    const value = doc[item.name];

    if (value !== undefined) {
      selected[item.name] = item.selection.length > 0 ? selectFields(value, item.selection) : value;
    }
  }

  return selected;
}

function indexToString(index) {
  return index.fields.join(', ');
}

function parseIndex(s) {
  return {
    fields: s.split(',').map(x => x.trim()).filter(x => x)
  };
}

function orderByToString(orderBy) {
  return orderBy.map(x => `${x.path}${(x.direction || '') === 'DESC' ? ' DESC' : ''}`).join(', ');
}

function parseOrderBy(s) {
  return s.split(',').map(x => x.trim()).filter(x => x).map(s => {
    const parts = s.split(' ').filter(x => x);
    return {
      path: parts[0],
      direction: (parts[1] || '').toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    };
  });
}

function createScalarFields(schema) {
  const scalarFields = new Map();

  function addForDbType(type, parentPath, parentDocPath) {
    type.fields.forEach(field => {
      if (field.join || field.enumDef) {
        return;
      }

      const docName = type.collection && field.name === 'id' ? '_key' : field.name;
      const path = `${parentPath}.${field.name}`;
      let docPath = `${parentDocPath}.${docName}`;

      if (field.arrayDepth > 0) {
        let suffix = '[*]';

        for (let depth = 10; depth > 0; depth -= 1) {
          const s = `[${'*'.repeat(depth)}]`;

          if (docPath.includes(s)) {
            suffix = `[${'*'.repeat(depth + 1)}]`;
            break;
          }
        }

        docPath = `${docPath}${suffix}`;
      }

      switch (field.type.category) {
        case "scalar":
          let typeName;

          if (field.type === _dbSchemaTypes.scalarTypes.boolean) {
            typeName = 'boolean';
          } else if (field.type === _dbSchemaTypes.scalarTypes.float) {
            typeName = 'number';
          } else if (field.type === _dbSchemaTypes.scalarTypes.int) {
            typeName = 'number';
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint64) {
            typeName = 'uint64';
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint1024) {
            typeName = 'uint1024';
          } else {
            typeName = 'string';
          }

          scalarFields.set(path, {
            type: typeName,
            path: docPath
          });
          break;

        case "struct":
        case "union":
          addForDbType(field.type, path, docPath);
          break;
      }
    });
  }

  schema.types.forEach(type => {
    addForDbType(type, '', '');
  });
  return scalarFields;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb24iLCJjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMiLCJrZXkiLCJqb2luIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJmaWx0ZXJDb25kaXRpb25PcCIsInBhcmFtcyIsImV4cGxhaW5PcCIsInBhcmFtTmFtZSIsImlzS2V5T3JkZXJlZENvbXBhcmlzb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJmaWx0ZXJDb25kaXRpb25Gb3JJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsImZpbHRlckNvbmRpdGlvbiIsIl9wYXRoIiwiX2RlZiIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwiaW4iLCJub3RJbiIsImNvbnZlcnRGaWx0ZXJWYWx1ZSIsImNvbnZlcnRlciIsImNvbnYiLCJ4IiwiY3JlYXRlU2NhbGFyIiwiZmlsdGVyVmFsdWVDb252ZXJ0ZXIiLCJjb252ZXJ0ZWQiLCJkZWYiLCJpc0NvbGxlY3Rpb24iLCJ1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJ1bml4U2Vjb25kc1RvU3RyaW5nIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwiaW52ZXJ0ZWRIZXgiLCJoZXgiLCJBcnJheSIsImZyb20iLCJjIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsImFyZ3MiLCJuZWciLCJzIiwidHJpbSIsImZvcm1hdCIsIkJpZ0ludCIsImNvbnZlcnRCaWdVSW50IiwiYmlnIiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwicmVzdWx0Iiwic2NhbGFyIiwic3RyaW5nTG93ZXJGaWx0ZXIiLCJ0b0xvd2VyQ2FzZSIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzcGxpdE9yIiwib3BlcmFuZHMiLCJvcGVyYW5kIiwid2l0aG91dE9yIiwiYXNzaWduIiwiT1IiLCJzdHJ1Y3QiLCJvck9wZXJhbmRzIiwiZmllbGROYW1lIiwic2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9ucyIsImkiLCJnZXRJdGVtRmlsdGVyQ29uZGl0aW9uIiwiaXRlbVR5cGUiLCJpdGVtRmlsdGVyQ29uZGl0aW9uIiwic2F2ZVBhcmVudFBhdGgiLCJpc1ZhbGlkRmllbGRQYXRoQ2hhciIsImlzRmllbGRQYXRoIiwidHJ5T3B0aW1pemVBcnJheUFueSIsInRyeU9wdGltaXplIiwicGFyYW1JbmRleCIsInN1ZmZpeCIsImZpZWxkUGF0aCIsImZpbHRlckNvbmRpdGlvblBhcnRzIiwic3BsaXQiLCJvcHRpbWl6ZWRQYXJ0cyIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsIm9wdGltaXplZEZpbHRlckNvbmRpdGlvbiIsInN1Y2NlZWRlZEluZGV4IiwiaXRlbVNlbGVjdGlvbnMiLCJhbGlhcyIsIml0ZW1FeHByZXNzaW9uIiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJvbl9wYXRoIiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInN0cmluZ0NvbXBhbmlvbiIsIl9wYXJhbXMiLCJfZmlsdGVyIiwiX3BhcmVudCIsIl92YWx1ZSIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsImV4dHJhRmllbGRzIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsImNyZWF0ZVNjYWxhckZpZWxkcyIsInNjaGVtYSIsInNjYWxhckZpZWxkcyIsImFkZEZvckRiVHlwZSIsInR5cGUiLCJwYXJlbnREb2NQYXRoIiwiZW51bURlZiIsImRvY05hbWUiLCJjb2xsZWN0aW9uIiwiZG9jUGF0aCIsImFycmF5RGVwdGgiLCJkZXB0aCIsImNhdGVnb3J5IiwidHlwZU5hbWUiLCJzY2FsYXJUeXBlcyIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsInVpbnQ2NCIsInVpbnQxMDI0IiwidHlwZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOztBQXJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFZQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENB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QUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4uL2F1dGhcIjtcbmltcG9ydCB0eXBlIHsgUUluZGV4SW5mbyB9IGZyb20gJy4uL2RhdGEvZGF0YS1wcm92aWRlcic7XG5pbXBvcnQgeyBzY2FsYXJUeXBlcyB9IGZyb20gXCIuLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IERiRmllbGQsIERiU2NoZW1hLCBEYlR5cGUgfSBmcm9tIFwiLi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmNvbnN0IE5PVF9JTVBMRU1FTlRFRCA9IG5ldyBFcnJvcignTm90IEltcGxlbWVudGVkJyk7XG5cbmV4cG9ydCB0eXBlIEdOYW1lID0ge1xuICAgIGtpbmQ6ICdOYW1lJyxcbiAgICB2YWx1ZTogc3RyaW5nLFxufTtcblxuZXhwb3J0IHR5cGUgR0ZpZWxkID0ge1xuICAgIGtpbmQ6ICdGaWVsZCcsXG4gICAgYWxpYXM6IHN0cmluZyxcbiAgICBuYW1lOiBHTmFtZSxcbiAgICBhcmd1bWVudHM6IEdEZWZpbml0aW9uW10sXG4gICAgZGlyZWN0aXZlczogR0RlZmluaXRpb25bXSxcbiAgICBzZWxlY3Rpb25TZXQ6IHR5cGVvZiB1bmRlZmluZWQgfCBHU2VsZWN0aW9uU2V0LFxufTtcblxuZXhwb3J0IHR5cGUgR0RlZmluaXRpb24gPSBHRmllbGQ7XG5cbmV4cG9ydCB0eXBlIEdTZWxlY3Rpb25TZXQgPSB7XG4gICAga2luZDogJ1NlbGVjdGlvblNldCcsXG4gICAgc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSxcbn07XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnR5cGUgUVJldHVybkV4cHJlc3Npb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGV4cHJlc3Npb246IHN0cmluZyxcbn07XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIGZpZWxkcz86IHsgW3N0cmluZ106IFFUeXBlIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgZmlsdGVyQ29uZGl0aW9uOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgQVFMIGV4cHJlc3Npb24gZm9yIHJldHVybiBzZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICAgKiBAcGFyYW0ge0dEZWZpbml0aW9ufSBkZWZcbiAgICAgKi9cbiAgICByZXR1cm5FeHByZXNzaW9uczogKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbikgPT4gUVJldHVybkV4cHJlc3Npb25bXSxcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZpbHRlckNvbmRpdGlvbkZvckZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICBleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmllbGRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4pIHtcbiAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGREZWY6IEdGaWVsZCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gZmllbGREZWYubmFtZSAmJiBmaWVsZERlZi5uYW1lLnZhbHVlIHx8ICcnO1xuICAgICAgICBpZiAobmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7ZmllbGREZWYua2luZH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAnX190eXBlbmFtZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbbmFtZV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke25hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChjb25zdCByZXR1cm5lZCBvZiBmaWVsZFR5cGUucmV0dXJuRXhwcmVzc2lvbnMocGF0aCwgZmllbGREZWYpKSB7XG4gICAgICAgICAgICBleHByZXNzaW9ucy5zZXQocmV0dXJuZWQubmFtZSwgcmV0dXJuZWQuZXhwcmVzc2lvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgZmllbGRzLnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW4sXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55LCBleHBsYWluT3A/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIGV4cGxhaW5PcCB8fCBvcCk7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG5cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc29uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc29uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xuICAgIGNvbnN0IGZpeGVkVmFsdWUgPSBgQCR7cGFyYW1OYW1lfWA7XG4gICAgcmV0dXJuIGAke2ZpeGVkUGF0aH0gJHtvcH0gJHtmaXhlZFZhbHVlfWA7XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnksIGV4cGxhaW5PcD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCBcIj09XCIsIHZhbHVlLCBleHBsYWluT3ApKTtcbiAgICByZXR1cm4gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9ucywgJ09SJywgJ2ZhbHNlJyk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTY2FsYXJzXG5cbmZ1bmN0aW9uIHVuZGVmaW5lZFRvTnVsbCh2OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogbnVsbDtcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPD0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9ucyhfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke2ZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtcywgcGF0aCwgZmlsdGVyLCBcIiE9XCIpfSlgO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNvbnZlcnRGaWx0ZXJWYWx1ZSh2YWx1ZSwgb3AsIGNvbnZlcnRlcj86ICh2YWx1ZTogYW55KSA9PiBhbnkpOiBzdHJpbmcge1xuICAgIGlmIChjb252ZXJ0ZXIpIHtcbiAgICAgICAgY29uc3QgY29udiA9IGNvbnZlcnRlcjtcbiAgICAgICAgcmV0dXJuIChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICA/IHZhbHVlLm1hcCh4ID0+IGNvbnYoeCkpXG4gICAgICAgICAgICA6IGNvbnYodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcihmaWx0ZXJWYWx1ZUNvbnZlcnRlcj86ICh2YWx1ZTogYW55KSA9PiBhbnkpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0RmlsdGVyVmFsdWUoZmlsdGVyVmFsdWUsIG9wLCBmaWx0ZXJWYWx1ZUNvbnZlcnRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgICAgICBjb25zdCBpc0NvbGxlY3Rpb24gPSBwYXRoID09PSAnZG9jJztcbiAgICAgICAgICAgIGxldCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uICYmIG5hbWUgPT09ICdpZCcpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gJ19rZXknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEZpbHRlclZhbHVlKGZpbHRlclZhbHVlLCBvcCwgZmlsdGVyVmFsdWVDb252ZXJ0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gaW52ZXJ0ZWRIZXgoaGV4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcbiAgICAgICAgLm1hcChjID0+IChOdW1iZXIucGFyc2VJbnQoYywgMTYpIF4gMHhmKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcbiAgICAgICAgaGV4ID0gYDB4JHsobmVnID8gLXZhbHVlIDogdmFsdWUpLnRvU3RyaW5nKDE2KX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgbmVnID0gcy5zdGFydHNXaXRoKCctJyk7XG4gICAgICAgIGhleCA9IGAweCR7bmVnID8gaW52ZXJ0ZWRIZXgocy5zdWJzdHIocHJlZml4TGVuZ3RoICsgMSkpIDogcy5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gYCR7bmVnID8gJy0nIDogJyd9JHsoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBiaWc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcbiAgICByZXR1cm4gbmVnID8gYC0ke2ludmVydGVkSGV4KHJlc3VsdCl9YCA6IHJlc3VsdDtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBzdHJpbmdMb3dlckZpbHRlcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiB4ID8geC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgOiB4KTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiBjb252ZXJ0QmlnVUludCgxLCB4KSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKHggPT4gY29udmVydEJpZ1VJbnQoMiwgeCkpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RydWN0c1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPcihmaWx0ZXI6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xuICAgIGxldCBvcGVyYW5kID0gZmlsdGVyO1xuICAgIHdoaWxlIChvcGVyYW5kKSB7XG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXRPciA9IE9iamVjdC5hc3NpZ24oe30sIG9wZXJhbmQpO1xuICAgICAgICAgICAgZGVsZXRlIHdpdGhvdXRPclsnT1InXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCggJHtwYXRofS4ke25hbWV9ICYmICR7Y29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKX0gKWAsXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvck9wZXJhbmRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3RGaWVsZHModmFsdWUsIG9yT3BlcmFuZHNbaV0sIGZpZWxkcywgKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZTogUVR5cGUsIHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZztcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcbiAgICBpZiAoZXhwbGFuYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2F2ZVBhcmVudFBhdGggPSBleHBsYW5hdGlvbi5wYXJlbnRQYXRoO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IHNhdmVQYXJlbnRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgfVxuICAgIHJldHVybiBpdGVtRmlsdGVyQ29uZGl0aW9uO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRmllbGRQYXRoQ2hhcihjOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoYy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGMgPj0gJ0EnICYmIGMgPD0gJ1onKVxuICAgICAgICB8fCAoYyA+PSAnYScgJiYgYyA8PSAneicpXG4gICAgICAgIHx8IChjID49ICcwJyAmJiBjIDw9ICc5JylcbiAgICAgICAgfHwgKGMgPT09ICdfJyB8fCBjID09PSAnWycgfHwgYyA9PT0gJyonIHx8IGMgPT09ICddJyB8fCBjID09PSAnLicpO1xufVxuXG5mdW5jdGlvbiBpc0ZpZWxkUGF0aCh0ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkRmllbGRQYXRoQ2hhcih0ZXN0W2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGg6IHN0cmluZywgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbXM6IFFQYXJhbXMpOiA/c3RyaW5nIHtcbiAgICBmdW5jdGlvbiB0cnlPcHRpbWl6ZShmaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1JbmRleDogbnVtYmVyKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1JbmRleCArIDF9YDtcbiAgICAgICAgY29uc3Qgc3VmZml4ID0gYCA9PSAke3BhcmFtTmFtZX1gO1xuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uID09PSBgQ1VSUkVOVCR7c3VmZml4fWApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24uc3RhcnRzV2l0aCgnQ1VSUkVOVC4nKSAmJiBmaWx0ZXJDb25kaXRpb24uZW5kc1dpdGgoc3VmZml4KSkge1xuICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gZmlsdGVyQ29uZGl0aW9uLnNsaWNlKCdDVVJSRU5ULicubGVuZ3RoLCAtc3VmZml4Lmxlbmd0aCk7XG4gICAgICAgICAgICBpZiAoaXNGaWVsZFBhdGgoZmllbGRQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl0uJHtmaWVsZFBhdGh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIWl0ZW1GaWx0ZXJDb25kaXRpb24uc3RhcnRzV2l0aCgnKCcpIHx8ICFpdGVtRmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKCcpJykpIHtcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xuICAgIH1cbiAgICBjb25zdCBmaWx0ZXJDb25kaXRpb25QYXJ0cyA9IGl0ZW1GaWx0ZXJDb25kaXRpb24uc2xpY2UoMSwgLTEpLnNwbGl0KCcpIE9SICgnKTtcbiAgICBpZiAoZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3Qgb3B0aW1pemVkUGFydHMgPSBmaWx0ZXJDb25kaXRpb25QYXJ0c1xuICAgICAgICAubWFwKCh4LCBpKSA9PiB0cnlPcHRpbWl6ZSh4LCBwYXJhbXMuY291bnQgLSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGggKyBpKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHggIT09IG51bGwpO1xuICAgIGlmIChvcHRpbWl6ZWRQYXJ0cy5sZW5ndGggIT09IGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGAoJHtvcHRpbWl6ZWRQYXJ0cy5qb2luKCcpIE9SICgnKX0pYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+ICFpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFueToge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24gPSB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGgsIGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGltaXplZEZpbHRlckNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb25zKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgaXRlbVNlbGVjdGlvbnMgPSBkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICAgICAgICAgIGxldCBleHByZXNzaW9uO1xuICAgICAgICAgICAgaWYgKGl0ZW1TZWxlY3Rpb25zICYmIGl0ZW1TZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGlhcyA9IGZpZWxkUGF0aC5zcGxpdCgnLicpLmpvaW4oJ19fJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCBhbGlhcywgaXRlbVNlbGVjdGlvbnMsIGl0ZW1UeXBlLmZpZWxkcyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUV4cHJlc3Npb24gPSBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgKCAke2ZpZWxkUGF0aH0gJiYgKCBGT1IgJHthbGlhc30gSU4gJHtmaWVsZFBhdGh9IHx8IFtdIFJFVFVSTiAke2l0ZW1FeHByZXNzaW9ufSApIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb25zKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfV07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29tcGFuaW9uKG9uRmllbGQ6IHN0cmluZyk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24oX3BhcmFtcywgX3BhdGgsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmFsc2UnO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCkge1xuICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KF9wYXJlbnQsIF92YWx1ZSwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEpvaW5zXG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luKFxuICAgIG9uRmllbGQ6IHN0cmluZyxcbiAgICByZWZGaWVsZDogc3RyaW5nLFxuICAgIHJlZkNvbGxlY3Rpb246IHN0cmluZyxcbiAgICBleHRyYUZpZWxkczogc3RyaW5nW10sXG4gICAgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlXG4pOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG5hbWUgPSBvbkZpZWxkID09PSAnaWQnID8gJ19rZXknIDogb25GaWVsZDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH0sIC4uLmV4dHJhRmllbGRzLm1hcCh4ID0+ICh7IG5hbWU6IHgsIGV4cHJlc3Npb246IGAke3BhdGh9LiR7eH1gIH0pKV07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShcbiAgICBvbkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmRmllbGQ6IHN0cmluZyxcbiAgICByZWZDb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlLFxuKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZSxcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogP0dTZWxlY3Rpb25TZXQsIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGRvYykpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5tYXAoeCA9PiBzZWxlY3RGaWVsZHMoeCwgc2VsZWN0aW9uKSk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkRm9ySm9pbiA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6IFsnaW5fbXNnJ10sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFsnb3V0X21zZyddLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogWydpZCddLFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAocmVxdWlyZWRGb3JKb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NbZmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbZmllbGRdID0gZG9jW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXG4gICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCB0eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBpc0Zhc3Q6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleFRvU3RyaW5nKGluZGV4OiBRSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IFFJbmRleEluZm8ge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkczogcy5zcGxpdCgnLCcpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoeCA9PiB4KSxcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5VG9TdHJpbmcob3JkZXJCeTogT3JkZXJCeVtdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gb3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9JHsoeC5kaXJlY3Rpb24gfHwgJycpID09PSAnREVTQycgPyAnIERFU0MnIDogJyd9YCkuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT3JkZXJCeShzOiBzdHJpbmcpOiBPcmRlckJ5W10ge1xuICAgIHJldHVybiBzLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCh4ID0+IHgudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKHggPT4geClcbiAgICAgICAgLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcgJykuZmlsdGVyKHggPT4geCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHBhcnRzWzBdLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogKHBhcnRzWzFdIHx8ICcnKS50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycgPyAnREVTQycgOiAnQVNDJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjYWxhckZpZWxkcyhzY2hlbWE6IERiU2NoZW1hKTogTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4oKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZvckRiVHlwZSh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSB0eXBlLmNvbGxlY3Rpb24gJiYgZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzY2FsYXJGaWVsZHMuc2V0KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGRvY1BhdGgsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGFkZEZvckRiVHlwZShmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBzY2hlbWEudHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICBhZGRGb3JEYlR5cGUodHlwZSwgJycsICcnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzY2FsYXJGaWVsZHM7XG59XG4iXX0=