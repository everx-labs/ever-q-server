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
      this.db.useBasicAuth(authParts[0], authParts.slice(1).join(':'));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQXJhbmdvIiwiY29uZmlnIiwibG9ncyIsImxvZyIsImNyZWF0ZSIsInNlcnZlckFkZHJlc3MiLCJkYXRhYmFzZSIsInNlcnZlciIsImRhdGFiYXNlTmFtZSIsIm5hbWUiLCJwdWJzdWIiLCJQdWJTdWIiLCJkYiIsIkRhdGFiYXNlIiwidXJsIiwidXNlRGF0YWJhc2UiLCJhdXRoIiwiYXV0aFBhcnRzIiwic3BsaXQiLCJ1c2VCYXNpY0F1dGgiLCJzbGljZSIsImpvaW4iLCJ0cmFuc2FjdGlvbnMiLCJjb2xsZWN0aW9uIiwibWVzc2FnZXMiLCJhY2NvdW50cyIsImJsb2NrcyIsImNvbGxlY3Rpb25zIiwiZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUiLCJNYXAiLCJkb2NUeXBlIiwiZmlsdGVyIiwiZmlsdGVycyIsImV4aXN0aW5nIiwiZ2V0IiwibGFzdElkIiwiZmlsdGVyc0J5SWQiLCJzZXQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwiaWQiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwiZG9jIiwiSlNPTiIsInBhcnNlIiwidmFsdWVzIiwidGVzdCIsInB1Ymxpc2giLCJzdGFydCIsImRlYnVnIiwiZXJyIiwiaHR0cFN0YXR1cyIsImJvZHkiLCJzZXRUaW1lb3V0IiwicmVzdGFydFRpbWVvdXQiLCJwYXJlbnQiLCJhcmdzIiwiZmV0Y2hEb2NzIiwicXVlcnkiLCJiaW5kVmFycyIsImJpbmRWYXJzSnNvbiIsImZldGNoUXVlcnkiLCJzdHJpbmdpZnkiLCJfIiwiaXRlciIsImFzeW5jSXRlcmF0b3IiLCJmaWx0ZXJJZCIsImFkZEZpbHRlciIsIl90aGlzIiwibmV4dCIsInZhbHVlIiwicmVtb3ZlRmlsdGVyIiwiZSIsImRhdGEiLCJmZXRjaCIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsImNvZGUiLCJ3cmFwIiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJjdXJzb3IiLCJhbGwiLCJrZXkiLCJQcm9taXNlIiwicmVzb2x2ZSIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFJQTs7QUF6QkE7Ozs7Ozs7Ozs7Ozs7OztJQWlDcUJBLE07OztBQWVqQixrQkFBWUMsTUFBWixFQUE2QkMsSUFBN0IsRUFBMEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RDLFNBQUtELE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtFLEdBQUwsR0FBV0QsSUFBSSxDQUFDRSxNQUFMLENBQVksUUFBWixDQUFYO0FBQ0EsU0FBS0MsYUFBTCxHQUFxQkosTUFBTSxDQUFDSyxRQUFQLENBQWdCQyxNQUFyQztBQUNBLFNBQUtDLFlBQUwsR0FBb0JQLE1BQU0sQ0FBQ0ssUUFBUCxDQUFnQkcsSUFBcEM7QUFFQSxTQUFLQyxNQUFMLEdBQWMsSUFBSUMsb0JBQUosRUFBZDtBQUVBLFNBQUtDLEVBQUwsR0FBVSxJQUFJQyxrQkFBSixDQUFhO0FBQ25CQyxNQUFBQSxHQUFHLFlBQUssNEJBQWUsS0FBS1QsYUFBcEIsRUFBbUMsTUFBbkMsQ0FBTDtBQURnQixLQUFiLENBQVY7QUFH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OzttREFDbEIsS0FBS21CLElBQUw7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBVTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlDQUNRLE1BQUksQ0FBQ25GLEVBQUwsQ0FBUStELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQdUMsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5cbnR5cGUgQ29sbGVjdGlvbkZpbHRlcnMgPSB7XG4gICAgbGFzdElkOiBudW1iZXIsXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgZmlsdGVyc0J5SWQ6IE1hcDxudW1iZXIsIGFueT5cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuICAgIGZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uRmlsdGVycz47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXJBZGRyZXNzID0gY29uZmlnLmRhdGFiYXNlLnNlcnZlcjtcbiAgICAgICAgdGhpcy5kYXRhYmFzZU5hbWUgPSBjb25maWcuZGF0YWJhc2UubmFtZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IG5ldyBQdWJTdWIoKTtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKHtcbiAgICAgICAgICAgIHVybDogYCR7ZW5zdXJlUHJvdG9jb2wodGhpcy5zZXJ2ZXJBZGRyZXNzLCAnaHR0cCcpfWAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRiLnVzZURhdGFiYXNlKHRoaXMuZGF0YWJhc2VOYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhQYXJ0cyA9IHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGguc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHRoaXMuZGIudXNlQmFzaWNBdXRoKGF1dGhQYXJ0c1swXSwgYXV0aFBhcnRzLnNsaWNlKDEpLmpvaW4oJzonKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IHRoaXMuZGIuY29sbGVjdGlvbigndHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ21lc3NhZ2VzJyk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2FjY291bnRzJyk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdibG9ja3MnKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb25zLFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcyxcbiAgICAgICAgICAgIHRoaXMuYWNjb3VudHMsXG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1xuICAgICAgICBdO1xuICAgICAgICB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZEZpbHRlcihjb2xsZWN0aW9uOiBzdHJpbmcsIGRvY1R5cGU6IFFUeXBlLCBmaWx0ZXI6IGFueSk6IG51bWJlciB7XG4gICAgICAgIGxldCBmaWx0ZXJzOiBDb2xsZWN0aW9uRmlsdGVycztcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChjb2xsZWN0aW9uKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBmaWx0ZXJzID0gZXhpc3Rpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWx0ZXJzID0ge1xuICAgICAgICAgICAgICAgIGxhc3RJZDogMCxcbiAgICAgICAgICAgICAgICBkb2NUeXBlLFxuICAgICAgICAgICAgICAgIGZpbHRlcnNCeUlkOiBuZXcgTWFwKClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLnNldChjb2xsZWN0aW9uLCBmaWx0ZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBmaWx0ZXJzLmxhc3RJZCA9IGZpbHRlcnMubGFzdElkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBmaWx0ZXJzLmxhc3RJZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlIChmaWx0ZXJzLmZpbHRlcnNCeUlkLmhhcyhmaWx0ZXJzLmxhc3RJZCkpO1xuICAgICAgICBmaWx0ZXJzLmZpbHRlcnNCeUlkLnNldChmaWx0ZXJzLmxhc3RJZCwgZmlsdGVyKTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcnMubGFzdElkO1xuICAgIH1cblxuICAgIHJlbW92ZUZpbHRlcihjb2xsZWN0aW9uOiBzdHJpbmcsIGlkOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KGNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAoZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuZmlsdGVyc0J5SWQuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlIGZpbHRlciAke2NvbGxlY3Rpb259WyR7aWR9XTogZmlsdGVyIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX0vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcblxuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclBhc3N3b3JkID0gQnVmZmVyLmZyb20odGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5yZXEub3B0cy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmFzaWMgJHt1c2VyUGFzc3dvcmR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGRvY0pzb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJzID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbHRlciBvZiBmaWx0ZXJzLmZpbHRlcnNCeUlkLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcnMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyIHx8IHt9KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YnN1Yi5wdWJsaXNoKG5hbWUsIHsgW25hbWVdOiBkb2MgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMaXN0ZW4gZGF0YWJhc2UnLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0xpc3RlbmVyIGZhaWxlZDogJywgeyBlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb2xsZWN0aW9uUXVlcnkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKGBRdWVyeSAke2NvbGxlY3Rpb24ubmFtZX1gLCBhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZldGNoRG9jcyhjb2xsZWN0aW9uLCBhcmdzLCBmaWx0ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VsZWN0UXVlcnkoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBhcmdzLnF1ZXJ5O1xuICAgICAgICAgICAgY29uc3QgYmluZFZhcnMgPSBKU09OLnBhcnNlKGFyZ3MuYmluZFZhcnNKc29uKTtcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhd2FpdCB0aGlzLmZldGNoUXVlcnkocXVlcnksIGJpbmRWYXJzKSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGNvbGxlY3Rpb25TdWJzY3JpcHRpb24oY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiB3aXRoRmlsdGVyKFxuICAgICAgICAgICAgICAgIChfLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZXIgPSB0aGlzLnB1YnN1Yi5hc3luY0l0ZXJhdG9yKGNvbGxlY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbHRlcklkID0gdGhpcy5hZGRGaWx0ZXIoY29sbGVjdGlvbi5uYW1lLCBkb2NUeXBlLCBhcmdzLmZpbHRlcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQodmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLm5leHQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybih2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZmlsdGVySWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnJldHVybih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3coZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZmlsdGVySWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnRocm93KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGRhdGEsIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkb2NUeXBlLnRlc3QobnVsbCwgZGF0YVtjb2xsZWN0aW9uLm5hbWVdLCBhcmdzLmZpbHRlciB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyB3cmFwPFI+KGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmxvZy5lcnJvcignRGIgb3BlcmF0aW9uIGZhaWxlZDogJywgZXJyKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgYXJnczogYW55LCBkb2NUeXBlOiBRVHlwZSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGBGSUxURVIgJHtkb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5ID0gKGFyZ3Mub3JkZXJCeSB8fCBbXSlcbiAgICAgICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeSAhPT0gJycgPyBgU09SVCAke29yZGVyQnl9YCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihhcmdzLmxpbWl0IHx8IDUwLCA1MCk7XG4gICAgICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdH1gO1xuXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHtjb2xsZWN0aW9uLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkoeyBxdWVyeSwgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXMgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY0J5S2V5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGNvbGxlY3Rpb24sIGtleSkpKTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaFF1ZXJ5KHF1ZXJ5OiBhbnksIGJpbmRWYXJzOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19