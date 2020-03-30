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
class QExplanation {
  constructor() {
    this.fields = new Map();
  }

  explainScalarOperation(field, op) {
    const existing = this.fields.get(field);

    if (existing) {
      existing.operations.add(op);
    } else {
      this.fields.set(field, {
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

function combine(path, key) {
  return key !== '' ? `${path}.${key}` : path;
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

  const isKeyOrderedComparision = path.endsWith('._key') && op !== '==' && op !== '!=';
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
        return fieldType.ql(params, combine(path, fieldName), filterValue);
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


function array(resolveItemType) {
  let resolved = null;
  const ops = {
    all: {
      ql(params, path, filter) {
        const itemType = resolved || (resolved = resolveItemType());
        const itemQl = itemType.ql(params, 'CURRENT', filter);
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
        const itemQl = itemType.ql(params, 'CURRENT', filter);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJRRXhwbGFuYXRpb24iLCJjb25zdHJ1Y3RvciIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJmaWVsZCIsIm9wIiwiZXhpc3RpbmciLCJnZXQiLCJvcGVyYXRpb25zIiwiYWRkIiwic2V0IiwiU2V0IiwiUVBhcmFtcyIsIm9wdGlvbnMiLCJjb3VudCIsInZhbHVlcyIsImV4cGxhbmF0aW9uIiwiZXhwbGFpbiIsImNsZWFyIiwidmFsdWUiLCJuYW1lIiwidG9TdHJpbmciLCJxbEZpZWxkcyIsInBhdGgiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwicWxGaWVsZCIsImNvbmRpdGlvbnMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsImZpbHRlcktleSIsImZpbHRlclZhbHVlIiwiZmllbGRUeXBlIiwicHVzaCIsInFsQ29tYmluZSIsInRlc3RGaWVsZHMiLCJ0ZXN0RmllbGQiLCJmYWlsZWQiLCJmaW5kIiwiY29tYmluZSIsImtleSIsInFsT3AiLCJwYXJhbXMiLCJwYXJhbU5hbWUiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImVuZHNXaXRoIiwiZml4ZWRQYXRoIiwiZml4ZWRWYWx1ZSIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJ1bmRlZmluZWRUb051bGwiLCJ2IiwidW5kZWZpbmVkIiwic2NhbGFyRXEiLCJxbCIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwiaW4iLCJub3RJbiIsImNyZWF0ZVNjYWxhciIsIkJpZ051bWJlckZvcm1hdCIsIkhFWCIsIkRFQyIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwiYXJncyIsImhleCIsInN1YnN0ciIsImZvcm1hdCIsIkJpZ0ludCIsImNvbnZlcnRCaWdVSW50IiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwiY3JlYXRlQmlnVUludCIsImNvbnZlcnRlZCIsIngiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3RydWN0IiwiaXNDb2xsZWN0aW9uIiwiZmllbGROYW1lIiwiYXJyYXkiLCJyZXNvbHZlSXRlbVR5cGUiLCJyZXNvbHZlZCIsIm9wcyIsImFsbCIsIml0ZW1UeXBlIiwiaXRlbVFsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJzdWNjZWVkZWRJbmRleCIsImNyZWF0ZUVudW1OYW1lc01hcCIsIm5hbWVzIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJFcnJvciIsIm9uX3BhdGgiLCJzcGxpdCIsInNsaWNlIiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsInJlc29sdmVSZWZUeXBlIiwicmVmVHlwZSIsImFsaWFzIiwicmVwbGFjZSIsInJlZlFsIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsInNlbGVjdGlvbnMiLCJpdGVtIiwic2VsZWN0aW9uIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWVsZFNlbGVjdGlvbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsIkFycmF5IiwiaXNBcnJheSIsInNlbGVjdGVkIiwiX2tleSIsImlkIiwicmVxdWlyZWRGb3JKb2luIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJzcmNfdHJhbnNhY3Rpb24iLCJkc3RfdHJhbnNhY3Rpb24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7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QU4sQ0FBakI7O0FBQ0EsUUFBSUQsS0FBSyxLQUFLcUMsU0FBZCxFQUF5QjtBQUNyQjRGLE1BQUFBLFFBQVEsQ0FBQ1IsSUFBSSxDQUFDeEgsSUFBTixDQUFSLEdBQXNCd0gsSUFBSSxDQUFDQyxTQUFMLENBQWUzRixNQUFmLEdBQXdCLENBQXhCLEdBQ2hCOEYsWUFBWSxDQUFDN0gsS0FBRCxFQUFReUgsSUFBSSxDQUFDQyxTQUFiLENBREksR0FFaEIxSCxLQUZOO0FBR0g7QUFDSjs7QUFDRCxTQUFPaUksUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmltcG9ydCB0eXBlIHsgQWNjZXNzUmlnaHRzIH0gZnJvbSBcIi4vYXV0aFwiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5leHBvcnQgY2xhc3MgUUV4cGxhbmF0aW9uIHtcbiAgICBmaWVsZHM6IE1hcDxzdHJpbmcsIFFGaWVsZEV4cGxhbmF0aW9uPjtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQoZmllbGQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLm9wZXJhdGlvbnMuYWRkKG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZmllbGRzLnNldChmaWVsZCwge1xuICAgICAgICAgICAgICAgIG9wZXJhdGlvbnM6IG5ldyBTZXQoW29wXSksXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBRUGFyYW1zT3B0aW9ucyA9IHtcbiAgICBleHBsYWluPzogYm9vbGVhbixcbn1cblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG4gICAgZXhwbGFuYXRpb246ID9RRXhwbGFuYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogUVBhcmFtc09wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICAgIHRoaXMuZXhwbGFuYXRpb24gPSAob3B0aW9ucyAmJiBvcHRpb25zLmV4cGxhaW4pXG4gICAgICAgICAgICA/IG5ldyBRRXhwbGFuYXRpb24oKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxuXG4gICAgZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLmV4cGxhbmF0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGxhbmF0aW9uLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24oZmllbGQsIG9wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIHFsOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gcWxGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gcWxGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgcWxGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHFsRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cblxuZnVuY3Rpb24gY29tYmluZShwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4ga2V5ICE9PSAnJyA/IGAke3BhdGh9LiR7a2V5fWAgOiBwYXRoO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcGFyYW1zLmV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aCwgb3ApO1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gcGF0aC5lbmRzV2l0aCgnLl9rZXknKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLyBTY2FsYXJzXG5cbmZ1bmN0aW9uIHVuZGVmaW5lZFRvTnVsbCh2OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogbnVsbDtcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH1cbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogJ0hFWCcsXG4gICAgREVDOiAnREVDJyxcbn07XG5cbmZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55LCBhcmdzPzogeyBmb3JtYXQ/OiAnSEVYJyB8ICdERUMnIH0pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpXG4gICAgICAgID8gYDB4JHt2YWx1ZS50b1N0cmluZygxNil9YFxuICAgICAgICA6IGAweCR7dmFsdWUudG9TdHJpbmcoKS5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xuICAgIGNvbnN0IGZvcm1hdCA9IChhcmdzICYmIGFyZ3MuZm9ybWF0KSB8fCBCaWdOdW1iZXJGb3JtYXQuSEVYO1xuICAgIHJldHVybiAoZm9ybWF0ID09PSBCaWdOdW1iZXJGb3JtYXQuSEVYKSA/IGhleCA6IEJpZ0ludChoZXgpLnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IGhleC5sZW5ndGgudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5jb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5jb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8gU3RydWN0c1xuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmUocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gYXJyYXkocmVzb2x2ZUl0ZW1UeXBlOiAoKSA9PiBRVHlwZSk6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbXMuY291bnQgKyAxfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1RbCA9PT0gYENVUlJFTlQgPT0gJHtwYXJhbU5hbWV9YCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLyBKb2luc1xuXG5mdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgPiAwYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVzb2x2ZVJlZlR5cGU6ICgpID0+IFFUeXBlKTogUVR5cGUge1xuICAgIGxldCByZXNvbHZlZDogP1FUeXBlID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZUeXBlID0gcmVzb2x2ZWQgfHwgKHJlc29sdmVkID0gcmVzb2x2ZVJlZlR5cGUoKSk7XG4gICAgICAgICAgICByZXR1cm4gcmVmVHlwZS50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBjb252ZXJ0QmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXlcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlXG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICByZXR1cm4gZG9jLm1hcCh4ID0+IHNlbGVjdEZpZWxkcyh4LCBzZWxlY3Rpb24pKTtcbiAgICB9XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgcmVxdWlyZWRGb3JKb2luID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogWydpbl9tc2cnXSxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogWydvdXRfbXNnJ10sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbJ2lkJ10sXG4gICAgICAgICAgICBzcmNfdHJhbnNhY3Rpb246IFsnaWQnLCAnbXNnX3R5cGUnXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogWydpZCcsICdtc2dfdHlwZSddLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChyZXF1aXJlZEZvckpvaW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWlyZWRGb3JKb2luLmZvckVhY2goKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvY1tmaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZFtmaWVsZF0gPSBkb2NbZmllbGRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbilcbiAgICAgICAgICAgICAgICA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IHR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbmV4cG9ydCB0eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICBvcGVyYXRpb25JZDogP3N0cmluZyxcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbiAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGVzdGltYXRlZENvc3Q6IG51bWJlcixcbiAgICBzbG93OiBib29sZWFuLFxuICAgIHRpbWVzOiBudW1iZXJbXSxcbn1cbiJdfQ==