"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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
exports.bigUInt2 = exports.bigUInt1 = exports.scalar = exports.QParams = void 0;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

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

/**
 * Query parameters
 */
var QParams =
/*#__PURE__*/
function () {
  function QParams() {
    (0, _classCallCheck2["default"])(this, QParams);
    (0, _defineProperty2["default"])(this, "values", void 0);
    (0, _defineProperty2["default"])(this, "count", void 0);
    this.count = 0;
    this.values = {};
  }

  (0, _createClass2["default"])(QParams, [{
    key: "clear",
    value: function clear() {
      this.count = 0;
      this.values = {};
    }
  }, {
    key: "add",
    value: function add(value) {
      this.count += 1;
      var name = "v".concat(this.count.toString());
      this.values[name] = value;
      return name;
    }
  }]);
  return QParams;
}();
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
  var conditions = [];
  Object.entries(filter).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        filterKey = _ref2[0],
        filterValue = _ref2[1];

    var fieldType = fieldTypes[filterKey];

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
  var failed = Object.entries(filter).find(function (_ref3) {
    var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
        filterKey = _ref4[0],
        filterValue = _ref4[1];

    var fieldType = fieldTypes[filterKey];
    return !(fieldType && testField(fieldType, value, filterKey, filterValue));
  });
  return !failed;
}

function combine(path, key) {
  return key !== '' ? "".concat(path, ".").concat(key) : path;
}

function qlOp(params, path, op, filter) {
  var paramName = params.add(filter);
  /*
   * Following TO_STRING cast required due to specific comparision of _key fields in Arango
   * For example this query:
   * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
   * Will return:
   * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
   */

  var isKeyOrderedComparision = path.endsWith('._key') && op !== '==' && op !== '!=';
  var fixedPath = isKeyOrderedComparision ? "TO_STRING(".concat(path, ")") : path;
  var fixedValue = "@".concat(paramName);
  return "".concat(fixedPath, " ").concat(op, " ").concat(fixedValue);
}

function qlCombine(conditions, op, defaultConditions) {
  if (conditions.length === 0) {
    return defaultConditions;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return '(' + conditions.join(") ".concat(op, " (")) + ')';
}

function qlIn(params, path, filter) {
  var conditions = filter.map(function (value) {
    return qlOp(params, path, '==', value);
  });
  return qlCombine(conditions, 'OR', 'false');
} // Scalars


function undefinedToNull(v) {
  return v !== undefined ? v : null;
}

var scalarEq = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '==', filter);
  },
  test: function test(parent, value, filter) {
    return value === filter;
  }
};
var scalarNe = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '!=', filter);
  },
  test: function test(parent, value, filter) {
    return value !== filter;
  }
};
var scalarLt = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '<', filter);
  },
  test: function test(parent, value, filter) {
    return value < filter;
  }
};
var scalarLe = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '<=', filter);
  },
  test: function test(parent, value, filter) {
    return value <= filter;
  }
};
var scalarGt = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '>', filter);
  },
  test: function test(parent, value, filter) {
    return value > filter;
  }
};
var scalarGe = {
  ql: function ql(params, path, filter) {
    return qlOp(params, path, '>=', filter);
  },
  test: function test(parent, value, filter) {
    return value >= filter;
  }
};
var scalarIn = {
  ql: function ql(params, path, filter) {
    return qlIn(params, path, filter);
  },
  test: function test(parent, value, filter) {
    return filter.includes(value);
  }
};
var scalarNotIn = {
  ql: function ql(params, path, filter) {
    return "NOT (".concat(qlIn(params, path, filter), ")");
  },
  test: function test(parent, value, filter) {
    return !filter.includes(value);
  }
};
var scalarOps = {
  eq: scalarEq,
  ne: scalarNe,
  lt: scalarLt,
  le: scalarLe,
  gt: scalarGt,
  ge: scalarGe,
  "in": scalarIn,
  notIn: scalarNotIn
};

