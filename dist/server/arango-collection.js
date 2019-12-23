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
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.pubsub = pubsub;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.subscriptions = new RegistryMap("".concat(name, " subscriptions"));
    this.waitFor = new RegistryMap("".concat(name, " waitFor"));
    this.maxQueueSize = 0;
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
              var queueSize = iter.pushQueue.length + iter.pullQueue.length;

              if (queueSize > _this.maxQueueSize) {
                _this.maxQueueSize = queueSize;
              }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwiQ29sbGVjdGlvbiIsImRvY1R5cGUiLCJwdWJzdWIiLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJjcmVhdGUiLCJzdWJzY3JpcHRpb25zIiwid2FpdEZvciIsIm1heFF1ZXVlU2l6ZSIsImRvYyIsImZpbHRlciIsInRlc3QiLCJwdWJsaXNoIiwiZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZSIsIm9uSW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwic3Vic2NyaXB0aW9uIiwiZXZlbnRDb3VudCIsInN1YnNjcmlwdGlvbklkIiwiYWRkIiwiaXRlciIsImFzeW5jSXRlcmF0b3IiLCJfdGhpcyIsIm5leHQiLCJ2YWx1ZSIsInF1ZXVlU2l6ZSIsInB1c2hRdWV1ZSIsImxlbmd0aCIsInB1bGxRdWV1ZSIsInJlbW92ZSIsImUiLCJkYXRhIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwicGFyZW50IiwiY29udGV4dCIsImRlYnVnIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsInEiLCJnZW5RdWVyeSIsInN0YXJ0U3BhbkxvZyIsInNwYW4iLCJxdWVyeVdhaXRGb3IiLCJxdWVyeSIsImZpbmlzaCIsImN1cnNvciIsImFsbCIsIndhaXRGb3JSZXNvbHZlIiwid2FpdEZvcklkIiwiUHJvbWlzZSIsInJhY2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidGhlbiIsImRvY3MiLCJlcnIiLCJzZXRUaW1lb3V0IiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJvcmRlckJ5UWwiLCJtYXAiLCJmaWVsZCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJqb2luIiwic29ydFNlY3Rpb24iLCJsaW1pdFFsIiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImJpbmRWYXJzIiwiY29sbGVjdGlvbiIsImtleSIsImRiQ29sbGVjdGlvbiIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSIsIkNoYW5nZUxvZyIsInJlY29yZHMiLCJjbGVhciIsInRpbWUiLCJleGlzdGluZyIsImdldCIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQStDc0JBLEk7Ozs7Ozs7K0JBQWYsa0JBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxhQUFJQSxPQUFKLElBQWUsYUFBSUMsV0FBbkIsSUFBa0MsYUFBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJQUFJLEVBQUUsYUFBSUE7QUFGQSxhQUpmO0FBUUNSLFlBQUFBLEdBQUcsQ0FBQ0ksS0FBSixDQUFVLFFBQVYsRUFBb0JILEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkUsS0FBSyxDQUFDQyxPQUFwQztBQVJELGtCQVNPRCxLQVRQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFhREssVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtB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QUFtQkgsR0FBbkIsQ0FBSjtBQUFBLGlCQUFaLENBQVosQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlGSSxTOzs7QUFJVCx1QkFBYztBQUFBO0FBQUE7QUFBQTtBQUNWLFNBQUt0RCxPQUFMLEdBQWUsS0FBZjtBQUNBLFNBQUt1RCxPQUFMLEdBQWUsSUFBSXBHLEdBQUosRUFBZjtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBS29HLE9BQUwsQ0FBYUMsS0FBYjtBQUNIOzs7d0JBRUduRyxFLEVBQVlvRyxJLEVBQWM7QUFDMUIsVUFBSSxDQUFDLEtBQUt6RCxPQUFWLEVBQW1CO0FBQ2Y7QUFDSDs7QUFDRCxVQUFNMEQsUUFBUSxHQUFHLEtBQUtILE9BQUwsQ0FBYUksR0FBYixDQUFpQnRHLEVBQWpCLENBQWpCOztBQUNBLFVBQUlxRyxRQUFKLEVBQWM7QUFDVkEsUUFBQUEsUUFBUSxDQUFDRSxJQUFULENBQWNILElBQWQ7QUFDSCxPQUZELE1BRU87QUFDSCxhQUFLRixPQUFMLENBQWE5RixHQUFiLENBQWlCSixFQUFqQixFQUFxQixDQUFDb0csSUFBRCxDQUFyQjtBQUNIO0FBQ0o7Ozt3QkFFR3BHLEUsRUFBc0I7QUFDdEIsYUFBTyxLQUFLa0csT0FBTCxDQUFhSSxHQUFiLENBQWlCdEcsRUFBakIsS0FBd0IsRUFBL0I7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgUHViU3ViLCB3aXRoRmlsdGVyIH0gZnJvbSBcImFwb2xsby1zZXJ2ZXJcIjtcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG5leHBvcnQgdHlwZSBDb2xsZWN0aW9uU3Vic2NyaXB0aW9uID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIGl0ZXI6IGFueSxcbiAgICBldmVudENvdW50OiBudW1iZXIsXG59XG5cbnR5cGUgQ29sbGVjdGlvbldhaXRGb3IgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkLFxufVxuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG50eXBlIFF1ZXJ5ID0ge1xuICAgIHF1ZXJ5OiBzdHJpbmcsXG4gICAgYmluZFZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBzdWJzY3JpcHRpb25zOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uU3Vic2NyaXB0aW9uPjtcbiAgICB3YWl0Rm9yOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uV2FpdEZvcj47XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBwdWJzdWI6IFB1YlN1YixcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMucHVic3ViID0gcHVic3ViO1xuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmNoYW5nZUxvZyA9IGNoYW5nZUxvZztcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcblxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvblN1YnNjcmlwdGlvbj4oYCR7bmFtZX0gc3Vic2NyaXB0aW9uc2ApO1xuICAgICAgICB0aGlzLndhaXRGb3IgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbldhaXRGb3I+KGAke25hbWV9IHdhaXRGb3JgKTtcblxuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZShpZDogbnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLm5hbWV9JHtpZH1gO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgeyBmaWx0ZXIgfV0gb2YgdGhpcy5zdWJzY3JpcHRpb25zLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIHRoaXMucHVic3ViLnB1Ymxpc2godGhpcy5nZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKGlkKSwgeyBbdGhpcy5uYW1lXTogZG9jIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgeyBmaWx0ZXIsIG9uSW5zZXJ0T3JVcGRhdGUgfSBvZiB0aGlzLndhaXRGb3IuaXRlbXMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBvbkluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogd2l0aEZpbHRlcihcbiAgICAgICAgICAgICAgICAoXywgYXJncykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb246IGFueSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcjogYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudENvdW50OiAwLFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdWJzY3JpcHRpb25JZCA9IHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlciA9IHRoaXMucHVic3ViLmFzeW5jSXRlcmF0b3IodGhpcy5nZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKHN1YnNjcmlwdGlvbklkKSk7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5pdGVyID0gaXRlcjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCh2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBxdWV1ZVNpemUgPSBpdGVyLnB1c2hRdWV1ZS5sZW5ndGggKyBpdGVyLnB1bGxRdWV1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXVlU2l6ZSA+IF90aGlzLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5tYXhRdWV1ZVNpemUgPSBxdWV1ZVNpemU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLm5leHQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybih2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3Vic2NyaXB0aW9ucy5yZW1vdmUoc3Vic2NyaXB0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnJldHVybih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3coZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuc3Vic2NyaXB0aW9ucy5yZW1vdmUoc3Vic2NyaXB0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnRocm93KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGRhdGEsIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IGRhdGFbdGhpcy5uYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoYW5nZUxvZy5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGFyZ3MuZmlsdGVyIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTdWJzY3JpcHRpb25dIGRvYyB0ZXN0IGZhaWxlZCcsIGRhdGEsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gKE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDApICogMTAwMDtcbiAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmdlblF1ZXJ5KGZpbHRlciwgb3JkZXJCeSwgbGltaXQpO1xuXG4gICAgICAgICAgICBjb25zdCBzcGFuID0gYXdhaXQgdGhpcy50cmFjZXIuc3RhcnRTcGFuTG9nKGNvbnRleHQsICdhcmFuZ28uanM6ZmV0Y2hEb2NzJywgJ25ldyBxdWVyeScsIGFyZ3MpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGZpbHRlciwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnkocSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBRdWVyeSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkocSk7XG4gICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogUXVlcnksIGZpbHRlcjogYW55LCB0aW1lb3V0OiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQgd2FpdEZvclJlc29sdmU6ID8oKGRvY3M6IGFueVtdKSA9PiB2b2lkKSA9IG51bGw7XG4gICAgICAgIGNvbnN0IHdhaXRGb3JJZCA9IHRoaXMud2FpdEZvci5hZGQoe1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh3YWl0Rm9yUmVzb2x2ZSkge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yUmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeShxKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3JSZXNvbHZlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoW10pLCB0aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgdGhpcy53YWl0Rm9yLnJlbW92ZSh3YWl0Rm9ySWQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZW5RdWVyeShmaWx0ZXI6IGFueSwgb3JkZXJCeTogT3JkZXJCeVtdLCBsaW1pdDogbnVtYmVyKTogUXVlcnkge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IGBGSUxURVIgJHt0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKX1gXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBvcmRlckJ5UWwgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5UWwgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5UWx9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFFsID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRRbH1gO1xuXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBiaW5kVmFyczogcGFyYW1zLnZhbHVlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubG9nLCAnRkVUQ0hfRE9DX0JZX0tFWScsIGtleSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGJDb2xsZWN0aW9uKCkuZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGtleSkpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VMb2cge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVjb3JkczogTWFwPHN0cmluZywgbnVtYmVyW10+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29yZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGxvZyhpZDogc3RyaW5nLCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLnB1c2godGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KGlkLCBbdGltZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0KGlkOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY29yZHMuZ2V0KGlkKSB8fCBbXTtcbiAgICB9XG59XG4iXX0=