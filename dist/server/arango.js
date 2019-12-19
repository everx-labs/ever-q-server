"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.ChangeLog = void 0;

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

var _tracer = require("./tracer");

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
var ChangeLog =
/*#__PURE__*/
function () {
  function ChangeLog() {
    (0, _classCallCheck2["default"])(this, ChangeLog);
    (0, _defineProperty2["default"])(this, "enabled", void 0);
    (0, _defineProperty2["default"])(this, "records", void 0);
    this.enabled = false;
    this.records = new Map();
  }

  (0, _createClass2["default"])(ChangeLog, [{
    key: "clear",
    value: function clear() {
      this.records.clear();
    }
  }, {
    key: "log",
    value: function log(id, time) {
      if (!this.enabled) {
        return;
      }

      var existing = this.records.get(id);

      if (existing) {
        existing.push(time);
      } else {
        this.records.set(id, [time]);
      }
    }
  }, {
    key: "get",
    value: function get(id) {
      return this.records.get(id) || [];
    }
  }]);
  return ChangeLog;
}();

exports.ChangeLog = ChangeLog;

var Arango =
/*#__PURE__*/
function () {
  function Arango(config, logs, tracer) {
    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "serverAddress", void 0);
    (0, _defineProperty2["default"])(this, "databaseName", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "transactions", void 0);
    (0, _defineProperty2["default"])(this, "messages", void 0);
    (0, _defineProperty2["default"])(this, "accounts", void 0);
    (0, _defineProperty2["default"])(this, "blocks", void 0);
    (0, _defineProperty2["default"])(this, "collections", void 0);
    (0, _defineProperty2["default"])(this, "listener", void 0);
    (0, _defineProperty2["default"])(this, "pubsub", void 0);
    (0, _defineProperty2["default"])(this, "filtersByCollectionName", void 0);
    this.config = config;
    this.log = logs.create('Arango');
    this.changeLog = new ChangeLog();
    this.serverAddress = config.database.server;
    this.databaseName = config.database.name;
    this.tracer = tracer;
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

            if (_this2.changeLog.enabled) {
              _this2.changeLog.log(doc._key, Date.now());
            }

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
          _regenerator["default"].mark(function _callee(parent, args, context) {
            return _regenerator["default"].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _this3.log.debug("Query ".concat(collection.name), args);

                    return _context.abrupt("return", _this3.fetchDocs(collection, args, filter, context));

                  case 2:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          return function (_x, _x2, _x3) {
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
          _regenerator["default"].mark(function _callee2(parent, args, context) {
            var query, bindVars;
            return _regenerator["default"].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    query = args.query;
                    bindVars = JSON.parse(args.bindVarsJson);
                    _context2.t0 = JSON;
                    _context2.next = 5;
                    return _this4.fetchQuery(query, bindVars, context);

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

          return function (_x4, _x5, _x6) {
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
            var doc = data[collection.name];

            if (_this5.changeLog.enabled) {
              _this5.changeLog.log(doc._key, Date.now());
            }

            return docType.test(null, doc, args.filter || {});
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

      function wrap(_x7) {
        return _wrap.apply(this, arguments);
      }

      return wrap;
    }()
  }, {
    key: "fetchDocs",
    value: function () {
      var _fetchDocs = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(collection, args, docType, context) {
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
                  var filter, params, filterSection, orderBy, sortSection, limit, limitSection, query, span, cursor, res;
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
                          return _this6.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', query);

                        case 10:
                          span = _context4.sent;
                          _context4.next = 13;
                          return _this6.db.query({
                            query: query,
                            bindVars: params.values
                          });

                        case 13:
                          cursor = _context4.sent;
                          _context4.next = 16;
                          return cursor.all();

                        case 16:
                          res = _context4.sent;
                          _context4.next = 19;
                          return span.finish();

                        case 19:
                          return _context4.abrupt("return", res);

                        case 20:
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

      function fetchDocs(_x8, _x9, _x10, _x11) {
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

      function fetchDocByKey(_x12, _x13) {
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

      function fetchDocsByKeys(_x14, _x15) {
        return _fetchDocsByKeys.apply(this, arguments);
      }

      return fetchDocsByKeys;
    }()
  }, {
    key: "fetchQuery",
    value: function () {
      var _fetchQuery = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee10(query, bindVars, context) {
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
                  var span, cursor, res;
                  return _regenerator["default"].wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          _context9.next = 2;
                          return _this8.tracer.startSpanLog(context, 'arango.js:fetchQuery', 'new query', query);

                        case 2:
                          span = _context9.sent;
                          _context9.next = 5;
                          return _this8.db.query({
                            query: query,
                            bindVars: bindVars
                          });

                        case 5:
                          cursor = _context9.sent;
                          res = cursor.all();
                          _context9.next = 9;
                          return span.finish();

                        case 9:
                          return _context9.abrupt("return", res);

                        case 10:
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

      function fetchQuery(_x16, _x17, _x18) {
        return _fetchQuery.apply(this, arguments);
      }

      return fetchQuery;
    }()
  }]);
  return Arango;
}();

exports["default"] = Arango;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQ2hhbmdlTG9nIiwiZW5hYmxlZCIsInJlY29yZHMiLCJNYXAiLCJjbGVhciIsImlkIiwidGltZSIsImV4aXN0aW5nIiwiZ2V0IiwicHVzaCIsInNldCIsIkFyYW5nbyIsImNvbmZpZyIsImxvZ3MiLCJ0cmFjZXIiLCJsb2ciLCJjcmVhdGUiLCJjaGFuZ2VMb2ciLCJzZXJ2ZXJBZGRyZXNzIiwiZGF0YWJhc2UiLCJzZXJ2ZXIiLCJkYXRhYmFzZU5hbWUiLCJuYW1lIiwicHVic3ViIiwiUHViU3ViIiwiZGIiLCJEYXRhYmFzZSIsInVybCIsInVzZURhdGFiYXNlIiwiYXV0aCIsImF1dGhQYXJ0cyIsInNwbGl0IiwidXNlQmFzaWNBdXRoIiwic2xpY2UiLCJqb2luIiwidHJhbnNhY3Rpb25zIiwiY29sbGVjdGlvbiIsIm1lc3NhZ2VzIiwiYWNjb3VudHMiLCJibG9ja3MiLCJjb2xsZWN0aW9ucyIsImZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lIiwiZG9jVHlwZSIsImZpbHRlciIsImZpbHRlcnMiLCJsYXN0SWQiLCJmaWx0ZXJzQnlJZCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwiZG9jIiwiSlNPTiIsInBhcnNlIiwiX2tleSIsIkRhdGUiLCJub3ciLCJ2YWx1ZXMiLCJ0ZXN0IiwicHVibGlzaCIsInN0YXJ0IiwiZGVidWciLCJlcnIiLCJodHRwU3RhdHVzIiwiYm9keSIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsInBhcmVudCIsImFyZ3MiLCJjb250ZXh0IiwiZmV0Y2hEb2NzIiwicXVlcnkiLCJiaW5kVmFycyIsImJpbmRWYXJzSnNvbiIsImZldGNoUXVlcnkiLCJzdHJpbmdpZnkiLCJfIiwiaXRlciIsImFzeW5jSXRlcmF0b3IiLCJmaWx0ZXJJZCIsImFkZEZpbHRlciIsIl90aGlzIiwibmV4dCIsInZhbHVlIiwicmVtb3ZlRmlsdGVyIiwiZSIsImRhdGEiLCJmZXRjaCIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsImNvZGUiLCJ3cmFwIiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwic29ydFNlY3Rpb24iLCJsaW1pdCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwiY3Vyc29yIiwiYWxsIiwicmVzIiwiZmluaXNoIiwia2V5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBSUE7O0FBQ0E7O0FBMUJBOzs7Ozs7Ozs7Ozs7Ozs7SUFrQ2FBLFM7OztBQUlULHVCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBSUMsR0FBSixFQUFmO0FBQ0g7Ozs7NEJBRU87QUFDSixXQUFLRCxPQUFMLENBQWFFLEtBQWI7QUFDSDs7O3dCQUVHQyxFLEVBQVlDLEksRUFBYztBQUMxQixVQUFJLENBQUMsS0FBS0wsT0FBVixFQUFtQjtBQUNmO0FBQ0g7O0FBQ0QsVUFBTU0sUUFBUSxHQUFHLEtBQUtMLE9BQUwsQ0FBYU0sR0FBYixDQUFpQkgsRUFBakIsQ0FBakI7O0FBQ0EsVUFBSUUsUUFBSixFQUFjO0FBQ1ZBLFFBQUFB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QVVORCxHQVZNOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFWLEciLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSAnYXJhbmdvanMnO1xuaW1wb3J0IGFyYW5nb2NoYWlyIGZyb20gJ2FyYW5nb2NoYWlyJztcbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gJ2Fwb2xsby1zZXJ2ZXInO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSAnLi9xLXR5cGVzJztcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tICcuL3EtdHlwZXMnO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tICcuL2xvZ3MnO1xuaW1wb3J0IFFMb2dzIGZyb20gJy4vbG9ncydcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIENvbGxlY3Rpb25GaWx0ZXJzID0ge1xuICAgIGxhc3RJZDogbnVtYmVyLFxuICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgIGZpbHRlcnNCeUlkOiBNYXA8bnVtYmVyLCBhbnk+XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VMb2cge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVjb3JkczogTWFwPHN0cmluZywgbnVtYmVyW10+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29yZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGxvZyhpZDogc3RyaW5nLCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLnB1c2godGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KGlkLCBbdGltZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0KGlkOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY29yZHMuZ2V0KGlkKSB8fCBbXTtcbiAgICB9XG59XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcblxuICAgIHRyYW5zYWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIG1lc3NhZ2VzOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgYWNjb3VudHM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBibG9ja3M6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBjb2xsZWN0aW9uczogRG9jdW1lbnRDb2xsZWN0aW9uW107XG5cbiAgICBsaXN0ZW5lcjogYW55O1xuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uRmlsdGVycz47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzLCB0cmFjZXI6IFRyYWNlcikge1xuICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZSgnQXJhbmdvJyk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gbmV3IENoYW5nZUxvZygpO1xuICAgICAgICB0aGlzLnNlcnZlckFkZHJlc3MgPSBjb25maWcuZGF0YWJhc2Uuc2VydmVyO1xuICAgICAgICB0aGlzLmRhdGFiYXNlTmFtZSA9IGNvbmZpZy5kYXRhYmFzZS5uYW1lO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IG5ldyBQdWJTdWIoKTtcblxuICAgICAgICB0aGlzLmRiID0gbmV3IERhdGFiYXNlKHtcbiAgICAgICAgICAgIHVybDogYCR7ZW5zdXJlUHJvdG9jb2wodGhpcy5zZXJ2ZXJBZGRyZXNzLCAnaHR0cCcpfWAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRiLnVzZURhdGFiYXNlKHRoaXMuZGF0YWJhc2VOYW1lKTtcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGF1dGhQYXJ0cyA9IHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGguc3BsaXQoJzonKTtcbiAgICAgICAgICAgIHRoaXMuZGIudXNlQmFzaWNBdXRoKGF1dGhQYXJ0c1swXSwgYXV0aFBhcnRzLnNsaWNlKDEpLmpvaW4oJzonKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyA9IHRoaXMuZGIuY29sbGVjdGlvbigndHJhbnNhY3Rpb25zJyk7XG4gICAgICAgIHRoaXMubWVzc2FnZXMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ21lc3NhZ2VzJyk7XG4gICAgICAgIHRoaXMuYWNjb3VudHMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ2FjY291bnRzJyk7XG4gICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdibG9ja3MnKTtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9ucyA9IFtcbiAgICAgICAgICAgIHRoaXMudHJhbnNhY3Rpb25zLFxuICAgICAgICAgICAgdGhpcy5tZXNzYWdlcyxcbiAgICAgICAgICAgIHRoaXMuYWNjb3VudHMsXG4gICAgICAgICAgICB0aGlzLmJsb2Nrc1xuICAgICAgICBdO1xuICAgICAgICB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZEZpbHRlcihjb2xsZWN0aW9uOiBzdHJpbmcsIGRvY1R5cGU6IFFUeXBlLCBmaWx0ZXI6IGFueSk6IG51bWJlciB7XG4gICAgICAgIGxldCBmaWx0ZXJzOiBDb2xsZWN0aW9uRmlsdGVycztcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChjb2xsZWN0aW9uKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBmaWx0ZXJzID0gZXhpc3Rpbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmaWx0ZXJzID0ge1xuICAgICAgICAgICAgICAgIGxhc3RJZDogMCxcbiAgICAgICAgICAgICAgICBkb2NUeXBlLFxuICAgICAgICAgICAgICAgIGZpbHRlcnNCeUlkOiBuZXcgTWFwKClcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLnNldChjb2xsZWN0aW9uLCBmaWx0ZXJzKTtcbiAgICAgICAgfVxuICAgICAgICBkbyB7XG4gICAgICAgICAgICBmaWx0ZXJzLmxhc3RJZCA9IGZpbHRlcnMubGFzdElkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBmaWx0ZXJzLmxhc3RJZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlIChmaWx0ZXJzLmZpbHRlcnNCeUlkLmhhcyhmaWx0ZXJzLmxhc3RJZCkpO1xuICAgICAgICBmaWx0ZXJzLmZpbHRlcnNCeUlkLnNldChmaWx0ZXJzLmxhc3RJZCwgZmlsdGVyKTtcbiAgICAgICAgcmV0dXJuIGZpbHRlcnMubGFzdElkO1xuICAgIH1cblxuICAgIHJlbW92ZUZpbHRlcihjb2xsZWN0aW9uOiBzdHJpbmcsIGlkOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KGNvbGxlY3Rpb24pO1xuICAgICAgICBpZiAoZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuZmlsdGVyc0J5SWQuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlIGZpbHRlciAke2NvbGxlY3Rpb259WyR7aWR9XTogZmlsdGVyIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBjb25zdCBsaXN0ZW5lclVybCA9IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX0vJHt0aGlzLmRhdGFiYXNlTmFtZX1gO1xuICAgICAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGFyYW5nb2NoYWlyKGxpc3RlbmVyVXJsKTtcblxuICAgICAgICBpZiAodGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkge1xuICAgICAgICAgICAgY29uc3QgdXNlclBhc3N3b3JkID0gQnVmZmVyLmZyb20odGhpcy5jb25maWcuZGF0YWJhc2UuYXV0aCkudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5yZXEub3B0cy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBgQmFzaWMgJHt1c2VyUGFzc3dvcmR9YDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMuZm9yRWFjaChjb2xsZWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBjb2xsZWN0aW9uLm5hbWU7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLnN1YnNjcmliZSh7IGNvbGxlY3Rpb246IG5hbWUgfSk7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKG5hbWUsIChkb2NKc29uLCB0eXBlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdpbnNlcnQvdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBKU09OLnBhcnNlKGRvY0pzb24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJzID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQobmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGZpbHRlciBvZiBmaWx0ZXJzLmZpbHRlcnNCeUlkLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbHRlcnMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyIHx8IHt9KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YnN1Yi5wdWJsaXNoKG5hbWUsIHsgW25hbWVdOiBkb2MgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLnN0YXJ0KCk7XG4gICAgICAgIHRoaXMubG9nLmRlYnVnKCdMaXN0ZW4gZGF0YWJhc2UnLCBsaXN0ZW5lclVybCk7XG4gICAgICAgIHRoaXMubGlzdGVuZXIub24oJ2Vycm9yJywgKGVyciwgaHR0cFN0YXR1cywgaGVhZGVycywgYm9keSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0xpc3RlbmVyIGZhaWxlZDogJywgeyBlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMubGlzdGVuZXIuc3RhcnQoKSwgdGhpcy5jb25maWcubGlzdGVuZXIucmVzdGFydFRpbWVvdXQpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBjb2xsZWN0aW9uUXVlcnkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoYFF1ZXJ5ICR7Y29sbGVjdGlvbi5uYW1lfWAsIGFyZ3MpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmV0Y2hEb2NzKGNvbGxlY3Rpb24sIGFyZ3MsIGZpbHRlciwgY29udGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZWxlY3RRdWVyeSgpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55LCBjb250ZXh0OiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycywgY29udGV4dCkpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcihjb2xsZWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJJZCA9IHRoaXMuYWRkRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZG9jVHlwZSwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBkYXRhW2NvbGxlY3Rpb24ubmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgYXJncy5maWx0ZXIgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1YnNjcmlwdGlvbl0gZG9jIHRlc3QgZmFpbGVkJywgZGF0YSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZG9jVHlwZTogUVR5cGUsIGNvbnRleHQ6IGFueSkge1xuICAgICAgICByZXR1cm4gdGhpcy53cmFwKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICA/IGBGSUxURVIgJHtkb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5ID0gKGFyZ3Mub3JkZXJCeSB8fCBbXSlcbiAgICAgICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeSAhPT0gJycgPyBgU09SVCAke29yZGVyQnl9YCA6ICcnO1xuICAgICAgICAgICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihhcmdzLmxpbWl0IHx8IDUwLCA1MCk7XG4gICAgICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdH1gO1xuXG4gICAgICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHtjb2xsZWN0aW9uLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAnYXJhbmdvLmpzOmZldGNoRG9jcycsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgcXVlcnlcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzIH0pO1xuICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwga2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoY29sbGVjdGlvbiwga2V5KSkpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoUXVlcnkocXVlcnk6IGFueSwgYmluZFZhcnM6IGFueSwgY29udGV4dDogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICdhcmFuZ28uanM6ZmV0Y2hRdWVyeScsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iXX0=