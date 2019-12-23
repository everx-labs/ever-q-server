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
            filter: args.filter || {},
            eventCount: 0
          };

          var subscriptionId = _this2.subscriptions.add(subscription);

          var iter = _this2.pubsub.asyncIterator(_this2.getSubscriptionPubSubName(subscriptionId));

          subscription.iter = iter;
          var _this = _this2;
          return {
            next: function next(value) {
              subscription.eventCount += 1;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwiQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJwdWJzdWIiLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJjcmVhdGUiLCJzdWJzY3JpcHRpb25zIiwid2FpdEZvciIsImRvYyIsImZpbHRlciIsInRlc3QiLCJwdWJsaXNoIiwiZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZSIsIm9uSW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwic3Vic2NyaXB0aW9uIiwiZXZlbnRDb3VudCIsInN1YnNjcmlwdGlvbklkIiwiYWRkIiwiaXRlciIsImFzeW5jSXRlcmF0b3IiLCJfdGhpcyIsIm5leHQiLCJ2YWx1ZSIsInJlbW92ZSIsImUiLCJkYXRhIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwicGFyZW50IiwiY29udGV4dCIsImRlYnVnIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsInEiLCJnZW5RdWVyeSIsInN0YXJ0U3BhbkxvZyIsInNwYW4iLCJxdWVyeVdhaXRGb3IiLCJxdWVyeSIsImZpbmlzaCIsImN1cnNvciIsImFsbCIsIndhaXRGb3JSZXNvbHZlIiwid2FpdEZvcklkIiwiUHJvbWlzZSIsInJhY2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidGhlbiIsImRvY3MiLCJsZW5ndGgiLCJlcnIiLCJzZXRUaW1lb3V0IiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJvcmRlckJ5UWwiLCJtYXAiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJqb2luIiwic29ydFNlY3Rpb24iLCJsaW1pdFFsIiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImJpbmRWYXJzIiwiY29sbGVjdGlvbiIsImtleSIsImRiQ29sbGVjdGlvbiIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSIsIkNoYW5nZUxvZyIsInJlY29yZHMiLCJjbGVhciIsInRpbWUiLCJleGlzdGluZyIsImdldCIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQStDc0JBLEk7Ozs7Ozs7K0JBQWYsa0JBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxhQUFJQSxPQUFKLElBQWUsYUFBSUMsV0FBbkIsSUFBa0MsYUFBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJQUFJLEVBQUUsYUFBSUE7QUFGQSxhQUpmO0FBUUNSLFlBQUFBLEdBQUcsQ0FBQ0ksS0FBSixDQUFVLFFBQVYsRUFBb0JILEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkUsS0FBSyxDQUFDQyxPQUFwQztBQVJELGtCQVNPRCxLQVRQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFhREssVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFL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SDs7QUFDRCxVQUFNMkQsUUFBUSxHQUFHLEtBQUtILE9BQUwsQ0FBYUksR0FBYixDQUFpQmxHLEVBQWpCLENBQWpCOztBQUNBLFVBQUlpRyxRQUFKLEVBQWM7QUFDVkEsUUFBQUEsUUFBUSxDQUFDRSxJQUFULENBQWNILElBQWQ7QUFDSCxPQUZELE1BRU87QUFDSCxhQUFLRixPQUFMLENBQWExRixHQUFiLENBQWlCSixFQUFqQixFQUFxQixDQUFDZ0csSUFBRCxDQUFyQjtBQUNIO0FBQ0o7Ozt3QkFFR2hHLEUsRUFBc0I7QUFDdEIsYUFBTyxLQUFLOEYsT0FBTCxDQUFhSSxHQUFiLENBQWlCbEcsRUFBakIsS0FBd0IsRUFBL0I7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSBcImFwb2xsby1zZXJ2ZXJcIjtcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG5leHBvcnQgdHlwZSBDb2xsZWN0aW9uU3Vic2NyaXB0aW9uID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGl0ZXI6IGFueSxcbiAgICBldmVudENvdW50OiBudW1iZXIsXG59XG5cbnR5cGUgQ29sbGVjdGlvbldhaXRGb3IgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkLFxufVxuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG50eXBlIFF1ZXJ5ID0ge1xuICAgIHF1ZXJ5OiBzdHJpbmcsXG4gICAgYmluZFZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBzdWJzY3JpcHRpb25zOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uU3Vic2NyaXB0aW9uPjtcbiAgICB3YWl0Rm9yOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uV2FpdEZvcj47XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgcHVic3ViOiBQdWJTdWIsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZyxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IHB1YnN1YjtcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBjaGFuZ2VMb2c7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG5cbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zID0gbmV3IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25TdWJzY3JpcHRpb24+KGAke25hbWV9IHN1YnNjcmlwdGlvbnNgKTtcbiAgICAgICAgdGhpcy53YWl0Rm9yID0gbmV3IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25XYWl0Rm9yPihgJHtuYW1lfSB3YWl0Rm9yYCk7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZShpZDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9JHtpZH1gO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgeyBmaWx0ZXIgfV0gb2YgdGhpcy5zdWJzY3JpcHRpb25zLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2godGhpcy5nZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKGlkKSwgeyBbdGhpcy5uYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgeyBmaWx0ZXIsIG9uSW5zZXJ0T3JVcGRhdGUgfSBvZiB0aGlzLndhaXRGb3IuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBvbkluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb246IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudENvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb25JZCA9IHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlciA9IHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IodGhpcy5nZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKHN1YnNjcmlwdGlvbklkKSk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5pdGVyID0gaXRlcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCh2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5uZXh0KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4odmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci5yZXR1cm4odmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93KGU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnN1YnNjcmlwdGlvbnMucmVtb3ZlKHN1YnNjcmlwdGlvbklkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlci50aHJvdyhlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIChkYXRhLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkb2MgPSBkYXRhW3RoaXMubmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGFuZ2VMb2cuZW5hYmxlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlTG9nLmxvZyhkb2MuX2tleSwgRGF0ZS5ub3coKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBhcmdzLmZpbHRlciB8fCB7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdbU3Vic2NyaXB0aW9uXSBkb2MgdGVzdCBmYWlsZWQnLCBkYXRhLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncyk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IChOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwKSAqIDEwMDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcblxuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhjb250ZXh0LCAnYXJhbmdvLmpzOmZldGNoRG9jcycsICduZXcgcXVlcnknLCBhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBmaWx0ZXIsIHRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLnF1ZXJ5KHEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogUXVlcnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KHEpO1xuICAgICAgICByZXR1cm4gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKHE6IFF1ZXJ5LCBmaWx0ZXI6IGFueSwgdGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHdhaXRGb3JSZXNvbHZlOiA/KChkb2NzOiBhbnlbXSkgPT4gdm9pZCkgPSBudWxsO1xuICAgICAgICBjb25zdCB3YWl0Rm9ySWQgPSB0aGlzLndhaXRGb3IuYWRkKHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvclJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvclJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnkocSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVzb2x2ZSA9IHJlc29sdmU7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKFtdKSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMud2FpdEZvci5yZW1vdmUod2FpdEZvcklkKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2VuUXVlcnkoZmlsdGVyOiBhbnksIG9yZGVyQnk6IE9yZGVyQnlbXSwgbGltaXQ6IG51bWJlcik6IFF1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3Qgb3JkZXJCeVFsID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVFsICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVFsfWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRRbCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0UWx9YDtcblxuICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlTG9nIHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHJlY29yZHM6IE1hcDxzdHJpbmcsIG51bWJlcltdPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvcmRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBsb2coaWQ6IHN0cmluZywgdGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5wdXNoKHRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRzLnNldChpZCwgW3RpbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldChpZDogc3RyaW5nKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRzLmdldChpZCkgfHwgW107XG4gICAgfVxufVxuIl19