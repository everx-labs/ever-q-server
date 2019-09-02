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
    key: "fetchQuery",
    value: function () {
      var _fetchQuery = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(query, bindVars) {
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt("return", this.wrap(
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee6() {
                  var cursor;
                  return _regenerator["default"].wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          _context6.next = 2;
                          return _this6.db.query({
                            query: query,
                            bindVars: bindVars
                          });

                        case 2:
                          cursor = _context6.sent;
                          return _context6.abrupt("return", cursor.all());

                        case 4:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _callee6);
                }))));

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function fetchQuery(_x9, _x10) {
        return _fetchQuery.apply(this, arguments);
      }

      return fetchQuery;
    }()
  }]);
  return Arango;
}();

exports["default"] = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiY29tYmluZSIsInBhdGgiLCJrZXkiLCJxbE9wIiwib3AiLCJmaWx0ZXIiLCJKU09OIiwic3RyaW5naWZ5IiwicWxDb21iaW5lIiwiY29uZGl0aW9ucyIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJ2YWx1ZSIsInNjYWxhckVxIiwicWwiLCJ0ZXN0Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhciIsImRpc3BhdGNoZXIiLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsIm5vdEluIiwic3RydWN0RGlzcGF0Y2hlciIsImZpZWxkIiwicWxGaWx0ZXIiLCJ0ZXN0RmlsdGVyIiwic3RydWN0IiwiYXJyYXlBbGwiLCJpdGVtVHlwZSIsIml0ZW1RbCIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwieCIsImFycmF5QW55Iiwic3VjY2VlZGVkSW5kZXgiLCJhcnJheSIsImFsbCIsImFueSIsInR5cGUiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsInB1c2giLCJmYWlsZWQiLCJmaW5kIiwiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwiZG9jIiwicGFyc2UiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwicGFyZW50IiwiYXJncyIsImZldGNoRG9jcyIsInF1ZXJ5IiwiYmluZFZhcnMiLCJiaW5kVmFyc0pzb24iLCJmZXRjaFF1ZXJ5IiwiZmlsdGVyVHlwZSIsImFzeW5jSXRlcmF0b3IiLCJkYXRhIiwiZmV0Y2giLCJtZXNzYWdlIiwiQXJhbmdvRXJyb3IiLCJ0b1N0cmluZyIsImNvZGUiLCJ3cmFwIiwiZmlsdGVyU2VjdGlvbiIsImtleXMiLCJzb3J0U2VjdGlvbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQVlBLFNBQVNBLE9BQVQsQ0FBaUJDLElBQWpCLEVBQStCQyxHQUEvQixFQUFvRDtBQUNoRCxTQUFPQSxHQUFHLEtBQUssRUFBUixhQUFnQkQsSUFBaEIsY0FBd0JDLEdBQXhCLElBQWdDRCxJQUF2QztBQUNIOztBQUVELFNBQVNFLElBQVQsQ0FBY0YsSUFBZCxFQUE0QkcsRUFBNUIsRUFBd0NDLE1BQXhDLEVBQTZEO0FBQ3pELG1CQUFVSixJQUFWLGNBQWtCRyxFQUFsQixjQUF3QkUsSUFBSSxDQUFDQyxTQUFMLENBQWVGLE1BQWYsQ0FBeEI7QUFDSDs7QUFFRCxTQUFTRyxTQUFULENBQW1CQyxVQUFuQixFQUF5Q0wsRUFBekMsRUFBcURNLGlCQUFyRCxFQUF3RjtBQUNwRixNQUFJRCxVQUFVLENBQUNFLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT0QsaUJBQVA7QUFDSDs7QUFDRCxNQUFJRCxVQUFVLENBQUNFLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT0YsVUFBVSxDQUFDLENBQUQsQ0FBakI7QUFD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QUEsWUFOTyxHQU1RLFVBTlI7QUFRUGhCLDBCQUFBQSxLQVJPLHNDQVNBMUIsVUFBVSxDQUFDUCxJQVRYLDJCQVVYOEMsYUFWVywyQkFXWEUsV0FYVywyQkFZWEMsWUFaVztBQUFBO0FBQUEsaUNBY1EsTUFBSSxDQUFDOUMsRUFBTCxDQUFROEIsS0FBUixDQUFjO0FBQUVBLDRCQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU0MsNEJBQUFBLFFBQVEsRUFBRTtBQUFuQiwyQkFBZCxDQWRSOztBQUFBO0FBY1BnQiwwQkFBQUEsTUFkTztBQUFBO0FBQUEsaUNBZUFBLE1BQU0sQ0FBQ3BFLEdBQVAsRUFmQTs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFWLEc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxREFtQk1tRCxLLEVBQVlDLFE7Ozs7Ozs7a0RBQ2xCLEtBQUtXLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlDQUNRLE1BQUksQ0FBQzFDLEVBQUwsQ0FBUThCLEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQZ0IsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDcEUsR0FBUCxFQUZNOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFWLEciLCJzb3VyY2VzQ29udGVudCI6WyIvLyBAZmxvd1xuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gJ2FyYW5nb2pzJztcbmltcG9ydCBhcmFuZ29jaGFpciBmcm9tICdhcmFuZ29jaGFpcic7XG5pbXBvcnQgeyBQdWJTdWIsIHdpdGhGaWx0ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyJztcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcblxudHlwZSBGaWx0ZXJEaXNwYXRjaGVyID0ge1xuICAgIHFsOiAocGF0aDogc3RyaW5nLCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSwgZmllbGQ6IGFueSkgPT4gc3RyaW5nLFxuICAgIHRlc3Q6ICh2YWx1ZTogYW55LCBmaWx0ZXJLZXk6IHN0cmluZywgZmlsdGVyVmFsdWU6IGFueSwgZmllbGQ6IGFueSkgPT4gYm9vbGVhbixcbn1cblxudHlwZSBGaWx0ZXJUeXBlID0ge1xuICAgIGRpc3BhdGNoZXI6IEZpbHRlckRpc3BhdGNoZXIsXG4gICAgZmllbGRzOiB7IFtzdHJpbmddOiBhbnkgfVxufVxuXG5mdW5jdGlvbiBjb21iaW5lKHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIHJldHVybiBrZXkgIT09ICcnID8gYCR7cGF0aH0uJHtrZXl9YCA6IHBhdGg7XG59XG5cbmZ1bmN0aW9uIHFsT3AocGF0aDogc3RyaW5nLCBvcDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3BhdGh9ICR7b3B9ICR7SlNPTi5zdHJpbmdpZnkoZmlsdGVyKX1gO1xufVxuXG5mdW5jdGlvbiBxbENvbWJpbmUoY29uZGl0aW9uczogc3RyaW5nW10sIG9wOiBzdHJpbmcsIGRlZmF1bHRDb25kaXRpb25zOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gZGVmYXVsdENvbmRpdGlvbnM7XG4gICAgfVxuICAgIGlmIChjb25kaXRpb25zLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gY29uZGl0aW9uc1swXTtcbiAgICB9XG4gICAgcmV0dXJuICcoJyArIGNvbmRpdGlvbnMuam9pbihgKSAke29wfSAoYCkgKyAnKSc7XG59XG5cbmZ1bmN0aW9uIHFsSW4ocGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9ucyA9IGZpbHRlci5tYXAodmFsdWUgPT4gcWxPcChwYXRoLCAnPT0nLCB2YWx1ZSkpO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ09SJywgJ2ZhbHNlJyk7XG59XG5cbnR5cGUgU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSk6IHN0cmluZyxcbiAgICB0ZXN0KHZhbHVlOiBhbnksIGZpbHRlcjogYW55KTogYm9vbGVhbixcbn1cblxuY29uc3Qgc2NhbGFyRXE6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPT0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9PT0gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOZTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICchPScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlICE9PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckx0OiBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJzwnLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTGU6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPD0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA8PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckd0OiBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJz4nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR2U6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPj0nLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA+PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhckluOiBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsSW4ocGF0aCwgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gZmlsdGVyLmluY2x1ZGVzKHZhbHVlKTtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTm90SW46IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gYE5PVCAoJHtxbEluKHBhdGgsIGZpbHRlcil9KWA7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuICFmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH1cbn07XG5cbmV4cG9ydCBjb25zdCBzY2FsYXI6IEZpbHRlclR5cGUgPSB7XG4gICAgZGlzcGF0Y2hlcjoge1xuICAgICAgICBxbChwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBvcCkge1xuICAgICAgICAgICAgcmV0dXJuIG9wLnFsKHBhdGgsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGVzdCh2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgb3ApIHtcbiAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHZhbHVlLCBmaWx0ZXJWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGZpZWxkczoge1xuICAgICAgICBlcTogc2NhbGFyRXEsXG4gICAgICAgIG5lOiBzY2FsYXJOZSxcbiAgICAgICAgbHQ6IHNjYWxhckx0LFxuICAgICAgICBsZTogc2NhbGFyTGUsXG4gICAgICAgIGd0OiBzY2FsYXJHdCxcbiAgICAgICAgZ2U6IHNjYWxhckdlLFxuICAgICAgICBpbjogc2NhbGFySW4sXG4gICAgICAgIG5vdEluOiBzY2FsYXJOb3RJbixcbiAgICB9XG59O1xuXG5jb25zdCBzdHJ1Y3REaXNwYXRjaGVyOiBGaWx0ZXJEaXNwYXRjaGVyID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIGZpZWxkKSB7XG4gICAgICAgIHJldHVybiBxbEZpbHRlcihjb21iaW5lKHBhdGgsIGZpbHRlcktleSksIGZpbHRlclZhbHVlLCBmaWVsZCk7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGVzdEZpbHRlcih2YWx1ZVtmaWx0ZXJLZXldLCBmaWx0ZXJWYWx1ZSwgZmllbGQpO1xuICAgIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJ1Y3QoZmllbGRzOiB7IFtzdHJpbmddOiBGaWx0ZXJUeXBlIH0pOiBGaWx0ZXJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBkaXNwYXRjaGVyOiBzdHJ1Y3REaXNwYXRjaGVyLFxuICAgICAgICBmaWVsZHMsXG4gICAgfTtcbn1cblxudHlwZSBBcnJheU9wID0ge1xuICAgIHFsKHBhdGg6IHN0cmluZywgZmlsdGVyOiBhbnksIGl0ZW1UeXBlOiBGaWx0ZXJUeXBlKTogc3RyaW5nLFxuICAgIHRlc3QodmFsdWU6IGFueSwgZmlsdGVyOiBhbnksIGl0ZW1UeXBlOiBGaWx0ZXJUeXBlKTogYm9vbGVhbixcbn1cblxuY29uc3QgYXJyYXlBbGw6IEFycmF5T3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyLCBpdGVtVHlwZSkge1xuICAgICAgICBjb25zdCBpdGVtUWwgPSBxbEZpbHRlcignQ1VSUkVOVCcsIGZpbHRlciwgaXRlbVR5cGUpO1xuICAgICAgICByZXR1cm4gYExFTkdUSCgke3BhdGh9WyogRklMVEVSICR7aXRlbVFsfV0pID09IExFTkdUSCgke3BhdGh9KWA7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIsIGl0ZW1UeXBlKSB7XG4gICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIXRlc3RGaWx0ZXIoeCwgZmlsdGVyLCBpdGVtVHlwZSkpO1xuICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgIH1cbn07XG5cbmNvbnN0IGFycmF5QW55OiBBcnJheU9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlciwgaXRlbVR5cGUpIHtcbiAgICAgICAgY29uc3QgaXRlbVFsID0gcWxGaWx0ZXIoJ0NVUlJFTlQnLCBmaWx0ZXIsIGl0ZW1UeXBlKTtcbiAgICAgICAgcmV0dXJuIGBMRU5HVEgoJHtwYXRofVsqIEZJTFRFUiAke2l0ZW1RbH1dKSA+IDBgO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyLCBpdGVtVHlwZSkge1xuICAgICAgICBjb25zdCBzdWNjZWVkZWRJbmRleCA9IHZhbHVlLmZpbmRJbmRleCh4ID0+IHRlc3RGaWx0ZXIoeCwgZmlsdGVyLCBpdGVtVHlwZSkpO1xuICAgICAgICByZXR1cm4gc3VjY2VlZGVkSW5kZXggPj0gMDtcbiAgICB9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYXJyYXkoaXRlbVR5cGU6IEZpbHRlclR5cGUpOiBGaWx0ZXJUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBkaXNwYXRjaGVyOiB7XG4gICAgICAgICAgICBxbChwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBvcDogQXJyYXlPcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC5xbChwYXRoLCBmaWx0ZXJWYWx1ZSwgaXRlbVR5cGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRlc3QodmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIG9wOiBBcnJheU9wKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QodmFsdWUsIGZpbHRlclZhbHVlLCBpdGVtVHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgYWxsOiBhcnJheUFsbCxcbiAgICAgICAgICAgIGFueTogYXJyYXlBbnksXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBxbEZpbHRlcihwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55LCB0eXBlOiBGaWx0ZXJUeXBlKTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zOiBzdHJpbmdbXSA9IFtdO1xuICAgIE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZm9yRWFjaCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gdHlwZS5maWVsZHNbZmlsdGVyS2V5XTtcbiAgICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgICAgICBjb25kaXRpb25zLnB1c2godHlwZS5kaXNwYXRjaGVyLnFsKHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIGZpZWxkKSlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBxbENvbWJpbmUoY29uZGl0aW9ucywgJ0FORCcsICdmYWxzZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdEZpbHRlcih2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSwgdHlwZTogRmlsdGVyVHlwZSk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IGZhaWxlZCA9IE9iamVjdC5lbnRyaWVzKGZpbHRlcikuZmluZCgoW2ZpbHRlcktleSwgZmlsdGVyVmFsdWVdKSA9PiB7XG4gICAgICAgIGNvbnN0IGZpZWxkID0gdHlwZS5maWVsZHNbZmlsdGVyS2V5XTtcbiAgICAgICAgcmV0dXJuICEhKGZpZWxkICYmIHR5cGUuZGlzcGF0Y2hlci50ZXN0KHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBmaWVsZCkpO1xuICAgIH0pO1xuICAgIHJldHVybiAhZmFpbGVkO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICB0cmFuc2FjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYmxvY2tzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgY29sbGVjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbltdO1xuICAgIGxpc3RlbmVyOiBhbnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IG5ldyBQdWJTdWIoKTtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9YCk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gdGhpcy5kYi5jb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IHRoaXMuZGIuY29sbGVjdGlvbignbWVzc2FnZXMnKTtcbiAgICAgICAgdGhpcy5hY2NvdW50cyA9IHRoaXMuZGIuY29sbGVjdGlvbignYWNjb3VudHMnKTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2Jsb2NrcycpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zID0gW1xuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMsXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzLFxuICAgICAgICAgICAgdGhpcy5hY2NvdW50cyxcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzXG4gICAgICAgIF07XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc30vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IEpTT04ucGFyc2UoZG9jSnNvbik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2gobmFtZSwgeyBbbmFtZV06IGRvYyB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0xpc3RlbiBkYXRhYmFzZScsIGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignTGlzdGVuZXIgZmFpbGVkOiAnLCB7IGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSB9KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lci5zdGFydCgpLCB0aGlzLmNvbmZpZy5saXN0ZW5lci5yZXN0YXJ0VGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbGxlY3Rpb25RdWVyeShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGZpbHRlcjogYW55KSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFF1ZXJ5ICR7Y29sbGVjdGlvbi5uYW1lfWAsIGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hEb2NzKGNvbGxlY3Rpb24sIGFyZ3MsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RRdWVyeSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGFyZ3MucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBiaW5kVmFycyA9IEpTT04ucGFyc2UoYXJncy5iaW5kVmFyc0pzb24pO1xuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGF3YWl0IHRoaXMuZmV0Y2hRdWVyeShxdWVyeSwgYmluZFZhcnMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY29sbGVjdGlvblN1YnNjcmlwdGlvbihjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGZpbHRlclR5cGU6IEZpbHRlclR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1YnN1Yi5hc3luY0l0ZXJhdG9yKGNvbGxlY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZGF0YSwgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGVzdEZpbHRlcihkYXRhW2NvbGxlY3Rpb24ubmFtZV0sIGFyZ3MuZmlsdGVyLCBmaWx0ZXJUeXBlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZmlsdGVyVHlwZTogRmlsdGVyVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gYEZJTFRFUiAke3FsRmlsdGVyKCdkb2MnLCBmaWx0ZXIsIGZpbHRlclR5cGUpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9ICdMSU1JVCA1MCc7XG5cbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke2NvbGxlY3Rpb24ubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFyczoge30gfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19