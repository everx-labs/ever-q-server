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
exports.bigUInt2 = exports.bigUInt1 = exports.scalar = exports.QParams = exports.QExplanation = void 0;

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

function filterConditionOp(params, path, op, filter) {
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

function combineFilterConditions(conditions, op, defaultConditions) {
  if (conditions.length === 0) {
    return defaultConditions;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return '(' + conditions.join(`) ${op} (`) + ')';
}

function filterConditionForIn(params, path, filter) {
  const conditions = filter.map(value => filterConditionOp(params, path, '==', value));
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
    return `NOT (${filterConditionForIn(params, path, filter)})`;
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

function createScalar() {
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        return op.filterCondition(params, path, filterValue);
      });
    },

    returnExpression(path, def) {
      let name = def.name.value;

      if (name === 'id' && path === 'doc') {
        name = '_key';
      }

      return {
        name,
        expression: `${path}.${name}`
      };
    },

    test(parent, value, filter) {
      return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
        return op.test(parent, undefinedToNull(value), filterValue);
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

function createBigUInt(prefixLength) {
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const converted = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(x => convertBigUInt(prefixLength, x)) : convertBigUInt(prefixLength, filterValue);
        return op.filterCondition(params, path, converted);
      });
    },

    returnExpression(path, def) {
      const name = def.name.value;
      return {
        name,
        expression: `${path}.${name}`
      };
    },

    test(parent, value, filter) {
      return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
        const converted = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(x => convertBigUInt(prefixLength, x)) : convertBigUInt(prefixLength, filterValue);
        return op.test(parent, value, converted);
      });
    }

  };
}

