"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unixMillisecondsToString = unixMillisecondsToString;
exports.unixSecondsToString = unixSecondsToString;
exports.resolveBigUInt = resolveBigUInt;
exports.convertBigUInt = convertBigUInt;
exports.splitOr = splitOr;
exports.struct = struct;
exports.array = array;
exports.enumName = enumName;
exports.createEnumNameResolver = createEnumNameResolver;
exports.join = join;
exports.joinArray = joinArray;
exports.parseSelectionSet = parseSelectionSet;
exports.selectionToString = selectionToString;
exports.selectFields = selectFields;
exports.indexToString = indexToString;
exports.parseIndex = parseIndex;
exports.orderByToString = orderByToString;
exports.parseOrderBy = parseOrderBy;
exports.bigUInt2 = exports.bigUInt1 = exports.scalar = exports.QParams = exports.QExplanation = void 0;

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
/**
 * Abstract interface for objects that acts as a helpers to perform queries over documents
 * using query filters.
 */


exports.QParams = QParams;

/**
 * Generates AQL condition for complex filter.
 *
 * @param {string} path Path to document field.
 * @param {object} filter A filter object specified by user.
 * @param {object} fieldTypes A map of available values for filter fields to helpers.
 * @param {function} qlField Function that generates condition for a concrete field.
 * @return {string} AQL condition
 */
