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

    const returned = fieldType.returnExpression(path, fieldDef);
    expressions.set(returned.name, returned.expression);
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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

  returnExpression(_path, _def) {
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
    return op === scalarOps.in || op === scalarOps.notIn ? value.map(x => converter(x)) : converter(value);
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

    returnExpression(path, def) {
      const isCollection = path === 'doc';
      let name = def.name.value;

      if (isCollection && name === 'id') {
        name = '_key';
      }

      return {
        name,
        expression: `${path}.${name}`
      };
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

    returnExpression(path, def) {
      const name = def.name.value;
      const expressions = new Map();
      collectReturnExpressions(expressions, `${path}.${name}`, def.selectionSet && def.selectionSet.selections || [], fields);
      return {
        name,
        expression: `( ${path}.${name} && ${combineReturnExpressions(expressions)} )`
      };
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

      returnExpression(_path, _def) {
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

      returnExpression(_path, _def) {
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

    returnExpression(path, def) {
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

      return {
        name,
        expression
      };
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

    returnExpression(path, _def) {
      return {
        name: onField,
        expression: `${path}.${onField}`
      };
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

    returnExpression(path, _def) {
      return {
        name: onField,
        expression: `${path}.${onField}`
      };
    },

    test(_parent, _value, _filter) {
      return false;
    }

  };
} //------------------------------------------------------------- Joins


function join(onField, refField, refCollection, resolveRefType) {
  let resolved = null;
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

    returnExpression(path, _def) {
      const name = onField === 'id' ? '_key' : onField;
      return {
        name,
        expression: `${path}.${name}`
      };
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

    returnExpression(path, _def) {
      return {
        name: onField,
        expression: `${path}.${onField}`
      };
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9uIiwiZXhwcmVzc2lvbiIsImNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyIsImtleSIsImpvaW4iLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImZpbHRlckNvbmRpdGlvbk9wIiwicGFyYW1zIiwiZXhwbGFpbk9wIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY29udmVydEZpbHRlclZhbHVlIiwiY29udmVydGVyIiwieCIsImNyZWF0ZVNjYWxhciIsImZpbHRlclZhbHVlQ29udmVydGVyIiwiY29udmVydGVkIiwiZGVmIiwiaXNDb2xsZWN0aW9uIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsInNjYWxhciIsInN0cmluZ0xvd2VyRmlsdGVyIiwidG9Mb3dlckNhc2UiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3BsaXRPciIsIm9wZXJhbmRzIiwib3BlcmFuZCIsIndpdGhvdXRPciIsImFzc2lnbiIsIk9SIiwic3RydWN0Iiwib3JPcGVyYW5kcyIsImZpZWxkTmFtZSIsInNlbGVjdGlvblNldCIsInNlbGVjdGlvbnMiLCJpIiwiZ2V0SXRlbUZpbHRlckNvbmRpdGlvbiIsIml0ZW1UeXBlIiwiaXRlbUZpbHRlckNvbmRpdGlvbiIsInNhdmVQYXJlbnRQYXRoIiwiaXNWYWxpZEZpZWxkUGF0aENoYXIiLCJpc0ZpZWxkUGF0aCIsInRyeU9wdGltaXplQXJyYXlBbnkiLCJ0cnlPcHRpbWl6ZSIsInBhcmFtSW5kZXgiLCJzdWZmaXgiLCJmaWVsZFBhdGgiLCJmaWx0ZXJDb25kaXRpb25QYXJ0cyIsInNwbGl0Iiwib3B0aW1pemVkUGFydHMiLCJhcnJheSIsInJlc29sdmVJdGVtVHlwZSIsInJlc29sdmVkIiwib3BzIiwiYWxsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24iLCJzdWNjZWVkZWRJbmRleCIsIml0ZW1TZWxlY3Rpb25zIiwiYWxpYXMiLCJpdGVtRXhwcmVzc2lvbiIsImNyZWF0ZUVudW1OYW1lc01hcCIsIm5hbWVzIiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwib25fcGF0aCIsImNvbmNhdCIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJzdHJpbmdDb21wYW5pb24iLCJfcGFyYW1zIiwiX2ZpbHRlciIsIl9wYXJlbnQiLCJfdmFsdWUiLCJyZWZGaWVsZCIsInJlZkNvbGxlY3Rpb24iLCJyZXNvbHZlUmVmVHlwZSIsInJlZlR5cGUiLCJyZXBsYWNlIiwicmVmRmlsdGVyQ29uZGl0aW9uIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiaXNBcnJheSIsInNlbGVjdGVkIiwiX2tleSIsImlkIiwicmVxdWlyZWRGb3JKb2luIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJpbmRleFRvU3RyaW5nIiwiaW5kZXgiLCJwYXJzZUluZGV4Iiwib3JkZXJCeVRvU3RyaW5nIiwib3JkZXJCeSIsImRpcmVjdGlvbiIsInBhcnNlT3JkZXJCeSIsInBhcnRzIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImNvbGxlY3Rpb24iLCJkb2NQYXRoIiwiYXJyYXlEZXB0aCIsImRlcHRoIiwiY2F0ZWdvcnkiLCJ0eXBlTmFtZSIsInNjYWxhclR5cGVzIiwiYm9vbGVhbiIsImZsb2F0IiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJ0eXBlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7QUEwQkEsTUFBTUEsZUFBZSxHQUFHLElBQUlDLEtBQUosQ0FBVSxpQkFBVixDQUF4Qjs7QUEyQkEsU0FBU0MsV0FBVCxDQUFxQkMsSUFBckIsRUFBbUNDLElBQW5DLEVBQXlEO0FBQ3JELFFBQU1DLENBQUMsR0FBR0YsSUFBSSxDQUFDRyxRQUFMLENBQWMsR0FBZCxJQUFxQkgsSUFBSSxDQUFDSSxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUMsQ0FBZixDQUFyQixHQUF5Q0osSUFBbkQ7QUFDQSxRQUFNSyxDQUFDLEdBQUdKLElBQUksQ0FBQ0ssVUFBTCxDQUFnQixHQUFoQixJQUF1QkwsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUF2QixHQUF1Q0gsSUFBakQ7QUFDQSxRQUFNTSxHQUFHLEdBQUdGLENBQUMsSUFBSUgsQ0FBTCxH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Q0g7O0FBQ0RYLFVBQUFBLFlBQVksQ0FBQ3hOLEdBQWIsQ0FDSXBCLElBREosRUFFSTtBQUNJOE8sWUFBQUEsSUFBSSxFQUFFUyxRQURWO0FBRUl2UCxZQUFBQSxJQUFJLEVBQUVtUDtBQUZWLFdBRko7QUFPQTs7QUFDSixhQUFLLFFBQUw7QUFDQSxhQUFLLE9BQUw7QUFDSU4sVUFBQUEsWUFBWSxDQUFDN00sS0FBSyxDQUFDOE0sSUFBUCxFQUFhOU8sSUFBYixFQUFtQm1QLE9BQW5CLENBQVo7QUFDQTtBQTNCSjtBQTZCSCxLQS9DRDtBQWdESDs7QUFHRFIsRUFBQUEsTUFBTSxDQUFDbUIsS0FBUCxDQUFhdE4sT0FBYixDQUFzQnNNLElBQUQsSUFBVTtBQUMzQkQsSUFBQUEsWUFBWSxDQUFDQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVgsQ0FBWjtBQUNILEdBRkQ7QUFJQSxTQUFPRixZQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBRSW5kZXhJbmZvIH0gZnJvbSAnLi4vZGF0YS9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IHNjYWxhclR5cGVzIH0gZnJvbSBcIi4uL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgRGJGaWVsZCwgRGJTY2hlbWEsIERiVHlwZSB9IGZyb20gXCIuLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuY29uc3QgTk9UX0lNUExFTUVOVEVEID0gbmV3IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcblxuZXhwb3J0IHR5cGUgR05hbWUgPSB7XG4gICAga2luZDogJ05hbWUnLFxuICAgIHZhbHVlOiBzdHJpbmcsXG59O1xuXG5leHBvcnQgdHlwZSBHRmllbGQgPSB7XG4gICAga2luZDogJ0ZpZWxkJyxcbiAgICBhbGlhczogc3RyaW5nLFxuICAgIG5hbWU6IEdOYW1lLFxuICAgIGFyZ3VtZW50czogR0RlZmluaXRpb25bXSxcbiAgICBkaXJlY3RpdmVzOiBHRGVmaW5pdGlvbltdLFxuICAgIHNlbGVjdGlvblNldDogdHlwZW9mIHVuZGVmaW5lZCB8IEdTZWxlY3Rpb25TZXQsXG59O1xuXG5leHBvcnQgdHlwZSBHRGVmaW5pdGlvbiA9IEdGaWVsZDtcblxuZXhwb3J0IHR5cGUgR1NlbGVjdGlvblNldCA9IHtcbiAgICBraW5kOiAnU2VsZWN0aW9uU2V0JyxcbiAgICBzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdLFxufTtcblxuZXhwb3J0IHR5cGUgUUZpZWxkRXhwbGFuYXRpb24gPSB7XG4gICAgb3BlcmF0aW9uczogU2V0PHN0cmluZz4sXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVQYXRoKGJhc2U6IHN0cmluZywgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiID0gYmFzZS5lbmRzV2l0aCgnLicpID8gYmFzZS5zbGljZSgwLCAtMSkgOiBiYXNlO1xuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoJy4nKSA/IHBhdGguc2xpY2UoMSkgOiBwYXRoO1xuICAgIGNvbnN0IHNlcCA9IHAgJiYgYiA/ICcuJyA6ICcnO1xuICAgIHJldHVybiBgJHtifSR7c2VwfSR7cH1gO1xufVxuXG5leHBvcnQgdHlwZSBTY2FsYXJGaWVsZCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgdHlwZTogKCdudW1iZXInIHwgJ3VpbnQ2NCcgfCAndWludDEwMjQnIHwgJ2Jvb2xlYW4nIHwgJ3N0cmluZycpLFxufVxuXG5leHBvcnQgY2xhc3MgUUV4cGxhbmF0aW9uIHtcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmc7XG4gICAgZmllbGRzOiBNYXA8c3RyaW5nLCBRRmllbGRFeHBsYW5hdGlvbj47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wYXJlbnRQYXRoID0gJyc7XG4gICAgICAgIHRoaXMuZmllbGRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBwID0gcGF0aDtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQ1VSUkVOVCcpKSB7XG4gICAgICAgICAgICBwID0gY29tYmluZVBhdGgodGhpcy5wYXJlbnRQYXRoLCBwLnN1YnN0cignQ1VSUkVOVCcubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3Rpbmc6IFFGaWVsZEV4cGxhbmF0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHRoaXMuZmllbGRzLmdldChwKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5vcGVyYXRpb25zLmFkZChvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkcy5zZXQocCwge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IG5ldyBTZXQoW29wXSksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBRUGFyYW1zT3B0aW9ucyA9IHtcbiAgICBleHBsYWluPzogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUVBhcmFtc09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuZXhwbGFuYXRpb24gPSAob3B0aW9ucyAmJiBvcHRpb25zLmV4cGxhaW4pXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxudHlwZSBRUmV0dXJuRXhwcmVzc2lvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZXhwcmVzc2lvbjogc3RyaW5nLFxufTtcblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgZmllbGRzPzogeyBbc3RyaW5nXTogUVR5cGUgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBmaWx0ZXJDb25kaXRpb246IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBBUUwgZXhwcmVzc2lvbiBmb3IgcmV0dXJuIHNlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICAgICAqIEBwYXJhbSB7R0RlZmluaXRpb259IGRlZlxuICAgICAqL1xuICAgIHJldHVybkV4cHJlc3Npb246IChwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pID0+IFFSZXR1cm5FeHByZXNzaW9uLFxuXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZyxcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgIGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWVsZHM6IEdEZWZpbml0aW9uW10sXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbikge1xuICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZERlZjogR0ZpZWxkKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWVsZERlZi5uYW1lICYmIGZpZWxkRGVmLm5hbWUudmFsdWUgfHwgJyc7XG4gICAgICAgIGlmIChuYW1lID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtmaWVsZERlZi5raW5kfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICdfX3R5cGVuYW1lJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7bmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXR1cm5lZCA9IGZpZWxkVHlwZS5yZXR1cm5FeHByZXNzaW9uKHBhdGgsIGZpZWxkRGVmKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KHJldHVybmVkLm5hbWUsIHJldHVybmVkLmV4cHJlc3Npb24pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBleHByZXNzaW9ucykge1xuICAgICAgICBmaWVsZHMucHVzaChgJHtrZXl9OiAke3ZhbHVlfWApO1xuICAgIH1cbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnksIGV4cGxhaW5PcD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgZXhwbGFpbk9wIHx8IG9wKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cblxuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzb24gPSAocGF0aCA9PT0gJ19rZXknIHx8IHBhdGguZW5kc1dpdGgoJy5fa2V5JykpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgZXhwbGFpbk9wPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiPT1cIiwgdmFsdWUsIGV4cGxhaW5PcCkpO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNjYWxhcnNcblxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCA/IHYgOiBudWxsO1xufVxuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7ZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIsIFwiIT1cIil9KWA7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY29udmVydEZpbHRlclZhbHVlKHZhbHVlLCBvcCwgY29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKGNvbnZlcnRlcikge1xuICAgICAgICByZXR1cm4gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgID8gdmFsdWUubWFwKHggPT4gY29udmVydGVyKHgpKVxuICAgICAgICAgICAgOiBjb252ZXJ0ZXIodmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcihmaWx0ZXJWYWx1ZUNvbnZlcnRlcj86ICh2YWx1ZTogYW55KSA9PiBhbnkpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0RmlsdGVyVmFsdWUoZmlsdGVyVmFsdWUsIG9wLCBmaWx0ZXJWYWx1ZUNvbnZlcnRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBpc0NvbGxlY3Rpb24gPSBwYXRoID09PSAnZG9jJztcbiAgICAgICAgICAgIGxldCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBpZiAoaXNDb2xsZWN0aW9uICYmIG5hbWUgPT09ICdpZCcpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gJ19rZXknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRGaWx0ZXJWYWx1ZShmaWx0ZXJWYWx1ZSwgb3AsIGZpbHRlclZhbHVlQ29udmVydGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHZhbHVlKTtcblxuICAgIGZ1bmN0aW9uIHBhZChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDEwKSB7XG4gICAgICAgICAgICByZXR1cm4gJzAnICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ01vbnRoKCkgKyAxKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ0RhdGUoKSkgK1xuICAgICAgICAnICcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICtcbiAgICAgICAgJy4nICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peFNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWUgKiAxMDAwKTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogJ0hFWCcsXG4gICAgREVDOiAnREVDJyxcbn07XG5cbmZ1bmN0aW9uIGludmVydGVkSGV4KGhleDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShoZXgpXG4gICAgICAgIC5tYXAoYyA9PiAoTnVtYmVyLnBhcnNlSW50KGMsIDE2KSBeIDB4ZikudG9TdHJpbmcoMTYpKVxuICAgICAgICAuam9pbignJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSwgYXJncz86IHsgZm9ybWF0PzogJ0hFWCcgfCAnREVDJyB9KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBuZWc7XG4gICAgbGV0IGhleDtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICBuZWcgPSB2YWx1ZSA8IDA7XG4gICAgICAgIGhleCA9IGAweCR7KG5lZyA/IC12YWx1ZSA6IHZhbHVlKS50b1N0cmluZygxNil9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzID0gdmFsdWUudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgIG5lZyA9IHMuc3RhcnRzV2l0aCgnLScpO1xuICAgICAgICBoZXggPSBgMHgke25lZyA/IGludmVydGVkSGV4KHMuc3Vic3RyKHByZWZpeExlbmd0aCArIDEpKSA6IHMuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbiAgICB9XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIGAke25lZyA/ICctJyA6ICcnfSR7KGZvcm1hdCA9PT0gQmlnTnVtYmVyRm9ybWF0LkhFWCkgPyBoZXggOiBCaWdJbnQoaGV4KS50b1N0cmluZygpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBsZXQgYmlnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIGJpZyA9IHMuc3RhcnRzV2l0aCgnLScpID8gLUJpZ0ludChzLnN1YnN0cigxKSkgOiBCaWdJbnQocyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmlnID0gQmlnSW50KHZhbHVlKTtcbiAgICB9XG4gICAgY29uc3QgbmVnID0gYmlnIDwgQmlnSW50KDApO1xuICAgIGNvbnN0IGhleCA9IChuZWcgPyAtYmlnIDogYmlnKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gKGhleC5sZW5ndGggLSAxKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgY29uc3QgcmVzdWx0ID0gYCR7cHJlZml4fSR7aGV4fWA7XG4gICAgcmV0dXJuIG5lZyA/IGAtJHtpbnZlcnRlZEhleChyZXN1bHQpfWAgOiByZXN1bHQ7XG59XG5cbmV4cG9ydCBjb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5leHBvcnQgY29uc3Qgc3RyaW5nTG93ZXJGaWx0ZXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKHggPT4geCA/IHgudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIDogeCk7XG5leHBvcnQgY29uc3QgYmlnVUludDE6IFFUeXBlID0gY3JlYXRlU2NhbGFyKHggPT4gY29udmVydEJpZ1VJbnQoMSwgeCkpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcih4ID0+IGNvbnZlcnRCaWdVSW50KDIsIHgpKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cnVjdHNcblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0T3IoZmlsdGVyOiBhbnkpOiBhbnlbXSB7XG4gICAgY29uc3Qgb3BlcmFuZHMgPSBbXTtcbiAgICBsZXQgb3BlcmFuZCA9IGZpbHRlcjtcbiAgICB3aGlsZSAob3BlcmFuZCkge1xuICAgICAgICBpZiAoJ09SJyBpbiBvcGVyYW5kKSB7XG4gICAgICAgICAgICBjb25zdCB3aXRob3V0T3IgPSBPYmplY3QuYXNzaWduKHt9LCBvcGVyYW5kKTtcbiAgICAgICAgICAgIGRlbGV0ZSB3aXRob3V0T3JbJ09SJ107XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKHdpdGhvdXRPcik7XG4gICAgICAgICAgICBvcGVyYW5kID0gb3BlcmFuZC5PUjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2gob3BlcmFuZCk7XG4gICAgICAgICAgICBvcGVyYW5kID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3BlcmFuZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkcyxcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpLm1hcCgob3BlcmFuZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgb3BlcmFuZCwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBjb21iaW5lUGF0aChwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAob3JPcGVyYW5kcy5sZW5ndGggPiAxKSA/IGAoJHtvck9wZXJhbmRzLmpvaW4oJykgT1IgKCcpfSlgIDogb3JPcGVyYW5kc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICAgICAgICAgICAgICBleHByZXNzaW9ucyxcbiAgICAgICAgICAgICAgICBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgICAgICAoZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnMpIHx8IFtdLFxuICAgICAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCggJHtwYXRofS4ke25hbWV9ICYmICR7Y29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKX0gKWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdEZpZWxkcyh2YWx1ZSwgb3JPcGVyYW5kc1tpXSwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBsZXQgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nO1xuICAgIGNvbnN0IGV4cGxhbmF0aW9uID0gcGFyYW1zLmV4cGxhbmF0aW9uO1xuICAgIGlmIChleHBsYW5hdGlvbikge1xuICAgICAgICBjb25zdCBzYXZlUGFyZW50UGF0aCA9IGV4cGxhbmF0aW9uLnBhcmVudFBhdGg7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBgJHtleHBsYW5hdGlvbi5wYXJlbnRQYXRofSR7cGF0aH1bKl1gO1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gc2F2ZVBhcmVudFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1GaWx0ZXJDb25kaXRpb247XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGaWVsZFBhdGhDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoYyA+PSAnQScgJiYgYyA8PSAnWicpXG4gICAgICAgIHx8IChjID49ICdhJyAmJiBjIDw9ICd6JylcbiAgICAgICAgfHwgKGMgPj0gJzAnICYmIGMgPD0gJzknKVxuICAgICAgICB8fCAoYyA9PT0gJ18nIHx8IGMgPT09ICdbJyB8fCBjID09PSAnKicgfHwgYyA9PT0gJ10nIHx8IGMgPT09ICcuJyk7XG59XG5cbmZ1bmN0aW9uIGlzRmllbGRQYXRoKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGVzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoIWlzVmFsaWRGaWVsZFBhdGhDaGFyKHRlc3RbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyeU9wdGltaXplQXJyYXlBbnkocGF0aDogc3RyaW5nLCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtczogUVBhcmFtcyk6ID9zdHJpbmcge1xuICAgIGZ1bmN0aW9uIHRyeU9wdGltaXplKGZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbUluZGV4OiBudW1iZXIpOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbUluZGV4ICsgMX1gO1xuICAgICAgICBjb25zdCBzdWZmaXggPSBgID09ICR7cGFyYW1OYW1lfWA7XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24gPT09IGBDVVJSRU5UJHtzdWZmaXh9YCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCdDVVJSRU5ULicpICYmIGZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBmaWx0ZXJDb25kaXRpb24uc2xpY2UoJ0NVUlJFTlQuJy5sZW5ndGgsIC1zdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgICAgIGlmIChpc0ZpZWxkUGF0aChmaWVsZFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXS4ke2ZpZWxkUGF0aH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghaXRlbUZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCcoJykgfHwgIWl0ZW1GaWx0ZXJDb25kaXRpb24uZW5kc1dpdGgoJyknKSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbHRlckNvbmRpdGlvblBhcnRzID0gaXRlbUZpbHRlckNvbmRpdGlvbi5zbGljZSgxLCAtMSkuc3BsaXQoJykgT1IgKCcpO1xuICAgIGlmIChmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xuICAgIH1cbiAgICBjb25zdCBvcHRpbWl6ZWRQYXJ0cyA9IGZpbHRlckNvbmRpdGlvblBhcnRzXG4gICAgICAgIC5tYXAoKHgsIGkpID0+IHRyeU9wdGltaXplKHgsIHBhcmFtcy5jb3VudCAtIGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCArIGkpKVxuICAgICAgICAuZmlsdGVyKHggPT4geCAhPT0gbnVsbCk7XG4gICAgaWYgKG9wdGltaXplZFBhcnRzLmxlbmd0aCAhPT0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gYCgke29wdGltaXplZFBhcnRzLmpvaW4oJykgT1IgKCcpfSlgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEZpbHRlckNvbmRpdGlvbiA9IHRyeU9wdGltaXplQXJyYXlBbnkocGF0aCwgaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBpdGVtU2VsZWN0aW9ucyA9IGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgbGV0IGV4cHJlc3Npb247XG4gICAgICAgICAgICBpZiAoaXRlbVNlbGVjdGlvbnMgJiYgaXRlbVNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGAke3BhdGh9LiR7bmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gZmllbGRQYXRoLnNwbGl0KCcuJykuam9pbignX18nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsIGFsaWFzLCBpdGVtU2VsZWN0aW9ucywgaXRlbVR5cGUuZmllbGRzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRXhwcmVzc2lvbiA9IGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoICR7ZmllbGRQYXRofSAmJiAoIEZPUiAke2FsaWFzfSBJTiAke2ZpZWxkUGF0aH0gfHwgW10gUkVUVVJOICR7aXRlbUV4cHJlc3Npb259ICkgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29tcGFuaW9uKG9uRmllbGQ6IHN0cmluZyk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24oX3BhcmFtcywgX3BhdGgsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmFsc2UnO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KF9wYXJlbnQsIF92YWx1ZSwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEpvaW5zXG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gb25GaWVsZCA9PT0gJ2lkJyA/ICdfa2V5JyA6IG9uRmllbGQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luQXJyYXkoXG4gICAgb25GaWVsZDogc3RyaW5nLFxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmQ29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlLFxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiA/R1NlbGVjdGlvblNldCwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGlzRmFzdDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4VG9TdHJpbmcoaW5kZXg6IFFJbmRleEluZm8pOiBzdHJpbmcge1xuICAgIHJldHVybiBpbmRleC5maWVsZHMuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5kZXgoczogc3RyaW5nKTogUUluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnlUb1N0cmluZyhvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xuICAgIHJldHVybiBvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0keyh4LmRpcmVjdGlvbiB8fCAnJykgPT09ICdERVNDJyA/ICcgREVTQycgOiAnJ31gKS5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPcmRlckJ5KHM6IHN0cmluZyk6IE9yZGVyQnlbXSB7XG4gICAgcmV0dXJuIHMuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHggPT4geC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4KVxuICAgICAgICAubWFwKChzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJyAnKS5maWx0ZXIoeCA9PiB4KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aDogcGFydHNbMF0sXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAocGFydHNbMV0gfHwgJycpLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJyA/ICdERVNDJyA6ICdBU0MnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2NhbGFyRmllbGRzKHNjaGVtYTogRGJTY2hlbWEpOiBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PigpO1xuXG4gICAgZnVuY3Rpb24gYWRkRm9yRGJUeXBlKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9IHR5cGUuY29sbGVjdGlvbiAmJiBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNjYWxhckZpZWxkcy5zZXQoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogZG9jUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgYWRkRm9yRGJUeXBlKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNjaGVtYS50eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGFkZEZvckRiVHlwZSh0eXBlLCAnJywgJycpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjYWxhckZpZWxkcztcbn1cbiJdfQ==