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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwicWxDb21iaW5lIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJxbE9wIiwicGFyYW1zIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJqb2luIiwicWxJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsInFsIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwiaGV4IiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJnZXRJdGVtUUwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsInNhdmVQYXJlbnRQYXRoIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwiRXJyb3IiLCJvbl9wYXRoIiwic3BsaXQiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwic2VsZWN0aW9ucyIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiQXJyYXkiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxTQUFTQSxXQUFULENBQXFCQyxJQUFyQixFQUFtQ0MsSUFBbkMsRUFBeUQ7QUFDckQsUUFBTUMsQ0FBQyxHQUFHRixJQUFJLENBQUNHLFFBQUwsQ0FBYyxHQUFkLElBQXFCSCxJQUFJLENBQUNJLEtBQUwsQ0FBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmLENBQXJCLEdBQXlDSixJQUFuRDtBQUNBLFFBQU1LLENBQUMsR0FBR0osSUFBSSxDQUFDSyxVQUFMLENBQWdCLEdBQWhCLElBQXVCTCxJQUFJLENBQUNHLEtBQUwsQ0FBVyxDQUFYLENBQXZCLEdBQXVDSCxJQUFqRDtBQUNBLFFBQU1NLEdBQUcsR0FBR0YsQ0FBQyxJQUFJSCxDQUFMLEdBQVMsR0FBVCxHQUFlLEVBQTNCO0FBQ0EsU0FBUSxHQUFFQSxDQUFFLEdBQUVLLEdBQUksR0FBRUYsQ0FBRSxFQUF0QjtBQUNIOztBQUVNLE1BQU1HLFlBQU4sQ0FBbUI7QUFHdEJDLEVBQUFBLFdBQVcsR0FBRztBQUNWLFNBQUtDLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsR0FBSixFQUFkO0FBQ0g7O0FBRURDLEVBQUFBLHNCQUFzQixDQUFDWixJQUFELEVBQWVhLEVBQWYsRUFBMkI7QUFDN0MsUUFBSVQsQ0FBQyxHQUFHSixJQUFSOztBQUNBLFFBQUlJLENBQUMsQ0FBQ0MsVUFBRixDQUFhLFNBQWIsQ0FBSixFQUE2QjtBQUN6QkQsTUFBQUEsQ0FBQyxHQUFHTixXQUFXLENBQUMsS0FBS1csVUFBTixFQUFrQkwsQ0FBQyxDQUFDVSxNQUFGLENBQVMsVUFBVUMsTUFBbkIsQ0FBbEIsQ0FBZjtBQUNIOztBQUNELFVBQU1DLFFBQThDLEdBQUcsS0FBS04sTUFBTCxDQUFZTyxHQUFaLENBQWdCYixDQUFoQixDQUF2RDs7QUFDQSxRQUFJWSxRQUFKLEVBQWM7QUFDVkEsTUFBQUEsUUFBUSxDQUFDRSxVQUFULENBQW9CQyxHQUFwQixDQUF3Qk4sRUFBeEI7QUFDSCxLQUZELE1BRU87QUFDSCxXQUFLSCxNQUFMLENBQVlVLEdBQVosQ0FBZ0JoQixDQUFoQixFQUFtQjtBQUNmYyxRQUFBQSxVQUFVLEVBQUUsSUFBSUcsR0FBSixDQUFRLENBQUNSLEVBQUQsQ0FBUjtBQURHLE9BQW5CO0FBR0g7QUFDSjs7QUFyQnFCOzs7O0FBNEIxQjs7O0FBR08sTUFBTVMsT0FBTixDQUFjO0FBS2pCZCxFQUFBQSxXQUFXLENBQUNlLE9BQUQsRUFBMkI7QUFDbEMsU0FBS0MsS0FBTCxHQUFhLENBQWI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsRUFBZDtBQUNBLFNBQUtDLFdBQUwsR0FBb0JILE9BQU8sSUFBSUEsT0FBTyxDQUFDSSxPQUFwQixHQUNiLElBQUlwQixZQUFKLEVBRGEsR0FFYixJQUZOO0FBR0g7O0FBRURxQixFQUFBQSxLQUFLLEdBQUc7QUFDSixTQUFLSixLQUFMLEdBQWEsQ0FBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0g7O0FBRUROLEVBQUFBLEdBQUcsQ0FBQ1UsS0FBRCxFQUFxQjtBQUNwQixTQUFLTCxLQUFMLElBQWMsQ0FBZDtBQUNBLFVBQU1NLElBQUksR0FBSSxJQUFHLEtBQUtOLEtBQUwsQ0FBV08sUUFBWCxFQUFzQixFQUF2QztBQUNBLFNBQUtOLE1BQUwsQ0FBWUssSUFBWixJQUFvQkQsS0FBcEI7QUFDQSxXQUFPQyxJQUFQO0FBQ0g7O0FBRURsQixFQUFBQSxzQkFBc0IsQ0FBQ29CLEtBQUQsRUFBZ0JuQixFQUFoQixFQUE0QjtBQUM5QyxRQUFJLEtBQUthLFdBQVQsRUFBc0I7QUFDbEIsV0FBS0EsV0FBTCxDQUFpQmQsc0JBQWpCLENBQXdDb0IsS0FBeEMsRUFBK0NuQixFQUEvQztBQUNIO0FBQ0o7O0FBN0JnQjtBQWdDckI7Ozs7Ozs7O0FBeUJBOzs7Ozs7Ozs7QUFTQSxTQUFTb0IsUUFBVCxDQUNJakMsSUFESixFQUVJa0MsTUFGSixFQUdJQyxVQUhKLEVBSUlDLE9BSkosRUFLVTtBQUNOLFFBQU1DLFVBQW9CLEdBQUcsRUFBN0I7QUFDQUMsRUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWVMLE1BQWYsRUFBdUJNLE9BQXZCLENBQStCLENBQUMsQ0FBQ0MsU0FBRCxFQUFZQyxXQUFaLENBQUQsS0FBOEI7QUFDekQsVUFBTUMsU0FBUyxHQUFHUixVQUFVLENBQUNNLFNBQUQsQ0FBNUI7O0FBQ0EsUUFBSUUsU0FBSixFQUFlO0FBQ1hOLE1BQUFBLFVBQVUsQ0FBQ08sSUFBWCxDQUFnQlIsT0FBTyxDQUFDTyxTQUFELEVBQVkzQyxJQUFaLEVBQWtCeUMsU0FBbEIsRUFBNkJDLFdBQTdCLENBQXZCO0FBQ0g7QUFDSixHQUxEO0FBTUEsU0FBT0csU0FBUyxDQUFDUixVQUFELEVBQWEsS0FBYixFQUFvQixPQUFwQixDQUFoQjtBQUNIO0FBRUQ7Ozs7Ozs7Ozs7O0FBU0EsU0FBU1MsVUFBVCxDQUNJakIsS0FESixFQUVJSyxNQUZKLEVBR0lDLFVBSEosRUFJSVksU0FKSixFQUtXO0FBQ1AsUUFBTUMsTUFBTSxHQUFHVixNQUFNLENBQUNDLE9BQVAsQ0FBZUwsTUFBZixFQUF1QmUsSUFBdkIsQ0FBNEIsQ0FBQyxDQUFDUixTQUFELEVBQVlDLFdBQVosQ0FBRCxLQUE4QjtBQUNyRSxVQUFNQyxTQUFTLEdBQUdSLFVBQVUsQ0FBQ00sU0FBRCxDQUE1QjtBQUNBLFdBQU8sRUFBRUUsU0FBUyxJQUFJSSxTQUFTLENBQUNKLFNBQUQsRUFBWWQsS0FBWixFQUFtQlksU0FBbkIsRUFBOEJDLFdBQTlCLENBQXhCLENBQVA7QUFDSCxHQUhjLENBQWY7QUFJQSxTQUFPLENBQUNNLE1BQVI7QUFDSDs7QUFFRCxTQUFTRSxJQUFULENBQWNDLE1BQWQsRUFBK0JuRCxJQUEvQixFQUE2Q2EsRUFBN0MsRUFBeURxQixNQUF6RCxFQUE4RTtBQUMxRWlCLEVBQUFBLE1BQU0sQ0FBQ3ZDLHNCQUFQLENBQThCWixJQUE5QixFQUFvQ2EsRUFBcEM7QUFDQSxRQUFNdUMsU0FBUyxHQUFHRCxNQUFNLENBQUNoQyxHQUFQLENBQVdlLE1BQVgsQ0FBbEI7QUFFQTs7Ozs7Ozs7QUFPQSxRQUFNbUIsdUJBQXVCLEdBQUcsQ0FBQ3JELElBQUksS0FBSyxNQUFULElBQW1CQSxJQUFJLENBQUNFLFFBQUwsQ0FBYyxPQUFkLENBQXBCLEtBQStDVyxFQUFFLEtBQUssSUFBdEQsSUFBOERBLEVBQUUsS0FBSyxJQUFyRztBQUNBLFFBQU15QyxTQUFTLEdBQUdELHVCQUF1QixHQUFJLGFBQVlyRCxJQUFLLEdBQXJCLEdBQTBCQSxJQUFuRTtBQUNBLFFBQU11RCxVQUFVLEdBQUksSUFBR0gsU0FBVSxFQUFqQztBQUNBLFNBQVEsR0FBRUUsU0FBVSxJQUFHekMsRUFBRyxJQUFHMEMsVUFBVyxFQUF4QztBQUNIOztBQUVELFNBQVNWLFNBQVQsQ0FBbUJSLFVBQW5CLEVBQXlDeEIsRUFBekMsRUFBcUQyQyxpQkFBckQsRUFBd0Y7QUFDcEYsTUFBSW5CLFVBQVUsQ0FBQ3RCLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT3lDLGlCQUFQO0FBQ0g7O0FBQ0QsTUFBSW5CLFVBQVUsQ0FBQ3RCLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT3NCLFVBQVUsQ0FBQyxDQUFELENBQWpCO0FBQ0g7O0FBQ0QsU0FBTyxNQUFNQSxVQUFVLENBQUNvQixJQUFYLENBQWlCLEtBQUk1QyxFQUFHLElBQXhCLENBQU4sR0FBcUMsR0FBNUM7QUFDSDs7QUFFRCxTQUFTNkMsSUFBVCxDQUFjUCxNQUFkLEVBQStCbkQsSUFBL0IsRUFBNkNrQyxNQUE3QyxFQUFrRTtBQUM5RCxRQUFNRyxVQUFVLEdBQUdILE1BQU0sQ0FBQ3lCLEdBQVAsQ0FBVzlCLEtBQUssSUFBSXFCLElBQUksQ0FBQ0MsTUFBRCxFQUFTbkQsSUFBVCxFQUFlLElBQWYsRUFBcUI2QixLQUFyQixDQUF4QixDQUFuQjtBQUNBLFNBQU9nQixTQUFTLENBQUNSLFVBQUQsRUFBYSxJQUFiLEVBQW1CLE9BQW5CLENBQWhCO0FBQ0gsQyxDQUVEOzs7QUFFQSxTQUFTdUIsZUFBVCxDQUF5QkMsQ0FBekIsRUFBc0M7QUFDbEMsU0FBT0EsQ0FBQyxLQUFLQyxTQUFOLEdBQWtCRCxDQUFsQixHQUFzQixJQUE3QjtBQUNIOztBQUVELE1BQU1FLFFBQWUsR0FBRztBQUNwQkMsRUFBQUEsRUFBRSxDQUFDYixNQUFELEVBQWtCbkQsSUFBbEIsRUFBd0JrQyxNQUF4QixFQUFnQztBQUM5QixXQUFPZ0IsSUFBSSxDQUFDQyxNQUFELEVBQVNuRCxJQUFULEVBQWUsSUFBZixFQUFxQmtDLE1BQXJCLENBQVg7QUFDSCxHQUhtQjs7QUFJcEIrQixFQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFdBQU9MLEtBQUssS0FBS0ssTUFBakI7QUFDSDs7QUFObUIsQ0FBeEI7QUFTQSxNQUFNaUMsUUFBZSxHQUFHO0FBQ3BCSCxFQUFBQSxFQUFFLENBQUNiLE1BQUQsRUFBU25ELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDckIsV0FBT2dCLElBQUksQ0FBQ0MsTUFBRCxFQUFTbkQsSUFBVCxFQUFlLElBQWYsRUFBcUJrQyxNQUFyQixDQUFYO0FBQ0gsR0FIbUI7O0FBSXBCK0IsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPTCxLQUFLLEtBQUtLLE1BQWpCO0FBQ0g7O0FBTm1CLENBQXhCO0FBU0EsTUFBTWtDLFFBQWUsR0FBRztBQUNwQkosRUFBQUEsRUFBRSxDQUFDYixNQUFELEVBQVNuRCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ3JCLFdBQU9nQixJQUFJLENBQUNDLE1BQUQsRUFBU25ELElBQVQsRUFBZSxHQUFmLEVBQW9Ca0MsTUFBcEIsQ0FBWDtBQUNILEdBSG1COztBQUlwQitCLEVBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTckMsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsV0FBT0wsS0FBSyxHQUFHSyxNQUFmO0FBQ0g7O0FBTm1CLENBQXhCO0FBU0EsTUFBTW1DLFFBQWUsR0FBRztBQUNwQkwsRUFBQUEsRUFBRSxDQUFDYixNQUFELEVBQVNuRCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ3JCLFdBQU9nQixJQUFJLENBQUNDLE1BQUQsRUFBU25ELElBQVQsRUFBZSxJQUFmLEVBQXFCa0MsTUFBckIsQ0FBWDtBQUNILEdBSG1COztBQUlwQitCLEVBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTckMsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsV0FBT0wsS0FBSyxJQUFJSyxNQUFoQjtBQUNIOztBQU5tQixDQUF4QjtBQVNBLE1BQU1vQyxRQUFlLEdBQUc7QUFDcEJOLEVBQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixXQUFPZ0IsSUFBSSxDQUFDQyxNQUFELEVBQVNuRCxJQUFULEVBQWUsR0FBZixFQUFvQmtDLE1BQXBCLENBQVg7QUFDSCxHQUhtQjs7QUFJcEIrQixFQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFdBQU9MLEtBQUssR0FBR0ssTUFBZjtBQUNIOztBQU5tQixDQUF4QjtBQVNBLE1BQU1xQyxRQUFlLEdBQUc7QUFDcEJQLEVBQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixXQUFPZ0IsSUFBSSxDQUFDQyxNQUFELEVBQVNuRCxJQUFULEVBQWUsSUFBZixFQUFxQmtDLE1BQXJCLENBQVg7QUFDSCxHQUhtQjs7QUFJcEIrQixFQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFdBQU9MLEtBQUssSUFBSUssTUFBaEI7QUFDSDs7QUFObUIsQ0FBeEI7QUFTQSxNQUFNc0MsUUFBZSxHQUFHO0FBQ3BCUixFQUFBQSxFQUFFLENBQUNiLE1BQUQsRUFBU25ELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDckIsV0FBT3dCLElBQUksQ0FBQ1AsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixDQUFYO0FBQ0gsR0FIbUI7O0FBSXBCK0IsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPQSxNQUFNLENBQUN1QyxRQUFQLENBQWdCNUMsS0FBaEIsQ0FBUDtBQUNIOztBQU5tQixDQUF4QjtBQVNBLE1BQU02QyxXQUFrQixHQUFHO0FBQ3ZCVixFQUFBQSxFQUFFLENBQUNiLE1BQUQsRUFBU25ELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDckIsV0FBUSxRQUFPd0IsSUFBSSxDQUFDUCxNQUFELEVBQVNuRCxJQUFULEVBQWVrQyxNQUFmLENBQXVCLEdBQTFDO0FBQ0gsR0FIc0I7O0FBSXZCK0IsRUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixXQUFPLENBQUNBLE1BQU0sQ0FBQ3VDLFFBQVAsQ0FBZ0I1QyxLQUFoQixDQUFSO0FBQ0g7O0FBTnNCLENBQTNCO0FBU0EsTUFBTThDLFNBQVMsR0FBRztBQUNkQyxFQUFBQSxFQUFFLEVBQUViLFFBRFU7QUFFZGMsRUFBQUEsRUFBRSxFQUFFVixRQUZVO0FBR2RXLEVBQUFBLEVBQUUsRUFBRVYsUUFIVTtBQUlkVyxFQUFBQSxFQUFFLEVBQUVWLFFBSlU7QUFLZFcsRUFBQUEsRUFBRSxFQUFFVixRQUxVO0FBTWRXLEVBQUFBLEVBQUUsRUFBRVYsUUFOVTtBQU9kVyxFQUFBQSxFQUFFLEVBQUVWLFFBUFU7QUFRZFcsRUFBQUEsS0FBSyxFQUFFVDtBQVJPLENBQWxCOztBQVdBLFNBQVNVLFlBQVQsR0FBK0I7QUFDM0IsU0FBTztBQUNIcEIsSUFBQUEsRUFBRSxDQUFDYixNQUFELEVBQVNuRCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ3JCLGFBQU9ELFFBQVEsQ0FBQ2pDLElBQUQsRUFBT2tDLE1BQVAsRUFBZXlDLFNBQWYsRUFBMEIsQ0FBQzlELEVBQUQsRUFBS2IsSUFBTCxFQUFXeUMsU0FBWCxFQUFzQkMsV0FBdEIsS0FBc0M7QUFDM0UsZUFBTzdCLEVBQUUsQ0FBQ21ELEVBQUgsQ0FBTWIsTUFBTixFQUFjbkQsSUFBZCxFQUFvQjBDLFdBQXBCLENBQVA7QUFDSCxPQUZjLENBQWY7QUFHSCxLQUxFOztBQU1IdUIsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixhQUFPWSxVQUFVLENBQUNqQixLQUFELEVBQVFLLE1BQVIsRUFBZ0J5QyxTQUFoQixFQUEyQixDQUFDOUQsRUFBRCxFQUFLZ0IsS0FBTCxFQUFZWSxTQUFaLEVBQXVCQyxXQUF2QixLQUF1QztBQUMvRSxlQUFPN0IsRUFBRSxDQUFDb0QsSUFBSCxDQUFRQyxNQUFSLEVBQWdCTixlQUFlLENBQUMvQixLQUFELENBQS9CLEVBQXdDYSxXQUF4QyxDQUFQO0FBQ0gsT0FGZ0IsQ0FBakI7QUFHSDs7QUFWRSxHQUFQO0FBWUg7O0FBRUQsTUFBTTJDLGVBQWUsR0FBRztBQUNwQkMsRUFBQUEsR0FBRyxFQUFFLEtBRGU7QUFFcEJDLEVBQUFBLEdBQUcsRUFBRTtBQUZlLENBQXhCOztBQUtBLFNBQVNDLGNBQVQsQ0FBd0JDLFlBQXhCLEVBQThDNUQsS0FBOUMsRUFBMEQ2RCxJQUExRCxFQUFxRztBQUNqRyxNQUFJN0QsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBS2lDLFNBQWhDLEVBQTJDO0FBQ3ZDLFdBQU9qQyxLQUFQO0FBQ0g7O0FBQ0QsUUFBTThELEdBQUcsR0FBSSxPQUFPOUQsS0FBUCxLQUFpQixRQUFsQixHQUNMLEtBQUlBLEtBQUssQ0FBQ0UsUUFBTixDQUFlLEVBQWYsQ0FBbUIsRUFEbEIsR0FFTCxLQUFJRixLQUFLLENBQUNFLFFBQU4sR0FBaUJqQixNQUFqQixDQUF3QjJFLFlBQXhCLENBQXNDLEVBRmpEO0FBR0EsUUFBTUcsTUFBTSxHQUFJRixJQUFJLElBQUlBLElBQUksQ0FBQ0UsTUFBZCxJQUF5QlAsZUFBZSxDQUFDQyxHQUF4RDtBQUNBLFNBQVFNLE1BQU0sS0FBS1AsZUFBZSxDQUFDQyxHQUE1QixHQUFtQ0ssR0FBbkMsR0FBeUNFLE1BQU0sQ0FBQ0YsR0FBRCxDQUFOLENBQVk1RCxRQUFaLEVBQWhEO0FBQ0g7O0FBRUQsU0FBUytELGNBQVQsQ0FBd0JMLFlBQXhCLEVBQThDNUQsS0FBOUMsRUFBa0U7QUFDOUQsTUFBSUEsS0FBSyxLQUFLLElBQVYsSUFBa0JBLEtBQUssS0FBS2lDLFNBQWhDLEVBQTJDO0FBQ3ZDLFdBQU9qQyxLQUFQO0FBQ0g7O0FBQ0QsUUFBTThELEdBQUcsR0FBR0UsTUFBTSxDQUFDaEUsS0FBRCxDQUFOLENBQWNFLFFBQWQsQ0FBdUIsRUFBdkIsQ0FBWjtBQUNBLFFBQU1nRSxHQUFHLEdBQUcsQ0FBQ0osR0FBRyxDQUFDNUUsTUFBSixHQUFhLENBQWQsRUFBaUJnQixRQUFqQixDQUEwQixFQUExQixDQUFaO0FBQ0EsUUFBTWlFLFlBQVksR0FBR1AsWUFBWSxHQUFHTSxHQUFHLENBQUNoRixNQUF4QztBQUNBLFFBQU1rRixNQUFNLEdBQUdELFlBQVksR0FBRyxDQUFmLEdBQW9CLEdBQUUsSUFBSUUsTUFBSixDQUFXRixZQUFYLENBQXlCLEdBQUVELEdBQUksRUFBckQsR0FBeURBLEdBQXhFO0FBQ0EsU0FBUSxHQUFFRSxNQUFPLEdBQUVOLEdBQUksRUFBdkI7QUFDSDs7QUFFRCxTQUFTUSxhQUFULENBQXVCVixZQUF2QixFQUFvRDtBQUNoRCxTQUFPO0FBQ0h6QixJQUFBQSxFQUFFLENBQUNiLE1BQUQsRUFBU25ELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDckIsYUFBT0QsUUFBUSxDQUFDakMsSUFBRCxFQUFPa0MsTUFBUCxFQUFleUMsU0FBZixFQUEwQixDQUFDOUQsRUFBRCxFQUFLYixJQUFMLEVBQVd5QyxTQUFYLEVBQXNCQyxXQUF0QixLQUFzQztBQUMzRSxjQUFNMEQsU0FBUyxHQUFJdkYsRUFBRSxLQUFLOEQsU0FBUyxDQUFDTyxFQUFqQixJQUF1QnJFLEVBQUUsS0FBSzhELFNBQVMsQ0FBQ1EsS0FBekMsR0FDWnpDLFdBQVcsQ0FBQ2lCLEdBQVosQ0FBZ0IwQyxDQUFDLElBQUlQLGNBQWMsQ0FBQ0wsWUFBRCxFQUFlWSxDQUFmLENBQW5DLENBRFksR0FFWlAsY0FBYyxDQUFDTCxZQUFELEVBQWUvQyxXQUFmLENBRnBCO0FBR0EsZUFBTzdCLEVBQUUsQ0FBQ21ELEVBQUgsQ0FBTWIsTUFBTixFQUFjbkQsSUFBZCxFQUFvQm9HLFNBQXBCLENBQVA7QUFDSCxPQUxjLENBQWY7QUFNSCxLQVJFOztBQVNIbkMsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixhQUFPWSxVQUFVLENBQUNqQixLQUFELEVBQVFLLE1BQVIsRUFBZ0J5QyxTQUFoQixFQUEyQixDQUFDOUQsRUFBRCxFQUFLZ0IsS0FBTCxFQUFZWSxTQUFaLEVBQXVCQyxXQUF2QixLQUF1QztBQUMvRSxjQUFNMEQsU0FBUyxHQUFJdkYsRUFBRSxLQUFLOEQsU0FBUyxDQUFDTyxFQUFqQixJQUF1QnJFLEVBQUUsS0FBSzhELFNBQVMsQ0FBQ1EsS0FBekMsR0FDWnpDLFdBQVcsQ0FBQ2lCLEdBQVosQ0FBZ0IwQyxDQUFDLElBQUlQLGNBQWMsQ0FBQ0wsWUFBRCxFQUFlWSxDQUFmLENBQW5DLENBRFksR0FFWlAsY0FBYyxDQUFDTCxZQUFELEVBQWUvQyxXQUFmLENBRnBCO0FBR0EsZUFBTzdCLEVBQUUsQ0FBQ29ELElBQUgsQ0FBUUMsTUFBUixFQUFnQnJDLEtBQWhCLEVBQXVCdUUsU0FBdkIsQ0FBUDtBQUNILE9BTGdCLENBQWpCO0FBTUg7O0FBaEJFLEdBQVA7QUFrQkg7O0FBRUQsTUFBTUUsTUFBYSxHQUFHbEIsWUFBWSxFQUFsQzs7QUFDQSxNQUFNbUIsUUFBZSxHQUFHSixhQUFhLENBQUMsQ0FBRCxDQUFyQzs7QUFDQSxNQUFNSyxRQUFlLEdBQUdMLGFBQWEsQ0FBQyxDQUFELENBQXJDLEMsQ0FFQTs7OztBQUVBLFNBQVNNLE1BQVQsQ0FBZ0IvRixNQUFoQixFQUE2Q2dHLFlBQTdDLEVBQTRFO0FBQ3hFLFNBQU87QUFDSDFDLElBQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixhQUFPRCxRQUFRLENBQUNqQyxJQUFELEVBQU9rQyxNQUFQLEVBQWV4QixNQUFmLEVBQXVCLENBQUNpQyxTQUFELEVBQVkzQyxJQUFaLEVBQWtCeUMsU0FBbEIsRUFBNkJDLFdBQTdCLEtBQTZDO0FBQy9FLGNBQU1pRSxTQUFTLEdBQUdELFlBQVksSUFBS2pFLFNBQVMsS0FBSyxJQUEvQixHQUF1QyxNQUF2QyxHQUFnREEsU0FBbEU7QUFDQSxlQUFPRSxTQUFTLENBQUNxQixFQUFWLENBQWFiLE1BQWIsRUFBcUJyRCxXQUFXLENBQUNFLElBQUQsRUFBTzJHLFNBQVAsQ0FBaEMsRUFBbURqRSxXQUFuRCxDQUFQO0FBQ0gsT0FIYyxDQUFmO0FBSUgsS0FORTs7QUFPSHVCLElBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTckMsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsVUFBSSxDQUFDTCxLQUFMLEVBQVk7QUFDUixlQUFPLEtBQVA7QUFDSDs7QUFDRCxhQUFPaUIsVUFBVSxDQUFDakIsS0FBRCxFQUFRSyxNQUFSLEVBQWdCeEIsTUFBaEIsRUFBd0IsQ0FBQ2lDLFNBQUQsRUFBWWQsS0FBWixFQUFtQlksU0FBbkIsRUFBOEJDLFdBQTlCLEtBQThDO0FBQ25GLGNBQU1pRSxTQUFTLEdBQUdELFlBQVksSUFBS2pFLFNBQVMsS0FBSyxJQUEvQixHQUF1QyxNQUF2QyxHQUFnREEsU0FBbEU7QUFDQSxlQUFPRSxTQUFTLENBQUNzQixJQUFWLENBQWVwQyxLQUFmLEVBQXNCQSxLQUFLLENBQUM4RSxTQUFELENBQTNCLEVBQXdDakUsV0FBeEMsQ0FBUDtBQUNILE9BSGdCLENBQWpCO0FBSUg7O0FBZkUsR0FBUDtBQWlCSCxDLENBRUQ7OztBQUVBLFNBQVNrRSxTQUFULENBQW1CQyxRQUFuQixFQUFvQzFELE1BQXBDLEVBQXFEbkQsSUFBckQsRUFBbUVrQyxNQUFuRSxFQUF3RjtBQUNwRixNQUFJNEUsTUFBSjtBQUNBLFFBQU1wRixXQUFXLEdBQUd5QixNQUFNLENBQUN6QixXQUEzQjs7QUFDQSxNQUFJQSxXQUFKLEVBQWlCO0FBQ2IsVUFBTXFGLGNBQWMsR0FBR3JGLFdBQVcsQ0FBQ2pCLFVBQW5DO0FBQ0FpQixJQUFBQSxXQUFXLENBQUNqQixVQUFaLEdBQTBCLEdBQUVpQixXQUFXLENBQUNqQixVQUFXLEdBQUVULElBQUssS0FBMUQ7QUFDQThHLElBQUFBLE1BQU0sR0FBR0QsUUFBUSxDQUFDN0MsRUFBVCxDQUFZYixNQUFaLEVBQW9CLFNBQXBCLEVBQStCakIsTUFBL0IsQ0FBVDtBQUNBUixJQUFBQSxXQUFXLENBQUNqQixVQUFaLEdBQXlCc0csY0FBekI7QUFDSCxHQUxELE1BS087QUFDSEQsSUFBQUEsTUFBTSxHQUFHRCxRQUFRLENBQUM3QyxFQUFULENBQVliLE1BQVosRUFBb0IsU0FBcEIsRUFBK0JqQixNQUEvQixDQUFUO0FBQ0g7O0FBQ0QsU0FBTzRFLE1BQVA7QUFDSDs7QUFFRCxTQUFTRSxLQUFULENBQWVDLGVBQWYsRUFBb0Q7QUFDaEQsTUFBSUMsUUFBZ0IsR0FBRyxJQUF2QjtBQUNBLFFBQU1DLEdBQUcsR0FBRztBQUNSQyxJQUFBQSxHQUFHLEVBQUU7QUFDRHBELE1BQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixjQUFNMkUsUUFBUSxHQUFHSyxRQUFRLEtBQUtBLFFBQVEsR0FBR0QsZUFBZSxFQUEvQixDQUF6QjtBQUNBLGNBQU1ILE1BQU0sR0FBR0YsU0FBUyxDQUFDQyxRQUFELEVBQVcxRCxNQUFYLEVBQW1CbkQsSUFBbkIsRUFBeUJrQyxNQUF6QixDQUF4QjtBQUNBLGVBQVEsVUFBU2xDLElBQUssYUFBWThHLE1BQU8sZ0JBQWU5RyxJQUFLLEdBQTdEO0FBQ0gsT0FMQTs7QUFNRGlFLE1BQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTckMsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsY0FBTTJFLFFBQVEsR0FBR0ssUUFBUSxLQUFLQSxRQUFRLEdBQUdELGVBQWUsRUFBL0IsQ0FBekI7QUFDQSxjQUFNSSxXQUFXLEdBQUd4RixLQUFLLENBQUN5RixTQUFOLENBQWdCakIsQ0FBQyxJQUFJLENBQUNRLFFBQVEsQ0FBQzVDLElBQVQsQ0FBY0MsTUFBZCxFQUFzQm1DLENBQXRCLEVBQXlCbkUsTUFBekIsQ0FBdEIsQ0FBcEI7QUFDQSxlQUFPbUYsV0FBVyxHQUFHLENBQXJCO0FBQ0g7O0FBVkEsS0FERztBQWFSRSxJQUFBQSxHQUFHLEVBQUU7QUFDRHZELE1BQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixjQUFNMkUsUUFBUSxHQUFHSyxRQUFRLEtBQUtBLFFBQVEsR0FBR0QsZUFBZSxFQUEvQixDQUF6QjtBQUNBLGNBQU03RCxTQUFTLEdBQUksS0FBSUQsTUFBTSxDQUFDM0IsS0FBUCxHQUFlLENBQUUsRUFBeEM7QUFDQSxjQUFNc0YsTUFBTSxHQUFHRixTQUFTLENBQUNDLFFBQUQsRUFBVzFELE1BQVgsRUFBbUJuRCxJQUFuQixFQUF5QmtDLE1BQXpCLENBQXhCOztBQUNBLFlBQUk0RSxNQUFNLEtBQU0sY0FBYTFELFNBQVUsRUFBdkMsRUFBMEM7QUFDdEMsaUJBQVEsR0FBRUEsU0FBVSxPQUFNcEQsSUFBSyxLQUEvQjtBQUNIOztBQUNELGVBQVEsVUFBU0EsSUFBSyxhQUFZOEcsTUFBTyxRQUF6QztBQUNILE9BVEE7O0FBVUQ3QyxNQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLGNBQU0yRSxRQUFRLEdBQUdLLFFBQVEsS0FBS0EsUUFBUSxHQUFHRCxlQUFlLEVBQS9CLENBQXpCO0FBQ0EsY0FBTU8sY0FBYyxHQUFHM0YsS0FBSyxDQUFDeUYsU0FBTixDQUFnQmpCLENBQUMsSUFBSVEsUUFBUSxDQUFDNUMsSUFBVCxDQUFjQyxNQUFkLEVBQXNCbUMsQ0FBdEIsRUFBeUJuRSxNQUF6QixDQUFyQixDQUF2QjtBQUNBLGVBQU9zRixjQUFjLElBQUksQ0FBekI7QUFDSDs7QUFkQTtBQWJHLEdBQVo7QUE4QkEsU0FBTztBQUNIeEQsSUFBQUEsRUFBRSxDQUFDYixNQUFELEVBQVNuRCxJQUFULEVBQWVrQyxNQUFmLEVBQXVCO0FBQ3JCLGFBQU9ELFFBQVEsQ0FBQ2pDLElBQUQsRUFBT2tDLE1BQVAsRUFBZWlGLEdBQWYsRUFBb0IsQ0FBQ3RHLEVBQUQsRUFBS2IsSUFBTCxFQUFXeUMsU0FBWCxFQUFzQkMsV0FBdEIsS0FBc0M7QUFDckUsZUFBTzdCLEVBQUUsQ0FBQ21ELEVBQUgsQ0FBTWIsTUFBTixFQUFjbkQsSUFBZCxFQUFvQjBDLFdBQXBCLENBQVA7QUFDSCxPQUZjLENBQWY7QUFHSCxLQUxFOztBQU1IdUIsSUFBQUEsSUFBSSxDQUFDQyxNQUFELEVBQVNyQyxLQUFULEVBQWdCSyxNQUFoQixFQUF3QjtBQUN4QixVQUFJLENBQUNMLEtBQUwsRUFBWTtBQUNSLGVBQU8sS0FBUDtBQUNIOztBQUNELGFBQU9pQixVQUFVLENBQUNqQixLQUFELEVBQVFLLE1BQVIsRUFBZ0JpRixHQUFoQixFQUFxQixDQUFDdEcsRUFBRCxFQUFLZ0IsS0FBTCxFQUFZWSxTQUFaLEVBQXVCQyxXQUF2QixLQUF1QztBQUN6RSxlQUFPN0IsRUFBRSxDQUFDb0QsSUFBSCxDQUFRQyxNQUFSLEVBQWdCckMsS0FBaEIsRUFBdUJhLFdBQXZCLENBQVA7QUFDSCxPQUZnQixDQUFqQjtBQUdIOztBQWJFLEdBQVA7QUFlSCxDLENBRUQ7OztBQUVBLFNBQVMrRSxrQkFBVCxDQUE0QmhHLE1BQTVCLEVBQStFO0FBQzNFLFFBQU1pRyxLQUEwQixHQUFHLElBQUkvRyxHQUFKLEVBQW5DO0FBQ0EyQixFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZWQsTUFBZixFQUF1QmUsT0FBdkIsQ0FBK0IsQ0FBQyxDQUFDVixJQUFELEVBQU9ELEtBQVAsQ0FBRCxLQUFtQjtBQUM5QzZGLElBQUFBLEtBQUssQ0FBQ3RHLEdBQU4sQ0FBVXVHLE1BQU0sQ0FBQ0MsUUFBUCxDQUFpQi9GLEtBQWpCLENBQVYsRUFBeUNDLElBQXpDO0FBQ0gsR0FGRDtBQUdBLFNBQU80RixLQUFQO0FBQ0g7O0FBRU0sU0FBU0csUUFBVCxDQUFrQkMsT0FBbEIsRUFBbUNyRyxNQUFuQyxFQUF3RTtBQUMzRSxRQUFNc0csWUFBWSxHQUFJakcsSUFBRCxJQUFVO0FBQzNCLFFBQUlELEtBQUssR0FBR0osTUFBTSxDQUFDSyxJQUFELENBQWxCOztBQUNBLFFBQUlELEtBQUssS0FBS2lDLFNBQWQsRUFBeUI7QUFDckIsWUFBTSxJQUFJa0UsS0FBSixDQUFXLGtCQUFpQmxHLElBQUssU0FBUWdHLE9BQVEsT0FBakQsQ0FBTjtBQUNIOztBQUNELFdBQU9qRyxLQUFQO0FBQ0gsR0FORDs7QUFRQSxTQUFPO0FBQ0htQyxJQUFBQSxFQUFFLENBQUNiLE1BQUQsRUFBU25ELElBQVQsRUFBZWtDLE1BQWYsRUFBdUI7QUFDckIsWUFBTStGLE9BQU8sR0FBR2pJLElBQUksQ0FBQ2tJLEtBQUwsQ0FBVyxHQUFYLEVBQWdCL0gsS0FBaEIsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBQyxDQUExQixFQUE2QmdJLE1BQTdCLENBQW9DTCxPQUFwQyxFQUE2Q3JFLElBQTdDLENBQWtELEdBQWxELENBQWhCO0FBQ0EsYUFBT3hCLFFBQVEsQ0FBQ2dHLE9BQUQsRUFBVS9GLE1BQVYsRUFBa0J5QyxTQUFsQixFQUE2QixDQUFDOUQsRUFBRCxFQUFLYixJQUFMLEVBQVd5QyxTQUFYLEVBQXNCQyxXQUF0QixLQUFzQztBQUM5RSxjQUFNd0UsUUFBUSxHQUFJckcsRUFBRSxLQUFLOEQsU0FBUyxDQUFDTyxFQUFqQixJQUF1QnJFLEVBQUUsS0FBSzhELFNBQVMsQ0FBQ1EsS0FBekMsR0FDWHpDLFdBQVcsQ0FBQ2lCLEdBQVosQ0FBZ0JvRSxZQUFoQixDQURXLEdBRVhBLFlBQVksQ0FBQ3JGLFdBQUQsQ0FGbEI7QUFHQSxlQUFPN0IsRUFBRSxDQUFDbUQsRUFBSCxDQUFNYixNQUFOLEVBQWNuRCxJQUFkLEVBQW9Ca0gsUUFBcEIsQ0FBUDtBQUNILE9BTGMsQ0FBZjtBQU1ILEtBVEU7O0FBVUhqRCxJQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLGFBQU9ZLFVBQVUsQ0FBQ2pCLEtBQUQsRUFBUUssTUFBUixFQUFnQnlDLFNBQWhCLEVBQTJCLENBQUM5RCxFQUFELEVBQUtnQixLQUFMLEVBQVlZLFNBQVosRUFBdUJDLFdBQXZCLEtBQXVDO0FBQy9FLGNBQU13RSxRQUFRLEdBQUlyRyxFQUFFLEtBQUs4RCxTQUFTLENBQUNPLEVBQWpCLElBQXVCckUsRUFBRSxLQUFLOEQsU0FBUyxDQUFDUSxLQUF6QyxHQUNYekMsV0FBVyxDQUFDaUIsR0FBWixDQUFnQm9FLFlBQWhCLENBRFcsR0FFWEEsWUFBWSxDQUFDckYsV0FBRCxDQUZsQjtBQUdBLGVBQU83QixFQUFFLENBQUNvRCxJQUFILENBQVFDLE1BQVIsRUFBZ0JBLE1BQU0sQ0FBQzRELE9BQUQsQ0FBdEIsRUFBaUNaLFFBQWpDLENBQVA7QUFDSCxPQUxnQixDQUFqQjtBQU1IOztBQWpCRSxHQUFQO0FBbUJIOztBQUVNLFNBQVNrQixzQkFBVCxDQUFnQ04sT0FBaEMsRUFBaURyRyxNQUFqRCxFQUFvRztBQUN2RyxRQUFNaUcsS0FBSyxHQUFHRCxrQkFBa0IsQ0FBQ2hHLE1BQUQsQ0FBaEM7QUFDQSxTQUFReUMsTUFBRCxJQUFZO0FBQ2YsVUFBTXJDLEtBQUssR0FBR3FDLE1BQU0sQ0FBQzRELE9BQUQsQ0FBcEI7QUFDQSxVQUFNaEcsSUFBSSxHQUFHNEYsS0FBSyxDQUFDekcsR0FBTixDQUFVWSxLQUFWLENBQWI7QUFDQSxXQUFPQyxJQUFJLEtBQUtnQyxTQUFULEdBQXFCaEMsSUFBckIsR0FBNEIsSUFBbkM7QUFDSCxHQUpEO0FBS0gsQyxDQUVEOzs7QUFFQSxTQUFTMkIsSUFBVCxDQUFjcUUsT0FBZCxFQUErQk8sUUFBL0IsRUFBaURDLGFBQWpELEVBQXdFQyxjQUF4RSxFQUE0RztBQUN4RyxNQUFJckIsUUFBZ0IsR0FBRyxJQUF2QjtBQUNBLFNBQU87QUFDSGxELElBQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixZQUFNc0csT0FBTyxHQUFHdEIsUUFBUSxLQUFLQSxRQUFRLEdBQUdxQixjQUFjLEVBQTlCLENBQXhCO0FBQ0EsWUFBTU4sT0FBTyxHQUFHakksSUFBSSxDQUFDa0ksS0FBTCxDQUFXLEdBQVgsRUFBZ0IvSCxLQUFoQixDQUFzQixDQUF0QixFQUF5QixDQUFDLENBQTFCLEVBQTZCZ0ksTUFBN0IsQ0FBb0NMLE9BQXBDLEVBQTZDckUsSUFBN0MsQ0FBa0QsR0FBbEQsQ0FBaEI7QUFDQSxZQUFNZ0YsS0FBSyxHQUFJLEdBQUVSLE9BQU8sQ0FBQ1MsT0FBUixDQUFnQixHQUFoQixFQUFxQixHQUFyQixDQUEwQixFQUEzQztBQUNBLFlBQU1DLEtBQUssR0FBR0gsT0FBTyxDQUFDeEUsRUFBUixDQUFXYixNQUFYLEVBQW1Cc0YsS0FBbkIsRUFBMEJ2RyxNQUExQixDQUFkO0FBQ0EsYUFBUTs7MEJBRU11RyxLQUFNLE9BQU1ILGFBQWM7OEJBQ3RCRyxLQUFNLFlBQVdSLE9BQVEsVUFBU1UsS0FBTTs7O3NCQUgxRDtBQU9ILEtBYkU7O0FBY0gxRSxJQUFBQSxJQUFJLENBQUNDLE1BQUQsRUFBU3JDLEtBQVQsRUFBZ0JLLE1BQWhCLEVBQXdCO0FBQ3hCLFlBQU1zRyxPQUFPLEdBQUd0QixRQUFRLEtBQUtBLFFBQVEsR0FBR3FCLGNBQWMsRUFBOUIsQ0FBeEI7QUFDQSxhQUFPQyxPQUFPLENBQUN2RSxJQUFSLENBQWFDLE1BQWIsRUFBcUJyQyxLQUFyQixFQUE0QkssTUFBNUIsQ0FBUDtBQUNIOztBQWpCRSxHQUFQO0FBbUJIOztBQUVELFNBQVMwRyxTQUFULENBQW1CZCxPQUFuQixFQUFvQ08sUUFBcEMsRUFBc0RDLGFBQXRELEVBQTZFQyxjQUE3RSxFQUFpSDtBQUM3RyxNQUFJckIsUUFBZ0IsR0FBRyxJQUF2QjtBQUNBLFNBQU87QUFDSGxELElBQUFBLEVBQUUsQ0FBQ2IsTUFBRCxFQUFTbkQsSUFBVCxFQUFla0MsTUFBZixFQUF1QjtBQUNyQixZQUFNc0csT0FBTyxHQUFHdEIsUUFBUSxLQUFLQSxRQUFRLEdBQUdxQixjQUFjLEVBQTlCLENBQXhCO0FBQ0EsWUFBTU0sU0FBUyxHQUFHM0csTUFBTSxDQUFDa0YsR0FBUCxJQUFjbEYsTUFBTSxDQUFDcUYsR0FBdkM7QUFDQSxZQUFNSCxHQUFHLEdBQUcsQ0FBQyxDQUFDbEYsTUFBTSxDQUFDa0YsR0FBckI7QUFDQSxZQUFNYSxPQUFPLEdBQUdqSSxJQUFJLENBQUNrSSxLQUFMLENBQVcsR0FBWCxFQUFnQi9ILEtBQWhCLENBQXNCLENBQXRCLEVBQXlCLENBQUMsQ0FBMUIsRUFBNkJnSSxNQUE3QixDQUFvQ0wsT0FBcEMsRUFBNkNyRSxJQUE3QyxDQUFrRCxHQUFsRCxDQUFoQjtBQUNBLFlBQU1nRixLQUFLLEdBQUksR0FBRVIsT0FBTyxDQUFDUyxPQUFSLENBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLENBQTBCLEVBQTNDO0FBQ0EsWUFBTUMsS0FBSyxHQUFHSCxPQUFPLENBQUN4RSxFQUFSLENBQVdiLE1BQVgsRUFBbUJzRixLQUFuQixFQUEwQkksU0FBMUIsQ0FBZDtBQUNBLGFBQVE7MEJBQ01aLE9BQVE7OzBCQUVSUSxLQUFNLE9BQU1ILGFBQWM7OEJBQ3RCRyxLQUFNLFlBQVdSLE9BQVEsVUFBU1UsS0FBTTtzQkFDaEQsQ0FBQ3ZCLEdBQUQsR0FBTyxTQUFQLEdBQW1CLEVBQUc7O29CQUV4QkEsR0FBRyxHQUFJLGFBQVlhLE9BQVEsR0FBeEIsR0FBNkIsS0FBTSxHQVA5QztBQVFILEtBaEJFOztBQWlCSGhFLElBQUFBLElBQUksQ0FBQ0MsTUFBRCxFQUFTckMsS0FBVCxFQUFnQkssTUFBaEIsRUFBd0I7QUFDeEIsWUFBTXNHLE9BQU8sR0FBR3RCLFFBQVEsS0FBS0EsUUFBUSxHQUFHcUIsY0FBYyxFQUE5QixDQUF4QjtBQUNBLGFBQU9DLE9BQU8sQ0FBQ3ZFLElBQVIsQ0FBYUMsTUFBYixFQUFxQnJDLEtBQXJCLEVBQTRCSyxNQUE1QixDQUFQO0FBQ0g7O0FBcEJFLEdBQVA7QUFzQkg7O0FBdUJNLFNBQVM0RyxpQkFBVCxDQUEyQkMsWUFBM0IsRUFBOENDLG9CQUE5QyxFQUE4RjtBQUNqRyxRQUFNdEksTUFBd0IsR0FBRyxFQUFqQztBQUNBLFFBQU11SSxVQUFVLEdBQUdGLFlBQVksSUFBSUEsWUFBWSxDQUFDRSxVQUFoRDs7QUFDQSxNQUFJQSxVQUFKLEVBQWdCO0FBQ1osU0FBSyxNQUFNQyxJQUFYLElBQW1CRCxVQUFuQixFQUErQjtBQUMzQixZQUFNbkgsSUFBSSxHQUFJb0gsSUFBSSxDQUFDcEgsSUFBTCxJQUFhb0gsSUFBSSxDQUFDcEgsSUFBTCxDQUFVRCxLQUF4QixJQUFrQyxFQUEvQzs7QUFDQSxVQUFJQyxJQUFKLEVBQVU7QUFDTixjQUFNRSxLQUFxQixHQUFHO0FBQzFCRixVQUFBQSxJQUQwQjtBQUUxQnFILFVBQUFBLFNBQVMsRUFBRUwsaUJBQWlCLENBQUNJLElBQUksQ0FBQ0gsWUFBTixFQUFvQixFQUFwQjtBQUZGLFNBQTlCOztBQUlBLFlBQUlDLG9CQUFvQixLQUFLLEVBQXpCLElBQStCaEgsS0FBSyxDQUFDRixJQUFOLEtBQWVrSCxvQkFBbEQsRUFBd0U7QUFDcEUsaUJBQU9oSCxLQUFLLENBQUNtSCxTQUFiO0FBQ0g7O0FBQ0R6SSxRQUFBQSxNQUFNLENBQUNrQyxJQUFQLENBQVlaLEtBQVo7QUFDSDtBQUNKO0FBQ0o7O0FBQ0QsU0FBT3RCLE1BQVA7QUFDSDs7QUFFTSxTQUFTMEksaUJBQVQsQ0FBMkJELFNBQTNCLEVBQWdFO0FBQ25FLFNBQU9BLFNBQVMsQ0FDWGpILE1BREUsQ0FDS21FLENBQUMsSUFBSUEsQ0FBQyxDQUFDdkUsSUFBRixLQUFXLFlBRHJCLEVBRUY2QixHQUZFLENBRUczQixLQUFELElBQTJCO0FBQzVCLFVBQU1xSCxjQUFjLEdBQUdELGlCQUFpQixDQUFDcEgsS0FBSyxDQUFDbUgsU0FBUCxDQUF4QztBQUNBLFdBQVEsR0FBRW5ILEtBQUssQ0FBQ0YsSUFBSyxHQUFFdUgsY0FBYyxLQUFLLEVBQW5CLEdBQXlCLE1BQUtBLGNBQWUsSUFBN0MsR0FBbUQsRUFBRyxFQUE3RTtBQUNILEdBTEUsRUFLQTVGLElBTEEsQ0FLSyxHQUxMLENBQVA7QUFNSDs7QUFFTSxTQUFTNkYsWUFBVCxDQUFzQkMsR0FBdEIsRUFBZ0NKLFNBQWhDLEVBQWtFO0FBQ3JFLE1BQUlBLFNBQVMsQ0FBQ3BJLE1BQVYsS0FBcUIsQ0FBekIsRUFBNEI7QUFDeEIsV0FBT3dJLEdBQVA7QUFDSDs7QUFDRCxNQUFJQyxLQUFLLENBQUNDLE9BQU4sQ0FBY0YsR0FBZCxDQUFKLEVBQXdCO0FBQ3BCLFdBQU9BLEdBQUcsQ0FBQzVGLEdBQUosQ0FBUTBDLENBQUMsSUFBSWlELFlBQVksQ0FBQ2pELENBQUQsRUFBSThDLFNBQUosQ0FBekIsQ0FBUDtBQUNIOztBQUNELFFBQU1PLFFBQWEsR0FBRyxFQUF0Qjs7QUFDQSxNQUFJSCxHQUFHLENBQUNJLElBQVIsRUFBYztBQUNWRCxJQUFBQSxRQUFRLENBQUNDLElBQVQsR0FBZ0JKLEdBQUcsQ0FBQ0ksSUFBcEI7QUFDQUQsSUFBQUEsUUFBUSxDQUFDRSxFQUFULEdBQWNMLEdBQUcsQ0FBQ0ksSUFBbEI7QUFDSDs7QUFDRCxPQUFLLE1BQU1ULElBQVgsSUFBbUJDLFNBQW5CLEVBQThCO0FBQzFCLFVBQU1VLGVBQWUsR0FBRztBQUNwQkMsTUFBQUEsVUFBVSxFQUFFLENBQUMsUUFBRCxDQURRO0FBRXBCQyxNQUFBQSxZQUFZLEVBQUUsQ0FBQyxTQUFELENBRk07QUFHcEJDLE1BQUFBLFVBQVUsRUFBRSxDQUFDLElBQUQsQ0FIUTtBQUlwQkMsTUFBQUEsZUFBZSxFQUFFLENBQUMsSUFBRCxFQUFPLFVBQVAsQ0FKRztBQUtwQkMsTUFBQUEsZUFBZSxFQUFFLENBQUMsSUFBRCxFQUFPLFVBQVA7QUFMRyxNQU10QmhCLElBQUksQ0FBQ3BILElBTmlCLENBQXhCOztBQU9BLFFBQUkrSCxlQUFlLEtBQUsvRixTQUF4QixFQUFtQztBQUMvQitGLE1BQUFBLGVBQWUsQ0FBQ3JILE9BQWhCLENBQXlCUixLQUFELElBQVc7QUFDL0IsWUFBSXVILEdBQUcsQ0FBQ3ZILEtBQUQsQ0FBSCxLQUFlOEIsU0FBbkIsRUFBOEI7QUFDMUI0RixVQUFBQSxRQUFRLENBQUMxSCxLQUFELENBQVIsR0FBa0J1SCxHQUFHLENBQUN2SCxLQUFELENBQXJCO0FBQ0g7QUFDSixPQUpEO0FBS0g7O0FBQ0QsVUFBTUgsS0FBSyxHQUFHMEgsR0FBRyxDQUFDTCxJQUFJLENBQUNwSCxJQUFOLENBQWpCOztBQUNBLFFBQUlELEtBQUssS0FBS2lDLFNBQWQsRUFBeUI7QUFDckI0RixNQUFBQSxRQUFRLENBQUNSLElBQUksQ0FBQ3BILElBQU4sQ0FBUixHQUFzQm9ILElBQUksQ0FBQ0MsU0FBTCxDQUFlcEksTUFBZixHQUF3QixDQUF4QixHQUNoQnVJLFlBQVksQ0FBQ3pILEtBQUQsRUFBUXFILElBQUksQ0FBQ0MsU0FBYixDQURJLEdBRWhCdEgsS0FGTjtBQUdIO0FBQ0o7O0FBQ0QsU0FBTzZILFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL2F1dGhcIjtcblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG5leHBvcnQgdHlwZSBRRmllbGRFeHBsYW5hdGlvbiA9IHtcbiAgICBvcGVyYXRpb25zOiBTZXQ8c3RyaW5nPixcbn1cblxuZnVuY3Rpb24gY29tYmluZVBhdGgoYmFzZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGNvbnN0IGIgPSBiYXNlLmVuZHNXaXRoKCcuJykgPyBiYXNlLnNsaWNlKDAsIC0xKSA6IGJhc2U7XG4gICAgY29uc3QgcCA9IHBhdGguc3RhcnRzV2l0aCgnLicpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gJy4nIDogJyc7XG4gICAgcmV0dXJuIGAke2J9JHtzZXB9JHtwfWA7XG59XG5cbmV4cG9ydCBjbGFzcyBRRXhwbGFuYXRpb24ge1xuICAgIHBhcmVudFBhdGg6IHN0cmluZztcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5wYXJlbnRQYXRoID0gJyc7XG4gICAgICAgIHRoaXMuZmllbGRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBwID0gcGF0aDtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aCgnQ1VSUkVOVCcpKSB7XG4gICAgICAgICAgICBwID0gY29tYmluZVBhdGgodGhpcy5wYXJlbnRQYXRoLCBwLnN1YnN0cignQ1VSUkVOVCcubGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3Rpbmc6IFFGaWVsZEV4cGxhbmF0aW9uIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHRoaXMuZmllbGRzLmdldChwKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5vcGVyYXRpb25zLmFkZChvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZpZWxkcy5zZXQocCwge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IG5ldyBTZXQoW29wXSksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBRUGFyYW1zT3B0aW9ucyA9IHtcbiAgICBleHBsYWluPzogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUVBhcmFtc09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuZXhwbGFuYXRpb24gPSAob3B0aW9ucyAmJiBvcHRpb25zLmV4cGxhaW4pXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIHFsOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gcWxGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gcWxGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgcWxGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHFsRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIHFsT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBwYXJhbXMuZXhwbGFpblNjYWxhck9wZXJhdGlvbihwYXRoLCBvcCk7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG4gICAgY29uc3QgaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPSAocGF0aCA9PT0gJ19rZXknIHx8IHBhdGguZW5kc1dpdGgoJy5fa2V5JykpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xuICAgIGNvbnN0IGZpeGVkVmFsdWUgPSBgQCR7cGFyYW1OYW1lfWA7XG4gICAgcmV0dXJuIGAke2ZpeGVkUGF0aH0gJHtvcH0gJHtmaXhlZFZhbHVlfWA7XG59XG5cbmZ1bmN0aW9uIHFsQ29tYmluZShjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gcWxJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IHFsT3AocGFyYW1zLCBwYXRoLCAnPT0nLCB2YWx1ZSkpO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ09SJywgJ2ZhbHNlJyk7XG59XG5cbi8vIFNjYWxhcnNcblxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCA/IHYgOiBudWxsO1xufVxuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPD0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7cWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcil9KWA7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfVxufTtcblxuY29uc3Qgc2NhbGFyT3BzID0ge1xuICAgIGVxOiBzY2FsYXJFcSxcbiAgICBuZTogc2NhbGFyTmUsXG4gICAgbHQ6IHNjYWxhckx0LFxuICAgIGxlOiBzY2FsYXJMZSxcbiAgICBndDogc2NhbGFyR3QsXG4gICAgZ2U6IHNjYWxhckdlLFxuICAgIGluOiBzY2FsYXJJbixcbiAgICBub3RJbjogc2NhbGFyTm90SW4sXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVTY2FsYXIoKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB1bmRlZmluZWRUb051bGwodmFsdWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5jb25zdCBCaWdOdW1iZXJGb3JtYXQgPSB7XG4gICAgSEVYOiAnSEVYJyxcbiAgICBERUM6ICdERUMnLFxufTtcblxuZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnksIGFyZ3M/OiB7IGZvcm1hdD86ICdIRVgnIHwgJ0RFQycgfSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJylcbiAgICAgICAgPyBgMHgke3ZhbHVlLnRvU3RyaW5nKDE2KX1gXG4gICAgICAgIDogYDB4JHt2YWx1ZS50b1N0cmluZygpLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIChmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gQmlnSW50KHZhbHVlKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gKGhleC5sZW5ndGggLSAxKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgcmV0dXJuIGAke3ByZWZpeH0ke2hleH1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5jb25zdCBiaWdVSW50MjogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDIpO1xuXG4vLyBTdHJ1Y3RzXG5cbmZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnFsKHBhcmFtcywgY29tYmluZVBhdGgocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gZ2V0SXRlbVFMKGl0ZW1UeXBlOiBRVHlwZSwgcGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBsZXQgaXRlbVFsOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICBleHBsYW5hdGlvbi5wYXJlbnRQYXRoID0gc2F2ZVBhcmVudFBhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgfVxuICAgIHJldHVybiBpdGVtUWw7XG59XG5cbmZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1zLmNvdW50ICsgMX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGdldEl0ZW1RTChpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtUWwgPT09IGBDVVJSRU5UID09ICR7cGFyYW1OYW1lfWApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1UeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZUl0ZW1UeXBlKCkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8gSm9pbnNcblxuZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5mdW5jdGlvbiBqb2luQXJyYXkob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZXhwb3J0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgY29udmVydEJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkb2M7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGRvYykpIHtcbiAgICAgICAgcmV0dXJuIGRvYy5tYXAoeCA9PiBzZWxlY3RGaWVsZHMoeCwgc2VsZWN0aW9uKSk7XG4gICAgfVxuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHJlcXVpcmVkRm9ySm9pbiA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6IFsnaW5fbXNnJ10sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFsnb3V0X21zZyddLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogWydpZCddLFxuICAgICAgICAgICAgc3JjX3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgICAgICBkc3RfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAocmVxdWlyZWRGb3JKb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NbZmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbZmllbGRdID0gZG9jW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXG4gICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCB0eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBzbG93OiBib29sZWFuLFxuICAgIHRpbWVzOiBudW1iZXJbXSxcbn1cbiJdfQ==