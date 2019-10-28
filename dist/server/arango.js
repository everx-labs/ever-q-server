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

                  if (filters.docType.test(doc, _filter || {})) {
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
                          return _this6.db.query({
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwiZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUiLCJNYXAiLCJkb2NUeXBlIiwiZmlsdGVyIiwiZmlsdGVycyIsImV4aXN0aW5nIiwiZ2V0IiwibGFzdElkIiwiZmlsdGVyc0J5SWQiLCJzZXQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwiaWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJmb3JFYWNoIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwidHlwZSIsImRvYyIsIkpTT04iLCJwYXJzZSIsInZhbHVlcyIsInRlc3QiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsInBhcmVudCIsImFyZ3MiLCJmZXRjaERvY3MiLCJxdWVyeSIsImJpbmRWYXJzIiwiYmluZFZhcnNKc29uIiwiZmV0Y2hRdWVyeSIsInN0cmluZ2lmeSIsIl8iLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsImZpbHRlcklkIiwiYWRkRmlsdGVyIiwiX3RoaXMiLCJuZXh0IiwidmFsdWUiLCJyZW1vdmVGaWx0ZXIiLCJlIiwiZGF0YSIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJjb2RlIiwid3JhcCIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwiam9pbiIsInNvcnRTZWN0aW9uIiwibGltaXQiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiY3Vyc29yIiwiYWxsIiwia2V5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBdkJBOzs7Ozs7Ozs7Ozs7Ozs7SUErQnFCQSxNOzs7QUFlakIsa0JBQVlDLE1BQVosRUFBNkJDLElBQTdCLEVBQTBDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QyxTQUFLRCxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLRSxHQUFMLEdBQVdELElBQUksQ0FBQ0UsTUFBTCxDQUFZLFFBQVosQ0FBWDtBQUNBLFNBQUtDLGFBQUwsR0FBcUJKLE1BQU0sQ0FBQ0ssUUFBUCxDQUFnQkMsTUFBckM7QUFDQSxTQUFLQyxZQUFMLEdBQW9CUCxNQUFNLENBQUNLLFFBQVAsQ0FBZ0JHLElBQXBDO0FBRUEsU0FBS0MsTUFBTCxHQUFjLElBQUlDLG9CQUFKLEVBQWQ7QUFFQSxTQUFLQyxFQUFMLEdBQVUsSUFBSUMsa0JBQUosa0JBQXVCLEtBQUtSLGFBQTVCLEVBQVY7QUFDQSxTQUFLTyxFQUFMLENBQVFFLFdBQVIsQ0FBb0IsS0FBS04sWUFBekI7QUFFQSxTQUFLTyxZQUFMLEdBQW9CLEtBQUtILEVBQUwsQ0FBUUksVUFBUixDQUFtQixjQUFuQixDQUFwQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0IsS0FBS0wsRUFBTCxDQUFRSSxVQUFSLENBQW1CLFVBQW5CLENBQWhCO0FBQ0EsU0FBS0UsUUFBTCxHQUFn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QS9CLENBQUo7QUFBQSxpQkFBWixDQUFaLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREFHTTFDLEssRUFBWUMsUTs7Ozs7OzttREFDbEIsS0FBS29CLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlDQUNRLE1BQUksQ0FBQ3ZFLEVBQUwsQ0FBUWtELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQdUMsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vYXJhbmdvLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5cbnR5cGUgQ29sbGVjdGlvbkZpbHRlcnMgPSB7XG4gICAgbGFzdElkOiBudW1iZXIsXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgZmlsdGVyc0J5SWQ6IE1hcDxudW1iZXIsIGFueT5cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuICAgIGZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uRmlsdGVycz47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IG5ldyBQdWJTdWIoKTtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKGBodHRwOi8vJHt0aGlzLnNlcnZlckFkZHJlc3N9YCk7XG4gICAgICAgIHRoaXMuZGIudXNlRGF0YWJhc2UodGhpcy5kYXRhYmFzZU5hbWUpO1xuXG4gICAgICAgIHRoaXMudHJhbnNhY3Rpb25zID0gdGhpcy5kYi5jb2xsZWN0aW9uKCd0cmFuc2FjdGlvbnMnKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlcyA9IHRoaXMuZGIuY29sbGVjdGlvbignbWVzc2FnZXMnKTtcbiAgICAgICAgdGhpcy5hY2NvdW50cyA9IHRoaXMuZGIuY29sbGVjdGlvbignYWNjb3VudHMnKTtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2Jsb2NrcycpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zID0gW1xuICAgICAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMsXG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VzLFxuICAgICAgICAgICAgdGhpcy5hY2NvdW50cyxcbiAgICAgICAgICAgIHRoaXMuYmxvY2tzXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkRmlsdGVyKGNvbGxlY3Rpb246IHN0cmluZywgZG9jVHlwZTogUVR5cGUsIGZpbHRlcjogYW55KTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGZpbHRlcnM6IENvbGxlY3Rpb25GaWx0ZXJzO1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KGNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSBleGlzdGluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSB7XG4gICAgICAgICAgICAgICAgbGFzdElkOiAwLFxuICAgICAgICAgICAgICAgIGRvY1R5cGUsXG4gICAgICAgICAgICAgICAgZmlsdGVyc0J5SWQ6IG5ldyBNYXAoKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuc2V0KGNvbGxlY3Rpb24sIGZpbHRlcnMpO1xuICAgICAgICB9XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGZpbHRlcnMubGFzdElkID0gZmlsdGVycy5sYXN0SWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGZpbHRlcnMubGFzdElkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKGZpbHRlcnMuZmlsdGVyc0J5SWQuaGFzKGZpbHRlcnMubGFzdElkKSk7XG4gICAgICAgIGZpbHRlcnMuZmlsdGVyc0J5SWQuc2V0KGZpbHRlcnMubGFzdElkLCBmaWx0ZXIpO1xuICAgICAgICByZXR1cm4gZmlsdGVycy5sYXN0SWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlRmlsdGVyKGNvbGxlY3Rpb246IHN0cmluZywgaWQ6IG51bWJlcikge1xuICAgICAgICBjb25zdCBmaWx0ZXJzID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQoY29sbGVjdGlvbik7XG4gICAgICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5maWx0ZXJzQnlJZC5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgZmlsdGVyICR7Y29sbGVjdGlvbn1bJHtpZH1dOiBmaWx0ZXIgZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyVXJsID0gYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc30vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucy5mb3JFYWNoKGNvbGxlY3Rpb24gPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGNvbGxlY3Rpb24ubmFtZTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIuc3Vic2NyaWJlKHsgY29sbGVjdGlvbjogbmFtZSB9KTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIub24obmFtZSwgKGRvY0pzb24sIHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2luc2VydC91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IEpTT04ucGFyc2UoZG9jSnNvbik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcnMgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgZmlsdGVyIG9mIGZpbHRlcnMuZmlsdGVyc0J5SWQudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVycy5kb2NUeXBlLnRlc3QoZG9jLCBmaWx0ZXIgfHwge30pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2gobmFtZSwgeyBbbmFtZV06IGRvYyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIuc3RhcnQoKTtcbiAgICAgICAgdGhpcy5sb2cuZGVidWcoJ0xpc3RlbiBkYXRhYmFzZScsIGxpc3RlbmVyVXJsKTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5vbignZXJyb3InLCAoZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignTGlzdGVuZXIgZmFpbGVkOiAnLCB7IGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSB9KTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5saXN0ZW5lci5zdGFydCgpLCB0aGlzLmNvbmZpZy5saXN0ZW5lci5yZXN0YXJ0VGltZW91dCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbGxlY3Rpb25RdWVyeShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGZpbHRlcjogYW55KSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFF1ZXJ5ICR7Y29sbGVjdGlvbi5uYW1lfWAsIGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hEb2NzKGNvbGxlY3Rpb24sIGFyZ3MsIGZpbHRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RRdWVyeSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGFyZ3MucXVlcnk7XG4gICAgICAgICAgICBjb25zdCBiaW5kVmFycyA9IEpTT04ucGFyc2UoYXJncy5iaW5kVmFyc0pzb24pO1xuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGF3YWl0IHRoaXMuZmV0Y2hRdWVyeShxdWVyeSwgYmluZFZhcnMpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgY29sbGVjdGlvblN1YnNjcmlwdGlvbihjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGRvY1R5cGU6IFFUeXBlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IHdpdGhGaWx0ZXIoXG4gICAgICAgICAgICAgICAgKF8sIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlciA9IHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IoY29sbGVjdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsdGVySWQgPSB0aGlzLmFkZEZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGRvY1R5cGUsIGFyZ3MuZmlsdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCh2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIubmV4dCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuKHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVGaWx0ZXIoY29sbGVjdGlvbi5uYW1lLCBmaWx0ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIucmV0dXJuKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyhlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVGaWx0ZXIoY29sbGVjdGlvbi5uYW1lLCBmaWx0ZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZXIudGhyb3coZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAoZGF0YSwgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRvY1R5cGUudGVzdChkYXRhW2NvbGxlY3Rpb24ubmFtZV0sIGFyZ3MuZmlsdGVyIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1YnNjcmlwdGlvbl0gZG9jIHRlc3QgZmFpbGVkJywgZGF0YSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGBGSUxURVIgJHtkb2NUeXBlLnFsKCdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnkgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5fWAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiB7fSB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoY29sbGVjdGlvbiwga2V5KSkpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoUXVlcnkocXVlcnk6IGFueSwgYmluZFZhcnM6IGFueSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=