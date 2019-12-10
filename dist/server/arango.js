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
  function Arango(config, logs) {
    (0, _classCallCheck2["default"])(this, Arango);
    (0, _defineProperty2["default"])(this, "config", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
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
    this.changeLog = new ChangeLog();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28uanMiXSwibmFtZXMiOlsiQ2hhbmdlTG9nIiwiZW5hYmxlZCIsInJlY29yZHMiLCJNYXAiLCJjbGVhciIsImlkIiwidGltZSIsImV4aXN0aW5nIiwiZ2V0IiwicHVzaCIsInNldCIsIkFyYW5nbyIsImNvbmZpZyIsImxvZ3MiLCJsb2ciLCJjcmVhdGUiLCJjaGFuZ2VMb2ciLCJzZXJ2ZXJBZGRyZXNzIiwiZGF0YWJhc2UiLCJzZXJ2ZXIiLCJkYXRhYmFzZU5hbWUiLCJuYW1lIiwicHVic3ViIiwiUHViU3ViIiwiZGIiLCJEYXRhYmFzZSIsInVybCIsInVzZURhdGFiYXNlIiwiYXV0aCIsImF1dGhQYXJ0cyIsInNwbGl0IiwidXNlQmFzaWNBdXRoIiwic2xpY2UiLCJqb2luIiwidHJhbnNhY3Rpb25zIiwiY29sbGVjdGlvbiIsIm1lc3NhZ2VzIiwiYWNjb3VudHMiLCJibG9ja3MiLCJjb2xsZWN0aW9ucyIsImZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lIiwiZG9jVHlwZSIsImZpbHRlciIsImZpbHRlcnMiLCJsYXN0SWQiLCJmaWx0ZXJzQnlJZCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJjb25zb2xlIiwiZXJyb3IiLCJsaXN0ZW5lclVybCIsImxpc3RlbmVyIiwiYXJhbmdvY2hhaXIiLCJ1c2VyUGFzc3dvcmQiLCJCdWZmZXIiLCJmcm9tIiwidG9TdHJpbmciLCJyZXEiLCJvcHRzIiwiaGVhZGVycyIsImZvckVhY2giLCJzdWJzY3JpYmUiLCJvbiIsImRvY0pzb24iLCJ0eXBlIiwiZG9jIiwiSlNPTiIsInBhcnNlIiwiX2tleSIsIkRhdGUiLCJub3ciLCJ2YWx1ZXMiLCJ0ZXN0IiwicHVibGlzaCIsInN0YXJ0IiwiZGVidWciLCJlcnIiLCJodHRwU3RhdHVzIiwiYm9keSIsInNldFRpbWVvdXQiLCJyZXN0YXJ0VGltZW91dCIsInBhcmVudCIsImFyZ3MiLCJmZXRjaERvY3MiLCJxdWVyeSIsImJpbmRWYXJzIiwiYmluZFZhcnNKc29uIiwiZmV0Y2hRdWVyeSIsInN0cmluZ2lmeSIsIl8iLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsImZpbHRlcklkIiwiYWRkRmlsdGVyIiwiX3RoaXMiLCJuZXh0IiwidmFsdWUiLCJyZW1vdmVGaWx0ZXIiLCJlIiwiZGF0YSIsImZldGNoIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwiY29kZSIsIndyYXAiLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJsZW5ndGgiLCJxbCIsIm9yZGVyQnkiLCJtYXAiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImN1cnNvciIsImFsbCIsImtleSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUlBOztBQXpCQTs7Ozs7Ozs7Ozs7Ozs7O0lBaUNhQSxTOzs7QUFJVCx1QkFBYztBQUFBO0FBQUE7QUFBQTtBQUNWLFNBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsU0FBS0MsT0FBTCxHQUFlLElBQUlDLEdBQUosRUFBZjtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBS0QsT0FBTCxDQUFhRSxLQUFiO0FBQ0g7Ozt3QkFFR0MsRSxFQUFZQyxJLEVBQWM7QUFDMUIsVUFBSSxDQUFDLEtBQUtMLE9BQVYsRUFBbUI7QUFDZjtBQUNIOztBQUNELFVBQU1NLFFBQVEsR0FBRyxLQUFLTCxPQUFMLENBQWFNLEdBQWIsQ0FBaUJILEVBQWpCLENBQWpCOztBQUNBLFVBQUlFLFFBQUosRUFBYztBQUNWQSxRQUFBQSxRQUFRLENBQUNFLElBQVQsQ0FBY0gsSUFBZDtBQUNILE9BRkQsTUFFTztBQUNILGFBQUtKLE9BQUwsQ0FB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QUksQ0FBQ2pGLEVBQUwsQ0FBUTZELEtBQVIsQ0FBYztBQUFFQSw0QkFBQUEsS0FBSyxFQUFMQSxLQUFGO0FBQVNDLDRCQUFBQSxRQUFRLEVBQVJBO0FBQVQsMkJBQWQsQ0FEUjs7QUFBQTtBQUNQdUMsMEJBQUFBLE1BRE87QUFBQSw0REFFTkEsTUFBTSxDQUFDQyxHQUFQLEVBRk07O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQVYsRyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tICdhcmFuZ29qcyc7XG5pbXBvcnQgYXJhbmdvY2hhaXIgZnJvbSAnYXJhbmdvY2hhaXInO1xuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSAnYXBvbGxvLXNlcnZlcic7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tICcuL2xvZ3MnXG5cbnR5cGUgQ29sbGVjdGlvbkZpbHRlcnMgPSB7XG4gICAgbGFzdElkOiBudW1iZXIsXG4gICAgZG9jVHlwZTogUVR5cGUsXG4gICAgZmlsdGVyc0J5SWQ6IE1hcDxudW1iZXIsIGFueT5cbn1cblxuZXhwb3J0IGNsYXNzIENoYW5nZUxvZyB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICByZWNvcmRzOiBNYXA8c3RyaW5nLCBudW1iZXJbXT47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVjb3JkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgbG9nKGlkOiBzdHJpbmcsIHRpbWU6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yZWNvcmRzLmdldChpZCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3RpbmcucHVzaCh0aW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQoaWQsIFt0aW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQoaWQ6IHN0cmluZyk6IG51bWJlcltdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjb3Jkcy5nZXQoaWQpIHx8IFtdO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXJhbmdvIHtcbiAgICBjb25maWc6IFFDb25maWc7XG4gICAgbG9nOiBRTG9nO1xuICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nO1xuICAgIHNlcnZlckFkZHJlc3M6IHN0cmluZztcbiAgICBkYXRhYmFzZU5hbWU6IHN0cmluZztcbiAgICBwdWJzdWI6IFB1YlN1YjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgdHJhbnNhY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb247XG4gICAgbWVzc2FnZXM6IERvY3VtZW50Q29sbGVjdGlvbjtcbiAgICBhY2NvdW50czogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGJsb2NrczogRG9jdW1lbnRDb2xsZWN0aW9uO1xuICAgIGNvbGxlY3Rpb25zOiBEb2N1bWVudENvbGxlY3Rpb25bXTtcbiAgICBsaXN0ZW5lcjogYW55O1xuICAgIGZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lOiBNYXA8c3RyaW5nLCBDb2xsZWN0aW9uRmlsdGVycz47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb25maWc6IFFDb25maWcsIGxvZ3M6IFFMb2dzKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKCdBcmFuZ28nKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBuZXcgQ2hhbmdlTG9nKCk7XG4gICAgICAgIHRoaXMuc2VydmVyQWRkcmVzcyA9IGNvbmZpZy5kYXRhYmFzZS5zZXJ2ZXI7XG4gICAgICAgIHRoaXMuZGF0YWJhc2VOYW1lID0gY29uZmlnLmRhdGFiYXNlLm5hbWU7XG5cbiAgICAgICAgdGhpcy5wdWJzdWIgPSBuZXcgUHViU3ViKCk7XG5cbiAgICAgICAgdGhpcy5kYiA9IG5ldyBEYXRhYmFzZSh7XG4gICAgICAgICAgICB1cmw6IGAke2Vuc3VyZVByb3RvY29sKHRoaXMuc2VydmVyQWRkcmVzcywgJ2h0dHAnKX1gLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kYi51c2VEYXRhYmFzZSh0aGlzLmRhdGFiYXNlTmFtZSk7XG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoKSB7XG4gICAgICAgICAgICBjb25zdCBhdXRoUGFydHMgPSB0aGlzLmNvbmZpZy5kYXRhYmFzZS5hdXRoLnNwbGl0KCc6Jyk7XG4gICAgICAgICAgICB0aGlzLmRiLnVzZUJhc2ljQXV0aChhdXRoUGFydHNbMF0sIGF1dGhQYXJ0cy5zbGljZSgxKS5qb2luKCc6JykpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmFuc2FjdGlvbnMgPSB0aGlzLmRiLmNvbGxlY3Rpb24oJ3RyYW5zYWN0aW9ucycpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdtZXNzYWdlcycpO1xuICAgICAgICB0aGlzLmFjY291bnRzID0gdGhpcy5kYi5jb2xsZWN0aW9uKCdhY2NvdW50cycpO1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuZGIuY29sbGVjdGlvbignYmxvY2tzJyk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbnMgPSBbXG4gICAgICAgICAgICB0aGlzLnRyYW5zYWN0aW9ucyxcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMsXG4gICAgICAgICAgICB0aGlzLmFjY291bnRzLFxuICAgICAgICAgICAgdGhpcy5ibG9ja3NcbiAgICAgICAgXTtcbiAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZSA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGRGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBkb2NUeXBlOiBRVHlwZSwgZmlsdGVyOiBhbnkpOiBudW1iZXIge1xuICAgICAgICBsZXQgZmlsdGVyczogQ29sbGVjdGlvbkZpbHRlcnM7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5nZXQoY29sbGVjdGlvbik7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZmlsdGVycyA9IGV4aXN0aW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZmlsdGVycyA9IHtcbiAgICAgICAgICAgICAgICBsYXN0SWQ6IDAsXG4gICAgICAgICAgICAgICAgZG9jVHlwZSxcbiAgICAgICAgICAgICAgICBmaWx0ZXJzQnlJZDogbmV3IE1hcCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJzQnlDb2xsZWN0aW9uTmFtZS5zZXQoY29sbGVjdGlvbiwgZmlsdGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgZmlsdGVycy5sYXN0SWQgPSBmaWx0ZXJzLmxhc3RJZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gZmlsdGVycy5sYXN0SWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAoZmlsdGVycy5maWx0ZXJzQnlJZC5oYXMoZmlsdGVycy5sYXN0SWQpKTtcbiAgICAgICAgZmlsdGVycy5maWx0ZXJzQnlJZC5zZXQoZmlsdGVycy5sYXN0SWQsIGZpbHRlcik7XG4gICAgICAgIHJldHVybiBmaWx0ZXJzLmxhc3RJZDtcbiAgICB9XG5cbiAgICByZW1vdmVGaWx0ZXIoY29sbGVjdGlvbjogc3RyaW5nLCBpZDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlcnMgPSB0aGlzLmZpbHRlcnNCeUNvbGxlY3Rpb25OYW1lLmdldChjb2xsZWN0aW9uKTtcbiAgICAgICAgaWYgKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLmZpbHRlcnNCeUlkLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSBmaWx0ZXIgJHtjb2xsZWN0aW9ufVske2lkfV06IGZpbHRlciBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICB9XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgY29uc3QgbGlzdGVuZXJVcmwgPSBgJHtlbnN1cmVQcm90b2NvbCh0aGlzLnNlcnZlckFkZHJlc3MsICdodHRwJyl9LyR7dGhpcy5kYXRhYmFzZU5hbWV9YDtcbiAgICAgICAgdGhpcy5saXN0ZW5lciA9IG5ldyBhcmFuZ29jaGFpcihsaXN0ZW5lclVybCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IEJ1ZmZlci5mcm9tKHRoaXMuY29uZmlnLmRhdGFiYXNlLmF1dGgpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXIucmVxLm9wdHMuaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID0gYEJhc2ljICR7dXNlclBhc3N3b3JkfWA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbGxlY3Rpb25zLmZvckVhY2goY29sbGVjdGlvbiA9PiB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gY29sbGVjdGlvbi5uYW1lO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5zdWJzY3JpYmUoeyBjb2xsZWN0aW9uOiBuYW1lIH0pO1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lci5vbihuYW1lLCAoZG9jSnNvbiwgdHlwZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnaW5zZXJ0L3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jID0gSlNPTi5wYXJzZShkb2NKc29uKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY2hhbmdlTG9nLmVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsdGVycyA9IHRoaXMuZmlsdGVyc0J5Q29sbGVjdGlvbk5hbWUuZ2V0KG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBmaWx0ZXIgb2YgZmlsdGVycy5maWx0ZXJzQnlJZC52YWx1ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaWx0ZXJzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlciB8fCB7fSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJzdWIucHVibGlzaChuYW1lLCB7IFtuYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5saXN0ZW5lci5zdGFydCgpO1xuICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnTGlzdGVuIGRhdGFiYXNlJywgbGlzdGVuZXJVcmwpO1xuICAgICAgICB0aGlzLmxpc3RlbmVyLm9uKCdlcnJvcicsIChlcnIsIGh0dHBTdGF0dXMsIGhlYWRlcnMsIGJvZHkpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9nLmVycm9yKCdMaXN0ZW5lciBmYWlsZWQ6ICcsIHsgZXJyLCBodHRwU3RhdHVzLCBoZWFkZXJzLCBib2R5IH0pO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLmxpc3RlbmVyLnN0YXJ0KCksIHRoaXMuY29uZmlnLmxpc3RlbmVyLnJlc3RhcnRUaW1lb3V0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29sbGVjdGlvblF1ZXJ5KGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZmlsdGVyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZyhgUXVlcnkgJHtjb2xsZWN0aW9uLm5hbWV9YCwgYXJncyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5mZXRjaERvY3MoY29sbGVjdGlvbiwgYXJncywgZmlsdGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlbGVjdFF1ZXJ5KCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gYXJncy5xdWVyeTtcbiAgICAgICAgICAgIGNvbnN0IGJpbmRWYXJzID0gSlNPTi5wYXJzZShhcmdzLmJpbmRWYXJzSnNvbik7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXdhaXQgdGhpcy5mZXRjaFF1ZXJ5KHF1ZXJ5LCBiaW5kVmFycykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBjb2xsZWN0aW9uU3Vic2NyaXB0aW9uKGNvbGxlY3Rpb246IERvY3VtZW50Q29sbGVjdGlvbiwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcihjb2xsZWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWx0ZXJJZCA9IHRoaXMuYWRkRmlsdGVyKGNvbGxlY3Rpb24ubmFtZSwgZG9jVHlwZSwgYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZUZpbHRlcihjb2xsZWN0aW9uLm5hbWUsIGZpbHRlcklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG9jVHlwZS50ZXN0KG51bGwsIGRhdGFbY29sbGVjdGlvbi5uYW1lXSwgYXJncy5maWx0ZXIgfHwge30pO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW1N1YnNjcmlwdGlvbl0gZG9jIHRlc3QgZmFpbGVkJywgZGF0YSwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApLFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgd3JhcDxSPihmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5sb2cuZXJyb3IoJ0RiIG9wZXJhdGlvbiBmYWlsZWQ6ICcsIGVycik7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jcyhjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGFyZ3M6IGFueSwgZG9jVHlwZTogUVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICAgICAgPyBgRklMVEVSICR7ZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnkgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5fWAgOiAnJztcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXR9YDtcblxuICAgICAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7Y29sbGVjdGlvbi5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHsgcXVlcnksIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uOiBEb2N1bWVudENvbGxlY3Rpb24sIGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbi5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoY29sbGVjdGlvbjogRG9jdW1lbnRDb2xsZWN0aW9uLCBrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShjb2xsZWN0aW9uLCBrZXkpKSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hRdWVyeShxdWVyeTogYW55LCBiaW5kVmFyczogYW55KSB7XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeSh7IHF1ZXJ5LCBiaW5kVmFycyB9KTtcbiAgICAgICAgICAgIHJldHVybiBjdXJzb3IuYWxsKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiJdfQ==