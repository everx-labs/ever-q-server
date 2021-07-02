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
exports.mergeFieldWithSelectionSet = mergeFieldWithSelectionSet;
exports.parseSelectionSet = parseSelectionSet;
exports.selectionToString = selectionToString;
exports.selectFields = selectFields;
exports.indexToString = indexToString;
exports.parseIndex = parseIndex;
exports.orderByToString = orderByToString;
exports.parseOrderBy = parseOrderBy;
exports.createScalarFields = createScalarFields;
exports.bigUInt2 = exports.bigUInt1 = exports.stringLowerFilter = exports.scalar = exports.QParams = exports.QExplanation = void 0;

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
const NOT_IMPLEMENTED = new Error("Not Implemented");

function combinePath(base, path) {
  const b = base.endsWith(".") ? base.slice(0, -1) : base;
  const p = path.startsWith(".") ? path.slice(1) : path;
  const sep = p && b ? "." : "";
  return `${b}${sep}${p}`;
}

class QExplanation {
  constructor() {
    this.parentPath = "";
    this.fields = new Map();
  }

  explainScalarOperation(path, op) {
    let p = path;

    if (p.startsWith("CURRENT")) {
      p = combinePath(this.parentPath, p.substr("CURRENT".length));
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
  return combineFilterConditions(conditions, "AND", "false");
}

function collectReturnExpressions(expressions, path, fields, fieldTypes) {
  fields.forEach(fieldDef => {
    const name = fieldDef.name && fieldDef.name.value || "";

    if (name === "") {
      throw new Error(`Invalid selection field: ${fieldDef.kind}`);
    }

    if (name === "__typename") {
      return;
    }

    const fieldType = fieldTypes[name];

    if (!fieldType) {
      throw new Error(`Invalid selection field: ${name}`);
    }

    for (const returned of fieldType.returnExpressions(path, fieldDef)) {
      expressions.set(returned.name, returned.expression);
    }
  });
}

function combineReturnExpressions(expressions) {
  const fields = [];

  for (const [key, value] of expressions) {
    fields.push(`${key}: ${value}`);
  }

  return `{ ${fields.join(", ")} }`;
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

function filterConditionOp(params, path, op, filter, explainOp) {
  params.explainScalarOperation(path, explainOp || op);
  const paramName = params.add(filter);
  /*
   * Following TO_STRING cast required due to specific comparision of _key fields in Arango
   * For example this query:
   * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
   * Will return:
   * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
   */

  const isKeyOrderedComparison = (path === "_key" || path.endsWith("._key")) && op !== "==" && op !== "!=";
  const fixedPath = isKeyOrderedComparison ? `TO_STRING(${path})` : path;
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

  return "(" + conditions.join(`) ${op} (`) + ")";
}

function filterConditionForIn(params, path, filter, explainOp) {
  const conditions = filter.map(value => filterConditionOp(params, path, "==", value, explainOp));
  return combineFilterConditions(conditions, "OR", "false");
} //------------------------------------------------------------- Scalars


function undefinedToNull(v) {
  return v !== undefined ? v : null;
}

const scalarEq = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, "==", filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value === filter;
  }

};
const scalarNe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, "!=", filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value !== filter;
  }

};
const scalarLt = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, "<", filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value < filter;
  }

};
const scalarLe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, "<=", filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value <= filter;
  }

};
const scalarGt = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, ">", filter);
  },

  returnExpressions(_path, _def) {
    throw NOT_IMPLEMENTED;
  },

  test(parent, value, filter) {
    return value > filter;
  }

};
const scalarGe = {
  filterCondition(params, path, filter) {
    return filterConditionOp(params, path, ">=", filter);
  },

  returnExpressions(_path, _def) {
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

  returnExpressions(_path, _def) {
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

  returnExpressions(_path, _def) {
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

function convertFilterValue(value, op, converter) {
  if (converter) {
    const conv = converter;
    return op === scalarOps.in || op === scalarOps.notIn ? value.map(x => conv(x)) : conv(value);
  }

  return value;
}

function createScalar(filterValueConverter) {
  return {
    filterCondition(params, path, filter) {
      return filterConditionForFields(path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const converted = convertFilterValue(filterValue, op, filterValueConverter);
        return op.filterCondition(params, path, converted);
      });
    },

    returnExpressions(path, def) {
      const isCollection = path === "doc";
      let name = def.name.value;

      if (isCollection && name === "id") {
        name = "_key";
      }

      return [{
        name,
        expression: `${path}.${name}`
      }];
    },

    test(parent, value, filter) {
      return testFields(value, filter, scalarOps, (op, value, filterKey, filterValue) => {
        const converted = convertFilterValue(filterValue, op, filterValueConverter);
        return op.test(parent, undefinedToNull(value), converted);
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
      return "0" + number;
    }

    return number;
  }

  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()) + " " + pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds()) + "." + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
}

function unixSecondsToString(value) {
  if (value === null || value === undefined) {
    return value;
  }

  return unixMillisecondsToString(value * 1000);
}

const BigNumberFormat = {
  HEX: "HEX",
  DEC: "DEC"
};

function invertedHex(hex) {
  return Array.from(hex).map(c => (Number.parseInt(c, 16) ^ 0xf).toString(16)).join("");
}

function resolveBigUInt(prefixLength, value, args) {
  if (value === null || value === undefined) {
    return value;
  }

  let neg;
  let hex;

  if (typeof value === "number") {
    neg = value < 0;
    hex = `0x${(neg ? -value : value).toString(16)}`;
  } else {
    const s = value.toString().trim();
    neg = s.startsWith("-");
    hex = `0x${neg ? invertedHex(s.substr(prefixLength + 1)) : s.substr(prefixLength)}`;
  }

  const format = args && args.format || BigNumberFormat.HEX;
  return `${neg ? "-" : ""}${format === BigNumberFormat.HEX ? hex : BigInt(hex).toString()}`;
}

function convertBigUInt(prefixLength, value) {
  if (value === null || value === undefined) {
    return value;
  }

  let big;

  if (typeof value === "string") {
    const s = value.trim();
    big = s.startsWith("-") ? -BigInt(s.substr(1)) : BigInt(s);
  } else {
    big = BigInt(value);
  }

  const neg = big < BigInt(0);
  const hex = (neg ? -big : big).toString(16);
  const len = (hex.length - 1).toString(16);
  const missingZeros = prefixLength - len.length;
  const prefix = missingZeros > 0 ? `${"0".repeat(missingZeros)}${len}` : len;
  const result = `${prefix}${hex}`;
  return neg ? `-${invertedHex(result)}` : result;
}

const scalar = createScalar();
exports.scalar = scalar;
const stringLowerFilter = createScalar(x => x ? x.toString().toLowerCase() : x);
exports.stringLowerFilter = stringLowerFilter;
const bigUInt1 = createScalar(x => convertBigUInt(1, x));
exports.bigUInt1 = bigUInt1;
const bigUInt2 = createScalar(x => convertBigUInt(2, x)); //------------------------------------------------------------- Structs

exports.bigUInt2 = bigUInt2;

function splitOr(filter) {
  const operands = [];
  let operand = filter;

  while (operand) {
    if ("OR" in operand) {
      const withoutOr = Object.assign({}, operand);
      delete withoutOr["OR"];
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
          const fieldName = isCollection && filterKey === "id" ? "_key" : filterKey;
          return fieldType.filterCondition(params, combinePath(path, fieldName), filterValue);
        });
      });
      return orOperands.length > 1 ? `(${orOperands.join(") OR (")})` : orOperands[0];
    },

    returnExpressions(path, def) {
      const name = def.name.value;
      const expressions = new Map();
      collectReturnExpressions(expressions, `${path}.${name}`, def.selectionSet && def.selectionSet.selections || [], fields);
      return [{
        name,
        expression: `( ${path}.${name} && ${combineReturnExpressions(expressions)} )`
      }];
    },

    test(parent, value, filter) {
      if (!value) {
        return false;
      }

      const orOperands = splitOr(filter);

      for (let i = 0; i < orOperands.length; i += 1) {
        if (testFields(value, orOperands[i], fields, (fieldType, value, filterKey, filterValue) => {
          const fieldName = isCollection && filterKey === "id" ? "_key" : filterKey;
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
    itemFilterCondition = itemType.filterCondition(params, "CURRENT", filter);
    explanation.parentPath = saveParentPath;
  } else {
    itemFilterCondition = itemType.filterCondition(params, "CURRENT", filter);
  }

  return itemFilterCondition;
}

function isValidFieldPathChar(c) {
  if (c.length !== 1) {
    return false;
  }

  return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c >= "0" && c <= "9" || c === "_" || c === "[" || c === "*" || c === "]" || c === ".";
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

    if (filterCondition.startsWith("CURRENT.") && filterCondition.endsWith(suffix)) {
      const fieldPath = filterCondition.slice("CURRENT.".length, -suffix.length);

      if (isFieldPath(fieldPath)) {
        return `${paramName} IN ${path}[*].${fieldPath}`;
      }
    }

    return null;
  }

  if (!itemFilterCondition.startsWith("(") || !itemFilterCondition.endsWith(")")) {
    return tryOptimize(itemFilterCondition, params.count - 1);
  }

  const filterConditionParts = itemFilterCondition.slice(1, -1).split(") OR (");

  if (filterConditionParts.length === 1) {
    return tryOptimize(itemFilterCondition, params.count - 1);
  }

  const optimizedParts = filterConditionParts.map((x, i) => tryOptimize(x, params.count - filterConditionParts.length + i)).filter(x => x !== null);

  if (optimizedParts.length !== filterConditionParts.length) {
    return null;
  }

  return `(${optimizedParts.join(") OR (")})`;
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

      returnExpressions(_path, _def) {
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

      returnExpressions(_path, _def) {
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

    returnExpressions(path, def) {
      const name = def.name.value;
      const itemSelections = def.selectionSet && def.selectionSet.selections;
      let expression;

      if (itemSelections && itemSelections.length > 0) {
        const itemType = resolved || (resolved = resolveItemType());
        const fieldPath = `${path}.${name}`;
        const alias = fieldPath.split(".").join("__");
        const expressions = new Map();
        collectReturnExpressions(expressions, alias, itemSelections, itemType.fields || {});
        const itemExpression = combineReturnExpressions(expressions);
        expression = `( ${fieldPath} && ( FOR ${alias} IN ${fieldPath} || [] RETURN ${itemExpression} ) )`;
      } else {
        expression = `${path}.${name}`;
      }

      return [{
        name,
        expression
      }];
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
      const on_path = path.split(".").slice(0, -1).concat(onField).join(".");
      return filterConditionForFields(on_path, filter, scalarOps, (op, path, filterKey, filterValue) => {
        const resolved = op === scalarOps.in || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.filterCondition(params, path, resolved);
      });
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
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
      return "false";
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
    },

    test(_parent, _value, _filter) {
      return false;
    }

  };
} //------------------------------------------------------------- Joins


function join(onField, refField, refCollection, extraFields, resolveRefType) {
  let resolved = null;
  const name = onField === "id" ? "_key" : onField;
  return {
    filterCondition(params, path, filter) {
      const refType = resolved || (resolved = resolveRefType());
      const on_path = path.split(".").slice(0, -1).concat(onField).join(".");
      const alias = `${on_path.replace(".", "_")}`;
      const refFilterCondition = refType.filterCondition(params, alias, filter);
      return `
                LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key == ${on_path}) AND (${refFilterCondition})
                    LIMIT 1
                    RETURN 1
                ) > 0`;
    },

    returnExpressions(path, _def) {
      return [{
        name,
        expression: `${path}.${name}`
      }, ...extraFields.map(x => ({
        name: x,
        expression: `${path}.${x}`
      }))];
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
      const on_path = path.split(".").slice(0, -1).concat(onField).join(".");
      const alias = `${on_path.replace(".", "_")}`;
      const refFilterCondition = refType.filterCondition(params, alias, refFilter);
      return `
                (LENGTH(${on_path}) > 0)
                AND (LENGTH(
                    FOR ${alias} IN ${refCollection}
                    FILTER (${alias}._key IN ${on_path}) AND (${refFilterCondition})
                    ${!all ? "LIMIT 1" : ""}
                    RETURN 1
                ) ${all ? `== LENGTH(${on_path})` : "> 0"})`;
    },

    returnExpressions(path, _def) {
      return [{
        name: onField,
        expression: `${path}.${onField}`
      }];
    },

    test(parent, value, filter) {
      const refType = resolved || (resolved = resolveRefType());
      return refType.test(parent, value, filter);
    }

  };
}

const ss = {
  "kind": "Field",
  "name": {
    "kind": "Name",
    "value": "account_blocks",
    "loc": {
      "start": 74,
      "end": 88
    }
  },
  "arguments": [],
  "directives": [],
  "selectionSet": {
    "kind": "SelectionSet",
    "selections": [{
      "kind": "Field",
      "name": {
        "kind": "Name",
        "value": "account_addr",
        "loc": {
          "start": 97,
          "end": 109
        }
      },
      "arguments": [],
      "directives": [],
      "loc": {
        "start": 97,
        "end": 109
      }
    }],
    "loc": {
      "start": 89,
      "end": 115
    }
  },
  "loc": {
    "start": 74,
    "end": 115
  }
};

function isFieldWithName(def, name) {
  return def.kind === "Field" && def.name.value.toLowerCase() === name.toLowerCase();
}

function mergeFieldWithSelectionSet(fieldPath, selectionSet) {
  const dotPos = fieldPath.indexOf(".");
  const name = dotPos >= 0 ? fieldPath.substr(0, dotPos) : fieldPath;
  const tail = dotPos >= 0 ? fieldPath.substr(dotPos + 1) : "";
  let field = selectionSet.selections.find(x => isFieldWithName(x, name));

  if (!field) {
    field = {
      kind: "Field",
      alias: undefined,
      name: {
        kind: "Name",
        value: name
      },
      arguments: [],
      directives: [],
      selectionSet: undefined
    };
    selectionSet.selections.push(field);
  }

  if (tail !== "") {
    if (!field.selectionSet) {
      field.selectionSet = {
        kind: "SelectionSet",
        selections: []
      };
    }

    mergeFieldWithSelectionSet(tail, selectionSet);
  }
}

function parseSelectionSet(selectionSet, returnFieldSelection) {
  const fields = [];
  const selections = selectionSet && selectionSet.selections;

  if (selections) {
    for (const item of selections) {
      const name = item.name && item.name.value || "";

      if (name) {
        const field = {
          name,
          selection: parseSelectionSet(item.selectionSet, "")
        };

        if (returnFieldSelection !== "" && field.name === returnFieldSelection) {
          return field.selection;
        }

        fields.push(field);
      }
    }
  }

  return fields;
}

function selectionToString(selection) {
  return selection.filter(x => x.name !== "__typename").map(field => {
    const fieldSelection = selectionToString(field.selection);
    return `${field.name}${fieldSelection !== "" ? ` { ${fieldSelection} }` : ""}`;
  }).join(" ");
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
      in_message: ["in_msg"],
      out_messages: ["out_msg"],
      signatures: ["id"],
      src_transaction: ["id", "msg_type"],
      dst_transaction: ["id", "msg_type"]
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
  return index.fields.join(", ");
}

function parseIndex(s) {
  return {
    fields: s.split(",").map(x => x.trim()).filter(x => x)
  };
}

function orderByToString(orderBy) {
  return orderBy.map(x => `${x.path}${(x.direction || "") === "DESC" ? " DESC" : ""}`).join(", ");
}

function parseOrderBy(s) {
  return s.split(",").map(x => x.trim()).filter(x => x).map(s => {
    const parts = s.split(" ").filter(x => x);
    return {
      path: parts[0],
      direction: (parts[1] || "").toLowerCase() === "desc" ? "DESC" : "ASC"
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

      const docName = type.collection && field.name === "id" ? "_key" : field.name;
      const path = `${parentPath}.${field.name}`;
      let docPath = `${parentDocPath}.${docName}`;

      if (field.arrayDepth > 0) {
        let suffix = "[*]";

        for (let depth = 10; depth > 0; depth -= 1) {
          const s = `[${"*".repeat(depth)}]`;

          if (docPath.includes(s)) {
            suffix = `[${"*".repeat(depth + 1)}]`;
            break;
          }
        }

        docPath = `${docPath}${suffix}`;
      }

      switch (field.type.category) {
        case "scalar":
          let typeName;

          if (field.type === _dbSchemaTypes.scalarTypes.boolean) {
            typeName = "boolean";
          } else if (field.type === _dbSchemaTypes.scalarTypes.float) {
            typeName = "number";
          } else if (field.type === _dbSchemaTypes.scalarTypes.int) {
            typeName = "number";
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint64) {
            typeName = "uint64";
          } else if (field.type === _dbSchemaTypes.scalarTypes.uint1024) {
            typeName = "uint1024";
          } else {
            typeName = "string";
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
    addForDbType(type, "", "");
  });
  return scalarFields;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zZXJ2ZXIvZmlsdGVyL2ZpbHRlcnMuanMiXSwibmFtZXMiOlsiTk9UX0lNUExFTUVOVEVEIiwiRXJyb3IiLCJjb21iaW5lUGF0aCIsImJhc2UiLCJwYXRoIiwiYiIsImVuZHNXaXRoIiwic2xpY2UiLCJwIiwic3RhcnRzV2l0aCIsInNlcCIsIlFFeHBsYW5hdGlvbiIsImNvbnN0cnVjdG9yIiwicGFyZW50UGF0aCIsImZpZWxkcyIsIk1hcCIsImV4cGxhaW5TY2FsYXJPcGVyYXRpb24iLCJvcCIsInN1YnN0ciIsImxlbmd0aCIsImV4aXN0aW5nIiwiZ2V0Iiwib3BlcmF0aW9ucyIsImFkZCIsInNldCIsIlNldCIsIlFQYXJhbXMiLCJvcHRpb25zIiwiY291bnQiLCJ2YWx1ZXMiLCJleHBsYW5hdGlvbiIsImV4cGxhaW4iLCJjbGVhciIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwiZmllbGQiLCJmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMiLCJmaWx0ZXIiLCJmaWVsZFR5cGVzIiwiZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyIsImNvbGxlY3RSZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb25zIiwiZmllbGREZWYiLCJraW5kIiwicmV0dXJuZWQiLCJyZXR1cm5FeHByZXNzaW9ucyIsImV4cHJlc3Npb24iLCJjb21iaW5lUmV0dXJuRXhwcmVzc2lvbnMiLCJrZXkiLCJqb2luIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJmaWx0ZXJDb25kaXRpb25PcCIsInBhcmFtcyIsImV4cGxhaW5PcCIsInBhcmFtTmFtZSIsImlzS2V5T3JkZXJlZENvbXBhcmlzb24iLCJmaXhlZFBhdGgiLCJmaXhlZFZhbHVlIiwiZGVmYXVsdENvbmRpdGlvbnMiLCJmaWx0ZXJDb25kaXRpb25Gb3JJbiIsIm1hcCIsInVuZGVmaW5lZFRvTnVsbCIsInYiLCJ1bmRlZmluZWQiLCJzY2FsYXJFcSIsImZpbHRlckNvbmRpdGlvbiIsIl9wYXRoIiwiX2RlZiIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwiaW4iLCJub3RJbiIsImNvbnZlcnRGaWx0ZXJWYWx1ZSIsImNvbnZlcnRlciIsImNvbnYiLCJ4IiwiY3JlYXRlU2NhbGFyIiwiZmlsdGVyVmFsdWVDb252ZXJ0ZXIiLCJjb252ZXJ0ZWQiLCJkZWYiLCJpc0NvbGxlY3Rpb24iLCJ1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmciLCJkIiwiRGF0ZSIsInBhZCIsIm51bWJlciIsImdldFVUQ0Z1bGxZZWFyIiwiZ2V0VVRDTW9udGgiLCJnZXRVVENEYXRlIiwiZ2V0VVRDSG91cnMiLCJnZXRVVENNaW51dGVzIiwiZ2V0VVRDU2Vjb25kcyIsImdldFVUQ01pbGxpc2Vjb25kcyIsInRvRml4ZWQiLCJ1bml4U2Vjb25kc1RvU3RyaW5nIiwiQmlnTnVtYmVyRm9ybWF0IiwiSEVYIiwiREVDIiwiaW52ZXJ0ZWRIZXgiLCJoZXgiLCJBcnJheSIsImZyb20iLCJjIiwiTnVtYmVyIiwicGFyc2VJbnQiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsImFyZ3MiLCJuZWciLCJzIiwidHJpbSIsImZvcm1hdCIsIkJpZ0ludCIsImNvbnZlcnRCaWdVSW50IiwiYmlnIiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwicmVzdWx0Iiwic2NhbGFyIiwic3RyaW5nTG93ZXJGaWx0ZXIiLCJ0b0xvd2VyQ2FzZSIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzcGxpdE9yIiwib3BlcmFuZHMiLCJvcGVyYW5kIiwid2l0aG91dE9yIiwiYXNzaWduIiwiT1IiLCJzdHJ1Y3QiLCJvck9wZXJhbmRzIiwiZmllbGROYW1lIiwic2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9ucyIsImkiLCJnZXRJdGVtRmlsdGVyQ29uZGl0aW9uIiwiaXRlbVR5cGUiLCJpdGVtRmlsdGVyQ29uZGl0aW9uIiwic2F2ZVBhcmVudFBhdGgiLCJpc1ZhbGlkRmllbGRQYXRoQ2hhciIsImlzRmllbGRQYXRoIiwidHJ5T3B0aW1pemVBcnJheUFueSIsInRyeU9wdGltaXplIiwicGFyYW1JbmRleCIsInN1ZmZpeCIsImZpZWxkUGF0aCIsImZpbHRlckNvbmRpdGlvblBhcnRzIiwic3BsaXQiLCJvcHRpbWl6ZWRQYXJ0cyIsImFycmF5IiwicmVzb2x2ZUl0ZW1UeXBlIiwicmVzb2x2ZWQiLCJvcHMiLCJhbGwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsIm9wdGltaXplZEZpbHRlckNvbmRpdGlvbiIsInN1Y2NlZWRlZEluZGV4IiwiaXRlbVNlbGVjdGlvbnMiLCJhbGlhcyIsIml0ZW1FeHByZXNzaW9uIiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJvbl9wYXRoIiwiY29uY2F0IiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsInN0cmluZ0NvbXBhbmlvbiIsIl9wYXJhbXMiLCJfZmlsdGVyIiwiX3BhcmVudCIsIl92YWx1ZSIsInJlZkZpZWxkIiwicmVmQ29sbGVjdGlvbiIsImV4dHJhRmllbGRzIiwicmVzb2x2ZVJlZlR5cGUiLCJyZWZUeXBlIiwicmVwbGFjZSIsInJlZkZpbHRlckNvbmRpdGlvbiIsImpvaW5BcnJheSIsInJlZkZpbHRlciIsInNzIiwiaXNGaWVsZFdpdGhOYW1lIiwibWVyZ2VGaWVsZFdpdGhTZWxlY3Rpb25TZXQiLCJkb3RQb3MiLCJpbmRleE9mIiwidGFpbCIsImFyZ3VtZW50cyIsImRpcmVjdGl2ZXMiLCJwYXJzZVNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwiaXRlbSIsInNlbGVjdGlvbiIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmllbGRTZWxlY3Rpb24iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJpc0FycmF5Iiwic2VsZWN0ZWQiLCJfa2V5IiwiaWQiLCJyZXF1aXJlZEZvckpvaW4iLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInNyY190cmFuc2FjdGlvbiIsImRzdF90cmFuc2FjdGlvbiIsImluZGV4VG9TdHJpbmciLCJpbmRleCIsInBhcnNlSW5kZXgiLCJvcmRlckJ5VG9TdHJpbmciLCJvcmRlckJ5IiwiZGlyZWN0aW9uIiwicGFyc2VPcmRlckJ5IiwicGFydHMiLCJjcmVhdGVTY2FsYXJGaWVsZHMiLCJzY2hlbWEiLCJzY2FsYXJGaWVsZHMiLCJhZGRGb3JEYlR5cGUiLCJ0eXBlIiwicGFyZW50RG9jUGF0aCIsImVudW1EZWYiLCJkb2NOYW1lIiwiY29sbGVjdGlvbiIsImRvY1BhdGgiLCJhcnJheURlcHRoIiwiZGVwdGgiLCJjYXRlZ29yeSIsInR5cGVOYW1lIiwic2NhbGFyVHlwZXMiLCJib29sZWFuIiwiZmxvYXQiLCJpbnQiLCJ1aW50NjQiLCJ1aW50MTAyNCIsInR5cGVzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7O0FBckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVlBLE1BQU1BLGVBQWUsR0FBRyxJQUFJQyxLQUFKLENBQVUsaUJBQVYsQ0FBeEI7O0FBMkJBLFNBQVNDLFdBQVQsQ0FBcUJDLElBQXJCLEVBQW1DQyxJQUFuQyxFQUF5RDtBQUNyRCxRQUFNQyxDQUFDLEdBQUdGLElBQUksQ0FBQ0csUUFBTCxDQUFjLEdBQWQsSUFBcUJILElBQUksQ0FBQ0ksS0FBTCxDQUFX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KiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFJbmRleEluZm8gfSBmcm9tIFwiLi4vZGF0YS9kYXRhLXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBzY2FsYXJUeXBlcyB9IGZyb20gXCIuLi9zY2hlbWEvZGItc2NoZW1hLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IERiRmllbGQsIERiU2NoZW1hLCBEYlR5cGUgfSBmcm9tIFwiLi4vc2NoZW1hL2RiLXNjaGVtYS10eXBlc1wiO1xuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbmNvbnN0IE5PVF9JTVBMRU1FTlRFRCA9IG5ldyBFcnJvcihcIk5vdCBJbXBsZW1lbnRlZFwiKTtcblxuZXhwb3J0IHR5cGUgR05hbWUgPSB7XG4gICAga2luZDogXCJOYW1lXCIsXG4gICAgdmFsdWU6IHN0cmluZyxcbn07XG5cbmV4cG9ydCB0eXBlIEdGaWVsZCA9IHtcbiAgICBraW5kOiBcIkZpZWxkXCIsXG4gICAgYWxpYXM6IHR5cGVvZiB1bmRlZmluZWQgfCBzdHJpbmcsXG4gICAgbmFtZTogR05hbWUsXG4gICAgYXJndW1lbnRzOiBHRGVmaW5pdGlvbltdLFxuICAgIGRpcmVjdGl2ZXM6IEdEZWZpbml0aW9uW10sXG4gICAgc2VsZWN0aW9uU2V0OiB0eXBlb2YgdW5kZWZpbmVkIHwgR1NlbGVjdGlvblNldCxcbn07XG5cbmV4cG9ydCB0eXBlIEdEZWZpbml0aW9uID0gR0ZpZWxkO1xuXG5leHBvcnQgdHlwZSBHU2VsZWN0aW9uU2V0ID0ge1xuICAgIGtpbmQ6IFwiU2VsZWN0aW9uU2V0XCIsXG4gICAgc2VsZWN0aW9uczogR0RlZmluaXRpb25bXSxcbn07XG5cbmV4cG9ydCB0eXBlIFFGaWVsZEV4cGxhbmF0aW9uID0ge1xuICAgIG9wZXJhdGlvbnM6IFNldDxzdHJpbmc+LFxufVxuXG5mdW5jdGlvbiBjb21iaW5lUGF0aChiYXNlOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgYiA9IGJhc2UuZW5kc1dpdGgoXCIuXCIpID8gYmFzZS5zbGljZSgwLCAtMSkgOiBiYXNlO1xuICAgIGNvbnN0IHAgPSBwYXRoLnN0YXJ0c1dpdGgoXCIuXCIpID8gcGF0aC5zbGljZSgxKSA6IHBhdGg7XG4gICAgY29uc3Qgc2VwID0gcCAmJiBiID8gXCIuXCIgOiBcIlwiO1xuICAgIHJldHVybiBgJHtifSR7c2VwfSR7cH1gO1xufVxuXG5leHBvcnQgdHlwZSBTY2FsYXJGaWVsZCA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgdHlwZTogKFwibnVtYmVyXCIgfCBcInVpbnQ2NFwiIHwgXCJ1aW50MTAyNFwiIHwgXCJib29sZWFuXCIgfCBcInN0cmluZ1wiKSxcbn1cblxuZXhwb3J0IGNsYXNzIFFFeHBsYW5hdGlvbiB7XG4gICAgcGFyZW50UGF0aDogc3RyaW5nO1xuICAgIGZpZWxkczogTWFwPHN0cmluZywgUUZpZWxkRXhwbGFuYXRpb24+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucGFyZW50UGF0aCA9IFwiXCI7XG4gICAgICAgIHRoaXMuZmllbGRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGV4cGxhaW5TY2FsYXJPcGVyYXRpb24ocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nKSB7XG4gICAgICAgIGxldCBwID0gcGF0aDtcbiAgICAgICAgaWYgKHAuc3RhcnRzV2l0aChcIkNVUlJFTlRcIikpIHtcbiAgICAgICAgICAgIHAgPSBjb21iaW5lUGF0aCh0aGlzLnBhcmVudFBhdGgsIHAuc3Vic3RyKFwiQ1VSUkVOVFwiLmxlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nOiBRRmllbGRFeHBsYW5hdGlvbiB8IHR5cGVvZiB1bmRlZmluZWQgPSB0aGlzLmZpZWxkcy5nZXQocCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3Rpbmcub3BlcmF0aW9ucy5hZGQob3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5maWVsZHMuc2V0KHAsIHtcbiAgICAgICAgICAgICAgICBvcGVyYXRpb25zOiBuZXcgU2V0KFtvcF0pLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIFFQYXJhbXNPcHRpb25zID0ge1xuICAgIGV4cGxhaW4/OiBib29sZWFuLFxufVxuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcbiAgICBleHBsYW5hdGlvbjogP1FFeHBsYW5hdGlvbjtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnM/OiBRUGFyYW1zT3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHBsYW5hdGlvbiA9IChvcHRpb25zICYmIG9wdGlvbnMuZXhwbGFpbilcbiAgICAgICAgICAgID8gbmV3IFFFeHBsYW5hdGlvbigpXG4gICAgICAgICAgICA6IG51bGw7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG5cbiAgICBleHBsYWluU2NhbGFyT3BlcmF0aW9uKGZpZWxkOiBzdHJpbmcsIG9wOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuZXhwbGFuYXRpb24pIHtcbiAgICAgICAgICAgIHRoaXMuZXhwbGFuYXRpb24uZXhwbGFpblNjYWxhck9wZXJhdGlvbihmaWVsZCwgb3ApO1xuICAgICAgICB9XG4gICAgfVxufVxuXG50eXBlIFFSZXR1cm5FeHByZXNzaW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBleHByZXNzaW9uOiBzdHJpbmcsXG59O1xuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICBmaWVsZHM/OiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIGZpbHRlckNvbmRpdGlvbjogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIEFRTCBleHByZXNzaW9uIGZvciByZXR1cm4gc2VjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gICAgICogQHBhcmFtIHtHRGVmaW5pdGlvbn0gZGVmXG4gICAgICovXG4gICAgcmV0dXJuRXhwcmVzc2lvbnM6IChwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pID0+IFFSZXR1cm5FeHByZXNzaW9uW10sXG5cbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9yRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkOiAoXG4gICAgICAgIGZpZWxkOiBhbnksXG4gICAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgICAgZmlsdGVyS2V5OiBzdHJpbmcsXG4gICAgICAgIGZpbHRlclZhbHVlOiBhbnksXG4gICAgKSA9PiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2goZmlsdGVyQ29uZGl0aW9uRm9yRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZmlsdGVyIGZpZWxkOiAke2ZpbHRlcktleX1gKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjb21iaW5lRmlsdGVyQ29uZGl0aW9ucyhjb25kaXRpb25zLCBcIkFORFwiLCBcImZhbHNlXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgIGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+LFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWVsZHM6IEdEZWZpbml0aW9uW10sXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbikge1xuICAgIGZpZWxkcy5mb3JFYWNoKChmaWVsZERlZjogR0ZpZWxkKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBmaWVsZERlZi5uYW1lICYmIGZpZWxkRGVmLm5hbWUudmFsdWUgfHwgXCJcIjtcbiAgICAgICAgaWYgKG5hbWUgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7ZmllbGREZWYua2luZH1gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuYW1lID09PSBcIl9fdHlwZW5hbWVcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tuYW1lXTtcbiAgICAgICAgaWYgKCFmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZWxlY3Rpb24gZmllbGQ6ICR7bmFtZX1gKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHJldHVybmVkIG9mIGZpZWxkVHlwZS5yZXR1cm5FeHByZXNzaW9ucyhwYXRoLCBmaWVsZERlZikpIHtcbiAgICAgICAgICAgIGV4cHJlc3Npb25zLnNldChyZXR1cm5lZC5uYW1lLCByZXR1cm5lZC5leHByZXNzaW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zOiBNYXA8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgICBjb25zdCBmaWVsZHMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBleHByZXNzaW9ucykge1xuICAgICAgICBmaWVsZHMucHVzaChgJHtrZXl9OiAke3ZhbHVlfWApO1xuICAgIH1cbiAgICByZXR1cm4gYHsgJHtmaWVsZHMuam9pbihcIiwgXCIpfSB9YDtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuLFxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoIWZpZWxkVHlwZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpbHRlciBmaWVsZDogJHtmaWx0ZXJLZXl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmZ1bmN0aW9uIGZpbHRlckNvbmRpdGlvbk9wKFxuICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgb3A6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBleHBsYWluT3A/OiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIHBhcmFtcy5leHBsYWluU2NhbGFyT3BlcmF0aW9uKHBhdGgsIGV4cGxhaW5PcCB8fCBvcCk7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG5cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc29uID0gKHBhdGggPT09IFwiX2tleVwiIHx8IHBhdGguZW5kc1dpdGgoXCIuX2tleVwiKSkgJiYgb3AgIT09IFwiPT1cIiAmJiBvcCAhPT0gXCIhPVwiO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gY29tYmluZUZpbHRlckNvbmRpdGlvbnMoXG4gICAgY29uZGl0aW9uczogc3RyaW5nW10sXG4gICAgb3A6IHN0cmluZyxcbiAgICBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nLFxuKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiBcIihcIiArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyBcIilcIjtcbn1cblxuZnVuY3Rpb24gZmlsdGVyQ29uZGl0aW9uRm9ySW4oXG4gICAgcGFyYW1zOiBRUGFyYW1zLFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBleHBsYWluT3A/OiBzdHJpbmcsXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgXCI9PVwiLCB2YWx1ZSwgZXhwbGFpbk9wKSk7XG4gICAgcmV0dXJuIGNvbWJpbmVGaWx0ZXJDb25kaXRpb25zKGNvbmRpdGlvbnMsIFwiT1JcIiwgXCJmYWxzZVwiKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNjYWxhcnNcblxuZnVuY3Rpb24gdW5kZWZpbmVkVG9OdWxsKHY6IGFueSk6IGFueSB7XG4gICAgcmV0dXJuIHYgIT09IHVuZGVmaW5lZCA/IHYgOiBudWxsO1xufVxuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiPT1cIiwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiIT1cIiwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiPFwiLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25PcChwYXJhbXMsIHBhdGgsIFwiPD1cIiwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHJldHVybkV4cHJlc3Npb25zKF9wYXRoOiBzdHJpbmcsIF9kZWY6IEdEZWZpbml0aW9uKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgIHRocm93IE5PVF9JTVBMRU1FTlRFRDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgXCI+XCIsIGZpbHRlcik7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9ucyhfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbk9wKHBhcmFtcywgcGF0aCwgXCI+PVwiLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgdGhyb3cgTk9UX0lNUExFTUVOVEVEO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7ZmlsdGVyQ29uZGl0aW9uRm9ySW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIsIFwiIT1cIil9KWA7XG4gICAgfSxcbiAgICByZXR1cm5FeHByZXNzaW9ucyhfcGF0aDogc3RyaW5nLCBfZGVmOiBHRGVmaW5pdGlvbik6IFFSZXR1cm5FeHByZXNzaW9uW10ge1xuICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY29udmVydEZpbHRlclZhbHVlKHZhbHVlLCBvcCwgY29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKGNvbnZlcnRlcikge1xuICAgICAgICBjb25zdCBjb252ID0gY29udmVydGVyO1xuICAgICAgICByZXR1cm4gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgID8gdmFsdWUubWFwKHggPT4gY29udih4KSlcbiAgICAgICAgICAgIDogY29udih2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKGZpbHRlclZhbHVlQ29udmVydGVyPzogKHZhbHVlOiBhbnkpID0+IGFueSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgc2NhbGFyT3BzLFxuICAgICAgICAgICAgICAgIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0RmlsdGVyVmFsdWUoZmlsdGVyVmFsdWUsIG9wLCBmaWx0ZXJWYWx1ZUNvbnZlcnRlcik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgIGNvbnN0IGlzQ29sbGVjdGlvbiA9IHBhdGggPT09IFwiZG9jXCI7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IGRlZi5uYW1lLnZhbHVlO1xuICAgICAgICAgICAgaWYgKGlzQ29sbGVjdGlvbiAmJiBuYW1lID09PSBcImlkXCIpIHtcbiAgICAgICAgICAgICAgICBuYW1lID0gXCJfa2V5XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfV07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSBjb252ZXJ0RmlsdGVyVmFsdWUoZmlsdGVyVmFsdWUsIG9wLCBmaWx0ZXJWYWx1ZUNvbnZlcnRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB1bmRlZmluZWRUb051bGwodmFsdWUpLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVuaXhNaWxsaXNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGQgPSBuZXcgRGF0ZSh2YWx1ZSk7XG5cbiAgICBmdW5jdGlvbiBwYWQobnVtYmVyKSB7XG4gICAgICAgIGlmIChudW1iZXIgPCAxMCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiMFwiICsgbnVtYmVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudW1iZXI7XG4gICAgfVxuXG4gICAgcmV0dXJuIGQuZ2V0VVRDRnVsbFllYXIoKSArXG4gICAgICAgIFwiLVwiICsgcGFkKGQuZ2V0VVRDTW9udGgoKSArIDEpICtcbiAgICAgICAgXCItXCIgKyBwYWQoZC5nZXRVVENEYXRlKCkpICtcbiAgICAgICAgXCIgXCIgKyBwYWQoZC5nZXRVVENIb3VycygpKSArXG4gICAgICAgIFwiOlwiICsgcGFkKGQuZ2V0VVRDTWludXRlcygpKSArXG4gICAgICAgIFwiOlwiICsgcGFkKGQuZ2V0VVRDU2Vjb25kcygpKSArXG4gICAgICAgIFwiLlwiICsgKGQuZ2V0VVRDTWlsbGlzZWNvbmRzKCkgLyAxMDAwKS50b0ZpeGVkKDMpLnNsaWNlKDIsIDUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5peFNlY29uZHNUb1N0cmluZyh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiB1bml4TWlsbGlzZWNvbmRzVG9TdHJpbmcodmFsdWUgKiAxMDAwKTtcbn1cblxuY29uc3QgQmlnTnVtYmVyRm9ybWF0ID0ge1xuICAgIEhFWDogXCJIRVhcIixcbiAgICBERUM6IFwiREVDXCIsXG59O1xuXG5mdW5jdGlvbiBpbnZlcnRlZEhleChoZXg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20oaGV4KVxuICAgICAgICAubWFwKGMgPT4gKE51bWJlci5wYXJzZUludChjLCAxNikgXiAweGYpLnRvU3RyaW5nKDE2KSlcbiAgICAgICAgLmpvaW4oXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlQmlnVUludChcbiAgICBwcmVmaXhMZW5ndGg6IG51bWJlcixcbiAgICB2YWx1ZTogYW55LFxuICAgIGFyZ3M/OiB7IGZvcm1hdD86IFwiSEVYXCIgfCBcIkRFQ1wiIH0sXG4pOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IG5lZztcbiAgICBsZXQgaGV4O1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgbmVnID0gdmFsdWUgPCAwO1xuICAgICAgICBoZXggPSBgMHgkeyhuZWcgPyAtdmFsdWUgOiB2YWx1ZSkudG9TdHJpbmcoMTYpfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcyA9IHZhbHVlLnRvU3RyaW5nKCkudHJpbSgpO1xuICAgICAgICBuZWcgPSBzLnN0YXJ0c1dpdGgoXCItXCIpO1xuICAgICAgICBoZXggPSBgMHgke25lZyA/IGludmVydGVkSGV4KHMuc3Vic3RyKHByZWZpeExlbmd0aCArIDEpKSA6IHMuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbiAgICB9XG4gICAgY29uc3QgZm9ybWF0ID0gKGFyZ3MgJiYgYXJncy5mb3JtYXQpIHx8IEJpZ051bWJlckZvcm1hdC5IRVg7XG4gICAgcmV0dXJuIGAke25lZyA/IFwiLVwiIDogXCJcIn0keyhmb3JtYXQgPT09IEJpZ051bWJlckZvcm1hdC5IRVgpID8gaGV4IDogQmlnSW50KGhleCkudG9TdHJpbmcoKX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgbGV0IGJpZztcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGNvbnN0IHMgPSB2YWx1ZS50cmltKCk7XG4gICAgICAgIGJpZyA9IHMuc3RhcnRzV2l0aChcIi1cIikgPyAtQmlnSW50KHMuc3Vic3RyKDEpKSA6IEJpZ0ludChzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBiaWcgPSBCaWdJbnQodmFsdWUpO1xuICAgIH1cbiAgICBjb25zdCBuZWcgPSBiaWcgPCBCaWdJbnQoMCk7XG4gICAgY29uc3QgaGV4ID0gKG5lZyA/IC1iaWcgOiBiaWcpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSAoaGV4Lmxlbmd0aCAtIDEpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHtcIjBcIi5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIGNvbnN0IHJlc3VsdCA9IGAke3ByZWZpeH0ke2hleH1gO1xuICAgIHJldHVybiBuZWcgPyBgLSR7aW52ZXJ0ZWRIZXgocmVzdWx0KX1gIDogcmVzdWx0O1xufVxuXG5leHBvcnQgY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuZXhwb3J0IGNvbnN0IHN0cmluZ0xvd2VyRmlsdGVyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcih4ID0+IHggPyB4LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSA6IHgpO1xuZXhwb3J0IGNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcih4ID0+IGNvbnZlcnRCaWdVSW50KDEsIHgpKTtcbmV4cG9ydCBjb25zdCBiaWdVSW50MjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoeCA9PiBjb252ZXJ0QmlnVUludCgyLCB4KSk7XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTdHJ1Y3RzXG5cbmV4cG9ydCBmdW5jdGlvbiBzcGxpdE9yKGZpbHRlcjogYW55KTogYW55W10ge1xuICAgIGNvbnN0IG9wZXJhbmRzID0gW107XG4gICAgbGV0IG9wZXJhbmQgPSBmaWx0ZXI7XG4gICAgd2hpbGUgKG9wZXJhbmQpIHtcbiAgICAgICAgaWYgKFwiT1JcIiBpbiBvcGVyYW5kKSB7XG4gICAgICAgICAgICBjb25zdCB3aXRob3V0T3IgPSBPYmplY3QuYXNzaWduKHt9LCBvcGVyYW5kKTtcbiAgICAgICAgICAgIGRlbGV0ZSB3aXRob3V0T3JbXCJPUlwiXTtcbiAgICAgICAgICAgIG9wZXJhbmRzLnB1c2god2l0aG91dE9yKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBvcGVyYW5kLk9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3BlcmFuZHMucHVzaChvcGVyYW5kKTtcbiAgICAgICAgICAgIG9wZXJhbmQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvcGVyYW5kcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9yT3BlcmFuZHMgPSBzcGxpdE9yKGZpbHRlcikubWFwKChvcGVyYW5kKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbHRlckNvbmRpdGlvbkZvckZpZWxkcyhcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgb3BlcmFuZCxcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgICAgICAgICAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gXCJpZFwiKSA/IFwiX2tleVwiIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5maWx0ZXJDb25kaXRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVQYXRoKHBhdGgsIGZpZWxkTmFtZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyVmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAob3JPcGVyYW5kcy5sZW5ndGggPiAxKSA/IGAoJHtvck9wZXJhbmRzLmpvaW4oXCIpIE9SIChcIil9KWAgOiBvck9wZXJhbmRzWzBdO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGV4cHJlc3Npb25zID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgY29sbGVjdFJldHVybkV4cHJlc3Npb25zKFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb25zLFxuICAgICAgICAgICAgICAgIGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgICAgIChkZWYuc2VsZWN0aW9uU2V0ICYmIGRlZi5zZWxlY3Rpb25TZXQuc2VsZWN0aW9ucykgfHwgW10sXG4gICAgICAgICAgICAgICAgZmllbGRzLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCggJHtwYXRofS4ke25hbWV9ICYmICR7Y29tYmluZVJldHVybkV4cHJlc3Npb25zKGV4cHJlc3Npb25zKX0gKWAsXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBvck9wZXJhbmRzID0gc3BsaXRPcihmaWx0ZXIpO1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvck9wZXJhbmRzLmxlbmd0aDsgaSArPSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlc3RGaWVsZHMoXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBvck9wZXJhbmRzW2ldLFxuICAgICAgICAgICAgICAgICAgICBmaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gXCJpZFwiKSA/IFwiX2tleVwiIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oXG4gICAgaXRlbVR5cGU6IFFUeXBlLFxuICAgIHBhcmFtczogUVBhcmFtcyxcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4pOiBzdHJpbmcge1xuICAgIGxldCBpdGVtRmlsdGVyQ29uZGl0aW9uOiBzdHJpbmc7XG4gICAgY29uc3QgZXhwbGFuYXRpb24gPSBwYXJhbXMuZXhwbGFuYXRpb247XG4gICAgaWYgKGV4cGxhbmF0aW9uKSB7XG4gICAgICAgIGNvbnN0IHNhdmVQYXJlbnRQYXRoID0gZXhwbGFuYXRpb24ucGFyZW50UGF0aDtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IGAke2V4cGxhbmF0aW9uLnBhcmVudFBhdGh9JHtwYXRofVsqXWA7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBcIkNVUlJFTlRcIiwgZmlsdGVyKTtcbiAgICAgICAgZXhwbGFuYXRpb24ucGFyZW50UGF0aCA9IHNhdmVQYXJlbnRQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGl0ZW1GaWx0ZXJDb25kaXRpb24gPSBpdGVtVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBcIkNVUlJFTlRcIiwgZmlsdGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1GaWx0ZXJDb25kaXRpb247XG59XG5cbmZ1bmN0aW9uIGlzVmFsaWRGaWVsZFBhdGhDaGFyKGM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGlmIChjLmxlbmd0aCAhPT0gMSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoYyA+PSBcIkFcIiAmJiBjIDw9IFwiWlwiKVxuICAgICAgICB8fCAoYyA+PSBcImFcIiAmJiBjIDw9IFwielwiKVxuICAgICAgICB8fCAoYyA+PSBcIjBcIiAmJiBjIDw9IFwiOVwiKVxuICAgICAgICB8fCAoYyA9PT0gXCJfXCIgfHwgYyA9PT0gXCJbXCIgfHwgYyA9PT0gXCIqXCIgfHwgYyA9PT0gXCJdXCIgfHwgYyA9PT0gXCIuXCIpO1xufVxuXG5mdW5jdGlvbiBpc0ZpZWxkUGF0aCh0ZXN0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRlc3QubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgaWYgKCFpc1ZhbGlkRmllbGRQYXRoQ2hhcih0ZXN0W2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiB0cnlPcHRpbWl6ZUFycmF5QW55KHBhdGg6IHN0cmluZywgaXRlbUZpbHRlckNvbmRpdGlvbjogc3RyaW5nLCBwYXJhbXM6IFFQYXJhbXMpOiA/c3RyaW5nIHtcbiAgICBmdW5jdGlvbiB0cnlPcHRpbWl6ZShmaWx0ZXJDb25kaXRpb246IHN0cmluZywgcGFyYW1JbmRleDogbnVtYmVyKTogP3N0cmluZyB7XG4gICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1JbmRleCArIDF9YDtcbiAgICAgICAgY29uc3Qgc3VmZml4ID0gYCA9PSAke3BhcmFtTmFtZX1gO1xuICAgICAgICBpZiAoZmlsdGVyQ29uZGl0aW9uID09PSBgQ1VSUkVOVCR7c3VmZml4fWApIHtcbiAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xuICAgICAgICB9XG4gICAgICAgIGlmIChmaWx0ZXJDb25kaXRpb24uc3RhcnRzV2l0aChcIkNVUlJFTlQuXCIpICYmIGZpbHRlckNvbmRpdGlvbi5lbmRzV2l0aChzdWZmaXgpKSB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFBhdGggPSBmaWx0ZXJDb25kaXRpb24uc2xpY2UoXCJDVVJSRU5ULlwiLmxlbmd0aCwgLXN1ZmZpeC5sZW5ndGgpO1xuICAgICAgICAgICAgaWYgKGlzRmllbGRQYXRoKGZpZWxkUGF0aCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdLiR7ZmllbGRQYXRofWA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpdGVtRmlsdGVyQ29uZGl0aW9uLnN0YXJ0c1dpdGgoXCIoXCIpIHx8ICFpdGVtRmlsdGVyQ29uZGl0aW9uLmVuZHNXaXRoKFwiKVwiKSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IGZpbHRlckNvbmRpdGlvblBhcnRzID0gaXRlbUZpbHRlckNvbmRpdGlvbi5zbGljZSgxLCAtMSkuc3BsaXQoXCIpIE9SIChcIik7XG4gICAgaWYgKGZpbHRlckNvbmRpdGlvblBhcnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdHJ5T3B0aW1pemUoaXRlbUZpbHRlckNvbmRpdGlvbiwgcGFyYW1zLmNvdW50IC0gMSk7XG4gICAgfVxuICAgIGNvbnN0IG9wdGltaXplZFBhcnRzID0gZmlsdGVyQ29uZGl0aW9uUGFydHNcbiAgICAgICAgLm1hcCgoeCwgaSkgPT4gdHJ5T3B0aW1pemUoeCwgcGFyYW1zLmNvdW50IC0gZmlsdGVyQ29uZGl0aW9uUGFydHMubGVuZ3RoICsgaSkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4ICE9PSBudWxsKTtcbiAgICBpZiAob3B0aW1pemVkUGFydHMubGVuZ3RoICE9PSBmaWx0ZXJDb25kaXRpb25QYXJ0cy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBgKCR7b3B0aW1pemVkUGFydHMuam9pbihcIikgT1IgKFwiKX0pYDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KHJlc29sdmVJdGVtVHlwZTogKCkgPT4gUVR5cGUpOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRmlsdGVyQ29uZGl0aW9uID0gZ2V0SXRlbUZpbHRlckNvbmRpdGlvbihpdGVtVHlwZSwgcGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+ICFpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFueToge1xuICAgICAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUZpbHRlckNvbmRpdGlvbiA9IGdldEl0ZW1GaWx0ZXJDb25kaXRpb24oaXRlbVR5cGUsIHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb24gPSB0cnlPcHRpbWl6ZUFycmF5QW55KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBpdGVtRmlsdGVyQ29uZGl0aW9uLFxuICAgICAgICAgICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW1pemVkRmlsdGVyQ29uZGl0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcHRpbWl6ZWRGaWx0ZXJDb25kaXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtRmlsdGVyQ29uZGl0aW9ufV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMoX3BhdGg6IHN0cmluZywgX2RlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBOT1RfSU1QTEVNRU5URUQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVJdGVtVHlwZSgpKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgb3BzLFxuICAgICAgICAgICAgICAgIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3AuZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICByZXR1cm5FeHByZXNzaW9ucyhwYXRoOiBzdHJpbmcsIGRlZjogR0RlZmluaXRpb24pOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBkZWYubmFtZS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1TZWxlY3Rpb25zID0gZGVmLnNlbGVjdGlvblNldCAmJiBkZWYuc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgICAgICAgICBsZXQgZXhwcmVzc2lvbjtcbiAgICAgICAgICAgIGlmIChpdGVtU2VsZWN0aW9ucyAmJiBpdGVtU2VsZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlSXRlbVR5cGUoKSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGRQYXRoID0gYCR7cGF0aH0uJHtuYW1lfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBmaWVsZFBhdGguc3BsaXQoXCIuXCIpLmpvaW4oXCJfX1wiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBleHByZXNzaW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgICAgICBjb2xsZWN0UmV0dXJuRXhwcmVzc2lvbnMoZXhwcmVzc2lvbnMsIGFsaWFzLCBpdGVtU2VsZWN0aW9ucywgaXRlbVR5cGUuZmllbGRzIHx8IHt9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtRXhwcmVzc2lvbiA9IGNvbWJpbmVSZXR1cm5FeHByZXNzaW9ucyhleHByZXNzaW9ucyk7XG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAoICR7ZmllbGRQYXRofSAmJiAoIEZPUiAke2FsaWFzfSBJTiAke2ZpZWxkUGF0aH0gfHwgW10gUkVUVVJOICR7aXRlbUV4cHJlc3Npb259ICkgKWA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24gPSBgJHtwYXRofS4ke25hbWV9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbixcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmlsdGVyQ29uZGl0aW9uKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdChcIi5cIikuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKFwiLlwiKTtcbiAgICAgICAgICAgIHJldHVybiBmaWx0ZXJDb25kaXRpb25Gb3JGaWVsZHMoXG4gICAgICAgICAgICAgICAgb25fcGF0aCxcbiAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgc2NhbGFyT3BzLFxuICAgICAgICAgICAgICAgIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBvcC5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb25zKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lOiBvbkZpZWxkLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7b25GaWVsZH1gLFxuICAgICAgICAgICAgfV07XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihcbiAgICBvbkZpZWxkOiBzdHJpbmcsXG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSxcbik6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFN0cmluZyBDb21wYW5pb25zXG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdDb21wYW5pb24ob25GaWVsZDogc3RyaW5nKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihfcGFyYW1zLCBfcGF0aCwgX2ZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIFwiZmFsc2VcIjtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpIHtcbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChfcGFyZW50LCBfdmFsdWUsIF9maWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBKb2luc1xuXG5leHBvcnQgZnVuY3Rpb24gam9pbihcbiAgICBvbkZpZWxkOiBzdHJpbmcsXG4gICAgcmVmRmllbGQ6IHN0cmluZyxcbiAgICByZWZDb2xsZWN0aW9uOiBzdHJpbmcsXG4gICAgZXh0cmFGaWVsZHM6IHN0cmluZ1tdLFxuICAgIHJlc29sdmVSZWZUeXBlOiAoKSA9PiBRVHlwZSxcbik6IFFUeXBlIHtcbiAgICBsZXQgcmVzb2x2ZWQ6ID9RVHlwZSA9IG51bGw7XG4gICAgY29uc3QgbmFtZSA9IG9uRmllbGQgPT09IFwiaWRcIiA/IFwiX2tleVwiIDogb25GaWVsZDtcbiAgICByZXR1cm4ge1xuICAgICAgICBmaWx0ZXJDb25kaXRpb24ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KFwiLlwiKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oXCIuXCIpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoXCIuXCIsIFwiX1wiKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyQ29uZGl0aW9uID0gcmVmVHlwZS5maWx0ZXJDb25kaXRpb24ocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZkZpbHRlckNvbmRpdGlvbn0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHJldHVybkV4cHJlc3Npb25zKHBhdGg6IHN0cmluZywgX2RlZjogR0ZpZWxkKTogUVJldHVybkV4cHJlc3Npb25bXSB7XG4gICAgICAgICAgICByZXR1cm4gW3tcbiAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgIGV4cHJlc3Npb246IGAke3BhdGh9LiR7bmFtZX1gLFxuICAgICAgICAgICAgfSwgLi4uZXh0cmFGaWVsZHMubWFwKHggPT4gKHsgbmFtZTogeCwgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHt4fWAgfSkpXTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gam9pbkFycmF5KFxuICAgIG9uRmllbGQ6IHN0cmluZyxcbiAgICByZWZGaWVsZDogc3RyaW5nLFxuICAgIHJlZkNvbGxlY3Rpb246IHN0cmluZyxcbiAgICByZXNvbHZlUmVmVHlwZTogKCkgPT4gUVR5cGUsXG4pOiBRVHlwZSB7XG4gICAgbGV0IHJlc29sdmVkOiA/UVR5cGUgPSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGZpbHRlckNvbmRpdGlvbihwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmVHlwZSA9IHJlc29sdmVkIHx8IChyZXNvbHZlZCA9IHJlc29sdmVSZWZUeXBlKCkpO1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoXCIuXCIpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbihcIi5cIik7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZShcIi5cIiwgXCJfXCIpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXJDb25kaXRpb24gPSByZWZUeXBlLmZpbHRlckNvbmRpdGlvbihwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZGaWx0ZXJDb25kaXRpb259KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyBcIkxJTUlUIDFcIiA6IFwiXCJ9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogXCI+IDBcIn0pYDtcbiAgICAgICAgfSxcbiAgICAgICAgcmV0dXJuRXhwcmVzc2lvbnMocGF0aDogc3RyaW5nLCBfZGVmOiBHRmllbGQpOiBRUmV0dXJuRXhwcmVzc2lvbltdIHtcbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgIG5hbWU6IG9uRmllbGQsXG4gICAgICAgICAgICAgICAgZXhwcmVzc2lvbjogYCR7cGF0aH0uJHtvbkZpZWxkfWAsXG4gICAgICAgICAgICB9XTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZlR5cGUgPSByZXNvbHZlZCB8fCAocmVzb2x2ZWQgPSByZXNvbHZlUmVmVHlwZSgpKTtcbiAgICAgICAgICAgIHJldHVybiByZWZUeXBlLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGUsXG59O1xuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5jb25zdCBzcyA9IHtcbiAgICBcImtpbmRcIjogXCJGaWVsZFwiLFxuICAgIFwibmFtZVwiOiB7XG4gICAgICAgIFwia2luZFwiOiBcIk5hbWVcIixcbiAgICAgICAgXCJ2YWx1ZVwiOiBcImFjY291bnRfYmxvY2tzXCIsXG4gICAgICAgIFwibG9jXCI6IHtcbiAgICAgICAgICAgIFwic3RhcnRcIjogNzQsXG4gICAgICAgICAgICBcImVuZFwiOiA4OCxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIFwiYXJndW1lbnRzXCI6IFtdLFxuICAgIFwiZGlyZWN0aXZlc1wiOiBbXSxcbiAgICBcInNlbGVjdGlvblNldFwiOiB7XG4gICAgICAgIFwia2luZFwiOiBcIlNlbGVjdGlvblNldFwiLFxuICAgICAgICBcInNlbGVjdGlvbnNcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwia2luZFwiOiBcIkZpZWxkXCIsXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgXCJraW5kXCI6IFwiTmFtZVwiLFxuICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiYWNjb3VudF9hZGRyXCIsXG4gICAgICAgICAgICAgICAgICAgIFwibG9jXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic3RhcnRcIjogOTcsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImVuZFwiOiAxMDksXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBcImFyZ3VtZW50c1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcImRpcmVjdGl2ZXNcIjogW10sXG4gICAgICAgICAgICAgICAgXCJsb2NcIjoge1xuICAgICAgICAgICAgICAgICAgICBcInN0YXJ0XCI6IDk3LFxuICAgICAgICAgICAgICAgICAgICBcImVuZFwiOiAxMDksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIFwibG9jXCI6IHtcbiAgICAgICAgICAgIFwic3RhcnRcIjogODksXG4gICAgICAgICAgICBcImVuZFwiOiAxMTUsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBcImxvY1wiOiB7XG4gICAgICAgIFwic3RhcnRcIjogNzQsXG4gICAgICAgIFwiZW5kXCI6IDExNSxcbiAgICB9LFxufTtcblxuZnVuY3Rpb24gaXNGaWVsZFdpdGhOYW1lKGRlZjogR0RlZmluaXRpb24sIG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBkZWYua2luZCA9PT0gXCJGaWVsZFwiICYmIGRlZi5uYW1lLnZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IG5hbWUudG9Mb3dlckNhc2UoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1lcmdlRmllbGRXaXRoU2VsZWN0aW9uU2V0KGZpZWxkUGF0aDogc3RyaW5nLCBzZWxlY3Rpb25TZXQ6IEdTZWxlY3Rpb25TZXQpIHtcbiAgICBjb25zdCBkb3RQb3MgPSBmaWVsZFBhdGguaW5kZXhPZihcIi5cIik7XG4gICAgY29uc3QgbmFtZSA9IGRvdFBvcyA+PSAwID8gZmllbGRQYXRoLnN1YnN0cigwLCBkb3RQb3MpIDogZmllbGRQYXRoO1xuICAgIGNvbnN0IHRhaWwgPSBkb3RQb3MgPj0gMCA/IGZpZWxkUGF0aC5zdWJzdHIoZG90UG9zICsgMSkgOiBcIlwiO1xuICAgIGxldCBmaWVsZDogR0ZpZWxkIHwgdHlwZW9mIHVuZGVmaW5lZCA9IHNlbGVjdGlvblNldC5zZWxlY3Rpb25zLmZpbmQoeCA9PiBpc0ZpZWxkV2l0aE5hbWUoeCwgbmFtZSkpO1xuICAgIGlmICghZmllbGQpIHtcbiAgICAgICAgZmllbGQgPSB7XG4gICAgICAgICAgICBraW5kOiBcIkZpZWxkXCIsXG4gICAgICAgICAgICBhbGlhczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgbmFtZTogeyBraW5kOiBcIk5hbWVcIiwgdmFsdWU6IG5hbWUgfSxcbiAgICAgICAgICAgIGFyZ3VtZW50czogW10sXG4gICAgICAgICAgICBkaXJlY3RpdmVzOiBbXSxcbiAgICAgICAgICAgIHNlbGVjdGlvblNldDogdW5kZWZpbmVkLFxuICAgICAgICB9O1xuICAgICAgICBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucy5wdXNoKGZpZWxkKTtcbiAgICB9XG4gICAgaWYgKHRhaWwgIT09IFwiXCIpIHtcbiAgICAgICAgaWYgKCFmaWVsZC5zZWxlY3Rpb25TZXQpIHtcbiAgICAgICAgICAgIGZpZWxkLnNlbGVjdGlvblNldCA9IHtcbiAgICAgICAgICAgICAgICBraW5kOiBcIlNlbGVjdGlvblNldFwiLFxuICAgICAgICAgICAgICAgIHNlbGVjdGlvbnM6IFtdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBtZXJnZUZpZWxkV2l0aFNlbGVjdGlvblNldCh0YWlsLCBzZWxlY3Rpb25TZXQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KFxuICAgIHNlbGVjdGlvblNldDogP0dTZWxlY3Rpb25TZXQsXG4gICAgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyxcbik6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgXCJcIjtcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCBcIlwiKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gXCJcIiAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSBcIl9fdHlwZW5hbWVcIilcbiAgICAgICAgLm1hcCgoZmllbGQ6IEZpZWxkU2VsZWN0aW9uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZFNlbGVjdGlvbiA9IHNlbGVjdGlvblRvU3RyaW5nKGZpZWxkLnNlbGVjdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gYCR7ZmllbGQubmFtZX0ke2ZpZWxkU2VsZWN0aW9uICE9PSBcIlwiID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogXCJcIn1gO1xuICAgICAgICB9KS5qb2luKFwiIFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZG9jO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShkb2MpKSB7XG4gICAgICAgIHJldHVybiBkb2MubWFwKHggPT4gc2VsZWN0RmllbGRzKHgsIHNlbGVjdGlvbikpO1xuICAgIH1cbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCByZXF1aXJlZEZvckpvaW4gPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiBbXCJpbl9tc2dcIl0sXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6IFtcIm91dF9tc2dcIl0sXG4gICAgICAgICAgICBzaWduYXR1cmVzOiBbXCJpZFwiXSxcbiAgICAgICAgICAgIHNyY190cmFuc2FjdGlvbjogW1wiaWRcIiwgXCJtc2dfdHlwZVwiXSxcbiAgICAgICAgICAgIGRzdF90cmFuc2FjdGlvbjogW1wiaWRcIiwgXCJtc2dfdHlwZVwiXSxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAocmVxdWlyZWRGb3JKb2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRm9ySm9pbi5mb3JFYWNoKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2NbZmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWRbZmllbGRdID0gZG9jW2ZpZWxkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pXG4gICAgICAgICAgICAgICAgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCB0eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgdHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgb3BlcmF0aW9uSWQ6ID9zdHJpbmcsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBpc0Zhc3Q6IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmRleFRvU3RyaW5nKGluZGV4OiBRSW5kZXhJbmZvKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW5kZXguZmllbGRzLmpvaW4oXCIsIFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSW5kZXgoczogc3RyaW5nKTogUUluZGV4SW5mbyB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmllbGRzOiBzLnNwbGl0KFwiLFwiKS5tYXAoeCA9PiB4LnRyaW0oKSkuZmlsdGVyKHggPT4geCksXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnlUb1N0cmluZyhvcmRlckJ5OiBPcmRlckJ5W10pOiBzdHJpbmcge1xuICAgIHJldHVybiBvcmRlckJ5Lm1hcCh4ID0+IGAke3gucGF0aH0keyh4LmRpcmVjdGlvbiB8fCBcIlwiKSA9PT0gXCJERVNDXCIgPyBcIiBERVNDXCIgOiBcIlwifWApLmpvaW4oXCIsIFwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlT3JkZXJCeShzOiBzdHJpbmcpOiBPcmRlckJ5W10ge1xuICAgIHJldHVybiBzLnNwbGl0KFwiLFwiKVxuICAgICAgICAubWFwKHggPT4geC50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4KVxuICAgICAgICAubWFwKChzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwYXJ0cyA9IHMuc3BsaXQoXCIgXCIpLmZpbHRlcih4ID0+IHgpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBwYXJ0c1swXSxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IChwYXJ0c1sxXSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpID09PSBcImRlc2NcIiA/IFwiREVTQ1wiIDogXCJBU0NcIixcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY2FsYXJGaWVsZHMoc2NoZW1hOiBEYlNjaGVtYSk6IE1hcDxzdHJpbmcsIHsgdHlwZTogc3RyaW5nLCBwYXRoOiBzdHJpbmcgfT4ge1xuICAgIGNvbnN0IHNjYWxhckZpZWxkcyA9IG5ldyBNYXA8c3RyaW5nLCB7IHR5cGU6IHN0cmluZywgcGF0aDogc3RyaW5nIH0+KCk7XG5cbiAgICBmdW5jdGlvbiBhZGRGb3JEYlR5cGUodHlwZTogRGJUeXBlLCBwYXJlbnRQYXRoLCBwYXJlbnREb2NQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgdHlwZS5maWVsZHMuZm9yRWFjaCgoZmllbGQ6IERiRmllbGQpID0+IHtcbiAgICAgICAgICAgIGlmIChmaWVsZC5qb2luIHx8IGZpZWxkLmVudW1EZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkb2NOYW1lID0gdHlwZS5jb2xsZWN0aW9uICYmIGZpZWxkLm5hbWUgPT09IFwiaWRcIiA/IFwiX2tleVwiIDogZmllbGQubmFtZTtcbiAgICAgICAgICAgIGNvbnN0IHBhdGggPSBgJHtwYXJlbnRQYXRofS4ke2ZpZWxkLm5hbWV9YDtcbiAgICAgICAgICAgIGxldCBkb2NQYXRoID0gYCR7cGFyZW50RG9jUGF0aH0uJHtkb2NOYW1lfWA7XG4gICAgICAgICAgICBpZiAoZmllbGQuYXJyYXlEZXB0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgc3VmZml4ID0gXCJbKl1cIjtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBkZXB0aCA9IDEwOyBkZXB0aCA+IDA7IGRlcHRoIC09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcyA9IGBbJHtcIipcIi5yZXBlYXQoZGVwdGgpfV1gO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jUGF0aC5pbmNsdWRlcyhzKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VmZml4ID0gYFske1wiKlwiLnJlcGVhdChkZXB0aCArIDEpfV1gO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZG9jUGF0aCA9IGAke2RvY1BhdGh9JHtzdWZmaXh9YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3aXRjaCAoZmllbGQudHlwZS5jYXRlZ29yeSkge1xuICAgICAgICAgICAgY2FzZSBcInNjYWxhclwiOlxuICAgICAgICAgICAgICAgIGxldCB0eXBlTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuYm9vbGVhbikge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9IFwiYm9vbGVhblwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuZmxvYXQpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZU5hbWUgPSBcIm51bWJlclwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmllbGQudHlwZSA9PT0gc2NhbGFyVHlwZXMuaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGVOYW1lID0gXCJudW1iZXJcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZpZWxkLnR5cGUgPT09IHNjYWxhclR5cGVzLnVpbnQ2NCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9IFwidWludDY0XCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmaWVsZC50eXBlID09PSBzY2FsYXJUeXBlcy51aW50MTAyNCkge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9IFwidWludDEwMjRcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlTmFtZSA9IFwic3RyaW5nXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNjYWxhckZpZWxkcy5zZXQoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogZG9jUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cnVjdFwiOlxuICAgICAgICAgICAgY2FzZSBcInVuaW9uXCI6XG4gICAgICAgICAgICAgICAgYWRkRm9yRGJUeXBlKGZpZWxkLnR5cGUsIHBhdGgsIGRvY1BhdGgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNjaGVtYS50eXBlcy5mb3JFYWNoKCh0eXBlKSA9PiB7XG4gICAgICAgIGFkZEZvckRiVHlwZSh0eXBlLCBcIlwiLCBcIlwiKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzY2FsYXJGaWVsZHM7XG59XG4iXX0=