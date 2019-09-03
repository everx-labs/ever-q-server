"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.struct = struct;
exports.array = array;
exports.qlFilter = qlFilter;
exports.testFilter = testFilter;
exports["default"] = exports.scalar = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _arangojs = require("arangojs");

var _arangochair = _interopRequireDefault(require("arangochair"));

var _apolloServer = require("apollo-server");

var _logs = _interopRequireDefault(require("./logs"));

function combine(path, key) {
  return key !== '' ? "".concat(path, ".").concat(key) : path;
}

function qlOp(path, op, filter) {
  return "".concat(path, " ").concat(op, " ").concat(JSON.stringify(filter));
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

function qlIn(path, filter) {
  var conditions = filter.map(function (value) {
    return qlOp(path, '==', value);
  });
  return qlCombine(conditions, 'OR', 'false');
}

var scalarEq = {
  ql: function ql(path, filter) {
    return qlOp(path, '==', filter);
  },
  test: function test(value, filter) {
    return value === filter;
  }
};
var scalarNe = {
  ql: function ql(path, filter) {
    return qlOp(path, '!=', filter);
  },
  test: function test(value, filter) {
    return value !== filter;
  }
};
var scalarLt = {
  ql: function ql(path, filter) {
    return qlOp(path, '<', filter);
  },
  test: function test(value, filter) {
    return value < filter;
  }
};
var scalarLe = {
  ql: function ql(path, filter) {
    return qlOp(path, '<=', filter);
  },
  test: function test(value, filter) {
    return value <= filter;
  }
};
var scalarGt = {
  ql: function ql(path, filter) {
    return qlOp(path, '>', filter);
  },
  test: function test(value, filter) {
    return value > filter;
  }
};
var scalarGe = {
  ql: function ql(path, filter) {
    return qlOp(path, '>=', filter);
  },
  test: function test(value, filter) {
    return value >= filter;
  }
};
var scalarIn = {
  ql: function ql(path, filter) {
    return qlIn(path, filter);
  },
  test: function test(value, filter) {
    return filter.includes(value);
  }
};
var scalarNotIn = {
  ql: function ql(path, filter) {
    return "NOT (".concat(qlIn(path, filter), ")");
  },
  test: function test(value, filter) {
    return !filter.includes(value);
  }
};
var scalar = {
  dispatcher: {
    ql: function ql(path, filterKey, filterValue, op) {
      return op.ql(path, filterValue);
    },
    test: function test(value, filterKey, filterValue, op) {
      return op.test(value, filterValue);
    }
  },
  fields: {
    eq: scalarEq,
    ne: scalarNe,
    lt: scalarLt,
    le: scalarLe,
    gt: scalarGt,
    ge: scalarGe,
    "in": scalarIn,
    notIn: scalarNotIn
  }
};
exports.scalar = scalar;
var structDispatcher = {
  ql: function ql(path, filterKey, filterValue, field) {
    return qlFilter(combine(path, filterKey), filterValue, field);
  },
  test: function test(value, filterKey, filterValue, field) {
    return testFilter(value[filterKey], filterValue, field);
  }
};

function struct(fields) {
  return {
    dispatcher: structDispatcher,
    fields: fields
  };
}

var arrayAll = {
  ql: function ql(path, filter, itemType) {
    var itemQl = qlFilter('CURRENT', filter, itemType);
    return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) == LENGTH(").concat(path, ")");
  },
  test: function test(value, filter, itemType) {
    var failedIndex = value.findIndex(function (x) {
      return !testFilter(x, filter, itemType);
    });
    return failedIndex < 0;
  }
};
var arrayAny = {
  ql: function ql(path, filter, itemType) {
    var itemQl = qlFilter('CURRENT', filter, itemType);
    return "LENGTH(".concat(path, "[* FILTER ").concat(itemQl, "]) > 0");
  },
  test: function test(value, filter, itemType) {
    var succeededIndex = value.findIndex(function (x) {
      return testFilter(x, filter, itemType);
    });
    return succeededIndex >= 0;
  }
};

