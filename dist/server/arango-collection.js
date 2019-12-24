"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.ChangeLog = exports.Collection = exports.CollectionSubscription = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _iterall = require("iterall");

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
  _regenerator["default"].mark(function _callee12(log, op, args, fetch) {
    var error;
    return _regenerator["default"].wrap(function _callee12$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;
            _context13.next = 3;
            return fetch();

          case 3:
            return _context13.abrupt("return", _context13.sent);

          case 6:
            _context13.prev = 6;
            _context13.t0 = _context13["catch"](0);
            error = {
              message: _context13.t0.message || _context13.t0.ArangoError || _context13.t0.toString(),
              code: _context13.t0.code
            };
            log.error('FAILED', op, args, error.message);
            throw error;

          case 11:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee12, null, [[0, 6]]);
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

function parseSelectionSet(selectionSet, returnFieldSelection) {
  var fields = [];
  var selections = selectionSet && selectionSet.selections;

  if (selections) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = selections[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _item = _step.value;

        var _name = _item.name && _item.name.value || '';

        if (_name) {
          var field = {
            name: _name,
            selection: parseSelectionSet(_item.selectionSet, '')
          };

          if (returnFieldSelection !== '' && field.name === returnFieldSelection) {
            return field.selection;
          }

          fields.push(field);
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

  return fields;
}

function selectFields(doc, selection) {
  var selected = {};

  if (doc._key) {
    selected._key = doc._key;
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = selection[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _item2 = _step2.value;
      var _value2 = doc[_item2.name];

      if (_value2 !== undefined) {
        selected[_item2.name] = _item2.selection.length > 0 ? selectFields(_value2, _item2.selection) : _value2;
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

  return selected;
} //$FlowFixMe


var CollectionSubscription =
/*#__PURE__*/
function () {
  function CollectionSubscription(collection, filter, selection) {
    (0, _classCallCheck2["default"])(this, CollectionSubscription);
    (0, _defineProperty2["default"])(this, "collection", void 0);
    (0, _defineProperty2["default"])(this, "id", void 0);
    (0, _defineProperty2["default"])(this, "filter", void 0);
    (0, _defineProperty2["default"])(this, "selection", void 0);
    (0, _defineProperty2["default"])(this, "eventCount", void 0);
    (0, _defineProperty2["default"])(this, "pullQueue", void 0);
    (0, _defineProperty2["default"])(this, "pushQueue", void 0);
    (0, _defineProperty2["default"])(this, "running", void 0);
    this.collection = collection;
    this.filter = filter;
    this.selection = selection;
    this.eventCount = 0;
    this.pullQueue = [];
    this.pushQueue = [];
    this.running = true;
    this.id = collection.subscriptions.add(this);
  }

  (0, _createClass2["default"])(CollectionSubscription, [{
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      if (!this.isQueueOverflow() && this.collection.docType.test(null, doc, this.filter)) {
        this.pushValue((0, _defineProperty2["default"])({}, this.collection.name, selectFields(doc, this.selection)));
      }
    }
  }, {
    key: "isQueueOverflow",
    value: function isQueueOverflow() {
      return this.getQueueSize() >= 10;
    }
  }, {
    key: "getQueueSize",
    value: function getQueueSize() {
      return this.pushQueue.length + this.pullQueue.length;
    }
  }, {
    key: "pushValue",
    value: function pushValue(value) {
      var queueSize = this.getQueueSize();

      if (queueSize > this.collection.maxQueueSize) {
        this.collection.maxQueueSize = queueSize;
      }

      this.eventCount += 1;

      if (this.pullQueue.length !== 0) {
        this.pullQueue.shift()(this.running ? {
          value: value,
          done: false
        } : {
          value: undefined,
          done: true
        });
      } else {
        this.pushQueue.push(value);
      }
    }
  }, {
    key: "next",
    value: function () {
      var _next = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this = this;

        return _regenerator["default"].wrap(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve) {
                  if (_this.pushQueue.length !== 0) {
                    resolve(_this.running ? {
                      value: _this.pushQueue.shift(),
                      done: false
                    } : {
                      value: undefined,
                      done: true
                    });
                  } else {
                    _this.pullQueue.push(resolve);
                  }
                }));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee);
      }));

      function next() {
        return _next.apply(this, arguments);
      }

      return next;
    }()
  }, {
    key: "return",
    value: function () {
      var _return2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.collection.subscriptions.remove(this.id);
                _context3.next = 3;
                return this.emptyQueue();

              case 3:
                return _context3.abrupt("return", {
                  value: undefined,
                  done: true
                });

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee2, this);
      }));

      function _return() {
        return _return2.apply(this, arguments);
      }

      return _return;
    }()
  }, {
    key: "throw",
    value: function () {
      var _throw2 = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(error) {
        return _regenerator["default"].wrap(function _callee3$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                this.collection.subscriptions.remove(this.id);
                _context4.next = 3;
                return this.emptyQueue();

              case 3:
                return _context4.abrupt("return", Promise.reject(error));

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee3, this);
      }));

      function _throw(_x5) {
        return _throw2.apply(this, arguments);
      }

      return _throw;
    }() //$FlowFixMe

  }, {
    key: _iterall.$$asyncIterator,
    value: function value() {
      return this;
    }
  }, {
    key: "emptyQueue",
    value: function () {
      var _emptyQueue = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (this.running) {
                  this.running = false;
                  this.pullQueue.forEach(function (resolve) {
                    return resolve({
                      value: undefined,
                      done: true
                    });
                  });
                  this.pullQueue = [];
                  this.pushQueue = [];
                }

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee4, this);
      }));

      function emptyQueue() {
        return _emptyQueue.apply(this, arguments);
      }

      return emptyQueue;
    }()
  }]);
  return CollectionSubscription;
}();

