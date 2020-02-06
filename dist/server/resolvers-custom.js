"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.attachCustomResolvers = attachCustomResolvers;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _fs = _interopRequireDefault(require("fs"));

var _kafkajs = require("kafkajs");

var _opentracing = _interopRequireWildcard(require("opentracing"));

var _arango = _interopRequireDefault(require("./arango"));

var _config = require("./config");

var _path = _interopRequireDefault(require("path"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _tracer = require("./tracer");

function isObject(test) {
  return (0, _typeof2["default"])(test) === 'object' && test !== null;
}

function overrideObject(original, overrides) {
  Object.entries(overrides).forEach(function (_ref) {
    var _ref2 = (0, _slicedToArray2["default"])(_ref, 2),
        name = _ref2[0],
        overrideValue = _ref2[1];

    if (name in original && isObject(overrideValue) && isObject(original[name])) {
      overrideObject(original[name], overrideValue);
    } else {
      original[name] = overrideValue;
    }
  });
}

// Query
function info() {
  var pkg = JSON.parse(_fs["default"].readFileSync(_path["default"].resolve(__dirname, '..', '..', 'package.json')));
  return {
    version: pkg.version
  };
}

function getAccountsCount(_x, _x2, _x3) {
  return _getAccountsCount.apply(this, arguments);
}

function _getAccountsCount() {
  _getAccountsCount = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(_parent, args, context) {
    var tracer;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            tracer = context.db.tracer;
            return _context2.abrupt("return", _tracer.QTracer.trace(tracer, 'getAccountsCount',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee() {
              var result, counts;
              return _regenerator["default"].wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      _context.next = 2;
                      return context.db.query("RETURN LENGTH(accounts)", {});

                    case 2:
                      result = _context.sent;
                      counts = result;
                      return _context.abrupt("return", counts.length > 0 ? counts[0] : 0);

                    case 5:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee);
            })), _tracer.QTracer.getParentSpan(tracer, context)));

          case 2:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _getAccountsCount.apply(this, arguments);
}

function getTransactionsCount(_x4, _x5, _x6) {
  return _getTransactionsCount.apply(this, arguments);
}

function _getTransactionsCount() {
  _getTransactionsCount = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee4(_parent, args, context) {
    var tracer;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            tracer = context.db.tracer;
            return _context4.abrupt("return", _tracer.QTracer.trace(tracer, 'getTransactionsCount',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee3() {
              var result, counts;
              return _regenerator["default"].wrap(function _callee3$(_context3) {
                while (1) {
                  switch (_context3.prev = _context3.next) {
                    case 0:
                      _context3.next = 2;
                      return context.db.query("RETURN LENGTH(transactions)", {});

                    case 2:
                      result = _context3.sent;
                      counts = result;
                      return _context3.abrupt("return", counts.length > 0 ? counts[0] : 0);

                    case 5:
                    case "end":
                      return _context3.stop();
                  }
                }
              }, _callee3);
            })), _tracer.QTracer.getParentSpan(tracer, context)));

          case 2:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _getTransactionsCount.apply(this, arguments);
}

function getAccountsTotalBalance(_x7, _x8, _x9) {
  return _getAccountsTotalBalance.apply(this, arguments);
} // Mutation


function _getAccountsTotalBalance() {
  _getAccountsTotalBalance = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee6(_parent, args, context) {
    var tracer;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            tracer = context.db.tracer;
            return _context6.abrupt("return", _tracer.QTracer.trace(tracer, 'getAccountsTotalBalance',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee5() {
              var result, parts;
              return _regenerator["default"].wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.next = 2;
                      return context.db.query("\n            LET d = 16777216\n            FOR a in accounts\n            LET b = TO_NUMBER(CONCAT(\"0x\", SUBSTRING(a.balance, 2)))\n            COLLECT AGGREGATE\n                hs = SUM(FLOOR(b / d)),\n                ls = SUM(b % (d - 1))\n            RETURN { hs, ls }\n        ", {});

                    case 2:
                      result = _context5.sent;
                      parts = result[0]; //$FlowFixMe

                      return _context5.abrupt("return", (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString());

                    case 5:
                    case "end":
                      return _context5.stop();
                  }
                }
              }, _callee5);
            })), _tracer.QTracer.getParentSpan(tracer, context)));

          case 2:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return _getAccountsTotalBalance.apply(this, arguments);
}

