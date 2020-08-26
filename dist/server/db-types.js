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

var _dbSchemaTypes = require("./schema/db-schema-types");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJOT1RfSU1QTEVNRU5URUQiLCJFcnJvciIsImNvbWJpbmVQYXRoIiwiYmFzZSIsInBhdGgiLCJiIiwiZW5kc1dpdGgiLCJzbGljZSIsInAiLCJzdGFydHNXaXRoIiwic2VwIiwiUUV4cGxhbmF0aW9uIiwiY29uc3RydWN0b3IiLCJwYXJlbnRQYXRoIiwiZmllbGRzIiwiTWFwIiwiZXhwbGFpblNjYWxhck9wZXJhdGlvbiIsIm9wIiwic3Vic3RyIiwibGVuZ3RoIiwiZXhpc3RpbmciLCJnZXQiLCJvcGVyYXRpb25zIiwiYWRkIiwic2V0IiwiU2V0IiwiUVBhcmFtcyIsIm9wdGlvbnMiLCJjb3VudCIsInZhbHVlcyIsImV4cGxhbmF0aW9uIiwiZXhwbGFpbiIsImNsZWFyIiwidmFsdWUiLCJuYW1lIiwidG9TdHJpbmciLCJmaWVsZCIsImZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCIsImNvbmRpdGlvbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsImZpbHRlcktleSIsImZpbHRlclZhbHVlIiwiZmllbGRUeXBlIiwicHVzaCIsImNvbWJpbmVGaWx0ZXJDb25kaXRpb25zIiwiY29sbGVjdFJldHVybkV4cHJlc3Npb25zIiwiZXhwcmVzc2lvbnMiLCJmaWVsZERlZiIsImtpbmQiLCJyZXR1cm5lZCIsInJldHVybkV4cHJlc3Npb24iLCJleHByZXNzaW9uIiwiY29tYmluZVJldHVybkV4cHJlc3Npb25zIiwia2V5Iiwiam9pbiIsInRlc3RGaWVsZHMiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiZmlsdGVyQ29uZGl0aW9uT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiZGVmIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJzZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25zIiwiaSIsImdldEl0ZW1GaWx0ZXJDb25kaXRpb24iLCJpdGVtVHlwZSIsIml0ZW1GaWx0ZXJDb25kaXRpb24iLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiaXNGaWVsZFBhdGgiLCJ0cnlPcHRpbWl6ZUFycmF5QW55IiwidHJ5T3B0aW1pemUiLCJwYXJhbUluZGV4Iiwic3VmZml4IiwiZmllbGRQYXRoIiwiZmlsdGVyQ29uZGl0aW9uUGFydHMiLCJzcGxpdCIsIm9wdGltaXplZFBhcnRzIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwib3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uIiwic3VjY2VlZGVkSW5kZXgiLCJpdGVtU2VsZWN0aW9ucyIsImFsaWFzIiwiaXRlbUV4cHJlc3Npb24iLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwic3RyaW5nQ29tcGFuaW9uIiwiX3BhcmFtcyIsIl9maWx0ZXIiLCJfcGFyZW50IiwiX3ZhbHVlIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsInRvTG93ZXJDYXNlIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImRvY1BhdGgiLCJhcnJheURlcHRoIiwiZGVwdGgiLCJjYXRlZ29yeSIsInR5cGVOYW1lIiwic2NhbGFyVHlwZXMiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQTBCQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQU9NLE1BQU1HLFlBQU4sQ0FBbUI7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S0FBL0IsRUFBc0M7QUFDekNILFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUlsTixLQUFLLENBQUMwTSxJQUFOLEtBQWVTLDJCQUFZRyxHQUEvQixFQUFvQztBQUN2Q0osWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSCxXQUZNLE1BRUEsSUFBSWxOLEtBQUssQ0FBQzBNLElBQU4sS0FBZVMsMkJBQVlJLE1BQS9CLEVBQXVDO0FBQzFDTCxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNILFdBRk0sTUFFQSxJQUFJbE4sS0FBSyxDQUFDME0sSUFBTixLQUFlUywyQkFBWUssUUFBL0IsRUFBeUM7QUFDNUNOLFlBQUFBLFFBQVEsR0FBRyxVQUFYO0FBQ0gsV0FGTSxNQUVBO0FBQ0hBLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0g7O0FBQ0RWLFVBQUFBLFlBQVksQ0FBQ3BOLEdBQWIsQ0FDSXBCLElBREosRUFFSTtBQUNJME8sWUFBQUEsSUFBSSxFQUFFUSxRQURWO0FBRUlsUCxZQUFBQSxJQUFJLEVBQUU4TztBQUZWLFdBRko7QUFPQTs7QUFDSixhQUFLLFFBQUw7QUFDQSxhQUFLLE9BQUw7QUFDSUwsVUFBQUEsWUFBWSxDQUFDek0sS0FBSyxDQUFDME0sSUFBUCxFQUFhMU8sSUFBYixFQUFtQjhPLE9BQW5CLENBQVo7QUFDQTtBQTNCSjtBQTZCSCxLQS9DRDtBQWdESDs7QUFHRFAsRUFBQUEsTUFBTSxDQUFDa0IsS0FBUCxDQUFhak4sT0FBYixDQUFzQmtNLElBQUQsSUFBVTtBQUMzQkQsSUFBQUEsWUFBWSxDQUFDQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVgsQ0FBWjtBQUNILEdBRkQ7QUFJQSxTQUFPRixZQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cclxuICpcclxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXHJcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxyXG4gKiBMaWNlbnNlIGF0OlxyXG4gKlxyXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcclxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbiAqL1xyXG5cclxuLy8gQGZsb3dcclxuXHJcblxyXG5pbXBvcnQgdHlwZSB7QWNjZXNzUmlnaHRzfSBmcm9tIFwiLi9hdXRoXCI7XHJcbmltcG9ydCB0eXBlIHtJbmRleEluZm99IGZyb20gXCIuL2NvbmZpZ1wiO1xyXG5pbXBvcnQge3NjYWxhclR5cGVzfSBmcm9tIFwiLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XHJcbmltcG9ydCB0eXBlIHtEYkZpZWxkLCBEYlNjaGVtYSwgRGJUeXBlfSBmcm9tIFwiLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XHJcblxyXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XHJcblxyXG5jb25zdCBOT1RfSU1QTEVNRU5URUQgPSBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xyXG5cclxuZXhwb3J0IHR5cGUgR05hbWUgPSB7XHJcbiAgICBraW5kOiAnTmFtZScsXHJcbiAgICB2YWx1ZTogc3RyaW5nLFxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgR0ZpZWxkID0ge1xyXG4gICAga2luZDogJ0ZpZWxkJyxcclxuICAgIGFsaWFzOiBzdHJpbmcsXHJcbiAgICBuYW1lOiBHTmFtZSxcclxuICAgIGFyZ3VtZW50czogR0RlZmluaXRpb25bXSxcclxuICAgIGRpcmVjdGl2ZXM6IEdEZWZpbml0aW9uW10sXHJcbiAgICBzZWxlY3Rpb25TZXQ6IHR5cGVvZiB1bmRlZmluZWQgfCBHU2VsZWN0aW9uU2V0LFxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgR0RlZmluaXRpb24gPSBHRmllbGQ7XHJcblxyXG5leHBvcnQgdHlwZSBHU2VsZWN0aW9uU2V0ID0ge1xyXG4gICAga2luZDogJ1NlbGVjdGlvblNldCcsXHJcbiAgICBzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdLFxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgUUZpZWxkRXhwbGFuYXRpb24gPSB7XHJcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcclxufVxyXG5cclxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcclxuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoJy4nKSA/IHBhdGguc2xpY2UoMSkgOiBwYXRoO1xyXG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XHJcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XHJcbiAgICBwYXRoOiBzdHJpbmcsXHJcbiAgICB0eXBlOiAoJ251bWJlcicgfCAndWludDY0JyB8ICd1aW50MTAyNCcgfCAnYm9vbGVhbicgfCAnc3RyaW5nJyksXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xyXG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xyXG4gICAgZmllbGRzOiBNYXA8c3RyaW5nLCBRRmllbGRFeHBsYW5hdGlvbj47XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnRQYXRoID0gJyc7XHJcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgcCA9IHBhdGg7XHJcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQ1VSUkVOVCcpKSB7XHJcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZXhpc3Rpbmc6IFFGaWVsZEV4cGxhbmF0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHRoaXMuZmllbGRzLmdldChwKTtcclxuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcclxuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XHJcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XHJcbiAgICBleHBsYWluPzogYm9vbGVhbixcclxufVxyXG5cclxuLyoqXHJcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcclxuICovXHJcbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcclxuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XHJcbiAgICBjb3VudDogbnVtYmVyO1xyXG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XHJcblxyXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcclxuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxyXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxyXG4gICAgICAgICAgICA6IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XHJcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcclxuICAgIH1cclxuXHJcbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XHJcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XHJcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcclxuICAgICAgICByZXR1cm4gbmFtZTtcclxuICAgIH1cclxuXHJcbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcclxuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xyXG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnR5cGUgUVJldHVybkV4cHJlc3Npb24gPSB7XHJcbiAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICBleHByZXNzaW9uOiBzdHJpbmcsXHJcbn07XHJcblxyXG4vKipcclxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXHJcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXHJcbiAqL1xyXG50eXBlIFFUeXBlID0ge1xyXG4gICAgZmllbGRzPzogeyBbc3RyaW5nXTogUVR5cGUgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cclxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcclxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XHJcbiAgICAgKi9cclxuICAgIGZpbHRlckNvbmRpdGlvbjogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogR2VuZXJhdGVzIEFRTCBleHByZXNzaW9uIGZvciByZXR1cm4gc2VjdGlvbi5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxyXG4gICAgICogQHBhcmFtIHtHRGVmaW5pdGlvbn0gZGVmXHJcbiAgICAgKi9cclxuICAgIHJldHVybkV4cHJlc3Npb246IChwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pID0+IFFSZXR1cm5FeHByZXNzaW9uLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXHJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxyXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXHJcbiAgICAgKi9cclxuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXHJcbn1cclxuXHJcblxyXG4vKipcclxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxyXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cclxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKFxyXG4gICAgcGF0aDogc3RyaW5nLFxyXG4gICAgZmlsdGVyOiBhbnksXHJcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxyXG4gICAgZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmcsXHJcbik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcclxuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XHJcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xyXG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXHJcbiAgICBleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPixcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGZpZWxkczogR0RlZmluaXRpb25bXSxcclxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXHJcbikge1xyXG4gICAgZmllbGRzLmZvckVhY2goKGZpZWxkRGVmOiBHRmllbGQpID0+IHtcclxuICAgICAgICBjb25zdCBuYW1lID0gZmllbGREZWYubmFtZSAmJiBmaWVsZERlZi5uYW1lLnZhbHVlIHx8ICcnO1xyXG4gICAgICAgIGlmIChuYW1lID09PSAnJykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke2ZpZWxkRGVmLmtpbmR9YCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobmFtZSA9PT0gJ19fdHlwZW5hbWUnKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbbmFtZV07XHJcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtuYW1lfWApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXR1cm5lZCA9IGZpZWxkVHlwZS5yZXR1cm5FeHByZXNzaW9uKHBhdGgsIGZpZWxkRGVmKTtcclxuICAgICAgICBleHByZXNzaW9ucy5zZXQocmV0dXJuZWQubmFtZSwgcmV0dXJuZWQuZXhwcmVzc2lvbik7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XHJcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcclxuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGV4cHJlc3Npb25zKSB7XHJcbiAgICAgICAgZmllbGRzLnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKTtcclxuICAgIH1cclxuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cclxuICpcclxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cclxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXHJcbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxyXG4gKi9cclxuZnVuY3Rpb24gdGVzdEZpZWxkcyhcclxuICAgIHZhbHVlOiBhbnksXHJcbiAgICBmaWx0ZXI6IGFueSxcclxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXHJcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW4sXHJcbik6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcclxuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XHJcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gIWZhaWxlZDtcclxufVxyXG5cclxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcclxuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIG9wKTtcclxuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cclxuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XHJcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxyXG4gICAgICogV2lsbCByZXR1cm46XHJcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcclxuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xyXG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcclxuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XHJcbiAgICB9XHJcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcclxuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcclxuICAgIH1cclxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xyXG59XHJcblxyXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xyXG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPT0nLCB2YWx1ZSkpO1xyXG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xyXG5cclxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XHJcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XHJcbn1cclxuXHJcbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcclxuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XHJcbiAgICB9LFxyXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcclxuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XHJcbiAgICB9LFxyXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcclxuICAgIH0sXHJcbn07XHJcblxyXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XHJcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xyXG4gICAgfSxcclxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xyXG4gICAgfSxcclxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xyXG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xyXG4gICAgfSxcclxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xyXG4gICAgfSxcclxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcclxuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XHJcbiAgICB9LFxyXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcclxuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XHJcbiAgICB9LFxyXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcclxuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcclxuICAgIH0sXHJcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xyXG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcclxuICAgIH0sXHJcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcclxuICAgIH0sXHJcbn07XHJcblxyXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XHJcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xyXG4gICAgfSxcclxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xyXG4gICAgfSxcclxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcclxuICAgIH0sXHJcbn07XHJcblxyXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XHJcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcclxuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xyXG4gICAgfSxcclxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xyXG4gICAgfSxcclxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xyXG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7ZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xyXG4gICAgfSxcclxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xyXG4gICAgfSxcclxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmNvbnN0IHNjYWxhck9wcyA9IHtcclxuICAgIGVxOiBzY2FsYXJFcSxcclxuICAgIG5lOiBzY2FsYXJOZSxcclxuICAgIGx0OiBzY2FsYXJMdCxcclxuICAgIGxlOiBzY2FsYXJMZSxcclxuICAgIGd0OiBzY2FsYXJHdCxcclxuICAgIGdlOiBzY2FsYXJHZSxcclxuICAgIGluOiBzY2FsYXJJbixcclxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgICAgIGxldCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnaWQnICYmIHBhdGggPT09ICdkb2MnKSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lID0gJ19rZXknO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHZhbHVlKTtcclxuXHJcbiAgICBmdW5jdGlvbiBwYWQobnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKG51bWJlciA8IDEwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArXHJcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcclxuICAgICAgICAnLScgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcclxuICAgICAgICAnICcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArXHJcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXHJcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDU2Vjb25kcygpKSArXHJcbiAgICAgICAgJy4nICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdW5peFNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xyXG59XHJcblxyXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XHJcbiAgICBIRVg6ICdIRVgnLFxyXG4gICAgREVDOiAnREVDJyxcclxufTtcclxuXHJcbmZ1bmN0aW9uIGludmVydGVkSGV4KGhleDogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcclxuICAgICAgICAubWFwKGMgPT4gKE51bWJlci5wYXJzZUludChjLCAxNikgXiAweGYpLnRvU3RyaW5nKDE2KSlcclxuICAgICAgICAuam9pbignJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSwgYXJncz86IHsgZm9ybWF0PzogJ0hFWCcgfCAnREVDJyB9KTogc3RyaW5nIHtcclxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfVxyXG4gICAgbGV0IG5lZztcclxuICAgIGxldCBoZXg7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcclxuICAgICAgICBoZXggPSBgMHgkeyhuZWcgPyAtdmFsdWUgOiB2YWx1ZSkudG9TdHJpbmcoMTYpfWA7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcclxuICAgICAgICBuZWcgPSBzLnN0YXJ0c1dpdGgoJy0nKTtcclxuICAgICAgICBoZXggPSBgMHgke25lZyA/IGludmVydGVkSGV4KHMuc3Vic3RyKHByZWZpeExlbmd0aCArIDEpKSA6IHMuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcclxuICAgIH1cclxuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xyXG4gICAgcmV0dXJuIGAke25lZyA/ICctJyA6ICcnfSR7KGZvcm1hdCA9PT0gQmlnTnVtYmVyRm9ybWF0LkhFWCkgPyBoZXggOiBCaWdJbnQoaGV4KS50b1N0cmluZygpfWA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XHJcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgIH1cclxuICAgIGxldCBiaWc7XHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50cmltKCk7XHJcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgYmlnID0gQmlnSW50KHZhbHVlKTtcclxuICAgIH1cclxuICAgIGNvbnN0IG5lZyA9IGJpZyA8IEJpZ0ludCgwKTtcclxuICAgIGNvbnN0IGhleCA9IChuZWcgPyAtYmlnIDogYmlnKS50b1N0cmluZygxNik7XHJcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcclxuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XHJcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XHJcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcclxuICAgIHJldHVybiBuZWcgPyBgLSR7aW52ZXJ0ZWRIZXgocmVzdWx0KX1gIDogcmVzdWx0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxyXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcclxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcclxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXHJcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xyXG5leHBvcnQgY29uc3QgYmlnVUludDE6IFFUeXBlID0gY3JlYXRlQmlnVUludCgxKTtcclxuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RydWN0c1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0T3IoZmlsdGVyOiBhbnkpOiBhbnlbXSB7XHJcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xyXG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XHJcbiAgICB3aGlsZSAob3BlcmFuZCkge1xyXG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcclxuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB3aXRob3V0T3JbJ09SJ107XHJcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcclxuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcclxuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG9wZXJhbmRzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmllbGRzLFxyXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpLm1hcCgob3BlcmFuZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBjb21iaW5lUGF0aChwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiAob3JPcGVyYW5kcy5sZW5ndGggPiAxKSA/IGAoJHtvck9wZXJhbmRzLmpvaW4oJykgT1IgKCcpfSlgIDogb3JPcGVyYW5kc1swXTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XHJcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xyXG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9ucyxcclxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7bmFtZX1gLFxyXG4gICAgICAgICAgICAgICAgKGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zKSB8fCBbXSxcclxuICAgICAgICAgICAgICAgIGZpZWxkcyxcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgKCAke3BhdGh9LiR7bmFtZX0gJiYgJHtjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpfSApYCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSkpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuICAgIH1cclxufVxyXG5cclxuLy8gQXJyYXlzXHJcblxyXG5mdW5jdGlvbiBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcclxuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XHJcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcclxuICAgIGlmIChleHBsYW5hdGlvbikge1xyXG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcclxuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcclxuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xyXG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcclxuICAgIH1cclxuICAgIHJldHVybiBpdGVtRmlsdGVyQ29uZGl0aW9uO1xyXG59XHJcblxyXG5mdW5jdGlvbiBpc1ZhbGlkRmllbGRQYXRoQ2hhcihjOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIHJldHVybiAoYyA+PSAnQScgJiYgYyA8PSAnWicpXHJcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxyXG4gICAgICAgIHx8IChjID49ICcwJyAmJiBjIDw9ICc5JylcclxuICAgICAgICB8fCAoYyA9PT0gJ18nIHx8IGMgPT09ICdbJyB8fCBjID09PSAnKicgfHwgYyA9PT0gJ10nIHx8IGMgPT09ICcuJyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzRmllbGRQYXRoKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgaWYgKCFpc1ZhbGlkRmllbGRQYXRoQ2hhcih0ZXN0W2ldKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRyeU9wdGltaXplQXJyYXlBbnkocGF0aDogc3RyaW5nLCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtczogUVBhcmFtcyk6ID9zdHJpbmcge1xyXG4gICAgZnVuY3Rpb24gdHJ5T3B0aW1pemUoZmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtSW5kZXg6IG51bWJlcik6ID9zdHJpbmcge1xyXG4gICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1JbmRleCArIDF9YDtcclxuICAgICAgICBjb25zdCBzdWZmaXggPSBgID09ICR7cGFyYW1OYW1lfWA7XHJcbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbiA9PT0gYENVUlJFTlQke3N1ZmZpeH1gKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJ0NVUlJFTlQuJykgJiYgZmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKHN1ZmZpeCkpIHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gZmlsdGVyQ29uZGl0aW9uLnNsaWNlKCdDVVJSRU5ULicubGVuZ3RoLCAtc3VmZml4Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGlmIChpc0ZpZWxkUGF0aChmaWVsZFBhdGgpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJygnKSB8fCAhaXRlbUZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aCgnKScpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZmlsdGVyQ29uZGl0aW9uUGFydHMgPSBpdGVtRmlsdGVyQ29uZGl0aW9uLnNsaWNlKDEsIC0xKS5zcGxpdCgnKSBPUiAoJyk7XHJcbiAgICBpZiAoZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgb3B0aW1pemVkUGFydHMgPSBmaWx0ZXJDb25kaXRpb25QYXJ0c1xyXG4gICAgICAgIC5tYXAoKHgsIGkpID0+IHRyeU9wdGltaXplKHgsIHBhcmFtcy5jb3VudCAtIGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCArIGkpKVxyXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcclxuICAgIGlmIChvcHRpbWl6ZWRQYXJ0cy5sZW5ndGggIT09IGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGAoJHtvcHRpbWl6ZWRQYXJ0cy5qb2luKCcpIE9SICgnKX0pYDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XHJcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XHJcbiAgICBjb25zdCBvcHMgPSB7XHJcbiAgICAgICAgYWxsOiB7XHJcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcclxuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGFueToge1xyXG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEZpbHRlckNvbmRpdGlvbiA9IHRyeU9wdGltaXplQXJyYXlBbnkocGF0aCwgaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zKTtcclxuICAgICAgICAgICAgICAgIGlmIChvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPiAwYDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcclxuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtU2VsZWN0aW9ucyA9IGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xyXG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcclxuICAgICAgICAgICAgaWYgKGl0ZW1TZWxlY3Rpb25zICYmIGl0ZW1TZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhbGlhcyA9IGZpZWxkUGF0aC5zcGxpdCgnLicpLmpvaW4oJ19fJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgYWxpYXMsIGl0ZW1TZWxlY3Rpb25zLCBpdGVtVHlwZS5maWVsZHMgfHwge30pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUV4cHJlc3Npb24gPSBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xyXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoICR7ZmllbGRQYXRofSAmJiAoIEZPUiAke2FsaWFzfSBJTiAke2ZpZWxkUGF0aH0gfHwgW10gUkVUVVJOICR7aXRlbUV4cHJlc3Npb259ICkgKWA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCR7cGF0aH0uJHtuYW1lfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xyXG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICB9XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFbnVtIE5hbWVzXHJcblxyXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xyXG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XHJcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcclxuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gbmFtZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XHJcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xyXG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcclxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xyXG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcclxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcclxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXHJcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxyXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sXHJcbiAgICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcclxuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XHJcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xyXG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ0NvbXBhbmlvbihvbkZpZWxkOiBzdHJpbmcpOiBRVHlwZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihfcGFyYW1zLCBfcGF0aCwgX2ZpbHRlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2ZhbHNlJztcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXHJcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRlc3QoX3BhcmVudCwgX3ZhbHVlLCBfZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBKb2luc1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcclxuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcclxuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcclxuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XHJcbiAgICAgICAgICAgIHJldHVybiBgXHJcbiAgICAgICAgICAgICAgICBMRU5HVEgoXHJcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cclxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXHJcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxyXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXHJcbiAgICAgICAgICAgICAgICApID4gMGA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gb25GaWVsZCA9PT0gJ2lkJyA/ICdfa2V5JyA6IG9uRmllbGQ7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xyXG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XHJcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShcclxuICAgIG9uRmllbGQ6IHN0cmluZyxcclxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXHJcbiAgICByZWZDb2xsZWN0aW9uOiBzdHJpbmcsXHJcbiAgICByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUsXHJcbik6IFFUeXBlIHtcclxuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcclxuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xyXG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XHJcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xyXG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xyXG4gICAgICAgICAgICByZXR1cm4gYFxyXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXHJcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcclxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxyXG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmRmlsdGVyQ29uZGl0aW9ufSlcclxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cclxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxyXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcclxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIHtcclxuICAgIFFUeXBlLFxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogP0dTZWxlY3Rpb25TZXQsIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcclxuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xyXG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcclxuICAgIGlmIChzZWxlY3Rpb25zKSB7XHJcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcclxuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcclxuICAgICAgICAgICAgaWYgKG5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBmaWVsZHM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHNlbGVjdGlvblxyXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcclxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xyXG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XHJcbiAgICAgICAgfSkuam9pbignICcpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xyXG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcclxuICAgICAgICByZXR1cm4gZG9jO1xyXG4gICAgfVxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xyXG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xyXG4gICAgfVxyXG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xyXG4gICAgaWYgKGRvYy5fa2V5KSB7XHJcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xyXG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XHJcbiAgICB9XHJcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XHJcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xyXG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxyXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFsnb3V0X21zZyddLFxyXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXHJcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxyXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcclxuICAgICAgICB9W2l0ZW0ubmFtZV07XHJcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXHJcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXHJcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBzZWxlY3RlZDtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcclxuICAgIHBhdGg6IHN0cmluZyxcclxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxyXG59XHJcblxyXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xyXG4gICAgZmlsdGVyOiBhbnksXHJcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXHJcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXHJcbiAgICBsaW1pdDogbnVtYmVyLFxyXG4gICAgdGltZW91dDogbnVtYmVyLFxyXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXHJcbiAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxyXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcclxuICAgIGlzRmFzdDogYm9vbGVhbixcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4VG9TdHJpbmcoaW5kZXg6IEluZGV4SW5mbyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpZWxkczogcy5zcGxpdCgnLCcpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoeCA9PiB4KSxcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnlUb1N0cmluZyhvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcclxuICAgIHJldHVybiBzLnNwbGl0KCcsJylcclxuICAgICAgICAubWFwKHggPT4geC50cmltKCkpXHJcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXHJcbiAgICAgICAgLm1hcCgocykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJyAnKS5maWx0ZXIoeCA9PiB4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHBhdGg6IHBhcnRzWzBdLFxyXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAocGFydHNbMV0gfHwgJycpLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJyA/ICdERVNDJyA6ICdBU0MnLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2NhbGFyRmllbGRzKHNjaGVtYTogRGJTY2hlbWEpOiBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+IHtcclxuICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+KCk7XHJcblxyXG4gICAgZnVuY3Rpb24gYWRkRm9yRGJUeXBlKHR5cGU6IERiVHlwZSwgcGFyZW50UGF0aCwgcGFyZW50RG9jUGF0aDogc3RyaW5nKSB7XHJcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcclxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IGAke3BhcmVudFBhdGh9LiR7ZmllbGQubmFtZX1gO1xyXG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xyXG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdWZmaXggPSAnWypdJztcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY1BhdGguaW5jbHVkZXMocykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcclxuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGVOYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnc3RyaW5nJztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHNjYWxhckZpZWxkcy5zZXQoXHJcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBkb2NQYXRoLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcclxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XHJcbiAgICAgICAgICAgICAgICBhZGRGb3JEYlR5cGUoZmllbGQudHlwZSwgcGF0aCwgZG9jUGF0aCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBzY2hlbWEudHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xyXG4gICAgICAgIGFkZEZvckRiVHlwZSh0eXBlLCAnJywgJycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIHNjYWxhckZpZWxkcztcclxufVxyXG4iXX0=