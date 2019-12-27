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
 * Copyright 2018-2019 TON DEV SOLUTIONS LTD.
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
        return op.test(parent, value, filterValue);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXR5cGVzLmpzIl0sIm5hbWVzIjpbIlFQYXJhbXMiLCJjb3VudCIsInZhbHVlcyIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwicWxGaWVsZHMiLCJwYXRoIiwiZmlsdGVyIiwiZmllbGRUeXBlcyIsInFsRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImNvbWJpbmUiLCJrZXkiLCJxbE9wIiwicGFyYW1zIiwib3AiLCJwYXJhbU5hbWUiLCJhZGQiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImVuZHNXaXRoIiwiZml4ZWRQYXRoIiwiZml4ZWRWYWx1ZSIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJzY2FsYXJFcSIsInFsIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJub3RJbiIsImNyZWF0ZVNjYWxhciIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwidW5kZWZpbmVkIiwic3Vic3RyIiwiY29udmVydEJpZ1VJbnQiLCJoZXgiLCJCaWdJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzdHJ1Y3QiLCJmaWVsZHMiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJhcnJheSIsIml0ZW1UeXBlIiwib3BzIiwiYWxsIiwiaXRlbVFsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJzdWNjZWVkZWRJbmRleCIsImNyZWF0ZUVudW1OYW1lc01hcCIsIm5hbWVzIiwiTWFwIiwic2V0IiwiTnVtYmVyIiwicGFyc2VJbnQiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJFcnJvciIsIm9uX3BhdGgiLCJzcGxpdCIsInNsaWNlIiwiY29uY2F0IiwicmVzb2x2ZWQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiZ2V0IiwicmVmQ29sbGVjdGlvbiIsInJlZlR5cGUiLCJhbGlhcyIsInJlcGxhY2UiLCJyZWZRbCIsImpvaW5BcnJheSIsInJlZkZpbHRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOzs7SUFHYUEsTzs7O0FBSVQscUJBQWM7QUFBQTtBQUFBO0FBQUE7QUFDVixTQUFLQyxLQUFMLEdBQWEsQ0FBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0g7Ozs7NEJBRU87QUFDSixXQUFLRCxLQUFMLEdBQWEsQ0FBYjtBQUNBLFdBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0g7Ozt3QkFFR0MsSyxFQUFvQjtBQUNwQixXQUFLRixLQUFMLElBQWMsQ0FBZDtBQUNBLFVBQU1HLElBQUksY0FBTyxLQUFLSCxLQUFMLENBQVdJLFFBQVgsRUFBUCxDQUFWO0FBQ0EsV0FBS0gsTUFBTCxDQUFZRSxJQUFaLElBQW9CRCxLQUFwQjtBQUNBLGFBQU9DLElBQVA7QUFDSDs7OztBQUdMOzs7Ozs7OztBQXlCQTs7Ozs7Ozs7O0FBU0EsU0FBU0UsUUFBVCxDQUNJQyxJQURKLEVBRUlDLE1BRkosRUFHSUMsVUFISixFQUlJQyxPQUpKLEVBS1U7QUFDTixNQUFNQyxVQUFvQixHQUFHLEVBQTdCO0FBQ0FDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlTCxNQUFmLEVBQXVCTSxPQUF2QixDQUErQixn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VElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5cbmRlY2xhcmUgZnVuY3Rpb24gQmlnSW50KGE6IGFueSk6IGFueTtcblxuLyoqXG4gKiBRdWVyeSBwYXJhbWV0ZXJzXG4gKi9cbmV4cG9ydCBjbGFzcyBRUGFyYW1zIHtcbiAgICB2YWx1ZXM6IHsgW3N0cmluZ106IGFueSB9O1xuICAgIGNvdW50OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGFkZCh2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICAgICAgdGhpcy5jb3VudCArPSAxO1xuICAgICAgICBjb25zdCBuYW1lID0gYHYke3RoaXMuY291bnQudG9TdHJpbmcoKX1gO1xuICAgICAgICB0aGlzLnZhbHVlc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG59XG5cbi8qKlxuICogQWJzdHJhY3QgaW50ZXJmYWNlIGZvciBvYmplY3RzIHRoYXQgYWN0cyBhcyBhIGhlbHBlcnMgdG8gcGVyZm9ybSBxdWVyaWVzIG92ZXIgZG9jdW1lbnRzXG4gKiB1c2luZyBxdWVyeSBmaWx0ZXJzLlxuICovXG50eXBlIFFUeXBlID0ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyBhbiBBcmFuZ28gUUwgY29uZGl0aW9uIGZvciBzcGVjaWZpZWQgZmllbGQgYmFzZWQgb24gc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKiBUaGUgY29uZGl0aW9uIG11c3QgYmUgYSBzdHJpbmcgZXhwcmVzc2lvbiB0aGF0IGV2YWx1YXRlcyB0byBib29sZWFuLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCBmcm9tIGRvY3VtZW50IHJvb3QgdG8gY29uY3JldGUgZmllbGRcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGlzIGZpZWxkXG4gICAgICogQHJldHVybiB7c3RyaW5nfSBBcmFuZ28gUUwgY29uZGl0aW9uIHRleHRcbiAgICAgKi9cbiAgICBxbDogKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSkgPT4gc3RyaW5nLFxuICAgIC8qKlxuICAgICAqIFRlc3RzIHZhbHVlIGluIGRvY3VtZW50IGZyb20gQXJhbmdvIERCIGFnYWluc3Qgc3BlY2lmaWVkIGZpbHRlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSB0aGF0IG11c3QgYmUgdGVzdGVkIGFnYWluc3QgZmlsdGVyXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdXNlZCB0byB0ZXN0IGEgdmFsdWVcbiAgICAgKiBAcmV0dXJuIHRydWUgaWYgdmFsdWUgbWF0Y2hlcyBmaWx0ZXJcbiAgICAgKi9cbiAgICB0ZXN0OiAocGFyZW50OiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcjogYW55KSA9PiBib29sZWFuLFxufVxuXG5cbi8qKlxuICogR2VuZXJhdGVzIEFRTCBjb25kaXRpb24gZm9yIGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggdG8gZG9jdW1lbnQgZmllbGQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHFsRmllbGQgRnVuY3Rpb24gdGhhdCBnZW5lcmF0ZXMgY29uZGl0aW9uIGZvciBhIGNvbmNyZXRlIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHFsRmllbGRzKFxuICAgIHBhdGg6IHN0cmluZyxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHFsRmllbGQ6IChmaWVsZDogYW55LCBwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBzdHJpbmdcbik6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZFR5cGUpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaChxbEZpZWxkKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuLyoqXG4gKiBUZXN0IGRvY3VtZW50IHZhbHVlIGFnYWluc3QgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIG9mIHRoZSBmaWVsZCBpbiBkb2N1bWVudC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gdGVzdEZpZWxkIEZ1bmN0aW9uIHRoYXQgcGVyZm9ybXMgdGVzdCB2YWx1ZSBhZ2FpbnN0IGEgc2VsZWN0ZWQgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gdGVzdEZpZWxkcyhcbiAgICB2YWx1ZTogYW55LFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgdGVzdEZpZWxkOiAoZmllbGRUeXBlOiBhbnksIHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55KSA9PiBib29sZWFuXG4pOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZFR5cGUgPSBmaWVsZFR5cGVzW2ZpbHRlcktleV07XG4gICAgICAgIHJldHVybiAhKGZpZWxkVHlwZSAmJiB0ZXN0RmllbGQoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5cbmZ1bmN0aW9uIGNvbWJpbmUocGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGtleSAhPT0gJycgPyBgJHtwYXRofS4ke2tleX1gIDogcGF0aDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgb3A6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcmFtTmFtZSA9IHBhcmFtcy5hZGQoZmlsdGVyKTtcblxuICAgIC8qXG4gICAgICogRm9sbG93aW5nIFRPX1NUUklORyBjYXN0IHJlcXVpcmVkIGR1ZSB0byBzcGVjaWZpYyBjb21wYXJpc2lvbiBvZiBfa2V5IGZpZWxkcyBpbiBBcmFuZ29cbiAgICAgKiBGb3IgZXhhbXBsZSB0aGlzIHF1ZXJ5OlxuICAgICAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gICAgICogV2lsbCByZXR1cm46XG4gICAgICogYGBgW1wiZmUwMzMxODE2MTkzN2ViYjM2ODJmNjlhYzlmOTdiZWFmYmM0YjllZTZlMWY4NmQ1OWUxYmY4ZDI3YWI4NDg2N1wiXWBgYFxuICAgICAqL1xuICAgIGNvbnN0IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID0gcGF0aC5lbmRzV2l0aCgnLl9rZXknKSAmJiBvcCAhPT0gJz09JyAmJiBvcCAhPT0gJyE9JztcbiAgICBjb25zdCBmaXhlZFBhdGggPSBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA/IGBUT19TVFJJTkcoJHtwYXRofSlgIDogcGF0aDtcbiAgICBjb25zdCBmaXhlZFZhbHVlID0gYEAke3BhcmFtTmFtZX1gO1xuICAgIHJldHVybiBgJHtmaXhlZFBhdGh9ICR7b3B9ICR7Zml4ZWRWYWx1ZX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgdmFsdWUpKTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdPUicsICdmYWxzZScpO1xufVxuXG4vLyBTY2FsYXJzXG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiByZXNvbHZlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpXG4gICAgICAgID8gYDB4JHt2YWx1ZS50b1N0cmluZygxNil9YFxuICAgICAgICA6IGAweCR7dmFsdWUudG9TdHJpbmcoKS5zdWJzdHIocHJlZml4TGVuZ3RoKX1gO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlciwgdmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBjb25zdCBoZXggPSBCaWdJbnQodmFsdWUpLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBsZW4gPSBoZXgubGVuZ3RoLnRvU3RyaW5nKDE2KTtcbiAgICBjb25zdCBtaXNzaW5nWmVyb3MgPSBwcmVmaXhMZW5ndGggLSBsZW4ubGVuZ3RoO1xuICAgIGNvbnN0IHByZWZpeCA9IG1pc3NpbmdaZXJvcyA+IDAgPyBgJHsnMCcucmVwZWF0KG1pc3NpbmdaZXJvcyl9JHtsZW59YCA6IGxlbjtcbiAgICByZXR1cm4gYCR7cHJlZml4fSR7aGV4fWA7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuY29uc3Qgc2NhbGFyOiBRVHlwZSA9IGNyZWF0ZVNjYWxhcigpO1xuY29uc3QgYmlnVUludDE6IFFUeXBlID0gY3JlYXRlQmlnVUludCgxKTtcbmNvbnN0IGJpZ1VJbnQyOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMik7XG5cbi8vIFN0cnVjdHNcblxuZnVuY3Rpb24gc3RydWN0KGZpZWxkczogeyBbc3RyaW5nXTogUVR5cGUgfSwgaXNDb2xsZWN0aW9uPzogYm9vbGVhbik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUucWwocGFyYW1zLCBjb21iaW5lKHBhdGgsIGZpZWxkTmFtZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIGZpZWxkcywgKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS50ZXN0KHZhbHVlLCB2YWx1ZVtmaWVsZE5hbWVdLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gQXJyYXlzXG5cbmZ1bmN0aW9uIGFycmF5KGl0ZW1UeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICBjb25zdCBvcHMgPSB7XG4gICAgICAgIGFsbDoge1xuICAgICAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmYWlsZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+ICFpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhaWxlZEluZGV4IDwgMDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGFueToge1xuICAgICAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbU5hbWUgPSBgQHYke3BhcmFtcy5jb3VudCArIDF9YDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtUWwgPSBpdGVtVHlwZS5xbChwYXJhbXMsICdDVVJSRU5UJywgZmlsdGVyKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbVFsID09PSBgQ1VSUkVOVCA9PSAke3BhcmFtTmFtZX1gKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgJHtwYXJhbU5hbWV9IElOICR7cGF0aH1bKl1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID4gMGA7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IGl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBvcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIG9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBFbnVtIE5hbWVzXG5cbmZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogTWFwPG51bWJlciwgc3RyaW5nPiB7XG4gICAgY29uc3QgbmFtZXM6IE1hcDxudW1iZXIsIHN0cmluZz4gPSBuZXcgTWFwKCk7XG4gICAgT2JqZWN0LmVudHJpZXModmFsdWVzKS5mb3JFYWNoKChbbmFtZSwgdmFsdWVdKSA9PiB7XG4gICAgICAgIG5hbWVzLnNldChOdW1iZXIucGFyc2VJbnQoKHZhbHVlOiBhbnkpKSwgbmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW51bU5hbWUob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogUVR5cGUge1xuICAgIGNvbnN0IHJlc29sdmVWYWx1ZSA9IChuYW1lKSA9PiB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHZhbHVlc1tuYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCB2YWx1ZSBbJHtuYW1lfV0gZm9yICR7b25GaWVsZH1fbmFtZWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMob25fcGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgcGFyZW50W29uRmllbGRdLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVSZXNvbHZlcihvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiAocGFyZW50KSA9PiA/c3RyaW5nIHtcbiAgICBjb25zdCBuYW1lcyA9IGNyZWF0ZUVudW1OYW1lc01hcCh2YWx1ZXMpO1xuICAgIHJldHVybiAocGFyZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFyZW50W29uRmllbGRdO1xuICAgICAgICBjb25zdCBuYW1lID0gbmFtZXMuZ2V0KHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIG5hbWUgIT09IHVuZGVmaW5lZCA/IG5hbWUgOiBudWxsO1xuICAgIH07XG59XG5cbi8vIEpvaW5zXG5cbmZ1bmN0aW9uIGpvaW4ob25GaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlZlR5cGU6IFFUeXBlKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgZmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgPT0gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgTElNSVQgMVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgPiAwYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDogcmVmVHlwZS50ZXN0LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGpvaW5BcnJheShvbkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVmVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZkZpbHRlciA9IGZpbHRlci5hbGwgfHwgZmlsdGVyLmFueTtcbiAgICAgICAgICAgIGNvbnN0IGFsbCA9ICEhZmlsdGVyLmFsbDtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCByZWZGaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICAoTEVOR1RIKCR7b25fcGF0aH0pID4gMClcbiAgICAgICAgICAgICAgICBBTkQgKExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5IElOICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgICR7IWFsbCA/ICdMSU1JVCAxJyA6ICcnfVxuICAgICAgICAgICAgICAgICAgICBSRVRVUk4gMVxuICAgICAgICAgICAgICAgICkgJHthbGwgPyBgPT0gTEVOR1RIKCR7b25fcGF0aH0pYCA6ICc+IDAnfSlgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiByZWZUeXBlLnRlc3QsXG4gICAgfTtcbn1cblxuZXhwb3J0IHtcbiAgICBzY2FsYXIsXG4gICAgYmlnVUludDEsXG4gICAgYmlnVUludDIsXG4gICAgcmVzb2x2ZUJpZ1VJbnQsXG4gICAgY29udmVydEJpZ1VJbnQsXG4gICAgc3RydWN0LFxuICAgIGFycmF5LFxuICAgIGpvaW4sXG4gICAgam9pbkFycmF5XG59XG5cbmV4cG9ydCB0eXBlIHtcbiAgICBRVHlwZVxufVxuXG4iXX0=