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

var _config = require("./config");

var _qTypes = require("./q-types");

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
    (0, _defineProperty2["default"])(this, "filtersByCollectionName", void 0);
    this.config = config;
    this.log = logs.create('Arango');
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.pubsub = new _apolloServer.PubSub();
    this.db = new _arangojs.Database({
      url: "".concat((0, _config.ensureProtocol)(this.serverAddress, 'http'))
    });
    this.db.useDatabase(this.databaseName);

    if (this.config.database.auth) {
      var authParts = this.config.database.auth.split(':');
      this.db.useBasicAuth(authParts[0], authParts[1] || '');
    }

    this.transactions = this.db.collection('transactions');
    this.messages = this.db.collection('messages');
    this.accounts = this.db.collection('accounts');
    this.blocks = this.db.collection('blocks');
    this.collections = [this.transactions, this.messages, this.accounts, this.blocks];
    this.filtersByCollectionName = new Map();
  }

  (0, _createClass2["default"])(Arango, [{
    key: "addFilter",
    value: function addFilter(collection, docType, filter) {
      var filters;
      var existing = this.filtersByCollectionName.get(collection);

      if (existing) {
        filters = existing;
      } else {
        filters = {
          lastId: 0,
          docType: docType,
          filtersById: new Map()
        };
        this.filtersByCollectionName.set(collection, filters);
      }

      do {
        filters.lastId = filters.lastId < Number.MAX_SAFE_INTEGER ? filters.lastId + 1 : 1;
      } while (filters.filtersById.has(filters.lastId));

      filters.filtersById.set(filters.lastId, filter);
      return filters.lastId;
    }
  }, {
    key: "removeFilter",
    value: function removeFilter(collection, id) {
      var filters = this.filtersByCollectionName.get(collection);

      if (filters) {
        if (filters.filtersById["delete"](id)) {
          return;
        }
      }

      console.error("Failed to remove filter ".concat(collection, "[").concat(id, "]: filter does not exists"));
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;

      var listenerUrl = "".concat((0, _config.ensureProtocol)(this.serverAddress, 'http'), "/").concat(this.databaseName);
      this.listener = new _arangochair["default"](listenerUrl);

      if (this.config.database.auth) {
        var userPassword = Buffer.from(this.config.database.auth).toString('base64');
        this.listener.req.opts.headers['Authorization'] = "Basic ".concat(userPassword);
      }

      this.collections.forEach(function (collection) {
        var name = collection.name;

        _this2.listener.subscribe({
          collection: name
        });

        _this2.listener.on(name, function (docJson, type) {
          if (type === 'insert/update') {
            var doc = JSON.parse(docJson);

            var filters = _this2.filtersByCollectionName.get(name);

            if (filters) {
              var _iteratorNormalCompletion = true;
              var _didIteratorError = false;
              var _iteratorError = undefined;

              try {
                for (var _iterator = filters.filtersById.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                  var _filter = _step.value;

                  if (filters.docType.test(null, doc, _filter || {})) {
                    _this2.pubsub.publish(name, (0, _defineProperty2["default"])({}, name, doc));

                    break;
                  }
                }
              } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                    _iterator["return"]();
                  }
                } finally {
                  if (_didIteratorError) {
                    throw _iteratorError;
                  }
                }
              }
            }
          }
        });
      });
      this.listener.start();
      this.log.debug('Listen database', listenerUrl);
      this.listener.on('error', function (err, httpStatus, headers, body) {
        _this2.log.error('Listener failed: ', {
          err: err,
          httpStatus: httpStatus,
          headers: headers,
          body: body
        });

        setTimeout(function () {
          return _this2.listener.start();
        }, _this2.config.listener.restartTimeout);
      });
    }
  }, {
    key: "collectionQuery",
    value: function collectionQuery(collection, filter) {
      var _this3 = this;

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
                    _this3.log.debug("Query ".concat(collection.name), args);

                    return _context.abrupt("return", _this3.fetchDocs(collection, args, filter));

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
      var _this4 = this;

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
                    return _this4.fetchQuery(query, bindVars);

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
      var _this5 = this;

      return {
        subscribe: (0, _apolloServer.withFilter)(function (_, args) {
          var iter = _this5.pubsub.asyncIterator(collection.name);

          var filterId = _this5.addFilter(collection.name, docType, args.filter);

          var _this = _this5;
          return {
            next: function next(value) {
              return iter.next(value);
            },
            "return": function _return(value) {
              _this.removeFilter(collection.name, filterId);

              return iter["return"](value);
            },
            "throw": function _throw(e) {
              _this.removeFilter(collection.name, filterId);

              return iter["throw"](e);
            }
          };
        }, function (data, args) {
          try {
            return docType.test(null, data[collection.name], args.filter || {});
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
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", this.wrap(
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee4() {
                  var filter, params, filterSection, orderBy, sortSection, limit, limitSection, query, cursor;
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          filter = args.filter || {};
                          params = new _qTypes.QParams();
                          filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(docType.ql(params, 'doc', filter)) : '';
                          orderBy = (args.orderBy || []).map(function (field) {
                            var direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
                            return "doc.".concat(field.path.replace(/\bid\b/gi, '_key')).concat(direction);
                          }).join(', ');
                          sortSection = orderBy !== '' ? "SORT ".concat(orderBy) : '';
                          limit = Math.min(args.limit || 50, 50);
                          limitSection = "LIMIT ".concat(limit);
                          query = "\n            FOR doc IN ".concat(collection.name, "\n            ").concat(filterSection, "\n            ").concat(sortSection, "\n            ").concat(limitSection, "\n            RETURN doc");
                          _context4.next = 10;
                          return _this6.db.query({
                            query: query,
                            bindVars: params.values
                          });

                        case 10:
                          cursor = _context4.sent;
                          _context4.next = 13;
                          return cursor.all();

                        case 13:
                          return _context4.abrupt("return", _context4.sent);

                        case 14:
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
        var _this7 = this;

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
                  return _this7.fetchDocByKey(collection, key);
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
        var _this8 = this;

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
                          return _this8.db.query({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwiZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUiLCJNYXAiLCJkb2NUeXBlIiwiZmlsdGVyIiwiZmlsdGVycyIsImV4aXN0aW5nIiwiZ2V0IiwibGFzdElkIiwiZmlsdGVyc0J5SWQiLCJzZXQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwiaWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwiZG9jIiwiSlNPTiIsInBhcnNlIiwidmFsdWVzIiwidGVzdCIsInB1Ymxpc2giLCJzdGFydCIsImRlYnVnIiwiZXJyIiwiaHR0cFN0YXR1cyIsImJvZHkiLCJzZXRUaW1lb3V0IiwicmVzdGFydFRpbWVvdXQiLCJwYXJlbnQiLCJhcmdzIiwiZmV0Y2hEb2NzIiwicXVlcnkiLCJiaW5kVmFycyIsImJpbmRWYXJzSnNvbiIsImZldGNoUXVlcnkiLCJzdHJpbmdpZnkiLCJfIiwiaXRlciIsImFzeW5jSXRlcmF0b3IiLCJmaWx0ZXJJZCIsImFkZEZpbHRlciIsIl90aGlzIiwibmV4dCIsInZhbHVlIiwicmVtb3ZlRmlsdGVyIiwiZSIsImRhdGEiLCJmZXRjaCIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsImNvZGUiLCJ3cmFwIiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwiam9pbiIsInNvcnRTZWN0aW9uIiwibGltaXQiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiY3Vyc29yIiwiYWxsIiwia2V5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBekJBOzs7Ozs7Ozs7Ozs7Ozs7SUFpQ3FCQSxNOzs7QUFlakIsa0JBQVlDLE1BQVosRUFBNkJDLElBQTdCLEVBQTBDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QyxTQUFLRCxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRSxHQUFMLEdBQVdELElBQUksQ0FBQ0UsTUFBTCxDQUFZLFFBQVosQ0FBWDtBQUNBLFNBQUtDLGFBQUwsR0FBcUJKLE1BQU0sQ0FBQ0ssUUFBUCxDQUFnQkMsTUFBckM7QUFDQSxTQUFLQyxZQUFMLEdBQW9CUCxNQUFNLENBQUNLLFFBQVAsQ0FBZ0JHLElBQXBDO0FBRUEsU0FBS0MsTUFBTCxHQUFjLElBQUlDLG9CQUFKLEVBQWQ7QUFFQSxTQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosQ0FBYTtBQUNuQkMsTUFBQUEsR0FBRyxZQUFLLDRCQUFlLEtBQUtULGFBQXBCLEVBQW1DLE1BQW5DLENBQUw7QUFEZ0IsS0FBYixDQUFWO0FBR0EsU0FBS08s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QUFBLDZDQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUNBQ1EsTUFBSSxDQUFDakYsRUFBTCxDQUFRNkQsS0FBUixDQUFjO0FBQUVBLDRCQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU0MsNEJBQUFBLFFBQVEsRUFBUkE7QUFBVCwyQkFBZCxDQURSOztBQUFBO0FBQ1B3QywwQkFBQUEsTUFETztBQUFBLDREQUVOQSxNQUFNLENBQUNDLEdBQVAsRUFGTTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBVixHIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gJ2FyYW5nb2pzJztcbmltcG9ydCBhcmFuZ29jaGFpciBmcm9tICdhcmFuZ29jaGFpcic7XG5pbXBvcnQgeyBQdWJTdWIsIHdpdGhGaWx0ZXIgfSBmcm9tICdhcG9sbG8tc2VydmVyJztcbmltcG9ydCB7IGVuc3VyZVByb3RvY29sIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcblxudHlwZSBDb2xsZWN0aW9uRmlsdGVycyA9IHtcbiAgICBsYXN0SWQ6IG51bWJlcixcbiAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICBmaWx0ZXJzQnlJZDogTWFwPG51bWJlciwgYW55PlxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICB0cmFuc2FjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYmxvY2tzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgY29sbGVjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbltdO1xuICAgIGxpc3RlbmVyOiBhbnk7XG4gICAgZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWU6IE1hcDxzdHJpbmcsIENvbGxlY3Rpb25GaWx0ZXJzPjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ0FyYW5nbycpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2Uoe1xuICAgICAgICAgICAgdXJsOiBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9YCxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgYXV0aFBhcnRzID0gdGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aC5zcGxpdCgnOicpO1xuICAgICAgICAgICAgdGhpcy5kYi51c2VCYXNpY0F1dGgoYXV0aFBhcnRzWzBdLCBhdXRoUGFydHNbMV0gfHwgJycpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdhY2NvdW50cycpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuZGIuY29sbGVjdGlvbignYmxvY2tzJyk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxuICAgICAgICAgICAgdGhpcy5ibG9ja3NcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZSA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGRGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSwgZmlsdGVyOiBhbnkpOiBudW1iZXIge1xuICAgICAgICBsZXQgZmlsdGVyczogQ29sbGVjdGlvbkZpbHRlcnM7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQoY29sbGVjdGlvbik7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZmlsdGVycyA9IGV4aXN0aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVycyA9IHtcbiAgICAgICAgICAgICAgICBsYXN0SWQ6IDAsXG4gICAgICAgICAgICAgICAgZG9jVHlwZSxcbiAgICAgICAgICAgICAgICBmaWx0ZXJzQnlJZDogbmV3IE1hcCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5zZXQoY29sbGVjdGlvbiwgZmlsdGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgZmlsdGVycy5sYXN0SWQgPSBmaWx0ZXJzLmxhc3RJZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gZmlsdGVycy5sYXN0SWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAoZmlsdGVycy5maWx0ZXJzQnlJZC5oYXMoZmlsdGVycy5sYXN0SWQpKTtcbiAgICAgICAgZmlsdGVycy5maWx0ZXJzQnlJZC5zZXQoZmlsdGVycy5sYXN0SWQsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiBmaWx0ZXJzLmxhc3RJZDtcbiAgICB9XG5cbiAgICByZW1vdmVGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBpZDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlcnMgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChjb2xsZWN0aW9uKTtcbiAgICAgICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLmZpbHRlcnNCeUlkLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSBmaWx0ZXIgJHtjb2xsZWN0aW9ufVske2lkfV06IGZpbHRlciBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIucmVxLm9wdHMuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJhc2ljICR7dXNlclBhc3N3b3JkfWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShkb2NKc29uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWx0ZXIgb2YgZmlsdGVycy5maWx0ZXJzQnlJZC52YWx1ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlciB8fCB7fSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIucHVibGlzaChuYW1lLCB7IFtuYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTGlzdGVuIGRhdGFiYXNlJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdGlvblF1ZXJ5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgUXVlcnkgJHtjb2xsZWN0aW9uLm5hbWV9YCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaERvY3MoY29sbGVjdGlvbiwgYXJncywgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcihjb2xsZWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJJZCA9IHRoaXMuYWRkRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZG9jVHlwZSwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KG51bGwsIGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1YnNjcmlwdGlvbl0gZG9jIHRlc3QgZmFpbGVkJywgZGF0YSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBgRklMVEVSICR7ZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnkgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5fWAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uLCBrZXkpKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==