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
      const expressions = new Map();
      collectReturnExpressions(expressions, `${path}.${def.name.value}`, def.selectionSet && def.selectionSet.selections || [], fields);
      return {
        name: def.name.value,
        expression: combineReturnExpressions(expressions)
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
        expression = `( FOR ${alias} IN ${fieldPath} || [] RETURN ${itemExpression} )`;
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

    returnExpression(_path, _def) {
      throw NOT_IMPLEMENTED;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJOT1RfSU1QTEVNRU5URUQiLCJFcnJvciIsImNvbWJpbmVQYXRoIiwiYmFzZSIsInBhdGgiLCJiIiwiZW5kc1dpdGgiLCJzbGljZSIsInAiLCJzdGFydHNXaXRoIiwic2VwIiwiUUV4cGxhbmF0aW9uIiwiY29uc3RydWN0b3IiLCJwYXJlbnRQYXRoIiwiZmllbGRzIiwiTWFwIiwiZXhwbGFpblNjYWxhck9wZXJhdGlvbiIsIm9wIiwic3Vic3RyIiwibGVuZ3RoIiwiZXhpc3RpbmciLCJnZXQiLCJvcGVyYXRpb25zIiwiYWRkIiwic2V0IiwiU2V0IiwiUVBhcmFtcyIsIm9wdGlvbnMiLCJjb3VudCIsInZhbHVlcyIsImV4cGxhbmF0aW9uIiwiZXhwbGFpbiIsImNsZWFyIiwidmFsdWUiLCJuYW1lIiwidG9TdHJpbmciLCJmaWVsZCIsImZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCIsImNvbmRpdGlvbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsImZpbHRlcktleSIsImZpbHRlclZhbHVlIiwiZmllbGRUeXBlIiwicHVzaCIsImNvbWJpbmVGaWx0ZXJDb25kaXRpb25zIiwiY29sbGVjdFJldHVybkV4cHJlc3Npb25zIiwiZXhwcmVzc2lvbnMiLCJmaWVsZERlZiIsImtpbmQiLCJyZXR1cm5lZCIsInJldHVybkV4cHJlc3Npb24iLCJleHByZXNzaW9uIiwiY29tYmluZVJldHVybkV4cHJlc3Npb25zIiwia2V5Iiwiam9pbiIsInRlc3RGaWVsZHMiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiZmlsdGVyQ29uZGl0aW9uT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiZGVmIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJzZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25zIiwiaSIsImdldEl0ZW1GaWx0ZXJDb25kaXRpb24iLCJpdGVtVHlwZSIsIml0ZW1GaWx0ZXJDb25kaXRpb24iLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiaXNGaWVsZFBhdGgiLCJ0cnlPcHRpbWl6ZUFycmF5QW55IiwidHJ5T3B0aW1pemUiLCJwYXJhbUluZGV4Iiwic3VmZml4IiwiZmllbGRQYXRoIiwiZmlsdGVyQ29uZGl0aW9uUGFydHMiLCJzcGxpdCIsIm9wdGltaXplZFBhcnRzIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwib3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uIiwic3VjY2VlZGVkSW5kZXgiLCJpdGVtU2VsZWN0aW9ucyIsImFsaWFzIiwiaXRlbUV4cHJlc3Npb24iLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwic3RyaW5nQ29tcGFuaW9uIiwiX3BhcmFtcyIsIl9maWx0ZXIiLCJfcGFyZW50IiwiX3ZhbHVlIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsInRvTG93ZXJDYXNlIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImRvY1BhdGgiLCJhcnJheURlcHRoIiwiZGVwdGgiLCJjYXRlZ29yeSIsInR5cGVOYW1lIiwic2NhbGFyVHlwZXMiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQTBCQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQU9NLE1BQU1HLFlBQU4sQ0FBbUI7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QU4sS0FBZVMsMkJBQVlJLE1BQS9CLEVBQXVDO0FBQzFDTCxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNILFdBRk0sTUFFQSxJQUFJbE4sS0FBSyxDQUFDME0sSUFBTixLQUFlUywyQkFBWUssUUFBL0IsRUFBeUM7QUFDNUNOLFlBQUFBLFFBQVEsR0FBRyxVQUFYO0FBQ0gsV0FGTSxNQUVBO0FBQ0hBLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0g7O0FBQ0RWLFVBQUFBLFlBQVksQ0FBQ3BOLEdBQWIsQ0FDSXBCLElBREosRUFFSTtBQUNJME8sWUFBQUEsSUFBSSxFQUFFUSxRQURWO0FBRUlsUCxZQUFBQSxJQUFJLEVBQUU4TztBQUZWLFdBRko7QUFPQTs7QUFDSixhQUFLLFFBQUw7QUFDQSxhQUFLLE9BQUw7QUFDSUwsVUFBQUEsWUFBWSxDQUFDek0sS0FBSyxDQUFDME0sSUFBUCxFQUFhMU8sSUFBYixFQUFtQjhPLE9BQW5CLENBQVo7QUFDQTtBQTNCSjtBQTZCSCxLQS9DRDtBQWdESDs7QUFHRFAsRUFBQUEsTUFBTSxDQUFDa0IsS0FBUCxDQUFhak4sT0FBYixDQUFzQmtNLElBQUQsSUFBVTtBQUMzQkQsSUFBQUEsWUFBWSxDQUFDQyxJQUFELEVBQU8sRUFBUCxFQUFXLEVBQVgsQ0FBWjtBQUNILEdBRkQ7QUFJQSxTQUFPRixZQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUge0FjY2Vzc1JpZ2h0c30gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUge0luZGV4SW5mb30gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQge3NjYWxhclR5cGVzfSBmcm9tIFwiLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7RGJGaWVsZCwgRGJTY2hlbWEsIERiVHlwZX0gZnJvbSBcIi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmNvbnN0IE5PVF9JTVBMRU1FTlRFRCA9IG5ldyBFcnJvcignTm90IEltcGxlbWVudGVkJyk7XG5cbmV4cG9ydCB0eXBlIEdOYW1lID0ge1xuICAgIGtpbmQ6ICdOYW1lJyxcbiAgICB2YWx1ZTogc3RyaW5nLFxufTtcblxuZXhwb3J0IHR5cGUgR0ZpZWxkID0ge1xuICAgIGtpbmQ6ICdGaWVsZCcsXG4gICAgYWxpYXM6IHN0cmluZyxcbiAgICBuYW1lOiBHTmFtZSxcbiAgICBhcmd1bWVudHM6IEdEZWZpbml0aW9uW10sXG4gICAgZGlyZWN0aXZlczogR0RlZmluaXRpb25bXSxcbiAgICBzZWxlY3Rpb25TZXQ6IHR5cGVvZiB1bmRlZmluZWQgfCBHU2VsZWN0aW9uU2V0LFxufTtcblxuZXhwb3J0IHR5cGUgR0RlZmluaXRpb24gPSBHRmllbGQ7XG5cbmV4cG9ydCB0eXBlIEdTZWxlY3Rpb25TZXQgPSB7XG4gICAga2luZDogJ1NlbGVjdGlvblNldCcsXG4gICAgc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSxcbn07XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnR5cGUgUVJldHVybkV4cHJlc3Npb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGV4cHJlc3Npb246IHN0cmluZyxcbn07XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIGZpZWxkcz86IHsgW3N0cmluZ106IFFUeXBlIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgZmlsdGVyQ29uZGl0aW9uOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgQVFMIGV4cHJlc3Npb24gZm9yIHJldHVybiBzZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICAgKiBAcGFyYW0ge0dEZWZpbml0aW9ufSBkZWZcbiAgICAgKi9cbiAgICByZXR1cm5FeHByZXNzaW9uOiAocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKSA9PiBRUmV0dXJuRXhwcmVzc2lvbixcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZpbHRlckNvbmRpdGlvbkZvckZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICBleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmllbGRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4pIHtcbiAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGREZWY6IEdGaWVsZCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gZmllbGREZWYubmFtZSAmJiBmaWVsZERlZi5uYW1lLnZhbHVlIHx8ICcnO1xuICAgICAgICBpZiAobmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7ZmllbGREZWYua2luZH1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW25hbWVdO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtuYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldHVybmVkID0gZmllbGRUeXBlLnJldHVybkV4cHJlc3Npb24ocGF0aCwgZmllbGREZWYpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQocmV0dXJuZWQubmFtZSwgcmV0dXJuZWQuZXhwcmVzc2lvbik7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICAgIGZpZWxkcy5wdXNoKGAke2tleX06ICR7dmFsdWV9YCk7XG4gICAgfVxuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuLFxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlcil9KWA7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdpZCcgJiYgcGF0aCA9PT0gJ2RvYycpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gJ19rZXknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh2YWx1ZSk7XG5cbiAgICBmdW5jdGlvbiBwYWQobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAxMCkge1xuICAgICAgICAgICAgcmV0dXJuICcwJyArIG51bWJlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cblxuICAgIHJldHVybiBkLmdldFVUQ0Z1bGxZZWFyKCkgK1xuICAgICAgICAnLScgKyBwYWQoZC5nZXRVVENNb250aCgpICsgMSkgK1xuICAgICAgICAnLScgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcbiAgICAgICAgJyAnICsgcGFkKGQuZ2V0VVRDSG91cnMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZC5nZXRVVENNaW51dGVzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDU2Vjb25kcygpKSArXG4gICAgICAgICcuJyArIChkLmdldFVUQ01pbGxpc2Vjb25kcygpIC8gMTAwMCkudG9GaXhlZCgzKS5zbGljZSgyLCA1KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhTZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nKHZhbHVlICogMTAwMCk7XG59XG5cbmNvbnN0IEJpZ051bWJlckZvcm1hdCA9IHtcbiAgICBIRVg6ICdIRVgnLFxuICAgIERFQzogJ0RFQycsXG59O1xuXG5mdW5jdGlvbiBpbnZlcnRlZEhleChoZXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oaGV4KVxuICAgICAgICAubWFwKGMgPT4gKE51bWJlci5wYXJzZUludChjLCAxNikgXiAweGYpLnRvU3RyaW5nKDE2KSlcbiAgICAgICAgLmpvaW4oJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnksIGFyZ3M/OiB7IGZvcm1hdD86ICdIRVgnIHwgJ0RFQycgfSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBsZXQgbmVnO1xuICAgIGxldCBoZXg7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgbmVnID0gdmFsdWUgPCAwO1xuICAgICAgICBoZXggPSBgMHgkeyhuZWcgPyAtdmFsdWUgOiB2YWx1ZSkudG9TdHJpbmcoMTYpfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICBuZWcgPSBzLnN0YXJ0c1dpdGgoJy0nKTtcbiAgICAgICAgaGV4ID0gYDB4JHtuZWcgPyBpbnZlcnRlZEhleChzLnN1YnN0cihwcmVmaXhMZW5ndGggKyAxKSkgOiBzLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG4gICAgfVxuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xuICAgIHJldHVybiBgJHtuZWcgPyAnLScgOiAnJ30keyhmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IGJpZztcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBzID0gdmFsdWUudHJpbSgpO1xuICAgICAgICBiaWcgPSBzLnN0YXJ0c1dpdGgoJy0nKSA/IC1CaWdJbnQocy5zdWJzdHIoMSkpIDogQmlnSW50KHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGJpZyA9IEJpZ0ludCh2YWx1ZSk7XG4gICAgfVxuICAgIGNvbnN0IG5lZyA9IGJpZyA8IEJpZ0ludCgwKTtcbiAgICBjb25zdCBoZXggPSAobmVnID8gLWJpZyA6IGJpZykudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IChoZXgubGVuZ3RoIC0gMSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIGNvbnN0IHJlc3VsdCA9IGAke3ByZWZpeH0ke2hleH1gO1xuICAgIHJldHVybiBuZWcgPyBgLSR7aW52ZXJ0ZWRIZXgocmVzdWx0KX1gIDogcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKCdPUicgaW4gb3BlcmFuZCkge1xuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XG4gICAgICAgICAgICBkZWxldGUgd2l0aG91dE9yWydPUiddO1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaCh3aXRob3V0T3IpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKG9wZXJhbmQpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wZXJhbmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHMsXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKS5tYXAoKG9wZXJhbmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIG9wZXJhbmQsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgY29tYmluZVBhdGgocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKG9yT3BlcmFuZHMubGVuZ3RoID4gMSkgPyBgKCR7b3JPcGVyYW5kcy5qb2luKCcpIE9SICgnKX0pYCA6IG9yT3BlcmFuZHNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICAgICAgYCR7cGF0aH0uJHtkZWYubmFtZS52YWx1ZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogZGVmLm5hbWUudmFsdWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JPcGVyYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbUZpbHRlckNvbmRpdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEZpZWxkUGF0aENoYXIoYzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChjID49ICdBJyAmJiBjIDw9ICdaJylcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxuICAgICAgICB8fCAoYyA+PSAnMCcgJiYgYyA8PSAnOScpXG4gICAgICAgIHx8IChjID09PSAnXycgfHwgYyA9PT0gJ1snIHx8IGMgPT09ICcqJyB8fCBjID09PSAnXScgfHwgYyA9PT0gJy4nKTtcbn1cblxuZnVuY3Rpb24gaXNGaWVsZFBhdGgodGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICghaXNWYWxpZEZpZWxkUGF0aENoYXIodGVzdFtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoOiBzdHJpbmcsIGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1zOiBRUGFyYW1zKTogP3N0cmluZyB7XG4gICAgZnVuY3Rpb24gdHJ5T3B0aW1pemUoZmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtSW5kZXg6IG51bWJlcik6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtSW5kZXggKyAxfWA7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IGAgPT0gJHtwYXJhbU5hbWV9YDtcbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbiA9PT0gYENVUlJFTlQke3N1ZmZpeH1gKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJ0NVUlJFTlQuJykgJiYgZmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKHN1ZmZpeCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGZpbHRlckNvbmRpdGlvbi5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJygnKSB8fCAhaXRlbUZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aCgnKScpKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3QgZmlsdGVyQ29uZGl0aW9uUGFydHMgPSBpdGVtRmlsdGVyQ29uZGl0aW9uLnNsaWNlKDEsIC0xKS5zcGxpdCgnKSBPUiAoJyk7XG4gICAgaWYgKGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IG9wdGltaXplZFBhcnRzID0gZmlsdGVyQ29uZGl0aW9uUGFydHNcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gdHJ5T3B0aW1pemUoeCwgcGFyYW1zLmNvdW50IC0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoICsgaSkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcbiAgICBpZiAob3B0aW1pemVkUGFydHMubGVuZ3RoICE9PSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBgKCR7b3B0aW1pemVkUGFydHMuam9pbignKSBPUiAoJyl9KWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheShyZXNvbHZlSXRlbVR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uID0gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoLCBpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZEZpbHRlckNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1TZWxlY3Rpb25zID0gZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChpdGVtU2VsZWN0aW9ucyAmJiBpdGVtU2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBmaWVsZFBhdGguc3BsaXQoJy4nKS5qb2luKCdfXycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgYWxpYXMsIGl0ZW1TZWxlY3Rpb25zLCBpdGVtVHlwZS5maWVsZHMgfHwge30pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1FeHByZXNzaW9uID0gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCggRk9SICR7YWxpYXN9IElOICR7ZmllbGRQYXRofSB8fCBbXSBSRVRVUk4gJHtpdGVtRXhwcmVzc2lvbn0gKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29tcGFuaW9uKG9uRmllbGQ6IHN0cmluZyk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24oX3BhcmFtcywgX3BhdGgsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmFsc2UnO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KF9wYXJlbnQsIF92YWx1ZSwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEpvaW5zXG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gb25GaWVsZCA9PT0gJ2lkJyA/ICdfa2V5JyA6IG9uRmllbGQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luQXJyYXkoXG4gICAgb25GaWVsZDogc3RyaW5nLFxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmQ29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlLFxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiA/R1NlbGVjdGlvblNldCwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGlzRmFzdDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4VG9TdHJpbmcoaW5kZXg6IEluZGV4SW5mbyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGluZGV4LmZpZWxkcy5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmRleChzOiBzdHJpbmcpOiBJbmRleEluZm8ge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkczogcy5zcGxpdCgnLCcpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoeCA9PiB4KSxcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5VG9TdHJpbmcob3JkZXJCeTogT3JkZXJCeVtdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gb3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9JHsoeC5kaXJlY3Rpb24gfHwgJycpID09PSAnREVTQycgPyAnIERFU0MnIDogJyd9YCkuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT3JkZXJCeShzOiBzdHJpbmcpOiBPcmRlckJ5W10ge1xuICAgIHJldHVybiBzLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCh4ID0+IHgudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKHggPT4geClcbiAgICAgICAgLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcgJykuZmlsdGVyKHggPT4geCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHBhcnRzWzBdLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogKHBhcnRzWzFdIHx8ICcnKS50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycgPyAnREVTQycgOiAnQVNDJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjYWxhckZpZWxkcyhzY2hlbWE6IERiU2NoZW1hKTogTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4oKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZvckRiVHlwZSh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNjYWxhckZpZWxkcy5zZXQoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogZG9jUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgYWRkRm9yRGJUeXBlKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNjaGVtYS50eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGFkZEZvckRiVHlwZSh0eXBlLCAnJywgJycpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjYWxhckZpZWxkcztcbn1cbiJdfQ==