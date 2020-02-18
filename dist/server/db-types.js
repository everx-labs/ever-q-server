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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9kYi10eXBlcy5qcyJdLCJuYW1lcyI6WyJRUGFyYW1zIiwiY291bnQiLCJ2YWx1ZXMiLCJ2YWx1ZSIsIm5hbWUiLCJ0b1N0cmluZyIsInFsRmllbGRzIiwicGF0aCIsImZpbHRlciIsImZpZWxkVHlwZXMiLCJxbEZpZWxkIiwiY29uZGl0aW9ucyIsIk9iamVjdCIsImVudHJpZXMiLCJmb3JFYWNoIiwiZmlsdGVyS2V5IiwiZmlsdGVyVmFsdWUiLCJmaWVsZFR5cGUiLCJwdXNoIiwicWxDb21iaW5lIiwidGVzdEZpZWxkcyIsInRlc3RGaWVsZCIsImZhaWxlZCIsImZpbmQiLCJjb21iaW5lIiwia2V5IiwicWxPcCIsInBhcmFtcyIsIm9wIiwicGFyYW1OYW1lIiwiYWRkIiwiaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24iLCJlbmRzV2l0aCIsImZpeGVkUGF0aCIsImZpeGVkVmFsdWUiLCJkZWZhdWx0Q29uZGl0aW9ucyIsImxlbmd0aCIsImpvaW4iLCJxbEluIiwibWFwIiwidW5kZWZpbmVkVG9OdWxsIiwidiIsInVuZGVmaW5lZCIsInNjYWxhckVxIiwicWwiLCJ0ZXN0IiwicGFyZW50Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhck9wcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsIm5vdEluIiwiY3JlYXRlU2NhbGFyIiwicmVzb2x2ZUJpZ1VJbnQiLCJwcmVmaXhMZW5ndGgiLCJzdWJzdHIiLCJjb252ZXJ0QmlnVUludCIsImhleCIsIkJpZ0ludCIsImxlbiIsIm1pc3NpbmdaZXJvcyIsInByZWZpeCIsInJlcGVhdCIsImNyZWF0ZUJpZ1VJbnQiLCJjb252ZXJ0ZWQiLCJ4Iiwic2NhbGFyIiwiYmlnVUludDEiLCJiaWdVSW50MiIsInN0cnVjdCIsImZpZWxkcyIsImlzQ29sbGVjdGlvbiIsImZpZWxkTmFtZSIsImFycmF5IiwiaXRlbVR5cGUiLCJvcHMiLCJhbGwiLCJpdGVtUWwiLCJmYWlsZWRJbmRleCIsImZpbmRJbmRleCIsImFueSIsInN1Y2NlZWRlZEluZGV4IiwiY3JlYXRlRW51bU5hbWVzTWFwIiwibmFtZXMiLCJNYXAiLCJzZXQiLCJOdW1iZXIiLCJwYXJzZUludCIsImVudW1OYW1lIiwib25GaWVsZCIsInJlc29sdmVWYWx1ZSIsIkVycm9yIiwib25fcGF0aCIsInNwbGl0Iiwic2xpY2UiLCJjb25jYXQiLCJyZXNvbHZlZCIsImNyZWF0ZUVudW1OYW1lUmVzb2x2ZXIiLCJnZXQiLCJyZWZDb2xsZWN0aW9uIiwicmVmVHlwZSIsImFsaWFzIiwicmVwbGFjZSIsInJlZlFsIiwiam9pbkFycmF5IiwicmVmRmlsdGVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkE7OztJQUdhQSxPOzs7QUFJVCxxQkFBYztBQUFBO0FBQUE7QUFBQTtBQUNWLFNBQUtDLEtBQUwsR0FBYSxDQUFiO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLEVBQWQ7QUFDSDs7Ozs0QkFFTztBQUNKLFdBQUtELEtBQUwsR0FBYSxDQUFiO0FBQ0EsV0FBS0MsTUFBTCxHQUFjLEVBQWQ7QUFDSDs7O3dCQUVHQyxLLEVBQW9CO0FBQ3BCLFdBQUtGLEtBQUwsSUFBYyxDQUFkO0FBQ0EsVUFBTUcsSUFBSSxjQUFPLEtBQUtILEtBQUwsQ0FBV0ksUUFBWCxFQUFQLENBQVY7QUFDQSxXQUFLSCxNQUFMLENBQVlFLElBQVosSUFBb0JELEtBQXBCO0FBQ0EsYUFBT0MsSUFBUDtBQUNIOzs7O0FBR0w7Ozs7Ozs7O0FBeUJBOzs7Ozs7Ozs7QUFTQSxTQUFTRSxRQUFULENBQ0lDLElBREosRUFFSUMsTUFGSixFQUdJQyxVQUhKLEVBSUlDLE9BSkosRUFLVTtBQUNOLE1BQU1DLFVBQW9CLEdBQUcsRUFBN0I7QUFDQUMsRUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWVMLE1B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N0IsK0RBT1FBLEdBQUcsdUJBQWdCZ0IsT0FBaEIsU0FBNkIsS0FQeEM7QUFRSCxLQWZFO0FBZ0JIMUQsSUFBQUEsSUFBSSxFQUFFa0UsT0FBTyxDQUFDbEU7QUFoQlgsR0FBUDtBQWtCSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuXG5kZWNsYXJlIGZ1bmN0aW9uIEJpZ0ludChhOiBhbnkpOiBhbnk7XG5cbi8qKlxuICogUXVlcnkgcGFyYW1ldGVyc1xuICovXG5leHBvcnQgY2xhc3MgUVBhcmFtcyB7XG4gICAgdmFsdWVzOiB7IFtzdHJpbmddOiBhbnkgfTtcbiAgICBjb3VudDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgICAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy52YWx1ZXMgPSB7fTtcbiAgICB9XG5cbiAgICBhZGQodmFsdWU6IGFueSk6IHN0cmluZyB7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGB2JHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YDtcbiAgICAgICAgdGhpcy52YWx1ZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIG5hbWU7XG4gICAgfVxufVxuXG4vKipcbiAqIEFic3RyYWN0IGludGVyZmFjZSBmb3Igb2JqZWN0cyB0aGF0IGFjdHMgYXMgYSBoZWxwZXJzIHRvIHBlcmZvcm0gcXVlcmllcyBvdmVyIGRvY3VtZW50c1xuICogdXNpbmcgcXVlcnkgZmlsdGVycy5cbiAqL1xudHlwZSBRVHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBHZW5lcmF0ZXMgYW4gQXJhbmdvIFFMIGNvbmRpdGlvbiBmb3Igc3BlY2lmaWVkIGZpZWxkIGJhc2VkIG9uIHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICogVGhlIGNvbmRpdGlvbiBtdXN0IGJlIGEgc3RyaW5nIGV4cHJlc3Npb24gdGhhdCBldmFsdWF0ZXMgdG8gYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIFBhdGggZnJvbSBkb2N1bWVudCByb290IHRvIGNvbmNyZXRlIGZpZWxkXG4gICAgICogQHBhcmFtIHthbnl9IGZpbHRlciBGaWx0ZXIgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhpcyBmaWVsZFxuICAgICAqIEByZXR1cm4ge3N0cmluZ30gQXJhbmdvIFFMIGNvbmRpdGlvbiB0ZXh0XG4gICAgICovXG4gICAgcWw6IChwYXJhbXM6IFFQYXJhbXMsIHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnkpID0+IHN0cmluZyxcbiAgICAvKipcbiAgICAgKiBUZXN0cyB2YWx1ZSBpbiBkb2N1bWVudCBmcm9tIEFyYW5nbyBEQiBhZ2FpbnN0IHNwZWNpZmllZCBmaWx0ZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2FueX0gdmFsdWUgVmFsdWUgdGhhdCBtdXN0IGJlIHRlc3RlZCBhZ2FpbnN0IGZpbHRlclxuICAgICAqIEBwYXJhbSB7YW55fSBmaWx0ZXIgRmlsdGVyIHVzZWQgdG8gdGVzdCBhIHZhbHVlXG4gICAgICogQHJldHVybiB0cnVlIGlmIHZhbHVlIG1hdGNoZXMgZmlsdGVyXG4gICAgICovXG4gICAgdGVzdDogKHBhcmVudDogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSkgPT4gYm9vbGVhbixcbn1cblxuXG4vKipcbiAqIEdlbmVyYXRlcyBBUUwgY29uZGl0aW9uIGZvciBjb21wbGV4IGZpbHRlci5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBQYXRoIHRvIGRvY3VtZW50IGZpZWxkLlxuICogQHBhcmFtIHtvYmplY3R9IGZpbHRlciBBIGZpbHRlciBvYmplY3Qgc3BlY2lmaWVkIGJ5IHVzZXIuXG4gKiBAcGFyYW0ge29iamVjdH0gZmllbGRUeXBlcyBBIG1hcCBvZiBhdmFpbGFibGUgdmFsdWVzIGZvciBmaWx0ZXIgZmllbGRzIHRvIGhlbHBlcnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBxbEZpZWxkIEZ1bmN0aW9uIHRoYXQgZ2VuZXJhdGVzIGNvbmRpdGlvbiBmb3IgYSBjb25jcmV0ZSBmaWVsZC5cbiAqIEByZXR1cm4ge3N0cmluZ30gQVFMIGNvbmRpdGlvblxuICovXG5mdW5jdGlvbiBxbEZpZWxkcyhcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZmlsdGVyOiBhbnksXG4gICAgZmllbGRUeXBlczogeyBbc3RyaW5nXTogUVR5cGUgfSxcbiAgICBxbEZpZWxkOiAoZmllbGQ6IGFueSwgcGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gc3RyaW5nXG4pOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGRUeXBlKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2gocWxGaWVsZChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbi8qKlxuICogVGVzdCBkb2N1bWVudCB2YWx1ZSBhZ2FpbnN0IGNvbXBsZXggZmlsdGVyLlxuICpcbiAqIEBwYXJhbSB7YW55fSB2YWx1ZSBWYWx1ZSBvZiB0aGUgZmllbGQgaW4gZG9jdW1lbnQuXG4gKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIEEgZmlsdGVyIG9iamVjdCBzcGVjaWZpZWQgYnkgdXNlci5cbiAqIEBwYXJhbSB7b2JqZWN0fSBmaWVsZFR5cGVzIEEgbWFwIG9mIGF2YWlsYWJsZSB2YWx1ZXMgZm9yIGZpbHRlciBmaWVsZHMgdG8gaGVscGVycy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHRlc3RGaWVsZCBGdW5jdGlvbiB0aGF0IHBlcmZvcm1zIHRlc3QgdmFsdWUgYWdhaW5zdCBhIHNlbGVjdGVkIGZpZWxkLlxuICogQHJldHVybiB7c3RyaW5nfSBBUUwgY29uZGl0aW9uXG4gKi9cbmZ1bmN0aW9uIHRlc3RGaWVsZHMoXG4gICAgdmFsdWU6IGFueSxcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBmaWVsZFR5cGVzOiB7IFtzdHJpbmddOiBRVHlwZSB9LFxuICAgIHRlc3RGaWVsZDogKGZpZWxkVHlwZTogYW55LCB2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSkgPT4gYm9vbGVhblxuKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGRUeXBlID0gZmllbGRUeXBlc1tmaWx0ZXJLZXldO1xuICAgICAgICByZXR1cm4gIShmaWVsZFR5cGUgJiYgdGVzdEZpZWxkKGZpZWxkVHlwZSwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuXG5mdW5jdGlvbiBjb21iaW5lKHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBrZXkgIT09ICcnID8gYCR7cGF0aH0uJHtrZXl9YCA6IHBhdGg7XG59XG5cbmZ1bmN0aW9uIHFsT3AocGFyYW1zOiBRUGFyYW1zLCBwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJhbU5hbWUgPSBwYXJhbXMuYWRkKGZpbHRlcik7XG5cbiAgICAvKlxuICAgICAqIEZvbGxvd2luZyBUT19TVFJJTkcgY2FzdCByZXF1aXJlZCBkdWUgdG8gc3BlY2lmaWMgY29tcGFyaXNpb24gb2YgX2tleSBmaWVsZHMgaW4gQXJhbmdvXG4gICAgICogRm9yIGV4YW1wbGUgdGhpcyBxdWVyeTpcbiAgICAgKiBgYGBGT1IgZG9jIElOIGFjY291bnRzIEZJTFRFUiBkb2MuX2tleSA+PSBcImZmXCIgUkVUVVJOIGRvYy5fa2V5YGBgYFxuICAgICAqIFdpbGwgcmV0dXJuOlxuICAgICAqIGBgYFtcImZlMDMzMTgxNjE5MzdlYmIzNjgyZjY5YWM5Zjk3YmVhZmJjNGI5ZWU2ZTFmODZkNTllMWJmOGQyN2FiODQ4NjdcIl1gYGBcbiAgICAgKi9cbiAgICBjb25zdCBpc0tleU9yZGVyZWRDb21wYXJpc2lvbiA9IHBhdGguZW5kc1dpdGgoJy5fa2V5JykgJiYgb3AgIT09ICc9PScgJiYgb3AgIT09ICchPSc7XG4gICAgY29uc3QgZml4ZWRQYXRoID0gaXNLZXlPcmRlcmVkQ29tcGFyaXNpb24gPyBgVE9fU1RSSU5HKCR7cGF0aH0pYCA6IHBhdGg7XG4gICAgY29uc3QgZml4ZWRWYWx1ZSA9IGBAJHtwYXJhbU5hbWV9YDtcbiAgICByZXR1cm4gYCR7Zml4ZWRQYXRofSAke29wfSAke2ZpeGVkVmFsdWV9YDtcbn1cblxuZnVuY3Rpb24gcWxDb21iaW5lKGNvbmRpdGlvbnM6IHN0cmluZ1tdLCBvcDogc3RyaW5nLCBkZWZhdWx0Q29uZGl0aW9uczogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRDb25kaXRpb25zO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIGNvbmRpdGlvbnNbMF07XG4gICAgfVxuICAgIHJldHVybiAnKCcgKyBjb25kaXRpb25zLmpvaW4oYCkgJHtvcH0gKGApICsgJyknO1xufVxuXG5mdW5jdGlvbiBxbEluKHBhcmFtczogUVBhcmFtcywgcGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxuLy8gU2NhbGFyc1xuXG5mdW5jdGlvbiB1bmRlZmluZWRUb051bGwodjogYW55KTogYW55IHtcbiAgICByZXR1cm4gdiAhPT0gdW5kZWZpbmVkID8gdiA6IG51bGw7XG59XG5cbmNvbnN0IHNjYWxhckVxOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXM6IFFQYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTmU6IFFUeXBlID0ge1xuICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhcmFtcywgcGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPCBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckxlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPD0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHdDogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGFyYW1zLCBwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPiBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckdlOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXJhbXMsIHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgPj0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJJbjogUVR5cGUgPSB7XG4gICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGFyYW1zLCBwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5vdEluOiBRVHlwZSA9IHtcbiAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhcmFtcywgcGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiAhZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9XG59O1xuXG5jb25zdCBzY2FsYXJPcHMgPSB7XG4gICAgZXE6IHNjYWxhckVxLFxuICAgIG5lOiBzY2FsYXJOZSxcbiAgICBsdDogc2NhbGFyTHQsXG4gICAgbGU6IHNjYWxhckxlLFxuICAgIGd0OiBzY2FsYXJHdCxcbiAgICBnZTogc2NhbGFyR2UsXG4gICAgaW46IHNjYWxhckluLFxuICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbn07XG5cbmZ1bmN0aW9uIGNyZWF0ZVNjYWxhcigpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVzdEZpZWxkcyh2YWx1ZSwgZmlsdGVyLCBzY2FsYXJPcHMsIChvcCwgdmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdChwYXJlbnQsIHVuZGVmaW5lZFRvTnVsbCh2YWx1ZSksIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJylcbiAgICAgICAgPyBgMHgke3ZhbHVlLnRvU3RyaW5nKDE2KX1gXG4gICAgICAgIDogYDB4JHt2YWx1ZS50b1N0cmluZygpLnN1YnN0cihwcmVmaXhMZW5ndGgpfWA7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aDogbnVtYmVyLCB2YWx1ZTogYW55KTogc3RyaW5nIHtcbiAgICBpZiAodmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICAgIGNvbnN0IGhleCA9IEJpZ0ludCh2YWx1ZSkudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IGxlbiA9IGhleC5sZW5ndGgudG9TdHJpbmcoMTYpO1xuICAgIGNvbnN0IG1pc3NpbmdaZXJvcyA9IHByZWZpeExlbmd0aCAtIGxlbi5sZW5ndGg7XG4gICAgY29uc3QgcHJlZml4ID0gbWlzc2luZ1plcm9zID4gMCA/IGAkeycwJy5yZXBlYXQobWlzc2luZ1plcm9zKX0ke2xlbn1gIDogbGVuO1xuICAgIHJldHVybiBgJHtwcmVmaXh9JHtoZXh9YDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmlnVUludChwcmVmaXhMZW5ndGg6IG51bWJlcik6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHFsRmllbGRzKHBhdGgsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb252ZXJ0ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcCh4ID0+IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgeCkpXG4gICAgICAgICAgICAgICAgICAgIDogY29udmVydEJpZ1VJbnQocHJlZml4TGVuZ3RoLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgY29udmVydGVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgc2NhbGFyT3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udmVydGVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAoeCA9PiBjb252ZXJ0QmlnVUludChwcmVmaXhMZW5ndGgsIHgpKVxuICAgICAgICAgICAgICAgICAgICA6IGNvbnZlcnRCaWdVSW50KHByZWZpeExlbmd0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHBhcmVudCwgdmFsdWUsIGNvbnZlcnRlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufVxuXG5jb25zdCBzY2FsYXI6IFFUeXBlID0gY3JlYXRlU2NhbGFyKCk7XG5jb25zdCBiaWdVSW50MTogUVR5cGUgPSBjcmVhdGVCaWdVSW50KDEpO1xuY29uc3QgYmlnVUludDI6IFFUeXBlID0gY3JlYXRlQmlnVUludCgyKTtcblxuLy8gU3RydWN0c1xuXG5mdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBRVHlwZSB9LCBpc0NvbGxlY3Rpb24/OiBib29sZWFuKTogUVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIHFsKHBhcmFtcywgcGF0aCwgZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gcWxGaWVsZHMocGF0aCwgZmlsdGVyLCBmaWVsZHMsIChmaWVsZFR5cGUsIHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZE5hbWUgPSBpc0NvbGxlY3Rpb24gJiYgKGZpbHRlcktleSA9PT0gJ2lkJykgPyAnX2tleScgOiBmaWx0ZXJLZXk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkVHlwZS5xbChwYXJhbXMsIGNvbWJpbmUocGF0aCwgZmllbGROYW1lKSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgZmllbGRzLCAoZmllbGRUeXBlLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkTmFtZSA9IGlzQ29sbGVjdGlvbiAmJiAoZmlsdGVyS2V5ID09PSAnaWQnKSA/ICdfa2V5JyA6IGZpbHRlcktleTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmllbGRUeXBlLnRlc3QodmFsdWUsIHZhbHVlW2ZpZWxkTmFtZV0sIGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vLyBBcnJheXNcblxuZnVuY3Rpb24gYXJyYXkoaXRlbVR5cGU6IFFUeXBlKTogUVR5cGUge1xuICAgIGNvbnN0IG9wcyA9IHtcbiAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIWl0ZW1UeXBlLnRlc3QocGFyZW50LCB4LCBmaWx0ZXIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgYW55OiB7XG4gICAgICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtTmFtZSA9IGBAdiR7cGFyYW1zLmNvdW50ICsgMX1gO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1RbCA9IGl0ZW1UeXBlLnFsKHBhcmFtcywgJ0NVUlJFTlQnLCBmaWx0ZXIpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtUWwgPT09IGBDVVJSRU5UID09ICR7cGFyYW1OYW1lfWApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke3BhcmFtTmFtZX0gSU4gJHtwYXRofVsqXWA7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPiAwYDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHBhcmVudCwgdmFsdWUsIGZpbHRlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gaXRlbVR5cGUudGVzdChwYXJlbnQsIHgsIGZpbHRlcikpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhwYXRoLCBmaWx0ZXIsIG9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhcmFtcywgcGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWVsZHModmFsdWUsIGZpbHRlciwgb3BzLCAob3AsIHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCB2YWx1ZSwgZmlsdGVyVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8vIEVudW0gTmFtZXNcblxuZnVuY3Rpb24gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBNYXA8bnVtYmVyLCBzdHJpbmc+IHtcbiAgICBjb25zdCBuYW1lczogTWFwPG51bWJlciwgc3RyaW5nPiA9IG5ldyBNYXAoKTtcbiAgICBPYmplY3QuZW50cmllcyh2YWx1ZXMpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IHtcbiAgICAgICAgbmFtZXMuc2V0KE51bWJlci5wYXJzZUludCgodmFsdWU6IGFueSkpLCBuYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmFtZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbnVtTmFtZShvbkZpZWxkOiBzdHJpbmcsIHZhbHVlczogeyBbc3RyaW5nXTogbnVtYmVyIH0pOiBRVHlwZSB7XG4gICAgY29uc3QgcmVzb2x2ZVZhbHVlID0gKG5hbWUpID0+IHtcbiAgICAgICAgbGV0IHZhbHVlID0gdmFsdWVzW25hbWVdO1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbHVlIFske25hbWV9XSBmb3IgJHtvbkZpZWxkfV9uYW1lYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIHJldHVybiBxbEZpZWxkcyhvbl9wYXRoLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCBwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzb2x2ZWQgPSAob3AgPT09IHNjYWxhck9wcy5pbiB8fCBvcCA9PT0gc2NhbGFyT3BzLm5vdEluKVxuICAgICAgICAgICAgICAgICAgICA/IGZpbHRlclZhbHVlLm1hcChyZXNvbHZlVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIDogcmVzb2x2ZVZhbHVlKGZpbHRlclZhbHVlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGFyYW1zLCBwYXRoLCByZXNvbHZlZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdChwYXJlbnQsIHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZXN0RmllbGRzKHZhbHVlLCBmaWx0ZXIsIHNjYWxhck9wcywgKG9wLCB2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc29sdmVkID0gKG9wID09PSBzY2FsYXJPcHMuaW4gfHwgb3AgPT09IHNjYWxhck9wcy5ub3RJbilcbiAgICAgICAgICAgICAgICAgICAgPyBmaWx0ZXJWYWx1ZS5tYXAocmVzb2x2ZVZhbHVlKVxuICAgICAgICAgICAgICAgICAgICA6IHJlc29sdmVWYWx1ZShmaWx0ZXJWYWx1ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QocGFyZW50LCBwYXJlbnRbb25GaWVsZF0sIHJlc29sdmVkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnVtTmFtZVJlc29sdmVyKG9uRmllbGQ6IHN0cmluZywgdmFsdWVzOiB7IFtzdHJpbmddOiBudW1iZXIgfSk6IChwYXJlbnQpID0+ID9zdHJpbmcge1xuICAgIGNvbnN0IG5hbWVzID0gY3JlYXRlRW51bU5hbWVzTWFwKHZhbHVlcyk7XG4gICAgcmV0dXJuIChwYXJlbnQpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBwYXJlbnRbb25GaWVsZF07XG4gICAgICAgIGNvbnN0IG5hbWUgPSBuYW1lcy5nZXQodmFsdWUpO1xuICAgICAgICByZXR1cm4gbmFtZSAhPT0gdW5kZWZpbmVkID8gbmFtZSA6IG51bGw7XG4gICAgfTtcbn1cblxuLy8gSm9pbnNcblxuZnVuY3Rpb24gam9pbihvbkZpZWxkOiBzdHJpbmcsIHJlZkNvbGxlY3Rpb246IHN0cmluZywgcmVmVHlwZTogUVR5cGUpOiBRVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcWwocGFyYW1zLCBwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IG9uX3BhdGggPSBwYXRoLnNwbGl0KCcuJykuc2xpY2UoMCwgLTEpLmNvbmNhdChvbkZpZWxkKS5qb2luKCcuJyk7XG4gICAgICAgICAgICBjb25zdCBhbGlhcyA9IGAke29uX3BhdGgucmVwbGFjZSgnLicsICdfJyl9YDtcbiAgICAgICAgICAgIGNvbnN0IHJlZlFsID0gcmVmVHlwZS5xbChwYXJhbXMsIGFsaWFzLCBmaWx0ZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgICAgICBMRU5HVEgoXG4gICAgICAgICAgICAgICAgICAgIEZPUiAke2FsaWFzfSBJTiAke3JlZkNvbGxlY3Rpb259XG4gICAgICAgICAgICAgICAgICAgIEZJTFRFUiAoJHthbGlhc30uX2tleSA9PSAke29uX3BhdGh9KSBBTkQgKCR7cmVmUWx9KVxuICAgICAgICAgICAgICAgICAgICBMSU1JVCAxXG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSA+IDBgO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0OiByZWZUeXBlLnRlc3QsXG4gICAgfTtcbn1cblxuZnVuY3Rpb24gam9pbkFycmF5KG9uRmllbGQ6IHN0cmluZywgcmVmQ29sbGVjdGlvbjogc3RyaW5nLCByZWZUeXBlOiBRVHlwZSk6IFFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBxbChwYXJhbXMsIHBhdGgsIGZpbHRlcikge1xuICAgICAgICAgICAgY29uc3QgcmVmRmlsdGVyID0gZmlsdGVyLmFsbCB8fCBmaWx0ZXIuYW55O1xuICAgICAgICAgICAgY29uc3QgYWxsID0gISFmaWx0ZXIuYWxsO1xuICAgICAgICAgICAgY29uc3Qgb25fcGF0aCA9IHBhdGguc3BsaXQoJy4nKS5zbGljZSgwLCAtMSkuY29uY2F0KG9uRmllbGQpLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGNvbnN0IGFsaWFzID0gYCR7b25fcGF0aC5yZXBsYWNlKCcuJywgJ18nKX1gO1xuICAgICAgICAgICAgY29uc3QgcmVmUWwgPSByZWZUeXBlLnFsKHBhcmFtcywgYWxpYXMsIHJlZkZpbHRlcik7XG4gICAgICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgICAgIChMRU5HVEgoJHtvbl9wYXRofSkgPiAwKVxuICAgICAgICAgICAgICAgIEFORCAoTEVOR1RIKFxuICAgICAgICAgICAgICAgICAgICBGT1IgJHthbGlhc30gSU4gJHtyZWZDb2xsZWN0aW9ufVxuICAgICAgICAgICAgICAgICAgICBGSUxURVIgKCR7YWxpYXN9Ll9rZXkgSU4gJHtvbl9wYXRofSkgQU5EICgke3JlZlFsfSlcbiAgICAgICAgICAgICAgICAgICAgJHshYWxsID8gJ0xJTUlUIDEnIDogJyd9XG4gICAgICAgICAgICAgICAgICAgIFJFVFVSTiAxXG4gICAgICAgICAgICAgICAgKSAke2FsbCA/IGA9PSBMRU5HVEgoJHtvbl9wYXRofSlgIDogJz4gMCd9KWA7XG4gICAgICAgIH0sXG4gICAgICAgIHRlc3Q6IHJlZlR5cGUudGVzdCxcbiAgICB9O1xufVxuXG5leHBvcnQge1xuICAgIHNjYWxhcixcbiAgICBiaWdVSW50MSxcbiAgICBiaWdVSW50MixcbiAgICByZXNvbHZlQmlnVUludCxcbiAgICBjb252ZXJ0QmlnVUludCxcbiAgICBzdHJ1Y3QsXG4gICAgYXJyYXksXG4gICAgam9pbixcbiAgICBqb2luQXJyYXlcbn1cblxuZXhwb3J0IHR5cGUge1xuICAgIFFUeXBlXG59XG5cbiJdfQ==