const scalar = createScalar();
exports.scalar = scalar;
const bigUInt1 = createBigUInt(1);
exports.bigUInt1 = bigUInt1;
const bigUInt2 = createBigUInt(2); //------------------------------------------------------------- Structs

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

      const docName = field.name === 'id' ? '_key' : field.name;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9uIiwiZXhwcmVzc2lvbiIsImNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyIsImtleSIsImpvaW4iLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImZpbHRlckNvbmRpdGlvbk9wIiwicGFyYW1zIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJmaWx0ZXJDb25kaXRpb25Gb3JJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsImZpbHRlckNvbmRpdGlvbiIsIl9wYXRoIiwiX2RlZiIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwiaW4iLCJub3RJbiIsImNyZWF0ZVNjYWxhciIsImRlZiIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsImQiLCJEYXRlIiwicGFkIiwibnVtYmVyIiwiZ2V0VVRDRnVsbFllYXIiLCJnZXRVVENNb250aCIsImdldFVUQ0RhdGUiLCJnZXRVVENIb3VycyIsImdldFVUQ01pbnV0ZXMiLCJnZXRVVENTZWNvbmRzIiwiZ2V0VVRDTWlsbGlzZWNvbmRzIiwidG9GaXhlZCIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJCaWdOdW1iZXJGb3JtYXQiLCJIRVgiLCJERUMiLCJpbnZlcnRlZEhleCIsImhleCIsIkFycmF5IiwiZnJvbSIsImMiLCJOdW1iZXIiLCJwYXJzZUludCIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwiYXJncyIsIm5lZyIsInMiLCJ0cmltIiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJiaWciLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJyZXN1bHQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzcGxpdE9yIiwib3BlcmFuZHMiLCJvcGVyYW5kIiwid2l0aG91dE9yIiwiYXNzaWduIiwiT1IiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJvck9wZXJhbmRzIiwiZmllbGROYW1lIiwic2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9ucyIsImkiLCJnZXRJdGVtRmlsdGVyQ29uZGl0aW9uIiwiaXRlbVR5cGUiLCJpdGVtRmlsdGVyQ29uZGl0aW9uIiwic2F2ZVBhcmVudFBhdGgiLCJpc1ZhbGlkRmllbGRQYXRoQ2hhciIsImlzRmllbGRQYXRoIiwidHJ5T3B0aW1pemVBcnJheUFueSIsInRyeU9wdGltaXplIiwicGFyYW1JbmRleCIsInN1ZmZpeCIsImZpZWxkUGF0aCIsImZpbHRlckNvbmRpdGlvblBhcnRzIiwic3BsaXQiLCJvcHRpbWl6ZWRQYXJ0cyIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsIm9wdGltaXplZEZpbHRlckNvbmRpdGlvbiIsInN1Y2NlZWRlZEluZGV4IiwiaXRlbVNlbGVjdGlvbnMiLCJhbGlhcyIsIml0ZW1FeHByZXNzaW9uIiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJvbl9wYXRoIiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInN0cmluZ0NvbXBhbmlvbiIsIl9wYXJhbXMiLCJfZmlsdGVyIiwiX3BhcmVudCIsIl92YWx1ZSIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsInJlc29sdmVSZWZUeXBlIiwicmVmVHlwZSIsInJlcGxhY2UiLCJyZWZGaWx0ZXJDb25kaXRpb24iLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwiaXRlbSIsInNlbGVjdGlvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmllbGRTZWxlY3Rpb24iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsImluZGV4VG9TdHJpbmciLCJpbmRleCIsInBhcnNlSW5kZXgiLCJvcmRlckJ5VG9TdHJpbmciLCJvcmRlckJ5IiwiZGlyZWN0aW9uIiwicGFyc2VPcmRlckJ5IiwicGFydHMiLCJ0b0xvd2VyQ2FzZSIsImNyZWF0ZVNjYWxhckZpZWxkcyIsInNjaGVtYSIsInNjYWxhckZpZWxkcyIsImFkZEZvckRiVHlwZSIsInR5cGUiLCJwYXJlbnREb2NQYXRoIiwiZW51bURlZiIsImRvY05hbWUiLCJkb2NQYXRoIiwiYXJyYXlEZXB0aCIsImRlcHRoIiwiY2F0ZWdvcnkiLCJ0eXBlTmFtZSIsInNjYWxhclR5cGVzIiwiYm9vbGVhbiIsImZsb2F0IiwiaW50IiwidWludDY0IiwidWludDEwMjQiLCJ0eXBlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7O0FBckJBOzs7Ozs7Ozs7Ozs7Ozs7QUEwQkEsTUFBTUEsZUFBZSxHQUFHLElBQUlDLEtBQUosQ0FBVSxpQkFBVixDQUF4Qjs7QUEyQkEsU0FBU0MsV0FBVCxDQUFxQkMsSUFBckIsRUFBbUNDLElBQW5DLEVBQXlEO0FBQ3JELFFBQU1DLENBQUMsR0FBR0YsSUFBSSxDQUFDRyxRQUFMLENBQWMsR0FBZCxJQUFxQkgsSUFBSSxDQUFDSSxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUMsQ0FBZixDQUFyQixHQUF5Q0osSUFBbkQ7QUFDQSxRQUFNSyxDQUFDLEdBQUdKLElBQUksQ0FBQ0ssVUFBTCxDQUFnQixHQUFoQixJQUF1QkwsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUF2QixHQUF1Q0gsSUFBakQ7QUFDQSxRQUFNTSxHQUFHLEdBQUdGLENBQUMsSUFBSUgsQ0FBTCxHQUFTLEdBQVQsR0FBZSxFQUEzQjtBQUNBLFNBQVEsR0FBRUEsQ0FBRSxHQUFFSyxHQUFJLEdBQUVGLENBQUUsRUFBdEI7QUFDSDs7QUFPTSxNQUFN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S0FBZVMsMkJBQVlFLEtBQS9CLEVBQXNDO0FBQ3pDSCxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNILFdBRk0sTUFFQSxJQUFJbE4sS0FBSyxDQUFDME0sSUFBTixLQUFlUywyQkFBWUcsR0FBL0IsRUFBb0M7QUFDdkNKLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUlsTixLQUFLLENBQUMwTSxJQUFOLEtBQWVTLDJCQUFZSSxNQUEvQixFQUF1QztBQUMxQ0wsWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSCxXQUZNLE1BRUEsSUFBSWxOLEtBQUssQ0FBQzBNLElBQU4sS0FBZVMsMkJBQVlLLFFBQS9CLEVBQXlDO0FBQzVDTixZQUFBQSxRQUFRLEdBQUcsVUFBWDtBQUNILFdBRk0sTUFFQTtBQUNIQSxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNIOztBQUNEVixVQUFBQSxZQUFZLENBQUNwTixHQUFiLENBQ0lwQixJQURKLEVBRUk7QUFDSTBPLFlBQUFBLElBQUksRUFBRVEsUUFEVjtBQUVJbFAsWUFBQUEsSUFBSSxFQUFFOE87QUFGVixXQUZKO0FBT0E7O0FBQ0osYUFBSyxRQUFMO0FBQ0EsYUFBSyxPQUFMO0FBQ0lMLFVBQUFBLFlBQVksQ0FBQ3pNLEtBQUssQ0FBQzBNLElBQVAsRUFBYTFPLElBQWIsRUFBbUI4TyxPQUFuQixDQUFaO0FBQ0E7QUEzQko7QUE2QkgsS0EvQ0Q7QUFnREg7O0FBR0RQLEVBQUFBLE1BQU0sQ0FBQ2tCLEtBQVAsQ0FBYWpOLE9BQWIsQ0FBc0JrTSxJQUFELElBQVU7QUFDM0JELElBQUFBLFlBQVksQ0FBQ0MsSUFBRCxFQUFPLEVBQVAsRUFBVyxFQUFYLENBQVo7QUFDSCxHQUZEO0FBSUEsU0FBT0YsWUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHtBY2Nlc3NSaWdodHN9IGZyb20gXCIuLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFJbmRleEluZm8gfSBmcm9tICcuLi9kYXRhL2RhdGEnO1xuaW1wb3J0IHtzY2FsYXJUeXBlc30gZnJvbSBcIi4uL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHtEYkZpZWxkLCBEYlNjaGVtYSwgRGJUeXBlfSBmcm9tIFwiLi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmNvbnN0IE5PVF9JTVBMRU1FTlRFRCA9IG5ldyBFcnJvcignTm90IEltcGxlbWVudGVkJyk7XG5cbmV4cG9ydCB0eXBlIEdOYW1lID0ge1xuICAgIGtpbmQ6ICdOYW1lJyxcbiAgICB2YWx1ZTogc3RyaW5nLFxufTtcblxuZXhwb3J0IHR5cGUgR0ZpZWxkID0ge1xuICAgIGtpbmQ6ICdGaWVsZCcsXG4gICAgYWxpYXM6IHN0cmluZyxcbiAgICBuYW1lOiBHTmFtZSxcbiAgICBhcmd1bWVudHM6IEdEZWZpbml0aW9uW10sXG4gICAgZGlyZWN0aXZlczogR0RlZmluaXRpb25bXSxcbiAgICBzZWxlY3Rpb25TZXQ6IHR5cGVvZiB1bmRlZmluZWQgfCBHU2VsZWN0aW9uU2V0LFxufTtcblxuZXhwb3J0IHR5cGUgR0RlZmluaXRpb24gPSBHRmllbGQ7XG5cbmV4cG9ydCB0eXBlIEdTZWxlY3Rpb25TZXQgPSB7XG4gICAga2luZDogJ1NlbGVjdGlvblNldCcsXG4gICAgc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSxcbn07XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnR5cGUgUVJldHVybkV4cHJlc3Npb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGV4cHJlc3Npb246IHN0cmluZyxcbn07XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIGZpZWxkcz86IHsgW3N0cmluZ106IFFUeXBlIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgZmlsdGVyQ29uZGl0aW9uOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgQVFMIGV4cHJlc3Npb24gZm9yIHJldHVybiBzZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICAgKiBAcGFyYW0ge0dEZWZpbml0aW9ufSBkZWZcbiAgICAgKi9cbiAgICByZXR1cm5FeHByZXNzaW9uOiAocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKSA9PiBRUmV0dXJuRXhwcmVzc2lvbixcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZpbHRlckNvbmRpdGlvbkZvckZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICBleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmllbGRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4pIHtcbiAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGREZWY6IEdGaWVsZCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gZmllbGREZWYubmFtZSAmJiBmaWVsZERlZi5uYW1lLnZhbHVlIHx8ICcnO1xuICAgICAgICBpZiAobmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7ZmllbGREZWYua2luZH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAnX190eXBlbmFtZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbbmFtZV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke25hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0dXJuZWQgPSBmaWVsZFR5cGUucmV0dXJuRXhwcmVzc2lvbihwYXRoLCBmaWVsZERlZik7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldChyZXR1cm5lZC5uYW1lLCByZXR1cm5lZC5leHByZXNzaW9uKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgZmllbGRzLnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW4sXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBwYXJhbXMuZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoLCBvcCk7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG4gICAgY29uc3QgaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPSAocGF0aCA9PT0gJ19rZXknIHx8IHBhdGguZW5kc1dpdGgoJy5fa2V5JykpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xuICAgIGNvbnN0IGZpeGVkVmFsdWUgPSBgQCR7cGFyYW1OYW1lfWA7XG4gICAgcmV0dXJuIGAke2ZpeGVkUGF0aH0gJHtvcH0gJHtmaXhlZFZhbHVlfWA7XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9ucywgJ09SJywgJ2ZhbHNlJyk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTY2FsYXJzXG5cbmZ1bmN0aW9uIHVuZGVmaW5lZFRvTnVsbCh2OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogbnVsbDtcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPD0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke2ZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyT3BzID0ge1xuICAgIGVxOiBzY2FsYXJFcSxcbiAgICBuZTogc2NhbGFyTmUsXG4gICAgbHQ6IHNjYWxhckx0LFxuICAgIGxlOiBzY2FsYXJMZSxcbiAgICBndDogc2NhbGFyR3QsXG4gICAgZ2U6IHNjYWxhckdlLFxuICAgIGluOiBzY2FsYXJJbixcbiAgICBub3RJbjogc2NhbGFyTm90SW4sXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVTY2FsYXIoKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGxldCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gJ2lkJyAmJiBwYXRoID09PSAnZG9jJykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSAnX2tleSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB1bmRlZmluZWRUb051bGwodmFsdWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHZhbHVlKTtcblxuICAgIGZ1bmN0aW9uIHBhZChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDEwKSB7XG4gICAgICAgICAgICByZXR1cm4gJzAnICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ01vbnRoKCkgKyAxKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ0RhdGUoKSkgK1xuICAgICAgICAnICcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICtcbiAgICAgICAgJy4nICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peFNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWUgKiAxMDAwKTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogJ0hFWCcsXG4gICAgREVDOiAnREVDJyxcbn07XG5cbmZ1bmN0aW9uIGludmVydGVkSGV4KGhleDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShoZXgpXG4gICAgICAgIC5tYXAoYyA9PiAoTnVtYmVyLnBhcnNlSW50KGMsIDE2KSBeIDB4ZikudG9TdHJpbmcoMTYpKVxuICAgICAgICAuam9pbignJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSwgYXJncz86IHsgZm9ybWF0PzogJ0hFWCcgfCAnREVDJyB9KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBuZWc7XG4gICAgbGV0IGhleDtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICBuZWcgPSB2YWx1ZSA8IDA7XG4gICAgICAgIGhleCA9IGAweCR7KG5lZyA/IC12YWx1ZSA6IHZhbHVlKS50b1N0cmluZygxNil9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzID0gdmFsdWUudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgIG5lZyA9IHMuc3RhcnRzV2l0aCgnLScpO1xuICAgICAgICBoZXggPSBgMHgke25lZyA/IGludmVydGVkSGV4KHMuc3Vic3RyKHByZWZpeExlbmd0aCArIDEpKSA6IHMuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbiAgICB9XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIGAke25lZyA/ICctJyA6ICcnfSR7KGZvcm1hdCA9PT0gQmlnTnVtYmVyRm9ybWF0LkhFWCkgPyBoZXggOiBCaWdJbnQoaGV4KS50b1N0cmluZygpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBsZXQgYmlnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIGJpZyA9IHMuc3RhcnRzV2l0aCgnLScpID8gLUJpZ0ludChzLnN1YnN0cigxKSkgOiBCaWdJbnQocyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmlnID0gQmlnSW50KHZhbHVlKTtcbiAgICB9XG4gICAgY29uc3QgbmVnID0gYmlnIDwgQmlnSW50KDApO1xuICAgIGNvbnN0IGhleCA9IChuZWcgPyAtYmlnIDogYmlnKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gKGhleC5sZW5ndGggLSAxKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgY29uc3QgcmVzdWx0ID0gYCR7cHJlZml4fSR7aGV4fWA7XG4gICAgcmV0dXJuIG5lZyA/IGAtJHtpbnZlcnRlZEhleChyZXN1bHQpfWAgOiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cnVjdHNcblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0T3IoZmlsdGVyOiBhbnkpOiBhbnlbXSB7XG4gICAgY29uc3Qgb3BlcmFuZHMgPSBbXTtcbiAgICBsZXQgb3BlcmFuZCA9IGZpbHRlcjtcbiAgICB3aGlsZSAob3BlcmFuZCkge1xuICAgICAgICBpZiAoJ09SJyBpbiBvcGVyYW5kKSB7XG4gICAgICAgICAgICBjb25zdCB3aXRob3V0T3IgPSBPYmplY3QuYXNzaWduKHt9LCBvcGVyYW5kKTtcbiAgICAgICAgICAgIGRlbGV0ZSB3aXRob3V0T3JbJ09SJ107XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKHdpdGhvdXRPcik7XG4gICAgICAgICAgICBvcGVyYW5kID0gb3BlcmFuZC5PUjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2gob3BlcmFuZCk7XG4gICAgICAgICAgICBvcGVyYW5kID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3BlcmFuZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkcyxcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpLm1hcCgob3BlcmFuZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgb3BlcmFuZCwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBjb21iaW5lUGF0aChwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAob3JPcGVyYW5kcy5sZW5ndGggPiAxKSA/IGAoJHtvck9wZXJhbmRzLmpvaW4oJykgT1IgKCcpfSlgIDogb3JPcGVyYW5kc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICAgICAgICAgICAgICBleHByZXNzaW9ucyxcbiAgICAgICAgICAgICAgICBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgICAgICAoZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnMpIHx8IFtdLFxuICAgICAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCggJHtwYXRofS4ke25hbWV9ICYmICR7Y29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKX0gKWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdEZpZWxkcyh2YWx1ZSwgb3JPcGVyYW5kc1tpXSwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBsZXQgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nO1xuICAgIGNvbnN0IGV4cGxhbmF0aW9uID0gcGFyYW1zLmV4cGxhbmF0aW9uO1xuICAgIGlmIChleHBsYW5hdGlvbikge1xuICAgICAgICBjb25zdCBzYXZlUGFyZW50UGF0aCA9IGV4cGxhbmF0aW9uLnBhcmVudFBhdGg7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBgJHtleHBsYW5hdGlvbi5wYXJlbnRQYXRofSR7cGF0aH1bKl1gO1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gc2F2ZVBhcmVudFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1GaWx0ZXJDb25kaXRpb247XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGaWVsZFBhdGhDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoYyA+PSAnQScgJiYgYyA8PSAnWicpXG4gICAgICAgIHx8IChjID49ICdhJyAmJiBjIDw9ICd6JylcbiAgICAgICAgfHwgKGMgPj0gJzAnICYmIGMgPD0gJzknKVxuICAgICAgICB8fCAoYyA9PT0gJ18nIHx8IGMgPT09ICdbJyB8fCBjID09PSAnKicgfHwgYyA9PT0gJ10nIHx8IGMgPT09ICcuJyk7XG59XG5cbmZ1bmN0aW9uIGlzRmllbGRQYXRoKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGVzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoIWlzVmFsaWRGaWVsZFBhdGhDaGFyKHRlc3RbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyeU9wdGltaXplQXJyYXlBbnkocGF0aDogc3RyaW5nLCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtczogUVBhcmFtcyk6ID9zdHJpbmcge1xuICAgIGZ1bmN0aW9uIHRyeU9wdGltaXplKGZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbUluZGV4OiBudW1iZXIpOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbUluZGV4ICsgMX1gO1xuICAgICAgICBjb25zdCBzdWZmaXggPSBgID09ICR7cGFyYW1OYW1lfWA7XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24gPT09IGBDVVJSRU5UJHtzdWZmaXh9YCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCdDVVJSRU5ULicpICYmIGZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBmaWx0ZXJDb25kaXRpb24uc2xpY2UoJ0NVUlJFTlQuJy5sZW5ndGgsIC1zdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgICAgIGlmIChpc0ZpZWxkUGF0aChmaWVsZFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXS4ke2ZpZWxkUGF0aH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghaXRlbUZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCcoJykgfHwgIWl0ZW1GaWx0ZXJDb25kaXRpb24uZW5kc1dpdGgoJyknKSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbHRlckNvbmRpdGlvblBhcnRzID0gaXRlbUZpbHRlckNvbmRpdGlvbi5zbGljZSgxLCAtMSkuc3BsaXQoJykgT1IgKCcpO1xuICAgIGlmIChmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xuICAgIH1cbiAgICBjb25zdCBvcHRpbWl6ZWRQYXJ0cyA9IGZpbHRlckNvbmRpdGlvblBhcnRzXG4gICAgICAgIC5tYXAoKHgsIGkpID0+IHRyeU9wdGltaXplKHgsIHBhcmFtcy5jb3VudCAtIGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCArIGkpKVxuICAgICAgICAuZmlsdGVyKHggPT4geCAhPT0gbnVsbCk7XG4gICAgaWYgKG9wdGltaXplZFBhcnRzLmxlbmd0aCAhPT0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gYCgke29wdGltaXplZFBhcnRzLmpvaW4oJykgT1IgKCcpfSlgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEZpbHRlckNvbmRpdGlvbiA9IHRyeU9wdGltaXplQXJyYXlBbnkocGF0aCwgaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBpdGVtU2VsZWN0aW9ucyA9IGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgbGV0IGV4cHJlc3Npb247XG4gICAgICAgICAgICBpZiAoaXRlbVNlbGVjdGlvbnMgJiYgaXRlbVNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGAke3BhdGh9LiR7bmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gZmllbGRQYXRoLnNwbGl0KCcuJykuam9pbignX18nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsIGFsaWFzLCBpdGVtU2VsZWN0aW9ucywgaXRlbVR5cGUuZmllbGRzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRXhwcmVzc2lvbiA9IGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoICR7ZmllbGRQYXRofSAmJiAoIEZPUiAke2FsaWFzfSBJTiAke2ZpZWxkUGF0aH0gfHwgW10gUkVUVVJOICR7aXRlbUV4cHJlc3Npb259ICkgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29tcGFuaW9uKG9uRmllbGQ6IHN0cmluZyk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24oX3BhcmFtcywgX3BhdGgsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmFsc2UnO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KF9wYXJlbnQsIF92YWx1ZSwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEpvaW5zXG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gb25GaWVsZCA9PT0gJ2lkJyA/ICdfa2V5JyA6IG9uRmllbGQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luQXJyYXkoXG4gICAgb25GaWVsZDogc3RyaW5nLFxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmQ29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlLFxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiA/R1NlbGVjdGlvblNldCwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGlzRmFzdDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4VG9TdHJpbmcoaW5kZXg6IFFJbmRleEluZm8pOiBzdHJpbmcge1xuICAgIHJldHVybiBpbmRleC5maWVsZHMuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5kZXgoczogc3RyaW5nKTogUUluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnlUb1N0cmluZyhvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xuICAgIHJldHVybiBvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0keyh4LmRpcmVjdGlvbiB8fCAnJykgPT09ICdERVNDJyA/ICcgREVTQycgOiAnJ31gKS5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPcmRlckJ5KHM6IHN0cmluZyk6IE9yZGVyQnlbXSB7XG4gICAgcmV0dXJuIHMuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHggPT4geC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4KVxuICAgICAgICAubWFwKChzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJyAnKS5maWx0ZXIoeCA9PiB4KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aDogcGFydHNbMF0sXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAocGFydHNbMV0gfHwgJycpLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJyA/ICdERVNDJyA6ICdBU0MnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2NhbGFyRmllbGRzKHNjaGVtYTogRGJTY2hlbWEpOiBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+IHtcbiAgICBjb25zdCBzY2FsYXJGaWVsZHMgPSBuZXcgTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PigpO1xuXG4gICAgZnVuY3Rpb24gYWRkRm9yRGJUeXBlKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHR5cGUuZmllbGRzLmZvckVhY2goKGZpZWxkOiBEYkZpZWxkKSA9PiB7XG4gICAgICAgICAgICBpZiAoZmllbGQuam9pbiB8fCBmaWVsZC5lbnVtRGVmKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZG9jTmFtZSA9IGZpZWxkLm5hbWUgPT09ICdpZCcgPyAnX2tleScgOiBmaWVsZC5uYW1lO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xuICAgICAgICAgICAgbGV0IGRvY1BhdGggPSBgJHtwYXJlbnREb2NQYXRofS4ke2RvY05hbWV9YDtcbiAgICAgICAgICAgIGlmIChmaWVsZC5hcnJheURlcHRoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHsnKicucmVwZWF0KGRlcHRoKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1ZmZpeCA9IGBbJHsnKicucmVwZWF0KGRlcHRoICsgMSl9XWA7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2NQYXRoID0gYCR7ZG9jUGF0aH0ke3N1ZmZpeH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3dpdGNoIChmaWVsZC50eXBlLmNhdGVnb3J5KSB7XG4gICAgICAgICAgICBjYXNlIFwic2NhbGFyXCI6XG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xuICAgICAgICAgICAgICAgIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5ib29sZWFuKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ2Jvb2xlYW4nO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmludCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDY0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQ2NCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50MTAyNCc7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2NhbGFyRmllbGRzLnNldChcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBkb2NQYXRoLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwic3RydWN0XCI6XG4gICAgICAgICAgICBjYXNlIFwidW5pb25cIjpcbiAgICAgICAgICAgICAgICBhZGRGb3JEYlR5cGUoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgc2NoZW1hLnR5cGVzLmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgYWRkRm9yRGJUeXBlKHR5cGUsICcnLCAnJyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2NhbGFyRmllbGRzO1xufVxuIl19