"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.resolveUnixTimeString = resolveUnixTimeString;
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

function resolveUnixTimeString(value) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwiRXJyb3IiLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsInFsT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImpvaW4iLCJxbEluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwicWwiLCJ0ZXN0IiwicGFyZW50Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhck9wcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsImluIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJyZXNvbHZlVW5peFRpbWVTdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJCaWdOdW1iZXJGb3JtYXQiLCJIRVgiLCJERUMiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsImFyZ3MiLCJoZXgiLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJpIiwiZ2V0SXRlbVFMIiwiaXRlbVR5cGUiLCJpdGVtUWwiLCJzYXZlUGFyZW50UGF0aCIsImlzVmFsaWRGaWVsZFBhdGhDaGFyIiwiYyIsImlzRmllbGRQYXRoIiwidHJ5T3B0aW1pemVBcnJheUFueSIsInN1ZmZpeCIsImZpZWxkUGF0aCIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsIm9wdGltaXplZFFsIiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwib25fcGF0aCIsInNwbGl0IiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsInJlc29sdmVSZWZUeXBlIiwicmVmVHlwZSIsImFsaWFzIiwicmVwbGFjZSIsInJlZlFsIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsIkFycmF5IiwiaXNBcnJheSIsInNlbGVjdGVkIiwiX2tleSIsImlkIiwicmVxdWlyZWRGb3JKb2luIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iLCJpbmRleFRvU3RyaW5nIiwiaW5kZXgiLCJwYXJzZUluZGV4IiwicyIsInRyaW0iLCJvcmRlckJ5VG9TdHJpbmciLCJvcmRlckJ5IiwiZGlyZWN0aW9uIiwicGFyc2VPcmRlckJ5IiwicGFydHMiLCJ0b0xvd2VyQ2FzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxTQUFTQSxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FB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QUFDLENBQUNwQyxLQUFGLENBQVEsR0FBUixFQUFhNUgsTUFBYixDQUFvQmlGLENBQUMsSUFBSUEsQ0FBekIsQ0FBZDtBQUNBLFdBQU87QUFDSG5ILE1BQUFBLElBQUksRUFBRXdNLEtBQUssQ0FBQyxDQUFELENBRFI7QUFFSEYsTUFBQUEsU0FBUyxFQUFFLENBQUNFLEtBQUssQ0FBQyxDQUFELENBQUwsSUFBWSxFQUFiLEVBQWlCQyxXQUFqQixPQUFtQyxNQUFuQyxHQUE0QyxNQUE1QyxHQUFxRDtBQUY3RCxLQUFQO0FBSUgsR0FURSxDQUFQO0FBVUgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IEluZGV4SW5mbyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoJy4nKSA/IGJhc2Uuc2xpY2UoMCwgLTEpIDogYmFzZTtcbiAgICBjb25zdCBwID0gcGF0aC5zdGFydHNXaXRoKCcuJykgPyBwYXRoLnNsaWNlKDEpIDogcGF0aDtcbiAgICBjb25zdCBzZXAgPSBwICYmIGIgPyAnLicgOiAnJztcbiAgICByZXR1cm4gYCR7Yn0ke3NlcH0ke3B9YDtcbn1cblxuZXhwb3J0IHR5cGUgU2NhbGFyRmllbGQgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHR5cGU6ICgnbnVtYmVyJyB8ICd1aW50NjQnIHwgJ3VpbnQxMDI0JyB8ICdib29sZWFuJyB8ICdzdHJpbmcnKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBxbDogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHFsRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHFsRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHFsRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmdcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChxbEZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBmaWx0ZXIgZmllbGQ6ICR7ZmlsdGVyS2V5fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVW5peFRpbWVTdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmNvbnN0IEJpZ051bWJlckZvcm1hdCA9IHtcbiAgICBIRVg6ICdIRVgnLFxuICAgIERFQzogJ0RFQycsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnksIGFyZ3M/OiB7IGZvcm1hdD86ICdIRVgnIHwgJ0RFQycgfSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJylcbiAgICAgICAgPyBgMHgke3ZhbHVlLnRvU3RyaW5nKDE2KX1gXG4gICAgICAgIDogYDB4JHt2YWx1ZS50b1N0cmluZygpLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIChmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IChoZXgubGVuZ3RoIC0gMSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cnVjdHNcblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0T3IoZmlsdGVyOiBhbnkpOiBhbnlbXSB7XG4gICAgY29uc3Qgb3BlcmFuZHMgPSBbXTtcbiAgICBsZXQgb3BlcmFuZCA9IGZpbHRlcjtcbiAgICB3aGlsZSAob3BlcmFuZCkge1xuICAgICAgICBpZiAoJ09SJyBpbiBvcGVyYW5kKSB7XG4gICAgICAgICAgICBjb25zdCB3aXRob3V0T3IgPSBPYmplY3QuYXNzaWduKHt9LCBvcGVyYW5kKTtcbiAgICAgICAgICAgIGRlbGV0ZSB3aXRob3V0T3JbJ09SJ107XG4gICAgICAgICAgICBvcGVyYW5kcy5wdXNoKHdpdGhvdXRPcik7XG4gICAgICAgICAgICBvcGVyYW5kID0gb3BlcmFuZC5PUjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2gob3BlcmFuZCk7XG4gICAgICAgICAgICBvcGVyYW5kID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3BlcmFuZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpLm1hcCgob3BlcmFuZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBvcGVyYW5kLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnFsKHBhcmFtcywgY29tYmluZVBhdGgocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gKG9yT3BlcmFuZHMubGVuZ3RoID4gMSkgPyBgKCR7b3JPcGVyYW5kcy5qb2luKCcpIE9SICgnKX0pYCA6IG9yT3BlcmFuZHNbMF07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgb3JPcGVyYW5kcyA9IHNwbGl0T3IoZmlsdGVyKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3JPcGVyYW5kcy5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgICAgIGlmICh0ZXN0RmllbGRzKHZhbHVlLCBvck9wZXJhbmRzW2ldLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gZ2V0SXRlbVFMKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBsZXQgaXRlbVFsOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gc2F2ZVBhcmVudFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgfVxuICAgIHJldHVybiBpdGVtUWw7XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGaWVsZFBhdGhDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoYyA+PSAnQScgJiYgYyA8PSAnWicpXG4gICAgICAgIHx8IChjID49ICdhJyAmJiBjIDw9ICd6JylcbiAgICAgICAgfHwgKGMgPj0gJzAnICYmIGMgPD0gJzknKVxuICAgICAgICB8fCAoYyA9PT0gJ18nIHx8IGMgPT09ICdbJyB8fCBjID09PSAnKicgfHwgYyA9PT0gJ10nIHx8IGMgPT09ICcuJyk7XG59XG5cbmZ1bmN0aW9uIGlzRmllbGRQYXRoKHRlc3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGVzdC5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICBpZiAoIWlzVmFsaWRGaWVsZFBhdGhDaGFyKHRlc3RbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHRyeU9wdGltaXplQXJyYXlBbnkocGF0aDogc3RyaW5nLCBpdGVtUWw6IHN0cmluZywgcGFyYW1zOiBRUGFyYW1zKTogP3N0cmluZyB7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbXMuY291bnR9YDtcbiAgICBjb25zdCBzdWZmaXggPSBgID09ICR7cGFyYW1OYW1lfWA7XG4gICAgaWYgKGl0ZW1RbC5zdGFydHNXaXRoKCdDVVJSRU5ULicpICYmIGl0ZW1RbC5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgIGNvbnN0IGZpZWxkUGF0aCA9IGl0ZW1RbC5zbGljZSgnQ1VSUkVOVC4nLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICBpZiAoaXNGaWVsZFBhdGgoZmllbGRQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXS4ke2ZpZWxkUGF0aH1gO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW1pemVkUWwgPSB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGgsIGl0ZW1RbCwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkUWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9wdGltaXplZFFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbiJdfQ==