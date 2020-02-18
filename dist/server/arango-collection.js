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
            delete _context17.t0.response;
            log.error('FAILED', op, args, _context17.t0.message || _context17.t0.ArangoError || _context17.t0.toString());
            throw _context17.t0.ArangoError || _context17.t0;

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
    key: "getAdditionalCondition",
    value: function getAdditionalCondition(accessRights, params) {
      var accounts = accessRights.restrictToAccounts;

      if (accounts.length === 0) {
        return '';
      }

      var condition = accounts.length === 1 ? "== @".concat(params.add(accounts[0])) : "IN [".concat(accounts.map(function (x) {
        return "@".concat(params.add(x));
      }).join(','), "]");

      switch (this.name) {
        case 'accounts':
          return "doc._key ".concat(condition);

        case 'transactions':
          return "doc.account_addr ".concat(condition);

        case 'messages':
          return "(doc.src ".concat(condition, ") OR (doc.dst ").concat(condition, ")");

        default:
          return 'false';
      }
    }
  }, {
    key: "createDatabaseQuery",
    value: function createDatabaseQuery(args, selectionInfo, accessRights) {
      var filter = args.filter || {};
      var params = new _qTypes.QParams();
      var primaryCondition = Object.keys(filter).length > 0 ? this.docType.ql(params, 'doc', filter) : '';
      var additionalCondition = this.getAdditionalCondition(accessRights, params);

      if (primaryCondition === 'false' || additionalCondition === 'false') {
        return null;
      }

      var condition = primaryCondition && additionalCondition ? "(".concat(primaryCondition, ") AND (").concat(additionalCondition, ")") : primaryCondition || additionalCondition;
      var filterSection = condition ? "FILTER ".concat(condition) : '';
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
                      var accessRights, q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee6$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

                            case 2:
                              accessRights = _context7.sent;
                              q = _this5.createDatabaseQuery(args, info.operation.selectionSet, accessRights);

                              if (q) {
                                _context7.next = 7;
                                break;
                              }

                              _this5.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);

                              return _context7.abrupt("return", []);

                            case 7:
                              _context7.next = 9;
                              return _this5.ensureQueryStat(q);

                            case 9:
                              stat = _context7.sent;
                              start = Date.now();

                              if (!(q.timeout > 0)) {
                                _context7.next = 17;
                                break;
                              }

                              _context7.next = 14;
                              return _this5.queryWaitFor(q, stat, context.parentSpan);

                            case 14:
                              _context7.t0 = _context7.sent;
                              _context7.next = 20;
                              break;

                            case 17:
                              _context7.next = 19;
                              return _this5.query(q, stat, context.parentSpan);

                            case 19:
                              _context7.t0 = _context7.sent;

                            case 20:
                              result = _context7.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST', context.remoteAddress);

                              return _context7.abrupt("return", result);

                            case 23:
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJyZXNwb25zZSIsImVycm9yIiwibWVzc2FnZSIsIkFyYW5nb0Vycm9yIiwidG9TdHJpbmciLCJSZWdpc3RyeU1hcCIsIm5hbWUiLCJsYXN0SWQiLCJpdGVtcyIsIk1hcCIsIml0ZW0iLCJpZCIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJoYXMiLCJzZXQiLCJjb25zb2xlIiwiZW50cmllcyIsInZhbHVlcyIsInBhcnNlU2VsZWN0aW9uU2V0Iiwic2VsZWN0aW9uU2V0IiwicmV0dXJuRmllbGRTZWxlY3Rpb24iLCJmaWVsZHMiLCJzZWxlY3Rpb25zIiwidmFsdWUiLCJmaWVsZCIsInNlbGVjdGlvbiIsInB1c2giLCJzZWxlY3Rpb25Ub1N0cmluZyIsImZpbHRlciIsIngiLCJtYXAiLCJmaWVsZFNlbGVjdGlvbiIsImpvaW4iLCJzZWxlY3RGaWVsZHMiLCJkb2MiLCJzZWxlY3RlZCIsIl9rZXkiLCJvbkZpZWxkIiwiaW5fbWVzc2FnZSIsIm91dF9tZXNzYWdlcyIsInNpZ25hdHVyZXMiLCJ1bmRlZmluZWQiLCJsZW5ndGgiLCJDb2xsZWN0aW9uTGlzdGVuZXIiLCJjb2xsZWN0aW9uIiwibGlzdGVuZXJzIiwiYWRkIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsInJlbW92ZSIsIldhaXRGb3JMaXN0ZW5lciIsInEiLCJvbkluc2VydE9yVXBkYXRlIiwiU3Vic2NyaXB0aW9uTGlzdGVuZXIiLCJldmVudENvdW50IiwicHVsbFF1ZXVlIiwicHVzaFF1ZXVlIiwicnVubmluZyIsImlzUXVldWVPdmVyZmxvdyIsImRvY1R5cGUiLCJ0ZXN0IiwicHVzaFZhbHVlIiwiZ2V0UXVldWVTaXplIiwicXVldWVTaXplIiwibWF4UXVldWVTaXplIiwic2hpZnQiLCJkb25lIiwiUHJvbWlzZSIsInJlc29sdmUiLCJjbG9zZSIsImVtcHR5UXVldWUiLCJyZWplY3QiLCIkJGFzeW5jSXRlcmF0b3IiLCJmb3JFYWNoIiwiQ29sbGVjdGlvbiIsImxvZ3MiLCJ0cmFjZXIiLCJkYiIsInNsb3dEYiIsImNyZWF0ZSIsInF1ZXJ5U3RhdHMiLCJsaXN0ZW5lciIsIm9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZSIsInN1YnNjcmliZSIsIl8iLCJfY29udGV4dCIsImluZm8iLCJyZXN1bHQiLCJvcGVyYXRpb24iLCJhY2Nlc3NSaWdodHMiLCJwYXJhbXMiLCJhY2NvdW50cyIsInJlc3RyaWN0VG9BY2NvdW50cyIsImNvbmRpdGlvbiIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwiZmlsdGVyU2VjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJvcmRlckJ5VGV4dCIsImRpcmVjdGlvbiIsInRvTG93ZXJDYXNlIiwicGF0aCIsInJlcGxhY2UiLCJzb3J0U2VjdGlvbiIsImxpbWl0VGV4dCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJ0ZXh0IiwiZXhpc3RpbmciLCJnZXQiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJwYXJlbnQiLCJjb250ZXh0IiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYWNjZXNzS2V5IiwiY3JlYXRlRGF0YWJhc2VRdWVyeSIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsImVuc3VyZVF1ZXJ5U3RhdCIsInN0YXJ0IiwicXVlcnlXYWl0Rm9yIiwicGFyZW50U3BhbiIsInF1ZXJ5IiwiUVRyYWNlciIsInRyYWNlIiwic3BhbiIsInNldFF1ZXJ5VHJhY2VQYXJhbXMiLCJxdWVyeURhdGFiYXNlIiwiY3Vyc29yIiwiYWxsIiwid2FpdEZvciIsImZvcmNlVGltZXJJZCIsInJlc29sdmVkQnkiLCJvblF1ZXJ5IiwiY2hlY2siLCJ0aGVuIiwiZG9jcyIsInNldFRpbWVvdXQiLCJvbkNoYW5nZXNGZWVkIiwib25UaW1lb3V0IiwicmFjZSIsInNldFRhZyIsImNsZWFyVGltZW91dCIsImtleSIsImRiQ29sbGVjdGlvbiIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUE1QkE7Ozs7Ozs7Ozs7Ozs7OztTQStDc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1CQUVjQSxLQUFLLEVBRm5COztBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBSUMsbUJBQU8sY0FBSUMsUUFBWDtBQUNBSixZQUFBQSxHQUFHLENBQUNLLEtBQUosQ0FBVSxRQUFWLEVBQW9CSixFQUFwQixFQUF3QkMsSUFBeEIsRUFBOEIsY0FBSUksT0FBSixJQUFlLGNBQUlDLFdBQW5CLElBQWtDLGNBQUlDLFFBQUosRUFBaEU7QUFMRCxrQkFNTyxjQUFJRCxXQUFKLGlCQU5QOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7SUFVREUsVzs7O0FBS0YsdUJBQVlDLElBQVosRUFBMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUN0QixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsQ0FBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDSDs7Ozt3QkFFR0MsSSxFQUFpQjtBQUNqQixVQUFJQyxFQUFFLEdBQUcsS0FBS0osTUFBZDs7QUFDQSxTQUFHO0FBQ0NJLFFBQUFBLEVBQUUsR0FBR0EsRUFB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Q0FBQyxDQUFDb0QsT0FBRixDQUFVOUQsTUFBVixHQUFtQixDQUF2QixFQUEwQjtBQUN0QmlELFFBQUFBLE1BQU0sQ0FBQ2EsT0FBUCxHQUFpQnBELENBQUMsQ0FBQ29ELE9BQW5CO0FBQ0g7O0FBQ0QsVUFBSXBELENBQUMsQ0FBQ3FELEtBQUYsS0FBWSxFQUFoQixFQUFvQjtBQUNoQmQsUUFBQUEsTUFBTSxDQUFDYyxLQUFQLEdBQWVyRCxDQUFDLENBQUNxRCxLQUFqQjtBQUNIOztBQUNELFVBQUlyRCxDQUFDLENBQUNzRCxPQUFGLEdBQVksQ0FBaEIsRUFBbUI7QUFDZmYsUUFBQUEsTUFBTSxDQUFDZSxPQUFQLEdBQWlCdEQsQ0FBQyxDQUFDc0QsT0FBbkI7QUFDSDs7QUFDRHVDLE1BQUFBLElBQUksQ0FBQ2dCLE1BQUwsQ0FBWSxRQUFaLEVBQXNCdEUsTUFBdEI7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDIwIFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IHsgJCRhc3luY0l0ZXJhdG9yIH0gZnJvbSAnaXRlcmFsbCc7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL3EtYXV0aFwiO1xuaW1wb3J0IFFBdXRoIGZyb20gXCIuL3EtYXV0aFwiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmV4cG9ydCB0eXBlIEdyYXBoUUxSZXF1ZXN0Q29udGV4dCA9IHtcbiAgICBjb25maWc6IFFDb25maWcsXG4gICAgYXV0aDogUUF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGRlbGV0ZSBlcnIucmVzcG9uc2U7XG4gICAgICAgIGxvZy5lcnJvcignRkFJTEVEJywgb3AsIGFyZ3MsIGVyci5tZXNzYWdlIHx8IGVyci5BcmFuZ29FcnJvciB8fCBlcnIudG9TdHJpbmcoKSk7XG4gICAgICAgIHRocm93IGVyci5BcmFuZ29FcnJvciB8fCBlcnI7XG4gICAgfVxufVxuXG5jbGFzcyBSZWdpc3RyeU1hcDxUPiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGl0ZW1zOiBNYXA8bnVtYmVyLCBUPjtcbiAgICBsYXN0SWQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmxhc3RJZCA9IDA7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgYWRkKGl0ZW06IFQpOiBudW1iZXIge1xuICAgICAgICBsZXQgaWQgPSB0aGlzLmxhc3RJZDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgaWQgPSBpZCA8IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSID8gaWQgKyAxIDogMTtcbiAgICAgICAgfSB3aGlsZSAodGhpcy5pdGVtcy5oYXMoaWQpKTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSBpZDtcbiAgICAgICAgdGhpcy5pdGVtcy5zZXQoaWQsIGl0ZW0pO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgJHt0aGlzLm5hbWV9OiBpdGVtIHdpdGggaWQgWyR7aWR9XSBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVudHJpZXMoKTogW251bWJlciwgVF1bXSB7XG4gICAgICAgIHJldHVybiBbLi4udGhpcy5pdGVtcy5lbnRyaWVzKCldO1xuICAgIH1cblxuICAgIHZhbHVlcygpOiBUW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbn1cblxuZXhwb3J0IHR5cGUgRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbn1cblxuZnVuY3Rpb24gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uU2V0OiBhbnksIHJldHVybkZpZWxkU2VsZWN0aW9uOiBzdHJpbmcpOiBGaWVsZFNlbGVjdGlvbltdIHtcbiAgICBjb25zdCBmaWVsZHM6IEZpZWxkU2VsZWN0aW9uW10gPSBbXTtcbiAgICBjb25zdCBzZWxlY3Rpb25zID0gc2VsZWN0aW9uU2V0ICYmIHNlbGVjdGlvblNldC5zZWxlY3Rpb25zO1xuICAgIGlmIChzZWxlY3Rpb25zKSB7XG4gICAgICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gKGl0ZW0ubmFtZSAmJiBpdGVtLm5hbWUudmFsdWUpIHx8ICcnO1xuICAgICAgICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWVsZDogRmllbGRTZWxlY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdGlvbjogcGFyc2VTZWxlY3Rpb25TZXQoaXRlbS5zZWxlY3Rpb25TZXQsICcnKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmIChyZXR1cm5GaWVsZFNlbGVjdGlvbiAhPT0gJycgJiYgZmllbGQubmFtZSA9PT0gcmV0dXJuRmllbGRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZpZWxkLnNlbGVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZWxlY3Rpb25Ub1N0cmluZyhzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pOiBzdHJpbmcge1xuICAgIHJldHVybiBzZWxlY3Rpb25cbiAgICAgICAgLmZpbHRlcih4ID0+IHgubmFtZSAhPT0gJ19fdHlwZW5hbWUnKVxuICAgICAgICAubWFwKChmaWVsZDogRmllbGRTZWxlY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZpZWxkU2VsZWN0aW9uID0gc2VsZWN0aW9uVG9TdHJpbmcoZmllbGQuc2VsZWN0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiBgJHtmaWVsZC5uYW1lfSR7ZmllbGRTZWxlY3Rpb24gIT09ICcnID8gYCB7ICR7ZmllbGRTZWxlY3Rpb259IH1gIDogJyd9YDtcbiAgICAgICAgfSkuam9pbignICcpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgICAgIHNlbGVjdGVkLmlkID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3Qgb25GaWVsZCA9IHtcbiAgICAgICAgICAgIGluX21lc3NhZ2U6ICdpbl9tc2cnLFxuICAgICAgICAgICAgb3V0X21lc3NhZ2VzOiAnb3V0X21zZycsXG4gICAgICAgICAgICBzaWduYXR1cmVzOiAnaWQnLFxuICAgICAgICB9W2l0ZW0ubmFtZV07XG4gICAgICAgIGlmIChvbkZpZWxkICE9PSB1bmRlZmluZWQgJiYgZG9jW29uRmllbGRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW29uRmllbGRdID0gZG9jW29uRmllbGRdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZG9jW2l0ZW0ubmFtZV07XG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzZWxlY3RlZFtpdGVtLm5hbWVdID0gaXRlbS5zZWxlY3Rpb24ubGVuZ3RoID4gMCA/IHNlbGVjdEZpZWxkcyh2YWx1ZSwgaXRlbS5zZWxlY3Rpb24pIDogdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG50eXBlIERhdGFiYXNlUXVlcnkgPSB7XG4gICAgZmlsdGVyOiBhbnksXG4gICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgIG9yZGVyQnk6IE9yZGVyQnlbXSxcbiAgICBsaW1pdDogbnVtYmVyLFxuICAgIHRpbWVvdXQ6IG51bWJlcixcbiAgICB0ZXh0OiBzdHJpbmcsXG4gICAgcGFyYW1zOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbjogQ29sbGVjdGlvbjtcbiAgICBpZDogP251bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIGNsb3NlKCkge1xuICAgICAgICBjb25zdCBpZCA9IHRoaXMuaWQ7XG4gICAgICAgIGlmIChpZCAhPT0gbnVsbCAmJiBpZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5saXN0ZW5lcnMucmVtb3ZlKGlkKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIHE6IERhdGFiYXNlUXVlcnksIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBxLmZpbHRlciwgcS5zZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUgPSBvbkluc2VydE9yVXBkYXRlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICB0aGlzLm9uSW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICB9XG59XG5cblxuLy8kRmxvd0ZpeE1lXG5leHBvcnQgY2xhc3MgU3Vic2NyaXB0aW9uTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIgaW1wbGVtZW50cyBBc3luY0l0ZXJhdG9yPGFueT4ge1xuICAgIGV2ZW50Q291bnQ6IG51bWJlcjtcbiAgICBwdWxsUXVldWU6ICgodmFsdWU6IGFueSkgPT4gdm9pZClbXTtcbiAgICBwdXNoUXVldWU6IGFueVtdO1xuICAgIHJ1bm5pbmc6IGJvb2xlYW47XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb24sIGZpbHRlciwgc2VsZWN0aW9uKTtcbiAgICAgICAgdGhpcy5ldmVudENvdW50ID0gMDtcbiAgICAgICAgdGhpcy5wdWxsUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgdGhpcy5ydW5uaW5nID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUXVldWVPdmVyZmxvdygpICYmIHRoaXMuY29sbGVjdGlvbi5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCB0aGlzLmZpbHRlcikpIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFZhbHVlKHsgW3RoaXMuY29sbGVjdGlvbi5uYW1lXTogc2VsZWN0RmllbGRzKGRvYywgdGhpcy5zZWxlY3Rpb24pIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNRdWV1ZU92ZXJmbG93KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRRdWV1ZVNpemUoKSA+PSAxMDtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmV2ZW50Q291bnQ7XG4gICAgfVxuXG4gICAgZ2V0UXVldWVTaXplKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnB1c2hRdWV1ZS5sZW5ndGggKyB0aGlzLnB1bGxRdWV1ZS5sZW5ndGg7XG4gICAgfVxuXG4gICAgcHVzaFZhbHVlKHZhbHVlOiBhbnkpIHtcbiAgICAgICAgY29uc3QgcXVldWVTaXplID0gdGhpcy5nZXRRdWV1ZVNpemUoKTtcbiAgICAgICAgaWYgKHF1ZXVlU2l6ZSA+IHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5tYXhRdWV1ZVNpemUgPSBxdWV1ZVNpemU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ldmVudENvdW50ICs9IDE7XG4gICAgICAgIGlmICh0aGlzLnB1bGxRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnNoaWZ0KCkodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgPyB7IHZhbHVlLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZS5wdXNoKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIG5leHQoKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5wdXNoUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICAgICAgPyB7IHZhbHVlOiB0aGlzLnB1c2hRdWV1ZS5zaGlmdCgpLCBkb25lOiBmYWxzZSB9XG4gICAgICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUucHVzaChyZXNvbHZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmV0dXJuKCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfTtcbiAgICB9XG5cbiAgICBhc3luYyB0aHJvdyhlcnJvcj86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgLy8kRmxvd0ZpeE1lXG4gICAgWyQkYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFzeW5jIGVtcHR5UXVldWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuZm9yRWFjaChyZXNvbHZlID0+IHJlc29sdmUoeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBlc3RpbWF0ZWRDb3N0OiBudW1iZXIsXG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG5cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kb2NUeXBlLnRlc3QobnVsbCwgZG9jLCBsaXN0ZW5lci5maWx0ZXIpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBfY29udGV4dDogYW55LCBpbmZvOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdmYWxzZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDAgPyB0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKSA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbmRpdGlvbiA9IChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgYXN5bmMgZW5zdXJlUXVlcnlTdGF0KHE6IERhdGFiYXNlUXVlcnkpOiBQcm9taXNlPFF1ZXJ5U3RhdD4ge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHRoaXMucXVlcnlTdGF0cy5nZXQocS50ZXh0KTtcbiAgICAgICAgaWYgKGV4aXN0aW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBleGlzdGluZztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwbGFuID0gKGF3YWl0IHRoaXMuZGIuZXhwbGFpbihxLnRleHQsIHEucGFyYW1zKSkucGxhbjtcbiAgICAgICAgY29uc3Qgc3RhdCA9IHtcbiAgICAgICAgICAgIGVzdGltYXRlZENvc3Q6IHBsYW4uZXN0aW1hdGVkQ29zdCxcbiAgICAgICAgICAgIHNsb3c6IGZhbHNlLFxuICAgICAgICAgICAgdGltZXM6IFtdLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocGxhbi5ub2Rlcy5maW5kKG5vZGUgPT4gbm9kZS50eXBlID09PSAnRW51bWVyYXRlQ29sbGVjdGlvbk5vZGUnKSkge1xuICAgICAgICAgICAgc3RhdC5zbG93ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXJ5U3RhdHMuc2V0KHEudGV4dCwgc3RhdCk7XG4gICAgICAgIHJldHVybiBzdGF0O1xuICAgIH1cblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0LCBpbmZvOiBhbnkpID0+IHdyYXAodGhpcy5sb2csICdRVUVSWScsIGFyZ3MsIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleSk7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5jcmVhdGVEYXRhYmFzZVF1ZXJ5KGFyZ3MsIGluZm8ub3BlcmF0aW9uLnNlbGVjdGlvblNldCwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgICAgIGlmICghcSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9nLmRlYnVnKCdRVUVSWScsIGFyZ3MsIDAsICdTS0lQUEVEJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBzdGF0ID0gYXdhaXQgdGhpcy5lbnN1cmVRdWVyeVN0YXQocSk7XG4gICAgICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBxLnRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgPyBhd2FpdCB0aGlzLnF1ZXJ5V2FpdEZvcihxLCBzdGF0LCBjb250ZXh0LnBhcmVudFNwYW4pXG4gICAgICAgICAgICAgICAgOiBhd2FpdCB0aGlzLnF1ZXJ5KHEsIHN0YXQsIGNvbnRleHQucGFyZW50U3Bhbik7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDAsIHN0YXQuc2xvdyA/ICdTTE9XJyA6ICdGQVNUJywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBzZXRRdWVyeVRyYWNlUGFyYW1zKHE6IERhdGFiYXNlUXVlcnksIHNwYW46IFNwYW4pIHtcbiAgICAgICAgY29uc3QgcGFyYW1zOiBhbnkgPSB7XG4gICAgICAgICAgICBmaWx0ZXI6IHEuZmlsdGVyLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb25Ub1N0cmluZyhxLnNlbGVjdGlvbiksXG4gICAgICAgIH07XG4gICAgICAgIGlmIChxLm9yZGVyQnkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcGFyYW1zLm9yZGVyQnkgPSBxLm9yZGVyQnk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHEubGltaXQgIT09IDUwKSB7XG4gICAgICAgICAgICBwYXJhbXMubGltaXQgPSBxLmxpbWl0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChxLnRpbWVvdXQgPiAwKSB7XG4gICAgICAgICAgICBwYXJhbXMudGltZW91dCA9IHEudGltZW91dDtcbiAgICAgICAgfVxuICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgcGFyYW1zKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeShxOiBEYXRhYmFzZVF1ZXJ5LCBzdGF0OiBRdWVyeVN0YXQsIHBhcmVudFNwYW4/OiAoU3BhbiB8IFNwYW5Db250ZXh0KSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRoaXMudHJhY2VyLCBgJHt0aGlzLm5hbWV9LnF1ZXJ5YCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCk7XG4gICAgICAgIH0sIHBhcmVudFNwYW4pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5RGF0YWJhc2UocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgZGIgPSBzdGF0LnNsb3cgPyB0aGlzLnNsb3dEYiA6IHRoaXMuZGI7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgZGIucXVlcnkocS50ZXh0LCBxLnBhcmFtcyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgc3RhdC50aW1lcy5wdXNoKERhdGUubm93KCkgLSBzdGFydCk7XG4gICAgICAgIGlmIChzdGF0LnRpbWVzLmxlbmd0aCA+IDEwMCkge1xuICAgICAgICAgICAgc3RhdC50aW1lcy5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG5cbiAgICBhc3luYyBxdWVyeVdhaXRGb3IocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS53YWl0Rm9yYCwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgICAgIENvbGxlY3Rpb24uc2V0UXVlcnlUcmFjZVBhcmFtcyhxLCBzcGFuKTtcbiAgICAgICAgICAgIGxldCB3YWl0Rm9yOiA/V2FpdEZvckxpc3RlbmVyID0gbnVsbDtcbiAgICAgICAgICAgIGxldCBmb3JjZVRpbWVySWQ6ID9UaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgbGV0IHJlc29sdmVkQnk6ID9zdHJpbmcgPSBudWxsO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvblF1ZXJ5ID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjaGVjayA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlEYXRhYmFzZShxLCBzdGF0KS50aGVuKChkb2NzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2NzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3F1ZXJ5JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZG9jcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBzZXRUaW1lb3V0KGNoZWNrLCA1XzAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBjaGVjaygpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uQ2hhbmdlc0ZlZWQgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3YWl0Rm9yID0gbmV3IFdhaXRGb3JMaXN0ZW5lcih0aGlzLCBxLCAoZG9jKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ2xpc3RlbmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtkb2NdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlZEJ5ID0gJ3RpbWVvdXQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCBxLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgICAgIG9uUXVlcnksXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlc0ZlZWQsXG4gICAgICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICBzcGFuLnNldFRhZygncmVzb2x2ZWQnLCByZXNvbHZlZEJ5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgICAgICBpZiAod2FpdEZvciAhPT0gbnVsbCAmJiB3YWl0Rm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvci5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoZm9yY2VUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgcGFyZW50U3Bhbik7XG4gICAgfVxuXG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG4iXX0=