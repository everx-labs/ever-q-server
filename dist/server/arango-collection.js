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
                              timeout = (Number(args.timeout) || 0) * 1000;
                              q = _this5.genQuery(filter, orderBy, limit);
                              _context7.next = 8;
                              return _this5.ensureQueryStat(q);

                            case 8:
                              stat = _context7.sent;
                              _context7.next = 11;
                              return _this5.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 11:
                              span = _context7.sent;
                              _context7.prev = 12;
                              start = Date.now();

                              if (!(timeout > 0)) {
                                _context7.next = 20;
                                break;
                              }

                              _context7.next = 17;
                              return _this5.queryWaitFor(q, stat, filter, selection, timeout);

                            case 17:
                              _context7.t0 = _context7.sent;
                              _context7.next = 23;
                              break;

                            case 20:
                              _context7.next = 22;
                              return _this5.query(q, stat);

                            case 22:
                              _context7.t0 = _context7.sent;

                            case 23:
                              result = _context7.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST');

                              return _context7.abrupt("return", result);

                            case 26:
                              _context7.prev = 26;
                              _context7.next = 29;
                              return span.finish();

                            case 29:
                              return _context7.finish(26);

                            case 30:
                            case "end":
                              return _context7.stop();
                          }
                        }
                      }, _callee6, null, [[12,, 26, 30]]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJmaWx0ZXIiLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwiY2hhbmdlTG9nIiwidHJhY2VyIiwiZGIiLCJzbG93RGIiLCJjcmVhdGUiLCJxdWVyeVN0YXRzIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwib3BlcmF0aW9uIiwicSIsImV4aXN0aW5nIiwiZ2V0IiwicXVlcnkiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0Iiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsImdlblF1ZXJ5IiwiZW5zdXJlUXVlcnlTdGF0Iiwic3RhcnRTcGFuTG9nIiwic3BhbiIsInN0YXJ0IiwicXVlcnlXYWl0Rm9yIiwicmVzdWx0IiwiZGVidWciLCJmaW5pc2giLCJjdXJzb3IiLCJhbGwiLCJ3YWl0Rm9yIiwiZm9yY2VUaW1lcklkIiwib25RdWVyeSIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsIm9uVGltZW91dCIsInJhY2UiLCJjbGVhclRpbWVvdXQiLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnlRbCIsIm1hcCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJqb2luIiwic29ydFNlY3Rpb24iLCJsaW1pdFFsIiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsImJpbmRWYXJzIiwia2V5IiwiZGJDb2xsZWN0aW9uIiwiZG9jdW1lbnQiLCJmZXRjaERvY0J5S2V5IiwiQ2hhbmdlTG9nIiwiZW5hYmxlZCIsInJlY29yZHMiLCJjbGVhciIsInRpbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQW9Dc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxjQUFJQSxPQUFKLElBQWUsY0FBSUMsV0FBbkIsSUFBa0MsY0FBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJQUFJLEVBQUUsY0FBSUE7QUFGQSxhQUpmO0FBUUNSLFlBQUFBLEdBQUcsQ0FBQ0ksS0FBSixDQUFVLFFBQVYsRUFBb0JILEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkUsS0FBSyxDQUFDQyxPQUFwQztBQVJELGtCQVNPRCxLQVRQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFhREssVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDSDs7Ozt3QkFFR0MsSSxFQUFpQjtBQUNqQixVQUFJQyxFQUFFLEdBQUcsS0FBS0osTUFBZDs7QUFDQSxTQUFHO0FBQ0NJLFFBQUFBLEVBQUUsR0FBR0EsRUFBRSxHQUFHQyxNQUFNLENBQUNDLGdCQUFaLEdBQStCRixFQUFFLEdBQUcsQ0FBcEMsR0FBd0MsQ0FBN0M7QUFDSCxPQUZELFFBRVMsS0FBS0gsS0FBTCxDQUFXTSxHQUFYLENBQWVILEVBQWYsQ0FGVDs7QUFHQSxXQUFLSixNQUFMLEdBQWNJLEVBQWQ7QUFDQSxXQUFLSCxLQUFMLENBQVdPLEdBQVgsQ0FBZUosRUFBZixFQUFtQkQsSUFBbkI7QUFDQSxhQUFPQyxFQUFQO0FBQ0g7OzsyQkFFTUEsRSxFQUFZO0FBQ2YsVUFBSSxDQUFDLEtBQUtILEtBQUwsV0FBa0JHLEVBQWxCLENBQUwsRUFBNEI7QUFDeEJLLFFBQUFBLE9BQU8sQ0FBQ2hCLEtBQVIsNEJBQWtDLEtBQUtNLElBQXZDLDZCQUE4REssRUFBOUQ7QUFDSDtBQUNKOzs7OEJBRXdCO0FBQ3JCLGlEQUFXLEtBQUtILEtBQUwsQ0FBV1MsT0FBWCxFQUFYO0FBQ0g7Ozs2QkFFYTtBQUNWLGlEQUFXLEtBQUtULEtBQUwsQ0FBV1UsTUFBWCxFQUFYO0FBQ0g7Ozs7O0FBUUwsU0FBU0MsaUJBQVQsQ0FBMkJDLFlBQTNCLEVBQThDQyxvQkFBOUMsRUFBOEY7QUFDMUYsTUFBTUMsTUFBd0IsR0FBRyxFQUFqQztBQUNBLE1BQU1DLFVBQVUsR0FBR0gsWUFBWSxJQUFJQSxZQUFZLENBQUNHLFVBQWhEOztBQUNBLE1BQUlBLFVBQUosRUFBZ0I7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDWiwyQkFBbUJBLFVBQW5CLDhIQUErQjtBQUFBLFlBQXBCYixLQUFvQjs7QUFDM0IsWUFBTUosS0FBSSxHQUFJSSxLQUFJLENBQUNKLElBQUwsSUFBYUksS0FBSSxDQUFDSixJQUFMLENBQVVrQixLQUF4QixJQUFrQyxFQUEvQzs7QUFDQSxZQUFJbEIsS0FBSixFQUFVO0FBQ04sY0FBTW1CLEtBQXFCLEdBQUc7QUFDMUJuQixZQUFBQSxJQUFJLEVBQUpBLEtBRDBCO0FBRTFCb0IsWUFBQUEsU0FBUyxFQUFFUCxpQkFBaUIsQ0FBQ1QsS0FBSSxDQUFDVSxZQUFOLEVBQW9CLEVBQXBCO0FBRkYsV0FBOUI7O0FBSUEsY0FBSUMsb0JBQW9CLEtBQUssRUFBekIsSUFBK0JJLEtBQUssQ0FBQ25CLElBQU4sS0FBZWUsb0JBQWxELEVBQXdFO0FBQ3BFLG1CQUFPSSxLQUFLLENBQUNDLFNBQWI7QUFDSDs7QUFDREosVUFBQUEsTUFBTSxDQUFDSyxJQUFQLENBQVlGLEtBQVo7QUFDSDtBQUNKO0FBYlc7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWNmOztBQUNELFNBQU9ILE1BQVA7QUFDSDs7QUFFRCxTQUFTTSxZQUFULENBQXNCQyxHQUF0QixFQUFnQ0gsU0FBaEMsRUFBa0U7QUFDOUQsTUFBTUksUUFBYSxHQUFHLEVBQXRCOztBQUNBLE1BQUlELEdBQUcsQ0FBQ0UsSUFBUixFQUFjO0FBQ1ZELElBQUFBLFFBQVEsQ0FBQ0MsSUFBVCxHQUFnQkYsR0FBRyxDQUFDRSxJQUFwQjtBQUNIOztBQUo2RDtBQUFBO0FBQUE7O0FBQUE7QUFLOUQsMEJBQW1CTCxTQUFuQixtSUFBOEI7QUFBQSxVQUFuQmhCLE1BQW1CO0FBQzFCLFVBQU1jLE9BQUssR0FBR0ssR0FBRyxDQUFDbkIsTUFBSSxDQUFDSixJQUFOLENBQWpCOztBQUNBLFVBQUlrQixPQUFLLEtBQUtRLFNBQWQsRUFBeUI7QUFDckJGLFFBQUFBLFFBQVEsQ0FBQ3BCLE1BQUksQ0FBQ0osSUFBTixDQUFSLEdBQXNCSSxNQUFJLENBQUNnQixTQUFMLENBQWVPLE1BQWYsR0FBd0IsQ0FBeEIsR0FBNEJMLFlBQVksQ0FBQ0osT0FBRCxFQUFRZCxNQUFJLENBQUNnQixTQUFiLENBQXhDLEdBQWtFRixPQUF4RjtBQUNIO0FBQ0o7QUFWNkQ7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFXOUQsU0FBT00sUUFBUDtBQUNIOztJQUVZSSxrQjs7O0FBT1QsOEJBQVlDLFVBQVosRUFBb0NDLE1BQXBDLEVBQWlEVixTQUFqRCxFQUE4RTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUMxRSxTQUFLUyxVQUFMLEdBQWtCQSxVQUFsQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0EsTUFBZDtBQUNBLFNBQUtWLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS2YsRUFBTCxHQUFVd0IsVUFBVSxDQUFDRSxTQUFYLENBQXFCQyxHQUFyQixDQUF5QixJQUF6QixDQUFWO0FBQ0EsU0FBS0MsU0FBTCxHQUFpQkMsSUFBSSxDQUFDQyxHQUFMLEVBQWpCO0FBQ0g7Ozs7NEJBRU87QUFDSixVQUFNOUIsRUFBRSxHQUFHLEtBQUtBLEVBQWhCOztBQUNBLFVBQUlBLEVBQUUsS0FBSyxJQUFQLElBQWVBLEVBQUUsS0FBS3FCLFNBQTFCLEVBQXFDO0FBQ2pDLGFBQUtyQixFQUFMLEdBQVUsSUFBVjtBQUNBLGFBQUt3QixVQUFMLENBQWdCRSxTQUFoQixDQUEwQkssTUFBMUIsQ0FBaUMvQixFQUFqQztBQUNIO0FBQ0o7Ozs2Q0FFd0JrQixHLEVBQVUsQ0FDbEM7OztvQ0FFdUI7QUFDcEIsYUFBTyxDQUFQO0FBQ0g7Ozs7Ozs7SUFJUWMsZTs7Ozs7QUFHVCwyQkFBWVIsVUFBWixFQUFvQ0MsTUFBcEMsRUFBaURWLFNBQWpELEVBQThFa0IsZ0JBQTlFLEVBQW9IO0FBQUE7O0FBQUE7QUFDaEgsMkhBQU1ULFVBQU4sRUFBa0JDLE1BQWxCLEVBQTBCVixTQUExQjtBQURnSDtBQUVoSCxVQUFLa0IsZ0JBQUwsR0FBd0JBLGdCQUF4QjtBQUZnSDtBQUduSDs7Ozs2Q0FFd0JmLEcsRUFBVTtBQUMvQixXQUFLZSxnQkFBTCxDQUFzQmYsR0FBdEI7QUFDSDs7O0VBVmdDSyxrQixHQWNyQzs7Ozs7SUFDYVcsb0I7Ozs7O0FBTVQsZ0NBQVlWLFVBQVosRUFBb0NDLE1BQXBDLEVBQWlEVixTQUFqRCxFQUE4RTtBQUFBOztBQUFBO0FBQzFFLGlJQUFNUyxVQUFOLEVBQWtCQyxNQUFsQixFQUEwQlYsU0FBMUI7QUFEMEU7QUFBQTtBQUFBO0FBQUE7QUFFMUUsV0FBS29CLFVBQUwsR0FBa0IsQ0FBbEI7QUFDQSxXQUFLQyxTQUFMLEdBQWlCLEVBQWpCO0FBQ0EsV0FBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNBLFdBQUtDLE9BQUwsR0FBZSxJQUFmO0FBTDBFO0FBTTdFOzs7OzZDQUV3QnBCLEcsRUFBVTtBQUMvQixVQUFJLENBQUMsS0FBS3FCLGVBQUwsRUFBRCxJQUEyQixLQUFLZixVQUFMLENBQWdCZ0IsT0FBaEIsQ0FBd0JDLElBQXhCLENBQTZCLElBQTdCLEVBQW1DdkIsR0FBbkMsRUFBd0MsS0FBS08sTUFBN0MsQ0FBL0IsRUFBcUY7QUFDakYsYUFBS2lCLFNBQUwsc0NBQWtCLEtBQUtsQixVQUFMLENBQWdCN0IsSUFBbEMsRUFBeUNzQixZQUFZLENBQUNDLEdBQUQsRUFBTSxLQUFLSCxTQUFYLENBQXJEO0FBQ0g7QUFDSjs7O3NDQUUwQjtBQUN2QixhQUFPLEtBQUs0QixZQUFMLE1BQXVCLEVBQTlCO0FBQ0g7OztvQ0FFdUI7QUFDcEIsYUFBTyxLQUFLUixVQUFaO0FBQ0g7OzttQ0FFc0I7QUFDbkIsYUFBTyxLQUFLRSxTQUFMLENBQWVmLE1BQWYsR0FBd0IsS0FBS2MsU0FBTCxDQUFlZCxNQUE5QztBQUNIOzs7OEJBRVNULEssRUFBWTtBQUNsQixVQUFNK0IsU0FBUyxHQUFHLEtBQUtELFlBQUwsRUFBbEI7O0FBQ0EsVUFBSUMsU0FBUyxHQUFHLEtBQUtwQixVQUFMLENBQWdCcUIsWUFBaEMsRUFBOEM7QUFDMUMsYUFBS3JCLFVBQUwsQ0FBZ0JxQixZQUFoQixHQUErQkQsU0FBL0I7QUFDSDs7QUFDRCxXQUFLVCxVQUFMLElBQW1CLENBQW5COztBQUNBLFVBQUksS0FBS0MsU0FBTCxDQUFlZCxNQUFmLEtBQTBCLENBQTlCLEVBQWlDO0FBQzdCLGFBQUtjLFNBQUwsQ0FBZVUsS0FBZixHQUF1QixLQUFLUixPQUFMLEdBQ2pCO0FBQUV6QixVQUFBQSxLQUFLLEVBQUxBLEtBQUY7QUFBU2tDLFVBQUFBLElBQUksRUFBRTtBQUFmLFNBRGlCLEdBRWpCO0FBQUVsQyxVQUFBQSxLQUFLLEVBQUVRLFNBQVQ7QUFBb0IwQixVQUFBQSxJQUFJLEVBQUU7QUFBMUIsU0FGTjtBQUlILE9BTEQsTUFLTztBQUNILGFBQUtWLFNBQUwsQ0FBZXJCLElBQWYsQ0FBb0JILEtBQXBCO0FBQ0g7QUFDSjs7Ozs7Ozs7Ozs7OztrREFHVSxJQUFJbUMsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtBQUM1QixzQkFBSSxNQUFJLENBQUNaLFNBQUwsQ0FBZWYsTUFBZixLQUEwQixDQUE5QixFQUFpQztBQUM3QjJCLG9CQUFBQSxPQUFPLENBQUMsTUFBSSxDQUFDWCxPQUFMLEdBQ0Y7QUFBRXpCLHNCQUFBQSxLQUFLLEVBQUUsTUFBSSxDQUFDd0IsU0FBTCxDQUFlUyxLQUFmLEVBQVQ7QUFBaUNDLHNCQUFBQSxJQUFJLEVBQUU7QUFBdkMscUJBREUsR0FFRjtBQUFFbEMsc0JBQUFBLEtBQUssRUFBRVEsU0FBVDtBQUFvQjBCLHNCQUFBQSxJQUFJLEVBQUU7QUFBMUIscUJBRkMsQ0FBUDtBQUlILG1CQUxELE1BS087QUFDSCxvQkFBQSxNQUFJLENBQUNYLFNBQUwsQ0FBZXBCLElBQWYsQ0FBb0JpQyxPQUFwQjtBQUNIO0FBQ0osaUJBVE0sQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhUCxxQkFBS0MsS0FBTDs7dUJBQ00sS0FBS0MsVUFBTCxFOzs7a0RBQ0M7QUFBRXRDLGtCQUFBQSxLQUFLLEVBQUVRLFNBQVQ7QUFBb0IwQixrQkFBQUEsSUFBSSxFQUFFO0FBQTFCLGlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7cURBR0MxRCxLOzs7OztBQUNSLHFCQUFLNkQsS0FBTDs7dUJBQ00sS0FBS0MsVUFBTCxFOzs7a0RBQ0NILE9BQU8sQ0FBQ0ksTUFBUixDQUFlL0QsS0FBZixDOzs7Ozs7Ozs7Ozs7Ozs7UUFHWDs7O1NBQ0NnRSx3Qjs0QkFBbUI7QUFDaEIsYUFBTyxJQUFQO0FBQ0g7Ozs7Ozs7Ozs7O0FBR0csb0JBQUksS0FBS2YsT0FBVCxFQUFrQjtBQUNkLHVCQUFLQSxPQUFMLEdBQWUsS0FBZjtBQUNBLHVCQUFLRixTQUFMLENBQWVrQixPQUFmLENBQXVCLFVBQUFMLE9BQU87QUFBQSwyQkFBSUEsT0FBTyxDQUFDO0FBQUVwQyxzQkFBQUEsS0FBSyxFQUFFUSxTQUFUO0FBQW9CMEIsc0JBQUFBLElBQUksRUFBRTtBQUExQixxQkFBRCxDQUFYO0FBQUEsbUJBQTlCO0FBQ0EsdUJBQUtYLFNBQUwsR0FBaUIsRUFBakI7QUFDQSx1QkFBS0MsU0FBTCxHQUFpQixFQUFqQjtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFwRmlDZCxrQjs7OztJQStGN0JnQyxVOzs7QUFlVCxzQkFDSTVELElBREosRUFFSTZDLE9BRkosRUFHSWdCLElBSEosRUFJSUMsU0FKSixFQUtJQyxNQUxKLEVBTUlDLEVBTkosRUFPSUMsTUFQSixFQVFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNFLFNBQUtqRSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLNkMsT0FBTCxHQUFlQSxPQUFmO0FBRUEsU0FBS3ZELEdBQUwsR0FBV3VFLElBQUksQ0FBQ0ssTUFBTCxDQUFZbEUsSUFBWixDQUFYO0FBQ0EsU0FBSzhELFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0EsU0FBS0MsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBRUEsU0FBS2xDLFNBQUwsR0FBaUIsSUFBSWhDLFdBQUosV0FBdUNDLElBQXZDLGdCQUFqQjtBQUNBLFNBQUttRSxVQUFMLEdBQWtCLElBQUloRSxHQUFKLEVBQWxCO0FBQ0EsU0FBSytDLFlBQUwsR0FBb0IsQ0FBcEI7QUFDSCxHLENBRUQ7Ozs7OzZDQUV5QjNCLEcsRUFBVTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUMvQiw4QkFBdUIsS0FBS1EsU0FBTCxDQUFlbkIsTUFBZixFQUF2QixtSUFBZ0Q7QUFBQSxjQUFyQ3dELFNBQXFDOztBQUM1QyxjQUFJLEtBQUt2QixPQUFMLENBQWFDLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0J2QixHQUF4QixFQUE2QjZDLFNBQVEsQ0FBQ3RDLE1BQXRDLENBQUosRUFBbUQ7QUFDL0NzQyxZQUFBQSxTQUFRLENBQUNDLHdCQUFULENBQWtDOUMsR0FBbEM7QUFDSDtBQUNKO0FBTDhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNbEM7OzsyQ0FFc0I7QUFBQTs7QUFDbkIsYUFBTztBQUNIK0MsUUFBQUEsU0FBUyxFQUFFLG1CQUFDQyxDQUFELEVBQVMvRSxJQUFULEVBQWdDZ0YsUUFBaEMsRUFBK0NDLElBQS9DLEVBQTZEO0FBQ3BFLGlCQUFPLElBQUlsQyxvQkFBSixDQUNILE1BREcsRUFFSC9DLElBQUksQ0FBQ3NDLE1BQUwsSUFBZSxFQUZaLEVBR0hqQixpQkFBaUIsQ0FBQzRELElBQUksQ0FBQ0MsU0FBTCxDQUFlNUQsWUFBaEIsRUFBOEIsTUFBSSxDQUFDZCxJQUFuQyxDQUhkLENBQVA7QUFLSDtBQVBFLE9BQVA7QUFTSCxLLENBRUQ7Ozs7Ozs7cURBRXNCMkUsQzs7Ozs7O0FBQ1pDLGdCQUFBQSxRLEdBQVcsS0FBS1QsVUFBTCxDQUFnQlUsR0FBaEIsQ0FBb0JGLENBQUMsQ0FBQ0csS0FBdEIsQzs7c0JBQ2JGLFFBQVEsS0FBS2xELFM7Ozs7O2tEQUNOa0QsUTs7Ozt1QkFFUyxLQUFLWixFQUFMLENBQVFlLE9BQVIsQ0FBZ0JKLENBQWhCLEM7OztBQUFkSyxnQkFBQUEsSSxrQkFBa0NBLEk7QUFDbENDLGdCQUFBQSxJLEdBQU87QUFDVEMsa0JBQUFBLGFBQWEsRUFBRUYsSUFBSSxDQUFDRSxhQURYO0FBRVRDLGtCQUFBQSxJQUFJLEVBQUUsS0FGRztBQUdUQyxrQkFBQUEsS0FBSyxFQUFFO0FBSEUsaUI7O0FBS2Isb0JBQUlKLElBQUksQ0FBQ0ssS0FBTCxDQUFXQyxJQUFYLENBQWdCLFVBQUFDLElBQUk7QUFBQSx5QkFBSUEsSUFBSSxDQUFDQyxJQUFMLEtBQWMseUJBQWxCO0FBQUEsaUJBQXBCLENBQUosRUFBc0U7QUFDbEVQLGtCQUFBQSxJQUFJLENBQUNFLElBQUwsR0FBWSxJQUFaO0FBQ0g7O0FBQ0QscUJBQUtoQixVQUFMLENBQWdCMUQsR0FBaEIsQ0FBb0JrRSxDQUFDLENBQUNHLEtBQXRCLEVBQTZCRyxJQUE3QjtrREFDT0EsSTs7Ozs7Ozs7Ozs7Ozs7Ozs7O29DQUdLO0FBQUE7O0FBQ1o7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHVDQUFPLGtCQUFPUSxNQUFQLEVBQW9CakcsSUFBcEIsRUFBK0JrRyxPQUEvQixFQUE2Q2pCLElBQTdDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzREFBMkRwRixJQUFJLENBQUMsTUFBSSxDQUFDQyxHQUFOLEVBQVcsT0FBWCxFQUFvQkUsSUFBcEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpREFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ3RGc0MsOEJBQUFBLE1BRHNGLEdBQzdFdEMsSUFBSSxDQUFDc0MsTUFBTCxJQUFlLEVBRDhEO0FBRXRGViw4QkFBQUEsU0FGc0YsR0FFMUVQLGlCQUFpQixDQUFDNEQsSUFBSSxDQUFDQyxTQUFMLENBQWU1RCxZQUFoQixFQUE4QixNQUFJLENBQUNkLElBQW5DLENBRnlEO0FBR3RGMkYsOEJBQUFBLE9BSHNGLEdBR2pFbkcsSUFBSSxDQUFDbUcsT0FBTCxJQUFnQixFQUhpRDtBQUl0RkMsOEJBQUFBLEtBSnNGLEdBSXRFcEcsSUFBSSxDQUFDb0csS0FBTCxJQUFjLEVBSndEO0FBS3RGQyw4QkFBQUEsT0FMc0YsR0FLNUUsQ0FBQ3ZGLE1BQU0sQ0FBQ2QsSUFBSSxDQUFDcUcsT0FBTixDQUFOLElBQXdCLENBQXpCLElBQThCLElBTDhDO0FBTXRGbEIsOEJBQUFBLENBTnNGLEdBTWxGLE1BQUksQ0FBQ21CLFFBQUwsQ0FBY2hFLE1BQWQsRUFBc0I2RCxPQUF0QixFQUErQkMsS0FBL0IsQ0FOa0Y7QUFBQTtBQUFBLHFDQU96RSxNQUFJLENBQUNHLGVBQUwsQ0FBcUJwQixDQUFyQixDQVB5RTs7QUFBQTtBQU90Rk0sOEJBQUFBLElBUHNGO0FBQUE7QUFBQSxxQ0FRekUsTUFBSSxDQUFDbEIsTUFBTCxDQUFZaUMsWUFBWixDQUF5Qk4sT0FBekIsRUFBa0MscUJBQWxDLEVBQXlELFdBQXpELEVBQXNFbEcsSUFBdEUsQ0FSeUU7O0FBQUE7QUFRdEZ5Ryw4QkFBQUEsSUFSc0Y7QUFBQTtBQVVsRkMsOEJBQUFBLEtBVmtGLEdBVTFFaEUsSUFBSSxDQUFDQyxHQUFMLEVBVjBFOztBQUFBLG9DQVd6RTBELE9BQU8sR0FBRyxDQVgrRDtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBLHFDQVk1RSxNQUFJLENBQUNNLFlBQUwsQ0FBa0J4QixDQUFsQixFQUFxQk0sSUFBckIsRUFBMkJuRCxNQUEzQixFQUFtQ1YsU0FBbkMsRUFBOEN5RSxPQUE5QyxDQVo0RTs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUEscUNBYTVFLE1BQUksQ0FBQ2YsS0FBTCxDQUFXSCxDQUFYLEVBQWNNLElBQWQsQ0FiNEU7O0FBQUE7QUFBQTs7QUFBQTtBQVdsRm1CLDhCQUFBQSxNQVhrRjs7QUFjeEYsOEJBQUEsTUFBSSxDQUFDOUcsR0FBTCxDQUFTK0csS0FBVCxDQUFlLE9BQWYsRUFBd0I3RyxJQUF4QixFQUE4QixDQUFDMEMsSUFBSSxDQUFDQyxHQUFMLEtBQWErRCxLQUFkLElBQXVCLElBQXJELEVBQTJEakIsSUFBSSxDQUFDRSxJQUFMLEdBQVksTUFBWixHQUFxQixNQUFoRjs7QUFkd0YsZ0VBZWpGaUIsTUFmaUY7O0FBQUE7QUFBQTtBQUFBO0FBQUEscUNBaUJsRkgsSUFBSSxDQUFDSyxNQUFMLEVBakJrRjs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUExQixHQUEvRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUFQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFvQkg7Ozs7OztxREFFVzNCLEMsRUFBVU0sSTs7Ozs7O0FBQ1pqQixnQkFBQUEsRSxHQUFLaUIsSUFBSSxDQUFDRSxJQUFMLEdBQVksS0FBS2xCLE1BQWpCLEdBQTBCLEtBQUtELEU7QUFDcENrQyxnQkFBQUEsSyxHQUFRaEUsSUFBSSxDQUFDQyxHQUFMLEU7O3VCQUNPNkIsRUFBRSxDQUFDYyxLQUFILENBQVNILENBQVQsQzs7O0FBQWY0QixnQkFBQUEsTTs7dUJBQ2VBLE1BQU0sQ0FBQ0MsR0FBUCxFOzs7QUFBZkosZ0JBQUFBLE07QUFDTm5CLGdCQUFBQSxJQUFJLENBQUNHLEtBQUwsQ0FBVy9ELElBQVgsQ0FBZ0JhLElBQUksQ0FBQ0MsR0FBTCxLQUFhK0QsS0FBN0I7O0FBQ0Esb0JBQUlqQixJQUFJLENBQUNHLEtBQUwsQ0FBV3pELE1BQVgsR0FBb0IsSUFBeEIsRUFBOEI7QUFDMUJzRCxrQkFBQUEsSUFBSSxDQUFDRyxLQUFMLENBQVdqQyxLQUFYO0FBQ0g7O2tEQUNNaUQsTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FEQUlRekIsQyxFQUFVTSxJLEVBQWlCbkQsTSxFQUFhVixTLEVBQTZCeUUsTzs7Ozs7Ozs7QUFDaEZZLGdCQUFBQSxPLEdBQTRCLEk7QUFDNUJDLGdCQUFBQSxZLEdBQTJCLEk7O0FBRXJCQyxnQkFBQUEsTyxHQUFVLElBQUl0RCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFVRyxNQUFWLEVBQXFCO0FBQzdDLHNCQUFNbUQsS0FBSyxHQUFHLFNBQVJBLEtBQVEsR0FBTTtBQUNoQixvQkFBQSxNQUFJLENBQUM5QixLQUFMLENBQVdILENBQVgsRUFBY00sSUFBZCxFQUFvQjRCLElBQXBCLENBQXlCLFVBQUNDLElBQUQsRUFBVTtBQUMvQiwwQkFBSUEsSUFBSSxDQUFDbkYsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCK0Usd0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0FwRCx3QkFBQUEsT0FBTyxDQUFDd0QsSUFBRCxDQUFQO0FBQ0gsdUJBSEQsTUFHTztBQUNISix3QkFBQUEsWUFBWSxHQUFHSyxVQUFVLENBQUNILEtBQUQsRUFBUSxJQUFSLENBQXpCO0FBQ0g7QUFDSixxQkFQRCxFQU9HbkQsTUFQSDtBQVFILG1CQVREOztBQVVBbUQsa0JBQUFBLEtBQUs7QUFDUixpQkFaZSxDO0FBYVZJLGdCQUFBQSxhLEdBQWdCLElBQUkzRCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFhO0FBQzNDbUQsa0JBQUFBLE9BQU8sR0FBRyxJQUFJcEUsZUFBSixDQUFvQixNQUFwQixFQUEwQlAsTUFBMUIsRUFBa0NWLFNBQWxDLEVBQTZDLFVBQUNHLEdBQUQsRUFBUztBQUM1RCtCLG9CQUFBQSxPQUFPLENBQUMsQ0FBQy9CLEdBQUQsQ0FBRCxDQUFQO0FBQ0gsbUJBRlMsQ0FBVjtBQUdILGlCQUpxQixDO0FBS2hCMEYsZ0JBQUFBLFMsR0FBWSxJQUFJNUQsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtBQUN2Q3lELGtCQUFBQSxVQUFVLENBQUM7QUFBQSwyQkFBTXpELE9BQU8sQ0FBQyxFQUFELENBQWI7QUFBQSxtQkFBRCxFQUFvQnVDLE9BQXBCLENBQVY7QUFDSCxpQkFGaUIsQzs7dUJBR0x4QyxPQUFPLENBQUM2RCxJQUFSLENBQWEsQ0FDdEJQLE9BRHNCLEVBRXRCSyxhQUZzQixFQUd0QkMsU0FIc0IsQ0FBYixDOzs7Ozs7OztBQU1iLG9CQUFJUixPQUFPLEtBQUssSUFBWixJQUFvQkEsT0FBTyxLQUFLL0UsU0FBcEMsRUFBK0M7QUFDM0MrRSxrQkFBQUEsT0FBTyxDQUFDbEQsS0FBUjtBQUNIOztBQUNELG9CQUFJbUQsWUFBWSxLQUFLLElBQXJCLEVBQTJCO0FBQ3ZCUyxrQkFBQUEsWUFBWSxDQUFDVCxZQUFELENBQVo7QUFDQUEsa0JBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzZCQU1BNUUsTSxFQUFhNkQsTyxFQUFvQkMsSyxFQUFzQjtBQUM1RCxVQUFNd0IsTUFBTSxHQUFHLElBQUlDLGVBQUosRUFBZjtBQUNBLFVBQU1DLGFBQWEsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVkxRixNQUFaLEVBQW9CSCxNQUFwQixHQUE2QixDQUE3QixvQkFDTixLQUFLa0IsT0FBTCxDQUFhNEUsRUFBYixDQUFnQkwsTUFBaEIsRUFBd0IsS0FBeEIsRUFBK0J0RixNQUEvQixDQURNLElBRWhCLEVBRk47QUFHQSxVQUFNNEYsU0FBUyxHQUFHL0IsT0FBTyxDQUNwQmdDLEdBRGEsQ0FDVCxVQUFDeEcsS0FBRCxFQUFXO0FBQ1osWUFBTXlHLFNBQVMsR0FBSXpHLEtBQUssQ0FBQ3lHLFNBQU4sSUFBbUJ6RyxLQUFLLENBQUN5RyxTQUFOLENBQWdCQyxXQUFoQixPQUFrQyxNQUF0RCxHQUNaLE9BRFksR0FFWixFQUZOO0FBR0EsNkJBQWMxRyxLQUFLLENBQUMyRyxJQUFOLENBQVdDLE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsTUFBL0IsQ0FBZCxTQUF1REgsU0FBdkQ7QUFDSCxPQU5hLEVBT2JJLElBUGEsQ0FPUixJQVBRLENBQWxCO0FBU0EsVUFBTUMsV0FBVyxHQUFHUCxTQUFTLEtBQUssRUFBZCxrQkFBMkJBLFNBQTNCLElBQXlDLEVBQTdEO0FBQ0EsVUFBTVEsT0FBTyxHQUFHQyxJQUFJLENBQUNDLEdBQUwsQ0FBU3hDLEtBQVQsRUFBZ0IsRUFBaEIsQ0FBaEI7QUFDQSxVQUFNeUMsWUFBWSxtQkFBWUgsT0FBWixDQUFsQjtBQUVBLFVBQU1wRCxLQUFLLHNDQUNNLEtBQUs5RSxJQURYLDJCQUVMc0gsYUFGSywyQkFHTFcsV0FISywyQkFJTEksWUFKSyw2QkFBWDtBQU1BLGFBQU87QUFDSHZELFFBQUFBLEtBQUssRUFBTEEsS0FERztBQUVId0QsUUFBQUEsUUFBUSxFQUFFbEIsTUFBTSxDQUFDeEc7QUFGZCxPQUFQO0FBSUg7OzttQ0FFa0M7QUFDL0IsYUFBTyxLQUFLb0QsRUFBTCxDQUFRbkMsVUFBUixDQUFtQixLQUFLN0IsSUFBeEIsQ0FBUDtBQUNIOzs7Ozs7c0RBRW1CdUksRzs7Ozs7OztvQkFDWEEsRzs7Ozs7bURBQ01sRixPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsSUFBaEIsQzs7O21EQUVKakUsSUFBSSxDQUFDLEtBQUtDLEdBQU4sRUFBVyxrQkFBWCxFQUErQmlKLEdBQS9CO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkNBQW9DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSw2REFDcEMsTUFBSSxDQUFDQyxZQUFMLEdBQW9CQyxRQUFwQixDQUE2QkYsR0FBN0IsRUFBa0MsSUFBbEMsQ0FEb0M7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXBDLEc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREFLT2YsSTs7Ozs7OztzQkFDZCxDQUFDQSxJQUFELElBQVNBLElBQUksQ0FBQzdGLE1BQUwsS0FBZ0IsQzs7Ozs7bURBQ2xCMEIsT0FBTyxDQUFDQyxPQUFSLENBQWdCLEVBQWhCLEM7OzttREFFSkQsT0FBTyxDQUFDbUQsR0FBUixDQUFZZ0IsSUFBSSxDQUFDRyxHQUFMLENBQVMsVUFBQVksR0FBRztBQUFBLHlCQUFJLE1BQUksQ0FBQ0csYUFBTCxDQUFtQkgsR0FBbkIsQ0FBSjtBQUFBLGlCQUFaLENBQVosQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlGSSxTOzs7QUFJVCx1QkFBYztBQUFBO0FBQUE7QUFBQTtBQUNWLFNBQUtDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsU0FBS0MsT0FBTCxHQUFlLElBQUkxSSxHQUFKLEVBQWY7QUFDSDs7Ozs0QkFFTztBQUNKLFdBQUswSSxPQUFMLENBQWFDLEtBQWI7QUFDSDs7O3dCQUVHekksRSxFQUFZMEksSSxFQUFjO0FBQzFCLFVBQUksQ0FBQyxLQUFLSCxPQUFWLEVBQW1CO0FBQ2Y7QUFDSDs7QUFDRCxVQUFNaEUsUUFBUSxHQUFHLEtBQUtpRSxPQUFMLENBQWFoRSxHQUFiLENBQWlCeEUsRUFBakIsQ0FBakI7O0FBQ0EsVUFBSXVFLFFBQUosRUFBYztBQUNWQSxRQUFBQSxRQUFRLENBQUN2RCxJQUFULENBQWMwSCxJQUFkO0FBQ0gsT0FGRCxNQUVPO0FBQ0gsYUFBS0YsT0FBTCxDQUFhcEksR0FBYixDQUFpQkosRUFBakIsRUFBcUIsQ0FBQzBJLElBQUQsQ0FBckI7QUFDSDtBQUNKOzs7d0JBRUcxSSxFLEVBQXNCO0FBQ3RCLGFBQU8sS0FBS3dJLE9BQUwsQ0FBYWhFLEdBQWIsQ0FBaUJ4RSxFQUFqQixLQUF3QixFQUEvQjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyAkJGFzeW5jSXRlcmF0b3IgfSBmcm9tICdpdGVyYWxsJztcbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG50eXBlIFF1ZXJ5ID0ge1xuICAgIHF1ZXJ5OiBzdHJpbmcsXG4gICAgYmluZFZhcnM6IHsgW3N0cmluZ106IGFueSB9LFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGRvY1tpdGVtLm5hbWVdO1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbaXRlbS5uYW1lXSA9IGl0ZW0uc2VsZWN0aW9uLmxlbmd0aCA+IDAgPyBzZWxlY3RGaWVsZHModmFsdWUsIGl0ZW0uc2VsZWN0aW9uKSA6IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjtcbiAgICBpZDogP251bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCAmJiBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5saXN0ZW5lcnMucmVtb3ZlKGlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBmaWx0ZXIsIHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZSA9IG9uSW5zZXJ0T3JVcGRhdGU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgIH1cbn1cblxuXG4vLyRGbG93Rml4TWVcbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb25MaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciBpbXBsZW1lbnRzIEFzeW5jSXRlcmF0b3I8YW55PiB7XG4gICAgZXZlbnRDb3VudDogbnVtYmVyO1xuICAgIHB1bGxRdWV1ZTogKCh2YWx1ZTogYW55KSA9PiB2b2lkKVtdO1xuICAgIHB1c2hRdWV1ZTogYW55W107XG4gICAgcnVubmluZzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbiwgZmlsdGVyLCBzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNRdWV1ZU92ZXJmbG93KCkgJiYgdGhpcy5jb2xsZWN0aW9uLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHRoaXMuZmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRDb3VudDtcbiAgICB9XG5cbiAgICBnZXRRdWV1ZVNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFF1ZXVlLmxlbmd0aCArIHRoaXMucHVsbFF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdXNoVmFsdWUodmFsdWU6IGFueSkge1xuICAgICAgICBjb25zdCBxdWV1ZVNpemUgPSB0aGlzLmdldFF1ZXVlU2l6ZSgpO1xuICAgICAgICBpZiAocXVldWVTaXplID4gdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSA9IHF1ZXVlU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgaWYgKHRoaXMucHVsbFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuc2hpZnQoKSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICA/IHsgdmFsdWUsIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgbmV4dCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnB1c2hRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgICAgICA/IHsgdmFsdWU6IHRoaXMucHVzaFF1ZXVlLnNoaWZ0KCksIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5wdXNoKHJlc29sdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXR1cm4oKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGFzeW5jIHRocm93KGVycm9yPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyRGbG93Rml4TWVcbiAgICBbJCRhc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYXN5bmMgZW1wdHlRdWV1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5mb3JFYWNoKHJlc29sdmUgPT4gcmVzb2x2ZSh7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSkpO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGVzdGltYXRlZENvc3Q6IG51bWJlcixcbiAgICBzbG93OiBib29sZWFuLFxuICAgIHRpbWVzOiBudW1iZXJbXSxcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGNoYW5nZUxvZzogQ2hhbmdlTG9nLFxuICAgICAgICB0cmFjZXI6IFRyYWNlcixcbiAgICAgICAgZGI6IERhdGFiYXNlLFxuICAgICAgICBzbG93RGI6IERhdGFiYXNlLFxuICAgICkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmRvY1R5cGUgPSBkb2NUeXBlO1xuXG4gICAgICAgIHRoaXMubG9nID0gbG9ncy5jcmVhdGUobmFtZSk7XG4gICAgICAgIHRoaXMuY2hhbmdlTG9nID0gY2hhbmdlTG9nO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcblxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+KGAke25hbWV9IGxpc3RlbmVyc2ApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGxpc3RlbmVyLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBhc3luYyBlbnN1cmVRdWVyeVN0YXQocTogUXVlcnkpOiBQcm9taXNlPFF1ZXJ5U3RhdD4ge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucXVlcnlTdGF0cy5nZXQocS5xdWVyeSk7XG4gICAgICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGxhbiA9IChhd2FpdCB0aGlzLmRiLmV4cGxhaW4ocSkpLnBsYW47XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBlc3RpbWF0ZWRDb3N0OiBwbGFuLmVzdGltYXRlZENvc3QsXG4gICAgICAgICAgICBzbG93OiBmYWxzZSxcbiAgICAgICAgICAgIHRpbWVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHBsYW4ubm9kZXMuZmluZChub2RlID0+IG5vZGUudHlwZSA9PT0gJ0VudW1lcmF0ZUNvbGxlY3Rpb25Ob2RlJykpIHtcbiAgICAgICAgICAgIHN0YXQuc2xvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChxLnF1ZXJ5LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQ7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSk7XG4gICAgICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSAoTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMCkgKiAxMDAwO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuZ2VuUXVlcnkoZmlsdGVyLCBvcmRlckJ5LCBsaW1pdCk7XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gYXdhaXQgdGhpcy5lbnN1cmVRdWVyeVN0YXQocSk7XG4gICAgICAgICAgICBjb25zdCBzcGFuID0gYXdhaXQgdGhpcy50cmFjZXIuc3RhcnRTcGFuTG9nKGNvbnRleHQsICdhcmFuZ28uanM6ZmV0Y2hEb2NzJywgJ25ldyBxdWVyeScsIGFyZ3MpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gdGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBzdGF0LCBmaWx0ZXIsIHNlbGVjdGlvbiwgdGltZW91dClcbiAgICAgICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQpO1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCwgc3RhdC5zbG93ID8gJ1NMT1cnIDogJ0ZBU1QnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzcGFuLmZpbmlzaCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBRdWVyeSwgc3RhdDogUXVlcnlTdGF0KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBzdGF0LnNsb3cgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgc3RhdC50aW1lcy5wdXNoKERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgIGlmIChzdGF0LnRpbWVzLmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgIHN0YXQudGltZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKHE6IFF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQsIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sIHRpbWVvdXQ6IG51bWJlcik6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGxldCB3YWl0Rm9yOiA/V2FpdEZvckxpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgbGV0IGZvcmNlVGltZXJJZDogP1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoZWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5KHEsIHN0YXQpLnRoZW4oKGRvY3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IHNldFRpbWVvdXQoY2hlY2ssIDVfMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNoZWNrKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHdhaXRGb3IgPSBuZXcgV2FpdEZvckxpc3RlbmVyKHRoaXMsIGZpbHRlciwgc2VsZWN0aW9uLCAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKFtdKSwgdGltZW91dCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgb25DaGFuZ2VzRmVlZCxcbiAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICBdKTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGlmICh3YWl0Rm9yICE9PSBudWxsICYmIHdhaXRGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHdhaXRGb3IuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGdlblF1ZXJ5KGZpbHRlcjogYW55LCBvcmRlckJ5OiBPcmRlckJ5W10sIGxpbWl0OiBudW1iZXIpOiBRdWVyeSB7XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYEZJTFRFUiAke3RoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlRbCA9IG9yZGVyQnlcbiAgICAgICAgICAgIC5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyZWN0aW9uID0gKGZpZWxkLmRpcmVjdGlvbiAmJiBmaWVsZC5kaXJlY3Rpb24udG9Mb3dlckNhc2UoKSA9PT0gJ2Rlc2MnKVxuICAgICAgICAgICAgICAgICAgICA/ICcgREVTQydcbiAgICAgICAgICAgICAgICAgICAgOiAnJztcbiAgICAgICAgICAgICAgICByZXR1cm4gYGRvYy4ke2ZpZWxkLnBhdGgucmVwbGFjZSgvXFxiaWRcXGIvZ2ksICdfa2V5Jyl9JHtkaXJlY3Rpb259YDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuam9pbignLCAnKTtcblxuICAgICAgICBjb25zdCBzb3J0U2VjdGlvbiA9IG9yZGVyQnlRbCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlRbH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0UWwgPSBNYXRoLm1pbihsaW1pdCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdFFsfWA7XG5cbiAgICAgICAgY29uc3QgcXVlcnkgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgIGJpbmRWYXJzOiBwYXJhbXMudmFsdWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY0J5S2V5KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdGRVRDSF9ET0NfQllfS0VZJywga2V5LCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYkNvbGxlY3Rpb24oKS5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoa2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoa2V5KSkpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENoYW5nZUxvZyB7XG4gICAgZW5hYmxlZDogYm9vbGVhbjtcbiAgICByZWNvcmRzOiBNYXA8c3RyaW5nLCBudW1iZXJbXT47XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVjb3JkcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5yZWNvcmRzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgbG9nKGlkOiBzdHJpbmcsIHRpbWU6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuZW5hYmxlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5yZWNvcmRzLmdldChpZCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgZXhpc3RpbmcucHVzaCh0aW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3Jkcy5zZXQoaWQsIFt0aW1lXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXQoaWQ6IHN0cmluZyk6IG51bWJlcltdIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVjb3Jkcy5nZXQoaWQpIHx8IFtdO1xuICAgIH1cbn1cbiJdfQ==