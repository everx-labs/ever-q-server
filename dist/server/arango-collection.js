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
                this.collection.listeners.remove(this.id);
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
                this.collection.listeners.remove(this.id);
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
  function Collection(name, docType, logs, changeLog, tracer, db) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "listeners", void 0);
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.listeners = new RegistryMap("".concat(name, " listeners"));
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
    key: "queryResolver",
    value: function queryResolver() {
      var _this5 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee6(parent, args, context, info) {
            return _regenerator["default"].wrap(function _callee6$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    return _context7.abrupt("return", wrap(_this5.log, 'QUERY', args,
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
                              q = _this5.genQuery(filter, orderBy, limit);
                              _context6.next = 7;
                              return _this5.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 7:
                              span = _context6.sent;
                              _context6.prev = 8;
                              start = Date.now();

                              if (!(timeout > 0)) {
                                _context6.next = 16;
                                break;
                              }

                              _context6.next = 13;
                              return _this5.queryWaitFor(q, filter, parseSelectionSet(info.operation.selectionSet, _this5.name), timeout);

                            case 13:
                              _context6.t0 = _context6.sent;
                              _context6.next = 19;
                              break;

                            case 16:
                              _context6.next = 18;
                              return _this5.query(q);

                            case 18:
                              _context6.t0 = _context6.sent;

                            case 19:
                              result = _context6.t0;

                              _this5.log.debug('QUERY', args, (Date.now() - start) / 1000);

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

          return function (_x6, _x7, _x8, _x9) {
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

      function query(_x10) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee8(q, filter, selection, timeout) {
        var _this6 = this;

        var waitFor, forceTimerId, onQuery, onChangesFeed, onTimeout;
        return _regenerator["default"].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                waitFor = null;
                forceTimerId = null;
                _context9.prev = 2;
                onQuery = new Promise(function (resolve, reject) {
                  var check = function check() {
                    _this6.query(q).then(function (docs) {
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
                _context9.next = 8;
                return Promise.race([onQuery, onChangesFeed, onTimeout]);

              case 8:
                return _context9.abrupt("return", _context9.sent);

              case 9:
                _context9.prev = 9;

                if (waitFor !== null && waitFor !== undefined) {
                  this.listeners.remove(waitFor.id);
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

      function queryWaitFor(_x11, _x12, _x13, _x14) {
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
        var _this7 = this;

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
                          return _context10.abrupt("return", _this7.dbCollection().document(key, true));

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

      function fetchDocByKey(_x15) {
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
        var _this8 = this;

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
                  return _this8.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee11);
      }));

      function fetchDocsByKeys(_x16) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIlJlZ2lzdHJ5TWFwIiwibmFtZSIsImxhc3RJZCIsIml0ZW1zIiwiTWFwIiwiaXRlbSIsImlkIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImhhcyIsInNldCIsImNvbnNvbGUiLCJlbnRyaWVzIiwidmFsdWVzIiwicGFyc2VTZWxlY3Rpb25TZXQiLCJzZWxlY3Rpb25TZXQiLCJyZXR1cm5GaWVsZFNlbGVjdGlvbiIsImZpZWxkcyIsInNlbGVjdGlvbnMiLCJ2YWx1ZSIsImZpZWxkIiwic2VsZWN0aW9uIiwicHVzaCIsInNlbGVjdEZpZWxkcyIsImRvYyIsInNlbGVjdGVkIiwiX2tleSIsInVuZGVmaW5lZCIsImxlbmd0aCIsIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb24iLCJmaWx0ZXIiLCJsaXN0ZW5lcnMiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwiV2FpdEZvckxpc3RlbmVyIiwib25JbnNlcnRPclVwZGF0ZSIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZXZlbnRDb3VudCIsInB1bGxRdWV1ZSIsInB1c2hRdWV1ZSIsInJ1bm5pbmciLCJpc1F1ZXVlT3ZlcmZsb3ciLCJkb2NUeXBlIiwidGVzdCIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInF1ZXVlU2l6ZSIsIm1heFF1ZXVlU2l6ZSIsInNoaWZ0IiwiZG9uZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVtb3ZlIiwiZW1wdHlRdWV1ZSIsInJlamVjdCIsIiQkYXN5bmNJdGVyYXRvciIsImZvckVhY2giLCJDb2xsZWN0aW9uIiwibG9ncyIsImNoYW5nZUxvZyIsInRyYWNlciIsImRiIiwiY3JlYXRlIiwibGlzdGVuZXIiLCJvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUiLCJzdWJzY3JpYmUiLCJfIiwiX2NvbnRleHQiLCJpbmZvIiwib3BlcmF0aW9uIiwicGFyZW50IiwiY29udGV4dCIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJxIiwiZ2VuUXVlcnkiLCJzdGFydFNwYW5Mb2ciLCJzcGFuIiwic3RhcnQiLCJxdWVyeVdhaXRGb3IiLCJxdWVyeSIsInJlc3VsdCIsImRlYnVnIiwiZmluaXNoIiwiY3Vyc29yIiwiYWxsIiwid2FpdEZvciIsImZvcmNlVGltZXJJZCIsIm9uUXVlcnkiLCJjaGVjayIsInRoZW4iLCJkb2NzIiwic2V0VGltZW91dCIsIm9uQ2hhbmdlc0ZlZWQiLCJvblRpbWVvdXQiLCJyYWNlIiwiY2xlYXJUaW1lb3V0IiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwicWwiLCJvcmRlckJ5UWwiLCJtYXAiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwiam9pbiIsInNvcnRTZWN0aW9uIiwibGltaXRRbCIsIk1hdGgiLCJtaW4iLCJsaW1pdFNlY3Rpb24iLCJiaW5kVmFycyIsImtleSIsImRiQ29sbGVjdGlvbiIsImRvY3VtZW50IiwiZmV0Y2hEb2NCeUtleSIsIkNoYW5nZUxvZyIsImVuYWJsZWQiLCJyZWNvcmRzIiwiY2xlYXIiLCJ0aW1lIiwiZXhpc3RpbmciLCJnZXQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCQTs7QUFDQTs7QUFDQTs7QUFHQTs7QUFDQTs7QUF4QkE7Ozs7Ozs7Ozs7Ozs7OztTQW9Dc0JBLEk7Ozs7Ozs7K0JBQWYsbUJBQXVCQyxHQUF2QixFQUFrQ0MsRUFBbEMsRUFBOENDLElBQTlDLEVBQXlEQyxLQUF6RDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUJBRWNBLEtBQUssRUFGbkI7O0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFJ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QixDQUFqQjs7QUFDQSxVQUFJMkgsUUFBSixFQUFjO0FBQ1ZBLFFBQUFBLFFBQVEsQ0FBQzNHLElBQVQsQ0FBYzBHLElBQWQ7QUFDSCxPQUZELE1BRU87QUFDSCxhQUFLRixPQUFMLENBQWFwSCxHQUFiLENBQWlCSixFQUFqQixFQUFxQixDQUFDMEgsSUFBRCxDQUFyQjtBQUNIO0FBQ0o7Ozt3QkFFRzFILEUsRUFBc0I7QUFDdEIsYUFBTyxLQUFLd0gsT0FBTCxDQUFhSSxHQUFiLENBQWlCNUgsRUFBakIsS0FBd0IsRUFBL0I7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOC0yMDE5IFRPTiBERVYgU09MVVRJT05TIExURC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgU09GVFdBUkUgRVZBTFVBVElPTiBMaWNlbnNlICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdCB1c2VcbiAqIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiAgWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZVxuICogTGljZW5zZSBhdDpcbiAqXG4gKiBodHRwOi8vd3d3LnRvbi5kZXYvbGljZW5zZXNcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIFRPTiBERVYgc29mdHdhcmUgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLy8gQGZsb3dcblxuaW1wb3J0IHsgJCRhc3luY0l0ZXJhdG9yIH0gZnJvbSAnaXRlcmFsbCc7XG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgUUxvZ3MgZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRTG9nIH0gZnJvbSBcIi4vbG9nc1wiO1xuaW1wb3J0IHR5cGUgeyBRVHlwZSB9IGZyb20gXCIuL3EtdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBUcmFjZXIgfSBmcm9tIFwiLi90cmFjZXJcIjtcblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxudHlwZSBRdWVyeSA9IHtcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIGJpbmRWYXJzOiB7IFtzdHJpbmddOiBhbnkgfSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0ge1xuICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgfTtcbiAgICAgICAgbG9nLmVycm9yKCdGQUlMRUQnLCBvcCwgYXJncywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cblxuY2xhc3MgUmVnaXN0cnlNYXA8VD4ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpdGVtczogTWFwPG51bWJlciwgVD47XG4gICAgbGFzdElkOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5sYXN0SWQgPSAwO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGFkZChpdGVtOiBUKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkID0gdGhpcy5sYXN0SWQ7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIGlkID0gaWQgPCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA/IGlkICsgMSA6IDE7XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuaXRlbXMuaGFzKGlkKSk7XG4gICAgICAgIHRoaXMubGFzdElkID0gaWQ7XG4gICAgICAgIHRoaXMuaXRlbXMuc2V0KGlkLCBpdGVtKTtcbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH1cblxuICAgIHJlbW92ZShpZDogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcy5kZWxldGUoaWQpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gcmVtb3ZlICR7dGhpcy5uYW1lfTogaXRlbSB3aXRoIGlkIFske2lkfV0gZG9lcyBub3QgZXhpc3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbnRyaWVzKCk6IFtudW1iZXIsIFRdW10ge1xuICAgICAgICByZXR1cm4gWy4uLnRoaXMuaXRlbXMuZW50cmllcygpXTtcbiAgICB9XG5cbiAgICB2YWx1ZXMoKTogVFtdIHtcbiAgICAgICAgcmV0dXJuIFsuLi50aGlzLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG59XG5cbmV4cG9ydCB0eXBlIEZpZWxkU2VsZWN0aW9uID0ge1xuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sXG59XG5cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0aW9uU2V0KHNlbGVjdGlvblNldDogYW55LCByZXR1cm5GaWVsZFNlbGVjdGlvbjogc3RyaW5nKTogRmllbGRTZWxlY3Rpb25bXSB7XG4gICAgY29uc3QgZmllbGRzOiBGaWVsZFNlbGVjdGlvbltdID0gW107XG4gICAgY29uc3Qgc2VsZWN0aW9ucyA9IHNlbGVjdGlvblNldCAmJiBzZWxlY3Rpb25TZXQuc2VsZWN0aW9ucztcbiAgICBpZiAoc2VsZWN0aW9ucykge1xuICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2Ygc2VsZWN0aW9ucykge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IChpdGVtLm5hbWUgJiYgaXRlbS5uYW1lLnZhbHVlKSB8fCAnJztcbiAgICAgICAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmllbGQ6IEZpZWxkU2VsZWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgICAgICAgICBzZWxlY3Rpb246IHBhcnNlU2VsZWN0aW9uU2V0KGl0ZW0uc2VsZWN0aW9uU2V0LCAnJyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAocmV0dXJuRmllbGRTZWxlY3Rpb24gIT09ICcnICYmIGZpZWxkLm5hbWUgPT09IHJldHVybkZpZWxkU2VsZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmaWVsZC5zZWxlY3Rpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpZWxkcy5wdXNoKGZpZWxkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmllbGRzO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RGaWVsZHMoZG9jOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSk6IGFueSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQ6IGFueSA9IHt9O1xuICAgIGlmIChkb2MuX2tleSkge1xuICAgICAgICBzZWxlY3RlZC5fa2V5ID0gZG9jLl9rZXk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgaXRlbSBvZiBzZWxlY3Rpb24pIHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBkb2NbaXRlbS5uYW1lXTtcbiAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNlbGVjdGVkW2l0ZW0ubmFtZV0gPSBpdGVtLnNlbGVjdGlvbi5sZW5ndGggPiAwID8gc2VsZWN0RmllbGRzKHZhbHVlLCBpdGVtLnNlbGVjdGlvbikgOiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIGNvbGxlY3Rpb246IENvbGxlY3Rpb247XG4gICAgaWQ6IG51bWJlcjtcbiAgICBmaWx0ZXI6IGFueTtcbiAgICBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW107XG4gICAgc3RhcnRUaW1lOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihjb2xsZWN0aW9uOiBDb2xsZWN0aW9uLCBmaWx0ZXI6IGFueSwgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdKSB7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG4gICAgICAgIHRoaXMuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IHNlbGVjdGlvbjtcbiAgICAgICAgdGhpcy5pZCA9IGNvbGxlY3Rpb24ubGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBjbGFzcyBXYWl0Rm9yTGlzdGVuZXIgZXh0ZW5kcyBDb2xsZWN0aW9uTGlzdGVuZXIge1xuICAgIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZDtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10sIG9uSW5zZXJ0T3JVcGRhdGU6IChkb2M6IGFueSkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcihjb2xsZWN0aW9uLCBmaWx0ZXIsIHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZSA9IG9uSW5zZXJ0T3JVcGRhdGU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgIH1cbn1cblxuXG4vLyRGbG93Rml4TWVcbmV4cG9ydCBjbGFzcyBTdWJzY3JpcHRpb25MaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciBpbXBsZW1lbnRzIEFzeW5jSXRlcmF0b3I8YW55PiB7XG4gICAgZXZlbnRDb3VudDogbnVtYmVyO1xuICAgIHB1bGxRdWV1ZTogKCh2YWx1ZTogYW55KSA9PiB2b2lkKVtdO1xuICAgIHB1c2hRdWV1ZTogYW55W107XG4gICAgcnVubmluZzogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKGNvbGxlY3Rpb246IENvbGxlY3Rpb24sIGZpbHRlcjogYW55LCBzZWxlY3Rpb246IEZpZWxkU2VsZWN0aW9uW10pIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbiwgZmlsdGVyLCBzZWxlY3Rpb24pO1xuICAgICAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBpZiAoIXRoaXMuaXNRdWV1ZU92ZXJmbG93KCkgJiYgdGhpcy5jb2xsZWN0aW9uLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHRoaXMuZmlsdGVyKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uLm5hbWVdOiBzZWxlY3RGaWVsZHMoZG9jLCB0aGlzLnNlbGVjdGlvbikgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1F1ZXVlT3ZlcmZsb3coKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFF1ZXVlU2l6ZSgpID49IDEwO1xuICAgIH1cblxuICAgIGdldEV2ZW50Q291bnQoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXZlbnRDb3VudDtcbiAgICB9XG5cbiAgICBnZXRRdWV1ZVNpemUoKTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFF1ZXVlLmxlbmd0aCArIHRoaXMucHVsbFF1ZXVlLmxlbmd0aDtcbiAgICB9XG5cbiAgICBwdXNoVmFsdWUodmFsdWU6IGFueSkge1xuICAgICAgICBjb25zdCBxdWV1ZVNpemUgPSB0aGlzLmdldFF1ZXVlU2l6ZSgpO1xuICAgICAgICBpZiAocXVldWVTaXplID4gdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm1heFF1ZXVlU2l6ZSA9IHF1ZXVlU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV2ZW50Q291bnQgKz0gMTtcbiAgICAgICAgaWYgKHRoaXMucHVsbFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuc2hpZnQoKSh0aGlzLnJ1bm5pbmdcbiAgICAgICAgICAgICAgICA/IHsgdmFsdWUsIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHVzaFF1ZXVlLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYXN5bmMgbmV4dCgpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnB1c2hRdWV1ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgICAgICA/IHsgdmFsdWU6IHRoaXMucHVzaFF1ZXVlLnNoaWZ0KCksIGRvbmU6IGZhbHNlIH1cbiAgICAgICAgICAgICAgICAgICAgOiB7IHZhbHVlOiB1bmRlZmluZWQsIGRvbmU6IHRydWUgfSxcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5wdXNoKHJlc29sdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBhc3luYyByZXR1cm4oKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgdGhpcy5jb2xsZWN0aW9uLmxpc3RlbmVycy5yZW1vdmUodGhpcy5pZCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgfVxuXG4gICAgYXN5bmMgdGhyb3coZXJyb3I/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24ubGlzdGVuZXJzLnJlbW92ZSh0aGlzLmlkKTtcbiAgICAgICAgYXdhaXQgdGhpcy5lbXB0eVF1ZXVlKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgfVxuXG4gICAgLy8kRmxvd0ZpeE1lXG4gICAgWyQkYXN5bmNJdGVyYXRvcl0oKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGFzeW5jIGVtcHR5UXVldWUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmcpIHtcbiAgICAgICAgICAgIHRoaXMucnVubmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5wdWxsUXVldWUuZm9yRWFjaChyZXNvbHZlID0+IHJlc29sdmUoeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgICAgICB0aGlzLnB1c2hRdWV1ZSA9IFtdO1xuICAgICAgICB9XG4gICAgfVxuXG59XG5cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBsaXN0ZW5lcnM6IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj47XG5cbiAgICBtYXhRdWV1ZVNpemU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBuYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsb2dzOiBRTG9ncyxcbiAgICAgICAgY2hhbmdlTG9nOiBDaGFuZ2VMb2csXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBjaGFuZ2VMb2c7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcblxuICAgICAgICB0aGlzLm1heFF1ZXVlU2l6ZSA9IDA7XG4gICAgfVxuXG4gICAgLy8gU3Vic2NyaXB0aW9uc1xuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGxpc3RlbmVyLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5vbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiAoXzogYW55LCBhcmdzOiB7IGZpbHRlcjogYW55IH0sIF9jb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MuZmlsdGVyIHx8IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBRdWVyaWVzXG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IGFueSwgaW5mbzogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgICAgIGNvbnN0IG9yZGVyQnk6IE9yZGVyQnlbXSA9IGFyZ3Mub3JkZXJCeSB8fCBbXTtcbiAgICAgICAgICAgIGNvbnN0IGxpbWl0OiBudW1iZXIgPSBhcmdzLmxpbWl0IHx8IDUwO1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IChOdW1iZXIoYXJncy50aW1lb3V0KSB8fCAwKSAqIDEwMDA7XG4gICAgICAgICAgICBjb25zdCBxID0gdGhpcy5nZW5RdWVyeShmaWx0ZXIsIG9yZGVyQnksIGxpbWl0KTtcblxuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhjb250ZXh0LCAnYXJhbmdvLmpzOmZldGNoRG9jcycsICduZXcgcXVlcnknLCBhcmdzKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHRpbWVvdXQgPiAwXG4gICAgICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgZmlsdGVyLCBwYXJzZVNlbGVjdGlvblNldChpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIHRoaXMubmFtZSksIHRpbWVvdXQpXG4gICAgICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxKTtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAoRGF0ZS5ub3coKSAtIHN0YXJ0KSAvIDEwMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNwYW4uZmluaXNoKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHF1ZXJ5KHE6IFF1ZXJ5KTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgY29uc3QgY3Vyc29yID0gYXdhaXQgdGhpcy5kYi5xdWVyeShxKTtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICB9XG5cblxuICAgIGFzeW5jIHF1ZXJ5V2FpdEZvcihxOiBRdWVyeSwgZmlsdGVyOiBhbnksIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSwgdGltZW91dDogbnVtYmVyKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgbGV0IHdhaXRGb3I6ID9XYWl0Rm9yTGlzdGVuZXIgPSBudWxsO1xuICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG9uUXVlcnkgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnkocSkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkb2NzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCByZWplY3QpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qgb25DaGFuZ2VzRmVlZCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgd2FpdEZvciA9IG5ldyBXYWl0Rm9yTGlzdGVuZXIodGhpcywgZmlsdGVyLCBzZWxlY3Rpb24sIChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShbZG9jXSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc3Qgb25UaW1lb3V0ID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoW10pLCB0aW1lb3V0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICAgICAgICAgICAgb25RdWVyeSxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgIG9uVGltZW91dCxcbiAgICAgICAgICAgIF0pO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMucmVtb3ZlKHdhaXRGb3IuaWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZvcmNlVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChmb3JjZVRpbWVySWQpO1xuICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgZ2VuUXVlcnkoZmlsdGVyOiBhbnksIG9yZGVyQnk6IE9yZGVyQnlbXSwgbGltaXQ6IG51bWJlcik6IFF1ZXJ5IHtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3Qgb3JkZXJCeVFsID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVFsICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeVFsfWAgOiAnJztcbiAgICAgICAgY29uc3QgbGltaXRRbCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0UWx9YDtcblxuICAgICAgICBjb25zdCBxdWVyeSA9IGBcbiAgICAgICAgICAgIEZPUiBkb2MgSU4gJHt0aGlzLm5hbWV9XG4gICAgICAgICAgICAke2ZpbHRlclNlY3Rpb259XG4gICAgICAgICAgICAke3NvcnRTZWN0aW9ufVxuICAgICAgICAgICAgJHtsaW1pdFNlY3Rpb259XG4gICAgICAgICAgICBSRVRVUk4gZG9jYDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgICAgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXNcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlTG9nIHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHJlY29yZHM6IE1hcDxzdHJpbmcsIG51bWJlcltdPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvcmRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBsb2coaWQ6IHN0cmluZywgdGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5wdXNoKHRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRzLnNldChpZCwgW3RpbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldChpZDogc3RyaW5nKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRzLmdldChpZCkgfHwgW107XG4gICAgfVxufVxuIl19