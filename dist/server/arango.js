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
    this.db = new _arangojs.Database("http://".concat(this.serverAddress));
    this.db.useDatabase(this.databaseName);
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

      var listenerUrl = "http://".concat(this.serverAddress, "/").concat(this.databaseName);
      this.listener = new _arangochair["default"](listenerUrl);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwiZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUiLCJNYXAiLCJkb2NUeXBlIiwiZmlsdGVyIiwiZmlsdGVycyIsImV4aXN0aW5nIiwiZ2V0IiwibGFzdElkIiwiZmlsdGVyc0J5SWQiLCJzZXQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwiaWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJmb3JFYWNoIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwidHlwZSIsImRvYyIsIkpTT04iLCJwYXJzZSIsInZhbHVlcyIsInRlc3QiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsInBhcmVudCIsImFyZ3MiLCJmZXRjaERvY3MiLCJxdWVyeSIsImJpbmRWYXJzIiwiYmluZFZhcnNKc29uIiwiZmV0Y2hRdWVyeSIsInN0cmluZ2lmeSIsIl8iLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsImZpbHRlcklkIiwiYWRkRmlsdGVyIiwiX3RoaXMiLCJuZXh0IiwidmFsdWUiLCJyZW1vdmVGaWx0ZXIiLCJlIiwiZGF0YSIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJjb2RlIiwid3JhcCIsInBhcmFtcyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsInFsIiwib3JkZXJCeSIsIm1hcCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciIsImFsbCIsImtleSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUlBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O0lBZ0NxQkEsTTs7O0FBZWpCLGtCQUFZQyxNQUFaLEVBQTZCQyxJQUE3QixFQUEwQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDdEMsU0FBS0QsTUFBTCxHQUFjQSxNQUFkO0FBQ0EsU0FBS0UsR0FBTCxHQUFXRCxJQUFJLENBQUNFLE1BQUwsQ0FBWSxRQUFaLENBQVg7QUFDQSxTQUFLQyxhQUFMLEdBQXFCSixNQUFNLENBQUNLLFFBQVAsQ0FBZ0JDLE1BQXJDO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQlAsTUFBTSxDQUFDSyxRQUFQLENBQWdCRyxJQUFwQztBQUVBLFNBQUtDLE1BQUwsR0FBYyxJQUFJQyxvQkFBSixFQUFkO0FBRUEsU0FBS0MsRUFBTCxHQUFVLElBQUlDLGtCQUFKLGtCQUF1QixLQUFLUixhQUE1QixFQUFWO0FBQ0EsU0FBS08sRUFBTCxDQUFRRSxXQUFSLENBQW9CLEtBQUtOLFlBQXpCO0FBRUEsU0FBS08sWUFBTCxHQUFvQixLQUFLSCxFQUFMLENBQVFJLFVBQVIsQ0FBbUIsY0FBbkIsQ0FBcEI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEtBQUtMLEVBQUwsQ0FBUUksVUFBUixDQUFtQixVQUFuQixD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LEM7OztrREFFSkQsT0FBTyxDQUFDRixHQUFSLENBQVlqQixJQUFJLENBQUNJLEdBQUwsQ0FBUyxVQUFBYyxHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDSSxhQUFMLENBQW1COUYsVUFBbkIsRUFBK0IwRixHQUEvQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0RBR001QyxLLEVBQVlDLFE7Ozs7Ozs7bURBQ2xCLEtBQUtvQixJQUFMO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkNBQVU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQ0FDUSxNQUFJLENBQUN2RSxFQUFMLENBQVFrRCxLQUFSLENBQWM7QUFBRUEsNEJBQUFBLEtBQUssRUFBTEEsS0FBRjtBQUFTQyw0QkFBQUEsUUFBUSxFQUFSQTtBQUFULDJCQUFkLENBRFI7O0FBQUE7QUFDUHlDLDBCQUFBQSxNQURPO0FBQUEsNERBRU5BLE1BQU0sQ0FBQ0MsR0FBUCxFQUZNOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFWLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5cbnR5cGUgQ29sbGVjdGlvbkZpbHRlcnMgPSB7XG4gICAgbGFzdElkOiBudW1iZXIsXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgZmlsdGVyc0J5SWQ6IE1hcDxudW1iZXIsIGFueT5cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuICAgIGZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uRmlsdGVycz47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IG5ldyBQdWJTdWIoKTtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9YCk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gdGhpcy5kYi5jb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IHRoaXMuZGIuY29sbGVjdGlvbignbWVzc2FnZXMnKTtcbiAgICAgICAgdGhpcy5hY2NvdW50cyA9IHRoaXMuZGIuY29sbGVjdGlvbignYWNjb3VudHMnKTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2Jsb2NrcycpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zID0gW1xuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMsXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzLFxuICAgICAgICAgICAgdGhpcy5hY2NvdW50cyxcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkRmlsdGVyKGNvbGxlY3Rpb246IHN0cmluZywgZG9jVHlwZTogUVR5cGUsIGZpbHRlcjogYW55KTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGZpbHRlcnM6IENvbGxlY3Rpb25GaWx0ZXJzO1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KGNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSBleGlzdGluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSB7XG4gICAgICAgICAgICAgICAgbGFzdElkOiAwLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgZmlsdGVyc0J5SWQ6IG5ldyBNYXAoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuc2V0KGNvbGxlY3Rpb24sIGZpbHRlcnMpO1xuICAgICAgICB9XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGZpbHRlcnMubGFzdElkID0gZmlsdGVycy5sYXN0SWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGZpbHRlcnMubGFzdElkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKGZpbHRlcnMuZmlsdGVyc0J5SWQuaGFzKGZpbHRlcnMubGFzdElkKSk7XG4gICAgICAgIGZpbHRlcnMuZmlsdGVyc0J5SWQuc2V0KGZpbHRlcnMubGFzdElkLCBmaWx0ZXIpO1xuICAgICAgICByZXR1cm4gZmlsdGVycy5sYXN0SWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlRmlsdGVyKGNvbGxlY3Rpb246IHN0cmluZywgaWQ6IG51bWJlcikge1xuICAgICAgICBjb25zdCBmaWx0ZXJzID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQoY29sbGVjdGlvbik7XG4gICAgICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5maWx0ZXJzQnlJZC5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgZmlsdGVyICR7Y29sbGVjdGlvbn1bJHtpZH1dOiBmaWx0ZXIgZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc30vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IEpTT04ucGFyc2UoZG9jSnNvbik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcnMgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsdGVyIG9mIGZpbHRlcnMuZmlsdGVyc0J5SWQudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVycy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBmaWx0ZXIgfHwge30pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2gobmFtZSwgeyBbbmFtZV06IGRvYyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0xpc3RlbiBkYXRhYmFzZScsIGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignTGlzdGVuZXIgZmFpbGVkOiAnLCB7IGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSB9KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lci5zdGFydCgpLCB0aGlzLmNvbmZpZy5saXN0ZW5lci5yZXN0YXJ0VGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbGxlY3Rpb25RdWVyeShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGZpbHRlcjogYW55KSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFF1ZXJ5ICR7Y29sbGVjdGlvbi5uYW1lfWAsIGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hEb2NzKGNvbGxlY3Rpb24sIGFyZ3MsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RRdWVyeSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGFyZ3MucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBiaW5kVmFycyA9IEpTT04ucGFyc2UoYXJncy5iaW5kVmFyc0pzb24pO1xuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGF3YWl0IHRoaXMuZmV0Y2hRdWVyeShxdWVyeSwgYmluZFZhcnMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY29sbGVjdGlvblN1YnNjcmlwdGlvbihjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGRvY1R5cGU6IFFUeXBlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IHdpdGhGaWx0ZXIoXG4gICAgICAgICAgICAgICAgKF8sIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlciA9IHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IoY29sbGVjdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsdGVySWQgPSB0aGlzLmFkZEZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGRvY1R5cGUsIGFyZ3MuZmlsdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCh2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIubmV4dCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuKHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVGaWx0ZXIoY29sbGVjdGlvbi5uYW1lLCBmaWx0ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIucmV0dXJuKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyhlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVGaWx0ZXIoY29sbGVjdGlvbi5uYW1lLCBmaWx0ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIudGhyb3coZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZGF0YSwgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvY1R5cGUudGVzdChudWxsLCBkYXRhW2NvbGxlY3Rpb24ubmFtZV0sIGFyZ3MuZmlsdGVyIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1YnNjcmlwdGlvbl0gZG9jIHRlc3QgZmFpbGVkJywgZGF0YSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBgRklMVEVSICR7ZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnkgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5fWAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uLCBrZXkpKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==