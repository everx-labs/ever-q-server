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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9uIiwiZXhwcmVzc2lvbiIsImNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyIsImtleSIsImpvaW4iLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImZpbHRlckNvbmRpdGlvbk9wIiwicGFyYW1zIiwiZXhwbGFpbk9wIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY29udmVydEZpbHRlclZhbHVlIiwiY29udmVydGVyIiwieCIsImNyZWF0ZVNjYWxhciIsImZpbHRlclZhbHVlQ29udmVydGVyIiwiY29udmVydGVkIiwiZGVmIiwiaXNDb2xsZWN0aW9uIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsInNjYWxhciIsInN0cmluZ0xvd2VyRmlsdGVyIiwidG9Mb3dlckNhc2UiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3BsaXRPciIsIm9wZXJhbmRzIiwib3BlcmFuZCIsIndpdGhvdXRPciIsImFzc2lnbiIsIk9SIiwic3RydWN0Iiwib3JPcGVyYW5kcyIsImZpZWxkTmFtZSIsInNlbGVjdGlvblNldCIsInNlbGVjdGlvbnMiLCJpIiwiZ2V0SXRlbUZpbHRlckNvbmRpdGlvbiIsIml0ZW1UeXBlIiwiaXRlbUZpbHRlckNvbmRpdGlvbiIsInNhdmVQYXJlbnRQYXRoIiwiaXNWYWxpZEZpZWxkUGF0aENoYXIiLCJpc0ZpZWxkUGF0aCIsInRyeU9wdGltaXplQXJyYXlBbnkiLCJ0cnlPcHRpbWl6ZSIsInBhcmFtSW5kZXgiLCJzdWZmaXgiLCJmaWVsZFBhdGgiLCJmaWx0ZXJDb25kaXRpb25QYXJ0cyIsInNwbGl0Iiwib3B0aW1pemVkUGFydHMiLCJhcnJheSIsInJlc29sdmVJdGVtVHlwZSIsInJlc29sdmVkIiwib3BzIiwiYWxsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24iLCJzdWNjZWVkZWRJbmRleCIsIml0ZW1TZWxlY3Rpb25zIiwiYWxpYXMiLCJpdGVtRXhwcmVzc2lvbiIsImNyZWF0ZUVudW1OYW1lc01hcCIsIm5hbWVzIiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwib25fcGF0aCIsImNvbmNhdCIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJzdHJpbmdDb21wYW5pb24iLCJfcGFyYW1zIiwiX2ZpbHRlciIsIl9wYXJlbnQiLCJfdmFsdWUiLCJyZWZGaWVsZCIsInJlZkNvbGxlY3Rpb24iLCJyZXNvbHZlUmVmVHlwZSIsInJlZlR5cGUiLCJyZXBsYWNlIiwicmVmRmlsdGVyQ29uZGl0aW9uIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiaXNBcnJheSIsInNlbGVjdGVkIiwiX2tleSIsImlkIiwicmVxdWlyZWRGb3JKb2luIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJpbmRleFRvU3RyaW5nIiwiaW5kZXgiLCJwYXJzZUluZGV4Iiwib3JkZXJCeVRvU3RyaW5nIiwib3JkZXJCeSIsImRpcmVjdGlvbiIsInBhcnNlT3JkZXJCeSIsInBhcnRzIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImNvbGxlY3Rpb24iLCJkb2NQYXRoIiwiYXJyYXlEZXB0aCIsImRlcHRoIiwiY2F0ZWdvcnkiLCJ0eXBlTmFtZSIsInNjYWxhclR5cGVzIiwiYm9vbGVhbiIsImZsb2F0IiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJ0eXBlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7O0FBckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVlBLE1BQU1BLGVBQWUsR0FBRyxJQUFJQyxLQUFKLENBQVUsaUJBQVYsQ0FBeEI7O0FBMkJBLFNBQVNDLFdBQVQsQ0FBcUJDLElBQXJCLEVBQW1DQyxJQUFuQyxFQUF5RDtBQUNyRCxRQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBTCxDQUFjLEdBQWQsSUFBcUJILElBQUksQ0FBQ0ksS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsQ0FBckIsR0FBeUNKLElBQW5EO0FBQ0EsUUFBTUssQ0FBQyxHQUFHSixJQUFJLENBQUNLLFVBQUwsQ0FBZ0IsR0FBaEIsSUFBdUJMLElBQUksQ0FBQ0csS0FBTCxDQUFXLENBQVgsQ0FB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Rk0sTUFFQSxJQUFJdk4sS0FBSyxDQUFDOE0sSUFBTixLQUFlVSwyQkFBWUksTUFBL0IsRUFBdUM7QUFDMUNMLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUl2TixLQUFLLENBQUM4TSxJQUFOLEtBQWVVLDJCQUFZSyxRQUEvQixFQUF5QztBQUM1Q04sWUFBQUEsUUFBUSxHQUFHLFVBQVg7QUFDSCxXQUZNLE1BRUE7QUFDSEEsWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSDs7QUFDRFgsVUFBQUEsWUFBWSxDQUFDeE4sR0FBYixDQUNJcEIsSUFESixFQUVJO0FBQ0k4TyxZQUFBQSxJQUFJLEVBQUVTLFFBRFY7QUFFSXZQLFlBQUFBLElBQUksRUFBRW1QO0FBRlYsV0FGSjtBQU9BOztBQUNKLGFBQUssUUFBTDtBQUNBLGFBQUssT0FBTDtBQUNJTixVQUFBQSxZQUFZLENBQUM3TSxLQUFLLENBQUM4TSxJQUFQLEVBQWE5TyxJQUFiLEVBQW1CbVAsT0FBbkIsQ0FBWjtBQUNBO0FBM0JKO0FBNkJILEtBL0NEO0FBZ0RIOztBQUdEUixFQUFBQSxNQUFNLENBQUNtQixLQUFQLENBQWF0TixPQUFiLENBQXNCc00sSUFBRCxJQUFVO0FBQzNCRCxJQUFBQSxZQUFZLENBQUNDLElBQUQsRUFBTyxFQUFQLEVBQVcsRUFBWCxDQUFaO0FBQ0gsR0FGRDtBQUlBLFNBQU9GLFlBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFJbmRleEluZm8gfSBmcm9tICcuLi9kYXRhL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHsgc2NhbGFyVHlwZXMgfSBmcm9tIFwiLi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBEYkZpZWxkLCBEYlNjaGVtYSwgRGJUeXBlIH0gZnJvbSBcIi4uL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5jb25zdCBOT1RfSU1QTEVNRU5URUQgPSBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG5leHBvcnQgdHlwZSBHTmFtZSA9IHtcbiAgICBraW5kOiAnTmFtZScsXG4gICAgdmFsdWU6IHN0cmluZyxcbn07XG5cbmV4cG9ydCB0eXBlIEdGaWVsZCA9IHtcbiAgICBraW5kOiAnRmllbGQnLFxuICAgIGFsaWFzOiBzdHJpbmcsXG4gICAgbmFtZTogR05hbWUsXG4gICAgYXJndW1lbnRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGRpcmVjdGl2ZXM6IEdEZWZpbml0aW9uW10sXG4gICAgc2VsZWN0aW9uU2V0OiB0eXBlb2YgdW5kZWZpbmVkIHwgR1NlbGVjdGlvblNldCxcbn07XG5cbmV4cG9ydCB0eXBlIEdEZWZpbml0aW9uID0gR0ZpZWxkO1xuXG5leHBvcnQgdHlwZSBHU2VsZWN0aW9uU2V0ID0ge1xuICAgIGtpbmQ6ICdTZWxlY3Rpb25TZXQnLFxuICAgIHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10sXG59O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCB0eXBlIFNjYWxhckZpZWxkID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICB0eXBlOiAoJ251bWJlcicgfCAndWludDY0JyB8ICd1aW50MTAyNCcgfCAnYm9vbGVhbicgfCAnc3RyaW5nJyksXG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBhcmVudFBhdGggPSAnJztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHAgPSBwYXRoO1xuICAgICAgICBpZiAocC5zdGFydHNXaXRoKCdDVVJSRU5UJykpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZzogUUZpZWxkRXhwbGFuYXRpb24gfCB0eXBlb2YgdW5kZWZpbmVkID0gdGhpcy5maWVsZHMuZ2V0KHApO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uczogbmV3IFNldChbb3BdKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG50eXBlIFFSZXR1cm5FeHByZXNzaW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBleHByZXNzaW9uOiBzdHJpbmcsXG59O1xuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICBmaWVsZHM/OiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIGZpbHRlckNvbmRpdGlvbjogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIEFRTCBleHByZXNzaW9uIGZvciByZXR1cm4gc2VjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHBhcmFtIHtHRGVmaW5pdGlvbn0gZGVmXG4gICAgICovXG4gICAgcmV0dXJuRXhwcmVzc2lvbjogKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbikgPT4gUVJldHVybkV4cHJlc3Npb24sXG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKGZpbHRlckNvbmRpdGlvbkZvckZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgZXhwcmVzc2lvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpZWxkczogR0RlZmluaXRpb25bXSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuKSB7XG4gICAgZmllbGRzLmZvckVhY2goKGZpZWxkRGVmOiBHRmllbGQpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpZWxkRGVmLm5hbWUgJiYgZmllbGREZWYubmFtZS52YWx1ZSB8fCAnJztcbiAgICAgICAgaWYgKG5hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke2ZpZWxkRGVmLmtpbmR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmFtZSA9PT0gJ19fdHlwZW5hbWUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW25hbWVdO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtuYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldHVybmVkID0gZmllbGRUeXBlLnJldHVybkV4cHJlc3Npb24ocGF0aCwgZmllbGREZWYpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQocmV0dXJuZWQubmFtZSwgcmV0dXJuZWQuZXhwcmVzc2lvbik7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICAgIGZpZWxkcy5wdXNoKGAke2tleX06ICR7dmFsdWV9YCk7XG4gICAgfVxuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuLFxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgZXhwbGFpbk9wPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBwYXJhbXMuZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoLCBleHBsYWluT3AgfHwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuXG4gICAgY29uc3QgaXNLZXlPcmRlcmVkQ29tcGFyaXNvbiA9IChwYXRoID09PSAnX2tleScgfHwgcGF0aC5lbmRzV2l0aCgnLl9rZXknKSkgJiYgb3AgIT09ICc9PScgJiYgb3AgIT09ICchPSc7XG4gICAgY29uc3QgZml4ZWRQYXRoID0gaXNLZXlPcmRlcmVkQ29tcGFyaXNvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55LCBleHBsYWluT3A/OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgXCI9PVwiLCB2YWx1ZSwgZXhwbGFpbk9wKSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlciwgXCIhPVwiKX0pYDtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyT3BzID0ge1xuICAgIGVxOiBzY2FsYXJFcSxcbiAgICBuZTogc2NhbGFyTmUsXG4gICAgbHQ6IHNjYWxhckx0LFxuICAgIGxlOiBzY2FsYXJMZSxcbiAgICBndDogc2NhbGFyR3QsXG4gICAgZ2U6IHNjYWxhckdlLFxuICAgIGluOiBzY2FsYXJJbixcbiAgICBub3RJbjogc2NhbGFyTm90SW4sXG59O1xuXG5mdW5jdGlvbiBjb252ZXJ0RmlsdGVyVmFsdWUodmFsdWUsIG9wLCBjb252ZXJ0ZXI/OiAodmFsdWU6IGFueSkgPT4gYW55KTogc3RyaW5nIHtcbiAgICBpZiAoY29udmVydGVyKSB7XG4gICAgICAgIHJldHVybiAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgPyB2YWx1ZS5tYXAoeCA9PiBjb252ZXJ0ZXIoeCkpXG4gICAgICAgICAgICA6IGNvbnZlcnRlcih2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKGZpbHRlclZhbHVlQ29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRGaWx0ZXJWYWx1ZShmaWx0ZXJWYWx1ZSwgb3AsIGZpbHRlclZhbHVlQ29udmVydGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29sbGVjdGlvbiA9IHBhdGggPT09ICdkb2MnO1xuICAgICAgICAgICAgbGV0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24gJiYgbmFtZSA9PT0gJ2lkJykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSAnX2tleSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEZpbHRlclZhbHVlKGZpbHRlclZhbHVlLCBvcCwgZmlsdGVyVmFsdWVDb252ZXJ0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gaW52ZXJ0ZWRIZXgoaGV4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcbiAgICAgICAgLm1hcChjID0+IChOdW1iZXIucGFyc2VJbnQoYywgMTYpIF4gMHhmKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcbiAgICAgICAgaGV4ID0gYDB4JHsobmVnID8gLXZhbHVlIDogdmFsdWUpLnRvU3RyaW5nKDE2KX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgbmVnID0gcy5zdGFydHNXaXRoKCctJyk7XG4gICAgICAgIGhleCA9IGAweCR7bmVnID8gaW52ZXJ0ZWRIZXgocy5zdWJzdHIocHJlZml4TGVuZ3RoICsgMSkpIDogcy5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gYCR7bmVnID8gJy0nIDogJyd9JHsoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBiaWc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcbiAgICByZXR1cm4gbmVnID8gYC0ke2ludmVydGVkSGV4KHJlc3VsdCl9YCA6IHJlc3VsdDtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBzdHJpbmdMb3dlckZpbHRlcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiB4ID8geC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgOiB4KTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiBjb252ZXJ0QmlnVUludCgxLCB4KSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKHggPT4gY29udmVydEJpZ1VJbnQoMiwgeCkpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RydWN0c1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPcihmaWx0ZXI6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xuICAgIGxldCBvcGVyYW5kID0gZmlsdGVyO1xuICAgIHdoaWxlIChvcGVyYW5kKSB7XG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXRPciA9IE9iamVjdC5hc3NpZ24oe30sIG9wZXJhbmQpO1xuICAgICAgICAgICAgZGVsZXRlIHdpdGhvdXRPclsnT1InXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgKCAke3BhdGh9LiR7bmFtZX0gJiYgJHtjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpfSApYCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JPcGVyYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbUZpbHRlckNvbmRpdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEZpZWxkUGF0aENoYXIoYzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChjID49ICdBJyAmJiBjIDw9ICdaJylcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxuICAgICAgICB8fCAoYyA+PSAnMCcgJiYgYyA8PSAnOScpXG4gICAgICAgIHx8IChjID09PSAnXycgfHwgYyA9PT0gJ1snIHx8IGMgPT09ICcqJyB8fCBjID09PSAnXScgfHwgYyA9PT0gJy4nKTtcbn1cblxuZnVuY3Rpb24gaXNGaWVsZFBhdGgodGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICghaXNWYWxpZEZpZWxkUGF0aENoYXIodGVzdFtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoOiBzdHJpbmcsIGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1zOiBRUGFyYW1zKTogP3N0cmluZyB7XG4gICAgZnVuY3Rpb24gdHJ5T3B0aW1pemUoZmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtSW5kZXg6IG51bWJlcik6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtSW5kZXggKyAxfWA7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IGAgPT0gJHtwYXJhbU5hbWV9YDtcbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbiA9PT0gYENVUlJFTlQke3N1ZmZpeH1gKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJ0NVUlJFTlQuJykgJiYgZmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKHN1ZmZpeCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGZpbHRlckNvbmRpdGlvbi5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJygnKSB8fCAhaXRlbUZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aCgnKScpKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3QgZmlsdGVyQ29uZGl0aW9uUGFydHMgPSBpdGVtRmlsdGVyQ29uZGl0aW9uLnNsaWNlKDEsIC0xKS5zcGxpdCgnKSBPUiAoJyk7XG4gICAgaWYgKGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IG9wdGltaXplZFBhcnRzID0gZmlsdGVyQ29uZGl0aW9uUGFydHNcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gdHJ5T3B0aW1pemUoeCwgcGFyYW1zLmNvdW50IC0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoICsgaSkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcbiAgICBpZiAob3B0aW1pemVkUGFydHMubGVuZ3RoICE9PSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBgKCR7b3B0aW1pemVkUGFydHMuam9pbignKSBPUiAoJyl9KWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheShyZXNvbHZlSXRlbVR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uID0gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoLCBpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZEZpbHRlckNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1TZWxlY3Rpb25zID0gZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChpdGVtU2VsZWN0aW9ucyAmJiBpdGVtU2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBmaWVsZFBhdGguc3BsaXQoJy4nKS5qb2luKCdfXycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgYWxpYXMsIGl0ZW1TZWxlY3Rpb25zLCBpdGVtVHlwZS5maWVsZHMgfHwge30pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1FeHByZXNzaW9uID0gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCggJHtmaWVsZFBhdGh9ICYmICggRk9SICR7YWxpYXN9IElOICR7ZmllbGRQYXRofSB8fCBbXSBSRVRVUk4gJHtpdGVtRXhwcmVzc2lvbn0gKSApYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAke3BhdGh9LiR7bmFtZX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMob25fcGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cmluZyBDb21wYW5pb25zXG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdDb21wYW5pb24ob25GaWVsZDogc3RyaW5nKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihfcGFyYW1zLCBfcGF0aCwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuICdmYWxzZSc7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QoX3BhcmVudCwgX3ZhbHVlLCBfZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmRmlsdGVyQ29uZGl0aW9ufSlcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgPiAwYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBvbkZpZWxkID09PSAnaWQnID8gJ19rZXknIDogb25GaWVsZDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShcbiAgICBvbkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmRmllbGQ6IHN0cmluZyxcbiAgICByZWZDb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlLFxuKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGUsXG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6ID9HU2VsZWN0aW9uU2V0LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogUUluZGV4SW5mbyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGluZGV4LmZpZWxkcy5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmRleChzOiBzdHJpbmcpOiBRSW5kZXhJbmZvIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHM6IHMuc3BsaXQoJywnKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKHggPT4geCksXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY2FsYXJGaWVsZHMoc2NoZW1hOiBEYlNjaGVtYSk6IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+KCk7XG5cbiAgICBmdW5jdGlvbiBhZGRGb3JEYlR5cGUodHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gdHlwZS5jb2xsZWN0aW9uICYmIGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgbGV0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9YDtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9IGBbJHsnKicucmVwZWF0KGRlcHRoICsgMSl9XWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2NhbGFyRmllbGRzLnNldChcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBkb2NQYXRoLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBhZGRGb3JEYlR5cGUoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgc2NoZW1hLnR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgYWRkRm9yRGJUeXBlKHR5cGUsICcnLCAnJyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2NhbGFyRmllbGRzO1xufVxuIl19