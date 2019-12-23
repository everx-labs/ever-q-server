"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.ChangeLog = exports.Collection = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _apolloServer = require("apollo-server");

var _arangojs = require("arangojs");

var _logs = _interopRequireDefault(require("./logs"));

var _qTypes = require("./q-types");

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
function wrap(_x, _x2, _x3, _x4) {
  return _wrap.apply(this, arguments);
}

function _wrap() {
  _wrap = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee8(log, op, args, fetch) {
    var error;
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            _context8.next = 3;
            return fetch();

          case 3:
            return _context8.abrupt("return", _context8.sent);

          case 6:
            _context8.prev = 6;
            _context8.t0 = _context8["catch"](0);
            error = {
              message: _context8.t0.message || _context8.t0.ArangoError || _context8.t0.toString(),
              code: _context8.t0.code
            };
            log.error('FAILED', op, args, error.message);
            throw error;

          case 11:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[0, 6]]);
  }));
  return _wrap.apply(this, arguments);
}

var RegistryMap =
/*#__PURE__*/
function () {
  function RegistryMap(name) {
    (0, _classCallCheck2["default"])(this, RegistryMap);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "items", void 0);
    (0, _defineProperty2["default"])(this, "lastId", void 0);
    this.name = name;
    this.lastId = 0;
    this.items = new Map();
  }

  (0, _createClass2["default"])(RegistryMap, [{
    key: "add",
    value: function add(item) {
      var id = this.lastId;

      do {
        id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
      } while (this.items.has(id));

      this.lastId = id;
      this.items.set(id, item);
      return id;
    }
  }, {
    key: "remove",
    value: function remove(id) {
      if (!this.items["delete"](id)) {
        console.error("Failed to remove ".concat(this.name, ": item with id [").concat(id, "] does not exists"));
      }
    }
  }, {
    key: "entries",
    value: function entries() {
      return (0, _toConsumableArray2["default"])(this.items.entries());
    }
  }, {
    key: "values",
    value: function values() {
      return (0, _toConsumableArray2["default"])(this.items.values());
    }
  }]);
  return RegistryMap;
}();