function createScalar() {
  return {
    ql: function ql(params, path, filter) {
      return qlFields(path, filter, scalarOps, function (op, path, filterKey, filterValue) {
        return op.ql(params, path, filterValue);
      });
    },
    test: function test(parent, value, filter) {
      return testFields(value, filter, scalarOps, function (op, value, filterKey, filterValue) {
        return op.test(parent, undefinedToNull(value), filterValue);
      });
    }
  };
}

function resolveBigUInt(prefixLength, value) {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === 'number' ? "0x".concat(value.toString(16)) : "0x".concat(value.toString().substr(prefixLength));
}

function convertBigUInt(prefixLength, value) {
  if (value === null || value === undefined) {
    return value;
  }

  var hex = BigInt(value).toString(16);
  var len = hex.length.toString(16);
  var missingZeros = prefixLength - len.length;
  var prefix = missingZeros > 0 ? "".concat('0'.repeat(missingZeros)).concat(len) : len;
  return "".concat(prefix).concat(hex);
}

function createBigUInt(prefixLength) {
  return {
    ql: function ql(params, path, filter) {
      return qlFields(path, filter, scalarOps, function (op, path, filterKey, filterValue) {
        var converted = op === scalarOps["in"] || op === scalarOps.notIn ? filterValue.map(function (x) {
          return convertBigUInt(prefixLength, x);
        }) : convertBigUInt(prefixLength, filterValue);
        return op.ql(params, path, converted);
      });
    },
    test: function test(parent, value, filter) {
      return testFields(value, filter, scalarOps, function (op, value, filterKey, filterValue) {
        var converted = op === scalarOps["in"] || op === scalarOps.notIn ? filterValue.map(function (x) {
          return convertBigUInt(prefixLength, x);
        }) : convertBigUInt(prefixLength, filterValue);
        return op.test(parent, value, converted);
      });
    }
  };
}

var scalar = createScalar();
exports.scalar = scalar;
var bigUInt1 = createBigUInt(1);
exports.bigUInt1 = bigUInt1;
var bigUInt2 = createBigUInt(2); // Structs

exports.bigUInt2 = bigUInt2;

function struct(fields, isCollection) {
  return {
    ql: function ql(params, path, filter) {
      return qlFields(path, filter, fields, function (fieldType, path, filterKey, filterValue) {
        var fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.ql(params, combine(path, fieldName), filterValue);
      });
    },
    test: function test(parent, value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, fields, function (fieldType, value, filterKey, filterValue) {
        var fieldName = isCollection && filterKey === 'id' ? '_key' : filterKey;
        return fieldType.test(value, value[fieldName], filterValue);
      });
    }
  };
} // Arrays


function array(itemType) {
  var ops = {
    all: {
      ql: function ql(params, path, filter) {
        var itemQl = itemType.ql(params, 'CURRENT', filter);
        return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) == LENGTH(").concat(path, ")");
      },
      test: function test(parent, value, filter) {
        var failedIndex = value.findIndex(function (x) {
          return !itemType.test(parent, x, filter);
        });
        return failedIndex < 0;
      }
    },
    any: {
      ql: function ql(params, path, filter) {
        var paramName = "@v".concat(params.count + 1);
        var itemQl = itemType.ql(params, 'CURRENT', filter);

        if (itemQl === "CURRENT == ".concat(paramName)) {
          return "".concat(paramName, " IN ").concat(path, "[*]");
        }

        return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) > 0");
      },
      test: function test(parent, value, filter) {
        var succeededIndex = value.findIndex(function (x) {
          return itemType.test(parent, x, filter);
        });
        return succeededIndex >= 0;
      }
    }
  };
  return {
    ql: function ql(params, path, filter) {
      return qlFields(path, filter, ops, function (op, path, filterKey, filterValue) {
        return op.ql(params, path, filterValue);
      });
    },
    test: function test(parent, value, filter) {
      if (!value) {
        return false;
      }

      return testFields(value, filter, ops, function (op, value, filterKey, filterValue) {
        return op.test(parent, value, filterValue);
      });
    }
  };
} // Enum Names


