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
} // Scalars


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
const bigUInt2 = createBigUInt(2); // Structs

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
        const paramName = `@v${params.count + 1}`;
        const itemQl = getItemQL(itemType, params, path, filter);

        if (itemQl === `CURRENT == ${paramName}`) {
          return `${paramName} IN ${path}[*]`;
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
} // Enum Names


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
} // Joins


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwiRXJyb3IiLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsInFsT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImpvaW4iLCJxbEluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwicWwiLCJ0ZXN0IiwicGFyZW50Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhck9wcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsImluIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJyZXNvbHZlVW5peFRpbWVTdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJCaWdOdW1iZXJGb3JtYXQiLCJIRVgiLCJERUMiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsImFyZ3MiLCJoZXgiLCJmb3JtYXQiLCJCaWdJbnQiLCJjb252ZXJ0QmlnVUludCIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInNwbGl0T3IiLCJvcGVyYW5kcyIsIm9wZXJhbmQiLCJ3aXRob3V0T3IiLCJhc3NpZ24iLCJPUiIsInN0cnVjdCIsImlzQ29sbGVjdGlvbiIsIm9yT3BlcmFuZHMiLCJmaWVsZE5hbWUiLCJpIiwiZ2V0SXRlbVFMIiwiaXRlbVR5cGUiLCJpdGVtUWwiLCJzYXZlUGFyZW50UGF0aCIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsInN1Y2NlZWRlZEluZGV4IiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJOdW1iZXIiLCJwYXJzZUludCIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIm9uX3BhdGgiLCJzcGxpdCIsImNvbmNhdCIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJyZWZGaWVsZCIsInJlZkNvbGxlY3Rpb24iLCJyZXNvbHZlUmVmVHlwZSIsInJlZlR5cGUiLCJhbGlhcyIsInJlcGxhY2UiLCJyZWZRbCIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInBhcnNlU2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJzZWxlY3Rpb25zIiwiaXRlbSIsInNlbGVjdGlvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmllbGRTZWxlY3Rpb24iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJBcnJheSIsImlzQXJyYXkiLCJzZWxlY3RlZCIsIl9rZXkiLCJpZCIsInJlcXVpcmVkRm9ySm9pbiIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwic3JjX3RyYW5zYWN0aW9uIiwiZHN0X3RyYW5zYWN0aW9uIiwiaW5kZXhUb1N0cmluZyIsImluZGV4IiwicGFyc2VJbmRleCIsInMiLCJ0cmltIiwib3JkZXJCeVRvU3RyaW5nIiwib3JkZXJCeSIsImRpcmVjdGlvbiIsInBhcnNlT3JkZXJCeSIsInBhcnRzIiwidG9Mb3dlckNhc2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUE0QkEsU0FBU0EsV0FBVCxDQUFxQkMsSUFBckIsRUFBbUNDLElBQW5DLEVBQXlEO0FBQ3JELFFBQU1DLENBQUMsR0FBR0YsSUFBSSxDQUFDRyxRQUFMLENBQWMsR0FBZCxJQUFxQkgsSUFBSSxDQUFDSSxLQUFMLENBQVcsQ0FBWCxFQUFjLENBQUMsQ0FBZixDQUFyQixHQUF5Q0osSUFBbkQ7QUFDQSxRQUFNSyxDQUFDLEdBQUdKLElBQUksQ0FBQ0ssVUFBTCxDQUFnQixHQUFoQixJQUF1QkwsSUFBSSxDQUFDRyxLQUFMLENBQVcsQ0FBWCxDQUF2QixHQUF1Q0gsSUFBakQ7QUFDQSxRQUFNTSxHQUFHLEdBQUdGLENBQUMsSUFBSUgsQ0FBTCxHQUFTLEdBQVQsR0FBZSxFQUEzQjtBQUNBLFNBQVEsR0FBRUEsQ0FBRSxHQUFFSyxHQUFJLEdBQUVGLENBQUUsRUFBdEI7QUFDSDs7QUFPTSxNQUFNRyxZQUFOLENBQW1CO0FBSXRCQyxFQUFBQSxXQUFXLEdBQUc7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QUlILEdBVEUsQ0FBUDtBQVVIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBJbmRleEluZm8gfSBmcm9tIFwiLi9jb25maWdcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCB0eXBlIFNjYWxhckZpZWxkID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICB0eXBlOiAoJ251bWJlcicgfCAndWludDY0JyB8ICd1aW50MTAyNCcgfCAnYm9vbGVhbicgfCAnc3RyaW5nJyksXG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBhcmVudFBhdGggPSAnJztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHAgPSBwYXRoO1xuICAgICAgICBpZiAocC5zdGFydHNXaXRoKCdDVVJSRU5UJykpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZzogUUZpZWxkRXhwbGFuYXRpb24gfCB0eXBlb2YgdW5kZWZpbmVkID0gdGhpcy5maWVsZHMuZ2V0KHApO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uczogbmV3IFNldChbb3BdKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgcWw6IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBxbEZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2gocWxGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmICghZmllbGRUeXBlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIG9wKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA9IChwYXRoID09PSAnX2tleScgfHwgcGF0aC5lbmRzV2l0aCgnLl9rZXknKSkgJiYgb3AgIT09ICc9PScgJiYgb3AgIT09ICchPSc7XG4gICAgY29uc3QgZml4ZWRQYXRoID0gaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gcWxDb21iaW5lKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBxbEluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlVW5peFRpbWVTdHJpbmcodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBkID0gbmV3IERhdGUodmFsdWUpO1xuXG4gICAgZnVuY3Rpb24gcGFkKG51bWJlcikge1xuICAgICAgICBpZiAobnVtYmVyIDwgMTApIHtcbiAgICAgICAgICAgIHJldHVybiAnMCcgKyBudW1iZXI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bWJlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gZC5nZXRVVENGdWxsWWVhcigpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgJy0nICsgcGFkKGQuZ2V0VVRDRGF0ZSgpKSArXG4gICAgICAgICcgJyArIHBhZChkLmdldFVUQ0hvdXJzKCkpICtcbiAgICAgICAgJzonICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgICc6JyArIHBhZChkLmdldFVUQ1NlY29uZHMoKSkgK1xuICAgICAgICAnLicgKyAoZC5nZXRVVENNaWxsaXNlY29uZHMoKSAvIDEwMDApLnRvRml4ZWQoMykuc2xpY2UoMiwgNSk7XG59XG5cbmNvbnN0IEJpZ051bWJlckZvcm1hdCA9IHtcbiAgICBIRVg6ICdIRVgnLFxuICAgIERFQzogJ0RFQycsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnksIGFyZ3M/OiB7IGZvcm1hdD86ICdIRVgnIHwgJ0RFQycgfSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJylcbiAgICAgICAgPyBgMHgke3ZhbHVlLnRvU3RyaW5nKDE2KX1gXG4gICAgICAgIDogYDB4JHt2YWx1ZS50b1N0cmluZygpLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIChmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IChoZXgubGVuZ3RoIC0gMSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5leHBvcnQgY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8gU3RydWN0c1xuXG5leHBvcnQgZnVuY3Rpb24gc3BsaXRPcihmaWx0ZXI6IGFueSk6IGFueVtdIHtcbiAgICBjb25zdCBvcGVyYW5kcyA9IFtdO1xuICAgIGxldCBvcGVyYW5kID0gZmlsdGVyO1xuICAgIHdoaWxlIChvcGVyYW5kKSB7XG4gICAgICAgIGlmICgnT1InIGluIG9wZXJhbmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHdpdGhvdXRPciA9IE9iamVjdC5hc3NpZ24oe30sIG9wZXJhbmQpO1xuICAgICAgICAgICAgZGVsZXRlIHdpdGhvdXRPclsnT1InXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIG9wZXJhbmQsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUucWwocGFyYW1zLCBjb21iaW5lUGF0aChwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAob3JPcGVyYW5kcy5sZW5ndGggPiAxKSA/IGAoJHtvck9wZXJhbmRzLmpvaW4oJykgT1IgKCcpfSlgIDogb3JPcGVyYW5kc1swXTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvck9wZXJhbmRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3RGaWVsZHModmFsdWUsIG9yT3BlcmFuZHNbaV0sIGZpZWxkcywgKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICB9KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtUUwoaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtUWw6IHN0cmluZztcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcbiAgICBpZiAoZXhwbGFuYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2F2ZVBhcmVudFBhdGggPSBleHBsYW5hdGlvbi5wYXJlbnRQYXRoO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcbiAgICAgICAgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1RbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1zLmNvdW50ICsgMX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtUWwgPT09IGBDVVJSRU5UID09ICR7cGFyYW1OYW1lfWApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8gSm9pbnNcblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgaXNGYXN0OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbiJdfQ==