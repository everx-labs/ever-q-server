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
        var itemQl = itemType.ql(params, 'CURRENT', filter);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXR5cGVzLmpzIl0sIm5hbWVzIjpbIlFQYXJhbXMiLCJjb3VudCIsInZhbHVlcyIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwicWxGaWVsZHMiLCJwYXRoIiwiZmlsdGVyIiwiZmllbGRUeXBlcyIsInFsRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImNvbWJpbmUiLCJrZXkiLCJxbE9wIiwicGFyYW1zIiwib3AiLCJwYXJhbU5hbWUiLCJhZGQiLCJpc0tleU9yZGVyZWRDb21wYXJpc2lvbiIsImVuZHNXaXRoIiwiZml4ZWRQYXRoIiwiZml4ZWRWYWx1ZSIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJzY2FsYXJFcSIsInFsIiwidGVzdCIsInBhcmVudCIsInNjYWxhck5lIiwic2NhbGFyTHQiLCJzY2FsYXJMZSIsInNjYWxhckd0Iiwic2NhbGFyR2UiLCJzY2FsYXJJbiIsImluY2x1ZGVzIiwic2NhbGFyTm90SW4iLCJzY2FsYXJPcHMiLCJlcSIsIm5lIiwibHQiLCJsZSIsImd0IiwiZ2UiLCJub3RJbiIsImNyZWF0ZVNjYWxhciIsInJlc29sdmVCaWdVSW50IiwicHJlZml4TGVuZ3RoIiwidW5kZWZpbmVkIiwic3Vic3RyIiwiY29udmVydEJpZ1VJbnQiLCJoZXgiLCJCaWdJbnQiLCJsZW4iLCJtaXNzaW5nWmVyb3MiLCJwcmVmaXgiLCJyZXBlYXQiLCJjcmVhdGVCaWdVSW50IiwiY29udmVydGVkIiwieCIsInNjYWxhciIsImJpZ1VJbnQxIiwiYmlnVUludDIiLCJzdHJ1Y3QiLCJmaWVsZHMiLCJpc0NvbGxlY3Rpb24iLCJmaWVsZE5hbWUiLCJhcnJheSIsIml0ZW1UeXBlIiwib3BzIiwiYWxsIiwiaXRlbVFsIiwiZmFpbGVkSW5kZXgiLCJmaW5kSW5kZXgiLCJhbnkiLCJzdWNjZWVkZWRJbmRleCIsImNyZWF0ZUVudW1OYW1lc01hcCIsIm5hbWVzIiwiTWFwIiwic2V0IiwiTnVtYmVyIiwicGFyc2VJbnQiLCJlbnVtTmFtZSIsIm9uRmllbGQiLCJyZXNvbHZlVmFsdWUiLCJFcnJvciIsIm9uX3BhdGgiLCJzcGxpdCIsInNsaWNlIiwiY29uY2F0IiwicmVzb2x2ZWQiLCJjcmVhdGVFbnVtTmFtZVJlc29sdmVyIiwiZ2V0IiwicmVmQ29sbGVjdGlvbiIsInJlZlR5cGUiLCJhbGlhcyIsInJlcGxhY2UiLCJyZWZRbCIsImpvaW5BcnJheSIsInJlZkZpbHRlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0FBcUJBOzs7SUFHYUEsTzs7O0FBSVQscUJBQWM7QUFBQTtBQUFBO0FBQUE7QUFDVixTQUFLQyxLQUFMLEdBQWEsQ0FBYjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0g7Ozs7NEJBRU87QUFDSixXQUFLRCxLQUFMLEdBQWEsQ0FBYjtBQUNBLFdBQUtDLE1BQUwsR0FBYyxFQUFkO0FBQ0g7Ozt3QkFFR0MsSyxFQUFvQjtBQUNwQixXQUFLRixLQUFMLElBQWMsQ0FBZDtBQUNBLFVBQU1HLElBQUksY0FBTyxLQUFLSCxLQUFMLENBQVdJLFFBQVgsRUFBUCxDQUFWO0FBQ0EsV0FBS0gsTUFBTCxDQUFZRSxJQUFaLElBQW9CRCxLQUFwQjtBQUNBLGFBQU9DLElBQVA7QUFDSDs7OztBQUdMOzs7Ozs7OztBQXlCQTs7Ozs7Ozs7O0FBU0EsU0FBU0UsUUFBVCxDQUNJQyxJQURKLEVBRUlDLE1BRkosRUFHSUMsVUFISixFQUlJQyxPQUpKLEVBS1U7QUFDTixNQUFNQyxVQUFvQixHQUFHLEVBQTdCO0FBQ0FDLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlTCxNQUFmLEVBQXVCTSxPQUF2QixDQUErQixn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QUFBLEVBREcsY0FDQWQsTUFEQSxFQUNRcEIsSUFEUixFQUNjQyxNQURkLEVBQ3NCO0FBQ3JCLFVBQU0wRyxTQUFTLEdBQUcxRyxNQUFNLENBQUM2RSxHQUFQLElBQWM3RSxNQUFNLENBQUNpRixHQUF2QztBQUNBLFVBQU1KLEdBQUcsR0FBRyxDQUFDLENBQUM3RSxNQUFNLENBQUM2RSxHQUFyQjtBQUNBLFVBQU1nQixPQUFPLEdBQUc5RixJQUFJLENBQUMrRixLQUFMLENBQVcsR0FBWCxFQUFnQkMsS0FBaEIsQ0FBc0IsQ0FBdEIsRUFBeUIsQ0FBQyxDQUExQixFQUE2QkMsTUFBN0IsQ0FBb0NOLE9BQXBDLEVBQTZDN0QsSUFBN0MsQ0FBa0QsR0FBbEQsQ0FBaEI7QUFDQSxVQUFNeUUsS0FBSyxhQUFNVCxPQUFPLENBQUNVLE9BQVIsQ0FBZ0IsR0FBaEIsRUFBcUIsR0FBckIsQ0FBTixDQUFYO0FBQ0EsVUFBTUMsS0FBSyxHQUFHSCxPQUFPLENBQUNwRSxFQUFSLENBQVdkLE1BQVgsRUFBbUJtRixLQUFuQixFQUEwQkksU0FBMUIsQ0FBZDtBQUNBLGlEQUNjYixPQURkLDJFQUdjUyxLQUhkLGlCQUcwQkYsYUFIMUIsMkNBSWtCRSxLQUpsQixzQkFJbUNULE9BSm5DLG9CQUlvRFcsS0FKcEQsb0NBS1UsQ0FBQzNCLEdBQUQsR0FBTyxTQUFQLEdBQW1CLEVBTDdCLCtEQU9RQSxHQUFHLHVCQUFnQmdCLE9BQWhCLFNBQTZCLEtBUHhDO0FBUUgsS0FmRTtBQWdCSDNELElBQUFBLElBQUksRUFBRW1FLE9BQU8sQ0FBQ25FO0FBaEJYLEdBQVA7QUFrQkgiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cblxuZGVjbGFyZSBmdW5jdGlvbiBCaWdJbnQoYTogYW55KTogYW55O1xuXG4vKipcbiAqIFF1ZXJ5IHBhcmFtZXRlcnNcbiAqL1xuZXhwb3J0IGNsYXNzIFFQYXJhbXMge1xuICAgIHZhbHVlczogeyBbc3RyaW5nXTogYW55IH07XG4gICAgY291bnQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgfVxuXG4gICAgYWRkKHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBgdiR7dGhpcy5jb3VudC50b1N0cmluZygpfWA7XG4gICAgICAgIHRoaXMudmFsdWVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIHJldHVybiBuYW1lO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBpbnRlcmZhY2UgZm9yIG9iamVjdHMgdGhhdCBhY3RzIGFzIGEgaGVscGVycyB0byBwZXJmb3JtIHF1ZXJpZXMgb3ZlciBkb2N1bWVudHNcbiAqIHVzaW5nIHF1ZXJ5IGZpbHRlcnMuXG4gKi9cbnR5cGUgUVR5cGUgPSB7XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIGFuIEFyYW5nbyBRTCBjb25kaXRpb24gZm9yIHNwZWNpZmllZCBmaWVsZCBiYXNlZCBvbiBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqIFRoZSBjb25kaXRpb24gbXVzdCBiZSBhIHN0cmluZyBleHByZXNzaW9uIHRoYXQgZXZhbHVhdGVzIHRvIGJvb2xlYW4uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIGZyb20gZG9jdW1lbnQgcm9vdCB0byBjb25jcmV0ZSBmaWVsZFxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoaXMgZmllbGRcbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IEFyYW5nbyBRTCBjb25kaXRpb24gdGV4dFxuICAgICAqL1xuICAgIHFsOiAocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KSA9PiBzdHJpbmcsXG4gICAgLyoqXG4gICAgICogVGVzdHMgdmFsdWUgaW4gZG9jdW1lbnQgZnJvbSBBcmFuZ28gREIgYWdhaW5zdCBzcGVjaWZpZWQgZmlsdGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHthbnl9IHZhbHVlIFZhbHVlIHRoYXQgbXVzdCBiZSB0ZXN0ZWQgYWdhaW5zdCBmaWx0ZXJcbiAgICAgKiBAcGFyYW0ge2FueX0gZmlsdGVyIEZpbHRlciB1c2VkIHRvIHRlc3QgYSB2YWx1ZVxuICAgICAqIEByZXR1cm4gdHJ1ZSBpZiB2YWx1ZSBtYXRjaGVzIGZpbHRlclxuICAgICAqL1xuICAgIHRlc3Q6IChwYXJlbnQ6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpID0+IGJvb2xlYW4sXG59XG5cblxuLyoqXG4gKiBHZW5lcmF0ZXMgQVFMIGNvbmRpdGlvbiBmb3IgY29tcGxleCBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHBhdGggUGF0aCB0byBkb2N1bWVudCBmaWVsZC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWx0ZXIgQSBmaWx0ZXIgb2JqZWN0IHNwZWNpZmllZCBieSB1c2VyLlxuICogQHBhcmFtIHtvYmplY3R9IGZpZWxkVHlwZXMgQSBtYXAgb2YgYXZhaWxhYmxlIHZhbHVlcyBmb3IgZmlsdGVyIGZpZWxkcyB0byBoZWxwZXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gcWxGaWVsZCBGdW5jdGlvbiB0aGF0IGdlbmVyYXRlcyBjb25kaXRpb24gZm9yIGEgY29uY3JldGUgZmllbGQuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEFRTCBjb25kaXRpb25cbiAqL1xuZnVuY3Rpb24gcWxGaWVsZHMoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZpbHRlcjogYW55LFxuICAgIGZpZWxkVHlwZXM6IHsgW3N0cmluZ106IFFUeXBlIH0sXG4gICAgcWxGaWVsZDogKGZpZWxkOiBhbnksIHBhdGg6IHN0cmluZywgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkVHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHFsRmllbGQoZmllbGRUeXBlLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG4vKipcbiAqIFRlc3QgZG9jdW1lbnQgdmFsdWUgYWdhaW5zdCBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgb2YgdGhlIGZpZWxkIGluIGRvY3VtZW50LlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSB0ZXN0RmllbGQgRnVuY3Rpb24gdGhhdCBwZXJmb3JtcyB0ZXN0IHZhbHVlIGFnYWluc3QgYSBzZWxlY3RlZCBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiB0ZXN0RmllbGRzKFxuICAgIHZhbHVlOiBhbnksXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICB0ZXN0RmllbGQ6IChmaWVsZFR5cGU6IGFueSwgdmFsdWU6IGFueSwgZmlsdGVyS2V5OiBzdHJpbmcsIGZpbHRlclZhbHVlOiBhbnkpID0+IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkVHlwZSA9IGZpZWxkVHlwZXNbZmlsdGVyS2V5XTtcbiAgICAgICAgcmV0dXJuICEoZmllbGRUeXBlICYmIHRlc3RGaWVsZChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cblxuZnVuY3Rpb24gY29tYmluZShwYXRoOiBzdHJpbmcsIGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4ga2V5ICE9PSAnJyA/IGAke3BhdGh9LiR7a2V5fWAgOiBwYXRoO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuXG4gICAgLypcbiAgICAgKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICAgICAqIEZvciBleGFtcGxlIHRoaXMgcXVlcnk6XG4gICAgICogYGBgRk9SIGRvYyBJTiBhY2NvdW50cyBGSUxURVIgZG9jLl9rZXkgPj0gXCJmZlwiIFJFVFVSTiBkb2MuX2tleWBgYGBcbiAgICAgKiBXaWxsIHJldHVybjpcbiAgICAgKiBgYGBbXCJmZTAzMzE4MTYxOTM3ZWJiMzY4MmY2OWFjOWY5N2JlYWZiYzRiOWVlNmUxZjg2ZDU5ZTFiZjhkMjdhYjg0ODY3XCJdYGBgXG4gICAgICovXG4gICAgY29uc3QgaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPSBwYXRoLmVuZHNXaXRoKCcuX2tleScpICYmIG9wICE9PSAnPT0nICYmIG9wICE9PSAnIT0nO1xuICAgIGNvbnN0IGZpeGVkUGF0aCA9IGlzS2V5T3JkZXJlZENvbXBhcmlzaW9uID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xuICAgIGNvbnN0IGZpeGVkVmFsdWUgPSBgQCR7cGFyYW1OYW1lfWA7XG4gICAgcmV0dXJuIGAke2ZpeGVkUGF0aH0gJHtvcH0gJHtmaXhlZFZhbHVlfWA7XG59XG5cbmZ1bmN0aW9uIHFsQ29tYmluZShjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gcWxJbihwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnMgPSBmaWx0ZXIubWFwKHZhbHVlID0+IHFsT3AocGFyYW1zLCBwYXRoLCAnPT0nLCB2YWx1ZSkpO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ09SJywgJ2ZhbHNlJyk7XG59XG5cbi8vIFNjYWxhcnNcblxuY29uc3Qgc2NhbGFyRXE6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtczogUVBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz09JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnIT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzw9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz49JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpfSlgO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH1cbn07XG5cbmNvbnN0IHNjYWxhck9wcyA9IHtcbiAgICBlcTogc2NhbGFyRXEsXG4gICAgbmU6IHNjYWxhck5lLFxuICAgIGx0OiBzY2FsYXJMdCxcbiAgICBsZTogc2NhbGFyTGUsXG4gICAgZ3Q6IHNjYWxhckd0LFxuICAgIGdlOiBzY2FsYXJHZSxcbiAgICBpbjogc2NhbGFySW4sXG4gICAgbm90SW46IHNjYWxhck5vdEluLFxufTtcblxuZnVuY3Rpb24gY3JlYXRlU2NhbGFyKCk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJylcbiAgICAgICAgPyBgMHgke3ZhbHVlLnRvU3RyaW5nKDE2KX1gXG4gICAgICAgIDogYDB4JHt2YWx1ZS50b1N0cmluZygpLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IGhleC5sZW5ndGgudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5jb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5jb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8gU3RydWN0c1xuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmUocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gYXJyYXkoaXRlbVR5cGU6IFFUeXBlKTogUVR5cGUge1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8gSm9pbnNcblxuZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVmVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiByZWZUeXBlLnRlc3QsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gam9pbkFycmF5KG9uRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZWZUeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHJlZlR5cGUudGVzdCxcbiAgICB9O1xufVxuXG5leHBvcnQge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBjb252ZXJ0QmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXlcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlXG59XG5cbiJdfQ==