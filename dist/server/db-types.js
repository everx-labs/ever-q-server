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

function resolveBigUInt(prefixLength, value, args) {
  if (value === null || value === undefined) {
    return value;
  }

  const hex = typeof value === 'number' ? `0x${value.toString(16)}` : `0x${value.toString().substr(prefixLength)}`;
  const format = args && args.format || BigNumberFormat.HEX;
  return format === BigNumberFormat.HEX ? hex : BigInt(hex).toString();
}

function convertBigUInt(prefixLength, value) {
  if (value === null || value === undefined) {
    return value;
  }

  const hex = BigInt(value).toString(16);
  const len = (hex.length - 1).toString(16);
  const missingZeros = prefixLength - len.length;
  const prefix = missingZeros > 0 ? `${'0'.repeat(missingZeros)}${len}` : len;
  return `${prefix}${hex}`;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwiRXJyb3IiLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsInFsT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImpvaW4iLCJxbEluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwicWwiLCJ0ZXN0IiwicGFyZW50Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhck9wcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsImluIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJ1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJ1bml4U2Vjb25kc1RvU3RyaW5nIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwiaGV4IiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzcGxpdE9yIiwib3BlcmFuZHMiLCJvcGVyYW5kIiwid2l0aG91dE9yIiwiYXNzaWduIiwiT1IiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJvck9wZXJhbmRzIiwiZmllbGROYW1lIiwiaSIsImdldEl0ZW1RTCIsIml0ZW1UeXBlIiwiaXRlbVFsIiwic2F2ZVBhcmVudFBhdGgiLCJpc1ZhbGlkRmllbGRQYXRoQ2hhciIsImMiLCJpc0ZpZWxkUGF0aCIsInRyeU9wdGltaXplQXJyYXlBbnkiLCJzdWZmaXgiLCJmaWVsZFBhdGgiLCJhcnJheSIsInJlc29sdmVJdGVtVHlwZSIsInJlc29sdmVkIiwib3BzIiwiYWxsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJvcHRpbWl6ZWRRbCIsInN1Y2NlZWRlZEluZGV4IiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJOdW1iZXIiLCJwYXJzZUludCIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJzcGxpdCIsImNvbmNhdCIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJyZWZGaWVsZCIsInJlZkNvbGxlY3Rpb24iLCJyZXNvbHZlUmVmVHlwZSIsInJlZlR5cGUiLCJhbGlhcyIsInJlcGxhY2UiLCJyZWZRbCIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJzZWxlY3Rpb25zIiwiaXRlbSIsInNlbGVjdGlvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmllbGRTZWxlY3Rpb24iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJBcnJheSIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsInMiLCJ0cmltIiwib3JkZXJCeVRvU3RyaW5nIiwib3JkZXJCeSIsImRpcmVjdGlvbiIsInBhcnNlT3JkZXJCeSIsInBhcnRzIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7O0FBNEJBLFNBQVNBLFdBQVQsQ0FBcUJDLElBQXJCLEVBQW1DQyxJQUFuQyxFQUF5RDtBQUNyRCxRQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBTCxDQUFjLEdBQWQsSUFBcUJILElBQUksQ0FBQ0ksS0FBTCxDQUFXLENBQVgsRUFBYyxDQUFDLENBQWYsQ0FBckIsR0FBeUNKLElBQW5EO0FBQ0EsUUFBTUssQ0FBQyxHQUFHSixJQUFJLENBQUNLLFVBQUwsQ0FBZ0IsR0FBaEIsSUFBdUJMLElBQUksQ0FBQ0csS0FBTCxDQUFXLENBQVgsQ0FBdkIsR0FBdUNILElBQWpEO0FBQ0EsUUFBTU0sR0FBRyxHQUFHRixDQUFDLElBQUlILENB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QUF3QixNQUF4QixHQUFpQyxPQUFqQyxHQUEyQyxFQUFHLEVBQTNFLEVBQThFN0ksSUFBOUUsQ0FBbUYsSUFBbkYsQ0FBUDtBQUNIOztBQUVNLFNBQVM4SSxZQUFULENBQXNCTCxDQUF0QixFQUE0QztBQUMvQyxTQUFPQSxDQUFDLENBQUNwQyxLQUFGLENBQVEsR0FBUixFQUNGbkcsR0FERSxDQUNFd0QsQ0FBQyxJQUFJQSxDQUFDLENBQUNnRixJQUFGLEVBRFAsRUFFRmxLLE1BRkUsQ0FFS2tGLENBQUMsSUFBSUEsQ0FGVixFQUdGeEQsR0FIRSxDQUdHdUksQ0FBRCxJQUFPO0FBQ1IsVUFBTU0sS0FBSyxHQUFHTixDQUFDLENBQUNwQyxLQUFGLENBQVEsR0FBUixFQUFhN0gsTUFBYixDQUFvQmtGLENBQUMsSUFBSUEsQ0FBekIsQ0FBZDtBQUNBLFdBQU87QUFDSHBILE1BQUFBLElBQUksRUFBRXlNLEtBQUssQ0FBQyxDQUFELENBRFI7QUFFSEYsTUFBQUEsU0FBUyxFQUFFLENBQUNFLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxFQUFiLEVBQWlCQyxXQUFqQixPQUFtQyxNQUFuQyxHQUE0QyxNQUE1QyxHQUFxRDtBQUY3RCxLQUFQO0FBSUgsR0FURSxDQUFQO0FBVUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IEluZGV4SW5mbyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBxbDogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHFsRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHFsRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHFsRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmdcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChxbEZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB1bml4U2Vjb25kc1RvU3RyaW5nKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZSAqIDEwMDApO1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpXG4gICAgICAgID8gYDB4JHt2YWx1ZS50b1N0cmluZygxNil9YFxuICAgICAgICA6IGAweCR7dmFsdWUudG9TdHJpbmcoKS5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xuICAgIHJldHVybiAoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSBCaWdJbnQodmFsdWUpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7aGV4fWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKCdPUicgaW4gb3BlcmFuZCkge1xuICAgICAgICAgICAgY29uc3Qgd2l0aG91dE9yID0gT2JqZWN0LmFzc2lnbih7fSwgb3BlcmFuZCk7XG4gICAgICAgICAgICBkZWxldGUgd2l0aG91dE9yWydPUiddO1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaCh3aXRob3V0T3IpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG9wZXJhbmQuT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKG9wZXJhbmQpO1xuICAgICAgICAgICAgb3BlcmFuZCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9wZXJhbmRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKS5tYXAoKG9wZXJhbmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgb3BlcmFuZCwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIChvck9wZXJhbmRzLmxlbmd0aCA+IDEpID8gYCgke29yT3BlcmFuZHMuam9pbignKSBPUiAoJyl9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcik7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG9yT3BlcmFuZHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodGVzdEZpZWxkcyh2YWx1ZSwgb3JPcGVyYW5kc1tpXSwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1RTChpdGVtVHlwZTogUVR5cGUsIHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGl0ZW1RbDogc3RyaW5nO1xuICAgIGNvbnN0IGV4cGxhbmF0aW9uID0gcGFyYW1zLmV4cGxhbmF0aW9uO1xuICAgIGlmIChleHBsYW5hdGlvbikge1xuICAgICAgICBjb25zdCBzYXZlUGFyZW50UGF0aCA9IGV4cGxhbmF0aW9uLnBhcmVudFBhdGg7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBgJHtleHBsYW5hdGlvbi5wYXJlbnRQYXRofSR7cGF0aH1bKl1gO1xuICAgICAgICBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IHNhdmVQYXJlbnRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbVFsO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRmllbGRQYXRoQ2hhcihjOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBpZiAoYy5sZW5ndGggIT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGMgPj0gJ0EnICYmIGMgPD0gJ1onKVxuICAgICAgICB8fCAoYyA+PSAnYScgJiYgYyA8PSAneicpXG4gICAgICAgIHx8IChjID49ICcwJyAmJiBjIDw9ICc5JylcbiAgICAgICAgfHwgKGMgPT09ICdfJyB8fCBjID09PSAnWycgfHwgYyA9PT0gJyonIHx8IGMgPT09ICddJyB8fCBjID09PSAnLicpO1xufVxuXG5mdW5jdGlvbiBpc0ZpZWxkUGF0aCh0ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkRmllbGRQYXRoQ2hhcih0ZXN0W2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGg6IHN0cmluZywgaXRlbVFsOiBzdHJpbmcsIHBhcmFtczogUVBhcmFtcyk6ID9zdHJpbmcge1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1zLmNvdW50fWA7XG4gICAgY29uc3Qgc3VmZml4ID0gYCA9PSAke3BhcmFtTmFtZX1gO1xuICAgIGlmIChpdGVtUWwgPT09IGBDVVJSRU5UJHtzdWZmaXh9YCkge1xuICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICB9XG4gICAgaWYgKGl0ZW1RbC5zdGFydHNXaXRoKCdDVVJSRU5ULicpICYmIGl0ZW1RbC5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGl0ZW1RbC5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICBpZiAoaXNGaWVsZFBhdGgoZmllbGRQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXS4ke2ZpZWxkUGF0aH1gO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkUWwgPSB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGgsIGl0ZW1RbCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkUWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZFFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbiJdfQ==