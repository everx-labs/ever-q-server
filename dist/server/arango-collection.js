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

var _qAuth = _interopRequireDefault(require("./q-auth"));

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
            log.error('FAILED', op, args, _context17.t0.message || _context17.t0.ArangoError || _context17.t0.toString());
            throw _context17.t0;

          case 10:
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
                      var q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

                            case 2:
                              q = _this5.createDatabaseQuery(args, info.operation.selectionSet);

                              if (q) {
                                _context7.next = 6;
                                break;
                              }

                              _this5.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);

                              return _context7.abrupt("return", []);

                            case 6:
                              _context7.next = 8;
                              return _this5.ensureQueryStat(q);

                            case 8:
                              stat = _context7.sent;
                              start = Date.now();

                              if (!(q.timeout > 0)) {
                                _context7.next = 16;
                                break;
                              }

                              _context7.next = 13;
                              return _this5.queryWaitFor(q, stat, context.parentSpan);

                            case 13:
                              _context7.t0 = _context7.sent;
                              _context7.next = 19;
                              break;

                            case 16:
                              _context7.next = 18;
                              return _this5.query(q, stat, context.parentSpan);

                            case 18:
                              _context7.t0 = _context7.sent;

                            case 19:
                              result = _context7.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST', context.remoteAddress);

                              return _context7.abrupt("return", result);

                            case 22:
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
                return _context10.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".query"),
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
                return _context13.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".waitFor"),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiUmVnaXN0cnlNYXAiLCJuYW1lIiwibGFzdElkIiwiaXRlbXMiLCJNYXAiLCJpdGVtIiwiaWQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwic2V0IiwiY29uc29sZSIsImVudHJpZXMiLCJ2YWx1ZXMiLCJwYXJzZVNlbGVjdGlvblNldCIsInNlbGVjdGlvblNldCIsInJldHVybkZpZWxkU2VsZWN0aW9uIiwiZmllbGRzIiwic2VsZWN0aW9ucyIsInZhbHVlIiwiZmllbGQiLCJzZWxlY3Rpb24iLCJwdXNoIiwic2VsZWN0aW9uVG9TdHJpbmciLCJmaWx0ZXIiLCJ4IiwibWFwIiwiZmllbGRTZWxlY3Rpb24iLCJqb2luIiwic2VsZWN0RmllbGRzIiwiZG9jIiwic2VsZWN0ZWQiLCJfa2V5Iiwib25GaWVsZCIsImluX21lc3NhZ2UiLCJvdXRfbWVzc2FnZXMiLCJzaWduYXR1cmVzIiwidW5kZWZpbmVkIiwibGVuZ3RoIiwiQ29sbGVjdGlvbkxpc3RlbmVyIiwiY29sbGVjdGlvbiIsImxpc3RlbmVycyIsImFkZCIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJyZW1vdmUiLCJXYWl0Rm9yTGlzdGVuZXIiLCJxIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwicmVqZWN0IiwiJCRhc3luY0l0ZXJhdG9yIiwiZm9yRWFjaCIsIkNvbGxlY3Rpb24iLCJsb2dzIiwidHJhY2VyIiwiZGIiLCJzbG93RGIiLCJjcmVhdGUiLCJxdWVyeVN0YXRzIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwicmVzdWx0Iiwib3BlcmF0aW9uIiwic2VsZWN0aW9uSW5mbyIsInBhcmFtcyIsIlFQYXJhbXMiLCJmaWx0ZXJTZWN0aW9uIiwiT2JqZWN0Iiwia2V5cyIsInFsIiwib3JkZXJCeSIsImxpbWl0IiwidGltZW91dCIsIm9yZGVyQnlUZXh0IiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJleGlzdGluZyIsImdldCIsImV4cGxhaW4iLCJwbGFuIiwic3RhdCIsImVzdGltYXRlZENvc3QiLCJzbG93IiwidGltZXMiLCJub2RlcyIsImZpbmQiLCJub2RlIiwidHlwZSIsInBhcmVudCIsImNvbnRleHQiLCJhdXRoIiwicmVxdWlyZUdyYW50ZWRBY2Nlc3MiLCJhY2Nlc3NLZXkiLCJjcmVhdGVEYXRhYmFzZVF1ZXJ5IiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwiZW5zdXJlUXVlcnlTdGF0Iiwic3RhcnQiLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicXVlcnkiLCJRVHJhY2VyIiwidHJhY2UiLCJzcGFuIiwic2V0UXVlcnlUcmFjZVBhcmFtcyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJ3YWl0Rm9yIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsIm9uUXVlcnkiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJvblRpbWVvdXQiLCJyYWNlIiwic2V0VGFnIiwiY2xlYXJUaW1l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QUFDLENBQUM4QyxLQUFGLEtBQVksRUFBaEIsRUFBb0I7QUFDaEJQLFFBQUFBLE1BQU0sQ0FBQ08sS0FBUCxHQUFlOUMsQ0FBQyxDQUFDOEMsS0FBakI7QUFDSDs7QUFDRCxVQUFJOUMsQ0FBQyxDQUFDK0MsT0FBRixHQUFZLENBQWhCLEVBQW1CO0FBQ2ZSLFFBQUFBLE1BQU0sQ0FBQ1EsT0FBUCxHQUFpQi9DLENBQUMsQ0FBQytDLE9BQW5CO0FBQ0g7O0FBQ0R1QyxNQUFBQSxJQUFJLENBQUNnQixNQUFMLENBQVksUUFBWixFQUFzQi9ELE1BQXRCO0FBQ0giLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTgtMjAyMCBUT04gREVWIFNPTFVUSU9OUyBMVEQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIFNPRlRXQVJFIEVWQUxVQVRJT04gTGljZW5zZSAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXG4gKiB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGVcbiAqIExpY2Vuc2UgYXQ6XG4gKlxuICogaHR0cDovL3d3dy50b24uZGV2L2xpY2Vuc2VzXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBUT04gREVWIHNvZnR3YXJlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIEBmbG93XG5cbmltcG9ydCB7IERhdGFiYXNlLCBEb2N1bWVudENvbGxlY3Rpb24gfSBmcm9tIFwiYXJhbmdvanNcIjtcbmltcG9ydCB7ICQkYXN5bmNJdGVyYXRvciB9IGZyb20gJ2l0ZXJhbGwnO1xuaW1wb3J0IHsgU3BhbiwgU3BhbkNvbnRleHQsIFRyYWNlciB9IGZyb20gXCJvcGVudHJhY2luZ1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgdHlwZSB7IFFMb2cgfSBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IFFBdXRoIGZyb20gXCIuL3EtYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogUUF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSk7XG4gICAgICAgIHRocm93IGVycjtcbiAgICB9XG59XG5cbmNsYXNzIFJlZ2lzdHJ5TWFwPFQ+IHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaXRlbXM6IE1hcDxudW1iZXIsIFQ+O1xuICAgIGxhc3RJZDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMubGFzdElkID0gMDtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICBhZGQoaXRlbTogVCk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdElkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLml0ZW1zLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IGlkO1xuICAgICAgICB0aGlzLml0ZW1zLnNldChpZCwgaXRlbSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICByZW1vdmUoaWQ6IG51bWJlcikge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMuZGVsZXRlKGlkKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIHJlbW92ZSAke3RoaXMubmFtZX06IGl0ZW0gd2l0aCBpZCBbJHtpZH1dIGRvZXMgbm90IGV4aXN0c2ApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZW50cmllcygpOiBbbnVtYmVyLCBUXVtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLmVudHJpZXMoKV07XG4gICAgfVxuXG4gICAgdmFsdWVzKCk6IFRbXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy52YWx1ZXMoKV07XG4gICAgfVxufVxuXG5leHBvcnQgdHlwZSBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxufVxuXG5mdW5jdGlvbiBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25TZXQ6IGFueSwgcmV0dXJuRmllbGRTZWxlY3Rpb246IHN0cmluZyk6IEZpZWxkU2VsZWN0aW9uW10ge1xuICAgIGNvbnN0IGZpZWxkczogRmllbGRTZWxlY3Rpb25bXSA9IFtdO1xuICAgIGNvbnN0IHNlbGVjdGlvbnMgPSBzZWxlY3Rpb25TZXQgJiYgc2VsZWN0aW9uU2V0LnNlbGVjdGlvbnM7XG4gICAgaWYgKHNlbGVjdGlvbnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSAoaXRlbS5uYW1lICYmIGl0ZW0ubmFtZS52YWx1ZSkgfHwgJyc7XG4gICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpZWxkOiBGaWVsZFNlbGVjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0aW9uOiBwYXJzZVNlbGVjdGlvblNldChpdGVtLnNlbGVjdGlvblNldCwgJycpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKHJldHVybkZpZWxkU2VsZWN0aW9uICE9PSAnJyAmJiBmaWVsZC5uYW1lID09PSByZXR1cm5GaWVsZFNlbGVjdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmllbGQuc2VsZWN0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaWVsZHMucHVzaChmaWVsZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNlbGVjdGlvblRvU3RyaW5nKHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHNlbGVjdGlvblxuICAgICAgICAuZmlsdGVyKHggPT4geC5uYW1lICE9PSAnX190eXBlbmFtZScpXG4gICAgICAgIC5tYXAoKGZpZWxkOiBGaWVsZFNlbGVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29uc3QgZmllbGRTZWxlY3Rpb24gPSBzZWxlY3Rpb25Ub1N0cmluZyhmaWVsZC5zZWxlY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIGAke2ZpZWxkLm5hbWV9JHtmaWVsZFNlbGVjdGlvbiAhPT0gJycgPyBgIHsgJHtmaWVsZFNlbGVjdGlvbn0gfWAgOiAnJ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdEZpZWxkcyhkb2M6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKTogYW55IHtcbiAgICBjb25zdCBzZWxlY3RlZDogYW55ID0ge307XG4gICAgaWYgKGRvYy5fa2V5KSB7XG4gICAgICAgIHNlbGVjdGVkLl9rZXkgPSBkb2MuX2tleTtcbiAgICAgICAgc2VsZWN0ZWQuaWQgPSBkb2MuX2tleTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBpdGVtIG9mIHNlbGVjdGlvbikge1xuICAgICAgICBjb25zdCBvbkZpZWxkID0ge1xuICAgICAgICAgICAgaW5fbWVzc2FnZTogJ2luX21zZycsXG4gICAgICAgICAgICBvdXRfbWVzc2FnZXM6ICdvdXRfbXNnJyxcbiAgICAgICAgICAgIHNpZ25hdHVyZXM6ICdpZCcsXG4gICAgICAgIH1baXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKG9uRmllbGQgIT09IHVuZGVmaW5lZCAmJiBkb2Nbb25GaWVsZF0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgc2VsZWN0ZWRbb25GaWVsZF0gPSBkb2Nbb25GaWVsZF07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbikgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbnR5cGUgRGF0YWJhc2VRdWVyeSA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG4gICAgb3JkZXJCeTogT3JkZXJCeVtdLFxuICAgIGxpbWl0OiBudW1iZXIsXG4gICAgdGltZW91dDogbnVtYmVyLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBwYXJhbXM6IHsgW3N0cmluZ106IGFueSB9LFxufVxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkxpc3RlbmVyIHtcbiAgICBjb2xsZWN0aW9uOiBDb2xsZWN0aW9uO1xuICAgIGlkOiA/bnVtYmVyO1xuICAgIGZpbHRlcjogYW55O1xuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXTtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xuICAgICAgICB0aGlzLmlkID0gY29sbGVjdGlvbi5saXN0ZW5lcnMuYWRkKHRoaXMpO1xuICAgICAgICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGNvbnN0IGlkID0gdGhpcy5pZDtcbiAgICAgICAgaWYgKGlkICE9PSBudWxsICYmIGlkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmxpc3RlbmVycy5yZW1vdmUoaWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgfVxuXG4gICAgZ2V0RXZlbnRDb3VudCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG59XG5cblxuZXhwb3J0IGNsYXNzIFdhaXRGb3JMaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkO1xuXG4gICAgY29uc3RydWN0b3IoY29sbGVjdGlvbjogQ29sbGVjdGlvbiwgcTogRGF0YWJhc2VRdWVyeSwgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIHEuZmlsdGVyLCBxLnNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZSA9IG9uSW5zZXJ0T3JVcGRhdGU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgIH1cbn1cblxuXG4vLyRGbG93Rml4TWVcbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb25MaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciBpbXBsZW1lbnRzIEFzeW5jSXRlcmF0b3I8YW55PiB7XG4gICAgZXZlbnRDb3VudDogbnVtYmVyO1xuICAgIHB1bGxRdWV1ZTogKCh2YWx1ZTogYW55KSA9PiB2b2lkKVtdO1xuICAgIHB1c2hRdWV1ZTogYW55W107XG4gICAgcnVubmluZzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbiwgZmlsdGVyLCBzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNRdWV1ZU92ZXJmbG93KCkgJiYgdGhpcy5jb2xsZWN0aW9uLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHRoaXMuZmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRDb3VudDtcbiAgICB9XG5cbiAgICBnZXRRdWV1ZVNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFF1ZXVlLmxlbmd0aCArIHRoaXMucHVsbFF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdXNoVmFsdWUodmFsdWU6IGFueSkge1xuICAgICAgICBjb25zdCBxdWV1ZVNpemUgPSB0aGlzLmdldFF1ZXVlU2l6ZSgpO1xuICAgICAgICBpZiAocXVldWVTaXplID4gdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSA9IHF1ZXVlU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgaWYgKHRoaXMucHVsbFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuc2hpZnQoKSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICA/IHsgdmFsdWUsIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgbmV4dCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnB1c2hRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgICAgICA/IHsgdmFsdWU6IHRoaXMucHVzaFF1ZXVlLnNoaWZ0KCksIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5wdXNoKHJlc29sdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXR1cm4oKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGFzeW5jIHRocm93KGVycm9yPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmVtcHR5UXVldWUoKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICB9XG5cbiAgICAvLyRGbG93Rml4TWVcbiAgICBbJCRhc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgYXN5bmMgZW1wdHlRdWV1ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmluZykge1xuICAgICAgICAgICAgdGhpcy5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5mb3JFYWNoKHJlc29sdmUgPT4gcmVzb2x2ZSh7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSkpO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlID0gW107XG4gICAgICAgIH1cbiAgICB9XG5cbn1cblxuZXhwb3J0IHR5cGUgUXVlcnlTdGF0ID0ge1xuICAgIGVzdGltYXRlZENvc3Q6IG51bWJlcixcbiAgICBzbG93OiBib29sZWFuLFxuICAgIHRpbWVzOiBudW1iZXJbXSxcbn1cblxuXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGRvY1R5cGU6IFFUeXBlO1xuXG4gICAgbG9nOiBRTG9nO1xuICAgIHRyYWNlcjogVHJhY2VyO1xuICAgIGRiOiBEYXRhYmFzZTtcbiAgICBzbG93RGI6IERhdGFiYXNlO1xuXG4gICAgbGlzdGVuZXJzOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+O1xuICAgIHF1ZXJ5U3RhdHM6IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD47XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICAgICAgc2xvd0RiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLmxvZyA9IGxvZ3MuY3JlYXRlKG5hbWUpO1xuICAgICAgICB0aGlzLnRyYWNlciA9IHRyYWNlcjtcbiAgICAgICAgdGhpcy5kYiA9IGRiO1xuICAgICAgICB0aGlzLnNsb3dEYiA9IHNsb3dEYjtcblxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+KGAke25hbWV9IGxpc3RlbmVyc2ApO1xuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMgPSBuZXcgTWFwPHN0cmluZywgUXVlcnlTdGF0PigpO1xuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGxpc3RlbmVyLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBTdWJzY3JpcHRpb25MaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgYXJncy5maWx0ZXIgfHwge30sXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0aW9uU2V0KGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgdGhpcy5uYW1lKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgKTogP0RhdGFiYXNlUXVlcnkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKGZpbHRlclNlY3Rpb24gPT09ICdGSUxURVIgZmFsc2UnKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZWxlY3Rpb24gPSBwYXJzZVNlbGVjdGlvblNldChzZWxlY3Rpb25JbmZvLCB0aGlzLm5hbWUpO1xuICAgICAgICBjb25zdCBvcmRlckJ5OiBPcmRlckJ5W10gPSBhcmdzLm9yZGVyQnkgfHwgW107XG4gICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICBjb25zdCB0aW1lb3V0ID0gTnVtYmVyKGFyZ3MudGltZW91dCkgfHwgMDtcbiAgICAgICAgY29uc3Qgb3JkZXJCeVRleHQgPSBvcmRlckJ5XG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5VGV4dCAhPT0gJycgPyBgU09SVCAke29yZGVyQnlUZXh0fWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRUZXh0ID0gTWF0aC5taW4obGltaXQsIDUwKTtcbiAgICAgICAgY29uc3QgbGltaXRTZWN0aW9uID0gYExJTUlUICR7bGltaXRUZXh0fWA7XG5cbiAgICAgICAgY29uc3QgdGV4dCA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uLFxuICAgICAgICAgICAgb3JkZXJCeSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdGltZW91dCxcbiAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtcy52YWx1ZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBhc3luYyBlbnN1cmVRdWVyeVN0YXQocTogRGF0YWJhc2VRdWVyeSk6IFByb21pc2U8UXVlcnlTdGF0PiB7XG4gICAgICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5xdWVyeVN0YXRzLmdldChxLnRleHQpO1xuICAgICAgICBpZiAoZXhpc3RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4aXN0aW5nO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBsYW4gPSAoYXdhaXQgdGhpcy5kYi5leHBsYWluKHEudGV4dCwgcS5wYXJhbXMpKS5wbGFuO1xuICAgICAgICBjb25zdCBzdGF0ID0ge1xuICAgICAgICAgICAgZXN0aW1hdGVkQ29zdDogcGxhbi5lc3RpbWF0ZWRDb3N0LFxuICAgICAgICAgICAgc2xvdzogZmFsc2UsXG4gICAgICAgICAgICB0aW1lczogW10sXG4gICAgICAgIH07XG4gICAgICAgIGlmIChwbGFuLm5vZGVzLmZpbmQobm9kZSA9PiBub2RlLnR5cGUgPT09ICdFbnVtZXJhdGVDb2xsZWN0aW9uTm9kZScpKSB7XG4gICAgICAgICAgICBzdGF0LnNsb3cgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucXVlcnlTdGF0cy5zZXQocS50ZXh0LCBzdGF0KTtcbiAgICAgICAgcmV0dXJuIHN0YXQ7XG4gICAgfVxuXG4gICAgcXVlcnlSZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIGFzeW5jIChwYXJlbnQ6IGFueSwgYXJnczogYW55LCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHQsIGluZm86IGFueSkgPT4gd3JhcCh0aGlzLmxvZywgJ1FVRVJZJywgYXJncywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgICAgIGNvbnN0IHEgPSB0aGlzLmNyZWF0ZURhdGFiYXNlUXVlcnkoYXJncywgaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0KTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gYXdhaXQgdGhpcy5lbnN1cmVRdWVyeVN0YXQocSk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBzdGF0LCBjb250ZXh0LnBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsIHN0YXQuc2xvdyA/ICdTTE9XJyA6ICdGQVNUJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBzZXRRdWVyeVRyYWNlUGFyYW1zKHE6IERhdGFiYXNlUXVlcnksIHNwYW46IFNwYW4pIHtcbiAgICAgICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgIH07XG4gICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICBwYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICBwYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgfVxuICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgcGFyYW1zKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBEYXRhYmFzZVF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQsIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBzdGF0LnNsb3cgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocS50ZXh0LCBxLnBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgc3RhdC50aW1lcy5wdXNoKERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgIGlmIChzdGF0LnRpbWVzLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICAgICAgc3RhdC50aW1lcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/V2FpdEZvckxpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlEYXRhYmFzZShxLCBzdGF0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbmV3IFdhaXRGb3JMaXN0ZW5lcih0aGlzLCBxLCAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvci5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG4iXX0=