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
          return new SubscriptionListener(_this4, args.filter || {}, parseSelectionSet(info.operation.selectionSet, _this4.name));
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
                      var filter, selection, orderBy, limit, timeout, q, stat, span, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              filter = args.filter || {};
                              selection = parseSelectionSet(info.operation.selectionSet, _this5.name);
                              orderBy = args.orderBy || [];
                              limit = args.limit || 50;
                              timeout = Number(args.timeout) || 0;
                              q = _this5.genQuery(filter, orderBy, limit);

                              if (q) {
                                _context7.next = 9;
                                break;
                              }

                              _this5.log.debug('QUERY', args, 0, 'SKIPPED');

                              return _context7.abrupt("return", []);

                            case 9:
                              _context7.next = 11;
                              return _this5.ensureQueryStat(q);

                            case 11:
                              stat = _context7.sent;
                              _context7.next = 14;
                              return _this5.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 14:
                              span = _context7.sent;
                              _context7.prev = 15;
                              start = Date.now();

                              if (!(timeout > 0)) {
                                _context7.next = 23;
                                break;
                              }

                              _context7.next = 20;
                              return _this5.queryWaitFor(q, stat, filter, selection, timeout);

                            case 20:
                              _context7.t0 = _context7.sent;
                              _context7.next = 26;
                              break;

                            case 23:
                              _context7.next = 25;
                              return _this5.query(q, stat);

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
      _regenerator["default"].mark(function _callee8(q, stat) {
        var db, start, cursor, result;
        return _regenerator["default"].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                db = stat.slow ? this.slowDb : this.db;
                start = Date.now();
                _context9.next = 4;
                return db.query(q);

              case 4:
                cursor = _context9.sent;
                _context9.next = 7;
                return cursor.all();

              case 7:
                result = _context9.sent;
                stat.times.push(Date.now() - start);

                if (stat.times.length > 1000) {
                  stat.times.shift();
                }

                return _context9.abrupt("return", result);

              case 11:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee8, this);
      }));

      function query(_x11, _x12) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee9(q, stat, filter, selection, timeout) {
        var _this6 = this;

        var waitFor, forceTimerId, onQuery, onChangesFeed, onTimeout;
        return _regenerator["default"].wrap(function _callee9$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                waitFor = null;
                forceTimerId = null;
                _context10.prev = 2;
                onQuery = new Promise(function (resolve, reject) {
                  var check = function check() {
                    _this6.query(q, stat).then(function (docs) {
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
                _context10.next = 8;
                return Promise.race([onQuery, onChangesFeed, onTimeout]);

              case 8:
                return _context10.abrupt("return", _context10.sent);

              case 9:
                _context10.prev = 9;

                if (waitFor !== null && waitFor !== undefined) {
                  waitFor.close();
                }

                if (forceTimerId !== null) {
                  clearTimeout(forceTimerId);
                  forceTimerId = null;
                }

                return _context10.finish(9);

              case 13:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee9, null, [[2,, 9, 13]]);
      }));

      function queryWaitFor(_x13, _x14, _x15, _x16, _x17) {
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

      function fetchDocByKey(_x18) {
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

      function fetchDocsByKeys(_x19) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJmaWx0ZXIiLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJzbG93RGIiLCJjcmVhdGUiLCJxdWVyeVN0YXRzIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwib3BlcmF0aW9uIiwicSIsImV4aXN0aW5nIiwiZ2V0IiwicXVlcnkiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0Iiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsImdlblF1ZXJ5IiwiZGVidWciLCJlbnN1cmVRdWVyeVN0YXQiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwic3RhcnQiLCJxdWVyeVdhaXRGb3IiLCJyZXN1bHQiLCJmaW5pc2giLCJjdXJzb3IiLCJhbGwiLCJ3YWl0Rm9yIiwiZm9yY2VUaW1lcklkIiwib25RdWVyeSIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnlRbCIsIm1hcCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJqb2luIiwic29ydFNlY3Rpb24iLCJsaW1pdFFsIiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImJpbmRWYXJzIiwia2V5IiwiZGJDb2xsZWN0aW9uIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5IiwiQ2hhbmdlTG9nIiwiZW5hYmxlZCIsInJlY29yZHMiLCJjbGVhciIsInRpbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQW9Dc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxjQUFJQSxPQUFKLElBQWUsY0FBSUMsV0FBbkIsSUFBa0MsY0FBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJQUFJLEVBQUUsY0FBSUE7QUFGQSxhQUpmO0FBUUNSLFlBQUFBLEdBQUcsQ0FBQ0ksS0FBSixDQUFVLFFBQVYsRUFBb0JILEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkUsS0FBSyxDQUFDQyxPQUFwQztBQVJELGtCQVNPRCxLQVRQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFhREssVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDSDs7Ozt3QkFFR0MsSSxFQUFpQjtBQUNqQixVQUFJQyxFQUFFLEdBQUcsS0FBS0osTUFBZDs7QUFDQSxTQUFHO0FBQ0NJLFFBQUFBLEVBQUUsR0FBR0EsRUFBRSxHQUFHQyxNQUFNLENBQUNDLGdCQUFaLEdBQStCRixFQUFFLEdBQUcsQ0FBcEMsR0FBd0MsQ0FBN0M7QUFDSCxPQUZELFFBRVMsS0FBS0gsS0FBTCxDQUFXTSxHQUFYLENBQWVILEVBQWYsQ0FGVDs7QUFHQSxXQUFLSixNQUFMLEdBQWNJLEVBQWQ7QUFDQSxXQUFLSCxLQUFMLENBQVdPLEdBQVgsQ0FBZUosRUFBZixFQUFtQkQsSUFBbkI7QUFDQSxhQUFPQyxFQUFQO0FBQ0g7OzsyQkFFTUEsRSxFQUFZO0FBQ2YsVUFBSSxDQUFDLEtBQUtILEtBQUwsV0FBa0JHLEVBQWxCLENBQUwsRUFBNEI7QUFDeEJLLFFBQUFBLE9BQU8sQ0FBQ2hCLEtBQVIsNEJBQWtDLEtBQUtNLElBQXZDLDZCQUE4REssRUFBOUQ7QUFDSDtBQUNKOzs7OEJBRXdCO0FBQ3JCLGlEQUFXLEtBQUtILEtBQUwsQ0FBV1MsT0FBWCxFQUFYO0FBQ0g7Ozs2QkFFYTtBQUNWLGlEQUFXLEtBQUtULEtBQUwsQ0FBV1UsTUFBWCxFQUFYO0FBQ0g7Ozs7O0FBUUwsU0FBU0MsaUJBQVQsQ0FBMkJDLFlBQTNCLEVBQThDQyxvQkFBOUMsRUFBOEY7QUFDMUYsTUFBTUMsTUFBd0IsR0FBRyxFQUFqQztBQUNBLE1BQU1DLFVBQVUsR0FBR0gsWUFBWSxJQUFJQSxZQUFZLENBQUNHLFVBQWhEOztBQUNBLE1BQUlBLFVBQUosRUFBZ0I7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDWiwyQkFBbUJBLFVBQW5CLDhIQUErQjtBQUFBLFlBQXBCYixLQUFvQjs7QUFDM0IsWUFBTUosS0FBSSxHQUFJSSxLQUFJLENBQUNKLElBQUwsSUFBYUksS0FBSSxDQUFDSixJQUFMLENBQVVrQixLQUF4QixJQUFrQyxFQUEvQzs7QUFDQSxZQUFJbEIsS0FBSixFQUFVO0FBQ04sY0FBTW1CLEtBQXFCLEdBQUc7QUFDMUJuQixZQUFBQSxJQUFJLEVBQUpBLEtBRDBCO0FBRTFCb0IsWUFBQUEsU0FBUyxFQUFFUCxpQkFBaUIsQ0FBQ1QsS0FBSSxDQUFDVSxZQUFOLEVBQW9CLEVBQXBCO0FBRkYsV0FBOUI7O0FBSUEsY0FBSUMsb0JBQW9CLEtBQUssRUFBekIsSUFBK0JJLEtBQUssQ0FBQ25CLElBQU4sS0FBZWUsb0JBQWxELEVBQXdFO0FBQ3BFLG1CQUFPSSxLQUFLLENBQUNDLFNBQWI7QUFDSDs7QUFDREosVUFBQUEsTUFBTSxDQUFDSyxJQUFQLENBQVlGLEtBQVo7QUFDSDtBQUNKO0FBYlc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWNmOztBQUNELFNBQU9ILE1BQVA7QUFDSDs7QUFFRCxTQUFTTSxZQUFULENBQXNCQyxHQUF0QixFQUFnQ0gsU0FBaEMsRUFBa0U7QUFDOUQsTUFBTUksUUFBYSxHQUFHLEVBQXRCOztBQUNBLE1BQUlELEdBQUcsQ0FBQ0UsSUFBUixFQUFjO0FBQ1ZELElBQUFBLFFBQVEsQ0FBQ0MsSUFBVCxHQUFnQkYsR0FBRyxDQUFDRSxJQUFwQjtBQUNIOztBQUo2RDtBQUFBO0FBQUE7O0FBQUE7QUFLOUQsMEJBQW1CTCxTQUFuQixtSUFBOEI7QUFBQSxVQUFuQmhCLE1BQW1CO0FBQzFCLFVBQU1jLE9BQUssR0FBR0ssR0FBRyxDQUFDbkIsTUFBSSxDQUFDSixJQUFOLENBQWpCOztBQUNBLFVBQUlrQixPQUFLLEtBQUtRLFNBQWQsRUFBeUI7QUFDckJGLFFBQUFBLFFBQVEsQ0FBQ3BCLE1BQUksQ0FBQ0osSUFBTixDQUFSLEdBQXNCSSxNQUFJLENBQUNnQixTQUFMLENBQWVPLE1BQWYsR0FBd0IsQ0FBeEIsR0FBNEJMLFlBQVksQ0FBQ0osT0FBRCxFQUFRZCxNQUFJLENBQUNnQixTQUFiLENBQXhDLEdBQWtFRixPQUF4RjtBQUNIO0FBQ0o7QUFWNkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFXOUQsU0FBT00sUUFBUDtBQUNIOztJQUVZSSxrQjs7O0FBT1QsOEJBQVlDLFVBQVosRUFBb0NDLE1BQXBDLEVBQWlEVixTQUFqRCxFQUE4RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMxRSxTQUFLUyxVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtWLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS2YsRUFBTCxHQUFVd0IsVUFBVSxDQUFDRSxTQUFYLENBQXFCQyxHQUFyQixDQUF5QixJQUF6QixDQUFWO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQkMsSUFBSSxDQUFDQyxHQUFMLEVBQWpCO0FBQ0g7Ozs7NEJBRU87QUFDSixVQUFNOUIsRUFBRSxHQUFHLEtBQUtBLEVBQWhCOztBQUNBLFVBQUlBLEVBQUUsS0FBSyxJQUFQLElBQWVBLEVBQUUsS0FBS3FCLFNBQTFCLEVBQXFDO0FBQ2pDLGFBQUtyQixFQUFMLEdBQVUsSUFBVjtBQUNBLGFBQUt3QixVQUFMLENBQWdCRSxTQUFoQixDQUEwQkssTUFBMUIsQ0FBaUMvQixFQUFqQztBQUNIO0FBQ0o7Ozs2Q0FFd0JrQixHLEVBQVUsQ0FDbEM7OztvQ0FFdUI7QUFDcEIsYUFBTyxDQUFQO0FBQ0g7Ozs7Ozs7SUFJUWMsZTs7Ozs7QUFHVCwyQkFBWVIsVUFBWixFQUFvQ0MsTUFBcEMsRUFBaURWLFNBQWpELEVBQThFa0IsZ0JBQTlFLEVBQW9IO0FBQUE7O0FBQUE7QUFDaEgsMkhBQU1ULFVBQU4sRUFBa0JDLE1BQWxCLEVBQTBCVixTQUExQjtBQURnSDtBQUVoSCxVQUFLa0IsZ0JBQUwsR0FBd0JBLGdCQUF4QjtBQUZnSDtBQUduSDs7Ozs2Q0FFd0JmLEcsRUFBVTtBQUMvQixXQUFLZSxnQkFBTCxDQUFzQmYsR0FBdEI7QUFDSDs7O0VBVmdDSyxrQixHQWNyQzs7Ozs7SUFDYVcsb0I7Ozs7O0FBTVQsZ0NBQVlWLFVBQVosRUFBb0NDLE1BQXBDLEVBQWlEVixTQUFqRCxFQUE4RTtBQUFBOztBQUFBO0FBQzFFLGlJQUFNUyxVQUFOLEVBQWtCQyxNQUFsQixFQUEwQlYsU0FBMUI7QUFEMEU7QUFBQTtBQUFBO0FBQUE7QUFFMUUsV0FBS29CLFVBQUwsR0FBa0IsQ0FBbEI7QUFDQSxXQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsV0FBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFdBQUtDLE9BQUwsR0FBZSxJQUFmO0FBTDBFO0FBTTdFOzs7OzZDQUV3QnBCLEcsRUFBVTtBQUMvQixVQUFJLENBQUMsS0FBS3FCLGVBQUwsRUFBRCxJQUEyQixLQUFLZixVQUFMLENBQWdCZ0IsT0FBaEIsQ0FBd0JDLElBQXhCLENBQTZCLElBQTdCLEVBQW1DdkIsR0FBbkMsRUFBd0MsS0FBS08sTUFBN0MsQ0FBL0IsRUFBcUY7QUFDakYsYUFBS2lCLFNBQUwsc0NBQWtCLEtBQUtsQixVQUFMLENBQWdCN0IsSUFBbEMsRUFBeUNzQixZQUFZLENBQUNDLEdBQUQsRUFBTSxLQUFLSCxTQUFYLENBQXJEO0FBQ0g7QUFDSjs7O3NDQUUwQjtBQUN2QixhQUFPLEtBQUs0QixZQUFMLE1BQXVCLEVBQTlCO0FBQ0g7OztvQ0FFdUI7QUFDcEIsYUFBTyxLQUFLUixVQUFaO0FBQ0g7OzttQ0FFc0I7QUFDbkIsYUFBTyxLQUFLRSxTQUFMLENBQWVmLE1BQWYsR0FBd0IsS0FBS2MsU0FBTCxDQUFlZCxNQUE5QztBQUNIOzs7OEJBRVNULEssRUFBWTtBQUNsQixVQUFNK0IsU0FBUyxHQUFHLEtBQUtELFlBQUwsRUFBbEI7O0FBQ0EsVUFBSUMsU0FBUyxHQUFHLEtBQUtwQixVQUFMLENBQWdCcUIsWUFBaEMsRUFBOEM7QUFDMUMsYUFBS3JCLFVBQUwsQ0FBZ0JxQixZQUFoQixHQUErQkQsU0FBL0I7QUFDSDs7QUFDRCxXQUFLVCxVQUFMLElBQW1CLENBQW5COztBQUNBLFVBQUksS0FBS0MsU0FBTCxDQUFlZCxNQUFmLEtBQTBCLENBQTlCLEVBQWlDO0FBQzdCLGFBQUtjLFNBQUwsQ0FBZVUsS0FBZixHQUF1QixLQUFLUixPQUFMLEdBQ2pCO0FBQUV6QixVQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU2tDLFVBQUFBLElBQUksRUFBRTtBQUFmLFNBRGlCLEdBRWpCO0FBQUVsQyxVQUFBQSxLQUFLLEVBQUVRLFNBQVQ7QUFBb0IwQixVQUFBQSxJQUFJLEVBQUU7QUFBMUIsU0FGTjtBQUlILE9BTEQsTUFLTztBQUNILGFBQUtWLFNBQUwsQ0FBZXJCLElBQWYsQ0FBb0JILEtBQXBCO0FBQ0g7QUFDSjs7Ozs7Ozs7Ozs7OztrREFHVSxJQUFJbUMsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtBQUM1QixzQkFBSSxNQUFJLENBQUNaLFNBQUwsQ0FBZWYsTUFBZixLQUEwQixDQUE5QixFQUFpQztBQUM3QjJCLG9CQUFBQSxPQUFPLENBQUMsTUFBSSxDQUFDWCxPQUFMLEdBQ0Y7QUFBRXpCLHNCQUFBQSxLQUFLLEVBQUUsTUFBSSxDQUFDd0IsU0FBTCxDQUFlUyxLQUFmLEVBQVQ7QUFBaUNDLHNCQUFBQSxJQUFJLEVBQUU7QUFBdkMscUJBREUsR0FFRjtBQUFFbEMsc0JBQUFBLEtBQUssRUFBRVEsU0FBVDtBQUFvQjBCLHNCQUFBQSxJQUFJLEVBQUU7QUFBMUIscUJBRkMsQ0FBUDtBQUlILG1CQUxELE1BS087QUFDSCxvQkFBQSxNQUFJLENBQUNYLFNBQUwsQ0FBZXBCLElBQWYsQ0FBb0JpQyxPQUFwQjtBQUNIO0FBQ0osaUJBVE0sQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhUCxxQkFBS0MsS0FBTDs7dUJBQ00sS0FBS0MsVUFBTCxFOzs7a0RBQ0M7QUFBRXRDLGtCQUFBQSxLQUFLLEVBQUVRLFNBQVQ7QUFBb0IwQixrQkFBQUEsSUFBSSxFQUFFO0FBQTFCLGlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cURBR0MxRCxLOzs7OztBQUNSLHFCQUFLNkQsS0FBTDs7dUJBQ00sS0FBS0MsVUFBTCxFOzs7a0RBQ0NILE9BQU8sQ0FBQ0ksTUFBUixDQUFlL0QsS0FBZixDOzs7Ozs7Ozs7Ozs7Ozs7UUFHWDs7O1NBQ0NnRSx3Qjs0QkFBbUI7QUFDaEIsYUFBTyxJQUFQO0FBQ0g7Ozs7Ozs7Ozs7O0FBR0csb0JBQUksS0FBS2YsT0FBVCxFQUFrQjtBQUNkLHVCQUFLQSxPQUFMLEdBQWUsS0FBZjtBQUNBLHVCQUFLRixTQUFMLENBQWVrQixPQUFmLENBQXVCLFVBQUFMLE9BQU87QUFBQSwyQkFBSUEsT0FBTyxDQUFDO0FBQUVwQyxzQkFBQUEsS0FBSyxFQUFFUSxTQUFUO0FBQW9CMEIsc0JBQUFBLElBQUksRUFBRTtBQUExQixxQkFBRCxDQUFYO0FBQUEsbUJBQTlCO0FBQ0EsdUJBQUtYLFNBQUwsR0FBaUIsRUFBakI7QUFDQSx1QkFBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFwRmlDZCxrQjs7OztJQStGN0JnQyxVOzs7QUFlVCxzQkFDSTVELElBREosRUFFSTZDLE9BRkosRUFHSWdCLElBSEosRUFJSUMsU0FKSixFQUtJQyxNQUxKLEVBTUlDLEVBTkosRUFPSUMsTUFQSixFQVFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNFLFNBQUtqRSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLNkMsT0FBTCxHQUFlQSxPQUFmO0FBRUEsU0FBS3ZELEdBQUwsR0FBV3VFLElBQUksQ0FBQ0ssTUFBTCxDQUFZbEUsSUFBWixDQUFYO0FBQ0EsU0FBSzhELFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0EsU0FBS0MsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBRUEsU0FBS2xDLFNBQUwsR0FBaUIsSUFBSWhDLFdBQUosV0FBdUNDLElBQXZDLGdCQUFqQjtBQUNBLFNBQUttRSxVQUFMLEdBQWtCLElBQUloRSxHQUFKLEVBQWxCO0FBQ0EsU0FBSytDLFlBQUwsR0FBb0IsQ0FBcEI7QUFDSCxHLENBRUQ7Ozs7OzZDQUV5QjNCLEcsRUFBVTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUMvQiw4QkFBdUIsS0FBS1EsU0FBTCxDQUFlbkIsTUFBZixFQUF2QixtSUFBZ0Q7QUFBQSxjQUFyQ3dELFNBQXFDOztBQUM1QyxjQUFJLEtBQUt2QixPQUFMLENBQWFDLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0J2QixHQUF4QixFQUE2QjZDLFNBQVEsQ0FBQ3RDLE1BQXRDLENBQUosRUFBbUQ7QUFDL0NzQyxZQUFBQSxTQUFRLENBQUNDLHdCQUFULENBQWtDOUMsR0FBbEM7QUFDSDtBQUNKO0FBTDhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNbEM7OzsyQ0FFc0I7QUFBQTs7QUFDbkIsYUFBTztBQUNIK0MsUUFBQUEsU0FBUyxFQUFFLG1CQUFDQyxDQUFELEVBQVMvRSxJQUFULEVBQWdDZ0YsUUFBaEMsRUFBK0NDLElBQS9DLEVBQTZEO0FBQ3BFLGlCQUFPLElBQUlsQyxvQkFBSixDQUNILE1BREcsRUFFSC9DLElBQUksQ0FBQ3NDLE1BQUwsSUFBZSxFQUZaLEVBR0hqQixpQkFBaUIsQ0FBQzRELElBQUksQ0FBQ0MsU0FBTCxDQUFlNUQsWUFBaEIsRUFBOEIsTUFBSSxDQUFDZCxJQUFuQyxDQUhkLENBQVA7QUFLSDtBQVBFLE9BQVA7QUFTSCxLLENBRUQ7Ozs7Ozs7cURBRXNCMkUsQzs7Ozs7O0FBQ1pDLGdCQUFBQSxRLEdBQVcsS0FBS1QsVUFBTCxDQUFnQlUsR0FBaEIsQ0FBb0JGLENBQUMsQ0FBQ0csS0FBdEIsQzs7c0JBQ2JGLFFBQVEsS0FBS2xELFM7Ozs7O2tEQUNOa0QsUTs7Ozt1QkFFUyxLQUFLWixFQUFMLENBQVFlLE9BQVIsQ0FBZ0JKLENBQWhCLEM7OztBQUFkSyxnQkFBQUEsSSxrQkFBa0NBLEk7QUFDbENDLGdCQUFBQSxJLEdBQU87QUFDVEMsa0JBQUFBLGFBQWEsRUFBRUYsSUFBSSxDQUFDRSxhQURYO0FBRVRDLGtCQUFBQSxJQUFJLEVBQUUsS0FGRztBQUdUQyxrQkFBQUEsS0FBSyxFQUFFO0FBSEUsaUI7O0FBS2Isb0JBQUlKLElBQUksQ0FBQ0ssS0FBTCxDQUFXQyxJQUFYLENBQWdCLFVBQUFDLElBQUk7QUFBQSx5QkFBSUEsSUFBSSxDQUFDQyxJQUFMLEtBQWMseUJBQWxCO0FBQUEsaUJBQXBCLENBQUosRUFBc0U7QUFDbEVQLGtCQUFBQSxJQUFJLENBQUNFLElBQUwsR0FBWSxJQUFaO0FBQ0g7O0FBQ0QscUJBQUtoQixVQUFMLENBQWdCMUQsR0FBaEIsQ0FBb0JrRSxDQUFDLENBQUNHLEtBQXRCLEVBQTZCRyxJQUE3QjtrREFDT0EsSTs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQUdLO0FBQUE7O0FBQ1o7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVDQUFPLGtCQUFPUSxNQUFQLEVBQW9CakcsSUFBcEIsRUFBK0JrRyxPQUEvQixFQUE2Q2pCLElBQTdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzREFBMkRwRixJQUFJLENBQUMsTUFBSSxDQUFDQyxHQUFOLEVBQVcsT0FBWCxFQUFvQkUsSUFBcEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpREFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RGc0MsOEJBQUFBLE1BRHNGLEdBQzdFdEMsSUFBSSxDQUFDc0MsTUFBTCxJQUFlLEVBRDhEO0FBRXRGViw4QkFBQUEsU0FGc0YsR0FFMUVQLGlCQUFpQixDQUFDNEQsSUFBSSxDQUFDQyxTQUFMLENBQWU1RCxZQUFoQixFQUE4QixNQUFJLENBQUNkLElBQW5DLENBRnlEO0FBR3RGMkYsOEJBQUFBLE9BSHNGLEdBR2pFbkcsSUFBSSxDQUFDbUcsT0FBTCxJQUFnQixFQUhpRDtBQUl0RkMsOEJBQUFBLEtBSnNGLEdBSXRFcEcsSUFBSSxDQUFDb0csS0FBTCxJQUFjLEVBSndEO0FBS3RGQyw4QkFBQUEsT0FMc0YsR0FLNUV2RixNQUFNLENBQUNkLElBQUksQ0FBQ3FHLE9BQU4sQ0FBTixJQUF3QixDQUxvRDtBQU10RmxCLDhCQUFBQSxDQU5zRixHQU1sRixNQUFJLENBQUNtQixRQUFMLENBQWNoRSxNQUFkLEVBQXNCNkQsT0FBdEIsRUFBK0JDLEtBQS9CLENBTmtGOztBQUFBLGtDQU92RmpCLENBUHVGO0FBQUE7QUFBQTtBQUFBOztBQVF4Riw4QkFBQSxNQUFJLENBQUNyRixHQUFMLENBQVN5RyxLQUFULENBQWUsT0FBZixFQUF3QnZHLElBQXhCLEVBQThCLENBQTlCLEVBQWlDLFNBQWpDOztBQVJ3RixnRUFTakYsRUFUaUY7O0FBQUE7QUFBQTtBQUFBLHFDQVd6RSxNQUFJLENBQUN3RyxlQUFMLENBQXFCckIsQ0FBckIsQ0FYeUU7O0FBQUE7QUFXdEZNLDhCQUFBQSxJQVhzRjtBQUFBO0FBQUEscUNBWXpFLE1BQUksQ0FBQ2xCLE1BQUwsQ0FBWWtDLFlBQVosQ0FBeUJQLE9BQXpCLEVBQWtDLHFCQUFsQyxFQUF5RCxXQUF6RCxFQUFzRWxHLElBQXRFLENBWnlFOztBQUFBO0FBWXRGMEcsOEJBQUFBLElBWnNGO0FBQUE7QUFjbEZDLDhCQUFBQSxLQWRrRixHQWMxRWpFLElBQUksQ0FBQ0MsR0FBTCxFQWQwRTs7QUFBQSxvQ0FlekUwRCxPQUFPLEdBQUcsQ0FmK0Q7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQSxxQ0FnQjVFLE1BQUksQ0FBQ08sWUFBTCxDQUFrQnpCLENBQWxCLEVBQXFCTSxJQUFyQixFQUEyQm5ELE1BQTNCLEVBQW1DVixTQUFuQyxFQUE4Q3lFLE9BQTlDLENBaEI0RTs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUEscUNBaUI1RSxNQUFJLENBQUNmLEtBQUwsQ0FBV0gsQ0FBWCxFQUFjTSxJQUFkLENBakI0RTs7QUFBQTtBQUFBOztBQUFBO0FBZWxGb0IsOEJBQUFBLE1BZmtGOztBQWtCeEYsOEJBQUEsTUFBSSxDQUFDL0csR0FBTCxDQUFTeUcsS0FBVCxDQUFlLE9BQWYsRUFBd0J2RyxJQUF4QixFQUE4QixDQUFDMEMsSUFBSSxDQUFDQyxHQUFMLEtBQWFnRSxLQUFkLElBQXVCLElBQXJELEVBQTJEbEIsSUFBSSxDQUFDRSxJQUFMLEdBQVksTUFBWixHQUFxQixNQUFoRjs7QUFsQndGLGdFQW1CakZrQixNQW5CaUY7O0FBQUE7QUFBQTtBQUFBO0FBQUEscUNBcUJsRkgsSUFBSSxDQUFDSSxNQUFMLEVBckJrRjs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUExQixHQUEvRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUFQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUF3Qkg7Ozs7OztxREFFVzNCLEMsRUFBVU0sSTs7Ozs7O0FBQ1pqQixnQkFBQUEsRSxHQUFLaUIsSUFBSSxDQUFDRSxJQUFMLEdBQVksS0FBS2xCLE1BQWpCLEdBQTBCLEtBQUtELEU7QUFDcENtQyxnQkFBQUEsSyxHQUFRakUsSUFBSSxDQUFDQyxHQUFMLEU7O3VCQUNPNkIsRUFBRSxDQUFDYyxLQUFILENBQVNILENBQVQsQzs7O0FBQWY0QixnQkFBQUEsTTs7dUJBQ2VBLE1BQU0sQ0FBQ0MsR0FBUCxFOzs7QUFBZkgsZ0JBQUFBLE07QUFDTnBCLGdCQUFBQSxJQUFJLENBQUNHLEtBQUwsQ0FBVy9ELElBQVgsQ0FBZ0JhLElBQUksQ0FBQ0MsR0FBTCxLQUFhZ0UsS0FBN0I7O0FBQ0Esb0JBQUlsQixJQUFJLENBQUNHLEtBQUwsQ0FBV3pELE1BQVgsR0FBb0IsSUFBeEIsRUFBOEI7QUFDMUJzRCxrQkFBQUEsSUFBSSxDQUFDRyxLQUFMLENBQVdqQyxLQUFYO0FBQ0g7O2tEQUNNa0QsTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FEQUlRMUIsQyxFQUFVTSxJLEVBQWlCbkQsTSxFQUFhVixTLEVBQTZCeUUsTzs7Ozs7Ozs7QUFDaEZZLGdCQUFBQSxPLEdBQTRCLEk7QUFDNUJDLGdCQUFBQSxZLEdBQTJCLEk7O0FBRXJCQyxnQkFBQUEsTyxHQUFVLElBQUl0RCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVRyxNQUFWLEVBQXFCO0FBQzdDLHNCQUFNbUQsS0FBSyxHQUFHLFNBQVJBLEtBQVEsR0FBTTtBQUNoQixvQkFBQSxNQUFJLENBQUM5QixLQUFMLENBQVdILENBQVgsRUFBY00sSUFBZCxFQUFvQjRCLElBQXBCLENBQXlCLFVBQUNDLElBQUQsRUFBVTtBQUMvQiwwQkFBSUEsSUFBSSxDQUFDbkYsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCK0Usd0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0FwRCx3QkFBQUEsT0FBTyxDQUFDd0QsSUFBRCxDQUFQO0FBQ0gsdUJBSEQsTUFHTztBQUNISix3QkFBQUEsWUFBWSxHQUFHSyxVQUFVLENBQUNILEtBQUQsRUFBUSxJQUFSLENBQXpCO0FBQ0g7QUFDSixxQkFQRCxFQU9HbkQsTUFQSDtBQVFILG1CQVREOztBQVVBbUQsa0JBQUFBLEtBQUs7QUFDUixpQkFaZSxDO0FBYVZJLGdCQUFBQSxhLEdBQWdCLElBQUkzRCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFhO0FBQzNDbUQsa0JBQUFBLE9BQU8sR0FBRyxJQUFJcEUsZUFBSixDQUFvQixNQUFwQixFQUEwQlAsTUFBMUIsRUFBa0NWLFNBQWxDLEVBQTZDLFVBQUNHLEdBQUQsRUFBUztBQUM1RCtCLG9CQUFBQSxPQUFPLENBQUMsQ0FBQy9CLEdBQUQsQ0FBRCxDQUFQO0FBQ0gsbUJBRlMsQ0FBVjtBQUdILGlCQUpxQixDO0FBS2hCMEYsZ0JBQUFBLFMsR0FBWSxJQUFJNUQsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtBQUN2Q3lELGtCQUFBQSxVQUFVLENBQUM7QUFBQSwyQkFBTXpELE9BQU8sQ0FBQyxFQUFELENBQWI7QUFBQSxtQkFBRCxFQUFvQnVDLE9BQXBCLENBQVY7QUFDSCxpQkFGaUIsQzs7dUJBR0x4QyxPQUFPLENBQUM2RCxJQUFSLENBQWEsQ0FDdEJQLE9BRHNCLEVBRXRCSyxhQUZzQixFQUd0QkMsU0FIc0IsQ0FBYixDOzs7Ozs7OztBQU1iLG9CQUFJUixPQUFPLEtBQUssSUFBWixJQUFvQkEsT0FBTyxLQUFLL0UsU0FBcEMsRUFBK0M7QUFDM0MrRSxrQkFBQUEsT0FBTyxDQUFDbEQsS0FBUjtBQUNIOztBQUNELG9CQUFJbUQsWUFBWSxLQUFLLElBQXJCLEVBQTJCO0FBQ3ZCUyxrQkFBQUEsWUFBWSxDQUFDVCxZQUFELENBQVo7QUFDQUEsa0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQU1BNUUsTSxFQUFhNkQsTyxFQUFvQkMsSyxFQUF1QjtBQUM3RCxVQUFNd0IsTUFBTSxHQUFHLElBQUlDLGVBQUosRUFBZjtBQUNBLFVBQU1DLGFBQWEsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVkxRixNQUFaLEVBQW9CSCxNQUFwQixHQUE2QixDQUE3QixvQkFDTixLQUFLa0IsT0FBTCxDQUFhNEUsRUFBYixDQUFnQkwsTUFBaEIsRUFBd0IsS0FBeEIsRUFBK0J0RixNQUEvQixDQURNLElBRWhCLEVBRk47O0FBR0EsVUFBSXdGLGFBQWEsS0FBSyxjQUF0QixFQUFzQztBQUNsQyxlQUFPLElBQVA7QUFDSDs7QUFDRCxVQUFNSSxTQUFTLEdBQUcvQixPQUFPLENBQ3BCZ0MsR0FEYSxDQUNULFVBQUN4RyxLQUFELEVBQVc7QUFDWixZQUFNeUcsU0FBUyxHQUFJekcsS0FBSyxDQUFDeUcsU0FBTixJQUFtQnpHLEtBQUssQ0FBQ3lHLFNBQU4sQ0FBZ0JDLFdBQWhCLE9BQWtDLE1BQXRELEdBQ1osT0FEWSxHQUVaLEVBRk47QUFHQSw2QkFBYzFHLEtBQUssQ0FBQzJHLElBQU4sQ0FBV0MsT0FBWCxDQUFtQixVQUFuQixFQUErQixNQUEvQixDQUFkLFNBQXVESCxTQUF2RDtBQUNILE9BTmEsRUFPYkksSUFQYSxDQU9SLElBUFEsQ0FBbEI7QUFTQSxVQUFNQyxXQUFXLEdBQUdQLFNBQVMsS0FBSyxFQUFkLGtCQUEyQkEsU0FBM0IsSUFBeUMsRUFBN0Q7QUFDQSxVQUFNUSxPQUFPLEdBQUdDLElBQUksQ0FBQ0MsR0FBTCxDQUFTeEMsS0FBVCxFQUFnQixFQUFoQixDQUFoQjtBQUNBLFVBQU15QyxZQUFZLG1CQUFZSCxPQUFaLENBQWxCO0FBRUEsVUFBTXBELEtBQUssc0NBQ00sS0FBSzlFLElBRFgsMkJBRUxzSCxhQUZLLDJCQUdMVyxXQUhLLDJCQUlMSSxZQUpLLDZCQUFYO0FBTUEsYUFBTztBQUNIdkQsUUFBQUEsS0FBSyxFQUFMQSxLQURHO0FBRUh3RCxRQUFBQSxRQUFRLEVBQUVsQixNQUFNLENBQUN4RztBQUZkLE9BQVA7QUFJSDs7O21DQUVrQztBQUMvQixhQUFPLEtBQUtvRCxFQUFMLENBQVFuQyxVQUFSLENBQW1CLEtBQUs3QixJQUF4QixDQUFQO0FBQ0g7Ozs7OztzREFFbUJ1SSxHOzs7Ozs7O29CQUNYQSxHOzs7OzttREFDTWxGLE9BQU8sQ0FBQ0MsT0FBUixDQUFnQixJQUFoQixDOzs7bURBRUpqRSxJQUFJLENBQUMsS0FBS0MsR0FBTixFQUFXLGtCQUFYLEVBQStCaUosR0FBL0I7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBb0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDZEQUNwQyxNQUFJLENBQUNDLFlBQUwsR0FBb0JDLFFBQXBCLENBQTZCRixHQUE3QixFQUFrQyxJQUFsQyxDQURvQzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBcEMsRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUtPZixJOzs7Ozs7O3NCQUNkLENBQUNBLElBQUQsSUFBU0EsSUFBSSxDQUFDN0YsTUFBTCxLQUFnQixDOzs7OzttREFDbEIwQixPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQzs7O21EQUVKRCxPQUFPLENBQUNtRCxHQUFSLENBQVlnQixJQUFJLENBQUNHLEdBQUwsQ0FBUyxVQUFBWSxHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDRyxhQUFMLENBQW1CSCxHQUFuQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUZJLFM7OztBQUlULHVCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBS0MsT0FBTCxHQUFlLEtBQWY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBSTFJLEdBQUosRUFBZjtBQUNIOzs7OzRCQUVPO0FBQ0osV0FBSzBJLE9BQUwsQ0FBYUMsS0FBYjtBQUNIOzs7d0JBRUd6SSxFLEVBQVkwSSxJLEVBQWM7QUFDMUIsVUFBSSxDQUFDLEtBQUtILE9BQVYsRUFBbUI7QUFDZjtBQUNIOztBQUNELFVBQU1oRSxRQUFRLEdBQUcsS0FBS2lFLE9BQUwsQ0FBYWhFLEdBQWIsQ0FBaUJ4RSxFQUFqQixDQUFqQjs7QUFDQSxVQUFJdUUsUUFBSixFQUFjO0FBQ1ZBLFFBQUFBLFFBQVEsQ0FBQ3ZELElBQVQsQ0FBYzBILElBQWQ7QUFDSCxPQUZELE1BRU87QUFDSCxhQUFLRixPQUFMLENBQWFwSSxHQUFiLENBQWlCSixFQUFqQixFQUFxQixDQUFDMEksSUFBRCxDQUFyQjtBQUNIO0FBQ0o7Ozt3QkFFRzFJLEUsRUFBc0I7QUFDdEIsYUFBTyxLQUFLd0ksT0FBTCxDQUFhaEUsR0FBYixDQUFpQnhFLEVBQWpCLEtBQXdCLEVBQS9CO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAxOSBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7ICQkYXN5bmNJdGVyYXRvciB9IGZyb20gJ2l0ZXJhbGwnO1xuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbnR5cGUgT3JkZXJCeSA9IHtcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgZGlyZWN0aW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUXVlcnkgPSB7XG4gICAgcXVlcnk6IHN0cmluZyxcbiAgICBiaW5kVmFyczogeyBbc3RyaW5nXTogYW55IH0sXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cmFwPFI+KGxvZzogUUxvZywgb3A6IHN0cmluZywgYXJnczogYW55LCBmZXRjaDogKCkgPT4gUHJvbWlzZTxSPikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaCgpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zdCBlcnJvciA9IHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSxcbiAgICAgICAgICAgIGNvZGU6IGVyci5jb2RlXG4gICAgICAgIH07XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmNsYXNzIFJlZ2lzdHJ5TWFwPFQ+IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXRlbXM6IE1hcDxudW1iZXIsIFQ+O1xuICAgIGxhc3RJZDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubGFzdElkID0gMDtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGQoaXRlbTogVCk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLml0ZW1zLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IGlkO1xuICAgICAgICB0aGlzLml0ZW1zLnNldChpZCwgaXRlbSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmUoaWQ6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSAke3RoaXMubmFtZX06IGl0ZW0gd2l0aCBpZCBbJHtpZH1dIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBbbnVtYmVyLCBUXVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLmVudHJpZXMoKV07XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IFRbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy52YWx1ZXMoKV07XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5mdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZnVuY3Rpb24gc2VsZWN0RmllbGRzKGRvYzogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBhbnkge1xuICAgIGNvbnN0IHNlbGVjdGVkOiBhbnkgPSB7fTtcbiAgICBpZiAoZG9jLl9rZXkpIHtcbiAgICAgICAgc2VsZWN0ZWQuX2tleSA9IGRvYy5fa2V5O1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9uKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMCA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkxpc3RlbmVyIHtcbiAgICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uO1xuICAgIGlkOiA/bnVtYmVyO1xuICAgIGZpbHRlcjogYW55O1xuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXTtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xuICAgICAgICB0aGlzLmlkID0gY29sbGVjdGlvbi5saXN0ZW5lcnMuYWRkKHRoaXMpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy5pZDtcbiAgICAgICAgaWYgKGlkICE9PSBudWxsICYmIGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmxpc3RlbmVycy5yZW1vdmUoaWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgfVxuXG4gICAgZ2V0RXZlbnRDb3VudCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFdhaXRGb3JMaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkO1xuXG4gICAgY29uc3RydWN0b3IoY29sbGVjdGlvbjogQ29sbGVjdGlvbiwgZmlsdGVyOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSwgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIGZpbHRlciwgc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5vbkluc2VydE9yVXBkYXRlID0gb25JbnNlcnRPclVwZGF0ZTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgdGhpcy5vbkluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgfVxufVxuXG5cbi8vJEZsb3dGaXhNZVxuZXhwb3J0IGNsYXNzIFN1YnNjcmlwdGlvbkxpc3RlbmVyIGV4dGVuZHMgQ29sbGVjdGlvbkxpc3RlbmVyIGltcGxlbWVudHMgQXN5bmNJdGVyYXRvcjxhbnk+IHtcbiAgICBldmVudENvdW50OiBudW1iZXI7XG4gICAgcHVsbFF1ZXVlOiAoKHZhbHVlOiBhbnkpID0+IHZvaWQpW107XG4gICAgcHVzaFF1ZXVlOiBhbnlbXTtcbiAgICBydW5uaW5nOiBib29sZWFuO1xuXG4gICAgY29uc3RydWN0b3IoY29sbGVjdGlvbjogQ29sbGVjdGlvbiwgZmlsdGVyOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBmaWx0ZXIsIHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgIHRoaXMucHVzaFF1ZXVlID0gW107XG4gICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1F1ZXVlT3ZlcmZsb3coKSAmJiB0aGlzLmNvbGxlY3Rpb24uZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgdGhpcy5maWx0ZXIpKSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hWYWx1ZSh7IFt0aGlzLmNvbGxlY3Rpb24ubmFtZV06IHNlbGVjdEZpZWxkcyhkb2MsIHRoaXMuc2VsZWN0aW9uKSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzUXVldWVPdmVyZmxvdygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UXVldWVTaXplKCkgPj0gMTA7XG4gICAgfVxuXG4gICAgZ2V0RXZlbnRDb3VudCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudENvdW50O1xuICAgIH1cblxuICAgIGdldFF1ZXVlU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoUXVldWUubGVuZ3RoICsgdGhpcy5wdWxsUXVldWUubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1c2hWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIGNvbnN0IHF1ZXVlU2l6ZSA9IHRoaXMuZ2V0UXVldWVTaXplKCk7XG4gICAgICAgIGlmIChxdWV1ZVNpemUgPiB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ubWF4UXVldWVTaXplID0gcXVldWVTaXplO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCArPSAxO1xuICAgICAgICBpZiAodGhpcy5wdWxsUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5zaGlmdCgpKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgID8geyB2YWx1ZSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBuZXh0KCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHVzaFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgICAgID8geyB2YWx1ZTogdGhpcy5wdXNoUXVldWUuc2hpZnQoKSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnB1c2gocmVzb2x2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHJldHVybigpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgfVxuXG4gICAgYXN5bmMgdGhyb3coZXJyb3I/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgIH1cblxuICAgIC8vJEZsb3dGaXhNZVxuICAgIFskJGFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBlbXB0eVF1ZXVlKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLmZvckVhY2gocmVzb2x2ZSA9PiByZXNvbHZlKHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuXG5leHBvcnQgdHlwZSBRdWVyeVN0YXQgPSB7XG4gICAgZXN0aW1hdGVkQ29zdDogbnVtYmVyLFxuICAgIHNsb3c6IGJvb2xlYW4sXG4gICAgdGltZXM6IG51bWJlcltdLFxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgbGlzdGVuZXJzOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+O1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2csXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBjaGFuZ2VMb2c7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG4gICAgICAgIHRoaXMuc2xvd0RiID0gc2xvd0RiO1xuXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj4oYCR7bmFtZX0gbGlzdGVuZXJzYCk7XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cyA9IG5ldyBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+KCk7XG4gICAgICAgIHRoaXMubWF4UXVldWVTaXplID0gMDtcbiAgICB9XG5cbiAgICAvLyBTdWJzY3JpcHRpb25zXG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuZG9jVHlwZS50ZXN0KG51bGwsIGRvYywgbGlzdGVuZXIuZmlsdGVyKSkge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3Vic2NyaXB0aW9uUmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWJzY3JpYmU6IChfOiBhbnksIGFyZ3M6IHsgZmlsdGVyOiBhbnkgfSwgX2NvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTdWJzY3JpcHRpb25MaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIGFzeW5jIGVuc3VyZVF1ZXJ5U3RhdChxOiBRdWVyeSk6IFByb21pc2U8UXVlcnlTdGF0PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5xdWVyeVN0YXRzLmdldChxLnF1ZXJ5KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFuID0gKGF3YWl0IHRoaXMuZGIuZXhwbGFpbihxKSkucGxhbjtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IHBsYW4uZXN0aW1hdGVkQ29zdCxcbiAgICAgICAgICAgIHNsb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGxhbi5ub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS50eXBlID09PSAnRW51bWVyYXRlQ29sbGVjdGlvbk5vZGUnKSkge1xuICAgICAgICAgICAgc3RhdC5zbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEucXVlcnksIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IHRoaXMuZW5zdXJlUXVlcnlTdGF0KHEpO1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhjb250ZXh0LCAnYXJhbmdvLmpzOmZldGNoRG9jcycsICduZXcgcXVlcnknLCBhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgc3RhdCwgZmlsdGVyLCBzZWxlY3Rpb24sIHRpbWVvdXQpXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLCBzdGF0KTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsIHN0YXQuc2xvdyA/ICdTTE9XJyA6ICdGQVNUJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGRiID0gc3RhdC5zbG93ID8gdGhpcy5zbG93RGIgOiB0aGlzLmRiO1xuICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHEpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgIHN0YXQudGltZXMucHVzaChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICBpZiAoc3RhdC50aW1lcy5sZW5ndGggPiAxMDAwKSB7XG4gICAgICAgICAgICBzdGF0LnRpbWVzLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihxOiBRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLCB0aW1lb3V0OiBudW1iZXIpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBsZXQgd2FpdEZvcjogP1dhaXRGb3JMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5xdWVyeShxLCBzdGF0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbmV3IFdhaXRGb3JMaXN0ZW5lcih0aGlzLCBmaWx0ZXIsIHNlbGVjdGlvbiwgKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBvblRpbWVvdXQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZShbXSksIHRpbWVvdXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5yYWNlKFtcbiAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgb25UaW1lb3V0LFxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB3YWl0Rm9yLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBnZW5RdWVyeShmaWx0ZXI6IGFueSwgb3JkZXJCeTogT3JkZXJCeVtdLCBsaW1pdDogbnVtYmVyKTogP1F1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKGZpbHRlclNlY3Rpb24gPT09ICdGSUxURVIgZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvcmRlckJ5UWwgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5UWwgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5UWx9YCA6ICcnO1xuICAgICAgICBjb25zdCBsaW1pdFFsID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRRbH1gO1xuXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlcnksXG4gICAgICAgICAgICBiaW5kVmFyczogcGFyYW1zLnZhbHVlc1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubG9nLCAnRkVUQ0hfRE9DX0JZX0tFWScsIGtleSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGJDb2xsZWN0aW9uKCkuZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGtleSkpKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFuZ2VMb2cge1xuICAgIGVuYWJsZWQ6IGJvb2xlYW47XG4gICAgcmVjb3JkczogTWFwPHN0cmluZywgbnVtYmVyW10+O1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlY29yZHMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMucmVjb3Jkcy5jbGVhcigpO1xuICAgIH1cblxuICAgIGxvZyhpZDogc3RyaW5nLCB0aW1lOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucmVjb3Jkcy5nZXQoaWQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLnB1c2godGltZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZHMuc2V0KGlkLCBbdGltZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0KGlkOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlY29yZHMuZ2V0KGlkKSB8fCBbXTtcbiAgICB9XG59XG4iXX0=