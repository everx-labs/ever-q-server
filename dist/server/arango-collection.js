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
    (0, _defineProperty2["default"])(this, "startTime", void 0);
    this.collection = collection;
    this.filter = filter;
    this.selection = selection;
    this.eventCount = 0;
    this.pullQueue = [];
    this.pushQueue = [];
    this.running = true;
    this.id = collection.subscriptions.add(this);
    this.startTime = Date.now();
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
                      var filter, orderBy, limit, timeout, q, span, start, result;
                      return _regenerator["default"].wrap(function _callee5$(_context6) {
                        while (1) {
                          switch (_context6.prev = _context6.next) {
                            case 0:
                              filter = args.filter || {};
                              orderBy = args.orderBy || [];
                              limit = args.limit || 50;
                              timeout = (Number(args.timeout) || 0) * 1000;
                              q = _this3.genQuery(filter, orderBy, limit);
                              _context6.next = 7;
                              return _this3.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 7:
                              span = _context6.sent;
                              _context6.prev = 8;
                              start = Date.now();

                              if (!(timeout > 0)) {
                                _context6.next = 16;
                                break;
                              }

                              _context6.next = 13;
                              return _this3.queryWaitFor(q, filter, timeout);

                            case 13:
                              _context6.t0 = _context6.sent;
                              _context6.next = 19;
                              break;

                            case 16:
                              _context6.next = 18;
                              return _this3.query(q);

                            case 18:
                              _context6.t0 = _context6.sent;

                            case 19:
                              result = _context6.t0;

                              _this3.log.debug('QUERY', args, (Date.now() - start) / 1000);

                              return _context6.abrupt("return", result);

                            case 22:
                              _context6.prev = 22;
                              _context6.next = 25;
                              return span.finish();

                            case 25:
                              return _context6.finish(22);

                            case 26:
                            case "end":
                              return _context6.stop();
                          }
                        }
                      }, _callee5, null, [[8,, 22, 26]]);
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

        var waitForId, forceTimerId, onQuery, onChangesFeed, onTimeout;
        return _regenerator["default"].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                waitForId = null;
                forceTimerId = null;
                _context9.prev = 2;
                onQuery = new Promise(function (resolve, reject) {
                  var check = function check() {
                    _this4.query(q).then(function (docs) {
                      if (docs.length > 0) {
                        forceTimerId = null;
                        resolve(docs);
                      } else {
                        forceTimerId = setTimeout(check, 5000);
                      }
                    }, reject);
                  };

                  check();
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
                _context9.next = 8;
                return Promise.race([onQuery, onChangesFeed, onTimeout]);

              case 8:
                return _context9.abrupt("return", _context9.sent);

              case 9:
                _context9.prev = 9;

                if (waitForId !== null && waitForId !== undefined) {
                  this.waitFor.remove(waitForId);
                }

                if (forceTimerId !== null) {
                  clearTimeout(forceTimerId);
                  forceTimerId = null;
                }

                return _context9.finish(9);

              case 13:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee8, this, [[2,, 9, 13]]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25TdWJzY3JpcHRpb24iLCJjb2xsZWN0aW9uIiwiZmlsdGVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJzdWJzY3JpcHRpb25zIiwiYWRkIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImlzUXVldWVPdmVyZmxvdyIsImRvY1R5cGUiLCJ0ZXN0IiwicHVzaFZhbHVlIiwiZ2V0UXVldWVTaXplIiwicXVldWVTaXplIiwibWF4UXVldWVTaXplIiwic2hpZnQiLCJkb25lIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZW1vdmUiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJjcmVhdGUiLCJ3YWl0Rm9yIiwib25JbnNlcnRPclVwZGF0ZSIsInN1YnNjcmlwdGlvbiIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsInN1YnNjcmliZSIsIl8iLCJfY29udGV4dCIsImluZm8iLCJvcGVyYXRpb24iLCJwYXJlbnQiLCJjb250ZXh0Iiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsInEiLCJnZW5RdWVyeSIsInN0YXJ0U3BhbkxvZyIsInNwYW4iLCJzdGFydCIsInF1ZXJ5V2FpdEZvciIsInF1ZXJ5IiwicmVzdWx0IiwiZGVidWciLCJmaW5pc2giLCJjdXJzb3IiLCJhbGwiLCJ3YWl0Rm9ySWQiLCJmb3JjZVRpbWVySWQiLCJvblF1ZXJ5IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsInBhcmFtcyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwib3JkZXJCeVFsIiwibWFwIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0UWwiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiYmluZFZhcnMiLCJrZXkiLCJkYkNvbGxlY3Rpb24iLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiLCJDaGFuZ2VMb2ciLCJlbmFibGVkIiwicmVjb3JkcyIsImNsZWFyIiwidGltZSIsImV4aXN0aW5nIiwiZ2V0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O1NBeUNzQkEsSTs7Ozs7OzsrQkFBZixtQkFBdUJDLEdBQXZCLEVBQWtDQyxFQUFsQyxFQUE4Q0MsSUFBOUMsRUFBeURDLEtBQXpEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFY0EsS0FBSyxFQUZuQjs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUlPQyxZQUFBQSxLQUpQLEdBSWU7QUFDVkMs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MjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgJCRhc3luY0l0ZXJhdG9yIH0gZnJvbSAnaXRlcmFsbCc7XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxudHlwZSBDb2xsZWN0aW9uV2FpdEZvciA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBvbkluc2VydE9yVXBkYXRlOiAoZG9jOiBhbnkpID0+IHZvaWQsXG59XG5cbnR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUXVlcnkgPSB7XG4gICAgcXVlcnk6IHN0cmluZyxcbiAgICBiaW5kVmFyczogeyBbc3RyaW5nXTogYW55IH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cmFwPFI+KGxvZzogUUxvZywgb3A6IHN0cmluZywgYXJnczogYW55LCBmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgIH07XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmNsYXNzIFJlZ2lzdHJ5TWFwPFQ+IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXRlbXM6IE1hcDxudW1iZXIsIFQ+O1xuICAgIGxhc3RJZDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubGFzdElkID0gMDtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGQoaXRlbTogVCk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLml0ZW1zLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IGlkO1xuICAgICAgICB0aGlzLml0ZW1zLnNldChpZCwgaXRlbSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmUoaWQ6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSAke3RoaXMubmFtZX06IGl0ZW0gd2l0aCBpZCBbJHtpZH1dIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBbbnVtYmVyLCBUXVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLmVudHJpZXMoKV07XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IFRbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy52YWx1ZXMoKV07XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5mdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMCA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG4vLyRGbG93Rml4TWVcbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uU3Vic2NyaXB0aW9uIGltcGxlbWVudHMgQXN5bmNJdGVyYXRvcjxhbnk+IHtcbiAgICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uO1xuICAgIGlkOiBudW1iZXI7XG4gICAgZmlsdGVyOiBhbnk7XG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdO1xuICAgIGV2ZW50Q291bnQ6IG51bWJlcjtcbiAgICBwdWxsUXVldWU6ICgodmFsdWU6IGFueSkgPT4gdm9pZClbXTtcbiAgICBwdXNoUXVldWU6IGFueVtdO1xuICAgIHJ1bm5pbmc6IGJvb2xlYW47XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5ldmVudENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5hZGQodGhpcyk7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcblxuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldFF1ZXVlU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoUXVldWUubGVuZ3RoICsgdGhpcy5wdWxsUXVldWUubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1c2hWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIGNvbnN0IHF1ZXVlU2l6ZSA9IHRoaXMuZ2V0UXVldWVTaXplKCk7XG4gICAgICAgIGlmIChxdWV1ZVNpemUgPiB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplID0gcXVldWVTaXplO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCArPSAxO1xuICAgICAgICBpZiAodGhpcy5wdWxsUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5zaGlmdCgpKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgID8geyB2YWx1ZSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBuZXh0KCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHVzaFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgICAgID8geyB2YWx1ZTogdGhpcy5wdXNoUXVldWUuc2hpZnQoKSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnB1c2gocmVzb2x2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHJldHVybigpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5yZW1vdmUodGhpcy5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgfVxuXG4gICAgYXN5bmMgdGhyb3coZXJyb3I/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24uc3Vic2NyaXB0aW9ucy5yZW1vdmUodGhpcy5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgIH1cblxuICAgIC8vJEZsb3dGaXhNZVxuICAgIFskJGFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBlbXB0eVF1ZXVlKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLmZvckVhY2gocmVzb2x2ZSA9PiByZXNvbHZlKHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2c7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgZGI6IERhdGFiYXNlO1xuXG4gICAgc3Vic2NyaXB0aW9uczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvblN1YnNjcmlwdGlvbj47XG4gICAgd2FpdEZvcjogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbldhaXRGb3I+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gY2hhbmdlTG9nO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuXG4gICAgICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uU3Vic2NyaXB0aW9uPihgJHtuYW1lfSBzdWJzY3JpcHRpb25zYCk7XG4gICAgICAgIHRoaXMud2FpdEZvciA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uV2FpdEZvcj4oYCR7bmFtZX0gd2FpdEZvcmApO1xuXG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgZm9yIChjb25zdCB7IGZpbHRlciwgb25JbnNlcnRPclVwZGF0ZSB9IG9mIHRoaXMud2FpdEZvci52YWx1ZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IHN1YnNjcmlwdGlvbjogQ29sbGVjdGlvblN1YnNjcmlwdGlvbiBvZiB0aGlzLnN1YnNjcmlwdGlvbnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQ29sbGVjdGlvblN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IChOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwKSAqIDEwMDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcblxuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhjb250ZXh0LCAnYXJhbmdvLmpzOmZldGNoRG9jcycsICduZXcgcXVlcnknLCBhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgZmlsdGVyLCB0aW1lb3V0KVxuICAgICAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocSk7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBRdWVyeSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IHRoaXMuZGIucXVlcnkocSk7XG4gICAgICAgIHJldHVybiBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogUXVlcnksIGZpbHRlcjogYW55LCB0aW1lb3V0OiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQgd2FpdEZvcklkOiA/bnVtYmVyID0gbnVsbDtcbiAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5KHEpLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JJZCA9IHRoaXMud2FpdEZvci5hZGQoe1xuICAgICAgICAgICAgICAgICAgICBmaWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgIG9uSW5zZXJ0T3JVcGRhdGUoZG9jKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShbXSksIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAod2FpdEZvcklkICE9PSBudWxsICYmIHdhaXRGb3JJZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YWl0Rm9yLnJlbW92ZSh3YWl0Rm9ySWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2VuUXVlcnkoZmlsdGVyOiBhbnksIG9yZGVyQnk6IE9yZGVyQnlbXSwgbGltaXQ6IG51bWJlcik6IFF1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3Qgb3JkZXJCeVFsID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVFsICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVFsfWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRRbCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0UWx9YDtcblxuICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlTG9nIHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHJlY29yZHM6IE1hcDxzdHJpbmcsIG51bWJlcltdPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvcmRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBsb2coaWQ6IHN0cmluZywgdGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5wdXNoKHRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRzLnNldChpZCwgW3RpbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldChpZDogc3RyaW5nKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRzLmdldChpZCkgfHwgW107XG4gICAgfVxufVxuIl19