var Collection =
/*#__PURE__*/
function () {
  function Collection(name, docType, pubsub, logs, changeLog, tracer, db) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "pubsub", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "subscriptions", void 0);
    (0, _defineProperty2["default"])(this, "waitFor", void 0);
    this.name = name;
    this.docType = docType;
    this.pubsub = pubsub;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.subscriptions = new RegistryMap("".concat(name, " subscriptions"));
    this.waitFor = new RegistryMap("".concat(name, " waitFor"));
  } // Subscriptions


  (0, _createClass2["default"])(Collection, [{
    key: "getSubscriptionPubSubName",
    value: function getSubscriptionPubSubName(id) {
      return "".concat(this.name).concat(id);
    }
  }, {
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.subscriptions.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = (0, _slicedToArray2["default"])(_step.value, 2),
              _id = _step$value[0],
              _filter2 = _step$value[1].filter;

          if (this.docType.test(null, doc, _filter2)) {
            this.pubsub.publish(this.getSubscriptionPubSubName(_id), (0, _defineProperty2["default"])({}, this.name, doc));
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

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.waitFor.items.values()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _step2$value = _step2.value,
              _filter3 = _step2$value.filter,
              _onInsertOrUpdate = _step2$value.onInsertOrUpdate;

          if (this.docType.test(null, doc, _filter3)) {
            _onInsertOrUpdate(doc);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }, {
    key: "subscriptionResolver",
    value: function subscriptionResolver() {
      var _this2 = this;

      return {
        subscribe: (0, _apolloServer.withFilter)(function (_, args) {
          var subscription = {
            filter: args.filter || {}
          };

          var subscriptionId = _this2.subscriptions.add(subscription);

          var iter = _this2.pubsub.asyncIterator(_this2.getSubscriptionPubSubName(subscriptionId));

          subscription.iter = iter;
          var _this = _this2;
          return {
            next: function next(value) {
              return iter.next(value);
            },
            "return": function _return(value) {
              _this.subscriptions.remove(subscriptionId);

              return iter["return"](value);
            },
            "throw": function _throw(e) {
              _this.subscriptions.remove(subscriptionId);

              return iter["throw"](e);
            }
          };
        }, function (data, args) {
          try {
            var _doc = data[_this2.name];

            if (_this2.changeLog.enabled) {
              _this2.changeLog.log(_doc._key, Date.now());
            }

            return _this2.docType.test(null, _doc, args.filter || {});
          } catch (error) {
            console.error('[Subscription] doc test failed', data, error);
            throw error;
          }
        })
      };
    } // Queries

  }, {
    key: "queryResolver",
    value: function queryResolver() {
      var _this3 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee2(parent, args, context) {
            return _regenerator["default"].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    return _context2.abrupt("return", wrap(_this3.log, 'QUERY', args,
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee() {
                      var filter, orderBy, limit, timeout, q, span;
                      return _regenerator["default"].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _this3.log.debug('QUERY', args);

                              filter = args.filter || {};
                              orderBy = args.orderBy || [];
                              limit = args.limit || 50;
                              timeout = (Number(args.timeout) || 0) * 1000;
                              q = _this3.genQuery(filter, orderBy, limit);
                              _context.next = 8;
                              return _this3.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 8:
                              span = _context.sent;
                              _context.prev = 9;

                              if (!(timeout > 0)) {
                                _context.next = 16;
                                break;
                              }

                              _context.next = 13;
                              return _this3.queryWaitFor(q, filter, timeout);

                            case 13:
                              return _context.abrupt("return", _context.sent);

                            case 16:
                              _context.next = 18;
                              return _this3.query(q);

                            case 18:
                              return _context.abrupt("return", _context.sent);

                            case 19:
                              _context.prev = 19;
                              _context.next = 22;
                              return span.finish();

                            case 22:
                              return _context.finish(19);

                            case 23:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee, null, [[9,, 19, 23]]);
                    }))));

                  case 1:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function (_x5, _x6, _x7) {
            return _ref.apply(this, arguments);
          };
        }()
      );
    }
  }, {
    key: "query",
    value: function () {
      var _query = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(q) {
        var cursor;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.db.query(q);

              case 2:
                cursor = _context3.sent;
                _context3.next = 5;
                return cursor.all();

              case 5:
                return _context3.abrupt("return", _context3.sent);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function query(_x8) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4(q, filter, timeout) {
        var _this4 = this;

        var waitForResolve, waitForId;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                waitForResolve = null;
                waitForId = this.waitFor.add({
                  filter: filter,
                  onInsertOrUpdate: function onInsertOrUpdate(doc) {
                    if (waitForResolve) {
                      waitForResolve([doc]);
                    }
                  }
                });
                _context4.prev = 2;
                _context4.next = 5;
                return Promise.race([new Promise(function (resolve, reject) {
                  _this4.query(q).then(function (docs) {
                    if (docs.length > 0) {
                      resolve(docs);
                    }
                  }, function (err) {
                    reject(err);
                  });
                }), new Promise(function (resolve) {
                  waitForResolve = resolve;
                }), new Promise(function (resolve) {
                  setTimeout(function () {
                    return resolve([]);
                  }, timeout);
                })]);

              case 5:
                return _context4.abrupt("return", _context4.sent);

              case 6:
                _context4.prev = 6;
                this.waitFor.remove(waitForId);
                return _context4.finish(6);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[2,, 6, 9]]);
      }));

      function queryWaitFor(_x9, _x10, _x11) {
        return _queryWaitFor.apply(this, arguments);
      }

      return queryWaitFor;
    }()
  }, {
    key: "genQuery",
    value: function genQuery(filter, orderBy, limit) {
      var params = new _qTypes.QParams();
      var filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(this.docType.ql(params, 'doc', filter)) : '';
      var orderByQl = orderBy.map(function (field) {
        var direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
        return "doc.".concat(field.path.replace(/\bid\b/gi, '_key')).concat(direction);
      }).join(', ');
      var sortSection = orderByQl !== '' ? "SORT ".concat(orderByQl) : '';
      var limitQl = Math.min(limit, 50);
      var limitSection = "LIMIT ".concat(limitQl);
      var query = "\n            FOR doc IN ".concat(this.name, "\n            ").concat(filterSection, "\n            ").concat(sortSection, "\n            ").concat(limitSection, "\n            RETURN doc");
      return {
        query: query,
        bindVars: params.values
      };
    }
  }, {
    key: "dbCollection",
    value: function dbCollection() {
      return this.db.collection(this.name);
    }
  }, {
    key: "fetchDocByKey",
    value: function () {
      var _fetchDocByKey = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee6(key) {
        var _this5 = this;

        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (key) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt("return", Promise.resolve(null));

              case 2:
                return _context6.abrupt("return", wrap(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee5() {
                  return _regenerator["default"].wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          return _context5.abrupt("return", _this5.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5);
                }))));

              case 3:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function fetchDocByKey(_x12) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(keys) {
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context7.next = 2;
                  break;
                }

                return _context7.abrupt("return", Promise.resolve([]));

              case 2:
                return _context7.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this6.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function fetchDocsByKeys(_x13) {
        return _fetchDocsByKeys.apply(this, arguments);
      }

      return fetchDocsByKeys;
    }()
  }]);
  return Collection;
}();

