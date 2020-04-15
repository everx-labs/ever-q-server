"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enumName = enumName;
exports.createEnumNameResolver = createEnumNameResolver;
exports.resolveBigUInt = resolveBigUInt;
exports.convertBigUInt = convertBigUInt;
exports.struct = struct;
exports.array = array;
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

function struct(fields, isCollection) {
  return {
    ql(params, path, filter) {
      return qlFields(path, filter, fields, (fieldType, path, filterKey, filterValue) => {
        const fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.ql(params, combinePath(path, fieldName), filterValue);
      });
    },

    test(parent, value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, fields, (fieldType, value, filterKey, filterValue) => {
        const fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.test(value, value[fieldName], filterValue);
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwicWxDb21iaW5lIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJxbE9wIiwicGFyYW1zIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJqb2luIiwicWxJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsInFsIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwiaGV4IiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJnZXRJdGVtUUwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsInNhdmVQYXJlbnRQYXRoIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwiRXJyb3IiLCJvbl9wYXRoIiwic3BsaXQiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwic2VsZWN0aW9ucyIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiQXJyYXkiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsImluZGV4VG9TdHJpbmciLCJpbmRleCIsInBhcnNlSW5kZXgiLCJzIiwidHJpbSIsIm9yZGVyQnlUb1N0cmluZyIsIm9yZGVyQnkiLCJkaXJlY3Rpb24iLCJwYXJzZU9yZGVyQnkiLCJwYXJ0cyIsInRvTG93ZXJDYXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxTQUFTQSxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQUVNLE1BQU1HLFlBQU4sQ0FBbUI7QUFJdEJDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0g7O0FBRURDLEVBQUFBLHNCQUFzQixDQUFDWixJQUFELEVBQWVhLEVBQWYsRUFBMkI7QUFDN0MsUUFBSVQsQ0FBQyxHQUFHSixJQUFSOztBQUNBLFFBQUlJLENBQUMsQ0FBQ0MsVUFBRixDQUFhLFNBQWIsQ0FBSixFQUE2QjtBQUN6QkQsTUFBQUEsQ0FBQyxHQUFHTixXQUFXLENBQUMsS0FBS1csVUFBTixFQUFrQkws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Q0FBdUNtRSxDQUFDLElBQUlBLENBQTVDO0FBREwsR0FBUDtBQUdIOztBQUVNLFNBQVNtRSxlQUFULENBQXlCQyxPQUF6QixFQUFxRDtBQUN4RCxTQUFPQSxPQUFPLENBQUM5RyxHQUFSLENBQVkwQyxDQUFDLElBQUssR0FBRUEsQ0FBQyxDQUFDckcsSUFBSyxHQUFFLENBQUNxRyxDQUFDLENBQUNxRSxTQUFGLElBQWUsRUFBaEIsTUFBd0IsTUFBeEIsR0FBaUMsT0FBakMsR0FBMkMsRUFBRyxFQUEzRSxFQUE4RWpILElBQTlFLENBQW1GLElBQW5GLENBQVA7QUFDSDs7QUFFTSxTQUFTa0gsWUFBVCxDQUFzQkwsQ0FBdEIsRUFBNEM7QUFDL0MsU0FBT0EsQ0FBQyxDQUFDcEMsS0FBRixDQUFRLEdBQVIsRUFDRnZFLEdBREUsQ0FDRTBDLENBQUMsSUFBSUEsQ0FBQyxDQUFDa0UsSUFBRixFQURQLEVBRUZySSxNQUZFLENBRUttRSxDQUFDLElBQUlBLENBRlYsRUFHRjFDLEdBSEUsQ0FHRzJHLENBQUQsSUFBTztBQUNSLFVBQU1NLEtBQUssR0FBR04sQ0FBQyxDQUFDcEMsS0FBRixDQUFRLEdBQVIsRUFBYWhHLE1BQWIsQ0FBb0JtRSxDQUFDLElBQUlBLENBQXpCLENBQWQ7QUFDQSxXQUFPO0FBQ0hyRyxNQUFBQSxJQUFJLEVBQUU0SyxLQUFLLENBQUMsQ0FBRCxDQURSO0FBRUhGLE1BQUFBLFNBQVMsRUFBRSxDQUFDRSxLQUFLLENBQUMsQ0FBRCxDQUFMLElBQVksRUFBYixFQUFpQkMsV0FBakIsT0FBbUMsTUFBbkMsR0FBNEMsTUFBNUMsR0FBcUQ7QUFGN0QsS0FBUDtBQUlILEdBVEUsQ0FBUDtBQVVIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBJbmRleEluZm8gfSBmcm9tIFwiLi9jb25maWdcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnBhcmVudFBhdGggPSAnJztcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgbGV0IHAgPSBwYXRoO1xuICAgICAgICBpZiAocC5zdGFydHNXaXRoKCdDVVJSRU5UJykpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKCdDVVJSRU5UJy5sZW5ndGgpKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZzogUUZpZWxkRXhwbGFuYXRpb24gfCB0eXBlb2YgdW5kZWZpbmVkID0gdGhpcy5maWVsZHMuZ2V0KHApO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChwLCB7XG4gICAgICAgICAgICAgICAgb3BlcmF0aW9uczogbmV3IFNldChbb3BdKSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgcWw6IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBxbEZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2gocWxGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhblxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIG9wKTtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA9IChwYXRoID09PSAnX2tleScgfHwgcGF0aC5lbmRzV2l0aCgnLl9rZXknKSkgJiYgb3AgIT09ICc9PScgJiYgb3AgIT09ICchPSc7XG4gICAgY29uc3QgZml4ZWRQYXRoID0gaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gcWxDb21iaW5lKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBxbEluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmNvbnN0IEJpZ051bWJlckZvcm1hdCA9IHtcbiAgICBIRVg6ICdIRVgnLFxuICAgIERFQzogJ0RFQycsXG59O1xuXG5mdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSwgYXJncz86IHsgZm9ybWF0PzogJ0hFWCcgfCAnREVDJyB9KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9ICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKVxuICAgICAgICA/IGAweCR7dmFsdWUudG9TdHJpbmcoMTYpfWBcbiAgICAgICAgOiBgMHgke3ZhbHVlLnRvU3RyaW5nKCkuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbiAgICBjb25zdCBmb3JtYXQgPSAoYXJncyAmJiBhcmdzLmZvcm1hdCkgfHwgQmlnTnVtYmVyRm9ybWF0LkhFWDtcbiAgICByZXR1cm4gKGZvcm1hdCA9PT0gQmlnTnVtYmVyRm9ybWF0LkhFWCkgPyBoZXggOiBCaWdJbnQoaGV4KS50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSBCaWdJbnQodmFsdWUpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7aGV4fWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuY29uc3QgYmlnVUludDE6IFFUeXBlID0gY3JlYXRlQmlnVUludCgxKTtcbmNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vIFN0cnVjdHNcblxuZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUucWwocGFyYW1zLCBjb21iaW5lUGF0aChwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBnZXRJdGVtUUwoaXRlbVR5cGU6IFFUeXBlLCBwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGxldCBpdGVtUWw6IHN0cmluZztcbiAgICBjb25zdCBleHBsYW5hdGlvbiA9IHBhcmFtcy5leHBsYW5hdGlvbjtcbiAgICBpZiAoZXhwbGFuYXRpb24pIHtcbiAgICAgICAgY29uc3Qgc2F2ZVBhcmVudFBhdGggPSBleHBsYW5hdGlvbi5wYXJlbnRQYXRoO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gYCR7ZXhwbGFuYXRpb24ucGFyZW50UGF0aH0ke3BhdGh9WypdYDtcbiAgICAgICAgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBzYXZlUGFyZW50UGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1RbDtcbn1cblxuZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbXMuY291bnQgKyAxfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gZ2V0SXRlbVFMKGl0ZW1UeXBlLCBwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1RbCA9PT0gYENVUlJFTlQgPT0gJHtwYXJhbU5hbWV9YCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLyBKb2luc1xuXG5mdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgPiAwYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBjb252ZXJ0QmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXlcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlXG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIHNsb3c6IGJvb2xlYW4sXG4gICAgdGltZXM6IG51bWJlcltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5kZXhUb1N0cmluZyhpbmRleDogSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUluZGV4KHM6IHN0cmluZyk6IEluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KCcsJykubWFwKHggPT4geC50cmltKCkpLmZpbHRlcih4ID0+IHgpXG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3JkZXJCeVRvU3RyaW5nKG9yZGVyQnk6IE9yZGVyQnlbXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIG9yZGVyQnkubWFwKHggPT4gYCR7eC5wYXRofSR7KHguZGlyZWN0aW9uIHx8ICcnKSA9PT0gJ0RFU0MnID8gJyBERVNDJyA6ICcnfWApLmpvaW4oJywgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU9yZGVyQnkoczogc3RyaW5nKTogT3JkZXJCeVtdIHtcbiAgICByZXR1cm4gcy5zcGxpdCgnLCcpXG4gICAgICAgIC5tYXAoeCA9PiB4LnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih4ID0+IHgpXG4gICAgICAgIC5tYXAoKHMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnRzID0gcy5zcGxpdCgnICcpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCAnJykudG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnID8gJ0RFU0MnIDogJ0FTQycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xufVxuXG5cbiJdfQ==