function postRequestsUsingRest(_x10, _x11, _x12) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(requests, context, span) {
    var config, url, response, message;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            config = context.config.requests;
            url = "".concat((0, _config.ensureProtocol)(config.server, 'http'), "/topics/").concat(config.topic);
            _context7.next = 4;
            return (0, _nodeFetch["default"])(url, {
              method: 'POST',
              mode: 'cors',
              cache: 'no-cache',
              credentials: 'same-origin',
              headers: {
                'Content-Type': 'application/json'
              },
              redirect: 'follow',
              referrer: 'no-referrer',
              body: JSON.stringify({
                records: requests.map(function (request) {
                  return {
                    key: request.id,
                    value: request.body
                  };
                })
              })
            });

          case 4:
            response = _context7.sent;

            if (!(response.status !== 200)) {
              _context7.next = 12;
              break;
            }

            _context7.t0 = "Post requests failed: ";
            _context7.next = 9;
            return response.text();

          case 9:
            _context7.t1 = _context7.sent;
            message = _context7.t0.concat.call(_context7.t0, _context7.t1);
            throw new Error(message);

          case 12:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));
  return _postRequestsUsingRest.apply(this, arguments);
}

function postRequestsUsingKafka(_x13, _x14, _x15) {
  return _postRequestsUsingKafka.apply(this, arguments);
}

function _postRequestsUsingKafka() {
  _postRequestsUsingKafka = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee11(requests, context, span) {
    var ensureShared, config, producer, messages;
    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            ensureShared =
            /*#__PURE__*/
            function () {
              var _ref6 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee8(name, createValue) {
                var value;
                return _regenerator["default"].wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        if (!context.shared.has(name)) {
                          _context8.next = 2;
                          break;
                        }

                        return _context8.abrupt("return", context.shared.get(name));

                      case 2:
                        _context8.next = 4;
                        return createValue();

                      case 4:
                        value = _context8.sent;
                        context.shared.set(name, value);
                        return _context8.abrupt("return", value);

                      case 7:
                      case "end":
                        return _context8.stop();
                    }
                  }
                }, _callee8);
              }));

              return function ensureShared(_x19, _x20) {
                return _ref6.apply(this, arguments);
              };
            }();

            config = context.config.requests;
            _context11.next = 4;
            return ensureShared('producer',
            /*#__PURE__*/
            (0, _asyncToGenerator2["default"])(
            /*#__PURE__*/
            _regenerator["default"].mark(function _callee10() {
              var kafka, newProducer;
              return _regenerator["default"].wrap(function _callee10$(_context10) {
                while (1) {
                  switch (_context10.prev = _context10.next) {
                    case 0:
                      _context10.next = 2;
                      return ensureShared('kafka',
                      /*#__PURE__*/
                      (0, _asyncToGenerator2["default"])(
                      /*#__PURE__*/
                      _regenerator["default"].mark(function _callee9() {
                        return _regenerator["default"].wrap(function _callee9$(_context9) {
                          while (1) {
                            switch (_context9.prev = _context9.next) {
                              case 0:
                                return _context9.abrupt("return", new _kafkajs.Kafka({
                                  clientId: 'q-server',
                                  brokers: [config.server]
                                }));

                              case 1:
                              case "end":
                                return _context9.stop();
                            }
                          }
                        }, _callee9);
                      })));

                    case 2:
                      kafka = _context10.sent;
                      newProducer = kafka.producer();
                      _context10.next = 6;
                      return newProducer.connect();

                    case 6:
                      return _context10.abrupt("return", newProducer);

                    case 7:
                    case "end":
                      return _context10.stop();
                  }
                }
              }, _callee10);
            })));

          case 4:
            producer = _context11.sent;
            messages = requests.map(function (request) {
              var keyBuffer = Buffer.from(request.id, 'base64');
              var traceBuffer = Buffer.from([]);
              context.db.tracer.inject(span, _opentracing["default"].FORMAT_BINARY, traceBuffer);
              return {
                key: Buffer.concat([keyBuffer, traceBuffer]),
                value: Buffer.from(request.body, 'base64')
              };
            });
            _context11.next = 8;
            return producer.send({
              topic: config.topic,
              messages: messages
            });

          case 8:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));
  return _postRequestsUsingKafka.apply(this, arguments);
}

