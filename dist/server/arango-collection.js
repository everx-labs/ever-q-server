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
 * Copyright 2018-2020 TON DEV SOLUTIONS LTD.
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
    selected.id = doc._key;
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = selection[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _item2 = _step2.value;
      var _onField = {
        in_message: 'in_msg',
        out_messages: 'out_msg',
        signatures: 'id'
      }[_item2.name];

      if (_onField !== undefined && doc[_onField] !== undefined) {
        selected[_onField] = doc[_onField];
      }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsIm9uRmllbGQiLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJmaWx0ZXIiLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJzbG93RGIiLCJjcmVhdGUiLCJxdWVyeVN0YXRzIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwicmVzdWx0Iiwib3BlcmF0aW9uIiwicSIsImV4aXN0aW5nIiwiZ2V0IiwicXVlcnkiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0Iiwic3RhcnRTcGFuTG9nIiwic3BhbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJnZW5RdWVyeSIsImRlYnVnIiwiZW5zdXJlUXVlcnlTdGF0Iiwic3RhcnQiLCJxdWVyeVdhaXRGb3IiLCJmaW5pc2giLCJyb290U3BhbiIsInN0YXJ0U3BhbiIsImN1cnNvciIsImFsbCIsIndhaXRGb3IiLCJmb3JjZVRpbWVySWQiLCJvblF1ZXJ5IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0IiwicmFjZSIsImNsZWFyVGltZW91dCIsInBhcmFtcyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwib3JkZXJCeVFsIiwibWFwIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsImpvaW4iLCJzb3J0U2VjdGlvbiIsImxpbWl0UWwiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiYmluZFZhcnMiLCJrZXkiLCJkYkNvbGxlY3Rpb24iLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiLCJDaGFuZ2VMb2ciLCJlbmFibGVkIiwicmVjb3JkcyIsImNsZWFyIiwidGltZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztB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QTtBQUFBO0FBQUE7QUFBQSxpQkFBcEMsRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUtPZixJOzs7Ozs7O3NCQUNkLENBQUNBLElBQUQsSUFBU0EsSUFBSSxDQUFDL0YsTUFBTCxLQUFnQixDOzs7OzttREFDbEIwQixPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQzs7O21EQUVKRCxPQUFPLENBQUNxRCxHQUFSLENBQVlnQixJQUFJLENBQUNHLEdBQUwsQ0FBUyxVQUFBWSxHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDRyxhQUFMLENBQW1CSCxHQUFuQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUZJLFM7OztBQUlULHVCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBSWhKLEdBQUosRUFBZjtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBS2dKLE9BQUwsQ0FBYUMsS0FBYjtBQUNIOzs7d0JBRUcvSSxFLEVBQVlnSixJLEVBQWM7QUFDMUIsVUFBSSxDQUFDLEtBQUtILE9BQVYsRUFBbUI7QUFDZjtBQUNIOztBQUNELFVBQU1qRSxRQUFRLEdBQUcsS0FBS2tFLE9BQUwsQ0FBYWpFLEdBQWIsQ0FBaUI3RSxFQUFqQixDQUFqQjs7QUFDQSxVQUFJNEUsUUFBSixFQUFjO0FBQ1ZBLFFBQUFBLFFBQVEsQ0FBQzVELElBQVQsQ0FBY2dJLElBQWQ7QUFDSCxPQUZELE1BRU87QUFDSCxhQUFLRixPQUFMLENBQWExSSxHQUFiLENBQWlCSixFQUFqQixFQUFxQixDQUFDZ0osSUFBRCxDQUFyQjtBQUNIO0FBQ0o7Ozt3QkFFR2hKLEUsRUFBc0I7QUFDdEIsYUFBTyxLQUFLOEksT0FBTCxDQUFhakUsR0FBYixDQUFpQjdFLEVBQWpCLEtBQXdCLEVBQS9CO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7ICQkYXN5bmNJdGVyYXRvciB9IGZyb20gJ2l0ZXJhbGwnO1xuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbnR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUXVlcnkgPSB7XG4gICAgcXVlcnk6IHN0cmluZyxcbiAgICBiaW5kVmFyczogeyBbc3RyaW5nXTogYW55IH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cmFwPFI+KGxvZzogUUxvZywgb3A6IHN0cmluZywgYXJnczogYW55LCBmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgIH07XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmNsYXNzIFJlZ2lzdHJ5TWFwPFQ+IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXRlbXM6IE1hcDxudW1iZXIsIFQ+O1xuICAgIGxhc3RJZDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubGFzdElkID0gMDtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGQoaXRlbTogVCk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLml0ZW1zLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IGlkO1xuICAgICAgICB0aGlzLml0ZW1zLnNldChpZCwgaXRlbSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmUoaWQ6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSAke3RoaXMubmFtZX06IGl0ZW0gd2l0aCBpZCBbJHtpZH1dIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBbbnVtYmVyLCBUXVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLmVudHJpZXMoKV07XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IFRbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy52YWx1ZXMoKV07XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5mdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgICAgICBzZWxlY3RlZC5pZCA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IG9uRmllbGQgPSB7XG4gICAgICAgICAgICBpbl9tZXNzYWdlOiAnaW5fbXNnJyxcbiAgICAgICAgICAgIG91dF9tZXNzYWdlczogJ291dF9tc2cnLFxuICAgICAgICAgICAgc2lnbmF0dXJlczogJ2lkJyxcbiAgICAgICAgfVtpdGVtLm5hbWVdO1xuICAgICAgICBpZiAob25GaWVsZCAhPT0gdW5kZWZpbmVkICYmIGRvY1tvbkZpZWxkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtvbkZpZWxkXSA9IGRvY1tvbkZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjtcbiAgICBpZDogP251bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCAmJiBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5saXN0ZW5lcnMucmVtb3ZlKGlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBmaWx0ZXIsIHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZSA9IG9uSW5zZXJ0T3JVcGRhdGU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgIH1cbn1cblxuXG4vLyRGbG93Rml4TWVcbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb25MaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciBpbXBsZW1lbnRzIEFzeW5jSXRlcmF0b3I8YW55PiB7XG4gICAgZXZlbnRDb3VudDogbnVtYmVyO1xuICAgIHB1bGxRdWV1ZTogKCh2YWx1ZTogYW55KSA9PiB2b2lkKVtdO1xuICAgIHB1c2hRdWV1ZTogYW55W107XG4gICAgcnVubmluZzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbiwgZmlsdGVyLCBzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNRdWV1ZU92ZXJmbG93KCkgJiYgdGhpcy5jb2xsZWN0aW9uLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHRoaXMuZmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRDb3VudDtcbiAgICB9XG5cbiAgICBnZXRRdWV1ZVNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFF1ZXVlLmxlbmd0aCArIHRoaXMucHVsbFF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdXNoVmFsdWUodmFsdWU6IGFueSkge1xuICAgICAgICBjb25zdCBxdWV1ZVNpemUgPSB0aGlzLmdldFF1ZXVlU2l6ZSgpO1xuICAgICAgICBpZiAocXVldWVTaXplID4gdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSA9IHF1ZXVlU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgaWYgKHRoaXMucHVsbFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuc2hpZnQoKSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICA/IHsgdmFsdWUsIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgbmV4dCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnB1c2hRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgICAgICA/IHsgdmFsdWU6IHRoaXMucHVzaFF1ZXVlLnNoaWZ0KCksIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5wdXNoKHJlc29sdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXR1cm4oKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGFzeW5jIHRocm93KGVycm9yPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyRGbG93Rml4TWVcbiAgICBbJCRhc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYXN5bmMgZW1wdHlRdWV1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5mb3JFYWNoKHJlc29sdmUgPT4gcmVzb2x2ZSh7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSkpO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGVzdGltYXRlZENvc3Q6IG51bWJlcixcbiAgICBzbG93OiBib29sZWFuLFxuICAgIHRpbWVzOiBudW1iZXJbXSxcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gY2hhbmdlTG9nO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcblxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+KGAke25hbWV9IGxpc3RlbmVyc2ApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGxpc3RlbmVyLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vVE9ETzogY29uc3Qgc3BhbiA9IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICAvLyAgICAgX2NvbnRleHQsXG4gICAgICAgICAgICAgICAgLy8gICAgICdhcmFuZ28tY29sbGVjdGlvbi5qczpzdWJzY3JpcHRpb25SZXNvbHZlcicsXG4gICAgICAgICAgICAgICAgLy8gICAgICduZXcgc3Vic2NyaXB0aW9uJyxcbiAgICAgICAgICAgICAgICAvLyAgICAgYXJncyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IFN1YnNjcmlwdGlvbkxpc3RlbmVyKFxuICAgICAgICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgLy9UT0RPOiBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgYXN5bmMgZW5zdXJlUXVlcnlTdGF0KHE6IFF1ZXJ5KTogUHJvbWlzZTxRdWVyeVN0YXQ+IHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHEucXVlcnkpO1xuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBsYW4gPSAoYXdhaXQgdGhpcy5kYi5leHBsYWluKHEpKS5wbGFuO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgZXN0aW1hdGVkQ29zdDogcGxhbi5lc3RpbWF0ZWRDb3N0LFxuICAgICAgICAgICAgc2xvdzogZmFsc2UsXG4gICAgICAgICAgICB0aW1lczogW10sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChwbGFuLm5vZGVzLmZpbmQobm9kZSA9PiBub2RlLnR5cGUgPT09ICdFbnVtZXJhdGVDb2xsZWN0aW9uTm9kZScpKSB7XG4gICAgICAgICAgICBzdGF0LnNsb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQocS5xdWVyeSwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNwYW4gPSBhd2FpdCB0aGlzLnRyYWNlci5zdGFydFNwYW5Mb2coXG4gICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAnYXJhbmdvLWNvbGxlY3Rpb24uanM6cXVlcnlSZXNvbHZlcicsXG4gICAgICAgICAgICAgICAgJ25ldyBxdWVyeScsXG4gICAgICAgICAgICAgICAgYXJncyk7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IHRoaXMuZW5zdXJlUXVlcnlTdGF0KHEpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBzdGF0LCBmaWx0ZXIsIHNlbGVjdGlvbiwgdGltZW91dCwgc3BhbilcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQsIHNwYW4pO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCwgc3RhdC5zbG93ID8gJ1NMT1cnIDogJ0ZBU1QnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCByb290U3BhbjogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3Bhbihyb290U3BhbiwgJ2FyYW5nby1jb2xsZWN0aW9ucy5qczpxdWVyeScpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGIgPSBzdGF0LnNsb3cgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeShxKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIHN0YXQudGltZXMucHVzaChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICAgICAgaWYgKHN0YXQudGltZXMubGVuZ3RoID4gMTAwMCkge1xuICAgICAgICAgICAgICAgIHN0YXQudGltZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCwgZmlsdGVyOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSwgdGltZW91dDogbnVtYmVyLCByb290U3BhbjogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3Bhbihyb290U3BhbiwgJ2FyYW5nby1jb2xsZWN0aW9uLmpzOnF1ZXJ5V2FpdEZvcicpO1xuICAgICAgICBsZXQgd2FpdEZvcjogP1dhaXRGb3JMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeShxLCBzdGF0LCBzcGFuKS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbmV3IFdhaXRGb3JMaXN0ZW5lcih0aGlzLCBmaWx0ZXIsIHNlbGVjdGlvbiwgKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShbXSksIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdlblF1ZXJ5KGZpbHRlcjogYW55LCBvcmRlckJ5OiBPcmRlckJ5W10sIGxpbWl0OiBudW1iZXIpOiA/UXVlcnkge1xuICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgUVBhcmFtcygpO1xuICAgICAgICBjb25zdCBmaWx0ZXJTZWN0aW9uID0gT2JqZWN0LmtleXMoZmlsdGVyKS5sZW5ndGggPiAwXG4gICAgICAgICAgICA/IGBGSUxURVIgJHt0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKX1gXG4gICAgICAgICAgICA6ICcnO1xuICAgICAgICBpZiAoZmlsdGVyU2VjdGlvbiA9PT0gJ0ZJTFRFUiBmYWxzZScpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9yZGVyQnlRbCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlRbCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlRbH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0UWwgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFFsfWA7XG5cbiAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY0J5S2V5KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdGRVRDSF9ET0NfQllfS0VZJywga2V5LCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYkNvbGxlY3Rpb24oKS5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoa2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoa2V5KSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENoYW5nZUxvZyB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICByZWNvcmRzOiBNYXA8c3RyaW5nLCBudW1iZXJbXT47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVjb3JkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgbG9nKGlkOiBzdHJpbmcsIHRpbWU6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yZWNvcmRzLmdldChpZCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3RpbmcucHVzaCh0aW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQoaWQsIFt0aW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQoaWQ6IHN0cmluZyk6IG51bWJlcltdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjb3Jkcy5nZXQoaWQpIHx8IFtdO1xuICAgIH1cbn1cbiJdfQ==