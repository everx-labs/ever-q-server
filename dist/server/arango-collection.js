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
                      var q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return context.auth.requireGrantedAccess(context.authToken || args.auth);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdGlvblRvU3RyaW5nIiwiZmlsdGVyIiwieCIsIm1hcCIsImZpZWxkU2VsZWN0aW9uIiwiam9pbiIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsIm9uRmllbGQiLCJpbl9tZXNzYWdlIiwib3V0X21lc3NhZ2VzIiwic2lnbmF0dXJlcyIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwicmVtb3ZlIiwiV2FpdEZvckxpc3RlbmVyIiwicSIsIm9uSW5zZXJ0T3JVcGRhdGUiLCJTdWJzY3JpcHRpb25MaXN0ZW5lciIsImV2ZW50Q291bnQiLCJwdWxsUXVldWUiLCJwdXNoUXVldWUiLCJydW5uaW5nIiwiaXNRdWV1ZU92ZXJmbG93IiwiZG9jVHlwZSIsInRlc3QiLCJwdXNoVmFsdWUiLCJnZXRRdWV1ZVNpemUiLCJxdWV1ZVNpemUiLCJtYXhRdWV1ZVNpemUiLCJzaGlmdCIsImRvbmUiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNsb3NlIiwiZW1wdHlRdWV1ZSIsInJlamVjdCIsIiQkYXN5bmNJdGVyYXRvciIsImZvckVhY2giLCJDb2xsZWN0aW9uIiwibG9ncyIsInRyYWNlciIsImRiIiwic2xvd0RiIiwiY3JlYXRlIiwicXVlcnlTdGF0cyIsImxpc3RlbmVyIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwic3Vic2NyaWJlIiwiXyIsIl9jb250ZXh0IiwiaW5mbyIsInJlc3VsdCIsIm9wZXJhdGlvbiIsInNlbGVjdGlvbkluZm8iLCJwYXJhbXMiLCJRUGFyYW1zIiwiZmlsdGVyU2VjdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJvcmRlckJ5VGV4dCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJ0ZXh0IiwiZXhpc3RpbmciLCJnZXQiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0IiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYXV0aFRva2VuIiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsImVuc3VyZVF1ZXJ5U3RhdCIsInN0YXJ0IiwicXVlcnlXYWl0Rm9yIiwicGFyZW50U3BhbiIsInF1ZXJ5IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFF1ZXJ5VHJhY2VQYXJhbXMiLCJxdWVyeURhdGFiYXNlIiwiY3Vyc29yIiwiYWxsIiwid2FpdEZvciIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJvblF1ZXJ5IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0IiwicmFjZSIsInNldFRhZyIsImNsZWFyVGltZW91dCIsImtleSIsImRiQ29sbGVjdGlvbiIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUFFQTs7QUFDQTs7QUEzQkE7Ozs7Ozs7Ozs7Ozs7OztTQThDc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJT0MsWUFBQUEsS0FKUCxHQUllO0FBQ1ZDLGNBQUFBLE9BQU8sRUFBRSxjQUFJQSxPQUFKLElBQWUsY0FBSUMsV0FBbkIsSUFBa0MsY0FBSUMsUUFBSixFQURqQztBQUVWQyxjQUFBQSxJQUFJLEVBQUUsY0FBSUE7QUFGQSxhQUpmO0FBUUNSLFlBQUFBLEdBQUcsQ0FBQ0ksS0FBSixDQUFVLFFBQVYsRUFBb0JILEVBQXBCLEVBQXdCQyxJQUF4QixFQUE4QkUsS0FBSyxDQUFDQyxPQUFwQztBQVJELGtCQVNPRCxLQVRQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFhREssVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDSDs7Ozt3QkFFR0MsSSxFQUFpQjtBQUNqQixVQUFJQyxFQUFFLEdBQUcsS0FBS0osTUFBZDs7QUFDQSxTQUFHO0FBQ0NJLFFBQUFBLEVBQUUsR0FBR0EsRUFBRSxHQUFHQyxNQUFNLENBQUNDLGdCQUFaLEdBQStCRixFQUFFLEdBQUcsQ0FBcEMsR0FBd0MsQ0FB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MkIsQ0FBQyxDQUFDNkMsT0FBRixDQUFVdkQsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN0QmlELFFBQUFBLE1BQU0sQ0FBQ00sT0FBUCxHQUFpQjdDLENBQUMsQ0FBQzZDLE9BQW5CO0FBQ0g7O0FBQ0QsVUFBSTdDLENBQUMsQ0FBQzhDLEtBQUYsS0FBWSxFQUFoQixFQUFvQjtBQUNoQlAsUUFBQUEsTUFBTSxDQUFDTyxLQUFQLEdBQWU5QyxDQUFDLENBQUM4QyxLQUFqQjtBQUNIOztBQUNELFVBQUk5QyxDQUFDLENBQUMrQyxPQUFGLEdBQVksQ0FBaEIsRUFBbUI7QUFDZlIsUUFBQUEsTUFBTSxDQUFDUSxPQUFQLEdBQWlCL0MsQ0FBQyxDQUFDK0MsT0FBbkI7QUFDSDs7QUFDRHVDLE1BQUFBLElBQUksQ0FBQ2dCLE1BQUwsQ0FBWSxRQUFaLEVBQXNCL0QsTUFBdEI7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IHsgJCRhc3luY0l0ZXJhdG9yIH0gZnJvbSAnaXRlcmFsbCc7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgUUF1dGggZnJvbSBcIi4vcS1hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgUVBhcmFtcyB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxuZXhwb3J0IHR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0ID0ge1xuICAgIGNvbmZpZzogUUNvbmZpZyxcbiAgICBhdXRoOiBRQXV0aCxcbiAgICB0cmFjZXI6IFRyYWNlcixcblxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgYXV0aFRva2VuOiBzdHJpbmcsXG4gICAgcGFyZW50U3BhbjogKFNwYW4gfCBTcGFuQ29udGV4dCB8IHR5cGVvZiB1bmRlZmluZWQpLFxuXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG50eXBlIE9yZGVyQnkgPSB7XG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGRpcmVjdGlvbjogc3RyaW5nLFxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JhcDxSPihsb2c6IFFMb2csIG9wOiBzdHJpbmcsIGFyZ3M6IGFueSwgZmV0Y2g6ICgpID0+IFByb21pc2U8Uj4pIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgZmV0Y2goKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSB7XG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSB8fCBlcnIuQXJhbmdvRXJyb3IgfHwgZXJyLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBjb2RlOiBlcnIuY29kZVxuICAgICAgICB9O1xuICAgICAgICBsb2cuZXJyb3IoJ0ZBSUxFRCcsIG9wLCBhcmdzLCBlcnJvci5tZXNzYWdlKTtcbiAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3Qgb25GaWVsZCA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6ICdpbl9tc2cnLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiAnb3V0X21zZycsXG4gICAgICAgICAgICBzaWduYXR1cmVzOiAnaWQnLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChvbkZpZWxkICE9PSB1bmRlZmluZWQgJiYgZG9jW29uRmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW29uRmllbGRdID0gZG9jW29uRmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMCA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG50eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjtcbiAgICBpZDogP251bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCAmJiBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5saXN0ZW5lcnMucmVtb3ZlKGlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIHE6IERhdGFiYXNlUXVlcnksIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBxLmZpbHRlciwgcS5zZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUgPSBvbkluc2VydE9yVXBkYXRlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICB9XG59XG5cblxuLy8kRmxvd0ZpeE1lXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIgaW1wbGVtZW50cyBBc3luY0l0ZXJhdG9yPGFueT4ge1xuICAgIGV2ZW50Q291bnQ6IG51bWJlcjtcbiAgICBwdWxsUXVldWU6ICgodmFsdWU6IGFueSkgPT4gdm9pZClbXTtcbiAgICBwdXNoUXVldWU6IGFueVtdO1xuICAgIHJ1bm5pbmc6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIGZpbHRlciwgc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5ldmVudENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFZhbHVlKHsgW3RoaXMuY29sbGVjdGlvbi5uYW1lXTogc2VsZWN0RmllbGRzKGRvYywgdGhpcy5zZWxlY3Rpb24pIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNRdWV1ZU92ZXJmbG93KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRRdWV1ZVNpemUoKSA+PSAxMDtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Q291bnQ7XG4gICAgfVxuXG4gICAgZ2V0UXVldWVTaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hRdWV1ZS5sZW5ndGggKyB0aGlzLnB1bGxRdWV1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVzaFZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgY29uc3QgcXVldWVTaXplID0gdGhpcy5nZXRRdWV1ZVNpemUoKTtcbiAgICAgICAgaWYgKHF1ZXVlU2l6ZSA+IHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUgPSBxdWV1ZVNpemU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudENvdW50ICs9IDE7XG4gICAgICAgIGlmICh0aGlzLnB1bGxRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnNoaWZ0KCkodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgPyB7IHZhbHVlLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIG5leHQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wdXNoUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICAgICAgPyB7IHZhbHVlOiB0aGlzLnB1c2hRdWV1ZS5zaGlmdCgpLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUucHVzaChyZXNvbHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmV0dXJuKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBhc3luYyB0aHJvdyhlcnJvcj86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgLy8kRmxvd0ZpeE1lXG4gICAgWyQkYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFzeW5jIGVtcHR5UXVldWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuZm9yRWFjaChyZXNvbHZlID0+IHJlc29sdmUoeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBlc3RpbWF0ZWRDb3N0OiBudW1iZXIsXG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG5cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBsaXN0ZW5lci5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBfY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgY3JlYXRlRGF0YWJhc2VRdWVyeShcbiAgICAgICAgYXJnczoge1xuICAgICAgICAgICAgZmlsdGVyPzogYW55LFxuICAgICAgICAgICAgb3JkZXJCeT86IE9yZGVyQnlbXSxcbiAgICAgICAgICAgIGxpbWl0PzogbnVtYmVyLFxuICAgICAgICAgICAgdGltZW91dD86IG51bWJlcixcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0aW9uSW5mbzogYW55LFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDBcbiAgICAgICAgICAgID8gYEZJTFRFUiAke3RoaXMuZG9jVHlwZS5xbChwYXJhbXMsICdkb2MnLCBmaWx0ZXIpfWBcbiAgICAgICAgICAgIDogJyc7XG4gICAgICAgIGlmIChmaWx0ZXJTZWN0aW9uID09PSAnRklMVEVSIGZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgZW5zdXJlUXVlcnlTdGF0KHE6IERhdGFiYXNlUXVlcnkpOiBQcm9taXNlPFF1ZXJ5U3RhdD4ge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucXVlcnlTdGF0cy5nZXQocS50ZXh0KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFuID0gKGF3YWl0IHRoaXMuZGIuZXhwbGFpbihxLnRleHQsIHEucGFyYW1zKSkucGxhbjtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IHBsYW4uZXN0aW1hdGVkQ29zdCxcbiAgICAgICAgICAgIHNsb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGxhbi5ub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS50eXBlID09PSAnRW51bWVyYXRlQ29sbGVjdGlvbk5vZGUnKSkge1xuICAgICAgICAgICAgc3RhdC5zbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEudGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBpbmZvOiBhbnkpID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmF1dGhUb2tlbiB8fCBhcmdzLmF1dGgpO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQpO1xuICAgICAgICAgICAgaWYgKCFxKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgMCwgJ1NLSVBQRUQnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHN0YXQgPSBhd2FpdCB0aGlzLmVuc3VyZVF1ZXJ5U3RhdChxKTtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHEudGltZW91dCA+IDBcbiAgICAgICAgICAgICAgICA/IGF3YWl0IHRoaXMucXVlcnlXYWl0Rm9yKHEsIHN0YXQsIGNvbnRleHQucGFyZW50U3BhbilcbiAgICAgICAgICAgICAgICA6IGF3YWl0IHRoaXMucXVlcnkocSwgc3RhdCwgY29udGV4dC5wYXJlbnRTcGFuKTtcbiAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIChEYXRlLm5vdygpIC0gc3RhcnQpIC8gMTAwMCwgc3RhdC5zbG93ID8gJ1NMT1cnIDogJ0ZBU1QnLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHNldFF1ZXJ5VHJhY2VQYXJhbXMocTogRGF0YWJhc2VRdWVyeSwgc3BhbjogU3Bhbikge1xuICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IHtcbiAgICAgICAgICAgIGZpbHRlcjogcS5maWx0ZXIsXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvblRvU3RyaW5nKHEuc2VsZWN0aW9uKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHEub3JkZXJCeS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBwYXJhbXMub3JkZXJCeSA9IHEub3JkZXJCeTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocS5saW1pdCAhPT0gNTApIHtcbiAgICAgICAgICAgIHBhcmFtcy5saW1pdCA9IHEubGltaXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHEudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgIHBhcmFtcy50aW1lb3V0ID0gcS50aW1lb3V0O1xuICAgICAgICB9XG4gICAgICAgIHNwYW4uc2V0VGFnKCdwYXJhbXMnLCBwYXJhbXMpO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KHE6IERhdGFiYXNlUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCwgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ucXVlcnknYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBzdGF0LnNsb3cgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocS50ZXh0LCBxLnBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgc3RhdC50aW1lcy5wdXNoKERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgIGlmIChzdGF0LnRpbWVzLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICAgICAgc3RhdC50aW1lcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yJ2AsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uLnNldFF1ZXJ5VHJhY2VQYXJhbXMocSwgc3Bhbik7XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogP1dhaXRGb3JMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG5ldyBXYWl0Rm9yTGlzdGVuZXIodGhpcywgcSwgKGRvYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoZm9yY2VUaW1lcklkKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuXG4gICAgZGJDb2xsZWN0aW9uKCk6IERvY3VtZW50Q29sbGVjdGlvbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLmNvbGxlY3Rpb24odGhpcy5uYW1lKTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY0J5S2V5KGtleTogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdyYXAodGhpcy5sb2csICdGRVRDSF9ET0NfQllfS0VZJywga2V5LCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kYkNvbGxlY3Rpb24oKS5kb2N1bWVudChrZXksIHRydWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyBmZXRjaERvY3NCeUtleXMoa2V5czogc3RyaW5nW10pOiBQcm9taXNlPGFueVtdPiB7XG4gICAgICAgIGlmICgha2V5cyB8fCBrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleXMubWFwKGtleSA9PiB0aGlzLmZldGNoRG9jQnlLZXkoa2V5KSkpO1xuICAgIH1cbn1cblxuIl19