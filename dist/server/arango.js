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

var _arangoTypes = require("./arango-types");

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
                  var filter, context, filterSection, orderBy, sortSection, limit, limitSection, query, cursor;
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          filter = args.filter || {};
                          context = new _arangoTypes.QLContext();
                          filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(docType.ql(context, 'doc', filter)) : '';
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
                            bindVars: context.vars
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXNlRGF0YWJhc2UiLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwiZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUiLCJNYXAiLCJkb2NUeXBlIiwiZmlsdGVyIiwiZmlsdGVycyIsImV4aXN0aW5nIiwiZ2V0IiwibGFzdElkIiwiZmlsdGVyc0J5SWQiLCJzZXQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwiaWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJmb3JFYWNoIiwic3Vic2NyaWJlIiwib24iLCJkb2NKc29uIiwidHlwZSIsImRvYyIsIkpTT04iLCJwYXJzZSIsInZhbHVlcyIsInRlc3QiLCJwdWJsaXNoIiwic3RhcnQiLCJkZWJ1ZyIsImVyciIsImh0dHBTdGF0dXMiLCJoZWFkZXJzIiwiYm9keSIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsInBhcmVudCIsImFyZ3MiLCJmZXRjaERvY3MiLCJxdWVyeSIsImJpbmRWYXJzIiwiYmluZFZhcnNKc29uIiwiZmV0Y2hRdWVyeSIsInN0cmluZ2lmeSIsIl8iLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsImZpbHRlcklkIiwiYWRkRmlsdGVyIiwiX3RoaXMiLCJuZXh0IiwidmFsdWUiLCJyZW1vdmVGaWx0ZXIiLCJlIiwiZGF0YSIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJjb2RlIiwid3JhcCIsImNvbnRleHQiLCJRTENvbnRleHQiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsInFsIiwib3JkZXJCeSIsIm1hcCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInZhcnMiLCJjdXJzb3IiLCJhbGwiLCJrZXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFJQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztJQWdDcUJBLE07OztBQWVqQixrQkFBWUMsTUFBWixFQUE2QkMsSUFBN0IsRUFBMEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RDLFNBQUtELE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtFLEdBQUwsR0FBV0QsSUFBSSxDQUFDRSxNQUFMLENBQVksUUFBWixDQUFYO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQkosTUFBTSxDQUFDSyxRQUFQLENBQWdCQyxNQUFyQztBQUNBLFNBQUtDLFlBQUwsR0FBb0JQLE1BQU0sQ0FBQ0ssUUFBUCxDQUFnQkcsSUFBcEM7QUFFQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsb0JBQUosRUFBZDtBQUVBLFNBQUtDLEVBQUwsR0FBVSxJQUFJQyxrQkFBSixrQkFBdUIsS0FBS1IsYUFBNUIsRUFBVjtBQUNBLFNBQUtPLEVBQUwsQ0FBUUUsV0FBUixDQUFvQixLQUFLTixZQUF6QjtBQUVBLFNBQUtPLFlBQUwsR0FBb0IsS0FBS0gsRUFBTCxDQUFRSSxVQUFSLENBQW1CLGNBQW5CLENBQXBCO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixLQUFLTCxFQUFMLENBQVFJLFVBQVIsQ0FB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QUFPLENBQUNGLEdBQVIsQ0FBWWxCLElBQUksQ0FBQ0ksR0FBTCxDQUFTLFVBQUFlLEdBQUc7QUFBQSx5QkFBSSxNQUFJLENBQUNJLGFBQUwsQ0FBbUIvRixVQUFuQixFQUErQjJGLEdBQS9CLENBQUo7QUFBQSxpQkFBWixDQUFaLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREFHTTdDLEssRUFBWUMsUTs7Ozs7OzttREFDbEIsS0FBS29CLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlDQUNRLE1BQUksQ0FBQ3ZFLEVBQUwsQ0FBUWtELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQMEMsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgeyBRTENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9hcmFuZ28tdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUUNvbmZpZyB9IGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcblxudHlwZSBDb2xsZWN0aW9uRmlsdGVycyA9IHtcbiAgICBsYXN0SWQ6IG51bWJlcixcbiAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICBmaWx0ZXJzQnlJZDogTWFwPG51bWJlciwgYW55PlxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBcmFuZ28ge1xuICAgIGNvbmZpZzogUUNvbmZpZztcbiAgICBsb2c6IFFMb2c7XG4gICAgc2VydmVyQWRkcmVzczogc3RyaW5nO1xuICAgIGRhdGFiYXNlTmFtZTogc3RyaW5nO1xuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICB0cmFuc2FjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBtZXNzYWdlczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGFjY291bnRzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYmxvY2tzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgY29sbGVjdGlvbnM6IERvY3VtZW50Q29sbGVjdGlvbltdO1xuICAgIGxpc3RlbmVyOiBhbnk7XG4gICAgZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWU6IE1hcDxzdHJpbmcsIENvbGxlY3Rpb25GaWx0ZXJzPjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbmZpZzogUUNvbmZpZywgbG9nczogUUxvZ3MpIHtcbiAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUoJ0FyYW5nbycpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gbmV3IFB1YlN1YigpO1xuXG4gICAgICAgIHRoaXMuZGIgPSBuZXcgRGF0YWJhc2UoYGh0dHA6Ly8ke3RoaXMuc2VydmVyQWRkcmVzc31gKTtcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdhY2NvdW50cycpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuZGIuY29sbGVjdGlvbignYmxvY2tzJyk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxuICAgICAgICAgICAgdGhpcy5ibG9ja3NcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZSA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGRGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSwgZmlsdGVyOiBhbnkpOiBudW1iZXIge1xuICAgICAgICBsZXQgZmlsdGVyczogQ29sbGVjdGlvbkZpbHRlcnM7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQoY29sbGVjdGlvbik7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZmlsdGVycyA9IGV4aXN0aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVycyA9IHtcbiAgICAgICAgICAgICAgICBsYXN0SWQ6IDAsXG4gICAgICAgICAgICAgICAgZG9jVHlwZSxcbiAgICAgICAgICAgICAgICBmaWx0ZXJzQnlJZDogbmV3IE1hcCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5zZXQoY29sbGVjdGlvbiwgZmlsdGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgZmlsdGVycy5sYXN0SWQgPSBmaWx0ZXJzLmxhc3RJZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gZmlsdGVycy5sYXN0SWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAoZmlsdGVycy5maWx0ZXJzQnlJZC5oYXMoZmlsdGVycy5sYXN0SWQpKTtcbiAgICAgICAgZmlsdGVycy5maWx0ZXJzQnlJZC5zZXQoZmlsdGVycy5sYXN0SWQsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiBmaWx0ZXJzLmxhc3RJZDtcbiAgICB9XG5cbiAgICByZW1vdmVGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBpZDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlcnMgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChjb2xsZWN0aW9uKTtcbiAgICAgICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLmZpbHRlcnNCeUlkLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSBmaWx0ZXIgJHtjb2xsZWN0aW9ufVske2lkfV06IGZpbHRlciBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgaHR0cDovLyR7dGhpcy5zZXJ2ZXJBZGRyZXNzfS8ke3RoaXMuZGF0YWJhc2VOYW1lfWA7XG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXJhbmdvY2hhaXIobGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShkb2NKc29uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWx0ZXIgb2YgZmlsdGVycy5maWx0ZXJzQnlJZC52YWx1ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJzLmRvY1R5cGUudGVzdChkb2MsIGZpbHRlciB8fCB7fSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIucHVibGlzaChuYW1lLCB7IFtuYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTGlzdGVuIGRhdGFiYXNlJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdGlvblF1ZXJ5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgUXVlcnkgJHtjb2xsZWN0aW9uLm5hbWV9YCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaERvY3MoY29sbGVjdGlvbiwgYXJncywgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcihjb2xsZWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJJZCA9IHRoaXMuYWRkRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZG9jVHlwZSwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB3cmFwPFI+KGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRGIgb3BlcmF0aW9uIGZhaWxlZDogJywgZXJyKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBRTENvbnRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGBGSUxURVIgJHtkb2NUeXBlLnFsKGNvbnRleHQsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnkgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5fWAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiBjb250ZXh0LnZhcnMgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY0J5S2V5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGNvbGxlY3Rpb24sIGtleSkpKTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19