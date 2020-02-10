"use strict";

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

var _opentracing = require("opentracing");

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
                      return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

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
                      return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

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
                      return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

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

function postRequestsUsingRest(_x10, _x11) {
  return _postRequestsUsingRest.apply(this, arguments);
}

function _postRequestsUsingRest() {
  _postRequestsUsingRest = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee7(requests, context) {
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

function postRequestsUsingKafka(_x12, _x13, _x14) {
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

              return function ensureShared(_x24, _x25) {
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
              context.db.tracer.inject(span, _opentracing.FORMAT_BINARY, traceBuffer);
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

function postRequests(_x15, _x16, _x17) {
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
                        return context.auth.requireGrantedAccess(context.accessKey || args.accessKey);

                      case 3:
                        _context12.prev = 3;

                        if (!(context.config.requests.mode === 'rest')) {
                          _context12.next = 9;
                          break;
                        }

                        _context12.next = 7;
                        return postRequestsUsingRest(requests, context);

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

              return function (_x26) {
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

function registerAccessKeys(_x18, _x19, _x20) {
  return _registerAccessKeys.apply(this, arguments);
}

function _registerAccessKeys() {
  _registerAccessKeys = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee14(_, args, context) {
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            return _context14.abrupt("return", context.auth.registerAccessKeys(args.account || '', args.keys || [], args.signature || ''));

          case 1:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));
  return _registerAccessKeys.apply(this, arguments);
}

function revokeAccessKeys(_x21, _x22, _x23) {
  return _revokeAccessKeys.apply(this, arguments);
}

function _revokeAccessKeys() {
  _revokeAccessKeys = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee15(_, args, context) {
    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            return _context15.abrupt("return", context.auth.revokeAccessKeys(args.account || '', args.keys || [], args.signature || ''));

          case 1:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));
  return _revokeAccessKeys.apply(this, arguments);
}

var resolversCustom = {
  Query: {
    info: info,
    getAccountsCount: getAccountsCount,
    getTransactionsCount: getTransactionsCount,
    getAccountsTotalBalance: getAccountsTotalBalance
  },
  Mutation: {
    postRequests: postRequests,
    registerAccessKeys: registerAccessKeys,
    revokeAccessKeys: revokeAccessKeys
  }
};

function attachCustomResolvers(original) {
  overrideObject(original, resolversCustom);
  return original;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NlcnZlci9yZXNvbHZlcnMtY3VzdG9tLmpzIl0sIm5hbWVzIjpbImlzT2JqZWN0IiwidGVzdCIsIm92ZXJyaWRlT2JqZWN0Iiwib3JpZ2luYWwiLCJvdmVycmlkZXMiLCJPYmplY3QiLCJlbnRyaWVzIiwiZm9yRWFjaCIsIm5hbWUiLCJvdmVycmlkZVZhbHVlIiwiaW5mbyIsInBrZyIsIkpTT04iLCJwYXJzZSIsImZzIiwicmVhZEZpbGVTeW5jIiwicGF0aCIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJ2ZXJzaW9uIiwiZ2V0QWNjb3VudHNDb3VudCIsIl9wYXJlbnQiLCJhcmdzIiwiY29udGV4dCIsInRyYWNlciIsImRiIiwiUVRyYWNlciIsInRyYWNlIiwiYXV0aCIsInJlcXVpcmVHcmFudGVkQWNjZXNzIiwiYWNjZXNzS2V5IiwicXVlcnkiLCJyZXN1bHQiLCJjb3VudHMiLCJsZW5ndGgiLCJnZXRQYXJlbnRTcGFuIiwiZ2V0VHJhbnNhY3Rpb25zQ291bnQiLCJnZXRBY2NvdW50c1RvdGFsQmFsYW5jZSIsInBhcnRzIiwiQmlnSW50IiwiaHMiLCJscyIsInRvU3RyaW5nIiwicG9zdFJlcXVlc3RzVXNpbmdSZXN0IiwicmVxdWVzdHMiLCJjb25maWciLCJ1cmwiLCJzZXJ2ZXIiLCJ0b3BpYyIsIm1ldGhvZCIsIm1vZGUiLCJjYWNoZSIsImNyZWRlbnRpYWxzIiwiaGVhZGVycyIsInJlZGlyZWN0IiwicmVmZXJyZXIiLCJib2R5Iiwic3RyaW5naWZ5IiwicmVjb3JkcyIsIm1hcCIsInJlcXVlc3QiLCJrZXkiLCJpZCIsInZhbHVlIiwicmVzcG9uc2UiLCJzdGF0dXMiLCJ0ZXh0IiwibWVzc2FnZSIsIkVycm9yIiwicG9zdFJlcXVlc3RzVXNpbmdLYWZrYSIsInNwYW4iLCJlbnN1cmVTaGFyZWQiLCJjcmVhdGVWYWx1ZSIsInNoYXJlZCIsImhhcyIsImdldCIsInNldCIsIkthZmthIiwiY2xpZW50SWQiLCJicm9rZXJzIiwia2Fma2EiLCJuZXdQcm9kdWNlciIsInByb2R1Y2VyIiwiY29ubmVjdCIsIm1lc3NhZ2VzIiwia2V5QnVmZmVyIiwiQnVmZmVyIiwiZnJvbSIsInRyYWNlQnVmZmVyIiwiaW5qZWN0IiwiRk9STUFUX0JJTkFSWSIsImNvbmNhdCIsInNlbmQiLCJwb3N0UmVxdWVzdHMiLCJfIiwic2V0VGFnIiwibG9nIiwiZGVidWciLCJyZW1vdGVBZGRyZXNzIiwieCIsInBhcmVudFNwYW4iLCJyZWdpc3RlckFjY2Vzc0tleXMiLCJhY2NvdW50Iiwia2V5cyIsInNpZ25hdHVyZSIsInJldm9rZUFjY2Vzc0tleXMiLCJyZXNvbHZlcnNDdXN0b20iLCJRdWVyeSIsIk11dGF0aW9uIiwiYXR0YWNoQ3VzdG9tUmVzb2x2ZXJzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUNBOztBQUVBLFNBQVNBLFFBQVQsQ0FBa0JDLElBQWxCLEVBQXNDO0FBQ2xDLFNBQU8seUJBQU9BLElBQVAsTUFBZ0IsUUFBaEIsSUFBNEJBLElBQUksS0FBSyxJQUE1QztBQUNIOztBQUVELFNBQVNDLGNBQVQsQ0FBd0JDLFFBQXhCLEVBQXVDQyxTQUF2QyxFQUF1RDtBQUNuREMsRUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWVGLFNBQWYsRUFBMEJHLE9BQTFCLENBQWtDLGdCQUEyQjtBQUFBO0FBQUEsUUFBekJDLElBQXlCO0FBQUEsUUFBbkJDLGFBQW1COztBQUN6RCxRQUFLRCxJQUFJLElBQUlMLFFBQVQsSUFBc0JILFFBQVEsQ0FBQ1MsYUFBRCxDQUE5QixJQUFpRFQsUUFBUSxDQUFDRyxRQUFRLENBQUNLLElBQUQsQ0FBVCxDQUE3RCxFQUErRTtBQUMzRU4sTUFBQUEsY0FBYyxDQUFDQyxRQUFRLENBQUNLLElBQUQsQ0FBVCxFQUFpQkMsYUFBakIsQ0FBZDtBQUNILEtBRkQsTUFFTztBQUNITixNQUFBQSxRQUFRLENBQUNLLElBQUQsQ0FBUixHQUFpQkMsYUFBakI7QUFDSDtB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LGtCQUFrQixFQUFsQkEsa0JBRk07QUFHTkksSUFBQUEsZ0JBQWdCLEVBQWhCQTtBQUhNO0FBUFUsQ0FBeEI7O0FBY08sU0FBU0kscUJBQVQsQ0FBK0IxRyxRQUEvQixFQUFtRDtBQUN0REQsRUFBQUEsY0FBYyxDQUFDQyxRQUFELEVBQVd1RyxlQUFYLENBQWQ7QUFDQSxTQUFPdkcsUUFBUDtBQUNIIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQGZsb3dcblxuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgS2Fma2EsIFByb2R1Y2VyIH0gZnJvbSBcImthZmthanNcIjtcbmltcG9ydCB7IFNwYW4sIEZPUk1BVF9CSU5BUlkgfSBmcm9tICdvcGVudHJhY2luZyc7XG5pbXBvcnQgQXJhbmdvIGZyb20gXCIuL2FyYW5nb1wiO1xuaW1wb3J0IHR5cGUgeyBHcmFwaFFMUmVxdWVzdENvbnRleHQgfSBmcm9tIFwiLi9hcmFuZ28tY29sbGVjdGlvblwiO1xuaW1wb3J0IHsgZW5zdXJlUHJvdG9jb2wgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZldGNoIGZyb20gJ25vZGUtZmV0Y2gnO1xuaW1wb3J0IHsgUVRyYWNlciB9IGZyb20gXCIuL3RyYWNlclwiO1xuXG5mdW5jdGlvbiBpc09iamVjdCh0ZXN0OiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIHRlc3QgPT09ICdvYmplY3QnICYmIHRlc3QgIT09IG51bGw7XG59XG5cbmZ1bmN0aW9uIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsOiBhbnksIG92ZXJyaWRlczogYW55KSB7XG4gICAgT2JqZWN0LmVudHJpZXMob3ZlcnJpZGVzKS5mb3JFYWNoKChbbmFtZSwgb3ZlcnJpZGVWYWx1ZV0pID0+IHtcbiAgICAgICAgaWYgKChuYW1lIGluIG9yaWdpbmFsKSAmJiBpc09iamVjdChvdmVycmlkZVZhbHVlKSAmJiBpc09iamVjdChvcmlnaW5hbFtuYW1lXSkpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlT2JqZWN0KG9yaWdpbmFsW25hbWVdLCBvdmVycmlkZVZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9yaWdpbmFsW25hbWVdID0gb3ZlcnJpZGVWYWx1ZTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG50eXBlIEluZm8gPSB7XG4gICAgdmVyc2lvbjogc3RyaW5nLFxufVxuXG50eXBlIFJlcXVlc3QgPSB7XG4gICAgaWQ6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG59XG5cbnR5cGUgR3JhcGhRTFJlcXVlc3RDb250ZXh0RXggPSBHcmFwaFFMUmVxdWVzdENvbnRleHQgJiB7XG4gICAgZGI6IEFyYW5nbyxcbn1cblxuLy8gUXVlcnlcblxuZnVuY3Rpb24gaW5mbygpOiBJbmZvIHtcbiAgICBjb25zdCBwa2cgPSBKU09OLnBhcnNlKChmcy5yZWFkRmlsZVN5bmMocGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uJywgJy4uJywgJ3BhY2thZ2UuanNvbicpKTogYW55KSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdmVyc2lvbjogcGtnLnZlcnNpb24sXG4gICAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0QWNjb3VudHNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0QWNjb3VudHNDb3VudCcsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBSRVRVUk4gTEVOR1RIKGFjY291bnRzKWAsIHt9KTtcbiAgICAgICAgY29uc3QgY291bnRzID0gKHJlc3VsdDogbnVtYmVyW10pO1xuICAgICAgICByZXR1cm4gY291bnRzLmxlbmd0aCA+IDAgPyBjb3VudHNbMF0gOiAwO1xuICAgIH0sIFFUcmFjZXIuZ2V0UGFyZW50U3Bhbih0cmFjZXIsIGNvbnRleHQpKVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRUcmFuc2FjdGlvbnNDb3VudChfcGFyZW50LCBhcmdzLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgdHJhY2VyID0gY29udGV4dC5kYi50cmFjZXI7XG4gICAgcmV0dXJuIFFUcmFjZXIudHJhY2UodHJhY2VyLCAnZ2V0VHJhbnNhY3Rpb25zQ291bnQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IGNvbnRleHQuYXV0aC5yZXF1aXJlR3JhbnRlZEFjY2Vzcyhjb250ZXh0LmFjY2Vzc0tleSB8fCBhcmdzLmFjY2Vzc0tleSk7XG4gICAgICAgIGNvbnN0IHJlc3VsdDogYW55ID0gYXdhaXQgY29udGV4dC5kYi5xdWVyeShgUkVUVVJOIExFTkdUSCh0cmFuc2FjdGlvbnMpYCwge30pO1xuICAgICAgICBjb25zdCBjb3VudHMgPSAocmVzdWx0OiBudW1iZXJbXSk7XG4gICAgICAgIHJldHVybiBjb3VudHMubGVuZ3RoID4gMCA/IGNvdW50c1swXSA6IDA7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFjY291bnRzVG90YWxCYWxhbmNlKF9wYXJlbnQsIGFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxTdHJpbmc+IHtcbiAgICBjb25zdCB0cmFjZXIgPSBjb250ZXh0LmRiLnRyYWNlcjtcbiAgICByZXR1cm4gUVRyYWNlci50cmFjZSh0cmFjZXIsICdnZXRBY2NvdW50c1RvdGFsQmFsYW5jZScsIGFzeW5jICgpID0+IHtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgLypcbiAgICAgICAgQmVjYXVzZSBhcmFuZ28gY2FuIG5vdCBzdW0gQmlnSW50J3Mgd2UgbmVlZCB0byBzdW0gc2VwYXJhdGVseTpcbiAgICAgICAgaHMgPSBTVU0gb2YgaGlnaCBiaXRzIChmcm9tIDI0LWJpdCBhbmQgaGlnaGVyKVxuICAgICAgICBscyA9IFNVTSBvZiBsb3dlciAyNCBiaXRzXG4gICAgICAgIEFuZCB0aGUgdG90YWwgcmVzdWx0IGlzIChocyA8PCAyNCkgKyBsc1xuICAgICAgICAgKi9cbiAgICAgICAgY29uc3QgcmVzdWx0OiBhbnkgPSBhd2FpdCBjb250ZXh0LmRiLnF1ZXJ5KGBcbiAgICAgICAgICAgIExFVCBkID0gMTY3NzcyMTZcbiAgICAgICAgICAgIEZPUiBhIGluIGFjY291bnRzXG4gICAgICAgICAgICBMRVQgYiA9IFRPX05VTUJFUihDT05DQVQoXCIweFwiLCBTVUJTVFJJTkcoYS5iYWxhbmNlLCAyKSkpXG4gICAgICAgICAgICBDT0xMRUNUIEFHR1JFR0FURVxuICAgICAgICAgICAgICAgIGhzID0gU1VNKEZMT09SKGIgLyBkKSksXG4gICAgICAgICAgICAgICAgbHMgPSBTVU0oYiAlIChkIC0gMSkpXG4gICAgICAgICAgICBSRVRVUk4geyBocywgbHMgfVxuICAgICAgICBgLCB7fSk7XG4gICAgICAgIGNvbnN0IHBhcnRzID0gKHJlc3VsdDogeyBoczogbnVtYmVyLCBsczogbnVtYmVyIH1bXSlbMF07XG4gICAgICAgIC8vJEZsb3dGaXhNZVxuICAgICAgICByZXR1cm4gKEJpZ0ludChwYXJ0cy5ocykgKiBCaWdJbnQoMHgxMDAwMDAwKSArIEJpZ0ludChwYXJ0cy5scykpLnRvU3RyaW5nKCk7XG4gICAgfSwgUVRyYWNlci5nZXRQYXJlbnRTcGFuKHRyYWNlciwgY29udGV4dCkpXG59XG5cbi8vIE11dGF0aW9uXG5cbmFzeW5jIGZ1bmN0aW9uIHBvc3RSZXF1ZXN0c1VzaW5nUmVzdChyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHVybCA9IGAke2Vuc3VyZVByb3RvY29sKGNvbmZpZy5zZXJ2ZXIsICdodHRwJyl9L3RvcGljcy8ke2NvbmZpZy50b3BpY31gO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxuICAgICAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgfSxcbiAgICAgICAgcmVkaXJlY3Q6ICdmb2xsb3cnLFxuICAgICAgICByZWZlcnJlcjogJ25vLXJlZmVycmVyJyxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgcmVjb3JkczogcmVxdWVzdHMubWFwKChyZXF1ZXN0KSA9PiAoe1xuICAgICAgICAgICAgICAgIGtleTogcmVxdWVzdC5pZCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVxdWVzdC5ib2R5LFxuICAgICAgICAgICAgfSkpLFxuICAgICAgICB9KSxcbiAgICB9KTtcbiAgICBpZiAocmVzcG9uc2Uuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGBQb3N0IHJlcXVlc3RzIGZhaWxlZDogJHthd2FpdCByZXNwb25zZS50ZXh0KCl9YDtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzVXNpbmdLYWZrYShyZXF1ZXN0czogUmVxdWVzdFtdLCBjb250ZXh0OiBHcmFwaFFMUmVxdWVzdENvbnRleHRFeCwgc3BhbjogU3Bhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGVuc3VyZVNoYXJlZCA9IGFzeW5jIChuYW1lLCBjcmVhdGVWYWx1ZTogKCkgPT4gUHJvbWlzZTxhbnk+KSA9PiB7XG4gICAgICAgIGlmIChjb250ZXh0LnNoYXJlZC5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBjb250ZXh0LnNoYXJlZC5nZXQobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjcmVhdGVWYWx1ZSgpO1xuICAgICAgICBjb250ZXh0LnNoYXJlZC5zZXQobmFtZSwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbmZpZyA9IGNvbnRleHQuY29uZmlnLnJlcXVlc3RzO1xuICAgIGNvbnN0IHByb2R1Y2VyOiBQcm9kdWNlciA9IGF3YWl0IGVuc3VyZVNoYXJlZCgncHJvZHVjZXInLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGthZmthOiBLYWZrYSA9IGF3YWl0IGVuc3VyZVNoYXJlZCgna2Fma2EnLCBhc3luYyAoKSA9PiBuZXcgS2Fma2Eoe1xuICAgICAgICAgICAgY2xpZW50SWQ6ICdxLXNlcnZlcicsXG4gICAgICAgICAgICBicm9rZXJzOiBbY29uZmlnLnNlcnZlcl1cbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBuZXdQcm9kdWNlciA9IGthZmthLnByb2R1Y2VyKCk7XG4gICAgICAgIGF3YWl0IG5ld1Byb2R1Y2VyLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIG5ld1Byb2R1Y2VyO1xuXG4gICAgfSk7XG4gICAgY29uc3QgbWVzc2FnZXMgPSByZXF1ZXN0cy5tYXAoKHJlcXVlc3QpID0+IHtcbiAgICAgICAgY29uc3Qga2V5QnVmZmVyID0gQnVmZmVyLmZyb20ocmVxdWVzdC5pZCwgJ2Jhc2U2NCcpO1xuICAgICAgICBjb25zdCB0cmFjZUJ1ZmZlciA9IEJ1ZmZlci5mcm9tKFtdKTtcbiAgICAgICAgY29udGV4dC5kYi50cmFjZXIuaW5qZWN0KHNwYW4sIEZPUk1BVF9CSU5BUlksIHRyYWNlQnVmZmVyKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGtleTogQnVmZmVyLmNvbmNhdChba2V5QnVmZmVyLCB0cmFjZUJ1ZmZlcl0pLFxuICAgICAgICAgICAgdmFsdWU6IEJ1ZmZlci5mcm9tKHJlcXVlc3QuYm9keSwgJ2Jhc2U2NCcpLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIGF3YWl0IHByb2R1Y2VyLnNlbmQoe1xuICAgICAgICB0b3BpYzogY29uZmlnLnRvcGljLFxuICAgICAgICBtZXNzYWdlcyxcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcG9zdFJlcXVlc3RzKF8sIGFyZ3M6IHsgcmVxdWVzdHM6IFJlcXVlc3RbXSwgYWNjZXNzS2V5Pzogc3RyaW5nIH0sIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4KTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGNvbnN0IHJlcXVlc3RzOiA/KFJlcXVlc3RbXSkgPSBhcmdzLnJlcXVlc3RzO1xuICAgIGlmICghcmVxdWVzdHMpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRyYWNlciA9IGNvbnRleHQuZGIudHJhY2VyO1xuICAgIHJldHVybiBRVHJhY2VyLnRyYWNlKHRyYWNlciwgXCJwb3N0UmVxdWVzdHNcIiwgYXN5bmMgKHNwYW46IFNwYW4pID0+IHtcbiAgICAgICAgc3Bhbi5zZXRUYWcoJ3BhcmFtcycsIHJlcXVlc3RzKTtcbiAgICAgICAgYXdhaXQgY29udGV4dC5hdXRoLnJlcXVpcmVHcmFudGVkQWNjZXNzKGNvbnRleHQuYWNjZXNzS2V5IHx8IGFyZ3MuYWNjZXNzS2V5KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChjb250ZXh0LmNvbmZpZy5yZXF1ZXN0cy5tb2RlID09PSAncmVzdCcpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ1Jlc3QocmVxdWVzdHMsIGNvbnRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBwb3N0UmVxdWVzdHNVc2luZ0thZmthKHJlcXVlc3RzLCBjb250ZXh0LCBzcGFuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnUE9TVEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnRleHQuZGIubG9nLmRlYnVnKCdwb3N0UmVxdWVzdHMnLCAnRkFJTEVEJywgYXJncywgY29udGV4dC5yZW1vdGVBZGRyZXNzKTtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXF1ZXN0cy5tYXAoeCA9PiB4LmlkKTtcbiAgICB9LCBjb250ZXh0LnBhcmVudFNwYW4pO1xufVxuXG50eXBlIFJlZ2lzdHJhdGlvbkFyZ3MgPSB7XG4gICAgYWNjb3VudD86IHN0cmluZyxcbiAgICBrZXlzPzogc3RyaW5nW10sXG4gICAgc2lnbmF0dXJlPzogc3RyaW5nLFxufVxuXG5hc3luYyBmdW5jdGlvbiByZWdpc3RlckFjY2Vzc0tleXMoXywgYXJnczogUmVnaXN0cmF0aW9uQXJncywgY29udGV4dDogR3JhcGhRTFJlcXVlc3RDb250ZXh0RXgsKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICByZXR1cm4gY29udGV4dC5hdXRoLnJlZ2lzdGVyQWNjZXNzS2V5cyhhcmdzLmFjY291bnQgfHwgJycsIGFyZ3Mua2V5cyB8fCBbXSwgYXJncy5zaWduYXR1cmUgfHwgJycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXZva2VBY2Nlc3NLZXlzKF8sIGFyZ3M6IFJlZ2lzdHJhdGlvbkFyZ3MsIGNvbnRleHQ6IEdyYXBoUUxSZXF1ZXN0Q29udGV4dEV4LCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIGNvbnRleHQuYXV0aC5yZXZva2VBY2Nlc3NLZXlzKGFyZ3MuYWNjb3VudCB8fCAnJywgYXJncy5rZXlzIHx8IFtdLCBhcmdzLnNpZ25hdHVyZSB8fCAnJyk7XG59XG5cbmNvbnN0IHJlc29sdmVyc0N1c3RvbSA9IHtcbiAgICBRdWVyeToge1xuICAgICAgICBpbmZvLFxuICAgICAgICBnZXRBY2NvdW50c0NvdW50LFxuICAgICAgICBnZXRUcmFuc2FjdGlvbnNDb3VudCxcbiAgICAgICAgZ2V0QWNjb3VudHNUb3RhbEJhbGFuY2UsXG4gICAgfSxcbiAgICBNdXRhdGlvbjoge1xuICAgICAgICBwb3N0UmVxdWVzdHMsXG4gICAgICAgIHJlZ2lzdGVyQWNjZXNzS2V5cyxcbiAgICAgICAgcmV2b2tlQWNjZXNzS2V5cyxcbiAgICB9LFxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGF0dGFjaEN1c3RvbVJlc29sdmVycyhvcmlnaW5hbDogYW55KTogYW55IHtcbiAgICBvdmVycmlkZU9iamVjdChvcmlnaW5hbCwgcmVzb2x2ZXJzQ3VzdG9tKTtcbiAgICByZXR1cm4gb3JpZ2luYWw7XG59XG4iXX0=