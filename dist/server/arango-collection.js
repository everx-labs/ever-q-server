"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.selectionToString = selectionToString;
exports.Collection = exports.SubscriptionListener = exports.WaitForListener = exports.CollectionListener = void 0;

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

var _arangojs = require("arangojs");

var _iterall = require("iterall");

var _opentracing = require("opentracing");

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
  _regenerator["default"].mark(function _callee16(log, op, args, fetch) {
    var error;
    return _regenerator["default"].wrap(function _callee16$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.prev = 0;
            _context17.next = 3;
            return fetch();

          case 3:
            return _context17.abrupt("return", _context17.sent);

          case 6:
            _context17.prev = 6;
            _context17.t0 = _context17["catch"](0);
            error = {
              message: _context17.t0.message || _context17.t0.ArangoError || _context17.t0.toString(),
              code: _context17.t0.code
            };
            log.error('FAILED', op, args, error.message);
            throw error;

          case 11:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee16, null, [[0, 6]]);
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

function selectionToString(selection) {
  return selection.filter(function (x) {
    return x.name !== '__typename';
  }).map(function (field) {
    var fieldSelection = selectionToString(field.selection);
    return "".concat(field.name).concat(fieldSelection !== '' ? " { ".concat(fieldSelection, " }") : '');
  }).join(' ');
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

  function WaitForListener(collection, q, onInsertOrUpdate) {
    var _this;

    (0, _classCallCheck2["default"])(this, WaitForListener);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(WaitForListener).call(this, collection, q.filter, q.selection));
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
  function Collection(name, docType, logs, tracer, db, slowDb) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
    (0, _defineProperty2["default"])(this, "listeners", void 0);
    (0, _defineProperty2["default"])(this, "queryStats", void 0);
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
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
          var result = new SubscriptionListener(_this4, args.filter || {}, parseSelectionSet(info.operation.selectionSet, _this4.name));
          return result;
        }
      };
    } // Queries

  }, {
    key: "createDatabaseQuery",
    value: function createDatabaseQuery(args, selectionInfo) {
      var filter = args.filter || {};
      var params = new _qTypes.QParams();
      var filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(this.docType.ql(params, 'doc', filter)) : '';

      if (filterSection === 'FILTER false') {
        return null;
      }

      var selection = parseSelectionSet(selectionInfo, this.name);
      var orderBy = args.orderBy || [];
      var limit = args.limit || 50;
      var timeout = Number(args.timeout) || 0;
      var orderByText = orderBy.map(function (field) {
        var direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
        return "doc.".concat(field.path.replace(/\bid\b/gi, '_key')).concat(direction);
      }).join(', ');
      var sortSection = orderByText !== '' ? "SORT ".concat(orderByText) : '';
      var limitText = Math.min(limit, 50);
      var limitSection = "LIMIT ".concat(limitText);
      var text = "\n            FOR doc IN ".concat(this.name, "\n            ").concat(filterSection, "\n            ").concat(sortSection, "\n            ").concat(limitSection, "\n            RETURN doc");
      return {
        filter: filter,
        selection: selection,
        orderBy: orderBy,
        limit: limit,
        timeout: timeout,
        text: text,
        params: params.values
      };
    }
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
                existing = this.queryStats.get(q.text);

                if (!(existing !== undefined)) {
                  _context6.next = 3;
                  break;
                }

                return _context6.abrupt("return", existing);

              case 3:
                _context6.next = 5;
                return this.db.explain(q.text, q.params);

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

                this.queryStats.set(q.text, stat);
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
                      var parentSpan, q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              parentSpan = _tracer.QTracer.getParentSpan(_this5.tracer, context);
                              q = _this5.createDatabaseQuery(args, info.operation.selectionSet);

                              if (q) {
                                _context7.next = 5;
                                break;
                              }

                              _this5.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);

                              return _context7.abrupt("return", []);

                            case 5:
                              _context7.next = 7;
                              return _this5.ensureQueryStat(q);

                            case 7:
                              stat = _context7.sent;
                              start = Date.now();

                              if (!(q.timeout > 0)) {
                                _context7.next = 15;
                                break;
                              }

                              _context7.next = 12;
                              return _this5.queryWaitFor(q, stat, parentSpan);

                            case 12:
                              _context7.t0 = _context7.sent;
                              _context7.next = 18;
                              break;

                            case 15:
                              _context7.next = 17;
                              return _this5.query(q, stat, parentSpan);

                            case 17:
                              _context7.t0 = _context7.sent;

                            case 18:
                              result = _context7.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST', context.remoteAddress);

                              return _context7.abrupt("return", result);

                            case 21:
                            case "end":
                              return _context7.stop();
                          }
                        }
                      }, _callee6);
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
      _regenerator["default"].mark(function _callee9(q, stat, parentSpan) {
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee9$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".query'"),
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee8(span) {
                    return _regenerator["default"].wrap(function _callee8$(_context9) {
                      while (1) {
                        switch (_context9.prev = _context9.next) {
                          case 0:
                            Collection.setQueryTraceParams(q, span);
                            return _context9.abrupt("return", _this6.queryDatabase(q, stat));

                          case 2:
                          case "end":
                            return _context9.stop();
                        }
                      }
                    }, _callee8);
                  }));

                  return function (_x14) {
                    return _ref3.apply(this, arguments);
                  };
                }(), parentSpan));

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee9, this);
      }));

      function query(_x11, _x12, _x13) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryDatabase",
    value: function () {
      var _queryDatabase = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee10(q, stat) {
        var db, start, cursor, result;
        return _regenerator["default"].wrap(function _callee10$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                db = stat.slow ? this.slowDb : this.db;
                start = Date.now();
                _context11.next = 4;
                return db.query(q.text, q.params);

              case 4:
                cursor = _context11.sent;
                _context11.next = 7;
                return cursor.all();

              case 7:
                result = _context11.sent;
                stat.times.push(Date.now() - start);

                if (stat.times.length > 100) {
                  stat.times.shift();
                }

                return _context11.abrupt("return", result);

              case 11:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee10, this);
      }));

      function queryDatabase(_x15, _x16) {
        return _queryDatabase.apply(this, arguments);
      }

      return queryDatabase;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee12(q, stat, parentSpan) {
        var _this7 = this;

        return _regenerator["default"].wrap(function _callee12$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                return _context13.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".waitFor'"),
                /*#__PURE__*/
                function () {
                  var _ref4 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee11(span) {
                    var waitFor, forceTimerId, resolvedBy, onQuery, onChangesFeed, onTimeout, result;
                    return _regenerator["default"].wrap(function _callee11$(_context12) {
                      while (1) {
                        switch (_context12.prev = _context12.next) {
                          case 0:
                            Collection.setQueryTraceParams(q, span);
                            waitFor = null;
                            forceTimerId = null;
                            resolvedBy = null;
                            _context12.prev = 4;
                            onQuery = new Promise(function (resolve, reject) {
                              var check = function check() {
                                _this7.queryDatabase(q, stat).then(function (docs) {
                                  if (!resolvedBy) {
                                    if (docs.length > 0) {
                                      forceTimerId = null;
                                      resolvedBy = 'query';
                                      resolve(docs);
                                    } else {
                                      forceTimerId = setTimeout(check, 5000);
                                    }
                                  }
                                }, reject);
                              };

                              check();
                            });
                            onChangesFeed = new Promise(function (resolve) {
                              waitFor = new WaitForListener(_this7, q, function (doc) {
                                if (!resolvedBy) {
                                  resolvedBy = 'listener';
                                  resolve([doc]);
                                }
                              });
                            });
                            onTimeout = new Promise(function (resolve) {
                              setTimeout(function () {
                                if (!resolvedBy) {
                                  resolvedBy = 'timeout';
                                  resolve([]);
                                }
                              }, q.timeout);
                            });
                            _context12.next = 10;
                            return Promise.race([onQuery, onChangesFeed, onTimeout]);

                          case 10:
                            result = _context12.sent;
                            span.setTag('resolved', resolvedBy);
                            return _context12.abrupt("return", result);

                          case 13:
                            _context12.prev = 13;

                            if (waitFor !== null && waitFor !== undefined) {
                              waitFor.close();
                            }

                            if (forceTimerId !== null) {
                              clearTimeout(forceTimerId);
                              forceTimerId = null;
                            }

                            return _context12.finish(13);

                          case 17:
                          case "end":
                            return _context12.stop();
                        }
                      }
                    }, _callee11, null, [[4,, 13, 17]]);
                  }));

                  return function (_x20) {
                    return _ref4.apply(this, arguments);
                  };
                }(), parentSpan));

              case 1:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee12, this);
      }));

      function queryWaitFor(_x17, _x18, _x19) {
        return _queryWaitFor.apply(this, arguments);
      }

      return queryWaitFor;
    }()
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
      _regenerator["default"].mark(function _callee14(key) {
        var _this8 = this;

        return _regenerator["default"].wrap(function _callee14$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                if (key) {
                  _context15.next = 2;
                  break;
                }

                return _context15.abrupt("return", Promise.resolve(null));

              case 2:
                return _context15.abrupt("return", wrap(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee13() {
                  return _regenerator["default"].wrap(function _callee13$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          return _context14.abrupt("return", _this8.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context14.stop();
                      }
                    }
                  }, _callee13);
                }))));

              case 3:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee14, this);
      }));

      function fetchDocByKey(_x21) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee15(keys) {
        var _this9 = this;

        return _regenerator["default"].wrap(function _callee15$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context16.next = 2;
                  break;
                }

                return _context16.abrupt("return", Promise.resolve([]));

              case 2:
                return _context16.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this9.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee15);
      }));

      function fetchDocsByKeys(_x22) {
        return _fetchDocsByKeys.apply(this, arguments);
      }

      return fetchDocsByKeys;
    }()
  }], [{
    key: "setQueryTraceParams",
    value: function setQueryTraceParams(q, span) {
      var params = {
        filter: q.filter,
        selection: selectionToString(q.selection)
      };

      if (q.orderBy.length > 0) {
        params.orderBy = q.orderBy;
      }

      if (q.limit !== 50) {
        params.limit = q.limit;
      }

      if (q.timeout > 0) {
        params.timeout = q.timeout;
      }

      span.setTag('params', params);
    }
  }]);
  return Collection;
}();