function array(itemType) {
  return {
    dispatcher: {
      ql: function ql(path, filterKey, filterValue, op) {
        return op.ql(path, filterValue, itemType);
      },
      test: function test(value, filterKey, filterValue, op) {
        return op.test(value, filterValue, itemType);
      }
    },
    fields: {
      all: arrayAll,
      any: arrayAny
    }
  };
}

function qlFilter(path, filter, type) {
  var conditions = [];
  Object.entries(filter).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        filterKey = _ref2[0],
        filterValue = _ref2[1];

    var field = type.fields[filterKey];

    if (field) {
      conditions.push(type.dispatcher.ql(path, filterKey, filterValue, field));
    }
  });
  return qlCombine(conditions, 'AND', 'false');
}

function testFilter(value, filter, type) {
  var failed = Object.entries(filter).find(function (_ref3) {
    var _ref4 = (0, _slicedToArray2["default"])(_ref3, 2),
        filterKey = _ref4[0],
        filterValue = _ref4[1];

    var field = type.fields[filterKey];
    return !!(field && type.dispatcher.test(value, filterKey, filterValue, field));
  });
  return !failed;
}

var Arango =
/*#__PURE__*/
function () {
  function Arango(config, logs) {
    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "serverAddress", void 0);
    (0, _defineProperty2["default"])(this, "databaseName", void 0);
    (0, _defineProperty2["default"])(this, "pubsub", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "transactions", void 0);
    (0, _defineProperty2["default"])(this, "messages", void 0);
    (0, _defineProperty2["default"])(this, "accounts", void 0);
    (0, _defineProperty2["default"])(this, "blocks", void 0);
    (0, _defineProperty2["default"])(this, "collections", void 0);
    (0, _defineProperty2["default"])(this, "listener", void 0);
    this.config = config;
    this.log = logs.create('Arango');
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.pubsub = new _apolloServer.PubSub();
    this.db = new _arangojs.Database("http://".concat(this.serverAddress));
    this.db.useDatabase(this.databaseName);
    this.transactions = this.db.collection('transactions');
    this.messages = this.db.collection('messages');
    this.accounts = this.db.collection('accounts');
    this.blocks = this.db.collection('blocks');
    this.collections = [this.transactions, this.messages, this.accounts, this.blocks];
  }

  (0, _createClass2["default"])(Arango, [{
    key: "start",
    value: function start() {
      var _this = this;

      var listenerUrl = "http://".concat(this.serverAddress, "/").concat(this.databaseName);
      this.listener = new _arangochair["default"](listenerUrl);
      this.collections.forEach(function (collection) {
        var name = collection.name;

        _this.listener.subscribe({
          collection: name
        });

        _this.listener.on(name, function (docJson, type) {
          if (type === 'insert/update') {
            var doc = JSON.parse(docJson);

            _this.pubsub.publish(name, (0, _defineProperty2["default"])({}, name, doc));
          }
        });
      });
      this.listener.start();
      this.log.debug('Listen database', listenerUrl);
      this.listener.on('error', function (err, httpStatus, headers, body) {
        _this.log.error('Listener failed: ', {
          err: err,
          httpStatus: httpStatus,
          headers: headers,
          body: body
        });

        setTimeout(function () {
          return _this.listener.start();
        }, _this.config.listener.restartTimeout);
      });
    }
  }, {
    key: "collectionQuery",
    value: function collectionQuery(collection, filter) {
      var _this2 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref5 = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee(parent, args) {
            return _regenerator["default"].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _this2.log.debug("Query ".concat(collection.name), args);

                    return _context.abrupt("return", _this2.fetchDocs(collection, args, filter));

                  case 2:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function (_x, _x2) {
            return _ref5.apply(this, arguments);
          };
        }()
      );
    }
  }, {
    key: "selectQuery",
    value: function selectQuery() {
      var _this3 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref6 = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee2(parent, args) {
            var query, bindVars;
            return _regenerator["default"].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    query = args.query;
                    bindVars = JSON.parse(args.bindVarsJson);
                    _context2.t0 = JSON;
                    _context2.next = 5;
                    return _this3.fetchQuery(query, bindVars);

                  case 5:
                    _context2.t1 = _context2.sent;
                    return _context2.abrupt("return", _context2.t0.stringify.call(_context2.t0, _context2.t1));

                  case 7:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function (_x3, _x4) {
            return _ref6.apply(this, arguments);
          };
        }()
      );
    }
  }, {
    key: "collectionSubscription",
    value: function collectionSubscription(collection, filterType) {
      var _this4 = this;

      return {
        subscribe: (0, _apolloServer.withFilter)(function () {
          return _this4.pubsub.asyncIterator(collection.name);
        }, function (data, args) {
          return testFilter(data[collection.name], args.filter, filterType);
        })
      };
    }
  }, {
    key: "wrap",
    value: function () {
      var _wrap = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(fetch) {
        var error;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                _context3.next = 3;
                return fetch();

              case 3:
                return _context3.abrupt("return", _context3.sent);

              case 6:
                _context3.prev = 6;
                _context3.t0 = _context3["catch"](0);
                error = {
                  message: _context3.t0.message || _context3.t0.ArangoError || _context3.t0.toString(),
                  code: _context3.t0.code
                };
                this.log.error('Db operation failed: ', _context3.t0);
                throw error;

              case 11:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[0, 6]]);
      }));

      function wrap(_x5) {
        return _wrap.apply(this, arguments);
      }

      return wrap;
    }()
  }, {
    key: "fetchDocs",
    value: function () {
      var _fetchDocs = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(collection, args, filterType) {
        var _this5 = this;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", this.wrap(
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee4() {
                  var filter, filterSection, sortSection, limitSection, query, cursor;
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          filter = args.filter || {};
                          filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(qlFilter('doc', filter, filterType)) : '';
                          sortSection = '';
                          limitSection = 'LIMIT 50';
                          query = "\n            FOR doc IN ".concat(collection.name, "\n            ").concat(filterSection, "\n            ").concat(sortSection, "\n            ").concat(limitSection, "\n            RETURN doc");
                          _context4.next = 7;
                          return _this5.db.query({
                            query: query,
                            bindVars: {}
                          });

                        case 7:
                          cursor = _context4.sent;
                          _context4.next = 10;
                          return cursor.all();

                        case 10:
                          return _context4.abrupt("return", _context4.sent);

                        case 11:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4);
                }))));

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function fetchDocs(_x6, _x7, _x8) {
        return _fetchDocs.apply(this, arguments);
      }

      return fetchDocs;
    }()
  }, {
    key: "fetchDocByKey",
    value: function () {
      var _fetchDocByKey = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(collection, key) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (key) {
                  _context7.next = 2;
                  break;
                }

                return _context7.abrupt("return", Promise.resolve(null));

              case 2:
                return _context7.abrupt("return", this.wrap(
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee6() {
                  return _regenerator["default"].wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          return _context6.abrupt("return", collection.document(key, true));

                        case 1:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _callee6);
                }))));

              case 3:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function fetchDocByKey(_x9, _x10) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee8(collection, keys) {
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context8.next = 2;
                  break;
                }

                return _context8.abrupt("return", Promise.resolve([]));

              case 2:
                return _context8.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this6.fetchDocByKey(collection, key);
                })));

              case 3:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function fetchDocsByKeys(_x11, _x12) {
        return _fetchDocsByKeys.apply(this, arguments);
      }

      return fetchDocsByKeys;
    }()
  }, {
    key: "fetchQuery",
    value: function () {
      var _fetchQuery = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee10(query, bindVars) {
        var _this7 = this;

        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt("return", this.wrap(
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee9() {
                  var cursor;
                  return _regenerator["default"].wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          _context9.next = 2;
                          return _this7.db.query({
                            query: query,
                            bindVars: bindVars
                          });

                        case 2:
                          cursor = _context9.sent;
                          return _context9.abrupt("return", cursor.all());

                        case 4:
                        case "end":
                          return _context9.stop();
                      }
                    }
                  }, _callee9);
                }))));

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function fetchQuery(_x13, _x14) {
        return _fetchQuery.apply(this, arguments);
      }

      return fetchQuery;
    }()
  }]);
  return Arango;
}();

