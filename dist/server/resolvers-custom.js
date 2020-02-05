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

var _qAuth = _interopRequireDefault(require("./q-auth"));

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
                      return context.auth.requireGrantedAccess(context.authToken || args.auth);

                    case 2:
                      _context.next = 4;
                      return context.db.query("RETURN LENGTH(accounts)", {});

                    case 4:
                      result = _context.sent;
                      counts = result;
                      return _context.abrupt("return", counts.length > 0 ? counts[0] : 0);

                    case 7:
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
                      return context.auth.requireGrantedAccess(context.authToken || args.auth);

                    case 2:
                      _context3.next = 4;
                      return context.db.query("RETURN LENGTH(transactions)", {});

                    case 4:
                      result = _context3.sent;
                      counts = result;
                      return _context3.abrupt("return", counts.length > 0 ? counts[0] : 0);

                    case 7:
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
                      return context.auth.requireGrantedAccess(context.authToken || args.auth);

                    case 2:
                      _context5.next = 4;
                      return context.db.query("\n            LET d = 16777216\n            FOR a in accounts\n            LET b = TO_NUMBER(CONCAT(\"0x\", SUBSTRING(a.balance, 2)))\n            COLLECT AGGREGATE\n                hs = SUM(FLOOR(b / d)),\n                ls = SUM(b % (d - 1))\n            RETURN { hs, ls }\n        ", {});

                    case 4:
                      result = _context5.sent;
                      parts = result[0]; //$FlowFixMe

                      return _context5.abrupt("return", (BigInt(parts.hs) * BigInt(0x1000000) + BigInt(parts.ls)).toString());

                    case 7:
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
                        _context12.next = 3;
                        return context.auth.requireGrantedAccess(context.authToken || args.auth);

                      case 3:
                        _context12.prev = 3;

                        if (!(context.config.requests.mode === 'rest')) {
                          _context12.next = 9;
                          break;
                        }

                        _context12.next = 7;
                        return postRequestsUsingRest(requests, context, span);

                      case 7:
                        _context12.next = 11;
                        break;

                      case 9:
                        _context12.next = 11;
                        return postRequestsUsingKafka(requests, context, span);

                      case 11:
                        context.db.log.debug('postRequests', 'POSTED', args, context.remoteAddress);
                        _context12.next = 18;
                        break;

                      case 14:
                        _context12.prev = 14;
                        _context12.t0 = _context12["catch"](3);
                        context.db.log.debug('postRequests', 'FAILED', args, context.remoteAddress);
                        throw _context12.t0;

                      case 18:
                        return _context12.abrupt("return", requests.map(function (x) {
                          return x.id;
                        }));

                      case 19:
                      case "end":
                        return _context12.stop();
                    }
                  }
                }, _callee12, null, [[3, 14]]);
              }));

              return function (_x21) {
                return _ref9.apply(this, arguments);
              };
            }(), context.parentSpan));

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYXV0aFRva2VuIiwicXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwicG9zdFJlcXVlc3RzVXNpbmdSZXN0IiwicmVxdWVzdHMiLCJzcGFuIiwiY29uZmlnIiwidXJsIiwic2VydmVyIiwidG9waWMiLCJtZXRob2QiLCJtb2RlIiwiY2FjaGUiLCJjcmVkZW50aWFscyIsImhlYWRlcnMiLCJyZWRpcmVjdCIsInJlZmVycmVyIiwiYm9keSIsInN0cmluZ2lmeSIsInJlY29yZHMiLCJtYXAiLCJyZXF1ZXN0Iiwia2V5IiwiaWQiLCJ2YWx1ZSIsInJlc3BvbnNlIiwic3RhdHVzIiwidGV4dCIsIm1lc3NhZ2UiLCJFcnJvciIsInBvc3RSZXF1ZXN0c1VzaW5nS2Fma2EiLCJlbnN1cmVTaGFyZWQiLCJjcmVhdGVWYWx1ZSIsInNoYXJlZCIsImhhcyIsImdldCIsInNldCIsIkthZmthIiwiY2xpZW50SWQiLCJicm9rZXJzIiwia2Fma2EiLCJuZXdQcm9kdWNlciIsInByb2R1Y2VyIiwiY29ubmVjdCIsIm1lc3NhZ2VzIiwia2V5QnVmZmVyIiwiQnVmZmVyIiwiZnJvbSIsInRyYWNlQnVmZmVyIiwiaW5qZWN0IiwidHJhY2luZyIsIkZPUk1BVF9CSU5BUlkiLCJjb25jYXQiLCJzZW5kIiwicG9zdFJlcXVlc3RzIiwiXyIsInNldFRhZyIsImxvZyIsImRlYnVnIiwicmVtb3RlQWRkcmVzcyIsIngiLCJwYXJlbnRTcGFuIiwicmVzb2x2ZXJzQ3VzdG9tIiwiUXVlcnkiLCJNdXRhdGlvbiIsImF0dGFjaEN1c3RvbVJlc29sdmVycyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLFNBQVNBLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXNDO0FBQ2xDLFNBQU8seUJBQU9BLElBQVAsTUFBZ0IsUUFBaEIsSUFBNEJBLElBQUksS0FBSyxJQUE1QztBQUNIOztBQUVELFNBQVNDLGNBQVQsQ0FBd0JDLFFBQXhCLEVBQXVDQyxTQUF2QyxFQUF1RDtBQUNuREMsRUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWVGLFNBQWYsRUFBMEJHLE9BQTFCLENBQWtDLGdCQUEyQjtBQUFBO0FBQUEsUUFBekJDLElBQXlCO0FBQUEsUUFBbkJDLGFBQW1COztBQUN6RCxRQUFLRCxJQUFJLElBQUlMLFFBQVQsSUFBc0JILFFBQVEsQ0FBQ1MsYUFBRCxDQUE5QixJQUFpRFQsUUFBUSxDQUFDRyxRQUFRLENBQUNLLElBQUQsQ0FBVCxDQUE3RCxFQUErRTtBQUMzRU4sTUFBQUEsY0FBYyxDQUFDQyxRQUFRLENBQUNLLElBQUQsQ0FBVCxFQUFpQkMsYUFBakIsQ0FBZDtBQUNILEtBRkQsTUFFTztBQUNITixNQUFBQSxRQUFRLENBQUNLLElBQUQsQ0FBUixHQUFpQkMsYUFBakI7QUFDSDtBQUNKLEdBTkQ7QUFPSDs7QUFlRDtBQUVBLFNBQVNDLElBQVQsR0FBc0I7QUFDbEIsTUFB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QUFBO0FBQUE7QUFBQTtBQUFBLGlCQWVKeEMsT0FBTyxDQUFDOEUsVUFmSixDQVBYOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEc7Ozs7QUF5QkEsSUFBTUMsZUFBZSxHQUFHO0FBQ3BCQyxFQUFBQSxLQUFLLEVBQUU7QUFDSDdGLElBQUFBLElBQUksRUFBSkEsSUFERztBQUVIVSxJQUFBQSxnQkFBZ0IsRUFBaEJBLGdCQUZHO0FBR0hnQixJQUFBQSxvQkFBb0IsRUFBcEJBLG9CQUhHO0FBSUhDLElBQUFBLHVCQUF1QixFQUF2QkE7QUFKRyxHQURhO0FBT3BCbUUsRUFBQUEsUUFBUSxFQUFFO0FBQ05WLElBQUFBLFlBQVksRUFBWkE7QUFETTtBQVBVLENBQXhCOztBQVlPLFNBQVNXLHFCQUFULENBQStCdEcsUUFBL0IsRUFBbUQ7QUFDdERELEVBQUFBLGNBQWMsQ0FBQ0MsUUFBRCxFQUFXbUcsZUFBWCxDQUFkO0FBQ0EsU0FBT25HLFFBQVA7QUFDSCIsInNvdXJjZXNDb250ZW50IjpbIi8vIEBmbG93XG5cbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IEthZmthLCBQcm9kdWNlciB9IGZyb20gXCJrYWZrYWpzXCI7XG5pbXBvcnQgdHJhY2luZywgeyBTcGFuIH0gZnJvbSBcIm9wZW50cmFjaW5nXCI7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHR5cGUgeyBRQ29uZmlnIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBlbnN1cmVQcm90b2NvbCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5pbXBvcnQgUUF1dGggZnJvbSBcIi4vcS1hdXRoXCI7XG5pbXBvcnQgeyBRVHJhY2VyIH0gZnJvbSBcIi4vdHJhY2VyXCI7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHRlc3Q6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgdGVzdCA9PT0gJ29iamVjdCcgJiYgdGVzdCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWw6IGFueSwgb3ZlcnJpZGVzOiBhbnkpIHtcbiAgICBPYmplY3QuZW50cmllcyhvdmVycmlkZXMpLmZvckVhY2goKFtuYW1lLCBvdmVycmlkZVZhbHVlXSkgPT4ge1xuICAgICAgICBpZiAoKG5hbWUgaW4gb3JpZ2luYWwpICYmIGlzT2JqZWN0KG92ZXJyaWRlVmFsdWUpICYmIGlzT2JqZWN0KG9yaWdpbmFsW25hbWVdKSkge1xuICAgICAgICAgICAgb3ZlcnJpZGVPYmplY3Qob3JpZ2luYWxbbmFtZV0sIG92ZXJyaWRlVmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3JpZ2luYWxbbmFtZV0gPSBvdmVycmlkZVZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbnR5cGUgSW5mbyA9IHtcbiAgICB2ZXJzaW9uOiBzdHJpbmcsXG59XG5cbnR5cGUgUmVxdWVzdCA9IHtcbiAgICBpZDogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbn1cblxudHlwZSBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCA9IEdyYXBoUUxSZXF1ZXN0Q29udGV4dCAmIHtcbiAgICBkYjogQXJhbmdvLFxufVxuXG4vLyBRdWVyeVxuXG5mdW5jdGlvbiBpbmZvKCk6IEluZm8ge1xuICAgIGNvbnN0IHBrZyA9IEpTT04ucGFyc2UoKGZzLnJlYWRGaWxlU3luYyhwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4nLCAnLi4nLCAncGFja2FnZS5qc29uJykpOiBhbnkpKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiBwa2cudmVyc2lvbixcbiAgICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c0NvdW50KF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsICdnZXRBY2NvdW50c0NvdW50JywgYXN5bmMgKCkgPT4ge1xuICAgICAgICBhd2FpdCBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dC5hdXRoVG9rZW4gfHwgYXJncy5hdXRoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBSRVRVUk4gTEVOR1RIKGFjY291bnRzKWAsIHt9KTtcbiAgICAgICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgICAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xuICAgIH0sIFFUcmFjZXIuZ2V0UGFyZW50U3Bhbih0cmFjZXIsIGNvbnRleHQpKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRUcmFuc2FjdGlvbnNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0VHJhbnNhY3Rpb25zQ291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmF1dGhUb2tlbiB8fCBhcmdzLmF1dGgpO1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIucXVlcnkoYFJFVFVSTiBMRU5HVEgodHJhbnNhY3Rpb25zKWAsIHt9KTtcbiAgICAgICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgICAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xuICAgIH0sIFFUcmFjZXIuZ2V0UGFyZW50U3Bhbih0cmFjZXIsIGNvbnRleHQpKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBY2NvdW50c1RvdGFsQmFsYW5jZShfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8U3RyaW5nPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmF1dGhUb2tlbiB8fCBhcmdzLmF1dGgpO1xuICAgICAgICAvKlxuICAgICAgICBCZWNhdXNlIGFyYW5nbyBjYW4gbm90IHN1bSBCaWdJbnQncyB3ZSBuZWVkIHRvIHN1bSBzZXBhcmF0ZWx5OlxuICAgICAgICBocyA9IFNVTSBvZiBoaWdoIGJpdHMgKGZyb20gMjQtYml0IGFuZCBoaWdoZXIpXG4gICAgICAgIGxzID0gU1VNIG9mIGxvd2VyIDI0IGJpdHNcbiAgICAgICAgQW5kIHRoZSB0b3RhbCByZXN1bHQgaXMgKGhzIDw8IDI0KSArIGxzXG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCByZXN1bHQ6IGFueSA9IGF3YWl0IGNvbnRleHQuZGIucXVlcnkoYFxuICAgICAgICAgICAgTEVUIGQgPSAxNjc3NzIxNlxuICAgICAgICAgICAgRk9SIGEgaW4gYWNjb3VudHNcbiAgICAgICAgICAgIExFVCBiID0gVE9fTlVNQkVSKENPTkNBVChcIjB4XCIsIFNVQlNUUklORyhhLmJhbGFuY2UsIDIpKSlcbiAgICAgICAgICAgIENPTExFQ1QgQUdHUkVHQVRFXG4gICAgICAgICAgICAgICAgaHMgPSBTVU0oRkxPT1IoYiAvIGQpKSxcbiAgICAgICAgICAgICAgICBscyA9IFNVTShiICUgKGQgLSAxKSlcbiAgICAgICAgICAgIFJFVFVSTiB7IGhzLCBscyB9XG4gICAgICAgIGAsIHt9KTtcbiAgICAgICAgY29uc3QgcGFydHMgPSAocmVzdWx0OiB7IGhzOiBudW1iZXIsIGxzOiBudW1iZXIgfVtdKVswXTtcbiAgICAgICAgLy8kRmxvd0ZpeE1lXG4gICAgICAgIHJldHVybiAoQmlnSW50KHBhcnRzLmhzKSAqIEJpZ0ludCgweDEwMDAwMDApICsgQmlnSW50KHBhcnRzLmxzKSkudG9TdHJpbmcoKTtcbiAgICB9LCBRVHJhY2VyLmdldFBhcmVudFNwYW4odHJhY2VyLCBjb250ZXh0KSlcbn1cblxuLy8gTXV0YXRpb25cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdSZXN0KHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4LCBzcGFuOiBTcGFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY29uZmlnID0gY29udGV4dC5jb25maWcucmVxdWVzdHM7XG4gICAgY29uc3QgdXJsID0gYCR7ZW5zdXJlUHJvdG9jb2woY29uZmlnLnNlcnZlciwgJ2h0dHAnKX0vdG9waWNzLyR7Y29uZmlnLnRvcGljfWA7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgY2FjaGU6ICduby1jYWNoZScsXG4gICAgICAgIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICB9LFxuICAgICAgICByZWRpcmVjdDogJ2ZvbGxvdycsXG4gICAgICAgIHJlZmVycmVyOiAnbm8tcmVmZXJyZXInLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICByZWNvcmRzOiByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+ICh7XG4gICAgICAgICAgICAgICAga2V5OiByZXF1ZXN0LmlkLFxuICAgICAgICAgICAgICAgIHZhbHVlOiByZXF1ZXN0LmJvZHksXG4gICAgICAgICAgICB9KSksXG4gICAgICAgIH0pLFxuICAgIH0pO1xuICAgIGlmIChyZXNwb25zZS5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gYFBvc3QgcmVxdWVzdHMgZmFpbGVkOiAke2F3YWl0IHJlc3BvbnNlLnRleHQoKX1gO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzOiBSZXF1ZXN0W10sIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4LCBzcGFuOiBTcGFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZW5zdXJlU2hhcmVkID0gYXN5bmMgKG5hbWUsIGNyZWF0ZVZhbHVlOiAoKSA9PiBQcm9taXNlPGFueT4pID0+IHtcbiAgICAgICAgaWYgKGNvbnRleHQuc2hhcmVkLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnRleHQuc2hhcmVkLmdldChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGNyZWF0ZVZhbHVlKCk7XG4gICAgICAgIGNvbnRleHQuc2hhcmVkLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29uZmlnID0gY29udGV4dC5jb25maWcucmVxdWVzdHM7XG4gICAgY29uc3QgcHJvZHVjZXI6IFByb2R1Y2VyID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdwcm9kdWNlcicsIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qga2Fma2E6IEthZmthID0gYXdhaXQgZW5zdXJlU2hhcmVkKCdrYWZrYScsIGFzeW5jICgpID0+IG5ldyBLYWZrYSh7XG4gICAgICAgICAgICBjbGllbnRJZDogJ3Etc2VydmVyJyxcbiAgICAgICAgICAgIGJyb2tlcnM6IFtjb25maWcuc2VydmVyXVxuICAgICAgICB9KSk7XG4gICAgICAgIGNvbnN0IG5ld1Byb2R1Y2VyID0ga2Fma2EucHJvZHVjZXIoKTtcbiAgICAgICAgYXdhaXQgbmV3UHJvZHVjZXIuY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gbmV3UHJvZHVjZXI7XG5cbiAgICB9KTtcbiAgICBjb25zdCBtZXNzYWdlcyA9IHJlcXVlc3RzLm1hcCgocmVxdWVzdCkgPT4ge1xuICAgICAgICBjb25zdCBrZXlCdWZmZXIgPSBCdWZmZXIuZnJvbShyZXF1ZXN0LmlkLCAnYmFzZTY0Jyk7XG4gICAgICAgIGNvbnN0IHRyYWNlQnVmZmVyID0gQnVmZmVyLmZyb20oW10pO1xuICAgICAgICBjb250ZXh0LmRiLnRyYWNlci5pbmplY3Qoc3BhbiwgdHJhY2luZy5GT1JNQVRfQklOQVJZLCB0cmFjZUJ1ZmZlcik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IEJ1ZmZlci5jb25jYXQoW2tleUJ1ZmZlciwgdHJhY2VCdWZmZXJdKSxcbiAgICAgICAgICAgIHZhbHVlOiBCdWZmZXIuZnJvbShyZXF1ZXN0LmJvZHksICdiYXNlNjQnKSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICBhd2FpdCBwcm9kdWNlci5zZW5kKHtcbiAgICAgICAgdG9waWM6IGNvbmZpZy50b3BpYyxcbiAgICAgICAgbWVzc2FnZXMsXG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0cyhfLCBhcmdzOiB7IHJlcXVlc3RzOiBSZXF1ZXN0W10sIGF1dGg/OiBzdHJpbmcgfSwgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgY29uc3QgcmVxdWVzdHM6ID8oUmVxdWVzdFtdKSA9IGFyZ3MucmVxdWVzdHM7XG4gICAgaWYgKCFyZXF1ZXN0cykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCBcInBvc3RSZXF1ZXN0c1wiLCBhc3luYyAoc3BhbjogU3BhbikgPT4ge1xuICAgICAgICBzcGFuLnNldFRhZygncGFyYW1zJywgcmVxdWVzdHMpO1xuICAgICAgICBhd2FpdCBjb250ZXh0LmF1dGgucmVxdWlyZUdyYW50ZWRBY2Nlc3MoY29udGV4dC5hdXRoVG9rZW4gfHwgYXJncy5hdXRoKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cy5tb2RlID09PSAncmVzdCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHMsIGNvbnRleHQsIHNwYW4pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzLCBjb250ZXh0LCBzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnUE9TVEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnRkFJTEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0cy5tYXAoeCA9PiB4LmlkKTtcbiAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xufVxuXG5jb25zdCByZXNvbHZlcnNDdXN0b20gPSB7XG4gICAgUXVlcnk6IHtcbiAgICAgICAgaW5mbyxcbiAgICAgICAgZ2V0QWNjb3VudHNDb3VudCxcbiAgICAgICAgZ2V0VHJhbnNhY3Rpb25zQ291bnQsXG4gICAgICAgIGdldEFjY291bnRzVG90YWxCYWxhbmNlLFxuICAgIH0sXG4gICAgTXV0YXRpb246IHtcbiAgICAgICAgcG9zdFJlcXVlc3RzLFxuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzKG9yaWdpbmFsOiBhbnkpOiBhbnkge1xuICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsLCByZXNvbHZlcnNDdXN0b20pO1xuICAgIHJldHVybiBvcmlnaW5hbDtcbn1cbiJdfQ==