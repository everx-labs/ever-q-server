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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJOT1RfSU1QTEVNRU5URUQiLCJFcnJvciIsImNvbWJpbmVQYXRoIiwiYmFzZSIsInBhdGgiLCJiIiwiZW5kc1dpdGgiLCJzbGljZSIsInAiLCJzdGFydHNXaXRoIiwic2VwIiwiUUV4cGxhbmF0aW9uIiwiY29uc3RydWN0b3IiLCJwYXJlbnRQYXRoIiwiZmllbGRzIiwiTWFwIiwiZXhwbGFpblNjYWxhck9wZXJhdGlvbiIsIm9wIiwic3Vic3RyIiwibGVuZ3RoIiwiZXhpc3RpbmciLCJnZXQiLCJvcGVyYXRpb25zIiwiYWRkIiwic2V0IiwiU2V0IiwiUVBhcmFtcyIsIm9wdGlvbnMiLCJjb3VudCIsInZhbHVlcyIsImV4cGxhbmF0aW9uIiwiZXhwbGFpbiIsImNsZWFyIiwidmFsdWUiLCJuYW1lIiwidG9TdHJpbmciLCJmaWVsZCIsImZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCIsImNvbmRpdGlvbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsImZpbHRlcktleSIsImZpbHRlclZhbHVlIiwiZmllbGRUeXBlIiwicHVzaCIsImNvbWJpbmVGaWx0ZXJDb25kaXRpb25zIiwiY29sbGVjdFJldHVybkV4cHJlc3Npb25zIiwiZXhwcmVzc2lvbnMiLCJmaWVsZERlZiIsImtpbmQiLCJyZXR1cm5lZCIsInJldHVybkV4cHJlc3Npb24iLCJleHByZXNzaW9uIiwiY29tYmluZVJldHVybkV4cHJlc3Npb25zIiwia2V5Iiwiam9pbiIsInRlc3RGaWVsZHMiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiZmlsdGVyQ29uZGl0aW9uT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImZpbHRlckNvbmRpdGlvbkZvckluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwiZmlsdGVyQ29uZGl0aW9uIiwiX3BhdGgiLCJfZGVmIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiZGVmIiwidW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nIiwiZCIsIkRhdGUiLCJwYWQiLCJudW1iZXIiLCJnZXRVVENGdWxsWWVhciIsImdldFVUQ01vbnRoIiwiZ2V0VVRDRGF0ZSIsImdldFVUQ0hvdXJzIiwiZ2V0VVRDTWludXRlcyIsImdldFVUQ1NlY29uZHMiLCJnZXRVVENNaWxsaXNlY29uZHMiLCJ0b0ZpeGVkIiwidW5peFNlY29uZHNUb1N0cmluZyIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsImludmVydGVkSGV4IiwiaGV4IiwiQXJyYXkiLCJmcm9tIiwiYyIsIk51bWJlciIsInBhcnNlSW50IiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwibmVnIiwicyIsInRyaW0iLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImJpZyIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsInJlc3VsdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJzZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25zIiwiaSIsImdldEl0ZW1GaWx0ZXJDb25kaXRpb24iLCJpdGVtVHlwZSIsIml0ZW1GaWx0ZXJDb25kaXRpb24iLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiaXNGaWVsZFBhdGgiLCJ0cnlPcHRpbWl6ZUFycmF5QW55IiwidHJ5T3B0aW1pemUiLCJwYXJhbUluZGV4Iiwic3VmZml4IiwiZmllbGRQYXRoIiwiZmlsdGVyQ29uZGl0aW9uUGFydHMiLCJzcGxpdCIsIm9wdGltaXplZFBhcnRzIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwib3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uIiwic3VjY2VlZGVkSW5kZXgiLCJpdGVtU2VsZWN0aW9ucyIsImFsaWFzIiwiaXRlbUV4cHJlc3Npb24iLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwic3RyaW5nQ29tcGFuaW9uIiwiX3BhcmFtcyIsIl9maWx0ZXIiLCJfcGFyZW50IiwiX3ZhbHVlIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsInRvTG93ZXJDYXNlIiwiY3JlYXRlU2NhbGFyRmllbGRzIiwic2NoZW1hIiwic2NhbGFyRmllbGRzIiwiYWRkRm9yRGJUeXBlIiwidHlwZSIsInBhcmVudERvY1BhdGgiLCJlbnVtRGVmIiwiZG9jTmFtZSIsImRvY1BhdGgiLCJhcnJheURlcHRoIiwiZGVwdGgiLCJjYXRlZ29yeSIsInR5cGVOYW1lIiwic2NhbGFyVHlwZXMiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7QUFyQkE7Ozs7Ozs7Ozs7Ozs7OztBQTBCQSxNQUFNQSxlQUFlLEdBQUcsSUFBSUMsS0FBSixDQUFVLGlCQUFWLENBQXhCOztBQTJCQSxTQUFTQyxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQU9NLE1BQU1HLFlBQU4sQ0FBbUI7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LEdBQUcsUUFBWDtBQUNILFdBRk0sTUFFQSxJQUFJbE4sS0FBSyxDQUFDME0sSUFBTixLQUFlUywyQkFBWUksTUFBL0IsRUFBdUM7QUFDMUNMLFlBQUFBLFFBQVEsR0FBRyxRQUFYO0FBQ0gsV0FGTSxNQUVBLElBQUlsTixLQUFLLENBQUMwTSxJQUFOLEtBQWVTLDJCQUFZSyxRQUEvQixFQUF5QztBQUM1Q04sWUFBQUEsUUFBUSxHQUFHLFVBQVg7QUFDSCxXQUZNLE1BRUE7QUFDSEEsWUFBQUEsUUFBUSxHQUFHLFFBQVg7QUFDSDs7QUFDRFYsVUFBQUEsWUFBWSxDQUFDcE4sR0FBYixDQUNJcEIsSUFESixFQUVJO0FBQ0kwTyxZQUFBQSxJQUFJLEVBQUVRLFFBRFY7QUFFSWxQLFlBQUFBLElBQUksRUFBRThPO0FBRlYsV0FGSjtBQU9BOztBQUNKLGFBQUssUUFBTDtBQUNBLGFBQUssT0FBTDtBQUNJTCxVQUFBQSxZQUFZLENBQUN6TSxLQUFLLENBQUMwTSxJQUFQLEVBQWExTyxJQUFiLEVBQW1COE8sT0FBbkIsQ0FBWjtBQUNBO0FBM0JKO0FBNkJILEtBL0NEO0FBZ0RIOztBQUdEUCxFQUFBQSxNQUFNLENBQUNrQixLQUFQLENBQWFqTixPQUFiLENBQXNCa00sSUFBRCxJQUFVO0FBQzNCRCxJQUFBQSxZQUFZLENBQUNDLElBQUQsRUFBTyxFQUFQLEVBQVcsRUFBWCxDQUFaO0FBQ0gsR0FGRDtBQUlBLFNBQU9GLFlBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5pbXBvcnQgdHlwZSB7QWNjZXNzUmlnaHRzfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7SW5kZXhJbmZvfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7c2NhbGFyVHlwZXN9IGZyb20gXCIuL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHtEYkZpZWxkLCBEYlNjaGVtYSwgRGJUeXBlfSBmcm9tIFwiLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuY29uc3QgTk9UX0lNUExFTUVOVEVEID0gbmV3IEVycm9yKCdOb3QgSW1wbGVtZW50ZWQnKTtcblxuZXhwb3J0IHR5cGUgR05hbWUgPSB7XG4gICAga2luZDogJ05hbWUnLFxuICAgIHZhbHVlOiBzdHJpbmcsXG59O1xuXG5leHBvcnQgdHlwZSBHRmllbGQgPSB7XG4gICAga2luZDogJ0ZpZWxkJyxcbiAgICBhbGlhczogc3RyaW5nLFxuICAgIG5hbWU6IEdOYW1lLFxuICAgIGFyZ3VtZW50czogR0RlZmluaXRpb25bXSxcbiAgICBkaXJlY3RpdmVzOiBHRGVmaW5pdGlvbltdLFxuICAgIHNlbGVjdGlvblNldDogdHlwZW9mIHVuZGVmaW5lZCB8IEdTZWxlY3Rpb25TZXQsXG59O1xuXG5leHBvcnQgdHlwZSBHRGVmaW5pdGlvbiA9IEdGaWVsZDtcblxuZXhwb3J0IHR5cGUgR1NlbGVjdGlvblNldCA9IHtcbiAgICBraW5kOiAnU2VsZWN0aW9uU2V0JyxcbiAgICBzZWxlY3Rpb25zOiBHRGVmaW5pdGlvbltdLFxufTtcblxuZXhwb3J0IHR5cGUgUUZpZWxkRXhwbGFuYXRpb24gPSB7XG4gICAgb3BlcmF0aW9uczogU2V0PHN0cmluZz4sXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVQYXRoKGJhc2U6IHN0cmluZywgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiID0gYmFzZS5lbmRzV2l0aCgnLicpID8gYmFzZS5zbGljZSgwLCAtMSkgOiBiYXNlO1xuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoJy4nKSA/IHBhdGguc2xpY2UoMSkgOiBwYXRoO1xuICAgIGNvbnN0IHNlcCA9IHAgJiYgYiA/ICcuJyA6ICcnO1xuICAgIHJldHVybiBgJHtifSR7c2VwfSR7cH1gO1xufVxuXG5leHBvcnQgdHlwZSBTY2FsYXJGaWVsZCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgdHlwZTogKCdudW1iZXInIHwgJ3VpbnQ2NCcgfCAndWludDEwMjQnIHwgJ2Jvb2xlYW4nIHwgJ3N0cmluZycpLFxufVxuXG5leHBvcnQgY2xhc3MgUUV4cGxhbmF0aW9uIHtcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmc7XG4gICAgZmllbGRzOiBNYXA8c3RyaW5nLCBRRmllbGRFeHBsYW5hdGlvbj47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wYXJlbnRQYXRoID0gJyc7XG4gICAgICAgIHRoaXMuZmllbGRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBwID0gcGF0aDtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQ1VSUkVOVCcpKSB7XG4gICAgICAgICAgICBwID0gY29tYmluZVBhdGgodGhpcy5wYXJlbnRQYXRoLCBwLnN1YnN0cignQ1VSUkVOVCcubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3Rpbmc6IFFGaWVsZEV4cGxhbmF0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHRoaXMuZmllbGRzLmdldChwKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5vcGVyYXRpb25zLmFkZChvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkcy5zZXQocCwge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IG5ldyBTZXQoW29wXSksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBRUGFyYW1zT3B0aW9ucyA9IHtcbiAgICBleHBsYWluPzogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUVBhcmFtc09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuZXhwbGFuYXRpb24gPSAob3B0aW9ucyAmJiBvcHRpb25zLmV4cGxhaW4pXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxudHlwZSBRUmV0dXJuRXhwcmVzc2lvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgZXhwcmVzc2lvbjogc3RyaW5nLFxufTtcblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgZmllbGRzPzogeyBbc3RyaW5nXTogUVR5cGUgfSxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBmaWx0ZXJDb25kaXRpb246IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcblxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBBUUwgZXhwcmVzc2lvbiBmb3IgcmV0dXJuIHNlY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICAgICAqIEBwYXJhbSB7R0RlZmluaXRpb259IGRlZlxuICAgICAqL1xuICAgIHJldHVybkV4cHJlc3Npb246IChwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pID0+IFFSZXR1cm5FeHByZXNzaW9uLFxuXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZyxcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgIGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWVsZHM6IEdEZWZpbml0aW9uW10sXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbikge1xuICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZERlZjogR0ZpZWxkKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWVsZERlZi5uYW1lICYmIGZpZWxkRGVmLm5hbWUudmFsdWUgfHwgJyc7XG4gICAgICAgIGlmIChuYW1lID09PSAnJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlbGVjdGlvbiBmaWVsZDogJHtmaWVsZERlZi5raW5kfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5hbWUgPT09ICdfX3R5cGVuYW1lJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7bmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXR1cm5lZCA9IGZpZWxkVHlwZS5yZXR1cm5FeHByZXNzaW9uKHBhdGgsIGZpZWxkRGVmKTtcbiAgICAgICAgZXhwcmVzc2lvbnMuc2V0KHJldHVybmVkLm5hbWUsIHJldHVybmVkLmV4cHJlc3Npb24pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBleHByZXNzaW9ucykge1xuICAgICAgICBmaWVsZHMucHVzaChgJHtrZXl9OiAke3ZhbHVlfWApO1xuICAgIH1cbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbignLCAnKX0gfWA7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIG9wKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA9IChwYXRoID09PSAnX2tleScgfHwgcGF0aC5lbmRzV2l0aCgnLl9rZXknKSkgJiYgb3AgIT09ICc9PScgJiYgb3AgIT09ICchPSc7XG4gICAgY29uc3QgZml4ZWRQYXRoID0gaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPT0nLCB2YWx1ZSkpO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNjYWxhcnNcblxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCA/IHYgOiBudWxsO1xufVxuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7ZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgbGV0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGlmIChuYW1lID09PSAnaWQnICYmIHBhdGggPT09ICdkb2MnKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9ICdfa2V5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gaW52ZXJ0ZWRIZXgoaGV4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcbiAgICAgICAgLm1hcChjID0+IChOdW1iZXIucGFyc2VJbnQoYywgMTYpIF4gMHhmKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcbiAgICAgICAgaGV4ID0gYDB4JHsobmVnID8gLXZhbHVlIDogdmFsdWUpLnRvU3RyaW5nKDE2KX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgbmVnID0gcy5zdGFydHNXaXRoKCctJyk7XG4gICAgICAgIGhleCA9IGAweCR7bmVnID8gaW52ZXJ0ZWRIZXgocy5zdWJzdHIocHJlZml4TGVuZ3RoICsgMSkpIDogcy5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gYCR7bmVnID8gJy0nIDogJyd9JHsoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBiaWc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcbiAgICByZXR1cm4gbmVnID8gYC0ke2ludmVydGVkSGV4KHJlc3VsdCl9YCA6IHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBjb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5leHBvcnQgY29uc3QgYmlnVUludDE6IFFUeXBlID0gY3JlYXRlQmlnVUludCgxKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MjogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDIpO1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RydWN0c1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPcihmaWx0ZXI6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xuICAgIGxldCBvcGVyYW5kID0gZmlsdGVyO1xuICAgIHdoaWxlIChvcGVyYW5kKSB7XG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXRPciA9IE9iamVjdC5hc3NpZ24oe30sIG9wZXJhbmQpO1xuICAgICAgICAgICAgZGVsZXRlIHdpdGhvdXRPclsnT1InXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7ZGVmLm5hbWUudmFsdWV9YCxcbiAgICAgICAgICAgICAgICAoZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnMpIHx8IFtdLFxuICAgICAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IGRlZi5uYW1lLnZhbHVlLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdEZpZWxkcyh2YWx1ZSwgb3JPcGVyYW5kc1tpXSwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBsZXQgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nO1xuICAgIGNvbnN0IGV4cGxhbmF0aW9uID0gcGFyYW1zLmV4cGxhbmF0aW9uO1xuICAgIGlmIChleHBsYW5hdGlvbikge1xuICAgICAgICBjb25zdCBzYXZlUGFyZW50UGF0aCA9IGV4cGxhbmF0aW9uLnBhcmVudFBhdGg7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBgJHtleHBsYW5hdGlvbi5wYXJlbnRQYXRofSR7cGF0aH1bKl1gO1xuICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uID0gaXRlbVR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gc2F2ZVBhcmVudFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1GaWx0ZXJDb25kaXRpb247XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGaWVsZFBhdGhDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoYyA+PSAnQScgJiYgYyA8PSAnWicpXG4gICAgICAgIHx8IChjID49ICdhJyAmJiBjIDw9ICd6JylcbiAgICAgICAgfHwgKGMgPj0gJzAnICYmIGMgPD0gJzknKVxuICAgICAgICB8fCAoYyA9PT0gJ18nIHx8IGMgPT09ICdbJyB8fCBjID09PSAnKicgfHwgYyA9PT0gJ10nIHx8IGMgPT09ICcuJyk7XG59XG5cbmZ1bmN0aW9uIGlzRmllbGRQYXRoKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGVzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoIWlzVmFsaWRGaWVsZFBhdGhDaGFyKHRlc3RbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyeU9wdGltaXplQXJyYXlBbnkocGF0aDogc3RyaW5nLCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmcsIHBhcmFtczogUVBhcmFtcyk6ID9zdHJpbmcge1xuICAgIGZ1bmN0aW9uIHRyeU9wdGltaXplKGZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbUluZGV4OiBudW1iZXIpOiA/c3RyaW5nIHtcbiAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbUluZGV4ICsgMX1gO1xuICAgICAgICBjb25zdCBzdWZmaXggPSBgID09ICR7cGFyYW1OYW1lfWA7XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24gPT09IGBDVVJSRU5UJHtzdWZmaXh9YCkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCdDVVJSRU5ULicpICYmIGZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBmaWx0ZXJDb25kaXRpb24uc2xpY2UoJ0NVUlJFTlQuJy5sZW5ndGgsIC1zdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgICAgIGlmIChpc0ZpZWxkUGF0aChmaWVsZFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXS4ke2ZpZWxkUGF0aH1gO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmICghaXRlbUZpbHRlckNvbmRpdGlvbi5zdGFydHNXaXRoKCcoJykgfHwgIWl0ZW1GaWx0ZXJDb25kaXRpb24uZW5kc1dpdGgoJyknKSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbHRlckNvbmRpdGlvblBhcnRzID0gaXRlbUZpbHRlckNvbmRpdGlvbi5zbGljZSgxLCAtMSkuc3BsaXQoJykgT1IgKCcpO1xuICAgIGlmIChmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xuICAgIH1cbiAgICBjb25zdCBvcHRpbWl6ZWRQYXJ0cyA9IGZpbHRlckNvbmRpdGlvblBhcnRzXG4gICAgICAgIC5tYXAoKHgsIGkpID0+IHRyeU9wdGltaXplKHgsIHBhcmFtcy5jb3VudCAtIGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCArIGkpKVxuICAgICAgICAuZmlsdGVyKHggPT4geCAhPT0gbnVsbCk7XG4gICAgaWYgKG9wdGltaXplZFBhcnRzLmxlbmd0aCAhPT0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gYCgke29wdGltaXplZFBhcnRzLmpvaW4oJykgT1IgKCcpfSlgO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBnZXRJdGVtRmlsdGVyQ29uZGl0aW9uKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1GaWx0ZXJDb25kaXRpb259XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZEZpbHRlckNvbmRpdGlvbiA9IHRyeU9wdGltaXplQXJyYXlBbnkocGF0aCwgaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZGVmLm5hbWUudmFsdWU7XG4gICAgICAgICAgICBjb25zdCBpdGVtU2VsZWN0aW9ucyA9IGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgICAgICAgICAgbGV0IGV4cHJlc3Npb247XG4gICAgICAgICAgICBpZiAoaXRlbVNlbGVjdGlvbnMgJiYgaXRlbVNlbGVjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGAke3BhdGh9LiR7bmFtZX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gZmllbGRQYXRoLnNwbGl0KCcuJykuam9pbignX18nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsIGFsaWFzLCBpdGVtU2VsZWN0aW9ucywgaXRlbVR5cGUuZmllbGRzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRXhwcmVzc2lvbiA9IGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoIEZPUiAke2FsaWFzfSBJTiAke2ZpZWxkUGF0aH0gfHwgW10gUkVUVVJOICR7aXRlbUV4cHJlc3Npb259IClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbixcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RyaW5nIENvbXBhbmlvbnNcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ0NvbXBhbmlvbihvbkZpZWxkOiBzdHJpbmcpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKF9wYXJhbXMsIF9wYXRoLCBfZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ZhbHNlJztcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChfcGFyZW50LCBfdmFsdWUsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBKb2luc1xuXG5leHBvcnQgZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IG9uRmllbGQgPT09ICdpZCcgPyAnX2tleScgOiBvbkZpZWxkO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbkFycmF5KFxuICAgIG9uRmllbGQ6IHN0cmluZyxcbiAgICByZWZGaWVsZDogc3RyaW5nLFxuICAgIHJlZkNvbGxlY3Rpb246IHN0cmluZyxcbiAgICByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUsXG4pOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmRmlsdGVyQ29uZGl0aW9ufSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZSxcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogP0dTZWxlY3Rpb25TZXQsIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGRvYykpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5tYXAoeCA9PiBzZWxlY3RGaWVsZHMoeCwgc2VsZWN0aW9uKSk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkRm9ySm9pbiA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6IFsnaW5fbXNnJ10sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFsnb3V0X21zZyddLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogWydpZCddLFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAocmVxdWlyZWRGb3JKb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NbZmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbZmllbGRdID0gZG9jW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXG4gICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCB0eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBpc0Zhc3Q6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleFRvU3RyaW5nKGluZGV4OiBJbmRleEluZm8pOiBzdHJpbmcge1xuICAgIHJldHVybiBpbmRleC5maWVsZHMuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5kZXgoczogc3RyaW5nKTogSW5kZXhJbmZvIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHM6IHMuc3BsaXQoJywnKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKHggPT4geCksXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY2FsYXJGaWVsZHMoc2NoZW1hOiBEYlNjaGVtYSk6IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+KCk7XG5cbiAgICBmdW5jdGlvbiBhZGRGb3JEYlR5cGUodHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzY2FsYXJGaWVsZHMuc2V0KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGRvY1BhdGgsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGFkZEZvckRiVHlwZShmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBzY2hlbWEudHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICBhZGRGb3JEYlR5cGUodHlwZSwgJycsICcnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzY2FsYXJGaWVsZHM7XG59XG4iXX0=