function postRequests(_x16, _x17, _x18) {
  return _postRequests.apply(this, arguments);
}

function _postRequests() {
  _postRequests = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee13(_, args, context) {
    var requests, tracer;
    return _regenerator["default"].wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            requests = args.requests;

            if (requests) {
              _context13.next = 3;
              break;
            }

            return _context13.abrupt("return", []);

          case 3:
            tracer = context.db.tracer;
            return _context13.abrupt("return", _tracer.QTracer.trace(tracer, "postRequests",
            /*#__PURE__*/
            function () {
              var _ref9 = (0, _asyncToGenerator2["default"])(
              /*#__PURE__*/
              _regenerator["default"].mark(function _callee12(span) {
                return _regenerator["default"].wrap(function _callee12$(_context12) {
                  while (1) {
                    switch (_context12.prev = _context12.next) {
                      case 0:
                        span.setTag('params', requests);
                        _context12.prev = 1;

                        if (!(context.config.requests.mode === 'rest')) {
                          _context12.next = 7;
                          break;
                        }

                        _context12.next = 5;
                        return postRequestsUsingRest(requests, context, span);

                      case 5:
                        _context12.next = 9;
                        break;

                      case 7:
                        _context12.next = 9;
                        return postRequestsUsingKafka(requests, context, span);

                      case 9:
                        context.db.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
                        _context12.next = 16;
                        break;

                      case 12:
                        _context12.prev = 12;
                        _context12.t0 = _context12["catch"](1);
                        context.db.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
                        throw _context12.t0;

                      case 16:
                        return _context12.abrupt("return", requests.map(function (x) {
                          return x.id;
                        }));

                      case 17:
                      case "end":
                        return _context12.stop();
                    }
                  }
                }, _callee12, null, [[1, 12]]);
              }));

              return function (_x21) {
                return _ref9.apply(this, arguments);
              };
            }(), _tracer.QTracer.getParentSpan(tracer, context)));

          case 5:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13);
  }));
  return _postRequests.apply(this, arguments);
}

var resolversCustom = {
  Query: {
    info: info,
    getAccountsCount: getAccountsCount,
    getTransactionsCount: getTransactionsCount,
    getAccountsTotalBalance: getAccountsTotalBalance
  },
  Mutation: {
    postRequests: postRequests
  }
};

