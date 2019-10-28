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
            var doc = JSON.parse(docJson); // this.pubsub.publish(name, { [name]: doc });
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
          try {
            return docType.test(data[collection.name], args.filter || {});
          } catch (error) {
            console.error('[Subscription] doc test failed', data, error);
            throw error;
          }
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
                  var filter, filterSection, orderBy, sortSection, limit, limitSection, query, cursor;
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          filter = args.filter || {};
                          filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(docType.ql('doc', filter)) : '';
                          orderBy = (args.orderBy || []).map(function (field) {
                            var direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
                            return "doc.".concat(field.path.replace(/\bid\b/gi, '_key')).concat(direction);
                          }).join(', ');
                          sortSection = orderBy !== '' ? "SORT ".concat(orderBy) : '';
                          limit = Math.min(args.limit || 50, 50);
                          limitSection = "LIMIT ".concat(limit);
                          query = "\n            FOR doc IN ".concat(collection.name, "\n            ").concat(filterSection, "\n            ").concat(sortSection, "\n            ").concat(limitSection, "\n            RETURN doc");
                          _context4.next = 9;
                          return _this5.db.query({
                            query: query,
                            bindVars: {}
                          });

                        case 9:
                          cursor = _context4.sent;
                          _context4.next = 12;
                          return cursor.all();

                        case 12:
                          return _context4.abrupt("return", _context4.sent);

                        case 13:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwiZm9yRWFjaCIsInN1YnNjcmliZSIsIm9uIiwiZG9jSnNvbiIsInR5cGUiLCJkb2MiLCJKU09OIiwicGFyc2UiLCJzdGFydCIsImRlYnVnIiwiZXJyIiwiaHR0cFN0YXR1cyIsImhlYWRlcnMiLCJib2R5IiwiZXJyb3IiLCJzZXRUaW1lb3V0IiwicmVzdGFydFRpbWVvdXQiLCJmaWx0ZXIiLCJwYXJlbnQiLCJhcmdzIiwiZmV0Y2hEb2NzIiwicXVlcnkiLCJiaW5kVmFycyIsImJpbmRWYXJzSnNvbiIsImZldGNoUXVlcnkiLCJzdHJpbmdpZnkiLCJkb2NUeXBlIiwiYXN5bmNJdGVyYXRvciIsImRhdGEiLCJ0ZXN0IiwiY29uc29sZSIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJjb2RlIiwid3JhcCIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwiam9pbiIsInNvcnRTZWN0aW9uIiwibGltaXQiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiY3Vyc29yIiwiYWxsIiwia2V5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBdkJBOzs7Ozs7Ozs7Ozs7Ozs7SUEwQnFCQSxNOzs7QUFjakIsa0JBQVlDLE1BQVosRUFBNkJDLElBQTdCLEVBQTBDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDdEMsU0FBS0QsTUFBTCxHQUFjQSxNQUFkO0FBQ0EsU0FBS0UsR0FBTCxHQUFXRCxJQUFJLENBQUNFLE1BQUwsQ0FBWSxRQUFaLENBQVg7QUFDQSxTQUFLQyxhQUFMLEdBQXFCSixNQUFNLENBQUNLLFFBQVAsQ0FBZ0JDLE1BQXJDO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQlAsTUFBTSxDQUFDSyxRQUFQLENBQWdCRyxJQUFwQztBQUVBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxvQkFBSixFQUFkO0FBRUEsU0FBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLGtCQUF1QixLQUFLUixhQUE1QixFQUFWO0FBQ0EsU0FBS08sRUFBTCxDQUFRRSxXQUFSLENBQW9CLEtBQUtOLFlBQXpCO0FBRUEsU0FBS08sWUFBTCxHQUFvQixLQUFLSCxFQUFMLENBQVFJLFVBQVIsQ0FBbUIsY0FBbkIsQ0FBcEI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEtBQUtMLEVBQUwsQ0FBUUksVUFBUixDQUFtQixVQUFuQixDQUFoQjtBQUNBLFNBQUtFLFFBQUwsR0FBZ0IsS0FBS04sRUFBTCxDQUFRSSxVQUFSLENBQW1CLFVBQW5CLENBQWhCO0FBQ0EsU0FBS0csTUFBTCxHQUFjLEtBQUtQLEVBQUwsQ0FBUUksVUFBUixDQUFtQixRQUFuQixDQUFkO0FBQ0EsU0FBS0ksV0FBTCxHQUFtQixDQUNmLEtBQUtMLFlBRFUsRUFFZixLQUFLRSxRQUZVLEVBR2YsS0FBS0MsUUFIVSxFQUlmLEtBQUtDLE1BSlUsQ0FBbkI7QUFNSDs7Ozs0QkFFTztBQUFBOztBQUNKLFVBQU1FLFdBQVcsb0JBQWEsS0FBS2hCLGFBQWxCLGNBQW1DLEtBQUtHLFlBQXhDLENBQWpCO0FBQ0EsV0FBS2MsUUFBTCxHQUFnQixJQUFJQyx1QkFBSixDQUFnQkYsV0FBaEIsQ0FBaEI7QUFDQSxXQUFLRCxXQUFMLENBQWlCSSxPQUFqQixDQUF5QixVQUFBUixVQUFVLEVBQUk7QUFDbkMsWUFBTVAsSUFBSSxHQUFHTyxVQUFVLENBQUNQLElBQXhCOztBQUNBLFFBQUEsS0FBSSxDQUFDYSxRQUFMLENBQWNHLFNBQWQsQ0FBd0I7QUFBRVQsVUFBQUEsVUFBVSxFQUFFUDtBQUFkLFNBQXhCOztBQUNBLFFBQUEsS0FBSSxDQUFDYSxRQUFMLENBQWNJLEVBQWQsQ0FBaUJqQixJQUFqQixFQUF1QixVQUFDa0IsT0FBRCxFQUFVQyxJQUFWLEVBQW1CO0FBQ3RDLGNBQUlBLElBQUksS0FBSyxlQUFiLEVBQThCO0FBQzFCLGdCQUFNQyxHQUFHLEdBQUdDLElBQUksQ0FBQ0MsS0FBTCxDQUFXSixPQUFYLENBQVosQ0FEMEIsQ0FFMUI7QUFDSDtBQUNKLFNBTEQ7QUFNSCxPQVREO0FBVUEsV0FBS0wsUUFBTCxDQUFjVSxLQUFkO0FBQ0EsV0FBSzdCLEdBQUwsQ0FBUzhCLEtBQVQsQ0FBZSxpQkFBZixFQUFrQ1osV0FBbEM7QUFDQSxXQUFLQyxRQUFMLENBQWNJLEVBQWQsQ0FBaUIsT0FBakIsRUFBMEIsVUFBQ1EsR0FBRCxFQUFNQyxVQUFOLEVBQWtCQyxPQUFsQixFQUEyQkMsSUFBM0IsRUFBb0M7QUFDMUQsUUFBQSxLQUFJLENBQUNsQyxHQUFMLENBQVNtQyxLQUFULENBQWUsbUJBQWYsRUFBb0M7QUFBRUosVUFBQUEsR0FBRyxFQUFIQSxHQUFGO0FBQU9DLFVBQUFBLFVBQVUsRUFBVkEsVUFBUDtBQUFtQkMsVUFBQUEsT0FBTyxFQUFQQSxPQUFuQjtBQUE0QkMsVUFBQUEsSUFBSSxFQUFKQTtBQUE1QixTQUFwQzs7QUFDQUUsUUFBQUEsVUFBVSxDQUFDO0FBQUEsaUJBQU0sS0FBSSxDQUFDakIsUUFBTCxDQUFjVSxLQUFkLEVBQU47QUFBQSxTQUFELEVBQThCLEtBQUksQ0FBQy9CLE1BQUwsQ0FBWXFCLFFBQVosQ0FBcUJrQixjQUFuRCxDQUFWO0FBQ0gsT0FIRDtBQUlIOzs7b0NBRWV4QixVLEVBQWdDeUIsTSxFQUFhO0FBQUE7O0FBQ3pEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSx1Q0FBTyxpQkFBT0MsTUFBUCxFQUFvQkMsSUFBcEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNILG9CQUFBLE1BQUksQ0FBQ3hDLEdBQUwsQ0FBUzhCLEtBQVQsaUJBQXdCakIsVUFBVSxDQUFDUCxJQUFuQyxHQUEyQ2tDLElBQTNDOztBQURHLHFEQUVJLE1BQUksQ0FBQ0MsU0FBTCxDQUFlNUIsVUFBZixFQUEyQjJCLElBQTNCLEVBQWlDRixNQUFqQyxDQUZKOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBQVA7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUlIOzs7a0NBRWE7QUFBQTs7QUFDVjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsdUNBQU8sa0JBQU9DLE1BQVAsRUFBb0JDLElBQXBCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNHRSxvQkFBQUEsS0FESCxHQUNXRixJQUFJLENBQUNFLEtBRGhCO0FBRUdDLG9CQUFBQSxRQUZILEdBRWNoQixJQUFJLENBQUNDLEtBQUwsQ0FBV1ksSUFBSSxDQUFDSSxZQUFoQixDQUZkO0FBQUEsbUNBR0lqQixJQUhKO0FBQUE7QUFBQSwyQkFHeUIsTUFBSSxDQUFDa0IsVUFBTCxDQUFnQkgsS0FBaEIsRUFBdUJDLFFBQXZCLENBSHpCOztBQUFBO0FBQUE7QUFBQSxtRUFHU0csU0FIVDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUFQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFLSDs7OzJDQUdzQmpDLFUsRUFBZ0NrQyxPLEVBQWdCO0FBQUE7O0FBQ25FLGFBQU87QUFDSHpCLFFBQUFBLFNBQVMsRUFBRSw4QkFDUCxZQUFNO0FBQ0YsaUJBQU8sTUFBSSxDQUFDZixNQUFMLENBQVl5QyxhQUFaLENBQTBCbkMsVUFBVSxDQUFDUCxJQUFyQyxDQUFQO0FBQ0gsU0FITSxFQUlQLFVBQUMyQyxJQUFELEVBQU9ULElBQVAsRUFBZ0I7QUFDWixjQUFJO0FBQ0EsbUJBQU9PLE9BQU8sQ0FBQ0csSUFBUixDQUFhRCxJQUFJLENBQUNwQyxVQUFVLENBQUNQLElBQVosQ0FBakIsRUFBb0NrQyxJQUFJLENBQUNGLE1BQUwsSUFBZSxFQUFuRCxDQUFQO0FBQ0gsV0FGRCxDQUVFLE9BQU1ILEtBQU4sRUFBYTtBQUNYZ0IsWUFBQUEsT0FBTyxDQUFDaEIsS0FBUixDQUFjLGdDQUFkLEVBQWdEYyxJQUFoRCxFQUFzRGQsS0FBdEQ7QUFDQSxrQkFBTUEsS0FBTjtBQUNIO0FBQ0osU0FYTTtBQURSLE9BQVA7QUFlSDs7Ozs7O3FEQUVhaUIsSzs7Ozs7Ozs7dUJBRU9BLEtBQUssRTs7Ozs7Ozs7QUFFWmpCLGdCQUFBQSxLLEdBQVE7QUFDVmtCLGtCQUFBQSxPQUFPLEVBQUUsYUFBSUEsT0FBSixJQUFlLGFBQUlDLFdBQW5CLElBQWtDLGFBQUlDLFFBQUosRUFEakM7QUFFVkMsa0JBQUFBLElBQUksRUFBRSxhQUFJQTtBQUZBLGlCO0FBSWQscUJBQUt4RCxHQUFMLENBQVNtQyxLQUFULENBQWUsdUJBQWY7c0JBQ01BLEs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxREFJRXRCLFUsRUFBZ0MyQixJLEVBQVdPLE87Ozs7Ozs7a0RBQ2hELEtBQUtVLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDUG5CLDBCQUFBQSxNQURPLEdBQ0VFLElBQUksQ0FBQ0YsTUFBTCxJQUFlLEVBRGpCO0FBRVBvQiwwQkFBQUEsYUFGTyxHQUVTQyxNQUFNLENBQUNDLElBQVAsQ0FBWXRCLE1BQVosRUFBb0J1QixNQUFwQixHQUE2QixDQUE3QixvQkFDTmQsT0FBTyxDQUFDZSxFQUFSLENBQVcsS0FBWCxFQUFrQnhCLE1BQWxCLENBRE0sSUFFaEIsRUFKTztBQUtQeUIsMEJBQUFBLE9BTE8sR0FLRyxDQUFDdkIsSUFBSSxDQUFDdUIsT0FBTCxJQUFnQixFQUFqQixFQUNYQyxHQURXLENBQ1AsVUFBQ0MsS0FBRCxFQUFXO0FBQ1osZ0NBQU1DLFNBQVMsR0FBSUQsS0FBSyxDQUFDQyxTQUFOLElBQW1CRCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFdBQWhCLE9BQWtDLE1BQXRELEdBQ1osT0FEWSxHQUVaLEVBRk47QUFHQSxpREFBY0YsS0FBSyxDQUFDRyxJQUFOLENBQVdDLE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsTUFBL0IsQ0FBZCxTQUF1REgsU0FBdkQ7QUFDSCwyQkFOVyxFQU9YSSxJQVBXLENBT04sSUFQTSxDQUxIO0FBY1BDLDBCQUFBQSxXQWRPLEdBY09SLE9BQU8sS0FBSyxFQUFaLGtCQUF5QkEsT0FBekIsSUFBcUMsRUFkNUM7QUFlUFMsMEJBQUFBLEtBZk8sR0FlQ0MsSUFBSSxDQUFDQyxHQUFMLENBQVNsQyxJQUFJLENBQUNnQyxLQUFMLElBQWMsRUFBdkIsRUFBMkIsRUFBM0IsQ0FmRDtBQWdCUEcsMEJBQUFBLFlBaEJPLG1CQWdCaUJILEtBaEJqQjtBQWtCUDlCLDBCQUFBQSxLQWxCTyxzQ0FtQkE3QixVQUFVLENBQUNQLElBbkJYLDJCQW9CWG9ELGFBcEJXLDJCQXFCWGEsV0FyQlcsMkJBc0JYSSxZQXRCVztBQUFBO0FBQUEsaUNBd0JRLE1BQUksQ0FBQ2xFLEVBQUwsQ0FBUWlDLEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQUU7QUFBbkIsMkJBQWQsQ0F4QlI7O0FBQUE7QUF3QlBpQywwQkFBQUEsTUF4Qk87QUFBQTtBQUFBLGlDQXlCQUEsTUFBTSxDQUFDQyxHQUFQLEVBekJBOztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FEQTZCU2hFLFUsRUFBZ0NpRSxHOzs7OztvQkFDM0NBLEc7Ozs7O2tEQUNNQyxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsSUFBaEIsQzs7O2tEQUVKLEtBQUt2QixJQUFMO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkNBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDREQUNONUMsVUFBVSxDQUFDb0UsUUFBWCxDQUFvQkgsR0FBcEIsRUFBeUIsSUFBekIsQ0FETTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBVixHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cURBS1dqRSxVLEVBQWdDK0MsSTs7Ozs7OztzQkFDOUMsQ0FBQ0EsSUFBRCxJQUFTQSxJQUFJLENBQUNDLE1BQUwsS0FBZ0IsQzs7Ozs7a0RBQ2xCa0IsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLEM7OztrREFFSkQsT0FBTyxDQUFDRixHQUFSLENBQVlqQixJQUFJLENBQUNJLEdBQUwsQ0FBUyxVQUFBYyxHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDSSxhQUFMLENBQW1CckUsVUFBbkIsRUFBK0JpRSxHQUEvQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0RBR01wQyxLLEVBQVlDLFE7Ozs7Ozs7bURBQ2xCLEtBQUtjLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlDQUNRLE1BQUksQ0FBQ2hELEVBQUwsQ0FBUWlDLEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQaUMsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vYXJhbmdvLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBRQ29uZmlnLCBsb2dzOiBRTG9ncykge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnQXJhbmdvJyk7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG5cbiAgICAgICAgdGhpcy5wdWJzdWIgPSBuZXcgUHViU3ViKCk7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBEYXRhYmFzZShgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfWApO1xuICAgICAgICB0aGlzLmRiLnVzZURhdGFiYXNlKHRoaXMuZGF0YWJhc2VOYW1lKTtcblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IHRoaXMuZGIuY29sbGVjdGlvbigndHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ21lc3NhZ2VzJyk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2FjY291bnRzJyk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdibG9ja3MnKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb25zLFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcyxcbiAgICAgICAgICAgIHRoaXMuYWNjb3VudHMsXG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1xuICAgICAgICBdO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGRvY0pzb24pO1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLnB1YnN1Yi5wdWJsaXNoKG5hbWUsIHsgW25hbWVdOiBkb2MgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMaXN0ZW4gZGF0YWJhc2UnLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0xpc3RlbmVyIGZhaWxlZDogJywgeyBlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb2xsZWN0aW9uUXVlcnkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBRdWVyeSAke2NvbGxlY3Rpb24ubmFtZX1gLCBhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZldGNoRG9jcyhjb2xsZWN0aW9uLCBhcmdzLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VsZWN0UXVlcnkoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBhcmdzLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgYmluZFZhcnMgPSBKU09OLnBhcnNlKGFyZ3MuYmluZFZhcnNKc29uKTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhd2FpdCB0aGlzLmZldGNoUXVlcnkocXVlcnksIGJpbmRWYXJzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGNvbGxlY3Rpb25TdWJzY3JpcHRpb24oY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiB3aXRoRmlsdGVyKFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IoY29sbGVjdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB3cmFwPFI+KGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRGIgb3BlcmF0aW9uIGZhaWxlZDogJywgZXJyKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgICAgID8gYEZJTFRFUiAke2RvY1R5cGUucWwoJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5ID0gKGFyZ3Mub3JkZXJCeSB8fCBbXSlcbiAgICAgICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeSAhPT0gJycgPyBgU09SVCAke29yZGVyQnl9YCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihhcmdzLmxpbWl0IHx8IDUwLCA1MCk7XG4gICAgICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdH1gO1xuXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHtjb2xsZWN0aW9uLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnM6IHt9IH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uLCBrZXkpKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==