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
  const len = hex.length.toString(16);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJxbEZpZWxkcyIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwicWxDb21iaW5lIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJxbE9wIiwicGFyYW1zIiwicGFyYW1OYW1lIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJqb2luIiwicWxJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsInFsIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJpbiIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJhcmdzIiwiaGV4IiwiZm9ybWF0IiwiQmlnSW50IiwiY29udmVydEJpZ1VJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzdHJ1Y3QiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJnZXRJdGVtUUwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsInNhdmVQYXJlbnRQYXRoIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwiRXJyb3IiLCJvbl9wYXRoIiwic3BsaXQiLCJjb25jYXQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwicmVmRmllbGQiLCJyZWZDb2xsZWN0aW9uIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiLCJwYXJzZVNlbGVjdGlvblNldCIsInNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwic2VsZWN0aW9ucyIsIml0ZW0iLCJzZWxlY3Rpb24iLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpZWxkU2VsZWN0aW9uIiwic2VsZWN0RmllbGRzIiwiZG9jIiwiQXJyYXkiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwi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eEIsRUFBbUM7QUFDL0IrRixNQUFBQSxlQUFlLENBQUNySCxPQUFoQixDQUF5QlIsS0FBRCxJQUFXO0FBQy9CLFlBQUl1SCxHQUFHLENBQUN2SCxLQUFELENBQUgsS0FBZThCLFNBQW5CLEVBQThCO0FBQzFCNEYsVUFBQUEsUUFBUSxDQUFDMUgsS0FBRCxDQUFSLEdBQWtCdUgsR0FBRyxDQUFDdkgsS0FBRCxDQUFyQjtBQUNIO0FBQ0osT0FKRDtBQUtIOztBQUNELFVBQU1ILEtBQUssR0FBRzBILEdBQUcsQ0FBQ0wsSUFBSSxDQUFDcEgsSUFBTixDQUFqQjs7QUFDQSxRQUFJRCxLQUFLLEtBQUtpQyxTQUFkLEVBQXlCO0FBQ3JCNEYsTUFBQUEsUUFBUSxDQUFDUixJQUFJLENBQUNwSCxJQUFOLENBQVIsR0FBc0JvSCxJQUFJLENBQUNDLFNBQUwsQ0FBZXBJLE1BQWYsR0FBd0IsQ0FBeEIsR0FDaEJ1SSxZQUFZLENBQUN6SCxLQUFELEVBQVFxSCxJQUFJLENBQUNDLFNBQWIsQ0FESSxHQUVoQnRILEtBRk47QUFHSDtBQUNKOztBQUNELFNBQU82SCxRQUFQO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuaW1wb3J0IHR5cGUgeyBBY2Nlc3NSaWdodHMgfSBmcm9tIFwiLi9hdXRoXCI7XG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuZXhwb3J0IHR5cGUgUUZpZWxkRXhwbGFuYXRpb24gPSB7XG4gICAgb3BlcmF0aW9uczogU2V0PHN0cmluZz4sXG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVQYXRoKGJhc2U6IHN0cmluZywgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBiID0gYmFzZS5lbmRzV2l0aCgnLicpID8gYmFzZS5zbGljZSgwLCAtMSkgOiBiYXNlO1xuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoJy4nKSA/IHBhdGguc2xpY2UoMSkgOiBwYXRoO1xuICAgIGNvbnN0IHNlcCA9IHAgJiYgYiA/ICcuJyA6ICcnO1xuICAgIHJldHVybiBgJHtifSR7c2VwfSR7cH1gO1xufVxuXG5leHBvcnQgY2xhc3MgUUV4cGxhbmF0aW9uIHtcbiAgICBwYXJlbnRQYXRoOiBzdHJpbmc7XG4gICAgZmllbGRzOiBNYXA8c3RyaW5nLCBRRmllbGRFeHBsYW5hdGlvbj47XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9ICcnO1xuICAgICAgICB0aGlzLmZpZWxkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGg6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBsZXQgcCA9IHBhdGg7XG4gICAgICAgIGlmIChwLnN0YXJ0c1dpdGgoJ0NVUlJFTlQnKSkge1xuICAgICAgICAgICAgcCA9IGNvbWJpbmVQYXRoKHRoaXMucGFyZW50UGF0aCwgcC5zdWJzdHIoJ0NVUlJFTlQnLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgUVBhcmFtc09wdGlvbnMgPSB7XG4gICAgZXhwbGFpbj86IGJvb2xlYW4sXG59XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuICAgIGV4cGxhbmF0aW9uOiA/UUV4cGxhbmF0aW9uO1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucz86IFFQYXJhbXNPcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cGxhbmF0aW9uID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5leHBsYWluKVxuICAgICAgICAgICAgPyBuZXcgUUV4cGxhbmF0aW9uKClcbiAgICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQ6IHN0cmluZywgb3A6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5leHBsYW5hdGlvbikge1xuICAgICAgICAgICAgdGhpcy5leHBsYW5hdGlvbi5leHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkLCBvcCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBxbDogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHFsRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHFsRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHFsRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmdcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChxbEZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gKHBhdGggPT09ICdfa2V5JyB8fCBwYXRoLmVuZHNXaXRoKCcuX2tleScpKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLyBTY2FsYXJzXG5cbmZ1bmN0aW9uIHVuZGVmaW5lZFRvTnVsbCh2OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogbnVsbDtcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH1cbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogJ0hFWCcsXG4gICAgREVDOiAnREVDJyxcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpXG4gICAgICAgID8gYDB4JHt2YWx1ZS50b1N0cmluZygxNil9YFxuICAgICAgICA6IGAweCR7dmFsdWUudG9TdHJpbmcoKS5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xuICAgIHJldHVybiAoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IGhleC5sZW5ndGgudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5jb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5jb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8gU3RydWN0c1xuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIGZpZWxkcywgKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1RTChpdGVtVHlwZTogUVR5cGUsIHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgbGV0IGl0ZW1RbDogc3RyaW5nO1xuICAgIGNvbnN0IGV4cGxhbmF0aW9uID0gcGFyYW1zLmV4cGxhbmF0aW9uO1xuICAgIGlmIChleHBsYW5hdGlvbikge1xuICAgICAgICBjb25zdCBzYXZlUGFyZW50UGF0aCA9IGV4cGxhbmF0aW9uLnBhcmVudFBhdGg7XG4gICAgICAgIGV4cGxhbmF0aW9uLnBhcmVudFBhdGggPSBgJHtleHBsYW5hdGlvbi5wYXJlbnRQYXRofSR7cGF0aH1bKl1gO1xuICAgICAgICBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IHNhdmVQYXJlbnRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgIH1cbiAgICByZXR1cm4gaXRlbVFsO1xufVxuXG5mdW5jdGlvbiBhcnJheShyZXNvbHZlSXRlbVR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtUWwgPSBnZXRJdGVtUUwoaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+ICFpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFueToge1xuICAgICAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtcy5jb3VudCArIDF9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtUWwgPSBnZXRJdGVtUUwoaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVFsID09PSBgQ1VSUkVOVCA9PSAke3BhcmFtTmFtZX1gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMob25fcGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vIEpvaW5zXG5cbmZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZGaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlZlR5cGUudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gam9pbkFycmF5KG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmV4cG9ydCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIGNvbnZlcnRCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheVxufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0aW9uVG9TdHJpbmcoc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogc3RyaW5nIHtcbiAgICByZXR1cm4gc2VsZWN0aW9uXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lm5hbWUgIT09ICdfX3R5cGVuYW1lJylcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSAnJyA/IGAgeyAke2ZpZWxkU2VsZWN0aW9ufSB9YCA6ICcnfWA7XG4gICAgICAgIH0pLmpvaW4oJyAnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbJ2luX21zZyddLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiBbJ291dF9tc2cnXSxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6IFsnaWQnXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICAgICAgZHN0X3RyYW5zYWN0aW9uOiBbJ2lkJywgJ21zZ190eXBlJ10sXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHJlcXVpcmVkRm9ySm9pbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXF1aXJlZEZvckpvaW4uZm9yRWFjaCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jW2ZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkW2ZpZWxkXSA9IGRvY1tmaWVsZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKVxuICAgICAgICAgICAgICAgIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgdHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IHR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIG9wZXJhdGlvbklkOiA/c3RyaW5nLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxuICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG4iXX0=