function createEnumNamesMap(values) {
  var names = new Map();
  Object.entries(values).forEach(function (_ref5) {
    var _ref6 = (0, _slicedToArray2["default"])(_ref5, 2),
        name = _ref6[0],
        value = _ref6[1];

    names.set(Number.parseInt(value), name);
  });
  return names;
}

function enumName(onField, values) {
  var resolveValue = function resolveValue(name) {
    var value = values[name];

    if (value === undefined) {
      throw new Error("Invalid value [".concat(name, "] for ").concat(onField, "_name"));
    }

    return value;
  };

  return {
    ql: function ql(params, path, filter) {
      var on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      return qlFields(on_path, filter, scalarOps, function (op, path, filterKey, filterValue) {
        var resolved = op === scalarOps["in"] || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.ql(params, path, resolved);
      });
    },
    test: function test(parent, value, filter) {
      return testFields(value, filter, scalarOps, function (op, value, filterKey, filterValue) {
        var resolved = op === scalarOps["in"] || op === scalarOps.notIn ? filterValue.map(resolveValue) : resolveValue(filterValue);
        return op.test(parent, parent[onField], resolved);
      });
    }
  };
}

function createEnumNameResolver(onField, values) {
  var names = createEnumNamesMap(values);
  return function (parent) {
    var value = parent[onField];
    var name = names.get(value);
    return name !== undefined ? name : null;
  };
} // Joins


function join(onField, refCollection, refType) {
  return {
    ql: function ql(params, path, filter) {
      var on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      var alias = "".concat(on_path.replace('.', '_'));
      var refQl = refType.ql(params, alias, filter);
      return "\n                LENGTH(\n                    FOR ".concat(alias, " IN ").concat(refCollection, "\n                    FILTER (").concat(alias, "._key == ").concat(on_path, ") AND (").concat(refQl, ")\n                    LIMIT 1\n                    RETURN 1\n                ) > 0");
    },
    test: refType.test
  };
}

