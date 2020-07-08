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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJOT1RfSU1QTEVNRU5URUQiLCJFcnJvciIsImNvbWJpbmVQYXRoIiwiYmFzZSIsInBhdGgiLCJiIiwiZW5kc1dpdGgiLCJzbGljZSIsInAiLCJzdGFydHNXaXRoIiwic2VwIiwiUUV4cGxhbmF0aW9uIiwiY29uc3RydWN0b3IiLCJwYXJlbnRQYXRoIiwiZmllbGRzIiwiTWFwIiwiZXhwbGFpblNjYWxhck9wZXJhdGlvbiIsIm9wIiwic3Vic3RyIiwibGVuZ3RoIiwiZXhpc3RpbmciLCJnZXQiLCJvcGVyYXRpb25zIiwiYWRkIiwic2V0IiwiU2V0IiwiUVBhcmFtcyIsIm9wdGlvbnMiLCJjb3VudCIsInZhbHVlcyIsImV4cGxhbmF0aW9uIiwiZXhwbGFpbiIsImNsZWFyIiwidmFsdWUiLCJuYW1lIiwidG9TdHJpbmciLCJmaWVsZCIsImZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCIsImNvbmRpdGlvbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsImZpbHRlcktleSIsImZpbHRlclZhbHVlIiwiZmllbGRUeXBlIiwicHVzaCIsImNvbWJpbmVGaWx0ZXJDb25kaXRpb25zIiwiY29sbGVjdFJldHVybkV4cHJlc3Npb25zIiwiZXhwcmVzc2lvbnMiLCJmaWVsZERlZiIsImtpbmQiLCJyZXR1cm5lZCIsInJldHVybkV4cHJlc3Npb24iLCJleHByZXNzaW9uIiwiY29tYmluZVJldHVybkV4cHJlc3Npb25zIiwia2V5Iiwiam9pbiIsInRlc3RGaWVsZHMiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiZmlsdGVyQ29uZGl0aW9uT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiZGVmIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJzZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25zIiwiaSIsImdldEl0ZW1GaWx0ZXJDb25kaXRpb24iLCJpdGVtVHlwZSIsIml0ZW1GaWx0ZXJDb25kaXRpb24iLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiaXNGaWVsZFBhdGgiLCJ0cnlPcHRpbWl6ZUFycmF5QW55IiwidHJ5T3B0aW1pemUiLCJwYXJhbUluZGV4Iiwic3VmZml4IiwiZmllbGRQYXRoIiwiZmlsdGVyQ29uZGl0aW9uUGFydHMiLCJzcGxpdCIsIm9wdGltaXplZFBhcnRzIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwib3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uIiwic3VjY2VlZGVkSW5kZXgiLCJpdGVtU2VsZWN0aW9ucyIsImFsaWFzIiwiaXRlbUV4cHJlc3Npb24iLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwic3RyaW5nQ29tcGFuaW9uIiwiX3BhcmFtcyIsIl9maWx0ZXIiLCJfcGFyZW50IiwiX3ZhbHVlIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsInRvTG93ZXJDYXNlIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImRvY1BhdGgiLCJhcnJheURlcHRoIiwiZGVwdGgiLCJjYXRlZ29yeSIsInR5cGVOYW1lIiwic2NhbGFyVHlwZXMiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQTBCQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQU9NLE1BQU1HLFlBQU4sQ0FBbUI7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QUNILFdBRk0sTUFFQSxJQUFJbE4sS0FBSyxDQUFDME0sSUFBTixLQUFlUywyQkFBWUcsR0FBL0IsRUFBb0M7QUFDdkNKLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUlsTixLQUFLLENBQUMwTSxJQUFOLEtBQWVTLDJCQUFZSSxNQUEvQixFQUF1QztBQUMxQ0wsWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSCxXQUZNLE1BRUEsSUFBSWxOLEtBQUssQ0FBQzBNLElBQU4sS0FBZVMsMkJBQVlLLFFBQS9CLEVBQXlDO0FBQzVDTixZQUFBQSxRQUFRLEdBQUcsVUFBWDtBQUNILFdBRk0sTUFFQTtBQUNIQSxZQUFBQSxRQUFRLEdBQUcsUUFBWDtBQUNIOztBQUNEVixVQUFBQSxZQUFZLENBQUNwTixHQUFiLENBQ0lwQixJQURKLEVBRUk7QUFDSTBPLFlBQUFBLElBQUksRUFBRVEsUUFEVjtBQUVJbFAsWUFBQUEsSUFBSSxFQUFFOE87QUFGVixXQUZKO0FBT0E7O0FBQ0osYUFBSyxRQUFMO0FBQ0EsYUFBSyxPQUFMO0FBQ0lMLFVBQUFBLFlBQVksQ0FBQ3pNLEtBQUssQ0FBQzBNLElBQVAsRUFBYTFPLElBQWIsRUFBbUI4TyxPQUFuQixDQUFaO0FBQ0E7QUEzQko7QUE2QkgsS0EvQ0Q7QUFnREg7O0FBR0RQLEVBQUFBLE1BQU0sQ0FBQ2tCLEtBQVAsQ0FBYWpOLE9BQWIsQ0FBc0JrTSxJQUFELElBQVU7QUFDM0JELElBQUFBLFlBQVksQ0FBQ0MsSUFBRCxFQUFPLEVBQVAsRUFBVyxFQUFYLENBQVo7QUFDSCxHQUZEO0FBSUEsU0FBT0YsWUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHtBY2Nlc3NSaWdodHN9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB0eXBlIHtJbmRleEluZm99IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHtzY2FsYXJUeXBlc30gZnJvbSBcIi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuaW1wb3J0IHR5cGUge0RiRmllbGQsIERiU2NoZW1hLCBEYlR5cGV9IGZyb20gXCIuL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5jb25zdCBOT1RfSU1QTEVNRU5URUQgPSBuZXcgRXJyb3IoJ05vdCBJbXBsZW1lbnRlZCcpO1xuXG5leHBvcnQgdHlwZSBHTmFtZSA9IHtcbiAgICBraW5kOiAnTmFtZScsXG4gICAgdmFsdWU6IHN0cmluZyxcbn07XG5cbmV4cG9ydCB0eXBlIEdGaWVsZCA9IHtcbiAgICBraW5kOiAnRmllbGQnLFxuICAgIGFsaWFzOiBzdHJpbmcsXG4gICAgbmFtZTogR05hbWUsXG4gICAgYXJndW1lbnRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGRpcmVjdGl2ZXM6IEdEZWZpbml0aW9uW10sXG4gICAgc2VsZWN0aW9uU2V0OiB0eXBlb2YgdW5kZWZpbmVkIHwgR1NlbGVjdGlvblNldCxcbn07XG5cbmV4cG9ydCB0eXBlIEdEZWZpbml0aW9uID0gR0ZpZWxkO1xuXG5leHBvcnQgdHlwZSBHU2VsZWN0aW9uU2V0ID0ge1xuICAgIGtpbmQ6ICdTZWxlY3Rpb25TZXQnLFxuICAgIHNlbGVjdGlvbnM6IEdEZWZpbml0aW9uW10sXG59O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCB0eXBlIFNjYWxhckZpZWxkID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICB0eXBlOiAoJ251bWJlcicgfCAndWludDY0JyB8ICd1aW50MTAyNCcgfCAnYm9vbGVhbicgfCAnc3RyaW5nJyksXG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBhcmVudFBhdGggPSAnJztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHAgPSBwYXRoO1xuICAgICAgICBpZiAocC5zdGFydHNXaXRoKCdDVVJSRU5UJykpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZzogUUZpZWxkRXhwbGFuYXRpb24gfCB0eXBlb2YgdW5kZWZpbmVkID0gdGhpcy5maWVsZHMuZ2V0KHApO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uczogbmV3IFNldChbb3BdKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG50eXBlIFFSZXR1cm5FeHByZXNzaW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBleHByZXNzaW9uOiBzdHJpbmcsXG59O1xuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICBmaWVsZHM/OiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIGZpbHRlckNvbmRpdGlvbjogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIEFRTCBleHByZXNzaW9uIGZvciByZXR1cm4gc2VjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHBhcmFtIHtHRGVmaW5pdGlvbn0gZGVmXG4gICAgICovXG4gICAgcmV0dXJuRXhwcmVzc2lvbjogKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbikgPT4gUVJldHVybkV4cHJlc3Npb24sXG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKGZpbHRlckNvbmRpdGlvbkZvckZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgZXhwcmVzc2lvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4sXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpZWxkczogR0RlZmluaXRpb25bXSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuKSB7XG4gICAgZmllbGRzLmZvckVhY2goKGZpZWxkRGVmOiBHRmllbGQpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZSA9IGZpZWxkRGVmLm5hbWUgJiYgZmllbGREZWYubmFtZS52YWx1ZSB8fCAnJztcbiAgICAgICAgaWYgKG5hbWUgPT09ICcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke2ZpZWxkRGVmLmtpbmR9YCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmFtZSA9PT0gJ19fdHlwZW5hbWUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW25hbWVdO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtuYW1lfWApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJldHVybmVkID0gZmllbGRUeXBlLnJldHVybkV4cHJlc3Npb24ocGF0aCwgZmllbGREZWYpO1xuICAgICAgICBleHByZXNzaW9ucy5zZXQocmV0dXJuZWQubmFtZSwgcmV0dXJuZWQuZXhwcmVzc2lvbik7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnM6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGZpZWxkcyA9IFtdO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGV4cHJlc3Npb25zKSB7XG4gICAgICAgIGZpZWxkcy5wdXNoKGAke2tleX06ICR7dmFsdWV9YCk7XG4gICAgfVxuICAgIHJldHVybiBgeyAke2ZpZWxkcy5qb2luKCcsICcpfSB9YDtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuLFxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlcil9KWA7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdpZCcgJiYgcGF0aCA9PT0gJ2RvYycpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gJ19rZXknO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh2YWx1ZSk7XG5cbiAgICBmdW5jdGlvbiBwYWQobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAxMCkge1xuICAgICAgICAgICAgcmV0dXJuICcwJyArIG51bWJlcjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVtYmVyO1xuICAgIH1cblxuICAgIHJldHVybiBkLmdldFVUQ0Z1bGxZZWFyKCkgK1xuICAgICAgICAnLScgKyBwYWQoZC5nZXRVVENNb250aCgpICsgMSkgK1xuICAgICAgICAnLScgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcbiAgICAgICAgJyAnICsgcGFkKGQuZ2V0VVRDSG91cnMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZC5nZXRVVENNaW51dGVzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDU2Vjb25kcygpKSArXG4gICAgICAgICcuJyArIChkLmdldFVUQ01pbGxpc2Vjb25kcygpIC8gMTAwMCkudG9GaXhlZCgzKS5zbGljZSgyLCA1KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhTZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nKHZhbHVlICogMTAwMCk7XG59XG5cbmNvbnN0IEJpZ051bWJlckZvcm1hdCA9IHtcbiAgICBIRVg6ICdIRVgnLFxuICAgIERFQzogJ0RFQycsXG59O1xuXG5mdW5jdGlvbiBpbnZlcnRlZEhleChoZXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oaGV4KVxuICAgICAgICAubWFwKGMgPT4gKE51bWJlci5wYXJzZUludChjLCAxNikgXiAweGYpLnRvU3RyaW5nKDE2KSlcbiAgICAgICAgLmpvaW4oJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnksIGFyZ3M/OiB7IGZvcm1hdD86ICdIRVgnIHwgJ0RFQycgfSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBsZXQgbmVnO1xuICAgIGxldCBoZXg7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgbmVnID0gdmFsdWUgPCAwO1xuICAgICAgICBoZXggPSBgMHgkeyhuZWcgPyAtdmFsdWUgOiB2YWx1ZSkudG9TdHJpbmcoMTYpfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICBuZWcgPSBzLnN0YXJ0c1dpdGgoJy0nKTtcbiAgICAgICAgaGV4ID0gYDB4JHtuZWcgPyBpbnZlcnRlZEhleChzLnN1YnN0cihwcmVmaXhMZW5ndGggKyAxKSkgOiBzLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG4gICAgfVxuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xuICAgIHJldHVybiBgJHtuZWcgPyAnLScgOiAnJ30keyhmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IGJpZztcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBzID0gdmFsdWUudHJpbSgpO1xuICAgICAgICBiaWcgPSBzLnN0YXJ0c1dpdGgoJy0nKSA/IC1CaWdJbnQocy5zdWJzdHIoMSkpIDogQmlnSW50KHMpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGJpZyA9IEJpZ0ludCh2YWx1ZSk7XG4gICAgfVxuICAgIGNvbnN0IG5lZyA9IGJpZyA8IEJpZ0ludCgwKTtcbiAgICBjb25zdCBoZXggPSAobmVnID8gLWJpZyA6IGJpZykudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IChoZXgubGVuZ3RoIC0gMSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIGNvbnN0IHJlc3VsdCA9IGAke3ByZWZpeH0ke2hleH1gO1xuICAgIHJldHVybiBuZWcgPyBgLSR7aW52ZXJ0ZWRIZXgocmVzdWx0KX1gIDogcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKCdPUicgaW4gb3BlcmFuZCkge1xuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XG4gICAgICAgICAgICBkZWxldGUgd2l0aG91dE9yWydPUiddO1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaCh3aXRob3V0T3IpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKG9wZXJhbmQpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wZXJhbmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHMsXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKS5tYXAoKG9wZXJhbmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIG9wZXJhbmQsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgY29tYmluZVBhdGgocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKG9yT3BlcmFuZHMubGVuZ3RoID4gMSkgPyBgKCR7b3JPcGVyYW5kcy5qb2luKCcpIE9SICgnKX0pYCA6IG9yT3BlcmFuZHNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICAgICAgYCR7cGF0aH0uJHtkZWYubmFtZS52YWx1ZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogZGVmLm5hbWUudmFsdWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JPcGVyYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbUZpbHRlckNvbmRpdGlvbjtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEZpZWxkUGF0aENoYXIoYzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChjID49ICdBJyAmJiBjIDw9ICdaJylcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxuICAgICAgICB8fCAoYyA+PSAnMCcgJiYgYyA8PSAnOScpXG4gICAgICAgIHx8IChjID09PSAnXycgfHwgYyA9PT0gJ1snIHx8IGMgPT09ICcqJyB8fCBjID09PSAnXScgfHwgYyA9PT0gJy4nKTtcbn1cblxuZnVuY3Rpb24gaXNGaWVsZFBhdGgodGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICghaXNWYWxpZEZpZWxkUGF0aENoYXIodGVzdFtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoOiBzdHJpbmcsIGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1zOiBRUGFyYW1zKTogP3N0cmluZyB7XG4gICAgZnVuY3Rpb24gdHJ5T3B0aW1pemUoZmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtSW5kZXg6IG51bWJlcik6ID9zdHJpbmcge1xuICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtSW5kZXggKyAxfWA7XG4gICAgICAgIGNvbnN0IHN1ZmZpeCA9IGAgPT0gJHtwYXJhbU5hbWV9YDtcbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbiA9PT0gYENVUlJFTlQke3N1ZmZpeH1gKSB7XG4gICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJ0NVUlJFTlQuJykgJiYgZmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKHN1ZmZpeCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGZpbHRlckNvbmRpdGlvbi5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoJygnKSB8fCAhaXRlbUZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aCgnKScpKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3QgZmlsdGVyQ29uZGl0aW9uUGFydHMgPSBpdGVtRmlsdGVyQ29uZGl0aW9uLnNsaWNlKDEsIC0xKS5zcGxpdCgnKSBPUiAoJyk7XG4gICAgaWYgKGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IG9wdGltaXplZFBhcnRzID0gZmlsdGVyQ29uZGl0aW9uUGFydHNcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gdHJ5T3B0aW1pemUoeCwgcGFyYW1zLmNvdW50IC0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoICsgaSkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcbiAgICBpZiAob3B0aW1pemVkUGFydHMubGVuZ3RoICE9PSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBgKCR7b3B0aW1pemVkUGFydHMuam9pbignKSBPUiAoJyl9KWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheShyZXNvbHZlSXRlbVR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uID0gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoLCBpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZEZpbHRlckNvbmRpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1TZWxlY3Rpb25zID0gZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChpdGVtU2VsZWN0aW9ucyAmJiBpdGVtU2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBmaWVsZFBhdGguc3BsaXQoJy4nKS5qb2luKCdfXycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgICAgIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucywgYWxpYXMsIGl0ZW1TZWxlY3Rpb25zLCBpdGVtVHlwZS5maWVsZHMgfHwge30pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1FeHByZXNzaW9uID0gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKTtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCggRk9SICR7YWxpYXN9IElOICR7ZmllbGRQYXRofSB8fCBbXSBSRVRVUk4gJHtpdGVtRXhwcmVzc2lvbn0gKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH1cbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJpbmcgQ29tcGFuaW9uc1xuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nQ29tcGFuaW9uKG9uRmllbGQ6IHN0cmluZyk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24oX3BhcmFtcywgX3BhdGgsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAnZmFsc2UnO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KF9wYXJlbnQsIF92YWx1ZSwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEpvaW5zXG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gb25GaWVsZCA9PT0gJ2lkJyA/ICdfa2V5JyA6IG9uRmllbGQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luQXJyYXkoXG4gICAgb25GaWVsZDogc3RyaW5nLFxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmQ29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCk6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZTogb25GaWVsZCxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke29uRmllbGR9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlLFxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiA/R1NlbGVjdGlvblNldCwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGlzRmFzdDogYm9vbGVhbixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4VG9TdHJpbmcoaW5kZXg6IEluZGV4SW5mbyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGluZGV4LmZpZWxkcy5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VJbmRleChzOiBzdHJpbmcpOiBJbmRleEluZm8ge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkczogcy5zcGxpdCgnLCcpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoeCA9PiB4KSxcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5VG9TdHJpbmcob3JkZXJCeTogT3JkZXJCeVtdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gb3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9JHsoeC5kaXJlY3Rpb24gfHwgJycpID09PSAnREVTQycgPyAnIERFU0MnIDogJyd9YCkuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT3JkZXJCeShzOiBzdHJpbmcpOiBPcmRlckJ5W10ge1xuICAgIHJldHVybiBzLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCh4ID0+IHgudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKHggPT4geClcbiAgICAgICAgLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcgJykuZmlsdGVyKHggPT4geCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHBhcnRzWzBdLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogKHBhcnRzWzFdIHx8ICcnKS50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycgPyAnREVTQycgOiAnQVNDJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjYWxhckZpZWxkcyhzY2hlbWE6IERiU2NoZW1hKTogTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4oKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZvckRiVHlwZSh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSBmaWVsZC5uYW1lID09PSAnaWQnID8gJ19rZXknIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gJ1sqXSc7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZGVwdGggPSAxMDsgZGVwdGggPiAwOyBkZXB0aCAtPSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBgWyR7JyonLnJlcGVhdChkZXB0aCl9XWA7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NQYXRoLmluY2x1ZGVzKHMpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWZmaXggPSBgWyR7JyonLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdib29sZWFuJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmZsb2F0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnbnVtYmVyJztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICd1aW50NjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMudWludDEwMjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDEwMjQnO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3N0cmluZyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNjYWxhckZpZWxkcy5zZXQoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogZG9jUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgYWRkRm9yRGJUeXBlKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNjaGVtYS50eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGFkZEZvckRiVHlwZSh0eXBlLCAnJywgJycpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNjYWxhckZpZWxkcztcbn1cbiJdfQ==