"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.ChangeLog = exports.Collection = exports.SubscriptionListener = exports.WaitForListener = exports.CollectionListener = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

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
  _regenerator["default"].mark(function _callee13(log, op, args, fetch) {
    var error;
    return _regenerator["default"].wrap(function _callee13$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.prev = 0;
            _context14.next = 3;
            return fetch();

          case 3:
            return _context14.abrupt("return", _context14.sent);

          case 6:
            _context14.prev = 6;
            _context14.t0 = _context14["catch"](0);
            error = {
              message: _context14.t0.message || _context14.t0.ArangoError || _context14.t0.toString(),
              code: _context14.t0.code
            };
            log.error('FAILED', op, args, error.message);
            throw error;

          case 11:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee13, null, [[0, 6]]);
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
}

var CollectionListener =
/*#__PURE__*/
function () {
  function CollectionListener(collection, filter, selection) {
    (0, _classCallCheck2["default"])(this, CollectionListener);
    (0, _defineProperty2["default"])(this, "collection", void 0);
    (0, _defineProperty2["default"])(this, "id", void 0);
    (0, _defineProperty2["default"])(this, "filter", void 0);
    (0, _defineProperty2["default"])(this, "selection", void 0);
    (0, _defineProperty2["default"])(this, "startTime", void 0);
    this.collection = collection;
    this.filter = filter;
    this.selection = selection;
    this.id = collection.listeners.add(this);
    this.startTime = Date.now();
  }

  (0, _createClass2["default"])(CollectionListener, [{
    key: "close",
    value: function close() {
      var id = this.id;

      if (id !== null && id !== undefined) {
        this.id = null;
        this.collection.listeners.remove(id);
      }
    }
  }, {
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {}
  }, {
    key: "getEventCount",
    value: function getEventCount() {
      return 0;
    }
  }]);
  return CollectionListener;
}();

exports.CollectionListener = CollectionListener;

var WaitForListener =
/*#__PURE__*/
function (_CollectionListener) {
  (0, _inherits2["default"])(WaitForListener, _CollectionListener);

  function WaitForListener(collection, filter, selection, onInsertOrUpdate) {
    var _this;

    (0, _classCallCheck2["default"])(this, WaitForListener);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(WaitForListener).call(this, collection, filter, selection));
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this), "onInsertOrUpdate", void 0);
    _this.onInsertOrUpdate = onInsertOrUpdate;
    return _this;
  }

  (0, _createClass2["default"])(WaitForListener, [{
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      this.onInsertOrUpdate(doc);
    }
  }]);
  return WaitForListener;
}(CollectionListener); //$FlowFixMe


exports.WaitForListener = WaitForListener;

