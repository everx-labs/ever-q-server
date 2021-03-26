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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9uIiwiZXhwcmVzc2lvbiIsImNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyIsImtleSIsImpvaW4iLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImZpbHRlckNvbmRpdGlvbk9wIiwicGFyYW1zIiwiZXhwbGFpbk9wIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY29udmVydEZpbHRlclZhbHVlIiwiY29udmVydGVyIiwiY29udiIsIngiLCJjcmVhdGVTY2FsYXIiLCJmaWx0ZXJWYWx1ZUNvbnZlcnRlciIsImNvbnZlcnRlZCIsImRlZiIsImlzQ29sbGVjdGlvbiIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsImQiLCJEYXRlIiwicGFkIiwibnVtYmVyIiwiZ2V0VVRDRnVsbFllYXIiLCJnZXRVVENNb250aCIsImdldFVUQ0RhdGUiLCJnZXRVVENIb3VycyIsImdldFVUQ01pbnV0ZXMiLCJnZXRVVENTZWNvbmRzIiwiZ2V0VVRDTWlsbGlzZWNvbmRzIiwidG9GaXhlZCIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJCaWdOdW1iZXJGb3JtYXQiLCJIRVgiLCJERUMiLCJpbnZlcnRlZEhleCIsImhleCIsIkFycmF5IiwiZnJvbSIsImMiLCJOdW1iZXIiLCJwYXJzZUludCIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwiYXJncyIsIm5lZyIsInMiLCJ0cmltIiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJiaWciLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJyZXN1bHQiLCJzY2FsYXIiLCJzdHJpbmdMb3dlckZpbHRlciIsInRvTG93ZXJDYXNlIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJzZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25zIiwiaSIsImdldEl0ZW1GaWx0ZXJDb25kaXRpb24iLCJpdGVtVHlwZSIsIml0ZW1GaWx0ZXJDb25kaXRpb24iLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiaXNGaWVsZFBhdGgiLCJ0cnlPcHRpbWl6ZUFycmF5QW55IiwidHJ5T3B0aW1pemUiLCJwYXJhbUluZGV4Iiwic3VmZml4IiwiZmllbGRQYXRoIiwiZmlsdGVyQ29uZGl0aW9uUGFydHMiLCJzcGxpdCIsIm9wdGltaXplZFBhcnRzIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwib3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uIiwic3VjY2VlZGVkSW5kZXgiLCJpdGVtU2VsZWN0aW9ucyIsImFsaWFzIiwiaXRlbUV4cHJlc3Npb24iLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwic3RyaW5nQ29tcGFuaW9uIiwiX3BhcmFtcyIsIl9maWx0ZXIiLCJfcGFyZW50IiwiX3ZhbHVlIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsImNyZWF0ZVNjYWxhckZpZWxkcyIsInNjaGVtYSIsInNjYWxhckZpZWxkcyIsImFkZEZvckRiVHlwZSIsInR5cGUiLCJwYXJlbnREb2NQYXRoIiwiZW51bURlZiIsImRvY05hbWUiLCJjb2xsZWN0aW9uIiwiZG9jUGF0aCIsImFycmF5RGVwdGgiLCJkZXB0aCIsImNhdGVnb3J5IiwidHlwZU5hbWUiLCJzY2FsYXJUeXBlcyIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsInVpbnQ2NCIsInVpbnQxMDI0IiwidHlwZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOztBQXJCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFZQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQU9NLE1BQU1HLFlBQU4sQ0FBbUI7QUFJdEJDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0g7O0FBRURDLEVBQUFBLHNCQUFzQixDQUFDWixJQUFELEVBQWVhLEVBQWYsRUFBMkI7QUFDN0MsUUFBSVQsQ0FBQyxHQUFHSixJQUFSOztBQUNBLFFBQUlJLENBQUMsQ0FBQ0MsVUFBRixDQUFhLFNBQWIsQ0FBSixFQUE2QjtBQUN6QkQsTUFBQUEsQ0FBQyxHQUFHTixXQUFXLENBQUMsS0FBS1csVUFBTixFQUFrQkwsQ0FBQyxDQUFDVSxNQUFGLENBQVMsVUFBVUMsTUFBbkIsQ0FBbEIsQ0FBZjtBQUNIOztBQUNELFVBQU1DLFFBQThDLEdBQUcsS0FBS04sTUFBTCxDQUFZTyxHQUFaLENBQWdCYixDQUFoQixDQUF2RDs7QUFDQSxRQUFJWSxRQUFKLEVBQWM7QUFDVkEsTUFBQUEsUUFBUSxDQUFDRSxVQUFULENBQW9CQyxHQUFwQixDQUF3Qk4sRUFBeEI7QUFDSCxLQUZELE1BRU87QUFDSCxXQUFLSCxNQUFMLENBQVlVLEdBQVosQ0FBZ0JoQixDQUFoQixFQUFtQjtBQUNmYyxRQUFBQSxVQUFVLEVBQUUsSUFBSUcsR0FBSixDQUFRLENBQUNSLEVBQUQsQ0FBUjtBQURHLE9BQW5CO0FBR0g7QUFDSjs7QUF0QnFCOzs7O0FBNkIxQjtBQUNBO0FBQ0E7QUFDTyxNQUFNUyxPQUFOLENBQWM7QUFLakJkLEVBQUFBLFdBQVcsQ0FBQ2UsT0FBRCxFQUEyQjtBQUNsQyxTQUFLQyxLQUFMLEdBQWEsQ0FBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0EsU0FBS0MsV0FBTCxHQUFvQkgsT0FBTyxJQUFJQSxPQUFPLENBQUNJLE9BQXBCLEdBQ2IsSUFBSXBCLFlBQUosRUFEYSxHQUViLElBRk47QUFHSDs7QUFFRHFCLEVBQUFBLEtBQUssR0FBRztBQUNKLFNBQUtKLEtBQUwsR0FBYSxDQUFiO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLEVBQWQ7QUFDSDs7QUFFRE4sRUFBQUEsR0FBRyxDQUFDVSxLQUFELEVBQXFCO0FBQ3BCLFNBQUtMLEtBQUwsSUFBYyxDQUFkO0FBQ0EsVUFBTU0sSUFBSSxHQUFJLElBQUcsS0FBS04sS0FBTCxDQUFXTyxRQUFYLEVBQXNCLEVBQXZDO0FBQ0EsU0FBS04sTUFBTCxDQUFZSyxJQUFaLElBQW9CRCxLQUFwQjtBQUNBLFdBQU9DLElBQVA7QUFDSDs7QUFFRGxCLEVBQUFBLHNCQUFzQixDQUFDb0IsS0FBRCxFQUFnQm5CLEVBQWhCLEVBQTRCO0FBQzlDLFFBQUksS0FBS2EsV0FBVCxFQUFzQjtBQUNsQixXQUFLQSxXQUFMLENBQWlCZCxzQkFBakIsQ0FBd0NvQixLQUF4QyxFQUErQ25CLEVBQS9DO0FBQ0g7QUFDSjs7QUE3QmdCOzs7O0FBeUVyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTb0Isd0JBQVQsQ0FDSWpDLElBREosRUFFSWtDLE1BRkosRUFHSUMsVUFISixFQUlJQyx1QkFKSixFQUtVO0FBQ04sUUFBTUMsVUFBb0IsR0FBRyxFQUE3QjtBQUNBQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUwsTUFBZixFQUF1Qk0sT0FBdkIsQ0FBK0IsQ0FBQyxDQUFDQyxTQUFELEVBQVlDLFdBQVosQ0FBRCxLQUE4QjtBQUN6RCxVQUFNQyxTQUFTLEdBQUdSLFVBQVUsQ0FBQ00sU0FBRCxDQUE1Qjs7QUFDQSxRQUFJRSxTQUFKLEVBQWU7QUFDWE4sTUFBQUEsVUFBVSxDQUFDTyxJQUFYLENBQWdCUix1QkFBdUIsQ0FBQ08sU0FBRCxFQUFZM0MsSUFBWixFQUFrQnlDLFNBQWxCLEVBQTZCQyxXQUE3QixDQUF2QztBQUNILEtBRkQsTUFFTztBQUNILFlBQU0sSUFBSTdDLEtBQUosQ0FBVyx5QkFBd0I0QyxTQUFVLEVBQTdDLENBQU47QUFDSDtBQUNKLEdBUEQ7QUFRQSxTQUFPSSx1QkFBdUIsQ0FBQ1IsVUFBRCxFQUFhLEtBQWIsRUFBb0IsT0FBcEIsQ0FBOUI7QUFDSDs7QUFFTSxTQUFTUyx3QkFBVCxDQUNIQyxXQURHLEVBRUgvQyxJQUZHLEVBR0hVLE1BSEcsRUFJSHlCLFVBSkcsRUFLTDtBQUNFekIsRUFBQUEsTUFBTSxDQUFDOEIsT0FBUCxDQUFnQlEsUUFBRCxJQUFzQjtBQUNqQyxVQUFNbEIsSUFBSSxHQUFHa0IsUUFBUSxDQUFDbEIsSUFBVCxJQUFpQmtCLFFBQVEsQ0FBQ2xCLElBQVQsQ0FBY0QsS0FBL0IsSUFBd0MsRUFBckQ7O0FBQ0EsUUFBSUMsSUFBSSxLQUFLLEVBQWIsRUFBaUI7QUFDYixZQUFNLElBQUlqQyxLQUFKLENBQVcsNEJBQTJCbUQsUUFBUSxDQUFDQyxJQUFLLEVBQXBELENBQU47QUFDSDs7QUFFRCxRQUFJbkIsSUFBSSxLQUFLLFlBQWIsRUFBMkI7QUFDdkI7QUFDSDs7QUFFRCxVQUFNYSxTQUFTLEdBQUdSLFVBQVUsQ0FBQ0wsSUFBRCxDQUE1Qjs7QUFDQSxRQUFJLENBQUNhLFNBQUwsRUFBZ0I7QUFDWixZQUFNLElBQUk5QyxLQUFKLENBQVcsNEJBQTJCaUMsSUFBSyxFQUEzQyxDQUFOO0FBQ0g7O0FBQ0QsVUFBTW9CLFFBQVEsR0FBR1AsU0FBUyxDQUFDUSxnQkFBVixDQUEyQm5ELElBQTNCLEVBQWlDZ0QsUUFBakMsQ0FBakI7QUFDQUQsSUFBQUEsV0FBVyxDQUFDM0IsR0FBWixDQUFnQjhCLFFBQVEsQ0FBQ3BCLElBQXpCLEVBQStCb0IsUUFBUSxDQUFDRSxVQUF4QztBQUNILEdBaEJEO0FBaUJIOztBQUVNLFNBQVNDLHdCQUFULENBQWtDTixXQUFsQyxFQUE0RTtBQUMvRSxRQUFNckMsTUFBTSxHQUFHLEVBQWY7O0FBQ0EsT0FBSyxNQUFNLENBQUM0QyxHQUFELEVBQU16QixLQUFOLENBQVgsSUFBMkJrQixXQUEzQixFQUF3QztBQUNwQ3JDLElBQUFBLE1BQU0sQ0FBQ2tDLElBQVAsQ0FBYSxHQUFFVSxHQUFJLEtBQUl6QixLQUFNLEVBQTdCO0FBQ0g7O0FBQ0QsU0FBUSxLQUFJbkIsTUFBTSxDQUFDNkMsSUFBUCxDQUFZLElBQVosQ0FBa0IsSUFBOUI7QUFDSDtBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsU0FBU0MsVUFBVCxDQUNJM0IsS0FESixFQUVJSyxNQUZKLEVBR0lDLFVBSEosRUFJSXNCLFNBSkosRUFLVztBQUNQLFFBQU1DLE1BQU0sR0FBR3BCLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlTCxNQUFmLEVBQXVCeUIsSUFBdkIsQ0FBNEIsQ0FBQyxDQUFDbEIsU0FBRCxFQUFZQyxXQUFaLENBQUQsS0FBOEI7QUFDckUsVUFBTUMsU0FBUyxHQUFHUixVQUFVLENBQUNNLFNBQUQsQ0FBNUI7O0FBQ0EsUUFBSSxDQUFDRSxTQUFMLEVBQWdCO0FBQ1osWUFBTSxJQUFJOUMsS0FBSixDQUFXLHlCQUF3QjRDLFNBQVUsRUFBN0MsQ0FBTjtBQUNIOztBQUNELFdBQU8sRUFBRUUsU0FBUyxJQUFJYyxTQUFTLENBQUNkLFNBQUQsRUFBWWQsS0FBWixFQUFtQlksU0FBbkIsRUFBOEJDLFdBQTlCLENBQXhCLENBQVA7QUFDSCxHQU5jLENBQWY7QUFPQSxTQUFPLENBQUNnQixNQUFSO0FBQ0g7O0FBRUQsU0FBU0UsaUJBQVQsQ0FBMkJDLE1BQTNCLEVBQTRDN0QsSUFBNUMsRUFBMERhLEVBQTFELEVBQXNFcUIsTUFBdEUsRUFBbUY0QixTQUFuRixFQUErRztBQUMzR0QsRUFBQUEsTUFBTSxDQUFDakQsc0JBQVAsQ0FBOEJaLElBQTlCLEVBQW9DOEQsU0FBUyxJQUFJakQsRUFBakQ7QUFDQSxRQUFNa0QsU0FBUyxHQUFHRixNQUFNLENBQUMxQyxHQUFQLENBQVdlLE1BQVgsQ0FBbEI7QUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFSSxRQUFNOEIsc0JBQXNCLEdBQUcsQ0FBQ2hFLElBQUksS0FBSyxNQUFULElBQW1CQSxJQUFJLENBQUNFLFFBQUwsQ0FBYyxPQUFkLENBQXBCLEtBQStDVyxFQUFFLEtBQUssSUFBdEQsSUFBOERBLEVBQUUsS0FBSyxJQUFwRztBQUNBLFFBQU1vRCxTQUFTLEdBQUdELHNCQUFzQixHQUFJLGFBQVloRSxJQUFLLEdBQXJCLEdBQTBCQSxJQUFsRTtBQUNBLFFBQU1rRSxVQUFVLEdBQUksSUFBR0gsU0FBVSxFQUFqQztBQUNBLFNBQVEsR0FBRUUsU0FBVSxJQUFHcEQsRUFBRyxJQUFHcUQsVUFBVyxFQUF4QztBQUNIOztBQUVELFNBQVNyQix1QkFBVCxDQUFpQ1IsVUFBakMsRUFBdUR4QixFQUF2RCxFQUFtRXNELGlCQUFuRSxFQUFzRztBQUNsRyxNQUFJOUIsVUFBVSxDQUFDdEIsTUFBWCxLQUFzQixDQUExQixFQUE2QjtBQUN6QixXQUFPb0QsaUJBQVA7QUFDSDs7QUFDRCxNQUFJOUIsVUFBVSxDQUFDdEIsTUFBWCxLQUFzQixDQUExQixFQUE2QjtBQUN6QixXQUFPc0IsVUFBVSxDQUFDLENBQUQsQ0FBakI7QUFDSDs7QUFDRCxTQUFPLE1BQU1BLFVBQVUsQ0FBQ2tCLElBQVgsQ0FBaUIsS0FBSTFDLEVBQUcsSUFBeEIsQ0FBTixHQUFxQyxHQUE1QztBQUNIOztBQUVELFNBQVN1RCxvQkFBVCxDQUE4QlAsTUFBOUIsRUFBK0M3RCxJQUEvQyxFQUE2RGtDLE1BQTdELEVBQTBFNEIsU0FBMUUsRUFBc0c7QUFDbEcsUUFBTXpCLFVBQVUsR0FBR0gsTUFBTSxDQUFDbUMsR0FBUCxDQUFXeEMsS0FBSyxJQUFJK0IsaUJBQWlCLENBQUNDLE1BQUQsRUFBUzdELElBQVQsRUFBZSxJQUFmLEVBQXFCNkIsS0FBckIsRUFBNEJpQyxTQUE1QixDQUFyQyxDQUFuQjtBQUNBLFNBQU9qQix1QkFBdUIsQ0FBQ1IsVUFBRCxFQUFhLElBQWIsRUFBbUIsT0FBbkIsQ0FBOUI7QUFDSCxDLENBRUQ7OztBQUVBLFNBQVNpQyxlQUFULENBQXlCQyxDQUF6QixFQUFzQztBQUNsQyxTQUFPQSxDQUFDLEtBQUtDLFNBQU4sR0FBa0JELENBQWxCLEdBQXNCLElBQTdCO0FBQ0g7O0FBRUQsTUFBTUUsUUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBa0I3RCxJQUFsQixFQUF3QmtDLE1BQXhCLEVBQWdDO0FBQzNDLFdBQU8wQixpQkFBaUIsQ0FBQ0MsTUFBRCxFQUFTN0QsSUFBVCxFQUFlLElBQWYsRUFBcUJrQyxNQUFyQixDQUF4QjtBQUNILEdBSG1COztBQUlwQmlCLEVBQUFBLGdCQUFnQixDQUFDd0IsS0FBRCxFQUFnQkMsSUFBaEIsRUFBc0Q7QUFDbEUsVUFBTWhGLGVBQU47QUFDSCxHQU5tQjs7QUFPcEJpRixFQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU2pELEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFdBQU9MLEtBQUssS0FBS0ssTUFBakI7QUFDSDs7QUFUbUIsQ0FBeEI7QUFZQSxNQUFNNkMsUUFBZSxHQUFHO0FBQ3BCTCxFQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsV0FBTzBCLGlCQUFpQixDQUFDQyxNQUFELEVBQVM3RCxJQUFULEVBQWUsSUFBZixFQUFxQmtDLE1BQXJCLENBQXhCO0FBQ0gsR0FIbUI7O0FBSXBCaUIsRUFBQUEsZ0JBQWdCLENBQUN3QixLQUFELEVBQWdCQyxJQUFoQixFQUFzRDtBQUNsRSxVQUFNaEYsZUFBTjtBQUNILEdBTm1COztBQU9wQmlGLEVBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTakQsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsV0FBT0wsS0FBSyxLQUFLSyxNQUFqQjtBQUNIOztBQVRtQixDQUF4QjtBQVlBLE1BQU04QyxRQUFlLEdBQUc7QUFDcEJOLEVBQUFBLGVBQWUsQ0FBQ2IsTUFBRCxFQUFTN0QsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNsQyxXQUFPMEIsaUJBQWlCLENBQUNDLE1BQUQsRUFBUzdELElBQVQsRUFBZSxHQUFmLEVBQW9Ca0MsTUFBcEIsQ0FBeEI7QUFDSCxHQUhtQjs7QUFJcEJpQixFQUFBQSxnQkFBZ0IsQ0FBQ3dCLEtBQUQsRUFBZ0JDLElBQWhCLEVBQXNEO0FBQ2xFLFVBQU1oRixlQUFOO0FBQ0gsR0FObUI7O0FBT3BCaUYsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPTCxLQUFLLEdBQUdLLE1BQWY7QUFDSDs7QUFUbUIsQ0FBeEI7QUFZQSxNQUFNK0MsUUFBZSxHQUFHO0FBQ3BCUCxFQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsV0FBTzBCLGlCQUFpQixDQUFDQyxNQUFELEVBQVM3RCxJQUFULEVBQWUsSUFBZixFQUFxQmtDLE1BQXJCLENBQXhCO0FBQ0gsR0FIbUI7O0FBSXBCaUIsRUFBQUEsZ0JBQWdCLENBQUN3QixLQUFELEVBQWdCQyxJQUFoQixFQUFzRDtBQUNsRSxVQUFNaEYsZUFBTjtBQUNILEdBTm1COztBQU9wQmlGLEVBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTakQsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsV0FBT0wsS0FBSyxJQUFJSyxNQUFoQjtBQUNIOztBQVRtQixDQUF4QjtBQVlBLE1BQU1nRCxRQUFlLEdBQUc7QUFDcEJSLEVBQUFBLGVBQWUsQ0FBQ2IsTUFBRCxFQUFTN0QsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNsQyxXQUFPMEIsaUJBQWlCLENBQUNDLE1BQUQsRUFBUzdELElBQVQsRUFBZSxHQUFmLEVBQW9Ca0MsTUFBcEIsQ0FBeEI7QUFDSCxHQUhtQjs7QUFJcEJpQixFQUFBQSxnQkFBZ0IsQ0FBQ3dCLEtBQUQsRUFBZ0JDLElBQWhCLEVBQXNEO0FBQ2xFLFVBQU1oRixlQUFOO0FBQ0gsR0FObUI7O0FBT3BCaUYsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPTCxLQUFLLEdBQUdLLE1BQWY7QUFDSDs7QUFUbUIsQ0FBeEI7QUFZQSxNQUFNaUQsUUFBZSxHQUFHO0FBQ3BCVCxFQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsV0FBTzBCLGlCQUFpQixDQUFDQyxNQUFELEVBQVM3RCxJQUFULEVBQWUsSUFBZixFQUFxQmtDLE1BQXJCLENBQXhCO0FBQ0gsR0FIbUI7O0FBSXBCaUIsRUFBQUEsZ0JBQWdCLENBQUN3QixLQUFELEVBQWdCQyxJQUFoQixFQUFzRDtBQUNsRSxVQUFNaEYsZUFBTjtBQUNILEdBTm1COztBQU9wQmlGLEVBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTakQsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsV0FBT0wsS0FBSyxJQUFJSyxNQUFoQjtBQUNIOztBQVRtQixDQUF4QjtBQVlBLE1BQU1rRCxRQUFlLEdBQUc7QUFDcEJWLEVBQUFBLGVBQWUsQ0FBQ2IsTUFBRCxFQUFTN0QsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNsQyxXQUFPa0Msb0JBQW9CLENBQUNQLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsQ0FBM0I7QUFDSCxHQUhtQjs7QUFJcEJpQixFQUFBQSxnQkFBZ0IsQ0FBQ3dCLEtBQUQsRUFBZ0JDLElBQWhCLEVBQXNEO0FBQ2xFLFVBQU1oRixlQUFOO0FBQ0gsR0FObUI7O0FBT3BCaUYsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPQSxNQUFNLENBQUNtRCxRQUFQLENBQWdCeEQsS0FBaEIsQ0FBUDtBQUNIOztBQVRtQixDQUF4QjtBQVlBLE1BQU15RCxXQUFrQixHQUFHO0FBQ3ZCWixFQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsV0FBUSxRQUFPa0Msb0JBQW9CLENBQUNQLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUIsSUFBdkIsQ0FBNkIsR0FBaEU7QUFDSCxHQUhzQjs7QUFJdkJpQixFQUFBQSxnQkFBZ0IsQ0FBQ3dCLEtBQUQsRUFBZ0JDLElBQWhCLEVBQXNEO0FBQ2xFLFVBQU1oRixlQUFOO0FBQ0gsR0FOc0I7O0FBT3ZCaUYsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPLENBQUNBLE1BQU0sQ0FBQ21ELFFBQVAsQ0FBZ0J4RCxLQUFoQixDQUFSO0FBQ0g7O0FBVHNCLENBQTNCO0FBWUEsTUFBTTBELFNBQVMsR0FBRztBQUNkQyxFQUFBQSxFQUFFLEVBQUVmLFFBRFU7QUFFZGdCLEVBQUFBLEVBQUUsRUFBRVYsUUFGVTtBQUdkVyxFQUFBQSxFQUFFLEVBQUVWLFFBSFU7QUFJZFcsRUFBQUEsRUFBRSxFQUFFVixRQUpVO0FBS2RXLEVBQUFBLEVBQUUsRUFBRVYsUUFMVTtBQU1kVyxFQUFBQSxFQUFFLEVBQUVWLFFBTlU7QUFPZFcsRUFBQUEsRUFBRSxFQUFFVixRQVBVO0FBUWRXLEVBQUFBLEtBQUssRUFBRVQ7QUFSTyxDQUFsQjs7QUFXQSxTQUFTVSxrQkFBVCxDQUE0Qm5FLEtBQTVCLEVBQW1DaEIsRUFBbkMsRUFBdUNvRixTQUF2QyxFQUFnRjtBQUM1RSxNQUFJQSxTQUFKLEVBQWU7QUFDWCxVQUFNQyxJQUFJLEdBQUdELFNBQWI7QUFDQSxXQUFRcEYsRUFBRSxLQUFLMEUsU0FBUyxDQUFDTyxFQUFqQixJQUF1QmpGLEVBQUUsS0FBSzBFLFNBQVMsQ0FBQ1EsS0FBekMsR0FDRGxFLEtBQUssQ0FBQ3dDLEdBQU4sQ0FBVThCLENBQUMsSUFBSUQsSUFBSSxDQUFDQyxDQUFELENBQW5CLENBREMsR0FFREQsSUFBSSxDQUFDckUsS0FBRCxDQUZWO0FBR0g7O0FBQ0QsU0FBT0EsS0FBUDtBQUNIOztBQUVELFNBQVN1RSxZQUFULENBQXNCQyxvQkFBdEIsRUFBeUU7QUFDckUsU0FBTztBQUNIM0IsSUFBQUEsZUFBZSxDQUFDYixNQUFELEVBQVM3RCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ2xDLGFBQU9ELHdCQUF3QixDQUFDakMsSUFBRCxFQUFPa0MsTUFBUCxFQUFlcUQsU0FBZixFQUEwQixDQUFDMUUsRUFBRCxFQUFLYixJQUFMLEVBQVd5QyxTQUFYLEVBQXNCQyxXQUF0QixLQUFzQztBQUMzRixjQUFNNEQsU0FBUyxHQUFHTixrQkFBa0IsQ0FBQ3RELFdBQUQsRUFBYzdCLEVBQWQsRUFBa0J3RixvQkFBbEIsQ0FBcEM7QUFDQSxlQUFPeEYsRUFBRSxDQUFDNkQsZUFBSCxDQUFtQmIsTUFBbkIsRUFBMkI3RCxJQUEzQixFQUFpQ3NHLFNBQWpDLENBQVA7QUFDSCxPQUg4QixDQUEvQjtBQUlILEtBTkU7O0FBT0huRCxJQUFBQSxnQkFBZ0IsQ0FBQ25ELElBQUQsRUFBZXVHLEdBQWYsRUFBb0Q7QUFDaEUsWUFBTUMsWUFBWSxHQUFHeEcsSUFBSSxLQUFLLEtBQTlCO0FBQ0EsVUFBSThCLElBQUksR0FBR3lFLEdBQUcsQ0FBQ3pFLElBQUosQ0FBU0QsS0FBcEI7O0FBQ0EsVUFBSTJFLFlBQVksSUFBSTFFLElBQUksS0FBSyxJQUE3QixFQUFtQztBQUMvQkEsUUFBQUEsSUFBSSxHQUFHLE1BQVA7QUFDSDs7QUFDRCxhQUFPO0FBQ0hBLFFBQUFBLElBREc7QUFFSHNCLFFBQUFBLFVBQVUsRUFBRyxHQUFFcEQsSUFBSyxJQUFHOEIsSUFBSztBQUZ6QixPQUFQO0FBSUgsS0FqQkU7O0FBa0JIK0MsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixhQUFPc0IsVUFBVSxDQUFDM0IsS0FBRCxFQUFRSyxNQUFSLEVBQWdCcUQsU0FBaEIsRUFBMkIsQ0FBQzFFLEVBQUQsRUFBS2dCLEtBQUwsRUFBWVksU0FBWixFQUF1QkMsV0FBdkIsS0FBdUM7QUFDL0UsY0FBTTRELFNBQVMsR0FBR04sa0JBQWtCLENBQUN0RCxXQUFELEVBQWM3QixFQUFkLEVBQWtCd0Ysb0JBQWxCLENBQXBDO0FBQ0EsZUFBT3hGLEVBQUUsQ0FBQ2dFLElBQUgsQ0FBUUMsTUFBUixFQUFnQlIsZUFBZSxDQUFDekMsS0FBRCxDQUEvQixFQUF3Q3lFLFNBQXhDLENBQVA7QUFDSCxPQUhnQixDQUFqQjtBQUlIOztBQXZCRSxHQUFQO0FBeUJIOztBQUVNLFNBQVNHLHdCQUFULENBQWtDNUUsS0FBbEMsRUFBc0Q7QUFDekQsTUFBSUEsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBSzJDLFNBQWhDLEVBQTJDO0FBQ3ZDLFdBQU8zQyxLQUFQO0FBQ0g7O0FBQ0QsUUFBTTZFLENBQUMsR0FBRyxJQUFJQyxJQUFKLENBQVM5RSxLQUFULENBQVY7O0FBRUEsV0FBUytFLEdBQVQsQ0FBYUMsTUFBYixFQUFxQjtBQUNqQixRQUFJQSxNQUFNLEdBQUcsRUFBYixFQUFpQjtBQUNiLGFBQU8sTUFBTUEsTUFBYjtBQUNIOztBQUNELFdBQU9BLE1BQVA7QUFDSDs7QUFFRCxTQUFPSCxDQUFDLENBQUNJLGNBQUYsS0FDSCxHQURHLEdBQ0dGLEdBQUcsQ0FBQ0YsQ0FBQyxDQUFDSyxXQUFGLEtBQWtCLENBQW5CLENBRE4sR0FFSCxHQUZHLEdBRUdILEdBQUcsQ0FBQ0YsQ0FBQyxDQUFDTSxVQUFGLEVBQUQsQ0FGTixHQUdILEdBSEcsR0FHR0osR0FBRyxDQUFDRixDQUFDLENBQUNPLFdBQUYsRUFBRCxDQUhOLEdBSUgsR0FKRyxHQUlHTCxHQUFHLENBQUNGLENBQUMsQ0FBQ1EsYUFBRixFQUFELENBSk4sR0FLSCxHQUxHLEdBS0dOLEdBQUcsQ0FBQ0YsQ0FBQyxDQUFDUyxhQUFGLEVBQUQsQ0FMTixHQU1ILEdBTkcsR0FNRyxDQUFDVCxDQUFDLENBQUNVLGtCQUFGLEtBQXlCLElBQTFCLEVBQWdDQyxPQUFoQyxDQUF3QyxDQUF4QyxFQUEyQ2xILEtBQTNDLENBQWlELENBQWpELEVBQW9ELENBQXBELENBTlY7QUFPSDs7QUFFTSxTQUFTbUgsbUJBQVQsQ0FBNkJ6RixLQUE3QixFQUFpRDtBQUNwRCxNQUFJQSxLQUFLLEtBQUssSUFBVixJQUFrQkEsS0FBSyxLQUFLMkMsU0FBaEMsRUFBMkM7QUFDdkMsV0FBTzNDLEtBQVA7QUFDSDs7QUFDRCxTQUFPNEUsd0JBQXdCLENBQUM1RSxLQUFLLEdBQUcsSUFBVCxDQUEvQjtBQUNIOztBQUVELE1BQU0wRixlQUFlLEdBQUc7QUFDcEJDLEVBQUFBLEdBQUcsRUFBRSxLQURlO0FBRXBCQyxFQUFBQSxHQUFHLEVBQUU7QUFGZSxDQUF4Qjs7QUFLQSxTQUFTQyxXQUFULENBQXFCQyxHQUFyQixFQUEwQztBQUN0QyxTQUFPQyxLQUFLLENBQUNDLElBQU4sQ0FBV0YsR0FBWCxFQUNGdEQsR0FERSxDQUNFeUQsQ0FBQyxJQUFJLENBQUNDLE1BQU0sQ0FBQ0MsUUFBUCxDQUFnQkYsQ0FBaEIsRUFBbUIsRUFBbkIsSUFBeUIsR0FBMUIsRUFBK0IvRixRQUEvQixDQUF3QyxFQUF4QyxDQURQLEVBRUZ3QixJQUZFLENBRUcsRUFGSCxDQUFQO0FBR0g7O0FBRU0sU0FBUzBFLGNBQVQsQ0FBd0JDLFlBQXhCLEVBQThDckcsS0FBOUMsRUFBMERzRyxJQUExRCxFQUFxRztBQUN4RyxNQUFJdEcsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBSzJDLFNBQWhDLEVBQTJDO0FBQ3ZDLFdBQU8zQyxLQUFQO0FBQ0g7O0FBQ0QsTUFBSXVHLEdBQUo7QUFDQSxNQUFJVCxHQUFKOztBQUNBLE1BQUksT0FBTzlGLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7QUFDM0J1RyxJQUFBQSxHQUFHLEdBQUd2RyxLQUFLLEdBQUcsQ0FBZDtBQUNBOEYsSUFBQUEsR0FBRyxHQUFJLEtBQUksQ0FBQ1MsR0FBRyxHQUFHLENBQUN2RyxLQUFKLEdBQVlBLEtBQWhCLEVBQXVCRSxRQUF2QixDQUFnQyxFQUFoQyxDQUFvQyxFQUEvQztBQUNILEdBSEQsTUFHTztBQUNILFVBQU1zRyxDQUFDLEdBQUd4RyxLQUFLLENBQUNFLFFBQU4sR0FBaUJ1RyxJQUFqQixFQUFWO0FBQ0FGLElBQUFBLEdBQUcsR0FBR0MsQ0FBQyxDQUFDaEksVUFBRixDQUFhLEdBQWIsQ0FBTjtBQUNBc0gsSUFBQUEsR0FBRyxHQUFJLEtBQUlTLEdBQUcsR0FBR1YsV0FBVyxDQUFDVyxDQUFDLENBQUN2SCxNQUFGLENBQVNvSCxZQUFZLEdBQUcsQ0FBeEIsQ0FBRCxDQUFkLEdBQTZDRyxDQUFDLENBQUN2SCxNQUFGLENBQVNvSCxZQUFULENBQXVCLEVBQWxGO0FBQ0g7O0FBQ0QsUUFBTUssTUFBTSxHQUFJSixJQUFJLElBQUlBLElBQUksQ0FBQ0ksTUFBZCxJQUF5QmhCLGVBQWUsQ0FBQ0MsR0FBeEQ7QUFDQSxTQUFRLEdBQUVZLEdBQUcsR0FBRyxHQUFILEdBQVMsRUFBRyxHQUFHRyxNQUFNLEtBQUtoQixlQUFlLENBQUNDLEdBQTVCLEdBQW1DRyxHQUFuQyxHQUF5Q2EsTUFBTSxDQUFDYixHQUFELENBQU4sQ0FBWTVGLFFBQVosRUFBdUIsRUFBM0Y7QUFDSDs7QUFFTSxTQUFTMEcsY0FBVCxDQUF3QlAsWUFBeEIsRUFBOENyRyxLQUE5QyxFQUFrRTtBQUNyRSxNQUFJQSxLQUFLLEtBQUssSUFBVixJQUFrQkEsS0FBSyxLQUFLMkMsU0FBaEMsRUFBMkM7QUFDdkMsV0FBTzNDLEtBQVA7QUFDSDs7QUFDRCxNQUFJNkcsR0FBSjs7QUFDQSxNQUFJLE9BQU83RyxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzNCLFVBQU13RyxDQUFDLEdBQUd4RyxLQUFLLENBQUN5RyxJQUFOLEVBQVY7QUFDQUksSUFBQUEsR0FBRyxHQUFHTCxDQUFDLENBQUNoSSxVQUFGLENBQWEsR0FBYixJQUFvQixDQUFDbUksTUFBTSxDQUFDSCxDQUFDLENBQUN2SCxNQUFGLENBQVMsQ0FBVCxDQUFELENBQTNCLEdBQTJDMEgsTUFBTSxDQUFDSCxDQUFELENBQXZEO0FBQ0gsR0FIRCxNQUdPO0FBQ0hLLElBQUFBLEdBQUcsR0FBR0YsTUFBTSxDQUFDM0csS0FBRCxDQUFaO0FBQ0g7O0FBQ0QsUUFBTXVHLEdBQUcsR0FBR00sR0FBRyxHQUFHRixNQUFNLENBQUMsQ0FBRCxDQUF4QjtBQUNBLFFBQU1iLEdBQUcsR0FBRyxDQUFDUyxHQUFHLEdBQUcsQ0FBQ00sR0FBSixHQUFVQSxHQUFkLEVBQW1CM0csUUFBbkIsQ0FBNEIsRUFBNUIsQ0FBWjtBQUNBLFFBQU00RyxHQUFHLEdBQUcsQ0FBQ2hCLEdBQUcsQ0FBQzVHLE1BQUosR0FBYSxDQUFkLEVBQWlCZ0IsUUFBakIsQ0FBMEIsRUFBMUIsQ0FBWjtBQUNBLFFBQU02RyxZQUFZLEdBQUdWLFlBQVksR0FBR1MsR0FBRyxDQUFDNUgsTUFBeEM7QUFDQSxRQUFNOEgsTUFBTSxHQUFHRCxZQUFZLEdBQUcsQ0FBZixHQUFvQixHQUFFLElBQUlFLE1BQUosQ0FBV0YsWUFBWCxDQUF5QixHQUFFRCxHQUFJLEVBQXJELEdBQXlEQSxHQUF4RTtBQUNBLFFBQU1JLE1BQU0sR0FBSSxHQUFFRixNQUFPLEdBQUVsQixHQUFJLEVBQS9CO0FBQ0EsU0FBT1MsR0FBRyxHQUFJLElBQUdWLFdBQVcsQ0FBQ3FCLE1BQUQsQ0FBUyxFQUEzQixHQUErQkEsTUFBekM7QUFDSDs7QUFFTSxNQUFNQyxNQUFhLEdBQUc1QyxZQUFZLEVBQWxDOztBQUNBLE1BQU02QyxpQkFBd0IsR0FBRzdDLFlBQVksQ0FBQ0QsQ0FBQyxJQUFJQSxDQUFDLEdBQUdBLENBQUMsQ0FBQ3BFLFFBQUYsR0FBYW1ILFdBQWIsRUFBSCxHQUFnQy9DLENBQXZDLENBQTdDOztBQUNBLE1BQU1nRCxRQUFlLEdBQUcvQyxZQUFZLENBQUNELENBQUMsSUFBSXNDLGNBQWMsQ0FBQyxDQUFELEVBQUl0QyxDQUFKLENBQXBCLENBQXBDOztBQUNBLE1BQU1pRCxRQUFlLEdBQUdoRCxZQUFZLENBQUNELENBQUMsSUFBSXNDLGNBQWMsQ0FBQyxDQUFELEVBQUl0QyxDQUFKLENBQXBCLENBQXBDLEMsQ0FFUDs7OztBQUVPLFNBQVNrRCxPQUFULENBQWlCbkgsTUFBakIsRUFBcUM7QUFDeEMsUUFBTW9ILFFBQVEsR0FBRyxFQUFqQjtBQUNBLE1BQUlDLE9BQU8sR0FBR3JILE1BQWQ7O0FBQ0EsU0FBT3FILE9BQVAsRUFBZ0I7QUFDWixRQUFJLFFBQVFBLE9BQVosRUFBcUI7QUFDakIsWUFBTUMsU0FBUyxHQUFHbEgsTUFBTSxDQUFDbUgsTUFBUCxDQUFjLEVBQWQsRUFBa0JGLE9BQWxCLENBQWxCO0FBQ0EsYUFBT0MsU0FBUyxDQUFDLElBQUQsQ0FBaEI7QUFDQUYsTUFBQUEsUUFBUSxDQUFDMUcsSUFBVCxDQUFjNEcsU0FBZDtBQUNBRCxNQUFBQSxPQUFPLEdBQUdBLE9BQU8sQ0FBQ0csRUFBbEI7QUFDSCxLQUxELE1BS087QUFDSEosTUFBQUEsUUFBUSxDQUFDMUcsSUFBVCxDQUFjMkcsT0FBZDtBQUNBQSxNQUFBQSxPQUFPLEdBQUcsSUFBVjtBQUNIO0FBQ0o7O0FBQ0QsU0FBT0QsUUFBUDtBQUNIOztBQUVNLFNBQVNLLE1BQVQsQ0FBZ0JqSixNQUFoQixFQUE2QzhGLFlBQTdDLEVBQTRFO0FBQy9FLFNBQU87QUFDSDlGLElBQUFBLE1BREc7O0FBRUhnRSxJQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsWUFBTTBILFVBQVUsR0FBR1AsT0FBTyxDQUFDbkgsTUFBRCxDQUFQLENBQWdCbUMsR0FBaEIsQ0FBcUJrRixPQUFELElBQWE7QUFDaEQsZUFBT3RILHdCQUF3QixDQUFDakMsSUFBRCxFQUFPdUosT0FBUCxFQUFnQjdJLE1BQWhCLEVBQXdCLENBQUNpQyxTQUFELEVBQVkzQyxJQUFaLEVBQWtCeUMsU0FBbEIsRUFBNkJDLFdBQTdCLEtBQTZDO0FBQ2hHLGdCQUFNbUgsU0FBUyxHQUFHckQsWUFBWSxJQUFLL0QsU0FBUyxLQUFLLElBQS9CLEdBQXVDLE1BQXZDLEdBQWdEQSxTQUFsRTtBQUNBLGlCQUFPRSxTQUFTLENBQUMrQixlQUFWLENBQTBCYixNQUExQixFQUFrQy9ELFdBQVcsQ0FBQ0UsSUFBRCxFQUFPNkosU0FBUCxDQUE3QyxFQUFnRW5ILFdBQWhFLENBQVA7QUFDSCxTQUg4QixDQUEvQjtBQUlILE9BTGtCLENBQW5CO0FBTUEsYUFBUWtILFVBQVUsQ0FBQzdJLE1BQVgsR0FBb0IsQ0FBckIsR0FBMkIsSUFBRzZJLFVBQVUsQ0FBQ3JHLElBQVgsQ0FBZ0IsUUFBaEIsQ0FBMEIsR0FBeEQsR0FBNkRxRyxVQUFVLENBQUMsQ0FBRCxDQUE5RTtBQUNILEtBVkU7O0FBV0h6RyxJQUFBQSxnQkFBZ0IsQ0FBQ25ELElBQUQsRUFBZXVHLEdBQWYsRUFBb0Q7QUFDaEUsWUFBTXpFLElBQUksR0FBR3lFLEdBQUcsQ0FBQ3pFLElBQUosQ0FBU0QsS0FBdEI7QUFDQSxZQUFNa0IsV0FBVyxHQUFHLElBQUlwQyxHQUFKLEVBQXBCO0FBQ0FtQyxNQUFBQSx3QkFBd0IsQ0FDcEJDLFdBRG9CLEVBRW5CLEdBQUUvQyxJQUFLLElBQUc4QixJQUFLLEVBRkksRUFHbkJ5RSxHQUFHLENBQUN1RCxZQUFKLElBQW9CdkQsR0FBRyxDQUFDdUQsWUFBSixDQUFpQkMsVUFBdEMsSUFBcUQsRUFIakMsRUFJcEJySixNQUpvQixDQUF4QjtBQU1BLGFBQU87QUFDSG9CLFFBQUFBLElBREc7QUFFSHNCLFFBQUFBLFVBQVUsRUFBRyxLQUFJcEQsSUFBSyxJQUFHOEIsSUFBSyxPQUFNdUIsd0JBQXdCLENBQUNOLFdBQUQsQ0FBYztBQUZ2RSxPQUFQO0FBSUgsS0F4QkU7O0FBeUJIOEIsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixVQUFJLENBQUNMLEtBQUwsRUFBWTtBQUNSLGVBQU8sS0FBUDtBQUNIOztBQUNELFlBQU0rSCxVQUFVLEdBQUdQLE9BQU8sQ0FBQ25ILE1BQUQsQ0FBMUI7O0FBQ0EsV0FBSyxJQUFJOEgsQ0FBQyxHQUFHLENBQWIsRUFBZ0JBLENBQUMsR0FBR0osVUFBVSxDQUFDN0ksTUFBL0IsRUFBdUNpSixDQUFDLElBQUksQ0FBNUMsRUFBK0M7QUFDM0MsWUFBSXhHLFVBQVUsQ0FBQzNCLEtBQUQsRUFBUStILFVBQVUsQ0FBQ0ksQ0FBRCxDQUFsQixFQUF1QnRKLE1BQXZCLEVBQStCLENBQUNpQyxTQUFELEVBQVlkLEtBQVosRUFBbUJZLFNBQW5CLEVBQThCQyxXQUE5QixLQUE4QztBQUN2RixnQkFBTW1ILFNBQVMsR0FBR3JELFlBQVksSUFBSy9ELFNBQVMsS0FBSyxJQUEvQixHQUF1QyxNQUF2QyxHQUFnREEsU0FBbEU7QUFDQSxpQkFBT0UsU0FBUyxDQUFDa0MsSUFBVixDQUFlaEQsS0FBZixFQUFzQkEsS0FBSyxDQUFDZ0ksU0FBRCxDQUEzQixFQUF3Q25ILFdBQXhDLENBQVA7QUFDSCxTQUhhLENBQWQsRUFHSTtBQUNBLGlCQUFPLElBQVA7QUFDSDtBQUNKOztBQUNELGFBQU8sS0FBUDtBQUNIOztBQXZDRSxHQUFQO0FBeUNILEMsQ0FFRDs7O0FBRUEsU0FBU3VILHNCQUFULENBQWdDQyxRQUFoQyxFQUFpRHJHLE1BQWpELEVBQWtFN0QsSUFBbEUsRUFBZ0ZrQyxNQUFoRixFQUFxRztBQUNqRyxNQUFJaUksbUJBQUo7QUFDQSxRQUFNekksV0FBVyxHQUFHbUMsTUFBTSxDQUFDbkMsV0FBM0I7O0FBQ0EsTUFBSUEsV0FBSixFQUFpQjtBQUNiLFVBQU0wSSxjQUFjLEdBQUcxSSxXQUFXLENBQUNqQixVQUFuQztBQUNBaUIsSUFBQUEsV0FBVyxDQUFDakIsVUFBWixHQUEwQixHQUFFaUIsV0FBVyxDQUFDakIsVUFBVyxHQUFFVCxJQUFLLEtBQTFEO0FBQ0FtSyxJQUFBQSxtQkFBbUIsR0FBR0QsUUFBUSxDQUFDeEYsZUFBVCxDQUF5QmIsTUFBekIsRUFBaUMsU0FBakMsRUFBNEMzQixNQUE1QyxDQUF0QjtBQUNBUixJQUFBQSxXQUFXLENBQUNqQixVQUFaLEdBQXlCMkosY0FBekI7QUFDSCxHQUxELE1BS087QUFDSEQsSUFBQUEsbUJBQW1CLEdBQUdELFFBQVEsQ0FBQ3hGLGVBQVQsQ0FBeUJiLE1BQXpCLEVBQWlDLFNBQWpDLEVBQTRDM0IsTUFBNUMsQ0FBdEI7QUFDSDs7QUFDRCxTQUFPaUksbUJBQVA7QUFDSDs7QUFFRCxTQUFTRSxvQkFBVCxDQUE4QnZDLENBQTlCLEVBQWtEO0FBQzlDLE1BQUlBLENBQUMsQ0FBQy9HLE1BQUYsS0FBYSxDQUFqQixFQUFvQjtBQUNoQixXQUFPLEtBQVA7QUFDSDs7QUFDRCxTQUFRK0csQ0FBQyxJQUFJLEdBQUwsSUFBWUEsQ0FBQyxJQUFJLEdBQWxCLElBQ0NBLENBQUMsSUFBSSxHQUFMLElBQVlBLENBQUMsSUFBSSxHQURsQixJQUVDQSxDQUFDLElBQUksR0FBTCxJQUFZQSxDQUFDLElBQUksR0FGbEIsSUFHQ0EsQ0FBQyxLQUFLLEdBQU4sSUFBYUEsQ0FBQyxLQUFLLEdBQW5CLElBQTBCQSxDQUFDLEtBQUssR0FBaEMsSUFBdUNBLENBQUMsS0FBSyxHQUE3QyxJQUFvREEsQ0FBQyxLQUFLLEdBSGxFO0FBSUg7O0FBRUQsU0FBU3dDLFdBQVQsQ0FBcUJ6RixJQUFyQixFQUE0QztBQUN4QyxPQUFLLElBQUltRixDQUFDLEdBQUcsQ0FBYixFQUFnQkEsQ0FBQyxHQUFHbkYsSUFBSSxDQUFDOUQsTUFBekIsRUFBaUNpSixDQUFDLElBQUksQ0FBdEMsRUFBeUM7QUFDckMsUUFBSSxDQUFDSyxvQkFBb0IsQ0FBQ3hGLElBQUksQ0FBQ21GLENBQUQsQ0FBTCxDQUF6QixFQUFvQztBQUNoQyxhQUFPLEtBQVA7QUFDSDtBQUNKOztBQUNELFNBQU8sSUFBUDtBQUNIOztBQUVELFNBQVNPLG1CQUFULENBQTZCdkssSUFBN0IsRUFBMkNtSyxtQkFBM0MsRUFBd0V0RyxNQUF4RSxFQUFrRztBQUM5RixXQUFTMkcsV0FBVCxDQUFxQjlGLGVBQXJCLEVBQThDK0YsVUFBOUMsRUFBMkU7QUFDdkUsVUFBTTFHLFNBQVMsR0FBSSxLQUFJMEcsVUFBVSxHQUFHLENBQUUsRUFBdEM7QUFDQSxVQUFNQyxNQUFNLEdBQUksT0FBTTNHLFNBQVUsRUFBaEM7O0FBQ0EsUUFBSVcsZUFBZSxLQUFNLFVBQVNnRyxNQUFPLEVBQXpDLEVBQTRDO0FBQ3hDLGFBQVEsR0FBRTNHLFNBQVUsT0FBTS9ELElBQUssS0FBL0I7QUFDSDs7QUFDRCxRQUFJMEUsZUFBZSxDQUFDckUsVUFBaEIsQ0FBMkIsVUFBM0IsS0FBMENxRSxlQUFlLENBQUN4RSxRQUFoQixDQUF5QndLLE1BQXpCLENBQTlDLEVBQWdGO0FBQzVFLFlBQU1DLFNBQVMsR0FBR2pHLGVBQWUsQ0FBQ3ZFLEtBQWhCLENBQXNCLFdBQVdZLE1BQWpDLEVBQXlDLENBQUMySixNQUFNLENBQUMzSixNQUFqRCxDQUFsQjs7QUFDQSxVQUFJdUosV0FBVyxDQUFDSyxTQUFELENBQWYsRUFBNEI7QUFDeEIsZUFBUSxHQUFFNUcsU0FBVSxPQUFNL0QsSUFBSyxPQUFNMkssU0FBVSxFQUEvQztBQUNIO0FBQ0o7O0FBQ0QsV0FBTyxJQUFQO0FBQ0g7O0FBRUQsTUFBSSxDQUFDUixtQkFBbUIsQ0FBQzlKLFVBQXBCLENBQStCLEdBQS9CLENBQUQsSUFBd0MsQ0FBQzhKLG1CQUFtQixDQUFDakssUUFBcEIsQ0FBNkIsR0FBN0IsQ0FBN0MsRUFBZ0Y7QUFDNUUsV0FBT3NLLFdBQVcsQ0FBQ0wsbUJBQUQsRUFBc0J0RyxNQUFNLENBQUNyQyxLQUFQLEdBQWUsQ0FBckMsQ0FBbEI7QUFDSDs7QUFDRCxRQUFNb0osb0JBQW9CLEdBQUdULG1CQUFtQixDQUFDaEssS0FBcEIsQ0FBMEIsQ0FBMUIsRUFBNkIsQ0FBQyxDQUE5QixFQUFpQzBLLEtBQWpDLENBQXVDLFFBQXZDLENBQTdCOztBQUNBLE1BQUlELG9CQUFvQixDQUFDN0osTUFBckIsS0FBZ0MsQ0FBcEMsRUFBdUM7QUFDbkMsV0FBT3lKLFdBQVcsQ0FBQ0wsbUJBQUQsRUFBc0J0RyxNQUFNLENBQUNyQyxLQUFQLEdBQWUsQ0FBckMsQ0FBbEI7QUFDSDs7QUFDRCxRQUFNc0osY0FBYyxHQUFHRixvQkFBb0IsQ0FDdEN2RyxHQURrQixDQUNkLENBQUM4QixDQUFELEVBQUk2RCxDQUFKLEtBQVVRLFdBQVcsQ0FBQ3JFLENBQUQsRUFBSXRDLE1BQU0sQ0FBQ3JDLEtBQVAsR0FBZW9KLG9CQUFvQixDQUFDN0osTUFBcEMsR0FBNkNpSixDQUFqRCxDQURQLEVBRWxCOUgsTUFGa0IsQ0FFWGlFLENBQUMsSUFBSUEsQ0FBQyxLQUFLLElBRkEsQ0FBdkI7O0FBR0EsTUFBSTJFLGNBQWMsQ0FBQy9KLE1BQWYsS0FBMEI2SixvQkFBb0IsQ0FBQzdKLE1BQW5ELEVBQTJEO0FBQ3ZELFdBQU8sSUFBUDtBQUNIOztBQUNELFNBQVEsSUFBRytKLGNBQWMsQ0FBQ3ZILElBQWYsQ0FBb0IsUUFBcEIsQ0FBOEIsR0FBekM7QUFDSDs7QUFFTSxTQUFTd0gsS0FBVCxDQUFlQyxlQUFmLEVBQW9EO0FBQ3ZELE1BQUlDLFFBQWdCLEdBQUcsSUFBdkI7QUFDQSxRQUFNQyxHQUFHLEdBQUc7QUFDUkMsSUFBQUEsR0FBRyxFQUFFO0FBQ0R6RyxNQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsY0FBTWdJLFFBQVEsR0FBR2UsUUFBUSxLQUFLQSxRQUFRLEdBQUdELGVBQWUsRUFBL0IsQ0FBekI7QUFDQSxjQUFNYixtQkFBbUIsR0FBR0Ysc0JBQXNCLENBQUNDLFFBQUQsRUFBV3JHLE1BQVgsRUFBbUI3RCxJQUFuQixFQUF5QmtDLE1BQXpCLENBQWxEO0FBQ0EsZUFBUSxVQUFTbEMsSUFBSyxhQUFZbUssbUJBQW9CLGdCQUFlbkssSUFBSyxHQUExRTtBQUNILE9BTEE7O0FBTURtRCxNQUFBQSxnQkFBZ0IsQ0FBQ3dCLEtBQUQsRUFBZ0JDLElBQWhCLEVBQXNEO0FBQ2xFLGNBQU1oRixlQUFOO0FBQ0gsT0FSQTs7QUFTRGlGLE1BQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTakQsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsY0FBTWdJLFFBQVEsR0FBR2UsUUFBUSxLQUFLQSxRQUFRLEdBQUdELGVBQWUsRUFBL0IsQ0FBekI7QUFDQSxjQUFNSSxXQUFXLEdBQUd2SixLQUFLLENBQUN3SixTQUFOLENBQWdCbEYsQ0FBQyxJQUFJLENBQUMrRCxRQUFRLENBQUNyRixJQUFULENBQWNDLE1BQWQsRUFBc0JxQixDQUF0QixFQUF5QmpFLE1BQXpCLENBQXRCLENBQXBCO0FBQ0EsZUFBT2tKLFdBQVcsR0FBRyxDQUFyQjtBQUNIOztBQWJBLEtBREc7QUFnQlJFLElBQUFBLEdBQUcsRUFBRTtBQUNENUcsTUFBQUEsZUFBZSxDQUFDYixNQUFELEVBQVM3RCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ2xDLGNBQU1nSSxRQUFRLEdBQUdlLFFBQVEsS0FBS0EsUUFBUSxHQUFHRCxlQUFlLEVBQS9CLENBQXpCO0FBQ0EsY0FBTWIsbUJBQW1CLEdBQUdGLHNCQUFzQixDQUFDQyxRQUFELEVBQVdyRyxNQUFYLEVBQW1CN0QsSUFBbkIsRUFBeUJrQyxNQUF6QixDQUFsRDtBQUNBLGNBQU1xSix3QkFBd0IsR0FBR2hCLG1CQUFtQixDQUFDdkssSUFBRCxFQUFPbUssbUJBQVAsRUFBNEJ0RyxNQUE1QixDQUFwRDs7QUFDQSxZQUFJMEgsd0JBQUosRUFBOEI7QUFDMUIsaUJBQU9BLHdCQUFQO0FBQ0g7O0FBQ0QsZUFBUSxVQUFTdkwsSUFBSyxhQUFZbUssbUJBQW9CLFFBQXREO0FBQ0gsT0FUQTs7QUFVRGhILE1BQUFBLGdCQUFnQixDQUFDd0IsS0FBRCxFQUFnQkMsSUFBaEIsRUFBc0Q7QUFDbEUsY0FBTWhGLGVBQU47QUFDSCxPQVpBOztBQWFEaUYsTUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixjQUFNZ0ksUUFBUSxHQUFHZSxRQUFRLEtBQUtBLFFBQVEsR0FBR0QsZUFBZSxFQUEvQixDQUF6QjtBQUNBLGNBQU1RLGNBQWMsR0FBRzNKLEtBQUssQ0FBQ3dKLFNBQU4sQ0FBZ0JsRixDQUFDLElBQUkrRCxRQUFRLENBQUNyRixJQUFULENBQWNDLE1BQWQsRUFBc0JxQixDQUF0QixFQUF5QmpFLE1BQXpCLENBQXJCLENBQXZCO0FBQ0EsZUFBT3NKLGNBQWMsSUFBSSxDQUF6QjtBQUNIOztBQWpCQTtBQWhCRyxHQUFaO0FBb0NBLFNBQU87QUFDSDlHLElBQUFBLGVBQWUsQ0FBQ2IsTUFBRCxFQUFTN0QsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNsQyxhQUFPRCx3QkFBd0IsQ0FBQ2pDLElBQUQsRUFBT2tDLE1BQVAsRUFBZWdKLEdBQWYsRUFBb0IsQ0FBQ3JLLEVBQUQsRUFBS2IsSUFBTCxFQUFXeUMsU0FBWCxFQUFzQkMsV0FBdEIsS0FBc0M7QUFDckYsZUFBTzdCLEVBQUUsQ0FBQzZELGVBQUgsQ0FBbUJiLE1BQW5CLEVBQTJCN0QsSUFBM0IsRUFBaUMwQyxXQUFqQyxDQUFQO0FBQ0gsT0FGOEIsQ0FBL0I7QUFHSCxLQUxFOztBQU1IUyxJQUFBQSxnQkFBZ0IsQ0FBQ25ELElBQUQsRUFBZXVHLEdBQWYsRUFBb0Q7QUFDaEUsWUFBTXpFLElBQUksR0FBR3lFLEdBQUcsQ0FBQ3pFLElBQUosQ0FBU0QsS0FBdEI7QUFDQSxZQUFNNEosY0FBYyxHQUFHbEYsR0FBRyxDQUFDdUQsWUFBSixJQUFvQnZELEdBQUcsQ0FBQ3VELFlBQUosQ0FBaUJDLFVBQTVEO0FBQ0EsVUFBSTNHLFVBQUo7O0FBQ0EsVUFBSXFJLGNBQWMsSUFBSUEsY0FBYyxDQUFDMUssTUFBZixHQUF3QixDQUE5QyxFQUFpRDtBQUM3QyxjQUFNbUosUUFBUSxHQUFHZSxRQUFRLEtBQUtBLFFBQVEsR0FBR0QsZUFBZSxFQUEvQixDQUF6QjtBQUNBLGNBQU1MLFNBQVMsR0FBSSxHQUFFM0ssSUFBSyxJQUFHOEIsSUFBSyxFQUFsQztBQUNBLGNBQU00SixLQUFLLEdBQUdmLFNBQVMsQ0FBQ0UsS0FBVixDQUFnQixHQUFoQixFQUFxQnRILElBQXJCLENBQTBCLElBQTFCLENBQWQ7QUFDQSxjQUFNUixXQUFXLEdBQUcsSUFBSXBDLEdBQUosRUFBcEI7QUFDQW1DLFFBQUFBLHdCQUF3QixDQUFDQyxXQUFELEVBQWMySSxLQUFkLEVBQXFCRCxjQUFyQixFQUFxQ3ZCLFFBQVEsQ0FBQ3hKLE1BQVQsSUFBbUIsRUFBeEQsQ0FBeEI7QUFDQSxjQUFNaUwsY0FBYyxHQUFHdEksd0JBQXdCLENBQUNOLFdBQUQsQ0FBL0M7QUFDQUssUUFBQUEsVUFBVSxHQUFJLEtBQUl1SCxTQUFVLGFBQVllLEtBQU0sT0FBTWYsU0FBVSxpQkFBZ0JnQixjQUFlLE1BQTdGO0FBQ0gsT0FSRCxNQVFPO0FBQ0h2SSxRQUFBQSxVQUFVLEdBQUksR0FBRXBELElBQUssSUFBRzhCLElBQUssRUFBN0I7QUFDSDs7QUFDRCxhQUFPO0FBQ0hBLFFBQUFBLElBREc7QUFFSHNCLFFBQUFBO0FBRkcsT0FBUDtBQUlILEtBekJFOztBQTBCSHlCLElBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTakQsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsVUFBSSxDQUFDTCxLQUFMLEVBQVk7QUFDUixlQUFPLEtBQVA7QUFDSDs7QUFDRCxhQUFPMkIsVUFBVSxDQUFDM0IsS0FBRCxFQUFRSyxNQUFSLEVBQWdCZ0osR0FBaEIsRUFBcUIsQ0FBQ3JLLEVBQUQsRUFBS2dCLEtBQUwsRUFBWVksU0FBWixFQUF1QkMsV0FBdkIsS0FBdUM7QUFDekUsZUFBTzdCLEVBQUUsQ0FBQ2dFLElBQUgsQ0FBUUMsTUFBUixFQUFnQmpELEtBQWhCLEVBQXVCYSxXQUF2QixDQUFQO0FBQ0gsT0FGZ0IsQ0FBakI7QUFHSDs7QUFqQ0UsR0FBUDtBQW1DSCxDLENBRUQ7OztBQUVBLFNBQVNrSixrQkFBVCxDQUE0Qm5LLE1BQTVCLEVBQStFO0FBQzNFLFFBQU1vSyxLQUEwQixHQUFHLElBQUlsTCxHQUFKLEVBQW5DO0FBQ0EyQixFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZWQsTUFBZixFQUF1QmUsT0FBdkIsQ0FBK0IsQ0FBQyxDQUFDVixJQUFELEVBQU9ELEtBQVAsQ0FBRCxLQUFtQjtBQUM5Q2dLLElBQUFBLEtBQUssQ0FBQ3pLLEdBQU4sQ0FBVTJHLE1BQU0sQ0FBQ0MsUUFBUCxDQUFpQm5HLEtBQWpCLENBQVYsRUFBeUNDLElBQXpDO0FBQ0gsR0FGRDtBQUdBLFNBQU8rSixLQUFQO0FBQ0g7O0FBRU0sU0FBU0MsUUFBVCxDQUFrQkMsT0FBbEIsRUFBbUN0SyxNQUFuQyxFQUF3RTtBQUMzRSxRQUFNdUssWUFBWSxHQUFJbEssSUFBRCxJQUFVO0FBQzNCLFFBQUlELEtBQUssR0FBR0osTUFBTSxDQUFDSyxJQUFELENBQWxCOztBQUNBLFFBQUlELEtBQUssS0FBSzJDLFNBQWQsRUFBeUI7QUFDckIsWUFBTSxJQUFJM0UsS0FBSixDQUFXLGtCQUFpQmlDLElBQUssU0FBUWlLLE9BQVEsT0FBakQsQ0FBTjtBQUNIOztBQUNELFdBQU9sSyxLQUFQO0FBQ0gsR0FORDs7QUFRQSxTQUFPO0FBQ0g2QyxJQUFBQSxlQUFlLENBQUNiLE1BQUQsRUFBUzdELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDbEMsWUFBTStKLE9BQU8sR0FBR2pNLElBQUksQ0FBQzZLLEtBQUwsQ0FBVyxHQUFYLEVBQWdCMUssS0FBaEIsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBQyxDQUExQixFQUE2QitMLE1BQTdCLENBQW9DSCxPQUFwQyxFQUE2Q3hJLElBQTdDLENBQWtELEdBQWxELENBQWhCO0FBQ0EsYUFBT3RCLHdCQUF3QixDQUFDZ0ssT0FBRCxFQUFVL0osTUFBVixFQUFrQnFELFNBQWxCLEVBQTZCLENBQUMxRSxFQUFELEVBQUtiLElBQUwsRUFBV3lDLFNBQVgsRUFBc0JDLFdBQXRCLEtBQXNDO0FBQzlGLGNBQU11SSxRQUFRLEdBQUlwSyxFQUFFLEtBQUswRSxTQUFTLENBQUNPLEVBQWpCLElBQXVCakYsRUFBRSxLQUFLMEUsU0FBUyxDQUFDUSxLQUF6QyxHQUNYckQsV0FBVyxDQUFDMkIsR0FBWixDQUFnQjJILFlBQWhCLENBRFcsR0FFWEEsWUFBWSxDQUFDdEosV0FBRCxDQUZsQjtBQUdBLGVBQU83QixFQUFFLENBQUM2RCxlQUFILENBQW1CYixNQUFuQixFQUEyQjdELElBQTNCLEVBQWlDaUwsUUFBakMsQ0FBUDtBQUNILE9BTDhCLENBQS9CO0FBTUgsS0FURTs7QUFVSDlILElBQUFBLGdCQUFnQixDQUFDbkQsSUFBRCxFQUFlNEUsSUFBZixFQUFnRDtBQUM1RCxhQUFPO0FBQ0g5QyxRQUFBQSxJQUFJLEVBQUVpSyxPQURIO0FBRUgzSSxRQUFBQSxVQUFVLEVBQUcsR0FBRXBELElBQUssSUFBRytMLE9BQVE7QUFGNUIsT0FBUDtBQUlILEtBZkU7O0FBZ0JIbEgsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixhQUFPc0IsVUFBVSxDQUFDM0IsS0FBRCxFQUFRSyxNQUFSLEVBQWdCcUQsU0FBaEIsRUFBMkIsQ0FBQzFFLEVBQUQsRUFBS2dCLEtBQUwsRUFBWVksU0FBWixFQUF1QkMsV0FBdkIsS0FBdUM7QUFDL0UsY0FBTXVJLFFBQVEsR0FBSXBLLEVBQUUsS0FBSzBFLFNBQVMsQ0FBQ08sRUFBakIsSUFBdUJqRixFQUFFLEtBQUswRSxTQUFTLENBQUNRLEtBQXpDLEdBQ1hyRCxXQUFXLENBQUMyQixHQUFaLENBQWdCMkgsWUFBaEIsQ0FEVyxHQUVYQSxZQUFZLENBQUN0SixXQUFELENBRmxCO0FBR0EsZUFBTzdCLEVBQUUsQ0FBQ2dFLElBQUgsQ0FBUUMsTUFBUixFQUFnQkEsTUFBTSxDQUFDaUgsT0FBRCxDQUF0QixFQUFpQ2QsUUFBakMsQ0FBUDtBQUNILE9BTGdCLENBQWpCO0FBTUg7O0FBdkJFLEdBQVA7QUF5Qkg7O0FBRU0sU0FBU2tCLHNCQUFULENBQWdDSixPQUFoQyxFQUFpRHRLLE1BQWpELEVBQW9HO0FBQ3ZHLFFBQU1vSyxLQUFLLEdBQUdELGtCQUFrQixDQUFDbkssTUFBRCxDQUFoQztBQUNBLFNBQVFxRCxNQUFELElBQVk7QUFDZixVQUFNakQsS0FBSyxHQUFHaUQsTUFBTSxDQUFDaUgsT0FBRCxDQUFwQjtBQUNBLFVBQU1qSyxJQUFJLEdBQUcrSixLQUFLLENBQUM1SyxHQUFOLENBQVVZLEtBQVYsQ0FBYjtBQUNBLFdBQU9DLElBQUksS0FBSzBDLFNBQVQsR0FBcUIxQyxJQUFyQixHQUE0QixJQUFuQztBQUNILEdBSkQ7QUFLSCxDLENBRUQ7OztBQUVPLFNBQVNzSyxlQUFULENBQXlCTCxPQUF6QixFQUFpRDtBQUNwRCxTQUFPO0FBQ0hySCxJQUFBQSxlQUFlLENBQUMySCxPQUFELEVBQVUxSCxLQUFWLEVBQWlCMkgsT0FBakIsRUFBMEI7QUFDckMsYUFBTyxPQUFQO0FBQ0gsS0FIRTs7QUFJSG5KLElBQUFBLGdCQUFnQixDQUFDbkQsSUFBRCxFQUFlNEUsSUFBZixFQUE2QjtBQUN6QyxhQUFPO0FBQ0g5QyxRQUFBQSxJQUFJLEVBQUVpSyxPQURIO0FBRUgzSSxRQUFBQSxVQUFVLEVBQUcsR0FBRXBELElBQUssSUFBRytMLE9BQVE7QUFGNUIsT0FBUDtBQUlILEtBVEU7O0FBVUhsSCxJQUFBQSxJQUFJLENBQUMwSCxPQUFELEVBQVVDLE1BQVYsRUFBa0JGLE9BQWxCLEVBQTJCO0FBQzNCLGFBQU8sS0FBUDtBQUNIOztBQVpFLEdBQVA7QUFjSCxDLENBR0Q7OztBQUVPLFNBQVMvSSxJQUFULENBQWN3SSxPQUFkLEVBQStCVSxRQUEvQixFQUFpREMsYUFBakQsRUFBd0VDLGNBQXhFLEVBQTRHO0FBQy9HLE1BQUkxQixRQUFnQixHQUFHLElBQXZCO0FBQ0EsU0FBTztBQUNIdkcsSUFBQUEsZUFBZSxDQUFDYixNQUFELEVBQVM3RCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ2xDLFlBQU0wSyxPQUFPLEdBQUczQixRQUFRLEtBQUtBLFFBQVEsR0FBRzBCLGNBQWMsRUFBOUIsQ0FBeEI7QUFDQSxZQUFNVixPQUFPLEdBQUdqTSxJQUFJLENBQUM2SyxLQUFMLENBQVcsR0FBWCxFQUFnQjFLLEtBQWhCLENBQXNCLENBQXRCLEVBQXlCLENBQUMsQ0FBMUIsRUFBNkIrTCxNQUE3QixDQUFvQ0gsT0FBcEMsRUFBNkN4SSxJQUE3QyxDQUFrRCxHQUFsRCxDQUFoQjtBQUNBLFlBQU1tSSxLQUFLLEdBQUksR0FBRU8sT0FBTyxDQUFDWSxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLENBQTBCLEVBQTNDO0FBQ0EsWUFBTUMsa0JBQWtCLEdBQUdGLE9BQU8sQ0FBQ2xJLGVBQVIsQ0FBd0JiLE1BQXhCLEVBQWdDNkgsS0FBaEMsRUFBdUN4SixNQUF2QyxDQUEzQjtBQUNBLGFBQVE7QUFDcEI7QUFDQSwwQkFBMEJ3SixLQUFNLE9BQU1nQixhQUFjO0FBQ3BELDhCQUE4QmhCLEtBQU0sWUFBV08sT0FBUSxVQUFTYSxrQkFBbUI7QUFDbkY7QUFDQTtBQUNBLHNCQU5ZO0FBT0gsS0FiRTs7QUFjSDNKLElBQUFBLGdCQUFnQixDQUFDbkQsSUFBRCxFQUFlNEUsSUFBZixFQUFnRDtBQUM1RCxZQUFNOUMsSUFBSSxHQUFHaUssT0FBTyxLQUFLLElBQVosR0FBbUIsTUFBbkIsR0FBNEJBLE9BQXpDO0FBQ0EsYUFBTztBQUNIakssUUFBQUEsSUFERztBQUVIc0IsUUFBQUEsVUFBVSxFQUFHLEdBQUVwRCxJQUFLLElBQUc4QixJQUFLO0FBRnpCLE9BQVA7QUFJSCxLQXBCRTs7QUFxQkgrQyxJQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU2pELEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFlBQU0wSyxPQUFPLEdBQUczQixRQUFRLEtBQUtBLFFBQVEsR0FBRzBCLGNBQWMsRUFBOUIsQ0FBeEI7QUFDQSxhQUFPQyxPQUFPLENBQUMvSCxJQUFSLENBQWFDLE1BQWIsRUFBcUJqRCxLQUFyQixFQUE0QkssTUFBNUIsQ0FBUDtBQUNIOztBQXhCRSxHQUFQO0FBMEJIOztBQUVNLFNBQVM2SyxTQUFULENBQ0hoQixPQURHLEVBRUhVLFFBRkcsRUFHSEMsYUFIRyxFQUlIQyxjQUpHLEVBS0U7QUFDTCxNQUFJMUIsUUFBZ0IsR0FBRyxJQUF2QjtBQUNBLFNBQU87QUFDSHZHLElBQUFBLGVBQWUsQ0FBQ2IsTUFBRCxFQUFTN0QsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNsQyxZQUFNMEssT0FBTyxHQUFHM0IsUUFBUSxLQUFLQSxRQUFRLEdBQUcwQixjQUFjLEVBQTlCLENBQXhCO0FBQ0EsWUFBTUssU0FBUyxHQUFHOUssTUFBTSxDQUFDaUosR0FBUCxJQUFjakosTUFBTSxDQUFDb0osR0FBdkM7QUFDQSxZQUFNSCxHQUFHLEdBQUcsQ0FBQyxDQUFDakosTUFBTSxDQUFDaUosR0FBckI7QUFDQSxZQUFNYyxPQUFPLEdBQUdqTSxJQUFJLENBQUM2SyxLQUFMLENBQVcsR0FBWCxFQUFnQjFLLEtBQWhCLENBQXNCLENBQXRCLEVBQXlCLENBQUMsQ0FBMUIsRUFBNkIrTCxNQUE3QixDQUFvQ0gsT0FBcEMsRUFBNkN4SSxJQUE3QyxDQUFrRCxHQUFsRCxDQUFoQjtBQUNBLFlBQU1tSSxLQUFLLEdBQUksR0FBRU8sT0FBTyxDQUFDWSxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLENBQTBCLEVBQTNDO0FBQ0EsWUFBTUMsa0JBQWtCLEdBQUdGLE9BQU8sQ0FBQ2xJLGVBQVIsQ0FBd0JiLE1BQXhCLEVBQWdDNkgsS0FBaEMsRUFBdUNzQixTQUF2QyxDQUEzQjtBQUNBLGFBQVE7QUFDcEIsMEJBQTBCZixPQUFRO0FBQ2xDO0FBQ0EsMEJBQTBCUCxLQUFNLE9BQU1nQixhQUFjO0FBQ3BELDhCQUE4QmhCLEtBQU0sWUFBV08sT0FBUSxVQUFTYSxrQkFBbUI7QUFDbkYsc0JBQXNCLENBQUMzQixHQUFELEdBQU8sU0FBUCxHQUFtQixFQUFHO0FBQzVDO0FBQ0Esb0JBQW9CQSxHQUFHLEdBQUksYUFBWWMsT0FBUSxHQUF4QixHQUE2QixLQUFNLEdBUDlDO0FBUUgsS0FoQkU7O0FBaUJIOUksSUFBQUEsZ0JBQWdCLENBQUNuRCxJQUFELEVBQWU0RSxJQUFmLEVBQWdEO0FBQzVELGFBQU87QUFDSDlDLFFBQUFBLElBQUksRUFBRWlLLE9BREg7QUFFSDNJLFFBQUFBLFVBQVUsRUFBRyxHQUFFcEQsSUFBSyxJQUFHK0wsT0FBUTtBQUY1QixPQUFQO0FBSUgsS0F0QkU7O0FBdUJIbEgsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNqRCxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixZQUFNMEssT0FBTyxHQUFHM0IsUUFBUSxLQUFLQSxRQUFRLEdBQUcwQixjQUFjLEVBQTlCLENBQXhCO0FBQ0EsYUFBT0MsT0FBTyxDQUFDL0gsSUFBUixDQUFhQyxNQUFiLEVBQXFCakQsS0FBckIsRUFBNEJLLE1BQTVCLENBQVA7QUFDSDs7QUExQkUsR0FBUDtBQTRCSDs7QUFXTSxTQUFTK0ssaUJBQVQsQ0FBMkJuRCxZQUEzQixFQUF5RG9ELG9CQUF6RCxFQUF5RztBQUM1RyxRQUFNeE0sTUFBd0IsR0FBRyxFQUFqQztBQUNBLFFBQU1xSixVQUFVLEdBQUdELFlBQVksSUFBSUEsWUFBWSxDQUFDQyxVQUFoRDs7QUFDQSxNQUFJQSxVQUFKLEVBQWdCO0FBQ1osU0FBSyxNQUFNb0QsSUFBWCxJQUFtQnBELFVBQW5CLEVBQStCO0FBQzNCLFlBQU1qSSxJQUFJLEdBQUlxTCxJQUFJLENBQUNyTCxJQUFMLElBQWFxTCxJQUFJLENBQUNyTCxJQUFMLENBQVVELEtBQXhCLElBQWtDLEVBQS9DOztBQUNBLFVBQUlDLElBQUosRUFBVTtBQUNOLGNBQU1FLEtBQXFCLEdBQUc7QUFDMUJGLFVBQUFBLElBRDBCO0FBRTFCc0wsVUFBQUEsU0FBUyxFQUFFSCxpQkFBaUIsQ0FBQ0UsSUFBSSxDQUFDckQsWUFBTixFQUFvQixFQUFwQjtBQUZGLFNBQTlCOztBQUlBLFlBQUlvRCxvQkFBb0IsS0FBSyxFQUF6QixJQUErQmxMLEtBQUssQ0FBQ0YsSUFBTixLQUFlb0wsb0JBQWxELEVBQXdFO0FBQ3BFLGlCQUFPbEwsS0FBSyxDQUFDb0wsU0FBYjtBQUNIOztBQUNEMU0sUUFBQUEsTUFBTSxDQUFDa0MsSUFBUCxDQUFZWixLQUFaO0FBQ0g7QUFDSjtBQUNKOztBQUNELFNBQU90QixNQUFQO0FBQ0g7O0FBRU0sU0FBUzJNLGlCQUFULENBQTJCRCxTQUEzQixFQUFnRTtBQUNuRSxTQUFPQSxTQUFTLENBQ1hsTCxNQURFLENBQ0tpRSxDQUFDLElBQUlBLENBQUMsQ0FBQ3JFLElBQUYsS0FBVyxZQURyQixFQUVGdUMsR0FGRSxDQUVHckMsS0FBRCxJQUEyQjtBQUM1QixVQUFNc0wsY0FBYyxHQUFHRCxpQkFBaUIsQ0FBQ3JMLEtBQUssQ0FBQ29MLFNBQVAsQ0FBeEM7QUFDQSxXQUFRLEdBQUVwTCxLQUFLLENBQUNGLElBQUssR0FBRXdMLGNBQWMsS0FBSyxFQUFuQixHQUF5QixNQUFLQSxjQUFlLElBQTdDLEdBQW1ELEVBQUcsRUFBN0U7QUFDSCxHQUxFLEVBS0EvSixJQUxBLENBS0ssR0FMTCxDQUFQO0FBTUg7O0FBRU0sU0FBU2dLLFlBQVQsQ0FBc0JDLEdBQXRCLEVBQWdDSixTQUFoQyxFQUFrRTtBQUNyRSxNQUFJQSxTQUFTLENBQUNyTSxNQUFWLEtBQXFCLENBQXpCLEVBQTRCO0FBQ3hCLFdBQU95TSxHQUFQO0FBQ0g7O0FBQ0QsTUFBSTVGLEtBQUssQ0FBQzZGLE9BQU4sQ0FBY0QsR0FBZCxDQUFKLEVBQXdCO0FBQ3BCLFdBQU9BLEdBQUcsQ0FBQ25KLEdBQUosQ0FBUThCLENBQUMsSUFBSW9ILFlBQVksQ0FBQ3BILENBQUQsRUFBSWlILFNBQUosQ0FBekIsQ0FBUDtBQUNIOztBQUNELFFBQU1NLFFBQWEsR0FBRyxFQUF0Qjs7QUFDQSxNQUFJRixHQUFHLENBQUNHLElBQVIsRUFBYztBQUNWRCxJQUFBQSxRQUFRLENBQUNDLElBQVQsR0FBZ0JILEdBQUcsQ0FBQ0csSUFBcEI7QUFDQUQsSUFBQUEsUUFBUSxDQUFDRSxFQUFULEdBQWNKLEdBQUcsQ0FBQ0csSUFBbEI7QUFDSDs7QUFDRCxPQUFLLE1BQU1SLElBQVgsSUFBbUJDLFNBQW5CLEVBQThCO0FBQzFCLFVBQU1TLGVBQWUsR0FBRztBQUNwQkMsTUFBQUEsVUFBVSxFQUFFLENBQUMsUUFBRCxDQURRO0FBRXBCQyxNQUFBQSxZQUFZLEVBQUUsQ0FBQyxTQUFELENBRk07QUFHcEJDLE1BQUFBLFVBQVUsRUFBRSxDQUFDLElBQUQsQ0FIUTtBQUlwQkMsTUFBQUEsZUFBZSxFQUFFLENBQUMsSUFBRCxFQUFPLFVBQVAsQ0FKRztBQUtwQkMsTUFBQUEsZUFBZSxFQUFFLENBQUMsSUFBRCxFQUFPLFVBQVA7QUFMRyxNQU10QmYsSUFBSSxDQUFDckwsSUFOaUIsQ0FBeEI7O0FBT0EsUUFBSStMLGVBQWUsS0FBS3JKLFNBQXhCLEVBQW1DO0FBQy9CcUosTUFBQUEsZUFBZSxDQUFDckwsT0FBaEIsQ0FBeUJSLEtBQUQsSUFBVztBQUMvQixZQUFJd0wsR0FBRyxDQUFDeEwsS0FBRCxDQUFILEtBQWV3QyxTQUFuQixFQUE4QjtBQUMxQmtKLFVBQUFBLFFBQVEsQ0FBQzFMLEtBQUQsQ0FBUixHQUFrQndMLEdBQUcsQ0FBQ3hMLEtBQUQsQ0FBckI7QUFDSDtBQUNKLE9BSkQ7QUFLSDs7QUFDRCxVQUFNSCxLQUFLLEdBQUcyTCxHQUFHLENBQUNMLElBQUksQ0FBQ3JMLElBQU4sQ0FBakI7O0FBQ0EsUUFBSUQsS0FBSyxLQUFLMkMsU0FBZCxFQUF5QjtBQUNyQmtKLE1BQUFBLFFBQVEsQ0FBQ1AsSUFBSSxDQUFDckwsSUFBTixDQUFSLEdBQXNCcUwsSUFBSSxDQUFDQyxTQUFMLENBQWVyTSxNQUFmLEdBQXdCLENBQXhCLEdBQ2hCd00sWUFBWSxDQUFDMUwsS0FBRCxFQUFRc0wsSUFBSSxDQUFDQyxTQUFiLENBREksR0FFaEJ2TCxLQUZOO0FBR0g7QUFDSjs7QUFDRCxTQUFPNkwsUUFBUDtBQUNIOztBQXVCTSxTQUFTUyxhQUFULENBQXVCQyxLQUF2QixFQUFrRDtBQUNyRCxTQUFPQSxLQUFLLENBQUMxTixNQUFOLENBQWE2QyxJQUFiLENBQWtCLElBQWxCLENBQVA7QUFDSDs7QUFFTSxTQUFTOEssVUFBVCxDQUFvQmhHLENBQXBCLEVBQTJDO0FBQzlDLFNBQU87QUFDSDNILElBQUFBLE1BQU0sRUFBRTJILENBQUMsQ0FBQ3dDLEtBQUYsQ0FBUSxHQUFSLEVBQWF4RyxHQUFiLENBQWlCOEIsQ0FBQyxJQUFJQSxDQUFDLENBQUNtQyxJQUFGLEVBQXRCLEVBQWdDcEcsTUFBaEMsQ0FBdUNpRSxDQUFDLElBQUlBLENBQTVDO0FBREwsR0FBUDtBQUdIOztBQUVNLFNBQVNtSSxlQUFULENBQXlCQyxPQUF6QixFQUFxRDtBQUN4RCxTQUFPQSxPQUFPLENBQUNsSyxHQUFSLENBQVk4QixDQUFDLElBQUssR0FBRUEsQ0FBQyxDQUFDbkcsSUFBSyxHQUFFLENBQUNtRyxDQUFDLENBQUNxSSxTQUFGLElBQWUsRUFBaEIsTUFBd0IsTUFBeEIsR0FBaUMsT0FBakMsR0FBMkMsRUFBRyxFQUEzRSxFQUE4RWpMLElBQTlFLENBQW1GLElBQW5GLENBQVA7QUFDSDs7QUFFTSxTQUFTa0wsWUFBVCxDQUFzQnBHLENBQXRCLEVBQTRDO0FBQy9DLFNBQU9BLENBQUMsQ0FBQ3dDLEtBQUYsQ0FBUSxHQUFSLEVBQ0Z4RyxHQURFLENBQ0U4QixDQUFDLElBQUlBLENBQUMsQ0FBQ21DLElBQUYsRUFEUCxFQUVGcEcsTUFGRSxDQUVLaUUsQ0FBQyxJQUFJQSxDQUZWLEVBR0Y5QixHQUhFLENBR0dnRSxDQUFELElBQU87QUFDUixVQUFNcUcsS0FBSyxHQUFHckcsQ0FBQyxDQUFDd0MsS0FBRixDQUFRLEdBQVIsRUFBYTNJLE1BQWIsQ0FBb0JpRSxDQUFDLElBQUlBLENBQXpCLENBQWQ7QUFDQSxXQUFPO0FBQ0huRyxNQUFBQSxJQUFJLEVBQUUwTyxLQUFLLENBQUMsQ0FBRCxDQURSO0FBRUhGLE1BQUFBLFNBQVMsRUFBRSxDQUFDRSxLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksRUFBYixFQUFpQnhGLFdBQWpCLE9BQW1DLE1BQW5DLEdBQTRDLE1BQTVDLEdBQXFEO0FBRjdELEtBQVA7QUFJSCxHQVRFLENBQVA7QUFVSDs7QUFHTSxTQUFTeUYsa0JBQVQsQ0FBNEJDLE1BQTVCLEVBQTJGO0FBQzlGLFFBQU1DLFlBQVksR0FBRyxJQUFJbE8sR0FBSixFQUFyQjs7QUFFQSxXQUFTbU8sWUFBVCxDQUFzQkMsSUFBdEIsRUFBb0N0TyxVQUFwQyxFQUFnRHVPLGFBQWhELEVBQXVFO0FBQ25FRCxJQUFBQSxJQUFJLENBQUNyTyxNQUFMLENBQVk4QixPQUFaLENBQXFCUixLQUFELElBQW9CO0FBQ3BDLFVBQUlBLEtBQUssQ0FBQ3VCLElBQU4sSUFBY3ZCLEtBQUssQ0FBQ2lOLE9BQXhCLEVBQWlDO0FBQzdCO0FBQ0g7O0FBQ0QsWUFBTUMsT0FBTyxHQUFHSCxJQUFJLENBQUNJLFVBQUwsSUFBbUJuTixLQUFLLENBQUNGLElBQU4sS0FBZSxJQUFsQyxHQUF5QyxNQUF6QyxHQUFrREUsS0FBSyxDQUFDRixJQUF4RTtBQUNBLFlBQU05QixJQUFJLEdBQUksR0FBRVMsVUFBVyxJQUFHdUIsS0FBSyxDQUFDRixJQUFLLEVBQXpDO0FBQ0EsVUFBSXNOLE9BQU8sR0FBSSxHQUFFSixhQUFjLElBQUdFLE9BQVEsRUFBMUM7O0FBQ0EsVUFBSWxOLEtBQUssQ0FBQ3FOLFVBQU4sR0FBbUIsQ0FBdkIsRUFBMEI7QUFDdEIsWUFBSTNFLE1BQU0sR0FBRyxLQUFiOztBQUNBLGFBQUssSUFBSTRFLEtBQUssR0FBRyxFQUFqQixFQUFxQkEsS0FBSyxHQUFHLENBQTdCLEVBQWdDQSxLQUFLLElBQUksQ0FBekMsRUFBNEM7QUFDeEMsZ0JBQU1qSCxDQUFDLEdBQUksSUFBRyxJQUFJUyxNQUFKLENBQVd3RyxLQUFYLENBQWtCLEdBQWhDOztBQUNBLGNBQUlGLE9BQU8sQ0FBQy9KLFFBQVIsQ0FBaUJnRCxDQUFqQixDQUFKLEVBQXlCO0FBQ3JCcUMsWUFBQUEsTUFBTSxHQUFJLElBQUcsSUFBSTVCLE1BQUosQ0FBV3dHLEtBQUssR0FBRyxDQUFuQixDQUFzQixHQUFuQztBQUNBO0FBQ0g7QUFDSjs7QUFDREYsUUFBQUEsT0FBTyxHQUFJLEdBQUVBLE9BQVEsR0FBRTFFLE1BQU8sRUFBOUI7QUFDSDs7QUFDRCxjQUFRMUksS0FBSyxDQUFDK00sSUFBTixDQUFXUSxRQUFuQjtBQUNBLGFBQUssUUFBTDtBQUNJLGNBQUlDLFFBQUo7O0FBQ0EsY0FBSXhOLEtBQUssQ0FBQytNLElBQU4sS0FBZVUsMkJBQVlDLE9BQS9CLEVBQXdDO0FBQ3BDRixZQUFBQSxRQUFRLEdBQUcsU0FBWDtBQUNILFdBRkQsTUFFTyxJQUFJeE4sS0FBSyxDQUFDK00sSUFBTixLQUFlVSwyQkFBWUUsS0FBL0IsRUFBc0M7QUFDekNILFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUl4TixLQUFLLENBQUMrTSxJQUFOLEtBQWVVLDJCQUFZRyxHQUEvQixFQUFvQztBQUN2Q0osWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSCxXQUZNLE1BRUEsSUFBSXhOLEtBQUssQ0FBQytNLElBQU4sS0FBZVUsMkJBQVlJLE1BQS9CLEVBQXVDO0FBQzFDTCxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNILFdBRk0sTUFFQSxJQUFJeE4sS0FBSyxDQUFDK00sSUFBTixLQUFlVSwyQkFBWUssUUFBL0IsRUFBeUM7QUFDNUNOLFlBQUFBLFFBQVEsR0FBRyxVQUFYO0FBQ0gsV0FGTSxNQUVBO0FBQ0hBLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0g7O0FBQ0RYLFVBQUFBLFlBQVksQ0FBQ3pOLEdBQWIsQ0FDSXBCLElBREosRUFFSTtBQUNJK08sWUFBQUEsSUFBSSxFQUFFUyxRQURWO0FBRUl4UCxZQUFBQSxJQUFJLEVBQUVvUDtBQUZWLFdBRko7QUFPQTs7QUFDSixhQUFLLFFBQUw7QUFDQSxhQUFLLE9BQUw7QUFDSU4sVUFBQUEsWUFBWSxDQUFDOU0sS0FBSyxDQUFDK00sSUFBUCxFQUFhL08sSUFBYixFQUFtQm9QLE9BQW5CLENBQVo7QUFDQTtBQTNCSjtBQTZCSCxLQS9DRDtBQWdESDs7QUFHRFIsRUFBQUEsTUFBTSxDQUFDbUIsS0FBUCxDQUFhdk4sT0FBYixDQUFzQnVNLElBQUQsSUFBVTtBQUMzQkQsSUFBQUEsWUFBWSxDQUFDQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVgsQ0FBWjtBQUNILEdBRkQ7QUFJQSxTQUFPRixZQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBRSW5kZXhJbmZvIH0gZnJvbSAnLi4vZGF0YS9kYXRhLXByb3ZpZGVyJztcbmltcG9ydCB7IHNjYWxhclR5cGVzIH0gZnJvbSBcIi4uL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgRGJGaWVsZCwgRGJTY2hlbWEsIERiVHlwZSB9IGZyb20gXCIuLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuY29uc3QgTk9UX0lNUExFTUVOVEVEID0gbmV3IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcblxuZXhwb3J0IHR5cGUgR05hbWUgPSB7XG4gICAga2luZDogJ05hbWUnLFxuICAgIHZhbHVlOiBzdHJpbmcsXG59O1xuXG5leHBvcnQgdHlwZSBHRmllbGQgPSB7XG4gICAga2luZDogJ0ZpZWxkJyxcbiAgICBhbGlhczogc3RyaW5nLFxuICAgIG5hbWU6IEdOYW1lLFxuICAgIGFyZ3VtZW50czogR0RlZmluaXRpb25bXSxcbiAgICBkaXJlY3RpdmVzOiBHRGVmaW5pdGlvbltdLFxuICAgIHNlbGVjdGlvblNldDogdHlwZW9mIHVuZGVmaW5lZCB8IEdTZWxlY3Rpb25TZXQsXG59O1xuXG5leHBvcnQgdHlwZSBHRGVmaW5pdGlvbiA9IEdGaWVsZDtcblxuZXhwb3J0IHR5cGUgR1NlbGVjdGlvblNldCA9IHtcbiAgICBraW5kOiAnU2VsZWN0aW9uU2V0JyxcbiAgICBzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdLFxufTtcblxuZXhwb3J0IHR5cGUgUUZpZWxkRXhwbGFuYXRpb24gPSB7XG4gICAgb3BlcmF0aW9uczogU2V0PHN0cmluZz4sXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVQYXRoKGJhc2U6IHN0cmluZywgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiID0gYmFzZS5lbmRzV2l0aCgnLicpID8gYmFzZS5zbGljZSgwLCAtMSkgOiBiYXNlO1xuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoJy4nKSA/IHBhdGguc2xpY2UoMSkgOiBwYXRoO1xuICAgIGNvbnN0IHNlcCA9IHAgJiYgYiA/ICcuJyA6ICcnO1xuICAgIHJldHVybiBgJHtifSR7c2VwfSR7cH1gO1xufVxuXG5leHBvcnQgdHlwZSBTY2FsYXJGaWVsZCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgdHlwZTogKCdudW1iZXInIHwgJ3VpbnQ2NCcgfCAndWludDEwMjQnIHwgJ2Jvb2xlYW4nIHwgJ3N0cmluZycpLFxufVxuXG5leHBvcnQgY2xhc3MgUUV4cGxhbmF0aW9uIHtcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmc7XG4gICAgZmllbGRzOiBNYXA8c3RyaW5nLCBRRmllbGRFeHBsYW5hdGlvbj47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wYXJlbnRQYXRoID0gJyc7XG4gICAgICAgIHRoaXMuZmllbGRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBwID0gcGF0aDtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQ1VSUkVOVCcpKSB7XG4gICAgICAgICAgICBwID0gY29tYmluZVBhdGgodGhpcy5wYXJlbnRQYXRoLCBwLnN1YnN0cignQ1VSUkVOVCcubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3Rpbmc6IFFGaWVsZEV4cGxhbmF0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHRoaXMuZmllbGRzLmdldChwKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5vcGVyYXRpb25zLmFkZChvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkcy5zZXQocCwge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IG5ldyBTZXQoW29wXSksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBRUGFyYW1zT3B0aW9ucyA9IHtcbiAgICBleHBsYWluPzogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUVBhcmFtc09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuZXhwbGFuYXRpb24gPSAob3B0aW9ucyAmJiBvcHRpb25zLmV4cGxhaW4pXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxudHlwZSBRUmV0dXJuRXhwcmVzc2lvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZXhwcmVzc2lvbjogc3RyaW5nLFxufTtcblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgZmllbGRzPzogeyBbc3RyaW5nXTogUVR5cGUgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBmaWx0ZXJDb25kaXRpb246IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBBUUwgZXhwcmVzc2lvbiBmb3IgcmV0dXJuIHNlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICAgICAqIEBwYXJhbSB7R0RlZmluaXRpb259IGRlZlxuICAgICAqL1xuICAgIHJldHVybkV4cHJlc3Npb246IChwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pID0+IFFSZXR1cm5FeHByZXNzaW9uLFxuXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZyxcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgIGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWVsZHM6IEdEZWZpbml0aW9uW10sXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbikge1xuICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZERlZjogR0ZpZWxkKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWVsZERlZi5uYW1lICYmIGZpZWxkRGVmLm5hbWUudmFsdWUgfHwgJyc7XG4gICAgICAgIGlmIChuYW1lID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtmaWVsZERlZi5raW5kfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICdfX3R5cGVuYW1lJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7bmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXR1cm5lZCA9IGZpZWxkVHlwZS5yZXR1cm5FeHByZXNzaW9uKHBhdGgsIGZpZWxkRGVmKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KHJldHVybmVkLm5hbWUsIHJldHVybmVkLmV4cHJlc3Npb24pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBleHByZXNzaW9ucykge1xuICAgICAgICBmaWVsZHMucHVzaChgJHtrZXl9OiAke3ZhbHVlfWApO1xuICAgIH1cbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnksIGV4cGxhaW5PcD86IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgZXhwbGFpbk9wIHx8IG9wKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cblxuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzb24gPSAocGF0aCA9PT0gJ19rZXknIHx8IHBhdGguZW5kc1dpdGgoJy5fa2V5JykpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgZXhwbGFpbk9wPzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiPT1cIiwgdmFsdWUsIGV4cGxhaW5PcCkpO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNjYWxhcnNcblxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCA/IHYgOiBudWxsO1xufVxuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7ZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIsIFwiIT1cIil9KWA7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY29udmVydEZpbHRlclZhbHVlKHZhbHVlLCBvcCwgY29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKGNvbnZlcnRlcikge1xuICAgICAgICBjb25zdCBjb252ID0gY29udmVydGVyO1xuICAgICAgICByZXR1cm4gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgID8gdmFsdWUubWFwKHggPT4gY29udih4KSlcbiAgICAgICAgICAgIDogY29udih2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKGZpbHRlclZhbHVlQ29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IGNvbnZlcnRGaWx0ZXJWYWx1ZShmaWx0ZXJWYWx1ZSwgb3AsIGZpbHRlclZhbHVlQ29udmVydGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29sbGVjdGlvbiA9IHBhdGggPT09ICdkb2MnO1xuICAgICAgICAgICAgbGV0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGlmIChpc0NvbGxlY3Rpb24gJiYgbmFtZSA9PT0gJ2lkJykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSAnX2tleSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gY29udmVydEZpbHRlclZhbHVlKGZpbHRlclZhbHVlLCBvcCwgZmlsdGVyVmFsdWVDb252ZXJ0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gaW52ZXJ0ZWRIZXgoaGV4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcbiAgICAgICAgLm1hcChjID0+IChOdW1iZXIucGFyc2VJbnQoYywgMTYpIF4gMHhmKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcbiAgICAgICAgaGV4ID0gYDB4JHsobmVnID8gLXZhbHVlIDogdmFsdWUpLnRvU3RyaW5nKDE2KX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgbmVnID0gcy5zdGFydHNXaXRoKCctJyk7XG4gICAgICAgIGhleCA9IGAweCR7bmVnID8gaW52ZXJ0ZWRIZXgocy5zdWJzdHIocHJlZml4TGVuZ3RoICsgMSkpIDogcy5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gYCR7bmVnID8gJy0nIDogJyd9JHsoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBiaWc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcbiAgICByZXR1cm4gbmVnID8gYC0ke2ludmVydGVkSGV4KHJlc3VsdCl9YCA6IHJlc3VsdDtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBzdHJpbmdMb3dlckZpbHRlcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiB4ID8geC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgOiB4KTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiBjb252ZXJ0QmlnVUludCgxLCB4KSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKHggPT4gY29udmVydEJpZ1VJbnQoMiwgeCkpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RydWN0c1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPcihmaWx0ZXI6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xuICAgIGxldCBvcGVyYW5kID0gZmlsdGVyO1xuICAgIHdoaWxlIChvcGVyYW5kKSB7XG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXRPciA9IE9iamVjdC5hc3NpZ24oe30sIG9wZXJhbmQpO1xuICAgICAgICAgICAgZGVsZXRlIHdpdGhvdXRPclsnT1InXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgKCAke3BhdGh9LiR7bmFtZX0gJiYgJHtjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpfSApYCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JPcGVyYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbUZpbHRlckNvbmRpdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEZpZWxkUGF0aENoYXIoYzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChjID49ICdBJyAmJiBjIDw9ICdaJylcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxuICAgICAgICB8fCAoYyA+PSAnMCcgJiYgYyA8PSAnOScpXG4gICAgICAgIHx8IChjID09PSAnXycgfHwgYyA9PT0gJ1snIHx8IGMgPT09ICcqJyB8fCBjID09PSAnXScgfHwgYyA9PT0gJy4nKTtcbn1cblxuZnVuY3Rpb24gaXNGaWVsZFBhdGgodGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICghaXNWYWxpZEZpZWxkUGF0aENoYXIodGVzdFtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoOiBzdHJpbmcsIGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1zOiBRUGFyYW1zKTogP3N0cmluZyB7XG4gICAgZnVuY3Rpb24gdHJ5T3B0aW1pemUoZmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtSW5kZXg6IG51bWJlcik6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtSW5kZXggKyAxfWA7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IGAgPT0gJHtwYXJhbU5hbWV9YDtcbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbiA9PT0gYENVUlJFTlQke3N1ZmZpeH1gKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJ0NVUlJFTlQuJykgJiYgZmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKHN1ZmZpeCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGZpbHRlckNvbmRpdGlvbi5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJygnKSB8fCAhaXRlbUZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aCgnKScpKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3QgZmlsdGVyQ29uZGl0aW9uUGFydHMgPSBpdGVtRmlsdGVyQ29uZGl0aW9uLnNsaWNlKDEsIC0xKS5zcGxpdCgnKSBPUiAoJyk7XG4gICAgaWYgKGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IG9wdGltaXplZFBhcnRzID0gZmlsdGVyQ29uZGl0aW9uUGFydHNcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gdHJ5T3B0aW1pemUoeCwgcGFyYW1zLmNvdW50IC0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoICsgaSkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcbiAgICBpZiAob3B0aW1pemVkUGFydHMubGVuZ3RoICE9PSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBgKCR7b3B0aW1pemVkUGFydHMuam9pbignKSBPUiAoJyl9KWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheShyZXNvbHZlSXRlbVR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uID0gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoLCBpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZEZpbHRlckNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1TZWxlY3Rpb25zID0gZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChpdGVtU2VsZWN0aW9ucyAmJiBpdGVtU2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBmaWVsZFBhdGguc3BsaXQoJy4nKS5qb2luKCdfXycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgYWxpYXMsIGl0ZW1TZWxlY3Rpb25zLCBpdGVtVHlwZS5maWVsZHMgfHwge30pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1FeHByZXNzaW9uID0gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCggJHtmaWVsZFBhdGh9ICYmICggRk9SICR7YWxpYXN9IElOICR7ZmllbGRQYXRofSB8fCBbXSBSRVRVUk4gJHtpdGVtRXhwcmVzc2lvbn0gKSApYDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAke3BhdGh9LiR7bmFtZX1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMob25fcGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cmluZyBDb21wYW5pb25zXG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdDb21wYW5pb24ob25GaWVsZDogc3RyaW5nKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihfcGFyYW1zLCBfcGF0aCwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuICdmYWxzZSc7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QoX3BhcmVudCwgX3ZhbHVlLCBfZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmRmlsdGVyQ29uZGl0aW9ufSlcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgPiAwYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBvbkZpZWxkID09PSAnaWQnID8gJ19rZXknIDogb25GaWVsZDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShcbiAgICBvbkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmRmllbGQ6IHN0cmluZyxcbiAgICByZWZDb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlLFxuKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGUsXG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6ID9HU2VsZWN0aW9uU2V0LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogUUluZGV4SW5mbyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGluZGV4LmZpZWxkcy5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmRleChzOiBzdHJpbmcpOiBRSW5kZXhJbmZvIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHM6IHMuc3BsaXQoJywnKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKHggPT4geCksXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY2FsYXJGaWVsZHMoc2NoZW1hOiBEYlNjaGVtYSk6IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+KCk7XG5cbiAgICBmdW5jdGlvbiBhZGRGb3JEYlR5cGUodHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gdHlwZS5jb2xsZWN0aW9uICYmIGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgbGV0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9YDtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9IGBbJHsnKicucmVwZWF0KGRlcHRoICsgMSl9XWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2NhbGFyRmllbGRzLnNldChcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBkb2NQYXRoLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBhZGRGb3JEYlR5cGUoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgc2NoZW1hLnR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgYWRkRm9yRGJUeXBlKHR5cGUsICcnLCAnJyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2NhbGFyRmllbGRzO1xufVxuIl19