exports.CollectionSubscription = CollectionSubscription;

var Collection =
/*#__PURE__*/
function () {
  function Collection(name, docType, logs, changeLog, tracer, db) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "subscriptions", void 0);
    (0, _defineProperty2["default"])(this, "waitFor", void 0);
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.subscriptions = new RegistryMap("".concat(name, " subscriptions"));
    this.waitFor = new RegistryMap("".concat(name, " waitFor"));
    this.maxQueueSize = 0;
  } // Subscriptions


  (0, _createClass2["default"])(Collection, [{
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.waitFor.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _step3$value = _step3.value,
              _filter = _step3$value.filter,
              _onInsertOrUpdate = _step3$value.onInsertOrUpdate;

          if (this.docType.test(null, doc, _filter)) {
            _onInsertOrUpdate(doc);
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.subscriptions.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var _subscription = _step4.value;

          _subscription.onDocumentInsertOrUpdate(doc);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: "subscriptionResolver",
    value: function subscriptionResolver() {
      var _this2 = this;

      return {
        subscribe: function subscribe(_, args, _context, info) {
          return new CollectionSubscription(_this2, args.filter || {}, parseSelectionSet(info.operation.selectionSet, _this2.name));
        }
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
          _regenerator["default"].mark(function _callee6(parent, args, context) {
            return _regenerator["default"].wrap(function _callee6$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    return _context7.abrupt("return", wrap(_this3.log, 'QUERY', args,
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee5() {
                      var filter, orderBy, limit, timeout, q, span;
                      return _regenerator["default"].wrap(function _callee5$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              _this3.log.debug('QUERY', args);

                              filter = args.filter || {};
                              orderBy = args.orderBy || [];
                              limit = args.limit || 50;
                              timeout = (Number(args.timeout) || 0) * 1000;
                              q = _this3.genQuery(filter, orderBy, limit);
                              _context6.next = 8;
                              return _this3.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 8:
                              span = _context6.sent;
                              _context6.prev = 9;

                              if (!(timeout > 0)) {
                                _context6.next = 16;
                                break;
                              }

                              _context6.next = 13;
                              return _this3.queryWaitFor(q, filter, timeout);

                            case 13:
                              return _context6.abrupt("return", _context6.sent);

                            case 16:
                              _context6.next = 18;
                              return _this3.query(q);

                            case 18:
                              return _context6.abrupt("return", _context6.sent);

                            case 19:
                              _context6.prev = 19;
                              _context6.next = 22;
                              return span.finish();

                            case 22:
                              return _context6.finish(19);

                            case 23:
                            case "end":
                              return _context6.stop();
                          }
                        }
                      }, _callee5, null, [[9,, 19, 23]]);
                    }))));

                  case 1:
                  case "end":
                    return _context7.stop();
                }
              }
            }, _callee6);
          }));

          return function (_x6, _x7, _x8) {
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
      _regenerator["default"].mark(function _callee7(q) {
        var cursor;
        return _regenerator["default"].wrap(function _callee7$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.db.query(q);

              case 2:
                cursor = _context8.sent;
                _context8.next = 5;
                return cursor.all();

              case 5:
                return _context8.abrupt("return", _context8.sent);

              case 6:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee7, this);
      }));

      function query(_x9) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee8(q, filter, timeout) {
        var _this4 = this;

        var waitForId, onQuery, onChangesFeed, onTimeout;
        return _regenerator["default"].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                waitForId = null;
                _context9.prev = 1;
                onQuery = new Promise(function (resolve, reject) {
                  _this4.query(q).then(function (docs) {
                    if (docs.length > 0) {
                      resolve(docs);
                    }
                  }, reject);
                });
                onChangesFeed = new Promise(function (resolve) {
                  waitForId = _this4.waitFor.add({
                    filter: filter,
                    onInsertOrUpdate: function onInsertOrUpdate(doc) {
                      resolve([doc]);
                    }
                  });
                });
                onTimeout = new Promise(function (resolve) {
                  setTimeout(function () {
                    return resolve([]);
                  }, timeout);
                });
                _context9.next = 7;
                return Promise.race([onQuery, onChangesFeed, onTimeout]);

              case 7:
                return _context9.abrupt("return", _context9.sent);

              case 8:
                _context9.prev = 8;

                if (waitForId !== null && waitForId !== undefined) {
                  this.waitFor.remove(waitForId);
                }

                return _context9.finish(8);

              case 11:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee8, this, [[1,, 8, 11]]);
      }));

      function queryWaitFor(_x10, _x11, _x12) {
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
      _regenerator["default"].mark(function _callee10(key) {
        var _this5 = this;

        return _regenerator["default"].wrap(function _callee10$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                if (key) {
                  _context11.next = 2;
                  break;
                }

                return _context11.abrupt("return", Promise.resolve(null));

              case 2:
                return _context11.abrupt("return", wrap(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee9() {
                  return _regenerator["default"].wrap(function _callee9$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          return _context10.abrupt("return", _this5.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee9);
                }))));

              case 3:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee10, this);
      }));

      function fetchDocByKey(_x13) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee11(keys) {
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee11$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context12.next = 2;
                  break;
                }

                return _context12.abrupt("return", Promise.resolve([]));

              case 2:
                return _context12.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this6.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee11);
      }));

      function fetchDocsByKeys(_x14) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uIiwiZmlsdGVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJzdWJzY3JpcHRpb25zIiwiYWRkIiwiaXNRdWV1ZU92ZXJmbG93IiwiZG9jVHlwZSIsInRlc3QiLCJwdXNoVmFsdWUiLCJnZXRRdWV1ZVNpemUiLCJxdWV1ZVNpemUiLCJtYXhRdWV1ZVNpemUiLCJzaGlmdCIsImRvbmUiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlbW92ZSIsImVtcHR5UXVldWUiLCJyZWplY3QiLCIkJGFzeW5jSXRlcmF0b3IiLCJmb3JFYWNoIiwiQ29sbGVjdGlvbiIsImxvZ3MiLCJjaGFuZ2VMb2ciLCJ0cmFjZXIiLCJkYiIsImNyZWF0ZSIsIndhaXRGb3IiLCJvbkluc2VydE9yVXBkYXRlIiwic3Vic2NyaXB0aW9uIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwic3Vic2NyaWJlIiwiXyIsIl9jb250ZXh0IiwiaW5mbyIsIm9wZXJhdGlvbiIsInBhcmVudCIsImNvbnRleHQiLCJkZWJ1ZyIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJxIiwiZ2VuUXVlcnkiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwicXVlcnlXYWl0Rm9yIiwicXVlcnkiLCJmaW5pc2giLCJjdXJzb3IiLCJhbGwiLCJ3YWl0Rm9ySWQiLCJvblF1ZXJ5IiwidGhlbiIsImRvY3MiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0Iiwic2V0VGltZW91dCIsInJhY2UiLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnlRbCIsIm1hcCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJqb2luIiwic29ydFNlY3Rpb24iLCJsaW1pdFFsIiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImJpbmRWYXJzIiwia2V5IiwiZGJDb2xsZWN0aW9uIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5IiwiQ2hhbmdlTG9nIiwiZW5hYmxlZCIsInJlY29yZHMiLCJjbGVhciIsInRpbWUiLCJleGlzdGluZyIsImdldCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQXlDc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxjQUFJQSxPQUFKLElBQWUsY0FBSUMsV0FBbkIsSUFBa0MsY0FBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJ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YixDQUFpQm5ILEVBQWpCLENBQWpCOztBQUNBLFVBQUlrSCxRQUFKLEVBQWM7QUFDVkEsUUFBQUEsUUFBUSxDQUFDbEcsSUFBVCxDQUFjaUcsSUFBZDtBQUNILE9BRkQsTUFFTztBQUNILGFBQUtGLE9BQUwsQ0FBYTNHLEdBQWIsQ0FBaUJKLEVBQWpCLEVBQXFCLENBQUNpSCxJQUFELENBQXJCO0FBQ0g7QUFDSjs7O3dCQUVHakgsRSxFQUFzQjtBQUN0QixhQUFPLEtBQUsrRyxPQUFMLENBQWFJLEdBQWIsQ0FBaUJuSCxFQUFqQixLQUF3QixFQUEvQjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyAkJGFzeW5jSXRlcmF0b3IgfSBmcm9tICdpdGVyYWxsJztcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIENvbGxlY3Rpb25XYWl0Rm9yID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCxcbn1cblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxudHlwZSBRdWVyeSA9IHtcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIGJpbmRWYXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0ge1xuICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgfTtcbiAgICAgICAgbG9nLmVycm9yKCdGQUlMRUQnLCBvcCwgYXJncywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cblxuY2xhc3MgUmVnaXN0cnlNYXA8VD4ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpdGVtczogTWFwPG51bWJlciwgVD47XG4gICAgbGFzdElkOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSAwO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZChpdGVtOiBUKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5sYXN0SWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlkID0gaWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGlkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuaXRlbXMuaGFzKGlkKSk7XG4gICAgICAgIHRoaXMubGFzdElkID0gaWQ7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGlkLCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHJlbW92ZShpZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcy5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlICR7dGhpcy5uYW1lfTogaXRlbSB3aXRoIGlkIFske2lkfV0gZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IFtudW1iZXIsIFRdW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMuZW50cmllcygpXTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogVFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbikgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbi8vJEZsb3dGaXhNZVxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25TdWJzY3JpcHRpb24gaW1wbGVtZW50cyBBc3luY0l0ZXJhdG9yPGFueT4ge1xuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb247XG4gICAgaWQ6IG51bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgZXZlbnRDb3VudDogbnVtYmVyO1xuICAgIHB1bGxRdWV1ZTogKCh2YWx1ZTogYW55KSA9PiB2b2lkKVtdO1xuICAgIHB1c2hRdWV1ZTogYW55W107XG4gICAgcnVubmluZzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xuICAgICAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmlkID0gY29sbGVjdGlvbi5zdWJzY3JpcHRpb25zLmFkZCh0aGlzKTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcblxuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldFF1ZXVlU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoUXVldWUubGVuZ3RoICsgdGhpcy5wdWxsUXVldWUubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1c2hWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIGNvbnN0IHF1ZXVlU2l6ZSA9IHRoaXMuZ2V0UXVldWVTaXplKCk7XG4gICAgICAgIGlmIChxdWV1ZVNpemUgPiB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplID0gcXVldWVTaXplO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCArPSAxO1xuICAgICAgICBpZiAodGhpcy5wdWxsUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5zaGlmdCgpKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgID8geyB2YWx1ZSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBuZXh0KCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHVzaFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgICAgID8geyB2YWx1ZTogdGhpcy5wdXNoUXVldWUuc2hpZnQoKSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnB1c2gocmVzb2x2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHJldHVybigpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5yZW1vdmUodGhpcy5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgfVxuXG4gICAgYXN5bmMgdGhyb3coZXJyb3I/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5yZW1vdmUodGhpcy5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgIH1cblxuICAgIC8vJEZsb3dGaXhNZVxuICAgIFskJGFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBlbXB0eVF1ZXVlKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLmZvckVhY2gocmVzb2x2ZSA9PiByZXNvbHZlKHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2c7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgZGI6IERhdGFiYXNlO1xuXG4gICAgc3Vic2NyaXB0aW9uczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvblN1YnNjcmlwdGlvbj47XG4gICAgd2FpdEZvcjogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbldhaXRGb3I+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gY2hhbmdlTG9nO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uU3Vic2NyaXB0aW9uPihgJHtuYW1lfSBzdWJzY3JpcHRpb25zYCk7XG4gICAgICAgIHRoaXMud2FpdEZvciA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uV2FpdEZvcj4oYCR7bmFtZX0gd2FpdEZvcmApO1xuXG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgZm9yIChjb25zdCB7IGZpbHRlciwgb25JbnNlcnRPclVwZGF0ZSB9IG9mIHRoaXMud2FpdEZvci52YWx1ZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbjogQ29sbGVjdGlvblN1YnNjcmlwdGlvbiBvZiB0aGlzLnN1YnNjcmlwdGlvbnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzKTtcbiAgICAgICAgICAgIGNvbnN0IGZpbHRlciA9IGFyZ3MuZmlsdGVyIHx8IHt9O1xuICAgICAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICAgICAgY29uc3QgbGltaXQ6IG51bWJlciA9IGFyZ3MubGltaXQgfHwgNTA7XG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gKE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDApICogMTAwMDtcbiAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmdlblF1ZXJ5KGZpbHRlciwgb3JkZXJCeSwgbGltaXQpO1xuXG4gICAgICAgICAgICBjb25zdCBzcGFuID0gYXdhaXQgdGhpcy50cmFjZXIuc3RhcnRTcGFuTG9nKGNvbnRleHQsICdhcmFuZ28uanM6ZmV0Y2hEb2NzJywgJ25ldyBxdWVyeScsIGFyZ3MpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpZiAodGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIGZpbHRlciwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucXVlcnkocSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBRdWVyeSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkocSk7XG4gICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogUXVlcnksIGZpbHRlcjogYW55LCB0aW1lb3V0OiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQgd2FpdEZvcklkOiA/bnVtYmVyID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5xdWVyeShxKS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcylcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JJZCA9IHRoaXMud2FpdEZvci5hZGQoe1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGUoZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShbXSksIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAod2FpdEZvcklkICE9PSBudWxsICYmIHdhaXRGb3JJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yLnJlbW92ZSh3YWl0Rm9ySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZW5RdWVyeShmaWx0ZXI6IGFueSwgb3JkZXJCeTogT3JkZXJCeVtdLCBsaW1pdDogbnVtYmVyKTogUXVlcnkge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IGBGSUxURVIgJHt0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKX1gXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBjb25zdCBvcmRlckJ5UWwgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5UWwgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5UWx9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFFsID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRRbH1gO1xuXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBiaW5kVmFyczogcGFyYW1zLnZhbHVlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubG9nLCAnRkVUQ0hfRE9DX0JZX0tFWScsIGtleSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGJDb2xsZWN0aW9uKCkuZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGtleSkpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VMb2cge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVjb3JkczogTWFwPHN0cmluZywgbnVtYmVyW10+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29yZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGxvZyhpZDogc3RyaW5nLCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLnB1c2godGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KGlkLCBbdGltZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0KGlkOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY29yZHMuZ2V0KGlkKSB8fCBbXTtcbiAgICB9XG59XG4iXX0=