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
    return 'true';
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
    return 'true';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiY29tYmluZSIsInBhdGgiLCJrZXkiLCJxbE9wIiwib3AiLCJmaWx0ZXIiLCJKU09OIiwic3RyaW5naWZ5IiwicWxDb21iaW5lIiwiY29uZGl0aW9ucyIsImRlZmF1bHRDb25kaXRpb25zIiwibGVuZ3RoIiwiam9pbiIsInFsSW4iLCJtYXAiLCJ2YWx1ZSIsInNjYWxhckVxIiwicWwiLCJ0ZXN0Iiwic2NhbGFyTmUiLCJzY2FsYXJMdCIsInNjYWxhckxlIiwic2NhbGFyR3QiLCJzY2FsYXJHZSIsInNjYWxhckluIiwiaW5jbHVkZXMiLCJzY2FsYXJOb3RJbiIsInNjYWxhciIsImRpc3BhdGNoZXIiLCJmaWx0ZXJLZXkiLCJmaWx0ZXJWYWx1ZSIsImZpZWxkcyIsImVxIiwibmUiLCJsdCIsImxlIiwiZ3QiLCJnZSIsIm5vdEluIiwic3RydWN0RGlzcGF0Y2hlciIsImZpZWxkIiwicWxGaWx0ZXIiLCJ0ZXN0RmlsdGVyIiwic3RydWN0IiwiYXJyYXlBbGwiLCJpdGVtVHlwZSIsImZhaWxlZEluZGV4IiwiZmluZEluZGV4IiwieCIsImFycmF5QW55Iiwic3VjY2VlZGVkSW5kZXgiLCJhcnJheSIsImFsbCIsImFueSIsInR5cGUiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsInB1c2giLCJmYWlsZWQiLCJmaW5kIiwiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwiZG9jIiwicGFyc2UiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwicGFyZW50IiwiYXJncyIsImZldGNoRG9jcyIsInF1ZXJ5IiwiYmluZFZhcnMiLCJiaW5kVmFyc0pzb24iLCJmZXRjaFF1ZXJ5IiwiZmlsdGVyVHlwZSIsImFzeW5jSXRlcmF0b3IiLCJkYXRhIiwiZmV0Y2giLCJtZXNzYWdlIiwiQXJhbmdvRXJyb3IiLCJ0b1N0cmluZyIsImNvZGUiLCJ3cmFwIiwiZmlsdGVyU2VjdGlvbiIsImtleXMiLCJzb3J0U2VjdGlvbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQVlBLFNBQVNBLE9BQVQsQ0FBaUJDLElBQWpCLEVBQStCQyxHQUEvQixFQUFvRDtBQUNoRCxTQUFPQSxHQUFHLEtBQUssRUFBUixhQUFnQkQsSUFBaEIsY0FBd0JDLEdBQXhCLElBQWdDRCxJQUF2QztBQUNIOztBQUVELFNBQVNFLElBQVQsQ0FBY0YsSUFBZCxFQUE0QkcsRUFBNUIsRUFBd0NDLE1BQXhDLEVBQTZEO0FBQ3pELG1CQUFVSixJQUFWLGNBQWtCRyxFQUFsQixjQUF3QkUsSUFBSSxDQUFDQyxTQUFMLENBQWVGLE1BQWYsQ0FBeEI7QUFDSDs7QUFFRCxTQUFTRyxTQUFULENBQW1CQyxVQUFuQixFQUF5Q0wsRUFBekMsRUFBcURNLGlCQUFyRCxFQUF3RjtBQUNwRixNQUFJRCxVQUFVLENBQUNFLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT0QsaUJBQVA7QUFDSDs7QUFDRCxNQUFJRCxVQUFVLENBQUNFLE1BQVgsS0FBc0IsQ0FBMUIsRUFBNkI7QUFDekIsV0FBT0YsVUFBVSxDQUFDLENBQUQsQ0FBakI7QUFDSDs7QUFDRCxT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QW5CLDJCQUFkLENBZFI7O0FBQUE7QUFjUGdCLDBCQUFBQSxNQWRPO0FBQUE7QUFBQSxpQ0FlQUEsTUFBTSxDQUFDcEUsR0FBUCxFQWZBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FEQW1CTW1ELEssRUFBWUMsUTs7Ozs7OztrREFDbEIsS0FBS1csSUFBTDtBQUFBO0FBQUE7QUFBQTtBQUFBLDZDQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUNBQ1EsTUFBSSxDQUFDMUMsRUFBTCxDQUFROEIsS0FBUixDQUFjO0FBQUVBLDRCQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU0MsNEJBQUFBLFFBQVEsRUFBUkE7QUFBVCwyQkFBZCxDQURSOztBQUFBO0FBQ1BnQiwwQkFBQUEsTUFETztBQUFBLDREQUVOQSxNQUFNLENBQUNwRSxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuXG50eXBlIEZpbHRlckRpc3BhdGNoZXIgPSB7XG4gICAgcWw6IChwYXRoOiBzdHJpbmcsIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55LCBmaWVsZDogYW55KSA9PiBzdHJpbmcsXG4gICAgdGVzdDogKHZhbHVlOiBhbnksIGZpbHRlcktleTogc3RyaW5nLCBmaWx0ZXJWYWx1ZTogYW55LCBmaWVsZDogYW55KSA9PiBib29sZWFuLFxufVxuXG50eXBlIEZpbHRlclR5cGUgPSB7XG4gICAgZGlzcGF0Y2hlcjogRmlsdGVyRGlzcGF0Y2hlcixcbiAgICBmaWVsZHM6IHsgW3N0cmluZ106IGFueSB9XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmUocGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGtleSAhPT0gJycgPyBgJHtwYXRofS4ke2tleX1gIDogcGF0aDtcbn1cblxuZnVuY3Rpb24gcWxPcChwYXRoOiBzdHJpbmcsIG9wOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7cGF0aH0gJHtvcH0gJHtKU09OLnN0cmluZ2lmeShmaWx0ZXIpfWA7XG59XG5cbmZ1bmN0aW9uIHFsQ29tYmluZShjb25kaXRpb25zOiBzdHJpbmdbXSwgb3A6IHN0cmluZywgZGVmYXVsdENvbmRpdGlvbnM6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0Q29uZGl0aW9ucztcbiAgICB9XG4gICAgaWYgKGNvbmRpdGlvbnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHJldHVybiBjb25kaXRpb25zWzBdO1xuICAgIH1cbiAgICByZXR1cm4gJygnICsgY29uZGl0aW9ucy5qb2luKGApICR7b3B9IChgKSArICcpJztcbn1cblxuZnVuY3Rpb24gcWxJbihwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nIHtcbiAgICBjb25zdCBjb25kaXRpb25zID0gZmlsdGVyLm1hcCh2YWx1ZSA9PiBxbE9wKHBhdGgsICc9PScsIHZhbHVlKSk7XG4gICAgcmV0dXJuIHFsQ29tYmluZShjb25kaXRpb25zLCAnT1InLCAnZmFsc2UnKTtcbn1cblxudHlwZSBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoOiBzdHJpbmcsIGZpbHRlcjogYW55KTogc3RyaW5nLFxuICAgIHRlc3QodmFsdWU6IGFueSwgZmlsdGVyOiBhbnkpOiBib29sZWFuLFxufVxuXG5jb25zdCBzY2FsYXJFcTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc9PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBmaWx0ZXI7XG4gICAgfSxcbn07XG5cbmNvbnN0IHNjYWxhck5lOiBTY2FsYXJPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHFsT3AocGF0aCwgJyE9JywgZmlsdGVyKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdmFsdWUgIT09IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyTHQ6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPCcsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDwgZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJMZTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc8PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlIDw9IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFyR3Q6IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxPcChwYXRoLCAnPicsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID4gZmlsdGVyO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJHZTogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBxbE9wKHBhdGgsICc+PScsIGZpbHRlcik7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlID49IGZpbHRlcjtcbiAgICB9LFxufTtcblxuY29uc3Qgc2NhbGFySW46IFNjYWxhck9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gcWxJbihwYXRoLCBmaWx0ZXIpO1xuICAgIH0sXG4gICAgdGVzdCh2YWx1ZSwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBmaWx0ZXIuaW5jbHVkZXModmFsdWUpO1xuICAgIH0sXG59O1xuXG5jb25zdCBzY2FsYXJOb3RJbjogU2NhbGFyT3AgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiBgTk9UICgke3FsSW4ocGF0aCwgZmlsdGVyKX0pYDtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gIWZpbHRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfVxufTtcblxuZXhwb3J0IGNvbnN0IHNjYWxhcjogRmlsdGVyVHlwZSA9IHtcbiAgICBkaXNwYXRjaGVyOiB7XG4gICAgICAgIHFsKHBhdGgsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gb3AucWwocGF0aCwgZmlsdGVyVmFsdWUpO1xuICAgICAgICB9LFxuICAgICAgICB0ZXN0KHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBvcCkge1xuICAgICAgICAgICAgcmV0dXJuIG9wLnRlc3QodmFsdWUsIGZpbHRlclZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZmllbGRzOiB7XG4gICAgICAgIGVxOiBzY2FsYXJFcSxcbiAgICAgICAgbmU6IHNjYWxhck5lLFxuICAgICAgICBsdDogc2NhbGFyTHQsXG4gICAgICAgIGxlOiBzY2FsYXJMZSxcbiAgICAgICAgZ3Q6IHNjYWxhckd0LFxuICAgICAgICBnZTogc2NhbGFyR2UsXG4gICAgICAgIGluOiBzY2FsYXJJbixcbiAgICAgICAgbm90SW46IHNjYWxhck5vdEluLFxuICAgIH1cbn07XG5cbmNvbnN0IHN0cnVjdERpc3BhdGNoZXI6IEZpbHRlckRpc3BhdGNoZXIgPSB7XG4gICAgcWwocGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIHFsRmlsdGVyKGNvbWJpbmUocGF0aCwgZmlsdGVyS2V5KSwgZmlsdGVyVmFsdWUsIGZpZWxkKTtcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlcktleSwgZmlsdGVyVmFsdWUsIGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0ZXN0RmlsdGVyKHZhbHVlW2ZpbHRlcktleV0sIGZpbHRlclZhbHVlLCBmaWVsZCk7XG4gICAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHN0cnVjdChmaWVsZHM6IHsgW3N0cmluZ106IEZpbHRlclR5cGUgfSk6IEZpbHRlclR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICAgIGRpc3BhdGNoZXI6IHN0cnVjdERpc3BhdGNoZXIsXG4gICAgICAgIGZpZWxkcyxcbiAgICB9O1xufVxuXG50eXBlIEFycmF5T3AgPSB7XG4gICAgcWwocGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgaXRlbVR5cGU6IEZpbHRlclR5cGUpOiBzdHJpbmcsXG4gICAgdGVzdCh2YWx1ZTogYW55LCBmaWx0ZXI6IGFueSwgaXRlbVR5cGU6IEZpbHRlclR5cGUpOiBib29sZWFuLFxufVxuXG5jb25zdCBhcnJheUFsbDogQXJyYXlPcCA9IHtcbiAgICBxbChwYXRoLCBmaWx0ZXIsIGl0ZW1UeXBlKSB7XG4gICAgICAgIHJldHVybiAndHJ1ZSc7XG4gICAgfSxcbiAgICB0ZXN0KHZhbHVlLCBmaWx0ZXIsIGl0ZW1UeXBlKSB7XG4gICAgICAgIGNvbnN0IGZhaWxlZEluZGV4ID0gdmFsdWUuZmluZEluZGV4KHggPT4gIXRlc3RGaWx0ZXIoeCwgZmlsdGVyLCBpdGVtVHlwZSkpO1xuICAgICAgICByZXR1cm4gZmFpbGVkSW5kZXggPCAwO1xuICAgIH1cbn07XG5cbmNvbnN0IGFycmF5QW55OiBBcnJheU9wID0ge1xuICAgIHFsKHBhdGgsIGZpbHRlciwgaXRlbVR5cGUpIHtcbiAgICAgICAgcmV0dXJuICd0cnVlJztcbiAgICB9LFxuICAgIHRlc3QodmFsdWUsIGZpbHRlciwgaXRlbVR5cGUpIHtcbiAgICAgICAgY29uc3Qgc3VjY2VlZGVkSW5kZXggPSB2YWx1ZS5maW5kSW5kZXgoeCA9PiB0ZXN0RmlsdGVyKHgsIGZpbHRlciwgaXRlbVR5cGUpKTtcbiAgICAgICAgcmV0dXJuIHN1Y2NlZWRlZEluZGV4ID49IDA7XG4gICAgfVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5KGl0ZW1UeXBlOiBGaWx0ZXJUeXBlKTogRmlsdGVyVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZGlzcGF0Y2hlcjoge1xuICAgICAgICAgICAgcWwocGF0aCwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgb3A6IEFycmF5T3ApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3AucWwocGF0aCwgZmlsdGVyVmFsdWUsIGl0ZW1UeXBlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0ZXN0KHZhbHVlLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBvcDogQXJyYXlPcCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBvcC50ZXN0KHZhbHVlLCBmaWx0ZXJWYWx1ZSwgaXRlbVR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIGFsbDogYXJyYXlBbGwsXG4gICAgICAgICAgICBhbnk6IGFycmF5QW55LFxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcWxGaWx0ZXIocGF0aDogc3RyaW5nLCBmaWx0ZXI6IGFueSwgdHlwZTogRmlsdGVyVHlwZSk6IHN0cmluZyB7XG4gICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZvckVhY2goKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZCA9IHR5cGUuZmllbGRzW2ZpbHRlcktleV07XG4gICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKHR5cGUuZGlzcGF0Y2hlci5xbChwYXRoLCBmaWx0ZXJLZXksIGZpbHRlclZhbHVlLCBmaWVsZCkpXG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcWxDb21iaW5lKGNvbmRpdGlvbnMsICdBTkQnLCAnZmFsc2UnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RGaWx0ZXIodmFsdWU6IGFueSwgZmlsdGVyOiBhbnksIHR5cGU6IEZpbHRlclR5cGUpOiBib29sZWFuIHtcbiAgICBjb25zdCBmYWlsZWQgPSBPYmplY3QuZW50cmllcyhmaWx0ZXIpLmZpbmQoKFtmaWx0ZXJLZXksIGZpbHRlclZhbHVlXSkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZCA9IHR5cGUuZmllbGRzW2ZpbHRlcktleV07XG4gICAgICAgIHJldHVybiAhIShmaWVsZCAmJiB0eXBlLmRpc3BhdGNoZXIudGVzdCh2YWx1ZSwgZmlsdGVyS2V5LCBmaWx0ZXJWYWx1ZSwgZmllbGQpKTtcbiAgICB9KTtcbiAgICByZXR1cm4gIWZhaWxlZDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnLCBsb2dzOiBRTG9ncykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnQXJhbmdvJyk7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG5cbiAgICAgICAgdGhpcy5wdWJzdWIgPSBuZXcgUHViU3ViKCk7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBEYXRhYmFzZShgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfWApO1xuICAgICAgICB0aGlzLmRiLnVzZURhdGFiYXNlKHRoaXMuZGF0YWJhc2VOYW1lKTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IHRoaXMuZGIuY29sbGVjdGlvbigndHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ21lc3NhZ2VzJyk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2FjY291bnRzJyk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdibG9ja3MnKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb25zLFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcyxcbiAgICAgICAgICAgIHRoaXMuYWNjb3VudHMsXG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1xuICAgICAgICBdO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGRvY0pzb24pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YnN1Yi5wdWJsaXNoKG5hbWUsIHsgW25hbWVdOiBkb2MgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMaXN0ZW4gZGF0YWJhc2UnLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0xpc3RlbmVyIGZhaWxlZDogJywgeyBlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb2xsZWN0aW9uUXVlcnkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBRdWVyeSAke2NvbGxlY3Rpb24ubmFtZX1gLCBhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZldGNoRG9jcyhjb2xsZWN0aW9uLCBhcmdzLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VsZWN0UXVlcnkoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBhcmdzLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgYmluZFZhcnMgPSBKU09OLnBhcnNlKGFyZ3MuYmluZFZhcnNKc29uKTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhd2FpdCB0aGlzLmZldGNoUXVlcnkocXVlcnksIGJpbmRWYXJzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGNvbGxlY3Rpb25TdWJzY3JpcHRpb24oY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBmaWx0ZXJUeXBlOiBGaWx0ZXJUeXBlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IHdpdGhGaWx0ZXIoXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcihjb2xsZWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGRhdGEsIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRlc3RGaWx0ZXIoZGF0YVtjb2xsZWN0aW9uLm5hbWVdLCBhcmdzLmZpbHRlciwgZmlsdGVyVHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHdyYXA8Uj4oZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0ge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdEYiBvcGVyYXRpb24gZmFpbGVkOiAnLCBlcnIpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3MoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBhcmdzOiBhbnksIGZpbHRlclR5cGU6IEZpbHRlclR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGBGSUxURVIgJHtxbEZpbHRlcignZG9jJywgZmlsdGVyLCBmaWx0ZXJUeXBlKX1gXG4gICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gJyc7XG4gICAgICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSAnTElNSVQgNTAnO1xuXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHtjb2xsZWN0aW9uLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnM6IHt9IH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==