function joinArray(onField, refCollection, refType) {
  return {
    ql: function ql(params, path, filter) {
      var refFilter = filter.all || filter.any;
      var all = !!filter.all;
      var on_path = path.split('.').slice(0, -1).concat(onField).join('.');
      var alias = "".concat(on_path.replace('.', '_'));
      var refQl = refType.ql(params, alias, refFilter);
      return "\n                (LENGTH(".concat(on_path, ") > 0)\n                AND (LENGTH(\n                    FOR ").concat(alias, " IN ").concat(refCollection, "\n                    FILTER (").concat(alias, "._key IN ").concat(on_path, ") AND (").concat(refQl, ")\n                    ").concat(!all ? 'LIMIT 1' : '', "\n                    RETURN 1\n                ) ").concat(all ? "== LENGTH(".concat(on_path, ")") : '> 0', ")");
    },
    test: refType.test
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXR5cGVzLmpzIl0sIm5hbWVzIjpbIlFQYXJhbXMiLCJjb3VudCIsInZhbHVlcyIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwicWxGaWVsZHMiLCJwYXRoIiwiZmlsdGVyIiwiZmllbGRUeXBlcyIsInFsRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImNvbWJpbmUiLCJrZXkiLCJxbE9wIiwicGFyYW1zIiwib3AiLCJwYXJhbU5hbWUiLCJhZGQiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImVuZHNXaXRoIiwiZml4ZWRQYXRoIiwiZml4ZWRWYWx1ZSIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJ1bmRlZmluZWRUb051bGwiLCJ2IiwidW5kZWZpbmVkIiwic2NhbGFyRXEiLCJxbCIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsInN1YnN0ciIsImNvbnZlcnRCaWdVSW50IiwiaGV4IiwiQmlnSW50IiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwiY3JlYXRlQmlnVUludCIsImNvbnZlcnRlZCIsIngiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3RydWN0IiwiZmllbGRzIiwiaXNDb2xsZWN0aW9uIiwiZmllbGROYW1lIiwiYXJyYXkiLCJpdGVtVHlwZSIsIm9wcyIsImFsbCIsIml0ZW1RbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk1hcCIsInNldCIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwiRXJyb3IiLCJvbl9wYXRoIiwic3BsaXQiLCJzbGljZSIsImNvbmNhdCIsInJlc29sdmVkIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsImdldCIsInJlZkNvbGxlY3Rpb24iLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7O0lBR2FBLE87OztBQUlULHFCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBS0MsS0FBTCxHQUFhLENBQWI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsRUFBZDtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBS0QsS0FBTCxHQUFhLENBQWI7QUFDQSxXQUFLQyxNQUFMLEdBQWMsRUFBZDtBQUNIOzs7d0JBRUdDLEssRUFBb0I7QUFDcEIsV0FBS0YsS0FBTCxJQUFjLENBQWQ7QUFDQSxVQUFNRyxJQUFJLGNBQU8sS0FBS0gsS0FBTCxDQUFXSSxRQUFYLEVBQVAsQ0FBVjtBQUNBLFdBQUtILE1BQUwsQ0FBWUUsSUFBWixJQUFvQkQsS0FBcEI7QUFDQSxhQUFPQyxJQUFQO0FBQ0g7Ozs7QUFHTDs7Ozs7Ozs7QUF5QkE7Ozs7Ozs7OztBQVNBLFNBQVNFLFFBQVQsQ0FDSUMsSUFESixFQUVJQyxNQUZKLEVBR0lDLFVBSEosRUFJSUMsT0FKSixFQUtVO0FBQ04sTUFBTUMsVUFBb0IsR0FBRyxFQUE3QjtBQUNBQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUwsTUFB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QiwrREFPUUEsR0FBRyx1QkFBZ0JnQixPQUFoQixTQUE2QixLQVB4QztBQVFILEtBZkU7QUFnQkgxRCxJQUFBQSxJQUFJLEVBQUVrRSxPQUFPLENBQUNsRTtBQWhCWCxHQUFQO0FBa0JIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBxbDogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHFsRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHFsRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHFsRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmdcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChxbEZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5cbmZ1bmN0aW9uIGNvbWJpbmUocGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGtleSAhPT0gJycgPyBgJHtwYXRofS4ke2tleX1gIDogcGF0aDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gcGF0aC5lbmRzV2l0aCgnLl9rZXknKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLyBTY2FsYXJzXG5cbmZ1bmN0aW9uIHVuZGVmaW5lZFRvTnVsbCh2OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiB2ICE9PSB1bmRlZmluZWQgPyB2IDogbnVsbDtcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH1cbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdW5kZWZpbmVkVG9OdWxsKHZhbHVlKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKVxuICAgICAgICA/IGAweCR7dmFsdWUudG9TdHJpbmcoMTYpfWBcbiAgICAgICAgOiBgMHgke3ZhbHVlLnRvU3RyaW5nKCkuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gQmlnSW50KHZhbHVlKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gaGV4Lmxlbmd0aC50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgcmV0dXJuIGAke3ByZWZpeH0ke2hleH1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5jb25zdCBiaWdVSW50MjogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDIpO1xuXG4vLyBTdHJ1Y3RzXG5cbmZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnFsKHBhcmFtcywgY29tYmluZShwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBhcnJheShpdGVtVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1OYW1lID0gYEB2JHtwYXJhbXMuY291bnQgKyAxfWA7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1RbCA9PT0gYENVUlJFTlQgPT0gJHtwYXJhbU5hbWV9YCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYCR7cGFyYW1OYW1lfSBJTiAke3BhdGh9WypdYDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLyBKb2luc1xuXG5mdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZWZUeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHJlZlR5cGUudGVzdCxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBqb2luQXJyYXkob25GaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlZlR5cGU6IFFUeXBlKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDogcmVmVHlwZS50ZXN0LFxuICAgIH07XG59XG5cbmV4cG9ydCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIGNvbnZlcnRCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheVxufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuIl19