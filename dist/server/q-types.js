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
/*
 * Following TO_STRING cast required due to specific comparision of _key fields in Arango
 * For example this query:
 * ```FOR doc IN accounts FILTER doc._key >= "ff" RETURN doc._key````
 * Will return:
 * ```["fe03318161937ebb3682f69ac9f97beafbc4b9ee6e1f86d59e1bf8d27ab84867"]```
 */


function fixKeyPath(path) {
  return path.endsWith('._key') ? "TO_STRING(".concat(path, ")") : path;
}

function qlOp(params, path, op, filter) {
  var paramName = params.add(filter);
  return "".concat(fixKeyPath(path), " ").concat(op, " @").concat(paramName);
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
    return qlOp(params, fixKeyPath(path), '==', value);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9xLXR5cGVzLmpzIl0sIm5hbWVzIjpbIlFQYXJhbXMiLCJjb3VudCIsInZhbHVlcyIsInZhbHVlIiwibmFtZSIsInRvU3RyaW5nIiwicWxGaWVsZHMiLCJwYXRoIiwiZmlsdGVyIiwiZmllbGRUeXBlcyIsInFsRmllbGQiLCJjb25kaXRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkVHlwZSIsInB1c2giLCJxbENvbWJpbmUiLCJ0ZXN0RmllbGRzIiwidGVzdEZpZWxkIiwiZmFpbGVkIiwiZmluZCIsImNvbWJpbmUiLCJrZXkiLCJmaXhLZXlQYXRoIiwiZW5kc1dpdGgiLCJxbE9wIiwicGFyYW1zIiwib3AiLCJwYXJhbU5hbWUiLCJhZGQiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImxlbmd0aCIsImpvaW4iLCJxbEluIiwibWFwIiwic2NhbGFyRXEiLCJxbCIsInRlc3QiLCJwYXJlbnQiLCJzY2FsYXJOZSIsInNjYWxhckx0Iiwic2NhbGFyTGUiLCJzY2FsYXJHdCIsInNjYWxhckdlIiwic2NhbGFySW4iLCJpbmNsdWRlcyIsInNjYWxhck5vdEluIiwic2NhbGFyT3BzIiwiZXEiLCJuZSIsImx0IiwibGUiLCJndCIsImdlIiwibm90SW4iLCJjcmVhdGVTY2FsYXIiLCJyZXNvbHZlQmlnVUludCIsInByZWZpeExlbmd0aCIsInVuZGVmaW5lZCIsInN1YnN0ciIsImNvbnZlcnRCaWdVSW50IiwiaGV4IiwiQmlnSW50IiwibGVuIiwibWlzc2luZ1plcm9zIiwicHJlZml4IiwicmVwZWF0IiwiY3JlYXRlQmlnVUludCIsImNvbnZlcnRlZCIsIngiLCJzY2FsYXIiLCJiaWdVSW50MSIsImJpZ1VJbnQyIiwic3RydWN0IiwiZmllbGRzIiwiaXNDb2xsZWN0aW9uIiwiZmllbGROYW1lIiwiYXJyYXkiLCJpdGVtVHlwZSIsIm9wcyIsImFsbCIsIml0ZW1RbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwiYW55Iiwic3VjY2VlZGVkSW5kZXgiLCJjcmVhdGVFbnVtTmFtZXNNYXAiLCJuYW1lcyIsIk1hcCIsInNldCIsIk51bWJlciIsInBhcnNlSW50IiwiZW51bU5hbWUiLCJvbkZpZWxkIiwicmVzb2x2ZVZhbHVlIiwiRXJyb3IiLCJvbl9wYXRoIiwic3BsaXQiLCJzbGljZSIsImNvbmNhdCIsInJlc29sdmVkIiwiY3JlYXRlRW51bU5hbWVSZXNvbHZlciIsImdldCIsInJlZkNvbGxlY3Rpb24iLCJyZWZUeXBlIiwiYWxpYXMiLCJyZXBsYWNlIiwicmVmUWwiLCJqb2luQXJyYXkiLCJyZWZGaWx0ZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7OztBQXFCQTs7O0lBR2FBLE87OztBQUlULHFCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBS0MsS0FBTCxHQUFhLENBQWI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsRUFBZDtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBS0QsS0FBTCxHQUFhLENBQWI7QUFDQSxXQUFLQyxNQUFMLEdBQWMsRUFBZDtBQUNIOzs7d0JBRUdDLEssRUFBb0I7QUFDcEIsV0FBS0YsS0FBTCxJQUFjLENBQWQ7QUFDQSxVQUFNRyxJQUFJLGNBQU8sS0FBS0gsS0FBTCxDQUFXSSxRQUFYLEVBQVAsQ0FBVjtBQUNBLFdBQUtILE1BQUwsQ0FBWUUsSUFBWixJQUFvQkQsS0FBcEI7QUFDQSxhQUFPQyxJQUFQO0FBQ0g7Ozs7QUFHTDs7Ozs7Ozs7QUF5QkE7Ozs7Ozs7OztBQVNBLFNBQVNFLFFBQVQsQ0FDSUMsSUFESixFQUVJQyxNQUZKLEVBR0lDLFVBSEosRUFJSUMsT0FKSixFQUtVO0FBQ04sTUFBTUMsVUFBb0IsR0FBRyxFQUE3QjtBQUNBQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUwsTUFBZixFQUF1Qk0sT0FBdkIsQ0FBK0IsZ0JBQThCO0FBQUE7QUFBQSxRQUE1QkMsU0FBNEI7QUFBQSxRQUFq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Q0FBQzJFLEdBQVAsSUFBYzNFLE1BQU0sQ0FBQytFLEdBQXZDO0FBQ0EsVUFBTUosR0FBRyxHQUFHLENBQUMsQ0FBQzNFLE1BQU0sQ0FBQzJFLEdBQXJCO0FBQ0EsVUFBTWdCLE9BQU8sR0FBRzVGLElBQUksQ0FBQzZGLEtBQUwsQ0FBVyxHQUFYLEVBQWdCQyxLQUFoQixDQUFzQixDQUF0QixFQUF5QixDQUFDLENBQTFCLEVBQTZCQyxNQUE3QixDQUFvQ04sT0FBcEMsRUFBNkM3RCxJQUE3QyxDQUFrRCxHQUFsRCxDQUFoQjtBQUNBLFVBQU15RSxLQUFLLGFBQU1ULE9BQU8sQ0FBQ1UsT0FBUixDQUFnQixHQUFoQixFQUFxQixHQUFyQixDQUFOLENBQVg7QUFDQSxVQUFNQyxLQUFLLEdBQUdILE9BQU8sQ0FBQ3BFLEVBQVIsQ0FBV1YsTUFBWCxFQUFtQitFLEtBQW5CLEVBQTBCSSxTQUExQixDQUFkO0FBQ0EsaURBQ2NiLE9BRGQsMkVBR2NTLEtBSGQsaUJBRzBCRixhQUgxQiwyQ0FJa0JFLEtBSmxCLHNCQUltQ1QsT0FKbkMsb0JBSW9EVyxLQUpwRCxvQ0FLVSxDQUFDM0IsR0FBRCxHQUFPLFNBQVAsR0FBbUIsRUFMN0IsK0RBT1FBLEdBQUcsdUJBQWdCZ0IsT0FBaEIsU0FBNkIsS0FQeEM7QUFRSCxLQWZFO0FBZ0JIM0QsSUFBQUEsSUFBSSxFQUFFbUUsT0FBTyxDQUFDbkU7QUFoQlgsR0FBUDtBQWtCSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgcWw6IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBxbEZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2gocWxGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhblxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuXG5mdW5jdGlvbiBjb21iaW5lKHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBrZXkgIT09ICcnID8gYCR7cGF0aH0uJHtrZXl9YCA6IHBhdGg7XG59XG5cbi8qXG4gKiBGb2xsb3dpbmcgVE9fU1RSSU5HIGNhc3QgcmVxdWlyZWQgZHVlIHRvIHNwZWNpZmljIGNvbXBhcmlzaW9uIG9mIF9rZXkgZmllbGRzIGluIEFyYW5nb1xuICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAqIGBgYEZPUiBkb2MgSU4gYWNjb3VudHMgRklMVEVSIGRvYy5fa2V5ID49IFwiZmZcIiBSRVRVUk4gZG9jLl9rZXlgYGBgXG4gKiBXaWxsIHJldHVybjpcbiAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAqL1xuZnVuY3Rpb24gZml4S2V5UGF0aChwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBwYXRoLmVuZHNXaXRoKCcuX2tleScpID8gYFRPX1NUUklORygke3BhdGh9KWAgOiBwYXRoO1xufVxuXG5mdW5jdGlvbiBxbE9wKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFyYW1OYW1lID0gcGFyYW1zLmFkZChmaWx0ZXIpO1xuICAgIHJldHVybiBgJHtmaXhLZXlQYXRoKHBhdGgpfSAke29wfSBAJHtwYXJhbU5hbWV9YDtcbn1cblxuZnVuY3Rpb24gcWxDb21iaW5lKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBxbEluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gcWxPcChwYXJhbXMsIGZpeEtleVBhdGgocGF0aCksICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8gU2NhbGFyc1xuXG5jb25zdCBzY2FsYXJFcTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zOiBRUGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPD0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGBOT1QgKCR7cWxJbihwYXJhbXMsIHBhdGgsIGZpbHRlcil9KWA7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfVxufTtcblxuY29uc3Qgc2NhbGFyT3BzID0ge1xuICAgIGVxOiBzY2FsYXJFcSxcbiAgICBuZTogc2NhbGFyTmUsXG4gICAgbHQ6IHNjYWxhckx0LFxuICAgIGxlOiBzY2FsYXJMZSxcbiAgICBndDogc2NhbGFyR3QsXG4gICAgZ2U6IHNjYWxhckdlLFxuICAgIGluOiBzY2FsYXJJbixcbiAgICBub3RJbjogc2NhbGFyTm90SW4sXG59O1xuXG5mdW5jdGlvbiBjcmVhdGVTY2FsYXIoKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKVxuICAgICAgICA/IGAweCR7dmFsdWUudG9TdHJpbmcoMTYpfWBcbiAgICAgICAgOiBgMHgke3ZhbHVlLnRvU3RyaW5nKCkuc3Vic3RyKHByZWZpeExlbmd0aCl9YDtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoOiBudW1iZXIsIHZhbHVlOiBhbnkpOiBzdHJpbmcge1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gICAgY29uc3QgaGV4ID0gQmlnSW50KHZhbHVlKS50b1N0cmluZygxNik7XG4gICAgY29uc3QgbGVuID0gaGV4Lmxlbmd0aC50b1N0cmluZygxNik7XG4gICAgY29uc3QgbWlzc2luZ1plcm9zID0gcHJlZml4TGVuZ3RoIC0gbGVuLmxlbmd0aDtcbiAgICBjb25zdCBwcmVmaXggPSBtaXNzaW5nWmVyb3MgPiAwID8gYCR7JzAnLnJlcGVhdChtaXNzaW5nWmVyb3MpfSR7bGVufWAgOiBsZW47XG4gICAgcmV0dXJuIGAke3ByZWZpeH0ke2hleH1gO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnZlcnRlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHggPT4gY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCB4KSlcbiAgICAgICAgICAgICAgICAgICAgOiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBjb252ZXJ0ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmNvbnN0IHNjYWxhcjogUVR5cGUgPSBjcmVhdGVTY2FsYXIoKTtcbmNvbnN0IGJpZ1VJbnQxOiBRVHlwZSA9IGNyZWF0ZUJpZ1VJbnQoMSk7XG5jb25zdCBiaWdVSW50MjogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDIpO1xuXG4vLyBTdHJ1Y3RzXG5cbmZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IFFUeXBlIH0sIGlzQ29sbGVjdGlvbj86IGJvb2xlYW4pOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIGZpZWxkcywgKGZpZWxkVHlwZSwgcGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnFsKHBhcmFtcywgY29tYmluZShwYXRoLCBmaWVsZE5hbWUpLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGROYW1lID0gaXNDb2xsZWN0aW9uICYmIChmaWx0ZXJLZXkgPT09ICdpZCcpID8gJ19rZXknIDogZmlsdGVyS2V5O1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZFR5cGUudGVzdCh2YWx1ZSwgdmFsdWVbZmllbGROYW1lXSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEFycmF5c1xuXG5mdW5jdGlvbiBhcnJheShpdGVtVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgY29uc3Qgb3BzID0ge1xuICAgICAgICBhbGw6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA9PSBMRU5HVEgoJHtwYXRofSlgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBhbnk6IHtcbiAgICAgICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVFsID0gaXRlbVR5cGUucWwocGFyYW1zLCAnQ1VSUkVOVCcsIGZpbHRlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiBpdGVtVHlwZS50ZXN0KHBhcmVudCwgeCwgZmlsdGVyKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgb3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBvcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy8gRW51bSBOYW1lc1xuXG5mdW5jdGlvbiBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IE1hcDxudW1iZXIsIHN0cmluZz4ge1xuICAgIGNvbnN0IG5hbWVzOiBNYXA8bnVtYmVyLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICAgIE9iamVjdC5lbnRyaWVzKHZhbHVlcykuZm9yRWFjaCgoW25hbWUsIHZhbHVlXSkgPT4ge1xuICAgICAgICBuYW1lcy5zZXQoTnVtYmVyLnBhcnNlSW50KCh2YWx1ZTogYW55KSksIG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBuYW1lcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVudW1OYW1lKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IFFUeXBlIHtcbiAgICBjb25zdCByZXNvbHZlVmFsdWUgPSAobmFtZSkgPT4ge1xuICAgICAgICBsZXQgdmFsdWUgPSB2YWx1ZXNbbmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgdmFsdWUgWyR7bmFtZX1dIGZvciAke29uRmllbGR9X25hbWVgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKG9uX3BhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXNvbHZlZCA9IChvcCA9PT0gc2NhbGFyT3BzLmluIHx8IG9wID09PSBzY2FsYXJPcHMubm90SW4pXG4gICAgICAgICAgICAgICAgICAgID8gZmlsdGVyVmFsdWUubWFwKHJlc29sdmVWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgOiByZXNvbHZlVmFsdWUoZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXJhbXMsIHBhdGgsIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHBhcmVudFtvbkZpZWxkXSwgcmVzb2x2ZWQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIob25GaWVsZDogc3RyaW5nLCB2YWx1ZXM6IHsgW3N0cmluZ106IG51bWJlciB9KTogKHBhcmVudCkgPT4gP3N0cmluZyB7XG4gICAgY29uc3QgbmFtZXMgPSBjcmVhdGVFbnVtTmFtZXNNYXAodmFsdWVzKTtcbiAgICByZXR1cm4gKHBhcmVudCkgPT4ge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcmVudFtvbkZpZWxkXTtcbiAgICAgICAgY29uc3QgbmFtZSA9IG5hbWVzLmdldCh2YWx1ZSk7XG4gICAgICAgIHJldHVybiBuYW1lICE9PSB1bmRlZmluZWQgPyBuYW1lIDogbnVsbDtcbiAgICB9O1xufVxuXG4vLyBKb2luc1xuXG5mdW5jdGlvbiBqb2luKG9uRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZWZUeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIGZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIExFTkdUSChcbiAgICAgICAgICAgICAgICAgICAgRk9SICR7YWxpYXN9IElOICR7cmVmQ29sbGVjdGlvbn1cbiAgICAgICAgICAgICAgICAgICAgRklMVEVSICgke2FsaWFzfS5fa2V5ID09ICR7b25fcGF0aH0pIEFORCAoJHtyZWZRbH0pXG4gICAgICAgICAgICAgICAgICAgIExJTUlUIDFcbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApID4gMGA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHJlZlR5cGUudGVzdCxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBqb2luQXJyYXkob25GaWVsZDogc3RyaW5nLCByZWZDb2xsZWN0aW9uOiBzdHJpbmcsIHJlZlR5cGU6IFFUeXBlKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICBjb25zdCByZWZGaWx0ZXIgPSBmaWx0ZXIuYWxsIHx8IGZpbHRlci5hbnk7XG4gICAgICAgICAgICBjb25zdCBhbGwgPSAhIWZpbHRlci5hbGw7XG4gICAgICAgICAgICBjb25zdCBvbl9wYXRoID0gcGF0aC5zcGxpdCgnLicpLnNsaWNlKDAsIC0xKS5jb25jYXQob25GaWVsZCkuam9pbignLicpO1xuICAgICAgICAgICAgY29uc3QgYWxpYXMgPSBgJHtvbl9wYXRoLnJlcGxhY2UoJy4nLCAnXycpfWA7XG4gICAgICAgICAgICBjb25zdCByZWZRbCA9IHJlZlR5cGUucWwocGFyYW1zLCBhbGlhcywgcmVmRmlsdGVyKTtcbiAgICAgICAgICAgIHJldHVybiBgXG4gICAgICAgICAgICAgICAgKExFTkdUSCgke29uX3BhdGh9KSA+IDApXG4gICAgICAgICAgICAgICAgQU5EIChMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSBJTiAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICAkeyFhbGwgPyAnTElNSVQgMScgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgUkVUVVJOIDFcbiAgICAgICAgICAgICAgICApICR7YWxsID8gYD09IExFTkdUSCgke29uX3BhdGh9KWAgOiAnPiAwJ30pYDtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdDogcmVmVHlwZS50ZXN0LFxuICAgIH07XG59XG5cbmV4cG9ydCB7XG4gICAgc2NhbGFyLFxuICAgIGJpZ1VJbnQxLFxuICAgIGJpZ1VJbnQyLFxuICAgIHJlc29sdmVCaWdVSW50LFxuICAgIGNvbnZlcnRCaWdVSW50LFxuICAgIHN0cnVjdCxcbiAgICBhcnJheSxcbiAgICBqb2luLFxuICAgIGpvaW5BcnJheVxufVxuXG5leHBvcnQgdHlwZSB7XG4gICAgUVR5cGVcbn1cblxuIl19