function qlFields(path, filter, fieldTypes, qlField) {
  const conditions = [];
  Object.entries(filter).forEach(([filterKey, filterValue]) => {
    const fieldType = fieldTypes[filterKey];

    if (fieldType) {
      conditions.push(qlField(fieldType, path, filterKey, filterValue));
    } else {
      throw new Error(`Invalid filter field: ${filterKey}`);
    }
  });
  return qlCombine(conditions, 'AND', 'false');
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

function qlOp(params, path, op, filter) {
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

function qlCombine(conditions, op, defaultConditions) {
  if (conditions.length === 0) {
    return defaultConditions;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return '(' + conditions.join(`) ${op} (`) + ')';
}

function qlIn(params, path, filter) {
  const conditions = filter.map(value => qlOp(params, path, '==', value));
  return qlCombine(conditions, 'OR', 'false');
} //------------------------------------------------------------- Scalars


function undefinedToNull(v) {
  return v !== undefined ? v : null;
}

const scalarEq = {
  ql(params, path, filter) {
    return qlOp(params, path, '==', filter);
  },

  test(parent, value, filter) {
    return value === filter;
  }

};
const scalarNe = {
  ql(params, path, filter) {
    return qlOp(params, path, '!=', filter);
  },

  test(parent, value, filter) {
    return value !== filter;
  }

};
const scalarLt = {
  ql(params, path, filter) {
    return qlOp(params, path, '<', filter);
  },

  test(parent, value, filter) {
    return value < filter;
  }

};
const scalarLe = {
  ql(params, path, filter) {
    return qlOp(params, path, '<=', filter);
  },

  test(parent, value, filter) {
    return value <= filter;
  }

};
const scalarGt = {
  ql(params, path, filter) {
    return qlOp(params, path, '>', filter);
  },

  test(parent, value, filter) {
    return value > filter;
  }

};
const scalarGe = {
  ql(params, path, filter) {
    return qlOp(params, path, '>=', filter);
  },

  test(parent, value, filter) {
    return value >= filter;
  }

};
const scalarIn = {
  ql(params, path, filter) {
    return qlIn(params, path, filter);
  },

  test(parent, value, filter) {
    return filter.includes(value);
  }

};
const scalarNotIn = {
  ql(params, path, filter) {
    return `NOT (${qlIn(params, path, filter)})`;
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
    ql(params, path, filter) {
      return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        return op.ql(params, path, filterValue);
      });
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
    ql(params, path, filter) {
      return qlFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const converted = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(x => convertBigUInt(prefixLength, x)) : convertBigUInt(prefixLength, filterValue);
        return op.ql(params, path, converted);
      });
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
    ql(params, path, filter) {
      const orOperands = splitOr(filter).map(operand => {
        return qlFields(path, operand, fields, (fieldType, path, filterKey, filterValue) => {
          const fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
          return fieldType.ql(params, combinePath(path, fieldName), filterValue);
        });
      });
      return orOperands.length > 1 ? `(${orOperands.join(') OR (')})` : orOperands[0];
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


function getItemQL(itemType, params, path, filter) {
  let itemQl;
  const explanation = params.explanation;

  if (explanation) {
    const saveParentPath = explanation.parentPath;
    explanation.parentPath = `${explanation.parentPath}${path}[*]`;
    itemQl = itemType.ql(params, 'CURRENT', filter);
    explanation.parentPath = saveParentPath;
  } else {
    itemQl = itemType.ql(params, 'CURRENT', filter);
  }

  return itemQl;
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

function tryOptimizeArrayAny(path, itemQl, params) {
  const paramName = `@v${params.count}`;
  const suffix = ` == ${paramName}`;

  if (itemQl === `CURRENT${suffix}`) {
    return `${paramName} IN ${path}[*]`;
  }

  if (itemQl.startsWith('CURRENT.') && itemQl.endsWith(suffix)) {
    const fieldPath = itemQl.slice('CURRENT.'.length, -suffix.length);

    if (isFieldPath(fieldPath)) {
      return `${paramName} IN ${path}[*].${fieldPath}`;
    }
  }

  return null;
}

function array(resolveItemType) {
  let resolved = null;
  const ops = {
    all: {
      ql(params, path, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const itemQl = getItemQL(itemType, params, path, filter);
        return `LENGTH(${path}[* FILTER ${itemQl}]) == LENGTH(${path})`;
      },

      test(parent, value, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const failedIndex = value.findIndex(x => !itemType.test(parent, x, filter));
        return failedIndex < 0;
      }

    },
    any: {
      ql(params, path, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const itemQl = getItemQL(itemType, params, path, filter);
        const optimizedQl = tryOptimizeArrayAny(path, itemQl, params);

        if (optimizedQl) {
          return optimizedQl;
        }

        return `LENGTH(${path}[* FILTER ${itemQl}]) > 0`;
      },

      test(parent, value, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const succeededIndex = value.findIndex(x => itemType.test(parent, x, filter));
        return succeededIndex >= 0;
      }

    }
  };
  return {
    ql(params, path, filter) {
      return qlFields(path, filter, ops, (op, path, filterKey, filterValue) => {
        return op.ql(params, path, filterValue);
      });
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
    ql(params, path, filter) {
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      return qlFields(on_path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const resolved = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.ql(params, path, resolved);
      });
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
} //------------------------------------------------------------- Joins


function join(onField, refField, refCollection, resolveRefType) {
  let resolved = null;
  return {
    ql(params, path, filter) {
      const refType = resolved || (resolved = resolveRefType());
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      const alias = `${on_path.replace('.', '_')}`;
      const refQl = refType.ql(params, alias, filter);
      return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refQl})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
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
    ql(params, path, filter) {
      const refType = resolved || (resolved = resolveRefType());
      const refFilter = filter.all || filter.any;
      const all = !!filter.all;
      const on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      const alias = `${on_path.replace('.', '_')}`;
      const refQl = refType.ql(params, alias, refFilter);
      return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refQl})
                    ${!all ? 'LIMIT 1' : ''}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : '> 0'})`;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwiRXJyb3IiLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsInFsT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImpvaW4iLCJxbEluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwicWwiLCJ0ZXN0IiwicGFyZW50Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhck9wcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsImluIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJ1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJ1bml4U2Vjb25kc1RvU3RyaW5nIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwiaW52ZXJ0ZWRIZXgiLCJoZXgiLCJBcnJheSIsImZyb20iLCJjIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsImFyZ3MiLCJuZWciLCJzIiwidHJpbSIsImZvcm1hdCIsIkJpZ0ludCIsImNvbnZlcnRCaWdVSW50IiwiYmlnIiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwicmVzdWx0IiwiY3JlYXRlQmlnVUludCIsImNvbnZlcnRlZCIsIngiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3BsaXRPciIsIm9wZXJhbmRzIiwib3BlcmFuZCIsIndpdGhvdXRPciIsImFzc2lnbiIsIk9SIiwic3RydWN0IiwiaXNDb2xsZWN0aW9uIiwib3JPcGVyYW5kcyIsImZpZWxkTmFtZSIsImkiLCJnZXRJdGVtUUwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsInNhdmVQYXJlbnRQYXRoIiwiaXNWYWxpZEZpZWxkUGF0aENoYXIiLCJpc0ZpZWxkUGF0aCIsInRyeU9wdGltaXplQXJyYXlBbnkiLCJzdWZmaXgiLCJmaWVsZFBhdGgiLCJhcnJheSIsInJlc29sdmVJdGVtVHlwZSIsInJlc29sdmVkIiwib3BzIiwiYWxsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJvcHRpbWl6ZWRRbCIsInN1Y2NlZWRlZEluZGV4IiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJvbl9wYXRoIiwic3BsaXQiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwic2VsZWN0aW9ucyIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiaXNBcnJheSIsInNlbGVjdGVkIiwiX2tleSIsImlkIiwicmVxdWlyZWRGb3JKb2luIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJpbmRleFRvU3RyaW5nIiwiaW5kZXgiLCJwYXJzZUluZGV4Iiwib3JkZXJCeVRvU3RyaW5nIiwib3JkZXJCeSIsImRpcmVjdGlvbiIsInBhcnNlT3JkZXJCeSIsInBhcnRzIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLFNBQVNBLFdBQVQsQ0FBcUJDLElBQXJCLEVBQW1DQyxJQUFuQyxFQUF5RDtBQUNyRCxRQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBTCxDQUFjLEdBQWQsSUFBcUJILElBQUksQ0FBQ0ksS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsQ0FBckIsR0FBeUNKLElBQW5EO0FBQ0EsUUFBTUssQ0FBQyxHQUFHSixJQUFJLENBQUNLLFVBQUwsQ0FBZ0IsR0FBaEIsSUFBdUJMLElBQUksQ0FBQ0csS0FBTCxDQUFXLENBQVgsQ0FBdkIsR0FBdUNI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QUNaLElBQUYsRUFBdEIsRUFBZ0NqRixNQUFoQyxDQUF1QzZGLENBQUMsSUFBSUEsQ0FBNUM7QUFETCxHQUFQO0FBR0g7O0FBRU0sU0FBUzJFLGVBQVQsQ0FBeUJDLE9BQXpCLEVBQXFEO0FBQ3hELFNBQU9BLE9BQU8sQ0FBQy9JLEdBQVIsQ0FBWW1FLENBQUMsSUFBSyxHQUFFQSxDQUFDLENBQUMvSCxJQUFLLEdBQUUsQ0FBQytILENBQUMsQ0FBQzZFLFNBQUYsSUFBZSxFQUFoQixNQUF3QixNQUF4QixHQUFpQyxPQUFqQyxHQUEyQyxFQUFHLEVBQTNFLEVBQThFbEosSUFBOUUsQ0FBbUYsSUFBbkYsQ0FBUDtBQUNIOztBQUVNLFNBQVNtSixZQUFULENBQXNCM0YsQ0FBdEIsRUFBNEM7QUFDL0MsU0FBT0EsQ0FBQyxDQUFDcUQsS0FBRixDQUFRLEdBQVIsRUFDRjNHLEdBREUsQ0FDRW1FLENBQUMsSUFBSUEsQ0FBQyxDQUFDWixJQUFGLEVBRFAsRUFFRmpGLE1BRkUsQ0FFSzZGLENBQUMsSUFBSUEsQ0FGVixFQUdGbkUsR0FIRSxDQUdHc0QsQ0FBRCxJQUFPO0FBQ1IsVUFBTTRGLEtBQUssR0FBRzVGLENBQUMsQ0FBQ3FELEtBQUYsQ0FBUSxHQUFSLEVBQWFySSxNQUFiLENBQW9CNkYsQ0FBQyxJQUFJQSxDQUF6QixDQUFkO0FBQ0EsV0FBTztBQUNIL0gsTUFBQUEsSUFBSSxFQUFFOE0sS0FBSyxDQUFDLENBQUQsQ0FEUjtBQUVIRixNQUFBQSxTQUFTLEVBQUUsQ0FBQ0UsS0FBSyxDQUFDLENBQUQsQ0FBTCxJQUFZLEVBQWIsRUFBaUJDLFdBQWpCLE9BQW1DLE1BQW5DLEdBQTRDLE1BQTVDLEdBQXFEO0FBRjdELEtBQVA7QUFJSCxHQVRFLENBQVA7QUFVSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5pbXBvcnQgdHlwZSB7QWNjZXNzUmlnaHRzfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7SW5kZXhJbmZvfSBmcm9tIFwiLi9jb25maWdcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCB0eXBlIFNjYWxhckZpZWxkID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICB0eXBlOiAoJ251bWJlcicgfCAndWludDY0JyB8ICd1aW50MTAyNCcgfCAnYm9vbGVhbicgfCAnc3RyaW5nJyksXG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBhcmVudFBhdGggPSAnJztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHAgPSBwYXRoO1xuICAgICAgICBpZiAocC5zdGFydHNXaXRoKCdDVVJSRU5UJykpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZzogUUZpZWxkRXhwbGFuYXRpb24gfCB0eXBlb2YgdW5kZWZpbmVkID0gdGhpcy5maWVsZHMuZ2V0KHApO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uczogbmV3IFNldChbb3BdKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgcWw6IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBxbEZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHFsRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyT3BzID0ge1xuICAgIGVxOiBzY2FsYXJFcSxcbiAgICBuZTogc2NhbGFyTmUsXG4gICAgbHQ6IHNjYWxhckx0LFxuICAgIGxlOiBzY2FsYXJMZSxcbiAgICBndDogc2NhbGFyR3QsXG4gICAgZ2U6IHNjYWxhckdlLFxuICAgIGluOiBzY2FsYXJJbixcbiAgICBub3RJbjogc2NhbGFyTm90SW4sXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVTY2FsYXIoKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB1bmRlZmluZWRUb051bGwodmFsdWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peE1pbGxpc2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgZCA9IG5ldyBEYXRlKHZhbHVlKTtcblxuICAgIGZ1bmN0aW9uIHBhZChudW1iZXIpIHtcbiAgICAgICAgaWYgKG51bWJlciA8IDEwKSB7XG4gICAgICAgICAgICByZXR1cm4gJzAnICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ01vbnRoKCkgKyAxKSArXG4gICAgICAgICctJyArIHBhZChkLmdldFVUQ0RhdGUoKSkgK1xuICAgICAgICAnICcgKyBwYWQoZC5nZXRVVENIb3VycygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ01pbnV0ZXMoKSkgK1xuICAgICAgICAnOicgKyBwYWQoZC5nZXRVVENTZWNvbmRzKCkpICtcbiAgICAgICAgJy4nICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peFNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWUgKiAxMDAwKTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogJ0hFWCcsXG4gICAgREVDOiAnREVDJyxcbn07XG5cbmZ1bmN0aW9uIGludmVydGVkSGV4KGhleDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShoZXgpXG4gICAgICAgIC5tYXAoYyA9PiAoTnVtYmVyLnBhcnNlSW50KGMsIDE2KSBeIDB4ZikudG9TdHJpbmcoMTYpKVxuICAgICAgICAuam9pbignJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSwgYXJncz86IHsgZm9ybWF0PzogJ0hFWCcgfCAnREVDJyB9KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGxldCBuZWc7XG4gICAgbGV0IGhleDtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICBuZWcgPSB2YWx1ZSA8IDA7XG4gICAgICAgIGhleCA9IGAweCR7KG5lZyA/IC12YWx1ZSA6IHZhbHVlKS50b1N0cmluZygxNil9YDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBzID0gdmFsdWUudG9TdHJpbmcoKS50cmltKCk7XG4gICAgICAgIG5lZyA9IHMuc3RhcnRzV2l0aCgnLScpO1xuICAgICAgICBoZXggPSBgMHgke25lZyA/IGludmVydGVkSGV4KHMuc3Vic3RyKHByZWZpeExlbmd0aCArIDEpKSA6IHMuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbiAgICB9XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIGAke25lZyA/ICctJyA6ICcnfSR7KGZvcm1hdCA9PT0gQmlnTnVtYmVyRm9ybWF0LkhFWCkgPyBoZXggOiBCaWdJbnQoaGV4KS50b1N0cmluZygpfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBsZXQgYmlnO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIGJpZyA9IHMuc3RhcnRzV2l0aCgnLScpID8gLUJpZ0ludChzLnN1YnN0cigxKSkgOiBCaWdJbnQocyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYmlnID0gQmlnSW50KHZhbHVlKTtcbiAgICB9XG4gICAgY29uc3QgbmVnID0gYmlnIDwgQmlnSW50KDApO1xuICAgIGNvbnN0IGhleCA9IChuZWcgPyAtYmlnIDogYmlnKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gKGhleC5sZW5ndGggLSAxKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgY29uc3QgcmVzdWx0ID0gYCR7cHJlZml4fSR7aGV4fWA7XG4gICAgcmV0dXJuIG5lZyA/IGAtJHtpbnZlcnRlZEhleChyZXN1bHQpfWAgOiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKCdPUicgaW4gb3BlcmFuZCkge1xuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XG4gICAgICAgICAgICBkZWxldGUgd2l0aG91dE9yWydPUiddO1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaCh3aXRob3V0T3IpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKG9wZXJhbmQpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wZXJhbmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKS5tYXAoKG9wZXJhbmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgb3BlcmFuZCwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdEZpZWxkcyh2YWx1ZSwgb3JPcGVyYW5kc1tpXSwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtUUwoaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtUWw6IHN0cmluZztcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcbiAgICBpZiAoZXhwbGFuYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2F2ZVBhcmVudFBhdGggPSBleHBsYW5hdGlvbi5wYXJlbnRQYXRoO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcbiAgICAgICAgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1RbDtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEZpZWxkUGF0aENoYXIoYzogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgaWYgKGMubGVuZ3RoICE9PSAxKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChjID49ICdBJyAmJiBjIDw9ICdaJylcbiAgICAgICAgfHwgKGMgPj0gJ2EnICYmIGMgPD0gJ3onKVxuICAgICAgICB8fCAoYyA+PSAnMCcgJiYgYyA8PSAnOScpXG4gICAgICAgIHx8IChjID09PSAnXycgfHwgYyA9PT0gJ1snIHx8IGMgPT09ICcqJyB8fCBjID09PSAnXScgfHwgYyA9PT0gJy4nKTtcbn1cblxuZnVuY3Rpb24gaXNGaWVsZFBhdGgodGVzdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXN0Lmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgIGlmICghaXNWYWxpZEZpZWxkUGF0aENoYXIodGVzdFtpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoOiBzdHJpbmcsIGl0ZW1RbDogc3RyaW5nLCBwYXJhbXM6IFFQYXJhbXMpOiA/c3RyaW5nIHtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtcy5jb3VudH1gO1xuICAgIGNvbnN0IHN1ZmZpeCA9IGAgPT0gJHtwYXJhbU5hbWV9YDtcbiAgICBpZiAoaXRlbVFsID09PSBgQ1VSUkVOVCR7c3VmZml4fWApIHtcbiAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgfVxuICAgIGlmIChpdGVtUWwuc3RhcnRzV2l0aCgnQ1VSUkVOVC4nKSAmJiBpdGVtUWwuZW5kc1dpdGgoc3VmZml4KSkge1xuICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBpdGVtUWwuc2xpY2UoJ0NVUlJFTlQuJy5sZW5ndGgsIC1zdWZmaXgubGVuZ3RoKTtcbiAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl0uJHtmaWVsZFBhdGh9YDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGltaXplZFFsID0gdHJ5T3B0aW1pemVBcnJheUFueShwYXRoLCBpdGVtUWwsIHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGltaXplZFFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpbWl6ZWRRbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBqb2luQXJyYXkoXG4gICAgb25GaWVsZDogc3RyaW5nLFxuICAgIHJlZkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmQ29sbGVjdGlvbjogc3RyaW5nLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZSxcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpLFxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnlUb1N0cmluZyhvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xuICAgIHJldHVybiBvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0keyh4LmRpcmVjdGlvbiB8fCAnJykgPT09ICdERVNDJyA/ICcgREVTQycgOiAnJ31gKS5qb2luKCcsICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VPcmRlckJ5KHM6IHN0cmluZyk6IE9yZGVyQnlbXSB7XG4gICAgcmV0dXJuIHMuc3BsaXQoJywnKVxuICAgICAgICAubWFwKHggPT4geC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4KVxuICAgICAgICAubWFwKChzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoJyAnKS5maWx0ZXIoeCA9PiB4KTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgcGF0aDogcGFydHNbMF0sXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiAocGFydHNbMV0gfHwgJycpLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJyA/ICdERVNDJyA6ICdBU0MnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbn1cblxuXG4iXX0=