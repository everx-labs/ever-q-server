"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SubscriptionListener = exports.WaitForListener = exports.CollectionListener = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _iterall = require("iterall");

var _utils = require("./utils");

var CollectionListener =
/*#__PURE__*/
function () {
  function CollectionListener(collectionName, docType, listeners, accessRights, filter, selection) {
    (0, _classCallCheck2["default"])(this, CollectionListener);
    (0, _defineProperty2["default"])(this, "collectionName", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "listeners", void 0);
    (0, _defineProperty2["default"])(this, "id", void 0);
    (0, _defineProperty2["default"])(this, "filter", void 0);
    (0, _defineProperty2["default"])(this, "authFilter", void 0);
    (0, _defineProperty2["default"])(this, "selection", void 0);
    (0, _defineProperty2["default"])(this, "startTime", void 0);
    this.collectionName = collectionName;
    this.docType = docType;
    this.listeners = listeners;
    this.authFilter = CollectionListener.getAuthFilter(collectionName, accessRights);
    this.filter = filter;
    this.selection = selection;
    this.id = listeners.add(this);
    this.startTime = Date.now();
  }

  (0, _createClass2["default"])(CollectionListener, [{
    key: "close",
    value: function close() {
      var id = this.id;

      if (id !== null && id !== undefined) {
        this.id = null;
        this.listeners.remove(id);
      }
    }
  }, {
    key: "isFiltered",
    value: function isFiltered(doc) {
      if (this.authFilter && !this.authFilter(doc)) {
        return false;
      }

      return this.docType.test(null, doc, this.filter);
    }
  }, {
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {}
  }, {
    key: "getEventCount",
    value: function getEventCount() {
      return 0;
    }
  }], [{
    key: "getAuthFilter",
    value: function getAuthFilter(collectionName, accessRights) {
      if (accessRights.restrictToAccounts.length === 0) {
        return null;
      }

      var accounts = new Set(accessRights.restrictToAccounts);

      switch (collectionName) {
        case 'accounts':
          return function (doc) {
            return accounts.has(doc._key);
          };

        case 'transactions':
          return function (doc) {
            return accounts.has(doc.account_addr);
          };

        case 'messages':
          return function (doc) {
            return accounts.has(doc.src) || accounts.has(doc.dst);
          };

        default:
          return function (_) {
            return false;
          };
      }
    }
  }]);
  return CollectionListener;
}();

exports.CollectionListener = CollectionListener;

var WaitForListener =
/*#__PURE__*/
function (_CollectionListener) {
  (0, _inherits2["default"])(WaitForListener, _CollectionListener);

  function WaitForListener(collectionName, docType, listeners, accessRights, filter, selection, onInsertOrUpdate) {
    var _this;

    (0, _classCallCheck2["default"])(this, WaitForListener);
    _this = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(WaitForListener).call(this, collectionName, docType, listeners, accessRights, filter, selection));
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
}(CollectionListener);

exports.WaitForListener = WaitForListener;

