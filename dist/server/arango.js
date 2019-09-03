"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _arangojs = require("arangojs");

var _arangochair = _interopRequireDefault(require("arangochair"));

var _apolloServer = require("apollo-server");

var _logs = _interopRequireDefault(require("./logs"));

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
          var _ref = (0, _asyncToGenerator2["default"])(
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
            return _ref.apply(this, arguments);
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
          var _ref2 = (0, _asyncToGenerator2["default"])(
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
            return _ref2.apply(this, arguments);
          };
        }()
      );
    }
  }, {
    key: "collectionSubscription",
    value: function collectionSubscription(collection, docType) {
      var _this4 = this;

      return {
        subscribe: (0, _apolloServer.withFilter)(function () {
          return _this4.pubsub.asyncIterator(collection.name);
        }, function (data, args) {
          return docType.test(data[collection.name], args.filter);
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
      _regenerator["default"].mark(function _callee5(collection, args, docType) {
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
                          filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(docType.ql('doc', filter)) : '';
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwiZm9yRWFjaCIsInN1YnNjcmliZSIsIm9uIiwiZG9jSnNvbiIsInR5cGUiLCJkb2MiLCJKU09OIiwicGFyc2UiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZmlsdGVyIiwicGFyZW50IiwiYXJncyIsImZldGNoRG9jcyIsInF1ZXJ5IiwiYmluZFZhcnMiLCJiaW5kVmFyc0pzb24iLCJmZXRjaFF1ZXJ5Iiwic3RyaW5naWZ5IiwiZG9jVHlwZSIsImFzeW5jSXRlcmF0b3IiLCJkYXRhIiwidGVzdCIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJjb2RlIiwid3JhcCIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJzb3J0U2VjdGlvbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciIsImFsbCIsImtleSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9jdW1lbnQiLCJtYXAiLCJmZXRjaERvY0J5S2V5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0lBR3FCQSxNOzs7QUFjakIsa0JB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UWtDLEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQcUIsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL2FyYW5nby10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSAnLi9sb2dzJ1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFyYW5nbyB7XG4gICAgY29uZmlnOiBRQ29uZmlnO1xuICAgIGxvZzogUUxvZztcbiAgICBzZXJ2ZXJBZGRyZXNzOiBzdHJpbmc7XG4gICAgZGF0YWJhc2VOYW1lOiBzdHJpbmc7XG4gICAgcHVic3ViOiBQdWJTdWI7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHRyYW5zYWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYWNjb3VudHM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBibG9ja3M6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBjb2xsZWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uW107XG4gICAgbGlzdGVuZXI6IGFueTtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ0FyYW5nbycpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2UoYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc31gKTtcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdhY2NvdW50cycpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuZGIuY29sbGVjdGlvbignYmxvY2tzJyk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxuICAgICAgICAgICAgdGhpcy5ibG9ja3NcbiAgICAgICAgXTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShkb2NKc29uKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIucHVibGlzaChuYW1lLCB7IFtuYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTGlzdGVuIGRhdGFiYXNlJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdGlvblF1ZXJ5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgUXVlcnkgJHtjb2xsZWN0aW9uLm5hbWV9YCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaERvY3MoY29sbGVjdGlvbiwgYXJncywgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnB1YnN1Yi5hc3luY0l0ZXJhdG9yKGNvbGxlY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZGF0YSwgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB3cmFwPFI+KGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRGIgb3BlcmF0aW9uIGZhaWxlZDogJywgZXJyKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gYEZJTFRFUiAke2RvY1R5cGUucWwoJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9ICcnO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gJ0xJTUlUIDUwJztcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiB7fSB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoY29sbGVjdGlvbiwga2V5KSkpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoUXVlcnkocXVlcnk6IGFueSwgYmluZFZhcnM6IGFueSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=