exports["default"] = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiY29tYmluZSIsInBhdGgiLCJrZXkiLCJxbE9wIiwib3AiLCJmaWx0ZXIiLCJKU09OIiwic3RyaW5naWZ5IiwicWxDb21iaW5lIiwiY29uZGl0aW9ucyIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJ2YWx1ZSIsInNjYWxhckVxIiwicWwiLCJ0ZXN0Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhciIsImRpc3BhdGNoZXIiLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsIm5vdEluIiwic3RydWN0RGlzcGF0Y2hlciIsImZpZWxkIiwicWxGaWx0ZXIiLCJ0ZXN0RmlsdGVyIiwic3RydWN0IiwiYXJyYXlBbGwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwieCIsImFycmF5QW55Iiwic3VjY2VlZGVkSW5kZXgiLCJhcnJheSIsImFsbCIsImFueSIsInR5cGUiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsInB1c2giLCJmYWlsZWQiLCJmaW5kIiwiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwiZG9jIiwicGFyc2UiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwicGFyZW50IiwiYXJncyIsImZldGNoRG9jcyIsInF1ZXJ5IiwiYmluZFZhcnMiLCJiaW5kVmFyc0pzb24iLCJmZXRjaFF1ZXJ5IiwiZmlsdGVyVHlwZSIsImFzeW5jSXRlcmF0b3IiLCJkYXRhIiwiZmV0Y2giLCJtZXNzYWdlIiwiQXJhbmdvRXJyb3IiLCJ0b1N0cmluZyIsImNvZGUiLCJ3cmFwIiwiZmlsdGVyU2VjdGlvbiIsImtleXMiLCJzb3J0U2VjdGlvbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBWUEsU0FBU0EsT0FBVCxDQUFpQkMsSUFBakIsRUFBK0JDLEdBQS9CLEVBQW9EO0FBQ2hELFNBQU9BLEdBQUcsS0FBSyxFQUFSLGFBQWdCRCxJQUFoQixjQUF3QkMsR0FBeEIsSUFBZ0NELElBQXZDO0FBQ0g7O0FBRUQsU0FBU0UsSUFBVCxDQUFjRixJQUFkLEVBQTRCRyxFQUE1QixFQUF3Q0MsTUFBeEMsRUFBNkQ7QUFDekQsbUJBQVVKLElBQVYsY0FBa0JHLEVBQWxCLGNBQXdCRSxJQUFJLENBQUNDLFNBQUwsQ0FBZUYsTUFBZixDQUF4QjtBQUNIOztBQUVELFNBQVNHLFNBQVQsQ0FBbUJDLFVBQW5CLEVBQXlDTCxFQUF6QyxFQUFxRE0saUJBQXJELEVBQXdGO0FBQ3BGLE1BQUlELFVBQVUsQ0FBQ0UsTUFBWCxLQUFzQixDQUExQixFQUE2QjtBQUN6QixXQUFPRCxpQkFBUDtBQUNIOztBQUNELE1BQUlELFVBQVUsQ0FBQ0UsTUFBWCxLQUFzQixD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QjVFLEdBQS9CLENBQUo7QUFBQSxpQkFBWixDQUFaLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREFHTXNHLEssRUFBWUMsUTs7Ozs7OzttREFDbEIsS0FBS1csSUFBTDtBQUFBO0FBQUE7QUFBQTtBQUFBLDZDQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUNBQ1EsTUFBSSxDQUFDMUMsRUFBTCxDQUFROEIsS0FBUixDQUFjO0FBQUVBLDRCQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU0MsNEJBQUFBLFFBQVEsRUFBUkE7QUFBVCwyQkFBZCxDQURSOztBQUFBO0FBQ1BnQiwwQkFBQUEsTUFETztBQUFBLDREQUVOQSxNQUFNLENBQUNwRSxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuXG50eXBlIEZpbHRlckRpc3BhdGNoZXIgPSB7XG4gICAgcWw6IChwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55LCBmaWVsZDogYW55KSA9PiBzdHJpbmcsXG4gICAgdGVzdDogKHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55LCBmaWVsZDogYW55KSA9PiBib29sZWFuLFxufVxuXG50eXBlIEZpbHRlclR5cGUgPSB7XG4gICAgZGlzcGF0Y2hlcjogRmlsdGVyRGlzcGF0Y2hlcixcbiAgICBmaWVsZHM6IHsgW3N0cmluZ106IGFueSB9XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmUocGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGtleSAhPT0gJycgPyBgJHtwYXRofS4ke2tleX1gIDogcGF0aDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cGF0aH0gJHtvcH0gJHtKU09OLnN0cmluZ2lmeShmaWx0ZXIpfWA7XG59XG5cbmZ1bmN0aW9uIHFsQ29tYmluZShjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gcWxJbihwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxudHlwZSBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nLFxuICAgIHRlc3QodmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpOiBib29sZWFuLFxufVxuXG5jb25zdCBzY2FsYXJFcTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogRmlsdGVyVHlwZSA9IHtcbiAgICBkaXNwYXRjaGVyOiB7XG4gICAgICAgIHFsKHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gb3AucWwocGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBvcCkge1xuICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QodmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZmllbGRzOiB7XG4gICAgICAgIGVxOiBzY2FsYXJFcSxcbiAgICAgICAgbmU6IHNjYWxhck5lLFxuICAgICAgICBsdDogc2NhbGFyTHQsXG4gICAgICAgIGxlOiBzY2FsYXJMZSxcbiAgICAgICAgZ3Q6IHNjYWxhckd0LFxuICAgICAgICBnZTogc2NhbGFyR2UsXG4gICAgICAgIGluOiBzY2FsYXJJbixcbiAgICAgICAgbm90SW46IHNjYWxhck5vdEluLFxuICAgIH1cbn07XG5cbmNvbnN0IHN0cnVjdERpc3BhdGNoZXI6IEZpbHRlckRpc3BhdGNoZXIgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIHFsRmlsdGVyKGNvbWJpbmUocGF0aCwgZmlsdGVyS2V5KSwgZmlsdGVyVmFsdWUsIGZpZWxkKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0ZXN0RmlsdGVyKHZhbHVlW2ZpbHRlcktleV0sIGZpbHRlclZhbHVlLCBmaWVsZCk7XG4gICAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IEZpbHRlclR5cGUgfSk6IEZpbHRlclR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRpc3BhdGNoZXI6IHN0cnVjdERpc3BhdGNoZXIsXG4gICAgICAgIGZpZWxkcyxcbiAgICB9O1xufVxuXG50eXBlIEFycmF5T3AgPSB7XG4gICAgcWwocGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgaXRlbVR5cGU6IEZpbHRlclR5cGUpOiBzdHJpbmcsXG4gICAgdGVzdCh2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSwgaXRlbVR5cGU6IEZpbHRlclR5cGUpOiBib29sZWFuLFxufVxuXG5jb25zdCBhcnJheUFsbDogQXJyYXlPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIsIGl0ZW1UeXBlKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1RbCA9IHFsRmlsdGVyKCdDVVJSRU5UJywgZmlsdGVyLCBpdGVtVHlwZSk7XG4gICAgICAgIHJldHVybiBgTEVOR1RIKCR7cGF0aH1bKiBGSUxURVIgJHtpdGVtUWx9XSkgPT0gTEVOR1RIKCR7cGF0aH0pYDtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlciwgaXRlbVR5cGUpIHtcbiAgICAgICAgY29uc3QgZmFpbGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiAhdGVzdEZpbHRlcih4LCBmaWx0ZXIsIGl0ZW1UeXBlKSk7XG4gICAgICAgIHJldHVybiBmYWlsZWRJbmRleCA8IDA7XG4gICAgfVxufTtcblxuY29uc3QgYXJyYXlBbnk6IEFycmF5T3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyLCBpdGVtVHlwZSkge1xuICAgICAgICBjb25zdCBpdGVtUWwgPSBxbEZpbHRlcignQ1VSUkVOVCcsIGZpbHRlciwgaXRlbVR5cGUpO1xuICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID4gMGA7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIsIGl0ZW1UeXBlKSB7XG4gICAgICAgIGNvbnN0IHN1Y2NlZWRlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gdGVzdEZpbHRlcih4LCBmaWx0ZXIsIGl0ZW1UeXBlKSk7XG4gICAgICAgIHJldHVybiBzdWNjZWVkZWRJbmRleCA+PSAwO1xuICAgIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBhcnJheShpdGVtVHlwZTogRmlsdGVyVHlwZSk6IEZpbHRlclR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRpc3BhdGNoZXI6IHtcbiAgICAgICAgICAgIHFsKHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIG9wOiBBcnJheU9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhdGgsIGZpbHRlclZhbHVlLCBpdGVtVHlwZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVzdCh2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgb3A6IEFycmF5T3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AudGVzdCh2YWx1ZSwgZmlsdGVyVmFsdWUsIGl0ZW1UeXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBhbGw6IGFycmF5QWxsLFxuICAgICAgICAgICAgYW55OiBhcnJheUFueSxcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHFsRmlsdGVyKHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnksIHR5cGU6IEZpbHRlclR5cGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNvbmRpdGlvbnM6IHN0cmluZ1tdID0gW107XG4gICAgT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5mb3JFYWNoKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGQgPSB0eXBlLmZpZWxkc1tmaWx0ZXJLZXldO1xuICAgICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaCh0eXBlLmRpc3BhdGNoZXIucWwocGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgZmllbGQpKVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnQU5EJywgJ2ZhbHNlJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0RmlsdGVyKHZhbHVlOiBhbnksIGZpbHRlcjogYW55LCB0eXBlOiBGaWx0ZXJUeXBlKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZmFpbGVkID0gT2JqZWN0LmVudHJpZXMoZmlsdGVyKS5maW5kKChbZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZV0pID0+IHtcbiAgICAgICAgY29uc3QgZmllbGQgPSB0eXBlLmZpZWxkc1tmaWx0ZXJLZXldO1xuICAgICAgICByZXR1cm4gISEoZmllbGQgJiYgdHlwZS5kaXNwYXRjaGVyLnRlc3QodmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIGZpZWxkKSk7XG4gICAgfSk7XG4gICAgcmV0dXJuICFmYWlsZWQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyYW5nbyB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZzogUUxvZztcbiAgICBzZXJ2ZXJBZGRyZXNzOiBzdHJpbmc7XG4gICAgZGF0YWJhc2VOYW1lOiBzdHJpbmc7XG4gICAgcHVic3ViOiBQdWJTdWI7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHRyYW5zYWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYWNjb3VudHM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBibG9ja3M6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBjb2xsZWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uW107XG4gICAgbGlzdGVuZXI6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ0FyYW5nbycpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2UoYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc31gKTtcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdhY2NvdW50cycpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuZGIuY29sbGVjdGlvbignYmxvY2tzJyk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxuICAgICAgICAgICAgdGhpcy5ibG9ja3NcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShkb2NKc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIucHVibGlzaChuYW1lLCB7IFtuYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTGlzdGVuIGRhdGFiYXNlJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdGlvblF1ZXJ5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgUXVlcnkgJHtjb2xsZWN0aW9uLm5hbWV9YCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaERvY3MoY29sbGVjdGlvbiwgYXJncywgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyVHlwZTogRmlsdGVyVHlwZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiB3aXRoRmlsdGVyKFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IoY29sbGVjdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0ZXN0RmlsdGVyKGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIsIGZpbHRlclR5cGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB3cmFwPFI+KGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRGIgb3BlcmF0aW9uIGZhaWxlZDogJywgZXJyKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBmaWx0ZXJUeXBlOiBGaWx0ZXJUeXBlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBgRklMVEVSICR7cWxGaWx0ZXIoJ2RvYycsIGZpbHRlciwgZmlsdGVyVHlwZSl9YFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9ICcnO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gJ0xJTUlUIDUwJztcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiB7fSB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoY29sbGVjdGlvbiwga2V5KSkpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoUXVlcnkocXVlcnk6IGFueSwgYmluZFZhcnM6IGFueSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=