var SubscriptionListener =
/*#__PURE__*/
function (_CollectionListener2) {
  (0, _inherits2["default"])(SubscriptionListener, _CollectionListener2);

  function SubscriptionListener(collectionName, docType, listeners, accessRights, filter, selection) {
    var _this2;

    (0, _classCallCheck2["default"])(this, SubscriptionListener);
    _this2 = (0, _possibleConstructorReturn2["default"])(this, (0, _getPrototypeOf2["default"])(SubscriptionListener).call(this, collectionName, docType, listeners, accessRights, filter, selection));
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
      if (!this.isQueueOverflow()) {
        this.pushValue((0, _defineProperty2["default"])({}, this.collectionName, (0, _utils.selectFields)(doc, this.selection)));
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

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve) {
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
                return _context.stop();
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
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.close();
                _context2.next = 3;
                return this.emptyQueue();

              case 3:
                return _context2.abrupt("return", {
                  value: undefined,
                  done: true
                });

              case 4:
              case "end":
                return _context2.stop();
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
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.close();
                _context3.next = 3;
                return this.emptyQueue();

              case 3:
                return _context3.abrupt("return", Promise.reject(error));

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _throw(_x) {
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
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
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
                return _context4.stop();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tbGlzdGVuZXJzLmpzIl0sIm5hbWVzIjpbIkNvbGxlY3Rpb25MaXN0ZW5lciIsImNvbGxlY3Rpb25OYW1lIiwiZG9jVHlwZSIsImxpc3RlbmVycyIsImFjY2Vzc1JpZ2h0cyIsImZpbHRlciIsInNlbGVjdGlvbiIsImF1dGhGaWx0ZXIiLCJnZXRBdXRoRmlsdGVyIiwiaWQiLCJhZGQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwidW5kZWZpbmVkIiwicmVtb3ZlIiwiZG9jIiwidGVzdCIsInJlc3RyaWN0VG9BY2NvdW50cyIsImxlbmd0aCIsImFjY291bnRzIiwiU2V0IiwiaGFzIiwiX2tleSIsImFjY291bnRfYWRkciIsInNyYyIsImRzdCIsIl8iLCJXYWl0Rm9yTGlzdGVuZXIiLCJvbkluc2VydE9yVXBkYXRlIiwiU3Vic2NyaXB0aW9uTGlzdGVuZXIiLCJldmVudENvdW50IiwicHVsbFF1ZXVlIiwicHVzaFF1ZXVlIiwicnVubmluZyIsImlzUXVldWVPdmVyZmxvdyIsInB1c2hWYWx1ZSIsImdldFF1ZXVlU2l6ZSIsInZhbHVlIiwic2hpZnQiLCJkb25lIiwicHVzaCIsIlByb21pc2UiLCJyZXNvbHZlIiwiY2xvc2UiLCJlbXB0eVF1ZXVlIiwiZXJyb3IiLCJyZWplY3QiLCIkJGFzeW5jSXRlcmF0b3IiLCJmb3JFYWNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFJQTs7SUFFYUEsa0I7OztBQVVULDhCQUNJQyxjQURKLEVBRUlDLE9BRkosRUFHSUMsU0FISixFQUlJQyxZQUpKLEVBS0lDLE1BTEosRUFNSUMsU0FOSixFQU9FO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0UsU0FBS0wsY0FBTCxHQUFzQkEsY0FBdEI7QUFDQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxTQUFMLEdBQWlCQSxTQUFqQjtBQUNBLFNB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cG9ydCB7ICQkYXN5bmNJdGVyYXRvciB9IGZyb20gXCJpdGVyYWxsXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHR5cGUgeyBGaWVsZFNlbGVjdGlvbiB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBSZWdpc3RyeU1hcCwgc2VsZWN0RmllbGRzIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgY29sbGVjdGlvbk5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcbiAgICBsaXN0ZW5lcnM6IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj47XG4gICAgaWQ6ID9udW1iZXI7XG4gICAgZmlsdGVyOiBhbnk7XG4gICAgYXV0aEZpbHRlcjogPygoZG9jOiBhbnkpID0+IGJvb2xlYW4pO1xuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXTtcbiAgICBzdGFydFRpbWU6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICBjb2xsZWN0aW9uTmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbGlzdGVuZXJzOiBSZWdpc3RyeU1hcDxDb2xsZWN0aW9uTGlzdGVuZXI+LFxuICAgICAgICBhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cyxcbiAgICAgICAgZmlsdGVyOiBhbnksXG4gICAgICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXVxuICAgICkge1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb25OYW1lID0gY29sbGVjdGlvbk5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gbGlzdGVuZXJzO1xuICAgICAgICB0aGlzLmF1dGhGaWx0ZXIgPSBDb2xsZWN0aW9uTGlzdGVuZXIuZ2V0QXV0aEZpbHRlcihjb2xsZWN0aW9uTmFtZSwgYWNjZXNzUmlnaHRzKTtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIHRoaXMuc2VsZWN0aW9uID0gc2VsZWN0aW9uO1xuICAgICAgICB0aGlzLmlkID0gbGlzdGVuZXJzLmFkZCh0aGlzKTtcbiAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRBdXRoRmlsdGVyKGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzKTogPygoZG9jOiBhbnkpID0+IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGFjY2Vzc1JpZ2h0cy5yZXN0cmljdFRvQWNjb3VudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhY2NvdW50cyA9IG5ldyBTZXQoYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cyk7XG4gICAgICAgIHN3aXRjaCAoY29sbGVjdGlvbk5hbWUpIHtcbiAgICAgICAgY2FzZSAnYWNjb3VudHMnOlxuICAgICAgICAgICAgcmV0dXJuIChkb2MpID0+IGFjY291bnRzLmhhcyhkb2MuX2tleSk7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gKGRvYykgPT4gYWNjb3VudHMuaGFzKGRvYy5hY2NvdW50X2FkZHIpO1xuICAgICAgICBjYXNlICdtZXNzYWdlcyc6XG4gICAgICAgICAgICByZXR1cm4gKGRvYykgPT4gYWNjb3VudHMuaGFzKGRvYy5zcmMpIHx8IGFjY291bnRzLmhhcyhkb2MuZHN0KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAoXykgPT4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLmlkO1xuICAgICAgICBpZiAoaWQgIT09IG51bGwgJiYgaWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5yZW1vdmUoaWQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaXNGaWx0ZXJlZChkb2M6IGFueSk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAodGhpcy5hdXRoRmlsdGVyICYmICF0aGlzLmF1dGhGaWx0ZXIoZG9jKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIHRoaXMuZmlsdGVyKTtcbiAgICB9XG5cbiAgICBvbkRvY3VtZW50SW5zZXJ0T3JVcGRhdGUoZG9jOiBhbnkpIHtcbiAgICB9XG5cbiAgICBnZXRFdmVudENvdW50KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFdhaXRGb3JMaXN0ZW5lciBleHRlbmRzIENvbGxlY3Rpb25MaXN0ZW5lciB7XG4gICAgb25JbnNlcnRPclVwZGF0ZTogKGRvYzogYW55KSA9PiB2b2lkO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsaXN0ZW5lcnM6IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj4sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdLFxuICAgICAgICBvbkluc2VydE9yVXBkYXRlOiAoZG9jOiBhbnkpID0+IHZvaWRcbiAgICApIHtcbiAgICAgICAgc3VwZXIoY29sbGVjdGlvbk5hbWUsIGRvY1R5cGUsIGxpc3RlbmVycywgYWNjZXNzUmlnaHRzLCBmaWx0ZXIsIHNlbGVjdGlvbik7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZSA9IG9uSW5zZXJ0T3JVcGRhdGU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIHRoaXMub25JbnNlcnRPclVwZGF0ZShkb2MpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN1YnNjcmlwdGlvbkxpc3RlbmVyIGV4dGVuZHMgQ29sbGVjdGlvbkxpc3RlbmVyIGltcGxlbWVudHMgQXN5bmNJdGVyYXRvcjxhbnk+IHtcbiAgICBldmVudENvdW50OiBudW1iZXI7XG4gICAgcHVsbFF1ZXVlOiAoKHZhbHVlOiBhbnkpID0+IHZvaWQpW107XG4gICAgcHVzaFF1ZXVlOiBhbnlbXTtcbiAgICBydW5uaW5nOiBib29sZWFuO1xuXG4gICAgY29uc3RydWN0b3IoXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lOiBzdHJpbmcsXG4gICAgICAgIGRvY1R5cGU6IFFUeXBlLFxuICAgICAgICBsaXN0ZW5lcnM6IFJlZ2lzdHJ5TWFwPENvbGxlY3Rpb25MaXN0ZW5lcj4sXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICAgICBmaWx0ZXI6IGFueSxcbiAgICAgICAgc2VsZWN0aW9uOiBGaWVsZFNlbGVjdGlvbltdXG4gICAgKSB7XG4gICAgICAgIHN1cGVyKGNvbGxlY3Rpb25OYW1lLCBkb2NUeXBlLCBsaXN0ZW5lcnMsIGFjY2Vzc1JpZ2h0cywgZmlsdGVyLCBzZWxlY3Rpb24pO1xuXG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCA9IDA7XG4gICAgICAgIHRoaXMucHVsbFF1ZXVlID0gW107XG4gICAgICAgIHRoaXMucHVzaFF1ZXVlID0gW107XG4gICAgICAgIHRoaXMucnVubmluZyA9IHRydWU7XG4gICAgfVxuXG4gICAgb25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYzogYW55KSB7XG4gICAgICAgIGlmICghdGhpcy5pc1F1ZXVlT3ZlcmZsb3coKSkge1xuICAgICAgICAgICAgdGhpcy5wdXNoVmFsdWUoeyBbdGhpcy5jb2xsZWN0aW9uTmFtZV06IHNlbGVjdEZpZWxkcyhkb2MsIHRoaXMuc2VsZWN0aW9uKSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzUXVldWVPdmVyZmxvdygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UXVldWVTaXplKCkgPj0gMTA7XG4gICAgfVxuXG4gICAgZ2V0RXZlbnRDb3VudCgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5ldmVudENvdW50O1xuICAgIH1cblxuICAgIGdldFF1ZXVlU2l6ZSgpOiBudW1iZXIge1xuICAgICAgICByZXR1cm4gdGhpcy5wdXNoUXVldWUubGVuZ3RoICsgdGhpcy5wdWxsUXVldWUubGVuZ3RoO1xuICAgIH1cblxuICAgIHB1c2hWYWx1ZSh2YWx1ZTogYW55KSB7XG4gICAgICAgIHRoaXMuZXZlbnRDb3VudCArPSAxO1xuICAgICAgICBpZiAodGhpcy5wdWxsUXVldWUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZS5zaGlmdCgpKHRoaXMucnVubmluZ1xuICAgICAgICAgICAgICAgID8geyB2YWx1ZSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgIDogeyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH0sXG4gICAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUucHVzaCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBuZXh0KCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucHVzaFF1ZXVlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUodGhpcy5ydW5uaW5nXG4gICAgICAgICAgICAgICAgICAgID8geyB2YWx1ZTogdGhpcy5wdXNoUXVldWUuc2hpZnQoKSwgZG9uZTogZmFsc2UgfVxuICAgICAgICAgICAgICAgICAgICA6IHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9LFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLnB1c2gocmVzb2x2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIHJldHVybigpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XG4gICAgfVxuXG4gICAgYXN5bmMgdGhyb3coZXJyb3I/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuZW1wdHlRdWV1ZSgpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgIH1cblxuICAgIC8vJEZsb3dGaXhNZVxuICAgIFskJGFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhc3luYyBlbXB0eVF1ZXVlKCkge1xuICAgICAgICBpZiAodGhpcy5ydW5uaW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHVsbFF1ZXVlLmZvckVhY2gocmVzb2x2ZSA9PiByZXNvbHZlKHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB0aGlzLnB1bGxRdWV1ZSA9IFtdO1xuICAgICAgICAgICAgdGhpcy5wdXNoUXVldWUgPSBbXTtcbiAgICAgICAgfVxuICAgIH1cblxufVxuIl19