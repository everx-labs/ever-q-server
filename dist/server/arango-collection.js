"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.wrap = wrap;
exports.ChangeLog = exports.Collection = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _apolloServer = require("apollo-server");

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
  _regenerator["default"].mark(function _callee6(log, op, args, fetch) {
    var error;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return fetch();

          case 3:
            return _context6.abrupt("return", _context6.sent);

          case 6:
            _context6.prev = 6;
            _context6.t0 = _context6["catch"](0);
            error = {
              message: _context6.t0.message || _context6.t0.ArangoError || _context6.t0.toString(),
              code: _context6.t0.code
            };
            log.error('FAILED', op, args, error.message);
            throw error;

          case 11:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[0, 6]]);
  }));
  return _wrap.apply(this, arguments);
}

var Collection =
/*#__PURE__*/
function () {
  function Collection(name, docType, pubsub, logs, changeLog, tracer, db) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "pubsub", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "changeLog", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "lastSubscriptionId", void 0);
    (0, _defineProperty2["default"])(this, "subscriptionsById", void 0);
    this.name = name;
    this.docType = docType;
    this.pubsub = pubsub;
    this.log = logs.create(name);
    this.changeLog = changeLog;
    this.tracer = tracer;
    this.db = db;
    this.lastSubscriptionId = 0;
    this.subscriptionsById = new Map();
  } // Subscriptions


  (0, _createClass2["default"])(Collection, [{
    key: "addSubscription",
    value: function addSubscription(filter) {
      var id = this.lastSubscriptionId;

      do {
        id = id < Number.MAX_SAFE_INTEGER ? id + 1 : 1;
      } while (this.subscriptionsById.has(id));

      this.lastSubscriptionId = id;
      this.subscriptionsById.set(id, {
        filter: filter
      });
      return id;
    }
  }, {
    key: "getSubscriptionPubSubName",
    value: function getSubscriptionPubSubName(id) {
      return "".concat(this.name).concat(id);
    }
  }, {
    key: "removeSubscription",
    value: function removeSubscription(id) {
      if (!this.subscriptionsById["delete"](id)) {
        console.error("Failed to remove subscription ".concat(this.name, "[").concat(id, "]: subscription does not exists"));
      }
    }
  }, {
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.subscriptionsById.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = (0, _slicedToArray2["default"])(_step.value, 2),
              _id = _step$value[0],
              _filter = _step$value[1].filter;

          if (this.docType.test(null, doc, _filter || {})) {
            this.pubsub.publish(this.getSubscriptionPubSubName(_id), (0, _defineProperty2["default"])({}, this.name, doc));
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
  }, {
    key: "subscriptionResolver",
    value: function subscriptionResolver() {
      var _this = this;

      return {
        subscribe: (0, _apolloServer.withFilter)(function (_, args) {
          var subscriptionId = _this.addSubscription(args.filter);

          var iter = _this.pubsub.asyncIterator(_this.getSubscriptionPubSubName(subscriptionId));

          return {
            next: function next(value) {
              return iter.next(value);
            },
            "return": function _return(value) {
              this.removeSubscription(subscriptionId);
              return iter["return"](value);
            },
            "throw": function _throw(e) {
              this.removeSubscription(subscriptionId);
              return iter["throw"](e);
            }
          };
        }, function (data, args) {
          try {
            var doc = data[_this.name];

            if (_this.changeLog.enabled) {
              _this.changeLog.log(doc._key, Date.now());
            }

            return _this.docType.test(null, doc, args.filter || {});
          } catch (error) {
            console.error('[Subscription] doc test failed', data, error);
            throw error;
          }
        })
      };
    } // Queries

  }, {
    key: "queryResolver",
    value: function queryResolver() {
      var _this2 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee2(parent, args, context) {
            return _regenerator["default"].wrap(function _callee2$(_context2) {
              while (1) {
                switch (_context2.prev = _context2.next) {
                  case 0:
                    return _context2.abrupt("return", wrap(_this2.log, 'QUERY', args,
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee() {
                      var aql, span, cursor;
                      return _regenerator["default"].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _this2.log.debug('QUERY', args);

                              aql = _this2.genAQL(args);
                              _context.next = 4;
                              return _this2.tracer.startSpanLog(context, 'arango.js:fetchDocs', 'new query', args);

                            case 4:
                              span = _context.sent;
                              _context.prev = 5;
                              _context.next = 8;
                              return _this2.db.query(aql);

                            case 8:
                              cursor = _context.sent;
                              _context.next = 11;
                              return cursor.all();

                            case 11:
                              return _context.abrupt("return", _context.sent);

                            case 12:
                              _context.prev = 12;
                              _context.next = 15;
                              return span.finish();

                            case 15:
                              return _context.finish(12);

                            case 16:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee, null, [[5,, 12, 16]]);
                    }))));

                  case 1:
                  case "end":
                    return _context2.stop();
                }
              }
            }, _callee2);
          }));

          return function (_x5, _x6, _x7) {
            return _ref.apply(this, arguments);
          };
        }()
      );
    }
  }, {
    key: "genAQL",
    value: function genAQL(args) {
      var filter = args.filter || {};
      var params = new _qTypes.QParams();
      var filterSection = Object.keys(filter).length > 0 ? "FILTER ".concat(this.docType.ql(params, 'doc', filter)) : '';
      var orderBy = (args.orderBy || []).map(function (field) {
        var direction = field.direction && field.direction.toLowerCase() === 'desc' ? ' DESC' : '';
        return "doc.".concat(field.path.replace(/\bid\b/gi, '_key')).concat(direction);
      }).join(', ');
      var sortSection = orderBy !== '' ? "SORT ".concat(orderBy) : '';
      var limit = Math.min(args.limit || 50, 50);
      var limitSection = "LIMIT ".concat(limit);
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
      _regenerator["default"].mark(function _callee4(key) {
        var _this3 = this;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (key) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return", Promise.resolve(null));

              case 2:
                return _context4.abrupt("return", wrap(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          return _context3.abrupt("return", _this3.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3);
                }))));

              case 3:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function fetchDocByKey(_x8) {
        return _fetchDocByKey.apply(this, arguments);
      }

      return fetchDocByKey;
    }()
  }, {
    key: "fetchDocsByKeys",
    value: function () {
      var _fetchDocsByKeys = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee5(keys) {
        var _this4 = this;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(!keys || keys.length === 0)) {
                  _context5.next = 2;
                  break;
                }

                return _context5.abrupt("return", Promise.resolve([]));

              case 2:
                return _context5.abrupt("return", Promise.all(keys.map(function (key) {
                  return _this4.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function fetchDocsByKeys(_x9) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJ3cmFwIiwibG9nIiwib3AiLCJhcmdzIiwiZmV0Y2giLCJlcnJvciIsIm1lc3NhZ2UiLCJBcmFuZ29FcnJvciIsInRvU3RyaW5nIiwiY29kZSIsIkNvbGxlY3Rpb24iLCJuYW1lIiwiZG9jVHlwZSIsInB1YnN1YiIsImxvZ3MiLCJjaGFuZ2VMb2ciLCJ0cmFjZXIiLCJkYiIsImNyZWF0ZSIsImxhc3RTdWJzY3JpcHRpb25JZCIsInN1YnNjcmlwdGlvbnNCeUlkIiwiTWFwIiwiZmlsdGVyIiwiaWQiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwiaGFzIiwic2V0IiwiY29uc29sZSIsImRvYyIsImVudHJpZXMiLCJ0ZXN0IiwicHVibGlzaCIsImdldFN1YnNjcmlwdGlvblB1YlN1Yk5hbWUiLCJzdWJzY3JpYmUiLCJfIiwic3Vic2NyaXB0aW9uSWQiLCJhZGRTdWJzY3JpcHRpb24iLCJpdGVyIiwiYXN5bmNJdGVyYXRvciIsIm5leHQiLCJ2YWx1ZSIsInJlbW92ZVN1YnNjcmlwdGlvbiIsImUiLCJkYXRhIiwiZW5hYmxlZCIsIl9rZXkiLCJEYXRlIiwibm93IiwicGFyZW50IiwiY29udGV4dCIsImRlYnVnIiwiYXFsIiwiZ2VuQVFMIiwic3RhcnRTcGFuTG9nIiwic3BhbiIsInF1ZXJ5IiwiY3Vyc29yIiwiYWxsIiwiZmluaXNoIiwicGFyYW1zIiwiUVBhcmFtcyIsImZpbHRlclNlY3Rpb24iLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwicWwiLCJvcmRlckJ5IiwibWFwIiwiZmllbGQiLCJkaXJlY3Rpb24iLCJ0b0xvd2VyQ2FzZSIsInBhdGgiLCJyZXBsYWNlIiwiam9pbiIsInNvcnRTZWN0aW9uIiwibGltaXQiLCJNYXRoIiwibWluIiwibGltaXRTZWN0aW9uIiwiYmluZFZhcnMiLCJ2YWx1ZXMiLCJjb2xsZWN0aW9uIiwia2V5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJkYkNvbGxlY3Rpb24iLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiLCJDaGFuZ2VMb2ciLCJyZWNvcmRzIiwiY2xlYXIiLCJ0aW1lIiwiZXhpc3RpbmciLCJnZXQiLCJwdXNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQXhCQTs7Ozs7Ozs7Ozs7Ozs7O1NBOEJzQkEsSTs7Ozs7OzsrQkFBZixrQkFBdUJDLEdBQXZCLEVBQWtDQyxFQUFsQyxFQUE4Q0MsSUFBOUMsRUFBeURDLEtBQXpEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFFY0EsS0FBSyxFQUZuQjs7QUFBQTtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUlPQyxZQUFBQSxLQUpQLEdBSWU7QUFDVkMsY0FBQUEsT0FBTyxFQUFFLGFBQUlBLE9BQUosSUFBZSxhQUFJQyxXQUFuQixJQUFrQyxhQUFJQyxRQUFKLEVBRGpDO0FBRVZDLGNBQUFBLElBQUksRUFBRSxhQUFJQTtBQUZBLGFBSmY7QUFRQ1IsWUFBQUEsR0FBRyxDQUFDSSxLQUFKLENBQVUsUUFBVixFQUFvQkgsRUFBcEIsRUFBd0JDLElBQXhCLEVBQThCRSxLQUFLLENBQUNDLE9BQXBDO0FBUkQsa0JBU09ELEtBVFA7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRzs7OztJQWFNSyxVOzs7QUFhVCxzQkFDSUMsSUFESixFQUVJQyxPQUZKLEVBR0lDLE1BSEosRUFJSUMsSUFKSixFQUtJQyxTQUxKLEVBTUlDLE1BTkosRUFPSUMsRUFQSixFQVFFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDRSxTQUFLTixJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxPQUFMLEdBQWVBLE9BQWY7QUFFQSxTQUFLQyxNQUFMLEdBQWNBLE1BQWQ7QUFDQSxTQUFLWixHQUFMLEdBQVdhLElBQUksQ0FBQ0ksTUFBTCxDQUFZ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QUFJLENBQUNJLEdBQUwsQ0FBUyxVQUFBZSxHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDSyxhQUFMLENBQW1CTCxHQUFuQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSUZNLFM7OztBQUlULHVCQUFjO0FBQUE7QUFBQTtBQUFBO0FBQ1YsU0FBSzVDLE9BQUwsR0FBZSxLQUFmO0FBQ0EsU0FBSzZDLE9BQUwsR0FBZSxJQUFJckUsR0FBSixFQUFmO0FBQ0g7Ozs7NEJBRU87QUFDSixXQUFLcUUsT0FBTCxDQUFhQyxLQUFiO0FBQ0g7Ozt3QkFFR3BFLEUsRUFBWXFFLEksRUFBYztBQUMxQixVQUFJLENBQUMsS0FBSy9DLE9BQVYsRUFBbUI7QUFDZjtBQUNIOztBQUNELFVBQU1nRCxRQUFRLEdBQUcsS0FBS0gsT0FBTCxDQUFhSSxHQUFiLENBQWlCdkUsRUFBakIsQ0FBakI7O0FBQ0EsVUFBSXNFLFFBQUosRUFBYztBQUNWQSxRQUFBQSxRQUFRLENBQUNFLElBQVQsQ0FBY0gsSUFBZDtBQUNILE9BRkQsTUFFTztBQUNILGFBQUtGLE9BQUwsQ0FBYS9ELEdBQWIsQ0FBaUJKLEVBQWpCLEVBQXFCLENBQUNxRSxJQUFELENBQXJCO0FBQ0g7QUFDSjs7O3dCQUVHckUsRSxFQUFzQjtBQUN0QixhQUFPLEtBQUttRSxPQUFMLENBQWFJLEdBQWIsQ0FBaUJ2RSxFQUFqQixLQUF3QixFQUEvQjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMTkgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBQdWJTdWIsIHdpdGhGaWx0ZXIgfSBmcm9tIFwiYXBvbGxvLXNlcnZlclwiO1xuaW1wb3J0IHsgRGF0YWJhc2UsIERvY3VtZW50Q29sbGVjdGlvbiB9IGZyb20gXCJhcmFuZ29qc1wiO1xuaW1wb3J0IFFMb2dzIGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCB0eXBlIHsgUVR5cGUgfSBmcm9tIFwiLi9xLXR5cGVzXCI7XG5pbXBvcnQgeyBRUGFyYW1zIH0gZnJvbSBcIi4vcS10eXBlc1wiO1xuaW1wb3J0IHsgVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbnR5cGUgQ29sbGVjdGlvblN1YnNjcmlwdGlvbiA9IHtcbiAgICBmaWx0ZXI6IGFueSxcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXA8Uj4obG9nOiBRTG9nLCBvcDogc3RyaW5nLCBhcmdzOiBhbnksIGZldGNoOiAoKSA9PiBQcm9taXNlPFI+KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IGZldGNoKCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnN0IGVycm9yID0ge1xuICAgICAgICAgICAgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfHwgZXJyLkFyYW5nb0Vycm9yIHx8IGVyci50b1N0cmluZygpLFxuICAgICAgICAgICAgY29kZTogZXJyLmNvZGVcbiAgICAgICAgfTtcbiAgICAgICAgbG9nLmVycm9yKCdGQUlMRUQnLCBvcCwgYXJncywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb24ge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkb2NUeXBlOiBRVHlwZTtcblxuICAgIHB1YnN1YjogUHViU3ViO1xuICAgIGxvZzogUUxvZztcbiAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZztcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG5cbiAgICBsYXN0U3Vic2NyaXB0aW9uSWQ6IG51bWJlcjtcbiAgICBzdWJzY3JpcHRpb25zQnlJZDogTWFwPG51bWJlciwgQ29sbGVjdGlvblN1YnNjcmlwdGlvbj47XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgcHVic3ViOiBQdWJTdWIsXG4gICAgICAgIGxvZ3M6IFFMb2dzLFxuICAgICAgICBjaGFuZ2VMb2c6IENoYW5nZUxvZyxcbiAgICAgICAgdHJhY2VyOiBUcmFjZXIsXG4gICAgICAgIGRiOiBEYXRhYmFzZSxcbiAgICApIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5kb2NUeXBlID0gZG9jVHlwZTtcblxuICAgICAgICB0aGlzLnB1YnN1YiA9IHB1YnN1YjtcbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5jaGFuZ2VMb2cgPSBjaGFuZ2VMb2c7XG4gICAgICAgIHRoaXMudHJhY2VyID0gdHJhY2VyO1xuICAgICAgICB0aGlzLmRiID0gZGI7XG5cbiAgICAgICAgdGhpcy5sYXN0U3Vic2NyaXB0aW9uSWQgPSAwO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnNCeUlkID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIGFkZFN1YnNjcmlwdGlvbihmaWx0ZXI6IGFueSk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZCA9IHRoaXMubGFzdFN1YnNjcmlwdGlvbklkO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBpZCA9IGlkIDwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIgPyBpZCArIDEgOiAxO1xuICAgICAgICB9IHdoaWxlICh0aGlzLnN1YnNjcmlwdGlvbnNCeUlkLmhhcyhpZCkpO1xuICAgICAgICB0aGlzLmxhc3RTdWJzY3JpcHRpb25JZCA9IGlkO1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnNCeUlkLnNldChpZCwgeyBmaWx0ZXIgfSk7XG4gICAgICAgIHJldHVybiBpZDtcbiAgICB9XG5cbiAgICBnZXRTdWJzY3JpcHRpb25QdWJTdWJOYW1lKGlkOiBudW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMubmFtZX0ke2lkfWA7XG4gICAgfVxuXG4gICAgcmVtb3ZlU3Vic2NyaXB0aW9uKGlkOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLnN1YnNjcmlwdGlvbnNCeUlkLmRlbGV0ZShpZCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEZhaWxlZCB0byByZW1vdmUgc3Vic2NyaXB0aW9uICR7dGhpcy5uYW1lfVske2lkfV06IHN1YnNjcmlwdGlvbiBkb2VzIG5vdCBleGlzdHNgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IFtpZCwgeyBmaWx0ZXIgfV0gb2YgdGhpcy5zdWJzY3JpcHRpb25zQnlJZC5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGZpbHRlciB8fCB7fSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YnN1Yi5wdWJsaXNoKHRoaXMuZ2V0U3Vic2NyaXB0aW9uUHViU3ViTmFtZShpZCksIHsgW3RoaXMubmFtZV06IGRvYyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN1YnNjcmlwdGlvblJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3Vic2NyaWJlOiB3aXRoRmlsdGVyKFxuICAgICAgICAgICAgICAgIChfLCBhcmdzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbklkID0gdGhpcy5hZGRTdWJzY3JpcHRpb24oYXJncy5maWx0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVyID0gdGhpcy5wdWJzdWIuYXN5bmNJdGVyYXRvcih0aGlzLmdldFN1YnNjcmlwdGlvblB1YlN1Yk5hbWUoc3Vic2NyaXB0aW9uSWQpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQodmFsdWU/OiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLm5leHQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybih2YWx1ZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnJldHVybih2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3coZT86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVTdWJzY3JpcHRpb24oc3Vic2NyaXB0aW9uSWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVyLnRocm93KGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgKGRhdGEsIGFyZ3MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvYyA9IGRhdGFbdGhpcy5uYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmNoYW5nZUxvZy5lbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VMb2cubG9nKGRvYy5fa2V5LCBEYXRlLm5vdygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmRvY1R5cGUudGVzdChudWxsLCBkb2MsIGFyZ3MuZmlsdGVyIHx8IHt9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTdWJzY3JpcHRpb25dIGRvYyB0ZXN0IGZhaWxlZCcsIGRhdGEsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXJpZXNcblxuICAgIHF1ZXJ5UmVzb2x2ZXIoKSB7XG4gICAgICAgIHJldHVybiBhc3luYyAocGFyZW50OiBhbnksIGFyZ3M6IGFueSwgY29udGV4dDogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzKTtcbiAgICAgICAgICAgIGNvbnN0IGFxbCA9IHRoaXMuZ2VuQVFMKGFyZ3MpO1xuICAgICAgICAgICAgY29uc3Qgc3BhbiA9IGF3YWl0IHRoaXMudHJhY2VyLnN0YXJ0U3BhbkxvZyhcbiAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICdhcmFuZ28uanM6ZmV0Y2hEb2NzJyxcbiAgICAgICAgICAgICAgICAnbmV3IHF1ZXJ5JyxcbiAgICAgICAgICAgICAgICBhcmdzXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJzb3IgPSBhd2FpdCB0aGlzLmRiLnF1ZXJ5KGFxbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGN1cnNvci5hbGwoKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgc3Bhbi5maW5pc2goKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZ2VuQVFMKGFyZ3M6IGFueSk6IHsgcXVlcnk6IHN0cmluZywgYmluZFZhcnM6IHsgW3N0cmluZ106IGFueSB9IH0ge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBhcmdzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gbmV3IFFQYXJhbXMoKTtcbiAgICAgICAgY29uc3QgZmlsdGVyU2VjdGlvbiA9IE9iamVjdC5rZXlzKGZpbHRlcikubGVuZ3RoID4gMFxuICAgICAgICAgICAgPyBgRklMVEVSICR7dGhpcy5kb2NUeXBlLnFsKHBhcmFtcywgJ2RvYycsIGZpbHRlcil9YFxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgY29uc3Qgb3JkZXJCeSA9IChhcmdzLm9yZGVyQnkgfHwgW10pXG4gICAgICAgICAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IChmaWVsZC5kaXJlY3Rpb24gJiYgZmllbGQuZGlyZWN0aW9uLnRvTG93ZXJDYXNlKCkgPT09ICdkZXNjJylcbiAgICAgICAgICAgICAgICAgICAgPyAnIERFU0MnXG4gICAgICAgICAgICAgICAgICAgIDogJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGBkb2MuJHtmaWVsZC5wYXRoLnJlcGxhY2UoL1xcYmlkXFxiL2dpLCAnX2tleScpfSR7ZGlyZWN0aW9ufWA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmpvaW4oJywgJyk7XG5cbiAgICAgICAgY29uc3Qgc29ydFNlY3Rpb24gPSBvcmRlckJ5ICE9PSAnJyA/IGBTT1JUICR7b3JkZXJCeX1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0ID0gTWF0aC5taW4oYXJncy5saW1pdCB8fCA1MCwgNTApO1xuICAgICAgICBjb25zdCBsaW1pdFNlY3Rpb24gPSBgTElNSVQgJHtsaW1pdH1gO1xuXG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFxuICAgICAgICAgICAgRk9SIGRvYyBJTiAke3RoaXMubmFtZX1cbiAgICAgICAgICAgICR7ZmlsdGVyU2VjdGlvbn1cbiAgICAgICAgICAgICR7c29ydFNlY3Rpb259XG4gICAgICAgICAgICAke2xpbWl0U2VjdGlvbn1cbiAgICAgICAgICAgIFJFVFVSTiBkb2NgO1xuICAgICAgICByZXR1cm4geyBxdWVyeSwgYmluZFZhcnM6IHBhcmFtcy52YWx1ZXMgfTtcbiAgICB9XG5cbiAgICBkYkNvbGxlY3Rpb24oKTogRG9jdW1lbnRDb2xsZWN0aW9uIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuY29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jQnlLZXkoa2V5OiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICBpZiAoIWtleSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLmxvZywgJ0ZFVENIX0RPQ19CWV9LRVknLCBrZXksIGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRiQ29sbGVjdGlvbigpLmRvY3VtZW50KGtleSwgdHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGFzeW5jIGZldGNoRG9jc0J5S2V5cyhrZXlzOiBzdHJpbmdbXSk6IFByb21pc2U8YW55W10+IHtcbiAgICAgICAgaWYgKCFrZXlzIHx8IGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoa2V5cy5tYXAoa2V5ID0+IHRoaXMuZmV0Y2hEb2NCeUtleShrZXkpKSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2hhbmdlTG9nIHtcbiAgICBlbmFibGVkOiBib29sZWFuO1xuICAgIHJlY29yZHM6IE1hcDxzdHJpbmcsIG51bWJlcltdPjtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZWNvcmRzID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLnJlY29yZHMuY2xlYXIoKTtcbiAgICB9XG5cbiAgICBsb2coaWQ6IHN0cmluZywgdGltZTogbnVtYmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnJlY29yZHMuZ2V0KGlkKTtcbiAgICAgICAgaWYgKGV4aXN0aW5nKSB7XG4gICAgICAgICAgICBleGlzdGluZy5wdXNoKHRpbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRzLnNldChpZCwgW3RpbWVdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldChpZDogc3RyaW5nKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gdGhpcy5yZWNvcmRzLmdldChpZCkgfHwgW107XG4gICAgfVxufVxuIl19