var SubscriptionListener =
/*#__PURE__*/
function (_CollectionListener2) {
  (0, _inherits2["default"])(SubscriptionListener, _CollectionListener2);

  function SubscriptionListener(collection, filter, selection) {
    var _this2;

    (0, _classCallCheck2["default"])(this, SubscriptionListener);
    _this2 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(SubscriptionListener).call(this, collection, filter, selection));
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "eventCount", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "pullQueue", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "pushQueue", void 0);
    (0, _defineProperty2["default"])((0, _assertThisInitialized2["default"])(_this2), "running", void 0);
    _this2.eventCount = 0;
    _this2.pullQueue = [];
    _this2.pushQueue = [];
    _this2.running = true;
    return _this2;
  }

  (0, _createClass2["default"])(SubscriptionListener, [{
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
    key: "getEventCount",
    value: function getEventCount() {
      return this.eventCount;
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
        var _this3 = this;

        return _regenerator["default"].wrap(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve) {
                  if (_this3.pushQueue.length !== 0) {
                    resolve(_this3.running ? {
                      value: _this3.pushQueue.shift(),
                      done: false
                    } : {
                      value: undefined,
                      done: true
                    });
                  } else {
                    _this3.pullQueue.push(resolve);
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
                this.close();
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
                this.close();
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
  return SubscriptionListener;
}(CollectionListener);

exports.SubscriptionListener = SubscriptionListener;

var Collection =
/*#__PURE__*/
function () {
  function Collection(name, docType, logs, changeLog, tracer, db, slowDb) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
    (0, _defineProperty2["default"])(this, "listeners", void 0);
    (0, _defineProperty2["default"])(this, "queryStats", void 0);
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.listeners = new RegistryMap("".concat(name, " listeners"));
    this.queryStats = new Map();
    this.maxQueueSize = 0;
  } // Subscriptions


  (0, _createClass2["default"])(Collection, [{
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.listeners.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _listener = _step3.value;

          if (this.docType.test(null, doc, _listener.filter)) {
            _listener.onDocumentInsertOrUpdate(doc);
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
    }
  }, {
    key: "subscriptionResolver",
    value: function subscriptionResolver() {
      var _this4 = this;

      return {
        subscribe: function subscribe(_, args, _context, info) {
          //TODO: const span = this.tracer.startSpanLog(
          //     _context,
          //     'arango-collection.js:subscriptionResolver',
          //     'new subscription',
          //     args);
          var result = new SubscriptionListener(_this4, args.filter || {}, parseSelectionSet(info.operation.selectionSet, _this4.name)); //TODO: span.finish();

          return result;
        }
      };
    } // Queries

  }, {
    key: "ensureQueryStat",
    value: function () {
      var _ensureQueryStat = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(q) {
        var existing, plan, stat;
        return _regenerator["default"].wrap(function _callee5$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                existing = this.queryStats.get(q.query);

                if (!(existing !== undefined)) {
                  _context6.next = 3;
                  break;
                }

                return _context6.abrupt("return", existing);

              case 3:
                _context6.next = 5;
                return this.db.explain(q);

              case 5:
                plan = _context6.sent.plan;
                stat = {
                  estimatedCost: plan.estimatedCost,
                  slow: false,
                  times: []
                };

                if (plan.nodes.find(function (node) {
                  return node.type === 'EnumerateCollectionNode';
                })) {
                  stat.slow = true;
                }

                this.queryStats.set(q.query, stat);
                return _context6.abrupt("return", stat);

              case 10:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee5, this);
      }));

      function ensureQueryStat(_x6) {
        return _ensureQueryStat.apply(this, arguments);
      }

      return ensureQueryStat;
    }()
  }, {
    key: "queryResolver",
    value: function queryResolver() {
      var _this5 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee7(parent, args, context, info) {
            return _regenerator["default"].wrap(function _callee7$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    return _context8.abrupt("return", wrap(_this5.log, 'QUERY', args,
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee6() {
                      var span, filter, selection, orderBy, limit, timeout, q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return _this5.tracer.startSpanLog(context, 'arango-collection.js:queryResolver', 'new query', args);

                            case 2:
                              span = _context7.sent;
                              filter = args.filter || {};
                              selection = parseSelectionSet(info.operation.selectionSet, _this5.name);
                              orderBy = args.orderBy || [];
                              limit = args.limit || 50;
                              timeout = Number(args.timeout) || 0;
                              q = _this5.genQuery(filter, orderBy, limit);

                              if (q) {
                                _context7.next = 12;
                                break;
                              }

                              _this5.log.debug('QUERY', args, 0, 'SKIPPED');

                              return _context7.abrupt("return", []);

                            case 12:
                              _context7.next = 14;
                              return _this5.ensureQueryStat(q);

                            case 14:
                              stat = _context7.sent;
                              _context7.prev = 15;
                              start = Date.now();

                              if (!(timeout > 0)) {
                                _context7.next = 23;
                                break;
                              }

                              _context7.next = 20;
                              return _this5.queryWaitFor(q, stat, filter, selection, timeout, span);

                            case 20:
                              _context7.t0 = _context7.sent;
                              _context7.next = 26;
                              break;

                            case 23:
                              _context7.next = 25;
                              return _this5.query(q, stat, span);

                            case 25:
                              _context7.t0 = _context7.sent;

                            case 26:
                              result = _context7.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST');

                              return _context7.abrupt("return", result);

                            case 29:
                              _context7.prev = 29;
                              _context7.next = 32;
                              return span.finish();

                            case 32:
                              return _context7.finish(29);

                            case 33:
                            case "end":
                              return _context7.stop();
                          }
                        }
                      }, _callee6, null, [[15,, 29, 33]]);
                    }))));

                  case 1:
                  case "end":
                    return _context8.stop();
                }
              }
            }, _callee7);
          }));

          return function (_x7, _x8, _x9, _x10) {
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
      _regenerator["default"].mark(function _callee8(q, stat, rootSpan) {
        var span, db, start, cursor, result;
        return _regenerator["default"].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.tracer.startSpan(rootSpan, 'arango-collections.js:query');

              case 2:
                span = _context9.sent;
                _context9.prev = 3;
                db = stat.slow ? this.slowDb : this.db;
                start = Date.now();
                _context9.next = 8;
                return db.query(q);

              case 8:
                cursor = _context9.sent;
                _context9.next = 11;
                return cursor.all();

              case 11:
                result = _context9.sent;
                stat.times.push(Date.now() - start);

                if (stat.times.length > 1000) {
                  stat.times.shift();
                }

                return _context9.abrupt("return", result);

              case 15:
                _context9.prev = 15;
                _context9.next = 18;
                return span.finish();

              case 18:
                return _context9.finish(15);

              case 19:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee8, this, [[3,, 15, 19]]);
      }));

      function query(_x11, _x12, _x13) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee9(q, stat, filter, selection, timeout, rootSpan) {
        var _this6 = this;

        var span, waitFor, forceTimerId, onQuery, onChangesFeed, onTimeout;
        return _regenerator["default"].wrap(function _callee9$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.tracer.startSpan(rootSpan, 'arango-collection.js:queryWaitFor');

              case 2:
                span = _context10.sent;
                waitFor = null;
                forceTimerId = null;
                _context10.prev = 5;
                onQuery = new Promise(function (resolve, reject) {
                  var check = function check() {
                    _this6.query(q, stat, span).then(function (docs) {
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
                  waitFor = new WaitForListener(_this6, filter, selection, function (doc) {
                    resolve([doc]);
                  });
                });
                onTimeout = new Promise(function (resolve) {
                  setTimeout(function () {
                    return resolve([]);
                  }, timeout);
                });
                _context10.next = 11;
                return Promise.race([onQuery, onChangesFeed, onTimeout]);

              case 11:
                return _context10.abrupt("return", _context10.sent);

              case 12:
                _context10.prev = 12;

                if (waitFor !== null && waitFor !== undefined) {
                  waitFor.close();
                }

                if (forceTimerId !== null) {
                  clearTimeout(forceTimerId);
                  forceTimerId = null;
                }

                _context10.next = 17;
                return span.finish();

              case 17:
                return _context10.finish(12);

              case 18:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee9, this, [[5,, 12, 18]]);
      }));

      function queryWaitFor(_x14, _x15, _x16, _x17, _x18, _x19) {
        return _queryWaitFor.apply(this, arguments);
      }

      return queryWaitFor;
    }()
  }, {
    key: "genQuery",
    value: function genQuery(filter, orderBy, limit) {
      var params = new _qTypes.QParams();
      var filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(this.docType.ql(params, 'doc', filter)) : '';

      if (filterSection === 'FILTER false') {
        return null;
      }

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
      _regenerator["default"].mark(function _callee11(key) {
        var _this7 = this;

        return _regenerator["default"].wrap(function _callee11$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                if (key) {
                  _context12.next = 2;
                  break;
                }

                return _context12.abrupt("return", Promise.resolve(null));

              case 2:
                return _context12.abrupt("return", wrap(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee10() {
                  return _regenerator["default"].wrap(function _callee10$(_context11) {
                    while (1) {
                      switch (_context11.prev = _context11.next) {
                        case 0:
                          return _context11.abrupt("return", _this7.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context11.stop();
                      }
                    }
                  }, _callee10);
                }))));

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee11, this);
      }));

      function fetchDocByKey(_x20) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee12(keys) {
        var _this8 = this;

        return _regenerator["default"].wrap(function _callee12$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context13.next = 2;
                  break;
                }

                return _context13.abrupt("return", Promise.resolve([]));

              case 2:
                return _context13.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this8.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee12);
      }));

      function fetchDocsByKeys(_x21) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJmaWx0ZXIiLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJzbG93RGIiLCJjcmVhdGUiLCJxdWVyeVN0YXRzIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwicmVzdWx0Iiwib3BlcmF0aW9uIiwicSIsImV4aXN0aW5nIiwiZ2V0IiwicXVlcnkiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0Iiwic3RhcnRTcGFuTG9nIiwic3BhbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJnZW5RdWVyeSIsImRlYnVnIiwiZW5zdXJlUXVlcnlTdGF0Iiwic3RhcnQiLCJxdWVyeVdhaXRGb3IiLCJmaW5pc2giLCJyb290U3BhbiIsInN0YXJ0U3BhbiIsImN1cnNvciIsImFsbCIsIndhaXRGb3IiLCJmb3JjZVRpbWVySWQiLCJvblF1ZXJ5IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsInBhcmFtcyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwib3JkZXJCeVFsIiwibWFwIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0UWwiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiYmluZFZhcnMiLCJrZXkiLCJkYkNvbGxlY3Rpb24iLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiLCJDaGFuZ2VMb2ciLCJlbmFibGVkIiwicmVjb3JkcyIsImNsZWFyIiwidGltZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O1NBb0NzQkEs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NUksR0FBSixFQUFmO0FBQ0g7Ozs7NEJBRU87QUFDSixXQUFLNEksT0FBTCxDQUFhQyxLQUFiO0FBQ0g7Ozt3QkFFRzNJLEUsRUFBWTRJLEksRUFBYztBQUMxQixVQUFJLENBQUMsS0FBS0gsT0FBVixFQUFtQjtBQUNmO0FBQ0g7O0FBQ0QsVUFBTWpFLFFBQVEsR0FBRyxLQUFLa0UsT0FBTCxDQUFhakUsR0FBYixDQUFpQnpFLEVBQWpCLENBQWpCOztBQUNBLFVBQUl3RSxRQUFKLEVBQWM7QUFDVkEsUUFBQUEsUUFBUSxDQUFDeEQsSUFBVCxDQUFjNEgsSUFBZDtBQUNILE9BRkQsTUFFTztBQUNILGFBQUtGLE9BQUwsQ0FBYXRJLEdBQWIsQ0FBaUJKLEVBQWpCLEVBQXFCLENBQUM0SSxJQUFELENBQXJCO0FBQ0g7QUFDSjs7O3dCQUVHNUksRSxFQUFzQjtBQUN0QixhQUFPLEtBQUswSSxPQUFMLENBQWFqRSxHQUFiLENBQWlCekUsRUFBakIsS0FBd0IsRUFBL0I7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgJCRhc3luY0l0ZXJhdG9yIH0gZnJvbSAnaXRlcmFsbCc7XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxudHlwZSBRdWVyeSA9IHtcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIGJpbmRWYXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0ge1xuICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgfTtcbiAgICAgICAgbG9nLmVycm9yKCdGQUlMRUQnLCBvcCwgYXJncywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cblxuY2xhc3MgUmVnaXN0cnlNYXA8VD4ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpdGVtczogTWFwPG51bWJlciwgVD47XG4gICAgbGFzdElkOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSAwO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZChpdGVtOiBUKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5sYXN0SWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlkID0gaWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGlkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuaXRlbXMuaGFzKGlkKSk7XG4gICAgICAgIHRoaXMubGFzdElkID0gaWQ7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGlkLCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHJlbW92ZShpZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcy5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlICR7dGhpcy5uYW1lfTogaXRlbSB3aXRoIGlkIFske2lkfV0gZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IFtudW1iZXIsIFRdW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMuZW50cmllcygpXTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogVFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbikgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb247XG4gICAgaWQ6ID9udW1iZXI7XG4gICAgZmlsdGVyOiBhbnk7XG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdO1xuICAgIHN0YXJ0VGltZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoY29sbGVjdGlvbjogQ29sbGVjdGlvbiwgZmlsdGVyOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSkge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24gPSBjb2xsZWN0aW9uO1xuICAgICAgICB0aGlzLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgdGhpcy5zZWxlY3Rpb24gPSBzZWxlY3Rpb247XG4gICAgICAgIHRoaXMuaWQgPSBjb2xsZWN0aW9uLmxpc3RlbmVycy5hZGQodGhpcyk7XG4gICAgICAgIHRoaXMuc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWQgIT09IG51bGwgJiYgaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ubGlzdGVuZXJzLnJlbW92ZShpZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgV2FpdEZvckxpc3RlbmVyIGV4dGVuZHMgQ29sbGVjdGlvbkxpc3RlbmVyIHtcbiAgICBvbkluc2VydE9yVXBkYXRlOiAoZG9jOiBhbnkpID0+IHZvaWQ7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLCBvbkluc2VydE9yVXBkYXRlOiAoZG9jOiBhbnkpID0+IHZvaWQpIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbiwgZmlsdGVyLCBzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUgPSBvbkluc2VydE9yVXBkYXRlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICB9XG59XG5cblxuLy8kRmxvd0ZpeE1lXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIgaW1wbGVtZW50cyBBc3luY0l0ZXJhdG9yPGFueT4ge1xuICAgIGV2ZW50Q291bnQ6IG51bWJlcjtcbiAgICBwdWxsUXVldWU6ICgodmFsdWU6IGFueSkgPT4gdm9pZClbXTtcbiAgICBwdXNoUXVldWU6IGFueVtdO1xuICAgIHJ1bm5pbmc6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIGZpbHRlciwgc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5ldmVudENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFZhbHVlKHsgW3RoaXMuY29sbGVjdGlvbi5uYW1lXTogc2VsZWN0RmllbGRzKGRvYywgdGhpcy5zZWxlY3Rpb24pIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNRdWV1ZU92ZXJmbG93KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRRdWV1ZVNpemUoKSA+PSAxMDtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Q291bnQ7XG4gICAgfVxuXG4gICAgZ2V0UXVldWVTaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hRdWV1ZS5sZW5ndGggKyB0aGlzLnB1bGxRdWV1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVzaFZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgY29uc3QgcXVldWVTaXplID0gdGhpcy5nZXRRdWV1ZVNpemUoKTtcbiAgICAgICAgaWYgKHF1ZXVlU2l6ZSA+IHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUgPSBxdWV1ZVNpemU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudENvdW50ICs9IDE7XG4gICAgICAgIGlmICh0aGlzLnB1bGxRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnNoaWZ0KCkodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgPyB7IHZhbHVlLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIG5leHQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wdXNoUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICAgICAgPyB7IHZhbHVlOiB0aGlzLnB1c2hRdWV1ZS5zaGlmdCgpLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUucHVzaChyZXNvbHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmV0dXJuKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBhc3luYyB0aHJvdyhlcnJvcj86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgLy8kRmxvd0ZpeE1lXG4gICAgWyQkYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFzeW5jIGVtcHR5UXVldWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuZm9yRWFjaChyZXNvbHZlID0+IHJlc29sdmUoeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBlc3RpbWF0ZWRDb3N0OiBudW1iZXIsXG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2c7XG4gICAgdHJhY2VyOiBUcmFjZXI7XG4gICAgZGI6IERhdGFiYXNlO1xuICAgIHNsb3dEYjogRGF0YWJhc2U7XG5cbiAgICBsaXN0ZW5lcnM6IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj47XG4gICAgcXVlcnlTdGF0czogTWFwPHN0cmluZywgUXVlcnlTdGF0PjtcblxuICAgIG1heFF1ZXVlU2l6ZTogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIG5hbWU6IHN0cmluZyxcbiAgICAgICAgZG9jVHlwZTogUVR5cGUsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZyxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLmNoYW5nZUxvZyA9IGNoYW5nZUxvZztcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBsaXN0ZW5lci5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBfY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAvL1RPRE86IGNvbnN0IHNwYW4gPSB0aGlzLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgICAgICAgICAgLy8gICAgIF9jb250ZXh0LFxuICAgICAgICAgICAgICAgIC8vICAgICAnYXJhbmdvLWNvbGxlY3Rpb24uanM6c3Vic2NyaXB0aW9uUmVzb2x2ZXInLFxuICAgICAgICAgICAgICAgIC8vICAgICAnbmV3IHN1YnNjcmlwdGlvbicsXG4gICAgICAgICAgICAgICAgLy8gICAgIGFyZ3MpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTdWJzY3JpcHRpb25MaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIC8vVE9ETzogc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGFzeW5jIGVuc3VyZVF1ZXJ5U3RhdChxOiBRdWVyeSk6IFByb21pc2U8UXVlcnlTdGF0PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5xdWVyeVN0YXRzLmdldChxLnF1ZXJ5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFuID0gKGF3YWl0IHRoaXMuZGIuZXhwbGFpbihxKSkucGxhbjtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IHBsYW4uZXN0aW1hdGVkQ29zdCxcbiAgICAgICAgICAgIHNsb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGxhbi5ub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS50eXBlID09PSAnRW51bWVyYXRlQ29sbGVjdGlvbk5vZGUnKSkge1xuICAgICAgICAgICAgc3RhdC5zbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEucXVlcnksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gYXdhaXQgdGhpcy50cmFjZXIuc3RhcnRTcGFuTG9nKFxuICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgJ2FyYW5nby1jb2xsZWN0aW9uLmpzOnF1ZXJ5UmVzb2x2ZXInLFxuICAgICAgICAgICAgICAgICduZXcgcXVlcnknLFxuICAgICAgICAgICAgICAgIGFyZ3MpO1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSk7XG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSBOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuZ2VuUXVlcnkoZmlsdGVyLCBvcmRlckJ5LCBsaW1pdCk7XG4gICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBhd2FpdCB0aGlzLmVuc3VyZVF1ZXJ5U3RhdChxKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgc3RhdCwgZmlsdGVyLCBzZWxlY3Rpb24sIHRpbWVvdXQsIHNwYW4pXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLCBzdGF0LCBzcGFuKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsIHN0YXQuc2xvdyA/ICdTTE9XJyA6ICdGQVNUJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCwgcm9vdFNwYW46IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW4ocm9vdFNwYW4sICdhcmFuZ28tY29sbGVjdGlvbnMuanM6cXVlcnknKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IGRiID0gc3RhdC5zbG93ID8gdGhpcy5zbG93RGIgOiB0aGlzLmRiO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocSk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgICAgICBzdGF0LnRpbWVzLnB1c2goRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgICAgIGlmIChzdGF0LnRpbWVzLmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICBzdGF0LnRpbWVzLnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKHE6IFF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQsIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sIHRpbWVvdXQ6IG51bWJlciwgcm9vdFNwYW46IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW4ocm9vdFNwYW4sICdhcmFuZ28tY29sbGVjdGlvbi5qczpxdWVyeVdhaXRGb3InKTtcbiAgICAgICAgbGV0IHdhaXRGb3I6ID9XYWl0Rm9yTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnkocSwgc3RhdCwgc3BhbikudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgd2FpdEZvciA9IG5ldyBXYWl0Rm9yTGlzdGVuZXIodGhpcywgZmlsdGVyLCBzZWxlY3Rpb24sIChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoW10pLCB0aW1lb3V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgd2FpdEZvci5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZW5RdWVyeShmaWx0ZXI6IGFueSwgb3JkZXJCeTogT3JkZXJCeVtdLCBsaW1pdDogbnVtYmVyKTogP1F1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKGZpbHRlclNlY3Rpb24gPT09ICdGSUxURVIgZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmRlckJ5UWwgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5UWwgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5UWx9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFFsID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRRbH1gO1xuXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBiaW5kVmFyczogcGFyYW1zLnZhbHVlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubG9nLCAnRkVUQ0hfRE9DX0JZX0tFWScsIGtleSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGJDb2xsZWN0aW9uKCkuZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGtleSkpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VMb2cge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVjb3JkczogTWFwPHN0cmluZywgbnVtYmVyW10+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29yZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGxvZyhpZDogc3RyaW5nLCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLnB1c2godGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KGlkLCBbdGltZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0KGlkOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY29yZHMuZ2V0KGlkKSB8fCBbXTtcbiAgICB9XG59XG4iXX0=