exports.Collection = Collection;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwiQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJwdWJzdWIiLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJjcmVhdGUiLCJzdWJzY3JpcHRpb25zIiwid2FpdEZvciIsImRvYyIsImZpbHRlciIsInRlc3QiLCJwdWJsaXNoIiwiZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZSIsIm9uSW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwic3Vic2NyaXB0aW9uIiwic3Vic2NyaXB0aW9uSWQiLCJhZGQiLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsIl90aGlzIiwibmV4dCIsInZhbHVlIiwicmVtb3ZlIiwiZSIsImRhdGEiLCJlbmFibGVkIiwiX2tleSIsIkRhdGUiLCJub3ciLCJwYXJlbnQiLCJjb250ZXh0IiwiZGVidWciLCJvcmRlckJ5IiwibGltaXQiLCJ0aW1lb3V0IiwicSIsImdlblF1ZXJ5Iiwic3RhcnRTcGFuTG9nIiwic3BhbiIsInF1ZXJ5V2FpdEZvciIsInF1ZXJ5IiwiZmluaXNoIiwiY3Vyc29yIiwiYWxsIiwid2FpdEZvclJlc29sdmUiLCJ3YWl0Rm9ySWQiLCJQcm9taXNlIiwicmFjZSIsInJlc29sdmUiLCJyZWplY3QiLCJ0aGVuIiwiZG9jcyIsImxlbmd0aCIsImVyciIsInNldFRpbWVvdXQiLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnlRbCIsIm1hcCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0UWwiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiYmluZFZhcnMiLCJjb2xsZWN0aW9uIiwia2V5IiwiZGJDb2xsZWN0aW9uIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5IiwiQ2hhbmdlTG9nIiwicmVjb3JkcyIsImNsZWFyIiwidGltZSIsImV4aXN0aW5nIiwiZ2V0IiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O1NBOENzQkEsSTs7Ozs7OzsrQkFBZixrQkFBdUJDLEdBQXZCLEVBQWtDQyxFQUFsQyxFQUE4Q0MsSUFBOUMsRUFBeURDLEtBQXpEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFY0EsS0FBSyxFQUZuQjs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUlPQyxZQUFBQSxLQUpQLEdBSWU7QUFDVkMsY0FBQUEsT0FBTyxFQUFFLGFBQUlBLE9BQUosSUFBZSxhQUFJQyxXQUFuQixJQUFrQyxhQUFJQyxRQUFKLEVBRGpDO0FBRVZDLGNBQUFBLElBQUksRUFBRSxhQUFJQTtBQUZBLGFBSmY7QUFRQ1IsWUFBQUEsR0FBRyxDQUFDSSxLQUFKLENBQVUsUUFBVixFQUFvQkgsRUFBcEIsRUFBd0JDLElBQXhCLEVBQThCRSxLQUFLLENBQUNDLE9BQXBDO0FBUkQsa0JBU09ELEtBVFA7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztJQWFESyxXOzs7QUFLRix1QkFBWUMsSUFBWixFQUEwQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxD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SixFQUFjO0FBQ1ZBLFFBQUFBLFFBQVEsQ0FBQ0UsSUFBVCxDQUFjSCxJQUFkO0FBQ0gsT0FGRCxNQUVPO0FBQ0gsYUFBS0YsT0FBTCxDQUFhekYsR0FBYixDQUFpQkosRUFBakIsRUFBcUIsQ0FBQytGLElBQUQsQ0FBckI7QUFDSDtBQUNKOzs7d0JBRUcvRixFLEVBQXNCO0FBQ3RCLGFBQU8sS0FBSzZGLE9BQUwsQ0FBYUksR0FBYixDQUFpQmpHLEVBQWpCLEtBQXdCLEVBQS9CO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IFB1YlN1Yiwgd2l0aEZpbHRlciB9IGZyb20gXCJhcG9sbG8tc2VydmVyXCI7XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxuZXhwb3J0IHR5cGUgQ29sbGVjdGlvblN1YnNjcmlwdGlvbiA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBpdGVyOiBhbnksXG59XG5cbnR5cGUgQ29sbGVjdGlvbldhaXRGb3IgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkLFxufVxuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG50eXBlIFF1ZXJ5ID0ge1xuICAgIHF1ZXJ5OiBzdHJpbmcsXG4gICAgYmluZFZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBzdWJzY3JpcHRpb25zOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uU3Vic2NyaXB0aW9uPjtcbiAgICB3YWl0Rm9yOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uV2FpdEZvcj47XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgcHVic3ViOiBQdWJTdWIsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZyxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IHB1YnN1YjtcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBjaGFuZ2VMb2c7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG5cbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25TdWJzY3JpcHRpb24+KGAke25hbWV9IHN1YnNjcmlwdGlvbnNgKTtcbiAgICAgICAgdGhpcy53YWl0Rm9yID0gbmV3IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25XYWl0Rm9yPihgJHtuYW1lfSB3YWl0Rm9yYCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZShpZDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9JHtpZH1gO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgeyBmaWx0ZXIgfV0gb2YgdGhpcy5zdWJzY3JpcHRpb25zLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2godGhpcy5nZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKGlkKSwgeyBbdGhpcy5uYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgeyBmaWx0ZXIsIG9uSW5zZXJ0T3JVcGRhdGUgfSBvZiB0aGlzLndhaXRGb3IuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBvbkluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb246IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbklkID0gdGhpcy5zdWJzY3JpcHRpb25zLmFkZChzdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcih0aGlzLmdldFN1YnNjcmlwdGlvblB1YlN1Yk5hbWUoc3Vic2NyaXB0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLml0ZXIgPSBpdGVyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KHZhbHVlPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBkYXRhW3RoaXMubmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBhcmdzLmZpbHRlciB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncyk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IChOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwKSAqIDEwMDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcblxuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhjb250ZXh0LCAnYXJhbmdvLmpzOmZldGNoRG9jcycsICduZXcgcXVlcnknLCBhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBmaWx0ZXIsIHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5KHEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogUXVlcnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHEpO1xuICAgICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKHE6IFF1ZXJ5LCBmaWx0ZXI6IGFueSwgdGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHdhaXRGb3JSZXNvbHZlOiA/KChkb2NzOiBhbnlbXSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICBjb25zdCB3YWl0Rm9ySWQgPSB0aGlzLndhaXRGb3IuYWRkKHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvclJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvclJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnkocSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKFtdKSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMud2FpdEZvci5yZW1vdmUod2FpdEZvcklkKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2VuUXVlcnkoZmlsdGVyOiBhbnksIG9yZGVyQnk6IE9yZGVyQnlbXSwgbGltaXQ6IG51bWJlcik6IFF1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3Qgb3JkZXJCeVFsID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVFsICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVFsfWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRRbCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0UWx9YDtcblxuICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlTG9nIHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHJlY29yZHM6IE1hcDxzdHJpbmcsIG51bWJlcltdPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvcmRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBsb2coaWQ6IHN0cmluZywgdGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5wdXNoKHRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRzLnNldChpZCwgW3RpbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldChpZDogc3RyaW5nKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRzLmdldChpZCkgfHwgW107XG4gICAgfVxufVxuIl19