exports.Collection = Collection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmlsdGVyIiwieCIsIm1hcCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsIm9uRmllbGQiLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwicSIsIm9uSW5zZXJ0T3JVcGRhdGUiLCJTdWJzY3JpcHRpb25MaXN0ZW5lciIsImV2ZW50Q291bnQiLCJwdWxsUXVldWUiLCJwdXNoUXVldWUiLCJydW5uaW5nIiwiaXNRdWV1ZU92ZXJmbG93IiwiZG9jVHlwZSIsInRlc3QiLCJwdXNoVmFsdWUiLCJnZXRRdWV1ZVNpemUiLCJxdWV1ZVNpemUiLCJtYXhRdWV1ZVNpemUiLCJzaGlmdCIsImRvbmUiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNsb3NlIiwiZW1wdHlRdWV1ZSIsInJlamVjdCIsIiQkYXN5bmNJdGVyYXRvciIsImZvckVhY2giLCJDb2xsZWN0aW9uIiwibG9ncyIsInRyYWNlciIsImRiIiwic2xvd0RiIiwiY3JlYXRlIiwicXVlcnlTdGF0cyIsImxpc3RlbmVyIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwic3Vic2NyaWJlIiwiXyIsIl9jb250ZXh0IiwiaW5mbyIsInJlc3VsdCIsIm9wZXJhdGlvbiIsInNlbGVjdGlvbkluZm8iLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJvcmRlckJ5VGV4dCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJ0ZXh0IiwiZXhpc3RpbmciLCJnZXQiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0IiwicGFyZW50U3BhbiIsIlFUcmFjZXIiLCJnZXRQYXJlbnRTcGFuIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsImVuc3VyZVF1ZXJ5U3RhdCIsInN0YXJ0IiwicXVlcnlXYWl0Rm9yIiwicXVlcnkiLCJ0cmFjZSIsInNwYW4iLCJzZXRRdWVyeVRyYWNlUGFyYW1zIiwicXVlcnlEYXRhYmFzZSIsImN1cnNvciIsImFsbCIsIndhaXRGb3IiLCJmb3JjZVRpbWVySWQiLCJyZXNvbHZlZEJ5Iiwib25RdWVyeSIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsIm9uVGltZW91dCIsInJhY2UiLCJzZXRUYWciLCJjbGVhclRpbWVvdXQiLCJrZXkiLCJkYkNvbGxl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R0FBaUI3QyxDQUFDLENBQUM2QyxPQUFuQjtBQUNIOztBQUNELFVBQUk3QyxDQUFDLENBQUM4QyxLQUFGLEtBQVksRUFBaEIsRUFBb0I7QUFDaEJQLFFBQUFBLE1BQU0sQ0FBQ08sS0FBUCxHQUFlOUMsQ0FBQyxDQUFDOEMsS0FBakI7QUFDSDs7QUFDRCxVQUFJOUMsQ0FBQyxDQUFDK0MsT0FBRixHQUFZLENBQWhCLEVBQW1CO0FBQ2ZSLFFBQUFBLE1BQU0sQ0FBQ1EsT0FBUCxHQUFpQi9DLENBQUMsQ0FBQytDLE9BQW5CO0FBQ0g7O0FBQ0RxQyxNQUFBQSxJQUFJLENBQUNnQixNQUFMLENBQVksUUFBWixFQUFzQjdELE1BQXRCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7ICQkYXN5bmNJdGVyYXRvciB9IGZyb20gJ2l0ZXJhbGwnO1xuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3Qgb25GaWVsZCA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6ICdpbl9tc2cnLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiAnb3V0X21zZycsXG4gICAgICAgICAgICBzaWduYXR1cmVzOiAnaWQnLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChvbkZpZWxkICE9PSB1bmRlZmluZWQgJiYgZG9jW29uRmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW29uRmllbGRdID0gZG9jW29uRmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMCA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG50eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjtcbiAgICBpZDogP251bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCAmJiBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5saXN0ZW5lcnMucmVtb3ZlKGlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIHE6IERhdGFiYXNlUXVlcnksIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBxLmZpbHRlciwgcS5zZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUgPSBvbkluc2VydE9yVXBkYXRlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICB9XG59XG5cblxuLy8kRmxvd0ZpeE1lXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIgaW1wbGVtZW50cyBBc3luY0l0ZXJhdG9yPGFueT4ge1xuICAgIGV2ZW50Q291bnQ6IG51bWJlcjtcbiAgICBwdWxsUXVldWU6ICgodmFsdWU6IGFueSkgPT4gdm9pZClbXTtcbiAgICBwdXNoUXVldWU6IGFueVtdO1xuICAgIHJ1bm5pbmc6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIGZpbHRlciwgc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5ldmVudENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFZhbHVlKHsgW3RoaXMuY29sbGVjdGlvbi5uYW1lXTogc2VsZWN0RmllbGRzKGRvYywgdGhpcy5zZWxlY3Rpb24pIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNRdWV1ZU92ZXJmbG93KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRRdWV1ZVNpemUoKSA+PSAxMDtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Q291bnQ7XG4gICAgfVxuXG4gICAgZ2V0UXVldWVTaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hRdWV1ZS5sZW5ndGggKyB0aGlzLnB1bGxRdWV1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVzaFZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgY29uc3QgcXVldWVTaXplID0gdGhpcy5nZXRRdWV1ZVNpemUoKTtcbiAgICAgICAgaWYgKHF1ZXVlU2l6ZSA+IHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUgPSBxdWV1ZVNpemU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudENvdW50ICs9IDE7XG4gICAgICAgIGlmICh0aGlzLnB1bGxRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnNoaWZ0KCkodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgPyB7IHZhbHVlLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIG5leHQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wdXNoUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICAgICAgPyB7IHZhbHVlOiB0aGlzLnB1c2hRdWV1ZS5zaGlmdCgpLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUucHVzaChyZXNvbHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmV0dXJuKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBhc3luYyB0aHJvdyhlcnJvcj86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgLy8kRmxvd0ZpeE1lXG4gICAgWyQkYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFzeW5jIGVtcHR5UXVldWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuZm9yRWFjaChyZXNvbHZlID0+IHJlc29sdmUoeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBlc3RpbWF0ZWRDb3N0OiBudW1iZXIsXG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG5cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBsaXN0ZW5lci5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBfY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYEZJTFRFUiAke3RoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGlmIChmaWx0ZXJTZWN0aW9uID09PSAnRklMVEVSIGZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgZW5zdXJlUXVlcnlTdGF0KHE6IERhdGFiYXNlUXVlcnkpOiBQcm9taXNlPFF1ZXJ5U3RhdD4ge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucXVlcnlTdGF0cy5nZXQocS50ZXh0KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFuID0gKGF3YWl0IHRoaXMuZGIuZXhwbGFpbihxLnRleHQsIHEucGFyYW1zKSkucGxhbjtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IHBsYW4uZXN0aW1hdGVkQ29zdCxcbiAgICAgICAgICAgIHNsb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGxhbi5ub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS50eXBlID09PSAnRW51bWVyYXRlQ29sbGVjdGlvbk5vZGUnKSkge1xuICAgICAgICAgICAgc3RhdC5zbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEudGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudFNwYW4gPSBRVHJhY2VyLmdldFBhcmVudFNwYW4odGhpcy50cmFjZXIsIGNvbnRleHQpO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQpO1xuICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBhd2FpdCB0aGlzLmVuc3VyZVF1ZXJ5U3RhdChxKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIHN0YXQsIHBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQsIHBhcmVudFNwYW4pO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLCBzdGF0LnNsb3cgPyAnU0xPVycgOiAnRkFTVCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgc2V0UXVlcnlUcmFjZVBhcmFtcyhxOiBEYXRhYmFzZVF1ZXJ5LCBzcGFuOiBTcGFuKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgcGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgcGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHBhcmFtcyk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeSdgLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICAgICAgQ29sbGVjdGlvbi5zZXRRdWVyeVRyYWNlUGFyYW1zKHEsIHNwYW4pO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucXVlcnlEYXRhYmFzZShxLCBzdGF0KTtcbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnlEYXRhYmFzZShxOiBEYXRhYmFzZVF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBjb25zdCBkYiA9IHN0YXQuc2xvdyA/IHRoaXMuc2xvd0RiIDogdGhpcy5kYjtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCBkYi5xdWVyeShxLnRleHQsIHEucGFyYW1zKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY3Vyc29yLmFsbCgpO1xuICAgICAgICBzdGF0LnRpbWVzLnB1c2goRGF0ZS5ub3coKSAtIHN0YXJ0KTtcbiAgICAgICAgaWYgKHN0YXQudGltZXMubGVuZ3RoID4gMTAwKSB7XG4gICAgICAgICAgICBzdGF0LnRpbWVzLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihxOiBEYXRhYmFzZVF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQsIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LndhaXRGb3InYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/V2FpdEZvckxpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlEYXRhYmFzZShxLCBzdGF0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbmV3IFdhaXRGb3JMaXN0ZW5lcih0aGlzLCBxLCAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvci5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG4iXX0=