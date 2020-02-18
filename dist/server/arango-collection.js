"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Collection = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _arangojs = require("arangojs");

var _opentracing = require("opentracing");

var _arangoListeners = require("./arango-listeners");

var _logs = _interopRequireDefault(require("./logs"));

var _auth = require("./auth");

var _dbTypes = require("./db-types");

var _tracer = require("./tracer");

var _utils = require("./utils");

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
var Collection =
/*#__PURE__*/
function () {
  function Collection(name, docType, logs, auth, tracer, db, slowDb) {
    (0, _classCallCheck2["default"])(this, Collection);
    (0, _defineProperty2["default"])(this, "name", void 0);
    (0, _defineProperty2["default"])(this, "docType", void 0);
    (0, _defineProperty2["default"])(this, "log", void 0);
    (0, _defineProperty2["default"])(this, "auth", void 0);
    (0, _defineProperty2["default"])(this, "tracer", void 0);
    (0, _defineProperty2["default"])(this, "db", void 0);
    (0, _defineProperty2["default"])(this, "slowDb", void 0);
    (0, _defineProperty2["default"])(this, "listeners", void 0);
    (0, _defineProperty2["default"])(this, "queryStats", void 0);
    (0, _defineProperty2["default"])(this, "maxQueueSize", void 0);
    this.name = name;
    this.docType = docType;
    this.log = logs.create(name);
    this.auth = auth;
    this.tracer = tracer;
    this.db = db;
    this.slowDb = slowDb;
    this.listeners = new _utils.RegistryMap("".concat(name, " listeners"));
    this.queryStats = new Map();
    this.maxQueueSize = 0;
  } // Subscriptions


  (0, _createClass2["default"])(Collection, [{
    key: "onDocumentInsertOrUpdate",
    value: function onDocumentInsertOrUpdate(doc) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.listeners.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _listener = _step.value;

          if (_listener.isFiltered(doc)) {
            _listener.onDocumentInsertOrUpdate(doc);
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
        subscribe: function () {
          var _subscribe = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee(_, args, context, info) {
            var accessRights;
            return _regenerator["default"].wrap(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    _context.next = 2;
                    return _this.auth.getAccessRights(context.accessKey);

                  case 2:
                    accessRights = _context.sent;
                    return _context.abrupt("return", new _arangoListeners.SubscriptionListener(_this.name, _this.docType, _this.listeners, accessRights, args.filter || {}, (0, _utils.parseSelectionSet)(info.operation.selectionSet, _this.name)));

                  case 4:
                  case "end":
                    return _context.stop();
                }
              }
            }, _callee);
          }));

          function subscribe(_x, _x2, _x3, _x4) {
            return _subscribe.apply(this, arguments);
          }

          return subscribe;
        }()
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
      var params = new _dbTypes.QParams();
      var primaryCondition = Object.keys(filter).length > 0 ? this.docType.ql(params, 'doc', filter) : '';
      var additionalCondition = this.getAdditionalCondition(accessRights, params);

      if (primaryCondition === 'false' || additionalCondition === 'false') {
        return null;
      }

      var condition = primaryCondition && additionalCondition ? "(".concat(primaryCondition, ") AND (").concat(additionalCondition, ")") : primaryCondition || additionalCondition;
      var filterSection = condition ? "FILTER ".concat(condition) : '';
      var selection = (0, _utils.parseSelectionSet)(selectionInfo, this.name);
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
        params: params.values,
        accessRights: accessRights
      };
    }
  }, {
    key: "ensureQueryStat",
    value: function () {
      var _ensureQueryStat = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(q) {
        var existing, plan, stat;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                existing = this.queryStats.get(q.text);

                if (!(existing !== undefined)) {
                  _context2.next = 3;
                  break;
                }

                return _context2.abrupt("return", existing);

              case 3:
                _context2.next = 5;
                return this.db.explain(q.text, q.params);

              case 5:
                plan = _context2.sent.plan;
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
                return _context2.abrupt("return", stat);

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function ensureQueryStat(_x5) {
        return _ensureQueryStat.apply(this, arguments);
      }

      return ensureQueryStat;
    }()
  }, {
    key: "queryResolver",
    value: function queryResolver() {
      var _this2 = this;

      return (
        /*#__PURE__*/
        function () {
          var _ref = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee4(parent, args, context, info) {
            return _regenerator["default"].wrap(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    return _context4.abrupt("return", (0, _utils.wrap)(_this2.log, 'QUERY', args,
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee3() {
                      var accessRights, q, stat, start, result;
                      return _regenerator["default"].wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.next = 2;
                              return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

                            case 2:
                              accessRights = _context3.sent;
                              q = _this2.createDatabaseQuery(args, info.operation.selectionSet, accessRights);

                              if (q) {
                                _context3.next = 7;
                                break;
                              }

                              _this2.log.debug('QUERY', args, 0, 'SKIPPED', context.remoteAddress);

                              return _context3.abrupt("return", []);

                            case 7:
                              _context3.next = 9;
                              return _this2.ensureQueryStat(q);

                            case 9:
                              stat = _context3.sent;
                              start = Date.now();

                              if (!(q.timeout > 0)) {
                                _context3.next = 17;
                                break;
                              }

                              _context3.next = 14;
                              return _this2.queryWaitFor(q, stat, context.parentSpan);

                            case 14:
                              _context3.t0 = _context3.sent;
                              _context3.next = 20;
                              break;

                            case 17:
                              _context3.next = 19;
                              return _this2.query(q, stat, context.parentSpan);

                            case 19:
                              _context3.t0 = _context3.sent;

                            case 20:
                              result = _context3.t0;

                              _this2.log.debug('QUERY', args, (Date.now() - start) / 1000, stat.slow ? 'SLOW' : 'FAST', context.remoteAddress);

                              return _context3.abrupt("return", result);

                            case 23:
                            case "end":
                              return _context3.stop();
                          }
                        }
                      }, _callee3);
                    }))));

                  case 1:
                  case "end":
                    return _context4.stop();
                }
              }
            }, _callee4);
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
      _regenerator["default"].mark(function _callee6(q, stat, parentSpan) {
        var _this3 = this;

        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".query"),
                /*#__PURE__*/
                function () {
                  var _ref3 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee5(span) {
                    return _regenerator["default"].wrap(function _callee5$(_context5) {
                      while (1) {
                        switch (_context5.prev = _context5.next) {
                          case 0:
                            Collection.setQueryTraceParams(q, span);
                            return _context5.abrupt("return", _this3.queryDatabase(q, stat));

                          case 2:
                          case "end":
                            return _context5.stop();
                        }
                      }
                    }, _callee5);
                  }));

                  return function (_x13) {
                    return _ref3.apply(this, arguments);
                  };
                }(), parentSpan));

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function query(_x10, _x11, _x12) {
        return _query.apply(this, arguments);
      }

      return query;
    }()
  }, {
    key: "queryDatabase",
    value: function () {
      var _queryDatabase = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee7(q, stat) {
        var db, start, cursor, result;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                db = stat.slow ? this.slowDb : this.db;
                start = Date.now();
                _context7.next = 4;
                return db.query(q.text, q.params);

              case 4:
                cursor = _context7.sent;
                _context7.next = 7;
                return cursor.all();

              case 7:
                result = _context7.sent;
                stat.times.push(Date.now() - start);

                if (stat.times.length > 100) {
                  stat.times.shift();
                }

                return _context7.abrupt("return", result);

              case 11:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function queryDatabase(_x14, _x15) {
        return _queryDatabase.apply(this, arguments);
      }

      return queryDatabase;
    }()
  }, {
    key: "queryWaitFor",
    value: function () {
      var _queryWaitFor = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee9(q, stat, parentSpan) {
        var _this4 = this;

        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt("return", _tracer.QTracer.trace(this.tracer, "".concat(this.name, ".waitFor"),
                /*#__PURE__*/
                function () {
                  var _ref4 = (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee8(span) {
                    var waitFor, forceTimerId, resolvedBy, onQuery, onChangesFeed, onTimeout, result;
                    return _regenerator["default"].wrap(function _callee8$(_context8) {
                      while (1) {
                        switch (_context8.prev = _context8.next) {
                          case 0:
                            Collection.setQueryTraceParams(q, span);
                            waitFor = null;
                            forceTimerId = null;
                            resolvedBy = null;
                            _context8.prev = 4;
                            onQuery = new Promise(function (resolve, reject) {
                              var check = function check() {
                                _this4.queryDatabase(q, stat).then(function (docs) {
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
                              waitFor = new _arangoListeners.WaitForListener(_this4.name, _this4.docType, _this4.listeners, q.accessRights, q.filter, q.selection, function (doc) {
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
                            _context8.next = 10;
                            return Promise.race([onQuery, onChangesFeed, onTimeout]);

                          case 10:
                            result = _context8.sent;
                            span.setTag('resolved', resolvedBy);
                            return _context8.abrupt("return", result);

                          case 13:
                            _context8.prev = 13;

                            if (waitFor !== null && waitFor !== undefined) {
                              waitFor.close();
                              waitFor = null;
                            }

                            if (forceTimerId !== null) {
                              clearTimeout(forceTimerId);
                              forceTimerId = null;
                            }

                            return _context8.finish(13);

                          case 17:
                          case "end":
                            return _context8.stop();
                        }
                      }
                    }, _callee8, null, [[4,, 13, 17]]);
                  }));

                  return function (_x19) {
                    return _ref4.apply(this, arguments);
                  };
                }(), parentSpan));

              case 1:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function queryWaitFor(_x16, _x17, _x18) {
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
      _regenerator["default"].mark(function _callee11(key) {
        var _this5 = this;

        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                if (key) {
                  _context11.next = 2;
                  break;
                }

                return _context11.abrupt("return", Promise.resolve(null));

              case 2:
                return _context11.abrupt("return", (0, _utils.wrap)(this.log, 'FETCH_DOC_BY_KEY', key,
                /*#__PURE__*/
                (0, _asyncToGenerator2["default"])(
                /*#__PURE__*/
                _regenerator["default"].mark(function _callee10() {
                  return _regenerator["default"].wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          return _context10.abrupt("return", _this5.dbCollection().document(key, true));

                        case 1:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee10);
                }))));

              case 3:
              case "end":
                return _context11.stop();
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
        var _this6 = this;

        return _regenerator["default"].wrap(function _callee12$(_context12) {
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
                  return _this6.fetchDocByKey(key);
                })));

              case 3:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12);
      }));

      function fetchDocsByKeys(_x21) {
        return _fetchDocsByKeys.apply(this, arguments);
      }

      return fetchDocsByKeys;
    }()
  }], [{
    key: "setQueryTraceParams",
    value: function setQueryTraceParams(q, span) {
      var params = {
        filter: q.filter,
        selection: (0, _utils.selectionToString)(q.selection)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9hcmFuZ28tY29sbGVjdGlvbi5qcyJdLCJuYW1lcyI6WyJDb2xsZWN0aW9uIiwibmFtZSIsImRvY1R5cGUiLCJsb2dzIiwiYXV0aCIsInRyYWNlciIsImRiIiwic2xvd0RiIiwibG9nIiwiY3JlYXRlIiwibGlzdGVuZXJzIiwiUmVnaXN0cnlNYXAiLCJxdWVyeVN0YXRzIiwiTWFwIiwibWF4UXVldWVTaXplIiwiZG9jIiwidmFsdWVzIiwibGlzdGVuZXIiLCJpc0ZpbHRlcmVkIiwib25Eb2N1bWVudEluc2VydE9yVXBkYXRlIiwic3Vic2NyaWJlIiwiXyIsImFyZ3MiLCJjb250ZXh0IiwiaW5mbyIsImdldEFjY2Vzc1JpZ2h0cyIsImFjY2Vzc0tleSIsImFjY2Vzc1JpZ2h0cyIsIlN1YnNjcmlwdGlvbkxpc3RlbmVyIiwiZmlsdGVyIiwib3BlcmF0aW9uIiwic2VsZWN0aW9uU2V0IiwicGFyYW1zIiwiYWNjb3VudHMiLCJyZXN0cmljdFRvQWNjb3VudHMiLCJsZW5ndGgiLCJjb25kaXRpb24iLCJhZGQiLCJtYXAiLCJ4Iiwiam9pbiIsInNlbGVjdGlvbkluZm8iLCJRUGFyYW1zIiwicHJpbWFyeUNvbmRpdGlvbiIsIk9iamVjdCIsImtleXMiLCJxbCIsImFkZGl0aW9uYWxDb25kaXRpb24iLCJnZXRBZGRpdGlvbmFsQ29uZGl0aW9uIiwiZmlsdGVyU2VjdGlvbiIsInNlbGVjdGlvbiIsIm9yZGVyQnkiLCJsaW1pdCIsInRpbWVvdXQiLCJOdW1iZXIiLCJvcmRlckJ5VGV4dCIsImZpZWxkIiwiZGlyZWN0aW9uIiwidG9Mb3dlckNhc2UiLCJwYXRoIiwicmVwbGFjZSIsInNvcnRTZWN0aW9uIiwibGltaXRUZXh0IiwiTWF0aCIsIm1pbiIsImxpbWl0U2VjdGlvbiIsInRleHQiLCJxIiwiZXhpc3RpbmciLCJnZXQiLCJ1bmRlZmluZWQiLCJleHBsYWluIiwicGxhbiIsInN0YXQiLCJlc3RpbWF0ZWRDb3N0Iiwic2xvdyIsInRpbWVzIiwibm9kZXMiLCJmaW5kIiwibm9kZSIsInR5cGUiLCJzZXQiLCJwYXJlbnQiLCJyZXF1aXJlR3JhbnRlZEFjY2VzcyIsImNyZWF0ZURhdGFiYXNlUXVlcnkiLCJkZWJ1ZyIsInJlbW90ZUFkZHJlc3MiLCJlbnN1cmVRdWVyeVN0YXQiLCJzdGFydCIsIkRhdGUiLCJub3ciLCJxdWVyeVdhaXRGb3IiLCJwYXJlbnRTcGFuIiwicXVlcnkiLCJyZXN1bHQiLCJRVHJhY2VyIiwidHJhY2UiLCJzcGFuIiwic2V0UXVlcnlUcmFjZVBhcmFtcyIsInF1ZXJ5RGF0YWJhc2UiLCJjdXJzb3IiLCJhbGwiLCJwdXNoIiwic2hpZnQiLCJ3YWl0Rm9yIiwiZm9yY2VUaW1lcklkIiwicmVzb2x2ZWRCeSIsIm9uUXVlcnkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNoZWNrIiwidGhlbiIsImRvY3MiLCJzZXRUaW1lb3V0Iiwib25DaGFuZ2VzRmVlZCIsIldhaXRGb3JMaXN0ZW5lciIsIm9uVGltZW91dCIsInJhY2UiLCJzZXRUYWciLCJjbG9zZSIsImNsZWFyVGltZW91dCIsImNvbGxlY3Rpb24iLCJrZXkiLCJkYkNvbGxlY3Rpb24iLCJkb2N1bWVudCIsImZldGNoRG9jQnlLZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrQkE7O0FBQ0E7O0FBQ0E7O0FBR0E7O0FBRUE7O0FBRUE7O0FBQ0E7O0FBRUE7O0FBOUJBOzs7Ozs7Ozs7Ozs7Ozs7SUFtRWFBLFU7OztBQWVULHNCQUNJQyxJQURKLEVBRUlDLE9BRkosRUFHSUMsSUFISixFQUlJQyxJQUpKLEVBS0lDLE1BTEosRUFNSUMsRUFOSixFQU9JQyxNQVBKLEVBUUU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0UsU0FBS04sSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsT0FBTCxHQUFlQSxPQUFmO0FBRUEsU0FBS00sR0FBTCxHQUFXTCxJQUFJLENBQUNNLE1BQUwsQ0FBWVIsSUFBWixDQUFYO0FBQ0EsU0FBS0csSUFBTCxHQUFZQSxJQUFaO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBQ0EsU0FBS0MsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsTUFBTCxHQUFjQSxNQUFkO0FBRUEsU0FBS0csU0FBTCxHQUFpQixJQUFJQyxrQkFBSixXQUF1Q1YsSUFBdkMsZ0JBQWpCO0FBQ0EsU0FBS1csVUFBTCxHQUFrQixJQUFJQyxHQUFKLEVBQWxCO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQixDQUFwQjtBQUNILEcsQ0FFRDs7Ozs7NkNBRXlCQyxHLEVBQVU7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDL0IsNkJBQXVCLEtBQUtMLFNBQUwsQ0FBZU0sTUFBZixFQUF2Qiw4SEFBZ0Q7QUFBQSxjQUFyQ0MsU0FBcUM7O0FBQzVDLGNBQUlBLFNBQVEsQ0FBQ0MsVUFBVCxDQUFvQkgsR0FBcEIsQ0FBSixFQUE4QjtBQUMxQkUsWUFBQUEsU0FBUSxDQUFDRSx3QkFBVCxDQUFrQ0osR0FBbEM7QUFDSDtBQUNKO0FBTDhCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFNbEM7OzsyQ0FFc0I7QUFBQTs7QUFDbkIsYUFBTztBQUNISyxRQUFBQSxTQUFTO0FBQUE7QUFBQTtBQUFBLHVDQUFFLGlCQUFPQyxDQUFQLEVBQWVDLElBQWYsRUFBc0NDLE9BQXRDLEVBQW9EQyxJQUFwRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDJCQUNvQixLQUFJLENBQUNwQixJQUFMLENBQVVxQixlQUFWLENBQTBCRixPQUFPLENBQUNHLFNBQWxDLENBRHBCOztBQUFBO0FBQ0RDLG9CQUFBQSxZQURDO0FBQUEscURBRUEsSUFBSUMscUNBQUosQ0FDSCxLQUFJLENBQUMzQixJQURGLEVBRUgsS0FBSSxDQUFDQyxPQUZGLEVBR0gsS0FBSSxDQUFDUSxTQUhGLEVBSUhpQixZQUpHLEVBS0hMLElBQUksQ0FBQ08sTUFBTCxJQUFlLEVBTFosRUFNSCw4QkFBa0JMLElBQUksQ0FBQ00sU0FBTCxDQUFlQyxZQUFqQyxFQUErQyxLQUFJLENBQUM5QixJQUFwRCxDQU5HLENBRkE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FBRjs7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUROLE9BQVA7QUFhSCxLLENBRUQ7Ozs7MkNBRXVCMEIsWSxFQUE0QkssTSxFQUFpQjtBQUNoRSxVQUFNQyxRQUFRLEdBQUdOLFlBQVksQ0FBQ08sa0JBQTlCOztBQUNBLFVBQUlELFFBQVEsQ0FBQ0UsTUFBVCxLQUFvQixDQUF4QixFQUEyQjtBQUN2QixlQUFPLEVBQVA7QUFDSDs7QUFDRCxVQUFNQyxTQUFTLEdBQUdILFFBQVEsQ0FBQ0UsTUFBVCxLQUFvQixDQUFwQixpQkFDTEgsTUFBTSxDQUFDSyxHQUFQLENBQVdKLFFBQVEsQ0FBQyxDQUFELENBQW5CLENBREssa0JBRUxBLFFBQVEsQ0FBQ0ssR0FBVCxDQUFhLFVBQUFDLENBQUM7QUFBQSwwQkFBUVAsTUFBTSxDQUFDSyxHQUFQLENBQVdFLENBQVgsQ0FBUjtBQUFBLE9BQWQsRUFBdUNDLElBQXZDLENBQTRDLEdBQTVDLENBRkssTUFBbEI7O0FBR0EsY0FBUSxLQUFLdkMsSUFBYjtBQUNBLGFBQUssVUFBTDtBQUNJLG9DQUFtQm1DLFNBQW5COztBQUNKLGFBQUssY0FBTDtBQUNJLDRDQUEyQkEsU0FBM0I7O0FBQ0osYUFBSyxVQUFMO0FBQ0ksb0NBQW1CQSxTQUFuQiwyQkFBNkNBLFNBQTdDOztBQUNKO0FBQ0ksaUJBQU8sT0FBUDtBQVJKO0FBVUg7Ozt3Q0FHR2QsSSxFQU1BbUIsYSxFQUNBZCxZLEVBQ2M7QUFDZCxVQUFNRSxNQUFNLEdBQUdQLElBQUksQ0FBQ08sTUFBTCxJQUFlLEVBQTlCO0FBQ0EsVUFBTUcsTUFBTSxHQUFHLElBQUlVLGdCQUFKLEVBQWY7QUFDQSxVQUFNQyxnQkFBZ0IsR0FBR0MsTUFBTSxDQUFDQyxJQUFQLENBQVloQixNQUFaLEVBQW9CTSxNQUFwQixHQUE2QixDQUE3QixHQUFpQyxLQUFLakMsT0FBTCxDQUFhNEMsRUFBYixDQUFnQmQsTUFBaEIsRUFBd0IsS0FBeEIsRUFBK0JILE1BQS9CLENBQWpDLEdBQTBFLEVBQW5HO0FBQ0EsVUFBTWtCLG1CQUFtQixHQUFHLEtBQUtDLHNCQUFMLENBQTRCckIsWUFBNUIsRUFBMENLLE1BQTFDLENBQTVCOztBQUNBLFVBQUlXLGdCQUFnQixLQUFLLE9BQXJCLElBQWdDSSxtQkFBbUIsS0FBSyxPQUE1RCxFQUFxRTtBQUNqRSxlQUFPLElBQVA7QUFDSDs7QUFDRCxVQUFJWCxTQUFTLEdBQUlPLGdCQUFnQixJQUFJSSxtQkFBckIsY0FDTkosZ0JBRE0sb0JBQ29CSSxtQkFEcEIsU0FFVEosZ0JBQWdCLElBQUlJLG1CQUYzQjtBQUdBLFVBQU1FLGFBQWEsR0FBR2IsU0FBUyxvQkFBYUEsU0FBYixJQUEyQixFQUExRDtBQUNBLFVBQU1jLFNBQVMsR0FBRyw4QkFBa0JULGFBQWxCLEVBQWlDLEtBQUt4QyxJQUF0QyxDQUFsQjtBQUNBLFVBQU1rRCxPQUFrQixHQUFHN0IsSUFBSSxDQUFDNkIsT0FBTCxJQUFnQixFQUEzQztBQUNBLFVBQU1DLEtBQWEsR0FBRzlCLElBQUksQ0FBQzhCLEtBQUwsSUFBYyxFQUFwQztBQUNBLFVBQU1DLE9BQU8sR0FBR0MsTUFBTSxDQUFDaEMsSUFBSSxDQUFDK0IsT0FBTixDQUFOLElBQXdCLENBQXhDO0FBQ0EsVUFBTUUsV0FBVyxHQUFHSixPQUFPLENBQ3RCYixHQURlLENBQ1gsVUFBQ2tCLEtBQUQsRUFBVztBQUNaLFlBQU1DLFNBQVMsR0FBSUQsS0FBSyxDQUFDQyxTQUFOLElBQW1CRCxLQUFLLENBQUNDLFNBQU4sQ0FBZ0JDLFdBQWhCLE9BQWtDLE1BQXRELEdBQ1osT0FEWSxHQUVaLEVBRk47QUFHQSw2QkFBY0YsS0FBSyxDQUFDRyxJQUFOLENBQVdDLE9BQVgsQ0FBbUIsVUFBbkIsRUFBK0IsTUFBL0IsQ0FBZCxTQUF1REgsU0FBdkQ7QUFDSCxPQU5lLEVBT2ZqQixJQVBlLENBT1YsSUFQVSxDQUFwQjtBQVNBLFVBQU1xQixXQUFXLEdBQUdOLFdBQVcsS0FBSyxFQUFoQixrQkFBNkJBLFdBQTdCLElBQTZDLEVBQWpFO0FBQ0EsVUFBTU8sU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUwsQ0FBU1osS0FBVCxFQUFnQixFQUFoQixDQUFsQjtBQUNBLFVBQU1hLFlBQVksbUJBQVlILFNBQVosQ0FBbEI7QUFFQSxVQUFNSSxJQUFJLHNDQUNPLEtBQUtqRSxJQURaLDJCQUVKZ0QsYUFGSSwyQkFHSlksV0FISSwyQkFJSkksWUFKSSw2QkFBVjtBQU9BLGFBQU87QUFDSHBDLFFBQUFBLE1BQU0sRUFBTkEsTUFERztBQUVIcUIsUUFBQUEsU0FBUyxFQUFUQSxTQUZHO0FBR0hDLFFBQUFBLE9BQU8sRUFBUEEsT0FIRztBQUlIQyxRQUFBQSxLQUFLLEVBQUxBLEtBSkc7QUFLSEMsUUFBQUEsT0FBTyxFQUFQQSxPQUxHO0FBTUhhLFFBQUFBLElBQUksRUFBSkEsSUFORztBQU9IbEMsUUFBQUEsTUFBTSxFQUFFQSxNQUFNLENBQUNoQixNQVBaO0FBUUhXLFFBQUFBLFlBQVksRUFBWkE7QUFSRyxPQUFQO0FBVUg7Ozs7OztxREFFcUJ3QyxDOzs7Ozs7QUFDWkMsZ0JBQUFBLFEsR0FBVyxLQUFLeEQsVUFBTCxDQUFnQnlELEdBQWhCLENBQW9CRixDQUFDLENBQUNELElBQXRCLEM7O3NCQUNiRSxRQUFRLEtBQUtFLFM7Ozs7O2tEQUNORixROzs7O3VCQUVTLEtBQUs5RCxFQUFMLENBQVFpRSxPQUFSLENBQWdCSixDQUFDLENBQUNELElBQWxCLEVBQXdCQyxDQUFDLENBQUNuQyxNQUExQixDOzs7QUFBZHdDLGdCQUFBQSxJLGtCQUFpREEsSTtBQUNqREMsZ0JBQUFBLEksR0FBTztBQUNUQyxrQkFBQUEsYUFBYSxFQUFFRixJQUFJLENBQUNFLGFBRFg7QUFFVEMsa0JBQUFBLElBQUksRUFBRSxLQUZHO0FBR1RDLGtCQUFBQSxLQUFLLEVBQUU7QUFIRSxpQjs7QUFLYixvQkFBSUosSUFBSSxDQUFDSyxLQUFMLENBQVdDLElBQVgsQ0FBZ0IsVUFBQUMsSUFBSTtBQUFBLHlCQUFJQSxJQUFJLENBQUNDLElBQUwsS0FBYyx5QkFBbEI7QUFBQSxpQkFBcEIsQ0FBSixFQUFzRTtBQUNsRVAsa0JBQUFBLElBQUksQ0FBQ0UsSUFBTCxHQUFZLElBQVo7QUFDSDs7QUFDRCxxQkFBSy9ELFVBQUwsQ0FBZ0JxRSxHQUFoQixDQUFvQmQsQ0FBQyxDQUFDRCxJQUF0QixFQUE0Qk8sSUFBNUI7a0RBQ09BLEk7Ozs7Ozs7Ozs7Ozs7Ozs7OztvQ0FHSztBQUFBOztBQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSx1Q0FBTyxrQkFBT1MsTUFBUCxFQUFvQjVELElBQXBCLEVBQStCQyxPQUEvQixFQUErREMsSUFBL0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNEQUE2RSxpQkFBSyxNQUFJLENBQUNoQixHQUFWLEVBQWUsT0FBZixFQUF3QmMsSUFBeEI7QUFBQTtBQUFBO0FBQUE7QUFBQSxpREFBOEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxxQ0FDbkZDLE9BQU8sQ0FBQ25CLElBQVIsQ0FBYStFLG9CQUFiLENBQWtDNUQsT0FBTyxDQUFDRyxTQUFSLElBQXFCSixJQUFJLENBQUNJLFNBQTVELENBRG1GOztBQUFBO0FBQ3hHQyw4QkFBQUEsWUFEd0c7QUFFeEd3Qyw4QkFBQUEsQ0FGd0csR0FFcEcsTUFBSSxDQUFDaUIsbUJBQUwsQ0FBeUI5RCxJQUF6QixFQUErQkUsSUFBSSxDQUFDTSxTQUFMLENBQWVDLFlBQTlDLEVBQTRESixZQUE1RCxDQUZvRzs7QUFBQSxrQ0FHekd3QyxDQUh5RztBQUFBO0FBQUE7QUFBQTs7QUFJMUcsOEJBQUEsTUFBSSxDQUFDM0QsR0FBTCxDQUFTNkUsS0FBVCxDQUFlLE9BQWYsRUFBd0IvRCxJQUF4QixFQUE4QixDQUE5QixFQUFpQyxTQUFqQyxFQUE0Q0MsT0FBTyxDQUFDK0QsYUFBcEQ7O0FBSjBHLGdFQUtuRyxFQUxtRzs7QUFBQTtBQUFBO0FBQUEscUNBTzNGLE1BQUksQ0FBQ0MsZUFBTCxDQUFxQnBCLENBQXJCLENBUDJGOztBQUFBO0FBT3hHTSw4QkFBQUEsSUFQd0c7QUFReEdlLDhCQUFBQSxLQVJ3RyxHQVFoR0MsSUFBSSxDQUFDQyxHQUFMLEVBUmdHOztBQUFBLG9DQVMvRnZCLENBQUMsQ0FBQ2QsT0FBRixHQUFZLENBVG1GO0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBQUEscUNBVWxHLE1BQUksQ0FBQ3NDLFlBQUwsQ0FBa0J4QixDQUFsQixFQUFxQk0sSUFBckIsRUFBMkJsRCxPQUFPLENBQUNxRSxVQUFuQyxDQVZrRzs7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQTtBQUFBO0FBQUEscUNBV2xHLE1BQUksQ0FBQ0MsS0FBTCxDQUFXMUIsQ0FBWCxFQUFjTSxJQUFkLEVBQW9CbEQsT0FBTyxDQUFDcUUsVUFBNUIsQ0FYa0c7O0FBQUE7QUFBQTs7QUFBQTtBQVN4R0UsOEJBQUFBLE1BVHdHOztBQVk5Ryw4QkFBQSxNQUFJLENBQUN0RixHQUFMLENBQVM2RSxLQUFULENBQWUsT0FBZixFQUF3Qi9ELElBQXhCLEVBQThCLENBQUNtRSxJQUFJLENBQUNDLEdBQUwsS0FBYUYsS0FBZCxJQUF1QixJQUFyRCxFQUEyRGYsSUFBSSxDQUFDRSxJQUFMLEdBQVksTUFBWixHQUFxQixNQUFoRixFQUF3RnBELE9BQU8sQ0FBQytELGFBQWhHOztBQVo4RyxnRUFhdkdRLE1BYnVHOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUE5QixHQUE3RTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUFQOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFlSDs7Ozs7O3FEQW1CVzNCLEMsRUFBa0JNLEksRUFBaUJtQixVOzs7Ozs7O2tEQUNwQ0csZ0JBQVFDLEtBQVIsQ0FBYyxLQUFLM0YsTUFBbkIsWUFBOEIsS0FBS0osSUFBbkM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLCtDQUFpRCxrQkFBT2dHLElBQVA7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNwRGpHLDRCQUFBQSxVQUFVLENBQUNrRyxtQkFBWCxDQUErQi9CLENBQS9CLEVBQWtDOEIsSUFBbEM7QUFEb0QsOERBRTdDLE1BQUksQ0FBQ0UsYUFBTCxDQUFtQmhDLENBQW5CLEVBQXNCTSxJQUF0QixDQUY2Qzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBakQ7O0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBR0ptQixVQUhJLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxREFNU3pCLEMsRUFBa0JNLEk7Ozs7OztBQUM1Qm5FLGdCQUFBQSxFLEdBQUttRSxJQUFJLENBQUNFLElBQUwsR0FBWSxLQUFLcEUsTUFBakIsR0FBMEIsS0FBS0QsRTtBQUNwQ2tGLGdCQUFBQSxLLEdBQVFDLElBQUksQ0FBQ0MsR0FBTCxFOzt1QkFDT3BGLEVBQUUsQ0FBQ3VGLEtBQUgsQ0FBUzFCLENBQUMsQ0FBQ0QsSUFBWCxFQUFpQkMsQ0FBQyxDQUFDbkMsTUFBbkIsQzs7O0FBQWZvRSxnQkFBQUEsTTs7dUJBQ2VBLE1BQU0sQ0FBQ0MsR0FBUCxFOzs7QUFBZlAsZ0JBQUFBLE07QUFDTnJCLGdCQUFBQSxJQUFJLENBQUNHLEtBQUwsQ0FBVzBCLElBQVgsQ0FBZ0JiLElBQUksQ0FBQ0MsR0FBTCxLQUFhRixLQUE3Qjs7QUFDQSxvQkFBSWYsSUFBSSxDQUFDRyxLQUFMLENBQVd6QyxNQUFYLEdBQW9CLEdBQXhCLEVBQTZCO0FBQ3pCc0Msa0JBQUFBLElBQUksQ0FBQ0csS0FBTCxDQUFXMkIsS0FBWDtBQUNIOztrREFDTVQsTTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3FEQUlRM0IsQyxFQUFrQk0sSSxFQUFpQm1CLFU7Ozs7Ozs7a0RBQzNDRyxnQkFBUUMsS0FBUixDQUFjLEtBQUszRixNQUFuQixZQUE4QixLQUFLSixJQUFuQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsK0NBQW1ELGtCQUFPZ0csSUFBUDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDdERqRyw0QkFBQUEsVUFBVSxDQUFDa0csbUJBQVgsQ0FBK0IvQixDQUEvQixFQUFrQzhCLElBQWxDO0FBQ0lPLDRCQUFBQSxPQUZrRCxHQUV0QixJQUZzQjtBQUdsREMsNEJBQUFBLFlBSGtELEdBR3ZCLElBSHVCO0FBSWxEQyw0QkFBQUEsVUFKa0QsR0FJNUIsSUFKNEI7QUFBQTtBQU01Q0MsNEJBQUFBLE9BTjRDLEdBTWxDLElBQUlDLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDN0Msa0NBQU1DLEtBQUssR0FBRyxTQUFSQSxLQUFRLEdBQU07QUFDaEIsZ0NBQUEsTUFBSSxDQUFDWixhQUFMLENBQW1CaEMsQ0FBbkIsRUFBc0JNLElBQXRCLEVBQTRCdUMsSUFBNUIsQ0FBaUMsVUFBQ0MsSUFBRCxFQUFVO0FBQ3ZDLHNDQUFJLENBQUNQLFVBQUwsRUFBaUI7QUFDYix3Q0FBSU8sSUFBSSxDQUFDOUUsTUFBTCxHQUFjLENBQWxCLEVBQXFCO0FBQ2pCc0Usc0NBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0FDLHNDQUFBQSxVQUFVLEdBQUcsT0FBYjtBQUNBRyxzQ0FBQUEsT0FBTyxDQUFDSSxJQUFELENBQVA7QUFDSCxxQ0FKRCxNQUlPO0FBQ0hSLHNDQUFBQSxZQUFZLEdBQUdTLFVBQVUsQ0FBQ0gsS0FBRCxFQUFRLElBQVIsQ0FBekI7QUFDSDtBQUNKO0FBQ0osaUNBVkQsRUFVR0QsTUFWSDtBQVdILCtCQVpEOztBQWFBQyw4QkFBQUEsS0FBSztBQUNSLDZCQWZlLENBTmtDO0FBc0I1Q0ksNEJBQUFBLGFBdEI0QyxHQXNCNUIsSUFBSVAsT0FBSixDQUFZLFVBQUNDLE9BQUQsRUFBYTtBQUMzQ0wsOEJBQUFBLE9BQU8sR0FBRyxJQUFJWSxnQ0FBSixDQUNOLE1BQUksQ0FBQ25ILElBREMsRUFFTixNQUFJLENBQUNDLE9BRkMsRUFHTixNQUFJLENBQUNRLFNBSEMsRUFJTnlELENBQUMsQ0FBQ3hDLFlBSkksRUFLTndDLENBQUMsQ0FBQ3RDLE1BTEksRUFNTnNDLENBQUMsQ0FBQ2pCLFNBTkksRUFPTixVQUFDbkMsR0FBRCxFQUFTO0FBQ0wsb0NBQUksQ0FBQzJGLFVBQUwsRUFBaUI7QUFDYkEsa0NBQUFBLFVBQVUsR0FBRyxVQUFiO0FBQ0FHLGtDQUFBQSxPQUFPLENBQUMsQ0FBQzlGLEdBQUQsQ0FBRCxDQUFQO0FBQ0g7QUFDSiwrQkFaSyxDQUFWO0FBYUgsNkJBZHFCLENBdEI0QjtBQXFDNUNzRyw0QkFBQUEsU0FyQzRDLEdBcUNoQyxJQUFJVCxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFhO0FBQ3ZDSyw4QkFBQUEsVUFBVSxDQUFDLFlBQU07QUFDYixvQ0FBSSxDQUFDUixVQUFMLEVBQWlCO0FBQ2JBLGtDQUFBQSxVQUFVLEdBQUcsU0FBYjtBQUNBRyxrQ0FBQUEsT0FBTyxDQUFDLEVBQUQsQ0FBUDtBQUNIO0FBQ0osK0JBTFMsRUFLUDFDLENBQUMsQ0FBQ2QsT0FMSyxDQUFWO0FBTUgsNkJBUGlCLENBckNnQztBQUFBO0FBQUEsbUNBNkM3QnVELE9BQU8sQ0FBQ1UsSUFBUixDQUFhLENBQzlCWCxPQUQ4QixFQUU5QlEsYUFGOEIsRUFHOUJFLFNBSDhCLENBQWIsQ0E3QzZCOztBQUFBO0FBNkM1Q3ZCLDRCQUFBQSxNQTdDNEM7QUFrRGxERyw0QkFBQUEsSUFBSSxDQUFDc0IsTUFBTCxDQUFZLFVBQVosRUFBd0JiLFVBQXhCO0FBbERrRCw4REFtRDNDWixNQW5EMkM7O0FBQUE7QUFBQTs7QUFxRGxELGdDQUFJVSxPQUFPLEtBQUssSUFBWixJQUFvQkEsT0FBTyxLQUFLbEMsU0FBcEMsRUFBK0M7QUFDM0NrQyw4QkFBQUEsT0FBTyxDQUFDZ0IsS0FBUjtBQUNBaEIsOEJBQUFBLE9BQU8sR0FBRyxJQUFWO0FBQ0g7O0FBQ0QsZ0NBQUlDLFlBQVksS0FBSyxJQUFyQixFQUEyQjtBQUN2QmdCLDhCQUFBQSxZQUFZLENBQUNoQixZQUFELENBQVo7QUFDQUEsOEJBQUFBLFlBQVksR0FBRyxJQUFmO0FBQ0g7O0FBNURpRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxtQkFBbkQ7O0FBQUE7QUFBQTtBQUFBO0FBQUEscUJBOERKYixVQTlESSxDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7bUNBa0V3QjtBQUMvQixhQUFPLEtBQUt0RixFQUFMLENBQVFvSCxVQUFSLENBQW1CLEtBQUt6SCxJQUF4QixDQUFQO0FBQ0g7Ozs7OztzREFFbUIwSCxHOzs7Ozs7O29CQUNYQSxHOzs7OzttREFDTWYsT0FBTyxDQUFDQyxPQUFSLENBQWdCLElBQWhCLEM7OzttREFFSixpQkFBSyxLQUFLckcsR0FBVixFQUFlLGtCQUFmLEVBQW1DbUgsR0FBbkM7QUFBQTtBQUFBO0FBQUE7QUFBQSw2Q0FBd0M7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDZEQUNwQyxNQUFJLENBQUNDLFlBQUwsR0FBb0JDLFFBQXBCLENBQTZCRixHQUE3QixFQUFrQyxJQUFsQyxDQURvQzs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBeEMsRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQUtXOUUsSTs7Ozs7OztzQkFDZCxDQUFDQSxJQUFELElBQVNBLElBQUksQ0FBQ1YsTUFBTCxLQUFnQixDOzs7OzttREFDbEJ5RSxPQUFPLENBQUNDLE9BQVIsQ0FBZ0IsRUFBaEIsQzs7O21EQUVKRCxPQUFPLENBQUNQLEdBQVIsQ0FBWXhELElBQUksQ0FBQ1AsR0FBTCxDQUFTLFVBQUFxRixHQUFHO0FBQUEseUJBQUksTUFBSSxDQUFDRyxhQUFMLENBQW1CSCxHQUFuQixDQUFKO0FBQUEsaUJBQVosQ0FBWixDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7d0NBekhnQnhELEMsRUFBa0I4QixJLEVBQVk7QUFDckQsVUFBTWpFLE1BQVcsR0FBRztBQUNoQkgsUUFBQUEsTUFBTSxFQUFFc0MsQ0FBQyxDQUFDdEMsTUFETTtBQUVoQnFCLFFBQUFBLFNBQVMsRUFBRSw4QkFBa0JpQixDQUFDLENBQUNqQixTQUFwQjtBQUZLLE9BQXBCOztBQUlBLFVBQUlpQixDQUFDLENBQUNoQixPQUFGLENBQVVoQixNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3RCSCxRQUFBQSxNQUFNLENBQUNtQixPQUFQLEdBQWlCZ0IsQ0FBQyxDQUFDaEIsT0FBbkI7QUFDSDs7QUFDRCxVQUFJZ0IsQ0FBQyxDQUFDZixLQUFGLEtBQVksRUFBaEIsRUFBb0I7QUFDaEJwQixRQUFBQSxNQUFNLENBQUNvQixLQUFQLEdBQWVlLENBQUMsQ0FBQ2YsS0FBakI7QUFDSDs7QUFDRCxVQUFJZSxDQUFDLENBQUNkLE9BQUYsR0FBWSxDQUFoQixFQUFtQjtBQUNmckIsUUFBQUEsTUFBTSxDQUFDcUIsT0FBUCxHQUFpQmMsQ0FBQyxDQUFDZCxPQUFuQjtBQUNIOztBQUNENEMsTUFBQUEsSUFBSSxDQUFDc0IsTUFBTCxDQUFZLFFBQVosRUFBc0J2RixNQUF0QjtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE4LTIwMjAgVE9OIERFViBTT0xVVElPTlMgTFRELlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBTT0ZUV0FSRSBFVkFMVUFUSU9OIExpY2Vuc2UgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90IHVzZVxuICogdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXG4gKiBMaWNlbnNlIGF0OlxuICpcbiAqIGh0dHA6Ly93d3cudG9uLmRldi9saWNlbnNlc1xuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgVE9OIERFViBzb2Z0d2FyZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBAZmxvd1xuXG5pbXBvcnQgeyBEYXRhYmFzZSwgRG9jdW1lbnRDb2xsZWN0aW9uIH0gZnJvbSBcImFyYW5nb2pzXCI7XG5pbXBvcnQgeyBTcGFuLCBTcGFuQ29udGV4dCwgVHJhY2VyIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgeyBDb2xsZWN0aW9uTGlzdGVuZXIsIFN1YnNjcmlwdGlvbkxpc3RlbmVyLCBXYWl0Rm9yTGlzdGVuZXIgfSBmcm9tIFwiLi9hcmFuZ28tbGlzdGVuZXJzXCI7XG5pbXBvcnQgdHlwZSB7IFFDb25maWcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB0eXBlIHsgUUxvZyB9IGZyb20gXCIuL2xvZ3NcIjtcbmltcG9ydCBRTG9ncyBmcm9tIFwiLi9sb2dzXCI7XG5pbXBvcnQgdHlwZSB7IEFjY2Vzc1JpZ2h0cyB9IGZyb20gXCIuL2F1dGhcIjtcbmltcG9ydCB7IEF1dGggfSBmcm9tIFwiLi9hdXRoXCI7XG5pbXBvcnQgdHlwZSB7IFFUeXBlIH0gZnJvbSBcIi4vZGItdHlwZXNcIjtcbmltcG9ydCB7IFFQYXJhbXMgfSBmcm9tIFwiLi9kYi10eXBlc1wiO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuaW1wb3J0IHR5cGUgeyBGaWVsZFNlbGVjdGlvbiB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBwYXJzZVNlbGVjdGlvblNldCwgUmVnaXN0cnlNYXAsIHNlbGVjdGlvblRvU3RyaW5nLCB3cmFwIH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuXG5leHBvcnQgdHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHQgPSB7XG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIGF1dGg6IEF1dGgsXG4gICAgdHJhY2VyOiBUcmFjZXIsXG5cbiAgICByZW1vdGVBZGRyZXNzPzogc3RyaW5nLFxuICAgIGFjY2Vzc0tleTogc3RyaW5nLFxuICAgIHBhcmVudFNwYW46IChTcGFuIHwgU3BhbkNvbnRleHQgfCB0eXBlb2YgdW5kZWZpbmVkKSxcblxuICAgIHNoYXJlZDogTWFwPHN0cmluZywgYW55Pixcbn1cblxudHlwZSBPcmRlckJ5ID0ge1xuICAgIHBhdGg6IHN0cmluZyxcbiAgICBkaXJlY3Rpb246IHN0cmluZyxcbn1cblxudHlwZSBEYXRhYmFzZVF1ZXJ5ID0ge1xuICAgIGZpbHRlcjogYW55LFxuICAgIHNlbGVjdGlvbjogRmllbGRTZWxlY3Rpb25bXSxcbiAgICBvcmRlckJ5OiBPcmRlckJ5W10sXG4gICAgbGltaXQ6IG51bWJlcixcbiAgICB0aW1lb3V0OiBudW1iZXIsXG4gICAgdGV4dDogc3RyaW5nLFxuICAgIHBhcmFtczogeyBbc3RyaW5nXTogYW55IH0sXG4gICAgYWNjZXNzUmlnaHRzOiBBY2Nlc3NSaWdodHMsXG59XG5cbmV4cG9ydCB0eXBlIFF1ZXJ5U3RhdCA9IHtcbiAgICBlc3RpbWF0ZWRDb3N0OiBudW1iZXIsXG4gICAgc2xvdzogYm9vbGVhbixcbiAgICB0aW1lczogbnVtYmVyW10sXG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZG9jVHlwZTogUVR5cGU7XG5cbiAgICBsb2c6IFFMb2c7XG4gICAgYXV0aDogQXV0aDtcbiAgICB0cmFjZXI6IFRyYWNlcjtcbiAgICBkYjogRGF0YWJhc2U7XG4gICAgc2xvd0RiOiBEYXRhYmFzZTtcblxuICAgIGxpc3RlbmVyczogUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPjtcbiAgICBxdWVyeVN0YXRzOiBNYXA8c3RyaW5nLCBRdWVyeVN0YXQ+O1xuXG4gICAgbWF4UXVldWVTaXplOiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgbmFtZTogc3RyaW5nLFxuICAgICAgICBkb2NUeXBlOiBRVHlwZSxcbiAgICAgICAgbG9nczogUUxvZ3MsXG4gICAgICAgIGF1dGg6IEF1dGgsXG4gICAgICAgIHRyYWNlcjogVHJhY2VyLFxuICAgICAgICBkYjogRGF0YWJhc2UsXG4gICAgICAgIHNsb3dEYjogRGF0YWJhc2UsXG4gICAgKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZG9jVHlwZSA9IGRvY1R5cGU7XG5cbiAgICAgICAgdGhpcy5sb2cgPSBsb2dzLmNyZWF0ZShuYW1lKTtcbiAgICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICAgICAgdGhpcy50cmFjZXIgPSB0cmFjZXI7XG4gICAgICAgIHRoaXMuZGIgPSBkYjtcbiAgICAgICAgdGhpcy5zbG93RGIgPSBzbG93RGI7XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgUmVnaXN0cnlNYXA8Q29sbGVjdGlvbkxpc3RlbmVyPihgJHtuYW1lfSBsaXN0ZW5lcnNgKTtcbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzID0gbmV3IE1hcDxzdHJpbmcsIFF1ZXJ5U3RhdD4oKTtcbiAgICAgICAgdGhpcy5tYXhRdWV1ZVNpemUgPSAwO1xuICAgIH1cblxuICAgIC8vIFN1YnNjcmlwdGlvbnNcblxuICAgIG9uRG9jdW1lbnRJbnNlcnRPclVwZGF0ZShkb2M6IGFueSkge1xuICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXIuaXNGaWx0ZXJlZChkb2MpKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIub25Eb2N1bWVudEluc2VydE9yVXBkYXRlKGRvYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdWJzY3JpcHRpb25SZXNvbHZlcigpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1YnNjcmliZTogYXN5bmMgKF86IGFueSwgYXJnczogeyBmaWx0ZXI6IGFueSB9LCBjb250ZXh0OiBhbnksIGluZm86IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFjY2Vzc1JpZ2h0cyA9IGF3YWl0IHRoaXMuYXV0aC5nZXRBY2Nlc3NSaWdodHMoY29udGV4dC5hY2Nlc3NLZXkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kb2NUeXBlLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICBhcmdzLmZpbHRlciB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3Rpb25TZXQoaW5mby5vcGVyYXRpb24uc2VsZWN0aW9uU2V0LCB0aGlzLm5hbWUpLFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUXVlcmllc1xuXG4gICAgZ2V0QWRkaXRpb25hbENvbmRpdGlvbihhY2Nlc3NSaWdodHM6IEFjY2Vzc1JpZ2h0cywgcGFyYW1zOiBRUGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IGFjY291bnRzID0gYWNjZXNzUmlnaHRzLnJlc3RyaWN0VG9BY2NvdW50cztcbiAgICAgICAgaWYgKGFjY291bnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbmRpdGlvbiA9IGFjY291bnRzLmxlbmd0aCA9PT0gMVxuICAgICAgICAgICAgPyBgPT0gQCR7cGFyYW1zLmFkZChhY2NvdW50c1swXSl9YFxuICAgICAgICAgICAgOiBgSU4gWyR7YWNjb3VudHMubWFwKHggPT4gYEAke3BhcmFtcy5hZGQoeCl9YCkuam9pbignLCcpfV1gO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubmFtZSkge1xuICAgICAgICBjYXNlICdhY2NvdW50cyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5fa2V5ICR7Y29uZGl0aW9ufWA7XG4gICAgICAgIGNhc2UgJ3RyYW5zYWN0aW9ucyc6XG4gICAgICAgICAgICByZXR1cm4gYGRvYy5hY2NvdW50X2FkZHIgJHtjb25kaXRpb259YDtcbiAgICAgICAgY2FzZSAnbWVzc2FnZXMnOlxuICAgICAgICAgICAgcmV0dXJuIGAoZG9jLnNyYyAke2NvbmRpdGlvbn0pIE9SIChkb2MuZHN0ICR7Y29uZGl0aW9ufSlgO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdmYWxzZSc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjcmVhdGVEYXRhYmFzZVF1ZXJ5KFxuICAgICAgICBhcmdzOiB7XG4gICAgICAgICAgICBmaWx0ZXI/OiBhbnksXG4gICAgICAgICAgICBvcmRlckJ5PzogT3JkZXJCeVtdLFxuICAgICAgICAgICAgbGltaXQ/OiBudW1iZXIsXG4gICAgICAgICAgICB0aW1lb3V0PzogbnVtYmVyLFxuICAgICAgICB9LFxuICAgICAgICBzZWxlY3Rpb25JbmZvOiBhbnksXG4gICAgICAgIGFjY2Vzc1JpZ2h0czogQWNjZXNzUmlnaHRzLFxuICAgICk6ID9EYXRhYmFzZVF1ZXJ5IHtcbiAgICAgICAgY29uc3QgZmlsdGVyID0gYXJncy5maWx0ZXIgfHwge307XG4gICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBRUGFyYW1zKCk7XG4gICAgICAgIGNvbnN0IHByaW1hcnlDb25kaXRpb24gPSBPYmplY3Qua2V5cyhmaWx0ZXIpLmxlbmd0aCA+IDAgPyB0aGlzLmRvY1R5cGUucWwocGFyYW1zLCAnZG9jJywgZmlsdGVyKSA6ICcnO1xuICAgICAgICBjb25zdCBhZGRpdGlvbmFsQ29uZGl0aW9uID0gdGhpcy5nZXRBZGRpdGlvbmFsQ29uZGl0aW9uKGFjY2Vzc1JpZ2h0cywgcGFyYW1zKTtcbiAgICAgICAgaWYgKHByaW1hcnlDb25kaXRpb24gPT09ICdmYWxzZScgfHwgYWRkaXRpb25hbENvbmRpdGlvbiA9PT0gJ2ZhbHNlJykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvbmRpdGlvbiA9IChwcmltYXJ5Q29uZGl0aW9uICYmIGFkZGl0aW9uYWxDb25kaXRpb24pXG4gICAgICAgICAgICA/IGAoJHtwcmltYXJ5Q29uZGl0aW9ufSkgQU5EICgke2FkZGl0aW9uYWxDb25kaXRpb259KWBcbiAgICAgICAgICAgIDogKHByaW1hcnlDb25kaXRpb24gfHwgYWRkaXRpb25hbENvbmRpdGlvbik7XG4gICAgICAgIGNvbnN0IGZpbHRlclNlY3Rpb24gPSBjb25kaXRpb24gPyBgRklMVEVSICR7Y29uZGl0aW9ufWAgOiAnJztcbiAgICAgICAgY29uc3Qgc2VsZWN0aW9uID0gcGFyc2VTZWxlY3Rpb25TZXQoc2VsZWN0aW9uSW5mbywgdGhpcy5uYW1lKTtcbiAgICAgICAgY29uc3Qgb3JkZXJCeTogT3JkZXJCeVtdID0gYXJncy5vcmRlckJ5IHx8IFtdO1xuICAgICAgICBjb25zdCBsaW1pdDogbnVtYmVyID0gYXJncy5saW1pdCB8fCA1MDtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IE51bWJlcihhcmdzLnRpbWVvdXQpIHx8IDA7XG4gICAgICAgIGNvbnN0IG9yZGVyQnlUZXh0ID0gb3JkZXJCeVxuICAgICAgICAgICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSAoZmllbGQuZGlyZWN0aW9uICYmIGZpZWxkLmRpcmVjdGlvbi50b0xvd2VyQ2FzZSgpID09PSAnZGVzYycpXG4gICAgICAgICAgICAgICAgICAgID8gJyBERVNDJ1xuICAgICAgICAgICAgICAgICAgICA6ICcnO1xuICAgICAgICAgICAgICAgIHJldHVybiBgZG9jLiR7ZmllbGQucGF0aC5yZXBsYWNlKC9cXGJpZFxcYi9naSwgJ19rZXknKX0ke2RpcmVjdGlvbn1gO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5qb2luKCcsICcpO1xuXG4gICAgICAgIGNvbnN0IHNvcnRTZWN0aW9uID0gb3JkZXJCeVRleHQgIT09ICcnID8gYFNPUlQgJHtvcmRlckJ5VGV4dH1gIDogJyc7XG4gICAgICAgIGNvbnN0IGxpbWl0VGV4dCA9IE1hdGgubWluKGxpbWl0LCA1MCk7XG4gICAgICAgIGNvbnN0IGxpbWl0U2VjdGlvbiA9IGBMSU1JVCAke2xpbWl0VGV4dH1gO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSBgXG4gICAgICAgICAgICBGT1IgZG9jIElOICR7dGhpcy5uYW1lfVxuICAgICAgICAgICAgJHtmaWx0ZXJTZWN0aW9ufVxuICAgICAgICAgICAgJHtzb3J0U2VjdGlvbn1cbiAgICAgICAgICAgICR7bGltaXRTZWN0aW9ufVxuICAgICAgICAgICAgUkVUVVJOIGRvY2A7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbixcbiAgICAgICAgICAgIG9yZGVyQnksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMudmFsdWVzLFxuICAgICAgICAgICAgYWNjZXNzUmlnaHRzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGFzeW5jIGVuc3VyZVF1ZXJ5U3RhdChxOiBEYXRhYmFzZVF1ZXJ5KTogUHJvbWlzZTxRdWVyeVN0YXQ+IHtcbiAgICAgICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLnF1ZXJ5U3RhdHMuZ2V0KHEudGV4dCk7XG4gICAgICAgIGlmIChleGlzdGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcGxhbiA9IChhd2FpdCB0aGlzLmRiLmV4cGxhaW4ocS50ZXh0LCBxLnBhcmFtcykpLnBsYW47XG4gICAgICAgIGNvbnN0IHN0YXQgPSB7XG4gICAgICAgICAgICBlc3RpbWF0ZWRDb3N0OiBwbGFuLmVzdGltYXRlZENvc3QsXG4gICAgICAgICAgICBzbG93OiBmYWxzZSxcbiAgICAgICAgICAgIHRpbWVzOiBbXSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHBsYW4ubm9kZXMuZmluZChub2RlID0+IG5vZGUudHlwZSA9PT0gJ0VudW1lcmF0ZUNvbGxlY3Rpb25Ob2RlJykpIHtcbiAgICAgICAgICAgIHN0YXQuc2xvdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5xdWVyeVN0YXRzLnNldChxLnRleHQsIHN0YXQpO1xuICAgICAgICByZXR1cm4gc3RhdDtcbiAgICB9XG5cbiAgICBxdWVyeVJlc29sdmVyKCkge1xuICAgICAgICByZXR1cm4gYXN5bmMgKHBhcmVudDogYW55LCBhcmdzOiBhbnksIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCwgaW5mbzogYW55KSA9PiB3cmFwKHRoaXMubG9nLCAnUVVFUlknLCBhcmdzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhY2Nlc3NSaWdodHMgPSBhd2FpdCBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dC5hY2Nlc3NLZXkgfHwgYXJncy5hY2Nlc3NLZXkpO1xuICAgICAgICAgICAgY29uc3QgcSA9IHRoaXMuY3JlYXRlRGF0YWJhc2VRdWVyeShhcmdzLCBpbmZvLm9wZXJhdGlvbi5zZWxlY3Rpb25TZXQsIGFjY2Vzc1JpZ2h0cyk7XG4gICAgICAgICAgICBpZiAoIXEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvZy5kZWJ1ZygnUVVFUlknLCBhcmdzLCAwLCAnU0tJUFBFRCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3Qgc3RhdCA9IGF3YWl0IHRoaXMuZW5zdXJlUXVlcnlTdGF0KHEpO1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gcS50aW1lb3V0ID4gMFxuICAgICAgICAgICAgICAgID8gYXdhaXQgdGhpcy5xdWVyeVdhaXRGb3IocSwgc3RhdCwgY29udGV4dC5wYXJlbnRTcGFuKVxuICAgICAgICAgICAgICAgIDogYXdhaXQgdGhpcy5xdWVyeShxLCBzdGF0LCBjb250ZXh0LnBhcmVudFNwYW4pO1xuICAgICAgICAgICAgdGhpcy5sb2cuZGVidWcoJ1FVRVJZJywgYXJncywgKERhdGUubm93KCkgLSBzdGFydCkgLyAxMDAwLCBzdGF0LnNsb3cgPyAnU0xPVycgOiAnRkFTVCcsIGNvbnRleHQucmVtb3RlQWRkcmVzcyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgc2V0UXVlcnlUcmFjZVBhcmFtcyhxOiBEYXRhYmFzZVF1ZXJ5LCBzcGFuOiBTcGFuKSB7XG4gICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0ge1xuICAgICAgICAgICAgZmlsdGVyOiBxLmZpbHRlcixcbiAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uVG9TdHJpbmcocS5zZWxlY3Rpb24pLFxuICAgICAgICB9O1xuICAgICAgICBpZiAocS5vcmRlckJ5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHBhcmFtcy5vcmRlckJ5ID0gcS5vcmRlckJ5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChxLmxpbWl0ICE9PSA1MCkge1xuICAgICAgICAgICAgcGFyYW1zLmxpbWl0ID0gcS5saW1pdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAocS50aW1lb3V0ID4gMCkge1xuICAgICAgICAgICAgcGFyYW1zLnRpbWVvdXQgPSBxLnRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHBhcmFtcyk7XG4gICAgfVxuXG4gICAgYXN5bmMgcXVlcnkocTogRGF0YWJhc2VRdWVyeSwgc3RhdDogUXVlcnlTdGF0LCBwYXJlbnRTcGFuPzogKFNwYW4gfCBTcGFuQ29udGV4dCkpOiBQcm9taXNlPGFueT4ge1xuICAgICAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0aGlzLnRyYWNlciwgYCR7dGhpcy5uYW1lfS5xdWVyeWAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uLnNldFF1ZXJ5VHJhY2VQYXJhbXMocSwgc3Bhbik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5xdWVyeURhdGFiYXNlKHEsIHN0YXQpO1xuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cbiAgICBhc3luYyBxdWVyeURhdGFiYXNlKHE6IERhdGFiYXNlUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGNvbnN0IGRiID0gc3RhdC5zbG93ID8gdGhpcy5zbG93RGIgOiB0aGlzLmRiO1xuICAgICAgICBjb25zdCBzdGFydCA9IERhdGUubm93KCk7XG4gICAgICAgIGNvbnN0IGN1cnNvciA9IGF3YWl0IGRiLnF1ZXJ5KHEudGV4dCwgcS5wYXJhbXMpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjdXJzb3IuYWxsKCk7XG4gICAgICAgIHN0YXQudGltZXMucHVzaChEYXRlLm5vdygpIC0gc3RhcnQpO1xuICAgICAgICBpZiAoc3RhdC50aW1lcy5sZW5ndGggPiAxMDApIHtcbiAgICAgICAgICAgIHN0YXQudGltZXMuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuXG4gICAgYXN5bmMgcXVlcnlXYWl0Rm9yKHE6IERhdGFiYXNlUXVlcnksIHN0YXQ6IFF1ZXJ5U3RhdCwgcGFyZW50U3Bhbj86IChTcGFuIHwgU3BhbkNvbnRleHQpKTogUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodGhpcy50cmFjZXIsIGAke3RoaXMubmFtZX0ud2FpdEZvcmAsIGFzeW5jIChzcGFuOiBTcGFuKSA9PiB7XG4gICAgICAgICAgICBDb2xsZWN0aW9uLnNldFF1ZXJ5VHJhY2VQYXJhbXMocSwgc3Bhbik7XG4gICAgICAgICAgICBsZXQgd2FpdEZvcjogP1dhaXRGb3JMaXN0ZW5lciA9IG51bGw7XG4gICAgICAgICAgICBsZXQgZm9yY2VUaW1lcklkOiA/VGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIGxldCByZXNvbHZlZEJ5OiA/c3RyaW5nID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb25RdWVyeSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY2hlY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5RGF0YWJhc2UocSwgc3RhdCkudGhlbigoZG9jcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmVzb2x2ZWRCeSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JjZVRpbWVySWQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdxdWVyeSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRvY3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yY2VUaW1lcklkID0gc2V0VGltZW91dChjaGVjaywgNV8wMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2soKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBvbkNoYW5nZXNGZWVkID0gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG5ldyBXYWl0Rm9yTGlzdGVuZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRvY1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHEuYWNjZXNzUmlnaHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgcS5maWx0ZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBxLnNlbGVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIChkb2MpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc29sdmVkQnkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICdsaXN0ZW5lcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoW2RvY10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9uVGltZW91dCA9IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZXNvbHZlZEJ5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZWRCeSA9ICd0aW1lb3V0JztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgcS50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICAgICAgICAgICAgICBvblF1ZXJ5LFxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZXNGZWVkLFxuICAgICAgICAgICAgICAgICAgICBvblRpbWVvdXQsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgc3Bhbi5zZXRUYWcoJ3Jlc29sdmVkJywgcmVzb2x2ZWRCeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgaWYgKHdhaXRGb3IgIT09IG51bGwgJiYgd2FpdEZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdhaXRGb3IuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgd2FpdEZvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChmb3JjZVRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGZvcmNlVGltZXJJZCk7XG4gICAgICAgICAgICAgICAgICAgIGZvcmNlVGltZXJJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCBwYXJlbnRTcGFuKTtcbiAgICB9XG5cblxuICAgIGRiQ29sbGVjdGlvbigpOiBEb2N1bWVudENvbGxlY3Rpb24ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5jb2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NCeUtleShrZXk6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gICAgICAgIGlmICgha2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubG9nLCAnRkVUQ0hfRE9DX0JZX0tFWScsIGtleSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGJDb2xsZWN0aW9uKCkuZG9jdW1lbnQoa2V5LCB0cnVlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXN5bmMgZmV0Y2hEb2NzQnlLZXlzKGtleXM6IHN0cmluZ1tdKTogUHJvbWlzZTxhbnlbXT4ge1xuICAgICAgICBpZiAoIWtleXMgfHwga2V5cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChrZXlzLm1hcChrZXkgPT4gdGhpcy5mZXRjaERvY0J5S2V5KGtleSkpKTtcbiAgICB9XG59XG5cbiJdfQ==