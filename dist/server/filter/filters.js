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

function filterConditionForIn(params, path, filter, op) {
  const conditions = filter.map(value => filterConditionOp(params, path, op, value));
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
    return filterConditionForIn(params, path, filter, "==");
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

function createScalar() {
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        return op.filterCondition(params, path, filterValue);
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
        return op.test(parent, undefinedToNull(value), converted);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9uIiwiZXhwcmVzc2lvbiIsImNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyIsImtleSIsImpvaW4iLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImZpbHRlckNvbmRpdGlvbk9wIiwicGFyYW1zIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJmaWx0ZXJDb25kaXRpb25Gb3JJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsImZpbHRlckNvbmRpdGlvbiIsIl9wYXRoIiwiX2RlZiIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwiaW4iLCJub3RJbiIsImNyZWF0ZVNjYWxhciIsImRlZiIsImlzQ29sbGVjdGlvbiIsInVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyIsImQiLCJEYXRlIiwicGFkIiwibnVtYmVyIiwiZ2V0VVRDRnVsbFllYXIiLCJnZXRVVENNb250aCIsImdldFVUQ0RhdGUiLCJnZXRVVENIb3VycyIsImdldFVUQ01pbnV0ZXMiLCJnZXRVVENTZWNvbmRzIiwiZ2V0VVRDTWlsbGlzZWNvbmRzIiwidG9GaXhlZCIsInVuaXhTZWNvbmRzVG9TdHJpbmciLCJCaWdOdW1iZXJGb3JtYXQiLCJIRVgiLCJERUMiLCJpbnZlcnRlZEhleCIsImhleCIsIkFycmF5IiwiZnJvbSIsImMiLCJOdW1iZXIiLCJwYXJzZUludCIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwiYXJncyIsIm5lZyIsInMiLCJ0cmltIiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJiaWciLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJyZXN1bHQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzcGxpdE9yIiwib3BlcmFuZHMiLCJvcGVyYW5kIiwid2l0aG91dE9yIiwiYXNzaWduIiwiT1IiLCJzdHJ1Y3QiLCJvck9wZXJhbmRzIiwiZmllbGROYW1lIiwic2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9ucyIsImkiLCJnZXRJdGVtRmlsdGVyQ29uZGl0aW9uIiwiaXRlbVR5cGUiLCJpdGVtRmlsdGVyQ29uZGl0aW9uIiwic2F2ZVBhcmVudFBhdGgiLCJpc1ZhbGlkRmllbGRQYXRoQ2hhciIsImlzRmllbGRQYXRoIiwidHJ5T3B0aW1pemVBcnJheUFueSIsInRyeU9wdGltaXplIiwicGFyYW1JbmRleCIsInN1ZmZpeCIsImZpZWxkUGF0aCIsImZpbHRlckNvbmRpdGlvblBhcnRzIiwic3BsaXQiLCJvcHRpbWl6ZWRQYXJ0cyIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsIm9wdGltaXplZEZpbHRlckNvbmRpdGlvbiIsInN1Y2NlZWRlZEluZGV4IiwiaXRlbVNlbGVjdGlvbnMiLCJhbGlhcyIsIml0ZW1FeHByZXNzaW9uIiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJvbl9wYXRoIiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInN0cmluZ0NvbXBhbmlvbiIsIl9wYXJhbXMiLCJfZmlsdGVyIiwiX3BhcmVudCIsIl92YWx1ZSIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsInJlc29sdmVSZWZUeXBlIiwicmVmVHlwZSIsInJlcGxhY2UiLCJyZWZGaWx0ZXJDb25kaXRpb24iLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwiaXRlbSIsInNlbGVjdGlvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmllbGRTZWxlY3Rpb24iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsImluZGV4VG9TdHJpbmciLCJpbmRleCIsInBhcnNlSW5kZXgiLCJvcmRlckJ5VG9TdHJpbmciLCJvcmRlckJ5IiwiZGlyZWN0aW9uIiwicGFyc2VPcmRlckJ5IiwicGFydHMiLCJ0b0xvd2VyQ2FzZSIsImNyZWF0ZVNjYWxhckZpZWxkcyIsInNjaGVtYSIsInNjYWxhckZpZWxkcyIsImFkZEZvckRiVHlwZSIsInR5cGUiLCJwYXJlbnREb2NQYXRoIiwiZW51bURlZiIsImRvY05hbWUiLCJjb2xsZWN0aW9uIiwiZG9jUGF0aCIsImFycmF5RGVwdGgiLCJkZXB0aCIsImNhdGVnb3J5IiwidHlwZU5hbWUiLCJzY2FsYXJUeXBlcyIsImJvb2xlYW4iLCJmbG9hdCIsImludCIsInVpbnQ2NCIsInVpbnQxMDI0IiwidHlwZXMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOztBQXJCQTs7Ozs7Ozs7Ozs7Ozs7O0FBMEJBLE1BQU1BLGVBQWUsR0FBRyxJQUFJQyxLQUFKLENBQVUsaUJBQVYsQ0FBeEI7O0FBMkJBLFNBQVNDLFdBQVQsQ0FBcUJDLElBQXJCLEVBQW1DQyxJQUFuQyxFQUF5RDtBQUNyRCxRQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBTCxDQUFjLEdBQWQsSUFBcUJILElBQUksQ0FBQ0ksS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsQ0FBckIsR0FBeUNKLElBQW5EO0FBQ0EsUUFBTUssQ0FBQyxHQUFHSixJQUFJLENBQUNLLFVBQUwsQ0FBZ0IsR0FBaEIsSUFBdUJMLElBQUksQ0FBQ0csS0FBTCxDQUFXLENBQVgsQ0FBdkIsR0FBdUNILElBQWpEO0FBQ0EsUUFBTU0sR0FBRyxHQUFHRixDQUFDLElBQUlILENBQUwsR0FBUyxHQUFULEdBQWUsRUFBM0I7QUFDQSxTQUFRLEdBQUVBLENBQUUsR0FBRUssR0FBSSxHQUFFRixDQUFFLEVBQXRCO0FB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c0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHtBY2Nlc3NSaWdodHN9IGZyb20gXCIuLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFJbmRleEluZm8gfSBmcm9tICcuLi9kYXRhL2RhdGEtcHJvdmlkZXInO1xuaW1wb3J0IHtzY2FsYXJUeXBlc30gZnJvbSBcIi4uL3NjaGVtYS9kYi1zY2hlbWEtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHtEYkZpZWxkLCBEYlNjaGVtYSwgRGJUeXBlfSBmcm9tIFwiLi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmNvbnN0IE5PVF9JTVBMRU1FTlRFRCA9IG5ldyBFcnJvcignTm90IEltcGxlbWVudGVkJyk7XG5cbmV4cG9ydCB0eXBlIEdOYW1lID0ge1xuICAgIGtpbmQ6ICdOYW1lJyxcbiAgICB2YWx1ZTogc3RyaW5nLFxufTtcblxuZXhwb3J0IHR5cGUgR0ZpZWxkID0ge1xuICAgIGtpbmQ6ICdGaWVsZCcsXG4gICAgYWxpYXM6IHN0cmluZyxcbiAgICBuYW1lOiBHTmFtZSxcbiAgICBhcmd1bWVudHM6IEdEZWZpbml0aW9uW10sXG4gICAgZGlyZWN0aXZlczogR0RlZmluaXRpb25bXSxcbiAgICBzZWxlY3Rpb25TZXQ6IHR5cGVvZiB1bmRlZmluZWQgfCBHU2VsZWN0aW9uU2V0LFxufTtcblxuZXhwb3J0IHR5cGUgR0RlZmluaXRpb24gPSBHRmllbGQ7XG5cbmV4cG9ydCB0eXBlIEdTZWxlY3Rpb25TZXQgPSB7XG4gICAga2luZDogJ1NlbGVjdGlvblNldCcsXG4gICAgc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSxcbn07XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbnR5cGUgUVJldHVybkV4cHJlc3Npb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGV4cHJlc3Npb246IHN0cmluZyxcbn07XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIGZpZWxkcz86IHsgW3N0cmluZ106IFFUeXBlIH0sXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgZmlsdGVyQ29uZGl0aW9uOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG5cbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgQVFMIGV4cHJlc3Npb24gZm9yIHJldHVybiBzZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGhcbiAgICAgKiBAcGFyYW0ge0dEZWZpbml0aW9ufSBkZWZcbiAgICAgKi9cbiAgICByZXR1cm5FeHByZXNzaW9uOiAocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKSA9PiBRUmV0dXJuRXhwcmVzc2lvbixcblxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGZpbHRlckNvbmRpdGlvbkZvckZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyhcbiAgICBleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPixcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmllbGRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4pIHtcbiAgICBmaWVsZHMuZm9yRWFjaCgoZmllbGREZWY6IEdGaWVsZCkgPT4ge1xuICAgICAgICBjb25zdCBuYW1lID0gZmllbGREZWYubmFtZSAmJiBmaWVsZERlZi5uYW1lLnZhbHVlIHx8ICcnO1xuICAgICAgICBpZiAobmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7ZmllbGREZWYua2luZH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSAnX190eXBlbmFtZScpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbbmFtZV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgc2VsZWN0aW9uIGZpZWxkOiAke25hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmV0dXJuZWQgPSBmaWVsZFR5cGUucmV0dXJuRXhwcmVzc2lvbihwYXRoLCBmaWVsZERlZik7XG4gICAgICAgIGV4cHJlc3Npb25zLnNldChyZXR1cm5lZC5uYW1lLCByZXR1cm5lZC5leHByZXNzaW9uKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9uczogTWFwPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gICAgY29uc3QgZmllbGRzID0gW107XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZXhwcmVzc2lvbnMpIHtcbiAgICAgICAgZmllbGRzLnB1c2goYCR7a2V5fTogJHt2YWx1ZX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIGB7ICR7ZmllbGRzLmpvaW4oJywgJyl9IH1gO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW4sXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBwYXJhbXMuZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoLCBvcCk7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG4gICAgY29uc3QgaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPSAocGF0aCA9PT0gJ19rZXknIHx8IHBhdGguZW5kc1dpdGgoJy5fa2V5JykpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xuICAgIGNvbnN0IGZpeGVkVmFsdWUgPSBgQCR7cGFyYW1OYW1lfWA7XG4gICAgcmV0dXJuIGAke2ZpeGVkUGF0aH0gJHtvcH0gJHtmaXhlZFZhbHVlfWA7XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnksIG9wOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgb3AsIHZhbHVlKSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9uKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JJbihwYXJhbXMsIHBhdGgsIGZpbHRlciwgXCI9PVwiKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke2ZpbHRlckNvbmRpdGlvbkZvckluKHBhcmFtcywgcGF0aCwgZmlsdGVyLCBcIiE9XCIpfSlgO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgaXNDb2xsZWN0aW9uID0gcGF0aCA9PT0gJ2RvYyc7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbiAmJiBuYW1lID09PSAnaWQnKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9ICdfa2V5JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gaW52ZXJ0ZWRIZXgoaGV4OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGhleClcbiAgICAgICAgLm1hcChjID0+IChOdW1iZXIucGFyc2VJbnQoYywgMTYpIF4gMHhmKS50b1N0cmluZygxNikpXG4gICAgICAgIC5qb2luKCcnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIG5lZyA9IHZhbHVlIDwgMDtcbiAgICAgICAgaGV4ID0gYDB4JHsobmVnID8gLXZhbHVlIDogdmFsdWUpLnRvU3RyaW5nKDE2KX1gO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50b1N0cmluZygpLnRyaW0oKTtcbiAgICAgICAgbmVnID0gcy5zdGFydHNXaXRoKCctJyk7XG4gICAgICAgIGhleCA9IGAweCR7bmVnID8gaW52ZXJ0ZWRIZXgocy5zdWJzdHIocHJlZml4TGVuZ3RoICsgMSkpIDogcy5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gYCR7bmVnID8gJy0nIDogJyd9JHsoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCl9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBiaWc7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgYmlnID0gcy5zdGFydHNXaXRoKCctJykgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICBjb25zdCByZXN1bHQgPSBgJHtwcmVmaXh9JHtoZXh9YDtcbiAgICByZXR1cm4gbmVnID8gYC0ke2ludmVydGVkSGV4KHJlc3VsdCl9YCA6IHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBgJHtwYXRofS4ke25hbWV9YCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB1bmRlZmluZWRUb051bGwodmFsdWUpLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKCdPUicgaW4gb3BlcmFuZCkge1xuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XG4gICAgICAgICAgICBkZWxldGUgd2l0aG91dE9yWydPUiddO1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaCh3aXRob3V0T3IpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKG9wZXJhbmQpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wZXJhbmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWVsZHMsXG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKS5tYXAoKG9wZXJhbmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIG9wZXJhbmQsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgY29tYmluZVBhdGgocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKG9yT3BlcmFuZHMubGVuZ3RoID4gMSkgPyBgKCR7b3JPcGVyYW5kcy5qb2luKCcpIE9SICgnKX0pYCA6IG9yT3BlcmFuZHNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbnMsXG4gICAgICAgICAgICAgICAgYCR7cGF0aH0uJHtuYW1lfWAsXG4gICAgICAgICAgICAgICAgKGRlZi5zZWxlY3Rpb25TZXQgJiYgZGVmLnNlbGVjdGlvblNldC5zZWxlY3Rpb25zKSB8fCBbXSxcbiAgICAgICAgICAgICAgICBmaWVsZHMsXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAoICR7cGF0aH0uJHtuYW1lfSAmJiAke2NvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyl9IClgLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvck9wZXJhbmRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3RGaWVsZHModmFsdWUsIG9yT3BlcmFuZHNbaV0sIGZpZWxkcywgKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZTogUVR5cGUsIHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGl0ZW1GaWx0ZXJDb25kaXRpb246IHN0cmluZztcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcbiAgICBpZiAoZXhwbGFuYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2F2ZVBhcmVudFBhdGggPSBleHBsYW5hdGlvbi5wYXJlbnRQYXRoO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcbiAgICAgICAgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGl0ZW1UeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IHNhdmVQYXJlbnRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgfVxuICAgIHJldHVybiBpdGVtRmlsdGVyQ29uZGl0aW9uO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRmllbGRQYXRoQ2hhcihjOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoYy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGMgPj0gJ0EnICYmIGMgPD0gJ1onKVxuICAgICAgICB8fCAoYyA+PSAnYScgJiYgYyA8PSAneicpXG4gICAgICAgIHx8IChjID49ICcwJyAmJiBjIDw9ICc5JylcbiAgICAgICAgfHwgKGMgPT09ICdfJyB8fCBjID09PSAnWycgfHwgYyA9PT0gJyonIHx8IGMgPT09ICddJyB8fCBjID09PSAnLicpO1xufVxuXG5mdW5jdGlvbiBpc0ZpZWxkUGF0aCh0ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkRmllbGRQYXRoQ2hhcih0ZXN0W2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGg6IHN0cmluZywgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbXM6IFFQYXJhbXMpOiA/c3RyaW5nIHtcbiAgICBmdW5jdGlvbiB0cnlPcHRpbWl6ZShmaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1JbmRleDogbnVtYmVyKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1JbmRleCArIDF9YDtcbiAgICAgICAgY29uc3Qgc3VmZml4ID0gYCA9PSAke3BhcmFtTmFtZX1gO1xuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uID09PSBgQ1VSUkVOVCR7c3VmZml4fWApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24uc3RhcnRzV2l0aCgnQ1VSUkVOVC4nKSAmJiBmaWx0ZXJDb25kaXRpb24uZW5kc1dpdGgoc3VmZml4KSkge1xuICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gZmlsdGVyQ29uZGl0aW9uLnNsaWNlKCdDVVJSRU5ULicubGVuZ3RoLCAtc3VmZml4Lmxlbmd0aCk7XG4gICAgICAgICAgICBpZiAoaXNGaWVsZFBhdGgoZmllbGRQYXRoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl0uJHtmaWVsZFBhdGh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAoIWl0ZW1GaWx0ZXJDb25kaXRpb24uc3RhcnRzV2l0aCgnKCcpIHx8ICFpdGVtRmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKCcpJykpIHtcbiAgICAgICAgcmV0dXJuIHRyeU9wdGltaXplKGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcy5jb3VudCAtIDEpO1xuICAgIH1cbiAgICBjb25zdCBmaWx0ZXJDb25kaXRpb25QYXJ0cyA9IGl0ZW1GaWx0ZXJDb25kaXRpb24uc2xpY2UoMSwgLTEpLnNwbGl0KCcpIE9SICgnKTtcbiAgICBpZiAoZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiB0cnlPcHRpbWl6ZShpdGVtRmlsdGVyQ29uZGl0aW9uLCBwYXJhbXMuY291bnQgLSAxKTtcbiAgICB9XG4gICAgY29uc3Qgb3B0aW1pemVkUGFydHMgPSBmaWx0ZXJDb25kaXRpb25QYXJ0c1xuICAgICAgICAubWFwKCh4LCBpKSA9PiB0cnlPcHRpbWl6ZSh4LCBwYXJhbXMuY291bnQgLSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGggKyBpKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHggIT09IG51bGwpO1xuICAgIGlmIChvcHRpbWl6ZWRQYXJ0cy5sZW5ndGggIT09IGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGAoJHtvcHRpbWl6ZWRQYXJ0cy5qb2luKCcpIE9SICgnKX0pYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+ICFpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFueToge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24gPSB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGgsIGl0ZW1GaWx0ZXJDb25kaXRpb24sIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGltaXplZEZpbHRlckNvbmRpdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbUZpbHRlckNvbmRpdGlvbn1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJldHVybkV4cHJlc3Npb24oX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBkZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgY29uc3QgaXRlbVNlbGVjdGlvbnMgPSBkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICAgICAgICAgIGxldCBleHByZXNzaW9uO1xuICAgICAgICAgICAgaWYgKGl0ZW1TZWxlY3Rpb25zICYmIGl0ZW1TZWxlY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGlhcyA9IGZpZWxkUGF0aC5zcGxpdCgnLicpLmpvaW4oJ19fJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhwcmVzc2lvbnMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zLCBhbGlhcywgaXRlbVNlbGVjdGlvbnMsIGl0ZW1UeXBlLmZpZWxkcyB8fCB7fSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUV4cHJlc3Npb24gPSBjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMpO1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgKCAke2ZpZWxkUGF0aH0gJiYgKCBGT1IgJHthbGlhc30gSU4gJHtmaWVsZFBhdGh9IHx8IFtdIFJFVFVSTiAke2l0ZW1FeHByZXNzaW9ufSApIClgO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbixcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU3RyaW5nIENvbXBhbmlvbnNcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ0NvbXBhbmlvbihvbkZpZWxkOiBzdHJpbmcpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKF9wYXJhbXMsIF9wYXRoLCBfZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2ZhbHNlJztcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbihwYXRoOiBzdHJpbmcsIF9kZWY6IEdGaWVsZCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChfcGFyZW50LCBfdmFsdWUsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBKb2luc1xuXG5leHBvcnQgZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlckNvbmRpdGlvbiA9IHJlZlR5cGUuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9uKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb24ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IG9uRmllbGQgPT09ICdpZCcgPyAnX2tleScgOiBvbkZpZWxkO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbkFycmF5KFxuICAgIG9uRmllbGQ6IHN0cmluZyxcbiAgICByZWZGaWVsZDogc3RyaW5nLFxuICAgIHJlZkNvbGxlY3Rpb246IHN0cmluZyxcbiAgICByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUsXG4pOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmRmlsdGVyQ29uZGl0aW9ufSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb24ocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZSxcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogP0dTZWxlY3Rpb25TZXQsIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGRvYykpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5tYXAoeCA9PiBzZWxlY3RGaWVsZHMoeCwgc2VsZWN0aW9uKSk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkRm9ySm9pbiA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6IFsnaW5fbXNnJ10sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFsnb3V0X21zZyddLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogWydpZCddLFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAocmVxdWlyZWRGb3JKb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NbZmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbZmllbGRdID0gZG9jW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXG4gICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCB0eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBpc0Zhc3Q6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleFRvU3RyaW5nKGluZGV4OiBRSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IFFJbmRleEluZm8ge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpZWxkczogcy5zcGxpdCgnLCcpLm1hcCh4ID0+IHgudHJpbSgpKS5maWx0ZXIoeCA9PiB4KSxcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5VG9TdHJpbmcob3JkZXJCeTogT3JkZXJCeVtdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gb3JkZXJCeS5tYXAoeCA9PiBgJHt4LnBhdGh9JHsoeC5kaXJlY3Rpb24gfHwgJycpID09PSAnREVTQycgPyAnIERFU0MnIDogJyd9YCkuam9pbignLCAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT3JkZXJCeShzOiBzdHJpbmcpOiBPcmRlckJ5W10ge1xuICAgIHJldHVybiBzLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCh4ID0+IHgudHJpbSgpKVxuICAgICAgICAuZmlsdGVyKHggPT4geClcbiAgICAgICAgLm1hcCgocykgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBzLnNwbGl0KCcgJykuZmlsdGVyKHggPT4geCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHBhdGg6IHBhcnRzWzBdLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbjogKHBhcnRzWzFdIHx8ICcnKS50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycgPyAnREVTQycgOiAnQVNDJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNjYWxhckZpZWxkcyhzY2hlbWE6IERiU2NoZW1hKTogTWFwPHN0cmluZywgeyB0eXBlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyB9PiB7XG4gICAgY29uc3Qgc2NhbGFyRmllbGRzID0gbmV3IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4oKTtcblxuICAgIGZ1bmN0aW9uIGFkZEZvckRiVHlwZSh0eXBlOiBEYlR5cGUsIHBhcmVudFBhdGgsIHBhcmVudERvY1BhdGg6IHN0cmluZykge1xuICAgICAgICB0eXBlLmZpZWxkcy5mb3JFYWNoKChmaWVsZDogRGJGaWVsZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmpvaW4gfHwgZmllbGQuZW51bURlZikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGRvY05hbWUgPSB0eXBlLmNvbGxlY3Rpb24gJiYgZmllbGQubmFtZSA9PT0gJ2lkJyA/ICdfa2V5JyA6IGZpZWxkLm5hbWU7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gYCR7cGFyZW50UGF0aH0uJHtmaWVsZC5uYW1lfWA7XG4gICAgICAgICAgICBsZXQgZG9jUGF0aCA9IGAke3BhcmVudERvY1BhdGh9LiR7ZG9jTmFtZX1gO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFycmF5RGVwdGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1ZmZpeCA9ICdbKl0nO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGRlcHRoID0gMTA7IGRlcHRoID4gMDsgZGVwdGggLT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gYFskeycqJy5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFskeycqJy5yZXBlYXQoZGVwdGggKyAxKX1dYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRvY1BhdGggPSBgJHtkb2NQYXRofSR7c3VmZml4fWA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzd2l0Y2ggKGZpZWxkLnR5cGUuY2F0ZWdvcnkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJzY2FsYXJcIjpcbiAgICAgICAgICAgICAgICBsZXQgdHlwZU5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLmJvb2xlYW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAnYm9vbGVhbic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy5mbG9hdCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdudW1iZXInO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ251bWJlcic7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50NjQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSAndWludDY0JztcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQxMDI0KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gJ3VpbnQxMDI0JztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzY2FsYXJGaWVsZHMuc2V0KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IGRvY1BhdGgsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJzdHJ1Y3RcIjpcbiAgICAgICAgICAgIGNhc2UgXCJ1bmlvblwiOlxuICAgICAgICAgICAgICAgIGFkZEZvckRiVHlwZShmaWVsZC50eXBlLCBwYXRoLCBkb2NQYXRoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBzY2hlbWEudHlwZXMuZm9yRWFjaCgodHlwZSkgPT4ge1xuICAgICAgICBhZGRGb3JEYlR5cGUodHlwZSwgJycsICcnKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzY2FsYXJGaWVsZHM7XG59XG4iXX0=