function attachCustomResolvers(original) {
  overrideObject(original, resolversCustom);
  return original;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwicXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwicG9zdFJlcXVlc3RzVXNpbmdSZXN0IiwicmVxdWVzdHMiLCJzcGFuIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJFcnJvciIsInBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EiLCJlbnN1cmVTaGFyZWQiLCJjcmVhdGVWYWx1ZSIsInNoYXJlZCIsImhhcyIsImdldCIsInNldCIsIkthZmthIiwiY2xpZW50SWQiLCJicm9rZXJzIiwia2Fma2EiLCJuZXdQcm9kdWNlciIsInByb2R1Y2VyIiwiY29ubmVjdCIsIm1lc3NhZ2VzIiwia2V5QnVmZmVyIiwiQnVmZmVyIiwiZnJvbSIsInRyYWNlQnVmZmVyIiwiaW5qZWN0IiwidHJhY2luZyIsIkZPUk1BVF9CSU5BUlkiLCJjb25jYXQiLCJzZW5kIiwicG9zdFJlcXVlc3RzIiwiXyIsInNldFRhZyIsImxvZyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsIngiLCJyZXNvbHZlcnNDdXN0b20iLCJRdWVyeSIsIk11dGF0aW9uIiwiYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBRUEsU0FBU0EsUUFBVCxDQUFrQkMsSUFBbEIsRUFBc0M7QUFDbEMsU0FBTyx5QkFBT0EsSUFBUCxNQUFnQixRQUFoQixJQUE0QkEsSUFBSSxLQUFLLElBQTVDO0FBQ0g7O0FBRUQsU0FBU0MsY0FBVCxDQUF3QkMsUUFBeEIsRUFBdUNDLFNBQXZDLEVBQXVEO0FBQ25EQyxFQUFBQSxNQUFNLENBQUNDLE9BQVAsQ0FBZUYsU0FBZixFQUEwQkcsT0FBMUIsQ0FBa0MsZ0JBQTJCO0FBQUE7QUFBQSxRQUF6QkMsSUFBeUI7QUFBQSxRQUFuQkMsYUFBbUI7O0FBQ3pELFFBQUtELElBQUksSUFBSUwsUUFBVCxJQUFzQkgsUUFBUSxDQUFDUyxhQUFELENBQTlCLElBQWlEVCxRQUFRLENBQUNHLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULENBQTdELEVBQStFO0FBQzNFTixNQUFBQSxjQUFjLENBQUNDLFFBQVEsQ0FBQ0ssSUFBRCxDQUFULEVBQWlCQyxhQUFqQixDQUFkO0FBQ0gsS0FGRCxNQUVPO0FBQ0hOLE1BQUFBLFFBQVEsQ0FBQ0ssSUFBRCxDQUFSLEdBQWlCQyxhQUFqQjtBQUNIO0FBQ0osR0FORDtBQU9IOztBQWtCRDtBQUVBLFNBQVNDLElBQVQsR0FBc0I7QUFDbEIsTUFBTUMsR0FBRyxHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBWUMsZUFBR0MsWUFBSCxDQUFnQkMsaUJBQUtD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IEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IEthZmthLCBQcm9kdWNlciB9IGZyb20gXCJrYWZrYWpzXCI7XG5pbXBvcnQgdHJhY2luZywgeyBTcGFuIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxudHlwZSBDb250ZXh0ID0ge1xuICAgIGRiOiBBcmFuZ28sXG4gICAgY29uZmlnOiBRQ29uZmlnLFxuICAgIHJlbW90ZUFkZHJlc3M/OiBzdHJpbmcsXG4gICAgc2hhcmVkOiBNYXA8c3RyaW5nLCBhbnk+LFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c0NvdW50KF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgJ2dldEFjY291bnRzQ291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5xdWVyeShgUkVUVVJOIExFTkdUSChhY2NvdW50cylgLCB7fSk7XG4gICAgICAgIGNvbnN0IGNvdW50cyA9IChyZXN1bHQ6IG51bWJlcltdKTtcbiAgICAgICAgcmV0dXJuIGNvdW50cy5sZW5ndGggPiAwID8gY291bnRzWzBdIDogMDtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0VHJhbnNhY3Rpb25zQ291bnQoX3BhcmVudCwgYXJncywgY29udGV4dDogQ29udGV4dCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0VHJhbnNhY3Rpb25zQ291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5xdWVyeShgUkVUVVJOIExFTkdUSCh0cmFuc2FjdGlvbnMpYCwge30pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPFN0cmluZz4ge1xuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgJ2dldEFjY291bnRzVG90YWxCYWxhbmNlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAvKlxuICAgICAgICBCZWNhdXNlIGFyYW5nbyBjYW4gbm90IHN1bSBCaWdJbnQncyB3ZSBuZWVkIHRvIHN1bSBzZXBhcmF0ZWx5OlxuICAgICAgICBocyA9IFNVTSBvZiBoaWdoIGJpdHMgKGZyb20gMjQtYml0IGFuZCBoaWdoZXIpXG4gICAgICAgIGxzID0gU1VNIG9mIGxvd2VyIDI0IGJpdHNcbiAgICAgICAgQW5kIHRoZSB0b3RhbCByZXN1bHQgaXMgKGhzIDw8IDI0KSArIGxzXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIucXVlcnkoYFxuICAgICAgICAgICAgTEVUIGQgPSAxNjc3NzIxNlxuICAgICAgICAgICAgRk9SIGEgaW4gYWNjb3VudHNcbiAgICAgICAgICAgIExFVCBiID0gVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsIFNVQlNUUklORyhhLmJhbGFuY2UsIDIpKSlcbiAgICAgICAgICAgIENPTExFQ1QgQUdHUkVHQVRFXG4gICAgICAgICAgICAgICAgaHMgPSBTVU0oRkxPT1IoYiAvIGQpKSxcbiAgICAgICAgICAgICAgICBscyA9IFNVTShiICUgKGQgLSAxKSlcbiAgICAgICAgICAgIFJFVFVSTiB7IGhzLCBscyB9XG4gICAgICAgIGAsIHt9KTtcbiAgICAgICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7IGhzOiBudW1iZXIsIGxzOiBudW1iZXIgfVtdKVswXTtcbiAgICAgICAgLy8kRmxvd0ZpeE1lXG4gICAgICAgIHJldHVybiAoQmlnSW50KHBhcnRzLmhzKSAqIEJpZ0ludCgweDEwMDAwMDApICsgQmlnSW50KHBhcnRzLmxzKSkudG9TdHJpbmcoKTtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuLy8gTXV0YXRpb25cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IENvbnRleHQsIHNwYW46IFNwYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjb25maWcgPSBjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cztcbiAgICBjb25zdCB1cmwgPSBgJHtlbnN1cmVQcm90b2NvbChjb25maWcuc2VydmVyLCAnaHR0cCcpfS90b3BpY3MvJHtjb25maWcudG9waWN9YDtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgbW9kZTogJ2NvcnMnLFxuICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcbiAgICAgICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGlyZWN0OiAnZm9sbG93JyxcbiAgICAgICAgcmVmZXJyZXI6ICduby1yZWZlcnJlcicsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIHJlY29yZHM6IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4gKHtcbiAgICAgICAgICAgICAgICBrZXk6IHJlcXVlc3QuaWQsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlcXVlc3QuYm9keSxcbiAgICAgICAgICAgIH0pKSxcbiAgICAgICAgfSksXG4gICAgfSk7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBgUG9zdCByZXF1ZXN0cyBmYWlsZWQ6ICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWA7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHM6IFJlcXVlc3RbXSwgY29udGV4dDogQ29udGV4dCwgc3BhbjogU3Bhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVuc3VyZVNoYXJlZCA9IGFzeW5jIChuYW1lLCBjcmVhdGVWYWx1ZTogKCkgPT4gUHJvbWlzZTxhbnk+KSA9PiB7XG4gICAgICAgIGlmIChjb250ZXh0LnNoYXJlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNoYXJlZC5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjcmVhdGVWYWx1ZSgpO1xuICAgICAgICBjb250ZXh0LnNoYXJlZC5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHByb2R1Y2VyOiBQcm9kdWNlciA9IGF3YWl0IGVuc3VyZVNoYXJlZCgncHJvZHVjZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGthZmthOiBLYWZrYSA9IGF3YWl0IGVuc3VyZVNoYXJlZCgna2Fma2EnLCBhc3luYyAoKSA9PiBuZXcgS2Fma2Eoe1xuICAgICAgICAgICAgY2xpZW50SWQ6ICdxLXNlcnZlcicsXG4gICAgICAgICAgICBicm9rZXJzOiBbY29uZmlnLnNlcnZlcl1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBuZXdQcm9kdWNlciA9IGthZmthLnByb2R1Y2VyKCk7XG4gICAgICAgIGF3YWl0IG5ld1Byb2R1Y2VyLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIG5ld1Byb2R1Y2VyO1xuXG4gICAgfSk7XG4gICAgY29uc3QgbWVzc2FnZXMgPSByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+IHtcbiAgICAgICAgY29uc3Qga2V5QnVmZmVyID0gQnVmZmVyLmZyb20ocmVxdWVzdC5pZCwgJ2Jhc2U2NCcpO1xuICAgICAgICBjb25zdCB0cmFjZUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFtdKTtcbiAgICAgICAgY29udGV4dC5kYi50cmFjZXIuaW5qZWN0KHNwYW4sIHRyYWNpbmcuRk9STUFUX0JJTkFSWSwgdHJhY2VCdWZmZXIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2V5OiBCdWZmZXIuY29uY2F0KFtrZXlCdWZmZXIsIHRyYWNlQnVmZmVyXSksXG4gICAgICAgICAgICB2YWx1ZTogQnVmZmVyLmZyb20ocmVxdWVzdC5ib2R5LCAnYmFzZTY0JyksXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgYXdhaXQgcHJvZHVjZXIuc2VuZCh7XG4gICAgICAgIHRvcGljOiBjb25maWcudG9waWMsXG4gICAgICAgIG1lc3NhZ2VzLFxuICAgIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHMoXywgYXJnczogeyByZXF1ZXN0czogUmVxdWVzdFtdIH0sIGNvbnRleHQ6IENvbnRleHQpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVxdWVzdHM6ID8oUmVxdWVzdFtdKSA9IGFyZ3MucmVxdWVzdHM7XG4gICAgaWYgKCFyZXF1ZXN0cykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCBcInBvc3RSZXF1ZXN0c1wiLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgcmVxdWVzdHMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGNvbnRleHQuY29uZmlnLnJlcXVlc3RzLm1vZGUgPT09ICdyZXN0Jykge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0cywgY29udGV4dCwgc3Bhbik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGF3YWl0IHBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EocmVxdWVzdHMsIGNvbnRleHQsIHNwYW4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5kYi5sb2cuZGVidWcoJ3Bvc3RSZXF1ZXN0cycsICdQT1NURUQnLCBhcmdzLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29udGV4dC5kYi5sb2cuZGVidWcoJ3Bvc3RSZXF1ZXN0cycsICdGQUlMRUQnLCBhcmdzLCBjb250ZXh0LnJlbW90ZUFkZHJlc3MpO1xuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcXVlc3RzLm1hcCh4ID0+IHguaWQpO1xuICAgIH0sIFFUcmFjZXIuZ2V0UGFyZW50U3Bhbih0cmFjZXIsIGNvbnRleHQpKTtcbn1cblxuY29uc3QgcmVzb2x2ZXJzQ3VzdG9tID0ge1xuICAgIFF1ZXJ5OiB7XG4gICAgICAgIGluZm8sXG4gICAgICAgIGdldEFjY291bnRzQ291bnQsXG4gICAgICAgIGdldFRyYW5zYWN0aW9uc0NvdW50LFxuICAgICAgICBnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSxcbiAgICB9LFxuICAgIE11dGF0aW9uOiB7XG4gICAgICAgIHBvc3RSZXF1ZXN0cyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEN1c3RvbVJlc29sdmVycyhvcmlnaW5hbDogYW55KTogYW55IHtcbiAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbCwgcmVzb2x2ZXJzQ3VzdG9tKTtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG59XG4iXX0=