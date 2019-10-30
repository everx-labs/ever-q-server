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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwibGlzdGVuZXJVcmwiLCJsaXN0ZW5lciIsImFyYW5nb2NoYWlyIiwiZm9yRWFjaCIsInN1YnNjcmliZSIsIm9uIiwiZG9jSnNvbiIsInR5cGUiLCJkb2MiLCJKU09OIiwicGFyc2UiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsImVycm9yIiwic2V0VGltZW91dCIsInJlc3RhcnRUaW1lb3V0IiwiZmlsdGVyIiwicGFyZW50IiwiYXJncyIsImZldGNoRG9jcyIsInF1ZXJ5IiwiYmluZFZhcnMiLCJiaW5kVmFyc0pzb24iLCJmZXRjaFF1ZXJ5Iiwic3RyaW5naWZ5IiwiZG9jVHlwZSIsImFzeW5jSXRlcmF0b3IiLCJkYXRhIiwidGVzdCIsImNvbnNvbGUiLCJmZXRjaCIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIndyYXAiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsInFsIiwib3JkZXJCeSIsIm1hcCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciIsImFsbCIsImtleSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9j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O0FBQUE7QUFBQSxpQkFBVixHIiwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxyXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcclxuICogTGljZW5zZSBhdDpcclxuICpcclxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXHJcbiAqXHJcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcclxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxyXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cclxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuXHJcbi8vIEBmbG93XHJcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XHJcbmltcG9ydCBhcmFuZ29jaGFpciBmcm9tICdhcmFuZ29jaGFpcic7XHJcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xyXG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vYXJhbmdvLXR5cGVzXCI7XHJcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xyXG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XHJcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXHJcblxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcclxuICAgIGNvbmZpZzogUUNvbmZpZztcclxuICAgIGxvZzogUUxvZztcclxuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcclxuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xyXG4gICAgcHVic3ViOiBQdWJTdWI7XHJcbiAgICBkYjogRGF0YWJhc2U7XHJcbiAgICB0cmFuc2FjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbjtcclxuICAgIG1lc3NhZ2VzOiBEb2N1bWVudENvbGxlY3Rpb247XHJcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xyXG4gICAgYmxvY2tzOiBEb2N1bWVudENvbGxlY3Rpb247XHJcbiAgICBjb2xsZWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uW107XHJcbiAgICBsaXN0ZW5lcjogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MpIHtcclxuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcclxuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xyXG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XHJcblxyXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xyXG5cclxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9YCk7XHJcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XHJcblxyXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gdGhpcy5kYi5jb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnKTtcclxuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xyXG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2FjY291bnRzJyk7XHJcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2Jsb2NrcycpO1xyXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXHJcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb25zLFxyXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzLFxyXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxyXG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1xyXG4gICAgICAgIF07XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XHJcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xyXG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XHJcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGRvY0pzb24pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2gobmFtZSwgeyBbbmFtZV06IGRvYyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xyXG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMaXN0ZW4gZGF0YWJhc2UnLCBsaXN0ZW5lclVybCk7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbGxlY3Rpb25RdWVyeShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGZpbHRlcjogYW55KSB7XHJcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBRdWVyeSAke2NvbGxlY3Rpb24ubmFtZX1gLCBhcmdzKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hEb2NzKGNvbGxlY3Rpb24sIGFyZ3MsIGZpbHRlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdFF1ZXJ5KCkge1xyXG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGFyZ3MucXVlcnk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhd2FpdCB0aGlzLmZldGNoUXVlcnkocXVlcnksIGJpbmRWYXJzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdWJzY3JpYmU6IHdpdGhGaWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IoY29sbGVjdGlvbi5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAoZGF0YSwgYXJncykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NUeXBlLnRlc3QoZGF0YVtjb2xsZWN0aW9uLm5hbWVdLCBhcmdzLmZpbHRlciB8fCB7fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKSxcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdEYiBvcGVyYXRpb24gZmFpbGVkOiAnLCBlcnIpO1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBkb2NUeXBlOiBRVHlwZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcclxuICAgICAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgPyBgRklMVEVSICR7ZG9jVHlwZS5xbCgnZG9jJywgZmlsdGVyKX1gXHJcbiAgICAgICAgICAgICAgICA6ICcnO1xyXG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5ID0gKGFyZ3Mub3JkZXJCeSB8fCBbXSlcclxuICAgICAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcclxuICAgICAgICAgICAgICAgICAgICAgICAgOiAnJztcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuam9pbignLCAnKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeSAhPT0gJycgPyBgU09SVCAke29yZGVyQnl9YCA6ICcnO1xyXG4gICAgICAgICAgICBjb25zdCBsaW1pdCA9IE1hdGgubWluKGFyZ3MubGltaXQgfHwgNTAsIDUwKTtcclxuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxyXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxyXG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XHJcbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XHJcbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxyXG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcclxuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFyczoge30gfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBpZiAoIWtleSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZG9jdW1lbnQoa2V5LCB0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcclxuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGNvbGxlY3Rpb24sIGtleSkpKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcclxuICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=